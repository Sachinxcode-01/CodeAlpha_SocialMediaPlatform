/**
 * Workflow A: Authentication and Profile Tests
 * Covers registration, login, profile view, editing, and logout.
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { startServer, stopServer, resetDatabase, request } = require('./helpers');

describe('Workflow A: Authentication & Profile Operations', () => {
  before(async () => {
    await startServer();
  });

  after(async () => {
    await stopServer();
  });

  beforeEach(() => {
    resetDatabase();
  });

  it('AUTH-001: Registers a user with valid credentials', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'sachin_k',
        email: 'sachin@example.com',
        password: 'securePassword123'
      }
    });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.token, 'Should return a JWT token upon registration');
    assert.strictEqual(res.body.user.username, 'sachin_k');
    assert.strictEqual(res.body.user.email, 'sachin@example.com');
    assert.strictEqual(res.body.user.passwordHash, undefined, 'Must NEVER return password hash');
  });

  it('AUTH-001: Prevents duplicate username or email registration', async () => {
    // First registration
    await request('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'sachin_k',
        email: 'sachin@example.com',
        password: 'password123'
      }
    });

    // Duplicate username attempt
    const dupUserRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'sachin_k',
        email: 'different@example.com',
        password: 'password123'
      }
    });
    assert.strictEqual(dupUserRes.status, 409);
    assert.ok(dupUserRes.body.error.includes('Username is already taken'));

    // Duplicate email attempt
    const dupEmailRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'another_user',
        email: 'sachin@example.com',
        password: 'password123'
      }
    });
    assert.strictEqual(dupEmailRes.status, 409);
    assert.ok(dupEmailRes.body.error.includes('Email address is already registered'));
  });

  it('AUTH-001: Rejects invalid registration inputs', async () => {
    // Short password
    const shortPassRes = await request('/api/auth/register', {
      method: 'POST',
      body: { username: 'testuser', email: 'test@example.com', password: '123' }
    });
    assert.strictEqual(shortPassRes.status, 400);

    // Invalid email
    const badEmailRes = await request('/api/auth/register', {
      method: 'POST',
      body: { username: 'testuser', email: 'notanemail', password: 'password123' }
    });
    assert.strictEqual(badEmailRes.status, 400);

    // Short username
    const shortUserRes = await request('/api/auth/register', {
      method: 'POST',
      body: { username: 'ab', email: 'test@example.com', password: 'password123' }
    });
    assert.strictEqual(shortUserRes.status, 400);
  });

  it('AUTH-002: Logs in an existing user and returns token', async () => {
    await request('/api/auth/register', {
      method: 'POST',
      body: { username: 'sachin_k', email: 'sachin@example.com', password: 'secretPassword123' }
    });

    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { emailOrUsername: 'sachin_k', password: 'secretPassword123' }
    });

    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.body.token);
    assert.strictEqual(loginRes.body.user.username, 'sachin_k');
  });

  it('AUTH-002: Rejects invalid credentials safely', async () => {
    await request('/api/auth/register', {
      method: 'POST',
      body: { username: 'sachin_k', email: 'sachin@example.com', password: 'correctPassword' }
    });

    // Wrong password
    const wrongPassRes = await request('/api/auth/login', {
      method: 'POST',
      body: { emailOrUsername: 'sachin_k', password: 'wrongPassword' }
    });
    assert.strictEqual(wrongPassRes.status, 401);

    // Nonexistent user
    const noUserRes = await request('/api/auth/login', {
      method: 'POST',
      body: { emailOrUsername: 'nonexistent', password: 'somePassword' }
    });
    assert.strictEqual(noUserRes.status, 401);
  });

  it('PROF-001 & PROF-002: Inspects and updates user profile', async () => {
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: { username: 'sachin_k', email: 'sachin@example.com', password: 'password123' }
    });
    const token = regRes.body.token;
    const userId = regRes.body.user.id;

    // View profile
    const viewRes = await request(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(viewRes.status, 200);
    assert.strictEqual(viewRes.body.user.username, 'sachin_k');
    assert.strictEqual(viewRes.body.user.bio, '');
    assert.strictEqual(viewRes.body.user.isSelf, true);

    // Edit profile bio
    const editRes = await request('/api/users/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: { bio: 'Full-stack software developer intern building NovaConnect!' }
    });
    assert.strictEqual(editRes.status, 200);
    assert.strictEqual(editRes.body.user.bio, 'Full-stack software developer intern building NovaConnect!');

    // Re-verify public profile reflects updated bio
    const updatedView = await request(`/api/users/${userId}`);
    assert.strictEqual(updatedView.body.user.bio, 'Full-stack software developer intern building NovaConnect!');
  });
});
