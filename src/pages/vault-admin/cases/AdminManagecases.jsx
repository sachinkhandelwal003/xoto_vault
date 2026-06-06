import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from "@/api/apiService";
import {
  Button, Typography, Spin, message, Modal, Input, Tag, Alert, Progress,
} from 'antd';
import {
  FileTextOutlined, CalendarOutlined, EyeOutlined,
  ReloadOutlined, SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

const PRIMARY       = '#5C039B';
const GRAD          = 'linear-gradient(135deg,#5C039B 0%,#03A4F4 100%)';
const GREEN         = '#059669';
const WARNING_COLOR = '#f59e0b';
const ERROR_COLOR   = '#ef4444';
const INFO_COLOR    = '#3b82f6';
const SUCCESS_LIGHT = '#D1FAE5';
const INFO_LIGHT    = '#DBEAFE';

/* ─── Status list ─── */
const CASE_STATUSES = [
  'Draft', 'Submitted to Xoto', 'In Ops Queue - Pending Pick-up',
  'Assigned - Pending Review', 'Under Review', 'Returned - Pending Correction',
  'Bank Application', 'Collecting Documentation', 'Pre-Approved',
  'Valuation', 'FOL Processed', 'FOL Issued', 'FOL Signed',
  'Disbursed', 'Rejected', 'Lost',
];

/* ─── Status colour map ─── */
const STATUS_STYLE = {
  Draft:                             { color: '#64748b', bg: '#f1f5f9',  dot: '#94a3b8' },
  'Submitted to Xoto':               { color: INFO_COLOR,  bg: '#eff6ff',  dot: '#3b82f6' },
  'In Ops Queue - Pending Pick-up':  { color: WARNING_COLOR, bg: '#fffbeb', dot: '#f59e0b' },
  'Assigned - Pending Review':       { color: PRIMARY,    bg: '#f5f3ff',  dot: '#8b5cf6' },
  'Under Review':                    { color: PRIMARY,    bg: '#f5f3ff',  dot: '#8b5cf6' },
  'Returned - Pending Correction':   { color: ERROR_COLOR, bg: '#fef2f2', dot: '#ef4444' },
  'Bank Application':                { color: '#0891b2',  bg: '#ecfeff',  dot: '#06b6d4' },
  'Collecting Documentation':        { color: WARNING_COLOR, bg: '#fffbeb', dot: '#f59e0b' },
  'Pre-Approved':                    { color: GREEN,      bg: '#ecfdf5',  dot: '#10b981' },
  Valuation:                         { color: '#ea580c',  bg: '#fff7ed',  dot: '#f97316' },
  'FOL Processed':                   { color: GREEN,      bg: '#ecfdf5',  dot: '#10b981' },
  'FOL Issued':                      { color: '#4338ca',  bg: '#eef2ff',  dot: '#6366f1' },
  'FOL Signed':                      { color: '#be185d',  bg: '#fdf2f8',  dot: '#ec4899' },
  Disbursed:                         { color: GREEN,      bg: '#ecfdf5',  dot: '#10b981' },
  Rejected:                          { color: ERROR_COLOR, bg: '#fef2f2', dot: '#ef4444' },
  Lost:                              { color: '#64748b',  bg: '#f1f5f9',  dot: '#94a3b8' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || { color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' };
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

const DocProgressBar = ({ summary = {} }) => {
  const pct  = summary.completionPercentage ?? 0;
  const done = summary.uploadedCount ?? summary.documentsUploadedCount ?? 0;
  const tot  = summary.totalRequired ?? (summary.requiredDocuments?.length ?? 0);
  const full = pct >= 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Documents</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: full ? GREEN : WARNING_COLOR }}>{done}/{tot}</span>
      </div>
      <div style={{ height: 5, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 6,
          background: full ? `linear-gradient(90deg,${GREEN},#10b981)` : GRAD,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{pct}% complete</div>
    </div>
  );
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return 'AED 0';
  return `AED ${Number(value).toLocaleString()}`;
};

/* ══════════════════════════════════════════════════════════════ */
const AdminManagecases = () => {
  const navigate = useNavigate();
  // @ts-ignore
  const { user } = useSelector(s => s.auth);

  const [cases,        setCases]       = useState([]);
  const [loading,      setLoading]     = useState(false);
  const [currentPage,  setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [totalCases,   setTotalCases]  = useState(0);
  const [activeStatus, setActiveStatus] = useState('all');
  const [search,       setSearch]      = useState('');


  /* ── Fetch Cases ── */
  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/vault/cases?page=${currentPage}&limit=${itemsPerPage}`;
      if (activeStatus !== 'all') url += `&status=${encodeURIComponent(activeStatus)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await apiService.get(url);
      if (response?.success) {
        setCases(response.data || []);
        setTotalCases(response.pagination?.total || 0);
      }
    } catch (err) {
      message.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, activeStatus, search]);

  useEffect(() => { fetchCases(); }, [fetchCases]);


  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  /* ── Derived stats from current fetched page (approximate) ── */
  const totalInQueue    = cases.filter(c => c.currentStatus === 'In Ops Queue - Pending Pick-up').length;
  const totalInProgress = cases.filter(c => ['Assigned - Pending Review', 'Under Review', 'Bank Application', 'Collecting Documentation'].includes(c.currentStatus)).length;
  const totalDisbursed  = cases.filter(c => c.currentStatus === 'Disbursed').length;

  /* ── Case card ── */
  const CaseCard = ({ item }) => {
    const isDisbursed = item.currentStatus === 'Disbursed';
    const topColor    = isDisbursed ? GREEN : PRIMARY;

    const clientInitial = (item.clientInfo?.fullName || 'U')[0].toUpperCase();
    const loanAmount    = item.propertyInfo?.loanAmount || item.calculations?.loanAmount || 0;
    const bankName      = item.bankSelection?.bankName || item.loanInfo?.selectedBank || '—';
    const docSummary    = item.documentSummary || item.documentStatus || {};

    return (
      <div style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        border: `1px solid ${isDisbursed ? `${GREEN}30` : `${PRIMARY}15`}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
      >
        {/* Top colour stripe */}
        <div style={{ height: 4, background: isDisbursed ? `linear-gradient(90deg,${GREEN},#10b981)` : GRAD }} />

        <div style={{ padding: '16px 18px' }}>
          {/* Row 1: ref + date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b', letterSpacing: 0.2 }}>{item.caseReference}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CalendarOutlined /> {dayjs(item.createdAt).format('DD MMM YYYY')}
              </div>
            </div>
            <StatusBadge status={item.currentStatus} />
          </div>

          {/* Row 2: client */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: GRAD, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#fff', fontWeight: 800,
            }}>
              {clientInitial}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{item.clientInfo?.fullName || '—'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{item.caseReference}</div>
            </div>
          </div>

          {/* Row 3: metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>Loan</div>
              <div style={{ fontWeight: 800, fontSize: 12, color: PRIMARY }}>AED {loanAmount.toLocaleString()}</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>Bank</div>
              <div style={{ fontWeight: 700, fontSize: 11, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bankName}</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>Status</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: (STATUS_STYLE[item.currentStatus] || {}).color || '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.currentStatus}</div>
            </div>
          </div>

          {/* Row 4: doc progress */}
          <div style={{ marginBottom: 14 }}>
            <DocProgressBar summary={docSummary} />
          </div>

          {/* Row 5: actions */}
          <button
            onClick={() => navigate(`/dashboard/vault-admin/case/view/${item._id}`)}
            style={{
              width: '100%', padding: '9px 0', borderRadius: 10, border: 'none',
              background: GRAD, color: '#fff', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              boxShadow: '0 3px 10px rgba(92,3,155,0.25)',
            }}
          >
            <EyeOutlined /> View Full Application
          </button>
        </div>
      </div>
    );
  };

  /* ── Pagination ── */
  const totalPages = Math.ceil(totalCases / itemsPerPage) || 1;

  const PaginationBar = () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', flexWrap: 'wrap', gap: 10, marginTop: 24,
    }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>
        {totalCases > 0
          ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}–${Math.min(currentPage * itemsPerPage, totalCases)} of ${totalCases} applications`
          : '0 applications'}
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage(p => p - 1)}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: currentPage <= 1 ? '#f8fafc' : '#fff', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', color: currentPage <= 1 ? '#cbd5e1' : '#1e293b', fontSize: 12, fontWeight: 600 }}
        >
          ← Prev
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const pg = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage + i - 2;
          if (pg < 1 || pg > totalPages) return null;
          return (
            <button
              key={pg}
              onClick={() => setCurrentPage(pg)}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid', borderColor: currentPage === pg ? PRIMARY : '#e2e8f0', background: currentPage === pg ? PRIMARY : '#fff', color: currentPage === pg ? '#fff' : '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {pg}
            </button>
          );
        })}
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: currentPage >= totalPages ? '#f8fafc' : '#fff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: currentPage >= totalPages ? '#cbd5e1' : '#1e293b', fontSize: 12, fontWeight: 600 }}
        >
          Next →
        </button>
      </div>
    </div>
  );


  /* ── Render ── */
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 40 }}>

      {/* ── Gradient Header ── */}
      <div style={{ background: GRAD, padding: '28px 32px 36px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -30, right: -30,    width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: '45%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            Application Management
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
            Manage all mortgage applications and preview commissions
          </p>

          {/* 4 stat chips */}
          <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
            {[
              { label: 'Total',       value: totalCases,      color: '#fff',    bg: 'rgba(255,255,255,0.15)' },
              { label: 'In Queue',    value: totalInQueue,    color: '#fde68a', bg: 'rgba(245,158,11,0.2)' },
              { label: 'In Progress', value: totalInProgress, color: '#bfdbfe', bg: 'rgba(59,130,246,0.2)' },
              { label: 'Disbursed',   value: totalDisbursed,  color: '#6ee7b7', bg: 'rgba(16,185,129,0.2)' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '10px 18px', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter bar (floats up over header bottom) ── */}
      <div style={{ padding: '0 32px', marginTop: -16, position: 'relative', zIndex: 10 }}>
        <div style={{
          background: '#fff', borderRadius: 14, padding: '12px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Search client name or application reference…"
            value={search}
            onChange={handleSearchChange}
            allowClear
            style={{ borderRadius: 9, flex: '1 1 240px', maxWidth: 380 }}
          />
          <button
            onClick={() => fetchCases()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 9, border: '1.5px solid #e2e8f0',
              background: '#fff', cursor: 'pointer', color: '#64748b',
              fontSize: 13, fontWeight: 600,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.color = PRIMARY; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
          >
            <ReloadOutlined spin={loading} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Status chips ── */}
      <div style={{ padding: '16px 32px 0', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 4, width: 'max-content' }}>
          {['all', ...CASE_STATUSES].map(status => {
            const isActive = activeStatus === status;
            const displayName = status === 'all' ? 'All Applications' : status;
            return (
              <button
                key={status}
                onClick={() => { setActiveStatus(status); setCurrentPage(1); }}
                style={{
                  padding: '6px 16px', borderRadius: 20, border: '1.5px solid',
                  borderColor: isActive ? PRIMARY : '#e2e8f0',
                  background: isActive ? PRIMARY : '#fff',
                  color: isActive ? '#fff' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                  boxShadow: isActive ? `0 2px 8px ${PRIMARY}40` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {displayName}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Cases grid ── */}
      <div style={{ padding: '20px 32px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
            <p style={{ color: '#94a3b8', marginTop: 14, fontSize: 14 }}>Loading applications…</p>
          </div>
        ) : cases.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '72px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FileTextOutlined style={{ fontSize: 40, color: '#d8b4fe' }} />
            </div>
            <h3 style={{ color: '#374151', margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>
              No applications found
            </h3>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>
              No applications match the filter <strong>{activeStatus === 'all' ? 'All Applications' : activeStatus}</strong>
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {cases.map(item => (
                <CaseCard key={item._id} item={item} />
              ))}
            </div>
            <PaginationBar />
          </>
        )}
      </div>

    </div>
  );
};

export default AdminManagecases;
