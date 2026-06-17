## ADDED Requirements

### Requirement: Trading pair list
The API SHALL expose a list of active trading pairs with symbol, base asset, quote asset, price precision, quantity precision, and 24h statistics.

#### Scenario: Fetch trading pairs
- **WHEN** client requests `GET /api/v1/markets`
- **THEN** the response includes all active pairs with their metadata and 24h ticker stats

### Requirement: Ticker data
The API SHALL provide real-time ticker data per trading pair including last price, 24h high/low, 24h volume, and price change percentage.

#### Scenario: Single pair ticker
- **WHEN** client requests `GET /api/v1/markets/BTC-USDT/ticker`
- **THEN** the response includes last price, 24h change %, high, low, and volume

### Requirement: Order book depth
The API SHALL provide order book snapshots with configurable depth levels (default 20) showing bid/ask price and quantity.

#### Scenario: Order book snapshot
- **WHEN** client requests `GET /api/v1/markets/BTC-USDT/depth?limit=20`
- **THEN** the response contains up to 20 bid levels and 20 ask levels sorted by price

### Requirement: K-line (candlestick) data
The API SHALL provide historical OHLCV candlestick data with supported intervals: 1m, 5m, 15m, 1h, 4h, 1d.

#### Scenario: Fetch 1h candles
- **WHEN** client requests `GET /api/v1/markets/BTC-USDT/klines?interval=1h&limit=100`
- **THEN** the response returns up to 100 hourly candles with open, high, low, close, volume, and timestamp

### Requirement: Market data UI
The frontend SHALL display a trading page with pair selector, ticker summary, order book, K-line chart, and recent trades panel.

#### Scenario: Switch trading pair
- **WHEN** user selects ETH/USDT from the pair dropdown
- **THEN** ticker, order book, chart, and trade form update to ETH/USDT data
