import { useState } from "react";

const CATEGORIES = ["Coding", "Writing", "Research", "Debugging", "Study", "Other"];
const USEFULNESS = ["Good", "Needs Improvement", "Not Useful"];

const emptyForm = {
  project_name: "",
  prompt_title: "",
  prompt_version: "v1",
  prompt_text: "",
  response_summary: "",
  category: "Coding",
  usefulness: "Good",
  reviewed: false,
  improved: false,
  screenshot_url: "",
  notes: "",
};

export default function CapsuleModal({ initial, onClose, onSubmit }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(() =>
    initial
      ? {
          ...emptyForm,
          ...initial,
          reviewed: Boolean(initial.reviewed),
          improved: Boolean(initial.improved),
        }
      : emptyForm
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.project_name.trim() || !form.prompt_title.trim() || !form.prompt_text.trim()) {
      setError("Project name, prompt title and prompt text are required.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? "Edit capsule" : "New capsule"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error">{error}</div>}

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="project_name">Project name</label>
                <input
                  id="project_name"
                  type="text"
                  value={form.project_name}
                  onChange={(e) => update("project_name", e.target.value)}
                  placeholder="SmartFarm Irrigation"
                />
              </div>

              <div className="form-field">
                <label htmlFor="prompt_version">Version</label>
                <input
                  id="prompt_version"
                  type="text"
                  value={form.prompt_version}
                  onChange={(e) => update("prompt_version", e.target.value)}
                  placeholder="v1"
                />
              </div>

              <div className="form-field full">
                <label htmlFor="prompt_title">Prompt title</label>
                <input
                  id="prompt_title"
                  type="text"
                  value={form.prompt_title}
                  onChange={(e) => update("prompt_title", e.target.value)}
                  placeholder="Debug cloud deployment"
                />
              </div>

              <div className="form-field full">
                <label htmlFor="prompt_text">Prompt text</label>
                <textarea
                  id="prompt_text"
                  value={form.prompt_text}
                  onChange={(e) => update("prompt_text", e.target.value)}
                  placeholder="Why does my Node server fail to start on Render?"
                />
              </div>

              <div className="form-field full">
                <label htmlFor="response_summary">Response summary</label>
                <textarea
                  id="response_summary"
                  value={form.response_summary}
                  onChange={(e) => update("response_summary", e.target.value)}
                  placeholder="Check the start command and PORT env var"
                />
              </div>

              <div className="form-field">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="usefulness">Usefulness</label>
                <select
                  id="usefulness"
                  value={form.usefulness}
                  onChange={(e) => update("usefulness", e.target.value)}
                >
                  {USEFULNESS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field full">
                <label htmlFor="screenshot_url">Screenshot evidence (URL, optional)</label>
                <input
                  id="screenshot_url"
                  type="url"
                  value={form.screenshot_url}
                  onChange={(e) => update("screenshot_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="form-field full">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Tested and worked after adding the PORT variable."
                />
              </div>

              <div className="form-field full form-toggle-row">
                <label className="form-toggle">
                  <input
                    type="checkbox"
                    checked={form.reviewed}
                    onChange={(e) => update("reviewed", e.target.checked)}
                  />
                  Reviewed
                </label>
                <label className="form-toggle">
                  <input
                    type="checkbox"
                    checked={form.improved}
                    onChange={(e) => update("improved", e.target.checked)}
                  />
                  Improved
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-accent" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create capsule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
