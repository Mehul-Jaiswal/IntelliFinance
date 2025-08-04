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
  IconButton,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Flag as FlagIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon 
} from '@mui/icons-material';
import api from '../services/api';

interface Goal {
  id: number;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  is_active: boolean;
  is_completed: boolean;
  created_at: string;
}

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openContributeDialog, setOpenContributeDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState(0);
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    description: '',
    target_amount: 0,
    target_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/goals');
      setGoals(response.data.goals || []);
    } catch (err: any) {
      console.error('Error fetching goals:', err);
      setError(err.response?.data?.detail || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    try {
      await api.post('/goals', newGoal);
      setSuccess('Goal created successfully!');
      setOpenDialog(false);
      resetForm();
      fetchGoals();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create goal');
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    
    try {
      await api.put(`/goals/${editingGoal.id}`, newGoal);
      setSuccess('Goal updated successfully!');
      setOpenDialog(false);
      setEditingGoal(null);
      resetForm();
      fetchGoals();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update goal');
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await api.delete(`/goals/${id}`);
      setSuccess('Goal deleted successfully!');
      fetchGoals();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete goal');
    }
  };

  const handleContributeToGoal = async () => {
    if (!contributingGoal || contributionAmount <= 0) return;
    
    try {
      await api.post(`/goals/${contributingGoal.id}/contribute`, null, {
        params: { amount: contributionAmount }
      });
      setSuccess(`Successfully contributed $${contributionAmount.toFixed(2)} to ${contributingGoal.name}!`);
      setOpenContributeDialog(false);
      setContributingGoal(null);
      setContributionAmount(0);
      fetchGoals();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to contribute to goal');
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoal({
      name: goal.name,
      description: goal.description || '',
      target_amount: goal.target_amount,
      target_date: goal.target_date.split('T')[0]
    });
    setOpenDialog(true);
  };

  const handleContributeClick = (goal: Goal) => {
    setContributingGoal(goal);
    setOpenContributeDialog(true);
  };

  const resetForm = () => {
    setNewGoal({
      name: '',
      description: '',
      target_amount: 0,
      target_date: new Date().toISOString().split('T')[0]
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

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'primary';
    if (percentage >= 50) return 'info';
    return 'warning';
  };

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateOverview = () => {
    const activeGoals = goals.filter(g => g.is_active).length;
    const completedGoals = goals.filter(g => g.is_completed).length;
    const totalSaved = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const totalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const remainingToSave = totalTarget - totalSaved;
    const averageProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return {
      activeGoals,
      completedGoals,
      totalSaved,
      remainingToSave,
      averageProgress
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
          Savings Goals
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Goal
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

      {goals.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FlagIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No savings goals found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first savings goal to start tracking your progress
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Create Goal
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {goals.map((goal) => {
              const percentage = (goal.current_amount / goal.target_amount) * 100;
              const remaining = goal.target_amount - goal.current_amount;
              const daysRemaining = getDaysRemaining(goal.target_date);

              return (
                <Grid item xs={12} md={6} key={goal.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FlagIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="h6">{goal.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {goal.is_completed && (
                            <Chip label="Completed" color="success" size="small" />
                          )}
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleContributeClick(goal)}
                            disabled={goal.is_completed}
                          >
                            <MoneyIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditGoal(goal)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>

                      {goal.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {goal.description}
                        </Typography>
                      )}

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(percentage, 100)}
                          color={getProgressColor(goal.current_amount, goal.target_amount)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6" color={goal.is_completed ? 'success.main' : 'primary.main'}>
                            {goal.is_completed ? 'Goal Achieved!' : formatCurrency(remaining)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {goal.is_completed ? 'Congratulations!' : 'Remaining'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography 
                            variant="body2" 
                            color={daysRemaining > 0 ? 'text.secondary' : 'error.main'}
                          >
                            {goal.is_completed ? 'Completed' : 
                             daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Target: {formatDate(goal.target_date)}
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
              Goals Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {overview.activeGoals}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Goals
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(overview.totalSaved)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Saved
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {formatCurrency(overview.remainingToSave)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Remaining to Save
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {overview.averageProgress.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Progress
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}

      {/* Add/Edit Goal Dialog */}
      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false);
        setEditingGoal(null);
        resetForm();
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGoal ? 'Edit Goal' : 'Create Goal'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Goal Name"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Target Amount"
              type="number"
              value={newGoal.target_amount}
              onChange={(e) => setNewGoal({ ...newGoal, target_amount: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
            />
            <TextField
              label="Target Date"
              type="date"
              value={newGoal.target_date}
              onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditingGoal(null);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button 
            onClick={editingGoal ? handleUpdateGoal : handleCreateGoal} 
            variant="contained"
          >
            {editingGoal ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contribute to Goal Dialog */}
      <Dialog open={openContributeDialog} onClose={() => {
        setOpenContributeDialog(false);
        setContributingGoal(null);
        setContributionAmount(0);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          Contribute to {contributingGoal?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {contributingGoal && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Progress: {formatCurrency(contributingGoal.current_amount)} of {formatCurrency(contributingGoal.target_amount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Remaining: {formatCurrency(contributingGoal.target_amount - contributingGoal.current_amount)}
                </Typography>
              </Box>
            )}
            <TextField
              label="Contribution Amount"
              type="number"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
              fullWidth
              required
              inputProps={{ min: 0.01, step: 0.01 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenContributeDialog(false);
            setContributingGoal(null);
            setContributionAmount(0);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleContributeToGoal} 
            variant="contained"
            disabled={contributionAmount <= 0}
          >
            Contribute {formatCurrency(contributionAmount)}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Goals;
