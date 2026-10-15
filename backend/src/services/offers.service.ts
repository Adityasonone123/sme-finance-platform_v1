import { FinancingOfferStatus, FinancingRequestStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface CreateOfferDTO {
  financingRequestId: string;
  amount: number;
  interestRate: number;
  tenureDays: number;
  processingFee: number;
}

export interface OfferFilterQuery {
  q?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getFinancierOffers = async (
  userRole: string,
  userCompanyId?: string | null,
  filters: OfferFilterQuery = {}
) => {
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

  if (userRole === Role.FINANCIAL_INSTITUTION && userCompanyId) {
    const company = await prisma.company.findUnique({ where: { id: userCompanyId } });
    if (company) {
      where.providerName = company.name;
    }
  } else if (userRole === Role.SUPPLIER && userCompanyId) {
    where.financingRequest = { supplierId: userCompanyId };
  }

  if (status === 'PENDING') {
    where.status = FinancingOfferStatus.PENDING;
  } else if (status === 'ACCEPTED') {
    where.status = FinancingOfferStatus.ACCEPTED;
  } else if (status === 'REJECTED') {
    where.status = FinancingOfferStatus.REJECTED;
  } else if (status === 'EXPIRED') {
    where.status = FinancingOfferStatus.EXPIRED;
  }

  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = minAmount;
    if (maxAmount) where.amount.lte = maxAmount;
  }

  if (q && q.trim()) {
    const searchTerm = q.trim();
    where.OR = [
      { id: { contains: searchTerm, mode: 'insensitive' } },
      { providerName: { contains: searchTerm, mode: 'insensitive' } },
      { financingRequest: { invoice: { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } } } },
      { financingRequest: { supplier: { name: { contains: searchTerm, mode: 'insensitive' } } } },
      { financingRequest: { invoice: { buyer: { name: { contains: searchTerm, mode: 'insensitive' } } } } },
    ];
  }

  const offers = await prisma.financingOffer.findMany({
    where,
    include: {
      financingRequest: {
        include: {
          supplier: true,
          invoice: {
            include: { buyer: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: sortOrder,
    },
  });

  const formatted = offers.map((off, idx) => {
    const amount = parseFloat(off.amount.toString());
    const invoiceAmount = parseFloat(off.financingRequest.invoice.amount.toString());
    const interestRate = parseFloat(off.interestRate.toString());
    const processingFee = parseFloat(off.processingFee.toString());
    const totalRepayment = parseFloat(off.totalRepayment.toString());

    return {
      id: off.id,
      offerId: `OFF-${(idx + 1).toString().padStart(3, '0')}`,
      financingRequestId: off.financingRequestId,
      providerName: off.providerName,
      amount,
      invoiceAmount,
      interestRate,
      tenureDays: off.tenureDays,
      processingFee,
      totalRepayment,
      expectedReturn: Math.round(totalRepayment - amount),
      status: off.status,
      createdAt: off.createdAt.toISOString(),
      invoiceNumber: off.financingRequest.invoice.invoiceNumber,
      supplier: {
        id: off.financingRequest.supplier.id,
        name: off.financingRequest.supplier.name,
      },
      buyer: {
        id: off.financingRequest.invoice.buyer.id,
        name: off.financingRequest.invoice.buyer.name,
      },
    };
  });

  if (sortBy === 'amount') {
    formatted.sort((a, b) => (sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount));
  } else if (sortBy === 'rate') {
    formatted.sort((a, b) => (sortOrder === 'asc' ? a.interestRate - b.interestRate : b.interestRate - a.interestRate));
  }

  const total = formatted.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIdx = (safePage - 1) * limit;
  const paginatedOffers = formatted.slice(startIdx, startIdx + limit);

  return {
    offers: paginatedOffers,
    pagination: {
      total,
      page: safePage,
      limit,
      totalPages,
    },
  };
};

export const getOfferById = async (_userRole: string, _userCompanyId: string | null | undefined, offerId: string) => {
  const off = await prisma.financingOffer.findUnique({
    where: { id: offerId },
    include: {
      financingRequest: {
        include: {
          supplier: true,
          invoice: {
            include: { buyer: true },
          },
        },
      },
    },
  });

  if (!off) {
    throw new Error('Financing offer not found');
  }

  const amount = parseFloat(off.amount.toString());
  const invoiceAmount = parseFloat(off.financingRequest.invoice.amount.toString());
  const interestRate = parseFloat(off.interestRate.toString());
  const processingFee = parseFloat(off.processingFee.toString());
  const totalRepayment = parseFloat(off.totalRepayment.toString());

  return {
    id: off.id,
    offerId: `OFF-${off.id.slice(0, 6).toUpperCase()}`,
    financingRequestId: off.financingRequestId,
    providerName: off.providerName,
    amount,
    invoiceAmount,
    interestRate,
    tenureDays: off.tenureDays,
    processingFee,
    totalRepayment,
    expectedReturn: Math.round(totalRepayment - amount),
    status: off.status,
    createdAt: off.createdAt.toISOString(),
    invoiceNumber: off.financingRequest.invoice.invoiceNumber,
    supplier: {
      id: off.financingRequest.supplier.id,
      name: off.financingRequest.supplier.name,
      email: off.financingRequest.supplier.email,
      phone: off.financingRequest.supplier.phone,
    },
    buyer: {
      id: off.financingRequest.invoice.buyer.id,
      name: off.financingRequest.invoice.buyer.name,
      email: off.financingRequest.invoice.buyer.email,
      phone: off.financingRequest.invoice.buyer.phone,
    },
    request: {
      id: off.financingRequest.id,
      requestedAmount: parseFloat(off.financingRequest.requestedAmount.toString()),
      status: off.financingRequest.status,
    },
  };
};

export const createFinancingOfferService = async (
  user: { id: string; name: string; role: string; companyId?: string | null; company?: any },
  data: CreateOfferDTO
) => {
  if (user.role !== Role.FINANCIAL_INSTITUTION && user.role !== Role.ADMIN) {
    throw new Error('Access denied: Financial Institution role required to submit offers');
  }

  const { financingRequestId, amount, interestRate, tenureDays, processingFee } = data;

  if (!amount || amount <= 0) {
    throw new Error('Offer financing amount must be greater than 0');
  }
  if (!interestRate || interestRate <= 0) {
    throw new Error('Interest rate must be greater than 0');
  }
  if (!tenureDays || tenureDays <= 0) {
    throw new Error('Tenure days must be greater than 0');
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.financingRequest.findUnique({
      where: { id: financingRequestId },
      include: {
        invoice: { include: { buyer: true } },
        supplier: true,
      },
    });

    if (!request) {
      throw new Error('Financing request not found');
    }

    if (request.status !== FinancingRequestStatus.APPROVED) {
      throw new Error(
        `Cannot submit lending offer for request in status ${request.status}. Underwriting approval (F3) is required first.`
      );
    }

    const maxLimit = parseFloat((request.approvedAmount || request.requestedAmount).toString());
    if (amount > maxLimit) {
      throw new Error(`Offered amount (₹${amount.toLocaleString('en-IN')}) exceeds approved credit limit (₹${maxLimit.toLocaleString('en-IN')})`);
    }

    const providerName = user.company?.name || 'Financial Institution';

    const existingPending = await tx.financingOffer.findFirst({
      where: {
        financingRequestId,
        providerName,
        status: FinancingOfferStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new Error(`Your institution (${providerName}) already has an active pending offer for this financing request`);
    }

    const interest = Math.round(amount * (interestRate / 100) * (tenureDays / 365));
    const totalRepayment = Math.round(amount + processingFee + interest);

    const offer = await tx.financingOffer.create({
      data: {
        financingRequestId,
        providerName,
        amount,
        interestRate,
        tenureDays,
        processingFee,
        totalRepayment,
        status: FinancingOfferStatus.PENDING,
      },
    });

    const supplierUsers = await tx.user.findMany({
      where: { companyId: request.supplierId },
    });

    for (const u of supplierUsers) {
      await tx.notification.create({
        data: {
          userId: u.id,
          title: 'New Financing Offer Received',
          message: `Received a lending offer of ₹${amount.toLocaleString('en-IN')} @ ${interestRate}% APR from ${providerName} for invoice ${request.invoice.invoiceNumber}.`,
          type: 'FINANCING',
        },
      });
    }

    return offer;
  });
};

export const acceptFinancingOfferService = async (
  user: { id: string; name: string; role: string; companyId?: string | null },
  offerId: string
) => {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.financingOffer.findUnique({
      where: { id: offerId },
      include: {
        financingRequest: {
          include: { invoice: true },
        },
      },
    });

    if (!offer) {
      throw new Error('Financing offer not found');
    }

    if (user.role === Role.SUPPLIER && offer.financingRequest.supplierId !== user.companyId) {
      throw new Error('Access denied: Offer belongs to another supplier company');
    }

    if (offer.status !== FinancingOfferStatus.PENDING) {
      throw new Error(`Cannot accept offer in status ${offer.status}`);
    }

    const updatedOffer = await tx.financingOffer.update({
      where: { id: offerId },
      data: { status: FinancingOfferStatus.ACCEPTED },
    });

    await tx.financingOffer.updateMany({
      where: {
        financingRequestId: offer.financingRequestId,
        id: { not: offerId },
        status: FinancingOfferStatus.PENDING,
      },
      data: { status: FinancingOfferStatus.REJECTED },
    });

    return updatedOffer;
  });
};
