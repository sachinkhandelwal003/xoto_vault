import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from "@/api/apiService";
import { fmtAED } from '@/utils/format';
import { message, Modal, Select, Input, Spin, Grid } from 'antd';
import {
  Eye, RefreshCw, Send, RotateCcw, CheckCircle2, XCircle,
  Clock, Building2, DollarSign, FileText, ChevronRight,
  AlertTriangle, TrendingUp, Users, Calendar, BarChart3,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const PRIMARY  = '#5C039B';
const GRADIENT = 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)';
const GREEN    = '#059669';

// ── Status styling ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  'Draft':                          { color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8', label: 'Draft' },
  'Submitted to Xoto':              { color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6', label: 'Submitted' },
  'In Ops Queue - Pending Pick-up': { color: '#d97706', bg: '#fffbeb', dot: '#f59e0b', label: 'Ops Queue' },
  'Assigned - Pending Review':      { color: '#2563eb', bg: '#eff6ff', dot: '#3b82f6', label: 'Pending Review' },
  'Under Review':                   { color: '#0891b2', bg: '#ecfeff', dot: '#06b6d4', label: 'Under Review' },
  'Returned - Pending Correction':  { color: '#dc2626', bg: '#fef2f2', dot: '#ef4444', label: 'Returned' },
  'Resubmitted-After Correction':   { color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6', label: 'Resubmitted' },
  'Bank Application':               { color: '#0891b2', bg: '#ecfeff', dot: '#06b6d4', label: 'Bank Application' },
  'Collecting Documentation':       { color: '#d97706', bg: '#fffbeb', dot: '#f59e0b', label: 'Collecting Docs' },
  'Pre-Approved':                   { color: '#65a30d', bg: '#f7fee7', dot: '#84cc16', label: 'Pre-Approved' },
  'Valuation':                      { color: '#ea580c', bg: '#fff7ed', dot: '#f97316', label: 'Valuation' },
  'FOL Processed':                  { color: '#4338ca', bg: '#eef2ff', dot: '#6366f1', label: 'FOL Processed' },
  'FOL Issued':                     { color: '#4338ca', bg: '#eef2ff', dot: '#6366f1', label: 'FOL Issued' },
  'FOL Signed':                     { color: '#be185d', bg: '#fdf2f8', dot: '#ec4899', label: 'FOL Signed' },
  'Disbursed':                      { color: GREEN,     bg: '#ecfdf5', dot: '#10b981', label: 'Disbursed' },
  'Rejected':                       { color: '#dc2626', bg: '#fef2f2', dot: '#ef4444', label: 'Rejected' },
  'Lost':                           { color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af', label: 'Lost' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_CFG[status] || STATUS_CFG['Draft'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: s.color, background: s.bg, border: `1px solid ${s.color}25`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
};

// ── Document progress bar ──────────────────────────────────────────────────────
const DocBar = ({ summary = {} }) => {
  const pct  = summary.completionPercentage ?? 0;
  const done = summary.uploadedCount ?? 0;
  const tot  = summary.totalRequired  ?? 0;
  const full = pct >= 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Documents</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: full ? GREEN : '#f59e0b' }}>{done}/{tot}</span>
      </div>
      <div style={{ height: 5, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 10, background: full ? `linear-gradient(90deg,${GREEN},#10b981)` : GRADIENT, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 10, color: '#94a3b8' }}>{pct}%</span>
    </div>
  );
};

// ── Next-status transition map ─────────────────────────────────────────────────
const TRANSITIONS = {
  'Draft':                          ['Submitted to Xoto'],
  'Submitted to Xoto':              ['In Ops Queue - Pending Pick-up'],
  'In Ops Queue - Pending Pick-up': ['Assigned - Pending Review'],
  'Assigned - Pending Review':      ['Under Review', 'Returned - Pending Correction'],
  'Under Review':                   ['Bank Application', 'Returned - Pending Correction'],
  'Returned - Pending Correction':  ['Resubmitted-After Correction'],
  'Resubmitted-After Correction':   ['Under Review'],
  'Bank Application':               ['Pre-Approved', 'Collecting Documentation', 'Rejected'],
  'Collecting Documentation':       ['Bank Application', 'Lost'],
  'Pre-Approved':                   ['Valuation', 'Rejected'],
  'Valuation':                      ['FOL Processed', 'Rejected'],
  'FOL Processed':                  ['FOL Issued', 'Rejected'],
  'FOL Issued':                     ['FOL Signed', 'Rejected'],
  'FOL Signed':                     ['Disbursed', 'Rejected'],
};

// Roles that can admin-update statuses
const ADMIN_ROLES = ['18', '23', '26'];

const roleSlugMap = {
  '18': 'vault-admin', '21': 'vaultpartner',
  '22': 'vaultagent',  '23': 'vault-ops', '26': 'vault-advisor',
};

// ── Main Component ─────────────────────────────────────────────────────────────
const ProcessCasesUpdates = () => {
  const navigate  = useNavigate();
  const screens   = useBreakpoint();
  const { user }  = useSelector((s) => s.auth);

  const rawRole  = user?.role;
  const roleCode = rawRole ? (typeof rawRole === 'object' ? String(rawRole.code) : String(rawRole)) : '22';
  const roleSlug = roleSlugMap[roleCode] ?? 'vaultagent';
  const canAdminUpdate = ADMIN_ROLES.includes(roleCode);
  const isPartnerAffiliated = roleCode === '22' && user?.agentType === 'PartnerAffiliatedAgent';

  const [cases,       setCases]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [activeTab,   setActiveTab]   = useState('all');
  const [hoveredId,   setHoveredId]   = useState(null);

  // Status update modal
  const [statusModal,   setStatusModal]   = useState(false);
  const [selCase,       setSelCase]       = useState(null);
  const [selStatus,     setSelStatus]     = useState('');
  const [statusNotes,   setStatusNotes]   = useState('');
  const [updating,      setUpdating]      = useState(false);

  // Resubmit modal
  const [resubModal,    setResubModal]    = useState(false);
  const [resubCase,     setResubCase]     = useState(null);
  const [resubNotes,    setResubNotes]    = useState('');

  const PAGE_SIZE = 12;

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get('/vault/cases', { page, limit: PAGE_SIZE });
      if (res?.success) {
        setCases(res.data || []);
        setTotal(res.pagination?.total || res.total || 0);
      }
    } catch {
      message.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const goToDetail = (id) => navigate(`/dashboard/${roleSlug}/case/view/${id}`);

  // Build filtered list from local data
  const filtered = activeTab === 'all' ? cases : cases.filter(c => c.currentStatus === activeTab);

  // Status counts
  const allStatuses = [...new Set(cases.map(c => c.currentStatus))].filter(Boolean);
  const tabCount = (s) => s === 'all' ? cases.length : cases.filter(c => c.currentStatus === s).length;

  // Stats summary for header
  const disbursed  = cases.filter(c => c.currentStatus === 'Disbursed').length;
  const returned   = cases.filter(c => c.currentStatus === 'Returned - Pending Correction').length;
  const active     = cases.filter(c => !['Disbursed','Rejected','Lost','Draft'].includes(c.currentStatus)).length;

  // ── Resubmit ──────────────────────────────────────────────────────────────
  const handleResubmit = async () => {
    if (!resubCase) return;
    setUpdating(true);
    try {
      const res = await apiService.put(`/vault/cases/ops/resubmit/${resubCase._id}`, {
        correctionNotes: resubNotes || 'Corrections completed and resubmitted.',
      });
      if (res?.success) {
        message.success(`Application resubmitted successfully`);
        setResubModal(false); setResubCase(null); setResubNotes('');
        fetchCases();
      } else {
        message.error(res?.message || 'Resubmit failed');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Resubmit failed');
    } finally {
      setUpdating(false);
    }
  };

  // ── Status update (admin only) ─────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    if (!selStatus) { message.warning('Select a status'); return; }
    setUpdating(true);
    try {
      const res = await apiService.put(`/vault/cases/admin/${selCase._id}/status`, { status: selStatus, notes: statusNotes });
      if (res?.success) {
        message.success(`Status updated to "${selStatus}"`);
        setStatusModal(false); setSelCase(null);
        fetchCases();
      } else {
        message.error(res?.message || 'Update failed');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  // ── Mobile card ───────────────────────────────────────────────────────────
  const MobileCard = ({ r }) => {
    const s   = STATUS_CFG[r.currentStatus] || STATUS_CFG['Draft'];
    const bs  = r.bankSelection || {};
    const pi  = r.propertyInfo  || {};
    const ds  = r.documentSummary || {};
    const isReturned = r.currentStatus === 'Returned - Pending Correction';
    const nextStatuses = TRANSITIONS[r.currentStatus] || [];

    return (
      <div
        onClick={() => goToDetail(r._id)}
        style={{
          background: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)', cursor: 'pointer',
          border: `1.5px solid ${isReturned ? '#fecaca' : '#f1f5f9'}`,
        }}
      >
        <div style={{ height: 4, background: isReturned ? '#ef4444' : s.color + '80' }} />
        {isReturned && (
          <div style={{ background: '#fef2f2', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={12} color="#dc2626" />
            <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>CORRECTIONS REQUIRED</span>
          </div>
        )}
        <div style={{ padding: '14px 16px' }}>
          {/* Row 1 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>{r.caseReference}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{dayjs(r.createdAt).format('DD MMM YYYY')}</div>
            </div>
            <StatusBadge status={r.currentStatus} />
          </div>

          {/* Client */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
              {(r.clientInfo?.fullName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{r.clientInfo?.fullName || '—'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.clientInfo?.email || r.clientInfo?.residencyStatus || ''}</div>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Loan</div>
              <div style={{ fontWeight: 800, fontSize: 13, color: PRIMARY }}>{fmtAED(pi.loanAmount)}</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Bank</div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{bs.bankName || '—'}</div>
            </div>
          </div>

          {/* Doc progress */}
          <div style={{ marginBottom: 12 }}><DocBar summary={ds} /></div>

          {/* Correction notes */}
          {isReturned && r.lastReturnNotes && (
            <div style={{ background: '#fef2f2', borderRadius: 10, padding: '8px 12px', marginBottom: 12, border: '1px solid #fecaca', fontSize: 12, color: '#dc2626' }}>
              {r.lastReturnNotes}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={(e) => { e.stopPropagation(); goToDetail(r._id); }}
              style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: PRIMARY, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <Eye size={13} /> View
            </button>
            {isReturned && (
              <button
                onClick={(e) => { e.stopPropagation(); setResubCase(r); setResubNotes(''); setResubModal(true); }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${GREEN},#10b981)`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}
              >
                <RotateCcw size={13} /> Resubmit
              </button>
            )}
            {canAdminUpdate && nextStatuses.length > 0 && !isReturned && (
              <button
                onClick={(e) => { e.stopPropagation(); setSelCase(r); setSelStatus(''); setStatusNotes(''); setStatusModal(true); }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: GRADIENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                <Send size={13} /> Update
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Desktop table row ──────────────────────────────────────────────────────
  const TRow = ({ r }) => {
    const bs  = r.bankSelection  || {};
    const pi  = r.propertyInfo   || {};
    const ds  = r.documentSummary || {};
    const elig = r.eligibilitySnapshot || {};
    const isHov = hoveredId === r._id;
    const isReturned = r.currentStatus === 'Returned - Pending Correction';
    const nextStatuses = TRANSITIONS[r.currentStatus] || [];

    return (
      <tr
        onClick={() => goToDetail(r._id)}
        onMouseEnter={() => setHoveredId(r._id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{ cursor: 'pointer', background: isHov ? '#faf5ff' : isReturned ? '#fff5f5' : '#fff', borderBottom: '1px solid #f1f5f9', transition: 'background .15s' }}
      >
        {/* Case ref */}
        <td style={{ padding: '14px 16px' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>{r.caseReference}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{dayjs(r.createdAt).format('DD MMM YYYY')}</div>
          {isReturned && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <AlertTriangle size={10} color="#dc2626" />
              <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 700 }}>Correction needed</span>
            </div>
          )}
        </td>

        {/* Client */}
        <td style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
              {(r.clientInfo?.fullName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{r.clientInfo?.fullName || '—'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.clientInfo?.email || ''}</div>
              <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 1 }}>{r.clientInfo?.nationality} · {r.clientInfo?.employmentStatus}</div>
            </div>
          </div>
        </td>

        {/* Bank */}
        {screens.md && (
          <td style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Building2 size={13} color={PRIMARY} /> {bs.bankName || '—'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{bs.productName || ''}</div>
            {bs.interestRate && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{bs.interestRate}% · {bs.tenureYears}yr</div>}
          </td>
        )}

        {/* Loan */}
        <td style={{ padding: '14px 16px' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: PRIMARY }}>{fmtAED(pi.loanAmount)}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>Property: {fmtAED(pi.propertyValue)}</div>
        </td>

        {/* Eligibility */}
        {screens.lg && (
          <td style={{ padding: '14px 16px' }}>
            {elig.isEligible !== undefined ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  {elig.isEligible
                    ? <CheckCircle2 size={13} color={GREEN} />
                    : <XCircle size={13} color="#dc2626" />}
                  <span style={{ fontSize: 12, fontWeight: 700, color: elig.isEligible ? GREEN : '#dc2626' }}>
                    {elig.dbrStatus || (elig.isEligible ? 'Eligible' : 'Not Eligible')}
                  </span>
                </div>
                {elig.eligibilityScore != null && (
                  <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 8, background: '#f0fdf4', color: GREEN, fontWeight: 700, border: '1px solid #bbf7d0' }}>
                    Score {elig.eligibilityScore}
                  </span>
                )}
              </div>
            ) : <span style={{ color: '#e2e8f0' }}>—</span>}
          </td>
        )}

        {/* Status */}
        <td style={{ padding: '14px 16px' }}>
          <StatusBadge status={r.currentStatus} />
          {r.timeline?.submittedToXotoAt && (
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
              Submitted {dayjs(r.timeline.submittedToXotoAt).format('DD MMM')}
            </div>
          )}
        </td>

        {/* Docs */}
        {screens.sm && (
          <td style={{ padding: '14px 16px', minWidth: 120 }}>
            <DocBar summary={ds} />
          </td>
        )}

        {/* Actions */}
        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            {isReturned && (
              <button
                onClick={(e) => { e.stopPropagation(); setResubCase(r); setResubNotes(''); setResubModal(true); }}
                style={{ background: `linear-gradient(135deg,${GREEN},#10b981)`, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}
              >
                <RotateCcw size={11} /> Resubmit
              </button>
            )}
            {canAdminUpdate && nextStatuses.length > 0 && !isReturned && (
              <button
                onClick={(e) => { e.stopPropagation(); setSelCase(r); setSelStatus(''); setStatusNotes(''); setStatusModal(true); }}
                style={{ background: GRADIENT, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Send size={11} /> Update
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); goToDetail(r._id); }}
              style={{ background: isHov ? GRADIENT : '#f8fafc', color: isHov ? '#fff' : PRIMARY, border: `1.5px solid ${isHov ? 'transparent' : '#e2e8f0'}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, transition: 'all .2s' }}
            >
              <Eye size={11} /> {screens.sm ? 'View' : ''}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const PaginationBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8, background: '#fafafa' }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>
        {total > 0 ? `Showing ${((page - 1) * PAGE_SIZE) + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} cases` : '0 cases'}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: page <= 1 ? '#f8fafc' : '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? '#cbd5e1' : '#1e293b', fontSize: 12, fontWeight: 600 }}>← Prev</button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2;
          if (pg < 1 || pg > totalPages) return null;
          return <button key={pg} onClick={() => setPage(pg)} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid', borderColor: page === pg ? PRIMARY : '#e2e8f0', background: page === pg ? PRIMARY : '#fff', color: page === pg ? '#fff' : '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{pg}</button>;
        })}
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: page >= totalPages ? '#f8fafc' : '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? '#cbd5e1' : '#1e293b', fontSize: 12, fontWeight: 600 }}>Next →</button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div style={{ background: GRADIENT, padding: screens.md ? '28px 32px 36px' : '20px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: '40%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: screens.md ? 26 : 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              Process Applications
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              Track and manage all your mortgage applications across every stage
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchCases(); }}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(4px)' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Applications',  value: total,     color: '#fff',    bg: 'rgba(255,255,255,0.15)', icon: BarChart3 },
            { label: 'Active',       value: active,    color: '#bfdbfe', bg: 'rgba(59,130,246,0.2)',   icon: TrendingUp },
            { label: 'Disbursed',    value: disbursed, color: '#6ee7b7', bg: 'rgba(16,185,129,0.2)',   icon: CheckCircle2 },
            { label: 'Need Action',  value: returned,  color: '#fde68a', bg: 'rgba(245,158,11,0.2)',   icon: AlertTriangle },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} style={{ background: bg, borderRadius: 12, padding: '10px 16px', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon size={16} color={color} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Status Filter Tabs ── */}
      <div style={{ padding: screens.md ? '0 32px' : '0 16px', marginTop: -16 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, whiteSpace: 'nowrap' }}>
            {['all', ...allStatuses].map(s => {
              const cfg = s === 'all' ? null : STATUS_CFG[s];
              const isActive = activeTab === s;
              const count = tabCount(s);
              return (
                <button
                  key={s}
                  onClick={() => setActiveTab(s)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
                    borderColor: isActive ? (cfg?.color || PRIMARY) : '#e2e8f0',
                    background: isActive ? (cfg?.bg || '#f5f3ff') : '#fff',
                    color: isActive ? (cfg?.color || PRIMARY) : '#64748b',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all .15s',
                  }}
                >
                  {s === 'all' ? 'All Applications' : (cfg?.label || s)}
                  <span style={{ background: isActive ? (cfg?.color || PRIMARY) : '#f1f5f9', color: isActive ? '#fff' : '#64748b', borderRadius: 99, padding: '0px 6px', fontSize: 10, fontWeight: 800 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: screens.md ? '20px 32px 0' : '16px 16px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
            <p style={{ color: '#94a3b8', marginTop: 14, fontSize: 14 }}>Loading applications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '72px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FileText size={36} color="#d8b4fe" />
            </div>
            <h3 style={{ color: '#374151', margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>No applications found</h3>
            <p style={{ color: '#94a3b8', margin: 0 }}>{activeTab !== 'all' ? `No applications with status "${activeTab}"` : 'No applications yet'}</p>
          </div>
        ) : screens.sm ? (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#5C039B08,#03A4F408)' }}>
                    {['Application Reference', 'Client', screens.md ? 'Bank / Product' : null, 'Loan Amount', screens.lg ? 'Eligibility' : null, 'Status', 'Documents', ''].filter(Boolean).map((h, i) => (
                      <th key={i} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, borderBottom: '2px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => <TRow key={r._id} r={r} />)}
                </tbody>
              </table>
            </div>
            <PaginationBar />
          </div>
        ) : (
          <div>{filtered.map(r => <MobileCard key={r._id} r={r} />)}<PaginationBar /></div>
        )}
      </div>

      {/* ── Resubmit Modal ── */}
      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><RotateCcw size={18} color={GREEN} /><span style={{ fontWeight: 700 }}>Resubmit Application</span></div>}
        open={resubModal}
        onCancel={() => { setResubModal(false); setResubCase(null); setResubNotes(''); }}
        footer={[
          <button key="cancel" onClick={() => { setResubModal(false); setResubCase(null); setResubNotes(''); }} style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>,
          <button key="submit" onClick={handleResubmit} disabled={updating} style={{ marginLeft: 8, padding: '8px 18px', borderRadius: 8, border: 'none', background: updating ? '#94a3b8' : `linear-gradient(135deg,${GREEN},#10b981)`, color: '#fff', cursor: updating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13 }}>
            {updating ? 'Submitting…' : 'Confirm Resubmit'}
          </button>,
        ]}
        centered width={480}
      >
        {resubCase && (
          <>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <AlertTriangle size={14} color="#dc2626" />
                <span style={{ fontWeight: 700, color: '#dc2626', fontSize: 13 }}>Corrections Required</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#7f1d1d' }}>{resubCase.lastReturnNotes || 'Please confirm all corrections are made.'}</p>
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: 13, color: '#374151', display: 'block', marginBottom: 6 }}>Resubmission Notes (optional)</label>
              <TextArea rows={3} value={resubNotes} onChange={e => setResubNotes(e.target.value)} placeholder="Describe the corrections made…" style={{ borderRadius: 8 }} />
            </div>
          </>
        )}
      </Modal>

      {/* ── Status Update Modal (admin only) ── */}
      {canAdminUpdate && (
        <Modal
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Send size={18} color={PRIMARY} /><span style={{ fontWeight: 700 }}>Update Status</span></div>}
          open={statusModal}
          onCancel={() => { setStatusModal(false); setSelCase(null); }}
          footer={[
            <button key="cancel" onClick={() => { setStatusModal(false); setSelCase(null); }} style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>,
            <button key="submit" onClick={handleStatusUpdate} disabled={updating} style={{ marginLeft: 8, padding: '8px 18px', borderRadius: 8, border: 'none', background: updating ? '#94a3b8' : GRADIENT, color: '#fff', cursor: updating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13 }}>
              {updating ? 'Updating…' : 'Update Status'}
            </button>,
          ]}
          centered width={480}
        >
          {selCase && (
            <>
              <div style={{ background: '#f5f3ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Application: <strong>{selCase.caseReference}</strong></div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Current: <StatusBadge status={selCase.currentStatus} /></div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600, fontSize: 13, color: '#374151', display: 'block', marginBottom: 6 }}>New Status <span style={{ color: '#ef4444' }}>*</span></label>
                <Select value={selStatus} onChange={setSelStatus} style={{ width: '100%' }} size="large" placeholder="Select next status">
                  {(TRANSITIONS[selCase.currentStatus] || []).map(s => (
                    <Option key={s} value={s}><StatusBadge status={s} /></Option>
                  ))}
                </Select>
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: 13, color: '#374151', display: 'block', marginBottom: 6 }}>Notes</label>
                <TextArea rows={3} value={statusNotes} onChange={e => setStatusNotes(e.target.value)} placeholder="Add notes about this update…" style={{ borderRadius: 8 }} />
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
};

export default ProcessCasesUpdates;
