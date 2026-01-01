// This function would typically save to a database
// For this demo, we'll simulate saving and return success

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
        const orderData = JSON.parse(event.body);
        
        // Validate required fields
        if (!orderData.orderId || !orderData.name || !orderData.email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Missing required order fields' 
                })
            };
        }
        
        // In a real application, you would:
        // 1. Save to a database (MongoDB, PostgreSQL, etc.)
        // 2. Send confirmation email
        // 3. Update inventory or service queues
        // 4. Log the transaction
        
        // For this demo, we'll just log and return success
        console.log('Order saved:', {
            orderId: orderData.orderId,
            customer: orderData.name,
            email: orderData.email,
            service: orderData.service,
            amount: orderData.price,
            status: orderData.status || 'pending',
            timestamp: new Date().toISOString()
        });
        
        // Simulate sending confirmation email
        if (orderData.email) {
            console.log(`Confirmation email sent to: ${orderData.email}`);
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: 'Order saved successfully',
                orderId: orderData.orderId,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('Error saving order:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: error.message || 'Failed to save order'
            })
        };
    }
};