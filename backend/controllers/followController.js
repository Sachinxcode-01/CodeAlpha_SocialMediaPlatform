/**
 * Follow Controller for NovaConnect
 * Handles following and unfollowing users with self-follow prevention and authoritative count calculations.
 */

const crypto = require('crypto');
const { queryOne, execute } = require('../database/db');

/**
 * Follow a user
 * POST /api/users/:userId/follow
 */
function followUser(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Retrieve target user
    const targetUser = queryOne('SELECT id, username FROM users WHERE id = ? OR username = ?', [userId, userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Prevent self-following
    if (targetUser.id === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    // Check if relationship already exists
    const existing = queryOne(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [currentUserId, targetUser.id]
    );

    if (existing) {
      const followersRow = queryOne('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [targetUser.id]);
      return res.status(200).json({
        message: 'You are already following this user.',
        following: true,
        followersCount: followersRow ? followersRow.count : 0
      });
    }

    const followId = crypto.randomUUID();
    execute(
      'INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)',
      [followId, currentUserId, targetUser.id]
    );

    const followersRow = queryOne('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [targetUser.id]);

    return res.status(201).json({
      message: `You are now following @${targetUser.username}.`,
      following: true,
      followersCount: followersRow ? followersRow.count : 0
    });
  } catch (error) {
    console.error('Error following user:', error);
    return res.status(500).json({ error: 'Failed to follow user.' });
  }
}

/**
 * Unfollow a user
 * DELETE /api/users/:userId/follow
 */
function unfollowUser(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const targetUser = queryOne('SELECT id, username FROM users WHERE id = ? OR username = ?', [userId, userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    execute(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [currentUserId, targetUser.id]
    );

    const followersRow = queryOne('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [targetUser.id]);

    return res.status(200).json({
      message: `You have unfollowed @${targetUser.username}.`,
      following: false,
      followersCount: followersRow ? followersRow.count : 0
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return res.status(500).json({ error: 'Failed to unfollow user.' });
  }
}

module.exports = {
  followUser,
  unfollowUser
};
