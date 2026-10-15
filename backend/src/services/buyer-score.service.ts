import { InvoiceStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export class BuyerScoreServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'BuyerScoreServiceError';
  }
}

export interface BuyerPaymentScoreResult {
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

export const calculateBuyerPaymentScore = async (
  supplierCompanyId: string | null | undefined,
  buyerId: string
): Promise<BuyerPaymentScoreResult> => {
  if (!supplierCompanyId) {
    throw new BuyerScoreServiceError('Supplier company profile required', 400);
  }

  const buyerCompany = await prisma.company.findUnique({
    where: { id: buyerId },
  });

  if (!buyerCompany) {
    throw new BuyerScoreServiceError('Corporate buyer company not found', 404);
  }

  // Fetch all invoices issued by supplier to this buyer
  const invoices = await prisma.invoice.findMany({
    where: {
      supplierId: supplierCompanyId,
      buyerId: buyerId,
    },
    include: {
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalInvoicesCount = invoices.length;
  const contractualTermsDays = invoices.length > 0 ? invoices[0].paymentTerms : 30;

  const totalInvoiced = invoices.reduce((sum, i) => sum + parseFloat(i.amount.toString()), 0);

  const paidInvoices = invoices.filter((i) => i.status === InvoiceStatus.PAID);
  const overdueInvoices = invoices.filter((i) => i.status === InvoiceStatus.OVERDUE);

  const paidInvoicesCount = paidInvoices.length;
  const overdueInvoicesCount = overdueInvoices.length;

  const totalPaid = invoices.reduce((sum, inv) => {
    const paidForInv = inv.payments.reduce((pSum, p) => pSum + parseFloat(p.amount.toString()), 0);
    return sum + paidForInv;
  }, 0);

  const outstandingAmount = invoices
    .filter((i) => i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.REJECTED)
    .reduce((sum, inv) => {
      const paid = inv.payments.reduce((pSum, p) => pSum + parseFloat(p.amount.toString()), 0);
      return sum + Math.max(0, parseFloat(inv.amount.toString()) - paid);
    }, 0);

  const overdueAmount = overdueInvoices.reduce((sum, inv) => {
    const paid = inv.payments.reduce((pSum, p) => pSum + parseFloat(p.amount.toString()), 0);
    return sum + Math.max(0, parseFloat(inv.amount.toString()) - paid);
  }, 0);

  let totalDaysTaken = 0;
  let totalDelayDays = 0;
  let onTimeCount = 0;

  for (const inv of paidInvoices) {
    if (inv.payments.length > 0) {
      const lastPaymentDate = new Date(inv.payments[0].paymentDate);
      const issueDate = new Date(inv.issueDate);
      const dueDate = new Date(inv.dueDate);

      const daysTaken = Math.max(
        1,
        Math.round((lastPaymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      totalDaysTaken += daysTaken;

      const delay = Math.max(
        0,
        Math.round((lastPaymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      totalDelayDays += delay;

      if (lastPaymentDate <= dueDate) {
        onTimeCount += 1;
      }
    }
  }

  const avgPaymentDays =
    paidInvoicesCount > 0 ? Math.round(totalDaysTaken / paidInvoicesCount) : contractualTermsDays;
  const avgPaymentDelay = paidInvoicesCount > 0 ? Math.round(totalDelayDays / paidInvoicesCount) : 0;
  const onTimePaymentPercentage =
    paidInvoicesCount > 0 ? Math.round((onTimeCount / paidInvoicesCount) * 100) : 100;

  // Score Calculation Algorithm
  // Component 1: On-Time Rate (Max 50 pts)
  const onTimeComponent = (onTimePaymentPercentage / 100) * 50;

  // Component 2: Delay Penalty (Max 30 pts)
  const delayComponent = Math.max(0, 30 - avgPaymentDelay * 1.5);

  // Component 3: Overdue Ratio Penalty (Max 20 pts)
  const overdueRatio = totalInvoicesCount > 0 ? overdueInvoicesCount / totalInvoicesCount : 0;
  const overdueComponent = Math.max(0, 20 - overdueRatio * 40);

  const rawScore = Math.round(onTimeComponent + delayComponent + overdueComponent);
  const creditScore = totalInvoicesCount > 0 ? Math.min(100, Math.max(0, rawScore)) : 85;

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (creditScore < 60) {
    riskLevel = 'HIGH';
  } else if (creditScore < 80) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  return {
    buyerId,
    buyerName: buyerCompany.name,
    creditScore,
    riskLevel,
    contractualTermsDays,
    avgPaymentDays,
    avgPaymentDelay,
    onTimePaymentPercentage,
    totalInvoiced,
    totalPaid,
    outstandingAmount,
    overdueAmount,
    totalInvoicesCount,
    paidInvoicesCount,
    overdueInvoicesCount,
  };
};

export const getSupplierBuyerScores = async (
  supplierCompanyId: string | null | undefined
): Promise<BuyerPaymentScoreResult[]> => {
  if (!supplierCompanyId) {
    return [];
  }

  const supplierBuyers = await prisma.supplierBuyer.findMany({
    where: { supplierId: supplierCompanyId },
    select: { buyerId: true },
  });

  const scores: BuyerPaymentScoreResult[] = [];
  for (const sb of supplierBuyers) {
    try {
      const score = await calculateBuyerPaymentScore(supplierCompanyId, sb.buyerId);
      scores.push(score);
    } catch {
      // Ignore individually failing scores
    }
  }

  return scores;
};
