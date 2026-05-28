import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import { Spin } from 'antd';
import { rehydrateAuthState } from '../../store/authSlice';
import type { AppDispatch } from '../../store/store';
import type { AuthUser } from '../../types/auth';
import { VAULT_ROLE_CODES, VAULT_ROLE_SLUG_MAP } from '../../types/auth';
import { toast } from 'react-toastify';
import axios from 'axios';

/**
 * Handles token passed from xoto.ae after successful vault login there.
 * URL: /auth/callback?token=<JWT>
 */
const AuthCallback: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = params.get('token');

    if (!token) {
      toast.error('No authentication token received.');
      navigate('/login', { replace: true });
      return;
    }

    try {
      const decoded = jwtDecode<AuthUser>(token);

      if (!decoded.exp || decoded.exp * 1000 < Date.now()) {
        toast.error('Session expired. Please login again.');
        navigate('/login', { replace: true });
        return;
      }

      const roleCode =
        typeof decoded.role === 'object'
          ? String(decoded.role.code)
          : String(decoded.role);

      if (!VAULT_ROLE_CODES.includes(roleCode)) {
        toast.error('Access denied. Vault users only.');
        navigate('/login', { replace: true });
        return;
      }

      localStorage.setItem('vault_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      dispatch(rehydrateAuthState());

      const slug = VAULT_ROLE_SLUG_MAP[roleCode] ?? 'vault-admin';
      toast.success('Login successful! Welcome to Xoto Vault.');
      navigate(`/dashboard/${slug}`, { replace: true });
    } catch {
      toast.error('Invalid token. Please login again.');
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1a0b2e, #03a4f4)' }}>
      <div className="text-center text-white">
        <Spin size="large" />
        <p className="mt-4 text-lg font-medium">Authenticating...</p>
        <p className="text-purple-200 text-sm mt-1">Please wait while we verify your session.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
