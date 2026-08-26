// Re-export canonical types from the single source of truth.
// All new code should import ApiResponse and ApiPaginationMeta directly from
// './api-types.schema' — these re-exports exist so existing consumers compile
// without import-path changes.
export type {
    ApiPaginationMeta,
    ApiResponse,
} from './api-types.schema';

import type { ApiResponse } from './api-types.schema';

// Backward-compat aliases ─────────────────────────────────────────────────────
// Use ApiResponse<T> directly in new code.

export type ApiSuccessResponse<TData = unknown> = Extract<
    ApiResponse<TData>,
    { success: true }
>;

export type ApiErrorResponse = Extract<
    ApiResponse<never>,
    { success: false }
>;

// Legacy offset-based pagination shape ────────────────────────────────────────
// Use ApiPaginationMeta (page-based) for new endpoints.
export interface PAGINATION {
    limit: number;
    offset: number;
    totalItems: number;
    totalPages: number;
}
