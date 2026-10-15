import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/models';

interface ProtectedRouteProps {
  allowedRoles: Role[];
  loginPath: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, loginPath }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="flex items-center space-x-3 text-sm text-[#737373] font-medium">
          <div className="w-5 h-5 border-2 border-[#ea580c] border-t-transparent rounded-full animate-spin" />
          <span>Verifying portal authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={loginPath} replace />;
  }

  // Allow ADMIN to view all portals, otherwise enforce role match
  const hasAccess = allowedRoles.includes(user.role as Role) || user.role === 'ADMIN';

  if (!hasAccess) {
    // Determine user's authorized home dashboard
    let authorizedHome = '/supplier/dashboard';
    if (user.role === 'BUYER') authorizedHome = '/buyer/dashboard';
    else if (user.role === 'FINANCIAL_INSTITUTION') authorizedHome = '/finance/dashboard';
    else if (user.role === 'ADMIN') authorizedHome = '/admin/dashboard';

    return <Navigate to={authorizedHome} replace />;
  }

  return <Outlet />;
};

export const SupplierRoute = () => <ProtectedRoute allowedRoles={['SUPPLIER']} loginPath="/supplier/login" />;
export const BuyerRoute = () => <ProtectedRoute allowedRoles={['BUYER']} loginPath="/buyer/login" />;
export const FinancierRoute = () => <ProtectedRoute allowedRoles={['FINANCIAL_INSTITUTION']} loginPath="/financier/login" />;
export const AdminRoute = () => <ProtectedRoute allowedRoles={['ADMIN']} loginPath="/admin/login" />;
