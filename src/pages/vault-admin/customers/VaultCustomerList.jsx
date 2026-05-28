import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Button, Avatar, Space, Tooltip } from 'antd';
import {
  UserOutlined, EyeOutlined,
  CheckCircleOutlined, GlobalOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import CustomTable from '@/components/common/CustomTable';
import { apiService } from '@/api/apiService';
import dayjs from 'dayjs';

const P  = '#5C039B';
const GN = '#10B981';
const PL = '#f3e8ff';

const SOURCE_CFG = {
  vault:            { label: 'Vault',       color: '#5C039B', bg: '#f3e8ff'   },
  ecommerce:        { label: 'E-Commerce',  color: '#0891b2', bg: '#ecfeff'   },
  website:          { label: 'Website',     color: '#2563eb', bg: '#eff6ff'   },
  agent:            { label: 'Agent',       color: '#d97706', bg: '#fffbeb'   },
  lead_generation:  { label: 'Lead Gen',    color: '#7c3aed', bg: '#f5f3ff'   },
  manual:           { label: 'Manual',      color: '#6b7280', bg: '#f3f4f6'   },
};

const getSourceCfg = (src) => SOURCE_CFG[src] ?? { label: src || 'Unknown', color: '#6b7280', bg: '#f3f4f6' };

const STATUS_COLOR = {
  'New': 'default', 'Assigned': 'blue', 'Contacted': 'cyan',
  'Qualified': 'purple', 'Collecting Documents': 'orange',
  'Application Opened': 'volcano', 'Bank Application': 'geekblue',
  'Pre-Approved': 'lime', 'Valuation': 'gold', 'FOL Signed': 'green',
  'Disbursed': 'success', 'Lost': 'error', 'Not Proceeding': 'default',
};

const StatCard = ({ icon, label, value, color, bg }) => (
  <div style={{
    background: '#fff', borderRadius: 16, border: '1px solid #EDE9F6',
    padding: '20px 22px', flex: 1,
    display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 2px 8px rgba(92,3,155,0.05)',
  }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {React.cloneElement(icon, { style: { fontSize: 20, color } })}
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{value ?? 0}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  </div>
);

const VaultCustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [stats, setStats]           = useState({ total: 0, vaultOrigin: 0, crossPlatform: 0, disbursed: 0 });
  const [search, setSearch]         = useState('');

  const fetchCustomers = useCallback(async (page = 1, q = search, limit = pagination.limit) => {
    setLoading(true);
    try {
      const res = await apiService.get('/vault/customers', { params: { page, limit, search: q } });
      if (res?.success) {
        const data = res.data ?? [];
        setCustomers(data);
        setPagination(res.pagination ?? { page, limit, total: 0, pages: 1 });
        setStats({
          total:         res.pagination?.total ?? data.length,
          vaultOrigin:   data.filter(c => c.customer?.source === 'vault').length,
          crossPlatform: data.filter(c => c.customer?.source !== 'vault').length,
          disbursed:     data.filter(c => c.hasDisbursed).length,
        });
      }
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [search, pagination.limit]);

  useEffect(() => { fetchCustomers(1, ''); }, []);

  const handleFilter = ({ search: q = '' } = {}) => {
    setSearch(q);
    fetchCustomers(1, q);
  };

  const handlePageChange = (page, size) => {
    fetchCustomers(page, search, size);
  };

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_, row) => {
        const c = row.customer ?? {};
        const name = [c.name?.first_name, c.name?.last_name].filter(Boolean).join(' ') || '—';
        return (
          <Space size={10}>
            <Avatar size={38} icon={<UserOutlined />}
              src={c.profilePic || undefined}
              style={{ background: 'linear-gradient(135deg, #5C039B, #7c3aed)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937' }}>{name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.email || '—'}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Platform',
      key: 'platform',
      render: (_, row) => {
        const src = row.customer?.source ?? 'manual';
        const cfg = getSourceCfg(src);
        const isVault = src === 'vault';
        return (
          <Space direction="vertical" size={3}>
            <Tag style={{ background: PL, border: 'none', color: P, fontWeight: 700, fontSize: 10, borderRadius: 6, padding: '1px 8px' }}>
              VAULT LINKED
            </Tag>
            <Tag style={{ background: cfg.bg, border: 'none', color: cfg.color, fontWeight: 600, fontSize: 10, borderRadius: 6, padding: '1px 8px' }}>
              {isVault ? 'VAULT ORIGIN' : `FROM ${cfg.label.toUpperCase()}`}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, row) => {
        const c = row.customer ?? {};
        return (
          <div style={{ fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: '#374151' }}>
              {c.mobile?.country_code} {c.mobile?.number || '—'}
            </div>
            <div style={{ color: '#94a3b8', marginTop: 2 }}>
              {c.nationality || c.residencyStatus || '—'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Total Leads',
      key: 'totalLeads',
      render: (_, row) => (
        <div>
          <span style={{ fontWeight: 800, fontSize: 16, color: P }}>{row.totalLeads ?? 0}</span>
          <div style={{ marginTop: 3 }}>
            <Tag color={STATUS_COLOR[row.latestStatus] || 'default'} style={{ fontSize: 10 }}>
              {row.latestStatus || 'New'}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Active Leads',
      key: 'activeLeads',
      render: (_, row) => (
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontWeight: 800, fontSize: 15,
            color: (row.activeLeads ?? 0) > 0 ? '#7c3aed' : '#94a3b8',
          }}>
            {row.activeLeads ?? 0}
          </span>
        </div>
      ),
    },
    {
      title: 'Active Cases',
      key: 'activeCases',
      render: (_, row) => (
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontWeight: 800, fontSize: 15,
            color: (row.activeCases ?? 0) > 0 ? '#0891b2' : '#94a3b8',
          }}>
            {row.activeCases ?? 0}
          </span>
        </div>
      ),
    },
    {
      title: 'Disbursed',
      key: 'hasDisbursed',
      align: 'center',
      render: (_, row) => row.hasDisbursed
        ? <CheckCircleOutlined style={{ fontSize: 18, color: GN }} />
        : <span style={{ color: '#e5e7eb', fontSize: 18 }}>—</span>,
    },
    {
      title: 'Member Since',
      key: 'createdAt',
      render: (_, row) => (
        <span style={{ fontSize: 11, color: '#94a3b8' }}>
          {row.customer?.createdAt ? dayjs(row.customer.createdAt).format('DD MMM YYYY') : '—'}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, row) => (
        <Tooltip title="View Customer Profile">
          <Button type="primary" ghost size="small" icon={<EyeOutlined />}
            style={{ borderColor: P, color: P, borderRadius: 8 }}
            onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/vault-admin/customers/${row._id}`); }} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #5C039B, #03A4F4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1f2937', margin: 0 }}>Customer Management</h1>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Vault-linked customer profiles across all platforms</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard icon={<UserOutlined />}                   label="Total Vault Customers" value={pagination.total}     color={P}        bg={PL}        />
        <StatCard icon={<SafetyCertificateOutlined />}      label="Vault Origin"          value={stats.vaultOrigin}   color="#5C039B"  bg="#f3e8ff"   />
        <StatCard icon={<GlobalOutlined />}                 label="Cross-Platform"        value={stats.crossPlatform} color="#0891b2"  bg="#ecfeff"   />
        <StatCard icon={<CheckCircleOutlined />}            label="Disbursed"             value={stats.disbursed}     color={GN}       bg="#d1fae5"   />
      </div>

      {/* Table */}
      <CustomTable
        columns={columns}
        data={customers.map(c => ({ ...c, key: c._id }))}
        loading={loading}
        totalItems={pagination.total}
        currentPage={pagination.page}
        itemsPerPage={pagination.limit}
        onPageChange={handlePageChange}
        onFilter={handleFilter}
        showSearch
      />
    </div>
  );
};

export default VaultCustomerList;
