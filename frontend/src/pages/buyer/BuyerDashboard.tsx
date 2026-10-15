import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBuyerDashboard, ApiBuyerDashboard } from '../../services/dashboardService';
import { approveInvoice, rejectInvoice } from '../../services/invoiceService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InvoiceStatusBadge } from '../../components/ui/Badge';
import { CheckCircle2, XCircle } from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<ApiBuyerDashboard | null>(null);

  const fetchBuyerData = async () => {
    try {
      const summary = await getBuyerDashboard();
      setDashboard(summary);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchBuyerData();
  }, []);

  const handleApprove = async (invoiceId: string) => {
    try {
      await approveInvoice(invoiceId);
      fetchBuyerData();
    } catch {
      // Catch
    }
  };

  const handleReject = async (invoiceId: string) => {
    try {
      await rejectInvoice(invoiceId);
      fetchBuyerData();
    } catch {
      // Catch
    }
  };

  const invSummary = dashboard?.invoiceSummary;
  const invoices = dashboard?.recentInvoices || [];

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Corporate Buyer — Accounts Payable Console</h1>
        <p className="text-xs text-[#737373] mt-1">Review, verify, and approve incoming supplier invoices</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Pending Verification</p>
          <p className="text-2xl font-bold font-mono-num text-[#ea580c] mt-1">
            {invSummary?.pendingVerificationCount ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#22863a]">Approved Invoices</p>
          <p className="text-2xl font-bold font-mono-num text-[#22863a] mt-1">
            {invSummary?.approvedCount ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#d32f2f]">Overdue Payables</p>
          <p className="text-2xl font-bold font-mono-num text-[#d32f2f] mt-1">
            {invSummary?.overduePayablesCount ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Total Payable</p>
          <p className="text-2xl font-bold font-mono-num text-[#0a0a0a] mt-1">
            ₹{(invSummary?.totalPayableAmount ?? 0).toLocaleString('en-IN')}
          </p>
        </Card>
      </div>

      {/* Pending Invoices for Buyer Approval */}
      <Card className="p-0 overflow-hidden shadow-popover">
        <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-[#0a0a0a]">Invoices Pending Buyer Verification</h3>
          <Link to="/buyer/invoices" className="text-xs font-semibold text-[#ea580c] hover:underline">
            View All Received →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#737373]">
                    No invoices received yet
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">
                      <Link to={`/buyer/invoices/${inv.id}`} className="hover:text-[#ea580c]">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {inv.supplier?.name || 'SME Supplier'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                      ₹{parseFloat(inv.amount.toString()).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-[#737373] font-mono-num">
                      {new Date(inv.issueDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {inv.status === 'PENDING' ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="accent"
                            size="sm"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => handleApprove(inv.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleReject(inv.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#737373] italic">Action completed</span>
                      )}
                    </td>
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
