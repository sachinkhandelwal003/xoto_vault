import React, { useState, useEffect, useCallback } from "react";

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Row, Col, Button, Tag, Space, Spin, message,
  Alert, Table, Avatar, Badge, Progress,
} from "antd";
import {
  UserOutlined, FileOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ReloadOutlined,
  BarChartOutlined, RocketOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
  CartesianGrid,
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

const CY  = "#06B6D4";

const GRAD = "linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)";

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
  const sl = (s || "").toLowerCase();
  if (sl.includes("pending")) return "orange";
  if (sl.includes("under review")) return "blue";
  if (sl.includes("returned")) return "red";
  if (sl.includes("bank application")) return "purple";
  if (sl.includes("pre-approved") || sl.includes("pre approved")) return "cyan";
  if (sl.includes("valuation")) return "geekblue";
  if (sl.includes("fol issued")) return "volcano";
  if (sl.includes("fol signed")) return "green";
  if (sl.includes("disbursed")) return "success";
  if (sl.includes("rejected") || sl.includes("lost")) return "red";
  return "default";
};

const VaultOpsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [queueCases, setQueueCases]   = useState<any[]>([]);
  const [myCases,    setMyCases]      = useState<any[]>([]);
  const [myTotal,    setMyTotal]      = useState(0);
  const [statsData,  setStatsData]    = useState<any>(null);
  const [loading,    setLoading]      = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [queueRes, myRes, statsRes] = await Promise.all([
        apiService.get<any>(`vault/cases/ops/queue`).catch(() => null),
        apiService.get<any>(`vault/cases/ops/my-cases?limit=50`).catch(() => null),
        apiService.get<any>(`vault/statistics/ops/stats`).catch(() => null),
      ]);

      const qCases = queueRes?.data ?? (Array.isArray(queueRes) ? queueRes : []);
      const mCases = myRes?.data    ?? (Array.isArray(myRes)    ? myRes    : []);
      setQueueCases(qCases);
      setMyCases(mCases);
      setMyTotal(myRes?.total ?? myRes?.pagination?.total ?? mCases.length);

      const inner = statsRes?.data ?? statsRes ?? null;
      if (inner) setStatsData(inner);
    } catch { /* silently handled per-call above */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  /* ── derive stats from live case data when stats API unavailable ── */
  const s = statsData;

  const opsInfo = s?.opsInfo ?? {};
  const workload = s?.workload ?? {
    capacityUtilization: Math.min(Math.round((myTotal / 30) * 100), 100),
    currentCapacity: myTotal,
    maxCapacity: 30,
    isOverloaded: myTotal >= 30,
  };
  const performance = s?.performance ?? {};

  /* status breakdown built from myCases if stats API didn't respond */
  const caseStatus: Record<string, number> = s?.caseStatusBreakdown ?? s?.caseStatus ?? (() => {
    const map: Record<string, number> = {};
    myCases.forEach((c: any) => { const k = c.status || "unknown"; map[k] = (map[k] || 0) + 1; });
    return map;
  })();

  const activePipelineStatuses = [
    "Assigned - Pending Review", "Under Review", "Bank Application",
    "Pre-Approved", "Collecting Documentation", "Valuation",
    "FOL Processed", "FOL Issued", "FOL Signed",
  ];
  const activeCount  = s?.kpis?.activeCases  ?? myCases.filter((c: any) => activePipelineStatuses.includes(c.status)).length;
  const disbursedCount = s?.kpis?.completed  ?? performance.totalDisbursed ?? myCases.filter((c: any) => c.status === "Disbursed").length;
  const successRate  = s?.performance?.successRate ?? s?.kpis?.successRate ?? (myTotal > 0 ? Math.round((disbursedCount / myTotal) * 100) : 0);

  const actions = s?.quickActions ?? {
    availableInQueue: queueCases.length,
    needsReview: myCases.filter((c: any) => c.status === "Assigned - Pending Review").length,
    needsBankUpdate: myCases.filter((c: any) => ["Bank Application", "Pre-Approved"].includes(c.status)).length,
  };

  const graphs    = s?.graphs ?? {};
  const recentCases = s?.recentCases ?? s?.processedCases ?? myCases.slice(0, 8);

  const casesChart = (graphs.casesOverTime ?? []).map((d: any) => ({ date: fmtDate(d.date), count: d.count }));
  /* caseStatus keys may be camelCase (from stats API) or full strings (from myCases map) */
  const getCount = (camel: string, full: string) =>
    caseStatus[camel] ?? caseStatus[full] ?? 0;

  const funnelData = [
    { label: "Pending Review",   count: getCount("pendingReview",    "Assigned - Pending Review"), color: AMB },
    { label: "Under Review",     count: getCount("underReview",      "Under Review"),               color: BL  },
    { label: "Bank Application", count: getCount("bankApplication",  "Bank Application"),           color: P   },
    { label: "Pre Approved",     count: getCount("preApproved",      "Pre-Approved"),               color: CY  },
    { label: "Valuation",        count: getCount("valuation",        "Valuation"),                  color: "#8B5CF6" },
    { label: "FOL Signed",       count: getCount("folSigned",        "FOL Signed"),                 color: GN  },
  ].filter(i => i.count > 0);

  const queueColumns = [
    {
      title: "Reference",
      dataIndex: "caseReference",
      render: (r: string) => <code style={{ color: P, fontWeight: 700 }}>{r || "—"}</code>,
    },
    {
      title: "Customer",
      render: (_: any, row: any) => (
        <span style={{ fontWeight: 600 }}>{row.clientInfo?.fullName || row.customerName || "—"}</span>
      ),
    },
    {
      title: "Bank",
      render: (_: any, row: any) => (
        <span style={{ fontSize: 12, color: "#64748b" }}>{row.selectedBank?.name || row.bankInfo?.name || "—"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s: string) => <Tag color={getStatusColor(s || "")}>{(s || "Pending Review")}</Tag>,
    },
    {
      title: "In Queue",
      render: (_: any, row: any) => {
        const entered = row.opsQueue?.enteredQueueAt || row.createdAt;
        const hrs = entered ? Math.round((Date.now() - new Date(entered).getTime()) / 36e5) : null;
        return hrs !== null
          ? <span style={{ fontSize: 12, fontWeight: 700, color: hrs >= 48 ? "#EF4444" : hrs >= 24 ? "#F59E0B" : "#94a3b8" }}>{hrs}h</span>
          : <span style={{ color: "#cbd5e1" }}>—</span>;
      },
    },
    {
      title: "",
      width: 80,
      render: () => (
        <Button type="link" size="small" onClick={() => navigate(`/dashboard/vault-ops/case/queue/view`)} style={{ color: P, fontWeight: 800, padding: 0 }}>
          VIEW
        </Button>
      ),
    },
  ];

  const processedColumns = [
    {
      title: "Reference",
      dataIndex: "caseReference",
      render: (r: string) => <code style={{ color: P, fontWeight: 700 }}>{r || "—"}</code>,
    },
    {
      title: "Customer",
      render: (_: any, row: any) => (
        <span style={{ fontWeight: 600 }}>{row.clientInfo?.fullName || row.customerName || "—"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s: string) => <Tag color={getStatusColor(s)}>{s || "—"}</Tag>,
    },
    {
      title: "Assigned To",
      render: (_: any, row: any) => {
        const name = row.assignedOps?.name || row.processedBy || "—";
        return (
          <Space size={4}>
            <Avatar size={20} icon={<UserOutlined />} style={{ background: P }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{name}</span>
          </Space>
        );
      },
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      render: (d: string) => <span style={{ fontSize: 12, color: "#94a3b8" }}>{dayjs(d).format("DD MMM, HH:mm")}</span>,
    },
    {
      title: "",
      width: 80,
      render: (_: any, r: any) => (
        <Button type="link" onClick={() => navigate(`/dashboard/vault-ops/case/review/${r._id}`)}>
          VIEW
        </Button>
      ),
    },
  ];


  if (loading && !statsData && !queueCases.length && !myCases.length) return (
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
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Mortgage Operations Portal</div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: 0 }}>Welcome, {opsInfo.name}</h1>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <Tag style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                  CAPACITY: {workload.capacityUtilization}%
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
              onClick={() => navigate("/dashboard/vault-ops/case/queue/view")}
              style={{ height: 44, borderRadius: 14, background: "#fff", border: "none", color: P, fontWeight: 800, paddingInline: 24 }}
            >
              Pickup Queue ({queueCases.length})
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Urgent Alert */}
      {queueCases.length > 0 && (
        <Alert
          message={<span style={{ fontWeight: 800 }}>{queueCases.length} Applications Waiting in Queue — Pick one up now</span>}
          description="High-priority applications need immediate review and assignment."
          type="error" showIcon
          style={{ borderRadius: 16, marginBottom: 24, border: "none", boxShadow: "0 4px 12px rgba(239,68,68,0.1)" }}
          action={<Button size="small" danger onClick={() => navigate("/dashboard/vault-ops/case/queue/view")}>View Queue</Button>}
        />
      )}

      {/* KPI Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {[
          { label: "Assigned Applications", value: myTotal,        icon: <BarChartOutlined />,    color: P,   bg: PL  },
          { label: "Active Review",  value: activeCount,    icon: <ClockCircleOutlined />, color: BL,  bg: BLL },
          { label: "Disbursed",      value: disbursedCount, icon: <CheckCircleOutlined />, color: GN,  bg: GNL },
          { label: "Success Rate",   value: `${successRate}%`, icon: <RocketOutlined />,  color: AMB, bg: AML },
        ].map((k, i) => (
          <Col xs={12} sm={12} lg={6} key={i}><KpiCard {...k} delay={i * 0.05} /></Col>
        ))}
      </Row>

      {/* Quick Actions Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "24px 28px", border: "1px solid #ede9ff", height: "100%" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 16 }}>Operational Pulse</div>
            <Row gutter={[24, 24]}>
              <Col span={8}>
                <div style={{ textAlign: "center", padding: "12px", background: "#f8fafc", borderRadius: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: P }}>{actions.availableInQueue}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Available in Queue</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: "center", padding: "12px", background: "#f8fafc", borderRadius: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: AMB }}>{actions.needsReview}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Needs Review</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: "center", padding: "12px", background: "#f8fafc", borderRadius: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: CY }}>{actions.needsBankUpdate}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Bank Updates</div>
                </div>
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 12 }}>Application Processing Velocity</div>
              <Progress percent={successRate} strokeColor={GRAD} showInfo={false} size={{ height: 10 }} />
            </div>
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "20px 24px", border: "1px solid #ede9ff", height: "100%" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 12 }}>Workflow Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "My Assigned Applications", path: "/dashboard/vault-ops/case/assigned/all", icon: "📋" },
                { label: "Process Queue", path: "/dashboard/vault-ops/case/queue/view", icon: "⚡" },
                { label: "Disbursal Records", path: "/dashboard/vault-ops/case/disbursed", icon: "💰" },
              ].map((link, i) => (
                <div key={i} onClick={() => navigate(link.path)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 14, cursor: "pointer", transition: "0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                  onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>{link.icon} {link.label}</span>
                  <ArrowRightOutlined style={{ fontSize: 12, color: "#cbd5e1" }} />
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
            
            {/* Applications Trend */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, border: "1px solid #ede9ff", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
              <h3 style={{ fontWeight: 900, color: "#1f2937", marginBottom: 24, fontSize: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <BarChartOutlined style={{ color: P }} /> Application Velocity Trend
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={casesChart}>
                  <defs>
                    <linearGradient id="caseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={P} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={P} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <ReTooltip content={<GlassTip />} />
                  <Area type="monotone" dataKey="count" name="Applications" stroke={P} strokeWidth={4} fill="url(#caseGrad)" dot={{ r: 4, fill: P, strokeWidth: 2, stroke: "#fff" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Queue Table */}
            <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #ede9ff", overflow: "hidden", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
              <div style={{ padding: "24px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontWeight: 900, color: "#1f2937", margin: 0, fontSize: 16 }}>Queue Priority Review</h3>
                <Button type="link" onClick={() => navigate("/dashboard/vault-ops/case/queue/view")} style={{ color: P, fontWeight: 800 }}>
                  Full Queue →
                </Button>
              </div>
              <Table
                columns={queueColumns}
                dataSource={queueCases.slice(0, 8).map((c: any) => ({ ...c, key: c._id }))}
                pagination={false}
                size="middle"
                className="ops-table"
                locale={{ emptyText: <span style={{ color: "#94a3b8", fontSize: 13 }}>No applications in queue</span> }}
              />
            </div>
          </div>
        </Col>

        {/* Right Column: Workload & Funnel */}
        <Col xs={24} xl={8}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
            
            {/* Workload Status */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, border: "1px solid #ede9ff", boxShadow: "0 2px 12px rgba(92,3,155,0.06)" }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Workload Monitoring</h3>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Progress 
                  type="dashboard" 
                  percent={workload.capacityUtilization} 
                  strokeColor={workload.isOverloaded ? RD : P} 
                  strokeWidth={10}
                  gapDegree={80}
                  size={140}
                  format={() => (
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "#1f2937" }}>{workload.currentCapacity ?? workload.currentApplications ?? 0}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>APPLICATIONS</div>
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
                  Max Capacity: {workload.maxCapacity} active applications
                </div>
              </div>
            </div>

            {/* Case Funnel */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, border: "1px solid #ede9ff", boxShadow: "0 2px 12px rgba(92,3,155,0.04)", flex: 1 }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>Processing Funnel</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {funnelData.map(item => {
                  const pct = Math.round(((item.count || 0) / (myTotal || 1)) * 100);
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

      {/* Recent Cases */}
      {recentCases.length > 0 && (
        <div style={{ marginTop: 24, background: "#fff", borderRadius: 24, border: "1px solid #ede9ff", overflow: "hidden", boxShadow: "0 2px 12px rgba(92,3,155,0.04)" }}>
          <div style={{ padding: "24px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontWeight: 900, color: "#1f2937", margin: 0, fontSize: 16 }}>
              <FileOutlined style={{ color: P, marginRight: 8 }} />
              Recent Applications
            </h3>
            <Button type="link" onClick={() => navigate("/dashboard/vault-ops/case/assigned/all")} style={{ color: P, fontWeight: 800 }}>
              All Assigned →
            </Button>
          </div>
          <Table
            columns={processedColumns}
            dataSource={recentCases.map((c: any) => ({ ...c, key: c._id }))}
            pagination={false}
            size="middle"
            className="ops-table"
          />
        </div>
      )}


      <style>{`
        .ops-table .ant-table-thead > tr > th { background: transparent !important; color: #94a3b8 !important; font-size: 10px !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; font-weight: 800 !important; border-bottom: 1px solid #f1f5f9 !important; }
        .ops-table .ant-table-tbody > tr > td { border-bottom: 1px solid #f8fafc !important; padding: 16px 20px !important; }
        .ops-table .ant-table-tbody > tr:hover > td { background: #f9f8ff !important; }
      `}</style>
    </div>
  );
};

export default VaultOpsDashboard;
