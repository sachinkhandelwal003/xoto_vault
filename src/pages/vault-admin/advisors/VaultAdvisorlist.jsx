// src/pages/Advisor/VaultAdvisorlist.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, User, Mail, Phone, Loader2, AlertCircle, CheckCircle, XCircle, Trash2,
  Briefcase, MoreVertical, ShieldCheck, Calendar, TrendingUp, Building2, UserCog,
  PauseCircle, PlayCircle
} from "lucide-react";
import { Tabs, Dropdown, Button, Modal, Input, Space, message } from "antd";
import { apiService } from "@/api/apiService";
import CustomTable from "@/components/common/CustomTable";
import dayjs from "dayjs";

const PURPLE = "#5C039B";
const PURPLE_LIGHT = "#FAF5FF";
const PURPLE_BORDER = "#E9D5FF";

const VaultAdvisorlist = () => {
  const navigate = useNavigate();

  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalAdvisors, setTotalAdvisors] = useState(0);

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
    "Mortgage Advisory", "Sales", "Operations",
    "Compliance", "Customer Service",
  ];

  const getAdvisorId = (row) => row._id || row.id;
  
  const getAdvisorName = (row) => {
    // Handle nested name object structure from backend
    if (row.name) {
      return `${row.name.first_name || ""} ${row.name.last_name || ""}`.trim() || "Advisor";
    }
    // Fallback for flat structure
    return `${row.first_name || ""} ${row.last_name || ""}`.trim() || "Advisor";
  };

  const getAdvisorEmail = (row) => row.email || "N/A";
  
  const getAdvisorPhone = (row) => {
    if (row.phone) {
      return `${row.phone.country_code || ""} ${row.phone.number || ""}`.trim();
    }
    return `${row.country_code || ""} ${row.phone_number || ""}`.trim() || "N/A";
  };

  const getAdvisorDepartment = (row) => row.department || "—";
  
  const getAdvisorDesignation = (row) => row.designation || "Advisor";
  
  const getCurrentLeads = (row) => row.workload?.currentLeads || row.currentLeads || 0;
  
  const getMaxLeadsCapacity = (row) => row.workload?.maxLeadsCapacity || row.maxLeadsCapacity || 0;



  // â”€â”€ Fetch Advisors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchAdvisors = useCallback(async (page = 1, limit = 10, tab = activeTab, searchTerm = search, dept = department) => {
    setLoading(true);
    try {
      let url = `/vault/advisor/all?page=${page}&limit=${limit}`;
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
      } else if (data?.advisors) {
        list = data.advisors;
        total = data.total || data.advisors.length;
      } else if (data?.data && Array.isArray(data.data)) {
        list = data.data;
        total = data.total || data.data.length;
      } else if (data?.docs) {
        list = data.docs;
        total = data.totalDocs || data.docs.length;
      }

      setAdvisors(list);
      setTotalAdvisors(total);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load advisors");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, department]);

  // Re-fetch when dependencies change
  useEffect(() => {
    fetchAdvisors(currentPage, itemsPerPage, activeTab, search, department);
  }, [currentPage, itemsPerPage, activeTab, search, department, fetchAdvisors]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleDepartmentChange = (value) => {
    setDepartment(value);
    setCurrentPage(1);
  };

  const handleActivateConfirm = async () => {
    const id = getAdvisorId(activateModal);
    setActionLoading(id + "_activate");
    try {
      await apiService.post(`/vault/advisor/activate/${id}`);
      message.success(`Advisor "${getAdvisorName(activateModal)}" activated successfully`);

      if (activeTab === "suspended") {
        setAdvisors(prev => prev.filter(a => getAdvisorId(a) !== id));
        setTotalAdvisors(prev => prev - 1);
      } else {
        setAdvisors(prev =>
          prev.map(a => getAdvisorId(a) === id ? { ...a, isActive: true, suspendedAt: null } : a)
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
    const id = getAdvisorId(suspendModal);
    setActionLoading(id + "_suspend");
    try {
      await apiService.post(`/vault/advisor/suspend/${id}`, {
        suspensionReason: suspendReason.trim(),
      });
      message.success(`Advisor "${getAdvisorName(suspendModal)}" suspended successfully`);

      if (activeTab === "active") {
        setAdvisors(prev => prev.filter(a => getAdvisorId(a) !== id));
        setTotalAdvisors(prev => prev - 1);
      } else {
        setAdvisors(prev =>
          prev.map(a => getAdvisorId(a) === id ? { ...a, isActive: false, suspendedAt: new Date() } : a)
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
    const id = getAdvisorId(deleteModal);
    setActionLoading(id + "_delete");
    try {
      await apiService.delete(`/vault/advisor/delete/${id}`);
      message.success(`Advisor "${getAdvisorName(deleteModal)}" deleted successfully`);
      setAdvisors(prev => prev.filter(a => getAdvisorId(a) !== id));
      setTotalAdvisors(prev => prev - 1);
      setDeleteModal(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  // ————————————————————————————————————————————————————————————————————————————————
  const columns = [
    {
      key: "name",
      title: "Advisor",
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
              {getAdvisorName(row)}
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
            <span>{getAdvisorEmail(row)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
            <Phone size={13} color="#9CA3AF" />
            <span>{getAdvisorPhone(row)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      title: "Department",
      filterable: true,
      filterOptions: DEPARTMENTS.map(d => ({ value: d, label: d })),
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
            {getAdvisorDepartment(row)}
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
        const id = getAdvisorId(row);
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
              onClick={() => navigate(`/dashboard/vault-admin/advisor/${id}`)}
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

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", padding: "28px 24px" }}>
      <style>{`
        .advisor-tabs .ant-tabs-tab-active {
          background-color: ${PURPLE} !important;
          border-color: ${PURPLE} !important;
        }
        .advisor-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: white !important;
        }
        .advisor-tabs .ant-tabs-tab:hover {
          color: ${PURPLE} !important;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>Xoto Advisor Accounts</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            {totalAdvisors} {activeTab === "all" ? "total" : activeTab} advisor{totalAdvisors !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/vault-admin/create/vault-advisor")}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
            background: `linear-gradient(135deg, ${PURPLE}, #7c3aed)`,
            color: "#fff", border: "none", borderRadius: 10, fontSize: 13,
            fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: `0 4px 14px ${PURPLE}40`,
          }}
        >
          <UserCog size={16} /> Onboard Advisor
        </button>
      </div>

      {/* Custom Tabs */}
      <div className="advisor-tabs" style={{ marginBottom: 20 }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          items={[
            { key: "all", label: "All Advisors" },
            { key: "active", label: "Active" },
            { key: "suspended", label: "Suspended" }
          ]}
        />
      </div>

      {/* Table */}
      <CustomTable
        columns={columns}
        data={advisors}
        loading={loading}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalAdvisors}
        onPageChange={(page, size) => {
          setCurrentPage(page);
          if (size !== itemsPerPage) setItemsPerPage(size);
        }}
        showSearch={true}
        onFilter={(tblFilters) => {
          setSearch(tblFilters.search ?? '');
          setDepartment(tblFilters.department ?? '');
          setCurrentPage(1);
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
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Activate Advisor?</h2>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 22 }}>
          Are you sure you want to activate <strong>{activateModal ? getAdvisorName(activateModal) : ""}</strong>? They will be granted access.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Button onClick={() => setActivateModal(null)} style={{ flex: 1, height: 40, borderRadius: 10 }}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleActivateConfirm}
            loading={actionLoading === (activateModal ? getAdvisorId(activateModal) + "_activate" : "")}
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
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Suspend Advisor</h2>
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
          You are about to suspend <strong>{suspendModal ? getAdvisorName(suspendModal) : ""}</strong>. They will lose access until reactivated.
        </p>
        <label style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 6, fontSize: 13 }}>Suspension Reason <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span></label>
        <Input.TextArea
          rows={3}
          placeholder="e.g. Under compliance review, awaiting documentation…"
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
            loading={actionLoading === (suspendModal ? getAdvisorId(suspendModal) + "_suspend" : "")}
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
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Delete Advisor?</h2>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 22 }}>
          Are you sure you want to permanently delete <strong>{deleteModal ? getAdvisorName(deleteModal) : ""}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Button onClick={() => setDeleteModal(null)} style={{ flex: 1, height: 40, borderRadius: 10 }}>Cancel</Button>
          <Button
            type="primary"
            danger
            onClick={handleDeleteConfirm}
            loading={actionLoading === (deleteModal ? getAdvisorId(deleteModal) + "_delete" : "")}
            style={{ flex: 1, height: 40, borderRadius: 10 }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default VaultAdvisorlist;