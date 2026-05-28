// src/pages/Leads/AdvisorMyLeads.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Button, Tag, message, Space, Select, Input,
  Tooltip, Badge, Drawer, Modal, Tabs, Alert, Card, Spin,Empty 
} from "antd";
import {
  EyeOutlined, SearchOutlined, FilterOutlined, ClearOutlined,
  ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  PhoneOutlined, ClockCircleOutlined,
  WarningOutlined, UserOutlined, FileTextOutlined, DollarOutlined,
  InfoCircleOutlined, CalculatorOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/api/apiService";
import CustomTable from "@/components/common/CustomTable";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Brand Colors
const P = "#5C039B";
const PM = "#7C3AED";
const PL = "#F5F0FF";
const PB = "#E9D5FF";

const roleSlugMap = {
  '18': "vault-admin", '21': "vaultpartner", '22': "vaultagent", 
  '23': "vault-ops", '26': "vault-advisor"
};

// Statuses advisor can manually set (PRD §7.3)
const MANUAL_STATUS_OPTIONS = [
  "Contacted",
  "Qualified",
  "Collecting Documents",
  "Documents Complete",
];

// Status Configuration - All lead statuses advisor may see
const STATUS_CFG = {
  "Assigned": { bg: "#F5F0FF", text: "#6D28D9", icon: <UserOutlined /> },
  "Contacted": { bg: "#FFF7ED", text: "#C2410C", icon: <PhoneOutlined /> },
  "Qualified": { bg: "#EEF2FF", text: "#4338CA", icon: <CheckCircleOutlined /> },
  "Collecting Documents": { bg: "#FAF5FF", text: "#581C87", icon: <FileTextOutlined /> },
  "Documents Complete": { bg: "#F0FDF4", text: "#15803D", icon: <CheckCircleOutlined /> },
  "Bank Application": { bg: "#EDE9FE", text: "#5B21B6", icon: <FileTextOutlined /> },
  "Pre-Approved": { bg: "#DCFCE7", text: "#166534", icon: <CheckCircleOutlined /> },
  "Valuation": { bg: "#FEF3C7", text: "#92400E", icon: <ClockCircleOutlined /> },
  "FOL Processed": { bg: "#E0E7FF", text: "#3730A3", icon: <FileTextOutlined /> },
  "FOL Issued": { bg: "#E0E7FF", text: "#3730A3", icon: <FileTextOutlined /> },
  "FOL Signed": { bg: "#F3E8FF", text: "#6B21A5", icon: <CheckCircleOutlined /> },
  "Disbursed": { bg: "#ECFDF5", text: "#065F46", icon: <DollarOutlined /> },
  "Lost": { bg: "#FEF2F2", text: "#991B1B", icon: <CloseCircleOutlined /> },
  "Not Proceeding": { bg: "#F3F4F6", text: "#6B7280", icon: <CloseCircleOutlined /> },
};

const fmt = (n) => (n ? Number(n).toLocaleString("en-AE") : "—");

// Calculate SLA status
const getSLAStatus = (assignedAt, currentStatus, slaDeadline) => {
  if (!assignedAt) return null;
  if (
  currentStatus === "Contacted" ||
  currentStatus === "Qualified" ||
  currentStatus === "Collecting Documents" ||
  currentStatus === "Bank Application"
) return { status: "completed", text: "✓ Contacted (SLA Met)", color: "#10B981" };
  
  const now = new Date();
  const deadline = slaDeadline ? new Date(slaDeadline) : new Date(new Date(assignedAt).getTime() + 4 * 60 * 60 * 1000);
  const remaining = deadline - now;
  
  if (remaining < 0) {
    const overdue = Math.abs(Math.floor(remaining / (1000 * 60 * 60)));
    return { status: "breached", text: `SLA Breached by ${overdue}h`, color: "#EF4444" };
  }
  
  const hoursLeft = Math.floor(remaining / (1000 * 60 * 60));
  const minutesLeft = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (remaining < 30 * 60 * 1000) {
    return { status: "urgent", text: `SLA: ${hoursLeft}h ${minutesLeft}m left`, color: "#F59E0B" };
  }
  
  return { status: "on_track", text: `SLA: ${hoursLeft}h ${minutesLeft}m left`, color: "#6B7280" };
};

// Custom hook for status-wise data fetching
const useStatusWiseLeads = () => {
  const { user } = useSelector((s) => s.auth);
  const roleCode = typeof user?.role === "object" ? String(user.role.code ?? "") : String(user?.role ?? "");
  // role 22 (PartnerAffiliatedAgent) uses the agent endpoint; role 26 (advisor) uses advisor endpoint
  const apiLeadsEndpoint = roleCode === "22" ? "/vault/lead/my-leads" : "/vault/lead/advisor/my-leads";

  const [activeTab, setActiveTab] = useState(roleCode === "22" ? "New" : "Assigned");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ search: "", eligibilityStatus: "" });

const fetchStatusLeads = useCallback(async (status, page = 1, limit = 10) => {

  setLoading(prev => ({
    ...prev,
    [status]: true
  }));

  try {

    const params = new URLSearchParams({
      status,
      page,
      limit
    });

    if (filters?.search?.trim()) {
      params.set("search", filters.search.trim());
    }

    if (filters?.eligibilityStatus) {
      params.set("eligibilityStatus", filters.eligibilityStatus);
    }

    const res = await apiService.get(
      `${apiLeadsEndpoint}?${params.toString()}`
    );

    console.log("FULL API RESPONSE:", res);

    // IMPORTANT FIX
    // apiService already returns response.data
    const payload = res || {};

    console.log("PAYLOAD:", payload);
    console.log("PAYLOAD.DATA:", payload?.data);

    // SAFE ARRAY
    const list = Array.isArray(payload?.data)
      ? payload.data
      : [];

    console.log("FINAL LIST:", list);

    // TOTAL
    const total = payload?.total || 0;

    // SUMMARY
    const summaryData = payload?.summary || {};

    // PAGINATION
    const paginationData = payload?.pagination || {};

    // SET DATA
    setData(prev => ({
      ...prev,
      [status]: list
    }));

    // SET SUMMARY
    setSummary(summaryData);

    // SET PAGINATION
    setPagination(prev => ({
      ...prev,
      [status]: {
        current: paginationData?.currentPage || page,
        total,
        limit: paginationData?.limit || limit,
        totalPages: paginationData?.totalPages || 1,
      }
    }));

  } catch (error) {

    console.error("FETCH ERROR:", error);

    setData(prev => ({
      ...prev,
      [status]: []
    }));

    message.error(
      error?.response?.data?.message ||
      "Failed to fetch leads"
    );

  } finally {

    setLoading(prev => ({
      ...prev,
      [status]: false
    }));

  }

}, [filters]);

  // Fetch current tab data when tab changes
  useEffect(() => {
    fetchStatusLeads(activeTab, 1, 10);
  }, [activeTab, fetchStatusLeads]);
  
  return {
    activeTab,
    setActiveTab,
    data,
    loading,
    summary,
    pagination,
    filters,
    setFilters,
    fetchStatusLeads,
    refreshCurrent: () => fetchStatusLeads(activeTab, pagination[activeTab]?.current || 1, 10)
  };
};

// ══════════════════════════════════════════════════════════════════════════
const AdvisorLeads = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const _roleCode = typeof user?.role === "object" ? String(user.role.code ?? "") : String(user?.role ?? "");
  const roleSlug = roleSlugMap[_roleCode] ?? "vault-advisor";
  
  const {
    activeTab,
    setActiveTab,
    data,
    loading,
    summary,
    pagination,
    filters,
    setFilters,
    fetchStatusLeads,
    refreshCurrent
  } = useStatusWiseLeads();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusNotes, setStatusNotes] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  
  const currentData = data[activeTab] || [];
  const currentLoading = loading[activeTab] || false;
  const currentPagination = pagination[activeTab] || { current: 1, total: 0, limit: 10 };
  
  const activeCount = Object.values(filters).filter(v => v && v !== "").length;
  
  // Handle page change
  const handlePageChange = (page, size) => {
    fetchStatusLeads(activeTab, page, size || currentPagination.limit);
  };
  
  // Apply filters
  const applyFilters = () => {
    fetchStatusLeads(activeTab, 1, currentPagination.limit);
    setDrawerOpen(false);
  };
  
  const resetFilters = () => {
    setFilters({ search: "", eligibilityStatus: "" });
    fetchStatusLeads(activeTab, 1, currentPagination.limit);
    setDrawerOpen(false);
  };
  
  // Handle search
  const handleSearchEnter = () => {
    fetchStatusLeads(activeTab, 1, currentPagination.limit);
  };
  
  // View lead detail
  const handleViewDetail = (id) => {
    if (id) navigate(`/dashboard/${roleSlug}/vault/lead/${id}`);
    else message.warning("Lead ID not available");
  };
  
  // Check eligibility
  const handleCheckEligibility = (leadId) => {
    if (!leadId) return message.warning("Lead ID not available");
    navigate(`/dashboard/${roleSlug}/vault/lead/${leadId}/eligibility`);
  };
  
  // Statuses at or beyond Qualified — no more manual changes
  const QUALIFIED_LOCK = ['Qualified', 'Application Opened', 'Bank Application', 'Pre-Approved',
    'Valuation', 'FOL Processed', 'FOL Issued', 'FOL Signed', 'Disbursed', 'Lost', 'Not Proceeding'];

  // Open status modal — pre-select a status or leave blank for dropdown
  const openStatusModal = (record, status = "") => {
    const st = record?.currentStatus;
    if (record?.conversionInfo?.convertedToApplication) {
      message.warning("Status is locked — a Case has already been created for this lead");
      return;
    }
    if (QUALIFIED_LOCK.includes(st)) {
      message.warning("Lead is locked after qualification — create a Case to continue the workflow");
      return;
    }
    setStatusTarget(record);
    setSelectedStatus(status);
    setStatusNotes("");
    setStatusModal(true);
  };

  // Handle status update for all 4 manual statuses
  const handleStatusUpdate = async () => {
    if (!statusTarget?._id || !selectedStatus) {
      message.error("Please select a status");
      return;
    }

    setStatusLoading(true);
    try {
      const response = await apiService.put(
        `/vault/lead/advisorOrpartner/lead/${statusTarget._id}/status`,
        { status: selectedStatus, notes: statusNotes.trim() || undefined }
      );

      if (selectedStatus === "Contacted") {
        const sla = response?.data?.data?.sla;
        if (sla?.breached) {
          message.warning(`SLA BREACHED — contacted after ${sla.responseTimeHours} hours`);
        } else {
          message.success(`Marked as Contacted — ${sla?.responseTimeHours || 0}h response (within SLA ✅)`);
        }
      } else {
        message.success(`Status updated to "${selectedStatus}"`);
      }

      setStatusModal(false);
      setStatusTarget(null);
      setStatusNotes("");
      refreshCurrent();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };
  
  // Get eligibility status display
  const getEligibilityStatus = (lead) => {
    const eligibility = lead?.eligibility || {};
    if (!eligibility.checked) {
      return { status: "not_checked", text: "Not Checked", color: "#9CA3AF", icon: <WarningOutlined /> };
    }
    if (eligibility.isEligible) {
      return { status: "eligible", text: "Eligible", color: "#10B981", icon: <CheckCircleOutlined /> };
    }
    return { status: "not_eligible", text: "Not Eligible", color: "#EF4444", icon: <CloseCircleOutlined /> };
  };
  
  // Get action buttons
  const getActionButtons = (lead, leadId, currentStatus) => {
    const eligibilityStatus  = getEligibilityStatus(lead);
    const caseCreated        = lead?.conversionInfo?.convertedToApplication === true;
    const qualifiedLocked    = QUALIFIED_LOCK.includes(currentStatus);
    const isLocked           = caseCreated || qualifiedLocked;
    // Affiliated agents start leads at "New"; advisors get "Assigned"
    const canContact         = currentStatus === "Assigned" || (_roleCode === "22" && currentStatus === "New");
    const canCheckEligibility = currentStatus === "Contacted";

    // Statuses available in the dropdown — none when locked; pre-qualified leads can move to manual statuses
    const availableStatuses = isLocked
      ? []
      : ["New", "Assigned"].includes(currentStatus)
        ? ["Contacted"]
        : MANUAL_STATUS_OPTIONS.filter(s => s !== currentStatus);

    return (
      <Space size={4} wrap>
        {/* View */}
        <Tooltip title="View Details">
          <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(leadId)} style={{ color: P }} size="small">
            View
          </Button>
        </Tooltip>

        {/* Contact — Assigned leads only (SLA tracking) */}
        {canContact && (
          <Tooltip title="Mark as Contacted (4-hour SLA)">
            <Button
              size="small"
              icon={<PhoneOutlined />}
              onClick={() => openStatusModal(lead, "Contacted")}
              style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#C2410C", borderColor: "#FED7AA", background: "#FFF7ED" }}
            >
              Contact
            </Button>
          </Tooltip>
        )}

        {/* Check Eligibility — Contacted leads */}
        {canCheckEligibility && (
          <Tooltip title={
            eligibilityStatus.status === "not_checked" ? "Run eligibility check (DBR)"
            : eligibilityStatus.status === "eligible"  ? "Customer is eligible ✓"
            : "Customer is not eligible ✗"
          }>
            <Button
              size="small"
              icon={<CalculatorOutlined />}
              onClick={() => handleCheckEligibility(leadId)}
              style={{
                borderRadius: 6, fontSize: 11, fontWeight: 600, color: "white",
                background:   eligibilityStatus.status === "eligible" ? "#10B981" : eligibilityStatus.status === "not_eligible" ? "#EF4444" : "#F59E0B",
                borderColor:  eligibilityStatus.status === "eligible" ? "#10B981" : eligibilityStatus.status === "not_eligible" ? "#EF4444" : "#F59E0B",
              }}
            >
              {eligibilityStatus.status === "eligible" ? "✓ Eligible" : eligibilityStatus.status === "not_eligible" ? "✗ Not Eligible" : "Check Eligibility"}
            </Button>
          </Tooltip>
        )}

        {/* Update Status — only when not locked and statuses are available */}
        {!isLocked && availableStatuses.length > 0 && (
          <Button
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => openStatusModal(lead, "")}
            style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, color: P, borderColor: PB, background: PL }}
          >
            Update Status
          </Button>
        )}

        {/* Create Proposal / Case — when lead is Qualified (and no case yet) */}
        {qualifiedLocked && !caseCreated && (
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
              Case
            </Button>
          </>
        )}

        {/* Locked badge */}
        {isLocked && (
          <Tooltip title={caseCreated ? "Status locked — Case has been created. Status is auto-managed by the case workflow." : "Lead is Qualified — status locked. Create a Case to continue."}>
            <span style={{ fontSize: 10, fontWeight: 600, color: caseCreated ? "#2563eb" : "#059669", background: caseCreated ? "#eff6ff" : "#ecfdf5", border: `1px solid ${caseCreated ? "#bfdbfe" : "#a7f3d0"}`, borderRadius: 6, padding: "3px 8px" }}>
              {caseCreated ? "🔒 Case Created" : "🔒 Qualified"}
            </span>
          </Tooltip>
        )}

      </Space>
    );
  };
  
  // Table columns
  const columns = [
    {
      key: "customerInfo",
      title: "Client",
      width: 220,
      render: (_, r) => {
        const ci = r?.customerInfo || {};
        return (
          <div>
            <div style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>{ci.fullName || `${ci.firstName || ''} ${ci.lastName || ''}`.trim() || "—"}</div>
            {ci.email && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{ci.email}</div>}
            {ci.mobileNumber && <div style={{ fontSize: 11, color: "#6B7280" }}>{ci.countryCode || '+971'}{ci.mobileNumber}</div>}
          </div>
        );
      },
    },
    {
      key: "propertyDetails",
      title: "Property",
      width: 180,
      render: (_, r) => {
        const pd = r?.propertyDetails || {};
        const addr = [pd.propertyAddress?.area, pd.propertyAddress?.city].filter(Boolean).join(", ");
        return (
          <div>
            <div style={{ fontSize: 13, color: "#374151" }}>{pd.transactionType || "—"}</div>
            {pd.loanAmountRequired && <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>AED {fmt(pd.loanAmountRequired)}</div>}
            {addr && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{addr}</div>}
          </div>
        );
      },
    },
    {
      key: "eligibilityStatus",
      title: "Eligibility",
      width: 120,
      filterable: true,
      filterOptions: [
        { value: "eligible", label: "Eligible" },
        { value: "not_eligible", label: "Not Eligible" },
        { value: "not_checked", label: "Not Checked" }
      ],
      render: (_, r) => {
        const eligibility = r?.eligibility || {};
        if (!eligibility.checked) {
          return <Tag icon={<WarningOutlined />} color="warning" style={{ borderRadius: 20 }}>Not Checked</Tag>;
        }
        if (eligibility.isEligible) {
          return <Tag icon={<CheckCircleOutlined />} color="success" style={{ borderRadius: 20 }}>Eligible</Tag>;
        }
        return <Tag icon={<CloseCircleOutlined />} color="error" style={{ borderRadius: 20 }}>Not Eligible</Tag>;
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
      key: "slaStatus",
      title: "SLA",
      width: 140,
      render: (_, r) => {
        const assigned = r?.assignedTo;
        if (!assigned?.advisorId) return <span style={{ color: "#9CA3AF" }}>—</span>;
        
        const slaInfo = getSLAStatus(assigned.assignedAt, r?.currentStatus, r?.sla?.deadline);
        
        if (!slaInfo) return <span style={{ color: "#9CA3AF" }}>—</span>;
        
        return (
          <Tooltip title={`Assigned: ${dayjs(assigned.assignedAt).format('DD MMM YYYY, HH:mm')}`}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {slaInfo.status === "breached" && <WarningOutlined style={{ color: slaInfo.color }} />}
              {slaInfo.status === "urgent" && <ClockCircleOutlined style={{ color: slaInfo.color }} />}
              {slaInfo.status === "on_track" && <ClockCircleOutlined style={{ color: slaInfo.color }} />}
              <span style={{ fontSize: 11, color: slaInfo.color, fontWeight: slaInfo.status === "breached" ? 600 : 400 }}>
                {slaInfo.text}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      width: 320,
      align: "center",
      fixed: "right",
      render: (_, r) => getActionButtons(r, r?._id, r?.currentStatus),
    },
  ];
  
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: "#F4F0FA", minHeight: "100vh", padding: "28px 24px", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .vll-table .ant-table-thead > tr > th { background: #FAF8FF !important; color: ${P} !important; font-weight: 700 !important; border-bottom: 1px solid #EDE4FF !important; font-size: 12px !important; }
        .vll-table .ant-table-tbody > tr:hover > td { background: #F5F0FF !important; cursor: pointer; }
        .vll-status-tab .ant-tabs-tab { font-size: 12px !important; padding: 8px 14px !important; }
        .ant-tabs-tab-active { color: ${P} !important; }
        .ant-tabs-ink-bar { background: ${P} !important; }
      `}</style>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a0533", margin: 0 }}>My Leads</h1>
          <p style={{ fontSize: 13, color: "#8B7BAE", margin: "4px 0 0" }}>
            Status-wise lead management — {summary.total || 0} total leads
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refreshCurrent} loading={currentLoading}>
            Refresh
          </Button>
          <Badge count={activeCount} color={P} size="small">
            <Button icon={<FilterOutlined />} onClick={() => setDrawerOpen(true)}>
              Filters {activeCount > 0 ? `(${activeCount})` : ""}
            </Button>
          </Badge>
          {activeCount > 0 && (
            <Button icon={<ClearOutlined />} onClick={resetFilters} danger>
              Clear All
            </Button>
          )}
        </Space>
      </div>
      
      {/* SLA Alert for Assigned Tab */}
      {activeTab === "Assigned" && (
        <Alert
          message={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <InfoCircleOutlined style={{ fontSize: 18, color: P }} />
              <span><strong>SLA Requirement:</strong> Each assigned lead <strong>MUST be contacted within 4 hours</strong> of assignment.</span>
            </div>
          }
          type="info"
          showIcon={false}
          style={{ marginBottom: 16, borderRadius: 12, background: PL, border: `1px solid ${PB}` }}
        />
      )}
      
      {/* Status Filter Tabs */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #EDE9F6", marginBottom: 16, overflow: "hidden" }} className="vll-status-tab">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          tabBarStyle={{ margin: 0, padding: "0 16px" }}
          items={Object.keys(STATUS_CFG).map(status => ({
            key: status,
            label: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: activeTab === status ? P : STATUS_CFG[status].text }}>{STATUS_CFG[status].icon}</span>
                <span>{status}</span>
                {activeTab === status && currentPagination.total > 0 && (
                  <span style={{ background: P, color: "white", borderRadius: 10, padding: "0 6px", fontSize: 10, fontWeight: 700, lineHeight: "18px" }}>
                    {currentPagination.total}
                  </span>
                )}
              </span>
            )
          }))}
        />
      </div>

      {/* Table */}
      <div
        className="vll-table"
        style={{
          background: "white",
          borderRadius: 16,
          border: `1px solid #EDE9F6`,
          overflow: "hidden"
        }}
      >
        {!currentLoading && currentData.length === 0 ? (
          <div style={{ padding: 40 }}>
            <Empty description="No Leads Found" />
          </div>
        ) : (
          <CustomTable
            columns={columns}
            data={currentData}
            loading={currentLoading}
            totalItems={currentPagination.total}
            currentPage={currentPagination.current}
            itemsPerPage={currentPagination.limit}
            onPageChange={handlePageChange}
            showSearch={true}
            onFilter={(tblFilters) => {
              setFilters(prev => ({
                ...prev,
                search: tblFilters.search !== undefined ? tblFilters.search : prev.search,
                eligibilityStatus: tblFilters.eligibilityStatus !== undefined ? tblFilters.eligibilityStatus : prev.eligibilityStatus,
              }));
            }}
          />
        )}
      </div>
      
      {/* Filter Drawer */}
      <Drawer
        title="Filter Leads"
        placement="right"
        width={360}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button size="small" onClick={resetFilters} danger>
            Reset All
          </Button>
        }
        footer={
          <div style={{ display: "flex", gap: 12 }}>
            <Button onClick={() => setDrawerOpen(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button type="primary" onClick={applyFilters} style={{ flex: 2, background: P }}>
              Apply Filters {activeCount > 0 ? `(${activeCount})` : ""}
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: P }}>Search</div>
            <Input
              placeholder="Name, email, phone..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: P }}>Eligibility Status</div>
            <Select
              style={{ width: "100%" }}
              placeholder="All"
              value={filters.eligibilityStatus || undefined}
              onChange={(v) => setFilters(prev => ({ ...prev, eligibilityStatus: v || "" }))}
              allowClear
            >
              <Option value="eligible">Eligible</Option>
              <Option value="not_eligible">Not Eligible</Option>
              <Option value="not_checked">Not Checked</Option>
            </Select>
          </div>
        </div>
      </Drawer>
      
      {/* Status Update Modal */}
      <Modal
        open={statusModal}
        onCancel={() => !statusLoading && setStatusModal(false)}
        title={
          <div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Update Lead Status</span>
            {statusTarget && (
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                {statusTarget?.customerInfo?.fullName ||
                 `${statusTarget?.customerInfo?.firstName || ''} ${statusTarget?.customerInfo?.lastName || ''}`.trim() || "—"}
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
        {/* Current status info */}
        <div style={{ background: "#F9F6FF", borderRadius: 12, padding: 14, marginBottom: 18, border: `1px solid ${PB}` }}>
          <div style={{ fontSize: 12 }}><strong>Current Status:</strong> {statusTarget?.currentStatus || "—"}</div>
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
            ).map(s => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </div>

        {/* Eligibility notice when choosing Qualified */}
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
                  : "Customer has NOT passed eligibility check — confirm manually if overriding"}
              </span>
            </div>
          </div>
        )}

        <TextArea
          rows={3}
          value={statusNotes}
          onChange={(e) => setStatusNotes(e.target.value)}
          placeholder={`Notes about this status change...`}
          maxLength={500}
          showCount
          style={{ borderRadius: 10 }}
        />
      </Modal>
    </div>
  );
};

export default AdvisorLeads;