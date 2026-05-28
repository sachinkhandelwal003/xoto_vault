import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Row, Col, Button, Tag, Space, Spin, message, Divider, Empty, Progress, Avatar, Table,
} from "antd";
import {
  UserAddOutlined, WalletOutlined, FileTextOutlined,
  CheckCircleOutlined, ClockCircleOutlined, DollarOutlined,
  ReloadOutlined, TeamOutlined, TrophyOutlined,
  LineChartOutlined, PieChartOutlined, ArrowRightOutlined,
} from "@ant-design/icons";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import { apiService } from "@/api/apiService";
import dayjs from "dayjs";
import type { RootState } from "@/store/store";

const P   = "#5C039B";
const PL  = "#f3e8ff";
const BL  = "#03A4F4";
const BLL = "#dbeafe";
const GN  = "#10B981";
const GNL = "#d1fae5";
const AMB = "#F59E0B";
const AML = "#fef3c7";
const RD  = "#EF4444";
const CY  = "#06B6D4";

const GRAD = "linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)";
const PIE_COLORS = [P, BL, GN, AMB, CY, RD, "#8B5CF6", "#EC4899"];

const fmtAED = (v: number) => {
  if (!v && v !== 0) return "AED 0";
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `AED ${(v / 1_000).toFixed(0)}K`;
  return `AED ${(v || 0).toLocaleString()}`;
};

const fmtDate = (d: string) => dayjs(d).format("DD MMM");

const GlassTip = ({ active, payload, label, suffix = "" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)", border: "1px solid #ede9ff", borderRadius: 14, padding: "12px 18px", boxShadow: "0 8px 32px rgba(92,3,155,0.15)" }}>
      <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#64748b", fontSize: 12 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ margin: "3px 0", color: p.color || P, fontWeight: 700, fontSize: 14 }}>
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('commission') ? fmtAED(p.value) : p.value}{suffix}
        </p>
      ))}
    </div>
  );
};

const KpiCard = ({ icon, label, value, color, bg, onClick, delay = 0 }: any) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <div
      onClick={onClick}
      style={{
        background: "#fff", borderRadius: 20, border: "1px solid #ede9ff",
        padding: "22px 20px", boxShadow: "0 2px 12px rgba(92,3,155,0.06)",
        position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default",
        transition: "all 0.25s", height: "100%"
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: color }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{value ?? 0}</div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg || `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {React.cloneElement(icon, { style: { fontSize: 20, color } })}
        </div>
      </div>
    </div>
  </motion.div>
);

const VaultPartnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await apiService.get<any>(`/vault/statistics/partner/stats`);
      if (data) setStats(data);
      else message.error("Failed to load dashboard data");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const inner          = stats?.data            ?? stats ?? {};
  const pInfo          = inner?.partnerInfo    ?? {};
  const kpis           = inner?.kpis           ?? {};
  const ls             = inner?.leadStatus     ?? {};
  const graphs         = inner?.graphs         ?? {};
  const agentsSummary  = inner?.agentsSummary  ?? null;
  const recentLeads    = inner?.recentLeads    ?? [];

  const leadsChart  = (graphs.leadsOverTime ?? []).map((d: any) => ({ name: fmtDate(d.date), Leads: d.count }));
  const commTrend   = (graphs.commissionTrend ?? []).map((d: any) => ({ name: d.month, Commission: d.amount }));
  
  const leadPie = Object.entries(ls)
    .filter(([, v]) => (v as number) > 0)
    .map(([k, v]) => ({
      name: k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()),
      value: v as number
    }));

  const getStatusColor = (s: string) => {
    const m: any = { 
      New: "blue", 
      Contacted: "orange", 
      Qualified: "geekblue", 
      "Collecting Documents": "cyan", 
      "Bank Application": "purple", 
      "Pre Approved": "green", 
      "Valuation": "gold",
      "FOL Issued": "magenta",
      "FOL Signed": "volcano",
      Disbursed: "success",
      Lost: "red"
    };
    return m[s] || "default";
  };

  const columns = [
    {
      title: "Customer",
      key: "customer",
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.customerName || "—"}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>ID: {r._id?.slice(-6).toUpperCase()}</div>
        </div>
      ),
    },
    {
      title: "Status", dataIndex: "status",
      render: (s: string) => (
        <Tag color={getStatusColor(s)} style={{ borderRadius: 20, fontWeight: 700, border: 'none', padding: '2px 12px', fontSize: 11 }}>
          {(s || "").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Date", dataIndex: "createdAt",
      render: (d: string) => <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{dayjs(d).format("DD MMM, HH:mm")}</span>,
    },
    {
      title: "", width: 80,
      render: (_: any, r: any) => (
        <Button type="primary" size="small" 
          onClick={() => navigate(`/dashboard/vaultpartner/leads/partner/${r._id}`)}
          style={{ background: P, borderColor: P, borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
          VIEW
        </Button>
      ),
    },
  ];

  if (loading && !stats) return (
    <div style={{ background: "#f9f8ff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" />
    </div>
  );

  return (
    <div style={{ background: "#f9f8ff", minHeight: "100vh", padding: "24px" }}>
      
      {/* ── Hero Banner ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: GRAD, padding: "28px 32px", borderRadius: 24, position: "relative", overflow: "hidden", marginBottom: 24, boxShadow: "0 10px 30px rgba(92,3,155,0.2)" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", right: 100, bottom: -60, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 20, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.3)" }}>
              <TrophyOutlined style={{ fontSize: 32, color: "#fff" }} />
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                {pInfo.partnerCategory === "company" ? "Strategic Company Partner" : "Elite Individual Partner"}
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#fff" }}>
                Welcome, {pInfo.name || "Partner"}
              </h1>
              <div style={{ marginTop: 8 }}>
                <Tag style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                  STATUS: {pInfo.status?.toUpperCase()}
                </Tag>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button 
              icon={<ReloadOutlined spin={refreshing} />} 
              onClick={() => fetchStats(true)}
              style={{ height: 44, borderRadius: 14, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontWeight: 700 }}
            >
              Sync
            </Button>
            <Button 
              onClick={() => navigate("/dashboard/vaultpartner/leads/partner/create")}
              style={{ height: 44, borderRadius: 14, background: "#fff", border: "none", color: P, fontWeight: 800, paddingInline: 24 }}
            >
              + New Lead
            </Button>
          </div>
        </div>

        {/* Commission Tiers */}
        {pInfo.commissionTier && (
          <div style={{ marginTop: 24, background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: "16px 24px", display: "flex", gap: 40 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Tier 1 (≤ 5M)</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{pInfo.commissionTier.below5M}%</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Tier 2 (&gt; 5M)</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{pInfo.commissionTier.above5M}%</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* KPI Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {[
          { label: "Total Leads",      value: kpis.totalLeads,             icon: <TeamOutlined />,      color: P,   bg: PL  },
          { label: "Active Cases",     value: kpis.activeCases,            icon: <FileTextOutlined />,  color: BL,  bg: BLL },
          { label: "Total Earned",     value: fmtAED(kpis.totalCommissionEarned), icon: <WalletOutlined />,    color: GN,  bg: GNL },
          { label: "Pending Payout",   value: fmtAED(kpis.pendingCommission),     icon: <DollarOutlined />,    color: AMB, bg: AML },
        ].map((k, i) => (
          <Col xs={24} sm={12} lg={6} key={i}><KpiCard {...k} delay={i * 0.05} /></Col>
        ))}
      </Row>

      <Row gutter={[20, 20]}>
        {/* Left Column: Main Charts */}
        <Col xs={24} xl={16}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Leads Area Chart */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, border: "1px solid #ede9ff", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
              <div style={{ fontWeight: 900, color: "#1f2937", marginBottom: 24, fontSize: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <LineChartOutlined style={{ color: P }} /> Submission Trend
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={leadsChart}>
                  <defs>
                    <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={P} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={P} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <ReTooltip content={<GlassTip />} />
                  <Area type="monotone" dataKey="Leads" stroke={P} strokeWidth={4} fill="url(#pGrad)" dot={{ r: 4, fill: P, strokeWidth: 2, stroke: "#fff" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Commission Trend */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, border: "1px solid #ede9ff", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
              <div style={{ fontWeight: 900, color: "#1f2937", marginBottom: 24, fontSize: 16 }}>Revenue Performance</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={commTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                  <ReTooltip content={<GlassTip />} />
                  <Bar dataKey="Commission" fill={GN} radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>

        {/* Right Column: Pipeline & Agents */}
        <Col xs={24} xl={8}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Pipeline Pie */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, border: "1px solid #ede9ff", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
              <div style={{ fontWeight: 900, color: "#1f2937", marginBottom: 24, fontSize: 15, display: "flex", alignItems: "center", gap: 10 }}>
                <PieChartOutlined style={{ color: BL }} /> Pipeline Mix
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={leadPie} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                    {leadPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <ReTooltip formatter={(v: any) => [v, "Leads"]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: "8px 12px" }}>
                {leadPie.map((d, i) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Summary (Only for Company) */}
            {agentsSummary && (
              <div style={{ background: "#fff", borderRadius: 24, padding: 28, border: "1px solid #ede9ff", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Agency Workforce</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: P }}>{agentsSummary.totalAgents}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Total Agents</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: GN }}>{agentsSummary.activeAgents}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>Active Now</div>
                  </div>
                </div>
                <Progress percent={Math.round((agentsSummary.activeAgents / agentsSummary.totalAgents) * 100)} showInfo={false} strokeColor={P} size={{ height: 6 }} />
                <Button block style={{ marginTop: 20, borderRadius: 12, fontWeight: 700, height: 40 }} onClick={() => navigate("/dashboard/vaultpartner/agents")}>
                  Manage Agency
                </Button>
              </div>
            )}

            {/* Quick Links */}
            <div style={{ background: GRAD, borderRadius: 24, padding: 28, color: "#fff", boxShadow: "0 10px 20px rgba(3,164,244,0.15)" }}>
              <h4 style={{ color: "#fff", fontWeight: 900, margin: "0 0 20px" }}>Quick Access</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Referral Leads", path: "/dashboard/vaultpartner/partner-leads" },
                  { label: "Earnings Report", path: "/dashboard/vaultpartner/commissions" },
                  { label: "Product Library", path: "/dashboard/vaultpartner/bank/products" },
                ].map(link => (
                  <div key={link.label} 
                    onClick={() => navigate(link.path)}
                    style={{ background: "rgba(255,255,255,0.15)", padding: "14px 18px", borderRadius: 16, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: 13 }}
                  >
                    {link.label} <ArrowRightOutlined />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </Col>
      </Row>

      {/* Recent Leads Table */}
      <div style={{ marginTop: 24, background: "#fff", borderRadius: 24, border: "1px solid #ede9ff", overflow: "hidden", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900, color: "#1f2937", margin: 0, fontSize: 16 }}>Recent Submissions</h3>
          <Button type="link" onClick={() => navigate("/dashboard/vaultpartner/partner-leads")} style={{ color: P, fontWeight: 800, fontSize: 13 }}>
            View All Leads →
          </Button>
        </div>
        <div style={{ padding: "8px" }}>
          <Table
            columns={columns}
            dataSource={recentLeads.map((l: any) => ({ ...l, key: l._id }))}
            pagination={false}
            size="middle"
            className="partner-table"
          />
        </div>
      </div>

      <style>{`
        .partner-table .ant-table-thead > tr > th { background: transparent !important; color: #94a3b8 !important; font-size: 10px !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; font-weight: 800 !important; border-bottom: 1px solid #f1f5f9 !important; }
        .partner-table .ant-table-tbody > tr > td { border-bottom: 1px solid #f8fafc !important; padding: 16px 20px !important; }
        .partner-table .ant-table-tbody > tr:hover > td { background: #f9f8ff !important; }
      `}</style>
    </div>
  );
};

export default VaultPartnerDashboard;
