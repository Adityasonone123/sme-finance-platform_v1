import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { JWTPayload } from '../types/auth.types.js';

export const generateToken = (payload: { sub: string; role: any; email: string }): string => {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, config.jwtSecret, options);
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwtSecret) as JWTPayload;
};
