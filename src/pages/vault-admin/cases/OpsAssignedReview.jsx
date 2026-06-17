import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from '@/api/apiService';
import { message, Spin, Modal, Tag, Progress, Form, Input, Alert, Empty, Tooltip } from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, ReloadOutlined, UserOutlined, BankOutlined, HomeOutlined,
  FileTextOutlined, DownloadOutlined, SendOutlined, RollbackOutlined,
  DollarOutlined, CalendarOutlined, PhoneOutlined, MailOutlined,
  InfoCircleOutlined, LoadingOutlined, RightOutlined, UploadOutlined,
  ThunderboltOutlined, FilePdfOutlined, FileImageOutlined,
  CheckOutlined, ClockCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fmtAED } from '@/utils/format';

const { TextArea } = Input;

const P    = '#5C039B';
const GRAD = 'linear-gradient(135deg,#5C039B 0%,#03A4F4 100%)';
const GN   = '#059669';
const AM   = '#d97706';
const RD   = '#dc2626';
const BL   = '#3b82f6';
const SL   = '#64748b';

const roleSlugMap = { '18': 'vault-admin', '23': 'vault-ops', '26': 'vault-advisor' };

/* ─── Status Config ─────────────────────────────────────── */
const STATUS_COLORS = {
  'Assigned - Pending Review':    AM,
  'Under Review':                 BL,
  'Returned - Pending Correction':RD,
  'Resubmitted-After Correction': '#8b5cf6',
  'Submitted to Bank':            P,
  'Pre-Approved':                 GN,
  'Collecting Documentation':     AM,
  'Valuation':                    AM,
  'FOL Processed':                BL,
  'FOL Issued':                   BL,
  'FOL Signed':                   GN,
  'Disbursed':                    GN,
  'Rejected':                     RD,
  'Lost':                         SL,
};
const sc = (s) => STATUS_COLORS[s] || SL;

/* ─── Status descriptions shown in update modal ─────────── */
const STATUS_INFO = {
  'Under Review': {
    icon: '🔍',
    desc: 'You are actively reviewing the documents. Verify each document one by one.',
    color: BL,
    requiresNote: false,
    requiresAmount: false,
    requiresBankRef: false,
  },
  'Returned - Pending Correction': {
    icon: '↩️',
    desc: 'Some documents are missing or rejected. Advisor will be notified to fix and resubmit.',
    color: RD,
    requiresNote: true,
    noteLabel: 'Correction Instructions *',
    notePlaceholder: 'Describe what the advisor needs to fix (e.g. Salary cert missing letterhead, passport copy blurry)…',
    requiresAmount: false,
    requiresBankRef: false,
  },
  'Submitted to Bank': {
    icon: '🏦',
    desc: 'All documents verified. Submitting the complete application package to the bank.',
    color: P,
    requiresNote: false,
    requiresAmount: false,
    requiresBankRef: true,
    bankRefLabel: 'Bank Reference Number',
    bankRefPlaceholder: 'e.g. FAB-2026-00451',
  },
  'Pre-Approved': {
    icon: '✅',
    desc: 'Bank has given pre-approval. Enter the approved loan amount confirmed by the bank.',
    color: GN,
    requiresNote: false,
    requiresAmount: true,
    amountLabel: 'Approved Amount *',
    amountPlaceholder: 'Enter bank approved amount',
    requiresBankRef: false,
  },
  'Valuation': {
    icon: '🏠',
    desc: 'Bank has ordered property valuation. Valuation company will inspect the property.',
    color: AM,
    requiresNote: false,
    requiresAmount: false,
    requiresBankRef: false,
  },
  'FOL Processed': {
    icon: '📋',
    desc: 'Formal Offer Letter is being processed by the bank.',
    color: BL,
    requiresNote: false,
    requiresAmount: false,
    requiresBankRef: false,
  },
  'FOL Issued': {
    icon: '📄',
    desc: 'Bank has issued the Formal Offer Letter. Customer needs to review and sign.',
    color: BL,
    requiresNote: false,
    requiresAmount: true,
    amountLabel: 'FOL Amount *',
    amountPlaceholder: 'Enter FOL loan amount',
    requiresBankRef: false,
  },
  'FOL Signed': {
    icon: '✍️',
    desc: 'Customer has signed the Formal Offer Letter. Awaiting loan disbursement.',
    color: GN,
    requiresNote: false,
    requiresAmount: false,
    requiresBankRef: false,
  },
  'Disbursed': {
    icon: '💰',
    desc: 'Bank has disbursed the loan. Enter the actual disbursed amount. Commission will be auto-calculated.',
    color: GN,
    requiresNote: false,
    requiresAmount: true,
    amountLabel: 'Disbursed Amount *',
    amountPlaceholder: 'Enter actual disbursed amount',
    requiresBankRef: true,
    bankRefLabel: 'Disbursement Reference',
    bankRefPlaceholder: 'e.g. TRF-2026-00123',
  },
  'Bank Application': {
    icon: '📝',
    desc: 'Application submitted and registered with the bank.',
    color: P,
    requiresNote: false,
    requiresAmount: false,
    requiresBankRef: false,
  },
  'Rejected': {
    icon: '❌',
    desc: 'Bank has rejected the application. The lead will be marked as Not Proceeding.',
    color: RD,
    requiresNote: true,
    noteLabel: 'Rejection Reason *',
    notePlaceholder: 'Explain why the bank rejected (e.g. DBR too high, property not eligible)…',
    requiresAmount: false,
    requiresBankRef: false,
  },
  'Lost': {
    icon: '🚫',
    desc: 'Application is lost — customer withdrew or deal fell through.',
    color: SL,
    requiresNote: true,
    noteLabel: 'Reason *',
    notePlaceholder: 'Why is this application being marked as lost?',
    requiresAmount: false,
    requiresBankRef: false,
  },
};

const PIPELINE = [
  { key: 'Assigned - Pending Review', title: 'Assigned' },
  { key: 'Under Review',              title: 'Under Review' },
  { key: 'Submitted to Bank',         title: 'Bank App' },
  { key: 'Pre-Approved',              title: 'Pre-Approved' },
  { key: 'Valuation',                 title: 'Valuation' },
  { key: 'FOL Processed',             title: 'FOL Processed' },
  { key: 'FOL Issued',                title: 'FOL Issued' },
  { key: 'FOL Signed',                title: 'FOL Signed' },
  { key: 'Disbursed',                 title: 'Disbursed' },
];

const NEXT_STATUSES = {
  'Assigned - Pending Review':    ['Under Review', 'Returned - Pending Correction'],
  'Under Review':                 ['Submitted to Bank', 'Returned - Pending Correction'],
  'Returned - Pending Correction':[],
  'Resubmitted-After Correction': ['Under Review'],
  'Submitted to Bank':            ['Pre-Approved', 'Bank Application', 'Rejected'],
  'Bank Application':             ['Pre-Approved', 'Rejected'],
  'Pre-Approved':                 ['Valuation', 'Rejected'],
  'Valuation':                    ['FOL Processed', 'Rejected'],
  'FOL Processed':                ['FOL Issued', 'Rejected'],
  'FOL Issued':                   ['FOL Signed', 'Rejected'],
  'FOL Signed':                   ['Disbursed', 'Rejected'],
  'Disbursed':                    [],
  'Rejected':                     [],
  'Lost':                         [],
};

const ALL_NEXT = [
  { value: 'Under Review',                label: 'Under Review',        color: BL },
  { value: 'Returned - Pending Correction',label: 'Return for Correction', color: RD },
  { value: 'Submitted to Bank',           label: 'Submit to Bank',      color: P },
  { value: 'Bank Application',            label: 'Bank Application',    color: P },
  { value: 'Pre-Approved',               label: 'Pre-Approved',         color: GN },
  { value: 'Valuation',                  label: 'Valuation',            color: AM },
  { value: 'FOL Processed',              label: 'FOL Processed',        color: BL },
  { value: 'FOL Issued',                 label: 'FOL Issued',           color: BL },
  { value: 'FOL Signed',                 label: 'FOL Signed',           color: GN },
  { value: 'Disbursed',                  label: 'Disbursed',            color: GN },
  { value: 'Rejected',                   label: 'Rejected',             color: RD },
  { value: 'Lost',                       label: 'Lost',                 color: SL },
];

const isPdf     = (url) => !!(url && url.split('?')[0].toLowerCase().endsWith('.pdf'));
const fmtDate   = (d)   => d ? dayjs(d).format('DD MMM YYYY, HH:mm') : '—';
const handleDownload = async (url, filename = 'document.pdf') => {
  try {
    if (!url) { message.error('Invalid URL'); return; }
    if (url.includes('.amazonaws.com')) {
      let key = url.split('.amazonaws.com/')[1];
      if (!key) { message.error('Invalid S3 URL'); return; }
      key = decodeURIComponent(key);
      await apiService.download(`/download-pdf?key=${encodeURIComponent(key)}`, filename);
      return;
    }
    window.open(url, '_blank');
  } catch (err) {
    console.error(err);
    message.error('Download Failed');
  }
};

/* ─── Helpers ───────────────────────────────────────────── */
const InfoRow = ({ label, value, bold, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ fontSize: 12, color: SL }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: highlight || (bold ? P : '#111827'), textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
  </div>
);

const SCard = ({ title, icon, children, accent }) => (
  <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 16 }}>
    <div style={{ background: `${accent || P}10`, padding: '12px 16px', borderBottom: `2px solid ${accent || P}25`, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: accent || P }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{title}</span>
    </div>
    <div style={{ padding: '4px 16px 14px' }}>{children}</div>
  </div>
);

/* ─── Amount Display Card ───────────────────────────────── */
const AmountCard = ({ caseData }) => {
  const at = caseData.amountTracking || {};
  const bd = caseData.bankDecision   || {};
  const di = caseData.disbursementInfo || {};
  const bs = caseData.bankSelection  || {};

  const items = [
    { label: 'Requested',  value: at.requestedAmount,  color: SL  },
    { label: 'Approved',   value: at.approvedAmount,   color: GN  },
    { label: 'Disbursed',  value: at.disbursedAmount,  color: P   },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 14 }}>
      <div style={{ background: `${P}10`, padding: '12px 16px', borderBottom: `2px solid ${P}25`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <DollarOutlined style={{ color: P }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Amount Tracking</span>
        {at.amountStatus && (
          <Tag style={{ marginLeft: 'auto', borderRadius: 20, fontSize: 10 }}
            color={at.amountStatus === 'Disbursed' ? 'success' : at.amountStatus === 'Approved' ? 'blue' : 'default'}>
            {at.amountStatus}
          </Tag>
        )}
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
          {items.map(it => (
            <div key={it.label} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: it.value ? `${it.color}10` : '#f8fafc', border: `1px solid ${it.value ? it.color + '30' : '#e5e7eb'}` }}>
              <div style={{ fontSize: 10, color: SL, fontWeight: 600, marginBottom: 4 }}>{it.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: it.value ? it.color : '#d1d5db' }}>
                {it.value ? `AED ${Number(it.value).toLocaleString()}` : '—'}
              </div>
            </div>
          ))}
        </div>
        <InfoRow label="Interest Rate" value={bs.interestRate ? `${bs.interestRate}%` : '—'} />
        <InfoRow label="Tenure" value={bs.tenureYears ? `${bs.tenureYears} years` : '—'} />
        <InfoRow label="Monthly EMI" value={fmtAED(bs.monthlyEMI)} bold />
        {bd.approvedAmount && <InfoRow label="Bank Approved" value={fmtAED(bd.approvedAmount)} bold highlight={GN} />}
        {di.disbursedAmount && <InfoRow label="Disbursed" value={fmtAED(di.disbursedAmount)} bold highlight={P} />}
        {di.disbursementRef && <InfoRow label="Disbursement Ref" value={di.disbursementRef} />}
        {di.disbursedTo && <InfoRow label="Disbursed To" value={di.disbursedTo} />}
        {caseData.bankSubmission?.bankReferenceNumber && (
          <InfoRow label="Bank Ref No." value={caseData.bankSubmission.bankReferenceNumber} />
        )}
      </div>
    </div>
  );
};

/* ─── Document Card ─────────────────────────────────────── */
const DocCard = ({ doc, onVerify, caseId, isOps, canAct, onUploadSuccess }) => {
  const [previewOpen, setPreviewOpen]   = useState(false);
  const [rejectOpen,  setRejectOpen]    = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const isVerified = doc.verificationStatus === 'verified';
  const isRejected = doc.verificationStatus === 'rejected';
  const isPending  = doc.verificationStatus === 'pending';
  const hasFile    = doc.isUploaded || !!doc.fileUrl;
  const isBankForm = doc.source === 'Bank';
  const isTemplate = isBankForm && doc.actionType === 'template_download' && !!doc.templateUrl;
  const canOpsUpload = isBankForm && isOps && !doc.isUploaded && doc.handledBy === 'Ops';

  const borderColor = isVerified ? GN : isRejected ? RD : hasFile ? `${P}60` : AM;
  const docLabel = doc.documentName || doc.documentKey?.replace(/_/g,' ') || 'Document';

  const doVerify = async () => {
    setLoading(true);
    try {
      const docId = doc.uploadedDocId || doc.documentId;
      const r = await apiService.post(`vault/cases/documents/${docId}/verify`, { qualityScore: 5 });
      if (r?.success) { message.success(`${docLabel} verified!`); onVerify(); }
      else message.error(r?.message || 'Failed to verify');
    } catch (e) { message.error(e?.response?.data?.message || 'Failed to verify'); }
    finally { setLoading(false); }
  };

  const doReject = async () => {
    if (!rejectReason.trim()) { message.error('Please provide a reason'); return; }
    setLoading(true);
    try {
      const docId = doc.uploadedDocId || doc.documentId;
      const r = await apiService.post(`vault/cases/documents/${docId}/reject`, { reason: rejectReason });
      if (r?.success) { message.warning(`${docLabel} rejected.`); setRejectOpen(false); setRejectReason(''); onVerify(); }
      else message.error(r?.message || 'Failed to reject');
    } catch (e) { message.error(e?.response?.data?.message || 'Failed to reject'); }
    finally { setLoading(false); }
  };

  const doUpload = async (file) => {
    if (!file) return;
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 10) { message.error('File must be under 10 MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await apiService.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const fileUrl = up?.file?.url || up?.data?.file?.url || up?.url || up?.data?.url;
      if (!fileUrl) throw new Error('No file URL returned');
      const r = await apiService.post(`/vault/cases/documents/${caseId}`, {
        documentKey: doc.documentKey,
        fileUrl,
        fileName: file.name,
        fileSizeMb: parseFloat(sizeMb.toFixed(2)),
        mimeType: file.type,
      });
      if (r?.success) { message.success(`${docLabel} uploaded!`); onUploadSuccess(); }
      else message.error(r?.message || 'Failed to attach document');
    } catch (e) { message.error(e?.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  return (
    <>
      <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: 14, background: '#fff', padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,.05)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: isVerified ? '#ecfdf5' : isRejected ? '#fef2f2' : hasFile ? '#faf5ff' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isPdf(doc.fileUrl)
              ? <FilePdfOutlined style={{ fontSize: 18, color: isVerified ? GN : isRejected ? RD : hasFile ? P : AM }} />
              : <FileImageOutlined style={{ fontSize: 18, color: isVerified ? GN : isRejected ? RD : hasFile ? P : AM }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', lineHeight: 1.3 }}>{docLabel}</div>
            {doc.description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{doc.description}</div>}
            {doc.fileName && <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{doc.fileName}</div>}
            <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 2 }}>
              {doc.uploadedAt ? `Uploaded ${dayjs(doc.uploadedAt).format('DD MMM YYYY')}` : 'Not uploaded'}
              {isVerified && doc.verifiedAt ? ` · Verified ${dayjs(doc.verifiedAt).format('DD MMM YYYY')}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
              {doc.isMandatory
                ? <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700 }}>Required</span>
                : <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0', fontWeight: 600 }}>Optional</span>}
              {doc.source === 'Bank' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontWeight: 700 }}>Bank Form</span>}
              {doc.source === 'Global' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 700 }}>Global</span>}
              {doc.handledBy === 'Ops' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontWeight: 700 }}>Ops handles</span>}
              {doc.handledBy === 'Partner' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 700 }}>Partner handles</span>}
            </div>
          </div>
          <Tag color={isVerified ? 'success' : isRejected ? 'error' : hasFile ? 'warning' : 'orange'}
            style={{ borderRadius: 20, fontSize: 10, flexShrink: 0, margin: 0 }}>
            {isVerified ? '✓ Verified' : isRejected ? '✗ Rejected' : hasFile ? '⏳ Pending' : '— Not Uploaded'}
          </Tag>
        </div>

        {/* Rejection reason */}
        {isRejected && doc.rejectionReason && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: RD }}>
            <strong>Reason:</strong> {doc.rejectionReason}
          </div>
        )}

        {/* Template download */}
        {isTemplate && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <DownloadOutlined /> Bank Form Template
            </div>
            {doc.instructions && (
              <div style={{ marginBottom: 8 }}>
                {doc.instructions.split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#78350f', marginBottom: 2 }}>• {line}</div>
                ))}
              </div>
            )}
            <button onClick={() => handleDownload(doc.templateUrl, doc.templateFileName || 'template.pdf')}
              style={{ width: '100%', padding: '7px 0', border: '1.5px solid #f59e0b', borderRadius: 8, background: '#fff7ed', color: '#b45309', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <DownloadOutlined /> Step 1: Download Template{doc.templateFileName ? ` — ${doc.templateFileName}` : ''}
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {hasFile && (
            <>
              <button onClick={() => setPreviewOpen(true)}
                style={{ flex: 1, padding: '6px 0', border: `1px solid #e9d5ff`, borderRadius: 8, background: '#faf5ff', color: P, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <EyeOutlined /> View
              </button>
              <button onClick={() => handleDownload(doc.fileUrl, doc.fileName || 'document.pdf')}
                style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb', color: SL, fontSize: 11, cursor: 'pointer' }}>
                <DownloadOutlined />
              </button>
            </>
          )}
          {canOpsUpload && (
            <>
              <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => doUpload(e.target.files?.[0])} />
              <button onClick={() => inputRef.current?.click()} disabled={uploading}
                style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: 8, background: AM, color: '#fff', fontSize: 11, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {uploading ? <><LoadingOutlined spin /> Uploading…</> : <><UploadOutlined /> {isTemplate ? 'Step 2: Upload Filled Form' : 'Upload Form'}</>}
              </button>
            </>
          )}
          {canAct && hasFile && isPending && (
            <button onClick={doVerify} disabled={loading}
              style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: 8, background: GN, color: '#fff', fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {loading ? <LoadingOutlined spin /> : <><CheckOutlined /> Verify</>}
            </button>
          )}
          {canAct && hasFile && (isPending || isVerified) && (
            <button onClick={() => setRejectOpen(true)} disabled={loading}
              style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: 8, background: RD, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <CloseCircleOutlined /> Reject
            </button>
          )}
          {!hasFile && !canOpsUpload && (
            <div style={{ flex: 1, textAlign: 'center', padding: '6px', background: '#f3f4f6', borderRadius: 8, fontSize: 11, color: '#9ca3af' }}>
              {doc.handledBy === 'Ops' ? 'Ops upload pending' : doc.handledBy === 'Partner' ? 'Partner uploaded' : 'Waiting for advisor'}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Modal title={`Preview: ${docLabel}`} open={previewOpen} onCancel={() => setPreviewOpen(false)}
        footer={<button onClick={() => window.open(doc.fileUrl, '_blank')} style={{ padding: '8px 18px', background: P, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Download</button>}
        width={900} centered>
        <div style={{ minHeight: 500, background: '#1e293b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPdf(doc.fileUrl)
            ? <iframe src={doc.fileUrl} style={{ width: '100%', height: 560, border: 'none' }} title="PDF" />
            : <img src={doc.fileUrl} alt={docLabel} style={{ maxHeight: 560, maxWidth: '100%', objectFit: 'contain' }} />}
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal title={<span style={{ color: RD }}><CloseCircleOutlined /> Reject Document</span>}
        open={rejectOpen} onCancel={() => { setRejectOpen(false); setRejectReason(''); }}
        footer={[
          <button key="c" onClick={() => { setRejectOpen(false); setRejectReason(''); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', marginRight: 8 }}>Cancel</button>,
          <button key="r" onClick={doReject} disabled={loading} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: RD, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: loading ? .7 : 1 }}>
            {loading ? 'Rejecting…' : 'Confirm Reject'}
          </button>
        ]}>
        <Alert message="Advisor will be notified and can re-upload" type="warning" showIcon style={{ borderRadius: 8, marginBottom: 12 }} />
        <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Document: <span style={{ color: P }}>{docLabel}</span></div>
        <TextArea rows={4} placeholder="Reason for rejection…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ borderRadius: 8 }} />
      </Modal>
    </>
  );
};

/* ─── Timeline Item ─────────────────────────────────────── */
const TlItem = ({ label, date, done }) => (
  <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? GN : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
      {done ? <CheckCircleOutlined style={{ color: '#fff', fontSize: 14 }} /> : <ClockCircleOutlined style={{ color: '#9ca3af', fontSize: 12 }} />}
    </div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: done ? '#111827' : '#9ca3af' }}>{label}</div>
      {done && date && <div style={{ fontSize: 11, color: SL, marginTop: 2 }}>{fmtDate(date)}</div>}
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────── */
export default function OpsAssignedReview() {
  const { caseId } = useParams();
  const navigate   = useNavigate();
  const { user }   = useSelector(s => s.auth);
  const roleCode   = user?.role?.code;
  const isOps      = roleCode === '23';
  const isAdmin    = roleCode === '18';
  const canAct     = isOps || isAdmin;

  const [caseData,   setCaseData]   = useState(null);
  const [documents,  setDocuments]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating,   setUpdating]   = useState(false);
  const [tab,        setTab]        = useState('documents');

  // Status update state
  const [statusModal, setStatusModal] = useState(false);
  const [selStatus,   setSelStatus]   = useState('');
  const [statusNote,  setStatusNote]  = useState('');
  const [amtField,    setAmtField]    = useState('');
  const [bankRef,     setBankRef]     = useState('');
  const [disbursedTo, setDisbursedTo] = useState('');
  const [maxLTV,          setMaxLTV]          = useState('80');
  const [confirmedPropVal,setConfirmedPropVal] = useState('');

  // Return to queue state
  const [returnModal,  setReturnModal]  = useState(false);
  const [returnReason, setReturnReason] = useState('');

  // Bulk verify state
  const [verifyingAll, setVerifyingAll] = useState(false);

  /* ── Fetch ─────────────────────────────────────────────── */
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [cr, dr] = await Promise.all([
        apiService.get(`vault/cases/${caseId}`),
        apiService.get(`vault/cases/documents/${caseId}`),
      ]);
      if (cr?.success) {
        const cd = cr.data?.case || cr.data;
        setCaseData(cd);
      } else {
        message.error('Failed to load application');
      }
      if (dr?.success) setDocuments(dr.data || []);
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (caseId) fetchData(); }, [caseId]);

  /* ── Open status modal ──────────────────────────────────── */
  const openStatusModal = (status) => {
    setSelStatus(status);
    setStatusNote('');
    setAmtField('');
    setBankRef('');
    setDisbursedTo('');
    setMaxLTV('80');
    setConfirmedPropVal('');
    setStatusModal(true);
  };

  const closeStatusModal = () => {
    setStatusModal(false);
    setSelStatus('');
    setStatusNote('');
    setAmtField('');
    setBankRef('');
    setDisbursedTo('');
    setMaxLTV('80');
    setConfirmedPropVal('');
  };

  /* ── Status Update ──────────────────────────────────────── */
  const handleUpdateStatus = async () => {
    if (!selStatus) return;
    const info = STATUS_INFO[selStatus] || {};
    if (info.requiresAmount && !amtField) { message.error('Please enter the amount'); return; }
    if (info.requiresNote && !statusNote.trim()) { message.error('Please provide a reason'); return; }

    setUpdating(true);
    try {
      const payload = { status: selStatus };
      if (statusNote)  payload.notes         = statusNote;
      if (bankRef)     payload.bankReference  = bankRef;
      if (disbursedTo) payload.disbursedTo    = disbursedTo;

      if (selStatus === 'FOL Issued')  payload.approvedAmount = parseFloat(amtField);
      if (selStatus === 'Disbursed')   payload.approvedAmount = parseFloat(amtField);

      if (selStatus === 'Pre-Approved') {
        const preApprAmt  = parseFloat(amtField) || 0;
        const ltvPct      = parseFloat(maxLTV) || 80;
        const ltvDecimal  = ltvPct / 100;

        payload.approvedAmount = preApprAmt;

        const pa = {
          preApprovedAmount:          preApprAmt,
          maxLTV:                     ltvDecimal,
          maxAffordablePropertyValue: preApprAmt > 0 ? Math.round(preApprAmt / ltvDecimal) : null,
        };

        // Use form input if provided, else existing propertyInfo value
        const existingPropVal = parseFloat(confirmedPropVal) || caseData?.propertyInfo?.propertyValue || 0;
        if (existingPropVal > 0 && preApprAmt > 0) {
          const confirmedLoan = Math.min(preApprAmt, Math.round(existingPropVal * ltvDecimal));
          pa.confirmedPropertyValue = existingPropVal;
          pa.confirmedLoanAmount    = confirmedLoan;
          pa.confirmedDownPayment   = existingPropVal - confirmedLoan;
          pa.confirmedLTV           = Math.round((confirmedLoan / existingPropVal) * 1000) / 10;
          pa.propertyAddedAt        = new Date().toISOString();
          // Signal to backend that property has been confirmed
          payload.propertyFound = true;
        }
        payload.preApprovalInfo = pa;
      }

      const r = await apiService.put(`vault/cases/${caseId}/status`, payload);
      if (r?.success) {
        message.success(`Status updated to ${selStatus}`);
        closeStatusModal();
        fetchData();
      } else {
        message.error(r?.message || 'Failed to update status');
      }
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  /* ── Return to Queue ────────────────────────────────────── */
  const handleReturn = async () => {
    if (!returnReason.trim()) { message.error('Please provide a reason'); return; }
    setUpdating(true);
    try {
      const r = await apiService.post(`vault/cases/ops/return/${caseId}`, { reason: returnReason });
      if (r?.success) {
        message.warning('Application returned to queue');
        setReturnModal(false); setReturnReason('');
        fetchData();
      } else {
        message.error(r?.message || 'Failed to return application');
      }
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to return application');
    } finally {
      setUpdating(false);
    }
  };

  /* ── Bulk verify all pending docs ───────────────────────── */
  const verifyAllPending = async () => {
    const pendingDocs = documents.filter(d =>
      d.verificationStatus === 'pending' && (d.isUploaded || d.fileUrl)
    );
    if (pendingDocs.length === 0) { message.info('No pending documents to verify'); return; }
    setVerifyingAll(true);
    try {
      const results = await Promise.allSettled(
        pendingDocs.map(doc => {
          const docId = doc.uploadedDocId || doc.documentId || doc._id;
          return apiService.post(`vault/cases/documents/${docId}/verify`, { qualityScore: 5 });
        })
      );
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
      if (successCount === pendingDocs.length) {
        message.success(`All ${successCount} pending document(s) verified!`);
      } else {
        message.warning(`Verified ${successCount} of ${pendingDocs.length} document(s). Some may have failed.`);
      }
      fetchData();
    } catch (e) {
      message.error('Bulk verify failed');
    } finally {
      setVerifyingAll(false);
    }
  };

  /* ── Loading / Empty states ─────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  );

  if (!caseData) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <Empty description="Application not found" />
      <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: '8px 20px', background: P, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Go Back</button>
    </div>
  );

  const ci  = caseData.clientInfo          || {};
  const pi  = caseData.propertyInfo        || {};
  const bs  = caseData.bankSelection       || {};
  const es  = caseData.eligibilitySnapshot || {};
  const oq  = caseData.opsQueue            || {};
  const tl  = caseData.timeline            || {};
  const ds  = caseData.documentSummary     || {};
  const at  = caseData.amountTracking      || {};
  const bd  = caseData.bankDecision        || {};

  const statusColor = sc(caseData.currentStatus);
  const pipelineIdx = PIPELINE.findIndex(p => p.key === caseData.currentStatus);
  const nextStatuses = NEXT_STATUSES[caseData.currentStatus] || [];

  // Document groups
  const bankForms  = documents.filter(d => d.source === 'Bank');
  const globalDocs = documents.filter(d => d.source === 'Global');
  const verifiedCnt = documents.filter(d => d.verificationStatus === 'verified').length;
  const rejectedCnt = documents.filter(d => d.verificationStatus === 'rejected').length;
  const pendingCnt  = documents.filter(d => d.verificationStatus === 'pending' && (d.isUploaded || d.fileUrl)).length;
  const verifyPct   = documents.length ? Math.round((verifiedCnt / documents.length) * 100) : 0;

  const selInfo = STATUS_INFO[selStatus] || {};

  const tabs = [
    { key: 'documents', label: 'Documents', badge: pendingCnt + rejectedCnt },
    { key: 'overview',  label: 'Overview' },
    { key: 'timeline',  label: 'Timeline' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb' }}>

      {/* ── Header ── */}
      <div style={{ background: GRAD, padding: '20px 24px 0', boxShadow: '0 4px 20px rgba(92,3,155,.25)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => navigate(-1)}
                style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeftOutlined />
              </button>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{caseData.caseReference}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>
                  <UserOutlined style={{ marginRight: 5 }} />{ci.fullName}
                  <span style={{ margin: '0 8px', opacity: .5 }}>·</span>
                  <MailOutlined style={{ marginRight: 5 }} />{ci.email}
                  <span style={{ margin: '0 8px', opacity: .5 }}>·</span>
                  <PhoneOutlined style={{ marginRight: 5 }} />{ci.mobile}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: `${statusColor}30`, border: `1.5px solid ${statusColor}`, borderRadius: 20, padding: '5px 14px', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                {caseData.currentStatus}
              </div>
              <button onClick={fetchData} disabled={refreshing}
                style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ReloadOutlined spin={refreshing} />
              </button>
            </div>
          </div>

          {/* Pipeline */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, overflow: 'hidden' }}>
            {PIPELINE.map((p, i) => {
              const done   = pipelineIdx > i;
              const active = pipelineIdx === i;
              return (
                <div key={p.key} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', background: active ? 'rgba(255,255,255,.2)' : done ? 'rgba(255,255,255,.1)' : 'transparent', borderRadius: active ? 8 : 0 }}>
                  <div style={{ fontSize: 10, fontWeight: active ? 800 : done ? 600 : 400, color: active ? '#fff' : done ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                  {active && <div style={{ height: 3, background: '#fff', borderRadius: 2, marginTop: 4 }} />}
                  {done   && <div style={{ height: 3, background: 'rgba(255,255,255,.5)', borderRadius: 2, marginTop: 4 }} />}
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding: '10px 22px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, borderRadius: '10px 10px 0 0', background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? P : 'rgba(255,255,255,.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {t.label}
                {t.badge > 0 && <span style={{ background: tab === t.key ? RD : 'rgba(255,255,255,.25)', color: '#fff', borderRadius: 20, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* ── DOCUMENTS TAB ── */}
            {tab === 'documents' && (
              <div>
                {/* Summary chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Total Docs', value: documents.length, color: P  },
                    { label: 'Verified',   value: verifiedCnt,       color: GN },
                    { label: 'Pending',    value: pendingCnt,         color: AM },
                    { label: 'Rejected',   value: rejectedCnt,        color: RD },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: 12, color: SL, fontWeight: 600 }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Verification progress */}
                <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Verification Progress</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {canAct && pendingCnt > 0 && (
                        <button
                          onClick={verifyAllPending}
                          disabled={verifyingAll}
                          style={{ padding: '5px 12px', border: `1.5px solid ${GN}`, borderRadius: 8, background: verifyingAll ? '#f0fdf4' : '#fff', color: GN, fontSize: 11, fontWeight: 700, cursor: verifyingAll ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, opacity: verifyingAll ? .7 : 1 }}>
                          <CheckCircleOutlined /> {verifyingAll ? 'Verifying…' : `Verify All Pending (${pendingCnt})`}
                        </button>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 700, color: verifyPct === 100 ? GN : P }}>{verifyPct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${verifyPct}%`, background: verifyPct === 100 ? GN : GRAD, borderRadius: 4, transition: 'width .4s' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                    {ds.advisorRequired > 0 && <span style={{ fontSize: 11, color: SL }}>Advisor: {ds.advisorUploaded || 0}/{ds.advisorRequired || 0} uploaded</span>}
                    {ds.opsRequired > 0     && <span style={{ fontSize: 11, color: SL }}>Ops: {ds.opsUploaded || 0}/{ds.opsRequired || 0} uploaded</span>}
                    {ds.partnerRequired > 0 && <span style={{ fontSize: 11, color: SL }}>Partner: {ds.partnerUploaded || 0}/{ds.partnerRequired || 0} uploaded</span>}
                  </div>
                </div>

                {/* Global Documents */}
                {globalDocs.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${BL}20` }}>
                      <div style={{ width: 6, height: 22, borderRadius: 3, background: BL }} />
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Global Documents</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>({globalDocs.filter(d => d.verificationStatus === 'verified').length}/{globalDocs.length} verified)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
                      {globalDocs.map(doc => (
                        <DocCard key={doc._id} doc={doc} onVerify={fetchData} caseId={caseId} isOps={false} canAct={canAct} onUploadSuccess={fetchData} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Bank Forms */}
                {bankForms.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${P}20` }}>
                      <div style={{ width: 6, height: 22, borderRadius: 3, background: P }} />
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Bank Forms</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>({bankForms.filter(d => d.verificationStatus === 'verified').length}/{bankForms.length} verified)</span>
                      {isOps && <span style={{ marginLeft: 6, fontSize: 11, color: AM, background: '#fef3c7', padding: '2px 8px', borderRadius: 20 }}>You can upload missing forms</span>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
                      {bankForms.map(doc => (
                        <DocCard key={doc._id} doc={doc} onVerify={fetchData} caseId={caseId} isOps={isOps} canAct={canAct} onUploadSuccess={fetchData} />
                      ))}
                    </div>
                  </div>
                )}

                {documents.length === 0 && (
                  <div style={{ background: '#fff', borderRadius: 14, padding: 60, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                    <FileTextOutlined style={{ fontSize: 44, color: '#d1d5db' }} />
                    <div style={{ marginTop: 12, color: '#9ca3af' }}>No documents uploaded yet</div>
                  </div>
                )}
              </div>
            )}

            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                <SCard title="Client Information" icon={<UserOutlined />} accent={BL}>
                  <InfoRow label="Full Name"            value={ci.fullName || [ci.firstName, ci.lastName].filter(Boolean).join(' ')} bold />
                  <InfoRow label="Email"                value={ci.email}           />
                  <InfoRow label="Mobile"               value={ci.phone || ci.mobile} />
                  <InfoRow label="Nationality"          value={ci.nationality}     />
                  <InfoRow label="Residency"            value={ci.residencyStatus} />
                  <InfoRow label="Employment"           value={ci.employmentStatus}/>
                  <InfoRow label="Monthly Salary"       value={ci.monthlySalary || ci.fixedMonthlySalary ? `AED ${Number(ci.monthlySalary || ci.fixedMonthlySalary).toLocaleString()}` : null} />
                  <InfoRow label="Liabilities/mo"       value={ci.existingLiabilities ? `AED ${Number(ci.existingLiabilities).toLocaleString()}` : null} />
                  <InfoRow label="Mortgage Term"        value={ci.mortgageTerm ? `${ci.mortgageTerm} years` : null} />
                  <InfoRow label="Fee Financing"        value={ci.feeFinancingRequired != null ? (ci.feeFinancingRequired ? 'Yes' : 'No') : null} />
                </SCard>
                <SCard title="Property & Loan" icon={<HomeOutlined />} accent={AM}>
                  <InfoRow label="Property Value" value={fmtAED(pi.propertyValue)} bold />
                  <InfoRow label="Loan Amount"    value={fmtAED(pi.loanAmount)}    bold />
                  <InfoRow label="Area"           value={pi.propertyAddress?.area} />
                  <InfoRow label="City"           value={pi.propertyAddress?.city} />
                </SCard>
                <SCard title="Bank & Product" icon={<BankOutlined />} accent={P}>
                  <InfoRow label="Bank"          value={bs.bankName}    bold />
                  <InfoRow label="Product"       value={bs.productName} />
                  <InfoRow label="Interest Rate" value={bs.interestRate ? `${bs.interestRate}%` : '—'} />
                  <InfoRow label="Tenure"        value={bs.tenureYears  ? `${bs.tenureYears} years` : '—'} />
                  <InfoRow label="Monthly EMI"   value={fmtAED(bs.monthlyEMI)} />
                </SCard>
                <SCard title="Eligibility" icon={<CheckCircleOutlined />} accent={GN}>
                  <InfoRow label="Status"          value={es.isEligible ? '✓ Eligible' : '✗ Not Eligible'} bold />
                  <InfoRow label="DBR"             value={es.dbrPercentage != null ? `${es.dbrPercentage}%` : '—'} />
                  <InfoRow label="DBR Status"      value={es.dbrStatus} />
                  <InfoRow label="LTV"             value={es.estimatedLTV != null ? `${es.estimatedLTV}%` : '—'} />
                  <InfoRow label="Score"           value={es.eligibilityScore != null ? `${es.eligibilityScore}/100` : '—'} />
                  <InfoRow label="Risk Grade"      value={es.riskGrade} />
                  <InfoRow label="Recommended Amt" value={fmtAED(es.recommendedLoanAmount)} />
                </SCard>
                <SCard title="Ops Queue" icon={<ClockCircleOutlined />} accent={AM}>
                  <InfoRow label="Entered Queue"  value={fmtDate(oq.enteredQueueAt)} />
                  <InfoRow label="Picked Up By"   value={oq.pickedUpBy?.opsName} bold />
                  <InfoRow label="Picked Up At"   value={fmtDate(oq.pickedUpBy?.pickedUpAt)} />
                  <InfoRow label="Return Count"   value={oq.returnCount || 0} />
                  {oq.returnedToQueue?.returnedAt && <InfoRow label="Last Returned" value={fmtDate(oq.returnedToQueue.returnedAt)} />}
                  {oq.returnedToQueue?.reason && <InfoRow label="Return Reason" value={oq.returnedToQueue.reason} />}
                </SCard>
                {/* Bank Decision */}
                {(bd.status !== 'Pending' || bd.approvedAmount) && (
                  <SCard title="Bank Decision" icon={<BankOutlined />} accent={GN}>
                    <InfoRow label="Decision" value={bd.status} bold highlight={bd.status === 'Approved' ? GN : bd.status === 'Rejected' ? RD : SL} />
                    {bd.approvedAmount   && <InfoRow label="Approved Amount" value={fmtAED(bd.approvedAmount)} bold highlight={GN} />}
                    {bd.approvedRate     && <InfoRow label="Approved Rate"   value={`${bd.approvedRate}%`} />}
                    {bd.decisionDate     && <InfoRow label="Decision Date"   value={fmtDate(bd.decisionDate)} />}
                    {bd.rejectionReason  && <InfoRow label="Rejection Reason" value={bd.rejectionReason} />}
                    {bd.decisionNotes    && <InfoRow label="Notes"           value={bd.decisionNotes} />}
                  </SCard>
                )}
                {/* Pre-Approval Info */}
                {caseData.preApprovalInfo?.preApprovedAmount && (
                  <SCard title="Pre-Approval Details" icon={<CheckCircleOutlined />} accent={GN}>
                    <InfoRow label="Pre-Approved Amount"   value={`AED ${Number(caseData.preApprovalInfo.preApprovedAmount).toLocaleString()}`}  bold highlight={GN} />
                    <InfoRow label="Max LTV"               value={caseData.preApprovalInfo.maxLTV ? `${Math.round(caseData.preApprovalInfo.maxLTV * 100)}%` : '—'} />
                    <InfoRow label="Max Affordable Prop."  value={caseData.preApprovalInfo.maxAffordablePropertyValue ? `AED ${Number(caseData.preApprovalInfo.maxAffordablePropertyValue).toLocaleString()}` : '—'} />
                    {caseData.preApprovalInfo.confirmedPropertyValue ? (
                      <>
                        <div style={{ height: 1, background: '#f3f4f6', margin: '8px 0' }} />
                        <InfoRow label="Confirmed Property" value={`AED ${Number(caseData.preApprovalInfo.confirmedPropertyValue).toLocaleString()}`} bold />
                        <InfoRow label="Confirmed Loan"     value={`AED ${Number(caseData.preApprovalInfo.confirmedLoanAmount).toLocaleString()}`}    bold highlight={GN} />
                        <InfoRow label="Down Payment"       value={`AED ${Number(caseData.preApprovalInfo.confirmedDownPayment).toLocaleString()}`} />
                        <InfoRow label="Confirmed LTV"      value={`${caseData.preApprovalInfo.confirmedLTV}%`} />
                      </>
                    ) : (
                      <div style={{ background: '#fffbeb', borderRadius: 8, padding: '8px 12px', marginTop: 8, fontSize: 11, color: '#92400e' }}>
                        ⏳ Property not confirmed yet — customer still searching
                      </div>
                    )}
                  </SCard>
                )}

                {/* Ops internal notes (not visible to Advisor/Partner) */}
                {caseData.opsNotes && (
                  <SCard title="Ops Internal Notes" icon={<InfoCircleOutlined />} accent="#7c3aed">
                    <div style={{ background: '#f5f3ff', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#4c1d95', fontStyle: 'italic' }}>
                      {caseData.opsNotes}
                    </div>
                  </SCard>
                )}

                {/* Submission notes from Advisor/Partner */}
                {caseData.submissionNotes && (
                  <SCard title="Submission Notes" icon={<InfoCircleOutlined />} accent="#2563eb">
                    <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1d4ed8' }}>
                      {caseData.submissionNotes}
                    </div>
                  </SCard>
                )}

                {(caseData.internalNotes?.length > 0 || caseData.customerNotes?.length > 0) && (
                  <SCard title="Notes" icon={<InfoCircleOutlined />} accent={SL}>
                    {caseData.internalNotes?.map((n, i) => (
                      <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#374151', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: SL, fontSize: 10, display: 'block', marginBottom: 2 }}>INTERNAL</span>{n}
                      </div>
                    ))}
                    {caseData.customerNotes?.map((n, i) => (
                      <div key={i} style={{ background: '#ecfdf5', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#374151', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: GN, fontSize: 10, display: 'block', marginBottom: 2 }}>CUSTOMER</span>{n}
                      </div>
                    ))}
                  </SCard>
                )}
              </div>
            )}

            {/* ── TIMELINE TAB ── */}
            {tab === 'timeline' && (
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: P, marginBottom: 24 }}>Application Timeline</div>
                <TlItem label="Application Created"      date={tl.createdAt}          done={!!tl.createdAt} />
                <TlItem label="Submitted to Xoto" date={tl.submittedToXotoAt}  done={!!tl.submittedToXotoAt} />
                <TlItem label="Assigned to Ops"   date={tl.assignedToOpsAt}    done={!!tl.assignedToOpsAt} />
                <TlItem label="Submitted to Bank" date={tl.submittedToBankAt}  done={!!tl.submittedToBankAt} />
                <TlItem label="Pre-Approved"      date={tl.preApprovedAt}      done={!!tl.preApprovedAt} />
                <TlItem label="Valuation"         date={tl.valuationAt}        done={!!tl.valuationAt} />
                <TlItem label="FOL Processed"     date={tl.folProcessedAt}     done={!!tl.folProcessedAt} />
                <TlItem label="FOL Issued"        date={tl.folIssuedAt}        done={!!tl.folIssuedAt} />
                <TlItem label="FOL Signed"        date={tl.folSignedAt}        done={!!tl.folSignedAt} />
                <TlItem label="Disbursed"         date={tl.disbursedAt}        done={!!tl.disbursedAt} />

                {/* Status change history */}
                {caseData.statusHistory?.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 10 }}>Status History</div>
                    {caseData.statusHistory.map((h, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5c039b', marginTop: 6, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{h.status}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{h.changedByName} · {h.changedAt ? new Date(h.changedAt).toLocaleString('en-AE') : ''}</div>
                          {h.notes && <div style={{ fontSize: 11, color: '#374151', fontStyle: 'italic', marginTop: 2 }}>{h.notes}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Status card */}
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ background: `linear-gradient(135deg,${statusColor},${statusColor}cc)`, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.8)', fontWeight: 700, letterSpacing: 1, marginBottom: 3 }}>CURRENT STATUS</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{caseData.currentStatus}</div>
              </div>
              <div style={{ padding: '10px 16px' }}>
                <InfoRow label="Application Ref"     value={caseData.caseReference} bold />
                <InfoRow label="Created By"   value={caseData.createdBy?.role?.toUpperCase()} />
                <InfoRow label="Picked Up By" value={oq.pickedUpBy?.opsName || 'You'} />
                {oq.pickedUpBy?.pickedUpAt && <InfoRow label="Since" value={fmtDate(oq.pickedUpBy.pickedUpAt)} />}
              </div>
            </div>

            {/* Amount Tracking */}
            <AmountCard caseData={caseData} />

            {/* Doc verification */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Document Verification</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Progress type="circle" percent={verifyPct} width={68}
                  strokeColor={verifyPct === 100 ? GN : P}
                  format={p => <span style={{ fontSize: 14, fontWeight: 700 }}>{p}%</span>} />
                <div>
                  <div style={{ fontSize: 12, color: GN, marginBottom: 3 }}>✓ {verifiedCnt} verified</div>
                  <div style={{ fontSize: 12, color: AM, marginBottom: 3 }}>⏳ {pendingCnt} pending</div>
                  <div style={{ fontSize: 12, color: RD }}>✗ {rejectedCnt} rejected</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {canAct && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ThunderboltOutlined style={{ color: AM }} /> Quick Actions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                  {/* Mark Under Review */}
                  <button
                    onClick={() => openStatusModal('Under Review')}
                    disabled={updating || caseData.currentStatus === 'Under Review'}
                    style={{ padding: '9px 12px', border: `1.5px solid ${BL}`, borderRadius: 10, background: caseData.currentStatus === 'Under Review' ? '#eff6ff' : '#fff', color: BL, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, opacity: caseData.currentStatus === 'Under Review' ? .6 : 1 }}>
                    <EyeOutlined /> Mark Under Review
                    {caseData.currentStatus === 'Under Review' && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓ Active</span>}
                  </button>

                  {/* Return to Queue — locked once Under Review */}
                  {(() => {
                    const isUnderReview = caseData.currentStatus === 'Under Review';
                    return (
                      <Tooltip
                        title={isUnderReview ? 'Cannot return to queue once substantive review has begun. Use "Return Application for Corrections" instead.' : ''}
                        placement="left">
                        <button
                          onClick={() => !isUnderReview && setReturnModal(true)}
                          disabled={updating || isUnderReview}
                          style={{ padding: '9px 12px', border: `1.5px solid ${isUnderReview ? '#d1d5db' : AM}`, borderRadius: 10, background: isUnderReview ? '#f9fafb' : '#fff', color: isUnderReview ? '#9ca3af' : AM, fontSize: 12, fontWeight: 700, cursor: isUnderReview ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, opacity: isUnderReview ? .6 : 1, width: '100%' }}>
                          <RollbackOutlined /> Return Application to Queue
                          {isUnderReview && <span style={{ marginLeft: 'auto', fontSize: 10, background: '#e5e7eb', padding: '1px 6px', borderRadius: 10 }}>Locked</span>}
                        </button>
                      </Tooltip>
                    );
                  })()}

                  <div style={{ height: 1, background: '#f3f4f6', margin: '2px 0' }} />
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, marginBottom: 2 }}>SUGGESTED NEXT</div>

                  {nextStatuses.filter(s => s !== 'Under Review').map(sv => {
                    const sc2 = ALL_NEXT.find(a => a.value === sv);
                    if (!sc2) return null;
                    return (
                      <button key={sv} onClick={() => openStatusModal(sv)}
                        style={{ padding: '8px 12px', border: `1.5px solid ${sc2.color}40`, borderRadius: 10, background: `${sc2.color}08`, color: sc2.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RightOutlined style={{ fontSize: 10 }} /> {sc2.label}
                        <Tag color="purple" style={{ marginLeft: 'auto', fontSize: 9, borderRadius: 10, padding: '0 5px' }}>Suggested</Tag>
                      </button>
                    );
                  })}

                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, marginTop: 4, marginBottom: 2 }}>OTHER</div>
                  {ALL_NEXT.filter(s => !nextStatuses.includes(s.value) && s.value !== 'Under Review' && s.value !== caseData.currentStatus).map(sc2 => (
                    <button key={sc2.value} onClick={() => openStatusModal(sc2.value)}
                      style={{ padding: '7px 12px', border: `1px solid ${sc2.color}30`, borderRadius: 10, background: '#fafafa', color: sc2.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RightOutlined style={{ fontSize: 9 }} /> {sc2.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Update Modal ── */}
      <Modal
        title={<span><SendOutlined style={{ color: selInfo.color || GN, marginRight: 8 }} />Update Status</span>}
        open={statusModal}
        onCancel={closeStatusModal}
        footer={[
          <button key="c" onClick={closeStatusModal}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', marginRight: 8 }}>Cancel</button>,
          <button key="s" onClick={handleUpdateStatus} disabled={updating}
            style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: selInfo.color || GN, color: '#fff', cursor: updating ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: updating ? .7 : 1 }}>
            {updating ? 'Updating…' : 'Confirm Update'}
          </button>
        ]}
        width={500}>

        {/* Status transition */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <Tag style={{ borderRadius: 20, fontSize: 11, padding: '2px 10px' }}>{caseData?.currentStatus}</Tag>
          <RightOutlined style={{ color: '#d1d5db' }} />
          <Tag style={{ borderRadius: 20, fontSize: 11, padding: '2px 10px', background: `${selInfo.color}15`, color: selInfo.color, border: `1px solid ${selInfo.color}40` }}>
            {selInfo.icon} {selStatus}
          </Tag>
        </div>

        {/* Description */}
        {selInfo.desc && (
          <div style={{ background: `${selInfo.color}10`, border: `1px solid ${selInfo.color}30`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <InfoCircleOutlined style={{ color: selInfo.color, marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{selInfo.desc}</span>
          </div>
        )}

        {/* Warning for Disbursed */}
        {selStatus === 'Disbursed' && (
          <Alert message="Commission will be automatically calculated and created after marking disbursed." type="success" showIcon style={{ borderRadius: 8, marginBottom: 14, fontSize: 12 }} />
        )}

        {/* Warning for Rejected */}
        {selStatus === 'Rejected' && (
          <Alert message="This will mark the lead as Not Proceeding. This action cannot be undone." type="error" showIcon style={{ borderRadius: 8, marginBottom: 14, fontSize: 12 }} />
        )}

        {/* Bank Reference */}
        {selInfo.requiresBankRef && (
          <Form.Item label={selInfo.bankRefLabel || 'Bank Reference'} style={{ marginBottom: 14 }}>
            <Input
              placeholder={selInfo.bankRefPlaceholder || 'Enter reference'}
              value={bankRef}
              onChange={e => setBankRef(e.target.value)}
              prefix={<BankOutlined style={{ color: '#9ca3af' }} />}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        )}

        {/* Amount */}
        {selInfo.requiresAmount && (
          <Form.Item label={selInfo.amountLabel || 'Amount *'} style={{ marginBottom: 14 }}>
            <Input
              placeholder={selInfo.amountPlaceholder || 'Enter amount'}
              value={amtField}
              onChange={e => setAmtField(e.target.value)}
              prefix="AED"
              type="number"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        )}

        {/* Pre-Approved extra fields */}
        {selStatus === 'Pre-Approved' && (() => {
          const preApprAmt   = parseFloat(amtField) || 0;
          const ltvPct       = parseFloat(maxLTV) || 80;
          const ltvDecimal   = ltvPct / 100;
          const existingProp = parseFloat(confirmedPropVal) || caseData?.propertyInfo?.propertyValue || 0;
          const hasProp      = existingProp > 0;
          const confirmedLoan= hasProp && preApprAmt ? Math.min(preApprAmt, Math.round(existingProp * ltvDecimal)) : 0;
          const confirmedDP  = hasProp ? existingProp - confirmedLoan : 0;
          const maxProp      = preApprAmt && ltvDecimal ? Math.round(preApprAmt / ltvDecimal) : 0;
          return (
            <>
              <Form.Item label="Max LTV % (Bank Rule)" style={{ marginBottom: 14 }}>
                <Input
                  value={maxLTV}
                  onChange={e => setMaxLTV(e.target.value)}
                  suffix="%"
                  type="number"
                  placeholder="80"
                  style={{ borderRadius: 8 }}
                />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                  CBUAE: 80% for ≤ AED 5M property · 70% for &gt; AED 5M
                </div>
              </Form.Item>

              {!caseData?.propertyInfo?.propertyValue && (
                <Form.Item label="Property Value AED (if known)" style={{ marginBottom: 14 }}>
                  <Input
                    value={confirmedPropVal}
                    onChange={e => setConfirmedPropVal(e.target.value)}
                    prefix="AED"
                    type="number"
                    placeholder="Leave blank if customer has no property yet"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              )}

              {preApprAmt > 0 && (
                <div style={{
                  borderRadius: 12, padding: '12px 16px', marginBottom: 14,
                  background: hasProp ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${hasProp ? '#a7f3d0' : '#fde68a'}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: hasProp ? '#065f46' : '#92400e', marginBottom: 8 }}>
                    {hasProp ? '✓ Auto-calculated from property value:' : '⚡ Pre-approval only (no property):'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {hasProp ? [
                      { label: 'Property Value',  value: `AED ${existingProp.toLocaleString()}` },
                      { label: 'Confirmed Loan',  value: `AED ${confirmedLoan.toLocaleString()}` },
                      { label: 'Down Payment',    value: `AED ${confirmedDP.toLocaleString()}`   },
                      { label: 'LTV',             value: `${Math.round((confirmedLoan / existingProp) * 1000) / 10}%` },
                    ] : [
                      { label: 'Pre-Approved',      value: `AED ${preApprAmt.toLocaleString()}` },
                      { label: 'Max Property',      value: maxProp ? `AED ${maxProp.toLocaleString()}` : '—' },
                    ]}
                  </div>
                  {!hasProp && (
                    <div style={{ fontSize: 11, color: '#78350f', marginTop: 8 }}>
                      Ops will add property details separately after customer finds property.
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}

        {/* Disbursed To */}
        {selStatus === 'Disbursed' && (
          <Form.Item label="Disbursed To (optional)" style={{ marginBottom: 14 }}>
            <Input
              placeholder="e.g. Developer / Seller / Existing bank"
              value={disbursedTo}
              onChange={e => setDisbursedTo(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        )}

        {/* Notes */}
        {selInfo.requiresNote ? (
          <Form.Item label={selInfo.noteLabel || 'Reason *'} style={{ marginBottom: 0 }}>
            <TextArea
              rows={4}
              placeholder={selInfo.notePlaceholder || 'Provide details…'}
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        ) : (
          <Form.Item label="Notes (optional)" style={{ marginBottom: 0 }}>
            <TextArea
              rows={3}
              placeholder="Add any internal notes…"
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        )}
      </Modal>

      {/* ── Return to Queue Modal ── */}
      <Modal
        title={<span><RollbackOutlined style={{ color: AM, marginRight: 8 }} />Return Application to Queue</span>}
        open={returnModal}
        onCancel={() => { setReturnModal(false); setReturnReason(''); }}
        footer={[
          <button key="c" onClick={() => { setReturnModal(false); setReturnReason(''); }}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', marginRight: 8 }}>Cancel</button>,
          <button key="r" onClick={handleReturn} disabled={updating}
            style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: AM, color: '#fff', cursor: updating ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: updating ? .7 : 1 }}>
            {updating ? 'Returning…' : 'Return Application'}
          </button>
        ]}
        width={500}>
        <Alert message="Application will be returned to ops queue for another ops to pick up." type="warning" showIcon style={{ marginBottom: 14, borderRadius: 8 }} />
        <div style={{ marginBottom: 10 }}><strong>Application:</strong> <code>{caseData.caseReference}</code></div>
        <Form.Item label="Reason for returning *" required style={{ marginBottom: 0 }}>
          <TextArea
            rows={4}
            placeholder="e.g. Documents incomplete, needs re-submission by advisor, incorrect information…"
            value={returnReason}
            onChange={e => setReturnReason(e.target.value)}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
      </Modal>
    </div>
  );
}