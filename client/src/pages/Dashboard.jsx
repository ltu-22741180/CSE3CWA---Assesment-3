import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import Sidebar from "../components/Sidebar.jsx";
import StatCard from "../components/StatCard.jsx";
import CapsuleModal from "../components/CapsuleModal.jsx";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCapsule, setEditingCapsule] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const me = await api.me();
        if (cancelled) return;
        setUser(me.user);

        const list = await api.listCapsules();
        if (cancelled) return;
        setCapsules(list.capsules);
      } catch (err) {
        if (!cancelled) navigate("/login", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function showToast(message, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3200);
  }

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      navigate("/", { replace: true });
    }
  }

  function openCreate() {
    setEditingCapsule(null);
    setModalOpen(true);
  }

  function openEdit(capsule) {
    setEditingCapsule(capsule);
    setModalOpen(true);
  }

  async function handleSubmit(form) {
    if (editingCapsule) {
      const { capsule } = await api.updateCapsule(editingCapsule.id, form);
      setCapsules((list) => list.map((c) => (c.id === capsule.id ? capsule : c)));
      showToast("Capsule updated.");
    } else {
      const { capsule } = await api.createCapsule(form);
      setCapsules((list) => [capsule, ...list]);
      showToast("Capsule created.");
    }
    setModalOpen(false);
  }

  async function handleDelete(capsule) {
    if (!window.confirm(`Delete "${capsule.prompt_title}"? This can't be undone.`)) return;
    try {
      await api.deleteCapsule(capsule.id);
      setCapsules((list) => list.filter((c) => c.id !== capsule.id));
      showToast("Capsule deleted.");
    } catch (err) {
      showToast(err.message || "Could not delete capsule.", true);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return capsules;
    return capsules.filter((c) =>
      [c.project_name, c.prompt_title, c.category, c.usefulness]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [capsules, query]);

  const stats = useMemo(() => {
    const total = capsules.length;
    const reviewed = capsules.filter((c) => c.reviewed).length;
    const improved = capsules.filter((c) => c.improved).length;
    const categories = new Set(capsules.map((c) => c.category).filter(Boolean)).size;
    return { total, reviewed, improved, categories };
  }, [capsules]);

  if (loading) {
    return (
      <div className="loading-block">
        <div className="spinner" />
        Loading your capsules…
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main">
        <div className="main-header">
          <div>
            <h1>Hello, {user?.name || user?.username} 👋</h1>
            <p>Here's your private AI prompt library.</p>
          </div>
          <button className="btn btn-accent" onClick={openCreate}>
            + New capsule
          </button>
        </div>

        <div className="stat-grid">
          <StatCard label="Total capsules" value={stats.total} icon="📦" />
          <StatCard label="Reviewed" value={stats.reviewed} icon="✅" />
          <StatCard label="Improved" value={stats.improved} icon="⚡" />
          <StatCard label="Categories used" value={stats.categories} icon="🏷️" />
        </div>

        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search by project, title or category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🗂️</div>
              <h3>{capsules.length === 0 ? "No capsules yet" : "No matches"}</h3>
              <p>
                {capsules.length === 0
                  ? "Save your first prompt to start building your library."
                  : "Try a different search term."}
              </p>
              {capsules.length === 0 && (
                <button className="btn btn-accent" onClick={openCreate}>
                  + New capsule
                </button>
              )}
            </div>
          ) : (
            <div className="table-scroll">
              <table className="capsules">
                <thead>
                  <tr>
                    <th>Prompt</th>
                    <th>Project</th>
                    <th>Version</th>
                    <th>Category</th>
                    <th>Usefulness</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="cell-title">{c.prompt_title}</div>
                        <div className="cell-sub">
                          {c.prompt_text?.slice(0, 60)}
                          {c.prompt_text?.length > 60 ? "…" : ""}
                        </div>
                      </td>
                      <td>{c.project_name}</td>
                      <td className="mono">{c.prompt_version || "—"}</td>
                      <td>{c.category || "—"}</td>
                      <td>
                        <UsefulnessPill value={c.usefulness} />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span className={`pill ${c.reviewed ? "pill-good" : "pill-neutral"}`}>
                            {c.reviewed ? "Reviewed" : "Unreviewed"}
                          </span>
                          <span className={`pill ${c.improved ? "pill-good" : "pill-neutral"}`}>
                            {c.improved ? "Improved" : "As-is"}
                          </span>
                        </div>
                      </td>
                      <td className="mono">{formatDate(c.created_at)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-btn"
                            title="Edit"
                            onClick={() => openEdit(c)}
                            aria-label="Edit capsule"
                          >
                            ✎
                          </button>
                          <button
                            className="icon-btn danger"
                            title="Delete"
                            onClick={() => handleDelete(c)}
                            aria-label="Delete capsule"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <CapsuleModal
          initial={editingCapsule}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {toast && <div className={`toast ${toast.isError ? "error" : ""}`}>{toast.message}</div>}
    </div>
  );
}

function UsefulnessPill({ value }) {
  if (!value) return <span className="pill pill-neutral">—</span>;
  const cls = value === "Good" ? "pill-good" : value === "Not Useful" ? "pill-warn" : "pill-neutral";
  return <span className={`pill ${cls}`}>{value}</span>;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value.includes("Z") || value.includes("+") ? value : value + "Z");
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
