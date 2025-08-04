from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionCategory
from app.models.account import Account
from app.utils.auth import get_current_active_user

router = APIRouter()


class TransactionCreate(BaseModel):
    account_id: int
    amount: float
    transaction_type: TransactionType
    description: str
    merchant_name: str = None
    category: TransactionCategory = TransactionCategory.UNCATEGORIZED
    transaction_date: datetime = None


@router.get("/")
async def get_transactions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    account_id: Optional[int] = Query(None),
    category: Optional[TransactionCategory] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0)
) -> Any:
    """
    Get user's transactions with optional filters
    """
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    
    if category:
        query = query.filter(Transaction.category == category)
    
    transactions = query.order_by(desc(Transaction.transaction_date)).offset(offset).limit(limit).all()
    
    transaction_list = []
    for transaction in transactions:
        transaction_list.append({
            "id": transaction.id,
            "account_id": transaction.account_id,
            "amount": float(transaction.amount),
            "transaction_type": transaction.transaction_type.value,
            "description": transaction.description,
            "merchant_name": transaction.merchant_name,
            "category": transaction.category.value,
            "transaction_date": transaction.transaction_date,
            "is_pending": transaction.is_pending,
            "is_recurring": transaction.is_recurring,
            "is_anomaly": transaction.is_anomaly,
            "confidence_score": float(transaction.confidence_score) if transaction.confidence_score else None,
            "created_at": transaction.created_at
        })
    
    return {
        "transactions": transaction_list,
        "count": len(transaction_list),
        "offset": offset,
        "limit": limit
    }


@router.post("/")
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new transaction
    """
    # Verify account belongs to user
    account = db.query(Account).filter(
        Account.id == transaction_data.account_id,
        Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    transaction = Transaction(
        user_id=current_user.id,
        account_id=transaction_data.account_id,
        amount=transaction_data.amount,
        transaction_type=transaction_data.transaction_type,
        description=transaction_data.description,
        merchant_name=transaction_data.merchant_name,
        category=transaction_data.category,
        transaction_date=transaction_data.transaction_date or datetime.now(),
        is_pending=False
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return {
        "message": "Transaction created successfully",
        "transaction": {
            "id": transaction.id,
            "amount": float(transaction.amount),
            "description": transaction.description,
            "category": transaction.category.value,
            "transaction_date": transaction.transaction_date
        }
    }


@router.get("/{transaction_id}")
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get specific transaction details
    """
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {
        "id": transaction.id,
        "account_id": transaction.account_id,
        "amount": float(transaction.amount),
        "transaction_type": transaction.transaction_type.value,
        "description": transaction.description,
        "merchant_name": transaction.merchant_name,
        "category": transaction.category.value,
        "subcategory": transaction.subcategory,
        "transaction_date": transaction.transaction_date,
        "is_pending": transaction.is_pending,
        "is_recurring": transaction.is_recurring,
        "is_anomaly": transaction.is_anomaly,
        "confidence_score": float(transaction.confidence_score) if transaction.confidence_score else None,
        "notes": transaction.notes,
        "tags": transaction.tags,
        "created_at": transaction.created_at,
        "updated_at": transaction.updated_at
    }


@router.put("/{transaction_id}")
async def update_transaction(
    transaction_id: int,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    category: TransactionCategory = None,
    description: str = None,
    notes: str = None
) -> Any:
    """
    Update transaction information
    """
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if category is not None:
        transaction.category = category
    if description is not None:
        transaction.description = description
    if notes is not None:
        transaction.notes = notes
    
    db.commit()
    db.refresh(transaction)
    
    return {
        "message": "Transaction updated successfully",
        "transaction": {
            "id": transaction.id,
            "category": transaction.category.value,
            "description": transaction.description,
            "notes": transaction.notes
        }
    }


@router.get("/categories/summary")
async def get_category_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
) -> Any:
    """
    Get spending summary by category
    """
    query = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.amount > 0  # Only expenses
    )
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    transactions = query.all()
    
    category_summary = {}
    for transaction in transactions:
        category = transaction.category.value
        if category not in category_summary:
            category_summary[category] = {
                "total": 0.0,
                "count": 0,
                "average": 0.0
            }
        
        category_summary[category]["total"] += float(transaction.amount)
        category_summary[category]["count"] += 1
    
    # Calculate averages
    for category in category_summary:
        if category_summary[category]["count"] > 0:
            category_summary[category]["average"] = (
                category_summary[category]["total"] / category_summary[category]["count"]
            )
    
    # Sort by total spending
    sorted_categories = sorted(
        category_summary.items(),
        key=lambda x: x[1]["total"],
        reverse=True
    )
    
    return {
        "categories": dict(sorted_categories),
        "total_categories": len(category_summary),
        "period": {
            "start_date": start_date,
            "end_date": end_date
        }
    }


@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Delete a transaction
    """
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    
    return {"message": "Transaction deleted successfully"}
