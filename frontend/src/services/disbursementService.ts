import { apiClient } from './api';

export interface DisbursementQueueItem {
  id: string;
  disbursementId: string;
  offerId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  disbursementAmount: number;
  providerName: string;
  supplier: {
    id: string;
    name: string;
  };
  buyer: {
    id: string;
    name: string;
  };
  status: string;
  disbursementMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface DetailedDisbursement extends DisbursementQueueItem {
  interestRate: number;
  tenureDays: number;
  settlementInfo: {
    accountName: string;
    gstNumber: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    settlementStatus: string;
  };
  supplier: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  buyer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  };
}

export interface DisbursementExecuteResult {
  request: any;
  audit: {
    disbursementId: string;
    status: 'DISBURSED';
    disbursementAmount: number;
    executedBy: string;
    executedRole: string;
    institutionName: string;
    method: string;
    timestamp: string;
    notes?: string;
  };
}

export interface DisbursementQueryParams {
  q?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getDisbursementQueue = async (
  params: DisbursementQueryParams = {}
): Promise<{
  disbursements: DisbursementQueueItem[];
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
  const response = await apiClient.get<any>(`/api/disbursements/queue${queryString}`);

  if (response.data.success && response.data.data) {
    return response.data.data;
  }

  return {
    disbursements: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  };
};

export const getDisbursementDetails = async (id: string): Promise<DetailedDisbursement> => {
  const response = await apiClient.get<any>(`/api/disbursements/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Disbursement transaction not found');
  }
  return response.data.data;
};

export const executeDisbursement = async (
  id: string,
  notes?: string
): Promise<DisbursementExecuteResult> => {
  const response = await apiClient.post<any>(`/api/disbursements/${id}/execute`, { notes });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to execute disbursement');
  }
  return response.data.data;
};
