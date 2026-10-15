import { InvoiceStatus, Invoice, Company, CompanyType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import {
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  validateCreateInvoiceDTO,
  validateUpdateInvoiceDTO,
} from '../validators/invoice.validator.js';
import { CompanyServiceError } from './company.service.js';

export class InvoiceServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'InvoiceServiceError';
  }
}

export type InvoiceWithRelations = Invoice & {
  supplier: Company;
  buyer: Company;
};

export const createSupplierInvoice = async (
  supplierCompanyId: string | null | undefined,
  data: CreateInvoiceDTO,
  documentUrl?: string
): Promise<InvoiceWithRelations> => {
  if (!supplierCompanyId) {
    throw new InvoiceServiceError('Supplier company profile required to create invoices', 400);
  }

  const validatedData = validateCreateInvoiceDTO(data);

  // 1. Resolve Buyer Company (by ID, Name, or create fallback)
  let buyerCompany = await prisma.company.findFirst({
    where: {
      OR: [
        { id: validatedData.buyerId },
        { name: { equals: validatedData.buyerId, mode: 'insensitive' } },
      ],
    },
  });

  if (!buyerCompany) {
    // If not found, create a new CORPORATE buyer company dynamically
    buyerCompany = await prisma.company.create({
      data: {
        name: validatedData.buyerId.length > 5 ? validatedData.buyerId : `Corporate Buyer (${validatedData.buyerId})`,
        type: CompanyType.CORPORATE,
      },
    });
  }

  // 2. Ensure Supplier-Buyer relationship link exists
  await prisma.supplierBuyer.upsert({
    where: {
      supplierId_buyerId: {
        supplierId: supplierCompanyId,
        buyerId: buyerCompany.id,
      },
    },
    update: {},
    create: {
      supplierId: supplierCompanyId,
      buyerId: buyerCompany.id,
    },
  });

  const finalBuyerId = buyerCompany.id;

  // 3. Check for duplicate invoiceNumber
  const existingInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: validatedData.invoiceNumber },
  });
  if (existingInvoice) {
    throw new InvoiceServiceError('An invoice with this invoice number already exists', 409);
  }

  const newInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: validatedData.invoiceNumber,
      supplierId: supplierCompanyId,
      buyerId: finalBuyerId,
      amount: validatedData.amount,
      issueDate: new Date(validatedData.issueDate),
      dueDate: new Date(validatedData.dueDate!),
      paymentTerms: validatedData.paymentTerms!,
      status: InvoiceStatus.PENDING,
      documentUrl: documentUrl || null,
    },
    include: {
      supplier: true,
      buyer: true,
    },
  });

  return newInvoice;
};

export const getInvoicesForUser = async (
  companyId: string | null | undefined,
  role: string,
  statusFilter?: string
): Promise<InvoiceWithRelations[]> => {
  if (!companyId) {
    return [];
  }

  const whereClause: any = {};

  if (role === 'SUPPLIER') {
    whereClause.supplierId = companyId;
  } else if (role === 'BUYER') {
    whereClause.buyerId = companyId;
  } else {
    return [];
  }

  if (statusFilter && Object.values(InvoiceStatus).includes(statusFilter as InvoiceStatus)) {
    whereClause.status = statusFilter as InvoiceStatus;
  }

  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      supplier: true,
      buyer: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return invoices;
};

export const getInvoiceByIdForUser = async (
  companyId: string | null | undefined,
  role: string,
  invoiceId: string
): Promise<InvoiceWithRelations> => {
  if (!companyId) {
    throw new InvoiceServiceError('Access denied: Company profile required', 403);
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      supplier: true,
      buyer: true,
    },
  });

  if (!invoice) {
    throw new InvoiceServiceError('Invoice not found', 404);
  }

  if (role === 'SUPPLIER' && invoice.supplierId !== companyId) {
    throw new InvoiceServiceError('Invoice not found or access denied', 404);
  }

  if (role === 'BUYER' && invoice.buyerId !== companyId) {
    throw new InvoiceServiceError('Invoice not found or access denied', 404);
  }

  return invoice;
};

export const updateSupplierInvoice = async (
  supplierCompanyId: string | null | undefined,
  invoiceId: string,
  data: UpdateInvoiceDTO
): Promise<InvoiceWithRelations> => {
  const existingInvoice = await getInvoiceByIdForUser(supplierCompanyId, 'SUPPLIER', invoiceId);

  if (existingInvoice.status === InvoiceStatus.APPROVED || existingInvoice.status === InvoiceStatus.PAID) {
    throw new InvoiceServiceError('Approved or paid invoices cannot be updated', 400);
  }

  const validatedData = validateUpdateInvoiceDTO(data);

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      amount: validatedData.amount !== undefined ? validatedData.amount : existingInvoice.amount,
      issueDate: validatedData.issueDate ? new Date(validatedData.issueDate) : existingInvoice.issueDate,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : existingInvoice.dueDate,
      paymentTerms: validatedData.paymentTerms !== undefined ? validatedData.paymentTerms : existingInvoice.paymentTerms,
    },
    include: {
      supplier: true,
      buyer: true,
    },
  });

  return updatedInvoice;
};

export const deleteSupplierInvoice = async (
  supplierCompanyId: string | null | undefined,
  invoiceId: string
): Promise<boolean> => {
  const existingInvoice = await getInvoiceByIdForUser(supplierCompanyId, 'SUPPLIER', invoiceId);

  if (existingInvoice.status === InvoiceStatus.APPROVED || existingInvoice.status === InvoiceStatus.PAID) {
    throw new InvoiceServiceError('Approved or paid invoices cannot be deleted', 400);
  }

  await prisma.invoice.delete({ where: { id: invoiceId } });
  return true;
};

export const approveBuyerInvoice = async (
  buyerCompanyId: string | null | undefined,
  invoiceId: string
): Promise<InvoiceWithRelations> => {
  const existingInvoice = await getInvoiceByIdForUser(buyerCompanyId, 'BUYER', invoiceId);

  if (existingInvoice.status !== InvoiceStatus.PENDING) {
    throw new InvoiceServiceError(`Invoice cannot be approved because current status is ${existingInvoice.status}`, 400);
  }

  const approvedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.APPROVED },
    include: {
      supplier: true,
      buyer: true,
    },
  });

  return approvedInvoice;
};

export const rejectBuyerInvoice = async (
  buyerCompanyId: string | null | undefined,
  invoiceId: string
): Promise<InvoiceWithRelations> => {
  const existingInvoice = await getInvoiceByIdForUser(buyerCompanyId, 'BUYER', invoiceId);

  if (existingInvoice.status !== InvoiceStatus.PENDING) {
    throw new InvoiceServiceError(`Invoice cannot be rejected because current status is ${existingInvoice.status}`, 400);
  }

  const rejectedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.REJECTED },
    include: {
      supplier: true,
      buyer: true,
    },
  });

  return rejectedInvoice;
};

export const attachInvoiceDocument = async (
  supplierCompanyId: string | null | undefined,
  invoiceId: string,
  documentUrl: string
): Promise<InvoiceWithRelations> => {
  await getInvoiceByIdForUser(supplierCompanyId, 'SUPPLIER', invoiceId);

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { documentUrl },
    include: {
      supplier: true,
      buyer: true,
    },
  });

  return updatedInvoice;
};
