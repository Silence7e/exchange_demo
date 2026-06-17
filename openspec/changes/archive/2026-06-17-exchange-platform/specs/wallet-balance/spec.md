## ADDED Requirements

### Requirement: Balance query
Authenticated users SHALL be able to view their asset balances including total, available, and frozen amounts.

#### Scenario: View all balances
- **WHEN** user requests `GET /api/v1/wallet/balances`
- **THEN** the response lists all assets with `available`, `frozen`, and `total` amounts

### Requirement: Balance initialization
New users SHALL receive initial demo balances for major assets (e.g., 10000 USDT, 1 BTC) for development/testing purposes.

#### Scenario: New user demo balance
- **WHEN** a new user registers
- **THEN** their wallet is credited with configured demo balances

### Requirement: Balance freeze on order
When a user places an order, the system SHALL freeze the required asset amount and reduce the available balance accordingly.

#### Scenario: Freeze on limit buy
- **WHEN** user places a limit buy for 0.01 BTC at 42000 USDT
- **THEN** 420 USDT is moved from available to frozen

### Requirement: Balance update on trade
When an order is filled, the system SHALL atomically debit the spent asset, credit the received asset, and release any remaining frozen amount.

#### Scenario: Full fill settlement
- **WHEN** a buy order for 0.01 BTC at 42000 USDT is fully filled
- **THEN** 420 USDT is debited (from frozen), 0.01 BTC is credited to available balance

### Requirement: Wallet UI
The frontend SHALL display a wallet page with asset list, available/frozen breakdown, and estimated total value in USDT.

#### Scenario: Display wallet
- **WHEN** user navigates to `/wallet`
- **THEN** they see all asset balances formatted per design-system number rules with total portfolio value
