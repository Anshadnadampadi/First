import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

const run = () => {
    const templatePath = path.resolve('views/user/account/order-details.ejs');
    const template = fs.readFileSync(templatePath, 'utf8');

    const mockOrder = {
        _id: '6a0bf4d3d86118a0a9c7b69b',
        orderId: 'ORD-734CB602',
        createdAt: new Date(),
        updatedAt: new Date(),
        orderStatus: 'Confirmed',
        paymentStatus: 'Paid',
        paymentMethod: 'ONLINE PAYMENT',
        totalAmount: 108572,
        subtotal: 100000,
        tax: 18000,
        shippingFee: 0,
        discount: 0,
        shippingAddress: {
            fullName: 'MOHAMMAD ANSHAD N',
            streetAddress: 'NELLIKKAD',
            city: 'TIRUR',
            state: 'KERALA',
            pinCode: '676103',
            phone: '9846890488'
        },
        items: [
            {
                _id: '6a0bf4d3d86118a0a9c7b69c',
                productName: 'TEST',
                price: 15456,
                qty: 1,
                status: 'Ordered',
                variant: { color: 'pink', storage: '512', ram: '16' }
            }
        ]
    };

    console.log("Compiling order-details.ejs with filename option...");
    try {
        const html = ejs.render(template, {
            order: mockOrder,
            razorpayKeyId: 'rzp_test_mock',
            contentFor: (blockName) => ''
        }, {
            filename: templatePath
        });
        console.log("Compilation successful!");
    } catch (err) {
        console.error("EJS Compilation Error:", err);
    }
};

run();
