import React, { useState, useEffect } from 'react';
import { apiService } from '@/api/apiService';
import {
  Button, Form, Input, InputNumber, Select, Row, Col, Divider,
  Typography, Card, Space, Switch, Upload, notification, message,
  Avatar,
} from 'antd';
import {
  PlusOutlined, ArrowLeftOutlined, SaveOutlined,
  BankOutlined, GlobalOutlined, MailOutlined,
  PhoneOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const PRIMARY = '#5C039B';
const GRADIENT = 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)';

const MORTGAGE_TYPES = ['Islamic', 'Conventional'];
const STATUS_OPTIONS = ['Active', 'Inactive', 'Archived'];

const cardStyle = {
  borderRadius: 14,
  boxShadow: '0 2px 12px rgba(92,3,155,0.07)',
  marginBottom: 18,
  border: '1px solid #f0e8ff',
};
const sectionStyle = { borderColor: PRIMARY, marginTop: 8, marginBottom: 4 };
const col2 = { xs: 24, sm: 24, md: 12, lg: 12 };
const col3 = { xs: 24, sm: 12, md: 8, lg: 8 };

const BankForm = ({ mode = 'create', editData = null, onBack, onSuccess }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [logoList, setLogoList] = useState([]);
  const [previewLogo, setPreviewLogo] = useState('');
  const [bankNamePreview, setBankNamePreview] = useState('');

  const isEdit = mode === 'edit' && editData;

  useEffect(() => {
    if (isEdit && editData) {
      form.setFieldsValue({
        bankName: editData.bankName,
        bankCode: editData.bankCode,
        website: editData.website,
        contactEmail: editData.contactEmail,
        contactPhone: editData.contactPhone,
        mortgageTypesSupported: editData.mortgageTypesSupported || [],
        displayOrder: editData.displayOrder ?? 1,
        status: editData.status || 'Active',
      });

      setBankNamePreview(editData.bankName || '');
      setPreviewLogo(editData.logo || '');

      if (editData.logo) {
        setLogoList([{ uid: '-1', url: editData.logo, status: 'done', name: 'Bank Logo' }]);
      }
    } else {
      form.resetFields();
      setLogoList([]);
      setPreviewLogo('');
      setBankNamePreview('');
    }
  }, [editData, isEdit, form]);

  const validateImageSize = (file) => {
    if (!file.type.startsWith('image/')) {
      message.error('Only image files are allowed!');
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 > 5) {
      message.error('Image must be less than 5MB');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleCustomUpload = async ({ file, onSuccess: uploadSuccess, onError }) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await apiService.upload('upload', formData);
      const url = response?.file?.url || response?.url || response;
      uploadSuccess(response);
      setPreviewLogo(url || '');
      message.success('Logo uploaded!');
    } catch (err) {
      onError(err);
      message.error('Logo upload failed');
    }
  };

  const resolvedLogo = () => {
    if (logoList.length > 0) {
      return (
        logoList[0].url ||
        logoList[0].response?.file?.url ||
        logoList[0].response?.url ||
        logoList[0].response ||
        ''
      );
    }
    return editData?.logo || '';
  };

  const handleFinish = async (values) => {
    if (loading) return;
    const logoUrl = resolvedLogo();
    if (!logoUrl) {
      message.error('Please upload a bank logo.');
      return;
    }

    const payload = {
      ...values,
      logo: logoUrl,
      isDeleted: false,
    };

    setLoading(true);
    try {
      if (isEdit && editData?._id) {
        await apiService.put(`bank/${editData._id}`, payload);
        notification.success({ message: 'Bank Updated!', description: 'Changes saved successfully.' });
      } else {
        await apiService.post('bank', payload);
        notification.success({ message: 'Bank Created!', description: 'New bank added to library.' });
      }
      onSuccess && onSuccess();
    } catch (err) {
      notification.error({
        message: 'Operation Failed',
        description: err.response?.data?.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f5f3ff', minHeight: '100vh', paddingBottom: 40 }}>
      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div style={{
        background: GRADIENT,
        padding: '28px 32px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
      }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            borderRadius: 8,
          }}
        >
          Back
        </Button>

        <Avatar
          src={previewLogo || undefined}
          icon={!previewLogo && <BankOutlined />}
          size={54}
          shape="square"
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.4)',
            borderRadius: 12,
            fontSize: 22,
            color: '#fff',
          }}
        />

        <div style={{ flex: 1, minWidth: 200 }}>
          <Title level={3} style={{ margin: 0, color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>
            {isEdit ? `Edit Bank: ${bankNamePreview}` : 'Add New Bank'}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
            {isEdit ? 'Update bank details and logo' : 'Create a new bank record for the library'}
          </Text>
        </div>

        <Button
          type="primary"
          onClick={() => form.submit()}
          loading={loading}
          icon={<SaveOutlined />}
          style={{
            background: '#fff',
            color: PRIMARY,
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            height: 40,
            padding: '0 24px',
          }}
        >
          {isEdit ? 'Update Bank' : 'Save Bank'}
        </Button>
      </div>

      <div style={{ padding: '24px 24px 0' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          onValuesChange={(changed) => {
            if (changed.bankName !== undefined) setBankNamePreview(changed.bankName);
          }}
          initialValues={{
            status: 'Active',
            displayOrder: 1,
            mortgageTypesSupported: ['Conventional'],
          }}
        >
          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <Card bordered={false} style={cardStyle}>
                <Divider orientation="left" style={sectionStyle}>
                  <Space><BankOutlined style={{ color: PRIMARY }} /><Text strong>Basic Information</Text></Space>
                </Divider>
                <Row gutter={16}>
                  <Col {...(isEdit ? col2 : { span: 24 })}>
                    <Form.Item
                      name="bankName"
                      label="Bank Name"
                      rules={[{ required: true, message: 'Enter bank name' }]}
                    >
                      <Input placeholder="e.g. Emirates NBD" size="large" />
                    </Form.Item>
                  </Col>
                  {isEdit && (
                    <Col {...col2}>
                      <Form.Item
                        name="bankCode"
                        label="Bank Code"
                        rules={[{ required: true, message: 'Enter bank code' }]}
                      >
                        <Input placeholder="e.g. ENBD" size="large" />
                      </Form.Item>
                    </Col>
                  )}
                  <Col span={24}>
                    <Form.Item
                      name="website"
                      label="Website"
                      rules={[{ type: 'url', message: 'Enter a valid URL' }]}
                    >
                      <Input prefix={<GlobalOutlined style={{ color: '#9ca3af' }} />} placeholder="https://www.emiratesnbd.com" size="large" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card bordered={false} style={cardStyle}>
                <Divider orientation="left" style={sectionStyle}>
                  <Space><MailOutlined style={{ color: PRIMARY }} /><Text strong>Contact Details</Text></Space>
                </Divider>
                <Row gutter={16}>
                  <Col {...col2}>
                    <Form.Item
                      name="contactEmail"
                      label="Contact Email"
                      rules={[{ type: 'email', message: 'Enter a valid email' }]}
                    >
                      <Input prefix={<MailOutlined style={{ color: '#9ca3af' }} />} placeholder="contact@bank.com" size="large" />
                    </Form.Item>
                  </Col>
                  <Col {...col2}>
                    <Form.Item
                      name="contactPhone"
                      label="Contact Phone"
                    >
                      <Input prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />} placeholder="+971 600 54 0000" size="large" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card bordered={false} style={cardStyle}>
                <Divider orientation="left" style={sectionStyle}>
                  <Space><AppstoreOutlined style={{ color: PRIMARY }} /><Text strong>Preferences</Text></Space>
                </Divider>
                <Row gutter={16}>
                  <Col {...col3}>
                    <Form.Item
                      name="mortgageTypesSupported"
                      label="Mortgage Types"
                    >
                      <Select mode="multiple" placeholder="Select types" size="large">
                        {MORTGAGE_TYPES.map(type => (
                          <Option key={type} value={type}>{type}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col {...col3}>
                    <Form.Item
                      name="displayOrder"
                      label="Display Order"
                    >
                      <InputNumber min={1} style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                  <Col {...col3}>
                    <Form.Item
                      name="status"
                      label="Status"
                    >
                      <Select size="large">
                        {STATUS_OPTIONS.map(status => (
                          <Option key={status} value={status}>{status}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card bordered={false} style={cardStyle} title={<Text strong>Bank Logo</Text>}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Upload
                    listType="picture-card"
                    fileList={logoList}
                    customRequest={handleCustomUpload}
                    maxCount={1}
                    beforeUpload={validateImageSize}
                    onRemove={() => {
                      setLogoList([]);
                      setPreviewLogo('');
                    }}
                    onChange={({ fileList }) => setLogoList(fileList)}
                  >
                    {logoList.length >= 1 ? null : (
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Upload Logo</div>
                      </div>
                    )}
                  </Upload>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
                    Supported: JPG, PNG, WEBP. Max 5MB.
                  </Text>
                </div>
              </Card>

              <Card bordered={false} style={{ ...cardStyle, background: 'rgba(92,3,155,0.02)' }}>
                <Title level={5}>Quick Guide</Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  • Use a high-quality square logo for best appearance.<br />
                  • Bank code is used for internal tracking.<br />
                  • Display order determines the sequence in list views.
                </Text>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default BankForm;
