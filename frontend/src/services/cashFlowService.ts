import { apiClient } from './api';

export interface ApiCashFlowEntry {
  id: string;
  supplierId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string | number;
  date: string;
  description?: string | null;
  source?: string | null;
  createdAt: string;
}

export interface ApiCashFlowForecast {
  currentCash: number;
  expectedIncome: number;
  expectedExpenses: number;
  projectedCash: number;
  workingCapitalGap: number;
  forecastHorizon: number;
  status: 'SUFFICIENT' | 'SHORTFALL';
}

export interface ApiCashFlowSummary extends ApiCashFlowForecast {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  upcomingReceivables: number;
  upcomingExpenses: number;
}

export interface CashFlowApiResponse {
  success: boolean;
  data?: {
    entry?: ApiCashFlowEntry;
    entries?: ApiCashFlowEntry[];
    summary?: ApiCashFlowSummary;
    forecast?: ApiCashFlowForecast;
    projectedCash?: number;
    workingCapitalGap?: number;
    status?: 'SUFFICIENT' | 'SHORTFALL';
  };
  message?: string;
}

export interface CreateCashFlowEntryPayload {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  description?: string;
  source?: string;
}

export const createCashFlowEntry = async (payload: CreateCashFlowEntryPayload): Promise<ApiCashFlowEntry> => {
  const response = await apiClient.post<CashFlowApiResponse>('/api/cash-flow/entries', payload);
  if (!response.data.success || !response.data.data?.entry) {
    throw new Error(response.data.message || 'Failed to create cash flow entry');
  }
  return response.data.data.entry;
};

export const getCashFlowEntries = async (): Promise<ApiCashFlowEntry[]> => {
  try {
    const response = await apiClient.get<CashFlowApiResponse>('/api/cash-flow/entries');
    if (response.data.success && response.data.data?.entries) {
      return response.data.data.entries;
    }
    return [];
  } catch {
    return [];
  }
};

export const getCashFlowSummary = async (): Promise<ApiCashFlowSummary | null> => {
  try {
    const response = await apiClient.get<CashFlowApiResponse>('/api/cash-flow/summary');
    if (response.data.success && response.data.data?.summary) {
      return response.data.data.summary;
    }
    return null;
  } catch {
    return null;
  }
};

export const getCashFlowForecast = async (horizon: number = 30): Promise<ApiCashFlowForecast | null> => {
  try {
    const response = await apiClient.get<CashFlowApiResponse>(`/api/cash-flow/forecast?horizon=${horizon}`);
    if (response.data.success && response.data.data?.forecast) {
      return response.data.data.forecast;
    }
    return null;
  } catch {
    return null;
  }
};

export const deleteCashFlowEntry = async (id: string): Promise<boolean> => {
  const response = await apiClient.delete<CashFlowApiResponse>(`/api/cash-flow/entries/${id}`);
  return response.data.success;
};
