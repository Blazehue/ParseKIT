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
            headerMapping: options.headerMapping || null, // Map headers to different names
            skipEmptyLines: options.skipEmptyLines !== false,
            encoding: options.encoding || 'utf-8',
            columnTypes: options.columnTypes || {}, // Specify types per column
            nestedOutput: options.nestedOutput || false, // Create nested objects from dot notation
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

            // Remove BOM if present
            csvString = this.removeBOM(csvString);

            // Detect delimiter if not provided
            const delimiter = this.options.delimiter || this.detectDelimiter(csvString);
            if (!delimiter) {
                throw new Error('Unable to detect CSV delimiter. Please specify delimiter manually.');
            }

            // Parse CSV into rows
            const rows = this.parseCSV(csvString, delimiter);

            if (rows.length === 0) {
                throw new Error('No data found in CSV');
            }

            // Filter out completely empty rows if option enabled
            const filteredRows = this.options.skipEmptyLines ? 
                rows.filter(row => row.some(cell => cell !== null && cell !== '')) : 
                rows;

            if (filteredRows.length === 0) {
                throw new Error('No valid data rows found');
            }

            // Extract headers
            let headers;
            let dataRows;

            if (this.options.hasHeaders) {
                headers = this.options.customHeaders || filteredRows[0];
                dataRows = filteredRows.slice(1);
            } else {
                // Generate default headers
                const columnCount = Math.max(...filteredRows.map(row => row.length));
                headers = this.options.customHeaders || 
                    Array.from({ length: columnCount }, (_, i) => `column${i + 1}`);
                dataRows = filteredRows;
            }

            // Normalize row lengths (handle missing columns)
            const normalizedRows = this.normalizeRowLengths(dataRows, headers.length);

            // Convert to JSON
            const jsonData = this.rowsToJSON(headers, normalizedRows);

            return {
                success: true,
                data: JSON.stringify(jsonData, null, 2),
                parsed: jsonData,
                rows: normalizedRows.length,
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
                    // Escaped quote (double quote)
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

            // Handle escaped delimiters
            if (char === '\\' && nextChar === delimiter && !inQuotes) {
                currentField += delimiter;
                i += 2;
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

        // Apply header mapping if provided
        const mappedHeaders = headers.map(header => 
            this.options.headerMapping && this.options.headerMapping[header] 
                ? this.options.headerMapping[header] 
                : header
        );

        for (const row of rows) {
            const obj = {};
            
            for (let i = 0; i < mappedHeaders.length; i++) {
                const header = mappedHeaders[i];
                let value = i < row.length ? row[i] : null;

                // Apply column-specific type conversion
                if (this.options.columnTypes[headers[i]]) {
                    value = this.convertToType(value, this.options.columnTypes[headers[i]]);
                }

                // Handle nested output (dot notation to nested objects)
                if (this.options.nestedOutput && header.includes('.')) {
                    this.setNestedValue(obj, header, value);
                } else {
                    obj[header] = value;
                }
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

    /**
     * Convert value to specific type
     * @param {any} value - Value to convert
     * @param {string} type - Target type ('string', 'number', 'boolean', 'date')
     * @returns {any} - Converted value
     */
    convertToType(value, type) {
        if (value === null || value === undefined) return null;

        switch (type.toLowerCase()) {
            case 'string':
                return String(value);
            case 'number':
                const num = Number(value);
                return isNaN(num) ? null : num;
            case 'boolean':
                if (typeof value === 'boolean') return value;
                const lower = String(value).toLowerCase();
                if (lower === 'true' || lower === '1' || lower === 'yes') return true;
                if (lower === 'false' || lower === '0' || lower === 'no') return false;
                return null;
            case 'date':
                const date = new Date(value);
                return isNaN(date.getTime()) ? null : date.toISOString();
            default:
                return value;
        }
    }

    /**
     * Set nested value in object using dot notation
     * @param {Object} obj - Target object
     * @param {string} path - Dot notation path
     * @param {any} value - Value to set
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
    }

    /**
     * Handle multi-line fields (fields with newlines inside quotes)
     * @param {string} csvString - CSV content
     * @param {string} delimiter - Delimiter character
     * @returns {Array<string>} - Lines with multi-line fields preserved
     */
    handleMultiLineFields(csvString, delimiter) {
        const result = [];
        let currentLine = '';
        let inQuotes = false;

        for (let char of csvString) {
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            
            if (char === '\n' && !inQuotes) {
                if (currentLine.trim().length > 0) {
                    result.push(currentLine);
                }
                currentLine = '';
            } else {
                currentLine += char;
            }
        }

        // Add last line
        if (currentLine.trim().length > 0) {
            result.push(currentLine);
        }

        return result;
    }

    /**
     * Infer column types from data
     * @param {Array<Array>} rows - Data rows
     * @returns {Object} - Inferred types per column
     */
    inferColumnTypes(rows) {
        if (rows.length === 0) return {};

        const columnCount = rows[0].length;
        const types = {};

        for (let colIndex = 0; colIndex < columnCount; colIndex++) {
            const values = rows.map(row => row[colIndex]).filter(v => v !== null && v !== '');
            
            if (values.length === 0) {
                types[colIndex] = 'string';
                continue;
            }

            // Check if all values are numbers
            if (values.every(v => !isNaN(Number(v)))) {
                types[colIndex] = 'number';
                continue;
            }

            // Check if all values are booleans
            const boolValues = values.map(v => String(v).toLowerCase());
            if (boolValues.every(v => ['true', 'false', '1', '0', 'yes', 'no'].includes(v))) {
                types[colIndex] = 'boolean';
                continue;
            }

            // Check if all values are dates
            if (values.every(v => !isNaN(new Date(v).getTime()))) {
                types[colIndex] = 'date';
                continue;
            }

            types[colIndex] = 'string';
        }

        return types;
    }

    /**
     * Remove BOM (Byte Order Mark) if present
     * @param {string} text - Text content
     * @returns {string} - Text without BOM
     */
    removeBOM(text) {
        if (text.charCodeAt(0) === 0xFEFF) {
            return text.slice(1);
        }
        return text;
    }

    /**
     * Normalize row lengths (handle rows with missing or extra columns)
     * @param {Array<Array>} rows - Data rows
     * @param {number} expectedLength - Expected column count
     * @returns {Array<Array>} - Normalized rows
     */
    normalizeRowLengths(rows, expectedLength) {
        return rows.map(row => {
            if (row.length === expectedLength) {
                return row;
            }
            
            // Pad with null if row is too short
            if (row.length < expectedLength) {
                return [...row, ...Array(expectedLength - row.length).fill(null)];
            }
            
            // Truncate if row is too long (or keep extra columns based on option)
            return row.slice(0, expectedLength);
        });
    }

    /**
     * Handle malformed CSV with error recovery
     * @param {string} csvString - Potentially malformed CSV
     * @param {string} delimiter - Delimiter character
     * @returns {Array<Array>} - Parsed rows with best effort
     */
    parseWithRecovery(csvString, delimiter) {
        const rows = [];
        const lines = csvString.split(/\r?\n/);
        let currentRow = [];
        let currentField = '';
        let inQuotes = false;

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            
            try {
                const parsedLine = this.parseLine(line, delimiter);
                
                if (inQuotes) {
                    // Continuation of multi-line field
                    currentField += '\n' + line;
                    
                    // Check if quotes are closed
                    if (line.includes('"')) {
                        inQuotes = false;
                        currentRow.push(currentField);
                        rows.push(currentRow);
                        currentRow = [];
                        currentField = '';
                    }
                } else {
                    rows.push(parsedLine);
                }
            } catch (error) {
                // Recovery: skip malformed line or add as single field
                console.warn(`Warning: Malformed line ${lineNum + 1}, attempting recovery`);
                if (currentRow.length > 0) {
                    rows.push(currentRow);
                    currentRow = [];
                }
            }
        }

        return rows;
    }

    /**
     * Handle trailing commas in CSV
     * @param {Array} row - Parsed row
     * @returns {Array} - Cleaned row
     */
    cleanTrailingCommas(row) {
        // Remove trailing null/empty values
        while (row.length > 0 && (row[row.length - 1] === null || row[row.length - 1] === '')) {
            row.pop();
        }
        return row;
    }

    /**
     * Convert CSV with large file support (streaming simulation)
     * @param {string} csvString - CSV content
     * @param {Function} progressCallback - Progress callback
     * @returns {Object} - Conversion result
     */
    convertLarge(csvString, progressCallback = null) {
        const chunkSize = 1000; // Process 1000 rows at a time
        const delimiter = this.options.delimiter || this.detectDelimiter(csvString);
        const allRows = this.parseCSV(csvString, delimiter);
        
        const headers = this.options.hasHeaders ? allRows[0] : 
            Array.from({ length: allRows[0].length }, (_, i) => `column${i + 1}`);
        
        const dataRows = this.options.hasHeaders ? allRows.slice(1) : allRows;
        const result = [];
        
        for (let i = 0; i < dataRows.length; i += chunkSize) {
            const chunk = dataRows.slice(i, Math.min(i + chunkSize, dataRows.length));
            const chunkJSON = this.rowsToJSON(headers, chunk);
            result.push(...chunkJSON);
            
            if (progressCallback) {
                progressCallback(Math.min(i + chunkSize, dataRows.length), dataRows.length);
            }
        }
        
        return {
            success: true,
            data: JSON.stringify(result, null, 2),
            parsed: result,
            rows: result.length
        };
    }
}


