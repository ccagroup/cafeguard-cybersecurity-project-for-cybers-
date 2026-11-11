# CaféGuard

A web app for cyber cafés that helps stop customers' accounts from being used by the next person at a shared PC, and gives the owner evidence when something goes wrong.

Attendants log who sits at which PC and confirm a clean hand-over at the end of every session. If a PC is used without an open session, or a finished session is reopened, CaféGuard raises an alert. The owner can turn alerts into incidents and see exactly what happened around them, backed by a tamper-resistant audit trail.

> **Status:** working project, tested on a local setup. Not yet hardened or packaged for production use (see [Limits](#limits)).

## Features

- **Two roles.** Admin (owner) and Attendant. Only an Admin can add, remove or restore attendants.
- **Stations.** Each PC shows *Free* or *In use*, worked out from whether a session is open, so it can never get out of sync.
- **Sessions.** Start a session with the customer's name only. One open session per station, enforced by the database. Customer passwords are never stored.
- **Hand-over checklist.** Ending a session requires three confirmations (logged out, browser data cleared, no passwords saved). The server enforces this. An Admin can force-end a session, which is recorded as *ended without checklist*.
- **Detection.** "Report activity" (activity on a station with no open session) and "Reopen last session" raise alerts. Alerts can be acknowledged once.
- **Incidents.** Record station, type, description and severity. Each incident has a status (Open, Investigating, Resolved), notes, and a timeline merging audit entries and sessions from 4 hours before to 2 hours after.
- **Audit trail.** Append-only. Each entry is written in the same database transaction as the action it records. Read-only table, newest first, searchable.
- **Dashboard.** Active sessions, open incidents, alerts today, sessions ended without checklist, a 14-day sessions chart, and recent alerts.

## Security

- Every data route sits behind one authentication gate, including unknown `/api` paths.
- Passwords hashed with **argon2**. Session tokens are random, and only their **SHA-256 hash** is stored.
- **Rate limiting** on login and on the API. **Account lockout** after 5 failed sign-ins (15 minutes).
- Identical error for a wrong password and an unknown email, with equalised timing.
- **SQL injection** prevented by Prisma's parameterised queries and Zod input validation.
- Session cookie is `HttpOnly` and `SameSite=Strict`. Cookie-based writes also need an `X-Requested-With` header (CSRF defence).
- Removing an attendant deletes their live sessions immediately and blocks sign-in.
- `helmet` security headers, restricted CORS, request body size limit.

## Tech stack

| Part | Tools |
|---|---|
| Server | Node.js, Express 5, TypeScript, Prisma 6, MySQL 8, Zod, argon2 |
| Client | React 19, Vite, TypeScript, React Router, Recharts, lucide icons |
| Landing page | Framer Motion, three.js with react-three-fiber (lazy-loaded, with a static fallback) |
| Tests | Vitest, supertest |

## Project structure

```
cafeguard/
├─ server/
│  ├─ prisma/        schema, migrations, seed script
│  ├─ src/
│  │  ├─ app.ts      middleware order and routers
│  │  ├─ auth/       token creation and hashing
│  │  ├─ middleware/ requireAuth, requireRole, rate limiters
│  │  ├─ routes/     auth, attendants, stations, sessions, alerts, incidents, audit, dashboard
│  │  ├─ audit.ts    append-only audit writer
│  │  └─ alerts.ts   alert creation
│  └─ tests/         integration tests
└─ client/
   └─ src/           pages, components, auth, lib, styles, landing
```

## Getting started

### Requirements

- Node.js 20 or newer (developed on v24)
- MySQL 8

### 1. Database

Create a database and a user for it (names are examples):

```sql
CREATE DATABASE cafeguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE cafeguard_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cafeguard'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON cafeguard.* TO 'cafeguard'@'localhost';
GRANT ALL PRIVILEGES ON cafeguard_shadow.* TO 'cafeguard'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Server

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Open `server/.env` and fill in the database URLs and the first admin's details (`SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` of at least 12 characters). Then:

```powershell
npx prisma migrate deploy
npm run seed
npm run dev
```

The seed creates the first admin and stations `PC-01` to `PC-08`. The API listens on `http://localhost:4000`.

After the admin exists, remove `SEED_ADMIN_PASSWORD` from `.env`.

### 3. Client

In a second terminal:

```powershell
cd client
npm install
npm run dev
```

Open <http://localhost:5173> and sign in with the admin account. In development, Vite proxies `/api` to the server.

### 4. Tests

Tests run against a separate database so your real data is never touched.

```sql
CREATE DATABASE cafeguard_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON cafeguard_test.* TO 'cafeguard'@'localhost';
```

```powershell
cd server
Copy-Item .env.test.example .env.test   # then set the real password
npm run db:test
npm test
```

The test setup refuses to run unless the database name is `cafeguard_test`.

Current tests cover the sign-in gate (every data route answers 401 when signed out), cookie and CSRF behaviour, login errors, SQL injection input, account lockout, rate limiting, roles, attendant removal and the audit trail's lack of edit or delete routes.

## API overview

All routes except `/api/health` and the login routes require a signed-in user.

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Attendants (Admin) | `GET`, `POST /api/attendants`, `POST /api/attendants/:id/remove`, `POST /api/attendants/:id/restore` |
| Stations | `GET /api/stations`, `POST /api/stations/:id/sessions`, `POST /api/stations/:id/report-activity`, `POST /api/stations/:id/reopen-last` |
| Sessions | `POST /api/sessions/:id/end`, `POST /api/sessions/:id/force-end` (Admin) |
| Alerts | `GET /api/alerts`, `POST /api/alerts/:id/acknowledge` |
| Incidents | `GET`, `POST /api/incidents`, `GET /api/incidents/:id`, `PATCH /api/incidents/:id/status`, `PUT /api/incidents/:id/notes` |
| Audit | `GET /api/audit?q=` (read-only) |
| Dashboard | `GET /api/dashboard` |

## How it would be used in a café

One PC acts as the server and runs Node, MySQL and CaféGuard. Customer PCs need nothing installed. Attendants open the app in a browser on the front-desk PC, or on any device on the café network. They start a session when a customer sits down, and end it with the checklist when the customer leaves.

## Limits

CaféGuard is a **logbook and evidence system**. It does not watch or clean the customer PCs itself. The checklist is a human confirmation that the server records and audits. Pair it with kiosk or guest accounts, private browsing, or reset-on-reboot software for automatic cleaning.

Known gaps:

- Attendants cannot change their own password, and an Admin cannot reset one.
- Stations are created by the seed script. There is no screen to add or remove them yet.
- The audit trail is append-only through the application, but not yet locked at the database level.
- Automated tests do not yet cover sessions, the checklist, alerts and incidents. These were verified by hand.
- Production use still needs HTTPS, secure cookies, `trust proxy` (so rate limits see real client IPs), an auto-start service, and database backups.

## Roadmap

- Station management screen
- Attendant password change and Admin reset
- Database-level audit protection
- Integration tests for sessions, checklist, alerts and incidents
- Production build served as one program, with backups
- Optional agent program on customer PCs to clear browser data automatically



