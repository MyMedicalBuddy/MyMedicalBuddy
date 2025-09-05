import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || window.location.origin.includes('amplifyapp.com') 
  ? 'https://w7s9y8blei.execute-api.eu-north-1.amazonaws.com/dev|g'
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post('/register', userData);
    return response.data;
  },
};

export const caseService = {
  submitCase: async (caseData: FormData) => {
    const response = await api.post('/cases', caseData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getCases: async () => {
    const response = await api.get('/cases');
    return response.data;
  },

  getCase: async (id: string) => {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },

  getCaseMessages: async (id: string) => {
    const response = await api.get(`/cases/${id}/messages`);
    return response.data;
  },

  sendMessage: async (caseId: string, message: string) => {
    const response = await api.post(`/cases/${caseId}/messages`, { message });
    return response.data;
  },
};

export const doctorService = {
  getAvailableCases: async () => {
    const response = await api.get('/doctor/cases');
    return response.data;
  },

  getMyCases: async () => {
    const response = await api.get('/doctor/my-cases');
    return response.data;
  },

  acceptCase: async (caseId: string) => {
    const response = await api.post(`/doctor/cases/${caseId}/accept`);
    return response.data;
  },

  submitOpinion: async (caseId: string, opinion: string) => {
    const response = await api.post(`/doctor/cases/${caseId}/opinion`, { opinion });
    return response.data;
  },
};

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  resetPassword: async (email: string, newPassword: string) => {
    const response = await api.post('/admin/reset-password', { email, newPassword });
    return response.data;
  },
};