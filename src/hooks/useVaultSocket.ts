import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import axios from 'axios';

export interface VaultNotification {
  _id: string;
  eventType: string;
  title: string;
  message: string;
  entityId: string | null;
  entityModel: string | null;
  createdByName: string;
  createdByRole: string;
  isRead: boolean;
  createdAt: string;
}

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'https://xoto.ae';
const API_BASE   = import.meta.env.VITE_API_BASE_URL || 'https://xoto.ae/api';
const MAX_NOTIFICATIONS = 100;

export const useVaultSocket = () => {
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<VaultNotification[]>([]);
  const [connected,     setConnected]     = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const roleCode = user?.role
    ? typeof user.role === 'object' ? String((user.role as { code: string }).code) : String(user.role)
    : null;

  const [resolvedAgentType, setResolvedAgentType] = useState<string | null>(null);

  // Fetch agentType if the user is an agent (role 22)
  useEffect(() => {
    if (!isAuthenticated || roleCode !== '22') return;
    const token = localStorage.getItem('vault_token');
    axios.get(`${API_BASE}/profile/get-profile-data`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (res.data?.data?.agentType) {
        setResolvedAgentType(res.data.data.agentType);
      }
    })
    .catch(() => {});
  }, [isAuthenticated, roleCode]);

  // ── Fetch stored notifications from REST API on mount ─────────
  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('vault_token');
      const res = await axios.get(`${API_BASE}/vault/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params:  { limit: MAX_NOTIFICATIONS },
      });
      if (res.data?.data) {
        setNotifications(res.data.data);
      }
    } catch {
      // silently ignore — real-time socket still works
    } finally {
      setHistoryLoaded(true);
    }
  }, [isAuthenticated]);

  // ── Mark single read (local + API) ───────────────────────────
  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => (n._id === id ? { ...n, isRead: true } : n)));
    try {
      const token = localStorage.getItem('vault_token');
      await axios.patch(`${API_BASE}/vault/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
  }, []);

  // ── Mark all read (local + API) ───────────────────────────────
  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const token = localStorage.getItem('vault_token');
      await axios.patch(`${API_BASE}/vault/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
  }, []);

  // ── Clear all (local only) ────────────────────────────────────
  const clearAll = useCallback(() => setNotifications([]), []);

  // ── Fetch history on mount ────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && !historyLoaded) fetchHistory();
  }, [isAuthenticated, historyLoaded, fetchHistory]);

  // Helper to map roleCode and agentType to backend role slugs
  const resolveRoleSlug = useCallback((code: string | null, agentTypeVal: string | null) => {
    if (!code) return null;
    if (code === '22') {
      return agentTypeVal === 'PartnerAffiliatedAgent'
        ? 'partner_affiliated_agent'
        : 'referral_partner';
    }
    const mapping: Record<string, string> = {
      '18': 'admin',
      '21': 'partner',
      '23': 'ops',
      '26': 'advisor',
    };
    return mapping[code] || null;
  }, []);

  // ── Socket connection ─────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !roleCode) return;
    if (roleCode === '22' && !resolvedAgentType) return; // Wait until agentType is loaded

    const currentRoleSlug = resolveRoleSlug(roleCode, resolvedAgentType);
    const currentUserId = user?.id || user?._id || null;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('vault:join', {
        roleCode,
        userId: currentUserId,
        roleSlug: currentRoleSlug
      });
    });

    socket.on('vault:notification', (n: VaultNotification) => {
      setNotifications(prev => {
        // Avoid duplicates between REST history and socket
        if (prev.some(x => x._id === n._id)) return prev;
        // Dispatch custom event for real-time pages update
        window.dispatchEvent(new CustomEvent('vault:new-notification', { detail: n }));
        return [n, ...prev].slice(0, MAX_NOTIFICATIONS);
      });
    });

    socket.on('disconnect',    () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, roleCode, resolvedAgentType, resolveRoleSlug, user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    connected,
    historyLoaded,
    markRead,
    markAllRead,
    clearAll,
    refresh: fetchHistory,
  };
};
