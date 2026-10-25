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
      'SELECT id, username, display_name, avatar_url, banner_url, bio, location, website, created_at FROM users WHERE id = ? OR username = ?',
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
        displayName: user.display_name || user.username,
        avatarUrl: user.avatar_url || '',
        bannerUrl: user.banner_url || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
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
 * Update current user profile (bio, displayName, avatar, banner, location, website, or clearAll)
 * PATCH /api/users/me
 */
function updateProfile(req, res) {
  try {
    const currentUserId = req.user.id;
    const body = req.body || {};

    const existingUser = queryOne(
      'SELECT display_name, avatar_url, banner_url, bio, location, website FROM users WHERE id = ?',
      [currentUserId]
    );

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let cleanDisplayName = existingUser.display_name || '';
    let cleanAvatarUrl = existingUser.avatar_url || '';
    let cleanBannerUrl = existingUser.banner_url || '';
    let cleanBio = existingUser.bio || '';
    let cleanLocation = existingUser.location || '';
    let cleanWebsite = existingUser.website || '';

    // If user asked to clear all optional profile fields
    if (body.clearAll === true) {
      cleanDisplayName = '';
      cleanAvatarUrl = '';
      cleanBannerUrl = '';
      cleanBio = '';
      cleanLocation = '';
      cleanWebsite = '';
    } else {
      if (body.displayName !== undefined) {
        if (typeof body.displayName === 'string') {
          if (body.displayName.trim().length > 50) {
            return res.status(400).json({ error: 'Display name cannot exceed 50 characters.' });
          }
          cleanDisplayName = body.displayName.trim();
        } else if (body.displayName === null) {
          cleanDisplayName = '';
        }
      }

      if (body.avatarUrl !== undefined) {
        cleanAvatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : '';
      }

      if (body.bannerUrl !== undefined) {
        cleanBannerUrl = typeof body.bannerUrl === 'string' ? body.bannerUrl.trim() : '';
      }

      if (body.bio !== undefined) {
        if (typeof body.bio === 'string') {
          if (body.bio.length > 250) {
            return res.status(400).json({ error: 'Bio cannot exceed 250 characters.' });
          }
          cleanBio = body.bio.trim();
        } else if (body.bio === null) {
          cleanBio = '';
        }
      }

      if (body.location !== undefined) {
        if (typeof body.location === 'string') {
          if (body.location.trim().length > 80) {
            return res.status(400).json({ error: 'Location cannot exceed 80 characters.' });
          }
          cleanLocation = body.location.trim();
        } else if (body.location === null) {
          cleanLocation = '';
        }
      }

      if (body.website !== undefined) {
        if (typeof body.website === 'string') {
          if (body.website.trim().length > 120) {
            return res.status(400).json({ error: 'Website URL cannot exceed 120 characters.' });
          }
          cleanWebsite = body.website.trim();
        } else if (body.website === null) {
          cleanWebsite = '';
        }
      }
    }

    execute(
      `UPDATE users 
       SET display_name = ?, avatar_url = ?, banner_url = ?, bio = ?, location = ?, website = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [cleanDisplayName, cleanAvatarUrl, cleanBannerUrl, cleanBio, cleanLocation, cleanWebsite, currentUserId]
    );

    const updatedUser = queryOne(
      'SELECT id, username, email, display_name, avatar_url, banner_url, bio, location, website, created_at, updated_at FROM users WHERE id = ?',
      [currentUserId]
    );

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.display_name || updatedUser.username,
        avatarUrl: updatedUser.avatar_url || '',
        bannerUrl: updatedUser.banner_url || '',
        bio: updatedUser.bio || '',
        location: updatedUser.location || '',
        website: updatedUser.website || '',
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
        p.image_url as imageUrl,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        u.id as authorId,
        u.username as authorUsername,
        u.display_name as authorDisplayName,
        u.avatar_url as authorAvatarUrl,
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
        imageUrl: post.imageUrl || null,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: post.authorId,
          username: post.authorUsername,
          displayName: post.authorDisplayName || post.authorUsername,
          avatarUrl: post.authorAvatarUrl || ''
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
        u.display_name,
        u.avatar_url,
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
        displayName: f.display_name || f.username,
        avatarUrl: f.avatar_url || '',
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
        u.display_name,
        u.avatar_url,
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
        displayName: f.display_name || f.username,
        avatarUrl: f.avatar_url || '',
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
