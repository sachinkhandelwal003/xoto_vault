// src/components/ecommerce/B2C/MortgageOpsDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Card, Row, Col, Typography, Avatar, Button, Table, Tag,
  Space, Badge, Spin, message, Progress, Tooltip, Alert, Segmented
} from "antd";
import {
  UserOutlined, FileOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ArrowRightOutlined, PlusOutlined,
  EyeOutlined, DollarOutlined, WarningOutlined,
  ReloadOutlined, BarChartOutlined, LineChartOutlined,
  PieChartOutlined, BankOutlined, RocketOutlined,
  DownloadOutlined, HourglassOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/api/apiService";
import dayjs from "dayjs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell
} from "recharts";

const { Title, Text } = Typography;

const P = "#5C039B";
const PM = "#7C3AED";
const GN = "#22C55E";
const BL = "#3B82F6";
const AMB = "#F59E0B";
const RD = "#EF4444";

const StatCard = ({ icon, label, value, color, suffix, tooltip, loading }) => (
  <Card bordered={false} style={{ borderRadius: 18, border: "1px solid #f0e8ff", height: "100%" }} bodyStyle={{ padding: "18px 20px" }} hoverable>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {loading ? <Spin size="small" /> : React.cloneElement(icon, { style: { fontSize: 24, color } })}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#1a0533", lineHeight: 1.2 }}>
          {loading ? "..." : (typeof value === 'number' ? value.toLocaleString() : value || "—")}
          {suffix && <span style={{ fontSize: 14, fontWeight: 400, color: "#9b8ab0", marginLeft: 4 }}>{suffix}</span>}
        </div>
        <div style={{ fontSize: 12, color: "#9b8ab0", marginTop: 2, fontWeight: 500 }}>{label}</div>
        {tooltip && <div style={{ fontSize: 10, color: "#c4b5e0", marginTop: 2 }}>{tooltip}</div>}
      </div>
    </div>
  </Card>
);

// Status Color Mapping
const getStatusColor = (status) => {
  const colors = {
    "pendingReview": "orange",
    "underReview": "blue",
    "returned": "red",
    "bankApplication": "purple",
    "preApproved": "cyan",
    "valuation": "geekblue",
    "folIssued": "volcano",
    "folSigned": "green",
    "disbursed": "success",
    "rejected": "red",
    "lost": "default",
    "Draft": "default",
    "Submitted to Xoto": "purple",
    "In Ops Queue - Pending Pick-up": "orange",
    "Assigned - Pending Review": "blue",
    "Under Review": "cyan",
    "Bank Application": "purple",
    "Pre-Approved": "geekblue",
    "Valuation": "orange",
    "FOL Issued": "volcano",
    "FOL Signed": "green",
    "Disbursed": "success",
    "Rejected": "red",
    "Lost": "default"
  };
  return colors[status] || "default";
};

// Custom Tooltip for Charts
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "white", padding: "12px 16px", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: `1px solid ${P}20` }}>
        <p style={{ margin: 0, fontWeight: 600, color: "#1a0533" }}>{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} style={{ margin: "4px 0 0", color: item.color, fontSize: 13 }}>
            {item.name}: {item.name === "amount" ? `AED ${item.value.toLocaleString()}` : item.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const MortgageOpsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState("month");
  const [chartType, setChartType] = useState("line");

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Ops User";

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await apiService.get(`/vault/statistics/ops/stats?range=${timeFilter}`);
      
      if (response?.data?.success) {
        setStats(response.data);
      } else if (response?.data) {
        setStats(response.data);
      } else {
        message.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      message.error(error?.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 120000);
    return () => clearInterval(interval);
  }, [fetchDashboardStats]);

  const opsInfo = stats?.data?.opsInfo || stats?.opsInfo || {};
  const kpis = stats?.data?.kpis || stats?.kpis || {};
  const workload = stats?.data?.workload || stats?.workload || {};
  const performance = stats?.data?.performance || stats?.performance || {};
  const quickActions = stats?.data?.quickActions || stats?.quickActions || {};
  const graphs = stats?.data?.graphs || stats?.graphs || {};
  const recentCases = stats?.data?.recentCases || stats?.recentCases || [];
  const caseStatusBreakdown = stats?.data?.caseStatusBreakdown || stats?.caseStatusBreakdown || {};

  // Prepare chart data
  const casesOverTimeData = graphs.casesOverTime?.map(item => ({
    date: dayjs(item.date).format("DD MMM"),
    fullDate: item.date,
    count: item.count
  })) || [];

  const disbursementTrendData = graphs.disbursementTrend?.map(item => ({
    date: dayjs(item.date).format("DD MMM"),
    fullDate: item.date,
    amount: item.amount / 1000000,
    count: item.count
  })) || [];

  // Prepare case status distribution for pie chart
  const caseStatusData = Object.entries(caseStatusBreakdown)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({ 
      name: status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), 
      value: count,
      originalKey: status
    }));

  // Prepare workload distribution
  const workloadData = [
    { name: "In Progress", value: workload.inProgress || 0, color: BL },
    { name: "Completed", value: workload.completed || 0, color: GN },
    { name: "Rejected", value: workload.rejected || 0, color: RD },
    { name: "Pending Review", value: workload.pendingReview || 0, color: AMB },
    { name: "Under Review", value: workload.underReview || 0, color: P },
    { name: "Returned", value: workload.returned || 0, color: "#8B5CF6" }
  ].filter(item => item.value > 0);

  const caseColumns = [
    {
      title: "Application Reference",
      dataIndex: "caseReference",
      key: "caseReference",
      width: 180,
      render: (ref) => <Text code style={{ fontSize: 12 }}>{ref}</Text>,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (name) => <span style={{ fontWeight: 500 }}>{name || "—"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => {
        const color = getStatusColor(status);
        return <Tag color={color} style={{ borderRadius: 20, fontWeight: 500 }}>{status}</Tag>;
      },
    },
    {
      title: "Loan Amount",
      key: "amount",
      width: 130,
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: "#059669" }}>
          AED {Number(record.loanAmount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Bank",
      dataIndex: "selectedBank",
      key: "bank",
      width: 150,
      render: (bank) => <span style={{ fontSize: 12 }}>{bank || "—"}</span>,
    },
    {
      title: "Last Updated",
      key: "updated",
      width: 120,
      render: (_, record) => (
        <Tooltip title={record.updatedAt ? dayjs(record.updatedAt).format("DD MMM YYYY, h:mm A") : "N/A"}>
          <span style={{ fontSize: 11, color: "#9b8ab0" }}>
            {record.daysSinceUpdate ? `${record.daysSinceUpdate}d ago` : "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/vault/case/${record._id}`)} style={{ color: P }}>
          View
        </Button>
      ),
    },
  ];

  if (loading && !stats) {
    return (
      <div style={{ background: "#f9f6ff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ background: "#f9f6ff", minHeight: "100vh", padding: "32px 28px" }}>
      <style>{`
        .vpp .ant-table-thead > tr > th { background: #faf8ff !important; color: ${P} !important; font-weight: 600 !important; }
        .vpp .ant-table-tbody > tr:hover > td { background: #f5f0ff !important; }
      `}</style>
      
      <div className="vpp">
        {/* Hero Section */}
        <Card bordered={false} style={{ borderRadius: 24, overflow: "hidden", marginBottom: 28, boxShadow: "0 8px 24px rgba(92,3,155,0.08)", border: "1px solid #ede4ff" }} bodyStyle={{ padding: 0 }}>
          <div style={{ height: 120, background: `linear-gradient(135deg, ${P}, ${PM})` }} />
          <div style={{ background: "#fff", padding: "0 32px 28px", marginTop: -48 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
              <Badge dot status={workload.isOverloaded ? "warning" : "success"} offset={[-8, 88]}>
                <Avatar size={112} icon={<UserOutlined />} style={{ background: "#f5f3ff", color: P, border: "4px solid #fff", boxShadow: "0 6px 16px rgba(92,3,155,0.12)" }} />
              </Badge>
              <div style={{ flex: 1, paddingBottom: 8 }}>
                <Title level={2} style={{ margin: 0, color: "#1a0533", fontWeight: 800 }}>{opsInfo.name || fullName}</Title>
                <Text type="secondary" style={{ fontSize: 15 }}>{opsInfo.designation || "Mortgage Operations"} • {opsInfo.department || "Operations"}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color="purple" style={{ borderRadius: 20 }}>
                    ðŸ“Š Capacity: {workload.currentCapacity || 0}/{workload.maxCapacity || 30} ({workload.capacityUtilization || 0}%)
                  </Tag>
                  {workload.isOverloaded && <Tag color="red" style={{ borderRadius: 20, marginLeft: 8 }}>âš ï¸ Overloaded</Tag>}
                  {workload.stuckCases > 0 && <Tag color="orange" style={{ borderRadius: 20, marginLeft: 8 }}>â³ Stuck: {workload.stuckCases}</Tag>}
                </div>
              </div>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchDashboardStats} loading={refreshing} style={{ borderRadius: 30 }}>
                  Refresh
                </Button>
              </Space>
            </div>
          </div>
        </Card>

        {/* Stuck Applications Alert */}
        {workload.stuckCases > 0 && (
          <Alert
            message={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <HourglassOutlined style={{ fontSize: 18, color: AMB }} />
                <span>
                  <strong>Stuck Applications Alert</strong> — {workload.stuckCases} application(s) have been pending for more than 7 days
                </span>
              </div>
            }
            description="Please review these applications and take appropriate action to move them forward."
            type="warning"
            showIcon={false}
            style={{ marginBottom: 24, borderRadius: 16, border: `1px solid #FDE68A`, background: "#FFFBEB" }}
            action={
              <Button size="small" style={{ borderColor: AMB, color: AMB }} onClick={() => navigate("/ops/cases?filter=stuck")}>
                Review Stuck Applications
              </Button>
            }
          />
        )}

        {/* KPI Stats Row */}
        <Row gutter={[18, 18]} style={{ marginBottom: 28 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard icon={<FileOutlined />} label="Total Applications" value={kpis.totalAssignedCases} color={P} loading={loading} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard icon={<CheckCircleOutlined />} label="Completed" value={kpis.completed} color={GN} loading={loading} tooltip="Successfully disbursed" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard icon={<ClockCircleOutlined />} label="Active Applications" value={kpis.activeCases} color={AMB} loading={loading} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard icon={<BankOutlined />} label="Bank Submissions" value={performance.totalBankSubmissions} color={BL} loading={loading} />
          </Col>
        </Row>

        {/* Performance Metrics Row */}
        <Row gutter={[18, 18]} style={{ marginBottom: 28 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 18, border: "1px solid #f0e8ff", background: "white" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#9b8ab0", fontWeight: 600, marginBottom: 8 }}>Success Rate</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: performance.successRate >= 80 ? GN : AMB }}>
                  {performance.successRate || 0}%
                </div>
                <Progress percent={performance.successRate || 0} strokeColor={performance.successRate >= 80 ? GN : AMB} showInfo={false} style={{ marginTop: 8 }} />
                <div style={{ fontSize: 11, color: "#9b8ab0", marginTop: 8 }}>Target: 80%</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 18, border: "1px solid #f0e8ff", background: "white" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#9b8ab0", fontWeight: 600, marginBottom: 8 }}>Avg Processing Days</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: performance.averageProcessingDays <= 5 ? GN : performance.averageProcessingDays <= 10 ? AMB : RD }}>
                  {performance.averageProcessingDays || 0}
                </div>
                <div style={{ fontSize: 11, color: "#9b8ab0", marginTop: 8 }}>Target: 5 days</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 18, border: "1px solid #f0e8ff", background: "white" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#9b8ab0", fontWeight: 600, marginBottom: 8 }}>Total Disbursed</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: GN }}>{performance.totalDisbursed || 0}</div>
                <div style={{ fontSize: 11, color: "#9b8ab0", marginTop: 8 }}>Successfully funded</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 18, border: "1px solid #f0e8ff", background: "white" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#9b8ab0", fontWeight: 600, marginBottom: 8 }}>Return Rate</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: performance.returnRate === 0 ? GN : AMB }}>
                  {performance.returnRate || 0}%
                </div>
                <div style={{ fontSize: 11, color: "#9b8ab0", marginTop: 8 }}>Quality metric</div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Graphs Section */}
        <Row gutter={[18, 18]} style={{ marginBottom: 28 }}>
          {/* Cases Over Time Chart */}
          <Col xs={24} lg={12}>
            <Card 
              bordered={false} 
              style={{ borderRadius: 20, border: "1px solid #f0e8ff", height: "100%" }}
              title={
                <Space>
                  <BarChartOutlined style={{ color: P }} />
                  <span style={{ fontWeight: 600, color: P }}>Applications Processed Over Time</span>
                </Space>
              }
              extra={
                <Segmented
                  size="small"
                  value={chartType}
                  onChange={setChartType}
                  options={[
                    { value: 'line', icon: <LineChartOutlined /> },
                    { value: 'bar', icon: <BarChartOutlined /> }
                  ]}
                />
              }
            >
              <ResponsiveContainer width="100%" height={280}>
                {chartType === 'line' ? (
                  <LineChart data={casesOverTimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0e8ff" />
                    <XAxis dataKey="date" tick={{ fill: "#9b8ab0", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#9b8ab0", fontSize: 11 }} />
                    <RechartsTooltip content={<CustomChartTooltip />} />
                    <Line type="monotone" dataKey="count" stroke={P} strokeWidth={3} dot={{ fill: P, r: 4 }} name="Applications" />
                  </LineChart>
                ) : (
                  <BarChart data={casesOverTimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0e8ff" />
                    <XAxis dataKey="date" tick={{ fill: "#9b8ab0", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#9b8ab0", fontSize: 11 }} />
                    <RechartsTooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="count" fill={P} radius={[6, 6, 0, 0]} name="Applications" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Disbursement Trend Chart */}
          <Col xs={24} lg={12}>
            <Card 
              bordered={false} 
              style={{ borderRadius: 20, border: "1px solid #f0e8ff", height: "100%" }}
              title={
                <Space>
                  <LineChartOutlined style={{ color: P }} />
                  <span style={{ fontWeight: 600, color: P }}>Disbursement Trend (AED Millions)</span>
                </Space>
              }
            >
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={disbursementTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GN} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={GN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e8ff" />
                  <XAxis dataKey="date" tick={{ fill: "#9b8ab0", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9b8ab0", fontSize: 11 }} />
                  <RechartsTooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke={GN} strokeWidth={3} fill="url(#colorAmount)" name="Amount (M AED)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Additional Charts Row */}
        <Row gutter={[18, 18]} style={{ marginBottom: 28 }}>
          {/* Workload Distribution - Pie Chart */}
          {workloadData.length > 0 && (
            <Col xs={24} lg={12}>
              <Card 
                bordered={false} 
                style={{ borderRadius: 20, border: "1px solid #f0e8ff", height: "100%" }}
                title={
                  <Space>
                    <PieChartOutlined style={{ color: P }} />
                    <span style={{ fontWeight: 600, color: P }}>Workload Distribution</span>
                  </Space>
                }
              >
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={workloadData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {workloadData.map((entry, index) => {
                        const colors = [BL, GN, RD, AMB, P, "#8B5CF6"];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <RechartsTooltip content={<CustomChartTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          )}

          {/* Case Status Distribution */}
          {caseStatusData.length > 0 && (
            <Col xs={24} lg={12}>
              <Card 
                bordered={false} 
                style={{ borderRadius: 20, border: "1px solid #f0e8ff", height: "100%" }}
                title={
                  <Space>
                    <PieChartOutlined style={{ color: P }} />
                    <span style={{ fontWeight: 600, color: P }}>Application Status Distribution</span>
                  </Space>
                }
              >
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={caseStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {caseStatusData.map((entry, index) => {
                        const colors = [GN, BL, AMB, P, RD, "#8B5CF6", "#EC4899"];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <RechartsTooltip content={<CustomChartTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          )}
        </Row>

        {/* Quick Actions */}
        {/* {(quickActions.needsReview > 0 || quickActions.needsBankUpdate > 0 || quickActions.availableInQueue > 0) && (
          <Row gutter={[18, 18]} style={{ marginBottom: 28 }}>
            <Col xs={24}>
              <Card bordered={false} style={{ borderRadius: 20, background: `linear-gradient(135deg, ${P}08, white)`, border: `1px solid ${P}20` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <Title level={5} style={{ margin: 0, color: P }}>Quick Actions</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>Take action on pending items</Text>
                  </div>
                  <Space size={12}>
                    {quickActions.needsReview > 0 && (
                      <Button icon={<EyeOutlined />} onClick={() => navigate("/ops/cases?filter=needsReview")} style={{ borderRadius: 30, borderColor: AMB, color: AMB }}>
                        Review {quickActions.needsReview} Applications
                      </Button>
                    )}
                    {quickActions.needsBankUpdate > 0 && (
                      <Button icon={<BankOutlined />} onClick={() => navigate("/ops/cases?filter=bankUpdate")} style={{ borderRadius: 30, borderColor: BL, color: BL }}>
                        Update {quickActions.needsBankUpdate} Bank Status
                      </Button>
                    )}
                    {quickActions.availableInQueue > 0 && (
                      <Button type="primary" icon={<RocketOutlined />} onClick={() => navigate("/ops/queue/pickup")} style={{ background: P, borderColor: P, borderRadius: 30 }}>
                        Pick {quickActions.availableInQueue} from Queue
                      </Button>
                    )}
                  </Space>
                </div>
              </Card>
            </Col>
          </Row>
        )} */}

        {/* Recent Applications Table */}
        <Card 
          bordered={false} 
          style={{ borderRadius: 20, boxShadow: "0 4px 20px rgba(92,3,155,0.06)", border: "1px solid #f0e8ff", overflow: "hidden" }} 
          bodyStyle={{ padding: "24px" }} 
          title={
            <span style={{ fontSize: 16, fontWeight: 700, color: P }}>Recent Applications</span>
          } 
          extra={
            <Space>
              <Button type="link" onClick={() => navigate("/ops/cases")} style={{ color: P }}>
                View All <ArrowRightOutlined />
              </Button>
              <Button type="link" icon={<DownloadOutlined />} style={{ color: P }} onClick={() => message.info("Export feature coming soon")}>
                Export
              </Button>
            </Space>
          }
        >
          <Table 
            columns={caseColumns} 
            dataSource={recentCases} 
            rowKey="_id" 
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} applications` }}
            size="middle"
          />
        </Card>

        {/* Performance Summary */}
        <Card bordered={false} style={{ borderRadius: 20, marginTop: 28, border: "1px solid #f0e8ff" }}>
          <Title level={5} style={{ color: P, marginBottom: 16 }}>Performance Summary</Title>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={4}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#9b8ab0" }}>Processed This Month</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: P }}>{workload.processedThisMonth || 0}</div>
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#9b8ab0" }}>Success Rate</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: GN }}>{kpis.successRate || 0}%</div>
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#9b8ab0" }}>Bank Submissions</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: BL }}>{performance.totalBankSubmissions || 0}</div>
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#9b8ab0" }}>Avg Processing Days</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: performance.averageProcessingDays <= 5 ? GN : AMB }}>
                  {performance.averageProcessingDays || 0}
                </div>
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#9b8ab0" }}>Queue Count</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: AMB }}>{kpis.queueCount || 0}</div>
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#9b8ab0" }}>Urgent Queue</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: RD }}>{kpis.urgentQueueCount || 0}</div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default MortgageOpsDashboard;