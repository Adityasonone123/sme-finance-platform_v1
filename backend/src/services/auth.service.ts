import bcrypt from 'bcrypt';
import { Role, CompanyType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { RegisterDTO, LoginDTO, AuthUserPayload } from '../types/auth.types.js';
import { generateToken } from '../utils/jwt.js';

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}

export const registerUser = async (dto: RegisterDTO): Promise<{ user: AuthUserPayload; token: string }> => {
  const { name, email, password, role, businessName } = dto;

  if (!name || name.trim() === '') {
    throw new AuthError('Full name is required', 400);
  }

  if (!email || !email.includes('@')) {
    throw new AuthError('A valid email address is required', 400);
  }

  if (!password || password.length < 6) {
    throw new AuthError('Password must be at least 6 characters long', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Role validation & policy restriction
  let userRole: Role = Role.SUPPLIER;
  if (role) {
    if (role === Role.ADMIN || role === Role.FINANCIAL_INSTITUTION) {
      throw new AuthError('Public registration for Administrative or Financial Institution roles is restricted', 403);
    }
    if (role === Role.BUYER) {
      userRole = Role.BUYER;
    } else if (role === Role.SUPPLIER) {
      userRole = Role.SUPPLIER;
    } else {
      throw new AuthError('Invalid role specified for registration', 400);
    }
  }

  // Check email uniqueness
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AuthError('Email address is already registered', 409);
  }

  // Password hashing
  const passwordHash = await bcrypt.hash(password, 10);

  // Handle optional company creation/association
  let companyId: string | null = null;
  if (businessName && businessName.trim() !== '') {
    const companyType = userRole === Role.BUYER ? CompanyType.CORPORATE : CompanyType.SME;
    const company = await prisma.company.create({
      data: {
        name: businessName.trim(),
        type: companyType,
        email: normalizedEmail,
      },
    });
    companyId = company.id;
  }

  // Create User
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      role: userRole,
      companyId: companyId,
    },
    include: {
      company: true,
    },
  });

  const token = generateToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  const safeUser: AuthUserPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    company: user.company
      ? {
          id: user.company.id,
          name: user.company.name,
          type: user.company.type,
          gstNumber: user.company.gstNumber,
          email: user.company.email,
          phone: user.company.phone,
          address: user.company.address,
        }
      : null,
  };

  return { user: safeUser, token };
};

export const loginUser = async (dto: LoginDTO): Promise<{ user: AuthUserPayload; token: string }> => {
  const { email, password } = dto;

  if (!email || !password) {
    throw new AuthError('Invalid email or password', 401);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      company: true,
    },
  });

  if (!user) {
    throw new AuthError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthError('Invalid email or password', 401);
  }

  const token = generateToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  const safeUser: AuthUserPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    company: user.company
      ? {
          id: user.company.id,
          name: user.company.name,
          type: user.company.type,
          gstNumber: user.company.gstNumber,
          email: user.company.email,
          phone: user.company.phone,
          address: user.company.address,
        }
      : null,
  };

  return { user: safeUser, token };
};

export const getCurrentUser = async (userId: string): Promise<AuthUserPayload> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: true,
    },
  });

  if (!user) {
    throw new AuthError('User not found', 404);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    company: user.company
      ? {
          id: user.company.id,
          name: user.company.name,
          type: user.company.type,
          gstNumber: user.company.gstNumber,
          email: user.company.email,
          phone: user.company.phone,
          address: user.company.address,
        }
      : null,
  };
};
