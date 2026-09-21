export default function Sidebar({ user, onLogout }) {
  const initials = (user?.name || user?.username || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">AC</span>
        AI Capsule
      </div>

      <div className="sidebar-section-label">Library</div>
      <div className="sidebar-link active">📊 Dashboard</div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="avatar">
            {user?.avatar ? <img src={user.avatar} alt="" /> : initials}
          </span>
          <div>
            <div className="sidebar-user-name">{user?.name || user?.username}</div>
            <div className="sidebar-user-handle">{user?.provider}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 10 }} onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
