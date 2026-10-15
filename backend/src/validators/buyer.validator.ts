import { validateCompanyDTO, CompanyDTO, ValidationError } from './company.validator.js';

export interface BuyerDTO extends CompanyDTO {}

export const validateBuyerDTO = (data: Partial<BuyerDTO>): BuyerDTO => {
  return validateCompanyDTO(data);
};

export { ValidationError };
