import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form, Input, Button, Card, Row, Col,
  message, Space, Typography, Divider,
} from "antd";
import { CheckOutlined } from "@ant-design/icons";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { apiService } from "@/api/apiService";

const { Title, Text } = Typography;

const BRAND_PURPLE = "#5C039B";

export default function PartnerOnboardAgent() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const phoneValidator = (_, value) => {
    if (!value || String(value).length < 10)
      return Promise.reject(new Error("Please enter a valid phone number"));
    return Promise.resolve();
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setLoading(true);

      const values = form.getFieldsValue(true);

      const payload = {
        first_name:   values.first_name,
        last_name:    values.last_name,
        email:        values.email,
        phone_number: values.phone_number,
        country_code: values.country_code || "+971",
        password:     values.password,
        ...(values.internalCommissionPercentage != null && values.internalCommissionPercentage !== ""
          ? { internalCommissionPercentage: Number(values.internalCommissionPercentage) }
          : {}),
      };

      await apiService.post("/vault/agent/partner/onboard-affiliate", payload);
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
          <Title level={3} style={{ color: "#000" }}>Agent Onboarded!</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>The affiliated agent has been successfully added to your network.</Text>
          <Divider />
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Button size="large" block onClick={() => { setSuccess(false); form.resetFields(); }}>
              Onboard Another
            </Button>
            <Button size="large" type="primary" block onClick={() => navigate("/dashboard/vaultpartner/agents/list")} style={{ background: BRAND_PURPLE }}>
              View Agents
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ color: "#000", marginBottom: 8 }}>Onboard Affiliated Agent</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Enter basic details to create the agent account. The agent can complete their full profile after logging in.
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
              </Row>
            </div>

            <Divider style={{ margin: "24px 0 0" }} />

            {/* Internal Commission */}
            <div style={{ padding: "16px 24px" }}>
              <Title level={5} style={{ color: "#000", marginBottom: 12 }}>Internal Commission Rate</Title>
              <Row gutter={[24, 0]} align="bottom">
                <Col xs={24} sm={10}>
                  <Form.Item
                    name="internalCommissionPercentage"
                    label="Agent Commission %"
                    tooltip="What percentage of the commission Xoto pays your company will you pass on to this agent? Leave blank to use your company default."
                    rules={[{
                      validator: (_, v) => {
                        if (v === undefined || v === null || v === "") return Promise.resolve();
                        const n = Number(v);
                        if (isNaN(n) || n < 0 || n > 100) return Promise.reject("Must be 0–100");
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <Input
                      size="large"
                      type="number"
                      min={0}
                      max={100}
                      placeholder="e.g. 30"
                      suffix="%"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={14}>
                  <div style={{ background: "#F5F0FF", border: "1px solid #E9D5FF", borderRadius: 10, padding: "10px 14px", marginBottom: 24 }}>
                    <Text style={{ fontSize: 12, color: BRAND_PURPLE, fontWeight: 600 }}>
                      Commission is paid by Xoto to your company. You decide what % to share with this agent internally.
                      This is tracked for your reference only — Xoto does not process this payment.
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>

            <Divider style={{ margin: "0 0 0" }} />

            <div style={{ padding: "16px 24px", background: "#fafafa" }}>
              <div style={{ background: "#F5F0FF", border: "1px solid #E9D5FF", borderRadius: 10, padding: "12px 16px" }}>
                <Text style={{ fontSize: 13, color: BRAND_PURPLE, fontWeight: 600 }}>Affiliated Agent Access</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  After onboarding, the agent logs in and completes their profile including Emirates ID, Passport, Visa, and bank details from their profile page.
                </Text>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, padding: "24px", background: "#fafafa", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
              <Button size="large" onClick={() => navigate("/dashboard/vaultpartner/agents/list")} style={{ borderColor: "#E5E7EB" }}>
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
