/**
 * File Handler Module
 * Handles file upload, drag-and-drop, and file reading operations
 */

import { Validator } from './validator.js';

export class FileHandler {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.currentFile = null;
        this.currentFileType = null;
        this.validator = new Validator();
        this.initializeEventListeners();
    }

    /**
     * Initialize all file-related event listeners
     */
    initializeEventListeners() {
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const removeFileBtn = document.getElementById('removeFile');

        // Click to upload
        uploadBtn?.addEventListener('click', () => {
            fileInput?.click();
        });

        // File input change
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFile(file);
            }
        });

        // Drag and drop events
        dropzone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('drag-over');
        });

        dropzone?.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('drag-over');
        });

        dropzone?.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        // Remove file
        removeFileBtn?.addEventListener('click', () => {
            this.clearFile();
        });

        // Make dropzone clickable
        dropzone?.addEventListener('click', (e) => {
            if (e.target === dropzone || e.target.closest('.dropzone-content')) {
                fileInput?.click();
            }
        });
    }

    /**
     * Handle file upload
     * @param {File} file - The uploaded file
     */
    async handleFile(file) {
        try {
            // Show loading spinner
            this.showLoading(true);

            // Validate file size and type
            const validation = this.validateFile(file);
            if (!validation.valid) {
                this.showError(validation.error);
                this.showLoading(false);
                return;
            }

            // Read file
            const content = await this.readFile(file);
            
            // Validate file content
            const fileType = this.getFileType(file);
            const contentValidation = this.validateFileContent(content, fileType);
            
            if (!contentValidation.valid) {
                this.showError(`File validation failed:\n${contentValidation.errors.map(e => e.message).join('\n')}`);
                this.showLoading(false);
                return;
            }

            // Show warnings if any
            if (contentValidation.warnings.length > 0) {
                contentValidation.warnings.forEach(warning => {
                    this.showToast(warning.message, 'warning');
                });
            }

            // Store file info
            this.currentFile = file;
            this.currentFileType = fileType;

            // Display file preview
            this.displayFilePreview(file);

            // Hide loading spinner
            this.showLoading(false);

            // Trigger file loaded event
            this.dispatchFileLoadedEvent(content, this.currentFileType);

            // Show success message
            this.showSuccess(`File "${file.name}" loaded successfully!`);

        } catch (error) {
            this.showError(`Error reading file: ${error.message}`);
            this.showLoading(false);
        }
    }

    /**
     * Validate file before processing
     * @param {File} file - The file to validate
     * @returns {Object} - Validation result
     */
    validateFile(file) {
        // Check if file exists
        if (!file) {
            return {
                valid: false,
                error: 'No file selected'
            };
        }

        // Check file size
        if (file.size === 0) {
            return {
                valid: false,
                error: 'File is empty'
            };
        }

        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `File size (${this.formatFileSize(file.size)}) exceeds maximum limit of ${this.formatFileSize(this.maxFileSize)}`
            };
        }

        // Check file type
        const fileType = this.getFileType(file);
        if (!fileType) {
            const extension = file.name.split('.').pop().toLowerCase();
            return {
                valid: false,
                error: `Invalid file type ".${extension}". Please upload a JSON or CSV file.`
            };
        }

        return { valid: true };
    }

    /**
     * Validate file content
     * @param {string} content - File content
     * @param {string} type - File type ('json' or 'csv')
     * @returns {Object} - Validation result
     */
    validateFileContent(content, type) {
        if (type === 'json') {
            return this.validator.validateJSON(content);
        } else if (type === 'csv') {
            return this.validator.validateCSV(content);
        }
        
        return {
            valid: false,
            errors: [{ message: 'Unknown file type', line: 0 }],
            warnings: []
        };
    }

    /**
     * Get file type from file object
     * @param {File} file - The file object
     * @returns {string|null} - 'json' or 'csv' or null
     */
    getFileType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const mimeType = file.type.toLowerCase();

        if (extension === 'json' || mimeType === 'application/json') {
            return 'json';
        } else if (extension === 'csv' || mimeType === 'text/csv') {
            return 'csv';
        }

        return null;
    }

    /**
     * Read file content using FileReader API
     * @param {File} file - The file to read
     * @returns {Promise<string>} - File content as text
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                resolve(e.target.result);
            };

            reader.onerror = (e) => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Display file preview after successful upload
     * @param {File} file - The uploaded file
     */
    displayFilePreview(file) {
        const dropzoneContent = document.querySelector('.dropzone-content');
        const filePreview = document.getElementById('filePreview');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');

        if (dropzoneContent && filePreview && fileName && fileSize) {
            dropzoneContent.classList.add('hidden');
            filePreview.classList.remove('hidden');
            fileName.textContent = file.name;
            fileSize.textContent = this.formatFileSize(file.size);
        }
    }

    /**
     * Clear current file and reset UI
     */
    clearFile() {
        this.currentFile = null;
        this.currentFileType = null;

        const dropzoneContent = document.querySelector('.dropzone-content');
        const filePreview = document.getElementById('filePreview');
        const fileInput = document.getElementById('fileInput');

        if (dropzoneContent && filePreview) {
            dropzoneContent.classList.remove('hidden');
            filePreview.classList.add('hidden');
        }

        if (fileInput) {
            fileInput.value = '';
        }

        // Dispatch clear event
        this.dispatchFileClearedEvent();
    }

    /**
     * Format file size to human-readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Show/hide loading spinner
     * @param {boolean} show - Whether to show the spinner
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
     * Show error toast
     * @param {string} message - Error message
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show success toast
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning, info)
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
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }

    /**
     * Dispatch custom event when file is loaded
     * @param {string} content - File content
     * @param {string} type - File type
     */
    dispatchFileLoadedEvent(content, type) {
        const event = new CustomEvent('fileLoaded', {
            detail: { content, type }
        });
        document.dispatchEvent(event);
    }

    /**
     * Dispatch custom event when file is cleared
     */
    dispatchFileClearedEvent() {
        const event = new CustomEvent('fileCleared');
        document.dispatchEvent(event);
    }

    /**
     * Get current file
     * @returns {File|null}
     */
    getCurrentFile() {
        return this.currentFile;
    }

    /**
     * Get current file type
     * @returns {string|null}
     */
    getCurrentFileType() {
        return this.currentFileType;
    }
}
