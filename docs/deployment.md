# SME Finance Platform - Deployment & Operations Guide

This guide details environment setup, database migrations, Docker composition, and production operations for the SME Finance Platform.

---

## 1. Environment Configuration

Copy `.env.example` templates to `.env` in both `backend/` and `frontend/` directories:

### `backend/.env`
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smefinance?schema=public"
JWT_SECRET="YOUR_SECURE_RANDOM_JWT_SECRET_KEY_HERE"
COOKIE_SECRET="YOUR_SECURE_COOKIE_SECRET_HERE"
FRONTEND_URL="http://localhost:5173"
OVERDUE_CHECK_CRON="0 0 * * *"
MAX_FINANCING_PERCENTAGE=80
```

### `frontend/.env`
```env
VITE_API_URL="http://localhost:5000"
```

---

## 2. PostgreSQL & Prisma Setup

```bash
cd backend
npm install
npx prisma db push
npx tsx prisma/seed.ts
```

---

## 3. Local Production Build

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

---

## 4. Docker Container Orchestration

Run the entire application stack (PostgreSQL database, Express backend API, Vite frontend) using Docker Compose:

```bash
docker compose up -d --build
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Endpoint**: `http://localhost:5000/api/health`
