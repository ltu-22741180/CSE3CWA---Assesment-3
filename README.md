# AI Capsule — Cloud-Deployed AI Prompt Manager

A full-stack app for saving, reviewing and improving your AI prompts. Built with
**React (Vite)** on the frontend and **Node.js + Express** on the backend, with
**GitHub OAuth**, an **Express-issued JWT** stored in a Secure/HttpOnly cookie,
and **SQLite** storage.

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

---
