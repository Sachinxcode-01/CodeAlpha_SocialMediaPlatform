/**
 * Workflow C: Social Interactions Tests
 * Covers multi-user social interactions: Likes, Comments, and Following graphs.
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { startServer, stopServer, resetDatabase, request } = require('./helpers');

describe('Workflow C: Social Interactions (Likes, Comments, Following)', () => {
  let userAToken = '';
  let userAId = '';
  let userBToken = '';
  let userBId = '';

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
  });

  it('LIKE-001: User B likes and unlikes User A post with authoritative count', async () => {
    // User A creates post
    const postRes = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: { content: 'Alice great update!' }
    });
    const postId = postRes.body.post.id;

    // User B likes post
    const likeRes = await request(`/api/posts/${postId}/likes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(likeRes.status, 201);
    assert.strictEqual(likeRes.body.liked, true);
    assert.strictEqual(likeRes.body.likesCount, 1);

    // Re-query post to ensure like persistence
    const checkPost = await request(`/api/posts/${postId}`, {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(checkPost.body.post.likesCount, 1);
    assert.strictEqual(checkPost.body.post.isLiked, true);

    // User B unlikes post
    const unlikeRes = await request(`/api/posts/${postId}/likes`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(unlikeRes.status, 200);
    assert.strictEqual(unlikeRes.body.liked, false);
    assert.strictEqual(unlikeRes.body.likesCount, 0);
  });

  it('COMM-001 & COMM-002: User B comments on User A post and views comment thread', async () => {
    const postRes = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: { content: 'Check out this discussion!' }
    });
    const postId = postRes.body.post.id;

    // Add comment
    const commentRes = await request(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userBToken}` },
      body: { content: 'This is an insightful point, Alice!' }
    });
    assert.strictEqual(commentRes.status, 201);
    assert.strictEqual(commentRes.body.comment.content, 'This is an insightful point, Alice!');
    assert.strictEqual(commentRes.body.comment.author.username, 'bob');

    // List comments
    const listRes = await request(`/api/posts/${postId}/comments`);
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.comments.length, 1);
    assert.strictEqual(listRes.body.comments[0].content, 'This is an insightful point, Alice!');
  });

  it('FOLLOW-001 & FOLLOW-002: Follow and unfollow user with follower counts', async () => {
    // User B follows User A
    const followRes = await request(`/api/users/${userAId}/follow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(followRes.status, 201);
    assert.strictEqual(followRes.body.following, true);
    assert.strictEqual(followRes.body.followersCount, 1);

    // Verify User A profile has 1 follower
    const profA = await request(`/api/users/${userAId}`, {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(profA.body.user.followersCount, 1);
    assert.strictEqual(profA.body.user.isFollowing, true);

    // Verify User B profile has 1 following
    const profB = await request(`/api/users/${userBId}`);
    assert.strictEqual(profB.body.user.followingCount, 1);

    // Verify followers list of User A
    const followersList = await request(`/api/users/${userAId}/followers`);
    assert.strictEqual(followersList.status, 200);
    assert.strictEqual(followersList.body.followers.length, 1);
    assert.strictEqual(followersList.body.followers[0].username, 'bob');

    // User B unfollows User A
    const unfollowRes = await request(`/api/users/${userAId}/follow`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(unfollowRes.status, 200);
    assert.strictEqual(unfollowRes.body.following, false);
    assert.strictEqual(unfollowRes.body.followersCount, 0);
  });
});
