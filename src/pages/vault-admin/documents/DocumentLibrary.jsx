import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/api/apiService';
import {
  Avatar, Badge, Button, Card, Col, Divider, Empty, Popconfirm,
  Row, Select, Space, Spin, Tag, Typography, message,
  Input, Tooltip, Grid, Statistic, Tabs,
} from 'antd';
import {
  BankOutlined, CheckCircleOutlined, CloudDownloadOutlined,
  DeleteOutlined, EditOutlined, EyeOutlined,
  GlobalOutlined, PlusOutlined, SearchOutlined, UploadOutlined,
  FileTextOutlined, LeftOutlined, RightOutlined, ReloadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option }      = Select;
const { useBreakpoint } = Grid;

const THEME    = '#5C039B';
const GRADIENT = 'linear-gradient(135deg,#5C039B,#03A4F4)';

/* ── config maps ── */
const DOC_TYPE_CFG = {
  direct_upload:    { label:'Direct Upload',    color:THEME,     icon:<UploadOutlined />,        bg:'#f5f0ff' },
  template_download:{ label:'Template Download', color:'#03A4F4', icon:<CloudDownloadOutlined />, bg:'#f0f9ff' },
  sample_view:      { label:'Sample View',       color:'#10b981', icon:<EyeOutlined />,           bg:'#f0fdf4' },
};
const CAT_COLOR = {
  Identity:'purple', Income:'blue', Banking:'cyan', Business:'gold',
  Property:'green', Tax:'orange', Compliance:'red', Insurance:'magenta',
  'Bank Form':'volcano', Information:'geekblue', Other:'default',
};

/* ── sub-components ── */
const InfoLine = ({ label, value }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:'1px dashed #f1f5f9' }}>
    <Text style={{ fontSize:11, color:'#94a3b8', fontWeight:600, flexShrink:0, marginRight:6 }}>{label}</Text>
    <Text style={{ fontSize:12, color:'#1e293b', fontWeight:700, textAlign:'right' }}>{value ?? '—'}</Text>
  </div>
);
const ColHead = ({ children }) => (
  <div style={{ fontSize:10, color:THEME, textTransform:'uppercase', fontWeight:800, letterSpacing:1, marginBottom:8, paddingBottom:4, borderBottom:`2px solid ${THEME}` }}>
    {children}
  </div>
);
const StatCard = ({ label, value, color }) => (
  <Card bordered={false} style={{ borderRadius:10, background:color+'15', border:`1px solid ${color}30`, textAlign:'center', padding:'4px 0' }}>
    <div style={{ fontSize:22, fontWeight:800, color }}>{value}</div>
    <div style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>{label}</div>
  </Card>
);

/* ═══════════════════════════════════════════════════════
   DOCUMENT CARD — full-width horizontal row
════════════════════════════════════════════════════════ */
const DocCard = ({ doc, onEdit, onDelete, screens }) => {
  const tc     = DOC_TYPE_CFG[doc.documentType] || DOC_TYPE_CFG.direct_upload;
  const isTpl  = doc.documentType === 'template_download';
  const isSmp  = doc.documentType === 'sample_view';

  return (
    <Card bordered={false} bodyStyle={{ padding:0 }}
      style={{ borderRadius:14, overflow:'hidden', boxShadow:'0 2px 14px rgba(0,0,0,0.06)', border:'1px solid #e8edf4' }}>
      <div style={{ height:4, background: doc.status === 'Active' ? GRADIENT : '#cbd5e1' }} />

      <div style={{ padding: screens.md ? '16px 22px' : '14px' }}>

        {/* ── Header row ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10, marginBottom:12 }}>
          <Space size={12} align="flex-start">
            <div style={{ width:44, height:44, borderRadius:10, background:tc.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:tc.color, flexShrink:0 }}>
              {tc.icon}
            </div>
            <div>
              <Title level={5} style={{ margin:0, color:'#1e293b', fontWeight:800, lineHeight:1.2 }}>{doc.documentName}</Title>
              <Text style={{ fontSize:11, color:'#94a3b8' }}>{doc.documentKey}</Text>
              {doc.description && <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{doc.description}</div>}
            </div>
          </Space>

          <Space size={5} wrap align="center">
            <Tag style={{ borderRadius:6, fontWeight:700, fontSize:11, margin:0, background:tc.bg, color:tc.color, border:`1px solid ${tc.color}40` }}>
              {tc.icon} {tc.label}
            </Tag>
            <Tag color={CAT_COLOR[doc.category] || 'default'} style={{ borderRadius:6, fontWeight:600, fontSize:11, margin:0 }}>{doc.category}</Tag>
            <Tag color={doc.isMandatory ? 'red' : 'default'} style={{ borderRadius:6, fontWeight:600, fontSize:11, margin:0 }}>
              {doc.isMandatory ? 'Mandatory' : 'Optional'}
            </Tag>
            <Badge status={doc.status === 'Active' ? 'success' : 'default'}
              text={<Text style={{ fontSize:12, fontWeight:600, color: doc.status === 'Active' ? '#059669' : '#6b7280' }}>{doc.status}</Text>} />

            {isTpl && doc.template?.fileUrl && (
              <Tooltip title="Download Template">
                <Button size="small" icon={<CloudDownloadOutlined />}
                  onClick={() => window.open(doc.template.fileUrl, '_blank')}
                  style={{ borderRadius:6, borderColor:'#03A4F4', color:'#03A4F4', background:'#f0f9ff', fontWeight:600 }}>
                  Template
                </Button>
              </Tooltip>
            )}
            {isSmp && doc.sampleDocument?.fileUrl && (
              <Tooltip title="View Sample">
                <Button size="small" icon={<EyeOutlined />}
                  onClick={() => window.open(doc.sampleDocument.fileUrl, '_blank')}
                  style={{ borderRadius:6, borderColor:'#10b981', color:'#10b981', background:'#f0fdf4', fontWeight:600 }}>
                  Sample
                </Button>
              </Tooltip>
            )}

            <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(doc._id)}
              style={{ background:THEME, border:'none', borderRadius:8, height:34, fontWeight:700, fontSize:12 }}>
              Edit
            </Button>
            <Popconfirm title="Delete this document?" description="This cannot be undone."
              onConfirm={() => onDelete(doc._id)} okText="Delete" okButtonProps={{ danger:true }} cancelText="Cancel">
              <Button danger icon={<DeleteOutlined />} style={{ borderRadius:8, height:34, fontWeight:600 }}>Delete</Button>
            </Popconfirm>
          </Space>
        </div>

        <Divider style={{ margin:'0 0 12px' }} />

        {/* ── Detail columns ── */}
        <Row gutter={[0,0]}>

          {/* Col 1 — Validation */}
          <Col xs={24} sm={12} md={5}>
            <div style={{ paddingRight: screens.md ? 18 : 0, marginBottom: screens.md ? 0 : 14 }}>
              <ColHead>Validation Rules</ColHead>
              <InfoLine label="Mandatory"      value={doc.isMandatory ? '✅ Yes' : '❌ No'} />
              <InfoLine label="Front & Back"   value={doc.requiresFrontBack ? 'Yes' : 'No'} />
              <InfoLine label="Translation"    value={doc.requiresTranslation ? 'Yes' : 'No'} />
              <InfoLine label="Attestation"    value={doc.requiresAttestation ? 'Yes' : 'No'} />
              <InfoLine label="Signature"      value={doc.requiresSignature ? 'Yes' : 'No'} />
              <InfoLine label="Stamp"          value={doc.requiresStamp ? 'Yes' : 'No'} />
            </div>
          </Col>

          {screens.md && <Col md={1}><Divider type="vertical" style={{ height:'100%', margin:'0 auto', display:'block' }} /></Col>}

          {/* Col 2 — File rules */}
          <Col xs={24} sm={12} md={4}>
            <div style={{ paddingLeft: screens.md ? 14 : 0, paddingRight: screens.md ? 14 : 0, marginBottom: screens.md ? 0 : 14 }}>
              <ColHead>File Rules</ColHead>
              <InfoLine label="Multiple Files" value={doc.allowMultipleFiles ? `Yes (max ${doc.maxFilesAllowed})` : 'No'} />
              <InfoLine label="Max Size"       value={`${doc.maxFileSizeMB} MB`} />
              <InfoLine label="File Types"     value={(doc.allowedFileTypes||[]).map(t=>`.${t}`).join(', ')||'—'} />
              <InfoLine label="Order"          value={doc.displayOrder} />
              <InfoLine label="Scope"          value={doc.isGlobal ? '🌐 Global' : '🏦 Bank-Specific'} />
            </div>
          </Col>

          {screens.md && <Col md={1}><Divider type="vertical" style={{ height:'100%', margin:'0 auto', display:'block' }} /></Col>}

          {/* Col 3 — Applicability */}
          <Col xs={24} sm={12} md={5}>
            <div style={{ paddingLeft: screens.md ? 14 : 0, paddingRight: screens.md ? 14 : 0, marginBottom: screens.md ? 0 : 14 }}>
              <ColHead>Applicability</ColHead>
              {[
                { label:'Employment', items: doc.applicableEmploymentTypes||[], color:undefined },
                { label:'Residency',  items: doc.applicableResidencyStatuses||[], color:'blue' },
                { label:'Mortgage',   items: doc.applicableMortgageTypes||[], color:'purple' },
              ].map(({ label, items, color }) => (
                <div key={label} style={{ padding:'4px 0', borderBottom:'1px dashed #f1f5f9' }}>
                  <Text style={{ fontSize:11, color:'#94a3b8', fontWeight:600, display:'block', marginBottom:3 }}>{label}</Text>
                  <Space wrap size={[3,3]}>
                    {items.map(v => <Tag key={v} color={color} style={{ margin:0, fontSize:10, borderRadius:4 }}>{v}</Tag>)}
                  </Space>
                </div>
              ))}
            </div>
          </Col>

          {screens.md && <Col md={1}><Divider type="vertical" style={{ height:'100%', margin:'0 auto', display:'block' }} /></Col>}

          {/* Col 4 — Template / Sample / Upload info */}
          <Col xs={24} sm={12} md={4}>
            <div style={{ paddingLeft: screens.md ? 14 : 0, paddingRight: screens.md ? 14 : 0, marginBottom: screens.md ? 0 : 14 }}>
              {isTpl && (
                <>
                  <ColHead>Template Info</ColHead>
                  <InfoLine label="Version"       value={doc.template?.version||'—'} />
                  <InfoLine label="Fillable"       value={doc.template?.hasFillableFields ? 'Yes' : 'No'} />
                  <InfoLine label="Req. Signature" value={doc.template?.requiresSignature ? 'Yes' : 'No'} />
                  <InfoLine label="Req. Stamp"     value={doc.template?.requiresCompanyStamp ? 'Yes' : 'No'} />
                  {doc.template?.fileUrl && (
                    <a href={doc.template.fileUrl} target="_blank" rel="noreferrer"
                      style={{ fontSize:11, color:'#03A4F4', display:'flex', alignItems:'center', gap:4, marginTop:6 }}>
                      <CloudDownloadOutlined /> Download Template
                    </a>
                  )}
                </>
              )}
              {isSmp && (
                <>
                  <ColHead>Sample Info</ColHead>
                  {doc.sampleDocument?.description && (
                    <div style={{ fontSize:12, color:'#64748b', marginBottom:6 }}>{doc.sampleDocument.description}</div>
                  )}
                  {doc.sampleDocument?.fileUrl && (
                    <a href={doc.sampleDocument.fileUrl} target="_blank" rel="noreferrer"
                      style={{ fontSize:11, color:'#10b981', display:'flex', alignItems:'center', gap:4 }}>
                      <EyeOutlined /> View Sample
                    </a>
                  )}
                </>
              )}
              {!isTpl && !isSmp && (
                <>
                  <ColHead>Upload Info</ColHead>
                  <div style={{ textAlign:'center', padding:'14px 0', color:'#94a3b8' }}>
                    <UploadOutlined style={{ fontSize:22, color:THEME, marginBottom:5 }} />
                    <div style={{ fontSize:12 }}>Customer uploads directly</div>
                  </div>
                </>
              )}
            </div>
          </Col>

          {screens.md && <Col md={1}><Divider type="vertical" style={{ height:'100%', margin:'0 auto', display:'block' }} /></Col>}

          {/* Col 5 — Instructions */}
          <Col xs={24} md={8}>
            <div style={{ paddingLeft: screens.md ? 14 : 0 }}>
              <ColHead>Instructions & UI Text</ColHead>
              {doc.placeholderText && <InfoLine label="Placeholder" value={doc.placeholderText} />}
              {doc.helperText      && <InfoLine label="Helper"      value={doc.helperText} />}
              {doc.instructions && (
                <div style={{ marginTop:6 }}>
                  <Text style={{ fontSize:11, color:'#94a3b8', fontWeight:600, display:'block', marginBottom:4 }}>Steps</Text>
                  {doc.instructions.split('\n').filter(Boolean).map((line, i) => (
                    <div key={i} style={{ display:'flex', gap:5, padding:'2px 0' }}>
                      <CheckCircleOutlined style={{ color:'#10b981', fontSize:11, marginTop:2, flexShrink:0 }} />
                      <Text style={{ fontSize:12, color:'#374151' }}>{line}</Text>
                    </div>
                  ))}
                </div>
              )}
              {!doc.placeholderText && !doc.helperText && !doc.instructions && (
                <Text style={{ fontSize:12, color:'#cbd5e1' }}>No display text configured</Text>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

/* ── Section list with dividers ── */
const DocList = ({ docs, onEdit, onDelete, screens }) => (
  <div>
    {docs.map((doc, idx) => (
      <React.Fragment key={doc._id}>
        <DocCard doc={doc} onEdit={onEdit} onDelete={onDelete} screens={screens} />
        {idx < docs.length - 1 && <Divider style={{ margin:'14px 0', borderColor:'#e2e8f0' }} />}
      </React.Fragment>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════
   GLOBAL PAGE
════════════════════════════════════════════════════════ */
const GlobalDocPage = ({ navigate, screens }) => {
  const [docs,      setDocs]      = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [filterType,setFilterType]= useState('');
  const [search,    setSearch]    = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.documentType = filterType;
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
    } catch { message.error('Failed to load global documents'); }
    finally { setLoading(false); }
  }, [filterType, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    try {
      await apiService.delete(`bank/documents/${id}`);
      message.success('Document deleted');
      fetch();
    } catch { message.error('Delete failed'); }
  };

  return (
    <div>
      {/* Stats */}
      {summary && (
        <Row gutter={[12,12]} style={{ marginBottom:20 }}>
          {[
            { label:'Total Global',       value: summary.total,           color: THEME },
            { label:'Direct Upload',      value: summary.directUpload,    color: '#5C039B' },
            { label:'Template Download',  value: summary.templateDownload,color: '#03A4F4' },
            { label:'Sample View',        value: summary.sampleView,      color: '#10b981' },
          ].map(s => (
            <Col xs={12} sm={6} key={s.label}>
              <StatCard {...s} />
            </Col>
          ))}
        </Row>
      )}

      {/* Filters */}
      <Card bordered={false} style={{ borderRadius:12, marginBottom:18, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <Space wrap size={12}>
          <Input prefix={<SearchOutlined style={{ color:'#94a3b8' }} />} placeholder="Search…"
            value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ width:220, borderRadius:8 }} />
          <Select placeholder="All Types" allowClear style={{ width:180 }} value={filterType||undefined} onChange={v => setFilterType(v||'')}>
            <Option value="direct_upload">Direct Upload</Option>
            <Option value="template_download">Template Download</Option>
            <Option value="sample_view">Sample View</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetch} style={{ borderRadius:8 }} />
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/vault-admin/documents/manage')}
            style={{ background:GRADIENT, border:'none', borderRadius:8, fontWeight:700 }}>
            Add Global Document
          </Button>
        </Space>
      </Card>

      {/* List */}
      {loading
        ? <div style={{ textAlign:'center', padding:'60px 0' }}><Spin size="large" /></div>
        : docs.length === 0
          ? <Card style={{ borderRadius:14, textAlign:'center', padding:'50px 0', border:'1px dashed #cbd5e1' }}>
              <Empty description="No global documents found." />
            </Card>
          : <DocList docs={docs} onEdit={id => navigate(`/dashboard/vault-admin/documents/manage/${id}`)} onDelete={handleDelete} screens={screens} />
      }
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   BANK-SPECIFIC PAGE
════════════════════════════════════════════════════════ */
const BankDocPage = ({ navigate, screens }) => {
  const [banks,        setBanks]        = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankInfo,     setBankInfo]     = useState(null);
  const [globalDocs,   setGlobalDocs]   = useState([]);
  const [bankDocs,     setBankDocs]     = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [filterEmp,    setFilterEmp]    = useState('');
  const [filterRes,    setFilterRes]    = useState('');
  const [filterMand,   setFilterMand]   = useState('');

  /* fetch bank list */
  useEffect(() => {
    apiService.get('bank', { limit:100 }).then(res => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setBanks(list);
    }).catch(() => {});
  }, []);

  /* fetch bank documents */
  const fetch = useCallback(async () => {
    if (!selectedBank) return;
    setLoading(true);
    try {
      const params = {};
      if (filterEmp)  params.employmentType    = filterEmp;
      if (filterRes)  params.residencyStatus   = filterRes;
      if (filterMand !== '') params.isMandatory = filterMand;

      const res = await apiService.get(`bank/documents/bank/${selectedBank}`, params);
      if (res?.success) {
        setBankInfo(res.bank || null);
        setGlobalDocs(res.data?.global || []);
        setBankDocs(res.data?.bankSpecific || []);
        setSummary(res.summary || null);
      }
    } catch { message.error('Failed to load bank documents'); }
    finally { setLoading(false); }
  }, [selectedBank, filterEmp, filterRes, filterMand]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    try {
      await apiService.delete(`bank/documents/${id}`);
      message.success('Document deleted');
      fetch();
    } catch { message.error('Delete failed'); }
  };
  const handleEdit = (id) => navigate(`/dashboard/vault-admin/documents/manage/${id}`);

  return (
    <div>
      {/* Bank selector */}
      <Card bordered={false} style={{ borderRadius:12, marginBottom:18, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <Space wrap size={12} align="center">
          <Select placeholder="🏦  Select a bank…" size="large" style={{ width:280, borderRadius:8 }}
            value={selectedBank} onChange={v => { setSelectedBank(v); setBankInfo(null); setGlobalDocs([]); setBankDocs([]); setSummary(null); }}
            allowClear showSearch optionFilterProp="children">
            {banks.map(b => (
              <Option key={b._id} value={b._id}>
                <Space>
                  <Avatar src={b.logo} icon={<BankOutlined />} size={18} shape="square" style={{ borderRadius:3 }} />
                  {b.bankName} ({b.bankCode})
                </Space>
              </Option>
            ))}
          </Select>

          {selectedBank && (
            <>
              <Select placeholder="Employment" allowClear style={{ width:150 }} value={filterEmp||undefined} onChange={v => setFilterEmp(v||'')}>
                {['Salaried','Self-Employed','Both'].map(e => <Option key={e} value={e}>{e}</Option>)}
              </Select>
              <Select placeholder="Residency" allowClear style={{ width:160 }} value={filterRes||undefined} onChange={v => setFilterRes(v||'')}>
                {['UAE National','UAE Resident','Non-Resident','All'].map(r => <Option key={r} value={r}>{r}</Option>)}
              </Select>
              <Select placeholder="Mandatory" allowClear style={{ width:130 }} value={filterMand==='' ? undefined : filterMand} onChange={v => setFilterMand(v ?? '')}>
                <Option value="true">Mandatory Only</Option>
                <Option value="false">Optional Only</Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={fetch} style={{ borderRadius:8 }} />
            </>
          )}

          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/vault-admin/documents/manage')}
            style={{ background:GRADIENT, border:'none', borderRadius:8, fontWeight:700 }}>
            Add Document
          </Button>
        </Space>
      </Card>

      {/* No bank selected */}
      {!selectedBank && (
        <Card style={{ borderRadius:14, textAlign:'center', padding:'60px 0', border:'1px dashed #cbd5e1' }}>
          <BankOutlined style={{ fontSize:48, color:'#cbd5e1', marginBottom:16 }} />
          <div style={{ fontSize:16, color:'#94a3b8', fontWeight:600 }}>Select a bank above to view its documents</div>
        </Card>
      )}

      {/* Loading */}
      {selectedBank && loading && <div style={{ textAlign:'center', padding:'60px 0' }}><Spin size="large" /></div>}

      {/* Bank info + stats */}
      {!loading && bankInfo && (
        <>
          <Card bordered={false} bodyStyle={{ padding:'16px 20px' }}
            style={{ borderRadius:14, marginBottom:16, background:`linear-gradient(90deg,${THEME}08,#03A4F408)`, border:`1px solid ${THEME}20` }}>
            <Row gutter={[24, 12]} align="middle">
              <Col xs={24} sm={12}>
                <Space size={14} align="center">
                  <Avatar src={bankInfo.logo} icon={<BankOutlined />} shape="square" size={52}
                    style={{ borderRadius:10, border:'2px solid #f0f0f0', background:'#fff' }} />
                  <div>
                    <Title level={4} style={{ margin:0, color:THEME }}>{bankInfo.bankName}</Title>
                    <Text style={{ color:'#64748b', fontWeight:600 }}>{bankInfo.bankCode}</Text>
                  </div>
                </Space>
              </Col>
              {summary && (
                <Col xs={24} sm={12}>
                  <Row gutter={[10,10]}>
                    {[
                      { label:'Total',       value:summary.total,       color:THEME },
                      { label:'Global',      value:summary.global,      color:'#64748b' },
                      { label:'Bank-Specific',value:summary.bankSpecific,color:'#03A4F4' },
                      { label:'Mandatory',   value:summary.mandatory,   color:'#ef4444' },
                    ].map(s => (
                      <Col xs={12} sm={6} key={s.label}>
                        <div style={{ textAlign:'center', background:'#fff', borderRadius:8, padding:'6px 4px', border:'1px solid #f1f5f9' }}>
                          <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
                          <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>{s.label}</div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Col>
              )}
            </Row>
          </Card>

          {/* ── Section A: Global documents ── */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:4, height:24, borderRadius:2, background:GRADIENT }} />
              <Title level={4} style={{ margin:0, color:'#1e293b' }}>
                🌐 Global Documents
                <Tag color="default" style={{ marginLeft:10, fontWeight:600, borderRadius:6 }}>{globalDocs.length}</Tag>
              </Title>
              <Text type="secondary" style={{ fontSize:13 }}>Apply to all banks — shown here for reference</Text>
            </div>

            {globalDocs.length === 0
              ? <Card style={{ borderRadius:12, textAlign:'center', padding:'30px 0', border:'1px dashed #e2e8f0' }}>
                  <Text type="secondary">No global documents match the selected filters.</Text>
                </Card>
              : <DocList docs={globalDocs} onEdit={handleEdit} onDelete={handleDelete} screens={screens} />
            }
          </div>

          <Divider style={{ margin:'24px 0' }}>
            <Tag color="purple" style={{ fontWeight:700, borderRadius:8, padding:'2px 12px' }}>Bank-Specific Documents Below</Tag>
          </Divider>

          {/* ── Section B: Bank-specific documents ── */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:4, height:24, borderRadius:2, background:'linear-gradient(180deg,#03A4F4,#5C039B)' }} />
              <Title level={4} style={{ margin:0, color:'#1e293b' }}>
                🏦 {bankInfo.bankName} Specific Documents
                <Tag color="blue" style={{ marginLeft:10, fontWeight:600, borderRadius:6 }}>{bankDocs.length}</Tag>
              </Title>
              <Button size="small" icon={<PlusOutlined />}
                onClick={() => navigate('/dashboard/vault-admin/documents/manage')}
                style={{ borderRadius:6, borderColor:THEME, color:THEME, fontWeight:600 }}>
                Add Bank Document
              </Button>
            </div>

            {bankDocs.length === 0
              ? <Card style={{ borderRadius:12, textAlign:'center', padding:'40px 0', border:'1px dashed #e2e8f0' }}>
                  <FileTextOutlined style={{ fontSize:36, color:'#cbd5e1', marginBottom:12 }} />
                  <div style={{ color:'#94a3b8', fontWeight:600 }}>No bank-specific documents for {bankInfo.bankName}.</div>
                  <Button type="primary" icon={<PlusOutlined />} size="small"
                    onClick={() => navigate('/dashboard/vault-admin/documents/manage')}
                    style={{ marginTop:14, background:THEME, borderRadius:8 }}>
                    Add First Bank Document
                  </Button>
                </Card>
              : <DocList docs={bankDocs} onEdit={handleEdit} onDelete={handleDelete} screens={screens} />
            }
          </div>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   ROOT COMPONENT
════════════════════════════════════════════════════════ */
const DocumentLibrary = () => {
  const navigate = useNavigate();
  const screens  = useBreakpoint();
  const [mode, setMode] = useState('global'); // 'global' | 'bank'

  return (
    <div style={{ padding: screens.md ? '24px' : '12px', background:'#f8fafc', minHeight:'100vh' }}>

      {/* ── Page header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:22 }}>
        <div>
          <Title level={2} style={{ margin:0, color:'#1e293b', fontWeight:800 }}>Document Library</Title>
          <Text type="secondary">Manage mortgage document requirements — global and bank-specific</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => navigate('/dashboard/vault-admin/documents/manage')}
          style={{ background:GRADIENT, border:'none', borderRadius:8, height:40, padding:'0 20px', fontWeight:700 }}>
          Add Document
        </Button>
      </div>

      <style>{`
        .custom-doc-library-tabs .ant-tabs-nav {
          margin-bottom: 24px !important;
        }
        .custom-doc-library-tabs .ant-tabs-tab {
          background: transparent !important;
          border: 1px solid #E5E7EB !important;
          border-bottom: none !important;
          border-radius: 8px 8px 0 0 !important;
          margin-right: 6px !important;
          padding: 6px 16px !important;
          transition: all 0.2s !important;
        }
        .custom-doc-library-tabs .ant-tabs-tab-btn {
          color: #6B7280 !important;
        }
        .custom-doc-library-tabs .ant-tabs-tab-active {
          background: #FFFFFF !important;
          border-color: #E5E7EB !important;
          border-bottom-color: #FFFFFF !important;
        }
        .custom-doc-library-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #5C039B !important;
        }
        .custom-doc-library-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn {
          color: #7C3AED !important;
        }
        .custom-doc-library-tabs .ant-tabs-nav-operations {
          display: none !important;
        }
      `}</style>

      {/* ── Mode toggle ── */}
      <Tabs
        activeKey={mode}
        onChange={setMode}
        type="card"
        className="custom-doc-library-tabs"
        items={[
          {
            key: 'global',
            label: (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>🌐 Global Documents</span>
                <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 500, marginTop: 1 }}>Apply to all banks</span>
              </div>
            ),
          },
          {
            key: 'bank',
            label: (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>🏦 Bank-Specific</span>
                <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 500, marginTop: 1 }}>Specific to one bank</span>
              </div>
            ),
          },
        ]}
      />

      {/* ── Content ── */}
      {mode === 'global'
        ? <GlobalDocPage navigate={navigate} screens={screens} />
        : <BankDocPage   navigate={navigate} screens={screens} />
      }
    </div>
  );
};

export default DocumentLibrary;
