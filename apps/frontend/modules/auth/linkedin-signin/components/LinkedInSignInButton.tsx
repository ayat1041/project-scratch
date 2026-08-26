'use client';

import { useState } from 'react';
import { LinkedInIcon } from './linkedinIcon';
import { handleLinkedInSignInClient } from '../handlers/linkedin-auth-client.handlers';

export default function LinkedInSignInButton({
  from = 'login',
  token,
}: {
  from?: 'login' | 'signup';
  token?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const onLinkedInSignInClicked = async () => {
    setIsLoading(true);
    try {
      const { redirectUrl } = await handleLinkedInSignInClient(token);
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
      onClick={onLinkedInSignInClicked}
      disabled={isLoading}
      className="flex items-center justify-center gap-3 rounded-2xl border border-[#CBD5E1] bg-[#f3f4f680] px-2 py-3 text-sm font-bold text-[#1F1E1E]"
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border" />
      ) : (
        <LinkedInIcon />
      )}
      {isLoading
        ? `Signing ${from === 'signup' ? 'up' : 'in'}...`
        : `Continue with LinkedIn`}
    </button>
  );
}
