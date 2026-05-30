import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Form, Input, Button, Row, Col, Typography, Space, message,
  Select, DatePicker, InputNumber, Upload, Avatar, Divider,
} from "antd";
import {
  UserOutlined, CheckOutlined, BuildOutlined,
  LoadingOutlined, ArrowLeftOutlined, InfoCircleOutlined,
  LockOutlined, CameraOutlined, DeleteOutlined, PlusOutlined,
} from "@ant-design/icons";
import { Country } from "country-state-city";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { apiService } from "@/api/apiService";
import PartnerList from "./PartnerList";

const { Title, Text } = Typography;
const { Option } = Select;

const P    = "#5C039B";
const GN   = "#10b981";
const GRAD = "linear-gradient(135deg, #5C039B 0%, #7C3AED 50%, #03A4F4 100%)";

const NATIONALITIES = [
  "United Arab Emirates", "Saudi Arabia", "India", "Pakistan", "Egypt",
  "Jordan", "Lebanon", "Philippines", "United Kingdom", "United States",
  "Australia", "Canada", "Germany", "France", "Other",
];

/* ── Section card ── */
const Section = ({ title, subtitle, icon, children }) => (
  <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9f6", marginBottom: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
    <div style={{ padding: "18px 28px 14px", borderBottom: "1px solid #f5f0ff", background: "linear-gradient(135deg,#faf8ff,#f3efff)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: P, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#1a0533" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: "#9b8ab0", marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
    </div>
    <div style={{ padding: "22px 28px" }}>{children}</div>
  </div>
);

export default function VaultPartners() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mode, setMode] = useState(
    location.pathname.includes("/partners/list") ? "list" : "onboard"
  );
  const [form] = Form.useForm();
  const [loading, setLoading]                   = useState(false);
  const [done, setDone]                         = useState(false);
  const [partnerType, setPartnerType]           = useState("institution");
  const [profileUrl, setProfileUrl]             = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);

  useEffect(() => {
    setMode(location.pathname.includes("/partners/list") ? "list" : "onboard");
  }, [location.pathname]);

  const countryOptions = useMemo(() => {
    const priority = ["AE", "IN", "SA", "US", "GB"];
    return Country.getAllCountries()
      .map(c => ({ name: c.name, code: c.phonecode, iso: c.isoCode, flag: `https://flagcdn.com/w20/${c.isoCode.toLowerCase()}.png` }))
      .sort((a, b) => {
        const ap = priority.includes(a.iso), bp = priority.includes(b.iso);
        if (ap && !bp) return -1; if (!ap && bp) return 1;
        return a.name.localeCompare(b.name);
      });
  }, []);

  /* ── Profile upload ── */
  const handleProfileUpload = async (file) => {
    setUploadingProfile(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiService.upload("/upload", fd);
      const url = res?.data?.file?.url || res?.file?.url || res?.data?.url || res?.url || "";
      if (url) { setProfileUrl(url); message.success("Profile photo uploaded!"); }
      else      { message.error("Upload failed — no URL returned"); }
    } catch {
      message.error("Failed to upload profile photo");
    } finally {
      setUploadingProfile(false);
    }
    return false;
  };

  /* ── Reset ── */
  const resetForm = () => {
    form.resetFields();
    setProfileUrl("");
    setPartnerType("institution");
    setDone(false);
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    try {
      await form.validateFields();
    } catch {
      message.error("Please fill all required fields correctly");
      return;
    }
    const v = form.getFieldsValue(true);
    setLoading(true);
    try {
      const dialCode = v.primaryDialCode || "971";
      const payload = {
        partnerCategory: partnerType === "institution" ? "company" : "individual",
        profilePic: profileUrl || null,
        email:    v.loginEmail,
        password: v.password,
        primaryContact: {
          name:        v.primaryName,
          designation: v.primaryDesignation || null,
          email:       v.primaryEmail,
          countryCode: `+${dialCode}`,
          phone:       v.primaryPhone || "",
        },
        billingAddress: {
          buildingName: v.buildingName || null,
          area:         v.area        || null,
          city:         v.city        || "Dubai",
          country:      v.country     || "UAE",
        },
        commissionConfiguration: {
          tier1: { loanAmountMax: 5000000,  commissionPercentage: Number(v.tier1Pct) || 80 },
          tier2: { loanAmountMin: 5000001,  commissionPercentage: Number(v.tier2Pct) || 85 },
          paymentTerms: "Net 30 days after disbursement",
        },
        agreementDetails: {
          agreementType:   v.agreementType  || "Commercial Partnership Agreement",
          startDate:       v.agreementStart?.toISOString()  || null,
          endDate:         v.agreementEnd?.toISOString()    || null,
          signedByPartner: v.signedByPartner,
          signedDate:      v.signedDate?.toISOString()      || null,
          signedByXoto:    "Xoto Prophet LLC",
          autoRenew:       true,
        },
      };
      if (partnerType === "institution") {
        payload.companyName        = v.companyName;
        payload.tradeLicenseNumber = v.tradeLicenseNumber;
        payload.legalEntityType    = v.legalEntityType || null;
      }
      if (partnerType === "individual") {
        payload.individualDetails = {
          firstName:   v.firstName,
          lastName:    v.lastName,
          emiratesId:  v.emiratesId,
          nationality: v.nationality,
          dateOfBirth: v.dateOfBirth?.toISOString() || null,
        };
      }
      const response = await apiService.post("/vault/partner/create", payload);
      if (response?.success || response?.data || response?.partner) {
        message.success("Partner onboarded successfully!");
        setDone(true);
      } else {
        throw new Error(response?.message || "Something went wrong");
      }
    } catch (err) {
      message.error(err?.response?.data?.message || err.message || "Failed to create partner");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "list") return <PartnerList />;

  /* ── Success screen ── */
  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, width: "100%", background: "#fff", borderRadius: 24, padding: 40, textAlign: "center", boxShadow: "0 20px 48px rgba(92,3,155,0.12)" }}>
          <div style={{ width: 80, height: 80, background: GRAD, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckOutlined style={{ fontSize: 36, color: "#fff" }} />
          </div>
          <Title level={3} style={{ color: "#1f2937", margin: "0 0 8px" }}>Partner Onboarded!</Title>
          <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 28 }}>
            Account created successfully. Login credentials have been sent to the partner.
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Button size="large" block onClick={resetForm} style={{ borderRadius: 12, fontWeight: 600, borderColor: P, color: P }}>
              Onboard Another Partner
            </Button>
            <Button size="large" type="primary" block onClick={() => navigate("/dashboard/vault-admin/partners/list")}
              style={{ borderRadius: 12, fontWeight: 600, background: GRAD, borderColor: "transparent" }}>
              View Partner Directory
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle = { borderRadius: 10 };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#6b4f9a" };

  return (
    <div style={{ background: "#f4f0fa", minHeight: "100vh", padding: "0 0 48px" }}>
      <style>{`
        .partner-form .ant-form-item-label > label { font-size: 12px !important; font-weight: 700 !important; color: #6b4f9a !important; }
        .partner-form .ant-input { border-radius: 10px !important; }
        .partner-form .ant-input-affix-wrapper { border-radius: 10px !important; }
        .partner-form .ant-select-selector { border-radius: 10px !important; }
        .partner-form .ant-input-number { border-radius: 10px !important; }
        .partner-form .ant-picker { border-radius: 10px !important; width: 100% !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: GRAD, padding: "28px 32px 36px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30,   width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -40, left: "40%", width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>
              Admin Console · Partners
            </div>
            <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: 0 }}>Onboard New Partner</h1>
            <p style={{ color: "rgba(255,255,255,0.75)", margin: "4px 0 0", fontSize: 12 }}>
              Fill all sections below and submit to create the partner account.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button icon={<DeleteOutlined />} onClick={resetForm}
              style={{ borderRadius: 12, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontWeight: 600 }}>
              Clear Form
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}
              style={{ borderRadius: 12, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontWeight: 600 }}>
              Back
            </Button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "-16px auto 0", padding: "0 20px", position: "relative", zIndex: 10 }}>

        <Form
          form={form}
          layout="vertical"
          className="partner-form"
          initialValues={{ legalEntityType: "LLC", city: "Dubai", country: "UAE", tier1Pct: 80, tier2Pct: 85, primaryDialCode: "971", agreementType: "Commercial Partnership Agreement" }}
        >

          {/* ── PROFILE PHOTO + PARTNER TYPE ── */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9f6", marginBottom: 20, overflow: "hidden", boxShadow: "0 4px 20px rgba(92,3,155,0.06)" }}>
            <div style={{ padding: "22px 28px", display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
              {/* Profile photo upload */}
              <Upload showUploadList={false} beforeUpload={handleProfileUpload} accept="image/*">
                <div style={{ position: "relative", cursor: "pointer" }}>
                  <Avatar
                    size={100}
                    src={profileUrl || undefined}
                    icon={<UserOutlined />}
                    style={{
                      border: `3px solid ${profileUrl ? GN : "#e9d5ff"}`,
                      background: profileUrl ? undefined : "#f5f0ff",
                      boxShadow: "0 6px 20px rgba(92,3,155,0.18)",
                    }}
                  />
                  {uploadingProfile && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <LoadingOutlined style={{ color: "#fff", fontSize: 20 }} />
                    </div>
                  )}
                  <div style={{ position: "absolute", bottom: 2, right: 2, width: 30, height: 30, background: P, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", boxShadow: "0 2px 8px rgba(92,3,155,0.4)" }}>
                    <CameraOutlined style={{ color: "#fff", fontSize: 13 }} />
                  </div>
                  {profileUrl && (
                    <div
                      onClick={(e) => { e.stopPropagation(); setProfileUrl(""); }}
                      style={{ position: "absolute", top: -4, right: -4, width: 22, height: 22, background: "#ef4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", cursor: "pointer" }}
                    >
                      <DeleteOutlined style={{ color: "#fff", fontSize: 10 }} />
                    </div>
                  )}
                </div>
              </Upload>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a0533", marginBottom: 4 }}>
                  {profileUrl ? "Profile photo set" : "Upload Profile / Company Logo"}
                </div>
                <div style={{ fontSize: 12, color: "#9b8ab0", marginBottom: 14 }}>
                  {profileUrl ? "Click the × to remove and upload a different photo." : "Click the avatar to upload. JPG, PNG supported (optional)."}
                </div>
                {/* Partner type pills */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { value: "institution", icon: <BuildOutlined />, label: "Institutional Partner", desc: "Company · LLC · FZE" },
                    { value: "individual",  icon: <UserOutlined  />, label: "Individual Partner",   desc: "Freelancer · Broker" },
                  ].map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => setPartnerType(opt.value)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "12px 18px",
                        borderRadius: 14, cursor: "pointer", transition: "all .2s",
                        border: `2px solid ${partnerType === opt.value ? P : "#e9d5ff"}`,
                        background: partnerType === opt.value ? "#f5f0ff" : "#fafafc",
                        boxShadow: partnerType === opt.value ? "0 4px 16px rgba(92,3,155,0.12)" : "none",
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: partnerType === opt.value ? P : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>
                        {opt.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: partnerType === opt.value ? P : "#374151" }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{opt.desc}</div>
                      </div>
                      {partnerType === opt.value && (
                        <CheckOutlined style={{ color: P, marginLeft: 4 }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 1: IDENTITY ── */}
          <Section title="Identity Information" subtitle="Legal details of the partner entity" icon={<UserOutlined />}>
            {partnerType === "institution" && (
              <Row gutter={[20, 0]}>
                <Col xs={24} md={10}>
                  <Form.Item name="companyName" label="Registered Company Name" rules={[{ required: true, message: "Company name is required" }]}>
                    <Input placeholder="Dubai Real Estate Brokers LLC" size="large" style={inputStyle} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="tradeLicenseNumber" label="Trade License Number" rules={[{ required: true, message: "Required" }]}>
                    <Input placeholder="TL-987654" size="large" style={inputStyle} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="legalEntityType" label="Legal Entity Type">
                    <Select size="large">
                      {["LLC", "FZE", "PJSC", "Sole Proprietorship", "Branch Office"].map(v => <Option key={v} value={v}>{v}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            )}
            {partnerType === "individual" && (
              <Row gutter={[20, 0]}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: "Required" }]}>
                    <Input placeholder="Ahmed" size="large" style={inputStyle} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: "Required" }]}>
                    <Input placeholder="Al Mansouri" size="large" style={inputStyle} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="emiratesId" label="Emirates ID" rules={[{ required: true, message: "Required" }]}>
                    <Input placeholder="784-XXXX-XXXXXXX-X" size="large" style={inputStyle} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="nationality" label="Nationality" rules={[{ required: true, message: "Required" }]}>
                    <Select size="large" showSearch placeholder="Select Nationality">
                      {NATIONALITIES.map(n => <Option key={n} value={n}>{n}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true, message: "Required" }]}>
                    <DatePicker style={{ width: "100%" }} size="large" format="DD/MM/YYYY" placeholder="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </Section>

          {/* ── SECTION 2: CONTACT & ADDRESS ── */}
          <Section title="Contact & Address" subtitle="Primary representative and billing address" icon="📞">
            <Row gutter={[20, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item name="primaryName" label="Contact Person Name" rules={[{ required: true, message: "Required" }]}>
                  <Input placeholder="Mohammed Ahmed" size="large" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="primaryDesignation" label="Designation / Title">
                  <Input placeholder="Managing Director" size="large" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="primaryEmail" label="Contact Email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
                  <Input placeholder="contact@company.ae" size="large" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Mobile Number" required>
                  <Space.Compact style={{ width: "100%" }}>
                    <Form.Item name="primaryDialCode" noStyle rules={[{ required: true }]}>
                      <Select showSearch optionFilterProp="children" style={{ width: 110 }} size="large">
                        {countryOptions.map(item => (
                          <Option key={item.iso} value={item.code}>
                            <Space size={4}><img src={item.flag} width="18" alt={item.iso} style={{ borderRadius: 2 }} />+{item.code}</Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item name="primaryPhone" noStyle rules={[
                      { required: true, message: "Phone required" },
                      { validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const code = form.getFieldValue("primaryDialCode");
                        const parsed = parsePhoneNumberFromString(`+${code}${value}`);
                        return parsed?.isValid() ? Promise.resolve() : Promise.reject("Invalid number");
                      }},
                    ]}>
                      <Input placeholder="501234567" size="large" style={{ borderTopRightRadius: 10, borderBottomRightRadius: 10 }} />
                    </Form.Item>
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>
            <Divider style={{ margin: "8px 0 20px", borderColor: "#f0ebff" }} />
            <Row gutter={[20, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item name="buildingName" label="Building / Office">
                  <Input placeholder="Boulevard Plaza Tower 1, Office 1402" size="large" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="area" label="Area / Community">
                  <Input placeholder="Downtown Dubai" size="large" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="city" label="City" rules={[{ required: true }]}>
                  <Input placeholder="Dubai" size="large" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="country" label="Country" rules={[{ required: true }]}>
                  <Select size="large">
                    {["UAE", "Saudi Arabia", "Bahrain", "Oman", "Kuwait", "Qatar"].map(v => <Option key={v} value={v}>{v}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Section>

          {/* ── SECTION 3: COMMERCIALS ── */}
          <Section title="Commission & Agreement" subtitle="Payout tiers and partnership agreement details" icon="💰">
            <Row gutter={[20, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item name="tier1Pct" label="Tier 1 — Loans ≤ AED 5M (%)" rules={[{ required: true }]}
                  extra={<span style={{ fontSize: 11, color: "#9ca3af" }}>Default: 80%</span>}>
                  <InputNumber size="large" style={{ width: "100%" }} min={0} max={100} addonAfter="%" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="tier2Pct" label="Tier 2 — Loans > AED 5M (%)" rules={[{ required: true }]}
                  extra={<span style={{ fontSize: 11, color: "#9ca3af" }}>Default: 85%</span>}>
                  <InputNumber size="large" style={{ width: "100%" }} min={0} max={100} addonAfter="%" />
                </Form.Item>
              </Col>
            </Row>
            <Divider style={{ margin: "8px 0 20px", borderColor: "#f0ebff" }} />
            <Row gutter={[20, 0]}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="agreementStart" label="Agreement Start Date" rules={[{ required: true, message: "Required" }]}>
                  <DatePicker style={{ width: "100%" }} size="large" format="DD/MM/YYYY" placeholder="Start date" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="agreementEnd" label="Agreement End Date" rules={[{ required: true, message: "Required" }]}>
                  <DatePicker style={{ width: "100%" }} size="large" format="DD/MM/YYYY" placeholder="End date" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="signedDate" label="Date Signed" rules={[{ required: true, message: "Required" }]}>
                  <DatePicker style={{ width: "100%" }} size="large" format="DD/MM/YYYY" placeholder="Signature date" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="signedByPartner" label="Signed By (Partner Rep.)" rules={[{ required: true, message: "Required" }]}>
                  <Input placeholder="Authorized representative name" size="large" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="agreementType" label="Agreement Type">
                  <Input placeholder="Commercial Partnership Agreement" size="large" style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
          </Section>

          {/* ── SECTION 4: CREDENTIALS ── */}
          <Section title="Portal Access Credentials" subtitle="Login email and password for the partner portal" icon={<LockOutlined />}>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10 }}>
              <InfoCircleOutlined style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: "#92400e" }}>
                Credentials will be sent to the partner's email on submission. Ask them to change the password on first login.
              </div>
            </div>
            <Row gutter={[20, 0]}>
              <Col xs={24}>
                <Form.Item name="loginEmail" label="Partner Login Email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
                  <Input placeholder="partner@company.ae" size="large" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="password" label="Password" rules={[{ required: true, min: 8, message: "Min 8 characters" }]}>
                  <Input.Password placeholder="Set access password" size="large" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="confirmPassword" label="Confirm Password" dependencies={["password"]}
                  rules={[
                    { required: true, message: "Required" },
                    ({ getFieldValue }) => ({
                      validator(_, v) {
                        if (!v || getFieldValue("password") === v) return Promise.resolve();
                        return Promise.reject("Passwords do not match");
                      },
                    }),
                  ]}>
                  <Input.Password placeholder="Re-enter password" size="large" style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
          </Section>

          {/* ── SUBMIT BAR ── */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #ede9f6", boxShadow: "0 4px 20px rgba(92,3,155,0.06)" }}>
            <div style={{ fontSize: 12, color: "#9b8ab0" }}>
              Partner type: <strong style={{ color: P }}>{partnerType === "institution" ? "Institutional" : "Individual"}</strong>
              {profileUrl && <span style={{ marginLeft: 12, color: GN }}>✓ Photo attached</span>}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Button size="large" onClick={resetForm} style={{ borderRadius: 12, fontWeight: 600 }} icon={<DeleteOutlined />}>
                Clear
              </Button>
              <Button
                size="large" type="primary" onClick={handleSubmit} loading={loading}
                icon={<PlusOutlined />}
                style={{ borderRadius: 12, fontWeight: 700, background: GRAD, borderColor: "transparent", paddingInline: 32 }}
              >
                {loading ? "Creating…" : "Create Partner Account"}
              </Button>
            </div>
          </div>

        </Form>
      </div>
    </div>
  );
}
