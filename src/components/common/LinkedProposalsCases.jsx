import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/api/apiService';
import { fmtAED } from '@/utils/format';
import {
  FileText, Briefcase, ChevronRight, RefreshCw,
  CheckCircle, Clock, AlertTriangle, XCircle, ArrowRight,
  TrendingUp, Building2
} from 'lucide-react';
import { Tooltip } from 'antd';

const C = {
  primary:     '#5C039B',
  primarySoft: '#F5F0FF',
  primaryBord: '#E9D5FF',
  green:       '#10B981',
  greenSoft:   '#ECFDF5',
  greenBord:   '#A7F3D0',
  red:         '#EF4444',
  redSoft:     '#FEF2F2',
  redBord:     '#FECACA',
  amber:       '#F59E0B',
  amberSoft:   '#FFFBEB',
  amberBord:   '#FDE68A',
  blue:        '#3B82F6',
  blueSoft:    '#EFF6FF',
  gray:        '#6B7280',
  grayLight:   '#F9FAFB',
  grayBord:    '#E5E7EB',
  text:        '#111827',
  textMuted:   '#9CA3AF',
  white:       '#FFFFFF',
};

// ── Case pipeline stages in order ─────────────────────────────────────────────
const PIPELINE_STAGES = [
  {
    key: 'Draft',
    label: 'Draft',
    tip: 'Application created and saved as draft. Advisor is filling in the details.',
  },
  {
    key: 'Submitted to Xoto',
    label: 'Submitted',
    tip: 'Application submitted to Xoto operations team for review.',
  },
  {
    key: 'Ops Queue',
    label: 'Ops Queue',
    tip: 'Application entered the operations queue awaiting assignment to an ops officer.',
    // Matches multiple statuses
    match: ['In Ops Queue - Pending Pick-up', 'Assigned - Pending Review'],
  },
  {
    key: 'Under Review',
    label: 'Review',
    tip: 'An ops officer is actively reviewing the documents and information.',
    match: ['Under Review', 'Returned - Pending Correction', 'Resubmitted-After Correction'],
  },
  {
    key: 'Submitted to Bank',
    label: 'At Bank',
    tip: 'All documents verified. Application has been submitted to the bank for assessment.',
  },
  {
    key: 'Pre-Approved',
    label: 'Pre-Approved',
    tip: 'Bank has issued a pre-approval in principle. Awaiting final valuation.',
  },
  {
    key: 'Valuation',
    label: 'Valuation',
    tip: 'Property valuation is in progress as required by the bank.',
  },
  {
    key: 'FOL Issued',
    label: 'FOL',
    tip: 'Final Offer Letter (FOL) issued by the bank. Awaiting customer signature.',
    match: ['FOL Processed', 'FOL Issued', 'FOL Signed'],
  },
  {
    key: 'Disbursed',
    label: 'Disbursed',
    tip: 'Loan has been disbursed. Process complete.',
  },
];

const TERMINAL_STATUSES = ['Disbursed', 'Rejected', 'Declined', 'Lost', 'Not Proceeding'];
const NEGATIVE_STATUSES = ['Rejected', 'Declined', 'Lost', 'Not Proceeding'];
const CORRECTION_STATUSES = ['Returned - Pending Correction', 'Resubmitted-After Correction'];

// Map each raw case status to its pipeline stage index
const getStageIndex = (status) => {
  const stageKeys = PIPELINE_STAGES.map(s => s.key);
  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    const stage = PIPELINE_STAGES[i];
    const matches = stage.match || [stage.key];
    if (matches.includes(status)) return i;
  }
  // Fallback: try exact key match
  const idx = stageKeys.indexOf(status);
  return idx >= 0 ? idx : 0;
};

const getCaseStatusColor = (status) => {
  if (status === 'Disbursed') return { bg: C.greenSoft, color: C.green, border: C.greenBord };
  if (NEGATIVE_STATUSES.includes(status)) return { bg: C.redSoft, color: C.red, border: C.redBord };
  if (CORRECTION_STATUSES.includes(status)) return { bg: C.amberSoft, color: C.amber, border: C.amberBord };
  if (['Submitted to Bank', 'Pre-Approved', 'Valuation', 'FOL Processed', 'FOL Issued', 'FOL Signed'].includes(status))
    return { bg: C.blueSoft, color: C.blue, border: '#BFDBFE' };
  return { bg: C.primarySoft, color: C.primary, border: C.primaryBord };
};

const getProposalStatusColor = (status) => {
  if (['Accepted', 'Approved'].includes(status)) return 'green';
  if (['Rejected', 'Declined'].includes(status)) return 'red';
  if (['Sent', 'Submitted'].includes(status)) return 'blue';
  return 'default';
};

// ── Case Pipeline Progress Bar ────────────────────────────────────────────────
function CasePipeline({ currentStatus }) {
  if (NEGATIVE_STATUSES.includes(currentStatus)) {
    const colorCfg = getCaseStatusColor(currentStatus);
    return (
      <div style={{
        marginTop: 10, padding: '8px 12px', borderRadius: 8,
        background: colorCfg.bg, border: `1px solid ${colorCfg.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <XCircle size={14} color={colorCfg.color} />
        <span style={{ fontSize: 12, fontWeight: 600, color: colorCfg.color }}>
          {currentStatus === 'Lost' ? 'Lead Lost' : currentStatus === 'Not Proceeding' ? 'Not Proceeding' : `Application ${currentStatus}`}
          {' '}— Application closed
        </span>
      </div>
    );
  }

  const currentIdx = getStageIndex(currentStatus);
  const isCorrection = CORRECTION_STATUSES.includes(currentStatus);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 2 }}>
        {PIPELINE_STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const pending = i > currentIdx;

          const dotColor = done ? C.green : active ? (isCorrection ? C.amber : C.primary) : C.textMuted;
          const labelColor = done ? C.green : active ? (isCorrection ? C.amber : C.primary) : C.textMuted;

          return (
            <React.Fragment key={stage.key}>
              <Tooltip title={<span style={{ fontSize: 11 }}>{stage.tip}</span>} placement="top">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52, cursor: 'help' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: done ? C.green : active ? (isCorrection ? C.amber : C.primary) : '#E5E7EB',
                    border: `2px solid ${dotColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {done ? (
                      <CheckCircle size={12} color="#fff" />
                    ) : active ? (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                    ) : (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.textMuted }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: active ? 800 : 600,
                    color: labelColor, marginTop: 3, textAlign: 'center',
                    whiteSpace: 'nowrap', lineHeight: 1.2,
                  }}>
                    {stage.label}
                  </span>
                </div>
              </Tooltip>
              {i < PIPELINE_STAGES.length - 1 && (
                <div style={{
                  flex: 1, height: 2, minWidth: 8, marginBottom: 14,
                  background: i < currentIdx ? C.green : '#E5E7EB',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {isCorrection && (
        <div style={{
          marginTop: 6, padding: '5px 10px', borderRadius: 6,
          background: C.amberSoft, border: `1px solid ${C.amberBord}`,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <AlertTriangle size={12} color={C.amber} />
          <span style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>
            {currentStatus === 'Returned - Pending Correction'
              ? 'Corrections required — awaiting resubmission'
              : 'Corrections submitted — under ops review'}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Case Card ─────────────────────────────────────────────────────────────────
function CaseCard({ c, onView }) {
  const statusCfg = getCaseStatusColor(c.currentStatus || 'Draft');
  const loanAmt = c.propertyInfo?.loanAmount || c.loanInfo?.loanAmount;
  const propVal = c.propertyInfo?.propertyValue;
  const bank = c.bankSelection?.bankName;

  return (
    <div
      onClick={onView}
      style={{
        padding: '14px 16px', borderRadius: 12,
        border: `1px solid ${statusCfg.border}`,
        background: statusCfg.bg + '60',
        cursor: 'pointer', transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>
            {c.caseReference || 'Application'}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            Created {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </div>
        </div>
        <div style={{
          padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800,
          background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`,
          whiteSpace: 'nowrap',
        }}>
          {c.currentStatus || 'Draft'}
        </div>
      </div>

      {/* Key amounts */}
      {(loanAmt || propVal || bank) && (
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          {loanAmt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <TrendingUp size={12} color={C.primary} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{fmtAED(loanAmt)}</span>
              <span style={{ fontSize: 11, color: C.textMuted }}>loan</span>
            </div>
          )}
          {propVal && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>Property: {fmtAED(propVal)}</span>
            </div>
          )}
          {bank && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Building2 size={12} color={C.gray} />
              <span style={{ fontSize: 11, color: C.gray }}>{bank}</span>
            </div>
          )}
        </div>
      )}

      {/* Pipeline */}
      <CasePipeline currentStatus={c.currentStatus || 'Draft'} />

      {/* View button */}
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 700, color: C.primary,
          padding: '4px 10px', borderRadius: 8,
          background: C.primarySoft, border: `1px solid ${C.primaryBord}`,
        }}>
          View Application <ChevronRight size={13} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LinkedProposalsCases({ leadId, roleSlug }) {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leadId) return;
    const fetchLinkedData = async () => {
      setLoading(true);
      try {
        const [propRes, caseRes] = await Promise.all([
          apiService.get(`/vault/proposals/by-lead/${leadId}`),
          apiService.get(`/vault/cases/by-lead/${leadId}`),
        ]);

        const allProps = propRes?.data?.data || propRes?.data || [];
        const allCases = caseRes?.data?.data || caseRes?.data || [];

        setProposals(Array.isArray(allProps) ? allProps : []);
        setCases(Array.isArray(allCases) ? allCases : []);
      } catch (err) {
        console.error('Failed to load linked proposals/cases', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLinkedData();
  }, [leadId]);

  if (loading) {
    return (
      <div style={{
        marginTop: 20, padding: '16px 20px',
        background: C.white, borderRadius: 16,
        border: `1px solid ${C.grayBord}`,
        display: 'flex', alignItems: 'center', gap: 10,
        color: C.primary, fontSize: 13, fontWeight: 600,
      }}>
        <RefreshCw size={15} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
        Loading linked applications and proposals...
      </div>
    );
  }

  if (proposals.length === 0 && cases.length === 0) return null;

  return (
    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>

      {/* Proposals Card */}
      {proposals.length > 0 && (
        <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.grayBord}`, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px', background: C.grayLight,
            borderBottom: `1px solid ${C.grayBord}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: C.primarySoft, border: `1px solid ${C.primaryBord}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={15} color={C.primary} />
            </div>
            <span style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>Linked Proposals</span>
            <span style={{ marginLeft: 'auto', padding: '2px 8px', background: C.primarySoft, borderRadius: 99, fontSize: 11, fontWeight: 700, color: C.primary }}>
              {proposals.length}
            </span>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {proposals.map(p => {
              const colorKey = getProposalStatusColor(p.status);
              const colorMap = { green: C.green, red: C.red, blue: C.blue, default: C.gray };
              const col = colorMap[colorKey] || C.gray;
              return (
                <div
                  key={p._id}
                  onClick={() => navigate(`/dashboard/${roleSlug}/proposals/${p._id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 10,
                    border: `1px solid ${C.grayBord}`,
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.primarySoft; e.currentTarget.style.borderColor = C.primaryBord; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = C.grayBord; }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{p.proposalReference || 'Proposal'}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: `${col}18`, color: col, border: `1px solid ${col}40`,
                    }}>
                      {p.status || 'Draft'}
                    </span>
                    <ChevronRight size={14} color={C.textMuted} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cases Card */}
      {cases.length > 0 && (
        <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.grayBord}`, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px', background: C.grayLight,
            borderBottom: `1px solid ${C.grayBord}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: C.greenSoft, border: `1px solid ${C.greenBord}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={15} color={C.green} />
            </div>
            <span style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>Linked Applications</span>
            <span style={{ marginLeft: 'auto', padding: '2px 8px', background: C.greenSoft, borderRadius: 99, fontSize: 11, fontWeight: 700, color: C.green }}>
              {cases.length}
            </span>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cases.map(c => (
              <CaseCard
                key={c._id}
                c={c}
                onView={() => navigate(`/dashboard/${roleSlug}/case/view/${c._id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
