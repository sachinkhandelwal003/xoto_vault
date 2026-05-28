import React, { useEffect, useState, useMemo } from "react";
import {
  Avatar, Tag, Row, Col, Typography, Button, Modal,
  Form, Input, message, Upload, Spin, Tooltip, Select, DatePicker, Divider
} from "antd";
import {
  UserOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined,
  TrophyOutlined, FileDoneOutlined, EditOutlined, CameraOutlined,
  LoadingOutlined, FilePdfOutlined, EyeOutlined, UploadOutlined,
  MessageOutlined, BankOutlined, IdcardOutlined, SafetyCertificateOutlined,
  TeamOutlined, CalendarOutlined, GlobalOutlined, DollarOutlined,
  HeartOutlined, ManOutlined, HomeOutlined, AlertOutlined,
} from "@ant-design/icons";
import { apiService } from "@/api/apiService";
import { Country } from "country-state-city";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const { Option } = Select;

const P  = "#5C039B";
const PG = "linear-gradient(135deg, #5C039B 0%, #7C3AED 60%, #4f46e5 100%)";

const allCountries = Country.getAllCountries();

/* ── Stat Card ── */
const StatCard = ({ icon, label, value, color }) => (
  <div style={{ background: "#fff", borderRadius: 18, padding: "20px 22px", border: "1px solid #ede9fe", boxShadow: "0 2px 12px rgba(92,3,155,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {React.cloneElement(icon, { style: { fontSize: 24, color } })}
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#1a0533", lineHeight: 1.1 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 12, color: "#9b8ab0", marginTop: 3, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

/* ── Info Field ── */
const Field = ({ icon, label, value, badge }) => (
  <div style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid #f5f0ff", alignItems: "center" }}>
    <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f5f0ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {React.cloneElement(icon, { style: { fontSize: 16, color: P } })}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#b0a0c8", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: value ? "#1a0533" : "#d0c4e0" }}>{value || "Not provided"}</div>
    </div>
    {badge && <div style={{ flexShrink: 0 }}>{badge}</div>}
  </div>
);

/* ── Section wrapper ── */
const Section = ({ title, icon, children, action }) => (
  <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9fe", overflow: "hidden", boxShadow: "0 2px 12px rgba(92,3,155,0.05)", marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #f5f0ff", background: "linear-gradient(135deg, #faf8ff, #f3efff)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: P, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.cloneElement(icon, { style: { fontSize: 15, color: "#fff" } })}
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1a0533" }}>{title}</span>
      </div>
      {action}
    </div>
    <div style={{ padding: "8px 24px 16px" }}>{children}</div>
  </div>
);

/* ── Document Card ── */
const DocCard = ({ title, icon, uploaded, verified, url, onUpload, uploading, onView }) => {
  const statusColor = verified ? "#10b981" : uploaded ? "#f59e0b" : "#9ca3af";
  const statusText  = verified ? "Verified" : uploaded ? "Pending Review" : "Not Uploaded";
  return (
    <div style={{ borderRadius: 14, border: `1.5px solid ${verified ? "#a7f3d0" : uploaded ? "#fde68a" : "#ede9fe"}`, background: uploaded ? (verified ? "#f0fdf4" : "#fffdf0") : "#fafafa", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${statusColor}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {React.cloneElement(icon, { style: { fontSize: 20, color: statusColor } })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a0533", marginBottom: 3 }}>{title}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: `${statusColor}18`, padding: "2px 8px", borderRadius: 20, display: "inline-block" }}>{statusText}</span>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {url && (
          <Tooltip title="View document">
            <button onClick={onView} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid #ede9fe", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EyeOutlined style={{ color: P, fontSize: 14 }} />
            </button>
          </Tooltip>
        )}
        <Upload showUploadList={false} customRequest={({ file }) => onUpload(file)} accept="image/*">
          <Tooltip title="Upload document">
            <button style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: P, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {uploading ? <LoadingOutlined style={{ color: "#fff", fontSize: 14 }} spin /> : <UploadOutlined style={{ color: "#fff", fontSize: 14 }} />}
            </button>
          </Tooltip>
        </Upload>
      </div>
    </div>
  );
};

/* ── Status Badge Row ── */
const StatusRow = ({ label, ok, okText = "Active", failText = "Pending" }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #f5f0ff" }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: ok ? "#ecfdf5" : "#fef3c7", color: ok ? "#059669" : "#d97706" }}>
      {ok ? okText : failText}
    </span>
  </div>
);

/* ── Form item helper ── */
const FItem = ({ name, label, rules, children, span = 12 }) => (
  <Col xs={24} sm={span}>
    <Form.Item name={name} label={label} rules={rules} style={{ marginBottom: 18 }}>
      {children}
    </Form.Item>
  </Col>
);

/* ════════════════ MAIN COMPONENT ════════════════ */
const VaultAgentProfile = () => {
  const [profile, setProfile]               = useState(null);
  const [commissionStatus, setCommissionStatus] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [updating, setUpdating]             = useState(false);
  const [docUploading, setDocUploading]     = useState(null);
  const [picUploading, setPicUploading]     = useState(false);
  const [modalOpen, setModalOpen]           = useState(false);
  const [form] = Form.useForm();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiService.get("/vault/agent/me");
      const payload = res?.data || res;
      setProfile(payload?.data || payload);
      if (payload?.commissionStatus) setCommissionStatus(payload.commissionStatus);
    } catch {
      message.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  /* ── Profile pic upload ── */
  const handlePicUpload = async (file) => {
    setPicUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiService.upload("/upload", fd);
      const url = res?.file?.url || res?.data?.file?.url || res?.data?.url || res?.url || "";
      if (url) {
        await apiService.put("/vault/agent/profile", { profilePic: url });
        message.success("Profile photo updated!");
        fetchProfile();
      } else {
        message.error("Upload failed: no URL returned.");
      }
    } catch {
      message.error("Failed to upload photo.");
    } finally {
      setPicUploading(false);
    }
    return false;
  };

  /* ── Document upload ── */
  const handleDocUpload = async (file, type, subField) => {
    setDocUploading(`${type}_${subField}`);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiService.upload("/upload", fd);
      const url = res?.file?.url || res?.data?.file?.url || res?.data?.url || res?.url || "";
      if (!url) { message.error("Upload failed: no URL returned."); return; }

      let payload = {};
      if (type === "emiratesId") {
        payload = {
          emiratesId: {
            number: profile?.emiratesId?.number || null,
            frontImageUrl: subField === "frontImageUrl" ? url : (profile?.emiratesId?.frontImageUrl || null),
            backImageUrl:  subField === "backImageUrl"  ? url : (profile?.emiratesId?.backImageUrl  || null),
          }
        };
      } else if (type === "passport") {
        payload = { passport: { ...profile?.passport, imageUrl: url } };
      } else if (type === "visa") {
        payload = { visa: { ...profile?.visa, imageUrl: url } };
      }

      await apiService.put("/vault/agent/profile", payload);
      message.success("Document uploaded successfully!");
      fetchProfile();
    } catch {
      message.error("Document upload failed.");
    } finally {
      setDocUploading(null);
    }
  };

  /* ── Open edit modal with all fields ── */
  const openEdit = () => {
    form.setFieldsValue({
      // Personal
      gender: profile?.gender,
      dateOfBirth: profile?.dateOfBirth ? dayjs(profile.dateOfBirth) : null,
      maritalStatus: profile?.maritalStatus,
      nationality: profile?.nationality,
      numberOfDependents: profile?.numberOfDependents ?? 0,
      languagePreference: profile?.languagePreference || "English",
      communicationPreference: profile?.communicationPreference || "WhatsApp",
      
      // Address
      address_building: profile?.address?.building,
      address_apartment: profile?.address?.apartment,
      address_area: profile?.address?.area,
      address_city: profile?.address?.city,
      address_country: profile?.address?.country || "UAE",
      address_poBox: profile?.address?.poBox,
      
      // Emergency Contact
      ec_name: profile?.emergencyContact?.name,
      ec_relationship: profile?.emergencyContact?.relationship,
      ec_phone: profile?.emergencyContact?.phone,
      
      // Emirates ID
      eid_number: profile?.emiratesId?.number,
      eid_issuanceDate: profile?.emiratesId?.issuanceDate ? dayjs(profile.emiratesId.issuanceDate) : null,
      eid_expiryDate: profile?.emiratesId?.expiryDate ? dayjs(profile.emiratesId.expiryDate) : null,
      
      // Passport
      passport_number: profile?.passport?.number,
      passport_countryOfIssue: profile?.passport?.countryOfIssue,
      passport_issueDate: profile?.passport?.issueDate ? dayjs(profile.passport.issueDate) : null,
      passport_expiryDate: profile?.passport?.expiryDate ? dayjs(profile.passport.expiryDate) : null,
      
      // Visa
      visa_number: profile?.visa?.number,
      visa_residencyStatus: profile?.visa?.residencyStatus,
      visa_sponsor: profile?.visa?.sponsor,
      visa_expiryDate: profile?.visa?.expiryDate ? dayjs(profile.visa.expiryDate) : null,
      
      // Bank
      beneficiaryName: profile?.bankDetails?.beneficiaryName,
      bankName: profile?.bankDetails?.bankName,
      iban: profile?.bankDetails?.iban,
      accountNumber: profile?.bankDetails?.accountNumber,
      swiftCode: profile?.bankDetails?.swiftCode,
      accountType: profile?.bankDetails?.accountType,
    });
    setModalOpen(true);
  };

  /* ── Save profile with all fields ── */
  const handleSave = async (values) => {
    setUpdating(true);
    try {
      const payload = {
        // Basic info
        gender: values.gender,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
        maritalStatus: values.maritalStatus,
        nationality: values.nationality,
        numberOfDependents: values.numberOfDependents ?? 0,
        languagePreference: values.languagePreference,
        communicationPreference: values.communicationPreference,
        
        // Address
        address: {
          building: values.address_building || null,
          apartment: values.address_apartment || null,
          area: values.address_area || null,
          city: values.address_city || null,
          country: values.address_country || "UAE",
          poBox: values.address_poBox || null,
        },
        
        // Emergency Contact
        emergencyContact: {
          name: values.ec_name || null,
          relationship: values.ec_relationship || null,
          phone: values.ec_phone || null,
        },
        
        // Emirates ID
        emiratesId: {
          number: values.eid_number || null,
          issuanceDate: values.eid_issuanceDate ? values.eid_issuanceDate.toISOString() : null,
          expiryDate: values.eid_expiryDate ? values.eid_expiryDate.toISOString() : null,
          frontImageUrl: profile?.emiratesId?.frontImageUrl || null,
          backImageUrl: profile?.emiratesId?.backImageUrl || null,
        },
        
        // Passport
        passport: {
          number: values.passport_number || null,
          countryOfIssue: values.passport_countryOfIssue || null,
          issueDate: values.passport_issueDate ? values.passport_issueDate.toISOString() : null,
          expiryDate: values.passport_expiryDate ? values.passport_expiryDate.toISOString() : null,
          imageUrl: profile?.passport?.imageUrl || null,
        },
        
        // Visa
        visa: {
          number: values.visa_number || null,
          residencyStatus: values.visa_residencyStatus || null,
          sponsor: values.visa_sponsor || null,
          expiryDate: values.visa_expiryDate ? values.visa_expiryDate.toISOString() : null,
          imageUrl: profile?.visa?.imageUrl || null,
        },
        
        // Bank Details
        bankDetails: {
          beneficiaryName: values.beneficiaryName || null,
          bankName: values.bankName || null,
          iban: values.iban || null,
          accountNumber: values.accountNumber || null,
          swiftCode: values.swiftCode || null,
          accountType: values.accountType || null,
        },
      };

      const res = await apiService.put("/vault/agent/profile", payload);
      if (res?.success !== false) {
        message.success("Profile updated successfully!");
        setModalOpen(false);
        fetchProfile();
      } else {
        message.error(res?.message || "Update failed");
      }
    } catch (error) {
      console.error("Save error:", error);
      message.error(error?.response?.data?.message || "Update failed. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" />
    </div>
  );

  const fullName  = `${profile?.name?.first_name || ""} ${profile?.name?.last_name || ""}`.trim();
  const phone     = `${profile?.phone?.country_code || ""} ${profile?.phone?.number || ""}`.trim();
  const commissionEligible = profile?.commissionEligible || false;
  const isVerified = profile?.isVerified || false;
  const pct = profile?.profileCompletionPercentage ?? 0;

  return (
    <div style={{ background: "#f8f6ff", minHeight: "100vh", padding: "24px 20px" }}>

      {/* ══ HERO CARD ══ */}
      <div style={{ background: "#fff", borderRadius: 24, overflow: "hidden", marginBottom: 24, boxShadow: "0 4px 24px rgba(92,3,155,0.10)", border: "1px solid #ede9fe" }}>
        <div style={{ height: 130, background: PG, position: "relative" }}>
          <button
            onClick={openEdit}
            style={{ position: "absolute", top: 16, right: 20, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, color: "#fff", padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}
          >
            <EditOutlined /> Edit Profile
          </button>
        </div>

        <div style={{ padding: "0 32px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 22, marginTop: -52, flexWrap: "wrap" }}>
            <Upload showUploadList={false} customRequest={({ file }) => handlePicUpload(file)}>
              <div style={{ position: "relative", cursor: "pointer" }}>
                <Avatar
                  size={104}
                  icon={<UserOutlined />}
                  src={profile?.profilePic || null}
                  style={{ border: "4px solid #fff", boxShadow: "0 4px 20px rgba(92,3,155,0.25)", background: "#e9d8ff" }}
                />
                {picUploading && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LoadingOutlined style={{ color: "#fff", fontSize: 22 }} spin />
                  </div>
                )}
                <div style={{ position: "absolute", bottom: 2, right: 2, background: P, borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                  <CameraOutlined style={{ fontSize: 13, color: "#fff" }} />
                </div>
              </div>
            </Upload>

            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#1a0533" }}>{fullName || "Agent"}</span>
                {isVerified && <CheckCircleOutlined style={{ fontSize: 20, color: "#22c55e" }} />}
              </div>
              {profile?.email && (
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
                  <MailOutlined style={{ color: P, marginRight: 6 }} />{profile.email}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: commissionEligible ? "#ecfdf5" : "#fef3c7", color: commissionEligible ? "#059669" : "#d97706", border: `1px solid ${commissionEligible ? "#a7f3d0" : "#fde68a"}` }}>
                  {commissionEligible ? "Commission Eligible" : "Pending Verification"}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: isVerified ? "#ecfdf5" : "#f5f0ff", color: isVerified ? "#059669" : P, border: `1px solid ${isVerified ? "#a7f3d0" : "#ddd0ff"}` }}>
                  {isVerified ? "Verified" : "Unverified"}
                </span>
                {profile?.agentType && (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe" }}>
                    {profile.agentType === "FreelanceAgent" ? "Freelance Agent" : "Partner Affiliated"}
                  </span>
                )}
              </div>

              {/* Profile completion bar */}
              <div style={{ marginTop: 12, maxWidth: 320 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#9b8ab0", fontWeight: 600 }}>Profile Completion</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: P }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: "#ede9fe", borderRadius: 3 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${P}, #7c3aed)`, borderRadius: 3, transition: "width 0.4s" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ STATS ══ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { icon: <FileDoneOutlined />, label: "Total Leads",       value: profile?.earnings?.totalLeadsSubmitted   ?? 0,               color: "#7c3aed" },
          { icon: <TrophyOutlined />,   label: "Disbursals",        value: profile?.earnings?.successfulDisbursals  ?? 0,               color: "#f59e0b" },
          { icon: <DollarOutlined />,   label: "Commission Earned", value: `AED ${(profile?.earnings?.totalCommissionEarned || 0).toLocaleString()}`, color: "#10b981" },
          { icon: <TeamOutlined />,     label: "Agent Type",        value: profile?.agentType === "FreelanceAgent" ? "Freelance" : "Affiliated", color: "#3b82f6" },
        ].map((s) => (
          <Col xs={12} sm={6} key={s.label}><StatCard {...s} /></Col>
        ))}
      </Row>

      {/* ══ COMMISSION STATUS BANNER ══ */}
      {commissionStatus && (
        <div style={{
          marginBottom: 20,
          borderRadius: 16,
          border: `1.5px solid ${commissionStatus.commissionEligible ? "#a7f3d0" : commissionStatus.allDone ? "#a7f3d0" : "#fde68a"}`,
          background: commissionStatus.commissionEligible || commissionStatus.allDone ? "#f0fdf4" : "#fffbeb",
          padding: "16px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: commissionStatus.commissionEligible || commissionStatus.allDone ? "#dcfce7" : "#fef9c3" }}>
              <AlertOutlined style={{ fontSize: 18, color: commissionStatus.commissionEligible || commissionStatus.allDone ? "#16a34a" : "#ca8a04" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a0533", marginBottom: 4 }}>
                {commissionStatus.type === "referral_partner" ? "Commission Status" : "Account & Commission Status"}
              </div>
              <div style={{ fontSize: 13, color: "#374151", marginBottom: commissionStatus.pendingSteps?.length > 0 ? 12 : 0 }}>
                {commissionStatus.message}
              </div>

              {/* Affiliated agent note */}
              {commissionStatus.commissionNote && (
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, marginBottom: commissionStatus.pendingSteps?.length > 0 ? 10 : 0 }}>
                  {commissionStatus.commissionNote}
                  {commissionStatus.internalCommissionPct != null && (
                    <span style={{ marginLeft: 8, fontWeight: 700, color: P }}>
                      Your agreed rate: {commissionStatus.internalCommissionPct}%
                    </span>
                  )}
                </div>
              )}

              {/* Pending steps checklist */}
              {commissionStatus.pendingSteps?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {commissionStatus.pendingSteps.map(step => (
                    <span key={step.key} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                      background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                      ✗ {step.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Lead access indicator */}
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Leads</div>
              <div style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                background: commissionStatus.canSubmitLeads ? "#dcfce7" : "#fee2e2",
                color: commissionStatus.canSubmitLeads ? "#16a34a" : "#dc2626" }}>
                {commissionStatus.canSubmitLeads ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        </div>
      )}

      <Row gutter={[20, 0]}>
        {/* LEFT */}
        <Col xs={24} lg={14}>
          <Section title="Personal Information" icon={<UserOutlined />}>
            <Field icon={<MailOutlined />}    label="Email"        value={profile?.email} badge={profile?.isEmailVerified && <Tag color="success" style={{ borderRadius: 20 }}>Verified</Tag>} />
            <Field icon={<PhoneOutlined />}   label="Mobile"       value={phone}         badge={profile?.isPhoneVerified && <Tag color="success" style={{ borderRadius: 20 }}>Verified</Tag>} />
            <Field icon={<GlobalOutlined />}  label="Nationality"  value={profile?.nationality} />
            <Field icon={<CalendarOutlined />} label="Date of Birth" value={profile?.dateOfBirth ? dayjs(profile.dateOfBirth).format("DD MMM YYYY") : null} />
            <Field icon={<ManOutlined />}     label="Gender"       value={profile?.gender} />
            <Field icon={<HeartOutlined />}   label="Marital Status" value={profile?.maritalStatus} />
            <Field icon={<TeamOutlined />}    label="Dependents"   value={profile?.numberOfDependents > 0 ? `${profile.numberOfDependents}` : "None"} />
            <Field icon={<GlobalOutlined />}  label="Language"     value={profile?.languagePreference} />
            <Field icon={<MessageOutlined />} label="Communication" value={profile?.communicationPreference} />
          </Section>

          {/* Address */}
          {profile?.address && (profile.address.city || profile.address.building) && (
            <Section title="Address" icon={<HomeOutlined />}>
              <Field icon={<HomeOutlined />}   label="Building"  value={profile.address.building} />
              <Field icon={<HomeOutlined />}   label="Apartment" value={profile.address.apartment} />
              <Field icon={<HomeOutlined />}   label="Area"      value={profile.address.area} />
              <Field icon={<HomeOutlined />}   label="City"      value={profile.address.city} />
              <Field icon={<GlobalOutlined />} label="Country"   value={profile.address.country} />
            </Section>
          )}

          {/* Emergency Contact */}
          {profile?.emergencyContact?.name && (
            <Section title="Emergency Contact" icon={<AlertOutlined />}>
              <Field icon={<UserOutlined />}  label="Name"         value={profile.emergencyContact.name} />
              <Field icon={<HeartOutlined />} label="Relationship" value={profile.emergencyContact.relationship} />
              <Field icon={<PhoneOutlined />} label="Phone"        value={profile.emergencyContact.phone} />
            </Section>
          )}

          {/* Documents */}
          <Section title="Identity Documents" icon={<IdcardOutlined />}>
            {/* Emirates ID number if available */}
            {profile?.emiratesId?.number && (
              <div style={{ background: "#f5f0ff", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: P }}>Emirates ID: </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1a0533" }}>{profile.emiratesId.number}</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 4 }}>
              <DocCard
                title="Emirates ID (Front)" icon={<IdcardOutlined />}
                uploaded={!!profile?.emiratesId?.frontImageUrl} verified={profile?.emiratesId?.verified}
                url={profile?.emiratesId?.frontImageUrl}
                uploading={docUploading === "emiratesId_frontImageUrl"}
                onUpload={(f) => handleDocUpload(f, "emiratesId", "frontImageUrl")}
                onView={() => window.open(profile?.emiratesId?.frontImageUrl, "_blank")}
              />
              <DocCard
                title="Emirates ID (Back)" icon={<IdcardOutlined />}
                uploaded={!!profile?.emiratesId?.backImageUrl} verified={profile?.emiratesId?.verified}
                url={profile?.emiratesId?.backImageUrl}
                uploading={docUploading === "emiratesId_backImageUrl"}
                onUpload={(f) => handleDocUpload(f, "emiratesId", "backImageUrl")}
                onView={() => window.open(profile?.emiratesId?.backImageUrl, "_blank")}
              />
              <DocCard
                title="Passport" icon={<FilePdfOutlined />}
                uploaded={!!profile?.passport?.imageUrl} verified={profile?.passport?.verified}
                url={profile?.passport?.imageUrl}
                uploading={docUploading === "passport_imageUrl"}
                onUpload={(f) => handleDocUpload(f, "passport", "imageUrl")}
                onView={() => window.open(profile?.passport?.imageUrl, "_blank")}
              />
              <DocCard
                title="UAE Visa" icon={<FilePdfOutlined />}
                uploaded={!!profile?.visa?.imageUrl} verified={profile?.visa?.verified}
                url={profile?.visa?.imageUrl}
                uploading={docUploading === "visa_imageUrl"}
                onUpload={(f) => handleDocUpload(f, "visa", "imageUrl")}
                onView={() => window.open(profile?.visa?.imageUrl, "_blank")}
              />
            </div>
          </Section>
        </Col>

        {/* RIGHT */}
        <Col xs={24} lg={10}>
          <Section
            title="Bank Details" icon={<BankOutlined />}
            action={
              <button onClick={openEdit} style={{ fontSize: 12, fontWeight: 600, color: P, background: "#f5f0ff", border: "1px solid #ddd0ff", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>
                {profile?.bankDetails?.iban ? "Edit" : "+ Add"}
              </button>
            }
          >
            <Field icon={<UserOutlined />}    label="Beneficiary Name" value={profile?.bankDetails?.beneficiaryName} />
            <Field icon={<BankOutlined />}    label="Bank Name"        value={profile?.bankDetails?.bankName} />
            <Field icon={<IdcardOutlined />}  label="Account Number"   value={profile?.bankDetails?.accountNumber} />
            <Field icon={<IdcardOutlined />}  label="IBAN"             value={profile?.bankDetails?.iban} />
            <Field icon={<GlobalOutlined />}  label="SWIFT / BIC"      value={profile?.bankDetails?.swiftCode} />
            <Field icon={<BankOutlined />}    label="Account Type"     value={profile?.bankDetails?.accountType} />
            {profile?.bankDetails?.verified && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircleOutlined style={{ color: "#10b981" }} />
                <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>Bank details verified</span>
              </div>
            )}
          </Section>

          {/* Partner info */}
          {profile?.agentType === "PartnerAffiliatedAgent" && profile?.partnerId && (
            <Section title="Partner Affiliation" icon={<TeamOutlined />}>
              <Field icon={<TeamOutlined />}   label="Partner Company"    value={profile.partnerId?.companyName || profile.partnerId} />
              <Field icon={<SafetyCertificateOutlined />} label="Affiliation Status" value={profile.affiliationStatus} />
            </Section>
          )}

          <Section title="Account Status" icon={<SafetyCertificateOutlined />}>
            <StatusRow label="Profile Verified"       ok={isVerified} okText="Verified" failText="Pending" />
            <StatusRow label="Commission Eligible"    ok={commissionEligible} okText="Eligible" failText="Not Eligible" />
            <StatusRow label="Email Verified"         ok={!!profile?.isEmailVerified} />
            <StatusRow label="Phone Verified"         ok={!!profile?.isPhoneVerified} />
            <StatusRow label="Emirates ID Verified"   ok={!!profile?.emiratesId?.verified} />
            <StatusRow label="Bank Details Verified"  ok={!!profile?.bankDetails?.verified} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Account Active</span>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: profile?.isActive ? "#ecfdf5" : "#fef2f2", color: profile?.isActive ? "#059669" : "#dc2626" }}>
                {profile?.isActive ? (profile?.suspendedAt ? "Suspended" : "Active") : "Inactive"}
              </span>
            </div>

            {!commissionEligible && (
              <div style={{ marginTop: 12, background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: "#92400e", fontWeight: 500 }}>
                  Upload Emirates ID + bank details to become commission eligible.
                </div>
              </div>
            )}
          </Section>
        </Col>
      </Row>

      {/* ══ EDIT MODAL with all fields ══ */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={900}
        destroyOnClose
        centered
        styles={{ content: { borderRadius: 20, padding: 0, overflow: "hidden" }, body: { padding: 0 } }}
        title={null}
        closable={false}
      >
        <div style={{ background: PG, padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EditOutlined style={{ color: "#fff", fontSize: 18 }} />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>Edit Profile</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>Update your personal and financial details</div>
            </div>
          </div>
          <button onClick={() => setModalOpen(false)} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        <div style={{ padding: "28px 28px 0", maxHeight: "72vh", overflowY: "auto" }}>
          <style>{`
            .agent-edit-form .ant-input { height: 44px !important; border-radius: 10px !important; border-color: #e8dff5 !important; }
            .agent-edit-form .ant-input:focus { border-color: ${P} !important; box-shadow: 0 0 0 3px rgba(92,3,155,.1) !important; }
            .agent-edit-form .ant-select-selector { height: 44px !important; border-radius: 10px !important; border-color: #e8dff5 !important; align-items: center !important; }
            .agent-edit-form .ant-select-focused .ant-select-selector { border-color: ${P} !important; box-shadow: 0 0 0 3px rgba(92,3,155,.1) !important; }
            .agent-edit-form .ant-picker { height: 44px !important; border-radius: 10px !important; border-color: #e8dff5 !important; width: 100% !important; }
            .agent-edit-form .ant-form-item-label > label { font-size: 12px !important; font-weight: 700 !important; color: #6b4f9a !important; }
            .agent-edit-form .ant-divider-inner-text { font-size: 11px !important; font-weight: 800 !important; color: ${P} !important; text-transform: uppercase !important; }
            .agent-edit-form .ant-input-affix-wrapper { height: 44px !important; border-radius: 10px !important; border-color: #e8dff5 !important; }
          `}</style>

          <Form form={form} layout="vertical" onFinish={handleSave} className="agent-edit-form">

            {/* Personal Information */}
            <Divider orientation="left" style={{ marginTop: 0 }}>Personal Information</Divider>
            <Row gutter={16}>
              <FItem name="gender" label="Gender">
                <Select placeholder="Select gender" allowClear>
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </FItem>
              <FItem name="dateOfBirth" label="Date of Birth">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} disabledDate={(d) => d && d.isAfter(dayjs())} />
              </FItem>
              <FItem name="maritalStatus" label="Marital Status">
                <Select placeholder="Select status" allowClear>
                  <Option value="Single">Single</Option>
                  <Option value="Married">Married</Option>
                  <Option value="Divorced">Divorced</Option>
                  <Option value="Widowed">Widowed</Option>
                </Select>
              </FItem>
              <FItem name="nationality" label="Nationality">
                <Select showSearch placeholder="Select nationality" optionFilterProp="children" allowClear>
                  {allCountries.map((c) => <Option key={c.isoCode} value={c.name}>{c.name}</Option>)}
                </Select>
              </FItem>
              <FItem name="numberOfDependents" label="Number of Dependents">
                <Select placeholder="Select">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(i => <Option key={i} value={i}>{i === 0 ? "None" : i}</Option>)}
                </Select>
              </FItem>
              <FItem name="languagePreference" label="Language Preference">
                <Select placeholder="Select">
                  <Option value="English">English</Option>
                  <Option value="Arabic">Arabic</Option>
                  <Option value="Both">Both</Option>
                </Select>
              </FItem>
              <FItem name="communicationPreference" label="Communication Preference" span={24}>
                <Select placeholder="Select">
                  <Option value="WhatsApp">WhatsApp</Option>
                  <Option value="Email">Email</Option>
                  <Option value="Phone">Phone</Option>
                  <Option value="SMS">SMS</Option>
                </Select>
              </FItem>
            </Row>

            {/* Address */}
            <Divider orientation="left">Address</Divider>
            <Row gutter={16}>
              <FItem name="address_building" label="Building"><Input placeholder="Building name" /></FItem>
              <FItem name="address_apartment" label="Apartment"><Input placeholder="Apartment / Unit" /></FItem>
              <FItem name="address_area" label="Area"><Input placeholder="Area / District" /></FItem>
              <FItem name="address_city" label="City"><Input placeholder="City" /></FItem>
              <FItem name="address_poBox" label="PO Box"><Input placeholder="PO Box" /></FItem>
              <FItem name="address_country" label="Country" span={24}>
                <Select showSearch placeholder="Select country" optionFilterProp="children" allowClear defaultValue="UAE">
                  {allCountries.map((c) => <Option key={c.isoCode} value={c.name}>{c.name}</Option>)}
                </Select>
              </FItem>
            </Row>

            {/* Emergency Contact */}
            <Divider orientation="left">Emergency Contact</Divider>
            <Row gutter={16}>
              <FItem name="ec_name" label="Contact Name"><Input placeholder="Full name" /></FItem>
              <FItem name="ec_relationship" label="Relationship">
                <Select placeholder="Select" allowClear>
                  <Option value="Father">Father</Option>
                  <Option value="Mother">Mother</Option>
                  <Option value="Brother">Brother</Option>
                  <Option value="Sister">Sister</Option>
                  <Option value="Spouse">Spouse</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </FItem>
              <FItem name="ec_phone" label="Phone Number" span={24}><Input placeholder="+971 50 XXX XXXX" /></FItem>
            </Row>

            {/* Emirates ID */}
            <Divider orientation="left">Emirates ID</Divider>
            <Row gutter={16}>
              <FItem name="eid_number" label="Emirates ID Number" span={24}>
                <Input placeholder="784-XXXX-XXXXXXX-X" />
              </FItem>
              <FItem name="eid_issuanceDate" label="Issue Date">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </FItem>
              <FItem name="eid_expiryDate" label="Expiry Date">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </FItem>
            </Row>

            {/* Passport */}
            <Divider orientation="left">Passport Details</Divider>
            <Row gutter={16}>
              <FItem name="passport_number" label="Passport Number" span={24}>
                <Input placeholder="Passport number" />
              </FItem>
              <FItem name="passport_countryOfIssue" label="Country of Issue">
                <Select showSearch placeholder="Select country" optionFilterProp="children" allowClear>
                  {allCountries.map((c) => <Option key={c.isoCode} value={c.name}>{c.name}</Option>)}
                </Select>
              </FItem>
              <FItem name="passport_issueDate" label="Issue Date">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </FItem>
              <FItem name="passport_expiryDate" label="Expiry Date">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </FItem>
            </Row>

            {/* UAE Visa */}
            <Divider orientation="left">UAE Visa Details</Divider>
            <Row gutter={16}>
              <FItem name="visa_number" label="Visa Number" span={24}>
                <Input placeholder="Visa number" />
              </FItem>
              <FItem name="visa_residencyStatus" label="Residency Status">
                <Select placeholder="Select status" allowClear>
                  <Option value="Resident">Resident</Option>
                  <Option value="Student">Student</Option>
                  <Option value="Employee">Employee</Option>
                  <Option value="Investor">Investor</Option>
                  <Option value="Family Sponsorship">Family Sponsorship</Option>
                </Select>
              </FItem>
              <FItem name="visa_sponsor" label="Sponsor">
                <Input placeholder="Sponsor name" />
              </FItem>
              <FItem name="visa_expiryDate" label="Expiry Date">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </FItem>
            </Row>

            {/* Bank Details */}
            <Divider orientation="left">Bank Details</Divider>
            <Row gutter={16}>
              <FItem name="beneficiaryName" label="Beneficiary Name"><Input placeholder="Account holder name" /></FItem>
              <FItem name="bankName" label="Bank Name"><Input placeholder="e.g., Emirates NBD" /></FItem>
              <FItem name="iban" label="IBAN"><Input placeholder="AE XXXX XXXX XXXX XXXX XXX" /></FItem>
              <FItem name="accountNumber" label="Account Number"><Input placeholder="Account number" /></FItem>
              <FItem name="swiftCode" label="SWIFT / BIC"><Input placeholder="SWIFT / BIC code" /></FItem>
              <FItem name="accountType" label="Account Type">
                <Select placeholder="Select type" allowClear>
                  <Option value="Savings">Savings</Option>
                  <Option value="Current">Current</Option>
                </Select>
              </FItem>
            </Row>

            <div style={{ position: "sticky", bottom: 0, background: "#fff", padding: "16px 0 24px", borderTop: "1px solid #f5f0ff", display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
              <Button onClick={() => setModalOpen(false)} style={{ height: 46, paddingInline: 28, borderRadius: 12, borderColor: "#e8dff5", fontWeight: 600 }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={updating} style={{ height: 46, paddingInline: 36, borderRadius: 12, background: PG, border: "none", fontWeight: 700, boxShadow: `0 4px 14px rgba(92,3,155,0.35)` }}>
                {updating ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default VaultAgentProfile;