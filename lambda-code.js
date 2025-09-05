exports.handler = async (event) => {
    const path = event.path || event.rawPath || '';
    const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
    
    // Health endpoint
    if (path === '/api/health' && method === 'GET') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'OK',
                timestamp: new Date().toISOString(),
                message: 'Medical Opinion Platform API is running'
            })
        };
    }
    
    // Default response
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'Medical Opinion Platform API',
            path: path,
            method: method
        })
    };
};