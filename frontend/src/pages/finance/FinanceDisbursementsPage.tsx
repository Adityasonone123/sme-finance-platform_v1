import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getDisbursementQueue,
  DisbursementQueueItem,
} from '../../services/disbursementService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { FinancingStatusBadge, Badge } from '../../components/ui/Badge';
import { Search, Landmark, ChevronRight, ShieldCheck, Filter } from 'lucide-react';

export const FinanceDisbursementsPage: React.FC = () => {
  const [disbursements, setDisbursements] = useState<DisbursementQueueItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDisbursements = async () => {
    try {
      setLoading(true);
      const res = await getDisbursementQueue({
        q: searchQuery,
        status: statusFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 10,
      });

      setDisbursements(res.disbursements);
      setPagination(res.pagination);
    } catch {
      setDisbursements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisbursements();
  }, [searchQuery, statusFilter, sortBy, sortOrder, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDisbursements();
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
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Financing Disbursements Queue</h1>
        <p className="text-xs text-[#737373] mt-1">
          Review underwritten financing facilities ready for funding and execute simulated platform disbursements
        </p>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 shadow-popover space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by disbursement #, offer #, invoice #, supplier, or buyer..."
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
              { value: 'READY', label: 'Status: Ready for Disbursement' },
              { value: 'DISBURSED', label: 'Status: Disbursed / Active' },
              { value: 'REPAID', label: 'Status: Repaid / Settled' },
            ]}
          />

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            theme="financier"
            options={[
              { value: 'createdAt', label: 'Sort: Date Created' },
              { value: 'amount', label: 'Sort: Disbursement Amount' },
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

      {/* Disbursements List Table */}
      <Card className="p-0 overflow-hidden shadow-popover">
        <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between bg-[#f5f5f5]">
          <div className="flex items-center space-x-2">
            <Landmark className="w-4 h-4 text-[#3b82f6]" />
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">Capital Disbursement Transactions</h3>
          </div>
          <span className="text-xs font-bold font-mono-num text-[#737373]">
            Showing {disbursements.length} of {pagination.total} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5]/50 border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Disbursement ID</th>
                <th className="py-3 px-4">Offer ID</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">SME Supplier</th>
                <th className="py-3 px-4">Corporate Buyer</th>
                <th className="py-3 px-4 text-right">Disbursement Amount</th>
                <th className="py-3 px-4">Execution Mode</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#737373]">
                    Loading disbursements queue...
                  </td>
                </tr>
              ) : disbursements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#737373] space-y-2">
                    <ShieldCheck className="w-8 h-8 text-[#a3a3a3] mx-auto" />
                    <p className="font-semibold text-sm text-[#0a0a0a]">No financing transactions are ready for disbursement.</p>
                    <p className="text-xs">
                      When underwritten financing offers are accepted by suppliers, funding transactions will populate here.
                    </p>
                  </td>
                </tr>
              ) : (
                disbursements.map((d) => (
                  <tr key={d.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">
                      {d.disbursementId}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num font-semibold text-[#3b82f6]">
                      {d.offerId}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num font-semibold text-[#ea580c]">
                      {d.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {d.supplier.name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0a0a0a]">
                      {d.buyer.name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#22863a]">
                      ₹{d.disbursementAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">
                        {d.disbursementMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {d.status === 'READY' ? (
                        <Badge variant="info">READY TO FUND</Badge>
                      ) : (
                        <FinancingStatusBadge status={d.status as any} />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link to={`/finance/disbursements/${d.id}`}>
                        <Button variant="secondary" size="sm" icon={<ChevronRight className="w-3.5 h-3.5" />}>
                          {d.status === 'READY' ? 'Fund Disbursement' : 'View Audit'}
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
