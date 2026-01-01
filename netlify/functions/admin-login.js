const jwt = require('jsonwebtoken');

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
        const { username, password } = JSON.parse(event.body);
        
        // Validate credentials
        const validUsername = process.env.ADMIN_USERNAME || 'admin';
        const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        if (username !== validUsername || password !== validPassword) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid username or password'
                })
            };
        }
        
        // Create JWT token
        const token = jwt.sign(
            { 
                username: username,
                role: 'admin',
                timestamp: new Date().toISOString()
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `admin_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`
            },
            body: JSON.stringify({
                success: true,
                message: 'Login successful',
                user: {
                    username: username,
                    role: 'admin'
                }
            })
        };
        
    } catch (error) {
        console.error('Error during admin login:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: error.message || 'Login failed'
            })
        };
    }
};