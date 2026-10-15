import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getMarketplaceOpportunities,
  OpportunityItem,
  OpportunitySummary,
} from '../../services/marketplaceService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import { Search, ShoppingBag, Clock, ChevronRight, ShieldCheck, Filter } from 'lucide-react';

export const FinancierMarketplacePage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [summary, setSummary] = useState<OpportunitySummary>({
    availableOpportunitiesCount: 0,
    totalEligibleValue: 0,
    averageTenorDays: 0,
    potentialExposure: 0,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [maxTenorFilter, setMaxTenorFilter] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const res = await getMarketplaceOpportunities({
        q: searchQuery,
        status: statusFilter,
        maxTenor: maxTenorFilter ? parseInt(maxTenorFilter) : undefined,
        minBuyerScore: minScoreFilter ? parseInt(minScoreFilter) : undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 10,
      });

      setSummary(res.summary);
      setOpportunities(res.opportunities);
      setPagination(res.pagination);
    } catch {
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [searchQuery, statusFilter, maxTenorFilter, minScoreFilter, sortBy, sortOrder, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOpportunities();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('PENDING');
    setMaxTenorFilter('');
    setMinScoreFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Financing Marketplace</h1>
        <p className="text-xs text-[#737373] mt-1">
          Review eligible SME invoice discounting opportunities verified by corporate buyer acceptances
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-popover">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Available Opportunities</p>
          <p className="text-2xl font-bold font-mono-num text-[#3b82f6] mt-1">
            {summary.availableOpportunitiesCount}
          </p>
          <span className="text-[10px] text-[#737373] mt-1 block">Eligible Discounting Items</span>
        </Card>

        <Card className="shadow-popover">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#22863a]">Total Eligible Value</p>
          <p className="text-2xl font-bold font-mono-num text-[#22863a] mt-1">
            ₹{summary.totalEligibleValue.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-[#737373] mt-1 block">Requested Credit Volume</span>
        </Card>

        <Card className="shadow-popover">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#ea580c]">Average Tenor</p>
          <p className="text-2xl font-bold font-mono-num text-[#ea580c] mt-1">
            {summary.averageTenorDays} <span className="text-sm font-normal text-[#737373]">days</span>
          </p>
          <span className="text-[10px] text-[#737373] mt-1 block">Weighted Maturity Window</span>
        </Card>

        <Card className="shadow-popover">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#404040]">Potential Exposure</p>
          <p className="text-2xl font-bold font-mono-num text-[#0a0a0a] mt-1">
            ₹{summary.potentialExposure.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-[#737373] mt-1 block">Total Market Pipeline</span>
        </Card>
      </div>

      {/* Filter & Search Controls Bar */}
      <Card className="p-4 shadow-popover space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by invoice #, supplier, or buyer..."
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
            options={[
              { value: 'PENDING', label: 'Status: Available / Pending' },
              { value: 'APPROVED', label: 'Status: Underwritten / Approved' },
              { value: 'DISBURSED', label: 'Status: Disbursed / Active' },
              { value: 'REPAID', label: 'Status: Repaid' },
              { value: 'ALL', label: 'Status: All Opportunities' },
            ]}
          />

          <Select
            value={maxTenorFilter}
            onChange={(e) => {
              setMaxTenorFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: '', label: 'Max Tenor: Any' },
              { value: '30', label: 'Max Tenor: 30 days' },
              { value: '60', label: 'Max Tenor: 60 days' },
              { value: '90', label: 'Max Tenor: 90 days' },
            ]}
          />

          <Select
            value={minScoreFilter}
            onChange={(e) => {
              setMinScoreFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: '', label: 'Min Buyer Score: Any' },
              { value: '70', label: 'Min Score: 70+ / 100' },
              { value: '80', label: 'Min Score: 80+ / 100' },
              { value: '90', label: 'Min Score: 90+ / 100' },
            ]}
          />
        </form>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-[#e5e5e5] text-xs text-[#737373] gap-2 font-sans">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Active Filters: Status (<strong className="text-[#0a0a0a]">{statusFilter}</strong>)</span>
            {(searchQuery || maxTenorFilter || minScoreFilter || statusFilter !== 'PENDING') && (
              <button
                onClick={clearFilters}
                className="text-[#ea580c] font-semibold hover:underline ml-2"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              theme="financier"
              className="w-48"
              options={[
                { value: 'createdAt', label: 'Sort: Date Created' },
                { value: 'amount', label: 'Sort: Financing Amount' },
                { value: 'tenor', label: 'Sort: Remaining Tenor' },
                { value: 'buyerScore', label: 'Sort: Buyer Score' },
              ]}
            />
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-1 border border-[#e5e5e5] rounded-md text-xs font-bold bg-[#f5f5f5] text-[#0a0a0a]"
              title="Toggle sort direction"
            >
              {sortOrder === 'desc' ? '↓ DESC' : '↑ ASC'}
            </button>
          </div>
        </div>
      </Card>

      {/* Opportunities List Table */}
      <Card className="p-0 overflow-hidden shadow-popover">
        <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between bg-[#f5f5f5]">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-[#3b82f6]" />
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">Eligible Financing Opportunities</h3>
          </div>
          <span className="text-xs font-bold font-mono-num text-[#737373]">
            Showing {opportunities.length} of {pagination.total} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5]/50 border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Opportunity ID</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">SME Supplier</th>
                <th className="py-3 px-4">Corporate Buyer</th>
                <th className="py-3 px-4 text-right">Invoice Amount</th>
                <th className="py-3 px-4 text-right">Requested Credit</th>
                <th className="py-3 px-4">Remaining Tenor</th>
                <th className="py-3 px-4 text-center">Buyer Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#737373]">
                    Loading marketplace opportunities...
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#737373] space-y-2">
                    <ShieldCheck className="w-8 h-8 text-[#a3a3a3] mx-auto" />
                    <p className="font-semibold text-sm text-[#0a0a0a]">No financing opportunities available.</p>
                    <p className="text-xs">
                      Eligible opportunities will appear here when invoices meet the platform's financing criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                opportunities.map((op) => (
                  <tr key={op.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">
                      {op.opportunityId}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num font-semibold text-[#ea580c]">
                      {op.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {op.supplier.name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {op.buyer.name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-[#737373]">
                      ₹{op.invoiceAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#22863a]">
                      ₹{op.requestedAmount.toLocaleString('en-IN')}
                      <span className="block text-[10px] text-[#737373] font-normal">({op.advanceRate}% advance)</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono-num">
                      <div className="flex items-center space-x-1.5 text-[#0a0a0a]">
                        <Clock className="w-3.5 h-3.5 text-[#ea580c]" />
                        <span>{op.remainingTenorDays} days</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold font-mono-num text-[#0a0a0a]">{op.buyer.paymentScore} / 100</span>
                        <RiskBadge risk={op.buyer.riskLevel} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={op.status === 'PENDING' ? 'info' : 'success'}>
                        {op.status === 'PENDING' ? 'AVAILABLE' : op.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link to={`/finance/marketplace/${op.id}`}>
                        <Button variant="secondary" size="sm" icon={<ChevronRight className="w-3.5 h-3.5" />}>
                          View Opportunity
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
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
