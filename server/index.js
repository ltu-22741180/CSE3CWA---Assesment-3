// Load environment variables from a .env file at the project root
// (one level up from /server), so a single .env works for local dev.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const capsuleRoutes = require("./routes/capsules");

if (!process.env.JWT_SECRET) {
  console.warn(
    "\n⚠️  WARNING: JWT_SECRET is not set. Copy .env.example to .env and set a real secret.\n"
  );
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.APP_BASE_URL || true,
    credentials: true,
  })
);

// ---------------------------------------------------------------------------
// PUBLIC health check — required exact path, must stay unauthenticated
// ---------------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------------------------------------------------------------------------
// OAuth + session routes (/login is a frontend page; /auth/* are backend)
// ---------------------------------------------------------------------------
app.use("/", authRoutes);

// ---------------------------------------------------------------------------
// Protected capsule CRUD API — exact required paths, JWT-protected inside
// ---------------------------------------------------------------------------
app.use("/api/capsules", capsuleRoutes);

// ---------------------------------------------------------------------------
// Serve the built React frontend (client/dist) for every other route.
// This is what lets the whole app live behind ONE public URL, avoiding
// cross-origin cookie/CORS complications for the OAuth session cookie.
// ---------------------------------------------------------------------------
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));

app.get("*", (req, res, next) => {
  // Let unmatched /api or /auth calls fall through to a JSON 404 instead of
  // returning the HTML shell.
  if (req.path.startsWith("/api") || req.path.startsWith("/auth")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`AI Capsule server listening on port ${PORT}`);
  console.log(`APP_BASE_URL: ${process.env.APP_BASE_URL || "(not set)"}`);
});
