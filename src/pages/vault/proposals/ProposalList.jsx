import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from '@/api/apiService';
import { Card, Button, Select, Tag, Space, Spin, message, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomTable from '@/components/common/CustomTable';

const { Title, Text } = Typography;

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Sent', value: 'Sent' },
  { label: 'Accepted', value: 'Accepted' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'Expired', value: 'Expired' },
];

const STATUS_TAGS = {
  Draft: 'default',
  Sent: 'processing',
  Accepted: 'success',
  Rejected: 'error',
  Expired: 'warning',
};

const ProposalList = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [statusFilter, setStatusFilter] = useState('');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const roleCode = useMemo(() => {
    if (!user?.role) return '26';
    return typeof user.role === 'object' ? String(user.role.code) : String(user.role);
  }, [user]);

  const basePath = useMemo(() => {
    if (roleCode === '21') return '/dashboard/vault-partner';
    if (roleCode === '18') return '/dashboard/vault-admin';
    return '/dashboard/vault-advisor';
  }, [roleCode]);

  const fetchData = async (currentPage = 1, status = '') => {
    setLoading(true);
    try {
      const response = await apiService.get('/vault/proposals', {
        page: currentPage,
        limit: 20,
        status: status || undefined,
      });
      const results = response?.data ?? response;
      const list = Array.isArray(results) ? results : response?.data ?? [];
      const paginationTotal = response?.pagination?.total ?? response?.total ?? Array.isArray(results) ? results.length : 0;

      setProposals(list);
      setTotal(paginationTotal);
      setPage(currentPage);
    } catch (error) {
      message.error('Unable to load proposals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, statusFilter);
  }, [statusFilter]);

  const columns = [
    {
      title: 'Proposal Ref',
      dataIndex: 'proposalReference',
      key: 'proposalReference',
      render: (value) => <Text strong>{value || '—'}</Text>,
      ellipsis: true,
    },
    {
      title: 'Customer Name',
      dataIndex: ['leadId', 'customerSnapshot', 'fullName'],
      key: 'customerName',
      render: (_, record) => {
        const fullName = record?.leadId?.customerSnapshot?.fullName
          || record?.leadId?.customerInfo?.fullName
          || record?.leadId?.customerInfo?.firstName
          || 'Unknown Customer';
        return <Text>{fullName}</Text>;
      },
      ellipsis: true,
    },
    {
      title: 'Banks',
      dataIndex: 'bankCount',
      key: 'bankCount',
      align: 'center',
      render: (value, record) => <Text>{value ?? record?.selectedBanks?.length ?? 0}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={STATUS_TAGS[status] || 'default'}>{status || 'Unknown'}</Tag>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => <Text type="secondary">{value ? dayjs(value).format('DD MMM YYYY') : '—'}</Text>,
      responsive: ['md'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`${basePath}/proposals/${record.id || record._id}`);
          }}
          style={{ borderRadius: 10, background: '#5C039B', borderColor: '#5C039B' }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f5ff', padding: 24 }}>
      <Card style={{ borderRadius: 20, border: '1px solid #ede9ff', marginBottom: 24 }} bodyStyle={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Title level={3} style={{ margin: 0, color: '#1e1b4b' }}>Proposals</Title>
            <Text type="secondary">All proposals created by you, with quick access to review, send, and manage status.</Text>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Select
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
              style={{ minWidth: 180, borderRadius: 10 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(`${basePath}/proposals/create`)}
              style={{ borderRadius: 10, background: '#5C039B', borderColor: '#5C039B' }}
            >
              Create New Proposal
            </Button>
          </div>
        </div>
      </Card>

      <Card style={{ borderRadius: 20, border: '1px solid #ede9ff' }} bodyStyle={{ padding: 18 }}>
        <CustomTable
          columns={[
            { key: 'proposalReference', title: 'Proposal Ref', sortable: true, render: (v) => <Text strong>{v || '—'}</Text> },
            { key: 'customer', title: 'Customer', sortable: true, render: (_v, row) => {
                const fullName = row?.leadId?.customerSnapshot?.fullName || row?.leadId?.customerInfo?.fullName || 'Unknown';
                return <div><div style={{ fontWeight: 700 }}>{fullName}</div><div style={{ color: '#64748b' }}>{row?.leadId?.customerFullPhone || row?.customerSnapshot?.mobile || '—'}</div></div>;
              }
            },
            { key: 'bankCount', title: 'Banks', render: (v, row) => <Text>{v ?? row?.selectedBanks?.length ?? 0}</Text> },
            { key: 'status', title: 'Status', render: (s) => <Tag color={STATUS_TAGS[s] || 'default'}>{s}</Tag> },
            { key: 'createdAt', title: 'Created Date', render: (v) => <Text type="secondary">{v ? dayjs(v).format('DD MMM YYYY') : '—'}</Text> },
            { key: 'actions', title: 'Actions', render: (_v, row) => (
                <Button
                  type="primary"
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`${basePath}/proposals/${row.id || row._id}`);
                  }}
                  style={{ borderRadius: 10, background: '#5C039B', borderColor: '#5C039B' }}
                >
                  View
                </Button>
              ) },
          ]}
          data={proposals}
          totalItems={total}
          currentPage={page}
          itemsPerPage={20}
          onPageChange={(p, size) => fetchData(p, statusFilter)}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default ProposalList;
