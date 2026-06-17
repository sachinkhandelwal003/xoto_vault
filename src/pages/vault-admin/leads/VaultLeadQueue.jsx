// src/pages/vault-admin/leads/VaultLeadQueue.jsx
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Button, Tag, message, Space, Select, Input, Tooltip, Badge, Drawer, Modal, Avatar, Alert, Form, Divider, Upload, Table } from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  UserAddOutlined,
  BellOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  PlusCircleOutlined,
  PhoneOutlined,
  FileTextOutlined,
  CloseOutlined,
  DollarOutlined,
  PlusOutlined,
  UploadOutlined,
  InboxOutlined,
  SendOutlined,
  HomeOutlined,
  CalendarOutlined,
  SafetyOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { apiService } from "@/api/apiService";
import CustomTable from "@/components/common/CustomTable";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Country } from "country-state-city";
import dayjs from "dayjs";

const P = "#5C039B";
const PM = "#7C3AED";
const PL = "#F5F0FF";
const PB = "#E9D5FF";

const roleSlugMap = {
  18: "vault-admin",
  21: "vaultpartner",
  22: "vaultagent",
  23: "vault-ops",
  26: "vault-advisor",
};

const STATUS_CFG = {
  New: { color: "blue", bg: "#EFF6FF", text: "#1D4ED8", icon: <PlusCircleOutlined /> },
  Assigned: { color: "purple", bg: "#F5F0FF", text: "#6D28D9", icon: <UserOutlined /> },
  Contacted: { color: "orange", bg: "#FFF7ED", text: "#C2410C", icon: <PhoneOutlined /> },
  Qualified: { color: "geekblue", bg: "#EEF2FF", text: "#4338CA", icon: <CheckCircleOutlined /> },
  "Collecting Documents": { color: "purple", bg: "#FAF5FF", text: "#581C87", icon: <FileTextOutlined /> },
  "Bank Application": { color: "violet", bg: "#EDE9FE", text: "#5B21B6", icon: <FileTextOutlined /> },
  "Pre-Approved": { color: "green", bg: "#DCFCE7", text: "#166534", icon: <CheckCircleOutlined /> },
  Valuation: { color: "orange", bg: "#FEF3C7", text: "#92400E", icon: <ClockCircleOutlined /> },
  "FOL Processed": { color: "indigo", bg: "#E0E7FF", text: "#3730A3", icon: <FileTextOutlined /> },
  "FOL Issued": { color: "indigo", bg: "#E0E7FF", text: "#3730A3", icon: <FileTextOutlined /> },
  "FOL Signed": { color: "purple", bg: "#F3E8FF", text: "#6B21A5", icon: <CheckCircleOutlined /> },
  Disbursed: { color: "success", bg: "#ECFDF5", text: "#065F46", icon: <DollarOutlined /> },
  Lost: { color: "red", bg: "#FEF2F2", text: "#991B1B", icon: <CloseOutlined /> },
};

const SOURCE_CFG = {
  website: { color: "blue", label: "Website" },
  freelance_agent: { color: "purple", label: "Referral Partner" },
  individual_partner: { color: "green", label: "Partner" },
  admin: { color: "orange", label: "Admin" },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
const cap = (s) => s ? s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";

const getTimeInQueue = (createdAt) => {
  if (!createdAt) return "—";
  const hours = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60));
  if (hours < 1) return "< 1 hour";
  if (hours === 1) return "1 hour";
  return `${hours} hours`;
};

const VaultLeadQueue = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const rawRole = user?.role;
  const roleCode = rawRole ? (typeof rawRole === "object" ? Number(rawRole.code) : Number(rawRole)) : 18;
  const roleSlug = roleSlugMap[roleCode] ?? "vault-admin";
  const isAdmin = roleCode === 18;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [filters, setFilters] = useState({ search: "", source: "" });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [assignModal, setAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [batchAssignMode, setBatchAssignMode] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkResultOpen, setBulkResultOpen] = useState(false);

  const [advisors, setAdvisors] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);
  const [createResidency, setCreateResidency] = useState(null);

  const nationalityOptions = useMemo(() =>
    Country.getAllCountries().map(c => ({ label: c.name, value: c.name })).sort((a, b) => a.label.localeCompare(b.label)),
  []);

  useEffect(() => {
    const isBulkPath = location.pathname.endsWith('/leads/bulk-upload');
    setBulkModalOpen(isBulkPath);
  }, [location.pathname]);

  const activeCount = Object.entries(filters).filter(([, v]) => v !== "").length;

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAdvisors = async () => {
      try {
        const res = await apiService.get("/vault/advisor/for-assignment");
        const list = res?.data?.data || res?.data || [];
        setAdvisors(
          list.map((a) => ({
            id: a._id,
            fullName: a.fullName || a.email || "Advisor",
            email: a.email,
            currentLeads: a.currentLeads || 0,
            maxLeadsCapacity: a.maxCapacity || 20,
            remainingCapacity: a.availableSlots ?? 0,
            canTakeMore: !a.atCapacity,
            slaComplianceRate: a.slaComplianceRate || 0,
          }))
        );
      } catch {}
    };
    fetchAdvisors();
  }, [isAdmin]);

  const fetchLeads = useCallback(async (page, limit, f) => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit });
      if (f.search) params.set("search", f.search);
      if (f.source) params.set("source", f.source);

      const res = await apiService.get(`/vault/lead/admin/unassigned?${params.toString()}`);
      const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      const total = res?.data?.total || list.length;
      setData(list);
      setTotalItems(total);
    } catch {
      message.error("Failed to load unassigned leads.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchLeads(currentPage, itemsPerPage, filters);
  }, [isAdmin, currentPage, itemsPerPage, filters, fetchLeads]);

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setItemsPerPage(size);
    fetchLeads(page, size, filters);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchLeads(1, itemsPerPage, filters);
    setDrawerOpen(false);
  };

  const resetFilters = () => {
    const reset = { search: "", source: "" };
    setFilters(reset);
    setCurrentPage(1);
    fetchLeads(1, itemsPerPage, reset);
    setDrawerOpen(false);
  };

  const handleViewDetail = (id) => {
    if (id) navigate(`/dashboard/${roleSlug}/vault/lead/${id}`);
  };

  const openAssign = (record) => {
    setBatchAssignMode(false);
    setAssignTarget({ leadId: record?._id || record?.leadId, clientName: record?.customerInfo?.fullName || "this lead" });
    setSelectedAdvisor(null);
    setAssignModal(true);
  };

  const openBatchAssign = () => {
    if (!selectedLeadIds.length) { message.warning("Please select at least one lead to assign."); return; }
    setBatchAssignMode(true);
    setAssignTarget({ leadIds: selectedLeadIds, clientName: `${selectedLeadIds.length} selected lead${selectedLeadIds.length > 1 ? "s" : ""}` });
    setSelectedAdvisor(null);
    setAssignModal(true);
  };

  const handleCreateLead = async () => {
    try {
      await createForm.validateFields();
    } catch { message.error("Please fill all required fields"); return; }
    setCreateLoading(true);
    try {
      const v = createForm.getFieldsValue(true);
      const cleaned = (v.mobileNumber || "").replace(/\D/g, "");
      const payload = {
        customerInfo: {
          firstName: v.firstName,
          lastName: v.lastName,
          countryCode: "+971",
          mobileNumber: cleaned.slice(-9),
          email: v.email || null,
          residencyStatus: v.residencyStatus || null,
          nationality: v.nationality || null,
          employmentStatus: v.employmentStatus || null,
        },
        propertyDetails: {
          transactionType: v.transactionType || null,
          propertyFound: v.propertyFound === true,
          approxPropertyValue: v.propertyFound === true ? (v.approxPropertyValue || null) : null,
        },
        loanRequirements: { timeline: v.timeline || null },
        notesToXoto: v.notesToXoto || null,
      };
      const res = await apiService.post("vault/lead/admin/create", payload);
      if (res?.success || res?.data) {
        message.success("Lead created and added to queue!");
        createForm.resetFields();
        setCreateResidency(null);
        setCreateOpen(false);
        fetchLeads(1, itemsPerPage, filters);
      } else {
        message.error(res?.message || "Failed to create lead");
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to create lead");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleBulkFileSelect = (file) => {
    setBulkFile(file);
    return false;
  };

  const handleBulkRemove = () => {
    setBulkFile(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      message.warning("Please select a file to upload.");
      return;
    }
    setBulkUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      const res = await apiService.upload('/vault/lead/admin/bulk-upload', formData);
      // If API responds with detailed summary, show it to the user
      if (res && (res.success === false || res.summary)) {
        setBulkResult(res);
        setBulkResultOpen(true);
        // close upload modal
        setBulkModalOpen(false);
        setBulkFile(null);
        // refresh leads if any created
        if (res.summary && res.summary.created > 0) fetchLeads(currentPage, itemsPerPage, filters);
        // show top-level message
        if (res.message) message.error(res.message);
      } else {
        message.success('Bulk upload submitted successfully.');
        setBulkModalOpen(false);
        setBulkFile(null);
        fetchLeads(currentPage, itemsPerPage, filters);
      }
    } catch (err) {
      const e = err?.response?.data || err;
      // attempt to surface server response
      if (e && (e.summary || e.details)) {
        setBulkResult(e);
        setBulkResultOpen(true);
        setBulkModalOpen(false);
        setBulkFile(null);
      } else {
        message.error(err?.response?.data?.message || 'Bulk upload failed');
      }
    } finally {
      setBulkUploading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAdvisor) { message.warning("Please select an advisor first"); return; }
    setAssignLoading(true);
    try {
      const payload = batchAssignMode
        ? { leadIds: assignTarget.leadIds, advisorId: selectedAdvisor }
        : { leadIds: [assignTarget.leadId], advisorId: selectedAdvisor };
      await apiService.post("/vault/lead/admin/assign-to-advisor", payload);
      message.success(batchAssignMode
        ? `Assigned ${assignTarget.leadIds.length} lead${assignTarget.leadIds.length > 1 ? "s" : ""} successfully!`
        : "Lead assigned successfully! SLA timer started (4 hours to contact).");
      setAssignModal(false);
      setSelectedAdvisor(null);
      setAssignTarget(null);
      setBatchAssignMode(false);
      if (batchAssignMode) setSelectedLeadIds([]);
      fetchLeads(currentPage, itemsPerPage, filters);
    } catch (err) {
      message.error(err?.response?.data?.message || "Assignment failed");
    } finally {
      setAssignLoading(false);
    }
  };

  const urgentCount = data.filter((l) => l.createdAt && (new Date() - new Date(l.createdAt)) > 2 * 60 * 60 * 1000).length;

  const columns = [
    {
      key: "select",
      title: isAdmin ? (
        <input
          type="checkbox"
          checked={data.length > 0 && data.every((item) => selectedLeadIds.includes(item._id || item.leadId))}
          onChange={(e) => {
            const allIds = data.map((item) => item._id || item.leadId).filter(Boolean);
            setSelectedLeadIds(e.target.checked ? allIds : []);
          }}
        />
      ) : null,
      width: 48,
      render: (_, r) => {
        if (!isAdmin) return null;
        const leadId = r?._id || r?.leadId;
        return (
          <input
            type="checkbox"
            checked={selectedLeadIds.includes(leadId)}
            onChange={(e) =>
              setSelectedLeadIds(e.target.checked
                ? [...selectedLeadIds, leadId]
                : selectedLeadIds.filter((id) => id !== leadId)
              )
            }
          />
        );
      },
    },
    {
      key: "customerInfo",
      title: "Client",
      width: 220,
      render: (_, r) => {
        const ci = r?.customerInfo || {};
        return (
          <div>
            <div style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>
              {ci.fullName || `${ci.firstName || ""} ${ci.lastName || ""}`.trim() || "—"}
            </div>
            {ci.email && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{ci.email}</div>}
            {ci.mobileNumber && <div style={{ fontSize: 11, color: "#6B7280" }}>{ci.mobileNumber}</div>}
          </div>
        );
      },
    },
    {
      key: "source",
      title: "Source",
      width: 140,
      render: (_, r) => {
        const src = r?.sourceInfo?.source;
        if (!src) return <span style={{ color: "#D1D5DB" }}>—</span>;
        const cfg = SOURCE_CFG[src] || { color: "default", label: cap(src) };
        return <Tag color={cfg.color} style={{ borderRadius: 20 }}>{cfg.label}</Tag>;
      },
    },
    {
      key: "createdBy",
      title: "Submitted By",
      width: 150,
      render: (_, r) => {
        const si = r?.sourceInfo || {};
        return si.createdByName ? (
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{si.createdByName}</div>
            <div style={{ fontSize: 10, color: "#9CA3AF" }}>{cap(si.createdByRole)}</div>
          </div>
        ) : <span style={{ color: "#D1D5DB" }}>—</span>;
      },
    },
    {
      key: "propertyDetails",
      title: "Transaction",
      width: 150,
      render: (_, r) => {
        const pd = r?.propertyDetails || {};
        return (
          <div>
            <div style={{ fontSize: 12, color: "#374151" }}>{pd.transactionType || "—"}</div>
            <div style={{ fontSize: 10, color: "#9CA3AF" }}>{pd.approxPropertyValue || ""}</div>
          </div>
        );
      },
    },
    {
      key: "timeline",
      title: "Timeline",
      width: 110,
      render: (_, r) => {
        const lr = r?.loanRequirements || {};
        return (
          <Tag color="orange" style={{ borderRadius: 20, fontSize: 11 }}>
            {lr.timeline || "—"}
          </Tag>
        );
      },
    },
    {
      key: "timeInQueue",
      title: "Time in Queue",
      width: 130,
      render: (_, r) => {
        const timeInQueue = getTimeInQueue(r?.createdAt);
        const isUrgent = r?.createdAt && (new Date() - new Date(r.createdAt)) > 2 * 60 * 60 * 1000;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ClockCircleOutlined style={{ color: isUrgent ? "#F59E0B" : "#9CA3AF", fontSize: 12 }} />
            <span style={{ fontSize: 12, color: isUrgent ? "#D97706" : "#6B7280", fontWeight: isUrgent ? 600 : 400 }}>
              {timeInQueue}
            </span>
            {isUrgent && (
              <Tooltip title="Waiting over 2 hours — assign urgently">
                <WarningOutlined style={{ color: "#F59E0B", fontSize: 11 }} />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      title: "Created",
      width: 100,
      render: (_, r) => <div style={{ fontSize: 11, color: "#6B7280" }}>{fmtDate(r?.createdAt)}</div>,
    },
    {
      key: "actions",
      title: "Actions",
      width: 110,
      align: "center",
      render: (_, r) => {
        const leadId = r?._id || r?.leadId;
        return (
          <Space size={4}>
            <Tooltip title="View Details">
              <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(leadId)} style={{ color: P }} size="small" />
            </Tooltip>
            <Tooltip title="Assign to Advisor">
              <Button
                size="small"
                icon={<UserAddOutlined />}
                onClick={() => openAssign(r)}
                style={{ borderRadius: 6, color: P, borderColor: PB, background: PL }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: "#F4F0FA", padding: 28, textAlign: "center" }}>
        <Alert message="Access Denied" description="Only admin can access the lead queue." type="error" showIcon />
      </div>
    );
  }

  return (
    <div style={{ background: "#F4F0FA", minHeight: "100vh", padding: "28px 24px", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .vlq-table .ant-table-thead > tr > th { background: #FAF8FF !important; color: ${P} !important; font-weight: 700 !important; border-bottom: 1px solid #EDE4FF !important; font-size: 12px !important; }
        .vlq-table .ant-table-tbody > tr:hover > td { background: #F5F0FF !important; }
        .vlq-table .ant-table-tbody > tr > td { border-bottom: 1px solid #F5F0FF; }
        .vlq-table .ant-pagination-item-active { border-color: ${P} !important; background: ${P} !important; }
        .vlq-table .ant-pagination-item-active a { color: white !important; }
        .vlq-stat { transition: all .2s; cursor: default; }
        .vlq-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(92,3,155,0.12) !important; }
      `}</style>

      {/* Urgent Banner */}
      {urgentCount > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Alert
            message={
              <span>
                <WarningOutlined style={{ color: "#D97706", marginRight: 8 }} />
                <strong>{urgentCount} lead{urgentCount !== 1 ? "s" : ""}</strong> waiting over 2 hours — assign them urgently
              </span>
            }
            type="warning"
            showIcon={false}
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12 }}
          />
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 28, background: `linear-gradient(to bottom, ${P}, ${PM})`, borderRadius: 4 }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a0533", margin: 0 }}>Lead Queue</h1>
          </div>
          <p style={{ fontSize: 13, color: "#8B7BAE", margin: "6px 0 0 14px" }}>
            Unassigned leads awaiting advisor assignment — {loading ? "loading..." : `${totalItems} lead${totalItems !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button
            type="default"
            icon={<UploadOutlined />}
            onClick={() => setBulkModalOpen(true)}
            style={{ borderRadius: 10, borderColor: P, color: P, fontWeight: 600 }}
          >
            Bulk Upload
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/vault-admin/leads/create')}
            style={{ borderRadius: 10, background: P, borderColor: P, fontWeight: 600 }}
          >
            Create Lead
          </Button>
          <Button
            type="primary"
            disabled={selectedLeadIds.length === 0}
            onClick={openBatchAssign}
            icon={<TeamOutlined />}
            style={{ borderRadius: 10, background: selectedLeadIds.length > 0 ? "#4A027C" : undefined, borderColor: selectedLeadIds.length > 0 ? "#4A027C" : undefined, fontWeight: 600 }}
          >
            Assign Selected ({selectedLeadIds.length})
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchLeads(currentPage, itemsPerPage, filters)} loading={loading} style={{ borderRadius: 10, borderColor: "#E8DFF5", color: P }} />
          <Badge count={activeCount} color={P} size="small">
            <Button
              icon={<FilterOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ borderRadius: 10, background: activeCount > 0 ? PL : "white", borderColor: activeCount > 0 ? P : "#E8DFF5", color: activeCount > 0 ? P : "#374151" }}
            >
              Filters
            </Button>
          </Badge>
          {activeCount > 0 && (
            <Button icon={<ClearOutlined />} onClick={resetFilters} style={{ borderRadius: 10, borderColor: "#FECACA", color: "#DC2626", background: "#FEF2F2" }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert
        message={<span style={{ fontWeight: 600, color: P }}>Unassigned Lead Queue</span>}
        description="These leads have not been assigned to any advisor yet. Select and assign them to start the 4-hour SLA contact timer."
        type="info"
        showIcon={false}
        style={{ marginBottom: 20, borderRadius: 12, background: PL, border: `1px solid ${PB}` }}
      />

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
        <div className="vlq-stat" style={{ background: "white", borderRadius: 14, padding: "16px 20px", border: `1px solid ${PB}`, boxShadow: "0 1px 4px rgba(92,3,155,0.06)" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Awaiting Assignment</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: P, lineHeight: 1.1, marginTop: 4 }}>{totalItems}</div>
        </div>
        <div className="vlq-stat" style={{ background: "white", borderRadius: 14, padding: "16px 20px", border: `1px solid ${PB}`, boxShadow: "0 1px 4px rgba(92,3,155,0.06)" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Selected for Assign</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#6D28D9", lineHeight: 1.1, marginTop: 4 }}>{selectedLeadIds.length}</div>
        </div>
        <div className="vlq-stat" style={{ background: "white", borderRadius: 14, padding: "16px 20px", border: `1px solid ${PB}`, boxShadow: "0 1px 4px rgba(92,3,155,0.06)" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Available Advisors</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#10B981", lineHeight: 1.1, marginTop: 4 }}>{advisors.filter((a) => a.canTakeMore).length}</div>
        </div>
        <div className="vlq-stat" style={{ background: urgentCount > 0 ? "#FFFBEB" : "white", borderRadius: 14, padding: "16px 20px", border: `1px solid ${urgentCount > 0 ? "#FDE68A" : PB}`, boxShadow: "0 1px 4px rgba(92,3,155,0.06)" }}>
          <div style={{ fontSize: 10, color: urgentCount > 0 ? "#D97706" : "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Urgent (2h+ wait)</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#F59E0B", lineHeight: 1.1, marginTop: 4 }}>{urgentCount}</div>
        </div>
      </div>

      {/* Quick Search */}
      <div style={{ background: "white", borderRadius: 14, border: `1px solid ${PB}`, padding: "14px 18px", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Input
            prefix={<SearchOutlined style={{ color: P }} />}
            placeholder="Search by name, email, or phone..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            onPressEnter={applyFilters}
            allowClear
            style={{ flex: 1, minWidth: 220, borderRadius: 10, borderColor: PB }}
          />
          <Select
            placeholder="All Sources"
            value={filters.source || undefined}
            onChange={(v) => setFilters((p) => ({ ...p, source: v || "" }))}
            allowClear
            style={{ width: 160 }}
          >
            {Object.entries(SOURCE_CFG).map(([key, cfg]) => (
              <Select.Option key={key} value={key}>{cfg.label}</Select.Option>
            ))}
          </Select>
          <Button type="primary" onClick={applyFilters} style={{ borderRadius: 10, background: P, borderColor: P }}>Apply</Button>
        </div>
      </div>

      {/* Table */}
      <div className="vlq-table" style={{ background: "white", borderRadius: 16, border: `1px solid ${PB}`, overflow: "hidden" }}>
        <CustomTable
          columns={columns}
          data={data}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          showSearch={false}
          rowKey="_id"
        />
      </div>

      {/* Assign Modal */}
      <Modal
        open={assignModal}
        onCancel={() => { setAssignModal(false); setBatchAssignMode(false); setAssignTarget(null); setSelectedAdvisor(null); }}
        title={batchAssignMode ? "Assign Selected Leads to Advisor" : "Assign Lead to Advisor"}
        footer={[
          <Button key="cancel" onClick={() => { setAssignModal(false); setBatchAssignMode(false); setAssignTarget(null); setSelectedAdvisor(null); }}>Cancel</Button>,
          <Button key="assign" type="primary" loading={assignLoading} disabled={!selectedAdvisor} onClick={handleAssign} style={{ background: P }}>
            Confirm Assignment
          </Button>,
        ]}
        centered
        width={550}
      >
        <div style={{ background: "#F0FDF4", border: "1px solid #D1FAE5", borderRadius: 10, padding: "12px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ClockCircleOutlined style={{ color: "#059669" }} />
            <span style={{ fontSize: 12, color: "#065F46" }}>SLA clock starts immediately — 4 hours to contact customer</span>
          </div>
        </div>
        <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Select Advisor</label>
        <div style={{ maxHeight: 350, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {advisors.map((adv) => {
            const isSelected = selectedAdvisor === adv.id;
            return (
              <div
                key={adv.id}
                onClick={() => setSelectedAdvisor(isSelected ? null : adv.id)}
                style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${isSelected ? P : "#e8dff5"}`, background: isSelected ? PL : "white", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar icon={<UserOutlined />} style={{ background: P }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{adv.fullName}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>{adv.email}</div>
                    <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, flexWrap: "wrap" }}>
                      <span style={{ color: "#374151" }}><strong>{adv.currentLeads}</strong>/{adv.maxLeadsCapacity} leads</span>
                      <span style={{ color: "#6B7280" }}>{adv.remainingCapacity} slots free</span>
                      <span style={{ color: "#6B7280" }}>SLA: {Math.round(adv.slaComplianceRate || 0)}%</span>
                      <Tag color={adv.canTakeMore ? "success" : "orange"} style={{ fontSize: 10, margin: 0 }}>
                        {adv.canTakeMore ? "Available" : "At Capacity"}
                      </Tag>
                    </div>
                  </div>
                  {isSelected && <CheckCircleOutlined style={{ color: P }} />}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal
        open={bulkModalOpen}
        onCancel={() => {
          setBulkModalOpen(false);
          setBulkFile(null);
          if (location.pathname.endsWith('/leads/bulk-upload')) {
            navigate('/dashboard/vault-admin/vault/agent-leads/unassigned');
          }
        }}
        title="Bulk Upload Leads"
        footer={[
          <Button key="cancel" onClick={() => {
            setBulkModalOpen(false);
            setBulkFile(null);
            if (location.pathname.endsWith('/leads/bulk-upload')) {
              navigate('/dashboard/vault-admin/vault/agent-leads/unassigned');
            }
          }}>Cancel</Button>,
          <Button key="upload" type="primary" onClick={handleBulkUpload} loading={bulkUploading} disabled={!bulkFile} style={{ background: P }}>
            Upload File
          </Button>,
        ]}
        centered
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Choose a lead import file</div>
            <div style={{ color: '#6B7280', fontSize: 13 }}>Upload a .csv, .xlsx or .xls file containing leads. The file will be processed and added to the admin lead queue.</div>
          </div>
          <Upload
            accept=".csv,.xlsx,.xls"
            beforeUpload={handleBulkFileSelect}
            onRemove={handleBulkRemove}
            fileList={bulkFile ? [bulkFile] : []}
            maxCount={1}
            showUploadList={{ showRemoveIcon: true }}
          >
            <Button icon={<UploadOutlined />} type="default" style={{ borderRadius: 10 }}>
              Select File
            </Button>
          </Upload>
          {bulkFile && (
            <div style={{ fontSize: 13, color: '#374151' }}>
              Selected file: <strong>{bulkFile.name}</strong>
            </div>
          )}
          <Alert
            message="File must contain valid lead columns"
            description="At minimum include name, email, phone, transaction type or property value in the file."
            type="info"
            showIcon
            style={{ borderRadius: 10 }}
          />
        </div>
      </Modal>

      {/* Bulk Upload Results Modal */}
      <Modal
        open={bulkResultOpen}
        onCancel={() => { setBulkResultOpen(false); setBulkResult(null); }}
        title="Bulk Upload Results"
        footer={[
          <Button key="close" onClick={() => { setBulkResultOpen(false); setBulkResult(null); }}>Close</Button>,
        ]}
        width={860}
        centered
      >
        {bulkResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Alert
              message={bulkResult.message || 'Bulk upload completed'}
              type={bulkResult.success === false ? 'error' : 'info'}
              showIcon
            />

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {bulkResult.summary && Object.entries(bulkResult.summary).map(([k, v]) => (
                <div key={k} style={{ padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #eef2ff', minWidth: 120 }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{k.replace(/([A-Z])/g, ' $1')}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: P, marginTop: 6 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Duplicate In System */}
            {bulkResult.details?.duplicateInSystem && bulkResult.details.duplicateInSystem.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Duplicate in System ({bulkResult.details.duplicateInSystem.length})</div>
                <Table
                  dataSource={bulkResult.details.duplicateInSystem.map((r, i) => ({ key: i, ...r }))}
                  pagination={{ pageSize: 5 }}
                  columns={[
                    { title: 'Row', dataIndex: 'row', key: 'row', width: 60 },
                    { title: 'Reason', dataIndex: 'reason', key: 'reason', width: 220 },
                    { title: 'Existing Lead ID', dataIndex: 'existingLeadId', key: 'existingLeadId', width: 180 },
                    { title: 'Existing Advisor', dataIndex: 'existingAdvisor', key: 'existingAdvisor', width: 140 },
                    { title: 'Data', dataIndex: 'data', key: 'data', render: (d) => <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(d, null, 2)}</pre> },
                  ]}
                />
              </div>
            )}

            {/* Failed rows (non-duplicates) */}
            {bulkResult.details?.failed && bulkResult.details.failed.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Failed Rows ({bulkResult.details.failed.length})</div>
                <Table
                  dataSource={bulkResult.details.failed.map((r, i) => ({ key: i, ...r }))}
                  pagination={{ pageSize: 5 }}
                  columns={[
                    { title: 'Row', dataIndex: 'row', key: 'row', width: 60 },
                    { title: 'Reason', dataIndex: 'reason', key: 'reason', width: 300 },
                    { title: 'Data', dataIndex: 'data', key: 'data', render: (d) => <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(d, null, 2)}</pre> },
                  ]}
                />
              </div>
            )}
          </div>
        ) : (
          <div>No details available.</div>
        )}
      </Modal>

      {/* Create Lead Drawer */}
      <Drawer
        title={<span style={{ fontWeight: 800, fontSize: 16, color: P }}>Create New Lead</span>}
        placement="right"
        width={620}
        open={createOpen}
        onClose={() => { setCreateOpen(false); createForm.resetFields(); setCreateResidency(null); }}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button onClick={() => { setCreateOpen(false); createForm.resetFields(); setCreateResidency(null); }}>Cancel</Button>
            <Button type="primary" loading={createLoading} onClick={handleCreateLead} icon={<SendOutlined />} style={{ background: P, borderColor: P, fontWeight: 700, minWidth: 160 }}>
              Submit Lead
            </Button>
          </div>
        }
      >
        <Form form={createForm} layout="vertical" scrollToFirstError>
          {/* Customer Info */}
          <div style={{ fontWeight: 700, color: P, fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <UserOutlined /> Customer Information
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: "Required" }]}>
              <Input size="large" placeholder="Ahmed" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: "Required" }]}>
              <Input size="large" placeholder="Khan" style={{ borderRadius: 8 }} />
            </Form.Item>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item name="mobileNumber" label="Mobile Number *"
              rules={[{ required: true }, { validator: (_, v) => { const c = String(v || "").replace(/\D/g, ""); return c.length >= 9 ? Promise.resolve() : Promise.reject("Enter valid mobile"); } }]}
            >
              <PhoneInput country="ae" preferredCountries={["ae", "sa", "in", "pk"]} enableSearch inputStyle={{ width: "100%", height: 40, borderRadius: 8 }} />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input size="large" placeholder="customer@email.com" prefix={<MailOutlined style={{ color: "#cbd5e1" }} />} style={{ borderRadius: 8 }} />
            </Form.Item>
          </div>

          <Divider style={{ margin: "8px 0 16px" }} />
          <div style={{ fontWeight: 700, color: P, fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <SafetyOutlined /> Residency & Employment
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
            <Form.Item name="residencyStatus" label="Residency Status">
              <Select size="large" placeholder="Select" allowClear onChange={(v) => {
                setCreateResidency(v);
                if (v === "UAE National") createForm.setFieldValue("nationality", "United Arab Emirates");
                else createForm.setFieldValue("nationality", undefined);
              }}>
                {["UAE National", "UAE Resident", "Non-Resident"].map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="nationality" label="Nationality"
              rules={[{ required: createResidency === "UAE Resident" || createResidency === "Non-Resident", message: "Required" }]}
            >
              <Select size="large" showSearch placeholder="Select" optionFilterProp="label" options={nationalityOptions} disabled={createResidency === "UAE National"} allowClear />
            </Form.Item>
            <Form.Item name="employmentStatus" label="Employment Status">
              <Select size="large" placeholder="Select" allowClear>
                {["Salaried", "Self-Employed"].map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
              </Select>
            </Form.Item>
          </div>

          <Divider style={{ margin: "8px 0 16px" }} />
          <div style={{ fontWeight: 700, color: P, fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <HomeOutlined /> Property Details
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
            <Form.Item name="transactionType" label="Transaction Type">
              <Select size="large" placeholder="Select" allowClear>
                {["Primary - Residential", "Primary - Commercial", "Buyout", "Equity", "Buyout + Equity", "Off-plan"].map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="propertyFound" label="Property Found?">
              <Select size="large" placeholder="Yes / No" allowClear>
                <Select.Option value={true}>Yes</Select.Option>
                <Select.Option value={false}>No</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="approxPropertyValue" label="Approx Property Value"
              dependencies={["propertyFound"]}
              rules={[({ getFieldValue }) => ({ required: getFieldValue("propertyFound") === true, message: "Required when property found" })]}
            >
              <Select size="large" placeholder="Select range" allowClear>
                {["<1M", "1-2M", "2-5M", "5-10M", "10M+"].map(v => <Select.Option key={v} value={v}>{v}</Select.Option>)}
              </Select>
            </Form.Item>
          </div>

          <Divider style={{ margin: "8px 0 16px" }} />
          <div style={{ fontWeight: 700, color: P, fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarOutlined /> Loan & Notes
          </div>
          <Form.Item name="timeline" label="Purchase Timeline">
            <Select size="large" placeholder="When do they plan to buy?" allowClear>
              {["Immediately", "1-3 months", "3-6 months", "More than 6 months"].map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="notesToXoto" label="Notes to Xoto">
            <Input.TextArea rows={3} placeholder="Any additional details..." style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        title="Filter Leads"
        placement="right"
        width={320}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button onClick={resetFilters} style={{ flex: 1 }}>Reset</Button>
            <Button type="primary" onClick={applyFilters} style={{ flex: 2, background: P }}>Apply Filters</Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#6B21A8" }}>Search</div>
            <Input placeholder="Name, email, phone..." value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} onPressEnter={applyFilters} />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#6B21A8" }}>Lead Source</div>
            <Select style={{ width: "100%" }} placeholder="All Sources" value={filters.source || undefined} onChange={(v) => setFilters((p) => ({ ...p, source: v || "" }))} allowClear>
              {Object.entries(SOURCE_CFG).map(([key, cfg]) => (
                <Select.Option key={key} value={key}>{cfg.label}</Select.Option>
              ))}
            </Select>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default VaultLeadQueue;
