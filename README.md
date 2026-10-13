# EquiVest

An early JavaScript MERN application for helping startup founders discover investors and helping investors find startups that fit their preferences.

## Project status

Implemented so far: the Phase 0 Vite + React client and Express health endpoint, plus Phase 1 account registration, login, current-user lookup, role-aware navigation, and role authorization middleware. Startup management, investor matching, and shortlisting are planned for later phases.

## Requirements

- Node.js 20 or newer and npm
- MongoDB connection string for database-backed features (not used by the Phase 0 health endpoint)

## Setup

1. Copy `.env.example` to `.env` and set values for your environment.
2. Set `MONGODB_URI` and a private `JWT_SECRET` of at least 32 characters in `.env`.
3. Install dependencies with `npm.cmd install` from the project root on Windows.
4. Start both applications with `npm.cmd run dev`.

The client runs at `http://localhost:5173`; the API runs at `http://localhost:5000`. Check `http://localhost:5000/api/health` for server status.

## Structure

- `client/` — Vite and React browser application
- `server/` — Express API
- `docs/ai-log.md` — factual development activity log

## Configuration

The server reads `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, and the optional `AI_PROVIDER_API_KEY` from the environment. The API checks for a 32-character JWT secret and MongoDB URI at startup. For local development, use a local MongoDB URI or an Atlas connection string.

## Authentication

Registration accepts `name`, `email`, `password`, and the `founder` or `investor` role. Emails are normalized, passwords are bcrypt-hashed, and authentication uses signed bearer tokens. The browser keeps the token in `sessionStorage`, so it is cleared when the tab session ends; JavaScript running on the page can access it, so this has greater XSS exposure than an HTTP-only cookie. The API enforces authentication and role checks independently of client-side navigation.

API endpoints:

- `POST /api/auth/register` — validate and create an account
- `POST /api/auth/login` — verify credentials and return a bearer token
- `GET /api/auth/me` — return the authenticated account
- `GET /api/health` — API health status

## Verification

- `npm.cmd run dev` starts client and server together.
- `npm.cmd run build` builds the client for production.
- `npm.cmd run test:server` runs authentication API tests using an in-memory MongoDB.
- `npm.cmd run test:client` runs authentication form tests.
- `npm.cmd test` runs both suites.

## Known limitations

The current account landing pages are placeholders until the founder and investor workflow phases are implemented. No deployment is configured.
