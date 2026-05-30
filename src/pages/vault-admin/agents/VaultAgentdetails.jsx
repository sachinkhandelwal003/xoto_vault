// src/components/Vault/AgentDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, User, Mail, Phone, Globe, Calendar,
  CreditCard, FileText, Banknote, ShieldCheck,
  AlertCircle, Building2, CheckCircle, XCircle,
  DollarSign, Percent, Info, AlertTriangle,
  BadgeCheck, Activity, TrendingUp, RefreshCw,
  Shield, Layers, BarChart2, Check, Copy, ExternalLink,
  Tag, Hash,
} from "lucide-react";
import { apiService } from "@/api/apiService";
import { Tabs } from "antd";

// ─── Design Tokens (same as PartnerDetail) ────────────────────────────────
const C = {
  primary     : "#5C039B",
  primaryMid  : "#7C3AED",
  primaryLight: "#9333EA",
  primaryGlow : "rgba(92,3,155,0.12)",
  primarySoft : "#F5F0FF",
  primaryBord : "#E9D5FF",
  green       : "#10B981",
  greenSoft   : "#ECFDF5",
  greenBord   : "#A7F3D0",
  red         : "#EF4444",
  redSoft     : "#FEF2F2",
  amber       : "#F59E0B",
  amberSoft   : "#FFFBEB",
  blue        : "#3B82F6",
  blueSoft    : "#EFF6FF",
  gray        : "#6B7280",
  grayLight   : "#F9FAFB",
  grayBord    : "#E5E7EB",
  text        : "#111827",
  textSub     : "#374151",
  textMuted   : "#9CA3AF",
  white       : "#FFFFFF",
  bg          : "#F4F0FA",
};

// ─── Helpers ──────────────────────────────────────────────────────────────
const show    = (v) => (v !== null && v !== undefined && v !== "") ? v : null;
const fmtDate = (s) => { try { return s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null; } catch { return null; } };
const fmtAED  = (n) => n !== undefined && n !== null ? `AED ${Number(n).toLocaleString()}` : null;
const boolLabel = (v) => v === true ? "Yes" : v === false ? "No" : null;

// ══════════════════════════════════════════════════════════════════════════
export default function VaultAgentdetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [agent, setAgent]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Account verify/reject modal
  const [showVerifyModal, setShowVerifyModal]   = useState(false);
  const [rejectMode, setRejectMode]             = useState(false);
  const [rejectionReason, setRejectionReason]   = useState("");
  const [actionLoading, setActionLoading]       = useState(false);
  const [verifyMessage, setVerifyMessage]       = useState({ type: "", text: "" });

  // Document verify
  const [docActionLoading, setDocActionLoading] = useState(null);
  // Commission eligible confirm
  const [commLoading, setCommLoading]           = useState(false);

  const handleConfirmCommission = async () => {
    setCommLoading(true);
    try {
      await apiService.patch(`/vault/agent/admin/confirm-commission/${id}`);
      setVerifyMessage({ type: "success", text: "Agent is now commission eligible!" });
      await fetchAgent();
    } catch (err) {
      setVerifyMessage({ type: "error", text: err?.response?.data?.message || err?.message || "Failed to confirm commission eligibility" });
    } finally {
      setCommLoading(false);
      setTimeout(() => setVerifyMessage({ type: "", text: "" }), 5000);
    }
  };

  const handleDocVerify = async (docType, action) => {
    const key = `${docType}_${action}`;
    setDocActionLoading(key);
    try {
      await apiService.patch(`/vault/agent/admin/verify-document/${id}`, { documentType: docType, action });
      setVerifyMessage({ type: "success", text: `${docType} ${action === "verify" ? "verified" : "rejected"} successfully.` });
      await fetchAgent();
    } catch (err) {
      setVerifyMessage({ type: "error", text: err?.response?.data?.message || err?.message || "Action failed" });
    } finally {
      setDocActionLoading(null);
      setTimeout(() => setVerifyMessage({ type: "", text: "" }), 4000);
    }
  };

  const fetchAgent = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(`/vault/agent/get/${id}`);
      const data = response?.data || response;
      setAgent(data?.data || data);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to load agent details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgent(); }, [id]);

  const handleOpenVerifyModal = () => {
    if (agent?.isVerified) {
      setVerifyMessage({ type: "info", text: "Agent is already verified." });
      setTimeout(() => setVerifyMessage({ type: "", text: "" }), 3000);
      return;
    }
    setRejectMode(false);
    setRejectionReason("");
    setShowVerifyModal(true);
  };

  const handleVerify = async () => {
    setActionLoading(true);
    try {
      await apiService.post(`/vault/agent/admin/verify/${id}`, { action: "verify" });
      setVerifyMessage({ type: "success", text: "Agent successfully verified!" });
      await fetchAgent();
      setShowVerifyModal(false);
    } catch (err) {
      setVerifyMessage({ type: "error", text: err?.response?.data?.message || err?.message || "Verification failed" });
    } finally {
      setActionLoading(false);
      setTimeout(() => setVerifyMessage({ type: "", text: "" }), 5000);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setVerifyMessage({ type: "error", text: "Please provide a rejection reason." });
      setTimeout(() => setVerifyMessage({ type: "", text: "" }), 3000);
      return;
    }
    setActionLoading(true);
    try {
      await apiService.post(`/vault/agent/admin/verify/${id}`, {
        action: "reject",
        rejectionReason: rejectionReason.trim(),
      });
      setVerifyMessage({ type: "success", text: "Agent rejected successfully." });
      await fetchAgent();
      setShowVerifyModal(false);
      setRejectionReason("");
    } catch (err) {
      setVerifyMessage({ type: "error", text: err?.response?.data?.message || err?.message || "Rejection failed" });
    } finally {
      setActionLoading(false);
      setTimeout(() => setVerifyMessage({ type: "", text: "" }), 5000);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.primarySoft, border: `2px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={24} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
      </div>
      <p style={{ color: C.gray, fontSize: 14, fontWeight: 500 }}>Loading agent details...</p>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────
  if (error || !agent) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: C.redSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <AlertCircle size={28} color={C.red} />
      </div>
      <p style={{ color: "#B91C1C", marginBottom: 20, fontSize: 15, fontWeight: 600 }}>{error || "Agent not found"}</p>
      <button onClick={() => navigate(-1)} style={{ padding: "10px 24px", background: C.primary, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        <ChevronLeft size={16} /> Go Back
      </button>
    </div>
  );

  // ── Derived values ───────────────────────────────────────────────────
  const firstName = agent.name?.first_name || agent.first_name  || agent.firstName  || "";
  const lastName  = agent.name?.last_name  || agent.last_name   || agent.lastName   || "";
  const fullName  = `${firstName} ${lastName}`.trim();
  const isActive  = agent.isActive === true || agent.status === "active";
  const phoneCode = agent.phone?.country_code || agent.country_code || agent.countryCode || "";
  const phoneNum  = agent.phone?.number       || agent.phone_number || agent.phoneNumber  || "";
  const phoneStr  = phoneCode && phoneNum ? `${phoneCode} ${phoneNum}` : phoneNum || null;

  const verificationStatus = agent.isVerified ? "verified" : agent.rejectionReason ? "rejected" : "pending";
  const vsMap = {
    verified: { bg: C.greenSoft, color: C.green,   icon: BadgeCheck,     label: "Verified"             },
    rejected: { bg: C.redSoft,   color: C.red,     icon: XCircle,        label: "Rejected"             },
    pending:  { bg: C.amberSoft, color: C.amber,   icon: AlertTriangle,  label: "Pending Verification" },
  };
  const vs = vsMap[verificationStatus];

  // ── Tabs ─────────────────────────────────────────────────────────────
  const TABS = [
    { id: "overview",     label: "Overview",     icon: Layers       },
    { id: "documents",    label: "Documents",    icon: FileText     },
    { id: "financial",    label: "Financial",    icon: BarChart2    },
    { id: "affiliation",  label: "Affiliation",  icon: Building2    },
    { id: "system",       label: "System",       icon: Shield       },
  ];

  const bk = agent.bankDetails || {};
  const ag = agent.earnings    || {};
  const fc = agent.freelanceCommission || null;

  // ════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .pd-tab  { transition: all .2s; cursor: pointer; }
        .pd-tab:hover { background: ${C.primaryGlow} !important; color: ${C.primary} !important; }
        .pd-row:last-child { border-bottom: none !important; }
        .pd-copy:hover { color: ${C.primary} !important; background: ${C.primarySoft} !important; }
        .pd-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(92,3,155,0.1) !important; }
        .custom-agent-tabs .ant-tabs-nav {
          margin-bottom: 16px !important;
        }
        .custom-agent-tabs .ant-tabs-tab {
          background: transparent !important;
          border: 1px solid #E5E7EB !important;
          border-bottom: none !important;
          border-radius: 8px 8px 0 0 !important;
          margin-right: 4px !important;
          padding: 8px 16px !important;
          transition: all 0.2s !important;
        }
        .custom-agent-tabs .ant-tabs-tab-btn {
          color: #6B7280 !important;
          font-size: 13px !important;
          font-weight: 500 !important;
        }
        .custom-agent-tabs .ant-tabs-tab-active {
          background: #FFFFFF !important;
          border-color: #E5E7EB !important;
          border-bottom-color: #FFFFFF !important;
        }
        .custom-agent-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #5C039B !important;
          font-weight: 700 !important;
        }
        .custom-agent-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn {
          color: #7C3AED !important;
        }
        .custom-agent-tabs .ant-tabs-nav-operations {
          display: none !important;
        }
        @media(max-width:768px) { .pd-grid-2 { grid-template-columns: 1fr !important; } .pd-header-inner { flex-direction: column !important; } .pd-stats { grid-template-columns: 1fr 1fr !important; } }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        {/* ── Back Button ── */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20, padding: "8px 16px", background: C.white, border: `1px solid ${C.grayBord}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.textSub, cursor: "pointer", transition: "all .2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primaryBord; e.currentTarget.style.color = C.primary; e.currentTarget.style.background = C.primarySoft; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.grayBord;    e.currentTarget.style.color = C.textSub;  e.currentTarget.style.background = C.white; }}
        >
          <ChevronLeft size={15} /> Back to Agents
        </button>

        {/* ── Flash Message ── */}
        {verifyMessage.text && (
          <div style={{
            marginBottom: 16, padding: "10px 16px", borderRadius: 10,
            background: verifyMessage.type === "success" ? C.greenSoft : verifyMessage.type === "error" ? C.redSoft : C.blueSoft,
            color: verifyMessage.type === "success" ? "#065F46" : verifyMessage.type === "error" ? "#991B1B" : "#1E40AF",
            fontSize: 13, display: "flex", alignItems: "center", gap: 8,
            border: `1px solid ${verifyMessage.type === "success" ? C.greenBord : verifyMessage.type === "error" ? "#FECACA" : "#BFDBFE"}`,
          }}>
            {verifyMessage.type === "success" ? <CheckCircle size={15} /> : verifyMessage.type === "error" ? <AlertCircle size={15} /> : <Info size={15} />}
            {verifyMessage.text}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PROFILE HEADER CARD
        ════════════════════════════════════════════════════════════ */}
        <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.grayBord}`, marginBottom: 16, overflow: "hidden", boxShadow: "0 2px 16px rgba(92,3,155,0.06)", animation: "fadeUp .4s ease" }}>
          {/* Purple accent bar */}
          <div style={{ height: 5, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid}, ${C.primaryLight})` }} />

          <div className="pd-header-inner" style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "24px 28px 20px" }}>
            {/* Avatar */}
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: C.primarySoft, border: `2px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {agent.profilePic
                ? <img src={agent.profilePic} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <User size={32} color={C.primary} />}
            </div>

            {/* Main info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-.4px" }}>
                  {fullName || "—"}
                </h1>
                {agent.agentType && (
                  <StatusPill bg={C.primarySoft} color={C.primary} label={agent.agentType.replace(/([A-Z])/g, ' $1').trim()} />
                )}
                <StatusPill
                  bg={isActive ? C.greenSoft : C.redSoft}
                  color={isActive ? C.green : C.red}
                  icon={isActive ? CheckCircle : XCircle}
                  label={isActive ? "Active" : "Inactive"}
                />
                <StatusPill bg={vs.bg} color={vs.color} icon={vs.icon} label={vs.label} />
              </div>

              {/* Contact chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
                <InfoChip icon={Mail}     value={agent.email} />
                <InfoChip icon={Phone}    value={phoneStr} />
                <InfoChip icon={Globe}    value={agent.nationality} />
                <InfoChip icon={Calendar} value={agent.dateOfBirth ? `DOB: ${fmtDate(agent.dateOfBirth)}` : null} />
               
              </div>
            </div>

            {/* Actions column */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
              {/* Verify / Verified button */}
              {!agent.isVerified ? (
                <button
                  onClick={handleOpenVerifyModal}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: C.primary, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  <ShieldCheck size={15} /> Verify Agent
                </button>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: C.greenSoft, color: C.green, borderRadius: 10, fontSize: 13, fontWeight: 600, border: `1px solid ${C.greenBord}` }}>
                  <CheckCircle size={14} /> Verified
                </span>
              )}

              {/* Confirm Commission Eligible button — only for ReferralPartner when all docs verified */}
              {agent.agentType === "ReferralPartner" && (
                agent.commissionEligible ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: C.greenSoft, color: C.green, borderRadius: 10, fontSize: 13, fontWeight: 600, border: `1px solid ${C.greenBord}` }}>
                    <CheckCircle size={14} /> Commission Eligible
                  </span>
                ) : (
                  <button
                    onClick={handleConfirmCommission}
                    disabled={commLoading || !agent.isVerified || !agent.emiratesId?.verified || !agent.bankDetails?.verified}
                    title={
                      !agent.isVerified ? "Account must be verified first" :
                      !agent.emiratesId?.verified ? "Emirates ID must be verified first" :
                      !agent.bankDetails?.verified ? "Bank details must be verified first" :
                      "Confirm commission eligibility"
                    }
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "9px 18px", borderRadius: 10, border: "none",
                      fontSize: 13, fontWeight: 600,
                      background: (agent.isVerified && agent.emiratesId?.verified && agent.bankDetails?.verified)
                        ? "#F59E0B" : C.grayBord,
                      color: (agent.isVerified && agent.emiratesId?.verified && agent.bankDetails?.verified)
                        ? "#fff" : C.textMuted,
                      cursor: (!agent.isVerified || !agent.emiratesId?.verified || !agent.bankDetails?.verified) ? "not-allowed" : "pointer",
                      opacity: commLoading ? 0.7 : 1,
                    }}
                  >
                    {commLoading
                      ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                      : <CheckCircle size={14} />}
                    Confirm Commission
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            STATS ROW
        ════════════════════════════════════════════════════════════ */}
        <div className="pd-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          <StatTile icon={TrendingUp}  color={C.primary}  label="Commission Earned"  value={fmtAED(ag.totalCommissionEarned) || "AED 0"} />
          <StatTile icon={Activity}    color="#0891B2"    label="Leads Submitted"    value={ag.totalLeadsSubmitted ?? 0} />
          <StatTile icon={CheckCircle} color={C.green}    label="Disbursals"         value={ag.successfulDisbursals ?? 0} />
          <StatTile icon={Percent}     color={C.amber}    label="Conversion Rate"    value={`${ag.conversionRate ?? 0}%`} />
        </div>

        {/* ════════════════════════════════════════════════════════════
            TABS
        ════════════════════════════════════════════════════════════ */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          className="custom-agent-tabs"
          items={TABS.map((tab) => {
            const Icon = tab.icon;
            return {
              label: (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon size={14} /> {tab.label}
                </span>
              ),
              key: tab.id,
            };
          })}
        />

        {/* ════════════════════════════════════════════════════════════
            TAB CONTENT
        ════════════════════════════════════════════════════════════ */}
        <div style={{ animation: "fadeUp .3s ease" }} key={activeTab}>

          {/* ── OVERVIEW ─────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Personal Info */}
              <Section icon={User} title="Personal Information">
                <DRow label="First Name"         value={show(firstName)} />
                <DRow label="Last Name"          value={show(lastName)} />
                <DRow label="Email"              value={show(agent.email)} copy />
                <DRow label="Phone"              value={show(phoneStr)} copy />
                <DRow label="Gender"             value={show(agent.gender)} />
                <DRow label="Date of Birth"      value={fmtDate(agent.dateOfBirth)} />
                <DRow label="Nationality"        value={show(agent.nationality)} />
                <DRow label="Profile Completion" value={`${agent.profileCompletionPercentage ?? 0}%`} highlight={agent.profileCompletionPercentage === 100} />
              </Section>

              {/* Agent Type & Status */}
              <Section icon={Building2} title="Agent & Affiliation">
                <DRow label="Agent Type"
                  value={agent.agentType === "ReferralPartner" ? "Referral Partner" : agent.agentType === "PartnerAffiliatedAgent" ? "Partner Affiliated Agent" : show(agent.agentType)}
                />
                <DRow label="Affiliation Status"
                  value={agent.affiliationStatus === "none" ? "N/A" : show(agent.affiliationStatus)}
                  badge={
                    agent.affiliationStatus === "verified" ? { bg: C.greenSoft, color: C.green } :
                    agent.affiliationStatus === "pending"  ? { bg: C.amberSoft, color: C.amber } :
                    agent.affiliationStatus === "rejected" ? { bg: C.redSoft,   color: C.red   } : undefined
                  }
                />
                <DRow label="Partner"            value={show(agent.partnerId?.companyName)} />
                <DRow label="Account Verified"   value={boolLabel(agent.isVerified)}  highlight={agent.isVerified} />
                <DRow label="Commission Eligible" value={boolLabel(agent.commissionEligible)} highlight={agent.commissionEligible} />
                {agent.commissionEligibilityReason && (
                  <DRow label="Eligibility Note" value={show(agent.commissionEligibilityReason)} />
                )}
                <DRow label="Account Active"     value={boolLabel(agent.isActive)} highlight={agent.isActive} />
                <DRow label="Last Login"         value={agent.lastLoginAt ? new Date(agent.lastLoginAt).toLocaleString() : null} />
              </Section>

              {/* Verification flags — full width */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Section icon={ShieldCheck} title="Verification Flags">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                    {[
                      { label: "Account Verified",    val: agent.isVerified },
                      { label: "Email Verified",      val: agent.isEmailVerified },
                      { label: "Phone Verified",      val: agent.isPhoneVerified },
                      { label: "Emirates ID Verified", val: agent.emiratesId?.verified },
                      { label: "Passport Verified",   val: agent.passport?.verified },
                      { label: "Bank Verified",       val: agent.bankDetails?.verified },
                      { label: "Commission Eligible", val: agent.commissionEligible },
                      { label: "Account Active",      val: agent.isActive },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: val ? C.greenSoft : C.redSoft, border: `1px solid ${val ? C.greenBord : "#FECACA"}` }}>
                        {val ? <CheckCircle size={14} color={C.green} /> : <XCircle size={14} color={C.red} />}
                        <span style={{ fontSize: 12, fontWeight: 600, color: val ? C.green : C.red }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            </div>
          )}

          {/* ── DOCUMENTS ────────────────────────────────────────── */}
          {activeTab === "documents" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Verification status row */}
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, padding: "16px 20px" }}>
                <GroupLabel label="Document Verification Status" />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                  <VerificationBadge label="Emirates ID" verified={agent.emiratesId?.verified} />
                  <VerificationBadge label="Passport"    verified={agent.passport?.verified} />
                  <VerificationBadge label="Bank Details" verified={agent.bankDetails?.verified} />
                  <VerificationBadge label="Account"     verified={agent.isVerified} />
                </div>
                {agent.rejectionReason && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: C.redSoft, borderRadius: 8, border: "1px solid #FECACA", fontSize: 13, color: "#991B1B", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span><strong>Rejection Reason:</strong> {agent.rejectionReason}</span>
                  </div>
                )}
              </div>

              <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* Emirates ID */}
                <Section icon={CreditCard} title="Emirates ID">
                  <DRow label="ID Number"   value={show(agent.emiratesId?.number)} copy />
                  <DRow label="Issue Date"  value={fmtDate(agent.emiratesId?.issuanceDate)} />
                  <DRow label="Expiry Date" value={fmtDate(agent.emiratesId?.expiryDate)} />
                  <DRow label="Verified"    value={boolLabel(agent.emiratesId?.verified)} highlight={agent.emiratesId?.verified} />
                  <DRow label="Verified At" value={fmtDate(agent.emiratesId?.verifiedAt)} />
                  {(agent.emiratesId?.frontImageUrl || agent.emiratesId?.backImageUrl) && (
                    <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                      {agent.emiratesId.frontImageUrl && <DocImage label="Front" url={agent.emiratesId.frontImageUrl} />}
                      {agent.emiratesId.backImageUrl  && <DocImage label="Back"  url={agent.emiratesId.backImageUrl} />}
                    </div>
                  )}
                  {!agent.emiratesId?.frontImageUrl && !agent.emiratesId?.backImageUrl && (
                    <div style={{ marginTop: 10 }}><EmptyNote msg="No Emirates ID documents uploaded" /></div>
                  )}
                  {/* Admin verify/reject buttons */}
                  {(agent.emiratesId?.frontImageUrl || agent.emiratesId?.number) && (
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button
                        disabled={agent.emiratesId?.verified || !!docActionLoading}
                        onClick={() => handleDocVerify("emiratesId", "verify")}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: "none", background: agent.emiratesId?.verified ? C.greenSoft : C.green, color: agent.emiratesId?.verified ? C.green : "#fff", fontSize: 12, fontWeight: 600, cursor: agent.emiratesId?.verified ? "not-allowed" : "pointer", opacity: docActionLoading === "emiratesId_verify" ? 0.7 : 1 }}
                      >
                        {docActionLoading === "emiratesId_verify" ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={12} />}
                        {agent.emiratesId?.verified ? "Verified" : "Verify EID"}
                      </button>
                      <button
                        disabled={!agent.emiratesId?.verified || !!docActionLoading}
                        onClick={() => handleDocVerify("emiratesId", "reject")}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: `1px solid ${C.grayBord}`, background: C.white, color: C.red, fontSize: 12, fontWeight: 600, cursor: !agent.emiratesId?.verified ? "not-allowed" : "pointer", opacity: (!agent.emiratesId?.verified || !!docActionLoading) ? 0.5 : 1 }}
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}
                </Section>

                {/* Passport */}
                <Section icon={FileText} title="Passport">
                  <DRow label="Passport No."     value={show(agent.passport?.number)} copy />
                  <DRow label="Country of Issue" value={show(agent.passport?.countryOfIssue)} />
                  <DRow label="Issue Date"       value={fmtDate(agent.passport?.issueDate)} />
                  <DRow label="Expiry Date"      value={fmtDate(agent.passport?.expiryDate)} />
                  <DRow label="Verified"         value={boolLabel(agent.passport?.verified)} highlight={agent.passport?.verified} />
                  <DRow label="Verified At"      value={fmtDate(agent.passport?.verifiedAt)} />
                  {agent.passport?.imageUrl ? (
                    <div style={{ marginTop: 12 }}><DocImage label="Passport" url={agent.passport.imageUrl} /></div>
                  ) : (
                    <div style={{ marginTop: 10 }}><EmptyNote msg="No passport document uploaded" /></div>
                  )}
                  {agent.passport?.imageUrl && (
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button
                        disabled={agent.passport?.verified || !!docActionLoading}
                        onClick={() => handleDocVerify("passport", "verify")}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: "none", background: agent.passport?.verified ? C.greenSoft : C.green, color: agent.passport?.verified ? C.green : "#fff", fontSize: 12, fontWeight: 600, cursor: agent.passport?.verified ? "not-allowed" : "pointer", opacity: docActionLoading === "passport_verify" ? 0.7 : 1 }}
                      >
                        {docActionLoading === "passport_verify" ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={12} />}
                        {agent.passport?.verified ? "Verified" : "Verify Passport"}
                      </button>
                      <button
                        disabled={!agent.passport?.verified || !!docActionLoading}
                        onClick={() => handleDocVerify("passport", "reject")}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: `1px solid ${C.grayBord}`, background: C.white, color: C.red, fontSize: 12, fontWeight: 600, cursor: !agent.passport?.verified ? "not-allowed" : "pointer", opacity: (!agent.passport?.verified || !!docActionLoading) ? 0.5 : 1 }}
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}
                </Section>

              </div>
            </div>
          )}

          {/* ── FINANCIAL ────────────────────────────────────────── */}
          {activeTab === "financial" && (
            <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              <Section icon={Banknote} title="Bank Details">
                {bk.bankName || bk.accountNumber || bk.iban ? (
                  <>
                    <DRow label="Beneficiary"  value={show(bk.beneficiaryName)} copy />
                    <DRow label="Bank Name"    value={show(bk.bankName)} />
                    <DRow label="Account No."  value={show(bk.accountNumber)} copy />
                    <DRow label="IBAN"         value={show(bk.iban)} copy />
                    <DRow label="Verified"     value={boolLabel(bk.verified)} highlight={bk.verified} />
                    {bk.verifiedAt && <DRow label="Verified At" value={fmtDate(bk.verifiedAt)} />}
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button
                        disabled={bk.verified || !!docActionLoading}
                        onClick={() => handleDocVerify("bankDetails", "verify")}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: "none", background: bk.verified ? C.greenSoft : C.green, color: bk.verified ? C.green : "#fff", fontSize: 12, fontWeight: 600, cursor: bk.verified ? "not-allowed" : "pointer", opacity: docActionLoading === "bankDetails_verify" ? 0.7 : 1 }}
                      >
                        {docActionLoading === "bankDetails_verify" ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={12} />}
                        {bk.verified ? "Verified" : "Verify Bank"}
                      </button>
                      <button
                        disabled={!bk.verified || !!docActionLoading}
                        onClick={() => handleDocVerify("bankDetails", "reject")}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: `1px solid ${C.grayBord}`, background: C.white, color: C.red, fontSize: 12, fontWeight: 600, cursor: !bk.verified ? "not-allowed" : "pointer", opacity: (!bk.verified || !!docActionLoading) ? 0.5 : 1 }}
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </>
                ) : <EmptyNote msg="No bank details added" />}
              </Section>

              <Section icon={DollarSign} title="Commission & Earnings">
                <DRow label="Total Earned"       value={fmtAED(ag.totalCommissionEarned)} />
                <DRow label="Pending"            value={fmtAED(ag.pendingCommission)} />
                <DRow label="Leads Submitted"    value={show(ag.totalLeadsSubmitted ?? 0)} />
                <DRow label="Successful Disbursals" value={show(ag.successfulDisbursals ?? 0)} />
                <DRow label="Conversion Rate"    value={ag.conversionRate !== undefined ? `${ag.conversionRate}%` : null} />
                <DRow label="Leaderboard Rank"   value={show(ag.leaderboardRank)} />
              </Section>

              {/* Referral Partner commission rates */}
              {fc && agent.agentType === "ReferralPartner" && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <Section icon={Percent} title="Commission Rates (Referral Partner)">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div style={{ background: C.primarySoft, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.primaryBord}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 7, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Tag size={12} color="#fff" />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 13, color: C.primary }}>Loans ≤ AED 5M</span>
                        </div>
                        <DRow label="Commission %" value={fc.below5M !== undefined ? `${fc.below5M}%` : "40%"} highlight />
                      </div>
                      <div style={{ background: C.greenSoft, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.greenBord}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 7, background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Tag size={12} color="#fff" />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "#065F46" }}>Loans &gt; AED 5M</span>
                        </div>
                        <DRow label="Commission %" value={fc.above5M !== undefined ? `${fc.above5M}%` : "50%"} highlight />
                      </div>
                    </div>
                  </Section>
                </div>
              )}
              {agent.agentType === "PartnerAffiliatedAgent" && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <Section icon={Percent} title="Commission (Partner Affiliated Agent)">
                    <div style={{ background: C.blueSoft, borderRadius: 10, padding: "12px 16px", border: `1px solid #BFDBFE`, fontSize: 13, color: "#1d4ed8" }}>
                      Commission for leads from affiliated agents is paid to the partner company. The agent does not receive direct Xoto commission.
                    </div>
                  </Section>
                </div>
              )}
            </div>
          )}

          {/* ── AFFILIATION ──────────────────────────────────────── */}
          {activeTab === "affiliation" && (
            <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Section icon={Building2} title="Agent Type & Affiliation">
                <DRow label="Agent Type"
                  value={agent.agentType === "ReferralPartner" ? "Referral Partner" : agent.agentType === "PartnerAffiliatedAgent" ? "Partner Affiliated Agent" : show(agent.agentType)}
                />
                <DRow label="Affiliation Status"
                  value={agent.affiliationStatus === "none" ? "N/A — Referral Partner" : show(agent.affiliationStatus)}
                  badge={
                    agent.affiliationStatus === "verified" ? { bg: C.greenSoft, color: C.green } :
                    agent.affiliationStatus === "rejected" ? { bg: C.redSoft,   color: C.red   } :
                    agent.affiliationStatus === "pending"  ? { bg: C.amberSoft, color: C.amber } : undefined
                  }
                />
                <DRow label="Commission Eligible"    value={boolLabel(agent.commissionEligible)} highlight={agent.commissionEligible} />
                {agent.commissionEligibilityReason && <DRow label="Eligibility Note" value={show(agent.commissionEligibilityReason)} />}
                {agent.affiliationRejectionReason  && <DRow label="Rejection Reason" value={show(agent.affiliationRejectionReason)} />}
                {agent.affiliationVerifiedAt && <DRow label="Affiliation Approved" value={new Date(agent.affiliationVerifiedAt).toLocaleString()} />}
                {agent.affiliationTerminatedAt && <DRow label="Affiliation Terminated" value={new Date(agent.affiliationTerminatedAt).toLocaleString()} />}
                {agent.affiliationRequestedAt  && <DRow label="Affiliation Requested"  value={new Date(agent.affiliationRequestedAt).toLocaleString()} />}
              </Section>

              {agent.agentType === "PartnerAffiliatedAgent" && (
                <Section icon={Hash} title="Partner Details">
                  <DRow label="Partner Company" value={show(agent.partnerId?.companyName)} />
                  <DRow label="Partner Status"  value={show(agent.partnerId?.status)} />
                  <DRow label="Partner ID"      value={show(typeof agent.partnerId === "string" ? agent.partnerId : agent.partnerId?._id)} copy />
                </Section>
              )}
            </div>
          )}

          {/* ── SYSTEM ───────────────────────────────────────────── */}
          {activeTab === "system" && (
            <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Section icon={Shield} title="System Information">
                <DRow label="Agent ID"    value={show(agent._id)} copy />
                <DRow label="Created At"  value={agent.createdAt ? new Date(agent.createdAt).toLocaleString() : null} />
                <DRow label="Updated At"  value={agent.updatedAt ? new Date(agent.updatedAt).toLocaleString() : null} />
                <DRow label="Last Login"  value={agent.lastLoginAt ? new Date(agent.lastLoginAt).toLocaleString() : null} />
                <DRow label="Verified At" value={agent.verifiedAt ? new Date(agent.verifiedAt).toLocaleString() : null} />
                <DRow label="Verified By (ID)" value={show(typeof agent.verifiedBy === "string" ? agent.verifiedBy : agent.verifiedBy?._id)} copy />
                <DRow label="Deleted"     value={boolLabel(agent.isDeleted)} />
                {agent.suspendedAt && (
                  <>
                    <DRow label="Suspended At"     value={new Date(agent.suspendedAt).toLocaleString()} />
                    <DRow label="Suspension Reason" value={show(agent.suspensionReason)} />
                    <DRow label="Suspended By"     value={show(agent.suspendedBy)} />
                  </>
                )}
              </Section>

              <Section icon={Activity} title="Account Flags">
                <FlagRow label="Account Active"   value={agent.isActive}          icon={CheckCircle} />
                <FlagRow label="Email Verified"   value={agent.isEmailVerified}   icon={Mail} />
                <FlagRow label="Phone Verified"   value={agent.isPhoneVerified}   icon={Phone} />
                <FlagRow label="Agent Verified"   value={agent.isVerified}        icon={BadgeCheck} />
                <FlagRow label="Bank Verified"    value={bk.verified}             icon={Banknote} />
                <FlagRow label="Commission Eligible" value={agent.commissionEligible} icon={Percent} />
                <FlagRow label="Suspended"        value={!!agent.suspendedAt}     icon={AlertTriangle} />
              </Section>
            </div>
          )}

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          VERIFY / REJECT MODAL
      ════════════════════════════════════════════════════════════════ */}
      {showVerifyModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 18, width: "100%", maxWidth: 440, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}>
            {/* Accent bar */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid})`, borderRadius: 4, marginBottom: 20 }} />
            <button onClick={() => { setShowVerifyModal(false); setRejectMode(false); setRejectionReason(""); }}
              style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 18 }}>✕</button>

            {!rejectMode ? (
              <>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: C.primarySoft, border: `2px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <ShieldCheck size={26} color={C.primary} />
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6 }}>Verify or Reject Agent</h2>
                  <p style={{ fontSize: 13, color: C.gray }}>Review the agent's documents and confirm your action.</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={handleVerify} disabled={actionLoading}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", background: C.green, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#fff", cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                    {actionLoading ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={16} />}
                    Verify
                  </button>
                  <button onClick={() => setRejectMode(true)} disabled={actionLoading}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", background: C.white, border: `1.5px solid ${C.grayBord}`, borderRadius: 10, fontSize: 14, fontWeight: 600, color: C.textSub, cursor: "pointer" }}>
                    <XCircle size={16} color={C.red} /> Reject
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: C.redSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AlertTriangle size={18} color={C.red} />
                  </div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Reject Agent</h2>
                </div>
                <p style={{ fontSize: 13, color: C.gray, marginBottom: 12 }}>Provide a reason for rejection. This will be shared with the agent.</p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid Emirates ID, Passport expired, etc."
                  rows={4}
                  style={{ width: "100%", border: `1px solid ${C.grayBord}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button onClick={() => { setRejectMode(false); setRejectionReason(""); }}
                    style={{ flex: 1, padding: "11px 0", border: `1px solid ${C.grayBord}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.textSub, background: C.white, cursor: "pointer" }}>
                    Back
                  </button>
                  <button onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 0", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", background: !rejectionReason.trim() ? "#FCA5A5" : C.red, cursor: !rejectionReason.trim() ? "not-allowed" : "pointer" }}>
                    {actionLoading ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <XCircle size={14} />}
                    Confirm Reject
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── Shared Sub-components (mirrors PartnerDetail exactly) ───────────────────
// ════════════════════════════════════════════════════════════════════════════

function Section({ icon: Icon, title, children }) {
  return (
    <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ padding: "13px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: C.primarySoft, border: `1px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color={C.primary} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: "-.2px" }}>{title}</span>
      </div>
      <div style={{ padding: "14px 20px" }}>{children}</div>
    </div>
  );
}

function DRow({ label, value, copy, link, badge, highlight, expired, mono }) {
  const [copied, setCopied] = useState(false);
  const display   = value ?? "—";
  const isMissing = display === "—" || value === null || value === undefined;

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pd-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.grayLight}` }}>
      <span style={{ fontSize: 12, color: C.gray, fontWeight: 500, minWidth: 130, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {badge && !isMissing ? (
          <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color }}>
            {display}
          </span>
        ) : link && !isMissing ? (
          <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: C.primary, fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            {display} <ExternalLink size={11} />
          </a>
        ) : (
          <span style={{
            fontSize: 13, fontWeight: isMissing ? 400 : 500,
            color: expired ? C.red : highlight ? C.green : isMissing ? C.textMuted : C.text,
            fontFamily: mono && !isMissing ? "'Courier New', monospace" : undefined,
            wordBreak: "break-all", textAlign: "right",
          }}>
            {expired && !isMissing ? (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} color={C.red} /> {display}
              </span>
            ) : display}
          </span>
        )}
        {copy && value && (
          <button className="pd-copy" onClick={handleCopy} title="Copy"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 5px", borderRadius: 5, color: copied ? C.green : C.textMuted, display: "flex", alignItems: "center", transition: "all .2s" }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, color }) {
  return (
    <div className="pd-stat" style={{ background: C.white, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.grayBord}`, transition: "all .2s", cursor: "default" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={13} color={color} />
        </div>
        <span style={{ fontSize: 10, color: C.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}

function StatusPill({ bg, color, icon: Icon, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: bg, color }}>
      {Icon && <Icon size={11} />} {label}
    </span>
  );
}

function InfoChip({ icon: Icon, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.gray }}>
      <Icon size={13} color={C.textMuted} /> {value}
    </div>
  );
}

function GroupLabel({ label }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ height: 1, width: 16, background: C.grayBord, display: "inline-block" }} />
      {label}
      <span style={{ height: 1, flex: 1, background: C.grayBord, display: "inline-block" }} />
    </p>
  );
}

function EmptyNote({ msg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, color: C.textMuted, fontSize: 13, padding: "10px 0", fontStyle: "italic" }}>
      <Info size={14} color={C.textMuted} /> {msg}
    </div>
  );
}

function FlagRow({ label, value, icon: Icon }) {
  const isTrue  = value === true;
  const isFalse = value === false;
  const isNull  = !isTrue && !isFalse;
  return (
    <div className="pd-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.grayLight}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textSub, fontWeight: 500 }}>
        <Icon size={14} color={C.gray} /> {label}
      </div>
      {isNull ? (
        <span style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic" }}>—</span>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: isTrue ? C.greenSoft : C.redSoft }}>
          {isTrue ? <CheckCircle size={12} color={C.green} /> : <XCircle size={12} color={C.red} />}
          <span style={{ fontSize: 11, fontWeight: 700, color: isTrue ? C.green : C.red }}>{isTrue ? "Yes" : "No"}</span>
        </div>
      )}
    </div>
  );
}

function VerificationBadge({ label, verified }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: verified ? C.greenSoft : C.redSoft, border: `1px solid ${verified ? C.greenBord : "#FECACA"}` }}>
      {verified ? <CheckCircle size={13} color={C.green} /> : <XCircle size={13} color={C.red} />}
      <span style={{ fontSize: 12, fontWeight: 600, color: verified ? C.green : C.red }}>{label}</span>
    </div>
  );
}

function DocImage({ label, url }) {
  return (
    <div style={{ border: `1px solid ${C.grayBord}`, borderRadius: 10, overflow: "hidden", maxWidth: 200 }}>
      <div style={{ padding: "6px 10px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, fontSize: 11, fontWeight: 600, color: C.gray, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
      <img src={url} alt={label} onError={(e) => { e.target.style.display = "none"; }} style={{ width: "100%", maxHeight: 140, objectFit: "cover", display: "block" }} />
    </div>
  );
}