import { apiClient } from './api';

export interface OpportunitySummary {
  availableOpportunitiesCount: number;
  totalEligibleValue: number;
  averageTenorDays: number;
  potentialExposure: number;
}

export interface OpportunityItem {
  id: string;
  opportunityId: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  requestedAmount: number;
  advanceRate: number;
  issueDate: string;
  dueDate: string;
  remainingTenorDays: number;
  paymentTermsDays: number;
  status: string;
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
  createdAt: string;
}

export interface DetailedOpportunity extends OpportunityItem {
  description?: string;
  exposure: {
    currentBuyerExposure: number;
    proposedFinancing: number;
    exposureAfterFinancing: number;
    buyerCreditLimit: number;
    remainingCreditLimit: number;
  };
  eligibility: {
    eligible: boolean;
    reasons: string[];
    maxEligibleAmount: number;
    maxFinancingPercentage: number;
  };
}

export interface MarketplaceResponse {
  success: boolean;
  data?: {
    summary: OpportunitySummary;
    opportunities: OpportunityItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface OpportunityDetailsResponse {
  success: boolean;
  data?: {
    opportunity: DetailedOpportunity;
  };
  message?: string;
}

export interface MarketplaceQueryParams {
  q?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  maxTenor?: number;
  minBuyerScore?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getMarketplaceOpportunities = async (
  params: MarketplaceQueryParams = {}
): Promise<{
  summary: OpportunitySummary;
  opportunities: OpportunityItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> => {
  const queryParts: string[] = [];
  if (params.q) queryParts.push(`q=${encodeURIComponent(params.q)}`);
  if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params.minAmount) queryParts.push(`minAmount=${params.minAmount}`);
  if (params.maxAmount) queryParts.push(`maxAmount=${params.maxAmount}`);
  if (params.maxTenor) queryParts.push(`maxTenor=${params.maxTenor}`);
  if (params.minBuyerScore) queryParts.push(`minBuyerScore=${params.minBuyerScore}`);
  if (params.sortBy) queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
  if (params.sortOrder) queryParts.push(`sortOrder=${params.sortOrder}`);
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const response = await apiClient.get<MarketplaceResponse>(`/api/marketplace${queryString}`);

  if (response.data.success && response.data.data) {
    return response.data.data;
  }

  return {
    summary: { availableOpportunitiesCount: 0, totalEligibleValue: 0, averageTenorDays: 0, potentialExposure: 0 },
    opportunities: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  };
};

export const getMarketplaceOpportunityById = async (id: string): Promise<DetailedOpportunity> => {
  const response = await apiClient.get<OpportunityDetailsResponse>(`/api/marketplace/${id}`);
  if (!response.data.success || !response.data.data?.opportunity) {
    throw new Error(response.data.message || 'Opportunity not found');
  }
  return response.data.data.opportunity;
};
