import { toast } from 'sonner';
import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import * as authService from '../services/auth-service';
import type { SigninResponse } from '@repo/schemas-types/payload-schemas/auth/Response.type';

const SAFE_REDIRECT_FALLBACK = '/';

export const handleSignIn = async (
  email: string,
  password: string,
): Promise<SigninResponse> => {
  try {
    const result = await authService.signIn(email, password);
    toast.success('Signed in successfully!');
    if (result.success) {
      window.location.href = result._links?.redirectUrl || SAFE_REDIRECT_FALLBACK;
    }
    return result;
  } catch (error) {
    handleErrorToast(error, 'Sign in failed');
    throw error;
  }
};
