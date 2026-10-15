import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMarketplaceOpportunityById,
  DetailedOpportunity,
} from '../../services/marketplaceService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Info,
  ChevronRight,
} from 'lucide-react';

export const OpportunityDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState<DetailedOpportunity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getMarketplaceOpportunityById(id);
        setOpportunity(data);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to load opportunity details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-[#737373] font-sans">
        Loading financing opportunity details...
      </div>
    );
  }

  if (errorMessage || !opportunity) {
    return (
      <div className="max-w-4xl mx-auto py-12 font-sans space-y-4 text-center">
        <div className="p-4 rounded-xl bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center justify-center space-x-2 text-xs text-[#d32f2f]">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage || 'Financing opportunity not found'}</span>
        </div>
        <Button variant="secondary" onClick={() => navigate('/finance/marketplace')}>
          ← Return to Financing Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/finance/marketplace')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#737373] hover:text-[#0a0a0a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Financing Marketplace</span>
        </button>

        <Badge variant={opportunity.status === 'PENDING' ? 'info' : 'success'}>
          {opportunity.status === 'PENDING' ? 'AVAILABLE OPPORTUNITY' : opportunity.status}
        </Badge>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-[#171717] text-white shadow-popover">
        <div>
          <div className="flex items-center space-x-2 text-[#3b82f6] text-xs font-bold font-mono-num">
            <span>{opportunity.opportunityId}</span>
            <span>•</span>
            <span>Invoice {opportunity.invoiceNumber}</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            ₹{opportunity.requestedAmount.toLocaleString('en-IN')} <span className="text-sm font-normal text-[#a3a3a3]">Requested Credit</span>
          </h1>
          <p className="text-xs text-[#a3a3a3] mt-1">
            Supplier: <strong className="text-white">{opportunity.supplier.name}</strong> → Buyer: <strong className="text-white">{opportunity.buyer.name}</strong>
          </p>
        </div>

        <div className="text-right sm:border-l sm:border-[#404040] sm:pl-6 space-y-1 text-xs">
          <p className="text-[#a3a3a3]">Remaining Tenor:</p>
          <p className="text-xl font-bold font-mono-num text-[#ea580c]">{opportunity.remainingTenorDays} Days</p>
          <p className="text-[11px] text-[#a3a3a3]">Maturity: {new Date(opportunity.dueDate).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      {/* 1. Credit & Financing Terms Summary */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          1. Credit Facility Terms Summary
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Invoice Gross Amount:</span>
            <p className="text-base font-bold font-mono-num text-[#0a0a0a] mt-0.5">
              ₹{opportunity.invoiceAmount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Requested Credit Amount:</span>
            <p className="text-base font-bold font-mono-num text-[#22863a] mt-0.5">
              ₹{opportunity.requestedAmount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Advance Rate:</span>
            <p className="text-base font-bold font-mono-num text-[#3b82f6] mt-0.5">
              {opportunity.advanceRate}%
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Contractual Payment Terms:</span>
            <p className="text-base font-bold font-mono-num text-[#0a0a0a] mt-0.5">
              {opportunity.paymentTermsDays} Net Days
            </p>
          </div>
        </div>
      </Card>

      {/* 2. Corporate Buyer Payment Risk Profile (B9) */}
      <Card className="p-6 space-y-4 shadow-popover">
        <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373]">
            2. Corporate Buyer Payment Discipline & Credit Score (B9 Engine)
          </h2>
          <RiskBadge risk={opportunity.buyer.riskLevel} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[#0a0a0a]">
              <Building2 className="w-4 h-4 text-[#ea580c]" />
              <h3 className="font-bold text-sm">{opportunity.buyer.name}</h3>
            </div>
            {opportunity.buyer.gstNumber && (
              <p className="text-[#737373]">GSTIN: <span className="font-mono-num font-semibold text-[#0a0a0a]">{opportunity.buyer.gstNumber}</span></p>
            )}
            {opportunity.buyer.email && (
              <p className="text-[#737373]">Contact Email: <span className="font-semibold text-[#0a0a0a]">{opportunity.buyer.email}</span></p>
            )}
            {opportunity.buyer.phone && (
              <p className="text-[#737373]">Phone: <span className="font-mono-num text-[#0a0a0a]">{opportunity.buyer.phone}</span></p>
            )}
            {opportunity.buyer.address && (
              <p className="text-[#737373]">Registered Address: <span className="text-[#0a0a0a]">{opportunity.buyer.address}</span></p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#737373]">Platform Buyer Score:</span>
              <span className="text-lg font-bold font-mono-num text-[#3b82f6]">
                {opportunity.buyer.paymentScore} / 100
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#737373]">Contractual vs Actual Days:</span>
              <span className="font-bold font-mono-num text-[#0a0a0a]">
                {opportunity.buyer.contractualTermsDays}d / <span className="text-[#d32f2f]">{opportunity.buyer.avgPaymentDays}d avg</span>
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#e5e5e5]">
              <span className="text-[#737373]">Risk Category:</span>
              <span className="font-bold text-[#0a0a0a]">{opportunity.buyer.riskLevel} RISK</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. SME Supplier Profile */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          3. SME Supplier Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="space-y-1">
            <p className="font-bold text-sm text-[#0a0a0a]">{opportunity.supplier.name}</p>
            {opportunity.supplier.gstNumber && <p className="text-[#737373]">GSTIN: <span className="font-mono-num text-[#0a0a0a]">{opportunity.supplier.gstNumber}</span></p>}
            {opportunity.supplier.email && <p className="text-[#737373]">Email: <span className="text-[#0a0a0a]">{opportunity.supplier.email}</span></p>}
          </div>

          <div className="space-y-1 text-[#737373]">
            {opportunity.supplier.phone && <p>Phone: <span className="font-mono-num text-[#0a0a0a]">{opportunity.supplier.phone}</span></p>}
            {opportunity.supplier.address && <p>Address: <span className="text-[#0a0a0a]">{opportunity.supplier.address}</span></p>}
          </div>
        </div>
      </Card>

      {/* 4. Lender Credit Exposure & Capacity */}
      <Card className="p-6 space-y-4 shadow-popover">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#e5e5e5]">
          <TrendingUp className="w-4 h-4 text-[#22863a]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373]">
            4. Lender Credit Exposure & Capacity Analysis
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Current Buyer Exposure:</span>
            <p className="text-sm font-bold font-mono-num text-[#0a0a0a] mt-0.5">
              ₹{opportunity.exposure.currentBuyerExposure.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Proposed Financing:</span>
            <p className="text-sm font-bold font-mono-num text-[#ea580c] mt-0.5">
              ₹{opportunity.exposure.proposedFinancing.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Exposure After Financing:</span>
            <p className="text-sm font-bold font-mono-num text-[#3b82f6] mt-0.5">
              ₹{opportunity.exposure.exposureAfterFinancing.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Remaining Credit Capacity:</span>
            <p className="text-sm font-bold font-mono-num text-[#22863a] mt-0.5">
              ₹{opportunity.exposure.remainingCreditLimit.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </Card>

      {/* 5. Eligibility Verification Results */}
      <Card className="p-6 space-y-4 shadow-popover">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#e5e5e5]">
          <FileText className="w-4 h-4 text-[#3b82f6]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373]">
            5. Automated Invoice Eligibility Verification
          </h2>
        </div>

        <div className="space-y-2 text-xs font-sans">
          {opportunity.eligibility.reasons.map((reason, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-[#22863a] font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. Phase Boundary Action Notice */}
      <Card className="p-6 space-y-4 shadow-popover bg-[#fff7ed] border border-[#ea580c]/30">
        <div className="flex items-start space-x-3 text-xs text-[#c2410c]">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Financing Opportunity Discovery Phase Complete</h3>
            <p className="text-[#737373]">
              Underwriting approvals, risk evaluation, and lender credit offers are managed in the Underwriting Queue and Bidding workflows.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            variant="accent"
            icon={<ChevronRight className="w-4 h-4" />}
            onClick={() => navigate('/finance/requests')}
          >
            Proceed to Underwriting Queue →
          </Button>
        </div>
      </Card>
    </div>
  );
};
