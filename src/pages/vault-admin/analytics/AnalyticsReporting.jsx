import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card, Row, Col, Select, DatePicker, Button, Table,
  Typography, Space, Divider, message, Spin, Progress, Empty, Tooltip, Avatar, Tag
} from "antd";
import {
  LineChartOutlined, FileExcelOutlined, FilePdfOutlined,
  SearchOutlined, ReloadOutlined, FilterOutlined,
  CalendarOutlined, ArrowRightOutlined, InfoCircleOutlined,
  BankOutlined, UserOutlined, StarFilled, ThunderboltOutlined
} from "@ant-design/icons";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend
} from 'recharts';
import { apiService } from "@/api/apiService";
import CustomTable from "../../../components/common/CustomTable";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const P  = "#5C039B";
const PM = "#7C3AED";
const PL = "#F5F0FF";
const PB = "#E9D5FF";
const COLORS = ['#5C039B', '#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6B7280'];

const REPORT_TYPES = [
  { value: "lead_volume", label: "Lead Volume Report" },
  { value: "applications_pipeline", label: "Applications Pipeline Report" },
  { value: "conversion_funnel", label: "Conversion Funnel" },
  { value: "advisor_performance", label: "Advisor Performance Report" },
  { value: "ops_performance", label: "Mortgage Ops Report" },
  { value: "referral_performance", label: "Referral Partner Performance" },
  { value: "partner_performance", label: "Company Partner Performance" },
  { value: "commission_report", label: "Commission Report" }
];

export default function AnalyticsReporting() {
  const [reportType, setReportType] = useState("lead_volume");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Filter Dropdowns Data ──
  const [advisors, setAdvisors] = useState([]);
  const [opsUsers, setOpsUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [banks, setBanks] = useState([]);

  // ── Filters State ──
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    advisorId: "",
    opsId: "",
    partnerId: "",
    bankId: "",
    loanType: ""
  });
  const [dateRange, setDateRange] = useState(null);

  // Fetch Dropdown Options on Mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [advRes, opsRes, partRes, bankRes] = await Promise.all([
          apiService.get("/vault/advisor/all"),
          apiService.get("/vault/ops/all"),
          apiService.get("/vault/partner/dropdown"),
          apiService.get("/bank")
        ]);

        if (advRes?.success) setAdvisors(advRes.data || []);
        if (opsRes?.success) setOpsUsers(opsRes.data || []);
        if (partRes?.success) setPartners(partRes.data || []);
        if (Array.isArray(bankRes)) setBanks(bankRes);
        else if (bankRes?.data) setBanks(bankRes.data);
      } catch (err) {
        console.error("Failed to load filter dropdowns", err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch Report Data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        reportType,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });

      const res = await apiService.get(`/vault/reports?${params.toString()}`);
      if (res?.success) {
        setReportData(res.data);
      } else {
        message.error("Failed to fetch report data");
      }
    } catch (err) {
      message.error("Error loading report");
    } finally {
      setLoading(false);
    }
  }, [reportType, filters]);

  useEffect(() => {
    fetchReport();
  }, [reportType, fetchReport]);

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    setFilters(prev => ({
      ...prev,
      dateFrom: dates?.[0] ? dates[0].format("YYYY-MM-DD") : "",
      dateTo: dates?.[1] ? dates[1].format("YYYY-MM-DD") : ""
    }));
  };

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams({
        reportType,
        format,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });

      message.loading({ content: `Generating ${format.toUpperCase()}...`, key: "exporting" });

      // Fetch file as blob securely with auth headers
      const res = await apiService.get(`/vault/reports/export?${params.toString()}`, {
        responseType: "blob"
      });

      const blob = new Blob([res], { type: format === "pdf" ? "application/pdf" : "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${reportType}_${dayjs().format("YYYYMMDD_HHmmss")}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success({ content: `${format.toUpperCase()} exported!`, key: "exporting" });
    } catch (err) {
      message.error({ content: "Export failed", key: "exporting" });
    }
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      advisorId: "",
      opsId: "",
      partnerId: "",
      bankId: "",
      loanType: ""
    });
    setDateRange(null);
  };

  // ==================== CHART DATA CALCULATORS ====================

  const leadVolumeChartData = useMemo(() => {
    if (!reportData || reportType !== "lead_volume") return [];
    const periods = {};
    reportData.forEach(item => {
      const p = item.period || "Unknown";
      periods[p] = (periods[p] || 0) + (Number(item.count) || 0);
    });
    return Object.entries(periods).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
  }, [reportData, reportType]);

  const commissionChartData = useMemo(() => {
    if (!reportData || reportType !== "commission_report") return [];
    const { received = 0, paidOut = 0, outstanding = 0 } = reportData;
    return [
      { name: "Net Profit", value: received - paidOut },
      { name: "Paid Out", value: paidOut },
      { name: "Outstanding", value: outstanding }
    ];
  }, [reportData, reportType]);

  // ==================== REPORT CONTENT RENDERER ====================

  const renderReportContent = () => {
    if (!reportData) return <Empty description="No report data loaded" />;

    switch (reportType) {
      case "lead_volume":
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={11}>
              <Card title={<span style={{ fontWeight: 700, color: P }}>Lead Count Trend</span>} bordered={false} style={{ borderRadius: 12, border: '1px solid #ede9f6' }}>
                {leadVolumeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={leadVolumeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PM} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={PM} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <ChartTooltip contentStyle={{ borderRadius: 8, border: '1px solid #ede9f6' }} />
                      <Area type="monotone" dataKey="value" stroke={PM} strokeWidth={2.5} fillOpacity={1} fill="url(#leadGrad)" name="Leads" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <Empty description="No trend metrics available" />}
              </Card>
            </Col>
            <Col xs={24} lg={13}>
              <CustomTable
                data={reportData}
                columns={[
                  { title: "Period", key: "period", sortable: true },
                  { title: "Lead Source", key: "source", render: (s) => String(s || "Website / Walk-in").toUpperCase().replace(/_/g, " ") },
                  { title: "Assigned Advisor", key: "advisor" },
                  { title: "Total Leads", key: "count", sortable: true }
                ]}
                showSearch={false}
              />
            </Col>
          </Row>
        );

      case "applications_pipeline":
        const { pipeline = [], averages = [], bottleneck = "" } = reportData;
        const totalCases = pipeline.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={10}>
              <Card title={<span style={{ fontWeight: 700, color: P }}>Workflow Distribution</span>} bordered={false} style={{ borderRadius: 12, border: '1px solid #ede9f6' }}>
                {pipeline.length > 0 && totalCases > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pipeline.map(item => ({ name: item.status, value: Number(item.count) || 0 }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pipeline.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip contentStyle={{ borderRadius: 8 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} layout="vertical" align="right" verticalAlign="middle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <Empty description="No pipeline metrics available" />}
              </Card>
            </Col>
            <Col xs={24} lg={14}>
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Card title="Average Time In Each Stage" size="small" bordered style={{ borderRadius: 12 }}>
                  <CustomTable
                    data={averages}
                    columns={[
                      { title: "Stage", key: "stage" },
                      { title: "Sample Size", key: "count" },
                      { title: "Avg Hours Spent", key: "avgHours", render: (h) => `${h} hrs` }
                    ]}
                    showSearch={false}
                  />
                  {bottleneck && (
                    <div style={{ marginTop: 16, padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10 }}>
                      <Text type="danger" strong>🚨 Bottleneck identified: </Text>
                      <Text strong>{bottleneck}</Text>
                    </div>
                  )}
                </Card>
                <Card title="Status Aggregates" size="small" bordered style={{ borderRadius: 12 }}>
                  <CustomTable
                    data={pipeline}
                    columns={[
                      { title: "Case Workflow Status", key: "status" },
                      { title: "Count", key: "count" }
                    ]}
                    showSearch={false}
                  />
                </Card>
              </Space>
            </Col>
          </Row>
        );

      case "conversion_funnel":
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={11}>
              <Card title={<span style={{ fontWeight: 700, color: P }}>Funnel Stage Dropoffs</span>} bordered={false} style={{ borderRadius: 12, border: '1px solid #ede9f6' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={reportData} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} width={120} />
                    <ChartTooltip contentStyle={{ borderRadius: 8 }} />
                    <Bar dataKey="count" fill={PM} radius={[0, 6, 6, 0]} name="Lead Count">
                      {reportData.map((entry, index) => {
                        const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#10b981'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={13}>
              <Card title={<span style={{ fontWeight: 700 }}>Conversion Funnel Analytics</span>} bordered={false} style={{ borderRadius: 12, border: '1px solid #ede9f6' }}>
                <Paragraph style={{ color: "#6b7280", marginBottom: 20 }}>
                  Shows the step-by-step conversion from leads down to disbursals.
                </Paragraph>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {reportData.map((step, idx) => (
                    <div key={step.stage} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 140, fontWeight: 700, color: P, textAlign: "right" }}>{step.stage}</div>
                      <div style={{ flex: 1 }}>
                        <Progress
                          percent={step.conversion}
                          strokeColor={idx === 0 ? "#3b82f6" : idx === 4 ? "#10b981" : PM}
                          format={() => `${step.count} items`}
                          strokeWidth={14}
                        />
                      </div>
                      <div style={{ width: 60, fontWeight: 600, color: "#9ca3af" }}>
                        {idx > 0 ? `(${step.conversion}%)` : "Base"}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        );

      case "advisor_performance":
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={11}>
              <Card title={<span style={{ fontWeight: 700, color: P }}>Advisor Allocation & Conversion</span>} bordered={false} style={{ borderRadius: 12, border: '1px solid #ede9f6' }}>
                {reportData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={270}>
                    <BarChart data={reportData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="advisor" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <ChartTooltip contentStyle={{ borderRadius: 8 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="leadsAssigned" fill={P} radius={[4, 4, 0, 0]} name="Leads Assigned" />
                      <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="#10b981" strokeWidth={3} name="Conversion %" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty description="No advisor metrics loaded" />}
              </Card>
            </Col>
            <Col xs={24} lg={13}>
              <CustomTable
                data={reportData}
                columns={[
                  { title: "Advisor Name", key: "advisor" },
                  { title: "Leads Assigned", key: "leadsAssigned", sortable: true },
                  { title: "Conversion Rate", key: "conversionRate", render: (r) => `${r}%` },
                  { title: "Avg Lead to App", key: "avgLeadToAppHrs", render: (h) => `${h} hrs` },
                  { title: "Avg App to Bank Sub", key: "avgAppToSubHrs", render: (h) => `${h} hrs` },
                  { title: "SLA Compliance", key: "slaComplianceRate", render: (r) => `${r}%` }
                ]}
                showSearch={false}
              />
            </Col>
          </Row>
        );

      case "ops_performance":
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={11}>
              <Card title={<span style={{ fontWeight: 700, color: P }}>Ops Volume vs Handling Hours</span>} bordered={false} style={{ borderRadius: 12, border: '1px solid #ede9f6' }}>
                {reportData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={270}>
                    <BarChart data={reportData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="opsName" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <ChartTooltip contentStyle={{ borderRadius: 8 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="applicationsAssigned" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Applications" />
                      <Bar dataKey="avgAppToSubHrs" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg SLA Hours" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty description="No operations metrics loaded" />}
              </Card>
            </Col>
            <Col xs={24} lg={13}>
              <CustomTable
                data={reportData}
                columns={[
                  { title: "Ops Executive", key: "opsName" },
                  { title: "Applications Handled", key: "applicationsAssigned" },
                  { title: "Return to Advisor Rate", key: "returnRate", render: (r) => `${r}%` },
                  { title: "Avg Submission Time", key: "avgAppToSubHrs", render: (h) => `${h} hrs` },
                  { title: "SLA Compliance (48h)", key: "slaComplianceRate", render: (r) => `${r}%` }
                ]}
                showSearch={false}
              />
            </Col>
          </Row>
        );

      case "referral_performance":
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={11}>
              <Card title={<span style={{ fontWeight: 700, color: P }}>Referral Lead Volume & Commission</span>} bordered={false} style={{ borderRadius: 12, border: '1px solid #ede9f6' }}>
                {reportData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={270}>
                    <BarChart data={reportData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="partnerName" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <ChartTooltip contentStyle={{ borderRadius: 8 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="leadsSubmitted" fill={PM} radius={[4, 4, 0, 0]} name="Leads" />
                      <Bar yAxisId="right" dataKey="commissionEarned" fill="#10b981" radius={[4, 4, 0, 0]} name="Commission (AED)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty description="No referral metrics loaded" />}
              </Card>
            </Col>
            <Col xs={24} lg={13}>
              <CustomTable
                data={reportData}
                columns={[
                  { title: "Referral Partner", key: "partnerName" },
                  { title: "Leads Submitted", key: "leadsSubmitted" },
                  { title: "Conversion Rate", key: "conversionRate", render: (r) => `${r}%` },
                  { title: "Total Commission Earned", key: "commissionEarned", render: (v) => `AED ${Number(v || 0).toLocaleString()}` }
                ]}
                showSearch={false}
              />
            </Col>
          </Row>
        );

      case "partner_performance":
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={11}>
              <Card title={<span style={{ fontWeight: 700, color: P }}>Company Submissions & Earnings</span>} bordered={false} style={{ borderRadius: 12, border: '1px solid #ede9f6' }}>
                {reportData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={270}>
                    <BarChart data={reportData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="partnerName" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <ChartTooltip contentStyle={{ borderRadius: 8 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="applicationsSubmitted" fill="#6366f1" radius={[4, 4, 0, 0]} name="Cases" />
                      <Bar yAxisId="right" dataKey="totalCommission" fill="#10b981" radius={[4, 4, 0, 0]} name="Commission (AED)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty description="No partner metrics loaded" />}
              </Card>
            </Col>
            <Col xs={24} lg={13}>
              <CustomTable
                data={reportData}
                columns={[
                  { title: "Company Partner", key: "partnerName" },
                  { title: "Cases Handled", key: "applicationsSubmitted" },
                  { title: "Disbursement Rate", key: "disbursementRate", render: (r) => `${r}%` },
                  { title: "Platform Commission Paid/Owed", key: "totalCommission", render: (v) => `AED ${Number(v || 0).toLocaleString()}` }
                ]}
                showSearch={false}
              />
            </Col>
          </Row>
        );

      case "commission_report":
        const { received = 0, paidOut = 0, outstanding = 0, totalRecords = 0 } = reportData;
        const totalProfit = received - paidOut;
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={10}>
              <Card title={<span style={{ fontWeight: 700, color: P }}>Commission Breakdown</span>} bordered={false} style={{ borderRadius: 12, border: '1px solid #ede9f6' }}>
                {totalRecords > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={commissionChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <ChartTooltip contentStyle={{ borderRadius: 8 }} formatter={(v) => `AED ${Number(v).toLocaleString()}`} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <Empty description="No commission records found" />}
              </Card>
            </Col>
            <Col xs={24} lg={14}>
              <div style={{ padding: "0 10px" }}>
                <Row gutter={[16, 16]}>
                  {[
                    { label: "Received from Banks", value: received, color: P, bg: PL },
                    { label: "Paid Out to Partners/Referrals", value: paidOut, color: "#2563eb", bg: "#eff6ff" },
                    { label: "Outstanding Owed", value: outstanding, color: "#d97706", bg: "#fffbeb" },
                    { label: "Net Xoto Earnings", value: totalProfit, color: "#10b981", bg: "#ecfdf5" }
                  ].map(card => (
                    <Col xs={24} sm={12} key={card.label}>
                      <div style={{ background: card.bg, borderRadius: 16, padding: "20px 24px", border: "1px solid #ede9f6" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 8 }}>{card.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>AED {Number(card.value).toLocaleString()}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
                <Divider style={{ margin: "24px 0" }} />
                <Text type="secondary">Evaluation includes {totalRecords} active commission files matching current filters.</Text>
              </div>
            </Col>
          </Row>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ background: "#F4F0FA", minHeight: "100vh", padding: "28px 24px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a0533", margin: 0 }}>Analytics & Reporting</h1>
            <p style={{ fontSize: 13, color: "#8B7BAE", margin: "4px 0 0" }}>
              Evaluate system throughput, conversion funnels, and persona metrics.
            </p>
          </div>
          <Space>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => handleExport("csv")}
              style={{ borderRadius: 10, borderColor: "#bbf7d0", color: "#16a34a", background: "#f0fdf4" }}
            >
              Export CSV
            </Button>
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={() => handleExport("pdf")}
              style={{ borderRadius: 10, background: "#dc2626", borderColor: "#dc2626", color: "white" }}
            >
              Export PDF
            </Button>
          </Space>
        </div>

        {/* Global Filters Panel */}
        <Card
          size="small"
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: P }}>
              <FilterOutlined /> <span style={{ fontWeight: 700 }}>Global Filters</span>
            </div>
          }
          style={{ marginBottom: 20, borderRadius: 16, border: "1px solid #ede9f6" }}
        >
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="Choose Report"
                style={{ width: "100%" }}
                value={reportType}
                onChange={(v) => { setReportType(v); setReportData(null); }}
              >
                {REPORT_TYPES.map(r => <Option key={r.value} value={r.value}>{r.label}</Option>)}
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={6} lg={5}>
              <RangePicker
                style={{ width: "100%" }}
                value={dateRange}
                onChange={handleDateRangeChange}
              />
            </Col>

            <Col xs={12} sm={8} md={6} lg={3}>
              <Select
                placeholder="Advisor"
                style={{ width: "100%" }}
                value={filters.advisorId || undefined}
                onChange={v => setFilters(p => ({ ...p, advisorId: v || "" }))}
                allowClear
                optionLabelProp="label"
              >
                {advisors.map(adv => {
                  const advName = `${adv.name?.first_name || ""} ${adv.name?.last_name || ""}`.trim();
                  return (
                    <Option key={adv._id} value={adv._id} label={advName}>
                      <Space size={8}>
                        <Avatar src={adv.profilePic} size={20} icon={<UserOutlined />} style={{ background: '#f3f4f6' }} />
                        <span>{advName}</span>
                      </Space>
                    </Option>
                  );
                })}
              </Select>
            </Col>

            <Col xs={12} sm={8} md={6} lg={3}>
              <Select
                placeholder="Ops"
                style={{ width: "100%" }}
                value={filters.opsId || undefined}
                onChange={v => setFilters(p => ({ ...p, opsId: v || "" }))}
                allowClear
                optionLabelProp="label"
              >
                {opsUsers.map(op => {
                  const opsName = `${op.name?.first_name || ""} ${op.name?.last_name || ""}`.trim();
                  return (
                    <Option key={op._id} value={op._id} label={opsName}>
                      <Space size={8}>
                        <Avatar src={op.profilePic} size={20} icon={<UserOutlined />} style={{ background: '#f3f4f6' }} />
                        <span>{opsName}</span>
                      </Space>
                    </Option>
                  );
                })}
              </Select>
            </Col>

            <Col xs={12} sm={8} md={6} lg={3}>
              <Select
                placeholder="Partner"
                style={{ width: "100%" }}
                value={filters.partnerId || undefined}
                onChange={v => setFilters(p => ({ ...p, partnerId: v || "" }))}
                allowClear
                optionLabelProp="label"
              >
                {partners.map(p => {
                  const partnerName = p.companyName || p.dbaName || (p.individualDetails ? `${p.individualDetails.firstName} ${p.individualDetails.lastName}` : p.email);
                  const isCompany = p.partnerCategory === 'company';
                  return (
                    <Option key={p._id} value={p._id} label={partnerName}>
                      <Space size={8}>
                        <Avatar src={p.profilePic} size={20} icon={<UserOutlined />} style={{ background: isCompany ? '#e0f2fe' : '#f3e8ff', color: isCompany ? '#0369a1' : '#6b21a8' }} />
                        <span>{partnerName}</span>
                        <Tag color={isCompany ? 'blue' : 'purple'} style={{ fontSize: 9, borderRadius: 4, lineHeight: '14px', height: 16 }}>
                          {isCompany ? 'Company' : 'Individual'}
                        </Tag>
                      </Space>
                    </Option>
                  );
                })}
              </Select>
            </Col>

            <Col xs={12} sm={8} md={6} lg={3}>
              <Select
                placeholder="Bank"
                style={{ width: "100%" }}
                value={filters.bankId || undefined}
                onChange={v => setFilters(p => ({ ...p, bankId: v || "" }))}
                allowClear
                optionLabelProp="label"
              >
                {banks.map(b => (
                  <Option key={b._id} value={b._id} label={b.bankName}>
                    <Space size={8}>
                      <Avatar src={b.logo} shape="square" size={20} icon={<BankOutlined />} style={{ borderRadius: 4, background: "#f3f4f6", border: '1px solid #e5e7eb' }} />
                      <span>{b.bankName}</span>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={12} sm={8} md={6} lg={3}>
              <Select
                placeholder="Loan Type"
                style={{ width: "100%" }}
                value={filters.loanType || undefined}
                onChange={v => setFilters(p => ({ ...p, loanType: v || "" }))}
                allowClear
              >
                <Option value="Purchase">Purchase</Option>
                <Option value="Refinance">Refinance</Option>
                <Option value="Equity Release">Equity Release</Option>
              </Select>
            </Col>
          </Row>
          
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button size="small" type="text" onClick={clearFilters} danger>
              Reset Filters
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<SearchOutlined />}
              onClick={fetchReport}
              style={{ background: P, borderColor: P }}
            >
              Apply Filter
            </Button>
          </div>
        </Card>

        {/* Report Content */}
        <Card style={{ borderRadius: 16, border: "1px solid #ede9f6", minHeight: 400 }} bodyStyle={{ padding: 24 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 350, flexDirection: "column", gap: 16 }}>
              <Spin size="large" />
              <Text type="secondary">Assembling report matrices...</Text>
            </div>
          ) : (
            renderReportContent()
          )}
        </Card>

      </div>
    </div>
  );
}
