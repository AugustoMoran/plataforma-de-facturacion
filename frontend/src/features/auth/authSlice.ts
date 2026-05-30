import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  branchId?: string;
  permissions: Record<string, boolean>;
  commissionPercentage: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updatePermissions: (state, action: PayloadAction<Record<string, boolean>>) => {
      if (state.user) {
        state.user.permissions = action.payload;
      }
    },
  },
});

export const { setCredentials, clearCredentials, setLoading, updatePermissions } = authSlice.actions;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectUserRole = (state: RootState) => state.auth.user?.role;
export const selectUserPermissions = (state: RootState) => state.auth.user?.permissions ?? {};

export default authSlice.reducer;
