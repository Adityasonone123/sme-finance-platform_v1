import { ValidationError } from './company.validator.js';

export interface CreateInvoiceDTO {
  invoiceNumber: string;
  buyerId: string;
  amount: number;
  issueDate: string;
  dueDate?: string;
  paymentTerms?: number;
  description?: string;
}

export interface UpdateInvoiceDTO {
  amount?: number;
  issueDate?: string;
  dueDate?: string;
  paymentTerms?: number;
  description?: string;
}

export const validateCreateInvoiceDTO = (data: Partial<CreateInvoiceDTO>): CreateInvoiceDTO => {
  const { invoiceNumber, buyerId, amount, issueDate, dueDate, paymentTerms } = data;

  if (!invoiceNumber || typeof invoiceNumber !== 'string' || invoiceNumber.trim() === '') {
    throw new ValidationError('Invoice number is required');
  }

  if (!buyerId || typeof buyerId !== 'string' || buyerId.trim() === '') {
    throw new ValidationError('Corporate buyer ID is required');
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (numAmount === undefined || isNaN(numAmount) || numAmount <= 0) {
    throw new ValidationError('Invoice amount must be a positive number');
  }

  if (!issueDate || isNaN(Date.parse(issueDate))) {
    throw new ValidationError('Valid issue date is required');
  }

  let finalPaymentTerms = 30;
  if (paymentTerms !== undefined) {
    const terms = typeof paymentTerms === 'string' ? parseInt(paymentTerms, 10) : paymentTerms;
    if (isNaN(terms) || terms <= 0) {
      throw new ValidationError('Payment terms must be a positive integer number of days');
    }
    finalPaymentTerms = terms;
  }

  let finalDueDate = dueDate;
  if (!finalDueDate || isNaN(Date.parse(finalDueDate))) {
    const issueObj = new Date(issueDate);
    issueObj.setDate(issueObj.getDate() + finalPaymentTerms);
    finalDueDate = issueObj.toISOString();
  }

  if (new Date(finalDueDate) < new Date(issueDate)) {
    throw new ValidationError('Invoice due date cannot be earlier than issue date');
  }

  return {
    invoiceNumber: invoiceNumber.trim(),
    buyerId: buyerId.trim(),
    amount: numAmount,
    issueDate: new Date(issueDate).toISOString(),
    dueDate: new Date(finalDueDate).toISOString(),
    paymentTerms: finalPaymentTerms,
    description: data.description ? data.description.trim() : undefined,
  };
};

export const validateUpdateInvoiceDTO = (data: Partial<UpdateInvoiceDTO>): UpdateInvoiceDTO => {
  const { amount, issueDate, dueDate, paymentTerms, description } = data;

  let numAmount: number | undefined = undefined;
  if (amount !== undefined) {
    numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new ValidationError('Invoice amount must be a positive number');
    }
  }

  let parsedIssueDate: string | undefined = undefined;
  if (issueDate) {
    if (isNaN(Date.parse(issueDate))) {
      throw new ValidationError('Invalid issue date format');
    }
    parsedIssueDate = new Date(issueDate).toISOString();
  }

  let parsedDueDate: string | undefined = undefined;
  if (dueDate) {
    if (isNaN(Date.parse(dueDate))) {
      throw new ValidationError('Invalid due date format');
    }
    parsedDueDate = new Date(dueDate).toISOString();
  }

  if (parsedIssueDate && parsedDueDate && new Date(parsedDueDate) < new Date(parsedIssueDate)) {
    throw new ValidationError('Invoice due date cannot be earlier than issue date');
  }

  let termsNum: number | undefined = undefined;
  if (paymentTerms !== undefined) {
    termsNum = typeof paymentTerms === 'string' ? parseInt(paymentTerms, 10) : paymentTerms;
    if (isNaN(termsNum) || termsNum <= 0) {
      throw new ValidationError('Payment terms must be a positive integer number of days');
    }
  }

  return {
    amount: numAmount,
    issueDate: parsedIssueDate,
    dueDate: parsedDueDate,
    paymentTerms: termsNum,
    description: description ? description.trim() : undefined,
  };
};
