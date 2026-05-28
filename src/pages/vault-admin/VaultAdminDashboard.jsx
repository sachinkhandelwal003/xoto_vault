import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Legend,
} from "recharts";
import {
  Users, UserCheck, FolderOpen, TrendingUp, Clock, Handshake,
  Building2, AlertCircle, RefreshCw, Activity, DollarSign,
  Zap, Shield, Layers, ArrowRight, Target,
} from "lucide-react";
import {
  Spin, message, Tag, Button, Card, Row, Col, Progress, Table, Empty,
} from "antd";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { apiService } from "@/api/apiService";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

/* ─── Brand Colors ───────────────────────────────────────────── */
const P   = "#5C039B";
const PL  = "#f3e8ff";
const GN  = "#10b981";
const GNL = "#d1fae5";
const AM  = "#f59e0b";
const AML = "#fef3c7";
const BL  = "#3b82f6";
const BLL = "#dbeafe";
const RD  = "#ef4444";
const RDL = "#fee2e2";
const CY  = "#06b6d4";
const CYL = "#cffafe";

const BRAND_GRADIENT = "linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)";
const PIE_COLORS     = [BL, CY, GN, AM, P, "#059669", RD];

/* ─── Helpers ───────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-3 py-2 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || P }} className="font-semibold m-0">
          {p.name}: {prefix}{p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

/* ─── KPI Card Component ────────────────────────────────────── */
const KPICard = ({ label, value, icon: Icon, color, bg, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="h-full"
  >
    <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 hover:shadow-md transition-all h-full" style={{ borderTopColor: color }}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
          <div className="text-2xl font-black" style={{ color }}>{value}</div>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  </motion.div>
);

const VaultAdminDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ── API Fetch ── */
  const fetchStats = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await apiService.get("/vault/statistics/admin/stats");
      if (res?.data) {
        setStats(res.data);
      } else {
        message.error("Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      message.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  /* ── Derived Data ── */
  const kpis         = stats?.kpis              ?? {};
  const graphs       = stats?.graphs            ?? {};
  const ops          = stats?.opsMonitoring      ?? {};
  const adv          = stats?.advisorMonitoring  ?? {};
  const recentLeads  = stats?.recentLeads       ?? [];
  const recentCases  = stats?.recentCases       ?? [];

  const kpiCards = [
    { label: "Total Leads",      value: kpis.totalLeads ?? 0,       icon: Target,      color: BL,  bg: BLL },
    { label: "Unassigned",       value: kpis.unassignedLeads ?? 0,  icon: Zap,         color: P,   bg: PL  },
    { label: "Active Cases",     value: kpis.activeCases ?? 0,      icon: FolderOpen,  color: AM,  bg: AML },
    { label: "Disbursed",        value: kpis.disbursedCases ?? 0,   icon: DollarSign,  color: GN,  bg: GNL },
    { label: "Conversion Rate",  value: `${(kpis.conversionRate ?? 0).toFixed(1)}%`,icon: TrendingUp, color: CY, bg: CYL },
    { label: "SLA Breached",     value: kpis.slaBreachedLeads ?? 0, icon: AlertCircle, color: RD,  bg: RDL },
  ];

  const timelineData = (graphs.leadsOverTime ?? []).map((d) => ({
    name: dayjs(d.date).format("DD MMM"),
    Leads: d.count,
    Cases: (graphs.casesOverTime ?? []).find((c) => c.date === d.date)?.count ?? 0,
  }));

  const commissionData = (graphs.commissionSummary ?? []).map((d) => ({
    name: d.status,
    amount: d.amount,
  }));

  const leadColumns = [
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (text) => <span className="font-bold text-gray-800">{text}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag className="rounded-full px-3 py-0.5 text-[10px] font-bold border-none" 
             style={{ background: status === "New" ? BLL : PL, color: status === "New" ? BL : P }}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => <span className="text-gray-400 text-[11px]">{dayjs(date).format("MMM DD, HH:mm")}</span>,
    },
    {
      title: "",
      key: "action",
      render: (_, record) => (
        <Button size="small" type="text" className="text-purple-600 font-bold hover:bg-purple-50"
                onClick={() => navigate(`/dashboard/vault-admin/leads/${record._id}`)}>
          View
        </Button>
      ),
    },
  ];

  const caseColumns = [
    {
      title: "Reference",
      dataIndex: "caseReference",
      key: "caseReference",
      render: (text) => <span className="font-bold text-gray-800">{text}</span>,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (text) => <span className="text-gray-500 text-xs">{text}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag className="rounded-full px-3 py-0.5 text-[10px] font-bold border-none" 
             style={{ background: status === "Disbursed" ? GNL : AML, color: status === "Disbursed" ? GN : AM }}>
          {status}
        </Tag>
      ),
    },
    {
      title: "",
      key: "action",
      render: (_, record) => (
        <Button size="small" type="text" className="text-purple-600 font-bold hover:bg-purple-50"
                onClick={() => navigate(`/dashboard/vault-admin/case/view/${record._id}`)}>
          View
        </Button>
      ),
    },
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#f9f8ff] flex items-center justify-center flex-col gap-4">
        <Spin size="large" />
        <p style={{ color: P }} className="font-bold animate-pulse">Loading VAULT Intelligence…</p>
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
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="text-white/70 text-sm font-medium mb-1">{dayjs().format("dddd, DD MMMM YYYY")}</div>
            <h1 className="text-2xl md:text-3xl font-black m-0 leading-tight">Welcome back, {user?.name || "Admin"}!</h1>
            <p className="text-white/80 mt-2 text-sm md:text-base font-medium max-w-md">
              Here is the real-time operational pulse of VAULT.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              icon={<RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />}
              onClick={() => fetchStats(true)}
              loading={refreshing}
              className="h-11 px-6 rounded-xl bg-white/20 border-white/40 text-white hover:bg-white/30 font-bold border"
            >
              Sync Data
            </Button>
            <Button 
              onClick={() => navigate("/dashboard/vault-admin/leads/create")}
              className="h-11 px-6 rounded-xl bg-white text-purple-700 border-none font-black shadow-lg hover:scale-105 transition-transform"
            >
              New Lead
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── KPI CARDS ──────────────────────────────────────────────────── */}
      <Row gutter={[20, 20]} className="mb-8">
        {kpiCards.map((card, i) => (
          <Col xs={12} sm={8} lg={4} key={card.label}>
            <KPICard {...card} delay={i * 0.05} />
          </Col>
        ))}
      </Row>

      {/* ── MONITORING + TIMELINE ─────────────────────────────────────── */}
      <Row gutter={[20, 20]} className="mb-8">
        {/* Timeline Chart */}
        <Col xs={24} xl={16}>
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-gray-800 m-0 flex items-center gap-2">
                <Activity size={20} className="text-purple-600" /> Activity Timeline
              </h3>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> <span className="text-[10px] font-bold text-gray-400">LEADS</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-600" /> <span className="text-[10px] font-bold text-gray-400">CASES</span></div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="lGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BL} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={BL} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={P} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={P} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Leads" stroke={BL} strokeWidth={3} fill="url(#lGrad)" />
                <Area type="monotone" dataKey="Cases" stroke={P} strokeWidth={3} fill="url(#cGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Col>

        {/* Monitoring Cards */}
        <Col xs={24} xl={8}>
          <div className="flex flex-col gap-5 h-full">
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Ops Monitoring</h3>
              <Row gutter={[12, 12]}>
                {[
                  { label: "Available", value: ops.availableOps, icon: UserCheck, color: GN, bg: GNL },
                  { label: "Queue", value: ops.queueCount, icon: Layers, color: P, bg: PL },
                ].map(item => (
                  <Col span={12} key={item.label}>
                    <div className="p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all hover:scale-105" style={{ background: item.bg }}>
                      <item.icon size={18} style={{ color: item.color }} className="mb-2" />
                      <div className="text-2xl font-black" style={{ color: item.color }}>{item.value ?? 0}</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase">{item.label}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Advisor Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-bold text-gray-600">Avg Leads/Advisor</span>
                  <span className="text-lg font-black text-purple-700">{adv.avgLeadsPerAdvisor ?? 0}</span>
                </div>
                <Progress percent={75} showInfo={false} strokeColor={BRAND_GRADIENT} className="mb-4" />
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <div className="text-emerald-600 font-black text-xl">{adv.availableAdvisors ?? 0}</div>
                    <div className="text-[9px] font-bold text-emerald-700 uppercase">Available</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                    <div className="text-orange-600 font-black text-xl">{adv.overloadedAdvisors ?? 0}</div>
                    <div className="text-[9px] font-bold text-orange-700 uppercase">Overloaded</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── SECOND ROW: Funnel + Commission + Network ────────────────── */}
      <Row gutter={[20, 20]} className="mb-8">
        <Col xs={24} lg={8}>
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
              <Target size={20} className="text-blue-500" /> Lead Pipeline
            </h3>
            <div className="space-y-5">
              {[
                { label: "New", count: stats?.leadStatus?.new, color: BL },
                { label: "Contacted", count: stats?.leadStatus?.contacted, color: CY },
                { label: "Qualified", count: stats?.leadStatus?.qualified, color: GN },
                { label: "In Process", count: (stats?.leadStatus?.collectingDocuments || 0) + (stats?.leadStatus?.applicationOpened || 0), color: P },
              ].map(item => {
                const total = kpis.totalLeads || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-gray-500">{item.label}</span>
                      <span className="text-xs font-black" style={{ color: item.color }}>{item.count} <span className="text-gray-300 font-medium">({pct}%)</span></span>
                    </div>
                    <Progress percent={pct} strokeColor={item.color} showInfo={false} size={{ height: 8 }} />
                  </div>
                );
              })}
            </div>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-500" /> Commission Revenue
            </h3>
            {commissionData.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={commissionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip prefix="AED " />} />
                  <Bar dataKey="amount" name="Revenue" fill={P} radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No revenue data" />}
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
              <Handshake size={20} className="text-orange-500" /> Partner Network
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Referral Partners", value: kpis.totalFreelanceAgents ?? 0, color: P, bg: PL, icon: Users },
                { label: "Partners", value: kpis.totalPartners ?? 0, color: BL, bg: BLL, icon: Building2 },
                { label: "Advisors", value: kpis.totalAdvisors ?? 0, color: GN, bg: GNL, icon: UserCheck },
                { label: "Ops Team", value: kpis.totalOpsExecutives ?? 0, color: AM, bg: AML, icon: Shield },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-2xl flex flex-col items-center justify-center text-center" style={{ background: item.bg }}>
                  <item.icon size={18} style={{ color: item.color }} className="mb-2" />
                  <div className="text-2xl font-black" style={{ color: item.color }}>{item.value ?? 0}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase leading-tight">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Network Size</div>
                <div className="text-xl font-black text-gray-800">
                  {(kpis.totalFreelanceAgents || 0) + (kpis.totalPartners || 0) + (kpis.totalAdvisors || 0) + (kpis.totalOpsExecutives || 0)}
                </div>
              </div>
              <Button type="text" className="text-purple-600 font-bold flex items-center gap-1">
                Manage <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── TABLES ROW: Recent Leads & Cases ─────────────────────────── */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-800 m-0">Recent Leads</h3>
              <Button type="link" className="text-purple-600 font-bold p-0" onClick={() => navigate("/dashboard/vault-admin/vault/agent-leads")}>
                View All <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
            <Table 
              columns={leadColumns} 
              dataSource={recentLeads.map(l => ({ ...l, key: l._id }))} 
              pagination={false} 
              size="middle"
              className="vault-table"
            />
          </div>
        </Col>

        <Col xs={24} lg={12}>
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-800 m-0">Recent Cases</h3>
              <Button type="link" className="text-purple-600 font-bold p-0" onClick={() => navigate("/dashboard/vault-admin/case/view/all")}>
                View All <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
            <Table 
              columns={caseColumns} 
              dataSource={recentCases.map(c => ({ ...c, key: c._id }))} 
              pagination={false} 
              size="middle"
              className="vault-table"
            />
          </div>
        </Col>
      </Row>

      <style>{`
        .vault-table .ant-table-thead > tr > th { background: #f9fafb; color: #9ca3af; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; border-bottom: 1px solid #f3f4f6; }
        .vault-table .ant-table-tbody > tr > td { border-bottom: 1px solid #f9fafb; padding: 12px 16px !important; }
        .vault-table .ant-table-tbody > tr:hover > td { background: #f9f8ff !important; }
        .ant-progress-inner { background-color: #f3f4f6 !important; }
        .ant-btn-primary { background: ${P} !important; border-color: ${P} !important; }
      `}</style>
    </div>
  );
};

export default VaultAdminDashboard;
