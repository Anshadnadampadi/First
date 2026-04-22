/**
 * StarzoMobiles Admin Main JS
 * Global admin functionalities and common utilities.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('StarzoMobiles Admin Systems Active');
});

// Global toast utility
window.showToast = function(title, message, type = 'success') {
    window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: message, type: type, title: title } 
    }));
};
