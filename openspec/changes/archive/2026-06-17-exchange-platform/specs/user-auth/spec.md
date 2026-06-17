## ADDED Requirements

### Requirement: User registration
The API SHALL allow users to register with email and password; passwords MUST be hashed with bcrypt before storage.

#### Scenario: Successful registration
- **WHEN** user submits a valid email and password (min 8 chars)
- **THEN** a new user account is created, httpOnly auth cookies are set, and a success response is returned without raw JWT strings in the body

#### Scenario: Duplicate email
- **WHEN** user registers with an email that already exists
- **THEN** the API returns a 409 conflict error

### Requirement: User login
The API SHALL authenticate users and issue a short-lived access token (JWT, 15 min) and a long-lived refresh token (7 days) via httpOnly `Set-Cookie` headers.

#### Scenario: Successful login
- **WHEN** user submits valid credentials
- **THEN** the API sets `accessToken` and `refreshToken` httpOnly cookies and does not return raw token strings in the response body

#### Scenario: Invalid credentials
- **WHEN** user submits wrong password
- **THEN** the API returns 401 with a generic "Invalid credentials" message

### Requirement: Token refresh
The API SHALL provide an endpoint to exchange a valid refresh token cookie for a new access token cookie.

#### Scenario: Refresh access token
- **WHEN** client sends `POST /auth/refresh` with a valid `refreshToken` httpOnly cookie
- **THEN** a new `accessToken` cookie is issued and the refresh token is rotated

### Requirement: User logout
The API SHALL provide a logout endpoint that clears auth cookies and invalidates the refresh token server-side.

#### Scenario: Successful logout
- **WHEN** user calls `POST /auth/logout`
- **THEN** auth cookies are cleared and the refresh token is removed from Redis

### Requirement: Protected routes
All trading and wallet endpoints SHALL require a valid JWT access token from the `accessToken` httpOnly cookie; unauthenticated requests MUST receive 401.

#### Scenario: Unauthorized order placement
- **WHEN** a request to place an order lacks a valid auth cookie
- **THEN** the API returns 401 Unauthorized

### Requirement: Frontend auth state
The Next.js app SHALL rely on httpOnly cookies for authentication and redirect unauthenticated users from protected pages. The frontend MUST NOT read or persist JWT strings in JavaScript-accessible storage.

#### Scenario: Access trading page without login
- **WHEN** an unauthenticated user navigates to `/trade`
- **THEN** they are redirected to `/login` with a return URL

#### Scenario: Check auth via session endpoint
- **WHEN** the app needs to determine login state on page load
- **THEN** it calls a session/me endpoint with `credentials: 'include'` rather than reading a token from client storage
