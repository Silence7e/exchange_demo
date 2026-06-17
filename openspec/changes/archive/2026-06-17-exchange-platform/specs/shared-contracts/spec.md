## ADDED Requirements

### Requirement: Shared domain types
The `packages/shared` package SHALL export TypeScript types and enums for all domain entities used by both frontend and backend.

#### Scenario: Order type consistency
- **WHEN** the API returns an order object and the frontend renders it
- **THEN** both use the same `Order` interface and `OrderStatus` enum from `packages/shared`

### Requirement: API request/response DTOs
Shared DTO types SHALL be defined once in `packages/shared` and imported by NestJS controllers and Next.js API client.

#### Scenario: Place order request
- **WHEN** frontend sends a place-order request
- **THEN** the request body conforms to `PlaceOrderDto` defined in `packages/shared`

### Requirement: WebSocket event contracts
WebSocket message types SHALL be defined in `packages/shared` with discriminated union types for event name and payload.

#### Scenario: Ticker update event
- **WHEN** the server pushes a ticker update over WebSocket
- **THEN** the message matches `WsEvent<'ticker.update', TickerPayload>` from shared contracts

### Requirement: Trading pair metadata
Trading pair configuration (symbol, base/quote asset, price precision, quantity precision, min order size) SHALL be defined in shared constants and served by the API.

#### Scenario: BTC/USDT precision
- **WHEN** the system processes a BTC/USDT order
- **THEN** price precision is 2 decimal places and quantity precision is 6 decimal places as defined in shared pair config
