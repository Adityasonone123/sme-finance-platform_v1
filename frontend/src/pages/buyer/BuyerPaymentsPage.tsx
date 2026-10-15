import React, { useEffect, useState } from 'react';
import { Payment } from '../../types/models';
import { getPayments, ApiPayment } from '../../services/paymentService';
import { Card } from '../../components/ui/Card';
import { CreditCard } from 'lucide-react';

export const BuyerPaymentsPage: React.FC = () => {
  const [paymentsList, setPaymentsList] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadRealPayments = async () => {
    try {
      setLoading(true);
      const dbPayments = await getPayments();
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
    } catch {
      setPaymentsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealPayments();
  }, []);

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Buyer Accounts Payable Settlement History</h1>
        <p className="text-xs text-[#737373] mt-1">Disbursed settlements to SME suppliers</p>
      </div>

      <Card className="p-0 overflow-hidden shadow-popover">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Payment ID</th>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4 text-right">Settled Amount</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#737373]">
                    Loading payment history...
                  </td>
                </tr>
              ) : paymentsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#737373]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CreditCard className="w-8 h-8 text-[#a3a3a3]" />
                      <p className="font-semibold text-sm text-[#0a0a0a]">No payments settled yet</p>
                      <p className="text-xs text-[#737373]">Settled payments to SME suppliers will be logged here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paymentsList.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">{p.paymentId}</td>
                    <td className="py-3.5 px-4 font-mono-num text-[#ea580c]">{p.invoiceNumber}</td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#22863a]">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-[#737373] font-mono-num">{p.paymentDate}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#404040]">{p.method}</td>
                    <td className="py-3.5 px-4 font-mono-num text-[#737373]">{p.referenceNumber}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
