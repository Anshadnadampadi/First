/**
 * Socket.io Client Manager for STARZO
 */
const socket = io();

// Join specific rooms (e.g., admin, user-specific rooms)
if (window.location.pathname.startsWith('/admin')) {
    socket.emit('join_room', 'admin_room');
}

if (window.USER_ID) {
    socket.emit('join_room', window.USER_ID);
}


// Global real-time updates listeners
socket.on('notification', (data) => {
    // This will be handled by the layout-specific logic (e.g., notification bell)
    window.dispatchEvent(new CustomEvent('new-notification', { detail: data }));
    
    // Show a global toast if it's important
    if (typeof dispatchGlobalToast === 'function') {
        dispatchGlobalToast('info', data.title, data.message);
    }
});

socket.on('cart_update', (data) => {
    const badge = document.getElementById('cart-badge');
    if (badge && data.count !== undefined) {
        badge.textContent = data.count;
        badge.classList.add('animate-bounce');
        setTimeout(() => badge.classList.remove('animate-bounce'), 1000);
    }
});

socket.on('wishlist_update', (data) => {
    const badge = document.getElementById('wishlist-badge');
    if (badge && data.count !== undefined) {
        badge.textContent = data.count;
    }
});

socket.on('order_status_update', (data) => {
    if (typeof dispatchGlobalToast === 'function') {
        dispatchGlobalToast('success', `Order ${data.orderId}`, `Status changed to ${data.status}`);
    }
    // Re-fetch current page content if on order details
    if (window.location.pathname.includes(`/orders/${data.orderId}`)) {
        if (window.SpaNavigation) window.SpaNavigation.loadPage(window.location.href);
    }
});

window.StarzoSocket = socket;
