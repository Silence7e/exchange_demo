# spot-trading

## Purpose

Capability specification for the exchange platform (archived from `exchange-platform` change).

## Requirements

### Requirement: Limit order placement
Authenticated users SHALL be able to place limit buy/sell orders specifying price and quantity.

#### Scenario: Place limit buy order
- **WHEN** user submits a limit buy for 0.01 BTC at 42000 USDT with sufficient USDT balance
- **THEN** the order is created with status `OPEN` and the USDT amount is frozen

#### Scenario: Insufficient balance
- **WHEN** user submits an order exceeding their available balance
- **THEN** the API returns 400 with error code `INSUFFICIENT_BALANCE`

### Requirement: Market order placement
Authenticated users SHALL be able to place market buy/sell orders that execute at the best available price.

#### Scenario: Place market sell
- **WHEN** user submits a market sell for 0.01 BTC with sufficient BTC balance
- **THEN** the order is immediately matched against the best bid and filled or partially filled

### Requirement: Order cancellation
Users SHALL be able to cancel their own open orders.

#### Scenario: Cancel open order
- **WHEN** user cancels an open limit order
- **THEN** the order status changes to `CANCELLED` and frozen funds are released

#### Scenario: Cancel filled order
- **WHEN** user attempts to cancel an already filled order
- **THEN** the API returns 400 with error code `ORDER_NOT_CANCELLABLE`

### Requirement: Order history
Users SHALL be able to view their order history with filtering by status, pair, and time range.

#### Scenario: List open orders
- **WHEN** user requests `GET /api/v1/orders?status=OPEN`
- **THEN** only their open orders are returned, paginated

### Requirement: Order matching engine
The backend SHALL maintain an in-memory or Redis-backed order book per pair and match incoming orders using price-time priority.

#### Scenario: Limit order matches existing ask
- **WHEN** a limit buy at 42000 USDT is placed and an ask exists at 42000 USDT
- **THEN** the orders are matched, trades are recorded, and balances are updated atomically

### Requirement: Trading form UI
The frontend SHALL provide a trading form with order type toggle (limit/market), side toggle (buy/sell), price and quantity inputs with validation against pair precision rules.

#### Scenario: Input validation
- **WHEN** user enters a price with more decimal places than the pair allows
- **THEN** the form shows a validation error before submission
