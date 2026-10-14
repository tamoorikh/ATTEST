import { PDFParse } from "pdf-parse";
import { ParsedCsvRow } from "./csv";
import { parseToPaise } from "../money";

export interface PdfParseResult {
  success: boolean;
  parseStatus: "PARSED" | "NEEDS_OCR" | "FAILED";
  message: string;
  rows: ParsedCsvRow[];
  textLength: number;
}

export async function parseBankStatementPdf(buffer: Buffer): Promise<PdfParseResult> {
  try {
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    const rawText = data.text ? data.text.trim() : "";

    // If scanned PDF or insufficient text extracted (under 50 chars or no tabular content)
    if (rawText.length < 50) {
      return {
        success: false,
        parseStatus: "NEEDS_OCR",
        message: "scanned PDF requires OCR — not available in MVP; upload the CSV from your bank.",
        rows: [],
        textLength: rawText.length,
      };
    }

    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const candidateRows: ParsedCsvRow[] = [];

    // Attempt table detection in extracted PDF text
    // Look for lines starting with dates (YYYY-MM-DD or DD/MM/YYYY) followed by numbers
    const dateRegex = /^(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/;

    for (const line of lines) {
      if (dateRegex.test(line)) {
        // Line has a date
        const parts = line.split(/\s{2,}|\t/);
        if (parts.length >= 3) {
          try {
            const rawDate = parts[0];
            const date = new Date(rawDate);
            const desc = parts[1];
            // Look for monetary amounts in remaining parts
            const amounts = parts.slice(2).filter((p) => /[\d,]+\.\d{2}/.test(p));
            if (amounts.length >= 1) {
              const amountPaise = parseToPaise(amounts[0]);
              candidateRows.push({
                date,
                description: desc,
                debitPaise: amountPaise > 0 ? amountPaise : 0,
                creditPaise: 0,
                raw: { line },
              });
            }
          } catch (e) {
            // skip unparseable line
          }
        }
      }
    }

    // If text was extracted but no tabular rows could be reliably extracted
    if (candidateRows.length === 0) {
      return {
        success: false,
        parseStatus: "NEEDS_OCR",
        message: "scanned PDF requires OCR — not available in MVP; upload the CSV from your bank.",
        rows: [],
        textLength: rawText.length,
      };
    }

    return {
      success: true,
      parseStatus: "PARSED",
      message: `Successfully extracted ${candidateRows.length} transactions from digital PDF`,
      rows: candidateRows,
      textLength: rawText.length,
    };
  } catch (error: any) {
    return {
      success: false,
      parseStatus: "NEEDS_OCR",
      message: "scanned PDF requires OCR — not available in MVP; upload the CSV from your bank.",
      rows: [],
      textLength: 0,
    };
  }
}
