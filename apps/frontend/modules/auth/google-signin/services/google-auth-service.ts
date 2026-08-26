import { generateCodeVerifier, generateState } from 'arctic';
import { googleOAuthProvider } from '../api/provider';

export function generateGoogleOAuthUrl(
  scopes: string[] = ['openid', 'email', 'profile'],
): {
  state: string;
  codeVerifier: string;
  authorizationURL: URL;
} {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const authorizationURL = googleOAuthProvider.createAuthorizationURL(
    state,
    codeVerifier,
    scopes,
  );
  authorizationURL.searchParams.set('prompt', 'select_account consent');
  authorizationURL.searchParams.set('access_type', 'online');
  authorizationURL.searchParams.set('include_granted_scopes', 'true');
  return { state, codeVerifier, authorizationURL };
}
