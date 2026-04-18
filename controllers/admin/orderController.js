import mongoose from 'mongoose';
import Order from '../../models/order/order.js';
import Product from '../../models/product/product.js';

export const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const filter = {};
        if (search) {
            // Find users matching search to filter orders by user
            const users = await mongoose.model('User').find({
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);

            filter.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { paymentStatus: { $regex: search, $options: 'i' } },
                { orderStatus: { $regex: search, $options: 'i' } },
                { user: { $in: userIds } }
            ];
        }

        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = (await Order.find(filter)
            .populate('user', 'firstName lastName name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()).map(o => ({ ...o, status: o.orderStatus }));

        // Calculate stats for the view
        const stats = {
            pending: await Order.countDocuments({ orderStatus: 'Pending' }),
            processing: await Order.countDocuments({ orderStatus: { $in: ['Confirmed', 'Processing'] } }),
            shipped: await Order.countDocuments({ orderStatus: 'Shipped' })
        };

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
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const oldStatus = order.orderStatus;

        // 1. Terminal State Protection
        if (oldStatus === 'Cancelled' || oldStatus === 'Returned') {
            return res.status(400).json({ success: false, message: `Cannot update a ${oldStatus} order.` });
        }

        // 2. Backward Transition Protection (Forward-only flow)
        const statusHierarchy = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
        const oldIndex = statusHierarchy.indexOf(oldStatus);
        const newIndex = statusHierarchy.indexOf(status);

        // If both statuses are in the main hierarchy, prevent going backwards
        if (oldIndex !== -1 && newIndex !== -1 && newIndex < oldIndex) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid transition: Ordered moved from ${oldStatus} to ${status} is not allowed.` 
            });
        }

        // 3. Status Specific Rules
        // Once Delivered, it can only move to Return related statuses or stay Delivered
        if (oldStatus === 'Delivered' && newIndex !== -1 && status !== 'Delivered') {
            // Already handled by hierarchy check above (newIndex < oldIndex), 
            // but this makes it explicit for statuses outside the hierarchy if we added any.
             return res.status(400).json({ success: false, message: 'Delivered orders cannot be moved back to logistics stages.' });
        }

        order.orderStatus = status;
        const newlyTerminalItems = [];
        
        // Sync item statuses if they are not terminal (Cancelled/Returned)
        order.items.forEach(item => {
            const oldItemStatus = item.status;
            if (!['Cancelled', 'Returned'].includes(oldItemStatus)) {
                // Map global status to item status where applicable
                const statusMap = {
                    'Confirmed': 'Ordered',
                    'Processing': 'Ordered',
                    'Shipped': 'Shipped',
                    'Delivered': 'Delivered'
                };
                
                // Return flow is special: only sync if the item was already part of the return flow
                if (['Return Requested', 'Return Approved', 'Return Picked', 'Returned'].includes(status)) {
                    if (status === 'Return Requested' && item.status === 'Delivered') {
                        item.status = 'Return Requested';
                    } else if (['Return Approved', 'Return Picked'].includes(status) && item.status === 'Return Requested') {
                        item.status = 'Return Approved';
                    } else if (status === 'Returned' && ['Return Approved', 'Return Picked', 'Return Requested'].includes(item.status)) {
                        item.status = 'Returned';
                    }
                } else if (statusMap[status]) {
                    item.status = statusMap[status];
                }

                // If it just became terminal, track it for refund/stock
                if (item.status !== oldItemStatus && ['Cancelled', 'Returned'].includes(item.status)) {
                    newlyTerminalItems.push(item);
                }
            }
        });

        // Special case: if order is globally Cancelled, and any item is not terminal, cancel them too
        if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
            order.items.forEach(item => {
                if (!['Cancelled', 'Returned'].includes(item.status)) {
                    item.status = 'Cancelled';
                    newlyTerminalItems.push(item);
                }
            });
        }
        
        // Auto-update payment status if delivered
        if (status === 'Delivered' && order.paymentMethod === 'CASH ON DELIVERY') {
            order.paymentStatus = 'Paid';
        }

        // Handle Refunds and Stock for newly terminal items
        if (newlyTerminalItems.length > 0) {
            let totalRefund = 0;
            const isOnlinePaid = order.paymentStatus === 'Paid';

            for (const item of newlyTerminalItems) {
                // Calculate refund if applicable (Returned items or Cancelled items that were paid)
                if (item.status === 'Returned' || (item.status === 'Cancelled' && isOnlinePaid)) {
                    totalRefund += (item.price * item.qty);
                }

                // Restore Stock
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.qty;
                    if (item.variant && product.variants && product.variants.length > 0) {
                        const variantIndex = product.variants.findIndex(v => {
                            if (typeof item.variant === 'object' && item.variant !== null) {
                                return v.color === item.variant.color && 
                                       v.storage === item.variant.storage && 
                                       v.ram === item.variant.ram;
                            }
                            return v._id.toString() === item.variant.toString();
                        });
                        if (variantIndex > -1) {
                            product.variants[variantIndex].stock += item.qty;
                        }
                    }
                    await product.save();
                }
            }

            if (totalRefund > 0) {
                const Wallet = mongoose.model('Wallet');
                let wallet = await Wallet.findOne({ user: order.user });
                if (!wallet) wallet = new Wallet({ user: order.user, balance: 0, transactions: [] });
                
                wallet.balance += totalRefund;
                wallet.transactions.push({
                    amount: totalRefund,
                    type: 'credit',
                    description: `Refund for ${newlyTerminalItems.length} item(s) in Order #${order.orderId}`
                });
                await wallet.save();
                
                // If all items are now terminal, mark payment as Refunded
                const allTerminal = order.items.every(i => ['Cancelled', 'Returned'].includes(i.status));
                if (allTerminal) {
                    order.paymentStatus = 'Refunded';
                }
            }
        }

        await order.save();
        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateItemReturnStatus = async (req, res) => {
    try {
        const { orderId, itemId, status } = req.body;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const item = order.items.find(i => i._id.toString() === itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        const oldItemStatus = item.status;
        item.status = status;

        if (status === 'Returned' && oldItemStatus !== 'Returned') {
            // Process Refund
            const refundAmount = item.price * item.qty;
            const Wallet = mongoose.model('Wallet');
            let wallet = await Wallet.findOne({ user: order.user });
            
            if (!wallet) {
                wallet = new Wallet({ user: order.user, balance: 0, transactions: [] });
            }
            
            wallet.balance += refundAmount;
            wallet.transactions.push({
                amount: refundAmount,
                type: 'credit',
                description: `Refund for Returned Item in Order #${order.orderId}`
            });
            await wallet.save();

            // Restore Stock
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.qty;
                if (item.variant && product.variants && product.variants.length > 0) {
                    const variantIndex = product.variants.findIndex(v => {
                        if (typeof item.variant === 'object' && item.variant !== null) {
                            return v.color === item.variant.color && 
                                   v.storage === item.variant.storage && 
                                   v.ram === item.variant.ram;
                        }
                        return v._id.toString() === item.variant.toString();
                    });
                    if (variantIndex > -1) {
                        product.variants[variantIndex].stock += item.qty;
                    }
                }
                await product.save();
            }
        }

        // Check overall order status
        const allItemsReturned = order.items.every(i => i.status === 'Returned' || i.status === 'Cancelled');
        const anyItemReturned = order.items.some(i => i.status === 'Returned');
        
        if (allItemsReturned) {
            order.orderStatus = 'Returned';
            order.paymentStatus = 'Refunded';
        } else if (order.items.some(i => i.status === 'Return Requested')) {
            order.orderStatus = 'Return Requested';
        } else if (anyItemReturned) {
            order.orderStatus = 'Partially Returned';
        } else {
            // If no items are requested or returned anymore (e.g. all rejected), set back to Delivered
            order.orderStatus = 'Delivered';
        }

        await order.save();
        res.json({ success: true, message: `Item return status updated to ${status}.` });

    } catch (error) {
        console.error('Error updating item return status:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
