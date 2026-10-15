import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config/index.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import companyRoutes from './routes/company.routes.js';
import buyerRoutes from './routes/buyer.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import cashFlowRoutes from './routes/cash-flow.routes.js';
import financingRoutes from './routes/financing.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import buyerRelationshipRoutes from './routes/buyer-relationship.routes.js';
import marketplaceRoutes from './routes/marketplace.routes.js';
import underwritingRoutes from './routes/underwriting.routes.js';
import offersRoutes from './routes/offers.routes.js';
import disbursementRoutes from './routes/disbursement.routes.js';
import repaymentRoutes from './routes/repayment.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import { initOverdueScheduler } from './scheduler/overdueScheduler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

const app: Application = express();

// Middleware
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(cookieParser(config.cookieSecret));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded invoice files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/buyer', buyerRelationshipRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cash-flow', cashFlowRoutes);
app.use('/api/financing', financingRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/underwriting', underwritingRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/disbursements', disbursementRoutes);
app.use('/api/repayments', repaymentRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Handler for unknown routes
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

// Initialize background scheduler
initOverdueScheduler();

// Start Server
app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port} (${config.nodeEnv})`);
});

export default app;
