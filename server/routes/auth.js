const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5000";
const isProd = process.env.NODE_ENV === "production";

// Cookie options shared by every place that sets/clears the "token" cookie.
// Secure + HttpOnly as required by the assignment spec.
const cookieOptions = {
  httpOnly: true,
  secure: isProd, // must be true in production (HTTPS); false only on http://localhost
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

function issueSessionCookie(res, user) {
  const token = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  res.cookie("token", token, cookieOptions);
}

/**
 * GET /login is a PUBLIC page rendered by the React app (client/src/pages/Login.jsx).
 * That page's "Continue with GitHub" button simply links to GET /auth/github below,
 * which performs the actual OAuth redirect.
 */

// ---------------------------------------------------------------------------
// GITHUB OAUTH (recommended)
// ---------------------------------------------------------------------------
router.get("/auth/github", (req, res) => {
  const redirectUri = `${APP_BASE_URL}/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

router.get("/auth/github/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing OAuth code from GitHub.");

    // Step 1: exchange the code for a GitHub access token.
    const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${APP_BASE_URL}/auth/github/callback`,
      }),
    });
    const tokenData = await tokenResp.json();
    if (!tokenData.access_token) {
      console.error("GitHub token exchange failed:", tokenData);
      return res.status(401).send("GitHub OAuth failed during token exchange.");
    }

    // Step 2: fetch the authenticated GitHub user's profile.
    const profileResp = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "ai-capsule-app",
      },
    });
    const profile = await profileResp.json();
    if (!profile || !profile.id) {
      return res.status(401).send("Could not retrieve GitHub profile.");
    }

    // Step 3: issue OUR OWN application JWT (not GitHub's token) and set it
    // as a Secure, HttpOnly cookie named "token".
    const user = {
      id: `github:${profile.id}`,
      username: profile.login,
      name: profile.name || profile.login,
      avatar: profile.avatar_url,
      provider: "github",
    };
    issueSessionCookie(res, user);

    res.redirect(`${APP_BASE_URL}/dashboard`);
  } catch (err) {
    console.error("GitHub OAuth error:", err);
    res.status(500).send("GitHub OAuth failed unexpectedly.");
  }
});

// ---------------------------------------------------------------------------
// GOOGLE OAUTH (accepted fallback — used only if OAUTH_PROVIDER=google)
// ---------------------------------------------------------------------------
router.get("/auth/google", (req, res) => {
  const redirectUri = `${APP_BASE_URL}/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing OAuth code from Google.");

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: `${APP_BASE_URL}/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenResp.json();
    if (!tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return res.status(401).send("Google OAuth failed during token exchange.");
    }

    const profileResp = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const profile = await profileResp.json();
    if (!profile || !profile.id) {
      return res.status(401).send("Could not retrieve Google profile.");
    }

    const user = {
      id: `google:${profile.id}`,
      username: profile.email,
      name: profile.name || profile.email,
      avatar: profile.picture,
      provider: "google",
    };
    issueSessionCookie(res, user);

    res.redirect(`${APP_BASE_URL}/dashboard`);
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.status(500).send("Google OAuth failed unexpectedly.");
  }
});

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------
router.post("/auth/logout", (req, res) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// CURRENT USER (used by the frontend to check auth status / show profile)
// ---------------------------------------------------------------------------
router.get("/api/me", (req, res) => {
  const token = req.cookies ? req.cookies.token : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

module.exports = router;
