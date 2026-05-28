import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from '@/api/apiService';
import {
  Form, Input, Button, Card, Row, Col, Typography,
  message, Modal, Alert, Select, Divider, Tag, Avatar, Grid,
} from 'antd';
import { Country } from 'country-state-city';
import {
  UserOutlined, MailOutlined, SaveOutlined, CheckOutlined,
  EyeOutlined, PhoneOutlined, HomeOutlined, CalendarOutlined,
  FileTextOutlined, GlobalOutlined, ArrowRightOutlined,
  CheckCircleFilled, SafetyOutlined, SendOutlined,
} from '@ant-design/icons';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const PRIMARY  = '#5C039B';
const GRADIENT = 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)';

const RESIDENCY_OPTIONS = ['UAE National', 'UAE Resident', 'Non-Resident'];
const EMPLOYMENT_STATUSES = ['Salaried', 'Self-Employed'];
const TRANSACTION_TYPES = [
  'Primary - Residential', 'Primary - Commercial',
  'Buyout', 'Equity', 'Buyout + Equity', 'Off-plan',
];
const APPROX_PROPERTY_VALUES = ['<1M', '1-2M', '2-5M', '5-10M', '10M+'];
const TIMELINE_OPTIONS = ['Immediately', '1-3 months', '3-6 months', 'More than 6 months'];

/* ── Small helpers ── */
const FieldLabel = ({ required, children }) => (
  <span>
    {children}
    {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
  </span>
);

const PreviewRow = ({ icon, label, value, accent }) => {
  if (!value && value !== false) return null;
  const display = value === true ? 'Yes' : value === false ? 'No' : value;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: accent || PRIMARY, fontSize: 13, marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <Text style={{ fontSize: 12, color: '#64748b', flexShrink: 0, minWidth: 110 }}>{label}</Text>
      <Text strong style={{ fontSize: 13, color: '#1e293b', wordBreak: 'break-word' }}>{display}</Text>
    </div>
  );
};

/* ─────────────────────────── MAIN ─────────────────────────── */
const VaultCreateLeads = () => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [formValues, setFormValues] = useState(null);
  const [residencyStatus, setResidencyStatus] = useState(null);
  const [liveValues, setLiveValues] = useState({});
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const rawRole = user?.role;
  const roleCode = rawRole ? (typeof rawRole === 'object' ? String(rawRole.code) : String(rawRole)) : null;
  const isAdminCreate = roleCode === '18';
  const isPartnerCreate = location.pathname.includes('/vaultpartner/leads/partner/create');

  const nationalityOptions = useMemo(() =>
    Country.getAllCountries()
      .map(c => ({ label: c.name, value: c.name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  []);

  const handleResidencyChange = (value) => {
    setResidencyStatus(value);
    if (value === 'UAE National') {
      form.setFieldsValue({ nationality: 'UAE' });
      setLiveValues(prev => ({ ...prev, residencyStatus: value, nationality: 'UAE' }));
    } else {
      form.setFieldsValue({ nationality: undefined });
      setLiveValues(prev => ({ ...prev, residencyStatus: value, nationality: undefined }));
    }
  };

  const handleValuesChange = (_, all) => setLiveValues(all);

  const validateMobile = (_, value) => {
    const cleaned = String(value || '').replace(/\D/g, '');
    if (!cleaned) return Promise.reject(new Error('Mobile number is required'));
    if (cleaned.length < 9 || cleaned.length > 12)
      return Promise.reject(new Error('Please enter a valid mobile number'));
    return Promise.resolve();
  };

  const handlePreview = async () => {
    try {
      await form.validateFields();
      setFormValues(form.getFieldsValue(true));
      setConfirmOpen(true);
    } catch {
      message.error('Please fill all required fields');
    }
  };

  const handleSubmit = async () => {
    if (!formValues) return;
    setLoading(true);
    try {
      const cleaned = (formValues.mobileNumber || '').replace(/\D/g, '');
      const mobileNumber = cleaned.slice(-9);

      const payload = {
        customerInfo: {
          firstName:        formValues.firstName,
          lastName:         formValues.lastName,
          countryCode:      '+971',
          mobileNumber,
          email:            formValues.email    || null,
          residencyStatus:  formValues.residencyStatus || null,
          nationality:      formValues.nationality     || null,
          employmentStatus: formValues.employmentStatus || null,
        },
        propertyDetails: {
          transactionType:    formValues.transactionType    || null,
          propertyFound:      formValues.propertyFound === true,
          approxPropertyValue: formValues.propertyFound === true ? (formValues.approxPropertyValue || null) : null,
        },
        loanRequirements: {
          timeline: formValues.timeline || null,
        },
        notesToXoto: formValues.notesToXoto || null,
      };

      const endpoint = isPartnerCreate
        ? 'vault/lead/partner/create'
        : isAdminCreate
          ? '/vault/lead/admin/create'
          : '/vault/lead/create';
      const res = await apiService.post(endpoint, payload);
      if (res?.success || res?.data) {
        setConfirmOpen(false);
        setSuccessOpen(true);
        form.resetFields();
        setResidencyStatus(null);
        setLiveValues({});
        setFormValues(null);
      } else {
        message.error(res?.message || 'Failed to create lead');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  /* ── Section header ── */
  const SectionHead = ({ icon, title, sub }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${PRIMARY}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PRIMARY, fontSize: 17, flexShrink: 0 }}>{icon}</div>
      <div>
        <Text style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', display: 'block' }}>{title}</Text>
        {sub && <Text type="secondary" style={{ fontSize: 12 }}>{sub}</Text>}
      </div>
    </div>
  );

  /* ── Live preview card ── */
  const LivePreview = () => {
    const v = liveValues;
    const hasAny = Object.values(v).some(x => x !== undefined && x !== null && x !== '');
    const fullName = [v.firstName, v.lastName].filter(Boolean).join(' ');

    return (
      <div style={{ position: screens.xl ? 'sticky' : 'static', top: 24 }}>
        <Card
          bordered={false}
          style={{ borderRadius: 16, border: '1px solid #f0e8ff', boxShadow: '0 4px 20px rgba(92,3,155,0.08)' }}
          bodyStyle={{ padding: 0 }}
        >
          {/* Preview header */}
          <div style={{ background: GRADIENT, borderRadius: '16px 16px 0 0', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar size={48} icon={<UserOutlined />} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', color: '#fff', fontSize: 20 }} />
              <div>
                <Text style={{ fontWeight: 800, fontSize: 17, color: '#fff', display: 'block', lineHeight: 1.2 }}>
                  {fullName || 'New Lead'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                  {v.mobileNumber ? `+971 ${(v.mobileNumber || '').replace(/\D/g, '').slice(-9)}` : 'Live Preview'}
                </Text>
              </div>
            </div>
            {(v.residencyStatus || v.employmentStatus) && (
              <div style={{ marginTop: 12, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {v.residencyStatus && <Tag style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 20, padding: '1px 10px', fontSize: 11, fontWeight: 600 }}>{v.residencyStatus}</Tag>}
                {v.employmentStatus && <Tag style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 20, padding: '1px 10px', fontSize: 11, fontWeight: 600 }}>{v.employmentStatus}</Tag>}
              </div>
            )}
          </div>

          <div style={{ padding: '18px 22px' }}>
            {!hasAny ? (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <FileTextOutlined style={{ fontSize: 36, color: '#cbd5e1', marginBottom: 10 }} />
                <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>Start filling the form to see a live preview here.</Text>
              </div>
            ) : (
              <>
                {/* Contact */}
                {(v.email || v.firstName || v.lastName) && (
                  <>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8 }}>Contact</Text>
                    <div style={{ marginBottom: 14 }}>
                      <PreviewRow icon={<MailOutlined />}   label="Email"       value={v.email} />
                      <PreviewRow icon={<GlobalOutlined />} label="Nationality" value={v.nationality} />
                    </div>
                  </>
                )}

                {/* Property */}
                {(v.transactionType || v.propertyFound !== undefined || v.approxPropertyValue) && (
                  <>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8 }}>Property</Text>
                    <div style={{ marginBottom: 14 }}>
                      <PreviewRow icon={<HomeOutlined />}    label="Transaction"      value={v.transactionType} />
                      <PreviewRow icon={<CheckOutlined />}   label="Property Found"   value={v.propertyFound} />
                      <PreviewRow icon={<HomeOutlined />}    label="Approx Value"     value={v.approxPropertyValue} accent="#0ea5e9" />
                    </div>
                  </>
                )}

                {/* Loan */}
                {v.timeline && (
                  <>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8 }}>Loan</Text>
                    <div style={{ marginBottom: 14 }}>
                      <PreviewRow icon={<CalendarOutlined />} label="Timeline" value={v.timeline} accent="#10b981" />
                    </div>
                  </>
                )}

                {/* Notes */}
                {v.notesToXoto && (
                  <>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8 }}>Notes</Text>
                    <div style={{ background: '#faf5ff', borderRadius: 9, padding: '10px 12px', marginTop: 6, fontSize: 13, color: '#374151', border: '1px solid #f0e8ff', lineHeight: 1.5 }}>
                      {v.notesToXoto}
                    </div>
                  </>
                )}

                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<EyeOutlined />}
                  onClick={handlePreview}
                  style={{ background: GRADIENT, border: 'none', borderRadius: 10, fontWeight: 700, marginTop: 16, height: 46 }}
                >
                  Preview & Submit
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  };

  /* ── Confirm Modal ── */
  const ConfirmModal = () => {
    if (!formValues) return null;
    const v = formValues;
    const fullName = [v.firstName, v.lastName].filter(Boolean).join(' ');
    const mobile = (v.mobileNumber || '').replace(/\D/g, '').slice(-9);

    const Section = ({ title, rows }) => (
      <div style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: 700, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 10 }}>{title}</Text>
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
          {rows.filter(r => r.value !== undefined && r.value !== null && r.value !== '').map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < rows.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>{r.label}</Text>
              <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
                {r.value === true ? 'Yes' : r.value === false ? 'No' : r.value}
              </Text>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <Modal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        width={620}
        footer={null}
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `${PRIMARY}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PRIMARY }}>
              <EyeOutlined style={{ fontSize: 16 }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>Confirm Lead Submission</span>
          </div>
        }
      >
        <Alert
          message={`You're about to submit a lead for ${fullName}`}
          description="Please review the details below before confirming. Once submitted, the lead will be queued for advisor assignment."
          type="info" showIcon
          style={{ borderRadius: 10, marginBottom: 18, marginTop: 4 }}
        />

        <Section title="Customer Information" rows={[
          { label: 'Full Name',         value: fullName },
          { label: 'Mobile',            value: `+971 ${mobile}` },
          { label: 'Email',             value: v.email },
          { label: 'Residency Status',  value: v.residencyStatus },
          { label: 'Nationality',       value: v.nationality },
          { label: 'Employment Status', value: v.employmentStatus },
        ]} />

        <Section title="Property Details" rows={[
          { label: 'Transaction Type',    value: v.transactionType },
          { label: 'Property Found',      value: v.propertyFound },
          { label: 'Approx Property Value', value: v.propertyFound === true ? v.approxPropertyValue : null },
        ]} />

        <Section title="Loan Requirements" rows={[
          { label: 'Timeline', value: v.timeline },
        ]} />

        {v.notesToXoto && (
          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: 700, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 10 }}>Notes to Xoto</Text>
            <div style={{ background: '#faf5ff', borderRadius: 10, padding: '12px 14px', border: '1px solid #f0e8ff', fontSize: 13, color: '#374151' }}>{v.notesToXoto}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <Button onClick={() => setConfirmOpen(false)} style={{ borderRadius: 8 }}>Edit Details</Button>
          <Button
            type="primary" icon={<SendOutlined />} loading={loading} onClick={handleSubmit}
            style={{ background: GRADIENT, border: 'none', borderRadius: 8, fontWeight: 700, minWidth: 170 }}
          >
            Confirm & Submit Lead
          </Button>
        </div>
      </Modal>
    );
  };

  /* ── Success Modal ── */
  const SuccessModal = () => (
    <Modal open={successOpen} onCancel={() => setSuccessOpen(false)} footer={null} centered width={420}>
      <div style={{ textAlign: 'center', padding: '24px 16px' }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <CheckCircleFilled style={{ fontSize: 38, color: '#10b981' }} />
        </div>
        <Title level={3} style={{ color: '#1e293b', marginBottom: 8 }}>Lead Submitted!</Title>
        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 20 }}>
          The lead has been successfully created and queued for advisor assignment.
        </Text>
        <Button
          type="primary" block size="large" onClick={() => setSuccessOpen(false)}
          style={{ background: GRADIENT, border: 'none', borderRadius: 10, fontWeight: 700, height: 46 }}
        >
          Create Another Lead
        </Button>
      </div>
    </Modal>
  );

  /* ─────────────── RENDER ─────────────── */
  return (
    <div style={{ background: '#f5f3ff', minHeight: '100vh', paddingBottom: 48 }}>

      {/* Page Header */}
      <div style={{ background: GRADIENT, padding: screens.md ? '28px 32px 36px' : '20px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '35%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>Create New Lead</Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>Submit a mortgage referral — required fields marked with *</Text>
          </div>
        </div>
      </div>

      <div style={{ padding: screens.md ? '28px 32px 0' : '16px 16px 0', marginTop: -16, maxWidth: 1300, margin: '-16px auto 0' }}>
        <Row gutter={[24, 24]}>

          {/* ── LEFT: Form ── */}
          <Col xs={24} xl={15}>
            <Form
              form={form}
              layout="vertical"
              onValuesChange={handleValuesChange}
              scrollToFirstError
            >

              {/* Section 1: Customer Information */}
              <Card bordered={false} style={{ borderRadius: 16, border: '1px solid #f0e8ff', boxShadow: '0 2px 14px rgba(92,3,155,0.07)', marginBottom: 20 }}>
                <SectionHead icon={<UserOutlined />} title="Customer Information" sub="Required: name and mobile number" />
                <Row gutter={[20, 4]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="firstName" label={<FieldLabel required>First Name</FieldLabel>} rules={[{ required: true, message: 'First name is required' }]}>
                      <Input size="large" placeholder="Ahmed" prefix={<UserOutlined style={{ color: '#cbd5e1' }} />} style={{ borderRadius: 9 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="lastName" label={<FieldLabel required>Last Name</FieldLabel>} rules={[{ required: true, message: 'Last name is required' }]}>
                      <Input size="large" placeholder="Khan" prefix={<UserOutlined style={{ color: '#cbd5e1' }} />} style={{ borderRadius: 9 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="mobileNumber" label={<FieldLabel required>Mobile Number</FieldLabel>} rules={[{ validator: validateMobile }]}>
                      <PhoneInput
                        country="ae"
                        preferredCountries={['ae', 'sa', 'in', 'pk']}
                        enableSearch
                        placeholder="50 123 4567"
                        inputStyle={{ width: '100%', height: 40, borderRadius: 9, fontSize: 14 }}
                        containerStyle={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="email" label="Email Address">
                      <Input size="large" placeholder="customer@email.com" prefix={<MailOutlined style={{ color: '#cbd5e1' }} />} style={{ borderRadius: 9 }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Section 2: Residency & Employment */}
              <Card bordered={false} style={{ borderRadius: 16, border: '1px solid #f0e8ff', boxShadow: '0 2px 14px rgba(92,3,155,0.07)', marginBottom: 20 }}>
                <SectionHead icon={<SafetyOutlined />} title="Residency & Employment" sub="Nationality required for residents and non-residents" />
                <Row gutter={[20, 4]}>
                  <Col xs={24} md={8}>
                    <Form.Item name="residencyStatus" label="Residency Status">
                      <Select size="large" placeholder="Select residency" style={{ borderRadius: 9 }} onChange={handleResidencyChange} allowClear>
                        {RESIDENCY_OPTIONS.map(s => <Option key={s} value={s}>{s}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="nationality"
                      label="Nationality"
                      rules={[{
                        required: residencyStatus === 'UAE Resident' || residencyStatus === 'Non-Resident',
                        message: 'Nationality required for residents/non-residents',
                      }]}
                    >
                      <Select
                        size="large"
                        showSearch
                        placeholder={residencyStatus === 'UAE National' ? 'Auto-set: UAE' : 'Select nationality'}
                        optionFilterProp="label"
                        options={nationalityOptions}
                        disabled={residencyStatus === 'UAE National'}
                        style={{ borderRadius: 9 }}
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="employmentStatus" label="Employment Status">
                      <Select size="large" placeholder="Select employment" style={{ borderRadius: 9 }} allowClear>
                        {EMPLOYMENT_STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Section 3: Property Details */}
              <Card bordered={false} style={{ borderRadius: 16, border: '1px solid #f0e8ff', boxShadow: '0 2px 14px rgba(92,3,155,0.07)', marginBottom: 20 }}>
                <SectionHead icon={<HomeOutlined />} title="Property Details" sub="Property value required only if property is found" />
                <Row gutter={[20, 4]}>
                  <Col xs={24} md={8}>
                    <Form.Item name="transactionType" label="Transaction Type">
                      <Select size="large" placeholder="Select type" style={{ borderRadius: 9 }} allowClear>
                        {TRANSACTION_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="propertyFound" label="Property Found?">
                      <Select size="large" placeholder="Yes / No" style={{ borderRadius: 9 }} allowClear>
                        <Option value={true}>Yes</Option>
                        <Option value={false}>No</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="approxPropertyValue"
                      label="Approx Property Value"
                      dependencies={['propertyFound']}
                      rules={[({
                        getFieldValue,
                      }) => ({
                        required: getFieldValue('propertyFound') === true,
                        message: 'Required when property is found',
                      })]}
                    >
                      <Select size="large" placeholder="Select range" style={{ borderRadius: 9 }} allowClear>
                        {APPROX_PROPERTY_VALUES.map(v => <Option key={v} value={v}>{v}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Section 4: Loan Requirements & Notes */}
              <Card bordered={false} style={{ borderRadius: 16, border: '1px solid #f0e8ff', boxShadow: '0 2px 14px rgba(92,3,155,0.07)', marginBottom: 20 }}>
                <SectionHead icon={<CalendarOutlined />} title="Loan Requirements & Notes" />
                <Row gutter={[20, 4]}>
                  <Col xs={24} md={10}>
                    <Form.Item name="timeline" label="Purchase Timeline">
                      <Select size="large" placeholder="When do they plan to buy?" style={{ borderRadius: 9 }} allowClear>
                        {TIMELINE_OPTIONS.map(t => <Option key={t} value={t}>{t}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="notesToXoto" label="Notes to Xoto">
                      <TextArea
                        rows={3}
                        placeholder="e.g. Customer interested in villa mortgage, prefers fixed rate..."
                        style={{ borderRadius: 9 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider style={{ margin: '8px 0 16px' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <Button size="large" onClick={() => { form.resetFields(); setResidencyStatus(null); setLiveValues({}); }} style={{ borderRadius: 9 }}>
                    Reset
                  </Button>
                  <Button
                    type="primary" size="large" icon={<EyeOutlined />} onClick={handlePreview}
                    style={{ background: GRADIENT, border: 'none', borderRadius: 9, fontWeight: 700, minWidth: 160, height: 44 }}
                  >
                    Preview & Submit <ArrowRightOutlined />
                  </Button>
                </div>
              </Card>

            </Form>
          </Col>

          {/* ── RIGHT: Live Preview ── */}
          <Col xs={24} xl={9}>
            <LivePreview />
          </Col>
        </Row>
      </div>

      <ConfirmModal />
      <SuccessModal />
    </div>
  );
};

export default VaultCreateLeads;
