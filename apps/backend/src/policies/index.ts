/**
 * Policies Index
 *
 * Export all policy modules from this file.
 * Policies handle resource-level authorization (ownership, membership, etc.)
 *
 * Usage in routes:
 * ```typescript
 * import { basePolicy } from '@/policies';
 * import { authorize } from '@/middleware/authorize.middleware';
 *
 * router.delete(
 *   '/:recordId',
 *   isAuthenticated(),
 *   hasPermission(PERMISSIONS.USER.DELETE_OWN_PROFILE, ""),
 *   resolveResources(myResourceExists, 'recordId'),
 *   authorize(basePolicy, 'canAccessOwnResource'),
 *   deleteController
 * );
 * ```
 */

export * from "./base.policy";
