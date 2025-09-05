import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Paper,
} from '@mui/material';
import {
  MedicalServices,
  Security,
  Speed,
  LocalHospital,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MedicalServices sx={{ fontSize: 40, color: '#2E7D32' }} />,
      title: 'Expert Medical Opinions',
      description: 'Get second opinions from qualified medical professionals worldwide'
    },
    {
      icon: <Security sx={{ fontSize: 40, color: '#1565C0' }} />,
      title: 'Secure & Confidential',
      description: 'Your medical data is protected with enterprise-grade security'
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: '#E65100' }} />,
      title: 'Fast Response',
      description: 'Receive professional medical opinions within 24-48 hours'
    }
  ];

  const specialties = [
    'Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 
    'Radiology', 'Pathology', 'Internal Medicine', 'Surgery'
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 12,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                Get Expert Medical Second Opinions
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                Connect with qualified doctors worldwide for professional medical consultations and second opinions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: '#667eea',
                    px: 4,
                    py: 1.5,
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': { borderColor: '#f5f5f5', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 400
                }}
              >
                <LocalHospital sx={{ fontSize: 200, opacity: 0.3 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
          Why Choose Our Platform?
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Professional medical consultations made simple and secure
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  transition: 'transform 0.3s',
                  '&:hover': { transform: 'translateY(-8px)' }
                }}
              >
                <CardContent>
                  <Avatar
                    sx={{
                      bgcolor: 'transparent',
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Specialties Section */}
      <Box sx={{ bgcolor: '#f8f9fa', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
            Medical Specialties
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Our network includes specialists across all major medical fields
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {specialties.map((specialty, index) => (
              <Chip
                key={index}
                label={specialty}
                variant="outlined"
                sx={{
                  fontSize: '1rem',
                  py: 2,
                  px: 1,
                  '&:hover': { bgcolor: 'primary.main', color: 'white' }
                }}
              />
            ))}
          </Box>
        </Container>
      </Box>

      {/* How It Works */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
          How It Works
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {[
            { step: '1', title: 'Submit Your Case', desc: 'Upload medical records and describe your condition' },
            { step: '2', title: 'Doctor Review', desc: 'Qualified specialists review your case thoroughly' },
            { step: '3', title: 'Receive Opinion', desc: 'Get detailed medical opinion and recommendations' }
          ].map((item, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2,
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {item.step}
                </Avatar>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  {item.title}
                </Typography>
                <Typography color="text.secondary">
                  {item.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" gutterBottom fontWeight="bold">
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of patients who trust our platform for medical second opinions
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
            onClick={() => navigate('/register')}
          >
            Create Account
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;