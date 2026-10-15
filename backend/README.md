# SME Finance Platform - Backend API (Phase B1)

Express & TypeScript backend foundation for the SME Cash Flow & Invoice Financing Platform.

## Requirements

- Node.js (v18+)
- npm

## Setup & Running

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env`:
   ```bash
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

3. **Development Mode**
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:5000`.

4. **Production Build & Execution**
   ```bash
   npm run build
   npm start
   ```

## Active Endpoints (Phase B1)

- `GET /` - Root status and API metadata
- `GET /api/health` - Backend health check endpoint
