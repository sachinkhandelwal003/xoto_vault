import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from '@/api/apiService';
import {
  Card, Space, Tag, Typography, Row, Col, Avatar,
  Button, Descriptions, Badge, Divider, Spin, Rate,
  Tabs, Table, Tooltip, message, Upload, Modal, Form,
  Select, Input, DatePicker, Switch, Progress, Alert, InputNumber,
  Checkbox, Collapse, List, Image, Drawer, Empty, Statistic, notification
} from 'antd';
import {
  BankOutlined, EyeOutlined, InfoCircleOutlined,
  SafetyCertificateOutlined, FileTextOutlined,
  GlobalOutlined, PhoneOutlined, CalculatorOutlined,
  ArrowLeftOutlined, DownloadOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, CheckCircleOutlined,
  CloseCircleOutlined, UploadOutlined, ReloadOutlined,
  DollarOutlined, TeamOutlined, StarOutlined, ThunderboltOutlined,
  FilePdfOutlined, FileImageOutlined, IdcardOutlined,
  SolutionOutlined, HomeOutlined, InsuranceOutlined,
  FormOutlined, CheckSquareOutlined, FilterOutlined,
  CloudUploadOutlined, FileDoneOutlined, LinkOutlined, BankFilled
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const THEME_COLOR = "#5C039B";
const THEME_SECONDARY = "#f5f3ff";

const roleSlugMap = {
  '18': 'vault-admin',
  '22': 'vaultagent',
  '21': 'vaultpartner',
  '23': 'vault-ops',
  '26': 'vault-advisor',
};

const BankProductViewWithDocuments = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentsData, setDocumentsData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterSource, setFilterSource] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Preview Drawer
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Add Document Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [addLoading, setAddLoading] = useState(false);

  const roleCode = user?.role
    ? typeof user.role === 'object' ? String(user.role.code) : String(user.role)
    : '18';
  const roleSlug = roleSlugMap[roleCode] ?? 'vault-admin';
  const isAdmin = roleCode === '18';

  // Fetch Bank Product Details
  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(`bank/products/get-bank-product/${productId}`);
      if (res?.success) {
        setProduct(res.data);
      }
    } catch (err) {
      message.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Fetch Documents with Filters
  const fetchDocuments = useCallback(async () => {
    try {
      let url = `bank/products/bank-forms/bank-product/${productId}`;
      const params = [];
      if (filterSource !== 'all') params.push(`documentSource=${filterSource}`);
      if (filterType !== 'all') params.push(`actionType=${filterType}`);
      if (params.length) url += `?${params.join('&')}`;

      const res = await apiService.get(url);
      if (res?.success) {
        setDocumentsData(res.data);
      }
    } catch (err) {
      message.error('Failed to load documents');
    }
  }, [productId, filterSource, filterType]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchDocuments();
    }
  }, [productId, fetchProduct, fetchDocuments, filterSource, filterType]);

  // Handle Add Document
  const handleAddDocument = async (values) => {
    setAddLoading(true);
    try {
      const payload = {
        bankProductId: productId,
        bankName: product?.bankInfo?.bankName,
        bankCode: product?.bankInfo?.bankCode,
        ...values,
        uploadedBy: user?.id,
        isLatestVersion: true,
      };
      await apiService.post('bank-products/create-bank-form', payload);
      message.success('Document added successfully');
      setIsAddModalOpen(false);
      addForm.resetFields();
      fetchDocuments();
    } catch (err) {
      message.error('Failed to add document');
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Download
  const downloadImage = async (imageUrl) => {
    try {
      let key = imageUrl.split('.amazonaws.com/')[1];
      if (!key) { notification.error({ message: 'Invalid URL' }); return; }
      key = decodeURIComponent(key);
      await apiService.download(
        `/download-pdf?key=${encodeURIComponent(key)}`,
        `xoto_vault_download_${Date.now()}.pdf`
      );
    } catch {
      notification.error({ message: 'Download Failed', description: 'PDF could not be generated.' });
    }
  };

  const openPreview = (doc) => { setSelectedDoc(doc); setPreviewVisible(true); };
  const handleGoBack = () => navigate(`/dashboard/${roleSlug}/bank/products`);

  const stats = documentsData?.summary || {
    totalForms: 0, mandatoryCount: 0, optionalCount: 0, customerDocsCount: 0, bankFormsCount: 0,
  };
  const allDocs = documentsData?.allForms || [];

  // Document Card Component
  const DocumentCard = ({ doc }) => {
    const isPDF = doc.fileUrl?.match(/\.pdf$/i);
    const isImage = doc.fileUrl?.match(/\.(jpeg|jpg|png|gif)$/i);
    return (
      <Card
        hoverable
        style={{ borderRadius: 16, height: '100%', border: `1px solid ${doc.isMandatory ? '#ffccc7' : '#e8e8e8'}`, transition: 'all 0.3s' }}
        bodyStyle={{ padding: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <Space>
            {doc.documentSource === 'Bank'
              ? <BankFilled style={{ fontSize: 28, color: THEME_COLOR }} />
              : <FileTextOutlined style={{ fontSize: 28, color: THEME_COLOR }} />}
            <div>
              <Text strong style={{ fontSize: 15, display: 'block' }}>{doc.formName}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{doc.formType?.replace('_', ' ').toUpperCase()}</Text>
            </div>
          </Space>
          <Space>
            {doc.isMandatory && <Tag color="error" style={{ margin: 0 }}>Required</Tag>}
            <Tooltip title="Preview"><Button type="text" icon={<EyeOutlined />} onClick={() => openPreview(doc)} /></Tooltip>
            <Tooltip title="Download"><Button type="text" icon={<DownloadOutlined />} onClick={() => downloadImage(doc.fileUrl)} /></Tooltip>
          </Space>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Space wrap>
            <Tag color={doc.documentSource === 'Bank' ? 'blue' : 'green'}>{doc.documentSource}</Tag>
            <Tag color={doc.actionType === 'download_fill_upload' ? 'orange' : 'cyan'}>
              {doc.actionType === 'download_fill_upload' ? 'Download & Fill' : 'Direct Upload'}
            </Tag>
            <Tag>{doc.formCategory || 'General'}</Tag>
          </Space>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 10 }}>Applicable:</Text>
          <div>
            {doc.applicableEmploymentTypes?.map(t => <Tag key={t} size="small">{t}</Tag>)}
            {doc.applicableResidencyStatus?.map(t => <Tag key={t} size="small">{t}</Tag>)}
          </div>
        </div>
        {doc.fileUrl && (
          <div
            style={{ background: '#fafafa', padding: 8, borderRadius: 8, marginTop: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => openPreview(doc)}
          >
            {isPDF ? <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
              : isImage ? <FileImageOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              : <LinkOutlined style={{ color: THEME_COLOR }} />}
            <Text style={{ fontSize: 12, flex: 1 }} ellipsis>{doc.fileName || 'View Document'}</Text>
            <EyeOutlined style={{ color: THEME_COLOR }} />
          </div>
        )}
        {doc.fillInstructions && (
          <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #f0f0f0', fontSize: 11, color: '#666' }}>
            <InfoCircleOutlined style={{ marginRight: 4, color: THEME_COLOR }} />
            {doc.fillInstructions.substring(0, 80)}...
          </div>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 50, textAlign: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading product details...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: 50, textAlign: 'center', minHeight: '100vh' }}>
        <Empty description="Product not found" />
        <Button onClick={handleGoBack} style={{ marginTop: 16 }}>Go Back</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f3ff', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack} style={{ marginBottom: 16, borderColor: THEME_COLOR, color: THEME_COLOR }}>
          Back to Products
        </Button>
        <Row gutter={[24, 24]} align="middle">
          <Col>
            <Avatar
              src={product.bankInfo?.logo}
              size={80}
              shape="square"
              style={{ borderRadius: 16, border: `2px solid ${THEME_COLOR}` }}
              icon={<BankOutlined />}
            />
          </Col>
          <Col flex="auto">
            <Title level={2} style={{ margin: 0, color: '#1e1b4b' }}>{product.bankInfo?.bankName}</Title>
            <Title level={4} style={{ margin: 0, color: '#666' }}>{product.offerSummary?.title}</Title>
            <Space style={{ marginTop: 8 }} size="middle">
              <Rate disabled defaultValue={product.bankInfo?.rating} allowHalf />
              <Text type="secondary">({product.bankInfo?.reviewCount} reviews)</Text>
              {product.isPopular && <Tag color="gold" icon={<StarOutlined />}>Popular</Tag>}
              {product.isFeatured && <Tag color="purple" icon={<ThunderboltOutlined />}>Featured</Tag>}
            </Space>
          </Col>
          <Col>
            <div style={{ textAlign: 'right', background: THEME_SECONDARY, padding: '12px 24px', borderRadius: 16 }}>
              <Text type="secondary">Starting from</Text>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: THEME_COLOR }}>{product.offerSummary?.initialRate}%</div>
              <Text type="secondary">Initial Rate</Text>
            </div>
          </Col>
        </Row>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total Documents', value: stats.totalForms, icon: <FileTextOutlined />, color: THEME_COLOR },
          { title: 'Mandatory', value: stats.mandatoryCount, color: '#ff4d4f' },
          { title: 'Customer Docs', value: stats.customerDocsCount, color: '#52c41a' },
          { title: 'Bank Forms', value: stats.bankFormsCount, color: THEME_COLOR },
        ].map((s) => (
          <Col xs={24} sm={12} md={6} key={s.title}>
            <Card style={{ borderRadius: 12, textAlign: 'center' }}>
              <Statistic title={s.title} value={s.value} prefix={s.icon} valueStyle={{ color: s.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        style={{ marginBottom: 16 }}
        items={[
          { key: 'overview', label: <span><BankOutlined /> Overview</span> },
          { key: 'details', label: <span><InfoCircleOutlined /> Loan Details</span> },
          { key: 'cost', label: <span><DollarOutlined /> Cost Breakdown</span> },
          { key: 'eligibility', label: <span><TeamOutlined /> Eligibility</span> },
          { key: 'documents', label: <span><FileTextOutlined /> Documents ({stats.totalForms})</span> },
          { key: 'features', label: <span><StarOutlined /> Features</span> },
        ]}
        tabBarExtraContent={
          isAdmin && activeTab === 'documents' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)} style={{ background: THEME_COLOR }}>
              Add Document
            </Button>
          ) : null
        }
      />

      {/* Overview Tab */}
      <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title="Offer Summary" bordered={false} style={{ borderRadius: 16 }}>
              <Paragraph>{product.offerSummary?.shortDescription}</Paragraph>
              <Divider />
              <Row gutter={[16, 16]}>
                <Col span={12}><Text type="secondary">Product Type</Text><div><Tag color={THEME_COLOR}>{product.offerSummary?.productType}</Tag></div></Col>
                <Col span={12}><Text type="secondary">Fixed Years</Text><div><Text strong>{product.offerSummary?.fixedYears || 'N/A'} years</Text></div></Col>
                <Col span={12}><Text type="secondary">Comparison Rate</Text><div><Text strong>{product.offerSummary?.comparisonRate || 'N/A'}%</Text></div></Col>
                <Col span={12}>
                  <Text type="secondary">Valid Until</Text>
                  <div>
                    {product.offerSummary?.productValidity?.doesNotExpire
                      ? <Tag color="green">Never Expires</Tag>
                      : <Text>{dayjs(product.offerSummary?.productValidity?.expiryDate).format('DD MMM YYYY')}</Text>}
                  </div>
                </Col>
              </Row>
            </Card>
            <Card title="Bank Information" bordered={false} style={{ borderRadius: 16, marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}><Text type="secondary">Website</Text><div><a href={product.bankInfo?.website} target="_blank" rel="noopener noreferrer">{product.bankInfo?.website}</a></div></Col>
                <Col span={12}><Text type="secondary">Customer Care</Text><div><Text>{product.bankInfo?.customerCare}</Text></div></Col>
                <Col span={12}><Text type="secondary">Bank Code</Text><div><Text code>{product.bankInfo?.bankCode}</Text></div></Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Quick EMI Calculator" bordered={false} style={{ borderRadius: 16 }}>
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Text type="secondary">Monthly EMI for 1M AED loan</Text>
                <div style={{ fontSize: 36, fontWeight: 'bold', color: THEME_COLOR }}>AED {product.offerSummary?.monthlyEMI?.toLocaleString()}</div>
                <Text type="secondary">Based on {product.loanDetails?.tenureYears} years tenure</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Loan Details Tab */}
      <div style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Loan Terms" bordered={false} style={{ borderRadius: 16 }}>
              <Descriptions column={1}>
                <Descriptions.Item label="Tenure">{product.loanDetails?.tenureYears} years (Min: {product.loanDetails?.minTenureYears}, Max: {product.loanDetails?.maxTenureYears})</Descriptions.Item>
                <Descriptions.Item label="Loan to Value (LTV)">{product.loanDetails?.loanToValue}% ({product.loanDetails?.minLoanToValue}% - {product.loanDetails?.maxLoanToValue}%)</Descriptions.Item>
                <Descriptions.Item label="Interest Type">{product.loanDetails?.interestType}</Descriptions.Item>
                <Descriptions.Item label="Salary Transfer Required">{product.loanDetails?.salaryTransfer}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Fees & Charges" bordered={false} style={{ borderRadius: 16 }}>
              <Descriptions column={1}>
                <Descriptions.Item label="Early Settlement Fee">{product.loanDetails?.earlySettlementFee}</Descriptions.Item>
                <Descriptions.Item label="Free After">{product.loanDetails?.earlySettlementFreeAfterYears} years</Descriptions.Item>
                <Descriptions.Item label="Late Payment Fee">{product.loanDetails?.latePaymentFee}</Descriptions.Item>
                <Descriptions.Item label="Overpayment Allowed">{product.loanDetails?.overpaymentAllowedPercent}%</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Cost Breakdown Tab */}
      <div style={{ display: activeTab === 'cost' ? 'block' : 'none' }}>
        <Card title="Cost Breakdown for AED 1,000,000 Property" bordered={false} style={{ borderRadius: 16 }}>
          <Row gutter={[16, 16]}>
            {[
              { label: 'Down Payment', value: `AED ${product.costBreakdown?.downPayment?.toLocaleString()}`, sub: `(${product.costBreakdown?.downPaymentPercentage}%)` },
              { label: 'Total Upfront Cost', value: `AED ${product.costBreakdown?.totalUpfrontCost?.toLocaleString()}`, color: THEME_COLOR },
              { label: 'Monthly EMI', value: `AED ${product.offerSummary?.monthlyEMI?.toLocaleString()}` },
            ].map((item) => (
              <Col xs={24} md={8} key={item.label}>
                <div style={{ background: THEME_SECONDARY, padding: 16, borderRadius: 12, textAlign: 'center' }}>
                  <Text type="secondary">{item.label}</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: item.color || '#1e1b4b' }}>{item.value}</div>
                  {item.sub && <Text type="secondary">{item.sub}</Text>}
                </div>
              </Col>
            ))}
          </Row>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>Fees Payable</Text>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="DLD Fee">AED {product.costBreakdown?.dldFee?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Mortgage Registration Fee">AED {product.costBreakdown?.mortgageRegistrationFee?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Trustee Fee">AED {product.costBreakdown?.trusteeFee?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Bank Processing Fee">AED {product.costBreakdown?.bankProcessingFee?.toLocaleString()} ({product.costBreakdown?.bankProcessingFeeType})</Descriptions.Item>
              </Descriptions>
            </Col>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>Additional Fees</Text>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Valuation Fee">AED {product.costBreakdown?.valuationFee?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Pre-Approval Fee">AED {product.costBreakdown?.bankPreApprovalFee?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Buyout Fee">AED {product.costBreakdown?.buyoutFee?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Conveyance Fee">AED {product.costBreakdown?.conveyanceFee?.toLocaleString()}</Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Eligibility Tab */}
      <div style={{ display: activeTab === 'eligibility' ? 'block' : 'none' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Eligibility Criteria" bordered={false} style={{ borderRadius: 16 }}>
              <Descriptions column={1}>
                <Descriptions.Item label="Minimum Salary">AED {product.eligibility?.minSalary?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Age Limit">{product.eligibility?.minAge} - {product.eligibility?.maxAge} years</Descriptions.Item>
                <Descriptions.Item label="Loan Amount">AED {product.eligibility?.minLoanAmount?.toLocaleString()} - {product.eligibility?.maxLoanAmount?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="LTV Range">{product.eligibility?.minLTV}% - {product.eligibility?.maxLTV}%</Descriptions.Item>
                <Descriptions.Item label="Min Experience">{product.eligibility?.minExperienceYears}+ years</Descriptions.Item>
                <Descriptions.Item label="Min Employment">{product.eligibility?.minEmploymentYears}+ years</Descriptions.Item>
                <Descriptions.Item label="Visa Required">{product.eligibility?.visaRequired ? 'Yes' : 'No'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Eligible Categories" bordered={false} style={{ borderRadius: 16 }}>
              <Descriptions column={1}>
                <Descriptions.Item label="Nationalities">{product.eligibility?.eligibleNationalities?.join(', ')}</Descriptions.Item>
                <Descriptions.Item label="Employment Types">{product.eligibility?.eligibleEmploymentTypes?.join(', ')}</Descriptions.Item>
                <Descriptions.Item label="Residency Status">{product.eligibility?.eligibleResidencyStatus?.join(', ')}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Documents Tab */}
      <div style={{ display: activeTab === 'documents' ? 'block' : 'none' }}>
        <Card style={{ borderRadius: 16, marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={8}>
              <Text strong><FilterOutlined /> Document Source:</Text>
              <Select value={filterSource} onChange={setFilterSource} style={{ width: '100%', marginTop: 8 }}>
                <Option value="all">All Documents ({stats.totalForms})</Option>
                <Option value="Customer">Customer Documents ({stats.customerDocsCount})</Option>
                <Option value="Bank">Bank Forms ({stats.bankFormsCount})</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Text strong><FileTextOutlined /> Action Type:</Text>
              <Select value={filterType} onChange={setFilterType} style={{ width: '100%', marginTop: 8 }}>
                <Option value="all">All Types</Option>
                <Option value="direct_upload">Direct Upload Only</Option>
                <Option value="download_fill_upload">Download & Fill</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ marginTop: 24 }}>
                <Button onClick={() => { setFilterSource('all'); setFilterType('all'); }}>Reset Filters</Button>
              </div>
            </Col>
          </Row>
        </Card>
        {allDocs.length === 0 ? (
          <Card style={{ borderRadius: 16, textAlign: 'center' }}>
            <Empty description="No documents found for this bank product" />
            {isAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)} style={{ marginTop: 16, background: THEME_COLOR }}>
                Add First Document
              </Button>
            )}
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {allDocs.map(doc => (
              <Col xs={24} lg={12} key={doc._id}>
                <DocumentCard doc={doc} />
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Features Tab */}
      <div style={{ display: activeTab === 'features' ? 'block' : 'none' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Key Features" bordered={false} style={{ borderRadius: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {product.features?.keyFeatures?.map((f, idx) => (
                  <div key={idx}><CheckCircleOutlined style={{ color: THEME_COLOR, marginRight: 8 }} />{f}</div>
                ))}
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Benefits" bordered={false} style={{ borderRadius: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {product.features?.benefits?.map((b, idx) => (
                  <div key={idx}><StarOutlined style={{ color: THEME_COLOR, marginRight: 8 }} />{b}</div>
                ))}
              </Space>
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="Terms & Conditions" bordered={false} style={{ borderRadius: 16 }}>
              {product.features?.termsAndConditions?.map((tc, idx) => (
                <div key={idx} style={{ marginBottom: 8 }}>• {tc}</div>
              ))}
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="Disclaimers" bordered={false} style={{ borderRadius: 16 }}>
              {product.features?.disclaimers?.map((d, idx) => (
                <div key={idx} style={{ marginBottom: 8, color: '#ff4d4f' }}>⚠ {d}</div>
              ))}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Preview Drawer */}
      <Drawer
        title={selectedDoc?.formName}
        placement="right"
        width={600}
        open={previewVisible}
        onClose={() => setPreviewVisible(false)}
        extra={
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => selectedDoc?.fileUrl && downloadImage(selectedDoc.fileUrl)} style={{ background: THEME_COLOR }}>
            Download PDF
          </Button>
        }
      >
        {selectedDoc && (
          <div>
            <Card style={{ borderRadius: 12, marginBottom: 16 }}>
              <div style={{ textAlign: 'center', minHeight: 400 }}>
                {selectedDoc.fileUrl?.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                  <Image src={selectedDoc.fileUrl} alt={selectedDoc.fileName} style={{ maxWidth: '100%', maxHeight: 400 }} />
                ) : selectedDoc.fileUrl?.match(/\.pdf$/i) ? (
                  <iframe src={`${selectedDoc.fileUrl}#toolbar=0`} style={{ width: '100%', height: 500, border: 'none', borderRadius: 8 }} title="PDF Preview" />
                ) : selectedDoc.fileUrl ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <FileTextOutlined style={{ fontSize: 48, color: '#999' }} />
                    <div style={{ marginTop: 16 }}><a href={selectedDoc.fileUrl} target="_blank" rel="noopener noreferrer">Open Document</a></div>
                  </div>
                ) : (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <FileTextOutlined style={{ fontSize: 48, color: '#ccc' }} />
                    <div style={{ marginTop: 16 }}>No file attached</div>
                  </div>
                )}
              </div>
            </Card>
            <Card style={{ borderRadius: 12 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Document Type">{selectedDoc.formType?.replace('_', ' ').toUpperCase()}</Descriptions.Item>
                <Descriptions.Item label="Category">{selectedDoc.formCategory || 'General'}</Descriptions.Item>
                <Descriptions.Item label="Source">{selectedDoc.documentSource}</Descriptions.Item>
                <Descriptions.Item label="Action">{selectedDoc.actionType === 'download_fill_upload' ? 'Download, Fill & Upload' : 'Direct Upload'}</Descriptions.Item>
                <Descriptions.Item label="Mandatory">{selectedDoc.isMandatory ? 'Yes' : 'No'}</Descriptions.Item>
                <Descriptions.Item label="Instructions">{selectedDoc.fillInstructions}</Descriptions.Item>
                <Descriptions.Item label="Description">{selectedDoc.description}</Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}
      </Drawer>

      {/* Add Document Modal */}
      <Modal
        title="Add Document / Form"
        open={isAddModalOpen}
        onCancel={() => { setIsAddModalOpen(false); addForm.resetFields(); }}
        footer={null}
        width={700}
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddDocument}>
          <Row gutter={16}>
            <Col span={24}><Form.Item name="formName" label="Form Name" rules={[{ required: true }]}><Input placeholder="e.g. Mortgage Application Form" size="large" /></Form.Item></Col>
            <Col span={12}><Form.Item name="formType" label="Form Type" rules={[{ required: true }]}><Select size="large" placeholder="Select type"><Option value="application_form">Application Form</Option><Option value="consent_form">Consent Form</Option><Option value="disclosure_form">Disclosure Form</Option><Option value="noc_template">NOC Template</Option><Option value="customer_document">Customer Document</Option><Option value="other">Other</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="formCategory" label="Category"><Select size="large" placeholder="Select category" allowClear><Option value="Pre-Approval">Pre-Approval</Option><Option value="Final Approval">Final Approval</Option><Option value="Disbursement">Disbursement</Option><Option value="General">General</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="documentSource" label="Document Source" initialValue="Customer"><Select size="large"><Option value="Customer">Customer Document</Option><Option value="Bank">Bank Form</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="actionType" label="Action Type"><Select size="large"><Option value="direct_upload">Direct Upload</Option><Option value="download_fill_upload">Download → Fill → Upload</Option></Select></Form.Item></Col>
            <Col span={24}><Form.Item name="fileUrl" label="File URL"><Input placeholder="https://cdn.xoto.ae/forms/..." size="large" /></Form.Item></Col>
            <Col span={12}><Form.Item name="fileName" label="File Name"><Input placeholder="document-name.pdf" size="large" /></Form.Item></Col>
            <Col span={12}><Form.Item name="fileSize" label="File Size (bytes)"><InputNumber style={{ width: '100%' }} placeholder="325000" size="large" /></Form.Item></Col>
            <Col span={12}><Form.Item name="version" label="Version" initialValue="1.0"><Input placeholder="1.0" size="large" /></Form.Item></Col>
            <Col span={12}><Form.Item name="order" label="Display Order"><InputNumber style={{ width: '100%' }} min={1} size="large" /></Form.Item></Col>
            <Col span={8}><Form.Item name="isMandatory" label="Is Mandatory?" valuePropName="checked" initialValue={true}><Switch /></Form.Item></Col>
            <Col span={8}><Form.Item name="requiresSignature" label="Requires Signature?" valuePropName="checked" initialValue={true}><Switch /></Form.Item></Col>
            <Col span={8}><Form.Item name="requiresAttestation" label="Requires Attestation?" valuePropName="checked" initialValue={false}><Switch /></Form.Item></Col>
            <Col span={12}><Form.Item name="applicableEmploymentTypes" label="Employment Types" initialValue={['Both']}><Select mode="multiple" size="large"><Option value="Salaried">Salaried</Option><Option value="Self-Employed">Self-Employed</Option><Option value="Both">Both</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="applicableResidencyStatus" label="Residency Status" initialValue={['All']}><Select mode="multiple" size="large"><Option value="UAE National">UAE National</Option><Option value="UAE Resident">UAE Resident</Option><Option value="Non-Resident">Non-Resident</Option><Option value="All">All</Option></Select></Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="Description"><TextArea rows={2} placeholder="Describe what this form is for..." /></Form.Item></Col>
            <Col span={24}><Form.Item name="fillInstructions" label="Fill Instructions"><TextArea rows={3} placeholder="Step by step instructions..." /></Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <Button onClick={() => { setIsAddModalOpen(false); addForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={addLoading} style={{ background: THEME_COLOR }}>Add Document</Button>
          </div>
        </Form>
      </Modal>

    </div>
  );
};

export default BankProductViewWithDocuments;
