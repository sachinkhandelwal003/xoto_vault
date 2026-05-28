import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ChevronLeft, User, Mail, Phone, Building2, MapPin,
  Calendar, FileText, DollarSign, Percent, CheckCircle,
  XCircle, Clock, Shield, RefreshCw, AlertCircle, Hash,
  Tag, Briefcase, Globe, Copy, ExternalLink, Star, Users
} from "lucide-react";
import { apiService } from "@/api/apiService";
import { message, Spin, Tag as AntTag, Modal, Input, Tabs } from "antd";
import dayjs from "dayjs";

const C = {
  primary: "#5C039B", primaryMid: "#7C3AED", primarySoft: "#F5F0FF",
  primaryBord: "#E9D5FF", green: "#10B981", greenSoft: "#ECFDF5",
  red: "#EF4444", redSoft: "#FEF2F2", amber: "#F59E0B", amberSoft: "#FFFBEB",
  blue: "#3B82F6", blueSoft: "#EFF6FF", gray: "#6B7280",
  grayLight: "#F9FAFB", grayBord: "#E5E7EB", text: "#111827",
  textMuted: "#9CA3AF", white: "#FFFFFF", bg: "#F4F0FA",
};

const show = (v) => (v !== null && v !== undefined && v !== "") ? v : null;
const fmtDate = (s) => { try { return s ? dayjs(s).format("DD MMM YYYY") : null; } catch { return null; } };
const fmtAED = (n) => (n !== undefined && n !== null) ? `AED ${Number(n).toLocaleString()}` : null;

const roleSlugMap = {
  0: "superadmin", 1: "admin", 18: "vault-admin", 23: "vault-ops"
};

// ── Info Row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, copy }) => {
  if (!show(value)) return null;
  const handleCopy = () => { navigator.clipboard.writeText(value); message.success("Copied!"); };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.grayBord}` }}>
      <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500, minWidth: 140 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: "right" }}>{value}</span>
        {copy && (
          <button onClick={handleCopy} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 0, display: "flex" }}>
            <Copy size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Section Card ──────────────────────────────────────────────────────────────
const SectionCard = ({ title, icon, color = C.primary, children }) => (
  <div style={{ background: C.white, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.grayBord}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
    <div style={{ background: `${color}0f`, borderBottom: `2px solid ${color}30`, padding: "12px 18px", display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ color }}>{icon}</div>
      <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{title}</span>
    </div>
    <div style={{ padding: "4px 18px 14px" }}>{children}</div>
  </div>
);

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    active: { bg: C.greenSoft, color: C.green, icon: <CheckCircle size={13} />, label: "Active" },
    pending: { bg: C.amberSoft, color: C.amber, icon: <Clock size={13} />, label: "Pending" },
    suspended: { bg: C.redSoft, color: C.red, icon: <XCircle size={13} />, label: "Suspended" },
    inactive: { bg: C.grayLight, color: C.gray, icon: <XCircle size={13} />, label: "Inactive" },
  };
  const c = cfg[status?.toLowerCase()] || cfg.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: c.bg, color: c.color, borderRadius: 20, padding: "4px 12px", fontWeight: 700, fontSize: 12 }}>
      {c.icon} {c.label}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function PartnerDetail() {
  const { partnerId, id: _id } = useParams();
  const id = partnerId || _id;
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const roleSlug = roleSlugMap[user?.role?.code] ?? "vault-admin";

  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [suspendModal, setSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPartner = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.get(`/vault/partner/get/${id}`);
      if (res?.success) {
        setPartner(res.data);
      } else {
        setError(res?.message || "Failed to load partner");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load partner details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchPartner(); }, [id]);

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      const res = await apiService.post(`/vault/partner/activate/${id}`);
      if (res?.success) { message.success("Partner activated"); fetchPartner(); }
      else message.error(res?.message || "Failed to activate");
    } catch (err) { message.error(err?.response?.data?.message || "Failed to activate"); }
    finally { setActionLoading(false); }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) { message.warning("Please provide a reason"); return; }
    setActionLoading(true);
    try {
      const res = await apiService.post(`/vault/partner/suspend/${id}`, { reason: suspendReason });
      if (res?.success) { message.warning("Partner suspended"); setSuspendModal(false); setSuspendReason(""); fetchPartner(); }
      else message.error(res?.message || "Failed to suspend");
    } catch (err) { message.error(err?.response?.data?.message || "Failed to suspend"); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
      <Spin size="large" />
    </div>
  );

  if (error || !partner) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
      <div style={{ textAlign: "center", background: C.white, borderRadius: 20, padding: 48, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <AlertCircle size={48} color={C.red} style={{ marginBottom: 16 }} />
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{error || "Partner not found"}</div>
        <button onClick={() => navigate(-1)} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 600 }}>
          Go Back
        </button>
      </div>
    </div>
  );

  const isCompany = partner.partnerCategory === "company";
  const displayName = isCompany
    ? (partner.companyName || partner.dbaName || "N/A")
    : `${partner.individualDetails?.firstName || ""} ${partner.individualDetails?.lastName || ""}`.trim() || "N/A";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const tabs = [
    { key: "overview", label: isCompany ? "Institutional Partner Info" : "Individual Partner Info" },
    { key: "contact", label: "Contact & Address" },
    { key: "commission", label: "Commission" },
    { key: "activity", label: "Activity" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMid})`, padding: "20px 24px 0", boxShadow: "0 4px 20px rgba(92,3,155,0.25)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate(-1)}
                style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <ChevronLeft size={20} />
              </button>
              {/* avatar */}
              <div style={{ width: 56, height: 56, borderRadius: 14, background: partner.profilePic ? "transparent" : "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {partner.profilePic
                  ? <img src={partner.profilePic} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{initials}</span>}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{displayName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ background: isCompany ? "rgba(139,92,246,0.3)" : "rgba(59,130,246,0.3)", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.3)" }}>
                    {isCompany ? "🏢 Institutional Partner" : "👤 Individual Partner"}
                  </span>
                  {partner.primaryContact?.email && (
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}><Mail size={11} style={{ marginRight: 4 }} />{partner.primaryContact.email}</span>
                  )}
                  {partner.primaryContact?.phone && (
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}><Phone size={11} style={{ marginRight: 4 }} />{partner.primaryContact.phone}</span>
                  )}
                </div>
              </div>
            </div>

            {/* action buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={fetchPartner}
                disabled={loading}
                style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
              {partner.status === "active" ? (
                <button
                  onClick={() => setSuspendModal(true)}
                  disabled={actionLoading}
                  style={{ padding: "8px 16px", borderRadius: 10, background: C.redSoft, border: `1px solid ${C.red}40`, color: C.red, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <XCircle size={14} /> Suspend
                </button>
              ) : (
                <button
                  onClick={handleActivate}
                  disabled={actionLoading}
                  style={{ padding: "8px 16px", borderRadius: 10, background: C.greenSoft, border: `1px solid ${C.green}40`, color: C.green, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <CheckCircle size={14} /> Activate
                </button>
              )}
            </div>
          </div>

          {/* status + tab strip */}
          <style>{`
            .custom-tabs {
              margin-bottom: 0px !important;
            }
            .custom-tabs .ant-tabs-nav {
              margin-bottom: 0px !important;
              border-bottom: none !important;
            }
            .custom-tabs .ant-tabs-tab {
              background: transparent !important;
              border: 1px solid rgba(255, 255, 255, 0.25) !important;
              border-bottom: none !important;
              border-radius: 8px 8px 0 0 !important;
              margin-right: 4px !important;
              padding: 8px 16px !important;
              transition: all 0.2s !important;
            }
            .custom-tabs .ant-tabs-tab-btn {
              color: rgba(255, 255, 255, 0.8) !important;
              font-size: 13px !important;
              font-weight: 600 !important;
            }
            .custom-tabs .ant-tabs-tab-active {
              background: ${C.white} !important;
              border-color: ${C.white} !important;
            }
            .custom-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
              color: ${C.primary} !important;
            }
            .custom-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn {
              color: #fff !important;
            }
            .custom-tabs .ant-tabs-tab-active:hover .ant-tabs-tab-btn {
              color: ${C.primary} !important;
            }
            .custom-tabs .ant-tabs-nav-operations {
              display: none !important;
            }
          `}</style>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, width: "100%" }}>
            <StatusBadge status={partner.status} />
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              type="card"
              className="custom-tabs"
              items={tabs.map(t => ({ label: t.label, key: t.key }))}
            />
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>

        {/* stat chips */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          {[
            { label: "Partner ID", value: partner._id?.slice(-8)?.toUpperCase(), icon: <Hash size={14} />, color: C.primary },
            { label: "Category", value: isCompany ? "Institutional Partner" : "Individual Partner", icon: isCompany ? <Building2 size={14} /> : <User size={14} />, color: C.primaryMid },
            { label: "Status", value: partner.status || "N/A", icon: <Shield size={14} />, color: partner.status === "active" ? C.green : C.amber },
            { label: "Onboarded", value: fmtDate(partner.onboardedAt || partner.createdAt) || "N/A", icon: <Calendar size={14} />, color: C.blue },
            { label: "Tier 1 Commission", value: `${partner.commissionConfiguration?.tier1?.commissionPercentage || 0}%`, icon: <Percent size={14} />, color: C.green },
            { label: "Year Est.", value: partner.yearEstablished || "N/A", icon: <Building2 size={14} />, color: C.gray },
          ].map(chip => (
            <div key={chip.label} style={{ background: C.white, borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, border: `1px solid ${chip.color}20`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ color: chip.color }}>{chip.icon}</div>
              <div>
                <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>{chip.label.toUpperCase()}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: chip.color }}>{chip.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>

            {/* Company Info */}
            {isCompany && (
              <SectionCard title="Institutional Partner Information" icon={<Building2 size={16} />} color={C.primaryMid}>
                <InfoRow label="Institution / Company Name" value={partner.companyName} copy />
                <InfoRow label="DBA / Trade Name" value={partner.dbaName} />
                <InfoRow label="Legal Entity Type" value={partner.legalEntityType} />
                <InfoRow label="Trade License No." value={partner.tradeLicenseNumber} copy />
                <InfoRow label="License Issue Date" value={fmtDate(partner.tradeLicenseIssueDate)} />
                <InfoRow label="License Expiry" value={fmtDate(partner.tradeLicenseExpiryDate)} />
                <InfoRow label="TRN" value={partner.taxRegistrationNumber} copy />
                <InfoRow label="Year Established" value={partner.yearEstablished} />
                <InfoRow label="No. of Branches" value={partner.numberOfBranches} />
                <InfoRow label="No. of Agents" value={partner.numberOfAgents} />
                <InfoRow label="Website" value={partner.website} />
                <InfoRow label="Offline Agreement" value={partner.isOfflineAgreement ? "Yes" : "No"} />
              </SectionCard>
            )}

            {/* Individual Info */}
            {!isCompany && (
              <SectionCard title="Individual Information" icon={<User size={16} />} color={C.primaryMid}>
                <InfoRow label="First Name" value={partner.individualDetails?.firstName} />
                <InfoRow label="Last Name" value={partner.individualDetails?.lastName} />
                <InfoRow label="Emirates ID" value={partner.individualDetails?.emiratesId} copy />
                <InfoRow label="Date of Birth" value={fmtDate(partner.individualDetails?.dateOfBirth)} />
                <InfoRow label="Gender" value={partner.individualDetails?.gender} />
                <InfoRow label="Nationality" value={partner.individualDetails?.nationality} />
                <InfoRow label="Website" value={partner.website} />
              </SectionCard>
            )}

            {/* Primary Contact */}
            <SectionCard title="Primary Contact" icon={<User size={16} />} color={C.blue}>
              <InfoRow label="Name" value={partner.primaryContact?.name} />
              <InfoRow label="Email" value={partner.primaryContact?.email} copy />
              <InfoRow label="Phone" value={partner.primaryContact?.phone} copy />
              <InfoRow label="Designation" value={partner.primaryContact?.designation} />
            </SectionCard>

            {/* Login Credentials */}
            <SectionCard title="Login Credentials" icon={<Shield size={16} />} color={C.amber}>
              <InfoRow label="Login Email" value={partner.email} copy />
              <InfoRow label="Account Created" value={fmtDate(partner.createdAt)} />
              <InfoRow label="Last Updated" value={fmtDate(partner.updatedAt)} />
              <InfoRow label="Role" value={partner.role?.name} />
            </SectionCard>
          </div>
        )}

        {activeTab === "contact" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            <SectionCard title="Billing Address" icon={<MapPin size={16} />} color={C.blue}>
              <InfoRow label="Building" value={partner.billingAddress?.buildingName} />
              <InfoRow label="Floor / Unit" value={partner.billingAddress?.floorUnit} />
              <InfoRow label="Area" value={partner.billingAddress?.area} />
              <InfoRow label="City" value={partner.billingAddress?.city} />
              <InfoRow label="PO Box" value={partner.billingAddress?.poBox} />
              <InfoRow label="Country" value={partner.billingAddress?.country} />
            </SectionCard>

            <SectionCard title="Shipping Address" icon={<MapPin size={16} />} color={C.primaryMid}>
              <InfoRow label="Building" value={partner.shippingAddress?.buildingName} />
              <InfoRow label="Floor / Unit" value={partner.shippingAddress?.floorUnit} />
              <InfoRow label="Area" value={partner.shippingAddress?.area} />
              <InfoRow label="City" value={partner.shippingAddress?.city} />
              <InfoRow label="PO Box" value={partner.shippingAddress?.poBox} />
              <InfoRow label="Country" value={partner.shippingAddress?.country} />
            </SectionCard>

            <SectionCard title="Primary Contact" icon={<Phone size={16} />} color={C.green}>
              <InfoRow label="Name" value={partner.primaryContact?.name} />
              <InfoRow label="Email" value={partner.primaryContact?.email} copy />
              <InfoRow label="Country Code" value={partner.primaryContact?.countryCode} />
              <InfoRow label="Phone" value={partner.primaryContact?.phone} copy />
              <InfoRow label="Alt. Phone" value={partner.primaryContact?.alternativePhone} />
              <InfoRow label="WhatsApp" value={partner.primaryContact?.whatsappNumber} />
              <InfoRow label="Emirates ID" value={partner.primaryContact?.emiratesId} copy />
              <InfoRow label="Designation" value={partner.primaryContact?.designation} />
            </SectionCard>

            {partner.secondaryContact && (
              <SectionCard title="Secondary Contact" icon={<Phone size={16} />} color={C.primaryMid}>
                <InfoRow label="Name" value={partner.secondaryContact?.name} />
                <InfoRow label="Email" value={partner.secondaryContact?.email} copy />
                <InfoRow label="Phone" value={partner.secondaryContact?.phone} copy />
                <InfoRow label="Designation" value={partner.secondaryContact?.designation} />
              </SectionCard>
            )}
          </div>
        )}

        {activeTab === "commission" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            <SectionCard title="Tier 1 Commission" icon={<Percent size={16} />} color={C.green}>
              <InfoRow label="Commission %" value={`${partner.commissionConfiguration?.tier1?.commissionPercentage || 0}%`} />
              <InfoRow label="Max Loan Amount" value={fmtAED(partner.commissionConfiguration?.tier1?.loanAmountMax)} />
              <InfoRow label="Description" value={partner.commissionConfiguration?.tier1?.description} />
            </SectionCard>
            <SectionCard title="Tier 2 Commission" icon={<Percent size={16} />} color={C.primaryMid}>
              <InfoRow label="Commission %" value={`${partner.commissionConfiguration?.tier2?.commissionPercentage || 0}%`} />
              <InfoRow label="Min Loan Amount" value={fmtAED(partner.commissionConfiguration?.tier2?.loanAmountMin)} />
              <InfoRow label="Description" value={partner.commissionConfiguration?.tier2?.description} />
            </SectionCard>
            <SectionCard title="Payment Terms" icon={<FileText size={16} />} color={C.amber}>
              <InfoRow label="Payment Terms" value={partner.commissionConfiguration?.paymentTerms} />
              <InfoRow label="Calculation Basis" value={partner.commissionConfiguration?.calculationBasis} />
            </SectionCard>
            <SectionCard title="Agreement Details" icon={<FileText size={16} />} color={C.blue}>
              <InfoRow label="Agreement Type" value={partner.agreementDetails?.agreementType} />
              <InfoRow label="Start Date" value={fmtDate(partner.agreementDetails?.startDate)} />
              <InfoRow label="End Date" value={fmtDate(partner.agreementDetails?.endDate)} />
              <InfoRow label="Signed Date" value={fmtDate(partner.agreementDetails?.signedDate)} />
              <InfoRow label="Signed By Xoto" value={partner.agreementDetails?.signedByXoto} />
              <InfoRow label="Signed By Partner" value={partner.agreementDetails?.signedByPartner} />
              <InfoRow label="Auto Renew" value={partner.agreementDetails?.autoRenew ? "Yes" : "No"} />
            </SectionCard>
            <SectionCard title="Bank Details" icon={<DollarSign size={16} />} color={C.primaryMid}>
              <InfoRow label="Beneficiary" value={partner.bankDetails?.beneficiaryName} />
              <InfoRow label="Bank Name" value={partner.bankDetails?.bankName} />
              <InfoRow label="Account Number" value={partner.bankDetails?.accountNumber} copy />
              <InfoRow label="IBAN" value={partner.bankDetails?.iban} copy />
              <InfoRow label="SWIFT Code" value={partner.bankDetails?.swiftCode} copy />
              <InfoRow label="Branch" value={partner.bankDetails?.branchName} />
              <InfoRow label="Account Type" value={partner.bankDetails?.accountType} />
              <InfoRow label="Verified" value={partner.bankDetails?.verified ? "Yes" : "Not Verified"} />
            </SectionCard>
          </div>
        )}

        {activeTab === "activity" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            <SectionCard title="Account Timeline" icon={<Calendar size={16} />} color={C.primary}>
              <InfoRow label="Created" value={fmtDate(partner.createdAt)} />
              <InfoRow label="Last Updated" value={fmtDate(partner.updatedAt)} />
              <InfoRow label="Onboarded At" value={fmtDate(partner.onboardedAt)} />
              <InfoRow label="Onboarding Complete" value={partner.onboardingCompleted ? "Yes" : "No"} />
              <InfoRow label="Suspended At" value={fmtDate(partner.suspendedAt)} />
              {partner.suspensionReason && <InfoRow label="Suspension Reason" value={partner.suspensionReason} />}
            </SectionCard>
            <SectionCard title="Performance Metrics" icon={<Star size={16} />} color={C.amber}>
              <InfoRow label="Cases Submitted" value={partner.performanceMetrics?.totalCasesSubmitted ?? 0} />
              <InfoRow label="Cases Approved" value={partner.performanceMetrics?.totalCasesApproved ?? 0} />
              <InfoRow label="Cases Disbursed" value={partner.performanceMetrics?.totalCasesDisbursed ?? 0} />
              <InfoRow label="Commission Earned" value={fmtAED(partner.performanceMetrics?.totalCommissionEarned ?? 0)} />
              <InfoRow label="Avg. Processing Days" value={partner.performanceMetrics?.averageProcessingDays ?? 0} />
              <InfoRow label="Conversion Rate" value={`${partner.performanceMetrics?.conversionRate ?? 0}%`} />
            </SectionCard>
            <SectionCard title="Account Details" icon={<Shield size={16} />} color={C.blue}>
              <InfoRow label="Login Email" value={partner.email} copy />
              <InfoRow label="Role" value={partner.role?.name} />
              <InfoRow label="No. of Agents" value={partner.numberOfAgents ?? 0} />
              <InfoRow label="Deleted" value={partner.isDeleted ? "Yes" : "No"} />
            </SectionCard>
          </div>
        )}
      </div>

      {/* Suspend Modal */}
      <Modal
        title="Suspend Partner"
        open={suspendModal}
        onCancel={() => { setSuspendModal(false); setSuspendReason(""); }}
        onOk={handleSuspend}
        okText="Suspend"
        okButtonProps={{ danger: true, loading: actionLoading }}
        cancelButtonProps={{ disabled: actionLoading }}
      >
        <p style={{ color: C.textMuted, marginBottom: 12 }}>Please provide a reason for suspending <strong>{displayName}</strong>.</p>
        <Input.TextArea
          rows={3}
          placeholder="Reason for suspension..."
          value={suspendReason}
          onChange={e => setSuspendReason(e.target.value)}
          style={{ borderRadius: 8 }}
        />
      </Modal>
    </div>
  );
}
