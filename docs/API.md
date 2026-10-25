# REST API Documentation — NovaConnect

**Base URL**: `/api`  
**Data Format**: `application/json`  
**Authentication**: `Authorization: Bearer <JWT_TOKEN>` header  

---

## 1. Authentication Endpoints

### 1.1 Register Account
- **Endpoint**: `POST /api/auth/register`
- **Auth Required**: No
- **Purpose**: Creates a new user account with hashed password.
- **Request Body**:
  ```json
  {
    "username": "sachin_dev",
    "email": "sachin@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Validation**:
  - `username`: 3-30 chars, alphanumeric + underscores.
  - `email`: Valid email syntax, unique.
  - `password`: Minimum 6 characters.
- **Responses**:
  - `201 Created`:
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "user": {
        "id": "usr_123",
        "username": "sachin_dev",
        "email": "sachin@example.com",
        "bio": ""
      },
      "token": "eyJhbGciOi..."
    }
    ```
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Username or email already registered.

### 1.2 User Login
- **Endpoint**: `POST /api/auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "sachin@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Login successful",
      "user": {
        "id": "usr_123",
        "username": "sachin_dev",
        "email": "sachin@example.com",
        "bio": ""
      },
      "token": "eyJhbGciOi..."
    }
    ```
  - `401 Unauthorized`: Invalid credentials.

### 1.3 Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **Responses**:
  - `200 OK`: Current authenticated user's private identity details.
  - `401 Unauthorized`: Missing or expired token.

---

## 2. User & Profile Endpoints

### 2.1 Get Public User Profile
- **Endpoint**: `GET /api/users/:userId`
- **Auth Required**: Optional (Public read)
- **Response**:
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_123",
      "username": "sachin_dev",
      "bio": "Full-stack developer building NovaConnect",
      "createdAt": "2026-10-25T12:00:00.000Z",
      "_count": {
        "posts": 14,
        "followers": 42,
        "following": 18
      },
      "isFollowing": false
    }
  }
  ```
- **Status Codes**: `200 OK`, `404 Not Found`.

### 2.2 Update Current User Profile
- **Endpoint**: `PATCH /api/users/me`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "bio": "New bio update"
  }
  ```
- **Responses**:
  - `200 OK`: Updated user profile.
  - `400 Bad Request`: Bio length exceeds 160 characters.

---

## 3. Post Endpoints

### 3.1 Get Posts Feed
- **Endpoint**: `GET /api/posts`
- **Auth Required**: Optional (If authenticated, includes `hasLiked` flag)
- **Query Params**: `?feed=all` or `?feed=following`
- **Response**:
  ```json
  {
    "success": true,
    "posts": [
      {
        "id": "post_456",
        "content": "Hello NovaConnect world! Excited to share my journey.",
        "createdAt": "2026-10-25T13:00:00.000Z",
        "updatedAt": "2026-10-25T13:00:00.000Z",
        "author": {
          "id": "usr_123",
          "username": "sachin_dev"
        },
        "_count": {
          "likes": 5,
          "comments": 2
        },
        "hasLiked": false
      }
    ]
  }
  ```

### 3.2 Create Post
- **Endpoint**: `POST /api/posts`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "content": "Building my social networking project!"
  }
  ```
- **Validation**: Content 1 to 500 characters, trimmed.
- **Responses**:
  - `201 Created`: Created post object.
  - `400 Bad Request`: Content empty or too long.

### 3.3 Edit Owned Post
- **Endpoint**: `PATCH /api/posts/:postId`
- **Auth Required**: Yes
- **Ownership Rule**: `req.user.id === post.authorId`
- **Request Body**:
  ```json
  {
    "content": "Updated post text."
  }
  ```
- **Responses**:
  - `200 OK`: Updated post.
  - `403 Forbidden`: Authenticated user is not the post author.
  - `404 Not Found`: Post does not exist.

### 3.4 Delete Owned Post
- **Endpoint**: `DELETE /api/posts/:postId`
- **Auth Required**: Yes
- **Ownership Rule**: `req.user.id === post.authorId`
- **Responses**:
  - `200 OK`: `{"success": true, "message": "Post deleted"}`
  - `403 Forbidden`: Attempting to delete another user's post.
  - `404 Not Found`: Post does not exist.

---

## 4. Like Endpoints

### 4.1 Toggle Like (Like / Unlike)
- **Endpoint**: `POST /api/posts/:postId/likes`
- **Auth Required**: Yes
- **Behavior**: If user hasn't liked the post, creates like record; if already liked, removes like record (idempotent toggle).
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "liked": true,
      "likesCount": 6
    }
    ```
  - `404 Not Found`: Post does not exist.

---

## 5. Comment Endpoints

### 5.1 Get Post Comments
- **Endpoint**: `GET /api/posts/:postId/comments`
- **Auth Required**: Optional
- **Response**:
  ```json
  {
    "success": true,
    "comments": [
      {
        "id": "comm_789",
        "content": "Awesome architecture!",
        "createdAt": "2026-10-25T13:30:00.000Z",
        "author": {
          "id": "usr_999",
          "username": "alex_code"
        }
      }
    ]
  }
  ```

### 5.2 Add Comment
- **Endpoint**: `POST /api/posts/:postId/comments`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "content": "Great work on this platform!"
  }
  ```
- **Responses**:
  - `201 Created`: Created comment with author details.
  - `400 Bad Request`: Empty or over 300 characters.

### 5.3 Delete Comment
- **Endpoint**: `DELETE /api/comments/:commentId`
- **Auth Required**: Yes
- **Authorization**: Comment author OR post author can delete.
- **Responses**:
  - `200 OK`: `{"success": true, "message": "Comment deleted"}`
  - `403 Forbidden`: User neither authored comment nor owns the post.

---

## 6. Following Endpoints

### 6.1 Toggle Follow / Unfollow
- **Endpoint**: `POST /api/users/:userId/follow`
- **Auth Required**: Yes
- **Rule**: `req.user.id !== req.params.userId` (Prevent self-following)
- **Response**:
  ```json
  {
    "success": true,
    "isFollowing": true,
    "followerCount": 43
  }
  ```
- **Status Codes**: `200 OK`, `400 Bad Request` (self-follow), `404 Not Found`.

### 6.2 Get User Followers & Following
- **Endpoint**: `GET /api/users/:userId/followers`
- **Endpoint**: `GET /api/users/:userId/following`
- **Auth Required**: Optional
- **Response**: List of basic user summaries (`{ id, username, bio }`).
