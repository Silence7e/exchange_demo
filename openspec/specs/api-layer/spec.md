# api-layer

## Purpose

Capability specification for the exchange platform (archived from `exchange-platform` change).

## Requirements

### Requirement: REST API versioning
All API endpoints SHALL be prefixed with `/api/v1/` to support future versioning.

#### Scenario: Versioned endpoint
- **WHEN** client calls the markets endpoint
- **THEN** the URL is `GET /api/v1/markets`

### Requirement: Standardized error response
All API errors SHALL return a consistent JSON structure: `{ "code": string, "message": string, "details"?: object }`.

#### Scenario: Validation error
- **WHEN** client sends an invalid request body
- **THEN** the API returns 400 with `{ "code": "VALIDATION_ERROR", "message": "...", "details": { "field": "..." } }`

### Requirement: Pagination
List endpoints SHALL support cursor-based or offset pagination with `limit` and `offset`/`cursor` query parameters; default limit is 20, max is 100.

#### Scenario: Paginated order list
- **WHEN** client requests `GET /api/v1/orders?limit=10&offset=20`
- **THEN** the response includes `data` array and `pagination: { total, limit, offset }`

### Requirement: Swagger documentation
The NestJS API SHALL auto-generate OpenAPI 3.0 documentation accessible at `/api/docs`.

#### Scenario: View API docs
- **WHEN** developer navigates to `/api/docs`
- **THEN** they see interactive Swagger UI with all endpoints documented

### Requirement: Rate limiting
Public endpoints SHALL be rate-limited to 100 requests per minute per IP; authenticated endpoints to 300 per minute per user.

#### Scenario: Rate limit exceeded
- **WHEN** a client exceeds the rate limit
- **THEN** the API returns 429 with `Retry-After` header

### Requirement: CORS configuration
The API SHALL allow CORS requests from the Next.js frontend origin in development and configured production domains. CORS MUST enable `credentials: true` to support httpOnly cookie authentication.

#### Scenario: Frontend API call with cookies
- **WHEN** the Next.js app at `localhost:3000` calls the API at `localhost:4000` with `credentials: 'include'`
- **THEN** the CORS preflight succeeds, cookies are accepted, and the response is returned

### Requirement: Request validation
All API inputs SHALL be validated using `class-validator` DTOs with whitelist mode enabled.

#### Scenario: Extra fields rejected
- **WHEN** client sends unknown fields in the request body
- **THEN** the fields are stripped or the request is rejected per whitelist config
