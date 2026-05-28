// src/pages/Advisor/VaultCreatemortgage.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Space,
  message,
  Select,
  DatePicker,
  InputNumber,
  Divider,
  Upload,
  Modal,
  Avatar,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  IdcardOutlined,
  CheckOutlined,
  UploadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { Country } from "country-state-city";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { apiService } from "@/api/apiService";

const { Title, Text } = Typography;
const { Option } = Select;

const BRAND_PURPLE = "#5C039B";
const BRAND_LIGHT = "#f3e8ff";

const VaultCreatemortgage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const countryOptions = useMemo(() => {
    const priorityIsoCodes = ["AE", "IN", "SA", "US", "GB", "AU"];
    return Country.getAllCountries()
      .map((country) => ({
        name: country.name,
        code: country.phonecode,
        iso: country.isoCode,
      }))
      .sort((a, b) => {
        const aPriority = priorityIsoCodes.includes(a.iso);
        const bPriority = priorityIsoCodes.includes(b.iso);
        if (aPriority && !bPriority) return -1;
        if (!aPriority && bPriority) return 1;
        return a.name.localeCompare(b.name);
      });
  }, []);

  const NATIONALITIES = [
    "United Arab Emirates",
    "Saudi Arabia",
    "India",
    "Pakistan",
    "Egypt",
    "Jordan",
    "Lebanon",
    "Philippines",
    "United Kingdom",
    "United States",
    "Australia",
    "Canada",
    "Germany",
    "France",
    "Other",
  ];

  const DEPARTMENTS = [
    "Mortgage Operations",
    "Sales",
    "Operations",
    "Compliance",
    "Customer Service",
    "Underwriting",
    "Processing",
  ];

  const GENDERS = ["Male", "Female", "Other"];

  const handleProfileUpload = async (file) => {
    setUploadingProfile(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiService.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl =
        response?.data?.file?.url ||
        response?.file?.url ||
        response?.data?.url ||
        response?.url ||
        response?.data?.fileUrl ||
        "";

      if (uploadedUrl) {
        setProfileUrl(uploadedUrl);
        message.success("Profile photo uploaded successfully!");
      } else {
        message.error("Upload failed: no URL returned.");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      message.error("Failed to upload profile photo.");
    } finally {
      setUploadingProfile(false);
    }
    return false;
  };

  // Get form values for preview
  const getPreviewDataFromForm = () => {
    const values = form.getFieldsValue();
    const countryCode = values.country_code || "971";
    const phone = values.phone || "";
    const fullPhoneNumber = phone ? `+${countryCode} ${phone}` : "Not provided";

    return {
      first_name: values.first_name || "Not provided",
      last_name: values.last_name || "Not provided",
      fullName: `${values.first_name || ""} ${values.last_name || ""}`.trim() || "Not provided",
      email: values.email || "Not provided",
      password: values.password ? "••••••••" : "Not set",
      phone: fullPhoneNumber,
      country_code: countryCode,
      dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format("DD/MM/YYYY") : "Not provided",
      nationality: values.nationality || "Not provided",
      gender: values.gender || "Not provided",
      department: values.department || "Not provided",
      designation: values.designation || "Not provided",
      joinDate: values.joinDate ? values.joinDate.format("DD/MM/YYYY") : "Not provided",
      maxLeadsCapacity: values.maxLeadsCapacity || "Not set",
      profilePic: profileUrl,
    };
  };

  // Show preview modal
  const showPreview = () => {
    const values = form.getFieldsValue();
    
    // Validate required fields for preview
    const requiredFields = ["first_name", "last_name", "email", "password", "phone"];
    const missingFields = requiredFields.filter(field => !values[field]);
    
    if (missingFields.length > 0) {
      message.warning("Please fill all required fields before preview");
      return;
    }
    
    if (!profileUrl) {
      message.warning("Please upload a profile photo");
      return;
    }

    setPreviewData(getPreviewDataFromForm());
    setPreviewVisible(true);
  };

  // Handle submit from preview or direct
  const handleSubmit = async (values) => {
    if (!profileUrl) {
      message.error("Please upload a profile photo");
      return;
    }

    setLoading(true);
    try {
      const fullPhoneNumber = `+${values.country_code}${values.phone}`;
      const extractedCountryCode = `+${values.country_code}`;

      const payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
        phone_number: fullPhoneNumber,
        country_code: extractedCountryCode,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format("YYYY-MM-DD") : null,
        nationality: values.nationality,
        gender: values.gender,
        profilePic: profileUrl,
        joinDate: values.joinDate ? values.joinDate.format("YYYY-MM-DD") : null,
        department: values.department,
        designation: values.designation,
        maxLeadsCapacity: values.maxLeadsCapacity ? Number(values.maxLeadsCapacity) : undefined,
      };

      await apiService.post("/vault/ops/create", payload);
      message.success({
        content: "Mortgage Ops created successfully! Login credentials sent via email.",
        duration: 4,
        icon: <CheckOutlined style={{ color: "#52c41a" }} />,
      });
      form.resetFields();
      setProfileUrl("");
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      console.error("Create Mortgage Ops Error:", err);
      message.error(err?.response?.data?.message || "Failed to create mortgage ops");
    } finally {
      setLoading(false);
    }
  };

  // Confirm and submit from preview
  const confirmSubmit = () => {
    setPreviewVisible(false);
    const values = form.getFieldsValue();
    handleSubmit(values);
  };

  // Preview Modal Component
  const PreviewModal = () => (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: BRAND_LIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EyeOutlined style={{ fontSize: 20, color: BRAND_PURPLE }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
              Review Mortgage Ops Details
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Please verify all information before submitting
            </div>
          </div>
        </div>
      }
      open={previewVisible}
      onCancel={() => setPreviewVisible(false)}
      width={800}
      footer={[
        <Button
          key="back"
          icon={<RollbackOutlined />}
          onClick={() => setPreviewVisible(false)}
          style={{ borderRadius: 10 }}
        >
          Edit
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          onClick={confirmSubmit}
          loading={loading}
          style={{
            background: BRAND_PURPLE,
            borderColor: BRAND_PURPLE,
            borderRadius: 10,
          }}
        >
          Confirm & Create
        </Button>,
      ]}
      bodyStyle={{ maxHeight: "65vh", overflowY: "auto" }}
    >
      {previewData && (
        <div style={{ padding: "8px 0" }}>
          {/* Profile Section */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Avatar
              size={100}
              src={previewData.profilePic}
              icon={<UserOutlined />}
              style={{
                border: `4px solid ${BRAND_PURPLE}`,
                boxShadow: "0 8px 20px rgba(92, 3, 155, 0.15)",
              }}
            />
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: 18 }}>
                {previewData.fullName}
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {previewData.designation !== "Not provided" ? previewData.designation : "New Mortgage Ops"}
            </Text>
          </div>

          <Divider style={{ margin: "16px 0" }} />

          {/* Two Column Layout */}
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <UserOutlined style={{ marginRight: 6 }} /> Personal Information
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Full Name</span>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{previewData.fullName}</div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Email Address</span>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{previewData.email}</div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Phone Number</span>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{previewData.phone}</div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Date of Birth</span>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{previewData.dateOfBirth}</div>
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <BankOutlined style={{ marginRight: 6 }} /> Employment Details
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Department</span>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{previewData.department}</div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Designation</span>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{previewData.designation}</div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Join Date</span>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{previewData.joinDate}</div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Max Leads Capacity</span>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>
                      {previewData.maxLeadsCapacity !== "Not set" ? `${previewData.maxLeadsCapacity} leads` : "Not set"}
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: "12px 16px",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <IdcardOutlined style={{ marginRight: 6 }} /> Additional Info
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Nationality</span>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{previewData.nationality}</div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Gender</span>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{previewData.gender}</div>
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div
                style={{
                  background: "#fef3c7",
                  borderRadius: 12,
                  padding: "12px 16px",
                  border: "1px solid #fde68a",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <ExclamationCircleOutlined style={{ marginRight: 6 }} /> Account Access
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#92400e" }}>Password</span>
                    <div style={{ fontWeight: 600, color: "#78350f", fontFamily: "monospace" }}>
                      {previewData.password}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#92400e", marginTop: 8 }}>
                    <CheckOutlined style={{ marginRight: 4 }} /> Credentials will be emailed to the user
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <Divider style={{ margin: "20px 0 12px" }} />

          <div
            style={{
              textAlign: "center",
              padding: "12px",
              background: BRAND_LIGHT,
              borderRadius: 10,
            }}
          >
            <CheckOutlined style={{ color: BRAND_PURPLE, marginRight: 8 }} />
            <Text style={{ fontSize: 12, color: "#5c039b" }}>
              Please ensure all details are correct before submitting
            </Text>
          </div>
        </div>
      )}
    </Modal>
  );

  return (
    <div style={{ padding: "24px", background: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            color: "#475569",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = BRAND_LIGHT;
            e.currentTarget.style.borderColor = BRAND_PURPLE;
            e.currentTarget.style.color = BRAND_PURPLE;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.color = "#475569";
          }}
        >
          <ArrowLeftOutlined /> Back
        </button>
        <div>
          <Title level={3} style={{ margin: 0, color: "#1f2937" }}>
            Create New Mortgage Operations
          </Title>
          <Text type="secondary">
            Add a new mortgage operations team member. Login credentials will be sent via email automatically.
          </Text>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ country_code: "971" }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <UserOutlined style={{ color: BRAND_PURPLE }} />
                  Personal & Account Info
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginBottom: "24px",
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="first_name"
                    label="First Name"
                    rules={[{ required: true, message: "Please enter first name" }]}
                  >
                    <Input placeholder="e.g. Ahmed" size="large" style={{ borderRadius: "8px" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="last_name"
                    label="Last Name"
                    rules={[{ required: true, message: "Please enter last name" }]}
                  >
                    <Input placeholder="e.g. Al Mansouri" size="large" style={{ borderRadius: "8px" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="Login Email"
                    rules={[{ required: true, type: "email", message: "Valid email required" }]}
                  >
                    <Input placeholder="ahmed@xoto.ae" size="large" style={{ borderRadius: "8px" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      { required: true, min: 8, message: "Min 8 characters" },
                      { pattern: /^(?=.*[A-Za-z])(?=.*\d)/, message: "Must contain letters and numbers" },
                    ]}
                  >
                    <Input.Password
                      placeholder="Enter secure password"
                      size="large"
                      style={{ borderRadius: "8px" }}
                      iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              title={
                <Space>
                  <PhoneOutlined style={{ color: BRAND_PURPLE }} />
                  Contact & Personal Details
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginBottom: "24px",
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Phone Number" required>
                    <Space.Compact style={{ width: "100%" }}>
                      <Form.Item
                        name="country_code"
                        noStyle
                        rules={[{ required: true, message: "Code required" }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="children"
                          style={{ width: "120px", height: "40px" }}
                          popupMatchSelectWidth={300}
                        >
                          {countryOptions.map((item) => (
                            <Option key={item.iso} value={item.code}>
                              <div style={{ display: "flex", alignItems: "center" }}>
                                <img
                                  src={`https://flagcdn.com/w20/${item.iso.toLowerCase()}.png`}
                                  width="20"
                                  alt={item.name}
                                  style={{ marginRight: 8, borderRadius: 2 }}
                                />
                                <span>+{item.code}</span>
                              </div>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        name="phone"
                        noStyle
                        getValueFromEvent={(e) => e.target.value.replace(/\D/g, "")}
                        rules={[
                          { required: true, message: "Phone number required" },
                          {
                            validator: (_, value) => {
                              if (!value) return Promise.resolve();
                              const code = form.getFieldValue("country_code");
                              const fullNumber = `+${code}${value}`;
                              const phoneNumber = parsePhoneNumberFromString(fullNumber);
                              if (phoneNumber && phoneNumber.isValid()) return Promise.resolve();
                              return Promise.reject(new Error("Invalid mobile number"));
                            },
                          },
                        ]}
                      >
                        <Input
                          placeholder="Mobile Number"
                          style={{
                            width: "100%",
                            height: "40px",
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                          }}
                        />
                      </Form.Item>
                    </Space.Compact>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="dateOfBirth" label="Date of Birth">
                    <DatePicker
                      style={{ width: "100%", borderRadius: "8px" }}
                      size="large"
                      format="DD/MM/YYYY"
                      placeholder="Select date"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="nationality" label="Nationality">
                    <Select
                      placeholder="Select nationality"
                      size="large"
                      style={{ borderRadius: "8px" }}
                      allowClear
                      showSearch
                      optionFilterProp="children"
                    >
                      {NATIONALITIES.map((n) => (
                        <Option key={n} value={n}>
                          {n}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="gender" label="Gender">
                    <Select
                      placeholder="Select gender"
                      size="large"
                      style={{ borderRadius: "8px" }}
                      allowClear
                    >
                      {GENDERS.map((g) => (
                        <Option key={g} value={g}>
                          {g}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              title={
                <Space>
                  <BankOutlined style={{ color: BRAND_PURPLE }} />
                  Employment Details
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="department" label="Department">
                    <Select
                      placeholder="Select department"
                      size="large"
                      style={{ borderRadius: "8px" }}
                      allowClear
                    >
                      {DEPARTMENTS.map((d) => (
                        <Option key={d} value={d}>
                          {d}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="designation" label="Designation">
                    <Input
                      placeholder="e.g. Senior Mortgage Advisor"
                      size="large"
                      style={{ borderRadius: "8px" }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="joinDate" label="Join Date">
                    <DatePicker
                      style={{ width: "100%", borderRadius: "8px" }}
                      size="large"
                      format="DD/MM/YYYY"
                      placeholder="Select date"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="maxLeadsCapacity" label="Max Leads Capacity">
                    <InputNumber
                      min={1}
                      max={100}
                      placeholder="e.g. 25"
                      size="large"
                      style={{ width: "100%", borderRadius: "8px" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <IdcardOutlined style={{ color: BRAND_PURPLE }} />
                  Profile Photo
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginBottom: "24px",
              }}
            >
              <Form.Item
                label="Profile Photo"
                required
                rules={[{ validator: () => (profileUrl ? Promise.resolve() : Promise.reject("Profile photo required")) }]}
              >
                <Upload showUploadList={false} beforeUpload={handleProfileUpload} accept="image/*">
                  <Button
                    icon={profileUrl ? <CheckOutlined /> : <UploadOutlined />}
                    block
                    style={{
                      height: 45,
                      borderColor: profileUrl ? "#52c41a" : "#d9d9d9",
                      color: profileUrl ? "#52c41a" : "inherit",
                    }}
                    loading={uploadingProfile}
                  >
                    {profileUrl ? "Change Photo" : "Upload Photo"}
                  </Button>
                </Upload>
                {/* Image Preview */}
                {profileUrl && (
                  <div style={{ marginTop: 16, textAlign: "center" }}>
                    <img
                      src={profileUrl}
                      alt="Profile Preview"
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `3px solid ${BRAND_PURPLE}`,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "#52c41a",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <CheckOutlined /> Image uploaded successfully!
                    </div>
                  </div>
                )}
              </Form.Item>
              <Divider style={{ margin: "16px 0" }} />
              <Text strong>Account Setup</Text>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  • Login credentials will be sent to the provided email.
                  <br />• The user can update their profile after first login.
                  <br />• Password must be at least 8 characters with letters & numbers.
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Bottom Action Bar */}
        <div
          style={{
            marginTop: "24px",
            padding: "16px 24px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ borderRadius: "10px", fontWeight: "600" }}
          >
            Cancel
          </Button>
          <Space size={16}>
            <Button
              size="large"
              icon={<EyeOutlined />}
              onClick={showPreview}
              style={{
                borderRadius: "10px",
                fontWeight: "600",
                borderColor: BRAND_PURPLE,
                color: BRAND_PURPLE,
              }}
            >
              Preview Details
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              style={{
                background: BRAND_PURPLE,
                borderColor: BRAND_PURPLE,
                borderRadius: "10px",
                fontWeight: "600",
                padding: "0 32px",
              }}
            >
              {loading ? "Creating..." : "Create Mortgage Ops"}
            </Button>
          </Space>
        </div>
      </Form>

      {/* Preview Modal */}
      <PreviewModal />
    </div>
  );
};

export default VaultCreatemortgage;