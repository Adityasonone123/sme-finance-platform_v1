import { FinancingRequest, FinancingRequestStatus, FinancingOfferStatus, NotificationType, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import {
  CreateFinancingRequestDTO,
  CreateFinancingOfferDTO,
  validateCreateFinancingRequestDTO,
  validateCreateFinancingOfferDTO,
} from '../validators/financing.validator.js';
import { checkInvoiceEligibility } from './financing-eligibility.service.js';

export class FinancingServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'FinancingServiceError';
  }
}

export const createFinancingRequest = async (
  userCompanyId: string | null | undefined,
  data: CreateFinancingRequestDTO
): Promise<FinancingRequest> => {
  if (!userCompanyId) {
    throw new FinancingServiceError('Supplier company profile required to request financing', 400);
  }

  const validated = validateCreateFinancingRequestDTO(data);
  const eligibility = await checkInvoiceEligibility(userCompanyId, validated.invoiceId);

  if (!eligibility.eligible) {
    throw new FinancingServiceError(
      `Invoice is not eligible for financing: ${eligibility.reasons.join(', ')}`,
      422
    );
  }

  if (validated.requestedAmount > eligibility.maxEligibleAmount) {
    throw new FinancingServiceError(
      `Requested amount (₹${validated.requestedAmount.toLocaleString('en-IN')}) exceeds maximum eligible limit (₹${eligibility.maxEligibleAmount.toLocaleString('en-IN')})`,
      409
    );
  }

  return prisma.$transaction(async (tx) => {
    // Create Financing Request
    const request = await tx.financingRequest.create({
      data: {
        supplierId: userCompanyId,
        invoiceId: validated.invoiceId,
        requestedAmount: validated.requestedAmount,
        interestRate: 12.5,
        tenureDays: validated.tenureDays || 60,
        status: FinancingRequestStatus.PENDING,
      },
      include: {
        invoice: true,
        offers: true,
      },
    });

    // Auto-generate sample institutional credit offers
    const reqAmount = validated.requestedAmount;
    const fee1 = Math.round(reqAmount * 0.01);
    const interest1 = Math.round(reqAmount * (12.5 / 100) * (60 / 365));
    const totalRepay1 = reqAmount + fee1 + interest1;

    await tx.financingOffer.create({
      data: {
        financingRequestId: request.id,
        providerName: 'KredX Working Capital Trust',
        amount: reqAmount,
        interestRate: 12.5,
        tenureDays: 60,
        processingFee: fee1,
        totalRepayment: totalRepay1,
        status: FinancingOfferStatus.PENDING,
      },
    });

    const fee2 = Math.round(reqAmount * 0.008);
    const interest2 = Math.round(reqAmount * (13.0 / 100) * (90 / 365));
    const totalRepay2 = reqAmount + fee2 + interest2;

    await tx.financingOffer.create({
      data: {
        financingRequestId: request.id,
        providerName: 'Vivriti Capital Pvt Ltd',
        amount: reqAmount,
        interestRate: 13.0,
        tenureDays: 90,
        processingFee: fee2,
        totalRepayment: totalRepay2,
        status: FinancingOfferStatus.PENDING,
      },
    });

    // Create Notification for Supplier User
    const supplierUsers = await tx.user.findMany({
      where: { companyId: userCompanyId },
    });

    for (const u of supplierUsers) {
      await tx.notification.create({
        data: {
          userId: u.id,
          title: 'Financing Request Submitted',
          message: `Financing request for invoice ${eligibility.invoiceNumber} (₹${reqAmount.toLocaleString('en-IN')}) has been submitted for lender underwriting.`,
          type: NotificationType.FINANCING,
        },
      });
    }

    return tx.financingRequest.findUniqueOrThrow({
      where: { id: request.id },
      include: {
        invoice: true,
        offers: true,
      },
    });
  });
};

export const getSupplierFinancingRequests = async (
  userCompanyId: string | null | undefined
): Promise<FinancingRequest[]> => {
  if (!userCompanyId) {
    return [];
  }

  return prisma.financingRequest.findMany({
    where: { supplierId: userCompanyId },
    include: {
      invoice: true,
      offers: true,
      supplier: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getLenderFinancingRequests = async (): Promise<FinancingRequest[]> => {
  return prisma.financingRequest.findMany({
    include: {
      invoice: {
        include: { buyer: true },
      },
      offers: true,
      supplier: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getFinancingRequestById = async (
  userCompanyId: string | null | undefined,
  userRole: string | undefined,
  requestId: string
): Promise<FinancingRequest> => {
  const request = await prisma.financingRequest.findUnique({
    where: { id: requestId },
    include: {
      invoice: {
        include: { buyer: true },
      },
      offers: true,
      supplier: true,
    },
  });

  if (!request) {
    throw new FinancingServiceError('Financing request not found', 404);
  }

  if (userRole === Role.SUPPLIER && request.supplierId !== userCompanyId) {
    throw new FinancingServiceError('Access denied: Financing request does not belong to your company', 403);
  }

  return request;
};

export const approveFinancingRequest = async (
  requestId: string,
  approvedAmount?: number
): Promise<FinancingRequest> => {
  const request = await prisma.financingRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new FinancingServiceError('Financing request not found', 404);
  }

  if (request.status !== FinancingRequestStatus.PENDING) {
    throw new FinancingServiceError(`Cannot approve request in status ${request.status}`, 400);
  }

  const finalApprovedAmount = approvedAmount || parseFloat(request.requestedAmount.toString());

  return prisma.financingRequest.update({
    where: { id: requestId },
    data: {
      status: FinancingRequestStatus.APPROVED,
      approvedAmount: finalApprovedAmount,
    },
    include: {
      invoice: true,
      offers: true,
    },
  });
};

export const rejectFinancingRequest = async (requestId: string): Promise<FinancingRequest> => {
  const request = await prisma.financingRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new FinancingServiceError('Financing request not found', 404);
  }

  if (request.status !== FinancingRequestStatus.PENDING) {
    throw new FinancingServiceError(`Cannot reject request in status ${request.status}`, 400);
  }

  return prisma.financingRequest.update({
    where: { id: requestId },
    data: {
      status: FinancingRequestStatus.REJECTED,
    },
    include: {
      invoice: true,
      offers: true,
    },
  });
};

export const disburseFinancingRequest = async (requestId: string): Promise<FinancingRequest> => {
  const request = await prisma.financingRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new FinancingServiceError('Financing request not found', 404);
  }

  if (request.status !== FinancingRequestStatus.APPROVED) {
    throw new FinancingServiceError(`Cannot disburse request in status ${request.status} (must be APPROVED)`, 400);
  }

  return prisma.financingRequest.update({
    where: { id: requestId },
    data: {
      status: FinancingRequestStatus.DISBURSED,
    },
    include: {
      invoice: true,
      offers: true,
    },
  });
};

export const repayFinancingRequest = async (requestId: string): Promise<FinancingRequest> => {
  const request = await prisma.financingRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new FinancingServiceError('Financing request not found', 404);
  }

  if (request.status !== FinancingRequestStatus.DISBURSED) {
    throw new FinancingServiceError(`Cannot mark request as repaid in status ${request.status} (must be DISBURSED)`, 400);
  }

  return prisma.financingRequest.update({
    where: { id: requestId },
    data: {
      status: FinancingRequestStatus.REPAID,
    },
    include: {
      invoice: true,
      offers: true,
    },
  });
};
