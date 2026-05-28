import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { apiService } from '../../api/apiService';
import { FiX, FiAlertTriangle, FiAlertOctagon } from 'react-icons/fi';

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  active: boolean;
}

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    // Load dismissed announcements from sessionStorage
    try {
      const saved = sessionStorage.getItem('vault_dismissed_announcements');
      if (saved) {
        setDismissedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }

    apiService.get<{ success?: boolean; data?: Announcement[] }>('/vault/platform-config/announcements')
      .then(res => {
        if (res?.success && Array.isArray(res.data)) {
          setAnnouncements(res.data);
        }
      })
      .catch(err => {
        console.error('Error loading system announcements:', err);
      });
  }, []);

  const handleDismiss = (id: string) => {
    const nextDismissed = [...dismissedIds, id];
    setDismissedIds(nextDismissed);
    try {
      sessionStorage.setItem('vault_dismissed_announcements', JSON.stringify(nextDismissed));
    } catch (e) {
      console.error(e);
    }
  };

  const activeNotices = announcements.filter(
    ann => ann.active && !dismissedIds.includes(ann._id)
  );
  const urgentNotices = activeNotices.filter(a => a.type === 'error' || a.type === 'warning');

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          text: '#b45309',
          icon: <FiAlertTriangle size={18} className="text-amber-600 animate-bounce" />,
        };
      case 'error':
      default:
        return {
          bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          text: '#b91c1c',
          icon: <FiAlertOctagon size={18} className="text-red-600 animate-pulse" />,
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <TopBar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(p => !p)}
        onToggleMobile={() => setMobileOpen(p => !p)}
      />
      <main
        className={`
          transition-all duration-300 pt-16
          ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-72'}
          ml-0
        `}
      >
        {/* Critical/warning banners only — dismissable */}
        {urgentNotices.length > 0 && (
          <div className="px-4 lg:px-6 pt-4 flex flex-col gap-2">
            {urgentNotices.map(notice => {
              const style = getAlertStyle(notice.type);
              return (
                <div
                  key={notice._id}
                  className="rounded-xl p-4 flex gap-3 items-start justify-between shadow-sm backdrop-blur-sm transition-all duration-300"
                  style={{ background: style.bg, border: style.border, color: style.text }}
                >
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm leading-tight">{notice.title}</div>
                      <div className="text-xs opacity-90 mt-1 leading-normal">{notice.message}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismiss(notice._id)}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
                    style={{ color: style.text }}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
