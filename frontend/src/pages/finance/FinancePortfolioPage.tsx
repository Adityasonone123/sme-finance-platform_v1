import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getPortfolioOverview,
  getPortfolioList,
  PortfolioMetrics,
  BuyerExposure,
  PortfolioItem,
} from '../../services/portfolioService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import { Search, PieChart, AlertTriangle, ChevronRight, ShieldCheck, Filter, Landmark } from 'lucide-react';

export const FinancePortfolioPage: React.FC = () => {
  const [metrics, setMetrics] = useState<PortfolioMetrics>({
    totalDisbursed: 0,
    totalRepaid: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    activeCount: 0,
    settledCount: 0,
    totalTransactions: 0,
    onTimeRepaymentRate: 100,
    overdueRate: 0,
  });

  const [buyerExposures, setBuyerExposures] = useState<BuyerExposure[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Controls
  const [dateRange, setDateRange] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOverview = async () => {
    try {
      const data = await getPortfolioOverview(dateRange);
      setMetrics(data.metrics);
      setBuyerExposures(data.buyerExposures);
    } catch {
      // Ignore
    }
  };

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await getPortfolioList({
        q: searchQuery,
        status: statusFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 10,
        dateRange,
      });

      setPortfolio(res.portfolio);
      setPagination(res.pagination);
    } catch {
      setPortfolio([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [dateRange]);

  useEffect(() => {
    fetchPortfolio();
  }, [searchQuery, statusFilter, sortBy, sortOrder, currentPage, dateRange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPortfolio();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Financier Portfolio & Risk Monitoring</h1>
          <p className="text-xs text-[#737373] mt-1">
            Authoritative performance metrics, buyer concentration exposure, and deterministic risk indicators
          </p>
        </div>

        <div className="flex items-center space-x-1 p-1 bg-white border border-[#e5e5e5] rounded-xl text-xs shadow-sm">
          {['ALL', '30D', '90D', '1Y'].map((range) => (
            <button
              key={range}
              onClick={() => {
                setDateRange(range);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                dateRange === range
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'text-[#737373] hover:text-[#0a0a0a]'
              }`}
            >
              {range === 'ALL' ? 'All Time' : range}
            </button>
          ))}
        </div>
      </div>

      {/* Top Portfolio Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2 shadow-popover border-l-4 border-l-[#3b82f6]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">Total Disbursed Capital</span>
          <p className="text-xl font-bold font-mono-num text-[#0a0a0a]">
            ₹{metrics.totalDisbursed.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#737373]">
            Facilities Funded: <strong className="text-[#0a0a0a]">{metrics.totalTransactions}</strong>
          </p>
        </Card>

        <Card className="p-4 space-y-2 shadow-popover border-l-4 border-l-[#22863a]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">Total Repaid Capital</span>
          <p className="text-xl font-bold font-mono-num text-[#22863a]">
            ₹{metrics.totalRepaid.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#737373]">
            Settled Facilities: <strong className="text-[#0a0a0a]">{metrics.settledCount}</strong> ({metrics.onTimeRepaymentRate}% Rate)
          </p>
        </Card>

        <Card className="p-4 space-y-2 shadow-popover border-l-4 border-l-[#ea580c]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">Outstanding Exposure</span>
          <p className="text-xl font-bold font-mono-num text-[#ea580c]">
            ₹{metrics.totalOutstanding.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#737373]">
            Active Facilities: <strong className="text-[#0a0a0a]">{metrics.activeCount}</strong>
          </p>
        </Card>

        <Card className="p-4 space-y-2 shadow-popover border-l-4 border-l-[#d32f2f]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">Overdue Exposure</span>
          <p className="text-xl font-bold font-mono-num text-[#d32f2f]">
            ₹{metrics.overdueAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#737373]">
            Overdue Rate: <strong className="text-[#d32f2f]">{metrics.overdueRate}%</strong>
          </p>
        </Card>
      </div>

      {/* Corporate Buyer Concentration Exposure Table */}
      {buyerExposures.length > 0 && (
        <Card className="p-0 overflow-hidden shadow-popover">
          <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between bg-[#f5f5f5]">
            <div className="flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-[#3b82f6]" />
              <h3 className="text-base font-bold font-display text-[#0a0a0a]">
                Corporate Buyer Exposure & Concentration Risk
              </h3>
            </div>
            <span className="text-xs font-bold text-[#737373]">
              {buyerExposures.length} Corporate Buyers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f5f5]/50 border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Corporate Buyer</th>
                  <th className="py-3 px-4 text-right">Total Disbursed</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-right">Overdue</th>
                  <th className="py-3 px-4">Buyer Score (B9)</th>
                  <th className="py-3 px-4 text-right">Concentration %</th>
                  <th className="py-3 px-4">Deterministic Risk Warning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {buyerExposures.map((b) => (
                  <tr key={b.buyerId} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#0a0a0a]">{b.buyerName}</td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                      ₹{b.totalDisbursed.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#ea580c]">
                      ₹{b.outstanding.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#d32f2f]">
                      ₹{b.overdue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono-num font-bold text-[#0a0a0a]">{b.paymentScore}/100</span>
                        <RiskBadge risk={b.riskCategory as any} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#3b82f6]">
                      {b.concentrationPercent}%
                    </td>
                    <td className="py-3.5 px-4">
                      {b.riskWarning ? (
                        <div className="flex items-center space-x-1 text-[11px] font-bold text-[#ea580c]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{b.riskWarning}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#737373]">Within limits</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Filter & Search Bar */}
      <Card className="p-4 shadow-popover space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by financing #, invoice #, supplier, or buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-[#737373]" />}
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            theme="financier"
            options={[
              { value: 'ALL', label: 'Status: All Transactions' },
              { value: 'ACTIVE', label: 'Status: Active Facilities' },
              { value: 'OVERDUE', label: 'Status: Overdue Facilities' },
              { value: 'REPAID', label: 'Status: Settled Facilities' },
            ]}
          />

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            theme="financier"
            options={[
              { value: 'createdAt', label: 'Sort: Date Disbursed' },
              { value: 'amount', label: 'Sort: Disbursed Amount' },
              { value: 'outstanding', label: 'Sort: Outstanding Balance' },
            ]}
          />
        </form>

        <div className="flex items-center justify-between pt-2 border-t border-[#e5e5e5] text-xs text-[#737373]">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Filter: Status (<strong className="text-[#0a0a0a]">{statusFilter}</strong>)</span>
            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                onClick={clearFilters}
                className="text-[#ea580c] font-semibold hover:underline ml-2"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span>Direction:</span>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-2 py-0.5 border border-[#e5e5e5] rounded text-xs font-bold bg-[#f5f5f5] text-[#0a0a0a]"
            >
              {sortOrder === 'desc' ? '↓ DESC' : '↑ ASC'}
            </button>
          </div>
        </div>
      </Card>

      {/* Portfolio List Table */}
      <Card className="p-0 overflow-hidden shadow-popover">
        <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between bg-[#f5f5f5]">
          <div className="flex items-center space-x-2">
            <Landmark className="w-4 h-4 text-[#3b82f6]" />
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">Portfolio Financing Transactions</h3>
          </div>
          <span className="text-xs font-bold font-mono-num text-[#737373]">
            Showing {portfolio.length} of {pagination.total} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5]/50 border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Financing ID</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Corporate Buyer</th>
                <th className="py-3 px-4">SME Supplier</th>
                <th className="py-3 px-4 text-right">Disbursed</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Risk Indicator</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#737373]">
                    Loading portfolio transactions...
                  </td>
                </tr>
              ) : portfolio.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#737373] space-y-2">
                    <ShieldCheck className="w-8 h-8 text-[#a3a3a3] mx-auto" />
                    <p className="font-semibold text-sm text-[#0a0a0a]">No financing portfolio data available.</p>
                  </td>
                </tr>
              ) : (
                portfolio.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">
                      {p.financingId}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num font-semibold text-[#ea580c]">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {p.buyer.name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {p.supplier.name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                      ₹{p.disbursedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#3b82f6]">
                      ₹{p.outstanding.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num">
                      {new Date(p.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          p.status === 'REPAID' ? 'success' : p.status === 'OVERDUE' ? 'danger' : 'info'
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          p.riskIndicator === 'OVERDUE'
                            ? 'bg-[#d32f2f]/10 text-[#d32f2f]'
                            : p.riskIndicator === 'MATURING SOON'
                            ? 'bg-[#ea580c]/10 text-[#ea580c]'
                            : 'bg-[#22863a]/10 text-[#22863a]'
                        }`}
                      >
                        {p.riskIndicator}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link to={`/finance/portfolio/${p.id}`}>
                        <Button variant="secondary" size="sm" icon={<ChevronRight className="w-3.5 h-3.5" />}>
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-[#e5e5e5] bg-[#f5f5f5] flex items-center justify-between text-xs text-[#737373]">
            <span>
              Page <strong className="text-[#0a0a0a] font-mono-num">{pagination.page}</strong> of{' '}
              <strong className="text-[#0a0a0a] font-mono-num">{pagination.totalPages}</strong>
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
