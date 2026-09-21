const jwt = require("jsonwebtoken");

/**
 * Protects a route by requiring a valid application JWT stored in the
 * HttpOnly "token" cookie (issued by Express after OAuth login — see
 * routes/auth.js). Never trusts a user id supplied by the client.
 *
 * - No cookie            -> 401 Unauthorized
 * - Invalid/expired JWT  -> 401 Unauthorized
 * - Valid JWT            -> req.user = { id, username, name, avatar, provider }
 */
function authenticate(req, res, next) {
  const token = req.cookies ? req.cookies.token : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: no session token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: invalid or expired token" });
  }
}

module.exports = authenticate;
