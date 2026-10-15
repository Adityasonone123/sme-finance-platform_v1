import React from 'react';
import { useDemoData } from '../../context/DemoDataContext';
import { Card } from '../../components/ui/Card';
import { FinancingStatusBadge } from '../../components/ui/Badge';

export const AdminFinancingPage: React.FC = () => {
  const { financingRequests } = useDemoData();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Global Financing Monitoring</h1>
        <p className="text-xs text-[#737373] mt-1">Cross-lender credit line tracking</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Facility ID</th>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Lender</th>
              <th className="py-3 px-4 text-right">Requested Credit</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            {financingRequests.map((req) => (
              <tr key={req.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">{req.requestId}</td>
                <td className="py-3.5 px-4 font-mono-num font-semibold text-[#ea580c]">{req.invoiceNumber}</td>
                <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">{req.lenderName}</td>
                <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                  ₹{req.requestedAmount.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-4">
                  <FinancingStatusBadge status={req.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
