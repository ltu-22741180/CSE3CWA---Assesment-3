const express = require("express");
const db = require("../db");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

// Every route below requires a valid JWT. The authenticated user's id
// (req.user.id) always comes from the verified JWT — never from the body,
// query string, or params — so a user can only ever touch their own rows.
router.use(authenticate);

const ALLOWED_FIELDS = [
  "project_name",
  "prompt_title",
  "prompt_version",
  "prompt_text",
  "response_summary",
  "category",
  "usefulness",
  "reviewed",
  "improved",
  "screenshot_url",
  "notes",
];

function toBool01(v) {
  return v === true || v === 1 || v === "1" || v === "true" || v === "yes" ? 1 : 0;
}

// GET /api/capsules — read only the authenticated user's records
router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.user.id);
  res.json({ capsules: rows });
});

// GET /api/capsules/:id — read a single owned record (used to prefill edit form)
router.get("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM capsules WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: "Capsule not found" });
  res.json({ capsule: row });
});

// POST /api/capsules — create a new record owned by the authenticated user
router.post("/", (req, res) => {
  const body = req.body || {};

  if (!body.project_name || !body.prompt_title || !body.prompt_text) {
    return res.status(400).json({
      error: "project_name, prompt_title and prompt_text are required.",
    });
  }

  const stmt = db.prepare(`
    INSERT INTO capsules
      (user_id, project_name, prompt_title, prompt_version, prompt_text,
       response_summary, category, usefulness, reviewed, improved,
       screenshot_url, notes)
    VALUES (@user_id, @project_name, @prompt_title, @prompt_version, @prompt_text,
            @response_summary, @category, @usefulness, @reviewed, @improved,
            @screenshot_url, @notes)
  `);

  const info = stmt.run({
    user_id: req.user.id, // from verified JWT, not the client
    project_name: body.project_name,
    prompt_title: body.prompt_title,
    prompt_version: body.prompt_version || null,
    prompt_text: body.prompt_text,
    response_summary: body.response_summary || null,
    category: body.category || null,
    usefulness: body.usefulness || null,
    reviewed: toBool01(body.reviewed),
    improved: toBool01(body.improved),
    screenshot_url: body.screenshot_url || null,
    notes: body.notes || null,
  });

  const created = db.prepare("SELECT * FROM capsules WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ capsule: created });
});

// PUT /api/capsules/:id — update only if the record belongs to this user
router.put("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM capsules WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  if (!existing) {
    // Either it doesn't exist, or it belongs to someone else — same response
    // either way so we don't leak which records exist.
    return res.status(404).json({ error: "Capsule not found" });
  }

  const body = req.body || {};
  const merged = { ...existing };

  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      merged[field] = field === "reviewed" || field === "improved"
        ? toBool01(body[field])
        : body[field];
    }
  }

  db.prepare(`
    UPDATE capsules SET
      project_name = @project_name,
      prompt_title = @prompt_title,
      prompt_version = @prompt_version,
      prompt_text = @prompt_text,
      response_summary = @response_summary,
      category = @category,
      usefulness = @usefulness,
      reviewed = @reviewed,
      improved = @improved,
      screenshot_url = @screenshot_url,
      notes = @notes
    WHERE id = @id AND user_id = @user_id
  `).run({ ...merged, id: existing.id, user_id: req.user.id });

  const updated = db.prepare("SELECT * FROM capsules WHERE id = ?").get(existing.id);
  res.json({ capsule: updated });
});

// DELETE /api/capsules/:id — delete only if the record belongs to this user
router.delete("/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM capsules WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Capsule not found" });
  }
  res.json({ success: true, id: Number(req.params.id) });
});

module.exports = router;
