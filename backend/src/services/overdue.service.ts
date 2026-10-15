import { InvoiceStatus, NotificationType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface OverdueScanResult {
  scannedCount: number;
  overdueCount: number;
  notificationsCreated: number;
}

export const scanAndUpdateOverdueInvoices = async (): Promise<OverdueScanResult> => {
  const now = new Date();

  // Find all invoices past their due date that are APPROVED or PARTIALLY_PAID
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      dueDate: {
        lt: now,
      },
      status: {
        in: [InvoiceStatus.APPROVED, InvoiceStatus.PARTIALLY_PAID],
      },
    },
    include: {
      supplier: true,
      buyer: true,
    },
  });

  let notificationsCreated = 0;

  for (const invoice of overdueInvoices) {
    // 1. Update invoice status to OVERDUE
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: InvoiceStatus.OVERDUE },
    });

    // 2. Find supplier users to notify
    const supplierUsers = await prisma.user.findMany({
      where: { companyId: invoice.supplierId },
    });

    for (const user of supplierUsers) {
      // Duplicate protection: Check if overdue notification already exists for this invoice
      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: NotificationType.PAYMENT_OVERDUE,
          message: { contains: invoice.invoiceNumber },
        },
      });

      if (!existingNotif) {
        // Create PAYMENT_OVERDUE notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Invoice Overdue Alert',
            message: `Invoice ${invoice.invoiceNumber} for ${invoice.buyer.name} (₹${parseFloat(invoice.amount.toString()).toLocaleString('en-IN')}) is now overdue.`,
            type: NotificationType.PAYMENT_OVERDUE,
            isRead: false,
          },
        });

        // Create CASH_FLOW_WARNING placeholder notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Cash Flow Warning',
            message: `Overdue invoice ${invoice.invoiceNumber} may affect upcoming working capital collection.`,
            type: NotificationType.CASH_FLOW_WARNING,
            isRead: false,
          },
        });

        notificationsCreated += 2;
      }
    }
  }

  console.log(
    `[Overdue Scheduler] Scanned ${overdueInvoices.length} overdue invoices, created ${notificationsCreated} notifications.`
  );

  return {
    scannedCount: overdueInvoices.length,
    overdueCount: overdueInvoices.length,
    notificationsCreated,
  };
};
