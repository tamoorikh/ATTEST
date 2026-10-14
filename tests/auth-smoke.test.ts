import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { requireRole, CLIENT_ROLES, CA_ROLES, RoleAuthorizationError } from "@/lib/tenant";

describe("Auth Smoke & RBAC Verification", () => {
  it("verifies bcrypt password hashing functionality", async () => {
    const rawPassword = "Demo1234!";
    const hash = await bcrypt.hash(rawPassword, 10);

    const isMatch = await bcrypt.compare(rawPassword, hash);
    const isWrongMatch = await bcrypt.compare("WrongPassword", hash);

    expect(isMatch).toBe(true);
    expect(isWrongMatch).toBe(false);
  });

  it("permits authorized roles and rejects unauthorized roles", () => {
    expect(() => requireRole("Owner", CLIENT_ROLES)).not.toThrow();
    expect(() => requireRole("FinanceManager", CLIENT_ROLES)).not.toThrow();
    expect(() => requireRole("Accountant", CLIENT_ROLES)).not.toThrow();

    expect(() => requireRole("CA-reviewer", CLIENT_ROLES)).toThrow(RoleAuthorizationError);
    expect(() => requireRole("CA-reviewer", CA_ROLES)).not.toThrow();
    expect(() => requireRole("Owner", CA_ROLES)).toThrow(RoleAuthorizationError);
  });
});
