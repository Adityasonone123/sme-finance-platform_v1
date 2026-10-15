export interface CompanyDTO {
  name: string;
  gstNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export class ValidationError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.statusCode = 400;
    this.name = 'ValidationError';
  }
}

export const validateCompanyDTO = (data: Partial<CompanyDTO>): CompanyDTO => {
  const { name, gstNumber, email, phone, address } = data;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError('Company name is required');
  }

  let normalizedEmail: string | undefined = undefined;
  if (email && email.trim() !== '') {
    if (!email.includes('@')) {
      throw new ValidationError('Invalid email format');
    }
    normalizedEmail = email.trim().toLowerCase();
  }

  let formattedGst: string | undefined = undefined;
  if (gstNumber && gstNumber.trim() !== '') {
    formattedGst = gstNumber.trim().toUpperCase();
    if (!GSTIN_REGEX.test(formattedGst)) {
      throw new ValidationError('Invalid GSTIN format. Expected format: 27AAACA123411Z5');
    }
  }

  return {
    name: name.trim(),
    email: normalizedEmail,
    gstNumber: formattedGst,
    phone: phone ? phone.trim() : undefined,
    address: address ? address.trim() : undefined,
  };
};
