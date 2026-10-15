import { Role, CompanyType } from '@prisma/client';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: Role;
  businessName?: string;
  phone?: string;
  businessType?: CompanyType;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface JWTPayload {
  sub: string;
  role: Role;
  email: string;
}

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
    type: CompanyType;
    gstNumber?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
}
