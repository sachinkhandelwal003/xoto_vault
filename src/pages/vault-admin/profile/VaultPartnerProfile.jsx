// VaultPartnerProfile.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Avatar, Badge, Tag, Space, Row, Col, Typography, Button,
  Modal, Form, Input, Select, DatePicker, message, Spin, Divider, Tooltip
} from "antd";
import {
  BankOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined,
  UserOutlined, CalendarOutlined, CheckCircleOutlined, StopOutlined,
  FileOutlined, GlobalOutlined, HomeOutlined, PercentageOutlined,
  DollarOutlined, IdcardOutlined, SafetyCertificateOutlined,
  EditOutlined, LinkOutlined, CloseOutlined, TeamOutlined,
  TrophyOutlined, BarChartOutlined, ClockCircleOutlined, LockOutlined
} from "@ant-design/icons";
import { apiService } from "@/api/apiService";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const { Option } = Select;

const P   = "#5C039B";
const PD  = "#3D0268";
const PM  = "#7C3AED";
const PL  = "#F5F0FF";
const GN  = "#22C55E";
const AMB = "#F59E0B";
const RD  = "#EF4444";
const BL  = "#3B82F6";

const fmtDate = (d) => {
  if (!d) return null;
  try { return dayjs(d).format("DD MMM YYYY"); } catch { return String(d); }
};

const SectionCard = ({ children, style }) => (
  <div style={{
    background: "#fff", borderRadius: 20, border: "1px solid #f0e8ff",
    boxShadow: "0 2px 16px rgba(92,3,155,0.06)", overflow: "hidden",
    padding: "24px 28px", ...style,
  }}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
    <div style={{ width: 32, height: 32, borderRadius: 10, background: "#f0e8ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {React.cloneElement(icon, { style: { color: P, fontSize: 15 } })}
    </div>
    <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: P }}>{title}</span>
  </div>
);

const InfoRow = ({ icon, label, value, extra, isLast }) => (
  <div style={{
    display: "flex", alignItems: "flex-start", gap: 12,
    padding: "13px 0",
    borderBottom: isLast ? "none" : "1px solid #f5f0ff",
  }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f5f0ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {React.cloneElement(icon, { style: { fontSize: 15, color: P } })}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "#a392b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 14, color: "#2d1045", fontWeight: 600, marginTop: 2, wordBreak: "break-word" }}>
        {value != null && value !== "" && value !== false
          ? value
          : <span style={{ color: "#c9b8dc", fontWeight: 400 }}>Not provided</span>
        }
      </div>
    </div>
    {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
  </div>
);

const StatCard = ({ icon, label, value, color }) => (
  <div
    style={{
      background: "#fff", border: "1px solid #f0e8ff", borderRadius: 16,
      padding: "20px 24px", display: "flex", alignItems: "center", gap: 16,
      boxShadow: "0 2px 12px rgba(92,3,155,0.06)",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(92,3,155,0.12)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(92,3,155,0.06)"; }}
  >
    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {React.cloneElement(icon, { style: { fontSize: 22, color } })}
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#1a0533", lineHeight: 1.1 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 12, color: "#9b8ab0", marginTop: 2, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const StatusRow = ({ label, active, color }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 16px", borderRadius: 12,
    background: active ? `${color}0d` : "#f9f7ff",
    border: `1px solid ${active ? `${color}30` : "#ede8ff"}`,
  }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: active ? "#1a0533" : "#b8a8cc" }}>{label}</span>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: active ? color : "#d1c5e8" }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: active ? color : "#d1c5e8" }}>
        {active ? "Active" : "Pending"}
      </span>
    </div>
  </div>
);

const AddrBlock = ({ title, addr }) => (
  <div style={{ background: "#faf8ff", borderRadius: 12, padding: "14px 16px", border: "1px solid #ede8ff" }}>
    <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#a392b8", marginBottom: 10 }}>{title}</p>
    {addr
      ? [["Building", addr.buildingName], ["Floor/Unit", addr.floorUnit], ["Area", addr.area], ["City", addr.city], ["PO Box", addr.poBox], ["Country", addr.country || "UAE"]]
          .map(([l, v]) => (
            <div key={l} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: "#7a5a9c", fontWeight: 600, minWidth: 80 }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: v ? "#1a0533" : "#d1c5e8" }}>{v || "—"}</span>
            </div>
          ))
      : <p style={{ fontSize: 13, color: "#9b8ab0", fontStyle: "italic", margin: 0 }}>Same as billing address</p>
    }
  </div>
);

const VaultPartnerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [form] = Form.useForm();
  const [pwdModal, setPwdModal] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdForm] = Form.useForm();

  const getProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(`profile/get-profile-data?_t=${Date.now()}`);
      const data =
        res?.data?.data     ||
        res?.data?.partner  ||
        res?.data?.profile  ||
        res?.data           ||
        res;
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Unexpected response");
      }
      setProfile(data);
    } catch {
      message.error("Failed to load profile. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { getProfile(); }, [getProfile]);

  const openEdit = () => {
    if (!profile) return;
    form.setFieldsValue({
      companyName:              profile.companyName,
      dbaName:                  profile.dbaName,
      legalEntityType:          profile.legalEntityType,
      tradeLicenseNumber:       profile.tradeLicenseNumber,
      taxRegistrationNumber:    profile.taxRegistrationNumber,
      tradeLicenseIssueDate:    profile.tradeLicenseIssueDate  ? dayjs(profile.tradeLicenseIssueDate)  : null,
      tradeLicenseExpiryDate:   profile.tradeLicenseExpiryDate ? dayjs(profile.tradeLicenseExpiryDate) : null,
      website:                  profile.website,
      yearEstablished:          profile.yearEstablished,
      numberOfBranches:         profile.numberOfBranches,
      numberOfAgents:           profile.numberOfAgents,
      primaryContact_name:             profile.primaryContact?.name,
      primaryContact_designation:      profile.primaryContact?.designation,
      primaryContact_email:            profile.primaryContact?.email,
      primaryContact_countryCode:      profile.primaryContact?.countryCode,
      primaryContact_phone:            profile.primaryContact?.phone,
      primaryContact_alternativePhone: profile.primaryContact?.alternativePhone,
      primaryContact_whatsappNumber:   profile.primaryContact?.whatsappNumber,
      primaryContact_emiratesId:       profile.primaryContact?.emiratesId,
      secondaryContact_name:             profile.secondaryContact?.name,
      secondaryContact_designation:      profile.secondaryContact?.designation,
      secondaryContact_email:            profile.secondaryContact?.email,
      secondaryContact_countryCode:      profile.secondaryContact?.countryCode,
      secondaryContact_phone:            profile.secondaryContact?.phone,
      secondaryContact_alternativePhone: profile.secondaryContact?.alternativePhone,
      secondaryContact_whatsappNumber:   profile.secondaryContact?.whatsappNumber,
      secondaryContact_emiratesId:       profile.secondaryContact?.emiratesId,
      billingAddress_buildingName: profile.billingAddress?.buildingName,
      billingAddress_floorUnit:    profile.billingAddress?.floorUnit,
      billingAddress_area:         profile.billingAddress?.area,
      billingAddress_city:         profile.billingAddress?.city,
      billingAddress_poBox:        profile.billingAddress?.poBox,
      billingAddress_country:      profile.billingAddress?.country || "UAE",
      shippingAddress_buildingName: profile.shippingAddress?.buildingName,
      shippingAddress_floorUnit:    profile.shippingAddress?.floorUnit,
      shippingAddress_area:         profile.shippingAddress?.area,
      shippingAddress_city:         profile.shippingAddress?.city,
      shippingAddress_poBox:        profile.shippingAddress?.poBox,
      shippingAddress_country:      profile.shippingAddress?.country,
      bankDetails_beneficiaryName: profile.bankDetails?.beneficiaryName,
      bankDetails_bankName:        profile.bankDetails?.bankName,
      bankDetails_accountNumber:   profile.bankDetails?.accountNumber,
      bankDetails_iban:            profile.bankDetails?.iban,
      bankDetails_swiftCode:       profile.bankDetails?.swiftCode,
      bankDetails_branchName:      profile.bankDetails?.branchName,
      bankDetails_accountType:     profile.bankDetails?.accountType,
      tier1_loanAmountMax:         profile.commissionConfiguration?.tier1?.loanAmountMax,
      tier1_commissionPercentage:  profile.commissionConfiguration?.tier1?.commissionPercentage,
      tier2_commissionPercentage:  profile.commissionConfiguration?.tier2?.commissionPercentage,
      paymentTerms:                profile.commissionConfiguration?.paymentTerms,
    });
    setModalOpen(true);
  };

  const handleUpdate = async (vals) => {
    const partnerId = profile?._id || profile?.id;
    if (!partnerId) return message.error("Partner ID not found — cannot save");
    setUpdating(true);
    try {
      const payload = {
        companyName: vals.companyName, dbaName: vals.dbaName,
        legalEntityType: vals.legalEntityType,
        tradeLicenseNumber: vals.tradeLicenseNumber,
        taxRegistrationNumber: vals.taxRegistrationNumber,
        tradeLicenseIssueDate:  vals.tradeLicenseIssueDate?.toISOString()  || null,
        tradeLicenseExpiryDate: vals.tradeLicenseExpiryDate?.toISOString() || null,
        website: vals.website,
        yearEstablished:  Number(vals.yearEstablished)  || undefined,
        numberOfBranches: Number(vals.numberOfBranches) || undefined,
        numberOfAgents:   Number(vals.numberOfAgents)   || undefined,
        primaryContact: {
          name: vals.primaryContact_name, designation: vals.primaryContact_designation,
          email: vals.primaryContact_email, countryCode: vals.primaryContact_countryCode,
          phone: vals.primaryContact_phone, alternativePhone: vals.primaryContact_alternativePhone,
          whatsappNumber: vals.primaryContact_whatsappNumber, emiratesId: vals.primaryContact_emiratesId,
        },
        secondaryContact: vals.secondaryContact_name ? {
          name: vals.secondaryContact_name, designation: vals.secondaryContact_designation,
          email: vals.secondaryContact_email, countryCode: vals.secondaryContact_countryCode,
          phone: vals.secondaryContact_phone, alternativePhone: vals.secondaryContact_alternativePhone,
          whatsappNumber: vals.secondaryContact_whatsappNumber, emiratesId: vals.secondaryContact_emiratesId,
        } : null,
        billingAddress: { buildingName: vals.billingAddress_buildingName, floorUnit: vals.billingAddress_floorUnit, area: vals.billingAddress_area, city: vals.billingAddress_city, poBox: vals.billingAddress_poBox, country: vals.billingAddress_country || "UAE" },
        shippingAddress: vals.shippingAddress_buildingName ? { buildingName: vals.shippingAddress_buildingName, floorUnit: vals.shippingAddress_floorUnit, area: vals.shippingAddress_area, city: vals.shippingAddress_city, poBox: vals.shippingAddress_poBox, country: vals.shippingAddress_country } : null,
        bankDetails: { beneficiaryName: vals.bankDetails_beneficiaryName, bankName: vals.bankDetails_bankName, accountNumber: vals.bankDetails_accountNumber, iban: vals.bankDetails_iban, swiftCode: vals.bankDetails_swiftCode, branchName: vals.bankDetails_branchName, accountType: vals.bankDetails_accountType },
        commissionConfiguration: {
          tier1: { loanAmountMax: Number(vals.tier1_loanAmountMax), commissionPercentage: Number(vals.tier1_commissionPercentage) },
          tier2: { loanAmountMin: 5000001, commissionPercentage: Number(vals.tier2_commissionPercentage) },
          paymentTerms: vals.paymentTerms,
        },
      };
      const res = await apiService.put(`/vault/partner/update/${partnerId}`, payload);
      const updated = res?.data?.data || res?.data?.partner || res?.data || null;
      if (updated && typeof updated === "object" && !Array.isArray(updated)) {
        setProfile(updated);
      } else {
        await getProfile();
      }
      message.success("Profile updated successfully!");
      setModalOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Update failed. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (vals) => {
    setPwdLoading(true);
    try {
      await apiService.post("/vault/partner/change-password", {
        oldPassword: vals.oldPassword,
        newPassword: vals.newPassword,
      });
      message.success("Password changed successfully!");
      setPwdModal(false);
      pwdForm.resetFields();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f3ff" }}>
      <Spin size="large" />
    </div>
  );

  if (!profile) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f3ff" }}>
      <p>No partner profile found.</p>
    </div>
  );

  const pc  = profile.primaryContact         || {};
  const sc  = profile.secondaryContact       || null;
  const ba  = profile.billingAddress         || {};
  const sa  = profile.shippingAddress        || null;
  const bk  = profile.bankDetails            || {};
  const cc  = profile.commissionConfiguration || {};
  const ag  = profile.agreementDetails       || {};
  const pm  = profile.performanceMetrics     || {};
  const isActive = profile.status === "active";

  return (
    <>
      <style>{`
        .vpp .ant-input, .vpp .ant-select-selector, .vpp .ant-picker { border-radius:10px!important; border-color:#e8dff5!important; }
        .vpp .ant-form-item-label>label { font-size:12px!important; font-weight:700!important; color:#6b4f9a!important; }
        .vpp .ant-divider-inner-text { font-size:10px!important; font-weight:800!important; letter-spacing:.08em!important; color:${P}!important; text-transform:uppercase!important; }
      `}</style>

      <div className="vpp" style={{ background: "#f7f3ff", minHeight: "100vh", padding: "28px 24px" }}>

        {/* Hero Banner */}
        <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 24, border: "1px solid #e5e7eb", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ height: 140, position: "relative", background: "linear-gradient(135deg, #5C039B, #7C3AED)" }}>
            <div style={{ position: "absolute", top: 20, right: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Title level={3} style={{ margin: 0, color: "#fff", fontWeight: 700, textShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
                  {profile.companyName || "—"}
                </Title>
                {profile.onboardingCompleted && <CheckCircleOutlined style={{ fontSize: 20, color: "#22c55e" }} />}
              </div>
              <Button icon={<EditOutlined />} onClick={openEdit}
                style={{ marginTop: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8 }}>
                Edit Profile
              </Button>
            </div>
          </div>
          <div style={{ background: "#fff", padding: "0 32px 24px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginTop: -48, flexWrap: "wrap", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
                <Badge dot status={isActive ? "success" : "warning"} offset={[-8, 88]}>
                  <Avatar size={104} icon={<BankOutlined />}
                    style={{ background: "#f8fafc", color: "#334155", border: "4px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                </Badge>
                <div style={{ paddingBottom: 4, minWidth: 200 }}>
                  {profile.dbaName && <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>DBA: {profile.dbaName}</Text>}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {profile.legalEntityType && (
                      <Tag style={{ borderRadius: 6, padding: "2px 10px", background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151", fontWeight: 500 }}>
                        {profile.legalEntityType}
                      </Tag>
                    )}
                    <Tag style={{ borderRadius: 6, padding: "2px 10px", border: "none", fontWeight: 600, background: isActive ? "#ECFDF5" : "#FEF2F2", color: isActive ? GN : RD }}>
                      {(profile.status || "Unknown").toUpperCase()}
                    </Tag>
                    <Tag style={{ borderRadius: 6, padding: "2px 10px", border: "none", fontWeight: 600, background: profile.onboardingCompleted ? "#ECFDF5" : "#FFF7ED", color: profile.onboardingCompleted ? GN : AMB }}>
                      {profile.onboardingCompleted ? "Onboarded" : "Pending Onboarding"}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {[
            { icon: <BarChartOutlined />, label: "Applications Submitted", value: pm.totalCasesSubmitted ?? 0, color: PM },
            { icon: <CheckCircleOutlined />, label: "Applications Approved", value: pm.totalCasesApproved ?? 0, color: GN },
            { icon: <TrophyOutlined />, label: "Disbursed", value: pm.totalCasesDisbursed ?? 0, color: AMB },
            { icon: <DollarOutlined />, label: "Commission", value: `AED ${Number(pm.totalCommissionEarned || 0).toLocaleString()}`, color: GN },
            { icon: <PercentageOutlined />, label: "Conversion Rate", value: `${pm.conversionRate || 0}%`, color: BL },
            { icon: <ClockCircleOutlined />, label: "Avg Processing", value: pm.averageProcessingDays ? `${pm.averageProcessingDays}d` : "—", color: "#8B5CF6" },
          ].map(s => (
            <Col xs={24} sm={12} md={8} lg={4} key={s.label}><StatCard {...s} /></Col>
          ))}
        </Row>

        <Row gutter={[20, 20]}>
          <Col xs={24} lg={14}>
            <SectionCard style={{ marginBottom: 20 }}>
              <SectionHeader icon={<HomeOutlined />} title="Company Information" />
              <InfoRow icon={<IdcardOutlined />} label="Trade License No." value={profile.tradeLicenseNumber} />
              <InfoRow icon={<CalendarOutlined />} label="License Issue Date" value={fmtDate(profile.tradeLicenseIssueDate)} />
              <InfoRow icon={<CalendarOutlined />} label="License Expiry Date" value={fmtDate(profile.tradeLicenseExpiryDate)} />
              <InfoRow icon={<SafetyCertificateOutlined />} label="Tax Reg. Number" value={profile.taxRegistrationNumber} />
              <InfoRow icon={<GlobalOutlined />} label="Website" value={profile.website} extra={profile.website && <Button type="link" icon={<LinkOutlined />} href={`https://${profile.website.replace(/^https?:\/\//, "")}`} target="_blank" />} />
              <InfoRow icon={<CalendarOutlined />} label="Year Established" value={profile.yearEstablished} />
              <InfoRow icon={<BankOutlined />} label="No. of Branches" value={profile.numberOfBranches} />
              <InfoRow icon={<TeamOutlined />} label="No. of Agents" value={profile.numberOfAgents} isLast />
            </SectionCard>

            <SectionCard style={{ marginBottom: 20 }}>
              <SectionHeader icon={<UserOutlined />} title="Primary Contact" />
              <InfoRow icon={<UserOutlined />} label="Full Name" value={pc.name} />
              <InfoRow icon={<BankOutlined />} label="Designation" value={pc.designation} />
              <InfoRow icon={<MailOutlined />} label="Email" value={pc.email} />
              <InfoRow icon={<PhoneOutlined />} label="Phone" value={pc.countryCode && pc.phone ? `${pc.countryCode} ${pc.phone}` : pc.phone} />
              <InfoRow icon={<PhoneOutlined />} label="Alternative Phone" value={pc.alternativePhone} />
              <InfoRow icon={<PhoneOutlined />} label="WhatsApp" value={pc.whatsappNumber} />
              <InfoRow icon={<IdcardOutlined />} label="Emirates ID" value={pc.emiratesId} isLast />
            </SectionCard>

            {sc?.name && (
              <SectionCard style={{ marginBottom: 20 }}>
                <SectionHeader icon={<TeamOutlined />} title="Secondary Contact" />
                <InfoRow icon={<UserOutlined />} label="Full Name" value={sc.name} />
                <InfoRow icon={<BankOutlined />} label="Designation" value={sc.designation} />
                <InfoRow icon={<MailOutlined />} label="Email" value={sc.email} />
                <InfoRow icon={<PhoneOutlined />} label="Phone" value={sc.countryCode && sc.phone ? `${sc.countryCode} ${sc.phone}` : sc.phone} />
                <InfoRow icon={<PhoneOutlined />} label="Alternative Phone" value={sc.alternativePhone} />
                <InfoRow icon={<IdcardOutlined />} label="Emirates ID" value={sc.emiratesId} isLast />
              </SectionCard>
            )}

            <SectionCard style={{ marginBottom: 20 }}>
              <SectionHeader icon={<PercentageOutlined />} title="Commission Structure" />
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ background: "#F5F3FF", borderRadius: 12, padding: 16 }}>
                    <Text strong>Tier 1 (≤ 5M AED)</Text>
                    <p style={{ fontSize: 24, fontWeight: 800, color: P }}>{cc.tier1?.commissionPercentage ?? "—"}%</p>
                    <Text type="secondary">{cc.tier1?.description}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ background: "#ECFDF5", borderRadius: 12, padding: 16 }}>
                    <Text strong>Tier 2 (5M AED - 10M AED)</Text>
                    <p style={{ fontSize: 24, fontWeight: 800, color: "#059669" }}>{cc.tier2?.commissionPercentage ?? "—"}%</p>
                    <Text type="secondary">{cc.tier2?.description}</Text>
                  </div>
                </Col>
              </Row>
              <div style={{ marginTop: 12 }}>
                <InfoRow icon={<FileOutlined />} label="Payment Terms" value={cc.paymentTerms} />
                <InfoRow icon={<BarChartOutlined />} label="Calculation Basis" value={cc.calculationBasis} isLast />
              </div>
            </SectionCard>

            <SectionCard>
              <SectionHeader icon={<FileOutlined />} title="Partnership Agreement" />
              <InfoRow icon={<FileOutlined />} label="Agreement Type" value={ag.agreementType} />
              <InfoRow icon={<CalendarOutlined />} label="Start Date" value={fmtDate(ag.startDate)} />
              <InfoRow icon={<CalendarOutlined />} label="End Date" value={fmtDate(ag.endDate)} />
              <InfoRow icon={<CalendarOutlined />} label="Signed Date" value={fmtDate(ag.signedDate)} />
              <InfoRow icon={<UserOutlined />} label="Signed by XOTO" value={ag.signedByXoto} />
              <InfoRow icon={<UserOutlined />} label="Signed by Partner" value={ag.signedByPartner} />
              <InfoRow icon={<CheckCircleOutlined />} label="Auto Renew" value={ag.autoRenew ? "Yes" : "No"} isLast />
              {ag.documentUrl && (
                <Button type="link" icon={<FileOutlined />} href={ag.documentUrl} target="_blank" style={{ paddingLeft: 0 }}>
                  View Agreement
                </Button>
              )}
            </SectionCard>
          </Col>

          <Col xs={24} lg={10}>
            <SectionCard style={{ marginBottom: 20 }}>
              <SectionHeader icon={<EnvironmentOutlined />} title="Addresses" />
              <div style={{ marginBottom: 12 }}><AddrBlock title="Billing Address" addr={ba} /></div>
              <AddrBlock title="Shipping Address" addr={sa} />
            </SectionCard>

            <SectionCard style={{ marginBottom: 20 }}>
              <SectionHeader icon={<BankOutlined />} title="Bank Details" />
              <InfoRow icon={<UserOutlined />} label="Beneficiary Name" value={bk.beneficiaryName} />
              <InfoRow icon={<BankOutlined />} label="Bank Name" value={bk.bankName} />
              <InfoRow icon={<IdcardOutlined />} label="Account Number" value={bk.accountNumber} />
              <InfoRow icon={<IdcardOutlined />} label="IBAN" value={bk.iban} />
              <InfoRow icon={<GlobalOutlined />} label="SWIFT Code" value={bk.swiftCode} />
              <InfoRow icon={<BankOutlined />} label="Branch Name" value={bk.branchName} />
              <InfoRow icon={<BankOutlined />} label="Account Type" value={bk.accountType} />
              <InfoRow icon={<SafetyCertificateOutlined />} label="Bank Verified" value={bk.verified ? "✓ Verified" : "Pending"} isLast />
            </SectionCard>

            <SectionCard style={{ marginBottom: 20 }}>
              <SectionHeader icon={<SafetyCertificateOutlined />} title="Account Status" />
              <Space direction="vertical" style={{ width: "100%" }} size={10}>
                <StatusRow label="Account Active" active={isActive} color={GN} />
                <StatusRow label="Onboarding Complete" active={!!profile.onboardingCompleted} color={GN} />
                <StatusRow label="Bank Verified" active={!!bk.verified} color={BL} />
                <StatusRow label="Agreement Signed" active={!!(ag.signedByXoto && ag.signedByPartner)} color={PM} />
                <StatusRow label="Auto Renew" active={!!ag.autoRenew} color={AMB} />
              </Space>
            </SectionCard>

            <SectionCard>
              <SectionHeader icon={<ClockCircleOutlined />} title="Account Information" />
              <InfoRow icon={<CalendarOutlined />} label="Created At" value={fmtDate(profile.createdAt)} />
              <InfoRow icon={<CalendarOutlined />} label="Last Updated" value={fmtDate(profile.updatedAt)} />
              <InfoRow icon={<CalendarOutlined />} label="Dropdown Available From" value={fmtDate(profile.dropdownAvailableFrom)} />
              {profile.suspendedAt && (
                <>
                  <InfoRow icon={<StopOutlined />} label="Suspended At" value={fmtDate(profile.suspendedAt)} />
                  <InfoRow icon={<FileOutlined />} label="Suspension Reason" value={profile.suspensionReason} />
                </>
              )}
              <InfoRow icon={<IdcardOutlined />} label="Partner ID" value={profile._id || profile.id} isLast />

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #f0e8ff" }}>
                <Button
                  icon={<LockOutlined />}
                  onClick={() => { pwdForm.resetFields(); setPwdModal(true); }}
                  style={{ width: "100%", borderRadius: 10, fontWeight: 600, borderColor: P, color: P, height: 40 }}
                >
                  Change Password
                </Button>
              </div>
            </SectionCard>
          </Col>
        </Row>
      </div>

      {/* Change Password Modal */}
      <Modal
        open={pwdModal}
        onCancel={() => !pwdLoading && setPwdModal(false)}
        footer={null}
        width={440}
        destroyOnClose
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LockOutlined style={{ color: P }} />
            <span>Change Password</span>
          </div>
        }
      >
        <div style={{ padding: "8px 0" }}>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#92400e" }}>
            Enter your current password to confirm your identity, then set a new password.
          </div>
          <Form form={pwdForm} layout="vertical" onFinish={handleChangePassword}>
            <Form.Item name="oldPassword" label="Current Password" rules={[{ required: true, message: "Current password is required" }]}>
              <Input.Password size="large" style={{ borderRadius: 10 }} placeholder="Enter current password" />
            </Form.Item>
            <Form.Item name="newPassword" label="New Password"
              rules={[{ required: true, message: "Required" }, { min: 8, message: "Min 8 characters" }]}>
              <Input.Password size="large" style={{ borderRadius: 10 }} placeholder="Min 8 characters" />
            </Form.Item>
            <Form.Item name="confirmPassword" label="Confirm New Password" dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Required" },
                ({ getFieldValue }) => ({
                  validator(_, v) {
                    if (!v || getFieldValue("newPassword") === v) return Promise.resolve();
                    return Promise.reject("Passwords do not match");
                  },
                }),
              ]}>
              <Input.Password size="large" style={{ borderRadius: 10 }} placeholder="Re-enter new password" />
            </Form.Item>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
              <Button onClick={() => setPwdModal(false)} disabled={pwdLoading}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={pwdLoading} icon={<LockOutlined />}
                style={{ background: P, borderColor: P, borderRadius: 10 }}>
                Update Password
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={860}
        destroyOnClose
        closeIcon={<CloseOutlined style={{ color: "#9b8ab0" }} />}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <EditOutlined style={{ color: P }} />
            <span>Edit Partner Profile</span>
          </div>
        }
        styles={{ body: { padding: "24px 28px", maxHeight: "75vh", overflowY: "auto" } }}
      >
        <div className="vpp">
          <Form form={form} layout="vertical" onFinish={handleUpdate} initialValues={{ billingAddress_country: "UAE" }}>
            <Divider orientation="left">Company Information</Divider>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="companyName" label="Company Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="dbaName" label="DBA Name"><Input /></Form.Item></Col>
              <Col span={8}>
                <Form.Item name="legalEntityType" label="Legal Entity Type" rules={[{ required: true }]}>
                  <Select>
                    <Option value="LLC">LLC</Option>
                    <Option value="Sole Proprietorship">Sole Proprietorship</Option>
                    <Option value="Branch Office">Branch Office</Option>
                    <Option value="Free Zone Company">Free Zone Company</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}><Form.Item name="tradeLicenseNumber" label="Trade License No." rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={8}><Form.Item name="taxRegistrationNumber" label="Tax Reg. Number"><Input /></Form.Item></Col>
              <Col span={8}><Form.Item name="tradeLicenseIssueDate" label="License Issue Date" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="tradeLicenseExpiryDate" label="License Expiry Date" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="website" label="Website"><Input addonBefore="https://" /></Form.Item></Col>
              <Col span={8}><Form.Item name="yearEstablished" label="Year Established"><Input type="number" /></Form.Item></Col>
              <Col span={8}><Form.Item name="numberOfBranches" label="No. of Branches"><Input type="number" /></Form.Item></Col>
              <Col span={8}><Form.Item name="numberOfAgents" label="No. of Agents"><Input type="number" /></Form.Item></Col>
            </Row>

            <Divider orientation="left">Primary Contact</Divider>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="primaryContact_name" label="Full Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="primaryContact_designation" label="Designation"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="primaryContact_email" label="Email" rules={[{ required: true, type: "email" }]}><Input /></Form.Item></Col>
              <Col span={6}><Form.Item name="primaryContact_countryCode" label="Country Code" rules={[{ required: true }]}><Input placeholder="+971" /></Form.Item></Col>
              <Col span={6}><Form.Item name="primaryContact_phone" label="Phone" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="primaryContact_alternativePhone" label="Alternative Phone"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="primaryContact_whatsappNumber" label="WhatsApp"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="primaryContact_emiratesId" label="Emirates ID"><Input /></Form.Item></Col>
            </Row>

            <Divider orientation="left">Secondary Contact (Optional)</Divider>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="secondaryContact_name" label="Full Name"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="secondaryContact_designation" label="Designation"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="secondaryContact_email" label="Email"><Input type="email" /></Form.Item></Col>
              <Col span={6}><Form.Item name="secondaryContact_countryCode" label="Country Code"><Input placeholder="+971" /></Form.Item></Col>
              <Col span={6}><Form.Item name="secondaryContact_phone" label="Phone"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="secondaryContact_alternativePhone" label="Alternative Phone"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="secondaryContact_whatsappNumber" label="WhatsApp"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="secondaryContact_emiratesId" label="Emirates ID"><Input /></Form.Item></Col>
            </Row>

            <Divider orientation="left">Billing Address</Divider>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="billingAddress_buildingName" label="Building Name"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="billingAddress_floorUnit" label="Floor / Unit"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="billingAddress_area" label="Area"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="billingAddress_city" label="City"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="billingAddress_poBox" label="PO Box"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="billingAddress_country" label="Country"><Input /></Form.Item></Col>
            </Row>

            <Divider orientation="left">Shipping Address (Optional)</Divider>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="shippingAddress_buildingName" label="Building Name"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="shippingAddress_floorUnit" label="Floor / Unit"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="shippingAddress_area" label="Area"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="shippingAddress_city" label="City"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="shippingAddress_poBox" label="PO Box"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="shippingAddress_country" label="Country"><Input /></Form.Item></Col>
            </Row>

            <Divider orientation="left">Bank Details</Divider>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="bankDetails_beneficiaryName" label="Beneficiary Name"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="bankDetails_bankName" label="Bank Name"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="bankDetails_accountNumber" label="Account Number"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="bankDetails_iban" label="IBAN"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="bankDetails_swiftCode" label="SWIFT Code"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="bankDetails_branchName" label="Branch Name"><Input /></Form.Item></Col>
              <Col span={12}>
                <Form.Item name="bankDetails_accountType" label="Account Type">
                  <Select allowClear>
                    <Option value="Business Current">Business Current</Option>
                    <Option value="Business Savings">Business Savings</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Commission Configuration</Divider>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="tier1_loanAmountMax" label="Tier 1 Max Loan (AED)"><Input type="number" /></Form.Item></Col>
              <Col span={12}><Form.Item name="tier1_commissionPercentage" label="Tier 1 Commission (%)"><Input type="number" /></Form.Item></Col>
              <Col span={12}><Form.Item name="tier2_commissionPercentage" label="Tier 2 Commission (%)"><Input type="number" /></Form.Item></Col>
              <Col span={12}><Form.Item name="paymentTerms" label="Payment Terms"><Input /></Form.Item></Col>
            </Row>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 16, borderTop: "1px solid #f0e8ff" }}>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={updating} style={{ background: P, borderColor: P }}>Save Changes</Button>
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
};

export default VaultPartnerProfile;
