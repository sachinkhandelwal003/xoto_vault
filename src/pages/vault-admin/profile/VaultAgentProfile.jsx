import React, { useEffect, useState } from "react";
import {
  Avatar, Tag, Row, Col, Upload, Spin, message,
} from "antd";
import {
  UserOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined,
  TrophyOutlined, FileDoneOutlined, CameraOutlined, LoadingOutlined,
  FilePdfOutlined, EyeOutlined, UploadOutlined, BankOutlined,
  IdcardOutlined, SafetyCertificateOutlined, TeamOutlined,
  DollarOutlined, AlertOutlined, GlobalOutlined, CalendarOutlined,
  ManOutlined, FormOutlined,
} from "@ant-design/icons";
import { apiService } from "@/api/apiService";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const P  = "#5C039B";
const PG = "linear-gradient(135deg, #5C039B 0%, #7C3AED 60%, #4f46e5 100%)";

/* ── Stat card ── */
const StatCard = ({ icon, label, value, color }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", border: "1px solid #ede9fe", boxShadow: "0 2px 10px rgba(92,3,155,0.06)", display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{ width: 48, height: 48, borderRadius: 13, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {React.cloneElement(icon, { style: { fontSize: 22, color } })}
    </div>
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#1a0533", lineHeight: 1.1 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 12, color: "#9b8ab0", marginTop: 2, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

/* ── Info field ── */
const Field = ({ icon, label, value, badge }) => (
  <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid #f5f0ff", alignItems: "center" }}>
    <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f5f0ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {React.cloneElement(icon, { style: { fontSize: 15, color: P } })}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#b0a0c8", marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: value ? "#1a0533" : "#d0c4e0" }}>{value || "Not provided"}</div>
    </div>
    {badge && <div style={{ flexShrink: 0 }}>{badge}</div>}
  </div>
);

/* ── Section card ── */
const Section = ({ title, icon, children, action }) => (
  <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #ede9fe", overflow: "hidden", boxShadow: "0 2px 10px rgba(92,3,155,0.05)", marginBottom: 18 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: "1px solid #f5f0ff", background: "linear-gradient(135deg, #faf8ff, #f3efff)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: P, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.cloneElement(icon, { style: { fontSize: 14, color: "#fff" } })}
        </div>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1a0533" }}>{title}</span>
      </div>
      {action}
    </div>
    <div style={{ padding: "6px 22px 14px" }}>{children}</div>
  </div>
);

/* ── Document card ── */
const DocCard = ({ title, uploaded, verified, url }) => {
  const color = verified ? "#10b981" : uploaded ? "#f59e0b" : "#9ca3af";
  const text  = verified ? "Verified" : uploaded ? "Pending Review" : "Not Uploaded";
  return (
    <div style={{ borderRadius: 12, border: `1.5px solid ${verified ? "#a7f3d0" : uploaded ? "#fde68a" : "#ede9fe"}`, background: uploaded ? (verified ? "#f0fdf4" : "#fffdf0") : "#fafafa", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
      <FilePdfOutlined style={{ fontSize: 18, color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1a0533", marginBottom: 2 }}>{title}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}18`, padding: "1px 8px", borderRadius: 20 }}>{text}</span>
      </div>
      {url && (
        <button onClick={() => window.open(url, "_blank")} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #ede9fe", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <EyeOutlined style={{ color: P, fontSize: 13 }} />
        </button>
      )}
    </div>
  );
};

/* ── Status row ── */
const StatusRow = ({ label, ok, okText = "Active", failText = "Pending" }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f0ff" }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: ok ? "#ecfdf5" : "#fef3c7", color: ok ? "#059669" : "#d97706" }}>
      {ok ? okText : failText}
    </span>
  </div>
);

/* ════════════ MAIN ════════════ */
const VaultAgentProfile = () => {
  const navigate = useNavigate();
  const [profile,          setProfile]          = useState(null);
  const [commissionStatus, setCommissionStatus] = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [picUploading,     setPicUploading]     = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res     = await apiService.get("/vault/agent/me");
      const payload = res?.data || res;
      const data    = payload?.data || payload;
      setProfile(data);
      const cs = payload?.commissionStatus || payload?.data?.commissionStatus;
      if (cs) setCommissionStatus(cs);
    } catch {
      message.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handlePicUpload = async (file) => {
    setPicUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiService.upload("/upload", fd);
      const url = res?.file?.url || res?.data?.url || res?.url || "";
      if (url) {
        await apiService.put("/vault/agent/profile", { profilePic: url });
        message.success("Photo updated!");
        fetchProfile();
      } else {
        message.error("Upload failed.");
      }
    } catch {
      message.error("Failed to upload photo.");
    } finally {
      setPicUploading(false);
    }
    return false;
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" />
    </div>
  );

  const fullName         = `${profile?.name?.first_name || ""} ${profile?.name?.last_name || ""}`.trim();
  const phone            = `${profile?.phone?.country_code || ""} ${profile?.phone?.number || ""}`.trim();
  const isAffiliated     = profile?.agentType === "PartnerAffiliatedAgent";
  const commissionEligible = profile?.commissionEligible || false;
  const isVerified       = profile?.isVerified || false;
  const pct              = profile?.profileCompletionPercentage ?? 0;

  return (
    <div style={{ background: "#f8f6ff", minHeight: "100vh", padding: "24px 20px" }}>

      {/* ── HERO ── */}
      <div style={{ background: "#fff", borderRadius: 22, overflow: "hidden", marginBottom: 22, boxShadow: "0 4px 22px rgba(92,3,155,0.10)", border: "1px solid #ede9fe" }}>
        <div style={{ height: 120, background: PG, position: "relative" }}>
          <button
            onClick={() => navigate("/dashboard/vaultagent/update-profile")}
            style={{ position: "absolute", top: 14, right: 18, background: "#fff", border: "none", borderRadius: 11, color: P, padding: "8px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 7, boxShadow: "0 2px 10px rgba(0,0,0,0.15)" }}
          >
            <FormOutlined /> Update Profile
          </button>
        </div>

        <div style={{ padding: "0 28px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginTop: -46, flexWrap: "wrap" }}>
            <Upload showUploadList={false} customRequest={({ file }) => handlePicUpload(file)} accept="image/*">
              <div style={{ position: "relative", cursor: "pointer" }}>
                <Avatar size={96} icon={<UserOutlined />} src={profile?.profilePic}
                  style={{ border: "4px solid #fff", boxShadow: "0 4px 18px rgba(92,3,155,0.22)", background: "#e9d8ff" }} />
                {picUploading && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LoadingOutlined style={{ color: "#fff", fontSize: 20 }} spin />
                  </div>
                )}
                <div style={{ position: "absolute", bottom: 2, right: 2, background: P, borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                  <CameraOutlined style={{ fontSize: 12, color: "#fff" }} />
                </div>
              </div>
            </Upload>

            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#1a0533" }}>{fullName || "Agent"}</span>
                {isVerified && <CheckCircleOutlined style={{ fontSize: 18, color: "#22c55e" }} />}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: commissionEligible ? "#ecfdf5" : "#fef3c7", color: commissionEligible ? "#059669" : "#d97706", border: `1px solid ${commissionEligible ? "#a7f3d0" : "#fde68a"}` }}>
                  {commissionEligible ? "Commission Eligible" : "Pending Verification"}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: isAffiliated ? "#eff6ff" : "#f5f0ff", color: isAffiliated ? "#3b82f6" : P, border: `1px solid ${isAffiliated ? "#bfdbfe" : "#ddd0ff"}` }}>
                  {isAffiliated ? "Partner Affiliated" : "Referral Partner"}
                </span>
                {isAffiliated && profile?.affiliationStatus && (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: profile.affiliationStatus === "verified" ? "#ecfdf5" : "#fef3c7", color: profile.affiliationStatus === "verified" ? "#059669" : "#d97706", border: "none" }}>
                    Affiliation: {profile.affiliationStatus === "verified" ? "Approved" : profile.affiliationStatus === "pending" ? "Pending" : "Rejected"}
                  </span>
                )}
              </div>
              {/* Completion bar */}
              <div style={{ maxWidth: 300 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: "#9b8ab0", fontWeight: 600 }}>Profile Completion</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: P }}>{pct}%</span>
                </div>
                <div style={{ height: 5, background: "#ede9fe", borderRadius: 3 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: PG, borderRadius: 3, transition: "width .4s" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
        {[
          { icon: <FileDoneOutlined />, label: "Leads Submitted",  value: profile?.earnings?.totalLeadsSubmitted  ?? 0,  color: "#7c3aed" },
          { icon: <TrophyOutlined />,   label: "Disbursals",       value: profile?.earnings?.successfulDisbursals ?? 0,  color: "#f59e0b" },
          { icon: <DollarOutlined />,   label: "Commission",       value: `AED ${(profile?.earnings?.totalCommissionEarned || 0).toLocaleString()}`, color: "#10b981" },
          { icon: <TeamOutlined />,     label: "Pending Commission", value: `AED ${(profile?.earnings?.pendingCommission || 0).toLocaleString()}`, color: "#3b82f6" },
        ].map((s) => (
          <Col xs={12} sm={6} key={s.label}><StatCard {...s} /></Col>
        ))}
      </Row>

      {/* ── COMMISSION / STATUS BANNER ── */}
      {commissionStatus && (
        <div style={{
          marginBottom: 18, borderRadius: 14, padding: "14px 18px",
          border: `1.5px solid ${commissionStatus.allDone ? "#a7f3d0" : "#fde68a"}`,
          background: commissionStatus.allDone ? "#f0fdf4" : "#fffbeb",
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <AlertOutlined style={{ fontSize: 18, color: commissionStatus.allDone ? "#16a34a" : "#ca8a04", marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a0533", marginBottom: 4 }}>
                {isAffiliated ? "Account & Affiliation Status" : "Commission Status"}
              </div>
              <div style={{ fontSize: 13, color: "#374151", marginBottom: commissionStatus.pendingSteps?.length ? 10 : 0 }}>
                {commissionStatus.message}
              </div>
              {isAffiliated && commissionStatus.commissionNote && (
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: commissionStatus.pendingSteps?.length ? 10 : 0 }}>
                  {commissionStatus.commissionNote}
                </div>
              )}
              {commissionStatus.pendingSteps?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {commissionStatus.pendingSteps.map((s) => (
                    <span key={s.key} style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                      ✗ {s.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Leads</div>
              <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: commissionStatus.canSubmitLeads ? "#dcfce7" : "#fee2e2", color: commissionStatus.canSubmitLeads ? "#16a34a" : "#dc2626" }}>
                {commissionStatus.canSubmitLeads ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        </div>
      )}

      <Row gutter={[18, 0]}>
        {/* LEFT */}
        <Col xs={24} lg={14}>

          {/* Personal Info */}
          <Section title="Personal Information" icon={<UserOutlined />}>
            <Field icon={<MailOutlined />}    label="Email"       value={profile?.email} badge={profile?.isEmailVerified && <Tag color="success" style={{ borderRadius: 20 }}>Verified</Tag>} />
            <Field icon={<PhoneOutlined />}   label="Mobile"      value={phone}         badge={profile?.isPhoneVerified && <Tag color="success" style={{ borderRadius: 20 }}>Verified</Tag>} />
            <Field icon={<GlobalOutlined />}  label="Nationality" value={profile?.nationality} />
            <Field icon={<CalendarOutlined />} label="Date of Birth" value={profile?.dateOfBirth ? dayjs(profile.dateOfBirth).format("DD MMM YYYY") : null} />
            <Field icon={<ManOutlined />}     label="Gender"      value={profile?.gender} />
          </Section>

          {/* Identity Documents */}
          <Section title="Identity Documents" icon={<IdcardOutlined />}>
            {profile?.emiratesId?.number && (
              <div style={{ background: "#f5f0ff", borderRadius: 9, padding: "8px 12px", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: P }}>Emirates ID: </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1a0533" }}>{profile.emiratesId.number}</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <DocCard title="EID — Front" uploaded={!!profile?.emiratesId?.frontImageUrl} verified={!!profile?.emiratesId?.verified} url={profile?.emiratesId?.frontImageUrl} />
              <DocCard title="EID — Back"  uploaded={!!profile?.emiratesId?.backImageUrl}  verified={!!profile?.emiratesId?.verified} url={profile?.emiratesId?.backImageUrl} />
              <DocCard title="Passport"    uploaded={!!profile?.passport?.imageUrl}        verified={!!profile?.passport?.verified}   url={profile?.passport?.imageUrl} />
            </div>
            {profile?.passport?.number && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                Passport no: <strong>{profile.passport.number}</strong>
                {profile?.passport?.countryOfIssue && ` · ${profile.passport.countryOfIssue}`}
              </div>
            )}
          </Section>

        </Col>

        {/* RIGHT */}
        <Col xs={24} lg={10}>

          {/* Bank Details */}
          <Section title="Bank Details" icon={<BankOutlined />}
            action={
              <button onClick={() => navigate("/dashboard/vaultagent/update-profile")}
                style={{ fontSize: 12, fontWeight: 600, color: P, background: "#f5f0ff", border: "1px solid #ddd0ff", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>
                {profile?.bankDetails?.iban ? "Edit" : "+ Add"}
              </button>
            }
          >
            <Field icon={<UserOutlined />}   label="Beneficiary"   value={profile?.bankDetails?.beneficiaryName} />
            <Field icon={<BankOutlined />}   label="Bank Name"     value={profile?.bankDetails?.bankName} />
            <Field icon={<IdcardOutlined />} label="Account No."   value={profile?.bankDetails?.accountNumber} />
            <Field icon={<IdcardOutlined />} label="IBAN"          value={profile?.bankDetails?.iban} />
            {profile?.bankDetails?.verified && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircleOutlined style={{ color: "#10b981" }} />
                <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>Bank details verified</span>
              </div>
            )}
          </Section>

          {/* Partner Affiliation */}
          {isAffiliated && profile?.partnerId && (
            <Section title="Partner Affiliation" icon={<TeamOutlined />}>
              <Field icon={<TeamOutlined />} label="Partner Company" value={profile.partnerId?.companyName || profile.partnerId} />
              <Field
                icon={<SafetyCertificateOutlined />}
                label="Affiliation Status"
                value={profile.affiliationStatus === "verified" ? "Approved" : profile.affiliationStatus === "pending" ? "Pending Approval" : profile.affiliationStatus}
                badge={
                  <Tag color={profile.affiliationStatus === "verified" ? "success" : profile.affiliationStatus === "pending" ? "warning" : "error"} style={{ borderRadius: 20, fontWeight: 600 }}>
                    {profile.affiliationStatus === "verified" ? "Approved" : profile.affiliationStatus === "pending" ? "Pending" : "Rejected"}
                  </Tag>
                }
              />
            </Section>
          )}

          {/* Account Status */}
          <Section title="Account Status" icon={<SafetyCertificateOutlined />}>
            <StatusRow label="Account Verified"       ok={isVerified}                          okText="Verified"  failText="Pending" />
            <StatusRow label="Commission Eligible"    ok={commissionEligible}                  okText="Eligible"  failText="Not Eligible" />
            <StatusRow label="Email Verified"         ok={!!profile?.isEmailVerified} />
            <StatusRow label="Phone Verified"         ok={!!profile?.isPhoneVerified} />
            <StatusRow label="Emirates ID Verified"   ok={!!profile?.emiratesId?.verified} />
            <StatusRow label="Bank Details Verified"  ok={!!profile?.bankDetails?.verified} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Account Active</span>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: profile?.isActive ? "#ecfdf5" : "#fef2f2", color: profile?.isActive ? "#059669" : "#dc2626" }}>
                {profile?.isActive ? (profile?.suspendedAt ? "Suspended" : "Active") : "Inactive"}
              </span>
            </div>
          </Section>

        </Col>
      </Row>
    </div>
  );
};

export default VaultAgentProfile;
