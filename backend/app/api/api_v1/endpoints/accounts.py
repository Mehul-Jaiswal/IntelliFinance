from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User
from app.models.account import Account, AccountType
from app.utils.auth import get_current_active_user

router = APIRouter()


class AccountCreate(BaseModel):
    name: str
    account_type: AccountType
    institution_name: str = None
    is_manual: bool = True


@router.get("/")
async def get_accounts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get user's accounts
    """
    accounts = db.query(Account).filter(
        Account.user_id == current_user.id,
        Account.is_active == True
    ).all()
    
    account_list = []
    for account in accounts:
        account_list.append({
            "id": account.id,
            "name": account.name,
            "account_type": account.account_type.value,
            "institution_name": account.institution_name,
            "current_balance": float(account.current_balance),
            "available_balance": float(account.available_balance) if account.available_balance else None,
            "is_manual": account.is_manual,
            "sync_status": account.sync_status,
            "last_sync": account.last_sync,
            "created_at": account.created_at
        })
    
    return {
        "accounts": account_list,
        "total_accounts": len(account_list)
    }


@router.post("/")
async def create_account(
    account_data: AccountCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new account
    """
    account = Account(
        user_id=current_user.id,
        name=account_data.name,
        account_type=account_data.account_type,
        institution_name=account_data.institution_name,
        is_manual=account_data.is_manual,
        current_balance=0.00,
        sync_status="active" if not account_data.is_manual else "manual"
    )
    
    db.add(account)
    db.commit()
    db.refresh(account)
    
    return {
        "message": "Account created successfully",
        "account": {
            "id": account.id,
            "name": account.name,
            "account_type": account.account_type.value,
            "institution_name": account.institution_name,
            "current_balance": float(account.current_balance),
            "is_manual": account.is_manual
        }
    }


@router.get("/{account_id}")
async def get_account(
    account_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get specific account details
    """
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return {
        "id": account.id,
        "name": account.name,
        "account_type": account.account_type.value,
        "institution_name": account.institution_name,
        "current_balance": float(account.current_balance),
        "available_balance": float(account.available_balance) if account.available_balance else None,
        "credit_limit": float(account.credit_limit) if account.credit_limit else None,
        "is_manual": account.is_manual,
        "sync_status": account.sync_status,
        "last_sync": account.last_sync,
        "created_at": account.created_at,
        "updated_at": account.updated_at
    }


@router.put("/{account_id}")
async def update_account(
    account_id: int,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    name: str = None,
    current_balance: float = None
) -> Any:
    """
    Update account information
    """
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if name is not None:
        account.name = name
    if current_balance is not None:
        account.current_balance = current_balance
    
    db.commit()
    db.refresh(account)
    
    return {
        "message": "Account updated successfully",
        "account": {
            "id": account.id,
            "name": account.name,
            "current_balance": float(account.current_balance)
        }
    }


@router.delete("/{account_id}")
async def delete_account(
    account_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Delete (deactivate) an account
    """
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    account.is_active = False
    db.commit()
    
    return {"message": "Account deleted successfully"}
