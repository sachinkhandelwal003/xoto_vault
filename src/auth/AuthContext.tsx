import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import type { AppDispatch, RootState } from '../store/store';
import {
  loginUser,
  logoutUser,
  refreshToken,
  rehydrateAuthState,
  fetchMyPermissions,
} from '../store/authSlice';
import type { AuthContextType, AuthUser } from '../types/auth';

export const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://xoto.ae/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, loading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const hasFetchedPermissions = useRef(false);

  useEffect(() => {
    dispatch(rehydrateAuthState());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && token && !hasFetchedPermissions.current) {
      hasFetchedPermissions.current = true;
      dispatch(fetchMyPermissions()).unwrap().catch(() => {});
    }
    if (!isAuthenticated) {
      hasFetchedPermissions.current = false;
    }
  }, [isAuthenticated, token, dispatch]);

  useEffect(() => {
    if (!token) return;

    const checkAndRefresh = () => {
      try {
        const decoded = jwtDecode<AuthUser>(token);
        if (decoded.exp) {
          const timeUntilExpiry = decoded.exp * 1000 - Date.now();
          if (timeUntilExpiry < 5 * 60 * 1000) {
            dispatch(refreshToken());
          }
        }
      } catch {
        dispatch(logoutUser(undefined));
      }
    };

    checkAndRefresh();
    const id = setInterval(checkAndRefresh, 60 * 1000);
    return () => clearInterval(id);
  }, [token, dispatch]);

  const login = async (endpoint: string, credentials: Record<string, string>) => {
    const fullEndpoint = `${API_BASE}${endpoint}`;
    await dispatch(loginUser({ payload: credentials, endpoint: fullEndpoint })).unwrap();
  };

  const logout = async (logoutEndpoint = '/auth/logout') => {
    hasFetchedPermissions.current = false;
    const fullEndpoint = `${API_BASE}${logoutEndpoint}`;
    try {
      await dispatch(logoutUser(fullEndpoint)).unwrap();
    } catch {
      dispatch(logoutUser(undefined));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthProvider;
