import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, User, Mail, Phone, Loader2, AlertCircle, CheckCircle, 
  Clock, Building2, DollarSign, FileText, Inbox, 
  Calendar, TrendingUp, Banknote, ArrowRight, RefreshCw
} from "lucide-react";
import { apiService } from "@/api/apiService";
import { fmtAED } from '@/utils/format';
import CustomTable from "@/components/common/CustomTable";
import dayjs from "dayjs";
import { Card, Tag, Badge, Progress, Space, Modal, Descriptions, Alert, Button, Select, Input } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from "@ant-design/icons";

const PURPLE = "#5C039B";
const PURPLE_LIGHT = "#FAF5FF";
const PURPLE_BORDER = "#E9D5FF";

const QueueCases = () => {
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCases, setTotalCases] = useState(0);
  const [summary, setSummary] = useState({
    urgentCount: 0,
    overdueCount: 0,
    normalCount: 0,
    totalInQueue: 0,
    avgQueueHours: 0
  });
  const [availableBanks, setAvailableBanks] = useState([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, urgent, overdue
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Action states
  const [actionLoading, setActionLoading] = useState(null);
  const [pickupModal, setPickupModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [toast, setToast] = useState(null);

  // Get case ID
  const getCaseId = (row) => row._id || row.id;

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Format currency
  const formatCurrency = (value) => fmtAED(value, 'AED 0');

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    return dayjs(date).format("DD MMM YYYY, hh:mm A");
  };

  // Get queue status badge
  const getQueueStatusBadge = (status) => {
    if (status === 'urgent') {
      return { color: "#DC2626", bg: "#FEF2F2", text: "Urgent", icon: <WarningOutlined /> };
    }
    if (status === 'overdue') {
      return { color: "#D97706", bg: "#FFFBEB", text: "Overdue", icon: <ClockCircleOutlined /> };
    }
    return { color: "#059669", bg: "#ECFDF5", text: "Normal", icon: <CheckCircleOutlined /> };
  };

  // Fetch Queue Cases
  const fetchQueueCases = useCallback(async (page = 1, limit = 10, status = statusFilter, searchTerm = search, bank = bankFilter) => {
    setLoading(true);
    try {
      let url = `/vault/cases/ops/queue?page=${page}&limit=${limit}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (bank && bank !== 'all') url += `&bank=${encodeURIComponent(bank)}`;
      if (status === 'urgent') url += `&urgent=true`;
      if (status === 'overdue') url += `&overdue=true`;

      const response = await apiService.get(url);
      
      if (response?.success) {
        setCases(response.data || []);
        setTotalCases(response.total || 0);
        setSummary(response.summary || {
          urgentCount: 0,
          overdueCount: 0,
          normalCount: 0,
          totalInQueue: 0,
          avgQueueHours: 0
        });
        setAvailableBanks(response.filters?.availableBanks || []);
      } else {
        showToast(response?.message || "Failed to load queue applications", "error");
      }
    } catch (err) {
      console.error("Error fetching queue:", err);
      showToast(err?.response?.data?.message || "Failed to load queue applications", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, bankFilter]);

  useEffect(() => {
    fetchQueueCases(currentPage, itemsPerPage, statusFilter, search, bankFilter);
  }, [currentPage, itemsPerPage, statusFilter, search, bankFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueueCases(currentPage, itemsPerPage, statusFilter, search, bankFilter);
    }, 30000);
    return () => clearInterval(interval);
  }, [currentPage, itemsPerPage, statusFilter, search, bankFilter, fetchQueueCases]);

  // Handle search
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Handle bank filter
  const handleBankFilter = (value) => {
    setBankFilter(value);
    setCurrentPage(1);
  };

  // Handle status tab change
  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setBankFilter("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchQueueCases(currentPage, itemsPerPage, statusFilter, search, bankFilter);
  };

  // Pick up case
  const handlePickUpConfirm = async () => {
    const id = getCaseId(pickupModal);
    setActionLoading(id + "_pickup");
    try {
      const response = await apiService.post(`/vault/cases/ops/pickup/${id}`);
      if (response?.success) {
        showToast(`Application "${pickupModal.caseReference}" picked up successfully âœ…`);
        setPickupModal(null);
        fetchQueueCases(currentPage, itemsPerPage, statusFilter, search, bankFilter);
        // Navigate to review page
      } else {
        showToast(response?.message || "Pickup failed", "error");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Pickup failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // View case details
  const handleViewCase = (row) => {
    setViewModal(row);
  };

 

  // Columns Definition for CustomTable
  const columns = [
    {
      key: "caseReference",
      title: "Application ID",
      render: (_, row) => (
        <div style={{ padding: "4px 0" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: PURPLE }}>
            {row.caseReference}
          </p>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
            Created: {dayjs(row.createdAt).format("DD MMM YYYY, hh:mm A")}
          </p>
        </div>
      ),
    },
    {
      key: "clientInfo",
      title: "Client Info",
      render: (_, row) => (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
            <User size={13} color="#9CA3AF" />
            <span style={{ fontWeight: 500 }}>{row.clientFullName || "N/A"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            <Mail size={12} color="#9CA3AF" />
            <span>{row.clientEmail || "N/A"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            <Phone size={12} color="#9CA3AF" />
            <span>{row.clientMobile || "N/A"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "loanDetails",
      title: "Loan Details",
      render: (_, row) => (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
            <Banknote size={13} color="#9CA3AF" />
            <span style={{ fontWeight: 500 }}>{formatCurrency(row.requestedLoanAmount)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            <Building2 size={12} color="#9CA3AF" />
            <span>{row.selectedBank || "N/A"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            <TrendingUp size={12} color="#9CA3AF" />
            <span>{row.interestRate}% • EMI: {formatCurrency(row.monthlyEMI)}</span>
          </div>
        </div>
      ),
    },
    // {
    //   key: "documents",
    //   title: "Documents",
    //   render: (_, row) => {
    //     const percentage = row.documentCompletion || 0;
    //     const uploaded = row.documentsUploaded || 0;
    //     const total = row.documentsTotal || 0;
    //     return (
    //       <div style={{ minWidth: 120 }}>
    //         <Progress 
    //           percent={Math.round(percentage)} 
    //           size="small" 
    //           strokeColor={percentage === 100 ? "#10b981" : PURPLE}
    //           format={(percent) => `${percent}%`}
    //         />
    //         <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
    //           {uploaded} / {total} uploaded
    //         </p>
    //       </div>
    //     );
    //   }
    // },
    {
      key: "submittedBy",
      title: "Submitted By",
      render: (_, row) => (
        <div>
          <Tag color="purple" style={{ fontSize: 11, marginBottom: 4 }}>
            {row.submittedByRole === 'advisor' ? 'Xoto Advisor' : 
             row.submittedByRole === 'partner' ? 'Partner' : 
             row.submittedByRole === 'admin' ? 'Admin' : 'System'}
          </Tag>
          <p style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>
            {row.submittedByName || 'System'}
          </p>
        </div>
      )
    },
    {
      key: "queueTime",
      title: "Queue Time",
      render: (_, row) => {
        const hours = row.hoursInQueue || 0;
        const status = getQueueStatusBadge(row.queueStatus);
        return (
          <div>
            <Badge 
              color={status.color} 
              text={
                <span style={{ color: status.color, fontWeight: 500 }}>
                  {status.text}
                </span>
              }
            />
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
              <Clock size={12} color="#9CA3AF" />
              <span style={{ fontSize: 12, color: "#6B7280" }}>{hours} hours</span>
            </div>
            {row.daysInQueue > 0 && (
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>({row.daysInQueue} days)</span>
            )}
          </div>
        );
      }
    },
    {
      key: "actions",
      title: "Actions",
      render: (_, row) => {
        const id = getCaseId(row);
        const isOpen = openMenuId === id;

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* View Button */}
            <button
              onClick={() => handleViewCase(row)}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "6px 10px",
                background: PURPLE_LIGHT, border: `1px solid ${PURPLE_BORDER}`,
                borderRadius: 7, fontSize: 12, fontWeight: 600, color: PURPLE,
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <Eye size={13} /> View Application
            </button>

            {/* Pickup Button */}
            <button
              onClick={() => setPickupModal(row)}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "6px 10px",
                background: PURPLE, border: "none",
                borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#fff",
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <CheckCircle size={13} /> Pick Up
            </button>

            {/* Review Button */}
      

            {/* Menu Dropdown */}
            {/* <div style={{ position: "relative" }}>
              <button
                onClick={() => setOpenMenuId(isOpen ? null : id)}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                  <circle cx="12" cy="12" r="1" fill="#6B7280" />
                  <circle cx="12" cy="5" r="1" fill="#6B7280" />
                  <circle cx="12" cy="19" r="1" fill="#6B7280" />
                </svg>
              </button>

              {isOpen && (
                <div style={{
                  position: "absolute", right: 0, top: 30, background: "#fff",
                  border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  width: 160, zIndex: 10
                }}>
                  <div
                    onClick={() => { handleReviewCase(id); setOpenMenuId(null); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                      fontSize: 13, cursor: "pointer", color: PURPLE,
                      borderBottom: "1px solid #F3F4F6"
                    }}
                  >
                    <ArrowRight size={14} /> Review Case
                  </div>
                </div>
              )}
            </div> */}
          </div>
        );
      }
    }
  ];

  // Stats Cards Component
  const StatsCards = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "16px 20px",
        border: `1px solid ${PURPLE_BORDER}`, display: "flex", alignItems: "center", gap: 12
      }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: PURPLE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Inbox size={22} color={PURPLE} />
        </div>
        <div>
          <p style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{summary.totalInQueue}</p>
          <p style={{ fontSize: 12, color: "#6B7280" }}>Total in Queue</p>
        </div>
      </div>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "16px 20px",
        border: `1px solid #FDE68A`, display: "flex", alignItems: "center", gap: 12
      }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Clock size={22} color="#D97706" />
        </div>
        <div>
          <p style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{summary.overdueCount}</p>
          <p style={{ fontSize: 12, color: "#6B7280" }}>{`Overdue (>24h)`}</p>
        </div>
      </div>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "16px 20px",
        border: `1px solid #FECACA`, display: "flex", alignItems: "center", gap: 12
      }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AlertCircle size={22} color="#DC2626" />
        </div>
        <div>
          <p style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{summary.urgentCount}</p>
          <p style={{ fontSize: 12, color: "#6B7280" }}>{`Urgent (>48h)`}</p>
        </div>
      </div>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "16px 20px",
        border: `1px solid #D1FAE5`, display: "flex", alignItems: "center", gap: 12
      }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TrendingUp size={22} color="#059669" />
        </div>
        <div>
          <p style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{summary.avgQueueHours}</p>
          <p style={{ fontSize: 12, color: "#6B7280" }}>Avg Queue Hours</p>
        </div>
      </div>
    </div>
  );

  // Filter Bar Component
  const FilterBar = () => (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 24,
      border: `1px solid ${PURPLE_BORDER}`, display: "flex", flexWrap: "wrap",
      alignItems: "center", gap: 12, justifyContent: "space-between"
    }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, flex: 1 }}>
        <Input
          placeholder="Search by application ID or client name..."
          value={search}
          onChange={handleSearch}
          style={{ width: 260 }}
          allowClear
          prefix={<User size={14} />}
        />
        <Select
          placeholder="Filter by Bank"
          value={bankFilter || undefined}
          onChange={handleBankFilter}
          style={{ width: 180 }}
          allowClear
        >
          <Select.Option value="all">All Banks</Select.Option>
          {availableBanks.map(bank => (
            <Select.Option key={bank} value={bank}>{bank}</Select.Option>
          ))}
        </Select>
        <Select
          placeholder="Queue Status"
          value={statusFilter}
          onChange={handleStatusChange}
          style={{ width: 160 }}
        >
          <Select.Option value="all">All Applications</Select.Option>
          <Select.Option value="overdue">Overdue (24-48h)</Select.Option>
          <Select.Option value="urgent">Urgent </Select.Option>
        </Select>
        <Button onClick={resetFilters}>Reset Filters</Button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "#6B7280", background: PURPLE_LIGHT, padding: "6px 12px", borderRadius: 8 }}>
          Auto-refreshes every 30s
        </span>
        <Button 
          icon={<RefreshCw size={14} />} 
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      </div>
    </div>
  );

  // View Modal
  const renderViewModal = () => {
    if (!viewModal) return null;

    const requiredDocs = viewModal.documentStatus?.requiredDocuments || [];
    const uploadedCount = viewModal.documentsUploaded || 0;
    const totalCount = viewModal.documentsTotal || 0;
    const completionPercentage = viewModal.documentCompletion || 0;
    const queueStatus = getQueueStatusBadge(viewModal.queueStatus);

    return (
      <Modal
        title={`Application Details: ${viewModal.caseReference}`}
        open={!!viewModal}
        onCancel={() => setViewModal(null)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setViewModal(null)}>Close</Button>,
          <Button 
            key="pickup" 
            type="primary" 
            onClick={() => {
              setViewModal(null);
              setPickupModal(viewModal);
            }}
            style={{ background: PURPLE }}
          >
            Pick Up Application
          </Button>,
          <Button 
            key="review" 
            onClick={() => {
              setViewModal(null);
              handleReviewCase(viewModal._id);
            }}
          >
            Review Application
          </Button>
        ]}
      >
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {/* Queue Status Banner */}
          <Alert
            message={`Queue Status: ${queueStatus.text}`}
            description={`Application has been in queue for ${viewModal.hoursInQueue} hours`}
            type={viewModal.queueStatus === 'urgent' ? 'error' : viewModal.queueStatus === 'overdue' ? 'warning' : 'success'}
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* Client Information */}
          <Card title="Client Information" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 2 }} size="small">
              <Descriptions.Item label="Full Name">{viewModal.clientInfo?.fullName || viewModal.clientFullName}</Descriptions.Item>
              <Descriptions.Item label="Email">{viewModal.clientInfo?.email || viewModal.clientEmail}</Descriptions.Item>
              <Descriptions.Item label="Mobile">{viewModal.clientInfo?.mobile || viewModal.clientMobile}</Descriptions.Item>
              <Descriptions.Item label="Nationality">{viewModal.clientInfo?.nationality}</Descriptions.Item>
              <Descriptions.Item label="Marital Status">{viewModal.clientInfo?.maritalStatus}</Descriptions.Item>
              <Descriptions.Item label="Dependents">{viewModal.clientInfo?.numberOfDependents}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Loan Information */}
          <Card title="Loan Information" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 2 }} size="small">
              <Descriptions.Item label="Loan Amount">{formatCurrency(viewModal.requestedLoanAmount)}</Descriptions.Item>
              <Descriptions.Item label="Interest Rate">{viewModal.interestRate}%</Descriptions.Item>
              <Descriptions.Item label="Tenure">{viewModal.loanInfo?.tenureYears} years</Descriptions.Item>
              <Descriptions.Item label="Selected Bank">{viewModal.selectedBank}</Descriptions.Item>
              <Descriptions.Item label="Monthly EMI">{formatCurrency(viewModal.monthlyEMI)}</Descriptions.Item>
              <Descriptions.Item label="LTV Ratio">{viewModal.propertyInfo?.ltvPercentage}%</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Property Information */}
          <Card title="Property Information" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Property Value">{formatCurrency(viewModal.propertyInfo?.propertyValue)}</Descriptions.Item>
              <Descriptions.Item label="Property Type">{viewModal.propertyInfo?.propertyType}</Descriptions.Item>
              <Descriptions.Item label="Area">{viewModal.propertyInfo?.propertyAddress?.area}</Descriptions.Item>
              <Descriptions.Item label="Building">{viewModal.propertyInfo?.propertyAddress?.building || "N/A"}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Document Status */}
          <Card title="Document Status" size="small">
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Progress 
                type="circle" 
                percent={Math.round(completionPercentage)} 
                width={100}
                strokeColor={completionPercentage === 100 ? "#10b981" : PURPLE}
              />
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 13 }}>{uploadedCount} / {totalCount} documents uploaded</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {requiredDocs.slice(0, 10).map((doc, idx) => (
                <Tag 
                  key={idx}
                  color={doc.isUploaded ? "green" : "orange"}
                  icon={doc.isUploaded ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                >
                  {doc.documentType?.replace(/_/g, " ").toUpperCase()}
                </Tag>
              ))}
            </div>
          </Card>
        </div>
      </Modal>
    );
  };

  // Pickup Confirmation Modal
  const renderPickupModal = () => {
    if (!pickupModal) return null;

    return (
      <Modal
        title="Confirm Application Pickup"
        open={!!pickupModal}
        onCancel={() => setPickupModal(null)}
        footer={[
          <Button key="cancel" onClick={() => setPickupModal(null)}>Cancel</Button>,
          <Button 
            key="pickup" 
            type="primary" 
            loading={actionLoading === (getCaseId(pickupModal) + "_pickup")}
            onClick={handlePickUpConfirm}
            style={{ background: PURPLE }}
          >
            Confirm Pickup
          </Button>
        ]}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: PURPLE }} />
          <h3 style={{ marginTop: 16, marginBottom: 8 }}>Pick up this application?</h3>
          <Descriptions bordered column={1} size="small" style={{ marginTop: 16, textAlign: "left" }}>
            <Descriptions.Item label="Application ID">{pickupModal.caseReference}</Descriptions.Item>
            <Descriptions.Item label="Client">{pickupModal.clientFullName}</Descriptions.Item>
            <Descriptions.Item label="Bank">{pickupModal.selectedBank}</Descriptions.Item>
            <Descriptions.Item label="Loan Amount">{formatCurrency(pickupModal.requestedLoanAmount)}</Descriptions.Item>
            <Descriptions.Item label="Time in Queue">{pickupModal.hoursInQueue} hours</Descriptions.Item>
          </Descriptions>
          <Alert 
            message="Once you pick up this application, it will be assigned to you and removed from the queue."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      </Modal>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", padding: "28px 24px" }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          display: "flex", alignItems: "center", gap: 8,
          background: toast.type === "success" ? "#059669" : "#DC2626",
          color: "#fff", padding: "12px 16px", borderRadius: 10,
          fontSize: 13, fontWeight: 600, boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          
        }}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>Ops Queue</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
          View and pick up pending mortgage applications
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Filter Bar */}
      <FilterBar />

      {/* Table */}
      <CustomTable
        columns={columns}
        data={cases}
        loading={loading}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalCases}
        onPageChange={(page, size) => {
          setCurrentPage(page);
          if (size !== itemsPerPage) setItemsPerPage(size);
        }}
      />

      {/* Modals */}
      {renderViewModal()}
      {renderPickupModal()}

      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        .ant-progress-text {
          font-size: 10px !important;
        }
        .ant-table-row {
          transition: background 0.2s;
        }
      `}</style>
    </div>
  );
};

export default QueueCases;