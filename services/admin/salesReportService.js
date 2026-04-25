import Order from '../../models/order/order.js';

export const getSalesReportService = async (filter, startDate, endDate) => {
    let matchCondition = { orderStatus: 'Delivered' }; // Sales usually count delivered orders

    const now = new Date();
    let start, end;

    if (filter === 'daily') {
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
    } else if (filter === 'weekly') {
        const firstDay = now.getDate() - now.getDay();
        start = new Date(now.setDate(firstDay));
        start.setHours(0, 0, 0, 0);
        end = new Date();
    } else if (filter === 'yearly') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (filter === 'custom' && startDate && endDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    }

    if (start && end) {
        matchCondition.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(matchCondition)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 });

    const stats = await Order.aggregate([
        { $match: matchCondition },
        {
            $group: {
                _id: null,
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" },
                totalDiscount: { $sum: "$discount" }
            }
        }
    ]);

    const reportStats = stats.length > 0 ? stats[0] : { totalSales: 0, totalRevenue: 0, totalDiscount: 0 };

    return {
        orders,
        stats: reportStats,
        period: { start, end }
    };
};
