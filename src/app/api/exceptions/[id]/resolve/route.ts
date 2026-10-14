import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditEvent } from "@/lib/audit";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";

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

    // Parse request body
    const body = await req.json();

    // Sacred Authority Rule Enforcement:
    // Client roles can NEVER resolve an exception directly.
    if (body.status === "RESOLVED" || body.action === "RESOLVE") {
      if (userRole !== "CA-reviewer" && userRole !== "PlatformAdmin") {
        return NextResponse.json(
          {
            error:
              "Client roles cannot resolve exceptions. Sacred Authority Rule: Only licensed CA-reviewers may approve resolutions.",
          },
          { status: 403 }
        );
      }
    }

    // Verify exception exists and belongs to current tenant
    const exception = await prisma.exception.findUnique({
      where: { id: exceptionId },
      include: { bankTx: true, ledgerEntry: true },
    });

    if (!exception || exception.orgId !== orgId) {
      return NextResponse.json(
        { error: "Exception not found or access denied" },
        { status: 404 }
      );
    }

    // Validation: explanation minimum 20 chars
    const explanation = (body.explanation || "").trim();
    if (explanation.length < 20) {
      return NextResponse.json(
        { error: "Written explanation must be at least 20 characters long." },
        { status: 400 }
      );
    }

    // Validation: declaration checkbox must be accepted
    if (!body.declarationAccepted) {
      return NextResponse.json(
        { error: "You must accept the declaration of accuracy and authorization." },
        { status: 400 }
      );
    }

    const resolutionType = body.resolutionType || "MISSING_EVIDENCE";

    // Handle evidence attachments
    let evidenceCreated = null;
    if (body.evidence) {
      const ev = body.evidence;

      if (ev.type === "UPLOAD" && ev.filename && ev.content) {
        // Vault file upload
        const buffer = Buffer.from(ev.content, "base64");
        const sha256 = createHash("sha256").update(buffer).digest("hex");

        const uploadsDir = path.join(process.cwd(), "uploads", "evidence");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const storagePath = path.join("uploads", "evidence", `${Date.now()}-${ev.filename}`);
        fs.writeFileSync(path.join(process.cwd(), storagePath), buffer);

        // Store in SourceDocument vault
        const sourceDoc = await prisma.sourceDocument.create({
          data: {
            orgId,
            filename: ev.filename,
            type: "EVIDENCE_ATTACHMENT",
            period: exception.period,
            sha256,
            mime: ev.mime || "application/pdf",
            size: buffer.length,
            parseStatus: "PARSED",
            tier: "CORROBORATING",
            uploadedById: userId,
            storagePath,
          },
        });

        // Link in ExceptionEvidence
        evidenceCreated = await prisma.exceptionEvidence.create({
          data: {
            exceptionId,
            uploadedById: userId,
            filename: ev.filename,
            sha256,
            sourceDocumentId: sourceDoc.id,
            notes: explanation,
          },
        });
      } else if (ev.type === "LINK_VAULT" && ev.sourceDocumentId) {
        // Link existing SourceDocument from vault
        const doc = await prisma.sourceDocument.findUnique({
          where: { id: ev.sourceDocumentId },
        });

        if (doc && doc.orgId === orgId) {
          evidenceCreated = await prisma.exceptionEvidence.create({
            data: {
              exceptionId,
              uploadedById: userId,
              filename: doc.filename,
              sha256: doc.sha256,
              sourceDocumentId: doc.id,
              notes: explanation,
            },
          });
        }
      } else if (ev.type === "LINK_LEDGER_INVOICE") {
        // E-102 shape: Link invoice or adjusting entry
        const invNum = ev.linkedInvoiceNum || "SI-2026-3387";
        const dummySha = createHash("sha256")
          .update(`INVOICE_LINK:${invNum}:${Date.now()}`)
          .digest("hex");

        evidenceCreated = await prisma.exceptionEvidence.create({
          data: {
            exceptionId,
            uploadedById: userId,
            filename: `FBR_Sales_Invoice_${invNum}.pdf`,
            sha256: dummySha,
            linkedLedgerId: ev.linkedLedgerId || null,
            linkedInvoiceNum: invNum,
            notes: explanation,
          },
        });
      }
    }

    // Update exception status to CLIENT_SUBMITTED
    const updatedException = await prisma.exception.update({
      where: { id: exceptionId },
      data: {
        status: "CLIENT_SUBMITTED",
        resolutionType,
        resolutionNotes: explanation,
        declarationAccepted: true,
        rejectionReason: null, // Clear past rejection note for new submission round
      },
    });

    // Record submission comment
    await prisma.exceptionComment.create({
      data: {
        exceptionId,
        authorId: userId,
        content: `[Resolution Submission]: ${explanation}`,
      },
    });

    // Append cryptographic audit event
    await appendAuditEvent({
      orgId,
      actorId: userId,
      action: "EXCEPTION_RESOLUTION_SUBMITTED",
      entityType: "Exception",
      entityId: exceptionId,
      metadata: {
        exceptionTitle: exception.title,
        resolutionType,
        evidenceCount: evidenceCreated ? 1 : 0,
        submissionLength: explanation.length,
      },
    });

    // Notify assigned CA Reviewer(s)
    const caMembers = await prisma.membership.findMany({
      where: { orgId, role: "CA-reviewer" },
      include: { user: true },
    });

    for (const ca of caMembers) {
      await prisma.notification.create({
        data: {
          orgId,
          userId: ca.userId,
          title: "Resolution Submitted",
          message: `${session.user.name || "Client"} submitted resolution for ${exception.title}`,
          type: "INFO",
          link: `/ca/exceptions/${exceptionId}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      exception: updatedException,
      evidence: evidenceCreated,
    });
  } catch (error: any) {
    console.error("Error submitting exception resolution:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
