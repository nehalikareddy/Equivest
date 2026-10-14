# EquiVest

EquiVest is a MERN application for startup founders to publish funding profiles and for investors to discover startups that match their stated investment preferences.

## Users and features

- **Founders** can register, manage startup profiles, and request optional structured AI feedback on a saved pitch.
- **Investors** can configure industry, stage, and ticket preferences; browse ranked matches; and manage a private shortlist.
- Both roles use authenticated routes. The server enforces ownership and role permissions independently of the frontend.

The application does not include payments, messaging, or funding transactions. Startup records are user-provided; no real investor network or funding outcomes are claimed.

## Technology and architecture

- Client: React 18, Vite, React Router, Axios, plain CSS, Vitest, and React Testing Library.
- Server: Node.js, Express, Mongoose, MongoDB, Zod, bcryptjs, JWT, Helmet, CORS, and express-rate-limit.
- Tests: Jest and Supertest on the server (with mongodb-memory-server); Vitest and React Testing Library on the client.

The root npm project uses workspaces. `client/src/api` contains HTTP modules, `client/src/context` manages the browser session, and `client/src/pages` contains the founder and investor screens. The server separates routes, controllers, services, models, validators, and middleware under `server/src`. `docs/ai-log.md` records actual AI-assisted development and verification.

## Data models

- **User** — name, normalized unique email, bcrypt password hash, and `founder` or `investor` role.
- **Startup** — founder reference, name, tagline, pitch, industry, stage, amount sought in INR, and optional location, business model, and website.
- **InvestorProfile** — unique user reference, preferred industries and stages, and minimum/maximum INR ticket.
- **Shortlist** — investor and startup references with a unique compound index; startup deletion removes related shortlist entries.

## Matching

Matching is deterministic and explainable. It awards 40 points for a preferred industry, up to 30 for funding stage (30 for an exact stage and 15 for an adjacent stage), and up to 30 for requested funding amount (15 when the request is no more than 25% beyond a range boundary). Results are bounded from 0 to 100 and ordered by score, then startup name. The weights are product heuristics, not validated investment predictions or investment advice.

## Authentication and security

Passwords are stored as bcrypt hashes. The API signs JWT bearer tokens with `JWT_SECRET`; the browser currently keeps the token in `sessionStorage` and sends it in the `Authorization` header. This limits persistence to a browser tab session, but JavaScript running on the page can access the token, so XSS remains a security risk. HTTP-only cookie authentication and cookie-specific CSRF protection are not implemented in this version.

The server applies Helmet, allows the configured `CLIENT_URL` origin, limits JSON request bodies to 1 MB, validates request data with Zod, rate-limits registration and login to 20 requests per 15 minutes, and checks role/resource ownership on protected routes. `JWT_SECRET` must be at least 32 characters, and `MONGODB_URI` must be configured before the API starts. Production responses hide unexpected server errors; pitch-analysis responses expose only controlled, safe messages.

## API

All routes are under `/api`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | API health status |
| `POST` | `/auth/register` | Public | Register a founder or investor |
| `POST` | `/auth/login` | Public | Authenticate and receive a bearer token |
| `GET` | `/auth/me` | Authenticated | Return the current user |
| `POST` | `/startups` | Founder | Create a startup profile |
| `GET` | `/startups/mine` | Founder | List the current founder's startups |
| `GET` | `/startups/:id` | Authenticated | View an accessible startup |
| `PUT` | `/startups/:id` | Owning founder | Update a startup |
| `DELETE` | `/startups/:id` | Owning founder | Delete a startup and its shortlist references |
| `POST` | `/startups/:id/analyze` | Owning founder | Request optional structured pitch feedback |
| `GET` / `PUT` | `/investor/profile` | Investor | Read or update investment preferences |
| `GET` | `/matches` | Investor | Get ranked startup matches; supports industry, stage, and sort filters |
| `GET` | `/shortlist` | Investor | List the current investor's saved startups |
| `POST` / `DELETE` | `/shortlist/:startupId` | Investor | Add or remove a startup from the shortlist |

Successful login and registration return `{ user, token }`. Never place real secrets in API requests or source control.

## Optional AI pitch feedback

The founder dashboard can request feedback on a saved startup pitch. The server sends the pitch to the OpenAI Chat Completions API (default model `gpt-4o-mini`) only when `AI_PROVIDER_API_KEY` is configured. Provider output is parsed and validated into a summary, strengths, missing information, and suggestions. Missing credentials return a configuration message; provider errors do not produce fabricated feedback. No live provider request is part of the automated tests. AI feedback may be inaccurate and is not investment advice.

## Requirements and setup

- Node.js 20 or newer and npm
- A MongoDB instance, local or MongoDB Atlas

From the project root, copy `.env.example` to `.env` and set:

```text
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/equivest
JWT_SECRET=<random secret of at least 32 characters>
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
AI_PROVIDER_API_KEY=
```

The AI provider key is optional. Then install dependencies and run the app:

```powershell
npm.cmd install
npm.cmd run dev
```

The client is served at `http://localhost:5173`; the API listens at `http://localhost:5000`. `GET http://localhost:5000/api/health` checks API availability. Do not commit `.env`; `.env.example` contains placeholders only.

## Verification

```powershell
npm.cmd run test:server
npm.cmd run test:client
npm.cmd run build
npm.cmd test
```

The backend tests use an in-memory MongoDB and do not target a configured production database. No seed command or demo records are included.

## Current limitations and release status

- Cookie-based auth and CSRF protection are not implemented yet; see the security section before deployment.
- AI feedback requires a valid server-side provider key and was tested with mocked provider responses only.
- No deployment target or public repository URL is configured or claimed.
- The tests cover core routes and UI workflows but are not a claim of complete test coverage or production readiness.

## AI development experience

Code0 was used for phased implementation and verification. Examples recorded in `docs/ai-log.md` include the initial MERN scaffold and health check, authentication and role authorization, investor preference matching and its scoring tests, shortlist isolation and cleanup, and optional pitch analysis. Generated code was checked with the listed server tests, client tests, and production build; fixes and sandbox-related retries are recorded in the log.
