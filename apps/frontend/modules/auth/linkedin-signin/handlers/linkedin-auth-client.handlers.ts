'use client';

import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import { handleLinkedInSignIn } from './linkedin-auth.handlers';

export async function handleLinkedInSignInClient(token?: string): Promise<{ redirectUrl: string }> {
  try {
    const result = await handleLinkedInSignIn(token);
    if (!result.success) {
      throw new Error(result.error ?? 'LinkedIn sign in failed. Please try again.');
    }
    return { redirectUrl: result.redirectUrl };
  } catch (error) {
    handleErrorToast(error, 'LinkedIn sign in failed. Please try again.');
    throw error;
  }
}
