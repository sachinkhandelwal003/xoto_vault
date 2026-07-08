import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CustomerUser {
  _id: string;
  name?: { first_name?: string; last_name?: string };
  email?: string;
  mobile?: { country_code?: string; number?: string };
  isPremium?: boolean;
}

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<CustomerUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    const stored = localStorage.getItem('customer_user');
    if (!token || !stored) {
      navigate('/user/login', { replace: true });
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch {
      navigate('/user/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    navigate('/user/login', { replace: true });
  };

  if (!user) return null;

  const fullName = [user.name?.first_name, user.name?.last_name].filter(Boolean).join(' ') || 'Customer';

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        .cd-wrap { min-height: 100vh; background: #f0f2f5; font-family: 'Inter', system-ui, sans-serif; }
        .cd-nav {
          background: #fff; padding: 0 32px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          box-shadow: 0 1px 6px rgba(0,0,0,0.08);
        }
        .cd-logout {
          background: none; border: 1.5px solid #e53935; color: #e53935;
          border-radius: 8px; padding: 6px 16px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .cd-logout:hover { background: #e53935; color: #fff; }
        .cd-body { max-width: 900px; margin: 40px auto; padding: 0 20px; }
        .cd-welcome {
          background: linear-gradient(135deg, #1976d2, #0d47a1);
          border-radius: 16px; padding: 32px 36px; color: #fff; margin-bottom: 28px;
        }
        .cd-card {
          background: #fff; border-radius: 14px; padding: 24px 28px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07); margin-bottom: 20px;
        }
        .cd-info-row { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; color: #444; font-size: 14px; }
        .cd-label { color: #999; font-size: 12px; min-width: 100px; }
      `}</style>

      <div className="cd-wrap">
        {/* Nav */}
        <div className="cd-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>Xoto Customer Portal</span>
          </div>
          <button className="cd-logout" onClick={handleLogout}>Logout</button>
        </div>

        {/* Body */}
        <div className="cd-body">
          <div className="cd-welcome">
            <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>Welcome back</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{fullName}</div>
            {user.isPremium && (
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>
                ⭐ Premium Member
              </span>
            )}
          </div>

          <div className="cd-card">
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 16 }}>Account Details</div>
            {user.email && (
              <div className="cd-info-row">
                <span className="cd-label">Email</span>
                <span>{user.email}</span>
              </div>
            )}
            {user.mobile?.number && (
              <div className="cd-info-row">
                <span className="cd-label">Mobile</span>
                <span>{user.mobile.country_code} {user.mobile.number}</span>
              </div>
            )}
          </div>

          <div className="cd-card" style={{ textAlign: 'center', color: '#aaa', padding: '40px 28px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
            <div style={{ fontWeight: 600, color: '#555', marginBottom: 6 }}>Your Applications</div>
            <div style={{ fontSize: 13 }}>Mortgage applications and property enquiries will appear here.</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDashboard;
