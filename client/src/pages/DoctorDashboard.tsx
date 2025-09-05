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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import { doctorService, caseService } from '../services/authService';

interface Case {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  userId: string;
}

const DoctorDashboard: React.FC = () => {
  const [availableCases, setAvailableCases] = useState<Case[]>([]);
  const [myCases, setMyCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [opinion, setOpinion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [opinionDialog, setOpinionDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const available = await doctorService.getAvailableCases();
      const my = await doctorService.getMyCases();
      setAvailableCases(available);
      setMyCases(my);
    } catch (err: any) {
      setError('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCase = async (caseId: string) => {
    try {
      await doctorService.acceptCase(caseId);
      loadData();
    } catch (err: any) {
      setError('Failed to accept case');
    }
  };

  const handleSubmitOpinion = async () => {
    if (!selectedCase || !opinion.trim()) return;

    try {
      await doctorService.submitOpinion(selectedCase.id, opinion);
      setOpinionDialog(false);
      setOpinion('');
      setSelectedCase(null);
      loadData();
    } catch (err: any) {
      setError('Failed to submit opinion');
    }
  };

  const openOpinionDialog = (case_: Case) => {
    setSelectedCase(case_);
    setOpinionDialog(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Doctor Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label={`Available Cases (${availableCases.length})`} />
          <Tab label={`My Cases (${myCases.length})`} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          {availableCases.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    No available cases
                  </Typography>
                  <Typography color="text.secondary">
                    Check back later for new cases to review.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            availableCases.map((case_) => (
              <Grid item xs={12} md={6} key={case_.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {case_.title}
                    </Typography>
                    
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      {case_.description.length > 150 
                        ? `${case_.description.substring(0, 150)}...` 
                        : case_.description}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Submitted: {new Date(case_.createdAt).toLocaleDateString()}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        onClick={() => handleAcceptCase(case_.id)}
                        size="small"
                      >
                        Accept Case
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => window.open(`/cases/${case_.id}`, '_blank')}
                        size="small"
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {myCases.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    No active cases
                  </Typography>
                  <Typography color="text.secondary">
                    Accept cases from the Available Cases tab to start reviewing.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            myCases.map((case_) => (
              <Grid item xs={12} md={6} key={case_.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {case_.title}
                      </Typography>
                      <Chip label="Under Review" color="warning" size="small" />
                    </Box>
                    
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      {case_.description.length > 150 
                        ? `${case_.description.substring(0, 150)}...` 
                        : case_.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        onClick={() => openOpinionDialog(case_)}
                        size="small"
                      >
                        Submit Opinion
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => window.open(`/cases/${case_.id}`, '_blank')}
                        size="small"
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Opinion Dialog */}
      <Dialog open={opinionDialog} onClose={() => setOpinionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Submit Medical Opinion</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Case: {selectedCase?.title}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            label="Medical Opinion"
            value={opinion}
            onChange={(e) => setOpinion(e.target.value)}
            placeholder="Provide your professional medical opinion here. Include your assessment, recommendations, and any disclaimers..."
            helperText="Please ensure your opinion includes appropriate medical disclaimers and recommendations for follow-up with the patient's primary care provider."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpinionDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitOpinion} 
            variant="contained"
            disabled={!opinion.trim()}
          >
            Submit Opinion
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DoctorDashboard;