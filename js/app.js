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

        // Perform conversion
        let result;
        
        if (this.currentMode === 'json-to-csv') {
            result = this.jsonToCsv.convert(content);
        } else {
            result = this.csvToJson.convert(content);
        }

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
            this.showToast(`Conversion failed: ${result.error}`, 'error');
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ParseKIT();
});

