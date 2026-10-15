import React from 'react';
import { Card } from './Card';

interface MetricCardProps {
  title: string;
  amount: number | string;
  isCurrency?: boolean;
  subtitle?: string;
  trendText?: string;
  trendType?: 'positive' | 'negative' | 'neutral' | 'warning';
  icon?: React.ReactNode;
  highlight?: boolean;
  actionText?: string;
  onAction?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  amount,
  isCurrency = true,
  subtitle,
  trendText,
  trendType = 'neutral',
  icon,
  highlight = false,
  actionText,
  onAction,
}) => {
  const formattedAmount =
    typeof amount === 'number' && isCurrency
      ? `₹${amount.toLocaleString('en-IN')}`
      : amount;

  const trendColors = {
    positive: 'text-[#22863a] bg-[#22863a]/10',
    negative: 'text-[#d32f2f] bg-[#d32f2f]/10',
    warning: 'text-[#ea580c] bg-[#fff7ed] border border-[#ea580c]/20',
    neutral: 'text-[#6b7280] bg-[#f5f5f5]',
  };

  return (
    <Card className={`relative overflow-hidden ${highlight ? 'border-[#ea580c]/50 bg-gradient-to-br from-white to-[#fff7ed]/40' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold font-mono-num text-[#0a0a0a] tracking-tight">{formattedAmount}</h3>
        </div>

        {icon && (
          <div className={`p-2.5 rounded-lg ${highlight ? 'bg-[#ea580c]/10 text-[#ea580c]' : 'bg-[#f5f5f5] text-[#404040]'}`}>
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trendText) && (
        <div className="mt-4 flex items-center justify-between text-xs">
          {trendText && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${trendColors[trendType]}`}>
              {trendText}
            </span>
          )}
          {subtitle && <span className="text-[#737373] font-normal">{subtitle}</span>}
        </div>
      )}

      {actionText && onAction && (
        <div className="mt-4 pt-3 border-t border-[#e5e5e5] flex justify-end">
          <button
            onClick={onAction}
            className="text-xs font-semibold text-[#ea580c] hover:text-[#c2410c] flex items-center gap-1 transition-colors"
          >
            <span>{actionText}</span>
            <span>→</span>
          </button>
        </div>
      )}
    </Card>
  );
};
