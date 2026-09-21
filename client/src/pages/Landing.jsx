import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "📝",
    title: "Save every good prompt",
    desc: "Capture the prompt, the project it was for, and the AI's response summary before it gets lost in a chat history.",
  },
  {
    icon: "🏷️",
    title: "Track versions & categories",
    desc: "Tag prompts as v1, v2, v3, sort by category, and see which ones you rated as genuinely useful.",
  },
  {
    icon: "✅",
    title: "Mark reviewed & improved",
    desc: "Note whether you checked the AI's response and whether you improved the output afterwards.",
  },
  {
    icon: "🔒",
    title: "Private to your account",
    desc: "Sign in with GitHub and only you can see, edit or delete your own capsule records.",
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="brand">
          <span className="brand-mark">AC</span>
          AI Capsule
        </div>
        <Link to="/login" className="btn btn-primary">
          Sign in
        </Link>
      </header>

      <section className="landing-hero">
        <div>
          <span className="hero-eyebrow">Prompt library for students</span>
          <h1 className="hero-title">
            Keep your best AI prompts in one place, not scattered across chats.
          </h1>
          <p className="hero-sub">
            AI Capsule is a private space to save, tag and review the prompts you use with
            ChatGPT, Copilot, Gemini or Claude — so the next time you need one, you don't have
            to reconstruct it from memory.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-accent">
              Get started
            </Link>
            <a href="#features" className="btn btn-ghost">
              See what it does
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">4</div>
              <div className="label">Core CRUD actions</div>
            </div>
            <div className="hero-stat">
              <div className="num">1</div>
              <div className="label">Private library per user</div>
            </div>
            <div className="hero-stat">
              <div className="num">0</div>
              <div className="label">Prompts lost to chat history</div>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-row">
            <div className="hero-panel-icon">💬</div>
            <div>
              <div className="hero-panel-title">Debug cloud deployment</div>
              <div className="hero-panel-desc">Coding · v2 · Reviewed</div>
            </div>
          </div>
          <div className="hero-panel-row">
            <div className="hero-panel-icon">✍️</div>
            <div>
              <div className="hero-panel-title">Summarise lecture notes</div>
              <div className="hero-panel-desc">Writing · v1 · Needs improvement</div>
            </div>
          </div>
          <div className="hero-panel-row">
            <div className="hero-panel-icon">🔍</div>
            <div>
              <div className="hero-panel-title">Compare OAuth providers</div>
              <div className="hero-panel-desc">Research · v3 · Reviewed &amp; improved</div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <h2>Everything the assignment needs, nothing it doesn't</h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        AI Capsule — built with React, Node/Express, OAuth and JWT.
      </footer>
    </div>
  );
}
