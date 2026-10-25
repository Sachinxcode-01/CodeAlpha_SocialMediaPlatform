const express = require('express');
const router = express.Router({ mergeParams: true });
const likeController = require('../controllers/likeController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, likeController.likePost);
router.delete('/', authenticateToken, likeController.unlikePost);

module.exports = router;
