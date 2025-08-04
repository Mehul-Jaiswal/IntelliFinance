import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Button,
  Avatar,
  Divider,
} from '@mui/material';
import { 
  AccountBalance, 
  TrendingUp, 
  TrackChanges, 
  Assessment,
  TrendingDown,
  ArrowUpward,
  ArrowDownward,
  Add,
  Insights,
} from '@mui/icons-material';
import api from '../services/api';
import StatsCard from '../components/StatsCard';

interface DashboardData {
  totalBalance: number;
  monthlySpending: number;
  accounts: Array<{
    id: number;
    name: string;
    account_type: string;
    current_balance: number;
    institution_name: string;
  }>;
  recentTransactions: Array<{
    id: number;
    description: string;
    amount: number;
    transaction_type: string;
    category: string;
    transaction_date: string;
  }>;
  budgets: Array<{
    id: number;
    category: string;
    amount: number;
    spent: number;
    period: string;
  }>;
  goals: Array<{
    id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [accountsRes, transactionsRes, budgetsRes, goalsRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/transactions?limit=5'),
        api.get('/budgets'),
        api.get('/goals')
      ]);

      const accounts = accountsRes.data.accounts || [];
      const transactions = transactionsRes.data.transactions || [];
      const budgets = budgetsRes.data.budgets || [];
      const goals = goalsRes.data.goals || [];

      // Calculate total balance
      const totalBalance = accounts.reduce((sum: number, account: any) => 
        sum + parseFloat(account.current_balance || 0), 0
      );

      // Calculate monthly spending (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlySpending = transactions
        .filter((t: any) => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear &&
                 t.transaction_type === 'debit';
        })
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

      setData({
        totalBalance,
        monthlySpending,
        accounts,
        recentTransactions: transactions.slice(0, 5),
        budgets,
        goals
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
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

  const getBudgetStatus = () => {
    if (!data?.budgets.length) return { status: 'No Budgets', color: '#9e9e9e' };
    
    const overBudget = data.budgets.filter(b => b.spent > b.amount).length;
    const nearLimit = data.budgets.filter(b => b.spent > b.amount * 0.8 && b.spent <= b.amount).length;
    
    if (overBudget > 0) return { status: `${overBudget} Over Budget`, color: theme.palette.error.main };
    if (nearLimit > 0) return { status: `${nearLimit} Near Limit`, color: theme.palette.warning.main };
    return { status: 'On Track', color: theme.palette.success.main };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ borderRadius: 2 }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const budgetStatus = getBudgetStatus();

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome back! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
          Here's what's happening with your finances today
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Balance"
            value={formatCurrency(data?.totalBalance || 0)}
            subtitle={`Across ${data?.accounts.length || 0} accounts`}
            icon={<AccountBalance />}
            gradient={theme.palette.gradient.primary}
            trend={{ value: '12.5%', isPositive: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Monthly Spending"
            value={formatCurrency(data?.monthlySpending || 0)}
            subtitle="This month"
            icon={<TrendingDown />}
            gradient={theme.palette.gradient.error}
            trend={{ value: '8.2%', isPositive: false }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Budget Status"
            value={budgetStatus.status}
            subtitle={`${data?.budgets.length || 0} active budgets`}
            icon={<Assessment />}
            gradient={theme.palette.gradient.warning}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Savings Goals"
            value={`${data?.goals.length || 0} Active`}
            subtitle="Financial goals"
            icon={<TrackChanges />}
            gradient={theme.palette.gradient.success}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Transactions */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Transactions
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  View All
                </Button>
              </Box>
              
              {data?.recentTransactions.length ? (
                <List sx={{ p: 0 }}>
                  {data.recentTransactions.map((transaction, index) => (
                    <React.Fragment key={transaction.id}>
                      <ListItem 
                        sx={{ 
                          px: 0, 
                          py: 2,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            borderRadius: 2,
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            mr: 2,
                            backgroundColor: transaction.transaction_type === 'debit' 
                              ? alpha(theme.palette.error.main, 0.1)
                              : alpha(theme.palette.success.main, 0.1),
                            color: transaction.transaction_type === 'debit' 
                              ? theme.palette.error.main
                              : theme.palette.success.main,
                          }}
                        >
                          {transaction.transaction_type === 'debit' ? <ArrowDownward /> : <ArrowUpward />}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {transaction.description}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(transaction.transaction_date)}
                              </Typography>
                              <Chip 
                                label={transaction.category} 
                                size="small" 
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.75rem' }}
                              />
                            </Box>
                          }
                        />
                        <Typography 
                          variant="h6" 
                          sx={{
                            fontWeight: 700,
                            color: transaction.transaction_type === 'debit' 
                              ? theme.palette.error.main 
                              : theme.palette.success.main,
                          }}
                        >
                          {transaction.transaction_type === 'debit' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </ListItem>
                      {index < data.recentTransactions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    No transactions yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Link your accounts to see transaction data
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions & AI Assistant */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Add />}
                        sx={{ 
                          py: 1.5, 
                          borderRadius: 2,
                          flexDirection: 'column',
                          height: 80,
                        }}
                      >
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Add Account
                        </Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<TrendingUp />}
                        sx={{ 
                          py: 1.5, 
                          borderRadius: 2,
                          flexDirection: 'column',
                          height: 80,
                        }}
                      >
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Set Budget
                        </Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<TrackChanges />}
                        sx={{ 
                          py: 1.5, 
                          borderRadius: 2,
                          flexDirection: 'column',
                          height: 80,
                        }}
                      >
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          New Goal
                        </Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Insights />}
                        sx={{ 
                          py: 1.5, 
                          borderRadius: 2,
                          flexDirection: 'column',
                          height: 80,
                        }}
                      >
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Analytics
                        </Typography>
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* AI Assistant */}
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  background: theme.palette.gradient.primary,
                  color: 'white',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <Typography variant="h6">🤖</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      AI Assistant
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                    Get personalized insights about your spending patterns and financial goals.
                  </Typography>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      borderRadius: 2,
                    }}
                  >
                    Ask AI Assistant
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Budget Progress */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Budget Progress
              </Typography>
              {data?.budgets.length ? (
                <Box>
                  {data.budgets.map((budget) => {
                    const progress = (budget.spent / budget.amount) * 100;
                    const isOverBudget = progress > 100;
                    
                    return (
                      <Box key={budget.id} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {budget.category}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(progress, 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: isOverBudget 
                                ? theme.palette.error.main
                                : progress > 80 
                                  ? theme.palette.warning.main 
                                  : theme.palette.success.main,
                            },
                          }}
                        />
                        {isOverBudget && (
                          <Typography variant="caption" sx={{ color: theme.palette.error.main, mt: 0.5 }}>
                            Over budget by {formatCurrency(budget.spent - budget.amount)}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    No budgets set
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create budgets to track your spending
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Savings Goals */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Savings Goals
              </Typography>
              {data?.goals.length ? (
                <Box>
                  {data.goals.map((goal) => {
                    const progress = (goal.current_amount / goal.target_amount) * 100;
                    
                    return (
                      <Box key={goal.id} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {goal.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(progress, 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: theme.palette.success.main,
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          Target: {formatDate(goal.target_date)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    No savings goals set
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create goals to track your progress
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
