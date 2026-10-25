/**
 * NovaConnect API Client Module
 * Manages JWT tokens in localStorage and performs authenticated REST requests.
 */

const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.tokenKey = 'novaconnect_auth_token';
    this.userKey = 'novaconnect_user_data';
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setSession(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getCurrentUser() {
    const data = localStorage.getItem(this.userKey);
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchConfig = {
      method: options.method || 'GET',
      headers
    };

    if (options.body) {
      fetchConfig.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    try {
      const res = await fetch(url, fetchConfig);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // If 401 Unauthorized occurs on protected call, clear invalid session
        if (res.status === 401 && this.isAuthenticated() && !endpoint.includes('/auth/login')) {
          this.clearSession();
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        const error = new Error(data.error || `HTTP error ${res.status}`);
        error.status = res.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  // Auth Methods
  register(username, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: { username, email, password }
    });
  }

  login(emailOrUsername, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { emailOrUsername, password }
    });
  }

  logout() {
    this.clearSession();
    return this.request('/auth/logout', { method: 'POST' }).catch(() => {});
  }

  getMe() {
    return this.request('/auth/me');
  }

  // User Profile Methods
  getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  updateProfile(profileData) {
    // Accepts either an object { displayName, avatarUrl, bannerUrl, bio, location, website, clearAll } or string bio
    const body = typeof profileData === 'string' ? { bio: profileData } : (profileData || {});
    return this.request('/users/me', {
      method: 'PATCH',
      body
    });
  }

  getUserPosts(userId) {
    return this.request(`/users/${userId}/posts`);
  }

  getFollowers(userId) {
    return this.request(`/users/${userId}/followers`);
  }

  getFollowing(userId) {
    return this.request(`/users/${userId}/following`);
  }

  // Posts & Feed Methods
  getFeed(feedType = 'all') {
    return this.request(`/posts?feed=${encodeURIComponent(feedType)}`);
  }

  getPost(postId) {
    return this.request(`/posts/${postId}`);
  }

  createPost(content, imageUrl = null) {
    return this.request('/posts', {
      method: 'POST',
      body: { content, imageUrl }
    });
  }

  editPost(postId, content, imageUrl = undefined) {
    return this.request(`/posts/${postId}`, {
      method: 'PATCH',
      body: { content, imageUrl }
    });
  }

  deletePost(postId) {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE'
    });
  }

  // Likes Methods
  likePost(postId) {
    return this.request(`/posts/${postId}/likes`, {
      method: 'POST'
    });
  }

  unlikePost(postId) {
    return this.request(`/posts/${postId}/likes`, {
      method: 'DELETE'
    });
  }

  // Comments Methods
  getComments(postId) {
    return this.request(`/posts/${postId}/comments`);
  }

  addComment(postId, content) {
    return this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: { content }
    });
  }

  deleteComment(commentId) {
    return this.request(`/comments/${commentId}`, {
      method: 'DELETE'
    });
  }

  // Following Methods
  followUser(userId) {
    return this.request(`/users/${userId}/follow`, {
      method: 'POST'
    });
  }

  unfollowUser(userId) {
    return this.request(`/users/${userId}/follow`, {
      method: 'DELETE'
    });
  }
}

// Export singleton instance
window.api = new ApiClient();
