import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiBell, FiX, FiCheck, FiCheckCircle, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { useVaultSocket, type VaultNotification } from '../../hooks/useVaultSocket';
import type { RootState } from '../../store/store';
import { VAULT_ROLE_SLUG_MAP } from '../../types/auth';

// ── Event type → color + label ─────────────────────────────────────────
export const EVENT_META: Record<string, { color: string; bg: string; label: string }> = {
  LEAD_CREATED:         { color: '#7c3aed', bg: '#f5f3ff', label: 'New Lead' },
  LEAD_CREATED_WEBSITE: { color: '#2563eb', bg: '#eff6ff', label: 'Website Lead' },
  LEAD_CREATED_PARTNER: { color: '#0891b2', bg: '#ecfeff', label: 'Partner Lead' },
  LEAD_CREATED_ADMIN:   { color: '#4f46e5', bg: '#eef2ff', label: 'Admin Lead' },
  LEAD_ASSIGNED:        { color: '#d97706', bg: '#fffbeb', label: 'Lead Assigned' },
  LEAD_STATUS_UPDATED:  { color: '#059669', bg: '#ecfdf5', label: 'Lead Updated' },
  PROPOSAL_CREATED:     { color: '#7c3aed', bg: '#faf5ff', label: 'Proposal' },
  CASE_CREATED:         { color: '#dc2626', bg: '#fef2f2', label: 'New Case' },
  CASE_SUBMITTED:       { color: '#ea580c', bg: '#fff7ed', label: 'Case Submitted' },
  CASE_PICKED_UP:       { color: '#0284c7', bg: '#f0f9ff', label: 'Case Picked Up' },
  CASE_ASSIGNED_TO_OPS: { color: '#7c3aed', bg: '#f5f3ff', label: 'Ops Assigned' },
  CASE_STATUS_UPDATED:  { color: '#0f766e', bg: '#f0fdfa', label: 'Case Updated' },
  COMMISSION_CREATED:   { color: '#15803d', bg: '#f0fdf4', label: 'Commission' },
  COMMISSION_CONFIRMED: { color: '#1d4ed8', bg: '#eff6ff', label: 'Confirmed' },
  COMMISSION_PAID:      { color: '#166534', bg: '#dcfce7', label: 'Paid ✓' },
};

export const getMeta = (eventType: string) =>
  EVENT_META[eventType] ?? { color: '#6b7280', bg: '#f9fafb', label: eventType };

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Single notification row ─────────────────────────────────────────────
export const NotifRow: React.FC<{
  n: VaultNotification;
  onRead: (id: string) => void;
}> = ({ n, onRead }) => {
  const meta = getMeta(n.eventType);
  return (
    <div
      onClick={() => !n.isRead && onRead(n._id)}
      className="flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors"
      style={{ background: n.isRead ? '#fff' : '#fafafa' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f5f3ff')}
      onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? '#fff' : '#fafafa')}
    >
      {/* Badge */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-lg mt-0.5"
        style={{ width: 34, height: 34, background: meta.bg }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: meta.color }}>
          {meta.label.slice(0, 2).toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-semibold truncate" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-xs flex-shrink-0" style={{ color: '#9ca3af' }}>
            {timeAgo(n.createdAt)}
          </span>
        </div>
        <p className="text-xs font-medium mt-0.5 truncate" style={{ color: '#111827' }}>
          {n.title}
        </p>
        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#6b7280' }}>
          {n.message}
        </p>
        {!n.isRead && (
          <span
            className="inline-block mt-1 rounded-full"
            style={{ width: 6, height: 6, background: meta.color }}
          />
        )}
      </div>
    </div>
  );
};

// ── Main bell component ─────────────────────────────────────────────────
const VaultNotificationBell: React.FC = () => {
  const { notifications, unreadCount, connected, markRead, markAllRead, clearAll, refresh } =
    useVaultSocket();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { user } = useSelector((s: RootState) => s.auth);
  const roleCode = user?.role
    ? typeof user.role === 'object' ? String((user.role as { code: string }).code) : String(user.role)
    : '18';
  const slug = VAULT_ROLE_SLUG_MAP[roleCode] ?? 'vault-admin';

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleViewAll = () => {
    setOpen(false);
    if (slug === 'vault-admin') {
      navigate('/dashboard/vault-admin/platform-config');
    } else {
      navigate(`/dashboard/${slug}/notifications`);
    }
  };

  // Show max 8 in dropdown preview
  const previewList = notifications.slice(0, 8);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(p => !p)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        title={connected ? 'Live notifications' : 'Connecting...'}
      >
        <FiBell size={19} />

        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center rounded-full text-white font-bold"
            style={{
              minWidth: 16, height: 16, fontSize: 9, lineHeight: 1,
              background: '#ef4444', border: '1.5px solid #fff',
              padding: '0 3px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {unreadCount === 0 && (
          <span
            className="absolute top-1.5 right-1.5 rounded-full"
            style={{
              width: 7, height: 7,
              background: connected ? '#22c55e' : '#d1d5db',
              border: '1.5px solid #fff',
            }}
          />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 mt-2 rounded-xl overflow-hidden"
          style={{
            width: 360, zIndex: 9999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            border: '1px solid #e5e7eb',
            background: '#fff',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #5C039B, #03A4F4)' }}
          >
            <div className="flex items-center gap-2">
              <FiBell size={15} className="text-white" />
              <span className="text-sm font-semibold text-white">Vault Notifications</span>
              {unreadCount > 0 && (
                <span
                  className="text-xs font-bold rounded-full px-1.5 py-0.5"
                  style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={refresh}
                title="Refresh"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <FiRefreshCw size={13} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all read"
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FiCheckCircle size={14} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  title="Clear all"
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* List (max 8 preview) */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {previewList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 48, height: 48, background: '#f3f4f6' }}
                >
                  <FiBell size={22} style={{ color: '#d1d5db' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>
                  No notifications yet
                </p>
                <p className="text-xs" style={{ color: '#d1d5db' }}>
                  {connected ? 'Listening for vault events...' : 'Connecting to server...'}
                </p>
              </div>
            ) : (
              previewList.map(n => (
                <NotifRow key={n._id} n={n} onRead={markRead} />
              ))
            )}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between"
            style={{ background: '#fafafa' }}
          >
            <span className="text-xs" style={{ color: '#9ca3af' }}>
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              {connected && <span className="ml-2" style={{ color: '#22c55e' }}>● live</span>}
            </span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: '#7c3aed' }}
                >
                  <FiCheck size={11} /> Mark all read
                </button>
              )}
              <button
                onClick={handleViewAll}
                className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                style={{ color: '#5C039B' }}
              >
                View all <FiArrowRight size={11} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultNotificationBell;
