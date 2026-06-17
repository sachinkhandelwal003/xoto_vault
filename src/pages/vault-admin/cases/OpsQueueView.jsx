import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from '@/api/apiService';
import { Input, Select, Modal, Alert, message, Grid, Spin } from 'antd';
import {
  BankOutlined, EyeOutlined, SearchOutlined, ReloadOutlined,
  FileTextOutlined, TrophyOutlined, CalendarOutlined, CheckCircleFilled,
  ClockCircleOutlined, EnvironmentOutlined, WarningOutlined, InboxOutlined,
  ThunderboltOutlined, RocketOutlined, TeamOutlined, UserSwitchOutlined,
  DollarOutlined, SafetyOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { useBreakpoint } = Grid;

const PRIMARY  = '#5C039B';
const GRAD     = 'linear-gradient(135deg,#5C039B 0%,#03A4F4 100%)';
const GREEN    = '#059669';
const AMBER    = '#d97706';
const RED      = '#dc2626';
const TEAL     = '#0891b2';
const SLATE    = '#64748b';

const getUrgency = (h) => {
  if (h >= 48) return { label: 'Urgent',  color: RED,   bg: '#fef2f2', dot: '#ef4444', icon: '🔴' };
  if (h >= 24) return { label: 'Overdue', color: AMBER, bg: '#fffbeb', dot: '#f59e0b', icon: '🟡' };
  return           { label: 'Normal',  color: GREEN, bg: '#ecfdf5', dot: '#10b981', icon: '🟢' };
};

const UrgencyChip = ({ hours = 0 }) => {
  const u = getUrgency(hours);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
      color: u.color, background: u.bg, border: `1px solid ${u.color}22`,
      whiteSpace: 'nowrap', letterSpacing: 0.2,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: u.dot, flexShrink: 0 }} />
      {u.label}
    </span>
  );
};

const QueueTimer = ({ hours = 0 }) => {
  const u = getUrgency(hours);
  const d = Math.floor(hours / 24), h = hours % 24;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 11px', borderRadius: 8, background: u.bg,
      color: u.color, fontWeight: 800, fontSize: 13, border: `1px solid ${u.color}28`,
    }}>
      <ClockCircleOutlined style={{ fontSize: 12 }} />
      {hours >= 24 ? `${d}d ${h}h` : `${hours}h`}
    </div>
  );
};

const MiniDocBar = ({ s = {} }) => {
  const pct = s.completionPercentage ?? 0;
  const full = pct >= 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>
        <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Docs</span>
        <span style={{ fontWeight: 800, color: full ? GREEN : AMBER }}>{s.uploadedCount ?? 0}/{s.totalRequired ?? 0}</span>
      </div>
      <div style={{ height: 5, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: full ? `linear-gradient(90deg,${GREEN},#10b981)` : GRAD, transition: 'width .5s' }} />
      </div>
      <div style={{ fontSize: 9, color: '#cbd5e1', marginTop: 2 }}>
        {pct}% · A:{s.advisorUploaded}/{s.advisorRequired} O:{s.opsUploaded}/{s.opsRequired}
      </div>
    </div>
  );
};

/* ops-workload colour by utilisation */
const utilColor = (pct) => {
  if (pct >= 80) return { bar: '#ef4444', text: RED,   bg: '#fef2f2', label: 'High Load' };
  if (pct >= 50) return { bar: '#f59e0b', text: AMBER, bg: '#fffbeb', label: 'Moderate'  };
  return               { bar: '#10b981', text: GREEN, bg: '#ecfdf5', label: 'Available'  };
};

/* ══════════════════════════════════════════════════════════════ */
export default function OpsQueueView() {
  const navigate = useNavigate();
  const screens  = useBreakpoint();
  const { user } = useSelector((s) => s.auth);

  const roleCode = user?.role
    ? typeof user.role === 'object' ? String(user.role.code) : String(user.role)
    : '';
  const isAdmin = roleCode === '18';

  /* ── list state ── */
  const [cases,      setCases]     = useState([]);
  const [loading,    setLoading]   = useState(false);
  const [total,      setTotal]     = useState(0);
  const [page,       setPage]      = useState(1);
  const [pageSize,   setPageSize]  = useState(10);
  const [search,     setSearch]    = useState('');
  const [bankQ,      setBankQ]     = useState('');
  const [hovered,    setHovered]   = useState(null);
  const timer = useRef(null);

  /* ── action state ── */
  const [pickCase,   setPickCase]  = useState(null);
  const [picking,    setPicking]   = useState(null);
  const [assignCase, setAssignCase]= useState(null);
  const [opsTeam,    setOpsTeam]   = useState([]);
  const [opsLoading, setOpsLoading]= useState(false);
  const [pickedOps,  setPickedOps] = useState(null);
  const [assigning,  setAssigning] = useState(false);
  const [viewCase,   setViewCase]  = useState(null);

  const fetchCases = useCallback(async (toast = false) => {
    setLoading(true);
    try {
      const p = { page, limit: pageSize };
      if (search) p.search = search;
      if (bankQ)  p.bank   = bankQ;
      const res = await apiService.get('/vault/cases/ops/queue', p);
      if (res?.success) {
        setCases(res.data || []);
        setTotal(res.total || 0);
        if (toast) message.success({ content: 'Queue refreshed', key: 'q', duration: 2 });
      }
    } catch { message.error('Failed to load queue'); }
    finally   { setLoading(false); }
  }, [page, pageSize, search, bankQ]);

  useEffect(() => { fetchCases(); }, [fetchCases]);
  useEffect(() => {
    timer.current = setInterval(() => fetchCases(), 30000);
    return () => clearInterval(timer.current);
  }, [fetchCases]);

  /* load ops workload when admin opens assign */
  const openAssign = async (r) => {
    setAssignCase(r); setPickedOps(null); setOpsLoading(true);
    try {
      const res = await apiService.get('/vault/ops/workload');
      setOpsTeam(res?.data || []);
    } catch { message.error('Could not load ops team'); }
    finally   { setOpsLoading(false); }
  };

  const handleAssign = async () => {
    if (!assignCase || !pickedOps) return;
    setAssigning(true);
    try {
      const res = await apiService.post('/vault/cases/ops/assign', { caseId: assignCase._id, opsId: pickedOps });
      if (res?.success) {
        message.success(`Application assigned!`);
        setAssignCase(null); setPickedOps(null); fetchCases();
      } else message.error(res?.message || 'Assignment failed');
    } catch (e) { message.error(e?.response?.data?.message || 'Assignment failed'); }
    finally { setAssigning(false); }
  };

  const handlePickUp = async () => {
    if (!pickCase) return;
    setPicking(pickCase._id);
    try {
      const res = await apiService.post(`/vault/cases/ops/pickup/${pickCase._id}`);
      if (res?.success) {
        message.success('Application picked up!');
        setPickCase(null); fetchCases();
        navigate(`/dashboard/vault-ops/case/assigned/view/${pickCase._id}`);
      } else message.error(res?.message || 'Failed');
    } catch (e) { message.error(e?.response?.data?.message || 'Failed'); }
    finally { setPicking(null); }
  };

  /* derived stats */
  const urgentN  = cases.filter(c => (c.hoursInQueue || 0) >= 48).length;
  const overdueN = cases.filter(c => (c.hoursInQueue || 0) >= 24 && (c.hoursInQueue || 0) < 48).length;
  const avgH     = cases.length ? Math.round(cases.reduce((s,c)=>s+(c.hoursInQueue||0),0)/cases.length) : 0;
  const totalPg  = Math.ceil(total / pageSize) || 1;

  /* ── action button (role-aware) ── */
  const PrimaryBtn = ({ r, mini = false }) => isAdmin ? (
    <button onClick={(e) => { e.stopPropagation(); openAssign(r); }} style={{
      background: GRAD, color: '#fff', border: 'none', borderRadius: 8,
      padding: mini ? '7px 14px' : '10px 0', cursor: 'pointer', fontSize: 11, fontWeight: 700,
      display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
      flex: mini ? undefined : 1, justifyContent: mini ? undefined : 'center',
      boxShadow: '0 3px 10px rgba(92,3,155,.25)',
    }}>
      <UserSwitchOutlined /> Assign
    </button>
  ) : (
    <button onClick={(e) => { e.stopPropagation(); setPickCase(r); }} style={{
      background: GRAD, color: '#fff', border: 'none', borderRadius: 8,
      padding: mini ? '7px 14px' : '10px 0', cursor: 'pointer', fontSize: 11, fontWeight: 700,
      display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
      flex: mini ? undefined : 1, justifyContent: mini ? undefined : 'center',
      boxShadow: '0 3px 10px rgba(92,3,155,.25)',
    }}>
      <RocketOutlined /> Pick Up
    </button>
  );

  /* ══════════ CARD (mobile) ══════════ */
  const Card = ({ r }) => {
    const hrs = r.hoursInQueue || 0;
    const u   = getUrgency(hrs);
    const bs  = r.bankSelection || {};
    const ds  = r.documentSummary || {};
    const el  = r.eligibilitySnapshot || {};
    return (
      <div style={{
        background: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,.06)', border: `1px solid ${u.color}20`,
        transition: 'transform .15s', cursor: 'default',
      }}>
        {/* urgency stripe */}
        <div style={{ height: 3, background: u.dot }} />
        <div style={{ padding: '14px 14px 12px' }}>

          {/* top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', letterSpacing: .1 }}>{r.caseReference}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, display: 'flex', gap: 6 }}>
                <span><CalendarOutlined style={{ marginRight: 3 }} />{dayjs(r.createdAt).format('DD MMM YY')}</span>
                {r.opsQueue?.enteredQueueAt && <span>· In {dayjs(r.opsQueue.enteredQueueAt).fromNow?.() || ''}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
              <UrgencyChip hours={hrs} />
              <QueueTimer hours={hrs} />
            </div>
          </div>

          {/* client */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
              {(r.clientInfo?.fullName || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.clientInfo?.fullName || '—'}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{r.clientInfo?.nationality} · {r.clientInfo?.employmentStatus}</div>
            </div>
            {r.createdBy?.userName && (
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#f5f3ff', color: PRIMARY, border: '1px solid #e9d5ff', fontWeight: 700, whiteSpace: 'nowrap' }}>
                <TeamOutlined style={{ marginRight: 3 }} />{r.createdBy.userName}
              </span>
            )}
          </div>

          {/* loan + bank grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Loan</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: PRIMARY }}>AED {(r.propertyInfo?.loanAmount || 0).toLocaleString()}</div>
              {bs.interestRate && <div style={{ fontSize: 10, color: SLATE, marginTop: 2 }}>{bs.interestRate}% · {bs.tenureYears}yr</div>}
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Bank</div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bs.bankName || '—'}</div>
              {bs.monthlyEMI && <div style={{ fontSize: 10, color: SLATE, marginTop: 2 }}>EMI AED {bs.monthlyEMI.toLocaleString()}</div>}
            </div>
          </div>

          {/* eligibility row */}
          {el.isEligible !== undefined && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: el.isEligible ? '#ecfdf5' : '#fef2f2', color: el.isEligible ? GREEN : RED, fontWeight: 700, border: `1px solid ${el.isEligible ? '#bbf7d0' : '#fecaca'}` }}>
                <CheckCircleFilled style={{ marginRight: 3 }} />{el.dbrStatus || (el.isEligible ? 'Eligible' : 'Not Eligible')}
              </span>
              {el.eligibilityScore && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f0fdf4', color: GREEN, fontWeight: 700, border: '1px solid #bbf7d0' }}><TrophyOutlined style={{ marginRight: 3 }} />{el.eligibilityScore}</span>}
              {el.riskGrade && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f8fafc', color: SLATE, fontWeight: 700, border: '1px solid #e2e8f0' }}>{el.riskGrade}</span>}
              {r.returnCount > 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#fff7ed', color: AMBER, fontWeight: 700, border: '1px solid #fde68a' }}>↩ {r.returnCount}×</span>}
            </div>
          )}

          {/* doc bar */}
          <div style={{ marginBottom: 12 }}>
            <MiniDocBar s={ds} />
          </div>

          {/* actions — ops: Preview (modal) + Pick Up; admin: View + Assign */}
          <div style={{ display: 'flex', gap: 8 }}>
            <PrimaryBtn r={r} mini={false} />
            {isAdmin ? (
              <button onClick={() => navigate(`/dashboard/vault-admin/case/view/${r._id}`)} style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: PRIMARY, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <EyeOutlined />
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setViewCase(r); }} style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: SLATE, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FileTextOutlined /> Preview
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ══════════ TABLE ROW (desktop) ══════════ */
  const Row = ({ r }) => {
    const hrs   = r.hoursInQueue || 0;
    const u     = getUrgency(hrs);
    const bs    = r.bankSelection || {};
    const ds    = r.documentSummary || {};
    const el    = r.eligibilitySnapshot || {};
    const isHov = hovered === r._id;
    return (
      <tr
        onMouseEnter={() => setHovered(r._id)}
        onMouseLeave={() => setHovered(null)}
        style={{ background: isHov ? '#faf5ff' : '#fff', borderBottom: '1px solid #f1f5f9', transition: 'background .12s' }}
      >
        {/* Case ref */}
        <td style={{ padding: '13px 16px', borderLeft: `3px solid ${u.dot}` }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{r.caseReference}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
            <CalendarOutlined />{dayjs(r.createdAt).format('DD MMM YY')}
          </div>
          {r.propertyInfo?.propertyAddress?.city && (
            <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>
              <EnvironmentOutlined style={{ marginRight: 2 }} />{r.propertyInfo.propertyAddress.area}, {r.propertyInfo.propertyAddress.city}
            </div>
          )}
        </td>

        {/* Client */}
        <td style={{ padding: '13px 16px' }}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
              {(r.clientInfo?.fullName || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{r.clientInfo?.fullName || '—'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.clientInfo?.email}</div>
              <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 1 }}>{r.clientInfo?.nationality} · {r.clientInfo?.employmentStatus}</div>
            </div>
          </div>
        </td>

        {/* Bank (md+) */}
        {screens.md && (
          <td style={{ padding: '13px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', display: 'flex', gap: 5, alignItems: 'center' }}>
              <BankOutlined style={{ color: TEAL }} />{bs.bankName || '—'}
            </div>
            <div style={{ fontSize: 11, color: SLATE, marginTop: 2 }}>{bs.productName}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{bs.interestRate}% · {bs.tenureYears}yr · AED {(bs.monthlyEMI||0).toLocaleString()}/mo</div>
          </td>
        )}

        {/* Loan */}
        <td style={{ padding: '13px 16px' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: PRIMARY }}>AED {(r.propertyInfo?.loanAmount||0).toLocaleString()}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Property: AED {(r.propertyInfo?.propertyValue||0).toLocaleString()}</div>
        </td>

        {/* Eligibility (lg+) */}
        {screens.lg && (
          <td style={{ padding: '13px 16px' }}>
            {el.isEligible !== undefined ? (
              <div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 5 }}>
                  <CheckCircleFilled style={{ color: el.isEligible ? GREEN : RED, fontSize: 12 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: el.isEligible ? GREEN : RED }}>
                    {el.dbrStatus || (el.isEligible ? 'Eligible' : 'Not Eligible')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {el.eligibilityScore != null && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 6, background: '#f0fdf4', color: GREEN, fontWeight: 700, border: '1px solid #bbf7d0' }}>{el.eligibilityScore}</span>}
                  {el.riskGrade && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 6, fontWeight: 700, background: '#f8fafc', color: { Excellent: GREEN, Good: '#2563eb', Fair: AMBER, Poor: RED }[el.riskGrade] || SLATE, border: '1px solid #f1f5f9' }}>{el.riskGrade}</span>}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>DBR {el.dbrPercentage}% · LTV {el.estimatedLTV}%</div>
              </div>
            ) : <span style={{ color: '#e2e8f0' }}>—</span>}
          </td>
        )}

        {/* Queue time */}
        <td style={{ padding: '13px 16px' }}>
          <QueueTimer hours={hrs} />
          <div style={{ marginTop: 5 }}><UrgencyChip hours={hrs} /></div>
          {r.opsQueue?.enteredQueueAt && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{dayjs(r.opsQueue.enteredQueueAt).format('DD MMM HH:mm')}</div>}
          {r.returnCount > 0 && <div style={{ fontSize: 10, padding: '1px 7px', borderRadius: 5, background: '#fff7ed', color: AMBER, border: '1px solid #fde68a', fontWeight: 700, marginTop: 4, display: 'inline-block' }}>↩ {r.returnCount}×</div>}
        </td>

        {/* Docs (sm+) */}
        {screens.sm && (
          <td style={{ padding: '13px 16px', minWidth: 120 }}>
            <MiniDocBar s={ds} />
          </td>
        )}

        {/* Actions — ops: Preview (modal) + Pick Up; admin: View + Assign */}
        <td style={{ padding: '13px 16px', textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
            {isAdmin ? (
              <button onClick={() => navigate(`/dashboard/vault-admin/case/view/${r._id}`)} style={{ background: isHov ? '#f5f3ff' : '#f8fafc', color: PRIMARY, border: `1.5px solid ${isHov ? '#e9d5ff' : '#e2e8f0'}`, borderRadius: 7, padding: '6px 11px', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, transition: 'all .15s', whiteSpace: 'nowrap' }}>
                <EyeOutlined />
              </button>
            ) : (
              <button onClick={() => setViewCase(r)} style={{ background: isHov ? '#f0fdf4' : '#f8fafc', color: SLATE, border: `1.5px solid ${isHov ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 7, padding: '6px 11px', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, transition: 'all .15s', whiteSpace: 'nowrap' }}>
                <FileTextOutlined /> Preview
              </button>
            )}
            <PrimaryBtn r={r} mini />
          </div>
        </td>
      </tr>
    );
  };

  /* ── pagination ── */
  const Pager = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8, background: '#fafafa', borderRadius: '0 0 14px 14px' }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>
        {total > 0 ? `${((page-1)*pageSize)+1}–${Math.min(page*pageSize,total)} of ${total}` : '0 applications'}
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={{ padding: '5px 11px', borderRadius: 7, border: '1.5px solid #e2e8f0', background: page<=1?'#f8fafc':'#fff', cursor: page<=1?'not-allowed':'pointer', color: page<=1?'#cbd5e1':'#1e293b', fontSize: 12, fontWeight: 600 }}>← Prev</button>
        {Array.from({length: Math.min(totalPg,5)},(_,i)=>{
          const pg = totalPg<=5?i+1:page<=3?i+1:page+i-2;
          if(pg<1||pg>totalPg) return null;
          return <button key={pg} onClick={()=>setPage(pg)} style={{ width:30,height:30,borderRadius:7,border:'1.5px solid',borderColor:page===pg?PRIMARY:'#e2e8f0',background:page===pg?PRIMARY:'#fff',color:page===pg?'#fff':'#64748b',fontSize:12,fontWeight:700,cursor:'pointer'}}>{pg}</button>;
        })}
        <button disabled={page>=totalPg} onClick={()=>setPage(p=>p+1)} style={{ padding: '5px 11px', borderRadius: 7, border: '1.5px solid #e2e8f0', background: page>=totalPg?'#f8fafc':'#fff', cursor: page>=totalPg?'not-allowed':'pointer', color: page>=totalPg?'#cbd5e1':'#1e293b', fontSize: 12, fontWeight: 600 }}>Next →</button>
      </div>
    </div>
  );

  /* ══════════════════════════════════════ RENDER ══════════════════════════════════════ */
  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', paddingBottom: 48 }}>

      {/* ── HEADER ── */}
      <div style={{ background: GRAD, padding: screens.md ? '30px 36px 44px' : '22px 18px 38px', position: 'relative', overflow: 'hidden' }}>
        {[{t:-40,r:-40,s:180},{t:'auto',b:-60,l:'40%',s:130}].map((c,i)=>(
          <div key={i} style={{ position:'absolute', top:c.t, right:c.r, bottom:c.b, left:c.l, width:c.s, height:c.s, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <InboxOutlined style={{ color: '#fff', fontSize: 18 }} />
              </div>
              <h1 style={{ margin: 0, fontSize: screens.md ? 26 : 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                {isAdmin ? 'Applications Queue' : 'Ops Application Queue'}
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,.7)', paddingLeft: 46 }}>
              {isAdmin ? 'Manually assign pending applications to your ops team' : 'Pick up and process incoming mortgage applications'}
              <span style={{ marginLeft: 10, fontSize: 11, opacity: .6 }}>· Auto-refreshes every 30s</span>
            </p>
          </div>
        </div>

        {/* stat chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
          {[
            { icon: <InboxOutlined />,        label: 'In Queue',      val: total,       c: '#fff',    bg: 'rgba(255,255,255,.14)' },
            { icon: <WarningOutlined />,       label: 'Urgent 48h+',  val: urgentN,     c: '#fca5a5', bg: 'rgba(220,38,38,.2)'   },
            { icon: <ClockCircleOutlined />,   label: 'Overdue 24h+', val: overdueN,    c: '#fde68a', bg: 'rgba(245,158,11,.2)'  },
            { icon: <ThunderboltOutlined />,   label: 'Avg Hours',    val: `${avgH}h`,  c: '#bfdbfe', bg: 'rgba(59,130,246,.2)'  },
          ].map(s=>(
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '9px 14px', border: '1px solid rgba(255,255,255,.12)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ color: s.c, fontSize: 16, opacity: .9 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginTop: 2, fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTER BAR (floating card) ── */}
      <div style={{ padding: screens.md ? '0 32px' : '0 14px', marginTop: -18, position: 'relative', zIndex: 10 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 8px 28px rgba(0,0,0,.1)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Search name, email, application ref…"
            value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}
            allowClear
            style={{ borderRadius: 9, flex: '1 1 200px', maxWidth: 300 }}
          />
          <Input
            prefix={<BankOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Filter by bank…"
            value={bankQ} onChange={e=>{ setBankQ(e.target.value); setPage(1); }}
            allowClear
            style={{ borderRadius: 9, flex: '0 1 160px' }}
          />
          <Select value={pageSize} onChange={v=>{ setPageSize(v); setPage(1); }} style={{ flex: '0 0 105px' }}>
            {[10,20,50].map(n=><Option key={n} value={n}>{n} / page</Option>)}
          </Select>
          <button
            onClick={()=>fetchCases(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 15px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', color:SLATE, fontSize:13, fontWeight:600, transition:'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#f5f3ff';e.currentTarget.style.color=PRIMARY;e.currentTarget.style.borderColor=PRIMARY;}}
            onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.color=SLATE;e.currentTarget.style.borderColor='#e2e8f0';}}
          >
            <ReloadOutlined spin={loading} />{screens.sm?' Refresh':''}
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: screens.md ? '22px 32px 0' : '16px 14px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
            <p style={{ color: '#94a3b8', marginTop: 14 }}>Loading queue…</p>
          </div>
        ) : cases.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '64px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <InboxOutlined style={{ fontSize: 38, color: '#d8b4fe' }} />
            </div>
            <h3 style={{ color: '#374151', margin: '0 0 6px', fontSize: 17, fontWeight: 700 }}>Queue is empty</h3>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>
              {search||bankQ ? 'No matching applications — clear filters to see all.' : 'No pending applications in the ops queue right now.'}
            </p>
          </div>
        ) : screens.sm ? (
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.07)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(90deg,#5C039B08,#03A4F408)' }}>
                    {['App Ref','Client',screens.md?'Bank':'',screens.md?'Loan':'Amount',screens.lg?'Eligibility':'','Queue Time','Docs',''].filter(h=>h!==null&&!(h===''&&!screens.md)).map((h,i)=>(
                      <th key={i} style={{ padding:'12px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.8, borderBottom:'2px solid #f1f5f9', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>{cases.map(r=><Row key={r._id} r={r}/>)}</tbody>
              </table>
            </div>
            <Pager />
          </div>
        ) : (
          <div>
            {cases.map(r=><Card key={r._id} r={r}/>)}
            <Pager />
          </div>
        )}
      </div>

      {/* ═══════ ADMIN: ASSIGN MODAL ═══════ */}
      <Modal
        open={!!assignCase} onCancel={()=>{setAssignCase(null);setPickedOps(null);}}
        footer={null} centered width={560}
        title={<div style={{display:'flex',alignItems:'center',gap:10}}><UserSwitchOutlined style={{color:PRIMARY,fontSize:19}}/><span style={{fontWeight:800}}>Assign Application to Ops</span></div>}
      >
        {assignCase && (
          <div>
            {/* application summary strip */}
            <div style={{ background: 'linear-gradient(135deg,#5C039B08,#03A4F408)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, border: '1px solid #e9d5ff', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{assignCase.caseReference}</div>
                <div style={{ fontSize: 12, color: SLATE, marginTop: 3 }}>{assignCase.clientInfo?.fullName} · {assignCase.bankSelection?.bankName}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: PRIMARY, marginTop: 4 }}>AED {(assignCase.propertyInfo?.loanAmount||0).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                <QueueTimer hours={assignCase.hoursInQueue||0} />
                <UrgencyChip hours={assignCase.hoursInQueue||0} />
              </div>
            </div>

            {/* ops team list */}
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 10 }}>
              Select Ops Team Member
              <span style={{ fontWeight: 400, fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>
                — {opsTeam.filter(o=>o.canTakeMore).length} available
              </span>
            </div>

            {opsLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}><Spin /></div>
            ) : opsTeam.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: 13 }}>No ops users found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 2, marginBottom: 20 }}>
                {[...opsTeam]
                  .sort((a,b) => a.utilization - b.utilization)
                  .map((o, idx) => {
                    const uc  = utilColor(o.utilization);
                    const sel = pickedOps === o.id;
                    const rec = idx === 0 && o.canTakeMore;
                    return (
                      <div
                        key={o.id}
                        onClick={() => o.canTakeMore && setPickedOps(o.id)}
                        style={{
                          borderRadius: 12, padding: '12px 14px',
                          border: `2px solid ${sel ? PRIMARY : o.canTakeMore ? '#e2e8f0' : '#f1f5f9'}`,
                          background: sel ? '#faf5ff' : o.canTakeMore ? '#fff' : '#f8fafc',
                          cursor: o.canTakeMore ? 'pointer' : 'not-allowed',
                          opacity: o.canTakeMore ? 1 : 0.55,
                          transition: 'all .15s', position: 'relative',
                        }}
                      >
                        {rec && (
                          <div style={{ position: 'absolute', top: -1, right: 12, fontSize: 10, padding: '1px 8px', borderRadius: '0 0 6px 6px', background: GREEN, color: '#fff', fontWeight: 700 }}>
                            Recommended
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* avatar */}
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: sel ? GRAD : 'linear-gradient(135deg,#e2e8f0,#f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 15, color: sel ? '#fff' : '#94a3b8' }}>
                            {(o.name||'O')[0].toUpperCase()}
                          </div>
                          {/* info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{o.name}</div>
                              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: uc.bg, color: uc.text, fontWeight: 700, border: `1px solid ${uc.text}22` }}>{uc.label}</span>
                            </div>
                            {/* utilisation bar */}
                            <div style={{ marginTop: 6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>
                                <span>{o.currentApplications} / {o.maxCapacity} applications</span>
                                <span style={{ fontWeight: 700, color: uc.text }}>{o.utilization}%</span>
                              </div>
                              <div style={{ height: 5, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(o.utilization,100)}%`, borderRadius: 6, background: uc.bar, transition: 'width .4s' }} />
                              </div>
                            </div>
                            {(o.avgProcessingDays > 0 || o.returnRate > 0) && (
                              <div style={{ display: 'flex', gap: 12, marginTop: 5, fontSize: 10, color: '#94a3b8' }}>
                                {o.avgProcessingDays > 0 && <span>Avg {o.avgProcessingDays}d processing</span>}
                                {o.returnRate > 0 && <span style={{ color: AMBER }}>↩ {o.returnRate}% return rate</span>}
                              </div>
                            )}
                          </div>
                          {/* selected check */}
                          {sel && <CheckCircleFilled style={{ color: PRIMARY, fontSize: 18, flexShrink: 0 }} />}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <Alert message="Application will be moved to the selected ops member's workload immediately." type="info" showIcon style={{ borderRadius: 10, marginBottom: 18 }} />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={()=>{setAssignCase(null);setPickedOps(null);}} style={{ padding:'9px 20px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:SLATE }}>Cancel</button>
              <button
                onClick={handleAssign} disabled={!pickedOps||assigning}
                style={{ padding:'9px 24px', borderRadius:9, border:'none', background:!pickedOps||assigning?'#94a3b8':GRAD, color:'#fff', cursor:!pickedOps||assigning?'not-allowed':'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6, boxShadow:pickedOps?'0 3px 12px rgba(92,3,155,.3)':'none' }}
              >
                <UserSwitchOutlined />{assigning?'Assigning…':'Confirm Assignment'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══════ OPS: PICK UP MODAL ═══════ */}
      <Modal
        open={!!pickCase} onCancel={()=>setPickCase(null)}
        footer={null} centered width={460}
        title={<div style={{display:'flex',alignItems:'center',gap:10}}><RocketOutlined style={{color:PRIMARY,fontSize:18}}/><span style={{fontWeight:800}}>Pick Up Application</span></div>}
      >
        {pickCase && (
          <>
            <Alert message="This application will be assigned to you and removed from the queue." type="info" showIcon style={{ borderRadius:10, marginBottom:18 }} />
            <div style={{ background:'#faf5ff', borderRadius:12, padding:'15px 16px', marginBottom:18, border:'1px solid #e9d5ff' }}>
              {[
                ['Application', pickCase.caseReference],
                ['Client', pickCase.clientInfo?.fullName],
                ['Bank', pickCase.bankSelection?.bankName],
                ['Loan', `AED ${(pickCase.propertyInfo?.loanAmount||0).toLocaleString()}`],
                ['Queue time', `${pickCase.hoursInQueue||0}h`],
                ['Submitted by', pickCase.createdBy?.userName],
              ].map(([l,v])=>v?(
                <div key={l} style={{display:'flex',justifyContent:'space-between',marginBottom:7,fontSize:13}}>
                  <span style={{color:SLATE}}>{l}</span>
                  <span style={{fontWeight:700,color:'#1e293b'}}>{v}</span>
                </div>
              ):null)}
              <div style={{marginTop:8}}><QueueTimer hours={pickCase.hoursInQueue||0}/></div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={()=>setPickCase(null)} style={{padding:'9px 20px',borderRadius:9,border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:13,fontWeight:600,color:SLATE}}>Cancel</button>
              <button onClick={handlePickUp} disabled={!!picking} style={{padding:'9px 24px',borderRadius:9,border:'none',background:picking?'#94a3b8':GRAD,color:'#fff',cursor:picking?'not-allowed':'pointer',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:6,boxShadow:'0 3px 12px rgba(92,3,155,.3)'}}>
                <RocketOutlined/>{picking?'Picking up…':'Confirm Pick Up'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ═══════ QUICK VIEW MODAL ═══════ */}
      <Modal
        open={!!viewCase} onCancel={()=>setViewCase(null)} centered width={620}
        footer={
          viewCase ? (
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setViewCase(null)} style={{padding:'8px 18px',borderRadius:8,border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:13,fontWeight:600,color:SLATE}}>Close</button>
              <button onClick={()=>{const r=viewCase;setViewCase(null);isAdmin?openAssign(r):setPickCase(r);}} style={{padding:'8px 20px',borderRadius:8,border:'none',background:GRAD,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:5,boxShadow:'0 2px 10px rgba(92,3,155,.3)'}}>
                {isAdmin?<><UserSwitchOutlined/>Assign to Ops</>:<><RocketOutlined/>Pick Up</>}
              </button>
            </div>
          ):null
        }
        title={viewCase?(
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <FileTextOutlined style={{color:PRIMARY}}/>
            <span style={{fontWeight:800}}>{viewCase.caseReference}</span>
            <UrgencyChip hours={viewCase.hoursInQueue||0}/>
          </div>
        ):null}
      >
        {viewCase && (
          <div style={{maxHeight:'62vh',overflowY:'auto',paddingRight:4}}>
            <div style={{marginBottom:14,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <QueueTimer hours={viewCase.hoursInQueue||0}/>
              {viewCase.opsQueue?.enteredQueueAt&&<span style={{fontSize:11,color:'#94a3b8'}}>Entered {dayjs(viewCase.opsQueue.enteredQueueAt).format('DD MMM YYYY HH:mm')}</span>}
              {viewCase.returnCount>0&&<span style={{fontSize:10,padding:'3px 9px',borderRadius:7,background:'#fff7ed',color:AMBER,border:'1px solid #fde68a',fontWeight:700}}>↩ Returned {viewCase.returnCount}×</span>}
            </div>

            {/* client */}
            <div style={{background:'#f8fafc',borderRadius:12,padding:'14px',marginBottom:12,border:'1px solid #f1f5f9'}}>
              <div style={{fontWeight:700,fontSize:11,color:'#94a3b8',textTransform:'uppercase',letterSpacing:.6,marginBottom:10}}>Client</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 16px'}}>
                {[['Name',viewCase.clientInfo?.fullName],['Email',viewCase.clientInfo?.email],['Mobile',viewCase.clientInfo?.mobile],['Nationality',viewCase.clientInfo?.nationality],['Residency',viewCase.clientInfo?.residencyStatus],['Employment',viewCase.clientInfo?.employmentStatus]].map(([l,v])=>(
                  <div key={l} style={{fontSize:12}}><span style={{color:'#94a3b8'}}>{l}: </span><span style={{fontWeight:600,color:'#1e293b'}}>{v||'—'}</span></div>
                ))}
              </div>
            </div>

            {/* loan + bank */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              {[
                {t:'Loan', rows:[['Amount',`AED ${(viewCase.propertyInfo?.loanAmount||0).toLocaleString()}`],['Property',`AED ${(viewCase.propertyInfo?.propertyValue||0).toLocaleString()}`],['Location',`${viewCase.propertyInfo?.propertyAddress?.area}, ${viewCase.propertyInfo?.propertyAddress?.city}`]]},
                {t:'Bank', rows:[['Bank',viewCase.bankSelection?.bankName||'—'],['Product',viewCase.bankSelection?.productName],['Terms',`${viewCase.bankSelection?.interestRate}% · ${viewCase.bankSelection?.tenureYears}yr · EMI AED ${(viewCase.bankSelection?.monthlyEMI||0).toLocaleString()}`]]},
              ].map(sec=>(
                <div key={sec.t} style={{background:'#f8fafc',borderRadius:12,padding:'13px',border:'1px solid #f1f5f9'}}>
                  <div style={{fontWeight:700,fontSize:11,color:'#94a3b8',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>{sec.t}</div>
                  {sec.rows.map(([l,v])=>v&&v!==', '&&<div key={l} style={{fontSize:12,marginBottom:4}}><span style={{color:'#94a3b8'}}>{l}: </span><span style={{fontWeight:600,color:'#1e293b'}}>{v}</span></div>)}
                </div>
              ))}
            </div>

            {/* eligibility */}
            {viewCase.eligibilitySnapshot?.isEligible!==undefined&&(
              <div style={{background:viewCase.eligibilitySnapshot.isEligible?'#ecfdf5':'#fef2f2',borderRadius:12,padding:'13px',marginBottom:12,border:`1px solid ${viewCase.eligibilitySnapshot.isEligible?'#bbf7d0':'#fecaca'}`}}>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:6}}>
                  <CheckCircleFilled style={{color:viewCase.eligibilitySnapshot.isEligible?GREEN:RED,fontSize:15}}/>
                  <span style={{fontWeight:800,fontSize:14,color:viewCase.eligibilitySnapshot.isEligible?GREEN:RED}}>{viewCase.eligibilitySnapshot.dbrStatus}</span>
                  {viewCase.eligibilitySnapshot.riskGrade&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:6,fontWeight:700,background:'#fff',color:GREEN}}>{viewCase.eligibilitySnapshot.riskGrade}</span>}
                  {viewCase.eligibilitySnapshot.eligibilityScore&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:6,fontWeight:700,background:'#fff',color:'#2563eb'}}>Score {viewCase.eligibilitySnapshot.eligibilityScore}</span>}
                </div>
                {viewCase.eligibilitySnapshot.eligibilityNotes&&<div style={{fontSize:12,color:'#64748b',marginBottom:6}}>{viewCase.eligibilitySnapshot.eligibilityNotes}</div>}
                <div style={{display:'flex',gap:16,fontSize:12,color:SLATE}}>
                  <span>DBR {viewCase.eligibilitySnapshot.dbrPercentage}%</span>
                  <span>LTV {viewCase.eligibilitySnapshot.estimatedLTV}%</span>
                  <span>Rec AED {(viewCase.eligibilitySnapshot.recommendedLoanAmount||0).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* docs */}
            <div style={{background:'#f8fafc',borderRadius:12,padding:'13px',marginBottom:12,border:'1px solid #f1f5f9'}}>
              <div style={{fontWeight:700,fontSize:11,color:'#94a3b8',textTransform:'uppercase',letterSpacing:.5,marginBottom:10}}>Documents</div>
              <MiniDocBar s={viewCase.documentSummary||{}}/>
            </div>

            {/* notes */}
            {(viewCase.internalNotes?.length>0||viewCase.customerNotes?.length>0)&&(
              <div style={{display:'grid',gridTemplateColumns:viewCase.internalNotes?.length&&viewCase.customerNotes?.length?'1fr 1fr':'1fr',gap:10}}>
                {viewCase.internalNotes?.length>0&&(
                  <div style={{background:'#faf5ff',borderRadius:10,padding:12,border:'1px solid #e9d5ff'}}>
                    <div style={{fontWeight:700,fontSize:10,color:PRIMARY,marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Internal Notes</div>
                    {viewCase.internalNotes.map((n,i)=><div key={i} style={{fontSize:12,color:'#374151',marginBottom:3}}>{n}</div>)}
                  </div>
                )}
                {viewCase.customerNotes?.length>0&&(
                  <div style={{background:'#f0f9ff',borderRadius:10,padding:12,border:'1px solid #bae6fd'}}>
                    <div style={{fontWeight:700,fontSize:10,color:TEAL,marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Customer Notes</div>
                    {viewCase.customerNotes.map((n,i)=><div key={i} style={{fontSize:12,color:'#374151',marginBottom:3}}>{n}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
