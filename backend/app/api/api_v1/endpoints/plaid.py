from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.utils.auth import get_current_user
from app.services.plaid_service import get_plaid_service
from app.ml.transaction_categorizer import categorize_transaction

router = APIRouter()

class LinkTokenRequest(BaseModel):
    pass

class ExchangeTokenRequest(BaseModel):
    public_token: str

class SyncAccountsRequest(BaseModel):
    access_token: str

@router.post("/create-link-token")
async def create_link_token(
    request: LinkTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create a Plaid Link token for account linking"""
    try:
        plaid_service = get_plaid_service()
        link_token_data = plaid_service.create_link_token(
            user_id=str(current_user.id),
            user_email=current_user.email
        )
        
        return {
            "message": "Link token created successfully",
            "link_token": link_token_data["link_token"],
            "expiration": link_token_data["expiration"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create link token: {str(e)}"
        )

@router.post("/exchange-public-token")
async def exchange_public_token(
    request: ExchangeTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Exchange public token for access token and sync accounts"""
    try:
        plaid_service = get_plaid_service()
        # Exchange public token for access token
        token_data = plaid_service.exchange_public_token(request.public_token)
        access_token = token_data["access_token"]
        item_id = token_data["item_id"]
        
        # Get accounts from Plaid
        plaid_accounts = plaid_service.get_accounts(access_token)
        
        # Save accounts to database
        created_accounts = []
        for plaid_account in plaid_accounts:
            # Check if account already exists
            existing_account = db.query(Account).filter(
                Account.plaid_account_id == plaid_account["account_id"],
                Account.user_id == current_user.id
            ).first()
            
            if not existing_account:
                account = Account(
                    user_id=current_user.id,
                    name=plaid_account["name"],
                    account_type=str(plaid_account["subtype"]) if plaid_account["subtype"] else "other",
                    institution_name=plaid_account.get("official_name", "Unknown"),
                    current_balance=plaid_account["balance"]["current"] or 0,
                    plaid_account_id=plaid_account["account_id"],
                    access_token=access_token,
                    plaid_item_id=item_id,
                    is_manual=False
                )
                db.add(account)
                created_accounts.append(account)
        
        db.commit()
        
        # Refresh accounts to get IDs
        for account in created_accounts:
            db.refresh(account)
        
        return {
            "message": f"Successfully linked {len(created_accounts)} accounts",
            "accounts": [
                {
                    "id": account.id,
                    "name": account.name,
                    "type": account.account_type,
                    "balance": account.current_balance,
                    "institution": account.institution_name
                }
                for account in created_accounts
            ]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to exchange token and sync accounts: {str(e)}"
        )

@router.post("/sync-transactions")
async def sync_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Sync transactions for all linked accounts"""
    try:
        plaid_service = get_plaid_service()
        # Get all Plaid-linked accounts for the user
        plaid_accounts = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.access_token.isnot(None)
        ).all()
        
        if not plaid_accounts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No linked accounts found"
            )
        
        total_synced = 0
        
        for account in plaid_accounts:
            try:
                # Get transactions from Plaid
                transactions_data = plaid_service.get_transactions(
                    access_token=account.access_token,
                    account_ids=[account.plaid_account_id]
                )
                
                # Save transactions to database
                for plaid_transaction in transactions_data["transactions"]:
                    # Check if transaction already exists
                    existing_transaction = db.query(Transaction).filter(
                        Transaction.plaid_transaction_id == plaid_transaction["transaction_id"]
                    ).first()
                    
                    if not existing_transaction:
                        # Categorize transaction using ML
                        category = categorize_transaction(
                            plaid_transaction["name"],
                            plaid_transaction.get("merchant_name", ""),
                            plaid_transaction.get("category", [])
                        )
                        
                        transaction = Transaction(
                            account_id=account.id,
                            amount=abs(plaid_transaction["amount"]),
                            transaction_type="debit" if plaid_transaction["amount"] > 0 else "credit",
                            description=plaid_transaction["name"],
                            merchant_name=plaid_transaction.get("merchant_name"),
                            category=category,
                            transaction_date=plaid_transaction["date"],
                            plaid_transaction_id=plaid_transaction["transaction_id"],
                            is_pending=plaid_transaction.get("pending", False)
                        )
                        db.add(transaction)
                        total_synced += 1
                
                # Update account balance
                plaid_account_data = plaid_service.get_accounts(account.access_token)
                for plaid_acc in plaid_account_data:
                    if plaid_acc["account_id"] == account.plaid_account_id:
                        account.current_balance = plaid_acc["balance"]["current"] or 0
                        break
                
            except Exception as e:
                print(f"Error syncing account {account.name}: {str(e)}")
                continue
        
        db.commit()
        
        return {
            "message": f"Successfully synced {total_synced} transactions",
            "synced_transactions": total_synced,
            "synced_accounts": len(plaid_accounts)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync transactions: {str(e)}"
        )

@router.get("/linked-accounts")
async def get_linked_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get all Plaid-linked accounts for the user"""
    try:
        plaid_accounts = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.access_token.isnot(None)
        ).all()
        
        return {
            "accounts": [
                {
                    "id": account.id,
                    "name": account.name,
                    "type": account.account_type,
                    "institution": account.institution_name,
                    "balance": account.current_balance,
                    "last_updated": account.updated_at.isoformat() if account.updated_at else None,
                    "is_linked": True
                }
                for account in plaid_accounts
            ],
            "total_accounts": len(plaid_accounts)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get linked accounts: {str(e)}"
        )
