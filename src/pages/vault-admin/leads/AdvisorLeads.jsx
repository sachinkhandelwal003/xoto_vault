import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Button, Tag, message, Space, Select, Input,
  Tooltip, Badge, Drawer, Modal, Tabs, Alert, Empty,
} from "antd";
import {
  EyeOutlined, SearchOutlined, FilterOutlined, ClearOutlined,
  ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  PhoneOutlined, ClockCircleOutlined, FolderOpenOutlined,
  WarningOutlined, UserOutlined, FileTextOutlined, DollarOutlined,
  InfoCircleOutlined, CalculatorOutlined, AppstoreOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/api/apiService";
import CustomTable from "@/components/common/CustomTable";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const P  = "#5C039B";
const PL = "#F5F0FF";
const PB = "#E9D5FF";

const roleSlugMap = {
  '18': "vault-admin", '21': "vaultpartner",
  '22': "vaultagent",  '23': "vault-ops", '26': "vault-advisor",
};

const MANUAL_STATUS_OPTIONS = [
  "Contacted", "Qualified", "Collecting Documents", "Documents Complete",
];

const QUALIFIED_LOCK = [
  'Qualified', 'Application Opened', 'Bank Application', 'Pre-Approved',
  'Valuation', 'FOL Processed', 'FOL Issued', 'FOL Signed',
  'Disbursed', 'Lost', 'Not Proceeding',
];

const STATUS_CFG = {
  "New":                   { bg: "#EFF6FF", text: "#1D4ED8", icon: <FileTextOutlined /> },
  "Assigned":              { bg: "#F5F0FF", text: "#6D28D9", icon: <UserOutlined /> },
  "Contacted":             { bg: "#FFF7ED", text: "#C2410C", icon: <PhoneOutlined /> },
  "Qualified":             { bg: "#EEF2FF", text: "#4338CA", icon: <CheckCircleOutlined /> },
  "Collecting Documents":  { bg: "#FAF5FF", text: "#581C87", icon: <FileTextOutlined /> },
  "Documents Complete":    { bg: "#F0FDF4", text: "#15803D", icon: <CheckCircleOutlined /> },
  "Application Opened":    { bg: "#FFF5F3", text: "#C2410C", icon: <FolderOpenOutlined /> },
  "Bank Application":      { bg: "#EDE9FE", text: "#5B21B6", icon: <FileTextOutlined /> },
  "Pre-Approved":          { bg: "#DCFCE7", text: "#166534", icon: <CheckCircleOutlined /> },
  "Valuation":             { bg: "#FEF3C7", text: "#92400E", icon: <ClockCircleOutlined /> },
  "FOL Processed":         { bg: "#E0E7FF", text: "#3730A3", icon: <FileTextOutlined /> },
  "FOL Issued":            { bg: "#E0E7FF", text: "#3730A3", icon: <FileTextOutlined /> },
  "FOL Signed":            { bg: "#F3E8FF", text: "#6B21A5", icon: <CheckCircleOutlined /> },
  "Disbursed":             { bg: "#ECFDF5", text: "#065F46", icon: <DollarOutlined /> },
  "Not Proceeding":        { bg: "#F3F4F6", text: "#6B7280", icon: <CloseCircleOutlined /> },
  "Lost":                  { bg: "#FEF2F2", text: "#991B1B", icon: <CloseCircleOutlined /> },
};

const TAB_LIST = [
  { key: "All",                  label: "All Leads",       icon: <AppstoreOutlined /> },
  { key: "Assigned",             label: "Assigned",        icon: <UserOutlined /> },
  { key: "Contacted",            label: "Contacted",       icon: <PhoneOutlined /> },
  { key: "Qualified",            label: "Qualified",       icon: <CheckCircleOutlined /> },
  { key: "Collecting Documents", label: "Collecting Docs", icon: <FileTextOutlined /> },
  { key: "Documents Complete",   label: "Docs Complete",   icon: <CheckCircleOutlined /> },
  { key: "Application Opened",   label: "Case Opened",     icon: <FolderOpenOutlined /> },
  { key: "Not Proceeding",       label: "Not Proceeding",  icon: <CloseCircleOutlined /> },
];

const fmt = (n) => (n ? Number(n).toLocaleString("en-AE") : "—");

const getSLAStatus = (assignedAt, currentStatus, slaDeadline) => {
  if (!assignedAt) return null;
  if (["Contacted","Qualified","Collecting Documents","Bank Application"].includes(currentStatus))
    return { status: "completed", text: "✓ SLA Met", color: "#10B981" };
  const now = new Date();
  const deadline = slaDeadline ? new Date(slaDeadline) : new Date(new Date(assignedAt).getTime() + 4 * 3600000);
  const remaining = deadline - now;
  if (remaining < 0) {
    return { status: "breached", text: `Breached ${Math.abs(Math.floor(remaining / 3600000))}h ago`, color: "#EF4444" };
  }
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  if (remaining < 30 * 60000) return { status: "urgent",   text: `${h}h ${m}m left`, color: "#F59E0B" };
  return                       { status: "on_track", text: `${h}h ${m}m left`, color: "#6B7280" };
};

/* ══════════════════════════════════════════════════════════════════ */
const AdvisorLeads = () => {
  const navigate  = useNavigate();
  const { user }  = useSelector((s) => s.auth);
  const _roleCode = typeof user?.role === "object" ? String(user.role.code ?? "") : String(user?.role ?? "");
  const roleSlug  = roleSlugMap[_roleCode] ?? "vault-advisor";
  const apiLeadsEndpoint = _roleCode === "22" ? "/vault/lead/my-leads" : "/vault/lead/advisor/my-leads";

  const [activeTab,    setActiveTab]    = useState("All");
  const [data,         setData]         = useState({});
  const [loading,      setLoading]      = useState({});
  const [pagination,   setPagination]   = useState({});
  const [summary,      setSummary]      = useState({});
  const [filters,      setFilters]      = useState({ search: "" });
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [statusModal,  setStatusModal]  = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusNotes,  setStatusNotes]  = useState("");
  const [statusLoading,setStatusLoading]= useState(false);
  const [selectedStatus,setSelectedStatus] = useState("");

  const activeFilterCount = Object.values(filters).filter(v => v && v !== "").length;

  /* ── Fetch ── */
  const fetchLeads = useCallback(async (tab, page = 1, limit = 10) => {
    setLoading(prev => ({ ...prev, [tab]: true }));
    try {
      const params = new URLSearchParams({ page, limit });
      if (tab !== "All") params.set("status", tab);
      if (filters.search?.trim()) params.set("search", filters.search.trim());
      const res  = await apiService.get(`${apiLeadsEndpoint}?${params}`);
      const list = Array.isArray(res?.data) ? res.data : [];
      const total = res?.total ?? res?.pagination?.total ?? 0;
      const pg    = res?.pagination || {};
      setData(prev => ({ ...prev, [tab]: list }));
      setSummary(res?.summary || {});
      setPagination(prev => ({
        ...prev,
        [tab]: { current: pg.currentPage || page, total, limit: pg.limit || limit, totalPages: pg.totalPages || 1 },
      }));
    } catch (err) {
      setData(prev => ({ ...prev, [tab]: [] }));
      message.error(err?.response?.data?.message || "Failed to fetch leads");
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  }, [filters, apiLeadsEndpoint]);

  useEffect(() => { fetchLeads(activeTab, 1, 10); }, [activeTab, fetchLeads]);

  const currentData       = data[activeTab]       || [];
  const currentLoading    = loading[activeTab]    || false;
  const currentPagination = pagination[activeTab] || { current: 1, total: 0, limit: 10 };
  const refresh           = () => fetchLeads(activeTab, currentPagination.current || 1, currentPagination.limit || 10);

  /* ── Status update ── */
  const openStatusModal = (record, status = "") => {
    if (record?.conversionInfo?.convertedToApplication) {
      message.warning("Status locked — a Case has been created"); return;
    }
    if (QUALIFIED_LOCK.includes(record?.currentStatus)) {
      message.warning("Lead is locked — create a Case to continue"); return;
    }
    setStatusTarget(record);
    setSelectedStatus(status);
    setStatusNotes("");
    setStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!statusTarget?._id || !selectedStatus) { message.error("Select a status"); return; }
    if (selectedStatus === "Not Proceeding" && !statusNotes.trim()) {
      message.error("Reason is required for Not Proceeding"); return;
    }
    setStatusLoading(true);
    try {
      const payload = { status: selectedStatus };
      if (statusNotes.trim()) payload.notes = statusNotes.trim();
      if (selectedStatus === "Not Proceeding") payload.notProceedingReason = statusNotes.trim();
      await apiService.put(`/vault/lead/advisorOrpartner/lead/${statusTarget._id}/status`, payload);
      message.success(`Status updated to "${selectedStatus}"`);
      setStatusModal(false);
      setStatusTarget(null);
      refresh();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const getEligIcon = (lead) => {
    const e = lead?.eligibility || {};
    if (!e.checked)    return { text: "Not Checked", color: "#9CA3AF", icon: <WarningOutlined /> };
    return e.isEligible
      ? { text: "Eligible",     color: "#10B981", icon: <CheckCircleOutlined /> }
      : { text: "Not Eligible", color: "#EF4444", icon: <CloseCircleOutlined /> };
  };

  /* ── Columns ── */
  const columns = [
    {
      key: "customer", title: "Client",
      render: (_, r) => {
        const ci = r?.customerInfo || {};
        return (
          <div style={{ minWidth: 160 }}>
            <div style={{ fontWeight: 700, color: "#1a0533", fontSize: 13 }}>
              {ci.fullName || `${ci.firstName || ''} ${ci.lastName || ''}`.trim() || "—"}
            </div>
            {ci.email        && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{ci.email}</div>}
            {ci.mobileNumber && <div style={{ fontSize: 11, color: "#6B7280" }}>{ci.countryCode || '+971'} {ci.mobileNumber}</div>}
            {ci.nationality  && <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{ci.nationality}</div>}
          </div>
        );
      },
    },
    {
      key: "financial", title: "Financial",
      render: (_, r) => {
        const ci = r?.customerInfo || {};
        const pd = r?.propertyDetails || {};
        return (
          <div style={{ minWidth: 140 }}>
            {ci.employmentStatus && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600, display: "inline-block", marginBottom: 4, background: ci.employmentStatus === "Salaried" ? "#eff6ff" : "#f5f3ff", color: ci.employmentStatus === "Salaried" ? "#1d4ed8" : "#5b21b6" }}>
                {ci.employmentStatus}
              </span>
            )}
            {ci.monthlySalary      && <div style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>Salary: AED {fmt(ci.monthlySalary)}</div>}
            {pd.loanAmountRequired && <div style={{ fontSize: 12, color: P,       fontWeight: 600 }}>Loan: AED {fmt(pd.loanAmountRequired)}</div>}
            {pd.transactionType    && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{pd.transactionType}</div>}
          </div>
        );
      },
    },
    {
      key: "eligibility", title: "Eligibility",
      render: (_, r) => {
        const e = getEligIcon(r);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: e.color }}>
            {e.icon} {e.text}
            {r?.eligibility?.dbrPercentage > 0 && <span style={{ fontSize: 10, color: "#9CA3AF" }}> · DBR {r.eligibility.dbrPercentage}%</span>}
          </div>
        );
      },
    },
    {
      key: "status", title: "Status",
      render: (_, r) => {
        const val = r?.currentStatus;
        if (!val) return <span style={{ color: "#D1D5DB" }}>—</span>;
        const cfg = STATUS_CFG[val] || { bg: "#F3F4F6", text: "#374151", icon: <FileTextOutlined /> };
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.text, whiteSpace: "nowrap" }}>
            {cfg.icon} {val}
          </span>
        );
      },
    },
    {
      key: "sla", title: "Advisor / SLA",
      render: (_, r) => {
        const a = r?.assignedTo || {};
        const sla = getSLAStatus(a.assignedAt, r?.currentStatus, r?.sla?.deadline);
        return (
          <div style={{ minWidth: 130 }}>
            {a.advisorName && <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{a.advisorName}</div>}
            {a.assignedAt  && <div style={{ fontSize: 10, color: "#9CA3AF" }}>{dayjs(a.assignedAt).format("DD MMM, HH:mm")}</div>}
            {sla && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                {sla.status === "breached"  && <WarningOutlined      style={{ color: sla.color, fontSize: 11 }} />}
                {sla.status === "completed" && <CheckCircleOutlined  style={{ color: sla.color, fontSize: 11 }} />}
                {["urgent","on_track"].includes(sla.status) && <ClockCircleOutlined style={{ color: sla.color, fontSize: 11 }} />}
                <span style={{ fontSize: 10, color: sla.color, fontWeight: sla.status === "breached" ? 700 : 500 }}>{sla.text}</span>
              </div>
            )}
            {!a.advisorId && <span style={{ fontSize: 11, color: "#9CA3AF" }}>Unassigned</span>}
          </div>
        );
      },
    },
    {
      key: "actions", title: "Actions", align: "center", fixed: "right",
      render: (_, r) => {
        const st         = r?.currentStatus;
        const id         = r?._id;
        const caseCreated = r?.conversionInfo?.convertedToApplication === true;
        const locked      = caseCreated || QUALIFIED_LOCK.includes(st);
        const canContact  = st === "Assigned" || (_roleCode === "22" && st === "New");
        const canElig     = st === "Contacted";
        const canUpdate   = !locked && !["Assigned","New"].includes(st);
        const elig        = getEligIcon(r);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {/* View */}
              <button onClick={() => navigate(`/dashboard/${roleSlug}/vault/lead/${id}`)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 8, border: `1px solid ${PB}`, background: PL, color: P, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <EyeOutlined /> View
              </button>

              {/* Contact */}
              {canContact && (
                <button onClick={() => openStatusModal(r, "Contacted")}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 8, border: "1px solid #FED7AA", background: "#FFF7ED", color: "#C2410C", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <PhoneOutlined /> Contact
                </button>
              )}

              {/* Eligibility */}
              {canElig && (
                <button onClick={() => navigate(`/dashboard/${roleSlug}/vault/lead/${id}/eligibility`)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: r?.eligibility?.isEligible ? "#dcfce7" : r?.eligibility?.checked ? "#fef2f2" : "#fffbeb", color: elig.color }}>
                  <CalculatorOutlined /> {elig.text === "Not Checked" ? "Check Eligibility" : elig.text}
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {/* Update Status */}
              {canUpdate && (
                <button onClick={() => openStatusModal(r, "")}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 8, border: `1.5px solid ${P}`, background: "#fff", color: P, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <CheckCircleOutlined /> Update Status
                </button>
              )}

              {/* Create Case / Proposal */}
              {QUALIFIED_LOCK.includes(st) && !caseCreated && (
                <>
                  <button onClick={() => navigate(`/dashboard/${roleSlug}/case/create?leadId=${id}`)}
                    style={{ padding: "5px 11px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${P},#7C3AED)`, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    + Create Case
                  </button>
                  <button onClick={() => navigate(`/dashboard/${roleSlug}/proposals/create?leadId=${id}`)}
                    style={{ padding: "5px 11px", borderRadius: 8, border: "1px solid #ddd6fe", background: "#faf5ff", color: "#7c3aed", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Proposal
                  </button>
                </>
              )}

              {/* Locked */}
              {locked && (
                <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 8, padding: "4px 8px", color: caseCreated ? "#2563eb" : "#059669", background: caseCreated ? "#eff6ff" : "#ecfdf5", border: `1px solid ${caseCreated ? "#bfdbfe" : "#a7f3d0"}` }}>
                  {caseCreated ? "🔒 Case Created" : "🔒 Qualified"}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: "#F4F0FA", minHeight: "100vh", padding: "28px 24px", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        /* Card-type tabs — purple active */
        .adv-card-tabs .ant-tabs-tab {
          background: #fff !important;
          border: 1px solid #ede9f6 !important;
          border-bottom: none !important;
          border-radius: 8px 8px 0 0 !important;
          margin-right: 4px !important;
          padding: 8px 16px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: #6b7280 !important;
          transition: all 0.2s !important;
        }
        .adv-card-tabs .ant-tabs-tab:hover {
          color: ${P} !important;
          border-color: ${PB} !important;
        }
        .adv-card-tabs .ant-tabs-tab-active {
          background: ${P} !important;
          border-color: ${P} !important;
        }
        .adv-card-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #fff !important;
          font-weight: 700 !important;
        }
        .adv-card-tabs .ant-tabs-content-holder { display: none; }
        .adv-card-tabs .ant-tabs-nav { margin-bottom: 0 !important; border-bottom: none !important; }
        .adv-card-tabs .ant-tabs-nav::before { border-bottom: none !important; }
        /* Table header */
        .adv-tbl .ant-table-thead > tr > th { background: #faf8ff !important; color: ${P} !important; font-weight: 700 !important; font-size: 12px !important; border-bottom: 1px solid #ede9f6 !important; }
        .adv-tbl .ant-table-tbody > tr:hover > td { background: #f8f5ff !important; }
      `}</style>

      {/* ── ORIGINAL HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a0533", margin: 0 }}>My Leads</h1>
          <p style={{ fontSize: 13, color: "#8B7BAE", margin: "4px 0 0" }}>
            Status-wise lead management — {currentPagination.total || 0} leads
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={currentLoading}>
            Refresh
          </Button>
          <Badge count={activeFilterCount} color={P} size="small">
            <Button icon={<FilterOutlined />} onClick={() => setDrawerOpen(true)}>
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
            </Button>
          </Badge>
          {activeFilterCount > 0 && (
            <Button icon={<ClearOutlined />} onClick={() => { setFilters({ search: "" }); refresh(); }} danger>
              Clear All
            </Button>
          )}
        </Space>
      </div>

      {/* ── SLA ALERT ── */}
      {activeTab === "Assigned" && (
        <Alert
          message={
            <span>
              <InfoCircleOutlined style={{ color: P, marginRight: 8 }} />
              <strong>SLA Requirement:</strong> Each assigned lead must be <strong>contacted within 4 hours</strong> of assignment.
            </span>
          }
          type="info"
          showIcon={false}
          style={{ marginBottom: 16, borderRadius: 12, background: PL, border: `1px solid ${PB}` }}
        />
      )}

      {/* ── CARD TABS ── */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        className="adv-card-tabs"
        items={TAB_LIST.map(tab => {
          const count = pagination[tab.key]?.total;
          return {
            key:   tab.key,
            label: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {tab.icon}
                {tab.label}
                {count > 0 && (
                  <span style={{
                    minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9,
                    fontSize: 10, fontWeight: 700, lineHeight: "18px",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    background: activeTab === tab.key ? "rgba(255,255,255,0.25)" : PB,
                    color:      activeTab === tab.key ? "#fff" : P,
                  }}>
                    {count}
                  </span>
                )}
              </span>
            ),
          };
        })}
      />

      {/* ── TABLE ── */}
      <div className="adv-tbl" style={{ background: "#fff", borderRadius: "0 8px 16px 16px", border: "1px solid #ede9f6", borderTop: "none", overflow: "hidden", boxShadow: "0 2px 12px rgba(92,3,155,0.06)" }}>
        {!currentLoading && currentData.length === 0 ? (
          <Empty
            description={<span style={{ color: "#9CA3AF" }}>No leads in <strong>{activeTab === "All" ? "any stage" : activeTab}</strong></span>}
            style={{ padding: "48px 0" }}
          />
        ) : (
          <div style={{ padding: "0 0 4px" }}>
            <CustomTable
              columns={columns}
              data={currentData}
              loading={currentLoading}
              totalItems={currentPagination.total}
              currentPage={currentPagination.current}
              itemsPerPage={currentPagination.limit}
              onPageChange={(page, size) => fetchLeads(activeTab, page, size || currentPagination.limit)}
              showSearch={false}
            />
          </div>
        )}
      </div>

      {/* ── FILTER DRAWER ── */}
      <Drawer
        title={<span style={{ color: P, fontWeight: 700 }}>Filter Leads</span>}
        placement="right"
        width={340}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={<Button size="small" danger onClick={() => { setFilters({ search: "" }); setDrawerOpen(false); refresh(); }}>Reset All</Button>}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button onClick={() => setDrawerOpen(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button type="primary" onClick={() => { refresh(); setDrawerOpen(false); }} style={{ flex: 2, background: P }} icon={<FilterOutlined />}>
              Apply Filters
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: P, fontSize: 13 }}>Search</div>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Name, email, phone..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </div>
        </div>
      </Drawer>

      {/* ── STATUS UPDATE MODAL ── */}
      <Modal
        open={statusModal}
        onCancel={() => !statusLoading && setStatusModal(false)}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: PL, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircleOutlined style={{ color: P, fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1a0533" }}>Update Lead Status</div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                {statusTarget?.customerInfo?.fullName ||
                 `${statusTarget?.customerInfo?.firstName || ''} ${statusTarget?.customerInfo?.lastName || ''}`.trim() || "—"}
              </div>
            </div>
          </div>
        }
        footer={[
          <Button key="cancel" onClick={() => setStatusModal(false)} disabled={statusLoading}>Cancel</Button>,
          <Button key="submit" type="primary" loading={statusLoading} disabled={!selectedStatus} onClick={handleStatusUpdate}
            style={{ background: P, borderColor: P }}>
            {selectedStatus ? `Confirm — ${selectedStatus}` : "Select a status"}
          </Button>,
        ]}
        centered width={500}
      >
        <div style={{ background: PL, borderRadius: 10, padding: "10px 14px", marginBottom: 16, border: `1px solid ${PB}` }}>
          <span style={{ fontSize: 12, color: "#6B7280" }}>Current status: </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: P }}>{statusTarget?.currentStatus || "—"}</span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: "#374151", fontSize: 13 }}>New Status</div>
          <Select style={{ width: "100%" }} placeholder="Choose a status…" value={selectedStatus || undefined} onChange={setSelectedStatus} size="large">
            {(["New","Assigned"].includes(statusTarget?.currentStatus)
              ? ["Contacted"]
              : [...MANUAL_STATUS_OPTIONS, "Not Proceeding"].filter(s => s !== statusTarget?.currentStatus)
            ).map(s => (
              <Option key={s} value={s}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_CFG[s]?.text || P, display: "inline-block" }} />
                  {s}
                </span>
              </Option>
            ))}
          </Select>
        </div>

        {selectedStatus === "Qualified" && (
          <div style={{ background: statusTarget?.eligibility?.isEligible ? "#f0fdf4" : "#fef2f2", borderRadius: 10, padding: "10px 14px", marginBottom: 14, border: `1px solid ${statusTarget?.eligibility?.isEligible ? "#bbf7d0" : "#fecaca"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: statusTarget?.eligibility?.isEligible ? "#065F46" : "#991B1B" }}>
              {statusTarget?.eligibility?.isEligible ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              {statusTarget?.eligibility?.isEligible ? "Customer passed eligibility ✅" : "Customer has not passed eligibility — confirm manually if overriding"}
            </div>
          </div>
        )}

        <TextArea
          rows={3}
          value={statusNotes}
          onChange={(e) => setStatusNotes(e.target.value)}
          placeholder={selectedStatus === "Not Proceeding" ? "Reason for not proceeding (required)…" : "Notes about this status change (optional)…"}
          maxLength={500}
          showCount
          style={{ borderRadius: 10, borderColor: selectedStatus === "Not Proceeding" && !statusNotes.trim() ? "#fca5a5" : "#e5e7eb" }}
        />
      </Modal>
    </div>
  );
};

export default AdvisorLeads;
