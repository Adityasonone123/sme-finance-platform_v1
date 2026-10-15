import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDemoData } from '../../context/DemoDataContext';
import { Invoice } from '../../types/models';
import { getInvoiceById, approveInvoice, rejectInvoice } from '../../services/invoiceService';
import { recordPayment, getPayments, ApiPayment } from '../../services/paymentService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { InvoiceStatusBadge } from '../../components/ui/Badge';
import { ArrowLeft, CheckCircle2, XCircle, FileText, AlertCircle, DollarSign, X } from 'lucide-react';

export const BuyerInvoiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { invoices: demoInvoices } = useDemoData();
  const navigate = useNavigate();

  const demoInv = demoInvoices.find((i) => i.id === id);
  const [inv, setInv] = useState<Invoice | null>(demoInv || null);
  const [paymentsHistory, setPaymentsHistory] = useState<ApiPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CREDIT_CARD' | 'OTHER'>('BANK_TRANSFER');
  const [refNumber, setRefNumber] = useState('');

  const fetchInvoiceAndPayments = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [dbInv, allPayments] = await Promise.all([getInvoiceById(id), getPayments()]);
      if (dbInv) {
        const rawAmount = typeof dbInv.amount === 'string' ? parseFloat(dbInv.amount) : dbInv.amount;
        const invPayments = allPayments.filter((p) => p.invoiceId === id);
        const totalPaid = invPayments.reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0);
        const remAmount = Math.max(0, rawAmount - totalPaid);

        const mappedInvoice: Invoice = {
          id: dbInv.id,
          invoiceNumber: dbInv.invoiceNumber,
          buyerId: dbInv.buyerId,
          buyerName: dbInv.buyer?.name || 'Corporate Buyer',
          supplierName: dbInv.supplier?.name || 'SME Supplier',
          amount: rawAmount,
          amountPaid: totalPaid,
          remainingAmount: remAmount,
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
        setInv(mappedInvoice);
        setPaymentsHistory(invPayments);
        setPayAmount(remAmount.toString());
      }
    } catch {
      // Fallback to demo invoice
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceAndPayments();
  }, [id]);

  const handleApprove = async () => {
    if (!id || !inv) return;
    setErrorMessage(null);
    try {
      const updated = await approveInvoice(id);
      setInv({ ...inv, status: updated.status });
      setSuccessMessage('Invoice approved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to approve invoice');
    }
  };

  const handleReject = async () => {
    if (!id || !inv) return;
    setErrorMessage(null);
    try {
      const updated = await rejectInvoice(id);
      setInv({ ...inv, status: updated.status });
      setSuccessMessage('Invoice rejected');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to reject invoice');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inv) return;
    setErrorMessage(null);
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMessage('Payment amount must be greater than zero');
      return;
    }
    if (amountVal > inv.remainingAmount + 0.01) {
      setErrorMessage(`Payment amount exceeds remaining invoice balance (₹${inv.remainingAmount.toLocaleString('en-IN')})`);
      return;
    }

    setSubmittingPayment(true);

    try {
      await recordPayment({
        invoiceId: id,
        amount: amountVal,
        paymentDate: payDate,
        paymentMethod: payMethod,
        referenceNumber: refNumber || `UTR-${Date.now()}`,
      });

      setIsPaymentModalOpen(false);
      setSuccessMessage('Payment successfully recorded in ledger!');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchInvoiceAndPayments();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading && !inv) {
    return <div className="text-center py-20 font-sans text-xs text-[#737373]">Loading invoice details...</div>;
  }

  if (!inv) {
    return (
      <div className="text-center py-20 font-sans">
        <h2 className="text-lg font-bold font-display text-[#0a0a0a]">Invoice Not Found</h2>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/buyer/invoices')}>
          Back to Received Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/buyer/invoices')}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold font-display font-mono-num text-[#0a0a0a]">{inv.invoiceNumber}</h1>
              <InvoiceStatusBadge status={inv.status} />
            </div>
            <p className="text-xs text-[#737373]">Submitted by {inv.supplierName}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {inv.status === 'PENDING' && (
            <>
              <Button variant="accent" size="sm" icon={<CheckCircle2 className="w-4 h-4" />} onClick={handleApprove}>
                Approve Invoice
              </Button>
              <Button variant="danger" size="sm" icon={<XCircle className="w-4 h-4" />} onClick={handleReject}>
                Reject
              </Button>
            </>
          )}

          {(inv.status === 'APPROVED' || inv.status === 'PARTIALLY_PAID') && (
            <Button
              variant="accent"
              icon={<DollarSign className="w-4 h-4" />}
              onClick={() => {
                setPayAmount(inv.remainingAmount.toString());
                setIsPaymentModalOpen(true);
              }}
            >
              Record Settlement Payment
            </Button>
          )}
        </div>
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

      {/* KPI Financial Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Total Invoice Amount</p>
          <p className="text-2xl font-bold font-mono-num text-[#0a0a0a] mt-1">₹{inv.amount.toLocaleString('en-IN')}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#22863a]">Total Paid</p>
          <p className="text-2xl font-bold font-mono-num text-[#22863a] mt-1">₹{inv.amountPaid.toLocaleString('en-IN')}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#ea580c]">Remaining Balance</p>
          <p className="text-2xl font-bold font-mono-num text-[#ea580c] mt-1">₹{inv.remainingAmount.toLocaleString('en-IN')}</p>
        </Card>
      </div>

      <Card className="space-y-4 shadow-popover">
        <div className="p-4 bg-[#f5f5f5] rounded-xl border border-[#e5e5e5] text-xs">
          <p className="font-semibold text-[#0a0a0a]">Goods / Services Description:</p>
          <p className="text-[#404040] mt-1">{inv.description}</p>
        </div>

        {inv.documentUrl && (
          <div className="pt-4 border-t border-[#e5e5e5] flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <FileText className="w-4 h-4 text-[#ea580c]" />
              <span className="font-semibold">{inv.documentName || 'Supporting Document'}</span>
            </div>
            <a
              href={inv.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-[#ea580c] hover:underline"
            >
              View Document
            </a>
          </div>
        )}
      </Card>

      {/* Payment Settlement History */}
      {paymentsHistory.length > 0 && (
        <Card className="p-0 overflow-hidden shadow-popover">
          <div className="px-6 py-4 border-b border-[#e5e5e5]">
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">Payment Settlement History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Settled Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference UTR</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {paymentsHistory.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono-num">{new Date(p.paymentDate).toISOString().split('T')[0]}</td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#22863a]">
                      ₹{(typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">{p.paymentMethod}</td>
                    <td className="py-3.5 px-4 font-mono-num text-[#737373]">{p.referenceNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-[#22863a]">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-[#737373] hover:text-[#0a0a0a]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-[#0a0a0a] mb-2">Record Settlement Payment</h3>
            <p className="text-xs text-[#737373] mb-4">Disburse payment to supplier for invoice #{inv.invoiceNumber}</p>

            <div className="p-3 bg-[#f5f5f5] rounded-xl border border-[#e5e5e5] mb-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#737373]">Invoice Total:</span>
                <span className="font-mono-num font-semibold">₹{inv.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Already Paid:</span>
                <span className="font-mono-num font-semibold text-[#22863a]">₹{inv.amountPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-[#e5e5e5] pt-1">
                <span className="font-bold text-[#0a0a0a]">Remaining Balance:</span>
                <span className="font-mono-num font-bold text-[#ea580c]">₹{inv.remainingAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <Input
                label="Payment Amount (₹)"
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />

              <Input
                label="Payment Date"
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                required
              />

              <Select
                label="Payment Method"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                theme="buyer"
                options={[
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT / RTGS)' },
                  { value: 'UPI', label: 'UPI Instant Payment' },
                  { value: 'CHEQUE', label: 'Cheque Settlement' },
                  { value: 'CREDIT_CARD', label: 'Corporate Credit Card' },
                  { value: 'OTHER', label: 'Other Settlement' },
                ]}
              />

              <Input
                label="Bank Reference / UTR Number"
                placeholder="e.g. UTR123456789"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
              />

              <div className="pt-4 flex justify-end space-x-3 border-t border-[#e5e5e5]">
                <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)} type="button">
                  Cancel
                </Button>
                <Button variant="accent" type="submit" disabled={submittingPayment}>
                  {submittingPayment ? 'Processing...' : 'Submit Payment Settlement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
