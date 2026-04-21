const zlib = require('zlib');

/**
 * Message format handler for Huobi WebSocket messages
 * Similar to Python's Message class
 */
class Message {
    constructor(logger = console) {
        this.reqMsg = {};
        this.subMsg = null;
        this.logger = logger;
    }

    /**
     * Handle subscription message padding and ping-pong heartbeat
     */
    subPadding(ws, message, data = null, totalCount = null) {
        try {
            // Decompress the message
            const decompressed = zlib.inflateSync(message);
            const wsResult = decompressed.toString('utf8');

            this.logger.info(`Received server data: ${wsResult}`);

            if (totalCount < 1 && data) {
                this.logger.info(`Sending subscription: ${data}`);
                ws.send(data);
            }

            // Handle ping-pong heartbeat
            if (wsResult.includes('ping')) {
                const parsed = JSON.parse(wsResult);
                const pingId = parsed.ping;
                const pongData = JSON.stringify({ pong: pingId });
                ws.send(pongData);
                this.logger.info(`Sent pong: ${pongData}`);
            }

            // Handle tick data
            if (wsResult.includes('tick')) {
                const parsed = JSON.parse(wsResult);
                this.subMsg = parsed.tick;
            }
        } catch (error) {
            this.logger.error(`Error in subPadding: ${error.message}`);
        }
    }

    /**
     * Handle request message processing
     */
    req(ws, message, data, totalCount) {
        try {
            // Decompress the message
            const decompressed = zlib.inflateSync(message);
            const wsResult = decompressed.toString('utf8');

            if (totalCount < 1 && data) {
                this.logger.info(`Sending data: ${data}`);
                ws.send(data);
            }

            // Handle ping-pong heartbeat
            const parsed = JSON.parse(wsResult);
            if (wsResult.includes('ping')) {
                const pingId = parsed.ping;
                const pongData = JSON.stringify({ pong: pingId });
                ws.send(pongData);
                this.logger.info(`Sent pong: ${pongData}`);
            }

            // Handle response with ID and status
            if (wsResult.includes('id') && wsResult.includes('status')) {
                this.logger.info(`Server response: ${wsResult}`);
                const index = parsed.id;
                const responseData = parsed.data;

                if (responseData) {
                    this.reqMsg = [index, responseData];
                } else {
                    this.reqMsg = null;
                }
            }
        } catch (error) {
            this.logger.error(`Error in req: ${error.message}`);
        }
    }

    /**
     * Get request message
     */
    getReqMsg() {
        return this.reqMsg;
    }

    /**
     * Get subscription message
     */
    getSubMsg() {
        return this.subMsg;
    }
}

module.exports = Message;