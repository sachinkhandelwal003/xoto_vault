import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/api/apiService';
import {
  Avatar,
  Badge,
  Button,
  Popconfirm,
  Space,
  Tag,
  Typography,
  message,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  BankOutlined,
  AppstoreOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import CustomTable from '@/components/common/CustomTable';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  Active: 'green',
  Inactive: 'default',
  Archived: 'blue',
  Pending: 'orange',
  Deleted: 'red',
};

const BankList = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: '', status: '' });

  const fetchBanks = useCallback(async (pageNumber = 1, limit = 10, currentFilters = {}) => {
    setLoading(true);
    try {
      const res = await apiService.get('bank', {
        page: pageNumber,
        limit,
        search: currentFilters.search || undefined,
        status: currentFilters.status || undefined,
      });

      let list = [];
      let totalRows = 0;

      if (res?.success) {
        list = Array.isArray(res.data) ? res.data : [];
        totalRows = res.total || res.pagination?.totalItems || list.length;
      } else if (Array.isArray(res)) {
        list = res;
        totalRows = res.length;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
        totalRows = res.total || res.pagination?.totalItems || list.length;
      } else if (Array.isArray(res?.data?.data)) {
        list = res.data.data;
        totalRows = res.data.total || res.data.pagination?.totalItems || list.length;
      }
      setBanks(list);
      setTotal(totalRows);
    } catch (err) {
      console.error('Fetch banks error:', err);
      message.error('Unable to load banks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanks(page, pageSize, filters);
  }, [fetchBanks, page, pageSize, filters]);

  const handleDeleteRecord = async (id) => {
    try {
      await apiService.delete(`bank/${id}`);
      message.success('Bank deleted successfully');
      fetchBanks(page, pageSize, filters);
    } catch (err) {
      console.error('Delete bank error:', err);
      message.error('Failed to delete bank');
    }
  };

  const handlePageChange = (newPage, newPageSize) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

 const columns = [
  {
    title: 'Bank',
    key: 'bankName',
    render: (value, record) => (
      <Space>
        <Avatar
          shape="square"
          size={48}
          src={record.logo}
          icon={<BankOutlined />}
          style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}
        />
        <div>
          <div style={{ fontWeight: 600, color: '#1f2937' }}>
            {record.bankName || '—'}
          </div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>
            {record.bankCode || '—'}
          </div>
        </div>
      </Space>
    ),
  },

  {
    title: 'Contact',
    key: 'contactEmail',
    render: (value, record) => (
      <div>
        <div style={{ color: '#374151' }}>
          {record.contactEmail || '—'}
        </div>
        <div style={{ color: '#6b7280', fontSize: 12 }}>
          {record.contactPhone || '—'}
        </div>
      </div>
    ),
  },

  {
    title: 'Quick Links',
    key: 'products',
    render: (value, record) => (
      <Space size={4}>
        <Tooltip title="View Products">
          <Button
            type="link"
            icon={<AppstoreOutlined />}
            onClick={() => navigate(`/dashboard/vault-admin/bank/products?bank=${record._id}`)}
            style={{ padding: '0 4px' }}
          >
            Products
          </Button>
        </Tooltip>
        <Tooltip title="View Bank Documents">
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/dashboard/vault-admin/documents/bank/${record._id}`)}
            style={{ padding: '0 4px', color: '#03A4F4' }}
          >
            Documents
          </Button>
        </Tooltip>
      </Space>
    ),
  },

  {
    title: 'Mortgage Types',
    key: 'mortgageTypesSupported',
    render: (value, record) => (
      <Space wrap size={[4, 4]}>
        {(record.mortgageTypesSupported || []).map((type) => (
          <Tag
            key={type}
            color="purple"
            style={{ borderRadius: 4, margin: 0 }}
          >
            {type}
          </Tag>
        ))}
      </Space>
    ),
  },

  {
    title: 'Status',
    key: 'status',
    render: (value, record) => (
      <Badge
        status={record.status === 'Active' ? 'success' : 'default'}
        text={
          <span
            style={{
              color:
                record.status === 'Active' ? '#059669' : '#6b7280',
              fontWeight: 500,
            }}
          >
            {record.status || 'Unknown'}
          </span>
        }
      />
    ),
  },

  {
    title: 'Actions',
    key: 'actions',
    render: (value, record) => (
      <Space>
        <Button
          type="text"
          icon={<EyeOutlined style={{ color: '#03A4F4' }} />}
          onClick={() =>
            navigate(`/dashboard/vault-admin/bank/view/${record._id}`)
          }
          style={{ background: '#eff6ff' }}
        />
        <Button
          type="text"
          icon={<EditOutlined style={{ color: '#5C039B' }} />}
          onClick={() =>
            navigate(`/dashboard/vault-admin/bank/manage/${record._id}`)
          }
          style={{ background: '#f5f3ff' }}
        />

        <Popconfirm
          title="Delete this bank?"
          description="Are you sure?"
          onConfirm={() => handleDeleteRecord(record._id)}
          okText="Yes"
          cancelText="Cancel"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            style={{ background: '#fff1f2' }}
          />
        </Popconfirm>
      </Space>
    ),
  },
];

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>Bank Library</Title>
          <Text type="secondary">Manage banks and their supported mortgage products.</Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/vault-admin/bank/manage')}
            style={{
              background: 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)',
              border: 'none',
              height: 40,
              padding: '0 20px',
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(92,3,155,0.2)',
            }}
          >
            Add New Bank
          </Button>
        </Col>
      </Row>

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <CustomTable
          columns={columns}
          data={banks}
          totalItems={total}
          currentPage={page}
          itemsPerPage={pageSize}
          onPageChange={handlePageChange}
          onFilter={handleFilter}
          loading={loading}
          showSearch={true}
        />
      </div>
    </div>
  );
};

export default BankList;
