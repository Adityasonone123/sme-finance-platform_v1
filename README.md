# SME Cash Flow & Invoice Financing Platform

## Project Purpose
An SME working capital management and invoice financing platform empowering Small and Medium Enterprises (SMEs) to track cash flow forecasts, monitor buyer payment risk profiles, and unlock non-recourse invoice discounting lines.

## Implementation Status
- **B1 — Backend Foundation**: COMPLETED ✅
- **B2 — PostgreSQL + Prisma Foundation**: COMPLETED ✅
- **B3 — Authentication & Authorization**: COMPLETED ✅
- **B4 — Company & Buyer Management**: COMPLETED ✅
- **B5 — Invoice Management**: COMPLETED ✅
- **B6 — Payment Tracking & Safeguards**: COMPLETED ✅
- **B7 — Overdue Detection & Notifications**: COMPLETED ✅
- **B8 — Cash Flow Engine & Working Capital Gap**: COMPLETED ✅
- **B9 — Buyer Payment Score & Risk Assessment**: COMPLETED ✅
- **B10 — Invoice Financing Management**: COMPLETED ✅
- **B11 — Unified Dashboard, Analytics & System Integration**: COMPLETED ✅
- **B12 — Security, Testing & Production Hardening**: COMPLETED ✅

---

## Postponed Advanced Intelligence (NOT IMPLEMENTED)
- Machine Learning (ML)
- Artificial Intelligence (AI) / LLM / RAG
- Optical Character Recognition (OCR)

---

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript (Strict Mode)
- **Routing**: React Router
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **ORM / Database**: Prisma + PostgreSQL
- **Language**: TypeScript (Strict Mode)
- **Cron Scheduler**: Node-Cron

---

## Quickstart & Running Locally

### 1. Database Setup
Ensure PostgreSQL is running and update `backend/.env` with your `DATABASE_URL`.
```bash
cd backend
npx prisma db push
npx tsx prisma/seed.ts
```

### 2. Start Backend API Server
```bash
cd backend
npm run dev
```
Runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

### 3. Start Frontend Web Application
```bash
cd frontend
npm run dev
```
Runs at `http://localhost:5173`.
