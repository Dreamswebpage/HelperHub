const Razorpay = require('razorpay');
const crypto = require('crypto');

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        // Parse request body
        const body = JSON.parse(event.body);
        const { amount, currency = 'INR', receipt, notes = {} } = body;
        
        if (!amount) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Amount is required' })
            };
        }
        
        // Initialize Razorpay with environment variables
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        
        // Create order
        const order = await razorpay.orders.create({
            amount: Math.round(amount), // Amount in paise
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: notes,
            payment_capture: 1 // Auto capture payment
        });
        
        // Return order details
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                order: order,
                key: process.env.RAZORPAY_KEY_ID
            })
        };
        
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: error.message || 'Failed to create order'
            })
        };
    }
};