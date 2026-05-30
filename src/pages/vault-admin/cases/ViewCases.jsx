// src/pages/Cases/ViewCases.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from "@/api/apiService";
import { fmtAED } from '@/utils/format';
import {
  Card, Button, Typography, Row, Col, Avatar,
  Tag, Divider, Spin, message, Badge,
  Pagination, Space, Modal, Tooltip, Alert, Progress,
  Upload, List, Image
} from 'antd';
import {
  UserOutlined, BankOutlined, FileTextOutlined,
  CalendarOutlined, HomeOutlined,
  DollarCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined, RocketOutlined,
  SendOutlined, TrophyOutlined, TeamOutlined, InfoCircleOutlined,
  FilePdfOutlined, DownloadOutlined, CloudUploadOutlined,
  DeleteOutlined, EyeOutlined, UploadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const THEME_COLOR = "#5C039B";
const SUCCESS_COLOR = "#10b981";

// Role slug mapping
const roleSlugMap = {
  '18': "vault-admin",
  '22': "vaultagent",
  '21': "vaultpartner",
  '23': "vault-ops",
  '26': "vault-advisor",
};

const ViewCases = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const roleSlug = roleSlugMap[user?.role?.code] ?? "vault-advisor";

  // --- STATE ---
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Document Upload Modal
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  
  // Submit Modal
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [selectedCaseForSubmit, setSelectedCaseForSubmit] = useState(null);
  const [submitSuccessModal, setSubmitSuccessModal] = useState(false);
  const [submittedCaseName, setSubmittedCaseName] = useState('');
  const [celebration, setCelebration] = useState(false);

  // --- HELPER FUNCTIONS ---
  
  // Get document progress
  const getDocumentProgress = (caseItem) => {
    const requiredDocs = caseItem.documentStatus?.requiredDocuments || [];
    
    const directUploadDocs = requiredDocs.filter(doc => 
      doc.actionType === 'direct_upload' && doc.isRequired === true
    );
    
    const downloadableDocs = requiredDocs.filter(doc => 
      doc.actionType === 'download_fill_upload'
    );
    
    const directUploaded = directUploadDocs.filter(doc => doc.isUploaded === true).length;
    const directTotal = directUploadDocs.length;
    
    const downloadableUploaded = downloadableDocs.filter(doc => doc.isUploaded === true).length;
    const downloadableTotal = downloadableDocs.length;
    
    return {
      required: {
        uploaded: directUploaded,
        total: directTotal,
        percentage: directTotal > 0 ? Math.round((directUploaded / directTotal) * 100) : 100,
        documents: directUploadDocs
      },
      optional: {
        uploaded: downloadableUploaded,
        total: downloadableTotal,
        percentage: downloadableTotal > 0 ? Math.round((downloadableUploaded / downloadableTotal) * 100) : 100,
        documents: downloadableDocs
      }
    };
  };

  // Check if case is ready for submission
  const isCaseReadyForSubmission = (caseItem) => {
    const progress = getDocumentProgress(caseItem);
    return progress.required.uploaded === progress.required.total;
  };

  // --- API CALLS ---
  
  const fetchCases = useCallback(async (page) => {
    setLoading(true);
    try {
      const res = await apiService.get(`/vault/cases?page=${page}&limit=10`);
      if (res?.success) {
        setCases(res.data || []);
        setTotalItems(res.total || 0);
      }
    } catch (err) {
      message.error("Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = async () => {
    if (!uploadFile || !selectedCase || !selectedDocument) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('document', uploadFile);
    formData.append('documentKey', selectedDocument.documentKey);
    formData.append('documentType', selectedDocument.documentType);
    
    try {
      const response = await apiService.post(`/vault/cases/${selectedCase._id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response?.success) {
        message.success(`${selectedDocument.documentName} uploaded successfully!`);
        setDocModalVisible(false);
        setUploadFile(null);
        setSelectedDocument(null);
        fetchCases(currentPage);
      } else {
        message.error(response?.message || "Upload failed");
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "Error uploading document");
    } finally {
      setUploading(false);
    }
  };

  const submitCaseToXoto = async () => {
    if (!selectedCaseForSubmit) return;
    
    setSubmitting(true);
    try {
      const response = await apiService.post(`/vault/cases/${selectedCaseForSubmit._id}/submit`);
      
      if (response?.success) {
        setCelebration(true);
        setTimeout(() => setCelebration(false), 3000);
        
        setSubmittedCaseName(selectedCaseForSubmit.clientInfo?.fullName || selectedCaseForSubmit.caseReference);
        setSubmitModalVisible(false);
        setSubmitSuccessModal(true);
        fetchCases(currentPage);
      } else {
        message.error(response?.message || "Failed to submit case");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Error submitting case");
    } finally {
      setSubmitting(false);
      setSelectedCaseForSubmit(null);
    }
  };

  // --- HANDLERS ---
  
  useEffect(() => {
    fetchCases(currentPage);
  }, [currentPage, fetchCases]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openDocumentUpload = (caseItem, document, e) => {
    e.stopPropagation();
    setSelectedCase(caseItem);
    setSelectedDocument(document);
    setDocModalVisible(true);
  };

  const openSubmitModal = (caseItem, e) => {
    e.stopPropagation();
    setSelectedCaseForSubmit(caseItem);
    setSubmitModalVisible(true);
  };

  const navigateToCaseDetail = (caseItem) => {
    navigate(`/dashboard/${roleSlug}/case/view/${caseItem._id}`);
  };

  // --- RENDER FUNCTIONS ---
  
  const renderDocumentList = (documents, title, icon, isRequired = true, caseItem) => {
    if (documents.length === 0) return null;
    
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {icon}
          <Text strong style={{ fontSize: 12 }}>{title}</Text>
          <Tag color={isRequired ? "orange" : "default"} style={{ fontSize: 10 }}>
            {isRequired ? "Required" : "Optional"}
          </Tag>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {documents.map((doc, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: doc.isUploaded ? '#f0fdf4' : '#f8f9fa',
                borderRadius: 8,
                border: `1px solid ${doc.isUploaded ? '#bbf7d0' : '#e5e7eb'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileTextOutlined style={{ color: doc.isUploaded ? SUCCESS_COLOR : '#888' }} />
                <div>
                  <Text style={{ fontSize: 12 }}>{doc.documentName}</Text>
                  {doc.isUploaded && (
                    <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
                      Uploaded
                    </Text>
                  )}
                </div>
              </div>
              {!doc.isUploaded && (
                <Button 
                  type="link" 
                  size="small"
                  icon={<UploadOutlined />}
                  onClick={(e) => openDocumentUpload(caseItem, doc, e)}
                  style={{ color: THEME_COLOR }}
                >
                  Upload
                </Button>
              )}
              {doc.isUploaded && (
                <CheckCircleOutlined style={{ color: SUCCESS_COLOR }} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCaseCard = (caseItem) => {
    const clientName = caseItem.clientInfo?.fullName || 'Unknown Client';
    const propertyValue = caseItem.propertyInfo?.propertyValue || 0;
    const loanAmount = caseItem.propertyInfo?.loanAmount || 0;
    const bankName = caseItem.bankSelection?.bankName || 'Not Selected';
    const progress = getDocumentProgress(caseItem);
    const isReady = isCaseReadyForSubmission(caseItem);
    
    return (
      <Card 
        hoverable
        style={{ 
          borderRadius: 16, 
          border: '1px solid #e8e8e8',
          borderTop: `4px solid ${THEME_COLOR}`,
          overflow: 'hidden',
          position: 'relative',
          height: '100%',
          cursor: 'pointer'
        }}
        bodyStyle={{ padding: 0 }}
        onClick={() => navigateToCaseDetail(caseItem)}
      >
        <div style={{ padding: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: THEME_COLOR }} size="large" />
              <div>
                <Text strong style={{ fontSize: 16, display: 'block' }}>{clientName}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>Case: {caseItem.caseReference}</Text>
              </div>
            </div>
            <Badge
              status={
                selectedCase?.currentStatus === 'Disbursed' ? 'success' :
                ['Lost','Declined','Rejected'].includes(selectedCase?.currentStatus) ? 'error' :
                selectedCase?.currentStatus === 'Draft' ? 'default' : 'processing'
              }
              text={<span style={{ fontSize: 11 }}>{selectedCase?.currentStatus || 'Draft'}</span>}
            />
          </div>

          {/* Key Metrics */}
          <Row gutter={12} style={{ background: '#f9f9f9', padding: '12px', borderRadius: 8, marginBottom: 16 }}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>Property Value</Text>
              <div style={{ fontWeight: 'bold', color: '#1e1b4b' }}>
                {fmtAED(propertyValue)}
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>Loan Amount</Text>
              <div style={{ fontWeight: 'bold', color: THEME_COLOR }}>
                {fmtAED(loanAmount)}
              </div>
            </Col>
          </Row>

          {/* Bank Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BankOutlined style={{ color: THEME_COLOR }} />
            <Text strong style={{ fontSize: 13 }}>{bankName}</Text>
            {caseItem.bankSelection?.interestRate && (
              <Tag color="purple" style={{ marginLeft: 'auto' }}>
                {caseItem.bankSelection.interestRate}%
              </Tag>
            )}
          </div>

          {/* Required Documents Section */}
          {progress.required.documents.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <CloudUploadOutlined /> Required Documents
                </Text>
                <Text style={{ fontSize: 11, fontWeight: 600, color: progress.required.percentage === 100 ? SUCCESS_COLOR : THEME_COLOR }}>
                  {progress.required.uploaded}/{progress.required.total} uploaded
                </Text>
              </div>
              <Progress 
                percent={progress.required.percentage} 
                size="small" 
                strokeColor={progress.required.percentage === 100 ? SUCCESS_COLOR : THEME_COLOR}
                showInfo={false}
              />
              {progress.required.percentage < 100 && (
                <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4, color: '#f59e0b' }}>
                  ⚠️ {progress.required.total - progress.required.uploaded} required document(s) pending
                </Text>
              )}
            </div>
          )}

          {/* Metadata */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#888', marginBottom: 16 }}>
            <span><CalendarOutlined /> {dayjs(caseItem.createdAt).format('MMM DD, YYYY')}</span>
            <span><UserOutlined /> {caseItem.createdBy?.userName || 'Advisor'}</span>
          </div>

          {/* Submit Button */}
          <Tooltip title={isReady ? "Submit case to Xoto team for processing" : `Please upload all required documents (${progress.required.total - progress.required.uploaded} remaining) before submitting`}>
            <Button 
              type="primary"
              block
              icon={<SendOutlined />}
              onClick={(e) => openSubmitModal(caseItem, e)}
              disabled={!isReady}
              style={{ 
                background: isReady ? SUCCESS_COLOR : '#d1d5db',
                borderColor: isReady ? SUCCESS_COLOR : '#d1d5db',
                borderRadius: 8,
                marginTop: 8
              }}
            >
              {isReady ? 'Submit to Xoto' : `${progress.required.total - progress.required.uploaded} Required Document(s) Pending`}
            </Button>
          </Tooltip>
        </div>
      </Card>
    );
  };

  // Document Upload Modal
  const renderDocumentModal = () => (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CloudUploadOutlined style={{ color: THEME_COLOR, fontSize: 24 }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>Upload Document</span>
        </div>
      }
      open={docModalVisible}
      onCancel={() => { setDocModalVisible(false); setUploadFile(null); setSelectedDocument(null); }}
      footer={[
        <Button key="cancel" onClick={() => { setDocModalVisible(false); setUploadFile(null); setSelectedDocument(null); }}>
          Cancel
        </Button>,
        <Button 
          key="upload" 
          type="primary" 
          onClick={uploadDocument}
          loading={uploading}
          disabled={!uploadFile}
          style={{ background: THEME_COLOR, borderColor: THEME_COLOR }}
          icon={<CloudUploadOutlined />}
        >
          Upload Document
        </Button>
      ]}
      width={500}
      centered
    >
      {selectedDocument && (
        <div>
          <div style={{ marginBottom: 20, padding: 16, background: '#f8f5ff', borderRadius: 12 }}>
            <Text strong>Document: {selectedDocument.documentName}</Text>
            <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
              {selectedDocument.description || 'Please upload a clear copy of this document'}
            </Text>
          </div>
          
          <Upload
            beforeUpload={(file) => {
              const isPdfOrImage = file.type === 'application/pdf' || file.type.startsWith('image/');
              if (!isPdfOrImage) {
                message.error('Only PDF and image files are allowed!');
                return false;
              }
              const isLt10M = file.size / 1024 / 1024 < 10;
              if (!isLt10M) {
                message.error('File must be smaller than 10MB!');
                return false;
              }
              setUploadFile(file);
              return false;
            }}
            maxCount={1}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />} style={{ width: '100%', marginBottom: 16 }}>
              Select File
            </Button>
          </Upload>
          
          {uploadFile && (
            <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8 }}>
              <CheckCircleOutlined style={{ color: SUCCESS_COLOR, marginRight: 8 }} />
              <Text>{uploadFile.name}</Text>
            </div>
          )}
        </div>
      )}
    </Modal>
  );

  // Submit Confirmation Modal
  const renderSubmitModal = () => (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SendOutlined style={{ color: THEME_COLOR, fontSize: 24 }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>Submit Case to Xoto</span>
        </div>
      }
      open={submitModalVisible}
      onCancel={() => { setSubmitModalVisible(false); setSelectedCaseForSubmit(null); }}
      footer={[
        <Button key="cancel" onClick={() => { setSubmitModalVisible(false); setSelectedCaseForSubmit(null); }}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={submitCaseToXoto}
          loading={submitting}
          style={{ background: SUCCESS_COLOR, borderColor: SUCCESS_COLOR }}
          icon={<RocketOutlined />}
        >
          Yes, Submit Case
        </Button>
      ]}
      width={550}
      centered
    >
      {selectedCaseForSubmit && (
        <div>
          <Alert
            message="Confirm Submission"
            description={`Are you sure you want to submit "${selectedCaseForSubmit.clientInfo?.fullName || selectedCaseForSubmit.caseReference}" to the Xoto team?`}
            type="warning"
            showIcon
            style={{ borderRadius: 12, marginBottom: 20 }}
          />
          
          <div style={{ background: '#f8f5ff', padding: 16, borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text strong>Case Reference:</Text>
              <Text>{selectedCaseForSubmit.caseReference}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text strong>Loan Amount:</Text>
              <Text strong style={{ color: THEME_COLOR }}>
                {fmtAED(selectedCaseForSubmit.propertyInfo?.loanAmount)}
              </Text>
            </div>
          </div>
          
          <Text type="secondary" style={{ fontSize: 12 }}>
            Once submitted, the Xoto team will review your case and contact you for further processing.
          </Text>
        </div>
      )}
    </Modal>
  );

  // Success Modal
  const renderSuccessModal = () => (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TrophyOutlined style={{ color: SUCCESS_COLOR, fontSize: 28 }} />
          <span style={{ fontSize: 20, fontWeight: 700, color: SUCCESS_COLOR }}>Congratulations!</span>
        </div>
      }
      open={submitSuccessModal}
      onCancel={() => setSubmitSuccessModal(false)}
      footer={[
        <Button 
          key="ok" 
          type="primary" 
          onClick={() => setSubmitSuccessModal(false)}
          style={{ background: SUCCESS_COLOR, borderColor: SUCCESS_COLOR }}
        >
          Great! Thanks
        </Button>
      ]}
      width={550}
      centered
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: 40, background: '#ecfdf5', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: SUCCESS_COLOR }} />
        </div>
        
        <Title level={4} style={{ color: '#1e1b4b', marginBottom: 12 }}>
          Case Successfully Submitted! 🎉
        </Title>
        
        <Text style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
          Your case has been submitted to the Xoto team.
        </Text>
        
        <div style={{ background: '#f8f5ff', padding: 16, borderRadius: 12, margin: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <TeamOutlined style={{ fontSize: 24, color: THEME_COLOR }} />
            <div>
              <Text strong>What happens next?</Text>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                Our team will review your case and contact you within 24-48 hours.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );

  return (
    <div style={{ padding: '24px', background: '#fdfbff', minHeight: '100vh' }}>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          20% { transform: translateY(-20px) scale(1); opacity: 1; }
          80% { transform: translateY(-60px) scale(1); opacity: 1; }
          100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
        }
      `}</style>
      
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ color: '#1e1b4b', margin: 0, fontWeight: 800 }}>Draft Cases</Title>
        <Text type="secondary">Review documents and submit cases to the Xoto team</Text>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {cases.map(caseItem => (
              <Col xs={24} md={12} lg={8} key={caseItem._id}>
                {renderCaseCard(caseItem)}
              </Col>
            ))}
          </Row>

          {cases.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <FileTextOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
              <br/>
              <Text type="secondary">No draft cases found</Text>
              <div style={{ marginTop: 16 }}>
                <Button type="link" onClick={() => navigate(`/dashboard/${roleSlug}/vault/cases/create`)}>
                  Create a new case
                </Button>
              </div>
            </div>
          )}

          {totalItems > 0 && (
            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination 
                current={currentPage} 
                total={totalItems} 
                pageSize={10} 
                onChange={handlePageChange} 
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {renderDocumentModal()}
      {renderSubmitModal()}
      {renderSuccessModal()}
    </div>
  );
};

export default ViewCases; 