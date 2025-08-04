import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Save as SaveIcon,
  Security as SecurityIcon,
  Download as DownloadIcon 
} from '@mui/icons-material';
import api from '../services/api';

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  currency: string;
  timezone: string;
  notification_preferences?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface NotificationSettings {
  budgetAlerts: boolean;
  goalReminders: boolean;
  weeklyReports: boolean;
  anomalyDetection: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    budgetAlerts: true,
    goalReminders: true,
    weeklyReports: true,
    anomalyDetection: true,
    emailNotifications: true,
    pushNotifications: false,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me');
      const userData = response.data;
      setProfile(userData);

      // Parse notification preferences if they exist
      if (userData.notification_preferences) {
        try {
          const prefs = JSON.parse(userData.notification_preferences);
          setNotifications(prev => ({ ...prev, ...prefs }));
        } catch (e) {
          console.warn('Failed to parse notification preferences');
        }
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.detail || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    if (!profile) return;
    setProfile(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);
  };

  const handleNotificationChange = (field: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);

      const updateData = {
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        currency: profile.currency,
        timezone: profile.timezone,
        notification_preferences: JSON.stringify(notifications)
      };

      await api.put('/users/me', updateData);
      setSuccess('Profile updated successfully!');
      fetchProfile(); // Refresh profile data
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await api.put('/users/change-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });

      setSuccess('Password changed successfully!');
      setOpenPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setError(null);
      const response = await api.get('/users/export-data', {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `intellifinance-data-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Data exported successfully!');
    } catch (err: any) {
      console.error('Error exporting data:', err);
      setError(err.response?.data?.detail || 'Failed to export data');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Failed to load profile data</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Profile Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}>
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Box>
                <Typography variant="h5">{profile.full_name || 'No name set'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile.email}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Typography variant="caption" color={profile.is_verified ? 'success.main' : 'warning.main'}>
                    {profile.is_verified ? '✓ Verified' : '⚠ Unverified'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    • Member since {formatDate(profile.created_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profile.full_name || ''}
                  onChange={(e) => handleProfileChange('full_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profile.email}
                  disabled
                  helperText="Email cannot be changed"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={profile.phone_number || ''}
                  onChange={(e) => handleProfileChange('phone_number', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Currency"
                  select
                  SelectProps={{ native: true }}
                  value={profile.currency}
                  onChange={(e) => handleProfileChange('currency', e.target.value)}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Timezone"
                  select
                  SelectProps={{ native: true }}
                  value={profile.timezone}
                  onChange={(e) => handleProfileChange('timezone', e.target.value)}
                >
                  <option value="America/New_York">Eastern Time (UTC-5)</option>
                  <option value="America/Chicago">Central Time (UTC-6)</option>
                  <option value="America/Denver">Mountain Time (UTC-7)</option>
                  <option value="America/Los_Angeles">Pacific Time (UTC-8)</option>
                  <option value="Europe/London">London (UTC+0)</option>
                  <option value="Europe/Paris">Paris (UTC+1)</option>
                  <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                  <option value="UTC">UTC</option>
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.budgetAlerts}
                      onChange={(e) => handleNotificationChange('budgetAlerts', e.target.checked)}
                    />
                  }
                  label="Budget Alerts"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.goalReminders}
                      onChange={(e) => handleNotificationChange('goalReminders', e.target.checked)}
                    />
                  }
                  label="Goal Reminders"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.weeklyReports}
                      onChange={(e) => handleNotificationChange('weeklyReports', e.target.checked)}
                    />
                  }
                  label="Weekly Reports"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.anomalyDetection}
                      onChange={(e) => handleNotificationChange('anomalyDetection', e.target.checked)}
                    />
                  }
                  label="Anomaly Detection"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.emailNotifications}
                      onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.pushNotifications}
                      onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                    />
                  }
                  label="Push Notifications"
                />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Security
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ mb: 1 }}
                onClick={() => setOpenPasswordDialog(true)}
              >
                Change Password
              </Button>
              <Button variant="outlined" fullWidth sx={{ mb: 1 }} disabled>
                Two-Factor Authentication
                <Typography variant="caption" display="block">
                  (Coming Soon)
                </Typography>
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data & Privacy
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ mb: 1 }}
                startIcon={<DownloadIcon />}
                onClick={handleExportData}
              >
                Export Data
              </Button>
              <Button variant="outlined" fullWidth sx={{ mb: 1 }} disabled>
                Privacy Settings
                <Typography variant="caption" display="block">
                  (Coming Soon)
                </Typography>
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Your data is encrypted and secure. We never share your financial information with third parties.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error">
                Danger Zone
              </Typography>
              <Button variant="outlined" color="error" fullWidth disabled>
                Delete Account
                <Typography variant="caption" display="block">
                  (Contact Support)
                </Typography>
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This action cannot be undone. All your data will be permanently deleted.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              fullWidth
              required
              helperText="Must be at least 6 characters long"
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              fullWidth
              required
              error={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword}
              helperText={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword ? 'Passwords do not match' : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenPasswordDialog(false);
            setPasswordData({
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            });
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained"
            disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
          >
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
