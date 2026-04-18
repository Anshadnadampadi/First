import * as cartService from "../../services/user/cartService.js";
import User from "../../models/user/User.js";
import Order from "../../models/order/order.js";
import { placeOrderService } from "../../services/user/checkoutService.js";

export const getCheckout = async (req, res) => {
    try {
        if (!req.session.user) return res.redirect("/auth/login");

        const cart = await cartService.getCartData(req.session.user);
        if (!cart || cart.items.length === 0) {
            return res.redirect("/cart?msg=Your cart is empty&icon=warning");
        }

        const hasIssues = cart.items.some(i => i.isOutOfStock || i.insufficientStock || i.isUnavailable);
        if (hasIssues) {
            return res.redirect("/cart?msg=Some items in your cart are no longer available.&icon=error");
        }

        const user = await User.findById(req.session.user).populate("addresses").lean();

        res.render("user/checkout", {
            title: "Checkout",
            cart, user,
            addresses: user.addresses || [],
            breadcrumbs: [
                { label: 'Shop', url: '/products' },
                { label: 'Cart', url: '/cart' },
                { label: 'Checkout', url: '/checkout' }
            ]
        });
    } catch (error) {
        console.error("Checkout Error:", error);
        res.status(500).render("errors/error", { message: "Failed to load checkout page" });
    }
};

export const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const result = await placeOrderService(userId, req.body);

        if (!result.success) {
            if (result.terminate && req.session) {
                req.session.destroy();
                res.clearCookie('connect.sid');
            }
            return res.status(result.status || 400).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const verifyPayment = async (req, res) => {
    res.json({ success: true });
};

export const getOrderSuccess = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findOne({ orderId, user: req.session.user });

        if (!order) return res.redirect('/');

        res.render('user/orderSuccess', {
            title: 'Order Confirmation',
            order
        });
    } catch (error) {
        console.error('Error fetching order success:', error);
        res.redirect('/');
    }
};
