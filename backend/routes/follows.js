const express = require('express');
const router = express.Router({ mergeParams: true });
const followController = require('../controllers/followController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, followController.followUser);
router.delete('/', authenticateToken, followController.unfollowUser);

module.exports = router;
