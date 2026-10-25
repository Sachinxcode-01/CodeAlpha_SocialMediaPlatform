# NovaConnect — Social Media Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-v22%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-v4.21-blue.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite_Native-lightgrey.svg)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests: 20 Passing](https://img.shields.io/badge/Tests-20%2F20%20Passing-brightgreen.svg)](#testing)

> **CodeAlpha Full Stack Development Internship — Task 2: Social Media Platform**  
> **Author**: Sachin K ([@Sachinxcode-01](https://github.com/Sachinxcode-01))  
> **Project Identity**: NovaConnect

---

## 📖 1. Project Overview

**NovaConnect** is a full-stack social networking web application designed for developers and tech enthusiasts to connect, publish thoughts, discuss ideas, and build community networks. 

Built strictly using **HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js, and SQLite**, NovaConnect adheres to the core requirement of human-led engineering, zero framework bloat on the frontend, and rigorous security and relational database modeling.

### ✨ Key Implemented Features

- **User Authentication (`AUTH-001`, `AUTH-002`)**: Secure registration and login using `bcryptjs` password hashing (10 salt rounds) and stateless JSON Web Tokens (`jsonwebtoken`).
- **User Profiles (`PROF-001`, `PROF-002`)**: Public member profiles displaying user statistics (post count, follower count, following count), bio, joined date, and authored posts. Authenticated members can edit their personal bio.
- **Posts & Live Feed (`POST-001`, `POST-002`, `POST-003`, `FEED-001`)**: Author short-form text posts (up to 500 characters) with real-time character counters. View chronological network feeds with author metadata, formatted timestamps, like counts, and comment threads. Authors can edit and delete their own posts.
- **Likes System (`LIKE-001`)**: Toggle likes on any post with database-enforced compound uniqueness `UNIQUE(user_id, post_id)` to prevent duplicate likes, returning authoritative database counts.
- **Threaded Comments (`COMM-001`, `COMM-002`)**: Engage in conversations on posts. Comment author or parent post owner can delete comments with strict server-side authorization.
- **Follow Graph (`FOLLOW-001`, `FOLLOW-002`)**: Follow and unfollow members with self-follow prevention. View lists of followers and following accounts. Switch between **Explore Feed (All Posts)** and **Following Feed (Prioritized Feed)**.
- **Security & XSS Prevention**: All user-generated content (posts, comments, usernames, bios) is rendered via safe DOM methods (`textContent`) and escaped to guarantee zero Cross-Site Scripting (XSS). Strict server-side ownership authorization is enforced on all mutation endpoints.
- **Responsive Modern UI**: Sleek dark-mode aesthetic featuring glassmorphism, responsive 3-column layout (sidebar, feed, suggestions), fluid modals, micro-animations, and toast feedback.

---

## 🏗️ 2. Technology Stack & Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND CLIENT                         │
│   HTML5 Semantic Shell  •  Vanilla CSS (Glassmorphism)      │
│   Vanilla JS (ES6+ Modules, DOM APIs, XSS-Safe Rendering)   │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTP / REST API (JSON + Bearer JWT)
┌──────────────────────────────▼──────────────────────────────┐
│                    NODE.JS + EXPRESS API                    │
│   Routes: /api/auth, /api/users, /api/posts, /api/comments  │
│   Middleware: JWT Auth, CORS, JSON Body Parser, Error Handler│
└──────────────────────────────▲──────────────────────────────┘
                               │ Prepared SQL Statements / WAL Mode
┌──────────────────────────────▼──────────────────────────────┐
│                  RELATIONAL SQLITE DATABASE                 │
│   Tables: users, posts, comments, likes, follows            │
│   Integrity: Foreign Keys, CASCADE Deletes, Unique Indexes  │
└─────────────────────────────────────────────────────────────┘
```

| Component | Selected Technology | Purpose & Rationale |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, CSS3, JavaScript | Lightweight, zero external UI framework dependencies, fast load times. |
| **Styling** | Vanilla CSS Design System | Custom CSS variables, dark glassmorphic elevations, responsive grid. |
| **Backend API** | Node.js (`v22+` / `v25`) + Express.js | High-performance asynchronous REST API routing and middleware. |
| **Database** | SQLite via Node's native `DatabaseSync` | Zero-configuration relational database with true SQL foreign keys, WAL journaling, and portable persistence. |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` | Industry-standard password hashing and stateless authorization tokens. |
| **Testing** | Node.js Native Test Runner (`node:test`) | Built-in test runner for high-speed integration and unit testing. |

---

## 📁 3. Project Directory Structure

```
CodeAlpha_SocialMediaPlatform/
├── docs/                          # Comprehensive Engineering Documentation
│   ├── PRD.md                     # Product Requirements Document
│   ├── TRD.md                     # Technical Requirements Document
│   ├── API.md                     # REST API Contracts & Endpoint Specifications
│   ├── DATABASE.md                # Relational Database Schema & Indexing Guide
│   ├── SECURITY.md                # Threat Model & Security Controls
│   ├── TESTING.md                 # Test Matrix & Automated Test Scenarios
│   ├── IMPLEMENTATION_PLAN.md     # Step-by-step phased development plan
│   ├── REPOSITORY_AUDIT.md        # Initial Phase Zero Audit
│   ├── FINAL_AUDIT.md             # Pre-submission verification report
│   └── DECISIONS.md               # Architecture Decision Records (ADRs)
├── frontend/                      # Client-Side Assets
│   ├── index.html                 # Application Single Page Shell & Modals
│   ├── styles/
│   │   └── main.css               # Modern glassmorphism dark stylesheet
│   └── scripts/
│       ├── api.js                 # REST API Client wrapper & JWT storage
│       └── app.js                 # UI State, DOM event handlers, and rendering
├── backend/                       # Server Application
│   ├── server.js                  # Express application entry point
│   ├── database/
│   │   ├── db.js                  # Native SQLite connection & query helpers
│   │   └── schema.sql             # SQL table definitions, constraints, indexes
│   ├── middleware/
│   │   └── auth.js                # JWT verification & optional auth middleware
│   ├── controllers/
│   │   ├── authController.js      # Register, login, me, logout handlers
│   │   ├── userController.js      # Profiles, bio updates, follower queries
│   │   ├── postController.js      # Post creation, feeds, edit, delete
│   │   ├── likeController.js      # Like/unlike toggle handlers
│   │   ├── commentController.js   # Comment creation, listing, delete
│   │   └── followController.js    # Follow/unfollow relations
│   └── routes/
│       ├── auth.js                # /api/auth routes
│       ├── users.js               # /api/users routes
│       ├── posts.js               # /api/posts routes
│       ├── likes.js               # /api/posts/:postId/likes routes
│       ├── comments.js            # /api/comments routes
│       └── follows.js             # /api/users/:userId/follow routes
├── tests/                         # Automated Test Suite (20 Tests)
│   ├── helpers.js                 # Ephemeral test server & HTTP client
│   ├── auth.test.js               # Workflow A: Auth & Profile tests
│   ├── posts.test.js              # Workflow B: Post CRUD & Feed tests
│   ├── interactions.test.js       # Workflow C: Likes, Comments, Follows
│   └── security.test.js           # Workflow D: Authorization & Boundary guards
├── .env.example                   # Environment variable template
├── .gitignore                     # Git exclusion rules
├── package.json                   # Project manifest & npm scripts
└── README.md                      # Project manual
```

---

## 🚀 4. Getting Started

### Prerequisites

- **Node.js**: `v22.0.0` or later (tested on `v25.1.0`)
- **npm**: `v10.0.0` or later
- **Git**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sachinxcode-01/CodeAlpha_SocialMediaPlatform.git
   cd CodeAlpha_SocialMediaPlatform
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   *Values in `.env.example`:*
   ```env
   PORT=5000
   DATABASE_FILE=database.db
   JWT_SECRET=novaconnect_jwt_super_secret_development_key_2026
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

4. **Initialize Database**:
   The SQLite database is initialized automatically on first startup via `backend/database/schema.sql`.

5. **Start the Application**:
   ```bash
   # Development mode with file watch:
   npm run dev

   # Or standard start:
   npm start
   ```

6. **Open in Browser**:
   Navigate to [http://localhost:5000](http://localhost:5000).

---

## 🧪 5. Automated Testing

NovaConnect includes a comprehensive automated test suite powered by Node.js's native test runner (`node:test`). Tests run against an in-memory SQLite database (`:memory:`) to ensure complete test isolation and zero disk contamination.

Run the entire test suite with:

```bash
npm test
```

### Test Results Summary

```
▶ Workflow A: Authentication & Profile Operations
  ✔ AUTH-001: Registers a user with valid credentials (432ms)
  ✔ AUTH-001: Prevents duplicate username or email registration (264ms)
  ✔ AUTH-001: Rejects invalid registration inputs (59ms)
  ✔ AUTH-002: Logs in an existing user and returns token (431ms)
  ✔ AUTH-002: Rejects invalid credentials safely (429ms)
  ✔ PROF-001 & PROF-002: Inspects and updates user profile (224ms)
✔ Workflow A: Authentication & Profile Operations (1893ms)

▶ Workflow B: Posts and Feed Operations
  ✔ POST-001: Creates a post successfully (482ms)
  ✔ POST-001: Rejects empty or overly long post content (303ms)
  ✔ POST-002 & FEED-001: Retrieves posts in feed with author metadata (281ms)
  ✔ POST-003: Edits an owned post (249ms)
  ✔ POST-003: Deletes an owned post and removes it from feed (244ms)
✔ Workflow B: Posts and Feed Operations (1612ms)

▶ Workflow C: Social Interactions (Likes, Comments, Following)
  ✔ LIKE-001: User B likes and unlikes User A post with authoritative count (830ms)
  ✔ COMM-001 & COMM-002: User B comments on User A post and views comment thread (474ms)
  ✔ FOLLOW-001 & FOLLOW-002: Follow and unfollow user with follower counts (455ms)
✔ Workflow C: Social Interactions (Likes, Comments, Following) (1813ms)

▶ Workflow D: Security, Authorization & Edge Cases
  ✔ SEC-001: Rejects unauthenticated requests to protected endpoints with 401 (986ms)
  ✔ SEC-002: Rejects unauthorized post editing with 403 Forbidden (685ms)
  ✔ SEC-003: Rejects unauthorized post deletion with 403 Forbidden (558ms)
  ✔ SEC-004: Rejects unauthorized comment deletion with 403, allows author or post owner (576ms)
  ✔ SEC-005: Prevents a user from following themselves (577ms)
  ✔ SEC-006: Handles repeated like requests idempotently without inflating count (569ms)
✔ Workflow D: Security, Authorization & Edge Cases (4010ms)

ℹ tests 20
ℹ suites 4
ℹ pass 20
ℹ fail 0
```

---

## 🔒 6. Security & Privacy Implementations

1. **Password Hashing**: Passwords hashed using `bcryptjs` with salt rounds = 10. Plaintext passwords never stored.
2. **Stateless JWT**: Secret-signed tokens with expiration; credentials never exposed in responses.
3. **Server-Side Authorization**: Editing or deleting posts verifies `req.user.id === post.author_id`. Deleting comments verifies `req.user.id === comment.author_id || req.user.id === post.author_id`.
4. **XSS Protection**: All user content rendered via DOM `textContent` and escaped.
5. **Relational Constraints**: Cascading deletions (`ON DELETE CASCADE`) prevent orphaned comments or likes. Unique pairs prevent duplicate likes or self-following.

---

## 📜 7. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
Built proudly for the **CodeAlpha Full Stack Development Internship**.
