export const API_KEY = process.env.API_KEY;
export const NEXT_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY;
export const baseHeaders = {
  // 'X-API-Key': API_KEY || NEXT_PUBLIC_API_KEY || '',
} as const;
export const isProduction = process.env.NODE_ENV === 'production';
