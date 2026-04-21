const mysql = require('mysql2/promise');
const { loadConfig } = require('./configParser');

/**
 * MySQL connection class similar to Python's SqlConnection
 * Handles database operations for Huobi k-line data storage
 */
class SqlConnection {
    constructor(symbol = 'btcusdt', period = 60, logger = console) {
        this.symbol = symbol;
        this.period = period;
        this.logger = logger;

        // Load MySQL configuration from INI file
        const config = loadConfig('mysql_params.ini');

        this.host = config.get('mysql', 'host');
        this.port = config.getint('mysql', 'port');
        this.user = config.get('mysql', 'user');
        this.password = config.get('mysql', 'password');
        this.db = 'huobi_' + symbol;
        this.tableName = symbol + '_' + period + 'min';

        this.connection = null;
        this.pool = null;
    }

    /**
     * Initialize database connection pool
     */
    async init() {
        try {
            this.pool = mysql.createPool({
                host: this.host,
                port: this.port,
                user: this.user,
                password: this.password,
                database: this.db,
                connectionLimit: 10,
                acquireTimeout: 60000,
                timeout: 60000,
                reconnect: true
            });

            // Test connection
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();

            this.logger.info(`MySQL connection pool initialized for database ${this.db}`);
        } catch (error) {
            throw new Error(`Failed to initialize MySQL connection: ${error.message}`);
        }
    }

    /**
     * Get a connection from the pool
     * @returns {Promise<Connection>} MySQL connection
     */
    async getConnection() {
        if (!this.pool) {
            await this.init();
        }
        return await this.pool.getConnection();
    }

    /**
     * Helper method to ensure table name is set
     * @param {string} tableName - Table name (optional)
     * @returns {string} Resolved table name
     */
    resolveTableName(tableName = null) {
        return tableName || this.tableName;
    }

    /**
     * Helper method to execute database operations with automatic connection management
     * @param {Function} operation - Function that takes a connection and performs the operation
     * @returns {Promise<any>} Operation result
     */
    async executeWithConnection(operation) {
        const connection = await this.getConnection();
        try {
            return await operation(connection);
        } finally {
            connection.release();
        }
    }

    /**
     * Close the connection pool
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.logger.info('MySQL connection pool closed');
        }
    }

    /**
     * Create tables if they don't exist
     * @param {string} tableName - Table name (optional)
     * @returns {Promise<number>} Number of affected rows
     */
    async createTables(tableName = null) {
        const resolvedTableName = this.resolveTableName(tableName);

        return await this.executeWithConnection(async (connection) => {
            const [result] = await connection.execute(`
                CREATE TABLE IF NOT EXISTS ${resolvedTableName} (
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
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            `);

            this.logger.info(`Table ${resolvedTableName} created or already exists`);
            return result.affectedRows;
        });
    }

    /**
     * Check if table exists
     * @param {string} tableName - Table name (optional)
     * @returns {Promise<boolean>} True if table exists
     */
    async checkTableExist(tableName = null) {
        const resolvedTableName = this.resolveTableName(tableName);

        return await this.executeWithConnection(async (connection) => {
            const [rows] = await connection.execute(
                'SHOW TABLES LIKE ?',
                [resolvedTableName]
            );
            return rows.length > 0;
        });
    }

    /**
     * Get time range of records in the table
     * @param {string} tableName - Table name (optional)
     * @returns {Promise<Object>} Object with begin and end timestamps
     */
    async getTimeRange(tableName = null) {
        if (!tableName) {
            tableName = this.tableName;
        }

        if (!(await this.checkTableExist(tableName))) {
            await this.createTables(tableName);
        }

        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT MAX(timestamp), MIN(timestamp) FROM ${tableName}`
            );

            const result = rows[0];
            return {
                begin: result['MIN(timestamp)'],
                end: result['MAX(timestamp)']
            };
        } catch (error) {
            this.logger.error(`Error getting time range: ${error.message}`);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Check if a record exists by timestamp
     * @param {number} timestamp - Timestamp to check
     * @returns {Promise<boolean>} True if record exists
     */
    async recordExist(timestamp) {
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT * FROM ${this.tableName} WHERE timestamp = ?`,
                [timestamp]
            );
            return rows.length > 0;
        } finally {
            connection.release();
        }
    }

    /**
     * Insert k-line data
     * @param {Object} values - K-line data values
     * @param {string} tableName - Table name (optional)
     * @returns {Promise<number>} Number of affected rows
     */
    async insertKline(values, tableName = null) {
        if (!tableName) {
            tableName = this.tableName;
        }

        const connection = await this.getConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO ${tableName} (timestamp, open, close, high, low, vol, amount, count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    values.id,
                    values.open,
                    values.close,
                    values.high,
                    values.low,
                    values.vol,
                    values.amount,
                    values.count
                ]
            );

            return result.affectedRows;
        } catch (error) {
            this.logger.error(`Error inserting k-line data: ${error.message}`);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Update k-line data
     * @param {Object} values - K-line data values
     * @param {string} tableName - Table name (optional)
     * @returns {Promise<number>} Number of affected rows
     */
    async updateKline(values, tableName = null) {
        if (!tableName) {
            tableName = this.tableName;
        }

        const connection = await this.getConnection();
        try {
            const [result] = await connection.execute(
                `UPDATE ${tableName} SET open=?, close=?, high=?, low=?, vol=?, amount=?, count=? WHERE timestamp=?`,
                [
                    values.open,
                    values.close,
                    values.high,
                    values.low,
                    values.vol,
                    values.amount,
                    values.count,
                    values.id
                ]
            );

            return result.affectedRows;
        } catch (error) {
            this.logger.error(`Error updating k-line data: ${error.message}`);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Insert or update records
     * @param {Object} values - K-line data values
     * @param {string} tableName - Table name (optional)
     * @returns {Promise<number>} Number of affected rows
     */
    async recordsInsert(values, tableName = null) {
        if (!tableName) {
            tableName = this.tableName;
        }

        if (!(await this.checkTableExist(tableName))) {
            await this.createTables(tableName);
        }

        const exists = await this.recordExist(values.id);
        if (exists) {
            return await this.updateKline(values, tableName);
        } else {
            return await this.insertKline(values, tableName);
        }
    }

    /**
     * Delete the most recent records (for cleanup)
     * @param {number} size - Number of records to delete
     * @param {string} tableName - Table name (optional)
     * @returns {Promise<number>} Number of affected rows
     */
    async deleteFinalRecords(size = 100, tableName = null) {
        if (!tableName) {
            tableName = this.tableName;
        }

        const connection = await this.getConnection();
        try {
            const [result] = await connection.execute(
                `DELETE FROM ${tableName} ORDER BY timestamp DESC LIMIT ?`,
                [size]
            );

            return result.affectedRows;
        } catch (error) {
            this.logger.error(`Error deleting records: ${error.message}`);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Save request records (batch operation)
     * @param {Object} data - Data to save
     * @returns {Promise<string>} Success message
     */
    async saveReqRecords(data) {
        try {
            if (data && Object.keys(data).length > 0) {
                const keys = Object.keys(data).sort((a, b) => b - a); // Reverse sort

                for (const key of keys) {
                    const records = data[key];
                    if (Array.isArray(records)) {
                        for (const record of records) {
                            await this.recordsInsert(record);
                        }
                    }
                }

                return "save successful";
            }
            return "no data to save";
        } catch (error) {
            this.logger.error(`Error saving request records: ${error.message}`);
            return "some bad thing happened";
        }
    }

    /**
     * Update records (batch operation)
     * @param {Object} values - Values to update
     * @param {string} tableName - Table name (optional)
     * @returns {Promise<number>} Number of affected rows
     */
    async updateRecords(values, tableName = null) {
        if (!tableName) {
            tableName = this.tableName;
        }

        if (!values) {
            return 0;
        }

        try {
            const exists = await this.recordExist(values.id);
            if (exists) {
                return await this.updateKline(values, tableName);
            } else {
                return await this.insertKline(values, tableName);
            }
        } catch (error) {
            this.logger.error(`Error updating records: ${error.message}`);
            throw error;
        }
    }
}

module.exports = SqlConnection;