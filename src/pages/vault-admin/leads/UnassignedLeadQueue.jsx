// src/pages/vault-admin/leads/UnassignedLeadQueue.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Button, Tag, message, Space, DatePicker, Select, Input, Tooltip, Badge, Drawer, Modal, Avatar, Alert } from "antd";
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
  StarOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  CloseOutlined,
  DollarOutlined,
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
  Qualified: { color: "geekblue", bg: "#EEF2FF", text: "#4338CA", icon: <StarOutlined /> },
  "Collecting Documents":  { color: "green",   bg: "#F0FDF4", text: "#166534", icon: <FileTextOutlined /> },
  "Documents Complete":    { color: "cyan",    bg: "#ECFEFF", text: "#0E7490", icon: <CheckCircleOutlined /> },
  "Documents Complete": { color: "cyan", bg: "#ECFEFF", text: "#0E7490", icon: <CheckCircleOutlined /> },
  "Application Opened": { color: "volcano", bg: "#FFF5F3", text: "#C2410C", icon: <FolderOpenOutlined /> },
  "Not Proceeding": { color: "red", bg: "#FEF2F2", text: "#B91C1C", icon: <CloseOutlined /> },
  Disbursed: { color: "success", bg: "#ECFDF5", text: "#065F46", icon: <DollarOutlined /> },
};

const SOURCE_CFG = {
  website: { color: "blue", label: "Website" },
  freelance_agent: { color: "purple", label: "Referral Partner" },
  partner: { color: "green", label: "Partner" },
  admin: { color: "orange", label: "Admin" },
};

const STATUSES = Object.keys(STATUS_CFG);
const SOURCES = Object.keys(SOURCE_CFG);

const fmt = (n) => (n ? Number(n).toLocaleString("en-AE") : "—");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
const cap = (s) => s ? s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";

const BUSINESS_HOURS_SLA_MS = 4 * 60 * 60 * 1000;

const checkSLABreach = (assignedAt, currentStatus) => {
  if (!assignedAt || currentStatus === "Contacted" || currentStatus === "Disbursed" || currentStatus === "Not Proceeding") {
    return false;
  }
  return (new Date() - new Date(assignedAt)) > BUSINESS_HOURS_SLA_MS;
};

const getSLADetails = (assignedAt, currentStatus, slaDeadline, firstContactAt) => {
  if (!assignedAt || currentStatus === "Contacted") {
    return { breached: false, status: "completed", message: "✔ SLA Met", color: "#10B981" };
  }
  const now = new Date();
  const deadline = slaDeadline ? new Date(slaDeadline) : new Date(new Date(assignedAt).getTime() + BUSINESS_HOURS_SLA_MS);
  const remaining = deadline - now;
  const isBreached = remaining < 0;
  const totalMinutes = Math.floor(Math.abs(remaining) / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (isBreached) return { breached: true, status: "breached", message: `Breached by ${hours}h ${minutes}m`, color: "#EF4444", hoursOverdue: hours, minutesOverdue: minutes };
  if (remaining < 30 * 60 * 1000) return { breached: false, status: "urgent", message: `${hours}h ${minutes}m left`, color: "#F59E0B", hoursRemaining: hours, minutesRemaining: minutes };
  return { breached: false, status: "on_track", message: `${hours}h ${minutes}m left`, color: "#6B7280", hoursRemaining: hours, minutesRemaining: minutes };
};

const getResponseTime = (assignedAt, firstContactAt) => {
  if (!assignedAt || !firstContactAt) return null;
  const ms = new Date(firstContactAt) - new Date(assignedAt);
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
};

const getSLAProgressPercent = (assignedAt, slaDeadline) => {
  if (!assignedAt) return 0;
  const start = new Date(assignedAt).getTime();
  const end = slaDeadline ? new Date(slaDeadline).getTime() : start + BUSINESS_HOURS_SLA_MS;
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
};

const INIT_FILTERS = { search: "", source: "", status: "", agentId: "", advisorId: "", fromDate: "", toDate: "" };

const UnassignedLeadQueue = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const rawRole = user?.role;
  const roleCode = rawRole ? (typeof rawRole === "object" ? Number(rawRole.code) : Number(rawRole)) : 18;
  const roleSlug = roleSlugMap[roleCode] ?? "vault-admin";
  const isAdmin = roleCode === 18;

  const leadsEndpoint = "/vault/lead/admin/all";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [breachedCount, setBreachedCount] = useState(0);

  const [filters, setFilters] = useState(INIT_FILTERS);
  const [applied, setApplied] = useState(INIT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dateRange, setDateRange] = useState(null);

  const [advisors, setAdvisors] = useState([]);

  const [assignModal, setAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [batchAssignMode, setBatchAssignMode] = useState(false);

  const [notifyModal, setNotifyModal] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const activeCount = Object.entries(applied).filter(([, v]) => v !== "").length;

  const handleViewDetail = (id) => {
    if (id) navigate(`/dashboard/${roleSlug}/vault/lead/${id}`);
    else message.warning("Lead ID not available");
  };

  const fetchLeads = useCallback(async (page, limit, f) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit });
      if (f.search) params.set("search", f.search);
      if (f.source) params.set("source", f.source);
      if (f.status) params.set("status", f.status);
      if (f.agentId) params.set("agentId", f.agentId);
      if (f.advisorId) params.set("advisorId", f.advisorId);
      if (f.fromDate) params.set("fromDate", f.fromDate);
      if (f.toDate) params.set("toDate", f.toDate);
      params.set("not_contacted", "true");

      const res = await apiService.get(`${leadsEndpoint}?${params.toString()}`);
      const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      const total = res?.data?.total || res?.data?.totalItems || res?.data?.count || list.length;

      const breached = list.filter(
        (l) => l.assignedTo?.advisorId && l.currentStatus !== "Contacted" && l.currentStatus !== "Disbursed" && checkSLABreach(l.assignedTo?.assignedAt, l.currentStatus)
      );
      setBreachedCount(breached.length);
      setData(list);
      setTotalItems(total);
    } catch {
      message.error("Failed to load unassigned leads.");
    } finally {
      setLoading(false);
    }
  }, [leadsEndpoint]);

  useEffect(() => {
    setFilters(INIT_FILTERS);
    setApplied(INIT_FILTERS);
    setCurrentPage(1);
    setSelectedLeadIds([]);
    fetchLeads(1, itemsPerPage, INIT_FILTERS);
  }, [itemsPerPage, fetchLeads]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (data.some((l) => l.assignedTo?.advisorId && l.currentStatus !== "Contacted")) {
        fetchLeads(currentPage, itemsPerPage, applied);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [data, currentPage, itemsPerPage, applied, fetchLeads]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      try {
        const [advRes] = await Promise.all([apiService.get("/vault/advisor/workload?limit=100")]);
        const advList = advRes?.data?.data || advRes?.data || [];
        setAdvisors(
          advList.map((a) => ({
            id: a.advisorId,
            fullName: a.advisorName || a.email || "Advisor",
            email: a.email,
            workload: a.workload || {},
            remainingCapacity: a.workload?.remainingCapacity,
            maxLeadsCapacity: a.workload?.maxCapacity,
            currentLeads: a.workload?.currentLeads,
            utilizationPct: a.workload?.utilization,
            canTakeMore: a.workload?.canTakeMore,
            slaComplianceRate: a.performance?.slaComplianceRate,
          }))
        );
      } catch {}
    };
    load();
  }, [isAdmin]);

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
    setSelectedLeadIds([]);
    fetchLeads(1, itemsPerPage, INIT_FILTERS);
    setDrawerOpen(false);
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
    setApplied(f);
    setCurrentPage(1);
    fetchLeads(1, itemsPerPage, f);
  };

  const openAssign = (record) => {
    const leadId = record?._id || record?.leadId;
    const clientName = record?.customerInfo?.fullName || "this lead";
    setBatchAssignMode(false);
    setAssignTarget({ leadId, clientName });
    setSelectedAdvisor(record?.assignedTo?.advisorId || null);
    setAssignModal(true);
  };

  const openBatchAssign = () => {
    if (!selectedLeadIds.length) { message.warning("Select at least one lead to assign."); return; }
    setBatchAssignMode(true);
    setAssignTarget({ leadIds: selectedLeadIds, clientName: `${selectedLeadIds.length} selected lead${selectedLeadIds.length > 1 ? "s" : ""}` });
    setSelectedAdvisor(null);
    setAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedAdvisor) { message.warning("Please select an advisor first"); return; }
    setAssignLoading(true);
    try {
      const payload = batchAssignMode
        ? { leadIds: assignTarget.leadIds, advisorId: selectedAdvisor }
        : { leadId: assignTarget.leadId, advisorId: selectedAdvisor };
      await apiService.post("/vault/lead/admin/assign-to-advisor", payload);
      message.success(batchAssignMode ? `Assigned ${assignTarget.leadIds.length} lead(s) successfully!` : "Lead assigned! SLA timer started.");
      setAssignModal(false);
      setSelectedAdvisor(null);
      setAssignTarget(null);
      setBatchAssignMode(false);
      if (batchAssignMode) setSelectedLeadIds([]);
      fetchLeads(currentPage, itemsPerPage, applied);
    } catch (err) {
      message.error(err?.response?.data?.message || "Assignment failed");
    } finally {
      setAssignLoading(false);
    }
  };

  const openNotifyAdvisor = (record) => {
    setNotifyTarget({
      leadId: record?._id || record?.leadId,
      clientName: record?.customerInfo?.fullName || "this lead",
      advisorName: record?.assignedTo?.advisorName || "assigned advisor",
    });
    setNotifyModal(true);
  };

  const handleNotifyAdvisor = async () => {
    setNotifyLoading(true);
    try {
      await apiService.post("/vault/lead/admin/notify-advisor-sla", { leadId: notifyTarget.leadId });
      message.success("SLA reminder sent to advisor!");
      setNotifyModal(false);
      setNotifyTarget(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to send notification");
    } finally {
      setNotifyLoading(false);
    }
  };

  const columns = [
    {
      key: "select",
      title: isAdmin ? (() => {
        const pageIds = data.map((r) => r._id || r.leadId).filter(Boolean);
        const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedLeadIds.includes(id));
        return (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => {
              if (e.target.checked) setSelectedLeadIds(Array.from(new Set([...selectedLeadIds, ...pageIds])));
              else setSelectedLeadIds(selectedLeadIds.filter((id) => !pageIds.includes(id)));
            }}
            aria-label="Select all"
          />
        );
      })() : null,
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
                ? Array.from(new Set([...selectedLeadIds, leadId]))
                : selectedLeadIds.filter((id) => id !== leadId)
              )
            }
            aria-label={`Select lead ${leadId}`}
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
              <Button type="link" size="small" onClick={() => openAssign(r)} style={{ padding: 0, fontSize: 10, color: P }}>
                Click to assign
              </Button>
            </div>
          </div>
        );
      },
    },
    {
      key: "slaStatus",
      title: "SLA Status",
      width: 180,
      render: (_, r) => {
        const assigned = r?.assignedTo;
        const sla = r?.sla || {};
        if (!assigned?.advisorId) {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ClockCircleOutlined style={{ color: "#9CA3AF", fontSize: 12 }} />
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>Awaiting assignment</span>
            </div>
          );
        }
        const slaInfo = getSLADetails(assigned.assignedAt, r?.currentStatus, sla?.deadline, sla?.firstContactAt);
        const pct = getSLAProgressPercent(assigned.assignedAt, sla?.deadline);
        if (slaInfo.breached) {
          return (
            <Tooltip title={`SLA Breached! ${slaInfo.hoursOverdue}h ${slaInfo.minutesOverdue}m overdue`}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <WarningOutlined style={{ color: "#EF4444", fontSize: 14 }} />
                  <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 600 }}>BREACHED</span>
                  <span style={{ fontSize: 10, color: "#9CA3AF" }}>by {slaInfo.hoursOverdue}h {slaInfo.minutesOverdue}m</span>
                </div>
                <div style={{ background: "#FEE2E2", borderRadius: 99, height: 3, marginTop: 4 }}>
                  <div style={{ width: "100%", background: "#EF4444", height: "100%", borderRadius: 99 }} />
                </div>
              </div>
            </Tooltip>
          );
        }
        if (slaInfo.status === "urgent") {
          return (
            <Tooltip title={`URGENT: ${slaInfo.hoursRemaining}h ${slaInfo.minutesRemaining}m left`}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ClockCircleOutlined style={{ color: "#F59E0B", fontSize: 14 }} />
                  <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600 }}>URGENT</span>
                  <span style={{ fontSize: 10, color: "#D97706" }}>{slaInfo.message}</span>
                </div>
                <div style={{ background: "#FEF3C7", borderRadius: 99, height: 3, marginTop: 4 }}>
                  <div style={{ width: `${pct}%`, background: "#F59E0B", height: "100%", borderRadius: 99 }} />
                </div>
              </div>
            </Tooltip>
          );
        }
        return (
          <Tooltip title={`SLA: ${slaInfo.message}`}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ClockCircleOutlined style={{ color: "#6B7280", fontSize: 12 }} />
                <span style={{ fontSize: 11, color: "#6B7280" }}>{slaInfo.message}</span>
              </div>
              <div style={{ background: "#E5E7EB", borderRadius: 99, height: 3, marginTop: 4 }}>
                <div style={{ width: `${pct}%`, background: "#6B7280", height: "100%", borderRadius: 99 }} />
              </div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      key: "currentStatus",
      title: "Status",
      width: 160,
      render: (_, r) => {
        const val = r?.currentStatus;
        if (!val) return <span style={{ color: "#D1D5DB" }}>—</span>;
        const cfg = STATUS_CFG[val] || { bg: "#F3F4F6", text: "#374151", icon: <FileTextOutlined /> };
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
      width: 240,
      align: "center",
      render: (_, r) => {
        const leadId = r?._id || r?.leadId;
        const hasAdvisor = !!r?.assignedTo?.advisorId;
        const isSLABreached = hasAdvisor && r?.currentStatus !== "Contacted" && checkSLABreach(r?.assignedTo?.assignedAt, r?.currentStatus);
        return (
          <Space size={4} wrap>
            <Tooltip title="View Details">
              <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(leadId)} style={{ color: P }} size="small">
                View
              </Button>
            </Tooltip>
            <Tooltip title={hasAdvisor ? "Reassign Advisor" : "Assign Advisor"}>
              <Button
                size="small"
                icon={<UserAddOutlined />}
                onClick={() => openAssign(r)}
                style={{
                  borderRadius: 6, fontSize: 11, fontWeight: 600,
                  color: hasAdvisor ? "#6D28D9" : P,
                  borderColor: hasAdvisor ? "#DDD6FE" : PB,
                  background: hasAdvisor ? "#F5F3FF" : PL,
                }}
              >
                {hasAdvisor ? "Reassign" : "Assign"}
              </Button>
            </Tooltip>
            {isSLABreached && (
              <Tooltip title="SLA Breached! Notify advisor immediately">
                <Button
                  size="small" danger icon={<BellOutlined />} onClick={() => openNotifyAdvisor(r)}
                  style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}
                >
                  Notify
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const unassignedCount = data.filter((l) => !l.assignedTo?.advisorId).length;
  const assignedPendingCount = data.filter((l) => l.assignedTo?.advisorId && l.currentStatus !== "Contacted").length;
  const atRiskCount = data.filter((l) => {
    if (!l.assignedTo?.advisorId || l.currentStatus === "Contacted") return false;
    const remaining = new Date(l.sla?.deadline) - new Date();
    return remaining > 0 && remaining < 30 * 60 * 1000;
  }).length;

  return (
    <div style={{ background: "#F4F0FA", minHeight: "100vh", padding: "28px 24px", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .ulq-input .ant-input, .ulq-select .ant-select-selector { border-radius: 10px !important; border-color: #E8DFF5 !important; font-size: 13px; }
        .ulq-pill { cursor: pointer; border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 500; border: 1.5px solid transparent; transition: all .15s; display: inline-flex; align-items: center; gap: 6px; }
        .ulq-pill:hover { border-color: ${P}; }
        .ulq-pill.active { background: ${PL}; border-color: ${P}; color: ${P}; }
        .ulq-table .ant-table-thead > tr > th { background: #FAF8FF !important; color: ${P} !important; font-weight: 700 !important; border-bottom: 1px solid #EDE4FF !important; font-size: 12px !important; }
        .ulq-table .ant-table-tbody > tr:hover > td { background: #F5F0FF !important; }
        .ulq-table .ant-table-tbody > tr > td { border-bottom: 1px solid #F5F0FF; }
        .ulq-table .ant-pagination-item-active { border-color: ${P} !important; background: ${P} !important; }
        .ulq-table .ant-pagination-item-active a { color: white !important; }
        .ulq-drawer .ant-drawer-header { background: linear-gradient(135deg, #2D0058, #5B1AA0); }
        .ulq-drawer .ant-drawer-title { color: white !important; font-weight: 700 !important; }
        .ulq-drawer .ant-drawer-close { color: rgba(255,255,255,0.8) !important; }
        .ulq-stat { transition: all .2s; }
        .ulq-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(92,3,155,0.1) !important; }
        .sla-slide { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {/* SLA Breach Banner */}
      {breachedCount > 0 && (
        <div className="sla-slide" style={{ marginBottom: 16 }}>
          <Alert
            message={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <WarningOutlined style={{ fontSize: 18, color: "#DC2626" }} />
                <span>
                  <strong>{breachedCount} lead{breachedCount !== 1 ? "s" : ""}</strong> {breachedCount !== 1 ? "have" : "has"} breached the 4-hour SLA contact window
                </span>
              </div>
            }
            description="Use the Notify button to send an urgent reminder to the assigned advisor."
            type="error"
            showIcon={false}
            style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12 }}
          />
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a0533", margin: 0 }}>Unassigned Lead Queue</h1>
          <p style={{ fontSize: 13, color: "#8B7BAE", margin: "3px 0 0" }}>
            New &amp; pending-contact leads — {loading ? "loading..." : `${totalItems.toLocaleString()} lead${totalItems !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {isAdmin && (
            <Button
              type="primary"
              disabled={selectedLeadIds.length === 0}
              onClick={openBatchAssign}
              icon={<TeamOutlined />}
              style={{ borderRadius: 10, background: "#4A027C", borderColor: "#4A027C" }}
            >
              Assign selected ({selectedLeadIds.length})
            </Button>
          )}
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

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 18 }}>
        <div className="ulq-stat" style={{ background: "white", borderRadius: 14, padding: "14px 18px", border: "1px solid #EDE9F6" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>In Queue</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: P, lineHeight: 1 }}>{totalItems}</div>
        </div>
        <div className="ulq-stat" style={{ background: "#FFFBEB", borderRadius: 14, padding: "14px 18px", border: "1px solid #FDE68A" }}>
          <div style={{ fontSize: 10, color: "#D97706", fontWeight: 700 }}>Unassigned</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#D97706", lineHeight: 1 }}>{unassignedCount}</div>
        </div>
        <div className="ulq-stat" style={{ background: "white", borderRadius: 14, padding: "14px 18px", border: "1px solid #EDE9F6" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>Assigned (Pending Contact)</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#6D28D9", lineHeight: 1 }}>{assignedPendingCount}</div>
        </div>
        <div className="ulq-stat" style={{ background: breachedCount > 0 ? "#FEF2F2" : "white", borderRadius: 14, padding: "14px 18px", border: `1px solid ${breachedCount > 0 ? "#FECACA" : "#EDE9F6"}` }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>SLA Breached</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#DC2626", lineHeight: 1 }}>{breachedCount}</div>
        </div>
        <div className="ulq-stat" style={{ background: atRiskCount > 0 ? "#FFFBEB" : "white", borderRadius: 14, padding: "14px 18px", border: `1px solid ${atRiskCount > 0 ? "#FDE68A" : "#EDE9F6"}` }}>
          <div style={{ fontSize: 10, color: "#D97706", fontWeight: 700 }}>At Risk (&lt;30 min)</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#F59E0B", lineHeight: 1 }}>{atRiskCount}</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #EDE9F6", padding: "14px 18px", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div className="ulq-input" style={{ flex: 1, minWidth: 220 }}>
            <Input
              prefix={<SearchOutlined style={{ color: P }} />}
              placeholder="Search name, email, phone..."
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              onPressEnter={handleSearchEnter}
              allowClear
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Status:</span>
            {["New", "Assigned"].map((s) => {
              const active = applied.status === s;
              const cfg = STATUS_CFG[s] || {};
              return (
                <span
                  key={s}
                  className={`ulq-pill${active ? " active" : ""}`}
                  style={active ? { background: cfg.bg, borderColor: cfg.text || P, color: cfg.text || P } : { background: "#F9F6FF", borderColor: "#EDE9F6", color: "#6B7280" }}
                  onClick={() => {
                    const f = active ? { ...applied, status: "" } : { ...applied, status: s };
                    setFilters(f); setApplied(f); setCurrentPage(1);
                    fetchLeads(1, itemsPerPage, f);
                  }}
                >
                  {cfg.icon} {s}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="ulq-table" style={{ background: "white", borderRadius: 16, border: "1px solid #EDE9F6", overflow: "hidden" }}>
        <CustomTable
          columns={columns}
          data={data}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          showSearch={false}
        />
      </div>

      {/* Filter Drawer */}
      <Drawer
        className="ulq-drawer"
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
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600, color: "#6B21A8" }}>Lead Source</div>
            <Select style={{ width: "100%" }} placeholder="All Sources" value={filters.source || undefined} onChange={(v) => setFilters((p) => ({ ...p, source: v || "" }))} allowClear>
              {SOURCES.map((s) => <Option key={s} value={s}>{SOURCE_CFG[s]?.label || s}</Option>)}
            </Select>
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600, color: "#6B21A8" }}>Lead Status</div>
            <Select style={{ width: "100%" }} placeholder="All Statuses" value={filters.status || undefined} onChange={(v) => setFilters((p) => ({ ...p, status: v || "" }))} allowClear>
              {["New", "Assigned"].map((s) => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600, color: "#6B21A8" }}>Assigned Advisor</div>
            <Select style={{ width: "100%" }} placeholder="Any Advisor" value={filters.advisorId || undefined} onChange={(v) => setFilters((p) => ({ ...p, advisorId: v || "" }))} allowClear showSearch>
              {advisors.map((a) => <Option key={a.id} value={a.id}>{a.fullName}</Option>)}
            </Select>
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600, color: "#6B21A8" }}>Date Range</div>
            <RangePicker style={{ width: "100%" }} value={dateRange} onChange={handleDateRange} />
          </div>
        </div>
      </Drawer>

      {/* Assign Modal */}
      <Modal
        open={assignModal}
        onCancel={() => { setAssignModal(false); setBatchAssignMode(false); setAssignTarget(null); setSelectedAdvisor(null); }}
        title={batchAssignMode ? `Assign ${assignTarget?.leadIds?.length} lead(s) to advisor` : "Assign to Advisor"}
        footer={[
          <Button key="cancel" onClick={() => { setAssignModal(false); setBatchAssignMode(false); setAssignTarget(null); setSelectedAdvisor(null); }}>Cancel</Button>,
          <Button key="assign" type="primary" loading={assignLoading} disabled={!selectedAdvisor} onClick={handleAssign} style={{ background: P }}>
            Confirm Assignment
          </Button>,
        ]}
        centered
      >
        <div style={{ background: "#F0FDF4", border: "1px solid #D1FAE5", borderRadius: 10, padding: "12px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ClockCircleOutlined style={{ color: "#059669" }} />
            <span style={{ fontSize: 12, color: "#065F46" }}>SLA Clock starts immediately — 4 hours to contact customer</span>
          </div>
        </div>
        <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Select Advisor</label>
        <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {advisors.map((adv) => {
            const isSelected = selectedAdvisor === adv.id;
            return (
              <div
                key={adv.id}
                onClick={() => setSelectedAdvisor(isSelected ? null : adv.id)}
                style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${isSelected ? P : "#e8dff5"}`, background: isSelected ? PL : "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
              >
                <Avatar icon={<UserOutlined />} style={{ background: P }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{adv.fullName}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6 }}>{adv.email}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11, color: "#4B5563" }}>
                    <span>{adv.currentLeads ?? 0}/{adv.maxLeadsCapacity ?? 0} leads</span>
                    <span>Remaining: {adv.remainingCapacity ?? 0}</span>
                    <span>{adv.utilizationPct != null ? `${adv.utilizationPct}%` : "-"} util</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                    <Tag color={adv.canTakeMore ? "success" : "orange"} style={{ borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>
                      {adv.canTakeMore ? "Can take more" : "At capacity"}
                    </Tag>
                    {adv.slaComplianceRate != null && (
                      <Tag color="default" style={{ borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>
                        SLA {adv.slaComplianceRate}%
                      </Tag>
                    )}
                  </div>
                </div>
                {isSelected && <CheckCircleOutlined style={{ color: P }} />}
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Notify Modal */}
      <Modal
        open={notifyModal}
        onCancel={() => setNotifyModal(false)}
        title="SLA Breach — Send Reminder"
        footer={[
          <Button key="cancel" onClick={() => setNotifyModal(false)}>Cancel</Button>,
          <Button key="notify" danger loading={notifyLoading} onClick={handleNotifyAdvisor} icon={<BellOutlined />}>
            Send Reminder
          </Button>,
        ]}
        centered
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          <WarningOutlined style={{ fontSize: 48, color: "#DC2626", marginBottom: 16 }} />
          <p>Advisor <strong>{notifyTarget?.advisorName}</strong> has not contacted this customer within the <strong>4-hour SLA window</strong>.</p>
          <div style={{ background: "#FEF2F2", borderRadius: 10, padding: 12, marginTop: 16 }}>
            <p style={{ fontSize: 12, color: "#DC2626", margin: 0 }}>A notification will remind the advisor to contact the customer immediately.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UnassignedLeadQueue;
