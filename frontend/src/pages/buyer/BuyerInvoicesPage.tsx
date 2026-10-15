import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Invoice } from '../../types/models';
import { getInvoices, approveInvoice, rejectInvoice, ApiInvoice } from '../../services/invoiceService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InvoiceStatusBadge } from '../../components/ui/Badge';
import { Eye, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export const BuyerInvoicesPage: React.FC = () => {
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRealInvoices = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealInvoices();
  }, []);

  const handleApprove = async (id: string) => {
    setErrorMessage(null);
    try {
      await approveInvoice(id);
      setSuccessMessage('Invoice approved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      loadRealInvoices();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to approve invoice');
    }
  };

  const handleReject = async (id: string) => {
    setErrorMessage(null);
    try {
      await rejectInvoice(id);
      setSuccessMessage('Invoice rejected');
      setTimeout(() => setSuccessMessage(null), 3000);
      loadRealInvoices();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to reject invoice');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Invoices Received from Suppliers</h1>
        <p className="text-xs text-[#737373] mt-1">Verify line items, confirm delivery, and approve payment release</p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#22863a]/10 border border-[#22863a]/30 flex items-center space-x-3 text-xs text-[#22863a] font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center space-x-3 text-xs text-[#d32f2f] font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card className="p-0 overflow-hidden shadow-popover">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Invoice ID</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#737373]">
                    Loading received invoices...
                  </td>
                </tr>
              ) : invoicesList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#737373]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-[#a3a3a3]" />
                      <p className="font-semibold text-sm text-[#0a0a0a]">No invoices received yet</p>
                      <p className="text-xs text-[#737373]">Supplier invoices will appear here once issued to your company.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoicesList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-4 px-4 font-bold font-mono-num text-[#0a0a0a]">{inv.invoiceNumber}</td>
                    <td className="py-4 px-4 font-semibold text-[#0a0a0a]">{inv.supplierName}</td>
                    <td className="py-4 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                      ₹{inv.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-[#737373] font-mono-num">{inv.issueDate}</td>
                    <td className="py-4 px-4 text-[#737373] font-mono-num">{inv.dueDate}</td>
                    <td className="py-4 px-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link to={`/buyer/invoices/${inv.id}`} className="p-1 text-[#737373] hover:text-[#0a0a0a]">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {inv.status === 'PENDING' && (
                          <>
                            <Button variant="accent" size="sm" onClick={() => handleApprove(inv.id)}>
                              Approve
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleReject(inv.id)}>
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
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
