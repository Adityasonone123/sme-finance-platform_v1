import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getRepaymentQueue,
  RepaymentQueueItem,
} from '../../services/repaymentService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, DollarSign, Clock, ChevronRight, ShieldCheck, Filter } from 'lucide-react';

export const FinanceRepaymentsPage: React.FC = () => {
  const [repayments, setRepayments] = useState<RepaymentQueueItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRepayments = async () => {
    try {
      setLoading(true);
      const res = await getRepaymentQueue({
        q: searchQuery,
        status: statusFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 10,
      });

      setRepayments(res.repayments);
      setPagination(res.pagination);
    } catch {
      setRepayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepayments();
  }, [searchQuery, statusFilter, sortBy, sortOrder, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRepayments();
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
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Financing Repayments & Settlement</h1>
        <p className="text-xs text-[#737373] mt-1">
          Monitor active disbursed financing facilities, track repayment schedules, and record simulated repayment settlements
        </p>
      </div>

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
              { value: 'ALL', label: 'Status: All Facilities' },
              { value: 'ACTIVE', label: 'Status: Active / Current' },
              { value: 'OVERDUE', label: 'Status: Overdue Repayments' },
              { value: 'PARTIALLY_REPAID', label: 'Status: Partially Repaid' },
              { value: 'REPAID', label: 'Status: Repaid / Settled' },
            ]}
          />

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            theme="financier"
            options={[
              { value: 'createdAt', label: 'Sort: Date Disbursed' },
              { value: 'disbursedAmount', label: 'Sort: Disbursed Amount' },
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

      {/* Repayments List Table */}
      <Card className="p-0 overflow-hidden shadow-popover">
        <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between bg-[#f5f5f5]">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-[#22863a]" />
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">Active Financed Transactions</h3>
          </div>
          <span className="text-xs font-bold font-mono-num text-[#737373]">
            Showing {repayments.length} of {pagination.total} records
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
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#737373]">
                    Loading repayments queue...
                  </td>
                </tr>
              ) : repayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#737373] space-y-2">
                    <ShieldCheck className="w-8 h-8 text-[#a3a3a3] mx-auto" />
                    <p className="font-semibold text-sm text-[#0a0a0a]">No active financed transactions found.</p>
                    <p className="text-xs">
                      When capital disbursements are executed, active repayment obligations will populate here.
                    </p>
                  </td>
                </tr>
              ) : (
                repayments.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">
                      {r.financingId}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num font-semibold text-[#ea580c]">
                      {r.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {r.buyer.name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {r.supplier.name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                      ₹{r.disbursedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#3b82f6]">
                      ₹{r.outstandingBalance.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num">
                      <div className="flex items-center space-x-1 text-[#0a0a0a]">
                        <Clock className="w-3.5 h-3.5 text-[#ea580c]" />
                        <span>{new Date(r.dueDate).toLocaleDateString()}</span>
                        {r.isOverdue && (
                          <span className="text-[10px] font-bold text-[#d32f2f] ml-1">
                            ({r.daysOverdue}d late)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          r.status === 'REPAID'
                            ? 'success'
                            : r.status === 'OVERDUE'
                            ? 'danger'
                            : r.status === 'PARTIALLY_REPAID'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link to={`/finance/repayments/${r.id}`}>
                        <Button variant="secondary" size="sm" icon={<ChevronRight className="w-3.5 h-3.5" />}>
                          {r.status === 'REPAID' ? 'View Settlement' : 'Review & Repay'}
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
