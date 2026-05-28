import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { apiService } from "@/api/apiService";
import { fmtAED } from '@/utils/format';
import { Modal, message } from 'antd';
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
  CreditCard,
  Calendar,
  MapPin,
  Building,
  Phone,
  Mail,
  DollarSign,
  UserCheck,
  Banknote,
  Users,
  TrendingUp,
  Info,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// STATUS CONFIGURATION - PRD Section 4.3 (13 statuses)
// ──────────────────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  'New': { bg: 'bg-blue-50', color: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  'Assigned': { bg: 'bg-purple-50', color: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200' },
  'Contacted': { bg: 'bg-amber-50', color: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  'Qualified': { bg: 'bg-emerald-50', color: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  'Collecting Documents': { bg: 'bg-purple-50', color: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200' },
  'Documents Complete': { bg: 'bg-teal-50', color: 'text-teal-700', dot: 'bg-teal-500', border: 'border-teal-200' },
  'Application Opened': { bg: 'bg-blue-50', color: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  'Bank Application': { bg: 'bg-violet-50', color: 'text-violet-700', dot: 'bg-violet-500', border: 'border-violet-200' },
  'Pre-Approved': { bg: 'bg-green-50', color: 'text-green-700', dot: 'bg-green-500', border: 'border-green-200' },
  'Valuation': { bg: 'bg-orange-50', color: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200' },
  'FOL Processed': { bg: 'bg-indigo-50', color: 'text-indigo-700', dot: 'bg-indigo-500', border: 'border-indigo-200' },
  'FOL Issued': { bg: 'bg-indigo-50', color: 'text-indigo-700', dot: 'bg-indigo-500', border: 'border-indigo-200' },
  'FOL Signed': { bg: 'bg-indigo-50', color: 'text-indigo-700', dot: 'bg-indigo-500', border: 'border-indigo-200' },
  'Disbursed': { bg: 'bg-sky-50', color: 'text-sky-700', dot: 'bg-sky-500', border: 'border-sky-200' },
  'Lost': { bg: 'bg-gray-50', color: 'text-gray-700', dot: 'bg-gray-500', border: 'border-gray-200' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || {
    bg: 'bg-gray-50',
    color: 'text-gray-700',
    dot: 'bg-gray-500',
    border: 'border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${s.bg} ${s.color} border ${s.border} text-xs font-semibold`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status || 'Unknown'}
    </span>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// INFO ROW COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, icon: Icon, last }) => {
  if (!value) return null;
  return (
    <div className={`py-3 ${!last ? 'border-b border-gray-100' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={12} className="text-gray-400" />}
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-800 break-words">
        {value}
      </p>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// DETAIL CARD COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
const DetailCard = ({ icon: Icon, title, accentColor, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
      >
        <Icon size={16} style={{ color: accentColor }} />
      </div>
      <span className="font-bold text-gray-800 text-sm">{title}</span>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────
// MAIN LEAD DETAIL PAGE (Agent/Referral Partner View - PRD Section 4.3)
// ──────────────────────────────────────────────────────────────────────────────
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
  const isReferralPartner = user?.agentType === 'ReferralPartner';

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['leadDetail', leadId],
    queryFn: () => apiService.get(`/vault/lead/${leadId}`),
    enabled: !!leadId,
  });

  const lead = data?.data || data;

  const formatCurrency = fmtAED;

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const customerInfo = lead?.customerInfo || {};
  const propertyDetails = lead?.propertyDetails || {};
  const loanRequirements = lead?.loanRequirements || {};
  const sourceInfo = lead?.sourceInfo || {};
  const assignedTo = lead?.assignedTo || {};
  const sla = lead?.sla || {};

  // Get source label
  const getSourceLabel = () => {
    const source = sourceInfo.source;
    switch(source) {
      case 'referral_partner': return 'Referral Partner';
      case 'freelance_agent': return 'Referral Partner';
      case 'partner_affiliated_agent': return 'Partner Affiliated Agent';
      case 'individual_partner': return 'Individual Partner';
      case 'website': return 'Website';
      case 'admin': return 'Admin';
      default: return source || '—';
    }
  };

  // Get SLA status
  const getSLAStatus = () => {
    if (!sla.deadline) return null;
    const deadline = new Date(sla.deadline);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.floor((deadline - now) / (1000 * 60 * 60)));
    if (sla.breached || deadline < now) {
      return { status: 'breached', text: 'SLA Breached', color: 'text-red-600' };
    }
    if (hoursLeft < 2) {
      return { status: 'urgent', text: `${hoursLeft}h left`, color: 'text-amber-600' };
    }
    return { status: 'ok', text: `${hoursLeft}h left`, color: 'text-green-600' };
  };

  const slaStatus = getSLAStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back to Leads</span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Lead Details</h1>
              <p className="text-xs text-gray-400 mt-0.5">ID: {lead?._id?.slice(-8) || '—'}</p>
            </div>
          </div>

          {lead && (
            <div className="flex items-center gap-3">
              <StatusBadge status={lead.currentStatus} />
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
              >
                <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={32} className="text-purple-600 animate-spin" />
            <p className="text-gray-500 text-sm">Loading lead details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-red-100 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Failed to load lead</h3>
            <p className="text-gray-500 text-sm mb-6">Could not fetch details for this lead.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Lead Content */}
        {lead && !isLoading && (
          <>
            {/* Status Info Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Source:</span>
                  <span className="text-xs font-medium text-gray-700">{getSourceLabel()}</span>
                </div>
                <div className="w-px h-4 bg-gray-200" />
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Created:</span>
                  <span className="text-xs font-medium text-gray-700">{formatDate(lead.createdAt)}</span>
                </div>
                {assignedTo.advisorName && (
                  <>
                    <div className="w-px h-4 bg-gray-200" />
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-500">Advisor:</span>
                      <span className="text-xs font-medium text-gray-700">{assignedTo.advisorName}</span>
                    </div>
                  </>
                )}
                {slaStatus && (
                  <>
                    <div className="w-px h-4 bg-gray-200" />
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-500">SLA:</span>
                      <span className={`text-xs font-medium ${slaStatus.color}`}>{slaStatus.text}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Three Column Grid - PRD Section 4.3 Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Customer Info Card */}
              <DetailCard icon={User} title="Customer Information" accentColor="#5c039b">
                <InfoRow 
                  label="Full Name" 
                  value={`${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || '—'} 
                  icon={UserCheck} 
                />
                <InfoRow label="Email" value={customerInfo.email} icon={Mail} />
                <InfoRow label="Mobile Number" value={customerInfo.mobileNumber || customerInfo.mobile} icon={Phone} />
                <InfoRow label="Nationality" value={customerInfo.nationality} icon={Users} />
                <InfoRow label="Residency Status" value={customerInfo.residencyStatus} icon={Building} />
                <InfoRow label="Employment Status" value={customerInfo.employmentStatus} icon={Briefcase} />
                <InfoRow label="Monthly Salary" value={formatCurrency(customerInfo.monthlySalary)} icon={Banknote} last />
              </DetailCard>

              {/* Property Details Card */}
              <DetailCard icon={Home} title="Property Details" accentColor="#10b981">
                <InfoRow label="Transaction Type" value={propertyDetails.transactionType} icon={Building} />
                <InfoRow label="Property Found" value={propertyDetails.propertyFound === true ? 'Yes' : propertyDetails.propertyFound === false ? 'No' : '—'} />
                <InfoRow label="Approx Property Value" value={propertyDetails.approxPropertyValue} icon={DollarSign} />
                <InfoRow label="Property Value" value={formatCurrency(propertyDetails.propertyValue)} />
                <InfoRow label="Down Payment" value={formatCurrency(propertyDetails.downPaymentAmount)} />
                <InfoRow label="Loan Amount Required" value={formatCurrency(propertyDetails.loanAmountRequired)} />
                <InfoRow label="Area" value={propertyDetails.propertyAddress?.area} icon={MapPin} />
                <InfoRow label="City" value={propertyDetails.propertyAddress?.city} last />
              </DetailCard>

              {/* Loan Requirements Card */}
              <DetailCard icon={Briefcase} title="Loan Requirements" accentColor="#f59e0b">
                <InfoRow label="Timeline" value={loanRequirements.timeline} icon={Calendar} />
                <InfoRow label="Preferred Tenure" value={loanRequirements.preferredTenureYears ? `${loanRequirements.preferredTenureYears} Years` : null} />
                <InfoRow label="Rate Type" value={loanRequirements.preferredInterestRateType} icon={TrendingUp} />
                <InfoRow label="Fee Financing" value={loanRequirements.feeFinancingPreference === true ? 'Yes' : loanRequirements.feeFinancingPreference === false ? 'No' : '—'} />
                <InfoRow label="Preferred Banks" value={loanRequirements.preferredBanks?.join(', ') || null} icon={Building} />
                <InfoRow label="Notes to Xoto" value={lead.notesToXoto} icon={FileText} last />
              </DetailCard>
            </div>

            {/* Eligibility Section - Only show if checked */}
            {lead.eligibility?.checked && (
              <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center">
                    <CheckCircle size={14} className="text-purple-600" />
                  </div>
                  <span className="font-bold text-gray-800 text-sm">Eligibility Check</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${lead.eligibility.isEligible ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {lead.eligibility.isEligible ? 'Eligible ✓' : 'Not Eligible ✗'}
                  </div>
                  {lead.eligibility.checkedAt && (
                    <span className="text-xs text-gray-400">
                      Checked on {formatDate(lead.eligibility.checkedAt)}
                    </span>
                  )}
                </div>
                {lead.eligibility.notes && (
                  <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-xl">
                    {lead.eligibility.notes}
                  </p>
                )}
              </div>
            )}

            {/* Conversion Info - Show if application created */}
            {lead.conversionInfo?.convertedToApplication && (
              <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText size={14} className="text-blue-600" />
                  </div>
                  <span className="font-bold text-gray-800 text-sm">Application Created</span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Application ID:</span>
                    <span className="text-xs font-mono font-medium text-gray-700">{lead.conversionInfo.applicationId}</span>
                  </div>
                  {lead.conversionInfo.convertedAt && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Created on:</span>
                      <span className="text-xs font-medium text-gray-700">{formatDate(lead.conversionInfo.convertedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Linked Proposals & Cases — hidden for Referral Partners */}
            {!isReferralPartner && (
              <LinkedProposalsCases leadId={lead._id || leadId} roleSlug={roleSlug} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VaultLeadDetail;