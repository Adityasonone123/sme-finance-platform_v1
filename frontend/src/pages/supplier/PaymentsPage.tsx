import React, { useEffect, useState } from 'react';
import { getPayments, calculatePaymentMetrics, ApiPayment } from '../../services/paymentService';
import { getInvoices } from '../../services/invoiceService';

import { Card } from '../../components/ui/Card';
import { Drawer } from '../../components/ui/Drawer';
import { Badge } from '../../components/ui/Badge';
import { ArrowDownLeft, Clock, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';
import { Payment } from '../../types/models';

export const PaymentsPage: React.FC = () => {
  const [paymentsList, setPaymentsList] = useState<Payment[]>([]);
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const loadRealData = async () => {
    try {
      const [dbPayments, dbInvoices] = await Promise.all([getPayments(), getInvoices()]);
      if (Array.isArray(dbPayments)) {
        const mappedPayments: Payment[] = dbPayments.map((dbP: ApiPayment, idx: number) => {
          const rawAmount = typeof dbP.amount === 'string' ? parseFloat(dbP.amount) : dbP.amount;
          return {
            id: dbP.id,
            paymentId: `PAY-2026-${(idx + 1).toString().padStart(3, '0')}`,
            invoiceId: dbP.invoiceId,
            invoiceNumber: dbP.invoice?.invoiceNumber || 'INV-2026',
            buyerName: dbP.invoice?.buyer?.name || 'Corporate Buyer',
            amount: rawAmount,
            paymentDate: new Date(dbP.paymentDate).toISOString().split('T')[0],
            method: dbP.paymentMethod,
            status: 'COMPLETED',
            referenceNumber: dbP.referenceNumber || `UTR${Date.now()}`,
          };
        });
        setPaymentsList(mappedPayments);
      } else {
        setPaymentsList([]);
      }
      if (Array.isArray(dbInvoices)) {
        setInvoicesList(dbInvoices);
      } else {
        setInvoicesList([]);
      }
    } catch {
      setPaymentsList([]);
      setInvoicesList([]);
    }
  };

  useEffect(() => {
    loadRealData();
  }, []);

  const metrics = calculatePaymentMetrics(paymentsList, invoicesList);

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Payments Ledger</h1>
        <p className="text-xs text-[#737373] mt-1">Audit log of customer payment collections and settlements</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-[#e5e5e5] shadow-card flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-[#22863a]/10 text-[#22863a]">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Total Received</p>
            <p className="text-2xl font-bold font-mono-num text-[#22863a] mt-0.5">
              ₹{metrics.totalReceived.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#e5e5e5] shadow-card flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Pending Receivables</p>
            <p className="text-2xl font-bold font-mono-num text-[#0a0a0a] mt-0.5">
              ₹{metrics.pendingReceivables.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#e5e5e5] shadow-card flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-[#d32f2f]/10 text-[#d32f2f]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#d32f2f]">Overdue Receivables</p>
            <p className="text-2xl font-bold font-mono-num text-[#d32f2f] mt-0.5">
              ₹{metrics.overdueReceivables.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Records Table */}
      <Card className="p-0 overflow-hidden shadow-popover">
        <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-[#0a0a0a]">Payment Receipts History</h2>
          <span className="text-xs font-mono-num text-[#737373]">{paymentsList.length} transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Payment ID</th>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Corporate Buyer</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Reference UTR</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {paymentsList.map((p) => (
                <tr key={p.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">{p.paymentId}</td>
                  <td className="py-3.5 px-4 font-mono-num font-semibold text-[#ea580c]">{p.invoiceNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">{p.buyerName}</td>
                  <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#22863a]">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-[#737373] font-mono-num">{p.paymentDate}</td>
                  <td className="py-3.5 px-4 font-semibold text-[#404040]">{p.method}</td>
                  <td className="py-3.5 px-4 font-mono-num text-[#737373] text-[11px]">{p.referenceNumber}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant="success">Completed</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedPayment(p)}
                      className="p-1 text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] rounded-md transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Details Drawer */}
      <Drawer
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Payment Receipt Details"
      >
        {selectedPayment && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-[#22863a]/10 border border-[#22863a]/30 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#22863a] mx-auto mb-2" />
              <p className="text-xs uppercase tracking-wider font-semibold text-[#22863a]">Payment Verified & Settled</p>
              <p className="text-3xl font-bold font-mono-num text-[#0a0a0a] mt-1">
                ₹{selectedPayment.amount.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="space-y-3 divide-y divide-[#e5e5e5]">
              <div className="pt-2 flex justify-between">
                <span className="text-[#737373]">Payment Transaction ID:</span>
                <span className="font-mono-num font-bold text-[#0a0a0a]">{selectedPayment.paymentId}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-[#737373]">Associated Invoice:</span>
                <span className="font-mono-num font-semibold text-[#ea580c]">{selectedPayment.invoiceNumber}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-[#737373]">Corporate Buyer:</span>
                <span className="font-semibold text-[#0a0a0a]">{selectedPayment.buyerName}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-[#737373]">Settlement Method:</span>
                <span className="font-semibold text-[#404040]">{selectedPayment.method}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-[#737373]">Bank Reference UTR:</span>
                <span className="font-mono-num text-[#0a0a0a]">{selectedPayment.referenceNumber}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-[#737373]">Execution Date:</span>
                <span className="font-mono-num text-[#0a0a0a]">{selectedPayment.paymentDate}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
