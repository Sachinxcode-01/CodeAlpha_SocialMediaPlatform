/**
 * Comments Controller for NovaConnect
 * Handles adding, retrieving, and authorized deletion of comments.
 */

const crypto = require('crypto');
const { query, queryOne, execute } = require('../database/db');

/**
 * Get comments for a post
 * GET /api/posts/:postId/comments
 */
function getComments(req, res) {
  try {
    const { postId } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const post = queryOne('SELECT id, author_id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const rows = query(`
      SELECT 
        c.id,
        c.content,
        c.created_at as createdAt,
        u.id as authorId,
        u.username as authorUsername,
        u.display_name as authorDisplayName,
        u.avatar_url as authorAvatarUrl
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [postId]);

    const comments = rows.map(r => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      author: {
        id: r.authorId,
        username: r.authorUsername,
        displayName: r.authorDisplayName || r.authorUsername,
        avatarUrl: r.authorAvatarUrl || ''
      },
      isAuthor: currentUserId === r.authorId,
      canDelete: currentUserId === r.authorId || currentUserId === post.author_id
    }));

    return res.status(200).json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Failed to retrieve comments.' });
  }
}

/**
 * Add a comment to a post
 * POST /api/posts/:postId/comments
 */
function addComment(req, res) {
  try {
    const { postId } = req.params;
    const currentUserId = req.user.id;
    const { content } = req.body || {};

    const post = queryOne('SELECT id, author_id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    const cleanContent = content.trim();
    if (cleanContent.length > 300) {
      return res.status(400).json({ error: 'Comment content cannot exceed 300 characters.' });
    }

    const commentId = crypto.randomUUID();

    execute(
      'INSERT INTO comments (id, post_id, author_id, content) VALUES (?, ?, ?, ?)',
      [commentId, postId, currentUserId, cleanContent]
    );

    const created = queryOne(`
      SELECT 
        c.id, c.content, c.created_at as createdAt,
        u.id as authorId, u.username as authorUsername,
        u.display_name as authorDisplayName, u.avatar_url as authorAvatarUrl
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `, [commentId]);

    return res.status(201).json({
      message: 'Comment added successfully.',
      comment: {
        id: created.id,
        content: created.content,
        createdAt: created.createdAt,
        author: {
          id: created.authorId,
          username: created.authorUsername,
          displayName: created.authorDisplayName || created.authorUsername,
          avatarUrl: created.authorAvatarUrl || ''
        },
        isAuthor: true,
        canDelete: true
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ error: 'Failed to add comment.' });
  }
}

/**
 * Delete a comment
 * DELETE /api/comments/:commentId
 */
function deleteComment(req, res) {
  try {
    const { commentId } = req.params;
    const currentUserId = req.user.id;

    // Retrieve comment and parent post author for authorization check
    const comment = queryOne(`
      SELECT c.id, c.author_id as commentAuthorId, p.author_id as postAuthorId
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = ?
    `, [commentId]);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Authorization: comment author OR post author may delete
    if (comment.commentAuthorId !== currentUserId && comment.postAuthorId !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to delete this comment.' });
    }

    execute('DELETE FROM comments WHERE id = ?', [commentId]);

    return res.status(200).json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ error: 'Failed to delete comment.' });
  }
}

module.exports = {
  getComments,
  addComment,
  deleteComment
};
