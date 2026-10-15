import { PaymentMethod } from '@prisma/client';
import { ValidationError } from './company.validator.js';

export interface CreatePaymentDTO {
  invoiceId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
}

export const validateCreatePaymentDTO = (data: Partial<CreatePaymentDTO>): CreatePaymentDTO => {
  const { invoiceId, amount, paymentDate, paymentMethod, referenceNumber } = data;

  if (!invoiceId || typeof invoiceId !== 'string' || invoiceId.trim() === '') {
    throw new ValidationError('Invoice ID is required');
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (numAmount === undefined || isNaN(numAmount) || numAmount <= 0) {
    throw new ValidationError('Payment amount must be a positive number');
  }

  let finalPaymentDate = new Date().toISOString();
  if (paymentDate) {
    if (isNaN(Date.parse(paymentDate))) {
      throw new ValidationError('Invalid payment date format');
    }
    finalPaymentDate = new Date(paymentDate).toISOString();
  }

  let finalMethod: PaymentMethod = PaymentMethod.BANK_TRANSFER;
  if (paymentMethod) {
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new ValidationError('Invalid payment method');
    }
    finalMethod = paymentMethod;
  }

  return {
    invoiceId: invoiceId.trim(),
    amount: numAmount,
    paymentDate: finalPaymentDate,
    paymentMethod: finalMethod,
    referenceNumber: referenceNumber ? referenceNumber.trim() : undefined,
  };
};
