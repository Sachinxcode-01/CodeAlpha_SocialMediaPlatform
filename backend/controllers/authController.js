/**
 * Authentication Controller for NovaConnect
 * Handles registration, login, session inspection, and password hashing.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, execute } = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { username, email, password } = req.body || {};

    // Validation
    if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
    }
    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username may only contain letters, numbers, and underscores.' });
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check for existing username or email
    const existingUser = queryOne('SELECT id, username, email FROM users WHERE username = ? OR email = ?', [cleanUsername, cleanEmail]);
    if (existingUser) {
      if (existingUser.username.toLowerCase() === cleanUsername.toLowerCase()) {
        return res.status(409).json({ error: 'Username is already taken.' });
      }
      return res.status(409).json({ error: 'Email address is already registered.' });
    }

    // Hash password with bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = crypto.randomUUID();

    execute(
      'INSERT INTO users (id, username, email, password_hash, bio) VALUES (?, ?, ?, ?, ?)',
      [userId, cleanUsername, cleanEmail, passwordHash, '']
    );

    const newUser = queryOne('SELECT id, username, email, bio, created_at FROM users WHERE id = ?', [userId]);

    // Issue JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        bio: newUser.bio,
        createdAt: newUser.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'An unexpected server error occurred during registration.' });
  }
}

/**
 * Log in an existing user
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { emailOrUsername, password } = req.body || {};

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }

    const identifier = String(emailOrUsername).trim();

    // Query user by username OR email
    const user = queryOne(
      'SELECT id, username, email, password_hash, bio, created_at FROM users WHERE username = ? OR email = ?',
      [identifier, identifier.toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(String(password), user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An unexpected server error occurred during login.' });
  }
}

/**
 * Get currently authenticated user details
 * GET /api/auth/me
 */
function getMe(req, res) {
  return res.status(200).json({ user: req.user });
}

/**
 * Client logout acknowledgment
 * POST /api/auth/logout
 */
function logout(req, res) {
  return res.status(200).json({ message: 'Logged out successfully.' });
}

module.exports = {
  register,
  login,
  getMe,
  logout
};
