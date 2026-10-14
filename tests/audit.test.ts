import { describe, it, expect } from "vitest";
import { computeAuditHash } from "@/lib/audit";

describe("Cryptographic Audit Chain Integrity", () => {
  it("computes deterministic SHA-256 hash for audit events", () => {
    const prevHash = "GENESIS";
    const actorId = "user_123";
    const action = "TRANSACTION_IMPORTED";
    const entityType = "BankTransaction";
    const entityId = "tx_456";
    const timestamp = "2026-04-02T10:00:00.000Z";

    const hash1 = computeAuditHash(prevHash, actorId, action, entityType, entityId, timestamp);
    const hash2 = computeAuditHash(prevHash, actorId, action, entityType, entityId, timestamp);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string
  });

  it("detects any modification or tampering in the event chain", () => {
    const prevHash = "GENESIS";
    const timestamp = "2026-04-02T10:00:00.000Z";

    const originalHash = computeAuditHash(
      prevHash,
      "user_123",
      "ORGANIZATION_CREATED",
      "Organization",
      "org_1",
      timestamp
    );

    // Tampered actor
    const tamperedActorHash = computeAuditHash(
      prevHash,
      "attacker_999",
      "ORGANIZATION_CREATED",
      "Organization",
      "org_1",
      timestamp
    );

    expect(originalHash).not.toBe(tamperedActorHash);

    // Tampered entity
    const tamperedEntityHash = computeAuditHash(
      prevHash,
      "user_123",
      "ORGANIZATION_CREATED",
      "Organization",
      "org_2",
      timestamp
    );

    expect(originalHash).not.toBe(tamperedEntityHash);
  });
});
