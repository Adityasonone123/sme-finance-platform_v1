import { apiClient } from './api';

export interface CompanyProfile {
  id: string;
  name: string;
  type: 'SME' | 'CORPORATE' | 'FINANCIAL_INSTITUTION';
  gstNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface CompanyApiResponse {
  success: boolean;
  data?: {
    company: CompanyProfile;
  };
  message?: string;
}

export const getCompanyProfile = async (): Promise<CompanyProfile | null> => {
  try {
    const response = await apiClient.get<CompanyApiResponse>('/api/company');
    if (response.data.success && response.data.data?.company) {
      return response.data.data.company;
    }
    return null;
  } catch {
    return null;
  }
};

export const createCompanyProfile = async (data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
  const response = await apiClient.post<CompanyApiResponse>('/api/company', data);
  if (!response.data.success || !response.data.data?.company) {
    throw new Error(response.data.message || 'Failed to create company profile');
  }
  return response.data.data.company;
};

export const updateCompanyProfile = async (data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
  const response = await apiClient.put<CompanyApiResponse>('/api/company', data);
  if (!response.data.success || !response.data.data?.company) {
    throw new Error(response.data.message || 'Failed to update company profile');
  }
  return response.data.data.company;
};
