export type Role = 'SUPPLIER' | 'BUYER' | 'FINANCIER' | 'ADMIN' | 'FINANCIAL_INSTITUTION';

export type InvoiceStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'REJECTED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type PaymentMethod = 'BANK_TRANSFER' | 'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'CREDIT_CARD' | 'OTHER';


export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED';

export type FinancingStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'DISBURSED'
  | 'REPAID'
  | 'REJECTED';

export type NotificationCategory =
  | 'PAYMENT_DUE'
  | 'OVERDUE'
  | 'CASH_FLOW_WARNING'
  | 'FINANCING'
  | 'SYSTEM';

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  status?: string;
}

export interface Buyer {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  creditScore: number; // 0 - 100
  contractualTermsDays: number;
  avgPaymentDays: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingAmount: number;
  overdueAmount: number;
  latePaymentCount: number;
  riskLevel: RiskLevel;
  gstNumber?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  buyerId: string;
  buyerName: string;
  supplierName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  paymentTermsDays: number;
  description: string;
  status: InvoiceStatus;
  amountPaid: number;
  remainingAmount: number;
  documentName?: string;
  documentUrl?: string;
  createdAt: string;
  historyTimeline: TimelineEvent[];
}

export interface Payment {
  id: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  buyerName: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  referenceNumber: string;
  status: PaymentStatus;
}

export interface CashFlowEntry {
  month: string;
  date: string;
  cashIn: number;
  cashOut: number;
  projectedCash: number;
  isDeficit: boolean;
  contributingInvoiceNumbers: string[];
}

export interface FinancingOffer {
  id: string;
  lenderName: string;
  lenderCode: string;
  maxAmount: number;
  interestRateAnnualPercent: number; // e.g. 11.5
  tenureDays: number;
  processingFeePercent: number;
  estimatedRepayment: number;
  minRiskScoreRequired: number;
}

export interface RepaymentInstallment {
  id: string;
  dueDate: string;
  amount: number;
  status: 'PENDING' | 'PAID';
}

export interface FinancingRequest {
  id: string;
  requestId: string;
  invoiceId: string;
  invoiceNumber: string;
  buyerName: string;
  invoiceAmount: number;
  requestedAmount: number;
  approvedAmount: number;
  interestRate: number;
  tenureDays: number;
  processingFee: number;
  totalRepayment: number;
  status: FinancingStatus;
  appliedDate: string;
  disbursedDate?: string;
  repaymentDueDate?: string;
  lenderName: string;
  repaymentSchedule: RepaymentInstallment[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  gstNumber: string;
  address: string;
  avatarUrl?: string;
  role: Role;
}
