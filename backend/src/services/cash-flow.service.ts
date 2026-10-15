import { CashFlowEntry, CashFlowType, InvoiceStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import {
  CreateCashFlowEntryDTO,
  UpdateCashFlowEntryDTO,
  validateCreateCashFlowEntryDTO,
  validateUpdateCashFlowEntryDTO,
} from '../validators/cash-flow.validator.js';

export class CashFlowServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'CashFlowServiceError';
  }
}

export interface CashFlowForecastResult {
  currentCash: number;
  expectedIncome: number;
  expectedExpenses: number;
  projectedCash: number;
  workingCapitalGap: number;
  forecastHorizon: number;
  status: 'SUFFICIENT' | 'SHORTFALL';
}

export interface CashFlowSummaryResult extends CashFlowForecastResult {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  upcomingReceivables: number;
  upcomingExpenses: number;
}

export const createCashFlowEntry = async (
  userCompanyId: string | null | undefined,
  data: CreateCashFlowEntryDTO
): Promise<CashFlowEntry> => {
  if (!userCompanyId) {
    throw new CashFlowServiceError('Company profile required to manage cash flow', 400);
  }

  const validatedData = validateCreateCashFlowEntryDTO(data);

  return prisma.cashFlowEntry.create({
    data: {
      supplierId: userCompanyId,
      type: validatedData.type,
      amount: validatedData.amount,
      date: new Date(validatedData.date),
      description: validatedData.description,
      source: validatedData.source,
    },
  });
};

export const getCashFlowEntriesForUser = async (
  userCompanyId: string | null | undefined
): Promise<CashFlowEntry[]> => {
  if (!userCompanyId) {
    return [];
  }

  return prisma.cashFlowEntry.findMany({
    where: { supplierId: userCompanyId },
    orderBy: { date: 'desc' },
  });
};

export const getCashFlowEntryByIdForUser = async (
  userCompanyId: string | null | undefined,
  id: string
): Promise<CashFlowEntry> => {
  if (!userCompanyId) {
    throw new CashFlowServiceError('Company profile required', 400);
  }

  const entry = await prisma.cashFlowEntry.findUnique({
    where: { id },
  });

  if (!entry || entry.supplierId !== userCompanyId) {
    throw new CashFlowServiceError('Cash flow entry not found or access denied', 404);
  }

  return entry;
};

export const updateCashFlowEntry = async (
  userCompanyId: string | null | undefined,
  id: string,
  data: UpdateCashFlowEntryDTO
): Promise<CashFlowEntry> => {
  await getCashFlowEntryByIdForUser(userCompanyId, id);

  const validatedData = validateUpdateCashFlowEntryDTO(data);
  const updateData: any = {};
  if (validatedData.type) updateData.type = validatedData.type;
  if (validatedData.amount !== undefined) updateData.amount = validatedData.amount;
  if (validatedData.date) updateData.date = new Date(validatedData.date);
  if (validatedData.description !== undefined) updateData.description = validatedData.description;
  if (validatedData.source !== undefined) updateData.source = validatedData.source;

  return prisma.cashFlowEntry.update({
    where: { id },
    data: updateData,
  });
};

export const deleteCashFlowEntry = async (
  userCompanyId: string | null | undefined,
  id: string
): Promise<boolean> => {
  await getCashFlowEntryByIdForUser(userCompanyId, id);

  await prisma.cashFlowEntry.delete({
    where: { id },
  });

  return true;
};

export const getCashFlowForecast = async (
  userCompanyId: string | null | undefined,
  horizonDays: number = 30
): Promise<CashFlowForecastResult> => {
  if (!userCompanyId) {
    return {
      currentCash: 0,
      expectedIncome: 0,
      expectedExpenses: 0,
      projectedCash: 0,
      workingCapitalGap: 0,
      forecastHorizon: horizonDays,
      status: 'SUFFICIENT',
    };
  }

  const now = new Date();
  const horizonDate = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  // 1. Current Cash Calculation
  // Historical manual income entries (date <= now)
  const manualIncomeEntries = await prisma.cashFlowEntry.findMany({
    where: {
      supplierId: userCompanyId,
      type: CashFlowType.INCOME,
      date: { lte: now },
    },
  });
  const totalManualIncome = manualIncomeEntries.reduce(
    (sum, e) => sum + parseFloat(e.amount.toString()),
    0
  );

  // Payments collected for supplier's invoices
  const payments = await prisma.payment.findMany({
    where: {
      invoice: {
        supplierId: userCompanyId,
      },
    },
  });
  const totalPaymentsCollected = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()),
    0
  );

  // Historical manual expense entries (date <= now)
  const manualExpenseEntries = await prisma.cashFlowEntry.findMany({
    where: {
      supplierId: userCompanyId,
      type: CashFlowType.EXPENSE,
      date: { lte: now },
    },
  });
  const totalManualExpenses = manualExpenseEntries.reduce(
    (sum, e) => sum + parseFloat(e.amount.toString()),
    0
  );

  const currentCash = totalManualIncome + totalPaymentsCollected - totalManualExpenses;

  // 2. Expected Income (Unpaid remaining balance on invoices due <= horizonDate)
  const activeInvoices = await prisma.invoice.findMany({
    where: {
      supplierId: userCompanyId,
      status: {
        in: [
          InvoiceStatus.PENDING,
          InvoiceStatus.APPROVED,
          InvoiceStatus.PARTIALLY_PAID,
          InvoiceStatus.OVERDUE,
        ],
      },
      dueDate: { lte: horizonDate },
    },
    include: {
      payments: true,
    },
  });

  const expectedIncome = activeInvoices.reduce((sum, inv) => {
    const invTotal = parseFloat(inv.amount.toString());
    const paid = inv.payments.reduce((pSum, p) => pSum + parseFloat(p.amount.toString()), 0);
    const remaining = Math.max(0, invTotal - paid);
    return sum + remaining;
  }, 0);

  // 3. Expected Expenses (Future planned expense entries: date > now and date <= horizonDate)
  const futureExpenses = await prisma.cashFlowEntry.findMany({
    where: {
      supplierId: userCompanyId,
      type: CashFlowType.EXPENSE,
      date: {
        gt: now,
        lte: horizonDate,
      },
    },
  });
  const expectedExpenses = futureExpenses.reduce(
    (sum, e) => sum + parseFloat(e.amount.toString()),
    0
  );

  // 4. Projected Cash & Working Capital Gap
  const projectedCash = currentCash + expectedIncome - expectedExpenses;
  const workingCapitalGap = Math.max(0, -projectedCash);
  const status: 'SUFFICIENT' | 'SHORTFALL' = projectedCash < 0 ? 'SHORTFALL' : 'SUFFICIENT';

  return {
    currentCash,
    expectedIncome,
    expectedExpenses,
    projectedCash,
    workingCapitalGap,
    forecastHorizon: horizonDays,
    status,
  };
};

export const getCashFlowSummary = async (
  userCompanyId: string | null | undefined
): Promise<CashFlowSummaryResult> => {
  const forecast = await getCashFlowForecast(userCompanyId, 30);

  if (!userCompanyId) {
    return {
      ...forecast,
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      upcomingReceivables: 0,
      upcomingExpenses: 0,
    };
  }

  const allEntries = await prisma.cashFlowEntry.findMany({
    where: { supplierId: userCompanyId },
  });

  const totalIncome = allEntries
    .filter((e) => e.type === CashFlowType.INCOME)
    .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

  const totalExpenses = allEntries
    .filter((e) => e.type === CashFlowType.EXPENSE)
    .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

  const netCashFlow = totalIncome - totalExpenses;

  return {
    ...forecast,
    totalIncome,
    totalExpenses,
    netCashFlow,
    upcomingReceivables: forecast.expectedIncome,
    upcomingExpenses: forecast.expectedExpenses,
  };
};
