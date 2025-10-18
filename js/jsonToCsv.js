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
            nestingSeparator: options.nestingSeparator || '.',
            maxNestingDepth: options.maxNestingDepth || 3,
            handleNestedArrays: options.handleNestedArrays !== false,
            customHeaders: options.customHeaders || null,
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
            // Check for empty input
            if (!jsonString || jsonString.trim().length === 0) {
                throw new Error('Input is empty');
            }

            // Parse JSON
            const data = JSON.parse(jsonString);

            // Check for circular references
            if (this.hasCircularReference(data)) {
                throw new Error('JSON contains circular references which cannot be converted to CSV');
            }

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
                rows: csvData.split(this.options.lineEnding).length - (this.options.includeHeaders ? 1 : 0),
                columns: this.getColumnCount(csvData)
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
        // Extract all unique keys (potentially flattened)
        const allKeys = this.options.flattenObjects ? 
            this.extractFlattenedKeys(array) : 
            this.extractAllKeys(array);
        
        // Use custom headers if provided
        const headers = this.options.customHeaders || allKeys;

        // Build CSV rows
        const rows = [];

        // Add header row
        if (this.options.includeHeaders) {
            rows.push(this.formatRow(headers));
        }

        // Add data rows
        array.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                const row = allKeys.map(key => {
                    const value = this.options.flattenObjects ? 
                        this.getNestedValue(item, key) : 
                        item[key];
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

        // Handle special number values
        if (typeof value === 'number') {
            if (isNaN(value)) {
                return 'NaN';
            }
            if (!isFinite(value)) {
                return value > 0 ? 'Infinity' : '-Infinity';
            }
            return value.toString();
        }

        // Handle arrays
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return '[]';
            }
            if (this.options.flattenObjects || this.options.handleNestedArrays) {
                return this.escapeValue(JSON.stringify(value));
            } else {
                return this.escapeValue(value.join('; '));
            }
        }

        // Handle nested objects
        if (typeof value === 'object') {
            if (Object.keys(value).length === 0) {
                return '{}';
            }
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

        // Handle strings (including special characters)
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

    /**
     * Extract flattened keys from array of objects (supports nested objects)
     * @param {Array} array - Array of objects
     * @returns {Array} - Flattened keys
     */
    extractFlattenedKeys(array) {
        const keysSet = new Set();

        array.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                this.extractKeysRecursive(item, '', keysSet);
            }
        });

        return Array.from(keysSet);
    }

    /**
     * Recursively extract keys from nested objects
     * @param {Object} obj - Object to extract keys from
     * @param {string} prefix - Key prefix for nesting
     * @param {Set} keysSet - Set to store keys
     * @param {number} depth - Current nesting depth
     */
    extractKeysRecursive(obj, prefix, keysSet, depth = 0) {
        if (depth >= this.options.maxNestingDepth) {
            keysSet.add(prefix);
            return;
        }

        Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}${this.options.nestingSeparator}${key}` : key;
            const value = obj[key];

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                this.extractKeysRecursive(value, fullKey, keysSet, depth + 1);
            } else {
                keysSet.add(fullKey);
            }
        });
    }

    /**
     * Get nested value from object using dot notation
     * @param {Object} obj - Object to get value from
     * @param {string} path - Dot-notated path
     * @returns {any} - Value at path
     */
    getNestedValue(obj, path) {
        const keys = path.split(this.options.nestingSeparator);
        let value = obj;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * Detect and parse different JSON formats
     * @param {string} jsonString - JSON string
     * @returns {Object} - Parsed and normalized data
     */
    detectAndNormalize(jsonString) {
        const data = JSON.parse(jsonString);

        // Array of objects (ideal format)
        if (Array.isArray(data)) {
            return data;
        }

        // Single object - wrap in array
        if (typeof data === 'object' && data !== null) {
            return [data];
        }

        // Primitive value - wrap in object
        return [{ value: data }];
    }

    /**
     * Check if object has circular references
     * @param {any} obj - Object to check
     * @returns {boolean}
     */
    hasCircularReference(obj) {
        const seen = new WeakSet();

        function detect(obj) {
            if (typeof obj === 'object' && obj !== null) {
                if (seen.has(obj)) {
                    return true;
                }
                seen.add(obj);

                for (let key in obj) {
                    if (obj.hasOwnProperty(key) && detect(obj[key])) {
                        return true;
                    }
                }
            }
            return false;
        }

        return detect(obj);
    }

    /**
     * Get column count from CSV data
     * @param {string} csvData - CSV string
     * @returns {number}
     */
    getColumnCount(csvData) {
        const firstLine = csvData.split(this.options.lineEnding)[0];
        if (!firstLine) return 0;
        
        return firstLine.split(this.options.delimiter).length;
    }

    /**
     * Handle inconsistent properties across objects
     * @param {Array} array - Array of objects
     * @returns {Array} - Normalized array
     */
    normalizeObjects(array) {
        const allKeys = this.extractAllKeys(array);
        
        return array.map(item => {
            const normalized = {};
            allKeys.forEach(key => {
                normalized[key] = item.hasOwnProperty(key) ? item[key] : null;
            });
            return normalized;
        });
    }

    /**
     * Process large datasets in chunks (for memory efficiency)
     * @param {Array} array - Large array to process
     * @param {number} chunkSize - Size of each chunk
     * @param {Function} callback - Progress callback
     * @returns {string} - CSV string
     */
    convertInChunks(array, chunkSize = 1000, callback = null) {
        const allKeys = this.options.flattenObjects ? 
            this.extractFlattenedKeys(array) : 
            this.extractAllKeys(array);
        
        let result = '';

        // Add headers
        if (this.options.includeHeaders) {
            result += this.formatRow(allKeys) + this.options.lineEnding;
        }

        // Process in chunks
        for (let i = 0; i < array.length; i += chunkSize) {
            const chunk = array.slice(i, Math.min(i + chunkSize, array.length));
            
            chunk.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    const row = allKeys.map(key => {
                        const value = this.options.flattenObjects ? 
                            this.getNestedValue(item, key) : 
                            item[key];
                        return this.formatValue(value);
                    });
                    result += this.formatRow(row) + this.options.lineEnding;
                }
            });

            // Progress callback
            if (callback) {
                callback(Math.min(i + chunkSize, array.length), array.length);
            }
        }

        return result;
    }
}


