// Placeholder auth guard (JWT verification to be implemented alongside the auth module).
// Left intentionally minimal — not part of the DB-connection test scope.
const authMiddleware = (req, res, next) => {
  // TODO: verify JWT from Authorization header once auth module is implemented
  next();
};

module.exports = authMiddleware;
