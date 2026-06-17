import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiX, FiChevronDown, FiLogOut } from 'react-icons/fi';
import { logoutUser } from '../../store/authSlice';
import type { RootState, AppDispatch } from '../../store/store';
import { VAULT_ROLE_SLUG_MAP } from '../../types/auth';
import { apiService } from '../../api/apiService';
import { toast } from 'react-toastify';

interface MenuItem {
  title: string;
  icon: string;
  to?: string;
  submenus?: { title: string; to: string }[];
}

const VAULT_NAV: Record<string, MenuItem[]> = {

  // ── Admin (18) ────────────────────────────────────────────────────────────
  '18': [
    {
      title: 'Lead Management', icon: 'fas fa-filter',
      submenus: [
        { title: 'Leads Queue',  to: '/dashboard/vault-admin/vault/agent-leads/unassigned' },
        { title: 'All Leads',    to: '/dashboard/vault-admin/vault/agent-leads' },
      ],
    },
    {
      title: 'Applications', icon: 'fas fa-layer-group',
      submenus: [
        { title: 'Applications Queue',   to: '/dashboard/vault-admin/case/queue/view' },
        { title: 'Manage Applications',  to: '/dashboard/vault-admin/case/manage' },
      ],
    },

    {
      title: 'User & Profile', icon: 'fas fa-users-cog',
      submenus: [
        { title: 'Customers',        to: '/dashboard/vault-admin/customers' },
        { title: ' Advisors',              to: '/dashboard/vault-admin/advisor/list' },
        { title: ' Ops',               to: '/dashboard/vault-admin/mortgage-ops/list' },
                { title: 'Partners',                   to: '/dashboard/vault-admin/partners/list' },

        { title: 'Referral Partners',          to: '/dashboard/vault-admin/vault/agent-list' },
      ],
    },
    { title: 'Commissions', icon: 'fas fa-percentage', to: '/dashboard/vault-admin/commission' },
    {
      title: 'Bank & Product Library', icon: 'fas fa-university',
      submenus: [
        { title: 'Banks',         to: '/dashboard/vault-admin/bank/list' },
        { title: 'Bank Products', to: '/dashboard/vault-admin/bank/products' },
      ],
    },
    {
      title: 'Document Management', icon: 'fas fa-folder-open',
      submenus: [
        { title: 'Global Documents', to: '/dashboard/vault-admin/documents/global' },
        { title: 'Bank Documents',   to: '/dashboard/vault-admin/documents/bank' },
      ],
    },
    { title: 'Reports', icon: 'fas fa-chart-bar', to: '/dashboard/vault-admin/analytics' },
    { title: 'Content&Configuration',       icon: 'fas fa-cogs',       to: '/dashboard/vault-admin/platform-config' },

  ],

  // ── Partner Affiliated Agent (22_affiliated) ──────────────────────────────
  '22_affiliated': [
    {
      title: 'Lead Management', icon: 'fas fa-filter',
      submenus: [
        { title: 'Create Lead', to: '/dashboard/vaultagent/leads/create' },
        { title: 'My Leads',    to: '/dashboard/vaultagent/partner-leads' },
      ],
    },
    {
      title: 'Proposals', icon: 'fas fa-folder-open',
      submenus: [
        { title: 'My Proposals',    to: '/dashboard/vaultagent/proposals/list' },
        { title: 'Create Proposal', to: '/dashboard/vaultagent/proposals/create' },
      ],
    },
    {
      title: 'Applications', icon: 'fas fa-briefcase',
      submenus: [
        { title: 'Create Application', to: '/dashboard/vaultagent/case/create' },
        { title: 'My Applications',    to: '/dashboard/vaultagent/case/view' },
      ],
    },
    { title: 'Commission',    icon: 'fas fa-percentage', to: '/dashboard/vaultagent/commission' },
    { title: 'Bank Products', icon: 'fas fa-university', to: '/dashboard/vaultagent/bank/products' },
    { title: 'Notifications', icon: 'fas fa-bell',       to: '/dashboard/vaultagent/notifications' },
  ],

  // ── Referral Partner (22_referral) ───────────────────────────────────────
  '22_referral': [
    {
      title: 'Leads', icon: 'fas fa-filter',
      submenus: [
        { title: 'Create Lead', to: '/dashboard/vaultagent/leads/create' },
        { title: 'My Leads',    to: '/dashboard/vaultagent/leads' },
      ],
    },
    { title: 'Commission',    icon: 'fas fa-percentage', to: '/dashboard/vaultagent/commission' },
    { title: 'Analytics',     icon: 'fas fa-chart-bar',  to: '/dashboard/vaultagent/analytics' },
    { title: 'Notifications', icon: 'fas fa-bell',       to: '/dashboard/vaultagent/notifications' },
  ],

  // ── Fallback while agentType loads ────────────────────────────────────────
  '22': [
    {
      title: 'Leads', icon: 'fas fa-filter',
      submenus: [
        { title: 'Create Lead', to: '/dashboard/vaultagent/leads/create' },
        { title: 'My Leads',    to: '/dashboard/vaultagent/leads' },
      ],
    },
    { title: 'Notifications', icon: 'fas fa-bell', to: '/dashboard/vaultagent/notifications' },
  ],

  // ── Partner Company (21_company) ──────────────────────────────────────────
  '21_company': [
    {
      title: 'Lead Management', icon: 'fas fa-filter',
      submenus: [
        { title: 'Create Lead', to: '/dashboard/vaultpartner/leads/partner/create' },
        { title: 'All Leads',   to: '/dashboard/vaultpartner/partner-leads' },
      ],
    },
    {
      title: 'Proposals', icon: 'fas fa-folder-open',
      submenus: [
        { title: 'My Proposals',    to: '/dashboard/vaultpartner/proposals/list' },
        { title: 'Create Proposal', to: '/dashboard/vaultpartner/proposals/create' },
      ],
    },
    {
      title: 'Applications', icon: 'fas fa-briefcase',
      submenus: [
        { title: 'Create Application', to: '/dashboard/vaultpartner/case/create' },
        { title: 'My Applications',    to: '/dashboard/vaultpartner/case/view' },
      ],
    },
    { title: 'Bank Products', icon: 'fas fa-university', to: '/dashboard/vaultpartner/bank/products' },
    {
      title: 'Agent Team', icon: 'fas fa-users',
      submenus: [
        { title: 'Onboard Agent', to: '/dashboard/vaultpartner/agents/onboard' },
        { title: 'All Agents',    to: '/dashboard/vaultpartner/agents/list' },
      ],
    },
    { title: 'Commission',    icon: 'fas fa-percentage', to: '/dashboard/vaultpartner/commission' },
    { title: 'Analytics',     icon: 'fas fa-chart-bar',  to: '/dashboard/vaultpartner/analytics' },
    { title: 'Notifications', icon: 'fas fa-bell',       to: '/dashboard/vaultpartner/notifications' },
  ],

  // ── Partner Individual (21_individual) ────────────────────────────────────
  '21_individual': [
    {
      title: 'Lead Management', icon: 'fas fa-filter',
      submenus: [
        { title: 'Create Lead', to: '/dashboard/vaultpartner/leads/partner/create' },
        { title: 'All Leads',   to: '/dashboard/vaultpartner/partner-leads' },
      ],
    },
    {
      title: 'Proposals', icon: 'fas fa-folder-open',
      submenus: [
        { title: 'My Proposals',    to: '/dashboard/vaultpartner/proposals/list' },
        { title: 'Create Proposal', to: '/dashboard/vaultpartner/proposals/create' },
      ],
    },
    {
      title: 'Applications', icon: 'fas fa-briefcase',
      submenus: [
        { title: 'Create Application', to: '/dashboard/vaultpartner/case/create' },
        { title: 'My Applications',    to: '/dashboard/vaultpartner/case/view' },
      ],
    },
    { title: 'Bank Products', icon: 'fas fa-university', to: '/dashboard/vaultpartner/bank/products' },
    { title: 'Commission',    icon: 'fas fa-percentage', to: '/dashboard/vaultpartner/commission' },
    { title: 'Analytics',     icon: 'fas fa-chart-bar',  to: '/dashboard/vaultpartner/analytics' },
    { title: 'Notifications', icon: 'fas fa-bell',       to: '/dashboard/vaultpartner/notifications' },
  ],

  // ── Partner fallback while partnerCategory loads ──────────────────────────
  '21': [
    {
      title: 'Lead Management', icon: 'fas fa-filter',
      submenus: [
        { title: 'Create Lead', to: '/dashboard/vaultpartner/leads/partner/create' },
        { title: 'All Leads',   to: '/dashboard/vaultpartner/partner-leads' },
      ],
    },
    { title: 'Bank Products', icon: 'fas fa-university', to: '/dashboard/vaultpartner/bank/products' },
    { title: 'Commission',    icon: 'fas fa-percentage', to: '/dashboard/vaultpartner/commission' },
    {
      title: 'Proposals', icon: 'fas fa-folder-open',
      submenus: [
        { title: 'My Proposals',    to: '/dashboard/vaultpartner/proposals/list' },
        { title: 'Create Proposal', to: '/dashboard/vaultpartner/proposals/create' },
      ],
    },
    {
      title: 'Applications', icon: 'fas fa-briefcase',
      submenus: [
        { title: 'Create Application', to: '/dashboard/vaultpartner/case/create' },
        { title: 'My Applications',    to: '/dashboard/vaultpartner/case/view' },
      ],
    },
    { title: 'Notifications', icon: 'fas fa-bell', to: '/dashboard/vaultpartner/notifications' },
  ],

  // ── Mortgage Ops (23) ─────────────────────────────────────────────────────
  '23': [
    {
      title: 'Applications', icon: 'fas fa-briefcase',
      submenus: [
        { title: 'Queue Applications',    to: '/dashboard/vault-ops/case/queue/view' },
        { title: 'My Assigned Applications', to: '/dashboard/vault-ops/case/assigned/all' },
        { title: 'Bank Submission Queue', to: '/dashboard/vault-ops/case/bank-submission' },
        { title: 'Returned Applications', to: '/dashboard/vault-ops/case/returned' },
        { title: 'Disbursed Applications', to: '/dashboard/vault-ops/case/disbursed' },
      ],
    },
    { title: 'Notifications', icon: 'fas fa-bell',       to: '/dashboard/vault-ops/notifications' },
    { title: 'Audit Logs',    icon: 'fas fa-shield-alt', to: '/dashboard/vault-ops/audit' },
  ],

  // ── Xoto Advisor (26) ─────────────────────────────────────────────────────
  '26': [
    {
      title: 'Lead Management', icon: 'fas fa-filter',
      submenus: [
        { title: 'My Leads', to: '/dashboard/vault-advisor/leads' },
      ],
    },
    {
      title: 'Proposals', icon: 'fas fa-folder-open',
      submenus: [
        { title: 'My Proposals',    to: '/dashboard/vault-advisor/proposals/list' },
        { title: 'Create Proposal', to: '/dashboard/vault-advisor/proposals/create' },
      ],
    },
    {
      title: 'Applications', icon: 'fas fa-briefcase',
      submenus: [
        { title: 'Create Application', to: '/dashboard/vault-advisor/case/create' },
        { title: 'My Applications',    to: '/dashboard/vault-advisor/case/view' },
      ],
    },
    { title: 'Bank Products', icon: 'fas fa-university', to: '/dashboard/vault-advisor/bank/products' },
    { title: 'Notifications', icon: 'fas fa-bell',       to: '/dashboard/vault-advisor/notifications' },
  ],
};

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, mobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((s: RootState) => s.auth);
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [partnerCategory, setPartnerCategory] = useState<string | null>(null);
  const [agentType, setAgentType] = useState<string | null>(null);

  const roleCode = user?.role
    ? typeof user.role === 'object' ? String(user.role.code) : String(user.role)
    : '18';

  const roleSlug = VAULT_ROLE_SLUG_MAP[roleCode] ?? 'vault-admin';
  
  const getDisplayName = () => {
    if (roleCode === '22') {
      return agentType === 'ReferralPartner' ? 'Referral Partner' : 'Affiliated Agent';
    }
    return typeof user?.role === 'object' ? user.role.name : roleSlug.replace(/-/g, ' ');
  };

  const displayName = getDisplayName();

  // Close mobile drawer on route change
  useEffect(() => { onCloseMobile(); }, [location.pathname]);

  // Fetch profile data for specialized roles
  useEffect(() => {
    if (!token || (roleCode !== '21' && roleCode !== '22')) return;
    apiService
      .get<{ data?: { partnerCategory?: string; agentType?: string } }>('/profile/get-profile-data')
      .then((res) => {
        if (roleCode === '21') {
          setPartnerCategory(res?.data?.partnerCategory?.toLowerCase() ?? null);
        }
        if (roleCode === '22') {
          setAgentType(res?.data?.agentType ?? null);
        }
      })
      .catch(() => {
        setPartnerCategory(null);
        setAgentType(null);
      });
  }, [roleCode, token]);

  const navItems = useMemo(() => {
    const dashboardItem: MenuItem = { title: 'Dashboard', icon: 'fas fa-home', to: `/dashboard/${roleSlug}` };
    let items: MenuItem[];

    if (roleCode === '21' && partnerCategory) {
      const key = partnerCategory === 'individual' ? '21_individual' : '21_company';
      items = VAULT_NAV[key] ?? VAULT_NAV['21'] ?? [];
    } else if (roleCode === '22' && agentType) {
      // Pick nav based on agent sub-type
      const key = agentType === 'PartnerAffiliatedAgent' ? '22_affiliated' : '22_referral';
      items = VAULT_NAV[key] ?? VAULT_NAV['22'] ?? [];
    } else {
      items = VAULT_NAV[roleCode] ?? [];
    }

    return [dashboardItem, ...items];
  }, [roleCode, roleSlug, partnerCategory, agentType]);

  // Auto-expand the parent whose submenu matches the current route
  useEffect(() => {
    const activeParent = navItems.find(item =>
      item.submenus?.some(sub => location.pathname.startsWith(sub.to))
    );
    if (activeParent) setOpenModule(activeParent.title);
  }, [location.pathname, navItems]);

  const handleLogout = async () => {
    await dispatch(logoutUser(undefined));
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const isParentActive = (item: MenuItem) =>
    item.submenus?.some(s => location.pathname.startsWith(s.to)) ?? false;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          transition-all duration-300 ease-in-out overflow-hidden
          ${mobileOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-72'}
        `}
        style={{
          background: 'linear-gradient(180deg, #12052a 0%, #1e0b3a 40%, #150828 100%)',
          borderRight: '1px solid rgba(139,92,246,0.2)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
        }}
      >
        <style>{`
          .sb-scroll::-webkit-scrollbar { width: 3px; }
          .sb-scroll::-webkit-scrollbar-track { background: transparent; }
          .sb-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 99px; }
          .sb-scroll { scrollbar-width: thin; scrollbar-color: rgba(139,92,246,0.3) transparent; }
        `}</style>

        {/* ── Logo + Role ──────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 relative flex flex-col items-center"
          style={{
            padding: collapsed ? '14px 0 10px' : '20px 0 14px',
            borderBottom: '1px solid rgba(139,92,246,0.15)',
          }}
        >
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg"
              style={{ color: 'rgba(196,167,255,0.7)', background: 'rgba(139,92,246,0.1)' }}
            >
              <FiX size={16} />
            </button>
          )}

          {/* Vault logo — big & centered */}
          <img
            src="/vault-logo.png"
            alt="Xoto Vault"
            style={{
              width:  collapsed ? 44 : 110,
              height: collapsed ? 44 : 110,
              objectFit: 'contain',
              display: 'block',
              transition: 'all 0.3s',
            }}
          />

          {/* Role name — only when expanded */}
          {!collapsed && (
            <div style={{
              marginTop: 8, fontSize: 11, fontWeight: 700,
              color: 'rgba(196,167,255,0.6)',
              textTransform: 'capitalize', letterSpacing: 0.4,
              textAlign: 'center',
            }}>
              {displayName}
            </div>
          )}
        </div>

        {/* ── User Card ─────────────────────────────────────────────────── */}
        {/* {!collapsed && (
          <div
            className="flex-shrink-0 mx-3 my-3 px-3 py-3 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold"
              style={{
                width: 36, height: 36, fontSize: 14,
                background: 'linear-gradient(135deg, #5C039B, #03A4F4)',
              }}
            >
              {(user?.name || displayName).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e9d5ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || displayName}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(196,167,255,0.55)', marginTop: 1, textTransform: 'capitalize' }}>
                {displayName}
              </div>
            </div>
            {roleCode === '21' && partnerCategory && (
              <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(139,92,246,0.3)', color: '#c4b5fd', padding: '2px 6px', borderRadius: 99, textTransform: 'capitalize', flexShrink: 0 }}>
                {partnerCategory}
              </span>
            )}
            {roleCode === '22' && agentType && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, flexShrink: 0,
                background: agentType === 'PartnerAffiliatedAgent' ? 'rgba(3,164,244,0.25)' : 'rgba(16,185,129,0.25)',
                color:      agentType === 'PartnerAffiliatedAgent' ? '#7dd3fc'              : '#6ee7b7',
              }}>
                {agentType === 'PartnerAffiliatedAgent' ? 'Affiliated' : 'Referral'}
              </span>
            )}
          </div>
        )} */}

        {/* ── Nav ──────────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto sb-scroll px-2.5 pb-4 space-y-0.5">
          {navItems.map((item, idx) => {
            const hasSub = !!item.submenus?.length;
            const expanded = openModule === item.title;
            const parentActive = hasSub ? isParentActive(item) : false;
            // Dashboard uses exact match; all others use startsWith via NavLink
            const isDashboard = idx === 0;

            if (!hasSub) {
              return (
                <NavLink
                  key={item.title}
                  to={item.to!}
                  end={isDashboard}
                  title={collapsed ? item.title : undefined}
                  className={({ isActive }) => {
                    const on = isActive;
                    return [
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group',
                      on
                        ? 'text-white'
                        : 'text-purple-300/60 hover:text-white hover:bg-white/5',
                      collapsed ? 'justify-center' : '',
                    ].join(' ');
                  }}
                  style={({ isActive }) => isActive ? {
                    background: 'linear-gradient(135deg, rgba(92,3,155,0.85), rgba(124,58,237,0.7))',
                    boxShadow: '0 2px 12px rgba(92,3,155,0.4)',
                    border: '1px solid rgba(139,92,246,0.35)',
                  } : { border: '1px solid transparent' }}
                >
                  <i
                    className={`${item.icon} text-[14px] flex-shrink-0`}
                    style={{ width: 18, textAlign: 'center' }}
                  />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </NavLink>
              );
            }

            // Parent with submenus
            return (
              <div key={item.title}>
                <button
                  onClick={() => setOpenModule(expanded ? null : item.title)}
                  title={collapsed ? item.title : undefined}
                  className={[
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200',
                    parentActive
                      ? 'text-white'
                      : expanded
                        ? 'text-purple-200 bg-white/5'
                        : 'text-purple-300/60 hover:text-white hover:bg-white/5',
                    collapsed ? 'justify-center' : '',
                  ].join(' ')}
                  style={parentActive ? {
                    background: 'linear-gradient(135deg, rgba(92,3,155,0.7), rgba(124,58,237,0.5))',
                    border: '1px solid rgba(139,92,246,0.3)',
                  } : { border: '1px solid transparent' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <i
                      className={`${item.icon} text-[14px] flex-shrink-0`}
                      style={{ width: 18, textAlign: 'center' }}
                    />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </div>
                  {!collapsed && (
                    <FiChevronDown
                      size={13}
                      className="flex-shrink-0 transition-transform duration-200"
                      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.6 }}
                    />
                  )}
                </button>

                {expanded && !collapsed && (
                  <div
                    className="mt-0.5 mb-1 ml-4 pl-3 space-y-0.5"
                    style={{ borderLeft: '1.5px solid rgba(139,92,246,0.25)' }}
                  >
                    {item.submenus!.map(sub => (
                      <NavLink
                        key={sub.to}
                        to={sub.to}
                        className={({ isActive }) => [
                          'flex items-center gap-2 py-2 px-3 rounded-lg text-[11.5px] leading-snug transition-all duration-150 whitespace-normal',
                          isActive
                            ? 'text-white font-semibold'
                            : 'text-purple-300/50 font-medium hover:text-white hover:bg-white/5',
                        ].join(' ')}
                        style={({ isActive }) => isActive ? {
                          background: 'rgba(139,92,246,0.25)',
                          border: '1px solid rgba(139,92,246,0.3)',
                        } : { border: '1px solid transparent' }}
                      >
                        <span
                          className="flex-shrink-0 rounded-full"
                          style={{
                            width: 5, height: 5,
                            background: 'currentColor',
                            opacity: 0.6,
                          }}
                        />
                        {sub.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Logout ───────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 px-2.5 py-3"
          style={{ borderTop: '1px solid rgba(139,92,246,0.15)' }}
        >
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200',
              'text-red-400/70 hover:text-red-300 hover:bg-red-900/20',
              collapsed ? 'justify-center' : '',
            ].join(' ')}
            style={{ border: '1px solid transparent' }}
          >
            <FiLogOut size={15} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          {!collapsed && (
            <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(139,92,246,0.35)', marginTop: 8, letterSpacing: 1 }}>
              v1.0.0
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
