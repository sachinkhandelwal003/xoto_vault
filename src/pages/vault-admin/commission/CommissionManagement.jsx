import React, { useState, useEffect, useCallback } from "react";
import {
  Table, Tag, Button, Input, Select, message, Spin, Card, Row, Col, Modal, Descriptions, Badge, Divider,
} from "antd";
import {
  DollarSign, Clock, CheckCircle, AlertCircle, Search, Filter, Eye, CreditCard, Landmark, FileText, RefreshCw,
} from "lucide-react";
import { apiService } from "@/api/apiService";
import dayjs from "dayjs";
import CustomTable from "@/components/common/CustomTable";

const { Option } = Select;

const P = "#5C039B";
const PL = "#F5F0FF";

const STATUS_COLORS = {
  Pending: { color: "gold", icon: <Clock size={14} /> },
  Confirmed: { color: "blue", icon: <CheckCircle size={14} /> },
  Paid: { color: "green", icon: <CheckCircle size={14} /> },
  Failed: { color: "red", icon: <AlertCircle size={14} /> },
};

const CommissionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  
  // Detail Modal State
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Confirm Modal State
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmNotes, setConfirmNotes] = useState("");

  // Payment Modal State
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentReference: "",
    paymentMethod: "Bank Transfer",
    notes: "",
  });

  const fetchCommissions = useCallback(async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.pageSize.toString(),
      });
      
      const status = filters.status || statusFilter;
      const searchVal = filters.search || search;

      if (status && status !== "all") params.append("status", status);
      if (searchVal) params.append("search", searchVal);
      
      const res = await apiService.get(`/vault/commissions/admin/all?${params.toString()}`);
      if (res.success) {
        setData(res.data);
        setSummary(res.summary);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: res.total,
        }));
      }
    } catch (err) {
      message.error("Failed to load commissions");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, pagination.pageSize]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const handleFilter = (filters) => {
    if (filters.status) setStatusFilter(filters.status);
    if (filters.search !== undefined) setSearch(filters.search);
    fetchCommissions(1, filters);
  };

  const fetchDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await apiService.get(`/vault/commissions/admin/${id}`);
      if (res.success) {
        setSelectedCommission(res.data);
        setDetailVisible(true);
      }
    } catch (err) {
      message.error("Failed to load commission details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConfirmCommission = async () => {
    setConfirmLoading(true);
    try {
      const res = await apiService.post(`/vault/commissions/admin/${selectedCommission._id}/confirm`, {
        notes: confirmNotes
      });
      if (res.success) {
        message.success("Commission confirmed successfully");
        setConfirmVisible(false);
        setDetailVisible(false);
        setConfirmNotes("");
        fetchCommissions(pagination.current);
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Confirmation failed");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!paymentForm.paymentReference) {
      return message.warning("Please enter a payment reference");
    }
    setProcessing(true);
    try {
      const res = await apiService.post(
        `/vault/commissions/admin/${selectedCommission._id}/process-payment`,
        paymentForm
      );
      if (res.success) {
        message.success("Payment processed successfully");
        setPaymentVisible(false);
        setDetailVisible(false);
        fetchCommissions(pagination.current);
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Payment processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      key: "commissionId",
      title: "ID / Reference",
      sortable: true,
      render: (id, record) => (
        <div>
          <div className="font-bold text-purple-800 text-xs">{id}</div>
          <div className="text-[10px] text-gray-400 font-mono">{record.caseReference}</div>
        </div>
      ),
    },
    {
      key: "recipientName",
      title: "Recipient",
      sortable: true,
      render: (name, record) => (
        <div>
          <div className="font-bold text-gray-800 text-xs">{name}</div>
          <Tag className="text-[10px] uppercase font-bold border-none px-2 py-0" 
               style={{ background: PL, color: P }}>
            {record.recipientRole.replace("_", " ")}
          </Tag>
        </div>
      ),
    },
    {
      key: "formattedLoanAmount",
      title: "Loan Amount",
      sortable: true,
      render: (val) => <span className="font-bold text-gray-700 text-xs">{val}</span>,
    },
    {
      key: "bankCommissionToXoto",
      title: "Bank Commission",
      sortable: true,
      render: (val) => <span className="text-blue-600 font-bold text-xs">AED {val.toLocaleString()}</span>,
    },
    {
      key: "formattedCommissionAmount",
      title: "Recipient Commission",
      sortable: true,
      render: (val) => <span className="text-emerald-600 font-black text-xs">{val}</span>,
    },
    {
      key: "xotoNetProfit",
      title: "Xoto Profit",
      sortable: true,
      render: (val) => <span className="text-purple-600 font-black text-xs">AED {val?.toLocaleString() || 0}</span>,
    },
    {
      key: "status",
      title: "Status",
      filterable: true,
      filterOptions: [
        { label: "Pending", value: "Pending" },
        { label: "Confirmed", value: "Confirmed" },
        { label: "Paid", value: "Paid" },
        { label: "Failed", value: "Failed" },
      ],
      render: (status) => {
        const config = STATUS_COLORS[status] || { color: "default" };
        return (
          <Tag color={config.color} className="rounded-full px-3 py-0.5 font-bold uppercase text-[10px] flex items-center gap-1 w-fit">
            {config.icon} {status}
          </Tag>
        );
      },
    },
    {
      key: "createdAt",
      title: "Date",
      sortable: true,
      render: (date) => <span className="text-gray-400 text-[11px] font-medium">{dayjs(date).format("MMM DD, YYYY")}</span>,
    },
    {
      key: "action",
      title: "Action",
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<Eye size={16} />} 
          className="text-purple-600 hover:bg-purple-50"
          onClick={() => fetchDetail(record._id)}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f7ff] p-5 sm:p-8">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900 m-0">Commission Management</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor, verify and process payouts for agents and partners.</p>
        </div>

        {/* Stats Summary */}
        <Row gutter={[20, 20]} className="mb-8">
          {[
            { label: "Total Revenue", value: summary?.totalBankCommission, icon: Landmark, color: "blue" },
            { label: "Recipient Payouts", value: summary?.totalCommissionAmount, icon: DollarSign, color: "emerald" },
            { label: "Xoto Net Profit", value: summary?.xotoNetProfit, icon: CheckCircle, color: "purple" },
            { label: "Pending Payouts", value: summary?.byStatus?.pending, icon: Clock, color: "orange" },
          ].map((s, i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card className="rounded-2xl border-none shadow-sm overflow-hidden relative" bodyStyle={{ padding: "20px 24px" }}>
                <div className={`absolute top-0 right-0 p-6 opacity-10 text-${s.color}-600`}>
                  <s.icon size={48} />
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{s.label}</div>
                <div className={`text-2xl font-black text-${s.color}-600`}>AED {s.value?.toLocaleString() || 0}</div>
                <div className="text-[10px] text-gray-400 mt-1 font-medium italic">Auto-calculated from disbursed cases</div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* CustomTable implementation */}
        <CustomTable 
          columns={columns}
          data={data}
          loading={loading}
          totalItems={pagination.total}
          currentPage={pagination.current}
          itemsPerPage={pagination.pageSize}
          onPageChange={(page, size) => fetchCommissions(page)}
          onFilter={handleFilter}
          showSearch={true}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        title={<div className="font-black text-lg py-2">Commission Detail</div>}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
        className="rounded-[24px]"
      >
        {selectedCommission && (
          <div className="py-4">
            <div className="flex justify-between items-start mb-8 bg-purple-50 p-6 rounded-2xl">
              <div>
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Commission ID</div>
                <div className="text-xl font-black text-purple-900">{selectedCommission.commissionId}</div>
              </div>
              <div className="text-right">
                <Tag color={STATUS_COLORS[selectedCommission.status]?.color} className="rounded-full px-4 py-1 font-black uppercase text-xs">
                  {selectedCommission.status}
                </Tag>
                <div className="text-[10px] text-gray-400 mt-2 font-bold">{dayjs(selectedCommission.createdAt).format("DD MMM YYYY, HH:mm")}</div>
              </div>
            </div>

            <Row gutter={[32, 32]}>
              <Col span={12}>
                <h4 className="flex items-center gap-2 font-black text-gray-800 mb-4"><FileText size={16} className="text-purple-600" /> Case Information</h4>
                <Descriptions column={1} size="small" bordered={false}>
                  <Descriptions.Item label={<span className="font-bold text-gray-400 text-xs">Case Ref</span>}>
                    <span className="font-bold text-gray-800">{selectedCommission.caseReference}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="font-bold text-gray-400 text-xs">Customer</span>}>
                    <span className="font-bold text-gray-800">{selectedCommission.customerName}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="font-bold text-gray-400 text-xs">Loan Amount</span>}>
                    <span className="font-black text-gray-800">{selectedCommission.formattedLoanAmount}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="font-bold text-gray-400 text-xs">Disbursed At</span>}>
                    <span className="font-bold text-gray-600">{dayjs(selectedCommission.disbursedAt).format("DD MMM YYYY")}</span>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              
              <Col span={12}>
                <h4 className="flex items-center gap-2 font-black text-gray-800 mb-4"><CreditCard size={16} className="text-emerald-600" /> Recipient & Payout</h4>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={<span className="font-bold text-gray-400 text-xs">Recipient</span>}>
                    <div className="font-bold text-gray-800">{selectedCommission.recipientName}</div>
                    <div className="text-[10px] text-gray-400">{selectedCommission.recipientId?.email}</div>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="font-bold text-gray-400 text-xs">Calculation</span>}>
                    <div className="font-bold text-emerald-600 italic text-xs">{selectedCommission.calculationFormula}</div>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="font-bold text-gray-400 text-xs">Recipient Net</span>}>
                    <span className="text-lg font-black text-emerald-600">{selectedCommission.formattedCommissionAmount}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="font-bold text-gray-400 text-xs">Xoto Net</span>}>
                    <span className="text-lg font-black text-purple-600">AED {selectedCommission.xotoNetProfit?.toLocaleString()}</span>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            <Divider className="my-6" />

            <div className="bg-gray-50 p-6 rounded-2xl mb-8">
              <h4 className="flex items-center gap-2 font-black text-gray-800 mb-4"><Landmark size={16} className="text-blue-600" /> Bank Details (Recipient Payout)</h4>
              <Row gutter={24}>
                <Col span={12}>
                  <div className="mb-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Beneficiary Name</div>
                    <div className="font-bold text-gray-700">{selectedCommission.payoutBankDetails?.beneficiaryName || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">IBAN</div>
                    <div className="font-bold text-gray-700 font-mono">{selectedCommission.payoutBankDetails?.iban || "N/A"}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="mb-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Bank Name</div>
                    <div className="font-bold text-gray-700">{selectedCommission.payoutBankDetails?.bankName || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">SWIFT / BIC</div>
                    <div className="font-bold text-gray-700 font-mono">{selectedCommission.payoutBankDetails?.swiftCode || "N/A"}</div>
                  </div>
                </Col>
              </Row>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button size="large" className="rounded-xl font-bold px-8 h-12" onClick={() => setDetailVisible(false)}>Close</Button>
              
              {selectedCommission.status === "Pending" && (
                <Button 
                  type="primary" 
                  size="large" 
                  className="rounded-xl font-black px-10 h-12 bg-purple-700 border-none shadow-lg"
                  onClick={() => setConfirmVisible(true)}
                >
                  Confirm Commission
                </Button>
              )}

              {selectedCommission.status === "Confirmed" && (
                <Button 
                  type="primary" 
                  size="large" 
                  className="rounded-xl font-black px-10 h-12 bg-emerald-600 border-none shadow-lg"
                  onClick={() => setPaymentVisible(true)}
                >
                  Process Payout
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Commission Modal */}
      <Modal
        title={<div className="font-black text-lg py-2 text-purple-900">Confirm Commission</div>}
        open={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onOk={handleConfirmCommission}
        confirmLoading={confirmLoading}
        okText="Verify & Confirm"
        okButtonProps={{ className: "bg-purple-700 border-none font-bold rounded-xl h-10 px-6" }}
        cancelButtonProps={{ className: "rounded-xl h-10 px-6" }}
        width={500}
      >
        <div className="py-4">
          <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div className="text-xs text-purple-700 font-bold mb-1 uppercase tracking-wider">Verification Step</div>
            <p className="text-sm text-purple-900 m-0 leading-relaxed">
              Please verify that the bank commission received matches this record before confirming for payout.
            </p>
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2 uppercase">Verification Notes</label>
            <Input.TextArea 
              placeholder="e.g. Commission confirmed - amount matches bank statement" 
              className="rounded-xl"
              rows={4}
              value={confirmNotes}
              onChange={e => setConfirmNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Payout Processing Modal */}
      <Modal
        title={<div className="font-black text-lg py-2">Process Payout</div>}
        open={paymentVisible}
        onCancel={() => setPaymentVisible(false)}
        onOk={handleProcessPayment}
        confirmLoading={processing}
        okText="Confirm Payout"
        okButtonProps={{ className: "bg-purple-700 border-none font-bold rounded-xl h-10 px-6" }}
        cancelButtonProps={{ className: "rounded-xl h-10 px-6" }}
        width={500}
      >
        <div className="py-4">
          <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="text-xs text-emerald-700 font-medium mb-1">Amount to Pay</div>
            <div className="text-2xl font-black text-emerald-600">{selectedCommission?.formattedCommissionAmount}</div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2 uppercase">Payment Reference (e.g. TRF ID)</label>
              <Input 
                placeholder="Enter bank transfer reference" 
                className="rounded-xl h-11 font-mono"
                value={paymentForm.paymentReference}
                onChange={e => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2 uppercase">Payment Method</label>
              <Select 
                className="w-full" 
                size="large"
                value={paymentForm.paymentMethod}
                onChange={val => setPaymentForm({ ...paymentForm, paymentMethod: val })}
              >
                <Option value="Bank Transfer">Bank Transfer</Option>
                <Option value="Cheque">Cheque</Option>
                <Option value="Other">Other</Option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2 uppercase">Internal Notes</label>
              <Input.TextArea 
                placeholder="Add any internal notes about this payment" 
                className="rounded-xl"
                rows={3}
                value={paymentForm.notes}
                onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        .vault-admin-table .ant-table-thead > tr > th { background: #faf5ff; color: #9ca3af; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; border-bottom: 1px solid #f3f4f6; }
        .vault-admin-table .ant-table-tbody > tr > td { border-bottom: 1px solid #f9fafb; padding: 14px 16px !important; }
        .vault-admin-table .ant-table-tbody > tr:hover > td { background: #f9f8ff !important; }
        .ant-modal-content { border-radius: 24px !important; padding: 24px !important; }
        .ant-modal-header { border-bottom: none !important; margin-bottom: 0 !important; }
      `}</style>
    </div>
  );
};

export default CommissionManagement;
