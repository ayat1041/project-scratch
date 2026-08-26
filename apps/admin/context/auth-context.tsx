/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchWithCookies } from '@repo/utilities/http/fetch-with-cookies';

import { RootState } from '../store/store';
import {
  setAuthLoading,
  setAuthenticated,
  resetUser,
  UserState,
  setUserInfo,
} from '../store/user-info';

// Create Authentication Context
const AuthContext = createContext<{
  isAuthenticated: boolean;
  isLoading: boolean;
  userInfo: UserState;
  logout: (path?: string) => Promise<void>;
  checkAuth: (checkPublic?: boolean) => Promise<boolean>;
} | null>(null);

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, ...userInfo } = useSelector(
    (state: RootState) => state.user
  );
  const privateRoutes = [
    '/submit/add-tool/',
    '/dashboard/',
    '/setup/',
    '/dashboard/',
    // '/ahso-dd',
  ];

  // Check auth state by validating access token
  const checkAuth = async (checkPublic = true): Promise<boolean> => {
    // Skip validation for private routes if not explicitly checking
    // const isPrivateRoute = privateRoutes.some(route => path.startsWith(route));

    // if (isPrivateRoute && !checkPublic) return true;

    dispatch(setAuthLoading(true));
    try {
      // Use environment variable consistently
      const response = await fetchWithCookies(
        `/auth/v1/session-info?includeDetails=true`
      );

      const validateData = await response.json();

      if (response.ok && validateData.success) {
        const userInfo = validateData.data.userInfo;

        dispatch(
          setUserInfo({
            isAuthenticated: true,
            id: userInfo.id,
            email: userInfo.email,
            userName: userInfo.userName,
            profileImage: userInfo.profileImage,
            providerName: userInfo.providerName,
            isVerified: userInfo.isVerified,
            isDeleted: userInfo.isDeleted,
            registeredAt: userInfo.registeredAt,
            roles: userInfo.roles || [],
            permissions: userInfo.permissions || [],
            allowedRoutes: validateData.data.allowedRoutes || [],
          })
        );
        dispatch(setAuthenticated(true));
        return true;
      }

      dispatch(resetUser());
      return false;
    } catch (error) {
      // console.error('Failed to validate access token:', error);
      dispatch(setAuthenticated(false));
      dispatch(resetUser());
      return false;
    } finally {
      dispatch(setAuthLoading(false));
    }
  };

  const logout = async (path?: string) => {
    if (!path) {
      path = '/';
    }
    dispatch(setAuthLoading(true));
    try {
      // Clear server-side session using fetchWithCookies for consistency
      await fetchWithCookies('/auth/v1/sign-out', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
        },
      });

      // Clear ALL auth cookies (both new and legacy)
      // Note: In production with custom domains, cookies might be set with a domain attribute
      // We need to clear both with and without domain to ensure complete cleanup
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
      const cookieOptions = [
        'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/',
        baseDomain
          ? `expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${baseDomain}`
          : null,
      ].filter(Boolean);

      // Clear each cookie with all possible options
      ['session_token', 'csrf_token', 'access_token', 'refresh_token'].forEach(
        cookieName => {
          cookieOptions.forEach(options => {
            document.cookie = `${cookieName}=; ${options}`;
          });
        }
      );

      // Clear localStorage to remove persisted state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('reduxState');
      }

      // Reset Redux state
      dispatch(resetUser());
      dispatch(setAuthenticated(false));
      dispatch(setAuthLoading(false));

      // Force hard navigation instead of client-side routing
      // This is more effective for clearing browser cache than router.push
      // export const privateRoutes = ['/dashboard', '/submit/add-tool', '/setup'];
      const isPrivate = privateRoutes.some(route => path.startsWith(route));

      if (isPrivate) {
        window.location.href = '/';
      } else {
        window.location.href = path;
      }

      // No need for router.refresh() or setTimeout with hard navigation
    } catch (error) {
      // Handle errors
      console.error('Logout error:', error);
      dispatch(setAuthLoading(false));

      // Even if the API call fails, clear local state and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('reduxState');
      }
      dispatch(resetUser());
      dispatch(setAuthenticated(false));
      window.location.href = '/';
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    userInfo,
    checkAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useUserAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within an AuthProvider');
  }
  return context;
}
