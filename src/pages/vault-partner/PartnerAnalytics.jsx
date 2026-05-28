import React, { useState, useEffect, useCallback } from "react";
import { Spin, message } from "antd";
import { apiService } from "@/api/apiService";
import dayjs from "dayjs";

const P   = "#5C039B";
const PL  = "#F5F0FF";
const GN  = "#10b981";
const BL  = "#3b82f6";
const AMB = "#f59e0b";
const RD  = "#ef4444";

const fmt = (v) => {
  if (!v && v !== 0) return "AED 0";
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `AED ${(v / 1_000).toFixed(0)}K`;
  return `AED ${v.toLocaleString()}`;
};

const PERIOD_RANGE = { week: "week", month: "month", quarter: "6months", year: "year" };

export default function PartnerAnalytics() {
  const [period,  setPeriod]  = useState("month");
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(`/vault/statistics/partner/stats?range=${PERIOD_RANGE[period] || "month"}`);
      if (res?.success) setStats(res.data);
      else message.error("Failed to load analytics");
    } catch {
      message.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const kpis        = stats?.kpis         ?? {};
  const graphs      = stats?.graphs       ?? {};
  const leadStatus  = stats?.leadStatus   ?? {};
  const agentsSummary = stats?.agentsSummary ?? null;
  const recentLeads = stats?.recentLeads  ?? [];

  const leadsChart   = (graphs.leadsOverTime    ?? []).map(d => ({ label: dayjs(d.date).format("DD MMM"), value: d.count }));
  const commTrend    = (graphs.commissionTrend  ?? []).map(d => ({ label: d.month, value: d.amount || 0 }));
  const disbTrend    = (graphs.disbursementTrend ?? []).map(d => ({ label: dayjs(d.date).format("DD MMM"), count: d.count }));

  const maxLeads = Math.max(...leadsChart.map(d => d.value), 1);
  const maxComm  = Math.max(...commTrend.map(d => d.value), 1);
  const maxDisb  = Math.max(...disbTrend.map(d => d.count), 1);

  const LEAD_STATUS_ITEMS = [
    { key: "new",                 label: "New",            color: BL  },
    { key: "contacted",          label: "Contacted",       color: AMB },
    { key: "qualified",          label: "Qualified",       color: P   },
    { key: "collectingDocuments",label: "Collecting Docs", color: "#8b5cf6" },
    { key: "bankApplication",    label: "Bank App",        color: "#7c3aed" },
    { key: "preApproved",        label: "Pre-Approved",    color: GN  },
    { key: "disbursed",          label: "Disbursed",       color: "#065f46" },
    { key: "lost",               label: "Lost",            color: "#9ca3af" },
  ].filter(i => (leadStatus[i.key] ?? 0) > 0);

  const maxStatusCount = Math.max(...LEAD_STATUS_ITEMS.map(i => leadStatus[i.key] ?? 0), 1);

  const STATUS_COLOR = {
    New: "#3b82f6", Contacted: "#f59e0b", Qualified: "#8b5cf6",
    "Collecting Documents": "#06b6d4", "Bank Application": "#5C039B",
    "Pre-Approved": "#10b981", Disbursed: "#065f46", Lost: "#9ca3af",
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <Spin size="large" />
      <p style={{ color: P, fontWeight: 600 }}>Loading analytics…</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", padding: "28px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: P, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Partner Insights</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0 }}>Partner Analytics</h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>Referral performance, case conversions, and commission trends.</p>
          </div>
          <div style={{ display: "flex", gap: 8, background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
            {["week", "month", "quarter", "year"].map(item => (
              <button key={item} onClick={() => setPeriod(item)} style={{
                padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, textTransform: "capitalize",
                background: period === item ? `linear-gradient(135deg, ${P}, #7c3aed)` : "transparent",
                color: period === item ? "#fff" : "#6b7280",
                transition: "all 0.2s",
              }}>{item}</button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total Leads",       value: kpis.totalLeads ?? 0,                           icon: "fas fa-user-plus",     color: BL,  bg: "#eff6ff" },
            { label: "Active Cases",      value: kpis.activeCases ?? 0,                          icon: "fas fa-briefcase",     color: P,   bg: PL },
            { label: "Disbursed Cases",   value: kpis.disbursedCases ?? 0,                       icon: "fas fa-check-circle",  color: GN,  bg: "#ecfdf5" },
            { label: "Conversion Rate",   value: `${(kpis.conversionRate ?? 0).toFixed(1)}%`,    icon: "fas fa-chart-line",    color: AMB, bg: "#fffbeb" },
            { label: "Commission Earned", value: fmt(kpis.totalCommissionEarned ?? 0),           icon: "fas fa-wallet",        color: "#7c3aed", bg: "#f5f3ff" },
            { label: "Pending Commission",value: fmt(kpis.pendingCommission ?? 0),               icon: "fas fa-clock",         color: RD,  bg: "#fef2f2" },
          ].map(item => (
            <div key={item.label} style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", border: "1px solid #ede9fe", boxShadow: "0 2px 8px rgba(92,3,156,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: item.bg, display: "grid", placeItems: "center", color: item.color, fontSize: 14 }}>
                  <i className={item.icon} />
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>{item.value}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5, fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Agent Summary (company partners only) */}
        {agentsSummary && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", padding: "20px 24px", marginBottom: 24, boxShadow: "0 2px 8px rgba(92,3,156,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 16 }}>Your Agent Network</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { label: "Total Agents",   value: agentsSummary.totalAgents,  color: BL,  bg: "#eff6ff" },
                { label: "Active Agents",  value: agentsSummary.activeAgents, color: GN,  bg: "#ecfdf5" },
                { label: "Pending Agents", value: agentsSummary.pendingAgents,color: AMB, bg: "#fffbeb" },
              ].map(item => (
                <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: "14px 24px", minWidth: 130, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: item.color }}>{item.value ?? 0}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* Leads over time */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", padding: "20px 24px", boxShadow: "0 2px 8px rgba(92,3,156,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>Lead Submissions</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Daily leads submitted — {period}</div>
            {leadsChart.length === 0
              ? <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No data for this period</div>
              : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 140, overflowX: "auto" }}>
                  {leadsChart.map(d => (
                    <div key={d.label} style={{ flex: "0 0 auto", minWidth: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
                      <div title={`${d.label}: ${d.value}`} style={{ width: 18, background: `linear-gradient(180deg, ${P}, #7c3aed)`, borderRadius: "3px 3px 0 0", height: `${(d.value / maxLeads) * 100}%`, minHeight: 4, transition: "height 0.4s" }} />
                      <span style={{ fontSize: 9, color: "#9ca3af", whiteSpace: "nowrap" }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Commission Trend */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", padding: "20px 24px", boxShadow: "0 2px 8px rgba(92,3,156,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>Commission Trend</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Monthly commission amounts</div>
            {commTrend.length === 0
              ? <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No commission data</div>
              : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, overflowX: "auto" }}>
                  {commTrend.map(d => (
                    <div key={d.label} style={{ flex: "0 0 auto", minWidth: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
                      <div title={`${d.label}: ${fmt(d.value)}`} style={{ width: 22, background: `linear-gradient(180deg, ${GN}, #34d399)`, borderRadius: "3px 3px 0 0", height: `${(d.value / maxComm) * 100}%`, minHeight: 4, transition: "height 0.4s" }} />
                      <span style={{ fontSize: 9, color: "#9ca3af", whiteSpace: "nowrap" }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        {/* Lead Status Breakdown */}
        {LEAD_STATUS_ITEMS.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", padding: "20px 24px", marginBottom: 24, boxShadow: "0 2px 8px rgba(92,3,156,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 16 }}>Lead Status Breakdown</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {LEAD_STATUS_ITEMS.map(item => {
                const count = leadStatus[item.key] ?? 0;
                return (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#6b7280", minWidth: 120, textAlign: "right" }}>{item.label}</span>
                    <div style={{ flex: 1, height: 20, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(count / maxStatusCount) * 100}%`, background: item.color, borderRadius: 6, display: "flex", alignItems: "center", paddingLeft: 6, minWidth: count > 0 ? 28 : 0, transition: "width 0.5s" }}>
                        {count > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{count}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Leads */}
        {recentLeads.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", overflow: "hidden", boxShadow: "0 2px 8px rgba(92,3,156,0.05)" }}>
            <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Recent Leads</div>
            </div>
            {recentLeads.map((lead, i) => (
              <div key={lead._id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 24px", borderBottom: i < recentLeads.length - 1 ? "1px solid #f9fafb" : "none" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: PL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: P, flexShrink: 0 }}>
                  {(lead.customerName || "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{lead.customerName || "—"}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{dayjs(lead.createdAt).format("DD MMM YYYY")}</div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                  background: STATUS_COLOR[lead.status] ? `${STATUS_COLOR[lead.status]}18` : "#f3f4f6",
                  color: STATUS_COLOR[lead.status] || "#6b7280",
                }}>
                  {lead.status}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
