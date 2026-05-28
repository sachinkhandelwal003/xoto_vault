import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from "@/api/apiService";
import {
  Button, Tag, Select, Spin, message, Avatar, Empty, Pagination, Tabs, Space,
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, BankOutlined,
  EyeOutlined, FileTextOutlined, CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomTable from '@/components/common/CustomTable';

const P   = '#5C039B';
const PL  = '#f5f0ff';
const GN  = '#059669';
const GNL = '#ecfdf5';
const BL  = '#2563eb';
const BLL = '#eff6ff';
const AM  = '#d97706';
const AML = '#fffbeb';
const RD  = '#dc2626';

const STATUS_CFG = {
  Draft:    { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' },
  Sent:     { bg: BLL,       color: BL,        dot: BL        },
  Viewed:   { bg: AML,       color: AM,        dot: AM        },
  Accepted: { bg: GNL,       color: GN,        dot: GN        },
  Rejected: { bg: '#fef2f2', color: RD,        dot: RD        },
  Expired:  { bg: '#fff7ed', color: '#ea580c', dot: '#ea580c' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: cfg.bg, color: cfg.color,
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};

const STATUSES = ['All', 'Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired'];

const roleSlugMap = {
  18: "vault-admin",
  21: "vaultpartner",
  22: "vaultagent",
  23: "vault-ops",
  26: "vault-advisor",
};

const ViewProposal = () => {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const rawRole = user?.role;
  const roleCodeNum = rawRole ? (typeof rawRole === "object" ? Number(rawRole.code) : Number(rawRole)) : 18;
  const roleSlug = roleSlugMap[roleCodeNum] ?? "vault-advisor";

  const basePath = roleCodeNum === 21
    ? '/dashboard/vaultpartner/proposals'
    : roleCodeNum === 22
    ? '/dashboard/vaultagent/proposals'
    : roleCodeNum === 18
    ? '/dashboard/vault-admin/proposals'
    : '/dashboard/vault-advisor/proposals';

  const [proposals, setProposals]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ search: '', status: 'All' });
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);

  const fetchProposals = useCallback(async (pg, f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: 10 });
      if (f.status && f.status !== 'All') params.set('status', f.status);
      if (f.search) params.set('search', f.search);
      const res = await apiService.get(`/vault/proposals?${params.toString()}`);
      setProposals(res?.data || []);
      setTotal(res?.total || res?.pagination?.total || 0);
    } catch {
      message.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals(page, filters);
  }, [page, filters, fetchProposals]);

  const handleTabChange = (key) => {
    setFilters(prev => ({ ...prev, status: key }));
    setPage(1);
  };

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_, r) => {
        const customerName =
          r.leadId?.customerInfo?.fullName ||
          `${r.leadId?.customerInfo?.firstName || ''} ${r.leadId?.customerInfo?.lastName || ''}`.trim() ||
          r.customerSnapshot?.fullName ||
          '—';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar size={32} style={{ background: PL, color: P, fontWeight: 800, fontSize: 13 }}>
              {customerName[0]?.toUpperCase() || 'C'}
            </Avatar>
            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{customerName}</div>
          </div>
        );
      }
    },
    {
      title: 'Proposal Ref',
      key: 'proposalReference',
      render: (_, r) => <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{r.proposalReference}</span>
    },
    {
      title: 'Selected Banks',
      key: 'selectedBanks',
      render: (_, r) => {
        const banks = r.selectedBanks || [];
        const recommended = banks.find(b => b.isRecommended);
        return (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {banks.slice(0, 3).map((b, i) => (
                <Tag key={i} color="purple" style={{ borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
                  {b.bankName}
                </Tag>
              ))}
            </div>
            {recommended && (
              <div style={{ fontSize: 10, color: GN, fontWeight: 700, marginTop: 4 }}>
                ⭐ {recommended.bankName} recommended
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Best Rate',
      key: 'bestRate',
      render: (_, r) => {
        const banks = r.selectedBanks || [];
        if (banks.length === 0) return '—';
        const bestRate = Math.min(...banks.map(b => b.snapshotRate ?? b.rate ?? 99));
        return <span style={{ fontWeight: 700, color: P }}>{bestRate}%</span>;
      }
    },
    {
      title: 'Status',
      key: 'status',
      filterable: true,
      filterOptions: STATUSES.filter(s => s !== 'All').map(s => ({ value: s, label: s })),
      render: (_, r) => <StatusBadge status={r.status} />
    },
    {
      title: 'Created Date',
      key: 'createdAt',
      render: (_, r) => <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{dayjs(r.createdAt).format('DD MMM YYYY')}</span>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, r) => {
        const hasLead = !!(r.leadId?._id || r.leadId);
        const leadId = r.leadId?._id || r.leadId;
        const leadPath = `/dashboard/${roleSlug}/vault/lead/${leadId}`;
        return (
          <Space size={6}>
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`${basePath}/${r._id}`)}
              style={{ background: P, borderColor: P, borderRadius: 8, fontWeight: 600, fontSize: 12 }}
            >
              View
            </Button>
            {hasLead && (
              <Button
                size="small"
                onClick={() => navigate(leadPath)}
                style={{
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#2563eb',
                  borderColor: '#bfdbfe',
                  background: '#eff6ff',
                }}
              >
                View Lead
              </Button>
            )}
          </Space>
        );
      }
    }
  ];

  const tabItems = STATUSES.map(s => ({
    label: s,
    key: s,
  }));

  return (
    <div style={{ background: '#f9f8ff', minHeight: '100vh', fontFamily: 'inherit' }}>
      <style>{`
        .proposal-tabs .ant-tabs-tab-active {
          background-color: ${P} !important;
          border-color: ${P} !important;
        }
        .proposal-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: white !important;
        }
        .proposal-tabs .ant-tabs-tab:hover {
          color: ${P} !important;
        }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)', padding: '24px 32px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff' }}>My Proposals</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
              Bank mortgage comparisons you've created
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchProposals(page, filters)}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 10, fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(`${basePath}/create`)}
              style={{ background: '#fff', color: P, border: 'none', borderRadius: 10, fontWeight: 700 }}
            >
              New Proposal
            </Button>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* ── Tabs Filter bar ── */}
        <div className="proposal-tabs" style={{ marginBottom: 20 }}>
          <Tabs
            activeKey={filters.status}
            onChange={handleTabChange}
            type="card"
            items={tabItems}
          />
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: P, fontWeight: 600 }}>Loading proposals…</div>
          </div>
        ) : proposals.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ede9ff', padding: '80px 32px', textAlign: 'center' }}>
            <FileTextOutlined style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#475569', marginBottom: 8 }}>No proposals yet</div>
            <div style={{ color: '#94a3b8', marginBottom: 24 }}>Create your first bank comparison proposal</div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate(`${basePath}/create`)}
              style={{ background: P, borderColor: P, borderRadius: 12, fontWeight: 700 }}
            >
              Create Proposal
            </Button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ede9ff', overflow: 'hidden', boxShadow: '0 2px 8px rgba(92,3,155,0.06)' }}>
            <CustomTable
              columns={columns}
              data={proposals}
              loading={loading}
              totalItems={total}
              currentPage={page}
              itemsPerPage={10}
              onPageChange={(pg) => setPage(pg)}
              showSearch={true}
              onFilter={(tblFilters) => {
                setFilters(prev => ({
                  ...prev,
                  search: tblFilters.search !== undefined ? tblFilters.search : prev.search,
                  status: tblFilters.status !== undefined && tblFilters.status !== '' ? tblFilters.status : prev.status,
                }));
                setPage(1);
              }}
              rowKey="_id"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewProposal;
