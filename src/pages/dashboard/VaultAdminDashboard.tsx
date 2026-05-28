import React, { useState, useEffect, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Legend,
} from "recharts";
import {
  Users, UserCheck, FolderOpen, TrendingUp, Clock, Handshake,
  Building2, AlertCircle, RefreshCw, Target, Award,
  Zap, Shield, Activity, DollarSign, Layers, BarChart2,
  ArrowRight, Bell, Settings,
} from "lucide-react";
import {
  Spin, message, Tabs, Badge, Button, Tag, Alert, DatePicker,
  Segmented, Card, Row, Col, Progress, Space, Avatar, Statistic,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { apiService } from "@/api/apiService";

const { RangePicker } = DatePicker;

const P   = "#5C039B";
const BL  = "#03A4F4";
const GN  = "#10B981";
const AMB = "#F59E0B";
const RD  = "#EF4444";
const GRAD = "linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)";
const PIE_COLORS = [P, GN, BL, AMB, RD, "#8B5CF6", "#EC4899", "#06B6D4"];

const fmt = (v: number) => {
  if (!v && v !== 0) return "0";
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString();
};
const fmtAED = (v: number) => `AED ${fmt(v || 0)}`;
const fmtLabel = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase());
const fmtDate = (ds: string | number | Date, filter?: string) => {
  const d = new Date(ds);
  if (filter === "week") return d.toLocaleDateString("en-US", { weekday: "short" });
  if (filter === "today") return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/* ─── Tooltip ─── */
type GlassTipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  prefix?: string;
  suffix?: string;
};
const GlassTip: React.FC<GlassTipProps> = ({ active, payload, label = "", prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)",
      border: "1px solid #ede9ff", borderRadius: 14, padding: "12px 18px",
      boxShadow: "0 8px 32px rgba(92,3,155,0.15)",
    }}>
      <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#64748b", fontSize: 12 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "3px 0", color: p.color || P, fontWeight: 700, fontSize: 15 }}>
          {p.name}: {prefix}{(p.value ?? 0).toLocaleString()}{suffix}
        </p>
      ))}
    </div>
  );
};

type KpiCardProps = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  trend?: string;
  loading?: boolean;
  onClick?: () => void;
};
const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, color, bg, trend, loading, onClick }) => {
  const displayValue = loading ? <Spin size="small" /> : (typeof value === "number" ? fmt(value) : value);
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", borderRadius: 20, border: "1px solid #ede9ff",
        padding: "22px 20px", cursor: onClick ? "pointer" : "default",
        boxShadow: "0 2px 12px rgba(92,3,155,0.06)",
        transition: "all 0.25s", position: "relative", overflow: "hidden",
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(92,3,155,0.13)"; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(92,3,155,0.06)"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            {title}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
            {displayValue}
          </div>
          {trend && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>{trend}</div>}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </div>
  );
};

/* ─── Section Header ─── */
type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
};
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, extra }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{subtitle}</div>}
    </div>
    {extra}
  </div>
);

/* ═══════════════ MAIN ═══════════════ */
const VaultAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState("month");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const params = new URLSearchParams();
      if (timeFilter !== "custom") {
        params.set("range", timeFilter);
      } else if (dateRange?.[0] && dateRange?.[1]) {
        params.set("fromDate", dateRange[0].format("YYYY-MM-DD"));
        params.set("toDate", dateRange[1].format("YYYY-MM-DD"));
      }
      const data = await apiService.get<any>(`/vault/statistics/admin/stats?${params.toString()}`);
      if (data) setStats(data);
      else message.error("Failed to load dashboard data");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeFilter, dateRange]);

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates?.[0] && dates?.[1] ? [dates[0], dates[1]] : null);
  };

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const inner  = stats?.data             ?? stats ?? {};
  const kpis   = inner?.kpis             ?? {};
  const graphs  = inner?.graphs           ?? {};
  const ops    = inner?.opsMonitoring     ?? {};
  const adv    = inner?.advisorMonitoring ?? {};

  const allDates = [...new Set([
    ...(graphs.leadsOverTime ?? []).map((d: any) => d.date),
    ...(graphs.casesOverTime ?? []).map((d: any) => d.date),
  ])].sort();

  const timelineData = allDates.map((date: string) => ({
    name: fmtDate(date, timeFilter),
    Leads: (graphs.leadsOverTime ?? []).find((d: any) => d.date === date)?.count ?? 0,
    Cases: (graphs.casesOverTime ?? []).find((d: any) => d.date === date)?.count ?? 0,
  }));

  const disbData = (graphs.disbursementsOverTime ?? []).map((d: any) => ({
    name: fmtDate(d.date, timeFilter),
    "Amount (M)": +(d.totalAmount / 1_000_000).toFixed(2),
    Count: d.count,
  }));

  const ls = inner?.leadStatus ?? {};
  const leadFunnel = [
    { label: "New",       count: ls?.new       ?? 0, color: BL },
    { label: "Contacted", count: ls?.contacted  ?? 0, color: "#8B5CF6" },
    { label: "Qualified", count: ls?.qualified  ?? 0, color: P },
    { label: "Disbursed", count: ls?.disbursed  ?? 0, color: GN },
  ];
  const totalLeads = kpis.totalLeads || 1;

  if (loading && !stats) return (
    <div style={{ minHeight: "100vh", background: "#f9f8ff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <Spin size="large" />
      <p style={{ color: P, fontWeight: 600, letterSpacing: 1 }}>Loading VAULT Intelligence…</p>
    </div>
  );

  /* ─── tab content ─── */
  const tabItems = [
    {
      key: "overview",
      label: <span style={{ display: "flex", alignItems: "center", gap: 6 }}><TrendingUp size={14} />Overview</span>,
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Row gutter={[16, 16]}>
            {[
              { title: "Total Leads",     value: kpis.totalLeads,       icon: Target,      color: BL,  bg: "#eff6ff", trend: `Conversion: ${(kpis.leadToCaseConversionRate ?? 0).toFixed(1)}%`, onClick: () => navigate("/dashboard/vault-admin/vault/agent-leads") },
              { title: "Active Cases",    value: kpis.activeCases,      icon: FolderOpen,  color: AMB, bg: "#fffbeb", onClick: () => navigate("/dashboard/vault-admin/case/view") },
              { title: "Disbursed Cases", value: kpis.disbursedCases,   icon: DollarSign,  color: GN,  bg: "#ecfdf5", onClick: () => navigate("/dashboard/vault-admin/case/disbursed") },
              { title: "Pending Cases",   value: kpis.pendingCases,     icon: Clock,       color: "#F97316", bg: "#fff7ed" },
              { title: "SLA Breached",    value: kpis.slaBreachedLeads, icon: AlertCircle, color: RD,  bg: "#fef2f2" },
            ].map(p => (
              <Col key={p.title} xs={24} sm={12} lg={5}><KpiCard {...p} loading={loading} /></Col>
            ))}
          </Row>

          {kpis.slaBreachedLeads > 0 && !loading && (
            <Alert message={<b>SLA Breach Alert</b>}
              description={`${kpis.slaBreachedLeads} lead(s) exceeded the standard processing timeframe.`}
              type="error" showIcon
              action={<Button size="small" danger onClick={() => navigate("/dashboard/vault-admin/vault/agent-leads")}>Review Queue</Button>}
              style={{ borderRadius: 14 }} />
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9ff", padding: 24, boxShadow: "0 2px 12px rgba(92,3,155,0.06)" }}>
                <SectionHeader title="Activity Timeline" subtitle="Leads & Cases over time" extra={<Tag color="purple">{timeFilter}</Tag>} />
                {timelineData.length === 0
                  ? <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>No data for this period</div>
                  : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <filter id="glow-p"><feGaussianBlur stdDeviation="2" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                          <filter id="glow-b"><feGaussianBlur stdDeviation="2" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <ReTooltip content={<GlassTip />} />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                        <Line type="monotone" dataKey="Leads" stroke={AMB} strokeWidth={3} dot={{ fill: "#fff", stroke: AMB, r: 5, strokeWidth: 2 }} activeDot={{ r: 7, fill: AMB }} />
                        <Line type="monotone" dataKey="Cases" stroke={P}   strokeWidth={3} dot={{ fill: "#fff", stroke: P,   r: 5, strokeWidth: 2 }} activeDot={{ r: 7, fill: P }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
              </div>
            </Col>
            <Col xs={24} lg={8}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
                {[
                  { title: "Ops Monitoring", items: [{ label: "Queue", value: ops.queueCount, color: P }, { label: "Urgent", value: ops.urgentCount, color: RD }] },
                  { title: "Advisor Monitoring", items: [{ label: "Available", value: adv.availableAdvisors, color: GN }, { label: "Overloaded", value: adv.overloadedAdvisors, color: AMB }] },
                ].map(section => (
                  <div key={section.title} style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9ff", padding: 20, flex: 1, boxShadow: "0 2px 12px rgba(92,3,155,0.06)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>{section.title}</div>
                    <Row gutter={12}>
                      {section.items.map(({ label, value, color }) => (
                        <Col key={label} span={12}>
                          <div style={{ background: `${color}0d`, border: `1px solid ${color}25`, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color }}>{value ?? 0}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginTop: 4 }}>{label}</div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9ff", padding: 24, boxShadow: "0 2px 12px rgba(92,3,155,0.06)" }}>
                <SectionHeader title="Lead Funnel" subtitle="Conversion breakdown" />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {leadFunnel.map(({ label, count, color }) => {
                    const pct = Math.min(100, Math.round((count / totalLeads) * 100));
                    return (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                            {count} <span style={{ fontWeight: 400, color: "#94a3b8" }}>({pct}%)</span>
                          </span>
                        </div>
                        <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9ff", padding: 24, boxShadow: "0 2px 12px rgba(92,3,155,0.06)" }}>
                <SectionHeader title="Lead Source Distribution" />
                {(graphs.leadsBySource ?? []).length === 0
                  ? <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>No source data</div>
                  : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <defs>
                          {PIE_COLORS.map((c, i) => (
                            <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor={c} />
                              <stop offset="100%" stopColor={c} stopOpacity={0.7} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie data={graphs.leadsBySource} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                          paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {(graphs.leadsBySource ?? []).map((_: any, i: number) => (
                            <Cell key={i} fill={`url(#pieGrad${i % PIE_COLORS.length})`} />
                          ))}
                        </Pie>
                        <ReTooltip content={<GlassTip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
              </div>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "leads",
      label: <span style={{ display: "flex", alignItems: "center", gap: 6 }}><UserCheck size={14} />Leads</span>,
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Row gutter={[16, 16]}>
            {[
              { title: "Total Leads",     value: kpis.totalLeads,                                        icon: Target,      color: BL,  bg: "#eff6ff" },
              { title: "Conversion Rate", value: `${(kpis.leadToCaseConversionRate ?? 0).toFixed(1)}%`,  icon: Zap,         color: GN,  bg: "#ecfdf5" },
              { title: "Disbursed",       value: kpis.disbursedCases,                                    icon: DollarSign,  color: P,   bg: "#f5f0ff" },
              { title: "SLA Breached",    value: kpis.slaBreachedLeads,                                  icon: AlertCircle, color: RD,  bg: "#fef2f2" },
            ].map(p => (
              <Col key={p.title} xs={24} sm={12} lg={6}><KpiCard {...p} loading={loading} /></Col>
            ))}
          </Row>

          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9ff", padding: 24, boxShadow: "0 2px 12px rgba(92,3,155,0.06)" }}>
            <SectionHeader title="Lead Status Breakdown" subtitle="All statuses at a glance" />
            <Row gutter={[10, 10]}>
              {Object.entries((inner?.leadStatus ?? {}) as Record<string, number>).map(([key, count], i) => (
                <Col key={key} xs={12} sm={8} md={6} lg={4}>
                  <div style={{
                    background: count > 0 ? `${PIE_COLORS[i % PIE_COLORS.length]}0d` : "#f8fafc",
                    border: `1px solid ${count > 0 ? `${PIE_COLORS[i % PIE_COLORS.length]}30` : "#e2e8f0"}`,
                    borderRadius: 14, padding: "14px 10px", textAlign: "center",
                    transition: "all 0.2s",
                  }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: count > 0 ? PIE_COLORS[i % PIE_COLORS.length] : "#cbd5e1" }}>{count}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 6 }}>{fmtLabel(key)}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9ff", padding: 24, boxShadow: "0 2px 12px rgba(92,3,155,0.06)" }}>
            <SectionHeader title="Leads Over Time" subtitle={`Trend for ${timeFilter}`} />
            {(graphs.leadsOverTime ?? []).length === 0
              ? <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>No data</div>
              : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={(graphs.leadsOverTime ?? []).map((d: any) => ({ name: fmtDate(d.date, timeFilter), Leads: d.count }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BL} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={BL} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <ReTooltip content={<GlassTip />} />
                    <Area type="monotone" dataKey="Leads" stroke={BL} strokeWidth={3} fill="url(#lGrad)" dot={false} activeDot={{ r: 6, fill: BL }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
          </div>
        </div>
      ),
    },
    {
      key: "cases",
      label: <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FolderOpen size={14} />Cases</span>,
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Row gutter={[16, 16]}>
            {[
              { title: "Active Cases",  value: kpis.activeCases,                        icon: FolderOpen,  color: AMB, bg: "#fffbeb" },
              { title: "Disbursed",     value: kpis.disbursedCases,                     icon: DollarSign,  color: GN,  bg: "#ecfdf5" },
              { title: "Pending",       value: kpis.pendingCases,                       icon: Clock,       color: P,   bg: "#f5f0ff" },
              { title: "At Bank",       value: inner?.caseStatus?.bankApplication ?? 0, icon: Building2,   color: BL,  bg: "#eff6ff" },
            ].map(p => (
              <Col key={p.title} xs={24} sm={12} lg={6}><KpiCard {...p} loading={loading} /></Col>
            ))}
          </Row>

          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9ff", padding: 24, boxShadow: "0 2px 12px rgba(92,3,155,0.06)" }}>
            <SectionHeader title="Application Pipeline" subtitle="Status breakdown" />
            <Row gutter={[10, 10]}>
              {Object.entries((inner?.caseStatus ?? {}) as Record<string, number>).map(([key, count]: [string, number]) => {
                const accent = key === "disbursed" ? GN : key === "rejected" || key === "lost" ? RD : key === "bankApplication" ? BL : P;
                return (
                  <Col key={key} xs={12} sm={8} md={6} lg={4}>
                    <div style={{
                      background: count > 0 ? `${accent}0d` : "#f8fafc",
                      border: `1px solid ${count > 0 ? `${accent}30` : "#e2e8f0"}`,
                      borderRadius: 14, padding: "16px 10px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: count > 0 ? accent : "#cbd5e1" }}>{count}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginTop: 6, lineHeight: 1.3 }}>{fmtLabel(key)}</div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9ff", padding: 24, boxShadow: "0 2px 12px rgba(92,3,155,0.06)" }}>
                <SectionHeader title="Disbursement Volume" subtitle="AED Millions over time" />
                {disbData.length === 0
                  ? <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>No disbursements this period</div>
                  : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={disbData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={GN} stopOpacity={0.45} />
                            <stop offset="100%" stopColor={GN} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <ReTooltip content={<GlassTip suffix=" M AED" />} />
                        <Area type="monotone" dataKey="Amount (M)" stroke={GN} strokeWidth={3} fill="url(#dGrad)" dot={false} activeDot={{ r: 6, fill: GN }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
              </div>
            </Col>
            <Col xs={24} lg={8}>
              <div style={{ background: GRAD, borderRadius: 20, padding: 28, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, textAlign: "center", boxShadow: "0 8px 28px rgba(92,3,155,0.3)" }}>
                <DollarSign size={48} style={{ opacity: 0.9, marginBottom: 16 }} />
                <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{loading ? "—" : kpis.disbursedCases ?? 0}</div>
                <div style={{ fontSize: 14, opacity: 0.8, marginTop: 8 }}>Cases Disbursed</div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Successfully completed</div>
                <button
                  onClick={() => navigate("/dashboard/vault-admin/case/disbursed")}
                  style={{ marginTop: 24, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 30, color: "#fff", padding: "10px 24px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                >
                  View Report →
                </button>
              </div>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "network",
      label: <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Users size={14} />Network</span>,
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Row gutter={[16, 16]}>
            {[
              { title: "Referral Partners", value: kpis.totalFreelanceAgents, icon: Handshake, color: P,   bg: "#f5f0ff" },
              { title: "Partners",          value: kpis.totalPartners,        icon: Building2, color: BL,  bg: "#eff6ff" },
              { title: "Advisors",          value: kpis.totalAdvisors,        icon: Users,     color: GN,  bg: "#ecfdf5" },
              { title: "Ops Executives",    value: kpis.totalOpsExecutives,   icon: Shield,    color: AMB, bg: "#fffbeb" },
            ].map(p => (
              <Col key={p.title} xs={24} sm={12} lg={6}><KpiCard {...p} loading={loading} /></Col>
            ))}
          </Row>

          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9ff", padding: 24, boxShadow: "0 2px 12px rgba(92,3,155,0.06)" }}>
            <SectionHeader title="Network Distribution" />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Referral Partners", value: kpis.totalFreelanceAgents, color: P },
                { label: "Partners",          value: kpis.totalPartners,        color: BL },
                { label: "Advisors",          value: kpis.totalAdvisors,        color: GN },
                { label: "Ops Executives",    value: kpis.totalOpsExecutives,   color: AMB },
              ].map(({ label, value, color }) => {
                const total = (kpis.totalFreelanceAgents ?? 0) + (kpis.totalPartners ?? 0) + (kpis.totalAdvisors ?? 0) + (kpis.totalOpsExecutives ?? 0);
                const pct = total > 0 ? Math.round(((value ?? 0) / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        {value ?? 0} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Row gutter={[16, 16]}>
            {[
              { label: "Available Advisors",  value: adv.availableAdvisors,  color: GN,  icon: UserCheck   },
              { label: "Overloaded Advisors", value: adv.overloadedAdvisors, color: RD,  icon: AlertCircle },
              { label: "Ops Queue",           value: ops.queueCount,         color: P,   icon: Layers      },
              { label: "Urgent Items",        value: ops.urgentCount,        color: AMB, icon: Zap         },
            ].map(({ label, value, color, icon: Icon }) => (
              <Col key={label} xs={24} sm={12} lg={6}>
                <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ede9ff", padding: 20, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 12px rgba(92,3,155,0.06)" }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 800, color }}>{loading ? "—" : (value ?? 0)}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      ),
    },
  ];

  return (
    <div style={{ background: "#f9f8ff", minHeight: "100vh", fontFamily: "inherit" }}>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: GRAD, padding: "24px 32px", marginBottom: 0, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 80, bottom: -50, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-chart-line" style={{ fontSize: 20, color: "#fff" }} />
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>VAULT Intelligence</h1>
            </div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Real-time metrics &amp; operational overview</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            {["today","week","month","custom"].map(r => (
              <button key={r} onClick={() => setTimeFilter(r)}
                style={{ padding: "7px 18px", borderRadius: 40, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.2s",
                  background: timeFilter === r ? "#fff" : "rgba(255,255,255,0.15)",
                  color: timeFilter === r ? P : "#fff" }}>
                {r === "today" ? "Today" : r === "week" ? "Week" : r === "month" ? "Month" : "Custom"}
              </button>
            ))}
            {timeFilter === "custom" && (
              <RangePicker value={dateRange} onChange={handleDateRangeChange} size="small" style={{ borderRadius: 10 }} />
            )}
            <button onClick={() => fetchStats(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, color: "#fff", padding: "7px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              <i className="fas fa-sync-alt" style={{ fontSize: 12 }} /> Sync
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div style={{ padding: "24px 32px" }}>
        <Tabs
          defaultActiveKey="overview"
          items={tabItems}
          tabBarStyle={{ marginBottom: 24 }}
        />
      </div>

      <style>{`
        .ant-tabs-ink-bar { background: ${P} !important; height: 3px !important; border-radius: 3px 3px 0 0 !important; }
        .ant-tabs-tab-active .ant-tabs-tab-btn { color: ${P} !important; font-weight: 700 !important; }
        .ant-tabs-tab:hover { color: ${P} !important; }
        .ant-tabs-tab { font-size: 13px !important; font-weight: 600 !important; color: #64748b !important; }
        .ant-segmented-item-selected { color: ${P} !important; font-weight: 700 !important; }
      `}</style>
    </div>
  );
};

export default VaultAdminDashboard;
