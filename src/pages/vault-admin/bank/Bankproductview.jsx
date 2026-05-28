import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '@/api/apiService';
import {
  Avatar, Button, Card, Col, Divider, Form, Input, InputNumber,
  Row, Select, Space, Spin, Switch, Tag, Tabs, Typography,
  Popconfirm, DatePicker, notification, message,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, SaveOutlined,
  BankOutlined, DollarOutlined, FileTextOutlined, EyeOutlined,
  SafetyCertificateOutlined, TeamOutlined, CalendarOutlined,
  CheckCircleFilled, StarFilled, ThunderboltOutlined, FileSearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const PRIMARY = '#5C039B';
const GRADIENT = 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)';

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
    <Text type="secondary" style={{ fontSize: 13, flexShrink: 0 }}>{label}</Text>
    <Text strong style={{ fontSize: 14, color: '#1e293b', textAlign: 'right', maxWidth: '60%' }}>{value ?? '—'}</Text>
  </div>
);

const SectionCard = ({ icon, title, children }) => (
  <Card bordered={false} style={{ borderRadius: 14, border: '1px solid #f0e8ff', boxShadow: '0 2px 12px rgba(92,3,155,0.06)', marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PRIMARY, fontSize: 16 }}>{icon}</div>
      <Text strong style={{ fontSize: 15, color: '#1e293b' }}>{title}</Text>
    </div>
    {children}
  </Card>
);

const TABS_EDIT = [
  { key: '1', label: 'Basic Info',    icon: <BankOutlined /> },
  { key: '2', label: 'Eligibility',  icon: <TeamOutlined /> },
  { key: '3', label: 'Rates & Loan', icon: <DollarOutlined /> },
  { key: '4', label: 'Fees & Costs', icon: <FileTextOutlined /> },
  { key: '5', label: 'Insurance',    icon: <SafetyCertificateOutlined /> },
  { key: '6', label: 'Features',     icon: <FileSearchOutlined /> },
];

const col3 = { xs: 24, sm: 12, md: 8 };
const col2 = { xs: 24, sm: 24, md: 12 };

const Bankproductview = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const bankId = new URLSearchParams(location.search).get('bank');

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [mainTab, setMainTab] = useState('view');
  const [editSection, setEditSection] = useState('1');
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [form] = Form.useForm();

  const backUrl = bankId
    ? `/dashboard/vault-admin/bank/products?bank=${bankId}`
    : '/dashboard/vault-admin/bank/products';

  const fetchProduct = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await apiService.get(`bank/products/${productId}`);
      if (res?.success) {
        setProduct(res.data);
        prefillForm(res.data);
        if (res.data?.bank) setSelectedBank(res.data.bank);
      }
    } catch {
      message.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await apiService.get('bank');
      const list = res?.data || res || [];
      setBanks(Array.isArray(list) ? list : []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchProduct();
    fetchBanks();
  }, [productId]);

  const prefillForm = (data) => {
    if (!data) return;
    form.setFieldsValue({
      ...data,
      bank: data.bank?._id || data.bank,
      productValidity: {
        ...data.productValidity,
        expiryDate: data.productValidity?.expiryDate ? dayjs(data.productValidity.expiryDate) : null,
      },
    });
  };

  const handleSave = async (values) => {
    if (saveLoading) return;
    setSaveLoading(true);
    try {
      const payload = {
        ...values,
        productValidity: {
          ...values.productValidity,
          expiryDate: values.productValidity?.doesNotExpire ? null : values.productValidity?.expiryDate,
        },
      };
      await apiService.put(`products/${productId}`, payload);
      notification.success({ message: 'Product Updated!', description: 'Changes saved successfully.' });
      await fetchProduct();
      setMainTab('view');
    } catch (err) {
      notification.error({ message: 'Update Failed', description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await apiService.delete(`products/${productId}`);
      notification.success({ message: 'Product deleted successfully' });
      navigate(backUrl);
    } catch {
      notification.error({ message: 'Failed to delete product' });
      setLoading(false);
    }
  };

  if (loading && !product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading product..." />
      </div>
    );
  }

  if (!product) return null;

  const bank = product.bank || {};
  const statusColor = product.status === 'Active' ? '#10b981' : product.status === 'Archived' ? '#6366f1' : '#94a3b8';

  // ── View Tab ──────────────────────────────────────────────────────────────
  const ViewContent = () => (
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
          <InfoRow label="Rate Type"          value={product.rateType} />
          <InfoRow label="Interest Rate"      value={product.interestRate} />
          <InfoRow label="Min Floor Rate"     value={product.minimumFloorRate != null ? `${product.minimumFloorRate}%` : null} />
          <InfoRow label="Follow-On Rate"     value={product.followOnRate} />
          <InfoRow label="LTV Range"          value={product.ltv ? `${product.ltv.min}% – ${product.ltv.max}%` : null} />
          <InfoRow label="Min Loan Amount"    value={product.minLoanAmount ? `AED ${product.minLoanAmount.toLocaleString()}` : null} />
          <InfoRow label="Max Loan Amount"    value={product.maxLoanAmount ? `AED ${product.maxLoanAmount.toLocaleString()}` : null} />
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
                  <CheckCircleFilled style={{ color: '#10b981', fontSize: 15, marginTop: 2, flexShrink: 0 }} />
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
          <InfoRow label="Created"          value={product.createdAt ? dayjs(product.createdAt).format('DD MMM YYYY, hh:mm A') : null} />
          <InfoRow label="Last Updated"     value={product.updatedAt ? dayjs(product.updatedAt).format('DD MMM YYYY, hh:mm A') : null} />
        </SectionCard>

        {(bank.website || bank.contactEmail || bank.contactPhone) && (
          <SectionCard icon={<BankOutlined />} title="Bank Contact">
            {bank.website && <InfoRow label="Website" value={bank.website} />}
            {bank.contactEmail && <InfoRow label="Email" value={bank.contactEmail} />}
            {bank.contactPhone && <InfoRow label="Phone" value={bank.contactPhone} />}
          </SectionCard>
        )}
      </Col>
    </Row>
  );

  // ── Edit Tab ──────────────────────────────────────────────────────────────
  const EditContent = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
      scrollToFirstError
    >
      {/* Section Nav */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '0 16px', marginBottom: 16, border: '1px solid #f0e8ff', overflowX: 'auto', display: 'flex' }}>
        {TABS_EDIT.map((t) => {
          const isActive = t.key === editSection;
          return (
            <button key={t.key} onClick={() => setEditSection(t.key)} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 7, padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: isActive ? `3px solid ${PRIMARY}` : '3px solid transparent', color: isActive ? PRIMARY : '#9ca3af', fontWeight: isActive ? 700 : 500, fontSize: 13, whiteSpace: 'nowrap' }}>
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Basic Info */}
      <div style={{ display: editSection === '1' ? 'block' : 'none' }}>
        <Card bordered={false} style={{ borderRadius: 14, border: '1px solid #f0e8ff', marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col {...col3}>
              <Form.Item name="bank" label="Bank" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select Bank" optionFilterProp="label" size="large"
                  onChange={(id) => setSelectedBank(banks.find((b) => b._id === id) || null)}>
                  {banks.map((b) => <Option key={b._id} value={b._id} label={b.bankName}>{b.bankName} ({b.bankCode})</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col {...col2}>
              <Form.Item name="productName" label="Product Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Premium Home Mortgage" size="large" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col {...col3}>
              <Form.Item name="mortgageType" label="Mortgage Type" rules={[{ required: true }]}>
                <Select size="large"><Option value="Islamic">Islamic</Option><Option value="Conventional">Conventional</Option></Select>
              </Form.Item>
            </Col>
            <Col {...col3}>
              <Form.Item name="status" label="Status">
                <Select size="large">
                  <Option value="Active">Active</Option><Option value="Inactive">Inactive</Option>
                  <Option value="Archived">Archived</Option><Option value="Expired">Expired</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col {...col3}>
              <Form.Item name="displayOrder" label="Display Order">
                <InputNumber style={{ width: '100%' }} min={0} size="large" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </div>

      {/* TAB 2: Eligibility */}
      <div style={{ display: editSection === '2' ? 'block' : 'none' }}>
        <Card bordered={false} style={{ borderRadius: 14, border: '1px solid #f0e8ff', marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col {...col2}>
              <Form.Item name="transactionType" label="Transaction Types">
                <Select mode="multiple" size="large">
                  <Option value="Primary Residential">Primary Residential</Option>
                  <Option value="Primary Commercial">Primary Commercial</Option>
                  <Option value="Buyout">Buyout</Option>
                  <Option value="Equity">Equity</Option>
                  <Option value="Buyout + Equity">Buyout + Equity</Option>
                  <Option value="Offplan">Offplan</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col {...col2}>
              <Form.Item name="employmentStatus" label="Employment Status">
                <Select mode="multiple" size="large">
                  <Option value="Salaried">Salaried</Option>
                  <Option value="Self-Employed">Self-Employed</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col {...col2}>
              <Form.Item name="residencyStatus" label="Residency Status">
                <Select mode="multiple" size="large">
                  <Option value="UAE National">UAE National</Option>
                  <Option value="UAE Resident">UAE Resident</Option>
                  <Option value="Non-Resident">Non-Resident</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col {...col2}>
              <Form.Item name="salaryTransfer" label="Salary Transfer">
                <Select size="large">
                  <Option value="STL">STL (Salary Transfer)</Option>
                  <Option value="NSTL">NSTL (Non-Salary Transfer)</Option>
                  <Option value="Both">Both</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col {...col3}>
              <Form.Item name="minSalary" label="Min Salary (AED)">
                <InputNumber style={{ width: '100%' }} min={0} size="large" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </div>

      {/* TAB 3: Rates & Loan */}
      <div style={{ display: editSection === '3' ? 'block' : 'none' }}>
        <Card bordered={false} style={{ borderRadius: 14, border: '1px solid #f0e8ff', marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col {...col3}><Form.Item name="rateType" label="Rate Type" rules={[{ required: true }]}><Select size="large"><Option value="Fixed">Fixed</Option><Option value="Variable">Variable</Option></Select></Form.Item></Col>
            <Col {...col3}><Form.Item name="minimumFloorRate" label="Min Floor Rate (%)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} step={0.01} size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name="interestRate" label="Interest Rate (Display)" rules={[{ required: true }]}><Input placeholder="e.g. 3.99%" size="large" /></Form.Item></Col>
            <Col {...col2}><Form.Item name="followOnRate" label="Follow-On Rate"><Input placeholder="e.g. EIBOR + 1.50%" size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name={['ltv', 'min']} label="Min LTV (%)"><InputNumber style={{ width: '100%' }} min={0} max={100} size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name={['ltv', 'max']} label="Max LTV (%)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} max={100} size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name="minLoanAmount" label="Min Loan (AED)"><InputNumber style={{ width: '100%' }} min={0} size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name="maxLoanAmount" label="Max Loan (AED)"><InputNumber style={{ width: '100%' }} min={0} size="large" /></Form.Item></Col>
          </Row>
        </Card>
      </div>

      {/* TAB 4: Fees */}
      <div style={{ display: editSection === '4' ? 'block' : 'none' }}>
        <Card bordered={false} style={{ borderRadius: 14, border: '1px solid #f0e8ff', marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col {...col3}><Form.Item name="bankFees" label="Bank Fees (AED)"><InputNumber style={{ width: '100%' }} min={0} size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name="propertyValuationFee" label="Valuation Fee (AED)"><InputNumber style={{ width: '100%' }} min={0} size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name="minimumBankProcessingFee" label="Min Processing Fee (AED)"><InputNumber style={{ width: '100%' }} min={0} size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name="bankPreApprovalFee" label="Pre-Approval Fee (AED)"><InputNumber style={{ width: '100%' }} min={0} size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name="isBankPreApprovalFeeFree" label="Pre-Approval Free?" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col {...col3}><Form.Item name="buyoutFee" label="Buyout Fee (AED)"><InputNumber style={{ width: '100%' }} min={0} size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name="isBuyoutFeeNA" label="Buyout Fee N/A?" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
        </Card>
      </div>

      {/* TAB 5: Insurance */}
      <div style={{ display: editSection === '5' ? 'block' : 'none' }}>
        <Card bordered={false} style={{ borderRadius: 14, border: '1px solid #f0e8ff', marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col {...col3}><Form.Item name={['propertyInsurance', 'value']} label="Property Insurance (AED)"><InputNumber style={{ width: '100%' }} min={0} size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name={['propertyInsurance', 'frequency']} label="Frequency"><Select size="large"><Option value="pa">Per Annum (pa)</Option><Option value="pm">Per Month (pm)</Option></Select></Form.Item></Col>
            <Col span={24}><Divider /></Col>
            <Col {...col3}><Form.Item name={['lifeInsurance', 'value']} label="Life Insurance (AED)"><InputNumber style={{ width: '100%' }} min={0} size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name={['lifeInsurance', 'frequency']} label="Frequency"><Select size="large"><Option value="pa">Per Annum (pa)</Option><Option value="pm">Per Month (pm)</Option></Select></Form.Item></Col>
          </Row>
        </Card>
      </div>

      {/* TAB 6: Features */}
      <div style={{ display: editSection === '6' ? 'block' : 'none' }}>
        <Card bordered={false} style={{ borderRadius: 14, border: '1px solid #f0e8ff', marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={24}><Form.Item name="keyFeatures" label="Key Features"><Select mode="tags" placeholder="Add key features" size="large" /></Form.Item></Col>
            <Col {...col3}><Form.Item name={['productValidity', 'doesNotExpire']} label="Does Not Expire?" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col {...col3}>
              <Form.Item noStyle shouldUpdate={(p, c) => p.productValidity?.doesNotExpire !== c.productValidity?.doesNotExpire}>
                {({ getFieldValue }) => !getFieldValue(['productValidity', 'doesNotExpire']) && (
                  <Form.Item name={['productValidity', 'expiryDate']} label="Expiry Date" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} size="large" />
                  </Form.Item>
                )}
              </Form.Item>
            </Col>
            <Col {...col3}><Form.Item name="isFeatured" label="Featured?" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col {...col3}><Form.Item name="isPopular" label="Popular?" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
        </Card>
      </div>

      {/* Footer */}
      <Card bordered={false} style={{ borderRadius: 14, border: '1px solid #f0e8ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Button onClick={() => { prefillForm(product); setMainTab('view'); }} size="large" icon={<EyeOutlined />}>
            Cancel
          </Button>
          <Button
            type="primary" htmlType="submit" loading={saveLoading} size="large" icon={<SaveOutlined />}
            style={{ background: GRADIENT, border: 'none', borderRadius: 8, minWidth: 180, fontWeight: 700 }}
          >
            Update Product
          </Button>
        </div>
      </Card>
    </Form>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  const statusColor2 = product.status === 'Active' ? '#10b981' : product.status === 'Archived' ? '#6366f1' : '#94a3b8';

  return (
    <div style={{ background: '#f5f3ff', minHeight: '100vh', paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ background: GRADIENT, padding: '28px 32px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(backUrl)}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8 }}>
            Back
          </Button>
          <Popconfirm
            title="Delete this product?"
            description="This action cannot be undone."
            onConfirm={handleDelete}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
          >
            <Button danger ghost icon={<DeleteOutlined />}
              style={{ borderColor: 'rgba(255,100,100,0.5)', color: '#fca5a5', background: 'rgba(239,68,68,0.1)' }}>
              Delete
            </Button>
          </Popconfirm>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <Avatar src={bank.logo} icon={<BankOutlined />} shape="square" size={72}
            style={{ borderRadius: 16, border: '3px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>
              {product.productName}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              {bank.bankName}{bank.bankCode ? ` • ${bank.bankCode}` : ''}
            </Text>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag style={{ background: statusColor2, border: 'none', color: '#fff', borderRadius: 20, fontWeight: 700, padding: '2px 12px' }}>{product.status}</Tag>
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

      {/* Main Tabs */}
      <div style={{ padding: '24px 24px 0' }}>
        <Tabs
          activeKey={mainTab}
          onChange={setMainTab}
          size="large"
          style={{ marginBottom: 20 }}
          tabBarStyle={{ background: '#fff', padding: '0 16px', borderRadius: 14, boxShadow: '0 2px 8px rgba(92,3,155,0.07)', marginBottom: 0 }}
          items={[
            { key: 'view', label: <span style={{ fontWeight: 600 }}><EyeOutlined style={{ marginRight: 6 }} />View Details</span> },
            { key: 'edit', label: <span style={{ fontWeight: 600 }}><EditOutlined style={{ marginRight: 6 }} />Edit Product</span> },
          ]}
        />
        <div style={{ paddingTop: 20 }}>
          {mainTab === 'view' ? <ViewContent /> : <EditContent />}
        </div>
      </div>
    </div>
  );
};

export default Bankproductview;
