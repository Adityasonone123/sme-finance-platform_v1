import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getRepaymentDetails,
  recordRepayment,
  DetailedRepayment,
  RecordRepaymentResult,
} from '../../services/repaymentService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const FinanceRepaymentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = useState<DetailedRepayment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [auditLog, setAuditLog] = useState<RecordRepaymentResult['audit'] | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getRepaymentDetails(id);
      setDetails(data);
      setAmountInput(data.outstandingBalance.toString());
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load repayment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleConfirmRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const res = await recordRepayment(id, parseFloat(amountInput), notesInput);
      setAuditLog(res.audit);
      setSuccessMessage('Simulated financing repayment RECORDED & SETTLED successfully!');
      setShowConfirmModal(false);
      await fetchDetails();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to record repayment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-[#737373] font-sans">
        Loading repayment details...
      </div>
    );
  }

  if (errorMessage && !details) {
    return (
      <div className="max-w-4xl mx-auto py-12 font-sans space-y-4 text-center">
        <div className="p-4 rounded-xl bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center justify-center space-x-2 text-xs text-[#d32f2f]">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage}</span>
        </div>
        <Button variant="secondary" onClick={() => navigate('/finance/repayments')}>
          ← Return to Repayments Queue
        </Button>
      </div>
    );
  }

  if (!details) return null;

  const isRepaid = details.status === 'REPAID';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/finance/repayments')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#737373] hover:text-[#0a0a0a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Repayments Queue</span>
        </button>

        <Badge
          variant={
            details.status === 'REPAID'
              ? 'success'
              : details.status === 'OVERDUE'
              ? 'danger'
              : details.status === 'PARTIALLY_REPAID'
              ? 'warning'
              : 'info'
          }
        >
          {details.status}
        </Badge>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-[#22863a]/10 border border-[#22863a]/30 flex items-center space-x-2 text-xs text-[#22863a]">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center space-x-2 text-xs text-[#d32f2f]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-[#171717] text-white shadow-popover">
        <div>
          <div className="flex items-center space-x-2 text-[#3b82f6] text-xs font-bold font-mono-num">
            <span>{details.financingId}</span>
            <span>•</span>
            <span>Invoice {details.invoiceNumber}</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            ₹{details.outstandingBalance.toLocaleString('en-IN')}{' '}
            <span className="text-sm font-normal text-[#a3a3a3]">Outstanding Balance</span>
          </h1>
          <p className="text-xs text-[#a3a3a3] mt-1">
            Corporate Buyer: <strong className="text-white">{details.buyer.name}</strong> → Supplier: <strong className="text-white">{details.supplier.name}</strong>
          </p>
        </div>

        <div className="text-right sm:border-l sm:border-[#404040] sm:pl-6 space-y-1 text-xs">
          <p className="text-[#a3a3a3]">Due Date:</p>
          <p className="text-sm font-bold font-mono-num text-[#ea580c]">
            {new Date(details.dueDate).toLocaleDateString()}
          </p>
          {details.isOverdue && (
            <p className="text-[11px] font-bold text-[#d32f2f]">
              {details.daysOverdue} Days Overdue
            </p>
          )}
        </div>
      </div>

      {/* 1. Financing & Repayment Summary */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          1. Financing & Repayment Balance Breakdown
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Disbursed Principal:</span>
            <p className="text-base font-bold font-mono-num text-[#0a0a0a] mt-0.5">
              ₹{details.disbursedAmount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Total Repayment Due:</span>
            <p className="text-base font-bold font-mono-num text-[#3b82f6] mt-0.5">
              ₹{details.totalRepaymentDue.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Amount Repaid:</span>
            <p className="text-base font-bold font-mono-num text-[#22863a] mt-0.5">
              ₹{details.amountRepaid.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Outstanding Balance:</span>
            <p className="text-base font-bold font-mono-num text-[#ea580c] mt-0.5">
              ₹{details.outstandingBalance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </Card>

      {/* 2. Repayment Schedule Table */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          2. Repayment Schedule & Terms
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Principal</th>
                <th className="py-2.5 px-3 text-right">Interest</th>
                <th className="py-2.5 px-3 text-right">Fees</th>
                <th className="py-2.5 px-3 text-right">Total Due</th>
                <th className="py-2.5 px-3 text-right">Paid</th>
                <th className="py-2.5 px-3 text-right">Outstanding</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {details.schedule.map((item) => (
                <tr key={item.installmentNumber}>
                  <td className="py-3 px-3 font-mono-num font-bold">{item.installmentNumber}</td>
                  <td className="py-3 px-3 font-mono-num">{new Date(item.dueDate).toLocaleDateString()}</td>
                  <td className="py-3 px-3 text-right font-mono-num">₹{item.principal.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right font-mono-num">₹{item.interest.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right font-mono-num">₹{item.fees.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right font-mono-num font-bold text-[#0a0a0a]">₹{item.totalDue.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right font-mono-num text-[#22863a]">₹{item.paidAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right font-mono-num text-[#ea580c]">₹{item.outstanding.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3">
                    <Badge variant={item.status === 'PAID' ? 'success' : item.status === 'OVERDUE' ? 'danger' : 'info'}>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. Transaction Execution Panel */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          3. Simulated Repayment Recording & Settlement
        </h2>

        <div className="p-4 rounded-xl bg-[#fff7ed] border border-[#ffbb96] flex items-start space-x-3 text-xs text-[#9a3412]">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">SIMULATED / MANUAL REPAYMENT NOTICE</p>
            <p className="text-[#7c2d12]">
              Recording repayment will update platform system balance and transition the financing transaction status to REPAID upon full settlement.
            </p>
          </div>
        </div>

        {!isRepaid && (
          <div className="pt-2 flex justify-end">
            <Button
              variant="accent"
              icon={<DollarSign className="w-4 h-4" />}
              onClick={() => setShowConfirmModal(true)}
            >
              Record Repayment Settlement
            </Button>
          </div>
        )}

        {isRepaid && (
          <div className="p-4 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] space-y-2 text-xs font-sans">
            <div className="flex items-center space-x-2 text-[#22863a] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>FACILITY FULLY REPAID & SETTLED</span>
            </div>
            {auditLog && (
              <div className="pt-2 border-t border-[#e5e5e5] space-y-1 text-[#737373]">
                <p>Repayment Ref ID: <strong className="text-[#0a0a0a] font-mono-num">{auditLog.repaymentId}</strong></p>
                <p>Recorded By: <strong className="text-[#0a0a0a]">{auditLog.recordedBy} ({auditLog.institutionName})</strong></p>
                <p>Timestamp: <strong className="text-[#0a0a0a] font-mono-num">{new Date(auditLog.timestamp).toLocaleString()}</strong></p>
                <p>Notes: <span className="text-[#0a0a0a]">{auditLog.notes}</span></p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* REPAYMENT CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 bg-white shadow-popover">
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">
              Record Simulated Repayment
            </h3>
            <p className="text-xs text-[#737373]">
              Confirm recording repayment for invoice {details.invoiceNumber}.
            </p>

            <form onSubmit={handleConfirmRepayment} className="space-y-4 text-xs font-sans">
              <Input
                label="Repayment Amount (₹)"
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#404040] mb-1.5">
                  Repayment Notes (Optional)
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={3}
                  placeholder="Enter repayment reference notes..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#e5e5e5] text-xs focus:ring-2 focus:ring-[#3b82f6]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" disabled={submitting}>
                  {submitting ? 'Recording Repayment...' : 'Confirm Repayment'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
