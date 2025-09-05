import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { caseService } from '../services/authService';

const SubmitCase: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    existingDiagnosis: '',
    questions: '',
    preferredLanguage: 'English',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      // Add files
      files.forEach((file) => {
        formDataToSend.append('documents', file);
      });

      await caseService.submitCase(formDataToSend);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Submit Medical Case
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please provide detailed information about your medical condition to receive the best second opinion.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Case Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
            helperText="Brief description of your medical concern"
          />

          <TextField
            fullWidth
            label="Detailed Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
            required
            helperText="Describe your symptoms, medical history, and current situation in detail"
          />

          <TextField
            fullWidth
            label="Existing Diagnosis (if any)"
            name="existingDiagnosis"
            value={formData.existingDiagnosis}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={2}
            helperText="Any diagnosis you've already received from other doctors"
          />

          <TextField
            fullWidth
            label="Specific Questions"
            name="questions"
            value={formData.questions}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
            required
            helperText="What specific questions do you want the doctor to address?"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Preferred Language</InputLabel>
            <Select
              name="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={(e) => setFormData({...formData, preferredLanguage: e.target.value})}
            >
              <MenuItem value="English">English</MenuItem>
              <MenuItem value="Spanish">Spanish</MenuItem>
              <MenuItem value="French">French</MenuItem>
              <MenuItem value="German">German</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Medical Documents
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload relevant medical documents (reports, scans, lab results). Supported formats: PDF, JPG, PNG, DOC, DOCX
            </Typography>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              sx={{ mb: 2 }}
            >
              Upload Documents
              <input
                type="file"
                hidden
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
              />
            </Button>

            {files.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {files.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => removeFile(index)}
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Important Disclaimer:</strong> This service provides second medical opinions for informational purposes only. 
              It does not establish a doctor-patient relationship and should not replace consultation with your primary healthcare provider.
            </Typography>
          </Alert>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Submitting...' : 'Submit Case'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SubmitCase;