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
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature 
        } = body;
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Missing payment verification parameters' 
                })
            };
        }
        
        // Generate expected signature
        const bodyString = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(bodyString)
            .digest('hex');
        
        // Verify signature
        const isAuthentic = expectedSignature === razorpay_signature;
        
        if (isAuthentic) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Payment verified successfully'
                })
            };
        } else {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Payment verification failed'
                })
            };
        }
        
    } catch (error) {
        console.error('Error verifying payment:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: error.message || 'Failed to verify payment'
            })
        };
    }
};