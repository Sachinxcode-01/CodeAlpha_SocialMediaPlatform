/**
 * Likes Controller for NovaConnect
 * Handles liking and unliking posts with database-level uniqueness and authoritative count calculation.
 */

const crypto = require('crypto');
const { queryOne, execute } = require('../database/db');

/**
 * Like a post
 * POST /api/posts/:postId/likes
 */
function likePost(req, res) {
  try {
    const { postId } = req.params;
    const currentUserId = req.user.id;

    // Verify post existence
    const post = queryOne('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Check for existing like
    const existing = queryOne(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
      [currentUserId, postId]
    );

    if (existing) {
      const countRow = queryOne('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]);
      return res.status(200).json({
        message: 'Post is already liked.',
        liked: true,
        likesCount: countRow ? countRow.count : 0
      });
    }

    const likeId = crypto.randomUUID();
    execute(
      'INSERT INTO likes (id, user_id, post_id) VALUES (?, ?, ?)',
      [likeId, currentUserId, postId]
    );

    const countRow = queryOne('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]);

    return res.status(201).json({
      message: 'Post liked successfully.',
      liked: true,
      likesCount: countRow ? countRow.count : 0
    });
  } catch (error) {
    console.error('Error liking post:', error);
    return res.status(500).json({ error: 'Failed to like post.' });
  }
}

/**
 * Unlike a post
 * DELETE /api/posts/:postId/likes
 */
function unlikePost(req, res) {
  try {
    const { postId } = req.params;
    const currentUserId = req.user.id;

    // Verify post existence
    const post = queryOne('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    execute(
      'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
      [currentUserId, postId]
    );

    const countRow = queryOne('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]);

    return res.status(200).json({
      message: 'Post unliked successfully.',
      liked: false,
      likesCount: countRow ? countRow.count : 0
    });
  } catch (error) {
    console.error('Error unliking post:', error);
    return res.status(500).json({ error: 'Failed to unlike post.' });
  }
}

module.exports = {
  likePost,
  unlikePost
};
