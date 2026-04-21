# Requirement

帮我把这个项目转写成js

**AI Understanding:**
Based on my analysis of the Python codebase, I understand this is a **Huobi cryptocurrency exchange data fetching project** that uses WebSocket connections to retrieve k-line (candlestick) data. Here's what the current Python project does:
## Current Python Implementation
- **WebSocket client** that connects to Huobi's API
- **Fetches historical k-line data** via `req` method and **subscribes to real-time data** via `sub` method
- **Stores data in MySQL database** with table structure for each symbol/period combination
- **Handles message compression** (zlib) and ping-pong heartbeat
- **Configurable** via INI files for exchange URLs and MySQL parameters
## JavaScript Conversion Plan
To convert this to JavaScript, I'll need to make some technology stack decisions. Here are the key questions:
1. **Database choice**: Should I keep MySQL or switch to a more Node.js-friendly option like MongoDB/SQLite?
2. **WebSocket library**: Use native `ws` or a higher-level library like `socket.io`?
3. **Configuration management**: Keep INI files or switch to JSON/JavaScript config?
4. **Logging**: Use `winston`/`bunyan` or keep the current YAML-based logging?
5. **Package management**: Use npm/yarn with `package.json`?
**Clarifying question**: Do you want a direct 1:1 conversion maintaining the same architecture, or are you open to modernizing the approach with more Node.js-idiomatic patterns?
Once you confirm the approach, I'll generate a complete implementation plan. Type "start" or "proceed" when you're ready.

keep MySQL，native ws，Keep INI files ，YAML-based logging，Use npm

**AI Understanding:**
Perfect! I now have a complete understanding of the Python Huobi data fetching project. Here's my analysis and conversion plan:
## Current Python Project Structure
- **FetchClient.py**: Main WebSocket client that connects to Huobi API and fetches k-line data
- **MessageFormat.py**: Handles message compression/decompression and ping-pong heartbeat
- **sql_connection.py**: MySQL database operations for storing k-line data
- **main_test.py**: Entry point with configuration
- **Configuration files**: INI files for MySQL and exchange settings, YAML for logging
## JavaScript Conversion Plan
Based on your requirements (MySQL, native ws, INI files, YAML logging, npm), here's the exact conversion:
### Core Components to Convert:
1. **WebSocket Client** (`ws` library) - replacing `websocket` Python module
2. **Message Handler** - replacing `MessageFormat.py` with zlib compression
3. **MySQL Database** - using `mysql2` or `mysql` npm package
4. **Configuration Management** - INI files with `ini` package, YAML with `js-yaml`
5. **Logging** - YAML-based with `winston` or custom logger
### Key Technical Decisions:
- **Database**: `mysql2` (better performance than `mysql`)
- **WebSocket**: Native `ws` library 
- **Configuration**: `ini` package for INI files, `js-yaml` for YAML
- **Logging**: Custom implementation with YAML config support
- **Package Manager**: npm with `package.json`
### Project Structure:
```
huobi-js/
├── src/
│   ├── FetchClient.js
│   ├── MessageFormat.js
│   ├── sqlConnection.js
│   └── index.js
├── config/
│   ├── mysql_params.ini
│   ├── exchanges_config.ini
│   └── log_config.yaml
├── package.json
└── README.md
```
The conversion will maintain the exact same functionality:
- WebSocket connection to Huobi API
- K-line data fetching (both historical via `req` and real-time via `sub`)
- MySQL database storage with same table structure
- Message compression/decompression
- Ping-pong heartbeat
- YAML-based logging
**Ready to proceed?** Type "start" or "proceed" and I'll generate the complete JavaScript implementation with all the necessary files and package.json setup.

---

## Implementation Notes

- For any unspecified details (combat formulas, game balance, UI layout, tech choices, etc.), make reasonable decisions yourself and document them in the plan. Do NOT ask the user for clarification — proceed with sensible defaults.
- If referenced image files exist in the workspace, treat them as visual style references.

## Standard Deliverables (mandatory for every project)

- **README.md** — must be included at the project root with: project title & description, prerequisites, installation steps, usage examples with code snippets, configuration options, and project structure overview.
- **Git commits** — use conventional commit prefix `feat:` for all commits.
