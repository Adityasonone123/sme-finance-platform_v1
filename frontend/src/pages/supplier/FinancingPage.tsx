import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDemoData } from '../../context/DemoDataContext';
import {
  checkInvoiceEligibility,
  createFinancingRequest,
  getFinancingRequests,
  ApiFinancingEligibility,
  ApiFinancingRequest,
} from '../../services/financingService';
import { getInvoices, ApiInvoice } from '../../services/invoiceService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { FinancingStatusBadge, RiskBadge } from '../../components/ui/Badge';
import { Landmark, Sparkles, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export const FinancingPage: React.FC = () => {
  const { financingOffers: demoOffers } = useDemoData();
  const [searchParams] = useSearchParams();

  const preselectedInvoiceId = searchParams.get('invoice');
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [realRequests, setRealRequests] = useState<ApiFinancingRequest[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(preselectedInvoiceId || '');
  const [eligibility, setEligibility] = useState<ApiFinancingEligibility | null>(null);

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedLender, setSelectedLender] = useState<string>('KredX Working Capital Trust');
  const [requestedAmount, setRequestedAmount] = useState('250000');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [invList, reqList] = await Promise.all([getInvoices(), getFinancingRequests()]);
      setInvoices(invList);
      setRealRequests(reqList);
      if (!selectedInvoiceId && invList.length > 0) {
        setSelectedInvoiceId(invList[0].id);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchEligibility = async () => {
      if (!selectedInvoiceId) return;
      const el = await checkInvoiceEligibility(selectedInvoiceId);
      setEligibility(el);
      if (el) {
        setRequestedAmount(el.maxEligibleAmount.toString());
      }
    };
    fetchEligibility();
  }, [selectedInvoiceId]);

  const targetInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!targetInvoice) return;

    const amt = parseFloat(requestedAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid requested amount greater than zero');
      return;
    }

    setSubmitting(true);

    try {
      const newReq = await createFinancingRequest({
        invoiceId: targetInvoice.id,
        requestedAmount: amt,
      });

      setApplyModalOpen(false);
      setSuccessMessage(`Financing application ${newReq.id.slice(0, 8)} submitted successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to submit financing application');
    } finally {
      setSubmitting(false);
    }
  };

  const eligibleInvoices = invoices.filter((i) => i.status === 'APPROVED' || i.status === 'PARTIALLY_PAID');

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Invoice Financing & Liquidity Marketplace</h1>
        <p className="text-xs text-[#737373] mt-1">Unlock working capital discounting lines against verified corporate buyer invoices</p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#22863a]/10 border border-[#22863a]/30 flex items-center space-x-3 text-xs text-[#22863a] font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Recommended Financing Header Card */}
      <div className="p-6 rounded-2xl bg-white border border-[#e5e5e5] shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[#ea580c]">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Working Capital Recommendation</span>
            </div>
            <h2 className="text-xl font-bold font-display text-[#0a0a0a]">
              Maximum Eligible Financing Line:{' '}
              <span className="font-mono-num text-[#ea580c]">
                ₹{(eligibility?.maxEligibleAmount ?? 240000).toLocaleString('en-IN')}
              </span>
            </h2>
            <p className="text-xs text-[#737373]">
              Enforces a strict 80% maximum financing cap on remaining unpaid invoice balances.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] text-xs space-y-1">
            <div className="flex justify-between space-x-6">
              <span className="text-[#737373]">Eligible Invoices Pool:</span>
              <span className="font-mono-num font-bold text-[#0a0a0a]">{eligibleInvoices.length} Invoices</span>
            </div>
            <div className="flex justify-between space-x-6">
              <span className="text-[#737373]">Financing Limit Cap:</span>
              <span className="font-mono-num font-bold text-[#22863a]">80% of Balance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Eligible Invoice Selector */}
      <Card>
        <h3 className="text-base font-bold font-display text-[#0a0a0a] mb-4">Select Target Invoice for Discounting</h3>
        <Select
          label="Choose Invoice"
          value={selectedInvoiceId}
          onChange={(e) => setSelectedInvoiceId(e.target.value)}
          theme="supplier"
          options={invoices.map((i) => ({
            value: i.id,
            label: `${i.invoiceNumber} — ${i.buyer?.name || 'Corporate Buyer'} (Amount: ₹${parseFloat(i.amount.toString()).toLocaleString('en-IN')})`,
          }))}
        />

        {eligibility && (
          <div className="mt-4 p-4 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[#737373]">Buyer Name:</span>
                <p className="font-bold text-[#0a0a0a] mt-0.5">{eligibility.buyerName}</p>
              </div>
              <div>
                <span className="text-[#737373]">Buyer Payment Score:</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="font-bold font-mono-num text-[#0a0a0a]">{eligibility.buyerScore} / 100</span>
                  <RiskBadge risk={eligibility.riskLevel} />
                </div>
              </div>
              <div>
                <span className="text-[#737373]">Remaining Balance:</span>
                <p className="font-bold font-mono-num text-[#0a0a0a] mt-0.5">
                  ₹{eligibility.remainingAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-[#737373]">Max 80% Financing Cap:</span>
                <p className="font-bold font-mono-num text-[#ea580c] mt-0.5">
                  ₹{eligibility.maxEligibleAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e5e5e5] flex items-start space-x-2">
              <Info className="w-4 h-4 text-[#3b82f6] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#0a0a0a]">Eligibility Assessment: </span>
                <span className={eligibility.eligible ? 'text-[#22863a] font-semibold' : 'text-[#d32f2f] font-semibold'}>
                  {eligibility.reasons.join('. ')}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Institutional Offers Comparison Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-display text-[#0a0a0a]">Available Credit Offers</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {demoOffers.slice(0, 2).map((off) => (
            <Card key={off.id} className="hover:border-[#ea580c] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-[#0a0a0a] text-white">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0a0a0a]">{off.lenderName}</h4>
                    <p className="text-[11px] text-[#737373]">Institutional Lending Partner</p>
                  </div>
                </div>

                <div className="p-3 bg-[#f5f5f5] rounded-xl border border-[#e5e5e5] space-y-2 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Annual Interest Rate:</span>
                    <span className="font-mono-num font-bold text-[#ea580c]">{off.interestRateAnnualPercent}% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Max Financing Cap (80%):</span>
                    <span className="font-mono-num font-semibold">
                      ₹{(eligibility?.maxEligibleAmount ?? 240000).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Tenure:</span>
                    <span className="font-mono-num font-semibold">{off.tenureDays} Days</span>
                  </div>
                </div>
              </div>

              <Button
                variant="accent"
                size="sm"
                className="w-full"
                disabled={!eligibility?.eligible}
                onClick={() => {
                  setSelectedLender(off.lenderName);
                  setApplyModalOpen(true);
                }}
              >
                {eligibility?.eligible ? 'Apply for Financing →' : 'Ineligible for Discounting'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Financing Applications Section */}
      {realRequests.length > 0 && (
        <Card className="p-0 overflow-hidden shadow-popover">
          <div className="px-6 py-4 border-b border-[#e5e5e5]">
            <h3 className="text-base font-bold font-display text-[#0a0a0a]">Active Financing Applications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5] text-[#737373] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4 text-right">Requested</th>
                  <th className="py-3 px-4 text-right">Approved</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {realRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono-num text-[#0a0a0a]">{req.id.slice(0, 8)}</td>
                    <td className="py-3.5 px-4 font-mono-num text-[#ea580c]">
                      {req.invoice?.invoiceNumber || 'INV-REF'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#0a0a0a]">
                      ₹{parseFloat(req.requestedAmount.toString()).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#22863a]">
                      {req.approvedAmount
                        ? `₹${parseFloat(req.approvedAmount.toString()).toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-[#737373]">{req.interestRate || '12.5'}%</td>
                    <td className="py-3.5 px-4">
                      <FinancingStatusBadge status={req.status as any} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Financing Application Modal */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Apply for Invoice Financing Line"
      >
        {targetInvoice && eligibility && (
          <form onSubmit={handleApplySubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center space-x-2 text-xs text-[#d32f2f]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="p-3 bg-[#f5f5f5] rounded-lg border border-[#e5e5e5] text-xs space-y-1">
              <p>
                <strong className="text-[#0a0a0a]">Invoice:</strong> {targetInvoice.invoiceNumber} ({eligibility.buyerName})
              </p>
              <p>
                <strong className="text-[#0a0a0a]">Selected Lender:</strong> {selectedLender}
              </p>
              <p>
                <strong className="text-[#0a0a0a]">Max 80% Eligible Limit:</strong> ₹
                {eligibility.maxEligibleAmount.toLocaleString('en-IN')}
              </p>
            </div>

            <Input
              label="Requested Financing Amount (₹)"
              type="number"
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
              required
            />

            <div className="pt-4 border-t border-[#e5e5e5] flex justify-end space-x-2">
              <Button type="button" variant="secondary" onClick={() => setApplyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm & Submit Application'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
