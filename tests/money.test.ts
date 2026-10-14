import { describe, it, expect } from "vitest";
import { formatPaise, parseToPaise } from "@/lib/money";

describe("Money Rule Compliance (Minor Units / Paisa)", () => {
  it("formats integer paise accurately without floating point distortion", () => {
    // 4,862,000 paise = PKR 48,620.00
    expect(formatPaise(4862000)).toBe("PKR 48,620.00");

    // 12,400,000 paise = PKR 124,000.00
    expect(formatPaise(12400000)).toBe("PKR 124,000.00");

    // 960,000 paise = PKR 9,600.00
    expect(formatPaise(960000)).toBe("PKR 9,600.00");

    // 0 paise
    expect(formatPaise(0)).toBe("PKR 0.00");
  });

  it("handles negative paise correctly", () => {
    expect(formatPaise(-1185000)).toBe("-PKR 11,850.00");
  });

  it("strictly rejects floating point money values to prevent precision loss", () => {
    expect(() => formatPaise(48620.5)).toThrow(TypeError);
    expect(() => formatPaise(124000.001)).toThrow(TypeError);
  });

  it("parses user input strings into integer minor units (paise)", () => {
    expect(parseToPaise("48620.00")).toBe(4862000);
    expect(parseToPaise("124,000.00")).toBe(12400000);
    expect(parseToPaise("12,400.00")).toBe(1240000);
    expect(parseToPaise("11850")).toBe(1185000);
    expect(parseToPaise("0.50")).toBe(50);
  });
});
