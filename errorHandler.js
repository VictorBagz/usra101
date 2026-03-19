// errorHandler.js - Centralized error handling system
(function() {
    // Check if ErrorHandler is already defined
    if (window.ErrorHandler) {
        return;
    }

    class ErrorHandler {
    static showError(message, type = 'error') {
        try {
            // Only log to console in development, don't show UI error
            console.error('[Error]:', message);
            const errorDiv = document.getElementById('error-message');
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
                setTimeout(() => {
                    errorDiv.style.display = 'none';
                }, 5000);
            }
        } catch (error) {
            console.error('Error in showError:', error);
            // Fallback to alert if everything else fails
            alert(message);
        }
    }

    static showSuccess(message) {
        try {
            // Keep showing success messages in UI
            const successDiv = document.getElementById('success-message');
            if (successDiv) {
                successDiv.textContent = message;
                successDiv.style.display = 'block';
                setTimeout(() => {
                    successDiv.style.display = 'none';
                }, 5000);
            }
            this._showModal(message, 'success');
        } catch (error) {
            console.error('Error in showSuccess:', error);
            // Fallback to alert if modal fails
            alert(message);
        }
    }

    static _showModal(message, type = 'error') {
        try {
            // Create modal elements
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        
        const icon = document.createElement('i');
        switch(type) {
            case 'success':
                icon.className = 'fas fa-check-circle';
                modalContent.classList.add('success');
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-circle';
                modalContent.classList.add('error');
                break;
            default:
                icon.className = 'fas fa-info-circle';
                modalContent.classList.add('info');
        }
        
        const modalTitle = document.createElement('h3');
        modalTitle.className = 'modal-title';
        switch(type) {
            case 'success':
                modalTitle.textContent = 'Success';
                break;
            case 'error':
                modalTitle.textContent = 'Error';
                break;
            default:
                modalTitle.textContent = 'Notice';
        }
        
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.textContent = message;
        
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-button';
        closeButton.textContent = 'OK';
        
        // Assemble the modal
        modalHeader.appendChild(icon);
        modalHeader.appendChild(modalTitle);
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalFooter.appendChild(closeButton);
        modalContent.appendChild(modalFooter);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Add event listeners
        closeButton.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            setTimeout(() => {
                modalOverlay.remove();
            }, 300);
        });

        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
                setTimeout(() => {
                    modalOverlay.remove();
                }, 300);
            }
        });
        
        // Show the modal with animation
        setTimeout(() => {
            modalOverlay.classList.add('active');
        }, 10);
        } catch (error) {
            console.error('Error showing modal:', error);
            // Fallback to simple alert if modal fails
            alert(message);
        }
    }

    static handleError(error, defaultMessage = 'An unexpected error occurred.') {
        try {
            console.error(error);
            const message = error?.message || defaultMessage;
            this.showError(message);
            return false; // Return false to indicate error handling completed
        } catch (err) {
            console.error('Error in handleError:', err);
            // Last resort fallback
            alert(defaultMessage);
            return false;
        }
    }
}

// Global error handler for uncaught exceptions
window.addEventListener('unhandledrejection', function(event) {
    ErrorHandler.handleError(event.reason);
});

window.addEventListener('error', function(event) {
    ErrorHandler.handleError(event.error);
});

// Expose ErrorHandler globally
window.ErrorHandler = ErrorHandler;
})();