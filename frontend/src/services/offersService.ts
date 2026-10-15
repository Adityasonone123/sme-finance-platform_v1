import { apiClient } from './api';

export interface OfferItem {
  id: string;
  offerId: string;
  financingRequestId: string;
  providerName: string;
  amount: number;
  invoiceAmount: number;
  interestRate: number;
  tenureDays: number;
  processingFee: number;
  totalRepayment: number;
  expectedReturn: number;
  status: string;
  createdAt: string;
  invoiceNumber: string;
  supplier: {
    id: string;
    name: string;
  };
  buyer: {
    id: string;
    name: string;
  };
}

export interface DetailedOffer extends OfferItem {
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
  request: {
    id: string;
    requestedAmount: number;
    status: string;
  };
}

export interface CreateOfferPayload {
  financingRequestId: string;
  amount: number;
  interestRate: number;
  tenureDays: number;
  processingFee: number;
}

export interface OfferQueryParams {
  q?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getFinancierOffers = async (
  params: OfferQueryParams = {}
): Promise<{
  offers: OfferItem[];
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
  const response = await apiClient.get<any>(`/api/offers${queryString}`);

  if (response.data.success && response.data.data) {
    return response.data.data;
  }

  return {
    offers: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  };
};

export const getOfferById = async (id: string): Promise<DetailedOffer> => {
  const response = await apiClient.get<any>(`/api/offers/${id}`);
  if (!response.data.success || !response.data.data?.offer) {
    throw new Error(response.data.message || 'Financing offer not found');
  }
  return response.data.data.offer;
};

export const createFinancingOffer = async (payload: CreateOfferPayload): Promise<OfferItem> => {
  const response = await apiClient.post<any>('/api/offers', payload);
  if (!response.data.success || !response.data.data?.offer) {
    throw new Error(response.data.message || 'Failed to submit financing offer');
  }
  return response.data.data.offer;
};

export const acceptFinancingOffer = async (offerId: string): Promise<OfferItem> => {
  const response = await apiClient.post<any>(`/api/offers/${offerId}/accept`);
  if (!response.data.success || !response.data.data?.offer) {
    throw new Error(response.data.message || 'Failed to accept financing offer');
  }
  return response.data.data.offer;
};
