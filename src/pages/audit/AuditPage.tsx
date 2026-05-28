import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  FiShield, FiRefreshCw, FiFilter, FiSearch, FiChevronDown, FiChevronUp,
  FiUser, FiFile, FiDollarSign, FiLock, FiActivity, FiAlertCircle,
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : 'http://localhost:5000/api';

const PAGE_SIZE = 25;

// ── Entity type config ─────────────────────────────────────────────
const ENTITY_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  LEAD:        { color: '#7c3aed', bg: '#f5f3ff', icon: <FiUser size={13} />,      label: 'Lead' },
  CASE:        { color: '#dc2626', bg: '#fef2f2', icon: <FiFile size={13} />,      label: 'Case' },
  APPLICATION: { color: '#ea580c', bg: '#fff7ed', icon: <FiActivity size={13} />,  label: 'Application' },
  DOCUMENT:    { color: '#0891b2', bg: '#ecfeff', icon: <FiFile size={13} />,      label: 'Document' },
  COMMISSION:  { color: '#15803d', bg: '#f0fdf4', icon: <FiDollarSign size={13} />,label: 'Commission' },
  USER:        { color: '#6b7280', bg: '#f9fafb', icon: <FiLock size={13} />,      label: 'User/Security' },
  OPS:         { color: '#0284c7', bg: '#f0f9ff', icon: <FiAlertCircle size={13} />,label: 'Ops' },
  PARTNER:     { color: '#d97706', bg: '#fffbeb', icon: <FiUser size={13} />,      label: 'Partner' },
  AGENT:       { color: '#4f46e5', bg: '#eef2ff', icon: <FiUser size={13} />,      label: 'Agent' },
  SYSTEM:      { color: '#9ca3af', bg: '#f3f4f6', icon: <FiShield size={13} />,    label: 'System' },
};

const getEntityCfg = (t: string) =>
  ENTITY_CONFIG[t] ?? { color: '#6b7280', bg: '#f9fafb', icon: <FiShield size={13} />, label: t };

const ROLE_COLORS: Record<string, string> = {
  admin:                   '#5C039B',
  advisor:                 '#2563eb',
  partner:                 '#d97706',
  ops:                     '#0284c7',
  referral_partner:        '#7c3aed',
  partner_affiliated_agent:'#0891b2',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-AE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const ENTITY_TYPES = ['', 'LEAD', 'CASE', 'APPLICATION', 'DOCUMENT', 'COMMISSION', 'USER', 'OPS', 'PARTNER', 'AGENT', 'SYSTEM'];

// ── Expandable JSON diff ───────────────────────────────────────────
const JsonDiff: React.FC<{ label: string; value: unknown; color?: string }> = ({ label, value, color = '#374151' }) => {
  const [open, setOpen] = useState(false);
  if (!value) return null;
  const str = JSON.stringify(value, null, 2);
  return (
    <div className="mt-1">
      <button
        onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        className="flex items-center gap-1 text-xs font-medium"
        style={{ color }}
      >
        {open ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
        {label}
      </button>
      {open && (
        <pre
          className="mt-1 p-2 rounded-lg text-xs overflow-auto"
          style={{ background: '#f8fafc', color: '#334155', maxHeight: 200, border: '1px solid #e2e8f0' }}
        >
          {str}
        </pre>
      )}
    </div>
  );
};

// ── Single audit log row ───────────────────────────────────────────
const AuditRow: React.FC<{ log: Record<string, unknown> }> = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = getEntityCfg(log.entityType as string);
  const roleColor = ROLE_COLORS[log.performedByRole as string] ?? '#6b7280';

  return (
    <div
      className="border-b border-gray-100 transition-colors hover:bg-gray-50 cursor-pointer"
      onClick={() => setExpanded(p => !p)}
    >
      {/* Main row */}
      <div className="flex gap-3 px-5 py-3.5 items-start">
        {/* Entity badge */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-lg mt-0.5"
          style={{ width: 32, height: 32, background: cfg.bg, color: cfg.color }}
        >
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            <span
              className="text-xs font-semibold rounded-md px-2 py-0.5"
              style={{ background: '#f1f5f9', color: '#334155' }}
            >
              {String(log.action ?? '').replace(/_/g, ' ')}
            </span>
            {log.entityRef && (
              <span className="text-xs font-mono" style={{ color: '#7c3aed' }}>
                #{String(log.entityRef)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {log.performedByName && (
              <span className="text-xs font-medium" style={{ color: '#111827' }}>
                {String(log.performedByName)}
              </span>
            )}
            {log.performedByRole && (
              <span
                className="text-xs font-semibold rounded-full px-2 py-0.5"
                style={{ background: `${roleColor}15`, color: roleColor }}
              >
                {String(log.performedByRole).replace(/_/g, ' ')}
              </span>
            )}
            {log.ipAddress && (
              <span className="text-xs" style={{ color: '#9ca3af' }}>
                {String(log.ipAddress)}
              </span>
            )}
          </div>

          {/* Expanded details */}
          {expanded && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <JsonDiff label="Old value" value={log.oldValue} color="#dc2626" />
              <JsonDiff label="New value" value={log.newValue} color="#16a34a" />
              <JsonDiff label="Metadata"  value={log.metadata}  color="#7c3aed" />
              {log.entityId && (
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                  Entity ID: <span className="font-mono">{String(log.entityId)}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="flex-shrink-0 text-right">
          <p className="text-xs" style={{ color: '#6b7280' }}>
            {fmtDate(String(log.createdAt ?? log.timestamp ?? ''))}
          </p>
          <p className="text-xs mt-0.5 flex items-center justify-end gap-1" style={{ color: '#9ca3af' }}>
            {expanded ? <FiChevronUp size={10} /> : <FiChevronDown size={10} />}
            {expanded ? 'Collapse' : 'Details'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Stats card ─────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div
    className="rounded-xl p-4 border border-gray-100"
    style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
  >
    <div className="text-2xl font-extrabold" style={{ color }}>{value.toLocaleString()}</div>
    <div className="text-xs mt-0.5 font-medium" style={{ color: '#9ca3af' }}>{label}</div>
  </div>
);

// ── Main audit page ─────────────────────────────────────────────────
const AuditPage: React.FC = () => {
  const authUser = useSelector((state: any) => state.auth.user);
  const roleCode = authUser?.role && typeof authUser.role === 'object'
    ? String(authUser.role.code)
    : String(authUser?.role ?? '');
  const isAdmin = roleCode === '18';

  const [logs,    setLogs]    = useState<Record<string, unknown>[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [stats,   setStats]   = useState<{ totalLogs: number; byEntity: { _id: string; count: number }[]; byRole: { _id: string; count: number }[] } | null>(null);

  const [entityType,   setEntityType]   = useState('');
  const [action,       setAction]       = useState('');
  const [performedByRole, setPerformedByRole] = useState('');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');

  const fetchLogs = useCallback(async (p = 1, reset = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('vault_token');
      const params: Record<string, unknown> = { page: p, limit: PAGE_SIZE };
      if (entityType)      params.entityType      = entityType;
      if (action)          params.action          = action;
      if (performedByRole) params.performedByRole = performedByRole;
      if (dateFrom)        params.dateFrom        = dateFrom;
      if (dateTo)          params.dateTo          = dateTo;

      const res = await axios.get(`${API_BASE}/vault/audit`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('vault_token')}` },
        params,
      });
      setTotal(res.data?.total || 0);
      const data = res.data?.data || [];
      setLogs(prev => (reset || p === 1) ? data : [...prev, ...data]);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [entityType, action, performedByRole, dateFrom, dateTo]);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await axios.get(`${API_BASE}/vault/audit/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('vault_token')}` },
        params: dateFrom || dateTo ? { dateFrom, dateTo } : {},
      });
      if (res.data?.data) setStats(res.data.data);
    } catch { /* non-fatal */ }
  }, [isAdmin, dateFrom, dateTo]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1, true);
    fetchStats();
  }, [entityType, action, performedByRole, dateFrom, dateTo, fetchLogs, fetchStats]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchLogs(next, false);
  };

  const clearFilters = () => {
    setEntityType('');
    setAction('');
    setPerformedByRole('');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = entityType || action || performedByRole || dateFrom || dateTo;
  const hasMore    = logs.length < total;

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 42, height: 42,
              background: 'linear-gradient(135deg, #5C039B, #03A4F4)',
              boxShadow: '0 2px 12px rgba(92,3,155,0.25)',
            }}
          >
            <FiShield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Audit Logs</h1>
            <p className="text-xs" style={{ color: '#9ca3af' }}>
              Role-based activity trail — {total.toLocaleString()} total entries
            </p>
          </div>
        </div>
        <button
          onClick={() => { fetchLogs(1, true); fetchStats(); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <FiRefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* ── Stats (admin only — hidden if API returns 403) ── */}
      {stats && (
        <div className="mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <StatCard label="Total Logs"  value={stats.totalLogs} color="#5C039B" />
            {stats.byEntity.slice(0, 3).map(e => {
              const cfg = getEntityCfg(e._id);
              return <StatCard key={e._id} label={cfg.label} value={e.count} color={cfg.color} />;
            })}
          </div>

          {/* By role mini pills */}
          <div className="flex flex-wrap gap-2">
            {stats.byRole.map(r => (
              <button
                key={r._id}
                onClick={() => setPerformedByRole(performedByRole === r._id ? '' : r._id)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                style={{
                  background: performedByRole === r._id ? `${ROLE_COLORS[r._id] ?? '#6b7280'}15` : '#fff',
                  borderColor: performedByRole === r._id ? (ROLE_COLORS[r._id] ?? '#6b7280') : '#e5e7eb',
                  color: ROLE_COLORS[r._id] ?? '#6b7280',
                }}
              >
                {String(r._id || 'system').replace(/_/g, ' ')}
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                  style={{ background: ROLE_COLORS[r._id] ?? '#6b7280', color: '#fff', fontSize: 9 }}
                >
                  {r.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div
        className="p-4 rounded-xl border border-gray-100 mb-4"
        style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <FiFilter size={13} style={{ color: '#9ca3af' }} />
          <span className="text-xs font-semibold" style={{ color: '#374151' }}>Filters</span>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-violet-600 hover:text-violet-800 underline ml-2">
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Entity type */}
          <select
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            className="text-xs rounded-lg border border-gray-200 px-2.5 py-2 outline-none col-span-1"
            style={{ color: '#374151' }}
          >
            {ENTITY_TYPES.map(t => (
              <option key={t} value={t}>{t || 'All Entity Types'}</option>
            ))}
          </select>

          {/* Action search */}
          <div className="relative col-span-1">
            <FiSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
            <input
              value={action}
              onChange={e => setAction(e.target.value.toUpperCase())}
              placeholder="Action (e.g. LEAD_CREATED)"
              className="w-full text-xs rounded-lg border border-gray-200 pl-7 pr-2.5 py-2 outline-none"
              style={{ color: '#374151' }}
            />
          </div>

          {/* Role */}
          <select
            value={performedByRole}
            onChange={e => setPerformedByRole(e.target.value)}
            className="text-xs rounded-lg border border-gray-200 px-2.5 py-2 outline-none col-span-1"
            style={{ color: '#374151' }}
          >
            {['', 'admin', 'advisor', 'partner', 'ops', 'referral_partner', 'partner_affiliated_agent'].map(r => (
              <option key={r} value={r}>{r ? r.replace(/_/g, ' ') : 'All Roles'}</option>
            ))}
          </select>

          {/* Date from */}
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="text-xs rounded-lg border border-gray-200 px-2.5 py-2 outline-none col-span-1"
            style={{ color: '#374151' }}
          />

          {/* Date to */}
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="text-xs rounded-lg border border-gray-200 px-2.5 py-2 outline-none col-span-1"
            style={{ color: '#374151' }}
          />
        </div>
      </div>

      {/* ── Log list ── */}
      <div
        className="rounded-2xl border border-gray-100 overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
      >
        {/* Table header */}
        <div
          className="flex items-center px-5 py-2.5 border-b border-gray-100"
          style={{ background: '#f8fafc' }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
            {loading ? 'Loading...' : `${total.toLocaleString()} log${total !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin" />
            <p className="text-sm" style={{ color: '#9ca3af' }}>Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex items-center justify-center rounded-2xl"
              style={{ width: 60, height: 60, background: '#f3f4f6' }}>
              <FiShield size={28} style={{ color: '#d1d5db' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: '#9ca3af' }}>No audit logs found</p>
            <p className="text-xs" style={{ color: '#d1d5db' }}>
              {hasFilters ? 'Try adjusting your filters' : 'Audit entries will appear here as actions are performed'}
            </p>
          </div>
        ) : (
          logs.map((log, i) => <AuditRow key={String(log._id ?? i)} log={log} />)
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="flex justify-center py-4 border-t border-gray-100">
            <button
              onClick={handleLoadMore}
              className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Load more ({(total - logs.length).toLocaleString()} remaining)
            </button>
          </div>
        )}

        {loading && logs.length > 0 && (
          <div className="flex justify-center py-4 border-t border-gray-100">
            <div className="w-5 h-5 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditPage;
