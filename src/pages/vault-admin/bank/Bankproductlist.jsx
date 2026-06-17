// src/pages/vault-admin/bank/Bankproductlist.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from "@/api/apiService";
import {
  Button, Card, Space, Tag, Popconfirm, Modal, Spin, Form,
  message, Typography, Avatar, Grid, Row, Col, Tooltip, Select, Input
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, 
  BankOutlined, EditOutlined,
  CheckCircleOutlined, EyeOutlined,
  ArrowLeftOutlined, StarOutlined,
  FireOutlined, SyncOutlined,
  UnlockOutlined, DollarOutlined,
  ClearOutlined, GlobalOutlined
} from '@ant-design/icons';
import CustomTable from "../../../components/common/CustomTable";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Option } = Select;

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
  const [banksList, setBanksList] = useState([]);

  // EIBOR State
  const [eiborVisible, setEiborVisible] = useState(false);
  const [eiborLoading, setEiborLoading] = useState(false);
  const [eiborData, setEiborData] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    bank: bankId || '',
    employmentStatus: '',
    residencyStatus: '',
    mortgageType: '',
    transactionType: '',
    rateType: '',
    ltv: '',
    salaryTransfer: '',
    status: ''
  });

  // Summary stats state
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    featured: 0,
    popular: 0
  });
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Load banks for filter dropdown
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await apiService.get('bank');
        setBanksList(res?.data || res || []);
      } catch (err) {
        console.error('Error fetching banks list:', err);
      }
    };
    fetchBanks();
  }, []);

  // Fetch products with pagination and filters
  const fetchProducts = useCallback(async (page, limit, currentFilters) => {
    setLoading(true);
    try {
      let endpoint = 'bank/products';
      let params = { 
        page, 
        limit,
        search: currentFilters.search || undefined,
        bank: currentFilters.bank || undefined,
        employmentStatus: currentFilters.employmentStatus || undefined,
        residencyStatus: currentFilters.residencyStatus || undefined,
        mortgageType: currentFilters.mortgageType || undefined,
        transactionType: currentFilters.transactionType || undefined,
        rateType: currentFilters.rateType || undefined,
        ltv: currentFilters.ltv || undefined,
        salaryTransfer: currentFilters.salaryTransfer || undefined,
        status: currentFilters.status || undefined
      };

      // If bankId exists (and not overridden in filter), force it
      if (bankId && !currentFilters.bank) {
        params.bank = bankId;
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      bank: bankId || '',
      employmentStatus: '',
      residencyStatus: '',
      mortgageType: '',
      transactionType: '',
      rateType: '',
      ltv: '',
      salaryTransfer: '',
      status: ''
    });
    setCurrentPage(1);
  };

  // EIBOR Rates Fetcher
  const fetchEiborRates = async (forceSync = false) => {
    setEiborLoading(true);
    try {
      const endpoint = forceSync ? 'bank/eibor-rates?forceScrape=true' : 'bank/eibor-rates';
      const res = await apiService.get(endpoint);
      if (res?.success && res.data) {
        setEiborData(res.data);
        if (forceSync) {
          message.success('EIBOR rates crawled fresh from CBUAE');
        }
      } else {
        message.error('Could not fetch EIBOR rates');
      }
    } catch (err) {
      console.error('EIBOR Rates error:', err);
      message.error(err.response?.data?.message || 'Error fetching EIBOR rates');
    } finally {
      setEiborLoading(false);
    }
  };

  const handleShowEibor = () => {
    setEiborVisible(true);
    fetchEiborRates(false);
  };

  const columns = [
    {
      title: "ID",
      key: "productId",
      width: 80,
      render: (_, r) => <Text strong style={{ color: P }}>{r.productId || "—"}</Text>
    },
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
      render: (rate) => <span style={{ fontWeight: 800, color: P }}>{rate}</span>
    },
    {
      title: "LTV",
      key: "ltv",
      render: (ltv) => {
        if (ltv && typeof ltv === 'object') {
          return <span style={{ fontWeight: 700, color: "#334155" }}>{ltv.max}%</span>;
        }
        const str = String(ltv || '');
        const displayVal = str ? (str.endsWith('%') ? str : `${str}%`) : '—';
        return <span style={{ fontWeight: 700, color: "#334155" }}>{displayVal}</span>;
      }
    },
    {
      title: "Proposals Generated",
      key: "proposalsGeneratedCount",
      render: (count) => <span style={{ fontWeight: 600, color: PM }}>{count || 0}</span>
    },
    {
      title: "Status",
      key: "status",
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
          {onEdit && (
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
          )}
          {onEdit && (
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
          )}
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
        styles={{ body: { padding: 24 } }}
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
          
          <Space size={12}>
            <Button
              type="default"
              icon={<GlobalOutlined />}
              onClick={handleShowEibor}
              style={{
                height: 44,
                borderRadius: 12,
                fontWeight: 700,
                borderColor: PM,
                color: PM
              }}
            >
              View EIBOR Rates
            </Button>
            {onCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => onCreate(bankId)}
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
                Add Product
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* KPI Stats Cards - Visible when viewing bank specific products */}
      {bankId && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={12} md={6}>
            <Card 
              style={{ borderRadius: 16, border: '1px solid #ede9f6', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}
              styles={{ body: { padding: '20px 24px' } }}
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
              styles={{ body: { padding: '20px 24px' } }}
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
              styles={{ body: { padding: '20px 24px' } }}
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
              styles={{ body: { padding: '20px 24px' } }}
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

      {/* PRD Filter panel Card */}
      <Card
        style={{
          borderRadius: 16,
          border: '1px solid #ede9f6',
          boxShadow: '0 2px 12px rgba(92,3,155,0.03)',
          marginBottom: 20,
          background: '#ffffff'
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6} lg={4}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Search Name/Key</Text>
            <Input 
              placeholder="Search..." 
              value={filters.search} 
              onChange={e => handleFilterChange('search', e.target.value)} 
              size="middle"
              style={{ marginTop: 4, borderRadius: 6 }}
            />
          </Col>

          {!bankId && (
            <Col xs={24} sm={12} md={6} lg={4}>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Bank</Text>
              <Select
                showSearch
                placeholder="All Banks"
                optionFilterProp="label"
                value={filters.bank}
                onChange={v => handleFilterChange('bank', v)}
                size="middle"
                style={{ width: '100%', marginTop: 4 }}
              >
                <Option value="">All Banks</Option>
                {banksList.map(b => (
                  <Option key={b._id} value={b._id} label={b.bankName}>{b.bankName}</Option>
                ))}
              </Select>
            </Col>
          )}

          <Col xs={24} sm={12} md={6} lg={4}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Employment Status</Text>
            <Select
              placeholder="All"
              value={filters.employmentStatus}
              onChange={v => handleFilterChange('employmentStatus', v)}
              size="middle"
              style={{ width: '100%', marginTop: 4 }}
            >
              <Option value="">All</Option>
              <Option value="Salaried">Salaried</Option>
              <Option value="Self-Employed">Self-Employed</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Residency Status</Text>
            <Select
              placeholder="All"
              value={filters.residencyStatus}
              onChange={v => handleFilterChange('residencyStatus', v)}
              size="middle"
              style={{ width: '100%', marginTop: 4 }}
            >
              <Option value="">All</Option>
              <Option value="UAE National">UAE National</Option>
              <Option value="UAE Resident">UAE Resident</Option>
              <Option value="Non-Resident">Non-Resident</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Mortgage Type</Text>
            <Select
              placeholder="All"
              value={filters.mortgageType}
              onChange={v => handleFilterChange('mortgageType', v)}
              size="middle"
              style={{ width: '100%', marginTop: 4 }}
            >
              <Option value="">All</Option>
              <Option value="Islamic">Islamic</Option>
              <Option value="Conventional">Conventional</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Transaction Type</Text>
            <Select
              placeholder="All"
              value={filters.transactionType}
              onChange={v => handleFilterChange('transactionType', v)}
              size="middle"
              style={{ width: '100%', marginTop: 4 }}
            >
              <Option value="">All</Option>
              <Option value="Primary - Residential">Primary - Residential</Option>
              <Option value="Primary - Commercial">Primary - Commercial</Option>
              <Option value="Buyout">Buyout</Option>
              <Option value="Equity">Equity</Option>
              <Option value="Buyout + Equity">Buyout + Equity</Option>
              <Option value="Offplan">Offplan</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Rate Type</Text>
            <Select
              placeholder="All"
              value={filters.rateType}
              onChange={v => handleFilterChange('rateType', v)}
              size="middle"
              style={{ width: '100%', marginTop: 4 }}
            >
              <Option value="">All</Option>
              <Option value="Fixed">Fixed</Option>
              <Option value="Variable">Variable</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={3}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>LTV (%)</Text>
            <Select
              placeholder="All"
              value={filters.ltv}
              onChange={v => handleFilterChange('ltv', v)}
              size="middle"
              style={{ width: '100%', marginTop: 4 }}
            >
              <Option value="">All</Option>
              <Option value="60">60%</Option>
              <Option value="65">65%</Option>
              <Option value="70">70%</Option>
              <Option value="75">75%</Option>
              <Option value="80">80%</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={3}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Salary Transfer</Text>
            <Select
              placeholder="All"
              value={filters.salaryTransfer}
              onChange={v => handleFilterChange('salaryTransfer', v)}
              size="middle"
              style={{ width: '100%', marginTop: 4 }}
            >
              <Option value="">All</Option>
              <Option value="STL">STL</Option>
              <Option value="NSTL">NSTL</Option>
              <Option value="Both">Both</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={3}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Active Status</Text>
            <Select
              placeholder="All"
              value={filters.status}
              onChange={v => handleFilterChange('status', v)}
              size="middle"
              style={{ width: '100%', marginTop: 4 }}
            >
              <Option value="">All</Option>
              <Option value="Active">Active Only</Option>
              <Option value="Inactive">Inactive Only</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={3} style={{ alignSelf: 'flex-end', marginTop: 14 }}>
            <Button 
              icon={<ClearOutlined />} 
              onClick={resetFilters} 
              style={{ width: '100%', borderRadius: 6, borderColor: '#d9d9d9', color: '#555' }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table Card wrapper */}
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
          showSearch={false} // Disabled built-in table search since we have full search block above
        />
      </Card>

      {/* EIBOR Rates Modal Pop-up */}
      <Modal
        title={
          <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
            <Space>
              <GlobalOutlined style={{ color: PM }} />
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: P }}>CBUAE Live EIBOR Rates</Title>
            </Space>
          </div>
        }
        open={eiborVisible}
        onCancel={() => setEiborVisible(false)}
        footer={[
          <Button key="close" onClick={() => setEiborVisible(false)} style={{ borderRadius: 8 }}>Close</Button>,
          <Button 
            key="sync" 
            type="primary" 
            icon={<SyncOutlined />} 
            loading={eiborLoading} 
            onClick={() => fetchEiborRates(true)}
            style={{ background: P, borderColor: P, borderRadius: 8 }}
          >
            Force Sync
          </Button>
        ]}
        width={500}
        styles={{ body: { padding: '20px 24px' } }}
        centered
      >
        <Spin spinning={eiborLoading} tip="Loading live rates...">
          {eiborData ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 18, background: PL, padding: '10px 14px', borderRadius: 10, border: `1px solid ${PB}` }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Last updated from centralbank.ae:</Text>
                <div style={{ fontSize: 16, fontWeight: 800, color: P, marginTop: 2 }}>{eiborData.lastUpdatedDate}</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Overnight', value: eiborData.overnight },
                  { label: '1 Week', value: eiborData.oneWeek },
                  { label: '1 Month', value: eiborData.oneMonth },
                  { label: '3 Months', value: eiborData.threeMonths },
                  { label: '6 Months', value: eiborData.sixMonths },
                  { label: '1 Year', value: eiborData.oneYear }
                ].map((tenor, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
                    <Text strong style={{ color: '#475569' }}>{tenor.label}</Text>
                    <Text strong style={{ fontSize: 15, color: '#0284c7' }}>{tenor.value.toFixed(6)} %</Text>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', py: 20 }}>No EIBOR rates available. Click Force Sync to scrape.</div>
          )}
        </Spin>
      </Modal>

    </div>
  );
};

export default BankProductList;
