// Razorpay configuration
module.exports = {
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
    
    // Test mode configuration
    test: {
        key_id: 'rzp_test_XXXXXXXXXXXXXX',
        key_secret: 'XXXXXXXXXXXXXX'
    },
    
    // Production mode configuration
    production: {
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    },
    
    // Get configuration based on environment
    getConfig: function() {
        const env = process.env.NODE_ENV || 'development';
        return this[env] || this.test;
    },
    
    // Validate webhook signature
    validateWebhookSignature: function(body, signature) {
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', this.getConfig().key_secret)
            .update(JSON.stringify(body))
            .digest('hex');
        
        return expectedSignature === signature;
    }
};