import { apiClient } from './api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'SUPPLIER' | 'BUYER' | 'FINANCIAL_INSTITUTION' | 'ADMIN';
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
    type: string;
    gstNumber?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: UserProfile;
  };
  message?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'SUPPLIER' | 'BUYER';
  businessName?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterData): Promise<UserProfile> => {
  const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
  if (!response.data.success || !response.data.data?.user) {
    throw new Error(response.data.message || 'Registration failed');
  }
  return response.data.data.user;
};

export const loginUser = async (data: LoginData): Promise<UserProfile> => {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
  if (!response.data.success || !response.data.data?.user) {
    throw new Error(response.data.message || 'Login failed');
  }
  return response.data.data.user;
};

export const getMe = async (): Promise<UserProfile | null> => {
  try {
    const response = await apiClient.get<AuthResponse>('/api/auth/me');
    if (response.data.success && response.data.data?.user) {
      return response.data.data.user;
    }
    return null;
  } catch {
    return null;
  }
};

export const logoutUser = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout');
};
