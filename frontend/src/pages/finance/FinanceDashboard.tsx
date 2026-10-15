import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getLenderDashboard,
  ApiLenderDashboard,
} from '../../services/dashboardService';
import {
  approveFinancingRequest,
  rejectFinancingRequest,
} from '../../services/financingService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FinancingStatusBadge } from '../../components/ui/Badge';
import { CheckCircle2, XCircle, Landmark, ShieldCheck } from 'lucide-react';

export const FinanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<ApiLenderDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLenderData = async () => {
    try {
      setLoading(true);
      const summary = await getLenderDashboard();
      setDashboard(summary);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLenderData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await approveFinancingRequest(id);
      fetchLenderData();
    } catch {
      // Catch
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectFinancingRequest(id);
      fetchLenderData();
    } catch {
      // Catch
    }
  };

  const requests = dashboard?.financingRequests || [];
  const institutionName = user?.company?.name || dashboard?.institution?.name || 'Financial Institution';

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">
          {institutionName} — Credit & Underwriting Operations
        </h1>
        <p className="text-xs text-[#737373] mt-1">
          Working Capital Portfolio Management • Authenticated Officer: <span className="font-semibold text-[#0a0a0a]">{user?.name || 'Authorized Lender'}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-popover">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Pending Underwriting Queue</p>
          <p className="text-2xl font-bold font-mono-num text-[#3b82f6] mt-1">
            {dashboard?.pendingQueueCount ?? 0}
          </p>
          <span className="text-[10px] text-[#737373] mt-1 block">Awaiting Underwriting Review</span>
        </Card>

        <Card className="shadow-popover">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#22863a]">Total Disbursed Capital</p>
          <p className="text-2xl font-bold font-mono-num text-[#22863a] mt-1">
            ₹{(dashboard?.totalDisbursedCapital ?? 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-[#737373] mt-1 block">Cumulative Funded Capital</span>
        </Card>

        <Card className="shadow-popover">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#ea580c]">Active Financing Facilities</p>
          <p className="text-2xl font-bold font-mono-num text-[#ea580c] mt-1">
            {dashboard?.activeFacilitiesCount ?? 0}
          </p>
          <span className="text-[10px] text-[#737373] mt-1 block">Approved & Disbursed Facilities</span>
        </Card>

        <Card className="shadow-popover">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#404040]">Outstanding Principal Exposure</p>
          <p className="text-2xl font-bold font-mono-num text-[#0a0a0a] mt-1">
            ₹{(dashboard?.outstandingExposure ?? 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-[#737373] mt-1 block">Active Portfolio Risk Exposure</span>
        </Card>
      </div>

      {/* Financing Applications Queue */}
      <Card className="p-0 overflow-hidden shadow-popover">
        <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between bg-[#f5f5f5]">
          <div className="flex items-center space-x-2">
            <Landmark className="w-4 h-4 text-[#3b82f6]" />
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">SME Invoice Financing Applications</h3>
          </div>
          <Link to="/finance/requests" className="text-xs font-semibold text-[#3b82f6] hover:underline">
            Full Underwriting Queue →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5]/50 border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">SME Supplier</th>
                <th className="py-3 px-4">Corporate Buyer</th>
                <th className="py-3 px-4 text-right">Requested Credit</th>
                <th className="py-3 px-4">APR Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Underwriting Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#737373]">
                    Loading underwriting requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#737373] space-y-2">
                    <ShieldCheck className="w-8 h-8 text-[#a3a3a3] mx-auto" />
                    <p className="font-semibold text-sm text-[#0a0a0a]">No financing activity yet.</p>
                    <p className="text-xs">When SME suppliers submit eligible invoices for discounting, applications will appear here for lender underwriting.</p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">
                      {req.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num font-semibold text-[#ea580c]">
                      {req.invoice?.invoiceNumber || 'INV-REF'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {req.supplier?.name || 'SME Supplier'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {req.invoice?.buyer?.name || 'Corporate Buyer'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                      ₹{parseFloat((req.approvedAmount || req.requestedAmount).toString()).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-[#737373]">{req.interestRate || '12.5'}%</td>
                    <td className="py-3.5 px-4">
                      <FinancingStatusBadge status={req.status as any} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="accent"
                            size="sm"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => handleApprove(req.id)}
                          >
                            Approve Loan
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleReject(req.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#22863a] font-semibold">Underwritten ({req.status})</span>
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
