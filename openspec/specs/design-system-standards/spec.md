# design-system-standards

## Purpose

Capability specification for the exchange platform (archived from `exchange-platform` change).

## Requirements

### Requirement: Semantic color tokens
The design system SHALL define semantic color tokens for trading UI: `price-up`, `price-down`, `price-neutral`, `bid`, `ask`, `background`, `surface`, `border`, `text-primary`, `text-secondary`.

#### Scenario: Price change display
- **WHEN** a ticker's 24h change is positive
- **THEN** the change percentage is rendered using the `price-up` token color

#### Scenario: Order book sides
- **WHEN** the order book displays bid and ask levels
- **THEN** bids use `bid` token and asks use `ask` token consistently across all pages

### Requirement: Up/down color convention
The system SHALL default to green-up / red-down (international convention) with the convention stored as a single config constant to allow future locale override.

#### Scenario: Default convention
- **WHEN** no locale override is set
- **THEN** positive price changes display in green and negative changes display in red

### Requirement: Number formatting rules
Shared formatter utilities SHALL implement consistent rules for prices, quantities, volumes, and percentages.

#### Scenario: Price formatting
- **WHEN** displaying BTC/USDT price `42156.789`
- **THEN** it renders as `42,156.79` (thousand separator, pair-specific decimal places, round half-up)

#### Scenario: Quantity formatting
- **WHEN** displaying quantity `0.00123456` for BTC
- **THEN** trailing zeros are trimmed to significant digits up to pair max precision (e.g., `0.001235`)

#### Scenario: Percentage formatting
- **WHEN** displaying 24h change of `0.0523`
- **THEN** it renders as `+5.23%` with explicit sign for positive values

### Requirement: BigNumber handling
All monetary calculations on the backend and display formatting on the frontend SHALL use arbitrary-precision decimal libraries (e.g., `decimal.js` or `bignumber.js`) to avoid floating-point errors.

#### Scenario: Order total calculation
- **WHEN** calculating order total as price × quantity
- **THEN** the result uses decimal arithmetic, not native JavaScript `number` multiplication

### Requirement: Shared formatter package
Number and currency formatters SHALL live in `packages/shared` so both frontend components and backend response serialization use the same logic.

#### Scenario: API and UI consistency
- **WHEN** the API returns a formatted price string in a summary endpoint
- **THEN** it matches what the frontend formatter would produce for the same raw value
