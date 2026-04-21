const { loadYamlConfig } = require('./yamlConfig');

/**
 * Comprehensive logging system with YAML configuration support
 * Similar to Python's logging.config.dictConfig functionality
 */
class Logger {
    constructor(name = '') {
        this.name = name;
        this.config = this.loadConfig();
        this.level = this.config.level || 'INFO';
        this.formatter = this.config.formatter || this.defaultFormatter;
    }

    /**
     * Load logging configuration from YAML file
     */
    loadConfig() {
        try {
            const yamlConfig = loadYamlConfig('log_config.yaml');
            return yamlConfig.getConfig();
        } catch (error) {
            console.warn(`Failed to load YAML logging config: ${error.message}. Using defaults.`);
            return {
                version: 1,
                formatters: {
                    simple: {
                        format: '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
                    }
                },
                handlers: {
                    console: {
                        class: 'console',
                        level: 'DEBUG',
                        formatter: 'simple'
                    }
                },
                root: {
                    level: 'DEBUG',
                    handlers: ['console']
                }
            };
        }
    }

    /**
     * Default formatter
     */
    defaultFormatter(level, message, name) {
        const timestamp = new Date().toISOString();
        return `${timestamp} - ${name} - ${level} - ${message}`;
    }

    /**
     * Get log level numeric value
     */
    getLevelValue(level) {
        const levels = {
            'DEBUG': 10,
            'INFO': 20,
            'WARNING': 30,
            'ERROR': 40,
            'CRITICAL': 50
        };
        return levels[level.toUpperCase()] || 0;
    }

    /**
     * Check if level should be logged
     */
    shouldLog(level) {
        const currentLevel = this.getLevelValue(this.level);
        const messageLevel = this.getLevelValue(level);
        return messageLevel >= currentLevel;
    }

    /**
     * Format message
     */
    formatMessage(level, message) {
        const formatterConfig = this.config.formatters?.simple || {};
        const format = formatterConfig.format || '%(asctime)s - %(name)s - %(levelname)s - %(message)s';

        const replacements = {
            '%(asctime)s': new Date().toISOString(),
            '%(name)s': this.name,
            '%(levelname)s': level.toUpperCase(),
            '%(message)s': message
        };

        return format.replace(/%(?:\(\w+\)s)/g, (match) => replacements[match] || match);
    }

    /**
     * Log message at specified level
     */
    log(level, message) {
        if (!this.shouldLog(level)) {
            return;
        }

        const formattedMessage = this.formatMessage(level, message);

        switch (level.toUpperCase()) {
            case 'DEBUG':
                console.debug(formattedMessage);
                break;
            case 'INFO':
                console.info(formattedMessage);
                break;
            case 'WARNING':
                console.warn(formattedMessage);
                break;
            case 'ERROR':
            case 'CRITICAL':
                console.error(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
    }

    /**
     * Debug level logging
     */
    debug(message) {
        this.log('DEBUG', message);
    }

    /**
     * Info level logging
     */
    info(message) {
        this.log('INFO', message);
    }

    /**
     * Warning level logging
     */
    warning(message) {
        this.log('WARNING', message);
    }

    /**
     * Error level logging
     */
    error(message) {
        this.log('ERROR', message);
    }

    /**
     * Critical level logging
     */
    critical(message) {
        this.log('CRITICAL', message);
    }
}

/**
 * Get logger instance
 */
function getLogger(name = '') {
    return new Logger(name);
}

module.exports = {
    Logger,
    getLogger
};