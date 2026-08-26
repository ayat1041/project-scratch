export interface ApiPaginationMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
}

export type ApiResponse<T> =
    | {
          success: true;
          data: T;
          meta?: ApiPaginationMeta;
          message?: string;
          _links?: Record<string, unknown>;
      }
    | {
          success: false;
          error: string;
          message: string;
          statusCode: number;
          details?: Record<string, unknown>;
      };
