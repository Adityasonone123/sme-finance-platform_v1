import { FinancingRequestStatus, InvoiceStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { calculateBuyerPaymentScore } from './buyer-score.service.js';
import { checkInvoiceEligibility } from './financing-eligibility.service.js';

export interface UnderwritingCheckItem {
  id: string;
  name: string;
  category: 'INVOICE' | 'BUYER' | 'RELATIONSHIP' | 'LIMITS' | 'TENOR';
  result: 'PASS' | 'WARNING' | 'FAIL';
  detail: string;
}

export interface UnderwritingFilterQuery {
  q?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getUnderwritingQueue = async (
  userRole: string,
  _userCompanyId?: string | null,
  filters: UnderwritingFilterQuery = {}
) => {
  if (userRole !== Role.FINANCIAL_INSTITUTION && userRole !== Role.ADMIN) {
    throw new Error('Access denied: Financial Institution role required');
  }

  const {
    q,
    status = 'PENDING',
    minAmount,
    maxAmount,
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
  } else if (status === 'REJECTED') {
    where.status = FinancingRequestStatus.REJECTED;
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

  let queueItems = await Promise.all(
    requests.map(async (req) => {
      const invoiceAmount = parseFloat(req.invoice.amount.toString());
      const requestedAmount = parseFloat(req.requestedAmount.toString());

      const dueDateMs = new Date(req.invoice.dueDate).getTime();
      const remainingTenorDays = Math.max(0, Math.ceil((dueDateMs - now) / (1000 * 60 * 60 * 24)));

      let buyerScore = 85;
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

      try {
        const scoreRes = await calculateBuyerPaymentScore(req.supplierId, req.invoice.buyerId);
        buyerScore = scoreRes.creditScore;
        riskLevel = scoreRes.riskLevel;
      } catch {
        // Fallback
      }

      return {
        id: req.id,
        requestId: `REQ-${req.id.slice(0, 6).toUpperCase()}`,
        invoiceId: req.invoice.id,
        invoiceNumber: req.invoice.invoiceNumber,
        invoiceAmount,
        requestedAmount,
        approvedAmount: req.approvedAmount ? parseFloat(req.approvedAmount.toString()) : null,
        dueDate: req.invoice.dueDate.toISOString(),
        remainingTenorDays,
        status: req.status,
        supplier: {
          id: req.supplier.id,
          name: req.supplier.name,
        },
        buyer: {
          id: req.invoice.buyer.id,
          name: req.invoice.buyer.name,
          paymentScore: buyerScore,
          riskLevel,
        },
        createdAt: req.createdAt.toISOString(),
      };
    })
  );

  if (sortBy === 'amount') {
    queueItems.sort((a, b) =>
      sortOrder === 'asc' ? a.requestedAmount - b.requestedAmount : b.requestedAmount - a.requestedAmount
    );
  } else if (sortBy === 'dueDate') {
    queueItems.sort((a, b) =>
      sortOrder === 'asc' ? a.remainingTenorDays - b.remainingTenorDays : b.remainingTenorDays - a.remainingTenorDays
    );
  } else if (sortBy === 'buyerScore') {
    queueItems.sort((a, b) =>
      sortOrder === 'asc' ? a.buyer.paymentScore - b.buyer.paymentScore : b.buyer.paymentScore - a.buyer.paymentScore
    );
  }

  const total = queueItems.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIdx = (safePage - 1) * limit;
  const paginatedItems = queueItems.slice(startIdx, startIdx + limit);

  return {
    requests: paginatedItems,
    pagination: {
      total,
      page: safePage,
      limit,
      totalPages,
    },
  };
};

export const getUnderwritingChecks = async (
  supplierId: string,
  buyerId: string,
  invoice: any,
  requestedAmount: number
): Promise<UnderwritingCheckItem[]> => {
  const checks: UnderwritingCheckItem[] = [];

  // 1. Buyer Invoice Approval
  if (invoice.status === InvoiceStatus.APPROVED || invoice.status === InvoiceStatus.PARTIALLY_PAID) {
    checks.push({
      id: 'buyer-approval',
      name: 'Buyer Invoice Acceptance',
      category: 'INVOICE',
      result: 'PASS',
      detail: `Invoice status is ${invoice.status} (Verified corporate acceptance).`,
    });
  } else {
    checks.push({
      id: 'buyer-approval',
      name: 'Buyer Invoice Acceptance',
      category: 'INVOICE',
      result: 'FAIL',
      detail: `Invoice status is ${invoice.status} (Invoice not approved by buyer).`,
    });
  }

  // 2. Active Supplier-Buyer Relationship
  const rel = await prisma.supplierBuyer.findUnique({
    where: { supplierId_buyerId: { supplierId, buyerId } },
  });
  if (rel && rel.status === 'ACTIVE') {
    checks.push({
      id: 'relationship-status',
      name: 'Supplier-Buyer Relationship Status',
      category: 'RELATIONSHIP',
      result: 'PASS',
      detail: 'Supplier and Corporate Buyer have an active business relationship.',
    });
  } else {
    checks.push({
      id: 'relationship-status',
      name: 'Supplier-Buyer Relationship Status',
      category: 'RELATIONSHIP',
      result: 'FAIL',
      detail: 'No ACTIVE relationship registered between supplier and buyer.',
    });
  }

  // 3. Outstanding Invoice Balance
  const totalAmount = parseFloat(invoice.amount.toString());
  const paidAmount = (invoice.payments || []).reduce(
    (sum: number, p: any) => sum + parseFloat(p.amount.toString()),
    0
  );
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  if (remainingAmount > 0) {
    checks.push({
      id: 'invoice-balance',
      name: 'Outstanding Invoice Balance',
      category: 'INVOICE',
      result: 'PASS',
      detail: `Unpaid receivable balance remains: ₹${remainingAmount.toLocaleString('en-IN')}`,
    });
  } else {
    checks.push({
      id: 'invoice-balance',
      name: 'Outstanding Invoice Balance',
      category: 'INVOICE',
      result: 'FAIL',
      detail: 'Invoice balance has already been fully settled.',
    });
  }

  // 4. Buyer Payment Score (B9 Engine)
  try {
    const scoreRes = await calculateBuyerPaymentScore(supplierId, buyerId);
    if (scoreRes.creditScore >= 75) {
      checks.push({
        id: 'buyer-score',
        name: 'Corporate Buyer Credit Discipline (B9)',
        category: 'BUYER',
        result: 'PASS',
        detail: `Buyer payment score is ${scoreRes.creditScore}/100 (${scoreRes.riskLevel} Risk).`,
      });
    } else if (scoreRes.creditScore >= 60) {
      checks.push({
        id: 'buyer-score',
        name: 'Corporate Buyer Credit Discipline (B9)',
        category: 'BUYER',
        result: 'WARNING',
        detail: `Moderate buyer payment score: ${scoreRes.creditScore}/100 (${scoreRes.riskLevel} Risk).`,
      });
    } else {
      checks.push({
        id: 'buyer-score',
        name: 'Corporate Buyer Credit Discipline (B9)',
        category: 'BUYER',
        result: 'FAIL',
        detail: `Elevated buyer risk level: Score ${scoreRes.creditScore}/100 (${scoreRes.riskLevel} Risk).`,
      });
    }
  } catch {
    checks.push({
      id: 'buyer-score',
      name: 'Corporate Buyer Credit Discipline (B9)',
      category: 'BUYER',
      result: 'WARNING',
      detail: 'Standard baseline buyer score applied (85/100 LOW Risk).',
    });
  }

  // 5. Max Eligible Financing Cap (80%)
  const maxCap = Math.round(remainingAmount * 0.8);
  if (requestedAmount <= maxCap) {
    checks.push({
      id: 'financing-cap',
      name: 'Financing Amount Eligibility Cap',
      category: 'LIMITS',
      result: 'PASS',
      detail: `Requested amount (₹${requestedAmount.toLocaleString('en-IN')}) is within 80% cap (₹${maxCap.toLocaleString('en-IN')}).`,
    });
  } else {
    checks.push({
      id: 'financing-cap',
      name: 'Financing Amount Eligibility Cap',
      category: 'LIMITS',
      result: 'FAIL',
      detail: `Requested amount exceeds 80% maximum cap (₹${maxCap.toLocaleString('en-IN')}).`,
    });
  }

  // 6. Lender Credit Exposure Limit
  const activeFinancing = await prisma.financingRequest.findMany({
    where: {
      invoice: { buyerId },
      status: { in: [FinancingRequestStatus.APPROVED, FinancingRequestStatus.DISBURSED] },
    },
  });
  const currentExposure = activeFinancing.reduce(
    (sum, f) => sum + parseFloat((f.approvedAmount || f.requestedAmount).toString()),
    0
  );
  const buyerLimit = 25000000; // ₹2.5 Crore default credit limit cap per corporate buyer
  if (currentExposure + requestedAmount <= buyerLimit) {
    checks.push({
      id: 'exposure-limit',
      name: 'Lender Corporate Buyer Exposure Limit',
      category: 'LIMITS',
      result: 'PASS',
      detail: `Post-financing exposure (₹${(currentExposure + requestedAmount).toLocaleString('en-IN')}) fits within ₹2.5 Cr limit.`,
    });
  } else {
    checks.push({
      id: 'exposure-limit',
      name: 'Lender Corporate Buyer Exposure Limit',
      category: 'LIMITS',
      result: 'FAIL',
      detail: `Post-financing exposure exceeds ₹2.5 Cr corporate credit limit.`,
    });
  }

  // 7. Invoice Due Date & Remaining Tenor
  const now = new Date().getTime();
  const dueDateMs = new Date(invoice.dueDate).getTime();
  if (dueDateMs > now) {
    const daysLeft = Math.ceil((dueDateMs - now) / (1000 * 60 * 60 * 24));
    checks.push({
      id: 'invoice-tenor',
      name: 'Invoice Maturity & Tenor',
      category: 'TENOR',
      result: 'PASS',
      detail: `Invoice is valid with ${daysLeft} days remaining to maturity date.`,
    });
  } else {
    checks.push({
      id: 'invoice-tenor',
      name: 'Invoice Maturity & Tenor',
      category: 'TENOR',
      result: 'FAIL',
      detail: 'Invoice is past due date or expired.',
    });
  }

  return checks;
};

export const getUnderwritingDetails = async (
  userRole: string,
  requestId: string
) => {
  if (userRole !== Role.FINANCIAL_INSTITUTION && userRole !== Role.ADMIN) {
    throw new Error('Access denied: Financial Institution role required');
  }

  const req = await prisma.financingRequest.findUnique({
    where: { id: requestId },
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
    throw new Error('Financing request not found');
  }

  const invoiceAmount = parseFloat(req.invoice.amount.toString());
  const requestedAmount = parseFloat(req.requestedAmount.toString());

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

  const checks = await getUnderwritingChecks(req.supplierId, req.invoice.buyerId, req.invoice, requestedAmount);

  // Calculate Buyer Credit Exposure from database
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

  const buyerCreditLimit = 25000000;
  const proposedFinancing = requestedAmount;
  const exposureAfterFinancing = currentBuyerExposure + proposedFinancing;
  const remainingCreditLimit = Math.max(0, buyerCreditLimit - exposureAfterFinancing);

  // Historical Payment Summary
  const buyerInvoices = await prisma.invoice.findMany({
    where: { buyerId: req.invoice.buyerId },
    include: { payments: true },
  });

  const evaluatedCount = buyerInvoices.length;
  const paidCount = buyerInvoices.filter((inv) => inv.status === InvoiceStatus.PAID).length;
  const overdueCount = buyerInvoices.filter((inv) => inv.status === InvoiceStatus.OVERDUE).length;
  const pendingCount = buyerInvoices.filter((inv) => inv.status === InvoiceStatus.PENDING || inv.status === InvoiceStatus.APPROVED).length;

  return {
    request: {
      id: req.id,
      requestId: `REQ-${req.id.slice(0, 6).toUpperCase()}`,
      invoiceId: req.invoice.id,
      invoiceNumber: req.invoice.invoiceNumber,
      invoiceAmount,
      requestedAmount,
      approvedAmount: req.approvedAmount ? parseFloat(req.approvedAmount.toString()) : null,
      interestRate: req.interestRate ? parseFloat(req.interestRate.toString()) : 12.5,
      tenureDays: req.tenureDays || 60,
      issueDate: req.invoice.issueDate.toISOString(),
      dueDate: req.invoice.dueDate.toISOString(),
      remainingTenorDays,
      paymentTermsDays: req.invoice.paymentTerms,
      status: req.status,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
    },
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
    paymentHistory: {
      evaluatedCount,
      paidCount,
      overdueCount,
      pendingCount,
      avgDelayDays: Math.max(0, avgPaymentDays - req.invoice.paymentTerms),
    },
    exposure: {
      currentBuyerExposure,
      proposedFinancing,
      exposureAfterFinancing,
      buyerCreditLimit,
      remainingCreditLimit,
    },
    checks,
  };
};

export const processUnderwritingApproval = async (
  user: { id: string; name: string; role: string; companyId?: string | null; company?: any },
  requestId: string,
  approvedAmount?: number,
  notes?: string
) => {
  if (user.role !== Role.FINANCIAL_INSTITUTION && user.role !== Role.ADMIN) {
    throw new Error('Access denied: Financial Institution role required');
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.financingRequest.findUnique({
      where: { id: requestId },
      include: {
        invoice: { include: { buyer: true } },
        supplier: true,
      },
    });

    if (!request) {
      throw new Error('Financing request not found');
    }

    if (request.status !== FinancingRequestStatus.PENDING) {
      throw new Error(`Cannot approve underwriting for request in status ${request.status}. Decision already recorded.`);
    }

    const eligibility = await checkInvoiceEligibility(request.supplierId, request.invoiceId);
    if (!eligibility.eligible && eligibility.reasons.some((r) => r.includes('rejected') || r.includes('paid'))) {
      throw new Error(`Cannot approve request: ${eligibility.reasons.join(', ')}`);
    }

    const finalAmount = approvedAmount || parseFloat(request.requestedAmount.toString());

    const updated = await tx.financingRequest.update({
      where: { id: requestId },
      data: {
        status: FinancingRequestStatus.APPROVED,
        approvedAmount: finalAmount,
      },
      include: {
        invoice: { include: { buyer: true } },
        supplier: true,
        offers: true,
      },
    });

    const supplierUsers = await tx.user.findMany({
      where: { companyId: request.supplierId },
    });

    const institutionName = user.company?.name || 'Financial Institution';

    for (const u of supplierUsers) {
      await tx.notification.create({
        data: {
          userId: u.id,
          title: 'Underwriting Approved',
          message: `Financing request for invoice ${request.invoice.invoiceNumber} (₹${finalAmount.toLocaleString('en-IN')}) has been APPROVED by ${institutionName}. Notes: ${notes || 'Checks passed'}`,
          type: 'FINANCING',
        },
      });
    }

    return {
      request: updated,
      audit: {
        decision: 'APPROVED',
        underwriterName: user.name,
        underwriterRole: user.role,
        institutionName,
        timestamp: new Date().toISOString(),
        approvedAmount: finalAmount,
        notes: notes || 'Rule-based underwriting checks verified and approved.',
      },
    };
  });
};

export const processUnderwritingRejection = async (
  user: { id: string; name: string; role: string; companyId?: string | null; company?: any },
  requestId: string,
  rejectionReason: string,
  notes?: string
) => {
  if (user.role !== Role.FINANCIAL_INSTITUTION && user.role !== Role.ADMIN) {
    throw new Error('Access denied: Financial Institution role required');
  }

  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error('Rejection reason is required');
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.financingRequest.findUnique({
      where: { id: requestId },
      include: {
        invoice: { include: { buyer: true } },
        supplier: true,
      },
    });

    if (!request) {
      throw new Error('Financing request not found');
    }

    if (request.status !== FinancingRequestStatus.PENDING) {
      throw new Error(`Cannot reject underwriting for request in status ${request.status}. Decision already recorded.`);
    }

    const updated = await tx.financingRequest.update({
      where: { id: requestId },
      data: {
        status: FinancingRequestStatus.REJECTED,
      },
      include: {
        invoice: { include: { buyer: true } },
        supplier: true,
        offers: true,
      },
    });

    const institutionName = user.company?.name || 'Financial Institution';

    const supplierUsers = await tx.user.findMany({
      where: { companyId: request.supplierId },
    });

    for (const u of supplierUsers) {
      await tx.notification.create({
        data: {
          userId: u.id,
          title: 'Underwriting Request Declined',
          message: `Financing request for invoice ${request.invoice.invoiceNumber} was declined by ${institutionName}. Reason: ${rejectionReason.trim()}`,
          type: 'FINANCING',
        },
      });
    }

    return {
      request: updated,
      audit: {
        decision: 'REJECTED',
        underwriterName: user.name,
        underwriterRole: user.role,
        institutionName,
        timestamp: new Date().toISOString(),
        rejectionReason: rejectionReason.trim(),
        notes: notes || 'Financing request declined during underwriting review.',
      },
    };
  });
};
