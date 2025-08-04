import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  useTheme,
  alpha,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  TrendingUp,
} from '@mui/icons-material';
import { authAPI } from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login({
        username: email,
        password: password,
      });

      localStorage.setItem('access_token', response.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => e.msg).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
        }}
      />

      <Container component="main" maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            padding: 6,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Logo */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: 3,
                background: theme.palette.gradient.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                boxShadow: '0px 8px 24px rgba(102, 126, 234, 0.3)',
              }}
            >
              <Typography variant="h3" sx={{ color: 'white' }}>
                💰
              </Typography>
            </Box>

            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                mb: 1,
                background: theme.palette.gradient.primary,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              IntelliFinance
            </Typography>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Welcome back!
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
              Sign in to your account to continue managing your finances with AI-powered insights
            </Typography>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    color: theme.palette.error.main,
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    },
                  },
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    },
                  },
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 2,
                  mb: 3,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: theme.palette.gradient.primary,
                  boxShadow: '0px 8px 16px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    boxShadow: '0px 12px 24px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    background: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Don't have an account?
                </Typography>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    Create Account
                  </Button>
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Features showcase */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
            Trusted by thousands of users worldwide
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.9)' }}>
              <TrendingUp sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">AI-Powered Insights</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.9)' }}>
              <Lock sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">Bank-Level Security</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.9)' }}>
              <Email sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">24/7 Support</Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
