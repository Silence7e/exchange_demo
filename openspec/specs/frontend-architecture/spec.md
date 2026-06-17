# frontend-architecture

## Purpose

Capability specification for the exchange platform (archived from `exchange-platform` change).

## Requirements

### Requirement: Native fetch API client
The frontend SHALL use native `fetch` wrapped in a typed `apiClient` utility for all REST requests. All requests MUST include `credentials: 'include'` so httpOnly auth cookies are sent automatically.

#### Scenario: API request via apiClient
- **WHEN** a component needs to call a REST endpoint
- **THEN** it uses `apiClient<T>(path, init)` with `credentials: 'include'`, parses JSON, and throws `ApiError` on non-2xx responses

#### Scenario: Shared error handling
- **WHEN** the API returns `{ "code": "INSUFFICIENT_BALANCE", "message": "..." }`
- **THEN** `apiClient` throws an `ApiError` with the `code` and `message` fields accessible to callers

### Requirement: TanStack Query v5 for server state
All REST-fetched data (balances, orders, market list, kline history) SHALL be managed via TanStack Query v5 hooks. This is the confirmed server-state solution for the project.

#### Scenario: Balance fetching
- **WHEN** the wallet page loads
- **THEN** it uses a `useBalances()` query hook that handles loading, error, and caching states

#### Scenario: Mutation invalidation after order placement
- **WHEN** a user successfully places an order via `usePlaceOrder` mutation
- **THEN** the orders and balances query caches are invalidated and refetched

### Requirement: Zustand stores for realtime and UI state
WebSocket-driven realtime data and ephemeral UI state SHALL be stored in Zustand stores. This is the confirmed client-state solution for the project. Server state MUST NOT be duplicated into Zustand.

#### Scenario: Ticker update via WebSocket
- **WHEN** a `ticker.update` WebSocket event is received
- **THEN** the Zustand market store is updated and subscribed components re-render

#### Scenario: No REST data in Zustand
- **WHEN** balances are fetched from the REST API
- **THEN** they are stored in TanStack Query cache, not in a Zustand balance store

### Requirement: State responsibility separation
The frontend SHALL follow a strict state layering convention.

#### Scenario: Trading pair in URL
- **WHEN** user navigates to `/trade/BTC-USDT`
- **THEN** the current trading pair is read from the URL path parameter, not from a global Zustand store

#### Scenario: Order form draft in local state
- **WHEN** user types a price in the trading form
- **THEN** the input value is held in component-local `useState`, not in Zustand or TanStack Query

#### Scenario: WebSocket connection status
- **WHEN** the WebSocket connection drops and reconnects
- **THEN** the connection status is tracked in a Zustand `wsStore`

### Requirement: WebSocket hook integration
A reusable `useWebSocket` hook SHALL manage connection lifecycle and write incoming events to the appropriate Zustand store. It MAY call `queryClient.setQueryData` to sync specific events into TanStack Query cache when needed.

#### Scenario: Auto-resubscribe on reconnect
- **WHEN** the WebSocket reconnects after a disconnect
- **THEN** all previously subscribed channels are re-subscribed automatically

### Requirement: Auth token storage via httpOnly cookies
JWT access and refresh tokens SHALL be stored exclusively in httpOnly cookies set by the server. Tokens MUST NOT be stored in Zustand, localStorage, sessionStorage, or returned as plain text in API response bodies.

#### Scenario: Login sets httpOnly cookies
- **WHEN** user successfully logs in
- **THEN** the API responds with `Set-Cookie` headers for `accessToken` and `refreshToken`, and the response body does not contain raw JWT strings

#### Scenario: Token not in client storage
- **WHEN** inspecting Zustand store state, localStorage, or sessionStorage
- **THEN** no field contains a raw JWT access token or refresh token

#### Scenario: Authenticated request via cookie
- **WHEN** `apiClient` calls a protected endpoint after login
- **THEN** the browser automatically sends the `accessToken` httpOnly cookie without frontend code reading the token value
