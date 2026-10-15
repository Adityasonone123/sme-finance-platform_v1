# SME Finance Platform - API Contract Specification

This document establishes the API contract for the SME Cash Flow & Invoice Financing Platform backend service.

---

## Response Structure Convention

### Successful Response Format
All successful API responses return `HTTP 20x` status code with the following JSON envelope:
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response Format
All error responses return standard HTTP error status codes (`400`, `401`, `403`, `404`, `409`, `422`, `500`) with the following JSON structure:
```json
{
  "success": false,
  "message": "Human readable error message detailing the issue"
}
```

---

## Active Endpoints

### 1. Health Endpoint
- **GET** `/api/health`
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "message": "SME Finance Platform API is healthy",
  "database": "connected"
}
```

### 2. Authentication Endpoints (`/api/auth`)
- **POST** `/api/auth/register`: Register new user (`SUPPLIER`, `BUYER`, `FINANCIAL_INSTITUTION`, `ADMIN`).
- **POST** `/api/auth/login`: Authenticate user and issue HTTP-only JWT cookie.
- **POST** `/api/auth/logout`: Revoke authentication session cookie.
- **GET** `/api/auth/me`: Retrieve current authenticated user profile.

### 3. Company Endpoints (`/api/company`)
- **POST** `/api/company`: Create or update company profile.
- **GET** `/api/company/me`: Retrieve current user's company profile.

### 4. Buyer Endpoints (`/api/buyers`)
- **POST** `/api/buyers`: Add buyer company to supplier directory.
- **GET** `/api/buyers`: List buyers linked to supplier.
- **GET** `/api/buyers/:id`: Retrieve detailed buyer profile.
- **GET** `/api/buyers/:id/score`: Retrieve Phase B9 Buyer Payment Score & Risk Level.
- **GET** `/api/buyers/scores`: List all buyer payment risk scores for supplier.

### 5. Invoice Endpoints (`/api/invoices`)
- **POST** `/api/invoices`: Create new invoice.
- **GET** `/api/invoices`: List invoices owned by or addressed to user company.
- **GET** `/api/invoices/:id`: Retrieve single invoice details.
- **PATCH** `/api/invoices/:id`: Update invoice details.
- **POST** `/api/invoices/:id/approve`: Buyer approves invoice.
- **POST** `/api/invoices/:id/reject`: Buyer rejects invoice.
- **POST** `/api/invoices/:id/upload`: Upload invoice document file (PDF/Image).

### 6. Payment Endpoints (`/api/payments`)
- **POST** `/api/payments`: Record payment against invoice.
- **GET** `/api/payments/invoice/:invoiceId`: List payments for specific invoice.
- **GET** `/api/payments/history/buyer/:buyerId`: List buyer payment history.

### 7. Notification & Scheduler Endpoints (`/api/notifications`)
- **GET** `/api/notifications`: Retrieve user notifications.
- **PATCH** `/api/notifications/:id/read`: Mark notification as read.
- **POST** `/api/notifications/scan-overdue`: Trigger overdue invoice cron scanner.

### 8. Cash Flow Endpoints (`/api/cash-flow`)
- **POST** `/api/cash-flow/entries`: Create manual income or expense entry.
- **GET** `/api/cash-flow/entries`: List cash flow entries.
- **GET** `/api/cash-flow/forecast`: Retrieve cash flow forecast (7, 30, 60, 90 days).
- **GET** `/api/cash-flow/summary`: Retrieve comprehensive cash flow summary.
- **GET** `/api/cash-flow/working-capital-gap`: Retrieve working capital gap shortfall evaluation.

### 9. Financing Endpoints (`/api/financing`)
- **POST** `/api/financing/requests`: Supplier submits financing request (enforces 80% max limit).
- **GET** `/api/financing/requests`: List financing requests for supplier or lender queue.
- **GET** `/api/financing/requests/:id`: Get financing request by ID.
- **GET** `/api/financing/eligibility/:invoiceId`: Check invoice eligibility & reasons.
- **POST** `/api/financing/requests/:id/approve`: Lender approves request (`PENDING` → `APPROVED`).
- **POST** `/api/financing/requests/:id/reject`: Lender rejects request (`PENDING` → `REJECTED`).
- **POST** `/api/financing/requests/:id/disburse`: Lender disburses financing (`APPROVED` → `DISBURSED`).
- **POST** `/api/financing/requests/:id/repay`: Mark financing facility as repaid (`DISBURSED` → `REPAID`).

### 10. Dashboard Analytics Endpoints (`/api/dashboard`)
- **GET** `/api/dashboard/supplier`: Aggregated metrics for Supplier (receivables, cash flow summary, buyer risk snapshot, recent activity, notifications).
- **GET** `/api/dashboard/buyer`: Aggregated payables console metrics for Corporate Buyer (received invoices, pending verification, recent payments).
- **GET** `/api/dashboard/financial-institution`: Aggregated lender underwriting queue, total disbursed capital, and active loan facilities.
- **GET** `/api/dashboard/admin`: Global platform governance metrics (total users, registered companies, total invoiced volume, system health status).
