# SME Finance Platform - Security Architecture & Audit Report

This document outlines the security controls, authentication mechanisms, authorization matrix, and data sanitization guidelines enforced across the SME Finance Platform backend and frontend services.

---

## 1. Authentication & JWT Security

- **Password Hashing**: Passwords are strictly hashed using `bcrypt` (10 salt rounds). Plaintext passwords are never stored or logged.
- **JWT Tokens**: Authentication tokens are signed using a secret key configured via environment variable `JWT_SECRET`. Tokens expire in 24 hours.
- **Data Sanitization**: User model serialization explicitly excludes password fields in API responses.
- **HTTP-Only Cookies**: JWT tokens are transmitted via `HttpOnly`, `SameSite=Lax` cookies (`sme_finance_token`) to mitigate XSS exposure.

---

## 2. Authorization & Tenant Isolation (IDOR Protection)

- **Role-Based Access Control (RBAC)**: Enforced via `requireRoles(...)` middleware:
  - `SUPPLIER`: Manages own invoices, buyers, cash flow, and financing applications.
  - `BUYER`: Manages accounts payable verification, invoice approval/rejection, and outgoing payments.
  - `FINANCIAL_INSTITUTION`: Accesses underwriting queue, credit offers, disbursement, and loan repayments.
  - `ADMIN`: Monitors platform global governance metrics.
- **Company-Level Ownership**: All resource lookups (`/api/invoices/:id`, `/api/buyers/:id`, `/api/financing/requests/:id`) cross-reference `req.user.companyId` against resource `supplierId` or `buyerId`. Attempts by cross-tenant users return `403 Forbidden` / `404 Not Found`.

---

## 3. Financial Integrity & Precision Controls

- **Decimal Precision**: All monetary values are stored in PostgreSQL as `Decimal(15, 2)` to eliminate floating-point rounding errors.
- **Overpayment Protection**: Payments are validated atomically (`amount <= remainingBalance`). Payments exceeding outstanding invoice balances return `409 Conflict`.
- **Financing Exposure Cap**: Enforces a strict 80% maximum financing cap against remaining unpaid invoice balances.
- **Input Validation**: Rejects non-positive, NaN, or infinite monetary values.

---

## 4. File Upload Security

- **Storage Isolation**: Invoices uploaded via `/api/invoices/:id/upload` are stored in isolated `uploads/invoices/` directory.
- **Filename Sanitization**: Uploaded files receive randomly generated unique filenames (`invoice-TIMESTAMP-RANDOM.ext`) to prevent path traversal (`../../`).
- **File Type & Size Restrictions**: Whitelisted MIME types (`application/pdf`, `image/png`, `image/jpeg`) capped at 5MB (`5 * 1024 * 1024` bytes).

---

## 5. Security Headers & Error Sanitization

- **Centralized Error Handler**: Internal exceptions (e.g., database connection errors, Prisma stack traces) are caught centrally and return sanitized error messages (`"Something went wrong"`) in production environments.
