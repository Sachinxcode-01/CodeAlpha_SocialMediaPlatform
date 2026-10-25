# Technical Requirements Document (TRD) — NovaConnect

**Project**: NovaConnect  
**Organization**: CodeAlpha Full Stack Development Internship  
**Version**: 1.0.0  
**Date**: 2026-10-25  

---

## 1. System Architecture Overview

NovaConnect is structured as a decoupled, full-stack client-server web application.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│   HTML5 Semantic Shell  •  Modern CSS Design System (A11y)  │
│             Vanilla JavaScript (ES6+ Fetch API)             │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js REST API                      │
│   Auth Middleware (JWT/Session)  •  Validation & Security   │
│   Controllers: Auth, Users, Posts, Likes, Comments, Follows │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM / Query Builder
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                         │
│           SQLite (Dev) / PostgreSQL Relational DB           │
│   Foreign Keys  •  Unique Constraints  •  Cascading Deletes │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack Selection & Rationale

| Layer | Selected Technology | Version | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Runtime** | Vanilla HTML5, CSS3, ES6+ JavaScript | Modern Standard | Complies with CodeAlpha requirement. Zero complex build steps, ultrafast load time, maximum DOM control. |
| **Backend Runtime** | Node.js + Express.js | Node v25+, Express v4.x | Recommended by CodeAlpha. Lightweight, flexible, industry standard for REST APIs. |
| **ORM / Data Access** | Prisma ORM | Latest v5/v6 | Type-safe query generation, auto-generated migrations, strict relational integrity, unified support for SQLite & PostgreSQL. |
| **Database** | SQLite (Dev) / PostgreSQL (Prod) | 3.x / 15+ | Zero-friction local setup without daemon dependencies, fully relational with foreign keys and unique compound indexes. |
| **Password Hashing** | `bcryptjs` | Latest | Proven adaptive hashing algorithm with salt generation to safeguard user credentials. |
| **Auth Tokens** | `jsonwebtoken` (JWT) & HTTP-only Cookies | Latest | Stateless or cookie-backed authentication allowing seamless protected route verification. |

---

## 3. Directory Structure

```
CodeAlpha_SocialMediaPlatform/
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   ├── TESTING.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── DECISIONS.md
│   ├── REPOSITORY_AUDIT.md
│   └── FINAL_AUDIT.md
├── frontend/
│   ├── index.html              # Landing & Auth entry
│   ├── feed.html               # Main post feed
│   ├── profile.html            # User profile & post history
│   ├── styles/
│   │   ├── main.css            # Design system, CSS variables & typography
│   │   ├── components.css      # Cards, buttons, modals, toasts, forms
│   │   └── responsive.css      # Media queries & mobile navigation
│   └── js/
│       ├── api.js              # Centralized API fetch client & token helper
│       ├── auth.js             # Login, register, logout handlers
│       ├── feed.js             # Post rendering, creation, like, comment logic
│       └── profile.js          # Profile loading, bio update, follow button
├── backend/
│   ├── config/
│   │   └── db.js               # Prisma client initialization
│   ├── controllers/
│   │   ├── authController.js   # Register, login, me
│   │   ├── userController.js   # Get profile, update profile, follow/unfollow
│   │   ├── postController.js   # Create, get feed, get post, edit, delete
│   │   ├── likeController.js   # Toggle like, get likers
│   │   └── commentController.js# Add comment, list comments, delete comment
│   ├── middleware/
│   │   ├── authMiddleware.js   # Token verification & req.user attachment
│   │   ├── validateMiddleware.js# Input sanitization & field validation
│   │   └── errorMiddleware.js  # Global error boundary
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── postRoutes.js
│   │   ├── likeRoutes.js
│   │   └── commentRoutes.js
│   ├── prisma/
│   │   └── schema.prisma       # Database models & relationships
│   └── server.js               # Express application entrypoint
├── tests/
│   ├── auth.test.js
│   ├── posts.test.js
│   ├── interactions.test.js
│   └── follow.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 4. Backend Architecture Patterns

### 4.1 Layered Separation
- **Routes Layer**: Pure route definitions linking HTTP verbs and URL paths to controllers and middleware.
- **Middleware Layer**:
  - `authenticateToken`: Inspects `Authorization: Bearer <token>` or cookies, decodes user payload, attaches `req.user`.
  - `validateBody(schema)`: Validates body constraints before hitting controllers.
  - `errorHandler`: Catches uncaught exceptions and formats standard JSON error responses.
- **Controller Layer**: Handles HTTP request parsing, invokes database queries via Prisma, enforces business logic (e.g. ownership checks), and returns semantic HTTP responses.

---

## 5. Security & Data Protection Specifications

1. **Authentication Token Lifecycle**:
   - Token contains `{ userId, username, email }`.
   - Token expires in 7 days (or configured via `JWT_EXPIRES_IN`).
2. **Sensitive Information Scrubbing**:
   - Controller queries must never return `passwordHash`.
   - Public user endpoints return only `{ id, username, bio, createdAt, _count }`.
3. **CORS & Headers**:
   - Configured with `cors` and `helmet` to restrict unauthorized cross-origin requests and enforce secure HTTP headers.
4. **Input Constraints**:
   - Post content: 1 - 500 characters, trimmed.
   - Comment content: 1 - 300 characters, trimmed.
   - Username: 3 - 30 alphanumeric characters and underscores only.
   - Password: Minimum 6 characters.
