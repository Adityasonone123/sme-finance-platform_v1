import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getDisbursementDetails,
  executeDisbursement,
  DetailedDisbursement,
  DisbursementExecuteResult,
} from '../../services/disbursementService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FinancingStatusBadge, Badge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  Landmark,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const FinanceDisbursementDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = useState<DetailedDisbursement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [auditLog, setAuditLog] = useState<DisbursementExecuteResult['audit'] | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getDisbursementDetails(id);
      setDetails(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load disbursement details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleConfirmDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const res = await executeDisbursement(id, notesInput);
      setAuditLog(res.audit);
      setSuccessMessage('Simulated financing disbursement EXECUTED successfully!');
      setShowConfirmModal(false);
      await fetchDetails();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to execute disbursement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-[#737373] font-sans">
        Loading disbursement details...
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
        <Button variant="secondary" onClick={() => navigate('/finance/disbursements')}>
          ← Return to Disbursements Queue
        </Button>
      </div>
    );
  }

  if (!details) return null;

  const isReady = details.status === 'READY';
  const isDisbursed = details.status === 'DISBURSED';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/finance/disbursements')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#737373] hover:text-[#0a0a0a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Disbursements Queue</span>
        </button>

        {isReady ? (
          <Badge variant="info">READY TO FUND</Badge>
        ) : (
          <FinancingStatusBadge status={details.status as any} />
        )}
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
            <span>{details.disbursementId}</span>
            <span>•</span>
            <span>Invoice {details.invoiceNumber}</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            ₹{details.disbursementAmount.toLocaleString('en-IN')}{' '}
            <span className="text-sm font-normal text-[#a3a3a3]">Approved Disbursement Principal</span>
          </h1>
          <p className="text-xs text-[#a3a3a3] mt-1">
            Financier: <strong className="text-white">{details.providerName}</strong> → Supplier: <strong className="text-white">{details.supplier.name}</strong>
          </p>
        </div>

        <div className="text-right sm:border-l sm:border-[#404040] sm:pl-6 space-y-1 text-xs">
          <p className="text-[#a3a3a3]">Execution Mode:</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[#ea580c]">
            {details.disbursementMethod}
          </p>
          <p className="text-[11px] text-[#a3a3a3]">Tenure: {details.tenureDays} Days</p>
        </div>
      </div>

      {/* 1. Disbursement Terms */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          1. Capital Disbursement Facility Summary
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Gross Invoice Amount:</span>
            <p className="text-base font-bold font-mono-num text-[#0a0a0a] mt-0.5">
              ₹{details.invoiceAmount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Disbursement Amount:</span>
            <p className="text-base font-bold font-mono-num text-[#22863a] mt-0.5">
              ₹{details.disbursementAmount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Interest Rate:</span>
            <p className="text-base font-bold font-mono-num text-[#3b82f6] mt-0.5">
              {details.interestRate}% APR
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Tenure:</span>
            <p className="text-base font-bold font-mono-num text-[#0a0a0a] mt-0.5">
              {details.tenureDays} Days
            </p>
          </div>
        </div>
      </Card>

      {/* 2. Supplier Settlement Destination Info */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          2. Supplier Settlement Payout Account
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] space-y-1">
            <span className="text-[#737373]">Account Holder Name:</span>
            <p className="font-bold text-[#0a0a0a]">{details.settlementInfo.accountName}</p>
            <p className="text-[11px] text-[#737373]">GSTIN: {details.settlementInfo.gstNumber}</p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] space-y-1">
            <span className="text-[#737373]">Bank & Account Number:</span>
            <p className="font-bold text-[#0a0a0a]">{details.settlementInfo.bankName}</p>
            <p className="text-[11px] font-mono-num text-[#3b82f6]">
              A/C: {details.settlementInfo.accountNumber} | IFSC: {details.settlementInfo.ifscCode}
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Transaction Execution Panel */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          3. Simulated Capital Disbursement Execution
        </h2>

        <div className="p-4 rounded-xl bg-[#fff7ed] border border-[#ffbb96] flex items-start space-x-3 text-xs text-[#9a3412]">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">SIMULATED / MANUAL DISBURSEMENT NOTICE</p>
            <p className="text-[#7c2d12]">
              Executing disbursement will fund this financing facility in platform system records and update status to DISBURSED. Invoice payment settlement is managed separately in F6.
            </p>
          </div>
        </div>

        {isReady && (
          <div className="pt-2 flex justify-end">
            <Button
              variant="accent"
              icon={<Landmark className="w-4 h-4" />}
              onClick={() => setShowConfirmModal(true)}
            >
              Execute Simulated Disbursement
            </Button>
          </div>
        )}

        {isDisbursed && (
          <div className="p-4 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] space-y-2 text-xs font-sans">
            <div className="flex items-center space-x-2 text-[#22863a] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>DISBURSEMENT COMPLETED & RECORDED</span>
            </div>
            {auditLog && (
              <div className="pt-2 border-t border-[#e5e5e5] space-y-1 text-[#737373]">
                <p>Disbursement Ref ID: <strong className="text-[#0a0a0a] font-mono-num">{auditLog.disbursementId}</strong></p>
                <p>Executed By: <strong className="text-[#0a0a0a]">{auditLog.executedBy} ({auditLog.institutionName})</strong></p>
                <p>Timestamp: <strong className="text-[#0a0a0a] font-mono-num">{new Date(auditLog.timestamp).toLocaleString()}</strong></p>
                <p>Notes: <span className="text-[#0a0a0a]">{auditLog.notes}</span></p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* DISBURSEMENT CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 bg-white shadow-popover">
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">
              Confirm Capital Disbursement
            </h3>
            <p className="text-xs text-[#737373]">
              Are you sure you want to execute a simulated disbursement of ₹{details.disbursementAmount.toLocaleString('en-IN')} to {details.supplier.name}?
            </p>

            <form onSubmit={handleConfirmDisbursement} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#404040] mb-1.5">
                  Execution Notes (Optional)
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={3}
                  placeholder="Enter disbursement reference notes..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#e5e5e5] text-xs focus:ring-2 focus:ring-[#3b82f6]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" disabled={submitting}>
                  {submitting ? 'Executing Disbursement...' : 'Confirm Disbursement'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
