// Every request includes credentials so the HttpOnly "token" cookie set by
// the Express backend after OAuth login is sent automatically. No token is
// ever read or stored in JS — the cookie is HttpOnly by design.

async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // some responses (e.g. logout) may have no body
  }

  if (!res.ok) {
    const error = new Error((data && data.error) || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  health: () => request("/api/health"),
  me: () => request("/api/me"),
  logout: () => request("/auth/logout", { method: "POST" }),

  listCapsules: () => request("/api/capsules"),
  createCapsule: (payload) =>
    request("/api/capsules", { method: "POST", body: JSON.stringify(payload) }),
  updateCapsule: (id, payload) =>
    request(`/api/capsules/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCapsule: (id) => request(`/api/capsules/${id}`, { method: "DELETE" }),
};
