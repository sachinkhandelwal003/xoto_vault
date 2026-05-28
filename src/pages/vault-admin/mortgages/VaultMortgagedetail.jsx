// src/pages/Advisor/VaultMortgageDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, User, Mail, Phone, AlertCircle, CheckCircle,
  XCircle, AlertTriangle, Shield, Activity, Layers, BarChart2,
  RefreshCw, Info, Copy, Check, Hash, Calendar, Briefcase,
  PauseCircle, PlayCircle, Trash2, Users, TrendingUp, Star,
  DollarSign, Clock, FileText, Inbox,
} from "lucide-react";
import { apiService } from "@/api/apiService";

// â”€â”€â”€ Design Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  amberBord   : "#FDE68A",
  blue        : "#3B82F6",
  blueSoft    : "#EFF6FF",
  orange      : "#F97316",
  orangeSoft  : "#FFF7ED",
  orangeBord  : "#FED7AA",
  gray        : "#6B7280",
  grayLight   : "#F9FAFB",
  grayBord    : "#E5E7EB",
  text        : "#111827",
  textSub     : "#374151",
  textMuted   : "#9CA3AF",
  white       : "#FFFFFF",
  bg          : "#F4F0FA",
};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const show    = (v) => (v !== null && v !== undefined && v !== "") ? v : null;
const fmtDate = (s) => { try { return s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null; } catch { return null; } };
const fmtDT   = (s) => { try { return s ? new Date(s).toLocaleString() : null; } catch { return null; } };
const boolLbl = (v) => v === true ? "Yes" : v === false ? "No" : null;

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function VaultMortgageDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [advisor, setAdvisor]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [suspendModal, setSuspendModal]     = useState(false);
  const [suspendReason, setSuspendReason]   = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [actionLoading, setActionLoading]   = useState(false);
  const [flashMsg, setFlashMsg]             = useState({ type: "", text: "" });

  // â”€â”€ Fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchAdvisor = async () => {
    setLoading(true); setError("");
    try {
      const res  = await apiService.get(`/vault/ops/get/${id}`);
      const data = res?.data?.data || res?.data || res;
      setAdvisor(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchAdvisor(); }, [id]);

  const flash = (type, text) => {
    setFlashMsg({ type, text });
    setTimeout(() => setFlashMsg({ type: "", text: "" }), 4000);
  };

  const handleSuspend = async () => {
    setSuspendLoading(true);
    try {
      await apiService.put(`/vault/ops/suspend/${id}`, { suspensionReason: suspendReason.trim() });
      flash("success", "Advisor suspended successfully.");
      setSuspendModal(false); setSuspendReason(""); fetchAdvisor();
    } catch (err) { flash("error", err?.response?.data?.message || "Suspension failed"); }
    finally { setSuspendLoading(false); }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      await apiService.put(`/vault/ops/activate/${id}`);
      flash("success", "Advisor activated."); fetchAdvisor();
    } catch (err) { flash("error", err?.response?.data?.message || "Activation failed"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete this advisor?")) return;
    setActionLoading(true);
    try {
      await apiService.delete(`/vault/ops/delete/${id}`);
      flash("success", "Advisor deleted.");
      setTimeout(() => navigate(-1), 1200);
    } catch (err) { flash("error", err?.response?.data?.message || "Delete failed"); setActionLoading(false); }
  };

  // â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.primarySoft, border: `2px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={24} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
      </div>
      <p style={{ color: C.gray, fontSize: 14, fontWeight: 500 }}>Loading advisor details...</p>
    </div>
  );

  if (error || !advisor) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: C.redSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <AlertCircle size={28} color={C.red} />
      </div>
      <p style={{ color: "#B91C1C", marginBottom: 20, fontSize: 15, fontWeight: 600 }}>{error || "Advisor not found"}</p>
      <button onClick={() => navigate(-1)} style={{ padding: "10px 24px", background: C.primary, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        <ChevronLeft size={16} /> Go Back
      </button>
    </div>
  );

  // â”€â”€ Derived — âœ… all mapped from actual API response â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // name is nested: { name: { first_name, last_name } }
  const firstName   = advisor.name?.first_name || "";
  const lastName    = advisor.name?.last_name  || "";
  const fullName    = `${firstName} ${lastName}`.trim() || "—";

  // phone is nested: { phone: { country_code, number } }
  const phoneStr    = advisor.phone?.number
    ? `${advisor.phone.country_code || ""} ${advisor.phone.number}`.trim()
    : null;

  // status from suspendedAt (no isSuspended field in response)
  const isSuspended = !!advisor.suspendedAt;
  const isActive    = advisor.isActive !== false && !isSuspended;

  // workload from advisor.workload.*
  const currentApps = advisor.workload?.currentApplications      ?? 0;
  const maxCapacity = advisor.workload?.maxCapacity               ?? 0;
  const loadPct     = maxCapacity ? Math.min((currentApps / maxCapacity) * 100, 100) : 0;

  // performanceMetrics from advisor.performanceMetrics.*
  const perf        = advisor.performanceMetrics || {};

  // queueStatus from advisor.queueStatus.*
  const queue       = advisor.queueStatus || {};

  const statusCfg   = isSuspended
    ? { bg: C.orangeSoft, color: C.orange, icon: PauseCircle, label: "Suspended" }
    : isActive
    ? { bg: C.greenSoft,  color: C.green,  icon: CheckCircle, label: "Active"    }
    : { bg: C.redSoft,    color: C.red,    icon: XCircle,     label: "Inactive"  };

  const TABS = [
    { id: "overview",  label: "Overview",    icon: Layers    },
    { id: "work",      label: "Work Info",   icon: Briefcase },
    { id: "workload",  label: "Workload",    icon: BarChart2 },
    { id: "system",    label: "System",      icon: Shield    },
  ];

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        .pd-action-btn { transition: all .18s; }
        .pd-action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        @media(max-width:768px){
          .pd-grid-2 { grid-template-columns: 1fr !important; }
          .pd-header-inner { flex-direction: column !important; }
          .pd-stats { grid-template-columns: 1fr 1fr !important; }
          .pd-header-actions { flex-wrap: wrap !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        {/* Back */}
        <button onClick={() => navigate(-1)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20, padding: "8px 16px", background: C.white, border: `1px solid ${C.grayBord}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.textSub, cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primaryBord; e.currentTarget.style.color = C.primary; e.currentTarget.style.background = C.primarySoft; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.grayBord; e.currentTarget.style.color = C.textSub; e.currentTarget.style.background = C.white; }}>
          <ChevronLeft size={15} /> Back to Mortgage Ops
        </button>

        {/* Flash */}
        {flashMsg.text && (
          <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 10, fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: flashMsg.type === "success" ? C.greenSoft : flashMsg.type === "error" ? C.redSoft : C.blueSoft, color: flashMsg.type === "success" ? "#065F46" : flashMsg.type === "error" ? "#991B1B" : "#1E40AF", border: `1px solid ${flashMsg.type === "success" ? C.greenBord : "#FECACA"}` }}>
            {flashMsg.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {flashMsg.text}
          </div>
        )}

        {/* â•â• HEADER CARD â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.grayBord}`, marginBottom: 16, overflow: "hidden", boxShadow: "0 2px 16px rgba(92,3,155,0.06)", animation: "fadeUp .4s ease" }}>
          <div style={{ height: 5, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid}, ${C.primaryLight})` }} />
          <div className="pd-header-inner" style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "24px 28px 22px" }}>

            {/* Avatar */}
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: C.primarySoft, border: `2px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {advisor.profilePic
                ? <img src={advisor.profilePic} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <User size={32} color={C.primary} />}
            </div>

            {/* Name + info chips */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>{fullName}</h1>
                {/* âœ… designation from advisor.designation */}
                {advisor.designation && <StatusPill bg={C.primarySoft} color={C.primary} label={advisor.designation} />}
                <StatusPill bg={statusCfg.bg} color={statusCfg.color} icon={statusCfg.icon} label={statusCfg.label} />
                {/* âœ… isVerified from advisor.isVerified */}
                {advisor.isVerified && <StatusPill bg={C.greenSoft} color={C.green} icon={CheckCircle} label="Verified" />}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
                {/* âœ… email from advisor.email */}
                <InfoChip icon={Mail}      value={advisor.email} />
                {/* âœ… phone from advisor.phone.number */}
                <InfoChip icon={Phone}     value={phoneStr} />
                {/* âœ… department from advisor.department */}
                <InfoChip icon={Briefcase} value={advisor.department} />
                {/* âœ… joinDate from advisor.joinDate */}
                <InfoChip icon={Calendar}  value={advisor.joinDate ? `Joined ${fmtDate(advisor.joinDate)}` : null} />
                <InfoChip icon={Hash}      value={advisor._id ? `ID: …${advisor._id.slice(-6)}` : null} />
              </div>
            </div>

            {/* Actions */}
            <div className="pd-header-actions" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {isActive && (
                <button className="pd-action-btn" onClick={() => { setSuspendReason(""); setSuspendModal(true); }} disabled={actionLoading}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.orangeSoft, color: C.orange, border: `1px solid ${C.orangeBord}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <PauseCircle size={15} /> Suspend
                </button>
              )}
              {(!isActive || isSuspended) && (
                <button className="pd-action-btn" onClick={handleActivate} disabled={actionLoading}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.greenSoft, color: C.green, border: `1px solid ${C.greenBord}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <PlayCircle size={15} />}
                  Activate
                </button>
              )}
              <button className="pd-action-btn" onClick={handleDelete} disabled={actionLoading}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.redSoft, color: C.red, border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* â•â• STATS ROW — âœ… from advisor.workload.* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="pd-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          <StatTile icon={Users}     color={C.primary} label="Active Applications" value={`${currentApps} / ${maxCapacity}`} />
          <StatTile icon={FileText}  color="#0891B2"   label="Processed This Month" value={advisor.workload?.applicationsProcessedThisMonth ?? 0} />
          <StatTile icon={Clock}     color={C.amber}   label="Avg Processing Days"  value={`${advisor.workload?.averageProcessingDays ?? 0} days`} />
          <StatTile icon={TrendingUp} color={C.green}  label="Total Processed"      value={perf.totalApplicationsProcessed ?? 0} />
        </div>

        {/* Capacity bar — âœ… workload.currentApplications / workload.maxCapacity */}
        {maxCapacity > 0 && (
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grayBord}`, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 12, color: C.gray, fontWeight: 600, whiteSpace: "nowrap", minWidth: 130 }}>Applications Capacity</span>
            <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 99, height: 8 }}>
              <div style={{ width: `${loadPct}%`, background: loadPct >= 85 ? C.red : loadPct >= 60 ? C.amber : C.primary, height: "100%", borderRadius: 99, transition: "width .4s" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>{currentApps} / {maxCapacity} ({Math.round(loadPct)}%)</span>
          </div>
        )}

        {/* â•â• TABS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, padding: "4px 6px", display: "flex", gap: 2, marginBottom: 16, overflowX: "auto" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon   = tab.icon;
            return (
              <button key={tab.id} className="pd-tab" onClick={() => setActiveTab(tab.id)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none", background: active ? C.primarySoft : "transparent", color: active ? C.primary : C.gray, fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", borderBottom: active ? `2px solid ${C.primary}` : "2px solid transparent" }}>
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* â•â• TAB CONTENT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div style={{ animation: "fadeUp .3s ease" }} key={activeTab}>

          {/* â”€â”€ OVERVIEW â”€â”€ */}
          {activeTab === "overview" && (
            <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Section icon={User} title="Personal Details">
                {/* âœ… name.first_name / name.last_name */}
                <DRow label="First Name"    value={show(firstName)} />
                <DRow label="Last Name"     value={show(lastName)} />
                {/* âœ… email */}
                <DRow label="Email"         value={show(advisor.email)} copy />
                {/* âœ… phone.country_code + phone.number */}
                <DRow label="Phone"         value={show(phoneStr)} copy />
                <DRow label="Country Code"  value={show(advisor.phone?.country_code)} />
                {/* âœ… gender */}
                <DRow label="Gender"        value={show(advisor.gender)} />
                {/* âœ… nationality */}
                <DRow label="Nationality"   value={show(advisor.nationality)} />
                {/* âœ… dateOfBirth */}
                <DRow label="Date of Birth" value={fmtDate(advisor.dateOfBirth)} />
              </Section>

              <Section icon={Shield} title="Account Status">
                <DRow label="Status"     value={statusCfg.label} badge={{ bg: statusCfg.bg, color: statusCfg.color }} />
                {/* âœ… isActive */}
                <DRow label="Active"     value={boolLbl(advisor.isActive)} highlight={advisor.isActive} />
                {/* âœ… isVerified */}
                <DRow label="Verified"   value={boolLbl(advisor.isVerified)} highlight={advisor.isVerified} />
                {/* âœ… suspendedAt — if not null = suspended */}
                <DRow label="Suspended"  value={boolLbl(isSuspended)} />
                {isSuspended && (
                  <>
                    <DRow label="Suspended At"      value={fmtDT(advisor.suspendedAt)} />
                    <DRow label="Suspension Reason" value={show(advisor.suspensionReason)} />
                  </>
                )}
                {/* âœ… joinDate */}
                <DRow label="Join Date"   value={fmtDate(advisor.joinDate)} />
                {/* âœ… lastLoginAt */}
                <DRow label="Last Login"  value={fmtDT(advisor.lastLoginAt)} />
                <DRow label="Created At"  value={fmtDT(advisor.createdAt)} />
                <DRow label="Advisor ID"  value={show(advisor._id)} copy />
              </Section>
            </div>
          )}

          {/* â”€â”€ WORK INFO â”€â”€ */}
          {activeTab === "work" && (
            <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Section icon={Briefcase} title="Work Details">
                {/* âœ… department */}
                <DRow label="Department"   value={show(advisor.department)} />
                {/* âœ… designation */}
                <DRow label="Designation"  value={show(advisor.designation)} />
                {/* âœ… role.name / role.code */}
                <DRow label="Role"         value={show(advisor.role?.name)} />
                <DRow label="Role Code"    value={show(advisor.role?.code)} />
                <DRow label="Role ID"      value={show(advisor.role?._id)} copy />
                {/* âœ… joinDate */}
                <DRow label="Join Date"    value={fmtDate(advisor.joinDate)} />
                {/* âœ… verifiedAt / verifiedBy */}
                <DRow label="Verified At"  value={fmtDT(advisor.verifiedAt)} />
                <DRow label="Verified By"  value={show(advisor.verifiedBy)} copy />
              </Section>

              <Section icon={Activity} title="Account Flags">
                <FlagRow label="Account Active"  value={advisor.isActive}   icon={CheckCircle} />
                <FlagRow label="Verified"        value={advisor.isVerified} icon={CheckCircle} />
                <FlagRow label="Suspended"       value={isSuspended}        icon={PauseCircle} invert />
                <FlagRow label="Deleted"         value={advisor.isDeleted}  icon={Trash2}      invert />
              </Section>
            </div>
          )}

          {/* â”€â”€ WORKLOAD â”€â”€ âœ… advisor.workload.* + advisor.performanceMetrics.* + advisor.queueStatus.* */}
          {activeTab === "workload" && (
            <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              {/* Workload */}
              <Section icon={BarChart2} title="Workload">
                <DRow label="Max Capacity"             value={show(advisor.workload?.maxCapacity)} />
                <DRow label="Current Applications"     value={show(advisor.workload?.currentApplications)} />
                <DRow label="Available Slots"          value={maxCapacity ? String(maxCapacity - currentApps) : "—"} />
                <DRow label="Processed This Month"     value={show(advisor.workload?.applicationsProcessedThisMonth)} />
                <DRow label="Avg Processing Days"      value={advisor.workload?.averageProcessingDays != null ? `${advisor.workload.averageProcessingDays} days` : null} />

                {/* Capacity bar */}
                {maxCapacity > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: C.gray, fontWeight: 600 }}>Capacity</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: loadPct >= 85 ? C.red : loadPct >= 60 ? C.amber : C.primary }}>{Math.round(loadPct)}%</span>
                    </div>
                    <div style={{ background: "#F3F4F6", borderRadius: 99, height: 10 }}>
                      <div style={{ width: `${loadPct}%`, background: loadPct >= 85 ? C.red : loadPct >= 60 ? C.amber : C.primary, height: "100%", borderRadius: 99, transition: "width .4s" }} />
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                      {[{ color: C.primary, label: "Normal (< 60%)" }, { color: C.amber, label: "High (60—85%)" }, { color: C.red, label: "Full (> 85%)" }].map((l) => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.gray }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Section>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Performance Metrics */}
                <Section icon={TrendingUp} title="Performance Metrics">
                  <DRow label="Total Processed"     value={show(perf.totalApplicationsProcessed)} />
                  <DRow label="Total Returned"       value={show(perf.totalApplicationsReturned)} />
                  <DRow label="Return Rate"          value={perf.returnRate != null ? `${perf.returnRate}%` : null} />
                  <DRow label="Total Disbursed"      value={show(perf.totalDisbursed)} />
                  <DRow label="Avg Turnaround Days"  value={perf.averageTurnaroundDays != null ? `${perf.averageTurnaroundDays} days` : null} />
                  <DRow label="Total Bank Submissions" value={show(perf.totalBankSubmissions)} />
                </Section>

                {/* Queue Status */}
                <Section icon={Inbox} title="Queue Status">
                  <DRow label="Pending Review" value={show(queue.pendingReview)} />
                  <DRow label="In Progress"    value={show(queue.inProgress)} />
                  <DRow label="Waiting Bank"   value={show(queue.waitingBank)} />
                </Section>
              </div>
            </div>
          )}

          {/* â”€â”€ SYSTEM â”€â”€ */}
          {activeTab === "system" && (
            <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Section icon={Shield} title="System Information">
                <DRow label="Advisor ID"   value={show(advisor._id)} copy />
                <DRow label="Version"      value={advisor.__v !== undefined ? `v${advisor.__v}` : null} />
                <DRow label="Created At"   value={fmtDT(advisor.createdAt)} />
                <DRow label="Updated At"   value={fmtDT(advisor.updatedAt)} />
                {/* âœ… lastLoginAt (not lastLogin) */}
                <DRow label="Last Login"   value={fmtDT(advisor.lastLoginAt)} />
                <DRow label="Deleted At"   value={fmtDT(advisor.deletedAt)} />
                <DRow label="Verified At"  value={fmtDT(advisor.verifiedAt)} />
                <DRow label="Verified By"  value={show(advisor.verifiedBy)} copy />
                {/* âœ… role.name from advisor.role */}
                <DRow label="Role"         value={show(advisor.role?.name)} />
                <DRow label="Role Code"    value={show(advisor.role?.code)} />
              </Section>

              <Section icon={Activity} title="Account Flags">
                <FlagRow label="Account Active"  value={advisor.isActive}   icon={CheckCircle} />
                <FlagRow label="Verified"        value={advisor.isVerified} icon={CheckCircle} />
                <FlagRow label="Suspended"       value={isSuspended}        icon={PauseCircle} invert />
                <FlagRow label="Deleted"         value={advisor.isDeleted}  icon={Trash2}      invert />
              </Section>
            </div>
          )}

        </div>
      </div>

      {/* â•â• SUSPEND MODAL â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {suspendModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 18, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.orange}, #fb923c)` }} />
            <div style={{ padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.orangeSoft, border: `1px solid ${C.orangeBord}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PauseCircle size={22} color={C.orange} />
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>Suspend Advisor</h2>
                  <p style={{ fontSize: 12, color: C.gray, margin: 0 }}>{fullName}</p>
                </div>
                <button onClick={() => !suspendLoading && setSuspendModal(false)}
                  style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 18 }}>âœ•</button>
              </div>

              <div style={{ background: C.orangeSoft, border: `1px solid ${C.orangeBord}`, borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#92400e", display: "flex", gap: 8 }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} color={C.orange} />
                <span>This advisor will lose access until reactivated. Active applications will be flagged for reassignment.</span>
              </div>

              <label style={{ display: "block", fontWeight: 600, color: C.text, marginBottom: 6, fontSize: 13 }}>
                Suspension Reason <span style={{ color: C.textMuted, fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={3} maxLength={300}
                placeholder="e.g. Under compliance review…"
                style={{ width: "100%", border: `1px solid ${C.grayBord}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              <div style={{ textAlign: "right", fontSize: 11, color: C.textMuted, marginTop: 4 }}>{suspendReason.length}/300</div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setSuspendModal(false)} disabled={suspendLoading}
                  style={{ flex: 1, padding: "11px 0", border: `1px solid ${C.grayBord}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.textSub, background: C.white, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleSuspend} disabled={suspendLoading}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 0", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", background: C.orange, cursor: suspendLoading ? "not-allowed" : "pointer", opacity: suspendLoading ? 0.7 : 1 }}>
                  {suspendLoading ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <PauseCircle size={14} />}
                  Confirm Suspension
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Sub-components
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function Section({ icon: Icon, title, children }) {
  return (
    <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ padding: "13px 20px", background: C.grayLight, borderBottom: `1px solid ${C.grayBord}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: C.primarySoft, border: `1px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color={C.primary} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</span>
      </div>
      <div style={{ padding: "14px 20px" }}>{children}</div>
    </div>
  );
}

function DRow({ label, value, copy, badge, highlight, mono }) {
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
      <span style={{ fontSize: 12, color: C.gray, fontWeight: 500, minWidth: 150, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {badge && !isMissing ? (
          <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color }}>{display}</span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: isMissing ? 400 : 500, color: highlight ? C.green : isMissing ? C.textMuted : C.text, fontFamily: mono && !isMissing ? "'Courier New', monospace" : undefined, wordBreak: "break-all", textAlign: "right" }}>
            {display}
          </span>
        )}
        {copy && value && (
          <button className="pd-copy" onClick={handleCopy}
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

function EmptyNote({ msg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, color: C.textMuted, fontSize: 13, padding: "10px 0", fontStyle: "italic" }}>
      <Info size={14} color={C.textMuted} /> {msg}
    </div>
  );
}

function FlagRow({ label, value, icon: Icon, invert = false }) {
  const isTrue = value === true;
  const isFalse = value === false;
  const isNull = !isTrue && !isFalse;
  const good = invert ? isFalse : isTrue;
  return (
    <div className="pd-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.grayLight}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textSub, fontWeight: 500 }}>
        <Icon size={14} color={C.gray} /> {label}
      </div>
      {isNull ? (
        <span style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic" }}>—</span>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: good ? C.greenSoft : C.redSoft }}>
          {good ? <CheckCircle size={12} color={C.green} /> : <XCircle size={12} color={C.red} />}
          <span style={{ fontSize: 11, fontWeight: 700, color: good ? C.green : C.red }}>{isTrue ? "Yes" : "No"}</span>
        </div>
      )}
    </div>
  );
}