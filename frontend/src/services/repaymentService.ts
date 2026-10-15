import { apiClient } from './api';

export interface RepaymentQueueItem {
  id: string;
  financingId: string;
  offerId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  disbursedAmount: number;
  totalRepaymentDue: number;
  amountRepaid: number;
  outstandingBalance: number;
  interestRate: number;
  tenureDays: number;
  processingFee: number;
  providerName: string;
  supplier: {
    id: string;
    name: string;
  };
  buyer: {
    id: string;
    name: string;
  };
  dueDate: string;
  daysRemaining: number;
  isOverdue: boolean;
  daysOverdue: number;
  status: string;
  disbursementMethod: string;
  createdAt: string;
}

export interface InstallmentItem {
  installmentNumber: number;
  dueDate: string;
  principal: number;
  interest: number;
  fees: number;
  totalDue: number;
  paidAmount: number;
  outstanding: number;
  status: string;
}

export interface DetailedRepayment extends RepaymentQueueItem {
  interest: number;
  schedule: InstallmentItem[];
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

export interface RecordRepaymentResult {
  request: any;
  audit: {
    repaymentId: string;
    status: 'REPAID';
    repaymentAmount: number;
    remainingBalance: number;
    recordedBy: string;
    recordedRole: string;
    institutionName: string;
    method: string;
    timestamp: string;
    notes?: string;
  };
}

export interface RepaymentQueryParams {
  q?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getRepaymentQueue = async (
  params: RepaymentQueryParams = {}
): Promise<{
  repayments: RepaymentQueueItem[];
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

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const response = await apiClient.get<any>(`/api/repayments/queue${queryString}`);

  if (response.data.success && response.data.data) {
    return response.data.data;
  }

  return {
    repayments: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  };
};

export const getRepaymentDetails = async (id: string): Promise<DetailedRepayment> => {
  const response = await apiClient.get<any>(`/api/repayments/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Financing transaction not found');
  }
  return response.data.data;
};

export const recordRepayment = async (
  id: string,
  amount: number,
  notes?: string
): Promise<RecordRepaymentResult> => {
  const response = await apiClient.post<any>(`/api/repayments/${id}/record`, { amount, notes });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to record repayment');
  }
  return response.data.data;
};
