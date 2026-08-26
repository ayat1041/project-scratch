import { getPermissions } from "@/lib/auth.utils";
import { PERMISSIONS } from "@repo/constants";
import { ERROR_MESSAGES } from "@/constants/messages";

/**
 * Policy Utilities
 *
 * Provides common authorization utilities for resource policies.
 *
 * Authorization Flow:
 * 1. Middleware: isAuthenticated() - Checks if user is logged in
 * 2. Gate: hasPermission() - Checks if user has route-level permission
 * 3. Policy: authorize() - Checks resource-level access (ownership, membership, etc.)
 * 4. Controller: Handles HTTP request/response
 * 5. Service: Business logic
 */

// ============================================================================
// Types
// ============================================================================

export interface PolicyContext<TData = unknown> {
  userId: string;
  hasAdminPermission?: boolean;
  hasBasicPermission?: boolean;
  hasAdvancedPermission?: boolean;
  hasPublicAccess?: boolean;
  resourceOwnerId?: string;
  resourceOwnerOrganizationId?: string;
  existingData?: TData;
}

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Policy function type - each policy action should follow this signature
 */
export type PolicyFn<TData = unknown> = (
  context: PolicyContext<TData>,
  // resourceId: string,
  expectedStatus?: string[],
  isLatest?: boolean,
) => Promise<AuthorizationResult>;

/**
 * Policy module type - a collection of policy functions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PolicyModule = Record<string, PolicyFn<any>>;

// ============================================================================
// Result Helpers
// ============================================================================

/**
 * Create a successful authorization result
 */
export const allow = (
  metadata?: Record<string, unknown>,
): AuthorizationResult => ({
  authorized: true,
  metadata,
});

/**
 * Create a failed authorization result
 */
export const deny = (reason: string): AuthorizationResult => ({
  authorized: false,
  reason,
});

// ============================================================================
// Common Checks
// ============================================================================

/**
 * Check if user has admin-level access
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  const permissions = await getPermissions(userId);
  return permissions.includes(PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS);
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Returns true if ANY condition is true (OR logic)
 */
export const anyOf = (...conditions: boolean[]): boolean =>
  conditions.some(Boolean);

/**
 * Returns true if ALL conditions are true (AND logic)
 */
export const allOf = (...conditions: boolean[]): boolean =>
  conditions.every(Boolean);

// ============================================================================
// common policy functions can be defined here, e.g., checking if user is owner of a resource, if user is a member of an organization, etc.
// These can be imported and used in specific policy modules as needed.
// ============================================================================

export const canAccessOwnResource = async (
  context: PolicyContext,
  resourceId: string,
): Promise<AuthorizationResult> => {
  // Admin bypass
  // if (context.hasAdvancedPermission === true) {
  // need to check the logged in user is owner or member of the agency of the resource,
  // if yes then allow with admin access type, else deny
  //   return allow({ accessType: "admin" });
  // }

  // Self-check
  if (context.userId === resourceId) {
    return allow({ accessType: "self" });
  }

  return deny(ERROR_MESSAGES.PERMISSION_DENIED);
};

export const basePolicy = {
  canAccessOwnResource,
};
