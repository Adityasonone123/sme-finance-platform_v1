# SME Finance Platform - Database Documentation (Phase B2)

This document specifies the PostgreSQL and Prisma ORM database architecture for the SME Cash Flow & Invoice Financing Platform.

---

## 1. Database Architecture & Technology Choice

- **Engine**: PostgreSQL 16 (Alpine)
- **ORM**: Prisma ORM (v6)
- **Deployment**: Local Docker Container (`sme-finance-platform-db-1`)
- **Host Port**: `5434` (mapped to container port `5432` to avoid host conflicts)

### Why PostgreSQL?
1. **Financial Precision**: Supports native `Decimal(15, 2)` data types for precise monetary accounting without floating-point rounding errors.
2. **ACID Compliance**: Enforces transactional integrity across invoices, payments, and financing requests.
3. **Relational Structure**: Explicit foreign key relations for multi-role workflows (Suppliers, Buyers, Financiers, Admins).

---

## 2. Docker & Environment Configuration

### Docker Compose (`docker-compose.yml`)
The local database is declared in an isolated project-level `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: sme_finance_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres_password
    ports:
      - "5434:5432"
    volumes:
      - sme_finance_postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
```

### Environment Variables (`backend/.env`)
```env
POSTGRES_DB=sme_finance_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_password
POSTGRES_PORT=5434
DATABASE_URL="postgresql://postgres:postgres_password@localhost:5434/sme_finance_db?schema=public"
```

---

## 3. Database Entity Relationship Overview

```
Company
├── Users (1 → Many)
├── Supplier Invoices (1 → Many)
├── Buyer Invoices (1 → Many)
├── Buyer Payment Histories (1 → Many)
├── Cash Flow Entries (1 → Many)
└── Financing Requests (1 → Many)

Invoice
├── Payments (1 → Many)
├── Financing Requests (1 → Many)
└── Buyer Payment Histories (1 → Many)

FinancingRequest
└── Financing Offers (1 → Many)

User
└── Notifications (1 → Many)
```

---

## 4. Domain Entities (9 Models)

| Entity | Description | Key Fields & Types |
| :--- | :--- | :--- |
| **`User`** | Platform system users across 4 roles | `id` (UUID), `email` (Unique), `role` (Enum), `companyId` (FK) |
| **`Company`** | SME suppliers, Corporate buyers, & Financial Institutions | `id` (UUID), `name`, `type` (Enum), `gstNumber` |
| **`Invoice`** | Core invoice records | `id` (UUID), `invoiceNumber` (Unique), `amount` (Decimal), `supplierId` (FK), `buyerId` (FK), `status` (Enum) |
| **`Payment`** | Payments against invoices | `id` (UUID), `invoiceId` (FK), `amount` (Decimal), `paymentMethod` (Enum), `status` (Enum) |
| **`FinancingRequest`** | Invoice financing requests | `id` (UUID), `supplierId` (FK), `invoiceId` (FK), `requestedAmount` (Decimal), `status` (Enum) |
| **`FinancingOffer`** | Financier bids on requests | `id` (UUID), `financingRequestId` (FK), `amount` (Decimal), `interestRate` (Decimal) |
| **`Notification`** | System & workflow alerts | `id` (UUID), `userId` (FK), `type` (Enum), `isRead` (Boolean) |
| **`BuyerPaymentHistory`** | Contractual vs actual payment metrics | `id` (UUID), `buyerId` (FK), `invoiceId` (FK), `delayDays` (Int) |
| **`CashFlowEntry`** | Inflow and outflow items | `id` (UUID), `supplierId` (FK), `type` (Enum), `amount` (Decimal), `date` |

---

## 5. Management Commands

From the `backend/` directory:

| Task | Command | Description |
| :--- | :--- | :--- |
| **Start Database** | `npm run db:up` | Starts Docker container on port `5434` |
| **Stop Database** | `npm run db:down` | Stops Docker container |
| **Validate Schema** | `npm run db:validate` | Validates `schema.prisma` syntax |
| **Run Migration** | `npm run db:migrate` | Applies migrations to PostgreSQL |
| **Generate Client** | `npm run db:generate` | Generates TypeScript Prisma Client |
| **Seed Database** | `npm run db:seed` | Inserts minimal relationship verification data |
| **Open Studio** | `npm run db:studio` | Launches Prisma Studio GUI |

---

## 6. Verification Steps

1. **Check Docker Status**:
   ```bash
   docker ps
   ```
   Verify container `sme-finance-platform-db-1` is healthy on `0.0.0.0:5434->5432/tcp`.

2. **Check Health API**:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "message": "SME Finance Platform API is healthy",
     "database": "connected"
   }
   ```
