import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getOfferById,
  DetailedOffer,
} from '../../services/offersService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  AlertCircle,
  Info,
} from 'lucide-react';

export const FinanceOfferDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [offer, setOffer] = useState<DetailedOffer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getOfferById(id);
        setOffer(data);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to load financing offer details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-[#737373] font-sans">
        Loading financing offer details...
      </div>
    );
  }

  if (errorMessage || !offer) {
    return (
      <div className="max-w-4xl mx-auto py-12 font-sans space-y-4 text-center">
        <div className="p-4 rounded-xl bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center justify-center space-x-2 text-xs text-[#d32f2f]">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage || 'Financing offer not found'}</span>
        </div>
        <Button variant="secondary" onClick={() => navigate('/finance/offers')}>
          ← Return to My Offers
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/finance/offers')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#737373] hover:text-[#0a0a0a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Offers</span>
        </button>

        <Badge
          variant={
            offer.status === 'ACCEPTED' ? 'success' : offer.status === 'PENDING' ? 'info' : 'danger'
          }
        >
          {offer.status}
        </Badge>
      </div>

      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-[#171717] text-white shadow-popover">
        <div>
          <div className="flex items-center space-x-2 text-[#3b82f6] text-xs font-bold font-mono-num">
            <span>{offer.offerId}</span>
            <span>•</span>
            <span>Invoice {offer.invoiceNumber}</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            ₹{offer.amount.toLocaleString('en-IN')} <span className="text-sm font-normal text-[#a3a3a3]">Offered Credit</span>
          </h1>
          <p className="text-xs text-[#a3a3a3] mt-1">
            Financier: <strong className="text-white">{offer.providerName}</strong> → Supplier: <strong className="text-white">{offer.supplier.name}</strong>
          </p>
        </div>

        <div className="text-right sm:border-l sm:border-[#404040] sm:pl-6 space-y-1 text-xs">
          <p className="text-[#a3a3a3]">Interest Rate:</p>
          <p className="text-xl font-bold font-mono-num text-[#3b82f6]">{offer.interestRate}% APR</p>
          <p className="text-[11px] text-[#a3a3a3]">Tenure: {offer.tenureDays} Days</p>
        </div>
      </div>

      {/* 1. Offer Pricing & Repayment Terms */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          1. Financing Offer Pricing & Repayment Terms
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Offered Principal:</span>
            <p className="text-base font-bold font-mono-num text-[#0a0a0a] mt-0.5">
              ₹{offer.amount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Processing Fee:</span>
            <p className="text-base font-bold font-mono-num text-[#ea580c] mt-0.5">
              ₹{offer.processingFee.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Expected Net Return:</span>
            <p className="text-base font-bold font-mono-num text-[#22863a] mt-0.5">
              ₹{offer.expectedReturn.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Total Repayment:</span>
            <p className="text-base font-bold font-mono-num text-[#3b82f6] mt-0.5">
              ₹{offer.totalRepayment.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </Card>

      {/* 2. SME Supplier & Corporate Buyer Profile */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          2. Transaction Parties Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#737373]">SME Supplier</span>
            <p className="font-bold text-sm text-[#0a0a0a]">{offer.supplier.name}</p>
            {offer.supplier.email && <p className="text-[#737373]">Email: <span className="text-[#0a0a0a]">{offer.supplier.email}</span></p>}
            {offer.supplier.phone && <p className="text-[#737373]">Phone: <span className="font-mono-num text-[#0a0a0a]">{offer.supplier.phone}</span></p>}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#737373]">Corporate Buyer</span>
            <p className="font-bold text-sm text-[#0a0a0a]">{offer.buyer.name}</p>
            {offer.buyer.email && <p className="text-[#737373]">Email: <span className="text-[#0a0a0a]">{offer.buyer.email}</span></p>}
            {offer.buyer.phone && <p className="text-[#737373]">Phone: <span className="font-mono-num text-[#0a0a0a]">{offer.buyer.phone}</span></p>}
          </div>
        </div>
      </Card>

      {/* 3. Phase Boundary Notice */}
      <Card className="p-6 space-y-4 shadow-popover bg-[#eff6ff] border border-[#3b82f6]/30">
        <div className="flex items-start space-x-3 text-xs text-[#1d4ed8]">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Financing Bidding & Lending Offer Stage (F4)</h3>
            <p className="text-[#475569]">
              When the SME supplier accepts this offer, the transaction will transition into the Disbursement workflow phase (F5).
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
