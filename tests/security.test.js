/**
 * Workflow D: Security & Authorization Boundary Tests
 * Verifies access controls, ownership validation, self-follow prevention, and token enforcement.
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { startServer, stopServer, resetDatabase, request } = require('./helpers');

describe('Workflow D: Security, Authorization & Edge Cases', () => {
  let userAToken = '';
  let userAId = '';
  let userBToken = '';
  let userBId = '';
  let userCToken = '';
  let userCId = '';

  before(async () => {
    await startServer();
  });

  after(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    resetDatabase();
    // Register User A
    const regA = await request('/api/auth/register', {
      method: 'POST',
      body: { username: 'alice', email: 'alice@example.com', password: 'password123' }
    });
    userAToken = regA.body.token;
    userAId = regA.body.user.id;

    // Register User B
    const regB = await request('/api/auth/register', {
      method: 'POST',
      body: { username: 'bob', email: 'bob@example.com', password: 'password123' }
    });
    userBToken = regB.body.token;
    userBId = regB.body.user.id;

    // Register User C
    const regC = await request('/api/auth/register', {
      method: 'POST',
      body: { username: 'charlie', email: 'charlie@example.com', password: 'password123' }
    });
    userCToken = regC.body.token;
    userCId = regC.body.user.id;
  });

  it('SEC-001: Rejects unauthenticated requests to protected endpoints with 401', async () => {
    // Attempt to create post without token
    const postRes = await request('/api/posts', {
      method: 'POST',
      body: { content: 'Unauthorized post' }
    });
    assert.strictEqual(postRes.status, 401);

    // Attempt to edit profile without token
    const editRes = await request('/api/users/me', {
      method: 'PATCH',
      body: { bio: 'Hacker' }
    });
    assert.strictEqual(editRes.status, 401);
  });

  it('SEC-002: Rejects unauthorized post editing with 403 Forbidden', async () => {
    // User A creates post
    const postRes = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: { content: 'Alice post' }
    });
    const postId = postRes.body.post.id;

    // User B attempts to edit Alice post
    const hackEdit = await request(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userBToken}` },
      body: { content: 'Bob overwriting Alice post!' }
    });
    assert.strictEqual(hackEdit.status, 403);
    assert.ok(hackEdit.body.error.includes('Forbidden'));

    // Verify content remained unchanged
    const verifyPost = await request(`/api/posts/${postId}`);
    assert.strictEqual(verifyPost.body.post.content, 'Alice post');
  });

  it('SEC-003: Rejects unauthorized post deletion with 403 Forbidden', async () => {
    const postRes = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: { content: 'Protected post by Alice' }
    });
    const postId = postRes.body.post.id;

    // User B attempts to delete Alice post
    const hackDel = await request(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(hackDel.status, 403);

    // Verify post still exists
    const checkPost = await request(`/api/posts/${postId}`);
    assert.strictEqual(checkPost.status, 200);
  });

  it('SEC-004: Rejects unauthorized comment deletion with 403, allows author or post owner', async () => {
    // Alice creates post
    const postRes = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: { content: 'Alice post' }
    });
    const postId = postRes.body.post.id;

    // Bob comments on Alice post
    const commRes = await request(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userBToken}` },
      body: { content: 'Bob comment' }
    });
    const commentId = commRes.body.comment.id;

    // Charlie (unrelated user) attempts to delete Bob comment -> 403
    const charlieDel = await request(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userCToken}` }
    });
    assert.strictEqual(charlieDel.status, 403);

    // Alice (post author / moderator) CAN delete comment -> 200
    const aliceDel = await request(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert.strictEqual(aliceDel.status, 200);
  });

  it('SEC-005: Prevents a user from following themselves', async () => {
    const selfFollowRes = await request(`/api/users/${userAId}/follow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert.strictEqual(selfFollowRes.status, 400);
    assert.ok(selfFollowRes.body.error.includes('cannot follow yourself'));
  });

  it('SEC-006: Handles repeated like requests idempotently without inflating count', async () => {
    const postRes = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: { content: 'Check this out' }
    });
    const postId = postRes.body.post.id;

    // First like
    const like1 = await request(`/api/posts/${postId}/likes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(like1.status, 201);
    assert.strictEqual(like1.body.likesCount, 1);

    // Second like (duplicate attempt)
    const like2 = await request(`/api/posts/${postId}/likes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(like2.status, 200);
    assert.strictEqual(like2.body.likesCount, 1, 'Like count must remain 1');
  });
});
