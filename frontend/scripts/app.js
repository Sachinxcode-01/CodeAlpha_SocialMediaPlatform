/**
 * NovaConnect Main Application Script
 * Orchestrates UI state, DOM rendering, event handling, and real-time updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    currentUser: window.api.getCurrentUser(),
    currentFeed: 'all', // 'all' or 'following'
    posts: [],
    activeModal: null,
    currentComposerPhoto: '',
    currentEditAvatar: '',
    currentEditBanner: '',
    cachedCurrentUserProfile: null
  };

  // DOM Elements Cache
  const elements = {
    authControls: document.getElementById('auth-controls'),
    sidebarUserCard: document.getElementById('sidebar-user-card'),
    composerContainer: document.getElementById('composer-container'),
    composerAvatar: document.getElementById('composer-user-avatar'),
    composerForm: document.getElementById('create-post-form'),
    postContentInput: document.getElementById('post-content-input'),
    composerCharCount: document.getElementById('composer-char-count'),
    composerPhotoPreview: document.getElementById('composer-photo-preview'),
    composerPreviewImg: document.getElementById('composer-preview-img'),
    btnRemovePhoto: document.getElementById('btn-remove-photo'),
    composerPhotoUrlWrap: document.getElementById('composer-photo-url-wrap'),
    postPhotoUrlInput: document.getElementById('post-photo-url-input'),
    postPhotoFileInput: document.getElementById('post-photo-file-input'),
    btnTriggerUpload: document.getElementById('btn-trigger-upload'),
    btnToggleUrl: document.getElementById('btn-toggle-url'),
    postsContainer: document.getElementById('posts-container'),
    tabExplore: document.getElementById('tab-explore'),
    tabFollowing: document.getElementById('tab-following'),
    currentFeedHeading: document.getElementById('current-feed-heading'),
    btnRefreshFeed: document.getElementById('btn-refresh-feed'),
    suggestedList: document.getElementById('suggested-list'),
    brandLogo: document.getElementById('brand-logo'),

    // Modals
    authModal: document.getElementById('auth-modal'),
    closeAuthModal: document.getElementById('close-auth-modal'),
    authTabLogin: document.getElementById('auth-tab-login'),
    authTabRegister: document.getElementById('auth-tab-register'),
    formLogin: document.getElementById('form-login'),
    formRegister: document.getElementById('form-register'),
    loginErrorMsg: document.getElementById('login-error-msg'),
    registerErrorMsg: document.getElementById('register-error-msg'),

    profileModal: document.getElementById('profile-modal'),
    closeProfileModal: document.getElementById('close-profile-modal'),
    profileModalContent: document.getElementById('profile-modal-content'),

    editProfileModal: document.getElementById('edit-profile-modal'),
    closeEditProfileModal: document.getElementById('close-edit-profile-modal'),
    btnCancelEditProfile: document.getElementById('btn-cancel-edit-profile'),
    formEditProfile: document.getElementById('form-edit-profile'),
    editBannerPreview: document.getElementById('edit-banner-preview'),
    editBannerPreviewImg: document.getElementById('edit-banner-preview-img'),
    editBannerFileInput: document.getElementById('edit-banner-file-input'),
    btnUploadBanner: document.getElementById('btn-upload-banner'),
    editBannerUrlInput: document.getElementById('edit-banner-url-input'),
    btnRemoveBanner: document.getElementById('btn-remove-banner'),
    editAvatarPreview: document.getElementById('edit-avatar-preview'),
    editAvatarPreviewImg: document.getElementById('edit-avatar-preview-img'),
    editAvatarPlaceholder: document.getElementById('edit-avatar-placeholder'),
    editAvatarFileInput: document.getElementById('edit-avatar-file-input'),
    btnUploadAvatar: document.getElementById('btn-upload-avatar'),
    editAvatarUrlInput: document.getElementById('edit-avatar-url-input'),
    btnRemoveAvatar: document.getElementById('btn-remove-avatar'),
    editDisplayNameInput: document.getElementById('edit-display-name-input'),
    editLocationInput: document.getElementById('edit-location-input'),
    editWebsiteInput: document.getElementById('edit-website-input'),
    editBioInput: document.getElementById('edit-bio-input'),
    editBioCharCount: document.getElementById('edit-bio-char-count'),
    btnClearAllProfile: document.getElementById('btn-clear-all-profile'),
    editProfileErrorMsg: document.getElementById('edit-profile-error-msg'),

    editPostModal: document.getElementById('edit-post-modal'),
    closeEditPostModal: document.getElementById('close-edit-post-modal'),
    btnCancelEditPost: document.getElementById('btn-cancel-edit-post'),
    formEditPost: document.getElementById('form-edit-post'),
    editPostId: document.getElementById('edit-post-id'),
    editPostContentInput: document.getElementById('edit-post-content-input'),
    editPostImageInput: document.getElementById('edit-post-image-input'),
    editPostCharCount: document.getElementById('edit-post-char-count'),
    editPostErrorMsg: document.getElementById('edit-post-error-msg'),

    singlePostModal: document.getElementById('single-post-modal'),
    closeSinglePostModal: document.getElementById('close-single-post-modal'),
    singlePostModalContent: document.getElementById('single-post-modal-content'),

    usersListModal: document.getElementById('users-list-modal'),
    closeUsersListModal: document.getElementById('close-users-list-modal'),
    usersListTitle: document.getElementById('users-list-title'),
    usersListContainer: document.getElementById('users-list-container'),

    toastHub: document.getElementById('toast-hub')
  };

  // Helper Utilities
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    elements.toastHub.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  function formatRelativeTime(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 5) return 'just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return past.toLocaleDateString();
  }

  function openModal(modalEl) {
    if (state.activeModal) closeModal(state.activeModal);
    modalEl.classList.add('open');
    modalEl.setAttribute('aria-hidden', 'false');
    state.activeModal = modalEl;
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    modalEl.setAttribute('aria-hidden', 'true');
    state.activeModal = null;
  }

  // Session & Authentication UI Synchronization
  function updateAuthUI() {
    state.currentUser = window.api.getCurrentUser();

    if (state.currentUser) {
      // Header: user pill and logout
      elements.authControls.innerHTML = `
        <button class="btn btn-ghost btn-sm" id="btn-header-profile">
          <div class="avatar" style="width:26px;height:26px;font-size:0.75rem;">
            ${escapeHtml(state.currentUser.username.charAt(0).toUpperCase())}
          </div>
          @${escapeHtml(state.currentUser.username)}
        </button>
        <button class="btn btn-ghost btn-sm" id="btn-logout" title="Log out">
          Log Out
        </button>
      `;

      document.getElementById('btn-header-profile').onclick = () => openUserProfile(state.currentUser.id);
      document.getElementById('btn-logout').onclick = handleLogout;

      // Composer avatar
      elements.composerAvatar.textContent = state.currentUser.username.charAt(0).toUpperCase();
      elements.composerContainer.style.display = 'block';

      // Left Sidebar User Profile Card
      renderSidebarProfile();
    } else {
      // Unauthenticated state
      elements.authControls.innerHTML = `
        <button class="btn btn-ghost btn-sm" id="btn-open-login">Log In</button>
        <button class="btn btn-primary btn-sm" id="btn-open-register">Sign Up</button>
      `;

      document.getElementById('btn-open-login').onclick = () => {
        switchAuthTab('login');
        openModal(elements.authModal);
      };
      document.getElementById('btn-open-register').onclick = () => {
        switchAuthTab('register');
        openModal(elements.authModal);
      };

      elements.composerContainer.style.display = 'none';

      elements.sidebarUserCard.innerHTML = `
        <div class="user-card-profile">
          <div class="user-avatar-lg">NC</div>
          <h3 class="user-display-name">Welcome to NovaConnect</h3>
          <p class="user-bio-text">Join the social platform for developers. Share updates, join discussions, and follow creators.</p>
          <button class="btn btn-primary btn-block" id="btn-sidebar-join">Join Community</button>
        </div>
      `;
      document.getElementById('btn-sidebar-join').onclick = () => {
        switchAuthTab('register');
        openModal(elements.authModal);
      };
    }
  }

  async function renderSidebarProfile() {
    if (!state.currentUser) return;
    try {
      const data = await window.api.getUser(state.currentUser.id);
      const user = data.user;
      state.cachedCurrentUserProfile = user;

      // Update composer user avatar if present
      if (elements.composerAvatar) {
        if (user.avatarUrl) {
          elements.composerAvatar.innerHTML = `<img src="${escapeHtml(user.avatarUrl)}" class="avatar-img" alt="${escapeHtml(user.username)}">`;
        } else {
          elements.composerAvatar.textContent = (user.displayName || user.username).charAt(0).toUpperCase();
        }
      }

      const hasMeta = user.location || user.website;

      elements.sidebarUserCard.innerHTML = `
        <div class="user-card-profile">
          ${user.bannerUrl 
            ? `<div class="user-card-banner" style="background-image: url('${escapeHtml(user.bannerUrl)}')"></div>` 
            : `<div class="user-card-banner"></div>`
          }
          <div class="user-avatar-lg">
            ${user.avatarUrl 
              ? `<img src="${escapeHtml(user.avatarUrl)}" class="avatar-img" alt="${escapeHtml(user.username)}">` 
              : escapeHtml((user.displayName || user.username).charAt(0).toUpperCase())
            }
          </div>
          <h3 class="user-display-name">${escapeHtml(user.displayName || user.username)}</h3>
          <div class="user-handle">@${escapeHtml(user.username)}</div>
          
          <p class="user-bio-text">${user.bio ? escapeHtml(user.bio) : '<em>No bio yet. Click below to set up your profile!</em>'}</p>

          ${hasMeta ? `
            <div class="profile-meta-row">
              ${user.location ? `
                <span class="profile-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  ${escapeHtml(user.location)}
                </span>
              ` : ''}
              ${user.website ? `
                <span class="profile-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  <a href="${escapeHtml(user.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(user.website.replace(/^https?:\/\//, ''))}</a>
                </span>
              ` : ''}
            </div>
          ` : ''}

          <button class="btn btn-ghost btn-sm btn-block" id="btn-sidebar-edit-bio">Set Up Profile</button>
          
          <div class="user-stats-grid">
            <div class="stat-item" id="sidebar-stat-posts">
              <span class="stat-num">${user.postsCount}</span>
              <span class="stat-label">Posts</span>
            </div>
            <div class="stat-item" id="sidebar-stat-followers">
              <span class="stat-num">${user.followersCount}</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat-item" id="sidebar-stat-following">
              <span class="stat-num">${user.followingCount}</span>
              <span class="stat-label">Following</span>
            </div>
          </div>
        </div>
      `;

      document.getElementById('btn-sidebar-edit-bio').onclick = () => openEditProfileModal(user);
      document.getElementById('sidebar-stat-followers').onclick = () => openUsersListModal('followers', user.id, user.username);
      document.getElementById('sidebar-stat-following').onclick = () => openUsersListModal('following', user.id, user.username);
      document.getElementById('sidebar-stat-posts').onclick = () => openUserProfile(user.id);
    } catch (err) {
      console.error('Failed to load sidebar user profile:', err);
    }
  }

  function handleLogout() {
    window.api.logout();
    updateAuthUI();
    showToast('You have been logged out.');
    loadFeed();
  }

  function switchAuthTab(tab) {
    if (tab === 'login') {
      elements.authTabLogin.classList.add('active');
      elements.authTabRegister.classList.remove('active');
      elements.formLogin.classList.add('active');
      elements.formRegister.classList.remove('active');
      elements.loginErrorMsg.textContent = '';
    } else {
      elements.authTabRegister.classList.add('active');
      elements.authTabLogin.classList.remove('active');
      elements.formRegister.classList.add('active');
      elements.formLogin.classList.remove('active');
      elements.registerErrorMsg.textContent = '';
    }
  }

  // Auth Form Handlers
  elements.formLogin.onsubmit = async (e) => {
    e.preventDefault();
    elements.loginErrorMsg.textContent = '';
    const idVal = document.getElementById('login-identifier').value.trim();
    const passVal = document.getElementById('login-password').value;

    try {
      const res = await window.api.login(idVal, passVal);
      window.api.setSession(res.token, res.user);
      closeModal(elements.authModal);
      elements.formLogin.reset();
      updateAuthUI();
      showToast(`Welcome back, @${res.user.username}!`);
      loadFeed();
    } catch (err) {
      elements.loginErrorMsg.textContent = err.message || 'Login failed.';
    }
  };

  elements.formRegister.onsubmit = async (e) => {
    e.preventDefault();
    elements.registerErrorMsg.textContent = '';
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
      const res = await window.api.register(username, email, password);
      window.api.setSession(res.token, res.user);
      closeModal(elements.authModal);
      elements.formRegister.reset();
      updateAuthUI();
      showToast(`Account created! Welcome to NovaConnect, @${res.user.username}!`);
      loadFeed();
    } catch (err) {
      elements.registerErrorMsg.textContent = err.message || 'Registration failed.';
    }
  };

  // Feed Operations
  async function loadFeed() {
    elements.postsContainer.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <h4>Loading updates...</h4>
      </div>
    `;

    try {
      const res = await window.api.getFeed(state.currentFeed);
      state.posts = res.posts || [];
      renderFeed();
      loadSuggestedUsers();
    } catch (err) {
      elements.postsContainer.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <h4>Unable to load posts</h4>
          <p class="text-muted">${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }

  function renderFeed() {
    if (!state.posts.length) {
      elements.postsContainer.innerHTML = `
        <div class="empty-state glass-panel">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <h4>No posts here yet</h4>
          <p class="text-muted">${state.currentFeed === 'following' ? 'Follow other members to see their posts here.' : 'Be the first to publish a post!'}</p>
        </div>
      `;
      return;
    }

    elements.postsContainer.innerHTML = '';
    state.posts.forEach(post => {
      elements.postsContainer.appendChild(createPostCardElement(post));
    });
  }

  function copyShareUrl(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => showToast('Post link copied to clipboard!'))
        .catch(() => prompt('Copy post link:', url));
    } else {
      prompt('Copy post link:', url);
    }
  }

  // Construct Post Card DOM Element
  function createPostCardElement(post, options = {}) {
    const card = document.createElement('article');
    card.className = 'post-card glass-panel';
    card.id = `post-${post.id}`;

    // Header
    const header = document.createElement('div');
    header.className = 'post-header';

    const authorInfo = document.createElement('div');
    authorInfo.className = 'post-author-info';
    authorInfo.onclick = () => openUserProfile(post.author.id);

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.style.width = '36px';
    avatar.style.height = '36px';
    avatar.style.fontSize = '0.85rem';
    avatar.style.overflow = 'hidden';
    if (post.author.avatarUrl) {
      avatar.innerHTML = `<img src="${escapeHtml(post.author.avatarUrl)}" class="avatar-img" alt="${escapeHtml(post.author.username)}">`;
    } else {
      avatar.textContent = (post.author.displayName || post.author.username).charAt(0).toUpperCase();
    }

    const nameCol = document.createElement('div');
    const nameSpan = document.createElement('div');
    nameSpan.className = 'post-author-name';
    if (post.author.displayName && post.author.displayName !== post.author.username) {
      nameSpan.innerHTML = `${escapeHtml(post.author.displayName)} <span class="text-muted" style="font-weight:400;font-size:0.8rem;">@${escapeHtml(post.author.username)}</span>`;
    } else {
      nameSpan.textContent = `@${post.author.username}`;
    }

    const timeSpan = document.createElement('div');
    timeSpan.className = 'post-time';
    timeSpan.textContent = formatRelativeTime(post.createdAt);

    nameCol.appendChild(nameSpan);
    nameCol.appendChild(timeSpan);
    authorInfo.appendChild(avatar);
    authorInfo.appendChild(nameCol);
    header.appendChild(authorInfo);

    // If author, show edit / delete controls
    if (state.currentUser && state.currentUser.id === post.author.id) {
      const menu = document.createElement('div');
      menu.className = 'post-menu-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-ghost btn-sm';
      editBtn.textContent = 'Edit';
      editBtn.onclick = (e) => {
        e.stopPropagation();
        openEditPostModal(post.id, post.content, post.imageUrl);
      };

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger btn-sm';
      delBtn.textContent = 'Delete';
      delBtn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this post?')) {
          try {
            await window.api.deletePost(post.id);
            card.remove();
            showToast('Post deleted successfully.');
            if (state.currentUser) renderSidebarProfile();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      };

      menu.appendChild(editBtn);
      menu.appendChild(delBtn);
      header.appendChild(menu);
    }

    // Content (XSS safe via textContent)
    const contentP = document.createElement('div');
    contentP.className = 'post-content';
    contentP.textContent = post.content;

    // Post Photo Attachment (if present)
    let photoWrap = null;
    if (post.imageUrl) {
      photoWrap = document.createElement('div');
      photoWrap.className = 'post-photo-wrap';
      const img = document.createElement('img');
      img.className = 'post-photo';
      img.src = post.imageUrl;
      img.alt = `Photo shared by @${post.author.username}`;
      img.loading = 'lazy';
      img.onclick = () => openSinglePostModal(post.id);
      photoWrap.appendChild(img);
    }

    // Actions Row (Likes, Comments, Share)
    const actionsRow = document.createElement('div');
    actionsRow.className = 'post-actions';

    const likeBtn = document.createElement('button');
    likeBtn.className = `action-btn ${post.isLiked ? 'liked' : ''}`;
    likeBtn.title = post.isLiked ? 'Unlike post' : 'Like post';
    likeBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${post.isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span class="like-counter">${post.likesCount}</span>
    `;
    likeBtn.onclick = async () => {
      if (!state.currentUser) {
        showToast('Please log in to like posts.', 'error');
        switchAuthTab('login');
        openModal(elements.authModal);
        return;
      }
      try {
        if (post.isLiked) {
          const res = await window.api.unlikePost(post.id);
          post.isLiked = false;
          post.likesCount = res.likesCount;
          likeBtn.classList.remove('liked');
          likeBtn.querySelector('svg').setAttribute('fill', 'none');
          likeBtn.querySelector('.like-counter').textContent = res.likesCount;
        } else {
          const res = await window.api.likePost(post.id);
          post.isLiked = true;
          post.likesCount = res.likesCount;
          likeBtn.classList.add('liked');
          likeBtn.querySelector('svg').setAttribute('fill', 'currentColor');
          likeBtn.querySelector('.like-counter').textContent = res.likesCount;
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    const commentBtn = document.createElement('button');
    commentBtn.className = 'action-btn';
    commentBtn.title = 'View comments';
    commentBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
      <span class="comment-counter">${post.commentsCount}</span>
    `;

    // Share Button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'action-btn share-btn';
    shareBtn.title = 'Share post link';
    shareBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
      </svg>
      <span>Share</span>
    `;
    shareBtn.onclick = async (e) => {
      e.stopPropagation();
      const shareUrl = `${window.location.origin}/?post=${post.id}`;
      const shareData = {
        title: `NovaConnect Post by @${post.author.username}`,
        text: post.content ? post.content.substring(0, 100) : 'Check out this post on NovaConnect',
        url: shareUrl
      };
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          showToast('Post shared!');
        } catch (err) {
          if (err.name !== 'AbortError') {
            copyShareUrl(shareUrl);
          }
        }
      } else {
        copyShareUrl(shareUrl);
      }
    };

    // Comments Container
    const commentsSec = document.createElement('div');
    commentsSec.className = 'comments-container';

    commentBtn.onclick = () => {
      const isOpen = commentsSec.classList.toggle('open');
      if (isOpen) {
        loadCommentsForPost(post.id, commentsSec);
      }
    };

    actionsRow.appendChild(likeBtn);
    actionsRow.appendChild(commentBtn);
    actionsRow.appendChild(shareBtn);

    card.appendChild(header);
    card.appendChild(contentP);
    if (photoWrap) card.appendChild(photoWrap);
    card.appendChild(actionsRow);
    card.appendChild(commentsSec);

    if (options && options.expandComments) {
      commentsSec.classList.add('open');
      loadCommentsForPost(post.id, commentsSec);
    }

    return card;
  }

  // Load and Render Comments for Post
  async function loadCommentsForPost(postId, container) {
    container.innerHTML = '<p class="text-muted" style="padding:0.5rem 0;">Loading comments...</p>';
    try {
      const res = await window.api.getComments(postId);
      const comments = res.comments || [];

      container.innerHTML = '';

      // Comment Form (if authenticated)
      if (state.currentUser) {
        const form = document.createElement('form');
        form.className = 'comment-form';
        form.innerHTML = `
          <input type="text" class="comment-input" placeholder="Write a comment..." maxlength="300" required>
          <button type="submit" class="btn btn-primary btn-sm">Reply</button>
        `;
        form.onsubmit = async (e) => {
          e.preventDefault();
          const input = form.querySelector('.comment-input');
          const text = input.value.trim();
          if (!text) return;
          try {
            const added = await window.api.addComment(postId, text);
            input.value = '';
            showToast('Comment added!');
            // Prepend new comment
            loadCommentsForPost(postId, container);
            // Update counter in card
            const postCard = document.getElementById(`post-${postId}`);
            if (postCard) {
              const counter = postCard.querySelector('.comment-counter');
              if (counter) counter.textContent = parseInt(counter.textContent || 0) + 1;
            }
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
        container.appendChild(form);
      }

      // Comments List
      const list = document.createElement('div');
      list.className = 'comments-list';

      if (!comments.length) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'text-muted';
        emptyMsg.style.fontSize = '0.85rem';
        emptyMsg.textContent = 'No comments yet. Start the conversation!';
        list.appendChild(emptyMsg);
      } else {
        comments.forEach(comment => {
          const item = document.createElement('div');
          item.className = 'comment-item';

          const body = document.createElement('div');
          body.className = 'comment-body';

          const head = document.createElement('div');
          head.className = 'comment-header';

          const author = document.createElement('span');
          author.className = 'comment-author';
          author.textContent = `@${comment.author.username}`;
          author.onclick = () => openUserProfile(comment.author.id);

          const time = document.createElement('span');
          time.className = 'comment-time';
          time.textContent = formatRelativeTime(comment.createdAt);

          head.appendChild(author);
          head.appendChild(time);

          const txt = document.createElement('p');
          txt.className = 'comment-text';
          txt.textContent = comment.content;

          body.appendChild(head);
          body.appendChild(txt);
          item.appendChild(body);

          // Delete comment if authorized
          if (comment.canDelete) {
            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-ghost btn-sm';
            delBtn.style.color = 'var(--negative)';
            delBtn.innerHTML = '&times;';
            delBtn.title = 'Delete comment';
            delBtn.onclick = async () => {
              if (confirm('Delete this comment?')) {
                try {
                  await window.api.deleteComment(comment.id);
                  item.remove();
                  showToast('Comment deleted.');
                  const postCard = document.getElementById(`post-${postId}`);
                  if (postCard) {
                    const counter = postCard.querySelector('.comment-counter');
                    if (counter) {
                      const cur = parseInt(counter.textContent || 1);
                      counter.textContent = Math.max(0, cur - 1);
                    }
                  }
                } catch (err) {
                  showToast(err.message, 'error');
                }
              }
            };
            item.appendChild(delBtn);
          }

          list.appendChild(item);
        });
      }

      container.appendChild(list);
    } catch (err) {
      container.innerHTML = `<p class="text-muted">Failed to load comments: ${escapeHtml(err.message)}</p>`;
    }
  }

  // Photo Composer Helpers
  function setComposerPhoto(dataUrlOrUrl) {
    state.currentComposerPhoto = dataUrlOrUrl;
    elements.composerPreviewImg.src = dataUrlOrUrl;
    elements.composerPhotoPreview.style.display = 'block';
  }

  function clearComposerPhoto() {
    state.currentComposerPhoto = '';
    elements.composerPreviewImg.src = '';
    elements.composerPhotoPreview.style.display = 'none';
    elements.postPhotoFileInput.value = '';
    elements.postPhotoUrlInput.value = '';
    elements.composerPhotoUrlWrap.style.display = 'none';
  }

  // Photo Attachment Controls
  elements.btnTriggerUpload.onclick = () => {
    elements.postPhotoFileInput.click();
  };

  elements.postPhotoFileInput.onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image file size must be under 5MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setComposerPhoto(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  elements.btnToggleUrl.onclick = () => {
    const isVisible = elements.composerPhotoUrlWrap.style.display !== 'none';
    elements.composerPhotoUrlWrap.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      elements.postPhotoUrlInput.focus();
    }
  };

  elements.postPhotoUrlInput.onchange = () => {
    const url = elements.postPhotoUrlInput.value.trim();
    if (url) {
      setComposerPhoto(url);
    }
  };

  elements.btnRemovePhoto.onclick = () => {
    clearComposerPhoto();
  };

  // Create Post Form Submission
  elements.composerForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!state.currentUser) {
      showToast('Please log in to publish posts.', 'error');
      openModal(elements.authModal);
      return;
    }

    const content = elements.postContentInput.value.trim();
    if (!content) return;

    try {
      const res = await window.api.createPost(content, state.currentComposerPhoto || undefined);
      elements.postContentInput.value = '';
      elements.composerCharCount.textContent = '0 / 500';
      clearComposerPhoto();
      showToast('Your post is live!');

      // Prepend to feed
      const card = createPostCardElement(res.post);
      if (elements.postsContainer.querySelector('.empty-state')) {
        elements.postsContainer.innerHTML = '';
      }
      elements.postsContainer.prepend(card);
      renderSidebarProfile();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  elements.postContentInput.oninput = () => {
    const len = elements.postContentInput.value.length;
    elements.composerCharCount.textContent = `${len} / 500`;
  };

  // Edit Post Modal
  function openEditPostModal(postId, content, imageUrl = '') {
    elements.editPostId.value = postId;
    elements.editPostContentInput.value = content;
    elements.editPostImageInput.value = imageUrl || '';
    elements.editPostCharCount.textContent = `${content.length} / 500`;
    elements.editPostErrorMsg.textContent = '';
    openModal(elements.editPostModal);
  }

  elements.editPostContentInput.oninput = () => {
    const len = elements.editPostContentInput.value.length;
    elements.editPostCharCount.textContent = `${len} / 500`;
  };

  elements.formEditPost.onsubmit = async (e) => {
    e.preventDefault();
    const postId = elements.editPostId.value;
    const content = elements.editPostContentInput.value.trim();
    const imageUrl = elements.editPostImageInput.value.trim() || null;
    if (!content) return;

    try {
      const res = await window.api.editPost(postId, content, imageUrl);
      closeModal(elements.editPostModal);
      showToast('Post updated successfully.');

      // Update post card in feed
      const card = document.getElementById(`post-${postId}`);
      if (card) {
        card.querySelector('.post-content').textContent = res.post.content;
        let photoWrap = card.querySelector('.post-photo-wrap');
        if (res.post.imageUrl) {
          if (!photoWrap) {
            photoWrap = document.createElement('div');
            photoWrap.className = 'post-photo-wrap';
            const img = document.createElement('img');
            img.className = 'post-photo';
            img.src = res.post.imageUrl;
            img.alt = 'Post photo attachment';
            img.onclick = () => openSinglePostModal(res.post.id);
            photoWrap.appendChild(img);
            card.insertBefore(photoWrap, card.querySelector('.post-actions'));
          } else {
            photoWrap.querySelector('img').src = res.post.imageUrl;
          }
        } else if (photoWrap) {
          photoWrap.remove();
        }
      }
    } catch (err) {
      elements.editPostErrorMsg.textContent = err.message;
    }
  };

  // Single / Shared Post Modal
  async function openSinglePostModal(postId) {
    elements.singlePostModalContent.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <h4>Loading post...</h4>
      </div>
    `;
    openModal(elements.singlePostModal);
    window.history.pushState(null, '', `/?post=${postId}`);

    try {
      const res = await window.api.getPost(postId);
      elements.singlePostModalContent.innerHTML = '';
      const postCard = createPostCardElement(res.post, { expandComments: true });
      elements.singlePostModalContent.appendChild(postCard);
    } catch (err) {
      elements.singlePostModalContent.innerHTML = `
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <h4>Post not found</h4>
          <p class="text-muted">${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }

  // User Profile Modal
  async function openUserProfile(userId) {
    elements.profileModalContent.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <h4>Loading profile...</h4>
      </div>
    `;
    openModal(elements.profileModal);

    try {
      const [profileData, postsData] = await Promise.all([
        window.api.getUser(userId),
        window.api.getUserPosts(userId)
      ]);
      const user = profileData.user;
      const posts = postsData.posts || [];

      const hasMeta = user.location || user.website;

      elements.profileModalContent.innerHTML = `
        <div class="user-card-profile" style="margin-bottom:1.5rem;">
          ${user.bannerUrl 
            ? `<div class="user-card-banner" style="background-image: url('${escapeHtml(user.bannerUrl)}')"></div>` 
            : `<div class="user-card-banner"></div>`
          }
          <div class="user-avatar-lg">
            ${user.avatarUrl 
              ? `<img src="${escapeHtml(user.avatarUrl)}" class="avatar-img" alt="${escapeHtml(user.username)}">` 
              : escapeHtml((user.displayName || user.username).charAt(0).toUpperCase())
            }
          </div>
          <h2 class="user-display-name">${escapeHtml(user.displayName || user.username)}</h2>
          <div class="user-handle">@${escapeHtml(user.username)}</div>

          <p class="user-bio-text">${user.bio ? escapeHtml(user.bio) : '<em>No bio provided yet.</em>'}</p>

          ${hasMeta ? `
            <div class="profile-meta-row">
              ${user.location ? `
                <span class="profile-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  ${escapeHtml(user.location)}
                </span>
              ` : ''}
              ${user.website ? `
                <span class="profile-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  <a href="${escapeHtml(user.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(user.website.replace(/^https?:\/\//, ''))}</a>
                </span>
              ` : ''}
            </div>
          ` : ''}

          <p class="post-time" style="margin-bottom:1rem;">Member since ${new Date(user.createdAt).toLocaleDateString()}</p>
          
          <div id="profile-action-container" style="margin-bottom:1rem;">
            ${user.isSelf 
              ? `<button class="btn btn-ghost btn-sm" id="btn-modal-edit-bio">Set Up Profile</button>`
              : `<button class="btn ${user.isFollowing ? 'btn-ghost' : 'btn-primary'} btn-sm" id="btn-modal-follow-toggle">
                  ${user.isFollowing ? 'Unfollow' : 'Follow User'}
                 </button>`
            }
          </div>

          <div class="user-stats-grid">
            <div class="stat-item" id="modal-stat-posts">
              <span class="stat-num">${user.postsCount}</span>
              <span class="stat-label">Posts</span>
            </div>
            <div class="stat-item" id="modal-stat-followers">
              <span class="stat-num" id="modal-follower-num">${user.followersCount}</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat-item" id="modal-stat-following">
              <span class="stat-num">${user.followingCount}</span>
              <span class="stat-label">Following</span>
            </div>
          </div>
        </div>

        <h3 style="margin-bottom:1rem; border-bottom:1px solid var(--border); padding-bottom:0.5rem;">Posts by @${escapeHtml(user.username)}</h3>
        <div class="posts-stream" id="modal-user-posts"></div>
      `;

      // Event handlers
      if (user.isSelf) {
        document.getElementById('btn-modal-edit-bio').onclick = () => {
          closeModal(elements.profileModal);
          openEditProfileModal(user);
        };
      } else {
        const followBtn = document.getElementById('btn-modal-follow-toggle');
        followBtn.onclick = async () => {
          if (!state.currentUser) {
            showToast('Please log in to follow users.', 'error');
            closeModal(elements.profileModal);
            openModal(elements.authModal);
            return;
          }
          try {
            if (user.isFollowing) {
              const res = await window.api.unfollowUser(user.id);
              user.isFollowing = false;
              followBtn.textContent = 'Follow User';
              followBtn.className = 'btn btn-primary btn-sm';
              document.getElementById('modal-follower-num').textContent = res.followersCount;
              showToast(`Unfollowed @${user.username}`);
            } else {
              const res = await window.api.followUser(user.id);
              user.isFollowing = true;
              followBtn.textContent = 'Unfollow';
              followBtn.className = 'btn btn-ghost btn-sm';
              document.getElementById('modal-follower-num').textContent = res.followersCount;
              showToast(`Now following @${user.username}`);
            }
            renderSidebarProfile();
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
      }

      document.getElementById('modal-stat-followers').onclick = () => {
        closeModal(elements.profileModal);
        openUsersListModal('followers', user.id, user.username);
      };
      document.getElementById('modal-stat-following').onclick = () => {
        closeModal(elements.profileModal);
        openUsersListModal('following', user.id, user.username);
      };

      // Populate user posts
      const postsContainer = document.getElementById('modal-user-posts');
      if (!posts.length) {
        postsContainer.innerHTML = '<p class="text-muted">No posts published yet.</p>';
      } else {
        posts.forEach(p => {
          postsContainer.appendChild(createPostCardElement(p));
        });
      }
    } catch (err) {
      elements.profileModalContent.innerHTML = `<p class="form-error">Failed to load profile: ${escapeHtml(err.message)}</p>`;
    }
  }

  // Profile Setup & Edit Helpers
  function setEditAvatar(urlOrData) {
    state.currentEditAvatar = urlOrData || '';
    if (elements.editAvatarPreviewImg) {
      if (urlOrData) {
        elements.editAvatarPreviewImg.src = urlOrData;
        elements.editAvatarPreviewImg.style.display = 'block';
        if (elements.editAvatarPlaceholder) elements.editAvatarPlaceholder.style.display = 'none';
      } else {
        elements.editAvatarPreviewImg.src = '';
        elements.editAvatarPreviewImg.style.display = 'none';
        if (elements.editAvatarPlaceholder) elements.editAvatarPlaceholder.style.display = 'block';
      }
    }
  }

  function setEditBanner(urlOrData) {
    state.currentEditBanner = urlOrData || '';
    if (elements.editBannerPreviewImg) {
      const placeholderText = elements.editBannerPreview ? elements.editBannerPreview.querySelector('.preview-placeholder-text') : null;
      if (urlOrData) {
        elements.editBannerPreviewImg.src = urlOrData;
        elements.editBannerPreviewImg.style.display = 'block';
        if (placeholderText) placeholderText.style.display = 'none';
      } else {
        elements.editBannerPreviewImg.src = '';
        elements.editBannerPreviewImg.style.display = 'none';
        if (placeholderText) placeholderText.style.display = 'block';
      }
    }
  }

  // Edit Profile Visual Asset Handlers
  if (elements.btnUploadAvatar) {
    elements.btnUploadAvatar.onclick = () => elements.editAvatarFileInput.click();
  }

  if (elements.editAvatarFileInput) {
    elements.editAvatarFileInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          showToast('Please select a valid image file.', 'error');
          return;
        }
        if (file.size > 3 * 1024 * 1024) {
          showToast('Avatar file size must be under 3MB.', 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          setEditAvatar(ev.target.result);
          if (elements.editAvatarUrlInput) elements.editAvatarUrlInput.value = '';
        };
        reader.readAsDataURL(file);
      }
    };
  }

  if (elements.editAvatarUrlInput) {
    elements.editAvatarUrlInput.oninput = () => {
      const url = elements.editAvatarUrlInput.value.trim();
      if (url) {
        setEditAvatar(url);
      }
    };
  }

  if (elements.btnRemoveAvatar) {
    elements.btnRemoveAvatar.onclick = () => {
      setEditAvatar('');
      if (elements.editAvatarUrlInput) elements.editAvatarUrlInput.value = '';
      if (elements.editAvatarFileInput) elements.editAvatarFileInput.value = '';
    };
  }

  if (elements.btnUploadBanner) {
    elements.btnUploadBanner.onclick = () => elements.editBannerFileInput.click();
  }

  if (elements.editBannerFileInput) {
    elements.editBannerFileInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          showToast('Please select a valid image file.', 'error');
          return;
        }
        if (file.size > 3 * 1024 * 1024) {
          showToast('Banner file size must be under 3MB.', 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          setEditBanner(ev.target.result);
          if (elements.editBannerUrlInput) elements.editBannerUrlInput.value = '';
        };
        reader.readAsDataURL(file);
      }
    };
  }

  if (elements.editBannerUrlInput) {
    elements.editBannerUrlInput.oninput = () => {
      const url = elements.editBannerUrlInput.value.trim();
      if (url) {
        setEditBanner(url);
      }
    };
  }

  if (elements.btnRemoveBanner) {
    elements.btnRemoveBanner.onclick = () => {
      setEditBanner('');
      if (elements.editBannerUrlInput) elements.editBannerUrlInput.value = '';
      if (elements.editBannerFileInput) elements.editBannerFileInput.value = '';
    };
  }

  // Clear All Basic Profile Fields
  if (elements.btnClearAllProfile) {
    elements.btnClearAllProfile.onclick = () => {
      if (elements.editDisplayNameInput) elements.editDisplayNameInput.value = '';
      if (elements.editLocationInput) elements.editLocationInput.value = '';
      if (elements.editWebsiteInput) elements.editWebsiteInput.value = '';
      if (elements.editBioInput) elements.editBioInput.value = '';
      if (elements.editBioCharCount) elements.editBioCharCount.textContent = '0 / 250';
      if (elements.editAvatarUrlInput) elements.editAvatarUrlInput.value = '';
      if (elements.editAvatarFileInput) elements.editAvatarFileInput.value = '';
      if (elements.editBannerUrlInput) elements.editBannerUrlInput.value = '';
      if (elements.editBannerFileInput) elements.editBannerFileInput.value = '';
      setEditAvatar('');
      setEditBanner('');
      showToast('All basic profile fields cleared. Click "Save Profile" to apply.');
    };
  }

  // Edit Profile Modal
  async function openEditProfileModal(userData = null) {
    let user = userData;
    if (!user || typeof user === 'string') {
      try {
        const res = await window.api.getUser(state.currentUser.id);
        user = res.user;
      } catch {
        user = { bio: typeof userData === 'string' ? userData : '' };
      }
    }

    if (elements.editDisplayNameInput) {
      elements.editDisplayNameInput.value = user.displayName || user.username || '';
    }
    if (elements.editLocationInput) {
      elements.editLocationInput.value = user.location || '';
    }
    if (elements.editWebsiteInput) {
      elements.editWebsiteInput.value = user.website || '';
    }
    if (elements.editBioInput) {
      elements.editBioInput.value = user.bio || '';
      if (elements.editBioCharCount) {
        elements.editBioCharCount.textContent = `${(user.bio || '').length} / 250`;
      }
    }
    if (elements.editAvatarUrlInput) elements.editAvatarUrlInput.value = '';
    if (elements.editBannerUrlInput) elements.editBannerUrlInput.value = '';
    if (elements.editAvatarPlaceholder) {
      elements.editAvatarPlaceholder.textContent = (user.displayName || user.username || '?').charAt(0).toUpperCase();
    }
    setEditAvatar(user.avatarUrl || '');
    setEditBanner(user.bannerUrl || '');
    if (elements.editProfileErrorMsg) elements.editProfileErrorMsg.textContent = '';
    openModal(elements.editProfileModal);
  }

  if (elements.editBioInput) {
    elements.editBioInput.oninput = () => {
      const len = elements.editBioInput.value.length;
      if (elements.editBioCharCount) elements.editBioCharCount.textContent = `${len} / 250`;
    };
  }

  elements.formEditProfile.onsubmit = async (e) => {
    e.preventDefault();
    const displayName = elements.editDisplayNameInput ? elements.editDisplayNameInput.value.trim() : '';
    const location = elements.editLocationInput ? elements.editLocationInput.value.trim() : '';
    const website = elements.editWebsiteInput ? elements.editWebsiteInput.value.trim() : '';
    const bio = elements.editBioInput ? elements.editBioInput.value.trim() : '';
    const avatarUrl = state.currentEditAvatar || '';
    const bannerUrl = state.currentEditBanner || '';

    try {
      await window.api.updateProfile({
        displayName,
        location,
        website,
        bio,
        avatarUrl,
        bannerUrl
      });
      closeModal(elements.editProfileModal);
      showToast('Profile updated successfully!');
      renderSidebarProfile();
      loadFeed();
    } catch (err) {
      if (elements.editProfileErrorMsg) {
        elements.editProfileErrorMsg.textContent = err.message;
      } else {
        showToast(err.message, 'error');
      }
    }
  };

  // Followers / Following List Modal
  async function openUsersListModal(type, userId, username) {
    elements.usersListTitle.textContent = type === 'followers' ? `Followers of @${username}` : `Following by @${username}`;
    elements.usersListContainer.innerHTML = '<p class="text-muted">Loading...</p>';
    openModal(elements.usersListModal);

    try {
      const res = type === 'followers' 
        ? await window.api.getFollowers(userId) 
        : await window.api.getFollowing(userId);
      const users = res[type] || [];

      if (!users.length) {
        elements.usersListContainer.innerHTML = `<p class="text-muted">No users found.</p>`;
        return;
      }

      elements.usersListContainer.innerHTML = '';
      users.forEach(u => {
        const row = document.createElement('div');
        row.className = 'user-relation-row';

        const info = document.createElement('div');
        info.className = 'user-relation-info';
        info.innerHTML = `
          <div class="avatar" style="width:34px;height:34px;font-size:0.8rem;">
            ${escapeHtml(u.username.charAt(0).toUpperCase())}
          </div>
          <div>
            <div style="font-weight:700;">@${escapeHtml(u.username)}</div>
            <div class="text-muted" style="font-size:0.75rem;">${u.bio ? escapeHtml(u.bio) : 'Member'}</div>
          </div>
        `;
        info.onclick = () => {
          closeModal(elements.usersListModal);
          openUserProfile(u.id);
        };

        row.appendChild(info);

        if (state.currentUser && !u.isSelf) {
          const actionBtn = document.createElement('button');
          actionBtn.className = `btn btn-sm ${u.isFollowing ? 'btn-ghost' : 'btn-primary'}`;
          actionBtn.textContent = u.isFollowing ? 'Unfollow' : 'Follow';
          actionBtn.onclick = async () => {
            try {
              if (u.isFollowing) {
                await window.api.unfollowUser(u.id);
                u.isFollowing = false;
                actionBtn.textContent = 'Follow';
                actionBtn.className = 'btn btn-sm btn-primary';
              } else {
                await window.api.followUser(u.id);
                u.isFollowing = true;
                actionBtn.textContent = 'Unfollow';
                actionBtn.className = 'btn btn-sm btn-ghost';
              }
              renderSidebarProfile();
            } catch (err) {
              showToast(err.message, 'error');
            }
          };
          row.appendChild(actionBtn);
        }

        elements.usersListContainer.appendChild(row);
      });
    } catch (err) {
      elements.usersListContainer.innerHTML = `<p class="form-error">Failed to load users: ${escapeHtml(err.message)}</p>`;
    }
  }

  // Right Sidebar Community Members
  async function loadSuggestedUsers() {
    try {
      // Find active authors in recent posts
      const authorsMap = new Map();
      state.posts.forEach(p => {
        if (!authorsMap.has(p.author.id) && (!state.currentUser || p.author.id !== state.currentUser.id)) {
          authorsMap.set(p.author.id, p.author.username);
        }
      });

      const list = Array.from(authorsMap.entries()).slice(0, 5);
      if (!list.length) {
        elements.suggestedList.innerHTML = `<p class="text-muted" style="font-size:0.85rem;">Discover new creators as more posts are published.</p>`;
        return;
      }

      elements.suggestedList.innerHTML = '';
      list.forEach(([authorId, authorUsername]) => {
        const item = document.createElement('div');
        item.className = 'user-relation-row';
        item.style.marginBottom = '0.5rem';

        const info = document.createElement('div');
        info.className = 'user-relation-info';
        info.innerHTML = `
          <div class="avatar" style="width:30px;height:30px;font-size:0.75rem;">
            ${escapeHtml(authorUsername.charAt(0).toUpperCase())}
          </div>
          <div style="font-weight:700; font-size:0.85rem;">@${escapeHtml(authorUsername)}</div>
        `;
        info.onclick = () => openUserProfile(authorId);

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-ghost btn-sm';
        viewBtn.textContent = 'View';
        viewBtn.onclick = () => openUserProfile(authorId);

        item.appendChild(info);
        item.appendChild(viewBtn);
        elements.suggestedList.appendChild(item);
      });
    } catch (err) {
      console.error('Failed to load community suggestions:', err);
    }
  }

  // Tab Navigation
  elements.tabExplore.onclick = () => {
    state.currentFeed = 'all';
    elements.tabExplore.classList.add('active');
    elements.tabFollowing.classList.remove('active');
    elements.currentFeedHeading.textContent = 'Explore Feed';
    loadFeed();
  };

  elements.tabFollowing.onclick = () => {
    if (!state.currentUser) {
      showToast('Please log in to view following feed.', 'error');
      switchAuthTab('login');
      openModal(elements.authModal);
      return;
    }
    state.currentFeed = 'following';
    elements.tabFollowing.classList.add('active');
    elements.tabExplore.classList.remove('active');
    elements.currentFeedHeading.textContent = 'Following Feed';
    loadFeed();
  };

  elements.btnRefreshFeed.onclick = () => {
    loadFeed();
    showToast('Feed refreshed.');
  };

  elements.brandLogo.onclick = () => {
    elements.tabExplore.click();
  };

  // Close Modal Buttons
  elements.closeAuthModal.onclick = () => closeModal(elements.authModal);
  elements.closeProfileModal.onclick = () => closeModal(elements.profileModal);
  elements.closeEditProfileModal.onclick = () => closeModal(elements.editProfileModal);
  elements.btnCancelEditProfile.onclick = () => closeModal(elements.editProfileModal);
  elements.closeEditPostModal.onclick = () => closeModal(elements.editPostModal);
  elements.btnCancelEditPost.onclick = () => closeModal(elements.editPostModal);
  elements.closeSinglePostModal.onclick = () => {
    closeModal(elements.singlePostModal);
    if (window.location.search.includes('post=')) {
      window.history.pushState(null, '', window.location.pathname);
    }
  };
  elements.closeUsersListModal.onclick = () => closeModal(elements.usersListModal);

  // Close modal when clicking outside modal-card
  window.onclick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      if (e.target === elements.singlePostModal && window.location.search.includes('post=')) {
        window.history.pushState(null, '', window.location.pathname);
      }
      closeModal(e.target);
    }
  };

  // Close modal on Escape key
  window.onkeydown = (e) => {
    if (e.key === 'Escape' && state.activeModal) {
      if (state.activeModal === elements.singlePostModal && window.location.search.includes('post=')) {
        window.history.pushState(null, '', window.location.pathname);
      }
      closeModal(state.activeModal);
    }
  };

  // Auth Tabs Click
  elements.authTabLogin.onclick = () => switchAuthTab('login');
  elements.authTabRegister.onclick = () => switchAuthTab('register');

  // Handle Session Expiry Event
  window.addEventListener('auth:expired', () => {
    updateAuthUI();
    showToast('Your session has expired. Please log in again.', 'error');
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // App Initialization
  updateAuthUI();
  loadFeed();

  // Handle shared post URL permalink
  const urlParams = new URLSearchParams(window.location.search);
  const sharedPostId = urlParams.get('post');
  if (sharedPostId) {
    openSinglePostModal(sharedPostId);
  }
});
