import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditEvent } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { category, reason } = body;

    if (!category || typeof category !== "string" || category.trim().length === 0) {
      return NextResponse.json({ error: "New category is required" }, { status: 400 });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "A mandatory justification reason (at least 5 characters) is required to override transaction category" },
        { status: 400 }
      );
    }

    const tx = await prisma.bankTransaction.findUnique({
      where: { id },
    });

    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Tenant boundary verification
    if (tx.orgId !== session.user.orgId) {
      return NextResponse.json({ error: "Tenant boundary violation" }, { status: 403 });
    }

    const oldCategory = tx.category || "Uncategorized";
    const originalCategory = tx.originalCategory || oldCategory;

    const updated = await prisma.bankTransaction.update({
      where: { id },
      data: {
        category: category.trim(),
        originalCategory,
        overrideReason: reason.trim(),
      },
    });

    // Write immutable AuditEvent
    await appendAuditEvent({
      orgId: session.user.orgId,
      actorId: session.user.id,
      action: "TRANSACTION_CATEGORY_OVERRIDDEN",
      entityType: "BankTransaction",
      entityId: tx.id,
      metadata: {
        oldCategory,
        newCategory: category.trim(),
        originalCategory,
        reason: reason.trim(),
        txDescription: tx.description,
        txDate: tx.date.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      transaction: updated,
      message: "Category updated and recorded in audit hash chain",
    });
  } catch (error: any) {
    console.error("Category override error:", error);
    return NextResponse.json(
      { error: "Internal server error updating category" },
      { status: 500 }
    );
  }
}
