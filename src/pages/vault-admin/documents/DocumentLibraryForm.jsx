import React, { useState, useEffect } from 'react';
import { apiService } from '@/api/apiService';
import {
  Button, Form, Input, InputNumber, Select, Row, Col, Divider,
  Typography, Card, Space, Switch, Upload, notification, message, Avatar, Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, UploadOutlined,
  FileTextOutlined, TeamOutlined, AppstoreOutlined,
  CheckCircleOutlined, CloudUploadOutlined, EyeOutlined, BankOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PRIMARY  = '#5C039B';
const GRADIENT = 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)';

const TABS = [
  { key: '1', label: 'Basic Info',     icon: <FileTextOutlined /> },
  { key: '2', label: 'Files & Upload', icon: <CloudUploadOutlined /> },
  { key: '3', label: 'Applicability',  icon: <TeamOutlined /> },
  { key: '4', label: 'Validation',     icon: <CheckCircleOutlined /> },
  { key: '5', label: 'Display',        icon: <AppstoreOutlined /> },
];

const CATEGORIES = ['Identity','Income','Banking','Business','Property','Tax','Compliance','Insurance','Bank Form','Information','Other'];
const EMP_TYPES  = ['Salaried','Self-Employed','Both'];
const RES_STATUS = ['UAE National','UAE Resident','Non-Resident','All'];
const MTG_TYPES  = ['Islamic','Conventional','Both'];
const FILE_TYPES = ['pdf','jpg','jpeg','png','doc','docx'];
const DOC_TYPES  = [
  { value: 'direct_upload',    label: 'Direct Upload',    desc: 'Customer uploads directly (Passport, EID)' },
  { value: 'template_download',label: 'Template Download',desc: 'Download form, fill, then upload back' },
  { value: 'sample_view',      label: 'Sample View',      desc: 'View-only reference document, no upload' },
];

const cardStyle = { borderRadius: 14, boxShadow: '0 2px 12px rgba(92,3,155,0.07)', marginBottom: 16, border: '1px solid #f0e8ff' };

const DocumentLibraryForm = ({ mode = 'create', editData = null, onBack, onSuccess, scopeMode = undefined, defaultBankIds = [] }) => {
  const [form]        = Form.useForm();
  const [loading,    setLoading]    = useState(false);
  const [activeTab,  setActiveTab]  = useState('1');
  const [banks,      setBanks]      = useState([]);
  const [docType,    setDocType]    = useState('direct_upload');
  const [isGlobal,   setIsGlobal]   = useState(scopeMode !== 'bank');
  const [allowMulti, setAllowMulti] = useState(false);

  /* file states */
  const [templateFile, setTemplateFile] = useState([]);
  const [sampleFile,   setSampleFile]   = useState([]);
  const [templateUrl,  setTemplateUrl]  = useState('');
  const [sampleUrl,    setSampleUrl]    = useState('');

  const isEdit = mode === 'edit' && editData;

  /* watch required fields for button disable logic */
  const watchedName     = Form.useWatch('documentName',  form);
  const watchedKey      = Form.useWatch('documentKey',   form);
  const watchedCategory = Form.useWatch('category',      form);
  const watchedBanks    = Form.useWatch('applicableBanks', form);

  const tab1Valid = !!watchedName?.trim() && !!watchedKey?.trim() && !!watchedCategory;
  const scopeValid = scopeMode === 'global'
    ? true
    : scopeMode === 'bank'
      ? (Array.isArray(watchedBanks) && watchedBanks.length > 0)
      : (isGlobal || (Array.isArray(watchedBanks) && watchedBanks.length > 0));
  const canSubmit  = tab1Valid && scopeValid;

  /* auto-generate documentKey from documentName */
  const handleNameChange = (e) => {
    if (!isEdit) {
      const key = e.target.value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      form.setFieldValue('documentKey', key);
    }
  };

  /* fetch banks */
  useEffect(() => {
    apiService.get('bank', { limit: 100 }).then((res) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setBanks(list);
    }).catch(() => {});
  }, []);

  /* pre-fill bank when adding bank-specific doc */
  useEffect(() => {
    if (defaultBankIds?.length && !isEdit) {
      form.setFieldValue('isGlobal', false);
      form.setFieldValue('applicableBanks', defaultBankIds);
    }
  }, [defaultBankIds, isEdit, form]);

  /* populate edit data */
  useEffect(() => {
    if (isEdit && editData) {
      form.setFieldsValue({
        ...editData,
        applicableBanks: editData.applicableBanks?.map((b) => b._id || b) || [],
      });
      setDocType(editData.documentType || 'direct_upload');
      setIsGlobal(editData.isGlobal !== false);
      setAllowMulti(editData.allowMultipleFiles || false);
      if (editData.template?.fileUrl) setTemplateUrl(editData.template.fileUrl);
      if (editData.sampleDocument?.fileUrl) setSampleUrl(editData.sampleDocument.fileUrl);
    }
  }, [editData, isEdit, form]);

  /* generic file uploader */
  const makeUploader = (onUrlSet, setFileList) => ({
    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
    maxCount: 1,
    fileList: undefined,
    beforeUpload: () => false,
    onChange: async ({ file }) => {
      const fd = new FormData();
      fd.append('file', file);
      setFileList([{ uid: file.uid, name: file.name, status: 'uploading' }]);
      try {
        const res = await apiService.upload('upload', fd);
        const url = res?.file?.url || res?.url || res;
        onUrlSet(String(url));
        setFileList([{ uid: file.uid, name: file.name, status: 'done', url: String(url) }]);
        message.success('File uploaded successfully');
      } catch {
        setFileList([]);
        message.error('Upload failed');
      }
    },
  });

  const templateUploader = makeUploader(setTemplateUrl, setTemplateFile);
  const sampleUploader   = makeUploader(setSampleUrl,   setSampleFile);

  const handleSave = async (values) => {
    if (loading) return;

    /* inject uploaded file URLs into payload */
    const payload = { ...values };
    if (docType === 'template_download' && templateUrl) {
      payload.template = { ...payload.template, fileUrl: templateUrl };
    }
    if (docType === 'sample_view' && sampleUrl) {
      payload.sampleDocument = { ...payload.sampleDocument, fileUrl: sampleUrl };
    }

    setLoading(true);
    try {
      if (isEdit) {
        await apiService.put(`bank/documents/${editData._id}`, payload);
        notification.success({ message: 'Document Updated!', description: 'Changes saved.' });
      } else {
        await apiService.post('bank/documents', payload);
        notification.success({ message: 'Document Created!', description: 'Added to library.' });
      }
      onSuccess?.();
    } catch (err) {
      notification.error({ message: 'Failed', description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const activeIdx = TABS.findIndex((t) => t.key === activeTab);

  const goNext = async () => {
    /* validate required fields on Tab 1 before moving forward */
    if (activeTab === '1') {
      try {
        await form.validateFields(['documentName', 'documentKey', 'category']);
      } catch {
        return; /* stop — Ant Design shows inline errors */
      }
    }
    setActiveTab(TABS[Math.min(activeIdx + 1, TABS.length - 1)].key);
  };

  const goPrev = () => setActiveTab(TABS[Math.max(activeIdx - 1, 0)].key);

  const typeIcon = { direct_upload: <UploadOutlined />, template_download: <CloudUploadOutlined />, sample_view: <EyeOutlined /> };
  const typeColor = { direct_upload: '#5C039B', template_download: '#03A4F4', sample_view: '#10b981' };

  return (
    <div style={{ background: '#f5f3ff', minHeight: '100vh', paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div style={{ background: GRADIENT, padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8 }}>
          Back
        </Button>
        <div style={{ flex: 1 }}>
          <Title level={3} style={{ margin: 0, color: '#fff', fontWeight: 800 }}>
            {isEdit ? 'Edit Document'
              : scopeMode === 'global' ? 'Add Global Document'
              : scopeMode === 'bank'   ? 'Add Bank-Specific Document'
              : 'Add Document Requirement'}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
            {isEdit ? `Editing: ${editData?.documentName}`
              : scopeMode === 'global' ? 'Create a global document requirement for all banks'
              : scopeMode === 'bank'   ? 'Create a bank-specific document requirement'
              : 'Create a new document requirement for the mortgage library'}
          </Text>
        </div>
      </div>

      {/* ── Tab Nav ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0e8ff', padding: '0 32px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map((t, i) => {
          const active = activeTab === t.key;
          const done   = parseInt(activeTab) > parseInt(t.key);
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: active ? `3px solid ${PRIMARY}` : '3px solid transparent', color: active ? PRIMARY : done ? '#10b981' : '#94a3b8', fontWeight: active ? 700 : 500, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: active ? PRIMARY : done ? '#10b981' : '#f1f5f9', color: active || done ? '#fff' : '#94a3b8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                {done ? '✓' : i + 1}
              </span>
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ documentType: 'direct_upload', isGlobal: scopeMode !== 'bank', status: 'Active', isMandatory: true, allowMultipleFiles: false, maxFilesAllowed: 1, maxFileSizeMB: 10, displayOrder: 0, allowedFileTypes: ['pdf','jpg','jpeg','png'] }}>

          {/* ════════════ TAB 1 : BASIC INFO ════════════ */}
          {activeTab === '1' && (
            <>
              <Card style={cardStyle}>
                <Divider orientation="left" orientationMargin={0} style={{ borderColor: PRIMARY, marginTop: 0 }}>
                  <Text style={{ color: PRIMARY, fontWeight: 700 }}>Document Identity</Text>
                </Divider>
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="documentName" label="Document Name" rules={[{ required: true, message: 'Document name is required' }]}>
                      <Input
                        placeholder="e.g. Valid Passport Copy"
                        size="large"
                        style={{ borderRadius: 8 }}
                        onChange={handleNameChange}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="documentKey"
                      label="Document Key (unique)"
                      rules={[
                        { required: true, message: 'Document key is required' },
                        { pattern: /^[a-z0-9_]+$/, message: 'Only lowercase letters, numbers and underscores' },
                      ]}
                      help={!isEdit ? 'Auto-generated from name — you can edit it' : 'Lowercase, underscore separated'}
                    >
                      <Input placeholder="e.g. passport_copy" size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="description" label="Description">
                      <TextArea rows={2} placeholder="Brief description of this document requirement" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                      <Select size="large" style={{ borderRadius: 8 }} placeholder="Select category">
                        {CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="status" label="Status">
                      <Select size="large" style={{ borderRadius: 8 }}>
                        <Option value="Active">Active</Option>
                        <Option value="Inactive">Inactive</Option>
                        <Option value="Archived">Archived</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="displayOrder" label="Display Order">
                      <InputNumber min={0} size="large" style={{ width: '100%', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Document Type */}
              <Card style={cardStyle}>
                <Divider orientation="left" orientationMargin={0} style={{ borderColor: PRIMARY, marginTop: 0 }}>
                  <Text style={{ color: PRIMARY, fontWeight: 700 }}>Document Type</Text>
                </Divider>
                <Form.Item name="documentType" rules={[{ required: true }]}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {DOC_TYPES.map((dt) => {
                      const selected = docType === dt.value;
                      return (
                        <div key={dt.value} onClick={() => { setDocType(dt.value); form.setFieldValue('documentType', dt.value); }}
                          style={{ flex: 1, minWidth: 180, padding: '16px 20px', borderRadius: 12, border: `2px solid ${selected ? typeColor[dt.value] : '#e2e8f0'}`, background: selected ? `${typeColor[dt.value]}10` : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <div style={{ fontSize: 22, color: typeColor[dt.value], marginBottom: 8 }}>{typeIcon[dt.value]}</div>
                          <div style={{ fontWeight: 700, color: selected ? typeColor[dt.value] : '#374151', marginBottom: 4 }}>{dt.label}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{dt.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </Form.Item>
              </Card>

              {/* Scope */}
              <Card style={cardStyle}>
                <Divider orientation="left" orientationMargin={0} style={{ borderColor: PRIMARY, marginTop: 0 }}>
                  <Text style={{ color: PRIMARY, fontWeight: 700 }}>Scope</Text>
                </Divider>
                {scopeMode === 'global' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: `${PRIMARY}0a`, borderRadius: 10, border: `1px solid ${PRIMARY}20` }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', flexShrink: 0 }}>
                      🌐
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: PRIMARY, fontSize: 15, marginBottom: 2 }}>Global Document</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>This document will apply to all banks and customers</Text>
                    </div>
                  </div>
                ) : scopeMode === 'bank' ? (
                  <Form.Item name="applicableBanks" label="Applicable Banks" rules={[{ required: true, message: 'Select at least one bank' }]}>
                    <Select mode="multiple" size="large" placeholder="Select banks" style={{ borderRadius: 8 }}
                      optionRender={(opt) => (
                        <Space>
                          <Avatar src={opt.data?.logo} icon={<BankOutlined />} size={20} shape="square" style={{ borderRadius: 4 }} />
                          {opt.data?.label}
                        </Space>
                      )}>
                      {banks.map((b) => (
                        <Option key={b._id} value={b._id} logo={b.logo}>{b.bankName} ({b.bankCode})</Option>
                      ))}
                    </Select>
                  </Form.Item>
                ) : (
                  <Row gutter={[16, 0]} align="middle">
                    <Col xs={24} md={12}>
                      <Form.Item name="isGlobal" label="Apply to all banks (Global)" valuePropName="checked">
                        <Switch checked={isGlobal} onChange={(v) => { setIsGlobal(v); form.setFieldValue('isGlobal', v); }}
                          checkedChildren="Global" unCheckedChildren="Bank-Specific"
                          style={{ background: isGlobal ? PRIMARY : '#94a3b8' }} />
                      </Form.Item>
                    </Col>
                    {!isGlobal && (
                      <Col xs={24} md={12}>
                        <Form.Item name="applicableBanks" label="Applicable Banks" rules={[{ required: !isGlobal, message: 'Select at least one bank' }]}>
                          <Select mode="multiple" size="large" placeholder="Select banks" style={{ borderRadius: 8 }}
                            optionRender={(opt) => (
                              <Space>
                                <Avatar src={opt.data?.logo} icon={<BankOutlined />} size={20} shape="square" style={{ borderRadius: 4 }} />
                                {opt.data?.label}
                              </Space>
                            )}>
                            {banks.map((b) => (
                              <Option key={b._id} value={b._id} logo={b.logo}>{b.bankName} ({b.bankCode})</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                )}
              </Card>
            </>
          )}

          {/* ════════════ TAB 2 : FILES & UPLOAD ════════════ */}
          {activeTab === '2' && (
            <Card style={cardStyle}>
              <Divider orientation="left" orientationMargin={0} style={{ borderColor: PRIMARY, marginTop: 0 }}>
                <Text style={{ color: PRIMARY, fontWeight: 700 }}>
                  {docType === 'direct_upload' ? 'Direct Upload — No template or sample needed' : docType === 'template_download' ? 'Template File (users download → fill → upload back)' : 'Sample Document (view-only reference)'}
                </Text>
              </Divider>

              {docType === 'direct_upload' && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <UploadOutlined style={{ fontSize: 48, color: PRIMARY, marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Direct Upload Type</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>Users will upload their own files for this document. No template or sample required here.</div>
                </div>
              )}

              {docType === 'template_download' && (
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 8 }}>Upload Template File</Text>
                      <Upload {...templateUploader} fileList={templateFile}>
                        <Button icon={<CloudUploadOutlined />} size="large" style={{ borderRadius: 8, borderColor: PRIMARY, color: PRIMARY }}>
                          Choose Template File
                        </Button>
                      </Upload>
                      {templateUrl && (
                        <div style={{ marginTop: 10, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircleOutlined style={{ color: '#10b981' }} />
                          <a href={templateUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#059669' }}>Template uploaded — click to preview</a>
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name={['template', 'version']} label="Template Version">
                      <Input placeholder="e.g. 1.0" size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name={['template', 'hasFillableFields']} label="Has Fillable Fields" valuePropName="checked">
                      <Switch checkedChildren="Yes" unCheckedChildren="No" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name={['template', 'requiresSignature']} label="Requires Signature" valuePropName="checked">
                      <Switch checkedChildren="Yes" unCheckedChildren="No" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name={['template', 'requiresCompanyStamp']} label="Requires Company Stamp" valuePropName="checked">
                      <Switch checkedChildren="Yes" unCheckedChildren="No" />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {docType === 'sample_view' && (
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 8 }}>Upload Sample Document</Text>
                      <Upload {...sampleUploader} fileList={sampleFile}>
                        <Button icon={<EyeOutlined />} size="large" style={{ borderRadius: 8, borderColor: '#10b981', color: '#10b981' }}>
                          Choose Sample File
                        </Button>
                      </Upload>
                      {sampleUrl && (
                        <div style={{ marginTop: 10, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircleOutlined style={{ color: '#10b981' }} />
                          <a href={sampleUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#059669' }}>Sample uploaded — click to preview</a>
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name={['sampleDocument', 'description']} label="Sample Description">
                      <TextArea rows={3} placeholder="Describe what the sample shows" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Card>
          )}

          {/* ════════════ TAB 3 : APPLICABILITY ════════════ */}
          {activeTab === '3' && (
            <Card style={cardStyle}>
              <Divider orientation="left" orientationMargin={0} style={{ borderColor: PRIMARY, marginTop: 0 }}>
                <Text style={{ color: PRIMARY, fontWeight: 700 }}>Who does this document apply to?</Text>
              </Divider>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item name="applicableEmploymentTypes" label="Employment Types">
                    <Select mode="multiple" size="large" style={{ borderRadius: 8 }} placeholder="Select">
                      {EMP_TYPES.map((e) => <Option key={e} value={e}>{e}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="applicableResidencyStatuses" label="Residency Statuses">
                    <Select mode="multiple" size="large" style={{ borderRadius: 8 }} placeholder="Select">
                      {RES_STATUS.map((r) => <Option key={r} value={r}>{r}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="applicableMortgageTypes" label="Mortgage Types">
                    <Select mode="multiple" size="large" style={{ borderRadius: 8 }} placeholder="Select">
                      {MTG_TYPES.map((m) => <Option key={m} value={m}>{m}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {/* ════════════ TAB 4 : VALIDATION ════════════ */}
          {activeTab === '4' && (
            <Card style={cardStyle}>
              <Divider orientation="left" orientationMargin={0} style={{ borderColor: PRIMARY, marginTop: 0 }}>
                <Text style={{ color: PRIMARY, fontWeight: 700 }}>Upload Rules & Validation</Text>
              </Divider>
              <Row gutter={[24, 0]}>
                {[
                  { name: 'isMandatory',         label: 'Mandatory' },
                  { name: 'requiresFrontBack',    label: 'Front & Back Required' },
                  { name: 'requiresTranslation',  label: 'Translation Required' },
                  { name: 'requiresAttestation',  label: 'Attestation Required' },
                  { name: 'requiresSignature',    label: 'Signature Required' },
                  { name: 'requiresStamp',        label: 'Stamp Required' },
                ].map((item) => (
                  <Col xs={12} md={8} key={item.name} style={{ marginBottom: 20 }}>
                    <Form.Item name={item.name} label={item.label} valuePropName="checked">
                      <Switch checkedChildren="Yes" unCheckedChildren="No" style={{ background: PRIMARY }} />
                    </Form.Item>
                  </Col>
                ))}

                <Col xs={24}><Divider dashed /></Col>

                <Col xs={24} md={8}>
                  <Form.Item name="allowMultipleFiles" label="Allow Multiple Files" valuePropName="checked">
                    <Switch checked={allowMulti} onChange={(v) => { setAllowMulti(v); form.setFieldValue('allowMultipleFiles', v); }}
                      checkedChildren="Yes" unCheckedChildren="No" style={{ background: PRIMARY }} />
                  </Form.Item>
                </Col>
                {allowMulti && (
                  <Col xs={24} md={8}>
                    <Form.Item name="maxFilesAllowed" label="Max Files Allowed">
                      <InputNumber min={1} max={20} size="large" style={{ width: '100%', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                )}
                <Col xs={24} md={8}>
                  <Form.Item name="maxFileSizeMB" label="Max File Size (MB)">
                    <InputNumber min={1} max={100} size="large" style={{ width: '100%', borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="allowedFileTypes" label="Allowed File Types">
                    <Select mode="multiple" size="large" style={{ borderRadius: 8 }} placeholder="Select file types">
                      {FILE_TYPES.map((f) => <Option key={f} value={f}>.{f}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {/* ════════════ TAB 5 : DISPLAY ════════════ */}
          {activeTab === '5' && (
            <Card style={cardStyle}>
              <Divider orientation="left" orientationMargin={0} style={{ borderColor: PRIMARY, marginTop: 0 }}>
                <Text style={{ color: PRIMARY, fontWeight: 700 }}>UI / Display Texts</Text>
              </Divider>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name="placeholderText" label="Placeholder Text">
                    <Input placeholder="e.g. Click or drag passport here" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="helperText" label="Helper Text">
                    <Input placeholder="e.g. Must be valid for 6+ months" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="instructions" label="Step-by-step Instructions">
                    <TextArea rows={4} placeholder="1. Download the template&#10;2. Fill all required fields&#10;3. Upload signed copy" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {/* ── Navigation + Submit ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 10 }}>
            <Button size="large" onClick={goPrev} disabled={activeIdx === 0}
              style={{ borderRadius: 8, fontWeight: 600, minWidth: 100 }}>
              ← Previous
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Missing fields hint */}
              {!canSubmit && (
                <Tooltip title={
                  !watchedName?.trim() ? 'Document Name is required (Tab 1)' :
                  !watchedKey?.trim()  ? 'Document Key is required (Tab 1)' :
                  !watchedCategory     ? 'Category is required (Tab 1)' :
                  !scopeValid          ? 'Select at least one bank (Tab 1 → Scope)' : ''
                }>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#ef4444', fontWeight: 600, cursor: 'help' }}>
                    <WarningOutlined /> Required fields missing
                  </span>
                </Tooltip>
              )}

              {activeIdx < TABS.length - 1 ? (
                <Button size="large" type="primary" onClick={goNext}
                  style={{ background: activeTab === '1' && !tab1Valid ? '#94a3b8' : GRADIENT, border: 'none', borderRadius: 8, fontWeight: 600, minWidth: 100 }}>
                  Next →
                </Button>
              ) : (
                <Tooltip title={!canSubmit ? 'Fill all required fields first' : ''}>
                  <Button
                    size="large"
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                    disabled={!canSubmit}
                    style={{
                      background: canSubmit ? GRADIENT : undefined,
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      minWidth: 160,
                      opacity: canSubmit ? 1 : 0.6,
                    }}
                  >
                    {isEdit ? 'Save Changes' : 'Create Document'}
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default DocumentLibraryForm;
