import { Google } from 'arctic';

export const googleOAuthProvider = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.API_URL + '/auth/v1/google',
);
