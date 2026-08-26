// redux/userInfo/index.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserInfoPayload } from '@repo/schemas-types/payload-schemas/auth/Response.type';
import type { AppUsers } from '@repo/schemas-types/tables/entity-types';

type UserStateUIFields = {
  isAuthenticated: boolean;
  isLoading: boolean;
};

// DB-column fields come from UserInfoPayload; id/userName/registeredAt are overridden
// for the unauthenticated initial state (null) and Redux's serialized date (string).
export type UserState = Omit<UserInfoPayload, 'id' | 'userName' | 'registeredAt'> & {
  id: AppUsers['id'] | null;
  userName: AppUsers['userName'] | null;
  registeredAt: Exclude<AppUsers['registeredAt'], undefined> | null;
} & UserStateUIFields;

const initialState: UserState = {
  id: null,
  email: '',
  userName: null,
  profileImage: null,
  providerName: '',
  isVerified: false,
  isDeleted: false,
  registeredAt: null,
  roles: [],
  activeRole: null,
  permissions: [],
  allowedRoutes: [],
  isAuthenticated: false,
  isLoading: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<Partial<UserState>>) => {
      return { ...state, ...action.payload };
    },
    resetUser: () => {
      return initialState;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
  },
});

export const { setUserInfo, resetUser, setAuthLoading, setAuthenticated } =
  userSlice.actions;

export default userSlice.reducer;
