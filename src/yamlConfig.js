const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * YAML configuration loader
 * Similar to Python's yaml.safe_load functionality
 */
class YamlConfig {
    constructor() {
        this.config = {};
    }

    /**
     * Load YAML configuration from file
     * @param {string} filePath - Path to the YAML file
     * @param {string} encoding - File encoding (default: utf8)
     * @returns {Object} Parsed YAML configuration
     */
    load(filePath, encoding = 'utf8') {
        try {
            const configContent = fs.readFileSync(filePath, encoding);
            this.config = yaml.load(configContent);
            return this.config;
        } catch (error) {
            throw new Error(`Failed to load YAML config file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Get a configuration value by path
     * @param {string} path - Dot-separated path to the configuration value
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = undefined) {
        const keys = path.split('.');
        let current = this.config;

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                if (defaultValue !== undefined) {
                    return defaultValue;
                }
                throw new Error(`Path '${path}' not found in YAML configuration`);
            }
        }

        return current;
    }

    /**
     * Get the entire configuration object
     * @returns {Object} Complete configuration
     */
    getConfig() {
        return this.config;
    }

    /**
     * Check if a configuration path exists
     * @param {string} path - Dot-separated path to check
     * @returns {boolean} True if path exists
     */
    has(path) {
        try {
            this.get(path);
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Utility function to load YAML configuration
 * @param {string} filePath - Path to the YAML file
 * @returns {YamlConfig} Configured YamlConfig instance
 */
function loadYamlConfig(filePath) {
    const yamlConfig = new YamlConfig();

    // Try to find the file in common locations
    const possiblePaths = [
        filePath,
        path.join('config', filePath),
        path.join('../config', filePath),
        path.join('./config', filePath)
    ];

    for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
            yamlConfig.load(possiblePath);
            return yamlConfig;
        }
    }

    throw new Error(`YAML configuration file not found: ${filePath}`);
}

module.exports = {
    YamlConfig,
    loadYamlConfig
};