const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, postController.getFeed);
router.post('/', authenticateToken, postController.createPost);
router.get('/:postId', optionalAuth, postController.getPostById);
router.patch('/:postId', authenticateToken, postController.editPost);
router.delete('/:postId', authenticateToken, postController.deletePost);

module.exports = router;
