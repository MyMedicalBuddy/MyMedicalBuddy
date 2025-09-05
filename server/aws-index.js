const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const AWSDB = require('./aws-db');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'medical_buddy_secret_2024';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

const db = new AWSDB();

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user', country, language } = req.body;
    
    const existingUser = await db.findRecord('users', { email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await db.addRecord('users', {
      name,
      email,
      password: hashedPassword,
      role,
      country,
      language,
      verified: false
    });

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
    
    const user = await db.findRecord('users', { email });
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

// Cases
app.get('/api/cases', authenticateToken, async (req, res) => {
  try {
    const cases = await db.findRecords('cases', { userId: req.user.id });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cases', authenticateToken, async (req, res) => {
  try {
    const { title, description, existingDiagnosis, questions, preferredLanguage } = req.body;

    const medicalCase = await db.addRecord('cases', {
      userId: req.user.id,
      title,
      description,
      existingDiagnosis,
      questions,
      preferredLanguage,
      status: 'submitted',
      documents: '[]'
    });

    res.status(201).json({
      message: 'Case submitted successfully',
      case: medicalCase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await db.findRecords('users');
    const cases = await db.findRecords('cases');

    const stats = {
      totalUsers: users.filter(u => u.role === 'user').length,
      totalDoctors: users.filter(u => u.role === 'doctor').length,
      totalCases: cases.length,
      activeCases: cases.filter(c => c.status === 'under_review').length,
      completedCases: cases.filter(c => c.status === 'opinion_ready').length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await db.findRecords('users');
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified: user.verified,
      createdAt: user.createdAt
    }));

    res.json(sanitizedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/reset-password', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const user = await db.findRecord('users', { email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updatedUser = await db.updateRecord('users', user.id, {
      password: hashedPassword
    });

    res.json({ 
      message: 'Password reset successfully',
      user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports.handler = serverless(app);