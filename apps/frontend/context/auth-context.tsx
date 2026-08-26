'use client';

import { createContext, use, useCallback, useMemo, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@/store/store';
import {
  setAuthLoading,
  setAuthenticated,
  resetUser,
  UserState,
  setUserInfo,
} from '@/store/user-info';
import { handleSignOut } from '@modules/auth/handlers/session.handlers';
import * as authService from '@modules/auth/services';

const AuthContext = createContext<{
  isAuthenticated: boolean;
  isLoading: boolean;
  userInfo: UserState;
  logout: (path?: string) => Promise<void>;
  checkAuth: (checkPublic?: boolean) => Promise<boolean>;
} | null>(null);

const PRIVATE_ROUTES = ['/dashboard/', '/profile/', '/settings/'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const userInfo = useSelector((state: RootState) => state.user);
  const { isAuthenticated, isLoading } = userInfo;

  const checkAuth = useCallback(async (_checkPublic = true): Promise<boolean> => {
    dispatch(setAuthLoading(true));
    try {
      const response = await authService.getSessionInfo();

      if (response.success && response.data) {
        const { userInfo: info, roles, permissions, allowedRoutes } = response.data;
        dispatch(
          setUserInfo({
            isAuthenticated: true,
            id: info.id,
            email: info.email,
            userName: info.userName,
            profileImage: info.profileImage,
            registeredAt: info.registeredAt,
            roles: roles ?? [],
            permissions: permissions ?? [],
            allowedRoutes: allowedRoutes ?? [],
          })
        );
        dispatch(setAuthenticated(true));
        return true;
      }

      dispatch(resetUser());
      return false;
    } catch {
      dispatch(setAuthenticated(false));
      dispatch(resetUser());
      return false;
    } finally {
      dispatch(setAuthLoading(false));
    }
  }, [dispatch]);

  const logout = useCallback(async (path?: string) => {
    const redirectPath = path || '/';
    dispatch(setAuthLoading(true));

    try {
      await handleSignOut();

      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
      const cookieOptions = [
        'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/',
        baseDomain
          ? `expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${baseDomain}`
          : null,
      ].filter(Boolean) as string[];

      ['session_token', 'csrf_token', 'access_token', 'refresh_token'].forEach(
        cookieName => {
          cookieOptions.forEach(options => {
            document.cookie = `${cookieName}=; ${options}`;
          });
        }
      );

      if (typeof window !== 'undefined') {
        localStorage.removeItem('reduxState');
      }

      dispatch(resetUser());
      dispatch(setAuthenticated(false));
      dispatch(setAuthLoading(false));

      const isPrivate = PRIVATE_ROUTES.some(route =>
        redirectPath.startsWith(route)
      );
      window.location.href = isPrivate ? '/' : redirectPath;
    } catch {
      console.error('Logout error');
      dispatch(setAuthLoading(false));
      if (typeof window !== 'undefined') {
        localStorage.removeItem('reduxState');
      }
      dispatch(resetUser());
      dispatch(setAuthenticated(false));
      window.location.href = '/';
    }
  }, [dispatch]);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, userInfo, checkAuth, logout }),
    [isAuthenticated, isLoading, userInfo, checkAuth, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within an AuthProvider');
  }
  return context;
}
