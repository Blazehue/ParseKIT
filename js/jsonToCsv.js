/**
 * JSON to CSV Converter Module
 * Handles conversion from JSON to CSV format
 */

export class JSONToCSVConverter {
    constructor(options = {}) {
        this.options = {
            delimiter: options.delimiter || ',',
            lineEnding: options.lineEnding || '\n',
            includeHeaders: options.includeHeaders !== false,
            quoteChar: options.quoteChar || '"',
            flattenObjects: options.flattenObjects !== false,
            ...options
        };
    }

    /**
     * Convert JSON to CSV
     * @param {string} jsonString - JSON string to convert
     * @returns {Object} - Conversion result
     */
    convert(jsonString) {
        try {
            // Parse JSON
            const data = JSON.parse(jsonString);

            // Handle different JSON structures
            let csvData;
            if (Array.isArray(data)) {
                csvData = this.convertArray(data);
            } else if (typeof data === 'object' && data !== null) {
                csvData = this.convertObject(data);
            } else {
                throw new Error('JSON must be an object or array');
            }

            return {
                success: true,
                data: csvData,
                rows: csvData.split(this.options.lineEnding).length - 1
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Convert JSON array to CSV
     * @param {Array} array - JSON array
     * @returns {string} - CSV string
     */
    convertArray(array) {
        if (array.length === 0) {
            return '';
        }

        // Check if array contains objects
        const hasObjects = array.some(item => typeof item === 'object' && item !== null);

        if (hasObjects) {
            return this.convertArrayOfObjects(array);
        } else {
            return this.convertSimpleArray(array);
        }
    }

    /**
     * Convert array of objects to CSV
     * @param {Array} array - Array of objects
     * @returns {string} - CSV string
     */
    convertArrayOfObjects(array) {
        // Extract all unique keys
        const allKeys = this.extractAllKeys(array);
        
        // Build CSV rows
        const rows = [];

        // Add header row
        if (this.options.includeHeaders) {
            rows.push(this.formatRow(allKeys));
        }

        // Add data rows
        array.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                const row = allKeys.map(key => {
                    const value = item[key];
                    return this.formatValue(value);
                });
                rows.push(this.formatRow(row));
            } else {
                // Handle non-object items in array
                rows.push(this.formatValue(item));
            }
        });

        return rows.join(this.options.lineEnding);
    }

    /**
     * Convert simple array to CSV
     * @param {Array} array - Simple array
     * @returns {string} - CSV string
     */
    convertSimpleArray(array) {
        const rows = [];

        // Add header
        if (this.options.includeHeaders) {
            rows.push(this.escapeValue('value'));
        }

        // Add values
        array.forEach(item => {
            rows.push(this.formatValue(item));
        });

        return rows.join(this.options.lineEnding);
    }

    /**
     * Convert single object to CSV
     * @param {Object} obj - JSON object
     * @returns {string} - CSV string
     */
    convertObject(obj) {
        const keys = Object.keys(obj);
        const rows = [];

        // Add headers
        if (this.options.includeHeaders) {
            rows.push(this.formatRow(keys));
        }

        // Add values
        const values = keys.map(key => this.formatValue(obj[key]));
        rows.push(this.formatRow(values));

        return rows.join(this.options.lineEnding);
    }

    /**
     * Extract all unique keys from array of objects
     * @param {Array} array - Array of objects
     * @returns {Array} - Unique keys
     */
    extractAllKeys(array) {
        const keysSet = new Set();

        array.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                Object.keys(item).forEach(key => keysSet.add(key));
            }
        });

        return Array.from(keysSet);
    }

    /**
     * Format a single value for CSV
     * @param {any} value - Value to format
     * @returns {string} - Formatted value
     */
    formatValue(value) {
        // Handle null and undefined
        if (value === null || value === undefined) {
            return '';
        }

        // Handle arrays
        if (Array.isArray(value)) {
            if (this.options.flattenObjects) {
                return this.escapeValue(JSON.stringify(value));
            } else {
                return this.escapeValue(value.join('; '));
            }
        }

        // Handle nested objects
        if (typeof value === 'object') {
            if (this.options.flattenObjects) {
                return this.escapeValue(JSON.stringify(value));
            } else {
                return this.escapeValue(Object.entries(value).map(([k, v]) => `${k}:${v}`).join('; '));
            }
        }

        // Handle booleans
        if (typeof value === 'boolean') {
            return value.toString();
        }

        // Handle numbers
        if (typeof value === 'number') {
            return value.toString();
        }

        // Handle strings
        return this.escapeValue(value.toString());
    }

    /**
     * Escape value for CSV (handle quotes and delimiters)
     * @param {string} value - Value to escape
     * @returns {string} - Escaped value
     */
    escapeValue(value) {
        const stringValue = String(value);

        // Check if value needs quoting
        const needsQuoting = 
            stringValue.includes(this.options.delimiter) ||
            stringValue.includes(this.options.quoteChar) ||
            stringValue.includes('\n') ||
            stringValue.includes('\r');

        if (needsQuoting) {
            // Escape quote characters by doubling them
            const escaped = stringValue.replace(
                new RegExp(this.options.quoteChar, 'g'), 
                this.options.quoteChar + this.options.quoteChar
            );
            return this.options.quoteChar + escaped + this.options.quoteChar;
        }

        return stringValue;
    }

    /**
     * Format a row (array of values)
     * @param {Array} values - Row values
     * @returns {string} - Formatted row
     */
    formatRow(values) {
        return values.join(this.options.delimiter);
    }

    /**
     * Update converter options
     * @param {Object} options - New options
     */
    updateOptions(options) {
        this.options = { ...this.options, ...options };
    }
}
