import { LinkedIn } from 'arctic';

export const linkedInOAuthProvider = new LinkedIn(
  process.env.LINKEDIN_CLIENT_ID!,
  process.env.LINKEDIN_CLIENT_SECRET!,
  process.env.API_URL + '/auth/v1/linkedin',
);
