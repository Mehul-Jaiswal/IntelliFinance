import os
from typing import Dict, List, Optional
from plaid.api import plaid_api
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from plaid.configuration import Configuration
from plaid.api_client import ApiClient
from datetime import datetime, timedelta
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class PlaidService:
    def __init__(self):
        # Check if Plaid credentials are properly configured
        self.client_id = settings.PLAID_CLIENT_ID
        self.secret = settings.PLAID_SECRET
        
        # Debug logging
        logger.info(f"Plaid Client ID: {self.client_id}")
        logger.info(f"Plaid Secret: {self.secret[:10]}..." if self.secret else "Plaid Secret: None")
        
        self.is_configured = (
            self.client_id and 
            self.secret and 
            self.client_id != 'demo-client-id' and 
            self.secret != 'demo-secret-key'
        )
        
        logger.info(f"Plaid is_configured: {self.is_configured}")
        
        if self.is_configured:
            # Configure Plaid client
            plaid_env = settings.PLAID_ENV
            if plaid_env == 'sandbox':
                host = 'https://sandbox.plaid.com'
            elif plaid_env == 'development':
                host = 'https://development.plaid.com'
            else:
                host = 'https://production.plaid.com'
                
            logger.info(f"Configuring Plaid client for {plaid_env} environment")
            
            configuration = Configuration(
                host=host,
                api_key={
                    'clientId': self.client_id,
                    'secret': self.secret
                }
            )
            api_client = ApiClient(configuration)
            self.client = plaid_api.PlaidApi(api_client)
            logger.info("Plaid client configured successfully")
        else:
            self.client = None
            logger.warning("Plaid API credentials not configured. Using mock responses.")
    
    def create_link_token(self, user_id: str, user_email: str) -> Dict:
        """Create a link token for Plaid Link initialization"""
        if not self.is_configured:
            raise Exception("Plaid API credentials not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables.")
        
        try:
            request = LinkTokenCreateRequest(
                products=[Products('transactions'), Products('auth')],
                client_name="IntelliFinance",
                country_codes=[CountryCode('US')],
                language='en',
                user=LinkTokenCreateRequestUser(client_user_id=str(user_id))
            )
            
            response = self.client.link_token_create(request)
            return {
                'link_token': response['link_token'],
                'expiration': response['expiration']
            }
        except Exception as e:
            logger.error(f"Error creating link token: {str(e)}")
            raise Exception(f"Failed to create link token: {str(e)}")
    
    def exchange_public_token(self, public_token: str) -> Dict:
        """Exchange public token for access token"""
        try:
            request = ItemPublicTokenExchangeRequest(public_token=public_token)
            response = self.client.item_public_token_exchange(request)
            
            return {
                'access_token': response['access_token'],
                'item_id': response['item_id']
            }
        except Exception as e:
            logger.error(f"Error exchanging public token: {str(e)}")
            raise Exception(f"Failed to exchange public token: {str(e)}")
    
    def get_accounts(self, access_token: str) -> List[Dict]:
        """Get accounts for a given access token"""
        try:
            request = AccountsGetRequest(access_token=access_token)
            response = self.client.accounts_get(request)
            
            accounts = []
            for account in response['accounts']:
                accounts.append({
                    'account_id': account['account_id'],
                    'name': account['name'],
                    'official_name': account.get('official_name'),
                    'type': account['type'],
                    'subtype': account['subtype'],
                    'balance': {
                        'available': account['balances'].get('available'),
                        'current': account['balances'].get('current'),
                        'limit': account['balances'].get('limit'),
                        'iso_currency_code': account['balances'].get('iso_currency_code')
                    },
                    'mask': account.get('mask')
                })
            
            return accounts
        except Exception as e:
            logger.error(f"Error getting accounts: {str(e)}")
            raise Exception(f"Failed to get accounts: {str(e)}")
    
    def get_transactions(
        self, 
        access_token: str, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        account_ids: Optional[List[str]] = None,
        count: int = 100,
        offset: int = 0
    ) -> Dict:
        """Get transactions for a given access token"""
        try:
            if not start_date:
                start_date = datetime.now() - timedelta(days=30)
            if not end_date:
                end_date = datetime.now()
            
            request = TransactionsGetRequest(
                access_token=access_token,
                start_date=start_date.date(),
                end_date=end_date.date(),
                count=count,
                offset=offset
            )
            
            if account_ids:
                request.account_ids = account_ids
            
            response = self.client.transactions_get(request)
            
            transactions = []
            for transaction in response['transactions']:
                transactions.append({
                    'transaction_id': transaction['transaction_id'],
                    'account_id': transaction['account_id'],
                    'amount': transaction['amount'],
                    'date': transaction['date'].isoformat(),
                    'name': transaction['name'],
                    'merchant_name': transaction.get('merchant_name'),
                    'category': transaction.get('category', []),
                    'category_id': transaction.get('category_id'),
                    'account_owner': transaction.get('account_owner'),
                    'location': transaction.get('location'),
                    'payment_meta': transaction.get('payment_meta'),
                    'pending': transaction.get('pending', False),
                    'transaction_type': transaction.get('transaction_type'),
                    'unofficial_currency_code': transaction.get('unofficial_currency_code'),
                    'iso_currency_code': transaction.get('iso_currency_code')
                })
            
            return {
                'transactions': transactions,
                'total_transactions': response['total_transactions'],
                'accounts': response['accounts']
            }
        except Exception as e:
            logger.error(f"Error getting transactions: {str(e)}")
            raise Exception(f"Failed to get transactions: {str(e)}")
    
    def sync_account_data(self, access_token: str, user_id: int) -> Dict:
        """Sync account and transaction data for a user"""
        try:
            # Get accounts
            accounts_data = self.get_accounts(access_token)
            
            # Get transactions for the last 30 days
            transactions_data = self.get_transactions(access_token)
            
            return {
                'accounts': accounts_data,
                'transactions': transactions_data['transactions'],
                'sync_timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error syncing account data: {str(e)}")
            raise Exception(f"Failed to sync account data: {str(e)}")

# Global instance - will be initialized lazily
plaid_service = None

def get_plaid_service():
    global plaid_service
    if plaid_service is None:
        plaid_service = PlaidService()
    return plaid_service
