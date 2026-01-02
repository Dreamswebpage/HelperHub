// Admin Panel JavaScript

// Authentication
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on login page
    const isLoginPage = window.location.pathname.includes('login.html');
    
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    
    if (!isAuthenticated && !isLoginPage) {
        // Redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    if (isAuthenticated && isLoginPage) {
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Initialize admin functionality
    if (!isLoginPage) {
        initAdminPanel();
    } else {
        initLoginPage();
    }
});

function initLoginPage() {
    const loginForm = document.getElementById('adminLoginForm');
    const loginMessage = document.getElementById('loginMessage');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            
            // Simple authentication
            if (username === ADMIN_CREDENTIALS.username && 
                password === ADMIN_CREDENTIALS.password) {
                
                // Store authentication
                localStorage.setItem('adminAuthenticated', 'true');
                
                // Set expiration if remember is checked
                if (remember) {
                    const expiration = new Date();
                    expiration.setDate(expiration.getDate() + 7); // 7 days
                    localStorage.setItem('adminAuthExpires', expiration.toISOString());
                }
                
                // Show success message
                loginMessage.innerHTML = `
                    <div class="login-message success">
                        <i class="fas fa-check-circle"></i> Login successful! Redirecting...
                    </div>
                `;
                
                // Redirect to dashboard after delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
                
            } else {
                // Show error message
                loginMessage.innerHTML = `
                    <div class="login-message error">
                        <i class="fas fa-exclamation-circle"></i> Invalid username or password
                    </div>
                `;
            }
        });
    }
}

function initAdminPanel() {
    // Check authentication expiration
    checkAuthExpiration();
    
    // Initialize sidebar toggle
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const adminSidebar = document.querySelector('.admin-sidebar');
    
    if (sidebarToggle && adminSidebar) {
        sidebarToggle.addEventListener('click', function() {
            adminSidebar.classList.toggle('active');
        });
    }
    
    // Initialize logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('adminAuthenticated');
                localStorage.removeItem('adminAuthExpires');
                window.location.href = 'login.html';
            }
        });
    }
    
    // Add active class to current page in sidebar
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.menu-item').forEach(item => {
        const itemHref = item.getAttribute('href');
        if (itemHref === currentPage) {
            item.classList.add('active');
        }
    });
    
    // Initialize tooltips
    initTooltips();
    
    // Initialize form validations
    initFormValidations();
}

function checkAuthExpiration() {
    const expires = localStorage.getItem('adminAuthExpires');
    if (expires) {
        const expirationDate = new Date(expires);
        const now = new Date();
        
        if (now > expirationDate) {
            // Session expired
            localStorage.removeItem('adminAuthenticated');
            localStorage.removeItem('adminAuthExpires');
            window.location.href = 'login.html';
        }
    }
}

function initTooltips() {
    // Create tooltip container if it doesn't exist
    if (!document.getElementById('tooltip-container')) {
        const tooltipContainer = document.createElement('div');
        tooltipContainer.id = 'tooltip-container';
        tooltipContainer.style.cssText = `
            position: fixed;
            background: #333;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;
            max-width: 200px;
        `;
        document.body.appendChild(tooltipContainer);
    }
    
    // Add tooltips to elements with title attribute
    document.querySelectorAll('[title]').forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            const tooltip = document.getElementById('tooltip-container');
            tooltip.textContent = this.getAttribute('title');
            tooltip.style.opacity = '1';
            
            const rect = this.getBoundingClientRect();
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
            tooltip.style.left = (rect.left + rect.width/2 - tooltip.offsetWidth/2) + 'px';
        });
        
        element.addEventListener('mouseleave', function() {
            const tooltip = document.getElementById('tooltip-container');
            tooltip.style.opacity = '0';
        });
        
        // Remove title to prevent default tooltip
        element.removeAttribute('title');
    });
}

function initFormValidations() {
    // Add validation to all forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            let isValid = true;
            
            // Check required fields
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    highlightError(field, 'This field is required');
                } else {
                    removeError(field);
                }
            });
            
            // Check email fields
            const emailFields = form.querySelectorAll('input[type="email"]');
            emailFields.forEach(field => {
                if (field.value && !isValidEmail(field.value)) {
                    isValid = false;
                    highlightError(field, 'Please enter a valid email address');
                }
            });
            
            // Check number fields
            const numberFields = form.querySelectorAll('input[type="number"]');
            numberFields.forEach(field => {
                if (field.hasAttribute('min') && field.value < field.getAttribute('min')) {
                    isValid = false;
                    highlightError(field, `Minimum value is ${field.getAttribute('min')}`);
                }
                
                if (field.hasAttribute('max') && field.value > field.getAttribute('max')) {
                    isValid = false;
                    highlightError(field, `Maximum value is ${field.getAttribute('max')}`);
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                showNotification('Please correct the errors in the form', 'error');
            }
        });
    });
}

function highlightError(field, message) {
    // Add error class
    field.classList.add('error');
    
    // Create or update error message
    let errorMsg = field.nextElementSibling;
    if (!errorMsg || !errorMsg.classList.contains('error-message')) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        field.parentNode.insertBefore(errorMsg, field.nextSibling);
    }
    
    errorMsg.textContent = message;
    errorMsg.style.cssText = `
        color: #dc3545;
        font-size: 0.85rem;
        margin-top: 0.25rem;
    `;
}

function removeError(field) {
    field.classList.remove('error');
    
    const errorMsg = field.nextElementSibling;
    if (errorMsg && errorMsg.classList.contains('error-message')) {
        errorMsg.remove();
    }
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Notification system
function showNotification(message, type = 'success') {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .admin-notification {
                padding: 1rem 1.5rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateX(100%);
                opacity: 0;
            }
            .notification-success {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .notification-error {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            .notification-info {
                background-color: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }
            .notification-warning {
                background-color: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 1.25rem;
                cursor: pointer;
                color: inherit;
                opacity: 0.7;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: opacity 0.3s;
            }
            .notification-close:hover {
                opacity: 1;
            }
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `admin-notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Auto remove after 5 seconds
    const autoRemove = setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        removeNotification(notification);
    });
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function removeNotification(notification) {
    notification.style.animation = 'slideOut 0.3s ease';
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Data export helper
function exportToCSV(data, filename) {
    if (!data.length) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    // Convert data to CSV
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes if contains comma
                const escaped = ('' + value).replace(/"/g, '""');
                return escaped.includes(',') ? `"${escaped}"` : escaped;
            }).join(',')
        )
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data exported successfully', 'success');
}

// Confirmation dialog helper
function showConfirm(message, callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;
    
    modal.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 1rem;">Confirm Action</h3>
        <p style="margin-bottom: 2rem;">${message}</p>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button class="btn btn-secondary" id="confirmCancel">Cancel</button>
            <button class="btn btn-danger" id="confirmOk">OK</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add event listeners
    document.getElementById('confirmCancel').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    document.getElementById('confirmOk').addEventListener('click', () => {
        document.body.removeChild(overlay);
        callback();
    });

}
