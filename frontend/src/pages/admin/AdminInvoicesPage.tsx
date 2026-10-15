import React from 'react';
import { useDemoData } from '../../context/DemoDataContext';
import { Card } from '../../components/ui/Card';
import { InvoiceStatusBadge } from '../../components/ui/Badge';

export const AdminInvoicesPage: React.FC = () => {
  const { invoices } = useDemoData();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Global Invoices Audit Ledger</h1>
        <p className="text-xs text-[#737373] mt-1">Platform invoice verification records</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Buyer</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">{inv.invoiceNumber}</td>
                <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">{inv.supplierName}</td>
                <td className="py-3.5 px-4 text-[#737373]">{inv.buyerName}</td>
                <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                  ₹{inv.amount.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-4">
                  <InvoiceStatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
