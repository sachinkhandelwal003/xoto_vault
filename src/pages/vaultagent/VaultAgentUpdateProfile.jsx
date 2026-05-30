import React, { useState, useEffect } from "react";
import {
  Form, Input, Select, DatePicker, Upload, Avatar,
  Spin, Row, Col, Button, message, Alert, Tag,
} from "antd";
import {
  UserOutlined, MailOutlined, SaveOutlined, ArrowLeftOutlined,
  CameraOutlined, LoadingOutlined, UploadOutlined, EyeOutlined,
  CheckCircleOutlined, BankOutlined, IdcardOutlined,
  GlobalOutlined, CalendarOutlined, FilePdfOutlined,
  TeamOutlined, SafetyCertificateOutlined,
} from "@ant-design/icons";
import { apiService } from "@/api/apiService";
import { Country } from "country-state-city";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Option } = Select;
const P  = "#5C039B";
const PG = "linear-gradient(135deg, #5C039B 0%, #7C3AED 60%, #4f46e5 100%)";
const allCountries = Country.getAllCountries();

const inputStyle  = { height: 44, borderRadius: 10, borderColor: "#e8dff5" };
const pickerStyle = { width: "100%", height: 44, borderRadius: 10, borderColor: "#e8dff5" };

/* ── Card wrapper ── */
const Card = ({ icon, title, badge, children }) => (
  <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #ede9fe", marginBottom: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(92,3,155,0.05)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "linear-gradient(135deg,#faf8ff,#f3efff)", borderBottom: "1px solid #f0ebff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: P, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.cloneElement(icon, { style: { fontSize: 15, color: "#fff" } })}
        </div>
        <span style={{ fontWeight: 800, fontSize: 14, color: "#1a0533" }}>{title}</span>
      </div>
      {badge}
    </div>
    <div style={{ padding: "20px 24px" }}>{children}</div>
  </div>
);

/* ── Doc upload row ── */
const DocRow = ({ label, uploaded, verified, url, onUpload, uploading, onView }) => {
  const color = verified ? "#10b981" : uploaded ? "#f59e0b" : "#9ca3af";
  const text  = verified ? "Verified" : uploaded ? "Pending Review" : "Not Uploaded";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, background: uploaded ? (verified ? "#f0fdf4" : "#fffdf0") : "#fafafa", border: `1.5px solid ${verified ? "#a7f3d0" : uploaded ? "#fde68a" : "#ede9fe"}`, marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <FilePdfOutlined style={{ fontSize: 18, color }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a0533" }}>{label}</div>
          <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}18`, padding: "1px 8px", borderRadius: 20 }}>{text}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {url && (
          <button onClick={onView} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #ede9fe", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <EyeOutlined style={{ color: P, fontSize: 13 }} />
          </button>
        )}
        <Upload showUploadList={false} customRequest={({ file }) => onUpload(file)} accept="image/*,.pdf">
          <button style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: P, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {uploading ? <LoadingOutlined style={{ color: "#fff", fontSize: 13 }} spin /> : <UploadOutlined style={{ color: "#fff", fontSize: 13 }} />}
          </button>
        </Upload>
      </div>
    </div>
  );
};

/* ── Form item ── */
const FItem = ({ name, label, rules, children, span = 12 }) => (
  <Col xs={24} sm={span}>
    <Form.Item name={name} label={label} rules={rules} style={{ marginBottom: 16 }}>
      {children}
    </Form.Item>
  </Col>
);

/* ════════════ MAIN COMPONENT ════════════ */
export default function VaultAgentUpdateProfile() {
  const navigate = useNavigate();
  const [form]   = Form.useForm();

  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [picUploading, setPicUploading] = useState(false);
  const [docUploading, setDocUploading] = useState(null);
  const [saved,        setSaved]        = useState(false);

  /* ── fetch ── */
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res     = await apiService.get("/vault/agent/me");
      const payload = res?.data || res;
      const data    = payload?.data || payload;
      setProfile(data);
      form.setFieldsValue({
        email:               data.email,
        nationality:         data.nationality,
        gender:              data.gender,
        dateOfBirth:         data.dateOfBirth ? dayjs(data.dateOfBirth) : null,
        eid_number:          data.emiratesId?.number,
        eid_issuanceDate:    data.emiratesId?.issuanceDate ? dayjs(data.emiratesId.issuanceDate) : null,
        eid_expiryDate:      data.emiratesId?.expiryDate   ? dayjs(data.emiratesId.expiryDate)   : null,
        passport_number:     data.passport?.number,
        passport_country:    data.passport?.countryOfIssue,
        passport_issueDate:  data.passport?.issueDate  ? dayjs(data.passport.issueDate)  : null,
        passport_expiryDate: data.passport?.expiryDate ? dayjs(data.passport.expiryDate) : null,
        bank_beneficiary:    data.bankDetails?.beneficiaryName,
        bank_name:           data.bankDetails?.bankName,
        bank_account:        data.bankDetails?.accountNumber,
        bank_iban:           data.bankDetails?.iban,
      });
    } catch {
      message.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  /* ── profile pic ── */
  const handlePicUpload = async (file) => {
    setPicUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiService.upload("/upload", fd);
      const url = res?.file?.url || res?.data?.url || res?.url || "";
      if (url) {
        await apiService.put("/vault/agent/profile", { profilePic: url });
        setProfile((prev) => ({ ...prev, profilePic: url }));
        message.success("Photo updated!");
      } else {
        message.error("Upload failed.");
      }
    } catch {
      message.error("Failed to upload photo.");
    } finally {
      setPicUploading(false);
    }
  };

  /* ── document upload ── */
  const handleDocUpload = async (file, type, field) => {
    const key = `${type}_${field}`;
    setDocUploading(key);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiService.upload("/upload", fd);
      const url = res?.file?.url || res?.data?.url || res?.url || "";
      if (!url) { message.error("Upload failed."); return; }

      let payload = {};
      let profilePatch = {};

      if (type === "emiratesId") {
        const newFront = field === "frontImageUrl" ? url : (profile?.emiratesId?.frontImageUrl || null);
        const newBack  = field === "backImageUrl"  ? url : (profile?.emiratesId?.backImageUrl  || null);
        payload = {
          emiratesId: {
            number:        profile?.emiratesId?.number || null,
            frontImageUrl: newFront,
            backImageUrl:  newBack,
          },
        };
        profilePatch = {
          emiratesId: {
            ...(profile?.emiratesId || {}),
            frontImageUrl: newFront,
            backImageUrl:  newBack,
            verified:      false,
          },
        };
      } else if (type === "passport") {
        payload = { passport: { ...profile?.passport, imageUrl: url } };
        profilePatch = { passport: { ...(profile?.passport || {}), imageUrl: url, verified: false } };
      }

      await apiService.put("/vault/agent/profile", payload);
      // Update only the doc URLs in local state — do NOT re-fetch (avoids form reset)
      setProfile((prev) => ({ ...prev, ...profilePatch }));
      message.success("Document uploaded. Pending admin verification.");
    } catch {
      message.error("Upload failed.");
    } finally {
      setDocUploading(null);
    }
  };

  /* ── save ── */
  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      setSaved(false);

      const payload = {};

      if (v.email       !== undefined) payload.email       = v.email       || null;
      if (v.nationality !== undefined) payload.nationality = v.nationality  || null;
      if (v.gender      !== undefined) payload.gender      = v.gender       || null;
      if (v.dateOfBirth !== undefined) payload.dateOfBirth = v.dateOfBirth  ? v.dateOfBirth.toISOString() : null;

      const eid = {};
      if (v.eid_number       !== undefined) eid.number       = v.eid_number       || null;
      if (v.eid_issuanceDate !== undefined) eid.issuanceDate = v.eid_issuanceDate ? v.eid_issuanceDate.toISOString() : null;
      if (v.eid_expiryDate   !== undefined) eid.expiryDate   = v.eid_expiryDate   ? v.eid_expiryDate.toISOString()   : null;
      eid.frontImageUrl = profile?.emiratesId?.frontImageUrl || null;
      eid.backImageUrl  = profile?.emiratesId?.backImageUrl  || null;
      if (Object.keys(eid).length) payload.emiratesId = eid;

      const pp = {};
      if (v.passport_number      !== undefined) pp.number         = v.passport_number      || null;
      if (v.passport_country     !== undefined) pp.countryOfIssue = v.passport_country     || null;
      if (v.passport_issueDate   !== undefined) pp.issueDate      = v.passport_issueDate   ? v.passport_issueDate.toISOString()   : null;
      if (v.passport_expiryDate  !== undefined) pp.expiryDate     = v.passport_expiryDate  ? v.passport_expiryDate.toISOString()  : null;
      pp.imageUrl = profile?.passport?.imageUrl || null;
      if (Object.keys(pp).length) payload.passport = pp;

      const bd = {};
      if (v.bank_beneficiary !== undefined) bd.beneficiaryName = v.bank_beneficiary || null;
      if (v.bank_name        !== undefined) bd.bankName        = v.bank_name        || null;
      if (v.bank_account     !== undefined) bd.accountNumber   = v.bank_account     || null;
      if (v.bank_iban        !== undefined) bd.iban            = v.bank_iban        || null;
      if (Object.keys(bd).length) payload.bankDetails = bd;

      const res = await apiService.put("/vault/agent/profile", payload);
      if (res?.success !== false) {
        message.success("Profile updated!");
        setSaved(true);
        fetchProfile();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        message.error(res?.message || "Update failed");
      }
    } catch (err) {
      if (err?.errorFields) {
        message.warning("Please fix the highlighted fields.");
      } else {
        message.error(err?.response?.data?.message || "Update failed.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" />
    </div>
  );

  const fullName     = `${profile?.name?.first_name || ""} ${profile?.name?.last_name || ""}`.trim();
  const pct          = profile?.profileCompletionPercentage ?? 0;
  const isAffiliated = profile?.agentType === "PartnerAffiliatedAgent";

  return (
    <div style={{ background: "#f8f6ff", minHeight: "100vh", padding: "24px 20px" }}>
      <style>{`
        .upd-form .ant-input{height:44px!important;border-radius:10px!important;border-color:#e8dff5!important}
        .upd-form .ant-input:focus{border-color:${P}!important;box-shadow:0 0 0 3px rgba(92,3,155,.1)!important}
        .upd-form .ant-select-selector{height:44px!important;border-radius:10px!important;border-color:#e8dff5!important;align-items:center!important}
        .upd-form .ant-select-focused .ant-select-selector{border-color:${P}!important;box-shadow:0 0 0 3px rgba(92,3,155,.1)!important}
        .upd-form .ant-picker{height:44px!important;border-radius:10px!important;border-color:#e8dff5!important;width:100%!important}
        .upd-form .ant-form-item-label>label{font-size:12px!important;font-weight:700!important;color:#6b4f9a!important}
        .upd-form .ant-input-affix-wrapper{height:44px!important;border-radius:10px!important;border-color:#e8dff5!important}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", marginBottom: 20, boxShadow: "0 4px 20px rgba(92,3,155,0.10)", border: "1px solid #ede9fe" }}>
        <div style={{ height: 100, background: PG, position: "relative" }}>
          <button
            onClick={() => navigate("/dashboard/vaultagent/profile")}
            style={{ position: "absolute", top: 14, left: 18, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, color: "#fff", padding: "7px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeftOutlined /> Back
          </button>
          <div style={{ position: "absolute", top: 14, right: 18, fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>Update Profile</div>
        </div>
        <div style={{ padding: "0 24px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: -44 }}>
            <Upload showUploadList={false} customRequest={({ file }) => handlePicUpload(file)} accept="image/*">
              <div style={{ position: "relative", cursor: "pointer" }}>
                <Avatar size={88} icon={<UserOutlined />} src={profile?.profilePic}
                  style={{ border: "4px solid #fff", boxShadow: "0 4px 16px rgba(92,3,155,0.22)", background: "#e9d8ff" }} />
                {picUploading && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LoadingOutlined style={{ color: "#fff", fontSize: 18 }} spin />
                  </div>
                )}
                <div style={{ position: "absolute", bottom: 2, right: 2, background: P, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                  <CameraOutlined style={{ fontSize: 11, color: "#fff" }} />
                </div>
              </div>
            </Upload>
            <div style={{ paddingBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1a0533" }}>
                {fullName || "Agent"}
                {profile?.isVerified && <CheckCircleOutlined style={{ fontSize: 16, color: "#22c55e", marginLeft: 8 }} />}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <Tag style={{ borderRadius: 20, fontWeight: 600, background: isAffiliated ? "#eff6ff" : "#f5f0ff", color: isAffiliated ? "#3b82f6" : P, border: "none" }}>
                  {isAffiliated ? "Partner Affiliated" : "Referral Partner"}
                </Tag>
                {isAffiliated && profile?.affiliationStatus === "verified" && (
                  <Tag color="success" style={{ borderRadius: 20 }}>Affiliation Approved</Tag>
                )}
                {isAffiliated && profile?.affiliationStatus === "pending" && (
                  <Tag color="warning" style={{ borderRadius: 20 }}>Pending Partner Approval</Tag>
                )}
              </div>
              {/* completion bar */}
              <div style={{ marginTop: 10, maxWidth: 240 }}>
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

      {saved && (
        <Alert type="success" showIcon closable onClose={() => setSaved(false)}
          message="Profile Updated"
          description="Your changes are saved. Documents that changed are now pending admin verification."
          style={{ marginBottom: 16, borderRadius: 12, border: "1px solid #a7f3d0" }} />
      )}

      <Form form={form} layout="vertical" className="upd-form">

        {/* ── 1. PERSONAL INFO ── */}
        <Card icon={<UserOutlined />} title="Personal Information">
          <Row gutter={16}>
            <FItem name="email" label="Email Address"
              rules={[{ type: "email", message: "Enter a valid email" }]}>
              <Input prefix={<MailOutlined style={{ color: "#c4b8d9" }} />} placeholder="email@example.com" style={inputStyle} />
            </FItem>
            <FItem name="gender" label="Gender">
              <Select placeholder="Select gender" allowClear style={{ height: 44 }}>
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </FItem>
            <FItem name="dateOfBirth" label="Date of Birth">
              <DatePicker format="DD/MM/YYYY" placeholder="DD/MM/YYYY" style={pickerStyle}
                disabledDate={(d) => d && d.isAfter(dayjs())} />
            </FItem>
            <FItem name="nationality" label="Nationality">
              <Select showSearch placeholder="Select nationality" optionFilterProp="children" allowClear style={{ height: 44 }}>
                {allCountries.map((c) => <Option key={c.isoCode} value={c.name}>{c.name}</Option>)}
              </Select>
            </FItem>
          </Row>
        </Card>

        {/* ── 2. EMIRATES ID ── */}
        <Card
          icon={<IdcardOutlined />}
          title="Emirates ID"
          badge={
            profile?.emiratesId?.verified
              ? <Tag color="success" style={{ borderRadius: 20 }}>Verified</Tag>
              : profile?.emiratesId?.frontImageUrl
                ? <Tag color="warning" style={{ borderRadius: 20 }}>Pending Verification</Tag>
                : null
          }
        >
          <Row gutter={16}>
            <FItem name="eid_number" label="Emirates ID Number" span={24}
              rules={[{ pattern: /^784-?\d{4}-?\d{7}-?\d$/, message: "Format: 784-XXXX-XXXXXXX-X" }]}>
              <Input placeholder="784-XXXX-XXXXXXX-X" style={inputStyle} />
            </FItem>
            <FItem name="eid_issuanceDate" label="Issue Date">
              <DatePicker format="DD/MM/YYYY" placeholder="DD/MM/YYYY" style={pickerStyle} />
            </FItem>
            <FItem name="eid_expiryDate" label="Expiry Date">
              <DatePicker format="DD/MM/YYYY" placeholder="DD/MM/YYYY" style={pickerStyle} />
            </FItem>
          </Row>
          <DocRow
            label="Emirates ID — Front"
            uploaded={!!profile?.emiratesId?.frontImageUrl}
            verified={!!profile?.emiratesId?.verified}
            url={profile?.emiratesId?.frontImageUrl}
            uploading={docUploading === "emiratesId_frontImageUrl"}
            onUpload={(f) => handleDocUpload(f, "emiratesId", "frontImageUrl")}
            onView={() => window.open(profile?.emiratesId?.frontImageUrl, "_blank")}
          />
          <DocRow
            label="Emirates ID — Back"
            uploaded={!!profile?.emiratesId?.backImageUrl}
            verified={!!profile?.emiratesId?.verified}
            url={profile?.emiratesId?.backImageUrl}
            uploading={docUploading === "emiratesId_backImageUrl"}
            onUpload={(f) => handleDocUpload(f, "emiratesId", "backImageUrl")}
            onView={() => window.open(profile?.emiratesId?.backImageUrl, "_blank")}
          />
          {profile?.emiratesId?.frontImageUrl && !profile?.emiratesId?.verified && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px" }}>
              EID uploaded — waiting for admin verification. Commission eligibility will be updated once verified.
            </div>
          )}
        </Card>

        {/* ── 3. PASSPORT ── */}
        <Card
          icon={<FilePdfOutlined />}
          title="Passport"
          badge={
            profile?.passport?.verified
              ? <Tag color="success" style={{ borderRadius: 20 }}>Verified</Tag>
              : profile?.passport?.imageUrl
                ? <Tag color="warning" style={{ borderRadius: 20 }}>Pending</Tag>
                : null
          }
        >
          <Row gutter={16}>
            <FItem name="passport_number" label="Passport Number" span={24}>
              <Input placeholder="Passport number" style={inputStyle} />
            </FItem>
            <FItem name="passport_country" label="Country of Issue">
              <Select showSearch placeholder="Select country" optionFilterProp="children" allowClear style={{ height: 44 }}>
                {allCountries.map((c) => <Option key={c.isoCode} value={c.name}>{c.name}</Option>)}
              </Select>
            </FItem>
            <FItem name="passport_issueDate" label="Issue Date">
              <DatePicker format="DD/MM/YYYY" placeholder="DD/MM/YYYY" style={pickerStyle} />
            </FItem>
            <FItem name="passport_expiryDate" label="Expiry Date">
              <DatePicker format="DD/MM/YYYY" placeholder="DD/MM/YYYY" style={pickerStyle} />
            </FItem>
          </Row>
          <DocRow
            label="Passport — Photo Page"
            uploaded={!!profile?.passport?.imageUrl}
            verified={!!profile?.passport?.verified}
            url={profile?.passport?.imageUrl}
            uploading={docUploading === "passport_imageUrl"}
            onUpload={(f) => handleDocUpload(f, "passport", "imageUrl")}
            onView={() => window.open(profile?.passport?.imageUrl, "_blank")}
          />
        </Card>

        {/* ── 4. BANK DETAILS ── */}
        <Card
          icon={<BankOutlined />}
          title="Bank Details"
          badge={
            profile?.bankDetails?.verified
              ? <Tag color="success" style={{ borderRadius: 20 }}>Verified</Tag>
              : profile?.bankDetails?.iban
                ? <Tag color="warning" style={{ borderRadius: 20 }}>Pending Verification</Tag>
                : null
          }
        >
          {isAffiliated && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#3b82f6", fontWeight: 500 }}>
              Commission for your leads is paid to your partner company. Bank details here are for your partner's internal payouts only.
            </div>
          )}
          {profile?.bankDetails?.verified && (
            <div style={{ background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircleOutlined style={{ color: "#10b981" }} />
              <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>Bank verified. Updating will reset verification.</span>
            </div>
          )}
          <Row gutter={16}>
            <FItem name="bank_beneficiary" label="Beneficiary Name">
              <Input placeholder="Account holder name" style={inputStyle} />
            </FItem>
            <FItem name="bank_name" label="Bank Name">
              <Input placeholder="e.g., Emirates NBD" style={inputStyle} />
            </FItem>
            <FItem name="bank_account" label="Account Number">
              <Input placeholder="Bank account number" style={inputStyle} />
            </FItem>
            <FItem name="bank_iban" label="IBAN"
              rules={[{ pattern: /^AE\d{21}$/, message: "UAE IBAN: AE + 21 digits" }]}>
              <Input placeholder="AE + 21 digits" style={inputStyle} />
            </FItem>
          </Row>
        </Card>

      </Form>

      {/* ── FOOTER ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingBottom: 32 }}>
        <Button
          onClick={() => navigate("/dashboard/vaultagent/profile")}
          style={{ height: 46, paddingInline: 24, borderRadius: 12, borderColor: "#e8dff5", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          style={{ height: 46, paddingInline: 36, borderRadius: 12, background: PG, border: "none", fontWeight: 700, boxShadow: "0 4px 14px rgba(92,3,155,0.35)" }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
