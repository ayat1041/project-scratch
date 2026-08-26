import * as authService from '../services/auth-service';

export const handleSignOut = async (): Promise<void> => {
  return authService.signOut();
};
