export type Role =
  | "Owner"
  | "FinanceManager"
  | "Accountant"
  | "CA-reviewer"
  | "PlatformAdmin";

export const CLIENT_ROLES: Role[] = ["Owner", "FinanceManager", "Accountant"];
export const CA_ROLES: Role[] = ["CA-reviewer", "PlatformAdmin"];
export const ADMIN_ROLES: Role[] = ["PlatformAdmin"];

export interface TenantContext {
  userId: string;
  userEmail: string;
  userName?: string | null;
  orgId: string;
  orgName: string;
  orgSlug: string;
  isDemo: boolean;
  role: Role;
}

export class TenantAccessError extends Error {
  constructor(message = "Unauthorized tenant access") {
    super(message);
    this.name = "TenantAccessError";
  }
}

export class RoleAuthorizationError extends Error {
  constructor(message = "Insufficient permissions for this action") {
    super(message);
    this.name = "RoleAuthorizationError";
  }
}

/**
 * Validates that the active session has access to the specified orgId.
 * Prevents cross-tenant data leakage.
 */
export function validateTenantAccess(
  activeOrgId: string | undefined,
  targetOrgId: string
): void {
  if (!activeOrgId || activeOrgId !== targetOrgId) {
    throw new TenantAccessError(
      `Tenant boundary violation: Active org (${activeOrgId || "none"}) does not match target (${targetOrgId})`
    );
  }
}

/**
 * Ensures user has one of the required roles.
 */
export function requireRole(userRole: string, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(userRole as Role)) {
    throw new RoleAuthorizationError(
      `Role '${userRole}' is not authorized. Required one of: ${allowedRoles.join(", ")}`
    );
  }
}
