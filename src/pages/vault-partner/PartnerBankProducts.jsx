import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '@/api/apiService';
import {
  Card, Row, Col, Tag, message, Typography, Statistic,
  Avatar, Grid, Tooltip, Empty, Spin,
} from 'antd';
import {
  BankOutlined, TeamOutlined, EyeOutlined,
  CheckCircleOutlined, LeftOutlined, RightOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const THEME = '#5C039B';
const GRADIENT = 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)';

export default function PartnerBankProducts() {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  const queryParams = new URLSearchParams(location.search);
  const bankId = queryParams.get('bank');

  const [products, setProducts] = useState([]);
  const [bankInfo, setBankInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 12;

  const fetchProducts = useCallback(async (page) => {
    setLoading(true);
    try {
      const endpoint = bankId ? `bank/admin/${bankId}/products` : 'bank/products';
      const res = await apiService.get(endpoint, { page, limit: PAGE_SIZE });
      if (res?.success) {
        setProducts(res.data || []);
        setTotal(res.total || res.pagination?.totalItems || 0);
        setTotalPages(res.pagination?.totalPages || 1);
        if (res.bank) setBankInfo(res.bank);
      }
    } catch {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [bankId]);

  useEffect(() => { fetchProducts(currentPage); }, [currentPage, fetchProducts]);

  const goToView = (id) => navigate(`/dashboard/vaultpartner/bank/products/${id}`);

  return (
    <div style={{ background: '#f5f3ff', minHeight: '100vh', paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ background: GRADIENT, padding: '28px 32px 36px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '40%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {bankInfo?.logo && (
              <Avatar src={bankInfo.logo} shape="square" size={60}
                style={{ borderRadius: 12, border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }} />
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: screens.md ? 28 : 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                {bankInfo ? `${bankInfo.bankName} Products` : 'Bank Products Library'}
              </h1>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                {total} mortgage products available
              </p>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '12px 20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.25)' }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 24, lineHeight: 1 }}>{total}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Products</div>
          </div>
        </div>
      </div>

      <div style={{ padding: screens.md ? '28px 32px' : '16px' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" tip="Loading products..." />
          </div>
        ) : products.length === 0 ? (
          <Card style={{ borderRadius: 16, textAlign: 'center', padding: '60px 0', border: '1px dashed #c4b5fd' }}>
            <Empty
              image={<BankOutlined style={{ fontSize: 60, color: '#c4b5fd' }} />}
              description={<Text type="secondary" style={{ fontSize: 16 }}>No products available at the moment.</Text>}
            />
          </Card>
        ) : (
          <Row gutter={[20, 20]}>
            {products.map((item) => (
              <Col xs={24} sm={12} lg={8} key={item._id}>
                <Card
                  hoverable
                  onClick={() => goToView(item._id)}
                  bodyStyle={{ padding: 0 }}
                  style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #ede9fe', transition: 'all 0.25s ease', cursor: 'pointer' }}
                >
                  <div style={{ height: 5, background: item.status === 'Active' ? THEME : '#cbd5e1' }} />

                  <div style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <Avatar
                        src={item.bank?.logo || bankInfo?.logo}
                        shape="square" size={52} icon={<BankOutlined />}
                        style={{ borderRadius: 10, border: '1px solid #f1f5f9', background: '#fff', flexShrink: 0 }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                        <Tag color={item.status === 'Active' ? 'success' : 'default'} style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
                          {item.status?.toUpperCase()}
                        </Tag>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <Tag color={item.mortgageType === 'Islamic' ? 'green' : 'blue'} style={{ borderRadius: 6, margin: 0, fontWeight: 600, fontSize: 11 }}>
                            {item.mortgageType}
                          </Tag>
                          <Tag color={item.rateType === 'Fixed' ? 'purple' : 'cyan'} style={{ borderRadius: 6, margin: 0, fontWeight: 600, fontSize: 11 }}>
                            {item.rateType}
                          </Tag>
                        </div>
                        {(item.isFeatured || item.isPopular) && (
                          <div style={{ display: 'flex', gap: 5 }}>
                            {item.isFeatured && <Tag color="gold" icon={<CheckCircleOutlined />} style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>Featured</Tag>}
                            {item.isPopular && <Tag color="orange" style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>Popular</Tag>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4, minHeight: 44, lineHeight: 1.4 }}>
                      {item.productName}
                    </div>

                    {!bankId && (
                      <Text style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 14 }}>
                        {item.bank?.bankName}{item.bank?.bankCode ? ` • ${item.bank.bankCode}` : ''}
                      </Text>
                    )}

                    <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#eff6ff)', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid #ede9fe' }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginBottom: 3 }}>Rate</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: THEME }}>{item.interestRate}</div>
                        </Col>
                        <Col span={12} style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginBottom: 3 }}>Max LTV</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{item.ltv?.max}%</div>
                        </Col>
                      </Row>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 13 }}>
                        <TeamOutlined />
                        <span>Min Salary:</span>
                        <strong>{item.minSalary ? `AED ${item.minSalary.toLocaleString()}` : '—'}</strong>
                      </div>
                      <Tooltip title={item.transactionType?.join(', ')}>
                        <Tag style={{ border: 'none', background: '#f1f5f9', fontSize: 11, borderRadius: 6, color: '#475569', margin: 0 }}>
                          {item.transactionType?.length || 0} Types
                        </Tag>
                      </Tooltip>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); goToView(item._id); }}
                      style={{
                        width: '100%', padding: '10px 0', borderRadius: 10,
                        background: 'transparent', border: `2px solid ${THEME}`,
                        color: THEME, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.2s',
                      }}
                    >
                      <EyeOutlined /> View Details
                    </button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 100, padding: '8px 20px', boxShadow: '0 4px 16px rgba(92,3,155,0.1)', border: '1px solid #ede9fe' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#cbd5e1' : THEME, fontWeight: 600, fontSize: 13 }}
              >
                <LeftOutlined /> Prev
              </button>
              <span style={{ color: '#64748b', fontSize: 13 }}>Page <strong style={{ color: THEME }}>{currentPage}</strong> of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#cbd5e1' : THEME, fontWeight: 600, fontSize: 13 }}
              >
                Next <RightOutlined />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
