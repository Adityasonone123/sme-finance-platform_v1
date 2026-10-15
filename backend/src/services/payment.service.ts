import { PaymentStatus, InvoiceStatus, Payment, Invoice, Company } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { CreatePaymentDTO, validateCreatePaymentDTO } from '../validators/payment.validator.js';

export class PaymentServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'PaymentServiceError';
  }
}

export type PaymentWithRelations = Payment & {
  invoice: Invoice & {
    supplier: Company;
    buyer: Company;
  };
};

export const recordPayment = async (
  userCompanyId: string | null | undefined,
  role: string,
  data: CreatePaymentDTO
): Promise<PaymentWithRelations> => {
  if (!userCompanyId) {
    throw new PaymentServiceError('Company profile required to record payments', 400);
  }

  const validatedData = validateCreatePaymentDTO(data);

  const invoice = await prisma.invoice.findUnique({
    where: { id: validatedData.invoiceId },
    include: {
      payments: true,
      supplier: true,
      buyer: true,
    },
  });

  if (!invoice) {
    throw new PaymentServiceError('Invoice not found', 404);
  }

  // Authorization checks
  if (role === 'BUYER' && invoice.buyerId !== userCompanyId) {
    throw new PaymentServiceError('Invoice not found or access denied', 404);
  }
  if (role === 'SUPPLIER' && invoice.supplierId !== userCompanyId) {
    throw new PaymentServiceError('Invoice not found or access denied', 404);
  }

  // Status checks
  if (invoice.status === InvoiceStatus.PENDING) {
    throw new PaymentServiceError('Payment cannot be recorded against pending invoice. Invoice must be approved first.', 400);
  }
  if (invoice.status === InvoiceStatus.REJECTED) {
    throw new PaymentServiceError('Payment cannot be recorded against rejected invoice.', 400);
  }
  if (invoice.status === InvoiceStatus.PAID) {
    throw new PaymentServiceError('Invoice is already fully paid.', 409);
  }

  // Overpayment check
  const existingPaid = invoice.payments.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()),
    0
  );
  const invoiceAmount = parseFloat(invoice.amount.toString());
  const remainingAmount = invoiceAmount - existingPaid;

  // Use a small epsilon for floating precision tolerance
  if (validatedData.amount > remainingAmount + 0.01) {
    throw new PaymentServiceError(
      `Payment amount exceeds remaining invoice balance. Remaining balance: ₹${remainingAmount.toLocaleString('en-IN')}`,
      409
    );
  }

  // Atomic Prisma transaction to create Payment & update Invoice Status
  const result = await prisma.$transaction(async (tx) => {
    const newPayment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: validatedData.amount,
        paymentDate: new Date(validatedData.paymentDate!),
        paymentMethod: validatedData.paymentMethod!,
        status: PaymentStatus.COMPLETED,
        referenceNumber: validatedData.referenceNumber || `UTR-${Date.now()}`,
      },
    });

    const newTotalPaid = existingPaid + validatedData.amount;
    let newInvoiceStatus: InvoiceStatus = InvoiceStatus.PARTIALLY_PAID;

    // Check if fully paid (or within 0.01 tolerance)
    if (newTotalPaid >= invoiceAmount - 0.01) {
      newInvoiceStatus = InvoiceStatus.PAID;
    }

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: newInvoiceStatus },
    });

    return newPayment;
  });

  const fullPayment = await prisma.payment.findUnique({
    where: { id: result.id },
    include: {
      invoice: {
        include: {
          supplier: true,
          buyer: true,
        },
      },
    },
  });

  return fullPayment as PaymentWithRelations;
};

export const getPaymentsForUser = async (
  userCompanyId: string | null | undefined,
  role: string
): Promise<PaymentWithRelations[]> => {
  if (!userCompanyId) {
    return [];
  }

  let whereClause: any = {};
  if (role === 'SUPPLIER') {
    whereClause = { invoice: { supplierId: userCompanyId } };
  } else if (role === 'BUYER') {
    whereClause = { invoice: { buyerId: userCompanyId } };
  } else {
    return [];
  }

  const payments = await prisma.payment.findMany({
    where: whereClause,
    include: {
      invoice: {
        include: {
          supplier: true,
          buyer: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return payments as PaymentWithRelations[];
};

export const getPaymentByIdForUser = async (
  userCompanyId: string | null | undefined,
  role: string,
  paymentId: string
): Promise<PaymentWithRelations> => {
  if (!userCompanyId) {
    throw new PaymentServiceError('Company profile required', 400);
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          supplier: true,
          buyer: true,
        },
      },
    },
  });

  if (!payment) {
    throw new PaymentServiceError('Payment record not found', 404);
  }

  if (role === 'SUPPLIER' && payment.invoice.supplierId !== userCompanyId) {
    throw new PaymentServiceError('Payment record not found or access denied', 404);
  }

  if (role === 'BUYER' && payment.invoice.buyerId !== userCompanyId) {
    throw new PaymentServiceError('Payment record not found or access denied', 404);
  }

  return payment as PaymentWithRelations;
};
