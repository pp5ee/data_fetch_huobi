# Huobi JavaScript Data Fetcher

A JavaScript/Node.js implementation of the Huobi cryptocurrency exchange data fetching project, converted from Python while maintaining identical functionality.

## Project Description

This project provides a WebSocket client for fetching k-line (candlestick) data from Huobi's cryptocurrency exchange API. It supports both historical data fetching and real-time data subscription, storing the data in a MySQL database with the same structure as the original Python implementation.

## Prerequisites

- Node.js 18.0.0 or higher
- MySQL 5.7 or higher
- Access to Huobi API endpoints

## Installation

1. Clone or download the project files
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your MySQL database and exchange settings in the `config/` directory:
   - `mysql_params.ini` - MySQL connection parameters
   - `exchanges_config.ini` - Huobi API endpoints
   - `log_config.yaml` - Logging configuration

## Usage

### Basic Usage

```javascript
const HuobiDataFetcher = require('./src/index');

// Create a new fetcher instance
const fetcher = new HuobiDataFetcher();

// Start fetching historical k-line data
fetcher.startHistoricalFetch('btcusdt', 30, 'huobi');

// Or start real-time subscription
// fetcher.startRealtimeSubscription('btcusdt', 30, 'huobi');

// Check status
console.log(fetcher.getStatus());

// Stop when done
// fetcher.stop();
```

### Configuration Files

#### MySQL Configuration (`config/mysql_params.ini`)
```ini
[mysql]
host=192.168.50.110
port=3306
user=root
password=123456
```

#### Exchange Configuration (`config/exchanges_config.ini`)
```ini
[huobi]
url=wss://api.huobi.br.com/ws
```

#### Logging Configuration (`config/log_config.yaml`)
```yaml
version: 1
formatters:
  simple:
    format: '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
handlers:
  console:
    class: logging.StreamHandler
    level: DEBUG
    formatter: simple
loggers:
  simpleExample:
    level: DEBUG
    handlers: [console]
    propagate: no
root:
  level: DEBUG
  handlers: [console]
```

## Project Structure

```
huobi-js/
├── src/
│   ├── index.js              # Main application entry point
│   ├── FetchClient.js        # WebSocket client for Huobi API
│   ├── MessageFormat.js      # Message compression/decompression
│   ├── sqlConnection.js      # MySQL database operations
│   ├── configParser.js       # INI configuration file parsing
│   ├── yamlConfig.js         # YAML configuration file parsing
│   └── logger.js             # Comprehensive logging system
├── config/
│   ├── mysql_params.ini      # MySQL connection parameters
│   ├── exchanges_config.ini  # Exchange API endpoints
│   └── log_config.yaml       # Logging configuration
├── package.json              # npm project configuration
└── README.md                 # This file
```

## Features

### WebSocket Connection (AC-1)
- Establishes WebSocket connection to Huobi API endpoint
- Handles ping-pong heartbeat messages automatically
- Reconnects automatically after connection failures

### Historical K-line Data Fetching (AC-2)
- Fetches historical k-line data for specified symbol/period combinations
- Handles time range queries with correct from/to parameters
- Processes compressed message responses with zlib decompression

### Real-time K-line Data Subscription (AC-3)
- Subscribes to real-time k-line data streams
- Processes incoming real-time messages with correct formatting
- Maintains multiple subscription channels simultaneously

### MySQL Database Integration (AC-4)
- Creates database tables for each symbol/period combination
- Stores fetched k-line data in correct table structures
- Updates existing records without data duplication

### Configuration Management (AC-5)
- Loads MySQL parameters from INI configuration files
- Reads exchange settings from INI files with correct encoding
- Configures logging system from YAML configuration

### Message Compression and Decompression (AC-6)
- Correctly decompresses zlib-compressed WebSocket messages
- Handles message fragmentation and reassembly
- Maintains message integrity during compression/decompression

### Error Handling and Resilience (AC-7)
- Gracefully handles WebSocket connection failures
- Recovers from database connection interruptions
- Logs errors with appropriate context and severity

## Database Schema

The application creates tables with the following structure for each symbol/period combination:

```sql
CREATE TABLE IF NOT EXISTS symbol_periodmin (
    id INT UNSIGNED AUTO_INCREMENT,
    timestamp INT(13) NOT NULL DEFAULT '0',
    open FLOAT NOT NULL,
    close FLOAT NOT NULL,
    high FLOAT NOT NULL,
    low FLOAT NOT NULL,
    vol FLOAT NOT NULL,
    amount FLOAT NOT NULL,
    count INT(10) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## API Reference

### HuobiDataFetcher Class

#### Constructor
- `new HuobiDataFetcher()` - Creates a new data fetcher instance

#### Methods
- `startHistoricalFetch(symbol, period, exchange)` - Start historical data fetch
- `startRealtimeSubscription(symbol, period, exchange)` - Start real-time subscription
- `stop()` - Stop data fetching
- `getStatus()` - Get current status information

### FetchClient Class

#### Constructor
- `new FetchClient(instanceId, exchange, symbol, period, size)` - Creates WebSocket client

#### Methods
- `startFetch(func)` - Start fetching with specified function ('req' or 'sub')
- `getWs()` - Get WebSocket instance
- `getData()` - Get fetched data
- `getSubDict()` - Get subscription dictionary

## Error Handling

The application includes comprehensive error handling for:
- WebSocket connection failures
- Database connection issues
- Configuration file errors
- Message processing errors

All errors are logged with appropriate context and severity levels.

## Contributing

This is a conversion project from Python to JavaScript. The goal is to maintain functional parity with the original Python implementation while adapting to Node.js patterns and best practices.

## License

MIT License - See package.json for details.
