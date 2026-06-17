// OpsCaseDetails.jsx
// ─── Light‑theme Ops Case Analysis (static demo) ────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, User, Mail, Phone, Home, DollarSign, FileText,
  Eye, RefreshCw, CheckCircle, AlertTriangle, XCircle,
  Layers, BarChart2, Shield, Activity, Check, Copy, Info,
  MapPin, Calendar, ClipboardList,
  Percent, MessageSquare, ExternalLink, Clock,
  Edit2, Save, X, Target, Briefcase, PieChart, TrendingDown, Search,
  Hash, Award,
} from "lucide-react";

// ─── Design Tokens ───────────────────────────────────────────────────────────
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
  redBord     : "#FECACA",
  amber       : "#F59E0B",
  amberSoft   : "#FFFBEB",
  amberBord   : "#FDE68A",
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const show      = (v) => (v !== null && v !== undefined && v !== "") ? v : null;
const fmt       = (n) => n ? Number(n).toLocaleString("en-AE") : "—";
const fmtDate   = (s) => { try { return s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null; } catch { return null; } };
const fmtDT     = (s) => { try { return s ? new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null; } catch { return null; } };
const boolLabel = (v) => v === true ? "Yes" : v === false ? "No" : null;
const capWords  = (s) => s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;

const STATUS_CFG = {
  "New"              : { bg: "#EFF6FF", color: "#1D4ED8", border: "#93C5FD" },
  "Under Review"     : { bg: C.primarySoft, color: C.primary, border: C.primaryBord },
  "Approved"         : { bg: C.greenSoft, color: C.green, border: C.greenBord },
  "Rejected"         : { bg: C.redSoft, color: C.red, border: C.redBord },
  "More Info Needed" : { bg: C.amberSoft, color: "#B45309", border: C.amberBord },
};

// ─── Static Case Data ────────────────────────────────────────────────────────
const STATIC_CASE = {
  _id      : "69e8961ab961e908fb09a471",
  caseRef  : "VAULT-CASE-2024-0042",
  status   : "Approved",
  priority : "High",
  loanAmount: 1600000,

  applicantInfo: {
    fullName           : "Ahmed Al-Rashid",
    preferredName      : "Ahmed",
    email              : "ahmed.rashid@email.ae",
    mobileNumber       : "+971 50 123 4567",
    alternativePhone   : "+971 55 987 6543",
    whatsappNumber     : "+971 50 123 4567",
    dateOfBirth        : "1985-03-15T00:00:00.000Z",
    nationality        : "United Arab Emirates",
    maritalStatus      : "Married",
    numberOfDependents : 3,
    employer           : "ADNOC",
    occupation         : "Senior Petroleum Engineer",
    monthlySalary      : 42000,
    otherIncome        : 5000,
    existingLoans      : 200000,
    creditScore        : 782,
    employmentType     : "Salaried",
  },

  propertyDetails: {
    propertyType      : "Apartment",
    propertySubtype   : "Penthouse",
    propertyValue     : 2200000,
    downPayment       : 600000,
    loanAmountRequired: 1600000,
    propertyAgeYears  : 3,
    isOffPlan         : false,
    completionDate    : "2025-12-01T00:00:00.000Z",
    address: {
      building: "The Address Residence",
      area    : "Dubai Marina",
      city    : "Dubai",
    },
  },

  financials: {
    totalIncome         : 47000,
    monthlyObligations  : 8500,
    disposableIncome    : 38500,
    monthlyEMI          : 7200,
    ltv                 : 72.7,
    dbr                 : 33.4,
    creditScore         : 782,
    existingLoanBalance : 200000,
    netMonthlyIncome    : 42000,
    otherIncome         : 5000,
  },

  documents: [
    { fileName: "Salary Certificate.pdf",        documentType: "Salary Certificate",  url: "#", status: "Verified",  uploadedAt: "2025-05-10T08:00:00Z" },
    { fileName: "Emirates ID - Front.jpg",        documentType: "Emirates ID (Front)", url: "#", status: "Verified",  uploadedAt: "2025-05-10T08:05:00Z" },
    { fileName: "Emirates ID - Back.jpg",         documentType: "Emirates ID (Back)",  url: "#", status: "Verified",  uploadedAt: "2025-05-10T08:06:00Z" },
    { fileName: "Bank Statements - 6 Months.pdf", documentType: "Bank Statements",    url: "#", status: "Verified",  uploadedAt: "2025-05-11T09:00:00Z" },
    { fileName: "Passport - All Pages.pdf",       documentType: "Passport",           url: "#", status: "Verified",  uploadedAt: "2025-05-11T09:10:00Z" },
    { fileName: "Payslips - Last 3 Months.pdf",   documentType: "Payslips",           url: "#", status: "Pending",   uploadedAt: "2025-05-12T10:00:00Z" },
    { fileName: "Credit Bureau Report.pdf",       documentType: "Credit Report",      url: "#", status: "Verified",  uploadedAt: "2025-05-12T11:00:00Z" },
  ],

  analysis: {
    riskScore          : 78,
    riskCategory       : "Low-Medium Risk",
    approvalDecision   : "Approved",
    confidenceScore    : 91,
    recommendedAction  : "Proceed with full mortgage approval. Excellent credit profile with strong income and manageable DBR.",
    analysisNotes      : "LTV at 72.7% is within acceptable thresholds. DBR of 33.4% is well below the UAE standard limit of 50%. Credit score of 782 indicates excellent repayment history. All primary documents verified and compliant. Applicant employed with ADNOC — stable government-linked employer. Recommend proceeding with final bank submission.",
    strengths          : [
      "Strong credit score (782)",
      "Stable employer (ADNOC — government-linked)",
      "DBR well below 50% UAE limit",
      "6 months banking history verified",
      "High disposable income: AED 38,500/month",
    ],
    risks              : [
      "LTV approaching 75% threshold",
      "Existing loan balance of AED 200,000",
      "One payslip document still pending",
    ],
    reviewedBy         : "Fatima Al-Mansouri",
    reviewedAt         : "2025-05-20T14:30:00.000Z",
    analysedByAI       : true,
  },

  bankDetails: {
    preferredBanks        : ["Emirates NBD", "ADCB", "FAB"],
    preferredTenureYears  : 25,
    preferredInterestType : "Fixed",
    feeFinancingPreference: true,
    lifeInsurance         : true,
    propertyInsurance     : true,
  },

  assignedTo: {
    advisorName : "Fatima Al-Mansouri",
    advisorId   : "69e76a62f2f06afbc8c36a22",
    assignedAt  : "2025-05-01T09:00:00.000Z",
  },

  sla: {
    breached      : false,
    deadline      : "2025-06-15T10:00:00.000Z",
    firstContactAt: "2025-05-02T10:30:00.000Z",
    reminderCount : 1,
  },

  sourceInfo: {
    source        : "Referral Partner",
    submittedBy   : "Khalid Investments LLC",
    referralType  : "Referral + Documents",
    commissionTier: "80%",
  },

  notesToXoto : "Customer is highly qualified. Pre-approved at Emirates NBD in 2022 for a similar property. Motivated buyer with clear timeline.",
  createdAt   : "2025-05-01T08:00:00.000Z",
  updatedAt   : "2025-05-20T14:30:00.000Z",
};

// ─── Analysis steps ───────────────────────────────────────────────────────────
const ANALYSIS_STEPS = [
  { label: "Fetching case data",           icon: "📂", delay: 400  },
  { label: "Verifying uploaded documents", icon: "📄", delay: 900  },
  { label: "Checking credit score",        icon: "💳", delay: 1500 },
  { label: "Calculating DBR & LTV",        icon: "📊", delay: 2100 },
  { label: "Assessing financial risk",     icon: "⚖️",  delay: 2700 },
  { label: "Generating AI recommendation", icon: "🤖", delay: 3300 },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function OpsCaseDetails() {
  const navigate = useNavigate();

  const [stage,          setStage]          = useState("analyzing");
  const [stepsCompleted, setStepsCompleted] = useState([]);
  const [caseData]                          = useState(STATIC_CASE);
  const [activeTab,      setActiveTab]      = useState("overview");
  const [analysis,       setAnalysis]       = useState(STATIC_CASE.analysis);

  // Edit modal state
  const [editOpen,       setEditOpen]       = useState(false);
  const [editSaving,     setEditSaving]     = useState(false);
  const [editForm,       setEditForm]       = useState({});
  const [flashMsg,       setFlashMsg]       = useState({ type: "", text: "" });

  const flash = (type, text) => {
    setFlashMsg({ type, text });
    setTimeout(() => setFlashMsg({ type: "", text: "" }), 4000);
  };

  // ── Run analysis animation ─────────────────────────────────────────────────
  useEffect(() => {
    const timers = ANALYSIS_STEPS.map((step, i) =>
      setTimeout(() => setStepsCompleted((prev) => [...prev, i]), step.delay)
    );
    const doneTimer = setTimeout(() => setStage("done"), 4200);
    return () => { timers.forEach(clearTimeout); clearTimeout(doneTimer); };
  }, []);

  const progressPct = (stepsCompleted.length / ANALYSIS_STEPS.length) * 100;

  // ── Edit modal handlers ─────────────────────────────────────────────────────
  const openEdit = () => {
    setEditForm({
      riskScore        : analysis.riskScore,
      approvalDecision : analysis.approvalDecision,
      recommendedAction: analysis.recommendedAction,
      analysisNotes    : analysis.analysisNotes,
      riskCategory     : analysis.riskCategory,
      confidenceScore  : analysis.confidenceScore,
      ltv              : caseData.financials.ltv,
      dbr              : caseData.financials.dbr,
    });
    setEditOpen(true);
  };

  const ef = (key) => (v) => setEditForm((p) => ({ ...p, [key]: v }));

  const handleEditSave = () => {
    if (!editForm.riskScore || !editForm.approvalDecision) {
      flash("error", "Risk score and decision are required");
      return;
    }
    setEditSaving(true);
    setTimeout(() => {
      setAnalysis((prev) => ({ ...prev, ...editForm }));
      flash("success", "Analysis updated successfully!");
      setEditSaving(false);
      setEditOpen(false);
    }, 700);
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const applicant = caseData.applicantInfo;
  const property  = caseData.propertyDetails;
  const fin       = caseData.financials;
  const docs      = caseData.documents;
  const bank      = caseData.bankDetails;
  const si        = caseData.sourceInfo;
  const at        = caseData.assignedTo;
  const sla       = caseData.sla;
  const status    = caseData.status;
  const statusCfg = STATUS_CFG[status] || { bg: C.grayLight, color: C.text, border: C.grayBord };

  const docsVerified = docs.filter((d) => d.status === "Verified").length;
  const docsPending  = docs.filter((d) => d.status === "Pending").length;
  const docsRejected = docs.filter((d) => d.status === "Rejected").length;

  const TABS = [
    { id: "overview",  label: "Overview",   icon: Layers        },
    { id: "applicant", label: "Applicant",  icon: User          },
    { id: "property",  label: "Property",   icon: Home          },
    { id: "financial", label: "Financials", icon: DollarSign    },
    { id: "documents", label: "Documents",  icon: FileText      },
    { id: "analysis",  label: "Analysis",   icon: PieChart      },
    { id: "status",    label: "Status",     icon: ClipboardList },
  ];

  const DECISION_OPTIONS = ["Approved", "Rejected", "More Info Needed", "Under Review"];

  // ══════════════════════════════════════════════════════════════════════════
  // 1. ANALYZING SCREEN (light theme)
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === "analyzing") {
    return (
      <div style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        padding: 24,
      }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes fadeInUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        `}</style>

        <div style={{
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.grayBord}`,
          boxShadow: "0 8px 30px rgba(92,3,155,0.08)",
          maxWidth: 520,
          width: "100%",
          padding: "36px 28px",
          textAlign: "center",
          animation: "fadeInUp 0.4s ease",
        }}>
          {/* Animated icon */}
          <div style={{ marginBottom: 28, position: "relative", display: "inline-flex" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: C.primarySoft,
              border: `1px solid ${C.primaryBord}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Search size={32} color={C.primary} />
            </div>
            <div style={{
              position: "absolute", inset: -6,
              borderRadius: "50%",
              border: "2px solid #E9D5FF",
              borderTopColor: C.primary,
              animation: "spin 2s linear infinite",
            }} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 6 }}>
            Analyzing Application
          </h2>
          <p style={{ fontSize: 14, color: C.gray, marginBottom: 32, lineHeight: 1.5 }}>
            Running AI‑powered analysis on applicant profile,<br />
            financial ratios, and document integrity...
          </p>

          {/* Progress steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
            {ANALYSIS_STEPS.map((step, i) => {
              const done    = stepsCompleted.includes(i);
              const current = stepsCompleted.length === i;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 10,
                  background: done ? C.greenSoft : current ? C.primarySoft : C.grayLight,
                  border: `1px solid ${done ? C.greenBord : current ? C.primaryBord : C.grayBord}`,
                  transition: "background .4s, border .4s",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: done ? C.greenSoft : current ? C.primarySoft : "#fff",
                    border: `1.5px solid ${done ? C.greenBord : current ? C.primaryBord : C.grayBord}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {done    ? <CheckCircle size={14} color={C.green} />
                     : current ? <RefreshCw  size={12} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
                     : <span style={{ fontSize: 14 }}>{step.icon}</span>}
                  </div>
                  <span style={{
                    flex: 1, fontSize: 13, fontWeight: done ? 600 : 400,
                    color: done ? C.green : current ? C.primary : C.gray,
                  }}>
                    {step.label}
                  </span>
                  {done    && <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>Done</span>}
                  {current && <span style={{ fontSize: 11, color: C.primary, opacity: 0.8 }}>Processing...</span>}
                </div>
              );
            })}
          </div>

          {/* Overall progress bar */}
          <div style={{ marginTop: 28, background: C.grayLight, borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${C.primaryMid}, ${C.primaryLight})`,
              borderRadius: 99,
              transition: "width .5s ease",
            }} />
          </div>
          <p style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>
            {Math.round(progressPct)}% complete
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. FULL CASE DETAIL VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        .moc-tab:hover   { background: ${C.primaryGlow} !important; color: ${C.primary} !important; }
        .moc-stat:hover  { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(92,3,155,0.1) !important; }
        .doc-card:hover  { border-color: ${C.primaryBord} !important; box-shadow: 0 4px 16px rgba(92,3,155,0.08) !important; }
        .moc-row:last-child { border-bottom: none !important; }
        .moc-copy:hover  { color: ${C.primary} !important; background: ${C.primarySoft} !important; }
        .edit-inp:focus  { border-color: ${C.primary} !important; box-shadow: 0 0 0 3px rgba(92,3,155,0.1) !important; outline: none; }
        .back-btn:hover  { border-color: ${C.primaryBord} !important; color: ${C.primary} !important; background: ${C.primarySoft} !important; }
        .edit-btn:hover  { opacity: .88; transform: translateY(-1px); }
        .strength-row:hover { background: ${C.greenSoft} !important; }
        .risk-row:hover     { background: ${C.amberSoft} !important; }
        @media(max-width:768px){ .moc-grid{ grid-template-columns:1fr !important; } .moc-stats{ grid-template-columns:1fr 1fr !important; } }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button className="back-btn" onClick={() => navigate(-1)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: C.white, border: `1px solid ${C.grayBord}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.textSub, cursor: "pointer", transition: "all .2s" }}>
            <ChevronLeft size={15} /> Back to Applications
          </button>

          <button className="edit-btn" onClick={openEdit}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMid})`, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 14px rgba(92,3,155,0.3)", transition: "all .2s" }}>
            <Edit2 size={14} /> Edit Analysis
          </button>
        </div>

        {/* ── Flash ── */}
        {flashMsg.text && (
          <div style={{ marginBottom: 14, padding: "10px 16px", borderRadius: 10, fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: flashMsg.type === "success" ? C.greenSoft : C.redSoft, color: flashMsg.type === "success" ? "#065F46" : "#991B1B", border: `1px solid ${flashMsg.type === "success" ? C.greenBord : C.redBord}`, animation: "fadeIn .3s ease" }}>
            {flashMsg.type === "success" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            {flashMsg.text}
          </div>
        )}

        {/* ── SLA banner ── */}
        {sla.breached && (
          <div style={{ marginBottom: 14, padding: "10px 16px", borderRadius: 10, background: C.redSoft, color: "#991B1B", border: `1px solid ${C.redBord}`, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <AlertTriangle size={15} /> SLA Breached — This application requires immediate attention.
          </div>
        )}

        {/* PROFILE HEADER */}
        <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.grayBord}`, marginBottom: 16, overflow: "hidden", boxShadow: "0 2px 16px rgba(92,3,155,0.06)", animation: "fadeUp .4s ease" }}>
          <div style={{ height: 5, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid}, ${C.primaryLight})` }} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "24px 28px 22px", flexWrap: "wrap" }}>
            <div style={{ width: 76, height: 76, borderRadius: 18, background: C.primarySoft, border: `2px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Briefcase size={32} color={C.primary} />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-.4px" }}>
                  {applicant.fullName}
                </h1>
                <StatusPill bg={statusCfg.bg} color={statusCfg.color} label={status} dot />
                <StatusPill bg={C.amberSoft} color="#B45309" label={`AED ${fmt(caseData.loanAmount)}`} />
                <StatusPill bg={C.redSoft}   color={C.red}    label={`${caseData.priority} Priority`} />
                <StatusPill bg={C.primarySoft} color={C.primary} label="🤖 AI Analysed" />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
                <InfoChip icon={Mail}     value={applicant.email} />
                <InfoChip icon={Phone}    value={applicant.mobileNumber} />
                <InfoChip icon={Home}     value={`${property.propertyType} · ${property.address.area}`} />
                <InfoChip icon={Calendar} value={`Created ${fmtDate(caseData.createdAt)}`} />
                <InfoChip icon={Hash}     value={`Ref: ${caseData.caseRef}`} />
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Assigned To</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{at.advisorName}</div>
              <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{fmtDate(at.assignedAt)}</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.greenSoft, padding: "3px 10px", borderRadius: 99, border: `1px solid ${C.greenBord}` }}>
                  ✓ {analysis.confidenceScore}% Confidence
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="moc-stats" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 16 }}>
          <StatTile icon={DollarSign}   color={C.primary} label="Loan Amount"    value={`AED ${fmt(caseData.loanAmount)}`} />
          <StatTile icon={Home}         color={C.green}   label="Property Value" value={`AED ${fmt(property.propertyValue)}`} />
          <StatTile icon={TrendingDown} color="#0891B2"   label="LTV"            value={`${fin.ltv}%`} />
          <StatTile icon={BarChart2}    color={C.amber}   label="DBR"            value={`${fin.dbr}%`} />
          <StatTile icon={Award}        color="#DB2777"   label="Risk Score"     value={`${analysis.riskScore}/100`} />
          <StatTile icon={Shield}       color={C.green}   label="SLA"            value="On Track" />
        </div>

        {/* TABS */}
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, padding: "4px 6px", display: "flex", gap: 2, marginBottom: 16, overflowX: "auto" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon   = tab.icon;
            return (
              <button key={tab.id} className="moc-tab" onClick={() => setActiveTab(tab.id)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none", background: active ? C.primarySoft : "transparent", color: active ? C.primary : C.gray, fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s", borderBottom: active ? `2px solid ${C.primary}` : "2px solid transparent" }}>
                <Icon size={14} /> {tab.label}
                {tab.id === "documents" && docs.length > 0 && (
                  <span style={{ background: C.primarySoft, color: C.primary, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99, border: `1px solid ${C.primaryBord}` }}>{docs.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        <div style={{ animation: "fadeUp .3s ease" }} key={activeTab}>
          {activeTab === "overview" && (
            <div className="moc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Section icon={User} title="Applicant Summary">
                <DRow label="Full Name"      value={applicant.fullName} />
                <DRow label="Email"          value={applicant.email} copy />
                <DRow label="Mobile"         value={applicant.mobileNumber} copy />
                <DRow label="Employer"       value={applicant.employer} />
                <DRow label="Occupation"     value={applicant.occupation} />
                <DRow label="Monthly Salary" value={`AED ${fmt(applicant.monthlySalary)}`} />
                <DRow label="Credit Score"   value={applicant.creditScore} />
                <DRow label="Nationality"    value={applicant.nationality} />
              </Section>
              <Section icon={Home} title="Property Summary">
                <DRow label="Type"          value={`${property.propertyType} · ${property.propertySubtype}`} />
                <DRow label="Location"      value={`${property.address.area}, ${property.address.city}`} />
                <DRow label="Value"         value={`AED ${fmt(property.propertyValue)}`} />
                <DRow label="Down Payment"  value={`AED ${fmt(property.downPayment)}`} />
                <DRow label="Loan Amount"   value={`AED ${fmt(caseData.loanAmount)}`} />
                <DRow label="Completion"    value={fmtDate(property.completionDate)} />
                <DRow label="Property Age"  value={`${property.propertyAgeYears} years`} />
                <DRow label="Off-Plan"      value={boolLabel(property.isOffPlan)} />
              </Section>
              <Section icon={BarChart2} title="Financial Ratios">
                <RatioBar label="Loan-to-Value (LTV)"     value={fin.ltv} maxGood={75} unit="%" />
                <RatioBar label="Debt Burden Ratio (DBR)" value={fin.dbr} maxGood={50} unit="%" />
                <div style={{ height: 8 }} />
                <DRow label="Monthly Obligations" value={`AED ${fmt(fin.monthlyObligations)}`} />
                <DRow label="Monthly EMI"         value={`AED ${fmt(fin.monthlyEMI)}`} />
                <DRow label="Disposable Income"   value={`AED ${fmt(fin.disposableIncome)}`} />
              </Section>
              <Section icon={PieChart} title="AI Analysis Result">
                <DRow label="Risk Score"    value={`${analysis.riskScore}/100`} />
                <DRow label="Risk Category" value={analysis.riskCategory} />
                <DRow label="Decision"      value={analysis.approvalDecision}
                  badge={analysis.approvalDecision === "Approved"
                    ? { bg: C.greenSoft,  color: C.green }
                    : analysis.approvalDecision === "Rejected"
                    ? { bg: C.redSoft,    color: C.red   }
                    : { bg: C.amberSoft,  color: "#B45309" }} />
                <DRow label="Confidence"    value={`${analysis.confidenceScore}%`} />
                <DRow label="Reviewed By"   value={analysis.reviewedBy} />
                <DRow label="Reviewed At"   value={fmtDT(analysis.reviewedAt)} />
                <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: C.primarySoft, border: `1px solid ${C.primaryBord}`, fontSize: 13, color: C.textSub, lineHeight: 1.7 }}>
                  {analysis.recommendedAction}
                </div>
              </Section>
            </div>
          )}

          {activeTab === "applicant" && (
            <Section icon={User} title="Full Applicant Details">
              <div className="moc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
                <DRow label="Full Name"         value={applicant.fullName} />
                <DRow label="Preferred Name"    value={applicant.preferredName} />
                <DRow label="Date of Birth"     value={fmtDate(applicant.dateOfBirth)} />
                <DRow label="Nationality"       value={applicant.nationality} />
                <DRow label="Marital Status"    value={applicant.maritalStatus} />
                <DRow label="Email"             value={applicant.email} copy />
                <DRow label="Mobile"            value={applicant.mobileNumber} copy />
                <DRow label="Alt. Phone"        value={applicant.alternativePhone} />
                <DRow label="WhatsApp"          value={applicant.whatsappNumber} />
                <DRow label="Occupation"        value={applicant.occupation} />
                <DRow label="Employment Type"   value={applicant.employmentType} />
                <DRow label="Monthly Salary"    value={`AED ${fmt(applicant.monthlySalary)}`} />
                <DRow label="Other Income"      value={`AED ${fmt(applicant.otherIncome)}`} />
                <DRow label="Existing Loans"    value={`AED ${fmt(applicant.existingLoans)}`} />
                <DRow label="Credit Score"      value={applicant.creditScore} />
              </div>
            </Section>
          )}

          {activeTab === "property" && (
            <div className="moc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Section icon={Home} title="Property Details">
                <DRow label="Type"            value={property.propertyType} />
                <DRow label="Subtype"         value={property.propertySubtype} />
                <DRow label="Value"           value={`AED ${fmt(property.propertyValue)}`} />
                <DRow label="Down Payment"    value={`AED ${fmt(property.downPayment)}`} />
                <DRow label="Loan Required"   value={`AED ${fmt(caseData.loanAmount)}`} />
                <DRow label="Age (years)"     value={property.propertyAgeYears} />
                <DRow label="Off-Plan"        value={boolLabel(property.isOffPlan)} />
                <DRow label="Completion Date" value={fmtDate(property.completionDate)} />
              </Section>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Section icon={MapPin} title="Property Address">
                  <DRow label="Building" value={property.address.building} />
                  <DRow label="Area"     value={property.address.area} />
                  <DRow label="City"     value={property.address.city} />
                </Section>
                <Section icon={Target} title="Bank Preferences">
                  <DRow label="Preferred Banks"   value={bank.preferredBanks.join(", ")} />
                  <DRow label="Tenure"            value={`${bank.preferredTenureYears} years`} />
                  <DRow label="Rate Type"         value={bank.preferredInterestType} />
                  <DRow label="Fee Financing"     value={boolLabel(bank.feeFinancingPreference)} highlight={bank.feeFinancingPreference} />
                  <DRow label="Life Insurance"    value={boolLabel(bank.lifeInsurance)} highlight={bank.lifeInsurance} />
                  <DRow label="Property Insurance"value={boolLabel(bank.propertyInsurance)} highlight={bank.propertyInsurance} />
                </Section>
              </div>
            </div>
          )}

          {activeTab === "financial" && (
            <div className="moc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Section icon={DollarSign} title="Income & Obligations">
                <DRow label="Monthly Salary"       value={`AED ${fmt(applicant.monthlySalary)}`} />
                <DRow label="Other Income"         value={`AED ${fmt(fin.otherIncome)}`} />
                <DRow label="Total Monthly Income" value={`AED ${fmt(fin.totalIncome)}`} />
                <DRow label="Monthly Obligations"  value={`AED ${fmt(fin.monthlyObligations)}`} />
                <DRow label="Monthly EMI"          value={`AED ${fmt(fin.monthlyEMI)}`} />
                <DRow label="Disposable Income"    value={`AED ${fmt(fin.disposableIncome)}`} />
                <DRow label="Existing Loan Balance"value={`AED ${fmt(applicant.existingLoans)}`} />
              </Section>
              <Section icon={BarChart2} title="Key Ratios & Scores">
                <RatioBar label="Loan-to-Value (LTV)"     value={fin.ltv} maxGood={75} unit="%" />
                <RatioBar label="Debt Burden Ratio (DBR)" value={fin.dbr} maxGood={50} unit="%" />
                <div style={{ height: 8 }} />
                <DRow label="Credit Score" value={applicant.creditScore} />
                <DRow label="Risk Score"   value={`${analysis.riskScore}/100`} />
                <DRow label="Risk Category"value={analysis.riskCategory} />
                <DRow label="Confidence"   value={`${analysis.confidenceScore}%`} />
              </Section>
            </div>
          )}

          {activeTab === "documents" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                <StatTile icon={FileText}    color={C.primary} label="Total"    value={docs.length} />
                <StatTile icon={CheckCircle} color={C.green}   label="Verified" value={docsVerified} />
                <StatTile icon={Clock}       color={C.amber}   label="Pending"  value={docsPending} />
                <StatTile icon={XCircle}     color={C.red}     label="Rejected" value={docsRejected} />
              </div>

              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grayBord}`, padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.textSub }}>Document Completion</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>{Math.round((docsVerified / docs.length) * 100)}%</span>
                </div>
                <div style={{ background: C.primaryBord, borderRadius: 99, height: 8 }}>
                  <div style={{ width: `${(docsVerified / docs.length) * 100}%`, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid})`, height: "100%", borderRadius: 99, transition: "width .4s" }} />
                </div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 6 }}>
                  {docsVerified} of {docs.length} documents verified
                </div>
              </div>

              <Section icon={FileText} title={`Documents (${docs.length})`}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {docs.map((doc, i) => <DocCard key={i} doc={doc} />)}
                </div>
              </Section>
            </div>
          )}

          {activeTab === "analysis" && (
            <div className="moc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Section icon={PieChart} title="AI Analysis Report">
                <DRow label="Risk Score"       value={`${analysis.riskScore}/100`} />
                <DRow label="Risk Category"    value={analysis.riskCategory} />
                <DRow label="Confidence Score" value={`${analysis.confidenceScore}%`} />
                <DRow label="Decision"         value={analysis.approvalDecision}
                  badge={analysis.approvalDecision === "Approved"
                    ? { bg: C.greenSoft,  color: C.green }
                    : analysis.approvalDecision === "Rejected"
                    ? { bg: C.redSoft,    color: C.red   }
                    : { bg: C.amberSoft,  color: "#B45309" }} />
                <DRow label="Reviewed By"  value={analysis.reviewedBy} />
                <DRow label="Reviewed At"  value={fmtDT(analysis.reviewedAt)} />
                <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 10, background: C.primarySoft, border: `1px solid ${C.primaryBord}`, fontSize: 13, color: C.textSub, lineHeight: 1.8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Recommended Action</div>
                  {analysis.recommendedAction}
                </div>
                <div style={{ marginTop: 10, padding: "14px 16px", borderRadius: 10, background: C.grayLight, border: `1px solid ${C.grayBord}`, fontSize: 13, color: C.textSub, lineHeight: 1.8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Analysis Notes</div>
                  {analysis.analysisNotes}
                </div>
              </Section>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Section icon={CheckCircle} title={`Strengths (${analysis.strengths.length})`}>
                  {analysis.strengths.map((s, i) => (
                    <div key={i} className="strength-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", borderRadius: 8, borderBottom: i < analysis.strengths.length - 1 ? `1px solid ${C.grayLight}` : "none", transition: "background .15s" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.greenSoft, border: `1px solid ${C.greenBord}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckCircle size={12} color={C.green} />
                      </div>
                      <span style={{ fontSize: 13, color: C.textSub }}>{s}</span>
                    </div>
                  ))}
                </Section>

                <Section icon={AlertTriangle} title={`Risk Factors (${analysis.risks.length})`}>
                  {analysis.risks.map((r, i) => (
                    <div key={i} className="risk-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", borderRadius: 8, borderBottom: i < analysis.risks.length - 1 ? `1px solid ${C.grayLight}` : "none", transition: "background .15s" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.amberSoft, border: `1px solid ${C.amberBord}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <AlertTriangle size={12} color={C.amber} />
                      </div>
                      <span style={{ fontSize: 13, color: C.textSub }}>{r}</span>
                    </div>
                  ))}
                </Section>

                <Section icon={MessageSquare} title="Notes to Xoto">
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: C.primarySoft, border: `1px solid ${C.primaryBord}`, fontSize: 13, color: C.textSub, lineHeight: 1.7 }}>
                    {caseData.notesToXoto}
                  </div>
                </Section>
              </div>
            </div>
          )}

          {activeTab === "status" && (
            <div className="moc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Section icon={ClipboardList} title="Application Status">
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, marginBottom: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: statusCfg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: C.gray }}>Current Status:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: statusCfg.color }}>{status}</span>
                </div>
                <DRow label="Application Reference"  value={caseData.caseRef} copy />
                <DRow label="Priority"        value={caseData.priority} />
                <DRow label="Created At"      value={fmtDT(caseData.createdAt)} />
                <DRow label="Last Updated"    value={fmtDT(caseData.updatedAt)} />
                <DRow label="Source"          value={si.source} />
                <DRow label="Submitted By"    value={si.submittedBy} />
                <DRow label="Referral Type"   value={si.referralType} />
                <DRow label="Commission Tier" value={si.commissionTier} />
              </Section>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Section icon={Clock} title="SLA Tracking">
                  <DRow label="SLA Breached"   value={boolLabel(sla.breached)} highlight={!sla.breached} />
                  <DRow label="Deadline"       value={fmtDT(sla.deadline)} />
                  <DRow label="First Contact"  value={fmtDT(sla.firstContactAt)} />
                  <DRow label="Reminders Sent" value={sla.reminderCount} />
                  <DRow label="Advisor"        value={at.advisorName} />
                  <DRow label="Assigned At"    value={fmtDate(at.assignedAt)} />
                </Section>

                <Section icon={Shield} title="System Info">
                  <DRow label="Application ID"   value={caseData._id} copy mono />
                  <DRow label="Application Ref"  value={caseData.caseRef} copy />
                  <DRow label="Advisor ID"value={at.advisorId} copy />
                </Section>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          EDIT ANALYSIS MODAL (custom, no Ant Design)
      ══════════════════════════════════════════════════════════════════ */}
      {editOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(3px)", animation: "fadeIn .2s ease" }}
          onClick={(e) => { if (e.target === e.currentTarget && !editSaving) setEditOpen(false); }}
        >
          <div style={{ background: C.white, borderRadius: 20, width: "100%", maxWidth: 680, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 100px rgba(0,0,0,0.28)", animation: "slideUp .25s ease" }}>
            <div style={{ height: 5, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryMid}, ${C.primaryLight})` }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${C.grayBord}`, background: C.grayLight }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.primarySoft, border: `1px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Edit2 size={16} color={C.primary} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Edit Analysis</div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 1 }}>Update AI analysis findings</div>
                </div>
              </div>
              <button onClick={() => !editSaving && setEditOpen(false)}
                style={{ background: "none", border: `1px solid ${C.grayBord}`, borderRadius: 8, cursor: "pointer", color: C.textMuted, padding: "5px 8px", display: "flex" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <EField label="Risk Score (0–100)">
                  <input className="edit-inp" type="number" min={0} max={100}
                    value={editForm.riskScore ?? ""}
                    onChange={(e) => ef("riskScore")(Number(e.target.value))}
                    style={inputStyle} />
                </EField>
                <EField label="Approval Decision">
                  <select className="edit-inp"
                    value={editForm.approvalDecision ?? ""}
                    onChange={(e) => ef("approvalDecision")(e.target.value)}
                    style={inputStyle}>
                    {DECISION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </EField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <EField label="Confidence Score (%)">
                  <input className="edit-inp" type="number" min={0} max={100}
                    value={editForm.confidenceScore ?? ""}
                    onChange={(e) => ef("confidenceScore")(Number(e.target.value))}
                    style={inputStyle} />
                </EField>
                <EField label="Risk Category">
                  <select className="edit-inp"
                    value={editForm.riskCategory ?? ""}
                    onChange={(e) => ef("riskCategory")(e.target.value)}
                    style={inputStyle}>
                    {["Low Risk","Low-Medium Risk","Medium Risk","High Risk"].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </EField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <EField label="LTV (%)">
                  <input className="edit-inp" type="number" min={0} max={100} step={0.1}
                    value={editForm.ltv ?? ""}
                    onChange={(e) => ef("ltv")(Number(e.target.value))}
                    style={inputStyle} />
                </EField>
                <EField label="DBR (%)">
                  <input className="edit-inp" type="number" min={0} max={100} step={0.1}
                    value={editForm.dbr ?? ""}
                    onChange={(e) => ef("dbr")(Number(e.target.value))}
                    style={inputStyle} />
                </EField>
              </div>

              <EField label="Recommended Action">
                <textarea className="edit-inp" rows={3}
                  value={editForm.recommendedAction ?? ""}
                  onChange={(e) => ef("recommendedAction")(e.target.value)}
                  style={{ ...inputStyle, resize: "vertical" }} />
              </EField>

              <EField label="Analysis Notes">
                <textarea className="edit-inp" rows={5}
                  value={editForm.analysisNotes ?? ""}
                  onChange={(e) => ef("analysisNotes")(e.target.value)}
                  style={{ ...inputStyle, resize: "vertical" }} />
              </EField>
            </div>

            <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.grayBord}`, background: C.grayLight, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => !editSaving && setEditOpen(false)} disabled={editSaving}
                style={{ padding: "10px 22px", borderRadius: 10, border: `1px solid ${C.grayBord}`, background: C.white, color: C.textSub, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                <X size={14} /> Cancel
              </button>
              <button onClick={handleEditSave} disabled={editSaving}
                style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: editSaving ? C.grayBord : `linear-gradient(135deg, ${C.primary}, ${C.primaryMid})`, color: editSaving ? C.textMuted : "#fff", fontWeight: 700, fontSize: 13, cursor: editSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: editSaving ? "none" : "0 2px 12px rgba(92,3,155,0.3)" }}>
                {editSaving
                  ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving...</>
                  : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared input style ──────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: 9,
  fontSize: 13,
  color: "#111827",
  fontFamily: "inherit",
  background: "#fff",
  boxSizing: "border-box",
  transition: "border-color .2s, box-shadow .2s",
};

// ════════════════════════════════════════════════════════════════════════════
// ── Sub‑components ────────────────────────────────────────────────────────────
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

function EField({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSub, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function DRow({ label, value, copy, badge, highlight, expired, mono }) {
  const [copied, setCopied] = useState(false);
  const raw     = (value === null || value === undefined || value === "") ? null : value;
  const display = raw !== null ? String(raw) : "—";
  const missing = display === "—";
  return (
    <div className="moc-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.grayLight}` }}>
      <span style={{ fontSize: 12, color: C.gray, fontWeight: 500, minWidth: 160, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end" }}>
        {badge && !missing ? (
          <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color }}>{display}</span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: missing ? 400 : 500, color: expired ? C.red : highlight ? C.green : missing ? C.textMuted : C.text, fontFamily: mono && !missing ? "'Courier New', monospace" : undefined, wordBreak: "break-all", textAlign: "right" }}>
            {display}
          </span>
        )}
        {copy && raw && (
          <button className="moc-copy" onClick={() => { navigator.clipboard.writeText(String(raw)); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
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
    <div className="moc-stat" style={{ background: C.white, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.grayBord}`, transition: "all .2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={12} color={color} />
        </div>
        <span style={{ fontSize: 10, color: C.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{value}</div>
    </div>
  );
}

function StatusPill({ bg, color, label, dot }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: bg, color }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />}
      {label}
    </span>
  );
}

function InfoChip({ icon: Icon, value }) {
  return value ? (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.gray }}>
      <Icon size={13} color={C.textMuted} /> {value}
    </div>
  ) : null;
}

function RatioBar({ label, value, maxGood, unit }) {
  const pct   = Math.min(Number(value) || 0, 100);
  const good  = pct <= maxGood;
  const color = good ? C.green : C.red;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
        <span style={{ color: C.gray, fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}{unit}</span>
      </div>
      <div style={{ background: C.grayBord, borderRadius: 99, height: 8 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .6s" }} />
      </div>
      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>
        {good ? `✓ Within limit (${maxGood}%)` : `⚠ Exceeds limit (${maxGood}%)`}
      </div>
    </div>
  );
}

function DocCard({ doc }) {
  const fileUrl = doc.url || doc.fileUrl;
  const isPdf   = fileUrl?.toLowerCase()?.includes(".pdf");
  const sCfg    = {
    Verified : { bg: C.greenSoft, color: C.green,    border: C.greenBord },
    Pending  : { bg: C.amberSoft, color: "#B45309",  border: C.amberBord },
    Rejected : { bg: C.redSoft,   color: C.red,      border: C.redBord   },
  }[doc.status] || { bg: C.grayLight, color: C.gray, border: C.grayBord };

  return (
    <div className="doc-card" style={{ background: C.white, borderRadius: 12, border: `1px solid ${doc.status === "Verified" ? C.greenBord : C.grayBord}`, padding: 16, display: "flex", flexDirection: "column", gap: 10, transition: "all .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: isPdf ? C.redSoft : C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${isPdf ? C.redBord : C.primaryBord}`, flexShrink: 0 }}>
          <FileText size={20} color={isPdf ? C.red : C.primary} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: C.text, lineHeight: 1.4 }}>{doc.fileName || "Document"}</div>
          {doc.documentType && <div style={{ fontSize: 11, color: C.primary, marginTop: 2 }}>{doc.documentType}</div>}
          {doc.uploadedAt   && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{fmtDate(doc.uploadedAt)}</div>}
        </div>
      </div>
      {doc.status && (
        <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: sCfg.bg, color: sCfg.color, border: `1px solid ${sCfg.border}`, alignSelf: "flex-start" }}>
          {doc.status}
        </span>
      )}
      <button
        onClick={() => fileUrl && window.open(fileUrl, "_blank")}
        disabled={!fileUrl}
        style={{ width: "100%", padding: "9px 0", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMid})`, color: "#fff", border: "none", borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Eye size={14} /> View Document
      </button>
    </div>
  );
}