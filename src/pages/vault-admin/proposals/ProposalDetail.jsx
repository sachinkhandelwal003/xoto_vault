import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from "@/api/apiService";
import {
  Button, Spin, message, Modal, Form, Input, Select,
  Tag, Avatar, Row, Col, Divider,
} from 'antd';
import {
  ArrowLeftOutlined, BankOutlined, UserOutlined,
  MailOutlined, StarFilled, SendOutlined,
  CheckCircleOutlined, CloseCircleOutlined, FilePdfOutlined,
  LockOutlined, FileTextOutlined, HomeOutlined,
  InfoCircleOutlined, ThunderboltOutlined, WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const P   = '#5C039B';
const PL  = '#f5f0ff';
const GN  = '#059669';
const GNL = '#ecfdf5';
const AM  = '#d97706';
const AML = '#fffbeb';
const RD  = '#dc2626';
const BL  = '#2563eb';
const BLL = '#eff6ff';

const { TextArea } = Input;

const STATUS_CFG = {
  Draft:    { bg: '#f1f5f9', color: '#64748b' },
  Sent:     { bg: BLL,       color: BL        },
  Viewed:   { bg: AML,       color: AM        },
  Accepted: { bg: GNL,       color: GN        },
  Rejected: { bg: '#fef2f2', color: RD        },
  Expired:  { bg: '#fff7ed', color: '#ea580c' },
};

const DBR_STYLE = {
  Eligible:   { bg: GNL, color: GN },
  Borderline: { bg: AML, color: AM },
  Ineligible: { bg: '#fef2f2', color: RD },
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{value || '—'}</span>
  </div>
);

/* ── Single Bank comparison card ────────────────────────────────── */
const BankCompareCard = ({ bank, style }) => {
  const dbr = bank.dbrBreakdown || {};
  const dbrStyle = DBR_STYLE[dbr.dbrStatus] || DBR_STYLE.Eligible;

  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${bank.isRecommended ? GN : '#e5e7eb'}`,
      borderRadius: 20, padding: 24, position: 'relative',
      boxShadow: bank.isRecommended ? `0 4px 24px ${GN}25` : '0 2px 8px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      ...style,
    }} className="hover-card">
      <div>
        {bank.isRecommended && (
          <div style={{
            position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
            background: GN, color: '#fff', padding: '3px 16px',
            borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', zIndex: 1,
          }}>
            <StarFilled style={{ marginRight: 4 }} />Recommended
          </div>
        )}

        {/* Bank header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {bank.bankLogo ? (
            <img src={bank.bankLogo} alt={bank.bankName}
              style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 10, border: '1px solid #f0f0f0', background: '#fafafa', padding: 4 }}
              onError={e => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <Avatar size={48} icon={<BankOutlined />} style={{ background: PL, color: P }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{bank.bankName}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{bank.productName}</div>
            <Tag style={{ background: bank.mortgageType === 'Islamic' ? GNL : BLL, color: bank.mortgageType === 'Islamic' ? GN : BL, border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, marginTop: 4 }}>
              {bank.mortgageType}
            </Tag>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: P, lineHeight: 1 }}>{bank.snapshotRate}%</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{bank.snapshotRateType}</div>
          </div>
        </div>

        {/* EMI hero */}
        <div style={{ background: PL, borderRadius: 14, padding: '14px 16px', marginBottom: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Monthly EMI</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: P }}>AED {bank.snapshotEMI?.toLocaleString()}</div>
        </div>

        {/* DBR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>DBR</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>{dbr.dbrPercentage ?? bank.dbr}%</span>
            <Tag style={{ background: dbrStyle.bg, color: dbrStyle.color, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 10, margin: 0 }}>
              {dbr.dbrStatus || 'Eligible'}
            </Tag>
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Fees grid */}
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          {[
            { label: 'Processing Fee',  val: `AED ${(bank.snapshotProcessingFee || 0).toLocaleString()}` },
            { label: 'Valuation Fee',   val: `AED ${(bank.snapshotValuationFee || 0).toLocaleString()}`  },
            { label: 'Pre-Approval',    val: bank.snapshotPreApprovalFee ? `AED ${bank.snapshotPreApprovalFee.toLocaleString()}` : 'Free' },
            { label: 'Max LTV',         val: `${bank.maxLTV}%` },
            { label: 'Loan LTV',        val: `${bank.snapshotLTV}%` },
            { label: 'Follow-on Rate',  val: bank.snapshotFollowOnRate || '—' },
          ].map(({ label, val }) => (
            <Col span={12} key={label}>
              <div style={{ background: '#f9f8ff', borderRadius: 10, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 12 }}>{val}</div>
              </div>
            </Col>
          ))}
        </Row>

        {/* Insurance */}
        {(bank.lifeInsurance?.value || bank.propertyInsurance?.value) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {bank.lifeInsurance?.value && (
              <Tag style={{ background: GNL, color: GN, border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 600 }}>
                Life: AED {bank.lifeInsurance.value.toLocaleString()}/{bank.lifeInsurance.frequency}
              </Tag>
            )}
            {bank.propertyInsurance?.value && (
              <Tag style={{ background: BLL, color: BL, border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 600 }}>
                Prop: AED {bank.propertyInsurance.value.toLocaleString()}/{bank.propertyInsurance.frequency}
              </Tag>
            )}
          </div>
        )}

        {/* Key features */}
        {bank.keyFeatures?.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Key Features</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {bank.keyFeatures.map((f, i) => (
                <div key={i} style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <CheckCircleOutlined style={{ color: GN, fontSize: 11, marginTop: 1, flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {bank.salaryTransferRequired && (
        <div style={{ fontSize: 11, color: AM, fontWeight: 600, marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <WarningOutlined /> Salary transfer required
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════ MAIN ══════════════════════════════ */
const ProposalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const roleCode = typeof user?.role === 'object' ? String(user.role.code) : String(user?.role);

  const basePath = roleCode === '21'
    ? '/dashboard/vaultpartner/proposals'
    : roleCode === '22'
    ? '/dashboard/vaultagent/proposals'
    : roleCode === '18'
    ? '/dashboard/vault-admin/proposals'
    : '/dashboard/vault-advisor/proposals';

  const [proposal, setProposal]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('banks');

  /* Send modal */
  const [sendOpen, setSendOpen]       = useState(false);
  const [sendForm]                    = Form.useForm();
  const [sending, setSending]         = useState(false);

  /* Preference modal */
  const [prefOpen, setPrefOpen]       = useState(false);
  const [prefForm]                    = Form.useForm();
  const [savingPref, setSavingPref]   = useState(false);

  /* Reject modal */
  const [rejectOpen, setRejectOpen]   = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting]     = useState(false);

  /* PDF viewer modal */
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const fetchProposal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(`/vault/proposals/${id}`);
      setProposal(res?.data || res);
    } catch {
      message.error('Failed to load proposal');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProposal(); }, [fetchProposal]);

  /* ── handlers ── */
  const handleSend = async () => {
    const vals = await sendForm.validateFields();
    setSending(true);
    try {
      await apiService.post(`/vault/proposals/${id}/send`, {
        email: vals.email,
        customerName: vals.customerName,
      });
      message.success(`Proposal sent to ${vals.email}`);
      setSendOpen(false);
      fetchProposal();
    } catch { message.error('Failed to send proposal'); }
    finally { setSending(false); }
  };

  const handlePreference = async () => {
    const vals = await prefForm.validateFields();
    const bank = proposal.selectedBanks.find(b => b.productId === vals.productId);
    setSavingPref(true);
    try {
      await apiService.put(`/vault/proposals/${id}/preference`, {
        bankId: bank?.bankId?._id || bank?.bankId || bank?.bankId,
        bankName: bank?.bankName,
        productId: vals.productId,
        feedbackNote: vals.feedbackNote,
      });
      message.success('Customer preference recorded');
      setPrefOpen(false);
      fetchProposal();
    } catch { message.error('Failed to save preference'); }
    finally { setSavingPref(false); }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await apiService.put(`/vault/proposals/${id}/reject`, { reason: rejectReason });
      message.success('Proposal marked as rejected');
      setRejectOpen(false);
      fetchProposal();
    } catch { message.error('Failed to reject proposal'); }
    finally { setRejecting(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f9f8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Spin size="large" />
      <div style={{ color: P, fontWeight: 600 }}>Loading proposal…</div>
    </div>
  );

  if (!proposal) return (
    <div style={{ minHeight: '100vh', background: '#f9f8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#475569', marginBottom: 16 }}>Proposal not found</div>
        <Button onClick={() => navigate(`${basePath}/list`)} style={{ borderRadius: 10 }}>Back to List</Button>
      </div>
    </div>
  );

  const {
    proposalReference, status, selectedBanks = [], bankComparison = {},
    customerSnapshot = {}, propertySnapshot = {}, coverNote, internalNotes,
    pdf = {}, customerPreference = {}, validUntil, createdAt, createdBy,
    leadId,
  } = proposal;

  const statusCfg = STATUS_CFG[status] || STATUS_CFG.Draft;
  const customerName = customerSnapshot.fullName ||
    leadId?.customerInfo?.fullName ||
    `${leadId?.customerInfo?.firstName || ''} ${leadId?.customerInfo?.lastName || ''}`.trim() ||
    '—';

  /* ── Tab: Bank Comparison ── */
  const BanksTab = () => (
    <div>
      {/* Comparison summary */}
      {(bankComparison.bestRate || bankComparison.lowestEMI) && (
        <Row gutter={[12, 12]} style={{ marginBottom: 28 }}>
          {[
            { label: 'Best Rate',       value: `${bankComparison.bestRate}%`,                      sub: bankComparison.bestRateBank,   color: P,  bg: PL  },
            { label: 'Lowest EMI',      value: `AED ${bankComparison.lowestEMI?.toLocaleString()}`, sub: bankComparison.lowestEMIBank,  color: BL, bg: BLL },
            { label: 'Lowest Fees',     value: bankComparison.lowestFeesBank,                       sub: 'Cheapest upfront',            color: GN, bg: GNL },
            { label: 'Recommended',     value: bankComparison.recommendedBank,                      sub: 'Advisor choice',              color: AM, bg: AML },
          ].map(({ label, value, sub, color, bg }) => (
            <Col span={6} key={label}>
              <div style={{ background: bg, borderRadius: 16, padding: '14px 16px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} className="hover-card">
                <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color, lineHeight: 1.2 }}>{value || '—'}</div>
                {sub && <div style={{ fontSize: 10, color, opacity: 0.7, marginTop: 3 }}>{sub}</div>}
              </div>
            </Col>
          ))}
        </Row>
      )}

      <Row gutter={[16, 16]} style={{ display: 'flex', alignItems: 'stretch', marginTop: 14 }}>
        {selectedBanks.map((bank, i) => (
          <Col xs={24} md={12} lg={8} key={i} style={{ display: 'flex' }}>
            <BankCompareCard bank={bank} style={{ flex: 1, marginTop: 0 }} />
          </Col>
        ))}
      </Row>

      {/* Notes */}
      {(coverNote || internalNotes) && (
        <Row gutter={[16, 16]} style={{ marginTop: 24, display: 'flex', alignItems: 'stretch' }}>
          {coverNote && (
            <Col xs={24} md={12} style={{ display: 'flex' }}>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ede9ff', padding: 20, flex: 1 }} className="hover-card">
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 10, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileTextOutlined style={{ color: P }} /> Cover Note
                </div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{coverNote}</div>
              </div>
            </Col>
          )}
          {internalNotes && (
            <Col xs={24} md={12} style={{ display: 'flex' }}>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ede9ff', padding: 20, flex: 1 }} className="hover-card">
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 10, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LockOutlined style={{ color: AM }} /> Internal Notes
                </div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{internalNotes}</div>
              </div>
            </Col>
          )}
        </Row>
      )}
    </div>
  );

  /* ── Tab: Customer Info ── */
  const CustomerTab = () => (
    <Row gutter={[16, 16]} style={{ display: 'flex', alignItems: 'stretch' }}>
      <Col xs={24} md={12} style={{ display: 'flex' }}>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #ede9ff', padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }} className="hover-card">
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined style={{ color: P }} /> Customer Details
          </div>
          <InfoRow label="Full Name"         value={customerSnapshot.fullName} />
          <InfoRow label="Email"             value={customerSnapshot.email} />
          <InfoRow label="Mobile"            value={customerSnapshot.mobile} />
          <InfoRow label="Nationality"       value={customerSnapshot.nationality} />
          <InfoRow label="Residency"         value={customerSnapshot.residencyStatus} />
          <InfoRow label="Employment"        value={customerSnapshot.employmentStatus} />
          <InfoRow label="Monthly Salary"    value={customerSnapshot.monthlySalary ? `AED ${customerSnapshot.monthlySalary.toLocaleString()}` : null} />
          <InfoRow label="Total Income"      value={customerSnapshot.totalMonthlyIncome ? `AED ${customerSnapshot.totalMonthlyIncome.toLocaleString()}` : null} />
          <InfoRow label="Monthly Debt"      value={customerSnapshot.totalMonthlyDebt ? `AED ${customerSnapshot.totalMonthlyDebt.toLocaleString()}` : 'None'} />
        </div>
      </Col>
      <Col xs={24} md={12} style={{ display: 'flex' }}>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #ede9ff', padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }} className="hover-card">
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HomeOutlined style={{ color: P }} /> Property Details
          </div>
          <InfoRow label="Property Value"    value={`AED ${(propertySnapshot.propertyValue || 0).toLocaleString()}`} />
          <InfoRow label="Loan Required"     value={`AED ${(propertySnapshot.loanAmountRequired || 0).toLocaleString()}`} />
          <InfoRow label="Down Payment"      value={`AED ${(propertySnapshot.downPaymentAmount || 0).toLocaleString()}`} />
          <InfoRow label="LTV"               value={`${propertySnapshot.ltvPercentage || 0}%`} />
          <InfoRow label="Tenure"            value={`${propertySnapshot.tenureYears || 25} Years`} />
          <InfoRow label="Transaction Type"  value={propertySnapshot.transactionType} />
          <InfoRow label="City"              value={propertySnapshot.propertyAddress?.city} />
          <InfoRow label="Property Type"     value={propertySnapshot.propertyType} />
        </div>
      </Col>
    </Row>
  );

  /* ── Tab: PDF & Status ── */
  const StatusTab = () => (
    <Row gutter={[16, 16]} style={{ display: 'flex', alignItems: 'stretch' }}>
      <Col xs={24} md={14} style={{ display: 'flex' }}>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #ede9ff', padding: 28, flex: 1 }} className="hover-card">
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <InfoCircleOutlined style={{ color: P }} /> Proposal Status
          </div>

          {/* Current status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, background: statusCfg.bg, borderRadius: 14, padding: '16px 20px' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Current Status</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: statusCfg.color }}>{status}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Valid Until</div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{dayjs(validUntil).format('DD MMM YYYY')}</div>
              {proposal.isExpired && <div style={{ fontSize: 10, color: RD, fontWeight: 700 }}>EXPIRED</div>}
            </div>
          </div>

          {/* Send info */}
          {pdf.sentAt && (
            <div style={{ background: BLL, borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: BL, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MailOutlined /> Sent to Customer
                </span>
                {pdf.pdfUrl && (
                  <Button
                    size="small"
                    icon={<FilePdfOutlined />}
                    onClick={() => setPdfModalOpen(true)}
                    style={{ borderRadius: 8, fontWeight: 700, color: BL, borderColor: BL, background: '#fff', fontSize: 12 }}
                  >
                    View PDF
                  </Button>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#0f172a' }}>{pdf.sentToEmail}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {dayjs(pdf.sentAt).format('DD MMM YYYY, HH:mm')}
                {pdf.resendCount > 0 && ` · Resent ${pdf.resendCount} time(s)`}
              </div>
            </div>
          )}

          {/* Customer preference */}
          {customerPreference.preferredBankName && (
            <div style={{ background: GNL, borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: GN, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircleOutlined /> Customer Preference Recorded
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{customerPreference.preferredBankName}</div>
              {customerPreference.feedbackNote && (
                <div style={{ fontSize: 12, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>"{customerPreference.feedbackNote}"</div>
              )}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {dayjs(customerPreference.recordedAt).format('DD MMM YYYY')}
              </div>
            </div>
          )}

          {/* Proposal meta */}
          <div>
            <InfoRow label="Reference"   value={proposalReference} />
            <InfoRow label="Created By"  value={createdBy?.userName} />
            <InfoRow label="Created At"  value={dayjs(createdAt).format('DD MMM YYYY, HH:mm')} />
            <InfoRow label="Banks Count" value={selectedBanks.length} />
            <InfoRow label="PDF"         value={pdf.pdfUrl ? 'Generated ✓' : 'Not yet generated'} />
          </div>
        </div>
      </Col>

      <Col xs={24} md={10} style={{ display: 'flex' }}>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #ede9ff', padding: 24, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }} className="hover-card">
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ color: AM }} /> Actions
          </div>

          {/* View PDF — only when generated */}
          {pdf.pdfUrl && (
            <Button
              icon={<FilePdfOutlined />}
              size="large"
              block
              onClick={() => setPdfModalOpen(true)}
              style={{ borderRadius: 12, fontWeight: 700, height: 46, borderColor: BL, color: BL, background: BLL }}
            >
              View Proposal PDF
            </Button>
          )}

          {/* Send / Resend PDF — same API for both */}
          {(status === 'Draft' || status === 'Sent') && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="large"
              block
              onClick={() => {
                sendForm.setFieldsValue({
                  email: customerSnapshot.email || '',
                  customerName: customerSnapshot.fullName || customerName,
                });
                setSendOpen(true);
              }}
              style={{ background: P, borderColor: P, borderRadius: 12, fontWeight: 700, height: 46 }}
            >
              {status === 'Sent' ? 'Resend PDF to Customer' : 'Send PDF to Customer'}
            </Button>
          )}

          {/* Record preference */}
          {(status === 'Sent' || status === 'Viewed') && !customerPreference.preferredBankName && (
            <Button
              icon={<CheckCircleOutlined />}
              size="large"
              block
              onClick={() => setPrefOpen(true)}
              style={{ borderRadius: 12, fontWeight: 700, height: 46, borderColor: GN, color: GN }}
            >
              Record Customer Preference
            </Button>
          )}

          {/* Reject */}
          {status !== 'Rejected' && status !== 'Expired' && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              size="large"
              block
              onClick={() => setRejectOpen(true)}
              style={{ borderRadius: 12, fontWeight: 700, height: 46 }}
            >
              Mark as Rejected
            </Button>
          )}

          <Divider style={{ margin: '4px 0' }} />

          <Button
            size="large"
            block
            onClick={() => navigate(`${basePath}/create?leadId=${leadId?._id || leadId?.id || leadId}`)}
            style={{ borderRadius: 12, fontWeight: 700, height: 46, borderColor: '#e5e7eb' }}
          >
            Create New Proposal for Same Lead
          </Button>
        </div>
      </Col>
    </Row>
  );

  return (
    <div style={{ background: '#f9f8ff', minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #5C039B 0%, #03A4F4 100%)', padding: '24px 32px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`${basePath}/list`)}
              style={{ color: '#fff' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#fff' }}>{proposalReference}</h1>
                <span style={{
                  background: statusCfg.bg, color: statusCfg.color,
                  padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                }}>{status}</span>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                {customerName} · {selectedBanks.length} bank{selectedBanks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 16 }}>
            {bankComparison.bestRate && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Best Rate</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{bankComparison.bestRate}%</div>
              </div>
            )}
            {bankComparison.lowestEMI && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Lowest EMI</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>AED {bankComparison.lowestEMI?.toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Tabs */}
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { key: 'banks', label: 'Bank Comparison', icon: <BankOutlined /> },
            { key: 'customer', label: 'Customer Info', icon: <UserOutlined /> },
            { key: 'status', label: 'PDF & Status', icon: <FileTextOutlined /> },
          ].map(t => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={isActive ? 'tab-btn tab-btn-active' : 'tab-btn'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  borderRadius: 14,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                  background: isActive ? P : '#fff',
                  color: isActive ? '#fff' : '#64748b',
                  boxShadow: isActive ? `0 4px 14px ${P}30` : '0 2px 8px rgba(0,0,0,0.05)',
                  border: `1px solid ${isActive ? P : '#ede9ff'}`,
                }}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: 12 }}>
          {activeTab === 'banks' && <BanksTab />}
          {activeTab === 'customer' && <CustomerTab />}
          {activeTab === 'status' && <StatusTab />}
        </div>
      </div>

      {/* ── Send Modal ── */}
      <Modal
        title="Send PDF to Customer"
        open={sendOpen}
        onOk={handleSend}
        onCancel={() => setSendOpen(false)}
        confirmLoading={sending}
        okText="Send Now"
        okButtonProps={{ style: { background: P, borderColor: P } }}
      >
        <Form form={sendForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="customerName" label="Customer Name" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="Customer's full name" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="email" label="Customer Email" rules={[{ required: true }, { type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="customer@email.com" style={{ borderRadius: 10 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Preference Modal ── */}
      <Modal
        title="Record Customer Preference"
        open={prefOpen}
        onOk={handlePreference}
        onCancel={() => setPrefOpen(false)}
        confirmLoading={savingPref}
        okText="Save Preference"
        okButtonProps={{ style: { background: GN, borderColor: GN } }}
      >
        <Form form={prefForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="productId" label="Preferred Bank" rules={[{ required: true, message: 'Please select a bank' }]}>
            <Select placeholder="Select the bank customer prefers" style={{ borderRadius: 10 }}>
              {selectedBanks.map(b => (
                <Select.Option key={b.productId} value={b.productId}>
                  {b.bankName} — {b.productName} ({b.snapshotRate}%)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="feedbackNote" label="Customer Feedback Note">
            <TextArea rows={3} placeholder="Any feedback or notes from the customer..." style={{ borderRadius: 10 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal
        title="Mark Proposal as Rejected"
        open={rejectOpen}
        onOk={handleReject}
        onCancel={() => { setRejectOpen(false); setRejectReason(''); }}
        confirmLoading={rejecting}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
            This will mark the proposal as Rejected. This action cannot be undone.
          </div>
          <TextArea
            rows={3}
            placeholder="Reason for rejection (optional)..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            style={{ borderRadius: 10 }}
          />
        </div>
      </Modal>

      {/* ── PDF Viewer Modal ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FilePdfOutlined style={{ color: RD, fontSize: 18 }} />
            <span style={{ fontWeight: 700 }}>{proposalReference} — Proposal PDF</span>
          </div>
        }
        open={pdfModalOpen}
        onCancel={() => setPdfModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPdfModalOpen(false)}>Close</Button>,
          <Button
            key="resend"
            type="primary"
            icon={<SendOutlined />}
            onClick={() => {
              setPdfModalOpen(false);
              sendForm.setFieldsValue({
                email: customerSnapshot.email || '',
                customerName: customerSnapshot.fullName || customerName,
              });
              setSendOpen(true);
            }}
            style={{ background: P, borderColor: P }}
          >
            {status === 'Sent' ? 'Resend to Customer' : 'Send to Customer'}
          </Button>,
        ]}
        width="85vw"
        style={{ top: 20 }}
        bodyStyle={{ padding: '12px 0 0', height: '80vh' }}
        centered={false}
      >
        {pdf.pdfUrl ? (
          <iframe
            src={pdf.pdfUrl}
            title="Proposal PDF"
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>
            PDF not yet generated. Send the proposal first.
          </div>
        )}
      </Modal>

      <style>{`
        .hover-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(92, 3, 155, 0.08) !important;
          border-color: ${P}80 !important;
        }
        .tab-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab-btn:hover {
          background: #f7f2ff !important;
          color: ${P} !important;
          border-color: ${P}50 !important;
        }
        .tab-btn-active:hover {
          background: ${P} !important;
          color: #fff !important;
          border-color: ${P} !important;
          box-shadow: 0 4px 14px ${P}40 !important;
        }
      `}</style>
    </div>
  );
};

export default ProposalDetail;

