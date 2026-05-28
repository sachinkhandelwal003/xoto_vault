import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from '@/api/apiService';
import {
  Steps,
  Card,
  Input,
  Button,
  Row,
  Col,
  Avatar,
  Tag,
  Spin,
  message,
  Empty,
  Divider,
  Space,
  Switch,
} from 'antd';
import {
  SearchOutlined,
  BankOutlined,
  CheckOutlined,
  StarFilled,
} from '@ant-design/icons';
import CustomTable from '@/components/common/CustomTable';

const { TextArea } = Input;

const STATUS_BADGE = {
  Eligible: { bg: '#d1fae5', color: '#10b981' },
  Borderline: { bg: '#fef3c7', color: '#d97706' },
  Ineligible: { bg: '#fee2e2', color: '#dc2626' },
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'AED 0';
  return `AED ${Number(value).toLocaleString()}`;
};

const getLeadFullName = (lead) => {
  const name = lead?.customerInfo?.fullName
    || `${lead?.customerInfo?.firstName || ''} ${lead?.customerInfo?.lastName || ''}`.trim();
  return name || lead?.customerSnapshot?.fullName || 'Customer';
};

const getPropertyData = (lead) => {
  return lead?.propertyDetails || lead?.propertySnapshot || {};
};

const BankCard = ({ bank, isSelected, isRecommended, onToggle, onRecommend, disabled }) => {
  const dbrStyle = STATUS_BADGE[bank.dbrStatus] || STATUS_BADGE.Eligible;
  const canRecommend = isSelected;
  return (
    <div
      onClick={() => !disabled && onToggle(bank)}
      style={{
        background: '#fff',
        borderRadius: 18,
        border: `2px solid ${isRecommended ? '#10b981' : isSelected ? '#5C039B' : '#e5e7eb'}`,
        padding: 22,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: isSelected ? '0 14px 35px rgba(92,3,155,0.16)' : '0 2px 12px rgba(15,23,42,0.04)',
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
      }}
    >
      {isRecommended && (
        <div style={{ position: 'absolute', top: 14, right: 14, background: '#10b981', color: '#fff', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700 }}>
          Recommended
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        {bank.bankLogo ? (
          <img src={bank.bankLogo} alt={bank.bankName} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 12, background: '#f8fafc', padding: 6 }} />
        ) : (
          <Avatar size={48} icon={<BankOutlined />} style={{ background: '#f5f3ff', color: '#5C039B' }} />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{bank.bankName}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{bank.productName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#5C039B' }}>{bank.rate?.toFixed(2)}%</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{bank.rateType || 'Rate type'}</div>
        </div>
      </div>

      <div style={{ background: '#f8f5ff', borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.08, marginBottom: 6 }}>Monthly EMI</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#5C039B' }}>{formatCurrency(bank.emi)}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>DBR</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, color: '#0f172a' }}>{bank.dbr}%</span>
          <span style={{ background: dbrStyle.bg, color: dbrStyle.color, borderRadius: 999, padding: '4px 10px', fontSize: 10, fontWeight: 700 }}>{bank.dbrStatus}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Processing</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{formatCurrency(bank.processingFee)}</div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Valuation</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{formatCurrency(bank.valuationFee)}</div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Max LTV</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{bank.maxLTV}%</div>
        </div>
      </div>

      {bank.salaryTransferRequired && (
        <div style={{ marginBottom: 12, color: '#d97706', fontWeight: 700, fontSize: 12 }}>Salary transfer required</div>
      )}

      <Space direction="vertical" style={{ width: '100%' }}>
        <Button
          type={isSelected ? 'primary' : 'default'}
          onClick={(event) => {
            event.stopPropagation();
            onToggle(bank);
          }}
          style={{ borderRadius: 12, fontWeight: 700, background: isSelected ? '#5C039B' : undefined, borderColor: isSelected ? '#5C039B' : undefined, color: isSelected ? '#fff' : undefined }}
        >
          {isSelected ? 'Selected' : 'Select'}
        </Button>
        {canRecommend && (
          <Button
            type={isRecommended ? 'primary' : 'default'}
            onClick={(event) => {
              event.stopPropagation();
              onRecommend(bank.productId);
            }}
            icon={<StarFilled />}
            style={{ borderRadius: 12, width: '100%' }}
          >
            {isRecommended ? 'Recommended' : 'Mark Recommended'}
          </Button>
        )}
      </Space>
    </div>
  );
};

const CreateProposal = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const leadIdParam = params.get('leadId');

  const [step, setStep] = useState(0);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadResults, setLeadResults] = useState([]);
  const [leadLoading, setLeadLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [eligibleBanks, setEligibleBanks] = useState([]);
  const [ineligibleBanks, setIneligibleBanks] = useState([]);
  const [bankSummary, setBankSummary] = useState(null);
  const [customerSummary, setCustomerSummary] = useState(null);
  const [banksLoading, setBanksLoading] = useState(false);
  const [selectedBanks, setSelectedBanks] = useState([]);
  const [recommendedId, setRecommendedId] = useState(null);
  const [showIneligible, setShowIneligible] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const roleCode = useMemo(() => {
    if (!user?.role) return '26';
    return typeof user.role === 'object' ? String(user.role.code) : String(user.role);
  }, [user]);

  const basePath = useMemo(() => {
    if (roleCode === '21') return '/dashboard/vault-partner';
    if (roleCode === '18') return '/dashboard/vault-admin';
    return '/dashboard/vault-advisor';
  }, [roleCode]);

  useEffect(() => {
    if (!leadIdParam) return;
    (async () => {
      await loadLead(leadIdParam);
      await loadEligibleBanks(leadIdParam);
      setStep(1);
    })();
  }, [leadIdParam]);

  const loadLead = async (id) => {
    setLeadLoading(true);
    try {
      const result = await apiService.get(`/vault/lead/${id}`);
      const data = result?.data ?? result;
      setSelectedLead(data);
    } catch (error) {
      message.error('Unable to load lead details.');
    } finally {
      setLeadLoading(false);
    }
  };

  // Fetch advisor's qualified leads (paginated)
  const fetchMyLeads = useCallback(async (page = 1, q = '', limit = 20) => {
    setLeadsLoading(true);
    try {
      const params = { page, limit, status: 'Qualified' };
      if (q) params.search = q;
      const endpoint = roleCode === '21' ? `/vault/lead/partner/get` : `/vault/lead/advisor/my-leads`;
      const res = await apiService.get(endpoint, params);
      const payload = res?.data ?? res;
      const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      const total = payload?.pagination?.total ?? payload?.total ?? items.length;
      setLeadResults(items);
      setLeadsTotal(total);
      setLeadsPage(page);
    } catch (err) {
      setLeadResults([]);
      setLeadsTotal(0);
    } finally {
      setLeadsLoading(false);
    }
  }, [roleCode]);

  useEffect(() => {
    // If there's no leadId in URL, load advisor leads
    if (!leadIdParam) fetchMyLeads(1, leadSearch.trim());
  }, [leadIdParam, fetchMyLeads]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!leadIdParam) fetchMyLeads(1, leadSearch.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [leadSearch, leadIdParam, fetchMyLeads]);

  const loadEligibleBanks = async (leadId) => {
    setBanksLoading(true);
    try {
      const result = await apiService.get(`/vault/proposals/eligible-banks/${leadId}`);
      const payload = result?.data ?? result;
      setEligibleBanks(payload?.eligible || []);
      setIneligibleBanks(payload?.ineligible || []);
      setBankSummary(payload?.summary || null);
      setCustomerSummary(payload?.customerSummary || null);
    } catch (error) {
      message.error('Unable to fetch eligible banks.');
      setEligibleBanks([]);
      setIneligibleBanks([]);
    } finally {
      setBanksLoading(false);
    }
  };

  const handleSelectLead = async (lead) => {
    const id = lead._id || lead.id;
    setSelectedLead(lead);
    await loadEligibleBanks(id);
    setStep(1);
  };

  const handleToggleBank = (bank) => {
    const productId = bank.productId;
    const isSelected = selectedBanks.includes(productId);
    if (isSelected) {
      setSelectedBanks((prev) => prev.filter((item) => item !== productId));
      if (recommendedId === productId) setRecommendedId(null);
      return;
    }
    if (selectedBanks.length >= 3) {
      message.warning('You can select up to 3 banks.');
      return;
    }
    setSelectedBanks((prev) => [...prev, productId]);
  };

  const handleRecommend = (productId) => {
    if (!selectedBanks.includes(productId)) {
      message.warning('Select the bank before marking it recommended.');
      return;
    }
    setRecommendedId((prev) => (prev === productId ? null : productId));
  };

  const handleCreate = async () => {
    if (!selectedLead) {
      message.error('Select a qualified lead first.');
      return;
    }
    if (selectedBanks.length === 0) {
      message.error('Choose at least one bank.');
      return;
    }
    setSubmitting(true);
    try {
      const leadId = selectedLead._id || selectedLead.id;
      const payload = {
        leadId,
        selectedBanks: selectedBanks.map((productId) => ({ productId, isRecommended: productId === recommendedId })),
        coverNote: coverNote.trim(),
        internalNotes: internalNotes.trim(),
      };
      const result = await apiService.post('/vault/proposals', payload);
      const data = result?.data ?? result;
      const createdId = data?._id || data?.id || data?.proposalId;
      message.success('Proposal created successfully');
      navigate(createdId ? `${basePath}/proposals/${createdId}` : `${basePath}/proposals`);
    } catch (error) {
      message.error('Failed to create proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const summaryFields = selectedLead ? [
    { label: 'Salary', value: formatCurrency(selectedLead.customerInfo?.monthlySalary ?? selectedLead.customerSnapshot?.monthlySalary) },
    { label: 'Loan Amount', value: formatCurrency(getPropertyData(selectedLead).loanAmountRequired ?? getPropertyData(selectedLead).loanAmount) },
    { label: 'Property Value', value: formatCurrency(getPropertyData(selectedLead).propertyValue) },
    { label: 'LTV', value: `${getPropertyData(selectedLead).ltvPercentage ?? getPropertyData(selectedLead).ltv ?? 0}%` },
    { label: 'Tenure', value: `${getPropertyData(selectedLead).tenureYears ?? 25} years` },
    { label: 'Status', value: 'Qualified' },
  ] : [];

  const selectedBankObjects = selectedBanks.map((productId) => eligibleBanks.find((bank) => bank.productId === productId)).filter(Boolean);

  const renderLeadSearch = () => (
    <div>
      {leadsLoading ? (
        <div style={{ textAlign: 'center', padding: 36 }}><Spin size="large" /></div>
      ) : (
        <CustomTable
          columns={[
            {
              key: 'customer',
              title: 'Customer',
              sortable: true,
              render: (_v, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar style={{ background: '#f5f3ff', color: '#5C039B' }}>{getLeadFullName(row)[0]?.toUpperCase()}</Avatar>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{getLeadFullName(row)}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{row.customerFullPhone || row.customerInfo?.mobileNumber || 'No phone'}</div>
                  </div>
                </div>
              ),
            },
            {
              key: 'propertyValue',
              title: 'Property Value',
              sortable: true,
              render: (_v, row) => formatCurrency(row.propertyDetails?.propertyValue ?? row.propertyDetails?.approxPropertyValue),
            },
            {
              key: 'loanAmount',
              title: 'Loan Amount',
              sortable: true,
              render: (_v, row) => formatCurrency(row.propertyDetails?.loanAmountRequired ?? row.propertyDetails?.loanAmountRequired ?? 0),
            },
            {
              key: 'dbr',
              title: 'DBR',
              sortable: true,
              render: (_v, row) => (
                <Tag color={row.eligibility?.dbrStatus === 'Eligible' ? '#d1fae5' : '#fee2e2'}>{row.eligibility?.dbrStatus ?? row.dbrStatus ?? '—'}</Tag>
              ),
            },
            {
              key: 'createdAt',
              title: 'Created',
              sortable: true,
              render: (_v, row) => new Date(row.createdAt).toLocaleString(),
            },
            {
              key: 'actions',
              title: 'Actions',
              render: (_v, row) => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="primary" onClick={() => navigate(`${basePath}/proposals/create?leadId=${row._id || row.id}`)} style={{ borderRadius: 8, background: '#5C039B', borderColor: '#5C039B' }}>Create Proposal</Button>
                </div>
              ),
            },
          ]}
          data={leadResults.filter((r) => (r.currentStatus === 'Qualified' || r.eligibility?.dbrStatus === 'Eligible'))}
          totalItems={leadsTotal}
          currentPage={leadsPage}
          itemsPerPage={20}
          onPageChange={(page, size) => fetchMyLeads(page, leadSearch.trim(), size)}
          onFilter={(filters) => {
            const q = filters?.search ?? '';
            setLeadSearch(q);
            fetchMyLeads(1, q?.trim?.() ?? '', 20);
          }}
          loading={leadsLoading}
          showSearch={true}
        />
      )}
    </div>
  );

  const renderLeadSummary = () => (
    <Card style={{ borderRadius: 20, border: '1px solid #e5e7eb', marginBottom: 24 }} styles={{ body: { padding: 24 } }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <Avatar size={64} style={{ background: '#f5f3ff', color: '#5C039B', fontSize: 24 }}>{getLeadFullName(selectedLead)[0]?.toUpperCase()}</Avatar>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{getLeadFullName(selectedLead)}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag color="#d1fae5" style={{ borderRadius: 999, fontWeight: 700 }}>Qualified</Tag>
            <Tag color="#e0f2fe" style={{ borderRadius: 999, fontWeight: 700 }}>{selectedLead.customerInfo?.mobileNumber || selectedLead.customerSnapshot?.mobile || 'No mobile'}</Tag>
          </div>
        </div>
      </div>
      <Row gutter={[16, 16]}>
        {summaryFields.map((field) => (
          <Col xs={24} sm={12} md={8} key={field.label}>
            <div style={{ background: '#fafafa', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{field.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{field.value}</div>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );

  const renderBankStep = () => (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card style={{ borderRadius: 20, border: '1px solid #e5e7eb' }} styles={{ body: { padding: 22 } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Eligible bank shortlist</div>
              <div style={{ color: '#64748b', marginTop: 4 }}>Select up to 3 banks and choose one recommendation.</div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Tag color="#d1fae5">Eligible {bankSummary?.totalEligible ?? 0}</Tag>
              <Tag color="#e0f2fe">Best rate {bankSummary?.bestRate ? `${bankSummary.bestRate}%` : '—'}</Tag>
              <Tag color="#ffedd5">Lowest EMI {bankSummary?.lowestEMI ? `AED ${bankSummary.lowestEMI?.toLocaleString()}` : '—'}</Tag>
              <Tag color="#e0f2fe">Selected {selectedBanks.length}/3</Tag>
            </div>
          </div>
        </Card>

        {banksLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
        ) : (
          <>
            {eligibleBanks.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
                {eligibleBanks.map((bank) => (
                  <BankCard
                    key={bank.productId}
                    bank={bank}
                    isSelected={selectedBanks.includes(bank.productId)}
                    isRecommended={recommendedId === bank.productId}
                    onToggle={handleToggleBank}
                    onRecommend={handleRecommend}
                    disabled={selectedBanks.length >= 3 && !selectedBanks.includes(bank.productId)}
                  />
                ))}
              </div>
            ) : (
              <Empty description="No eligible banks found for this lead" />
            )}
          </>
        )}

        {ineligibleBanks.length > 0 && (
          <Card style={{ borderRadius: 20, border: '1px solid #e5e7eb' }} styles={{ body: { padding: 20 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}> 
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Ineligible banks</div>
                <div style={{ color: '#64748b', marginTop: 4 }}>{ineligibleBanks.length} bank(s) did not qualify.</div>
              </div>
              <Button type="text" onClick={() => setShowIneligible((prev) => !prev)}>
                {showIneligible ? 'Hide details' : 'Show details'}
              </Button>
            </div>
            {showIneligible && (
              <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
                {ineligibleBanks.map((bank) => (
                  <div key={bank.productId} style={{ borderRadius: 16, background: '#fff7ed', padding: 18, border: '1px solid #fde2c7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#7c2d12' }}>{bank.bankName}</div>
                        <div style={{ fontSize: 12, color: '#92400e' }}>{bank.productName}</div>
                      </div>
                      <Tag color="#fed7aa">{bank.dbrStatus || 'Ineligible'}</Tag>
                    </div>
                    <div style={{ marginTop: 12, color: '#92400e' }}>
                      {bank.reasons?.length ? bank.reasons.join(', ') : 'Not eligible for the selected profile.'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </Space>
    </div>
  );

  const renderReviewStep = () => (
    <div>
      <Card style={{ borderRadius: 20, border: '1px solid #e5e7eb', marginBottom: 24 }} styles={{ body: { padding: 24 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Review selected banks</div>
            <div style={{ color: '#64748b', marginTop: 6 }}>Confirm the proposal package before creating it.</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Tag color="#d1fae5">Selected {selectedBanks.length}</Tag>
            {recommendedId && <Tag color="#bef264">Recommended set</Tag>}
          </div>
        </div>

        <div style={{ marginTop: 22, display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
          {selectedBankObjects.map((bank) => (
            <Card key={bank.productId} size="small" style={{ borderRadius: 18, border: bank.productId === recommendedId ? '2px solid #10b981' : '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{bank.bankName}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{bank.productName}</div>
                </div>
                {bank.productId === recommendedId && <Tag color="#10b981">Recommended</Tag>}
              </div>
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#f8fafc', borderRadius: 14, padding: 12 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>Rate</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#5C039B' }}>{bank.rate}%</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 14, padding: 12 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>EMI</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{formatCurrency(bank.emi)}</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 14, padding: 12 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>DBR</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{bank.dbr}%</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 14, padding: 12 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>LTV</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{bank.ltv}%</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card style={{ borderRadius: 20, border: '1px solid #e5e7eb' }} styles={{ body: { padding: 24 } }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Cover Note</div>
            <TextArea
              rows={5}
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="Write a message to the customer about the proposal"
              style={{ borderRadius: 16 }}
            />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Internal Notes</div>
            <TextArea
              rows={4}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Notes for your internal review only"
              style={{ borderRadius: 16 }}
            />
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8f5ff', padding: 24 }}>
      <Card style={{ borderRadius: 20, border: '1px solid #ede9ff', marginBottom: 24 }} styles={{ body: { padding: 24 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Create Proposal</div>
            <div style={{ color: '#64748b' }}>Build a customer proposal in three steps: select a lead, choose eligible banks, then review and submit.</div>
          </div>
          <Button
            type="default"
            onClick={() => navigate(`${basePath}/proposals`)}
            style={{ borderRadius: 10 }}
          >
            Back to proposals
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: 20, border: '1px solid #ede9ff', padding: 24 }}>
        <Steps current={step} labelPlacement="vertical" style={{ marginBottom: 32 }}>
          <Steps.Step title="Select Lead" description="Choose a qualified lead to build the proposal for." />
          <Steps.Step title="Eligible Banks" description="Review bank options and select up to three." />
          <Steps.Step title="Review & Notes" description="Confirm the proposal and submit it." />
        </Steps>

        <div style={{ minHeight: 420 }}>
          {step === 0 && (
            <div>
              {leadLoading ? (
                <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
              ) : selectedLead ? renderLeadSummary() : renderLeadSearch()}
            </div>
          )}

          {step === 1 && (
            <div>
              {renderBankStep()}
            </div>
          )}

          {step === 2 && <div>{renderReviewStep()}</div>}
        </div>

        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Button
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            disabled={step === 0}
            style={{ borderRadius: 10 }}
          >
            Back
          </Button>

          {step < 2 ? (
            <Button
              type="primary"
              onClick={() => {
                if (step === 0) {
                  if (!selectedLead) {
                    message.error('Select a qualified lead first.');
                    return;
                  }
                  const leadId = selectedLead._id || selectedLead.id;
                  setStep(1);
                  loadEligibleBanks(leadId);
                  return;
                }
                setStep((prev) => Math.min(prev + 1, 2));
              }}
              style={{ borderRadius: 10, background: '#5C039B', borderColor: '#5C039B' }}
            >
              Next
            </Button>
          ) : (
            <Button
              type="primary"
              loading={submitting}
              onClick={handleCreate}
              disabled={selectedBanks.length === 0}
              style={{ borderRadius: 10, background: '#5C039B', borderColor: '#5C039B' }}
            >
              Create Proposal
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreateProposal;
