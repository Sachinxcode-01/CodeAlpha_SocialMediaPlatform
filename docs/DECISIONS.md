# Architecture Decision Records (ADR) — NovaConnect

**Project**: NovaConnect  
**Organization**: CodeAlpha Full Stack Development Internship  
**Date**: 2026-10-25  

---

## ADR-001: Backend Framework Selection (Node.js + Express.js vs. Django)
- **Status**: ACCEPTED
- **Context**: CodeAlpha allows either Django with Python or Express.js with Node.js. The host environment contains Node.js `v25.1.0` and Python `3.10.11`.
- **Decision**: Adopt **Node.js + Express.js**.
- **Rationale**:
  1. Express is lightweight, unopinionated, and maps directly to fundamental HTTP and REST principles.
  2. Enables full-stack JavaScript consistency across frontend and backend.
  3. Highly transparent for internship mentorship and manual implementation by the student.
- **Consequences**: We must configure routing, validation, and database connectors explicitly rather than relying on Django's built-in admin or ORM.

---

## ADR-002: Database & ORM Strategy (Prisma ORM with SQLite for Dev / PostgreSQL for Prod)
- **Status**: ACCEPTED
- **Context**: The audit verified that `psql` is not installed on PATH in the developer workstation. The project requires relational modeling with foreign keys, unique constraints, and cascade deletions.
- **Decision**: Adopt **Prisma ORM** with **SQLite** for development, with a schema directly compatible with **PostgreSQL**.
- **Rationale**:
  1. SQLite requires zero daemon installation or background services; the database file is local and completely self-contained.
  2. Prisma provides type-safe schema definitions, declarative migrations, and compile-time validation.
  3. Switching to PostgreSQL for production merely requires changing the datasource provider in `schema.prisma`.
- **Consequences**: Eliminates database installation friction for evaluation while preserving relational integrity.

---

## ADR-003: Authentication Strategy (Stateless JWT vs. Stateful Server Sessions)
- **Status**: ACCEPTED
- **Context**: The application requires protected API endpoints and user identification for authoring posts, liking, and following.
- **Decision**: Adopt **JSON Web Tokens (JWT)** passed via `Authorization: Bearer <token>` headers, with tokens securely stored in browser client `localStorage` (or HTTP-only cookies).
- **Rationale**:
  1. Clean, standard REST architecture where API endpoints remain stateless.
  2. Simple to test via Supertest, Postman, or `curl`.
  3. Seamless integration between client-side Vanilla JavaScript and backend Express middleware.
- **Consequences**: Token revocation requires short expiration times or a token blacklist table if immediate invalidation is needed.

---

## ADR-004: Frontend Architecture (Vanilla HTML/CSS/JavaScript)
- **Status**: ACCEPTED
- **Context**: CodeAlpha task explicitly specifies HTML, CSS, and JavaScript.
- **Decision**: Build the UI using semantic **HTML5**, custom responsive **CSS3** design system, and modern **Vanilla ES6+ JavaScript**.
- **Rationale**:
  1. Zero build steps, zero Webpack/Vite complexity, fast rendering, and compliant with CodeAlpha internship rules.
  2. Demonstrates deep understanding of DOM manipulation, fetch API, and async/await without framework abstraction hiding the mechanics.
- **Consequences**: State synchronization and DOM re-rendering are handled imperatively via clean utility functions.

---

## ADR-005: Cascade Deletion Policy for Social Graph
- **Status**: ACCEPTED
- **Context**: What happens when a user or post is deleted?
- **Decision**: Enforce relational `ON DELETE CASCADE` on all dependent child records:
  - Deleting a `Post` cascades to its `Comment`s and `Like`s.
  - Deleting a `User` cascades to their `Post`s, `Comment`s, `Like`s, and `Follow` edges.
- **Rationale**: Prevents orphaned records and broken foreign key references in feed and profile aggregation queries.
- **Consequences**: Deletion operations are permanent and cleanly purge associated metadata.
