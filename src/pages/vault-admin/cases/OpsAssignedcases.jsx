import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from '@/api/apiService';
import { message, Spin, Select } from 'antd';
import {
  EyeOutlined, ReloadOutlined, SearchOutlined,
  CheckCircleOutlined, ClockCircleOutlined, RedoOutlined,
  ArrowLeftOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const PRIMARY = '#5C039B';
const GRAD = 'linear-gradient(135deg,#5C039B 0%,#03A4F4 100%)';
const GREEN = '#059669';
const AMBER = '#d97706';
const RED = '#dc2626';
const SLATE = '#64748b';

const roleSlugMap = {
  '18': 'vault-admin',
  '23': 'vault-ops',
  '26': 'vault-advisor',
};

const ALL_STATUSES = [
  { key: 'all', label: 'All' },
  { key: 'Assigned - Pending Review', label: 'Pending Review' },
  { key: 'Under Review', label: 'Under Review' },
  { key: 'Returned - Pending Correction', label: 'Returned' },
  { key: 'Resubmitted-After Correction', label: 'Resubmitted' },
  { key: 'Bank Application', label: 'Bank App' },
  { key: 'Pre-Approved', label: 'Pre-Approved' },
  { key: 'Collecting Documentation', label: 'Collecting Docs' },
  { key: 'Valuation', label: 'Valuation' },
  { key: 'FOL Processed', label: 'FOL Processed' },
  { key: 'FOL Issued', label: 'FOL Issued' },
  { key: 'FOL Signed', label: 'FOL Signed' },
  { key: 'Disbursed', label: 'Disbursed' },
  { key: 'Rejected', label: 'Rejected' },
  { key: 'Lost', label: 'Lost' },
];

const STATUS_STYLE = {
  'Assigned - Pending Review':    { color: AMBER,   bg: '#fffbeb' },
  'Under Review':                  { color: '#3b82f6', bg: '#eff6ff' },
  'Returned - Pending Correction': { color: RED,    bg: '#fef2f2' },
  'Resubmitted-After Correction':  { color: '#8b5cf6', bg: '#f3e8ff' },
  'Bank Application':              { color: PRIMARY, bg: '#faf5ff' },
  'Pre-Approved':                  { color: GREEN,  bg: '#ecfdf5' },
  'Collecting Documentation':      { color: AMBER,  bg: '#fffbeb' },
  'Valuation':                     { color: AMBER,  bg: '#fffbeb' },
  'FOL Processed':                 { color: '#6366f1', bg: '#eef2ff' },
  'FOL Issued':                    { color: '#06b6d4', bg: '#ecfeff' },
  'FOL Signed':                    { color: '#14b8a6', bg: '#f0fdfa' },
  'Disbursed':                     { color: GREEN,  bg: '#ecfdf5' },
  'Rejected':                      { color: RED,    bg: '#fef2f2' },
  'Lost':                          { color: SLATE,  bg: '#f3f4f6' },
};

const getStatusStyle = (s) => STATUS_STYLE[s] || { color: SLATE, bg: '#f3f4f6' };

const STRIPE_COLORS = {
  'Assigned - Pending Review': AMBER,
  'Under Review': '#3b82f6',
  'Returned - Pending Correction': RED,
  'Resubmitted-After Correction': '#8b5cf6',
  'Disbursed': GREEN,
  'Pre-Approved': GREEN,
};
const stripeColor = (s) => STRIPE_COLORS[s] || PRIMARY;

const fmtDate = (d) => d ? dayjs(d).format('DD MMM YYYY') : '—';
const fmtAED = (v) => v ? `AED ${Number(v).toLocaleString()}` : 'AED —';

function DocBar({ summary }) {
  if (!summary) return <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>;
  const { uploadedCount = 0, totalRequired = 0, verifiedCount = 0, completionPercentage = 0 } = summary;
  const pct = Math.round(completionPercentage);
  const barColor = pct === 100 ? GREEN : pct >= 60 ? AMBER : RED;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: SLATE }}>{uploadedCount}/{totalRequired} uploaded · {verifiedCount} verified</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: barColor }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width .3s' }} />
      </div>
    </div>
  );
}

export default function OpsAssignedcases() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const roleCode = user?.role?.code;
  const roleSlug = roleSlugMap[roleCode] ?? 'vault-ops';

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchCases = useCallback(async (p = page, l = limit, st = status, q = search) => {
    setLoading(true);
    try {
      let url = `vault/cases/ops/my-cases?page=${p}&limit=${l}`;
      if (q) url += `&search=${encodeURIComponent(q)}`;
      if (st !== 'all') url += `&caseStatus=${encodeURIComponent(st)}`;
      const res = await apiService.get(url);
      if (res?.success) {
        setCases(res.data || []);
        setTotal(res.total || res.pagination?.total || res.data?.length || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      } else {
        message.error(res?.message || 'Failed to load applications');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, search]);

  useEffect(() => { fetchCases(page, limit, status, search); }, [page, limit, status, search]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setSearch(searchInput);
      setPage(1);
    }
  };

  const handleStatusChange = (key) => {
    setStatus(key);
    setPage(1);
  };

  // Stats derived from local fetched data
  const pendingReview = cases.filter(c => c.currentStatus === 'Assigned - Pending Review').length;
  const resubmitted   = cases.filter(c => c.currentStatus === 'Resubmitted-After Correction').length;
  const inProgress    = cases.filter(c => !['Disbursed', 'Rejected', 'Lost', 'Draft'].includes(c.currentStatus)).length;

  const paginate = (delta) => {
    const np = page + delta;
    if (np < 1 || np > totalPages) return;
    setPage(np);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb' }}>

      {/* Gradient header */}
      <div style={{ background: GRAD, padding: '24px 28px 28px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>My Assigned Applications</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>Review and process applications assigned to you</div>
            </div>
            <button
              onClick={() => fetchCases(page, limit, status, search)}
              disabled={loading}
              style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ReloadOutlined spin={loading} />
            </button>
          </div>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Total', value: total, color: 'rgba(255,255,255,.25)' },
              { label: 'Pending Review', value: pendingReview, color: `${AMBER}55` },
              { label: 'In Progress', value: inProgress, color: 'rgba(255,255,255,.2)' },
              { label: 'Resubmitted', value: resubmitted, color: '#8b5cf655' },
            ].map(chip => (
              <div key={chip.label} style={{ background: chip.color, borderRadius: 12, padding: '8px 16px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{chip.value}</div>
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
            <Select
              value={limit}
              onChange={(v) => { setLimit(v); setPage(1); }}
              options={[10, 20, 50].map(v => ({ label: `${v} / page`, value: v }))}
              size="small"
              style={{ width: 110 }}
            />
          </div>
          {(search || status !== 'all') && (
            <button onClick={() => { setSearch(''); setSearchInput(''); setStatus('all'); setPage(1); }}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, color: SLATE, cursor: 'pointer' }}>
              Clear Filters
            </button>
          )}
        </div>

        {/* Status pills */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '12px 16px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'inline-flex', gap: 6 }}>
            {ALL_STATUSES.map(s => {
              const ss = getStatusStyle(s.key);
              const isActive = status === s.key;
              return (
                <button key={s.key} onClick={() => handleStatusChange(s.key)}
                  style={{
                    padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                    background: isActive ? (s.key === 'all' ? PRIMARY : ss.color) : '#f8fafc',
                    color: isActive ? '#fff' : (s.key === 'all' ? PRIMARY : ss.color),
                    border: `1.5px solid ${isActive ? 'transparent' : (s.key === 'all' ? `${PRIMARY}40` : `${ss.color}60`)}`,
                  }}>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 13, color: SLATE }}>
            Showing <strong>{cases.length}</strong> of <strong>{total}</strong> applications
            {status !== 'all' && ` · filtered by "${ALL_STATUSES.find(s => s.key === status)?.label}"`}
          </span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Page {page} of {totalPages}</span>
        </div>

        {/* Case cards */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : cases.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No applications found</div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>Try adjusting your filters</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cases.map((c) => {
              const ss = getStatusStyle(c.currentStatus);
              const sc = stripeColor(c.currentStatus);
              const bs = c.bankSelection || {};
              const ci = c.clientInfo || {};
              const pi = c.propertyInfo || {};
              const ds = c.documentSummary || {};
              const pickedAt = c.opsQueue?.pickedUpBy?.pickedUpAt;
              const isResubmitted = c.currentStatus === 'Resubmitted-After Correction';
              const isReturned = c.currentStatus === 'Returned - Pending Correction';

              return (
                <div key={c._id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)', overflow: 'hidden', display: 'flex' }}>
                  {/* Left color stripe */}
                  <div style={{ width: 4, background: sc, flexShrink: 0 }} />

                  <div style={{ flex: 1, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                      {/* Case ref + client */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: PRIMARY }}>{c.caseReference}</span>
                          <span style={{ background: ss.bg, color: ss.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                            {c.currentStatus}
                          </span>
                          {(isResubmitted || isReturned) && (
                            <span style={{ background: '#fef3c7', color: AMBER, borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <RedoOutlined /> {isResubmitted ? 'Needs Review' : 'Action Required'}
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: SLATE }}>
                            <span style={{ fontSize: 10, color: '#9ca3af', marginRight: 4 }}>CLIENT</span>
                            <strong>{ci.fullName || '—'}</strong>
                          </span>
                          {ci.mobile && <span style={{ fontSize: 12, color: SLATE }}>{ci.mobile}</span>}
                          {ci.email && <span style={{ fontSize: 12, color: SLATE }}>{ci.email}</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => navigate(`/dashboard/${roleSlug}/case/view/${c._id}`)}
                          style={{ padding: '9px 18px', borderRadius: 10, border: `1.5px solid ${PRIMARY}`, background: '#faf5ff', color: PRIMARY, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <EyeOutlined /> View Application
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/${roleSlug}/case/assigned/view/${c._id}`)}
                          style={{
                            padding: '9px 18px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                            background: (isResubmitted || isReturned) ? GRAD : '#f1f5f9',
                            color: (isResubmitted || isReturned) ? '#fff' : '#374151',
                          }}>
                          <CheckCircleOutlined /> {(isResubmitted || isReturned) ? 'Review Now' : 'Review'}
                        </button>
                      </div>
                    </div>

                    {/* Metrics row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
                      <MetricChip label="Bank" value={bs.bankName || '—'} />
                      <MetricChip label="Product" value={bs.productName || '—'} />
                      <MetricChip label="Loan Amount" value={fmtAED(pi.loanAmount)} highlight />
                      <MetricChip label="Interest Rate" value={bs.interestRate ? `${bs.interestRate}%` : '—'} />
                      <MetricChip label="Tenure" value={bs.tenureYears ? `${bs.tenureYears} yrs` : '—'} />
                      <MetricChip label="Monthly EMI" value={fmtAED(bs.monthlyEMI)} />
                    </div>

                    {/* Doc progress + dates */}
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div style={{ flex: '1 1 200px' }}>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>DOCUMENT PROGRESS</span>
                        <DocBar summary={ds} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {pickedAt && (
                          <div>
                            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>ASSIGNED</div>
                            <div style={{ fontSize: 12, color: SLATE, fontWeight: 600 }}>{fmtDate(pickedAt)}</div>
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>CREATED</div>
                          <div style={{ fontSize: 12, color: SLATE, fontWeight: 600 }}>{fmtDate(c.createdAt)}</div>
                        </div>
                        {c.eligibilitySnapshot?.isEligible !== undefined && (
                          <div>
                            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>ELIGIBILITY</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: c.eligibilitySnapshot.isEligible ? GREEN : RED }}>
                              {c.eligibilitySnapshot.isEligible ? '✓ Eligible' : '✗ Not Eligible'}
                              {c.eligibilitySnapshot.riskGrade && ` · ${c.eligibilitySnapshot.riskGrade}`}
                            </div>
                          </div>
                        )}
                      </div>
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
            <button
              onClick={() => paginate(-1)} disabled={page === 1}
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
                  style={{ width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: page === pg ? GRAD : '#fff', color: page === pg ? '#fff' : '#374151', boxShadow: page === pg ? '0 2px 10px rgba(92,3,155,.3)' : 'none' }}>
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => paginate(1)} disabled={page === totalPages}
              style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: page === totalPages ? '#f8fafc' : '#fff', color: page === totalPages ? '#9ca3af' : '#374151', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
              Next <ArrowRightOutlined />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricChip({ label, value, highlight }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 12px' }}>
      <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: highlight ? 800 : 600, color: highlight ? PRIMARY : '#374151' }}>{value}</div>
    </div>
  );
}
