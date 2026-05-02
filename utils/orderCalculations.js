import Coupon from '../models/coupon/coupon.js';

/**
 * Recalculates order subtotal, tax, discount, and total amount.
 * Handles proportional discount distribution for individual items.
 * 
 * @param {Object} order - The mongoose order document
 */
export const recalculateOrderTotals = async (order) => {
    // Only count items that are NOT Cancelled or Returned
    const activeItems = order.items.filter(item => !['Cancelled', 'Returned', 'Return Requested', 'Return Approved', 'Return Picked'].includes(item.status));
    
    const subtotal = activeItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    order.subtotal = subtotal;
    
    // Recalculate discount if a coupon was used
    let discount = 0;
    if (order.couponCode) {
        try {
            const coupon = await Coupon.findOne({ code: order.couponCode.trim().toUpperCase() });
            if (coupon && subtotal >= coupon.minAmount) {
                if (coupon.discountType === 'percentage') {
                    discount = Math.floor(subtotal * (coupon.discountValue / 100));
                    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                        discount = coupon.maxDiscount;
                    }
                } else {
                    discount = Math.min(coupon.discountValue, subtotal);
                }
            } else {
                // If subtotal is now less than minAmount, the coupon is no longer valid
                order.couponCode = null;
            }
        } catch (error) {
            console.error('Error fetching coupon during recalculation:', error);
        }
    }
    
    order.discount = discount;

    // Tax is 18% of active subtotal AFTER discount (Net Taxable Value)
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.floor(taxableAmount * 0.18);
    order.tax = tax;
    
    // Shipping remains fixed once order is placed, unless all items are gone
    if (subtotal === 0) {
        order.shippingFee = 0;
    }
    
    order.totalAmount = Math.max(0, subtotal + order.tax + (order.shippingFee || 0) - discount);
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
