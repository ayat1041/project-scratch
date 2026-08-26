'use client';
import { useUserAuth } from '@/context/auth-context';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const AuthCheck = () => {
  const path = usePathname();
  const { userInfo, checkAuth } = useUserAuth();

  useEffect(() => {
    const runCheckAuth = async () => {
      try {
        await checkAuth();
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    };
    runCheckAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, userInfo?.email]);
  return null;
};

export default AuthCheck;
