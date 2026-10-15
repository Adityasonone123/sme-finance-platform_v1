import { apiClient } from './api';

export interface PortfolioMetrics {
  totalDisbursed: number;
  totalRepaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  activeCount: number;
  settledCount: number;
  totalTransactions: number;
  onTimeRepaymentRate: number;
  overdueRate: number;
}

export interface BuyerExposure {
  buyerId: string;
  buyerName: string;
  totalDisbursed: number;
  outstanding: number;
  overdue: number;
  transactionCount: number;
  paymentScore: number;
  riskCategory: string;
  concentrationPercent: number;
  riskWarning?: string | null;
}

export interface PortfolioItem {
  id: string;
  financingId: string;
  offerId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  disbursedAmount: number;
  totalRepaymentDue: number;
  amountRepaid: number;
  outstanding: number;
  interestRate: number;
  tenureDays: number;
  dueDate: string;
  daysRemaining: number;
  isOverdue: boolean;
  daysOverdue: number;
  status: string;
  riskIndicator: string;
  supplier: {
    id: string;
    name: string;
  };
  buyer: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface TimelineEvent {
  event: string;
  date: string;
  status: 'COMPLETED' | 'PENDING';
}

export interface DetailedPortfolio extends PortfolioItem {
  processingFee: number;
  interest: number;
  providerName: string;
  buyerScore: {
    score: number;
    riskCategory: string;
  };
  timeline: TimelineEvent[];
  supplier: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  buyer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  };
}

export interface PortfolioQueryParams {
  q?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  dateRange?: string;
}

export const getPortfolioOverview = async (
  dateRange: string = 'ALL'
): Promise<{ metrics: PortfolioMetrics; buyerExposures: BuyerExposure[] }> => {
  const response = await apiClient.get<any>(`/api/portfolio/overview?dateRange=${dateRange}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  return {
    metrics: {
      totalDisbursed: 0,
      totalRepaid: 0,
      totalOutstanding: 0,
      overdueAmount: 0,
      activeCount: 0,
      settledCount: 0,
      totalTransactions: 0,
      onTimeRepaymentRate: 100,
      overdueRate: 0,
    },
    buyerExposures: [],
  };
};

export const getPortfolioList = async (
  params: PortfolioQueryParams = {}
): Promise<{
  portfolio: PortfolioItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> => {
  const queryParts: string[] = [];
  if (params.q) queryParts.push(`q=${encodeURIComponent(params.q)}`);
  if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params.minAmount) queryParts.push(`minAmount=${params.minAmount}`);
  if (params.maxAmount) queryParts.push(`maxAmount=${params.maxAmount}`);
  if (params.sortBy) queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
  if (params.sortOrder) queryParts.push(`sortOrder=${params.sortOrder}`);
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);
  if (params.dateRange) queryParts.push(`dateRange=${encodeURIComponent(params.dateRange)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const response = await apiClient.get<any>(`/api/portfolio/list${queryString}`);

  if (response.data.success && response.data.data) {
    return response.data.data;
  }

  return {
    portfolio: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  };
};

export const getPortfolioDetails = async (id: string): Promise<DetailedPortfolio> => {
  const response = await apiClient.get<any>(`/api/portfolio/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Portfolio financing transaction not found');
  }
  return response.data.data;
};
