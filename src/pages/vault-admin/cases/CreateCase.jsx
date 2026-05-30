// src/pages/Cases/CreateCase.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from "@/api/apiService";
import { useSelector } from 'react-redux';
import CustomTable from '@/components/common/CustomTable';
import {
  Card, Steps, Button, Typography, Row, Col, Avatar,
  Tag, Divider, Spin, message, Input, Select,
  InputNumber, Alert, Progress, Space, Empty, Form, DatePicker, Checkbox, Radio
} from 'antd';
import dayjs from 'dayjs';
import { fmtAED } from '@/utils/format';
import {
  UserOutlined, BankOutlined, CheckCircleOutlined,
  CalculatorOutlined, SaveOutlined, ArrowLeftOutlined,
  ThunderboltOutlined, DollarOutlined, MailOutlined,
  PhoneOutlined, GlobalOutlined, CalendarOutlined,
  HomeOutlined, EnvironmentOutlined,
  TeamOutlined, DollarCircleOutlined, PercentageOutlined,
  FileTextOutlined, EditOutlined,
  HeartOutlined, SafetyOutlined, TrophyOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Theme Colors
const P = '#5C039B';
const PL = '#f5f0ff';
const PM = '#7c3aed';
const G = '#059669';
const GD = '#d97706';

// Helpers
const genRef = () => `XOTO-CASE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

const calcEMI = (p, r, y) => {
  if (!p || !r || p <= 0 || r <= 0) return 0;
  const mr = r / 100 / 12;
  const m = y * 12;
  return mr === 0 ? Math.round(p / m) : Math.round((p * mr * Math.pow(1 + mr, m)) / (Math.pow(1 + mr, m) - 1));
};

// ==================== LEAD CARD ====================
const LeadCard = ({ lead, isSelected, onSelect }) => (
  <div
    onClick={() => onSelect(lead)}
    style={{
      background: '#fff',
      border: `2px solid ${isSelected ? P : '#e5e7eb'}`,
      borderRadius: 16,
      padding: 20,
      cursor: 'pointer',
      transition: 'all .2s',
      boxShadow: isSelected ? `0 4px 20px ${P}25` : '0 2px 8px rgba(0,0,0,.04)'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: isSelected ? P : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <UserOutlined style={{ color: isSelected ? '#fff' : '#6b7280', fontSize: 18 }} />
      </div>
      <div style={{ flex: 1 }}>
        <Text strong style={{ fontSize: 15 }}>{lead.customerInfo?.fullName}</Text>
        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{lead.customerInfo?.email}</Text>
      </div>
      {isSelected && <CheckCircleOutlined style={{ color: P, fontSize: 20 }} />}
    </div>
    <Divider style={{ margin: '8px 0' }} />
    <Row gutter={12}>
      <Col span={12}>
        <Text style={{ fontSize: 11, color: '#9ca3af' }}>Property Value</Text>
        <Text strong style={{ fontSize: 13 }}>{fmtAED(lead.propertyDetails?.propertyValue, 'Not set')}</Text>
      </Col>
      <Col span={12}>
        <Text style={{ fontSize: 11, color: '#9ca3af' }}>Monthly Salary</Text>
        <Text strong style={{ fontSize: 13 }}>{fmtAED(lead.customerInfo?.monthlySalary, 'Not set')}</Text>
      </Col>
    </Row>
    {lead.eligibility?.isEligible && (
      <div style={{ marginTop: 10 }}>
        <Tag color="success">✓ Eligible (DBR: {lead.eligibility?.dbrPercentage}% | LTV: {lead.eligibility?.estimatedLTV}%)</Tag>
      </div>
    )}
  </div>
);

// ==================== BANK CARD ====================
const BankCard = ({ bank, isSelected, onSelect }) => (
  <div
    onClick={() => onSelect(bank)}
    style={{
      background: '#fff',
      border: `2px solid ${isSelected ? P : '#e5e7eb'}`,
      borderRadius: 14,
      padding: 16,
      cursor: 'pointer',
      transition: 'all .2s',
      boxShadow: isSelected ? `0 4px 20px ${P}25` : '0 2px 8px rgba(0,0,0,.04)',
      position: 'relative'
    }}
  >
    {isSelected && <CheckCircleOutlined style={{ position: 'absolute', top: 12, right: 12, color: P, fontSize: 18 }} />}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <img src={bank.logo} alt={bank.bankName} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8 }} onError={e => e.target.style.display = 'none'} />
      <div>
        <Text strong style={{ fontSize: 15 }}>{bank.bankName}</Text>
        <div><Tag color="blue">{bank.bankCode}</Tag></div>
      </div>
    </div>
  </div>
);

// ==================== PRODUCT CARD ====================
const ProductCard = ({ product, isSelected, onSelect }) => (
  <div
    onClick={() => onSelect(product)}
    style={{
      background: '#fff',
      border: `2px solid ${isSelected ? P : '#e5e7eb'}`,
      borderRadius: 14,
      padding: 16,
      cursor: 'pointer',
      transition: 'all .2s',
      position: 'relative'
    }}
  >
    {isSelected && <CheckCircleOutlined style={{ position: 'absolute', top: 12, right: 12, color: P, fontSize: 18 }} />}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Text strong style={{ fontSize: 15 }}>{product.productName}</Text>
        <div style={{ marginTop: 4 }}>
          <Tag color="purple">{product.interestRate}% p.a.</Tag>
          <Tag color="green">LTV: {product.maxLTV}%</Tag>
        </div>
      </div>
      {product.isPopular && <Tag color="gold">🔥 Popular</Tag>}
    </div>
    <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
      <Col span={8}>
        <Text style={{ fontSize: 10, color: '#9ca3af' }}>Min Salary</Text>
        <div><Text strong>AED {(product.minSalary || 0).toLocaleString()}</Text></div>
      </Col>
      <Col span={8}>
        <Text style={{ fontSize: 10, color: '#9ca3af' }}>Processing Fee</Text>
        <div><Text strong>{product.processingFee === 0 ? 'FREE' : `AED ${(product.processingFee || 0).toLocaleString()}`}</Text></div>
      </Col>
      <Col span={8}>
        <Text style={{ fontSize: 10, color: '#9ca3af' }}>Valuation Fee</Text>
        <div><Text strong>AED {(product.valuationFee || 2500).toLocaleString()}</Text></div>
      </Col>
    </Row>
  </div>
);

// ==================== MAIN COMPONENT ====================
const CreateCase = () => {
  const { user } = useSelector(s => s.auth);
  const [searchParams] = useSearchParams();
  const urlLeadId = searchParams.get('leadId');
  const [searchQuery, setSearchQuery] = useState('');

  // Step State
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  
  // Step 1: Lead Selection
  const [qualifiedLeads, setQualifiedLeads] = useState([]);
  const [fetchingLeads, setFetchingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadEligibility, setLeadEligibility] = useState(null);
  
  // Step 2: Bank Selection
  const [banks, setBanks] = useState([]);
  const [fetchingBanks, setFetchingBanks] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  
  // Step 3: Product Selection
  const [products, setProducts] = useState([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Offer & Case Data
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [createdCase, setCreatedCase] = useState(null);
  
  // Form Data (Editable - All fields from Lead)
  const [formData, setFormData] = useState({
    caseReference: genRef(),
    // Customer Info
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    mobile: '',
    nationality: '',
    residencyStatus: '',
    employmentStatus: '',
    gender: '',
    dateOfBirth: null,
    maritalStatus: '',
    numberOfDependents: 0,
    occupation: '',
    employer: '',
    monthlySalary: 0,
    existingLiabilities: 0,
    // Property Info
    propertyValue: 0,
    downPayment: 0,
    loanAmount: 0,
    propertyArea: '',
    propertyCity: 'Dubai',
    propertyType: '',
    transactionType: '',
    isOffPlan: false,
    // Loan Requirements
    preferredTenureYears: 25,
    preferredInterestRateType: 'Fixed',
    timeline: '',
    // Notes
    internalNotes: '',
    customerNotes: ''
  });

  const steps = ['Select Lead', 'Select Bank', 'Select Product', 'Review & Create'];

  // ==================== API CALLS ====================
  
  const fetchQualifiedLeads = useCallback(async (search = '') => {
    setFetchingLeads(true);
    try {
      const roleCode = user?.role?.code;
      let url = '/vault/lead/advisor/my-leads?page=1&limit=100&status=Qualified';
      if (roleCode === '21') url = '/vault/lead/partner/get?page=1&limit=100&status=Qualified';
      if (roleCode === '18') url = '/vault/lead/admin/all?page=1&limit=100&status=Qualified';
            if (roleCode === '22') url = '/vault/lead/my-leads?page=1&limit=100&status=Qualified';

      const parsed = new URL(url, window.location.origin);
      if (search.trim()) {
        parsed.searchParams.set('search', search.trim());
      }
      
      const res = await apiService.get(parsed.pathname + parsed.search);
      if (res?.success) {
        const leads = res.data || [];
        setQualifiedLeads(leads.filter(l => l.currentStatus === 'Qualified' && !l.conversionInfo?.convertedToApplication));
      }
    } catch { message.error('Failed to fetch leads'); }
    finally { setFetchingLeads(false); }
  }, [user]);

  const fetchBanks = useCallback(async () => {
    setFetchingBanks(true);
    try {
      const res = await apiService.get('/bank?page=1&limit=50');
      if (res?.success && res.data) {
        setBanks(res.data);
      }
    } catch { message.error('Failed to fetch banks'); }
    finally { setFetchingBanks(false); }
  }, []);

  const fetchProducts = useCallback(async (bankId) => {
    setFetchingProducts(true);
    setProducts([]);
    setSelectedProduct(null);
    try {
      const res = await apiService.get(`/bank/${bankId}/products?page=1&limit=50`);
      if (res?.success && res.data) {
        const productList = res.data.map(p => ({
          productId: p._id,
          productName: p.productName,
          interestRate: parseFloat(p.interestRate),
          maxLTV: p.ltv?.max || 85,
          minSalary: p.minSalary || 0,
          processingFee: p.bankFees || 0,
          valuationFee: p.propertyValuationFee || 2500,
          isPopular: p.isPopular || false
        }));
        setProducts(productList);
      }
    } catch { message.error('Failed to fetch products'); }
    finally { setFetchingProducts(false); }
  }, []);

  // ==================== POPULATE FORM FROM LEAD ====================
  const populateFormFromLead = (lead) => {
    const ci = lead.customerInfo || {};
    const pd = lead.propertyDetails || {};
    const lr = lead.loanRequirements || {};
    
    const propertyValue = pd.propertyValue || 0;
    const downPayment = pd.downPaymentAmount || 0;
    const loanAmount = propertyValue - downPayment;
    
    setFormData({
      caseReference: genRef(),
      // Customer Info
      firstName: ci.firstName || '',
      lastName: ci.lastName || '',
      fullName: ci.fullName || `${ci.firstName || ''} ${ci.lastName || ''}`.trim(),
      email: ci.email || '',
      mobile: ci.mobileNumber || '',
      nationality: ci.nationality || '',
      residencyStatus: ci.residencyStatus || '',
      employmentStatus: ci.employmentStatus || '',
      gender: ci.gender || '',
      dateOfBirth: ci.dateOfBirth ? dayjs(ci.dateOfBirth) : null,
      maritalStatus: ci.maritalStatus || '',
      numberOfDependents: ci.numberOfDependents || 0,
      occupation: ci.occupation || '',
      employer: ci.employer || '',
      monthlySalary:        ci.monthlySalary || 0,
      fixedMonthlySalary:   ci.monthlySalary || 0,
      salaryBankName:       ci.salaryBankName || '',
      existingLiabilities:  ci.existingLiabilities ?? ci.existingMonthlyLiabilities ?? 0,
      feeFinancingRequired: ci.feeFinancingRequired ?? false,
      mortgageTerm:         ci.mortgageTerm || lr.preferredTenureYears || 25,
      // Property Info
      propertyValue: propertyValue,
      downPayment: downPayment,
      loanAmount: loanAmount,
      propertyArea: pd.propertyAddress?.area || '',
      propertyCity: pd.propertyAddress?.city || 'Dubai',
      propertyType: pd.propertyType || '',
      transactionType: pd.transactionType || '',
      isOffPlan: pd.isOffPlan || false,
      // Loan Requirements
      preferredTenureYears: lr.preferredTenureYears || 25,
      preferredInterestRateType: lr.preferredInterestRateType || 'Fixed',
      timeline: lr.timeline || '',
      // Notes
      internalNotes: lead.notesToXoto || '',
      customerNotes: ''
    });
    
    setLeadEligibility(lead.eligibility);
  };

  // ==================== CALCULATE OFFER ====================
  const calculateOffer = useCallback(async () => {
    if (!selectedLead || !selectedProduct) return;
    setCalculating(true);
    try {
      const propertyValue = formData.propertyValue;
      const downPayment = formData.downPayment;
      const loanAmount = propertyValue - downPayment;
      const tenure = formData.preferredTenureYears || 25;
      
      const emi = calcEMI(loanAmount, selectedProduct.interestRate, tenure);
      const ltv = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;
      const dldFee = propertyValue * 0.04;
      const regFee = loanAmount * 0.0025;
      
      const offer = {
        bankId: selectedBank._id,
        bankName: selectedBank.bankName,
        bankLogo: selectedBank.logo,
        productId: selectedProduct.productId,
        productName: selectedProduct.productName,
        interestRate: selectedProduct.interestRate,
        emi,
        loanAmount,
        tenureYears: tenure,
        ltv: { value: Math.round(ltv), maxAllowed: selectedProduct.maxLTV, eligible: ltv <= selectedProduct.maxLTV },
        upfrontCosts: {
          dldFee: Math.round(dldFee),
          registrationFee: Math.round(regFee),
          valuationFee: selectedProduct.valuationFee || 2500,
          processingFee: selectedProduct.processingFee || 0,
          total: Math.round(dldFee + regFee + (selectedProduct.valuationFee || 2500) + (selectedProduct.processingFee || 0))
        }
      };
      
      setSelectedOffer(offer);
      setStep(3);
    } catch (err) { 
      message.error('Error calculating offer'); 
    }
    finally { setCalculating(false); }
  }, [selectedLead, selectedProduct, selectedBank, formData]);

  // ==================== CREATE CASE ====================
  const createCase = async () => {
    if (!selectedLead) {
      message.error('Please select a lead to create a case');
      return;
    }

    setSubmitting(true);
    try {
      const ci = selectedLead.customerInfo || {};
      const pd = selectedLead.propertyDetails || {};
      const lr = selectedLead.loanRequirements || {};

      const payload = {
        sourceLeadId: selectedLead._id,
        caseReference: formData.caseReference,

        // Client info — prefer form values, fall back to lead (PRD 5.3 Step 1)
        clientInfo: {
          firstName:           formData.firstName           || ci.firstName      || null,
          lastName:            formData.lastName            || ci.lastName       || null,
          fullName:            formData.fullName            || `${ci.firstName || ''} ${ci.lastName || ''}`.trim(),
          email:               formData.email               || ci.email          || null,
          phone:               formData.mobile              || ci.mobileNumber   || null,
          mobile:              formData.mobile              || ci.mobileNumber   || null,
          nationality:         formData.nationality         || ci.nationality    || null,
          residencyStatus:     formData.residencyStatus     || ci.residencyStatus  || null,
          employmentStatus:    formData.employmentStatus    || ci.employmentStatus || null,
          dateOfBirth:         formData.dateOfBirth ? dayjs(formData.dateOfBirth).toISOString() : (ci.dateOfBirth || null),
          employer:            formData.employer            || ci.employer         || null,
          monthlySalary:       formData.monthlySalary       || ci.monthlySalary    || null,
          fixedMonthlySalary:  formData.fixedMonthlySalary  || formData.monthlySalary || ci.monthlySalary || null,
          salaryBankName:      formData.salaryBankName      || ci.salaryBankName   || null,
          existingLiabilities: formData.existingLiabilities ?? ci.existingLiabilities ?? null,
          mortgageTerm:        formData.mortgageTerm        || formData.preferredTenureYears || 25,
          feeFinancingRequired: formData.feeFinancingRequired ?? false,
          gender:              formData.gender              || ci.gender           || null,
        },

        // Property info — optional; use form values or lead property details
        propertyInfo: {
          propertyValue:   formData.propertyValue   || pd.propertyValue        || null,
          loanAmount:      formData.loanAmount       || selectedLead.eligibility?.recommendedLoanAmount || null,
          downPayment:     formData.downPayment      || pd.downPaymentAmount    || null,
          propertyType:    formData.propertyType     || pd.propertyType         || null,
          transactionType: formData.transactionType  || pd.transactionType      || null,
          propertyAddress: {
            area: formData.propertyArea || pd.propertyAddress?.area || '',
            city: formData.propertyCity || pd.propertyAddress?.city || 'Dubai',
          },
        },

        // Loan/bank info — optional (Ops can select bank later if not chosen now)
        ...(selectedOffer ? {
          loanInfo: {
            selectedBankProduct:      selectedOffer.productId,
            selectedBankName:         selectedOffer.bankName,
            interestRatePercentage:   selectedOffer.interestRate,
            tenureYears:              selectedOffer.tenureYears || formData.preferredTenureYears || 25,
            monthlyEMI:               selectedOffer.emi,
            processingFee:            selectedOffer.upfrontCosts?.processingFee || 0,
            valuationFee:             selectedOffer.upfrontCosts?.valuationFee  || 2500,
          },
        } : {
          loanInfo: {
            tenureYears: formData.preferredTenureYears || lr.preferredTenureYears || 25,
          },
        }),

        currentStatus: 'Draft',
        internalNotes: formData.internalNotes ? [formData.internalNotes] : [],
        customerNotes: formData.customerNotes ? [formData.customerNotes] : [],

        // Snapshot eligibility at time of case creation
        eligibilitySnapshot: {
          checkedAt:             leadEligibility?.checkedAt             || null,
          isEligible:            leadEligibility?.isEligible            ?? false,
          dbrPercentage:         leadEligibility?.dbrPercentage         || 0,
          dbrStatus:             leadEligibility?.dbrStatus             || 'Not Checked',
          estimatedLTV:          leadEligibility?.estimatedLTV          || 0,
          eligibilityScore:      leadEligibility?.eligibilityScore      || 0,
          riskGrade:             leadEligibility?.riskGrade             || null,
          recommendedLoanAmount: leadEligibility?.recommendedLoanAmount || 0,
          eligibilityNotes:      leadEligibility?.eligibilityNotes      || null,
          monthlySalary:         ci.monthlySalary                       || null,
        },
      };
      
      const res = await apiService.post('/vault/cases', payload);
      if (res?.success) {
        setCreatedCase(res.data);
        message.success(`✅ Case ${formData.caseReference} created!`);
        setStep('success');
      } else {
        message.error(res?.message || 'Failed to create case');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Error creating case');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset
  const reset = () => {
    setStep(0);
    setSelectedLead(null);
    setSelectedBank(null);
    setSelectedProduct(null);
    setSelectedOffer(null);
    setCreatedCase(null);
    setLeadEligibility(null);
    setFormData({
      caseReference: genRef(),
      firstName: '', lastName: '', fullName: '', email: '', mobile: '', nationality: '', 
      residencyStatus: '', employmentStatus: '', gender: '', dateOfBirth: null, 
      maritalStatus: '', numberOfDependents: 0, occupation: '', employer: '', 
      monthlySalary: 0, existingLiabilities: 0,
      propertyValue: 0, downPayment: 0, loanAmount: 0, propertyArea: '', propertyCity: 'Dubai',
      propertyType: '', transactionType: '', isOffPlan: false,
      preferredTenureYears: 25, preferredInterestRateType: 'Fixed', timeline: '',
      internalNotes: '', customerNotes: ''
    });
    fetchQualifiedLeads();
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (!urlLeadId) {
      fetchQualifiedLeads(searchQuery);
    }
  }, [fetchQualifiedLeads, urlLeadId]);

  // Auto-load lead from URL param
  useEffect(() => {
    const loadLeadById = async (id) => {
      setFetchingLeads(true);
      try {
        const res = await apiService.get(`/vault/lead/${id}`);
        const lead = res?.data || res;
        setSelectedLead(lead);
        populateFormFromLead(lead);
        setStep(1); // Skip select lead
      } catch {
        message.error('Failed to load lead from URL parameter');
      } finally {
        setFetchingLeads(false);
      }
    };
    if (urlLeadId) {
      loadLeadById(urlLeadId);
    }
  }, [urlLeadId]);

  useEffect(() => {
    if (selectedLead && step === 1) {
      fetchBanks();
      populateFormFromLead(selectedLead);
    }
  }, [selectedLead, step, fetchBanks]);

  useEffect(() => {
    if (selectedBank && step === 2) {
      fetchProducts(selectedBank._id);
    }
  }, [selectedBank, step, fetchProducts]);

  useEffect(() => {
    if (selectedProduct && step === 2) {
      calculateOffer();
    }
  }, [selectedProduct, calculateOffer, step]);

  // Auto-update loan amount
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      loanAmount: prev.propertyValue - prev.downPayment
    }));
  }, [formData.propertyValue, formData.downPayment]);

  // ==================== RENDER FUNCTIONS ====================
  
  // Step 0: Select Lead
  const leadColumns = [
    {
      key: 'client',
      title: 'Client',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: selectedLead?._id === row._id ? P : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserOutlined style={{ color: selectedLead?._id === row._id ? '#fff' : '#6b7280', fontSize: 15 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{row.customerInfo?.fullName || '—'}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.customerInfo?.email || row.customerInfo?.mobile || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'property',
      title: 'Property Value',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: P }}>AED {(row.propertyDetails?.propertyValue || 0).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.propertyDetails?.propertyType || '—'}</div>
        </div>
      ),
    },
    {
      key: 'salary',
      title: 'Monthly Salary',
      render: (_, row) => (
        <div style={{ fontWeight: 600, fontSize: 13 }}>AED {(row.customerInfo?.monthlySalary || 0).toLocaleString()}</div>
      ),
    },
    {
      key: 'eligibility',
      title: 'Eligibility',
      render: (_, row) => row.eligibility?.isEligible ? (
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#ecfdf5', color: '#059669', fontWeight: 700, border: '1px solid #a7f3d0' }}>
          ✓ Eligible — DBR {row.eligibility.dbrPercentage}%
        </span>
      ) : (
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', fontWeight: 700 }}>Not Eligible</span>
      ),
    },
    {
      key: 'action',
      title: 'Select',
      render: (_, row) => (
        <button
          onClick={() => setSelectedLead(row)}
          style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
            background: selectedLead?._id === row._id ? P : '#f5f0ff',
            color: selectedLead?._id === row._id ? '#fff' : P,
            boxShadow: selectedLead?._id === row._id ? `0 3px 10px ${P}40` : 'none',
          }}
        >
          {selectedLead?._id === row._id ? '✓ Selected' : 'Select'}
        </button>
      ),
    },
  ];

  const renderLeadSelect = () => (
    <div>
      <Title level={4} style={{ color: P, marginBottom: 8 }}>Step 1: Select Qualified Lead</Title>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
        Select a qualified lead to create a mortgage case. Only leads with "Qualified" status are shown.
      </p>

      {selectedLead && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircleOutlined style={{ color: '#059669', fontSize: 16 }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: '#059669' }}>
            Selected: {selectedLead.customerInfo?.fullName} — AED {(selectedLead.propertyDetails?.propertyValue || 0).toLocaleString()}
          </span>
          <button onClick={() => setSelectedLead(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✕ Clear</button>
        </div>
      )}

      <CustomTable
        columns={leadColumns}
        data={qualifiedLeads}
        loading={fetchingLeads}
        showSearch={true}
        totalItems={qualifiedLeads.length}
        currentPage={1}
        itemsPerPage={10}
      />

      <NavBar
        onNext={() => { if (!selectedLead) { message.error('Please select a qualified lead first'); return; } setStep(1); }}
        nextLabel="Continue →"
        nextDisabled={!selectedLead}
      />
    </div>
  );

  // Step 1: Select Bank
  const renderBankSelect = () => (
    <div>
      <Title level={4} style={{ color: P, marginBottom: 24 }}>Step 2: Select Bank</Title>
      
      {/* Eligibility Banner */}
      {leadEligibility && (
        <div style={{ 
          background: leadEligibility.isEligible ? G : '#dc2626', 
          borderRadius: 12, 
          padding: '16px 20px', 
          marginBottom: 20,
          color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SafetyOutlined style={{ fontSize: 24 }} />
              <div>
                <Text strong style={{ color: '#fff', fontSize: 16 }}>Eligibility Status: {leadEligibility.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, display: 'block' }}>
                  DBR: {leadEligibility.dbrPercentage}% | LTV: {leadEligibility.estimatedLTV}% | Score: {leadEligibility.eligibilityScore}/100 | Risk: {leadEligibility.riskGrade}
                </Text>
              </div>
            </div>
            <div>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>Recommended Loan: AED {(leadEligibility.recommendedLoanAmount || 0).toLocaleString()}</Text>
            </div>
          </div>
        </div>
      )}
      
      <Alert message={`Customer: ${selectedLead?.customerInfo?.fullName}`} type="info" showIcon style={{ marginBottom: 20, borderRadius: 10 }} />
      
      {fetchingBanks ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        : banks.length === 0 ? <Empty description="No banks available" />
        : (
          <Row gutter={[16, 16]}>
            {banks.map(bank => (
              <Col xs={24} sm={12} lg={8} key={bank._id}>
                <BankCard bank={bank} isSelected={selectedBank?._id === bank._id} onSelect={setSelectedBank} />
              </Col>
            ))}
          </Row>
        )}
      
      <NavBar onBack={() => { setSelectedBank(null); setStep(0); }} onNext={() => { if (!selectedBank) { message.error('Please select a bank'); return; } setStep(2); }} nextLabel="Continue →" nextDisabled={!selectedBank} />
    </div>
  );

  // Step 2: Select Product
  const renderProductSelect = () => (
    <div>
      <Title level={4} style={{ color: P, marginBottom: 24 }}>Step 3: Select Product</Title>
      <Alert message={`Bank: ${selectedBank?.bankName}`} type="info" showIcon style={{ marginBottom: 20, borderRadius: 10 }} />
      
      {fetchingProducts ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        : products.length === 0 ? <Empty description="No products available for this bank" />
        : (
          <Row gutter={[16, 16]}>
            {products.map(product => (
              <Col xs={24} md={12} key={product.productId}>
                <ProductCard product={product} isSelected={selectedProduct?.productId === product.productId} onSelect={setSelectedProduct} />
              </Col>
            ))}
          </Row>
        )}
      
      <NavBar onBack={() => { setSelectedProduct(null); setStep(1); }} onNext={() => { if (!selectedProduct) { message.error('Please select a product'); return; } }} nextLabel={calculating ? 'Calculating...' : 'Continue →'} nextDisabled={!selectedProduct || calculating} />
    </div>
  );

  // Step 3: Review & Create Case (Full Editable Form)
  const renderReviewSubmit = () => {
    if (!selectedOffer) return <Empty description="No offer selected" />;
    
    return (
      <div>
        <Title level={4} style={{ color: P, marginBottom: 24 }}>Step 4: Review & Create Case</Title>
        
        {/* Eligibility Summary Banner */}
        {leadEligibility && (
          <div style={{ 
            background: leadEligibility.isEligible ? '#f0fdf4' : '#fef2f2', 
            border: `1px solid ${leadEligibility.isEligible ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: 12, 
            padding: '16px 20px', 
            marginBottom: 20
          }}>
            <Row gutter={[16, 8]}>
              <Col span={6}>
                <Text type="secondary" style={{ fontSize: 11 }}>Status</Text>
                <div><Text strong style={{ color: leadEligibility.isEligible ? G : '#dc2626' }}>{leadEligibility.isEligible ? '✓ ELIGIBLE' : '✗ NOT ELIGIBLE'}</Text></div>
              </Col>
              <Col span={6}>
                <Text type="secondary" style={{ fontSize: 11 }}>DBR</Text>
                <div><Text strong>{leadEligibility.dbrPercentage}%</Text></div>
              </Col>
              <Col span={6}>
                <Text type="secondary" style={{ fontSize: 11 }}>LTV</Text>
                <div><Text strong>{leadEligibility.estimatedLTV}%</Text></div>
              </Col>
              <Col span={6}>
                <Text type="secondary" style={{ fontSize: 11 }}>Risk Grade</Text>
                <div><Text strong>{leadEligibility.riskGrade}</Text></div>
              </Col>
            </Row>
          </div>
        )}
        
        <Row gutter={[24, 20]}>
          {/* Left Column - Customer & Property */}
          <Col xs={24} lg={12}>
            <Card title={<span><UserOutlined style={{ color: P }} /> Customer Information</span>} size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>First Name *</Text>
                  <Input value={formData.firstName} onChange={e => setFormData(p => ({ ...p, firstName: e.target.value, fullName: `${e.target.value} ${p.lastName}` }))} placeholder="First name" />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Last Name *</Text>
                  <Input value={formData.lastName} onChange={e => setFormData(p => ({ ...p, lastName: e.target.value, fullName: `${p.firstName} ${e.target.value}` }))} placeholder="Last name" />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Email *</Text>
                  <Input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="Email" />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Mobile *</Text>
                  <Input value={formData.mobile} onChange={e => setFormData(p => ({ ...p, mobile: e.target.value }))} placeholder="Mobile" />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Nationality</Text>
                  <Input value={formData.nationality} onChange={e => setFormData(p => ({ ...p, nationality: e.target.value }))} placeholder="Nationality" />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Residency Status</Text>
                  <Select value={formData.residencyStatus} onChange={v => setFormData(p => ({ ...p, residencyStatus: v }))} style={{ width: '100%' }}>
                    <Option value="UAE National">UAE National</Option>
                    <Option value="UAE Resident">UAE Resident</Option>
                    <Option value="Non-Resident">Non-Resident</Option>
                  </Select>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Employment Status</Text>
                  <Select value={formData.employmentStatus} onChange={v => setFormData(p => ({ ...p, employmentStatus: v }))} style={{ width: '100%' }}>
                    <Option value="Salaried">Salaried</Option>
                    <Option value="Self-Employed">Self-Employed</Option>
                  </Select>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Gender</Text>
                  <Select value={formData.gender} onChange={v => setFormData(p => ({ ...p, gender: v }))} style={{ width: '100%' }}>
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Date of Birth</Text>
                  <DatePicker value={formData.dateOfBirth} onChange={v => setFormData(p => ({ ...p, dateOfBirth: v }))} style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Marital Status</Text>
                  <Select value={formData.maritalStatus} onChange={v => setFormData(p => ({ ...p, maritalStatus: v }))} style={{ width: '100%' }}>
                    <Option value="Single">Single</Option>
                    <Option value="Married">Married</Option>
                    <Option value="Divorced">Divorced</Option>
                    <Option value="Widowed">Widowed</Option>
                  </Select>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Dependents</Text>
                  <InputNumber value={formData.numberOfDependents} onChange={v => setFormData(p => ({ ...p, numberOfDependents: v || 0 }))} style={{ width: '100%' }} min={0} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Employer</Text>
                  <Input value={formData.employer} onChange={e => setFormData(p => ({ ...p, employer: e.target.value }))} placeholder="Employer name" />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Occupation</Text>
                  <Input value={formData.occupation} onChange={e => setFormData(p => ({ ...p, occupation: e.target.value }))} placeholder="Occupation" />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Monthly Salary (AED)</Text>
                  <InputNumber value={formData.monthlySalary} onChange={v => setFormData(p => ({ ...p, monthlySalary: v || 0, fixedMonthlySalary: v || 0 }))} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Salary Bank</Text>
                  <Input value={formData.salaryBankName} onChange={e => setFormData(p => ({ ...p, salaryBankName: e.target.value }))} placeholder="e.g. Emirates NBD" />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Existing Liabilities / Month (AED)</Text>
                  <InputNumber value={formData.existingLiabilities} onChange={v => setFormData(p => ({ ...p, existingLiabilities: v || 0 }))} style={{ width: '100%' }} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Mortgage Term (Years)</Text>
                  <InputNumber value={formData.mortgageTerm} min={5} max={25} onChange={v => setFormData(p => ({ ...p, mortgageTerm: v || 25, preferredTenureYears: v || 25 }))} style={{ width: '100%' }} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Fee Financing Required?</Text>
                  <Select value={formData.feeFinancingRequired} onChange={v => setFormData(p => ({ ...p, feeFinancingRequired: v }))} style={{ width: '100%' }}>
                    <Option value={true}>Yes</Option>
                    <Option value={false}>No</Option>
                  </Select>
                </Col>
              </Row>
            </Card>
            
            <Card title={<span><HomeOutlined style={{ color: P }} /> Property Details</span>} size="small">
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Property Value (AED) *</Text>
                  <InputNumber value={formData.propertyValue} onChange={v => setFormData(p => ({ ...p, propertyValue: v || 0 }))} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Down Payment (AED)</Text>
                  <InputNumber value={formData.downPayment} onChange={v => setFormData(p => ({ ...p, downPayment: v || 0 }))} style={{ width: '100%' }} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Loan Amount (AED)</Text>
                  <InputNumber value={formData.loanAmount} disabled style={{ width: '100%', background: '#f5f5f5' }} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Property Type</Text>
                  <Select value={formData.propertyType} onChange={v => setFormData(p => ({ ...p, propertyType: v }))} style={{ width: '100%' }}>
                    <Option value="Ready">Ready</Option>
                    <Option value="Off-plan">Off-plan</Option>
                    <Option value="Commercial">Commercial</Option>
                  </Select>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Transaction Type</Text>
                  <Select value={formData.transactionType} onChange={v => setFormData(p => ({ ...p, transactionType: v }))} style={{ width: '100%' }}>
                    <Option value="Primary - Residential">Primary - Residential</Option>
                    <Option value="Primary - Commercial">Primary - Commercial</Option>
                    <Option value="Buyout">Buyout</Option>
                    <Option value="Equity">Equity</Option>
                    <Option value="Off-plan">Off-plan</Option>
                  </Select>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Area / Community</Text>
                  <Input value={formData.propertyArea} onChange={e => setFormData(p => ({ ...p, propertyArea: e.target.value }))} placeholder="e.g. Downtown Dubai" />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Off-Plan</Text>
                  <Checkbox checked={formData.isOffPlan} onChange={e => setFormData(p => ({ ...p, isOffPlan: e.target.checked }))}>Yes</Checkbox>
                </Col>
              </Row>
            </Card>
          </Col>
          
          {/* Right Column - Loan Requirements, Bank Offer & Notes */}
          <Col xs={24} lg={12}>
            <Card title={<span><BankOutlined style={{ color: P }} /> Loan Requirements</span>} size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Preferred Tenure (Years)</Text>
                  <InputNumber value={formData.preferredTenureYears} onChange={v => setFormData(p => ({ ...p, preferredTenureYears: v || 25 }))} style={{ width: '100%' }} min={5} max={30} />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Rate Type</Text>
                  <Select value={formData.preferredInterestRateType} onChange={v => setFormData(p => ({ ...p, preferredInterestRateType: v }))} style={{ width: '100%' }}>
                    <Option value="Fixed">Fixed</Option>
                    <Option value="Variable">Variable</Option>
                  </Select>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Timeline</Text>
                  <Select value={formData.timeline} onChange={v => setFormData(p => ({ ...p, timeline: v }))} style={{ width: '100%' }}>
                    <Option value="Immediately">Immediately</Option>
                    <Option value="1-3 months">1-3 months</Option>
                    <Option value="3-6 months">3-6 months</Option>
                    <Option value="More than 6 months">More than 6 months</Option>
                  </Select>
                </Col>
              </Row>
            </Card>
            
            <Card title={<span><TrophyOutlined style={{ color: P }} /> Selected Offer</span>} size="small" style={{ background: PL, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <img src={selectedOffer.bankLogo} alt={selectedOffer.bankName} style={{ width: 48, height: 48, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                <div>
                  <Text strong style={{ fontSize: 16 }}>{selectedOffer.bankName}</Text>
                  <div><Tag color="purple">{selectedOffer.productName}</Tag></div>
                </div>
              </div>
              <Row gutter={[12, 12]}>
                <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>Interest Rate</Text><div><Text strong style={{ fontSize: 18, color: P }}>{selectedOffer.interestRate}%</Text></div></Col>
                <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>Monthly EMI</Text><div><Text strong style={{ fontSize: 18, color: G }}>AED {selectedOffer.emi?.toLocaleString()}</Text></div></Col>
                <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>Tenure</Text><div><Text strong>{selectedOffer.tenureYears} Yrs</Text></div></Col>
                <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>LTV</Text><div><Text strong>{selectedOffer.ltv?.value}% / {selectedOffer.ltv?.maxAllowed}%</Text></div></Col>
                <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>Processing Fee</Text><div><Text strong>{selectedOffer.upfrontCosts?.processingFee === 0 ? 'FREE' : `AED ${(selectedOffer.upfrontCosts?.processingFee || 0).toLocaleString()}`}</Text></div></Col>
              </Row>
            </Card>
            
            <Card title={<span><FileTextOutlined style={{ color: P }} /> Notes</span>} size="small">
              <TextArea
                rows={3}
                value={formData.internalNotes}
                onChange={e => setFormData(p => ({ ...p, internalNotes: e.target.value }))}
                placeholder="Internal notes for Xoto ops team (not visible to customer)..."
                style={{ marginBottom: 12 }}
              />
              <TextArea
                rows={3}
                value={formData.customerNotes}
                onChange={e => setFormData(p => ({ ...p, customerNotes: e.target.value }))}
                placeholder="Notes for customer..."
              />
            </Card>
          </Col>
        </Row>
        
        <NavBar onBack={() => setStep(2)} onNext={createCase} nextLabel={submitting ? 'Creating...' : 'Create Case'} nextDisabled={submitting} nextIcon={<SaveOutlined />} />
      </div>
    );
  };

  // Success Screen
  const renderSuccess = () => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ background: `linear-gradient(135deg, ${P}, ${PM})`, borderRadius: 20, padding: 40, color: '#fff', marginBottom: 28 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
        <Title level={2} style={{ color: '#fff' }}>Case Created Successfully!</Title>
        <div style={{ fontSize: 16, marginBottom: 20 }}>{formData.caseReference}</div>
        <Row gutter={[16, 12]} style={{ maxWidth: 600, margin: '0 auto' }}>
          {[
            ['Client', formData.fullName || `${formData.firstName} ${formData.lastName}`.trim()],
            ['Bank', selectedOffer?.bankName],
            ['Loan', `AED ${formData.loanAmount.toLocaleString()}`],
            ['Rate', `${selectedOffer?.interestRate}%`],
          ].map(([lbl, val]) => (
            <Col span={6} key={lbl}>
              <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 8px' }}>
                <div style={{ fontSize: 11 }}>{lbl}</div>
                <div style={{ fontWeight: 700 }}>{val || '—'}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
      
      <Space>
        <Button size="large" onClick={reset}>Create Another Case</Button>
        <Button type="primary" size="large" onClick={() => window.location.href = '/dashboard/vault-advisor/cases'} style={{ background: P }}>Go to My Cases</Button>
      </Space>
    </div>
  );

  // Step Router
  const renderStep = () => {
    if (step === 'success') return renderSuccess();
    if (step === 0) return renderLeadSelect();
    if (step === 1) return renderBankSelect();
    if (step === 2) return renderProductSelect();
    if (step === 3) return renderReviewSubmit();
    return null;
  };

  return (
    <div style={{ padding: 24, background: '#fdfbff', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .ant-steps-item-finish .ant-steps-item-icon { background: ${P}; border-color: ${P}; }
        .ant-steps-item-process .ant-steps-item-icon { background: ${P}; border-color: ${P}; }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${P}, ${PM})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ThunderboltOutlined style={{ color: '#fff', fontSize: 22 }} />
          </div>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1e1b4b', fontWeight: 800 }}>Create Case from Lead</Title>
            <Text type="secondary">Qualified Lead → Bank → Product → Create Case</Text>
          </div>
        </div>
      </div>

      <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px rgba(92,3,155,.06)' }}>
        <Steps current={typeof step === 'number' ? step : 0} items={steps.map(s => ({ title: s }))} style={{ marginBottom: 36 }} />
        <div style={{ minHeight: 500 }}>{renderStep()}</div>
      </Card>
    </div>
  );
};

// NavBar Helper
const NavBar = ({ onBack, onNext, backLabel = '← Back', nextLabel = 'Continue →', nextDisabled = false, nextLoading = false, nextIcon }) => (
  <div style={{ marginTop: 36, display: 'flex', justifyContent: 'space-between', paddingTop: 20 }}>
    {onBack && <Button size="large" onClick={onBack}>{backLabel}</Button>}
    <div />
    {onNext && <Button type="primary" size="large" onClick={onNext} disabled={nextDisabled} loading={nextLoading} icon={nextIcon} style={{ background: P, borderRadius: 8, height: 46, padding: '0 32px' }}>{nextLabel}</Button>}
  </div>
);

export default CreateCase;