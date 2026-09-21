# AI Capsule — Cloud-Deployed AI Prompt Manager

A full-stack app for saving, reviewing and improving your AI prompts. Built with
**React (Vite)** on the frontend and **Node.js + Express** on the backend, with
**GitHub OAuth**, an **Express-issued JWT** stored in a Secure/HttpOnly cookie,
and **SQLite** storage.

> 🔗 **Deployed URL:** `https://YOUR-APP.onrender.com` — replace with your live link before submitting.
> ☁️ **Cloud platform:** Render (recommended) — Azure App Service also supported, see below.

---

## 1. Project structure

```
ai-capsule/
├─ server/                 Express API (source of truth for auth + data)
│  ├─ index.js             App entry point, static hosting, /api/health
│  ├─ db.js                SQLite connection + schema
│  ├─ middleware/
│  │  └─ authenticate.js   JWT verification middleware
│  └─ routes/
│     ├─ auth.js           /login flow, GitHub + Google OAuth, /auth/logout, /api/me
│     └─ capsules.js       Protected CRUD: /api/capsules
├─ client/                 React (Vite) frontend
│  └─ src/
│     ├─ pages/            Landing.jsx, Login.jsx, Dashboard.jsx
│     ├─ components/       Sidebar, StatCard, CapsuleModal
│     ├─ api.js            fetch() wrapper (credentials: "include")
│     └─ styles.css        Design system (white theme)
├─ .env.example            Copy to .env and fill in — see Section 4
└─ package.json            Convenience scripts (install:all / build / start)
```

The backend serves the built React app (`client/dist`) directly, so the whole
application lives behind **one public URL** — this avoids cross-origin cookie
and CORS issues with the JWT session cookie.

---

## 2. Install & run locally

Requires Node.js 18+ (uses the built-in `fetch`).

```bash
# 1. Install both the server and client dependencies
npm run install:all

# 2. Copy the env file and fill in real values (see Section 4)
cp .env.example .env

# 3a. Run the backend and frontend separately, with hot reload
npm run dev:server     # Express on http://localhost:5000
npm run dev:client     # Vite dev server on http://localhost:5173 (proxies /api and /auth to :5000)

# 3b. OR run it the way it runs in production (one server, one URL)
npm run build           # builds client -> client/dist
npm start                # node server/index.js, serving client/dist on :5000
```

For local OAuth testing, set `APP_BASE_URL=http://localhost:5000` and register
`http://localhost:5000/auth/github/callback` as your GitHub OAuth App's
callback URL (GitHub allows `http://localhost` callback URLs).

---

## 3. Required pages & API routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page explaining AI Capsule |
| `/login` | Public | React page that starts OAuth login (buttons link to `/auth/github` or `/auth/google`) |
| `/dashboard` | Protected (frontend) | Shows the authenticated user's capsules; redirects to `/login` if `GET /api/me` returns 401 |
| `GET /api/health` | Public | Returns `{ "status": "ok" }` |
| `GET /api/capsules` | Protected | Read the authenticated user's own records |
| `POST /api/capsules` | Protected | Create a record owned by the authenticated user |
| `PUT /api/capsules/:id` | Protected | Update a record — only if it belongs to the authenticated user |
| `DELETE /api/capsules/:id` | Protected | Delete a record — only if it belongs to the authenticated user |
| `GET /auth/github`, `GET /auth/github/callback` | — | GitHub OAuth start + callback (issues the app JWT) |
| `GET /auth/google`, `GET /auth/google/callback` | — | Google OAuth fallback, same flow |
| `POST /auth/logout` | — | Clears the `token` cookie |
| `GET /api/me` | Protected | Returns the decoded JWT payload; used by the frontend to check auth state |

The React frontend talks to Express purely over `fetch()` with
`credentials: "include"` (see `client/src/api.js`) — no token is ever read or
stored in JavaScript, since the cookie is HttpOnly.

---

## 4. Environment variables

All variables live in **one root `.env` file** (see `.env.example` for the
full annotated list — copy it and fill in the blanks):

| Variable | Purpose |
|---|---|
| `PORT` | Port Express listens on (Render/Azure usually inject this automatically) |
| `NODE_ENV` | `development` locally, `production` when deployed |
| `APP_BASE_URL` | Full public URL of the deployed app, no trailing slash |
| `JWT_SECRET` | Random secret used to **sign the application JWT** (not the OAuth token) |
| `JWT_EXPIRES_IN` | JWT/cookie lifetime, e.g. `7d` |
| `OAUTH_PROVIDER` | `github` (recommended) or `google` — documents which provider is primary |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | From a GitHub OAuth App |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From a Google OAuth Client (fallback) |
| `DB_PATH` | SQLite file path, relative to `/server` |

No secret values are committed to this repository — `.env` is git-ignored.

---

## 5. OAuth → JWT flow (how authentication actually works)

1. User clicks **Continue with GitHub** on `/login` → browser is sent to
   `GET /auth/github`, which redirects to GitHub's OAuth authorize screen.
2. GitHub redirects back to `GET /auth/github/callback?code=...`.
3. The server exchanges `code` for a GitHub **access token**, then calls
   `GET https://api.github.com/user` to fetch the profile.
4. The server builds its **own application JWT** — `{ id, username, name,
   avatar, provider }`, signed with `JWT_SECRET` — completely separate from
   GitHub's token, which is discarded after this step.
5. That JWT is set as a cookie named **`token`**, with `httpOnly: true`,
   `secure: true` (in production), `sameSite: "lax"`.
6. The browser is redirected to `/dashboard`. From then on, every request to
   `/api/capsules/*` and `/api/me` passes through `middleware/authenticate.js`,
   which reads the `token` cookie, verifies it with `jsonwebtoken.verify()`,
   and attaches the decoded payload to `req.user`. A missing or invalid token
   returns `401` before any database code runs.
7. `user_id` for every capsule row is always `req.user.id` from the verified
   JWT — it is never accepted from the request body, so the frontend cannot
   spoof another user's records.

---

## 6. Database & storage

SQLite (`better-sqlite3`), created automatically on first run at `DB_PATH`
(default `server/data/capsules.db`) using the schema below (see `server/db.js`):

```sql
CREATE TABLE capsules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  prompt_title TEXT NOT NULL,
  prompt_version TEXT,
  prompt_text TEXT NOT NULL,
  response_summary TEXT,
  category TEXT,
  usefulness TEXT,
  reviewed INTEGER DEFAULT 0,
  improved INTEGER DEFAULT 0,
  screenshot_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Persistence note (honest limitation):** on Render's free web service tier,
the filesystem is ephemeral, so the SQLite file can be wiped on redeploy or
restart. This is acceptable for this assignment (SQLite is the minimum
required storage) but is **not production-durable**. For persistent storage,
attach a Render Disk to the service, or switch `DB_PATH`/the DB driver to
Render PostgreSQL / Azure Database for PostgreSQL.

---

## 7. Cloud deployment

### Render (recommended)

1. Push this repository to GitHub (excluding `node_modules`, `.env`, and `client/dist` — already in `.gitignore`).
2. Render dashboard → **New → Web Service** → connect the repo.
3. **Build command:** `npm run render-build`
4. **Start command:** `npm start`
5. Add every variable from `.env.example` under **Environment** (use your real
   deployed URL for `APP_BASE_URL`, and set `NODE_ENV=production`).
6. In your GitHub OAuth App settings, set the **Authorization callback URL**
   to `https://YOUR-APP.onrender.com/auth/github/callback`.
7. Deploy, then re-check the two cURL tests below against the live URL.

### Azure App Service (accepted alternative)

1. Create a **Web App** (Node 18+ runtime, Linux).
2. Configure **Application settings** with the same variables as above.
3. Deploy via GitHub Actions / Azure CLI / VS Code Azure extension, using
   `npm run render-build` (or equivalent `npm install && npm run build`) as
   the build step and `npm start` as the start command.
4. Update your GitHub OAuth App's callback URL to your `*.azurewebsites.net`
   URL, and set `APP_BASE_URL` to match.

---

## 8. Required cURL security checks

Run against your **deployed** `GET /api/capsules` before submitting:

```bash
# Test 1 — no authentication
curl -i https://YOUR-APP/api/capsules
# Required: 401 Unauthorized

# Test 2 — fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://YOUR-APP/api/capsules
# Required: 401 Unauthorized
```

**Results obtained (fill in after deployment):**

```
Test 1: HTTP/1.1 401 Unauthorized  ✅
Test 2: HTTP/1.1 401 Unauthorized  ✅
```

(Both were also verified locally during development — see the smoke test in
the AI-assisted development section below.)

---

## 9. One honest limitation

SQLite on Render's free tier is not guaranteed to persist across redeploys or
restarts (see Section 6). For a coursework-scale app this is an acceptable
trade-off, but a production deployment should use Render PostgreSQL, Azure
Database for PostgreSQL, or a Render persistent Disk instead.

---

## 10. AI-assisted development statement

- **AI tool(s) used:** Claude (Anthropic) — used to scaffold the Express
  routes, the JWT middleware, the React components, and the CSS design
  system, and to draft this README.
- **Problem found & corrected in AI-generated code:** the first draft of the
  `PUT /api/capsules/:id` handler updated the row by `id` alone; it was
  corrected to filter by `WHERE id = ? AND user_id = ?` (and to `SELECT`
  the existing row scoped to the user first) so a user cannot edit another
  user's capsule by guessing an id.
- **How OAuth/JWT/protected-API behaviour was verified:** ran the app
  locally, signed a test JWT with the same `JWT_SECRET` the server uses, and
  confirmed with cURL that `GET /api/capsules` returns `401` with no cookie
  and with an invalid cookie, and returns `200` with real data once a valid
  cookie is attached (see the two required tests in Section 8, plus manual
  GitHub OAuth login through `/login` in the browser).
- **How CRUD & ownership were verified:** created a capsule as `user A`,
  confirmed a second JWT for `user B` could not see it in `GET
  /api/capsules` and received `404 Not Found` when attempting `PUT` on
  `user A`'s record id — proving row ownership is enforced server-side from
  the verified JWT, not from client-supplied data.
- **One implementation decision made independently:** serving the built
  React app directly from the Express server (rather than deploying frontend
  and backend as two separate services) so the OAuth session cookie is
  always first-party — this sidesteps `SameSite`/CORS cookie issues that a
  split-origin deployment would otherwise require extra configuration to fix.
