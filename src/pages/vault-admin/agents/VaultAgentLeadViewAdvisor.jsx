// src/pages/Leads/VaultAgentLeadDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Modal, Select, Button, Tag, message } from "antd";
import LinkedProposalsCases from "@/components/common/LinkedProposalsCases";
import {
  ChevronLeft, User, Mail, Phone, Home, DollarSign, FileText,
  Eye, AlertCircle, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Layers, Shield, Activity, Check, Copy, Info,
  MapPin, Calendar, FilePlus, ClipboardList,
  TrendingUp, Percent, MessageSquare, Clock,
  Calculator, Target, ShieldCheck, Edit2, Send
} from "lucide-react";
import { apiService } from "@/api/apiService";

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

// ─── PRD Section 4.3 - Lead Statuses ───────────────────────────────────────
const STATUS_CFG = {
  "New":                  { bg: "#EFF6FF", color: "#1D4ED8", border: "#93C5FD" },
  "Assigned":             { bg: C.primarySoft, color: C.primary, border: C.primaryBord },
  "Contacted":            { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  "Qualified":            { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  "Collecting Documents": { bg: "#FAF5FF", color: "#581C87", border: "#E9D5FF" },
  "Documents Complete":   { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
  "Bank Application":     { bg: "#EDE9FE", color: "#5B21B6", border: "#C7D2FE" },
  "Pre-Approved":         { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" },
  "Valuation":            { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  "FOL Processed":        { bg: "#E0E7FF", color: "#3730A3", border: "#C7D2FE" },
  "FOL Issued":           { bg: "#E0E7FF", color: "#3730A3", border: "#C7D2FE" },
  "FOL Signed":           { bg: "#F3E8FF", color: "#6B21A5", border: "#E9D5FF" },
  "Disbursed":            { bg: C.greenSoft, color: C.green, border: C.greenBord },
  "Lost":                 { bg: C.redSoft, color: C.red, border: C.redBord },
  "Not Proceeding":       { bg: "#F3F4F6", color: "#6B7280", border: "#D1D5DB" },
};

// PRD 6.1 — only these 4 statuses are manually settable by advisor/partner
// Bank stages (Bank Application → Disbursed) are auto-managed via case status
const MANUAL_STATUS_OPTIONS = [
  "Contacted",
  "Qualified",
  "Collecting Documents",
  "Documents Complete",
];

// ─── Helpers ───────────────────────────────────────────────────────────────
const show = (v) => (v !== null && v !== undefined && v !== "") ? v : null;
const fmt = (n) => n ? Number(n).toLocaleString("en-AE") : "—";
const fmtDate = (s) => { 
  try { 
    return s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null; 
  } catch { 
    return null; 
  } 
};
const fmtDT = (s) => { 
  try { 
    return s ? new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null; 
  } catch { 
    return null; 
  } 
};
const boolLabel = (v) => v === true ? "Yes" : v === false ? "No" : null;
const capWords = (s) => s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;

const roleSlugMap = {
  '0': 'superadmin', '1': 'admin', '18': "vault-admin",
  '22': "vaultagent", '21': "vaultpartner", '23': "vault-ops",
  '26': "vault-advisor", '25': "gridReferralPartner",
};

// ══════════════════════════════════════════════════════════════════════════
export default function VaultAgentLeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s?.auth || {});

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [flashMsg, setFlashMsg] = useState({ type: "", text: "" });
  
  // Status Update State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const roleCode = user?.role?.code;
  const roleSlug = roleSlugMap[roleCode] ?? "dashboard";

  const flash = (type, text) => {
    setFlashMsg({ type, text });
    setTimeout(() => setFlashMsg({ type: "", text: "" }), 4000);
  };

  // ── Fetch Lead ─────────────────────────────────────────────────────────
  const fetchLead = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiService.get(`/vault/lead/${id}`);
      const data = res?.data?.data || res?.data || null;
      if (data) {
        setLead(data);
        setSelectedStatus(data?.currentStatus || "");
      } else {
        setError("Lead data not found");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load lead");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (id) { 
      fetchLead(); 
    } 
  }, [id]);

  // ── Status Update ─────────────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      message.warning("Please select a status");
      return;
    }
    
    // Eligibility check for Qualified status
    if (selectedStatus === "Qualified") {
      const isEligibilityChecked = lead?.eligibility?.checked === true;
      const isEligible = lead?.eligibility?.isEligible === true;
      
      if (!isEligibilityChecked) {
        message.error("Cannot qualify: Eligibility check not performed. Please check eligibility first.");
        return;
      }
      if (!isEligible) {
        message.error("Cannot qualify: Customer is not eligible. Please review eligibility details.");
        return;
      }
    }
    
    try {
      setStatusUpdating(true);
      await apiService.put(`/vault/lead/advisorOrpartner/lead/${id}/status`, {
        status: selectedStatus,
        notes: statusNote.trim() || undefined,
      });
      
      flash("success", `Lead status updated to "${selectedStatus}"`);
      setStatusNote("");
      setStatusModalOpen(false);
      await fetchLead();
    } catch (err) {
      flash("error", err?.response?.data?.message || "Status update failed");
    } finally {
      setStatusUpdating(false);
    }
  };

  const goToEditEligibility = () => {
    navigate(`/dashboard/${roleSlug}/vault/lead/${id}/eligibility`);
  };

  // ── Loading / Error ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.primarySoft, border: `2px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={24} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
      </div>
      <p style={{ color: C.primary, fontSize: 15, fontWeight: 600 }}>Loading lead details...</p>
    </div>
  );

  if (error || !lead) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: C.redSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <AlertCircle size={28} color={C.red} />
      </div>
      <p style={{ color: "#B91C1C", marginBottom: 20, fontSize: 15, fontWeight: 600 }}>{error || "Lead not found"}</p>
      <button onClick={() => navigate(-1)} style={{ padding: "10px 24px", background: C.primary, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        <ChevronLeft size={16} /> Go Back
      </button>
    </div>
  );

  // ── Destructure API response ───────────────────────────────────────────
  const ci = lead?.customerInfo || {};
  const pd = lead?.propertyDetails || {};
  const pa = pd?.propertyAddress || {};
  const si = lead?.sourceInfo || {};
  const at = lead?.assignedTo || {};
  const sla = lead?.sla || {};
  const lr = lead?.loanRequirements || {};
  const dup = lead?.duplicateCheck || {};
  const elig = lead?.eligibility || {};
  const cv = lead?.conversionInfo || {};

  const currentStatus = lead?.currentStatus || "New";
  const statusCfg = STATUS_CFG[currentStatus] || STATUS_CFG["New"];
  const propertyAddr = [pa?.building, pa?.area, pa?.city].filter(Boolean).join(", ");
  const isSlaBreached = sla?.breached === true;
  const slaDeadline = sla?.deadline;
  const customerAge = lead?.customerAge || null;

  // PRD 6.1 — only the 4 manual statuses, excluding the current one
  // Lead is locked once a case is created (bank stages auto-managed)
  const isLeadLocked = cv?.convertedToApplication === true;

  const getAvailableStatuses = () => {
    if (isLeadLocked) return [];
    return MANUAL_STATUS_OPTIONS.filter(s => s !== currentStatus);
  };

  // Show eligibility recommendation after check passes
  const showEligibleRecommendation =
    elig?.checked && elig?.isEligible &&
    !['Qualified', 'Collecting Documents', 'Documents Complete'].includes(currentStatus) &&
    !isLeadLocked;

  const TABS = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "eligibility", label: "Eligibility", icon: ShieldCheck },
    { id: "property", label: "Property", icon: Home },
    { id: "system", label: "System", icon: Shield },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .spin { animation: spin 1s linear infinite; }
        .pd-tab:hover { background: ${C.primaryGlow} !important; color: ${C.primary} !important; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20, padding: "8px 16px", background: C.white, border: `1px solid ${C.grayBord}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.textSub, cursor: "pointer", transition: "0.2s" }}
        >
          <ChevronLeft size={15} /> Back to Leads
        </button>

        {/* Flash Message */}
        {flashMsg.text && (
          <div style={{ marginBottom: 16, padding: "12px 18px", borderRadius: 12, fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: flashMsg.type === "success" ? C.greenSoft : C.redSoft, color: flashMsg.type === "success" ? "#065F46" : "#991B1B", border: `1px solid ${flashMsg.type === "success" ? C.greenBord : C.redBord}`, fontWeight: 500 }}>
            {flashMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {flashMsg.text}
          </div>
        )}

        {/* SLA Breach banner */}
        {isSlaBreached && (
          <div style={{ marginBottom: 14, padding: "12px 18px", borderRadius: 12, fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: C.redSoft, color: "#991B1B", border: `1px solid ${C.redBord}`, fontWeight: 600 }}>
            <AlertTriangle size={16} /> SLA Breached — Response time exceeded 4 hours
          </div>
        )}

        {/* Profile Header */}
        <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.grayBord}`, marginBottom: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(92,3,155,0.06)" }}>
          <div style={{ height: 6, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid}, ${C.primaryLight})` }} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 24, padding: "28px", flexWrap: "wrap" }}>
            <div style={{ width: 84, height: 84, borderRadius: 22, background: C.primarySoft, border: `2px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User size={36} color={C.primary} />
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>{ci?.fullName || "—"}</h1>
                <StatusPill bg={statusCfg.bg} color={statusCfg.color} label={currentStatus} dot />
                {elig?.checked && (
                  <StatusPill 
                    bg={elig.isEligible ? C.greenSoft : C.redSoft} 
                    color={elig.isEligible ? "#065F46" : "#991B1B"} 
                    label={elig.isEligible ? "Eligible ✓" : "Not Eligible ✗"} 
                  />
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
                <InfoChip icon={Mail} value={ci?.email} />
                <InfoChip icon={Phone} value={ci?.mobileNumber} />
                <InfoChip icon={MapPin} value={propertyAddr || null} />
                <InfoChip icon={DollarSign} value={pd?.loanAmountRequired ? `Loan: AED ${fmt(pd.loanAmountRequired)}` : null} />
                <InfoChip icon={Calendar} value={lead?.createdAt ? `Created ${fmtDate(lead.createdAt)}` : null} />
              </div>
            </div>

            <div style={{ flexShrink: 0, textAlign: "right", minWidth: 180, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {isLeadLocked ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#F3F4F6", color: "#6B7280", border: "1px solid #D1D5DB", borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
                    <Shield size={15} /> Status Locked — Case Created
                  </div>
                ) : (
                  <button
                    onClick={() => setStatusModalOpen(true)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMid})`, color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    <Edit2 size={15} /> Update Status
                  </button>
                )}
                <button
                  onClick={goToEditEligibility}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: C.white, color: C.primary, border: `2px solid ${C.primaryBord}`, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  <Calculator size={15} /> Check Eligibility
                </button>
              </div>

              {/* Eligibility recommendation banner */}
              {showEligibleRecommendation && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, fontSize: 12, color: "#15803D", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={14} /> Customer is eligible — update status to <strong>Qualified</strong> to proceed
                </div>
              )}
              {at?.advisorName ? (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700 }}>Assigned To</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{at.advisorName}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Since {fmtDate(at.assignedAt)}</div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: C.amber, background: C.amberSoft, padding: "6px 12px", borderRadius: 10 }}>⚠ No Advisor Assigned</div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          <StatTile icon={DollarSign} color={C.primary} label="Loan Amount" value={pd?.loanAmountRequired ? `AED ${fmt(pd.loanAmountRequired)}` : "—"} />
          <StatTile icon={TrendingUp} color={C.green} label="Property Value" value={pd?.propertyValue ? `AED ${fmt(pd.propertyValue)}` : "—"} />
          <StatTile icon={Percent} color={C.amber} label="LTV" value={pd?.propertyValue ? `${Math.round((pd.loanAmountRequired / pd.propertyValue) * 100)}%` : "—"} />
          <StatTile icon={Clock} color={isSlaBreached ? C.red : C.green} label="SLA" value={isSlaBreached ? "Breached" : slaDeadline ? "Active" : "Not Started"} />
        </div>

        {/* Tabs */}
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.grayBord}`, padding: "6px", display: "flex", gap: 4, marginBottom: 20, overflowX: "auto" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className="pd-tab"
                onClick={() => setActiveTab(tab.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, border: "none", background: active ? C.primarySoft : "transparent", color: active ? C.primary : C.gray, fontWeight: active ? 700 : 600, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div key={activeTab} style={{ animation: "fadeUp 0.3s ease" }}>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
              <Section icon={User} title="Customer Information">
                <DRow label="Full Name" value={show(ci?.fullName)} />
                <DRow label="Email" value={show(ci?.email)} copy />
                <DRow label="Mobile" value={show(ci?.mobileNumber)} copy />
                <DRow label="Nationality" value={show(ci?.nationality)} />
                <DRow label="Residency" value={show(ci?.residencyStatus)} />
                <DRow label="Employment" value={show(ci?.employmentStatus)} />
                <DRow label="Monthly Salary" value={ci?.monthlySalary ? `AED ${fmt(ci.monthlySalary)}` : null} />
                <DRow label="Existing Liabilities" value={ci?.existingMonthlyLiabilities ? `AED ${fmt(ci.existingMonthlyLiabilities)}` : null} />
                <DRow label="Date of Birth" value={fmtDate(ci?.dateOfBirth)} />
                <DRow label="Age" value={customerAge ? `${customerAge} years` : null} />
                <DRow label="Occupation" value={show(ci?.occupation)} />
                <DRow label="Employer" value={show(ci?.employer)} />
              </Section>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Section icon={FilePlus} title="Lead Source">
                  <DRow label="Source" value={show(capWords(si?.source))} />
                  <DRow label="Created By" value={si?.createdByName || "—"} />
                  <DRow label="Submitted At" value={fmtDT(si?.createdAt)} />
                </Section>
                <Section icon={User} title="Assigned Advisor">
                  {at?.advisorName ? (
                    <>
                      <DRow label="Advisor Name" value={at.advisorName} />
                      <DRow label="Assigned At" value={fmtDT(at.assignedAt)} />
                      <DRow label="SLA Deadline" value={fmtDT(sla?.deadline)} />
                      <DRow label="First Contact" value={fmtDT(sla?.firstContactAt)} />
                    </>
                  ) : <EmptyNote msg="No advisor assigned yet" />}
                </Section>
                <Section icon={Target} title="Conversion Status">
                  <DRow label="Converted to Application" value={boolLabel(cv?.convertedToApplication)} />
                  <DRow label="Application ID" value={show(cv?.applicationId)} />
                </Section>
              </div>

              {lead?.notesToXoto && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <Section icon={MessageSquare} title="Notes to Xoto">
                    <div style={{ background: C.primarySoft, borderRadius: 12, padding: "16px", border: `1px solid ${C.primaryBord}`, fontSize: 14, color: C.primary, fontWeight: 500 }}>
                      {lead.notesToXoto}
                    </div>
                  </Section>
                </div>
              )}
            </div>
          )}

          {/* Eligibility Tab */}
          {activeTab === "eligibility" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {elig?.checked ? (
                <>
                  <div style={{ background: elig.isEligible ? C.greenSoft : C.redSoft, border: `2px solid ${elig.isEligible ? C.greenBord : C.redBord}`, borderRadius: 20, padding: 28, display: 'flex', alignItems: 'center', gap: 20, flexWrap: "wrap" }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: elig.isEligible ? C.white : C.redSoft, border: `2px solid ${elig.isEligible ? C.greenBord : C.redBord}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {elig.isEligible ? <CheckCircle size={32} color={C.green} /> : <XCircle size={32} color={C.red} />}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: elig.isEligible ? '#065F46' : '#991B1B' }}>
                        {elig.isEligible ? "Customer is Eligible ✓" : "Customer is Not Eligible ✗"}
                      </h3>
                      <p style={{ margin: '8px 0 0 0', color: elig.isEligible ? '#047857' : '#B91C1C', fontSize: 14, fontWeight: 500 }}>
                        {elig.eligibilityNotes || "The automated eligibility check has been completed."}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
                    <Section icon={Activity} title="Eligibility Metrics">
                      <DRow label="Eligibility Score" value={elig.eligibilityScore !== null ? `${elig.eligibilityScore}/100` : "—"} />
                      <DRow label="Risk Grade" value={show(elig.riskGrade)} />
                      <DRow label="DBR Percentage" value={elig.dbrPercentage !== null ? `${elig.dbrPercentage}%` : "—"} />
                      <DRow label="DBR Status" value={show(elig.dbrStatus)} />
                      <DRow label="Estimated LTV" value={elig.estimatedLTV !== null ? `${elig.estimatedLTV}%` : "—"} />
                      <DRow label="Recommended Loan" value={elig.recommendedLoanAmount ? `AED ${fmt(elig.recommendedLoanAmount)}` : null} />
                    </Section>

                    <Section icon={Clock} title="Eligibility Details">
                      <DRow label="Checked At" value={fmtDT(elig.checkedAt)} />
                      <DRow label="Checked By" value={show(elig.checkedBy?._id || elig.checkedBy)} />
                    </Section>
                  </div>
                </>
              ) : (
                <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.grayBord}`, padding: 40, textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: C.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <ShieldCheck size={32} color={C.amber} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>Eligibility Not Checked</h3>
                  <p style={{ color: C.gray, fontSize: 14, marginBottom: 24 }}>Run the eligibility test to determine if customer qualifies.</p>
                  <button onClick={goToEditEligibility} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMid})`, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>
                    <Calculator size={16} /> Run Eligibility Check
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Property Tab */}
          {activeTab === "property" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
              <Section icon={Home} title="Property Details">
                <DRow label="Transaction Type" value={show(pd?.transactionType)} />
                <DRow label="Property Found" value={boolLabel(pd?.propertyFound)} />
                <DRow label="Approx Value" value={pd?.approxPropertyValue} />
                <DRow label="Property Value" value={pd?.propertyValue ? `AED ${fmt(pd.propertyValue)}` : null} />
                <DRow label="Down Payment" value={pd?.downPaymentAmount ? `AED ${fmt(pd.downPaymentAmount)}` : null} />
                <DRow label="Loan Amount" value={pd?.loanAmountRequired ? `AED ${fmt(pd.loanAmountRequired)}` : null} />
                <DRow label="Area" value={pa?.area} />
                <DRow label="City" value={pa?.city} />
                <DRow label="Off-Plan" value={boolLabel(pd?.isOffPlan)} />
              </Section>
              <Section icon={Target} title="Loan Requirements">
                <DRow label="Timeline" value={show(lr?.timeline)} />
                <DRow label="Preferred Tenure" value={lr?.preferredTenureYears ? `${lr.preferredTenureYears} years` : null} />
                <DRow label="Rate Type" value={show(lr?.preferredInterestRateType)} />
                <DRow label="Fee Financing" value={boolLabel(lr?.feeFinancingPreference)} />
                <DRow label="Life Insurance" value={boolLabel(lr?.lifeInsurancePreference)} />
                <DRow label="Property Insurance" value={boolLabel(lr?.propertyInsurancePreference)} />
                {lr?.specialRequirements && <DRow label="Special Requirements" value={show(lr?.specialRequirements)} />}
              </Section>
            </div>
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
              <Section icon={Shield} title="System Information">
                <DRow label="Lead ID" value={show(lead?._id)} copy mono />
                <DRow label="Customer ID" value={show(lead?.customerId)} copy />
                <DRow label="Created At" value={fmtDT(lead?.createdAt)} />
                <DRow label="Updated At" value={fmtDT(lead?.updatedAt)} />
                <DRow label="Version" value={lead?.__v !== undefined ? `v${lead.__v}` : null} />
              </Section>
              <Section icon={Activity} title="Flags & Duplicate Check">
                <FlagRow label="Advisor Assigned" value={!!(at?.advisorId)} icon={User} />
                <FlagRow label="SLA On Track" value={!sla?.breached} icon={Clock} />
                <FlagRow label="Converted to Application" value={cv?.convertedToApplication} icon={Target} />
                <FlagRow label="Is Duplicate" value={dup?.isDuplicate} icon={Activity} invert />
                <FlagRow label="Is Deleted" value={lead?.isDeleted} icon={AlertCircle} invert />
              </Section>
            </div>
          )}
          {/* Linked Proposals & Cases */}
          <LinkedProposalsCases leadId={lead?._id || id} roleSlug={roleSlug} />
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Edit2 size={20} color={C.primary} />
            <span style={{ fontWeight: 700, fontSize: 18 }}>Update Lead Status</span>
          </div>
        }
        open={statusModalOpen}
        onCancel={() => { setStatusModalOpen(false); setStatusNote(""); }}
        footer={[
          <Button key="cancel" onClick={() => { setStatusModalOpen(false); setStatusNote(""); }}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={statusUpdating} 
            onClick={handleStatusUpdate}
            style={{ background: C.primary, borderColor: C.primary }}
            icon={<Send size={14} />}
          >
            Update Status
          </Button>
        ]}
        width={500}
        centered
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 8, fontWeight: 600, color: C.textSub }}>Current Status</div>
          <div>
            <StatusPill bg={statusCfg.bg} color={statusCfg.color} label={currentStatus} dot />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 8, fontWeight: 600, color: C.textSub }}>New Status *</div>
          <Select
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: "100%" }}
            size="large"
            placeholder="Select new status"
          >
            {getAvailableStatuses().map(status => {
              const cfg = STATUS_CFG[status] || { color: C.gray };
              return (
                <Select.Option key={status} value={status}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
                    {status}
                  </div>
                </Select.Option>
              );
            })}
          </Select>
        </div>

        <div>
          <div style={{ marginBottom: 8, fontWeight: 600, color: C.textSub }}>Notes (Optional)</div>
          <textarea
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            rows={4}
            placeholder="Add notes about this status change..."
            style={{ width: "100%", border: `1px solid ${C.grayBord}`, borderRadius: 12, padding: "12px", fontSize: 14, outline: "none", resize: "vertical" }}
          />
        </div>

        {selectedStatus === "Qualified" && (
          <div style={{ marginTop: 16, padding: 12, background: C.blueSoft, borderRadius: 10, fontSize: 12 }}>
            <Info size={14} style={{ display: "inline", marginRight: 6 }} />
            Customer will be marked as Qualified. Make sure eligibility check is completed.
          </div>
        )}

        {selectedStatus === "Lost" && (
          <div style={{ marginTop: 16, padding: 12, background: C.redSoft, borderRadius: 10, fontSize: 12 }}>
            <AlertCircle size={14} style={{ display: "inline", marginRight: 6 }} />
            Marking as Lost will close this lead. This action cannot be undone.
          </div>
        )}
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── Shared Sub-components ────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

function Section({ icon: Icon, title, children }) {
  return (
    <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.grayBord}`, overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.primarySoft, border: `1px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={C.primary} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{title}</span>
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </div>
  );
}

function DRow({ label, value, copy, mono }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px dashed ${C.grayBord}` }}>
      <span style={{ fontSize: 13, color: C.gray, fontWeight: 600 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 14, color: C.text, fontWeight: 500, fontFamily: mono ? "monospace" : "inherit", textAlign: "right" }}>{value}</span>
        {copy && (
          <button onClick={() => { navigator.clipboard.writeText(String(value)); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: copied ? C.green : C.textMuted }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, color }) {
  return (
    <div style={{ background: C.white, borderRadius: 16, padding: "16px 20px", border: `1px solid ${C.grayBord}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontSize: 11, color: C.gray, fontWeight: 700, textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{value}</div>
    </div>
  );
}

function StatusPill({ bg, color, label, dot }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 800, background: bg, color, border: `1px solid ${color}30` }}>
      {dot && <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />}
      {label}
    </span>
  );
}

function InfoChip({ icon: Icon, value }) {
  return value ? (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.textSub }}>
      <Icon size={14} color={C.primaryLight} /> {value}
    </div>
  ) : null;
}

function EmptyNote({ msg }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textMuted, fontSize: 14, padding: "16px 0" }}><Info size={16} /> {msg}</div>;
}

function FlagRow({ label, value, icon: Icon, invert = false }) {
  const good = invert ? !value : value;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px dashed ${C.grayBord}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.textSub }}><Icon size={16} color={C.gray} /> {label}</div>
      <div style={{ padding: "4px 12px", borderRadius: 20, background: good ? C.greenSoft : C.redSoft }}>
        {good ? <CheckCircle size={14} color={C.green} /> : <XCircle size={14} color={C.red} />}
        <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700, color: good ? C.green : C.red }}>{value ? "Yes" : "No"}</span>
      </div>
    </div>
  );
}