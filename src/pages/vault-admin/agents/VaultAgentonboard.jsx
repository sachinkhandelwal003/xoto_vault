import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form, Input, Button, Card, Row, Col,
  message, Space, Typography, Divider, Upload, Avatar,
} from "antd";
import { CheckOutlined, UploadOutlined } from "@ant-design/icons";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { apiService } from "@/api/apiService";

const { Title, Text } = Typography;

const BRAND_PURPLE = "#5C039B";

export default function VaultAgentOnboard() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);

  const phoneValidator = (_, value) => {
    if (!value || String(value).length < 10)
      return Promise.reject(new Error("Please enter a valid phone number"));
    return Promise.resolve();
  };

  const handleProfileUpload = async (file) => {
    setUploadingProfile(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiService.upload("/upload", formData);
      const url = response?.file?.url || response?.data?.file?.url || response?.data?.url || response?.url || "";
      if (url) {
        setProfileUrl(url);
        message.success("Profile photo uploaded!");
      } else {
        message.error("Upload failed: no URL returned.");
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to upload profile picture.");
    } finally {
      setUploadingProfile(false);
    }

    return false;
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setLoading(true);

      const values = form.getFieldsValue(true);

      if (!profileUrl) {
        message.warning("Please upload a profile photo before submitting.");
        return;
      }

      const payload = {
        first_name:   values.first_name,
        last_name:    values.last_name,
        email:        values.email,
        phone_number: values.phone_number,
        country_code: values.country_code || "+971",
        password:     values.password,
        profilePic:   profileUrl,
      };

      await apiService.post("/vault/agent/admin/onboard-freelance", payload);
      setSuccess(true);
    } catch (err) {
      if (err?.errorFields) {
        message.error("Please fill all required fields correctly.");
      } else {
        message.error(err?.response?.data?.message || "Failed to onboard agent. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Card style={{ maxWidth: 500, width: "100%", textAlign: "center", borderRadius: 20, boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
          <div style={{ width: 80, height: 80, background: BRAND_PURPLE, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 4px 12px rgba(92,3,155,0.3)" }}>
            <CheckOutlined style={{ fontSize: 40, color: "#fff" }} />
          </div>
          <Title level={3} style={{ color: "#000" }}>referral partnerOnboarded!</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>The referral partnerhas been successfully registered and can now log in.</Text>
          <Divider />
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Button size="large" block onClick={() => { setSuccess(false); form.resetFields(); }}>
              Onboard Another
            </Button>
            <Button size="large" type="primary" block onClick={() => navigate("/dashboard/vault-admin/agent-list")} style={{ background: BRAND_PURPLE }}>
              View Agents
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ color: "#000", marginBottom: 8 }}>Onboard New Referral-Partner</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Enter the agent's basic details to create their account. No document or bank data is required here; the referral partner can add those later from their profile.
          </Text>
        </div>

        <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", padding: "24px 0 0" }}>
          <Form form={form} layout="vertical">

            <div style={{ padding: "0 24px" }}>
              <Title level={4} style={{ color: "#000", marginBottom: 24 }}>Basic Information</Title>
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item name="first_name" label="First Name" rules={[{ required: true, message: "Required" }]}>
                    <Input size="large" placeholder="Ahmed" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="last_name" label="Last Name" rules={[{ required: true, message: "Required" }]}>
                    <Input size="large" placeholder="Al Mansoori" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
                    <Input size="large" placeholder="agent@example.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="password" label="Password" rules={[{ required: true, min: 8, message: "Min 8 characters" }]}>
                    <Input.Password size="large" placeholder="Min 8 characters" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="phone_number"
                    label="Phone Number"
                    rules={[{ required: true }, { validator: phoneValidator }]}
                  >
                    <PhoneInput
                      country="ae"
                      preferredCountries={["ae", "sa", "us", "gb", "in"]}
                      enableSearch
                      inputStyle={{ width: "100%", borderRadius: 8, height: 40 }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Profile Photo" required>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                      <Upload showUploadList={false} beforeUpload={handleProfileUpload} accept="image/*">
                        <Button icon={<UploadOutlined />} loading={uploadingProfile}>
                          {profileUrl ? "Change Photo" : "Upload Photo"}
                        </Button>
                      </Upload>
                      {profileUrl && (
                        <Avatar src={profileUrl} size={64} style={{ border: "1px solid #d1d5db" }} />
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Upload JPG or PNG. Documents and bank details can be added later.
                    </Text>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider style={{ margin: "24px 0 0" }} />

            <div style={{ padding: "16px 24px", background: "#fafafa" }}>
              <div style={{ background: "#F5F0FF", border: "1px solid #E9D5FF", borderRadius: 10, padding: "12px 16px" }}>
                <Text style={{ fontSize: 13, color: BRAND_PURPLE, fontWeight: 600 }}>
                  Referral Partner Profile Completion
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  After onboarding, the referral partnercan log in and complete their profile including Emirates ID, Passport, Visa documents, and bank details from their profile page.
                </Text>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, padding: "24px", background: "#fafafa", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
              <Button size="large" onClick={() => navigate("/dashboard/vault-admin/agent-list")} style={{ borderColor: "#E5E7EB" }}>
                Cancel
              </Button>
              <Button
                size="large" type="primary" onClick={handleSubmit} loading={loading}
                icon={<CheckOutlined />}
                style={{ background: BRAND_PURPLE, borderRadius: 8 }}
              >
                Submit & Onboard Agent
              </Button>
            </div>

          </Form>
        </Card>
      </div>
    </div>
  );
}
