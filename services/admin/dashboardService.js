import Order from '../../models/order/order.js';
import User from '../../models/user/User.js';
import Product from '../../models/product/product.js';
import Category from '../../models/category/category.js';

/**
 * Fetch stats and recent records for the Admin Dashboard
 */
export const getAdminDashboardStats = async () => {
    const activeStatuses = [
        'Pending', 'Delivered', 'Shipped', 'Processing', 'Confirmed', 
        'Return Requested', 'Return Approved', 'Return Picked', 'Partially Returned'
    ];

    const [
        ordersStats, 
        totalCustomers, 
        topProducts, 
        topCategories, 
        topBrands, 
        orderStatusStats, 
        inventoryStats, 
        recentOrders
    ] = await Promise.all([
        // Orders overall revenue & count
        Order.aggregate([
            { $match: { orderStatus: { $in: activeStatuses } } },
            { 
                $group: { 
                    _id: null, 
                    totalRevenue: { $sum: "$totalAmount" },
                    totalOrders: { $sum: 1 }
                } 
            }
        ]),
        
        // Customers Count
        User.countDocuments({ isAdmin: false }),
        
        // Top 10 Best Selling Products with images
        Order.aggregate([
            { $match: { orderStatus: { $in: activeStatuses } } },
            { $unwind: "$items" },
            { $group: { _id: "$items.product", totalSold: { $sum: "$items.qty" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            { 
                $project: { 
                    name: "$productInfo.name", 
                    image: { $arrayElemAt: ["$productInfo.images", 0] },
                    totalSold: 1 
                } 
            }
        ]),
        
        // Top 10 Best Selling Categories
        Order.aggregate([
            { $match: { orderStatus: { $in: activeStatuses } } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            { $group: { _id: "$productInfo.category", totalSold: { $sum: "$items.qty" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryInfo"
                }
            },
            { $unwind: "$categoryInfo" },
            { $project: { name: "$categoryInfo.name", totalSold: 1 } }
        ]),
        
        // Top 10 Best Selling Brands
        Order.aggregate([
            { $match: { orderStatus: { $in: activeStatuses } } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            { $group: { _id: "$productInfo.brand", totalSold: { $sum: "$items.qty" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            { $project: { name: "$_id", totalSold: 1 } }
        ]),
        
        // Order Status Distribution
        Order.aggregate([
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
        ]),
        
        // Inventory Alerts
        Product.aggregate([
            { $unwind: "$variants" },
            { $match: { "variants.isDeleted": false } },
            {
                $group: {
                    _id: null,
                    outOfStock: { $sum: { $cond: [{ $eq: ["$variants.stock", 0] }, 1, 0] } },
                    lowStock: { $sum: { $cond: [{ $and: [{ $gt: ["$variants.stock", 0] }, { $lt: ["$variants.stock", 5] }] }, 1, 0] } }
                }
            }
        ]),
        
        // Recent Orders
        Order.find({})
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(10)
    ]);

    const totalRevenue = ordersStats.length > 0 ? ordersStats[0].totalRevenue : 0;
    const totalOrders = ordersStats.length > 0 ? ordersStats[0].totalOrders : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Process status stats
    const statusMap = {
        Delivered: 0,
        Pending: 0,
        Cancelled: 0,
        Returned: 0
    };

    orderStatusStats.forEach(s => {
        if (s._id === 'Delivered') statusMap.Delivered += s.count;
        else if (['Pending', 'Confirmed', 'Processing', 'Shipped'].includes(s._id)) statusMap.Pending += s.count;
        else if (s._id === 'Cancelled') statusMap.Cancelled += s.count;
        else if (['Returned', 'Partially Returned', 'Return Approved'].includes(s._id)) statusMap.Returned += s.count;
    });

    const stats = {
        revenue: { total: totalRevenue },
        orders: { total: totalOrders },
        customers: { total: totalCustomers },
        aov: avgOrderValue,
        topProducts,
        topCategories,
        topBrands,
        orderStatus: statusMap,
        inventory: inventoryStats.length > 0 ? inventoryStats[0] : { outOfStock: 0, lowStock: 0 },
        recentOrders,
        recentActivity: [
            { title: 'New Order #8829', time: '2 mins ago', desc: 'Iphone 15 Pro Max - ₹1,44,900' },
            { title: 'Customer Signup', time: '15 mins ago', desc: 'New user joined: sarath@example.com' },
            { title: 'Stock Alert', time: '1 hour ago', desc: 'Samsung Galaxy S24 Ultra low on stock' },
            { title: 'Refund Processed', time: '3 hours ago', desc: 'Order #8812 - ₹65,200 returned' }
        ]
    };

    return stats;
};

/**
 * Fetch sales chart metrics for a given filter range
 */
export const getDashboardChartData = async ({ filter = 'monthly', startDate, endDate }) => {
    let labels = [];
    let data = [];

    const activeStatuses = [
        'Pending', 'Delivered', 'Shipped', 'Processing', 'Confirmed', 
        'Return Requested', 'Return Approved', 'Return Picked', 'Partially Returned'
    ];

    if (filter === 'yearly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        const monthlyData = await Order.aggregate([
            { $match: { orderStatus: { $in: activeStatuses }, createdAt: { $gte: new Date(currentYear, 0, 1) } } },
            { $group: { _id: { $month: { date: "$createdAt", timezone: "+05:30" } }, total: { $sum: "$totalAmount" } } },
            { $sort: { "_id": 1 } }
        ]);
        labels = months;
        data = new Array(12).fill(0);
        monthlyData.forEach(d => { data[d._id - 1] = d.total; });
    } else if (filter === 'monthly') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const monthlyData = await Order.aggregate([
            { $match: { orderStatus: { $in: activeStatuses }, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: { $dayOfMonth: { date: "$createdAt", timezone: "+05:30" } }, total: { $sum: "$totalAmount" } } },
            { $sort: { "_id": 1 } }
        ]);
        labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
        data = new Array(daysInMonth).fill(0);
        monthlyData.forEach(d => { data[d._id - 1] = d.total; });
    } else if (filter === 'weekly' || filter === '30days') {
        const daysCount = filter === 'weekly' ? 7 : 30;
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        const start = new Date(now);
        start.setDate(now.getDate() - (daysCount - 1));
        start.setHours(0, 0, 0, 0);

        const dbData = await Order.aggregate([
            { $match: { orderStatus: { $in: activeStatuses }, createdAt: { $gte: start, $lte: now } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } }, total: { $sum: "$totalAmount" } } },
            { $sort: { "_id": 1 } }
        ]);

        for (let i = 0; i < daysCount; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            const found = dbData.find(item => item._id === dateStr);
            data.push(found ? found.total : 0);
        }
    } else if (filter === 'daily') {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffset);
        istNow.setUTCHours(0, 0, 0, 0);
        const startOfDay = new Date(istNow.getTime() - istOffset);

        const dailyData = await Order.aggregate([
            { $match: { orderStatus: { $in: activeStatuses }, createdAt: { $gte: startOfDay } } },
            { $group: { _id: { $hour: { date: "$createdAt", timezone: "+05:30" } }, total: { $sum: "$totalAmount" } } },
            { $sort: { "_id": 1 } }
        ]);
        labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        data = new Array(24).fill(0);
        dailyData.forEach(d => { data[d._id] = d.total; });
    } else if (filter === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const customData = await Order.aggregate([
            { $match: { orderStatus: { $in: activeStatuses }, createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } }, total: { $sum: "$totalAmount" } } },
            { $sort: { "_id": 1 } }
        ]);

        for (let i = 0; i <= diffDays; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(dateStr);
            const found = customData.find(item => item._id === dateStr);
            data.push(found ? found.total : 0);
        }
    } else { // 30 days default fallback
        const daysCount = 30;
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - (daysCount - 1));
        start.setHours(0,0,0,0);

        const dbData = await Order.aggregate([
            { $match: { orderStatus: { $in: activeStatuses }, createdAt: { $gte: start } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } }, total: { $sum: "$totalAmount" } } }
        ]);

        for (let i = 0; i < daysCount; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            const found = dbData.find(item => item._id === dateStr);
            data.push(found ? found.total : 0);
        }
    }

    return { labels, data };
};
