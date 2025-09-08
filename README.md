## Smart Investor (MERN stack)

A MERN application to track stock transactions and portfolio holdings with authentication, caching, and live price updates via Alpaca.

### Features

- **Auth**: Register, login, profile updates, JWT access/refresh, cookie-based session
- **Transactions**: CRUD, pagination, filters, batch import, price sorting by total value
- **Portfolio/Holdings**: User-specific portfolio view, sync, invalidate, and per-holding notes
- **Live Prices**: WebSocket-backed price cache with Alpaca; on-demand fetch and portfolio subscriptions
- **Performance & Security**: Caching, rate limiting, Helmet, compression, request logging
- **Dev/Prod Ready**: Proxy for local dev, static build serving in production, Render config provided

### Tech Stack

- **Frontend**: React 18, React Router 6, @tanstack/react-query, React Hook Form, Styled Components, Axios, TypeScript types
- **Backend**: Node.js, Express, Mongoose, Joi, JWT, express-rate-limit, Helmet, compression, cookie-parser, CORS
- **Utilities**: Winston logging, node-cache
- **DB**: MongoDB
- **Infra**: Render deploy config (`render.yaml`)
- **Live Prices**: Alpaca API (WebSocket + HTTP via `backend/services/alpacaPrices.js`)

## Installation

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or hosted)
- Alpaca API credentials

### 1) Clone

```bash
git clone https://github.com/ShayBenIshay/MERN-Smart-Investor-App.git
cd MERN-Smart-Investor-App
```

### 2) Install dependencies (root)

```bash
npm run install-all
```

### 3) Backend environment

Create `backend/.env`:

```bash
NODE_ENV= "development" || "production"
PORT=5000
MONGODB_URI=<your mongodb uri>
FRONTEND_URL=http://localhost:3000

# Required for live prices
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret


JWT_SECRET=dev_secret_key_change_in_production
# Tokens (optional overrides)
JWT_ACCESS_TOKEN_DURATION=1h
JWT_REFRESH_TOKEN_DURATION=7d

```

### Optional: Frontend environment

Create `frontend/.env` if you want a custom API base:

```bash
REACT_APP_API_URL=http://localhost:5000/api
```

### 4) Run locally

Option A: Run both servers concurrently from project root (recommended):

```bash
npm run dev
```

### Auth

- Register: POST `/api/auth/register`
- Login: POST `/api/auth/login`
- Me: GET `/api/auth/me`
- Refresh: POST `/api/auth/refresh`
- Logout: POST `/api/auth/logout`
- Profile update: PUT `/api/auth/profile`

The frontend integrates token refresh handling.

### Transactions

- List with filters/pagination: GET `/api/transactions`
  - Query: `page`, `limit`, `ticker`, `operation`, `startDate`, `endDate`, `sortBy`, `sortOrder`
- Get all (no pagination): GET `/api/transactions/all`
- Create: POST `/api/transactions`
- Batch create: POST `/api/transactions/batch`
- Get by id: GET `/api/transactions/:id`
- Update: PUT `/api/transactions/:id`
- Delete: DELETE `/api/transactions/:id`
- Live price: GET `/api/transactions/prices/:symbol`
- Subscribe portfolio symbols: POST `/api/transactions/prices/subscribe-portfolio`

### Holdings (legacy) and Portfolio (user-scoped)

- Holdings:
  - GET `/api/holdings`
  - POST `/api/holdings/sync`
  - POST `/api/holdings/invalidate`
  - PUT `/api/holdings/:ticker`
- Portfolio (preferred):
  - GET `/api/portfolio/:userId`
  - POST `/api/portfolio/:userId/sync`
  - POST `/api/portfolio/:userId/invalidate`
  - PUT `/api/portfolio/:userId/holdings/:ticker`

### Health and Dev Utilities

- Health: GET `/api/health`
- Cache stats (dev): GET `/api/cache-stats`

## Architecture Overview

### Backend

- `server.js`: Express app, security middleware, rate limits, routes, health check, Mongo connection, serves React in production
- `routes/`: `auth`, `transactions`, `holdings`, `portfolio`
- `middleware/`: `auth`, `rateLimiter`, `joiValidation`, `validation`, `errorHandler`, `requestLogger`, `cache`
- `services/`: `alpacaPrices` (live prices + cache), `authService` (auth flows), `cacheService` (node-cache)
- `config/config.js`: Env validation with Joi, per-env settings

### Frontend

- React (CRA)
- Auth context/hooks
- Data fetching via React Query
- Styled-components UI
- Pages: `Home`, `Portfolio`, `TransactionsHistory`, `Profile`, `AuthPage`
- API bindings in `src/services/api.js`

## Deployment

`render.yaml` includes:

- Separate backend and frontend web services
- Build/start commands and required env vars
