const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'medical_buddy_secret_2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

// Excel Database Helper Functions
class ExcelDB {
  constructor() {
    this.dbPath = path.join(__dirname, 'database.xlsx');
    this.initializeDB();
  }

  initializeDB() {
    if (!fs.existsSync(this.dbPath)) {
      const wb = XLSX.utils.book_new();
      
      // Users sheet
      const usersData = [['id', 'name', 'email', 'password', 'role', 'country', 'language', 'verified', 'createdAt']];
      const usersWS = XLSX.utils.aoa_to_sheet(usersData);
      XLSX.utils.book_append_sheet(wb, usersWS, 'Users');
      
      // Cases sheet
      const casesData = [['id', 'userId', 'doctorId', 'title', 'description', 'status', 'documents', 'opinion', 'createdAt', 'updatedAt']];
      const casesWS = XLSX.utils.aoa_to_sheet(casesData);
      XLSX.utils.book_append_sheet(wb, casesWS, 'Cases');
      
      // Doctors sheet
      const doctorsData = [['id', 'name', 'email', 'password', 'specialization', 'license', 'verified', 'availability', 'createdAt']];
      const doctorsWS = XLSX.utils.aoa_to_sheet(doctorsData);
      XLSX.utils.book_append_sheet(wb, doctorsWS, 'Doctors');
      
      // Messages sheet
      const messagesData = [['id', 'caseId', 'senderId', 'senderType', 'message', 'timestamp']];
      const messagesWS = XLSX.utils.aoa_to_sheet(messagesData);
      XLSX.utils.book_append_sheet(wb, messagesWS, 'Messages');
      
      XLSX.writeFile(wb, this.dbPath);
    }
  }

  readSheet(sheetName) {
    const wb = XLSX.readFile(this.dbPath);
    const ws = wb.Sheets[sheetName];
    return ws ? XLSX.utils.sheet_to_json(ws) : [];
  }

  writeSheet(sheetName, data) {
    const wb = XLSX.readFile(this.dbPath);
    const ws = XLSX.utils.json_to_sheet(data);
    wb.Sheets[sheetName] = ws;
    XLSX.writeFile(wb, this.dbPath);
  }

  addRecord(sheetName, record) {
    const data = this.readSheet(sheetName);
    record.id = uuidv4();
    data.push(record);
    this.writeSheet(sheetName, data);
    return record;
  }

  updateRecord(sheetName, id, updates) {
    const data = this.readSheet(sheetName);
    const index = data.findIndex(record => record.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates };
      this.writeSheet(sheetName, data);
      return data[index];
    }
    return null;
  }

  findRecord(sheetName, criteria) {
    const data = this.readSheet(sheetName);
    return data.find(record => {
      return Object.keys(criteria).every(key => record[key] === criteria[key]);
    });
  }

  findRecords(sheetName, criteria = {}) {
    const data = this.readSheet(sheetName);
    if (Object.keys(criteria).length === 0) return data;
    
    return data.filter(record => {
      return Object.keys(criteria).every(key => record[key] === criteria[key]);
    });
  }
}

const db = new ExcelDB();

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

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user', country, language } = req.body;
    
    // Check if user exists
    const existingUser = db.findRecord('Users', { email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = db.addRecord('Users', {
      name,
      email,
      password: hashedPassword,
      role,
      country,
      language,
      verified: false,
      createdAt: new Date().toISOString()
    });

    // Generate token
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

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = db.findRecord('Users', { email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
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

// Submit Medical Case
app.post('/api/cases', authenticateToken, upload.array('documents', 5), (req, res) => {
  try {
    const { title, description, existingDiagnosis, questions, preferredLanguage } = req.body;
    
    const documents = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path
    })) : [];

    const medicalCase = db.addRecord('Cases', {
      userId: req.user.id,
      title,
      description,
      existingDiagnosis,
      questions,
      preferredLanguage,
      status: 'submitted',
      documents: JSON.stringify(documents),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Case submitted successfully',
      case: medicalCase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Cases
app.get('/api/cases', authenticateToken, (req, res) => {
  try {
    const cases = db.findRecords('Cases', { userId: req.user.id });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Case Details
app.get('/api/cases/:id', authenticateToken, (req, res) => {
  try {
    const caseData = db.findRecord('Cases', { id: req.params.id });
    
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check if user owns the case or is a doctor/admin
    if (caseData.userId !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(caseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Doctor Routes

// Get Available Cases (for doctors)
app.get('/api/doctor/cases', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const cases = db.findRecords('Cases', { status: 'submitted' });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept Case (for doctors)
app.post('/api/doctor/cases/:id/accept', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedCase = db.updateRecord('Cases', req.params.id, {
      doctorId: req.user.id,
      status: 'under_review',
      updatedAt: new Date().toISOString()
    });

    if (!updatedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ message: 'Case accepted successfully', case: updatedCase });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit Opinion (for doctors)
app.post('/api/doctor/cases/:id/opinion', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { opinion } = req.body;
    
    const updatedCase = db.updateRecord('Cases', req.params.id, {
      opinion,
      status: 'opinion_ready',
      updatedAt: new Date().toISOString()
    });

    if (!updatedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ message: 'Opinion submitted successfully', case: updatedCase });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Doctor's Assigned Cases
app.get('/api/doctor/my-cases', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const cases = db.findRecords('Cases', { doctorId: req.user.id });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Messages
app.post('/api/cases/:id/messages', authenticateToken, (req, res) => {
  try {
    const { message } = req.body;
    
    const newMessage = db.addRecord('Messages', {
      caseId: req.params.id,
      senderId: req.user.id,
      senderType: req.user.role,
      message,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cases/:id/messages', authenticateToken, (req, res) => {
  try {
    const messages = db.findRecords('Messages', { caseId: req.params.id });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes
app.get('/api/admin/stats', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = db.readSheet('Users');
    const cases = db.readSheet('Cases');
    const doctors = db.readSheet('Doctors');

    const stats = {
      totalUsers: users.filter(u => u.role === 'user').length,
      totalDoctors: doctors.length,
      totalCases: cases.length,
      activeCases: cases.filter(c => c.status === 'under_review').length,
      completedCases: cases.filter(c => c.status === 'opinion_ready').length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Reset User Password
app.post('/api/admin/reset-password', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    // Find user
    const user = db.findRecord('Users', { email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    const updatedUser = db.updateRecord('Users', user.id, {
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });

    res.json({ 
      message: 'Password reset successfully',
      user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Get All Users
app.get('/api/admin/users', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = db.readSheet('Users').map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified: user.verified,
      createdAt: user.createdAt
    }));

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});