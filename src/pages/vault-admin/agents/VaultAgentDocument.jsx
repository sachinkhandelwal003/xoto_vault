import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from "@/api/apiService";
import { message, Spin, Progress, Modal, Tooltip } from 'antd';
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
  DeleteOutlined,
  PaperClipOutlined,
  InboxOutlined,
} from '@ant-design/icons';

/* ──────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
   ────────────────────────────────────────────────────────────── */
const PRIMARY = '#5c039c';
const PRIMARY_LIGHT = '#f3e8ff';
const SUCCESS = '#10b981';
const WARNING = '#f59e0b';
const ERROR = '#ef4444';

const DOCUMENT_TYPES = [
  {
    category: 'identity',
    categoryLabel: 'Identity Documents',
    icon: <UserOutlined />,
    docs: [
      { type: 'emirates_id_front', label: 'Emirates ID (Front)', accept: '.pdf,.jpg,.jpeg,.png', required: true },
      { type: 'emirates_id_back', label: 'Emirates ID (Back)', accept: '.pdf,.jpg,.jpeg,.png', required: true },
      { type: 'passport', label: 'Passport', accept: '.pdf,.jpg,.jpeg,.png', required: true },
      { type: 'visa', label: 'Visa Copy', accept: '.pdf,.jpg,.jpeg,.png', required: false },
    ],
  },
  {
    category: 'financial',
    categoryLabel: 'Financial Documents',
    icon: <BankOutlined />,
    docs: [
      { type: 'bank_statements', label: 'Bank Statements (6 Months)', accept: '.pdf', required: true },
      { type: 'salary_certificate', label: 'Salary Certificate', accept: '.pdf,.jpg,.jpeg,.png', required: true },
      { type: 'payslips', label: 'Payslips (6 Months)', accept: '.pdf', required: false },
    ],
  }

];

const ALL_DOC_TYPES = DOCUMENT_TYPES.flatMap(c => c.docs);

const isPdf = (urlOrName = '') => urlOrName.toLowerCase().endsWith('.pdf');
const fmtFileSize = (mb) => {
  if (!mb && mb !== 0) return '—';
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(mb * 1024).toFixed(0)} KB`;
};

// Get file icon based on mime type
const getFileIcon = (fileName, mimeType) => {
  if (isPdf(fileName) || mimeType === 'application/pdf') return <FilePdfOutlined style={{ fontSize: 24, color: '#ef4444' }} />;
  if (mimeType?.startsWith('image/')) return <FileImageOutlined style={{ fontSize: 24, color: '#10b981' }} />;
  return <FilePdfOutlined style={{ fontSize: 24, color: '#6b7280' }} />;
};

// Get status config
const getStatusConfig = (status) => {
  const configs = {
    Verified: { color: SUCCESS, bg: '#ecfdf5', icon: <CheckCircleOutlined />, text: 'Verified', borderColor: '#bbf7d0' },
    Rejected: { color: ERROR, bg: '#fef2f2', icon: <CloseCircleOutlined />, text: 'Rejected', borderColor: '#fecaca' },
    Pending: { color: WARNING, bg: '#fffbeb', icon: <ClockCircleOutlined />, text: 'Pending', borderColor: '#fed7aa' },
    Uploaded: { color: '#6366f1', bg: '#eef2ff', icon: <CheckCircleOutlined />, text: 'Uploaded', borderColor: '#c7d2fe' },
  };
  return configs[status] || configs.Pending;
};

/* ──────────────────────────────────────────────────────────────
   VIEW DOCUMENT BUTTON (MODAL PREVIEW)
   ────────────────────────────────────────────────────────────── */
const ViewDocumentButton = ({ doc }) => {
  const [open, setOpen] = useState(false);
  const fileUrl = doc.fileUrl || doc.url || doc.documentUrl || doc.file_url;

  if (!fileUrl) return null;

  const isPdfFile = isPdf(fileUrl) || doc.mimeType === 'application/pdf';
  const isImage = doc.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(fileUrl);

  return (
    <>
      <Tooltip title="Preview Document">
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: '8px 14px',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            color: '#374151',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
        >
          <EyeOutlined /> Preview
        </button>
      </Tooltip>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width="90%"
        style={{ maxWidth: 1000 }}
        centered
        destroyOnClose
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {getFileIcon(doc.fileName || doc.file_name, doc.mimeType)}
            <span style={{ fontSize: 16, fontWeight: 600 }}>{doc.fileName || doc.file_name || 'Document'}</span>
          </div>
        }
      >
        <div style={{ minHeight: '60vh', maxHeight: '70vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, overflow: 'auto' }}>
          {isPdfFile ? (
            <iframe src={fileUrl} style={{ width: '100%', height: '65vh', border: 'none', borderRadius: 8 }} title="PDF Preview" />
          ) : isImage ? (
            <img src={fileUrl} alt="Document preview" style={{ maxHeight: '65vh', maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }} />
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <FilePdfOutlined style={{ fontSize: 64, color: '#9ca3af' }} />
              <p style={{ marginTop: 16, color: '#6b7280' }}>Preview not available for this file type</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY, marginTop: 8, display: 'inline-block' }}>
                Download file
              </a>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

/* ──────────────────────────────────────────────────────────────
   SINGLE DOCUMENT UPLOAD CARD
   ────────────────────────────────────────────────────────────── */
const DocUploadCard = ({ docDef, leadId, uploadedDocs, onUploadSuccess, onDelete }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Find existing document for this type
  const existing = uploadedDocs.find(d =>
    (d.documentType || d.document_type) === docDef.type
  );

  const status = existing
    ? (existing.status || existing.verification_status || (existing.isVerified ? 'Verified' : 'Uploaded'))
    : null;

  const statusConfig = getStatusConfig(status);
  const isVerified = status === 'Verified';

  const handleFile = async (file) => {
    if (!file) return;
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 10) {
      message.error('File size must be under 10 MB');
      return;
    }

    try {
      setUploading(true);

      const category = DOCUMENT_TYPES.find(c =>
        c.docs.some(d => d.type === docDef.type)
      )?.category;

      // Step 1: Upload file to S3
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('entityType', 'Lead');
      uploadForm.append('entityId', leadId);

      const uploadRes = await apiService.post('/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const fileUrl = uploadRes?.url || uploadRes?.file?.url;

      if (!fileUrl) throw new Error('File upload failed: no URL in response');

      // Step 2: Create document record
      const payload = {
        entityType: 'Lead',
        entityId: leadId,
        documentType: docDef.type,
        documentCategory: category || '',
        fileUrl,
        fileName: file.name,
        fileSizeMb: parseFloat(sizeMb.toFixed(2)),
        mimeType: file.type,
      };

      await apiService.post(`/vault/lead/documents/${leadId}`, payload);

      message.success(`${docDef.label} uploaded successfully!`);
      onUploadSuccess();
    } catch (err) {
      console.error(err);
      message.error(`Failed to upload ${docDef.label}. Please try again.`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!existing?._id && !existing?.documentId) return;

    setDeleting(true);
    try {
      const docId = existing._id || existing.documentId;
      await apiService.delete(`/vault/lead/documents/${leadId}/${docId}`);
      message.success(`${docDef.label} removed successfully`);
      onDelete?.();
      onUploadSuccess();
    } catch (err) {
      console.error(err);
      message.error('Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const handleReupload = () => {
    inputRef.current?.click();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      style={{
        background: '#fff',
        border: `1.5px solid ${dragOver ? PRIMARY : isVerified ? SUCCESS : '#e5e7eb'}`,
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'all 0.2s ease',
        boxShadow: dragOver ? `0 0 0 3px ${PRIMARY}22` : '0 2px 8px rgba(0,0,0,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Verified Overlay */}
      {isVerified && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: `linear-gradient(135deg, ${SUCCESS}10 0%, transparent 70%)`,
          width: '100%', height: '100%', pointerEvents: 'none',
        }} />
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: existing ? (isVerified ? '#ecfdf5' : PRIMARY_LIGHT) : '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
            color: isVerified ? SUCCESS : existing ? PRIMARY : '#9ca3af',
          }}>
            {existing ? getFileIcon(existing.fileName || existing.file_name, existing.mimeType) : <InboxOutlined />}
          </div>

          {/* Labels */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {docDef.label}
              {docDef.required && (
                <span style={{
                  fontSize: 10, fontWeight: 600, background: '#fef2f2', color: '#dc2626',
                  padding: '2px 8px', borderRadius: 12,
                }}>Required</span>
              )}
            </div>
            {existing?.fileName && (
              <div style={{
                fontSize: 12, color: '#6b7280', marginTop: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                📄 {existing.fileName}
              </div>
            )}
            {existing?.fileSizeMb !== undefined && existing?.fileSizeMb !== null && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                {fmtFileSize(existing.fileSizeMb)}
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {statusConfig && (
          <div style={{
            fontSize: 12, fontWeight: 600, color: statusConfig.color,
            background: statusConfig.bg, padding: '4px 12px',
            borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {statusConfig.icon} {statusConfig.text}
          </div>
        )}
      </div>

      {/* Upload / Preview Area */}
      {!isVerified && (
        <div
          style={{
            border: `2px dashed ${dragOver ? PRIMARY : '#d1d5db'}`,
            borderRadius: 12,
            padding: '14px 12px',
            textAlign: 'center',
            background: dragOver ? PRIMARY_LIGHT : '#fafafa',
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
          onClick={() => !existing && inputRef.current?.click()}
        >
          {existing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                <CheckCircleOutlined style={{ color: SUCCESS, marginRight: 4 }} />
                Document uploaded on {new Date(existing.createdAt || existing.uploadedAt).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReupload(); }}
                  style={{
                    padding: '6px 16px', background: '#fff', border: `1px solid ${PRIMARY}`,
                    borderRadius: 8, color: PRIMARY, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  <ReloadOutlined /> Re-upload
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  disabled={deleting}
                  style={{
                    padding: '6px 16px', background: '#fff', border: '1px solid #fecaca',
                    borderRadius: 8, color: ERROR, fontSize: 12, fontWeight: 500, cursor: deleting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deleting ? <Spin size="small" /> : <DeleteOutlined />} Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: dragOver ? PRIMARY : '#6b7280', fontWeight: 500 }}>
                📂 {dragOver ? 'Drop to upload' : 'Drag & drop or click to browse'}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                {docDef.accept.replace(/\./g, '').toUpperCase().replace(/,/g, ' • ')} • Max 10 MB
              </div>
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        {!isVerified && !existing && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={docDef.accept}
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{
                flex: 1, padding: '10px 0',
                background: uploading ? '#e5e7eb' : PRIMARY,
                color: uploading ? '#9ca3af' : '#fff',
                border: 'none', borderRadius: 10,
                fontWeight: 600, fontSize: 13,
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {uploading ? <><Spin size="small" /> Uploading...</> : <><UploadOutlined /> Upload Document</>}
            </button>
          </>
        )}

        {existing && <ViewDocumentButton doc={existing} />}

        {existing && status === 'Rejected' && (
          <button
            onClick={handleReupload}
            style={{
              padding: '10px 0', flex: 1,
              background: WARNING, color: '#fff', border: 'none', borderRadius: 10,
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <ReloadOutlined /> Upload Again
          </button>
        )}
      </div>

      {/* Rejection Reason */}
      {status === 'Rejected' && existing?.rejectionReason && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
          padding: '10px 14px', fontSize: 12, color: '#dc2626',
        }}>
          <strong>Rejection Reason:</strong> {existing.rejectionReason}
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
   ────────────────────────────────────────────────────────────── */
const VaultAgentDocument = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefreshing = false) => {
    if (!leadId) return;
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const [leadRes, docsRes] = await Promise.all([
        apiService.get(`/vault/lead/${leadId}`).catch(() => ({ data: null })),
        apiService.get(`/vault/lead/documents/${leadId}`),
      ]);

      setLead(leadRes?.data?.data || leadRes?.data || null);

      const raw = docsRes?.data;
      const docs = Array.isArray(raw) ? raw
        : Array.isArray(raw?.data) ? raw.data
        : Array.isArray(raw?.documents) ? raw.documents
        : Array.isArray(raw?.data?.documents) ? raw.data.documents
        : [];
      setDocuments(docs);
    } catch (err) {
      console.error(err);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchData();
  }, [leadId]);

  // Computed Stats
  const totalRequired = ALL_DOC_TYPES.filter(d => d.required).length;
  const totalAll = ALL_DOC_TYPES.length;
  const uploaded = documents.length;
  const verified = documents.filter(d => (d.status || d.verification_status) === 'Verified' || d.isVerified === true).length;
  const rejected = documents.filter(d => (d.status || d.verification_status) === 'Rejected').length;
  const pending = documents.filter(d => {
    const s = d.status || d.verification_status;
    return (!s || s === 'Pending' || s === 'Uploaded') && (!d.isVerified);
  }).length;
  const requiredUploaded = ALL_DOC_TYPES.filter(d => d.required && documents.some(doc => (doc.documentType || doc.document_type) === d.type)).length;
  const remainingRequired = totalRequired - requiredUploaded;
  const pct = totalAll > 0 ? Math.round((uploaded / totalAll) * 100) : 0;

  const clientInfo = lead?.customerInfo || lead?.clientInfo || {};

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <Spin size="large" tip="Loading documents..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '10px 20px', cursor: 'pointer', color: '#475569',
            fontWeight: 500, fontSize: 14, marginBottom: 28,
            transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = PRIMARY; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
        >
          <ArrowLeftOutlined /> Back to Lead
        </button>

        {/* Hero Header */}
        <div style={{
          background: `linear-gradient(135deg, ${PRIMARY} 0%, #7c3aed 100%)`,
          borderRadius: 24, padding: '32px 36px',
          color: '#fff', marginBottom: 28,
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
          alignItems: 'center', gap: 24,
          boxShadow: '0 8px 24px rgba(92, 3, 156, 0.2)',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, opacity: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Document Management
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff' }}>
              {clientInfo.fullName || 'Client Documents'}
            </h1>
            {lead?.leadId && (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75, fontFamily: 'monospace' }}>
                Ref: {lead.leadId}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Uploaded', value: uploaded, color: '#fff' },
              { label: 'Verified', value: verified, color: '#6ee7b7' },
              { label: 'Pending', value: pending, color: '#fcd34d' },
              { label: 'Rejected', value: rejected, color: '#fca5a5' },
              { label: 'Required Left', value: remainingRequired, color: '#c4b5fd' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Section */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '20px 28px',
          border: '1px solid #e5e7eb', marginBottom: 32,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                Overall Completion
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>
                {uploaded} / {totalAll} documents
              </span>
            </div>
            <Progress
              percent={pct}
              strokeColor={{ '0%': PRIMARY, '100%': '#7c3aed' }}
              trailColor="#e5e7eb"
              strokeWidth={10}
              showInfo={false}
              style={{ borderRadius: 10 }}
            />
            <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
              Required: {requiredUploaded}/{totalRequired} uploaded
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: pct === 100 ? SUCCESS : PRIMARY }}>
              {pct}%
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>complete</div>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{
              padding: '10px 24px', background: refreshing ? '#f3f4f6' : '#fff',
              border: '1px solid #d1d5db', borderRadius: 12,
              color: '#374151', cursor: refreshing ? 'not-allowed' : 'pointer',
              fontWeight: 500, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (!refreshing) e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { if (!refreshing) e.currentTarget.style.background = '#fff'; }}
          >
            {refreshing ? <Spin size="small" /> : <ReloadOutlined />}
            Refresh
          </button>
        </div>

        {/* Document Categories Grid */}
        {DOCUMENT_TYPES.map((category) => {
          const categoryDocs = category.docs;
          const uploadedInCat = categoryDocs.filter(d =>
            documents.some(ud => (ud.documentType || ud.document_type) === d.type)
          ).length;

          return (
            <div key={category.category} style={{ marginBottom: 40 }}>
              {/* Category Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 20,
                paddingBottom: 8,
                borderBottom: '2px solid #f1f5f9',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, #7c3aed 100%)`,
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  boxShadow: `0 4px 12px ${PRIMARY}30`,
                }}>
                  {category.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>
                    {category.categoryLabel}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {uploadedInCat} / {categoryDocs.length} uploaded
                    {categoryDocs.filter(d => d.required).length > 0 && ` · ${categoryDocs.filter(d => d.required && documents.some(ud => (ud.documentType || ud.document_type) === d.type)).length}/${categoryDocs.filter(d => d.required).length} required`}
                  </div>
                </div>
              </div>

              {/* Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: 20,
              }}>
                {category.docs.map((docDef) => (
                  <DocUploadCard
                    key={docDef.type}
                    docDef={docDef}
                    leadId={leadId}
                    uploadedDocs={documents}
                    onUploadSuccess={() => fetchData(true)}
                    onDelete={() => fetchData(true)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Completion Banner */}
        {pct === 100 && (
          <div style={{
            background: `linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)`,
            border: `1.5px solid ${SUCCESS}`,
            borderRadius: 20, padding: '28px 36px',
            display: 'flex', alignItems: 'center', gap: 20,
            marginTop: 16,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
          }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: SUCCESS }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#065f46' }}>
                🎉 All documents uploaded!
              </div>
              <div style={{ fontSize: 14, color: '#047857', marginTop: 6 }}>
                This lead is ready for submission to the bank once all documents are verified.
              </div>
            </div>
          </div>
        )}

        {/* Missing Required Warning */}
        {remainingRequired > 0 && uploaded > 0 && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16,
            padding: '16px 24px', marginTop: 20,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <ClockCircleOutlined style={{ fontSize: 20, color: WARNING }} />
            <div style={{ fontSize: 13, color: '#92400e' }}>
              <strong>{remainingRequired} required document{remainingRequired > 1 ? 's' : ''}</strong> still pending. Please upload all required documents to proceed.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultAgentDocument;