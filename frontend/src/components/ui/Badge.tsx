import React from 'react';
import { InvoiceStatus, RiskLevel, FinancingStatus } from '../../types/models';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'ember';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    default: 'bg-[#f5f5f5] text-[#404040] border border-[#d4d4d4]',
    success: 'bg-[#22863a]/10 text-[#22863a] border border-[#22863a]/20',
    warning: 'bg-[#fff7ed] text-[#c2410c] border border-[#fb923c]/30',
    danger: 'bg-[#d32f2f]/10 text-[#d32f2f] border border-[#d32f2f]/20',
    info: 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20',
    ember: 'bg-[#ea580c] text-white font-semibold shadow-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const InvoiceStatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
  switch (status) {
    case 'PAID':
      return <Badge variant="success">Paid</Badge>;
    case 'APPROVED':
      return <Badge variant="info">Approved</Badge>;
    case 'PARTIALLY_PAID':
      return <Badge variant="warning">Partially Paid</Badge>;
    case 'PENDING':
      return <Badge variant="default">Pending Approval</Badge>;
    case 'OVERDUE':
      return <Badge variant="danger">Overdue</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">Rejected</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const RiskBadge: React.FC<{ risk: RiskLevel }> = ({ risk }) => {
  switch (risk) {
    case 'LOW':
      return <Badge variant="success">Low Risk</Badge>;
    case 'MEDIUM':
      return <Badge variant="warning">Medium Risk</Badge>;
    case 'HIGH':
      return <Badge variant="danger">High Risk</Badge>;
    default:
      return <Badge>{risk}</Badge>;
  }
};

export const FinancingStatusBadge: React.FC<{ status: FinancingStatus }> = ({ status }) => {
  switch (status) {
    case 'APPROVED':
    case 'DISBURSED':
      return <Badge variant="success">{status}</Badge>;
    case 'UNDER_REVIEW':
    case 'SUBMITTED':
      return <Badge variant="info">{status.replace('_', ' ')}</Badge>;
    case 'REPAID':
      return <Badge variant="default">Repaid</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">Rejected</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};
