import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  TextField,
  Card,
  CardContent,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Download, Send } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { caseService, doctorService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface Case {
  id: string;
  title: string;
  description: string;
  existingDiagnosis: string;
  questions: string;
  status: string;
  documents: string;
  opinion: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  senderId: string;
  senderType: string;
  message: string;
  timestamp: string;
}

const CaseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [opinion, setOpinion] = useState('');
  const [submittingOpinion, setSubmittingOpinion] = useState(false);
  const [showOpinionForm, setShowOpinionForm] = useState(false);

  useEffect(() => {
    if (id) {
      loadCaseData();
      loadMessages();
    }
  }, [id]);

  const loadCaseData = async () => {
    try {
      const data = await caseService.getCase(id!);
      setCaseData(data);
    } catch (err: any) {
      setError('Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await caseService.getCaseMessages(id!);
      setMessages(data);
    } catch (err: any) {
      console.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await caseService.sendMessage(id!, newMessage);
      setNewMessage('');
      loadMessages();
    } catch (err: any) {
      setError('Failed to send message');
    }
  };

  const handleAcceptCase = async () => {
    if (!caseData) return;
    setAccepting(true);
    try {
      await doctorService.acceptCase(caseData.id);
      loadCaseData();
    } catch (err: any) {
      setError('Failed to accept case');
    } finally {
      setAccepting(false);
    }
  };

  const handleSubmitOpinion = async () => {
    if (!caseData || !opinion.trim()) return;
    setSubmittingOpinion(true);
    try {
      await doctorService.submitOpinion(caseData.id, opinion);
      setShowOpinionForm(false);
      setOpinion('');
      loadCaseData();
    } catch (err: any) {
      setError('Failed to submit opinion');
    } finally {
      setSubmittingOpinion(false);
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
  if (!caseData) return <div>Case not found</div>;

  const documents = caseData.documents ? JSON.parse(caseData.documents) : [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {caseData.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              label={getStatusText(caseData.status)}
              color={getStatusColor(caseData.status) as any}
            />
            {user?.role === 'doctor' && caseData.status === 'submitted' && (
              <Button
                variant="contained"
                onClick={handleAcceptCase}
                disabled={accepting}
              >
                {accepting ? 'Accepting...' : 'Accept Case'}
              </Button>
            )}
            {user?.role === 'doctor' && caseData.status === 'under_review' && !caseData.opinion && (
              <Button
                variant="contained"
                onClick={() => setShowOpinionForm(true)}
              >
                Submit Opinion
              </Button>
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Submitted: {new Date(caseData.createdAt).toLocaleDateString()} | 
          Last Updated: {new Date(caseData.updatedAt).toLocaleDateString()}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Description</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {caseData.description}
          </Typography>
        </Box>

        {caseData.existingDiagnosis && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Existing Diagnosis</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {caseData.existingDiagnosis}
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Questions</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {caseData.questions}
          </Typography>
        </Box>

        {documents.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Documents</Typography>
            <List>
              {documents.map((doc: any, index: number) => (
                <ListItem key={index}>
                  <ListItemText primary={doc.originalName} />
                  <Button
                    startIcon={<Download />}
                    onClick={() => window.open(`/uploads/${doc.filename}`, '_blank')}
                  >
                    Download
                  </Button>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {caseData.opinion && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Medical Opinion
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {caseData.opinion}
                </Typography>
              </CardContent>
            </Card>
            <Button
              variant="outlined"
              startIcon={<Download />}
              sx={{ mt: 2 }}
              onClick={() => {
                const element = document.createElement('a');
                const file = new Blob([caseData.opinion], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = `medical-opinion-${caseData.id}.txt`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
            >
              Download Opinion
            </Button>
          </Box>
        )}
      </Paper>

      {/* Opinion Form */}
      {showOpinionForm && (
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Submit Medical Opinion
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={8}
            label="Medical Opinion"
            value={opinion}
            onChange={(e) => setOpinion(e.target.value)}
            placeholder="Provide your professional medical opinion here. Include your assessment, recommendations, and any disclaimers..."
            helperText="Please ensure your opinion includes appropriate medical disclaimers and recommendations for follow-up with the patient's primary care provider."
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmitOpinion}
              disabled={!opinion.trim() || submittingOpinion}
            >
              {submittingOpinion ? 'Submitting...' : 'Submit Opinion'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowOpinionForm(false)}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      )}

      {/* Messages Section */}
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Messages & Clarifications
        </Typography>
        
        <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 3 }}>
          {messages.length === 0 ? (
            <Typography color="text.secondary">No messages yet</Typography>
          ) : (
            messages.map((message) => (
              <Card key={message.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">
                      {message.senderType === 'doctor' ? 'Doctor' : 'You'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(message.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {message.message}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>

        {caseData.status === 'under_review' && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Ask a clarification question..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              Send
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CaseDetails;