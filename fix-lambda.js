const AWS = require('aws-sdk');

const lambda = new AWS.Lambda({ region: 'eu-north-1' });

const functionCode = `
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
const JWT_SECRET = 'medical-buddy-secret-key-2024';
const dynamodb = new AWS.DynamoDB.DocumentClient();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    
    const existingUser = await dynamodb.query({
      TableName: 'Users',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    }).promise();
    
    if (existingUser.Items && existingUser.Items.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role,
      verified: false,
      createdAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: 'Users',
      Item: user
    }).promise();

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await dynamodb.query({
      TableName: 'Users',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    }).promise();
    
    const user = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await dynamodb.scan({ TableName: 'Users' }).promise();
    const cases = await dynamodb.scan({ TableName: 'Cases' }).promise();

    const stats = {
      totalUsers: users.Items.filter(u => u.role === 'user').length,
      totalDoctors: users.Items.filter(u => u.role === 'doctor').length,
      totalCases: cases.Items.length,
      activeCases: cases.Items.filter(c => c.status === 'under_review').length,
      completedCases: cases.Items.filter(c => c.status === 'opinion_ready').length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports.handler = serverless(app);
`;

// Update Lambda function code directly
const params = {
  FunctionName: 'medical-opinion-platform-api',
  ZipFile: Buffer.from(functionCode)
};

lambda.updateFunctionCode(params, (err, data) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Lambda function updated successfully');
  }
});