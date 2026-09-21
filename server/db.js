const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

// Resolve the DB path relative to /server, creating the folder if needed.
const dbPathEnv = process.env.DB_PATH || "./data/capsules.db";
const dbPath = path.isAbsolute(dbPathEnv)
  ? dbPathEnv
  : path.join(__dirname, dbPathEnv);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Schema exactly matches the assignment spec, with user_id always sourced
// from the verified JWT (never from the client) at the route level.
db.exec(`
  CREATE TABLE IF NOT EXISTS capsules (
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
`);

module.exports = db;
