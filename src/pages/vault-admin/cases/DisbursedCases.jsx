import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from '@/api/apiService';
import { message, Spin, Select } from 'antd';
import {
  EyeOutlined, ReloadOutlined, SearchOutlined,
  CheckCircleOutlined, TrophyOutlined, DollarOutlined,
  ArrowLeftOutlined, ArrowRightOutlined, RiseOutlined, FallOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const PRIMARY  = '#5C039B';
const GRAD     = 'linear-gradient(135deg,#059669 0%,#10b981 60%,#34d399 100%)';
const GREEN    = '#059669';
const AMBER    = '#d97706';
const RED      = '#dc2626';
const SLATE    = '#64748b';

const roleSlugMap = { '18': 'vault-admin', '23': 'vault-ops', '26': 'vault-advisor' };

const fmtDate  = (d) => d ? dayjs(d).format('DD MMM YYYY') : '—';
const fmtAED   = (v) => v ? `AED ${Number(v).toLocaleString()}` : '—';

export default function DisbursedCases() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const roleCode = typeof user?.role === 'object' ? String(user.role.code) : String(user?.role);
  const roleSlug = roleSlugMap[roleCode] ?? 'vault-ops';

  const [cases, setCases]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(10);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Aggregate stats
  const [stats, setStats] = useState({ totalAmount: 0, avgLoan: 0 });

  const fetchCases = useCallback(async (p = page, l = limit, q = search) => {
    setLoading(true);
    try {
      const base = roleCode === '18'
        ? `vault/cases?page=${p}&limit=${l}`
        : `vault/cases/ops/my-cases?page=${p}&limit=${l}`;

      let url = `${base}&caseStatus=Disbursed`;
      if (q) url += `&search=${encodeURIComponent(q)}`;

      const res = await apiService.get(url);
      if (res?.success) {
        const data = res.data || [];
        setCases(data);
        const tot = res.total || res.pagination?.total || data.length;
        setTotal(tot);
        setTotalPages(res.pagination?.totalPages || 1);

        // Compute page-level stats
        const totalAmount = data.reduce((s, c) => s + (c.loanInfo?.disbursedAmount || c.loanInfo?.approvedAmount || c.propertyInfo?.loanAmount || 0), 0);
        setStats({
          totalAmount,
          avgLoan: data.length > 0 ? totalAmount / data.length : 0,
        });
      } else {
        message.error(res?.message || 'Failed to load disbursed applications');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load disbursed applications');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleCode]);

  useEffect(() => { fetchCases(page, limit, search); }, [page, limit, search]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') { setSearch(searchInput); setPage(1); }
  };

  const paginate = (delta) => { const np = page + delta; if (np >= 1 && np <= totalPages) setPage(np); };

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4' }}>

      {/* Gradient header */}
      <div style={{ background: GRAD, padding: '24px 28px 28px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrophyOutlined style={{ color: '#fff', fontSize: 22 }} />
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Disbursed Applications</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 4 }}>
                Successfully completed mortgage applications — fully disbursed by the bank
              </div>
            </div>
            <button
              onClick={() => fetchCases(page, limit, search)}
              disabled={loading}
              style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ReloadOutlined spin={loading} />
            </button>
          </div>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Disbursed Applications', value: total,                  display: total, color: 'rgba(255,255,255,.2)' },
              { label: 'Total Amount (Page)',    value: stats.totalAmount,      display: fmtAED(stats.totalAmount), color: `rgba(255,255,255,.2)` },
              { label: 'Avg Loan (Page)',        value: stats.avgLoan,          display: fmtAED(Math.round(stats.avgLoan)), color: 'rgba(255,255,255,.15)' },
            ].map(chip => (
              <div key={chip.label} style={{ background: chip.color, borderRadius: 12, padding: '8px 18px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: chip.label === 'Total Disbursed Applications' ? 22 : 16, fontWeight: 800, color: '#fff' }}>{chip.display}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.85)', fontWeight: 500 }}>{chip.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px' }}>

        {/* Filter bar */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
            <SearchOutlined style={{ color: '#9ca3af' }} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search application ID or client name… (Enter)"
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: SLATE, fontWeight: 600 }}>Rows:</span>
            <Select value={limit} onChange={(v) => { setLimit(v); setPage(1); }} options={[10, 20, 50].map(v => ({ label: `${v} / page`, value: v }))} size="small" style={{ width: 110 }} />
          </div>
          {(search) && (
            <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, color: SLATE, cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 13, color: SLATE }}>
            Showing <strong>{cases.length}</strong> of <strong>{total}</strong> disbursed applications
          </span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Page {page} of {totalPages}</span>
        </div>

        {/* Case cards */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : cases.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <TrophyOutlined style={{ fontSize: 48, color: '#a7f3d0', marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No disbursed applications yet</div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>Applications will appear here once the bank has disbursed the loan</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cases.map((c) => {
              const bs = c.bankSelection || c.loanInfo || {};
              const ci = c.clientInfo || {};
              const pi = c.propertyInfo || {};

              const requestedAmount  = pi.loanAmount || bs.loanAmount || 0;
              const approvedAmount   = c.bankDecision?.approvedAmount || bs.approvedAmount || 0;
              const disbursedAmount  = bs.disbursedAmount || approvedAmount || requestedAmount;

              // Diff between disbursed and requested
              const diff = disbursedAmount - requestedAmount;
              const hasDiff = diff !== 0 && requestedAmount > 0;

              const disbursedAt = Array.isArray(c.timeline)
                ? [...c.timeline].reverse().find(t => t.status === 'Disbursed')?.timestamp
                : null;
              const bankName    = bs.bankName    || c.bankDecision?.bankName    || '—';
              const interestRate = bs.interestRate || bs.interestRatePercentage || '—';
              const tenure       = bs.tenureYears  || '—';
              const monthlyEMI   = bs.monthlyEMI   || 0;

              return (
                <div key={c._id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: 4, background: GREEN, flexShrink: 0 }} />
                  <div style={{ flex: 1, padding: '18px 20px' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: PRIMARY }}>{c.caseReference}</span>
                          <span style={{ background: '#ecfdf5', color: GREEN, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircleOutlined /> Disbursed
                          </span>
                          {c.applicationSubType === 'pre_approval_only' && (
                            <span style={{ background: '#fff7ed', color: '#f97316', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 700 }}>
                              Pre-Approval
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: SLATE }}>
                            <span style={{ fontSize: 10, color: '#9ca3af', marginRight: 4 }}>CLIENT</span>
                            <strong>{ci.fullName || '—'}</strong>
                          </span>
                          {ci.mobile && <span style={{ fontSize: 12, color: SLATE }}>{ci.mobile}</span>}
                          {ci.email  && <span style={{ fontSize: 12, color: SLATE }}>{ci.email}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => navigate(`/dashboard/${roleSlug}/case/view/${c._id}`)}
                          style={{ padding: '9px 18px', borderRadius: 10, border: `1.5px solid ${PRIMARY}`, background: '#faf5ff', color: PRIMARY, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <EyeOutlined /> View Application
                        </button>
                      </div>
                    </div>

                    {/* Amount summary banner */}
                    <div style={{ display: 'flex', gap: 1, marginBottom: 14, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                      <AmountBlock label="Requested" value={fmtAED(requestedAmount)} color={SLATE} />
                      <AmountBlock label="Approved" value={fmtAED(approvedAmount)} color={AMBER} />
                      <AmountBlock label="Disbursed" value={fmtAED(disbursedAmount)} color={GREEN} highlight />
                      {hasDiff && (
                        <div style={{ flex: 1, background: diff > 0 ? '#fffbeb' : '#fef2f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 14px', gap: 4 }}>
                          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>DIFFERENCE</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: diff > 0 ? AMBER : RED }}>
                            {diff > 0 ? <RiseOutlined /> : <FallOutlined />}
                            {diff > 0 ? '+' : ''}{fmtAED(Math.abs(diff))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 14 }}>
                      <MetricChip label="Bank" value={bankName} />
                      <MetricChip label="Interest Rate" value={interestRate !== '—' ? `${interestRate}%` : '—'} />
                      <MetricChip label="Tenure" value={tenure !== '—' ? `${tenure} yrs` : '—'} />
                      <MetricChip label="Monthly EMI" value={fmtAED(monthlyEMI)} highlight />
                      {pi.propertyValue && <MetricChip label="Property Value" value={fmtAED(pi.propertyValue)} />}
                      {ci.residencyStatus && <MetricChip label="Residency" value={ci.residencyStatus} />}
                    </div>

                    {/* Footer dates */}
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      {disbursedAt && (
                        <div>
                          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>DISBURSED ON</div>
                          <div style={{ fontSize: 12, color: GREEN, fontWeight: 700 }}>{fmtDate(disbursedAt)}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>APPLICATION CREATED</div>
                        <div style={{ fontSize: 12, color: SLATE, fontWeight: 600 }}>{fmtDate(c.createdAt)}</div>
                      </div>
                      {c.eligibilitySnapshot?.dbrPercentage !== undefined && (
                        <div>
                          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>DBR AT CREATION</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: c.eligibilitySnapshot.dbrPercentage > 50 ? RED : GREEN }}>
                            {c.eligibilitySnapshot.dbrPercentage}%
                          </div>
                        </div>
                      )}
                      {c.eligibilitySnapshot?.riskGrade && (
                        <div>
                          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>RISK GRADE</div>
                          <div style={{ fontSize: 12, color: SLATE, fontWeight: 700 }}>{c.eligibilitySnapshot.riskGrade}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 28, flexWrap: 'wrap' }}>
            <button onClick={() => paginate(-1)} disabled={page === 1}
              style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: page === 1 ? '#f8fafc' : '#fff', color: page === 1 ? '#9ca3af' : '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
              <ArrowLeftOutlined /> Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pg = i + 1;
              if (totalPages > 7) {
                if (page <= 4) pg = i + 1;
                else if (page >= totalPages - 3) pg = totalPages - 6 + i;
                else pg = page - 3 + i;
              }
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  style={{ width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: page === pg ? GRAD : '#fff', color: page === pg ? '#fff' : '#374151', boxShadow: page === pg ? '0 2px 10px rgba(5,150,105,.3)' : 'none' }}>
                  {pg}
                </button>
              );
            })}
            <button onClick={() => paginate(1)} disabled={page === totalPages}
              style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: page === totalPages ? '#f8fafc' : '#fff', color: page === totalPages ? '#9ca3af' : '#374151', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
              Next <ArrowRightOutlined />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AmountBlock({ label, value, color, highlight }) {
  return (
    <div style={{ flex: 1, background: highlight ? '#ecfdf5' : '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 14px', gap: 3 }}>
      <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: highlight ? 15 : 13, fontWeight: highlight ? 800 : 600, color }}>{value}</div>
    </div>
  );
}

function MetricChip({ label, value, highlight }) {
  const PRIMARY = '#5C039B';
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 12px' }}>
      <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: highlight ? 800 : 600, color: highlight ? PRIMARY : '#374151' }}>{value}</div>
    </div>
  );
}
