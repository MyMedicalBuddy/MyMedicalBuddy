import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  Grid,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { caseService } from '../services/authService';

interface Case {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const Dashboard: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const data = await caseService.getCases();
      setCases(data);
    } catch (err: any) {
      setError('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'primary';
      case 'under_review': return 'warning';
      case 'opinion_ready': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'under_review': return 'Under Review';
      case 'opinion_ready': return 'Opinion Ready';
      default: return status;
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">My Cases</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/submit-case')}
        >
          Submit New Case
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {cases.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              No cases submitted yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Submit your first medical case to get a second opinion from our qualified doctors.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/submit-case')}
            >
              Submit Your First Case
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {cases.map((case_) => (
            <Grid item xs={12} md={6} key={case_.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {case_.title}
                    </Typography>
                    <Chip
                      label={getStatusText(case_.status)}
                      color={getStatusColor(case_.status) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {case_.description.length > 150 
                      ? `${case_.description.substring(0, 150)}...` 
                      : case_.description}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Submitted: {new Date(case_.createdAt).toLocaleDateString()}
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/cases/${case_.id}`)}
                    fullWidth
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;