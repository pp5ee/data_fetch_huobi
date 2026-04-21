// Main entry point for Huobi JavaScript data fetcher
const FetchClient = require('./FetchClient');

/**
 * Main application entry point
 * Similar to Python's main_test.py functionality
 */
class HuobiDataFetcher {
    constructor() {
        this.fetchClient = null;
    }

    /**
     * Start fetching historical k-line data
     */
    startHistoricalFetch(symbol = 'btcusdt', period = 30, exchange = 'huobi') {
        console.log(`Starting historical data fetch for ${symbol} with ${period}min period`);

        this.fetchClient = new FetchClient('', exchange, symbol, period);
        this.fetchClient.startFetch('req');

        return this.fetchClient;
    }

    /**
     * Start real-time k-line data subscription
     */
    startRealtimeSubscription(symbol = 'btcusdt', period = 30, exchange = 'huobi') {
        console.log(`Starting real-time subscription for ${symbol} with ${period}min period`);

        this.fetchClient = new FetchClient('', exchange, symbol, period);
        this.fetchClient.startFetch('sub');

        return this.fetchClient;
    }

    /**
     * Stop data fetching
     */
    stop() {
        if (this.fetchClient && this.fetchClient.getWs()) {
            this.fetchClient.getWs().close();
            console.log('Data fetching stopped');
        }
    }

    /**
     * Get current status
     */
    getStatus() {
        if (!this.fetchClient) {
            return { status: 'not_started' };
        }

        const ws = this.fetchClient.getWs();
        return {
            status: ws ? (ws.readyState === ws.OPEN ? 'connected' : 'disconnected') : 'no_connection',
            symbol: this.fetchClient.symbol,
            period: this.fetchClient.period,
            fetchCount: this.fetchClient.fetchCount,
            totalRecords: this.fetchClient.recordsIndexes.length
        };
    }
}

// Export for use in other modules
module.exports = HuobiDataFetcher;

// Main execution if run directly
if (require.main === module) {
    console.log('Huobi JavaScript Data Fetcher - Starting...');

    const fetcher = new HuobiDataFetcher();

    // Start with historical data fetch by default
    fetcher.startHistoricalFetch();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nReceived SIGINT. Stopping...');
        fetcher.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\nReceived SIGTERM. Stopping...');
        fetcher.stop();
        process.exit(0);
    });
}