/**
 * Validator Module
 * Handles validation for JSON and CSV formats
 */

export class Validator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Validate JSON content
     * @param {string} content - JSON string to validate
     * @returns {Object} - Validation result
     */
    validateJSON(content) {
        this.errors = [];
        this.warnings = [];

        // Check if content is empty
        if (!content || content.trim().length === 0) {
            this.errors.push({
                message: 'JSON content is empty',
                line: 0
            });
            return this.getValidationResult();
        }

        // Try to parse JSON
        try {
            const parsed = JSON.parse(content);
            
            // Check if it's an array or object
            if (typeof parsed !== 'object' || parsed === null) {
                this.warnings.push({
                    message: 'JSON should be an object or array for optimal conversion',
                    line: 0
                });
            }

            // Check for circular references
            if (this.hasCircularReference(parsed)) {
                this.errors.push({
                    message: 'JSON contains circular references',
                    line: 0
                });
            }

            // Additional validation for CSV conversion
            if (Array.isArray(parsed)) {
                if (parsed.length === 0) {
                    this.warnings.push({
                        message: 'JSON array is empty',
                        line: 0
                    });
                } else {
                    // Check if array contains objects
                    const hasObjects = parsed.some(item => typeof item === 'object' && item !== null);
                    if (!hasObjects) {
                        this.warnings.push({
                            message: 'JSON array should contain objects for optimal CSV conversion',
                            line: 0
                        });
                    }

                    // Check for inconsistent properties
                    const inconsistencies = this.checkPropertyConsistency(parsed);
                    if (inconsistencies.length > 0) {
                        this.warnings.push({
                            message: `Inconsistent properties detected: ${inconsistencies.join(', ')}`,
                            line: 0
                        });
                    }
                }
            } else if (typeof parsed === 'object') {
                // Single object validation
                if (Object.keys(parsed).length === 0) {
                    this.warnings.push({
                        message: 'JSON object is empty',
                        line: 0
                    });
                }
            }

        } catch (error) {
            // Parse error - try to identify line number
            const lineMatch = error.message.match(/position (\d+)/);
            const line = lineMatch ? this.getLineFromPosition(content, parseInt(lineMatch[1])) : 0;
            
            this.errors.push({
                message: `JSON syntax error: ${error.message}`,
                line: line
            });
        }

        return this.getValidationResult();
    }

    /**
     * Validate CSV content
     * @param {string} content - CSV string to validate
     * @returns {Object} - Validation result
     */
    validateCSV(content) {
        this.errors = [];
        this.warnings = [];

        // Check if content is empty
        if (!content || content.trim().length === 0) {
            this.errors.push({
                message: 'CSV content is empty',
                line: 0
            });
            return this.getValidationResult();
        }

        // Split into lines
        const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

        if (lines.length === 0) {
            this.errors.push({
                message: 'CSV has no data rows',
                line: 0
            });
            return this.getValidationResult();
        }

        // Detect delimiter
        const delimiter = this.detectDelimiter(content);
        if (!delimiter) {
            this.errors.push({
                message: 'Unable to detect CSV delimiter',
                line: 0
            });
            return this.getValidationResult();
        }

        // Parse first line to get column count
        const firstLine = lines[0];
        const expectedColumns = this.parseCSVLine(firstLine, delimiter).length;

        if (expectedColumns === 0) {
            this.errors.push({
                message: 'CSV header is empty or invalid',
                line: 1
            });
            return this.getValidationResult();
        }

        // Check each line for consistent column count
        let inconsistentLines = [];
        for (let i = 1; i < lines.length; i++) {
            const columns = this.parseCSVLine(lines[i], delimiter);
            if (columns.length !== expectedColumns) {
                inconsistentLines.push(i + 1);
            }
        }

        if (inconsistentLines.length > 0) {
            this.warnings.push({
                message: `Inconsistent column count on lines: ${inconsistentLines.slice(0, 5).join(', ')}${inconsistentLines.length > 5 ? '...' : ''}`,
                line: inconsistentLines[0]
            });
        }

        // Check for empty rows
        const emptyRows = lines.reduce((acc, line, idx) => {
            if (line.trim().replace(new RegExp(delimiter, 'g'), '').length === 0) {
                acc.push(idx + 1);
            }
            return acc;
        }, []);

        if (emptyRows.length > 0) {
            this.warnings.push({
                message: `Empty rows detected on lines: ${emptyRows.slice(0, 5).join(', ')}${emptyRows.length > 5 ? '...' : ''}`,
                line: emptyRows[0]
            });
        }

        // Check for malformed quotes
        const malformedLines = this.checkMalformedQuotes(lines);
        if (malformedLines.length > 0) {
            this.errors.push({
                message: `Malformed quotes detected on lines: ${malformedLines.slice(0, 5).join(', ')}${malformedLines.length > 5 ? '...' : ''}`,
                line: malformedLines[0]
            });
        }

        return this.getValidationResult();
    }

    /**
     * Check if object has circular references
     * @param {Object} obj - Object to check
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
     * Check property consistency in array of objects
     * @param {Array} arr - Array to check
     * @returns {Array} - List of inconsistent properties
     */
    checkPropertyConsistency(arr) {
        if (!Array.isArray(arr) || arr.length === 0) {
            return [];
        }

        // Get all unique properties
        const allProps = new Set();
        arr.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                Object.keys(item).forEach(key => allProps.add(key));
            }
        });

        // Check which properties are not present in all objects
        const inconsistent = [];
        allProps.forEach(prop => {
            const count = arr.filter(item => 
                typeof item === 'object' && item !== null && item.hasOwnProperty(prop)
            ).length;
            
            if (count < arr.length && count > 0) {
                inconsistent.push(prop);
            }
        });

        return inconsistent;
    }

    /**
     * Detect CSV delimiter
     * @param {string} content - CSV content
     * @returns {string|null} - Detected delimiter
     */
    detectDelimiter(content) {
        const delimiters = [',', ';', '\t', '|'];
        const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0).slice(0, 5);
        
        if (lines.length === 0) return null;

        let bestDelimiter = null;
        let maxConsistency = 0;

        for (const delimiter of delimiters) {
            const counts = lines.map(line => (line.match(new RegExp(delimiter, 'g')) || []).length);
            
            if (counts.length > 0) {
                const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
                const consistency = counts.filter(c => c === counts[0]).length / counts.length;
                
                if (consistency > maxConsistency && avg > 0) {
                    maxConsistency = consistency;
                    bestDelimiter = delimiter;
                }
            }
        }

        return bestDelimiter;
    }

    /**
     * Parse a CSV line respecting quotes
     * @param {string} line - CSV line
     * @param {string} delimiter - Delimiter character
     * @returns {Array} - Parsed columns
     */
    parseCSVLine(line, delimiter) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    }

    /**
     * Check for malformed quotes in CSV lines
     * @param {Array} lines - CSV lines
     * @returns {Array} - Line numbers with malformed quotes
     */
    checkMalformedQuotes(lines) {
        const malformed = [];

        lines.forEach((line, idx) => {
            let quoteCount = 0;
            let escaped = false;

            for (let char of line) {
                if (char === '"' && !escaped) {
                    quoteCount++;
                } else if (char === '\\') {
                    escaped = !escaped;
                } else {
                    escaped = false;
                }
            }

            // Odd number of quotes indicates malformed line
            if (quoteCount % 2 !== 0) {
                malformed.push(idx + 1);
            }
        });

        return malformed;
    }

    /**
     * Get line number from character position
     * @param {string} content - Content string
     * @param {number} position - Character position
     * @returns {number} - Line number
     */
    getLineFromPosition(content, position) {
        const upToPosition = content.substring(0, position);
        return upToPosition.split('\n').length;
    }

    /**
     * Get validation result
     * @returns {Object}
     */
    getValidationResult() {
        return {
            valid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings
        };
    }

    /**
     * Get formatted validation message
     * @returns {string}
     */
    getValidationMessage() {
        const messages = [];

        if (this.errors.length > 0) {
            messages.push('Errors:');
            this.errors.forEach(error => {
                messages.push(`  Line ${error.line}: ${error.message}`);
            });
        }

        if (this.warnings.length > 0) {
            messages.push('Warnings:');
            this.warnings.forEach(warning => {
                messages.push(`  Line ${warning.line}: ${warning.message}`);
            });
        }

        return messages.join('\n');
    }
}
