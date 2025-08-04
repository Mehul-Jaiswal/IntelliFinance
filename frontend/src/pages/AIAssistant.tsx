import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon, SmartToy as SmartToyIcon, Person as PersonIcon } from '@mui/icons-material';
import api from '../services/api';

interface Message {
  id: number;
  isUser: boolean;
  message: string;
  timestamp: string;
}

const sampleSuggestions = [
  "How much did I spend on groceries last month?",
  "Show me my budget status",
  "What's my biggest expense category?",
  "Find all transactions at Starbucks",
  "How are my savings goals doing?",
  "Should I increase my grocery budget?",
  "What can I do to save more money?",
  "Show me unusual transactions this month",
  "What's my net worth?",
  "How much money do I have left to spend this month?",
  "Which account has the highest balance?",
  "Show me my recent transactions"
];

const AIAssistant: React.FC = () => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Only scroll when a new message is added, not on initial load or every conversation change
  const prevConversationLength = useRef(0);
  const isInitialLoad = useRef(true);
  
  useEffect(() => {
    if (!isInitialLoad.current && conversation.length > prevConversationLength.current) {
      scrollToBottom();
    }
    prevConversationLength.current = conversation.length;
  }, [conversation]);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: 1,
      isUser: false,
      message: "Hello! I'm your AI financial assistant. I can help you analyze your spending, track budgets, monitor goals, and provide personalized financial insights. What would you like to know about your finances?",
      timestamp: new Date().toLocaleString()
    };
    setConversation([welcomeMessage]);
    // Mark initial load as complete after setting the welcome message
    setTimeout(() => {
      isInitialLoad.current = false;
    }, 100);
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      isUser: true,
      message: message.trim(),
      timestamp: new Date().toLocaleString()
    };

    setConversation(prev => [...prev, userMessage]);
    const currentMessage = message.trim();
    setMessage('');
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/chat', {
        message: currentMessage
      });

      const aiResponse: Message = {
        id: Date.now() + 1,
        isUser: false,
        message: response.data.response || "I'm sorry, I couldn't process your request at the moment. Please try again.",
        timestamp: new Date().toLocaleString()
      };

      setConversation(prev => [...prev, aiResponse]);
    } catch (err: any) {
      console.error('Error sending message to AI:', err);
      const errorMessage: Message = {
        id: Date.now() + 1,
        isUser: false,
        message: "I'm sorry, I'm having trouble processing your request right now. This could be due to the AI service being unavailable. Please try again later or contact support if the issue persists.",
        timestamp: new Date().toLocaleString()
      };
      setConversation(prev => [...prev, errorMessage]);
      setError(err.response?.data?.detail || 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    const welcomeMessage: Message = {
      id: 1,
      isUser: false,
      message: "Hello! I'm your AI financial assistant. I can help you analyze your spending, track budgets, monitor goals, and provide personalized financial insights. What would you like to know about your finances?",
      timestamp: new Date().toLocaleString()
    };
    setConversation([welcomeMessage]);
    setError(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          AI Financial Assistant
        </Typography>
        <Button variant="outlined" onClick={clearConversation}>
          Clear Chat
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Chat Interface */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            {/* Chat Messages */}
            <Box ref={chatContainerRef} sx={{ flexGrow: 1, p: 2, overflowY: 'auto', maxHeight: '500px' }}>
              {conversation.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.isUser ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      maxWidth: '80%',
                      flexDirection: msg.isUser ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: msg.isUser ? 'primary.main' : 'secondary.main',
                        mx: 1,
                        mt: 0.5,
                      }}
                    >
                      {msg.isUser ? <PersonIcon /> : <SmartToyIcon />}
                    </Avatar>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: msg.isUser ? 'primary.light' : 'grey.100',
                        color: msg.isUser ? 'white' : 'text.primary',
                        borderRadius: 2,
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {msg.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1,
                          opacity: 0.7,
                        }}
                      >
                        {msg.timestamp}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              ))}
              
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', maxWidth: '70%' }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mx: 1, mt: 0.5 }}>
                      <SmartToyIcon />
                    </Avatar>
                    <Paper sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body1">Analyzing your financial data...</Typography>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Ask me about your finances..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  multiline
                  maxRows={3}
                  disabled={loading}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || loading}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  {loading ? <CircularProgress size={20} /> : <SendIcon />}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Suggestions Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💡 Try asking:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {sampleSuggestions.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    variant="outlined"
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={loading}
                    sx={{
                      justifyContent: 'flex-start',
                      height: 'auto',
                      py: 1,
                      '& .MuiChip-label': {
                        whiteSpace: 'normal',
                        textAlign: 'left',
                      },
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🤖 AI Capabilities
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                I can help you with:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  Real-time spending analysis and trends
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Budget tracking and personalized recommendations
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Transaction search and smart categorization
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Savings goals progress and optimization
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Financial advice based on your data
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Account balance and net worth calculations
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Anomaly detection and fraud alerts
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Financial forecasting and planning
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Data Sources
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                I analyze data from:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  Your linked bank accounts
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Transaction history and patterns
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Budget allocations and spending
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Savings goals and progress
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Account balances and trends
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AIAssistant;
