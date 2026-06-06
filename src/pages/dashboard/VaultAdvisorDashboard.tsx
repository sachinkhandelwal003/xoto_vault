import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Row, Col, Button, Tag, Space, Spin, message, Progress,
  Tooltip, Alert, Table, Avatar, Badge, Empty,
} from "antd";
import {
  UserOutlined, CheckCircleOutlined, ClockCircleOutlined,
  EyeOutlined, DollarOutlined, WarningOutlined,
  ReloadOutlined, LineChartOutlined,
  PlusOutlined, RocketOutlined, PhoneOutlined, FileTextOutlined,
} from "@ant-design/icons";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import { apiService } from "@/api/apiService";
import dayjs from "dayjs";

const P   = "#5C039B";
const PL  = "#f3e8ff";
const GN  = "#10B981";
const GNL = "#d1fae5";
const BL  = "#3B82F6";
const BLL = "#dbeafe";
const AMB = "#F59E0B";
const AML = "#fef3c7";
const RD  = "#EF4444";
const RDL = "#fee2e2";
const CY  = "#06B6D4";
const CYL = "#cffafe";

const GRAD = "linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)";
const PIE_COLORS = [P, BL, GN, AMB, CY, RD, "#8B5CF6", "#EC4899"];

const fmtDate = (d: string) => dayjs(d).format("DD MMM");

const GlassTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)", border: "1px solid #ede9ff", borderRadius: 14, padding: "12px 18px", boxShadow: "0 8px 32px rgba(92,3,155,0.15)" }}>
      <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#64748b", fontSize: 12 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ margin: "3px 0", color: p.color || P, fontWeight: 700, fontSize: 14 }}>
          {p.name}: {(p.value ?? 0).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const KpiCard = ({ icon, label, value, color, bg, delay = 0 }: any) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <div style={{
      background: "#fff", borderRadius: 20, border: "1px solid #ede9ff",
      padding: "22px 20px", boxShadow: "0 2px 12px rgba(92,3,155,0.06)",
      position: "relative", overflow: "hidden", height: "100%"
    }}>
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

const getStatusColor = (s: string) => {
  const m: any = { 
    New: "blue", 
    Assigned: "purple", 
    Contacted: "orange", 
    Qualified: "geekblue", 
    "Documents Complete": "green", 
    "Collecting Documents": "cyan", 
    "Application Opened": "volcano", 
    "Not Proceeding": "red", 
    Disbursed: "success" 
  };
  return m[s] || "default";
};

const VaultAdvisorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await apiService.get<any>(`/vault/statistics/advisor/stats`);
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
  const advisorInfo    = inner?.advisorInfo    ?? {};
  const workload       = inner?.workload       ?? {};
  const kpis           = inner?.kpis           ?? {};
  const funnel         = inner?.leadFunnel     ?? {};
  const rates          = inner?.conversionRates ?? {};
  const quickActions   = inner?.quickActions   ?? {};
  const graphs         = inner?.graphs         ?? {};
  const recentLeads    = inner?.recentLeads    ?? [];

  const leadsChart = (graphs.leadsOverTime ?? []).map((d: any) => ({ date: fmtDate(d.date), count: d.count }));
  const slaTrend   = (graphs.slaTrend ?? []).map((d: any) => ({ date: fmtDate(d.date), Breached: d.breached, Compliant: d.compliant }));
  
  const funnelData = [
    { label: "New", count: funnel.new, color: BL },
    { label: "Contacted", count: funnel.contacted, color: AMB },
    { label: "Qualified", count: funnel.qualified, color: CY },
    { label: "Collecting Docs", count: funnel.collectingDocs, color: P },
    { label: "Docs Complete", count: funnel.docsComplete, color: GN },
    { label: "Application Opened", count: funnel.applicationOpened, color: "#8B5CF6" },
    { label: "Disbursed", count: funnel.disbursed, color: "#10B981" },
  ].filter(i => i.count > 0 || ["New", "Contacted", "Qualified"].includes(i.label));

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
          {s.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Assigned", dataIndex: "createdAt",
      render: (d: string) => <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{dayjs(d).format("DD MMM, HH:mm")}</span>,
    },
    {
      title: "", width: 80,
      render: (_: any, r: any) => (
        <Button type="primary" size="small" 
          onClick={() => navigate(`/dashboard/vault-advisor/vault/lead/${r._id}`)}
          style={{ background: P, borderColor: P, borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
          OPEN
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
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Badge dot status={workload.isOverloaded ? "warning" : "success"} offset={[-10, 55]}>
              <Avatar size={72} icon={<UserOutlined />}
                style={{ background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.4)" }} />
            </Badge>
            <div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Mortgage Advisor Portal</div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: 0 }}>Welcome, {advisorInfo.name}</h1>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <Tag style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                  UTILIZATION: {workload.capacityUtilization}%
                </Tag>
                {workload.isOverloaded && <Tag color="error" style={{ borderRadius: 8, fontWeight: 800 }}>OVERLOADED</Tag>}
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 12 }}>
            <Button 
              icon={<ReloadOutlined spin={refreshing} />} 
              onClick={() => fetchStats(true)}
              style={{ height: 44, borderRadius: 14, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontWeight: 700 }}
            >
              Sync
            </Button>
            <Button 
              onClick={() => navigate("/dashboard/vault-advisor/leads")}
              style={{ height: 44, borderRadius: 14, background: "#fff", border: "none", color: P, fontWeight: 800, paddingInline: 24 }}
            >
              My Pipeline
            </Button>
          </div>
        </div>
      </motion.div>

      {/* SLA Alert */}
      {kpis.slaBreached > 0 && (
        <Alert
          message={<span style={{ fontWeight: 800 }}>Critical: {kpis.slaBreached} SLA Breaches Detected</span>}
          description="Action required! Several leads have exceeded the response time limit."
          type="error" showIcon
          style={{ borderRadius: 16, marginBottom: 24, border: "none", boxShadow: "0 4px 12px rgba(239,68,68,0.1)" }}
          action={<Button size="small" danger onClick={() => navigate("/dashboard/vault-advisor/leads")}>Fix Now</Button>}
        />
      )}

      {/* KPI Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {[
          { label: "Active Pipeline", value: kpis.totalLeads,   icon: <LineChartOutlined />,  color: P,   bg: PL  },
          { label: "Active Applications", value: kpis.activeCases,  icon: <FileTextOutlined />,  color: BL,  bg: BLL },
          { label: "Disbursed",       value: kpis.disbursedLeads, icon: <CheckCircleOutlined />, color: GN,  bg: GNL },
          { label: "SLA Compliance",  value: `${kpis.slaComplianceRate}%`, icon: <CheckCircleOutlined />, color: AMB, bg: AML },
        ].map((k, i) => (
          <Col xs={12} sm={12} lg={6} key={i}><KpiCard {...k} delay={i * 0.05} /></Col>
        ))}
      </Row>

      {/* Conversion & Quick Actions */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "24px 28px", border: "1px solid #ede9ff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 16 }}>Efficiency Metrics</div>
              <div style={{ display: "flex", gap: 32 }}>
                {[
                  { label: "Contact Rate", value: rates.contactRate },
                  { label: "Qualification", value: rates.qualificationRate },
                  { label: "Conversion", value: rates.conversionRate },
                ].map((r, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{r.value}%</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{r.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: 1, height: 50, background: "#f1f5f9", display: "none" }} className="hide-mobile" />
            <div style={{ flex: 1, maxWidth: 400 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 12 }}>Performance Score</div>
              <Progress percent={rates.conversionRate} strokeColor={GRAD} showInfo={false} size={{ height: 10 }} />
            </div>
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "20px 24px", border: "1px solid #ede9ff", height: "100%" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 12 }}>Priority Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Needs Contact", count: quickActions.needsContact, color: AMB },
                { label: "Update Required", count: quickActions.needsUpdate, color: RD },
                { label: "Ready to Apply", count: quickActions.canCreateApplication, color: GN },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{a.label}</span>
                  <Badge count={a.count} style={{ backgroundColor: a.color, fontWeight: 800 }} />
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        {/* Left Column: Charts */}
        <Col xs={24} xl={16}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Leads Trend */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, border: "1px solid #ede9ff", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontWeight: 900, color: "#1f2937", margin: 0, fontSize: 16, display: "flex", alignItems: "center", gap: 10 }}>
                  <LineChartOutlined style={{ color: P }} /> Leads Inflow Trend
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={leadsChart}>
                  <defs>
                    <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={P} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={P} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <ReTooltip content={<GlassTip />} />
                  <Area type="monotone" dataKey="count" name="Leads" stroke={P} strokeWidth={4} fill="url(#leadGrad)" dot={{ r: 4, fill: P, strokeWidth: 2, stroke: "#fff" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* SLA Trend */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, border: "1px solid #ede9ff", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
              <h3 style={{ fontWeight: 900, color: "#1f2937", marginBottom: 24, fontSize: 16 }}>SLA Performance</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={slaTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <ReTooltip content={<GlassTip />} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 12, fontWeight: 600 }} />
                  <Line type="monotone" dataKey="Compliant" stroke={GN} strokeWidth={3} dot={{ r: 4, fill: "#fff", stroke: GN, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Breached"  stroke={RD} strokeWidth={3} dot={{ r: 4, fill: "#fff", stroke: RD, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>

        {/* Right Column: Workload & Funnel */}
        <Col xs={24} xl={8}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
            
            {/* Workload Status */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, border: "1px solid #ede9ff", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Workload Analytics</h3>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Progress 
                  type="dashboard" 
                  percent={workload.capacityUtilization} 
                  strokeColor={workload.isOverloaded ? RD : P} 
                  strokeWidth={10}
                  gapDegree={80}
                  width={140}
                  format={(p) => (
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "#1f2937" }}>{workload.currentLeads}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>LEADS</div>
                    </div>
                  )}
                />
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 16, padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Capacity Utilization</span>
                  <span style={{ fontSize: 12, color: P, fontWeight: 800 }}>{workload.capacityUtilization}%</span>
                </div>
                <Progress percent={workload.capacityUtilization} showInfo={false} strokeColor={P} size={{ height: 6 }} />
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 10, textAlign: "center", fontWeight: 600 }}>
                  Max Capacity: {workload.maxCapacity} leads
                </div>
              </div>
            </div>

            {/* Lead Funnel */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, border: "1px solid #ede9ff", boxShadow: "0 2px 12px rgba(92,3,155,0.04)", flex: 1 }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>Pipeline Funnel</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {funnelData.map(item => {
                  const pct = Math.round(((item.count || 0) / (kpis.totalLeads || 1)) * 100);
                  return (
                    <div key={item.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "flex-end" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{item.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: item.color }}>{item.count || 0} <span style={{ fontSize: 10, color: "#cbd5e1", fontWeight: 600 }}>({pct}%)</span></span>
                      </div>
                      <Progress percent={pct} showInfo={false} strokeColor={item.color} size={{ height: 8 }} />
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </Col>
      </Row>

      {/* Recent Leads Table */}
      <div style={{ marginTop: 24, background: "#fff", borderRadius: 24, border: "1px solid #ede9ff", overflow: "hidden", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900, color: "#1f2937", margin: 0, fontSize: 16 }}>Recent Pipeline Activity</h3>
          <Button type="link" onClick={() => navigate("/dashboard/vault-advisor/leads")} style={{ color: P, fontWeight: 800, fontSize: 13 }}>
            View Full Pipeline →
          </Button>
        </div>
        <div style={{ padding: "8px" }}>
          <Table
            columns={columns}
            dataSource={recentLeads.map((l: any) => ({ ...l, key: l._id }))}
            pagination={false}
            size="middle"
            className="advisor-table"
          />
        </div>
      </div>

      <style>{`
        .advisor-table .ant-table-thead > tr > th { background: transparent !important; color: #94a3b8 !important; font-size: 10px !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; font-weight: 800 !important; border-bottom: 1px solid #f1f5f9 !important; }
        .advisor-table .ant-table-tbody > tr > td { border-bottom: 1px solid #f8fafc !important; padding: 16px 20px !important; }
        .advisor-table .ant-table-tbody > tr:hover > td { background: #f9f8ff !important; }
      `}</style>
    </div>
  );
};

export default VaultAdvisorDashboard;
