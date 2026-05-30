import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, User, Mail, Phone, Loader2, AlertCircle, CheckCircle,
  XCircle, Trash2, MoreVertical, Users,
} from "lucide-react";
import { apiService } from "@/api/apiService";
import CustomTable from "@/components/common/CustomTable";

const PURPLE = "#5C039B";

export default function PartnerAffiliatedAgents() {
  const navigate = useNavigate();

  const [agents, setAgents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalAgents, setTotalAgents]   = useState(0);
  const [openMenuId, setOpenMenuId]     = useState(null);
  const [activeTab, setActiveTab]       = useState("all");
  const [toast, setToast]               = useState(null);

  const [actionLoading, setActionLoading]   = useState(null);
  const [suspendModal, setSuspendModal]     = useState(null);
  const [deleteModal, setDeleteModal]       = useState(null);
  const [activateModal, setActivateModal]   = useState(null);
  const [approveModal, setApproveModal]     = useState(null);
  const [rejectModal, setRejectModal]       = useState(null);
  const [rejectReason, setRejectReason]     = useState("");
  const [suspendReason, setSuspendReason]   = useState("");

  const fetchAgents = async (page = 1, limit = 10, tab = activeTab) => {
    setLoading(true);
    try {
      let url = `/vault/agent/partner/agents?page=${page}&limit=${limit}`;
      if (tab === "active")   url += "&isActive=true";
      if (tab === "inactive") url += "&isActive=false";
      if (tab === "pending")  url += "&affiliationStatus=pending";

      const response = await apiService.get(url);
      const data = response?.data || response;

      let list = [];
      let total = 0;

      if (Array.isArray(data)) {
        list = data; total = data.length;
      } else if (data?.agents) {
        list = data.agents; total = data.total || data.agents.length;
      } else if (data?.data) {
        list = data.data; total = data.total || data.data.length;
      } else if (data?.docs) {
        list = data.docs; total = data.totalDocs || data.docs.length;
      }

      setAgents(list);
      setTotalAgents(total);
    } catch (err) {
      setError(err?.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents(currentPage, itemsPerPage, activeTab);
  }, [currentPage, itemsPerPage, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const getAgentId   = (row) => row._id || row.id;
  const getAgentName = (row) => {
    if (row.name?.first_name || row.name?.last_name)
      return `${row.name.first_name || ""} ${row.name.last_name || ""}`.trim();
    return `${row.first_name || ""} ${row.last_name || ""}`.trim() || "Agent";
  };

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApproveAffiliation = async () => {
    const id = getAgentId(approveModal);
    setActionLoading(id + "_approve");
    try {
      await apiService.post(`/vault/agent/partner/verify/${id}`, { action: "approve" });
      showToast("Affiliation approved successfully");
      fetchAgents(currentPage, itemsPerPage, activeTab);
      setApproveModal(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Approval failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectAffiliation = async () => {
    if (!rejectReason.trim()) { alert("Please provide a rejection reason."); return; }
    const id = getAgentId(rejectModal);
    setActionLoading(id + "_reject");
    try {
      await apiService.post(`/vault/agent/partner/verify/${id}`, { action: "reject", rejectionReason: rejectReason.trim() });
      showToast("Affiliation rejected");
      fetchAgents(currentPage, itemsPerPage, activeTab);
      setRejectModal(null);
      setRejectReason("");
    } catch (err) {
      alert(err?.response?.data?.message || "Rejection failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateConfirm = async () => {
    const id = getAgentId(activateModal);
    setActionLoading(id + "_activate");
    try {
      await apiService.post(`/vault/agent/activate/${id}`);
      showToast("Agent activated successfully ✅");
      if (activeTab === "inactive") {
        setAgents((prev) => prev.filter((a) => getAgentId(a) !== id));
        setTotalAgents((prev) => prev - 1);
      } else {
        setAgents((prev) => prev.map((a) => getAgentId(a) === id ? { ...a, isActive: true } : a));
      }
      setActivateModal(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Activation failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendConfirm = async () => {
    const id = getAgentId(suspendModal);
    setActionLoading(id + "_suspend");
    try {
      await apiService.post(`/vault/agent/suspend/${id}`, { reason: suspendReason });
      showToast("Agent suspended successfully ⚠️");
      if (activeTab === "active") {
        setAgents((prev) => prev.filter((a) => getAgentId(a) !== id));
        setTotalAgents((prev) => prev - 1);
      } else {
        setAgents((prev) => prev.map((a) => getAgentId(a) === id ? { ...a, isActive: false } : a));
      }
      setSuspendModal(null);
      setSuspendReason("");
    } catch (err) {
      alert(err?.response?.data?.message || "Suspension failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    const id = getAgentId(deleteModal);
    setActionLoading(id + "_delete");
    try {
      await apiService.delete(`/vault/agent/delete/${id}`);
      showToast("Agent deleted successfully 🗑️");
      setAgents((prev) => prev.filter((a) => getAgentId(a) !== id));
      setTotalAgents((prev) => prev - 1);
      setDeleteModal(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  const menuItemStyle = (color) => ({
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 12px", fontSize: 13, cursor: "pointer",
    color, borderBottom: "1px solid #F3F4F6",
  });

  const affiliationBadge = (status) => {
    const map = {
      verified: { bg: "#ECFDF5", color: "#059669", label: "Verified" },
      pending:  { bg: "#FFFBEB", color: "#D97706", label: "Pending" },
      rejected: { bg: "#FEF2F2", color: "#DC2626", label: "Rejected" },
    };
    const cfg = map[status] || { bg: "#F3F4F6", color: "#6B7280", label: status || "—" };
    return (
      <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
        {cfg.label}
      </span>
    );
  };

  const columns = [
    {
      key: "name",
      title: "Agent",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FAF5FF", border: "1.5px solid #E9D5FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={15} color={PURPLE} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{getAgentName(row)}</p>
            <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
              Affiliated Agent · {row.nationality || "—"}
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
            <span>{row.email || "N/A"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
            <Phone size={13} color="#9CA3AF" />
            <span>{row.phone?.country_code || ""} {row.phone?.number || "N/A"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "affiliation",
      title: "Affiliation",
      render: (_, row) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {affiliationBadge(row.affiliationStatus)}
          {row.affiliationStatus === "pending" && (
            <button
              onClick={() => setApproveModal(row)}
              style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}
            >
              Approve
            </button>
          )}
        </div>
      ),
    },
    {
      key: "completion",
      title: "Profile",
      render: (_, row) => {
        const pct = row.profileCompletionPercentage ?? 0;
        const color = pct === 100 ? "#059669" : pct >= 60 ? "#D97706" : "#DC2626";
        return (
          <div style={{ minWidth: 80 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: "#6B7280" }}>Complete</span>
              <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
            </div>
            <div style={{ height: 5, background: "#F3F4F6", borderRadius: 3 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (_, row) => {
        const isActive   = row.isActive === true;
        const isSuspended = !!row.suspendedAt;

        let label = "Pending";
        let bg = "#FFFBEB", color = "#D97706";
        if (isSuspended)      { label = "Suspended"; bg = "#FEF2F2"; color = "#DC2626"; }
        else if (isActive)    { label = "Active";    bg = "#ECFDF5"; color = "#059669"; }

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: bg, color }}>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: row.isVerified ? "#059669" : "#D97706" }}>
              {row.isVerified ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
              {row.isVerified ? "Verified" : "Unverified"}
            </div>
          </div>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (_, row) => {
        const id = getAgentId(row);
        const isActive = row.isActive === true;
        const isOpen   = openMenuId === id;

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => navigate(`/dashboard/vaultpartner/agents/${id}`)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 7, fontSize: 12, fontWeight: 600, color: PURPLE, cursor: "pointer" }}
            >
              <Eye size={13} /> View
            </button>

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setOpenMenuId(isOpen ? null : id)}
                style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}
              >
                <MoreVertical size={18} />
              </button>

              {isOpen && (
                <div style={{ position: "absolute", right: 0, top: 30, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", width: 190, zIndex: 10 }}>
                  {row.affiliationStatus === "pending" && (
                    <div onClick={() => { setApproveModal(row); setOpenMenuId(null); }} style={menuItemStyle("#2563EB")}>
                      <CheckCircle size={14} /> Approve Affiliation
                    </div>
                  )}
                  {row.affiliationStatus === "pending" && (
                    <div onClick={() => { setRejectModal(row); setRejectReason(""); setOpenMenuId(null); }} style={menuItemStyle("#DC2626")}>
                      <XCircle size={14} /> Reject Affiliation
                    </div>
                  )}
                  {!isActive && (
                    <div onClick={() => { setActivateModal(row); setOpenMenuId(null); }} style={menuItemStyle("#059669")}>
                      <CheckCircle size={14} /> Activate
                    </div>
                  )}
                  {isActive && (
                    <div onClick={() => { setSuspendModal(row); setSuspendReason(""); setOpenMenuId(null); }} style={menuItemStyle("#D97706")}>
                      <XCircle size={14} /> Suspend
                    </div>
                  )}
                  <div onClick={() => { setDeleteModal(row); setOpenMenuId(null); }} style={menuItemStyle("#DC2626")}>
                    <Trash2 size={14} /> Delete
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <AlertCircle size={44} color="#EF4444" style={{ marginBottom: 12 }} />
        <p style={{ color: "#B91C1C", marginBottom: 16, fontSize: 14 }}>{error}</p>
        <button onClick={() => fetchAgents(currentPage, itemsPerPage, activeTab)}
          style={{ padding: "9px 20px", background: PURPLE, color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", padding: "28px 24px" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, background: toast.type === "success" ? "#059669" : "#DC2626", color: "#fff", padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 9999, display: "flex", alignItems: "center", gap: 8 }}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>Affiliated Agents</h1>
            <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
              {totalAgents} {activeTab === "all" ? "total" : activeTab} affiliated agent{totalAgents !== 1 ? "s" : ""} in your network
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/vaultpartner/agents/onboard")}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: `linear-gradient(135deg, ${PURPLE}, #7c3aed)`, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: `0 4px 14px ${PURPLE}40` }}
          >
            + Onboard Agent
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid #E5E7EB", paddingBottom: 0 }}>
          {[
            { id: "all",      label: "All Agents" },
            { id: "active",   label: "Active" },
            { id: "inactive", label: "Inactive" },
            { id: "pending",  label: "Pending Approval" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{ padding: "0 4px 12px", background: "transparent", border: "none", borderBottom: activeTab === tab.id ? `2px solid ${PURPLE}` : "2px solid transparent", color: activeTab === tab.id ? PURPLE : "#6B7280", fontWeight: activeTab === tab.id ? 600 : 500, fontSize: 14, cursor: "pointer", transition: "all 0.2s ease" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <CustomTable
        columns={columns}
        data={agents}
        loading={loading}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalAgents}
        onPageChange={(page, size) => {
          setCurrentPage(page);
          if (size !== itemsPerPage) setItemsPerPage(size);
        }}
      />

      {/* Activate Modal */}
      {activateModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 380, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <CheckCircle size={22} color="#059669" />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Activate Agent?</h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 22 }}>
              Are you sure you want to activate <strong>{getAgentName(activateModal)}</strong>? They will regain access to the platform.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setActivateModal(null)} style={{ flex: 1, padding: "10px 0", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#374151", background: "#fff", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleActivateConfirm} disabled={!!actionLoading} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", background: "#059669", cursor: "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={14} />}
                Confirm Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 400, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <XCircle size={22} color="#D97706" />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Suspend Agent?</h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
              <strong>{getAgentName(suspendModal)}</strong> will not be able to access the platform.
            </p>
            <textarea
              rows={3}
              placeholder="Reason for suspension (optional)"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              style={{ width: "100%", borderRadius: 8, border: "1px solid #E5E7EB", padding: "10px 12px", fontSize: 13, resize: "vertical", marginBottom: 18, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSuspendModal(null)} style={{ flex: 1, padding: "10px 0", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#374151", background: "#fff", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSuspendConfirm} disabled={!!actionLoading} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", background: "#D97706", cursor: "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <XCircle size={14} />}
                Confirm Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 380, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Trash2 size={22} color="#DC2626" />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Delete Agent?</h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 22 }}>
              Permanently delete <strong>{getAgentName(deleteModal)}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteModal(null)} style={{ flex: 1, padding: "10px 0", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#374151", background: "#fff", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={!!actionLoading} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", background: "#DC2626", cursor: "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Affiliation Modal */}
      {approveModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 380, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <CheckCircle size={22} color="#2563EB" />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Approve Affiliation?</h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 22 }}>
              Approve <strong>{getAgentName(approveModal)}</strong> as an affiliated agent of your company?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setApproveModal(null)} style={{ flex: 1, padding: "10px 0", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#374151", background: "#fff", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleApproveAffiliation} disabled={!!actionLoading} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", background: "#2563EB", cursor: "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={14} />}
                Confirm Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Affiliation Modal */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 400, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <XCircle size={22} color="#DC2626" />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Reject Affiliation?</h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
              <strong>{getAgentName(rejectModal)}</strong> will be notified. They can re-register with a different partner.
            </p>
            <textarea
              rows={3}
              placeholder="Reason for rejection (required)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ width: "100%", borderRadius: 8, border: "1px solid #E5E7EB", padding: "10px 12px", fontSize: 13, resize: "vertical", marginBottom: 18, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setRejectModal(null)} style={{ flex: 1, padding: "10px 0", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#374151", background: "#fff", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleRejectAffiliation} disabled={!!actionLoading || !rejectReason.trim()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", background: !rejectReason.trim() ? "#FCA5A5" : "#DC2626", cursor: !rejectReason.trim() ? "not-allowed" : "pointer" }}>
                {actionLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <XCircle size={14} />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
