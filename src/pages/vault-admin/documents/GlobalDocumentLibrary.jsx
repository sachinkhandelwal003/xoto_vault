// src/pages/vault-admin/documents/GlobalDocumentLibrary.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/api/apiService';
import {
  Avatar, Badge, Button, Card, Col, Divider, Empty, Popconfirm,
  Row, Select, Space, Spin, Tag, Typography, message,
  Input, Tooltip, Grid,
} from 'antd';
import {
  CheckCircleOutlined, CloudDownloadOutlined,
  DeleteOutlined, EditOutlined, EyeOutlined,
  GlobalOutlined, PlusOutlined, SearchOutlined, UploadOutlined,
  FileTextOutlined, ReloadOutlined, FilterOutlined, ClearOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const THEME    = '#5C039B';
const GRADIENT = 'linear-gradient(135deg,#5C039B,#03A4F4)';

const DOC_TYPE_CFG = {
  direct_upload:    { label: 'Direct Upload',    color: THEME,     icon: <UploadOutlined />,        bg: '#f5f0ff' },
  template_download:{ label: 'Template Download', color: '#03A4F4', icon: <CloudDownloadOutlined />, bg: '#f0f9ff' },
  sample_view:      { label: 'Sample View',       color: '#10b981', icon: <EyeOutlined />,           bg: '#f0fdf4' },
};

const CAT_COLOR = {
  Identity: 'purple', Income: 'blue', Banking: 'cyan', Business: 'gold',
  Property: 'green', Tax: 'orange', Compliance: 'red', Insurance: 'magenta',
  'Bank Form': 'volcano', Information: 'geekblue', Other: 'default',
};

const CATEGORIES = ['Identity','Income','Banking','Business','Property','Tax','Compliance','Insurance','Bank Form','Information','Other'];
const EMP_TYPES  = ['Salaried','Self-Employed','Both'];
const RES_TYPES  = ['UAE National','UAE Resident','Non-Resident','All'];
const MTG_TYPES  = ['Islamic','Conventional','Both'];

const InfoLine = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
    <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, flexShrink: 0, marginRight: 6 }}>{label}</Text>
    <Text style={{ fontSize: 12, color: '#1e293b', fontWeight: 700, textAlign: 'right' }}>{value ?? '—'}</Text>
  </div>
);

const ColHead = ({ children }) => (
  <div style={{ fontSize: 10, color: THEME, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1, marginBottom: 8, paddingBottom: 4, borderBottom: `2px solid ${THEME}` }}>
    {children}
  </div>
);

const DocCard = ({ doc, onEdit, onDelete, screens }) => {
  const tc   = DOC_TYPE_CFG[doc.documentType] || DOC_TYPE_CFG.direct_upload;
  const isTpl = doc.documentType === 'template_download';
  const isSmp = doc.documentType === 'sample_view';

  return (
    <Card bordered={false} bodyStyle={{ padding: 0 }}
      style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 14px rgba(0,0,0,0.06)', border: '1px solid #e8edf4' }}>
      <div style={{ height: 4, background: doc.status === 'Active' ? GRADIENT : '#cbd5e1' }} />
      <div style={{ padding: screens.md ? '16px 22px' : '14px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <Space size={12} align="flex-start">
            <div style={{ width: 44, height: 44, borderRadius: 10, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: tc.color, flexShrink: 0 }}>
              {tc.icon}
            </div>
            <div>
              <Title level={5} style={{ margin: 0, color: '#1e293b', fontWeight: 800, lineHeight: 1.2 }}>{doc.documentName}</Title>
              <Text style={{ fontSize: 11, color: '#94a3b8' }}>{doc.documentKey}</Text>
              {doc.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{doc.description}</div>}
            </div>
          </Space>
          <Space size={5} wrap align="center">
            <Tag style={{ borderRadius: 6, fontWeight: 700, fontSize: 11, margin: 0, background: tc.bg, color: tc.color, border: `1px solid ${tc.color}40` }}>
              {tc.icon} {tc.label}
            </Tag>
            <Tag color={CAT_COLOR[doc.category] || 'default'} style={{ borderRadius: 6, fontWeight: 600, fontSize: 11, margin: 0 }}>{doc.category}</Tag>
            <Tag color={doc.isMandatory ? 'red' : 'default'} style={{ borderRadius: 6, fontWeight: 600, fontSize: 11, margin: 0 }}>
              {doc.isMandatory ? 'Mandatory' : 'Optional'}
            </Tag>
            <Badge status={doc.status === 'Active' ? 'success' : 'default'}
              text={<Text style={{ fontSize: 12, fontWeight: 600, color: doc.status === 'Active' ? '#059669' : '#6b7280' }}>{doc.status}</Text>} />
            {isTpl && doc.template?.fileUrl && (
              <Tooltip title="Download Template">
                <Button size="small" icon={<CloudDownloadOutlined />}
                  onClick={() => window.open(doc.template.fileUrl, '_blank')}
                  style={{ borderRadius: 6, borderColor: '#03A4F4', color: '#03A4F4', background: '#f0f9ff', fontWeight: 600 }}>
                  Template
                </Button>
              </Tooltip>
            )}
            {isSmp && doc.sampleDocument?.fileUrl && (
              <Tooltip title="View Sample">
                <Button size="small" icon={<EyeOutlined />}
                  onClick={() => window.open(doc.sampleDocument.fileUrl, '_blank')}
                  style={{ borderRadius: 6, borderColor: '#10b981', color: '#10b981', background: '#f0fdf4', fontWeight: 600 }}>
                  Sample
                </Button>
              </Tooltip>
            )}
            <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(doc._id)}
              style={{ background: THEME, border: 'none', borderRadius: 8, height: 34, fontWeight: 700, fontSize: 12 }}>
              Edit
            </Button>
            <Popconfirm title="Delete this document?" description="This cannot be undone."
              onConfirm={() => onDelete(doc._id)} okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel">
              <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 8, height: 34, fontWeight: 600 }}>Delete</Button>
            </Popconfirm>
          </Space>
        </div>

        <Divider style={{ margin: '0 0 12px' }} />

        {/* Detail columns */}
        <Row gutter={[0, 0]}>
          <Col xs={24} sm={12} md={5}>
            <div style={{ paddingRight: screens.md ? 18 : 0, marginBottom: screens.md ? 0 : 14 }}>
              <ColHead>Validation Rules</ColHead>
              <InfoLine label="Mandatory"    value={doc.isMandatory ? '✅ Yes' : '❌ No'} />
              <InfoLine label="Front & Back" value={doc.requiresFrontBack ? 'Yes' : 'No'} />
              <InfoLine label="Translation"  value={doc.requiresTranslation ? 'Yes' : 'No'} />
              <InfoLine label="Attestation"  value={doc.requiresAttestation ? 'Yes' : 'No'} />
              <InfoLine label="Signature"    value={doc.requiresSignature ? 'Yes' : 'No'} />
              <InfoLine label="Stamp"        value={doc.requiresStamp ? 'Yes' : 'No'} />
            </div>
          </Col>
          {screens.md && <Col md={1}><Divider type="vertical" style={{ height: '100%', margin: '0 auto', display: 'block' }} /></Col>}
          <Col xs={24} sm={12} md={4}>
            <div style={{ paddingLeft: screens.md ? 14 : 0, paddingRight: screens.md ? 14 : 0, marginBottom: screens.md ? 0 : 14 }}>
              <ColHead>File Rules</ColHead>
              <InfoLine label="Multiple Files" value={doc.allowMultipleFiles ? `Yes (max ${doc.maxFilesAllowed})` : 'No'} />
              <InfoLine label="Max Size"       value={`${doc.maxFileSizeMB} MB`} />
              <InfoLine label="File Types"     value={(doc.allowedFileTypes || []).map(t => `.${t}`).join(', ') || '—'} />
              <InfoLine label="Order"          value={doc.displayOrder} />
            </div>
          </Col>
          {screens.md && <Col md={1}><Divider type="vertical" style={{ height: '100%', margin: '0 auto', display: 'block' }} /></Col>}
          <Col xs={24} sm={12} md={5}>
            <div style={{ paddingLeft: screens.md ? 14 : 0, paddingRight: screens.md ? 14 : 0, marginBottom: screens.md ? 0 : 14 }}>
              <ColHead>Applicability</ColHead>
              {[
                { label: 'Employment', items: doc.applicableEmploymentTypes || [], color: undefined },
                { label: 'Residency',  items: doc.applicableResidencyStatuses || [], color: 'blue' },
                { label: 'Mortgage',   items: doc.applicableMortgageTypes || [], color: 'purple' },
              ].map(({ label, items, color }) => (
                <div key={label} style={{ padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 3 }}>{label}</Text>
                  <Space wrap size={[3, 3]}>
                    {items.map(v => <Tag key={v} color={color} style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>{v}</Tag>)}
                  </Space>
                </div>
              ))}
            </div>
          </Col>
          {screens.md && <Col md={1}><Divider type="vertical" style={{ height: '100%', margin: '0 auto', display: 'block' }} /></Col>}
          <Col xs={24} sm={12} md={4}>
            <div style={{ paddingLeft: screens.md ? 14 : 0, paddingRight: screens.md ? 14 : 0, marginBottom: screens.md ? 0 : 14 }}>
              {isTpl ? (
                <>
                  <ColHead>Template Info</ColHead>
                  <InfoLine label="Version"       value={doc.template?.version || '—'} />
                  <InfoLine label="Fillable"       value={doc.template?.hasFillableFields ? 'Yes' : 'No'} />
                  <InfoLine label="Req. Signature" value={doc.template?.requiresSignature ? 'Yes' : 'No'} />
                  <InfoLine label="Req. Stamp"     value={doc.template?.requiresCompanyStamp ? 'Yes' : 'No'} />
                  {doc.template?.fileUrl && (
                    <a href={doc.template.fileUrl} target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, color: '#03A4F4', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <CloudDownloadOutlined /> Download Template
                    </a>
                  )}
                </>
              ) : isSmp ? (
                <>
                  <ColHead>Sample Info</ColHead>
                  {doc.sampleDocument?.description && (
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{doc.sampleDocument.description}</div>
                  )}
                  {doc.sampleDocument?.fileUrl && (
                    <a href={doc.sampleDocument.fileUrl} target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <EyeOutlined /> View Sample
                    </a>
                  )}
                </>
              ) : (
                <>
                  <ColHead>Upload Info</ColHead>
                  <div style={{ textAlign: 'center', padding: '14px 0', color: '#94a3b8' }}>
                    <UploadOutlined style={{ fontSize: 22, color: THEME, marginBottom: 5 }} />
                    <div style={{ fontSize: 12 }}>Customer uploads directly</div>
                  </div>
                </>
              )}
            </div>
          </Col>
          {screens.md && <Col md={1}><Divider type="vertical" style={{ height: '100%', margin: '0 auto', display: 'block' }} /></Col>}
          <Col xs={24} md={8}>
            <div style={{ paddingLeft: screens.md ? 14 : 0 }}>
              <ColHead>Instructions & UI Text</ColHead>
              {doc.placeholderText && <InfoLine label="Placeholder" value={doc.placeholderText} />}
              {doc.helperText      && <InfoLine label="Helper"      value={doc.helperText} />}
              {doc.instructions && (
                <div style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>Steps</Text>
                  {doc.instructions.split('\n').filter(Boolean).map((line, i) => (
                    <div key={i} style={{ display: 'flex', gap: 5, padding: '2px 0' }}>
                      <CheckCircleOutlined style={{ color: '#10b981', fontSize: 11, marginTop: 2, flexShrink: 0 }} />
                      <Text style={{ fontSize: 12, color: '#374151' }}>{line}</Text>
                    </div>
                  ))}
                </div>
              )}
              {!doc.placeholderText && !doc.helperText && !doc.instructions && (
                <Text style={{ fontSize: 12, color: '#cbd5e1' }}>No display text configured</Text>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

const GlobalDocumentLibrary = () => {
  const navigate = useNavigate();
  const screens  = useBreakpoint();

  const [docs,      setDocs]      = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(false);

  const [search,      setSearch]      = useState('');
  const [filterType,  setFilterType]  = useState('');
  const [filterCat,   setFilterCat]   = useState('');
  const [filterEmp,   setFilterEmp]   = useState('');
  const [filterRes,   setFilterRes]   = useState('');
  const [filterMtg,   setFilterMtg]   = useState('');
  const [filterMand,  setFilterMand]  = useState('');
  const [filterStatus,setFilterStatus]= useState('Active');

  const activeFilterCount = [filterType, filterCat, filterEmp, filterRes, filterMtg, filterMand].filter(Boolean).length;

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: filterStatus || undefined };
      if (filterType)  params.documentType       = filterType;
      if (filterCat)   params.category            = filterCat;
      if (filterEmp)   params.employmentType      = filterEmp;
      if (filterRes)   params.residencyStatus     = filterRes;
      if (filterMtg)   params.mortgageType        = filterMtg;
      if (filterMand !== '') params.isMandatory   = filterMand;

      const res = await apiService.get('bank/documents/global', params);
      if (res?.success) {
        let list = res.data || [];
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(d =>
            d.documentName?.toLowerCase().includes(q) ||
            d.documentKey?.toLowerCase().includes(q) ||
            d.description?.toLowerCase().includes(q)
          );
        }
        setDocs(list);
        setSummary(res.summary);
      }
    } catch {
      message.error('Failed to load global documents');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCat, filterEmp, filterRes, filterMtg, filterMand, filterStatus, search]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async (id) => {
    try {
      await apiService.delete(`bank/documents/${id}`);
      message.success('Document deleted');
      fetchDocs();
    } catch { message.error('Delete failed'); }
  };

  const clearFilters = () => {
    setSearch(''); setFilterType(''); setFilterCat(''); setFilterEmp('');
    setFilterRes(''); setFilterMtg(''); setFilterMand(''); setFilterStatus('Active');
  };

  return (
    <div style={{ padding: screens.md ? '24px' : '12px', background: '#f8fafc', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GlobalOutlined style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>Global Documents</Title>
            <Text type="secondary">Documents that apply to all banks and customers</Text>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => navigate('/dashboard/vault-admin/documents/global/add')}
          style={{ background: GRADIENT, border: 'none', borderRadius: 8, height: 40, padding: '0 20px', fontWeight: 700 }}>
          Add Global Document
        </Button>
      </div>

      {/* Stats */}
      {summary && (
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          {[
            { label: 'Total Global',      value: summary.total,            color: THEME },
            { label: 'Direct Upload',     value: summary.directUpload,     color: '#5C039B' },
            { label: 'Template Download', value: summary.templateDownload, color: '#03A4F4' },
            { label: 'Sample View',       value: summary.sampleView,       color: '#10b981' },
          ].map(s => (
            <Col xs={12} sm={6} key={s.label}>
              <Card bordered={false} style={{ borderRadius: 10, background: s.color + '15', border: `1px solid ${s.color}30`, textAlign: 'center', padding: '4px 0' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Filters */}
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilterOutlined style={{ color: THEME }} />
            <Text style={{ fontWeight: 700, color: '#374151' }}>Filters</Text>
            {activeFilterCount > 0 && (
              <Tag color="purple" style={{ borderRadius: 10 }}>{activeFilterCount} active</Tag>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button size="small" icon={<ClearOutlined />} onClick={clearFilters} style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}>
              Clear All
            </Button>
          )}
        </div>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={6}>
            <Input prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} placeholder="Search by name, key, description…"
              value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ borderRadius: 8 }} />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select placeholder="Doc Type" allowClear style={{ width: '100%' }} value={filterType || undefined} onChange={v => setFilterType(v || '')}>
              <Option value="direct_upload">Direct Upload</Option>
              <Option value="template_download">Template Download</Option>
              <Option value="sample_view">Sample View</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select placeholder="Category" allowClear style={{ width: '100%' }} value={filterCat || undefined} onChange={v => setFilterCat(v || '')}>
              {CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select placeholder="Employment" allowClear style={{ width: '100%' }} value={filterEmp || undefined} onChange={v => setFilterEmp(v || '')}>
              {EMP_TYPES.map(e => <Option key={e} value={e}>{e}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select placeholder="Residency" allowClear style={{ width: '100%' }} value={filterRes || undefined} onChange={v => setFilterRes(v || '')}>
              {RES_TYPES.map(r => <Option key={r} value={r}>{r}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select placeholder="Mortgage" allowClear style={{ width: '100%' }} value={filterMtg || undefined} onChange={v => setFilterMtg(v || '')}>
              {MTG_TYPES.map(m => <Option key={m} value={m}>{m}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={2}>
            <Select placeholder="Required" allowClear style={{ width: '100%' }} value={filterMand === '' ? undefined : filterMand} onChange={v => setFilterMand(v ?? '')}>
              <Option value="true">Mandatory</Option>
              <Option value="false">Optional</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={1}>
            <Button icon={<ReloadOutlined />} onClick={fetchDocs} style={{ borderRadius: 8, width: '100%' }} />
          </Col>
        </Row>
      </Card>

      {/* Results count */}
      {!loading && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ color: '#64748b', fontWeight: 600 }}>
            Showing <strong>{docs.length}</strong> global document{docs.length !== 1 ? 's' : ''}
          </Text>
        </div>
      )}

      {/* List */}
      {loading
        ? <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
        : docs.length === 0
          ? <Card style={{ borderRadius: 14, textAlign: 'center', padding: '50px 0', border: '1px dashed #cbd5e1' }}>
              <GlobalOutlined style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 12 }} />
              <Empty description="No global documents match your filters." />
              {activeFilterCount > 0 && (
                <Button style={{ marginTop: 14 }} onClick={clearFilters} icon={<ClearOutlined />}>Clear Filters</Button>
              )}
            </Card>
          : <div>
              {docs.map((doc, idx) => (
                <React.Fragment key={doc._id}>
                  <DocCard doc={doc} onEdit={id => navigate(`/dashboard/vault-admin/documents/manage/${id}`)} onDelete={handleDelete} screens={screens} />
                  {idx < docs.length - 1 && <Divider style={{ margin: '14px 0', borderColor: '#e2e8f0' }} />}
                </React.Fragment>
              ))}
            </div>
      }
    </div>
  );
};

export default GlobalDocumentLibrary;
