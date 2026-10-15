import { CompanyType, Company } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { CompanyDTO, validateCompanyDTO, ValidationError } from '../validators/company.validator.js';

export class CompanyServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'CompanyServiceError';
  }
}

export const createSupplierCompany = async (userId: string, data: CompanyDTO): Promise<Company> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new CompanyServiceError('Authenticated user not found', 404);
  }

  if (user.companyId) {
    throw new CompanyServiceError('User already belongs to a registered company profile', 400);
  }

  const validatedData = validateCompanyDTO(data);

  // Prisma transaction to create SME company and assign companyId to User
  const result = await prisma.$transaction(async (tx) => {
    const newCompany = await tx.company.create({
      data: {
        name: validatedData.name,
        type: CompanyType.SME,
        gstNumber: validatedData.gstNumber,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { companyId: newCompany.id },
    });

    return newCompany;
  });

  return result;
};

export const getSupplierCompany = async (companyId: string | null | undefined): Promise<any> => {
  if (!companyId) {
    throw new CompanyServiceError('User has no associated company profile', 404);
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new CompanyServiceError('Company profile not found', 404);
  }

  if (company.type === CompanyType.CORPORATE) {
    const invoices = await prisma.invoice.findMany({
      where: { buyerId: companyId },
      include: { payments: { orderBy: { paymentDate: 'desc' } } },
    });

    const paymentTermsDays = invoices.length > 0 ? invoices[0].paymentTerms : 30;

    let creditScore = 85;
    if (invoices.length > 0) {
      const paidInvoices = invoices.filter((i) => i.status === 'PAID');
      const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
      const onTimeCount = paidInvoices.filter((i) => {
        if (i.payments.length === 0) return false;
        return new Date(i.payments[0].paymentDate) <= new Date(i.dueDate);
      }).length;

      const onTimePct = paidInvoices.length > 0 ? (onTimeCount / paidInvoices.length) * 50 : 50;
      const overdueRatio = overdueInvoices.length / invoices.length;
      const overduePenalty = Math.max(0, 20 - overdueRatio * 40);
      creditScore = Math.min(100, Math.max(0, Math.round(onTimePct + 30 + overduePenalty)));
    }

    return {
      ...company,
      creditScore,
      paymentTermsDays,
    };
  }

  return company;
};

export const updateSupplierCompany = async (
  companyId: string | null | undefined,
  data: Partial<CompanyDTO>
): Promise<Company> => {
  if (!companyId) {
    throw new CompanyServiceError('User has no associated company profile to update', 404);
  }

  const existingCompany = await prisma.company.findUnique({ where: { id: companyId } });
  if (!existingCompany) {
    throw new CompanyServiceError('Company profile not found', 404);
  }

  const validatedData = validateCompanyDTO({
    name: data.name ?? existingCompany.name,
    gstNumber: data.gstNumber ?? (existingCompany.gstNumber || undefined),
    email: data.email ?? (existingCompany.email || undefined),
    phone: data.phone ?? (existingCompany.phone || undefined),
    address: data.address ?? (existingCompany.address || undefined),
  });

  const updatedCompany = await prisma.company.update({
    where: { id: companyId },
    data: {
      name: validatedData.name,
      gstNumber: validatedData.gstNumber,
      email: validatedData.email,
      phone: validatedData.phone,
      address: validatedData.address,
    },
  });

  return updatedCompany;
};
