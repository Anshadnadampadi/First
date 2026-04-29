import * as cartService from '../services/user/cartService.js';
import Cart from '../models/cart/Cart.js';
import Product from '../models/product/Product.js';
import Offer from '../models/offer/offer.js';
import mongoose from 'mongoose';

// Mocking some parts for testing the logic specifically
async function test() {
    console.log("Starting verification...");

    // Scenario: qty is 5, stock is 2, user wants to decrease (change = -1)
    const itemId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    
    // Mock Offer.find to return empty array (no offers)
    const originalOfferFind = Offer.find;
    Offer.find = async () => [];

    // Mock Cart.findOne to return a fake cart
    const originalCartFindOne = Cart.findOne;
    Cart.findOne = () => ({
        populate: function() { return this; },
        items: {
            id: (id) => ({
                _id: itemId,
                qty: 5,
                product: {
                    _id: productId,
                    stock: 2,
                    price: 100,
                    variants: [],
                    toObject: function() { return this; }
                },
                price: 100
            }),
            some: () => false // for post-update issues check
        },
        save: async function() { console.log("Cart saved successfully"); return true; },
        subtotal: 500
    });

    try {
        console.log("Test Case: Decrease quantity when already above stock (qty: 5, stock: 2, change: -1)");
        const result = await cartService.updateItemQty('user123', { itemId: itemId.toString(), change: -1 });
        console.log("Result:", result);
        if (result.newQty === 4) {
             console.log("SUCCESS: Quantity decreased to", result.newQty);
        } else {
             console.log("FAILURE: Quantity is", result.newQty, "expected 4");
        }
    } catch (err) {
        console.error("FAILURE: Error thrown during decrease:", err.message);
        console.error(err.stack);
    }

    try {
        console.log("\nTest Case: Increase quantity when at or above stock (qty: 5, stock: 2, change: 1)");
        // Update mock qty to 5 for next test
        // (Wait, the previous test might have modified the object if it wasn't a clone, but here we return a new mock)
        await cartService.updateItemQty('user123', { itemId: itemId.toString(), change: 1 });
        console.log("FAILURE: Expected error not thrown during increase");
    } catch (err) {
        console.log("SUCCESS: Correctly threw error during increase:", err.message);
    }

    // Restore original findOne
    Cart.findOne = originalCartFindOne;
    Offer.find = originalOfferFind;
}

test();
