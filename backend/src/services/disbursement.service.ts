import { FinancingOfferStatus, FinancingRequestStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface DisbursementFilterQuery {
  q?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getDisbursementQueue = async (
  userRole: string,
  _userCompanyId?: string | null,
  filters: DisbursementFilterQuery = {}
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

  const where: any = {};

  if (status === 'READY') {
    where.status = FinancingRequestStatus.APPROVED;
  } else if (status === 'DISBURSED') {
    where.status = FinancingRequestStatus.DISBURSED;
  } else if (status === 'REPAID') {
    where.status = FinancingRequestStatus.REPAID;
  } else {
    where.status = {
      in: [FinancingRequestStatus.APPROVED, FinancingRequestStatus.DISBURSED, FinancingRequestStatus.REPAID],
    };
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
        include: { buyer: true },
      },
      offers: true,
    },
    orderBy: {
      createdAt: sortOrder,
    },
  });

  const formatted = requests.map((req, idx) => {
    const acceptedOffer = req.offers.find((o) => o.status === FinancingOfferStatus.ACCEPTED) || req.offers[0];
    const amount = acceptedOffer
      ? parseFloat(acceptedOffer.amount.toString())
      : parseFloat((req.approvedAmount || req.requestedAmount).toString());
    const invoiceAmount = parseFloat(req.invoice.amount.toString());

    return {
      id: req.id,
      disbursementId: `DIS-${(idx + 1).toString().padStart(3, '0')}`,
      offerId: acceptedOffer ? `OFF-${acceptedOffer.id.slice(0, 6).toUpperCase()}` : 'N/A',
      invoiceNumber: req.invoice.invoiceNumber,
      invoiceAmount,
      disbursementAmount: amount,
      providerName: acceptedOffer ? acceptedOffer.providerName : 'KredX Working Capital Trust',
      supplier: {
        id: req.supplier.id,
        name: req.supplier.name,
      },
      buyer: {
        id: req.invoice.buyer.id,
        name: req.invoice.buyer.name,
      },
      status: req.status === FinancingRequestStatus.APPROVED ? 'READY' : req.status,
      disbursementMethod: 'SIMULATED / MANUAL DISBURSEMENT',
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
    };
  });

  if (sortBy === 'amount') {
    formatted.sort((a, b) =>
      sortOrder === 'asc' ? a.disbursementAmount - b.disbursementAmount : b.disbursementAmount - a.disbursementAmount
    );
  }

  const total = formatted.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIdx = (safePage - 1) * limit;
  const paginated = formatted.slice(startIdx, startIdx + limit);

  return {
    disbursements: paginated,
    pagination: {
      total,
      page: safePage,
      limit,
      totalPages,
    },
  };
};

export const getDisbursementDetails = async (userRole: string, requestId: string) => {
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
    throw new Error('Disbursement transaction not found');
  }

  const acceptedOffer = req.offers.find((o) => o.status === FinancingOfferStatus.ACCEPTED) || req.offers[0];
  const amount = acceptedOffer
    ? parseFloat(acceptedOffer.amount.toString())
    : parseFloat((req.approvedAmount || req.requestedAmount).toString());
  const invoiceAmount = parseFloat(req.invoice.amount.toString());

  return {
    id: req.id,
    disbursementId: `DIS-${req.id.slice(0, 6).toUpperCase()}`,
    offerId: acceptedOffer ? `OFF-${acceptedOffer.id.slice(0, 6).toUpperCase()}` : 'N/A',
    invoiceNumber: req.invoice.invoiceNumber,
    invoiceAmount,
    disbursementAmount: amount,
    providerName: acceptedOffer ? acceptedOffer.providerName : 'Financial Institution',
    interestRate: acceptedOffer ? parseFloat(acceptedOffer.interestRate.toString()) : 12.5,
    tenureDays: acceptedOffer ? acceptedOffer.tenureDays : (req.tenureDays || 60),
    status: req.status === FinancingRequestStatus.APPROVED ? 'READY' : req.status,
    disbursementMethod: 'SIMULATED / MANUAL DISBURSEMENT',
    settlementInfo: {
      accountName: req.supplier.name,
      gstNumber: req.supplier.gstNumber || 'N/A',
      bankName: 'HDFC Bank Ltd (Registered Corporate Account)',
      accountNumber: `XXXX-XXXX-` + req.supplier.id.slice(0, 4).toUpperCase(),
      ifscCode: 'HDFC0000123',
      settlementStatus: 'CONFIGURED (Simulated Payout Destination)',
    },
    supplier: {
      id: req.supplier.id,
      name: req.supplier.name,
      email: req.supplier.email,
      phone: req.supplier.phone,
      address: req.supplier.address,
    },
    buyer: {
      id: req.invoice.buyer.id,
      name: req.invoice.buyer.name,
      email: req.invoice.buyer.email,
      phone: req.invoice.buyer.phone,
    },
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
  };
};

export const executeDisbursementService = async (
  user: { id: string; name: string; role: string; companyId?: string | null; company?: any },
  requestId: string,
  notes?: string
) => {
  if (user.role !== Role.FINANCIAL_INSTITUTION && user.role !== Role.ADMIN) {
    throw new Error('Access denied: Financial Institution role required to execute disbursement');
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

    if (request.status === FinancingRequestStatus.DISBURSED) {
      throw new Error('Double disbursement prevented: This transaction has already been disbursed.');
    }

    if (request.status === FinancingRequestStatus.REPAID) {
      throw new Error('Cannot disburse a transaction that has already been repaid and settled.');
    }

    if (request.status !== FinancingRequestStatus.APPROVED) {
      throw new Error(
        `Cannot execute disbursement for request in status ${request.status}. Underwriting approval (F3) is required.`
      );
    }

    const acceptedOffer = request.offers.find((o) => o.status === FinancingOfferStatus.ACCEPTED) || request.offers[0];
    const disbursementAmount = acceptedOffer
      ? parseFloat(acceptedOffer.amount.toString())
      : parseFloat((request.approvedAmount || request.requestedAmount).toString());

    const updatedRequest = await tx.financingRequest.update({
      where: { id: requestId },
      data: {
        status: FinancingRequestStatus.DISBURSED,
      },
      include: {
        invoice: { include: { buyer: true } },
        supplier: true,
        offers: true,
      },
    });

    const institutionName = user.company?.name || acceptedOffer?.providerName || 'Financial Institution';

    const supplierUsers = await tx.user.findMany({
      where: { companyId: request.supplierId },
    });

    for (const u of supplierUsers) {
      await tx.notification.create({
        data: {
          userId: u.id,
          title: 'Financing Capital Disbursed',
          message: `Disbursement of ₹${disbursementAmount.toLocaleString('en-IN')} for invoice ${request.invoice.invoiceNumber} has been executed by ${institutionName}.`,
          type: 'FINANCING',
        },
      });
    }

    return {
      request: updatedRequest,
      audit: {
        disbursementId: `DIS-${request.id.slice(0, 6).toUpperCase()}`,
        status: 'DISBURSED',
        disbursementAmount,
        executedBy: user.name,
        executedRole: user.role,
        institutionName,
        method: 'SIMULATED / MANUAL DISBURSEMENT',
        timestamp: new Date().toISOString(),
        notes: notes || 'Simulated disbursement executed successfully in platform.',
      },
    };
  });
};
