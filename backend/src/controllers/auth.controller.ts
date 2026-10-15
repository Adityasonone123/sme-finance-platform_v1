import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, AuthError } from '../services/auth.service.js';
import { config } from '../config/index.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

export const register = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    const { user, token } = await registerUser(req.body);

    res.cookie(config.cookieName, token, COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
    });
  }
};

export const login = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    const { user, token } = await loginUser(req.body);

    res.cookie(config.cookieName, token, COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
};

export const me = (req: Request, res: Response<ApiResponse>): void => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

export const logout = (_req: Request, res: Response<ApiResponse>): void => {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const testSupplier = (req: Request, res: Response<ApiResponse>): void => {
  res.status(200).json({
    success: true,
    message: 'Development Verification: Supplier access granted',
    data: req.user,
  });
};

export const testAdmin = (req: Request, res: Response<ApiResponse>): void => {
  res.status(200).json({
    success: true,
    message: 'Development Verification: Admin access granted',
    data: req.user,
  });
};
