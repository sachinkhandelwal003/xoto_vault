import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Alert, ConfigProvider } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MonitorOutlined, UserOutlined, BankOutlined, TeamOutlined,
  ArrowLeftOutlined, MailOutlined, LockOutlined,
  EyeOutlined, EyeInvisibleOutlined, SafetyOutlined,
  ArrowRightOutlined, CheckCircleFilled,
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useAuth } from '../../auth/AuthContext';
import { VAULT_ROLE_SLUG_MAP } from '../../types/auth';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

interface VaultRole {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  apiEndpoint: string;
  roleCode: string;
}

const VAULT_ROLES: VaultRole[] = [
  {
    id: 'vault-admin',
    label: 'Vault Admin',
    description: 'Full vault management & team oversight',
    icon: <SafetyOutlined />,
    color: '#5C039B',
    gradient: 'linear-gradient(135deg, #5C039B, #7C3AED)',
    apiEndpoint: '/auth/login',
    roleCode: '18',
  },
  {
    id: 'vault-ops',
    label: 'Mortgage Ops',
    description: 'Applications & bank operations',
    icon: <MonitorOutlined />,
    color: '#7B2FBE',
    gradient: 'linear-gradient(135deg, #7B2FBE, #9333ea)',
    apiEndpoint: '/vault/ops/login',
    roleCode: '23',
  },
  {
    id: 'vault-advisor',
    label: 'Vault Advisor',
    description: 'Lead management & client relations',
    icon: <UserOutlined />,
    color: '#0369a1',
    gradient: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
    apiEndpoint: '/vault/advisor/login',
    roleCode: '26',
  },
  {
    id: 'vaultagent',
    label: 'Vault Agent',
    description: 'Mortgage submissions & tracking',
    icon: <BankOutlined />,
    color: '#0891b2',
    gradient: 'linear-gradient(135deg, #5C039B, #0ea5e9)',
    apiEndpoint: '/vault/agent/login',
    roleCode: '22',
  },
  {
    id: 'vaultpartner',
    label: 'Vault Partner',
    description: 'Partner portal & commission tracking',
    icon: <TeamOutlined />,
    color: '#4f46e5',
    gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    apiEndpoint: '/vault/partner/login',
    roleCode: '21',
  },
];

const FEATURES = [
  'End-to-end mortgage processing',
  'Real-time application tracking & updates',
  'Secure document management',
  'Multi-role team collaboration',
];
interface VaultLoginProps {
  mode?: 'team' | 'partner';
}

const VaultLogin: React.FC<VaultLoginProps> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, token } = useAuth();
  const { loading } = useSelector((s: RootState) => s.auth);

  const currentMode = mode || (location.pathname === '/partner-login' ? 'partner' : 'team');
  const rolesToDisplay = VAULT_ROLES.filter(r =>
    currentMode === 'partner'
      ? (r.id === 'vaultagent' || r.id === 'vaultpartner')
      : (r.id === 'vault-admin' || r.id === 'vault-ops' || r.id === 'vault-advisor')
  );

  const [view, setView] = useState<'select' | 'login'>('select');
  const [selectedRole, setSelectedRole] = useState<VaultRole | null>(null);
  const [error, setError] = useState('');
  const [form] = Form.useForm();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isAuthenticated && token && user && !hasRedirected.current) {
      hasRedirected.current = true;
      const roleCode = typeof user.role === 'object' ? String(user.role.code) : String(user.role);
      const slug = VAULT_ROLE_SLUG_MAP[roleCode] ?? 'vault-admin';
      navigate(`/dashboard/${slug}`, { replace: true });
    }
  }, [isAuthenticated, token, user, navigate]);

  const handleRoleSelect = (role: VaultRole) => {
    setSelectedRole(role);
    setView('login');
    setError('');
    form.resetFields();
  };

  const handleBack = () => {
    setView('select');
    setSelectedRole(null);
    setError('');
    form.resetFields();
  };

  const handleBackClick = () => {
    if (view === 'login') {
      handleBack();
    } else {
      window.location.href = 'https://xoto.ae';
    }
  };

  const onFinish = async (values: { email: string; password: string }) => {
    if (!selectedRole) return;
    setError('');
    try {
      await login(selectedRole.apiEndpoint, {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      toast.success('Welcome to Xoto Vault!');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      let msg = 'Invalid credentials';
      if (e?.response?.data?.message) msg = e.response.data.message;
      else if (typeof err === 'string') msg = err;
      else if (e?.message && !e.message.includes('status code')) msg = e.message;
      const lower = msg.toLowerCase();
      if (lower.includes('not approved') || lower.includes('pending')) {
        toast.warning(msg, { position: 'top-center', autoClose: 5000 });
      } else {
        toast.error(msg, { position: 'top-center' });
      }
      setError(msg);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: selectedRole?.color || '#5C039B',
          borderRadius: 12,
          fontFamily: 'Poppins, Inter, sans-serif',
        },
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        html, body { height: 100%; margin: 0; padding: 0; }

        .vl-input .ant-input,
        .vl-input .ant-input-affix-wrapper {
          height: 50px !important;
          border-radius: 14px !important;
          border: 1.5px solid #e8dff5 !important;
          font-size: 14px !important;
          padding: 0 16px !important;
          transition: all .2s !important;
        }
        .vl-input .ant-input-affix-wrapper { padding: 0 16px 0 12px !important; }
        .vl-input .ant-input-affix-wrapper:focus-within {
          border-color: #5C039B !important;
          box-shadow: 0 0 0 4px rgba(92,3,155,.1) !important;
        }
        .vl-input .ant-input:focus {
          border-color: #5C039B !important;
          box-shadow: 0 0 0 4px rgba(92,3,155,.1) !important;
        }
        .vl-input .ant-form-item { margin-bottom: 14px !important; }

        .role-card { transition: all 0.3s ease; }
        .role-card:hover { transform: translateY(-4px); border-color: #5C039B !important; box-shadow: 0 10px 20px rgba(92,3,155,0.08); }
      `}</style>

      {/* Main Wrapper with Background Image and Gradient Overlay */}
      <div 
        className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/one.png')",
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0 z-0" 
          style={{
            background: 'linear-gradient(135deg, rgba(92, 3, 155, 0.85) 0%, rgba(3, 164, 244, 0.8) 100%)',
            backdropFilter: 'blur(2px)'
          }}
        />

        {/* ── LEFT PANEL: BRANDING ── */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-12 lg:py-0 text-white relative z-10">
          <div className="mb-6">
            <img 
              src="/vault-logo.png" 
              alt="Xoto Vault"
              style={{ height: 60, maxWidth: 220, objectFit: 'contain', filter: 'brightness(1.2) drop-shadow(0 4px 12px rgba(92,3,155,0.4))' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
            />
          </div>
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              Vault <span style={{ background:'linear-gradient(90deg,#03A4F4,#38bdf8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>Access</span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-md">
              Smarter Mortgage Management. Your complete platform for mortgage processing, lead tracking, and multi-role team collaboration.
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL: FLOATING GLASS CARD ── */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10 min-h-[500px] lg:min-h-screen">
          <div 
            className={`w-full bg-white rounded-[32px] shadow-2xl p-8 sm:p-10 transition-all duration-300 ${
              view === 'select' && currentMode === 'team' ? 'max-w-[720px]' : 'max-w-[500px]'
            }`}
          >
            <AnimatePresence mode="wait">

              {/* ── ROLE SELECTION ── */}
              {view === 'select' && (
                <motion.div 
                  key="select"
                  initial={{ opacity:0, y:15 }} 
                  animate={{ opacity:1, y:0 }} 
                  exit={{ opacity:0, y:-15 }}
                  transition={{ duration:.25 }}
                >
                  {/* Top Action Row */}
                  <div className="flex justify-start mb-6">
                    <button 
                      onClick={handleBackClick}
                      className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center text-gray-450 hover:text-gray-700 transition-all border border-gray-100 bg-white hover:scale-105 active:scale-95"
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                      <ArrowLeftOutlined style={{ fontSize: 14 }} />
                    </button>
                  </div>

                  <div className="text-center mb-8">
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a0533', margin: '0 0 4px' }}>
                      Select Portal Type
                    </h2>
                    <p style={{ fontSize: 13, color: '#7b6a9b', margin: 0 }}>
                      Choose your Account type to continue
                    </p>
                  </div>

                  <div 
                    className={`grid gap-5 ${
                      currentMode === 'team' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
                    }`}
                  >
                    {rolesToDisplay.map((role) => (
                      <div
                        key={role.id}
                        onClick={() => handleRoleSelect(role)}
                        className="role-card flex flex-col items-center text-center p-6 rounded-2xl cursor-pointer bg-white border border-gray-100"
                        style={{
                          boxShadow: '0 4px 20px rgba(92, 3, 155, 0.03)'
                        }}
                      >
                        <div 
                          className="w-14 h-14 rounded-full flex items-center justify-center mb-4 text-white text-2xl shadow-md"
                          style={{ background: role.gradient }}
                        >
                          {role.icon}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 text-[14px] mb-1">
                            {role.label}
                          </div>
                          <div className="text-xs text-gray-500 leading-normal px-2">
                            {role.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 32, textAlign: 'center' }}>
                    <span style={{ fontSize: 11, color: '#b0a0c8' }}>
                      Secure login · Xoto Vault v1.0
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ── LOGIN FORM ── */}
              {view === 'login' && selectedRole && (
                <motion.div 
                  key="login"
                  initial={{ opacity:0, y:15 }} 
                  animate={{ opacity:1, y:0 }} 
                  exit={{ opacity:0, y:-15 }}
                  transition={{ duration:.25 }}
                >
                  {/* Top Action Row */}
                  <div className="flex justify-start mb-6">
                    <button 
                      onClick={handleBackClick}
                      className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center text-gray-450 hover:text-gray-700 transition-all border border-gray-100 bg-white hover:scale-105 active:scale-95"
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                      <ArrowLeftOutlined style={{ fontSize: 14 }} />
                    </button>
                  </div>

                  <div className="text-center mb-8">
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a0533', margin: '0 0 4px' }}>
                      Sign in as {selectedRole.label}
                    </h2>
                    <p style={{ fontSize: 13, color: '#7b6a9b', margin: 0 }}>
                      {selectedRole.description}
                    </p>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} style={{ marginBottom:16 }}>
                        <Alert message={error} type="error" showIcon closable onClose={() => setError('')} style={{ borderRadius:12 }} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form */}
                  <Form form={form} layout="vertical" onFinish={onFinish} className="vl-input">

                    <Form.Item
                      name="email"
                      label={<span style={{ fontWeight:600,fontSize:12.5,color:'#4a3060' }}>Email Address</span>}
                      rules={[{ required:true, type:'email', message:'Enter a valid email' }]}
                    >
                      <Input
                        prefix={<MailOutlined style={{ color:'#c4b5fd',fontSize:14 }} />}
                        placeholder="your@email.com"
                        autoComplete="email"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label={<span style={{ fontWeight:600,fontSize:12.5,color:'#4a3060' }}>Password</span>}
                      rules={[{ required:true, message:'Password is required' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color:'#c4b5fd',fontSize:14 }} />}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        iconRender={(v) => v
                          ? <EyeOutlined       style={{ color:'#9b8ab0' }} />
                          : <EyeInvisibleOutlined style={{ color:'#9b8ab0' }} />
                        }
                      />
                    </Form.Item>

                    <div style={{ textAlign:'right',marginTop:-6,marginBottom:20 }}>
                      <button
                        type="button"
                        onClick={() => toast.info('Contact your Xoto admin to reset your password.')}
                        style={{ background:'none',border:'none',cursor:'pointer',fontSize:12.5,fontWeight:600,color:selectedRole.color,fontFamily:'inherit' }}
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      style={{
                        height:48,
                        borderRadius:14,
                        fontWeight:700,
                        fontSize:14,
                        background:selectedRole.gradient,
                        border:'none',
                        boxShadow:`0 4px 18px ${selectedRole.color}40`,
                        letterSpacing:'.02em',
                      }}
                    >
                      {loading ? 'Signing in…' : 'Sign In'}
                    </Button>
                  </Form>

                  {/* Divider */}
                  <div style={{ display:'flex',alignItems:'center',gap:12,margin:'20px 0 0' }}>
                    <div style={{ flex:1,height:1,background:'#ede9fe' }} />
                    <span style={{ fontSize:9,color:'#b0a0c8',fontWeight:600,letterSpacing:'.06em',whiteSpace:'nowrap' }}>SECURED BY XOTO VAULT</span>
                    <div style={{ flex:1,height:1,background:'#ede9fe' }} />
                  </div>

                  {/* Trust badges */}
                  <div className="flex justify-center gap-4 mt-4">
                    {['256-bit SSL','Role-based access','Audit logging'].map((t) => (
                      <div key={t} style={{ display:'flex',alignItems:'center',gap:4,flexShrink:0 }}>
                        <CheckCircleFilled style={{ fontSize:10,color:'#a78bfa' }} />
                        <span style={{ fontSize:10,color:'#b0a0c8',fontWeight:500 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default VaultLogin;
