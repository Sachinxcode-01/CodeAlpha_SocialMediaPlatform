const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.get('/me', authenticateToken, (req, res) => {
  req.params.userId = req.user.id;
  userController.getUserProfile(req, res);
});
router.patch('/me', authenticateToken, userController.updateProfile);

router.get('/:userId', optionalAuth, userController.getUserProfile);
router.get('/:userId/posts', optionalAuth, userController.getUserPosts);
router.get('/:userId/followers', optionalAuth, userController.getFollowers);
router.get('/:userId/following', optionalAuth, userController.getFollowing);

module.exports = router;
