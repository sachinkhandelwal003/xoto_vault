import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from '@/api/apiService';
import {
  Button, Input, Select, Row, Col, message, Grid, Spin, Tag,
} from 'antd';
import {
  UserOutlined, BankOutlined, EyeOutlined, SearchOutlined,
  PlusOutlined, ReloadOutlined, FileTextOutlined, TrophyOutlined,
  CalendarOutlined, CheckCircleFilled, SendOutlined,
  DollarOutlined, EnvironmentOutlined, SafetyOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { useBreakpoint } = Grid;

const PRIMARY = '#5C039B';
const GRADIENT = 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)';
const GREEN = '#059669';

/* ── Status config ── */
const STATUS_MAP = {
  Draft: { color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
  Submitted: { color: '#2563eb', bg: '#eff6ff', dot: '#3b82f6' },
  'Under Review': { color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6' },
  'In Ops Queue - Pending Pick-up': { color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  'Bank Application': { color: '#0891b2', bg: '#ecfeff', dot: '#06b6d4' },
  'Pre-Approved': { color: '#65a30d', bg: '#f7fee7', dot: '#84cc16' },
  Valuation: { color: '#ea580c', bg: '#fff7ed', dot: '#f97316' },
  'FOL Issued': { color: '#4338ca', bg: '#eef2ff', dot: '#6366f1' },
  'FOL Signed': { color: '#be185d', bg: '#fdf2f8', dot: '#ec4899' },
  Disbursed: { color: GREEN, bg: '#ecfdf5', dot: '#10b981' },
  Lost: { color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
};

const RISK_COLOR = { Excellent: '#059669', Good: '#2563eb', Fair: '#d97706', Poor: '#dc2626' };

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: s.color, background: s.bg, border: `1px solid ${s.color}25`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
      {status || 'Draft'}
    </span>
  );
};

const DocBar = ({
  summary = {},
  isOther = false
}) => {
  const pct = isOther
    ? (
      summary.otherCompletionPercentage ??
      summary.completionPercentage ??
      0
    )
    : (
      summary.completionPercentage ??
      0
    ); const done = isOther
      ? (
        summary.otherUploaded ??
        summary.uploadedCount ??
        0
      )
      : (
        summary.uploadedCount ??
        0
      );

  const tot = isOther
    ? (
      summary.otherRequired ??
      summary.totalRequired ??
      0
    )
    : (
      summary.totalRequired ??
      0
    );
  const full = pct >= 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{
          isOther
            ? 'Self Managed'
            : 'Documents'
        }</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: full ? GREEN : '#f59e0b' }}>{done}/{tot}</span>
      </div>
      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 10,
          background: full ? `linear-gradient(90deg,${GREEN},#10b981)` : GRADIENT,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{pct}% complete</div>
    </div>
  );
};

const StatPill = ({ label, value, color = PRIMARY, bg = '#f5f3ff' }) => (
  <div style={{ background: bg, borderRadius: 8, padding: '8px 12px', textAlign: 'center', border: `1px solid ${color}18` }}>
    <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 1, whiteSpace: 'nowrap' }}>{label}</div>
  </div>
);
const roleSlugMap = {
  18: 'vault-admin',
  21: 'vaultpartner',
  22: 'vaultagent',
  23: 'vault-ops',
  26: 'vault-advisor',
};
/* ══════════════════════════════════════════════════════════ */
const AdvisorViewCases = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { user } = useSelector((s) => s.auth);

  const rawRole = user?.role;
  const roleCode = rawRole ? (typeof rawRole === 'object' ? Number(rawRole.code) : Number(rawRole)) : 26;
  const roleSlug = roleSlugMap[roleCode] ?? 'vault-advisor';
  const isOther =
    roleCode === 21 ||
    (
      roleCode === 22 &&
      user?.agentType ===
      'PartnerAffiliatedAgent'
    );
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [search, setSearch] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const [submitting, setSubmitting] = useState(null);

  const fetchCases = useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (search) params.search = search;
      const res = await apiService.get('/vault/cases', params);
      if (res?.success) {
        setCases(res.data || []);
        setTotal(res.total || res.pagination?.totalPages * pageSize || 0);
        if (showToast) message.success({ content: 'Page refreshed successfully', key: 'refresh', duration: 2 });
      }
    } catch {
      message.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const goToDetail = (id) => navigate(`/dashboard/${roleSlug}/case/view/${id}`);

  const canSubmit = (r) => {
    if (r.currentStatus !== 'Draft') return false;
    const ds = r.documentSummary || {};
    const required = isOther
      ? (
        ds.otherRequired ??
        ds.totalRequired ??
        0
      )
      : (
        ds.advisorRequired ??
        ds.totalRequired ??
        0
      );

    const uploaded = isOther
      ? (
        ds.otherUploaded ??
        ds.uploadedCount ??
        0
      )
      : (
        ds.advisorUploaded ??
        ds.uploadedCount ??
        0
      );
    return required > 0 && uploaded >= required;
  };

  const handleQuickSubmit = async (e, caseId) => {
    e.stopPropagation();
    setSubmitting(caseId);
    try {
      const res = await apiService.post(`/vault/cases/${caseId}/submit`);
      if (res?.success) {
        message.success('Application submitted to Xoto!');
        fetchCases();
      } else {
        message.error(res?.message || 'Submission failed');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;
  const readyCount = cases.filter(c => canSubmit(c)).length;
  const pendingCount = cases.filter(c => !canSubmit(c)).length;
  const avgDocs = cases.length
    ? Math.round(cases.reduce((sum, c) => sum + (c.documentSummary?.completionPercentage || 0), 0) / cases.length)
    : 0;

  /* ── Mobile card ── */
  const MobileCard = ({ r }) => {
    const ds = r.documentSummary || {};
    const elig = r.eligibilitySnapshot || {};
    const ready = canSubmit(r);
    return (
      <div
        onClick={() => goToDetail(r._id)}
        style={{
          background: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)', cursor: 'pointer',
          border: '1.5px solid #f1f5f9', transition: 'transform .15s, box-shadow .15s',
        }}
      >
        {/* Color bar */}
        <div style={{ height: 4, background: ready ? `linear-gradient(90deg,${GREEN},#10b981)` : GRADIENT }} />

        <div style={{ padding: '16px 16px 14px' }}>
          {/* Row 1: ref + status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b', letterSpacing: 0.2 }}>{r.caseReference}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CalendarOutlined /> {dayjs(r.createdAt).format('DD MMM YYYY')}
              </div>
            </div>
            <StatusBadge status={r.currentStatus} />
          </div>

          {/* Row 2: client */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: GRADIENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontSize: 16, color: '#fff', fontWeight: 800,
            }}>
              {(r.clientInfo?.fullName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{r.clientInfo?.fullName || '—'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 1 }}>
                {r.clientInfo?.email && <span><PhoneOutlined style={{ marginRight: 3 }} />{r.clientInfo.email}</span>}
                {r.clientInfo?.residencyStatus && <span>{r.clientInfo.residencyStatus}</span>}
              </div>
            </div>
          </div>

          {/* Row 3: metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Loan Amount</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: PRIMARY }}>
                AED {(r.propertyInfo?.loanAmount || 0).toLocaleString()}
              </div>
              {r.bankSelection?.interestRate && (
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                  {r.bankSelection.interestRate}% · {r.bankSelection.tenureYears}yr
                </div>
              )}
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bank</div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{r.bankSelection?.bankName || '—'}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{r.bankSelection?.productName || ''}</div>
            </div>
          </div>

          {/* Row 4: eligibility tags */}
          {elig.isEligible !== undefined && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: elig.isEligible ? '#ecfdf5' : '#fef2f2', color: elig.isEligible ? GREEN : '#dc2626', fontWeight: 700, border: `1px solid ${elig.isEligible ? '#bbf7d0' : '#fecaca'}` }}>
                <CheckCircleFilled style={{ marginRight: 3 }} />{elig.dbrStatus || (elig.isEligible ? 'Eligible' : 'Not Eligible')}
              </span>
              {elig.eligibilityScore && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#f0fdf4', color: GREEN, fontWeight: 700, border: '1px solid #bbf7d0' }}>
                  <TrophyOutlined style={{ marginRight: 3 }} />Score {elig.eligibilityScore}
                </span>
              )}
              {elig.riskGrade && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, fontWeight: 700, background: '#f8fafc', color: RISK_COLOR[elig.riskGrade] || '#64748b', border: '1px solid #f1f5f9' }}>
                  {elig.riskGrade}
                </span>
              )}
              {r.bankSelection?.monthlyEMI && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#f5f3ff', color: PRIMARY, fontWeight: 700, border: '1px solid #e9d5ff' }}>
                  EMI AED {r.bankSelection.monthlyEMI.toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* Row 5: doc progress */}
          <div style={{ marginBottom: 12 }}>
            <DocBar
              summary={ds}
              isOther={isOther}
            />          </div>

          {/* Row 6: action */}
          <div style={{ display: 'flex', gap: 8 }}>
            {canSubmit(r) ? (
              <button
                onClick={(e) => handleQuickSubmit(e, r._id)}
                disabled={submitting === r._id}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
                  background: submitting === r._id ? '#94a3b8' : `linear-gradient(135deg,${GREEN},#10b981)`,
                  color: '#fff', cursor: submitting === r._id ? 'not-allowed' : 'pointer',
                  fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  boxShadow: '0 3px 10px rgba(5,150,105,0.35)',
                }}
              >
                <SendOutlined />{submitting === r._id ? 'Submitting…' : 'Submit to Xoto'}
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); goToDetail(r._id); }}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 10, border: `1.5px solid #e2e8f0`,
                  background: '#fff', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, color: PRIMARY,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}
              >
                <EyeOutlined /> View Application
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ── Desktop table row ── */
  const TRow = ({ r }) => {
    const elig = r.eligibilitySnapshot || {};
    const ds = r.documentSummary || {};
    const bs = r.bankSelection || {};
    const isHov = hoveredId === r._id;
    const ready = canSubmit(r);
    return (
      <tr
        onClick={() => goToDetail(r._id)}
        onMouseEnter={() => setHoveredId(r._id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{ cursor: 'pointer', background: isHov ? '#faf5ff' : '#fff', borderBottom: '1px solid #f1f5f9', transition: 'background .15s' }}
      >
        {/* Case */}
        <td style={{ padding: '14px 16px' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>{r.caseReference}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
            <CalendarOutlined /> {dayjs(r.createdAt).format('DD MMM YYYY')}
          </div>
          {r.propertyInfo?.propertyAddress?.city && (
            <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>
              <EnvironmentOutlined style={{ marginRight: 3 }} />
              {r.propertyInfo.propertyAddress.area}, {r.propertyInfo.propertyAddress.city}
            </div>
          )}
        </td>

        {/* Client */}
        <td style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: GRADIENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontSize: 16, color: '#fff', fontWeight: 800,
            }}>
              {(r.clientInfo?.fullName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{r.clientInfo?.fullName || '—'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.clientInfo?.email || ''}</div>
              <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 1 }}>
                {r.clientInfo?.nationality} · {r.clientInfo?.employmentStatus}
              </div>
            </div>
          </div>
        </td>

        {/* Bank */}
        {screens.md && (
          <td style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 5 }}>
              <BankOutlined style={{ color: PRIMARY }} /> {bs.bankName || '—'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{bs.productName || ''}</div>
            {bs.monthlyEMI && (
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                EMI: AED {bs.monthlyEMI.toLocaleString()}/mo
              </div>
            )}
          </td>
        )}

        {/* Loan */}
        <td style={{ padding: '14px 16px' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: PRIMARY }}>
            AED {(r.propertyInfo?.loanAmount || 0).toLocaleString()}
          </div>
          {bs.interestRate && (
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {bs.interestRate}% p.a. · {bs.tenureYears} yrs
            </div>
          )}
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
            Property: AED {(r.propertyInfo?.propertyValue || 0).toLocaleString()}
          </div>
        </td>

        {/* Eligibility */}
        {screens.lg && (
          <td style={{ padding: '14px 16px' }}>
            {elig.isEligible !== undefined ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <CheckCircleFilled style={{ color: elig.isEligible ? GREEN : '#dc2626', fontSize: 13 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: elig.isEligible ? GREEN : '#dc2626' }}>
                    {elig.dbrStatus || (elig.isEligible ? 'Eligible' : 'Not Eligible')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {elig.eligibilityScore != null && (
                    <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 8, background: '#f0fdf4', color: GREEN, fontWeight: 700, border: '1px solid #bbf7d0' }}>
                      <TrophyOutlined style={{ marginRight: 3 }} />{elig.eligibilityScore}
                    </span>
                  )}
                  {elig.riskGrade && (
                    <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 8, fontWeight: 700, background: '#f8fafc', color: RISK_COLOR[elig.riskGrade] || '#64748b', border: '1px solid #f1f5f9' }}>
                      {elig.riskGrade}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                  DBR {elig.dbrPercentage}% · LTV {elig.estimatedLTV}%
                </div>
              </div>
            ) : <span style={{ color: '#e2e8f0', fontSize: 13 }}>—</span>}
          </td>
        )}

        {/* Status */}
        <td style={{ padding: '14px 16px' }}>
          <StatusBadge status={r.currentStatus} />
          {r.advisorSubmittedAt && (
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
              Submitted {dayjs(r.advisorSubmittedAt).format('DD MMM')}
            </div>
          )}
          {r.timeline?.submittedToXotoAt && (
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
              To Xoto {dayjs(r.timeline.submittedToXotoAt).format('DD MMM')}
            </div>
          )}
        </td>

        {/* Docs */}
        {screens.sm && (
          <td style={{ padding: '14px 16px', minWidth: 120 }}>
            <DocBar
              summary={ds}
              isOther={isOther}
            />            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
              {isOther
                ? `Self Managed:
    ${ds.otherUploaded ?? 0}
    /
    ${ds.otherRequired ?? 0}`
                : `Advisor:
    ${ds.advisorUploaded}
    /
    ${ds.advisorRequired}
    · Ops:
    ${ds.opsUploaded}
    /
    ${ds.opsRequired}`
              }
            </div>
          </td>
        )}

        {/* Actions */}
        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {ready && (
              <button
                onClick={(e) => handleQuickSubmit(e, r._id)}
                disabled={submitting === r._id}
                style={{
                  background: submitting === r._id ? '#94a3b8' : `linear-gradient(135deg,${GREEN},#10b981)`,
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '6px 14px', cursor: submitting === r._id ? 'not-allowed' : 'pointer',
                  fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                  boxShadow: '0 2px 8px rgba(5,150,105,0.3)', whiteSpace: 'nowrap',
                }}
              >
                <SendOutlined />{screens.md ? (submitting === r._id ? 'Submitting…' : 'Submit') : ''}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); goToDetail(r._id); }}
              style={{
                background: isHov ? GRADIENT : '#f8fafc',
                color: isHov ? '#fff' : PRIMARY,
                border: `1.5px solid ${isHov ? 'transparent' : '#e2e8f0'}`,
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all .2s', whiteSpace: 'nowrap',
              }}
            >
              <EyeOutlined />{screens.sm ? 'View' : ''}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  /* ── Pagination ── */
  const PaginationBar = () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8, background: '#fafafa',
    }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>
        {total > 0
          ? `Showing ${((page - 1) * pageSize) + 1}–${Math.min(page * pageSize, total)} of ${total} applications`
          : '0 applications'}
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
          style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: page <= 1 ? '#f8fafc' : '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? '#cbd5e1' : '#1e293b', fontSize: 12, fontWeight: 600 }}>
          ← Prev
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2;
          if (pg < 1 || pg > totalPages) return null;
          return (
            <button key={pg} onClick={() => setPage(pg)}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid', borderColor: page === pg ? PRIMARY : '#e2e8f0', background: page === pg ? PRIMARY : '#fff', color: page === pg ? '#fff' : '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {pg}
            </button>
          );
        })}
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
          style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: page >= totalPages ? '#f8fafc' : '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? '#cbd5e1' : '#1e293b', fontSize: 12, fontWeight: 600 }}>
          Next →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 40 }}>

      {/* ── Gradient Header ── */}
      <div style={{ background: GRADIENT, padding: screens.md ? '28px 32px 36px' : '20px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: '45%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: screens.md ? 28 : 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              My Draft Applications
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              Upload documents and submit your draft applications to Xoto
            </p>
          </div>
          <button
            onClick={() => navigate(`/dashboard/${roleSlug}/case/create`)}
            style={{
              background: 'rgba(255,255,255,0.18)', color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 10,
              padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(4px)',
            }}
          >
            <PlusOutlined /> {screens.sm ? 'Create Application' : '+'}
          </button>
        </div>

        {/* Stats row */}
        {total > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Drafts', value: total, color: '#fff', bg: 'rgba(255,255,255,0.15)' },
              { label: 'Ready to Submit', value: readyCount, color: '#6ee7b7', bg: 'rgba(16,185,129,0.2)' },
              { label: 'Docs Pending', value: pendingCount, color: '#fde68a', bg: 'rgba(245,158,11,0.2)' },
              { label: 'Avg Docs Complete', value: `${avgDocs}%`, color: '#bfdbfe', bg: 'rgba(59,130,246,0.2)' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '10px 16px', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Filters bar ── */}
      <div style={{ padding: screens.md ? '0 32px' : '0 16px', marginTop: -16 }}>
        <div style={{
          background: '#fff', borderRadius: 14, padding: '12px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Search client name or application reference…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            allowClear
            style={{ borderRadius: 9, flex: '1 1 240px', maxWidth: screens.md ? 360 : '100%' }}
          />
          <Select
            value={pageSize}
            onChange={v => { setPageSize(v); setPage(1); }}
            style={{ flex: '0 0 110px' }}
          >
            {[10, 12, 20, 50].map(n => <Option key={n} value={n}>{n} / page</Option>)}
          </Select>
          <button
            onClick={() => fetchCases(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 9, border: '1.5px solid #e2e8f0',
              background: '#fff', cursor: 'pointer', color: '#64748b',
              fontSize: 13, fontWeight: 600, transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.color = PRIMARY; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
          >
            <ReloadOutlined spin={loading} />
            {screens.sm ? 'Refresh' : ''}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: screens.md ? '20px 32px 0' : '16px 16px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
            <p style={{ color: '#94a3b8', marginTop: 14, fontSize: 14 }}>Loading your draft applications…</p>
          </div>
        ) : cases.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '72px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FileTextOutlined style={{ fontSize: 40, color: '#d8b4fe' }} />
            </div>
            <h3 style={{ color: '#374151', margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>
              {search ? 'No matching applications' : 'No draft applications yet'}
            </h3>
            <p style={{ color: '#94a3b8', margin: '0 0 24px', fontSize: 14 }}>
              {search ? 'Try a different search term' : 'Create an application to begin the mortgage application process.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate(`/dashboard/${roleSlug}/case/create`)}
                style={{ background: GRADIENT, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(92,3,155,0.3)' }}
              >
                <PlusOutlined style={{ marginRight: 6 }} /> Create First Application
              </button>
            )}
          </div>
        ) : screens.sm ? (
          /* ── Desktop table ── */
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#5C039B08,#03A4F408)' }}>
                    {[
                      'Application Reference',
                      'Client',
                      screens.md ? 'Bank / Product' : null,
                      'Loan Amount',
                      screens.lg ? 'Eligibility' : null,
                      'Status',
                      'Documents',
                      '',
                    ].filter(Boolean).map((h, i) => (
                      <th key={i} style={{
                        padding: '13px 16px', textAlign: 'left', fontSize: 11,
                        fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase',
                        letterSpacing: 0.7, borderBottom: '2px solid #f1f5f9', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cases.map(r => <TRow key={r._id} r={r} />)}
                </tbody>
              </table>
            </div>
            <PaginationBar />
          </div>
        ) : (
          /* ── Mobile cards ── */
          <div>
            {cases.map(r => <MobileCard key={r._id} r={r} />)}
            <PaginationBar />
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-green {
          0%,100% { box-shadow: 0 2px 8px rgba(5,150,105,0.3); }
          50%      { box-shadow: 0 2px 18px rgba(5,150,105,0.6); }
        }
      `}</style>
    </div>
  );
};

export default AdvisorViewCases;
