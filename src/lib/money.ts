/**
 * MONEY UTILITIES — Strictly enforces integer minor units (paisa)
 * 1 PKR = 100 paisa
 * Never float for money.
 */

export function formatPaise(
  paise: number,
  options?: {
    currency?: string;
    showSymbol?: boolean;
    locale?: string;
  }
): string {
  const { currency = "PKR", showSymbol = true, locale = "en-PK" } = options || {};

  // Integer verification
  if (!Number.isInteger(paise)) {
    throw new TypeError(`Money rule violated: expected integer paisa, received ${paise}`);
  }

  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const major = Math.floor(absPaise / 100);
  const minor = absPaise % 100;

  const formattedMajor = major.toLocaleString(locale);
  const formattedMinor = minor.toString().padStart(2, "0");
  const sign = isNegative ? "-" : "";

  if (!showSymbol) {
    return `${sign}${formattedMajor}.${formattedMinor}`;
  }

  return `${sign}${currency} ${formattedMajor}.${formattedMinor}`;
}

/**
 * Parses user input string (e.g. "12400.50" or "12,400.50") into integer minor units (paisa).
 */
export function parseToPaise(input: string): number {
  const sanitized = input.replace(/,/g, "").trim();
  if (!sanitized) return 0;

  const parts = sanitized.split(".");
  if (parts.length > 2) {
    throw new Error(`Invalid monetary amount format: "${input}"`);
  }

  const majorPart = parseInt(parts[0], 10);
  if (isNaN(majorPart)) {
    throw new Error(`Invalid monetary amount: "${input}"`);
  }

  let minorPart = 0;
  if (parts.length === 2) {
    const rawMinor = parts[1].padEnd(2, "0").slice(0, 2);
    minorPart = parseInt(rawMinor, 10);
    if (isNaN(minorPart)) {
      throw new Error(`Invalid cents/paisa amount: "${input}"`);
    }
  }

  const sign = sanitized.startsWith("-") ? -1 : 1;
  const absMajor = Math.abs(majorPart);
  return sign * (absMajor * 100 + minorPart);
}
