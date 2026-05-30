// src/pages/vault-admin/leads/VaultAllLeads.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { Button, Tag, message, Space, Select, Input, Tooltip, Badge, Drawer, Modal, Avatar, Alert, DatePicker } from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  PlusCircleOutlined,
  PhoneOutlined,
  FileTextOutlined,
  CloseOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/api/apiService";
import CustomTable from "@/components/common/CustomTable";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

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
  "New":                   { color: "blue",     bg: "#EFF6FF", text: "#1D4ED8", icon: <PlusCircleOutlined /> },
  "Assigned":              { color: "purple",   bg: "#F5F0FF", text: "#6D28D9", icon: <UserOutlined /> },
  "Contacted":             { color: "orange",   bg: "#FFF7ED", text: "#C2410C", icon: <PhoneOutlined /> },
  "Qualified":             { color: "geekblue", bg: "#EEF2FF", text: "#4338CA", icon: <CheckCircleOutlined /> },
  "Collecting Documents":  { color: "purple",   bg: "#FAF5FF", text: "#581C87", icon: <FileTextOutlined /> },
  "Documents Complete":    { color: "cyan",     bg: "#F0FDF4", text: "#15803D", icon: <CheckCircleOutlined /> },
  "Application Opened":    { color: "volcano",  bg: "#FFF5F3", text: "#C2410C", icon: <FileTextOutlined /> },
  "Bank Application":      { color: "violet",   bg: "#EDE9FE", text: "#5B21B6", icon: <FileTextOutlined /> },
  "Pre-Approved":          { color: "green",    bg: "#DCFCE7", text: "#166534", icon: <CheckCircleOutlined /> },
  "Valuation":             { color: "orange",   bg: "#FEF3C7", text: "#92400E", icon: <ClockCircleOutlined /> },
  "FOL Processed":         { color: "indigo",   bg: "#E0E7FF", text: "#3730A3", icon: <FileTextOutlined /> },
  "FOL Issued":            { color: "indigo",   bg: "#E0E7FF", text: "#3730A3", icon: <FileTextOutlined /> },
  "FOL Signed":            { color: "purple",   bg: "#F3E8FF", text: "#6B21A5", icon: <CheckCircleOutlined /> },
  "Disbursed":             { color: "success",  bg: "#ECFDF5", text: "#065F46", icon: <DollarOutlined /> },
  "Not Proceeding":        { color: "default",  bg: "#F3F4F6", text: "#6B7280", icon: <CloseOutlined /> },
  "Lost":                  { color: "red",      bg: "#FEF2F2", text: "#991B1B", icon: <CloseOutlined /> },
};

const SOURCE_CFG = {
  website: { color: "blue", label: "Website" },
  freelance_agent: { color: "purple", label: "Referral Partner" },
  individual_partner: { color: "green", label: "Partner" },
  admin: { color: "orange", label: "Admin" },
};

const STATUSES = Object.keys(STATUS_CFG);
const SOURCES = Object.keys(SOURCE_CFG);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
const cap = (s) => s ? s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";

const VaultAllLeads = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const rawRole = user?.role;
  const roleCode = rawRole ? (typeof rawRole === "object" ? Number(rawRole.code) : Number(rawRole)) : 18;
  const roleSlug = roleSlugMap[roleCode] ?? "vault-admin";
  const isAdmin = roleCode === 18;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const INIT_FILTERS = { search: "", source: "", status: "", advisorId: "", fromDate: "", toDate: "" };
  const [filters, setFilters] = useState(INIT_FILTERS);
  const [applied, setApplied] = useState(INIT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dateRange, setDateRange] = useState(null);

  const [advisors, setAdvisors] = useState([]);

  const activeCount = Object.entries(applied).filter(([, v]) => v !== "").length;

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAdvisors = async () => {
      try {
        const res = await apiService.get("/vault/advisor/workload?limit=100");
        const list = res?.data?.data || res?.data || [];
        setAdvisors(list.map((a) => ({ id: a.advisorId, fullName: a.advisorName || a.email })));
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
      if (f.status) params.set("status", f.status);
      if (f.advisorId) params.set("advisorId", f.advisorId);
      if (f.fromDate) params.set("fromDate", f.fromDate);
      if (f.toDate) params.set("toDate", f.toDate);

      const res = await apiService.get(`/vault/lead/admin/all?${params.toString()}`);
      const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      const total = res?.data?.total || res?.data?.totalItems || list.length;
      setData(list);
      setTotalItems(total);
    } catch {
      message.error("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchLeads(currentPage, itemsPerPage, applied);
  }, [isAdmin, currentPage, itemsPerPage, applied, fetchLeads]);

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

  const handleDateRange = (dates) => {
    setDateRange(dates);
    setFilters((prev) => ({
      ...prev,
      fromDate: dates?.[0] ? dates[0].format("YYYY-MM-DD") : "",
      toDate: dates?.[1] ? dates[1].format("YYYY-MM-DD") : "",
    }));
  };

  const quickStatus = (status) => {
    const f = { ...INIT_FILTERS, status };
    setFilters(f);
    setApplied(f);
    setCurrentPage(1);
    fetchLeads(1, itemsPerPage, f);
  };

  const handleViewDetail = (id) => {
    if (id) navigate(`/dashboard/${roleSlug}/vault/lead/${id}`);
  };

  const columns = [
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
      key: "assignedAdvisor",
      title: "Assigned Advisor",
      width: 180,
      render: (_, r) => {
        const assigned = r?.assignedTo;
        if (assigned?.advisorName) {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar size={28} icon={<UserOutlined />} style={{ background: PL, color: P, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{assigned.advisorName}</div>
                {assigned.assignedAt && (
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>Since: {fmtDate(assigned.assignedAt)}</div>
                )}
              </div>
            </div>
          );
        }
        return <span style={{ color: "#D97706", fontSize: 12, fontWeight: 500 }}>Unassigned</span>;
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
        return <Tag color={cfg.color} style={{ borderRadius: 20 }}>{cfg.label}</Tag>;
      },
    },
    {
      key: "currentStatus",
      title: "Status",
      width: 175,
      filterable: true,
      filterKey: "status",
      filterOptions: STATUSES.map((s) => ({ value: s, label: s })),
      render: (_, r) => {
        const val = r?.currentStatus;
        if (!val) return <span style={{ color: "#D1D5DB" }}>—</span>;
        const cfg = STATUS_CFG[val] || { bg: "#F3F4F6", text: "#374151", icon: <FileTextOutlined /> };
        return (
          <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.text, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5 }}>
            {cfg.icon} {val}
          </span>
        );
      },
    },
    {
      key: "propertyDetails",
      title: "Property",
      width: 150,
      render: (_, r) => {
        const pd = r?.propertyDetails || {};
        return (
          <div>
            <div style={{ fontSize: 12, color: "#374151" }}>{pd.transactionType || "—"}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>{pd.approxPropertyValue || ""}</div>
          </div>
        );
      },
    },
    {
      key: "createdBy",
      title: "Created By",
      width: 140,
      render: (_, r) => {
        const si = r?.sourceInfo || {};
        return si.createdByName ? (
          <div>
            <div style={{ fontSize: 12, color: "#374151" }}>{si.createdByName}</div>
            {si.createdByRole && <div style={{ fontSize: 10, color: "#9CA3AF" }}>{cap(si.createdByRole)}</div>}
          </div>
        ) : <span style={{ color: "#D1D5DB" }}>—</span>;
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
              <Button
                type="primary"
                ghost
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(leadId)}
                size="small"
                style={{ borderRadius: 8, borderColor: PB, color: P }}
              />
            </Tooltip>
            {isQualified && (
              <>
                <Button
                  size="small"
                  onClick={() => navigate(`/dashboard/${roleSlug}/proposals/create?leadId=${leadId}`)}
                  style={{
                    borderRadius: 8,
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
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#2563eb",
                    borderColor: "#bfdbfe",
                    background: "#eff6ff",
                  }}
                >
                  Create Case
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: "#F4F0FA", padding: 28, textAlign: "center" }}>
        <Alert message="Access Denied" description="Only admin can access this page." type="error" showIcon />
      </div>
    );
  }

  const qualifiedCount = data.filter((l) => l.currentStatus === "Qualified").length;
  const bankAppCount = data.filter((l) => l.currentStatus === "Bank Application").length;
  const preApprovedCount = data.filter((l) => l.currentStatus === "Pre-Approved").length;
  const disbursedCount = data.filter((l) => l.currentStatus === "Disbursed").length;
  const lostCount = data.filter((l) => l.currentStatus === "Lost").length;

  const quickStatusPills = ["Contacted", "Qualified", "Collecting Documents", "Bank Application", "Pre-Approved", "Valuation", "FOL Signed", "Disbursed", "Lost"];

  return (
    <div style={{ background: "#F4F0FA", minHeight: "100vh", padding: "28px 24px", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .val-table .ant-table-thead > tr > th { background: linear-gradient(to right, #FAF8FF, #F5F0FF) !important; color: ${P} !important; font-weight: 700 !important; border-bottom: 2px solid #EDE4FF !important; font-size: 12px !important; }
        .val-table .ant-table-tbody > tr:hover > td { background: #FDFAFF !important; }
        .val-table .ant-table-tbody > tr > td { border-bottom: 1px solid #F5F0FF; }
        .val-table .ant-pagination-item-active { border-color: ${P} !important; background: ${P} !important; }
        .val-table .ant-pagination-item-active a { color: white !important; }
        .val-stat { transition: all .2s; cursor: default; }
        .val-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(92,3,155,0.1) !important; }
        .val-pill { cursor: pointer; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 500; border: 1.5px solid #EDE9F6; background: #F9F6FF; color: #6B7280; transition: all .15s; display: inline-flex; align-items: center; gap: 5px; }
        .val-pill:hover { border-color: ${P}; color: ${P}; }
        .val-pill.active { border-color: ${P}; color: ${P}; background: ${PL}; }
        .val-drawer .ant-drawer-header { background: linear-gradient(135deg, #2D0058, #5B1AA0); }
        .val-drawer .ant-drawer-title { color: white !important; font-weight: 700 !important; }
        .val-drawer .ant-drawer-close { color: rgba(255,255,255,0.8) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 28, background: `linear-gradient(to bottom, ${PM}, #06B6D4)`, borderRadius: 4 }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a0533", margin: 0 }}>All Leads</h1>
          </div>
          <p style={{ fontSize: 13, color: "#8B7BAE", margin: "6px 0 0 14px" }}>
            Complete lead management pipeline — {loading ? "loading..." : `${totalItems.toLocaleString()} lead${totalItems !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button icon={<ReloadOutlined />} onClick={() => fetchLeads(currentPage, itemsPerPage, applied)} loading={loading} style={{ borderRadius: 10, borderColor: "#E8DFF5", color: P }} />
          <Badge count={activeCount} color={P} size="small">
            <Button
              icon={<FilterOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ borderRadius: 10, background: activeCount > 0 ? PL : "white", borderColor: activeCount > 0 ? P : "#E8DFF5", color: activeCount > 0 ? P : "#374151", fontWeight: activeCount > 0 ? 700 : 400 }}
            >
              Filters {activeCount > 0 ? `(${activeCount})` : ""}
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total Leads", value: totalItems, color: P, bg: "white", border: PB },
          { label: "Qualified", value: qualifiedCount, color: "#4338CA", bg: "white", border: PB },
          { label: "Bank Application", value: bankAppCount, color: "#5B21B6", bg: "white", border: PB },
          { label: "Pre-Approved", value: preApprovedCount, color: "#059669", bg: "white", border: PB },
          { label: "Disbursed", value: disbursedCount, color: "#065F46", bg: "#ECFDF5", border: "#A7F3D0" },
          { label: "Lost", value: lostCount, color: "#DC2626", bg: lostCount > 0 ? "#FEF2F2" : "white", border: lostCount > 0 ? "#FECACA" : PB },
        ].map((stat) => (
          <div key={stat.label} className="val-stat" style={{ background: stat.bg, borderRadius: 14, padding: "14px 18px", border: `1px solid ${stat.border}`, boxShadow: "0 1px 4px rgba(92,3,155,0.05)" }}>
            <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>{stat.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, lineHeight: 1.1, marginTop: 4 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="val-table" style={{ background: "white", borderRadius: 16, border: `1px solid ${PB}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(92,3,155,0.06)" }}>
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
          rowKey="_id"
        />
      </div>

      {/* Filter Drawer */}
      <Drawer
        className="val-drawer"
        title="Advanced Filters"
        placement="right"
        width={340}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#6B21A8" }}>Search</div>
            <Input placeholder="Name, email, phone..." value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} onPressEnter={applyFilters} />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#6B21A8" }}>Lead Status</div>
            <Select style={{ width: "100%" }} placeholder="All Statuses" value={filters.status || undefined} onChange={(v) => setFilters((p) => ({ ...p, status: v || "" }))} allowClear>
              {STATUSES.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#6B21A8" }}>Lead Source</div>
            <Select style={{ width: "100%" }} placeholder="All Sources" value={filters.source || undefined} onChange={(v) => setFilters((p) => ({ ...p, source: v || "" }))} allowClear>
              {SOURCES.map((s) => <Select.Option key={s} value={s}>{SOURCE_CFG[s]?.label || s}</Select.Option>)}
            </Select>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#6B21A8" }}>Assigned Advisor</div>
            <Select style={{ width: "100%" }} placeholder="Any Advisor" value={filters.advisorId || undefined} onChange={(v) => setFilters((p) => ({ ...p, advisorId: v || "" }))} allowClear showSearch>
              {advisors.map((a) => <Select.Option key={a.id} value={a.id}>{a.fullName}</Select.Option>)}
            </Select>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#6B21A8" }}>Date Range</div>
            <RangePicker style={{ width: "100%" }} value={dateRange} onChange={handleDateRange} />
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default VaultAllLeads;
