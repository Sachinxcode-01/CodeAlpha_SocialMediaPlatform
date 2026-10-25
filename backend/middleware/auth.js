/**
 * Authentication Middleware for NovaConnect
 * Verifies JWT tokens and attaches authenticated user context to requests.
 */

const jwt = require('jsonwebtoken');
const { queryOne } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'novaconnect_default_jwt_secret_key_2026';

/**
 * Strict authentication middleware: rejects requests lacking valid JWT.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7).trim() 
    : null;

  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required. Please log in to access this resource.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ensure the user still exists in the database
    const user = queryOne('SELECT id, username, email, bio, created_at FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      createdAt: user.created_at
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
}

/**
 * Optional authentication middleware: attaches user if valid token present,
 * but allows unauthenticated requests to continue (e.g. for public feed reading).
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7).trim() 
    : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = queryOne('SELECT id, username, email FROM users WHERE id = ?', [decoded.id]);
    req.user = user ? { id: user.id, username: user.username, email: user.email } : null;
  } catch (err) {
    req.user = null;
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET
};
