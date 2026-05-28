import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiService } from "@/api/apiService";
import {
  Card, Space, Tag, Typography, Row, Col, Avatar,
  Button, message, Modal, Checkbox, Input, Upload,
  Progress, Alert, Badge, Spin, Select, Tabs, Empty, Form,
  Image, Drawer
} from 'antd';
import {
  BankOutlined, ArrowLeftOutlined, DownloadOutlined,
  FileTextOutlined, CheckCircleOutlined, InfoCircleOutlined,
  SafetyCertificateOutlined, EyeOutlined, UploadOutlined,
  IdcardOutlined, SolutionOutlined, HomeOutlined,
  DollarOutlined, InsuranceOutlined, FormOutlined,
  GlobalOutlined, WarningOutlined, CloudUploadOutlined,
  FileDoneOutlined, FilterOutlined, TeamOutlined,
  UserOutlined, BankFilled, EditOutlined, FolderOpenOutlined,
  CloseOutlined, FilePdfOutlined, LinkOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const THEME_COLOR = "#7c3aed";
const THEME_SECONDARY = "#f5f3ff";

const roleSlugMap = {
  '0': 'superadmin',
  '1': 'admin',
  '18': "vault-admin",
  '22': "vaultagent",
  '21': "vaultpartner",
  '23': "vault-ops",
  '26': "vault-advisor",
  '25': "gridReferralPartner",
};

// ==================== COMPLETE DOCUMENTS FROM JSON ====================
const DOCUMENTS_LIST = [
  { id: "doc_1", formName: "Passport Copy (All Pages)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 1, description: "Customer passport copy all pages", fillInstructions: "Upload clear scanned copy of passport (all pages including first, last and visa pages)", category: "Identity", icon: <IdcardOutlined />, section: "customer" },
  { id: "doc_2", formName: "Emirates ID (Front & Back)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident"], isMandatory: true, requiresSignature: false, order: 2, description: "Emirates ID front and back", fillInstructions: "Upload clear copy of Emirates ID (front and back)", category: "Identity", icon: <IdcardOutlined />, section: "customer" },
  { id: "doc_3", formName: "UAE Resident Visa", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE Resident"], isMandatory: true, requiresSignature: false, order: 3, description: "Valid UAE residence visa", fillInstructions: "Upload valid UAE residence visa copy", category: "Identity", icon: <GlobalOutlined />, section: "customer" },
  { id: "doc_4", formName: "Other National ID", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["Non-Resident"], isMandatory: true, requiresSignature: false, order: 4, description: "National ID from home country", fillInstructions: "Upload clear copy of national ID from your home country", category: "Identity", icon: <IdcardOutlined />, section: "customer" },
  { id: "doc_5", formName: "Passport Size Photo", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 5, description: "Passport size photograph", fillInstructions: "Upload recent passport size photo (white background)", category: "Identity", icon: <FileTextOutlined />, section: "customer" },
  { id: "doc_6", formName: "Salary Certificate", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 6, description: "Salary certificate on company letterhead", fillInstructions: "Upload salary certificate stating position, joining date and monthly salary", category: "Employment", icon: <SolutionOutlined />, section: "customer" },
  { id: "doc_7", formName: "Payslips (Last 3 months)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 7, description: "Last 3 months payslips", fillInstructions: "Upload last 3 months payslips (PDF format)", category: "Employment", icon: <FileTextOutlined />, section: "customer" },
  { id: "doc_8", formName: "Employment Contract", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried"], applicableResidencyStatus: ["UAE Resident", "Non-Resident"], isMandatory: false, requiresSignature: false, order: 8, description: "Employment contract", fillInstructions: "Upload employment contract (recommended for expats)", category: "Employment", icon: <SolutionOutlined />, section: "customer" },
  { id: "doc_9", formName: "Trade License", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 9, description: "Valid trade license", fillInstructions: "Upload valid trade license copy", category: "Employment", icon: <SafetyCertificateOutlined />, section: "customer" },
  { id: "doc_10", formName: "Memorandum of Association (MOA)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 10, description: "Memorandum of Association", fillInstructions: "Upload MOA showing shareholding structure", category: "Employment", icon: <FileTextOutlined />, section: "customer" },
  { id: "doc_11", formName: "Company Profile", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 11, description: "Company profile/brochure", fillInstructions: "Upload company profile or business brochure", category: "Employment", icon: <FileTextOutlined />, section: "customer" },
  { id: "doc_12", formName: "Employee List", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident"], isMandatory: true, requiresSignature: false, order: 12, description: "List of employees", fillInstructions: "Upload employee list with names and designations", category: "Employment", icon: <TeamOutlined />, section: "customer" },
  { id: "doc_13", formName: "Company Website URL", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: false, requiresSignature: false, order: 13, description: "Company website URL", fillInstructions: "Provide company website URL (required for non-residents)", category: "Employment", icon: <GlobalOutlined />, section: "customer" },
  { id: "doc_14", formName: "CV / Resume", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["Non-Resident"], isMandatory: true, requiresSignature: false, order: 14, description: "Professional CV/Resume", fillInstructions: "Upload updated CV/Resume", category: "Employment", icon: <FileTextOutlined />, section: "customer" },
  { id: "doc_15", formName: "Personal Bank Statement (6 months)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 15, description: "Last 6 months personal bank statement", fillInstructions: "Upload last 6 months bank statement showing salary credit", category: "Financial", icon: <DollarOutlined />, section: "customer" },
  { id: "doc_16", formName: "Company Bank Statement (12 months)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 16, description: "Last 12 months company bank statement", fillInstructions: "Upload last 12 months company bank statement", category: "Financial", icon: <DollarOutlined />, section: "customer" },
  { id: "doc_17", formName: "Credit Report (AECB)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["Non-Resident"], isMandatory: true, requiresSignature: false, order: 17, description: "AECB credit report", fillInstructions: "Upload AECB credit report (mandatory for non-residents)", category: "Financial", icon: <FileTextOutlined />, section: "customer" },
  { id: "doc_18", formName: "Audit Report (Last 2 years)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 18, description: "Audited financial statements", fillInstructions: "Upload last 2 years audited financial statements", category: "Financial", icon: <FileTextOutlined />, section: "customer" },
  { id: "doc_19", formName: "VAT Registration Certificate", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 19, description: "VAT registration certificate", fillInstructions: "Upload VAT registration certificate", category: "Financial", icon: <SafetyCertificateOutlined />, section: "customer" },
  { id: "doc_20", formName: "VAT Return Reports (4 quarters)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 20, description: "Last 4 quarters VAT returns", fillInstructions: "Upload last 4 quarters VAT return reports", category: "Financial", icon: <FileTextOutlined />, section: "customer" },
  { id: "doc_21", formName: "Source of Funds Declaration", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: true, order: 21, description: "Source of funds declaration", fillInstructions: "Upload signed source of funds declaration form", category: "Financial", icon: <FormOutlined />, section: "customer" },
  { id: "doc_22", formName: "Sales Purchase Agreement (SPA)", formType: "customer_document", formCategory: "Final Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 22, description: "Sales Purchase Agreement", fillInstructions: "Upload SPA signed by buyer and seller", category: "Property", icon: <HomeOutlined />, section: "customer" },
  { id: "doc_23", formName: "Title Deed / Oqood", formType: "customer_document", formCategory: "Final Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 23, description: "Title deed or Oqood", fillInstructions: "Upload Title Deed or Oqood (for off-plan properties)", category: "Property", icon: <SafetyCertificateOutlined />, section: "customer" },
  { id: "doc_24", formName: "Property Valuation Report", formType: "customer_document", formCategory: "Final Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 24, description: "Property valuation report", fillInstructions: "Upload bank-approved property valuation report", category: "Property", icon: <FileTextOutlined />, section: "customer" },
  { id: "doc_25", formName: "Property Insurance Certificate", formType: "customer_document", formCategory: "Disbursement", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 25, description: "Property insurance certificate", fillInstructions: "Upload property insurance certificate covering the mortgaged property", category: "Insurance", icon: <InsuranceOutlined />, section: "customer" },
  { id: "doc_26", formName: "Mortgage Application Form", formType: "application_form", formCategory: "Pre-Approval", documentSource: "Bank", actionType: "download_fill_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: true, order: 26, description: "Bank's official mortgage application form", fillInstructions: "DOWNLOAD THIS FORM → Fill all sections → Get customer signature → Upload back", category: "Bank Forms", icon: <FormOutlined />, section: "bank", isDownloadable: true },
  { id: "doc_27", formName: "Credit Bureau Consent Form", formType: "consent_form", formCategory: "Pre-Approval", documentSource: "Bank", actionType: "download_fill_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: true, order: 27, description: "AECB credit check consent", fillInstructions: "DOWNLOAD THIS FORM → Customer signs → Upload back", category: "Bank Forms", icon: <CheckCircleOutlined />, section: "bank", isDownloadable: true },
  { id: "doc_28", formName: "Terms & Fees Disclosure Form", formType: "disclosure_form", formCategory: "Pre-Approval", documentSource: "Bank", actionType: "download_fill_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: true, order: 28, description: "Product terms and fees acknowledgment", fillInstructions: "DOWNLOAD THIS FORM → Customer acknowledges terms → Sign → Upload back", category: "Bank Forms", icon: <InfoCircleOutlined />, section: "bank", isDownloadable: true },
  { id: "doc_29", formName: "Direct Debit Authorization", formType: "consent_form", formCategory: "Disbursement", documentSource: "Bank", actionType: "download_fill_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident"], isMandatory: true, requiresSignature: true, order: 29, description: "UAEDDS direct debit authorization", fillInstructions: "DOWNLOAD THIS FORM → Customer authorizes auto-debit → Sign → Upload back", category: "Bank Forms", icon: <CloudUploadOutlined />, section: "bank", isDownloadable: true },
  { id: "doc_30", formName: "Salary Transfer Undertaking", formType: "consent_form", formCategory: "Pre-Approval", documentSource: "Bank", actionType: "download_fill_upload", applicableEmploymentTypes: ["Salaried"], applicableResidencyStatus: ["UAE National", "UAE Resident"], isMandatory: true, requiresSignature: true, order: 30, description: "Salary transfer agreement", fillInstructions: "DOWNLOAD THIS FORM → Employer fills and signs → Upload back", category: "Bank Forms", icon: <SolutionOutlined />, section: "bank", isDownloadable: true },
  { id: "doc_31", formName: "Property Declaration Form", formType: "disclosure_form", formCategory: "Final Approval", documentSource: "Bank", actionType: "download_fill_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: true, order: 31, description: "Property details declaration", fillInstructions: "DOWNLOAD THIS FORM → Customer declares property details → Sign → Upload back", category: "Bank Forms", icon: <HomeOutlined />, section: "bank", isDownloadable: true },
];

const BankProductDocuments = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  
  const [bankProduct, setBankProduct] = useState(null);
  const [existingForms, setExistingForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("customer");
  
  // Filters
  const [employmentFilter, setEmploymentFilter] = useState("Both");
  const [residencyFilter, setResidencyFilter] = useState("All");
  
  // Selected documents state
  const [selectedCustomerDocs, setSelectedCustomerDocs] = useState({});
  const [selectedBankDocs, setSelectedBankDocs] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [fileUrls, setFileUrls] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [updatingFormStatus, setUpdatingFormStatus] = useState(false);
  const [editForm] = Form.useForm();
  
  // Preview Drawer State
  const [previewDrawerVisible, setPreviewDrawerVisible] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  
  // Attachment Update State
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const roleSlug = roleSlugMap[user?.role?.code] ?? "dashboard";

  // Fetch Bank Product
  const fetchBankProduct = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(`bank/products/get-bank-product/${productId}`);
      if (res?.success) {
        setBankProduct(res.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      message.error('Failed to load bank product');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Fetch Existing Forms
  const fetchExistingForms = useCallback(async () => {
    try {
      const res = await apiService.get(`bank/products/bank-forms/bank-product/${productId}`);
      if (res?.success && res.data.allForms) {
        setExistingForms(res.data.allForms);
      }
    } catch (err) {
      console.error('Fetch forms error:', err);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchBankProduct();
      fetchExistingForms();
    }
  }, [productId, fetchBankProduct, fetchExistingForms]);

  // Handle file upload
  const handleFileUpload = async (docId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadProgress(prev => ({ ...prev, [docId]: 0 }));
    
    try {
      const response = await apiService.upload('upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [docId]: percent }));
        }
      });
      const fileUrl = response.file?.url || response.url;
      setFileUrls(prev => ({ ...prev, [docId]: fileUrl }));
      setUploadedFiles(prev => ({ ...prev, [docId]: { name: file.name, url: fileUrl, size: file.size } }));
      message.success(`${file.name} uploaded successfully`);
      return fileUrl;
    } catch (err) {
      message.error('Upload failed');
      setUploadProgress(prev => ({ ...prev, [docId]: 0 }));
      return null;
    }
  };

  // Handle attachment upload for existing document
  const handleAttachmentUpload = async (doc, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadingAttachment(true);
    try {
      const response = await apiService.upload('upload', formData);
      const fileUrl = response.file?.url || response.url;
      
      // Update the document with new file URL
      const updatePayload = {
        fileUrl: fileUrl,
        fileName: file.name,
        fileSize: file.size
      };
      
      await apiService.put(`bank/products/update-bank-form/${doc._id}`, updatePayload);
      message.success('Attachment updated successfully');
      fetchExistingForms(); // Refresh the list
      setPreviewDrawerVisible(false);
    } catch (err) {
      console.error('Attachment upload error:', err);
      message.error('Failed to update attachment');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleUrlChange = (docId, url) => {
    setFileUrls(prev => ({ ...prev, [docId]: url }));
    if (url) {
      setUploadedFiles(prev => ({ ...prev, [docId]: { name: 'URL Provided', url: url } }));
    }
  };

  const isDocumentAdded = (docName) => {
    return existingForms.some(f => f.formName?.toLowerCase().includes(docName.toLowerCase().split('(')[0].trim()));
  };

  const isDocumentApplicable = (doc) => {
    if (employmentFilter !== "Both" && !doc.applicableEmploymentTypes.includes(employmentFilter)) return false;
    if (residencyFilter !== "All" && !doc.applicableResidencyStatus.includes(residencyFilter)) return false;
    return true;
  };

  const toggleCustomerDocument = (docId) => {
    const doc = DOCUMENTS_LIST.find(d => d.id === docId);
    if (isDocumentAdded(doc?.formName)) {
      message.warning('This document is already added to this bank product');
      return;
    }
    setSelectedCustomerDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
  };

  const toggleBankDocument = (docId) => {
    const doc = DOCUMENTS_LIST.find(d => d.id === docId);
    if (isDocumentAdded(doc?.formName)) {
      message.warning('This document is already added to this bank product');
      return;
    }
    setSelectedBankDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
  };

  const selectAllCustomerDocs = () => {
    const newSelected = { ...selectedCustomerDocs };
    DOCUMENTS_LIST.filter(doc => doc.section === 'customer' && isDocumentApplicable(doc) && !isDocumentAdded(doc.formName)).forEach(doc => {
      newSelected[doc.id] = true;
    });
    setSelectedCustomerDocs(newSelected);
  };

  const selectAllBankDocs = () => {
    const newSelected = { ...selectedBankDocs };
    DOCUMENTS_LIST.filter(doc => doc.section === 'bank' && isDocumentApplicable(doc) && !isDocumentAdded(doc.formName)).forEach(doc => {
      newSelected[doc.id] = true;
    });
    setSelectedBankDocs(newSelected);
  };

  const selectRequiredCustomerDocs = () => {
    const newSelected = { ...selectedCustomerDocs };
    DOCUMENTS_LIST.filter(doc => doc.section === 'customer' && doc.isMandatory && !isDocumentAdded(doc.formName)).forEach(doc => {
      newSelected[doc.id] = true;
    });
    setSelectedCustomerDocs(newSelected);
  };

  const selectRequiredBankDocs = () => {
    const newSelected = { ...selectedBankDocs };
    DOCUMENTS_LIST.filter(doc => doc.section === 'bank' && doc.isMandatory && !isDocumentAdded(doc.formName)).forEach(doc => {
      newSelected[doc.id] = true;
    });
    setSelectedBankDocs(newSelected);
  };

  const clearSelections = () => {
    setSelectedCustomerDocs({});
    setSelectedBankDocs({});
    setUploadedFiles({});
    setFileUrls({});
  };

  // Bulk Add Handler
  const handleSubmitDocuments = async () => {
    const selectedCustomerList = DOCUMENTS_LIST.filter(doc => doc.section === 'customer' && selectedCustomerDocs[doc.id]);
    const selectedBankList = DOCUMENTS_LIST.filter(doc => doc.section === 'bank' && selectedBankDocs[doc.id]);
    const selectedDocsList = [...selectedCustomerList, ...selectedBankList];
    
    if (selectedDocsList.length === 0) {
      message.warning('Please select at least one document to add');
      return;
    }

    const bankWithoutUrl = selectedBankList.filter(doc => !fileUrls[doc.id]);
    if (bankWithoutUrl.length > 0) {
      message.warning(`Please upload filled forms for: ${bankWithoutUrl.map(d => d.formName).join(', ')}`);
      return;
    }

    setSubmitting(true);

    const bulkPayload = {
      forms: selectedDocsList.map((doc) => ({
        bankProductId: productId,
        formName: doc.formName,
        formType: doc.formType,
        formCategory: doc.formCategory,
        documentSource: doc.documentSource,
        actionType: doc.actionType,
        fileUrl: fileUrls[doc.id] || "",
        fileName: uploadedFiles[doc.id]?.name || `${doc.formName}.pdf`,
        fileSize: uploadedFiles[doc.id]?.size || 0,
        applicableEmploymentTypes: doc.applicableEmploymentTypes,
        applicableResidencyStatus: doc.applicableResidencyStatus,
        applicableLoanTypes: ["CONVENTIONAL", "ISLAMIC", "Both"],
        isMandatory: doc.isMandatory,
        requiresSignature: doc.requiresSignature,
        order: doc.order,
        description: doc.description,
        fillInstructions: doc.fillInstructions
      }))
    };

    try {
      const response = await apiService.post('bank/products/create-bulk-bank-forms', bulkPayload);
      if (response.success) {
        message.success(response.message);
        fetchExistingForms();
        clearSelections();
        if (response.errors && response.errors.length > 0) {
          message.warning(`${response.errors.length} documents failed to add`);
        }
      } else {
        message.error(response.message || 'Failed to add documents');
      }
    } catch (err) {
      message.error('Failed to add documents. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Form Logic
  const openEditModal = (doc) => {
    setEditingDoc(doc);
    editForm.setFieldsValue({
      formName: doc.formName,
      description: doc.description,
      fillInstructions: doc.fillInstructions,
      isMandatory: doc.isMandatory,
      isActive: doc.isActive,
      order: doc.order
    });
    setEditModalVisible(true);
  };

  const handleUpdateDocument = async () => {
    try {
      const values = await editForm.validateFields();
      setUpdatingFormStatus(true);
      const res = await apiService.put(`bank/products/update-bank-form/${editingDoc._id}`, values);
      
      if (res?.success) {
        message.success("Bank form updated successfully");
        setEditModalVisible(false);
        fetchExistingForms();
      } else {
        message.error(res?.message || "Failed to update bank form");
      }
    } catch (err) {
      message.error("Validation failed or API Error");
    } finally {
      setUpdatingFormStatus(false);
    }
  };

  // Preview Document
  const openPreviewDrawer = (doc) => {
    setPreviewDoc(doc);
    setPreviewDrawerVisible(true);
  };

  const customerDocs = DOCUMENTS_LIST.filter(doc => doc.section === 'customer' && isDocumentApplicable(doc));
  const bankDocs = DOCUMENTS_LIST.filter(doc => doc.section === 'bank' && isDocumentApplicable(doc));
  
  const customerSelectedCount = Object.values(selectedCustomerDocs).filter(v => v === true).length;
  const bankSelectedCount = Object.values(selectedBankDocs).filter(v => v === true).length;
  const totalSelectedCount = customerSelectedCount + bankSelectedCount;
  
  const customerRequiredTotal = customerDocs.filter(d => d.isMandatory).length;
  const customerRequiredSelected = customerDocs.filter(d => d.isMandatory && selectedCustomerDocs[d.id]).length;
  const bankRequiredTotal = bankDocs.filter(d => d.isMandatory).length;
  const bankRequiredSelected = bankDocs.filter(d => d.isMandatory && selectedBankDocs[d.id]).length;
  
  const addedCount = existingForms.length;

  const handleGoBack = () => navigate(`/dashboard/${roleSlug}/bank/products`);

  if (loading) {
    return (
      <div style={{ padding: 50, textAlign: 'center', background: '#f5f3ff', minHeight: '100vh' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading documents library...</div>
      </div>
    );
  }

  // Render document card for adding
  const renderDocumentCard = (doc) => {
    const isSelected = doc.section === 'customer' ? selectedCustomerDocs[doc.id] : selectedBankDocs[doc.id];
    const isAdded = isDocumentAdded(doc.formName);
    const hasUpload = uploadedFiles[doc.id];
    const isDownloadable = doc.actionType === 'download_fill_upload';
    const toggleFn = doc.section === 'customer' ? toggleCustomerDocument : toggleBankDocument;
    
    return (
      <Col xs={24} lg={12} key={doc.id} style={{ display: 'flex' }}>
        <Card 
          hoverable
          style={{ 
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 16,
            border: isSelected ? `2px solid ${THEME_COLOR}` : '1px solid #e8e8e8',
            background: isSelected ? THEME_SECONDARY : '#fff',
            opacity: isAdded ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
          bodyStyle={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 24, color: THEME_COLOR }}>{doc.icon}</div>
              <div>
                <Text strong style={{ fontSize: 14 }}>{doc.formName}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>{doc.description}</Text>
              </div>
            </div>
            <Checkbox checked={isSelected} onChange={() => toggleFn(doc.id)} disabled={isAdded} />
          </div>

          <div style={{ marginBottom: 12 }}>
            {doc.isMandatory ? <Tag color="error" icon={<WarningOutlined />}>Required</Tag> : <Tag color="default">Optional</Tag>}
            {isDownloadable && <Tag color="blue" icon={<DownloadOutlined />}>Download & Fill</Tag>}
            {!isDownloadable && <Tag color="green" icon={<UploadOutlined />}>Upload Only</Tag>}
            {isAdded && <Tag color="success" icon={<CheckCircleOutlined />}>Already Added</Tag>}
          </div>

          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 10 }}>Applicable:</Text>
            <div>
              {doc.applicableEmploymentTypes.map(type => <Tag key={type} size="small">{type}</Tag>)}
              {doc.applicableResidencyStatus.map(type => <Tag key={type} size="small">{type}</Tag>)}
            </div>
          </div>

          <div style={{ 
            background: '#fafafa', padding: 10, borderRadius: 8, 
            borderLeft: `3px solid ${THEME_COLOR}`, marginTop: 'auto'
          }}>
            <Text style={{ fontSize: 11, color: '#666' }}>
              <InfoCircleOutlined style={{ marginRight: 4, color: THEME_COLOR }} />
              {doc.fillInstructions}
            </Text>
          </div>

          {isSelected && !isAdded && (
            <div style={{ marginTop: 12 }}>
              {isDownloadable ? (
                <div>
                  <Alert message="Process: Download → Fill → Sign → Upload" type="info" showIcon style={{ marginBottom: 8, fontSize: 11 }} />
                  <Upload accept=".pdf" showUploadList={false} customRequest={({ file, onSuccess }) => { handleFileUpload(doc.id, file); onSuccess(); }}>
                    <Button icon={<UploadOutlined />} size="small" block style={{ marginBottom: 4 }}>Upload Signed Form</Button>
                  </Upload>
                  {uploadProgress[doc.id] > 0 && uploadProgress[doc.id] < 100 && (
                    <Progress percent={uploadProgress[doc.id]} size="small" style={{ marginBottom: 4 }} />
                  )}
                  <Input placeholder="Or paste file URL" size="small" value={fileUrls[doc.id] || ''} onChange={(e) => handleUrlChange(doc.id, e.target.value)} style={{ marginTop: 4 }} />
                </div>
              ) : (
                <div>
                  <Upload accept=".pdf,.jpg,.png,.jpeg" showUploadList={false} customRequest={({ file, onSuccess }) => { handleFileUpload(doc.id, file); onSuccess(); }}>
                    <Button icon={<UploadOutlined />} size="small" block style={{ marginBottom: 4 }}>Upload Document</Button>
                  </Upload>
                  {uploadProgress[doc.id] > 0 && uploadProgress[doc.id] < 100 && (
                    <Progress percent={uploadProgress[doc.id]} size="small" style={{ marginBottom: 4 }} />
                  )}
                  <Input placeholder="Or paste file URL" size="small" value={fileUrls[doc.id] || ''} onChange={(e) => handleUrlChange(doc.id, e.target.value)} style={{ marginTop: 4 }} />
                </div>
              )}
              
              {hasUpload && (
                <div style={{ marginTop: 8 }}>
                  <Tag color="success" style={{ fontSize: 11 }}><CheckCircleOutlined /> {uploadedFiles[doc.id]?.name}</Tag>
                  <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => window.open(uploadedFiles[doc.id]?.url, '_blank')}>Preview</Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </Col>
    );
  };

  // Render added document card with inline preview and edit
  const renderAddedDocumentCard = (doc) => {
    const isImage = doc.fileUrl && (doc.fileUrl.match(/\.(jpeg|jpg|gif|png)$/) !== null);
    const isPDF = doc.fileUrl && doc.fileUrl.match(/\.pdf$/);
    
    return (
      <Col xs={24} lg={12} key={doc._id} style={{ display: 'flex' }}>
        <Card 
          hoverable
          style={{ 
            width: '100%',
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 16,
            border: `1px solid ${doc.isActive ? '#e8e8e8' : '#ffa39e'}`,
            background: doc.isActive ? '#fff' : '#fff1f0',
          }}
          bodyStyle={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 24, color: THEME_COLOR }}>
                {doc.documentSource === 'Bank' ? <BankFilled /> : <IdcardOutlined />}
              </div>
              <div>
                <Text strong style={{ fontSize: 14 }}>{doc.formName}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>Source: {doc.documentSource} • Type: {doc.formType?.replace('_', ' ')}</Text>
              </div>
            </div>
            <Button 
              type="text" 
              icon={<EditOutlined style={{ color: THEME_COLOR }} />} 
              onClick={() => openEditModal(doc)}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            {doc.isMandatory ? <Tag color="error" icon={<WarningOutlined />}>Required</Tag> : <Tag color="default">Optional</Tag>}
            <Tag color={doc.isActive ? "success" : "error"}>{doc.isActive ? "Active" : "Inactive"}</Tag>
            <Tag color="blue">Order: {doc.order}</Tag>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 10 }}>Applicable:</Text>
            <div>
              {doc.applicableEmploymentTypes?.map(type => <Tag key={type} size="small">{type}</Tag>)}
              {doc.applicableResidencyStatus?.map(type => <Tag key={type} size="small">{type}</Tag>)}
            </div>
          </div>

          {/* Attached File Preview Section */}
          {doc.fileUrl && (
            <div style={{ 
              marginBottom: 12, 
              padding: 10, 
              background: '#f0f0f0', 
              borderRadius: 8,
              border: '1px solid #d9d9d9'
            }}>
              <Text strong style={{ fontSize: 12 }}>📎 Attached File:</Text>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {isImage ? (
                  <Image 
                    src={doc.fileUrl} 
                    alt={doc.fileName}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                    preview={{ mask: 'Preview' }}
                  />
                ) : isPDF ? (
                  <div 
                    onClick={() => openPreviewDrawer(doc)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      padding: '8px 12px',
                      background: '#fff',
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: '1px solid #d9d9d9',
                      flex: 1
                    }}
                  >
                    <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12 }}>{doc.fileName || 'Document'}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 10 }}>Click to preview</Text>
                    </div>
                    <Button type="link" size="small" icon={<EyeOutlined />} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LinkOutlined />
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">View Document</a>
                  </div>
                )}
                <Button 
                  type="dashed" 
                  size="small" 
                  icon={<UploadOutlined />}
                  onClick={() => openPreviewDrawer(doc)}
                >
                  Update
                </Button>
              </div>
            </div>
          )}

          <div style={{ 
            background: '#fafafa', padding: 10, borderRadius: 8, 
            borderLeft: `3px solid ${THEME_COLOR}`, marginTop: 'auto' 
          }}>
            <Text style={{ fontSize: 11, color: '#666' }}>
              <InfoCircleOutlined style={{ marginRight: 4, color: THEME_COLOR }} />
              {doc.fillInstructions}
            </Text>
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div style={{ padding: 24, background: '#f5f3ff', minHeight: '100vh', paddingBottom: 100 }}>
      
      {/* Header Section */}
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack} style={{ marginBottom: 16 }}>
          Back to Products
        </Button>
        
        <Row gutter={[24, 24]} align="middle">
          <Col>
            <Avatar src={bankProduct?.bankInfo?.logo} size={72} shape="square" style={{ borderRadius: 16 }} icon={<BankOutlined />} />
          </Col>
          <Col flex="auto">
            <Title level={2} style={{ margin: 0, color: '#1e1b4b' }}>{bankProduct?.bankInfo?.bankName}</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>{bankProduct?.offerSummary?.title}</Text>
            <div style={{ marginTop: 8 }}>
              <Space>
                <Badge count={`${addedCount} Documents Added`} style={{ backgroundColor: '#52c41a' }} />
                <Badge count={`${totalSelectedCount} Selected`} style={{ backgroundColor: THEME_COLOR }} />
              </Space>
            </div>
          </Col>
        </Row>
      </div>

      {/* Filter Section */}
      <Card style={{ borderRadius: 16, marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8}>
            <Text strong><FilterOutlined /> Employment Type:</Text>
            <Select value={employmentFilter} onChange={setEmploymentFilter} style={{ width: '100%', marginTop: 8 }} size="large">
              <Option value="Both">Both (Salaried & Self-Employed)</Option>
              <Option value="Salaried">Salaried Employee</Option>
              <Option value="Self-Employed">Self-Employed</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Text strong><GlobalOutlined /> Residency Status:</Text>
            <Select value={residencyFilter} onChange={setResidencyFilter} style={{ width: '100%', marginTop: 8 }} size="large">
              <Option value="All">All Residency Types</Option>
              <Option value="UAE National">UAE National</Option>
              <Option value="UAE Resident">UAE Resident</Option>
              <Option value="Non-Resident">Non-Resident</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <Button onClick={clearSelections} danger>Clear Selection Filters</Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        style={{ marginBottom: 16 }}
        items={[
          { 
            key: 'customer', 
            label: <span><UserOutlined /> Customer Docs to Add ({customerDocs.length})</span>,
            children: (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <Space><Text strong>📄 Customer Documents (Direct Upload)</Text></Space>
                  <Space>
                    <Button onClick={selectRequiredCustomerDocs}>Select Required</Button>
                    <Button onClick={selectAllCustomerDocs} type="primary" style={{ background: THEME_COLOR }}>Select All Applicable</Button>
                  </Space>
                </div>
                <Row gutter={[16, 16]} align="stretch">
                  {customerDocs.map(doc => renderDocumentCard(doc))}
                  {customerDocs.length === 0 && <Col span={24}><Empty description="No customer documents match filters" /></Col>}
                </Row>
              </>
            )
          },
          { 
            key: 'bank', 
            label: <span><BankFilled /> Bank Forms to Add ({bankDocs.length})</span>,
            children: (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <Space><Text strong>📝 Bank Forms (Download & Fill)</Text></Space>
                  <Space>
                    <Button onClick={selectRequiredBankDocs}>Select Required</Button>
                    <Button onClick={selectAllBankDocs} type="primary" style={{ background: THEME_COLOR }}>Select All Applicable</Button>
                  </Space>
                </div>
                <Row gutter={[16, 16]} align="stretch">
                  {bankDocs.map(doc => renderDocumentCard(doc))}
                  {bankDocs.length === 0 && <Col span={24}><Empty description="No bank forms match filters" /></Col>}
                </Row>
              </>
            )
          },
          { 
            key: 'existing', 
            label: <span><FolderOpenOutlined /> Added Documents ({existingForms.length})</span>,
            children: (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>✅ Manage Forms Currently Attached to Product</Text>
                </div>
                <Row gutter={[16, 16]} align="stretch">
                  {existingForms.map(doc => renderAddedDocumentCard(doc))}
                  {existingForms.length === 0 && <Col span={24}><Empty description="No documents have been added to this product yet" /></Col>}
                </Row>
              </>
            )
          }
        ]}
      />

      {/* Edit Form Modal */}
      <Modal
        title="Edit Bank Form Details"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleUpdateDocument}
        confirmLoading={updatingFormStatus}
        okText="Update Form"
        okButtonProps={{ style: { background: THEME_COLOR } }}
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="formName" label="Form Name" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="fillInstructions" label="Instructions">
            <TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="order" label="Sort Order">
                <Input type="number" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isMandatory" valuePropName="checked" style={{ marginBottom: 8 }}>
                <Checkbox>Is Mandatory?</Checkbox>
              </Form.Item>
              <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Checkbox>Is Active?</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Preview & Update Attachment Drawer */}
      <Drawer
        title={`Preview: ${previewDoc?.formName || 'Document'}`}
        placement="right"
        width={600}
        open={previewDrawerVisible}
        onClose={() => setPreviewDrawerVisible(false)}
        closable
        extra={
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={() => setPreviewDrawerVisible(false)} 
          />
        }
      >
        {previewDoc && (
          <div>
            {/* Document Preview */}
            <Card style={{ borderRadius: 12, marginBottom: 16 }}>
              <Text strong>Document Preview</Text>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                {previewDoc.fileUrl && previewDoc.fileUrl.match(/\.(jpeg|jpg|gif|png)$/) ? (
                  <Image 
                    src={previewDoc.fileUrl} 
                    alt={previewDoc.fileName}
                    style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }}
                    preview={false}
                  />
                ) : previewDoc.fileUrl && previewDoc.fileUrl.match(/\.pdf$/) ? (
                  <iframe
                    src={`${previewDoc.fileUrl}#toolbar=0`}
                    style={{ width: '100%', height: 500, border: 'none', borderRadius: 8 }}
                    title="PDF Preview"
                  />
                ) : previewDoc.fileUrl ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <FileTextOutlined style={{ fontSize: 48, color: '#999' }} />
                    <div style={{ marginTop: 16 }}>
                      <a href={previewDoc.fileUrl} target="_blank" rel="noopener noreferrer">Open Document in New Tab</a>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <FileTextOutlined style={{ fontSize: 48, color: '#999' }} />
                    <div style={{ marginTop: 16 }}>No file attached</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Update Attachment Section */}
            <Card style={{ borderRadius: 12 }}>
              <Text strong>📎 Update Attachment</Text>
              <div style={{ marginTop: 16 }}>
                <Upload
                  accept=".pdf,.jpg,.png,.jpeg,.doc,.docx"
                  showUploadList={false}
                  customRequest={({ file, onSuccess }) => {
                    handleAttachmentUpload(previewDoc, file);
                    onSuccess();
                  }}
                >
                  <Button 
                    type="dashed" 
                    icon={<UploadOutlined />} 
                    size="large" 
                    block
                    loading={uploadingAttachment}
                  >
                    Upload New File
                  </Button>
                </Upload>
                {previewDoc.fileUrl && (
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Current file:</Text>
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileTextOutlined />
                      <Text>{previewDoc.fileName || 'Document'}</Text>
                      <Button 
                        type="link" 
                        size="small" 
                        icon={<DownloadOutlined />}
                        onClick={() => window.open(previewDoc.fileUrl, '_blank')}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Alert
                message="Note"
                description="Upload a new file to replace the current attachment. The old file will be archived."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Card>

            {/* Document Info */}
            <Card style={{ borderRadius: 12, marginTop: 16 }}>
              <Text strong>ℹ️ Document Information</Text>
              <div style={{ marginTop: 12 }}>
                <p><Text type="secondary">Form Name:</Text> {previewDoc.formName}</p>
                <p><Text type="secondary">Source:</Text> {previewDoc.documentSource}</p>
                <p><Text type="secondary">Type:</Text> {previewDoc.formType}</p>
                <p><Text type="secondary">Category:</Text> {previewDoc.formCategory}</p>
                <p><Text type="secondary">Mandatory:</Text> {previewDoc.isMandatory ? 'Yes' : 'No'}</p>
                <p><Text type="secondary">Status:</Text> {previewDoc.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </Card>
          </div>
        )}
      </Drawer>

      {/* Sticky Submit Button for Adding New Forms */}
      {activeTab !== 'existing' && (
        <div style={{ 
          position: 'sticky', bottom: 0,
          background: '#fff', boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
          padding: '16px 24px', zIndex: 100, borderTop: `1px solid ${THEME_SECONDARY}`
        }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size="large">
                <Text><strong style={{ color: THEME_COLOR }}>{totalSelectedCount}</strong> documents selected total</Text>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button size="large" onClick={clearSelections}>Clear All</Button>
                <Button 
                  type="primary" 
                  size="large" 
                  loading={submitting}
                  onClick={handleSubmitDocuments}
                  style={{ background: THEME_COLOR, minWidth: 220 }}
                  icon={<FileDoneOutlined />}
                >
                  {submitting ? 'Adding Documents...' : `Add Selected Documents (${totalSelectedCount})`}
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      )}

    </div>
  );
};

export default BankProductDocuments;