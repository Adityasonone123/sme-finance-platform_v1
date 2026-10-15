import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Invoice } from '../../types/models';
import { getInvoices, ApiInvoice } from '../../services/invoiceService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { InvoiceStatusBadge } from '../../components/ui/Badge';
import { Plus, Search, FileText } from 'lucide-react';

export const InvoiceListPage: React.FC = () => {
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  const loadRealInvoices = async () => {
    try {
      const dbInvoices = await getInvoices();
      if (Array.isArray(dbInvoices)) {
        const mappedInvoices: Invoice[] = dbInvoices.map((dbInv: ApiInvoice) => {
          const rawAmount = typeof dbInv.amount === 'string' ? parseFloat(dbInv.amount) : dbInv.amount;
          return {
            id: dbInv.id,
            invoiceNumber: dbInv.invoiceNumber,
            buyerId: dbInv.buyerId,
            buyerName: dbInv.buyer?.name || 'Corporate Buyer',
            supplierName: dbInv.supplier?.name || 'SME Supplier',
            amount: rawAmount,
            amountPaid: 0,
            remainingAmount: rawAmount,
            issueDate: new Date(dbInv.issueDate).toISOString().split('T')[0],
            dueDate: new Date(dbInv.dueDate).toISOString().split('T')[0],
            paymentTermsDays: dbInv.paymentTerms || 30,
            status: dbInv.status,
            description: 'Registered verified B5 invoice',
            documentName: dbInv.documentUrl ? dbInv.documentUrl.split('/').pop() || 'invoice.pdf' : undefined,
            documentUrl: dbInv.documentUrl ? `http://localhost:5000${dbInv.documentUrl}` : undefined,
            createdAt: dbInv.createdAt,
            historyTimeline: [],
          };
        });
        setInvoicesList(mappedInvoices);
      } else {
        setInvoicesList([]);
      }
    } catch {
      setInvoicesList([]);
    }
  };

  useEffect(() => {
    loadRealInvoices();
  }, []);

  const filteredInvoices = invoicesList.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Invoices Directory</h1>
          <p className="text-xs text-[#737373] mt-1">Manage receivables, issue verified invoices, and track payment status</p>
        </div>

        <Button variant="accent" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/invoices/new')}>
          Issue New Invoice
        </Button>
      </div>

      <Card className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input
            placeholder="Search by invoice number or buyer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          theme="supplier"
          options={[
            { value: 'ALL', label: 'All Statuses' },
            { value: 'PENDING', label: 'Pending Approval' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' },
            { value: 'PAID', label: 'Paid' },
            { value: 'OVERDUE', label: 'Overdue' },
          ]}
        />
      </Card>

      <Card className="p-0 overflow-hidden shadow-popover">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Invoice Number</th>
                <th className="py-3.5 px-4">Corporate Buyer</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                  <td className="py-4 px-4 font-bold font-mono-num text-[#0a0a0a]">
                    <Link to={`/invoices/${inv.id}`} className="hover:text-[#ea580c]">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-4 px-4 font-medium text-[#0a0a0a]">{inv.buyerName}</td>
                  <td className="py-4 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                    ₹{inv.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 px-4 text-[#737373] font-mono-num">{inv.issueDate}</td>
                  <td className="py-4 px-4 text-[#737373] font-mono-num">{inv.dueDate}</td>
                  <td className="py-4 px-4">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    {inv.documentUrl ? (
                      <a
                        href={inv.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-[#ea580c] hover:underline font-semibold"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View</span>
                      </a>
                    ) : (
                      <span className="text-[#a3a3a3]">—</span>
                    )}
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
