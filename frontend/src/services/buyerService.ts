import { apiClient } from './api';

export interface CorporateBuyer {
  id: string;
  buyerId?: string;
  name: string;
  type?: 'CORPORATE';
  gstNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  relationshipStatus?: 'NONE' | 'PENDING' | 'ACTIVE' | 'REJECTED';
  connectedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiBuyerScore {
  buyerId: string;
  buyerName: string;
  creditScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  contractualTermsDays: number;
  avgPaymentDays: number;
  avgPaymentDelay: number;
  onTimePaymentPercentage: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingAmount: number;
  overdueAmount: number;
  totalInvoicesCount: number;
  paidInvoicesCount: number;
  overdueInvoicesCount: number;
}

export interface DetailedSupplierBuyers {
  activeBuyers: CorporateBuyer[];
  pendingRequests: CorporateBuyer[];
  rejectedRequests: CorporateBuyer[];
  invitations: any[];
}

export interface SupplierRequest {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  requestDate: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
}

export interface ConnectedSupplier {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierGst?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  connectedSince: string;
  status: 'ACTIVE';
}

export interface BuyerApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export const getBuyers = async (): Promise<CorporateBuyer[]> => {
  try {
    const response = await apiClient.get<BuyerApiResponse>('/api/buyers');
    if (response.data.success && response.data.data?.activeBuyers) {
      return response.data.data.activeBuyers;
    }
    return [];
  } catch {
    return [];
  }
};

export const getSupplierBuyersDetailed = async (): Promise<DetailedSupplierBuyers> => {
  try {
    const response = await apiClient.get<BuyerApiResponse>('/api/buyers');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return { activeBuyers: [], pendingRequests: [], rejectedRequests: [], invitations: [] };
  } catch {
    return { activeBuyers: [], pendingRequests: [], rejectedRequests: [], invitations: [] };
  }
};

export const searchBuyers = async (query: string): Promise<CorporateBuyer[]> => {
  try {
    const response = await apiClient.get<BuyerApiResponse>(`/api/buyers/search?q=${encodeURIComponent(query)}`);
    if (response.data.success && response.data.data?.buyers) {
      return response.data.data.buyers;
    }
    return [];
  } catch {
    return [];
  }
};

export const connectBuyer = async (buyerCompanyId: string): Promise<void> => {
  const response = await apiClient.post<BuyerApiResponse>('/api/buyers/connect', { buyerCompanyId });
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to send connection request');
  }
};

export const inviteBuyer = async (companyName: string, contactEmail: string, contactName?: string): Promise<void> => {
  const response = await apiClient.post<BuyerApiResponse>('/api/buyers/invite', {
    companyName,
    contactEmail,
    contactName,
  });
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to send buyer invitation');
  }
};

export const getBuyerSupplierRequests = async (): Promise<SupplierRequest[]> => {
  try {
    const response = await apiClient.get<BuyerApiResponse>('/api/buyer/supplier-requests');
    if (response.data.success && response.data.data?.requests) {
      return response.data.data.requests;
    }
    return [];
  } catch {
    return [];
  }
};

export const acceptSupplierRequest = async (requestId: string): Promise<void> => {
  const response = await apiClient.post<BuyerApiResponse>(`/api/buyer/supplier-requests/${requestId}/accept`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to accept connection request');
  }
};

export const rejectSupplierRequest = async (requestId: string): Promise<void> => {
  const response = await apiClient.post<BuyerApiResponse>(`/api/buyer/supplier-requests/${requestId}/reject`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to decline connection request');
  }
};

export const getConnectedSuppliersForBuyer = async (): Promise<ConnectedSupplier[]> => {
  try {
    const response = await apiClient.get<BuyerApiResponse>('/api/buyer/suppliers');
    if (response.data.success && response.data.data?.suppliers) {
      return response.data.data.suppliers;
    }
    return [];
  } catch {
    return [];
  }
};

export const getBuyerById = async (id: string): Promise<CorporateBuyer | null> => {
  try {
    const response = await apiClient.get<BuyerApiResponse>(`/api/buyers/${id}`);
    if (response.data.success && response.data.data?.buyer) {
      return response.data.data.buyer;
    }
    return null;
  } catch {
    return null;
  }
};

export const updateBuyer = async (id: string, data: Partial<CorporateBuyer>): Promise<CorporateBuyer> => {
  const response = await apiClient.put<BuyerApiResponse>(`/api/buyers/${id}`, data);
  if (!response.data.success || !response.data.data?.buyer) {
    throw new Error(response.data.message || 'Failed to update corporate buyer');
  }
  return response.data.data.buyer;
};

export const getBuyerScore = async (id: string): Promise<ApiBuyerScore | null> => {
  try {
    const response = await apiClient.get<BuyerApiResponse>(`/api/buyers/${id}/score`);
    if (response.data.success && response.data.data?.score) {
      return response.data.data.score;
    }
    return null;
  } catch {
    return null;
  }
};

export const getBuyerScores = async (): Promise<ApiBuyerScore[]> => {
  try {
    const response = await apiClient.get<BuyerApiResponse>('/api/buyers/scores');
    if (response.data.success && response.data.data?.scores) {
      return response.data.data.scores;
    }
    return [];
  } catch {
    return [];
  }
};
