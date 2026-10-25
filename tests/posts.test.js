/**
 * Workflow B: Posts & Feed Tests
 * Covers post authoring, feed retrieval, editing, and deletion.
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { startServer, stopServer, resetDatabase, request } = require('./helpers');

describe('Workflow B: Posts and Feed Operations', () => {
  let userToken = '';
  let userId = '';

  before(async () => {
    await startServer();
  });

  after(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    resetDatabase();
    const reg = await request('/api/auth/register', {
      method: 'POST',
      body: { username: 'author_one', email: 'author@example.com', password: 'password123' }
    });
    userToken = reg.body.token;
    userId = reg.body.user.id;
  });

  it('POST-001: Creates a post successfully', async () => {
    const res = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { content: 'Hello world, this is my first post on NovaConnect!' }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.post.content, 'Hello world, this is my first post on NovaConnect!');
    assert.strictEqual(res.body.post.author.username, 'author_one');
    assert.strictEqual(res.body.post.likesCount, 0);
    assert.strictEqual(res.body.post.commentsCount, 0);
  });

  it('POST-001: Rejects empty or overly long post content', async () => {
    // Empty content
    const emptyRes = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { content: '   ' }
    });
    assert.strictEqual(emptyRes.status, 400);

    // Overly long content (> 500 chars)
    const longContent = 'A'.repeat(501);
    const longRes = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { content: longContent }
    });
    assert.strictEqual(longRes.status, 400);
  });

  it('POST-002 & FEED-001: Retrieves posts in feed with author metadata', async () => {
    // Create multiple posts
    await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { content: 'First post' }
    });
    await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { content: 'Second post' }
    });

    const feedRes = await request('/api/posts', {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    assert.strictEqual(feedRes.status, 200);
    assert.strictEqual(feedRes.body.posts.length, 2);
    // Chronological order: newest first
    assert.strictEqual(feedRes.body.posts[0].content, 'Second post');
    assert.strictEqual(feedRes.body.posts[1].content, 'First post');
  });

  it('POST-003: Edits an owned post', async () => {
    const postRes = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { content: 'Original content before edit' }
    });
    const postId = postRes.body.post.id;

    const editRes = await request(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { content: 'Updated content after edit' }
    });

    assert.strictEqual(editRes.status, 200);
    assert.strictEqual(editRes.body.post.content, 'Updated content after edit');
  });

  it('POST-003: Deletes an owned post and removes it from feed', async () => {
    const postRes = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { content: 'Post to be deleted' }
    });
    const postId = postRes.body.post.id;

    const delRes = await request(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });

    assert.strictEqual(delRes.status, 200);

    // Verify post is no longer in feed
    const feedRes = await request('/api/posts');
    assert.strictEqual(feedRes.body.posts.length, 0);

    // Verify 404 when querying directly
    const getRes = await request(`/api/posts/${postId}`);
    assert.strictEqual(getRes.status, 404);
  });

  it('POST-PHOTO-001: Creates a post with an attached photo URL and verifies in feed and single post', async () => {
    const testImageUrl = 'https://images.unsplash.com/photo-1518770660439-4636190af475';
    const postRes = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { 
        content: 'Check out my new development setup!',
        imageUrl: testImageUrl
      }
    });

    assert.strictEqual(postRes.status, 201);
    assert.strictEqual(postRes.body.post.imageUrl, testImageUrl);
    const postId = postRes.body.post.id;

    // Verify in explore feed
    const feedRes = await request('/api/posts');
    assert.strictEqual(feedRes.status, 200);
    assert.strictEqual(feedRes.body.posts[0].imageUrl, testImageUrl);

    // Verify in single post query (used by Share permalink ?post=:id)
    const singleRes = await request(`/api/posts/${postId}`);
    assert.strictEqual(singleRes.status, 200);
    assert.strictEqual(singleRes.body.post.id, postId);
    assert.strictEqual(singleRes.body.post.imageUrl, testImageUrl);
    assert.strictEqual(singleRes.body.post.author.username, 'author_one');
  });

  it('POST-PHOTO-002: Updates a post photo and content', async () => {
    const initRes = await request('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { 
        content: 'Initial text without photo'
      }
    });
    const postId = initRes.body.post.id;
    assert.strictEqual(initRes.body.post.imageUrl, null);

    // Edit to attach photo
    const updatedImageUrl = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6';
    const editRes = await request(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { 
        content: 'Updated text with photo',
        imageUrl: updatedImageUrl
      }
    });

    assert.strictEqual(editRes.status, 200);
    assert.strictEqual(editRes.body.post.content, 'Updated text with photo');
    assert.strictEqual(editRes.body.post.imageUrl, updatedImageUrl);

    // Remove photo
    const removePhotoRes = await request(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { 
        content: 'Updated text with photo removed',
        imageUrl: null
      }
    });

    assert.strictEqual(removePhotoRes.status, 200);
    assert.strictEqual(removePhotoRes.body.post.imageUrl, null);
  });
});
