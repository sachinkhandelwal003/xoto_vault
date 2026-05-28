import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiChevronDown, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import type { RootState, AppDispatch } from '../../store/store';
import { VAULT_ROLE_SLUG_MAP } from '../../types/auth';
import { logoutUser } from '../../store/authSlice';
import VaultNotificationBell from '../common/VaultNotificationBell';
import AnnouncementBell from '../common/AnnouncementBell';

interface TopBarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleMobile: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ collapsed, onToggleCollapse, onToggleMobile }) => {
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const roleCode = user?.role
    ? typeof user.role === 'object' ? String(user.role.code) : String(user.role)
    : '18';

  const slug = VAULT_ROLE_SLUG_MAP[roleCode] ?? 'vault-admin';
  const displayName = typeof user?.role === 'object' ? user.role.name : slug.replace(/-/g, ' ');
  const initials = (user?.name || displayName).charAt(0).toUpperCase();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <div className="flex items-center gap-2 py-0.5">
          <FiUser size={14} />
          <span>My Profile</span>
        </div>
      ),
      onClick: () => navigate(`/dashboard/${slug}/profile`),
    },
    {
      key: 'settings',
      label: (
        <div className="flex items-center gap-2 py-0.5">
          <FiSettings size={14} />
          <span>Settings</span>
        </div>
      ),
      onClick: () => {
        if (slug === 'vault-admin') {
          navigate('/dashboard/vault-admin/platform-config');
        } else {
          navigate(`/dashboard/${slug}/notifications`);
        }
      }
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: (
        <div className="flex items-center gap-2 py-0.5 text-red-500">
          <FiLogOut size={14} />
          <span>Logout</span>
        </div>
      ),
      danger: true,
      onClick: async () => {
        await dispatch(logoutUser(undefined));
        navigate('/login', { replace: true });
      },
    },
  ];

  return (
    <header
      className={`
        fixed top-0 right-0 z-40 h-16
        bg-white border-b border-gray-100
        transition-all duration-300
        ${collapsed ? 'lg:left-[72px]' : 'lg:left-72'}
        left-0
      `}
      style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
    >
      <div className="h-full flex items-center justify-between px-4 lg:px-6">

        {/* ── Left: Hamburger + Branding ─────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <FiMenu size={20} />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <FiMenu size={20} />
          </button>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          {/* Brand badge */}
          <div className="hidden sm:flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 30, height: 30,
                background: 'linear-gradient(135deg, #5C039B, #03A4F4)',
                boxShadow: '0 2px 8px rgba(92,3,155,0.3)',
              }}
            >
              <i className="fas fa-shield-alt text-white" style={{ fontSize: 12 }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1 }}>Xoto Vault</div>
              <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'capitalize', marginTop: 1 }}>
                {displayName} Portal
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Notifications + User ────────────────────────── */}
        <div className="flex items-center gap-2">

          {/* Announcement bell */}
          <AnnouncementBell />

          {/* Vault real-time notification bell */}
          <VaultNotificationBell />

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* User menu */}
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <button
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-50 transition-all"
              style={{ border: '1px solid transparent' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            >
              {/* Avatar */}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold"
                style={{
                  width: 34, height: 34, fontSize: 13,
                  background: 'linear-gradient(135deg, #5C039B, #7c3aed)',
                  boxShadow: '0 2px 8px rgba(92,3,155,0.35)',
                }}
              >
                {initials}
              </div>

              {/* Name + Role */}
              <div className="hidden sm:block text-left">
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.2, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || displayName}
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'capitalize', marginTop: 1 }}>
                  {displayName}
                </div>
              </div>

              <FiChevronDown size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
            </button>
          </Dropdown>
        </div>

      </div>
    </header>
  );
};

export default TopBar;
