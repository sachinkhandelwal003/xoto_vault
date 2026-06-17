import React, { useState, useEffect } from 'react';
import { apiService } from '@/api/apiService';
import {
  Button, Form, Input, InputNumber, Select, Row, Col, Divider,
  Typography, Card, Space, Switch, notification, Tooltip,
  DatePicker, Avatar, Checkbox,
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined,
  BankOutlined, FileTextOutlined, DollarOutlined,
  SafetyCertificateOutlined, TeamOutlined, FileSearchOutlined,
  WarningOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const PRIMARY = '#5C039B';
const GRADIENT = 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)';

const cardStyle = {
  borderRadius: 14,
  boxShadow: '0 2px 12px rgba(92,3,155,0.07)',
  marginBottom: 20,
  border: '1px solid #f0e8ff',
  background: '#ffffff',
};

const sectionStyle = { borderColor: PRIMARY, marginTop: 8, marginBottom: 12 };
const col3 = { xs: 24, sm: 12, md: 8, lg: 8 };
const col4 = { xs: 24, sm: 12, md: 6, lg: 6 };
const col2 = { xs: 24, sm: 24, md: 12, lg: 12 };

const BankProductForm = ({ mode = 'create', editData = null, initialBankId = null, onBack, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);

  const isEdit = mode === 'edit' && editData;
  const isView = mode === 'view' && editData;

  /* watch fields for conditional greying out and validation */
  const watchBank = Form.useWatch('bank', form);
  const watchProductName = Form.useWatch('productName', form);
  const watchMortgageType = Form.useWatch('mortgageType', form);
  const watchRateType = Form.useWatch('rateType', form);
  const watchFloorRate = Form.useWatch('minimumFloorRate', form);
  const watchInterestRate = Form.useWatch('interestRate', form);
  const watchLtv = Form.useWatch('ltv', form);

  const watchDoesNotExpire = Form.useWatch(['productValidity', 'doesNotExpire'], form);
  const watchIsPreApprovalFree = Form.useWatch('isBankPreApprovalFeeFree', form);
  const watchIsBuyoutNA = Form.useWatch('isBuyoutFeeNA', form);
  const watchIsEiborLinked = Form.useWatch('isEiborLinked', form);

  const canSubmit = !isView && (
    !!watchBank &&
    !!String(watchProductName ?? '').trim() &&
    !!watchMortgageType &&
    !!watchRateType &&
    !!String(watchFloorRate ?? '').trim() &&
    !!String(watchInterestRate ?? '').trim() &&
    !!String(watchLtv ?? '').trim()
  );

  const missingLabel =
    !watchBank ? 'Bank Name is required' :
    !String(watchProductName ?? '').trim() ? 'Product Name is required' :
    !watchMortgageType ? 'Mortgage Type is required' :
    !watchRateType ? 'Rate Type is required' :
    !String(watchFloorRate ?? '').trim() ? 'Min Floor Rate is required' :
    !String(watchInterestRate ?? '').trim() ? 'Interest Rate is required' :
    !String(watchLtv ?? '').trim() ? 'LTV is required' : '';

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
      let isEibor = false;
      let rawFollowOn = editData.followOnRate || '';
      if (rawFollowOn.toUpperCase().includes('EIBOR')) {
        isEibor = true;
        const match = rawFollowOn.match(/[\d.]+/);
        rawFollowOn = match ? match[0] : '';
      } else {
        const match = rawFollowOn.match(/[\d.]+/);
        rawFollowOn = match ? match[0] : rawFollowOn;
      }

      let ltvVal = editData.ltv;
      if (ltvVal && typeof ltvVal === 'object') {
        ltvVal = ltvVal.max != null ? String(ltvVal.max) : '';
      } else {
        ltvVal = String(ltvVal || '');
      }
      if (ltvVal.endsWith('%')) {
        ltvVal = ltvVal.slice(0, -1);
      }

      let intRate = String(editData.interestRate || '');
      if (intRate.endsWith('%')) intRate = intRate.slice(0, -1);

      let floorRate = String(editData.minimumFloorRate || '');
      if (floorRate.endsWith('%')) floorRate = floorRate.slice(0, -1);

      let propInsVal = String(editData.propertyInsurance?.value || '');
      if (propInsVal.endsWith('%')) propInsVal = propInsVal.slice(0, -1);

      let lifeInsVal = String(editData.lifeInsurance?.value || '');
      if (lifeInsVal.endsWith('%')) lifeInsVal = lifeInsVal.slice(0, -1);

      const formattedData = {
        ...editData,
        isEiborLinked: isEibor,
        followOnRate: rawFollowOn,
        ltv: ltvVal,
        interestRate: intRate,
        minimumFloorRate: floorRate,
        propertyInsurance: {
          ...editData.propertyInsurance,
          value: propInsVal,
        },
        lifeInsurance: {
          ...editData.lifeInsurance,
          value: lifeInsVal,
        },
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
      const isEibor = values.isEiborLinked;
      const followOnVal = String(values.followOnRate || '').trim();
      let formattedFollowOn = '';
      if (followOnVal) {
        formattedFollowOn = isEibor ? `EIBOR + ${followOnVal}%` : `${followOnVal}%`;
      }

      const payload = {
        ...values,
        followOnRate: formattedFollowOn,
        productValidity: {
          ...values.productValidity,
          expiryDate: values.productValidity?.doesNotExpire ? null : values.productValidity?.expiryDate,
        },
      };
      delete payload.isEiborLinked;

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

  return (
    <div style={{ background: '#f5f3ff', minHeight: '100vh', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: GRADIENT, padding: '28px 32px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8 }}>Back</Button>
        <Avatar src={selectedBank?.logo} icon={<BankOutlined />} size={54} shape="square" style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', borderRadius: 12, fontSize: 22, color: '#fff' }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <Title level={3} style={{ margin: 0, color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>
            {isView ? `View: ${editData?.productName}` : isEdit ? `Edit: ${editData?.productName}` : 'Add New Bank Product'}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{selectedBank ? selectedBank.bankName : 'Select a bank and fill details below'}</Text>
        </div>
      </div>

      <div style={{ padding: '24px 24px 0' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          disabled={isView}
          initialValues={{
            status: 'Active',
            mortgageType: 'Conventional',
            rateType: 'Fixed',
            salaryTransfer: 'Both',
            productValidity: { doesNotExpire: true },
            propertyInsurance: { frequency: 'pa' },
            lifeInsurance: { frequency: 'pa' }
          }}
          scrollToFirstError
        >
          {/* Card 1: Identity & Classification */}
          <Card bordered={false} style={cardStyle}>
            <Divider orientation="left" style={sectionStyle}>
              <Space><BankOutlined style={{ color: PRIMARY }} /><Text strong>Identity & Classification</Text></Space>
            </Divider>
            <Row gutter={[16, 8]}>
              <Col {...col3}>
                <Form.Item name="bank" label="Bank Name" rules={[{ required: true, message: 'Please select a bank' }]}>
                  <Select showSearch placeholder="Select Bank" optionFilterProp="label" onChange={handleBankSelection} size="large">
                    {banks.map(b => <Option key={b._id} value={b._id} label={b.bankName}>{b.bankName} ({b.bankCode})</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col {...col2}>
                <Form.Item name="productName" label="Product Name" rules={[{ required: true, message: 'Please enter product name' }]}>
                  <Input placeholder="e.g. Premium Home Mortgage" size="large" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={2} placeholder="Product description..." />
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="mortgageType" label="Mortgage Type" rules={[{ required: true, message: 'Please select mortgage type' }]}>
                  <Select size="large">
                    <Option value="Islamic">Islamic</Option>
                    <Option value="Conventional">Conventional</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="transactionType" label="Transaction Type" rules={[{ required: true, message: 'Please select at least one transaction type' }]}>
                  <Select mode="multiple" placeholder="Select Types" size="large">
                    <Option value="Primary - Residential">Primary - Residential</Option>
                    <Option value="Primary - Commercial">Primary - Commercial</Option>
                    <Option value="Buyout">Buyout</Option>
                    <Option value="Equity">Equity</Option>
                    <Option value="Buyout + Equity">Buyout + Equity</Option>
                    <Option value="Offplan">Offplan</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="employmentStatus" label="Employment Status" rules={[{ required: true, message: 'Please select employment status' }]}>
                  <Select mode="multiple" placeholder="Select Status" size="large">
                    <Option value="Salaried">Salaried</Option>
                    <Option value="Self-Employed">Self-Employed</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="residencyStatus" label="Residency Status" rules={[{ required: true, message: 'Please select residency status' }]}>
                  <Select mode="multiple" placeholder="Select Residency" size="large">
                    <Option value="UAE National">UAE National</Option>
                    <Option value="UAE Resident">UAE Resident</Option>
                    <Option value="Non-Resident">Non-Resident</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Card 2: Rates & Financials */}
          <Card bordered={false} style={cardStyle}>
            <Divider orientation="left" style={sectionStyle}>
              <Space><DollarOutlined style={{ color: PRIMARY }} /><Text strong>Rates & Financial Details</Text></Space>
            </Divider>
            <Row gutter={[16, 8]}>
              <Col {...col3}>
                <Form.Item name="rateType" label="Rate Type" rules={[{ required: true, message: 'Please select rate type' }]}>
                  <Select size="large">
                    <Option value="Fixed">Fixed</Option>
                    <Option value="Variable">Variable</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item
                  name="interestRate"
                  label={
                    <Space>
                      Interest Rate
                      <Tooltip title="Headline interest rate offered by the bank for this product, e.g. 3.99%">
                        <InfoCircleOutlined style={{ color: '#9ca3af' }} />
                      </Tooltip>
                    </Space>
                  }
                  rules={[{ required: true, message: 'Please enter interest rate' }]}
                >
                  <Input placeholder="e.g. 3.99" suffix="%" size="large" />
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item
                  name="minimumFloorRate"
                  label={
                    <Space>
                      Minimum Floor Rate
                      <Tooltip title="Lowest rate the product can fall to, regardless of EIBOR movement, e.g. 2.99%">
                        <InfoCircleOutlined style={{ color: '#9ca3af' }} />
                      </Tooltip>
                    </Space>
                  }
                  rules={[{ required: true, message: 'Please enter floor rate' }]}
                >
                  <Input placeholder="e.g. 2.99" suffix="%" size="large" />
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Space direction="vertical" style={{ width: '100%' }} size={4}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#334155', fontSize: 14 }}>
                      Follow-On Rate <Tooltip title="The rate applicable after the initial fixed period ends"><InfoCircleOutlined style={{ color: '#9ca3af' }} /></Tooltip>
                    </span>
                    <Form.Item name="isEiborLinked" valuePropName="checked" style={{ marginBottom: 0 }}>
                      <Switch checkedChildren="EIBOR" unCheckedChildren="Fixed" style={{ background: PRIMARY }} />
                    </Form.Item>
                  </div>
                  <Form.Item
                    name="followOnRate"
                    rules={[{ required: true, message: 'Please enter follow-on rate' }]}
                  >
                    <Input
                      addonBefore={watchIsEiborLinked ? "EIBOR +" : undefined}
                      suffix="%"
                      placeholder={watchIsEiborLinked ? "e.g. 1.50" : "e.g. 4.99"}
                      size="large"
                    />
                  </Form.Item>
                </Space>
              </Col>
              <Col {...col3}>
                <Form.Item
                  name="ltv"
                  label={
                    <Space>
                      LTV
                      <Tooltip title="Maximum Loan-to-Value percentage the bank will lend, e.g. 80%">
                        <InfoCircleOutlined style={{ color: '#9ca3af' }} />
                      </Tooltip>
                    </Space>
                  }
                  rules={[{ required: true, message: 'Please enter LTV percentage' }]}
                >
                  <Input placeholder="e.g. 80" suffix="%" size="large" />
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="salaryTransfer" label="Salary Transfer" rules={[{ required: true, message: 'Please select salary transfer' }]}>
                  <Select size="large">
                    <Option value="STL">STL (Salary Transfer)</Option>
                    <Option value="NSTL">NSTL (No Salary Transfer)</Option>
                    <Option value="Both">Both</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="monthlyPayment" label="Monthly Payment (AED)" rules={[{ required: true, message: 'Please enter monthly payment' }]}>
                  <Input placeholder="e.g. 5,400" size="large" />
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="overPayment" label="Over Payment (AED)" rules={[{ required: true, message: 'Please enter allowed overpayment' }]}>
                  <Input placeholder="e.g. 10% per annum" size="large" />
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="minSalary" label="Min Salary (AED)">
                  <InputNumber style={{ width: '100%' }} min={0} size="large" placeholder="e.g. 15000" />
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="minLoanAmount" label="Min Loan Amount (AED)">
                  <InputNumber style={{ width: '100%' }} min={0} size="large" placeholder="e.g. 500000" />
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="maxLoanAmount" label="Max Loan Amount (AED)">
                  <InputNumber style={{ width: '100%' }} min={0} size="large" placeholder="e.g. 10000000" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Card 3: Fees & Charges */}
          <Card bordered={false} style={cardStyle}>
            <Divider orientation="left" style={sectionStyle}>
              <Space><FileTextOutlined style={{ color: PRIMARY }} /><Text strong>Fees & Charges</Text></Space>
            </Divider>
            <Row gutter={[16, 8]}>
              <Col {...col3}>
                <Form.Item name="bankFees" label="Bank Fees (AED)" rules={[{ required: true, message: 'Please enter bank fees' }]}>
                  <Input placeholder="e.g. 1,050" size="large" />
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="propertyValuationFee" label="Property Valuation Fee (AED, incl. VAT)" rules={[{ required: true, message: 'Please enter property valuation fee' }]}>
                  <Input placeholder="e.g. 2,625 (inclusive of VAT)" size="large" />
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="minimumBankProcessingFee" label="Minimum Bank Processing Fee (AED)" rules={[{ required: true, message: 'Please enter processing fee' }]}>
                  <Input placeholder="e.g. 500" size="large" />
                </Form.Item>
              </Col>
              <Col {...col2}>
                <Space align="baseline" style={{ display: 'flex' }}>
                  <Form.Item name="bankPreApprovalFee" label="Bank Pre-Approval / Application Fee (AED)" style={{ width: 280 }} rules={[{ required: !watchIsPreApprovalFree, message: 'Please enter pre-approval fee' }]}>
                    <Input placeholder={watchIsPreApprovalFree ? "Free" : "e.g. 1,000"} size="large" disabled={watchIsPreApprovalFree} />
                  </Form.Item>
                  <Form.Item name="isBankPreApprovalFeeFree" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Checkbox style={{ marginLeft: 10 }}>Free</Checkbox>
                  </Form.Item>
                </Space>
              </Col>
              <Col {...col2}>
                <Space align="baseline" style={{ display: 'flex' }}>
                  <Form.Item name="buyoutFee" label="Buyout Fee (AED)" style={{ width: 280 }} rules={[{ required: !watchIsBuyoutNA, message: 'Please enter buyout fee' }]}>
                    <Input placeholder={watchIsBuyoutNA ? "N/A" : "e.g. 1% of loan amount"} size="large" disabled={watchIsBuyoutNA} />
                  </Form.Item>
                  <Form.Item name="isBuyoutFeeNA" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Checkbox style={{ marginLeft: 10 }}>N/A</Checkbox>
                  </Form.Item>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Card 4: Insurance, Features & Lifecycle */}
          <Card bordered={false} style={cardStyle}>
            <Divider orientation="left" style={sectionStyle}>
              <Space><SafetyCertificateOutlined style={{ color: PRIMARY }} /><Text strong>Insurance & Features</Text></Space>
            </Divider>
            <Row gutter={[16, 8]}>
              <Col {...col2}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Form.Item
                    name={['propertyInsurance', 'value']}
                    label={
                      <Space>
                        Property Insurance
                        <Tooltip title="Annual or monthly property insurance premium required by the bank in % (e.g. 0.05%)">
                          <InfoCircleOutlined style={{ color: '#9ca3af' }} />
                        </Tooltip>
                      </Space>
                    }
                    style={{ flex: 1 }}
                    rules={[{ required: true, message: 'Please enter property insurance' }]}
                  >
                    <Input placeholder="e.g. 0.05" suffix="%" size="large" />
                  </Form.Item>
                  <Form.Item name={['propertyInsurance', 'frequency']} label="Frequency" style={{ width: 150 }}>
                    <Select size="large">
                      <Option value="pa">pa (per annum)</Option>
                      <Option value="pm">pm (per month)</Option>
                    </Select>
                  </Form.Item>
                </div>
              </Col>
              <Col {...col2}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Form.Item
                    name={['lifeInsurance', 'value']}
                    label={
                      <Space>
                        Life Insurance
                        <Tooltip title="Mortgage protection life cover premium required by the bank in % (e.g. 0.02%)">
                          <InfoCircleOutlined style={{ color: '#9ca3af' }} />
                        </Tooltip>
                      </Space>
                    }
                    style={{ flex: 1 }}
                    rules={[{ required: true, message: 'Please enter life insurance' }]}
                  >
                    <Input placeholder="e.g. 0.02" suffix="%" size="large" />
                  </Form.Item>
                  <Form.Item name={['lifeInsurance', 'frequency']} label="Frequency" style={{ width: 150 }}>
                    <Select size="large">
                      <Option value="pa">pa (per annum)</Option>
                      <Option value="pm">pm (per month)</Option>
                    </Select>
                  </Form.Item>
                </div>
              </Col>
              <Col span={24}>
                <Form.Item name="keyFeatures" label="Key Features">
                  <Select mode="tags" placeholder="Press Enter to add key features" size="large" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                  <Text strong>Product Expiry & Validity</Text>
                  <Form.Item name={['productValidity', 'doesNotExpire']} valuePropName="checked" style={{ marginBottom: 8 }}>
                    <Checkbox>Does not expire</Checkbox>
                  </Form.Item>
                  <Form.Item name={['productValidity', 'expiryDate']} rules={[{ required: !watchDoesNotExpire, message: 'Expiry date is required' }]}>
                    <DatePicker style={{ width: '100%' }} size="large" disabled={watchDoesNotExpire} />
                  </Form.Item>
                </Space>
              </Col>
              <Col {...col3}>
                <Form.Item name="status" label="Active / Inactive Status" rules={[{ required: true }]}>
                  <Select size="large">
                    <Option value="Active">Active</Option>
                    <Option value="Inactive">Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col {...col3}>
                <Form.Item name="displayOrder" label="Display Order">
                  <InputNumber style={{ width: '100%' }} min={0} size="large" />
                </Form.Item>
              </Col>
              <Col {...col4}>
                <Form.Item name="isFeatured" label="Featured Product" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col {...col4}>
                <Form.Item name="isPopular" label="Popular Product" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Submit Actions Footer */}
          <Card bordered={false} style={{ borderRadius: 14, background: '#fff', border: '1px solid #f0e8ff', boxShadow: '0 2px 12px rgba(92,3,155,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <Button onClick={onBack} size="large" style={{ borderRadius: 8 }}>Cancel</Button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {!canSubmit && (
                  <Tooltip title={missingLabel}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#ef4444', fontWeight: 600, cursor: 'help' }}>
                      <WarningOutlined /> Required fields missing
                    </span>
                  </Tooltip>
                )}

                {!isView && <Button onClick={() => form.resetFields()} size="large" disabled={loading} style={{ borderRadius: 8 }}>Reset</Button>}

                {!isView && (
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
