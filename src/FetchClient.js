const WebSocket = require('ws');
const { loadConfig } = require('./configParser');
const { loadYamlConfig } = require('./yamlConfig');
const SqlConnection = require('./sqlConnection');
const Message = require('./MessageFormat');

/**
 * FetchClient - Main WebSocket client for Huobi API
 * Similar to Python's FetchClient class with enhanced error handling and resilience
 */
class FetchClient {
    constructor(instanceId = '', exchange = '', symbol = 'btcusdt', period = 30, size = 240) {
        this.symbol = symbol;
        this.period = period;
        this.size = size;

        // Initialize logger configuration
        try {
            const logConfig = loadYamlConfig('log_config.yaml');
            // For now, use console logging - will implement YAML-based logging in Task 13
            this.logger = console;
        } catch (error) {
            this.logger = console; // Fallback to console logging
        }

        // Initialize MySQL connection
        this.sqlClient = new SqlConnection(symbol, period, this.logger);

        // Load exchange configuration
        const exchangeConfig = loadConfig('exchanges_config.ini');
        this.url = exchangeConfig.get(exchange || 'huobi', 'url');

        // Initialize time tracking
        this.startTime = 1501174800; // Default start time
        this.toTime = Math.floor(Date.now() / 1000);

        // WebSocket properties
        this.reqWs = null;
        this.func = null;
        this.instanceId = instanceId;
        this.timeUnit = 1 * 60 * this.period * this.size;
        this.reqCount = 0;
        this.subDict = {};
        this.totalData = {};

        // Connection resilience properties
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.maxReconnectDelay = 30000; // Max 30 seconds
        this.isReconnecting = false;
        this.connectionTimeout = 10000; // 10 second connection timeout

        // Initialize records indexes
        this.recordsIndexes = [];
        this.initializeRecordsIndexes();

        // Counters
        this.fetchCount = 0;
        this.recordsIndex = 0;
    }

    /**
     * Initialize records timestamp indexes for historical data fetching
     */
    initializeRecordsIndexes() {
        let start = this.toTime - this.timeUnit + 1;
        let to = this.toTime;
        const step = this.timeUnit;

        while (to > this.startTime) {
            this.recordsIndexes.push([Math.max(start, this.startTime), to]);
            to = to - step;
            start = start - step;
        }

        this.logger.info(`Initialized ${this.recordsIndexes.length} records indexes`);
    }

    /**
     * Handle incoming WebSocket messages
     */
    onMessage(message) {
        const msg = new Message(this.logger);

        if (this.func === 'req') {
            this.handleRequestMessage(msg, message);
        } else if (this.func === 'sub') {
            // TODO: Implement real-time subscription handling
            this.logger.info('Real-time subscription mode - not yet implemented');
        }
    }

    /**
     * Handle request message processing
     */
    handleRequestMessage(msg, message) {
        // Process current fetch request
        if (this.fetchCount < this.recordsIndexes.length && typeof msg[this.func] === 'function') {
            this.processFetchRequest(msg, message);
        }

        // Handle completion and subscription transition
        if (this.recordsIndex === this.recordsIndexes.length - 1) {
            this.handleFetchCompletion(msg, message);
        }
    }

    /**
     * Process individual fetch request
     */
    processFetchRequest(msg, message) {
        const func = msg[this.func];
        const data = JSON.stringify({
            req: `market.${this.symbol}.kline.${this.period}min`,
            id: this.fetchCount,
            from: this.recordsIndexes[this.fetchCount][0],
            to: this.recordsIndexes[this.fetchCount][1]
        });

        func.call(msg, this.reqWs, message, data, this.reqCount);
        this.reqCount = 1;

        const reqData = msg.getReqMsg();
        if (reqData) {
            if (reqData[0] === this.fetchCount) {
                this.fetchCount += 1;
                this.reqCount = 0;
            }
            this.totalData[reqData[0]] = reqData[1];
            this.recordsIndex = reqData[0];
        }
    }

    /**
     * Handle fetch completion and transition to subscription
     */
    handleFetchCompletion(msg, message) {
        // Save collected data
        if (Object.keys(this.totalData).length > 0) {
            this.sqlClient.saveReqRecords(this.totalData)
                .then(result => {
                    this.logger.info(`Save message: ${result}`);
                })
                .catch(error => {
                    this.logger.error(`Error saving records: ${error.message}`);
                });
            this.totalData = {};
        }

        // Setup subscription
        const sub = `market.${this.symbol}.kline.${this.period}min`;
        if (!this.subDict[sub]) {
            const subId = Object.keys(this.subDict).length.toString();
            const subData = JSON.stringify({
                sub: sub,
                id: subId
            });
            this.subDict[sub] = subId;
            msg.subPadding(this.reqWs, message, subData, 0);
        } else {
            msg.subPadding(this.reqWs, message, '', 1);
        }

        // Process subscription data
        const subValues = msg.getSubMsg();
        if (subValues) {
            this.sqlClient.updateRecords(subValues)
                .catch(error => {
                    this.logger.error(`Error updating records: ${error.message}`);
                });
        }
    }

    /**
     * Handle WebSocket errors with reconnection logic
     */
    onError(error) {
        this.logger.error(`WebSocket error: ${error.message}`);

        // Attempt reconnection if not already reconnecting
        if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnection();
        }
    }

    /**
     * Handle WebSocket connection close with reconnection logic
     */
    onClose() {
        this.logger.info('WebSocket connection closed');

        // Attempt reconnection if not already reconnecting and this was an unexpected close
        if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnection();
        }
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    scheduleReconnection() {
        this.isReconnecting = true;
        this.reconnectAttempts++;

        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);

        this.logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

        setTimeout(() => {
            this.logger.info('Attempting reconnection...');
            this.startFetch(this.func);
        }, delay);
    }

    /**
     * Reset reconnection state on successful connection
     */
    resetReconnectionState() {
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
    }

    /**
     * Handle WebSocket connection open
     */
    onOpen() {
        this.logger.info('WebSocket connection successful');
    }

    /**
     * Start fetching data with specified function
     * @param {string} func - 'req' for historical data, 'sub' for real-time data
     */
    startFetch(func = 'req') {
        this.func = func;

        // Initialize database tables
        this.sqlClient.createTables()
            .then(() => this.sqlClient.deleteFinalRecords())
            .then(() => {
                // Create WebSocket connection
                this.reqWs = new WebSocket(this.url);

                this.reqWs.on('open', () => this.onOpen());
                this.reqWs.on('message', (data) => this.onMessage(data));
                this.reqWs.on('error', (error) => this.onError(error));
                this.reqWs.on('close', () => this.onClose());

                return this.reqWs;
            })
            .catch(error => {
                this.logger.error(`Failed to start fetch: ${error.message}`);
            });
    }

    /**
     * Get WebSocket instance
     */
    getWs() {
        return this.reqWs;
    }

    /**
     * Get fetched data
     */
    getData() {
        return this.totalData;
    }

    /**
     * Get subscription dictionary
     */
    getSubDict() {
        return this.subDict;
    }
}

module.exports = FetchClient;