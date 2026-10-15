import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'sme_finance_platform_jwt_secret_dev_key_2026_x89f',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  cookieSecret: process.env.COOKIE_SECRET || 'sme_finance_cookie_secret_dev',
  cookieName: 'sme_auth',
  overdueCheckCron: process.env.OVERDUE_CHECK_CRON || '0 0 * * *',
};

