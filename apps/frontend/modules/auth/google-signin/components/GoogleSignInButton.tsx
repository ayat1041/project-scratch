'use client';

import { useState } from 'react';
import { GoogleIcon } from './googleIcon';
import { handleGoogleSignInClient } from '../handlers/google-auth-client.handlers';

export default function GoogleSignInButton({
  from = 'login',
  token,
}: {
  from?: 'login' | 'signup';
  token?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const onGoogleSignInClicked = async () => {
    setIsLoading(true);
    try {
      const { redirectUrl } = await handleGoogleSignInClient(token);
      window.location.href = redirectUrl;
    } catch {
      // error toast already shown by handler
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onGoogleSignInClicked}
      disabled={isLoading}
      className="border-border bg-muted/50 text-foreground flex items-center justify-center gap-3 rounded-2xl border px-2 py-3 text-sm font-bold"
    >
      {isLoading ? (
        <div className="border-muted border-t-muted-foreground h-4 w-4 animate-spin rounded-full border-2" />
      ) : (
        <GoogleIcon />
      )}
      {isLoading
        ? `Signing ${from === 'signup' ? 'up' : 'in'}...`
        : `Continue with Google`}
    </button>
  );
}
