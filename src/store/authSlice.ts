import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import type { AuthState, AuthUser, Permission } from '../types/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://xoto.ae/api';

const VAULT_ROLE_CODES = ['18', '21', '22', '23', '26'];

const loadInitialState = (): AuthState => {
  const token = localStorage.getItem('vault_token');
  if (token) {
    try {
      const decoded = jwtDecode<AuthUser>(token);
      if (decoded.exp && decoded.exp * 1000 > Date.now()) {
        const roleCode =
          typeof decoded.role === 'object'
            ? String(decoded.role.code)
            : String(decoded.role);

        if (!VAULT_ROLE_CODES.includes(roleCode)) {
          localStorage.removeItem('vault_token');
          return defaultState();
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return {
          user: decoded,
          token,
          permissions: {},
          loading: false,
          error: null,
          isAuthenticated: true,
        };
      } else {
        localStorage.removeItem('vault_token');
      }
    } catch {
      localStorage.removeItem('vault_token');
    }
  }
  return defaultState();
};

const defaultState = (): AuthState => ({
  user: null,
  token: null,
  permissions: {},
  loading: false,
  error: null,
  isAuthenticated: false,
});

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (
    { payload, endpoint }: { payload: Record<string, string>; endpoint: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(endpoint, payload);
      const data = response.data;

      if (!data.success && !data.token) {
        return rejectWithValue(data.message || data.error || 'Login failed');
      }

      const token: string = data.token;
      const decoded = jwtDecode<AuthUser>(token);

      const roleCode =
        typeof decoded.role === 'object'
          ? String(decoded.role.code)
          : String(decoded.role);

      if (!VAULT_ROLE_CODES.includes(roleCode)) {
        return rejectWithValue('Access denied. This portal is for Vault users only.');
      }

      localStorage.setItem('vault_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { user: decoded, token, message: data.message || 'Login successful' };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Login failed';
      return rejectWithValue(errorMsg);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (logoutUrl: string | undefined, { getState }) => {
    const state = getState() as { auth: AuthState };
    try {
      if (state.auth.token && logoutUrl) {
        await axios.post(
          logoutUrl,
          {},
          { headers: { Authorization: `Bearer ${state.auth.token}` } }
        );
      }
    } catch {
      // ignore backend logout errors
    } finally {
      localStorage.removeItem('vault_token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    try {
      if (!state.auth.token) return rejectWithValue('No token');
      const res = await axios.post(`${API_BASE}/auth/refresh`);
      const newToken: string = res.data.token;
      const decoded = jwtDecode<AuthUser>(newToken);
      localStorage.setItem('vault_token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { user: decoded, token: newToken };
    } catch {
      localStorage.removeItem('vault_token');
      delete axios.defaults.headers.common['Authorization'];
      return rejectWithValue('Refresh failed');
    }
  }
);

export const fetchMyPermissions = createAsyncThunk(
  'auth/fetchMyPermissions',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    try {
      const res = await axios.get(`${API_BASE}/permission/my/get`, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      if (res.data.success) return res.data.permissions;
      return rejectWithValue(res.data.message);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    rehydrateAuthState: (state) => {
      const token = localStorage.getItem('vault_token');
      if (token) {
        try {
          const decoded = jwtDecode<AuthUser>(token);
          if (decoded.exp && decoded.exp * 1000 > Date.now()) {
            state.user = decoded;
            state.token = token;
            state.isAuthenticated = true;
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } else {
            localStorage.removeItem('vault_token');
            Object.assign(state, defaultState());
            delete axios.defaults.headers.common['Authorization'];
          }
        } catch {
          localStorage.removeItem('vault_token');
          Object.assign(state, defaultState());
          delete axios.defaults.headers.common['Authorization'];
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Login failed';
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.permissions = {};
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        Object.assign(state, defaultState());
      })
      .addCase(fetchMyPermissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyPermissions.fulfilled, (state, action) => {
        state.loading = false;
        const perms = action.payload as Array<{
          subModule?: { name: string; route: string; icon: string };
          module: { name: string; route: string; icon: string };
          permissions: Permission;
        }>;
        state.permissions = perms.reduce<Record<string, Permission>>((map, p) => {
          const key = p.subModule
            ? `${p.module.name}→${p.subModule.name}`
            : p.module.name;
          map[key] = {
            canView: p.permissions.canView,
            canAdd: p.permissions.canAdd,
            canEdit: p.permissions.canEdit,
            canDelete: p.permissions.canDelete,
            canViewAll: p.permissions.canViewAll,
            route: p.subModule?.route || p.module.route,
            icon: p.subModule?.icon || p.module.icon,
            name: p.subModule?.name || p.module.name,
            moduleName: p.module.name,
          };
          return map;
        }, {});
      })
      .addCase(fetchMyPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.permissions = {};
      });
  },
});

export const { rehydrateAuthState, clearError } = authSlice.actions;
export default authSlice.reducer;
