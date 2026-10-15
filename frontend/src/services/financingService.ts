import { apiClient } from './api';

export interface ApiFinancingOffer {
  id: string;
  financingRequestId: string;
  providerName: string;
  amount: string | number;
  interestRate: string | number;
  tenureDays: number;
  processingFee: string | number;
  totalRepayment: string | number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
}

export interface ApiFinancingRequest {
  id: string;
  supplierId: string;
  invoiceId: string;
  requestedAmount: string | number;
  interestRate?: string | number | null;
  tenureDays?: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'REPAID';
  approvedAmount?: string | number | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    amount: string | number;
    dueDate: string;
    status: string;
    buyer?: {
      id: string;
      name: string;
    };
  };
  supplier?: {
    id: string;
    name: string;
  };
  offers?: ApiFinancingOffer[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiFinancingEligibility {
  invoiceId: string;
  invoiceNumber: string;
  buyerName: string;
  invoiceAmount: number;
  remainingAmount: number;
  maxEligibleAmount: number;
  maxFinancingPercentage: number;
  eligible: boolean;
  reasons: string[];
  buyerScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface FinancingApiResponse {
  success: boolean;
  data?: {
    request?: ApiFinancingRequest;
    requests?: ApiFinancingRequest[];
    eligibility?: ApiFinancingEligibility;
  };
  message?: string;
}

export interface CreateFinancingRequestPayload {
  invoiceId: string;
  requestedAmount: number;
  tenureDays?: number;
}

export const checkInvoiceEligibility = async (invoiceId: string): Promise<ApiFinancingEligibility | null> => {
  try {
    const response = await apiClient.get<FinancingApiResponse>(`/api/financing/eligibility/${invoiceId}`);
    if (response.data.success && response.data.data?.eligibility) {
      return response.data.data.eligibility;
    }
    return null;
  } catch {
    return null;
  }
};

export const createFinancingRequest = async (payload: CreateFinancingRequestPayload): Promise<ApiFinancingRequest> => {
  const response = await apiClient.post<FinancingApiResponse>('/api/financing/requests', payload);
  if (!response.data.success || !response.data.data?.request) {
    throw new Error(response.data.message || 'Failed to submit financing request');
  }
  return response.data.data.request;
};

export const getFinancingRequests = async (): Promise<ApiFinancingRequest[]> => {
  try {
    const response = await apiClient.get<FinancingApiResponse>('/api/financing/requests');
    if (response.data.success && response.data.data?.requests) {
      return response.data.data.requests;
    }
    return [];
  } catch {
    return [];
  }
};

export const getFinancingRequestById = async (id: string): Promise<ApiFinancingRequest | null> => {
  try {
    const response = await apiClient.get<FinancingApiResponse>(`/api/financing/requests/${id}`);
    if (response.data.success && response.data.data?.request) {
      return response.data.data.request;
    }
    return null;
  } catch {
    return null;
  }
};

export const approveFinancingRequest = async (id: string, approvedAmount?: number): Promise<ApiFinancingRequest> => {
  const response = await apiClient.post<FinancingApiResponse>(`/api/financing/requests/${id}/approve`, {
    approvedAmount,
  });
  if (!response.data.success || !response.data.data?.request) {
    throw new Error(response.data.message || 'Failed to approve financing request');
  }
  return response.data.data.request;
};

export const rejectFinancingRequest = async (id: string): Promise<ApiFinancingRequest> => {
  const response = await apiClient.post<FinancingApiResponse>(`/api/financing/requests/${id}/reject`);
  if (!response.data.success || !response.data.data?.request) {
    throw new Error(response.data.message || 'Failed to reject financing request');
  }
  return response.data.data.request;
};

export const disburseFinancing = async (id: string): Promise<ApiFinancingRequest> => {
  const response = await apiClient.post<FinancingApiResponse>(`/api/financing/requests/${id}/disburse`);
  if (!response.data.success || !response.data.data?.request) {
    throw new Error(response.data.message || 'Failed to disburse financing');
  }
  return response.data.data.request;
};

export const repayFinancing = async (id: string): Promise<ApiFinancingRequest> => {
  const response = await apiClient.post<FinancingApiResponse>(`/api/financing/requests/${id}/repay`);
  if (!response.data.success || !response.data.data?.request) {
    throw new Error(response.data.message || 'Failed to record financing repayment');
  }
  return response.data.data.request;
};
