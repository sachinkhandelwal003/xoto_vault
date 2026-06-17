import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row, Col, Tag, Button, Avatar, Space, Spin, Table, Descriptions, Divider
} from 'antd';
import {
  UserOutlined, ArrowLeftOutlined, CheckCircleOutlined,
  FileOutlined, GlobalOutlined, SafetyCertificateOutlined,
  PhoneOutlined, MailOutlined, CalendarOutlined
} from '@ant-design/icons';
import { apiService } from '@/api/apiService';
import dayjs from 'dayjs';

const P  = '#5C039B';
const GN = '#10B981';
const PL = '#f3e8ff';

const SOURCE_CFG = {
  vault:           { label: 'Vault Origin',  color: '#5C039B', bg: '#f3e8ff' },
  ecommerce:       { label: 'E-Commerce',    color: '#0891b2', bg: '#ecfeff' },
  website:         { label: 'Website',       color: '#2563eb', bg: '#eff6ff' },
  agent:           { label: 'Agent',         color: '#d97706', bg: '#fffbeb' },
  lead_generation: { label: 'Lead Gen',      color: '#7c3aed', bg: '#f5f3ff' },
  manual:          { label: 'Manual',        color: '#6b7280', bg: '#f3f4f6' },
};

const STATUS_COLOR = {
  'New': 'default', 'Assigned': 'blue', 'Contacted': 'cyan', 'Qualified': 'purple',
  'Collecting Documents': 'orange', 'Bank Application': 'geekblue',
  'Pre-Approved': 'lime', 'Valuation': 'gold', 'FOL Signed': 'green',
  'Disbursed': 'success', 'Lost': 'error', 'Not Proceeding': 'default',
};

const SectionCard = ({ title, extra, children, borderColor = '#EDE9F6' }) => (
  <div style={{
    background: '#fff', borderRadius: 20, border: `1px solid ${borderColor}`,
    padding: '24px 28px', boxShadow: '0 2px 12px rgba(92,3,155,0.04)', marginBottom: 24,
  }}>
    {title && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontWeight: 800, color: '#1f2937', fontSize: 15 }}>{title}</div>
        {extra}
      </div>
    )}
    {children}
  </div>
);

const StatPill = ({ icon, label, value, color, bg }) => (
  <div style={{
    background: '#fff', borderRadius: 16, border: '1px solid #EDE9F6',
    padding: '16px 20px', flex: 1, minWidth: 110,
    display: 'flex', alignItems: 'center', gap: 12,
  }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {React.cloneElement(icon, { style: { fontSize: 16, color } })}
    </div>
    <div>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{value ?? 0}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  </div>
);

const VaultCustomerProfile = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.get(`/vault/customers/${customerId}`)
      .then(res => { if (res?.success) setData(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Spin size="large" />
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Customer not found.</div>
  );

  const { customer, vaultLeads, vaultCases, stats } = data;
  const name = [customer?.name?.first_name, customer?.name?.last_name].filter(Boolean).join(' ') || '—';
  const srcCfg = SOURCE_CFG[customer?.source] ?? SOURCE_CFG.manual;
  const isVaultOrigin = customer?.source === 'vault';

  const leadColumns = [
    {
      title: 'Status',
      dataIndex: 'currentStatus',
      render: s => <Tag color={STATUS_COLOR[s] || 'default'} style={{ fontSize: 11 }}>{s || '—'}</Tag>,
    },
    {
      title: 'Property',
      key: 'property',
      render: (_, r) => {
        const tx = r.propertyDetails?.transactionType;
        const val = r.propertyDetails?.approxPropertyValue;
        return <span style={{ fontSize: 12 }}>{[tx, val].filter(Boolean).join(' · ') || '—'}</span>;
      },
    },
    {
      title: 'Advisor',
      dataIndex: ['assignedTo', 'advisorName'],
      render: n => <span style={{ fontSize: 12, color: '#475569' }}>{n || 'Unassigned'}</span>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: d => <span style={{ fontSize: 11, color: '#94a3b8' }}>{dayjs(d).format('DD MMM YYYY')}</span>,
    },
  ];

  const caseColumns = [
    {
      title: 'Reference',
      dataIndex: 'caseReference',
      render: r => <code style={{ color: P, fontWeight: 700 }}>{r || '—'}</code>,
    },
    {
      title: 'Status',
      dataIndex: 'currentStatus',
      render: s => <Tag color={STATUS_COLOR[s] || 'default'} style={{ fontSize: 11 }}>{s || '—'}</Tag>,
    },
    {
      title: 'Loan Amount',
      dataIndex: ['propertyInfo', 'loanAmount'],
      render: v => <span style={{ fontWeight: 700, color: P }}>{v ? `AED ${Number(v).toLocaleString()}` : '—'}</span>,
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      render: d => <span style={{ fontSize: 11, color: '#94a3b8' }}>{dayjs(d).format('DD MMM YYYY')}</span>,
    },
  ];

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Back */}
      <Button type="text" icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/dashboard/vault-admin/customers')}
        style={{ marginBottom: 16, color: P, fontWeight: 600 }}>
        Customer Management
      </Button>

      {/* Hero card */}
      <SectionCard>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Avatar size={72} icon={<UserOutlined />}
            src={customer?.profilePic || undefined}
            style={{ background: 'linear-gradient(135deg, #5C039B, #03A4F4)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1f2937', margin: 0 }}>{name}</h1>
              {/* Vault flag */}
              <Tag style={{ background: PL, border: 'none', color: P, fontWeight: 700, fontSize: 11, borderRadius: 6 }}>
                VAULT CUSTOMER
              </Tag>
              {/* Origin platform */}
              <Tag style={{ background: srcCfg.bg, border: 'none', color: srcCfg.color, fontWeight: 700, fontSize: 11, borderRadius: 6 }}>
                {isVaultOrigin ? 'VAULT ORIGIN' : `CROSS-PLATFORM · ${srcCfg.label.toUpperCase()}`}
              </Tag>
              {stats?.disbursed > 0 && (
                <Tag color="success" style={{ fontWeight: 700, fontSize: 11, borderRadius: 6 }}>DISBURSED</Tag>
              )}
            </div>
            <Space split={<Divider type="vertical" />} wrap>
              {customer?.email && (
                <span style={{ fontSize: 12, color: '#475569' }}>
                  <MailOutlined style={{ marginRight: 5 }} />{customer.email}
                </span>
              )}
              {customer?.mobile?.number && (
                <span style={{ fontSize: 12, color: '#475569' }}>
                  <PhoneOutlined style={{ marginRight: 5 }} />
                  {customer.mobile.country_code} {customer.mobile.number}
                </span>
              )}
              {customer?.createdAt && (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  <CalendarOutlined style={{ marginRight: 5 }} />
                  Member since {dayjs(customer.createdAt).format('DD MMM YYYY')}
                </span>
              )}
            </Space>
          </div>
        </div>
      </SectionCard>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatPill icon={<FileOutlined />}         label="Total Leads"  value={stats?.totalLeads}  color={P}  bg={PL} />
        <StatPill icon={<SafetyCertificateOutlined />} label="Qualified" value={stats?.qualified}  color="#7c3aed" bg="#f5f3ff" />
        <StatPill icon={<CheckCircleOutlined />}  label="Disbursed"    value={stats?.disbursed}   color={GN} bg="#d1fae5" />
        <StatPill icon={<GlobalOutlined />}       label="Active Applications" value={stats?.activeCases} color="#0891b2" bg="#ecfeff" />
      </div>

      {/* Customer Details */}
      <SectionCard title="Customer Details">
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small" labelStyle={{ fontWeight: 700, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }}>
          <Descriptions.Item label="Nationality">{customer?.nationality || '—'}</Descriptions.Item>
          <Descriptions.Item label="Residency">{customer?.residencyStatus || '—'}</Descriptions.Item>
          <Descriptions.Item label="Gender">{customer?.gender || '—'}</Descriptions.Item>
          <Descriptions.Item label="Origin Platform">
            <Tag style={{ background: srcCfg.bg, border: 'none', color: srcCfg.color, fontWeight: 600 }}>{srcCfg.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Active">{customer?.isActive ? 'Yes' : 'No'}</Descriptions.Item>
          <Descriptions.Item label="Premium">{customer?.isPremium ? 'Yes' : 'No'}</Descriptions.Item>
        </Descriptions>
      </SectionCard>

      {/* Vault Leads */}
      <SectionCard title={`Vault Leads (${vaultLeads?.length ?? 0})`} borderColor="#EDE9F6">
        {vaultLeads?.length === 0
          ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>No vault leads yet.</div>
          : <Table
              columns={leadColumns}
              dataSource={(vaultLeads ?? []).map((l, i) => ({ ...l, key: l._id || i }))}
              pagination={false}
              size="small"
            />
        }
      </SectionCard>

      {/* Vault Applications */}
      {(vaultCases?.length ?? 0) > 0 && (
        <SectionCard title={`Vault Applications (${vaultCases.length})`} borderColor="#d1fae5">
          <Table
            columns={caseColumns}
            dataSource={vaultCases.map((c, i) => ({ ...c, key: c._id || i }))}
            pagination={false}
            size="small"
          />
        </SectionCard>
      )}
    </div>
  );
};

export default VaultCustomerProfile;
