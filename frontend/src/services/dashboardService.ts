import { apiClient } from './api';

export interface ApiSupplierDashboard {
  invoiceSummary: {
    totalCount: number;
    pendingCount: number;
    approvedCount: number;
    partiallyPaidCount: number;
    paidCount: number;
    overdueCount: number;
    rejectedCount: number;
    totalInvoicedAmount: number;
    totalPaidAmount: number;
    totalOutstandingAmount: number;
    totalOverdueAmount: number;
  };
  cashFlowSummary: {
    currentCash: number;
    expectedIncome: number;
    expectedExpenses: number;
    projectedCash: number;
    workingCapitalGap: number;
    status: 'SUFFICIENT' | 'SHORTFALL';
  };
  buyerSummary: Array<{
    buyerId: string;
    buyerName: string;
    creditScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    outstandingAmount: number;
    overdueAmount: number;
  }>;
  financingSummary: {
    totalRequestsCount: number;
    pendingCount: number;
    disbursedAmount: number;
    requests: any[];
  };
  recentNotifications: any[];
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
  }>;
}

export interface ApiBuyerDashboard {
  invoiceSummary: {
    receivedCount: number;
    pendingVerificationCount: number;
    approvedCount: number;
    overduePayablesCount: number;
    totalPayableAmount: number;
    totalPaidAmount: number;
  };
  recentInvoices: any[];
  recentPayments: any[];
}

export interface ApiLenderDashboard {
  pendingQueueCount: number;
  totalDisbursedCapital: number;
  activeFacilitiesCount: number;
  outstandingExposure: number;
  repaidFacilitiesCount: number;
  financingRequests: any[];
  institution?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export interface ApiAdminDashboard {
  totalUsersCount: number;
  totalCompaniesCount: number;
  totalInvoicesCount: number;
  totalInvoicedVolume: number;
  totalFinancedVolume: number;
  systemStatus: string;
}

export interface DashboardApiResponse<T> {
  success: boolean;
  data?: {
    dashboard?: T;
  };
  message?: string;
}

export const getSupplierDashboard = async (): Promise<ApiSupplierDashboard | null> => {
  try {
    const response = await apiClient.get<DashboardApiResponse<ApiSupplierDashboard>>('/api/dashboard/supplier');
    if (response.data.success && response.data.data?.dashboard) {
      return response.data.data.dashboard;
    }
    return null;
  } catch {
    return null;
  }
};

export const getBuyerDashboard = async (): Promise<ApiBuyerDashboard | null> => {
  try {
    const response = await apiClient.get<DashboardApiResponse<ApiBuyerDashboard>>('/api/dashboard/buyer');
    if (response.data.success && response.data.data?.dashboard) {
      return response.data.data.dashboard;
    }
    return null;
  } catch {
    return null;
  }
};

export const getLenderDashboard = async (): Promise<ApiLenderDashboard | null> => {
  try {
    const response = await apiClient.get<DashboardApiResponse<ApiLenderDashboard>>('/api/dashboard/financial-institution');
    if (response.data.success && response.data.data?.dashboard) {
      return response.data.data.dashboard;
    }
    return null;
  } catch {
    return null;
  }
};

export const getAdminDashboard = async (): Promise<ApiAdminDashboard | null> => {
  try {
    const response = await apiClient.get<DashboardApiResponse<ApiAdminDashboard>>('/api/dashboard/admin');
    if (response.data.success && response.data.data?.dashboard) {
      return response.data.data.dashboard;
    }
    return null;
  } catch {
    return null;
  }
};
