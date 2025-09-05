const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'eu-north-1' });
const JWT_SECRET = process.env.JWT_SECRET || 'medical-secret-2024';

exports.handler = async (event) => {
  const path = event.rawPath || event.path || '';
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const body = event.body ? JSON.parse(event.body) : {};
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
    'Content-Type': 'application/json'
  };

  try {

    // Health check
    if (path === '/api/health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() })
      };
    }

    // Register
    if (path === '/api/register' && method === 'POST') {
      const { name, email, password, role = 'user', country } = body;
      
      // Check if user exists
      const existing = await dynamodb.query({
        TableName: 'Users',
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email }
      }).promise();
      
      if (existing.Items && existing.Items.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User already exists' })
        };
      }

      // Create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        id: uuidv4(),
        name,
        email,
        password: hashedPassword,
        role,
        country,
        verified: false,
        createdAt: new Date().toISOString()
      };

      await dynamodb.put({
        TableName: 'Users',
        Item: user
      }).promise();

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'User registered successfully',
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        })
      };
    }

    // Login
    if (path === '/api/login' && method === 'POST') {
      const { email, password } = body;
      
      const result = await dynamodb.query({
        TableName: 'Users',
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email }
      }).promise();
      
      const user = result.Items && result.Items.length > 0 ? result.Items[0] : null;
      if (!user || !await bcrypt.compare(password, user.password)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Login successful',
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};