// src/pages/Leads/VaultAdminLeadDetail.jsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Modal, Select, message, Tag, Tooltip } from "antd";
import {
  ChevronLeft, User, Mail, Phone, Home, DollarSign,
  AlertCircle, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Layers, Shield, Activity, Check, Copy, Info,
  MapPin, Calendar, Hash, FileText, TrendingUp, Clock, GitBranch, Target,
  UserPlus, Bell, Building, Briefcase, CreditCard
} from "lucide-react";
import { apiService } from "@/api/apiService";
import LinkedProposalsCases from "@/components/common/LinkedProposalsCases";

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  primary: "#5C039B",
  primaryMid: "#7C3AED",
  primaryLight: "#9333EA",
  primaryGlow: "rgba(92,3,155,0.12)",
  primarySoft: "#F5F0FF",
  primaryBord: "#E9D5FF",
  green: "#10B981",
  greenSoft: "#ECFDF5",
  greenBord: "#A7F3D0",
  red: "#EF4444",
  redSoft: "#FEF2F2",
  redBord: "#FECACA",
  amber: "#F59E0B",
  amberSoft: "#FFFBEB",
  amberBord: "#FDE68A",
  blue: "#3B82F6",
  blueSoft: "#EFF6FF",
  gray: "#6B7280",
  grayLight: "#F9FAFB",
  grayBord: "#E5E7EB",
  text: "#111827",
  textSub: "#374151",
  textMuted: "#9CA3AF",
  white: "#FFFFFF",
  bg: "#F4F0FA",
};

// ─── PRD Section 4.3 - Lead Statuses (13 statuses) ─────────────────────────
const STATUS_CFG = {
  "New":                   { bg: "#EFF6FF", color: "#1D4ED8", border: "#93C5FD",  icon: "🆕" },
  "Assigned":              { bg: C.primarySoft, color: C.primary, border: C.primaryBord, icon: "👤" },
  "Contacted":             { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA",  icon: "📞" },
  "Qualified":             { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE",  icon: "⭐" },
  "Collecting Documents":  { bg: "#FAF5FF", color: "#581C87", border: "#E9D5FF",  icon: "📄" },
  "Documents Complete":    { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0",  icon: "✅" },
  "Application Opened":    { bg: "#FFF5F3", color: "#C2410C", border: "#FECACA",  icon: "📂" },
  "Bank Application":      { bg: "#EDE9FE", color: "#5B21B6", border: "#C7D2FE",  icon: "🏦" },
  "Pre-Approved":          { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0",  icon: "✅" },
  "Valuation":             { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A",  icon: "📊" },
  "FOL Processed":         { bg: "#E0E7FF", color: "#3730A3", border: "#C7D2FE",  icon: "📝" },
  "FOL Issued":            { bg: "#E0E7FF", color: "#3730A3", border: "#C7D2FE",  icon: "📜" },
  "FOL Signed":            { bg: "#F3E8FF", color: "#6B21A5", border: "#E9D5FF",  icon: "✍️" },
  "Disbursed":             { bg: "#ECFDF5", color: "#065F46", border: "#D1FAE5",  icon: "💰" },
  "Not Proceeding":        { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB",  icon: "🚫" },
  "Lost":                  { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA",  icon: "❌" },
};

const SOURCE_LABELS = {
  freelance_agent: "Referral Partner",
  partner_affiliated_agent: "Partner Agent",
  individual_partner: "Partner",
  website: "Website",
  admin: "Admin",
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const show = (v) => (v !== null && v !== undefined && v !== "") ? v : null;
const fmt = (n) => n ? Number(n).toLocaleString("en-AE") : "—";
const fmtDate = (s) => { try { return s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null; } catch { return null; } };
const fmtDT = (s) => { try { return s ? new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null; } catch { return null; } };
const boolLabel = (v) => v === true ? "Yes" : v === false ? "No" : null;
const capWords = (s) => s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;

export default function VaultAdminLeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const roleCode = typeof user?.role === "object" ? String(user?.role?.code) : String(user?.role ?? "");
  const isAdmin = roleCode === "18";
  const roleSlugMap = { '18': 'vault-admin', '21': 'vaultpartner', '22': 'vaultagent', '26': 'vault-advisor' };
  const roleSlug = roleSlugMap[roleCode] ?? 'vaultagent';

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Assign Modal
  const [assignModal, setAssignModal] = useState(false);
  const [advisors, setAdvisors] = useState([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  
  // Notify Modal
  const [notifyModal, setNotifyModal] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const fetchLead = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiService.get(`/vault/lead/${id}`);
      const data = res?.data?.data || res?.data || null;
      setLead(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load lead");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvisors = async () => {
    try {
      const res = await apiService.get("/vault/advisor/workload?limit=100");
      const list = res?.data?.data || res?.data || [];
      setAdvisors(list.map(a => ({
        id: a.advisorId,
        fullName: a.advisorName || a.email || "Advisor",
        email: a.email,
        currentLeads: a.workload?.currentLeads || 0,
        maxLeadsCapacity: a.workload?.maxCapacity ?? 100,
        remainingCapacity: a.workload?.remainingCapacity,
        canTakeMore: a.workload?.canTakeMore,
      })));
    } catch (err) {
      console.error("Error fetching advisors:", err);
    }
  };

  useEffect(() => { if (id) { fetchLead(); if (isAdmin) fetchAdvisors(); } }, [id]);

  const handleAssign = async () => {
    if (!selectedAdvisor) {
      message.warning("Please select an advisor");
      return;
    }
    setAssignLoading(true);
    try {
      await apiService.post("/vault/lead/admin/assign-to-advisor", {
        leadIds: [lead._id],
        advisorId: selectedAdvisor
      });
      message.success(`Lead assigned to ${advisors.find(a => a.id === selectedAdvisor)?.fullName || "advisor"}! SLA timer started.`);
      setAssignModal(false);
      fetchLead();
    } catch (err) {
      message.error(err?.response?.data?.message || "Assignment failed");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleNotifyAdvisor = async () => {
    setNotifyLoading(true);
    try {
      await apiService.post("/vault/lead/admin/notify-advisor-sla", { leadId: lead._id });
      message.success("SLA reminder sent to advisor!");
      setNotifyModal(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to send notification");
    } finally {
      setNotifyLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={32} color={C.primary} className="animate-spin" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <AlertCircle size={48} color={C.red} />
        <p style={{ color: C.red, marginTop: 16 }}>{error || "Lead not found"}</p>
        <Button onClick={() => navigate(-1)} style={{ marginTop: 20 }}>Go Back</Button>
      </div>
    );
  }

  const ci = lead.customerInfo || {};
  const pd = lead.propertyDetails || {};
  const pa = pd.propertyAddress || {};
  const si = lead.sourceInfo || {};
  const at = lead.assignedTo || {};
  const sla = lead.sla || {};
  const lr = lead.loanRequirements || {};
  const cv = lead.conversionInfo || {};
  const elig = lead.eligibility || {};
  const dup = lead.duplicateCheck || {};

  const currentStatus = lead.currentStatus || "New";
  const statusCfg = STATUS_CFG[currentStatus] || STATUS_CFG["New"];
  const isSlaBreached = sla.breached === true;
  const isAssigned = !!at.advisorId;

  const TABS = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "property", label: "Property & Loan", icon: Home },
    { id: "eligibility", label: "Eligibility", icon: TrendingUp },
    { id: "system", label: "System", icon: Shield },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .fade-up { animation: fadeUp 0.3s ease; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>

        {/* Header with Back Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: C.white, border: `1px solid ${C.grayBord}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <ChevronLeft size={15} /> Back to Leads
          </button>
          
          <div style={{ display: "flex", gap: 10 }}>
            {!isAssigned && (
              <Button type="primary" icon={<UserPlus size={14} />} onClick={() => setAssignModal(true)} style={{ background: C.primary }}>
                Assign to Advisor
              </Button>
            )}
            {isAssigned && isSlaBreached && (
              <Button danger icon={<Bell size={14} />} onClick={() => setNotifyModal(true)}>
                Notify Advisor (SLA Breached)
              </Button>
            )}
            <Button icon={<RefreshCw size={14} />} onClick={fetchLead}>Refresh</Button>
          </div>
        </div>

        {/* SLA Breach Alert */}
        {isSlaBreached && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: C.redSoft, border: `1px solid ${C.redBord}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={18} color={C.red} />
            <span style={{ color: "#991B1B", fontWeight: 600 }}>SLA Breached — Advisor missed 4-hour response window</span>
          </div>
        )}

        {/* Profile Header */}
        <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.grayBord}`, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid})` }} />
          <div style={{ padding: "24px 28px", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: C.primarySoft, border: `2px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={32} color={C.primary} />
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{ci.fullName || `${ci.firstName || ""} ${ci.lastName || ""}`.trim() || "—"}</h1>
                <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: statusCfg.bg, color: statusCfg.color }}>
                  {statusCfg.icon} {currentStatus}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {ci.email && <span style={{ fontSize: 12, color: C.gray }}><Mail size={12} /> {ci.email}</span>}
                {ci.mobileNumber && <span style={{ fontSize: 12, color: C.gray }}><Phone size={12} /> {ci.mobileNumber}</span>}
                <span style={{ fontSize: 12, color: C.gray }}><Calendar size={12} /> Created {fmtDate(lead.createdAt)}</span>
                <span style={{ fontSize: 12, color: C.gray }}><Hash size={12} /> ID: {lead._id?.slice(-8)}</span>
              </div>
            </div>
            
            <div style={{ textAlign: "right", minWidth: 180 }}>
              {isAssigned ? (
                <>
                  <div style={{ fontSize: 10, color: C.textMuted }}>ASSIGNED TO</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{at.advisorName}</div>
                  <div style={{ fontSize: 11, color: C.gray }}>Since {fmtDate(at.assignedAt)}</div>
                </>
              ) : (
                <Tag color="orange">⚠️ Unassigned</Tag>
              )}
              <div style={{ marginTop: 8, fontSize: 11, color: C.gray }}>Source: {SOURCE_LABELS[si.source] || si.source || "—"}</div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.grayBord}` }}>
            <div style={{ fontSize: 10, color: C.textMuted }}>Property Value</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{pd.propertyValue ? `AED ${fmt(pd.propertyValue)}` : pd.approxPropertyValue || "—"}</div>
          </div>
          <div style={{ background: C.white, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.grayBord}` }}>
            <div style={{ fontSize: 10, color: C.textMuted }}>Loan Amount</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{pd.loanAmountRequired ? `AED ${fmt(pd.loanAmountRequired)}` : "—"}</div>
          </div>
          <div style={{ background: C.white, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.grayBord}` }}>
            <div style={{ fontSize: 10, color: C.textMuted }}>Timeline</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{lr.timeline || "—"}</div>
          </div>
          <div style={{ background: isSlaBreached ? C.redSoft : C.white, borderRadius: 12, padding: "12px 16px", border: `1px solid ${isSlaBreached ? C.redBord : C.grayBord}` }}>
            <div style={{ fontSize: 10, color: C.textMuted }}>SLA Status</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: isSlaBreached ? C.red : C.green }}>{isSlaBreached ? "Breached" : sla.deadline ? "Active" : "Not Started"}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: C.white, borderRadius: 14, padding: "4px 6px", marginBottom: 20, border: `1px solid ${C.grayBord}` }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: "none", background: active ? C.primarySoft : "transparent", color: active ? C.primary : C.gray, fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer" }}>
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="fade-up">
          
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {/* Customer Information */}
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={14} color={C.primary} /> <span style={{ fontWeight: 700 }}>Customer Information</span>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <Row label="Full Name" value={ci.fullName || `${ci.firstName || ""} ${ci.lastName || ""}`.trim()} />
                  <Row label="Email" value={ci.email} copy />
                  <Row label="Mobile" value={ci.mobileNumber} copy />
                  <Row label="Nationality" value={ci.nationality} />
                  <Row label="Residency" value={ci.residencyStatus} />
                  <Row label="Employment" value={ci.employmentStatus} />
                  <Row label="Monthly Salary"       value={ci.monthlySalary       ? `AED ${fmt(ci.monthlySalary)}`       : null} />
                  <Row label="Salary Bank"          value={ci.salaryBankName}                                                       />
                  <Row label="Existing Liabilities" value={ci.existingLiabilities ? `AED ${fmt(ci.existingLiabilities)}` : null} />
                  <Row label="Date of Birth"        value={fmtDate(ci.dateOfBirth)}                                                  />
                  <Row label="Marital Status"       value={ci.maritalStatus}                                                         />
                  <Row label="Dependents"           value={ci.numberOfDependents}                                                    />
                  <Row label="Occupation"           value={ci.occupation}                                                            />
                  <Row label="Employer"             value={ci.employer}                                                              />
                </div>
              </div>

              {/* Lead Source & Assignment */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden" }}>
                  <div style={{ padding: "12px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 8 }}>
                    <FileText size={14} color={C.primary} /> <span style={{ fontWeight: 700 }}>Lead Source</span>
                  </div>
                  <div style={{ padding: "16px 20px" }}>
                    <Row label="Source" value={SOURCE_LABELS[si.source] || si.source} />
                    <Row label="Submitted By" value={si.createdByName} />
                    <Row label="Submission Method" value={capWords(si.submissionMethod)} />
                    <Row label="Submitted At" value={fmtDT(si.createdAt)} />
                    <Row label="Source IP" value={si.sourceIp} />
                  </div>
                </div>

                <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden" }}>
                  <div style={{ padding: "12px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 8 }}>
                    <UserPlus size={14} color={C.primary} /> <span style={{ fontWeight: 700 }}>Assignment</span>
                  </div>
                  <div style={{ padding: "16px 20px" }}>
                    {isAssigned ? (
                      <>
                        <Row label="Advisor Name" value={at.advisorName} />
                        <Row label="Assigned At" value={fmtDT(at.assignedAt)} />
                        <Row label="Assigned By" value={at.assignedBy} />
                      </>
                    ) : (
                      <div style={{ textAlign: "center", padding: 20, color: C.amber }}>⚠️ Not assigned yet</div>
                    )}
                  </div>
                </div>

                {lead.notesToXoto && (
                  <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden" }}>
                    <div style={{ padding: "12px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 8 }}>
                      <Info size={14} color={C.primary} /> <span style={{ fontWeight: 700 }}>Notes to Xoto</span>
                    </div>
                    <div style={{ padding: "16px 20px", background: C.primarySoft, fontSize: 13, color: C.textSub }}>
                      {lead.notesToXoto}
                    </div>
                  </div>
                )}

                {/* Not Proceeding reason — shown when lead is closed */}
                {lead.notProceedingReason && (
                  <div style={{ background: C.white, borderRadius: 14, border: "1px solid #FECACA", overflow: "hidden" }}>
                    <div style={{ padding: "12px 20px", background: "#FEF2F2", borderBottom: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>🚫</span> <span style={{ fontWeight: 700, color: "#991B1B" }}>Not Proceeding — Reason</span>
                    </div>
                    <div style={{ padding: "16px 20px", background: "#FFF5F5", fontSize: 13, color: "#7F1D1D" }}>
                      {lead.notProceedingReason}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Property & Loan Tab */}
          {activeTab === "property" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <Home size={14} color={C.primary} /> <span style={{ fontWeight: 700 }}>Property Details</span>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <Row label="Transaction Type" value={pd.transactionType} />
                  <Row label="Property Found" value={boolLabel(pd.propertyFound)} />
                  <Row label="Approx Property Value" value={pd.approxPropertyValue} />
                  <Row label="Property Value" value={pd.propertyValue ? `AED ${fmt(pd.propertyValue)}` : null} />
                  <Row label="Down Payment" value={pd.downPaymentAmount ? `AED ${fmt(pd.downPaymentAmount)}` : null} />
                  <Row label="Loan Amount" value={pd.loanAmountRequired ? `AED ${fmt(pd.loanAmountRequired)}` : null} />
                  <Row label="Property Type" value={pd.propertyType} />
                  <Row label="Off-Plan" value={boolLabel(pd.isOffPlan)} />
                  <Row label="Area" value={pa.area} />
                  <Row label="City" value={pa.city} />
                </div>
              </div>

              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <Target size={14} color={C.primary} /> <span style={{ fontWeight: 700 }}>Loan Requirements</span>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <Row label="Timeline" value={lr.timeline} />
                  <Row label="Preferred Tenure" value={lr.preferredTenureYears ? `${lr.preferredTenureYears} years` : null} />
                  <Row label="Rate Type" value={lr.preferredInterestRateType} />
                  <Row label="Preferred Banks" value={lr.preferredBanks?.length ? lr.preferredBanks.join(", ") : "No preference"} />
                  <Row label="Fee Financing" value={boolLabel(lr.feeFinancingPreference)} />
                  <Row label="Life Insurance" value={boolLabel(lr.lifeInsurancePreference)} />
                  <Row label="Property Insurance" value={boolLabel(lr.propertyInsurancePreference)} />
                  {lr.specialRequirements && <Row label="Special Requirements" value={lr.specialRequirements} />}
                </div>
              </div>
            </div>
          )}

          {/* Eligibility Tab */}
          {activeTab === "eligibility" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingUp size={14} color={C.primary} /> <span style={{ fontWeight: 700 }}>Eligibility Check</span>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <Row label="Checked" value={boolLabel(elig.checked)} highlight={elig.checked} />
                  <Row label="Is Eligible" value={boolLabel(elig.isEligible)} highlight={elig.isEligible} />
                  <Row label="Eligibility Score" value={elig.eligibilityScore} />
                  <Row label="Risk Grade" value={elig.riskGrade} badge={elig.riskGrade === "Excellent" || elig.riskGrade === "Good" ? { bg: C.greenSoft, color: C.green } : elig.riskGrade === "Risky" ? { bg: C.redSoft, color: C.red } : null} />
                  <Row label="DBR Status" value={elig.dbrStatus} />
                  <Row label="DBR Percentage" value={elig.dbrPercentage ? `${elig.dbrPercentage}%` : null} />
                  <Row label="Estimated LTV" value={elig.estimatedLTV ? `${elig.estimatedLTV}%` : null} />
                  <Row label="Recommended Loan" value={elig.recommendedLoanAmount ? `AED ${fmt(elig.recommendedLoanAmount)}` : null} />
                  <Row label="Checked At" value={fmtDT(elig.checkedAt)} />
                  <Row label="Checked By" value={elig.checkedBy?._id || elig.checkedBy} />
                  {elig.eligibilityNotes && <Row label="Notes" value={elig.eligibilityNotes} />}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden" }}>
                  <div style={{ padding: "12px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 8 }}>
                    <GitBranch size={14} color={C.primary} /> <span style={{ fontWeight: 700 }}>Conversion Status</span>
                  </div>
                  <div style={{ padding: "16px 20px" }}>
                    <Row label="Converted to Application" value={boolLabel(cv.convertedToApplication)} highlight={cv.convertedToApplication} />
                    <Row label="Application ID" value={cv.applicationId} copy />
                    <Row label="Proposal ID" value={cv.proposalId} copy />
                    <Row label="Converted At" value={fmtDT(cv.convertedAt)} />
                    <Row label="Converted By" value={cv.convertedByName} />
                  </div>
                </div>

                <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden" }}>
                  <div style={{ padding: "12px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle size={14} color={C.primary} /> <span style={{ fontWeight: 700 }}>Duplicate Check</span>
                  </div>
                  <div style={{ padding: "16px 20px" }}>
                    <Row label="Is Duplicate" value={boolLabel(dup.isDuplicate)} highlight={!dup.isDuplicate} />
                    <Row label="Phone Match Found" value={boolLabel(dup.matchingPhoneFound)} highlight={!dup.matchingPhoneFound} />
                    <Row label="Checked At" value={fmtDT(dup.checkPerformedAt)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <Shield size={14} color={C.primary} /> <span style={{ fontWeight: 700 }}>System Information</span>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <Row label="Lead ID" value={lead._id} copy mono />
                  <Row label="Customer ID" value={lead.customerId} copy />
                  <Row label="Version" value={lead.__v !== undefined ? `v${lead.__v}` : null} />
                  <Row label="Created At" value={fmtDT(lead.createdAt)} />
                  <Row label="Updated At" value={fmtDT(lead.updatedAt)} />
                  <Row label="Deleted" value={boolLabel(lead.isDeleted)} />
                </div>
              </div>

              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={14} color={C.primary} /> <span style={{ fontWeight: 700 }}>SLA Information</span>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <Row label="SLA Breached" value={boolLabel(sla.breached)} highlight={!sla.breached} />
                  <Row label="Deadline" value={fmtDT(sla.deadline)} />
                  <Row label="First Contact At" value={fmtDT(sla.firstContactAt)} />
                  <Row label="Qualified At" value={fmtDT(sla.qualificationAt)} />
                  <Row label="Response Time" value={sla.responseTimeHours ? `${sla.responseTimeHours} hours` : null} />
                  <Row label="Reminders Sent" value={sla.reminderCount} />
                </div>
              </div>
            </div>
          )}
          {/* Linked Proposals & Cases */}
          <LinkedProposalsCases leadId={lead?._id || id} roleSlug={roleSlug} />
        </div>
      </div>

      {/* Assign Modal */}
      <Modal
        open={assignModal}
        onCancel={() => setAssignModal(false)}
        title="Assign Lead to Advisor"
        footer={[
          <Button key="cancel" onClick={() => setAssignModal(false)}>Cancel</Button>,
          <Button key="assign" type="primary" loading={assignLoading} disabled={!selectedAdvisor} onClick={handleAssign} style={{ background: C.primary }}>
            Confirm Assignment
          </Button>
        ]}
        centered
      >
        <div style={{ background: C.greenSoft, border: `1px solid ${C.greenBord}`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <Clock size={14} color={C.green} /> SLA clock starts immediately — 4 hours to contact customer
        </div>
        <Select
          placeholder="Select Advisor"
          style={{ width: "100%" }}
          value={selectedAdvisor}
          onChange={setSelectedAdvisor}
          showSearch
          optionFilterProp="children"
        >
          {advisors.map(adv => (
            <Select.Option key={adv.id} value={adv.id}>
              {adv.fullName} ({adv.currentLeads}/{adv.maxLeadsCapacity} leads) {adv.canTakeMore ? "✅" : "⚠️ At capacity"}
            </Select.Option>
          ))}
        </Select>
      </Modal>

      {/* Notify Modal */}
      <Modal
        open={notifyModal}
        onCancel={() => setNotifyModal(false)}
        title="SLA Breach Notification"
        footer={[
          <Button key="cancel" onClick={() => setNotifyModal(false)}>Cancel</Button>,
          <Button key="notify" danger loading={notifyLoading} onClick={handleNotifyAdvisor} icon={<Bell size={14} />}>
            Send Reminder
          </Button>
        ]}
        centered
      >
        <div style={{ textAlign: "center", padding: 20 }}>
          <AlertTriangle size={48} color={C.red} style={{ marginBottom: 16 }} />
          <p>The advisor <strong>{at.advisorName}</strong> has not contacted this customer within the required <strong>4-hour SLA window</strong>.</p>
          <div style={{ background: C.redSoft, borderRadius: 10, padding: 12, marginTop: 16 }}>
            <span style={{ fontSize: 12, color: "#991B1B" }}>Sending a notification will remind the advisor to contact the customer immediately.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Row Component ──────────────────────────────────────────────────────────
function Row({ label, value, copy, highlight, badge, mono }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.grayLight}` }}>
      <span style={{ fontSize: 12, color: C.gray, fontWeight: 500 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {badge ? (
          <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>{value}</span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: highlight ? 700 : 500, color: highlight ? C.green : C.text, fontFamily: mono ? "'Courier New', monospace" : undefined }}>
            {value}
          </span>
        )}
        {copy && (
          <button onClick={() => { navigator.clipboard.writeText(String(value)); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: copied ? C.green : C.textMuted }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}