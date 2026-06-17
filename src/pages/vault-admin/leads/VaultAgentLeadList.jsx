// src/pages/vault-admin/leads/VaultAgentLeadList.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Button, Tag, message, Space, DatePicker, Select, Input, Tooltip, Badge, Drawer, Modal, Avatar, Alert, Spin } from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  FileTextOutlined,
  CloseOutlined,
  DollarOutlined,
  EditOutlined,
  CalculatorOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/api/apiService";
import CustomTable from "@/components/common/CustomTable";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";

dayjs.extend(relativeTime);
dayjs.extend(duration);

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

// Statuses an affiliated agent can set manually
const MANUAL_STATUS_OPTIONS = ["Contacted", "Qualified", "Collecting Documents", "Documents Complete"];

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

// Partner-specific statuses (No SLA/Advisor statuses)
// Partner / Agent view — simplified statuses (PRD 4.3 Referral Partner view)
const PARTNER_STATUS_CFG = {
  "New":                  { color: "blue",     bg: "#EFF6FF", text: "#1D4ED8", icon: <FileTextOutlined /> },
  "Contacted":            { color: "orange",   bg: "#FFF7ED", text: "#C2410C", icon: <PhoneOutlined /> },
  "Qualified":            { color: "geekblue", bg: "#EEF2FF", text: "#4338CA", icon: <CheckCircleOutlined /> },
  "Collecting Documents": { color: "green",    bg: "#F0FDF4", text: "#166534", icon: <FileTextOutlined /> },
  "Documents Complete":   { color: "cyan",     bg: "#ECFEFF", text: "#0E7490", icon: <CheckCircleOutlined /> },
  "Application Opened":   { color: "volcano",  bg: "#FFF5F3", text: "#C2410C", icon: <FileTextOutlined /> },
  "Bank Application":     { color: "purple",   bg: "#EDE9FE", text: "#5B21B6", icon: <FileTextOutlined /> },
  "Pre-Approved":         { color: "green",    bg: "#DCFCE7", text: "#166534", icon: <CheckCircleOutlined /> },
  "Valuation":            { color: "orange",   bg: "#FEF3C7", text: "#92400E", icon: <FileTextOutlined /> },
  "FOL Processed":        { color: "indigo",   bg: "#E0E7FF", text: "#3730A3", icon: <FileTextOutlined /> },
  "FOL Issued":           { color: "indigo",   bg: "#E0E7FF", text: "#3730A3", icon: <FileTextOutlined /> },
  "FOL Signed":           { color: "purple",   bg: "#F3E8FF", text: "#6B21A5", icon: <CheckCircleOutlined /> },
  "Disbursed":            { color: "success",  bg: "#ECFDF5", text: "#065F46", icon: <DollarOutlined /> },
  "Not Proceeding":       { color: "default",  bg: "#F3F4F6", text: "#6B7280", icon: <CloseOutlined /> },
  "Lost":                 { color: "red",      bg: "#FEF2F2", text: "#B91C1C", icon: <CloseOutlined /> },
};

// Admin/Advisor — full workflow statuses (PRD 6.1)
const ADMIN_STATUS_CFG = {
  "New":                  { color: "blue",     bg: "#EFF6FF", text: "#1D4ED8", icon: <FileTextOutlined /> },
  "Assigned":             { color: "purple",   bg: "#F5F0FF", text: "#6D28D9", icon: <UserOutlined /> },
  "Contacted":            { color: "orange",   bg: "#FFF7ED", text: "#C2410C", icon: <PhoneOutlined /> },
  "Qualified":            { color: "geekblue", bg: "#EEF2FF", text: "#4338CA", icon: <CheckCircleOutlined /> },
  "Collecting Documents": { color: "green",    bg: "#F0FDF4", text: "#166534", icon: <FileTextOutlined /> },
  "Documents Complete":   { color: "cyan",     bg: "#ECFEFF", text: "#0E7490", icon: <CheckCircleOutlined /> },
  "Application Opened":   { color: "volcano",  bg: "#FFF5F3", text: "#C2410C", icon: <FileTextOutlined /> },
  "Bank Application":     { color: "purple",   bg: "#EDE9FE", text: "#5B21B6", icon: <FileTextOutlined /> },
  "Pre-Approved":         { color: "green",    bg: "#DCFCE7", text: "#166534", icon: <CheckCircleOutlined /> },
  "Valuation":            { color: "orange",   bg: "#FEF3C7", text: "#92400E", icon: <FileTextOutlined /> },
  "FOL Processed":        { color: "indigo",   bg: "#E0E7FF", text: "#3730A3", icon: <FileTextOutlined /> },
  "FOL Issued":           { color: "indigo",   bg: "#E0E7FF", text: "#3730A3", icon: <FileTextOutlined /> },
  "FOL Signed":           { color: "purple",   bg: "#F3E8FF", text: "#6B21A5", icon: <CheckCircleOutlined /> },
  "Disbursed":            { color: "success",  bg: "#ECFDF5", text: "#065F46", icon: <DollarOutlined /> },
  "Not Proceeding":       { color: "default",  bg: "#F3F4F6", text: "#6B7280", icon: <CloseOutlined /> },
  "Lost":                 { color: "red",      bg: "#FEF2F2", text: "#B91C1C", icon: <CloseOutlined /> },
};

const SOURCE_CFG = {
  website: { color: "blue", label: "Website" },
  freelance_agent: { color: "purple", label: "Referral Partner" },
  partner_affiliated_agent: { color: "green", label: "Affiliated Agent" },
  individual_partner: { color: "orange", label: "Individual Partner" },
  admin: { color: "orange", label: "Admin" },
};

const PARTNER_STATUSES = Object.keys(PARTNER_STATUS_CFG);
const ADMIN_STATUSES = Object.keys(ADMIN_STATUS_CFG);
const SOURCES = Object.keys(SOURCE_CFG);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
const cap = (s) => s ? s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";

const INIT_FILTERS = { search: "", source: "", status: "", fromDate: "", toDate: "", agentId: "" };

const VaultAgentLeadList = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const rawRole = user?.role;
  const roleCode = rawRole ? (typeof rawRole === "object" ? Number(rawRole.code) : Number(rawRole)) : 18;
  const roleSlug = roleSlugMap[roleCode] ?? "vault-admin";
  const isAdmin = roleCode === 18;
  const isPartner = roleCode === 21;

  // agentType may not be in JWT — resolve from API if missing
  const [agentType, setAgentType] = useState(user?.agentType ?? null);
  const [agentTypeResolving, setAgentTypeResolving] = useState(false);

  useEffect(() => {
    if (roleCode !== 22 || agentType !== null) return;
    setAgentTypeResolving(true);
    apiService
      .get("/profile/get-profile-data")
      .then((res) => setAgentType(res?.data?.agentType ?? "ReferralPartner"))
      .catch(() => setAgentType("ReferralPartner"))
      .finally(() => setAgentTypeResolving(false));
  }, [roleCode, agentType]);

  const isAffiliatedAgent = roleCode === 22 && agentType === "PartnerAffiliatedAgent";

  const [partnerAgents, setPartnerAgents] = useState([]);

  useEffect(() => {
    if (!isPartner) return;
    const fetchPartnerAgents = async () => {
      try {
        const res = await apiService.get("/vault/agent/partner/agents?limit=100");
        const list = res?.data?.data || res?.data || [];
        setPartnerAgents(list);
      } catch (err) {
        console.error("Failed to load partner agents", err);
      }
    };
    fetchPartnerAgents();
  }, [isPartner]);

  // Use appropriate endpoint based on role
  const leadsEndpoint =
    roleCode === 26 ? "/vault/lead/advisor/my-leads" :
    roleCode === 22 ? "/vault/lead/my-leads" :       // Both affiliated and referral use agent endpoint
    roleCode === 21 ? "/vault/lead/partner/get" :
    "/vault/lead/admin/all";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusCounts, setStatusCounts] = useState({});

  const [filters, setFilters] = useState(INIT_FILTERS);
  const [applied, setApplied] = useState(INIT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dateRange, setDateRange] = useState(null);

  // Status update modal (affiliated agents only)
  const [statusModal, setStatusModal]     = useState(false);
  const [statusTarget, setStatusTarget]   = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusNotes, setStatusNotes]     = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const activeCount = Object.entries(applied).filter(([, v]) => v !== "").length;

  const handleViewDetail = (id) => {
    if (!id) {
      message.warning("Lead ID not available");
      return;
    }
    if (isPartner) {
      navigate(`/dashboard/vaultpartner/vault/lead/${id}`);
    } else {
      navigate(`/dashboard/${roleSlug}/vault/lead/${id}`);
    }
  };

  const fetchLeads = useCallback(async (page, limit, f) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit });
      if (f.search) params.set("search", f.search);
      if (f.source) params.set("source", f.source);
      if (f.status) params.set("status", f.status);
      if (f.fromDate) params.set("fromDate", f.fromDate);
      if (f.toDate) params.set("toDate", f.toDate);
      if (f.agentId) {
        params.set("agentId", f.agentId);
        params.set("agent", f.agentId);
      }

      const res = await apiService.get(`${leadsEndpoint}?${params.toString()}`);
      const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      const total = res?.data?.total || res?.data?.totalItems || res?.data?.count || list.length;
      const counts = res?.data?.statusCounts || {};

      setData(list);
      setTotalItems(total);
      setStatusCounts(counts);
    } catch (err) {
      console.error("Fetch leads error:", err);
      message.error("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }, [leadsEndpoint]);

  useEffect(() => {
    setFilters(INIT_FILTERS);
    setApplied(INIT_FILTERS);
    setCurrentPage(1);
    fetchLeads(1, itemsPerPage, INIT_FILTERS);
  }, [itemsPerPage, fetchLeads]);

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setItemsPerPage(size);
    fetchLeads(page, size, applied);
  };

  const applyFilters = () => {
    setApplied(filters);
    setCurrentPage(1);
    fetchLeads(1, itemsPerPage, filters);
    setDrawerOpen(false);
  };

  const resetFilters = () => {
    setFilters(INIT_FILTERS);
    setApplied(INIT_FILTERS);
    setDateRange(null);
    setCurrentPage(1);
    fetchLeads(1, itemsPerPage, INIT_FILTERS);
    setDrawerOpen(false);
  };

  const quickStatus = (status) => {
    const f = { ...INIT_FILTERS, status };
    setFilters(f); setApplied(f);
    setCurrentPage(1);
    fetchLeads(1, itemsPerPage, f);
  };

  const handleDateRange = (dates) => {
    setDateRange(dates);
    setFilters((p) => ({
      ...p,
      fromDate: dates?.[0] ? dates[0].format("YYYY-MM-DD") : "",
      toDate: dates?.[1] ? dates[1].format("YYYY-MM-DD") : "",
    }));
  };

  const handleSearchEnter = () => {
    const f = { ...applied, search: filters.search };
    setApplied(f); setCurrentPage(1);
    fetchLeads(1, itemsPerPage, f);
  };

  // Navigate to eligibility check page
  const handleCheckEligibility = (leadId) => {
    navigate(`/dashboard/${roleSlug}/vault/lead/${leadId}/eligibility`);
  };

  // Statuses at or beyond Qualified — no more manual changes allowed
  const QUALIFIED_LOCK = ['Qualified', 'Application Opened', 'Bank Application', 'Pre-Approved',
    'Valuation', 'FOL Processed', 'FOL Issued', 'FOL Signed', 'Disbursed', 'Lost', 'Not Proceeding'];

  // Open status update modal
  const openStatusModal = (record) => {
    if (record?.conversionInfo?.convertedToApplication) {
      message.warning("Status is locked — an Application has already been created for this lead");
      return;
    }
    if (QUALIFIED_LOCK.includes(record?.currentStatus)) {
      message.warning("Lead is locked after qualification — create an Application to continue");
      return;
    }
    setStatusTarget(record);
    setSelectedStatus("");
    setStatusNotes("");
    setStatusModal(true);
  };

  // Submit status update
  const handleStatusUpdate = async () => {
    if (!statusTarget?._id || !selectedStatus) {
      message.error("Please select a status");
      return;
    }
    setStatusLoading(true);
    try {
      await apiService.put(
        `/vault/lead/advisorOrpartner/lead/${statusTarget._id}/status`,
        { status: selectedStatus, notes: statusNotes.trim() || undefined }
      );
      message.success(`Status updated to "${selectedStatus}"`);
      setStatusModal(false);
      setStatusTarget(null);
      setStatusNotes("");
      fetchLeads(currentPage, itemsPerPage, applied);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  // Partner-specific columns (No advisor/SLA columns)
  const partnerColumns = [
    {
      key: "customerInfo",
      title: "Client",
      width: 220,
      render: (_, r) => {
        const ci = r?.customerInfo || {};
        return (
          <div>
            <div style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>{ci.fullName || "—"}</div>
            {ci.email && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{ci.email}</div>}
            {ci.mobileNumber && <div style={{ fontSize: 11, color: "#6B7280" }}>{ci.mobileNumber}</div>}
          </div>
        );
      },
    },
    {
      key: "currentStatus",
      title: "Status",
      width: 180,
      filterable: true,
      filterKey: "status",
      filterOptions: PARTNER_STATUSES.map((s) => ({ value: s, label: s })),
      render: (_, r) => {
        const val = r?.currentStatus;
        if (!val) return <span style={{ color: "#D1D5DB" }}>—</span>;
        const cfg = PARTNER_STATUS_CFG[val] || { bg: "#F3F4F6", text: "#374151", icon: <FileTextOutlined /> };
        return (
          <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.text, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 }}>
            {cfg.icon} {val}
          </span>
        );
      },
    },
    // {
    //   key: "source",
    //   title: "Source",
    //   width: 130,
    //   render: (_, r) => {
    //     const src = r?.sourceInfo?.source;
    //     if (!src) return <span style={{ color: "#D1D5DB" }}>—</span>;
    //     const cfg = SOURCE_CFG[src] || { color: "default", label: cap(src) };
    //     return <Tag color={cfg.color} style={{ borderRadius: 20, fontWeight: 500 }}>{cfg.label}</Tag>;
    //   },
    // },
    {
      key: "createdBy",
      title: "Created By",
      width: 140,
      render: (_, r) => {
        const si = r?.sourceInfo || {};
        return si.createdByName ? (
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{si.createdByName}</div>
            {si.createdByRole && <div style={{ fontSize: 10, color: "#9CA3AF" }}>{cap(si.createdByRole)}</div>}
          </div>
        ) : <span style={{ color: "#D1D5DB" }}>—</span>;
      },
    },
    {
      key: "eligibility",
      title: "Eligibility",
      width: 100,
      render: (_, r) => {
        const elig = r?.eligibility;
        if (!elig?.checked) return <Tag color="default">Not Checked</Tag>;
        return (
          <Tag color={elig.isEligible ? "success" : "error"} style={{ borderRadius: 20 }}>
            {elig.isEligible ? "Eligible" : "Not Eligible"}
          </Tag>
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
      width: 380,
      align: "center",
      render: (_, r) => {
        const leadId        = r?._id || r?.leadId;
        const status        = r?.currentStatus;
        const caseCreated   = r?.conversionInfo?.convertedToApplication === true;
        const qualifiedLocked = QUALIFIED_LOCK.includes(status);
        const isLocked      = caseCreated || qualifiedLocked;
        const canCreateCase = status === "Qualified" && !caseCreated;
        const elig          = r?.eligibility || {};

        // Statuses available to move to from current
        const availableStatuses = isLocked ? [] :
          ["New", "Assigned"].includes(status) ? ["Contacted"] :
          MANUAL_STATUS_OPTIONS.filter(s => s !== status);

        return (
          <Space size={4} wrap>
            {/* View */}
            <Tooltip title="View Details">
              <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(leadId)} style={{ color: P }} size="small">
                View
              </Button>
            </Tooltip>

            {/* Check Eligibility — affiliated agents only */}
            {isAffiliatedAgent && (
              <Tooltip title={
                !elig.checked ? "Run eligibility check (DBR)"
                : elig.isEligible ? "Eligible ✓ — re-check"
                : "Not eligible ✗ — re-check"
              }>
                <Button
                  size="small"
                  icon={<CalculatorOutlined />}
                  onClick={() => handleCheckEligibility(leadId)}
                  style={{
                    borderRadius: 6, fontSize: 11, fontWeight: 600, color: "white",
                    background:  !elig.checked ? "#F59E0B" : elig.isEligible ? "#10B981" : "#EF4444",
                    borderColor: !elig.checked ? "#F59E0B" : elig.isEligible ? "#10B981" : "#EF4444",
                  }}
                >
                  {!elig.checked ? "Check Eligibility" : elig.isEligible ? "✓ Eligible" : "✗ Not Eligible"}
                </Button>
              </Tooltip>
            )}

            {/* Update Status — affiliated agents only, non-locked leads */}
            {isAffiliatedAgent && !isLocked && availableStatuses.length > 0 && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => openStatusModal(r)}
                style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, color: P, borderColor: "#E9D5FF", background: "#F5F0FF" }}
              >
                Update Status
              </Button>
            )}

            {/* Locked badge */}
            {isAffiliatedAgent && isLocked && (
              <Tooltip title={caseCreated ? "Application created — status is auto-managed by the application workflow" : "Lead is Qualified — create an Application to continue"}>
                <span style={{ fontSize: 10, fontWeight: 600, color: caseCreated ? "#2563eb" : "#059669", background: caseCreated ? "#eff6ff" : "#ecfdf5", border: `1px solid ${caseCreated ? "#bfdbfe" : "#a7f3d0"}`, borderRadius: 6, padding: "3px 8px" }}>
                  {caseCreated ? "🔒 Application Created" : "🔒 Qualified"}
                </span>
              </Tooltip>
            )}

            {/* Create Proposal / Application — only when Qualified and no application yet */}
            {canCreateCase && (
              <>
                <Button
                  size="small"
                  onClick={() => navigate(`/dashboard/${roleSlug}/proposals/create?leadId=${leadId}`)}
                  style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#7c3aed", borderColor: "#ddd6fe", background: "#faf5ff" }}
                >
                  Proposal
                </Button>
                <Button
                  size="small"
                  onClick={() => navigate(`/dashboard/${roleSlug}/case/create?leadId=${leadId}`)}
                  style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#2563eb", borderColor: "#bfdbfe", background: "#eff6ff" }}
                >
                  Application
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  // Admin/Advisor columns (Full workflow with advisor/SLA)
  const adminColumns = [
    {
      key: "customerInfo",
      title: "Client",
      width: 220,
      render: (_, r) => {
        const ci = r?.customerInfo || {};
        return (
          <div>
            <div style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>{ci.fullName || "—"}</div>
            {ci.email && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{ci.email}</div>}
            {ci.mobileNumber && <div style={{ fontSize: 11, color: "#6B7280" }}>{ci.mobileNumber}</div>}
          </div>
        );
      },
    },
    {
      key: "assignedAdvisor",
      title: "Assigned Advisor",
      width: 200,
      render: (_, r) => {
        const assigned = r?.assignedTo;
        if (assigned?.advisorId) {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar size={32} icon={<UserOutlined />} style={{ background: PL, color: P }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{assigned.advisorName || "Assigned"}</div>
                {assigned.assignedAt && (
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>Since: {fmtDate(assigned.assignedAt)}</div>
                )}
              </div>
            </div>
          );
        }
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar size={32} icon={<UserOutlined />} style={{ background: "#FEF3C7", color: "#D97706" }} />
            <div>
              <div style={{ fontSize: 12, color: "#D97706", fontWeight: 600 }}>Unassigned</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "currentStatus",
      title: "Status",
      width: 180,
      filterable: true,
      filterKey: "status",
      filterOptions: ADMIN_STATUSES.map((s) => ({ value: s, label: s })),
      render: (_, r) => {
        const val = r?.currentStatus;
        if (!val) return <span style={{ color: "#D1D5DB" }}>—</span>;
        const cfg = ADMIN_STATUS_CFG[val] || { bg: "#F3F4F6", text: "#374151", icon: <FileTextOutlined /> };
        return (
          <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.text, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 }}>
            {cfg.icon} {val}
          </span>
        );
      },
    },
    {
      key: "source",
      title: "Source",
      width: 130,
      filterable: true,
      filterOptions: SOURCES.map((s) => ({ value: s, label: SOURCE_CFG[s]?.label || s })),
      render: (_, r) => {
        const src = r?.sourceInfo?.source;
        if (!src) return <span style={{ color: "#D1D5DB" }}>—</span>;
        const cfg = SOURCE_CFG[src] || { color: "default", label: cap(src) };
        return <Tag color={cfg.color} style={{ borderRadius: 20, fontWeight: 500 }}>{cfg.label}</Tag>;
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
      width: 260,
      align: "center",
      render: (_, r) => {
        const leadId = r?._id || r?.leadId;
        const isQualified = r?.currentStatus === "Qualified";
        return (
          <Space size={4}>
            <Tooltip title="View Details">
              <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(leadId)} style={{ color: P }} size="small">
                View
              </Button>
            </Tooltip>
            {isQualified && (
              <>
                <Button
                  size="small"
                  onClick={() => navigate(`/dashboard/${roleSlug}/proposals/create?leadId=${leadId}`)}
                  style={{
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#7c3aed",
                    borderColor: "#ddd6fe",
                    background: "#faf5ff",
                  }}
                >
                  Create Proposal
                </Button>
                <Button
                  size="small"
                  onClick={() => navigate(`/dashboard/${roleSlug}/case/create?leadId=${leadId}`)}
                  style={{
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#2563eb",
                    borderColor: "#bfdbfe",
                    background: "#eff6ff",
                  }}
                >
                  Create Application
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  // Affiliated agents get the partner-style UI (their own leads, with proposal/case buttons)
  const usePartnerUI = isPartner || isAffiliatedAgent;
  const columns = usePartnerUI ? partnerColumns : adminColumns;
  const statusConfig = usePartnerUI ? PARTNER_STATUS_CFG : ADMIN_STATUS_CFG;
  const statusList = usePartnerUI ? PARTNER_STATUSES : ADMIN_STATUSES;

  // Use status counts from API or calculate from data
  const getStatusCount = (status) => {
    if (statusCounts[status] !== undefined) return statusCounts[status];
    return data.filter(l => l.currentStatus === status).length;
  };

  if (agentTypeResolving) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ background: "#F4F0FA", minHeight: "100vh", padding: "28px 24px", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .vll-input .ant-input, .vll-select .ant-select-selector { border-radius: 10px !important; border-color: #E8DFF5 !important; font-size: 13px; }
        .vll-pill { cursor: pointer; border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 500; border: 1.5px solid transparent; transition: all .15s; display: inline-flex; align-items: center; gap: 6px; }
        .vll-pill:hover { border-color: ${P}; }
        .vll-pill.active { background: ${PL}; border-color: ${P}; color: ${P}; }
        .vll-table .ant-table-thead > tr > th { background: #FAF8FF !important; color: ${P} !important; font-weight: 700 !important; border-bottom: 1px solid #EDE4FF !important; font-size: 12px !important; }
        .vll-table .ant-table-tbody > tr:hover > td { background: #F5F0FF !important; }
        .vll-table .ant-table-tbody > tr > td { border-bottom: 1px solid #F5F0FF; }
        .vll-table .ant-pagination-item-active { border-color: ${P} !important; background: ${P} !important; }
        .vll-table .ant-pagination-item-active a { color: white !important; }
        .vll-drawer .ant-drawer-header { background: linear-gradient(135deg, #2D0058, #5B1AA0); }
        .vll-drawer .ant-drawer-title { color: white !important; font-weight: 700 !important; }
        .vll-drawer .ant-drawer-close { color: rgba(255,255,255,0.8) !important; }
        .vll-stat { transition: all .2s; }
        .vll-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(92,3,155,0.1) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a0533", margin: 0 }}>{isPartner ? "My Partner Leads" : isAffiliatedAgent ? "My Leads" : "All Leads"}</h1>
          <p style={{ fontSize: 13, color: "#8B7BAE", margin: "3px 0 0" }}>
            {loading ? "loading..." : `${totalItems.toLocaleString()} lead${totalItems !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Button icon={<ReloadOutlined />} onClick={() => fetchLeads(currentPage, itemsPerPage, applied)} loading={loading} style={{ borderRadius: 10, borderColor: "#E8DFF5", color: P }} />
          <Badge count={activeCount} color={P} size="small">
            <Button
              icon={<FilterOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{
                borderRadius: 10,
                background: activeCount > 0 ? PL : "white",
                borderColor: activeCount > 0 ? P : "#E8DFF5",
                color: activeCount > 0 ? P : "#374151",
                fontWeight: activeCount > 0 ? 700 : 400,
              }}
            >
              Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </Button>
          </Badge>
          {activeCount > 0 && (
            <Button icon={<ClearOutlined />} onClick={resetFilters} style={{ borderRadius: 10, borderColor: "#FECACA", color: "#DC2626", background: "#FEF2F2" }}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${usePartnerUI ? 6 : 5}, 1fr)`, gap: 12, marginBottom: 18 }}>
        <div className="vll-stat" style={{ background: "white", borderRadius: 14, padding: "14px 18px", border: "1px solid #EDE9F6" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>Total Leads</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: P, lineHeight: 1 }}>{totalItems}</div>
        </div>
        <div className="vll-stat" style={{ background: "white", borderRadius: 14, padding: "14px 18px", border: "1px solid #EDE9F6" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>Contacted</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#C2410C", lineHeight: 1 }}>{getStatusCount("Contacted")}</div>
        </div>
        <div className="vll-stat" style={{ background: "white", borderRadius: 14, padding: "14px 18px", border: "1px solid #EDE9F6" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>Qualified</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#4338CA", lineHeight: 1 }}>{getStatusCount("Qualified")}</div>
        </div>
        <div className="vll-stat" style={{ background: "white", borderRadius: 14, padding: "14px 18px", border: "1px solid #EDE9F6" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>Documents</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#166534", lineHeight: 1 }}>{getStatusCount("Collecting Documents") + getStatusCount("Documents Complete")}</div>
        </div>
        <div className="vll-stat" style={{ background: "white", borderRadius: 14, padding: "14px 18px", border: "1px solid #EDE9F6" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>Application</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#C2410C", lineHeight: 1 }}>{getStatusCount("Application Opened")}</div>
        </div>
        <div className="vll-stat" style={{ background: "white", borderRadius: 14, padding: "14px 18px", border: "1px solid #EDE9F6" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>Disbursed</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#065F46", lineHeight: 1 }}>{getStatusCount("Disbursed")}</div>
        </div>
      </div>


      {/* Table */}
      <div className="vll-table" style={{ background: "white", borderRadius: 16, border: "1px solid #EDE9F6", overflow: "hidden" }}>
        <CustomTable
          columns={columns}
          data={data}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          showSearch={true}
          onFilter={(tblFilters) => {
            const newFilters = {
              ...filters,
              search: tblFilters.search !== undefined ? tblFilters.search : filters.search,
              status: tblFilters.status !== undefined ? tblFilters.status : filters.status,
              source: tblFilters.source !== undefined ? tblFilters.source : filters.source,
            };
            setFilters(newFilters);
            setApplied(newFilters);
            setCurrentPage(1);
            fetchLeads(1, itemsPerPage, newFilters);
          }}
        />
      </div>

      {/* Filter Drawer */}
      <Drawer
        className="vll-drawer"
        title="Advanced Filters"
        placement="right"
        width={360}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button size="small" onClick={resetFilters} style={{ color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2" }}>
            Reset All
          </Button>
        }
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button onClick={() => setDrawerOpen(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button type="primary" onClick={applyFilters} style={{ flex: 2, background: `linear-gradient(135deg, #2D0058, ${PM})`, border: "none" }}>
              Apply Filters {activeCount > 0 ? `(${activeCount})` : ""}
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600, color: "#6B21A8" }}>Search</div>
            <Input placeholder="Name, email, or phone..." value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
          </div>
          {/* <div>
            <div style={{ marginBottom: 8, fontWeight: 600, color: "#6B21A8" }}>Lead Source</div>
            <Select style={{ width: "100%" }} placeholder="All Sources" value={filters.source || undefined} onChange={(v) => setFilters((p) => ({ ...p, source: v || "" }))} allowClear>
              {SOURCES.map((s) => <Option key={s} value={s}>{SOURCE_CFG[s]?.label || s}</Option>)}
            </Select>
          </div> */}
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600, color: "#6B21A8" }}>Lead Status</div>
            <Select style={{ width: "100%" }} placeholder="All Statuses" value={filters.status || undefined} onChange={(v) => setFilters((p) => ({ ...p, status: v || "" }))} allowClear>
              {statusList.map((s) => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </div>
          {isPartner && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600, color: "#6B21A8" }}>Affiliated Agent</div>
              <Select
                style={{ width: "100%" }}
                placeholder="All Affiliated Agents"
                value={filters.agentId || undefined}
                onChange={(v) => setFilters((p) => ({ ...p, agentId: v || "" }))}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {partnerAgents.map((ag) => {
                  const agentName = ag.fullName || `${ag.firstName || ""} ${ag.lastName || ""}`.trim() || ag.email;
                  return (
                    <Option key={ag._id || ag.id} value={ag._id || ag.id}>
                      {agentName}
                    </Option>
                  );
                })}
              </Select>
            </div>
          )}
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600, color: "#6B21A8" }}>Date Range</div>
            <RangePicker style={{ width: "100%" }} value={dateRange} onChange={handleDateRange} />
          </div>
        </div>
      </Drawer>

      {/* ── Status Update Modal (PartnerAffiliatedAgent only) ─────────── */}
      {isAffiliatedAgent && (
        <Modal
          open={statusModal}
          onCancel={() => !statusLoading && setStatusModal(false)}
          title={
            <div>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Update Lead Status</span>
              {statusTarget && (
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                  {statusTarget?.customerInfo?.fullName ||
                   `${statusTarget?.customerInfo?.firstName || ""} ${statusTarget?.customerInfo?.lastName || ""}`.trim() || "—"}
                </div>
              )}
            </div>
          }
          footer={[
            <Button key="cancel" onClick={() => setStatusModal(false)} disabled={statusLoading}>Cancel</Button>,
            <Button
              key="submit"
              type="primary"
              loading={statusLoading}
              disabled={!selectedStatus}
              onClick={handleStatusUpdate}
              style={{ background: P, borderColor: P }}
            >
              Confirm{selectedStatus ? ` — ${selectedStatus}` : ""}
            </Button>,
          ]}
          centered
          width={520}
        >
          {/* Current status */}
          <div style={{ background: "#F9F6FF", borderRadius: 12, padding: 14, marginBottom: 18, border: "1px solid #E9D5FF" }}>
            <div style={{ fontSize: 12 }}>
              <strong>Current Status:</strong> {statusTarget?.currentStatus || "—"}
            </div>
          </div>

          {/* Status selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: P }}>Select New Status</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Choose a status..."
              value={selectedStatus || undefined}
              onChange={(v) => setSelectedStatus(v)}
              size="large"
            >
              {(["New", "Assigned"].includes(statusTarget?.currentStatus)
                ? ["Contacted"]
                : MANUAL_STATUS_OPTIONS.filter(s => s !== statusTarget?.currentStatus)
              ).map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </div>

          {/* Eligibility warning when choosing Qualified */}
          {selectedStatus === "Qualified" && (
            <div style={{
              background: statusTarget?.eligibility?.isEligible ? "#F0FDF4" : "#FEF2F2",
              borderRadius: 10, padding: 12, marginBottom: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {statusTarget?.eligibility?.isEligible
                  ? <CheckCircleOutlined style={{ color: "#10B981" }} />
                  : <CloseCircleOutlined style={{ color: "#EF4444" }} />}
                <span style={{ color: statusTarget?.eligibility?.isEligible ? "#065F46" : "#991B1B", fontSize: 12 }}>
                  {statusTarget?.eligibility?.isEligible
                    ? "Customer passed eligibility check ✅"
                    : "Customer has NOT passed eligibility — run eligibility check first"}
                </span>
              </div>
            </div>
          )}

          <TextArea
            rows={3}
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            placeholder="Notes about this status change..."
            maxLength={500}
            showCount
            style={{ borderRadius: 10 }}
          />
        </Modal>
      )}
    </div>
  );
};

export default VaultAgentLeadList;