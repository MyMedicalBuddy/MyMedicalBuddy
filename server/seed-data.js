const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

async function seedDatabase() {
  const dbPath = path.join(__dirname, 'database.xlsx');
  
  // Create sample data
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = [
    {
      id: uuidv4(),
      name: 'John Patient',
      email: 'patient@example.com',
      password: hashedPassword,
      role: 'user',
      country: 'USA',
      language: 'English',
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Dr. Sarah Wilson',
      email: 'doctor@example.com',
      password: hashedPassword,
      role: 'doctor',
      country: 'USA',
      language: 'English',
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      country: 'USA',
      language: 'English',
      verified: true,
      createdAt: new Date().toISOString()
    }
  ];

  const doctors = [
    {
      id: users[1].id,
      name: 'Dr. Sarah Wilson',
      email: 'doctor@example.com',
      password: hashedPassword,
      specialization: 'Cardiology',
      license: 'MD123456',
      verified: true,
      availability: 'online',
      createdAt: new Date().toISOString()
    }
  ];

  const cases = [
    {
      id: uuidv4(),
      userId: users[0].id,
      title: 'Chest Pain Evaluation',
      description: 'Experiencing intermittent chest pain for the past week. Pain is sharp and occurs mainly during physical activity.',
      existingDiagnosis: 'Possible angina - referred by primary care physician',
      questions: 'Is this serious? Do I need immediate treatment? What tests should I get?',
      preferredLanguage: 'English',
      status: 'submitted',
      documents: '[]',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const messages = [];

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Add sheets
  const usersWS = XLSX.utils.json_to_sheet(users);
  XLSX.utils.book_append_sheet(wb, usersWS, 'Users');
  
  const doctorsWS = XLSX.utils.json_to_sheet(doctors);
  XLSX.utils.book_append_sheet(wb, doctorsWS, 'Doctors');
  
  const casesWS = XLSX.utils.json_to_sheet(cases);
  XLSX.utils.book_append_sheet(wb, casesWS, 'Cases');
  
  const messagesWS = XLSX.utils.json_to_sheet(messages);
  XLSX.utils.book_append_sheet(wb, messagesWS, 'Messages');
  
  // Write file
  XLSX.writeFile(wb, dbPath);
  
  console.log('Sample data created successfully!');
  console.log('\nSample Login Credentials:');
  console.log('Patient: patient@example.com / password123');
  console.log('Doctor: doctor@example.com / password123');
  console.log('Admin: admin@example.com / password123');
}

if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };