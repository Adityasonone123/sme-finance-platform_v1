import { InvoiceStatus, FinancingRequestStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { calculateBuyerPaymentScore } from './buyer-score.service.js';
import { config } from '../config/index.js';

export class FinancingEligibilityError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'FinancingEligibilityError';
  }
}

export interface FinancingEligibilityResult {
  invoiceId: string;
  invoiceNumber: string;
  buyerName: string;
  invoiceAmount: number;
  remainingAmount: number;
  maxEligibleAmount: number;
  maxFinancingPercentage: number;
  eligible: boolean;
  reasons: string[];
  buyerScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const checkInvoiceEligibility = async (
  userCompanyId: string | null | undefined,
  invoiceId: string
): Promise<FinancingEligibilityResult> => {
  if (!userCompanyId) {
    throw new FinancingEligibilityError('Supplier company profile required for eligibility check', 400);
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      buyer: true,
      payments: true,
      financingRequests: {
        where: {
          status: {
            in: [
              FinancingRequestStatus.PENDING,
              FinancingRequestStatus.APPROVED,
              FinancingRequestStatus.DISBURSED,
            ],
          },
        },
      },
    },
  });

  if (!invoice) {
    throw new FinancingEligibilityError('Invoice not found', 404);
  }

  if (invoice.supplierId !== userCompanyId) {
    throw new FinancingEligibilityError('Access denied: Invoice does not belong to your company', 403);
  }

  const reasons: string[] = [];
  const maxFinancingPercentage = (config as any).maxFinancingPercentage || 80;

  // 1. Status Evaluation
  if (invoice.status === InvoiceStatus.PENDING) {
    reasons.push('Invoice pending buyer approval (only APPROVED or PARTIALLY_PAID invoices are eligible)');
  } else if (invoice.status === InvoiceStatus.REJECTED) {
    reasons.push('Invoice was rejected by buyer');
  } else if (invoice.status === InvoiceStatus.PAID) {
    reasons.push('Invoice has already been fully paid and settled');
  } else if (invoice.status === InvoiceStatus.OVERDUE) {
    reasons.push('Invoice is currently overdue');
  }

  // 2. Remaining Outstanding Balance
  const totalAmount = parseFloat(invoice.amount.toString());
  const paidAmount = invoice.payments.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()),
    0
  );
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  if (remainingAmount <= 0) {
    reasons.push('No outstanding receivable remains on this invoice');
  }

  // 3. Max Financing Limit (80% of remaining balance)
  const maxEligibleLimit = Math.round(remainingAmount * (maxFinancingPercentage / 100));

  // 4. Check existing active financing requests for this invoice
  const existingFinancedAmount = invoice.financingRequests.reduce(
    (sum, req) => sum + parseFloat(req.requestedAmount.toString()),
    0
  );

  const availableFinancingCap = Math.max(0, maxEligibleLimit - existingFinancedAmount);

  if (existingFinancedAmount > 0 && availableFinancingCap <= 0) {
    reasons.push(`Maximum eligible financing cap (₹${maxEligibleLimit.toLocaleString('en-IN')}) has already been requested`);
  }

  // 5. Buyer Payment Score & Risk Profiling from B9
  let buyerScore = 85;
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  try {
    const scoreResult = await calculateBuyerPaymentScore(userCompanyId, invoice.buyerId);
    buyerScore = scoreResult.creditScore;
    riskLevel = scoreResult.riskLevel;

    if (riskLevel === 'HIGH') {
      reasons.push('Corporate buyer carries HIGH payment risk level (Manual underwriting review required)');
    }
  } catch {
    // Ignore scoring failure fallback
  }

  const isEligible = reasons.length === 0 && availableFinancingCap > 0;

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    buyerName: invoice.buyer.name,
    invoiceAmount: totalAmount,
    remainingAmount,
    maxEligibleAmount: availableFinancingCap,
    maxFinancingPercentage,
    eligible: isEligible,
    reasons: isEligible ? ['Invoice is approved and eligible for discounting'] : reasons,
    buyerScore,
    riskLevel,
  };
};
