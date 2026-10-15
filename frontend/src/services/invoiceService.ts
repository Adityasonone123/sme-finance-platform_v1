import { apiClient } from './api';

export interface ApiInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  buyerId: string;
  amount: string | number;
  issueDate: string;
  dueDate: string;
  paymentTerms: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID';
  documentUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: string;
    name: string;
  };
  buyer?: {
    id: string;
    name: string;
  };
}

export interface InvoiceApiResponse {
  success: boolean;
  data?: {
    invoice?: ApiInvoice;
    invoices?: ApiInvoice[];
  };
  message?: string;
}

export interface CreateInvoicePayload {
  invoiceNumber: string;
  buyerId: string;
  amount: number;
  issueDate: string;
  dueDate?: string;
  paymentTerms?: number;
  description?: string;
  documentFile?: File | null;
}

export const getInvoices = async (statusFilter?: string): Promise<ApiInvoice[]> => {
  try {
    const params = statusFilter ? { status: statusFilter } : {};
    const response = await apiClient.get<InvoiceApiResponse>('/api/invoices', { params });
    if (response.data.success && response.data.data?.invoices) {
      return response.data.data.invoices;
    }
    return [];
  } catch {
    return [];
  }
};

export const getInvoiceById = async (id: string): Promise<ApiInvoice | null> => {
  try {
    const response = await apiClient.get<InvoiceApiResponse>(`/api/invoices/${id}`);
    if (response.data.success && response.data.data?.invoice) {
      return response.data.data.invoice;
    }
    return null;
  } catch {
    return null;
  }
};

export const createInvoice = async (payload: CreateInvoicePayload): Promise<ApiInvoice> => {
  const formData = new FormData();
  formData.append('invoiceNumber', payload.invoiceNumber);
  formData.append('buyerId', payload.buyerId);
  formData.append('amount', payload.amount.toString());
  formData.append('issueDate', payload.issueDate);
  if (payload.dueDate) formData.append('dueDate', payload.dueDate);
  if (payload.paymentTerms) formData.append('paymentTerms', payload.paymentTerms.toString());
  if (payload.description) formData.append('description', payload.description);
  if (payload.documentFile) formData.append('document', payload.documentFile);

  const response = await apiClient.post<InvoiceApiResponse>('/api/invoices', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!response.data.success || !response.data.data?.invoice) {
    throw new Error(response.data.message || 'Failed to create invoice');
  }

  return response.data.data.invoice;
};

export const updateInvoice = async (id: string, updates: Partial<CreateInvoicePayload>): Promise<ApiInvoice> => {
  const response = await apiClient.put<InvoiceApiResponse>(`/api/invoices/${id}`, updates);
  if (!response.data.success || !response.data.data?.invoice) {
    throw new Error(response.data.message || 'Failed to update invoice');
  }
  return response.data.data.invoice;
};

export const deleteInvoice = async (id: string): Promise<boolean> => {
  const response = await apiClient.delete<InvoiceApiResponse>(`/api/invoices/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete invoice');
  }
  return true;
};

export const approveInvoice = async (id: string): Promise<ApiInvoice> => {
  const response = await apiClient.post<InvoiceApiResponse>(`/api/invoices/${id}/approve`);
  if (!response.data.success || !response.data.data?.invoice) {
    throw new Error(response.data.message || 'Failed to approve invoice');
  }
  return response.data.data.invoice;
};

export const rejectInvoice = async (id: string): Promise<ApiInvoice> => {
  const response = await apiClient.post<InvoiceApiResponse>(`/api/invoices/${id}/reject`);
  if (!response.data.success || !response.data.data?.invoice) {
    throw new Error(response.data.message || 'Failed to reject invoice');
  }
  return response.data.data.invoice;
};

export const uploadInvoiceDocument = async (id: string, file: File): Promise<ApiInvoice> => {
  const formData = new FormData();
  formData.append('document', file);

  const response = await apiClient.post<InvoiceApiResponse>(`/api/invoices/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!response.data.success || !response.data.data?.invoice) {
    throw new Error(response.data.message || 'Failed to upload invoice document');
  }

  return response.data.data.invoice;
};
