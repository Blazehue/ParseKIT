// ParseKIT - JSON/CSV Converter
// Main application entry point

import { FileHandler } from './fileHandler.js';

class ParseKIT {
    constructor() {
        this.fileHandler = null;
        this.currentMode = 'json-to-csv'; // or 'csv-to-json'
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('ParseKIT initialized');
        
        // Initialize file handler
        this.fileHandler = new FileHandler();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup custom event listeners
        this.setupCustomEvents();
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

        if (this.currentMode === 'json-to-csv') {
            directionText.textContent = 'JSON → CSV';
            inputPanelTitle.textContent = 'JSON Input';
            outputPanelTitle.textContent = 'CSV Output';
            fileInput.accept = '.json';
            dropzoneText.textContent = 'Drag & drop your JSON file here';
        } else {
            directionText.textContent = 'CSV → JSON';
            inputPanelTitle.textContent = 'CSV Input';
            outputPanelTitle.textContent = 'JSON Output';
            fileInput.accept = '.csv';
            dropzoneText.textContent = 'Drag & drop your CSV file here';
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
        // Enable convert button
        this.enableConvertButton();
        
        // Update UI based on file type
        console.log(`Loaded ${detail.type} file with ${detail.content.length} characters`);
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
        // Conversion logic will be added in next commits
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ParseKIT();
});

