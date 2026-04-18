import Order from '../../models/order/order.js';
import { 
    getOrdersService, 
    updateOrderStatusService, 
    updateItemReturnStatusService 
} from '../../services/admin/orderService.js';

export const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const search = req.query.search || '';

        const { orders, stats, totalPages } = await getOrdersService(search, page, limit);

        res.render('admin/orders', {
            title: 'Orders',
            orders,
            stats,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1,
            lastPage: totalPages,
            search,
            query: search ? `search=${search}` : '',
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'Orders', url: '/admin/orders' }
            ]
        });
    } catch (error) {
        console.error('Error fetching admin orders:', error);
        res.status(500).render('errors/error', { message: 'Internal Server Error' });
    }
};

export const getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId)
            .populate('user', 'firstName lastName name email')
            .populate('items.product')
            .lean();

        if (!order) {
            return res.status(404).render('errors/error', { message: 'Order not found' });
        }

        res.render('admin/order-details', {
            title: `Order #${order.orderId}`,
            order,
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'Orders', url: '/admin/orders' },
                { label: `Order #${order.orderId}`, url: `/admin/orders/${order._id}` }
            ]
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).render('errors/error', { message: 'Internal Server Error' });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const result = await updateOrderStatusService(orderId, status);

        if (!result.success) {
            return res.status(result.status || 400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateItemReturnStatus = async (req, res) => {
    try {
        const { orderId, itemId, status } = req.body;
        const result = await updateItemReturnStatusService(orderId, itemId, status);

        if (!result.success) {
            return res.status(result.status || 400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error updating item return status:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


