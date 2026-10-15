import { apiClient } from './api';

export interface UnderwritingQueueItem {
  id: string;
  requestId: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  requestedAmount: number;
  approvedAmount?: number | null;
  dueDate: string;
  remainingTenorDays: number;
  status: string;
  supplier: {
    id: string;
    name: string;
  };
  buyer: {
    id: string;
    name: string;
    paymentScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  createdAt: string;
}

export interface UnderwritingCheckItem {
  id: string;
  name: string;
  category: 'INVOICE' | 'BUYER' | 'RELATIONSHIP' | 'LIMITS' | 'TENOR';
  result: 'PASS' | 'WARNING' | 'FAIL';
  detail: string;
}

export interface UnderwritingDetailsData {
  request: {
    id: string;
    requestId: string;
    invoiceId: string;
    invoiceNumber: string;
    invoiceAmount: number;
    requestedAmount: number;
    approvedAmount?: number | null;
    interestRate: number;
    tenureDays: number;
    issueDate: string;
    dueDate: string;
    remainingTenorDays: number;
    paymentTermsDays: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  supplier: {
    id: string;
    name: string;
    gstNumber?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  buyer: {
    id: string;
    name: string;
    gstNumber?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    paymentScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    avgPaymentDays: number;
    contractualTermsDays: number;
  };
  paymentHistory: {
    evaluatedCount: number;
    paidCount: number;
    overdueCount: number;
    pendingCount: number;
    avgDelayDays: number;
  };
  exposure: {
    currentBuyerExposure: number;
    proposedFinancing: number;
    exposureAfterFinancing: number;
    buyerCreditLimit: number;
    remainingCreditLimit: number;
  };
  checks: UnderwritingCheckItem[];
}

export interface UnderwritingDecisionResult {
  request: any;
  audit: {
    decision: 'APPROVED' | 'REJECTED';
    underwriterName: string;
    underwriterRole: string;
    institutionName: string;
    timestamp: string;
    approvedAmount?: number;
    rejectionReason?: string;
    notes?: string;
  };
}

export interface UnderwritingQueryParams {
  q?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getUnderwritingQueue = async (
  params: UnderwritingQueryParams = {}
): Promise<{
  requests: UnderwritingQueueItem[];
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
  const response = await apiClient.get<any>(`/api/underwriting/queue${queryString}`);

  if (response.data.success && response.data.data) {
    return response.data.data;
  }

  return {
    requests: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  };
};

export const getUnderwritingDetails = async (id: string): Promise<UnderwritingDetailsData> => {
  const response = await apiClient.get<any>(`/api/underwriting/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Underwriting details not found');
  }
  return response.data.data;
};

export const approveUnderwriting = async (
  id: string,
  approvedAmount?: number,
  notes?: string
): Promise<UnderwritingDecisionResult> => {
  const response = await apiClient.post<any>(`/api/underwriting/${id}/approve`, {
    approvedAmount,
    notes,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to approve underwriting request');
  }

  return response.data.data;
};

export const rejectUnderwriting = async (
  id: string,
  rejectionReason: string,
  notes?: string
): Promise<UnderwritingDecisionResult> => {
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error('Rejection reason is required');
  }

  const response = await apiClient.post<any>(`/api/underwriting/${id}/reject`, {
    rejectionReason,
    notes,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to reject underwriting request');
  }

  return response.data.data;
};
