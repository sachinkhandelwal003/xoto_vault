// src/pages/Leads/VaultAgentLeadEditEligibility.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Spin, message, Slider, InputNumber, Tabs, Modal, Form, Input, Select, DatePicker, Button, Progress, Alert, Row, Col, Card, Tag, Divider } from "antd";
import dayjs from "dayjs";
import { Country } from "country-state-city";
import {
  ChevronLeft, User, Mail, Phone, Home, DollarSign,
  AlertCircle, RefreshCw, CheckCircle, XCircle,
  MapPin, Calendar, Target, Edit2, Save, X,
  Calculator, Heart, Building2, Briefcase, CreditCard,
  FileText, TrendingUp, Percent, ShieldCheck, Globe, Activity,
  Clock, Award, BarChart3, Info
} from "lucide-react";
import { apiService } from "@/api/apiService";

// ─── Premium Design Tokens ───────────────────────────────────────────────
const C = {
  primary: "#5C039B",
  primaryMid: "#7C3AED",
  primaryDark: "#3B0066",
  primarySoft: "#F5F0FF",
  primaryBord: "#E9D5FF",
  green: "#10B981",
  greenSoft: "#ECFDF5",
  greenBord: "#A7F3D0",
  red: "#EF4444",
  redSoft: "#FEF2F2",
  redBord: "#FECACA",
  amber: "#F59E0B",
  amberSoft: "#FFFBEB",
  amberBord: "#FDE68A",
  blue: "#3B82F6",
  blueSoft: "#EFF6FF",
  gray: "#6B7280",
  grayLight: "#F9FAFB",
  grayBord: "#E5E7EB",
  text: "#111827",
  textSub: "#374151",
  textMuted: "#9CA3AF",
  white: "#FFFFFF",
  bg: "#F4F0FA",
};

const roleSlugMap = {
  '0': 'superadmin', '1': 'admin', '18': "vault-admin",
  '22': "vaultagent", '21': "vaultpartner", '23': "vault-ops", '26': "vault-advisor"
};

// ─── EMI Calculation Function ──────────────────────────────────────────
const calculateEMI = (principal, annualRate, years) => {
  if (principal <= 0 || annualRate <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return Math.round(principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
};

// ─── Helper: Convert empty strings to null ─────────────────────────────
const cleanPayload = (obj) => {
  if (!obj) return obj;
  const cleaned = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] === '') {
      cleaned[key] = null;
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      cleaned[key] = cleanPayload(obj[key]);
    } else {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
};

// ─── Main Component ──────────────────────────────────────────────────────
export default function VaultAgentLeadEditEligibility() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s?.auth || {});

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState("eligibility");
  const [saving, setSaving] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [flashMsg, setFlashMsg] = useState({ type: "", text: "" });

  // Form States
  const [basicInfo, setBasicInfo] = useState({
    firstName: "", lastName: "", fullName: "", email: "", mobileNumber: "", 
    nationality: "", dateOfBirth: null, maritalStatus: "", numberOfDependents: 0, 
    occupation: "", employer: "", gender: "", residencyStatus: "", 
    monthlySalary: 0, existingMonthlyLiabilities: 0
  });
  
  const [propertyInfo, setPropertyInfo] = useState({
    transactionType: "", propertyType: "", propertyValue: 0, loanAmountRequired: 0,
    downPaymentAmount: 0, propertyAddress: { area: "", city: "Dubai" }
  });
  
  const [loanRequirementsInfo, setLoanRequirementsInfo] = useState({
    timeline: "", preferredTenureYears: 25, preferredInterestRateType: "Fixed",
    feeFinancingPreference: false
  });
  
  // Eligibility Results from API
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  // Live Calculation Preview
  const [liveCalculation, setLiveCalculation] = useState({
    monthlyIncome: 0,
    monthlyLiabilities: 0,
    dbr: { current: 0, max: 50, maxAllowedDebt: 0, available: 0, isEligible: false },
    emi: { value: 0, isEligible: false },
    ltv: { value: 0, isEligible: false },
    isEligible: false
  });

  const roleCode = user?.role?.code;
  const roleSlug = roleSlugMap[roleCode] ?? "dashboard";
  const residencyStatus = lead?.customerInfo?.residencyStatus || basicInfo.residencyStatus || "UAE Resident";

  // Nationality options
  const nationalityOptions = useMemo(() => {
    return Country.getAllCountries()
      .map((c) => ({ name: c.name, iso: c.isoCode, flag: `https://flagcdn.com/w20/${c.isoCode.toLowerCase()}.png` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const flash = (type, text) => {
    setFlashMsg({ type, text });
    setTimeout(() => setFlashMsg({ type: "", text: "" }), 4000);
  };

  // Calculate customer age from DOB
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  // Live Eligibility Calculation
  const updateLiveCalculation = useCallback(() => {
    const monthlyIncome = basicInfo.monthlySalary || 0;
    const monthlyLiabilities = basicInfo.existingMonthlyLiabilities || 0;
    const propertyValue = propertyInfo.propertyValue || 0;
    const loanAmount = propertyInfo.loanAmountRequired || 0;
    const tenure = loanRequirementsInfo.preferredTenureYears || 25;
    const interestRate = 4.19;

    const maxDBR = residencyStatus === 'UAE National' ? 55 : 50;
    const maxAllowedDebt = (monthlyIncome * maxDBR) / 100;
    const currentDBR = monthlyIncome > 0 ? (monthlyLiabilities / monthlyIncome) * 100 : 0;
    const availableForMortgage = Math.max(0, maxAllowedDebt - monthlyLiabilities);
    const dbrEligible = availableForMortgage > 0;

    const emi = calculateEMI(loanAmount, interestRate, tenure);
    const emiEligible = emi <= availableForMortgage;
    const ltv = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;
    const ltvEligible = ltv <= 80;
    const isEligible = dbrEligible && emiEligible && ltvEligible;

    setLiveCalculation({
      monthlyIncome,
      monthlyLiabilities,
      dbr: {
        current: Math.round(currentDBR),
        max: maxDBR,
        maxAllowedDebt: Math.round(maxAllowedDebt),
        available: Math.round(availableForMortgage),
        isEligible: dbrEligible
      },
      emi: { value: emi, isEligible: emiEligible },
      ltv: { value: Math.round(ltv), isEligible: ltvEligible },
      isEligible
    });
  }, [basicInfo.monthlySalary, basicInfo.existingMonthlyLiabilities, propertyInfo.propertyValue, 
      propertyInfo.loanAmountRequired, loanRequirementsInfo.preferredTenureYears, residencyStatus]);

  useEffect(() => {
    updateLiveCalculation();
  }, [updateLiveCalculation]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const res = await apiService.get(`/vault/lead/${id}`);
      const data = res?.data?.data || res?.data || null;
      setLead(data);
      
      const ci = data?.customerInfo || {};
      const pd = data?.propertyDetails || {};
      const lr = data?.loanRequirements || {};
      const elig = data?.eligibility || {};
      
      const firstName = ci.firstName || "";
      const lastName = ci.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();
      
      setBasicInfo({
        firstName,
        lastName,
        fullName,
        email: ci.email || "",
        mobileNumber: ci.mobileNumber || "",
        nationality: ci.nationality || "",
        dateOfBirth: ci.dateOfBirth ? dayjs(ci.dateOfBirth) : null,
        maritalStatus: ci.maritalStatus || "",
        numberOfDependents: ci.numberOfDependents || 0,
        occupation: ci.occupation || "",
        employer: ci.employer || "",
        gender: ci.gender || "",
        residencyStatus: ci.residencyStatus || "UAE Resident",
        monthlySalary: ci.monthlySalary || 0,
        existingMonthlyLiabilities: ci.existingMonthlyLiabilities || 0
      });
      
      setPropertyInfo({
        transactionType: pd.transactionType || "",
        propertyType: pd.propertyType || "",
        propertyValue: pd.propertyValue || 0,
        loanAmountRequired: pd.loanAmountRequired || 0,
        downPaymentAmount: pd.downPaymentAmount || 0,
        propertyAddress: pd.propertyAddress || { area: "", city: "Dubai" }
      });
      
      setLoanRequirementsInfo({
        timeline: lr.timeline || "",
        preferredTenureYears: lr.preferredTenureYears || 25,
        preferredInterestRateType: lr.preferredInterestRateType || "Fixed",
        feeFinancingPreference: lr.feeFinancingPreference || false
      });
      
      if (elig.checked) {
        setEligibilityResult({
          isEligible: elig.isEligible,
          dbrPercentage: elig.dbrPercentage,
          estimatedLTV: elig.estimatedLTV,
          proposedEMI: elig.proposedEMI,
          maxAllowedDBR: elig.maxAllowedDBR,
          eligibilityNotes: elig.eligibilityNotes,
          checks: elig.checks
        });
        setShowResults(true);
      }
      
    } catch (err) { 
      flash("error", "Failed to load lead details."); 
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLead(); }, [id]);

  const checkEligibility = async () => {
    setEligibilityLoading(true);
    try {
      const payload = {
        monthlySalary: basicInfo.monthlySalary,
        existingMonthlyLiabilities: basicInfo.existingMonthlyLiabilities,
        propertyValue: propertyInfo.propertyValue,
        downpayment: propertyInfo.downPaymentAmount,
        loanAmount: propertyInfo.loanAmountRequired,
        tenureYears: loanRequirementsInfo.preferredTenureYears
      };
      
      const response = await apiService.post(`/vault/lead/${id}/calculate-eligibility`, payload);
      
      if (response.data?.success || response.success) {
        const resultData = response.data?.data || response.data;
        setEligibilityResult({
          ...resultData,
          dbrPercentage: resultData.checks?.dbr?.current || resultData.dbrPercentage,
          estimatedLTV: resultData.checks?.ltv?.value || resultData.estimatedLTV,
          proposedEMI: resultData.checks?.emi?.value || resultData.proposedEMI,
          maxAllowedDBR: resultData.checks?.dbr?.max || resultData.maxAllowedDBR,
          checks: resultData.checks
        });
        setShowResults(true);
        
        if (resultData.isEligible) {
          flash("success", "✅ Customer is ELIGIBLE! You can now mark lead as Qualified.");
        } else {
          flash("warning", "⚠️ Customer is NOT ELIGIBLE. Review the details below.");
        }
      } else {
        flash("error", response.message || "Failed to calculate eligibility");
      }
    } catch (err) {
      flash("error", err?.response?.data?.message || "Failed to calculate eligibility");
    } finally {
      setEligibilityLoading(false);
    }
  };

  // Edit Modal State
  const [editModal, setEditModal] = useState({ visible: false, type: "", title: "", fields: [] });
  const [modalForm] = Form.useForm();

  const openEditModal = (type, title, fields) => {
    let initialValues = {};
    if (type === "basic") {
      initialValues = {
        fullName: basicInfo.fullName,
        email: basicInfo.email,
        mobileNumber: basicInfo.mobileNumber,
        nationality: basicInfo.nationality,
        dateOfBirth: basicInfo.dateOfBirth,
        gender: basicInfo.gender,
        maritalStatus: basicInfo.maritalStatus,
        occupation: basicInfo.occupation,
        employer: basicInfo.employer,
        monthlySalary: basicInfo.monthlySalary,
        existingMonthlyLiabilities: basicInfo.existingMonthlyLiabilities
      };
    } else if (type === "property") {
      initialValues = { 
        transactionType: propertyInfo.transactionType,
        propertyValue: propertyInfo.propertyValue,
        loanAmountRequired: propertyInfo.loanAmountRequired,
        downPaymentAmount: propertyInfo.downPaymentAmount,
        area: propertyInfo.propertyAddress?.area,
        city: propertyInfo.propertyAddress?.city || "Dubai"
      };
    } else if (type === "loan") {
      initialValues = { 
        timeline: loanRequirementsInfo.timeline,
        preferredTenureYears: loanRequirementsInfo.preferredTenureYears,
        preferredInterestRateType: loanRequirementsInfo.preferredInterestRateType,
        feeFinancingPreference: loanRequirementsInfo.feeFinancingPreference
      };
    }
    
    modalForm.setFieldsValue(initialValues);
    setEditModal({ visible: true, type, title, fields });
  };

  const handleSectionUpdate = async (values) => {
    setSaving(true);
    try {
      let payload = {};
      
      if (editModal.type === "basic") {
        // Split fullName into firstName and lastName
        const fullName = values.fullName || "";
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(' ') || "";
        
        payload.customerInfo = {
          firstName,
          lastName,
          email: values.email || null,
          mobileNumber: values.mobileNumber,
          countryCode: "+971",
          nationality: values.nationality || null,
          dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).toISOString() : null,
          gender: values.gender || null,
          maritalStatus: values.maritalStatus || null,
          occupation: values.occupation || null,
          employer: values.employer || null,
          monthlySalary: values.monthlySalary || 0,
          existingMonthlyLiabilities: values.existingMonthlyLiabilities || 0,
          residencyStatus: basicInfo.residencyStatus || "UAE Resident"
        };
        
        // Update local state
        setBasicInfo(prev => ({
          ...prev,
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`.trim(),
          email: values.email,
          mobileNumber: values.mobileNumber,
          nationality: values.nationality,
          dateOfBirth: values.dateOfBirth,
          gender: values.gender,
          maritalStatus: values.maritalStatus,
          occupation: values.occupation,
          employer: values.employer,
          monthlySalary: values.monthlySalary,
          existingMonthlyLiabilities: values.existingMonthlyLiabilities
        }));
      }
      else if (editModal.type === "property") {
        payload.propertyDetails = {
          transactionType: values.transactionType || null,
          propertyValue: values.propertyValue || 0,
          loanAmountRequired: values.loanAmountRequired || 0,
          downPaymentAmount: values.downPaymentAmount || 0,
          propertyAddress: { 
            area: values.area || null, 
            city: values.city || "Dubai" 
          }
        };
        
        setPropertyInfo(prev => ({
          ...prev,
          transactionType: values.transactionType,
          propertyValue: values.propertyValue,
          loanAmountRequired: values.loanAmountRequired,
          downPaymentAmount: values.downPaymentAmount,
          propertyAddress: { area: values.area, city: values.city || "Dubai" }
        }));
      }
      else if (editModal.type === "loan") {
        payload.loanRequirements = {
          timeline: values.timeline || null,
          preferredTenureYears: values.preferredTenureYears || 25,
          preferredInterestRateType: values.preferredInterestRateType || "Fixed",
          feeFinancingPreference: values.feeFinancingPreference || false
        };
        
        setLoanRequirementsInfo(values);
      }

      // Clean payload (convert empty strings to null)
      const cleanedPayload = cleanPayload(payload);
      
      await apiService.put(`/vault/lead/advisorOrpartner/lead/${id}/info`, cleanedPayload);
      flash("success", `${editModal.title} updated successfully!`);
      setEditModal({ visible: false, type: "", title: "", fields: [] });
      modalForm.resetFields();
      await fetchLead();
    } catch (err) {
      console.error("Update error:", err);
      flash("error", err?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // Field Configurations
  const basicFields = [
    { name: "fullName", label: "Full Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email" },
    { name: "mobileNumber", label: "Mobile Number", type: "text", required: true },
    { name: "nationality", label: "Nationality", type: "country_select" },
    { name: "dateOfBirth", label: "Date of Birth", type: "date" },
    { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
    { name: "maritalStatus", label: "Marital Status", type: "select", options: ["Single", "Married", "Divorced", "Widowed"] },
    { name: "occupation", label: "Occupation", type: "text" },
    { name: "employer", label: "Employer", type: "text" },
    { name: "monthlySalary", label: "Monthly Salary (AED)", type: "number" },
    { name: "existingMonthlyLiabilities", label: "Existing Liabilities (EMIs + Cards)", type: "number" }
  ];

  const propertyFields = [
    { name: "transactionType", label: "Transaction Type", type: "select", options: ["Primary - Residential", "Primary - Commercial", "Buyout", "Equity", "Buyout + Equity", "Off-plan"] },
    { name: "propertyValue", label: "Property Value (AED)", type: "number" },
    { name: "loanAmountRequired", label: "Loan Amount Required (AED)", type: "number" },
    { name: "downPaymentAmount", label: "Down Payment (AED)", type: "number" },
    { name: "area", label: "Area", type: "text" },
    { name: "city", label: "City", type: "text" }
  ];

  const loanFields = [
    { name: "timeline", label: "Timeline", type: "select", options: ["Immediately", "1-3 months", "3-6 months", "More than 6 months"] },
    { name: "preferredTenureYears", label: "Preferred Tenure (Years)", type: "number" },
    { name: "preferredInterestRateType", label: "Rate Type", type: "select", options: ["Fixed", "Variable"] },
    { name: "feeFinancingPreference", label: "Include Fee Financing", type: "boolean" }
  ];

  const renderModalField = (field) => {
    if (field.type === "select") 
      return <Select size="large" className="premium-input" placeholder="Select...">{field.options.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}</Select>;
    if (field.type === "country_select") 
      return <Select size="large" showSearch className="premium-input" placeholder="Select nationality" filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
        {nationalityOptions.map(c => <Select.Option key={c.iso} value={c.name}>{c.name}</Select.Option>)}
      </Select>;
    if (field.type === "boolean") 
      return <Select size="large" className="premium-input"><Select.Option value={true}>Yes</Select.Option><Select.Option value={false}>No</Select.Option></Select>;
    if (field.type === "date") 
      return <DatePicker size="large" style={{ width: "100%" }} className="premium-input" format="DD-MMM-YYYY" />;
    if (field.type === "number") 
      return <Input type="number" size="large" className="premium-input" />;
    return <Input size="large" className="premium-input" />;
  };

  const DetailRow = ({ label, value, highlight = false }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: highlight ? 700 : 500, color: highlight ? C.primary : C.text, wordBreak: "break-word" }}>{value || "—"}</div>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: C.primarySoft, border: `2px solid ${C.primaryBord}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={28} color={C.primary} className="spin" />
      </div>
      <p style={{ color: C.primary, fontSize: 15, fontWeight: 600 }}>Loading Workspace...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 24px", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .spin { animation: spin 1s linear infinite; }
        .premium-card { background: ${C.white}; border-radius: 20px; border: 1px solid ${C.grayBord}; box-shadow: 0 4px 20px rgba(0,0,0,0.03); transition: 0.3s ease; height: 100%; }
        .premium-card:hover { box-shadow: 0 8px 30px rgba(92,3,155,0.06); border-color: ${C.primaryBord}; }
        .card-header { padding: 20px 24px; border-bottom: 1px solid ${C.grayLight}; display: flex; justify-content: space-between; align-items: center; }
        .icon-box { width: 36px; height: 36px; border-radius: 10px; background: ${C.primarySoft}; display: flex; align-items: center; justify-content: center; }
        .edit-btn { padding: 6px 14px; background: transparent; border: 1px solid ${C.grayBord}; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .edit-btn:hover { background: ${C.primarySoft}; color: ${C.primary}; border-color: ${C.primaryBord}; }
        .card-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .premium-input, .premium-input .ant-input, .premium-input .ant-select-selector { border-radius: 12px !important; height: 48px !important; }
        .premium-input:focus, .premium-input .ant-input:focus { border-color: ${C.primary} !important; box-shadow: 0 0 0 2px ${C.primarySoft} !important; }
        .run-eligibility-btn { width: 100%; margin-top: 32px; padding: 18px; background: linear-gradient(135deg, ${C.primary}, ${C.primaryMid}); color: #fff; border: none; border-radius: 16px; font-weight: 800; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s ease; }
        .run-eligibility-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(92,3,155,0.4); }
        .run-eligibility-btn:disabled { background: ${C.grayBord}; color: ${C.textMuted}; cursor: not-allowed; }
        .live-result-card { background: linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 100%); border-radius: 20px; padding: 24px; color: white; position: relative; overflow: hidden; height: 100%; }
        .result-card { background: ${C.white}; border-radius: 20px; border: 2px solid; padding: 24px; margin-top: 24px; }
        .custom-tabs { background: ${C.white}; border-radius: 16px; border: 1px solid ${C.grayBord}; padding: 6px; display: inline-flex; gap: 4px; margin-bottom: 24px; }
        .custom-tabs button { padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; border: none; background: transparent; color: ${C.gray}; }
        .custom-tabs button:hover { color: ${C.primary}; }
        .custom-tabs .active-tab { background: ${C.primarySoft}; color: ${C.primary}; box-shadow: 0 2px 8px rgba(92,3,155,0.1); }
      `}</style>

      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        
        {/* Header */}
        <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: C.white, border: `1px solid ${C.grayBord}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            <ChevronLeft size={16} /> Back to Lead Details
          </button>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: C.text }}>Eligibility & Lead Management</h1>
        </div>

        {/* Flash Message */}
        {flashMsg.text && (
          <div className="fade-up" style={{ marginBottom: 24, padding: "14px 20px", borderRadius: 12, background: flashMsg.type === "success" ? C.greenSoft : flashMsg.type === "warning" ? C.amberSoft : C.redSoft, border: `1px solid ${flashMsg.type === "success" ? C.greenBord : flashMsg.type === "warning" ? C.amberBord : C.redBord}`, display: "flex", alignItems: "center", gap: 10 }}>
            {flashMsg.type === "success" ? <CheckCircle size={18} color="#065F46" /> : <AlertCircle size={18} color="#991B1B" />}
            <span style={{ fontWeight: 600 }}>{flashMsg.text}</span>
          </div>
        )}

        {/* Status Alert */}
        {lead?.currentStatus === "Qualified" && (
          <Alert message="Lead Already Qualified" description="This lead has already been marked as Qualified. You can still recalculate eligibility if needed." type="info" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />
        )}
        {lead?.currentStatus === "Contacted" && (
          <Alert message="Ready for Eligibility Check" description="Customer has been contacted. Run the eligibility test below to determine if they qualify." type="info" showIcon style={{ marginBottom: 24, borderRadius: 12, background: C.primarySoft, borderColor: C.primaryBord }} />
        )}

        {/* Tabs */}
        <div className="custom-tabs">
          <button onClick={() => setActiveMainTab("eligibility")} className={activeMainTab === "eligibility" ? "active-tab" : "inactive-tab"}>
            <Calculator size={16} /> Calculate Eligibility
          </button>
          <button onClick={() => setActiveMainTab("edit")} className={activeMainTab === "edit" ? "active-tab" : "inactive-tab"}>
            <Edit2 size={16} /> Edit Lead Information
          </button>
        </div>

        {/* Tab: Calculate Eligibility */}
        {activeMainTab === "eligibility" && (
          <>
            <Row gutter={[24, 24]}>
              {/* Left Side - Input Form */}
              <Col xs={24} lg={14}>
                <div className="premium-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 20px", display: "flex", alignItems: "center", gap: 10, fontSize: 18 }}>
                      <DollarSign size={20} color={C.primary} /> Income & Liabilities
                    </h3>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <label className="input-label">Monthly Salary (AED)</label>
                        <InputNumber 
                          value={basicInfo.monthlySalary} 
                          onChange={(v) => setBasicInfo(prev => ({ ...prev, monthlySalary: v || 0 }))} 
                          size="large" 
                          style={{ width: "100%", borderRadius: 12 }} 
                          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                        />
                      </Col>
                      <Col xs={24} sm={12}>
                        <label className="input-label">Existing Liabilities (AED)</label>
                        <InputNumber 
                          value={basicInfo.existingMonthlyLiabilities} 
                          onChange={(v) => setBasicInfo(prev => ({ ...prev, existingMonthlyLiabilities: v || 0 }))} 
                          size="large" 
                          style={{ width: "100%", borderRadius: 12 }} 
                          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                        />
                      </Col>
                    </Row>

                    <h3 style={{ margin: "32px 0 20px", display: "flex", alignItems: "center", gap: 10, fontSize: 18 }}>
                      <Home size={20} color={C.primary} /> Property Details
                    </h3>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <label className="input-label">Property Value (AED)</label>
                        <InputNumber 
                          value={propertyInfo.propertyValue} 
                          onChange={(v) => setPropertyInfo(prev => ({ ...prev, propertyValue: v || 0 }))} 
                          size="large" 
                          style={{ width: "100%", borderRadius: 12 }} 
                          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                        />
                      </Col>
                      <Col xs={24} sm={12}>
                        <label className="input-label">Loan Amount Required (AED)</label>
                        <InputNumber 
                          value={propertyInfo.loanAmountRequired} 
                          onChange={(v) => setPropertyInfo(prev => ({ ...prev, loanAmountRequired: v || 0 }))} 
                          size="large" 
                          style={{ width: "100%", borderRadius: 12 }} 
                          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                        />
                      </Col>
                      <Col xs={24} sm={12}>
                        <label className="input-label">Down Payment (AED)</label>
                        <InputNumber 
                          value={propertyInfo.downPaymentAmount} 
                          onChange={(v) => setPropertyInfo(prev => ({ ...prev, downPaymentAmount: v || 0 }))} 
                          size="large" 
                          style={{ width: "100%", borderRadius: 12 }} 
                          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                        />
                      </Col>
                      <Col xs={24} sm={12}>
                        <label className="input-label">Tenure: <strong style={{ color: C.primary }}>{loanRequirementsInfo.preferredTenureYears} Years</strong></label>
                        <Slider 
                          min={5} 
                          max={30} 
                          value={loanRequirementsInfo.preferredTenureYears} 
                          onChange={(v) => setLoanRequirementsInfo(prev => ({ ...prev, preferredTenureYears: v }))} 
                          trackStyle={{ background: C.primary }} 
                          handleStyle={{ borderColor: C.primary }} 
                        />
                      </Col>
                      <Col xs={24} sm={12}>
                        <label className="input-label">Residency Status</label>
                        <Select value={residencyStatus} disabled style={{ width: "100%", borderRadius: 12 }}>
                          <Select.Option value="UAE National">UAE National (55% DBR)</Select.Option>
                          <Select.Option value="UAE Resident">UAE Resident (50% DBR)</Select.Option>
                          <Select.Option value="Non-Resident">Non-Resident (50% DBR)</Select.Option>
                        </Select>
                      </Col>
                    </Row>

                    <button onClick={checkEligibility} disabled={eligibilityLoading} className="run-eligibility-btn">
                      {eligibilityLoading ? <RefreshCw size={20} className="spin" /> : <ShieldCheck size={20} />}
                      {eligibilityLoading ? "Running Eligibility Engine..." : "Run Eligibility Test"}
                    </button>
                  </div>
                </div>
              </Col>

              {/* Right Side - Live Calculation Preview */}
              <Col xs={24} lg={10}>
                <div className="live-result-card">
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <h3 style={{ margin: "0 0 24px", fontSize: 18, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
                      <Activity size={20} color={C.primaryBord} /> Live Preview
                    </h3>

                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Debt Burden Ratio (DBR)</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: liveCalculation.dbr.isEligible ? "#34D399" : "#F87171" }}>
                          {liveCalculation.dbr.current}% / Max {liveCalculation.dbr.max}%
                        </span>
                      </div>
                      <Progress 
                        percent={Math.min((liveCalculation.dbr.current / liveCalculation.dbr.max) * 100, 100)} 
                        strokeColor={liveCalculation.dbr.isEligible ? "#34D399" : "#F87171"} 
                        showInfo={false} 
                        strokeWidth={8} 
                      />
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
                        Available for Mortgage: AED {liveCalculation.dbr.available.toLocaleString()}
                      </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Estimated Monthly EMI</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: liveCalculation.emi.isEligible ? "#34D399" : "#F87171" }}>
                          AED {liveCalculation.emi.value.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                        Based on 4.19% interest rate
                      </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Loan-to-Value (LTV)</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: liveCalculation.ltv.isEligible ? "#34D399" : "#F87171" }}>
                          {liveCalculation.ltv.value}% / Max 80%
                        </span>
                      </div>
                      <Progress 
                        percent={Math.min((liveCalculation.ltv.value / 80) * 100, 100)} 
                        strokeColor={liveCalculation.ltv.isEligible ? "#34D399" : "#F87171"} 
                        showInfo={false} 
                        strokeWidth={8} 
                      />
                    </div>

                    <div style={{ padding: 20, background: "rgba(255,255,255,0.1)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.15)", textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Eligibility Verdict</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: liveCalculation.isEligible ? "#34D399" : "#F87171" }}>
                        {liveCalculation.isEligible ? "✓ ELIGIBLE" : "✗ NOT ELIGIBLE"}
                      </div>
                      {!liveCalculation.isEligible && (
                        <div style={{ fontSize: 12, marginTop: 8, color: "rgba(255,255,255,0.6)", whiteSpace: "pre-line" }}>
                          {!liveCalculation.dbr.isEligible && "• DBR exceeds limit\n"}
                          {!liveCalculation.emi.isEligible && "• EMI exceeds available capacity\n"}
                          {!liveCalculation.ltv.isEligible && "• LTV exceeds 80% limit"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Eligibility Results Section */}
            {showResults && eligibilityResult && (
              <div className="result-card" style={{ borderColor: eligibilityResult.isEligible ? C.green : C.red, marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {eligibilityResult.isEligible ? <CheckCircle size={28} color={C.green} /> : <XCircle size={28} color={C.red} />}
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: eligibilityResult.isEligible ? C.green : C.red }}>
                      {eligibilityResult.isEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
                    </h3>
                  </div>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <Row gutter={[24, 24]}>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: "center", padding: 16, background: C.grayLight, borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Debt Burden Ratio (DBR)</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: eligibilityResult.checks?.dbr?.eligible ? C.green : C.red }}>
                        {eligibilityResult.checks?.dbr?.current || eligibilityResult.dbrPercentage || 0}%
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: "center", padding: 16, background: C.grayLight, borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Monthly EMI</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: eligibilityResult.checks?.emi?.eligible ? C.green : C.red }}>
                        AED {(eligibilityResult.checks?.emi?.value || eligibilityResult.proposedEMI || 0).toLocaleString()}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: "center", padding: 16, background: C.grayLight, borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Loan-to-Value (LTV)</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: eligibilityResult.checks?.ltv?.eligible ? C.green : C.red }}>
                        {eligibilityResult.checks?.ltv?.value || eligibilityResult.estimatedLTV || 0}%
                      </div>
                    </div>
                  </Col>
                </Row>

                {eligibilityResult.nextActions && eligibilityResult.nextActions.length > 0 && (
                  <div style={{ marginTop: 20, padding: 16, background: C.blueSoft, borderRadius: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>🎯 Next Actions</div>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {eligibilityResult.nextActions.map((action, idx) => (
                        <li key={idx} style={{ fontSize: 13, color: C.textSub }}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Tab: Edit Lead Information */}
        {activeMainTab === "edit" && (
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <div className="premium-card">
                <div className="card-header">
                  <div className="icon-box"><User size={18} color={C.primary} /></div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Customer</h3>
                  <button onClick={() => openEditModal("basic", "Customer Information", basicFields)} className="edit-btn"><Edit2 size={14} /> Edit</button>
                </div>
                <div className="card-body">
                  <DetailRow label="Full Name" value={basicInfo.fullName} highlight />
                  <DetailRow label="Email" value={basicInfo.email} />
                  <DetailRow label="Mobile" value={basicInfo.mobileNumber} />
                  <DetailRow label="Nationality" value={basicInfo.nationality} />
                  <DetailRow label="Date of Birth" value={basicInfo.dateOfBirth ? dayjs(basicInfo.dateOfBirth).format("DD MMM YYYY") : "—"} />
                  <DetailRow label="Age" value={calculateAge(basicInfo.dateOfBirth) ? `${calculateAge(basicInfo.dateOfBirth)} years` : "—"} />
                  <DetailRow label="Monthly Salary" value={basicInfo.monthlySalary ? `AED ${basicInfo.monthlySalary.toLocaleString()}` : "—"} />
                  <DetailRow label="Existing Liabilities" value={basicInfo.existingMonthlyLiabilities ? `AED ${basicInfo.existingMonthlyLiabilities.toLocaleString()}` : "—"} />
                </div>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div className="premium-card">
                <div className="card-header">
                  <div className="icon-box"><Home size={18} color={C.primary} /></div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Property</h3>
                  <button onClick={() => openEditModal("property", "Property Details", propertyFields)} className="edit-btn"><Edit2 size={14} /> Edit</button>
                </div>
                <div className="card-body">
                  <DetailRow label="Transaction Type" value={propertyInfo.transactionType} />
                  <DetailRow label="Property Value" value={propertyInfo.propertyValue ? `AED ${propertyInfo.propertyValue.toLocaleString()}` : "—"} highlight />
                  <DetailRow label="Loan Required" value={propertyInfo.loanAmountRequired ? `AED ${propertyInfo.loanAmountRequired.toLocaleString()}` : "—"} highlight />
                  <DetailRow label="Down Payment" value={propertyInfo.downPaymentAmount ? `AED ${propertyInfo.downPaymentAmount.toLocaleString()}` : "—"} />
                  <DetailRow label="Area" value={propertyInfo.propertyAddress?.area} />
                  <DetailRow label="City" value={propertyInfo.propertyAddress?.city} />
                </div>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div className="premium-card">
                <div className="card-header">
                  <div className="icon-box"><CreditCard size={18} color={C.primary} /></div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Requirements</h3>
                  <button onClick={() => openEditModal("loan", "Loan Requirements", loanFields)} className="edit-btn"><Edit2 size={14} /> Edit</button>
                </div>
                <div className="card-body">
                  <DetailRow label="Timeline" value={loanRequirementsInfo.timeline} />
                  <DetailRow label="Preferred Tenure" value={`${loanRequirementsInfo.preferredTenureYears} years`} highlight />
                  <DetailRow label="Rate Type" value={loanRequirementsInfo.preferredInterestRateType} />
                </div>
              </div>
            </Col>
          </Row>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        title={<div style={{ display: "flex", alignItems: "center", gap: 10 }}><Edit2 size={20} color={C.primary} /> {editModal.title}</div>}
        open={editModal.visible}
        onCancel={() => { setEditModal({ visible: false, type: "", title: "", fields: [] }); modalForm.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => { setEditModal({ visible: false, type: "", title: "", fields: [] }); modalForm.resetFields(); }}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={() => modalForm.submit()} loading={saving} style={{ background: C.primary }}>Save Changes</Button>
        ]}
        width={700}
      >
        <Form form={modalForm} layout="vertical" onFinish={handleSectionUpdate}>
          <Row gutter={16}>
            {editModal.fields.map((field) => (
              <Col span={field.type === "textarea" ? 24 : 12} key={field.name}>
                <Form.Item name={field.name} label={field.label} rules={field.required ? [{ required: true, message: `${field.label} is required` }] : []}>
                  {renderModalField(field)}
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>
    </div>
  );
}