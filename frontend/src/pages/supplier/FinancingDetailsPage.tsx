import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDemoData } from '../../context/DemoDataContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FinancingStatusBadge } from '../../components/ui/Badge';
import { ArrowLeft, FileText } from 'lucide-react';

export const FinancingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { financingRequests } = useDemoData();
  const navigate = useNavigate();

  const req = financingRequests.find((r) => r.id === id);

  if (!req) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-bold font-display text-[#0a0a0a]">Request Not Found</h2>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/financing')}>
          Back to Financing
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/financing')}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold font-display font-mono-num text-[#0a0a0a]">{req.requestId}</h1>
              <FinancingStatusBadge status={req.status} />
            </div>
            <p className="text-xs text-[#737373] mt-0.5">Financing facility with {req.lenderName}</p>
          </div>
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 space-y-6">
          <h2 className="text-base font-bold font-display text-[#0a0a0a] border-b border-[#e5e5e5] pb-3">
            Facility Financial Terms
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Requested Credit</p>
              <p className="text-2xl font-bold font-mono-num text-[#0a0a0a] mt-1">
                ₹{req.requestedAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#22863a]">Approved Line</p>
              <p className="text-2xl font-bold font-mono-num text-[#22863a] mt-1">
                ₹{req.approvedAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#ea580c]">Total Repayment</p>
              <p className="text-2xl font-bold font-mono-num text-[#ea580c] mt-1">
                ₹{req.totalRepayment.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#e5e5e5] text-xs">
            <div>
              <p className="text-[#737373]">Interest Rate</p>
              <p className="font-mono-num font-bold text-[#0a0a0a] mt-0.5">{req.interestRate}% p.a.</p>
            </div>
            <div>
              <p className="text-[#737373]">Tenure</p>
              <p className="font-mono-num font-bold text-[#0a0a0a] mt-0.5">{req.tenureDays} Days</p>
            </div>
            <div>
              <p className="text-[#737373]">Processing Fee</p>
              <p className="font-mono-num font-bold text-[#0a0a0a] mt-0.5">₹{req.processingFee.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[#737373]">Repayment Due</p>
              <p className="font-mono-num font-bold text-[#ea580c] mt-0.5">{req.repaymentDueDate}</p>
            </div>
          </div>
        </Card>

        {/* Target Invoice Reference */}
        <Card className="space-y-4">
          <h2 className="text-base font-bold font-display text-[#0a0a0a] border-b border-[#e5e5e5] pb-3">
            Pledged Collateral Invoice
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-[#f5f5f5] text-[#ea580c]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold font-mono-num text-[#0a0a0a] text-sm">{req.invoiceNumber}</p>
                <p className="text-[#737373]">{req.buyerName}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e5e5e5] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#737373]">Invoice Total:</span>
                <span className="font-mono-num font-semibold">₹{req.invoiceAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Repayment Schedule Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e5e5]">
          <h3 className="text-base font-bold font-display text-[#0a0a0a]">Repayment Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Installment ID</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Repayment Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {req.repaymentSchedule.map((sch) => (
                <tr key={sch.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">{sch.id}</td>
                  <td className="py-3.5 px-4 font-mono-num text-[#737373]">{sch.dueDate}</td>
                  <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                    ₹{sch.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#fff7ed] text-[#ea580c] border border-[#ea580c]/20">
                      Pending Due Date
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
