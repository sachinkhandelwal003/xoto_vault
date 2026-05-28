import React, { useState, useEffect, useCallback } from "react";
import {
  Tabs, Card, Table, Switch, Button, Modal, Form, Input,
  Select, DatePicker, message, Row, Col, Space, Typography, Tag,
  Badge, Spin, Alert, Tooltip, Empty
} from "antd";
import {
  BellOutlined, AlertOutlined, SafetyCertificateOutlined,
  PlusOutlined, ReloadOutlined, UserOutlined,
  CalendarOutlined, SearchOutlined, CheckCircleOutlined,
  CloseCircleOutlined, InfoCircleOutlined, WarningOutlined
} from "@ant-design/icons";
import { apiService } from "@/api/apiService";
import CustomTable from "../../../components/common/CustomTable";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const P  = "#5C039B";
const PM = "#7C3AED";
const PL = "#F5F0FF";
const PB = "#E9D5FF";

const PERSONA_LABELS = {
  admin: "Vault Admin",
  partner: "Company Partner",
  referral_partner: "Referral Partner",
  partner_affiliated_agent: "Affiliated Agent",
  ops: "Mortgage Ops",
  advisor: "Xoto Advisor"
};

const EVENT_LABELS = {
  LEAD_ASSIGNED: "Lead Assigned to Advisor",
  LEAD_STATUS_CHANGED: "Lead Status Modified",
  CASE_CREATED: "Case Record Initialized",
  CASE_SUBMITTED_TO_XOTO: "Case Submitted to Xoto",
  CASE_STATUS_CHANGED: "Case Status Updated",
  CASE_DISBURSED: "Case Loan Disbursed ✅",
  CASE_DECLINED: "Case Declined by Bank",
  DOCUMENT_UPLOADED: "Document Requirement Uploaded",
  DOCUMENT_VERIFIED: "Document Verified by Ops",
  COMMISSION_GENERATED: "Commission Record Generated",
  COMMISSION_CONFIRMED: "Commission Confirmed by Admin",
  AUDIT_LOG_ALERT: "Admin Audit Activity Alert",
  SYSTEM_ANNOUNCEMENT: "Platform-wide System Announcement"
};

const PlatformConfig = () => {
  const [activeTab, setActiveTab] = useState("notifications");

  // ── Notification Prefs State ──
  const [notifConfigs, setNotifConfigs] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [eventTypes, setEventTypes] = useState([]);

  // ── Announcements State ──
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submittingAnn, setSubmittingAnn] = useState(false);

  // ── Audit Logs State ──
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit, setAuditLimit] = useState(10);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [auditFilters, setAuditFilters] = useState({
    entityType: "",
    action: "",
    performedByRole: "",
    dateFrom: "",
    dateTo: ""
  });

  // ==================== FETCH NOTIFICATION PREFS ====================
  const fetchNotifConfigs = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await apiService.get("/vault/platform-config/notifications");
      if (res?.success) {
        setNotifConfigs(res.data || []);
        setEventTypes(res.eventTypes || Object.keys(EVENT_LABELS));
      }
    } catch (err) {
      message.error("Failed to load notification settings");
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const handleTogglePref = async (persona, eventType, checked) => {
    const targetConfig = notifConfigs.find(c => c.persona === persona);
    if (!targetConfig) return;

    const updatedPrefs = { ...targetConfig.preferences, [eventType]: checked };

    try {
      const res = await apiService.put("/vault/platform-config/notifications", {
        persona,
        preferences: updatedPrefs
      });
      if (res?.success) {
        setNotifConfigs(prev =>
          prev.map(c => (c.persona === persona ? { ...c, preferences: updatedPrefs } : c))
        );
        message.success(`Updated notifications for ${PERSONA_LABELS[persona]}`);
      }
    } catch {
      message.error("Failed to save changes");
    }
  };

  // ==================== FETCH ANNOUNCEMENTS ====================
  const fetchAnnouncements = useCallback(async () => {
    setAnnLoading(true);
    try {
      const res = await apiService.get("/vault/platform-config/announcements?all=true");
      if (res?.success) {
        setAnnouncements(res.data || []);
      }
    } catch {
      message.error("Failed to load announcements");
    } finally {
      setAnnLoading(false);
    }
  }, []);

  const handleToggleAnnStatus = async (id, currentActive) => {
    try {
      const res = await apiService.put(`/vault/platform-config/announcements/${id}/status`, {
        active: !currentActive
      });
      if (res?.success) {
        setAnnouncements(prev =>
          prev.map(ann => (ann._id === id ? { ...ann, active: !currentActive } : ann))
        );
        message.success(`Announcement ${!currentActive ? "activated" : "deactivated"}`);
      }
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleCreateAnnouncement = async (values) => {
    setSubmittingAnn(true);
    try {
      const payload = {
        title: values.title,
        message: values.message,
        type: values.type || "info",
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null
      };

      const res = await apiService.post("/vault/platform-config/announcements", payload);
      if (res?.success) {
        message.success("Announcement broadcasted successfully!");
        setModalOpen(false);
        form.resetFields();
        fetchAnnouncements();
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to create announcement");
    } finally {
      setSubmittingAnn(false);
    }
  };

  // ==================== FETCH AUDIT LOGS ====================
  const fetchAuditLogs = useCallback(async (pg = 1, limit = 10) => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({
        page: pg,
        limit,
        ...Object.fromEntries(Object.entries(auditFilters).filter(([, v]) => v))
      });

      const res = await apiService.get(`/vault/audit?${params.toString()}`);
      if (res?.success) {
        setAuditLogs(res.data || []);
        setAuditTotal(res.total || 0);
      }
    } catch {
      message.error("Failed to load audit logs");
    } finally {
      setAuditLoading(false);
    }
  }, [auditFilters]);

  useEffect(() => {
    if (activeTab === "notifications") {
      fetchNotifConfigs();
    } else if (activeTab === "announcements") {
      fetchAnnouncements();
    } else if (activeTab === "audit") {
      fetchAuditLogs(1, auditLimit);
    }
  }, [activeTab, fetchNotifConfigs, fetchAnnouncements, fetchAuditLogs, auditLimit]);

  // Handle Tab Switch
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // ==================== RENDERERS ====================

  // Tab 1: Notifications Grid
  const renderNotificationsTab = () => {
    const columns = [
      {
        title: "Notification / Action Event",
        dataIndex: "event",
        key: "event",
        width: 280,
        render: (text) => (
          <div>
            <div style={{ fontWeight: 600, color: "#1f2937" }}>{EVENT_LABELS[text] || text}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>Code: {text}</div>
          </div>
        )
      },
      ...Object.entries(PERSONA_LABELS).map(([key, label]) => ({
        title: label,
        key: key,
        align: "center",
        width: 130,
        render: (_, record) => {
          const config = notifConfigs.find(c => c.persona === key);
          const checked = config?.preferences?.[record.event] !== false; // Default true if not defined
          return (
            <Switch
              size="small"
              checked={checked}
              onChange={(checked) => handleTogglePref(key, record.event, checked)}
              style={{ background: checked ? PM : "#d1d5db" }}
            />
          );
        }
      }))
    ];

    const data = eventTypes.map(evt => ({ key: evt, event: evt }));

    return (
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Manage Notifications Per Persona</span>
            <Button icon={<ReloadOutlined />} onClick={fetchNotifConfigs} loading={notifLoading} size="small">
              Refresh
            </Button>
          </div>
        }
        bordered={false}
      >
        <Paragraph style={{ color: "#6b7280", marginBottom: 20 }}>
          Enable or disable specific vault alerts, updates, and events dispatched per persona.
          Changes take effect instantly for all notification dispatches.
        </Paragraph>
        {notifLoading ? (
          <div style={{ padding: 60, textAlign: "center" }}><Spin size="large" /></div>
        ) : (
          <CustomTable
            columns={columns}
            data={data}
            loading={notifLoading}
            showSearch={true}
          />
        )}
      </Card>
    );
  };

  // Tab 2: System Announcements
  const renderAnnouncementsTab = () => {
    const columns = [
      {
        title: "Title & Notice",
        dataIndex: "title",
        key: "title",
        render: (_, r) => {
          const alertColors = {
            info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
            warning: { bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
            error: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
            success: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857" }
          };
          const style = alertColors[r.type] || alertColors.info;
          return (
            <div style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontWeight: 800, color: style.text, fontSize: 14 }}>{r.title}</div>
              <div style={{ fontSize: 13, color: "#374151", marginTop: 4 }}>{r.message}</div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 8 }}>
                Pushed by {r.createdByName} on {dayjs(r.createdAt).format("DD MMM YYYY, HH:mm")}
              </div>
            </div>
          );
        }
      },
      {
        title: "Status",
        dataIndex: "active",
        key: "active",
        align: "center",
        width: 120,
        render: (active, record) => (
          <Space direction="vertical" size={4}>
            <Tag color={active ? "success" : "default"}>{active ? "ACTIVE BANNER" : "DISABLED"}</Tag>
            <Switch
              size="small"
              checked={active}
              onChange={() => handleToggleAnnStatus(record._id, active)}
              style={{ background: active ? PM : "#d1d5db", marginTop: 4 }}
            />
          </Space>
        )
      }
    ];

    return (
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Platform Announcements</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
              style={{ background: P, borderColor: P }}
            >
              Push Announcement
            </Button>
          </div>
        }
        bordered={false}
      >
        <Paragraph style={{ color: "#6b7280", marginBottom: 20 }}>
          Broadcast platform-wide notices, maintenance alerts, or announcements. Pushed notices will display at dashboard headers and notification menus.
        </Paragraph>
        {annLoading ? (
          <div style={{ padding: 60, textAlign: "center" }}><Spin size="large" /></div>
        ) : announcements.length === 0 ? (
          <Empty description="No announcements made yet" />
        ) : (
          <CustomTable
            columns={columns}
            data={announcements}
            loading={annLoading}
            showSearch={true}
          />
        )}

        {/* Create Announcement Modal */}
        <Modal
          title={
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Push System Announcement</div>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>Broadcast instantly to all user dashboards</div>
            </div>
          }
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setModalOpen(false)}>Cancel</Button>,
            <Button
              key="submit"
              type="primary"
              loading={submittingAnn}
              onClick={() => form.submit()}
              style={{ background: P, borderColor: P }}
            >
              Broadcast Notice
            </Button>
          ]}
          centered
          width={520}
        >
          <Form form={form} layout="vertical" onFinish={handleCreateAnnouncement} initialValues={{ type: "info" }}>
            <Form.Item
              name="title"
              label="Announcement Title"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input placeholder="e.g. Scheduled System Maintenance" />
            </Form.Item>

            <Form.Item
              name="message"
              label="Notification Message"
              rules={[{ required: true, message: "Message is required" }]}
            >
              <TextArea rows={4} placeholder="e.g. Xoto Vault will undergo minor updates on Friday 10 PM. Expect brief disconnects." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="type" label="Banner Style">
                  <Select>
                    <Option value="info">Info (Blue)</Option>
                    <Option value="warning">Warning (Orange)</Option>
                    <Option value="error">Critical (Red)</Option>
                    <Option value="success">Success (Green)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="expiresAt" label="Expiry Date (Optional)">
                  <DatePicker showTime style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </Card>
    );
  };

  // Tab 3: Immutable Audit Logs
  const renderAuditLogsTab = () => {
    const columns = [
      {
        title: "Action / Event",
        key: "action",
        width: 200,
        render: (actionVal, r) => {
          const colors = {
            LEAD: "purple", CASE: "red", APPLICATION: "volcano",
            DOCUMENT: "cyan", COMMISSION: "green", USER: "orange"
          };
          return (
            <div>
              <Tag color={colors[r.entityType] || "default"}>{r.entityType}</Tag>
              <div style={{ fontWeight: 600, color: "#1f2937", marginTop: 4 }}>
                {String(actionVal).replace(/_/g, " ")}
              </div>
              {r.entityRef && <span style={{ fontSize: 11, fontFamily: "monospace", color: PM }}>#{r.entityRef}</span>}
            </div>
          );
        }
      },
      {
        title: "Actor Details",
        key: "actor",
        width: 220,
        render: (_, r) => {
          const roleColors = { admin: P, advisor: "blue", ops: "cyan", partner: "orange" };
          return (
            <div>
              <div style={{ fontWeight: 600 }}>{r.performedByName}</div>
              <Tag color={roleColors[r.performedByRole] || "default"}>
                {String(r.performedByRole || "system").toUpperCase().replace(/_/g, " ")}
              </Tag>
              {r.ipAddress && <div style={{ fontSize: 10, color: "#9ca3af" }}>IP: {r.ipAddress}</div>}
            </div>
          );
        }
      },
      {
        title: "Timestamp",
        key: "createdAt",
        width: 160,
        render: (createdAtVal) => dayjs(createdAtVal).format("DD MMM YYYY, HH:mm:ss")
      },
      {
        title: "Details",
        key: "details",
        width: 110,
        render: (_, r) => (
          <Button size="small" type="primary" ghost onClick={() => setSelectedAuditLog(r)} style={{ borderColor: PM, color: PM }}>
            View Details
          </Button>
        )
      }
    ];

    return (
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>System Audit Trail</span>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchAuditLogs(1, auditLimit)} size="small">
                Refresh
              </Button>
            </Space>
          </div>
        }
        bordered={false}
      >
        <Paragraph style={{ color: "#6b7280", marginBottom: 20 }}>
          Immutable logs tracking admin interventions, modifications, and core lifecycle events.
        </Paragraph>

        {/* Filters */}
        <div style={{ background: "#fafafc", padding: 14, borderRadius: 12, marginBottom: 16, border: "1px solid #edeaf2" }}>
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={6}>
              <Select
                placeholder="Entity Type"
                style={{ width: "100%" }}
                value={auditFilters.entityType || undefined}
                onChange={v => setAuditFilters(p => ({ ...p, entityType: v || "" }))}
                allowClear
              >
                {["LEAD", "CASE", "APPLICATION", "DOCUMENT", "COMMISSION", "USER", "OPS", "PARTNER", "AGENT", "SYSTEM"].map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6}>
              <Input
                placeholder="Action (e.g. LEAD_CREATED)"
                value={auditFilters.action}
                onChange={e => setAuditFilters(p => ({ ...p, action: e.target.value.toUpperCase() }))}
                allowClear
              />
            </Col>
            <Col xs={12} sm={6}>
              <Select
                placeholder="Actor Role"
                style={{ width: "100%" }}
                value={auditFilters.performedByRole || undefined}
                onChange={v => setAuditFilters(p => ({ ...p, performedByRole: v || "" }))}
                allowClear
              >
                {["admin", "advisor", "partner", "ops", "referral_partner", "partner_affiliated_agent"].map(r => (
                  <Option key={r} value={r}>{r.toUpperCase().replace(/_/g, " ")}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6}>
              <Button
                type="text"
                onClick={() => setAuditFilters({ entityType: "", action: "", performedByRole: "", dateFrom: "", dateTo: "" })}
                danger
                style={{ fontSize: 12 }}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </div>

        <CustomTable
          columns={columns}
          data={auditLogs}
          loading={auditLoading}
          totalItems={auditTotal}
          currentPage={auditPage}
          itemsPerPage={auditLimit}
          onPageChange={(pg, sz) => {
            setAuditPage(pg);
            setAuditLimit(sz);
            fetchAuditLogs(pg, sz);
          }}
          showSearch={false}
        />

        {/* Audit Details Modal */}
        <Modal
          title={
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: P }}>Audit Log Details</div>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>Expanded lifecycle mutation diff details</div>
            </div>
          }
          open={!!selectedAuditLog}
          onCancel={() => setSelectedAuditLog(null)}
          footer={[
            <Button key="close" onClick={() => setSelectedAuditLog(null)}>
              Close
            </Button>
          ]}
          centered
          width={640}
        >
          {selectedAuditLog && (
            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">Action: </Text>
                <Tag color="purple">{selectedAuditLog.action}</Tag>
                <span style={{ marginLeft: 8, fontSize: 11, color: "#9ca3af" }}>
                  on {dayjs(selectedAuditLog.createdAt).format("DD MMM YYYY, HH:mm:ss")}
                </span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">Performed By: </Text>
                <strong style={{ color: P }}>{selectedAuditLog.performedByName}</strong>
                <Tag color="blue" style={{ marginLeft: 8 }}>{String(selectedAuditLog.performedByRole).toUpperCase()}</Tag>
                {selectedAuditLog.ipAddress && <span style={{ marginLeft: 8, fontSize: 11 }}>IP: {selectedAuditLog.ipAddress}</span>}
              </div>
              
              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                {selectedAuditLog.oldValue && (
                  <Col span={12}>
                    <div style={{ fontWeight: 700, fontSize: 11, color: "#dc2626", marginBottom: 6 }}>OLD VALUE:</div>
                    <pre style={{ fontSize: 11, maxHeight: 200, overflow: "auto", background: "#fcf8f8", padding: 8, border: "1px solid #fecaca", borderRadius: 8 }}>
                      {JSON.stringify(selectedAuditLog.oldValue, null, 2)}
                    </pre>
                  </Col>
                )}
                {selectedAuditLog.newValue && (
                  <Col span={12}>
                    <div style={{ fontWeight: 700, fontSize: 11, color: "#16a34a", marginBottom: 6 }}>NEW VALUE:</div>
                    <pre style={{ fontSize: 11, maxHeight: 200, overflow: "auto", background: "#f8fdf9", padding: 8, border: "1px solid #bbf7d0", borderRadius: 8 }}>
                      {JSON.stringify(selectedAuditLog.newValue, null, 2)}
                    </pre>
                  </Col>
                )}
              </Row>
              
              {selectedAuditLog.metadata && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 11, color: PM, marginBottom: 4 }}>METADATA:</div>
                  <pre style={{ fontSize: 11, maxHeight: 150, overflow: "auto", background: "#f9f8ff", padding: 8, border: "1px solid #ede9ff", borderRadius: 8 }}>
                    {JSON.stringify(selectedAuditLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedAuditLog.userAgent && (
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 12 }}>
                  User Agent: {selectedAuditLog.userAgent}
                </div>
              )}
            </div>
          )}
        </Modal>
      </Card>
    );
  };

  return (
    <div style={{ background: "#F4F0FA", minHeight: "100vh", padding: "28px 24px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a0533", margin: 0 }}>Platform Configuration</h1>
          <p style={{ fontSize: 13, color: "#8B7BAE", margin: "4px 0 0" }}>
            Admin portal content control, notification controls, and immutable log audits.
          </p>
        </div>

        {/* Premium Dashboard Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          items={[
            {
              key: "notifications",
              label: (
                <span>
                  <BellOutlined /> Notification Settings
                </span>
              ),
              children: renderNotificationsTab()
            },
            {
              key: "announcements",
              label: (
                <span>
                  <AlertOutlined /> Announcements
                </span>
              ),
              children: renderAnnouncementsTab()
            },
            {
              key: "audit",
              label: (
                <span>
                  <SafetyCertificateOutlined /> System Audit Log
                </span>
              ),
              children: renderAuditLogsTab()
            }
          ]}
        />
      </div>

      <style>{`
        .ant-tabs-card .ant-tabs-tab-active { background: white !important; border-bottom-color: white !important; }
        .ant-tabs-tab-active .ant-tabs-tab-btn { color: ${P} !important; font-weight: 700 !important; }
        .ant-tabs-tab:hover { color: ${PM} !important; }
        .ant-table-thead > tr > th { background: #F9F8FF !important; color: ${P} !important; font-weight: 700 !important; }
      `}</style>
    </div>
  );
};

export default PlatformConfig;
