// src/pages/vault-admin/mortgages/VaultMortgagelist.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, User, Mail, Phone, Loader2, AlertCircle, CheckCircle, XCircle, Trash2,
  Briefcase, MoreVertical, ShieldCheck, Calendar, TrendingUp, Building2, UserCog,
  PauseCircle, PlayCircle, FileText, Clock, Database
} from "lucide-react";
import { Tabs, Dropdown, Button, Modal, Select, Input, message, Space } from "antd";
import { apiService } from "@/api/apiService";
import CustomTable from "@/components/common/CustomTable";
import dayjs from "dayjs";

const PURPLE = "#5C039B";
const PURPLE_LIGHT = "#FAF5FF";
const PURPLE_BORDER = "#E9D5FF";

const VaultMortgageOpsList = () => {
  const navigate = useNavigate();

  const [opsList, setOpsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalOps, setTotalOps] = useState(0);

  // Filters & Tab State
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'active', 'suspended'

  // Action states (Modals & Loading)
  const [actionLoading, setActionLoading] = useState(null);
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [activateModal, setActivateModal] = useState(null);

  const DEPARTMENTS = [
    "Mortgage Operations", "Underwriting", "Processing",
    "Quality Assurance", "Compliance",
  ];

  const getOpsId = (row) => row._id || row.id;
  
  const getOpsName = (row) => {
    // Handle nested name object structure from backend
    if (row.name) {
      return `${row.name.first_name || ""} ${row.name.last_name || ""}`.trim() || "Operations Staff";
    }
    // Fallback for flat structure
    return `${row.first_name || ""} ${row.last_name || ""}`.trim() || "Operations Staff";
  };

  const getOpsEmail = (row) => row.email || "N/A";
  
  const getOpsPhone = (row) => {
    if (row.phone) {
      return `${row.phone.country_code || ""} ${row.phone.number || ""}`.trim();
    }
    return `${row.country_code || ""} ${row.phone_number || ""}`.trim() || "N/A";
  };

  const getOpsDepartment = (row) => row.department || "Mortgage Operations";
  
  const getOpsDesignation = (row) => row.designation || "Mortgage Operations Executive";
  
  const getCurrentApplications = (row) => row.workload?.currentApplications || row.currentApplications || 0;
  
  const getMaxCapacity = (row) => row.workload?.maxCapacity || row.maxCapacity || 30;
  
  const getQueueStatus = (row) => {
    const queue = row.queueStatus || {};
    return {
      pendingReview: queue.pendingReview || 0,
      inProgress: queue.inProgress || 0,
      waitingBank: queue.waitingBank || 0
    };
  };

  // ── Fetch Mortgage Ops ─────────────────────────────────────────────────────────────
  const fetchOps = useCallback(async (page = 1, limit = 10, tab = activeTab, searchTerm = search, dept = department) => {
    setLoading(true);
    try {
      let url = `/vault/ops/all?page=${page}&limit=${limit}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (dept && dept !== 'all') url += `&department=${encodeURIComponent(dept)}`;

      // Map tab to status filter
      if (tab === "active") url += `&status=active`;
      if (tab === "suspended") url += `&status=suspended`;

      const response = await apiService.get(url);
      const data = response?.data || response;

      let list = [];
      let total = 0;

      if (Array.isArray(data)) {
        list = data;
        total = response?.total || data.length;
      } else if (data?.opsList) {
        list = data.opsList;
        total = data.total || data.opsList.length;
      } else if (data?.users) {
        list = data.users;
        total = data.total || data.users.length;
      } else if (data?.data && Array.isArray(data.data)) {
        list = data.data;
        total = data.total || data.data.length;
      } else if (data?.docs) {
        list = data.docs;
        total = data.totalDocs || data.docs.length;
      }

      setOpsList(list);
      setTotalOps(total);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load mortgage operations staff");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, department]);

  // Re-fetch when dependencies change
  useEffect(() => {
    fetchOps(currentPage, itemsPerPage, activeTab, search, department);
  }, [currentPage, itemsPerPage, activeTab, search, department, fetchOps]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleDepartmentChange = (value) => {
    setDepartment(value || "");
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setDepartment("");
    setActiveTab("all");
    setCurrentPage(1);
  };

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleActivateConfirm = async () => {
    const id = getOpsId(activateModal);
    setActionLoading(id + "_activate");
    try {
      await apiService.post(`/vault/ops/activate/${id}`);
      message.success(`Staff "${getOpsName(activateModal)}" activated successfully ✅`);

      if (activeTab === "suspended") {
        setOpsList(prev => prev.filter(a => getOpsId(a) !== id));
        setTotalOps(prev => prev - 1);
      } else {
        setOpsList(prev =>
          prev.map(a => getOpsId(a) === id ? { ...a, isActive: true, suspendedAt: null } : a)
        );
      }
      setActivateModal(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Activation failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendConfirm = async () => {
    const id = getOpsId(suspendModal);
    setActionLoading(id + "_suspend");
    try {
      await apiService.post(`/vault/ops/suspend/${id}`, {
        suspensionReason: suspendReason.trim(),
      });
      message.success(`Staff "${getOpsName(suspendModal)}" suspended successfully ⚠️`);

      if (activeTab === "active") {
        setOpsList(prev => prev.filter(a => getOpsId(a) !== id));
        setTotalOps(prev => prev - 1);
      } else {
        setOpsList(prev =>
          prev.map(a => getOpsId(a) === id ? { ...a, isActive: false, suspendedAt: new Date() } : a)
        );
      }
      setSuspendModal(null);
      setSuspendReason("");
    } catch (err) {
      message.error(err?.response?.data?.message || "Suspension failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    const id = getOpsId(deleteModal);
    setActionLoading(id + "_delete");
    try {
      await apiService.delete(`/vault/ops/delete/${id}`);
      message.success(`Staff "${getOpsName(deleteModal)}" deleted successfully 🗑️`);
      setOpsList(prev => prev.filter(a => getOpsId(a) !== id));
      setTotalOps(prev => prev - 1);
      setDeleteModal(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Columns Definition ────────────────────────────────────────────────────────────
  const columns = [
    {
      key: "name",
      title: "Staff Member",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", background: PURPLE_LIGHT,
            border: `1.5px solid ${PURPLE_BORDER}`, display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0
          }}>
            {row.profilePic ? (
              <img src={row.profilePic} alt="avatar" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <User size={18} color={PURPLE} />
            )}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
              {getOpsName(row)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      title: "Contact Info",
      render: (_, row) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
            <Mail size={13} color="#9CA3AF" />
            <span>{getOpsEmail(row)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
            <Phone size={13} color="#9CA3AF" />
            <span>{getOpsPhone(row)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      title: "Department",
      render: (_, row) => (
        <div>
          <span style={{
            padding: "4px 10px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            background: "#F3E8FF",
            color: PURPLE
          }}>
            {getOpsDepartment(row)}
          </span>
        </div>
      )
    },
    {
      key: "joinDate",
      title: "Join Date",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
          <Calendar size={13} color="#9CA3AF" />
          <span>{row.joinDate ? dayjs(row.joinDate).format("DD MMM YYYY") : "—"}</span>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_, row) => {
        const suspended = row.suspendedAt !== null && row.suspendedAt !== undefined;
        const active = row.isActive === true && !suspended;

        let statusLabel = "Active";
        let bg = "#ECFDF5";
        let color = "#059669";

        if (suspended) {
          statusLabel = "Suspended";
          bg = "#FEF2F2";
          color = "#DC2626";
        } else if (!active) {
          statusLabel = "Inactive";
          bg = "#FFFBEB";
          color = "#D97706";
        }

        return (
          <span style={{
            padding: "3px 10px",
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 600,
            background: bg,
            color
          }}>
            {statusLabel}
          </span>
        );
      }
    },
    {
      key: "actions",
      title: "Actions",
      render: (_, row) => {
        const id = getOpsId(row);
        const suspended = row.suspendedAt !== null && row.suspendedAt !== undefined;
        const isActive = row.isActive === true && !suspended;

        const items = [];

        if (suspended || !isActive) {
          items.push({
            key: 'activate',
            label: 'Activate',
            icon: <PlayCircle size={14} />,
            onClick: () => setActivateModal(row),
            style: { color: '#059669' }
          });
        }

        if (isActive && !suspended) {
          items.push({
            key: 'suspend',
            label: 'Suspend',
            icon: <PauseCircle size={14} />,
            onClick: () => setSuspendModal(row),
            style: { color: '#D97706' }
          });
        }

        items.push({
          key: 'delete',
          label: 'Delete',
          icon: <Trash2 size={14} />,
          onClick: () => setDeleteModal(row),
          danger: true,
        });

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* View Button */}
            <Button
              onClick={() => navigate(`/dashboard/vault-admin/mortgage-ops/${id}`)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: PURPLE_LIGHT, borderColor: PURPLE_BORDER,
                borderRadius: 7, fontSize: 12, fontWeight: 600, color: PURPLE,
              }}
              size="small"
            >
              <Eye size={13} /> View
            </Button>

            {/* Menu Dropdown */}
            <Dropdown menu={{ items }} trigger={['click']}>
              <Button
                type="text"
                icon={<MoreVertical size={18} color="#6B7280" />}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Dropdown>
          </div>
        );
      }
    }
  ];

  // Filter bar component
  const FilterBar = () => (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 24,
      border: `1px solid ${PURPLE_BORDER}`, display: "flex", flexWrap: "wrap",
      alignItems: "center", gap: 12, justifyContent: "space-between"
    }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, flex: 1, alignItems: "center" }}>
        <Input
          placeholder="Search by name, email or employee code..."
          value={search}
          onChange={handleSearch}
          style={{ width: 280, height: 38, borderRadius: 10 }}
          allowClear
        />
        <Select
          placeholder="All Departments"
          value={department || undefined}
          onChange={handleDepartmentChange}
          style={{ width: 200, height: 38 }}
          allowClear
          options={[
            { value: "", label: "All Departments" },
            ...DEPARTMENTS.map(d => ({ value: d, label: d }))
          ]}
        />
        <Button
          onClick={resetFilters}
          style={{
            height: 38, borderRadius: 10, border: `1px solid #E5E7EB`,
            fontSize: 13, background: "#fff", color: "#6B7280"
          }}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", padding: "28px 24px" }}>
      <style>{`
        .ops-tabs .ant-tabs-tab-active {
          background-color: ${PURPLE} !important;
          border-color: ${PURPLE} !important;
        }
        .ops-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: white !important;
        }
        .ops-tabs .ant-tabs-tab:hover {
          color: ${PURPLE} !important;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>Mortgage Ops Accounts</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            {totalOps} {activeTab === "all" ? "total" : activeTab} staff member{totalOps !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/vault-admin/mortgage-ops/create")}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
            background: `linear-gradient(135deg, ${PURPLE}, #7c3aed)`,
            color: "#fff", border: "none", borderRadius: 10, fontSize: 13,
            fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: `0 4px 14px ${PURPLE}40`,
          }}
        >
          <UserCog size={16} /> Onboard Mortgage Ops
        </button>
      </div>

      {/* Custom Tabs */}
      <div className="ops-tabs" style={{ marginBottom: 20 }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          items={[
            { key: "all", label: "All Staff" },
            { key: "active", label: "Active" },
            { key: "suspended", label: "Suspended" }
          ]}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Table */}
      <CustomTable
        columns={columns}
        data={opsList}
        loading={loading}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalOps}
        onPageChange={(page, size) => {
          setCurrentPage(page);
          if (size !== itemsPerPage) setItemsPerPage(size);
        }}
      />

      {/* ==================== MODALS ==================== */}

      {/* Activate Confirmation Modal */}
      <Modal
        open={!!activateModal}
        onCancel={() => setActivateModal(null)}
        footer={null}
        centered
        width={380}
        bodyStyle={{ textAlign: 'center', padding: '24px 16px' }}
      >
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <CheckCircle size={22} color="#059669" />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Activate Staff Member?</h2>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 22 }}>
          Are you sure you want to activate <strong>{activateModal ? getOpsName(activateModal) : ""}</strong>? They will be granted access.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Button onClick={() => setActivateModal(null)} style={{ flex: 1, height: 40, borderRadius: 10 }}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleActivateConfirm}
            loading={actionLoading === (activateModal ? getOpsId(activateModal) + "_activate" : "")}
            style={{ flex: 1, height: 40, borderRadius: 10, background: "#059669", borderColor: "#059669" }}
          >
            Confirm Activate
          </Button>
        </div>
      </Modal>

      {/* Suspend Confirmation Modal */}
      <Modal
        open={!!suspendModal}
        onCancel={() => { setSuspendModal(null); setSuspendReason(""); }}
        footer={null}
        centered
        width={420}
        bodyStyle={{ padding: '24px 16px' }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PauseCircle size={20} color="#D97706" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Suspend Staff Member</h2>
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
          You are about to suspend <strong>{suspendModal ? getOpsName(suspendModal) : ""}</strong>. They will lose access until reactivated.
        </p>
        <label style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 6, fontSize: 13 }}>Suspension Reason <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span></label>
        <Input.TextArea
          rows={3}
          placeholder="e.g. Under performance review, pending documentation…"
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
          maxLength={300}
          style={{ width: "100%", borderRadius: 10, marginBottom: 20 }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <Button onClick={() => { setSuspendModal(null); setSuspendReason(""); }} style={{ flex: 1, height: 40, borderRadius: 10 }}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSuspendConfirm}
            loading={actionLoading === (suspendModal ? getOpsId(suspendModal) + "_suspend" : "")}
            style={{ flex: 1, height: 40, borderRadius: 10, background: "#D97706", borderColor: "#D97706" }}
          >
            Confirm Suspension
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteModal}
        onCancel={() => setDeleteModal(null)}
        footer={null}
        centered
        width={380}
        bodyStyle={{ textAlign: 'center', padding: '24px 16px' }}
      >
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <Trash2 size={22} color="#DC2626" />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Delete Staff Member?</h2>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 22 }}>
          Are you sure you want to permanently delete <strong>{deleteModal ? getOpsName(deleteModal) : ""}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Button onClick={() => setDeleteModal(null)} style={{ flex: 1, height: 40, borderRadius: 10 }}>Cancel</Button>
          <Button
            type="primary"
            danger
            onClick={handleDeleteConfirm}
            loading={actionLoading === (deleteModal ? getOpsId(deleteModal) + "_delete" : "")}
            style={{ flex: 1, height: 40, borderRadius: 10 }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default VaultMortgageOpsList;