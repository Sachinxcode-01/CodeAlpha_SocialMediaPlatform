/**
 * Post & Feed Controller for NovaConnect
 * Handles post creation (text and photos), global/following feed retrieval, editing, and deletion.
 */

const crypto = require('crypto');
const { query, queryOne, execute } = require('../database/db');

/**
 * Get posts feed (explore or following)
 * GET /api/posts?feed=all|following
 */
function getFeed(req, res) {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const feedType = req.query.feed || 'all';

    let sql = `
      SELECT 
        p.id,
        p.content,
        p.image_url as imageUrl,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        u.id as authorId,
        u.username as authorUsername,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likesCount,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as commentsCount
      FROM posts p
      JOIN users u ON p.author_id = u.id
    `;
    const params = [];

    if (feedType === 'following') {
      if (!currentUserId) {
        return res.status(401).json({ error: 'You must be logged in to view your following feed.' });
      }
      sql += `
        WHERE p.author_id IN (
          SELECT following_id FROM follows WHERE follower_id = ?
        ) OR p.author_id = ?
      `;
      params.push(currentUserId, currentUserId);
    }

    sql += ' ORDER BY p.created_at DESC, p.rowid DESC LIMIT 50';

    const rows = query(sql, params);

    const posts = rows.map(row => {
      let isLiked = false;
      if (currentUserId) {
        const likeRecord = queryOne('SELECT id FROM likes WHERE user_id = ? AND post_id = ?', [currentUserId, row.id]);
        isLiked = !!likeRecord;
      }
      return {
        id: row.id,
        content: row.content,
        imageUrl: row.imageUrl || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        author: {
          id: row.authorId,
          username: row.authorUsername
        },
        likesCount: row.likesCount || 0,
        commentsCount: row.commentsCount || 0,
        isLiked,
        isAuthor: currentUserId === row.authorId
      };
    });

    return res.status(200).json({ posts });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return res.status(500).json({ error: 'Failed to retrieve posts feed.' });
  }
}

/**
 * Create a new post (with optional photo/image)
 * POST /api/posts
 */
function createPost(req, res) {
  try {
    const currentUserId = req.user.id;
    const { content, imageUrl } = req.body || {};

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Post content cannot be empty.' });
    }

    const cleanContent = content.trim();
    if (cleanContent.length > 500) {
      return res.status(400).json({ error: 'Post content cannot exceed 500 characters.' });
    }

    // Optional photo validation
    let cleanImageUrl = null;
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
      const trimmed = imageUrl.trim();
      // Allow HTTP/HTTPS URLs or base64 data URLs
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
        cleanImageUrl = trimmed;
      } else {
        return res.status(400).json({ error: 'Invalid photo URL format. Please provide a valid HTTP URL or photo file.' });
      }
    }

    const postId = crypto.randomUUID();

    execute(
      'INSERT INTO posts (id, author_id, content, image_url) VALUES (?, ?, ?, ?)',
      [postId, currentUserId, cleanContent, cleanImageUrl]
    );

    const created = queryOne(`
      SELECT 
        p.id, p.content, p.image_url as imageUrl, p.created_at as createdAt, p.updated_at as updatedAt,
        u.id as authorId, u.username as authorUsername
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [postId]);

    return res.status(201).json({
      message: 'Post created successfully.',
      post: {
        id: created.id,
        content: created.content,
        imageUrl: created.imageUrl || null,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        author: {
          id: created.authorId,
          username: created.authorUsername
        },
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        isAuthor: true
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ error: 'Failed to create post.' });
  }
}

/**
 * Get a single post by ID
 * GET /api/posts/:postId
 */
function getPostById(req, res) {
  try {
    const { postId } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const row = queryOne(`
      SELECT 
        p.id, p.content, p.image_url as imageUrl, p.created_at as createdAt, p.updated_at as updatedAt,
        u.id as authorId, u.username as authorUsername,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likesCount,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as commentsCount
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [postId]);

    if (!row) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    let isLiked = false;
    if (currentUserId) {
      const likeRecord = queryOne('SELECT id FROM likes WHERE user_id = ? AND post_id = ?', [currentUserId, row.id]);
      isLiked = !!likeRecord;
    }

    return res.status(200).json({
      post: {
        id: row.id,
        content: row.content,
        imageUrl: row.imageUrl || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        author: {
          id: row.authorId,
          username: row.authorUsername
        },
        likesCount: row.likesCount || 0,
        commentsCount: row.commentsCount || 0,
        isLiked,
        isAuthor: currentUserId === row.authorId
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ error: 'Failed to retrieve post.' });
  }
}

/**
 * Edit an owned post
 * PATCH /api/posts/:postId
 */
function editPost(req, res) {
  try {
    const { postId } = req.params;
    const currentUserId = req.user.id;
    const { content, imageUrl } = req.body || {};

    const existingPost = queryOne('SELECT id, author_id, image_url FROM posts WHERE id = ?', [postId]);
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Server-side authorization check: only author can edit
    if (existingPost.author_id !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to edit this post.' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Post content cannot be empty.' });
    }

    const cleanContent = content.trim();
    if (cleanContent.length > 500) {
      return res.status(400).json({ error: 'Post content cannot exceed 500 characters.' });
    }

    let cleanImageUrl = existingPost.image_url;
    if (imageUrl !== undefined) {
      if (imageUrl === null || imageUrl === '') {
        cleanImageUrl = null;
      } else if (typeof imageUrl === 'string') {
        const trimmed = imageUrl.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
          cleanImageUrl = trimmed;
        }
      }
    }

    execute(
      'UPDATE posts SET content = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [cleanContent, cleanImageUrl, postId]
    );

    const updated = queryOne(`
      SELECT 
        p.id, p.content, p.image_url as imageUrl, p.created_at as createdAt, p.updated_at as updatedAt,
        u.id as authorId, u.username as authorUsername,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likesCount,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as commentsCount
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [postId]);

    return res.status(200).json({
      message: 'Post updated successfully.',
      post: {
        id: updated.id,
        content: updated.content,
        imageUrl: updated.imageUrl || null,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        author: {
          id: updated.authorId,
          username: updated.authorUsername
        },
        likesCount: updated.likesCount || 0,
        commentsCount: updated.commentsCount || 0,
        isLiked: true,
        isAuthor: true
      }
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({ error: 'Failed to update post.' });
  }
}

/**
 * Delete an owned post
 * DELETE /api/posts/:postId
 */
function deletePost(req, res) {
  try {
    const { postId } = req.params;
    const currentUserId = req.user.id;

    const existingPost = queryOne('SELECT id, author_id FROM posts WHERE id = ?', [postId]);
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Server-side authorization check: only author can delete
    if (existingPost.author_id !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to delete this post.' });
    }

    execute('DELETE FROM posts WHERE id = ?', [postId]);

    return res.status(200).json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
}

module.exports = {
  getFeed,
  createPost,
  getPostById,
  editPost,
  deletePost
};
