import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const VaultLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, token } = useAuth();
  const { loading } = useSelector((s: RootState) => s.auth);

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

        @keyframes orb-float {
          0%,100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-22px) scale(1.04); }
        }
        @keyframes orb-float2 {
          0%,100% { transform: translateY(0) scale(1); }
          50%     { transform: translateY(18px) scale(0.97); }
        }
        .orb1 { animation: orb-float  8s ease-in-out infinite; }
        .orb2 { animation: orb-float2 11s ease-in-out infinite; }
        .orb3 { animation: orb-float  14s ease-in-out infinite; }

        .role-row { transition: background .18s, box-shadow .18s, transform .18s !important; }
        .role-row:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(92,3,155,.12) !important; }
        .role-row:hover .role-arrow { transform: translateX(4px); }
        .role-arrow { transition: transform .2s; }

        /* ── Responsive ── */
        .vl-wrap    { display: flex; min-height: 100vh; font-family: Poppins, sans-serif; }
        .vl-left    { width: 42%; flex-shrink: 0; }
        .vl-right   { flex: 1; min-height: 100vh; overflow-y: auto; }
        .vl-mob-hdr { display: none; }

        @media (max-width: 1023px) {
          .vl-left { width: 38%; padding: 40px 36px !important; }
          .vl-right { padding: 36px 36px !important; }
        }

        @media (max-width: 767px) {
          .vl-left    { display: none !important; }
          .vl-right   { width: 100%; padding: 28px 20px !important; }
          .vl-mob-hdr { display: flex; align-items: center; justify-content: space-between;
                        background: linear-gradient(135deg,#1a0533,#2d0d5e);
                        margin: -28px -20px 28px; padding: 18px 20px; }
          .vl-role-card  { padding: 14px 16px !important; border-radius: 14px !important; }
          .vl-role-icon  { width: 44px !important; height: 44px !important; font-size: 18px !important; border-radius: 12px !important; }
          .vl-role-arrow { width: 28px !important; height: 28px !important; }
          .vl-login-icon { width: 52px !important; height: 52px !important; font-size: 22px !important; border-radius: 14px !important; }
          .vl-trust      { flex-wrap: wrap !important; gap: 10px !important; justify-content: center !important; }
          .vl-trust span { font-size: 10px !important; }
          .vl-headline   { font-size: 22px !important; margin-bottom: 6px !important; }
          .vl-subhead    { font-size: 13px !important; }
          .vl-signin-ttl { font-size: 20px !important; }
          .vl-signin-sub { font-size: 12px !important; }
          .vl-back-btn   { margin-bottom: 24px !important; }
          .vl-role-gap   { gap: 10px !important; }
          .vl-role-desc  { font-size: 11px !important; }
          .vl-role-lbl   { font-size: 14px !important; }
        }

        @media (max-width: 380px) {
          .vl-right   { padding: 24px 16px !important; }
          .vl-mob-hdr { margin: -24px -16px 24px; padding: 16px; }
        }
      `}</style>

      <div className="vl-wrap">

        {/* ══════════ LEFT PANEL ══════════ */}
        <div
          className="vl-left"
          style={{
            background: 'linear-gradient(160deg, #1a0533 0%, #2d0d5e 40%, #0f1d5e 100%)',
            position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '60px 52px',
          }}
        >
          {/* Orbs */}
          <div className="orb1" style={{ position:'absolute',top:'-80px',right:'-80px',width:380,height:380,borderRadius:'50%',background:'radial-gradient(circle,rgba(92,3,155,.45) 0%,transparent 70%)',pointerEvents:'none' }} />
          <div className="orb2" style={{ position:'absolute',bottom:'-60px',left:'-60px',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(3,164,244,.3) 0%,transparent 70%)',pointerEvents:'none' }} />
          <div className="orb3" style={{ position:'absolute',top:'50%',left:'55%',width:180,height:180,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.2) 0%,transparent 70%)',pointerEvents:'none' }} />

          {/* Grid overlay */}
          <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)',backgroundSize:'40px 40px',pointerEvents:'none' }} />

          <div style={{ position:'relative',zIndex:2 }}>
            {/* Logo */}
            <motion.div initial={{ opacity:0,y:-16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.7 }} style={{ marginBottom:48 }}>
              <img src="/vault-logo.png" alt="Xoto Vault"
                style={{ height:68,maxWidth:240,objectFit:'contain',filter:'drop-shadow(0 6px 24px rgba(92,3,155,.6)) brightness(1.1)' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
              />
            </motion.div>

            {/* Headline */}
            <motion.div initial={{ opacity:0,x:-24 }} animate={{ opacity:1,x:0 }} transition={{ duration:.7,delay:.15 }}>
              <div style={{ fontSize:34,fontWeight:800,color:'#fff',lineHeight:1.2,marginBottom:14 }}>
                Smarter Mortgage<br />
                <span style={{ background:'linear-gradient(90deg,#a78bfa,#38bdf8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
                  Management
                </span>
              </div>
              <div style={{ fontSize:14,color:'rgba(255,255,255,.55)',lineHeight:1.75,maxWidth:320,marginBottom:40 }}>
                Your complete platform for mortgage processing, lead tracking, and multi-role team collaboration.
              </div>
            </motion.div>

            {/* Feature list */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.7,delay:.3 }}
              style={{ display:'flex',flexDirection:'column',gap:13,marginBottom:48 }}>
              {FEATURES.map((f,i) => (
                <motion.div key={f} initial={{ opacity:0,x:-16 }} animate={{ opacity:1,x:0 }} transition={{ delay:.35+i*.08 }}
                  style={{ display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:26,height:26,borderRadius:8,background:'rgba(92,3,155,.5)',border:'1px solid rgba(167,139,250,.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <CheckCircleFilled style={{ fontSize:13,color:'#a78bfa' }} />
                  </div>
                  <span style={{ fontSize:13,color:'rgba(255,255,255,.75)',fontWeight:500 }}>{f}</span>
                </motion.div>
              ))}
            </motion.div>

            <div style={{ height:1,background:'linear-gradient(90deg,rgba(255,255,255,.15),transparent)',marginBottom:24 }} />

            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.7 }}>
              <div style={{ fontSize:11,color:'rgba(255,255,255,.35)',fontWeight:500,letterSpacing:'.06em',textTransform:'uppercase' }}>
                Powered by Xoto Technologies
              </div>
            </motion.div>
          </div>
        </div>

        {/* ══════════ RIGHT PANEL ══════════ */}
        <div
          className="vl-right"
          style={{
            background: '#f8f6ff',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '48px 52px',
          }}
        >
          {/* Mobile-only branding header */}
          <div className="vl-mob-hdr">
            <img src="/vault-logo.png" alt="Xoto Vault"
              style={{ height:36,maxWidth:160,objectFit:'contain',filter:'brightness(1.2)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
            />
            <div style={{ fontSize:10,color:'rgba(255,255,255,.5)',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:600 }}>
              Secure Portal
            </div>
          </div>

          <div style={{ maxWidth:520,width:'100%',margin:'0 auto' }}>
            <AnimatePresence mode="wait">

              {/* ── ROLE SELECTION ── */}
              {view === 'select' && (
                <motion.div key="select"
                  initial={{ opacity:0,x:30 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-30 }}
                  transition={{ duration:.3 }}
                >
                  <div style={{ marginBottom:28 }}>
                    <div className="vl-headline" style={{ fontSize:26,fontWeight:800,color:'#1a0533',marginBottom:6,lineHeight:1.2 }}>
                      Welcome back
                    </div>
                    <div className="vl-subhead" style={{ fontSize:14,color:'#7b6a9b' }}>
                      Select your portal to sign in
                    </div>
                  </div>

                  <div className="vl-role-gap" style={{ display:'flex',flexDirection:'column',gap:11 }}>
                    {VAULT_ROLES.map((role,i) => (
                      <motion.div
                        key={role.id}
                        initial={{ opacity:0,y:14 }} animate={{ opacity:1,y:0 }}
                        transition={{ delay:i*.065 }}
                        className="role-row vl-role-card"
                        onClick={() => handleRoleSelect(role)}
                        style={{
                          display:'flex',alignItems:'center',gap:16,
                          background:'#fff',borderRadius:16,
                          border:'1.5px solid #ede9fe',
                          padding:'16px 20px',
                          cursor:'pointer',
                          boxShadow:'0 2px 10px rgba(92,3,155,.05)',
                        }}
                      >
                        <div className="vl-role-icon"
                          style={{ width:50,height:50,borderRadius:13,flexShrink:0,background:role.gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:'#fff',boxShadow:`0 6px 16px ${role.color}40` }}>
                          {role.icon}
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div className="vl-role-lbl" style={{ fontSize:14,fontWeight:700,color:'#1a0533',marginBottom:2 }}>
                            {role.label}
                          </div>
                          <div className="vl-role-desc" style={{ fontSize:12,color:'#9b8ab0' }}>
                            {role.description}
                          </div>
                        </div>
                        <div className="role-arrow vl-role-arrow"
                          style={{ width:32,height:32,borderRadius:9,background:'#f5f0ff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                          <ArrowRightOutlined style={{ fontSize:13,color:role.color }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div style={{ marginTop:28,textAlign:'center' }}>
                    <span style={{ fontSize:11,color:'#b0a0c8' }}>
                      Secure login · Xoto Vault v1.0
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ── LOGIN FORM ── */}
              {view === 'login' && selectedRole && (
                <motion.div key="login"
                  initial={{ opacity:0,x:30 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-30 }}
                  transition={{ duration:.3 }}
                >
                  {/* Back */}
                  <button
                    onClick={handleBack}
                    className="vl-back-btn"
                    style={{ display:'flex',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',color:'#7b6a9b',fontSize:13,fontWeight:600,padding:0,marginBottom:30,fontFamily:'inherit' }}
                  >
                    <div style={{ width:28,height:28,borderRadius:8,background:'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      <ArrowLeftOutlined style={{ fontSize:12,color:'#5C039B' }} />
                    </div>
                    Back to role selection
                  </button>

                  {/* Role badge */}
                  <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:28 }}>
                    <div className="vl-login-icon"
                      style={{ width:60,height:60,borderRadius:16,background:selectedRole.gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,color:'#fff',boxShadow:`0 8px 28px ${selectedRole.color}50`,flexShrink:0 }}>
                      {selectedRole.icon}
                    </div>
                    <div>
                      <div className="vl-signin-ttl" style={{ fontSize:22,fontWeight:800,color:'#1a0533',lineHeight:1.2 }}>
                        Sign in
                      </div>
                      <div className="vl-signin-sub" style={{ fontSize:13,color:'#9b8ab0',marginTop:3 }}>
                        {selectedRole.label} · {selectedRole.description}
                      </div>
                    </div>
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
                      label={<span style={{ fontWeight:600,fontSize:13,color:'#4a3060' }}>Email Address</span>}
                      rules={[{ required:true, type:'email', message:'Enter a valid email' }]}
                    >
                      <Input
                        prefix={<MailOutlined style={{ color:'#c4b5fd',fontSize:15 }} />}
                        placeholder="your@email.com"
                        autoComplete="email"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label={<span style={{ fontWeight:600,fontSize:13,color:'#4a3060' }}>Password</span>}
                      rules={[{ required:true, message:'Password is required' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color:'#c4b5fd',fontSize:15 }} />}
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
                        style={{ background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,color:selectedRole.color,fontFamily:'inherit' }}
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
                        height:50,borderRadius:14,
                        fontWeight:700,fontSize:15,
                        background:selectedRole.gradient,
                        border:'none',
                        boxShadow:`0 6px 24px ${selectedRole.color}55`,
                        letterSpacing:'.02em',
                      }}
                    >
                      {loading ? 'Signing in…' : 'Sign In'}
                    </Button>
                  </Form>

                  {/* Divider */}
                  <div style={{ display:'flex',alignItems:'center',gap:12,margin:'24px 0 0' }}>
                    <div style={{ flex:1,height:1,background:'#ede9fe' }} />
                    <span style={{ fontSize:10,color:'#b0a0c8',fontWeight:600,letterSpacing:'.06em',whiteSpace:'nowrap' }}>SECURED BY XOTO VAULT</span>
                    <div style={{ flex:1,height:1,background:'#ede9fe' }} />
                  </div>

                  {/* Trust badges */}
                  <div className="vl-trust" style={{ display:'flex',justifyContent:'center',gap:20,marginTop:16 }}>
                    {['256-bit SSL','Role-based access','Audit logging'].map((t) => (
                      <div key={t} style={{ display:'flex',alignItems:'center',gap:5,flexShrink:0 }}>
                        <CheckCircleFilled style={{ fontSize:11,color:'#a78bfa' }} />
                        <span style={{ fontSize:11,color:'#b0a0c8',fontWeight:500 }}>{t}</span>
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
