import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditEvent } from "@/lib/audit";
import { parseBankStatementCsv } from "@/lib/parser/csv";
import { parseBankStatementPdf } from "@/lib/parser/pdf";
import { validateAndNormalizeBankStatement } from "@/lib/validator/rules";
import { parseToPaise } from "@/lib/money";
import { storage } from "@/lib/storage";
import { createHash } from "crypto";
import path from "path";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = [".csv", ".pdf"];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const orgId = session.user.orgId;
    const actorId = session.user.id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "BANK_STATEMENT";
    const period = (formData.get("period") as string) || "2026-04";
    const tier = (formData.get("tier") as string) || "PRIMARY";
    const openingBalanceStr = formData.get("openingBalance") as string | null;
    const closingBalanceStr = formData.get("closingBalance") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum size limit of 15MB" },
        { status: 400 }
      );
    }

    const filename = file.name;
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type "${ext}". Allowed types: .csv, .pdf` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute cryptographic SHA-256 hash of file content
    const sha256 = createHash("sha256").update(buffer).digest("hex");

    // Check for duplicate file within this organization
    const existingDoc = await prisma.sourceDocument.findFirst({
      where: { orgId, sha256 },
    });

    if (existingDoc) {
      return NextResponse.json(
        {
          error: `This exact document has already been uploaded with SHA-256: ${sha256}. Duplicate uploads are prohibited to maintain audit chain integrity.`,
          existingDocumentId: existingDoc.id,
          sha256,
        },
        { status: 409 }
      );
    }

    // Persist file via unified storage adapter (Supabase private bucket or local fallback)
    const mimeType = file.type || (ext === ".csv" ? "text/csv" : "application/pdf");
    const uploadResult = await storage.uploadFile({
      orgId,
      filename,
      buffer,
      mimeType,
      sha256,
    });

    // Create SourceDocument row in database
    const doc = await prisma.sourceDocument.create({
      data: {
        orgId,
        filename,
        type,
        period,
        sha256,
        mime: mimeType,
        size: file.size,
        parseStatus: "PENDING",
        tier,
        uploadedById: actorId,
        storagePath: uploadResult.storagePath,
      },
    });

    // Ingestion Parsing & Normalization
    let parseResult: any = null;
    let validationResult: any = null;

    if (type === "BANK_STATEMENT") {
      let bankAccount = await prisma.bankAccount.findFirst({ where: { orgId } });
      const openingPaise = openingBalanceStr ? parseToPaise(openingBalanceStr) : (bankAccount?.openingBalancePaise ?? 80000000);

      if (ext === ".csv") {
        const textContent = buffer.toString("utf-8");
        const csvResult = parseBankStatementCsv(textContent);

        if (!csvResult.success || csvResult.rows.length === 0) {
          await prisma.sourceDocument.update({
            where: { id: doc.id },
            data: {
              parseStatus: "FAILED",
              metadataJson: JSON.stringify({ error: csvResult.error || "No valid rows extracted" }),
            },
          });

          return NextResponse.json(
            {
              success: false,
              document: doc,
              error: csvResult.error || "Failed to extract transaction rows from CSV.",
            },
            { status: 422 }
          );
        }

        // Determine closing balance: from input or last row's balance
        const lastRowBal = csvResult.rows[csvResult.rows.length - 1]?.runningBalancePaise;
        const closingPaise = closingBalanceStr
          ? parseToPaise(closingBalanceStr)
          : (lastRowBal ?? openingPaise);

        // Run validation rules R1 - R4
        validationResult = await validateAndNormalizeBankStatement({
          orgId,
          sourceDocumentId: doc.id,
          period,
          openingBalancePaise: openingPaise,
          closingBalancePaise: closingPaise,
          parsedRows: csvResult.rows,
          bankAccountId: bankAccount?.id,
          actorId,
        });

        await prisma.sourceDocument.update({
          where: { id: doc.id },
          data: {
            parseStatus: "PARSED",
            metadataJson: JSON.stringify({
              rowsCount: csvResult.rows.length,
              delimiter: csvResult.delimiter,
              validationRunId: validationResult.runId,
            }),
          },
        });

        parseResult = {
          format: "CSV",
          rowsCount: csvResult.rows.length,
          validation: validationResult,
        };
      } else if (ext === ".pdf") {
        const pdfResult = await parseBankStatementPdf(buffer);

        if (pdfResult.parseStatus === "NEEDS_OCR") {
          await prisma.sourceDocument.update({
            where: { id: doc.id },
            data: {
              parseStatus: "NEEDS_OCR",
              metadataJson: JSON.stringify({ message: pdfResult.message, textLength: pdfResult.textLength }),
            },
          });

          return NextResponse.json({
            success: true,
            document: { ...doc, parseStatus: "NEEDS_OCR" },
            parseStatus: "NEEDS_OCR",
            message: pdfResult.message,
            rowsExtracted: 0,
          });
        }

        if (!pdfResult.success || pdfResult.rows.length === 0) {
          await prisma.sourceDocument.update({
            where: { id: doc.id },
            data: {
              parseStatus: "FAILED",
              metadataJson: JSON.stringify({ error: pdfResult.message }),
            },
          });

          return NextResponse.json(
            { success: false, document: doc, error: pdfResult.message },
            { status: 422 }
          );
        }

        // Validate digital PDF transactions
        const closingPaise = closingBalanceStr ? parseToPaise(closingBalanceStr) : openingPaise;
        validationResult = await validateAndNormalizeBankStatement({
          orgId,
          sourceDocumentId: doc.id,
          period,
          openingBalancePaise: openingPaise,
          closingBalancePaise: closingPaise,
          parsedRows: pdfResult.rows,
          bankAccountId: bankAccount?.id,
          actorId,
        });

        await prisma.sourceDocument.update({
          where: { id: doc.id },
          data: {
            parseStatus: "PARSED",
            metadataJson: JSON.stringify({ rowsCount: pdfResult.rows.length }),
          },
        });

        parseResult = {
          format: "PDF",
          rowsCount: pdfResult.rows.length,
          validation: validationResult,
        };
      }
    } else if (type === "LEDGER") {
      // General Ledger CSV ingestion
      const textContent = buffer.toString("utf-8");
      const csvResult = parseBankStatementCsv(textContent);

      if (csvResult.rows.length > 0) {
        for (const row of csvResult.rows) {
          await prisma.ledgerEntry.create({
            data: {
              orgId,
              sourceDocumentId: doc.id,
              date: row.date,
              description: row.description,
              counterparty: row.counterparty,
              debitPaise: row.debitPaise,
              creditPaise: row.creditPaise,
              account: row.raw?.Account || row.raw?.account || "General Ledger Account",
              ref: row.ref,
            },
          });
        }
      }

      await prisma.sourceDocument.update({
        where: { id: doc.id },
        data: {
          parseStatus: "PARSED",
          metadataJson: JSON.stringify({ rowsCount: csvResult.rows.length }),
        },
      });

      parseResult = { format: "CSV_LEDGER", rowsCount: csvResult.rows.length };
    } else {
      // General Corroborating Document
      await prisma.sourceDocument.update({
        where: { id: doc.id },
        data: { parseStatus: "PARSED" },
      });
      parseResult = { format: ext.toUpperCase(), status: "STORED" };
    }

    // Append upload audit event
    await appendAuditEvent({
      orgId,
      actorId,
      action: "SOURCE_DOCUMENT_UPLOADED",
      entityType: "SourceDocument",
      entityId: doc.id,
      metadata: {
        filename,
        sha256,
        size: file.size,
        type,
        parseStatus: doc.parseStatus,
      },
    });

    return NextResponse.json({
      success: true,
      document: doc,
      parseResult,
      validationResult,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error during document processing", details: error.message },
      { status: 500 }
    );
  }
}
