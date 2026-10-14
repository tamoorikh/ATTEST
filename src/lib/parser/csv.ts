import { parseToPaise } from "../money";

export interface ParsedCsvRow {
  date: Date;
  description: string;
  counterparty?: string;
  ref?: string;
  debitPaise: number;
  creditPaise: number;
  runningBalancePaise?: number;
  raw: Record<string, string>;
}

export interface CsvParseResult {
  success: boolean;
  rows: ParsedCsvRow[];
  delimiter: string;
  headers: string[];
  columnMapping: Record<string, number>;
  error?: string;
  statedOpeningPaise?: number;
  statedClosingPaise?: number;
}

export function detectDelimiter(text: string): string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 10);
  const delimiters = [",", ";", "\t", "|"];
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0, "|": 0 };

  for (const line of lines) {
    for (const d of delimiters) {
      const match = line.split(d);
      if (match.length > 1) {
        counts[d] += match.length;
      }
    }
  }

  let best = ",";
  let max = -1;
  for (const d of delimiters) {
    if (counts[d] > max) {
      max = counts[d];
      best = d;
    }
  }
  return best;
}

export function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      if (inQuotes && line[i + 1] === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export function parseFlexibleDate(dateStr: string): Date {
  const clean = dateStr.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
    if (!isNaN(d.getTime())) return d;
  }

  const fallback = new Date(clean);
  if (!isNaN(fallback.getTime())) return fallback;

  throw new Error(`Unrecognized date format: "${dateStr}"`);
}

export function parseBankStatementCsv(
  csvContent: string,
  userMappingOverride?: Record<string, number>
): CsvParseResult {
  const delimiter = detectDelimiter(csvContent);
  const rawLines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (rawLines.length < 2) {
    return {
      success: false,
      rows: [],
      delimiter,
      headers: [],
      columnMapping: {},
      error: "CSV file is empty or missing data rows",
    };
  }

  // Find header line
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(rawLines.length, 10); i++) {
    const tokens = parseCsvLine(rawLines[i], delimiter).map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const hasDate = tokens.some((t) => t.includes("date") || t.includes("time") || t.includes("day"));
    const hasAmount = tokens.some(
      (t) =>
        t.includes("debit") ||
        t.includes("credit") ||
        t.includes("amount") ||
        t.includes("withdrawal") ||
        t.includes("deposit") ||
        t.includes("balance")
    );

    if (hasDate && hasAmount) {
      headerIndex = i;
      headers = parseCsvLine(rawLines[i], delimiter);
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0;
    headers = parseCsvLine(rawLines[0], delimiter);
  }

  // Map columns
  const mapping: Record<string, number> = userMappingOverride || {};

  if (!userMappingOverride) {
    headers.forEach((h, idx) => {
      const norm = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (norm.includes("date") || norm.includes("value") || norm.includes("txdate")) {
        if (mapping.date === undefined) mapping.date = idx;
      } else if (norm.includes("desc") || norm.includes("detail") || norm.includes("narrat") || norm.includes("partic")) {
        if (mapping.description === undefined) mapping.description = idx;
      } else if (norm.includes("debit") || norm.includes("withdrawal") || norm.includes("dr") || norm.includes("out")) {
        if (mapping.debit === undefined) mapping.debit = idx;
      } else if (norm.includes("credit") || norm.includes("deposit") || norm.includes("cr") || norm.includes("in")) {
        if (mapping.credit === undefined) mapping.credit = idx;
      } else if (norm.includes("balance") || norm.includes("bal")) {
        if (mapping.balance === undefined) mapping.balance = idx;
      } else if (norm.includes("ref") || norm.includes("chq") || norm.includes("cheque") || norm.includes("txn")) {
        if (mapping.ref === undefined) mapping.ref = idx;
      } else if (norm.includes("party") || norm.includes("counterparty") || norm.includes("payee")) {
        if (mapping.counterparty === undefined) mapping.counterparty = idx;
      }
    });
  }

  const rows: ParsedCsvRow[] = [];

  for (let i = headerIndex + 1; i < rawLines.length; i++) {
    const cells = parseCsvLine(rawLines[i], delimiter);
    if (cells.length < 2) continue;

    try {
      const rawDate = cells[mapping.date] || "";
      if (!rawDate) continue;
      const date = parseFlexibleDate(rawDate);

      const description = cells[mapping.description] || "Transaction";
      const counterparty = mapping.counterparty !== undefined ? cells[mapping.counterparty] : undefined;
      const ref = mapping.ref !== undefined ? cells[mapping.ref] : undefined;

      let debitPaise = 0;
      let creditPaise = 0;

      if (mapping.debit !== undefined && cells[mapping.debit]) {
        debitPaise = parseToPaise(cells[mapping.debit]);
      }
      if (mapping.credit !== undefined && cells[mapping.credit]) {
        creditPaise = parseToPaise(cells[mapping.credit]);
      }

      let runningBalancePaise: number | undefined = undefined;
      if (mapping.balance !== undefined && cells[mapping.balance]) {
        runningBalancePaise = parseToPaise(cells[mapping.balance]);
      }

      const rawRecord: Record<string, string> = {};
      headers.forEach((h, hIdx) => {
        rawRecord[h] = cells[hIdx] || "";
      });

      rows.push({
        date,
        description,
        counterparty,
        ref,
        debitPaise,
        creditPaise,
        runningBalancePaise,
        raw: rawRecord,
      });
    } catch (err) {
      // row parsing error skip or continue
    }
  }

  return {
    success: rows.length > 0,
    rows,
    delimiter,
    headers,
    columnMapping: mapping,
  };
}
