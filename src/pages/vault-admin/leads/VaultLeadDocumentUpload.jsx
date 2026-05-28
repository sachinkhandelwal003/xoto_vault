import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '@/api/apiService';
import { message, Spin, Progress, Modal } from 'antd';
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
} from '@ant-design/icons';

/* ─── Constants ────────────────────────────────────────── */
const PRIMARY = '#5c039c';
const PRIMARY_LIGHT = '#f3e8ff';

const DOCUMENT_TYPES = [
  {
    category: 'identity',
    categoryLabel: 'Identity Documents',
    icon: <UserOutlined />,
    docs: [
      { type: 'emirates_id_front', label: 'Emirates ID (Front)', accept: '.pdf,.jpg,.jpeg,.png',} ,
      { type: 'emirates_id_back',  label: 'Emirates ID (Back)',  accept: '.pdf,.jpg,.jpeg,.png', },
      { type: 'passport',          label: 'Passport',            accept: '.pdf,.jpg,.jpeg,.png', },
      { type: 'visa',              label: 'Visa Copy',           accept: '.pdf,.jpg,.jpeg,.png', },
    ],
  },
  {
    category: 'financial',
    categoryLabel: 'Financial Documents',
    icon: <BankOutlined />,
    docs: [
      { type: 'bank_statements',    label: 'Bank Statements (6 Months)', accept: '.pdf' },
      { type: 'salary_certificate', label: 'Salary Certificate',         accept: '.pdf,.jpg,.jpeg,.png' },
      { type: 'payslips',           label: 'Payslips (6 Months)',        accept: '.pdf' },
    ],
  },
];

const ALL_DOC_TYPES = DOCUMENT_TYPES.flatMap(c => c.docs);

/* ─── Helpers ──────────────────────────────────────────── */
const isPdf   = (name = '') => name.toLowerCase().endsWith('.pdf');
const fmtSize = (mb) => (mb >= 1 ? `${mb.toFixed(1)} MB` : `${(mb * 1024).toFixed(0)} KB`);

/* ─── Upload Card ──────────────────────────────────────── */
const DocUploadCard = ({ docDef, leadId, uploadedDocs, onUploadSuccess }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const existing = uploadedDocs.find(d =>
    (d.documentType || d.document_type) === docDef.type
  );

  const status = existing
    ? (existing.status || existing.verification_status || 'Pending')
    : null;

  const statusConfig = {
    Verified:  { color: '#10b981', bg: '#ecfdf5', icon: <CheckCircleOutlined />, text: 'Verified'  },
    Rejected:  { color: '#ef4444', bg: '#fef2f2', icon: <CloseCircleOutlined />, text: 'Rejected'  },
    Pending:   { color: '#f59e0b', bg: '#fffbeb', icon: <ClockCircleOutlined />, text: 'Pending'   },
    Uploaded:  { color: '#6366f1', bg: '#eef2ff', icon: <CheckCircleOutlined />, text: 'Uploaded'  },
  };

  const sc = statusConfig[status] || null;
  const isVerified = status === 'Verified';

  const handleFile = async (file) => {
    if (!file) return;
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 10) { message.error('File size must be under 10 MB'); return; }

    try {
      setUploading(true);

      const category = DOCUMENT_TYPES.find(c =>
        c.docs.some(d => d.type === docDef.type)
      )?.category;

      // Step 1: File upload → fileUrl milega (same as VaultLeadDocuments pattern)
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('entityType', 'Lead');
      uploadForm.append('entityId', leadId);

      const uploadRes = await apiService.post('/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const fileUrl = uploadRes?.url || uploadRes?.file?.url;

      if (!fileUrl) throw new Error('File upload failed: no URL in response');

      // Step 2: JSON payload bhejo with fileUrl
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

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${dragOver ? PRIMARY : isVerified ? '#10b981' : '#e5e7eb'}`,
      borderRadius: 14,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: dragOver ? `0 0 0 3px ${PRIMARY}22` : '0 1px 4px rgba(0,0,0,0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Verified overlay tint */}
      {isVerified && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #ecfdf588 0%, #fff 60%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: existing ? (isVerified ? '#ecfdf5' : PRIMARY_LIGHT) : '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
            color: isVerified ? '#10b981' : existing ? PRIMARY : '#9ca3af',
          }}>
            {existing
              ? isPdf(existing.fileName || existing.file_name || '')
                ? <FilePdfOutlined />
                : <FileImageOutlined />
              : <UploadOutlined />}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', lineHeight: 1.3 }}>
              {docDef.label}
            </div>
            {existing?.fileName && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                {existing.fileName || existing.file_name}
              </div>
            )}
          </div>
        </div>

        {sc && (
          <span style={{
            fontSize: 12, fontWeight: 600, color: sc.color,
            background: sc.bg, padding: '4px 10px',
            borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {sc.icon} {sc.text}
          </span>
        )}
      </div>

      {/* Drop zone hint */}
      {!isVerified && (
        <div style={{
          border: `1.5px dashed ${dragOver ? PRIMARY : '#d1d5db'}`,
          borderRadius: 10, padding: '14px 10px',
          textAlign: 'center',
          background: dragOver ? PRIMARY_LIGHT : '#fafafa',
          transition: 'all 0.2s',
        }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {dragOver ? '📂 Drop to upload' : 'Drag & drop or click below'}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
            {docDef.accept.replace(/\./g, '').toUpperCase().replace(/,/g, ' • ')} • Max 10 MB
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        {!isVerified && (
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
                border: 'none', borderRadius: 8,
                fontWeight: 600, fontSize: 13,
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'opacity 0.2s',
              }}
            >
              {uploading ? (
                <><Spin size="small" /> Uploading…</>
              ) : existing ? (
                <><ReloadOutlined /> Re-upload</>
              ) : (
                <><UploadOutlined /> {status === 'Rejected' ? 'Upload Again' : 'Upload File'}</>
              )}
            </button>
          </>
        )}

        {existing && (
          <ViewButton doc={existing} />
        )}
      </div>

      {status === 'Rejected' && existing?.rejectionReason && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 8, padding: '8px 12px',
          fontSize: 12, color: '#dc2626',
        }}>
          <strong>Rejected:</strong> {existing.rejectionReason}
        </div>
      )}
    </div>
  );
};

/* ─── View Button ──────────────────────────────────────── */
const ViewButton = ({ doc }) => {
  const [open, setOpen] = useState(false);
  const fileUrl = doc.fileUrl || doc.url || doc.documentUrl || doc.file_url;
  if (!fileUrl) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '10px 14px', background: '#f3f4f6',
          border: '1px solid #e5e7eb', borderRadius: 8,
          color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        <EyeOutlined />
      </button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} width={1000} centered destroyOnClose title="Document Preview">
        <div style={{ minHeight: 600, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPdf(fileUrl)
            ? <iframe src={fileUrl} style={{ width: '100%', height: 600, border: 'none' }} />
            : <img src={fileUrl} alt="preview" style={{ maxHeight: 600, maxWidth: '100%', objectFit: 'contain' }} />
          }
        </div>
      </Modal>
    </>
  );
};

/* ─── Main Page ────────────────────────────────────────── */
const VaultLeadDocumentUpload = () => {
  const { leadId } = useParams();
  const navigate   = useNavigate();

  const [lead, setLead]         = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const [leadRes, docsRes] = await Promise.all([
        apiService.get(`/vault/lead/${leadId}`),
        apiService.get(`/vault/lead/documents/${leadId}`),
      ]);

      setLead(leadRes?.data?.data || leadRes?.data || leadRes || null);

      const raw = docsRes;
      const docs = Array.isArray(raw?.data) ? raw.data
        : Array.isArray(raw) ? raw
        : [];
      setDocuments(docs);
    } catch {
      message.error('Failed to load data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (leadId) fetchData(); }, [leadId]);

  /* ── Stats ── */
  const totalRequired  = ALL_DOC_TYPES.length;
  const uploaded       = documents.length;
  const verified       = documents.filter(d => (d.status || d.verification_status) === 'Verified').length;
  const rejected       = documents.filter(d => (d.status || d.verification_status) === 'Rejected').length;
  const pending        = documents.filter(d => {
    const s = d.status || d.verification_status;
    return !s || s === 'Pending' || s === 'Uploaded';
  }).length;
  const remaining      = totalRequired - uploaded;
  const pct            = Math.round((uploaded / totalRequired) * 100);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <Spin size="large" />
      </div>
    );
  }

  const ci = lead?.customerInfo || {};

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '32px 20px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>

        {/* ── Back ── */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1px solid #d1d5db',
            borderRadius: 8, padding: '8px 16px',
            cursor: 'pointer', color: '#374151', fontWeight: 500, fontSize: 14,
            marginBottom: 28,
          }}
        >
          <ArrowLeftOutlined /> Back
        </button>

        {/* ── Header ── */}
        <div style={{
          background: `linear-gradient(135deg, ${PRIMARY} 0%, #7c3aed 100%)`,
          borderRadius: 16, padding: '28px 32px',
          color: '#fff', marginBottom: 28,
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
          alignItems: 'center', gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, opacity: 0.7, textTransform: 'uppercase', marginBottom: 6 }}>
              Document Upload
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff' }}>
              {ci.fullName || 'Client Documents'}
            </h1>
            {lead?.leadId && (
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.7, fontFamily: 'monospace' }}>
                {lead.leadId}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Uploaded',  value: uploaded,   color: '#fff' },
              { label: 'Verified',  value: verified,   color: '#6ee7b7' },
              { label: 'Pending',   value: pending,    color: '#fcd34d' },
              { label: 'Rejected',  value: rejected,   color: '#fca5a5' },
              { label: 'Remaining', value: remaining,  color: '#c4b5fd' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Progress ── */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '20px 24px',
          border: '1px solid #e5e7eb', marginBottom: 28,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                Overall Progress
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>
                {uploaded} / {totalRequired} documents
              </span>
            </div>
            <Progress
              percent={pct}
              strokeColor={{ '0%': PRIMARY, '100%': '#7c3aed' }}
              trailColor="#e5e7eb"
              strokeWidth={10}
              showInfo={false}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: pct === 100 ? '#10b981' : PRIMARY }}>
              {pct}%
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>complete</div>
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{
              padding: '10px 18px', background: refreshing ? '#f3f4f6' : '#fff',
              border: '1px solid #d1d5db', borderRadius: 8,
              color: '#374151', cursor: refreshing ? 'not-allowed' : 'pointer',
              fontWeight: 500, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {refreshing ? <Spin size="small" /> : <ReloadOutlined />}
            Refresh
          </button>
        </div>

        {/* ── Document Categories ── */}
        {DOCUMENT_TYPES.map((category) => (
          <div key={category.category} style={{ marginBottom: 32 }}>
            {/* Category Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 16,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: PRIMARY, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>
                {category.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
                  {category.categoryLabel}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {category.docs.filter(d =>
                    documents.some(ud => (ud.documentType || ud.document_type) === d.type)
                  ).length} / {category.docs.length} uploaded
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}>
              {category.docs.map((docDef) => (
                <DocUploadCard
                  key={docDef.type}
                  docDef={docDef}
                  leadId={leadId}
                  uploadedDocs={documents}
                  onUploadSuccess={() => fetchData(true)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* ── All Done Banner ── */}
        {pct === 100 && (
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '1.5px solid #6ee7b7',
            borderRadius: 14, padding: '24px 28px',
            display: 'flex', alignItems: 'center', gap: 16,
            marginTop: 8,
          }}>
            <CheckCircleOutlined style={{ fontSize: 36, color: '#10b981' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#065f46' }}>
                All documents uploaded!
              </div>
              <div style={{ fontSize: 13, color: '#047857', marginTop: 4 }}>
                This lead is ready for submission once all documents are verified.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VaultLeadDocumentUpload;
