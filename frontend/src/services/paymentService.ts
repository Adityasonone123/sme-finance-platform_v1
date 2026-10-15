import { apiClient } from './api';

export interface ApiPayment {
  id: string;
  invoiceId: string;
  amount: string | number;
  paymentDate: string;
  paymentMethod: 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CREDIT_CARD' | 'OTHER';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  referenceNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    amount: string | number;
    supplier?: {
      id: string;
      name: string;
    };
    buyer?: {
      id: string;
      name: string;
    };
  };
}

export interface PaymentApiResponse {
  success: boolean;
  data?: {
    payment?: ApiPayment;
    payments?: ApiPayment[];
  };
  message?: string;
}

export interface RecordPaymentPayload {
  invoiceId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod?: 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CREDIT_CARD' | 'OTHER';
  referenceNumber?: string;
}

export const getPayments = async (): Promise<ApiPayment[]> => {
  try {
    const response = await apiClient.get<PaymentApiResponse>('/api/payments');
    if (response.data.success && response.data.data?.payments) {
      return response.data.data.payments;
    }
    return [];
  } catch {
    return [];
  }
};

export const getPaymentById = async (id: string): Promise<ApiPayment | null> => {
  try {
    const response = await apiClient.get<PaymentApiResponse>(`/api/payments/${id}`);
    if (response.data.success && response.data.data?.payment) {
      return response.data.data.payment;
    }
    return null;
  } catch {
    return null;
  }
};

export const recordPayment = async (payload: RecordPaymentPayload): Promise<ApiPayment> => {
  const response = await apiClient.post<PaymentApiResponse>('/api/payments', payload);
  if (!response.data.success || !response.data.data?.payment) {
    throw new Error(response.data.message || 'Failed to record payment');
  }
  return response.data.data.payment;
};

// Helper metric calculation for Payments Ledger page
export const calculatePaymentMetrics = (paymentsList: any[], invoicesList: any[]) => {
  const totalReceived = paymentsList.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pendingReceivables = invoicesList
    .filter((inv) => inv.status === 'PENDING' || inv.status === 'APPROVED' || inv.status === 'PARTIALLY_PAID')
    .reduce((sum, inv) => sum + (parseFloat(inv.remainingAmount || inv.amount) || 0), 0);
  const overdueReceivables = invoicesList
    .filter((inv) => inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + (parseFloat(inv.remainingAmount || inv.amount) || 0), 0);

  return {
    totalReceived,
    pendingReceivables,
    overdueReceivables,
  };
};
