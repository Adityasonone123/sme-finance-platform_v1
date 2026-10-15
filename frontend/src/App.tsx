import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DemoDataProvider } from './context/DemoDataContext';

// Route Guards
import {
  SupplierRoute,
  BuyerRoute,
  FinancierRoute,
  AdminRoute,
} from './components/auth/ProtectedRoutes';

// Layouts
import { AppLayout } from './layouts/AppLayout';
import { BuyerLayout } from './layouts/BuyerLayout';
import { FinanceLayout } from './layouts/FinanceLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Supplier Pages
import { SupplierDashboard } from './pages/supplier/SupplierDashboard';
import { InvoiceListPage } from './pages/supplier/InvoiceListPage';
import { CreateInvoicePage } from './pages/supplier/CreateInvoicePage';
import { InvoiceDetailsPage } from './pages/supplier/InvoiceDetailsPage';
import { PaymentsPage } from './pages/supplier/PaymentsPage';
import { CashFlowPage } from './pages/supplier/CashFlowPage';
import { BuyersPage } from './pages/supplier/BuyersPage';
import { BuyerDetailsPage } from './pages/supplier/BuyerDetailsPage';
import { FinancingPage } from './pages/supplier/FinancingPage';
import { FinancingDetailsPage } from './pages/supplier/FinancingDetailsPage';
import { NotificationsPage } from './pages/supplier/NotificationsPage';
import { ProfilePage } from './pages/supplier/ProfilePage';

// Buyer Portal Pages
import { BuyerDashboard } from './pages/buyer/BuyerDashboard';
import { BuyerInvoicesPage } from './pages/buyer/BuyerInvoicesPage';
import { BuyerInvoiceDetailsPage } from './pages/buyer/BuyerInvoiceDetailsPage';
import { BuyerPaymentsPage } from './pages/buyer/BuyerPaymentsPage';
import { BuyerSuppliersPage } from './pages/buyer/BuyerSuppliersPage';
import { BuyerProfilePage } from './pages/buyer/BuyerProfilePage';

// Financier Portal Pages
import { FinanceDashboard } from './pages/finance/FinanceDashboard';
import { FinancierMarketplacePage } from './pages/finance/FinancierMarketplacePage';
import { OpportunityDetailsPage } from './pages/finance/OpportunityDetailsPage';
import { FinanceRequestsPage } from './pages/finance/FinanceRequestsPage';
import { FinanceRequestDetailsPage } from './pages/finance/FinanceRequestDetailsPage';
import { FinanceOffersPage } from './pages/finance/FinanceOffersPage';
import { FinanceOfferDetailsPage } from './pages/finance/FinanceOfferDetailsPage';
import { FinanceDisbursementsPage } from './pages/finance/FinanceDisbursementsPage';
import { FinanceDisbursementDetailsPage } from './pages/finance/FinanceDisbursementDetailsPage';
import { FinanceRepaymentsPage } from './pages/finance/FinanceRepaymentsPage';
import { FinanceRepaymentDetailsPage } from './pages/finance/FinanceRepaymentDetailsPage';
import { FinancePortfolioPage } from './pages/finance/FinancePortfolioPage';
import { FinancePortfolioDetailsPage } from './pages/finance/FinancePortfolioDetailsPage';
import { FinanceProfilePage } from './pages/finance/FinanceProfilePage';
import { FinanceNotificationsPage } from './pages/finance/FinanceNotificationsPage';

// Admin Portal Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCompaniesPage } from './pages/admin/AdminCompaniesPage';
import { AdminInvoicesPage } from './pages/admin/AdminInvoicesPage';
import { AdminFinancingPage } from './pages/admin/AdminFinancingPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export function App() {
  return (
    <AuthProvider>
      <DemoDataProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage targetRole="SUPPLIER" />} />
            <Route path="/supplier/login" element={<LoginPage targetRole="SUPPLIER" />} />
            <Route path="/buyer/login" element={<LoginPage targetRole="BUYER" />} />
            <Route path="/financier/login" element={<LoginPage targetRole="FINANCIAL_INSTITUTION" />} />
            <Route path="/finance/login" element={<LoginPage targetRole="FINANCIAL_INSTITUTION" />} />
            <Route path="/admin/login" element={<LoginPage targetRole="ADMIN" />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Supplier Portal Routes (Protected) */}
            <Route element={<SupplierRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
                <Route path="/dashboard" element={<SupplierDashboard />} />
                <Route path="/supplier/invoices" element={<InvoiceListPage />} />
                <Route path="/invoices" element={<InvoiceListPage />} />
                <Route path="/supplier/invoices/new" element={<CreateInvoicePage />} />
                <Route path="/invoices/new" element={<CreateInvoicePage />} />
                <Route path="/supplier/invoices/:id" element={<InvoiceDetailsPage />} />
                <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
                <Route path="/supplier/payments" element={<PaymentsPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/supplier/cash-flow" element={<CashFlowPage />} />
                <Route path="/cash-flow" element={<CashFlowPage />} />
                <Route path="/supplier/buyers" element={<BuyersPage />} />
                <Route path="/buyers" element={<BuyersPage />} />
                <Route path="/supplier/buyers/:id" element={<BuyerDetailsPage />} />
                <Route path="/buyers/:id" element={<BuyerDetailsPage />} />
                <Route path="/supplier/financing" element={<FinancingPage />} />
                <Route path="/financing" element={<FinancingPage />} />
                <Route path="/supplier/financing/:id" element={<FinancingDetailsPage />} />
                <Route path="/financing/:id" element={<FinancingDetailsPage />} />
                <Route path="/supplier/notifications" element={<NotificationsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/supplier/profile" element={<ProfilePage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Corporate Buyer Portal Routes (Protected) */}
            <Route element={<BuyerRoute />}>
              <Route element={<BuyerLayout />}>
                <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
                <Route path="/buyer/invoices" element={<BuyerInvoicesPage />} />
                <Route path="/buyer/invoices/:id" element={<BuyerInvoiceDetailsPage />} />
                <Route path="/buyer/payments" element={<BuyerPaymentsPage />} />
                <Route path="/buyer/suppliers" element={<BuyerSuppliersPage />} />
                <Route path="/buyer/profile" element={<BuyerProfilePage />} />
              </Route>
            </Route>

            {/* Financial Institution Portal Routes (Protected) */}
            <Route element={<FinancierRoute />}>
              <Route element={<FinanceLayout />}>
                <Route path="/financier/dashboard" element={<FinanceDashboard />} />
                <Route path="/finance/dashboard" element={<FinanceDashboard />} />
                <Route path="/financier/marketplace" element={<FinancierMarketplacePage />} />
                <Route path="/finance/marketplace" element={<FinancierMarketplacePage />} />
                <Route path="/financier/marketplace/:id" element={<OpportunityDetailsPage />} />
                <Route path="/finance/marketplace/:id" element={<OpportunityDetailsPage />} />
                <Route path="/financier/requests" element={<FinanceRequestsPage />} />
                <Route path="/finance/requests" element={<FinanceRequestsPage />} />
                <Route path="/financier/underwriting" element={<FinanceRequestsPage />} />
                <Route path="/finance/underwriting" element={<FinanceRequestsPage />} />
                <Route path="/financier/requests/:id" element={<FinanceRequestDetailsPage />} />
                <Route path="/finance/requests/:id" element={<FinanceRequestDetailsPage />} />
                <Route path="/financier/underwriting/:id" element={<FinanceRequestDetailsPage />} />
                <Route path="/finance/underwriting/:id" element={<FinanceRequestDetailsPage />} />
                <Route path="/financier/offers" element={<FinanceOffersPage />} />
                <Route path="/finance/offers" element={<FinanceOffersPage />} />
                <Route path="/financier/offers/:id" element={<FinanceOfferDetailsPage />} />
                <Route path="/finance/offers/:id" element={<FinanceOfferDetailsPage />} />
                <Route path="/financier/disbursements" element={<FinanceDisbursementsPage />} />
                <Route path="/finance/disbursements" element={<FinanceDisbursementsPage />} />
                <Route path="/financier/disbursements/:id" element={<FinanceDisbursementDetailsPage />} />
                <Route path="/finance/disbursements/:id" element={<FinanceDisbursementDetailsPage />} />
                <Route path="/financier/repayments" element={<FinanceRepaymentsPage />} />
                <Route path="/finance/repayments" element={<FinanceRepaymentsPage />} />
                <Route path="/financier/repayments/:id" element={<FinanceRepaymentDetailsPage />} />
                <Route path="/finance/repayments/:id" element={<FinanceRepaymentDetailsPage />} />
                <Route path="/financier/portfolio" element={<FinancePortfolioPage />} />
                <Route path="/finance/portfolio" element={<FinancePortfolioPage />} />
                <Route path="/financier/portfolio/:id" element={<FinancePortfolioDetailsPage />} />
                <Route path="/finance/portfolio/:id" element={<FinancePortfolioDetailsPage />} />
                <Route path="/financier/profile" element={<FinanceProfilePage />} />
                <Route path="/finance/profile" element={<FinanceProfilePage />} />
                <Route path="/financier/notifications" element={<FinanceNotificationsPage />} />
                <Route path="/finance/notifications" element={<FinanceNotificationsPage />} />
              </Route>
            </Route>

            {/* Admin Console Routes (Protected) */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/companies" element={<AdminCompaniesPage />} />
                <Route path="/admin/invoices" element={<AdminInvoicesPage />} />
                <Route path="/admin/financing" element={<AdminFinancingPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DemoDataProvider>
    </AuthProvider>
  );
}

export default App;
