import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE } from '../../config/urls';

/* ── Country codes (priority: UAE, India, Saudi, US, UK, Aus) ── */
const COUNTRY_CODES = [
  { name: 'UAE', code: '+971', iso: 'ae', maxLen: 9 },
  { name: 'India', code: '+91', iso: 'in', maxLen: 10 },
  { name: 'Saudi Arabia', code: '+966', iso: 'sa', maxLen: 9 },
  { name: 'USA', code: '+1', iso: 'us', maxLen: 10 },
  { name: 'UK', code: '+44', iso: 'gb', maxLen: 10 },
  { name: 'Australia', code: '+61', iso: 'au', maxLen: 9 },
  { name: 'Qatar', code: '+974', iso: 'qa', maxLen: 8 },
  { name: 'Kuwait', code: '+965', iso: 'kw', maxLen: 8 },
  { name: 'Bahrain', code: '+973', iso: 'bh', maxLen: 8 },
  { name: 'Oman', code: '+968', iso: 'om', maxLen: 8 },
  { name: 'Pakistan', code: '+92', iso: 'pk', maxLen: 10 },
  { name: 'Egypt', code: '+20', iso: 'eg', maxLen: 10 },
];

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const CustomerLogin: React.FC = () => {
  const navigate = useNavigate();

  /* ── State ── */
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [selectedCC, setSelectedCC] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [ccOpen, setCcOpen] = useState(false);
  const [ccSearch, setCcSearch] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Redirect if already logged in ── */
  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    if (token) navigate('/user/dashboard', { replace: true });
  }, [navigate]);

  /* ── Countdown timer ── */
  useEffect(() => {
    if (countdown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setCountdown(prev => {
      if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
      return prev - 1;
    }), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [countdown]);

  /* ── Close CC dropdown on outside click ── */
  useEffect(() => {
    if (!ccOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.cc-wrap')) setCcOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ccOpen]);

  /* ── Send OTP ── */
  const handleSendOtp = async () => {
    setError('');
    if (!phone.trim() || phone.length < 6) {
      setError('Enter a valid mobile number');
      return;
    }
    setSendLoading(true);
    try {
      await axios.post(`${API_BASE}/otp/send-otp`, {
        country_code: selectedCC.code,
        phone_number: phone.trim(),
      });
      setStep('otp');
      setCountdown(RESEND_SECONDS);
      setOtp(['', '', '', '', '', '']);
      toast.success('OTP sent successfully!');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setSendLoading(false);
    }
  };

  /* ── OTP input handlers ── */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
    setError('');
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      setOtp(pasted.split(''));
      otpRefs.current[OTP_LENGTH - 1]?.focus();
    }
    e.preventDefault();
  };

  const otpValue = otp.join('');
  const isOtpComplete = otpValue.length === OTP_LENGTH;

  /* ── Verify OTP + Login ── */
  const handleLogin = async () => {
    setError('');
    if (!isOtpComplete) { setError('Enter the complete 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/customer/otp-login`, {
        country_code: selectedCC.code,
        phone_number: phone.trim(),
        otp: otpValue,
      });
      const { token, user } = res.data;
      localStorage.setItem('customer_token', token);
      localStorage.setItem('customer_user', JSON.stringify(user));
      toast.success('Welcome back!');
      navigate('/user/dashboard', { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e?.response?.data?.message || 'Login failed. Try again.';
      setError(msg);
      // Clear OTP on wrong code
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const filteredCC = ccSearch
    ? COUNTRY_CODES.filter(c => c.name.toLowerCase().includes(ccSearch.toLowerCase()) || c.code.includes(ccSearch))
    : COUNTRY_CODES;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; height: 100%; }
        .cl-wrap { display: flex; min-height: 100vh; font-family: 'Inter', system-ui, sans-serif; }
        .cl-left {
          flex: 1;
          background: linear-gradient(160deg, #0f3460 0%, #1a5276 40%, #1565c0 100%);
          display: flex; flex-direction: column; justify-content: flex-end; padding: 52px;
          position: relative; overflow: hidden;
        }
        .cl-left-img {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          opacity: 0.35;
        }
        .cl-left-content { position: relative; z-index: 2; }
        .cl-right {
          width: 480px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          background: #f0f2f5; padding: 40px 32px;
        }
        .cl-card {
          width: 100%; background: #fff; border-radius: 20px;
          padding: 36px 32px; box-shadow: 0 4px 32px rgba(0,0,0,0.09);
        }
        .cl-avatar {
          width: 64px; height: 64px; border-radius: 50%; background: #1976d2;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 18px;
        }
        .cl-phone-row { display: flex; align-items: stretch; border: 1.5px solid #dce1e7; border-radius: 10px; overflow: visible; }
        .cl-phone-row:focus-within { border-color: #1976d2; }
        .cc-wrap { position: relative; flex-shrink: 0; }
        .cc-btn {
          height: 48px; padding: 0 12px; background: #f5f7fa; border: none; border-right: 1.5px solid #dce1e7;
          display: flex; align-items: center; gap: 6px; cursor: pointer; border-radius: 10px 0 0 10px;
          font-size: 14px; font-weight: 600; color: #222; min-width: 90px;
        }
        .cc-btn:hover { background: #e8edf3; }
        .cc-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0; z-index: 9999;
          width: 260px; background: #fff; border: 1px solid #dce1e7; border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.14); overflow: hidden;
        }
        .cc-search { width: 100%; padding: 10px 12px; border: none; border-bottom: 1px solid #eee; font-size: 13px; outline: none; }
        .cc-list { max-height: 200px; overflow-y: auto; }
        .cc-item {
          display: flex; align-items: center; gap: 10px; padding: 9px 14px; font-size: 13px;
          cursor: pointer; transition: background 0.15s;
        }
        .cc-item:hover { background: #eef4ff; }
        .cl-phone-input {
          flex: 1; height: 48px; border: none; outline: none; padding: 0 14px; font-size: 15px;
          color: #111; background: transparent; border-radius: 0 10px 10px 0;
        }
        .cl-send-btn {
          background: none; border: none; font-size: 14px; font-weight: 700;
          color: #1976d2; cursor: pointer; white-space: nowrap; padding: 0 14px; flex-shrink: 0;
          display: flex; align-items: center;
        }
        .cl-send-btn:disabled { color: #aaa; cursor: not-allowed; }
        .cl-otp-row { display: flex; gap: 10px; justify-content: center; }
        .cl-otp-box {
          width: 48px; height: 54px; border: 1.5px solid #dce1e7; border-radius: 10px;
          text-align: center; font-size: 22px; font-weight: 700; color: #111; outline: none;
          transition: border-color 0.2s; background: #fafafa;
        }
        .cl-otp-box:focus { border-color: #1976d2; background: #fff; box-shadow: 0 0 0 3px rgba(25,118,210,0.1); }
        .cl-otp-box.filled { border-color: #1976d2; background: #eef4ff; }
        .cl-login-btn {
          width: 100%; height: 50px; border: none; border-radius: 12px;
          background: #1976d2; color: #fff; font-size: 16px; font-weight: 700;
          cursor: pointer; transition: all 0.2s; margin-top: 20px; letter-spacing: 0.02em;
        }
        .cl-login-btn:disabled { background: #c8d5e8; cursor: not-allowed; }
        .cl-login-btn:not(:disabled):hover { background: #1565c0; box-shadow: 0 4px 18px rgba(25,118,210,0.35); }
        .cl-error { color: #e53935; font-size: 12.5px; margin-top: 8px; text-align: center; font-weight: 500; }
        @media (max-width: 768px) {
          .cl-left { display: none; }
          .cl-right { width: 100%; padding: 24px 16px; }
          .cl-card { padding: 28px 20px; }
        }
      `}</style>

      <div className="cl-wrap">
        {/* ── Left Panel ── */}
        <div className="cl-left">
          <img
            className="cl-left-img"
            src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&q=80"
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="cl-left-content">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Xoto — Powered by AI
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 14 }}>
              Customer<br />
              <span style={{ color: '#64b5f6' }}>Login</span>
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 340 }}>
              Access your property enquiries, mortgage applications, and personalized Xoto services — all in one place.
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="cl-right">
          <div className="cl-card">
            {/* Back */}
            <button
              onClick={() => step === 'otp' ? (setStep('phone'), setError(''), setOtp(['','','','','',''])) : navigate(-1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 20, padding: '0 0 4px', display: 'block' }}
            >
              ←
            </button>

            {/* Avatar */}
            <div className="cl-avatar">
              <svg width="30" height="30" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            </div>

            <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: 22, color: '#111', margin: '0 0 6px' }}>
              Welcome
            </h2>
            <p style={{ textAlign: 'center', color: '#7a7a8a', fontSize: 13, margin: '0 0 24px' }}>
              {step === 'phone' ? 'Login using your mobile number' : `OTP sent to ${selectedCC.code} ${phone}`}
            </p>

            {step === 'phone' ? (
              <>
                {/* Phone input row */}
                <div className="cl-phone-row">
                  {/* Country code */}
                  <div className="cc-wrap">
                    <button type="button" className="cc-btn" onClick={() => setCcOpen(v => !v)}>
                      <img
                        src={`https://flagcdn.com/w20/${selectedCC.iso}.png`}
                        alt=""
                        style={{ width: 20, height: 13, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
                      />
                      <span>{selectedCC.code}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {ccOpen && (
                      <div className="cc-dropdown">
                        <input
                          autoFocus
                          type="text"
                          className="cc-search"
                          placeholder="Search country..."
                          value={ccSearch}
                          onChange={e => setCcSearch(e.target.value)}
                        />
                        <div className="cc-list">
                          {filteredCC.map(c => (
                            <div
                              key={c.code + c.iso}
                              className="cc-item"
                              onClick={() => { setSelectedCC(c); setCcOpen(false); setCcSearch(''); }}
                            >
                              <img src={`https://flagcdn.com/w20/${c.iso}.png`} alt="" style={{ width: 20, height: 13, objectFit: 'cover', borderRadius: 2 }} />
                              <span style={{ flex: 1, color: '#222' }}>{c.name}</span>
                              <span style={{ color: '#999', fontSize: 12 }}>{c.code}</span>
                            </div>
                          ))}
                          {filteredCC.length === 0 && <div style={{ padding: '12px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>No results</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile input */}
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="cl-phone-input"
                    placeholder="Mobile Number"
                    value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, selectedCC.maxLen)); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    maxLength={selectedCC.maxLen}
                  />

                  {/* Send OTP */}
                  <button
                    type="button"
                    className="cl-send-btn"
                    disabled={sendLoading || phone.length < 6}
                    onClick={handleSendOtp}
                  >
                    {sendLoading ? '...' : 'Send OTP'}
                  </button>
                </div>

                {error && <div className="cl-error">{error}</div>}

                {/* Secure Login button — disabled on step 1 */}
                <button className="cl-login-btn" disabled style={{ marginTop: 20 }}>
                  Secure Login
                </button>
              </>
            ) : (
              <>
                {/* OTP boxes */}
                <div className="cl-otp-row" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      className={`cl-otp-box${digit ? ' filled' : ''}`}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>

                {error && <div className="cl-error">{error}</div>}

                {/* Resend */}
                <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
                  {countdown > 0 ? (
                    <span style={{ color: '#aaa' }}>Resend OTP in <b style={{ color: '#1976d2' }}>{countdown}s</b></span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setStep('phone'); setError(''); setOtp(['','','','','','']); }}
                      style={{ background: 'none', border: 'none', color: '#1976d2', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Secure Login button — active when OTP complete */}
                <button
                  className="cl-login-btn"
                  disabled={!isOtpComplete || loading}
                  onClick={handleLogin}
                >
                  {loading ? 'Verifying...' : 'Secure Login'}
                </button>
              </>
            )}

            {/* Register link — points to main Xoto website */}
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#777' }}>
              Don't have an account?{' '}
              <a
                href="https://xoto.ae/register"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1976d2', fontWeight: 700, textDecoration: 'none' }}
              >
                Register Now
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerLogin;
