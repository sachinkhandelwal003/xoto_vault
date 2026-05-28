import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from "@/api/apiService";
import { useSelector } from 'react-redux';
import {
  Steps, Button, Input, Spin, message, Tag, Row, Col,
  Avatar, Empty, Pagination,
} from 'antd';
import {
  UserOutlined, BankOutlined, FileTextOutlined,
  CheckOutlined, StarFilled, ArrowLeftOutlined, ArrowRightOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const P   = '#5C039B';
const PL  = '#f5f0ff';
const GN  = '#059669';
const GNL = '#ecfdf5';
const AM  = '#d97706';
const AML = '#fffbeb';
const RD  = '#dc2626';

const { TextArea } = Input;

const DBR_STYLE = {
  Eligible:   { bg: GNL, color: GN },
  Borderline: { bg: AML, color: AM },
  Ineligible: { bg: '#fef2f2', color: RD },
};

const fmt = (n) => n ? Number(n).toLocaleString() : '—';

/* ─── Bank Card ───────────────────────────────────────────────── */
const BankCard = ({ bank, isSelected, isRecommended, onToggle, onRecommend, selectionDisabled }) => {
  const dbr = DBR_STYLE[bank.dbrStatus] || DBR_STYLE.Eligible;
  const blocked = selectionDisabled && !isSelected;

  return (
    <div
      onClick={() => !blocked && onToggle(bank)}
      style={{
        background: '#fff',
        border: `2px solid ${isRecommended ? GN : isSelected ? P : '#e5e7eb'}`,
        borderRadius: 20, padding: 22, cursor: blocked ? 'not-allowed' : 'pointer',
        opacity: blocked ? 0.45 : 1, position: 'relative',
        boxShadow: isSelected ? `0 4px 24px ${isRecommended ? GN : P}25` : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.2s', marginTop: isRecommended ? 14 : 0,
      }}
    >
      {isRecommended && (
        <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: GN, color: '#fff', padding: '3px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', zIndex: 1 }}>
          ⭐ Recommended
        </div>
      )}
      {isSelected && (
        <div style={{ position: 'absolute', top: 14, right: 14, width: 26, height: 26, borderRadius: '50%', background: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckOutlined style={{ color: '#fff', fontSize: 12 }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        {bank.bankLogo ? (
          <img src={bank.bankLogo} alt={bank.bankName} style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 10, border: '1px solid #f0f0f0', background: '#fafafa', padding: 4 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <Avatar size={46} style={{ background: PL, color: P }} icon={<BankOutlined />} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bank.bankName}</div>
          <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bank.productName}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: P, lineHeight: 1 }}>{bank.rate}%</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>{bank.rateType}</div>
        </div>
      </div>

      <div style={{ background: PL, borderRadius: 14, padding: '12px 16px', marginBottom: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Monthly EMI</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: P }}>AED {fmt(bank.emi)}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>DBR</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{bank.dbr}%</span>
          <Tag style={{ background: dbr.bg, color: dbr.color, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 10, margin: 0 }}>{bank.dbrStatus}</Tag>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { label: 'Processing', val: `AED ${fmt(bank.processingFee)}` },
          { label: 'Valuation',  val: `AED ${fmt(bank.valuationFee)}`  },
          { label: 'Max LTV',    val: `${bank.maxLTV}%`                 },
        ].map(({ label, val }) => (
          <div key={label} style={{ flex: 1, background: '#f9fafb', borderRadius: 10, padding: '7px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{val}</div>
          </div>
        ))}
      </div>

      {bank.salaryTransferRequired && (
        <div style={{ fontSize: 11, color: AM, fontWeight: 600, marginBottom: 10 }}>⚠ Salary transfer required</div>
      )}

      {(bank.lifeInsurance?.value || bank.propertyInsurance?.value) && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {bank.lifeInsurance?.value && (
            <Tag style={{ background: GNL, color: GN, border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 600 }}>
              Life: AED {fmt(bank.lifeInsurance.value)}/{bank.lifeInsurance.frequency}
            </Tag>
          )}
          {bank.propertyInsurance?.value && (
            <Tag style={{ background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 600 }}>
              Prop: AED {fmt(bank.propertyInsurance.value)}/{bank.propertyInsurance.frequency}
            </Tag>
          )}
        </div>
      )}

      {isSelected && (
        <Button size="small"
          onClick={e => { e.stopPropagation(); onRecommend(bank.productId); }}
          icon={<StarFilled />}
          style={{ width: '100%', borderRadius: 10, fontWeight: 700, background: isRecommended ? GN : '#fff', borderColor: isRecommended ? GN : '#d1d5db', color: isRecommended ? '#fff' : '#374151' }}
        >
          {isRecommended ? 'Recommended ✓' : 'Mark as Recommended'}
        </Button>
      )}
    </div>
  );
};

/* ═══════════════════════════════ MAIN ═══════════════════════════════ */
const CreateProposal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector(s => s.auth);
  const urlLeadId = searchParams.get('leadId');
  const roleCode = typeof user?.role === 'object' ? String(user.role.code) : String(user?.role);

  const basePath = roleCode === '21'
    ? '/dashboard/vaultpartner/proposals'
    : roleCode === '22'
    ? '/dashboard/vaultagent/proposals'
    : roleCode === '18'
    ? '/dashboard/vault-admin/proposals'
    : '/dashboard/vault-advisor/proposals';

  /* Role-based lead API */
  const leadsEndpoint = roleCode === '21'
    ? '/vault/lead/partner/get'
    : roleCode === '22'
    ? '/vault/lead/my-leads'
    : roleCode === '18'
    ? '/vault/lead/admin/all'
    : '/vault/lead/advisor/my-leads';

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  /* ── Step 1: lead list ── */
  const [leads, setLeads]           = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsPage, setLeadsPage]   = useState(1);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadLoading, setLeadLoading]   = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const LEADS_LIMIT = 10;

  /* ── Step 2: bank selection ── */
  const [eligibleBanks, setEligibleBanks]     = useState([]);
  const [ineligibleBanks, setIneligibleBanks] = useState([]);
  const [bankSummary, setBankSummary]         = useState(null);
  const [banksLoading, setBanksLoading]       = useState(false);
  const [selectedBanks, setSelectedBanks]     = useState([]);
  const [recommendedId, setRecommendedId]     = useState(null);
  const [showIneligible, setShowIneligible]   = useState(false);

  /* ── Step 3: notes ── */
  const [coverNote, setCoverNote]     = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  /* ── Fetch qualified leads ── */
  const fetchLeads = useCallback(async (pg, search = '') => {
    setLeadsLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: LEADS_LIMIT, status: 'Qualified' });
      if (search.trim()) params.set('search', search.trim());
      const res = await apiService.get(`${leadsEndpoint}?${params.toString()}`);
      const list  = Array.isArray(res?.data?.data) ? res.data.data
                  : Array.isArray(res?.data)        ? res.data
                  : [];
      const total = res?.data?.total || res?.total || list.length;
      setLeads(list);
      setLeadsTotal(total);
    } catch {
      message.error('Failed to load leads');
    } finally {
      setLeadsLoading(false);
    }
  }, [leadsEndpoint]);

  useEffect(() => { fetchLeads(leadsPage, searchQuery); }, [leadsPage, fetchLeads]);

  /* ── Auto-load lead from URL param ── */
  useEffect(() => {
    if (urlLeadId) loadLeadById(urlLeadId);
  }, [urlLeadId]);

  const loadLeadById = async (id) => {
    setLeadLoading(true);
    try {
      const res = await apiService.get(`/vault/lead/${id}`);
      setSelectedLead(res?.data || res);
    } catch { message.error('Failed to load lead'); }
    finally { setLeadLoading(false); }
  };

  /* ── Load eligible banks ── */
  const loadEligibleBanks = async (leadId) => {
    setBanksLoading(true);
    try {
      const res = await apiService.get(`/vault/proposals/eligible-banks/${leadId}`);
      const d = res?.data || res;
      setEligibleBanks(d?.eligible || []);
      setIneligibleBanks(d?.ineligible || []);
      setBankSummary(d?.summary || null);
    } catch { message.error('Failed to load eligible banks'); }
    finally { setBanksLoading(false); }
  };

  const goStep1 = () => {
    if (!selectedLead) return;
    setStep(1);
    loadEligibleBanks(selectedLead._id || selectedLead.id);
  };

  /* ── Bank toggle / recommend ── */
  const toggleBank = (bank) => {
    const id = bank.productId;
    if (selectedBanks.includes(id)) {
      setSelectedBanks(prev => prev.filter(x => x !== id));
      if (recommendedId === id) setRecommendedId(null);
    } else {
      if (selectedBanks.length >= 3) { message.warning('Maximum 3 banks can be selected'); return; }
      setSelectedBanks(prev => [...prev, id]);
    }
  };

  const handleRecommend = (pid) => setRecommendedId(prev => prev === pid ? null : pid);

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!selectedLead || selectedBanks.length === 0) return;
    setSubmitting(true);
    try {
      const leadId = selectedLead._id || selectedLead.id;
      const res = await apiService.post('/vault/proposals', {
        leadId,
        selectedBanks: selectedBanks.map(pid => ({ productId: pid, isRecommended: pid === recommendedId })),
        coverNote: coverNote.trim(),
        internalNotes: internalNotes.trim(),
      });
      const id = res?.data?._id || res?.data?.id || res?._id || res?.id;
      message.success('Proposal created successfully!');
      navigate(id ? `${basePath}/${id}` : `${basePath}/list`);
    } catch { message.error('Failed to create proposal'); }
    finally { setSubmitting(false); }
  };

  /* ══════════════ STEP RENDERERS ══════════════ */

  /* ── Step 0: Select Lead (table) ── */
  const renderStep0 = () => {
    if (leadLoading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;

    /* Selected lead — show summary card */
    if (selectedLead) {
      const ci = selectedLead.customerInfo || {};
      const pd = selectedLead.propertyDetails || {};
      const lr = selectedLead.loanRequirements || {};
      const fullName = ci.fullName || `${ci.firstName || ''} ${ci.lastName || ''}`.trim() || '—';
      return (
        <div>
          <div style={{ background: '#fff', borderRadius: 20, border: `2px solid ${P}`, padding: 28, boxShadow: `0 4px 24px ${P}15` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar size={56} style={{ background: PL, color: P, fontSize: 22, fontWeight: 800 }}>
                {fullName[0]?.toUpperCase() || 'C'}
              </Avatar>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{fullName}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Tag style={{ background: GNL, color: GN, border: 'none', borderRadius: 8, fontWeight: 700 }}>Qualified</Tag>
                  {ci.mobileNumber && <span style={{ fontSize: 12, color: '#94a3b8' }}>{ci.countryCode || '+971'} {ci.mobileNumber}</span>}
                </div>
              </div>
              {!urlLeadId && (
                <Button size="small" danger type="text" onClick={() => setSelectedLead(null)}>Change Lead</Button>
              )}
            </div>
            <Row gutter={[12, 12]}>
              {[
                { label: 'Monthly Salary',  value: `AED ${(ci.monthlySalary || 0).toLocaleString()}`        },
                { label: 'Loan Required',   value: `AED ${(pd.loanAmountRequired || 0).toLocaleString()}`   },
                { label: 'Property Value',  value: `AED ${(pd.propertyValue || 0).toLocaleString()}`        },
                { label: 'LTV',             value: `${pd.ltvPercentage || selectedLead.eligibility?.estimatedLTV || 0}%` },
                { label: 'Tenure',          value: `${lr.preferredTenureYears || 25} Years`                  },
                { label: 'Nationality',     value: ci.nationality || '—'                                     },
              ].map(({ label, value }) => (
                <Col span={8} key={label}>
                  <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{value}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      );
    }

    /* Lead table */
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Select a Qualified Lead</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Click a row to select the lead for this proposal</div>
          </div>
          <Tag style={{ background: GNL, color: GN, border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 12, padding: '4px 14px' }}>
            {leadsTotal} Qualified
          </Tag>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input
            placeholder="Search qualified leads by name or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onPressEnter={() => { setLeadsPage(1); fetchLeads(1, searchQuery); }}
            allowClear
            style={{ borderRadius: 10, maxWidth: 400 }}
          />
          <Button 
            type="primary" 
            onClick={() => { setLeadsPage(1); fetchLeads(1, searchQuery); }}
            style={{ borderRadius: 10, background: P, borderColor: P }}
          >
            Search
          </Button>
        </div>

        {leadsLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : leads.length === 0 ? (
          <Empty description={searchQuery ? "No matching leads found" : "No qualified leads found"} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 60 }} />
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr 80px', gap: 8, padding: '10px 16px', background: '#f9f8ff', borderRadius: 12, marginBottom: 8 }}>
              {['Customer', 'Phone', 'Salary', 'Loan Amount', 'LTV', 'Date'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {leads.map(lead => {
                const ci = lead.customerInfo || {};
                const pd = lead.propertyDetails || {};
                const name = ci.fullName || `${ci.firstName || ''} ${ci.lastName || ''}`.trim() || '—';
                return (
                  <div
                    key={lead._id || lead.id}
                    onClick={() => setSelectedLead(lead)}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr 80px',
                      gap: 8, padding: '14px 16px', background: '#fff',
                      borderRadius: 14, border: '1px solid #e5e7eb',
                      cursor: 'pointer', alignItems: 'center', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = P; e.currentTarget.style.background = '#faf8ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; }}
                  >
                    {/* Customer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <Avatar size={34} style={{ background: PL, color: P, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                        {name[0]?.toUpperCase() || 'C'}
                      </Avatar>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{ci.email || '—'}</div>
                      </div>
                    </div>
                    {/* Phone */}
                    <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                      {ci.countryCode || '+971'} {ci.mobileNumber || '—'}
                    </div>
                    {/* Salary */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      AED {(ci.monthlySalary || 0).toLocaleString()}
                    </div>
                    {/* Loan */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: P }}>
                      AED {(pd.loanAmountRequired || 0).toLocaleString()}
                    </div>
                    {/* LTV */}
                    <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                      {pd.ltvPercentage || lead.eligibility?.estimatedLTV || 0}%
                    </div>
                    {/* Date */}
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {dayjs(lead.createdAt).format('DD MMM')}
                    </div>
                  </div>
                );
              })}
            </div>

            {leadsTotal > LEADS_LIMIT && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                <Pagination
                  current={leadsPage}
                  total={leadsTotal}
                  pageSize={LEADS_LIMIT}
                  onChange={pg => setLeadsPage(pg)}
                  showSizeChanger={false}
                  size="small"
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  /* ── Step 1: Bank selection ── */
  const renderStep1 = () => (
    <div>
      {bankSummary && (
        <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
          {[
            { label: 'Eligible Banks', value: bankSummary.totalEligible,                       color: GN,  bg: GNL  },
            { label: 'Best Rate',      value: `${bankSummary.bestRate}%`,                       color: P,   bg: PL   },
            { label: 'Lowest EMI',     value: `AED ${fmt(bankSummary.lowestEMI)}`,              color: '#2563eb', bg: '#eff6ff' },
            { label: 'Selected',       value: `${selectedBanks.length} / 3`,                   color: AM,  bg: AML  },
          ].map(({ label, value, color, bg }) => (
            <Col span={6} key={label}>
              <div style={{ background: bg, borderRadius: 14, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {banksLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: P, fontWeight: 600 }}>Loading eligible banks…</div>
        </div>
      ) : eligibleBanks.length === 0 ? (
        <Empty description="No eligible banks found for this lead" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {eligibleBanks.map(bank => (
              <Col xs={24} md={12} lg={8} key={bank.productId}>
                <BankCard
                  bank={bank}
                  isSelected={selectedBanks.includes(bank.productId)}
                  isRecommended={recommendedId === bank.productId}
                  onToggle={toggleBank}
                  onRecommend={handleRecommend}
                  selectionDisabled={selectedBanks.length >= 3 && !selectedBanks.includes(bank.productId)}
                />
              </Col>
            ))}
          </Row>

          {ineligibleBanks.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Button type="text" size="small" onClick={() => setShowIneligible(v => !v)} style={{ color: '#94a3b8', fontWeight: 600 }}>
                {showIneligible ? '▲ Hide' : '▼ Show'} {ineligibleBanks.length} ineligible bank(s)
              </Button>
              {showIneligible && (
                <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                  {ineligibleBanks.map(bank => (
                    <Col xs={24} md={12} lg={8} key={bank.productId}>
                      <div style={{ background: '#f9fafb', borderRadius: 16, border: '1px solid #e5e7eb', padding: 18, opacity: 0.7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          {bank.bankLogo && <img src={bank.bankLogo} alt={bank.bankName} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />}
                          <div>
                            <div style={{ fontWeight: 700, color: '#475569', fontSize: 13 }}>{bank.bankName}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{bank.productName}</div>
                          </div>
                        </div>
                        <Tag style={{ background: '#fef2f2', color: RD, border: 'none', borderRadius: 8, fontWeight: 600 }}>Not Eligible</Tag>
                        {bank.reasons?.length > 0 && (
                          <div style={{ fontSize: 11, color: RD, marginTop: 8 }}>{bank.reasons.join(' · ')}</div>
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  /* ── Step 2: Review & Notes ── */
  const renderStep2 = () => {
    const selected = eligibleBanks.filter(b => selectedBanks.includes(b.productId));
    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
          {selected.map(bank => (
            <Col xs={24} md={8} key={bank.productId}>
              <div style={{
                background: '#fff', borderRadius: 18,
                border: `2px solid ${recommendedId === bank.productId ? GN : P}`,
                padding: 20, position: 'relative',
                marginTop: recommendedId === bank.productId ? 14 : 0,
              }}>
                {recommendedId === bank.productId && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: GN, color: '#fff', padding: '3px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>⭐ Recommended</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  {bank.bankLogo && <img src={bank.bankLogo} alt={bank.bankName} style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 8 }} onError={e => e.currentTarget.style.display = 'none'} />}
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{bank.bankName}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{bank.productName}</div>
                  </div>
                </div>
                <Row gutter={[8, 8]}>
                  {[
                    { label: 'Rate',      value: `${bank.rate}%`,              color: P          },
                    { label: 'EMI',       value: `AED ${fmt(bank.emi)}`,        color: '#0f172a'  },
                    { label: 'DBR',       value: `${bank.dbr}%`,               color: '#0f172a'  },
                    { label: 'LTV',       value: `${bank.ltv}%`,               color: '#0f172a'  },
                    { label: 'Proc Fee',  value: `AED ${fmt(bank.processingFee)}`, color: '#0f172a' },
                    { label: 'Val Fee',   value: `AED ${fmt(bank.valuationFee)}`,  color: '#0f172a' },
                  ].map(({ label, value, color }) => (
                    <Col span={12} key={label}>
                      <div style={{ background: '#f9f8ff', borderRadius: 10, padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontWeight: 800, color, fontSize: 13 }}>{value}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 10, fontSize: 14 }}>
                📝 Cover Note <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>Shown to customer</span>
              </div>
              <TextArea rows={5} placeholder="Write a message to the customer about these options..." value={coverNote} onChange={e => setCoverNote(e.target.value)} style={{ borderRadius: 12 }} />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 10, fontSize: 14 }}>
                🔒 Internal Notes <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>Not shown to customer</span>
              </div>
              <TextArea rows={5} placeholder="Internal notes for the team..." value={internalNotes} onChange={e => setInternalNotes(e.target.value)} style={{ borderRadius: 12 }} />
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  /* ══════════════ RENDER ══════════════ */
  return (
    <div style={{ background: '#f9f8ff', minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)', padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`${basePath}/list`)} style={{ color: '#fff' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff' }}>Create Proposal</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Bank mortgage comparison for your client</p>
          </div>
          {selectedLead && step === 0 && (
            <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>SELECTED</div>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>
                {selectedLead.customerInfo?.fullName || `${selectedLead.customerInfo?.firstName || ''} ${selectedLead.customerInfo?.lastName || ''}`.trim()}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* Steps */}
        <Steps
          current={step}
          items={[
            { title: 'Select Lead',     icon: <UserOutlined />,     description: selectedLead ? (selectedLead.customerInfo?.fullName || 'Lead selected') : 'Choose a qualified lead' },
            { title: 'Choose Banks',    icon: <BankOutlined />,     description: selectedBanks.length > 0 ? `${selectedBanks.length} bank(s) selected` : 'Select up to 3 banks' },
            { title: 'Review & Create', icon: <FileTextOutlined />, description: 'Add notes and submit' },
          ]}
          style={{ background: '#fff', padding: '20px 32px', borderRadius: 20, border: '1px solid #ede9ff', marginBottom: 28 }}
        />

        {/* Content */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ede9ff', padding: 32, minHeight: 380 }}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={() => step === 0 ? navigate(`${basePath}/list`) : setStep(s => s - 1)}
            style={{ borderRadius: 14, fontWeight: 600 }}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>

          {step < 2 ? (
            <Button
              type="primary" size="large"
              icon={step === 0 ? <CheckCircleOutlined /> : <ArrowRightOutlined />}
              disabled={step === 0 ? !selectedLead : selectedBanks.length === 0}
              onClick={() => step === 0 ? goStep1() : setStep(2)}
              style={{ borderRadius: 14, background: P, borderColor: P, fontWeight: 700 }}
            >
              {step === 0 ? 'Continue with Selected Lead' : 'Next Step'}
            </Button>
          ) : (
            <Button
              type="primary" size="large" loading={submitting}
              disabled={selectedBanks.length === 0}
              onClick={handleSubmit}
              style={{ borderRadius: 14, background: P, borderColor: P, fontWeight: 700 }}
            >
              Create Proposal
            </Button>
          )}
        </div>
      </div>

      <style>{`
        .ant-steps-item-process .ant-steps-item-icon { background: ${P} !important; border-color: ${P} !important; }
        .ant-steps-item-finish .ant-steps-item-icon { border-color: ${P} !important; }
        .ant-steps-item-finish .ant-steps-item-icon .anticon { color: ${P} !important; }
        .ant-steps-item-finish > .ant-steps-item-container > .ant-steps-item-tail::after { background: ${P} !important; }
        .ant-pagination-item-active { border-color: ${P} !important; }
        .ant-pagination-item-active a { color: ${P} !important; }
      `}</style>
    </div>
  );
};

export default CreateProposal;
