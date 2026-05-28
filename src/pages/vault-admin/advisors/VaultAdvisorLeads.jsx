import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { apiService } from "@/api/apiService";
import CustomTable from "@/components/common/CustomTable";
import {
  FileText, TrendingUp, Clock, CheckCircle2, Eye, Upload,
  Users, UserCheck, Briefcase, DollarSign, RefreshCw
} from 'lucide-react';

const PURPLE = "#5C039B";
const PURPLE_LIGHT = "#F5F0FF";
const PURPLE_BORDER = "#E9D5FF";

// Role slug mapping for navigation
const roleSlugMap = {
  0: "superadmin", 1: "admin", 2: "customer",
  15: "agency", 16: "agent", 17: "developer", 
  18: "vault-admin", 21: "partner", 22: "vault-agent",
  23: "vault-ops", 26: "vault-advisor"
};

/* â”€â”€ Status Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const STATUS_MAP = {
  'New': { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6', border: '#bfdbfe' },
  'Assigned': { bg: PURPLE_LIGHT, color: PURPLE, dot: PURPLE, border: PURPLE_BORDER },
  'Contacted': { bg: '#fffbeb', color: '#92400e', dot: '#f59e0b', border: '#fde68a' },
  'Qualified': { bg: '#f0fdf4', color: '#166534', dot: '#22c55e', border: '#bbf7d0' },
  'Collecting Documentation': { bg: '#faf5ff', color: '#581c87', dot: '#a855f7', border: '#e9d5ff' },
  'Documents Complete': { bg: '#ecfeff', color: '#0e7490', dot: '#06b6d4', border: '#a5f3fc' },
  'Application Opened': { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b', border: '#fde68a' },
  'Submitted to Bank': { bg: '#e0e7ff', color: '#3730a3', dot: '#6366f1', border: '#c7d2fe' },
  'Pre-Approved': { bg: '#dcfce7', color: '#166534', dot: '#22c55e', border: '#bbf7d0' },
  'Valuation': { bg: '#fef9c3', color: '#854d0e', dot: '#eab308', border: '#fef08a' },
  'FOL Issued': { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', border: '#bfdbfe' },
  'FOL Signed': { bg: '#f3e8ff', color: '#6b21a5', dot: '#a855f7', border: '#e9d5ff' },
  'Disbursed': { bg: '#ecfdf5', color: '#065f46', dot: '#10b981', border: '#d1fae5' },
  'Lost': { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444', border: '#fecaca' },
  'Rejected': { bg: '#fef2f2', color: '#b91c1c', dot: '#dc2626', border: '#fecaca' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { bg: '#f8fafc', color: '#475569', dot: '#94a3b8', border: '#e2e8f0' };
  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: 5, 
      padding: '3px 10px', 
      borderRadius: 999, 
      whiteSpace: 'nowrap', 
      background: s.bg, 
      color: s.color, 
      border: `1px solid ${s.border}`, 
      fontSize: 11.5, 
      fontWeight: 600 
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status || 'Unknown'}
    </span>
  );
};

/* â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div style={{ 
    background: '#fff', 
    borderRadius: 14, 
    padding: '16px 20px', 
    border: `1px solid ${accent === PURPLE ? PURPLE_BORDER : '#e8edf5'}`, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 14, 
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'all 0.2s ease',
    flex: 1,
    minWidth: 140
  }}>
    <div style={{ 
      width: 42, 
      height: 42, 
      borderRadius: 12, 
      flexShrink: 0, 
      background: `${accent}14`, 
      border: `1.5px solid ${accent}30`, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Icon size={18} style={{ color: accent }} />
    </div>
    <div>
      <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</p>
      <p style={{ 
        margin: '3px 0 0', 
        fontSize: 22, 
        fontWeight: 700, 
        color: '#0f172a', 
        fontFamily: "'JetBrains Mono', monospace", 
        letterSpacing: '-0.02em', 
        lineHeight: 1 
      }}>{value ?? 0}</p>
    </div>
  </div>
);

/* â”€â”€ Helper: does this lead require docs? â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const needsDocs = (lead) => lead.referralType && lead.referralType !== 'Referral Only';

/* â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const VaultAdvisorLeads = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const roleCode = user?.role?.code;
  const roleSlug = roleSlugMap[roleCode] ?? "superadmin";
  
  // Determine if user is Advisor (code 26)
  const isAdvisor = roleCode === 26;
  
  const [page, setPage] = useState(1);
  const limit = 10;

  // API endpoint based on role
  const apiEndpoint =  '/vault/lead/advisor/my-leads' 
   

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['vault-leads', page, isAdvisor],
    queryFn: () => apiService.get(apiEndpoint, { params: { page, limit } }),
    keepPreviousData: true,
  });

  const leads = Array.isArray(data?.data) ? data.data : [];
  const totalLeads = data?.total || 0;
  const pagination = data?.pagination || { currentPage: page, limit, totalPages: 1 };
  const statusCounts = data?.statusCounts || data?.counts || null;

  const counts = statusCounts || leads.reduce((acc, l) => {
    acc[l.currentStatus] = (acc[l.currentStatus] || 0) + 1;
    return acc;
  }, {});

  const fmtAED = (n) => n ? Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 }) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  // Get counts for different statuses
  const qualifiedCount = counts['Qualified'] || 0;
  const inProgressCount = (counts['Contacted'] || 0) + (counts['Collecting Documentation'] || 0) + (counts['Documents Complete'] || 0);
  const disbursedCount = counts['Disbursed'] || 0;
  const newCount = counts['New'] || 0;
  const assignedCount = counts['Assigned'] || 0;

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      width: 220,
      render: (_, row) => (
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{row.customerInfo?.fullName || '—'}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#94a3b8' }}>{row.customerInfo?.email || ''}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#cbd5e1' }}>{row.customerInfo?.mobileNumber || ''}</p>
        </div>
      ),
    },
    {
      title: 'Property',
      key: 'property',
      width: 180,
      render: (_, row) => (
        <div>
          <p style={{ margin: 0, fontWeight: 500, color: '#1e293b', fontSize: 13 }}>
            AED {fmtAED(row.propertyDetails?.propertyValue)}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
            Loan: AED {fmtAED(row.propertyDetails?.loanAmountRequired)}
          </p>
          {row.propertyDetails?.propertyAddress?.area && (
            <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#cbd5e1' }}>
              {row.propertyDetails.propertyAddress.area}
            </p>
          )}
        </div>
      ),
    },
    {
      title: 'Referral',
      key: 'referralType',
      width: 140,
      render: (_, row) => row.referralType ? (
        <span style={{
          display: 'inline-block', 
          fontSize: 11.5, 
          fontWeight: 600, 
          padding: '3px 10px', 
          borderRadius: 999, 
          whiteSpace: 'nowrap',
          ...(needsDocs(row)
            ? { background: '#fefce8', color: '#854d0e', border: '1px solid #fde047' }
            : { background: PURPLE_LIGHT, color: PURPLE, border: `1px solid ${PURPLE_BORDER}` }),
        }}>
          {row.referralType}
        </span>
      ) : <span style={{ color: '#cbd5e1' }}>—</span>,
    },
    {
      title: 'Assigned To',
      key: 'assignedTo',
      width: 160,
      render: (_, row) => {
        const assigned = row.assignedTo;
        if (assigned?.advisorName) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={12} color={PURPLE} />
              <span style={{ fontSize: 12, color: '#374151' }}>{assigned.advisorName}</span>
            </div>
          );
        }
        if (row.assignedAdvisor) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={12} color={PURPLE} />
              <span style={{ fontSize: 12, color: '#374151' }}>{row.assignedAdvisor}</span>
            </div>
          );
        }
        return <span style={{ fontSize: 12, color: '#d97706' }}>Unassigned</span>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 180,
      render: (_, row) => <StatusBadge status={row.currentStatus} />,
    },
    {
      title: 'Created',
      key: 'createdAt',
      width: 120,
      render: (_, row) => (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap' }}>
          {fmtDate(row.createdAt)}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 160,
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          {needsDocs(row) && (
            <button
              onClick={() => navigate(`/dashboard/${roleSlug}/leads/${row._id}/documents`)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 8,
                border: `1px solid ${PURPLE_BORDER}`, background: PURPLE_LIGHT,
                color: PURPLE, fontSize: 11.5, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.14s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = PURPLE; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = PURPLE_LIGHT; e.currentTarget.style.color = PURPLE; }}
            >
              <Upload size={12} /> Docs
            </button>
          )}
          <button
            onClick={() => navigate(`/dashboard/${roleSlug}/leads/${row._id}`)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: `1px solid ${PURPLE_BORDER}`, background: '#fff', color: PURPLE,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.14s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = PURPLE; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = PURPLE; }}
            title="View Details"
          >
            <Eye size={14} />
          </button>
        </div>
      ),
    },
  ];

  // Error handling
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f7fb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>âš ï¸</div>
          <p style={{ color: '#b91c1c', marginBottom: 16, fontSize: 14 }}>{error?.message || 'Failed to load leads'}</p>
          <button 
            onClick={() => refetch()} 
            style={{ 
              padding: '9px 20px', 
              background: PURPLE, 
              color: '#fff', 
              border: 'none', 
              borderRadius: 9, 
              fontSize: 14, 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#f4f7fb' }}>
      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {isAdvisor ? 'My Assigned Leads' : 'My Leads'}
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 13.5, color: '#64748b' }}>
            {isAdvisor 
              ? 'Leads assigned to you by admin - manage and track progress' 
              : 'Monitor and manage all your mortgage referrals'}
          </p>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', background: '#fff', border: `1px solid ${PURPLE_BORDER}`,
            borderRadius: 10, fontSize: 13, fontWeight: 500, color: PURPLE,
            cursor: 'pointer', transition: 'all 0.2s ease',
            opacity: isFetching ? 0.7 : 1
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = PURPLE_LIGHT; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
        >
          <RefreshCw size={14} style={{ animation: isFetching ? 'spin 0.8s linear infinite' : 'none' }} />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Main Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon={FileText} label="Total Leads" value={totalLeads} accent={PURPLE} />
        <StatCard icon={TrendingUp} label="Qualified" value={qualifiedCount} accent="#16a34a" />
        <StatCard icon={Clock} label="In Progress" value={inProgressCount} accent="#f59e0b" />
        <StatCard icon={CheckCircle2} label="Disbursed" value={disbursedCount} accent="#0ea5e9" />
      </div>

      {/* Secondary Stats Row for Advisors */}
      {isAdvisor && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ 
            background: '#fff', borderRadius: 12, padding: '12px 20px', 
            border: `1px solid ${PURPLE_BORDER}`, flex: 1, minWidth: 150,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${PURPLE}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color={PURPLE} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>New Leads</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{newCount}</p>
            </div>
          </div>
          <div style={{ 
            background: '#fff', borderRadius: 12, padding: '12px 20px', 
            border: `1px solid ${PURPLE_BORDER}`, flex: 1, minWidth: 150,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={16} color="#d97706" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Assigned</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{assignedCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div style={{ 
        background: '#fff', 
        borderRadius: 16, 
        border: `1px solid ${PURPLE_BORDER}`, 
        overflow: 'hidden', 
        boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)' 
      }}>
        <CustomTable
          columns={columns}
          data={leads}
          loading={isLoading}
          error={error}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.limit,
            total: totalLeads,
            totalPages: pagination.totalPages,
          }}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(p) => setPage(p)}
          rowKey="_id"
          emptyText={isAdvisor ? "No leads assigned to you yet." : "No leads found. Create your first lead to get started."}
        />
      </div>
    </div>
  );
};

export default VaultAdvisorLeads;