import React, { useState, useEffect, useCallback } from "react";
import { Spin, message, Progress } from "antd";
import { apiService } from "@/api/apiService";
import dayjs from "dayjs";

const P   = "#5C039B";
const PL  = "#F5F0FF";
const GN  = "#10b981";
const BL  = "#3b82f6";
const AMB = "#f59e0b";
const RD  = "#ef4444";
const CY  = "#06b6d4";

const fmt = (v) => {
  if (!v && v !== 0) return "AED 0";
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `AED ${(v / 1_000).toFixed(0)}K`;
  return `AED ${(v || 0).toLocaleString()}`;
};

const PERIOD_RANGE = { week: "week", month: "month", quarter: "6months", year: "year" };

const STATUS_ITEMS = [
  { key: "new",                  label: "New",             color: BL  },
  { key: "contacted",            label: "Contacted",       color: AMB },
  { key: "qualified",            label: "Qualified",       color: P   },
  { key: "collectingDocuments",  label: "Collecting Docs", color: CY  },
  { key: "bankApplication",      label: "Bank Application",color: "#8b5cf6" },
  { key: "preApproved",          label: "Pre-Approved",    color: GN  },
  { key: "disbursed",            label: "Disbursed",       color: "#065f46" },
  { key: "notProceeding",        label: "Not Proceeding",  color: "#9ca3af" },
];

const STATUS_COLOR = {
  New: BL, Contacted: AMB, Qualified: P, "Collecting Documents": CY,
  "Bank Application": "#8b5cf6", "Pre-Approved": GN, Disbursed: "#065f46", "Not Proceeding": "#9ca3af",
};

export default function Analytics() {
  const [period,  setPeriod]  = useState("month");
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(`/vault/statistics/agent/stats?range=${PERIOD_RANGE[period] || "month"}`);
      if (res?.success) setStats(res.data);
      else message.error("Failed to load analytics");
    } catch {
      message.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const agentInfo    = stats?.agentInfo        ?? {};
  const profile      = stats?.profileCompletion ?? {};
  const kpis         = stats?.kpis             ?? {};
  const leadStatus   = stats?.leadStatus       ?? {};
  const graphs       = stats?.graphs           ?? {};
  const recentLeads  = stats?.recentLeads      ?? [];
  const leaderboard  = stats?.leaderboardPreview ?? [];

  const leadsChart  = (graphs.leadsOverTime    ?? []).map(d => ({ label: dayjs(d.date).format("DD MMM"), value: d.count }));
  const commTrend   = (graphs.commissionTrend  ?? []).map(d => ({ label: d.month, value: d.amount || 0 }));

  const maxLeads = Math.max(...leadsChart.map(d => d.value), 1);
  const maxComm  = Math.max(...commTrend.map(d => d.value), 1);

  const activeStatusItems = STATUS_ITEMS.filter(i => (leadStatus[i.key] ?? 0) > 0);
  const maxStatusCount    = Math.max(...activeStatusItems.map(i => leadStatus[i.key] ?? 0), 1);
  const totalStatusCount  = Object.values(leadStatus).reduce((s, v) => s + (v || 0), 0) || 1;

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
            <div style={{ fontSize: 11, fontWeight: 600, color: P, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Agent Analytics</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0 }}>Analytics & Reporting</h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              {agentInfo.agentType === "ReferralPartner" ? "Referral Partner" : "Agent"} performance, conversion metrics, and commission trends.
            </p>
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

        {/* Profile Completion Banner */}
        {!profile.isComplete && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
            <i className="fas fa-exclamation-triangle" style={{ color: AMB, fontSize: 18 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#92400e", fontSize: 13 }}>Profile Incomplete — {profile.percentage ?? 0}% done</div>
              {profile.missingFields?.length > 0 && (
                <div style={{ fontSize: 12, color: "#b45309", marginTop: 3 }}>Missing: {profile.missingFields.join(", ")}</div>
              )}
            </div>
            <Progress type="circle" percent={profile.percentage ?? 0} size={44} strokeColor={AMB} trailColor="#fde68a" />
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total Leads",       value: kpis.totalLeads        ?? 0,  icon: "fas fa-user-plus",    color: BL,  bg: "#eff6ff" },
            { label: "Active Referrals",  value: kpis.activeReferrals   ?? 0,  icon: "fas fa-circle-notch", color: AMB, bg: "#fffbeb" },
            { label: "Qualified Leads",   value: kpis.qualifiedLeads    ?? 0,  icon: "fas fa-check-double", color: P,   bg: PL },
            { label: "Disbursed",         value: kpis.disbursedLeads    ?? 0,  icon: "fas fa-coins",        color: GN,  bg: "#ecfdf5" },
            { label: "Conversion Rate",   value: `${(kpis.conversionRate ?? 0).toFixed(1)}%`, icon: "fas fa-chart-line", color: CY, bg: "#cffafe" },
            { label: "Commission Earned", value: fmt(kpis.totalCommissionEarned ?? 0), icon: "fas fa-wallet", color: "#7c3aed", bg: "#f5f3ff" },
            { label: "Pending Commission",value: fmt(kpis.pendingCommission ?? 0),     icon: "fas fa-clock",  color: RD,  bg: "#fef2f2" },
          ].map(item => (
            <div key={item.label} style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", border: "1px solid #ede9fe", boxShadow: "0 2px 8px rgba(92,3,156,0.05)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: item.bg, display: "grid", placeItems: "center", color: item.color, fontSize: 14, marginBottom: 12 }}>
                <i className={item.icon} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>{item.value}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5, fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* Leads over time */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", padding: "20px 24px", boxShadow: "0 2px 8px rgba(92,3,156,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>Lead Submissions</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Daily referrals submitted — {period}</div>
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
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Monthly commission earned</div>
            {commTrend.length === 0
              ? <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No commission data yet</div>
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

        {/* Lead Status + Leaderboard */}
        <div style={{ display: "grid", gridTemplateColumns: leaderboard.length > 0 ? "1fr 320px" : "1fr", gap: 20, marginBottom: 24 }}>

          {/* Lead Status Breakdown */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", padding: "20px 24px", boxShadow: "0 2px 8px rgba(92,3,156,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 16 }}>My Lead Pipeline</div>
            {activeStatusItems.length === 0
              ? <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No leads yet</div>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activeStatusItems.map(item => {
                    const count = leadStatus[item.key] ?? 0;
                    const pct   = Math.round((count / totalStatusCount) * 100);
                    return (
                      <div key={item.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{item.label}</span>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>{count} <span style={{ color: "#9ca3af" }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99 }}>
                          <div style={{ height: "100%", width: `${(count / maxStatusCount) * 100}%`, background: item.color, borderRadius: 99, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>

          {/* Leaderboard Preview (Referral Partners only) */}
          {leaderboard.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", overflow: "hidden", boxShadow: "0 2px 8px rgba(92,3,156,0.05)" }}>
              <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f3f4f6", background: `linear-gradient(135deg, ${P}0a, #7c3aed0a)` }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
                  <i className="fas fa-trophy" style={{ color: "#fbbf24", marginRight: 8 }} />
                  Top Earners
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>Referral partner leaderboard</div>
              </div>
              {leaderboard.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: i < leaderboard.length - 1 ? "1px solid #f9fafb" : "none" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800, flexShrink: 0,
                    background: i === 0 ? "#fbbf24" : i === 1 ? "#9ca3af" : "#cd7c3a",
                    color: "#fff",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.name}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: P }}>{fmt(item.totalCommissionEarned)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        {recentLeads.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", overflow: "hidden", boxShadow: "0 2px 8px rgba(92,3,156,0.05)" }}>
            <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Recent Leads</div>
            </div>
            {recentLeads.map((lead, i) => (
              <div key={lead._id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 24px", borderBottom: i < recentLeads.length - 1 ? "1px solid #f9fafb" : "none" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: PL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: P, flexShrink: 0 }}>
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
