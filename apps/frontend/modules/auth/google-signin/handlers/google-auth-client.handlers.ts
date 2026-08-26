'use client';

import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import { handleGoogleSignIn } from './google-auth.handlers';

export async function handleGoogleSignInClient(token?: string): Promise<{ redirectUrl: string }> {
  try {
    const result = await handleGoogleSignIn(token);
    if (!result.success) {
      throw new Error(result.error ?? 'Google sign in failed. Please try again.');
    }
    return { redirectUrl: result.redirectUrl };
  } catch (error) {
    handleErrorToast(error, 'Google sign in failed. Please try again.');
    throw error;
  }
}
