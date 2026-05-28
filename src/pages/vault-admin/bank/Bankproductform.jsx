import React, { useState, useEffect } from 'react';
import { apiService } from '@/api/apiService';
import {
  Button, Form, Input, InputNumber, Select, Row, Col, Divider,
  Typography, Card, Space, Switch, notification, message, Tooltip,
  DatePicker, Avatar, Badge,
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined,
  BankOutlined, FileTextOutlined, DollarOutlined,
  SafetyCertificateOutlined, TeamOutlined, FileSearchOutlined,
  CheckCircleFilled, RightOutlined, LeftOutlined, WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const PRIMARY = '#5C039B';
const GRADIENT = 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)';

const TABS = [
  { key: '1', label: 'Basic Info', icon: <BankOutlined /> },
  { key: '2', label: 'Eligibility', icon: <TeamOutlined /> },
  { key: '3', label: 'Rates & Loan', icon: <DollarOutlined /> },
  { key: '4', label: 'Fees & Costs', icon: <FileTextOutlined /> },
  { key: '5', label: 'Insurance', icon: <SafetyCertificateOutlined /> },
  { key: '6', label: 'Features', icon: <FileSearchOutlined /> },
];

const cardStyle = {
  borderRadius: 14,
  boxShadow: '0 2px 12px rgba(92,3,155,0.07)',
  marginBottom: 18,
  border: '1px solid #f0e8ff',
};
const sectionStyle = { borderColor: PRIMARY, marginTop: 8, marginBottom: 4 };
const col3 = { xs: 24, sm: 12, md: 8, lg: 8 };
const col2 = { xs: 24, sm: 24, md: 12, lg: 12 };

const BankProductForm = ({ mode = 'create', editData = null, initialBankId = null, onBack, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);

  const isEdit = mode === 'edit' && editData;
  const isView = mode === 'view' && editData;

  /* watch required fields */
  const watchBank         = Form.useWatch('bank',             form);
  const watchProductName  = Form.useWatch('productName',      form);
  const watchMortgageType = Form.useWatch('mortgageType',     form);
  const watchRateType     = Form.useWatch('rateType',         form);
  const watchFloorRate    = Form.useWatch('minimumFloorRate', form);
  const watchInterestRate = Form.useWatch('interestRate',     form);
  const watchLtvMax       = Form.useWatch(['ltv', 'max'],     form);

  const canSubmit = !isView && (
    !!watchBank &&
    !!watchProductName?.trim() &&
    !!watchMortgageType &&
    !!watchRateType &&
    watchFloorRate != null && watchFloorRate !== '' &&
    !!watchInterestRate?.trim() &&
    watchLtvMax != null && watchLtvMax !== ''
  );

  const missingLabel =
    !watchBank            ? 'Bank is required (Tab 1)'            :
    !watchProductName?.trim() ? 'Product Name is required (Tab 1)':
    !watchMortgageType    ? 'Mortgage Type is required (Tab 1)'   :
    !watchRateType        ? 'Rate Type is required (Tab 3)'       :
    watchFloorRate == null ? 'Min Floor Rate is required (Tab 3)' :
    !watchInterestRate?.trim() ? 'Interest Rate is required (Tab 3)':
    watchLtvMax == null   ? 'Max LTV is required (Tab 3)'         : '';

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await apiService.get('bank');
        const list = res?.data || res || [];
        const bankList = Array.isArray(list) ? list : [];
        setBanks(bankList);
        if (initialBankId && !editData) {
          form.setFieldValue('bank', initialBankId);
          const found = bankList.find((b) => b._id === initialBankId);
          if (found) setSelectedBank(found);
        }
      } catch (err) {
        console.error('Failed to load banks.', err);
      }
    };
    fetchBanks();
  }, [initialBankId]);

  useEffect(() => {
    if ((isEdit || isView) && editData) {
      const formattedData = {
        ...editData,
        productValidity: {
          ...editData.productValidity,
          expiryDate: editData.productValidity?.expiryDate ? dayjs(editData.productValidity.expiryDate) : null,
        },
        bank: editData.bank?._id || editData.bank,
      };
      form.setFieldsValue(formattedData);
      if (editData.bank) {
        setSelectedBank(editData.bank);
      }
    }
  }, [editData, isEdit, isView, form]);

  const handleBankSelection = (bankId) => {
    const bank = banks.find((item) => item._id === bankId);
    setSelectedBank(bank || null);
  };

  const handleSave = async (values) => {
    if (loading) return;
    setLoading(true);
    try {
      const payload = {
        ...values,
        productValidity: {
          ...values.productValidity,
          expiryDate: values.productValidity?.doesNotExpire ? null : values.productValidity?.expiryDate,
        },
      };

      if (isEdit) {
        await apiService.put(`bank/products/${editData._id}`, payload);
        notification.success({ message: 'Product Updated!', description: 'Changes saved successfully.' });
      } else {
        await apiService.post('bank/products', payload);
        notification.success({ message: 'Product Created!', description: 'New product added to library.' });
      }
      onSuccess && onSuccess();
    } catch (err) {
      notification.error({ message: 'Operation Failed', description: err.response?.data?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const activeIdx = TABS.findIndex((t) => t.key === activeTab);

  const goNext = async () => {
    if (activeTab === '1') {
      try {
        await form.validateFields(['bank', 'productName', 'mortgageType']);
      } catch {
        return;
      }
    }
    if (activeTab === '3') {
      try {
        await form.validateFields(['rateType', 'minimumFloorRate', 'interestRate', ['ltv', 'max']]);
      } catch {
        return;
      }
    }
    setActiveTab(TABS[Math.min(activeIdx + 1, TABS.length - 1)].key);
  };

  const goPrev = () => setActiveTab(TABS[Math.max(activeIdx - 1, 0)].key);

  return (
    <div style={{ background: '#f5f3ff', minHeight: '100vh', paddingBottom: 40 }}>
      <div style={{ background: GRADIENT, padding: '28px 32px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8 }}>Back</Button>
        <Avatar src={selectedBank?.logo} icon={<BankOutlined />} size={54} shape="square" style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', borderRadius: 12, fontSize: 22, color: '#fff' }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <Title level={3} style={{ margin: 0, color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>
            {isView ? `View: ${editData?.productName}` : isEdit ? `Edit: ${editData?.productName}` : 'Add New Bank Product'}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{selectedBank ? selectedBank.bankName : 'Select a bank and fill details'}</Text>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', textAlign: 'center', minWidth: 90 }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{activeTab}<span style={{ fontSize: 14, fontWeight: 400 }}>/6</span></div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Steps</div>
        </div>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid #ede9ff', padding: '0 24px', overflowX: 'auto', display: 'flex' }}>
        {TABS.map((tab, idx) => {
          const isActive = tab.key === activeTab;
          const isDone = parseInt(tab.key) < parseInt(activeTab);
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: isActive ? `3px solid ${PRIMARY}` : '3px solid transparent', color: isActive ? PRIMARY : isDone ? '#10b981' : '#9ca3af', fontWeight: isActive ? 700 : 500, fontSize: 13, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: isActive ? PRIMARY : isDone ? '#10b981' : '#e5e7eb', color: isActive || isDone ? '#fff' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{isDone ? <CheckCircleFilled style={{ fontSize: 14 }} /> : idx + 1}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '24px 24px 0' }}>
        <Form form={form} layout="vertical" onFinish={handleSave} disabled={isView} initialValues={{ status: 'Active', mortgageType: 'Conventional', rateType: 'Fixed', salaryTransfer: 'Both', productValidity: { doesNotExpire: true }, ltv: { min: 0, max: 80 } }} scrollToFirstError>
          
          {/* TAB 1: Basic Info */}
          <div style={{ display: activeTab === '1' ? 'block' : 'none' }}>
            <Card bordered={false} style={cardStyle}>
              <Divider orientation="left" style={sectionStyle}><Space><BankOutlined style={{ color: PRIMARY }} /><Text strong>Product Identification</Text></Space></Divider>
              <Row gutter={[16, 8]}>
                <Col {...col3}>
                  <Form.Item name="bank" label="Bank" rules={[{ required: true }]}>
                    <Select showSearch placeholder="Select Bank" optionFilterProp="label" onChange={handleBankSelection} size="large">
                      {banks.map(b => <Option key={b._id} value={b._id} label={b.bankName}>{b.bankName} ({b.bankCode})</Option>)}
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
                    <Input.TextArea rows={3} placeholder="Product description..." />
                  </Form.Item>
                </Col>
                <Col {...col3}>
                  <Form.Item name="mortgageType" label="Mortgage Type" rules={[{ required: true }]}>
                    <Select size="large"><Option value="Islamic">Islamic</Option><Option value="Conventional">Conventional</Option></Select>
                  </Form.Item>
                </Col>
                <Col {...col3}>
                  <Form.Item name="status" label="Status">
                    <Select size="large"><Option value="Active">Active</Option><Option value="Inactive">Inactive</Option><Option value="Archived">Archived</Option><Option value="Expired">Expired</Option></Select>
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
          <div style={{ display: activeTab === '2' ? 'block' : 'none' }}>
            <Card bordered={false} style={cardStyle}>
              <Divider orientation="left" style={sectionStyle}><Space><TeamOutlined style={{ color: PRIMARY }} /><Text strong>Eligibility Criteria</Text></Space></Divider>
              <Row gutter={[16, 8]}>
                <Col {...col2}>
                  <Form.Item name="transactionType" label="Transaction Types">
                    <Select mode="multiple" placeholder="Select Types" size="large">
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
                    <Select mode="multiple" placeholder="Select Status" size="large">
                      <Option value="Salaried">Salaried</Option>
                      <Option value="Self-Employed">Self-Employed</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col {...col2}>
                  <Form.Item name="residencyStatus" label="Residency Status">
                    <Select mode="multiple" placeholder="Select Residency" size="large">
                      <Option value="UAE National">UAE National</Option>
                      <Option value="UAE Resident">UAE Resident</Option>
                      <Option value="Non-Resident">Non-Resident</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col {...col2}>
                  <Form.Item name="salaryTransfer" label="Salary Transfer">
                    <Select size="large"><Option value="STL">STL (Salary Transfer)</Option><Option value="NSTL">NSTL (Non-Salary Transfer)</Option><Option value="Both">Both</Option></Select>
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
          <div style={{ display: activeTab === '3' ? 'block' : 'none' }}>
            <Card bordered={false} style={cardStyle}>
              <Divider orientation="left" style={sectionStyle}><Space><DollarOutlined style={{ color: PRIMARY }} /><Text strong>Rates & Loan Details</Text></Space></Divider>
              <Row gutter={[16, 8]}>
                <Col {...col3}>
                  <Form.Item name="rateType" label="Rate Type" rules={[{ required: true }]}>
                    <Select size="large"><Option value="Fixed">Fixed</Option><Option value="Variable">Variable</Option></Select>
                  </Form.Item>
                </Col>
                <Col {...col3}>
                  <Form.Item name="minimumFloorRate" label="Min Floor Rate (%)" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} step={0.01} size="large" />
                  </Form.Item>
                </Col>
                <Col {...col3}>
                  <Form.Item name="interestRate" label="Interest Rate (Display)" rules={[{ required: true }]}>
                    <Input placeholder="e.g. 3.99%" size="large" />
                  </Form.Item>
                </Col>
                <Col {...col2}>
                  <Form.Item name="followOnRate" label="Follow-On Rate">
                    <Input placeholder="e.g. EIBOR + 1.50%" size="large" />
                  </Form.Item>
                </Col>
                <Col {...col3}>
                  <Form.Item name={['ltv', 'min']} label="Min LTV (%)">
                    <InputNumber style={{ width: '100%' }} min={0} max={100} size="large" />
                  </Form.Item>
                </Col>
                <Col {...col3}>
                  <Form.Item name={['ltv', 'max']} label="Max LTV (%)" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} max={100} size="large" />
                  </Form.Item>
                </Col>
                <Col {...col3}>
                  <Form.Item name="minLoanAmount" label="Min Loan Amount (AED)">
                    <InputNumber style={{ width: '100%' }} min={0} size="large" />
                  </Form.Item>
                </Col>
                <Col {...col3}>
                  <Form.Item name="maxLoanAmount" label="Max Loan Amount (AED)">
                    <InputNumber style={{ width: '100%' }} min={0} size="large" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>

          {/* TAB 4: Fees & Costs */}
          <div style={{ display: activeTab === '4' ? 'block' : 'none' }}>
            <Card bordered={false} style={cardStyle}>
              <Divider orientation="left" style={sectionStyle}><Space><FileTextOutlined style={{ color: PRIMARY }} /><Text strong>Fees & Costs</Text></Space></Divider>
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
          <div style={{ display: activeTab === '5' ? 'block' : 'none' }}>
            <Card bordered={false} style={cardStyle}>
              <Divider orientation="left" style={sectionStyle}><Space><SafetyCertificateOutlined style={{ color: PRIMARY }} /><Text strong>Insurance Details</Text></Space></Divider>
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
          <div style={{ display: activeTab === '6' ? 'block' : 'none' }}>
            <Card bordered={false} style={cardStyle}>
              <Divider orientation="left" style={sectionStyle}><Space><FileSearchOutlined style={{ color: PRIMARY }} /><Text strong>Features & Validity</Text></Space></Divider>
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Form.Item name="keyFeatures" label="Key Features">
                    <Select mode="tags" placeholder="Add key features" size="large" />
                  </Form.Item>
                </Col>
                <Col {...col3}>
                  <Form.Item name={['productValidity', 'doesNotExpire']} label="Does Not Expire?" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col {...col3}>
                  <Form.Item noStyle shouldUpdate={(prev, curr) => prev.productValidity?.doesNotExpire !== curr.productValidity?.doesNotExpire}>
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

          <Card bordered={false} style={{ borderRadius: 14, marginTop: 8, background: '#fff', border: '1px solid #f0e8ff', boxShadow: '0 2px 12px rgba(92,3,155,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <Button onClick={goPrev} disabled={activeIdx === 0} icon={<LeftOutlined />} size="large" style={{ borderRadius: 8 }}>
                {activeIdx > 0 ? TABS[activeIdx - 1].label : 'Back'}
              </Button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {!isView && !canSubmit && (
                  <Tooltip title={missingLabel}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#ef4444', fontWeight: 600, cursor: 'help' }}>
                      <WarningOutlined /> Required fields missing
                    </span>
                  </Tooltip>
                )}

                {!isView && <Button onClick={() => form.resetFields()} size="large" disabled={loading} style={{ borderRadius: 8 }}>Reset</Button>}

                {activeIdx < TABS.length - 1 ? (
                  <Button onClick={goNext} type="primary" size="large" style={{ background: PRIMARY, borderColor: PRIMARY, borderRadius: 8, minWidth: 160 }}>
                    Next: {TABS[activeIdx + 1].label} <RightOutlined />
                  </Button>
                ) : (
                  !isView && (
                    <Tooltip title={!canSubmit ? missingLabel : ''}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        disabled={!canSubmit}
                        size="large"
                        icon={<SaveOutlined />}
                        style={{
                          background: canSubmit ? GRADIENT : undefined,
                          border: 'none',
                          borderRadius: 8,
                          minWidth: 180,
                          fontWeight: 700,
                          boxShadow: canSubmit ? '0 4px 18px rgba(92,3,155,0.35)' : 'none',
                          opacity: canSubmit ? 1 : 0.6,
                        }}
                      >
                        {isEdit ? 'Update Product' : 'Save Product'}
                      </Button>
                    </Tooltip>
                  )
                )}
              </div>
            </div>
          </Card>
        </Form>
      </div>
    </div>
  );
};

export default BankProductForm;
