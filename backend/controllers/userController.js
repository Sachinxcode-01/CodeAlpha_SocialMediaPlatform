/**
 * User Profile Controller for NovaConnect
 * Handles profile viewing, profile editing, and follower/following list retrieval.
 */

const { query, queryOne, execute } = require('../database/db');

/**
 * Get user profile by ID or username
 * GET /api/users/:userId
 */
function getUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    // Search by ID or by exact username
    const user = queryOne(
      'SELECT id, username, bio, created_at FROM users WHERE id = ? OR username = ?',
      [userId, userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Aggregate counts
    const postsCountRow = queryOne('SELECT COUNT(*) as count FROM posts WHERE author_id = ?', [user.id]);
    const followersCountRow = queryOne('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [user.id]);
    const followingCountRow = queryOne('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?', [user.id]);

    // Check if the current logged-in user is following this profile
    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const followRecord = queryOne(
        'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
        [currentUserId, user.id]
      );
      isFollowing = !!followRecord;
    }

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        bio: user.bio || '',
        createdAt: user.created_at,
        postsCount: postsCountRow ? postsCountRow.count : 0,
        followersCount: followersCountRow ? followersCountRow.count : 0,
        followingCount: followingCountRow ? followingCountRow.count : 0,
        isFollowing,
        isSelf: currentUserId === user.id
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
}

/**
 * Update current user profile (bio)
 * PATCH /api/users/me
 */
function updateProfile(req, res) {
  try {
    const currentUserId = req.user.id;
    const { bio } = req.body || {};

    let cleanBio = '';
    if (typeof bio === 'string') {
      if (bio.length > 250) {
        return res.status(400).json({ error: 'Bio cannot exceed 250 characters.' });
      }
      cleanBio = bio.trim();
    }

    execute(
      'UPDATE users SET bio = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [cleanBio, currentUserId]
    );

    const updatedUser = queryOne(
      'SELECT id, username, email, bio, created_at, updated_at FROM users WHERE id = ?',
      [currentUserId]
    );

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        createdAt: updatedUser.created_at
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

/**
 * Get posts authored by a specific user
 * GET /api/users/:userId/posts
 */
function getUserPosts(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const targetUser = queryOne('SELECT id FROM users WHERE id = ? OR username = ?', [userId, userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const posts = query(`
      SELECT 
        p.id,
        p.content,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        u.id as authorId,
        u.username as authorUsername,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likesCount,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as commentsCount
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.author_id = ?
      ORDER BY p.created_at DESC, p.rowid DESC
    `, [targetUser.id]);

    const formattedPosts = posts.map(post => {
      let isLiked = false;
      if (currentUserId) {
        const likeRecord = queryOne('SELECT id FROM likes WHERE user_id = ? AND post_id = ?', [currentUserId, post.id]);
        isLiked = !!likeRecord;
      }
      return {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: post.authorId,
          username: post.authorUsername
        },
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        isLiked,
        isAuthor: currentUserId === post.authorId
      };
    });

    return res.status(200).json({ posts: formattedPosts });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return res.status(500).json({ error: 'Failed to retrieve posts.' });
  }
}

/**
 * Get followers of a user
 * GET /api/users/:userId/followers
 */
function getFollowers(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const targetUser = queryOne('SELECT id FROM users WHERE id = ? OR username = ?', [userId, userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const followers = query(`
      SELECT 
        u.id, 
        u.username, 
        u.bio, 
        f.created_at as followedAt
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `, [targetUser.id]);

    const formatted = followers.map(f => {
      let isFollowing = false;
      if (currentUserId) {
        const rel = queryOne('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [currentUserId, f.id]);
        isFollowing = !!rel;
      }
      return {
        id: f.id,
        username: f.username,
        bio: f.bio || '',
        followedAt: f.followedAt,
        isFollowing,
        isSelf: currentUserId === f.id
      };
    });

    return res.status(200).json({ followers: formatted });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return res.status(500).json({ error: 'Failed to retrieve followers.' });
  }
}

/**
 * Get list of accounts followed by a user
 * GET /api/users/:userId/following
 */
function getFollowing(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const targetUser = queryOne('SELECT id FROM users WHERE id = ? OR username = ?', [userId, userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const following = query(`
      SELECT 
        u.id, 
        u.username, 
        u.bio, 
        f.created_at as followedAt
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `, [targetUser.id]);

    const formatted = following.map(f => {
      let isFollowing = false;
      if (currentUserId) {
        const rel = queryOne('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [currentUserId, f.id]);
        isFollowing = !!rel;
      }
      return {
        id: f.id,
        username: f.username,
        bio: f.bio || '',
        followedAt: f.followedAt,
        isFollowing,
        isSelf: currentUserId === f.id
      };
    });

    return res.status(200).json({ following: formatted });
  } catch (error) {
    console.error('Error fetching following:', error);
    return res.status(500).json({ error: 'Failed to retrieve following accounts.' });
  }
}

module.exports = {
  getUserProfile,
  updateProfile,
  getUserPosts,
  getFollowers,
  getFollowing
};
