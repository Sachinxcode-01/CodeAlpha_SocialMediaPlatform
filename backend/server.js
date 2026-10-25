/**
 * NovaConnect Backend Server Entry Point
 * Express application serving REST API and static frontend assets.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Ensure database tables are created on startup
require('./database/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const likeRoutes = require('./routes/likes');
const commentRoutes = require('./routes/comments');
const followRoutes = require('./routes/follows');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users/:userId/follow', followRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts/:postId/likes', likeRoutes);
app.use('/api/posts/:postId/comments', commentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/posts', postRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 404 handler for unmapped API endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found.` });
});

// Single Page Application fallback to index.html for frontend navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred on the server.' 
      : err.message || 'Internal Server Error'
  });
});

// Start listening if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 NovaConnect Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
