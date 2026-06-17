// src/pages/vault-admin/cases/AdminCaseDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from '@/api/apiService';
import { Grid, Spin, Select, message, Modal, Divider } from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, BankOutlined, HomeOutlined,
  CheckCircleOutlined, FileTextOutlined, CalendarOutlined,
  ClockCircleOutlined, SafetyOutlined, AuditOutlined, EnvironmentOutlined,
  PhoneOutlined, MailOutlined, GlobalOutlined, EyeOutlined,
  DownloadOutlined, TeamOutlined, InboxOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { useBreakpoint } = Grid;
const { Option } = Select;

const PRIMARY = '#5C039B';
const GRAD    = 'linear-gradient(135deg,#5C039B 0%,#03A4F4 100%)';
const GREEN   = '#059669';

/* ─── All statuses ─── */
const ALL_STATUSES = [
  'Draft',
  'Submitted to Xoto',
  'In Ops Queue - Pending Pick-up',
  'Assigned - Pending Review',
  'Under Review',
  'Returned - Pending Correction',
  'Resubmitted-After Correction',
  'Submitted to Bank',
  'Bank Application',
  'Pre-Approved',
  'Valuation',
  'FOL Processed',
  'FOL Issued',
  'FOL Signed',
  'Disbursed',
  'Declined',
  'Lost',
  'Rejected',
];

/* ─── Status colour map ─── */
const SC = {
  'Draft':                             { color: '#64748b', bg: '#f1f5f9' },
  'Submitted to Xoto':                 { color: '#2563eb', bg: '#eff6ff' },
  'In Ops Queue - Pending Pick-up':    { color: '#d97706', bg: '#fffbeb' },
  'Assigned - Pending Review':         { color: '#7c3aed', bg: '#f5f3ff' },
  'Under Review':                      { color: '#7c3aed', bg: '#f5f3ff' },
  'Returned - Pending Correction':     { color: '#dc2626', bg: '#fef2f2' },
  'Resubmitted-After Correction':      { color: '#0891b2', bg: '#ecfeff' },
  'Submitted to Bank':                 { color: '#0891b2', bg: '#ecfeff' },
  'Bank Application':                  { color: '#5b21b6', bg: '#ede9fe' },
  'Pre-Approved':                      { color: GREEN,     bg: '#ecfdf5' },
  'Valuation':                         { color: '#ea580c', bg: '#fff7ed' },
  'FOL Processed':                     { color: '#059669', bg: '#ecfdf5' },
  'FOL Issued':                        { color: '#4338ca', bg: '#eef2ff' },
  'FOL Signed':                        { color: '#be185d', bg: '#fdf2f8' },
  'Disbursed':                         { color: GREEN,     bg: '#ecfdf5' },
  'Declined':                          { color: '#dc2626', bg: '#fef2f2' },
  'Lost':                              { color: '#dc2626', bg: '#fef2f2' },
  'Rejected':                          { color: '#dc2626', bg: '#fef2f2' },
};

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
      borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, flexShrink: 0,
    }}>
      <ClockCircleOutlined style={{ fontSize: 13 }} />
      <span>SLA {cfg.label}</span>
      <span style={{ fontWeight: 400, opacity: 0.8 }}>
        {overdue ? '+' : ''}{hrs}h {mins}m {overdue ? 'overdue' : 'left'}
      </span>
    </div>
  );
};

/* ─── Helpers ─── */
const InfoRow = ({ label, value, icon }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px dashed #f1f5f9' }}>
    {icon && <span style={{ color: PRIMARY, fontSize: 13, marginTop: 1, flexShrink: 0 }}>{icon}</span>}
    <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0, minWidth: 140 }}>{label}</span>
    <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, wordBreak: 'break-word' }}>{value ?? '—'}</span>
  </div>
);

const SectionCard = ({ title, icon, children, style }) => (
  <div style={{
    background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    marginBottom: 16, overflow: 'hidden', ...style,
  }}>
    <div style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${PRIMARY}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PRIMARY, fontSize: 14 }}>
          {icon}
        </div>
        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{title}</span>
      </div>
      {children}
    </div>
  </div>
);

/* ─── File Viewer Modal ─── */
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
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileTextOutlined style={{ color: PRIMARY }} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>{name || 'Document Preview'}</span>
        </div>
      }
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
            <a href={url} target="_blank" rel="noreferrer"
              style={{ background: GRAD, color: '#fff', padding: '8px 20px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>
              <DownloadOutlined style={{ marginRight: 6 }} />Download File
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};

/* ─── Tab 1: Overview ─── */
const OverviewTab = ({ data, onStatusUpdate }) => {
  const c    = data.clientInfo          || {};
  const p    = data.propertyInfo        || {};
  const b    = data.bankSelection       || {};
  const e    = data.eligibilitySnapshot || {};
  const ops  = data.opsQueue            || {};
  const pa   = data.preApprovalInfo     || {};
  const addr = p.propertyAddress        || {};

  const [statusVal,  setStatusVal]  = useState(data.currentStatus || '');
  const [statusNote, setStatusNote] = useState('');
  const [updating,   setUpdating]   = useState(false);

  const riskColor = { Excellent: '#10b981', Good: '#3b82f6', Fair: '#f59e0b', Poor: '#ef4444' };

  const handleUpdate = async () => {
    if (!statusVal) return;
    setUpdating(true);
    try {
      await onStatusUpdate(statusVal, statusNote);
      setStatusNote('');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      {/* Metric chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Property Value', value: `AED ${(p.propertyValue || 0).toLocaleString()}`, color: '#3b82f6' },
          { label: 'Loan Amount',    value: `AED ${(p.loanAmount    || 0).toLocaleString()}`, color: PRIMARY },
          { label: 'Monthly EMI',    value: b.monthlyEMI ? `AED ${b.monthlyEMI.toLocaleString()}` : '—', color: '#f59e0b' },
          { label: 'Eligibility',    value: e.eligibilityScore ? `${e.eligibilityScore}/100` : '—',       color: GREEN },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 12, padding: '14px 16px',
            border: `1px solid ${s.color}20`, textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Left col */}
        <div>
          <SectionCard title="Client Information" icon={<UserOutlined />}>
            <InfoRow label="Full Name"            value={c.fullName || [c.firstName, c.lastName].filter(Boolean).join(' ')} icon={<UserOutlined />} />
            <InfoRow label="Email"                value={c.email}                  icon={<MailOutlined />} />
            <InfoRow label="Mobile"               value={c.phone || c.mobile}      icon={<PhoneOutlined />} />
            <InfoRow label="Nationality"          value={c.nationality}            icon={<GlobalOutlined />} />
            <InfoRow label="Residency"            value={c.residencyStatus}        icon={<SafetyOutlined />} />
            <InfoRow label="Employment"           value={c.employmentStatus}       icon={<AuditOutlined />} />
            <InfoRow label="Monthly Salary"       value={c.monthlySalary || c.fixedMonthlySalary ? `AED ${Number(c.monthlySalary || c.fixedMonthlySalary).toLocaleString()}` : null} />
            <InfoRow label="Existing Liabilities" value={c.existingLiabilities ? `AED ${Number(c.existingLiabilities).toLocaleString()}` : null} />
            <InfoRow label="Mortgage Term"        value={c.mortgageTerm ? `${c.mortgageTerm} years` : null} />
            <InfoRow label="Fee Financing"        value={c.feeFinancingRequired != null ? (c.feeFinancingRequired ? 'Yes' : 'No') : null} />
          </SectionCard>

          <SectionCard title="Property Information" icon={<HomeOutlined />}>
            <InfoRow label="Area"           value={addr.area} icon={<EnvironmentOutlined />} />
            <InfoRow label="City"           value={addr.city} icon={<EnvironmentOutlined />} />
            <InfoRow label="Property Value" value={`AED ${(p.propertyValue || 0).toLocaleString()}`} />
            <InfoRow label="Loan Amount"    value={`AED ${(p.loanAmount    || 0).toLocaleString()}`} />
          </SectionCard>

          <SectionCard title="Ops Queue Info" icon={<InboxOutlined />}>
            <InfoRow label="Entered Queue"  value={ops.enteredQueueAt  ? dayjs(ops.enteredQueueAt).format('DD MMM YYYY HH:mm')  : '—'} />
            <InfoRow label="Picked Up By"   value={ops.pickedUpBy?.opsName   || '—'} />
            <InfoRow label="Picked Up At"   value={ops.pickedUpBy?.pickedUpAt ? dayjs(ops.pickedUpBy.pickedUpAt).format('DD MMM YYYY HH:mm') : '—'} />
            <InfoRow label="Return Count"   value={ops.returnCount != null ? String(ops.returnCount) : '—'} />
            <InfoRow label="Admin Assigned" value={ops.adminAssigned?.assignedBy || '—'} />
          </SectionCard>
        </div>

        {/* Right col */}
        <div>
          <SectionCard title="Bank & Product" icon={<BankOutlined />}>
            <InfoRow label="Bank"          value={b.bankName} />
            <InfoRow label="Product"       value={b.productName} />
            <InfoRow label="Interest Rate" value={b.interestRate ? `${b.interestRate}% p.a.` : '—'} />
            <InfoRow label="Tenure"        value={b.tenureYears ? `${b.tenureYears} years` : '—'} />
            <InfoRow label="Monthly EMI"   value={b.monthlyEMI ? `AED ${b.monthlyEMI.toLocaleString()}` : '—'} />
          </SectionCard>

          <SectionCard title="Eligibility Snapshot" icon={<SafetyOutlined />}>
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
                <div style={{ fontWeight: 700, color: e.isEligible ? GREEN : '#ef4444' }}>
                  {e.isEligible ? 'Eligible' : 'Not Eligible'}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{e.dbrStatus}</div>
              </div>
              {e.riskGrade && (
                <span style={{
                  marginLeft: 'auto', borderRadius: 6, fontWeight: 700, fontSize: 11,
                  padding: '2px 8px',
                  color: riskColor[e.riskGrade] || '#64748b',
                  background: (riskColor[e.riskGrade] || '#64748b') + '12',
                  border: `1px solid ${(riskColor[e.riskGrade] || '#64748b')}40`,
                }}>
                  {e.riskGrade}
                </span>
              )}
            </div>
            <InfoRow label="Eligibility Score"   value={e.eligibilityScore ? `${e.eligibilityScore}/100` : '—'} />
            <InfoRow label="DBR Percentage"       value={e.dbrPercentage ? `${e.dbrPercentage}%` : '—'} />
            <InfoRow label="Estimated LTV"        value={e.estimatedLTV ? `${e.estimatedLTV}%` : '—'} />
            <InfoRow label="Recommended Loan"     value={e.recommendedLoanAmount ? `AED ${e.recommendedLoanAmount.toLocaleString()}` : '—'} />
            {e.eligibilityNotes && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b' }}>
                {e.eligibilityNotes}
              </div>
            )}
          </SectionCard>

          {/* Pre-Approval Details */}
          {pa?.preApprovedAmount ? (
            <SectionCard title="Pre-Approval Details" icon={<CheckCircleOutlined />}
              style={{ border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
              <InfoRow label="Pre-Approved Amount"  value={`AED ${Number(pa.preApprovedAmount).toLocaleString()}`} />
              <InfoRow label="Max LTV"              value={pa.maxLTV ? `${Math.round(pa.maxLTV * 100)}%` : '—'} />
              <InfoRow label="Max Affordable Prop." value={pa.maxAffordablePropertyValue ? `AED ${Number(pa.maxAffordablePropertyValue).toLocaleString()}` : '—'} />
              {pa.confirmedLoanAmount ? (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <InfoRow label="Confirmed Loan"     value={`AED ${Number(pa.confirmedLoanAmount).toLocaleString()}`} />
                  <InfoRow label="Confirmed Property" value={`AED ${Number(pa.confirmedPropertyValue || 0).toLocaleString()}`} />
                  <InfoRow label="Down Payment"       value={pa.confirmedDownPayment ? `AED ${Number(pa.confirmedDownPayment).toLocaleString()}` : '—'} />
                  <InfoRow label="Confirmed LTV"      value={pa.confirmedLTV ? `${pa.confirmedLTV}%` : '—'} />
                  <InfoRow label="Property Added On"  value={pa.propertyAddedAt ? dayjs(pa.propertyAddedAt).format('DD MMM YYYY') : '—'} />
                </>
              ) : (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#fef9c3', borderRadius: 8, fontSize: 12, color: '#713f12', textAlign: 'center' }}>
                  Awaiting confirmed property & final loan amounts.
                </div>
              )}
            </SectionCard>
          ) : null}

          {/* Notes */}
          {((data.internalNotes?.length > 0) || (data.customerNotes?.length > 0)) && (
            <SectionCard title="Notes" icon={<FileTextOutlined />}>
              {data.internalNotes?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Internal Notes</div>
                  {data.internalNotes.map((n, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: '#faf5ff', borderRadius: 8, marginBottom: 6, fontSize: 13, color: '#374151', border: '1px solid #e9d5ff' }}>
                      {typeof n === 'object' ? (n.note || n.text || JSON.stringify(n)) : n}
                    </div>
                  ))}
                </div>
              )}
              {data.customerNotes?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Customer Notes</div>
                  {data.customerNotes.map((n, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: '#f0f9ff', borderRadius: 8, marginBottom: 6, fontSize: 13, color: '#374151', border: '1px solid #bae6fd' }}>
                      {typeof n === 'object' ? (n.note || n.text || JSON.stringify(n)) : n}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}
        </div>
      </div>

      {/* Admin Status Update Panel */}
      <SectionCard title="Admin Status Update" icon={<AuditOutlined />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>New Status</div>
            <Select
              value={statusVal}
              onChange={setStatusVal}
              style={{ width: '100%' }}
              placeholder="Select a status…"
            >
              {ALL_STATUSES.map(s => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>Note (optional)</div>
            <textarea
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              placeholder="Add a note about this status change…"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                borderRadius: 8, border: '1.5px solid #e2e8f0',
                padding: '8px 12px', fontSize: 13, color: '#1e293b',
                resize: 'vertical', fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
          <button
            onClick={handleUpdate}
            disabled={updating || !statusVal}
            style={{
              alignSelf: 'flex-end',
              background: updating || !statusVal ? '#94a3b8' : GRAD,
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 24px', cursor: updating || !statusVal ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
              boxShadow: updating || !statusVal ? 'none' : '0 3px 12px rgba(92,3,155,0.3)',
            }}
          >
            {updating ? 'Updating…' : 'Update Status'}
          </button>
        </div>
      </SectionCard>
    </div>
  );
};

/* ─── Tab 2: Documents ─── */
const DocumentsTab = ({ documents, onView }) => {
  const advisorDocs = documents.filter(d => d.handledBy === 'Advisor');
  const opsDocs     = documents.filter(d => d.handledBy !== 'Advisor');

  const pct = documents.length > 0
    ? Math.round((documents.filter(d => d.isUploaded).length / documents.length) * 100)
    : 0;

  const DocCard = ({ doc }) => {
    const isUploaded = doc.isUploaded || !!doc.fileUrl;
    const isVerified = doc.isVerified;

    return (
      <div style={{
        borderRadius: 12, marginBottom: 10,
        border: `1.5px solid ${isUploaded ? '#bbf7d0' : '#e2e8f0'}`,
        background: isUploaded ? '#f0fdf4' : '#fff',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', flexWrap: 'wrap' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: isUploaded ? '#d1fae5' : '#f5f0ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isUploaded
              ? <CheckCircleOutlined style={{ color: GREEN, fontSize: 17 }} />
              : <FileTextOutlined   style={{ color: PRIMARY, fontSize: 17 }} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{doc.documentName}</div>
            {doc.description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{doc.description}</div>}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
              {doc.isMandatory
                ? <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700 }}>Required</span>
                : <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0', fontWeight: 600 }}>Optional</span>
              }
              {doc.handledBy === 'Advisor' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', fontWeight: 700 }}>Advisor</span>}
              {doc.handledBy && doc.handledBy !== 'Advisor' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontWeight: 700 }}>Ops</span>}
              {doc.source === 'Bank'   && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontWeight: 700 }}>Bank</span>}
              {doc.source === 'Global' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 700 }}>Global</span>}
              {isUploaded && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', fontWeight: 700 }}>Uploaded</span>}
              {isVerified && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f0fdf4', color: GREEN, border: '1px solid #6ee7b7', fontWeight: 700 }}>Verified</span>}
            </div>
          </div>
          {isUploaded && doc.fileUrl && (
            <button
              onClick={() => onView(doc.fileUrl, doc.documentName)}
              style={{
                fontSize: 11, padding: '6px 14px', borderRadius: 7,
                border: '1.5px solid #bbf7d0', background: '#f0fdf4',
                cursor: 'pointer', color: '#059669', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              }}
            >
              <EyeOutlined /> View File
            </button>
          )}
        </div>
      </div>
    );
  };

  const DocSection = ({ title, docs }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: title.includes('Advisor') ? GREEN : '#ea580c' }} />
        {title} ({docs.length})
      </div>
      {docs.length === 0
        ? <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13, background: '#f8fafc', borderRadius: 10 }}>No documents in this section.</div>
        : docs.map(doc => <DocCard key={doc.documentKey || doc._id} doc={doc} />)
      }
    </div>
  );

  return (
    <div>
      {/* Progress bar */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>Overall Document Progress</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: pct >= 100 ? GREEN : PRIMARY }}>{pct}%</span>
        </div>
        <div style={{ height: 10, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? `linear-gradient(90deg,${GREEN},#10b981)` : GRAD, borderRadius: 10, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
          {documents.filter(d => d.isUploaded).length} of {documents.length} documents uploaded
        </div>
      </div>

      <DocSection title="Advisor Documents" docs={advisorDocs} />
      <DocSection title="Ops / Bank Documents" docs={opsDocs} />
    </div>
  );
};

/* ─── Tab 3: Timeline ─── */
const TimelineTab = ({ timeline = {}, statusHistory = [], returnedToSubmitterNotes, submissionNotes, sla, slaStatus }) => {
  const items = [
    { label: 'Created',           date: timeline.createdAt },
    { label: 'Submitted to Xoto', date: timeline.submittedToXotoAt },
    { label: 'Assigned to Ops',   date: timeline.assignedToOpsAt },
    { label: 'Submitted to Bank', date: timeline.submittedToBankAt },
    { label: 'Pre-Approved',      date: timeline.preApprovedAt },
    { label: 'Valuation',         date: timeline.valuationAt },
    { label: 'FOL Issued',        date: timeline.folIssuedAt },
    { label: 'FOL Signed',        date: timeline.folSignedAt },
    { label: 'Disbursed',         date: timeline.disbursedAt },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
      {/* Submission / correction notes */}
      {submissionNotes && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#1d4ed8' }}>
          <strong>Submission Notes:</strong> {submissionNotes}
        </div>
      )}
      {returnedToSubmitterNotes && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#dc2626' }}>
          <strong>Correction Notes (from Ops):</strong> {returnedToSubmitterNotes}
        </div>
      )}

      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>Application Timeline</div>
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: '#e2e8f0', zIndex: 0 }} />
        {items.map((item, idx) => {
          const done = !!item.date;
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: idx < items.length - 1 ? 24 : 0, position: 'relative', zIndex: 1 }}>
              {/* Circle */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: done ? GREEN : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: done ? `0 0 0 4px ${GREEN}20` : 'none',
                transition: 'all 0.3s',
              }}>
                {done
                  ? <CheckCircleOutlined style={{ color: '#fff', fontSize: 14 }} />
                  : <ClockCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                }
              </div>
              {/* Content */}
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: done ? '#1e293b' : '#94a3b8' }}>
                  {item.label}
                </div>
                {done
                  ? <div style={{ fontSize: 12, color: GREEN, fontWeight: 600, marginTop: 2 }}>
                      {dayjs(item.date).format('DD MMM YYYY, HH:mm')}
                    </div>
                  : <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>Pending</div>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* SLA details */}
      {sla?.startedAt && (
        <div style={{ marginTop: 24, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClockCircleOutlined style={{ color: PRIMARY }} /> SLA Details
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12 }}>
            <div><span style={{ color: '#64748b' }}>Started: </span><strong>{dayjs(sla.startedAt).format('DD MMM YYYY, HH:mm')}</strong></div>
            <div><span style={{ color: '#64748b' }}>Deadline: </span><strong>{dayjs(sla.deadlineAt).format('DD MMM YYYY, HH:mm')}</strong></div>
            <div><span style={{ color: '#64748b' }}>Window: </span><strong>{sla.durationHours}h</strong></div>
            <div>
              <span style={{ color: '#64748b' }}>Status: </span>
              <strong style={{ color: { 'on-track': '#059669', 'at-risk': '#d97706', 'breached': '#dc2626' }[slaStatus] || '#64748b' }}>
                {slaStatus === 'on-track' ? 'On Track' : slaStatus === 'at-risk' ? 'At Risk' : slaStatus === 'breached' ? 'Breached' : '—'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Status history audit trail */}
      {statusHistory.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Status History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {statusHistory.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5c039b', marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{h.status}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{h.changedAt ? dayjs(h.changedAt).format('DD MMM YYYY, HH:mm') : ''}</span>
                  </div>
                  {h.changedByName && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>By: {h.changedByName} ({h.changedByRole})</div>}
                  {h.notes && <div style={{ fontSize: 12, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>{h.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/* ── Main Component ── */
const AdminCaseDetail = () => {
  const { caseId }  = useParams();
  const navigate    = useNavigate();
  const screens     = useBreakpoint();
  // @ts-ignore
  const { user }    = useSelector(s => s.auth);

  const [caseData,   setCaseData]   = useState(null);
  const [documents,  setDocuments]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('overview');
  const [viewerUrl,  setViewerUrl]  = useState(null);
  const [viewerName, setViewerName] = useState('');

  const fetchCase = useCallback(async () => {
    try {
      const res = await apiService.get(`/vault/cases/${caseId}`);
      if (res?.success) setCaseData(res.data);
      else message.error('Failed to load application');
    } catch {
      message.error('Failed to load application details');
    }
  }, [caseId]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await apiService.get(`/vault/cases/documents/${caseId}`);
      if (res?.success) setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCase(), fetchDocuments()]);
  }, [fetchCase, fetchDocuments]);

  const handleStatusUpdate = async (status, note) => {
    try {
      const res = await apiService.post(`/vault/cases/${caseId}/status-update`, { status, note });
      if (res?.success) {
        message.success(`Status updated to "${status}"`);
        await fetchCase();
      } else {
        message.error(res?.message || 'Failed to update status');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  /* Loading */
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <Spin size="large" />
        <span style={{ color: PRIMARY, fontWeight: 600 }}>Loading application details…</span>
      </div>
    );
  }

  /* Error / empty */
  if (!caseData) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Application Not Found</div>
        <div style={{ color: '#94a3b8', marginBottom: 20 }}>The application you are looking for could not be found.</div>
        <button
          onClick={() => navigate('/dashboard/vault-admin/case/manage')}
          style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
        >
          <ArrowLeftOutlined style={{ marginRight: 6 }} />Back to Applications
        </button>
      </div>
    );
  }

  const sc = SC[caseData.currentStatus] || { color: '#64748b', bg: '#f1f5f9' };

  const TABS = [
    { key: 'overview',   label: 'Overview' },
    { key: 'documents',  label: 'Documents' },
    { key: 'timeline',   label: 'Timeline' },
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 40 }}>

      {/* ── Gradient Header ── */}
      <div style={{
        background: GRAD,
        padding: screens.md ? '24px 32px 28px' : '16px 16px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '50%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {/* Back button */}
          <button
            onClick={() => navigate('/dashboard/vault-admin/case/manage')}
            style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              flexShrink: 0, backdropFilter: 'blur(4px)',
            }}
          >
            <ArrowLeftOutlined />{screens.sm ? 'All Applications' : ''}
          </button>

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: screens.md ? 22 : 17, color: '#fff', lineHeight: 1.2 }}>
              {caseData.caseReference}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
              {caseData.clientInfo?.fullName} · {caseData.bankSelection?.bankName || 'No bank selected'}
            </div>
          </div>

          {/* Status badge */}
          <div style={{
            background: sc.bg, color: sc.color, borderRadius: 8,
            padding: '7px 16px', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {caseData.currentStatus}
          </div>

          {/* SLA badge */}
          <SlaBadge sla={caseData.sla} slaStatus={caseData.slaStatus} />
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding: screens.md ? '0 32px' : '0 16px', marginTop: -1 }}>
        <div style={{
          background: '#fff', borderBottom: '1px solid #f1f5f9',
          display: 'flex', gap: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '14px 24px', border: 'none', background: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500,
                color: activeTab === t.key ? PRIMARY : '#64748b',
                borderBottom: activeTab === t.key ? `2.5px solid ${PRIMARY}` : '2.5px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: screens.md ? '20px 32px 0' : '16px 16px 0' }}>
        {activeTab === 'overview' && (
          <OverviewTab data={caseData} onStatusUpdate={handleStatusUpdate} />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab
            documents={documents}
            onView={(url, name) => { setViewerUrl(url); setViewerName(name); }}
          />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab
            timeline={caseData.timeline || {}}
            statusHistory={caseData.statusHistory || []}
            submissionNotes={caseData.submissionNotes}
            returnedToSubmitterNotes={caseData.returnedToSubmitterNotes}
            sla={caseData.sla}
            slaStatus={caseData.slaStatus}
          />
        )}
      </div>

      <FileViewerModal
        url={viewerUrl}
        name={viewerName}
        onClose={() => setViewerUrl(null)}
      />
    </div>
  );
};

export default AdminCaseDetail;
