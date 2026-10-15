import { InvoiceStatus, FinancingRequestStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { getCashFlowSummary } from './cash-flow.service.js';
import { getSupplierBuyerScores } from './buyer-score.service.js';
import { getSupplierFinancingRequests, getLenderFinancingRequests } from './financing.service.js';

export interface SupplierDashboardSummary {
  invoiceSummary: {
    totalCount: number;
    pendingCount: number;
    approvedCount: number;
    partiallyPaidCount: number;
    paidCount: number;
    overdueCount: number;
    rejectedCount: number;
    totalInvoicedAmount: number;
    totalPaidAmount: number;
    totalOutstandingAmount: number;
    totalOverdueAmount: number;
  };
  cashFlowSummary: {
    currentCash: number;
    expectedIncome: number;
    expectedExpenses: number;
    projectedCash: number;
    workingCapitalGap: number;
    status: 'SUFFICIENT' | 'SHORTFALL';
  };
  buyerSummary: Array<{
    buyerId: string;
    buyerName: string;
    creditScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    outstandingAmount: number;
    overdueAmount: number;
  }>;
  financingSummary: {
    totalRequestsCount: number;
    pendingCount: number;
    disbursedAmount: number;
    requests: any[];
  };
  recentNotifications: any[];
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
  }>;
}

export interface BuyerDashboardSummary {
  invoiceSummary: {
    receivedCount: number;
    pendingVerificationCount: number;
    approvedCount: number;
    overduePayablesCount: number;
    totalPayableAmount: number;
    totalPaidAmount: number;
  };
  recentInvoices: any[];
  recentPayments: any[];
}

export interface LenderDashboardSummary {
  pendingQueueCount: number;
  totalDisbursedCapital: number;
  activeFacilitiesCount: number;
  outstandingExposure: number;
  repaidFacilitiesCount: number;
  financingRequests: any[];
  institution?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export interface AdminDashboardSummary {
  totalUsersCount: number;
  totalCompaniesCount: number;
  totalInvoicesCount: number;
  totalInvoicedVolume: number;
  totalFinancedVolume: number;
  systemStatus: string;
}

export const getSupplierDashboardData = async (
  supplierCompanyId: string | null | undefined
): Promise<SupplierDashboardSummary> => {
  if (!supplierCompanyId) {
    return {
      invoiceSummary: {
        totalCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        partiallyPaidCount: 0,
        paidCount: 0,
        overdueCount: 0,
        rejectedCount: 0,
        totalInvoicedAmount: 0,
        totalPaidAmount: 0,
        totalOutstandingAmount: 0,
        totalOverdueAmount: 0,
      },
      cashFlowSummary: {
        currentCash: 0,
        expectedIncome: 0,
        expectedExpenses: 0,
        projectedCash: 0,
        workingCapitalGap: 0,
        status: 'SUFFICIENT',
      },
      buyerSummary: [],
      financingSummary: { totalRequestsCount: 0, pendingCount: 0, disbursedAmount: 0, requests: [] },
      recentNotifications: [],
      recentActivity: [],
    };
  }

  // 1. Invoices & Payments Aggregation
  const invoices = await prisma.invoice.findMany({
    where: { supplierId: supplierCompanyId },
    include: { payments: true, buyer: true },
    orderBy: { createdAt: 'desc' },
  });

  let totalInvoicedAmount = 0;
  let totalPaidAmount = 0;
  let totalOutstandingAmount = 0;
  let totalOverdueAmount = 0;

  let pendingCount = 0;
  let approvedCount = 0;
  let partiallyPaidCount = 0;
  let paidCount = 0;
  let overdueCount = 0;
  let rejectedCount = 0;

  for (const inv of invoices) {
    const invAmt = parseFloat(inv.amount.toString());
    totalInvoicedAmount += invAmt;

    const pdAmt = inv.payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
    totalPaidAmount += pdAmt;

    const remaining = Math.max(0, invAmt - pdAmt);

    if (inv.status === InvoiceStatus.PENDING) pendingCount++;
    else if (inv.status === InvoiceStatus.APPROVED) approvedCount++;
    else if (inv.status === InvoiceStatus.PARTIALLY_PAID) partiallyPaidCount++;
    else if (inv.status === InvoiceStatus.PAID) paidCount++;
    else if (inv.status === InvoiceStatus.OVERDUE) overdueCount++;
    else if (inv.status === InvoiceStatus.REJECTED) rejectedCount++;

    if (inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.REJECTED) {
      totalOutstandingAmount += remaining;
    }

    if (inv.status === InvoiceStatus.OVERDUE) {
      totalOverdueAmount += remaining;
    }
  }

  // 2. Cash Flow Summary from B8
  const cashFlowSummary = await getCashFlowSummary(supplierCompanyId);

  // 3. Buyer Risk Scores from B9
  let buyerSummary: any[] = [];
  try {
    const buyerScores = await getSupplierBuyerScores(supplierCompanyId);
    buyerSummary = buyerScores.map((b) => ({
      buyerId: b.buyerId,
      buyerName: b.buyerName,
      creditScore: b.creditScore,
      riskLevel: b.riskLevel,
      outstandingAmount: b.outstandingAmount,
      overdueAmount: b.overdueAmount,
    }));
  } catch {
    // Fallback
  }

  // 4. Financing Summary from B10
  const financingRequests = await getSupplierFinancingRequests(supplierCompanyId);
  const finPending = financingRequests.filter((r) => r.status === FinancingRequestStatus.PENDING).length;
  const finDisbursed = financingRequests
    .filter((r) => r.status === FinancingRequestStatus.APPROVED || r.status === FinancingRequestStatus.DISBURSED)
    .reduce((sum, r) => sum + parseFloat((r.approvedAmount || r.requestedAmount).toString()), 0);

  // 5. Recent Notifications from B7
  const user = await prisma.user.findFirst({ where: { companyId: supplierCompanyId } });
  let recentNotifications: any[] = [];
  if (user) {
    recentNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  // 6. Stream Recent Activity
  const recentActivity = invoices.slice(0, 5).map((i) => ({
    id: i.id,
    type: 'INVOICE',
    title: `Invoice ${i.invoiceNumber} created for ${i.buyer.name} (₹${parseFloat(i.amount.toString()).toLocaleString('en-IN')})`,
    timestamp: i.createdAt.toISOString(),
  }));

  return {
    invoiceSummary: {
      totalCount: invoices.length,
      pendingCount,
      approvedCount,
      partiallyPaidCount,
      paidCount,
      overdueCount,
      rejectedCount,
      totalInvoicedAmount,
      totalPaidAmount,
      totalOutstandingAmount,
      totalOverdueAmount,
    },
    cashFlowSummary: {
      currentCash: cashFlowSummary.currentCash,
      expectedIncome: cashFlowSummary.expectedIncome,
      expectedExpenses: cashFlowSummary.expectedExpenses,
      projectedCash: cashFlowSummary.projectedCash,
      workingCapitalGap: cashFlowSummary.workingCapitalGap,
      status: cashFlowSummary.status,
    },
    buyerSummary,
    financingSummary: {
      totalRequestsCount: financingRequests.length,
      pendingCount: finPending,
      disbursedAmount: finDisbursed,
      requests: financingRequests,
    },
    recentNotifications,
    recentActivity,
  };
};

export const getBuyerDashboardData = async (
  buyerCompanyId: string | null | undefined
): Promise<BuyerDashboardSummary> => {
  if (!buyerCompanyId) {
    return {
      invoiceSummary: {
        receivedCount: 0,
        pendingVerificationCount: 0,
        approvedCount: 0,
        overduePayablesCount: 0,
        totalPayableAmount: 0,
        totalPaidAmount: 0,
      },
      recentInvoices: [],
      recentPayments: [],
    };
  }

  const invoices = await prisma.invoice.findMany({
    where: { buyerId: buyerCompanyId },
    include: { supplier: true, payments: true },
    orderBy: { createdAt: 'desc' },
  });

  let pendingVerificationCount = 0;
  let approvedCount = 0;
  let overduePayablesCount = 0;

  let totalPayableAmount = 0;
  let totalPaidAmount = 0;

  for (const inv of invoices) {
    const invAmt = parseFloat(inv.amount.toString());
    const pdAmt = inv.payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
    totalPaidAmount += pdAmt;

    const remaining = Math.max(0, invAmt - pdAmt);

    if (inv.status === InvoiceStatus.PENDING) pendingVerificationCount++;
    else if (inv.status === InvoiceStatus.APPROVED) approvedCount++;
    else if (inv.status === InvoiceStatus.OVERDUE) overduePayablesCount++;

    if (inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.REJECTED) {
      totalPayableAmount += remaining;
    }
  }

  const payments = await prisma.payment.findMany({
    where: { invoice: { buyerId: buyerCompanyId } },
    include: { invoice: { include: { supplier: true } } },
    orderBy: { paymentDate: 'desc' },
    take: 5,
  });

  return {
    invoiceSummary: {
      receivedCount: invoices.length,
      pendingVerificationCount,
      approvedCount,
      overduePayablesCount,
      totalPayableAmount,
      totalPaidAmount,
    },
    recentInvoices: invoices.slice(0, 5),
    recentPayments: payments,
  };
};

export const getLenderDashboardData = async (userCompanyId?: string | null): Promise<LenderDashboardSummary> => {
  let institution = null;
  if (userCompanyId) {
    const comp = await prisma.company.findUnique({ where: { id: userCompanyId } });
    if (comp) {
      institution = {
        id: comp.id,
        name: comp.name,
        type: comp.type,
      };
    }
  }

  const requests = await getLenderFinancingRequests();

  // Pending Underwriting Queue: PENDING financing requests in queue
  const pendingQueueCount = requests.filter((r) => r.status === FinancingRequestStatus.PENDING).length;

  // Active Facilities: count of APPROVED or DISBURSED requests (REPAID requests are NOT counted as active)
  const activeRequests = requests.filter(
    (r) => r.status === FinancingRequestStatus.APPROVED || r.status === FinancingRequestStatus.DISBURSED
  );
  const activeFacilitiesCount = activeRequests.length;

  // Total Disbursed Capital: sum of principal amounts for DISBURSED or REPAID requests
  const totalDisbursedCapital = requests
    .filter((r) => r.status === FinancingRequestStatus.DISBURSED || r.status === FinancingRequestStatus.REPAID)
    .reduce((sum, r) => sum + parseFloat((r.approvedAmount || r.requestedAmount).toString()), 0);

  // Outstanding Exposure: sum of active/unpaid principal for APPROVED or DISBURSED requests
  const outstandingExposure = activeRequests.reduce(
    (sum, r) => sum + parseFloat((r.approvedAmount || r.requestedAmount).toString()),
    0
  );

  // Repaid Facilities Count
  const repaidFacilitiesCount = requests.filter((r) => r.status === FinancingRequestStatus.REPAID).length;

  return {
    pendingQueueCount,
    totalDisbursedCapital,
    activeFacilitiesCount,
    outstandingExposure,
    repaidFacilitiesCount,
    financingRequests: requests,
    institution,
  };
};

export const getAdminDashboardData = async (): Promise<AdminDashboardSummary> => {
  const [totalUsersCount, totalCompaniesCount, totalInvoicesCount, invoicesAgg, requestsAgg] =
    await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.invoice.count(),
      prisma.invoice.aggregate({ _sum: { amount: true } }),
      prisma.financingRequest.aggregate({ _sum: { requestedAmount: true } }),
    ]);

  const totalInvoicedVolume = parseFloat((invoicesAgg._sum.amount || 0).toString());
  const totalFinancedVolume = parseFloat((requestsAgg._sum.requestedAmount || 0).toString());

  return {
    totalUsersCount,
    totalCompaniesCount,
    totalInvoicesCount,
    totalInvoicedVolume,
    totalFinancedVolume,
    systemStatus: 'healthy',
  };
};
