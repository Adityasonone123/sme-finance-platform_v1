import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDemoData } from '../../context/DemoDataContext';
import { getSupplierDashboard, ApiSupplierDashboard } from '../../services/dashboardService';
import { triggerOverdueScan } from '../../services/notificationService';
import { MetricCard } from '../../components/ui/MetricCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RiskBadge } from '../../components/ui/Badge';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  FileText,
  ChevronRight,
  Sparkles,
  Bell,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export const SupplierDashboard: React.FC = () => {
  const { userProfile, cashFlowEntries } = useDemoData();
  const [dashboard, setDashboard] = useState<ApiSupplierDashboard | null>(null);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      await triggerOverdueScan();
      const summary = await getSupplierDashboard();
      setDashboard(summary);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const invSummary = dashboard?.invoiceSummary;
  const cfSummary = dashboard?.cashFlowSummary;
  const buyerSummary = dashboard?.buyerSummary || [];
  const notifications = dashboard?.recentNotifications || [];
  const overdueNotifications = notifications.filter(
    (n) => n.type === 'PAYMENT_OVERDUE' || n.type === 'CASH_FLOW_WARNING'
  );

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Greeting & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#0a0a0a]">
            Good morning, {userProfile.name.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-[#737373] mt-1">
            Here is your working capital forecast and invoice health snapshot.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/invoices/new">
            <Button variant="accent" size="sm" icon={<FileText className="w-4 h-4" />}>
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Overdue Notifications Banner */}
      {overdueNotifications.length > 0 && (
        <div className="p-4 rounded-xl bg-[#d32f2f]/10 border border-[#d32f2f]/30 space-y-2">
          <div className="flex items-center space-x-2 text-[#d32f2f] font-bold text-xs">
            <Bell className="w-4 h-4" />
            <span>Active Overdue Invoices Alerts ({overdueNotifications.length})</span>
          </div>
          {overdueNotifications.slice(0, 2).map((n) => (
            <div key={n.id} className="text-xs text-[#404040] flex justify-between items-center bg-white p-2.5 rounded-lg border border-[#e5e5e5]">
              <span>{n.message}</span>
              <button
                onClick={() => navigate('/notifications')}
                className="text-xs font-semibold text-[#ea580c] hover:underline shrink-0 ml-2"
              >
                View →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cash Available"
          amount={cfSummary?.currentCash ?? 450000}
          subtitle="Operating bank balance"
          icon={<Wallet className="w-5 h-5" />}
        />
        <MetricCard
          title="Expected Receipts"
          amount={cfSummary?.expectedIncome ?? invSummary?.totalOutstandingAmount ?? 0}
          subtitle="Receivables coming due"
          icon={<ArrowDownLeft className="w-5 h-5 text-[#22863a]" />}
        />
        <MetricCard
          title="Upcoming Expenses"
          amount={cfSummary?.expectedExpenses ?? 0}
          subtitle="Payroll, materials & rent"
          icon={<ArrowUpRight className="w-5 h-5 text-[#d32f2f]" />}
        />
        <MetricCard
          title="Working Capital Gap"
          amount={cfSummary?.workingCapitalGap ?? 0}
          highlight
          trendText={(cfSummary?.workingCapitalGap ?? 0) > 0 ? 'Deficit forecast' : 'Sufficient liquidity'}
          trendType={(cfSummary?.workingCapitalGap ?? 0) > 0 ? 'warning' : 'positive'}
          subtitle="Buffer shortfall evaluation"
          icon={<AlertTriangle className="w-5 h-5 text-[#ea580c]" />}
        />
      </div>

      {/* Cash Flow Forecast & Cash-Flow Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Cash Flow Visualization */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold font-display text-[#0a0a0a]">Cash Flow Forecast</h2>
              <p className="text-xs text-[#737373]">Projected inflow vs outflow over next 6 months</p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#22863a]" />
                <span className="text-[#737373]">Cash In</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#d32f2f]" />
                <span className="text-[#737373]">Cash Out</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={cashFlowEntries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22863a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22863a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d32f2f" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#d32f2f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#737373' }} />
                <YAxis tick={{ fontSize: 11, fill: '#737373' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                <Tooltip
                  formatter={(value: unknown) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="cashIn" stroke="#22863a" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                <Area type="monotone" dataKey="cashOut" stroke="#d32f2f" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Cash-Flow Warning Widget */}
        <div className="space-y-6">
          <Card className="bg-[#0a0a0a] text-white border-black">
            <div className="flex items-center space-x-2 text-[#fb923c] mb-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Cash-Flow Status</span>
            </div>

            <h3 className="text-lg font-bold font-display text-white mb-2">
              {(cfSummary?.workingCapitalGap ?? 0) > 0 ? 'Working Capital Deficit Warning' : 'Healthy Operating Balance'}
            </h3>

            <p className="text-xs text-[#a3a3a3] leading-relaxed mb-4">
              {(cfSummary?.workingCapitalGap ?? 0) > 0
                ? 'Your projected receivables leave a cash deficit relative to expected expenses.'
                : 'Projected receipts cover all expected operating commitments.'}
            </p>

            <div className="p-3 rounded-lg bg-[#171717] border border-[#404040] mb-6 flex justify-between items-center text-xs">
              <span className="text-[#a3a3a3]">Working Capital Gap:</span>
              <span className="font-mono-num font-bold text-[#fb923c] text-sm">
                ₹{(cfSummary?.workingCapitalGap ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            <Button
              variant="accent"
              size="sm"
              className="w-full"
              icon={<ChevronRight className="w-4 h-4" />}
              onClick={() => navigate('/cash-flow')}
            >
              View Cash Flow Details
            </Button>
          </Card>

          {/* Financing Recommendation */}
          <Card className="bg-[#fff7ed] border-[#fb923c]/40">
            <div className="flex items-center space-x-2 text-[#ea580c] mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Working Capital Liquidity Line</span>
            </div>
            <p className="text-xs text-[#404040] leading-relaxed mb-3">
              Discount verified invoices for immediate cash liquidity.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/financing')}
            >
              Explore Financing Marketplace
            </Button>
          </Card>
        </div>
      </div>

      {/* Invoice Summary & Buyer Payment Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Summary */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">Invoice Summary</h3>
            <Link to="/invoices" className="text-xs font-semibold text-[#ea580c] hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#f5f5f5] border border-[#e5e5e5]">
              <span className="text-xs text-[#737373] font-medium">Pending Approval</span>
              <span className="text-sm font-bold font-mono-num text-[#0a0a0a]">
                {invSummary?.pendingCount ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#d32f2f]/5 border border-[#d32f2f]/20">
              <span className="text-xs text-[#d32f2f] font-medium">Overdue Invoices</span>
              <span className="text-sm font-bold font-mono-num text-[#d32f2f]">
                {invSummary?.overdueCount ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#22863a]/5 border border-[#22863a]/20">
              <span className="text-xs text-[#22863a] font-medium">Paid Invoices</span>
              <span className="text-sm font-bold font-mono-num text-[#22863a]">
                {invSummary?.paidCount ?? 0}
              </span>
            </div>
            <div className="pt-2 border-t border-[#e5e5e5] flex items-center justify-between">
              <span className="text-xs font-bold text-[#404040]">Total Outstanding:</span>
              <span className="text-base font-bold font-mono-num text-[#0a0a0a]">
                ₹{(invSummary?.totalOutstandingAmount ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </Card>

        {/* Buyer Risk Section */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold font-display text-[#0a0a0a]">Buyer Payment Risk Snapshot</h3>
              <p className="text-xs text-[#737373]">Contractual terms vs actual payment behavior</p>
            </div>
            <Link to="/buyers" className="text-xs font-semibold text-[#ea580c] hover:underline">
              Buyer Directory →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Buyer Name</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3 text-right">Outstanding</th>
                  <th className="py-2.5 px-3 text-right">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {buyerSummary.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#737373]">
                      No buyers registered yet
                    </td>
                  </tr>
                ) : (
                  buyerSummary.map((b) => (
                    <tr key={b.buyerId} className="hover:bg-[#f5f5f5]/60 transition-colors">
                      <td className="py-3 px-3">
                        <Link to={`/buyers/${b.buyerId}`} className="font-semibold text-[#0a0a0a] hover:text-[#ea580c]">
                          {b.buyerName}
                        </Link>
                      </td>
                      <td className="py-3 px-3 font-mono-num font-bold text-[#0a0a0a]">{b.creditScore}/100</td>
                      <td className="py-3 px-3">
                        <RiskBadge risk={b.riskLevel} />
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-semibold text-[#0a0a0a]">
                        ₹{b.outstandingAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-semibold text-[#d32f2f]">
                        ₹{b.overdueAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Recent Activity Timeline Stream */}
      <Card>
        <h3 className="text-base font-bold font-display text-[#0a0a0a]">Recent Activity Stream</h3>
        <div className="space-y-4 text-xs">
          {(dashboard?.recentActivity ?? []).length === 0 ? (
            <p className="text-[#737373] text-center py-4">No recent activity logged</p>
          ) : (
            dashboard?.recentActivity.map((act) => (
              <div key={act.id} className="flex items-start space-x-3 pb-3 border-b border-[#e5e5e5] last:border-0 last:pb-0">
                <div className="p-2 rounded-lg bg-[#f5f5f5] text-[#3b82f6]">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[#0a0a0a]">{act.title}</p>
                    <span className="text-[11px] font-mono-num text-[#737373]">
                      {new Date(act.timestamp).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
