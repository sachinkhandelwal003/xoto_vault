import {
  IdcardOutlined,
  GlobalOutlined,
  FileTextOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  DollarOutlined,
  FormOutlined,
  HomeOutlined,
  InsuranceOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';

export const DOCUMENTS_LIST = [
  { id: "doc_1", formName: "Passport Copy (All Pages)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 1, description: "Customer passport copy all pages", fillInstructions: "Upload clear scanned copy of passport (all pages including first, last and visa pages)", category: "Identity", icon: "IdcardOutlined", section: "customer" },
  { id: "doc_2", formName: "Emirates ID (Front & Back)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident"], isMandatory: true, requiresSignature: false, order: 2, description: "Emirates ID front and back", fillInstructions: "Upload clear copy of Emirates ID (front and back)", category: "Identity", icon: "IdcardOutlined", section: "customer" },
  { id: "doc_3", formName: "UAE Resident Visa", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE Resident"], isMandatory: true, requiresSignature: false, order: 3, description: "Valid UAE residence visa", fillInstructions: "Upload valid UAE residence visa copy", category: "Identity", icon: "GlobalOutlined", section: "customer" },
  { id: "doc_4", formName: "Other National ID", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["Non-Resident"], isMandatory: true, requiresSignature: false, order: 4, description: "National ID from home country", fillInstructions: "Upload clear copy of national ID from your home country", category: "Identity", icon: "IdcardOutlined", section: "customer" },
  { id: "doc_5", formName: "Passport Size Photo", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 5, description: "Passport size photograph", fillInstructions: "Upload recent passport size photo (white background)", category: "Identity", icon: "FileTextOutlined", section: "customer" },
  { id: "doc_6", formName: "Salary Certificate", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 6, description: "Salary certificate on company letterhead", fillInstructions: "Upload salary certificate stating position, joining date and monthly salary", category: "Employment", icon: "SolutionOutlined", section: "customer" },
  { id: "doc_7", formName: "Payslips (Last 3 months)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 7, description: "Last 3 months payslips", fillInstructions: "Upload last 3 months payslips (PDF format)", category: "Employment", icon: "FileTextOutlined", section: "customer" },
  { id: "doc_8", formName: "Employment Contract", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried"], applicableResidencyStatus: ["UAE Resident", "Non-Resident"], isMandatory: false, requiresSignature: false, order: 8, description: "Employment contract", fillInstructions: "Upload employment contract (recommended for expats)", category: "Employment", icon: "SolutionOutlined", section: "customer" },
  { id: "doc_9", formName: "Trade License", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 9, description: "Valid trade license", fillInstructions: "Upload valid trade license copy", category: "Employment", icon: "SafetyCertificateOutlined", section: "customer" },
  { id: "doc_10", formName: "Memorandum of Association (MOA)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 10, description: "Memorandum of Association", fillInstructions: "Upload MOA showing shareholding structure", category: "Employment", icon: "FileTextOutlined", section: "customer" },
  { id: "doc_11", formName: "Company Profile", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 11, description: "Company profile/brochure", fillInstructions: "Upload company profile or business brochure", category: "Employment", icon: "FileTextOutlined", section: "customer" },
  { id: "doc_12", formName: "Employee List", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident"], isMandatory: true, requiresSignature: false, order: 12, description: "List of employees", fillInstructions: "Upload employee list with names and designations", category: "Employment", icon: "TeamOutlined", section: "customer" },
  { id: "doc_13", formName: "Company Website URL", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: false, requiresSignature: false, order: 13, description: "Company website URL", fillInstructions: "Provide company website URL (required for non-residents)", category: "Employment", icon: "GlobalOutlined", section: "customer" },
  { id: "doc_14", formName: "CV / Resume", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["Non-Resident"], isMandatory: true, requiresSignature: false, order: 14, description: "Professional CV/Resume", fillInstructions: "Upload updated CV/Resume", category: "Employment", icon: "FileTextOutlined", section: "customer" },
  { id: "doc_15", formName: "Personal Bank Statement (6 months)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 15, description: "Last 6 months personal bank statement", fillInstructions: "Upload last 6 months bank statement showing salary credit", category: "Financial", icon: "DollarOutlined", section: "customer" },
  { id: "doc_16", formName: "Company Bank Statement (12 months)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 16, description: "Last 12 months company bank statement", fillInstructions: "Upload last 12 months company bank statement", category: "Financial", icon: "DollarOutlined", section: "customer" },
  { id: "doc_17", formName: "Credit Report (AECB)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["Non-Resident"], isMandatory: true, requiresSignature: false, order: 17, description: "AECB credit report", fillInstructions: "Upload AECB credit report (mandatory for non-residents)", category: "Financial", icon: "FileTextOutlined", section: "customer" },
  { id: "doc_18", formName: "Audit Report (Last 2 years)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 18, description: "Audited financial statements", fillInstructions: "Upload last 2 years audited financial statements", category: "Financial", icon: "FileTextOutlined", section: "customer" },
  { id: "doc_19", formName: "VAT Registration Certificate", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 19, description: "VAT registration certificate", fillInstructions: "Upload VAT registration certificate", category: "Financial", icon: "SafetyCertificateOutlined", section: "customer" },
  { id: "doc_20", formName: "VAT Return Reports (4 quarters)", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 20, description: "Last 4 quarters VAT returns", fillInstructions: "Upload last 4 quarters VAT return reports", category: "Financial", icon: "FileTextOutlined", section: "customer" },
  { id: "doc_21", formName: "Source of Funds Declaration", formType: "customer_document", formCategory: "Pre-Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: true, order: 21, description: "Source of funds declaration", fillInstructions: "Upload signed source of funds declaration form", category: "Financial", icon: "FormOutlined", section: "customer" },
  { id: "doc_22", formName: "Sales Purchase Agreement (SPA)", formType: "customer_document", formCategory: "Final Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 22, description: "Sales Purchase Agreement", fillInstructions: "Upload SPA signed by buyer and seller", category: "Property", icon: "HomeOutlined", section: "customer" },
  { id: "doc_23", formName: "Title Deed / Oqood", formType: "customer_document", formCategory: "Final Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 23, description: "Title deed or Oqood", fillInstructions: "Upload Title Deed or Oqood (for off-plan properties)", category: "Property", icon: "SafetyCertificateOutlined", section: "customer" },
  { id: "doc_24", formName: "Property Valuation Report", formType: "customer_document", formCategory: "Final Approval", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 24, description: "Property valuation report", fillInstructions: "Upload bank-approved property valuation report", category: "Property", icon: "FileTextOutlined", section: "customer" },
  { id: "doc_25", formName: "Property Insurance Certificate", formType: "customer_document", formCategory: "Disbursement", documentSource: "Customer", actionType: "direct_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: false, order: 25, description: "Property insurance certificate", fillInstructions: "Upload property insurance certificate covering the mortgaged property", category: "Insurance", icon: "InsuranceOutlined", section: "customer" },
  { id: "doc_26", formName: "Mortgage Application Form", formType: "application_form", formCategory: "Pre-Approval", documentSource: "Bank", actionType: "download_fill_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: true, order: 26, description: "Bank's official mortgage application form", fillInstructions: "DOWNLOAD THIS FORM → Fill all sections → Get customer signature → Upload back", category: "Bank Forms", icon: "FormOutlined", section: "bank", isDownloadable: true },
  { id: "doc_27", formName: "Credit Bureau Consent Form", formType: "consent_form", formCategory: "Pre-Approval", documentSource: "Bank", actionType: "download_fill_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: true, order: 27, description: "AECB credit check consent", fillInstructions: "DOWNLOAD THIS FORM → Customer signs → Upload back", category: "Bank Forms", icon: "CheckCircleOutlined", section: "bank", isDownloadable: true },
  { id: "doc_28", formName: "Terms & Fees Disclosure Form", formType: "disclosure_form", formCategory: "Pre-Approval", documentSource: "Bank", actionType: "download_fill_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: true, order: 28, description: "Product terms and fees acknowledgment", fillInstructions: "DOWNLOAD THIS FORM → Customer acknowledges terms → Sign → Upload back", category: "Bank Forms", icon: "InfoCircleOutlined", section: "bank", isDownloadable: true },
  { id: "doc_29", formName: "Direct Debit Authorization", formType: "consent_form", formCategory: "Disbursement", documentSource: "Bank", actionType: "download_fill_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident"], isMandatory: true, requiresSignature: true, order: 29, description: "UAEDDS direct debit authorization", fillInstructions: "DOWNLOAD THIS FORM → Customer authorizes auto-debit → Sign → Upload back", category: "Bank Forms", icon: "CloudUploadOutlined", section: "bank", isDownloadable: true },
  { id: "doc_30", formName: "Salary Transfer Undertaking", formType: "consent_form", formCategory: "Pre-Approval", documentSource: "Bank", actionType: "download_fill_upload", applicableEmploymentTypes: ["Salaried"], applicableResidencyStatus: ["UAE National", "UAE Resident"], isMandatory: true, requiresSignature: true, order: 30, description: "Salary transfer agreement", fillInstructions: "DOWNLOAD THIS FORM → Employer fills and signs → Upload back", category: "Bank Forms", icon: "SolutionOutlined", section: "bank", isDownloadable: true },
  { id: "doc_31", formName: "Property Declaration Form", formType: "disclosure_form", formCategory: "Final Approval", documentSource: "Bank", actionType: "download_fill_upload", applicableEmploymentTypes: ["Salaried", "Self-Employed"], applicableResidencyStatus: ["UAE National", "UAE Resident", "Non-Resident"], isMandatory: true, requiresSignature: true, order: 31, description: "Property details declaration", fillInstructions: "DOWNLOAD THIS FORM → Customer declares property details → Sign → Upload back", category: "Bank Forms", icon: "HomeOutlined", section: "bank", isDownloadable: true },
];

// Helper function to get document details by formName or documentType
export const getDocumentDetails = (formName, documentType) => {
  // Try to find by formName first
  let doc = DOCUMENTS_LIST.find(d => 
    d.formName.toLowerCase() === formName?.toLowerCase() ||
    d.formName.toLowerCase().includes(formName?.toLowerCase()?.split('(')[0]?.trim())
  );
  
  // If not found, try by documentType
  if (!doc && documentType) {
    doc = DOCUMENTS_LIST.find(d => 
      d.id === documentType ||
      d.formName.toLowerCase().includes(documentType.toLowerCase())
    );
  }
  
  return doc;
};

// Get icon component by name
export const getIconComponent = (
  iconName
) => {
  const icons = {
    IdcardOutlined,
    GlobalOutlined,
    FileTextOutlined,
    SolutionOutlined,
    SafetyCertificateOutlined,
    TeamOutlined,
    DollarOutlined,
    FormOutlined,
    HomeOutlined,
    InsuranceOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined,
    CloudUploadOutlined,
  };

  return (
    icons[iconName] ||
    FileTextOutlined
  );
};

// Get category for document
export const getDocumentCategoryFromList = (formName, documentType) => {
  const doc = getDocumentDetails(formName, documentType);
  return doc?.category || 'Other';
};

export default DOCUMENTS_LIST;