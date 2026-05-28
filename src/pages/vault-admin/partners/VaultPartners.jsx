// src/pages/vault-admin/partners/VaultPartners.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Form, Input, Button, Row, Col, Typography, Space, message,
  Select, DatePicker, InputNumber, Upload, Avatar, Divider, Steps
} from "antd";
import {
  UserOutlined, CheckOutlined, UploadOutlined, BuildOutlined,
  LoadingOutlined, ArrowLeftOutlined, InfoCircleOutlined,
  ArrowRightOutlined, ContactsOutlined, FileProtectOutlined,
  LockOutlined, SafetyCertificateOutlined, EnvironmentOutlined
} from "@ant-design/icons";
import { Country } from "country-state-city";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { apiService } from "@/api/apiService";
import PartnerList from "./PartnerList";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const P    = "#5C039B";
const PM   = "#7C3AED";
const PL   = "#f3e8ff";
const PB   = "#e9d5ff";
const GN   = "#10b981";
const GRAD = "linear-gradient(135deg, #5C039B 0%, #7C3AED 50%, #03A4F4 100%)";

const NATIONALITIES = [
  "United Arab Emirates", "Saudi Arabia", "India", "Pakistan", "Egypt",
  "Jordan", "Lebanon", "Philippines", "United Kingdom", "United States",
  "Australia", "Canada", "Germany", "France", "Other",
];

export default function VaultPartners() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mode, setMode] = useState(
    location.pathname.includes("/partners/list") ? "list" : "onboard"
  );
  const [form]          = Form.useForm();
  const [loading, setLoading]           = useState(false);
  const [done, setDone]                 = useState(false);
  const [partnerType, setPartnerType]   = useState("institution"); // 'institution' | 'individual'
  const [profileUrl, setProfileUrl]     = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [currentStep, setCurrentStep]   = useState(0);

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

  const handleProfileUpload = async (file) => {
    setUploadingProfile(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiService.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = res?.data?.file?.url || res?.file?.url || res?.data?.url || res?.url || "";
      if (url) {
        setProfileUrl(url);
        message.success("Profile photo uploaded!");
      } else {
        message.error("Upload failed — no URL returned");
      }
    } catch {
      message.error("Failed to upload profile photo");
    } finally {
      setUploadingProfile(false);
    }
    return false;
  };

  // Step fields validation before moving forward
  const getFieldsForStep = (step) => {
    if (step === 0) {
      return partnerType === "institution"
        ? ["companyName", "tradeLicenseNumber", "legalEntityType"]
        : ["firstName", "lastName", "emiratesId", "nationality", "dateOfBirth"];
    }
    if (step === 1) {
      return ["primaryName", "primaryDesignation", "primaryEmail", "primaryDialCode", "primaryPhone", "buildingName", "area", "city", "country"];
    }
    if (step === 2) {
      return ["tier1Pct", "tier2Pct", "agreementStart", "agreementEnd", "signedDate", "signedByPartner", "agreementType"];
    }
    if (step === 3) {
      return ["loginEmail", "password", "confirmPassword"];
    }
    return [];
  };

  const handleNextStep = async () => {
    const fields = getFieldsForStep(currentStep);
    try {
      await form.validateFields(fields);
      setCurrentStep(prev => prev + 1);
    } catch {
      message.error("Please fill all required fields in this step correctly");
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    const fields = getFieldsForStep(3);
    try {
      await form.validateFields(fields);
    } catch {
      message.error("Please fill all credentials correctly");
      return;
    }

    const v = form.getFieldsValue(true);
    setLoading(true);
    try {
      const dialCode = v.primaryDialCode || "971";
      const phone    = v.primaryPhone || "";

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
          phone:       phone,
        },
        billingAddress: {
          buildingName: v.buildingName || null,
          area:         v.area || null,
          city:         v.city || "Dubai",
          country:      v.country || "UAE",
        },
        commissionConfiguration: {
          tier1: { loanAmountMax: 5000000, commissionPercentage: Number(v.tier1Pct) || 80 },
          tier2: { loanAmountMin: 5000001, commissionPercentage: Number(v.tier2Pct) || 85 },
          paymentTerms: "Net 30 days after disbursement",
        },
        agreementDetails: {
          agreementType:    v.agreementType || "Commercial Partnership Agreement",
          startDate:        v.agreementStart?.toISOString() || null,
          endDate:          v.agreementEnd?.toISOString() || null,
          signedByPartner:  v.signedByPartner,
          signedDate:       v.signedDate?.toISOString() || null,
          signedByXoto:     "Xoto Prophet LLC",
          autoRenew:        true,
        },
      };

      if (partnerType === "institution") {
        payload.companyName          = v.companyName;
        payload.tradeLicenseNumber   = v.tradeLicenseNumber;
        payload.legalEntityType      = v.legalEntityType || null;
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
        message.success("Partner created successfully!");
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

  const resetForm = () => {
    form.resetFields();
    setProfileUrl("");
    setPartnerType("institution");
    setCurrentStep(0);
    setDone(false);
  };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, width: "100%", background: "#fff", borderRadius: 24, padding: 40, textAlign: "center", boxShadow: "0 20px 48px rgba(92,3,155,0.12)" }}>
          <div style={{ width: 80, height: 80, background: GRAD, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckOutlined style={{ fontSize: 36, color: "#fff" }} />
          </div>
          <Title level={3} style={{ color: "#1f2937", margin: "0 0 8px" }}>Partner Onboarded!</Title>
          <Paragraph type="secondary" style={{ fontSize: 13 }}>
            The account has been created successfully. Login credentials and activation instructions have been sent to the partner.
          </Paragraph>
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
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

  if (mode === "list") return <PartnerList />;

  const stepperItems = [
    { title: "Identity", icon: <UserOutlined /> },
    { title: "Contact Info", icon: <ContactsOutlined /> },
    { title: "Commercials", icon: <FileProtectOutlined /> },
    { title: "Account Info", icon: <LockOutlined /> }
  ];

  return (
    <div style={{ background: "#F4F0FA", minHeight: "100vh", padding: "28px 24px", position: "relative", overflow: "hidden" }}>
      {/* Decorative ambient blobs */}
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(92,3,155,0.06)", filter: "blur(60px)", top: "5%", left: "-5%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "rgba(3,164,244,0.05)", filter: "blur(80px)", bottom: "10%", right: "-5%", pointerEvents: "none" }} />

      <div style={{ maxWidth: 840, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Hero Section */}
        <div style={{ background: GRAD, borderRadius: 24, padding: "28px 36px", marginBottom: 28, boxShadow: "0 10px 30px rgba(92,3,155,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>
                Admin Console · Partners
              </div>
              <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>Partner Onboarding Wizard</h1>
              <p style={{ color: "rgba(255,255,255,0.75)", margin: "4px 0 0", fontSize: 12 }}>
                Complete the wizard to onboard a company or freelancer and generate client-ready commission terms.
              </p>
            </div>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}
              style={{ borderRadius: 12, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontWeight: 600 }}>
              Back
            </Button>
          </div>
        </div>

        {/* Visual Progress Stepper */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", marginBottom: 24, border: "1px solid #ede9f6", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <Steps
            current={currentStep}
            size="small"
            items={stepperItems}
            style={{
              paddingInline: 12
            }}
          />
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{ legalEntityType: "LLC", city: "Dubai", country: "UAE", tier1Pct: 80, tier2Pct: 85, primaryDialCode: "971", agreementType: "Commercial Partnership Agreement" }}
        >
          {/* ─── STEP 0: IDENTITY ─────────────────────────────────── */}
          {currentStep === 0 && (
            <div style={{ background: "#fff", borderRadius: 24, padding: "32px 36px", border: "1px solid #edeaf2", boxShadow: "0 10px 40px rgba(92,3,155,0.03)", marginBottom: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ color: P, fontWeight: 800, margin: 0 }}>Establish Identity</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Select the classification and legal details for the partner entity.</Text>
              </div>
              <Divider style={{ margin: "0 0 24px", borderColor: "#f3eefc" }} />

              {/* Partner Type Cards */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 12 }}>
                  Entity Classification <span style={{ color: "#ef4444" }}>*</span>
                </div>
                <Row gutter={[16, 16]}>
                  {[
                    { value: "institution", icon: <BuildOutlined />, label: "Institutional Partner", desc: "Corporate entity, agency, LLC, FZE or PJSC" },
                    { value: "individual",  icon: <UserOutlined />,   label: "Individual Partner",    desc: "Freelance brokers, sole agents, and consultants" },
                  ].map(opt => (
                    <Col xs={24} sm={12} key={opt.value}>
                      <div
                        onClick={() => setPartnerType(opt.value)}
                        style={{
                          padding: "20px 24px", borderRadius: 16, cursor: "pointer",
                          border: `2px solid ${partnerType === opt.value ? P : "#edeef2"}`,
                          background: partnerType === opt.value ? PL : "#fafafc",
                          display: "flex", alignItems: "center", gap: 16, transition: "all 0.25s ease",
                          boxShadow: partnerType === opt.value ? "0 8px 24px rgba(92,3,155,0.08)" : "none"
                        }}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: partnerType === opt.value ? P : "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff", flexShrink: 0 }}>
                          {opt.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: partnerType === opt.value ? P : "#1f2937" }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{opt.desc}</div>
                        </div>
                        {partnerType === opt.value && (
                          <CheckOutlined style={{ color: P, fontWeight: 800 }} />
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* Profile Photo */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 12 }}>Profile / Logo Photo</div>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <Upload showUploadList={false} beforeUpload={handleProfileUpload} accept="image/*">
                    <div style={{ position: "relative", cursor: "pointer" }}>
                      <Avatar size={72} src={profileUrl} icon={<UserOutlined />} style={{ border: `3px solid ${profileUrl ? GN : "#e5e7eb"}`, background: "#f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                      {uploadingProfile && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <LoadingOutlined style={{ color: "#fff" }} />
                        </div>
                      )}
                      <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, background: P, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                        <UploadOutlined style={{ color: "#fff", fontSize: 12 }} />
                      </div>
                    </div>
                  </Upload>
                  <div>
                    {profileUrl
                      ? <div style={{ color: GN, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}><CheckOutlined /> Logo Uploaded</div>
                      : <Text type="secondary" style={{ fontSize: 12 }}>Click photo container to upload (optional). Supports JPG, PNG.</Text>
                    }
                  </div>
                </div>
              </div>

              <Divider style={{ margin: "20px 0", borderColor: "#f3eefc" }} />

              {/* Institution Fields */}
              {partnerType === "institution" && (
                <Row gutter={[20, 0]}>
                  <Col xs={24} md={10}>
                    <Form.Item name="companyName" label="Registered Company Name" rules={[{ required: true, message: "Company name is required" }]}>
                      <Input placeholder="Dubai Real Estate Brokers LLC" size="large" style={{ borderRadius: 10 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="tradeLicenseNumber" label="Trade License Number" rules={[{ required: true, message: "Required" }]}>
                      <Input placeholder="TL-987654" size="large" style={{ borderRadius: 10 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="legalEntityType" label="Legal Entity Type">
                      <Select size="large" style={{ borderRadius: 10 }}>
                        {["LLC", "FZE", "PJSC", "Sole Proprietorship", "Branch Office"].map(v => <Option key={v} value={v}>{v}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {/* Individual Fields */}
              {partnerType === "individual" && (
                <Row gutter={[20, 0]}>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: "Required" }]}>
                      <Input placeholder="Ahmed" size="large" style={{ borderRadius: 10 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: "Required" }]}>
                      <Input placeholder="Al Mansouri" size="large" style={{ borderRadius: 10 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="emiratesId" label="Emirates ID Card" rules={[{ required: true, message: "Required" }]}>
                      <Input placeholder="784-1990-1234567-1" size="large" style={{ borderRadius: 10 }} />
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
                      <DatePicker style={{ width: "100%", borderRadius: 10 }} size="large" format="DD/MM/YYYY" placeholder="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </div>
          )}

          {/* ─── STEP 1: CONTACT & ADDRESS ─────────────────────────── */}
          {currentStep === 1 && (
            <div style={{ background: "#fff", borderRadius: 24, padding: "32px 36px", border: "1px solid #edeaf2", boxShadow: "0 10px 40px rgba(92,3,155,0.03)", marginBottom: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ color: P, fontWeight: 800, margin: 0 }}>Contact & Location Details</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Define the primary focal contact person and the billing address.</Text>
              </div>
              <Divider style={{ margin: "0 0 24px", borderColor: "#f3eefc" }} />

              <div style={{ fontWeight: 700, fontSize: 13, color: P, marginBottom: 16 }}>Primary Representative Contact</div>

              <Row gutter={[20, 0]}>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="primaryName" label="Contact Person Name" rules={[{ required: true, message: "Required" }]}>
                    <Input placeholder="Mohammed Ahmed" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="primaryDesignation" label="Designation / Job Title">
                    <Input placeholder="Managing Director / Partnership Lead" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="primaryEmail" label="Contact Email Address" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
                    <Input placeholder="contact@company.ae" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item label="Contact Mobile Number" required>
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

              <Divider style={{ margin: "20px 0", borderColor: "#f3eefc" }} />
              <div style={{ fontWeight: 700, fontSize: 13, color: P, marginBottom: 16 }}>Registered Address / Office Location</div>

              <Row gutter={[20, 0]}>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="buildingName" label="Building Name / Office Number">
                    <Input placeholder="Boulevard Plaza Tower 1, Office 1402" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="area" label="Area / Community">
                    <Input placeholder="Downtown Dubai" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="city" label="City" rules={[{ required: true, message: "Required" }]}>
                    <Input placeholder="Dubai" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="country" label="Country" rules={[{ required: true }]}>
                    <Select size="large" style={{ borderRadius: 10 }}>
                      {["UAE", "Saudi Arabia", "Bahrain", "Oman", "Kuwait", "Qatar"].map(v => <Option key={v} value={v}>{v}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {/* ─── STEP 2: COMMERCIALS ─────────────────────────────── */}
          {currentStep === 2 && (
            <div style={{ background: "#fff", borderRadius: 24, padding: "32px 36px", border: "1px solid #edeaf2", boxShadow: "0 10px 40px rgba(92,3,155,0.03)", marginBottom: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ color: P, fontWeight: 800, margin: 0 }}>Agreement & Payout Matrix</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Configure payout parameters and partnership agreement periods.</Text>
              </div>
              <Divider style={{ margin: "0 0 24px", borderColor: "#f3eefc" }} />

              <div style={{ fontWeight: 700, fontSize: 13, color: P, marginBottom: 16 }}>Payout Matrix (Xoto Commission Sharing)</div>
              <Row gutter={[20, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="tier1Pct"
                    label="Tier 1 Sharing — Loan Disbursed ≤ 5M AED (%)"
                    rules={[{ required: true }]}
                    extra={<span style={{ fontSize: 11, color: "#9ca3af" }}>PRD Tier default: 80%</span>}
                  >
                    <InputNumber size="large" style={{ width: "100%", borderRadius: 10 }} min={0} max={100} addonAfter="%" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="tier2Pct"
                    label="Tier 2 Sharing — Loan Disbursed > 5M AED (%)"
                    rules={[{ required: true }]}
                    extra={<span style={{ fontSize: 11, color: "#9ca3af" }}>PRD Tier default: 85%</span>}
                  >
                    <InputNumber size="large" style={{ width: "100%", borderRadius: 10 }} min={0} max={100} addonAfter="%" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: "20px 0", borderColor: "#f3eefc" }} />
              <div style={{ fontWeight: 700, fontSize: 13, color: P, marginBottom: 16 }}>Agreement Details</div>

              <Row gutter={[20, 0]}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="agreementStart" label="Contract Effective Date" rules={[{ required: true, message: "Required" }]}>
                    <DatePicker style={{ width: "100%", borderRadius: 10 }} size="large" format="DD/MM/YYYY" placeholder="Effective date" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="agreementEnd" label="Contract Expiration Date" rules={[{ required: true, message: "Required" }]}>
                    <DatePicker style={{ width: "100%", borderRadius: 10 }} size="large" format="DD/MM/YYYY" placeholder="Expiration date" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="signedDate" label="Date Agreement Signed" rules={[{ required: true, message: "Required" }]}>
                    <DatePicker style={{ width: "100%", borderRadius: 10 }} size="large" format="DD/MM/YYYY" placeholder="Signature date" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="signedByPartner" label="Signed Representative (Partner)" rules={[{ required: true, message: "Required" }]}>
                    <Input placeholder="Authorized representative signature name" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="agreementType" label="Agreement Classification">
                    <Input placeholder="Commercial Partnership Agreement" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {/* ─── STEP 3: CREDENTIALS ─────────────────────────────── */}
          {currentStep === 3 && (
            <div style={{ background: "#fff", borderRadius: 24, padding: "32px 36px", border: "1px solid #edeaf2", boxShadow: "0 10px 40px rgba(92,3,155,0.03)", marginBottom: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ color: P, fontWeight: 800, margin: 0 }}>Partner Account Access</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Define login credentials to allow access to the Partner Portal.</Text>
              </div>
              <Divider style={{ margin: "0 0 24px", borderColor: "#f3eefc" }} />

              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12 }}>
                <InfoCircleOutlined style={{ color: "#d97706", fontSize: 16, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, color: "#92400e", fontWeight: 700 }}>Security Notice</div>
                  <div style={{ fontSize: 11, color: "#b45309", marginTop: 2 }}>
                    On account submission, activation instructions and authorization details will be automatically dispatched to this login email address.
                  </div>
                </div>
              </div>

              <Row gutter={[20, 0]}>
                <Col xs={24}>
                  <Form.Item name="loginEmail" label="Authorized Portal Login Email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
                    <Input placeholder="partner@company.ae" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="password" label="Account Password" rules={[{ required: true, min: 8, message: "Min 8 characters required" }]}>
                    <Input.Password placeholder="Set access password" size="large" style={{ borderRadius: 10 }} />
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
                    <Input.Password placeholder="Re-enter access password" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {/* Stepper Navigation Actions Bar */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #ede9f6", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <Button
              size="large"
              onClick={currentStep === 0 ? () => navigate(-1) : handlePrevStep}
              style={{ borderRadius: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
            >
              <ArrowLeftOutlined /> {currentStep === 0 ? "Cancel" : "Back"}
            </Button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 12, color: "#9ca3af" }} className="hidden sm:block">
                Step {currentStep + 1} of 4 · Classification: <strong style={{ color: P }}>{partnerType === "institution" ? "Institutional" : "Individual"}</strong>
              </div>
              {currentStep < 3 ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleNextStep}
                  style={{ borderRadius: 12, fontWeight: 700, background: GRAD, borderColor: "transparent", paddingInline: 28, display: "flex", alignItems: "center", gap: 6 }}
                >
                  Continue <ArrowRightOutlined />
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  loading={loading}
                  icon={<CheckOutlined />}
                  onClick={handleSubmit}
                  style={{ borderRadius: 12, fontWeight: 700, background: GRAD, borderColor: "transparent", paddingInline: 32 }}
                >
                  {loading ? "Creating Account..." : "Create Partner"}
                </Button>
              )}
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
