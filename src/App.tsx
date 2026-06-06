import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import DashboardLayout from './components/layout/DashboardLayout';
import VaultLogin from './pages/login/VaultLogin';
import AuthCallback from './pages/login/AuthCallback';
import PrivateRoute, { RoleRedirect } from './auth/PrivateRoute';

// ── Lazy-load all vault-admin pages ─────────────────────────────
const VaultAdminDashboard     = lazy(() => import('./pages/vault-admin/VaultAdminDashboard'));
const MortgageopsDashboard    = lazy(() => import('./pages/vault-admin/MortgageopsDashboard'));
const VaultProfile            = lazy(() => import('./pages/vault-admin/profile/VaultProfile'));
// Agents
const VaultAgentlist          = lazy(() => import('./pages/vault-admin/agents/VaultAgentlist'));
const VaultAgentonboard       = lazy(() => import('./pages/vault-admin/agents/VaultAgentonboard'));
const VaultAgentdetails       = lazy(() => import('./pages/vault-admin/agents/VaultAgentdetails'));
const VaultAgentDocument      = lazy(() => import('./pages/vault-admin/agents/VaultAgentDocument'));
const VaultAgentLeadDetail    = lazy(() => import('./pages/vault-admin/agents/VaultAgentLeadDetail'));
const VaultAgentLeadViewAdvisor = lazy(() => import('./pages/vault-admin/agents/VaultAgentLeadViewAdvisor'));
const AgentsLeadFullView        = lazy(() => import('./pages/vault-admin/agents/AgentsLeadFullView'));
// Leads
const VaultAgentLeadList      = lazy(() => import('./pages/vault-admin/leads/VaultAgentLeadList'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const VaultAllLeads           = lazy(() => import('./pages/vault-admin/leads/VaultAllLeads'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const VaultLeadQueue          = lazy(() => import('./pages/vault-admin/leads/VaultLeadQueue'));
const LeadsVault              = lazy(() => import('./pages/vault-admin/leads/LeadsVault'));
const VaultLeadDetail         = lazy(() => import('./pages/vault-admin/leads/VaultLeadDetail'));
const VaultCreateLeads        = lazy(() => import('./pages/vault-admin/leads/VaultCreateLeads'));
const VaultLeadDetails        = lazy(() => import('./pages/vault-admin/leads/VaultLeadDetails'));
const VaultLeadDocuments      = lazy(() => import('./pages/vault-admin/leads/VaultLeadDocuments'));
const VaultLeadDocumentUpload = lazy(() => import('./pages/vault-admin/leads/VaultLeadDocumentUpload'));
const LoanEligibilitycheck    = lazy(() => import('./pages/vault-admin/leads/LoanEligibilitycheck'));
// Advisors
const VaultAdvisorlist        = lazy(() => import('./pages/vault-admin/advisors/VaultAdvisorlist'));
const VaultCreateadviosor     = lazy(() => import('./pages/vault-admin/advisors/VaultCreateadviosor'));
const VaultAdvisordetail      = lazy(() => import('./pages/vault-admin/advisors/VaultAdvisordetail'));
const VaultAdvisorLeads       = lazy(() => import('./pages/vault-admin/advisors/VaultAdvisorLeads'));
// Mortgages
const VaultMortgagelist       = lazy(() => import('./pages/vault-admin/mortgages/VaultMortgagelist'));
const VaultCreatemortgage     = lazy(() => import('./pages/vault-admin/mortgages/VaultCreatemortgage'));
const VaultMortgagedetail     = lazy(() => import('./pages/vault-admin/mortgages/VaultMortgagedetail'));
// Partners
const VaultPartners           = lazy(() => import('./pages/vault-admin/partners/VaultPartners'));
const PartnerDetail           = lazy(() => import('./pages/vault-admin/partners/PartnerDetail'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const PartnerList             = lazy(() => import('./pages/vault-admin/partners/PartnerList'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const CommissionManagement    = lazy(() => import('./pages/vault-admin/commission/CommissionManagement'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const AnalyticsReporting      = lazy(() => import('./pages/vault-admin/analytics/AnalyticsReporting'));
// Cases
const CreateCase              = lazy(() => import('./pages/vault-admin/cases/CreateCase'));
const ViewCases               = lazy(() => import('./pages/vault-admin/cases/ViewCases'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const AdvisorViewCases        = lazy(() => import('./pages/vault-admin/cases/AdvisorViewCases'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const AdvisorCaseDetail       = lazy(() => import('./pages/vault-admin/cases/AdvisorCaseDetail'));
const ProcessCasesUpdates     = lazy(() => import('./pages/vault-admin/cases/ProcessCasesUpdates'));
const AdminManagecases        = lazy(() => import('./pages/vault-admin/cases/AdminManagecases'));
const DetailedViewCases       = lazy(() => import('./pages/vault-admin/cases/DetailedViewCases'));
const DisbursedCases          = lazy(() => import('./pages/vault-admin/cases/DisbursedCases'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const BankSubmissionQueue     = lazy(() => import('./pages/vault-admin/cases/BankSubmissionQueue'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const ReturnedCases           = lazy(() => import('./pages/vault-admin/cases/ReturnedCases'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const OpsQueueView            = lazy(() => import('./pages/vault-admin/cases/OpsQueueView'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const AdminCaseDetail         = lazy(() => import('./pages/vault-admin/cases/AdminCaseDetail'));
const OpsAssignedcases        = lazy(() => import('./pages/vault-admin/cases/OpsAssignedcases'));
const OpsAssignedReview       = lazy(() => import('./pages/vault-admin/cases/OpsAssignedReview'));
const OpsCaseDetails          = lazy(() => import('./pages/vault-admin/cases/OpsCaseDetails'));
// Notifications
const NotificationsPage       = lazy(() => import('./pages/notifications/NotificationsPage'));
// Audit
const AuditPage               = lazy(() => import('./pages/audit/AuditPage'));
const PlatformConfig          = lazy(() => import('./pages/vault-admin/settings/PlatformConfig'));
// Proposals
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const ProposalList           = lazy(() => import('./pages/vault-admin/proposals/ViewProposal'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const CreateProposal         = lazy(() => import('./pages/vault-admin/proposals/CreateProposal'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const ProposalDetail         = lazy(() => import('./pages/vault-admin/proposals/ProposalDetail'));
// Bank
const BankProducts            = lazy(() => import('./pages/vault-admin/bank/BankProducts'));
const BankProductManagement   = lazy(() => import('./pages/vault-admin/bank/BankProductManagement'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const BankProductView         = lazy(() => import('./pages/vault-admin/bank/Bankproductview'));
const BankList                = lazy(() => import('./pages/vault-admin/bank/BankList'));
const BankManagement          = lazy(() => import('./pages/vault-admin/bank/BankManagement'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const BankDetail              = lazy(() => import('./pages/vault-admin/bank/BankDetail'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const DocumentLibrary         = lazy(() => import('./pages/vault-admin/documents/DocumentLibrary'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const GlobalDocumentLibrary   = lazy(() => import('./pages/vault-admin/documents/GlobalDocumentLibrary'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const BankDocumentLibrary     = lazy(() => import('./pages/vault-admin/documents/BankDocumentLibrary'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const DocumentLibraryManagement = lazy(() => import('./pages/vault-admin/documents/DocumentLibraryManagement'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const AddGlobalDocument = lazy(() => import('./pages/vault-admin/documents/AddGlobalDocument'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const AddBankDocument = lazy(() => import('./pages/vault-admin/documents/AddBankDocument'));
// Customers
// @ts-ignore
const VaultCustomerList    = lazy(() => import('./pages/vault-admin/customers/VaultCustomerList'));
// @ts-ignore
const VaultCustomerProfile = lazy(() => import('./pages/vault-admin/customers/VaultCustomerProfile'));
// Partner pages
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const PartnerAffiliatedAgents = lazy(() => import('./pages/vault-partner/PartnerAffiliatedAgents'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const PartnerOnboardAgent     = lazy(() => import('./pages/vault-partner/PartnerOnboardAgent'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const PartnerAgentDetail      = lazy(() => import('./pages/vault-partner/PartnerAgentDetail'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const PartnerLeadDetail       = lazy(() => import('./pages/vault-partner/PartnerLeadDetail'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const PartnerBankProducts     = lazy(() => import('./pages/vault-partner/PartnerBankProducts'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const PartnerBankProductView  = lazy(() => import('./pages/vault-partner/PartnerBankProductView'));
const PartnerCommission       = lazy(() => import('./pages/vault-partner/PartnerCommission'));
const PartnerAnalytics        = lazy(() => import('./pages/vault-partner/PartnerAnalytics'));
const VaultAgentCommission    = lazy(() => import('./pages/vaultagent/Commission'));
const VaultAgentAnalytics     = lazy(() => import('./pages/vaultagent/Analytics'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const VaultAgentProfile       = lazy(() => import('./pages/vault-admin/profile/VaultAgentProfile'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const VaultAgentUpdateProfile = lazy(() => import('./pages/vaultagent/VaultAgentUpdateProfile'));
// Other role dashboards
const VaultOpsDashboard       = lazy(() => import('./pages/dashboard/VaultOpsDashboard'));
const VaultAdvisorDashboard   = lazy(() => import('./pages/dashboard/VaultAdvisorDashboard'));
const VaultAgentDashboard     = lazy(() => import('./pages/dashboard/VaultAgentDashboard'));
const VaultPartnerDashboard   = lazy(() => import('./pages/dashboard/VaultPartnerDashboard'));

const PageLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Spin size="large" />
  </div>
);

const Unauthorized: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
    <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center mb-6">
      <i className="fas fa-lock text-3xl text-red-500" />
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
    <p className="text-gray-500 mb-6">You do not have permission to access this area.</p>
    <a href="/login" className="px-6 py-3 rounded-xl text-white font-semibold"
      style={{ background: 'linear-gradient(135deg, #5C039B, #03A4F4)' }}>
      Back to Login
    </a>
  </div>
);

const App: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    
    <Routes>
      {/* ── Public ── */}
      <Route path="/login" element={<VaultLogin />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* ══════════════ VAULT ADMIN (role 18) ══════════════ */}
      <Route path="/dashboard/vault-admin/*"
        element={<PrivateRoute allowedRoleCodes={['18']}><DashboardLayout /></PrivateRoute>}>
        <Route index element={<VaultAdminDashboard />} />
        <Route path="profile" element={<VaultProfile />} />
        {/* Agents */}
        <Route path="vault/agent-list" element={<VaultAgentlist />} />
        <Route path="agent-onboard" element={<VaultAgentonboard />} />
        <Route path="agent/:id" element={<VaultAgentdetails />} />
        <Route path="agent-details/:id" element={<VaultAgentdetails />} />
        <Route path="agent/:id/documents" element={<VaultAgentDocument />} />
        <Route path="agent/lead/:id" element={<VaultAgentLeadDetail />} />
        <Route path="agent/lead/:id/advisor" element={<VaultAgentLeadViewAdvisor />} />
        {/* Leads */}
        <Route path="vault/agent-leads" element={<VaultAllLeads />} />
        <Route path="vault/agent-leads/unassigned" element={<VaultLeadQueue />} />
        <Route path="leads/bulk-upload" element={<VaultLeadQueue />} />
        <Route path="leads/create" element={<VaultCreateLeads />} />
        <Route path="leads/:leadId" element={<VaultLeadDetails />} />
        <Route path="vault/lead/:id" element={<AgentsLeadFullView />} />
        <Route path="vault/lead/:id/eligibility" element={<LoanEligibilitycheck />} />
        <Route path="vault/lead/:leadId/documents" element={<VaultLeadDocuments />} />
        {/* Advisors */}
        <Route path="advisor/list" element={<VaultAdvisorlist />} />
        <Route path="create/vault-advisor" element={<VaultCreateadviosor />} />
        <Route path="advisor/:id" element={<VaultAdvisordetail />} />
        <Route path="advisor/:advisorId/leads" element={<VaultAdvisorLeads />} />
        <Route path="advisor/dashboard" element={<MortgageopsDashboard />} />
        {/* Mortgages */}
        <Route path="mortgage-ops/list" element={<VaultMortgagelist />} />
        <Route path="mortgage-ops/create" element={<VaultCreatemortgage />} />
        <Route path="mortgage-ops/:id" element={<VaultMortgagedetail />} />
        <Route path="mortgage/dashboard" element={<MortgageopsDashboard />} />
        {/* Proposals */}
        <Route path="proposals" element={<ProposalList />} />
        <Route path="proposals/list" element={<ProposalList />} />
        <Route path="proposals/view" element={<ProposalList />} />
        <Route path="proposals/create" element={<CreateProposal />} />
        <Route path="proposals/:id" element={<ProposalDetail />} />
        {/* Cases */}
        <Route path="case/create" element={<CreateCase />} />
        <Route path="case/view" element={<ViewCases />} />
        <Route path="case/view/all" element={<ProcessCasesUpdates />} />
        <Route path="case/manage" element={<AdminManagecases />} />
        <Route path="case/view/:caseId" element={<AdminCaseDetail />} />
        <Route path="case/disbursed" element={<DisbursedCases />} />
        <Route path="case/bank-submission" element={<BankSubmissionQueue />} />
        <Route path="case/returned" element={<ReturnedCases />} />
        <Route path="case/queue/view" element={<OpsQueueView />} />
        <Route path="case/assigned/all" element={<OpsAssignedcases />} />
        <Route path="case/assigned/view/:caseId" element={<OpsAssignedReview />} />
        <Route path="case/review/:caseId" element={<OpsAssignedReview />} />
        <Route path="case/details/:caseId" element={<OpsCaseDetails />} />
        {/* Document Library */}
        <Route path="documents" element={<DocumentLibrary />} />
        <Route path="documents/global" element={<GlobalDocumentLibrary />} />
        <Route path="documents/global/add" element={<AddGlobalDocument />} />
        <Route path="documents/bank" element={<BankDocumentLibrary />} />
        <Route path="documents/bank/:bankId" element={<BankDocumentLibrary />} />
        <Route path="documents/bank/:bankId/add" element={<AddBankDocument />} />
        <Route path="documents/bank-add" element={<AddBankDocument />} />
        <Route path="documents/manage" element={<DocumentLibraryManagement />} />
        <Route path="documents/manage/:docId" element={<DocumentLibraryManagement />} />
        {/* Bank Library */}
        <Route path="bank/list" element={<BankList />} />
        <Route path="bank/view/:bankId" element={<BankDetail />} />
        <Route path="bank/manage" element={<BankManagement />} />
        <Route path="bank/manage/:bankId" element={<BankManagement />} />
        <Route path="bank/products" element={<BankProducts />} />
        <Route path="bank/products/manage" element={<BankProductManagement />} />
        <Route path="bank/products/manage/:productId" element={<BankProductManagement />} />
        <Route path="bank/products/view/:productId" element={<BankProductView />} />
        {/* Partners */}
        <Route path="partners" element={<VaultPartners />} />
        <Route path="partners/onboard" element={<VaultPartners />} />
        <Route path="partners/list" element={<PartnerList />} />
        <Route path="partners/:partnerId" element={<PartnerDetail />} />
        <Route path="partner-details/:partnerId" element={<PartnerDetail />} />
        {/* Customers */}
        <Route path="customers" element={<VaultCustomerList />} />
        <Route path="customers/:customerId" element={<VaultCustomerProfile />} />
        {/* Commission & Analytics */}
        <Route path="commission" element={<CommissionManagement />} />
        <Route path="analytics" element={<AnalyticsReporting />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="platform-config" element={<PlatformConfig />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="/dashboard/vault-admin" replace />} />
      </Route>

      {/* ══════════════ VAULT OPS (role 23) ══════════════ */}
      <Route path="/dashboard/vault-ops/*"
        element={<PrivateRoute allowedRoleCodes={['23']}><DashboardLayout /></PrivateRoute>}>
        <Route index element={<VaultOpsDashboard />} />
        <Route path="profile" element={<VaultProfile />} />
        <Route path="case/queue/view" element={<OpsQueueView />} />
        <Route path="case/assigned/all" element={<OpsAssignedcases />} />
        <Route path="case/assigned/view/:caseId" element={<OpsAssignedReview />} />
        <Route path="case/view/all" element={<ProcessCasesUpdates />} />
        <Route path="case/disbursed" element={<DisbursedCases />} />
        <Route path="case/bank-submission" element={<BankSubmissionQueue />} />
        <Route path="case/returned" element={<ReturnedCases />} />
        <Route path="case/view/:caseId" element={<OpsAssignedReview />} />
        <Route path="case/review/:caseId" element={<OpsAssignedReview />} />
        <Route path="case/details/:caseId" element={<OpsCaseDetails />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="/dashboard/vault-ops" replace />} />
      </Route>

      {/* ══════════════ VAULT ADVISOR (role 26) ══════════════ */}
      <Route path="/dashboard/vault-advisor/*"
        element={<PrivateRoute allowedRoleCodes={['26']}><DashboardLayout /></PrivateRoute>}>
        <Route index element={<VaultAdvisorDashboard />} />
        <Route path="profile" element={<VaultProfile />} />
        <Route path="leads" element={<LeadsVault />} />
        <Route path="leads/:leadId" element={<VaultLeadDetail />} />
        <Route path="leads/:leadId/documents" element={<VaultLeadDocuments />} />
        <Route path="vault/lead/:id" element={<AgentsLeadFullView />} />
        <Route path="vault/lead/:id/eligibility" element={<LoanEligibilitycheck />} />
        <Route path="vault/lead/documents/:leadId" element={<VaultLeadDocumentUpload />} />
        <Route path="proposals" element={<ProposalList />} />
        <Route path="proposals/list" element={<ProposalList />} />
        <Route path="proposals/view" element={<ProposalList />} />
        <Route path="proposals/create" element={<CreateProposal />} />
        <Route path="proposals/:id" element={<ProposalDetail />} />
        <Route path="case/create" element={<CreateCase />} />
        <Route path="case/view" element={<AdvisorViewCases />} />
        <Route path="case/view/all" element={<ProcessCasesUpdates />} />
        <Route path="case/view/:caseId" element={<AdvisorCaseDetail />} />
        <Route path="bank/products" element={<PartnerBankProducts />} />
        <Route path="bank/products/:productId" element={<PartnerBankProductView />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<Navigate to="/dashboard/vault-advisor" replace />} />
      </Route>

      {/* ══════════════ VAULT AGENT (role 22) ══════════════
           Both PartnerAffiliatedAgent and ReferralPartner share this
           route tree. Sidebar shows role-specific items based on agentType.
      ══════════════════════════════════════════════════════ */}
      <Route path="/dashboard/vaultagent/*"
        element={<PrivateRoute allowedRoleCodes={['22']}><DashboardLayout /></PrivateRoute>}>
        <Route index element={<VaultAgentDashboard />} />
        <Route path="profile" element={<VaultAgentProfile />} />
        <Route path="update-profile" element={<VaultAgentUpdateProfile />} />

        {/* ── Leads ── */}
        <Route path="leads/create" element={<VaultCreateLeads />} />
        <Route path="leads" element={<LeadsVault />} />
        {/* Direct lead list for PartnerAffiliatedAgent — same VaultAgentLeadList as partner, no dispatcher */}
        <Route path="partner-leads" element={<VaultAgentLeadList />} />
        <Route path="leads/:leadId" element={<VaultLeadDetails />} />
        <Route path="leads/:leadId/documents" element={<VaultLeadDocuments />} />
        {/* Full lead detail with eligibility (same page as partner/advisor) */}
        <Route path="vault/lead/:id" element={<AgentsLeadFullView />} />
        <Route path="vault/lead/:id/eligibility" element={<LoanEligibilitycheck />} />
        <Route path="vault/lead/documents/:leadId" element={<VaultLeadDocumentUpload />} />

        {/* ── Proposals (PartnerAffiliatedAgent only — sidebar controls visibility) ── */}
        <Route path="proposals/list"   element={<ProposalList />} />
        <Route path="proposals/create" element={<CreateProposal />} />
        <Route path="proposals/:id"    element={<ProposalDetail />} />

        {/* ── Cases (PartnerAffiliatedAgent only) ── */}
        <Route path="case/create"      element={<CreateCase />} />
        <Route path="case/view"        element={<AdvisorViewCases />} />
        <Route path="case/view/all"    element={<ProcessCasesUpdates />} />
        <Route path="case/view/:caseId" element={<AdvisorCaseDetail />} />

        {/* ── Bank products ── */}
        <Route path="bank/products"    element={<PartnerBankProducts />} />
        <Route path="bank/products/:productId" element={<PartnerBankProductView />} />

        {/* ── Common ── */}
        <Route path="commission"   element={<VaultAgentCommission />} />
        <Route path="analytics"    element={<VaultAgentAnalytics />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<Navigate to="/dashboard/vaultagent" replace />} />
      </Route>

      {/* ══════════════ VAULT PARTNER (role 21) ══════════════ */}
      <Route path="/dashboard/vaultpartner/*"
        element={<PrivateRoute allowedRoleCodes={['21']}><DashboardLayout /></PrivateRoute>}>
        <Route index element={<VaultPartnerDashboard />} />
        <Route path="profile" element={<VaultProfile />} />
        <Route path="leads/partner/create" element={<VaultCreateLeads />} />
        <Route path="partner-leads" element={<VaultAgentLeadList />} />
        <Route path="vault/lead/:id" element={<PartnerLeadDetail />} />
        <Route path="agents/list" element={<PartnerAffiliatedAgents />} />
        <Route path="agents/onboard" element={<PartnerOnboardAgent />} />
        <Route path="agents/:id" element={<PartnerAgentDetail />} />
                <Route path="vault/lead/:id/eligibility" element={<LoanEligibilitycheck />} />
        <Route path="case/create" element={<CreateCase />} />

        <Route path="leads/:leadId" element={<VaultLeadDetail />} />
        <Route path="leads/:leadId/documents" element={<VaultLeadDocuments />} />
        <Route path="bank/products" element={<PartnerBankProducts />} />
        <Route path="bank/products/:productId" element={<PartnerBankProductView />} />
        <Route path="commission" element={<PartnerCommission />} />
        <Route path="analytics" element={<PartnerAnalytics />} />
        <Route path="proposals" element={<ProposalList />} />
        <Route path="proposals/list" element={<ProposalList />} />
        <Route path="proposals/view" element={<ProposalList />} />
        <Route path="proposals/create" element={<CreateProposal />} />
        <Route path="proposals/:id" element={<ProposalDetail />} />
        <Route path="case/view" element={<AdvisorViewCases />} />
        <Route path="case/view/all" element={<ProcessCasesUpdates />} />
        <Route path="case/view/:caseId" element={<AdvisorCaseDetail />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<Navigate to="/dashboard/vaultpartner" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </Suspense>
);

export default App;
