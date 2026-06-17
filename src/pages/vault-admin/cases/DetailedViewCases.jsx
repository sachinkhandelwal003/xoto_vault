// DetailedViewCases.jsx - Fixed with proper DOCUMENTS_LIST usage
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from "@/api/apiService";
import {
  message, Spin, Progress, Modal, Tag, Descriptions,
  Card, Button, Alert, Typography, Empty, notification, Switch
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  BankOutlined,
  HomeOutlined,
  FileTextOutlined,
  DownloadOutlined,
  SolutionOutlined,
  FileOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import DOCUMENTS_LIST, { getDocumentDetails, getIconComponent, getDocumentCategoryFromList } from './documentList';

const { Text } = Typography;

const PRIMARY = '#5c039c';
const PRIMARY_LIGHT = '#f3e8ff';

const isPdf = (name = '') => name?.toLowerCase().endsWith('.pdf');
const fmtSize = (mb) => (mb >= 1 ? `${mb.toFixed(1)} MB` : `${(mb * 1024).toFixed(0)} KB`);

const btnStyle = (bg, color, border) => ({
  padding: '8px 14px',
  background: bg,
  border: `1px solid ${border}`,
  borderRadius: 8,
  color,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 5,
});

// ── Custom Tab Bar ──────────────────────────────────────────────────────────
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 6, background: '#f3f4f6', borderRadius: 12, padding: 5, width: 'fit-content', marginBottom: 24 }}>
    {tabs.map(t => {
      const isActive = active === t.key;
      return (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: '9px 20px',
            borderRadius: 9,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
            transition: 'all 0.2s',
            background: isActive ? `linear-gradient(135deg, ${PRIMARY}, #7c3aed)` : 'transparent',
            color: isActive ? '#fff' : '#6b7280',
            boxShadow: isActive ? `0 4px 14px ${PRIMARY}55` : 'none',
          }}
        >
          {t.label}
        </button>
      );
    })}
  </div>
);

// ── Status Step Bar ─────────────────────────────────────────────────────────
const StatusStepBar = ({ steps, current }) => (
  <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
    <div style={{ display: 'flex', alignItems: 'center', minWidth: 600 }}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: i < steps.length - 1 ? undefined : 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? '#10b981' : active ? PRIMARY : '#e5e7eb',
                color: done || active ? '#fff' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                boxShadow: active ? `0 0 0 4px ${PRIMARY}30` : 'none',
                flexShrink: 0,
              }}>
                {done ? <CheckCircleOutlined style={{ fontSize: 16 }} /> : i + 1}
              </div>
              <div style={{ fontSize: 10, marginTop: 5, fontWeight: active ? 700 : 500, color: active ? PRIMARY : done ? '#10b981' : '#9ca3af', whiteSpace: 'nowrap', maxWidth: 70, textAlign: 'center' }}>
                {step}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#10b981' : '#e5e7eb', margin: '0 4px', marginBottom: 20, flexShrink: 0 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

// ── Info Card ───────────────────────────────────────────────────────────────
const InfoCard = ({ icon, title, children }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ede9fe', overflow: 'hidden' }}>
    <div style={{ background: `linear-gradient(135deg, ${PRIMARY}12, #7c3aed08)`, borderBottom: '1px solid #ede9fe', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
        {icon}
      </div>
      <span style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>{title}</span>
    </div>
    <div style={{ padding: '16px 20px' }}>{children}</div>
  </div>
);

// ── View Button ─────────────────────────────────────────────────────────────
const ViewButton = ({ doc }) => {
  const [open, setOpen] = useState(false);
  const fileUrl = doc?.fileUrl;
  if (!fileUrl) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} style={btnStyle('#f3f4f6', '#374151', '#e5e7eb')}>
        <EyeOutlined /> View
      </button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} width={1000} centered destroyOnClose>
        <div style={{ minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPdf(fileUrl) ? (
            <iframe src={fileUrl} style={{ width: '100%', height: 600, border: 'none' }} title="PDF Preview" />
          ) : (
            <img src={fileUrl} alt="preview" style={{ maxHeight: 600, maxWidth: '100%', objectFit: 'contain' }} />
          )}
        </div>
      </Modal>
    </>
  );
};

// ── Document Upload Card (FIXED - Using DOCUMENTS_LIST) ─────────────────────
const DynamicDocUploadCard = ({ document, caseId, uploadedDocs, onUploadSuccess, userRole }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Get document details from DOCUMENTS_LIST using formName
  const docDetails = getDocumentDetails(document.formName, document.documentType);

  // Get the correct document label
  const getDocumentLabel = () => {
    // First try from DOCUMENTS_LIST
    if (docDetails?.formName) {
      return docDetails.formName;
    }
    // Then from document.formName
    if (document.formName) {
      return document.formName;
    }
    // Then from uploaded document's bankFormName
    const existing = uploadedDocs.find(d => d.bankFormId === document._id);
    if (existing?.bankFormName) {
      return existing.bankFormName;
    }
    // Fallback
    return 'Document';
  };

  const IconComponent = docDetails ? getIconComponent(docDetails.icon) : FileTextOutlined;
  const docLabel = getDocumentLabel();
  const docCategory = docDetails?.category || getDocumentCategoryFromList(document.formName, document.documentType) || 'Other';

  const docKey = document._id;
  // Match uploaded document by bankFormId or documentType
  const existing = uploadedDocs.find(d =>
    d.bankFormId === docKey ||
    d.documentType === docKey ||
    d.bankFormName === document.formName
  );

  const isUploaded = !!existing;
  const isVerified = existing?.verificationStatus === 'verified';
  const isRejected = existing?.verificationStatus === 'rejected';
  const status = isVerified ? 'verified' : isRejected ? 'rejected' : isUploaded ? 'pending' : null;

  const isDownloadable = document.actionType === 'download_fill_upload' || docDetails?.isDownloadable;
  const maxSize = isDownloadable ? 20 : 10;

  const handledByAdvisor = document.bankFormHandling?.handledByAdvisor || false;
  const assignedToOps = document.bankFormHandling?.assignedToOps || false;

  const SC = {
    verified: { color: '#10b981', bg: '#ecfdf5', icon: <CheckCircleOutlined />, text: 'Verified' },
    rejected: { color: '#ef4444', bg: '#fef2f2', icon: <CloseCircleOutlined />, text: 'Rejected' },
    pending: { color: '#f59e0b', bg: '#fffbeb', icon: <ClockCircleOutlined />, text: 'Pending' },
  };
  const sc = SC[status];

  const handleToggleAssignment = async (checked) => {
    if (!isDownloadable) { message.warning('Toggle is only available for downloadable bank forms'); return; }
    if (isUploaded) { message.warning('Cannot change assignment after document is uploaded'); return; }
    setToggling(true);
    try {
      const res = await apiService.post(`/vault/lead/documents/${caseId}/document-handler`, {
        bankFormId: document._id,
        handledByAdvisor: checked,
      });
      if (res.success) { message.success(res.message); onUploadSuccess(); }
      else message.error(res.message || 'Failed to update assignment');
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update document assignment');
    } finally {
      setToggling(false);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxSize) { message.error(`File size must be under ${maxSize} MB`); return; }
    try {
      setUploading(true);
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('entityType', 'Case');
      uploadForm.append('entityId', caseId);
      const uploadRes = await apiService.post('/upload', uploadForm, { headers: { 'Content-Type': 'multipart/form-data' } });
      const fileUrl = uploadRes?.url || uploadRes?.file?.url;
      if (!fileUrl) throw new Error('File upload failed');

      await apiService.post(
  `/vault/lead/documents/cases/${caseId}`,
  {

    entityType: 'Case',

    entityId: caseId,

    // ✅ SEND REAL DOC TYPE
documentType:
  (
    docDetails?.formName ||
    document.formName ||
    'document'
  )
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, ''),

    documentCategory:
      docCategory.toLowerCase(),

    fileUrl,

    fileName: file.name,

    fileSizeMb:
      parseFloat(
        sizeMb.toFixed(2)
      ),

    mimeType:
      file.type,

    // keep Mongo ID separately
    bankFormId:
      document._id,

    bankFormName:
      document.formName,
  }
);
      message.success(`${docLabel} uploaded successfully!`);
      onUploadSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      message.error(`Failed to upload ${docLabel}. Please try again.`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const downloadImage = async (imageUrl) => {
    try {
      let key = imageUrl.split(".amazonaws.com/")[1];
      if (!key) { notification.error({ message: "Invalid Image URL" }); return; }
      key = decodeURIComponent(key);
      await apiService.download(`/download-pdf?key=${encodeURIComponent(key)}`, `xoto_vault_download_${Date.now()}.pdf`);
    } catch {
      notification.error({ message: "Download Failed", description: "PDF could not be generated." });
    }
  };

  // Role-based upload permission
  const canUpload = () => {
    if (userRole === 'admin') return true;
    if (isDownloadable) {
      if (userRole === 'advisor' && handledByAdvisor) return true;
      if (userRole === 'ops' && assignedToOps) return true;
      return false;
    }
    if (userRole === 'advisor') return true;
    return false;
  };

  const showToggle = isDownloadable && !isUploaded && userRole === 'advisor';
  const borderColor = dragOver ? PRIMARY : isVerified ? '#10b981' : isRejected ? '#ef4444' : isUploaded ? `${PRIMARY}80` : '#e5e7eb';
  const userCanUpload = canUpload();

  return (
    <div
      style={{ background: '#fff', border: `1.5px solid ${borderColor}`, borderRadius: 14, padding: 20, transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); if (userCanUpload) handleFile(e.dataTransfer.files?.[0]); }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: isVerified ? '#ecfdf5' : isUploaded ? PRIMARY_LIGHT : '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: isVerified ? '#10b981' : isUploaded ? PRIMARY : '#9ca3af',
          }}>
            {existing ? (isPdf(existing.fileName) ? <FilePdfOutlined /> : <FileImageOutlined />) : <IconComponent />}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{docLabel}</div>
            {existing?.fileName && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{existing.fileName}</div>}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {document.isMandatory && <Tag color="error">Required</Tag>}
              {docCategory && <Tag color="purple">{docCategory}</Tag>}
              {isDownloadable && !isUploaded && (
                <Tag color={handledByAdvisor ? 'green' : 'orange'}>
                  {handledByAdvisor ? '👨‍💼 Advisor Uploads' : '👥 Ops Uploads'}
                </Tag>
              )}
            </div>
          </div>
        </div>
        {sc && (
          <span style={{ fontSize: 12, fontWeight: 600, color: sc.color, background: sc.bg, padding: '4px 10px', borderRadius: 20, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            {sc.icon} {sc.text}
          </span>
        )}
      </div>

      {showToggle && (
        <div style={{ marginBottom: 12, padding: 12, background: handledByAdvisor ? '#ecfdf5' : '#fef3c7', borderRadius: 10, border: `1px solid ${handledByAdvisor ? '#10b981' : '#f59e0b'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <Text strong style={{ fontSize: 12 }}>
                {handledByAdvisor ? 'You will upload this form' : 'Mortgage Ops will handle this form'}
              </Text>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                {handledByAdvisor ? 'You are responsible for downloading, filling, signing and uploading this form' : "Ops team will handle this form. You don't need to upload anything."}
              </div>
            </div>
            <Switch checked={handledByAdvisor} onChange={handleToggleAssignment} loading={toggling} checkedChildren="Advisor" unCheckedChildren="Ops" disabled={isUploaded} />
          </div>
        </div>
      )}

      {(document.description || docDetails?.description) && (
        <div style={{ fontSize: 12, color: '#6b7280', background: '#f9fafb', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
          {document.description || docDetails?.description}
        </div>
      )}

      {(document.fillInstructions || docDetails?.fillInstructions) && (
        <div style={{ fontSize: 12, color: '#374151', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
          <InfoCircleOutlined style={{ color: PRIMARY, marginTop: 2 }} />
          <span>{document.fillInstructions || docDetails?.fillInstructions}</span>
        </div>
      )}

      {isDownloadable && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f3ff', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
          {['Download', 'Fill', 'Sign', 'Upload'].map((step, i) => (
            <React.Fragment key={step}>
              <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY }}>{step}</span>
              {i < 3 && <div style={{ flex: 1, height: 1.5, background: `${PRIMARY}40`, borderRadius: 2 }} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {!isVerified && userCanUpload && (
        <div style={{ border: `1.5px dashed ${dragOver ? PRIMARY : '#d1d5db'}`, borderRadius: 10, padding: 12, textAlign: 'center', background: dragOver ? PRIMARY_LIGHT : '#fafafa', marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{dragOver ? 'Drop to upload' : 'Drag & drop or click below'}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{isDownloadable ? 'PDF' : 'PDF, JPG, PNG'} • Max {maxSize} MB</div>
        </div>
      )}

      {!isUploaded && !userCanUpload && (
        <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '8px 12px', marginBottom: 12, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            <InfoCircleOutlined /> This document will be uploaded by {handledByAdvisor ? 'Advisor' : 'Ops Team'}
          </Text>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!isVerified && userCanUpload && (
          <>
            <input ref={inputRef} type="file" accept={isDownloadable ? '.pdf' : '.pdf,.jpg,.jpeg,.png'} style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{ flex: 1, minWidth: 120, padding: '10px', background: uploading ? '#e5e7eb' : `linear-gradient(135deg, ${PRIMARY}, #7c3aed)`, color: uploading ? '#9ca3af' : '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}
            >
              {uploading ? <><Spin size="small" /> Uploading…</> : existing ? <><ReloadOutlined /> Re-upload</> : <><UploadOutlined /> Upload {isDownloadable ? 'Filled Form' : 'Document'}</>}
            </button>
          </>
        )}
        {isDownloadable && (document.fileUrl || docDetails?.fileUrl) && (
          <button onClick={() => downloadImage(document.fileUrl || docDetails?.fileUrl)} style={btnStyle('linear-gradient(135deg, #10b981, #059669)', '#fff', 'none')}>
            <DownloadOutlined /> Download Template
          </button>
        )}
        {existing?.fileUrl && <ViewButton doc={existing} />}
      </div>

      {isUploaded && !isVerified && !isRejected && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#d97706', marginTop: 12 }}>
          <ClockCircleOutlined style={{ marginRight: 6 }} /> Document uploaded. Pending verification.
        </div>
      )}
      {isVerified && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#065f46', marginTop: 12 }}>
          <CheckCircleOutlined style={{ marginRight: 6 }} /> Document verified and approved.
        </div>
      )}
      {isRejected && existing?.rejectionReason && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#dc2626', marginTop: 12 }}>
          <strong>Rejected:</strong> {existing.rejectionReason}
        </div>
      )}
    </div>
  );
};

// ══════════════ MAIN COMPONENT ══════════════
const DetailedViewCases = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [bankForms, setBankForms] = useState([]);
  const [bankFormsLoading, setBankFormsLoading] = useState(false);
  const [bankProductInfo, setBankProductInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState(null);
  const [bankDecision, setBankDecision] = useState({ status: '', approvedAmount: '', notes: '' });
  const [submittingDecision, setSubmittingDecision] = useState(false);

  useEffect(() => {
    const roleCode = user?.role?.code;
    if (roleCode === '18') setUserRole('admin');
    else if (roleCode === '26') setUserRole('advisor');
    else if (roleCode === '23') setUserRole('ops');
    else setUserRole('user');
  }, [user]);

  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true); else setLoading(true);
      const res = await apiService.get(`/vault/cases/${caseId}`);
      if (res?.success) {
        setCaseData(res.data.case);
        setDocuments(res.data.documents || []);
      } else {
        message.error('Failed to load application details');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load application details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBankForms = async (bankProductId) => {
    if (!bankProductId) return;
    try {
      setBankFormsLoading(true);
      const res = await apiService.get(`/bank/products/bank-forms/bank-product/${bankProductId}`);
      if (res?.success) {
        setBankProductInfo(res.data.bankProduct || null);
        const formsWithMetadata = (res.data.allForms || []).map(form => {
          // Get details from DOCUMENTS_LIST
          const docDetails = getDocumentDetails(form.formName, form.documentType);
          const existingReqDoc = caseData?.documentStatus?.requiredDocuments?.find(d => d.bankFormId?.toString() === form._id);
          return {
            ...form,
            ...docDetails,
            icon: docDetails?.icon,
            category: docDetails?.category || 'Bank Forms',
            bankFormHandling: existingReqDoc?.bankFormHandling || {
              handledByAdvisor: form.documentSource === 'Customer',
              assignedToOps: form.documentSource === 'Bank',
              advisorMarkedAt: null,
            },
          };
        });
        setBankForms(formsWithMetadata);
      } else {
        message.error('Failed to load bank forms');
      }
    } catch (err) {
      console.error('Error fetching bank forms:', err);
      message.error('Failed to load bank forms');
    } finally {
      setBankFormsLoading(false);
    }
  };

  useEffect(() => { if (caseId) fetchData(); }, [caseId]);
  useEffect(() => {
    if (caseData?.loanInfo?.selectedBankProduct) fetchBankForms(caseData.loanInfo.selectedBankProduct);
  }, [caseData?.loanInfo?.selectedBankProduct]);

  // Group documents by category from DOCUMENTS_LIST
  const groupedDocuments = bankForms.reduce((acc, form) => {
    const cat = form.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(form);
    return acc;
  }, {});

  const categoryOrder = { Identity: 1, Employment: 2, Financial: 3, Property: 4, Insurance: 5, 'Bank Forms': 6, Other: 7 };
  const categoryIcons = {
    Identity: <UserOutlined />,
    Employment: <SolutionOutlined />,
    Financial: <BankOutlined />,
    Property: <HomeOutlined />,
    'Bank Forms': <FileTextOutlined />,
    Insurance: <FileTextOutlined />,
  };

  const uploadedCount = documents.length;
  const verifiedCount = documents.filter(d => d.verificationStatus === 'verified').length;
  const totalRequired = bankForms.length;
  const pct = totalRequired > 0 ? Math.round((uploadedCount / totalRequired) * 100) : 0;

  const statusSteps = ['Draft', 'Submitted to Xoto', 'Bank Application', 'Collecting Documentation', 'Pre-Approved', 'Valuation', 'FOL Processed', 'FOL Issued', 'FOL Signed', 'Disbursed'];
  const currentStepIndex = Math.max(0, statusSteps.indexOf(caseData?.currentStatus));

  const getStatusColor = (s) => ({
    Draft: 'default', 'Submitted to Xoto': 'processing', 'Bank Application': 'processing',
    'Collecting Documentation': 'warning', 'Pre-Approved': 'success', Valuation: 'processing',
    'FOL Processed': 'success', 'FOL Issued': 'success', 'FOL Signed': 'success',
    Disbursed: 'success', Rejected: 'error', Lost: 'default',
  }[s] || 'default');

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <Spin size="large" />
    </div>
  );

  if (!caseData) return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <Text type="secondary" style={{ fontSize: 16 }}>Application not found</Text>
      <br /><br />
      <Button onClick={() => navigate(-1)}>Back to Applications</Button>
    </div>
  );

  const ci = caseData.clientInfo || {};

  const BANK_STATUSES = [
    'Submitted to Bank', 'Pre-Approved', 'Valuation', 'FOL Processed',
    'FOL Issued', 'FOL Signed', 'Disbursed', 'Lost', 'Rejected',
  ];
  const needsAmount = ['Pre-Approved', 'Disbursed'].includes(bankDecision.status);
  const needsNotes = bankDecision.status === 'Rejected';

  const handleBankDecisionSubmit = async () => {
    if (!bankDecision.status) { message.warning('Please select a status'); return; }
    if (needsAmount && !bankDecision.approvedAmount) { message.warning('Approved amount is required for this status'); return; }
    if (needsNotes && !bankDecision.notes) { message.warning('Notes are required when rejecting'); return; }
    try {
      setSubmittingDecision(true);
      const payload = { status: bankDecision.status, notes: bankDecision.notes };
      if (needsAmount) payload.approvedAmount = parseFloat(bankDecision.approvedAmount);
      const res = await apiService.put(`/vault/ops/bank-decision/${caseId}`, payload);
      if (res?.success) {
        message.success(res.message || 'Bank decision updated successfully');
        setBankDecision({ status: '', approvedAmount: '', notes: '' });
        fetchData(true);
      } else {
        message.error(res?.message || 'Failed to update bank decision');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update bank decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'documents', label: `Documents (${uploadedCount}/${totalRequired})` },
    { key: 'files', label: `Uploaded Files (${uploadedCount})` },
    ...(userRole === 'ops' || userRole === 'admin' ? [{ key: 'bankdecision', label: 'Bank Decision' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', padding: '28px 20px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #ede9fe', borderRadius: 10, padding: '8px 18px', cursor: 'pointer', marginBottom: 24, fontWeight: 600, color: PRIMARY, fontSize: 13, boxShadow: '0 1px 4px rgba(92,3,156,0.08)' }}
        >
          <ArrowLeftOutlined /> Back to Applications
        </button>

        {/* Hero header */}
        <div style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #7c3aed 60%, #4f46e5 100%)`, borderRadius: 18, padding: '28px 32px', color: '#fff', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, boxShadow: `0 8px 32px ${PRIMARY}40` }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.65, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Application Details</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fff' }}>{caseData.caseReference}</h1>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
              {ci.fullName} &nbsp;•&nbsp; Created {dayjs(caseData.createdAt).format('DD MMM YYYY')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {bankProductInfo && (
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.2)' }}>
                {bankProductInfo.logo && <img src={bankProductInfo.logo} alt={bankProductInfo.name} style={{ height: 24, objectFit: 'contain', borderRadius: 4 }} />}
                <span style={{ fontSize: 13, fontWeight: 600 }}>{bankProductInfo.name} — {bankProductInfo.productTitle}</span>
              </div>
            )}
            <Tag color={getStatusColor(caseData.currentStatus)} style={{ fontSize: 13, padding: '5px 16px', borderRadius: 20 }}>
              {caseData.currentStatus}
            </Tag>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #ede9fe', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(92,3,156,0.06)' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Document Progress</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: PRIMARY }}>{uploadedCount} / {totalRequired}</span>
            </div>
            <Progress percent={pct} strokeColor={`linear-gradient(90deg, ${PRIMARY}, #7c3aed)`} trailColor="#ede9fe" strokeWidth={10} showInfo={false} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: pct === 100 ? '#10b981' : PRIMARY, lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>complete</div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { val: uploadedCount, label: 'Uploaded', color: PRIMARY },
              { val: verifiedCount, label: 'Verified', color: '#10b981' },
              { val: totalRequired - uploadedCount, label: 'Pending', color: '#f59e0b' },
            ].map(({ val, label, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{ padding: '10px 18px', background: refreshing ? '#f3f4f6' : '#fff', border: `1px solid #ede9fe`, borderRadius: 10, cursor: 'pointer', color: PRIMARY, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            {refreshing ? <Spin size="small" /> : <ReloadOutlined />} Refresh
          </button>
        </div>

        {/* Tab bar */}
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ede9fe', padding: '20px 24px', boxShadow: '0 2px 8px rgba(92,3,156,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 20, background: `linear-gradient(180deg, ${PRIMARY}, #7c3aed)`, borderRadius: 3, display: 'inline-block' }} />
                Application Pipeline
              </div>
              <StatusStepBar steps={statusSteps} current={currentStepIndex} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
              <InfoCard icon={<UserOutlined />} title="Client Information">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Full Name', value: ci.fullName, bold: true },
                    { label: 'Email', value: ci.email },
                    { label: 'Mobile', value: ci.mobile },
                    { label: 'Nationality', value: ci.nationality },
                    { label: 'Marital Status', value: ci.maritalStatus },
                    { label: 'Date of Birth', value: ci.dateOfBirth ? dayjs(ci.dateOfBirth).format('DD/MM/YYYY') : '—' },
                  ].map(({ label, value, bold }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: '#111827' }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </InfoCard>

              <InfoCard icon={<HomeOutlined />} title="Property Information">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Type', value: [caseData.propertyInfo?.propertyType, caseData.propertyInfo?.propertySubtype].filter(Boolean).join(' — ') },
                    { label: 'Property Value', value: caseData.propertyInfo?.propertyValue ? `AED ${caseData.propertyInfo.propertyValue.toLocaleString()}` : '—' },
                    { label: 'Loan Amount', value: caseData.propertyInfo?.loanAmount ? `AED ${caseData.propertyInfo.loanAmount.toLocaleString()}` : '—' },
                    { label: 'Down Payment', value: caseData.propertyInfo?.downPayment ? `AED ${caseData.propertyInfo.downPayment.toLocaleString()}` : '—' },
                    { label: 'LTV', value: caseData.propertyInfo?.ltvPercentage ? `${caseData.propertyInfo.ltvPercentage.toFixed(1)}%` : '—' },
                    { label: 'Address', value: [caseData.propertyInfo?.propertyAddress?.building, caseData.propertyInfo?.propertyAddress?.area].filter(Boolean).join(', ') },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#111827', textAlign: 'right', maxWidth: '55%' }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </InfoCard>
            </div>
          </div>
        )}

        {/* ── Documents Tab ── */}
        {activeTab === 'documents' && (
          <div>
            <Alert
              message="Document Requirements"
              description="Please upload all required documents. Verified documents will be marked with a green check."
              type="info" showIcon
              style={{ marginBottom: 24, borderRadius: 12 }}
            />

            {Object.entries(groupedDocuments)
              .sort(([a], [b]) => (categoryOrder[a] || 99) - (categoryOrder[b] || 99))
              .map(([category, docs]) => {
                const uploadedInCat = docs.filter(d => documents.some(doc => doc.bankFormId === d._id || doc.bankFormName === d.formName)).length;
                return (
                  <div key={category} style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${PRIMARY}, #7c3aed)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {categoryIcons[category] || <FileOutlined />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{category} Documents</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{uploadedInCat} / {docs.length} uploaded</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
                      {docs.map(doc => (
                        <DynamicDocUploadCard
                          key={doc._id}
                          document={doc}
                          caseId={caseId}
                          uploadedDocs={documents}
                          onUploadSuccess={() => fetchData(true)}
                          userRole={userRole}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

            {bankForms.length === 0 && !bankFormsLoading && (
              <Empty description="No document requirements found for this bank product" />
            )}
            {bankFormsLoading && (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /> <span style={{ marginLeft: 8 }}>Loading documents...</span></div>
            )}
          </div>
        )}

        {/* ── Uploaded Files Tab ── */}
        {activeTab === 'files' && (
          <div>
            {documents.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ede9fe', padding: 60, textAlign: 'center' }}>
                <FileTextOutlined style={{ fontSize: 48, color: '#c4b5fd' }} />
                <div style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>No documents uploaded yet</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {documents.map((doc, idx) => {
                  const docDetails = getDocumentDetails(doc.bankFormName, doc.documentType);
                  const label = doc.bankFormName || docDetails?.formName || 'Document';
                  const isVerified = doc.verificationStatus === 'verified';
                  const isRejected = doc.verificationStatus === 'rejected';
                  return (
                    <div key={idx} style={{ background: '#fff', border: `1.5px solid ${isVerified ? '#10b981' : isRejected ? '#ef4444' : '#ede9fe'}`, borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(92,3,156,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: isVerified ? '#ecfdf5' : isRejected ? '#fef2f2' : PRIMARY_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: isVerified ? '#10b981' : isRejected ? '#ef4444' : PRIMARY }}>
                          {isPdf(doc.fileName) ? <FilePdfOutlined /> : <FileImageOutlined />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName}</div>
                        </div>
                        <Tag color={isVerified ? 'success' : isRejected ? 'error' : 'warning'}>
                          {isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Pending'}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>
                        Uploaded: {dayjs(doc.uploadedAt).format('DD MMM YYYY, hh:mm A')} &nbsp;•&nbsp; {fmtSize(doc.fileSizeMb)}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <ViewButton doc={doc} />
                        {doc.fileUrl && (
                          <button onClick={() => window.open(doc.fileUrl, '_blank')} style={btnStyle('#f3f4f6', '#374151', '#e5e7eb')}>
                            <DownloadOutlined /> Download
                          </button>
                        )}
                      </div>
                      {isRejected && doc.rejectionReason && (
                        <div style={{ marginTop: 12, fontSize: 11, color: '#dc2626', background: '#fef2f2', padding: 8, borderRadius: 6 }}>
                          Rejected: {doc.rejectionReason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Bank Decision Tab ── */}
        {activeTab === 'bankdecision' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24, alignItems: 'start' }}>

            {/* Current Status Card */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ede9fe', overflow: 'hidden', boxShadow: '0 2px 8px rgba(92,3,156,0.06)' }}>
              <div style={{ background: `linear-gradient(135deg, ${PRIMARY}12, #7c3aed08)`, borderBottom: '1px solid #ede9fe', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                  <BankOutlined />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Current Bank Status</span>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Application Reference', value: caseData.caseReference },
                    { label: 'Current Status', value: caseData.currentStatus },
                    { label: 'Bank', value: bankProductInfo?.name || '—' },
                    { label: 'Product', value: bankProductInfo?.productTitle || '—' },
                    { label: 'Loan Amount', value: caseData.propertyInfo?.loanAmount ? `AED ${caseData.propertyInfo.loanAmount.toLocaleString()}` : '—' },
                    { label: 'Approved Amount', value: caseData.bankDecision?.approvedAmount ? `AED ${Number(caseData.bankDecision.approvedAmount).toLocaleString()}` : '—' },
                    { label: 'Decision Notes', value: caseData.bankDecision?.notes || '—' },
                    { label: 'Last Updated', value: caseData.bankDecision?.updatedAt ? dayjs(caseData.bankDecision.updatedAt).format('DD MMM YYYY, hh:mm A') : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #f3f4f6', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#6b7280', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#111827', textAlign: 'right' }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Update Decision Form */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ede9fe', overflow: 'hidden', boxShadow: '0 2px 8px rgba(92,3,156,0.06)' }}>
              <div style={{ background: `linear-gradient(135deg, ${PRIMARY}12, #7c3aed08)`, borderBottom: '1px solid #ede9fe', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${PRIMARY}, #7c3aed)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                  <CheckCircleOutlined />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Update Bank Decision</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Status Select */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                    Bank Status <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={bankDecision.status}
                    onChange={e => setBankDecision(prev => ({ ...prev, status: e.target.value, approvedAmount: '', notes: '' }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#111827', background: '#fff', outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: 16 }}
                  >
                    <option value="">— Select Status —</option>
                    {BANK_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Approved Amount (Pre-Approved / Disbursed) */}
                {needsAmount && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                      Approved Amount (AED) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#6b7280', fontWeight: 600 }}>AED</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 1500000"
                        value={bankDecision.approvedAmount}
                        onChange={e => setBankDecision(prev => ({ ...prev, approvedAmount: e.target.value }))}
                        style={{ width: '100%', padding: '10px 14px 10px 54px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                      Required for {bankDecision.status} status
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                    Notes {needsNotes && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={needsNotes ? 'Reason for rejection (required)…' : 'Optional notes or comments…'}
                    value={bankDecision.notes}
                    onChange={e => setBankDecision(prev => ({ ...prev, notes: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${needsNotes && !bankDecision.notes ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 10, fontSize: 13, color: '#111827', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Status-specific hint */}
                {bankDecision.status && (
                  <div style={{ background: needsNotes ? '#fef2f2' : needsAmount ? '#f0fdf4' : '#f5f3ff', border: `1px solid ${needsNotes ? '#fecaca' : needsAmount ? '#bbf7d0' : '#ede9fe'}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: needsNotes ? '#dc2626' : needsAmount ? '#065f46' : PRIMARY }}>
                    {needsNotes && '⚠ Rejection requires notes explaining the reason.'}
                    {needsAmount && `✓ Set the approved loan amount for ${bankDecision.status} status.`}
                    {!needsNotes && !needsAmount && `Status will be updated to "${bankDecision.status}".`}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleBankDecisionSubmit}
                  disabled={submittingDecision || !bankDecision.status}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: submittingDecision || !bankDecision.status ? 'not-allowed' : 'pointer',
                    background: submittingDecision || !bankDecision.status ? '#e5e7eb' : `linear-gradient(135deg, ${PRIMARY}, #7c3aed)`,
                    color: submittingDecision || !bankDecision.status ? '#9ca3af' : '#fff',
                    fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: !submittingDecision && bankDecision.status ? `0 4px 14px ${PRIMARY}40` : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {submittingDecision ? <><Spin size="small" /> Updating…</> : <><CheckCircleOutlined /> Update Bank Decision</>}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default DetailedViewCases;