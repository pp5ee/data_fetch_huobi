const fs = require('fs');
const path = require('path');
const ini = require('ini');

/**
 * Configuration parser for INI files
 * Similar to Python's configparser module
 */
class ConfigParser {
    constructor() {
        this.config = {};
    }

    /**
     * Read and parse INI configuration file
     * @param {string} filePath - Path to the INI file
     * @param {string} encoding - File encoding (default: utf8)
     */
    read(filePath, encoding = 'utf8') {
        try {
            const configContent = fs.readFileSync(filePath, encoding);
            this.config = ini.parse(configContent);
            return this.config;
        } catch (error) {
            throw new Error(`Failed to read config file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Get a configuration value by section and key
     * @param {string} section - Section name
     * @param {string} key - Key name
     * @param {*} defaultValue - Default value if key not found
     * @returns {*} Configuration value
     */
    get(section, key, defaultValue = undefined) {
        if (!this.config[section]) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw new Error(`Section '${section}' not found in configuration`);
        }

        const value = this.config[section][key];
        if (value === undefined || value === null) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw new Error(`Key '${key}' not found in section '${section}'`);
        }

        return value;
    }

    /**
     * Get integer value from configuration
     * @param {string} section - Section name
     * @param {string} key - Key name
     * @param {number} defaultValue - Default value if key not found
     * @returns {number} Integer value
     */
    getint(section, key, defaultValue = undefined) {
        const value = this.get(section, key, defaultValue);
        const intValue = parseInt(value, 10);

        if (isNaN(intValue)) {
            throw new Error(`Value for ${section}.${key} is not a valid integer: ${value}`);
        }

        return intValue;
    }

    /**
     * Get boolean value from configuration
     * @param {string} section - Section name
     * @param {string} key - Key name
     * @param {boolean} defaultValue - Default value if key not found
     * @returns {boolean} Boolean value
     */
    getboolean(section, key, defaultValue = undefined) {
        const value = this.get(section, key, defaultValue);

        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1') {
                return true;
            }
            if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === '0') {
                return false;
            }
        }

        throw new Error(`Value for ${section}.${key} is not a valid boolean: ${value}`);
    }

    /**
     * Get all sections from the configuration
     * @returns {string[]} Array of section names
     */
    sections() {
        return Object.keys(this.config);
    }

    /**
     * Get all keys in a section
     * @param {string} section - Section name
     * @returns {string[]} Array of key names
     */
    keys(section) {
        if (!this.config[section]) {
            throw new Error(`Section '${section}' not found in configuration`);
        }
        return Object.keys(this.config[section]);
    }

    /**
     * Check if section exists
     * @param {string} section - Section name
     * @returns {boolean} True if section exists
     */
    hasSection(section) {
        return this.config[section] !== undefined;
    }

    /**
     * Check if key exists in section
     * @param {string} section - Section name
     * @param {string} key - Key name
     * @returns {boolean} True if key exists
     */
    hasKey(section, key) {
        return this.config[section] && this.config[section][key] !== undefined;
    }
}

/**
 * Utility function to load configuration from INI files
 * @param {string} filePattern - Glob pattern for INI files
 * @returns {ConfigParser} Configured ConfigParser instance
 */
function loadConfig(filePattern) {
    const configParser = new ConfigParser();

    // For simplicity, we'll use exact file paths instead of glob patterns
    // This matches the Python implementation's usage pattern
    if (fs.existsSync(filePattern)) {
        configParser.read(filePattern);
    } else {
        // Try to find the file in common locations
        const possiblePaths = [
            filePattern,
            path.join('config', filePattern),
            path.join('../config', filePattern),
            path.join('./config', filePattern)
        ];

        for (const filePath of possiblePaths) {
            if (fs.existsSync(filePath)) {
                configParser.read(filePath);
                break;
            }
        }
    }

    return configParser;
}

module.exports = {
    ConfigParser,
    loadConfig
};