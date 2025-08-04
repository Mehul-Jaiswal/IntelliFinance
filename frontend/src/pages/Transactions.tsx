import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Sync as SyncIcon,
  FilterList as FilterIcon 
} from '@mui/icons-material';
import api from '../services/api';

interface Transaction {
  id: number;
  description: string;
  merchant_name?: string;
  category: string;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  account: {
    id: number;
    name: string;
  };
  is_pending: boolean;
}

interface Account {
  id: number;
  name: string;
}

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    merchant_name: '',
    category: 'other',
    amount: 0,
    transaction_type: 'debit',
    account_id: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    'food_dining', 'groceries', 'transportation', 'entertainment', 'shopping',
    'utilities', 'healthcare', 'education', 'travel', 'subscription',
    'salary', 'investment', 'transfer', 'other'
  ];

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
  }, [page, rowsPerPage]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/transactions?skip=${page * rowsPerPage}&limit=${rowsPerPage}`);
      setTransactions(response.data.transactions || []);
      setTotalTransactions(response.data.total || 0);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.detail || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data.accounts || []);
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
    }
  };

  const handleCreateTransaction = async () => {
    try {
      await api.post('/transactions', newTransaction);
      setSuccess('Transaction created successfully!');
      setOpenDialog(false);
      resetForm();
      fetchTransactions();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create transaction');
    }
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;
    
    try {
      await api.put(`/transactions/${editingTransaction.id}`, newTransaction);
      setSuccess('Transaction updated successfully!');
      setOpenDialog(false);
      setEditingTransaction(null);
      resetForm();
      fetchTransactions();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update transaction');
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await api.delete(`/transactions/${id}`);
      setSuccess('Transaction deleted successfully!');
      fetchTransactions();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete transaction');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      description: transaction.description,
      merchant_name: transaction.merchant_name || '',
      category: transaction.category,
      amount: transaction.amount,
      transaction_type: transaction.transaction_type,
      account_id: transaction.account.id.toString(),
      transaction_date: transaction.transaction_date.split('T')[0]
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setNewTransaction({
      description: '',
      merchant_name: '',
      category: 'other',
      amount: 0,
      transaction_type: 'debit',
      account_id: '',
      transaction_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleSyncTransactions = async () => {
    try {
      setLoading(true);
      await api.post('/plaid/sync-transactions');
      setSuccess('Transactions synced successfully!');
      fetchTransactions();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sync transactions');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: any } = {
      'food_dining': 'warning',
      'groceries': 'success',
      'salary': 'primary',
      'transportation': 'error',
      'entertainment': 'secondary',
      'shopping': 'info',
      'utilities': 'default',
      'healthcare': 'error',
      'education': 'primary',
      'travel': 'info',
      'subscription': 'warning',
      'investment': 'success',
      'transfer': 'default',
      'other': 'default'
    };
    return colors[category] || 'default';
  };

  const calculateSummary = () => {
    const income = transactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expenses,
      net: income - expenses
    };
  };

  if (loading && transactions.length === 0) {
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
          Transactions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<SyncIcon />}
            onClick={handleSyncTransactions}
            disabled={loading}
          >
            Sync Plaid
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Transaction
          </Button>
        </Box>
      </Box>

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

      {transactions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No transactions found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Link your bank accounts or add manual transactions to get started
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              startIcon={<SyncIcon />}
              onClick={handleSyncTransactions}
            >
              Sync Plaid Transactions
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Add Manual Transaction
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Merchant</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.merchant_name || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.category.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={getCategoryColor(transaction.category)}
                        />
                      </TableCell>
                      <TableCell>{transaction.account.name}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: transaction.transaction_type === 'credit' ? 'success.main' : 'error.main',
                          fontWeight: 'bold',
                        }}
                      >
                        {transaction.transaction_type === 'credit' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={transaction.is_pending ? 'Pending' : 'Completed'}
                          size="small"
                          color={transaction.is_pending ? 'warning' : 'success'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditTransaction(transaction)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalTransactions}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Paper>

          <Paper sx={{ mt: 4, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Transaction Summary (Current Page)
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <Box>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(summary.income)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Income
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" color="error.main">
                  {formatCurrency(summary.expenses)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Expenses
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" color={summary.net >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(summary.net)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Net Income
                </Typography>
              </Box>
            </Box>
          </Paper>
        </>
      )}

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false);
        setEditingTransaction(null);
        resetForm();
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Description"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Merchant Name"
              value={newTransaction.merchant_name}
              onChange={(e) => setNewTransaction({ ...newTransaction, merchant_name: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel>Account</InputLabel>
              <Select
                value={newTransaction.account_id}
                onChange={(e) => setNewTransaction({ ...newTransaction, account_id: e.target.value })}
                label="Account"
              >
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id.toString()}>
                    {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Category"
              select
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
              fullWidth
              required
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category.replace('_', ' ').toUpperCase()}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Transaction Type"
              select
              value={newTransaction.transaction_type}
              onChange={(e) => setNewTransaction({ ...newTransaction, transaction_type: e.target.value })}
              fullWidth
              required
            >
              <MenuItem value="debit">Expense (Debit)</MenuItem>
              <MenuItem value="credit">Income (Credit)</MenuItem>
            </TextField>
            <TextField
              label="Amount"
              type="number"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
            />
            <TextField
              label="Date"
              type="date"
              value={newTransaction.transaction_date}
              onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditingTransaction(null);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button 
            onClick={editingTransaction ? handleUpdateTransaction : handleCreateTransaction} 
            variant="contained"
          >
            {editingTransaction ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Transactions;
