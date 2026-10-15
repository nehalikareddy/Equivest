# EquiVest

EquiVest is a full-stack MERN startup and investor matching platform where startup founders create and manage funding profiles and investors set investment preferences, evaluate ranked startup matches with transparent 100-point scoring explanations, manage personal shortlists, and optionally run structured AI pitch feedback.

---

## Key Features

- **Role-Based Authentication & Security:** Separate `founder` and `investor` accounts using `bcryptjs` password hashing, HTTP-only JWT cookies (with Bearer token backwards compatibility), CSRF verification on cookie-authenticated state-changing requests, credentialed CORS, Helmet security headers, request ID tracing (`X-Request-Id`), and MongoDB operator sanitization.
- **Founder Startup Management:** Founders can create, view, edit, and delete startup profiles (`name`, `tagline`, `pitch`, `industry`, `stage`, `amountSought`, `location`, `businessModel`, `website`) with strict ownership enforcement and cascade shortlist cleanup on deletion.
- **Investor Preferences & Explainable Matching:** Investors configure preferred industries, funding stages, and minimum/maximum ticket sizes (INR). The deterministic matching service ranks startups on a 100-point scale (**40 pts** industry + **30 pts** exact stage / **15 pts** adjacent stage + **30 pts** in-range funding / **15 pts** within 25% tolerance) and returns human-readable criterion explanations.
- **Investor Startup Shortlist:** Investors can save startups to a personal shortlist, prevent duplicate saves via a compound unique index (`{ investor: 1, startup: 1 }`), inspect full startup details, and remove saved startups.
- **Optional Structured AI Pitch Analysis:** Founders can request structured pitch feedback (`summary`, `strengths`, `missingInformation`, `suggestions`) validated with Zod, with clear fallback and retry messaging when `AI_PROVIDER_API_KEY` is not configured.
- **Responsive UI & Component Architecture:** Built with reusable components (`NavBar`, `StartupCard`, `ProtectedRoute`, `PublicOnlyRoute`, `ErrorBoundary`), clean loading states, and filter controls.

---

## Technologies Used

- **Frontend:** React 18, React Router v7, Vite 6, Axios, Lucide React
- **Backend:** Node.js (>=20), Express 4, Mongoose 8, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Zod, Helmet, `express-rate-limit`, CORS
- **Database:** MongoDB (with `mongodb-memory-server` for isolated integration tests)
- **Testing & Tooling:** Jest + Supertest (39 server integration/unit tests across 6 suites), Vitest + React Testing Library + JSDOM (22 client behavioral/render tests across 5 suites)

---

## Setup and Installation Instructions

1. **Clone the repository and install workspace dependencies:**
   ~~~bash
   git clone https://github.com/nehalikareddy/Equivest.git
   cd Equivest
   npm install
   ~~~

2. **Configure environment variables:**
   Copy `.env.example` to `server/.env` (or root `.env`) and set your local values:
   ~~~env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/equivest
   JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
   JWT_EXPIRES_IN=1d
   CLIENT_URL=http://localhost:5173
   AI_PROVIDER_API_KEY=
   AI_PROVIDER_MODEL=gpt-4o-mini
   AI_TIMEOUT_MS=15000
   ~~~
   *(Note: `JWT_SECRET` must be at least 32 characters. `AI_PROVIDER_API_KEY` is optional and only required if testing live AI pitch analysis.)*

---

## Instructions to Run the Application

- **Run both backend and frontend in development mode:**
  ~~~bash
  npm run dev
  ~~~
  - Frontend dev server: `http://localhost:5173` (proxies `/api` requests to `http://127.0.0.1:5000`)
  - Backend API server: `http://127.0.0.1:5000` (health check at `GET /api/health`)

- **Run backend and frontend separately:**
  ~~~bash
  npm run dev:server
  npm run dev:client
  ~~~

- **Run automated test suites and production build:**
  ~~~bash
  npm run test:server   # 6 suites, 39 passing backend tests
  npm run test:client   # 5 suites, 22 passing frontend tests
  npm test              # Runs both server and client test suites (61 tests total)
  npm run build         # Builds production frontend bundle into client/dist
  ~~~

---

## API Overview

| Method & Endpoint | Access | Description |
|---|---|---|
| `GET /api/health` | Public | Health check with service status and uptime |
| `POST /api/auth/register` | Public | Register a `founder` or `investor` account and set HTTP-only `token` cookie |
| `POST /api/auth/login` | Public | Authenticate user credentials and set HTTP-only `token` cookie |
| `POST /api/auth/logout` | Public | Clear the HTTP-only `token` cookie |
| `GET /api/auth/me` | Authenticated | Return the currently authenticated user profile |
| `POST /api/startups` | Founder | Create a startup profile |
| `GET /api/startups/mine` | Founder | List the authenticated founder's startups |
| `GET /api/startups/:id` | Authenticated | View startup details |
| `PUT /api/startups/:id` | Founder | Update a founder-owned startup profile |
| `DELETE /api/startups/:id` | Founder | Delete a founder-owned startup and cascade-delete shortlist entries |
| `POST /api/startups/:id/analyze` | Founder | Generate structured AI pitch feedback (`summary`, `strengths`, `missingInformation`, `suggestions`) |
| `GET /api/investor/profile` | Investor | Get saved investor matching preferences (or default values) |
| `PUT /api/investor/profile` | Investor | Validate and upsert investor preferences (`industries`, `stages`, `minTicket`, `maxTicket`) |
| `GET /api/matches` | Investor | Score and rank startups against investor preferences with filter/sort support |
| `GET /api/shortlist` | Investor | List saved shortlist startups |
| `POST /api/shortlist/:startupId` | Investor | Save a startup to the investor's shortlist (`409` on duplicate) |
| `DELETE /api/shortlist/:startupId` | Investor | Remove a startup from the investor's shortlist |

---

## Confirmation of Code0 Usage & AI Development Experience

**Confirmation:** Code0 was used as the primary AI development environment throughout the planning, phased implementation, debugging, refactoring, and verification of EquiVest. The complete phase-by-phase log of prompts, generated changes, validation steps, and engineering corrections is also preserved in [`docs/ai-log.md`](docs/ai-log.md).

### Specific Tasks Where Code0 Helped

1. **Project Scaffolding and Workspace Configuration** — Code0 generated the initial npm workspace structure (`client` and `server`), Vite/React frontend setup, Express API entry point, environment configuration (`.env.example`), and `/api/health` endpoint. I verified workspace script execution, API proxy routing, and health check responses.
2. **Authentication, Cookie Security, and Role-Based Access Control** — Code0 helped implement JWT + `bcryptjs` authentication, HTTP-only cookie session handling (`POST /api/auth/logout`, CSRF origin/header verification, and credentialed CORS), Zod request validation, role authorization middleware, and the React `AuthContext`. I resolved a cross-platform Jest ESM module runner issue (`--experimental-vm-modules` with `--runInBand`) and a Vitest `@testing-library/jest-dom` setup import issue that Code0's initial output did not handle.
3. **Explainable Investor Matching Algorithm and Dashboard** — Code0 assisted in building the deterministic 100-point scoring service (`40` points for industry match, `30` points for exact stage or `15` for adjacent stage, and `30` points for in-range ticket size or `15` within 25% tolerance), the `/api/matches` endpoint, and the `InvestorDashboard` UI. I added explicit DOM cleanup (`afterEach(cleanup)`) to prevent test state leakage across component tests.
4. **Shortlist Management and Database Indexing** — Code0 helped create the `Shortlist` Mongoose model with a compound unique index (`{ investor: 1, startup: 1 }`), cascade deletion when a founder deletes a startup, and investor-only shortlist endpoints and pages. I added secondary indexes on `Startup.founder` and `Shortlist.startup`.
5. **Component Refactoring, Error Handling, and Behavioral Testing** — Code0 assisted in extracting reusable UI components (`NavBar`, `StartupCard`, `ErrorBoundary`, `PublicOnlyRoute`, `NotFoundPage`), centralizing `INDUSTRIES`/`STAGES` constants and `formatINR` currency formatting, removing legacy `sessionStorage` token references, and expanding the test suite to 61 total tests (39 server + 22 behavioral and render client tests).

All AI-generated code was reviewed and verified using `npm run test:server`, `npm run test:client`, and `npm run build`.