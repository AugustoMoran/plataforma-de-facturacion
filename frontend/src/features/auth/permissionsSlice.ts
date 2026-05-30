import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

interface PermissionsState {
  permissions: Record<string, boolean>;
}

const initialState: PermissionsState = {
  permissions: {},
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setPermissions: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.permissions = action.payload;
    },
    updatePermission: (state, action: PayloadAction<{ key: string; value: boolean }>) => {
      state.permissions[action.payload.key] = action.payload.value;
    },
    mergePermissions: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.permissions = { ...state.permissions, ...action.payload };
    },
  },
});

export const { setPermissions, updatePermission, mergePermissions } = permissionsSlice.actions;

export const selectPermissions = (state: RootState) => state.permissions.permissions;
export const selectHasPermission = (permission: string) => (state: RootState) =>
  state.permissions.permissions[permission] === true;

export default permissionsSlice.reducer;
