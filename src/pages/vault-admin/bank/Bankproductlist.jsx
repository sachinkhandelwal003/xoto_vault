// src/pages/vault-admin/bank/Bankproductlist.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from "@/api/apiService";
import {
  Button, Card, Space, Tag, Popconfirm,
  message, Typography, Avatar, Grid, Row, Col, Tooltip
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, 
  BankOutlined, EditOutlined,
  CheckCircleOutlined, EyeOutlined,
  ArrowLeftOutlined, StarOutlined,
  FireOutlined, InfoCircleOutlined,
  UnlockOutlined, DollarOutlined
} from '@ant-design/icons';
import CustomTable from "../../../components/common/CustomTable";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const P  = "#5C039B";
const PM = "#7C3AED";
const PL = "#F5F0FF";
const PB = "#E9D5FF";

const BankProductList = ({ onCreate, onEdit, onView }) => {
  const screens = useBreakpoint();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get bankId from URL query params if coming from bank list
  const queryParams = new URLSearchParams(location.search);
  const bankId = queryParams.get('bank');

  const [products, setProducts] = useState([]);
  const [bankInfo, setBankInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    mortgageType: ''
  });

  // Summary stats state
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    featured: 0,
    popular: 0
  });
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch products with pagination and filters
  const fetchProducts = useCallback(async (page, limit, currentFilters) => {
    setLoading(true);
    try {
      let endpoint = 'bank/products';
      let params = { 
        page, 
        limit,
        search: currentFilters.search || undefined,
        status: currentFilters.status || undefined,
        mortgageType: currentFilters.mortgageType || undefined
      };

      // If bankId exists, use the bank-specific products endpoint
      if (bankId) {
        endpoint = `bank/admin/${bankId}/products`;
      }

      const res = await apiService.get(endpoint, params);
      
      if (res?.success) {
        setProducts(res.data || []);
        setTotal(res.total || res.pagination?.totalItems || 0);
        
        // If bank info is returned
        if (res.bank) {
          setBankInfo(res.bank);
        }
      }
    } catch (err) {
      console.error('Products fetch error:', err);
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [bankId]);

  // Fetch bank product summary counts
  const fetchSummary = useCallback(async () => {
    if (!bankId) return;
    setSummaryLoading(true);
    try {
      const res = await apiService.get(`bank/banks/${bankId}/products/summary`);
      if (res?.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Summary fetch error:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [bankId]);

  useEffect(() => {
    fetchProducts(currentPage, pageSize, filters);
  }, [currentPage, pageSize, filters, fetchProducts]);

  useEffect(() => {
    if (bankId) {
      fetchSummary();
    }
  }, [bankId, fetchSummary]);

  const handleDelete = async (id) => {
    try {
      await apiService.delete(`bank/products/${id}`);
      message.success('Product deleted successfully');
      fetchProducts(currentPage, pageSize, filters);
      if (bankId) {
        fetchSummary();
      }
    } catch (err) {
      message.error('Failed to delete product');
    }
  };

  const handleFilter = (newFilters) => {
    setFilters({
      search: newFilters.search || '',
      status: newFilters.status || '',
      mortgageType: newFilters.mortgageType || ''
    });
    setCurrentPage(1);
  };

  const columns = [
    {
      title: "Bank",
      key: "bank",
      render: (_, r) => {
        const logo = r.bank?.logo || bankInfo?.logo;
        const name = r.bank?.bankName || bankInfo?.bankName || "Unknown Bank";
        return (
          <Space size={10}>
            <Avatar 
              src={logo} 
              shape="square" 
              size={32} 
              icon={<BankOutlined />} 
              style={{ borderRadius: 6, background: "#f3f4f6", border: '1px solid #e5e7eb' }} 
            />
            <Text strong style={{ color: "#334155" }}>{name}</Text>
          </Space>
        );
      }
    },
    {
      title: "Product Name",
      key: "productName",
      sortable: true,
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 700, color: "#1e293b" }}>{name}</div>
          <Space size={4} style={{ marginTop: 4 }}>
            {r.isFeatured && <Tag color="gold" style={{ borderRadius: 4, fontSize: 10, fontWeight: 600 }}>Featured</Tag>}
            {r.isPopular && <Tag color="orange" style={{ borderRadius: 4, fontSize: 10, fontWeight: 600 }}>Popular</Tag>}
          </Space>
        </div>
      )
    },
    {
      title: "Mortgage Type",
      key: "mortgageType",
      filterable: true,
      filterOptions: [
        { label: "Islamic", value: "Islamic" },
        { label: "Conventional", value: "Conventional" }
      ],
      render: (t) => (
        <Tag color={t === "Islamic" ? "green" : "blue"} style={{ borderRadius: 6, fontWeight: 700 }}>
          {t?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: "Rate Type",
      key: "rateType",
      render: (t) => (
        <Tag color={t === "Fixed" ? "purple" : "cyan"} style={{ borderRadius: 6, fontWeight: 700 }}>
          {t?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: "Interest Rate",
      key: "interestRate",
      sortable: true,
      render: (rate) => <span style={{ fontWeight: 800, color: P }}>{rate}</span>
    },
    {
      title: "Max LTV",
      key: "ltv",
      render: (ltv) => <span style={{ fontWeight: 700, color: "#334155" }}>{ltv?.max || 0}%</span>
    },
    {
      title: "Min Salary",
      key: "minSalary",
      sortable: true,
      render: (sal) => <span style={{ fontWeight: 600, color: "#475569" }}>{sal ? `AED ${Number(sal).toLocaleString()}` : "N/A"}</span>
    },
    {
      title: "Status",
      key: "status",
      filterable: true,
      filterOptions: [
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
        { label: "Archived", value: "Archived" },
        { label: "Expired", value: "Expired" }
      ],
      render: (status) => {
        let color = "default";
        if (status === "Active") color = "success";
        else if (status === "Inactive") color = "warning";
        else if (status === "Expired") color = "error";
        return (
          <Tag color={color} style={{ borderRadius: 6, fontWeight: 800 }}>
            {String(status || "Inactive").toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Space size={8}>
          <Tooltip title="View Details">
            <Button
              size="small"
              type="primary"
              ghost
              icon={<EyeOutlined />}
              onClick={() => onView && onView(r._id)}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>
          <Tooltip title="Edit Product">
            <Button
              size="small"
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => onEdit && onEdit(r._id)}
              style={{ borderRadius: 6, borderColor: PM, color: PM }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this product?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(r._id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
          >
            <Tooltip title="Delete">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: screens.md ? '28px' : '16px', background: '#F4F0FA', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Back to Banks Navigator */}
      {bankId && (
        <div style={{ marginBottom: 16 }}>
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/dashboard/vault-admin/bank/list')}
            style={{ padding: 0, color: PM, fontWeight: 600, display: 'flex', alignItems: 'center' }}
          >
            Back to Banks Directory
          </Button>
        </div>
      )}

      {/* Header Banner */}
      <Card 
        style={{ 
          borderRadius: 20, 
          border: '1px solid #ede9f6', 
          background: 'linear-gradient(135deg, #ffffff 0%, #FAF9FE 100%)',
          boxShadow: '0 4px 20px rgba(92, 3, 155, 0.03)',
          marginBottom: 24
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <Space align="start" size={16}>
            {bankInfo?.logo ? (
              <Avatar 
                src={bankInfo.logo} 
                shape="square" 
                size={64} 
                style={{ 
                  borderRadius: 12, 
                  border: '2px solid #fff', 
                  boxShadow: '0 4px 12px rgba(92,3,155,0.08)',
                  background: '#ffffff'
                }} 
              />
            ) : (
              <Avatar 
                shape="square" 
                size={64} 
                icon={<BankOutlined />} 
                style={{ 
                  borderRadius: 12, 
                  background: PL, 
                  color: P,
                  border: `1px solid ${PB}`
                }} 
              />
            )}
            <div>
              <Title level={2} style={{ margin: 0, color: P, fontWeight: 800, letterSpacing: '-0.5px' }}>
                {bankInfo ? `${bankInfo.bankName} Products` : 'Master Mortgage Products Library'}
              </Title>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4, display: 'inline-block' }}>
                {bankInfo 
                  ? `Configure, manage, and audit the ${total} products associated with ${bankInfo.bankName}`
                  : 'Manage interest rates, transaction criteria, LTV limits, and status of bank products across all institutions'
                }
              </Text>
            </div>
          </Space>
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => onCreate && onCreate(bankId)}
            style={{ 
              background: P, 
              borderColor: P, 
              height: 44, 
              borderRadius: 12, 
              fontWeight: 700,
              padding: '0 28px',
              boxShadow: '0 4px 14px rgba(92,3,155,0.2)'
            }}
          >
            Add New Product
          </Button>
        </div>
      </Card>

      {/* KPI Stats Cards - Visible when viewing bank specific products */}
      {bankId && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={12} md={6}>
            <Card 
              style={{ borderRadius: 16, border: '1px solid #ede9f6', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}
              bodyStyle={{ padding: '20px 24px' }}
              loading={summaryLoading}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Total Products</Text>
                  <Title level={3} style={{ margin: '4px 0 0', fontWeight: 800, color: '#1F2937' }}>{summary.total}</Title>
                </div>
                <Avatar size={40} style={{ backgroundColor: PL, color: P }} icon={<BankOutlined />} />
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card 
              style={{ borderRadius: 16, border: '1px solid #ede9f6', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}
              bodyStyle={{ padding: '20px 24px' }}
              loading={summaryLoading}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Active Products</Text>
                  <Title level={3} style={{ margin: '4px 0 0', fontWeight: 800, color: '#10B981' }}>{summary.active}</Title>
                </div>
                <Avatar size={40} style={{ backgroundColor: '#ECFDF5', color: '#10B981' }} icon={<CheckCircleOutlined />} />
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card 
              style={{ borderRadius: 16, border: '1px solid #ede9f6', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}
              bodyStyle={{ padding: '20px 24px' }}
              loading={summaryLoading}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Featured</Text>
                  <Title level={3} style={{ margin: '4px 0 0', fontWeight: 800, color: '#F59E0B' }}>{summary.featured}</Title>
                </div>
                <Avatar size={40} style={{ backgroundColor: '#FEF3C7', color: '#F59E0B' }} icon={<StarOutlined />} />
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card 
              style={{ borderRadius: 16, border: '1px solid #ede9f6', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}
              bodyStyle={{ padding: '20px 24px' }}
              loading={summaryLoading}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Popular</Text>
                  <Title level={3} style={{ margin: '4px 0 0', fontWeight: 800, color: '#EF4444' }}>{summary.popular}</Title>
                </div>
                <Avatar size={40} style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }} icon={<FireOutlined />} />
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* CustomTable Card wrapper */}
      <Card 
        style={{ 
          borderRadius: 20, 
          border: '1px solid #ede9f6', 
          boxShadow: '0 4px 25px rgba(92, 3, 155, 0.02)', 
          padding: 8,
          background: '#ffffff'
        }}
      >
        <CustomTable
          columns={columns}
          data={products}
          loading={loading}
          totalItems={total}
          currentPage={currentPage}
          itemsPerPage={pageSize}
          onPageChange={(page, size) => {
            setCurrentPage(page);
            if (size) setPageSize(size);
          }}
          onFilter={handleFilter}
          showSearch={true}
        />
      </Card>
    </div>
  );
};

export default BankProductList;
