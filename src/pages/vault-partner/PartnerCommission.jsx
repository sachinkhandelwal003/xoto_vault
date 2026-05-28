import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign, Clock, CheckCircle, Wallet, TrendingUp,
  Activity, RefreshCw, Briefcase, FileText, Eye, Info, Users,
} from "lucide-react";
import {
  Spin, message, Tag, Button, Card, Row, Col, Empty, Modal, Descriptions, Divider,
} from "antd";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { apiService } from "@/api/apiService";
import { useSelector } from "react-redux";
import CustomTable from "@/components/common/CustomTable";

/* ─── Brand Colors ───────────────────────────────────────────── */
const P   = "#5C039B";
const PL  = "#f3e8ff";
const GN  = "#10b981";
const GNL = "#d1fae5";
const AM  = "#f59e0b";
const AML = "#fef3c7";
const BL  = "#3b82f6";
const BLL = "#dbeafe";

const BRAND_GRADIENT = "linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)";

const STATUS_STYLE = {
  Paid: { color: GN, bg: GNL, icon: <CheckCircle size={12} /> },
  Pending: { color: AM, bg: AML, icon: <Clock size={12} /> },
  Confirmed: { color: BL, bg: BLL, icon: <CheckCircle size={12} /> },
};

const PartnerCommission = () => {
  const { token } = useSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);

  const fetchCommissions = useCallback(async (page = 1, isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await apiService.get(`/vault/commissions/partner?page=${page}&limit=${pagination.pageSize}`);
      if (res.success) {
        setStats(res.summary);
        setData(res.data);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: res.total || res.summary?.totalCount || res.data.length,
        }));
      }
    } catch (err) {
      message.error("Failed to load partner commission data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.pageSize]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const showDetail = (record) => {
    setSelectedCommission(record);
    setDetailVisible(true);
  };

  const kpiCards = [
    { label: "Total Earned", value: `AED ${stats?.totalEarned?.toLocaleString() || 0}`, icon: Wallet, color: GN, bg: GNL },
    { label: "Pending Payout", value: `AED ${stats?.pending?.toLocaleString() || 0}`, icon: Clock, color: AM, bg: AML },
    { label: "Total Cases", value: stats?.totalCount || 0, icon: Briefcase, color: BL, bg: BLL },
    { label: "Paid Count", value: stats?.paidCount || 0, icon: CheckCircle, color: P, bg: PL },
  ];

  const columns = [
    {
      key: "commissionId",
      title: "Commission ID",
      render: (id) => <span className="font-bold text-purple-800 text-xs">{id}</span>,
    },
    {
      key: "caseReference",
      title: "Case Ref",
      render: (ref) => <span className="font-bold text-gray-700 text-xs">{ref}</span>,
    },
    {
      key: "customerName",
      title: "Customer",
      render: (name) => <span className="text-gray-600 font-medium text-xs">{name}</span>,
    },
    {
      key: "recipientName",
      title: "Agent",
      render: (name) => <span className="text-gray-500 font-bold text-xs">{name || "Self"}</span>,
    },
    {
      key: "formattedCommissionAmount",
      title: "Earned",
      render: (val) => <span className="font-black text-emerald-600 text-xs">{val}</span>,
    },
    {
      key: "status",
      title: "Status",
      render: (status) => {
        const style = STATUS_STYLE[status] || { color: "#6b7280", bg: "#f3f4f6", icon: <Activity size={12} /> };
        return (
          <Tag 
            className="rounded-full px-3 py-0.5 font-bold uppercase text-[10px] border-none flex items-center gap-1 w-fit"
            style={{ color: style.color, background: style.bg }}
          >
            {style.icon} {status}
          </Tag>
        );
      },
    },
    {
      key: "createdAt",
      title: "Date",
      render: (date) => <span className="text-gray-400 text-[11px] font-medium">{dayjs(date).format("MMM DD, YYYY")}</span>,
    },
    {
      key: "action",
      title: "",
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<Eye size={16} />} 
          className="text-purple-600 hover:bg-purple-50"
          onClick={() => showDetail(record)}
        />
      ),
    },
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#f9f8ff] flex items-center justify-center flex-col gap-4">
        <Spin size="large" />
        <p style={{ color: P }} className="font-bold animate-pulse">Loading Partner Earnings…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f8ff] p-5 sm:p-8">
      
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] p-8 mb-8 text-white shadow-xl"
        style={{ background: BRAND_GRADIENT }}
      >
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="text-white/70 text-sm font-medium mb-1">Partner Portal</div>
            <h1 className="text-2xl md:text-3xl font-black m-0 leading-tight">Commission Tracking</h1>
            <p className="text-white/80 mt-2 text-sm font-medium max-w-md">
              Review your partner commission summary, pending payouts, and referral earnings.
            </p>
          </div>
          <Button 
            icon={<RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />}
            onClick={() => fetchCommissions(1, true)}
            loading={refreshing}
            className="h-11 px-6 rounded-xl bg-white/20 border-white/40 text-white hover:bg-white/30 font-bold border"
          >
            Refresh Data
          </Button>
        </div>
      </motion.div>

      {/* ── KPI CARDS ──────────────────────────────────────────────────── */}
      <Row gutter={[20, 20]} className="mb-8">
        {kpiCards.map((card, i) => (
          <Col xs={24} sm={12} lg={6} key={card.label}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: card.bg }}>
                  <card.icon size={22} style={{ color: card.color }} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{card.label}</div>
                  <div className="text-2xl font-black text-gray-800">{card.value}</div>
                </div>
              </div>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* ── AGENT BREAKDOWN (If applicable) ─────────────────────────── */}
      {stats?.byAgent && Object.keys(stats.byAgent).length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users size={16} className="text-purple-600" /> Agency Earnings Breakdown
          </h3>
          <Row gutter={[16, 16]}>
            {Object.entries(stats.byAgent).map(([agentName, amount], i) => (
              <Col xs={12} sm={8} md={6} lg={4} key={agentName}>
                <Card className="rounded-xl border-none shadow-sm" bodyStyle={{ padding: "12px 16px" }}>
                  <div className="text-[10px] font-bold text-gray-400 truncate mb-1">{agentName}</div>
                  <div className="text-lg font-black text-purple-700">AED {Number(amount).toLocaleString()}</div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* ── COMMISSION RECORDS ────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-800 m-0 flex items-center gap-2">
            <FileText size={20} className="text-purple-600" /> Revenue Stream Activity
          </h3>
        </div>
        
        <CustomTable 
          columns={columns}
          data={data}
          loading={loading}
          totalItems={pagination.total}
          currentPage={pagination.current}
          itemsPerPage={pagination.pageSize}
          onPageChange={(page) => fetchCommissions(page)}
          showSearch={false}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        title={<div className="font-black text-lg py-2">Commission Breakdown</div>}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)} className="rounded-xl font-bold px-6 h-10">
            Close
          </Button>
        ]}
        width={700}
        className="rounded-[24px]"
      >
        {selectedCommission && (
          <div className="py-4">
            <div className="flex justify-between items-start mb-8 bg-purple-50 p-6 rounded-2xl">
              <div>
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Commission Reference</div>
                <div className="text-xl font-black text-purple-900">{selectedCommission.commissionId}</div>
              </div>
              <div className="text-right">
                <Tag 
                  className="rounded-full px-4 py-1 font-black uppercase text-xs border-none"
                  style={{ 
                    color: STATUS_STYLE[selectedCommission.status]?.color || "#6b7280", 
                    background: STATUS_STYLE[selectedCommission.status]?.bg || "#f3f4f6" 
                  }}
                >
                  {selectedCommission.status}
                </Tag>
                <div className="text-[10px] text-gray-400 mt-2 font-bold">{dayjs(selectedCommission.createdAt).format("DD MMM YYYY, HH:mm")}</div>
              </div>
            </div>

            <Row gutter={[32, 32]}>
              <Col span={12}>
                <h4 className="flex items-center gap-2 font-black text-gray-800 mb-4"><FileText size={16} className="text-purple-600" /> Case Info</h4>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={<span className="font-bold text-gray-400 text-xs">Reference</span>}>
                    <span className="font-bold text-gray-800">{selectedCommission.caseReference}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="font-bold text-gray-400 text-xs">Customer</span>}>
                    <span className="font-bold text-gray-800">{selectedCommission.customerName}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="font-bold text-gray-400 text-xs">Loan Amount</span>}>
                    <span className="font-black text-gray-800">{selectedCommission.formattedLoanAmount}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="font-bold text-gray-400 text-xs">Recipient Agent</span>}>
                    <span className="font-bold text-purple-600">{selectedCommission.recipientName || "Self / Partner"}</span>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              
              <Col span={12}>
                <h4 className="flex items-center gap-2 font-black text-gray-800 mb-4"><DollarSign size={16} className="text-emerald-600" /> Payout Calculation</h4>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase mb-2">Calculation Method</div>
                  <div className="font-bold text-emerald-800 italic text-xs mb-3">{selectedCommission.calculationFormula}</div>
                  <div className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Partner Net</div>
                  <div className="text-2xl font-black text-emerald-600">{selectedCommission.formattedCommissionAmount}</div>
                </div>
              </Col>
            </Row>

            {selectedCommission.notes && (
              <>
                <Divider className="my-6" />
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                  <h4 className="flex items-center gap-2 font-black text-blue-800 mb-2 text-xs uppercase tracking-wider">
                    <Info size={14} /> Official Notes
                  </h4>
                  <p className="text-sm text-blue-900 m-0 leading-relaxed font-medium italic">
                    "{selectedCommission.notes}"
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .ant-tag { margin-right: 0; }
        .ant-btn-primary { background: ${P} !important; border-color: ${P} !important; }
      `}</style>
    </div>
  );
};

export default PartnerCommission;
