import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from '@/api/apiService';
import {
  Row,
  Col,
  Card,
  Tabs,
  Button,
  Tag,
  Descriptions,
  Modal,
  Input,
  Typography,
  message,
  Spin,
  Statistic,
  Select,
  Space,
} from 'antd';
import {
  ArrowLeftOutlined,
  StarFilled,
  MailOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import buildProposalHTML from '@/utils/proposalPDF';

const { TextArea } = Input;
const { Title, Text } = Typography;

const STATUS_TAG_COLOR = {
  Draft: 'default',
  Sent: 'processing',
  Accepted: 'success',
  Rejected: 'error',
  Expired: 'warning',
};

const ProposalDetail = () => {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [preferenceModalOpen, setPreferenceModalOpen] = useState(false);
  const [preferredProductId, setPreferredProductId] = useState(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [prefSubmitting, setPrefSubmitting] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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
    if (!proposalId) return;
    fetchProposal();
  }, [proposalId]);

  const fetchProposal = async () => {
    setLoading(true);
    try {
      const result = await apiService.get(`/vault/proposals/${proposalId}`);
      const data = result?.data ?? result;
      setProposal(data);
      setEmailAddress(data?.customerSnapshot?.email || data?.leadId?.customerInfo?.email || '');
      // prepare preview HTML if there's no hosted PDF URL
      try {
        if (!data?.pdf?.pdfUrl) {
          const html = buildProposalHTML(data);
          setPreviewHtml(html);
        } else {
          setPreviewHtml('');
        }
      } catch (err) {
        setPreviewHtml('');
      }
    } catch (error) {
      message.error('Unable to load proposal details.');
    } finally {
      setLoading(false);
    }
  };

  const selectedBanks = proposal?.selectedBanks || [];
  const recommendedBank = selectedBanks.find((bank) => bank.isRecommended);
  const customerName = proposal?.customerSnapshot?.fullName
    || proposal?.leadId?.customerInfo?.fullName
    || 'Customer';

  const sendProposal = async () => {
    if (!emailAddress) {
      message.error('Enter customer email address.');
      return;
    }
    setSendingEmail(true);
    try {
      await apiService.post(`/vault/proposals/${proposalId}/send`, {
        email: emailAddress,
        customerName,
      });
      message.success(`Proposal sent to ${emailAddress}`);
      setEmailModalOpen(false);
      fetchProposal();
    } catch (error) {
      message.error('Failed to send proposal.');
    } finally {
      setSendingEmail(false);
    }
  };

  const resendProposal = async () => {
    const to = proposal?.pdf?.sentToEmail || proposal?.customerSnapshot?.email || emailAddress;
    if (!to) {
      message.error('No email available to resend to.');
      return;
    }
    setSendingEmail(true);
    try {
      // Reuse send endpoint to resend (server should treat as resend)
      await apiService.post(`/vault/proposals/${proposalId}/send`, { email: to, customerName });
      message.success(`Proposal resent to ${to}`);
      fetchProposal();
    } catch (err) {
      message.error('Failed to resend proposal.');
    } finally {
      setSendingEmail(false);
    }
  };

  const savePreference = async () => {
    if (!preferredProductId) {
      message.error('Choose a bank to record preference.');
      return;
    }
    const bank = selectedBanks.find((item) => item.productId === preferredProductId);
    if (!bank) {
      message.error('Selected bank is not valid.');
      return;
    }
    setPrefSubmitting(true);
    try {
      await apiService.put(`/vault/proposals/${proposalId}/preference`, {
        bankId: bank.bankId?._id || bank.bankId,
        bankName: bank.bankName,
        productId: bank.productId,
        feedbackNote: feedbackNote.trim(),
      });
      message.success('Customer preference recorded successfully.');
      setPreferenceModalOpen(false);
      setFeedbackNote('');
      fetchProposal();
    } catch (error) {
      message.error('Unable to record preference.');
    } finally {
      setPrefSubmitting(false);
    }
  };

  const rejectProposal = async () => {
    if (!rejectReason.trim()) {
      message.error('Enter rejection reason.');
      return;
    }
    try {
      await apiService.put(`/vault/proposals/${proposalId}/reject`, {
        reason: rejectReason.trim(),
      });
      message.success('Proposal marked rejected.');
      setRejectModalOpen(false);
      setRejectReason('');
      fetchProposal();
    } catch (error) {
      message.error('Failed to reject proposal.');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8f5ff' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div style={{ minHeight: '100vh', padding: 24, background: '#f8f5ff' }}>
        <Card style={{ borderRadius: 20 }} bodyStyle={{ padding: 24 }}>
          <Text>Proposal details are unavailable.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f5ff', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`${basePath}/proposals`)} style={{ color: '#5C039B', paddingLeft: 0 }} />
          <Title level={2} style={{ margin: '8px 0 6px', color: '#141827' }}>Proposal Details</Title>
          <Text type="secondary">Review bank comparison, customer information, and send actions for this proposal.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Tag color={STATUS_TAG_COLOR[proposal.status] || 'default'} style={{ borderRadius: 999, fontWeight: 700, padding: '8px 16px' }}>
            {proposal.status}
          </Tag>
          {proposal.status === 'Draft' && (
            <Button type="primary" icon={<MailOutlined />} style={{ borderRadius: 10, background: '#5C039B', borderColor: '#5C039B' }} onClick={() => setEmailModalOpen(true)}>
              Send PDF to Customer
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultActiveKey="1" items={[
        {
          key: '1',
          label: 'Bank Comparison',
          children: (
            <div style={{ display: 'grid', gap: 24 }}>
              <Card style={{ borderRadius: 20, border: '1px solid #e5e7eb' }} bodyStyle={{ padding: 24 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Best Rate" value={proposal.bankComparison?.bestRate ?? '—'} suffix="%" valueStyle={{ color: '#5C039B' }} />
                    <Text type="secondary">{proposal.bankComparison?.bestRateBank || '—'}</Text>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Lowest EMI" value={proposal.bankComparison?.lowestEMI ?? '—'} prefix="AED" valueStyle={{ color: '#10b981' }} />
                    <Text type="secondary">{proposal.bankComparison?.lowestEMIBank || '—'}</Text>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Lowest Fees" value={proposal.bankComparison?.lowestFeesBank ? proposal.bankComparison?.lowestFeesBank : '—'} valueStyle={{ color: '#f59e0b' }} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderRadius: 16, border: '1px solid #d1fae5', background: '#ecfdf5' }}>
                      <Space align="center">
                        <StarFilled style={{ color: '#10b981', fontSize: 18 }} />
                        <div>
                          <div style={{ fontWeight: 700 }}>Recommended bank</div>
                          <div style={{ color: '#475569' }}>{proposal.bankComparison?.recommendedBank || '—'}</div>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Card>

              <Row gutter={[20, 20]}>
                {selectedBanks.map((bank) => {
                  const isRecommended = bank.productId === recommendedBank?.productId;
                  return (
                    <Col xs={24} md={12} lg={8} key={bank.productId}>
                      <Card
                        style={{
                          borderRadius: 20,
                          border: isRecommended ? '2px solid #10b981' : '1px solid #e5e7eb',
                          background: '#fff',
                        }}
                        bodyStyle={{ padding: 24 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{bank.bankName}</div>
                            <Text type="secondary">{bank.productName}</Text>
                          </div>
                          {isRecommended && (
                            <Tag color="#10b981" style={{ borderRadius: 999, fontWeight: 700 }}>Recommended</Tag>
                          )}
                        </div>
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Interest Rate</div>
                          <div style={{ fontSize: 28, color: '#5C039B', fontWeight: 900 }}>{bank.snapshotRate?.toFixed(2)}%</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{bank.snapshotRateType}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                          <div style={{ background: '#f8fafc', borderRadius: 14, padding: 14 }}>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>EMI</div>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>AED {bank.snapshotEMI?.toLocaleString()}</div>
                          </div>
                          <div style={{ background: '#f8fafc', borderRadius: 14, padding: 14 }}>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>DBR</div>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>{bank.dbrBreakdown?.dbrPercentage ?? bank.dbr}%</div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                            <span>Max LTV</span><span>{bank.snapshotLTV ?? bank.ltv}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                            <span>Processing fee</span><span>AED {bank.snapshotProcessingFee?.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                            <span>Valuation fee</span><span>AED {bank.snapshotValuationFee?.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                            <span>Insurance</span><span>AED {(bank.lifeInsurance?.value ?? 0) + (bank.propertyInsurance?.value ?? 0)}</span>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          ),
        },
        {
          key: '2',
          label: 'Customer Info',
          children: (
            <div style={{ display: 'grid', gap: 24 }}>
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card style={{ borderRadius: 20, border: '1px solid #e5e7eb' }} bodyStyle={{ padding: 24 }}>
                    <Title level={4} style={{ marginBottom: 20, color: '#0f172a' }}>Customer Details</Title>
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Full Name">{customerName}</Descriptions.Item>
                      <Descriptions.Item label="Email">{proposal.customerSnapshot?.email || proposal.leadId?.customerInfo?.email || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Mobile">{proposal.customerSnapshot?.mobile || proposal.leadId?.customerInfo?.mobileNumber || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Nationality">{proposal.customerSnapshot?.nationality || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Residency">{proposal.customerSnapshot?.residencyStatus || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Monthly Salary">AED {proposal.customerSnapshot?.monthlySalary?.toLocaleString() || '0'}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card style={{ borderRadius: 20, border: '1px solid #e5e7eb' }} bodyStyle={{ padding: 24 }}>
                    <Title level={4} style={{ marginBottom: 20, color: '#0f172a' }}>Property Snapshot</Title>
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="City">{proposal.propertySnapshot?.propertyAddress?.city || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Property Value">AED {proposal.propertySnapshot?.propertyValue?.toLocaleString() || '0'}</Descriptions.Item>
                      <Descriptions.Item label="Loan Required">AED {proposal.propertySnapshot?.loanAmountRequired?.toLocaleString() || '0'}</Descriptions.Item>
                      <Descriptions.Item label="LTV">{proposal.propertySnapshot?.ltvPercentage ?? '—'}%</Descriptions.Item>
                      <Descriptions.Item label="Tenure">{proposal.propertySnapshot?.tenureYears || '—'} years</Descriptions.Item>
                      <Descriptions.Item label="Transaction">{proposal.propertySnapshot?.transactionType || '—'}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
            </div>
          ),
        },
        {
          key: '3',
          label: 'PDF & Status',
          children: (
            <div style={{ display: 'grid', gap: 24 }}>
              <Card style={{ borderRadius: 20, border: '1px solid #e5e7eb' }} bodyStyle={{ padding: 24 }}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <Title level={4} style={{ marginBottom: 20, color: '#0f172a' }}>Proposal Status</Title>
                    <Space direction="vertical" size={12}>
                      <Tag color={STATUS_TAG_COLOR[proposal.status] || 'default'} style={{ borderRadius: 999, fontWeight: 700, padding: '8px 16px' }}>
                        {proposal.status}
                      </Tag>
                      {proposal.pdf?.sentToEmail && (
                        <div><Text strong>Sent to:</Text> {proposal.pdf.sentToEmail}</div>
                      )}
                      {proposal.pdf?.sentAt && (
                        <div><Text strong>Sent at:</Text> {dayjs(proposal.pdf.sentAt).format('DD MMM YYYY, HH:mm')}</div>
                      )}
                      {proposal.pdf?.pdfUrl ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <Button type="default" onClick={() => window.open(proposal.pdf.pdfUrl, '_blank')} style={{ borderRadius: 10 }}>Open PDF</Button>
                          <Button type="default" onClick={resendProposal} loading={sendingEmail} style={{ borderRadius: 10 }}>Resend</Button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <Button type="primary" onClick={() => setEmailModalOpen(true)} style={{ borderRadius: 10, background: '#5C039B', borderColor: '#5C039B' }}>Send PDF to Customer</Button>
                        </div>
                      )}
                    </Space>
                  </Col>
                  <Col xs={24} md={12}>
                    <Title level={4} style={{ marginBottom: 20, color: '#0f172a' }}>Actions</Title>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {proposal.status === 'Draft' && (
                        null
                      )}
                      <Button
                        type="default"
                        icon={<CheckCircleOutlined />}
                        onClick={() => setPreferenceModalOpen(true)}
                        style={{ borderRadius: 10 }}
                      >
                        Record Customer Preference
                      </Button>
                      {proposal.status !== 'Rejected' && (
                        <Button
                          danger
                          icon={<ExclamationCircleOutlined />}
                          onClick={() => setRejectModalOpen(true)}
                          style={{ borderRadius: 10 }}
                        >
                          Mark Rejected
                        </Button>
                      )}
                    </Space>
                  </Col>
                </Row>
              </Card>

              {/* Preview area: if PDF URL available show embedded PDF, otherwise render generated HTML preview */}
              <Card style={{ borderRadius: 20, border: '1px solid #e5e7eb' }} bodyStyle={{ padding: 0 }}>
                <div style={{ minHeight: 480 }}>
                  {proposal.pdf?.pdfUrl ? (
                    <iframe title="proposal-pdf" src={proposal.pdf.pdfUrl} style={{ width: '100%', height: 560, border: 'none' }} />
                  ) : previewHtml ? (
                    <iframe title="proposal-preview" srcDoc={previewHtml} style={{ width: '100%', height: 560, border: 'none' }} />
                  ) : (
                    <div style={{ padding: 36, textAlign: 'center' }}><Text type="secondary">No preview available</Text></div>
                  )}
                </div>
                <div style={{ padding: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {proposal.pdf?.pdfUrl ? (
                    <Button onClick={resendProposal} loading={sendingEmail}>Resend</Button>
                  ) : (
                    <Button type="primary" onClick={() => setEmailModalOpen(true)} style={{ background: '#5C039B', borderColor: '#5C039B' }}>Send to Customer</Button>
                  )}
                </div>
              </Card>

              <Card style={{ borderRadius: 20, border: '1px solid #e5e7eb' }} bodyStyle={{ padding: 24 }}>
                <Title level={4} style={{ marginBottom: 16, color: '#0f172a' }}>Notes</Title>
                <div style={{ display: 'grid', gap: 18 }}>
                  <div>
                    <Text strong>Cover note</Text>
                    <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, marginTop: 10, minHeight: 86, whiteSpace: 'pre-wrap' }}>
                      {proposal.coverNote || 'No cover note available.'}
                    </div>
                  </div>
                  <div>
                    <Text strong>Internal notes</Text>
                    <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, marginTop: 10, minHeight: 86, whiteSpace: 'pre-wrap' }}>
                      {proposal.internalNotes || 'No internal notes available.'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ),
        },
      ]} />

      <Modal
        title="Send Proposal PDF"
        open={emailModalOpen}
        onCancel={() => setEmailModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setEmailModalOpen(false)}>Cancel</Button>,
          <Button key="send" type="primary" loading={sendingEmail} onClick={sendProposal} style={{ background: '#5C039B', borderColor: '#5C039B' }}>
            Send Email
          </Button>,
        ]}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <Text strong>Customer name</Text>
            <div>{customerName}</div>
          </div>
          <div>
            <Text strong>Email</Text>
            <Input value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} placeholder="client@example.com" />
          </div>
        </div>
      </Modal>

      <Modal
        title="Record Customer Preference"
        open={preferenceModalOpen}
        onCancel={() => setPreferenceModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setPreferenceModalOpen(false)}>Cancel</Button>,
          <Button key="save" type="primary" loading={prefSubmitting} onClick={savePreference} style={{ background: '#5C039B', borderColor: '#5C039B' }}>
            Save Preference
          </Button>,
        ]}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <Text strong>Choose preferred bank</Text>
            <Select
              style={{ width: '100%', marginTop: 10 }}
              placeholder="Select bank product"
              value={preferredProductId}
              onChange={(value) => setPreferredProductId(value)}
              options={selectedBanks.map((bank) => ({
                label: `${bank.bankName} — ${bank.productName}`,
                value: bank.productId,
              }))}
            />
          </div>
          <div>
            <Text strong>Feedback note</Text>
            <TextArea
              rows={4}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Customer prefers this bank because..."
              style={{ marginTop: 10 }}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Mark Proposal Rejected"
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setRejectModalOpen(false)}>Cancel</Button>,
          <Button key="reject" type="primary" danger loading={sendingEmail} onClick={rejectProposal}>
            Reject Proposal
          </Button>,
        ]}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <Text>Provide a brief reason why the customer rejected the proposal.</Text>
          <TextArea
            rows={5}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Customer decided not to proceed at this time..."
          />
        </div>
      </Modal>
    </div>
  );
};

export default ProposalDetail;
