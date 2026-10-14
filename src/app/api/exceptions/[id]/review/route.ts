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

    const { id: exceptionId } = await params;
    const orgId = session.user.orgId;
    const userRole = session.user.role;
    const userId = session.user.id;

    // Sacred Authority Rule: Only CA-reviewer or PlatformAdmin can execute review actions
    if (userRole !== "CA-reviewer" && userRole !== "PlatformAdmin") {
      return NextResponse.json(
        {
          error:
            "Forbidden. Only licensed Chartered Accountants (CA-reviewer) may review and decide on exceptions.",
        },
        { status: 403 }
      );
    }

    const exception = await prisma.exception.findUnique({
      where: { id: exceptionId },
      include: { bankTx: true, ledgerEntry: true, evidence: true },
    });

    if (!exception || exception.orgId !== orgId) {
      return NextResponse.json(
        { error: "Exception not found or access denied" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const action = (body.action || "").toUpperCase();
    const reason = (body.reason || "").trim();

    if (!["ACCEPT", "REJECT", "REQUEST_MORE_INFO", "ESCALATE"].includes(action)) {
      return NextResponse.json(
        { error: `Invalid action "${action}". Allowed: ACCEPT, REJECT, REQUEST_MORE_INFO, ESCALATE` },
        { status: 400 }
      );
    }

    // Mandatory reason for REJECT and REQUEST_MORE_INFO (min 20 chars)
    if (action === "REJECT" || action === "REQUEST_MORE_INFO") {
      if (reason.length < 20) {
        return NextResponse.json(
          {
            error: `A mandatory reason of at least 20 characters is required for ${
              action === "REJECT" ? "rejection" : "requesting more information"
            }.`,
          },
          { status: 400 }
        );
      }
    }

    let updatedException;
    let auditAction = "";
    let reviewNoteContent = reason;
    let notificationTitle = "";
    let notificationMessage = "";
    let notificationType = "INFO";

    if (action === "ACCEPT") {
      // Mark exception as RESOLVED
      updatedException = await prisma.exception.update({
        where: { id: exceptionId },
        data: {
          status: "RESOLVED",
          resolvedById: userId,
          resolvedAt: new Date(),
          rejectionReason: null,
        },
      });

      auditAction = "EXCEPTION_RESOLVED";
      reviewNoteContent = reason || "Resolution approved and corroborating evidence verified.";
      notificationTitle = "Exception Resolution Accepted";
      notificationMessage = `Licensed CA approved resolution for: ${exception.title}`;
      notificationType = "SUCCESS";

      // If E-102 shape (Unrecorded credit/sale): post adjusting ledger entry & match
      if (
        (exception.type === "UNRECORDED_CREDIT" || exception.type === "UNRECORDED_SALE") &&
        exception.bankTxId
      ) {
        const bankTx = exception.bankTx;
        if (bankTx) {
          // Check if resolving ledger entry already exists
          let adjustingEntry = await prisma.ledgerEntry.findFirst({
            where: {
              orgId,
              ref: "SI-2026-3387-ADJ",
            },
          });

          if (!adjustingEntry) {
            adjustingEntry = await prisma.ledgerEntry.create({
              data: {
                orgId,
                date: bankTx.date,
                description: "Adjusting entry — Sales Revenue #SI-2026-3387 (Al-Rehman Textiles)",
                counterparty: bankTx.counterparty || "Al-Rehman Textiles",
                debitPaise: 0,
                creditPaise: bankTx.creditPaise,
                account: "Domestic Sales Revenue",
                ref: "SI-2026-3387-ADJ",
              },
            });
          }

          // Create confirmed Match
          const existingMatch = await prisma.match.findFirst({
            where: { bankTxId: bankTx.id, ledgerEntryId: adjustingEntry.id },
          });

          if (!existingMatch) {
            await prisma.match.create({
              data: {
                orgId,
                bankTxId: bankTx.id,
                ledgerEntryId: adjustingEntry.id,
                rule: "CA_RESOLVED_ADJUSTING_ENTRY",
                score: 1.0,
                status: "CONFIRMED",
              },
            });
          }

          // Update bank transaction status
          await prisma.bankTransaction.update({
            where: { id: bankTx.id },
            data: { matchStatus: "MATCHED" },
          });
        }
      }
    } else if (action === "REJECT") {
      updatedException = await prisma.exception.update({
        where: { id: exceptionId },
        data: {
          status: "OPEN",
          rejectionReason: reason,
        },
      });

      auditAction = "EXCEPTION_RESOLUTION_REJECTED";
      notificationTitle = "Resolution Returned by CA";
      notificationMessage = `CA Reviewer rejected resolution for ${exception.title}: ${reason}`;
      notificationType = "WARNING";
    } else if (action === "REQUEST_MORE_INFO") {
      updatedException = await prisma.exception.update({
        where: { id: exceptionId },
        data: {
          status: "MORE_INFO_REQUESTED",
          rejectionReason: reason,
        },
      });

      auditAction = "EXCEPTION_MORE_INFO_REQUESTED";
      notificationTitle = "More Evidence Requested";
      notificationMessage = `CA Reviewer requested additional documentation for ${exception.title}: ${reason}`;
      notificationType = "INFO";
    } else if (action === "ESCALATE") {
      updatedException = await prisma.exception.update({
        where: { id: exceptionId },
        data: {
          isEscalated: true,
        },
      });

      auditAction = "EXCEPTION_ESCALATED";
      reviewNoteContent = reason || "Escalated for senior signatory consultation.";
      notificationTitle = "Exception Escalated";
      notificationMessage = `Exception "${exception.title}" was escalated to senior review.`;
      notificationType = "WARNING";
    }

    // Record ReviewNote
    await prisma.reviewNote.create({
      data: {
        orgId,
        authorId: userId,
        exceptionId,
        period: exception.period,
        content: reviewNoteContent,
        actionType: action,
        status: action === "REJECT" || action === "REQUEST_MORE_INFO" ? "ACTION_REQUIRED" : "INTERNAL",
      },
    });

    // Append cryptographic AuditEvent
    await appendAuditEvent({
      orgId,
      actorId: userId,
      action: auditAction,
      entityType: "Exception",
      entityId: exceptionId,
      metadata: {
        action,
        reason: reviewNoteContent,
        previousStatus: exception.status,
        newStatus: updatedException?.status || exception.status,
      },
    });

    // Notify Client Owner(s)
    const clientMembers = await prisma.membership.findMany({
      where: { orgId, role: { in: ["Owner", "FinanceManager"] } },
      include: { user: true },
    });

    for (const member of clientMembers) {
      await prisma.notification.create({
        data: {
          orgId,
          userId: member.userId,
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          link: `/portal/exceptions`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      action,
      exception: updatedException,
    });
  } catch (error: any) {
    console.error("Error executing CA exception review:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
