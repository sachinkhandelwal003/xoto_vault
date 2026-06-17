// src/pages/Cases/AdvisorCaseDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from '@/api/apiService';
import {
  Steps, Button, Card, Row, Col, Typography, Tag, Spin,
  Divider, Avatar, Alert, Space, Tooltip, Modal, Upload, message,
  notification, Progress, Badge, Empty, Grid, Descriptions,
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, BankOutlined, HomeOutlined,
  CheckCircleOutlined, UploadOutlined, SendOutlined, FileTextOutlined,
  CalendarOutlined, DollarOutlined, TrophyOutlined, CloudUploadOutlined,
  ClockCircleOutlined, SafetyOutlined, AuditOutlined, EnvironmentOutlined,
  PhoneOutlined, MailOutlined, GlobalOutlined, FileDoneOutlined,
  RocketOutlined, TeamOutlined, DownloadOutlined, EyeOutlined,
  LoadingOutlined, CheckOutlined, LinkOutlined, DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const THEME = '#5C039B';
const GRAD = 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)';
const GREEN = '#10b981';

const downloadPdf = (url, filename = 'document.pdf') => {
  if (!url) return;
  const a = document.createElement('a');
  // S3 URLs go through the backend download-pdf proxy (forces PDF conversion + download)
  if (url.includes('amazonaws.com') || url.includes('.s3.')) {
    try {
      const key = new URL(url).pathname.replace(/^\//, '');
      a.href = `${import.meta.env.VITE_API_BASE_URL || ''}/api/download-pdf?key=${encodeURIComponent(key)}`;
    } catch { a.href = url; }
  } else {
    // CDN or other public URLs — download directly
    a.href = url;
  }
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/* ─── Helper Components ─── */
const InfoRow = ({ label, value, icon }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px dashed #f1f5f9' }}>
    {icon && <span style={{ color: THEME, fontSize: 13, marginTop: 1, flexShrink: 0 }}>{icon}</span>}
    <Text style={{ fontSize: 12, color: '#64748b', flexShrink: 0, minWidth: 130 }}>{label}</Text>
    <Text style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, wordBreak: 'break-word' }}>{value ?? '—'}</Text>
  </div>
);

/* ─── SLA Badge ─── */
const SlaBadge = ({ sla, slaStatus }) => {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!sla?.startedAt) return null;

  const deadline  = new Date(sla.deadlineAt).getTime();
  const remaining = deadline - now;
  const hrs  = Math.floor(Math.abs(remaining) / 3_600_000);
  const mins = Math.floor((Math.abs(remaining) % 3_600_000) / 60_000);
  const overdue = remaining < 0;

  const cfg = {
    'on-track': { color: '#059669', bg: '#ecfdf5', label: 'On Track' },
    'at-risk':  { color: '#d97706', bg: '#fffbeb', label: 'At Risk' },
    'breached': { color: '#dc2626', bg: '#fef2f2', label: 'Breached' },
  }[slaStatus] || { color: '#64748b', bg: '#f1f5f9', label: 'SLA' };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: cfg.bg, color: cfg.color,
      borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 12, flexShrink: 0,
    }}>
      <ClockCircleOutlined style={{ fontSize: 13 }} />
      <span>SLA {cfg.label}</span>
      <span style={{ fontWeight: 400, opacity: 0.8 }}>
        {overdue ? '+' : ''}{hrs}h {mins}m {overdue ? 'overdue' : 'left'}
      </span>
    </div>
  );
};

const SectionCard = ({ title, icon, children, style }) => (
  <Card
    bordered={false}
    style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 16, ...style }}
    bodyStyle={{ padding: '18px 20px' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${THEME}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME, fontSize: 14 }}>
        {icon}
      </div>
      <Text style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{title}</Text>
    </div>
    {children}
  </Card>
);

/* ─── Document Card Component ─── */
const REQ_BADGES = [
  { key: 'requiresFrontBack',   label: 'Front & Back', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { key: 'requiresSignature',   label: 'Signed',       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'requiresStamp',       label: 'Stamped',      color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { key: 'requiresAttestation', label: 'Attested',     color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { key: 'requiresTranslation', label: 'Translated',   color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
];

const FileViewerModal = ({ url, name, onClose }) => {
  if (!url) return null;
  const lower = url.split('?')[0].toLowerCase();
  const isImg = /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(lower);
  const isPdf = lower.endsWith('.pdf');
  return (
    <Modal
      open={!!url} onCancel={onClose} footer={null} centered
      width="92vw" style={{ maxWidth: 1100, top: 20 }}
      styles={{ body: { padding: 0, height: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
      title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FileTextOutlined style={{ color: THEME }} /><span style={{ fontSize: 14, fontWeight: 700 }}>{name || 'Document Preview'}</span></div>}
    >
      <div style={{ flex: 1, overflow: 'hidden', background: '#1e293b', borderRadius: '0 0 8px 8px' }}>
        {isImg && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <img src={url} alt={name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
          </div>
        )}
        {isPdf && <iframe src={url} title={name} style={{ width: '100%', height: '100%', border: 'none' }} />}
        {!isImg && !isPdf && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <FileTextOutlined style={{ fontSize: 48, color: '#94a3b8' }} />
            <p style={{ color: '#94a3b8', margin: 0 }}>Preview not available for this file type.</p>
            <a href={url} target="_blank" rel="noreferrer" style={{ background: GRAD, color: '#fff', padding: '8px 20px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>
              <DownloadOutlined style={{ marginRight: 6 }} />Download File
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};

const DocCard = ({ doc, onUpload, uploading, onView }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const isUploading = uploading === doc.documentKey;

  const isUploaded  = doc.isUploaded || !!doc.fileUrl;
  const isTemplate  = doc.actionType === 'template_download' && doc.templateUrl;
  const canSkip     = doc.handledBy === 'Ops' && doc.actionType === 'template_download';
  const allowed     = doc.allowedFileTypes || ['pdf', 'jpg', 'jpeg', 'png'];

  const handleSelect = (file) => {
    if (file.size / 1024 / 1024 >= (doc.maxFileSizeMB || 10)) {
      message.error(`Max file size: ${doc.maxFileSizeMB || 10} MB`);
      return false;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      message.error(`Allowed: ${allowed.join(', ').toUpperCase()}`);
      return false;
    }
    setSelectedFile(file);
    setUploadProgress(0);
    return false;
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    onUpload(selectedFile, doc.documentKey, setUploadProgress);
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div style={{
      borderRadius: 12, marginBottom: 12,
      border: `1.5px solid ${isUploaded ? '#bbf7d0' : '#e2e8f0'}`,
      background: isUploaded ? '#f0fdf4' : '#fff',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', flexWrap: 'wrap' }}>

        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: isUploaded ? '#d1fae5' : '#f5f0ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isUploading
            ? <LoadingOutlined style={{ color: THEME, fontSize: 18 }} />
            : isUploaded
              ? <CheckCircleOutlined style={{ color: GREEN, fontSize: 18 }} />
              : <FileTextOutlined style={{ color: THEME, fontSize: 18 }} />
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{doc.documentName}</div>
          {doc.description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{doc.description}</div>}
          {doc.helperText && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontStyle: 'italic' }}>
              {'ℹ'} {doc.helperText}
            </div>
          )}

          {isTemplate && doc.instructions && (
            <div style={{ marginTop: 8, padding: '8px 10px', background: '#fffbeb', borderRadius: 7, border: '1px solid #fde68a' }}>
              {doc.instructions.split('\n').filter(Boolean).map((line, i) => (
                <div key={i} style={{ fontSize: 10, color: '#92400e', marginBottom: 2 }}>• {line}</div>
              ))}
            </div>
          )}

          {selectedFile && (
            <div style={{ marginTop: 5, fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileTextOutlined style={{ fontSize: 10 }} />
              <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
              <span style={{ color: '#94a3b8' }}>({(selectedFile.size / 1024).toFixed(0)} KB)</span>
              <button onClick={() => setSelectedFile(null)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10 }}>x</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
            {doc.isMandatory
              ? <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700 }}>Required</span>
              : <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0', fontWeight: 600 }}>Optional</span>
            }
            {doc.source === 'Bank'   && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontWeight: 700 }}>Bank Form</span>}
            {doc.source === 'Global' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 700 }}>Global</span>}
            {doc.handledBy === 'Advisor' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', fontWeight: 700 }}>You handle</span>}
            {doc.handledBy === 'Ops'     && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontWeight: 700 }}>Ops handles</span>}
            {canSkip    && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontWeight: 700 }}>Can Skip</span>}
            {isUploaded && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', fontWeight: 700 }}>Uploaded</span>}
            {REQ_BADGES.filter(b => doc[b.key]).map(b => (
              <span key={b.key} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: b.bg, color: b.color, border: `1px solid ${b.border}`, fontWeight: 600 }}>{b.label}</span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Accepts:</span>
            {allowed.map(t => (
              <span key={t} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: 0.4 }}>{t}</span>
            ))}
            <span style={{ fontSize: 10, color: '#94a3b8' }}>max {doc.maxFileSizeMB || 10} MB</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', flexShrink: 0, flexWrap: 'wrap', marginTop: 2 }}>
          {isTemplate && (
            <button
              onClick={() => downloadPdf(doc.templateUrl, doc.templateFileName || 'template.pdf')}
              style={{ fontSize: 11, padding: '6px 12px', borderRadius: 7, border: '1.5px solid #f59e0b', background: '#fff7ed', color: '#b45309', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <DownloadOutlined /> Download Template
            </button>
          )}

          {!isUploaded && (
            <>
              <Upload beforeUpload={handleSelect} showUploadList={false} maxCount={1} accept={allowed.map(t => `.${t}`).join(',')}>
                <button style={{
                  fontSize: 11, padding: '6px 12px', borderRadius: 7,
                  border: `1.5px solid ${selectedFile ? THEME : '#e2e8f0'}`,
                  background: selectedFile ? '#faf5ff' : '#fff',
                  cursor: 'pointer', color: selectedFile ? THEME : '#64748b',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <UploadOutlined /> {selectedFile ? 'Change' : 'Select File'}
                </button>
              </Upload>
              {selectedFile && (
                <button onClick={handleUpload} disabled={isUploading} style={{
                  fontSize: 11, padding: '6px 16px', borderRadius: 7, border: 'none',
                  background: isUploading ? '#94a3b8' : GRAD,
                  color: '#fff', cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
                  boxShadow: '0 2px 8px rgba(92,3,155,0.25)',
                }}>
                  {isUploading ? <><LoadingOutlined /> Uploading</> : <><CloudUploadOutlined /> Upload</>}
                </button>
              )}
            </>
          )}

          {isUploaded && doc.fileUrl && (
            <button onClick={() => onView && onView(doc.fileUrl, doc.documentName)} style={{
              fontSize: 11, padding: '6px 14px', borderRadius: 7,
              border: '1.5px solid #bbf7d0', background: '#f0fdf4',
              cursor: 'pointer', color: '#059669', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <EyeOutlined /> View File
            </button>
          )}
        </div>
      </div>

      {isUploading && uploadProgress > 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${uploadProgress}%`, background: GRAD, borderRadius: 4, transition: 'width 0.2s ease' }} />
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Uploading {uploadProgress}%</div>
        </div>
      )}
    </div>
  );
};

/* ─── Step 1: Application Overview ─── */
const CaseOverview = ({ data }) => {
  const c  = data.clientInfo || {};
  const p  = data.propertyInfo || {};
  const b  = data.bankSelection || {};
  const e  = data.eligibilitySnapshot || {};
  const tl = data.timeline || {};
  const pa = data.preApprovalInfo || {};
  const addr = p.propertyAddress || {};

  const isPreApprovalOnly = data.applicationSubType === 'pre_approval_only';
  // propertyAdded is true as soon as ops fills confirmedPropertyValue — don't require data.propertyFound
  const propertyAdded    = isPreApprovalOnly && !!pa.confirmedPropertyValue;
  const awaitingProperty = isPreApprovalOnly && !propertyAdded;

  const riskColor = { Excellent: '#10b981', Good: '#3b82f6', Fair: '#f59e0b', Poor: '#ef4444' };

  const stats = isPreApprovalOnly
    ? propertyAdded
      ? [
          { label: 'Confirmed Loan',     value: `AED ${Number(pa.confirmedLoanAmount || 0).toLocaleString()}`,     color: THEME },
          { label: 'Property Value',     value: `AED ${Number(pa.confirmedPropertyValue || 0).toLocaleString()}`, color: '#3b82f6' },
          { label: 'Confirmed LTV',      value: pa.confirmedLTV ? `${pa.confirmedLTV}%` : '—',                    color: GREEN },
          { label: 'Down Payment',       value: `AED ${Number(pa.confirmedDownPayment || 0).toLocaleString()}`,    color: '#f59e0b' },
        ]
      : [
          {
            label: pa.preApprovedAmount ? 'Pre-Approved Amount' : 'Requested Amount',
            value: pa.preApprovedAmount
              ? `AED ${pa.preApprovedAmount.toLocaleString()}`
              : p.loanAmount ? `AED ${p.loanAmount.toLocaleString()}` : '—',
            color: THEME,
          },
          {
            label: 'Max Affordable Property',
            value: pa.maxAffordablePropertyValue ? `AED ${pa.maxAffordablePropertyValue.toLocaleString()}` : '—',
            color: '#3b82f6',
          },
          {
            label: 'Max LTV',
            value: pa.maxLTV ? `${Math.round(pa.maxLTV * 100)}%` : '—',
            color: '#f59e0b',
          },
          {
            label: 'DBR',
            value: e.dbrPercentage ? `${e.dbrPercentage}%` : '—',
            color: (e.dbrPercentage || 0) > 50 ? '#ef4444' : GREEN,
          },
        ]
    : [
        { label: 'Property Value', value: `AED ${(p.propertyValue || 0).toLocaleString()}`, color: '#3b82f6' },
        { label: 'Loan Amount',    value: `AED ${(p.loanAmount    || 0).toLocaleString()}`, color: THEME },
        { label: 'Monthly EMI',    value: b.monthlyEMI ? `AED ${b.monthlyEMI.toLocaleString()}` : '—', color: '#f59e0b' },
        { label: 'Eligibility',    value: e.eligibilityScore ? `${e.eligibilityScore}/100` : '—', color: GREEN },
      ];

  return (
    <div>
      {/* Pre-Approval Only Banner */}
      {isPreApprovalOnly && (
        <div style={{
          borderRadius: 14, marginBottom: 16,
          background: awaitingProperty ? 'linear-gradient(135deg,#fff7ed,#fef3c7)' : 'linear-gradient(135deg,#f0fdf4,#d1fae5)',
          border: `1.5px solid ${awaitingProperty ? '#f59e0b' : '#10b981'}`,
          padding: '16px 20px',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: awaitingProperty ? '#f59e0b' : '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {awaitingProperty ? '🏠' : '✅'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: awaitingProperty ? '#92400e' : '#065f46', marginBottom: 4 }}>
              {awaitingProperty ? 'Pre-Approval Only — Property Not Yet Found' : 'Pre-Approval Only — Property Added'}
            </div>
            {awaitingProperty ? (
              <div style={{ fontSize: 13, color: '#78350f' }}>
                This application was created without a specific property. The bank will pre-approve a loan amount first.
                Once pre-approved, Ops adds the property and LTV is auto-calculated.
                {pa.maxAffordablePropertyValue && (
                  <span style={{ fontWeight: 700, color: '#92400e' }}>
                    {' '}Max affordable property: AED {pa.maxAffordablePropertyValue.toLocaleString()}.
                  </span>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#065f46' }}>
                Property confirmed by Ops.{' '}
                Loan: <strong>AED {Number(pa.confirmedLoanAmount || 0).toLocaleString()}</strong> &nbsp;·&nbsp;
                Property: <strong>AED {Number(pa.confirmedPropertyValue || 0).toLocaleString()}</strong> &nbsp;·&nbsp;
                Down Payment: <strong>AED {Number(pa.confirmedDownPayment || 0).toLocaleString()}</strong> &nbsp;·&nbsp;
                LTV: <strong style={{ color: GREEN }}>{pa.confirmedLTV}%</strong>.
              </div>
            )}
          </div>
          <Tag style={{
            borderRadius: 8, fontWeight: 700, flexShrink: 0, fontSize: 12,
            background: awaitingProperty ? '#fef3c7' : '#d1fae5',
            color: awaitingProperty ? '#92400e' : '#065f46',
            border: `1px solid ${awaitingProperty ? '#fbbf24' : '#6ee7b7'}`,
            padding: '4px 12px',
          }}>
            {awaitingProperty ? 'Awaiting Property' : 'Property Confirmed'}
          </Tag>
        </div>
      )}

      {/* Top Stats */}
      <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
        {stats.map(s => (
          <Col xs={12} sm={6} key={s.label}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${s.color}20`, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 3 }}>{s.label}</div>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={[14, 0]}>
        <Col xs={24} md={12}>
          <SectionCard title="Client Information" icon={<UserOutlined />}>
            <InfoRow label="Full Name"            value={c.fullName || [c.firstName, c.lastName].filter(Boolean).join(' ')} icon={<UserOutlined />} />
            <InfoRow label="Email"                value={c.email}             icon={<MailOutlined />} />
            <InfoRow label="Mobile"               value={c.phone || c.mobile} icon={<PhoneOutlined />} />
            <InfoRow label="Nationality"          value={c.nationality}       icon={<GlobalOutlined />} />
            <InfoRow label="Residency"            value={c.residencyStatus}   icon={<SafetyOutlined />} />
            <InfoRow label="Employment"           value={c.employmentStatus}  icon={<AuditOutlined />} />
            <InfoRow label="Monthly Salary"       value={(c.monthlySalary || c.fixedMonthlySalary) ? `AED ${Number(c.monthlySalary || c.fixedMonthlySalary).toLocaleString()}` : null} />
            <InfoRow label="Existing Liabilities" value={c.existingLiabilities ? `AED ${Number(c.existingLiabilities).toLocaleString()}` : null} />
            <InfoRow label="Mortgage Term"        value={c.mortgageTerm ? `${c.mortgageTerm} years` : null} />
            <InfoRow label="Fee Financing"        value={c.feeFinancingRequired != null ? (c.feeFinancingRequired ? 'Yes' : 'No') : null} />
          </SectionCard>

          {/* Property — conditional on flow */}
          {isPreApprovalOnly ? (
            awaitingProperty ? (
              <SectionCard title="Property — Awaiting Selection" icon={<HomeOutlined />}
                style={{ border: '1.5px dashed #f59e0b', background: '#fffbeb' }}>
                <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
                  <HomeOutlined style={{ fontSize: 36, color: '#f59e0b', marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#92400e' }}>No Property Selected Yet</div>
                  <div style={{ fontSize: 12, color: '#78350f', marginBottom: 14 }}>Ops will add property details after bank pre-approval.</div>
                </div>
                {pa.preApprovedAmount ? (
                  <>
                    <InfoRow label="Pre-Approved Amount"  value={`AED ${pa.preApprovedAmount.toLocaleString()}`} />
                    <InfoRow label="Max Affordable Prop." value={pa.maxAffordablePropertyValue ? `AED ${pa.maxAffordablePropertyValue.toLocaleString()}` : '—'} />
                    <InfoRow label="Applicable Max LTV"   value={pa.maxLTV ? `${Math.round(pa.maxLTV * 100)}%` : '—'} />
                    <InfoRow label="Pre-Approved On"      value={pa.preApprovedAt ? dayjs(pa.preApprovedAt).format('DD MMM YYYY') : '—'} />
                  </>
                ) : (
                  <div style={{ padding: '8px 12px', background: '#fef9c3', borderRadius: 8, fontSize: 12, color: '#713f12', textAlign: 'center' }}>
                    Pre-approval amount will appear once the bank responds.
                  </div>
                )}
              </SectionCard>
            ) : (
              <SectionCard title="Property — Confirmed by Ops" icon={<HomeOutlined />}
                style={{ border: '1.5px solid #10b981', background: '#f0fdf4' }}>
                {/* ── LTV Calculation Summary Box ── */}
                <div style={{
                  borderRadius: 12, background: '#fff', border: '1.5px solid #6ee7b7',
                  padding: '14px 16px', marginBottom: 12,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                    Auto-Calculated LTV Breakdown
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <div style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: THEME }}>
                        AED {Number(pa.confirmedLoanAmount || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Confirmed Loan</div>
                    </div>
                    <div style={{ fontSize: 16, color: '#94a3b8', fontWeight: 700 }}>÷</div>
                    <div style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
                        AED {Number(pa.confirmedPropertyValue || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Property Value</div>
                    </div>
                    <div style={{ fontSize: 16, color: '#94a3b8', fontWeight: 700 }}>=</div>
                    <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
                      <div style={{
                        fontSize: 20, fontWeight: 900, color: GREEN,
                        background: '#d1fae5', borderRadius: 8, padding: '4px 12px',
                        border: '1.5px solid #6ee7b7',
                      }}>
                        {pa.confirmedLTV}% LTV
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 8, padding: '6px 10px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Down Payment</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                        AED {Number(pa.confirmedDownPayment || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ flex: 1, background: '#f5f3ff', borderRadius: 8, padding: '6px 10px', border: '1px solid #ddd6fe' }}>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Bank Pre-Approved</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: THEME }}>
                        AED {Number(pa.preApprovedAmount || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ flex: 1, background: '#eff6ff', borderRadius: 8, padding: '6px 10px', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Max LTV Rule</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>
                        {pa.maxLTV ? `${Math.round(pa.maxLTV * 100)}%` : '—'}
                      </div>
                    </div>
                  </div>
                </div>
                {/* ── Detail rows ── */}
                <InfoRow label="Property Added On" value={pa.propertyAddedAt ? dayjs(pa.propertyAddedAt).format('DD MMM YYYY, HH:mm') : '—'} />
                <InfoRow label="Added By"          value={pa.propertyAddedBy?.userName ? `${pa.propertyAddedBy.userName} (${pa.propertyAddedBy.userRole})` : '—'} />
                {addr.area && <InfoRow label="Area" value={addr.area} icon={<EnvironmentOutlined />} />}
                {addr.city && <InfoRow label="City" value={addr.city} icon={<EnvironmentOutlined />} />}
                <InfoRow label="Transaction Type"  value={p.transactionType} />
                <InfoRow label="Property Type"     value={p.propertyType} />
              </SectionCard>
            )
          ) : (
            <SectionCard title="Property Information" icon={<HomeOutlined />}>
              <InfoRow label="Area"           value={addr.area}                                        icon={<EnvironmentOutlined />} />
              <InfoRow label="City"           value={addr.city}                                        icon={<EnvironmentOutlined />} />
              <InfoRow label="Property Value" value={`AED ${(p.propertyValue || 0).toLocaleString()}`} />
              <InfoRow label="Loan Amount"    value={`AED ${(p.loanAmount    || 0).toLocaleString()}`} />
              <InfoRow label="Down Payment"   value={p.downPayment ? `AED ${p.downPayment.toLocaleString()}` : null} />
              <InfoRow label="Property Type"  value={p.propertyType} />
              <InfoRow label="Transaction"    value={p.transactionType} />
              <InfoRow label="Tenure"         value={p.tenureYears ? `${p.tenureYears} years` : null} />
            </SectionCard>
          )}
        </Col>

        <Col xs={24} md={12}>
          <SectionCard title="Bank & Product" icon={<BankOutlined />}>
            <InfoRow label="Bank"          value={b.bankName} />
            <InfoRow label="Product"       value={b.productName} />
            <InfoRow label="Interest Rate" value={b.interestRate ? `${b.interestRate}% p.a.` : '—'} />
            <InfoRow label="Tenure"        value={b.tenureYears ? `${b.tenureYears} years` : '—'} />
            <InfoRow label="Monthly EMI"   value={b.monthlyEMI ? `AED ${b.monthlyEMI.toLocaleString()}` : '—'} />
          </SectionCard>

          <SectionCard title="Eligibility & DBR" icon={<SafetyOutlined />}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
              padding: '10px 14px', borderRadius: 10,
              background: e.isEligible ? '#f0fdf4' : '#fff1f2',
              border: `1px solid ${e.isEligible ? '#bbf7d0' : '#fecaca'}`,
            }}>
              {e.isEligible
                ? <CheckCircleOutlined style={{ color: GREEN, fontSize: 20 }} />
                : <ClockCircleOutlined style={{ color: '#ef4444', fontSize: 20 }} />
              }
              <div>
                <Text style={{ fontWeight: 700, color: e.isEligible ? GREEN : '#ef4444' }}>
                  {e.isEligible ? 'Eligible' : 'Not Eligible'}
                </Text>
                <div style={{ fontSize: 11, color: '#64748b' }}>{e.dbrStatus}</div>
              </div>
              {e.riskGrade && (
                <Tag style={{ marginLeft: 'auto', borderRadius: 6, fontWeight: 700, color: riskColor[e.riskGrade] || '#64748b', borderColor: (riskColor[e.riskGrade] || '#64748b') + '40', background: (riskColor[e.riskGrade] || '#64748b') + '12' }}>
                  {e.riskGrade}
                </Tag>
              )}
            </div>

            {e.dbrPercentage > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>Debt Burden Ratio (DBR)</Text>
                  <Text style={{ fontSize: 13, fontWeight: 800, color: e.dbrPercentage > 50 ? '#ef4444' : e.dbrPercentage > 40 ? '#f59e0b' : GREEN }}>
                    {e.dbrPercentage}%
                  </Text>
                </div>
                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4, transition: 'width 0.4s',
                    width: `${Math.min(e.dbrPercentage, 100)}%`,
                    background: e.dbrPercentage > 50 ? '#ef4444' : e.dbrPercentage > 40 ? '#f59e0b' : GREEN,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <Text style={{ fontSize: 10, color: '#94a3b8' }}>0%</Text>
                  <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>50% limit</Text>
                  <Text style={{ fontSize: 10, color: '#94a3b8' }}>100%</Text>
                </div>
              </div>
            )}

            <InfoRow label="Eligibility Score"   value={e.eligibilityScore ? `${e.eligibilityScore}/100` : '—'} />
            <InfoRow label="DBR %"               value={e.dbrPercentage ? `${e.dbrPercentage}%` : '—'} />
            <InfoRow label="Estimated LTV"       value={e.estimatedLTV ? `${e.estimatedLTV}%` : '—'} />
            <InfoRow label="Recommended Loan"    value={e.recommendedLoanAmount ? `AED ${e.recommendedLoanAmount.toLocaleString()}` : '—'} />
            <InfoRow label="Monthly Salary"      value={e.monthlySalary ? `AED ${e.monthlySalary.toLocaleString()}` : '—'} />
            <InfoRow label="Monthly Liabilities" value={e.existingMonthlyDebt ? `AED ${e.existingMonthlyDebt.toLocaleString()}` : '—'} />
            {e.eligibilityNotes && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b' }}>
                {e.eligibilityNotes}
              </div>
            )}
          </SectionCard>

          {isPreApprovalOnly && (
            <SectionCard title="Pre-Approval Summary" icon={<DollarOutlined />}
              style={{ border: `1px solid ${awaitingProperty ? '#fde68a' : '#bbf7d0'}`, background: awaitingProperty ? '#fffbeb' : '#f0fdf4' }}>
              <InfoRow label="Application Type" value="Pre-Approval Only" />
              <InfoRow label="Property Status"  value={propertyAdded ? 'Property Confirmed by Ops' : 'Awaiting Property'} />
              {p.loanAmount ? <InfoRow label="Customer Requested Loan" value={`AED ${Number(p.loanAmount).toLocaleString()}`} /> : null}
              {pa.preApprovedAmount ? (
                <>
                  <InfoRow label="Pre-Approved Amount"  value={`AED ${Number(pa.preApprovedAmount).toLocaleString()}`} />
                  <InfoRow label="Pre-Approved On"      value={pa.preApprovedAt ? dayjs(pa.preApprovedAt).format('DD MMM YYYY') : '—'} />
                  <InfoRow label="Max LTV (Bank Rule)"  value={pa.maxLTV ? `${Math.round(pa.maxLTV * 100)}%` : '—'} />
                  <InfoRow label="Max Affordable Prop." value={pa.maxAffordablePropertyValue ? `AED ${Number(pa.maxAffordablePropertyValue).toLocaleString()}` : '—'} />
                </>
              ) : null}
              {pa.confirmedLoanAmount ? (
                <>
                  <Divider style={{ margin: '10px 0' }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                    Confirmed by Ops
                  </div>
                  <InfoRow label="Property Value"     value={`AED ${Number(pa.confirmedPropertyValue || 0).toLocaleString()}`} />
                  <InfoRow label="Confirmed Loan"     value={`AED ${Number(pa.confirmedLoanAmount).toLocaleString()}`} />
                  <InfoRow label="Down Payment"       value={`AED ${Number(pa.confirmedDownPayment || 0).toLocaleString()}`} />
                  <InfoRow label="Confirmed LTV"      value={pa.confirmedLTV ? `${pa.confirmedLTV}%` : '—'} />
                  <InfoRow label="Property Added On"  value={pa.propertyAddedAt ? dayjs(pa.propertyAddedAt).format('DD MMM YYYY') : '—'} />
                </>
              ) : null}
              {!pa.preApprovedAmount ? (
                <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: '#78350f' }}>
                  Pre-approval details will appear once the bank responds.
                </div>
              ) : null}
            </SectionCard>
          )}

          {/* Pre-Approval Details for standard (non-pre-approval-only) cases */}
          {!isPreApprovalOnly && pa?.preApprovedAmount && (
            <SectionCard title="Pre-Approval Details" icon={<CheckCircleOutlined />}
              style={{ border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
              <InfoRow label="Pre-Approved Amount"  value={`AED ${Number(pa.preApprovedAmount).toLocaleString()}`} />
              <InfoRow label="Max LTV"              value={pa.maxLTV ? `${Math.round(pa.maxLTV * 100)}%` : '—'} />
              <InfoRow label="Max Affordable Prop." value={pa.maxAffordablePropertyValue ? `AED ${Number(pa.maxAffordablePropertyValue).toLocaleString()}` : '—'} />
              {pa.confirmedLoanAmount ? (
                <>
                  <Divider style={{ margin: '10px 0' }} />
                  <InfoRow label="Confirmed Loan"     value={`AED ${Number(pa.confirmedLoanAmount).toLocaleString()}`} />
                  <InfoRow label="Confirmed Property" value={`AED ${Number(pa.confirmedPropertyValue || 0).toLocaleString()}`} />
                  <InfoRow label="Down Payment"       value={pa.confirmedDownPayment ? `AED ${Number(pa.confirmedDownPayment).toLocaleString()}` : '—'} />
                  <InfoRow label="Confirmed LTV"      value={pa.confirmedLTV ? `${pa.confirmedLTV}%` : '—'} />
                  <InfoRow label="Property Added On"  value={pa.propertyAddedAt ? dayjs(pa.propertyAddedAt).format('DD MMM YYYY') : '—'} />
                </>
              ) : (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#fef9c3', borderRadius: 8, fontSize: 12, color: '#713f12', textAlign: 'center' }}>
                  Confirmed amounts will appear after bank finalises pre-approval.
                </div>
              )}
            </SectionCard>
          )}
        </Col>
      </Row>

      {((data.internalNotes?.length > 0) || (data.customerNotes?.length > 0)) && (
        <Row gutter={[14, 0]}>
          {data.internalNotes?.length > 0 && (
            <Col xs={24} md={12}>
              <SectionCard title="Internal Notes" icon={<FileTextOutlined />}>
                {data.internalNotes.map((n, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: '#faf5ff', borderRadius: 8, marginBottom: 6, fontSize: 13, color: '#374151', border: '1px solid #e9d5ff' }}>
                    {n}
                  </div>
                ))}
              </SectionCard>
            </Col>
          )}
          {data.customerNotes?.length > 0 && (
            <Col xs={24} md={12}>
              <SectionCard title="Customer Notes" icon={<FileTextOutlined />}>
                {data.customerNotes.map((n, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: '#f0f9ff', borderRadius: 8, marginBottom: 6, fontSize: 13, color: '#374151', border: '1px solid #bae6fd' }}>
                    {n}
                  </div>
                ))}
              </SectionCard>
            </Col>
          )}
        </Row>
      )}

      <SectionCard title="Application Timeline" icon={<ClockCircleOutlined />}>
        <Row gutter={[10, 10]}>
          {[
            { label: 'Created',            value: tl.createdAt },
            { label: 'Submitted to Xoto', value: tl.submittedToXotoAt },
            { label: 'Assigned to Ops',   value: tl.assignedToOpsAt },
            { label: 'Submitted to Bank', value: tl.submittedToBankAt },
            { label: 'Pre-Approved',      value: tl.preApprovedAt },
            { label: 'Disbursed',         value: tl.disbursedAt },
          ].map(item => (
            <Col xs={12} sm={8} md={4} key={item.label}>
              <div style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 10, background: item.value ? '#f0fdf4' : '#f8fafc', border: `1px solid ${item.value ? '#bbf7d0' : '#e2e8f0'}` }}>
                {item.value
                  ? <CheckCircleOutlined style={{ color: GREEN, fontSize: 16, marginBottom: 4, display: 'block' }} />
                  : <ClockCircleOutlined style={{ color: '#cbd5e1', fontSize: 16, marginBottom: 4, display: 'block' }} />
                }
                <div style={{ fontSize: 9, fontWeight: 700, color: item.value ? '#065f46' : '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                {item.value && <div style={{ fontSize: 10, color: '#059669', marginTop: 2 }}>{dayjs(item.value).format('DD MMM YY')}</div>}
              </div>
            </Col>
          ))}
        </Row>
      </SectionCard>
    </div>
  );
};

/* ─── Step 2: Global Documents ─── */
const GlobalDocuments = ({ documents, onUpload, uploading, onView }) => {
  const globalDocs = documents.filter(d => d.source === 'Global');
  const uploaded = globalDocs.filter(d => d.isUploaded).length;
  const total = globalDocs.length;
  const pct = total > 0 ? Math.round((uploaded / total) * 100) : 100;

  return (
    <div>
      <Card bordered={false} style={{ borderRadius: 14, marginBottom: 16, background: 'linear-gradient(135deg, #5C039B08, #03A4F408)', border: '1px solid #5C039B15' }} bodyStyle={{ padding: '18px 20px' }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={16}>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15, marginBottom: 6 }}>
              Global Document Progress
            </div>
            <Progress percent={pct} strokeColor={pct === 100 ? GREEN : THEME} trailColor="#e2e8f0" size={{ height: 10 }} style={{ marginBottom: 4 }} />
            <Text style={{ fontSize: 12, color: '#64748b' }}>
              {uploaded} of {total} required documents uploaded
            </Text>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: pct === 100 ? GREEN : THEME }}>{pct}%</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Complete</div>
          </Col>
        </Row>
      </Card>

      {globalDocs.length === 0 ? (
        <Card bordered={false} style={{ borderRadius: 14, textAlign: 'center', padding: '40px 0', border: '1px dashed #e2e8f0' }}>
          <CheckCircleOutlined style={{ fontSize: 40, color: GREEN, marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>No Global Documents Required</div>
          <Text type="secondary" style={{ fontSize: 13 }}>Proceed to Bank Forms step.</Text>
        </Card>
      ) : (
        globalDocs.map(doc => (
          <DocCard
            key={doc.documentKey}
            doc={doc}
            onUpload={onUpload}
            uploading={uploading}
            onView={onView}
          />
        ))
      )}
    </div>
  );
};

/* ─── Step 3: Bank Forms ─── */
const BankForms = ({ documents, bankInfo, onUpload, uploading, onView, onToggle, onSkipAll, skipLoading, advisorSkipBankForm, isSubmitted, isPartner }) => {
  const bankDocs = documents.filter(d => d.source === 'Bank');
  const uploaded = bankDocs.filter(d => d.isUploaded).length;
  const total = bankDocs.length;
  const pct = total > 0 ? Math.round((uploaded / total) * 100) : 100;
  const allUploaded = bankDocs.every(d => d.isUploaded);

  return (
    <div>
      <Card bordered={false} style={{ borderRadius: 14, marginBottom: 16, background: 'linear-gradient(135deg, #0369a108, #03A4F410)', border: '1px solid #03A4F420' }} bodyStyle={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#0369a1,#03A4F4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BankOutlined style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{bankInfo?.bankName || '—'}</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{bankInfo?.productName || '—'}</div>
          </div>
          <Row gutter={[12, 8]}>
            {[
              { label: 'Interest Rate', value: bankInfo?.interestRate ? `${bankInfo.interestRate}%` : '—' },
              { label: 'Tenure', value: bankInfo?.tenureYears ? `${bankInfo.tenureYears} yrs` : '—' },
              { label: 'Monthly EMI', value: bankInfo?.monthlyEMI ? `AED ${bankInfo.monthlyEMI.toLocaleString()}` : '—' },
            ].map(item => (
              <Col key={item.label}>
                <div style={{ textAlign: 'center', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#03A4F4' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{item.label}</div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </Card>

      <Card bordered={false} style={{ borderRadius: 14, marginBottom: 16, border: '1px solid #e2e8f0' }} bodyStyle={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Bank Document Progress</Text>
          <Text style={{ fontWeight: 700, color: pct === 100 ? GREEN : THEME }}>{pct}%</Text>
        </div>
        <Progress percent={pct} strokeColor={pct === 100 ? GREEN : '#03A4F4'} trailColor="#e2e8f0" size={{ height: 8 }} showInfo={false} />
        <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'block' }}>
          {uploaded} of {total} bank-specific documents uploaded
        </Text>
      </Card>

      {/* Skip Bank Forms bulk toggle — advisor only, Draft only */}
      {!isPartner && !isSubmitted && total > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: advisorSkipBankForm ? '#fff7ed' : '#f5f3ff',
          border: `1px solid ${advisorSkipBankForm ? '#fed7aa' : '#ddd6fe'}`,
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: advisorSkipBankForm ? '#c2410c' : '#5b21b6' }}>
              {advisorSkipBankForm
                ? `${total} bank form(s) sent to Ops`
                : `You are handling ${bankDocs.filter(d => d.handledBy === 'Advisor').length} bank form(s)`}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              {advisorSkipBankForm ? 'Ops will upload all bank-specific forms.' : 'Click to let Ops handle all bank forms instead.'}
            </div>
          </div>
          <button
            disabled={skipLoading || allUploaded}
            onClick={onSkipAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 9, border: 'none',
              cursor: skipLoading || allUploaded ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
              background: advisorSkipBankForm ? '#ea580c' : '#5b21b6',
              color: '#fff', opacity: skipLoading || allUploaded ? 0.6 : 1,
            }}
          >
            {skipLoading ? 'Updating...' : advisorSkipBankForm ? 'Handle myself' : 'Send all to Ops'}
          </button>
        </div>
      )}

      

      {bankDocs.length === 0 ? (
        <Card bordered={false} style={{ borderRadius: 14, textAlign: 'center', padding: '40px 0', border: '1px dashed #e2e8f0' }}>
          <CheckCircleOutlined style={{ fontSize: 40, color: GREEN, marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>No Bank-Specific Forms Required</div>
          <Text type="secondary" style={{ fontSize: 13 }}>Proceed to submit the application.</Text>
        </Card>
      ) : (
        bankDocs.map(doc => (
          <div key={doc.documentKey}>
            <DocCard
              doc={doc}
              onUpload={onUpload}
              uploading={uploading}
              onView={onView}
            />
            {!isPartner && doc.actionType === 'template_download' && doc.handledBy === 'Ops' && !doc.isUploaded && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8, marginBottom: 8 }}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => onToggle && onToggle(doc.documentKey, true)}
                  style={{ color: THEME, fontSize: 11 }}
                >
                  I want to handle this form myself →
                </Button>
              </div>
            )}
            {!isPartner && doc.actionType === 'template_download' && doc.handledBy === 'Advisor' && !doc.isUploaded && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8, marginBottom: 8 }}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => onToggle && onToggle(doc.documentKey, false)}
                  style={{ color: '#f59e0b', fontSize: 11 }}
                >
                  Assign to Ops team →
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
const roleSlugMap = { 18: 'vault-admin', 21: 'vaultpartner', 22: 'vaultagent', 23: 'vault-ops', 26: 'vault-advisor' };

const AdvisorCaseDetail = () => {
  const { user } = useSelector((s) => s.auth);
  const rawRole = user?.role;
  const roleCode = rawRole ? (typeof rawRole === 'object' ? Number(rawRole.code) : Number(rawRole)) : 26;
  const roleSlug = roleSlugMap[roleCode] ?? 'vault-advisor';
  const { caseId } = useParams();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [resubmitting, setResubmitting] = useState(false);
  const [skipLoading,  setSkipLoading]  = useState(false);
  const [viewerUrl,  setViewerUrl]  = useState(null);
  const [viewerName, setViewerName] = useState('');

  // Fetch Case Data
  const fetchCase = useCallback(async () => {
    try {
      const res = await apiService.get(`/vault/cases/${caseId}`);
      if (res?.success) setCaseData(res.data);
      else message.error('Failed to load application');
    } catch {
      message.error('Failed to load application details');
    }
  }, [caseId]);

  // Fetch Document Requirements
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await apiService.get(`/vault/cases/documents/${caseId}`);
      if (res?.success) {
        setDocuments(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    Promise.all([fetchCase(), fetchDocuments()]);
  }, [fetchCase, fetchDocuments]);

  // ✅ TWO-STEP UPLOAD PROCESS:
  // Step 1: Upload file to /upload endpoint to get URL
  // Step 2: Send URL to case document endpoint
  const handleDocUpload = async (file, documentKey, setProgress) => {
    setUploading(documentKey);
    try {
      // STEP 1: Upload file to get URL
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await apiService.upload('/upload', formData, (e) => {
        if (e.total && e.loaded && setProgress) {
          setProgress(Math.round((e.loaded / e.total) * 90));
        }
      });

const fileUrl =
  uploadRes?.file?.url ||
  uploadRes?.data?.file?.url ||
  uploadRes?.url ||
  uploadRes?.data?.url; 
       if (!fileUrl) {
        message.error('Upload failed: no file URL returned');
        return;
      }

      if (setProgress) setProgress(95);

      // STEP 2: Attach URL to case document
      const res = await apiService.post(`/vault/cases/documents/${caseId}`, {
        documentKey,
        fileUrl,
        fileName: file.name,
        fileSizeMb: (file.size / 1024 / 1024).toFixed(2),
        mimeType: file.type,
      });

      if (setProgress) setProgress(100);

      if (res?.success) {
        message.success('Document uploaded successfully');
        await fetchDocuments();
        await fetchCase();
      } else {
        message.error(res?.message || 'Failed to attach document');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  // Download Template
  const handleDownloadTemplate = (url, fileName) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      message.error('Template not available');
    }
  };

  // Toggle Document Handler
  const handleToggleHandler = async (documentKey, handledByAdvisor) => {
    try {
      const res = await apiService.post(`/vault/cases/documents/${caseId}/toggle-handler`, {
        documentKey,
        handledByAdvisor
      });
      if (res?.success) {
        message.success(res.message);
        await fetchDocuments();
        await fetchCase();
      } else {
        message.error(res?.message || 'Failed to toggle');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to toggle');
    }
  };

  // Bulk toggle — skip all bank forms to Ops or pull back
  const handleToggleSkipBankForms = async () => {
    setSkipLoading(true);
    try {
      const res = await apiService.post(`/vault/cases/documents/${caseId}/toggle-skip-bank-forms`);
      if (res?.success) {
        message.success(res.message);
        await fetchCase();
        await fetchDocuments();
      } else {
        message.error(res?.message || "Toggle failed");
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "Toggle failed");
    } finally {
      setSkipLoading(false);
    }
  };

  // Submit Case
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiService.post(`/vault/cases/${caseId}/submit`);
      if (res?.success) {
        setSubmitModalOpen(false);
        setSuccessOpen(true);
        await fetchCase();
      } else {
        message.error(res?.message || 'Submission failed');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };
  // Resubmit after correction
  const handleResubmit = async () => {
    if (!resubmitNotes.trim()) { message.error('Please describe the corrections made'); return; }
    setResubmitting(true);
    try {
      const res = await apiService.put(`/vault/cases/${caseId}/resubmit`, { correctionNotes: resubmitNotes });
      if (res?.success) {
        message.success('Application resubmitted successfully!');
        setResubmitOpen(false);
        setResubmitNotes('');
        await fetchCase();
      } else {
        message.error(res?.message || 'Resubmission failed');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Resubmission failed');
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <Spin size="large" />
        <Text style={{ color: THEME, fontWeight: 600 }}>Loading application details…</Text>
      </div>
    );
  }

  if (!caseData) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Text type="secondary">Application not found.</Text></div>;
  }

  // Check if all Advisor-handled documents are uploaded
  const allUploaded = documents.filter(d => d.handledBy === 'Advisor' && !d.isUploaded).length === 0;
  const isSubmitted = caseData.currentStatus !== 'Draft';

  const STATUS_COLOR = {
    Draft: { color: '#64748b', bg: '#f1f5f9' },
    'Submitted to Xoto': { color: '#2563eb', bg: '#eff6ff' },
    'Under Review': { color: THEME, bg: '#faf5ff' },
    Disbursed: { color: GREEN, bg: '#f0fdf4' },
    Lost: { color: '#ef4444', bg: '#fff1f2' },
  };
  const sc = STATUS_COLOR[caseData.currentStatus] || { color: '#64748b', bg: '#f1f5f9' };

  const STEPS = [
    { title: 'Application Overview', description: 'Details & eligibility' },
    { title: 'Global Documents', description: 'Standard doc uploads' },
    { title: 'Bank Forms', description: 'Bank-specific docs' },
  ];

  return (
    <div style={{ padding: screens.md ? '24px' : '12px', background: '#f8fafc', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: GRAD, borderRadius: 16, padding: screens.md ? '20px 28px' : '16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8, flexShrink: 0 }}
        >
          {screens.sm ? 'My Applications' : ''}
        </Button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: screens.md ? 20 : 16, color: '#fff', marginBottom: 2 }}>
            {caseData.caseReference}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
            {caseData.clientInfo?.fullName} · {caseData.bankSelection?.bankName || 'No bank'}
          </div>
        </div>
        <div style={{ background: sc.bg, color: sc.color, borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          {caseData.currentStatus}
        </div>

        {/* SLA badge */}
        <SlaBadge sla={caseData.sla} slaStatus={caseData.slaStatus} />
      </div>

      {/* Resubmit Banner */}
      {caseData.currentStatus === 'Returned - Pending Correction' && (
        <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1.5px solid #f59e0b', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#92400e' }}>Application Returned for Correction</div>
              <div style={{ fontSize: 12, color: '#78350f', marginTop: 2 }}>
                Please review the feedback, upload any corrected documents, and resubmit.
                {caseData.returnedToSubmitterNotes && (
                  <div style={{ marginTop: 6, background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, padding: '8px 12px', fontStyle: 'italic', color: '#92400e' }}>
                    <strong>Ops correction notes:</strong> {caseData.returnedToSubmitterNotes}
                  </div>
                )}
                {!caseData.returnedToSubmitterNotes && caseData.internalNotes?.length > 0 && (
                  <span style={{ marginLeft: 6, fontStyle: 'italic' }}>&ldquo;{caseData.internalNotes[caseData.internalNotes.length - 1]}&rdquo;</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setResubmitOpen(true)}
            style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(245,158,11,.4)' }}>
            ↩ Resubmit Application
          </button>
        </div>
      )}

      {/* Steps */}
      <Card bordered={false} style={{ borderRadius: 14, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: screens.md ? '20px 24px' : '14px 16px' }}>
        <Steps
          current={currentStep}
          items={STEPS.map((s, i) => ({
            title: <span style={{ fontSize: screens.sm ? 13 : 11, fontWeight: 600 }}>{s.title}</span>,
            description: screens.md ? <span style={{ fontSize: 11 }}>{s.description}</span> : undefined,
          }))}
          size={screens.md ? 'default' : 'small'}
          onChange={(v) => setCurrentStep(v)}
        />
      </Card>

      {/* Step content */}
      <div>
        {currentStep === 0 && <CaseOverview data={caseData} />}
        {currentStep === 1 && (
          <GlobalDocuments
            documents={documents}
            onUpload={handleDocUpload}
            uploading={uploading}
            onView={(url, name) => { setViewerUrl(url); setViewerName(name); }}
          />
        )}
        {currentStep === 2 && (
          <BankForms
            documents={documents}
            bankInfo={caseData.bankSelection}
            onUpload={handleDocUpload}
            uploading={uploading}
            onView={(url, name) => { setViewerUrl(url); setViewerName(name); }}
            onToggle={handleToggleHandler}
            onSkipAll={handleToggleSkipBankForms}
            skipLoading={skipLoading}
            advisorSkipBankForm={caseData.advisorSkipBankForm}
            isSubmitted={caseData.currentStatus !== 'Draft'}
          isPartner={roleCode === 21}
          />
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '16px 20px', background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: 10 }}>
        <Button
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          style={{ borderRadius: 8, minWidth: 110 }}
        >
          Previous
        </Button>

        <div style={{ display: 'flex', gap: 10 }}>
          {currentStep < 2 ? (
            <Button
              size="large"
              type="primary"
              onClick={() => setCurrentStep(currentStep + 1)}
              style={{ background: GRAD, border: 'none', borderRadius: 8, minWidth: 110, fontWeight: 700 }}
            >
              Next →
            </Button>
          ) : (
            <Tooltip title={isSubmitted ? 'Already submitted' : !allUploaded ? 'Upload all required documents first' : ''}>
              <Button
                size="large"
                type="primary"
                icon={<SendOutlined />}
                disabled={isSubmitted || !allUploaded}
                onClick={() => setSubmitModalOpen(true)}
                style={{
                  background: (isSubmitted || !allUploaded) ? undefined : GREEN,
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  minWidth: 160,
                }}
              >
                {isSubmitted ? 'Submitted' : 'Submit to Xoto'}
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        open={submitModalOpen}
        onCancel={() => setSubmitModalOpen(false)}
        footer={null}
        centered
        width={480}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RocketOutlined style={{ color: THEME, fontSize: 20 }} />
            <span style={{ fontWeight: 700 }}>Submit Application to Xoto</span>
          </div>
        }
      >
        <Alert
          message="Please confirm submission"
          description={`You are about to submit application "${caseData.caseReference}" for ${caseData.clientInfo?.fullName}. Once submitted, the Xoto team will process your application.`}
          type="warning"
          showIcon
          style={{ borderRadius: 10, marginBottom: 20 }}
        />
        <div style={{ background: '#faf5ff', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#64748b', fontSize: 13 }}>Client:</Text>
            <Text style={{ fontWeight: 700, fontSize: 13 }}>{caseData.clientInfo?.fullName}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#64748b', fontSize: 13 }}>Bank:</Text>
            <Text style={{ fontWeight: 700, fontSize: 13 }}>{caseData.bankSelection?.bankName}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ color: '#64748b', fontSize: 13 }}>Loan Amount:</Text>
            <Text style={{ fontWeight: 700, fontSize: 13, color: THEME }}>
              AED {(caseData.propertyInfo?.loanAmount || 0).toLocaleString()}
            </Text>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button onClick={() => setSubmitModalOpen(false)} style={{ borderRadius: 8 }}>Cancel</Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={submitting}
            onClick={handleSubmit}
            style={{ background: GREEN, border: 'none', borderRadius: 8, fontWeight: 700 }}
          >
            Yes, Submit
          </Button>
        </div>
      </Modal>


      {/* Resubmit Modal */}
      <Modal
        open={resubmitOpen}
        onCancel={() => { setResubmitOpen(false); setResubmitNotes(''); }}
        footer={null}
        centered
        width={500}
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>↩</span> <span style={{ fontWeight: 700, color: '#92400e' }}>Resubmit Application After Correction</span></div>}
      >
        <div style={{ padding: '4px 0' }}>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#78350f' }}>
            Application <strong>{caseData?.caseReference}</strong> was returned for correction. Describe the changes you have made before resubmitting.
          </div>
          {caseData?.internalNotes?.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', marginBottom: 4 }}>CORRECTION NOTES FROM OPS</div>
              <div style={{ fontSize: 13, color: '#7f1d1d' }}>{caseData.internalNotes[caseData.internalNotes.length - 1]}</div>
            </div>
          )}
          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#374151' }}>What corrections have you made? <span style={{ color: '#ef4444' }}>*</span></div>
          <textarea
            value={resubmitNotes}
            onChange={(e) => setResubmitNotes(e.target.value)}
            placeholder="Describe all corrections made (e.g. re-uploaded passport, added salary certificate, etc.)..."
            rows={4}
            style={{ width: '100%', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '10px 14px', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => { setResubmitOpen(false); setResubmitNotes(''); }}
              style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              Cancel
            </button>
            <button onClick={handleResubmit} disabled={resubmitting}
              style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', fontSize: 13, fontWeight: 700, cursor: resubmitting ? 'not-allowed' : 'pointer', opacity: resubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              {resubmitting ? '⏳ Submitting...' : '↩ Resubmit Application'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        open={successOpen}
        onCancel={() => setSuccessOpen(false)}
        footer={null}
        centered
        width={460}
      >
        <div style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ width: 80, height: 80, borderRadius: 40, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <TrophyOutlined style={{ fontSize: 42, color: GREEN }} />
          </div>
          <Title level={3} style={{ color: '#1e293b', marginBottom: 8 }}>Application Submitted! 🎉</Title>
          <Text style={{ fontSize: 14, color: '#64748b', display: 'block', marginBottom: 20 }}>
            Your application has been submitted to the Xoto team. We'll review it and get back to you within 24–48 hours.
          </Text>
          <div style={{ background: '#faf5ff', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <TeamOutlined style={{ fontSize: 20, color: THEME, marginRight: 8 }} />
            <Text style={{ fontSize: 13, color: THEME, fontWeight: 600 }}>Our team is now processing your application</Text>
          </div>
          <Button
            type="primary"
            size="large"
            style={{ background: GRAD, border: 'none', borderRadius: 10, fontWeight: 700, width: '100%' }}
            onClick={() => { setSuccessOpen(false); navigate(`/dashboard/${roleSlug}/case/view`); }}
          >
            Back to My Applications
          </Button>
        </div>
      </Modal>

      <FileViewerModal
        url={viewerUrl}
        name={viewerName}
        onClose={() => setViewerUrl(null)}
      />
    </div>
  );
};

export default AdvisorCaseDetail;  