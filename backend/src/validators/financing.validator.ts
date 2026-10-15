import { ValidationError } from './company.validator.js';

export interface CreateFinancingRequestDTO {
  invoiceId: string;
  requestedAmount: number;
  tenureDays?: number;
}

export interface CreateFinancingOfferDTO {
  providerName: string;
  amount: number;
  interestRate: number;
  tenureDays: number;
  processingFee: number;
}

export const validateCreateFinancingRequestDTO = (
  data: Partial<CreateFinancingRequestDTO>
): CreateFinancingRequestDTO => {
  const { invoiceId, requestedAmount, tenureDays } = data;

  if (!invoiceId || typeof invoiceId !== 'string' || invoiceId.trim() === '') {
    throw new ValidationError('A valid invoiceId is required');
  }

  const numAmount = typeof requestedAmount === 'string' ? parseFloat(requestedAmount) : requestedAmount;
  if (numAmount === undefined || isNaN(numAmount) || numAmount <= 0) {
    throw new ValidationError('Requested amount must be a positive number');
  }

  let numTenure: number | undefined = undefined;
  if (tenureDays !== undefined && tenureDays !== null) {
    numTenure = typeof tenureDays === 'string' ? parseInt(tenureDays, 10) : tenureDays;
    if (isNaN(numTenure) || numTenure <= 0) {
      throw new ValidationError('Tenure days must be a positive integer');
    }
  }

  return {
    invoiceId: invoiceId.trim(),
    requestedAmount: numAmount,
    tenureDays: numTenure,
  };
};

export const validateCreateFinancingOfferDTO = (
  data: Partial<CreateFinancingOfferDTO>
): CreateFinancingOfferDTO => {
  const { providerName, amount, interestRate, tenureDays, processingFee } = data;

  if (!providerName || typeof providerName !== 'string' || providerName.trim() === '') {
    throw new ValidationError('Provider name is required');
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (numAmount === undefined || isNaN(numAmount) || numAmount <= 0) {
    throw new ValidationError('Offer amount must be a positive number');
  }

  const numRate = typeof interestRate === 'string' ? parseFloat(interestRate) : interestRate;
  if (numRate === undefined || isNaN(numRate) || numRate < 0) {
    throw new ValidationError('Interest rate must be a non-negative number');
  }

  const numTenure = typeof tenureDays === 'string' ? parseInt(tenureDays, 10) : tenureDays;
  if (numTenure === undefined || isNaN(numTenure) || numTenure <= 0) {
    throw new ValidationError('Tenure days must be a positive integer');
  }

  const numFee = typeof processingFee === 'string' ? parseFloat(processingFee) : processingFee;
  if (numFee === undefined || isNaN(numFee) || numFee < 0) {
    throw new ValidationError('Processing fee must be a non-negative number');
  }

  return {
    providerName: providerName.trim(),
    amount: numAmount,
    interestRate: numRate,
    tenureDays: numTenure,
    processingFee: numFee,
  };
};
