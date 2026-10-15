import { CashFlowType } from '@prisma/client';
import { ValidationError } from './company.validator.js';

export interface CreateCashFlowEntryDTO {
  type: CashFlowType;
  amount: number;
  date: string;
  description?: string;
  source?: string;
}

export interface UpdateCashFlowEntryDTO {
  type?: CashFlowType;
  amount?: number;
  date?: string;
  description?: string;
  source?: string;
}

export const validateCreateCashFlowEntryDTO = (data: Partial<CreateCashFlowEntryDTO>): CreateCashFlowEntryDTO => {
  const { type, amount, date, description, source } = data;

  if (!type || !Object.values(CashFlowType).includes(type)) {
    throw new ValidationError('Cash flow type must be INCOME or EXPENSE');
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (numAmount === undefined || isNaN(numAmount) || numAmount <= 0) {
    throw new ValidationError('Amount must be a positive number');
  }

  if (!date || isNaN(Date.parse(date))) {
    throw new ValidationError('A valid date is required');
  }

  return {
    type,
    amount: numAmount,
    date: new Date(date).toISOString(),
    description: description ? description.trim() : undefined,
    source: source ? source.trim() : 'MANUAL',
  };
};

export const validateUpdateCashFlowEntryDTO = (data: Partial<UpdateCashFlowEntryDTO>): UpdateCashFlowEntryDTO => {
  const result: UpdateCashFlowEntryDTO = {};

  if (data.type !== undefined) {
    if (!Object.values(CashFlowType).includes(data.type)) {
      throw new ValidationError('Cash flow type must be INCOME or EXPENSE');
    }
    result.type = data.type;
  }

  if (data.amount !== undefined) {
    const numAmount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new ValidationError('Amount must be a positive number');
    }
    result.amount = numAmount;
  }

  if (data.date !== undefined) {
    if (isNaN(Date.parse(data.date))) {
      throw new ValidationError('A valid date is required');
    }
    result.date = new Date(data.date).toISOString();
  }

  if (data.description !== undefined) {
    result.description = data.description.trim();
  }

  if (data.source !== undefined) {
    result.source = data.source.trim();
  }

  return result;
};
