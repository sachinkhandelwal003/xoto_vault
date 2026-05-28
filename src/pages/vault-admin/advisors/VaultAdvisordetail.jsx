// src/pages/Advisor/VaultAdvisorDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, User, Mail, Phone, MapPin, Calendar, Briefcase,
  AlertCircle, CheckCircle, XCircle, BadgeCheck, AlertTriangle,
  Shield, Activity, Layers, BarChart2, RefreshCw, Info,
  Copy, Check, Hash, Clock, Tag, PauseCircle, PlayCircle,
  Trash2, Users, TrendingUp, Star,
} from "lucide-react";
import { apiService } from "@/api/apiService";
import { Tabs } from "antd";

// â”€â”€â”€ Design Tokens (identical to PartnerDetail) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const show      = (v) => (v !== null && v !== undefined && v !== "") ? v : null;
const fmtDate   = (s) => { try { return s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null; } catch { return null; } };
const fmtDT     = (s) => { try { return s ? new Date(s).toLocaleString() : null; } catch { return null; } };
const boolLabel = (v) => v === true ? "Yes" : v === false ? "No" : null;
const isExpired = (d) => d && new Date(d) < new Date();

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function VaultAdvisorDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [advisor, setAdvisor]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // â”€â”€ Action states â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [suspendModal, setSuspendModal]     = useState(false);
  const [suspendReason, setSuspendReason]   = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [actionLoading, setActionLoading]   = useState(false);
  const [flashMsg, setFlashMsg]             = useState({ type: "", text: "" });

  // â”€â”€ Fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchAdvisor = async () => {
    setLoading(true); setError("");
    try {
      const res  = await apiService.get(`/vault/advisor/get/${id}`);
      const data = res?.data || res;
      setAdvisor(data?.data || data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load advisor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchAdvisor(); }, [id]);

  const flash = (type, text) => {
    setFlashMsg({ type, text });
    setTimeout(() => setFlashMsg({ type: "", text: "" }), 4000);
  };

  // â”€â”€ Suspend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSuspend = async () => {
    setSuspendLoading(true);
    try {
      await apiService.put(`/vault/advisor/suspend/${id}`, {
        suspensionReason: suspendReason.trim(),
      });
      flash("success", "Advisor suspended successfully.");
      setSuspendModal(false);
      setSuspendReason("");
      fetchAdvisor();
    } catch (err) {
      flash("error", err?.response?.data?.message || "Suspension failed");
    } finally {
      setSuspendLoading(false);
    }
  };

  // â”€â”€ Activate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleActivate = async () => {
    setActionLoading(true);
    try {
      await apiService.put(`/vault/advisor/activate/${id}`);
      flash("success", "Advisor activated successfully.");
      fetchAdvisor();
    } catch (err) {
      flash("error", err?.response?.data?.message || "Activation failed");
    } finally {
      setActionLoading(false);
    }
  };

  // â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDelete = async () => {
    if (!window.confirm("Permanently delete this advisor? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await apiService.delete(`/vault/advisor/delete/${id}`);
      flash("success", "Advisor deleted.");
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      flash("error", err?.response?.data?.message || "Delete failed");
      setActionLoading(false);
    }
  };

  // â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.primarySoft, border: `2px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={24} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
      </div>
      <p style={{ color: C.gray, fontSize: 14, fontWeight: 500 }}>Loading advisor details...</p>
    </div>
  );

  // â”€â”€ Error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Derived values â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fullName  = `${advisor.first_name || ""} ${advisor.last_name || ""}`.trim() || "—";
  const isSuspended = !!advisor.isSuspended || !!advisor.suspendedAt;
  const isActive  = advisor.isActive !== false && !isSuspended;
  const phoneStr  = [advisor.country_code, advisor.phone_number].filter(Boolean).join(" ") || null;

  const currentLeads = advisor.currentLeads || 0;
  const maxLeads     = advisor.maxLeadsCapacity || 0;
  const leadsPct     = maxLeads ? Math.min((currentLeads / maxLeads) * 100, 100) : 0;

  // Status config
  const statusCfg = isSuspended
    ? { bg: C.orangeSoft, color: C.orange, borderColor: C.orangeBord, icon: PauseCircle, label: "Suspended" }
    : isActive
    ? { bg: C.greenSoft,  color: C.green,  borderColor: C.greenBord,  icon: CheckCircle, label: "Active"    }
    : { bg: C.redSoft,    color: C.red,    borderColor: "#FECACA",    icon: XCircle,     label: "Inactive"  };

  // â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const TABS = [
    { id: "overview",  label: "Overview",   icon: Layers    },
    { id: "work",      label: "Work Info",  icon: Briefcase },
    { id: "leads",     label: "Leads",      icon: BarChart2 },
    { id: "system",    label: "System",     icon: Shield    },
  ];

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        .custom-advisor-tabs .ant-tabs-nav {
          margin-bottom: 16px !important;
        }
        .custom-advisor-tabs .ant-tabs-tab {
          background: transparent !important;
          border: 1px solid #E5E7EB !important;
          border-bottom: none !important;
          border-radius: 8px 8px 0 0 !important;
          margin-right: 4px !important;
          padding: 8px 16px !important;
          transition: all 0.2s !important;
        }
        .custom-advisor-tabs .ant-tabs-tab-btn {
          color: #6B7280 !important;
          font-size: 13px !important;
          font-weight: 500 !important;
        }
        .custom-advisor-tabs .ant-tabs-tab-active {
          background: #FFFFFF !important;
          border-color: #E5E7EB !important;
          border-bottom-color: #FFFFFF !important;
        }
        .custom-advisor-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #5C039B !important;
          font-weight: 700 !important;
        }
        .custom-advisor-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn {
          color: #7C3AED !important;
        }
        .custom-advisor-tabs .ant-tabs-nav-operations {
          display: none !important;
        }
        @media(max-width:768px){
          .pd-grid-2 { grid-template-columns: 1fr !important; }
          .pd-header-inner { flex-direction: column !important; }
          .pd-stats { grid-template-columns: 1fr 1fr !important; }
          .pd-header-actions { flex-wrap: wrap !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        {/* â”€â”€ Back Button â”€â”€ */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20, padding: "8px 16px", background: C.white, border: `1px solid ${C.grayBord}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.textSub, cursor: "pointer", transition: "all .2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primaryBord; e.currentTarget.style.color = C.primary; e.currentTarget.style.background = C.primarySoft; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.grayBord;    e.currentTarget.style.color = C.textSub;  e.currentTarget.style.background = C.white; }}
        >
          <ChevronLeft size={15} /> Back to Advisors
        </button>

        {/* â”€â”€ Flash Message â”€â”€ */}
        {flashMsg.text && (
          <div style={{
            marginBottom: 16, padding: "10px 16px", borderRadius: 10, fontSize: 13,
            display: "flex", alignItems: "center", gap: 8,
            background: flashMsg.type === "success" ? C.greenSoft : flashMsg.type === "error" ? C.redSoft : C.blueSoft,
            color: flashMsg.type === "success" ? "#065F46" : flashMsg.type === "error" ? "#991B1B" : "#1E40AF",
            border: `1px solid ${flashMsg.type === "success" ? C.greenBord : flashMsg.type === "error" ? "#FECACA" : "#BFDBFE"}`,
          }}>
            {flashMsg.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {flashMsg.text}
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            PROFILE HEADER CARD
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.grayBord}`, marginBottom: 16, overflow: "hidden", boxShadow: "0 2px 16px rgba(92,3,155,0.06)", animation: "fadeUp .4s ease" }}>
          {/* Purple accent bar */}
          <div style={{ height: 5, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid}, ${C.primaryLight})` }} />

          <div className="pd-header-inner" style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "24px 28px 22px" }}>

            {/* Avatar */}
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: C.primarySoft, border: `2px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {advisor.profilePic
                ? <img src={advisor.profilePic} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <User size={32} color={C.primary} />}
            </div>

            {/* Name + chips */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-.4px" }}>
                  {fullName}
                </h1>
                {advisor.designation && (
                  <StatusPill bg={C.primarySoft} color={C.primary} label={advisor.designation} />
                )}
                <StatusPill
                  bg={statusCfg.bg} color={statusCfg.color}
                  icon={statusCfg.icon} label={statusCfg.label}
                />
              </div>

              {/* Info chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
                <InfoChip icon={Mail}     value={advisor.email} />
                <InfoChip icon={Phone}    value={phoneStr} />
                <InfoChip icon={Briefcase} value={advisor.department} />
                <InfoChip icon={Calendar} value={advisor.joinDate ? `Joined ${fmtDate(advisor.joinDate)}` : null} />
                <InfoChip icon={Hash}     value={advisor._id ? `ID: …${advisor._id.slice(-6)}` : null} />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pd-header-actions" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {/* Suspend — only when active */}
              {isActive && (
                <button
                  className="pd-action-btn"
                  onClick={() => { setSuspendReason(""); setSuspendModal(true); }}
                  disabled={actionLoading}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.orangeSoft, color: C.orange, border: `1px solid ${C.orangeBord}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  <PauseCircle size={15} /> Suspend
                </button>
              )}

              {/* Activate — when inactive or suspended */}
              {(!isActive || isSuspended) && (
                <button
                  className="pd-action-btn"
                  onClick={handleActivate}
                  disabled={actionLoading}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.greenSoft, color: C.green, border: `1px solid ${C.greenBord}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1 }}
                >
                  {actionLoading ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <PlayCircle size={15} />}
                  Activate
                </button>
              )}

              {/* Delete */}
              <button
                className="pd-action-btn"
                onClick={handleDelete}
                disabled={actionLoading}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.redSoft, color: C.red, border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1 }}
              >
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            STATS ROW
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="pd-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          <StatTile icon={Users}     color={C.primary}   label="Current Leads"   value={`${currentLeads} / ${maxLeads || "—"}`} />
          <StatTile icon={Briefcase} color="#0891B2"     label="Department"      value={show(advisor.department) || "—"} />
          <StatTile icon={Star}      color={C.amber}     label="Designation"     value={show(advisor.designation) || "—"} />
          <StatTile icon={Calendar}  color={C.green}     label="Join Date"       value={fmtDate(advisor.joinDate) || "—"} />
        </div>

        {/* Leads capacity progress bar (full width) */}
        {maxLeads > 0 && (
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grayBord}`, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 12, color: C.gray, fontWeight: 600, whiteSpace: "nowrap", minWidth: 110 }}>
              Leads Capacity
            </span>
            <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 99, height: 8 }}>
              <div style={{
                width: `${leadsPct}%`,
                background: leadsPct >= 85 ? C.red : leadsPct >= 60 ? C.amber : C.primary,
                height: "100%", borderRadius: 99, transition: "width .4s",
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>
              {currentLeads} / {maxLeads} ({Math.round(leadsPct)}%)
            </span>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            TABS
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          className="custom-advisor-tabs"
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

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            TAB CONTENT
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div style={{ animation: "fadeUp .3s ease" }} key={activeTab}>

          {/* â”€â”€ OVERVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === "overview" && (
            <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              <Section icon={User} title="Personal Details">
                <DRow label="First Name"   value={show(advisor.first_name)} />
                <DRow label="Last Name"    value={show(advisor.last_name)} />
                <DRow label="Email"        value={show(advisor.email)} copy />
                <DRow label="Phone"        value={show(phoneStr)} copy />
                <DRow label="Country Code" value={show(advisor.country_code)} />
                <DRow label="Gender"       value={show(advisor.gender)} />
                <DRow label="Nationality"  value={show(advisor.nationality)} />
                <DRow label="Date of Birth" value={fmtDate(advisor.dateOfBirth || advisor.date_of_birth)} />
              </Section>

              <Section icon={Shield} title="Account Status">
                <DRow
                  label="Status"
                  value={statusCfg.label}
                  badge={{ bg: statusCfg.bg, color: statusCfg.color }}
                />
                <DRow label="Active"     value={boolLabel(advisor.isActive)} highlight={advisor.isActive} />
                <DRow label="Suspended"  value={boolLabel(isSuspended)} />
                {isSuspended && (
                  <>
                    <DRow label="Suspended At"     value={fmtDT(advisor.suspendedAt)} />
                    <DRow label="Suspension Reason" value={show(advisor.suspensionReason)} />
                    <DRow label="Suspended By"     value={show(advisor.suspendedBy)} />
                  </>
                )}
                <DRow label="Join Date"   value={fmtDate(advisor.joinDate)} />
                <DRow label="Created At"  value={fmtDT(advisor.createdAt)} />
                <DRow label="Advisor ID"  value={show(advisor._id)} copy />
              </Section>

            </div>
          )}

          {/* â”€â”€ WORK INFO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === "work" && (
            <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              <Section icon={Briefcase} title="Work Details">
                <DRow label="Department"        value={show(advisor.department)} />
                <DRow label="Designation"       value={show(advisor.designation)} />
                <DRow label="Employee ID"       value={show(advisor.employeeId || advisor.employee_id)} copy />
                <DRow label="Reporting Manager" value={show(advisor.reportingManager || advisor.reporting_manager)} />
                <DRow label="Office Location"   value={show(advisor.officeLocation || advisor.office_location)} />
                <DRow label="Join Date"         value={fmtDate(advisor.joinDate)} />
                <DRow label="Employment Type"   value={show(advisor.employmentType || advisor.employment_type)} />
                <DRow label="Experience (yrs)"  value={show(advisor.experienceYears || advisor.experience_years)} />
              </Section>

              <Section icon={Star} title="Skills & Expertise">
                {advisor.skills?.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 6 }}>
                    {advisor.skills.map((skill, i) => (
                      <span key={i} style={{ padding: "4px 12px", borderRadius: 99, background: C.primarySoft, color: C.primary, fontSize: 12, fontWeight: 600, border: `1px solid ${C.primaryBord}` }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : <EmptyNote msg="No skills listed" />}

                {advisor.certifications?.length > 0 && (
                  <>
                    <GroupLabel label="Certifications" />
                    {advisor.certifications.map((cert, i) => (
                      <DRow key={i} label={cert.name || `Cert ${i + 1}`} value={fmtDate(cert.expiryDate)} />
                    ))}
                  </>
                )}

                {advisor.languages?.length > 0 && (
                  <>
                    <GroupLabel label="Languages" />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 6 }}>
                      {advisor.languages.map((lang, i) => (
                        <span key={i} style={{ padding: "4px 12px", borderRadius: 99, background: "#EFF6FF", color: "#1D4ED8", fontSize: 12, fontWeight: 600, border: "1px solid #BFDBFE" }}>
                          {lang}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </Section>

            </div>
          )}

          {/* â”€â”€ LEADS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === "leads" && (
            <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              <Section icon={BarChart2} title="Leads Capacity">
                <DRow label="Current Leads"   value={show(advisor.currentLeads ?? 0)} />
                <DRow label="Max Capacity"    value={show(advisor.maxLeadsCapacity) || "—"} />
                <DRow label="Available Slots" value={maxLeads ? String(maxLeads - currentLeads) : "—"} />
                <DRow label="Utilisation"     value={maxLeads ? `${Math.round(leadsPct)}%` : "—"} />

                {/* Visual bar */}
                {maxLeads > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: C.gray, fontWeight: 600 }}>Capacity Utilisation</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: leadsPct >= 85 ? C.red : leadsPct >= 60 ? C.amber : C.primary }}>
                        {Math.round(leadsPct)}%
                      </span>
                    </div>
                    <div style={{ background: "#F3F4F6", borderRadius: 99, height: 10 }}>
                      <div style={{
                        width: `${leadsPct}%`,
                        background: leadsPct >= 85 ? C.red : leadsPct >= 60 ? C.amber : C.primary,
                        height: "100%", borderRadius: 99, transition: "width .4s",
                      }} />
                    </div>

                    {/* Legend */}
                    <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                      {[
                        { color: C.primary, label: "Normal (< 60%)" },
                        { color: C.amber,   label: "High (60—85%)"  },
                        { color: C.red,     label: "Full (> 85%)"   },
                      ].map((l) => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.gray }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Section>

              <Section icon={TrendingUp} title="Performance">
                <DRow label="Total Leads Handled"   value={show(advisor.totalLeadsHandled   || advisor.total_leads_handled)} />
                <DRow label="Successful Closures"   value={show(advisor.successfulClosures  || advisor.successful_closures)} />
                <DRow label="Conversion Rate"       value={advisor.conversionRate ? `${advisor.conversionRate}%` : null} />
                <DRow label="Avg Response Time"     value={show(advisor.avgResponseTime     || advisor.avg_response_time)} />
                <DRow label="Customer Rating"       value={show(advisor.customerRating      || advisor.customer_rating)} />
                <DRow label="Leads This Month"      value={show(advisor.leadsThisMonth      || advisor.leads_this_month)} />
                <DRow label="Leads This Quarter"    value={show(advisor.leadsThisQuarter    || advisor.leads_this_quarter)} />
              </Section>

            </div>
          )}

          {/* â”€â”€ SYSTEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === "system" && (
            <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              <Section icon={Shield} title="System Information">
                <DRow label="Advisor ID"  value={show(advisor._id)} copy />
                <DRow label="Version"     value={advisor.__v !== undefined ? `v${advisor.__v}` : null} />
                <DRow label="Created At"  value={fmtDT(advisor.createdAt)} />
                <DRow label="Updated At"  value={fmtDT(advisor.updatedAt)} />
                <DRow label="Last Login"  value={fmtDT(advisor.lastLogin || advisor.last_login)} />
                <DRow label="Created By"  value={show(advisor.createdBy || advisor.created_by)} />
                <DRow label="Role"        value={show(advisor.role?.name || advisor.role)} />
                <DRow label="Role ID"     value={show(advisor.role?._id || advisor.roleId)} copy />
                <DRow label="Deleted"     value={boolLabel(advisor.isDeleted)} />
              </Section>

              <Section icon={Activity} title="Account Flags">
                <FlagRow label="Account Active" value={advisor.isActive}    icon={CheckCircle} />
                <FlagRow label="Suspended"      value={isSuspended}          icon={PauseCircle} invert />
                <FlagRow label="Email Verified" value={advisor.isEmailVerified} icon={Mail} />
                <FlagRow label="Phone Verified" value={advisor.isPhoneVerified} icon={Phone} />
                <FlagRow label="Profile Complete" value={advisor.isProfileComplete} icon={Star} />
                <FlagRow label="Deleted"        value={advisor.isDeleted}    icon={Trash2} invert />
              </Section>

            </div>
          )}

        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SUSPEND MODAL
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {suspendModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 18, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}>
            {/* Accent bar */}
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
                  style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 18, lineHeight: 1 }}>âœ•</button>
              </div>

              {/* Warning banner */}
              <div style={{ background: C.orangeSoft, border: `1px solid ${C.orangeBord}`, borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#92400e", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} color={C.orange} />
                <span>This advisor will lose access to the system until reactivated. Active leads will be flagged for reassignment.</span>
              </div>

              {/* Reason input */}
              <label style={{ display: "block", fontWeight: 600, color: C.text, marginBottom: 6, fontSize: 13 }}>
                Suspension Reason <span style={{ color: C.textMuted, fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="e.g. Under compliance review, awaiting documentation…"
                style={{ width: "100%", border: `1px solid ${C.grayBord}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: C.text }}
              />
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
// â”€â”€ Sub-components (identical pattern to PartnerDetail) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
      <span style={{ fontSize: 12, color: C.gray, fontWeight: 500, minWidth: 140, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {badge && !isMissing ? (
          <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color }}>{display}</span>
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
            {expired && !isMissing
              ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} color={C.red} /> {display}</span>
              : display}
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

// Missing import placeholder
function ExternalLink({ size }) {
  return <span style={{ fontSize: size, lineHeight: 1 }}>â†—</span>;
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
    <p style={{ fontSize: 11, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: ".06em", margin: "14px 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
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

// invert=true means "true is bad" (e.g. Suspended, Deleted)
function FlagRow({ label, value, icon: Icon, invert = false }) {
  const isTrue  = value === true;
  const isFalse = value === false;
  const isNull  = !isTrue && !isFalse;
  const good    = invert ? isFalse : isTrue;
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