import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, AccountBalance as AccountBalanceIcon, Sync as SyncIcon } from '@mui/icons-material';
import PlaidLink from '../components/PlaidLink';
import api from '../services/api';

interface Account {
  id: number;
  name: string;
  account_type: string;
  institution_name: string;
  current_balance: number;
  is_manual: boolean;
  is_active: boolean;
}

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    account_type: 'checking',
    institution_name: '',
    current_balance: 0
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounts');
      setAccounts(response.data.accounts || []);
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      setErrorMessage(error.response?.data?.detail || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaidSuccess = (accounts: any[]) => {
    setSuccessMessage(`Successfully linked ${accounts.length} account(s)!`);
    setErrorMessage(null);
    fetchAccounts(); // Refresh accounts
  };

  const handlePlaidError = (error: string) => {
    setErrorMessage(error);
    setSuccessMessage(null);
  };

  const handleCreateAccount = async () => {
    try {
      await api.post('/accounts', newAccount);
      setSuccessMessage('Account created successfully!');
      setOpenDialog(false);
      setNewAccount({
        name: '',
        account_type: 'checking',
        institution_name: '',
        current_balance: 0
      });
      fetchAccounts();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Failed to create account');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking': return 'primary';
      case 'savings': return 'secondary';
      case 'credit_card': return 'warning';
      case 'investment': return 'info';
      default: return 'default';
    }
  };

  const calculateSummary = () => {
    const assets = accounts
      .filter(acc => !['credit_card', 'loan', 'mortgage'].includes(acc.account_type.toLowerCase()))
      .reduce((sum, acc) => sum + acc.current_balance, 0);
    
    const liabilities = accounts
      .filter(acc => ['credit_card', 'loan', 'mortgage'].includes(acc.account_type.toLowerCase()))
      .reduce((sum, acc) => sum + Math.abs(acc.current_balance), 0);
    
    return {
      assets,
      liabilities,
      netWorth: assets - liabilities
    };
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

  const summary = calculateSummary();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Accounts
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <PlaidLink
            onSuccess={handlePlaidSuccess}
            onError={handlePlaidError}
            buttonText="Link Bank Account"
            variant="contained"
          />
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Manual Account
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<SyncIcon />}
            onClick={fetchAccounts}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {accounts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No accounts found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Link your bank accounts or add manual accounts to get started
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <PlaidLink
              onSuccess={handlePlaidSuccess}
              onError={handlePlaidError}
              buttonText="Link Bank Account"
              variant="contained"
            />
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Add Manual Account
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {accounts.map((account) => (
              <Grid item xs={12} md={6} lg={4} key={account.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccountBalanceIcon sx={{ mr: 1, color: `${getAccountTypeColor(account.account_type)}.main` }} />
                      <Typography variant="h6">{account.name}</Typography>
                    </Box>
                    <Typography 
                      variant="h4" 
                      color={account.current_balance >= 0 ? 'primary' : 'error'} 
                      gutterBottom
                    >
                      {formatCurrency(account.current_balance)}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip 
                        label={account.account_type.replace('_', ' ').toUpperCase()} 
                        size="small" 
                        color={getAccountTypeColor(account.account_type) as any}
                      />
                      <Chip 
                        label={account.is_active ? 'Active' : 'Inactive'} 
                        size="small" 
                        color={account.is_active ? 'success' : 'default'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {account.institution_name || 'Manual Account'}
                      {account.is_manual && ' (Manual)'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Paper sx={{ mt: 4, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {formatCurrency(summary.assets)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Assets
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error">
                    {formatCurrency(summary.liabilities)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Liabilities
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color={summary.netWorth >= 0 ? 'success.main' : 'error'}>
                    {formatCurrency(summary.netWorth)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Net Worth
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}

      {/* Add Manual Account Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Manual Account</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Account Name"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Account Type"
              select
              value={newAccount.account_type}
              onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
              fullWidth
              required
            >
              <MenuItem value="checking">Checking</MenuItem>
              <MenuItem value="savings">Savings</MenuItem>
              <MenuItem value="credit_card">Credit Card</MenuItem>
              <MenuItem value="investment">Investment</MenuItem>
              <MenuItem value="loan">Loan</MenuItem>
              <MenuItem value="mortgage">Mortgage</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              label="Institution Name"
              value={newAccount.institution_name}
              onChange={(e) => setNewAccount({ ...newAccount, institution_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Current Balance"
              type="number"
              value={newAccount.current_balance}
              onChange={(e) => setNewAccount({ ...newAccount, current_balance: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateAccount} variant="contained">
            Create Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Accounts;
