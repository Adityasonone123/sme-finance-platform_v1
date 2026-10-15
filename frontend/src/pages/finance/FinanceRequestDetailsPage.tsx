import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUnderwritingDetails,
  approveUnderwriting,
  rejectUnderwriting,
  UnderwritingDetailsData,
  UnderwritingDecisionResult,
} from '../../services/underwritingService';
import { createFinancingOffer } from '../../services/offersService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FinancingStatusBadge, RiskBadge, Badge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Building2,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  TrendingUp,
  AlertTriangle,
  Send,
} from 'lucide-react';

export const FinanceRequestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = useState<UnderwritingDetailsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Decision & Offer Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const [approvedAmountInput, setApprovedAmountInput] = useState<string>('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');

  // Offer Form States
  const [offerAmountInput, setOfferAmountInput] = useState<string>('');
  const [offerRateInput, setOfferRateInput] = useState<string>('12.5');
  const [offerTenureInput, setOfferTenureInput] = useState<string>('60');
  const [offerFeeInput, setOfferFeeInput] = useState<string>('5000');

  const [submitting, setSubmitting] = useState(false);
  const [decisionAudit, setDecisionAudit] = useState<UnderwritingDecisionResult['audit'] | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getUnderwritingDetails(id);
      setDetails(data);
      setApprovedAmountInput(data.request.requestedAmount.toString());
      setOfferAmountInput(data.request.requestedAmount.toString());
      setOfferTenureInput(data.request.tenureDays.toString());
      setOfferFeeInput(Math.round(data.request.requestedAmount * 0.01).toString());
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load underwriting details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const amount = approvedAmountInput ? parseFloat(approvedAmountInput) : undefined;
      const res = await approveUnderwriting(id, amount, notesInput);
      setDecisionAudit(res.audit);
      setSuccessMessage('Underwriting application APPROVED successfully.');
      setShowApproveModal(false);
      await fetchDetails();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to record underwriting approval');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!rejectionReasonInput.trim()) {
      setErrorMessage('Rejection reason is required when declining an underwriting application');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const res = await rejectUnderwriting(id, rejectionReasonInput, notesInput);
      setDecisionAudit(res.audit);
      setSuccessMessage('Underwriting application DECLINED successfully.');
      setShowRejectModal(false);
      await fetchDetails();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to record underwriting rejection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      await createFinancingOffer({
        financingRequestId: id,
        amount: parseFloat(offerAmountInput),
        interestRate: parseFloat(offerRateInput),
        tenureDays: parseInt(offerTenureInput),
        processingFee: parseFloat(offerFeeInput || '0'),
      });
      setSuccessMessage('Financing offer submitted successfully to SME supplier!');
      setShowOfferModal(false);
      await fetchDetails();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit financing offer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-[#737373] font-sans">
        Loading underwriting review details...
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
        <Button variant="secondary" onClick={() => navigate('/finance/requests')}>
          ← Return to Underwriting Queue
        </Button>
      </div>
    );
  }

  if (!details) return null;

  const req = details.request;
  const isPending = req.status === 'PENDING';
  const isApproved = req.status === 'APPROVED';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/finance/requests')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#737373] hover:text-[#0a0a0a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Underwriting Queue</span>
        </button>

        <div className="flex items-center space-x-3">
          <FinancingStatusBadge status={req.status as any} />
          {isPending && (
            <div className="flex items-center space-x-2">
              <Button
                variant="accent"
                size="sm"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => setShowApproveModal(true)}
              >
                Approve Facility
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => setShowRejectModal(true)}
              >
                Decline Application
              </Button>
            </div>
          )}
          {isApproved && (
            <Button
              variant="accent"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              onClick={() => setShowOfferModal(true)}
            >
              Submit Lending Offer
            </Button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#22863a]/10 border border-[#22863a]/30 flex items-center space-x-3 text-xs text-[#22863a] font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center space-x-3 text-xs text-[#d32f2f] font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Underwriting Audit Block if decision recorded */}
      {(!isPending || decisionAudit) && (
        <Card className={`p-6 border-l-4 shadow-popover space-y-3 ${
          req.status === 'APPROVED' ? 'border-l-[#22863a] bg-[#22863a]/5' : 'border-l-[#d32f2f] bg-[#d32f2f]/5'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#0a0a0a] flex items-center space-x-2">
              <ShieldCheck className={`w-5 h-5 ${req.status === 'APPROVED' ? 'text-[#22863a]' : 'text-[#d32f2f]'}`} />
              <span>Underwriting Decision Audit Record ({req.status})</span>
            </h3>
            <span className="text-[10px] font-mono-num text-[#737373]">
              Recorded: {new Date(req.updatedAt).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans pt-2 border-t border-[#e5e5e5]">
            <div>
              <span className="text-[#737373]">Underwriter Role / Officer:</span>
              <p className="font-semibold text-[#0a0a0a] mt-0.5">{decisionAudit?.underwriterName || 'Authorized Officer'}</p>
            </div>
            <div>
              <span className="text-[#737373]">Institution:</span>
              <p className="font-semibold text-[#0a0a0a] mt-0.5">{decisionAudit?.institutionName || 'Financial Institution'}</p>
            </div>
            <div>
              <span className="text-[#737373]">Status Outcome:</span>
              <p className={`font-bold mt-0.5 ${req.status === 'APPROVED' ? 'text-[#22863a]' : 'text-[#d32f2f]'}`}>
                {req.status === 'APPROVED' ? `APPROVED (₹${(req.approvedAmount || req.requestedAmount).toLocaleString('en-IN')})` : 'REJECTED / DECLINED'}
              </p>
            </div>
          </div>

          {decisionAudit?.rejectionReason && (
            <div className="pt-2 text-xs text-[#d32f2f]">
              <strong>Rejection Reason:</strong> {decisionAudit.rejectionReason}
            </div>
          )}

          {decisionAudit?.notes && (
            <div className="text-xs text-[#404040]">
              <strong>Underwriter Notes:</strong> {decisionAudit.notes}
            </div>
          )}
        </Card>
      )}

      {/* 1. Credit Facility Terms Summary */}
      <Card className="p-6 space-y-4 shadow-popover">
        <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5]">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-[#3b82f6]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373]">
              1. Credit Facility & Financing Request Terms
            </h2>
          </div>
          <span className="text-xs font-mono-num font-bold text-[#3b82f6]">{req.requestId}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Invoice Number:</span>
            <p className="text-base font-bold font-mono-num text-[#ea580c] mt-0.5">
              {req.invoiceNumber}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Invoice Gross Amount:</span>
            <p className="text-base font-bold font-mono-num text-[#0a0a0a] mt-0.5">
              ₹{req.invoiceAmount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Requested Discounting Credit:</span>
            <p className="text-base font-bold font-mono-num text-[#22863a] mt-0.5">
              ₹{req.requestedAmount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Tenure & Maturity:</span>
            <p className="text-base font-bold font-mono-num text-[#0a0a0a] mt-0.5">
              {req.tenureDays} Days ({req.remainingTenorDays} left)
            </p>
          </div>
        </div>
      </Card>

      {/* 2. Deterministic Underwriting Checklist */}
      <Card className="p-6 space-y-4 shadow-popover">
        <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373]">
            2. Deterministic Rule-Based Underwriting Checklist
          </h2>
          <span className="text-xs font-semibold text-[#3b82f6]">7 Verified Criteria</span>
        </div>

        <div className="divide-y divide-[#e5e5e5] text-xs font-sans">
          {details.checks.map((chk) => (
            <div key={chk.id} className="py-3 flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  {chk.result === 'PASS' && <CheckCircle2 className="w-4 h-4 text-[#22863a]" />}
                  {chk.result === 'WARNING' && <AlertTriangle className="w-4 h-4 text-[#ea580c]" />}
                  {chk.result === 'FAIL' && <XCircle className="w-4 h-4 text-[#d32f2f]" />}
                </div>
                <div>
                  <h4 className="font-bold text-[#0a0a0a]">{chk.name}</h4>
                  <p className="text-[#737373] mt-0.5">{chk.detail}</p>
                </div>
              </div>

              <Badge
                variant={chk.result === 'PASS' ? 'success' : chk.result === 'WARNING' ? 'warning' : 'danger'}
              >
                {chk.result}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Corporate Buyer Credit Profile (B9) & Payment History */}
      <Card className="p-6 space-y-4 shadow-popover">
        <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5]">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-[#ea580c]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373]">
              3. Corporate Buyer Payment Discipline & History (B9 Engine)
            </h2>
          </div>
          <RiskBadge risk={details.buyer.riskLevel} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-[#0a0a0a]">{details.buyer.name}</h3>
            {details.buyer.gstNumber && <p className="text-[#737373]">GSTIN: <span className="font-mono-num text-[#0a0a0a]">{details.buyer.gstNumber}</span></p>}
            {details.buyer.email && <p className="text-[#737373]">Email: <span className="text-[#0a0a0a]">{details.buyer.email}</span></p>}
            {details.buyer.phone && <p className="text-[#737373]">Phone: <span className="font-mono-num text-[#0a0a0a]">{details.buyer.phone}</span></p>}
          </div>

          <div className="p-4 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#737373]">B9 Buyer Payment Score:</span>
              <span className="text-lg font-bold font-mono-num text-[#3b82f6]">
                {details.buyer.paymentScore} / 100
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#737373]">Invoices Evaluated:</span>
              <span className="font-bold font-mono-num text-[#0a0a0a]">{details.paymentHistory.evaluatedCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#737373]">Paid On Time / Settled:</span>
              <span className="font-bold font-mono-num text-[#22863a]">{details.paymentHistory.paidCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#737373]">Average Settlement Delay:</span>
              <span className="font-bold font-mono-num text-[#d32f2f]">+{details.paymentHistory.avgDelayDays} Days</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. SME Supplier Information */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          4. SME Supplier Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="space-y-1">
            <p className="font-bold text-sm text-[#0a0a0a]">{details.supplier.name}</p>
            {details.supplier.gstNumber && <p className="text-[#737373]">GSTIN: <span className="font-mono-num text-[#0a0a0a]">{details.supplier.gstNumber}</span></p>}
            {details.supplier.email && <p className="text-[#737373]">Email: <span className="text-[#0a0a0a]">{details.supplier.email}</span></p>}
          </div>

          <div className="space-y-1 text-[#737373]">
            {details.supplier.phone && <p>Phone: <span className="font-mono-num text-[#0a0a0a]">{details.supplier.phone}</span></p>}
            {details.supplier.address && <p>Address: <span className="text-[#0a0a0a]">{details.supplier.address}</span></p>}
          </div>
        </div>
      </Card>

      {/* 5. Lender Exposure Analysis */}
      <Card className="p-6 space-y-4 shadow-popover">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#e5e5e5]">
          <TrendingUp className="w-4 h-4 text-[#22863a]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373]">
            5. Lender Corporate Credit Exposure Capacity
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Current Buyer Exposure:</span>
            <p className="text-sm font-bold font-mono-num text-[#0a0a0a] mt-0.5">
              ₹{details.exposure.currentBuyerExposure.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Proposed Facility:</span>
            <p className="text-sm font-bold font-mono-num text-[#ea580c] mt-0.5">
              ₹{details.exposure.proposedFinancing.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Post-Financing Exposure:</span>
            <p className="text-sm font-bold font-mono-num text-[#3b82f6] mt-0.5">
              ₹{details.exposure.exposureAfterFinancing.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Remaining Capacity:</span>
            <p className="text-sm font-bold font-mono-num text-[#22863a] mt-0.5">
              ₹{details.exposure.remainingCreditLimit.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </Card>

      {/* APPROVAL MODAL */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 bg-white shadow-popover">
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">
              Confirm Underwriting Approval
            </h3>
            <p className="text-xs text-[#737373]">
              Are you sure you want to approve this financing request for invoice discounting? This will advance the request to the bidding / offer stage.
            </p>

            <form onSubmit={handleConfirmApproval} className="space-y-4 text-xs font-sans">
              <Input
                label="Approved Credit Amount (₹)"
                type="number"
                value={approvedAmountInput}
                onChange={(e) => setApprovedAmountInput(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#404040] mb-1.5">
                  Underwriter Notes / Assessment
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={3}
                  placeholder="Enter underwriting verification notes..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#e5e5e5] text-xs focus:ring-2 focus:ring-[#3b82f6]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" disabled={submitting}>
                  {submitting ? 'Recording Decision...' : 'Confirm Approval'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* REJECTION MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 bg-white shadow-popover">
            <h3 className="text-base font-bold font-display text-[#d32f2f]">
              Decline Underwriting Application
            </h3>
            <p className="text-xs text-[#737373]">
              Please select a mandatory rejection reason to record in the audit trail.
            </p>

            <form onSubmit={handleConfirmRejection} className="space-y-4 text-xs font-sans">
              <Select
                label="Primary Rejection Reason *"
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                theme="financier"
                required
                options={[
                  { value: '', label: '-- Select Rejection Reason --' },
                  { value: 'Insufficient buyer payment history', label: 'Insufficient buyer payment history' },
                  { value: 'Corporate buyer exposure limit exceeded', label: 'Corporate buyer exposure limit exceeded' },
                  { value: 'Elevated buyer credit risk score', label: 'Elevated buyer credit risk score' },
                  { value: 'Requested financing exceeds maximum eligible cap', label: 'Requested financing exceeds maximum eligible cap' },
                  { value: 'Invoice documentation or validity concern', label: 'Invoice documentation or validity concern' },
                  { value: 'Invoice near expiration or tenor mismatch', label: 'Invoice near expiration or tenor mismatch' },
                  { value: 'Institutional credit policy risk restriction', label: 'Institutional credit policy risk restriction' },
                ]}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#404040] mb-1.5">
                  Detailed Underwriter Comments
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={3}
                  placeholder="Enter detailed reasons for declining facility..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#e5e5e5] text-xs focus:ring-2 focus:ring-[#3b82f6]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" disabled={submitting}>
                  {submitting ? 'Recording Decision...' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* SUBMIT LENDING OFFER MODAL */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 bg-white shadow-popover">
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">
              Submit Institutional Lending Offer
            </h3>
            <p className="text-xs text-[#737373]">
              Define financing terms and yield pricing for this underwritten opportunity. The offer will be submitted to the SME supplier for acceptance.
            </p>

            <form onSubmit={handleConfirmOffer} className="space-y-4 text-xs font-sans">
              <Input
                label="Offered Credit Principal (₹)"
                type="number"
                value={offerAmountInput}
                onChange={(e) => setOfferAmountInput(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Interest Rate (% APR)"
                  type="number"
                  step="0.01"
                  value={offerRateInput}
                  onChange={(e) => setOfferRateInput(e.target.value)}
                  required
                />

                <Input
                  label="Tenure (Days)"
                  type="number"
                  value={offerTenureInput}
                  onChange={(e) => setOfferTenureInput(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Processing Fee (₹)"
                type="number"
                value={offerFeeInput}
                onChange={(e) => setOfferFeeInput(e.target.value)}
              />

              <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] space-y-1 text-xs">
                <div className="flex justify-between text-[#737373]">
                  <span>Estimated Total Repayment:</span>
                  <span className="font-mono-num font-bold text-[#0a0a0a]">
                    ₹{(
                      (parseFloat(offerAmountInput || '0')) +
                      (parseFloat(offerFeeInput || '0')) +
                      Math.round(
                        (parseFloat(offerAmountInput || '0')) *
                          ((parseFloat(offerRateInput || '0')) / 100) *
                          ((parseInt(offerTenureInput || '60')) / 365)
                      )
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setShowOfferModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" disabled={submitting}>
                  {submitting ? 'Submitting Offer...' : 'Submit Offer'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
