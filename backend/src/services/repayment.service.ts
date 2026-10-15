import { FinancingOfferStatus, FinancingRequestStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface RepaymentFilterQuery {
  q?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getRepaymentQueue = async (
  userRole: string,
  _userCompanyId?: string | null,
  filters: RepaymentFilterQuery = {}
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
        in: [FinancingRequestStatus.DISBURSED, FinancingRequestStatus.REPAID],
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
    const disbursedAmount = acceptedOffer
      ? parseFloat(acceptedOffer.amount.toString())
      : parseFloat((req.approvedAmount || req.requestedAmount).toString());
    
    const interestRate = acceptedOffer ? parseFloat(acceptedOffer.interestRate.toString()) : 12.5;
    const tenureDays = acceptedOffer ? acceptedOffer.tenureDays : (req.tenureDays || 60);
    const processingFee = acceptedOffer ? parseFloat(acceptedOffer.processingFee.toString()) : Math.round(disbursedAmount * 0.01);
    
    const interest = Math.round(disbursedAmount * (interestRate / 100) * (tenureDays / 365));
    const totalRepaymentDue = acceptedOffer
      ? parseFloat(acceptedOffer.totalRepayment.toString())
      : Math.round(disbursedAmount + processingFee + interest);

    // Calculate due date
    const createdDate = new Date(req.createdAt);
    const dueDate = new Date(createdDate.getTime() + tenureDays * 24 * 60 * 60 * 1000);
    const diffTime = dueDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0 && req.status !== FinancingRequestStatus.REPAID;

    // Simulate current repaid amount state (If status is REPAID, amountRepaid = totalRepaymentDue)
    const amountRepaid = req.status === FinancingRequestStatus.REPAID ? totalRepaymentDue : 0;
    const outstandingBalance = Math.max(0, totalRepaymentDue - amountRepaid);

    let computedStatus = req.status === FinancingRequestStatus.REPAID ? 'REPAID' : 'ACTIVE';
    if (req.status !== FinancingRequestStatus.REPAID) {
      if (isOverdue) {
        computedStatus = 'OVERDUE';
      } else if (amountRepaid > 0) {
        computedStatus = 'PARTIALLY_REPAID';
      }
    }

    return {
      id: req.id,
      financingId: `FIN-${(idx + 1).toString().padStart(3, '0')}`,
      offerId: acceptedOffer ? `OFF-${acceptedOffer.id.slice(0, 6).toUpperCase()}` : 'N/A',
      invoiceNumber: req.invoice.invoiceNumber,
      invoiceAmount: parseFloat(req.invoice.amount.toString()),
      disbursedAmount,
      totalRepaymentDue,
      amountRepaid,
      outstandingBalance,
      interestRate,
      tenureDays,
      processingFee,
      providerName: acceptedOffer ? acceptedOffer.providerName : 'KredX Working Capital Trust',
      supplier: {
        id: req.supplier.id,
        name: req.supplier.name,
      },
      buyer: {
        id: req.invoice.buyer.id,
        name: req.invoice.buyer.name,
      },
      dueDate: dueDate.toISOString(),
      daysRemaining,
      isOverdue,
      daysOverdue: isOverdue ? Math.abs(daysRemaining) : 0,
      status: computedStatus,
      disbursementMethod: 'SIMULATED / MANUAL DISBURSEMENT',
      createdAt: req.createdAt.toISOString(),
    };
  });

  // Filter by search query
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

  // Filter by status
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
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIdx = (safePage - 1) * limit;
  const paginated = filtered.slice(startIdx, startIdx + limit);

  return {
    repayments: paginated,
    pagination: {
      total,
      page: safePage,
      limit,
      totalPages,
    },
  };
};

export const getRepaymentDetails = async (userRole: string, requestId: string) => {
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
    throw new Error('Financing transaction not found');
  }

  const acceptedOffer = req.offers.find((o) => o.status === FinancingOfferStatus.ACCEPTED) || req.offers[0];
  const disbursedAmount = acceptedOffer
    ? parseFloat(acceptedOffer.amount.toString())
    : parseFloat((req.approvedAmount || req.requestedAmount).toString());
  
  const interestRate = acceptedOffer ? parseFloat(acceptedOffer.interestRate.toString()) : 12.5;
  const tenureDays = acceptedOffer ? acceptedOffer.tenureDays : (req.tenureDays || 60);
  const processingFee = acceptedOffer ? parseFloat(acceptedOffer.processingFee.toString()) : Math.round(disbursedAmount * 0.01);
  
  const interest = Math.round(disbursedAmount * (interestRate / 100) * (tenureDays / 365));
  const totalRepaymentDue = acceptedOffer
    ? parseFloat(acceptedOffer.totalRepayment.toString())
    : Math.round(disbursedAmount + processingFee + interest);

  const now = new Date();
  const createdDate = new Date(req.createdAt);
  const dueDate = new Date(createdDate.getTime() + tenureDays * 24 * 60 * 60 * 1000);
  const diffTime = dueDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0 && req.status !== FinancingRequestStatus.REPAID;

  const amountRepaid = req.status === FinancingRequestStatus.REPAID ? totalRepaymentDue : 0;
  const outstandingBalance = Math.max(0, totalRepaymentDue - amountRepaid);

  let computedStatus = req.status === FinancingRequestStatus.REPAID ? 'REPAID' : 'ACTIVE';
  if (req.status !== FinancingRequestStatus.REPAID) {
    if (isOverdue) {
      computedStatus = 'OVERDUE';
    } else if (amountRepaid > 0) {
      computedStatus = 'PARTIALLY_REPAID';
    }
  }

  return {
    id: req.id,
    financingId: `FIN-${req.id.slice(0, 6).toUpperCase()}`,
    offerId: acceptedOffer ? `OFF-${acceptedOffer.id.slice(0, 6).toUpperCase()}` : 'N/A',
    invoiceNumber: req.invoice.invoiceNumber,
    invoiceAmount: parseFloat(req.invoice.amount.toString()),
    disbursedAmount,
    totalRepaymentDue,
    amountRepaid,
    outstandingBalance,
    interestRate,
    tenureDays,
    processingFee,
    interest,
    providerName: acceptedOffer ? acceptedOffer.providerName : 'Financial Institution',
    dueDate: dueDate.toISOString(),
    daysRemaining,
    isOverdue,
    daysOverdue: isOverdue ? Math.abs(daysRemaining) : 0,
    status: computedStatus,
    schedule: [
      {
        installmentNumber: 1,
        dueDate: dueDate.toISOString(),
        principal: disbursedAmount,
        interest,
        fees: processingFee,
        totalDue: totalRepaymentDue,
        paidAmount: amountRepaid,
        outstanding: outstandingBalance,
        status: req.status === FinancingRequestStatus.REPAID ? 'PAID' : isOverdue ? 'OVERDUE' : 'DUE',
      },
    ],
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

export const recordRepaymentService = async (
  user: { id: string; name: string; role: string; companyId?: string | null; company?: any },
  requestId: string,
  repaymentAmount: number,
  notes?: string
) => {
  if (user.role !== Role.FINANCIAL_INSTITUTION && user.role !== Role.ADMIN) {
    throw new Error('Access denied: Financial Institution role required to record repayment');
  }

  if (!repaymentAmount || repaymentAmount <= 0) {
    throw new Error('Repayment amount must be greater than 0');
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.financingRequest.findUnique({
      where: { id: requestId },
      include: {
        invoice: { include: { buyer: true } },
        supplier: true,
        offers: true,
      },
    });

    if (!request) {
      throw new Error('Financing transaction not found');
    }

    if (request.status === FinancingRequestStatus.REPAID) {
      throw new Error('Already fully repaid: This financing transaction has already been settled.');
    }

    if (request.status !== FinancingRequestStatus.DISBURSED) {
      throw new Error(`Cannot record repayment for transaction in status ${request.status}. Must be DISBURSED.`);
    }

    const acceptedOffer = request.offers.find((o) => o.status === FinancingOfferStatus.ACCEPTED) || request.offers[0];
    const disbursedAmount = acceptedOffer
      ? parseFloat(acceptedOffer.amount.toString())
      : parseFloat((request.approvedAmount || request.requestedAmount).toString());

    const interestRate = acceptedOffer ? parseFloat(acceptedOffer.interestRate.toString()) : 12.5;
    const tenureDays = acceptedOffer ? acceptedOffer.tenureDays : (request.tenureDays || 60);
    const processingFee = acceptedOffer ? parseFloat(acceptedOffer.processingFee.toString()) : Math.round(disbursedAmount * 0.01);
    const interest = Math.round(disbursedAmount * (interestRate / 100) * (tenureDays / 365));
    const totalRepaymentDue = acceptedOffer
      ? parseFloat(acceptedOffer.totalRepayment.toString())
      : Math.round(disbursedAmount + processingFee + interest);

    if (repaymentAmount > totalRepaymentDue) {
      throw new Error(`Repayment amount (₹${repaymentAmount.toLocaleString('en-IN')}) cannot exceed total balance due (₹${totalRepaymentDue.toLocaleString('en-IN')})`);
    }

    // Full repayment transition
    const updatedRequest = await tx.financingRequest.update({
      where: { id: requestId },
      data: {
        status: FinancingRequestStatus.REPAID,
      },
      include: {
        invoice: { include: { buyer: true } },
        supplier: true,
        offers: true,
      },
    });

    const institutionName = user.company?.name || acceptedOffer?.providerName || 'Financial Institution';

    // Notify supplier
    const supplierUsers = await tx.user.findMany({
      where: { companyId: request.supplierId },
    });

    for (const u of supplierUsers) {
      await tx.notification.create({
        data: {
          userId: u.id,
          title: 'Financing Obligation Settled',
          message: `Repayment of ₹${repaymentAmount.toLocaleString('en-IN')} for invoice ${request.invoice.invoiceNumber} has been recorded by ${institutionName}. Transaction is fully SETTLED.`,
          type: 'FINANCING',
        },
      });
    }

    return {
      request: updatedRequest,
      audit: {
        repaymentId: `REP-${request.id.slice(0, 6).toUpperCase()}`,
        status: 'REPAID',
        repaymentAmount,
        remainingBalance: 0,
        recordedBy: user.name,
        recordedRole: user.role,
        institutionName,
        method: 'SIMULATED / MANUAL REPAYMENT',
        timestamp: new Date().toISOString(),
        notes: notes || 'Simulated repayment recorded successfully.',
      },
    };
  });
};
