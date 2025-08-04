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
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
} from '@mui/material';
import { 
  Add as AddIcon, 
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';
import api from '../services/api';

interface Budget {
  id: number;
  name: string;
  category: string;
  amount: number;
  spent_amount: number;
  remaining_amount: number;
  period: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  alert_threshold: number;
}

const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  const [newBudget, setNewBudget] = useState({
    name: '',
    category: 'other',
    amount: 0,
    period: 'monthly',
    alert_threshold: 0.8
  });

  const categories = [
    'food_dining', 'groceries', 'transportation', 'entertainment', 'shopping',
    'utilities', 'healthcare', 'education', 'travel', 'subscription',
    'salary', 'investment', 'transfer', 'other'
  ];

  const periods = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/budgets');
      setBudgets(response.data.budgets || []);
    } catch (err: any) {
      console.error('Error fetching budgets:', err);
      setError(err.response?.data?.detail || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    try {
      await api.post('/budgets', newBudget);
      setSuccess('Budget created successfully!');
      setOpenDialog(false);
      resetForm();
      fetchBudgets();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create budget');
    }
  };

  const handleUpdateBudget = async () => {
    if (!editingBudget) return;
    
    try {
      await api.put(`/budgets/${editingBudget.id}`, newBudget);
      setSuccess('Budget updated successfully!');
      setOpenDialog(false);
      setEditingBudget(null);
      resetForm();
      fetchBudgets();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update budget');
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      await api.delete(`/budgets/${id}`);
      setSuccess('Budget deleted successfully!');
      fetchBudgets();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete budget');
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setNewBudget({
      name: budget.name,
      category: budget.category,
      amount: budget.amount,
      period: budget.period,
      alert_threshold: budget.alert_threshold
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setNewBudget({
      name: '',
      category: 'other',
      amount: 0,
      period: 'monthly',
      alert_threshold: 0.8
    });
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

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getProgressColor = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage > 100) return 'error';
    if (percentage > 80) return 'warning';
    return 'primary';
  };

  const getStatusChip = (spent: number, budgeted: number, threshold: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage > 100) {
      return <Chip label="Over Budget" color="error" size="small" />;
    }
    if (percentage > threshold * 100) {
      return <Chip label="Near Limit" color="warning" size="small" />;
    }
    return <Chip label="On Track" color="success" size="small" />;
  };

  const calculateOverview = () => {
    const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent_amount, 0);
    const totalRemaining = budgets.reduce((sum, budget) => sum + budget.remaining_amount, 0);
    const budgetUsedPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      budgetUsedPercentage
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

  const overview = calculateOverview();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Budgets
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Budget
        </Button>
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

      {budgets.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No budgets found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first budget to start tracking your spending
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Create Budget
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {budgets.map((budget) => {
              const percentage = (budget.spent_amount / budget.amount) * 100;
              const remaining = budget.amount - budget.spent_amount;
              const daysLeft = getDaysLeft(budget.end_date);

              return (
                <Grid item xs={12} md={6} key={budget.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="h6">{budget.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusChip(budget.spent_amount, budget.amount, budget.alert_threshold)}
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditBudget(budget)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteBudget(budget.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {budget.category.replace('_', ' ').toUpperCase()} • {budget.period.toUpperCase()}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(budget.spent_amount)} of {formatCurrency(budget.amount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(percentage, 100)}
                          color={getProgressColor(budget.spent_amount, budget.amount)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6" color={remaining >= 0 ? 'success.main' : 'error.main'}>
                            {formatCurrency(Math.abs(remaining))}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {remaining >= 0 ? 'Remaining' : 'Over Budget'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="text.secondary">
                            {daysLeft} days left
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Ends {formatDate(budget.end_date)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Paper sx={{ mt: 4, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Budget Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {formatCurrency(overview.totalBudgeted)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Budgeted
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error">
                    {formatCurrency(overview.totalSpent)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Spent
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color={overview.totalRemaining >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(Math.abs(overview.totalRemaining))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {overview.totalRemaining >= 0 ? 'Remaining' : 'Over Budget'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {overview.budgetUsedPercentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Budget Used
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}

      {/* Add/Edit Budget Dialog */}
      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false);
        setEditingBudget(null);
        resetForm();
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBudget ? 'Edit Budget' : 'Create Budget'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Budget Name"
              value={newBudget.name}
              onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Category"
              select
              value={newBudget.category}
              onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
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
              label="Budget Amount"
              type="number"
              value={newBudget.amount}
              onChange={(e) => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
            />
            <TextField
              label="Period"
              select
              value={newBudget.period}
              onChange={(e) => setNewBudget({ ...newBudget, period: e.target.value })}
              fullWidth
              required
            >
              {periods.map((period) => (
                <MenuItem key={period.value} value={period.value}>
                  {period.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Alert Threshold (%)"
              type="number"
              value={newBudget.alert_threshold * 100}
              onChange={(e) => setNewBudget({ ...newBudget, alert_threshold: (parseFloat(e.target.value) || 80) / 100 })}
              fullWidth
              helperText="Get alerts when spending reaches this percentage"
              inputProps={{ min: 0, max: 100 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditingBudget(null);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button 
            onClick={editingBudget ? handleUpdateBudget : handleCreateBudget} 
            variant="contained"
          >
            {editingBudget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Budgets;
