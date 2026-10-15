import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getUnderwritingQueue,
  UnderwritingQueueItem,
} from '../../services/underwritingService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { FinancingStatusBadge, RiskBadge } from '../../components/ui/Badge';
import { Search, FileCheck, Clock, ChevronRight, ShieldCheck, Filter } from 'lucide-react';

export const FinanceRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<UnderwritingQueueItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      const res = await getUnderwritingQueue({
        q: searchQuery,
        status: statusFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 10,
      });

      setRequests(res.requests);
      setPagination(res.pagination);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, [searchQuery, statusFilter, sortBy, sortOrder, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchQueueData();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('PENDING');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Financing Underwriting Queue</h1>
        <p className="text-xs text-[#737373] mt-1">
          Review pending financing applications, inspect buyer payment history, and execute underwriting decisions
        </p>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 shadow-popover space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by request #, invoice #, supplier, or buyer..."
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
              { value: 'PENDING', label: 'Status: Pending Underwriting' },
              { value: 'APPROVED', label: 'Status: Underwriting Approved' },
              { value: 'REJECTED', label: 'Status: Declined / Rejected' },
              { value: 'DISBURSED', label: 'Status: Disbursed / Active' },
              { value: 'REPAID', label: 'Status: Repaid / Settled' },
              { value: 'ALL', label: 'Status: All Applications' },
            ]}
          />

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            theme="financier"
            options={[
              { value: 'createdAt', label: 'Sort: Date Submitted' },
              { value: 'amount', label: 'Sort: Requested Amount' },
              { value: 'dueDate', label: 'Sort: Remaining Tenor' },
              { value: 'buyerScore', label: 'Sort: Buyer Credit Score' },
            ]}
          />
        </form>

        <div className="flex items-center justify-between pt-2 border-t border-[#e5e5e5] text-xs text-[#737373]">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Filter: Status (<strong className="text-[#0a0a0a]">{statusFilter}</strong>)</span>
            {(searchQuery || statusFilter !== 'PENDING') && (
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

      {/* Underwriting Queue Table */}
      <Card className="p-0 overflow-hidden shadow-popover">
        <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between bg-[#f5f5f5]">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-[#3b82f6]" />
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">Underwriting Applications Queue</h3>
          </div>
          <span className="text-xs font-bold font-mono-num text-[#737373]">
            Showing {requests.length} of {pagination.total} records
          </span>
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
                <th className="py-3 px-4">Remaining Tenor</th>
                <th className="py-3 px-4 text-center">Buyer Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#737373]">
                    Loading underwriting queue...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#737373] space-y-2">
                    <ShieldCheck className="w-8 h-8 text-[#a3a3a3] mx-auto" />
                    <p className="font-semibold text-sm text-[#0a0a0a]">No financing opportunities require underwriting.</p>
                    <p className="text-xs">
                      When SME suppliers submit discounting applications, pending items will populate here for lender decisioning.
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">
                      {req.requestId}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num font-semibold text-[#ea580c]">
                      {req.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {req.supplier.name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {req.buyer.name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                      ₹{req.requestedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num">
                      <div className="flex items-center space-x-1 text-[#0a0a0a]">
                        <Clock className="w-3.5 h-3.5 text-[#ea580c]" />
                        <span>{req.remainingTenorDays} days</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold font-mono-num text-[#0a0a0a]">{req.buyer.paymentScore} / 100</span>
                        <RiskBadge risk={req.buyer.riskLevel} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <FinancingStatusBadge status={req.status as any} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link to={`/finance/requests/${req.id}`}>
                        <Button variant="secondary" size="sm" icon={<ChevronRight className="w-3.5 h-3.5" />}>
                          {req.status === 'PENDING' ? 'Review & Underwrite' : 'View Decision'}
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
