import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const { id: exceptionId } = await params;
    const orgId = session.user.orgId;
    const userId = session.user.id;

    const exception = await prisma.exception.findUnique({
      where: { id: exceptionId },
    });

    if (!exception || exception.orgId !== orgId) {
      return NextResponse.json(
        { error: "Exception not found or access denied" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const content = (body.content || "").trim();

    if (!content) {
      return NextResponse.json(
        { error: "Comment content cannot be empty" },
        { status: 400 }
      );
    }

    const comment = await prisma.exceptionComment.create({
      data: {
        exceptionId,
        authorId: userId,
        content,
      },
      include: { author: true },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error("Error adding comment to exception:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
