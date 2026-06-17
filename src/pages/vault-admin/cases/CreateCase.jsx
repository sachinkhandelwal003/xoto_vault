// src/pages/Cases/CreateCase.jsx — Premium redesign
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '@/api/apiService';
import { useSelector } from 'react-redux';
import CustomTable from '@/components/common/CustomTable';
import {
  Card, Steps, Button, Typography, Row, Col, Spin,
  message, Input, Select, InputNumber, Space, Empty,
  DatePicker, Checkbox, Radio, Tag, Divider, Tooltip
} from 'antd';
import dayjs from 'dayjs';
import { fmtAED } from '@/utils/format';
import {
  UserOutlined, BankOutlined, CheckCircleOutlined,
  SaveOutlined, ThunderboltOutlined, HomeOutlined,
  FileTextOutlined, TrophyOutlined, SafetyOutlined,
  PercentageOutlined, DollarOutlined, CalendarOutlined,
  ArrowRightOutlined, ArrowLeftOutlined, ReloadOutlined,
  StarFilled, CheckOutlined, CrownOutlined, RocketOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const P   = '#5C039B';
const P10 = 'rgba(92,3,155,0.10)';
const P20 = 'rgba(92,3,155,0.20)';
const PM  = '#7c3aed';
const G   = '#059669';
const GBG = '#f0fdf4';
const R   = '#dc2626';
const RBG = '#fef2f2';
const GOLD= '#d97706';

const genRef = () =>
  `XOTO-APP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

const calcEMI = (p, r, y) => {
  if (!p || !r || p <= 0 || r <= 0) return 0;
  const mr = r / 100 / 12;
  const m  = y * 12;
  return mr === 0 ? Math.round(p / m) : Math.round((p * mr * Math.pow(1 + mr, m)) / (Math.pow(1 + mr, m) - 1));
};

// ──────────────────────────────────────────────────────────────
// SHARED FIELD WRAPPER — uniform label + input
// ──────────────────────────────────────────────────────────────
const Field = ({ label, required, children, tip }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      {required && <span style={{ color: R, fontSize: 11 }}>*</span>}
      {tip && <Tooltip title={tip}><InfoCircleOutlined style={{ fontSize: 10, color: '#94a3b8' }} /></Tooltip>}
    </div>
    {children}
  </div>
);

// ──────────────────────────────────────────────────────────────
// STAT CHIP — compact key metric display
// ──────────────────────────────────────────────────────────────
const StatChip = ({ label, value, color = '#1e293b', bg = '#f1f5f9', icon }) => (
  <div style={{ background: bg, borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    <span style={{ fontSize: 15, fontWeight: 800, color }}>{icon && <span style={{ marginRight: 4 }}>{icon}</span>}{value}</span>
  </div>
);

// ──────────────────────────────────────────────────────────────
// SECTION CARD — styled section wrapper
// ──────────────────────────────────────────────────────────────
const SectionCard = ({ title, icon, children, accent, style = {} }) => (
  <div style={{
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
    marginBottom: 20,
    ...style,
  }}>
    <div style={{
      padding: '14px 20px',
      borderBottom: '1px solid #f1f5f9',
      background: accent ? `linear-gradient(135deg, ${accent}08, ${accent}03)` : '#fafbfc',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      {icon && <span style={{ fontSize: 16, color: accent || P }}>{icon}</span>}
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{title}</span>
    </div>
    <div style={{ padding: '16px 20px' }}>{children}</div>
  </div>
);

// ──────────────────────────────────────────────────────────────
// STEP INDICATOR — custom step tracker
// ──────────────────────────────────────────────────────────────
const StepBar = ({ current, steps: stepList }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
    {stepList.map((s, i) => {
      const done    = i < current;
      const active  = i === current;
      const pending = i > current;
      return (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: done ? G : active ? P : '#e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 14,
              boxShadow: active ? `0 0 0 4px ${P20}` : 'none',
              transition: 'all 0.3s',
            }}>
              {done ? <CheckOutlined style={{ fontSize: 14 }} /> : i + 1}
            </div>
            <span style={{
              fontSize: 11, fontWeight: active ? 700 : 500,
              color: active ? P : done ? G : '#94a3b8',
              marginTop: 6, textAlign: 'center', whiteSpace: 'nowrap',
            }}>{s}</span>
          </div>
          {i < stepList.length - 1 && (
            <div style={{ flex: 2, height: 2, background: done ? G : '#e2e8f0', marginBottom: 18, transition: 'all 0.3s' }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ──────────────────────────────────────────────────────────────
// BANK CARD
// ──────────────────────────────────────────────────────────────
const BankCard = ({ bank, isSelected, onSelect }) => (
  <div
    onClick={() => onSelect(bank)}
    style={{
      background: isSelected ? `linear-gradient(135deg, ${P}0d, ${PM}0a)` : '#fff',
      border: `2px solid ${isSelected ? P : '#e2e8f0'}`,
      borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: isSelected ? `0 4px 20px ${P}25` : '0 1px 6px rgba(0,0,0,0.04)',
      position: 'relative',
    }}
  >
    {isSelected && (
      <div style={{
        position: 'absolute', top: 10, right: 10,
        background: P, borderRadius: '50%', width: 22, height: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckOutlined style={{ color: '#fff', fontSize: 11 }} />
      </div>
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 12,
        background: '#f8fafc', border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
      }}>
        <img
          src={bank.logo} alt={bank.bankName}
          style={{ width: 44, height: 44, objectFit: 'contain' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{bank.bankName}</div>
        <div style={{ marginTop: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            background: isSelected ? P : '#f1f5f9', color: isSelected ? '#fff' : '#64748b',
            padding: '2px 8px', borderRadius: 6,
          }}>{bank.bankCode}</span>
        </div>
      </div>
    </div>
    {bank.mortgageTypesSupported?.length > 0 && (
      <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {bank.mortgageTypesSupported.map(t => (
          <span key={t} style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20,
            background: '#faf5ff', color: P, border: `1px solid ${P20}`,
          }}>{t}</span>
        ))}
      </div>
    )}
  </div>
);

// ──────────────────────────────────────────────────────────────
// PRODUCT CARD
// ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, isSelected, onSelect, bankName, bankLogo }) => {
  const rate = parseFloat(product.interestRate) || parseFloat(product.minimumFloorRate) || 0;
  const maxLTV = product.maxLTV || (product.ltv && typeof product.ltv === 'object' ? product.ltv.max : (parseFloat(product.ltv) || 85));
  return (
    <div
      onClick={() => onSelect({ ...product, _rate: rate, _maxLTV: maxLTV })}
      style={{
        background: isSelected ? `linear-gradient(135deg, ${P}0e, ${PM}08)` : '#fff',
        border: `2px solid ${isSelected ? P : '#e2e8f0'}`,
        borderRadius: 16, padding: '20px', cursor: 'pointer',
        transition: 'all 0.25s',
        boxShadow: isSelected ? `0 8px 30px ${P}20` : '0 1px 6px rgba(0,0,0,0.04)',
        position: 'relative',
      }}
    >
      {isSelected && (
        <div style={{
          position: 'absolute', top: -1, right: -1,
          background: P, borderRadius: '0 14px 0 14px',
          padding: '4px 12px', fontSize: 10, fontWeight: 700, color: '#fff',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <CheckOutlined /> Selected
        </div>
      )}
      {product.isPopular && (
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <span style={{ fontSize: 10, background: GOLD, color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
            🔥 Popular
          </span>
        </div>
      )}

      <div style={{ marginTop: product.isPopular ? 20 : 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b', marginBottom: 4 }}>{product.productName}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>{bankName}</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: P10, color: P, fontWeight: 700 }}>
            {rate}% p.a.
          </span>
          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: '#f0fdf4', color: G, fontWeight: 700 }}>
            LTV: {maxLTV}%
          </span>
          {product.rateType && (
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: '#f8fafc', color: '#64748b', fontWeight: 600 }}>
              {product.rateType}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            ['Min Salary', `AED ${(product.minSalary || 0).toLocaleString()}`],
            ['Processing', product.bankFees === 0 || product.bankFees === '0' ? 'FREE' : String(product.bankFees || '—')],
            ['Valuation', product.propertyValuationFee ? `AED ${Number(product.propertyValuationFee).toLocaleString()}` : '—'],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// NAVBAR
// ──────────────────────────────────────────────────────────────
const NavBar = ({ onBack, onNext, backLabel = '← Back', nextLabel = 'Continue', nextDisabled = false, nextLoading = false, nextIcon }) => (
  <div style={{
    marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 24, borderTop: '1px solid #f1f5f9',
  }}>
    {onBack
      ? <Button size="large" onClick={onBack} icon={<ArrowLeftOutlined />} style={{ borderRadius: 10, height: 44, padding: '0 24px' }}>{backLabel}</Button>
      : <div />
    }
    {onNext && (
      <Button
        type="primary" size="large" onClick={onNext}
        disabled={nextDisabled} loading={nextLoading}
        icon={nextIcon || <ArrowRightOutlined />}
        style={{ background: nextDisabled ? '#94a3b8' : P, borderRadius: 10, height: 44, padding: '0 32px', fontWeight: 700, border: 'none' }}
      >
        {nextLabel}
      </Button>
    )}
  </div>
);

// ──────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────
const CreateCase = () => {
  const navigate      = useNavigate();
  const { user }      = useSelector(s => s.auth);
  const [searchParams] = useSearchParams();
  const urlLeadId     = searchParams.get('leadId');

  const roleCode = typeof user?.role === 'object' ? String(user.role.code) : String(user?.role);
  const basePath = roleCode === '21' ? '/dashboard/vaultpartner'
    : roleCode === '18' ? '/dashboard/vault-admin'
    : roleCode === '22' ? '/dashboard/vaultagent'
    : '/dashboard/vault-advisor';

  // Steps
  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [applicationSubType, setApplicationSubType] = useState('standard');

  // Step 1: Lead
  const [qualifiedLeads, setQualifiedLeads] = useState([]);
  const [fetchingLeads, setFetchingLeads]   = useState(false);
  const [selectedLead, setSelectedLead]     = useState(null);
  const [leadEligibility, setLeadEligibility] = useState(null);

  // Step 2: Bank
  const [banks, setBanks]               = useState([]);
  const [fetchingBanks, setFetchingBanks] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);

  // Step 3: Product
  const [products, setProducts]                 = useState([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct]   = useState(null);

  // Offer & Case
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [createdCase, setCreatedCase]     = useState(null);

  const emptyForm = () => ({
    caseReference: genRef(),
    firstName: '', lastName: '', fullName: '', email: '', mobile: '',
    nationality: '', residencyStatus: '', employmentStatus: '', gender: '',
    dateOfBirth: null, maritalStatus: '',
    occupation: '', monthlySalary: 0, fixedMonthlySalary: 0,
    existingLiabilities: 0, mortgageTerm: 25,
    feeFinancingRequired: false,
    propertyValue: 0, downPayment: 0, loanAmount: 0,
    propertyArea: '', propertyCity: 'Dubai', propertyType: '', transactionType: '', isOffPlan: false,
    preferredTenureYears: 25, preferredInterestRateType: 'Fixed', timeline: '',
    internalNotes: '', customerNotes: '', requestedLoanAmount: 0,
  });

  const [formData, setFormData] = useState(emptyForm());
  const upd = (patch) => setFormData(p => ({ ...p, ...patch }));

  const steps = ['Select Lead', 'Select Bank', 'Select Product', 'Review & Create'];

  // ─── API CALLS ───────────────────────────────────────────────

  const fetchQualifiedLeads = useCallback(async (search = '') => {
    setFetchingLeads(true);
    try {
      let url = '/vault/lead/advisor/my-leads?page=1&limit=100&status=Qualified';
      if (roleCode === '21') url = '/vault/lead/partner/get?page=1&limit=100&status=Qualified';
      if (roleCode === '18') url = '/vault/lead/admin/all?page=1&limit=100&status=Qualified';
      if (roleCode === '22') url = '/vault/lead/my-leads?page=1&limit=100&status=Qualified';
      const parsed = new URL(url, window.location.origin);
      if (search.trim()) parsed.searchParams.set('search', search.trim());
      const res = await apiService.get(parsed.pathname + parsed.search);
      if (res?.success) {
        setQualifiedLeads((res.data || []).filter(l =>
          l.currentStatus === 'Qualified' && !l.conversionInfo?.convertedToApplication
        ));
      }
    } catch { message.error('Failed to fetch leads'); }
    finally { setFetchingLeads(false); }
  }, [roleCode]);

  const fetchBanks = useCallback(async () => {
    setFetchingBanks(true);
    try {
      const res = await apiService.get('/bank?page=1&limit=50');
      if (res?.success && res.data) setBanks(res.data.filter(b => b.status === 'Active' && !b.isDeleted));
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
        setProducts(res.data.filter(p => p.status === 'Active' && !p.isDeleted));
      }
    } catch { message.error('Failed to fetch products for this bank'); }
    finally { setFetchingProducts(false); }
  }, []);

  // ─── POPULATE FORM FROM LEAD ──────────────────────────────────
  const populateFromLead = (lead) => {
    const ci = lead.customerInfo || {};
    const pd = lead.propertyDetails || {};
    const lr = lead.loanRequirements || {};
    const propVal  = pd.propertyValue || 0;
    const downPay  = pd.downPaymentAmount || 0;
    const loanAmt  = pd.loanAmountRequired || (propVal - downPay) || 0;

    upd({
      firstName:              ci.firstName             || '',
      lastName:               ci.lastName              || '',
      fullName:               `${ci.firstName || ''} ${ci.lastName || ''}`.trim(),
      email:                  ci.email                 || '',
      mobile:                 ci.mobileNumber          || '',
      nationality:            ci.nationality           || '',
      residencyStatus:        ci.residencyStatus       || '',
      employmentStatus:       ci.employmentStatus      || '',
      gender:                 ci.gender                || '',
      dateOfBirth:            ci.dateOfBirth ? dayjs(ci.dateOfBirth) : null,
      maritalStatus:          ci.maritalStatus         || '',
      occupation:             ci.occupation            || '',
      monthlySalary:          ci.monthlySalary         || 0,
      fixedMonthlySalary:     ci.monthlySalary         || 0,
      existingLiabilities:    ci.existingLiabilities   ?? ci.existingMonthlyLiabilities ?? 0,
      feeFinancingRequired:   lr.feeFinancingPreference ?? false,
      mortgageTerm:           lr.preferredTenureYears  || 25,
      propertyValue:          propVal,
      downPayment:            downPay,
      loanAmount:             loanAmt,
      propertyArea:           pd.propertyAddress?.area || '',
      propertyCity:           pd.propertyAddress?.city || 'Dubai',
      propertyType:           pd.propertyType          || '',
      transactionType:        pd.transactionType       || '',
      isOffPlan:              pd.isOffPlan             || false,
      preferredTenureYears:   lr.preferredTenureYears  || 25,
      preferredInterestRateType: lr.preferredInterestRateType || 'Fixed',
      timeline:               lr.timeline              || '',
      internalNotes:          lead.notesToXoto         || '',
      requestedLoanAmount:    lead.eligibility?.recommendedLoanAmount || loanAmt || 0,
    });
    setLeadEligibility(lead.eligibility || null);
  };

  // ─── CALCULATE OFFER ─────────────────────────────────────────
  const calculateOffer = useCallback(async () => {
    if (!selectedLead || !selectedProduct || !selectedBank) return;
    setCalculating(true);
    try {
      const propVal   = formData.propertyValue;
      const downPay   = formData.downPayment;
      const loanAmt   = propVal - downPay;
      const rawTenure = formData.preferredTenureYears || 25;
      const rate      = selectedProduct._rate || parseFloat(selectedProduct.interestRate) || 0;
      const maxLTV    = selectedProduct._maxLTV || 85;

      const dob = formData.dateOfBirth;
      let tenure = rawTenure;
      if (dob) {
        const today = new Date();
        const birth = new Date(dob instanceof Object && dob.toDate ? dob.toDate() : dob);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        const retAge = formData.employmentStatus === 'Self-Employed' ? 70 : 65;
        tenure = Math.min(rawTenure, Math.max(5, retAge - age));
      }

      const emi  = calcEMI(loanAmt, rate, tenure);
      const ltv  = propVal > 0 ? (loanAmt / propVal) * 100 : 0;
      const dld  = propVal * 0.04;
      const reg  = loanAmt * 0.0025;
      const valFee  = Number(selectedProduct.propertyValuationFee) || 2500;
      const procFee = selectedProduct.bankFees;

      setSelectedOffer({
        bankId:       selectedBank._id,
        bankName:     selectedBank.bankName,
        bankLogo:     selectedBank.logo,
        bankCode:     selectedBank.bankCode,
        productId:    selectedProduct._id || selectedProduct.productId,
        productName:  selectedProduct.productName,
        interestRate: rate,
        emi,
        loanAmount:   loanAmt,
        tenureYears:  tenure,
        ltv: { value: Math.round(ltv), maxAllowed: maxLTV, ok: ltv <= maxLTV },
        upfrontCosts: {
          dldFee:         Math.round(dld),
          registrationFee: Math.round(reg),
          valuationFee:   valFee,
          processingFee:  procFee,
          total: Math.round(dld + reg + valFee + (isNaN(Number(procFee)) ? 0 : Number(procFee))),
        },
      });
      setStep(3);
    } catch { message.error('Error calculating offer'); }
    finally { setCalculating(false); }
  }, [selectedLead, selectedProduct, selectedBank, formData]);

  // ─── CREATE CASE ─────────────────────────────────────────────
  const createCase = async () => {
    if (!selectedLead) { message.error('Please select a lead'); return; }
    setSubmitting(true);
    try {
      const ci = selectedLead.customerInfo || {};
      const pd = selectedLead.propertyDetails || {};
      const lr = selectedLead.loanRequirements || {};

      const payload = {
        sourceLeadId:  selectedLead._id,
        caseReference: formData.caseReference,
        clientInfo: {
          firstName:           formData.firstName           || ci.firstName      || null,
          lastName:            formData.lastName            || ci.lastName       || null,
          fullName:            formData.fullName            || `${ci.firstName||''} ${ci.lastName||''}`.trim(),
          email:               formData.email               || ci.email          || null,
          phone:               formData.mobile              || ci.mobileNumber   || null,
          mobile:              formData.mobile              || ci.mobileNumber   || null,
          nationality:         formData.nationality         || ci.nationality    || null,
          residencyStatus:     formData.residencyStatus     || ci.residencyStatus || null,
          employmentStatus:    formData.employmentStatus    || ci.employmentStatus|| null,
          dateOfBirth:         formData.dateOfBirth ? dayjs(formData.dateOfBirth).toISOString() : (ci.dateOfBirth || null),
          employer:            null,
          monthlySalary:       formData.monthlySalary       || ci.monthlySalary   || null,
          fixedMonthlySalary:  formData.fixedMonthlySalary  || formData.monthlySalary || ci.monthlySalary || null,
          salaryBankName:      null,
          existingLiabilities: formData.existingLiabilities ?? ci.existingLiabilities ?? 0,
          mortgageTerm:        formData.mortgageTerm        || formData.preferredTenureYears || 25,
          feeFinancingRequired: formData.feeFinancingRequired ?? false,
          gender:              formData.gender              || ci.gender          || null,
        },
        applicationSubType: applicationSubType || 'standard',
        propertyInfo: {
          propertyValue:   applicationSubType === 'pre_approval_only' ? null : (formData.propertyValue   || pd.propertyValue    || null),
          loanAmount:      applicationSubType === 'pre_approval_only' ? (formData.requestedLoanAmount || null) : (formData.loanAmount || selectedLead.eligibility?.recommendedLoanAmount || null),
          downPayment:     applicationSubType === 'pre_approval_only' ? null : (formData.downPayment || pd.downPaymentAmount || null),
          propertyType:    formData.propertyType    || pd.propertyType    || null,
          transactionType: formData.transactionType || pd.transactionType || null,
          propertyAddress: { area: formData.propertyArea || pd.propertyAddress?.area || '', city: formData.propertyCity || pd.propertyAddress?.city || 'Dubai' },
        },
        ...(selectedOffer ? {
          loanInfo: {
            selectedBankProduct:    selectedOffer.productId,
            selectedBankName:       selectedOffer.bankName,
            interestRatePercentage: selectedOffer.interestRate,
            tenureYears:            selectedOffer.tenureYears || formData.preferredTenureYears || 25,
            monthlyEMI:             selectedOffer.emi,
            processingFee:          selectedOffer.upfrontCosts?.processingFee || 0,
            valuationFee:           selectedOffer.upfrontCosts?.valuationFee  || 2500,
          },
        } : {
          loanInfo: { tenureYears: formData.preferredTenureYears || lr.preferredTenureYears || 25 },
        }),
        currentStatus: 'Draft',
        internalNotes: formData.internalNotes ? [formData.internalNotes] : [],
        customerNotes: formData.customerNotes ? [formData.customerNotes] : [],
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
          existingMonthlyDebt:   ci.existingLiabilities                 || 0,
        },
      };

      const res = await apiService.post('/vault/cases', payload);
      if (res?.success) {
        setCreatedCase(res.data);
        message.success(`✅ Application ${formData.caseReference} created!`);
        setStep('success');
      } else {
        message.error(res?.message || 'Failed to create application');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Error creating application');
    } finally { setSubmitting(false); }
  };

  // ─── RESET ────────────────────────────────────────────────────
  const reset = () => {
    setStep(0); setSelectedLead(null); setSelectedBank(null);
    setSelectedProduct(null); setSelectedOffer(null); setCreatedCase(null);
    setLeadEligibility(null); setApplicationSubType('standard');
    setFormData(emptyForm()); fetchQualifiedLeads();
  };

  // ─── EFFECTS ─────────────────────────────────────────────────
  useEffect(() => { if (!urlLeadId) fetchQualifiedLeads(); }, [fetchQualifiedLeads, urlLeadId]);

  useEffect(() => {
    if (!urlLeadId) return;
    (async () => {
      setFetchingLeads(true);
      try {
        const res  = await apiService.get(`/vault/lead/${urlLeadId}`);
        const lead = res?.data || res;
        setSelectedLead(lead); populateFromLead(lead); setStep(1);
      } catch { message.error('Failed to load lead'); }
      finally { setFetchingLeads(false); }
    })();
  }, [urlLeadId]);

  useEffect(() => {
    if (selectedLead && step === 1) { fetchBanks(); populateFromLead(selectedLead); }
  }, [selectedLead, step, fetchBanks]);

  useEffect(() => {
    if (selectedBank && step === 2) fetchProducts(selectedBank._id);
  }, [selectedBank, step, fetchProducts]);

  useEffect(() => {
    if (selectedProduct && step === 2) calculateOffer();
  }, [selectedProduct, calculateOffer, step]);

  // Auto-update loan amount
  useEffect(() => {
    upd({ loanAmount: (formData.propertyValue || 0) - (formData.downPayment || 0) });
  }, [formData.propertyValue, formData.downPayment]);

  // ─── STEP 0 — SELECT LEAD ────────────────────────────────────
  const leadColumns = [
    {
      key: 'client', title: 'Client',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: selectedLead?._id === row._id ? P : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserOutlined style={{ color: selectedLead?._id === row._id ? '#fff' : '#94a3b8', fontSize: 15 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{row.customerInfo?.fullName || '—'}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.customerInfo?.email || row.customerInfo?.mobileNumber || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'property', title: 'Property Value',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: P }}>AED {(row.propertyDetails?.propertyValue || 0).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.propertyDetails?.transactionType || '—'}</div>
        </div>
      ),
    },
    {
      key: 'salary', title: 'Monthly Salary',
      render: (_, row) => (
        <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>AED {(row.customerInfo?.monthlySalary || 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'eligibility', title: 'Eligibility',
      render: (_, row) => row.eligibility?.isEligible ? (
        <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: GBG, color: G, fontWeight: 700, border: `1px solid #bbf7d0` }}>
          ✓ Eligible — DBR {row.eligibility.dbrPercentage}%
        </span>
      ) : (
        <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: RBG, color: R, fontWeight: 700 }}>Not Eligible</span>
      ),
    },
    {
      key: 'action', title: 'Select',
      render: (_, row) => (
        <button
          onClick={() => setSelectedLead(row)}
          style={{
            padding: '7px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
            background: selectedLead?._id === row._id ? P : '#f5f0ff', color: selectedLead?._id === row._id ? '#fff' : P,
            boxShadow: selectedLead?._id === row._id ? `0 4px 12px ${P}40` : 'none',
            transition: 'all 0.2s',
          }}
        >
          {selectedLead?._id === row._id ? '✓ Selected' : 'Select'}
        </button>
      ),
    },
  ];

  const renderLeadSelect = () => (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: '#1e293b', margin: 0, fontWeight: 800 }}>Select Qualified Lead</Title>
        <Text style={{ color: '#94a3b8', fontSize: 13 }}>Only leads with "Qualified" status are eligible for Application creation.</Text>
      </div>

      {selectedLead && (
        <div style={{ background: GBG, border: `1px solid #bbf7d0`, borderRadius: 12, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircleOutlined style={{ color: G, fontSize: 16 }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: G }}>
            Selected: {selectedLead.customerInfo?.fullName} — AED {(selectedLead.propertyDetails?.propertyValue || 0).toLocaleString()}
          </span>
          <button onClick={() => setSelectedLead(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: R, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕ Clear</button>
        </div>
      )}

      <CustomTable
        columns={leadColumns} data={qualifiedLeads} loading={fetchingLeads}
        showSearch={true} totalItems={qualifiedLeads.length} currentPage={1} itemsPerPage={10}
      />
      <NavBar
        onNext={() => { if (!selectedLead) { message.error('Please select a qualified lead first'); return; } setStep(1); }}
        nextLabel="Continue to Bank Selection"
        nextDisabled={!selectedLead}
      />
    </div>
  );

  // ─── STEP 1 — SELECT BANK ────────────────────────────────────
  const renderBankSelect = () => (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: '#1e293b', margin: 0, fontWeight: 800 }}>Select Bank</Title>
        <Text style={{ color: '#94a3b8', fontSize: 13 }}>Choose the bank to submit this mortgage application to.</Text>
      </div>

      {leadEligibility && (
        <div style={{
          background: leadEligibility.isEligible ? `linear-gradient(135deg, #059669, #10b981)` : `linear-gradient(135deg, ${R}, #ef4444)`,
          borderRadius: 16, padding: '18px 24px', marginBottom: 24, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SafetyOutlined style={{ fontSize: 22 }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Eligibility Status: {leadEligibility.isEligible ? 'ELIGIBLE ✓' : 'NOT ELIGIBLE ✗'}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                DBR: {leadEligibility.dbrPercentage}% &nbsp;|&nbsp; LTV: {leadEligibility.estimatedLTV}% &nbsp;|&nbsp; Score: {leadEligibility.eligibilityScore}/100 &nbsp;|&nbsp; Risk: {leadEligibility.riskGrade}
              </div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px' }}>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Recommended Loan</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>AED {(leadEligibility.recommendedLoanAmount || 0).toLocaleString()}</div>
          </div>
        </div>
      )}

      <div style={{ background: P10, borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <UserOutlined style={{ color: P }} />
        <Text style={{ fontWeight: 600, color: P }}>Customer: {selectedLead?.customerInfo?.fullName}</Text>
        <Text style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>· {selectedLead?.customerInfo?.email || selectedLead?.customerInfo?.mobileNumber}</Text>
      </div>

      {fetchingBanks
        ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        : banks.length === 0
          ? <Empty description="No active banks available" />
          : <Row gutter={[16, 16]}>{banks.map(b => (
              <Col xs={24} sm={12} lg={8} key={b._id}>
                <BankCard bank={b} isSelected={selectedBank?._id === b._id} onSelect={setSelectedBank} />
              </Col>
            ))}</Row>
      }
      <NavBar
        onBack={() => { setSelectedBank(null); setStep(0); }}
        onNext={() => { if (!selectedBank) { message.error('Please select a bank'); return; } setStep(2); }}
        nextLabel="Continue to Products"
        nextDisabled={!selectedBank}
      />
    </div>
  );

  // ─── STEP 2 — SELECT PRODUCT ─────────────────────────────────
  const renderProductSelect = () => (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: '#1e293b', margin: 0, fontWeight: 800 }}>Select Product</Title>
        <Text style={{ color: '#94a3b8', fontSize: 13 }}>Choose the mortgage product from {selectedBank?.bankName}.</Text>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: P10, borderRadius: 12, padding: '12px 18px', marginBottom: 20 }}>
        <img src={selectedBank?.logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} onError={e => e.target.style.display = 'none'} />
        <div>
          <div style={{ fontWeight: 700, color: P }}>Bank: {selectedBank?.bankName}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{selectedBank?.bankCode} · {selectedBank?.mortgageTypesSupported?.join(', ')}</div>
        </div>
      </div>

      {fetchingProducts
        ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" tip="Loading products..." /></div>
        : products.length === 0
          ? <Empty description={`No active products for ${selectedBank?.bankName}`} />
          : <Row gutter={[16, 16]}>{products.map(p => (
              <Col xs={24} md={12} key={p._id}>
                <ProductCard product={p} isSelected={selectedProduct?._id === p._id} onSelect={setSelectedProduct} bankName={selectedBank?.bankName} bankLogo={selectedBank?.logo} />
              </Col>
            ))}</Row>
      }
      <NavBar
        onBack={() => { setSelectedProduct(null); setStep(1); }}
        onNext={() => { if (!selectedProduct) { message.error('Please select a product'); return; } calculateOffer(); }}
        nextLabel={calculating ? 'Calculating...' : 'Continue to Review'}
        nextDisabled={!selectedProduct || calculating}
        nextLoading={calculating}
      />
    </div>
  );

  // ─── STEP 3 — REVIEW & CREATE ────────────────────────────────
  const renderReview = () => {
    if (!selectedOffer) return <Empty description="No offer selected" />;
    const emi = applicationSubType === 'pre_approval_only'
      ? calcEMI(formData.requestedLoanAmount, selectedOffer.interestRate, selectedOffer.tenureYears)
      : selectedOffer.emi;

    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ color: '#1e293b', margin: 0, fontWeight: 800 }}>Review & Create Application</Title>
          <Text style={{ color: '#94a3b8', fontSize: 13 }}>Review all details and confirm to create the application.</Text>
        </div>

        {/* Eligibility summary */}
        {leadEligibility && (
          <div style={{
            background: leadEligibility.isEligible ? GBG : RBG,
            border: `1px solid ${leadEligibility.isEligible ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: 14, padding: '14px 20px', marginBottom: 20,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                ['Status', leadEligibility.isEligible ? '✓ ELIGIBLE' : '✗ NOT ELIGIBLE', leadEligibility.isEligible ? G : R],
                ['DBR', `${leadEligibility.dbrPercentage}%`, '#1e293b'],
                ['LTV', `${leadEligibility.estimatedLTV}%`, '#1e293b'],
                ['Risk Grade', leadEligibility.riskGrade, GOLD],
              ].map(([label, value, color]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Application ref + case reference header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Reference:</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: P, background: P10, padding: '3px 12px', borderRadius: 20 }}>
              {formData.caseReference}
            </span>
          </div>
          <button
            onClick={() => upd({ caseReference: genRef() })}
            style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 8 }}
          >
            ↻ Regenerate
          </button>
        </div>

        <Row gutter={[20, 0]}>
          {/* LEFT — Customer + Property */}
          <Col xs={24} lg={14}>
            <SectionCard title="Customer Information" icon={<UserOutlined />} accent={P}>
              <Row gutter={[12, 14]}>
                <Col span={12}><Field label="First Name" required><Input value={formData.firstName} onChange={e => upd({ firstName: e.target.value, fullName: `${e.target.value} ${formData.lastName}` })} style={{ borderRadius: 8 }} /></Field></Col>
                <Col span={12}><Field label="Last Name" required><Input value={formData.lastName} onChange={e => upd({ lastName: e.target.value, fullName: `${formData.firstName} ${e.target.value}` })} style={{ borderRadius: 8 }} /></Field></Col>
                <Col span={12}><Field label="Email" required><Input value={formData.email} onChange={e => upd({ email: e.target.value })} style={{ borderRadius: 8 }} /></Field></Col>
                <Col span={12}><Field label="Mobile" required><Input value={formData.mobile} onChange={e => upd({ mobile: e.target.value })} style={{ borderRadius: 8 }} /></Field></Col>
                <Col span={12}><Field label="Nationality"><Input value={formData.nationality} onChange={e => upd({ nationality: e.target.value })} style={{ borderRadius: 8 }} /></Field></Col>
                <Col span={12}>
                  <Field label="Residency Status">
                    <Select value={formData.residencyStatus || undefined} onChange={v => upd({ residencyStatus: v })} style={{ width: '100%' }} placeholder="Select" allowClear>
                      {['UAE National', 'UAE Resident', 'Non-Resident'].map(o => <Option key={o}>{o}</Option>)}
                    </Select>
                  </Field>
                </Col>
                <Col span={12}>
                  <Field label="Employment Status">
                    <Select value={formData.employmentStatus || undefined} onChange={v => upd({ employmentStatus: v })} style={{ width: '100%' }} placeholder="Select" allowClear>
                      {['Salaried', 'Self-Employed'].map(o => <Option key={o}>{o}</Option>)}
                    </Select>
                  </Field>
                </Col>
                <Col span={12}>
                  <Field label="Gender">
                    <Select value={formData.gender || undefined} onChange={v => upd({ gender: v })} style={{ width: '100%' }} placeholder="Select" allowClear>
                      {['Male', 'Female', 'Other'].map(o => <Option key={o}>{o}</Option>)}
                    </Select>
                  </Field>
                </Col>
                <Col span={12}><Field label="Date of Birth"><DatePicker value={formData.dateOfBirth} onChange={v => upd({ dateOfBirth: v })} style={{ width: '100%', borderRadius: 8 }} format="DD/MM/YYYY" /></Field></Col>
                <Col span={12}>
                  <Field label="Marital Status">
                    <Select value={formData.maritalStatus || undefined} onChange={v => upd({ maritalStatus: v })} style={{ width: '100%' }} placeholder="Select" allowClear>
                      {['Single', 'Married', 'Divorced', 'Widowed'].map(o => <Option key={o}>{o}</Option>)}
                    </Select>
                  </Field>
                </Col>
                <Col span={12}><Field label="Occupation"><Input value={formData.occupation} onChange={e => upd({ occupation: e.target.value })} style={{ borderRadius: 8 }} /></Field></Col>
                <Col span={12}><Field label="Monthly Salary (AED)" required><InputNumber value={formData.monthlySalary} onChange={v => upd({ monthlySalary: v || 0, fixedMonthlySalary: v || 0 })} style={{ width: '100%', borderRadius: 8 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Field></Col>
                <Col span={12}><Field label="Existing Liabilities / Month (AED)" tip="Total existing monthly debt obligations"><InputNumber value={formData.existingLiabilities} onChange={v => upd({ existingLiabilities: v || 0 })} style={{ width: '100%', borderRadius: 8 }} /></Field></Col>
                <Col span={12}><Field label="Mortgage Term (Years)"><InputNumber value={formData.mortgageTerm} min={5} max={25} onChange={v => upd({ mortgageTerm: v || 25, preferredTenureYears: v || 25 })} style={{ width: '100%', borderRadius: 8 }} /></Field></Col>
                <Col span={12}>
                  <Field label="Fee Financing Required?">
                    <Select value={formData.feeFinancingRequired} onChange={v => upd({ feeFinancingRequired: v })} style={{ width: '100%' }}>
                      <Option value={true}>Yes</Option>
                      <Option value={false}>No</Option>
                    </Select>
                  </Field>
                </Col>
              </Row>
            </SectionCard>

            <SectionCard title="Property Details" icon={<HomeOutlined />} accent="#059669">
              <div style={{ marginBottom: 14 }}>
                <Field label="Application Type">
                  <Radio.Group value={applicationSubType} onChange={e => setApplicationSubType(e.target.value)} buttonStyle="solid" size="small">
                    <Radio.Button value="standard">Standard (Property Known)</Radio.Button>
                    <Radio.Button value="pre_approval_only">Pre-Approval Only</Radio.Button>
                  </Radio.Group>
                </Field>
                {applicationSubType === 'pre_approval_only' && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#fffbeb', borderRadius: 8, fontSize: 12, color: '#92400e', border: '1px solid #fde68a' }}>
                    ℹ️ Bank will pre-approve a loan ceiling. Ops adds property details post bank confirmation.
                  </div>
                )}
              </div>
              <Row gutter={[12, 14]}>
                {applicationSubType === 'standard' ? (
                  <>
                    <Col span={12}><Field label="Property Value (AED)" required><InputNumber value={formData.propertyValue} onChange={v => upd({ propertyValue: v || 0 })} style={{ width: '100%', borderRadius: 8 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Field></Col>
                    <Col span={12}><Field label="Down Payment (AED)"><InputNumber value={formData.downPayment} onChange={v => upd({ downPayment: v || 0 })} style={{ width: '100%', borderRadius: 8 }} /></Field></Col>
                    <Col span={12}>
                      <Field label="Loan Amount (AED)" tip="Auto-calculated: Property Value − Down Payment">
                        <InputNumber value={formData.loanAmount} disabled style={{ width: '100%', background: '#f8fafc', borderRadius: 8 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                      </Field>
                    </Col>
                  </>
                ) : (
                  <Col span={24}><Field label="Requested Loan Amount (AED)" required><InputNumber value={formData.requestedLoanAmount} onChange={v => upd({ requestedLoanAmount: v || 0 })} style={{ width: '100%', borderRadius: 8 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Field></Col>
                )}
                <Col span={12}>
                  <Field label="Property Type">
                    <Select value={formData.propertyType || undefined} onChange={v => upd({ propertyType: v })} style={{ width: '100%' }} placeholder="Select" allowClear>
                      {['Ready', 'Off-plan', 'Commercial'].map(o => <Option key={o}>{o}</Option>)}
                    </Select>
                  </Field>
                </Col>
                <Col span={12}>
                  <Field label="Transaction Type">
                    <Select value={formData.transactionType || undefined} onChange={v => upd({ transactionType: v })} style={{ width: '100%' }} placeholder="Select" allowClear>
                      {['Primary - Residential', 'Primary - Commercial', 'Buyout', 'Equity', 'Off-plan'].map(o => <Option key={o}>{o}</Option>)}
                    </Select>
                  </Field>
                </Col>
                <Col span={12}><Field label="Area / Community"><Input value={formData.propertyArea} onChange={e => upd({ propertyArea: e.target.value })} placeholder="e.g. Downtown Dubai" style={{ borderRadius: 8 }} /></Field></Col>
                <Col span={12}>
                  <Field label="Off-Plan">
                    <div style={{ paddingTop: 6 }}><Checkbox checked={formData.isOffPlan} onChange={e => upd({ isOffPlan: e.target.checked })}>Yes, this is an off-plan property</Checkbox></div>
                  </Field>
                </Col>
              </Row>
            </SectionCard>
          </Col>

          {/* RIGHT — Loan, Offer, Notes */}
          <Col xs={24} lg={10}>
            {/* Offer card */}
            <div style={{
              background: `linear-gradient(135deg, ${P}, ${PM})`,
              borderRadius: 18, padding: '22px', marginBottom: 20, color: '#fff',
              boxShadow: `0 10px 40px ${P}30`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.15)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={selectedOffer.bankLogo} alt="" style={{ width: 38, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedOffer.bankName}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{selectedOffer.productName}</div>
                </div>
                <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                  {selectedOffer.bankCode}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 2 }}>INTEREST RATE</div>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>{selectedOffer.interestRate}%</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>per annum</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 2 }}>MONTHLY EMI</div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>AED {(emi || 0).toLocaleString()}</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>estimated</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  ['Tenure', `${selectedOffer.tenureYears} Yrs`],
                  ['LTV', applicationSubType === 'pre_approval_only' ? 'TBD' : `${selectedOffer.ltv?.value}% / ${selectedOffer.ltv?.maxAllowed}%`],
                  ['Processing', String(selectedOffer.upfrontCosts?.processingFee || 'FREE')],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>{lbl}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{val}</div>
                  </div>
                ))}
              </div>

              {applicationSubType !== 'pre_approval_only' && selectedOffer.ltv && (
                <div style={{ marginTop: 12, background: selectedOffer.ltv.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)', borderRadius: 10, padding: '8px 12px', fontSize: 11 }}>
                  {selectedOffer.ltv.ok ? '✓' : '⚠'} LTV {selectedOffer.ltv.value}% is {selectedOffer.ltv.ok ? 'within' : 'above'} the max {selectedOffer.ltv.maxAllowed}% limit
                </div>
              )}
            </div>

            {/* Loan Requirements */}
            <SectionCard title="Loan Requirements" icon={<BankOutlined />} accent={P}>
              <Row gutter={[12, 14]}>
                <Col span={12}><Field label="Preferred Tenure (Yrs)"><InputNumber value={formData.preferredTenureYears} onChange={v => upd({ preferredTenureYears: v || 25 })} style={{ width: '100%', borderRadius: 8 }} min={5} max={30} /></Field></Col>
                <Col span={12}>
                  <Field label="Rate Type">
                    <Select value={formData.preferredInterestRateType} onChange={v => upd({ preferredInterestRateType: v })} style={{ width: '100%' }}>
                      <Option value="Fixed">Fixed</Option>
                      <Option value="Variable">Variable</Option>
                    </Select>
                  </Field>
                </Col>
                <Col span={24}>
                  <Field label="Timeline">
                    <Select value={formData.timeline || undefined} onChange={v => upd({ timeline: v })} style={{ width: '100%' }} placeholder="Select timeline" allowClear>
                      {['Immediately', '1-3 months', '3-6 months', 'More than 6 months'].map(o => <Option key={o}>{o}</Option>)}
                    </Select>
                  </Field>
                </Col>
              </Row>
            </SectionCard>

            {/* Notes */}
            <SectionCard title="Notes" icon={<FileTextOutlined />} accent="#64748b">
              <Field label="Internal Notes (not visible to customer)">
                <TextArea rows={3} value={formData.internalNotes} onChange={e => upd({ internalNotes: e.target.value })} placeholder="Notes for Xoto ops team..." style={{ borderRadius: 8, marginBottom: 12 }} />
              </Field>
              <Field label="Notes for Customer">
                <TextArea rows={3} value={formData.customerNotes} onChange={e => upd({ customerNotes: e.target.value })} placeholder="Visible to customer..." style={{ borderRadius: 8 }} />
              </Field>
            </SectionCard>
          </Col>
        </Row>

        <NavBar
          onBack={() => setStep(2)}
          onNext={createCase}
          nextLabel={submitting ? 'Creating Application...' : 'Create Application'}
          nextDisabled={submitting}
          nextLoading={submitting}
          nextIcon={<SaveOutlined />}
        />
      </div>
    );
  };

  // ─── SUCCESS SCREEN ───────────────────────────────────────────
  const renderSuccess = () => (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: `linear-gradient(135deg, ${G}, #10b981)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
        boxShadow: `0 12px 40px ${G}40`,
        fontSize: 36,
      }}>✅</div>

      <Title level={2} style={{ color: '#1e293b', fontWeight: 900, marginBottom: 4 }}>Application Created!</Title>
      <Text style={{ color: '#94a3b8', fontSize: 14 }}>Your mortgage application has been successfully created and is in Draft status.</Text>

      <div style={{
        background: `linear-gradient(135deg, ${P}, ${PM})`,
        borderRadius: 20, padding: '24px 32px', margin: '28px auto',
        maxWidth: 560, color: '#fff', boxShadow: `0 12px 40px ${P}30`,
      }}>
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>Application Reference</div>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 20 }}>{formData.caseReference}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['Client', formData.fullName || `${formData.firstName} ${formData.lastName}`.trim()],
            ['Bank', selectedOffer?.bankName],
            ['Loan Amount', `AED ${(applicationSubType === 'pre_approval_only' ? formData.requestedLoanAmount : formData.loanAmount).toLocaleString()}`],
            ['Interest Rate', `${selectedOffer?.interestRate}%`],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', textAlign: 'left' }}>
              <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 2 }}>{lbl.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{val || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      <Space>
        <Button size="large" onClick={reset} style={{ borderRadius: 10, height: 46, padding: '0 28px' }}>
          Create Another Application
        </Button>
        <Button type="primary" size="large" onClick={() => navigate(`${basePath}/case/view`)} style={{ background: P, borderRadius: 10, height: 46, padding: '0 28px', fontWeight: 700 }}>
          View My Applications →
        </Button>
      </Space>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────
  const renderStep = () => {
    if (step === 'success') return renderSuccess();
    if (step === 0) return renderLeadSelect();
    if (step === 1) return renderBankSelect();
    if (step === 2) return renderProductSelect();
    if (step === 3) return renderReview();
    return null;
  };

  return (
    <div style={{ padding: '28px 28px 48px', background: 'linear-gradient(180deg, #fafbff 0%, #f4f1fb 100%)', minHeight: '100vh' }}>
      <style>{`
        .ant-input, .ant-input-number-input, .ant-picker-input input { font-size: 13px !important; }
        .ant-input-number { border-radius: 8px !important; }
        .ant-select-selector { border-radius: 8px !important; }
        .ant-btn { font-weight: 600; }
      `}</style>

      {/* Page Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: `linear-gradient(135deg, ${P}, ${PM})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 20px ${P}40`,
        }}>
          <RocketOutlined style={{ color: '#fff', fontSize: 24 }} />
        </div>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1e1b4b', fontWeight: 900, fontSize: 22 }}>Create Application from Lead</Title>
          <Text style={{ color: '#94a3b8', fontSize: 13 }}>Qualified Lead → Bank → Product → Create Application</Text>
        </div>
      </div>

      {/* Main Card */}
      <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 4px 32px rgba(92,3,155,0.08)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '28px 32px 0' }}>
          {step !== 'success' && (
            <StepBar current={typeof step === 'number' ? step : 0} steps={steps} />
          )}
        </div>
        <div style={{ padding: '0 32px 32px', minHeight: 500 }}>
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default CreateCase;