# Product Requirements Document (PRD) — NovaConnect

**Project**: NovaConnect  
**Organization**: CodeAlpha Full Stack Development Internship  
**Task 2**: Social Media Platform  
**Status**: DRAFT / APPROVED FOR IMPLEMENTATION  
**Version**: 1.0.0  
**Last Updated**: 2026-10-25  

---

## 1. Product Overview
NovaConnect is a responsive, full-stack social networking web application designed to connect users, facilitate social interaction, and enable content sharing. Users can create personal profiles, publish short-form text posts, interact through likes and threaded comments, and follow other users to build a personal social graph.

---

## 2. Target Users & Problem Statement

### 2.1 Target Users
- **General Web Users**: Individuals looking for an intuitive, clutter-free social space to express thoughts, read updates from friends, and follow interesting creators.
- **Internship Evaluators**: CodeAlpha technical reviewers assessing full-stack engineering competency, relational database modeling, clean API architecture, security practices, and responsive UI design.

### 2.2 Problem Statement
Modern social platforms often suffer from bloated user interfaces, opaque data practices, and overly complex interaction models. NovaConnect solves this by providing a clean, accessible, and fast social platform focusing strictly on core relational interactions: user profiles, posts, likes, comments, and following graphs.

---

## 3. Project Objectives
1. Deliver a fully functional, self-hosted social networking platform meeting all CodeAlpha requirements.
2. Maintain strict separation of concerns between client (HTML/CSS/Vanilla JS) and server (Node.js/Express.js REST API).
3. Implement robust relational database persistence with strict foreign key constraints and data integrity checks.
4. Enforce ironclad security principles: password hashing, protected routes, server-side ownership authorization, and XSS prevention.
5. Provide a smooth, accessible user experience with responsive layouts, empty states, and descriptive feedback.

---

## 4. User Roles & Personas
- **Guest / Unauthenticated User**: Can view public landing information and access registration/login pages. Cannot create posts, like, comment, or follow.
- **Authenticated Member**: Can maintain a personal profile, create, edit, and delete their own posts, like/unlike posts, comment on any post, delete their own comments, and follow/unfollow other members.

---

## 5. Functional Requirements & Traceability Matrix

| Requirement ID | Priority | Feature Description | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-001** | P0 | User Registration | None | User can register with unique username, email, and secure password. Passwords hashed with bcrypt. |
| **AUTH-002** | P0 | Login & Logout | AUTH-001 | User can log in with credentials, receive secure session/token, access protected routes, and log out cleanly. |
| **PROF-001** | P0 | View User Profile | AUTH-001 | Displays user's username, bio, join date, posts, follower count, and following count. Public data only. |
| **PROF-002** | P0 | Edit Profile | AUTH-002, PROF-001 | Authenticated user can update their own bio and display details. Cannot modify others' profiles. |
| **POST-001** | P0 | Create Post | AUTH-002 | Authenticated user can author text posts (max 500 chars). Stored with author ID and timestamp. |
| **POST-002** | P0 | View Post Feed | POST-001 | Chronological feed showing posts, author names, formatted timestamps, like counts, and comment counts. |
| **POST-003** | P0 | Edit & Delete Owned Post | POST-001, AUTH-002 | Author can edit post content or delete their own post. Unauthorized modification attempts return 403 Forbidden. |
| **LIKE-001** | P0 | Like and Unlike Post | AUTH-002, POST-002 | Authenticated user can toggle like on a post. Enforces unique (user_id, post_id) constraint. Authoritative count on server. |
| **COMM-001** | P0 | Add Comment to Post | AUTH-002, POST-002 | Authenticated user can comment on any post. Validates non-empty content (max 300 chars). |
| **COMM-002** | P0 | Delete Authorized Comment | COMM-001, AUTH-002 | Author of comment (or post owner) can delete the comment. Unauthorized requests rejected with 403. |
| **FOLLOW-001**| P0 | Follow & Unfollow User | AUTH-002, PROF-001 | Authenticated user can follow/unfollow another user. Prevents self-following and duplicate relations. |
| **FOLLOW-002**| P0 | View Followers & Following | FOLLOW-001 | Users can view list of users following an account and accounts followed by that user. |
| **FEED-001** | P0 | Personalized / Global Feed | POST-002, FOLLOW-001 | Feed displays posts from all network users (explore) and prioritized posts from followed users. |

*Priority Guide: P0 = Mandatory Core Requirements; P1 = Important Improvements; P2 = Optional Enhancements.*

---

## 6. Non-Functional Requirements
- **Performance**: API responses under 150ms for local queries; lightweight DOM rendering without large third-party bundles.
- **Security**: OWASP Top 10 compliance: zero plaintext password storage, parameterized database queries against SQL injection, strict XSS prevention via textContent encoding, and server-side authorization checks on all mutations.
- **Reliability**: Relational cascade rules ensure deleting a post cleanly removes associated likes and comments without orphan records.
- **Accessibility (a11y)**: Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`), ARIA labels on icon buttons, full keyboard navigability, and WCAG AA contrast compliance.
- **Maintainability**: Clear modular MVC/Service pattern separating controllers, routes, middleware, and database access.

---

## 7. User Journeys

### Journey 1: New Member Onboarding
1. User arrives at NovaConnect landing page.
2. Clicks **"Create Account"** and completes registration form (`username`, `email`, `password`).
3. System validates input, securely hashes password, creates account, and logs user in.
4. User is redirected to their **Profile** to add a short bio.

### Journey 2: Content Sharing & Feed Interaction
1. User navigates to **Home Feed**.
2. Enters a post in the post creator widget: *"Excited to begin my social project!"* and clicks **Post**.
3. Feed updates immediately with the newly published post at the top.
4. Another user views the post, clicks **Like** (count updates to 1), and adds a **Comment**: *"Great job!"*.

### Journey 3: Social Graph Building
1. User clicks on another member's username to view their profile.
2. Observes their posts, bio, and follower metrics.
3. Clicks **Follow**. The button toggles to **Following**, and the target user's follower count increments by 1.

---

## 8. Error, Loading, and Empty States
- **Empty States**:
  - Feed with no posts: Display friendly call-to-action: *"No posts yet! Be the first to share an update."*
  - Profile with no posts: *"This user hasn't posted anything yet."*
  - Zero followers/following: *"No followers yet."* / *"Not following anyone yet."*
- **Loading States**: Skeletons or subtle spinner indicators during network fetches.
- **Error States**: Non-blocking toast notifications and contextual inline error messages for invalid logins, validation failures, or server errors.

---

## 9. Definition of Done (DoD)
A feature is considered **Done** only when:
1. The server-side route and business logic are implemented and manually tested.
2. The client UI connects cleanly to the REST API with proper error and empty state handling.
3. Database constraints prevent duplicate or invalid records.
4. Security and authorization tests confirm unauthenticated or unauthorized users are blocked.
5. All relevant documentation and tests are updated.
