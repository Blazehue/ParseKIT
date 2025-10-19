// ParseKIT - JSON/CSV Converter
// Main application entry point

import { FileHandler } from './fileHandler.js';
import { Validator } from './validator.js';
import { JSONToCSVConverter } from './jsonToCsv.js';
import { CSVToJSONConverter } from './csvToJson.js';

class ParseKIT {
    constructor() {
        this.fileHandler = null;
        this.validator = new Validator();
        this.jsonToCsv = null;
        this.csvToJson = null;
        this.currentMode = 'json-to-csv'; // or 'csv-to-json'
        this.currentInputContent = null;
        this.currentOutput = null;
        this.currentPreviewMode = 'formatted';
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('ParseKIT initialized');
        
        // Initialize converters with default options
        this.updateConverters();
        
        // Initialize file handler
        this.fileHandler = new FileHandler();
        
            // Load saved preferences
            this.loadPreferences();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup custom event listeners
        this.setupCustomEvents();
    }

    /**
     * Update converters with current settings
     */
    updateConverters() {
        const delimiter = document.getElementById('delimiter')?.value || ',';
        const lineEnding = document.getElementById('lineEnding')?.value || '\n';
        const includeHeaders = document.getElementById('includeHeaders')?.checked !== false;
        const prettifyJSON = document.getElementById('prettifyJSON')?.checked !== false;

        this.jsonToCsv = new JSONToCSVConverter({
            delimiter,
            lineEnding,
            includeHeaders
        });

        this.csvToJson = new CSVToJSONConverter({
            delimiter: delimiter === ',' ? null : delimiter, // Auto-detect comma
            hasHeaders: includeHeaders
        });

            // Save preferences
            this.savePreferences();
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Direction toggle
        const toggleBtn = document.getElementById('toggleDirection');
        toggleBtn?.addEventListener('click', () => this.toggleDirection());

        // Clear input
        const clearBtn = document.getElementById('clearInput');
        clearBtn?.addEventListener('click', () => this.clearInput());

        // Input mode toggle
        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchInputMode(btn.dataset.mode));
        });

        // Settings toggle
        const settingsToggle = document.getElementById('settingsToggle');
        settingsToggle?.addEventListener('click', () => this.toggleSettings());

        // Convert button
        const convertBtn = document.getElementById('convertBtn');
        convertBtn?.addEventListener('click', () => this.convert());

        // Manual textarea input
        const textarea = document.getElementById('inputTextarea');
        textarea?.addEventListener('input', () => this.handleManualInput());

        // Settings changes
        const settingsInputs = document.querySelectorAll('#settingsContent select, #settingsContent input[type="checkbox"]');
        settingsInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateConverters();
                // Re-convert if there's output
                if (this.currentInputContent) {
                    this.convert();
                }
            });
        });

        // Preview tab switching
        const previewTabs = document.querySelectorAll('.preview-tab');
        previewTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchPreviewMode(tab.dataset.tab);
            });
        });

            // Copy output
            const copyBtn = document.getElementById('copyOutput');
            copyBtn?.addEventListener('click', () => this.copyToClipboard());

            // Download output
            const downloadBtn = document.getElementById('downloadOutput');
            downloadBtn?.addEventListener('click', () => this.downloadOutput());

                // Sample data buttons
                const loadSampleJSON = document.getElementById('loadSampleJSON');
                const loadSampleCSV = document.getElementById('loadSampleCSV');
                loadSampleJSON?.addEventListener('click', () => this.loadSampleData('json'));
                loadSampleCSV?.addEventListener('click', () => this.loadSampleData('csv'));

                // Help modal
                const helpBtn = document.getElementById('helpBtn');
                const closeHelp = document.getElementById('closeHelp');
                const helpModal = document.getElementById('helpModal');
                helpBtn?.addEventListener('click', () => helpModal?.classList.remove('hidden'));
                closeHelp?.addEventListener('click', () => helpModal?.classList.add('hidden'));
                helpModal?.addEventListener('click', (e) => {
                    if (e.target === helpModal) helpModal.classList.add('hidden');
                });

                // Dark mode toggle
                const darkModeToggle = document.getElementById('darkModeToggle');
                darkModeToggle?.addEventListener('click', () => this.toggleDarkMode());

                // Keyboard shortcuts
                document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    /**
     * Setup custom event listeners
     */
    setupCustomEvents() {
        // Listen for file loaded event
        document.addEventListener('fileLoaded', (e) => {
            console.log('File loaded:', e.detail);
            this.handleFileLoaded(e.detail);
        });

        // Listen for file cleared event
        document.addEventListener('fileCleared', () => {
            console.log('File cleared');
            this.handleFileCleared();
        });
    }

        /**
         * Handle keyboard shortcuts
         * @param {KeyboardEvent} e - Keyboard event
         */
        handleKeyboardShortcuts(e) {
            // Ctrl+Enter or Cmd+Enter - Convert
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const convertBtn = document.getElementById('convertBtn');
                if (convertBtn && !convertBtn.disabled) {
                    this.convert();
                }
            }

            // Ctrl+S or Cmd+S - Download
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.currentOutput) {
                    this.downloadOutput();
                }
            }
        }

        /**
         * Load sample data for testing
         * @param {string} type - 'json' or 'csv'
         */
        loadSampleData(type) {
            const textarea = document.getElementById('inputTextarea');
            if (!textarea) return;

            let sampleData = '';

            if (type === 'json') {
                sampleData = JSON.stringify([
                    {
                        "id": 1,
                        "name": "Alice Johnson",
                        "email": "alice@example.com",
                        "age": 28,
                        "city": "New York",
                        "active": true
                    },
                    {
                        "id": 2,
                        "name": "Bob Smith",
                        "email": "bob@example.com",
                        "age": 35,
                        "city": "Los Angeles",
                        "active": false
                    },
                    {
                        "id": 3,
                        "name": "Charlie Brown",
                        "email": "charlie@example.com",
                        "age": 42,
                        "city": "Chicago",
                        "active": true
                    }
                ], null, 2);

                // Set mode to JSON to CSV
                if (this.currentMode !== 'json-to-csv') {
                    this.toggleDirection();
                }
            } else {
                sampleData = `id,name,email,age,city,active
    1,Alice Johnson,alice@example.com,28,New York,true
    2,Bob Smith,bob@example.com,35,Los Angeles,false
    3,Charlie Brown,charlie@example.com,42,Chicago,true`;

                // Set mode to CSV to JSON
                if (this.currentMode !== 'csv-to-json') {
                    this.toggleDirection();
                }
            }

            // Switch to manual input mode
            this.switchInputMode('manual');
        
            // Set the sample data
            textarea.value = sampleData;
        
            // Trigger input handler
            this.handleManualInput();
        
            this.showToast('Sample data loaded!', 'success');
        }

        /**
         * Toggle dark mode
         */
        toggleDarkMode() {
            const body = document.body;
            const isDark = body.classList.toggle('dark-mode');
        
            // Update button text
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                darkModeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
            }

            // Save preference
            try {
                localStorage.setItem('parsekit_darkMode', isDark ? 'true' : 'false');
            } catch (error) {
                console.warn('Failed to save dark mode preference');
            }

            this.showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'info');
        }

    /**
     * Toggle conversion direction
     */
    toggleDirection() {
        this.currentMode = this.currentMode === 'json-to-csv' ? 'csv-to-json' : 'json-to-csv';
        
        const directionText = document.querySelector('.direction-text');
        const inputPanelTitle = document.getElementById('inputPanelTitle');
        const outputPanelTitle = document.getElementById('outputPanelTitle');
        const fileInput = document.getElementById('fileInput');
        const dropzoneText = document.querySelector('.dropzone-text');
        const inputTextarea = document.getElementById('inputTextarea');

        if (this.currentMode === 'json-to-csv') {
            directionText.textContent = 'JSON → CSV';
            inputPanelTitle.textContent = 'JSON Input';
            outputPanelTitle.textContent = 'CSV Output';
            fileInput.accept = '.json';
            dropzoneText.textContent = 'Drag & drop your JSON file here';
            inputTextarea.placeholder = 'Paste your JSON data here...';
        } else {
            directionText.textContent = 'CSV → JSON';
            inputPanelTitle.textContent = 'CSV Input';
            outputPanelTitle.textContent = 'JSON Output';
            fileInput.accept = '.csv';
            dropzoneText.textContent = 'Drag & drop your CSV file here';
            inputTextarea.placeholder = 'Paste your CSV data here...';
        }

        // Clear current input
        this.clearInput();
    }

    /**
     * Switch input mode between upload and manual
     * @param {string} mode - 'upload' or 'manual'
     */
    switchInputMode(mode) {
        const uploadArea = document.getElementById('uploadArea');
        const manualArea = document.getElementById('manualInputArea');
        const modeBtns = document.querySelectorAll('.mode-btn');

        modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        if (mode === 'upload') {
            uploadArea?.classList.remove('hidden');
            manualArea?.classList.add('hidden');
        } else {
            uploadArea?.classList.add('hidden');
            manualArea?.classList.remove('hidden');
        }
    }

    /**
     * Clear input data
     */
    clearInput() {
        this.fileHandler.clearFile();
        const textarea = document.getElementById('inputTextarea');
        if (textarea) {
            textarea.value = '';
        }
        this.updateCharCount();
        this.disableConvertButton();
        this.clearPreview();
    }

    /**
     * Handle manual text input
     */
    handleManualInput() {
        const textarea = document.getElementById('inputTextarea');
        if (!textarea) return;

        const content = textarea.value.trim();
        
        // Update character and line count
        this.updateCharCount();

        // Store current content
        this.currentInputContent = content;

        // Validate input
        if (content.length > 0) {
            this.validateInput(content);
            this.enableConvertButton();
        } else {
            this.disableConvertButton();
            this.clearValidation();
        }
    }

    /**
     * Clear validation display
     */
    clearValidation() {
        const statusEl = document.getElementById('conversionStatus');
        if (statusEl) {
            statusEl.textContent = '';
        }
    }

    /**
     * Get input content (from file or manual input)
     * @returns {string|null}
     */
    getInputContent() {
        // Check which input mode is active
        const uploadArea = document.getElementById('uploadArea');
        const manualArea = document.getElementById('manualInputArea');

        if (!uploadArea?.classList.contains('hidden')) {
            // File upload mode - get content from file handler
            // Content will be retrieved via the fileLoaded event
            return null;
        } else if (!manualArea?.classList.contains('hidden')) {
            // Manual input mode
            const textarea = document.getElementById('inputTextarea');
            return textarea?.value.trim() || null;
        }

        return null;
    }

    /**
     * Clear preview area
     */
    clearPreview() {
        const previewPlaceholder = document.querySelector('.preview-placeholder');
        const previewContent = document.getElementById('previewContent');
        
        if (previewPlaceholder && previewContent) {
            previewPlaceholder.classList.remove('hidden');
            previewContent.classList.add('hidden');
        }
    }

    /**
     * Toggle settings panel
     */
    toggleSettings() {
        const settingsContent = document.getElementById('settingsContent');
        const settingsPanel = document.getElementById('settingsPanel');
        
        if (settingsContent && settingsPanel) {
            const isHidden = settingsContent.classList.contains('hidden');
            settingsContent.classList.toggle('hidden');
            settingsPanel.classList.toggle('collapsed', !isHidden);
        }
    }

    /**
     * Handle file loaded event
     * @param {Object} detail - Event detail with content and type
     */
    handleFileLoaded(detail) {
        this.currentInputContent = detail.content;
        
        // Validate content
        this.validateInput(detail.content);
        
        // Enable convert button
        this.enableConvertButton();
        
        // Update UI based on file type
        console.log(`Loaded ${detail.type} file with ${detail.content.length} characters`);
    }

    /**
     * Validate input content
     * @param {string} content - Input content
     */
    validateInput(content) {
        if (!content) return;

        let validation;
        
        if (this.currentMode === 'json-to-csv') {
            validation = this.validator.validateJSON(content);
        } else {
            validation = this.validator.validateCSV(content);
        }

        this.displayValidation(validation);
    }

    /**
     * Display validation results
     * @param {Object} validation - Validation result
     */
    displayValidation(validation) {
        const statusEl = document.getElementById('conversionStatus');
        if (!statusEl) return;

        if (validation.valid) {
            statusEl.textContent = '✓ Input is valid';
            statusEl.style.color = 'var(--success)';
        } else {
            const errorCount = validation.errors.length;
            const warningCount = validation.warnings.length;
            statusEl.textContent = `⚠ ${errorCount} error(s), ${warningCount} warning(s)`;
            statusEl.style.color = 'var(--warning)';
            
            // Show detailed errors in console
            if (errorCount > 0) {
                console.error('Validation errors:', validation.errors);
            }
            if (warningCount > 0) {
                console.warn('Validation warnings:', validation.warnings);
            }
        }
    }

    /**
     * Handle file cleared event
     */
    handleFileCleared() {
        this.disableConvertButton();
    }

    /**
     * Enable convert button
     */
    enableConvertButton() {
        const convertBtn = document.getElementById('convertBtn');
        if (convertBtn) {
            convertBtn.disabled = false;
        }
    }

    /**
     * Disable convert button
     */
    disableConvertButton() {
        const convertBtn = document.getElementById('convertBtn');
        if (convertBtn) {
            convertBtn.disabled = true;
        }
    }

    /**
     * Update character and line count
     */
    updateCharCount() {
        const textarea = document.getElementById('inputTextarea');
        const charCount = document.getElementById('charCount');
        const lineCount = document.getElementById('lineCount');

        if (textarea && charCount && lineCount) {
            const text = textarea.value;
            const chars = text.length;
            const lines = text.split('\n').length;

            charCount.textContent = `${chars} characters`;
            lineCount.textContent = `${lines} lines`;
        }
    }

    /**
     * Perform conversion (placeholder)
     */
    convert() {
        console.log('Convert button clicked');
        
        // Get input content
        const content = this.currentInputContent;
        if (!content) {
            this.showToast('No input data to convert', 'warning');
            return;
        }

            try {
                // Show loading
                this.showLoading(true);

                // Perform conversion
                let result;
            
                if (this.currentMode === 'json-to-csv') {
                    result = this.jsonToCsv.convert(content);
                } else {
                    result = this.csvToJson.convert(content);
                }

                // Hide loading
                this.showLoading(false);

                if (result.success) {
                    this.currentOutput = result;
                    this.displayOutput(result);
                    this.showToast(`Conversion successful! ${result.rows} rows processed.`, 'success');
                
                    // Update status
                    const statusEl = document.getElementById('conversionStatus');
                    if (statusEl) {
                        statusEl.textContent = `✓ Converted ${result.rows} rows, ${result.columns || 0} columns`;
                        statusEl.style.color = 'var(--success)';
                    }
                } else {
                    this.handleConversionError(result.error);
            }
            } catch (error) {
                this.showLoading(false);
                this.handleConversionError(error.message || 'Unknown error occurred');
                console.error('Conversion error:', error);
        }
    }

        /**
         * Handle conversion errors
         * @param {string} errorMessage - Error message
         */
        handleConversionError(errorMessage) {
            // Categorize error and provide helpful messages
            let userMessage = errorMessage;
            let helpText = '';

            if (errorMessage.includes('JSON') && errorMessage.includes('position')) {
                helpText = 'Check your JSON syntax. Look for missing commas, brackets, or quotes.';
            } else if (errorMessage.includes('circular')) {
                helpText = 'Your data contains circular references which cannot be converted.';
            } else if (errorMessage.includes('delimiter')) {
                helpText = 'Unable to detect CSV delimiter. Try setting it manually in settings.';
            } else if (errorMessage.includes('empty')) {
                helpText = 'The input appears to be empty. Please provide valid data.';
            }

            this.showToast(`Conversion failed: ${userMessage}`, 'error');
        
            if (helpText) {
                setTimeout(() => {
                    this.showToast(helpText, 'info');
                }, 500);
            }

            // Update status
            const statusEl = document.getElementById('conversionStatus');
            if (statusEl) {
                statusEl.textContent = `✗ Conversion failed`;
                statusEl.style.color = 'var(--error)';
            }
        }

        /**
         * Show/hide loading spinner
         * @param {boolean} show - Whether to show spinner
         */
        showLoading(show) {
            const spinner = document.getElementById('loadingSpinner');
            if (spinner) {
                if (show) {
                    spinner.classList.remove('hidden');
                } else {
                    spinner.classList.add('hidden');
                }
            }
        }

    /**
     * Display output in preview area
     * @param {Object} result - Conversion result
     */
    displayOutput(result) {
        const previewPlaceholder = document.querySelector('.preview-placeholder');
        const previewContent = document.getElementById('previewContent');

        if (previewPlaceholder && previewContent) {
            previewPlaceholder.classList.add('hidden');
            previewContent.classList.remove('hidden');
            
            // Display in current preview mode
            this.updatePreviewDisplay();
        }
    }

    /**
     * Switch preview mode
     * @param {string} mode - Preview mode ('formatted', 'table', 'raw')
     */
    switchPreviewMode(mode) {
        this.currentPreviewMode = mode;
        
        // Update active tab
        document.querySelectorAll('.preview-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === mode);
        });
        
        // Update display
        this.updatePreviewDisplay();
    }

    /**
     * Update preview display based on current mode
     */
    updatePreviewDisplay() {
        if (!this.currentOutput) return;

        const previewOutput = document.getElementById('previewOutput');
        if (!previewOutput) return;

        switch (this.currentPreviewMode) {
            case 'formatted':
                this.displayFormattedPreview(previewOutput);
                break;
            case 'table':
                this.displayTablePreview(previewOutput);
                break;
            case 'raw':
                this.displayRawPreview(previewOutput);
                break;
        }
    }

    /**
     * Display formatted preview
     * @param {HTMLElement} container - Preview container
     */
    displayFormattedPreview(container) {
        container.innerHTML = '';
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordWrap = 'break-word';
        pre.textContent = this.currentOutput.data;
        container.appendChild(pre);
    }

    /**
     * Display table preview
     * @param {HTMLElement} container - Preview container
     */
    displayTablePreview(container) {
        container.innerHTML = '';
        
        try {
            if (this.currentMode === 'json-to-csv') {
                // Display CSV as table
                this.displayCSVTable(container, this.currentOutput.data);
            } else {
                // Display JSON as table
                this.displayJSONTable(container, this.currentOutput.parsed);
            }
        } catch (error) {
            container.innerHTML = `<p style="color: var(--error);">Error displaying table view: ${error.message}</p>`;
        }
    }

    /**
     * Display CSV as HTML table
     * @param {HTMLElement} container - Container element
     * @param {string} csvData - CSV data
     */
    displayCSVTable(container, csvData) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        const delimiter = this.jsonToCsv.options.delimiter;
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.fontSize = '0.85rem';

        lines.forEach((line, index) => {
            const row = document.createElement('tr');
            const cells = line.split(delimiter);
            
            cells.forEach(cell => {
                const cellEl = document.createElement(index === 0 ? 'th' : 'td');
                cellEl.textContent = cell.replace(/^"|"$/g, ''); // Remove quotes
                cellEl.style.border = '1px solid var(--border)';
                cellEl.style.padding = '8px';
                cellEl.style.textAlign = 'left';
                if (index === 0) {
                    cellEl.style.backgroundColor = 'var(--background)';
                    cellEl.style.fontWeight = 'bold';
                }
                row.appendChild(cellEl);
            });
            
            table.appendChild(row);
        });

        container.appendChild(table);
    }

    /**
     * Display JSON as HTML table
     * @param {HTMLElement} container - Container element
     * @param {Array|Object} jsonData - JSON data
     */
    displayJSONTable(container, jsonData) {
        if (Array.isArray(jsonData) && jsonData.length > 0) {
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.fontSize = '0.85rem';

            // Header row
            const headers = Object.keys(jsonData[0]);
            const headerRow = document.createElement('tr');
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                th.style.border = '1px solid var(--border)';
                th.style.padding = '8px';
                th.style.backgroundColor = 'var(--background)';
                th.style.fontWeight = 'bold';
                th.style.textAlign = 'left';
                headerRow.appendChild(th);
            });
            table.appendChild(headerRow);

            // Data rows
            jsonData.slice(0, 100).forEach(item => { // Limit to 100 rows for performance
                const row = document.createElement('tr');
                headers.forEach(header => {
                    const td = document.createElement('td');
                    const value = item[header];
                    td.textContent = value === null || value === undefined ? '' : String(value);
                    td.style.border = '1px solid var(--border)';
                    td.style.padding = '8px';
                    row.appendChild(td);
                });
                table.appendChild(row);
            });

            if (jsonData.length > 100) {
                const note = document.createElement('p');
                note.textContent = `Showing first 100 of ${jsonData.length} rows`;
                note.style.marginTop = '10px';
                note.style.color = 'var(--text-muted)';
                note.style.fontSize = '0.85rem';
                container.appendChild(note);
            }

            container.appendChild(table);
        } else {
            container.innerHTML = '<p style="color: var(--text-muted);">No tabular data to display</p>';
        }
    }

    /**
     * Display raw preview
     * @param {HTMLElement} container - Preview container
     */
    displayRawPreview(container) {
        container.innerHTML = '';
        const textarea = document.createElement('textarea');
        textarea.value = this.currentOutput.data;
        textarea.readOnly = true;
        textarea.style.width = '100%';
        textarea.style.minHeight = '400px';
        textarea.style.fontFamily = 'var(--font-mono)';
        textarea.style.fontSize = '0.85rem';
        textarea.style.border = 'none';
        textarea.style.background = 'transparent';
        textarea.style.resize = 'vertical';
        container.appendChild(textarea);
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

        /**
         * Copy output to clipboard
         */
        async copyToClipboard() {
            if (!this.currentOutput || !this.currentOutput.data) {
                this.showToast('No output to copy', 'warning');
                return;
            }

            try {
                await navigator.clipboard.writeText(this.currentOutput.data);
                this.showToast('Copied to clipboard!', 'success');
            } catch (error) {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(this.currentOutput.data);
            }
        }

        /**
         * Fallback copy to clipboard method
         * @param {string} text - Text to copy
         */
        fallbackCopyToClipboard(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
        
            try {
                document.execCommand('copy');
                this.showToast('Copied to clipboard!', 'success');
            } catch (error) {
                this.showToast('Failed to copy to clipboard', 'error');
            }
        
            document.body.removeChild(textArea);
        }

        /**
         * Download output file
         */
        downloadOutput() {
            if (!this.currentOutput || !this.currentOutput.data) {
                this.showToast('No output to download', 'warning');
                return;
            }

            // Determine file extension and MIME type
            const extension = this.currentMode === 'json-to-csv' ? 'csv' : 'json';
            const mimeType = this.currentMode === 'json-to-csv' ? 'text/csv' : 'application/json';
        
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `converted_${timestamp}.${extension}`;

            // Create blob and download
            this.downloadFile(this.currentOutput.data, filename, mimeType);
        
            this.showToast(`Downloaded ${filename}`, 'success');
        }

        /**
         * Download file using Blob
         * @param {string} content - File content
         * @param {string} filename - File name
         * @param {string} mimeType - MIME type
         */
        downloadFile(content, filename, mimeType) {
            // Create Blob
            const blob = new Blob([content], { type: mimeType });
        
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
        
            // Trigger download
            document.body.appendChild(link);
            link.click();
        
            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

            /**
             * Save user preferences to localStorage
             */
            savePreferences() {
                const preferences = {
                    delimiter: document.getElementById('delimiter')?.value,
                    lineEnding: document.getElementById('lineEnding')?.value,
                    includeHeaders: document.getElementById('includeHeaders')?.checked,
                    prettifyJSON: document.getElementById('prettifyJSON')?.checked,
                    currentMode: this.currentMode
                };

                try {
                    localStorage.setItem('parsekit_preferences', JSON.stringify(preferences));
                } catch (error) {
                    console.warn('Failed to save preferences:', error);
                }
            }

            /**
             * Load user preferences from localStorage
             */
            loadPreferences() {
                try {
                    const saved = localStorage.getItem('parsekit_preferences');
                    if (!saved) return;

                    const preferences = JSON.parse(saved);

                    // Apply saved preferences
                    if (preferences.delimiter) {
                        const delimiterEl = document.getElementById('delimiter');
                        if (delimiterEl) delimiterEl.value = preferences.delimiter;
                    }

                    if (preferences.lineEnding) {
                        const lineEndingEl = document.getElementById('lineEnding');
                        if (lineEndingEl) lineEndingEl.value = preferences.lineEnding;
                    }

                    if (typeof preferences.includeHeaders === 'boolean') {
                        const includeHeadersEl = document.getElementById('includeHeaders');
                        if (includeHeadersEl) includeHeadersEl.checked = preferences.includeHeaders;
                    }

                    if (typeof preferences.prettifyJSON === 'boolean') {
                        const prettifyJSONEl = document.getElementById('prettifyJSON');
                        if (prettifyJSONEl) prettifyJSONEl.checked = preferences.prettifyJSON;
                    }

                    console.log('Loaded preferences from localStorage');
                } catch (error) {
                    console.warn('Failed to load preferences:', error);
                }

                    // Load dark mode preference
                    try {
                        const darkMode = localStorage.getItem('parsekit_darkMode');
                        if (darkMode === 'true') {
                            document.body.classList.add('dark-mode');
                            const darkModeToggle = document.getElementById('darkModeToggle');
                            if (darkModeToggle) {
                                darkModeToggle.textContent = '☀️ Light Mode';
                            }
                        }
                    } catch (error) {
                        console.warn('Failed to load dark mode preference');
                    }
            }

            /**
             * Download with custom filename
             */
            downloadWithCustomName() {
                if (!this.currentOutput || !this.currentOutput.data) {
                    this.showToast('No output to download', 'warning');
                    return;
                }

                // Prompt for filename
                const extension = this.currentMode === 'json-to-csv' ? 'csv' : 'json';
                const defaultName = `converted.${extension}`;
                const filename = prompt('Enter filename:', defaultName);

                if (!filename) return;

                // Ensure correct extension
                const finalFilename = filename.endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;
                const mimeType = this.currentMode === 'json-to-csv' ? 'text/csv' : 'application/json';

                this.downloadFile(this.currentOutput.data, finalFilename, mimeType);
                this.showToast(`Downloaded ${finalFilename}`, 'success');
            }

            /**
             * Get conversion summary/report
             * @returns {Object} - Conversion statistics
             */
            getConversionReport() {
                if (!this.currentOutput) {
                    return null;
                }

                const report = {
                    timestamp: new Date().toISOString(),
                    mode: this.currentMode,
                    inputSize: this.currentInputContent?.length || 0,
                    outputSize: this.currentOutput.data?.length || 0,
                    rows: this.currentOutput.rows || 0,
                    columns: this.currentOutput.columns || 0,
                    settings: {
                        delimiter: document.getElementById('delimiter')?.value,
                        lineEnding: document.getElementById('lineEnding')?.value.replace('\n', 'LF').replace('\r\n', 'CRLF'),
                        includeHeaders: document.getElementById('includeHeaders')?.checked,
                        prettifyJSON: document.getElementById('prettifyJSON')?.checked
                    }
                };

                return report;
            }

            /**
             * Export conversion report as JSON
             */
            exportReport() {
                const report = this.getConversionReport();
                if (!report) {
                    this.showToast('No conversion to report', 'warning');
                    return;
                }

                const reportJSON = JSON.stringify(report, null, 2);
                const filename = `conversion_report_${new Date().toISOString().slice(0, 10)}.json`;
                this.downloadFile(reportJSON, filename, 'application/json');
                this.showToast('Report exported', 'success');
            }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ParseKIT();
});

