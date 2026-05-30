import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/api/apiService';
import { Modal, message, Select } from 'antd';
import LinkedProposalsCases from '@/components/common/LinkedProposalsCases';

import {
  ArrowLeft,
  User,
  Home,
  Briefcase,
  Loader2,
  AlertCircle,
  FileText,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ChevronRight,
  CreditCard,
  Calendar,
  MapPin,
  Building,
  Phone,
  Mail,
  DollarSign,
  FileCheck,
  Shield,
  UserCheck,
  Banknote,
  Heart,
  Users,
  TrendingUp,
} from 'lucide-react';

const STATUS_MAP = {
  'New':                   { bg: 'bg-blue-50',    color: 'text-blue-700',    dot: 'bg-blue-500',    border: 'border-blue-200'    },
  'Assigned':              { bg: 'bg-indigo-50',  color: 'text-indigo-700',  dot: 'bg-indigo-500',  border: 'border-indigo-200'  },
  'Contacted':             { bg: 'bg-amber-50',   color: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-amber-200'   },
  'Qualified':             { bg: 'bg-emerald-50', color: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  'Collecting Documents':  { bg: 'bg-purple-50',  color: 'text-purple-700',  dot: 'bg-purple-500',  border: 'border-purple-200'  },
  'Documents Complete':    { bg: 'bg-teal-50',    color: 'text-teal-700',    dot: 'bg-teal-500',    border: 'border-teal-200'    },
  'Application Opened':   { bg: 'bg-sky-50',     color: 'text-sky-700',     dot: 'bg-sky-500',     border: 'border-sky-200'     },
  'Bank Application':     { bg: 'bg-violet-50',  color: 'text-violet-700',  dot: 'bg-violet-500',  border: 'border-violet-200'  },
  'Pre-Approved':          { bg: 'bg-green-50',   color: 'text-green-700',   dot: 'bg-green-500',   border: 'border-green-200'   },
  'Valuation':             { bg: 'bg-orange-50',  color: 'text-orange-700',  dot: 'bg-orange-500',  border: 'border-orange-200'  },
  'FOL Processed':         { bg: 'bg-lime-50',    color: 'text-lime-700',    dot: 'bg-lime-500',    border: 'border-lime-200'    },
  'FOL Issued':            { bg: 'bg-cyan-50',    color: 'text-cyan-700',    dot: 'bg-cyan-500',    border: 'border-cyan-200'    },
  'FOL Signed':            { bg: 'bg-fuchsia-50', color: 'text-fuchsia-700', dot: 'bg-fuchsia-500', border: 'border-fuchsia-200' },
  'Disbursed':             { bg: 'bg-emerald-50', color: 'text-emerald-700', dot: 'bg-emerald-600', border: 'border-emerald-300' },
  'Not Proceeding':        { bg: 'bg-red-50',     color: 'text-red-700',     dot: 'bg-red-500',     border: 'border-red-200'     },
  'Lost':                  { bg: 'bg-gray-50',    color: 'text-gray-700',    dot: 'bg-gray-500',    border: 'border-gray-200'    },
};

// What a user can manually move to from each status
const NEXT_STATUS_MAP = {
  'New':                  ['Contacted'],
  'Assigned':             ['Contacted'],
  'Contacted':            ['Qualified', 'Not Proceeding'],
  'Qualified':            ['Collecting Documents', 'Not Proceeding'],
  'Collecting Documents': ['Documents Complete', 'Not Proceeding'],
  'Documents Complete':   [], // → create Case (Application Opened is auto)
};

// Pipeline stages shown as a progress bar (Advisor/Partner view)
const PIPELINE_STAGES = [
  'New', 'Contacted', 'Qualified', 'Collecting Documents', 'Documents Complete', 'Application Opened',
];

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { bg: 'bg-gray-50', color: 'text-gray-700', dot: 'bg-gray-500', border: 'border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${s.bg} ${s.color} border ${s.border} text-xs font-semibold`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status || 'Unknown'}
    </span>
  );
};

const VerifyBadge = ({ status }) => {
  const config = {
    verified: { bg: 'bg-emerald-50', color: 'text-emerald-700', icon: <CheckCircle size={12} /> },
    pending: { bg: 'bg-amber-50', color: 'text-amber-700', icon: <Clock size={12} /> },
    rejected: { bg: 'bg-red-50', color: 'text-red-700', icon: <XCircle size={12} /> },
    Uploaded: { bg: 'bg-blue-50', color: 'text-blue-700', icon: <FileCheck size={12} /> },
  };
  const c = config[status?.toLowerCase()] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${c.bg} ${c.color} text-xs font-medium`}>
      {c.icon}
      {status || 'Pending'}
    </span>
  );
};

const DOC_TYPE_LABELS = {
  emirates_id_front: 'Emirates ID (Front)',
  emirates_id_back: 'Emirates ID (Back)',
  passport: 'Passport',
  visa: 'Visa',
  bank_statements: 'Bank Statements',
  salary_certificate: 'Salary Certificate',
  payslips: 'Payslips',
  trade_license: 'Trade License',
  tenancy_contract: 'Tenancy Contract',
  title_deed: 'Title Deed',
  noc: 'NOC Letter',
  consent_form: 'Consent Form',
  bank_application_form: 'Bank Application Form',
};

const formatDocType = (type) => {
  if (!type) return 'Document';
  return DOC_TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const getFileTypeConfig = (mimeType, fileName) => {
  if (mimeType === 'application/pdf') return { bg: 'bg-red-50', color: 'text-red-600', label: 'PDF' };
  if (mimeType?.startsWith('image/')) return { bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'IMG' };
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return { bg: 'bg-green-50', color: 'text-green-600', label: 'XLS' };
  if (mimeType?.includes('word') || mimeType?.includes('document')) return { bg: 'bg-blue-50', color: 'text-blue-600', label: 'DOC' };
  if (fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const map = {
      pdf: { bg: 'bg-red-50', color: 'text-red-600', label: 'PDF' },
      jpg: { bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'IMG' },
      jpeg: { bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'IMG' },
      png: { bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'IMG' },
      webp: { bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'IMG' },
      doc: { bg: 'bg-blue-50', color: 'text-blue-600', label: 'DOC' },
      docx: { bg: 'bg-blue-50', color: 'text-blue-600', label: 'DOC' },
    };
    if (map[ext]) return map[ext];
  }
  return { bg: 'bg-gray-50', color: 'text-gray-600', label: 'FILE' };
};

const InfoRow = ({ label, value, icon: Icon, last }) => (
  <div className={`py-3 ${!last ? 'border-b border-gray-100' : ''}`}>
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon size={12} className="text-gray-400" />}
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-sm font-medium text-gray-800 break-words font-mono">{value || '—'}</p>
  </div>
);

const DetailCard = ({ icon: Icon, title, accentColor, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
        <Icon size={16} style={{ color: accentColor }} />
      </div>
      <span className="font-bold text-gray-800 text-sm">{title}</span>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const DocumentPreviewModal = ({ open, onClose, doc }) => {
  if (!doc) return null;
  const fileUrl = doc.fileUrl || doc.url || doc.documentUrl || doc.file_url;
  const isPdf = fileUrl?.toLowerCase().endsWith('.pdf') || doc.mimeType === 'application/pdf';
  const isImage = doc.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(fileUrl);
  return (
    <Modal open={open} onCancel={onClose} footer={null} width="90%" style={{ maxWidth: 1000 }} centered destroyOnClose
      title={
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <FileText size={16} className="text-purple-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">{formatDocType(doc.documentType)}</div>
            <div className="text-xs text-gray-400">{doc.fileName}</div>
          </div>
        </div>
      }
    >
      <div className="min-h-[60vh] max-h-[70vh] bg-gray-50 rounded-xl flex items-center justify-center overflow-auto">
        {isPdf ? (
          <iframe src={fileUrl} className="w-full h-[65vh] border-0 rounded-xl" title="PDF Preview" />
        ) : isImage ? (
          <img src={fileUrl} alt="Document preview" className="max-h-[65vh] max-w-full object-contain rounded-xl" />
        ) : (
          <div className="text-center p-10">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Preview not available for this file type</p>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
              <Download size={14} /> Download File
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};

const DocumentsList = ({ leadId }) => {
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leadDocuments', leadId],
    queryFn: () => apiService.get(`/vault/lead/documents/${leadId}`),
    enabled: !!leadId,
  });

  const documents = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  const grouped = documents.reduce((acc, doc) => {
    const cat = doc.documentCategory || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  const categoryConfig = {
    identity: { label: 'Identity Documents', accent: '#5c039b', bg: 'bg-purple-50', order: 1 },
    financial: { label: 'Financial Documents', accent: '#10b981', bg: 'bg-emerald-50', order: 2 },
    property: { label: 'Property Documents', accent: '#f59e0b', bg: 'bg-amber-50', order: 3 },
    bank_form: { label: 'Bank Forms', accent: '#3b82f6', bg: 'bg-blue-50', order: 4 },
    other: { label: 'Other Documents', accent: '#6b7280', bg: 'bg-gray-50', order: 5 },
  };

  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99)
  );

  if (isLoading) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 mt-6">
      <div className="flex justify-center py-8"><Loader2 size={24} className="text-purple-600 animate-spin" /></div>
    </div>
  );

  if (error) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 mt-6">
      <div className="flex flex-col items-center gap-3 py-6">
        <AlertCircle size={24} className="text-red-400" />
        <p className="text-gray-500 text-sm">Failed to load documents</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition">Retry</button>
      </div>
    </div>
  );

  if (documents.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 mt-6">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center"><FileText size={20} className="text-gray-300" /></div>
        <p className="text-gray-500 text-sm font-medium">No documents uploaded yet</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 mt-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-purple-600" />
            <span className="font-bold text-gray-800 text-sm">Uploaded Documents</span>
            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">{documents.length}</span>
          </div>
          <button onClick={() => refetch()} className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"><RefreshCw size={14} /></button>
        </div>
        <div className="p-5">
          {sortedCategories.map((cat) => {
            const docs = grouped[cat];
            const cfg = categoryConfig[cat] || categoryConfig.other;
            return (
              <div key={cat} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">{cfg.label}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} text-gray-600`}>{docs.length}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {docs.map((doc, idx) => {
                    const fileCfg = getFileTypeConfig(doc.mimeType, doc.fileName);
                    const size = doc.fileSizeMb != null
                      ? doc.fileSizeMb < 1 ? `${(doc.fileSizeMb * 1024).toFixed(0)} KB` : `${doc.fileSizeMb.toFixed(1)} MB`
                      : doc.formattedFileSize || '';
                    return (
                      <div key={doc._id || doc.documentId || idx}
                        className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/30 transition-all duration-200 cursor-pointer"
                        onClick={() => { setPreviewDoc(doc); setPreviewOpen(true); }}
                      >
                        <div className={`w-10 h-10 rounded-xl ${fileCfg.bg} flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-xs font-bold ${fileCfg.color}`}>{fileCfg.label}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{formatDocType(doc.documentType)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <VerifyBadge status={doc.verificationStatus} />
                            {size && <span className="text-[10px] text-gray-400">{size}</span>}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:border-purple-200 group-hover:text-purple-600 transition">
                          <Eye size={14} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <DocumentPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} doc={previewDoc} />
    </>
  );
};

// ── Status Pipeline Bar ──────────────────────────────────────────────────────
const LeadStatusPanel = ({ lead, roleCode, onRefetch }) => {
  const [updating, setUpdating]         = useState(false);
  const [reason, setReason]             = useState('');
  const [showReasonFor, setShowReasonFor] = useState(null); // 'Not Proceeding'

  const currentStatus = lead?.currentStatus || 'New';
  const isLocked      = lead?.conversionInfo?.convertedToApplication || false;
  const nextStatuses  = NEXT_STATUS_MAP[currentStatus] || [];
  const stageIdx      = PIPELINE_STAGES.indexOf(currentStatus);

  // Pick endpoint by role
  const statusEndpoint = (leadId) => {
    if (roleCode === '18') return `/vault/lead/admin/${leadId}/status`;
    return `/vault/lead/advisorOrpartner/lead/${leadId}/status`;
  };

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === 'Not Proceeding' && !reason.trim()) {
      setShowReasonFor('Not Proceeding');
      return;
    }
    setUpdating(true);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'Not Proceeding') payload.notProceedingReason = reason.trim();
      await apiService.put(statusEndpoint(lead._id), payload);
      message.success(`Status updated to "${newStatus}"`);
      setShowReasonFor(null);
      setReason('');
      onRefetch();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const statusColors = {
    Contacted:            { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
    Qualified:            { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    'Collecting Documents': { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
    'Documents Complete':  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    'Not Proceeding':     { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
      {/* Pipeline bar */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lead Pipeline</span>
          {lead?.sla?.breached && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold border border-red-200">
              <Clock size={11} /> SLA Breached
            </span>
          )}
          {lead?.sla?.deadline && !lead?.sla?.breached && currentStatus === 'New' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold border border-amber-200">
              <Clock size={11} /> SLA: {new Date(lead.sla.deadline).toLocaleString('en-AE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0">
          {PIPELINE_STAGES.map((stage, idx) => {
            const done    = idx < stageIdx || (currentStatus === 'Disbursed' || currentStatus === 'Application Opened');
            const active  = stage === currentStatus;
            const future  = idx > stageIdx;
            return (
              <React.Fragment key={stage}>
                <div className="flex flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: done ? '#059669' : active ? '#5c039b' : '#e5e7eb',
                      color: done || active ? '#fff' : '#9ca3af',
                      boxShadow: active ? '0 0 0 3px rgba(92,3,155,0.15)' : 'none',
                    }}
                  >
                    {done ? <CheckCircle size={13} /> : idx + 1}
                  </div>
                  <span
                    className="text-center mt-1.5 leading-tight"
                    style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: done ? '#059669' : active ? '#5c039b' : '#9ca3af', maxWidth: 70 }}
                  >
                    {stage}
                  </span>
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div style={{ flex: '0 0 20px', height: 2, background: idx < stageIdx ? '#059669' : '#e5e7eb', marginBottom: 20 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {!isLocked && nextStatuses.length > 0 && roleCode !== '18' && (
        <div className="px-6 pb-5 border-t border-gray-50 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Update Status</p>

          {showReasonFor === 'Not Proceeding' ? (
            <div className="space-y-3">
              <textarea
                placeholder="Reason for not proceeding (required)..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowReasonFor(null); setReason(''); }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={!reason.trim() || updating}
                  onClick={() => handleStatusUpdate('Not Proceeding')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition"
                  style={{ background: reason.trim() ? '#dc2626' : '#fecaca', color: '#fff', border: 'none', cursor: reason.trim() ? 'pointer' : 'not-allowed' }}
                >
                  {updating ? 'Saving...' : 'Confirm Not Proceeding'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map(s => {
                const c = statusColors[s] || { bg: '#f5f0ff', color: '#5c039b', border: '#ddd0ff' };
                return (
                  <button
                    key={s}
                    disabled={updating}
                    onClick={() => s === 'Not Proceeding' ? setShowReasonFor('Not Proceeding') : handleStatusUpdate(s)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition hover:opacity-80"
                    style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, cursor: updating ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronRight size={13} /> Mark as {s}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Locked message */}
      {isLocked && (
        <div className="px-6 pb-4 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-sky-50 border border-sky-200">
            <Shield size={14} className="text-sky-600 flex-shrink-0" />
            <span className="text-xs text-sky-700 font-semibold">Status locked — this lead is linked to an active Case.</span>
          </div>
        </div>
      )}

      {/* Not Proceeding reason */}
      {currentStatus === 'Not Proceeding' && lead?.notProceedingReason && (
        <div className="px-6 pb-4 pt-3 border-t border-gray-50">
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Not Proceeding Reason</p>
            <p className="text-sm text-red-700">{lead.notProceedingReason}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const roleSlugMap = {
  '18': 'vault-admin',
  '21': 'vaultpartner',
  '22': 'vaultagent',
  '23': 'vault-ops',
  '26': 'vault-advisor',
};

const VaultLeadDetail = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const roleCode = user?.role ? (typeof user.role === 'object' ? String(user.role.code) : String(user.role)) : '26';
  const roleSlug = roleSlugMap[roleCode] ?? 'vault-advisor';

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['leadDetail', leadId],
    queryFn: () => apiService.get(`/vault/lead/${leadId}`),
    enabled: !!leadId,
  });

  const lead = data?.data || data;

  const formatCurrency = (amount) => {
    if (!amount) return null;
    return `AED ${Number(amount).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`;
  };

  const showDocuments = lead
    ? (lead.referralType && lead.referralType !== 'Referral Only') || lead.currentStatus === 'Collecting Documentation'
    : false;

  const customerInfo = lead?.customerInfo || lead?.clientInfo || {};
  const propertyInfo = lead?.propertyDetails || lead?.propertyInfo || {};
  const loanInfo = lead?.loanRequirements || lead?.loanInfo || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition">
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Lead Details</h1>
          </div>
          {lead && (
            <div className="flex items-center gap-3">
              <StatusBadge status={lead.currentStatus} />
              <button onClick={() => refetch()} disabled={isFetching} className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition">
                <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={32} className="text-purple-600 animate-spin" />
            <p className="text-gray-500 text-sm">Loading lead details...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-red-100 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Failed to load lead</h3>
            <p className="text-gray-500 text-sm mb-6">Could not fetch details for this lead.</p>
            <button onClick={() => refetch()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">Try Again</button>
          </div>
        )}

        {lead && !isLoading && (
          <>
            {/* ── Status pipeline panel ── */}
            <LeadStatusPanel lead={lead} roleCode={roleCode} onRefetch={refetch} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DetailCard icon={User} title="Customer Information" accentColor="#5c039b">
                <InfoRow label="Full Name"       value={customerInfo.fullName || [customerInfo.firstName, customerInfo.lastName].filter(Boolean).join(' ')} icon={UserCheck} />
                <InfoRow label="Email"           value={customerInfo.email} icon={Mail} />
                <InfoRow label="Mobile"          value={customerInfo.mobileNumber || customerInfo.mobile} icon={Phone} />
                <InfoRow label="Nationality"     value={customerInfo.nationality} icon={Users} />
                <InfoRow label="Residency"       value={customerInfo.residencyStatus} />
                <InfoRow label="Employment"      value={customerInfo.employmentStatus} icon={Building} />
                <InfoRow label="Monthly Salary"  value={formatCurrency(customerInfo.monthlySalary)} icon={Banknote} />
                <InfoRow label="Salary Bank"     value={customerInfo.salaryBankName} icon={Building} />
                <InfoRow label="Liabilities/mo"  value={formatCurrency(customerInfo.existingLiabilities ?? customerInfo.existingMonthlyLiabilities)} icon={DollarSign} />
                <InfoRow label="Employer"        value={customerInfo.employer} last />
              </DetailCard>

              <DetailCard icon={Home} title="Property Details" accentColor="#10b981">
                <InfoRow label="Property Type" value={[propertyInfo.propertyType, propertyInfo.propertySubtype].filter(Boolean).join(' — ')} icon={Building} />
                <InfoRow label="Property Value" value={formatCurrency(propertyInfo.propertyValue)} icon={DollarSign} />
                <InfoRow label="Down Payment" value={formatCurrency(propertyInfo.downPaymentAmount || propertyInfo.downPayment)} />
                <InfoRow label="Building" value={propertyInfo.propertyAddress?.building} icon={MapPin} />
                <InfoRow label="Area" value={propertyInfo.propertyAddress?.area} />
                <InfoRow label="City" value={propertyInfo.propertyAddress?.city} />
                <InfoRow label="Property Age" value={propertyInfo.propertyAgeYears ? `${propertyInfo.propertyAgeYears} yrs` : null} icon={Calendar} />
                <InfoRow label="Off-Plan" value={propertyInfo.isOffPlan != null ? (propertyInfo.isOffPlan ? 'Yes' : 'No') : null} last />
              </DetailCard>

              <DetailCard icon={Briefcase} title="Loan Requirements" accentColor="#f59e0b">
                <InfoRow label="Loan Amount" value={formatCurrency(propertyInfo.loanAmountRequired || loanInfo.requestedAmount)} icon={CreditCard} />
                <InfoRow label="Tenure" value={loanInfo.preferredTenureYears ? `${loanInfo.preferredTenureYears} Years` : null} icon={Calendar} />
                <InfoRow label="Rate Type" value={loanInfo.preferredInterestRateType || loanInfo.interestRateType} icon={TrendingUp} />
                <InfoRow label="Preferred Banks" value={loanInfo.preferredBanks?.join(', ') || loanInfo.selectedBank} icon={Building} />
                <InfoRow label="Special Requirements" value={loanInfo.specialRequirements} />
                <InfoRow label="Referral Type" value={lead.referralType} />
                <InfoRow label="Notes to Xoto" value={lead.notesToXoto} icon={FileCheck} last />
              </DetailCard>
            </div>

            {showDocuments && <DocumentsList leadId={lead._id || leadId} />}

            <LinkedProposalsCases leadId={lead._id || leadId} roleSlug={roleSlug} />

            {lead.internalNotes?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 mt-6 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-purple-600" />
                  <span className="font-bold text-gray-800 text-sm">Internal Notes</span>
                </div>
                <div className="space-y-2">
                  {lead.internalNotes.map((note, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-700">{note.note}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>By: {note.addedBy}</span>
                        <span>{new Date(note.addedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VaultLeadDetail;
