import React, { useCallback, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button, CircularProgress, Alert } from '@mui/material';
import { AccountBalance as AccountBalanceIcon } from '@mui/icons-material';
import api from '../services/api';

interface PlaidLinkProps {
  onSuccess?: (accounts: any[]) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  variant?: 'contained' | 'outlined' | 'text';
}

const PlaidLink: React.FC<PlaidLinkProps> = ({
  onSuccess,
  onError,
  buttonText = 'Link Bank Account',
  variant = 'contained'
}) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create link token
  const createLinkToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/plaid/create-link-token', {});
      setLinkToken(response.data.link_token);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create link token';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Handle successful link
  const onPlaidSuccess = useCallback(async (public_token: string, metadata: any) => {
    try {
      setLoading(true);
      
      // Exchange public token for access token and sync accounts
      const response = await api.post('/plaid/exchange-public-token', {
        public_token
      });
      
      // Sync transactions
      await api.post('/plaid/sync-transactions');
      
      onSuccess?.(response.data.accounts);
      setLinkToken(null); // Reset for next use
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to link account';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Handle Plaid Link errors
  const onPlaidError = useCallback((error: any) => {
    console.error('Plaid Link Error:', error);
    const errorMessage = error.error_message || 'An error occurred during account linking';
    setError(errorMessage);
    onError?.(errorMessage);
  }, [onError]);

  // Configure Plaid Link
  const config = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onError: onPlaidError,
    onExit: () => {
      console.log('User exited Plaid Link');
    },
  };

  const { open, ready } = usePlaidLink(config);

  // Handle button click
  const handleClick = async () => {
    if (!linkToken) {
      await createLinkToken();
    } else if (ready) {
      open();
    }
  };

  // Auto-open when link token is ready
  React.useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  return (
    <>
      <Button
        variant={variant}
        onClick={handleClick}
        disabled={loading}
        startIcon={
          loading ? (
            <CircularProgress size={20} />
          ) : (
            <AccountBalanceIcon />
          )
        }
        sx={{ minWidth: 200 }}
      >
        {loading ? 'Connecting...' : buttonText}
      </Button>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
    </>
  );
};

export default PlaidLink;
