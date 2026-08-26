import { Request, Response, NextFunction } from "express";
import { createError } from "@/middleware/error.middleware";
import { ERROR_MESSAGES } from "@/constants/messages";
import { resourceIdValidationSchema } from "@repo/schemas-types/payload-schemas/common/payload.schema";
import { validateZodSchema } from "@/middleware/validation.middleware";

/**
 * Bulk resource data stored in res.locals
 */
export interface BulkResourceData<T = unknown> {
  resourceId: string;
  userId?: string | null;
  organizationId?: string | null;
  data?: T;
}

/**
 * Result type for existence check functions (always array-based)
 */
export interface ExistenceCheckResult<T = unknown> {
  success: boolean;
  missingIds: string[];
  resources: BulkResourceData<T>[];
}

/**
 * Existence check function type - always takes array of IDs
 */
export type ExistenceCheckFn<T = unknown> = (
  resourceIds: string[],
) => Promise<ExistenceCheckResult<T>>;

/**
 * Unified Resource Resolver Middleware
 *
 * Checks if resource(s) exist before authorization policies run.
 * Always uses array-based existence check functions.
 * - For params: extracts single ID, wraps in array, calls existsFn
 * - For body: extracts array of IDs directly, calls existsFn
 *
 * @param existsFn - Array-based existence check function
 * @param fieldName - The field name containing the resource ID(s)
 * @param options - Configuration options (source: "params" | "body")
 *
 * @example
 * // Single resource from params
 * router.get(
 *   '/:recordId',
 *   resolveResources(myResourceExists, 'recordId'),
 *   authorize(policy, 'isOwner', 'recordId'),
 *   getController
 * );
 *
 * @example
 * // Multiple resources from body
 * router.delete(
 *   '/',
 *   resolveResources(myRecordsExist, 'recordIds', { source: 'body' }),
 *   authorizeBulk(policy, 'isOwner'),
 *   deleteController
 * );
 */
export function resolveResources<T = unknown>(
  existsFn: ExistenceCheckFn<T>,
  fieldName: string,
  options: { source?: "params" | "body" } = {},
) {
  const { source = "params" } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let resourceIds: string[] = [];

      if (source === "params") {
        // Single ID from params - wrap in array
        const paramValue = req.params[fieldName] as string | undefined;
        const resourceId = validateZodSchema(resourceIdValidationSchema)(
          paramValue,
        );

        resourceIds = [resourceId];
      } else {
        // Array of IDs from body
        const bodyValue = req.body[fieldName] as string[] | undefined;

        if (!bodyValue || !Array.isArray(bodyValue) || bodyValue.length === 0) {
          throw createError.badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG, {
            message: `Invalid or missing '${fieldName}' in request body`,
            hint: `Expected an array of resource IDs. Please provide valid IDs and try again.`,
          });
        }

        // Reject duplicate IDs before they ever reach existsFn. A duplicate
        // otherwise survives silently: `WHERE id IN (...)` ignores repeats,
        // so existsFn resolves fewer resources than were requested with no
        // error or signal back to the caller.
        if (new Set(bodyValue).size !== bodyValue.length) {
          throw createError.badRequest(
            `Duplicate ID(s) found in '${fieldName}'`,
            {
              message: `'${fieldName}' must not contain duplicate resource IDs`,
              hint: `Remove the duplicate ID(s) and try again.`,
            },
          );
        }
        // Validate all ID formats
        for (const id of bodyValue) {
          const resourceId = validateZodSchema(resourceIdValidationSchema)(id);
          resourceIds.push(resourceId);
        }
      }

      // Call existence check function (always array-based)
      const result = await existsFn(resourceIds);

      if (!result.success) {
        throw createError.notFound(ERROR_MESSAGES.RESOURCE_NOT_FOUND, {
          message:
            result.missingIds.length === 1
              ? `Resource not found: ${result.missingIds[0]}`
              : `Resources not found: ${result.missingIds.join(", ")}`,
          hint: `Please ensure the resource IDs are correct and try again.`,
        });
      }

      // Store resource data in res.locals
      res.locals.resourceData = result.resources;
      res.locals.resourceIds = resourceIds;

      next();
    } catch (error) {
      next(error);
    }
  };
}
