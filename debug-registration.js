// Simple test to debug registration
const testRegistration = async () => {
  // Replace with your actual API URL from Amplify logs
  const API_URL = 'https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/prod';
  
  try {
    console.log('Testing health endpoint...');
    const healthResponse = await fetch(`${API_URL}/api/health`);
    console.log('Health status:', healthResponse.status);
    console.log('Health response:', await healthResponse.text());
    
    console.log('\nTesting registration...');
    const registerResponse = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
        country: 'USA'
      })
    });
    
    console.log('Registration status:', registerResponse.status);
    console.log('Registration response:', await registerResponse.text());
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run in browser console or Node.js
testRegistration();