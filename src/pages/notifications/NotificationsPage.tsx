import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import {
  FiBell, FiCheck, FiCheckCircle, FiFilter, FiRefreshCw, FiInbox,
} from 'react-icons/fi';
import type { RootState } from '../../store/store';
import { EVENT_META, getMeta, timeAgo } from '../../components/common/VaultNotificationBell';
import type { VaultNotification } from '../../hooks/useVaultSocket';
import { useVaultSocket } from '../../hooks/useVaultSocket';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://xoto.ae/api';

const PAGE_SIZE = 20;

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  ...Object.entries(EVENT_META).map(([value, meta]) => ({ value, label: meta.label })),
];

// ── Full-page notification row ────────────────────────────────────────
const FullNotifRow: React.FC<{
  n: VaultNotification;
  onRead: (id: string) => void;
}> = ({ n, onRead }) => {
  const meta = getMeta(n.eventType);
  return (
    <div
      onClick={() => !n.isRead && onRead(n._id)}
      className={`flex gap-4 px-5 py-4 border-b border-gray-100 transition-colors ${
        n.isRead ? 'bg-white' : 'bg-violet-50/40'
      } hover:bg-violet-50 cursor-pointer`}
    >
      {/* Colour badge */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{ width: 42, height: 42, background: meta.bg }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, color: meta.color }}>
          {meta.label.slice(0, 2).toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: meta.color }}
              >
                {meta.label}
              </span>
              {!n.isRead && (
                <span
                  className="text-xs font-semibold rounded-full px-2 py-0.5"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  New
                </span>
              )}
            </div>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#111827' }}>
              {n.title}
            </p>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
              {n.message}
            </p>
            {n.createdByName && (
              <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                By {n.createdByName}
                {n.createdByRole ? ` · ${n.createdByRole.replace(/_/g, ' ')}` : ''}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-xs" style={{ color: '#9ca3af' }}>
              {timeAgo(n.createdAt)}
            </span>
            <span className="text-xs" style={{ color: '#d1d5db' }}>
              {new Date(n.createdAt).toLocaleDateString('en-AE', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main notifications page ───────────────────────────────────────────
const NotificationsPage: React.FC = () => {
  const { markRead, markAllRead, unreadCount, connected } = useVaultSocket();

  const [notifications, setNotifications] = useState<VaultNotification[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [filter,   setFilter]   = useState('');         // eventType filter
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { user } = useSelector((s: RootState) => s.auth);

  const fetchNotifications = useCallback(async (p = 1, reset = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('vault_token');
      const params: Record<string, unknown> = { page: p, limit: PAGE_SIZE };
      if (filter)                        params.eventType = filter;
      if (readFilter === 'unread')       params.isRead = false;
      else if (readFilter === 'read')    params.isRead = true;

      const res = await axios.get(`${API_BASE}/vault/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      const data: VaultNotification[] = res.data?.data || [];
      setTotal(res.data?.total || 0);
      setNotifications(prev => (reset || p === 1) ? data : [...prev, ...data]);
    } catch {
      // handled by axios interceptor
    } finally {
      setLoading(false);
    }
  }, [filter, readFilter]);

  useEffect(() => {
    setPage(1);
    fetchNotifications(1, true);
  }, [filter, readFilter, fetchNotifications]);

  useEffect(() => {
    const handleNewNotif = (e: Event) => {
      const latest = (e as CustomEvent<VaultNotification>).detail;
      setNotifications(prev => {
        if (prev.some(n => n._id === latest._id)) return prev;

        // Check if the event type matches filter
        if (filter && latest.eventType !== filter) return prev;
        // Check read filter
        if (readFilter === 'read' && !latest.isRead) return prev;
        if (readFilter === 'unread' && latest.isRead) return prev;

        setTotal(t => t + 1);
        return [latest, ...prev];
      });
    };

    window.addEventListener('vault:new-notification', handleNewNotif);
    return () => window.removeEventListener('vault:new-notification', handleNewNotif);
  }, [filter, readFilter]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNotifications(next, false);
  };

  const handleMarkRead = async (id: string) => {
    await markRead(id);
    setNotifications(prev => prev.map(n => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const hasMore = notifications.length < total;

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Page Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{
                width: 40, height: 40,
                background: 'linear-gradient(135deg, #5C039B, #03A4F4)',
                boxShadow: '0 2px 12px rgba(92,3,155,0.25)',
              }}
            >
              <FiBell size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#111827' }}>
                Notifications
              </h1>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                All vault activity events · {connected
                  ? <span style={{ color: '#22c55e' }}>● live</span>
                  : <span style={{ color: '#d1d5db' }}>● offline</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-violet-50"
              style={{ borderColor: '#7c3aed', color: '#7c3aed' }}
            >
              <FiCheckCircle size={14} />
              Mark all read
            </button>
          )}
          <button
            onClick={() => fetchNotifications(1, true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div
        className="grid grid-cols-3 gap-3 mb-5 p-4 rounded-2xl border border-gray-100"
        style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        {[
          { label: 'Total',  value: total,        color: '#5C039B' },
          { label: 'Unread', value: unreadCount,   color: '#ef4444' },
          { label: 'Read',   value: total - unreadCount < 0 ? 0 : total - unreadCount, color: '#22c55e' },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <div className="text-2xl font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs mt-0.5 font-medium" style={{ color: '#9ca3af' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div
        className="flex gap-3 mb-4 flex-wrap items-center p-3 rounded-xl border border-gray-100"
        style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        <FiFilter size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />

        {/* Read/unread filter */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {(['all', 'unread', 'read'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setReadFilter(opt)}
              className="px-3 py-1.5 text-xs font-medium capitalize transition-colors"
              style={{
                background: readFilter === opt ? '#5C039B' : '#fff',
                color:      readFilter === opt ? '#fff'     : '#6b7280',
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Event type filter */}
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 outline-none"
          style={{ color: '#374151', background: '#fff' }}
        >
          {EVENT_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {(filter || readFilter !== 'all') && (
          <button
            onClick={() => { setFilter(''); setReadFilter('all'); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs" style={{ color: '#9ca3af' }}>
          {total} result{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Notification list ── */}
      <div
        className="rounded-2xl border border-gray-100 overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
      >
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div
              className="w-10 h-10 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin"
            />
            <p className="text-sm" style={{ color: '#9ca3af' }}>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 60, height: 60, background: '#f3f4f6' }}
            >
              <FiInbox size={28} style={{ color: '#d1d5db' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: '#9ca3af' }}>
                No notifications
              </p>
              <p className="text-xs mt-1" style={{ color: '#d1d5db' }}>
                {filter || readFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Vault events will appear here'}
              </p>
            </div>
          </div>
        ) : (
          notifications.map(n => (
            <FullNotifRow key={n._id} n={n} onRead={handleMarkRead} />
          ))
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="flex justify-center py-4 border-t border-gray-100">
            <button
              onClick={handleLoadMore}
              className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Load more ({total - notifications.length} remaining)
            </button>
          </div>
        )}

        {loading && notifications.length > 0 && (
          <div className="flex justify-center py-4 border-t border-gray-100">
            <div className="w-5 h-5 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin" />
          </div>
        )}
      </div>

    </div>
  );
};

export default NotificationsPage;
