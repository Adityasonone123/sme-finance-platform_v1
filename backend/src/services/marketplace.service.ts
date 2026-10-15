import { FinancingRequestStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { calculateBuyerPaymentScore } from './buyer-score.service.js';

export interface MarketplaceFilterQuery {
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
  userRole: string,
  _userCompanyId?: string | null,
  filters: MarketplaceFilterQuery = {}
) => {
  if (userRole !== Role.FINANCIAL_INSTITUTION && userRole !== Role.ADMIN) {
    throw new Error('Access denied: Financial Institution role required');
  }

  const {
    q,
    status = 'PENDING',
    minAmount,
    maxAmount,
    maxTenor,
    minBuyerScore,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = filters;

  const where: any = {};

  if (status === 'PENDING') {
    where.status = FinancingRequestStatus.PENDING;
  } else if (status === 'APPROVED') {
    where.status = FinancingRequestStatus.APPROVED;
  } else if (status === 'DISBURSED') {
    where.status = FinancingRequestStatus.DISBURSED;
  } else if (status === 'REPAID') {
    where.status = FinancingRequestStatus.REPAID;
  } else if (status !== 'ALL') {
    where.status = FinancingRequestStatus.PENDING;
  }

  if (minAmount || maxAmount) {
    where.requestedAmount = {};
    if (minAmount) where.requestedAmount.gte = minAmount;
    if (maxAmount) where.requestedAmount.lte = maxAmount;
  }

  if (q && q.trim()) {
    const searchTerm = q.trim();
    where.OR = [
      { id: { contains: searchTerm, mode: 'insensitive' } },
      { invoice: { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } } },
      { supplier: { name: { contains: searchTerm, mode: 'insensitive' } } },
      { invoice: { buyer: { name: { contains: searchTerm, mode: 'insensitive' } } } },
    ];
  }

  const requests = await prisma.financingRequest.findMany({
    where,
    include: {
      supplier: true,
      invoice: {
        include: {
          buyer: true,
          payments: true,
        },
      },
      offers: true,
    },
    orderBy: {
      createdAt: sortOrder,
    },
  });

  const now = new Date().getTime();

  let opportunities = await Promise.all(
    requests.map(async (req, idx) => {
      const invoiceAmount = parseFloat(req.invoice.amount.toString());
      const requestedAmount = parseFloat(req.requestedAmount.toString());
      const advanceRate = Math.round((requestedAmount / invoiceAmount) * 100);

      const dueDateMs = new Date(req.invoice.dueDate).getTime();
      const remainingTenorDays = Math.max(0, Math.ceil((dueDateMs - now) / (1000 * 60 * 60 * 24)));

      let buyerScore = 85;
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      let avgPaymentDays = 32;

      try {
        const scoreRes = await calculateBuyerPaymentScore(req.supplierId, req.invoice.buyerId);
        buyerScore = scoreRes.creditScore;
        riskLevel = scoreRes.riskLevel;
        avgPaymentDays = scoreRes.avgPaymentDays;
      } catch {
        // Default fallback
      }

      return {
        id: req.id,
        opportunityId: `OPP-${(idx + 1).toString().padStart(3, '0')}`,
        invoiceId: req.invoice.id,
        invoiceNumber: req.invoice.invoiceNumber,
        invoiceAmount,
        requestedAmount,
        advanceRate,
        issueDate: req.invoice.issueDate.toISOString(),
        dueDate: req.invoice.dueDate.toISOString(),
        remainingTenorDays,
        paymentTermsDays: req.invoice.paymentTerms,
        status: req.status,
        supplier: {
          id: req.supplier.id,
          name: req.supplier.name,
          gstNumber: req.supplier.gstNumber,
          email: req.supplier.email,
          phone: req.supplier.phone,
          address: req.supplier.address,
        },
        buyer: {
          id: req.invoice.buyer.id,
          name: req.invoice.buyer.name,
          gstNumber: req.invoice.buyer.gstNumber,
          email: req.invoice.buyer.email,
          phone: req.invoice.buyer.phone,
          address: req.invoice.buyer.address,
          paymentScore: buyerScore,
          riskLevel,
          avgPaymentDays,
          contractualTermsDays: req.invoice.paymentTerms,
        },
        createdAt: req.createdAt.toISOString(),
      };
    })
  );

  if (maxTenor !== undefined && !isNaN(maxTenor)) {
    opportunities = opportunities.filter((op) => op.remainingTenorDays <= maxTenor);
  }

  if (minBuyerScore !== undefined && !isNaN(minBuyerScore)) {
    opportunities = opportunities.filter((op) => op.buyer.paymentScore >= minBuyerScore);
  }

  if (sortBy === 'amount') {
    opportunities.sort((a, b) =>
      sortOrder === 'asc' ? a.requestedAmount - b.requestedAmount : b.requestedAmount - a.requestedAmount
    );
  } else if (sortBy === 'dueDate' || sortBy === 'tenor') {
    opportunities.sort((a, b) =>
      sortOrder === 'asc' ? a.remainingTenorDays - b.remainingTenorDays : b.remainingTenorDays - a.remainingTenorDays
    );
  } else if (sortBy === 'buyerScore') {
    opportunities.sort((a, b) =>
      sortOrder === 'asc' ? a.buyer.paymentScore - b.buyer.paymentScore : b.buyer.paymentScore - a.buyer.paymentScore
    );
  }

  const availableCount = opportunities.length;
  const totalEligibleValue = opportunities.reduce((sum, op) => sum + op.requestedAmount, 0);
  const averageTenorDays =
    availableCount > 0
      ? Math.round(opportunities.reduce((sum, op) => sum + op.remainingTenorDays, 0) / availableCount)
      : 0;
  const potentialExposure = totalEligibleValue;

  const total = opportunities.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIdx = (safePage - 1) * limit;
  const paginatedOpportunities = opportunities.slice(startIdx, startIdx + limit);

  return {
    summary: {
      availableOpportunitiesCount: availableCount,
      totalEligibleValue,
      averageTenorDays,
      potentialExposure,
    },
    opportunities: paginatedOpportunities,
    pagination: {
      total,
      page: safePage,
      limit,
      totalPages,
    },
  };
};

export const getMarketplaceOpportunityById = async (userRole: string, opportunityId: string) => {
  if (userRole !== Role.FINANCIAL_INSTITUTION && userRole !== Role.ADMIN) {
    throw new Error('Access denied: Financial Institution role required');
  }

  const req = await prisma.financingRequest.findUnique({
    where: { id: opportunityId },
    include: {
      supplier: true,
      invoice: {
        include: {
          buyer: true,
          payments: true,
        },
      },
      offers: true,
    },
  });

  if (!req) {
    throw new Error('Financing opportunity not found');
  }

  const invoiceAmount = parseFloat(req.invoice.amount.toString());
  const requestedAmount = parseFloat(req.requestedAmount.toString());
  const advanceRate = Math.round((requestedAmount / invoiceAmount) * 100);

  const now = new Date().getTime();
  const dueDateMs = new Date(req.invoice.dueDate).getTime();
  const remainingTenorDays = Math.max(0, Math.ceil((dueDateMs - now) / (1000 * 60 * 60 * 24)));

  let buyerScore = 85;
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let avgPaymentDays = 32;

  try {
    const scoreRes = await calculateBuyerPaymentScore(req.supplierId, req.invoice.buyerId);
    buyerScore = scoreRes.creditScore;
    riskLevel = scoreRes.riskLevel;
    avgPaymentDays = scoreRes.avgPaymentDays;
  } catch {
    // Fallback
  }

  const activeBuyerFinancing = await prisma.financingRequest.findMany({
    where: {
      invoice: { buyerId: req.invoice.buyerId },
      status: { in: [FinancingRequestStatus.APPROVED, FinancingRequestStatus.DISBURSED] },
    },
  });

  const currentBuyerExposure = activeBuyerFinancing.reduce(
    (sum, f) => sum + parseFloat((f.approvedAmount || f.requestedAmount).toString()),
    0
  );

  const buyerCreditLimit = 25000000; // ₹2.5 Crore default credit limit cap per corporate buyer
  const proposedFinancing = requestedAmount;
  const exposureAfterFinancing = currentBuyerExposure + proposedFinancing;
  const remainingCreditLimit = Math.max(0, buyerCreditLimit - exposureAfterFinancing);

  return {
    id: req.id,
    opportunityId: `OPP-${req.id.slice(0, 6).toUpperCase()}`,
    invoiceId: req.invoice.id,
    invoiceNumber: req.invoice.invoiceNumber,
    invoiceAmount,
    requestedAmount,
    advanceRate,
    issueDate: req.invoice.issueDate.toISOString(),
    dueDate: req.invoice.dueDate.toISOString(),
    remainingTenorDays,
    paymentTermsDays: req.invoice.paymentTerms,
    status: req.status,
    description: `Working capital invoice discounting facility for ${req.invoice.invoiceNumber}`,
    supplier: {
      id: req.supplier.id,
      name: req.supplier.name,
      gstNumber: req.supplier.gstNumber,
      email: req.supplier.email,
      phone: req.supplier.phone,
      address: req.supplier.address,
    },
    buyer: {
      id: req.invoice.buyer.id,
      name: req.invoice.buyer.name,
      gstNumber: req.invoice.buyer.gstNumber,
      email: req.invoice.buyer.email,
      phone: req.invoice.buyer.phone,
      address: req.invoice.buyer.address,
      paymentScore: buyerScore,
      riskLevel,
      avgPaymentDays,
      contractualTermsDays: req.invoice.paymentTerms,
    },
    exposure: {
      currentBuyerExposure,
      proposedFinancing,
      exposureAfterFinancing,
      buyerCreditLimit,
      remainingCreditLimit,
    },
    eligibility: {
      eligible: req.status === FinancingRequestStatus.PENDING,
      reasons:
        req.status === FinancingRequestStatus.PENDING
          ? ['Invoice is approved by corporate buyer and eligible for lender underwriting']
          : [`Financing request is currently in status ${req.status}`],
      maxEligibleAmount: Math.round(invoiceAmount * 0.8),
      maxFinancingPercentage: 80,
    },
    createdAt: req.createdAt.toISOString(),
  };
};
