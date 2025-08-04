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
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  TrendingUp,
  Security,
  Speed,
} from '@mui/icons-material';
import { authAPI } from '../services/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authAPI.register({
        email: formData.email,
        password: formData.password,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
      });

      // Auto-login after successful registration
      const loginResponse = await authAPI.login({
        username: formData.email,
        password: formData.password,
      });

      localStorage.setItem('access_token', loginResponse.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
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
        py: 4,
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

      <Container component="main" maxWidth="md">
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
          <Grid container spacing={6}>
            {/* Left side - Form */}
            <Grid item xs={12} md={7}>
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
                  Join IntelliFinance
                </Typography>
                
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Create your account
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
                  Start your journey to smarter financial management with AI-powered insights
                </Typography>
                
                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      width: '100%', 
                      mb: 3,
                      borderRadius: 2,
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        required
                        fullWidth
                        id="firstName"
                        label="First Name"
                        name="firstName"
                        autoComplete="given-name"
                        value={formData.firstName}
                        onChange={handleChange('firstName')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ color: theme.palette.text.secondary }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        required
                        fullWidth
                        id="lastName"
                        label="Last Name"
                        name="lastName"
                        autoComplete="family-name"
                        value={formData.lastName}
                        onChange={handleChange('lastName')}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange('email')}
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
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange('password')}
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
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                      },
                    }}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange('confirmPassword')}
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
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
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
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Already have an account?
                    </Typography>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
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
                        Sign In
                      </Button>
                    </Link>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Right side - Features */}
            <Grid item xs={12} md={5}>
              <Box sx={{ pl: { md: 4 }, pt: { xs: 4, md: 8 } }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                  Why Choose IntelliFinance?
                </Typography>
                
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        background: theme.palette.gradient.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <TrendingUp sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        AI-Powered Insights
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Get personalized financial advice and spending insights
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        background: theme.palette.gradient.success,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <Security sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Bank-Level Security
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your data is protected with enterprise-grade encryption
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        background: theme.palette.gradient.warning,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <Speed sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Real-Time Tracking
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Monitor your finances in real-time across all accounts
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 2 }}>
                    "IntelliFinance has completely transformed how I manage my money. The AI insights are incredibly accurate!"
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    - Sarah Johnson, Beta User
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
