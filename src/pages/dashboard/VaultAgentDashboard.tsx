import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Tag, Button, Table, Spin, Empty, Progress } from 'antd';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { apiService } from '../../api/apiService';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const P   = '#5C039B';
const PL  = '#f3e8ff';
const GN  = '#10b981';
const GNL = '#d1fae5';
const AM  = '#f59e0b';
const AML = '#fef3c7';
const BL  = '#3b82f6';
const BLL = '#dbeafe';
const RD  = '#ef4444';
const CY  = '#06b6d4';
const CYL = '#cffafe';

interface KPIs {
  totalLeads: number;
  qualifiedLeads: number;
  activeReferrals?: number;
  disbursedLeads: number;
  conversionRate: number;
  totalCommissionEarned: number;
  pendingCommission: number;
}
interface LeadStatus {
  new: number; contacted: number; qualified: number;
  collectingDocuments: number; bankApplication: number; preApproved: number;
  valuation: number; folIssued: number; folSigned: number;
  disbursed: number; notProceeding: number;
}
interface ProfileCompletion {
  percentage: number;
  isComplete: boolean;
  commissionEligible: boolean;
  missingFields: string[];
}
interface RecentLead {
  _id: string; customerName: string; status: string; createdAt: string;
}
interface StatsData {
  agentInfo: {
    _id: string;
    name: string;
    email: string;
    agentType: string;
  };
  profileCompletion: ProfileCompletion;
  kpis: KPIs;
  leadStatus: LeadStatus;
  graphs: {
    leadsOverTime: { date: string; count: number }[];
    commissionTrend: { month: string; amount: number; count: number }[];
  };
  recentLeads: RecentLead[];
  leaderboardPreview?: { name: string; totalCommissionEarned: number }[];
}

const STATUS_COLOR: Record<string, string> = {
  New: BL, Contacted: CY, Qualified: GN,
  'Collecting Documents': AM, 'Bank Application': P,
  'Pre Approved': '#059669', 'Valuation': '#10b981',
  'FOL Issued': '#7c3aed', 'FOL Signed': '#5C039B',
  Disbursed: '#059669', 'Not Proceeding': RD,
};

const PIE_COLORS = [BL, CY, GN, AM, P, '#059669', RD, '#10b981', '#7c3aed', '#5C039B'];

const fmtAED = (n: number) => n >= 1_000_000
  ? `AED ${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000
    ? `AED ${(n / 1_000).toFixed(0)}K`
    : `AED ${n.toLocaleString()}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#374151' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' && (p.name?.toLowerCase().includes('amount') || p.name?.toLowerCase().includes('earned') || p.name?.toLowerCase().includes('commission')) ? fmtAED(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const VaultAgentDashboard: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get<{ success: boolean; data: StatsData }>('/vault/statistics/agent/stats');
      if (res?.data) setStats(res.data);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const kpi = stats?.kpis;
  const ls  = stats?.leadStatus;
  const pc  = stats?.profileCompletion;

  const isReferralPartner = stats?.agentInfo?.agentType === 'ReferralPartner';

  const kpiCards = isReferralPartner ? [
    { label: 'Total Referrals',     value: kpi?.totalLeads ?? 0,             icon: 'fas fa-users',           color: P,   bg: PL },
    { label: 'Active Referrals',    value: kpi?.activeReferrals ?? 0,        icon: 'fas fa-check-circle',    color: GN,  bg: GNL },
    { label: 'Conversion Rate',     value: `${kpi?.conversionRate ?? 0}%`,   icon: 'fas fa-chart-line',      color: AM,  bg: AML },
    { label: 'Commission Earned',   value: fmtAED(kpi?.totalCommissionEarned ?? 0), icon: 'fas fa-wallet', color: '#059669', bg: GNL },
    { label: 'Pending Commission',  value: fmtAED(kpi?.pendingCommission ?? 0),     icon: 'fas fa-clock',  color: BL,  bg: BLL },
    { label: 'Profile Score',       value: `${pc?.percentage ?? 0}%`,        icon: 'fas fa-user-check',      color: CY,  bg: CYL },
  ] : [
    { label: 'Total Leads',         value: kpi?.totalLeads ?? 0,             icon: 'fas fa-users',           color: P,   bg: PL },
    { label: 'Qualified Leads',     value: kpi?.qualifiedLeads ?? 0,         icon: 'fas fa-check-circle',    color: GN,  bg: GNL },
    { label: 'Conversion Rate',     value: `${kpi?.conversionRate ?? 0}%`,   icon: 'fas fa-chart-line',      color: AM,  bg: AML },
    { label: 'Profile Score',       value: `${pc?.percentage ?? 0}%`,        icon: 'fas fa-user-check',      color: CY,  bg: CYL },
  ];

  const colSpan = isReferralPartner ? { xs: 12, sm: 8, md: 4 } : { xs: 12, sm: 12, md: 6 };

  const pieData = ls ? Object.entries(ls)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
      value
    })) : [];

  const leadsOverTime = stats?.graphs?.leadsOverTime?.map(d => ({
    date: dayjs(d.date).format('DD MMM'), count: d.count,
  })) ?? [];

  const commissionTrend = stats?.graphs?.commissionTrend?.map(d => ({
    month: d.month, amount: d.amount, count: d.count
  })) ?? [];

  const recentLeadColumns = [
    {
      title: 'Customer', dataIndex: 'customerName', key: 'customerName',
      render: (n: string) => <span style={{ fontWeight: 600 }}>{n}</span>,
    },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag style={{ borderRadius: 20, fontWeight: 600, border: 'none', background: (STATUS_COLOR[s] || P) + '20', color: STATUS_COLOR[s] || P }}>{s}</Tag>
      ),
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt',
      render: (d: string) => <span style={{ fontSize: 12, color: '#9ca3af' }}>{dayjs(d).format('DD MMM YYYY')}</span>,
    },
    {
      title: '', key: 'action',
      render: (_: any, row: RecentLead) => (
        <Button size="small" style={{ borderRadius: 8, borderColor: P, color: P, fontWeight: 600 }}
          onClick={() => navigate(`/dashboard/vaultagent/leads/${row._id}`)}>View</Button>
      ),
    },
  ];

  const agentTypeLabel = stats?.agentInfo?.agentType === 'ReferralPartner' ? 'Referral Partner' : 'Affiliated Agent';

  return (
    <div style={{ padding: '20px 24px', background: '#f9f8ff', minHeight: '100vh' }}>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: `linear-gradient(135deg, ${P}, #03A4F4)`, borderRadius: 20, padding: '22px 28px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', right: -20, top: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, position: 'relative' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 }}>
              {agentTypeLabel} Portal • {dayjs().format('dddd, DD MMMM YYYY')}
            </div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>
              Welcome back, {stats?.agentInfo?.name || user?.name || 'Partner'}!
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: '6px 0 0', fontSize: 14 }}>
              Operational pulse for our {agentTypeLabel}.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={() => navigate('/dashboard/vaultagent/leads/create')}
              style={{ borderRadius: 12, height: 42, background: '#fff', border: 'none', color: P, fontWeight: 700, paddingInline: 20 }}>
              <i className="fas fa-plus mr-2" /> New Lead
            </Button>
            <Button onClick={() => navigate('/dashboard/vaultagent/leads')}
              style={{ borderRadius: 12, height: 42, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontWeight: 600, paddingInline: 20 }}>
              <i className="fas fa-list mr-2" /> My Leads
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── PROFILE COMPLETION ALERT ─────────────────────────────────────── */}
      {pc && !pc.isComplete && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 24, border: `1px solid ${AM}40`, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 12px rgba(245,158,11,0.08)' }}
        >
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: AML, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fas fa-exclamation-triangle" style={{ color: AM, fontSize: 20 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#1f2937', fontSize: 15 }}>Complete your profile to unlock commissions!</div>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
              Missing: <span style={{ fontWeight: 700, color: AM }}>{pc.missingFields.join(', ')}</span>
            </div>
          </div>
          <div style={{ width: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: AM }}>STRENGTH</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: AM }}>{pc.percentage}%</span>
            </div>
            <Progress percent={pc.percentage} strokeColor={AM} showInfo={false} size={{ height: 6 }} />
          </div>
          <Button onClick={() => navigate('/dashboard/vaultagent/profile')} style={{ borderRadius: 10, fontWeight: 700, color: AM, borderColor: AM }}>Update Now</Button>
        </motion.div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin size="large" /></div>
      ) : !stats ? (
        <Empty description="Could not load dashboard data" />
      ) : (
        <>
          {/* ── KPI CARDS ──────────────────────────────────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            {kpiCards.map((c, i) => (
              <Col {...colSpan} key={c.label}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <div style={{ background: '#fff', borderRadius: 16, padding: '18px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `4px solid ${c.color}`, height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{c.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`${c.icon} text-sm`} style={{ color: c.color }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Col>
            ))}
          </Row>

          {/* ── QUICK LINKS ──────────────────────────────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            {[
              { label: 'My Profile', sub: 'Update EID, bank details & docs', icon: 'fas fa-user-circle', color: P, bg: PL, path: '/dashboard/vaultagent/profile' },
              { label: 'Submit Lead', sub: 'Add a new client lead', icon: 'fas fa-plus-circle', color: GN, bg: GNL, path: '/dashboard/vaultagent/leads/create' },
              { label: 'My Leads', sub: 'View your lead pipeline', icon: 'fas fa-list-ul', color: BL, bg: BLL, path: '/dashboard/vaultagent/leads' },
              { label: 'Proposals', sub: 'Create & view proposals', icon: 'fas fa-file-contract', color: AM, bg: AML, path: '/dashboard/vaultagent/proposals/list' },
              ...(isReferralPartner ? [{ label: 'Commission', sub: 'Track your earnings', icon: 'fas fa-wallet', color: CY, bg: CYL, path: '/dashboard/vaultagent/commission' }] : []),
            ].map((item) => {
              const mdVal = isReferralPartner ? 24 / 5 : 6;
              return (
                <Col xs={12} sm={8} md={mdVal} key={item.label}>
                  <div
                    onClick={() => navigate(item.path)}
                    style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', border: `1px solid ${item.color}20`, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 12 }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={item.icon} style={{ color: item.color, fontSize: 16 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937' }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{item.sub}</div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>

          {/* ── CHARTS ROW 1: Leads Over Time + Lead Status ──────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={15}>
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: '100%' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: '#1f2937' }}>
                  <i className="fas fa-chart-area mr-2" style={{ color: P }} /> Leads Trend
                </div>
                {leadsOverTime.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={leadsOverTime}>
                      <defs>
                        <linearGradient id="aLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={P} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={P} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" name="Leads" stroke={P} fill="url(#aLeads)" strokeWidth={3} dot={{ r: 4, fill: P, strokeWidth: 2, stroke: '#fff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: 8 }}>
                    <i className="fas fa-chart-area text-3xl" />
                    <span style={{ fontSize: 13 }}>No lead activity recorded</span>
                  </div>
                )}
              </div>
            </Col>

            <Col xs={24} md={9}>
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: '100%' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: '#1f2937' }}>
                  <i className="fas fa-chart-pie mr-2" style={{ color: GN }} /> Pipeline Distribution
                </div>
                {pieData.length ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={4} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                        </Pie>
                        <Tooltip formatter={(v: any, n: any) => [v, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', marginTop: 12 }}>
                      {pieData.map((d, i) => (
                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>{d.name}: {d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: 8 }}>
                    <i className="fas fa-chart-pie text-3xl" />
                    <span style={{ fontSize: 13 }}>No pipeline data</span>
                  </div>
                )}
              </div>
            </Col>
          </Row>

          {/* ── CHARTS ROW 2: Commission + Pipeline ─────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {isReferralPartner && (
              <Col xs={24} md={14}>
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: '#1f2937' }}>
                    <i className="fas fa-coins mr-2" style={{ color: AM }} /> Commission Performance
                  </div>
                  {commissionTrend.length ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={commissionTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="amount" name="Earned" fill={AM} radius={[6,6,0,0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: 8 }}>
                      <i className="fas fa-coins text-3xl" />
                      <span style={{ fontSize: 13 }}>No earnings data yet</span>
                    </div>
                  )}
                </div>
              </Col>
            )}

            <Col xs={24} md={isReferralPartner ? 10 : 24}>
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: '100%' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: '#1f2937' }}>
                  <i className="fas fa-stream mr-2" style={{ color: BL }} /> Detailed Funnel
                </div>
                <div className="sb-scroll" style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {ls && Object.entries(ls).map(([key, count]) => {
                    const statusKey = key === 'collectingDocuments' ? 'Collecting Documents'
                      : key === 'applicationCreated' ? 'Application Created'
                      : key === 'bankApplication' ? 'Bank Application'
                      : key === 'preApproved' ? 'Pre Approved'
                      : key === 'folIssued' ? 'FOL Issued'
                      : key === 'folSigned' ? 'FOL Signed'
                      : key === 'notProceeding' ? 'Not Proceeding'
                      : key.charAt(0).toUpperCase() + key.slice(1);
                    const color = STATUS_COLOR[statusKey] ?? '#9ca3af';
                    const total = kpi?.totalLeads || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', width: 110, flexShrink: 0 }}>{statusKey}</span>
                        <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.8s ease' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color, width: 20, textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Col>
          </Row>

          {/* ── ROW 3: Leaderboard & Recent Activity ────────────────────── */}
          <Row gutter={[16, 16]}>
            {isReferralPartner && (
              <Col xs={24} md={8}>
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: '100%' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: '#1f2937' }}>
                    <i className="fas fa-award mr-2" style={{ color: '#ffd700' }} /> Weekly Leaderboard Preview
                  </div>
                  {stats.leaderboardPreview && stats.leaderboardPreview.length > 0 ? (
                    <Table
                      columns={[
                        {
                          title: 'Rank',
                          key: 'rank',
                          width: 60,
                          render: (_: any, __: any, index: number) => {
                            const colors = ['#ffd700', '#c0c0c0', '#cd7f32'];
                            return index < 3 ? <i className="fas fa-trophy" style={{ color: colors[index] }} /> : index + 1;
                          }
                        },
                        {
                          title: 'Name',
                          dataIndex: 'name',
                          key: 'name',
                          render: (n: string) => <span style={{ fontWeight: 600 }}>{n}</span>
                        },
                        {
                          title: 'Earned',
                          dataIndex: 'totalCommissionEarned',
                          key: 'totalCommissionEarned',
                          render: (amt: number) => <span style={{ fontWeight: 700, color: '#059669' }}>{fmtAED(amt)}</span>
                        }
                      ]}
                      dataSource={stats.leaderboardPreview.map((item, idx) => ({ ...item, key: idx }))}
                      pagination={false}
                      size="small"
                    />
                  ) : (
                    <Empty description="No leaderboard data available" />
                  )}
                </div>
              </Col>
            )}

            <Col xs={24} md={isReferralPartner ? 16 : 24}>
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>
                    <i className="fas fa-list mr-2" style={{ color: P }} /> Recent Activity
                  </div>
                  <Button size="small" style={{ borderRadius: 8, borderColor: P, color: P, fontWeight: 600 }}
                    onClick={() => navigate('/dashboard/vaultagent/leads')}>
                    View All <i className="fas fa-arrow-right ml-1" />
                  </Button>
                </div>
                {stats.recentLeads.length ? (
                  <Table
                    columns={recentLeadColumns}
                    dataSource={stats.recentLeads.map(l => ({ ...l, key: l._id }))}
                    pagination={false}
                    size="small"
                    style={{ fontSize: 13 }}
                  />
                ) : (
                  <Empty description="No recent leads" />
                )}
              </div>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default VaultAgentDashboard;
