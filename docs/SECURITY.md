# Security & Privacy Policy — NovaConnect

**Project**: NovaConnect  
**Focus**: OWASP Top 10 Web Application Security  
**Date**: 2026-10-25  

---

## 1. Security Architecture Summary

NovaConnect adopts a defense-in-depth security approach across all layers of the application:
1. **Transport & Network**: HTTPS enforcement in production, secure HTTP headers via `helmet`, explicit CORS origin restrictions.
2. **Authentication**: Bcrypt-hashed credentials with adaptive work factors, JSON Web Tokens (JWT) signed with high-entropy secrets, and short token lifecycles.
3. **Authorization**: Strict server-side resource ownership validation on all mutating endpoints (`PATCH`, `DELETE`).
4. **Data Protection**: Parameterized queries via Prisma to eliminate SQL injection; safe DOM manipulation (`textContent`) to eradicate Cross-Site Scripting (XSS).
5. **Private Data Isolation**: Public APIs omit sensitive attributes (`passwordHash`, `email`, tokens).

---

## 2. Threat Modeling & Mitigation Matrix

| Vulnerability Threat | Risk Level | Mitigation Strategy | Verification / Test |
| :--- | :--- | :--- | :--- |
| **Broken Authentication** | Critical | Bcrypt password hashing (10 salt rounds), secure token verification middleware, rejection of tampered tokens. | Test with invalid/expired tokens; verify rejection with 401. |
| **Broken Object Level Authorization (BOLA)** | Critical | Server checks `post.authorId === req.user.id` before edit or delete. Client-supplied post IDs in URL cannot bypass check. | User B attempts `DELETE /api/posts/:userA_postId`; verify 403 Forbidden. |
| **SQL Injection (SQLi)** | High | Use Prisma ORM with strictly parameterized queries. No raw concatenated SQL strings. | Audit repository for raw SQL interpolation; verify Prisma schema models. |
| **Cross-Site Scripting (XSS)** | High | All user text (posts, bios, comments) rendered using DOM `element.textContent` rather than `innerHTML`. Input trimmed and validated. | Post payload `<script>alert(1)</script>` rendered purely as literal text. |
| **Cross-Origin Misconfiguration** | Medium | Explicit `cors()` origins whitelist; credentials mode enabled only for permitted clients. | Cross-origin requests from disallowed domains rejected. |
| **Sensitive Data Exposure** | High | Controller responses sanitize user objects via Prisma `select` or explicit destructuring to eliminate `passwordHash`. | Inspect `GET /api/users/:id` response payloads to confirm zero exposed credentials. |
| **Duplicate Relations / Race Conditions**| Medium | Database-level composite unique constraints `@@unique([userId, postId])` and `@@unique([followerId, followingId])`. | Send concurrent like/follow requests; verify database guarantees exactly 1 record. |

---

## 3. Password Hashing Specification
- Algorithm: **Bcrypt** (`bcryptjs`)
- Salt factor: 10 rounds
- Storage: `User.passwordHash` column
- Rule: Plaintext passwords are NEVER stored, printed to console logs, or echoed in API responses.

---

## 4. Input Sanitization & Content Length Limits
All incoming request payloads are validated and sanitized:
- **`username`**:
  - Min: 3 characters, Max: 30 characters.
  - Pattern: `^[a-zA-Z0-9_]+$` (Letters, numbers, underscores).
- **`email`**:
  - Valid RFC 5322 format.
  - Stored in lowercased form.
- **`password`**:
  - Min: 6 characters.
- **`post.content`**:
  - Min: 1 character, Max: 500 characters.
  - Whitespace trimmed.
- **`comment.content`**:
  - Min: 1 character, Max: 300 characters.
  - Whitespace trimmed.
- **`user.bio`**:
  - Max: 160 characters.

---

## 5. Secrets Management & Git Hygiene
- All secrets (`JWT_SECRET`, `PORT`, `DATABASE_URL`) are read exclusively from environment variables via `process.env`.
- `.env` is explicitly listed in `.gitignore` and NEVER committed.
- A placeholder `.env.example` is committed to guide safe setup for developers.
