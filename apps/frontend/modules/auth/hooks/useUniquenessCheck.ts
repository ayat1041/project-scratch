'use client';

import { useEffect, useRef, useState } from 'react';
import type { UniquenessCheckResponse } from '@repo/schemas-types/payload-schemas/auth/Response.type';

interface UniquenessState {
  isChecking: boolean;
  isUnique: boolean | null;
  message: string;
}

interface UseUniquenessCheckOptions {
  checkFn: (value: string) => Promise<UniquenessCheckResponse>;
  validateFn: (value: string) => boolean;
  debounceMs?: number;
  enabled?: boolean;
}

// Encapsulates debounced uniqueness checking: validate format → debounce → check →
// cache last checked value to avoid re-issuing identical requests.
export function useUniquenessCheck(
  value: string,
  { checkFn, validateFn, debounceMs = 500, enabled = true }: UseUniquenessCheckOptions,
): UniquenessState {
  const [state, setState] = useState<UniquenessState>({
    isChecking: false,
    isUnique: null,
    message: '',
  });

  const lastCheckedRef = useRef<string>('');
  const [prevValue, setPrevValue] = useState(value);
  const [prevEnabled, setPrevEnabled] = useState(enabled);

  if (value !== prevValue || enabled !== prevEnabled) {
    setPrevValue(value);
    setPrevEnabled(enabled);
    const trimmed = value.trim();
    if (!enabled || !trimmed || !validateFn(trimmed)) {
      setState({ isChecking: false, isUnique: null, message: '' });
    } else {
      // Show the checking state immediately on a valid prop change (during render) rather
      // than in the effect below, which would briefly render the stale value first.
      setState(prev => ({ ...prev, isChecking: true }));
    }
  }

  useEffect(() => {
    const trimmed = value.trim();

    if (!enabled || !trimmed || !validateFn(trimmed)) {
      return;
    }

    const timer = setTimeout(async () => {
      if (lastCheckedRef.current === trimmed) {
        setState(prev => ({ ...prev, isChecking: false }));
        return;
      }

      lastCheckedRef.current = trimmed;

      try {
        const result = await checkFn(trimmed);
        setState({
          isChecking: false,
          isUnique: result.success ? (result.data?.isUnique ?? false) : false,
          message: result.message ?? '',
        });
      } catch {
        setState({ isChecking: false, isUnique: null, message: '' });
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      setState(prev => ({ ...prev, isChecking: false }));
    };
    // eslint-disable-next-line react-doctor/exhaustive-deps
  }, [value, enabled]);

  return state;
}
