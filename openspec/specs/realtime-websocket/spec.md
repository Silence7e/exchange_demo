# realtime-websocket

## Purpose

Capability specification for the exchange platform (archived from `exchange-platform` change).

## Requirements

### Requirement: WebSocket connection
The API SHALL expose a WebSocket endpoint at `/ws` supporting connection upgrade. Private channel authentication SHALL use the `accessToken` httpOnly cookie sent during the WebSocket handshake.

#### Scenario: Authenticated connection via cookie
- **WHEN** client connects to `/ws` with a valid `accessToken` httpOnly cookie on the handshake request
- **THEN** the connection is established and the server sends a `connected` event

#### Scenario: Unauthenticated private channel
- **WHEN** client attempts to subscribe to `user.orders` without a valid auth cookie
- **THEN** the server rejects the subscription with an error event

### Requirement: Public market channels
Clients SHALL be able to subscribe to public channels: `ticker.<symbol>`, `depth.<symbol>`, `trade.<symbol>`.

#### Scenario: Subscribe to ticker
- **WHEN** client sends `{ "action": "subscribe", "channel": "ticker.BTC-USDT" }`
- **THEN** the server pushes ticker updates for BTC-USDT in real time

### Requirement: Private user channels
Authenticated clients SHALL be able to subscribe to private channels: `user.orders`, `user.balances`.

#### Scenario: Order update push
- **WHEN** a user's order is filled
- **THEN** the server pushes an `order.update` event to their `user.orders` channel

### Requirement: Heartbeat and reconnection
The WebSocket protocol SHALL implement ping/pong heartbeat every 30 seconds; clients MUST reconnect with exponential backoff on disconnect.

#### Scenario: Server ping
- **WHEN** 30 seconds pass without client activity
- **THEN** the server sends a ping frame and closes the connection if no pong within 10 seconds

### Requirement: Frontend WebSocket hook
The Next.js app SHALL provide a reusable `useWebSocket` hook managing connection lifecycle, subscriptions, and reconnection.

#### Scenario: Auto-resubscribe on reconnect
- **WHEN** the WebSocket connection drops and reconnects
- **THEN** all previous channel subscriptions are automatically re-established
