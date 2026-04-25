import Coupon from '../models/coupon/coupon.js';

/**
 * Recalculates order subtotal, tax, discount, and total amount.
 * Handles proportional discount distribution for individual items.
 * 
 * @param {Object} order - The mongoose order document
 */
export const recalculateOrderTotals = async (order) => {
    // Only count items that are NOT Cancelled or Returned
    const activeItems = order.items.filter(item => !['Cancelled', 'Returned'].includes(item.status));
    
    const subtotal = activeItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    order.subtotal = subtotal;
    
    // Tax is 18% of active subtotal (consistent with checkoutService)
    const tax = Math.floor(subtotal * 0.18);
    order.tax = tax;
    
    // Shipping remains fixed once order is placed, unless all items are gone
    if (subtotal === 0) {
        order.shippingFee = 0;
    }
    
    // Recalculate discount if a coupon was used
    if (order.couponCode) {
        try {
            const coupon = await Coupon.findOne({ code: order.couponCode.trim().toUpperCase() });
            if (coupon) {
                // Note: We don't re-validate minAmount here because the coupon was already valid at checkout.
                // Re-validating might revoke a coupon the user was entitled to for the remaining items.
                // However, we apply the discount logic based on the NEW subtotal.
                
                if (coupon.discountType === 'percentage') {
                    let discount = Math.floor(subtotal * (coupon.discountValue / 100));
                    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                        discount = coupon.maxDiscount;
                    }
                    order.discount = discount;
                } else {
                    // Fixed discount remains the same unless it exceeds the new subtotal
                    order.discount = Math.min(coupon.discountValue, subtotal + tax);
                }
            } else {
                // If coupon not found in DB (shouldn't happen), keep existing discount proportional to subtotal
                // or just leave it. For safety, let's not reset it if coupon is missing.
            }
        } catch (error) {
            console.error('Error fetching coupon during recalculation:', error);
        }
    } else {
        order.discount = 0;
    }
    
    order.totalAmount = Math.max(0, order.subtotal + order.tax + order.shippingFee - order.discount);
};

/**
 * Calculates the proportional discount for a single item based on the user's formula.
 * Formula: Product Discount = (Item Subtotal / Order Subtotal) * Total Coupon Discount
 * 
 * @param {Object} item - The order item
 * @param {Number} orderSubtotal - The total subtotal of the order WHEN the item was active
 * @param {Number} totalDiscount - The total discount applied to the order WHEN the item was active
 * @returns {Number}
 */
export const calculateItemDiscount = (item, orderSubtotal, totalDiscount) => {
    if (!orderSubtotal || !totalDiscount) return 0;
    const itemSubtotal = item.price * item.qty;
    return Math.floor((itemSubtotal / orderSubtotal) * totalDiscount);
};

/**
 * Calculates the refund amount for an item being cancelled or returned.
 * Refund = (Item Subtotal + Item Tax) - Item Proportional Discount
 * 
 * @param {Object} item - The order item
 * @param {Number} orderSubtotal - The total subtotal of the order
 * @param {Number} totalDiscount - The total discount of the order
 * @returns {Number}
 */
export const calculateItemRefund = (item, orderSubtotal, totalDiscount) => {
    const itemSubtotal = item.price * item.qty;
    const itemTax = Math.floor(itemSubtotal * 0.18);
    const itemDiscount = calculateItemDiscount(item, orderSubtotal, totalDiscount);
    
    return (itemSubtotal + itemTax) - itemDiscount;
};
