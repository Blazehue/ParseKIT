/**
 * CSV to JSON Converter Module
 * Handles conversion from CSV to JSON format
 */

export class CSVToJSONConverter {
    constructor(options = {}) {
        this.options = {
            delimiter: options.delimiter || null, // Auto-detect if null
            hasHeaders: options.hasHeaders !== false,
            trimValues: options.trimValues !== false,
            parseNumbers: options.parseNumbers !== false,
            parseBooleans: options.parseBooleans !== false,
            parseNulls: options.parseNulls !== false,
            outputFormat: options.outputFormat || 'array', // 'array' or 'object'
            customHeaders: options.customHeaders || null,
            ...options
        };
    }

    /**
     * Convert CSV to JSON
     * @param {string} csvString - CSV string to convert
     * @returns {Object} - Conversion result
     */
    convert(csvString) {
        try {
            // Check for empty input
            if (!csvString || csvString.trim().length === 0) {
                throw new Error('Input is empty');
            }

            // Detect delimiter if not provided
            const delimiter = this.options.delimiter || this.detectDelimiter(csvString);
            if (!delimiter) {
                throw new Error('Unable to detect CSV delimiter');
            }

            // Parse CSV into rows
            const rows = this.parseCSV(csvString, delimiter);

            if (rows.length === 0) {
                throw new Error('No data found in CSV');
            }

            // Extract headers
            let headers;
            let dataRows;

            if (this.options.hasHeaders) {
                headers = this.options.customHeaders || rows[0];
                dataRows = rows.slice(1);
            } else {
                // Generate default headers
                headers = this.options.customHeaders || 
                    Array.from({ length: rows[0].length }, (_, i) => `column${i + 1}`);
                dataRows = rows;
            }

            // Convert to JSON
            const jsonData = this.rowsToJSON(headers, dataRows);

            return {
                success: true,
                data: JSON.stringify(jsonData, null, 2),
                parsed: jsonData,
                rows: dataRows.length,
                columns: headers.length
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
     * Detect CSV delimiter
     * @param {string} csvString - CSV content
     * @returns {string|null} - Detected delimiter
     */
    detectDelimiter(csvString) {
        const delimiters = [',', ';', '\t', '|'];
        const lines = csvString.split(/\r?\n/).filter(line => line.trim().length > 0).slice(0, 5);
        
        if (lines.length === 0) return null;

        let bestDelimiter = null;
        let maxConsistency = 0;

        for (const delimiter of delimiters) {
            const counts = lines.map(line => {
                // Count delimiters not inside quotes
                let count = 0;
                let inQuotes = false;
                
                for (let char of line) {
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === delimiter && !inQuotes) {
                        count++;
                    }
                }
                
                return count;
            });
            
            if (counts.length > 0) {
                const firstCount = counts[0];
                const consistency = counts.filter(c => c === firstCount).length / counts.length;
                
                if (consistency > maxConsistency && firstCount > 0) {
                    maxConsistency = consistency;
                    bestDelimiter = delimiter;
                }
            }
        }

        return bestDelimiter;
    }

    /**
     * Parse CSV string into array of arrays
     * @param {string} csvString - CSV content
     * @param {string} delimiter - Delimiter character
     * @returns {Array<Array>} - Parsed rows
     */
    parseCSV(csvString, delimiter) {
        const rows = [];
        const lines = csvString.split(/\r?\n/);

        for (let line of lines) {
            // Skip empty lines
            if (line.trim().length === 0) {
                continue;
            }

            const row = this.parseLine(line, delimiter);
            rows.push(row);
        }

        return rows;
    }

    /**
     * Parse a single CSV line
     * @param {string} line - CSV line
     * @param {string} delimiter - Delimiter character
     * @returns {Array} - Parsed fields
     */
    parseLine(line, delimiter) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    currentField += '"';
                    i += 2;
                    continue;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                    continue;
                }
            }

            if (char === delimiter && !inQuotes) {
                // Field separator
                fields.push(this.processField(currentField));
                currentField = '';
                i++;
                continue;
            }

            currentField += char;
            i++;
        }

        // Add last field
        fields.push(this.processField(currentField));

        return fields;
    }

    /**
     * Process a field value (trim, parse types, etc.)
     * @param {string} field - Raw field value
     * @returns {any} - Processed value
     */
    processField(field) {
        // Trim if enabled
        let value = this.options.trimValues ? field.trim() : field;

        // Parse null
        if (this.options.parseNulls && (value === 'null' || value === 'NULL' || value === '')) {
            return null;
        }

        // Parse booleans
        if (this.options.parseBooleans) {
            const lower = value.toLowerCase();
            if (lower === 'true') return true;
            if (lower === 'false') return false;
        }

        // Parse numbers
        if (this.options.parseNumbers && value !== '') {
            const num = Number(value);
            if (!isNaN(num)) {
                return num;
            }
        }

        return value;
    }

    /**
     * Convert rows to JSON format
     * @param {Array} headers - Column headers
     * @param {Array<Array>} rows - Data rows
     * @returns {Array|Object} - JSON data
     */
    rowsToJSON(headers, rows) {
        const result = [];

        for (const row of rows) {
            const obj = {};
            
            for (let i = 0; i < headers.length; i++) {
                const header = headers[i];
                const value = i < row.length ? row[i] : null;
                obj[header] = value;
            }

            result.push(obj);
        }

        // Return based on output format
        if (this.options.outputFormat === 'object') {
            // Convert array to object with indexed keys
            const objResult = {};
            result.forEach((item, index) => {
                objResult[index] = item;
            });
            return objResult;
        }

        return result;
    }

    /**
     * Update converter options
     * @param {Object} options - New options
     */
    updateOptions(options) {
        this.options = { ...this.options, ...options };
    }
}
