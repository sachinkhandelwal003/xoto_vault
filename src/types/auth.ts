export interface UserRole {
  code: string | number;
  name: string;
}

export interface AuthUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role: UserRole | string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface Permission {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  route: string;
  icon: string;
  name: string;
  moduleName: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  permissions: Record<string, Permission>;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (endpoint: string, credentials: Record<string, string>) => Promise<void>;
  logout: (logoutEndpoint?: string) => Promise<void>;
}

export const VAULT_ROLE_SLUG_MAP: Record<string, string> = {
  '18': 'vault-admin',
  '21': 'vaultpartner',
  '22': 'vaultagent',
  '23': 'vault-ops',
  '26': 'vault-advisor',
};

export const VAULT_ROLE_CODES = ['18', '21', '22', '23', '26'];
