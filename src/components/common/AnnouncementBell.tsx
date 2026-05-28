import React, { useState, useRef, useEffect } from 'react';
import { FiSpeaker, FiX, FiInfo, FiAlertTriangle, FiAlertOctagon, FiCheckCircle } from 'react-icons/fi';
import { apiService } from '../../api/apiService';
import dayjs from 'dayjs';

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  active: boolean;
  createdByName?: string;
  createdAt?: string;
}

const TYPE_CFG = {
  info:    { color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', icon: <FiInfo size={14} /> },
  warning: { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: <FiAlertTriangle size={14} /> },
  error:   { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: <FiAlertOctagon size={14} /> },
  success: { color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', icon: <FiCheckCircle size={14} /> },
};

const AnnouncementBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiService.get<{ success?: boolean; data?: Announcement[] }>('/vault/platform-config/announcements')
      .then(res => {
        if (res?.data && Array.isArray(res.data)) {
          setAnnouncements(res.data.filter(a => a.active));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const count = announcements.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(p => !p)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        title="Announcements"
      >
        <FiSpeaker size={19} />
        {count > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center rounded-full text-white font-bold"
            style={{
              minWidth: 16, height: 16, fontSize: 9, lineHeight: 1,
              background: '#5C039B', border: '1.5px solid #fff',
              padding: '0 3px',
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

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
              <FiSpeaker size={15} className="text-white" />
              <span className="text-sm font-semibold text-white">Announcements</span>
              {count > 0 && (
                <span
                  className="text-xs font-bold rounded-full px-1.5 py-0.5"
                  style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}
                >
                  {count} active
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <FiX size={14} />
            </button>
          </div>

          {/* List */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 48, height: 48, background: '#f3f4f6' }}
                >
                  <FiSpeaker size={22} style={{ color: '#d1d5db' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>No announcements</p>
              </div>
            ) : (
              announcements.map(ann => {
                const cfg = TYPE_CFG[ann.type] ?? TYPE_CFG.info;
                return (
                  <div
                    key={ann._id}
                    className="px-4 py-3 border-b border-gray-50"
                    style={{ borderLeft: `3px solid ${cfg.color}` }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="flex-shrink-0 flex items-center justify-center rounded-lg mt-0.5"
                        style={{ width: 28, height: 28, background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-extrabold leading-tight" style={{ color: cfg.color }}>
                          {ann.title}
                        </div>
                        <div className="text-xs mt-1 leading-relaxed" style={{ color: '#374151' }}>
                          {ann.message}
                        </div>
                        {ann.createdAt && (
                          <div className="text-xs mt-1.5" style={{ color: '#9ca3af' }}>
                            {ann.createdByName ? `By ${ann.createdByName} · ` : ''}
                            {dayjs(ann.createdAt).format('DD MMM YYYY')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementBell;
