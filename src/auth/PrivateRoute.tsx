import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { VAULT_ROLE_CODES, VAULT_ROLE_SLUG_MAP } from '../types/auth';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoleCodes?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  allowedRoleCodes = VAULT_ROLE_CODES,
}) => {
  const location = useLocation();
  const { user, token, isAuthenticated } = useSelector((s: RootState) => s.auth);

  if (!isAuthenticated || !token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roleCode =
    typeof user.role === 'object' ? String(user.role.code) : String(user.role);

  if (!allowedRoleCodes.includes(roleCode)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export const RoleRedirect: React.FC = () => {
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const roleCode =
    typeof user.role === 'object' ? String(user.role.code) : String(user.role);
  const slug = VAULT_ROLE_SLUG_MAP[roleCode] ?? 'vault-admin';

  return <Navigate to={`/dashboard/${slug}`} replace />;
};

export default PrivateRoute;
