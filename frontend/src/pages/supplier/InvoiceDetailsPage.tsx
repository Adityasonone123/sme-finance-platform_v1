import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDemoData } from '../../context/DemoDataContext';
import { Invoice } from '../../types/models';
import { getInvoiceById, updateInvoice, deleteInvoice, uploadInvoiceDocument } from '../../services/invoiceService';
import { getPayments, ApiPayment } from '../../services/paymentService';

import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { InvoiceStatusBadge } from '../../components/ui/Badge';
import { ArrowLeft, FileText, UploadCloud, Trash2, Edit3, CheckCircle2, AlertCircle, X } from 'lucide-react';

export const InvoiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { invoices: demoInvoices } = useDemoData();
  const navigate = useNavigate();

  const demoInvoice = demoInvoices.find((i) => i.id === id);
  const [invoice, setInvoice] = useState<Invoice | null>(demoInvoice || null);
  const [paymentsHistory, setPaymentsHistory] = useState<ApiPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit & Upload State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editAmount, setEditAmount] = useState(invoice?.amount.toString() || '');
  const [editIssueDate, setEditIssueDate] = useState(invoice?.issueDate || '');
  const [editDueDate, setEditDueDate] = useState(invoice?.dueDate || '');
  const [editTerms, setEditTerms] = useState(invoice?.paymentTermsDays.toString() || '30');

  const fetchInvoiceData = async () => {
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
        setInvoice(mappedInvoice);
        setPaymentsHistory(invPayments);
        setEditAmount(mappedInvoice.amount.toString());
        setEditIssueDate(mappedInvoice.issueDate);
        setEditDueDate(mappedInvoice.dueDate);
        setEditTerms(mappedInvoice.paymentTermsDays.toString());
      }
    } catch {
      // Fallback to demo invoice
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !invoice) return;
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const updated = await updateInvoice(id, {
        amount: parseFloat(editAmount) || invoice.amount,
        issueDate: editIssueDate,
        dueDate: editDueDate,
        paymentTerms: parseInt(editTerms, 10) || 30,
      });

      const rawAmount = typeof updated.amount === 'string' ? parseFloat(updated.amount) : updated.amount;
      setInvoice({
        ...invoice,
        amount: rawAmount,
        remainingAmount: rawAmount - invoice.amountPaid,
        issueDate: new Date(updated.issueDate).toISOString().split('T')[0],
        dueDate: new Date(updated.dueDate).toISOString().split('T')[0],
        paymentTermsDays: updated.paymentTerms || 30,
      });

      setIsEditModalOpen(false);
      setSuccessMessage('Invoice updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to update invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this invoice?')) return;
    setErrorMessage(null);

    try {
      await deleteInvoice(id);
      navigate('/invoices');
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to delete invoice');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    setErrorMessage(null);

    try {
      const updated = await uploadInvoiceDocument(id, file);
      if (invoice && updated.documentUrl) {
        setInvoice({
          ...invoice,
          documentName: file.name,
          documentUrl: `http://localhost:5000${updated.documentUrl}`,
        });
        setSuccessMessage('Invoice document uploaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (loading && !invoice) {
    return <div className="text-center py-20 font-sans text-xs text-[#737373]">Loading invoice details...</div>;
  }

  if (!invoice) {
    return (
      <div className="text-center py-20 font-sans">
        <h2 className="text-lg font-bold font-display text-[#0a0a0a]">Invoice Not Found</h2>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">{invoice.invoiceNumber}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-[#737373] mt-0.5">Issued to: <strong>{invoice.buyerName}</strong></p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {invoice.status === 'PENDING' && (
            <>
              <Button
                variant="secondary"
                icon={<Edit3 className="w-4 h-4" />}
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Details
              </Button>
              <Button
                variant="secondary"
                className="text-[#d32f2f] hover:bg-[#d32f2f]/10"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </>
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Invoice Total</p>
          <p className="text-2xl font-bold font-mono-num text-[#0a0a0a] mt-1">₹{invoice.amount.toLocaleString('en-IN')}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#22863a]">Total Received</p>
          <p className="text-2xl font-bold font-mono-num text-[#22863a] mt-1">₹{invoice.amountPaid.toLocaleString('en-IN')}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#ea580c]">Remaining Balance</p>
          <p className="text-2xl font-bold font-mono-num text-[#ea580c] mt-1">₹{invoice.remainingAmount.toLocaleString('en-IN')}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">Due Date</p>
          <p className="text-xl font-bold font-mono-num text-[#0a0a0a] mt-1">{invoice.dueDate}</p>
        </Card>
      </div>

      {/* Supporting Document Section */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h3 className="text-base font-bold font-display text-[#0a0a0a] border-b border-[#e5e5e5] pb-3">
          Supporting PDF / Image Attachment
        </h3>

        {invoice.documentUrl ? (
          <div className="p-4 bg-[#f5f5f5] rounded-xl border border-[#e5e5e5] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-[#ea580c]" />
              <div>
                <p className="font-bold text-xs text-[#0a0a0a]">{invoice.documentName || 'Invoice Attachment'}</p>
                <p className="text-[11px] text-[#737373]">Uploaded & verified in database</p>
              </div>
            </div>
            <a
              href={invoice.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-[#ea580c] text-white text-xs font-semibold rounded-lg hover:bg-[#ea580c]/90"
            >
              View Document
            </a>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#d4d4d4] rounded-xl p-6 text-center bg-[#f5f5f5]/50 relative">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <UploadCloud className="w-8 h-8 text-[#ea580c] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#0a0a0a]">
              {uploading ? 'Uploading invoice document...' : 'Click to attach PDF / PNG document'}
            </p>
            <p className="text-[11px] text-[#737373] mt-0.5">Supports PDF, PNG, JPG up to 5MB</p>
          </div>
        )}
      </Card>

      {/* Payment Settlement History */}
      {paymentsHistory.length > 0 && (
        <Card className="p-0 overflow-hidden shadow-popover">
          <div className="px-6 py-4 border-b border-[#e5e5e5]">
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">Settlements Received History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Received Amount</th>
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

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-[#737373] hover:text-[#0a0a0a]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-[#0a0a0a] mb-4">Edit Invoice Details</h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                label="Invoice Amount (₹)"
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
              />

              <Input
                label="Issue Date"
                type="date"
                value={editIssueDate}
                onChange={(e) => setEditIssueDate(e.target.value)}
                required
              />

              <Input
                label="Due Date"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                required
              />

              <Input
                label="Payment Terms (Days)"
                type="number"
                value={editTerms}
                onChange={(e) => setEditTerms(e.target.value)}
                required
              />

              <div className="pt-4 flex justify-end space-x-3 border-t border-[#e5e5e5]">
                <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} type="button">
                  Cancel
                </Button>
                <Button variant="accent" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
