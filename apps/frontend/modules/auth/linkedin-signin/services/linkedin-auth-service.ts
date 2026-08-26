import { generateState } from 'arctic';
import { linkedInOAuthProvider } from '../api/provider';

export function generateLinkedInOAuthUrl(
  scopes: string[] = ['openid', 'profile', 'email'],
): {
  state: string;
  authorizationURL: URL;
} {
  const state = generateState();
  const authorizationURL = linkedInOAuthProvider.createAuthorizationURL(
    state,
    scopes,
  );
  return { state, authorizationURL };
}
