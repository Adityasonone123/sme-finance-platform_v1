import { FinancingOfferStatus, FinancingRequestStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { calculateBuyerPaymentScore } from './buyer-score.service.js';

export interface PortfolioFilterQuery {
  q?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  dateRange?: string;
}

export const getPortfolioOverview = async (
  userRole: string,
  _userCompanyId?: string | null,
  dateRange?: string
) => {
  if (userRole !== Role.FINANCIAL_INSTITUTION && userRole !== Role.ADMIN) {
    throw new Error('Access denied: Financial Institution role required');
  }

  const where: any = {
    status: {
      in: [FinancingRequestStatus.APPROVED, FinancingRequestStatus.DISBURSED, FinancingRequestStatus.REPAID],
    },
  };

  if (dateRange && dateRange !== 'ALL') {
    const now = new Date();
    let days = 30;
    if (dateRange === '7D') days = 7;
    if (dateRange === '90D') days = 90;
    if (dateRange === '1Y') days = 365;

    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    where.createdAt = { gte: startDate };
  }

  const requests = await prisma.financingRequest.findMany({
    where,
    include: {
      supplier: true,
      invoice: {
        include: { buyer: true },
      },
      offers: true,
    },
  });

  const now = new Date();

  let totalDisbursed = 0;
  let totalRepaid = 0;
  let overdueAmount = 0;
  let activeCount = 0;
  let settledCount = 0;

  const buyerMap: Map<
    string,
    {
      buyerId: string;
      buyerName: string;
      totalDisbursed: number;
      outstanding: number;
      overdue: number;
      transactionCount: number;
    }
  > = new Map();

  for (const req of requests) {
    const acceptedOffer = req.offers.find((o) => o.status === FinancingOfferStatus.ACCEPTED) || req.offers[0];
    const amount = acceptedOffer
      ? parseFloat(acceptedOffer.amount.toString())
      : parseFloat((req.approvedAmount || req.requestedAmount).toString());
    
    const interestRate = acceptedOffer ? parseFloat(acceptedOffer.interestRate.toString()) : 12.5;
    const tenureDays = acceptedOffer ? acceptedOffer.tenureDays : (req.tenureDays || 60);
    const processingFee = acceptedOffer ? parseFloat(acceptedOffer.processingFee.toString()) : Math.round(amount * 0.01);
    const interest = Math.round(amount * (interestRate / 100) * (tenureDays / 365));
    const totalRepaymentDue = acceptedOffer
      ? parseFloat(acceptedOffer.totalRepayment.toString())
      : Math.round(amount + processingFee + interest);

    const isSettled = req.status === FinancingRequestStatus.REPAID;
    const isDisbursed = req.status === FinancingRequestStatus.DISBURSED || isSettled;

    if (isDisbursed) {
      totalDisbursed += amount;
    }

    const reqRepaid = isSettled ? totalRepaymentDue : 0;
    totalRepaid += reqRepaid;

    const reqOutstanding = isSettled ? 0 : isDisbursed ? totalRepaymentDue : 0;

    const createdDate = new Date(req.createdAt);
    const dueDate = new Date(createdDate.getTime() + tenureDays * 24 * 60 * 60 * 1000);
    const isOverdue = !isSettled && isDisbursed && dueDate.getTime() < now.getTime();

    if (isOverdue) {
      overdueAmount += reqOutstanding;
    }

    if (isSettled) {
      settledCount += 1;
    } else if (isDisbursed) {
      activeCount += 1;
    }

    // Accumulate Buyer Exposure
    const buyerId = req.invoice.buyer.id;
    const buyerName = req.invoice.buyer.name;
    const existing = buyerMap.get(buyerId) || {
      buyerId,
      buyerName,
      totalDisbursed: 0,
      outstanding: 0,
      overdue: 0,
      transactionCount: 0,
    };

    existing.totalDisbursed += amount;
    existing.outstanding += reqOutstanding;
    if (isOverdue) existing.overdue += reqOutstanding;
    existing.transactionCount += 1;
    buyerMap.set(buyerId, existing);
  }

  const totalOutstanding = Math.max(0, totalDisbursed - totalRepaid);

  // Format Buyer Exposures with B9 score and concentration %
  const buyerExposures = await Promise.all(
    Array.from(buyerMap.values()).map(async (b) => {
      let scoreObj = { score: 78, rating: 'Healthy' };
      try {
        const sampleReq = requests.find((r) => r.invoice.buyer.id === b.buyerId);
        if (sampleReq) {
          const res = await calculateBuyerPaymentScore(sampleReq.supplierId, b.buyerId);
          scoreObj = { score: res.creditScore, rating: res.riskLevel };
        }
      } catch {
        // Fallback
      }

      const concentrationPercent =
        totalOutstanding > 0 ? Math.round((b.outstanding / totalOutstanding) * 1000) / 10 : 0;

      return {
        ...b,
        paymentScore: scoreObj.score,
        riskCategory: scoreObj.rating,
        concentrationPercent,
        riskWarning:
          concentrationPercent > 25
            ? `Top buyer represents ${concentrationPercent}% of total outstanding exposure`
            : null,
      };
    })
  );

  buyerExposures.sort((a, b) => b.outstanding - a.outstanding);

  const onTimeRepaymentRate =
    activeCount + settledCount > 0 ? Math.round((settledCount / (activeCount + settledCount)) * 100) : 100;

  return {
    metrics: {
      totalDisbursed,
      totalRepaid,
      totalOutstanding,
      overdueAmount,
      activeCount,
      settledCount,
      totalTransactions: activeCount + settledCount,
      onTimeRepaymentRate,
      overdueRate: totalOutstanding > 0 ? Math.round((overdueAmount / totalOutstanding) * 100) : 0,
    },
    buyerExposures,
  };
};

export const getPortfolioList = async (
  userRole: string,
  _userCompanyId?: string | null,
  filters: PortfolioFilterQuery = {}
) => {
  if (userRole !== Role.FINANCIAL_INSTITUTION && userRole !== Role.ADMIN) {
    throw new Error('Access denied: Financial Institution role required');
  }

  const {
    q,
    status = 'ALL',
    minAmount,
    maxAmount,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = filters;

  const requests = await prisma.financingRequest.findMany({
    where: {
      status: {
        in: [FinancingRequestStatus.APPROVED, FinancingRequestStatus.DISBURSED, FinancingRequestStatus.REPAID],
      },
    },
    include: {
      supplier: true,
      invoice: {
        include: { buyer: true },
      },
      offers: true,
    },
    orderBy: {
      createdAt: sortOrder,
    },
  });

  const now = new Date();

  const formatted = requests.map((req, idx) => {
    const acceptedOffer = req.offers.find((o) => o.status === FinancingOfferStatus.ACCEPTED) || req.offers[0];
    const amount = acceptedOffer
      ? parseFloat(acceptedOffer.amount.toString())
      : parseFloat((req.approvedAmount || req.requestedAmount).toString());

    const interestRate = acceptedOffer ? parseFloat(acceptedOffer.interestRate.toString()) : 12.5;
    const tenureDays = acceptedOffer ? acceptedOffer.tenureDays : (req.tenureDays || 60);
    const processingFee = acceptedOffer ? parseFloat(acceptedOffer.processingFee.toString()) : Math.round(amount * 0.01);
    const interest = Math.round(amount * (interestRate / 100) * (tenureDays / 365));
    const totalRepaymentDue = acceptedOffer
      ? parseFloat(acceptedOffer.totalRepayment.toString())
      : Math.round(amount + processingFee + interest);

    const isSettled = req.status === FinancingRequestStatus.REPAID;
    const amountRepaid = isSettled ? totalRepaymentDue : 0;
    const outstanding = Math.max(0, totalRepaymentDue - amountRepaid);

    const createdDate = new Date(req.createdAt);
    const dueDate = new Date(createdDate.getTime() + tenureDays * 24 * 60 * 60 * 1000);
    const diffTime = dueDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = !isSettled && dueDate.getTime() < now.getTime();

    let computedStatus = isSettled ? 'REPAID' : req.status === FinancingRequestStatus.APPROVED ? 'APPROVED' : 'ACTIVE';
    if (isOverdue) computedStatus = 'OVERDUE';

    // Deterministic Risk Indicator
    let riskIndicator = 'NORMAL';
    if (isOverdue) {
      riskIndicator = 'OVERDUE';
    } else if (daysRemaining <= 7 && !isSettled) {
      riskIndicator = 'MATURING SOON';
    }

    return {
      id: req.id,
      financingId: `FIN-${(idx + 1).toString().padStart(3, '0')}`,
      offerId: acceptedOffer ? `OFF-${acceptedOffer.id.slice(0, 6).toUpperCase()}` : 'N/A',
      invoiceNumber: req.invoice.invoiceNumber,
      invoiceAmount: parseFloat(req.invoice.amount.toString()),
      disbursedAmount: amount,
      totalRepaymentDue,
      amountRepaid,
      outstanding,
      interestRate,
      tenureDays,
      dueDate: dueDate.toISOString(),
      daysRemaining,
      isOverdue,
      daysOverdue: isOverdue ? Math.abs(daysRemaining) : 0,
      status: computedStatus,
      riskIndicator,
      supplier: {
        id: req.supplier.id,
        name: req.supplier.name,
      },
      buyer: {
        id: req.invoice.buyer.id,
        name: req.invoice.buyer.name,
      },
      createdAt: req.createdAt.toISOString(),
    };
  });

  let filtered = formatted;
  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    filtered = filtered.filter(
      (f) =>
        f.financingId.toLowerCase().includes(term) ||
        f.invoiceNumber.toLowerCase().includes(term) ||
        f.supplier.name.toLowerCase().includes(term) ||
        f.buyer.name.toLowerCase().includes(term)
    );
  }

  if (status && status !== 'ALL') {
    filtered = filtered.filter((f) => f.status === status);
  }

  if (minAmount || maxAmount) {
    filtered = filtered.filter((f) => {
      if (minAmount && f.disbursedAmount < minAmount) return false;
      if (maxAmount && f.disbursedAmount > maxAmount) return false;
      return true;
    });
  }

  if (sortBy === 'amount') {
    filtered.sort((a, b) =>
      sortOrder === 'asc' ? a.disbursedAmount - b.disbursedAmount : b.disbursedAmount - a.disbursedAmount
    );
  } else if (sortBy === 'outstanding') {
    filtered.sort((a, b) =>
      sortOrder === 'asc' ? a.outstanding - b.outstanding : b.outstanding - a.outstanding
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIdx = (safePage - 1) * limit;
  const paginated = filtered.slice(startIdx, startIdx + limit);

  return {
    portfolio: paginated,
    pagination: {
      total,
      page: safePage,
      limit,
      totalPages,
    },
  };
};

export const getPortfolioDetails = async (userRole: string, requestId: string) => {
  if (userRole !== Role.FINANCIAL_INSTITUTION && userRole !== Role.ADMIN) {
    throw new Error('Access denied: Financial Institution role required');
  }

  const req = await prisma.financingRequest.findUnique({
    where: { id: requestId },
    include: {
      supplier: true,
      invoice: {
        include: { buyer: true },
      },
      offers: true,
    },
  });

  if (!req) {
    throw new Error('Portfolio financing details not found');
  }

  const acceptedOffer = req.offers.find((o) => o.status === FinancingOfferStatus.ACCEPTED) || req.offers[0];
  const amount = acceptedOffer
    ? parseFloat(acceptedOffer.amount.toString())
    : parseFloat((req.approvedAmount || req.requestedAmount).toString());

  const interestRate = acceptedOffer ? parseFloat(acceptedOffer.interestRate.toString()) : 12.5;
  const tenureDays = acceptedOffer ? acceptedOffer.tenureDays : (req.tenureDays || 60);
  const processingFee = acceptedOffer ? parseFloat(acceptedOffer.processingFee.toString()) : Math.round(amount * 0.01);
  const interest = Math.round(amount * (interestRate / 100) * (tenureDays / 365));
  const totalRepaymentDue = acceptedOffer
    ? parseFloat(acceptedOffer.totalRepayment.toString())
    : Math.round(amount + processingFee + interest);

  const isSettled = req.status === FinancingRequestStatus.REPAID;
  const amountRepaid = isSettled ? totalRepaymentDue : 0;
  const outstanding = Math.max(0, totalRepaymentDue - amountRepaid);

  const createdDate = new Date(req.createdAt);
  const dueDate = new Date(createdDate.getTime() + tenureDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = !isSettled && dueDate.getTime() < now.getTime();

  let scoreObj = { score: 78, riskCategory: 'Healthy' };
  try {
    const res = await calculateBuyerPaymentScore(req.supplierId, req.invoice.buyer.id);
    scoreObj = { score: res.creditScore, riskCategory: res.riskLevel };
  } catch {
    // Fallback
  }

  // Lifecycle Timeline Events
  const timeline = [
    { event: 'Invoice Created', date: req.invoice.createdAt.toISOString(), status: 'COMPLETED' },
    { event: 'Buyer Approved Invoice', date: req.invoice.updatedAt.toISOString(), status: 'COMPLETED' },
    { event: 'Financing Requested', date: req.createdAt.toISOString(), status: 'COMPLETED' },
    {
      event: 'Underwriting Approved',
      date: req.updatedAt.toISOString(),
      status: req.status !== FinancingRequestStatus.PENDING ? 'COMPLETED' : 'PENDING',
    },
    {
      event: 'Financing Offer Accepted',
      date: acceptedOffer ? acceptedOffer.createdAt.toISOString() : req.updatedAt.toISOString(),
      status: acceptedOffer ? 'COMPLETED' : 'PENDING',
    },
    {
      event: 'Disbursement Executed',
      date: req.updatedAt.toISOString(),
      status: req.status === FinancingRequestStatus.DISBURSED || isSettled ? 'COMPLETED' : 'PENDING',
    },
    {
      event: 'Repayment & Settlement',
      date: isSettled ? req.updatedAt.toISOString() : dueDate.toISOString(),
      status: isSettled ? 'COMPLETED' : 'PENDING',
    },
  ];

  return {
    id: req.id,
    financingId: `FIN-${req.id.slice(0, 6).toUpperCase()}`,
    offerId: acceptedOffer ? `OFF-${acceptedOffer.id.slice(0, 6).toUpperCase()}` : 'N/A',
    invoiceNumber: req.invoice.invoiceNumber,
    invoiceAmount: parseFloat(req.invoice.amount.toString()),
    disbursedAmount: amount,
    totalRepaymentDue,
    amountRepaid,
    outstanding,
    interestRate,
    tenureDays,
    processingFee,
    interest,
    providerName: acceptedOffer ? acceptedOffer.providerName : 'Financial Institution',
    dueDate: dueDate.toISOString(),
    daysRemaining,
    isOverdue,
    daysOverdue: isOverdue ? Math.abs(daysRemaining) : 0,
    status: isSettled ? 'REPAID' : req.status === FinancingRequestStatus.APPROVED ? 'APPROVED' : 'ACTIVE',
    buyerScore: scoreObj,
    timeline,
    supplier: {
      id: req.supplier.id,
      name: req.supplier.name,
      email: req.supplier.email,
      phone: req.supplier.phone,
    },
    buyer: {
      id: req.invoice.buyer.id,
      name: req.invoice.buyer.name,
      email: req.invoice.buyer.email,
      phone: req.invoice.buyer.phone,
    },
    createdAt: req.createdAt.toISOString(),
  };
};
