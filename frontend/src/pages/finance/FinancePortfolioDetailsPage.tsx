import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getPortfolioDetails,
  DetailedPortfolio,
} from '../../services/portfolioService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const FinancePortfolioDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = useState<DetailedPortfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getPortfolioDetails(id);
        setDetails(data);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to load portfolio financing details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-[#737373] font-sans">
        Loading portfolio financing details...
      </div>
    );
  }

  if (errorMessage || !details) {
    return (
      <div className="max-w-4xl mx-auto py-12 font-sans space-y-4 text-center">
        <div className="p-4 rounded-xl bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center justify-center space-x-2 text-xs text-[#d32f2f]">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage || 'Financing transaction not found'}</span>
        </div>
        <Button variant="secondary" onClick={() => navigate('/finance/portfolio')}>
          ← Return to Portfolio Overview
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/finance/portfolio')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#737373] hover:text-[#0a0a0a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portfolio Overview</span>
        </button>

        <Badge
          variant={
            details.status === 'REPAID' ? 'success' : details.status === 'OVERDUE' ? 'danger' : 'info'
          }
        >
          {details.status}
        </Badge>
      </div>

      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-[#171717] text-white shadow-popover">
        <div>
          <div className="flex items-center space-x-2 text-[#3b82f6] text-xs font-bold font-mono-num">
            <span>{details.financingId}</span>
            <span>•</span>
            <span>Invoice {details.invoiceNumber}</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            ₹{details.outstanding.toLocaleString('en-IN')}{' '}
            <span className="text-sm font-normal text-[#a3a3a3]">Outstanding Balance</span>
          </h1>
          <p className="text-xs text-[#a3a3a3] mt-1">
            Financier: <strong className="text-white">{details.providerName}</strong> → Buyer: <strong className="text-white">{details.buyer.name}</strong>
          </p>
        </div>

        <div className="text-right sm:border-l sm:border-[#404040] sm:pl-6 space-y-1 text-xs">
          <p className="text-[#a3a3a3]">Disbursed Capital:</p>
          <p className="text-xl font-bold font-mono-num text-[#3b82f6]">
            ₹{details.disbursedAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#a3a3a3]">Tenure: {details.tenureDays} Days</p>
        </div>
      </div>

      {/* 1. Financing & Repayment Summary */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          1. Facility Terms & Repayment Breakdown
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Gross Invoice Amount:</span>
            <p className="text-base font-bold font-mono-num text-[#0a0a0a] mt-0.5">
              ₹{details.invoiceAmount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[#737373]">Disbursed Principal:</span>
            <p className="text-base font-bold font-mono-num text-[#3b82f6] mt-0.5">
              ₹{details.disbursedAmount.toLocaleString('en-IN')}
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
              ₹{details.outstanding.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </Card>

      {/* 2. Transaction Parties & Credit Risk Profile */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          2. Transaction Parties & Corporate Credit Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
          <div className="space-y-2 p-4 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-[#737373]">Corporate Buyer (B9 Risk)</span>
              <RiskBadge risk={details.buyerScore.riskCategory as any} />
            </div>
            <p className="font-bold text-sm text-[#0a0a0a]">{details.buyer.name}</p>
            <p className="text-[#737373]">
              B9 Buyer Payment Score:{' '}
              <strong className="text-[#0a0a0a] font-mono-num">{details.buyerScore.score} / 100</strong>
            </p>
            {details.buyer.email && <p className="text-[#737373]">Email: <span className="text-[#0a0a0a]">{details.buyer.email}</span></p>}
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[10px] font-bold uppercase text-[#737373]">SME Supplier</span>
            <p className="font-bold text-sm text-[#0a0a0a]">{details.supplier.name}</p>
            {details.supplier.email && <p className="text-[#737373]">Email: <span className="text-[#0a0a0a]">{details.supplier.email}</span></p>}
            {details.supplier.phone && <p className="text-[#737373]">Phone: <span className="font-mono-num text-[#0a0a0a]">{details.supplier.phone}</span></p>}
          </div>
        </div>
      </Card>

      {/* 3. Financing Lifecycle Timeline */}
      <Card className="p-6 space-y-4 shadow-popover">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737373] pb-2 border-b border-[#e5e5e5]">
          3. Financing Lifecycle Audit History
        </h2>

        <div className="relative pl-6 border-l-2 border-[#e5e5e5] space-y-6 text-xs font-sans">
          {details.timeline.map((item, idx) => (
            <div key={idx} className="relative">
              <div
                className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  item.status === 'COMPLETED'
                    ? 'bg-[#22863a] border-[#22863a] text-white'
                    : 'bg-white border-[#a3a3a3] text-transparent'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
              </div>

              <div>
                <p className={`font-bold ${item.status === 'COMPLETED' ? 'text-[#0a0a0a]' : 'text-[#737373]'}`}>
                  {item.event}
                </p>
                <p className="text-[11px] font-mono-num text-[#737373]">
                  {new Date(item.date).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
