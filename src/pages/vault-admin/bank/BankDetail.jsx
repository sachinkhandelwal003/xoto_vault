import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '@/api/apiService';
import {
  Avatar, Badge, Button, Card, Col, Divider, Empty, Popconfirm,
  Row, Space, Spin, Tag, Typography, message, Grid,
} from 'antd';
import {
  ArrowLeftOutlined, BankOutlined, CheckCircleOutlined, DeleteOutlined,
  EditOutlined, GlobalOutlined, LeftOutlined, MailOutlined,
  PhoneOutlined, PlusOutlined, RightOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const THEME = '#5C039B';

const fmt  = (v) => (v === undefined || v === null || v === '' ? '—' : v);
const fmtMoney = (v) => (v != null ? `AED ${Number(v).toLocaleString()}` : '—');
const fmtPct   = (v) => (v != null ? `${v}%` : '—');

/* Single label → value line */
const InfoLine = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
    <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap', marginRight: 6 }}>{label}</Text>
    <Text style={{ fontSize: 12, color: '#1e293b', fontWeight: 700, textAlign: 'right' }}>{value}</Text>
  </div>
);

/* Column heading inside card */
const ColHead = ({ children }) => (
  <div style={{ fontSize: 10, color: THEME, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1, marginBottom: 8, paddingBottom: 4, borderBottom: `2px solid ${THEME}` }}>
    {children}
  </div>
);

const BankDetail = () => {
  const { bankId } = useParams();
  const navigate   = useNavigate();
  const screens    = useBreakpoint();

  const [bank,           setBank]           = useState(null);
  const [products,       setProducts]       = useState([]);
  const [bankLoading,    setBankLoading]    = useState(true);
  const [productsLoading,setProductsLoading]= useState(true);
  const [total,          setTotal]          = useState(0);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [totalPages,     setTotalPages]     = useState(1);
  const pageSize = 10;

  /* ── Fetch bank ── */
  useEffect(() => {
    if (!bankId) return;
    setBankLoading(true);
    apiService.get(`bank/${bankId}`)
      .then((res) => { if (res?.success) setBank(res.data); })
      .catch(() => message.error('Failed to load bank details'))
      .finally(() => setBankLoading(false));
  }, [bankId]);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async (page) => {
    if (!bankId) return;
    setProductsLoading(true);
    try {
      const res = await apiService.get(`bank/admin/${bankId}/products`, { page, limit: pageSize });
      if (res?.success) {
        setProducts(res.data || []);
        setTotal(res.total || res.pagination?.totalItems || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch {
      message.error('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  }, [bankId]);

  useEffect(() => { fetchProducts(currentPage); }, [currentPage, fetchProducts]);

  const handleDeleteProduct = async (id) => {
    try {
      await apiService.delete(`bank/products/${id}`);
      message.success('Product deleted successfully');
      fetchProducts(currentPage);
    } catch {
      message.error('Failed to delete product');
    }
  };

  /* ── Loading / error states ── */
  if (bankLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" tip="Loading bank details…" />
    </div>
  );

  if (!bank) return <div style={{ padding: 24 }}><Empty description="Bank not found" /></div>;

  return (
    <div style={{ padding: screens.md ? '24px' : '12px', background: '#f8fafc', minHeight: '100vh' }}>

      {/* Back */}
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/vault-admin/bank/list')}
        style={{ marginBottom: 20, borderRadius: 8, fontWeight: 600 }}>
        Back to Bank Library
      </Button>

      {/* ══════════════ BANK INFO CARD ══════════════ */}
      <Card bordered={false} bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(92,3,155,0.08)', marginBottom: 28, overflow: 'hidden' }}>
        <div style={{ height: 7, background: 'linear-gradient(90deg,#5C039B,#03A4F4)' }} />
        <div style={{ padding: screens.md ? '24px 32px' : '16px' }}>
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} sm={16}>
              <Space size={16} align="center">
                <Avatar src={bank.logo} icon={<BankOutlined />} shape="square"
                  size={screens.md ? 72 : 52}
                  style={{ borderRadius: 12, border: '2px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: '#fff' }} />
                <div>
                  <Title level={2} style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>{bank.bankName}</Title>
                  <Text style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{bank.bankCode}</Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={8} style={{ textAlign: screens.sm ? 'right' : 'left' }}>
              <Space direction="vertical" size={8} align={screens.sm ? 'end' : 'start'}>
                <Badge status={bank.status === 'Active' ? 'success' : 'default'}
                  text={<Text style={{ fontWeight: 600, color: bank.status === 'Active' ? '#059669' : '#6b7280', fontSize: 14 }}>{bank.status}</Text>} />
                <Button type="primary" icon={<EditOutlined />}
                  onClick={() => navigate(`/dashboard/vault-admin/bank/manage/${bankId}`)}
                  style={{ background: 'linear-gradient(135deg,#5C039B,#03A4F4)', border: 'none', borderRadius: 8, fontWeight: 600 }}>
                  Edit Bank
                </Button>
              </Space>
            </Col>
          </Row>

          <Divider style={{ margin: '18px 0' }} />

          <Row gutter={[24, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Space size={8}>
                <MailOutlined style={{ color: THEME, fontSize: 15 }} />
                <div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Email</div>
                  <Text style={{ fontWeight: 500, color: '#374151', fontSize: 13 }}>{bank.contactEmail || '—'}</Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space size={8}>
                <PhoneOutlined style={{ color: THEME, fontSize: 15 }} />
                <div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Phone</div>
                  <Text style={{ fontWeight: 500, color: '#374151', fontSize: 13 }}>{bank.contactPhone || '—'}</Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space size={8}>
                <GlobalOutlined style={{ color: THEME, fontSize: 15 }} />
                <div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Website</div>
                  <a href={bank.website} target="_blank" rel="noreferrer" style={{ fontWeight: 500, color: THEME, fontSize: 13 }}>{bank.website || '—'}</a>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Mortgage Types</div>
              <Space wrap size={[4, 4]}>
                {(bank.mortgageTypesSupported || []).map((t) => (
                  <Tag key={t} color="purple" style={{ borderRadius: 6, fontWeight: 600, margin: 0, fontSize: 11 }}>{t}</Tag>
                ))}
              </Space>
            </Col>
          </Row>
        </div>
      </Card>

      {/* ══════════════ PRODUCTS HEADER ══════════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>Bank Products</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>{total} product{total !== 1 ? 's' : ''} under {bank.bankName}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => navigate(`/dashboard/vault-admin/bank/products/manage?bank=${bankId}`)}
          style={{ background: 'linear-gradient(135deg,#5C039B,#03A4F4)', border: 'none', borderRadius: 8, fontWeight: 600, height: 40, padding: '0 20px' }}>
          Add Product
        </Button>
      </div>

      {/* ══════════════ PRODUCTS LIST ══════════════ */}
      {productsLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
      ) : products.length === 0 ? (
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: '60px 0', border: '1px dashed #cbd5e1' }}>
          <Empty description={<Text type="secondary">No products found for this bank.</Text>} />
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => navigate(`/dashboard/vault-admin/bank/products/manage?bank=${bankId}`)}
            style={{ marginTop: 20, background: THEME, borderRadius: 8 }}>
            Add First Product
          </Button>
        </Card>
      ) : (
        <div>
          {products.map((item, idx) => {
            const validity = item.productValidity?.doesNotExpire
              ? 'Does Not Expire'
              : item.productValidity?.expiryDate
                ? new Date(item.productValidity.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—';
            const insVal = (obj) => obj?.value != null ? `AED ${Number(obj.value).toLocaleString()} / ${obj.frequency}` : '—';

            return (
              <React.Fragment key={item._id}>

                {/* ── Single full-width product card ── */}
                <Card bordered={false} bodyStyle={{ padding: 0 }}
                  style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #e8edf4' }}>

                  {/* Top colour bar */}
                  <div style={{ height: 5, background: item.status === 'Active' ? `linear-gradient(90deg,${THEME},#03A4F4)` : '#cbd5e1' }} />

                  <div style={{ padding: screens.md ? '20px 28px' : '16px' }}>

                    {/* ── Row 1 : Identity + badges + actions ── */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                      <Space size={14} align="center">
                        <Avatar src={bank.logo} icon={<BankOutlined />} shape="square" size={52}
                          style={{ borderRadius: 10, border: '1px solid #f1f5f9', background: '#fff', flexShrink: 0 }} />
                        <div>
                          <Title level={4} style={{ margin: 0, color: '#1e293b', fontWeight: 800, lineHeight: 1.2 }}>{item.productName}</Title>
                          <Text style={{ fontSize: 11, color: '#94a3b8' }}>{item.productId}</Text>
                        </div>
                      </Space>

                      <Space size={8} align="center" wrap>
                        <Tag color={item.status === 'Active' ? 'success' : 'default'} style={{ borderRadius: 6, fontWeight: 700, fontSize: 11, margin: 0 }}>
                          {item.status?.toUpperCase()}
                        </Tag>
                        <Tag color={item.mortgageType === 'Islamic' ? 'green' : 'blue'} style={{ borderRadius: 6, fontWeight: 600, fontSize: 11, margin: 0 }}>
                          {item.mortgageType}
                        </Tag>
                        <Tag color={item.rateType === 'Fixed' ? 'purple' : 'cyan'} style={{ borderRadius: 6, fontWeight: 600, fontSize: 11, margin: 0 }}>
                          {item.rateType}
                        </Tag>
                        {item.isFeatured && <Tag color="gold" icon={<CheckCircleOutlined />} style={{ borderRadius: 6, fontSize: 11, margin: 0 }}>Featured</Tag>}
                        {item.isPopular  && <Tag color="orange" style={{ borderRadius: 6, fontSize: 11, margin: 0 }}>Popular</Tag>}

                        <Button type="primary" icon={<EditOutlined />}
                          onClick={() => navigate(`/dashboard/vault-admin/bank/products/manage/${item._id}?bank=${bankId}`)}
                          style={{ background: THEME, border: 'none', borderRadius: 8, height: 36, fontWeight: 700, fontSize: 13 }}>
                          Edit
                        </Button>
                        <Popconfirm title="Delete this product?" description="This action cannot be undone."
                          onConfirm={() => handleDeleteProduct(item._id)}
                          okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel">
                          <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 8, height: 36, fontWeight: 600 }}>Delete</Button>
                        </Popconfirm>
                      </Space>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <Text style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, display: 'block', marginBottom: 16 }}>
                        {item.description}
                      </Text>
                    )}

                    <Divider style={{ margin: '0 0 16px' }} />

                    {/* ── Row 2 : Detail columns ── */}
                    <Row gutter={[0, 0]}>

                      {/* Col 1 — Rate & LTV */}
                      <Col xs={24} sm={12} md={5}>
                        <div style={{ paddingRight: screens.md ? 20 : 0, marginBottom: screens.md ? 0 : 16 }}>
                          <ColHead>Rate & LTV</ColHead>
                          <InfoLine label="Interest Rate"   value={fmt(item.interestRate)} />
                          <InfoLine label="Floor Rate"      value={fmtPct(item.minimumFloorRate)} />
                          <InfoLine label="Follow-on Rate"  value={fmt(item.followOnRate)} />
                          <InfoLine label="LTV Min"         value={fmtPct(item.ltv?.min)} />
                          <InfoLine label="LTV Max"         value={fmtPct(item.ltv?.max)} />
                        </div>
                      </Col>

                      {screens.md && <Col md={1}><Divider type="vertical" style={{ height: '100%', margin: '0 auto', display: 'block' }} /></Col>}

                      {/* Col 2 — Loan */}
                      <Col xs={24} sm={12} md={4}>
                        <div style={{ paddingLeft: screens.md ? 16 : 0, paddingRight: screens.md ? 16 : 0, marginBottom: screens.md ? 0 : 16 }}>
                          <ColHead>Loan Details</ColHead>
                          <InfoLine label="Min Loan"        value={fmtMoney(item.minLoanAmount)} />
                          <InfoLine label="Max Loan"        value={fmtMoney(item.maxLoanAmount)} />
                          <InfoLine label="Min Salary"      value={fmtMoney(item.minSalary)} />
                          <InfoLine label="Salary Transfer" value={fmt(item.salaryTransfer)} />
                          <InfoLine label="Display Order"   value={fmt(item.displayOrder)} />
                        </div>
                      </Col>

                      {screens.md && <Col md={1}><Divider type="vertical" style={{ height: '100%', margin: '0 auto', display: 'block' }} /></Col>}

                      {/* Col 3 — Fees */}
                      <Col xs={24} sm={12} md={4}>
                        <div style={{ paddingLeft: screens.md ? 16 : 0, paddingRight: screens.md ? 16 : 0, marginBottom: screens.md ? 0 : 16 }}>
                          <ColHead>Fees</ColHead>
                          <InfoLine label="Bank Fees"        value={fmtMoney(item.bankFees)} />
                          <InfoLine label="Valuation Fee"    value={fmtMoney(item.propertyValuationFee)} />
                          <InfoLine label="Pre-approval"     value={item.isBankPreApprovalFeeFree ? 'Free' : fmtMoney(item.bankPreApprovalFee)} />
                          <InfoLine label="Processing Fee"   value={fmtMoney(item.minimumBankProcessingFee)} />
                          <InfoLine label="Buyout Fee"       value={item.isBuyoutFeeNA ? 'N/A' : fmtMoney(item.buyoutFee)} />
                        </div>
                      </Col>

                      {screens.md && <Col md={1}><Divider type="vertical" style={{ height: '100%', margin: '0 auto', display: 'block' }} /></Col>}

                      {/* Col 4 — Insurance & Validity */}
                      <Col xs={24} sm={12} md={4}>
                        <div style={{ paddingLeft: screens.md ? 16 : 0, paddingRight: screens.md ? 16 : 0, marginBottom: screens.md ? 0 : 16 }}>
                          <ColHead>Insurance</ColHead>
                          <InfoLine label="Property Ins." value={insVal(item.propertyInsurance)} />
                          <InfoLine label="Life Ins."      value={insVal(item.lifeInsurance)} />
                          <div style={{ marginTop: 10 }}>
                            <ColHead>Validity</ColHead>
                            <InfoLine label="Expires" value={validity} />
                          </div>
                        </div>
                      </Col>

                      {screens.md && <Col md={1}><Divider type="vertical" style={{ height: '100%', margin: '0 auto', display: 'block' }} /></Col>}

                      {/* Col 5 — Eligibility + Key Features */}
                      <Col xs={24} md={8}>
                        <div style={{ paddingLeft: screens.md ? 16 : 0 }}>
                          <ColHead>Eligibility</ColHead>
                          <div style={{ padding: '4px 0', borderBottom: '1px dashed #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>Employment</Text>
                            <Space wrap size={[3, 3]} style={{ justifyContent: 'flex-end' }}>
                              {(item.employmentStatus || []).map((e) => <Tag key={e} style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>{e}</Tag>)}
                            </Space>
                          </div>
                          <div style={{ padding: '4px 0', borderBottom: '1px dashed #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>Residency</Text>
                            <Space wrap size={[3, 3]} style={{ justifyContent: 'flex-end' }}>
                              {(item.residencyStatus || []).map((r) => <Tag key={r} color="blue" style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>{r}</Tag>)}
                            </Space>
                          </div>
                          <div style={{ padding: '4px 0', borderBottom: '1px dashed #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>Tx Types</Text>
                            <Space wrap size={[3, 3]} style={{ justifyContent: 'flex-end' }}>
                              {(item.transactionType || []).map((t) => <Tag key={t} color="purple" style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>{t}</Tag>)}
                            </Space>
                          </div>

                          {(item.keyFeatures || []).length > 0 && (
                            <>
                              <div style={{ marginTop: 10 }}><ColHead>Key Features</ColHead></div>
                              {item.keyFeatures.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '3px 0' }}>
                                  <CheckCircleOutlined style={{ color: '#10b981', fontSize: 11, marginTop: 2, flexShrink: 0 }} />
                                  <Text style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{f}</Text>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </Col>

                    </Row>
                  </div>
                </Card>

                {/* HR divider between cards, not after the last one */}
                {idx < products.length - 1 && (
                  <Divider style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />
                )}

              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Card bordered={false} bodyStyle={{ padding: '8px 16px' }}
            style={{ display: 'inline-block', borderRadius: 100, boxShadow: '0 8px 20px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
            <Space size="large">
              <Button type="text" icon={<LeftOutlined />} disabled={currentPage === 1}
                onClick={() => { setCurrentPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ fontWeight: 600 }}>
                Prev
              </Button>
              <Space size={8}>
                <Text style={{ color: '#94a3b8' }}>Page</Text>
                <Text strong style={{ fontSize: 16, color: THEME }}>{currentPage}</Text>
                <Text style={{ color: '#94a3b8' }}>of {totalPages}</Text>
              </Space>
              <Button type="text" disabled={currentPage === totalPages}
                onClick={() => { setCurrentPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ fontWeight: 600 }}>
                Next <RightOutlined />
              </Button>
            </Space>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BankDetail;
