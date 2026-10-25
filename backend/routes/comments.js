const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Mounted on /api/posts/:postId/comments
router.get('/', optionalAuth, commentController.getComments);
router.post('/', authenticateToken, commentController.addComment);

// Mounted on /api/comments/:commentId
router.delete('/:commentId', authenticateToken, commentController.deleteComment);

module.exports = router;
