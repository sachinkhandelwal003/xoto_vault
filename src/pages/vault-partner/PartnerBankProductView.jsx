import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '@/api/apiService';
import {
  Avatar, Card, Col, Row, Spin, Tag, Typography, Grid, message,
} from 'antd';
import {
  ArrowLeftOutlined, BankOutlined, DollarOutlined, FileTextOutlined,
  SafetyCertificateOutlined, TeamOutlined, CalendarOutlined,
  CheckCircleFilled, StarFilled, ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const PRIMARY = '#5C039B';
const GRADIENT = 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)';
const GREEN = '#10b981';

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
    <Text type="secondary" style={{ fontSize: 13, flexShrink: 0 }}>{label}</Text>
    <Text strong style={{ fontSize: 14, color: '#1e293b', textAlign: 'right', maxWidth: '60%' }}>{value ?? '—'}</Text>
  </div>
);

const SectionCard = ({ icon, title, children }) => (
  <Card bordered={false} style={{ borderRadius: 14, border: '1px solid #ede9fe', boxShadow: '0 2px 12px rgba(92,3,155,0.06)', marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PRIMARY, fontSize: 16 }}>
        {icon}
      </div>
      <Text strong style={{ fontSize: 15, color: '#1e293b' }}>{title}</Text>
    </div>
    {children}
  </Card>
);

export default function PartnerBankProductView() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const bankId = new URLSearchParams(location.search).get('bank');

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const backUrl = bankId
    ? `/dashboard/vaultpartner/bank/products?bank=${bankId}`
    : '/dashboard/vaultpartner/bank/products';

  useEffect(() => {
    if (!productId) return;
    apiService.get(`bank/products/${productId}`)
      .then((res) => { if (res?.success) setProduct(res.data); })
      .catch(() => { message.error('Failed to load product details'); })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading product..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <BankOutlined style={{ fontSize: 48, color: '#c4b5fd' }} />
        <Text type="secondary" style={{ fontSize: 15 }}>Product not found.</Text>
        <button
          onClick={() => navigate('/dashboard/vaultpartner/bank/products')}
          style={{ marginTop: 8, background: PRIMARY, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 700 }}
        >
          Back to Products
        </button>
      </div>
    );
  }

  const bank = product.bank || {};
  const statusColor = product.status === 'Active' ? GREEN : product.status === 'Archived' ? '#6366f1' : '#94a3b8';

  return (
    <div style={{ background: '#f5f3ff', minHeight: '100vh', paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ background: GRADIENT, padding: screens.md ? '28px 32px 36px' : '20px 16px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '40%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <button
          onClick={() => navigate(backUrl)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}
        >
          <ArrowLeftOutlined /> Back to Products
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <Avatar src={bank.logo} icon={<BankOutlined />} shape="square" size={72}
            style={{ borderRadius: 16, border: '3px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />

          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: screens.md ? 26 : 20, lineHeight: 1.2 }}>
              {product.productName}
            </h1>
            <p style={{ margin: '4px 0 12px', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              {bank.bankName}{bank.bankCode ? ` • ${bank.bankCode}` : ''}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag style={{ background: statusColor, border: 'none', color: '#fff', borderRadius: 20, fontWeight: 700, padding: '2px 12px' }}>{product.status}</Tag>
              <Tag style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 20, fontWeight: 600, padding: '2px 12px' }}>{product.mortgageType}</Tag>
              <Tag style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 20, fontWeight: 600, padding: '2px 12px' }}>{product.rateType}</Tag>
              {product.isFeatured && <Tag icon={<StarFilled />} style={{ background: 'rgba(250,204,21,0.2)', border: '1px solid rgba(250,204,21,0.5)', color: '#fbbf24', borderRadius: 20, padding: '2px 12px' }}>Featured</Tag>}
              {product.isPopular && <Tag icon={<ThunderboltOutlined />} style={{ background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.5)', color: '#fb923c', borderRadius: 20, padding: '2px 12px' }}>Popular</Tag>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '14px 20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.25)' }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Interest Rate</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 26, lineHeight: 1 }}>{product.interestRate}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '14px 20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.25)' }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Max LTV</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 26, lineHeight: 1 }}>{product.ltv?.max}%</div>
            </div>
          </div>
        </div>

        {product.description && (
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.6 }}>{product.description}</Text>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: screens.md ? '24px 32px' : '16px' }}>
        <Row gutter={[20, 0]}>
          <Col xs={24} lg={14}>
            <SectionCard icon={<TeamOutlined />} title="Eligibility">
              <InfoRow label="Transaction Types"  value={product.transactionType?.join(', ')} />
              <InfoRow label="Employment Status"  value={product.employmentStatus?.join(', ')} />
              <InfoRow label="Residency Status"   value={product.residencyStatus?.join(', ')} />
              <InfoRow label="Salary Transfer"    value={product.salaryTransfer} />
              <InfoRow label="Minimum Salary"     value={product.minSalary ? `AED ${product.minSalary.toLocaleString()}` : null} />
            </SectionCard>

            <SectionCard icon={<DollarOutlined />} title="Rates & Loan Details">
              <InfoRow label="Rate Type"        value={product.rateType} />
              <InfoRow label="Interest Rate"    value={product.interestRate} />
              <InfoRow label="Min Floor Rate"   value={product.minimumFloorRate != null ? `${product.minimumFloorRate}%` : null} />
              <InfoRow label="Follow-On Rate"   value={product.followOnRate} />
              <InfoRow label="LTV Range"        value={product.ltv ? `${product.ltv.min}% – ${product.ltv.max}%` : null} />
              <InfoRow label="Min Loan Amount"  value={product.minLoanAmount ? `AED ${product.minLoanAmount.toLocaleString()}` : null} />
              <InfoRow label="Max Loan Amount"  value={product.maxLoanAmount ? `AED ${product.maxLoanAmount.toLocaleString()}` : null} />
            </SectionCard>

            <SectionCard icon={<FileTextOutlined />} title="Fees & Costs">
              <InfoRow label="Bank Fees"              value={product.bankFees != null ? `AED ${product.bankFees.toLocaleString()}` : null} />
              <InfoRow label="Property Valuation Fee" value={product.propertyValuationFee != null ? `AED ${product.propertyValuationFee.toLocaleString()}` : null} />
              <InfoRow label="Min Processing Fee"     value={product.minimumBankProcessingFee != null ? `AED ${product.minimumBankProcessingFee.toLocaleString()}` : null} />
              <InfoRow label="Pre-Approval Fee"       value={product.isBankPreApprovalFeeFree ? 'Free' : product.bankPreApprovalFee != null ? `AED ${product.bankPreApprovalFee.toLocaleString()}` : null} />
              <InfoRow label="Buyout Fee"             value={product.isBuyoutFeeNA ? 'N/A' : product.buyoutFee != null ? `AED ${product.buyoutFee.toLocaleString()}` : null} />
            </SectionCard>
          </Col>

          <Col xs={24} lg={10}>
            <SectionCard icon={<SafetyCertificateOutlined />} title="Insurance">
              <InfoRow label="Property Insurance" value={product.propertyInsurance?.value != null ? `AED ${product.propertyInsurance.value.toLocaleString()} / ${product.propertyInsurance.frequency}` : null} />
              <InfoRow label="Life Insurance"     value={product.lifeInsurance?.value != null ? `AED ${product.lifeInsurance.value.toLocaleString()} / ${product.lifeInsurance.frequency}` : null} />
            </SectionCard>

            {product.keyFeatures?.length > 0 && (
              <SectionCard icon={<CheckCircleFilled />} title="Key Features">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {product.keyFeatures.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <CheckCircleFilled style={{ color: GREEN, fontSize: 15, marginTop: 2, flexShrink: 0 }} />
                      <Text style={{ fontSize: 14, color: '#334155' }}>{f}</Text>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            <SectionCard icon={<CalendarOutlined />} title="Validity & Info">
              <InfoRow label="Product Validity" value={product.productValidity?.doesNotExpire ? 'Does Not Expire' : product.productValidity?.expiryDate ? dayjs(product.productValidity.expiryDate).format('DD MMM YYYY') : null} />
              <InfoRow label="Display Order"    value={product.displayOrder} />
              <InfoRow label="Product ID"       value={product.productId} />
              <InfoRow label="Created"          value={product.createdAt ? dayjs(product.createdAt).format('DD MMM YYYY') : null} />
              <InfoRow label="Last Updated"     value={product.updatedAt ? dayjs(product.updatedAt).format('DD MMM YYYY') : null} />
            </SectionCard>

            {(bank.website || bank.contactEmail || bank.contactPhone) && (
              <SectionCard icon={<BankOutlined />} title="Bank Contact">
                {bank.website    && <InfoRow label="Website" value={bank.website} />}
                {bank.contactEmail && <InfoRow label="Email" value={bank.contactEmail} />}
                {bank.contactPhone && <InfoRow label="Phone" value={bank.contactPhone} />}
              </SectionCard>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
}
