from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.user import User
from app.models.budget import Budget, Goal, BudgetPeriod
from app.models.transaction import Transaction, TransactionCategory
from app.utils.auth import get_current_active_user

router = APIRouter()


class BudgetCreate(BaseModel):
    name: str
    category: TransactionCategory
    amount: float
    period: BudgetPeriod = BudgetPeriod.MONTHLY
    start_date: datetime = None
    end_date: datetime = None


class GoalCreate(BaseModel):
    name: str
    description: str = None
    target_amount: float
    target_date: datetime = None


@router.get("/")
async def get_budgets(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    is_active: bool = Query(True)
) -> Any:
    """
    Get user's budgets
    """
    query = db.query(Budget).filter(Budget.user_id == current_user.id)
    
    if is_active is not None:
        query = query.filter(Budget.is_active == is_active)
    
    budgets = query.all()
    
    budget_list = []
    for budget in budgets:
        # Calculate spent amount for this budget
        spent = db.query(func.sum(Transaction.amount)).filter(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.category == budget.category,
                Transaction.transaction_date >= budget.start_date,
                Transaction.transaction_date <= budget.end_date,
                Transaction.amount > 0
            )
        ).scalar() or 0
        
        remaining = float(budget.amount) - float(spent)
        percentage_used = (float(spent) / float(budget.amount)) * 100 if budget.amount > 0 else 0
        
        budget_list.append({
            "id": budget.id,
            "name": budget.name,
            "category": budget.category.value,
            "amount": float(budget.amount),
            "period": budget.period.value,
            "start_date": budget.start_date,
            "end_date": budget.end_date,
            "spent_amount": float(spent),
            "remaining_amount": remaining,
            "percentage_used": percentage_used,
            "is_active": budget.is_active,
            "auto_renew": budget.auto_renew,
            "alert_threshold": float(budget.alert_threshold),
            "over_budget": spent > budget.amount,
            "created_at": budget.created_at
        })
    
    return {
        "budgets": budget_list,
        "total_budgets": len(budget_list)
    }


@router.post("/")
async def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new budget
    """
    # Set default dates if not provided
    if not budget_data.start_date:
        budget_data.start_date = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    if not budget_data.end_date:
        if budget_data.period == BudgetPeriod.MONTHLY:
            # End of current month
            next_month = budget_data.start_date.replace(day=28) + timedelta(days=4)
            budget_data.end_date = next_month - timedelta(days=next_month.day)
        elif budget_data.period == BudgetPeriod.WEEKLY:
            budget_data.end_date = budget_data.start_date + timedelta(days=6)
        elif budget_data.period == BudgetPeriod.YEARLY:
            budget_data.end_date = budget_data.start_date.replace(year=budget_data.start_date.year + 1) - timedelta(days=1)
        else:  # QUARTERLY
            budget_data.end_date = budget_data.start_date + timedelta(days=90)
    
    budget = Budget(
        user_id=current_user.id,
        name=budget_data.name,
        category=budget_data.category,
        amount=budget_data.amount,
        period=budget_data.period,
        start_date=budget_data.start_date,
        end_date=budget_data.end_date,
        spent_amount=0.00,
        remaining_amount=budget_data.amount
    )
    
    db.add(budget)
    db.commit()
    db.refresh(budget)
    
    return {
        "message": "Budget created successfully",
        "budget": {
            "id": budget.id,
            "name": budget.name,
            "category": budget.category.value,
            "amount": float(budget.amount),
            "period": budget.period.value,
            "start_date": budget.start_date,
            "end_date": budget.end_date
        }
    }


@router.get("/goals")
async def get_goals(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    is_active: bool = Query(True)
) -> Any:
    """
    Get user's savings goals
    """
    query = db.query(Goal).filter(Goal.user_id == current_user.id)
    
    if is_active is not None:
        query = query.filter(Goal.is_active == is_active)
    
    goals = query.all()
    
    goal_list = []
    for goal in goals:
        progress_percentage = (float(goal.current_amount) / float(goal.target_amount)) * 100
        remaining = float(goal.target_amount) - float(goal.current_amount)
        
        goal_list.append({
            "id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "target_amount": float(goal.target_amount),
            "current_amount": float(goal.current_amount),
            "remaining_amount": remaining,
            "progress_percentage": progress_percentage,
            "target_date": goal.target_date,
            "is_active": goal.is_active,
            "is_achieved": goal.is_achieved,
            "achieved_date": goal.achieved_date,
            "created_at": goal.created_at
        })
    
    return {
        "goals": goal_list,
        "total_goals": len(goal_list)
    }


@router.post("/goals")
async def create_goal(
    goal_data: GoalCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new savings goal
    """
    goal = Goal(
        user_id=current_user.id,
        name=goal_data.name,
        description=goal_data.description,
        target_amount=goal_data.target_amount,
        current_amount=0.00,
        target_date=goal_data.target_date
    )
    
    db.add(goal)
    db.commit()
    db.refresh(goal)
    
    return {
        "message": "Goal created successfully",
        "goal": {
            "id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "target_amount": float(goal.target_amount),
            "current_amount": float(goal.current_amount),
            "target_date": goal.target_date
        }
    }


@router.put("/{budget_id}")
async def update_budget(
    budget_id: int,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    name: str = None,
    amount: float = None,
    is_active: bool = None
) -> Any:
    """
    Update budget information
    """
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    if name is not None:
        budget.name = name
    if amount is not None:
        budget.amount = amount
        budget.remaining_amount = amount - budget.spent_amount
    if is_active is not None:
        budget.is_active = is_active
    
    db.commit()
    db.refresh(budget)
    
    return {
        "message": "Budget updated successfully",
        "budget": {
            "id": budget.id,
            "name": budget.name,
            "amount": float(budget.amount),
            "is_active": budget.is_active
        }
    }


@router.put("/goals/{goal_id}")
async def update_goal(
    goal_id: int,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    current_amount: float = None,
    target_amount: float = None,
    is_active: bool = None
) -> Any:
    """
    Update goal information
    """
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if current_amount is not None:
        goal.current_amount = current_amount
        # Check if goal is achieved
        if current_amount >= goal.target_amount and not goal.is_achieved:
            goal.is_achieved = True
            goal.achieved_date = datetime.now()
    
    if target_amount is not None:
        goal.target_amount = target_amount
        # Reset achievement status if target changed
        if goal.current_amount < target_amount:
            goal.is_achieved = False
            goal.achieved_date = None
    
    if is_active is not None:
        goal.is_active = is_active
    
    db.commit()
    db.refresh(goal)
    
    return {
        "message": "Goal updated successfully",
        "goal": {
            "id": goal.id,
            "current_amount": float(goal.current_amount),
            "target_amount": float(goal.target_amount),
            "is_achieved": goal.is_achieved,
            "is_active": goal.is_active
        }
    }


@router.get("/summary")
async def get_budget_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get overall budget and goals summary
    """
    # Get active budgets
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.is_active == True
    ).all()
    
    total_budgeted = sum(float(b.amount) for b in budgets)
    total_spent = 0
    over_budget_count = 0
    
    for budget in budgets:
        spent = db.query(func.sum(Transaction.amount)).filter(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.category == budget.category,
                Transaction.transaction_date >= budget.start_date,
                Transaction.transaction_date <= budget.end_date,
                Transaction.amount > 0
            )
        ).scalar() or 0
        
        total_spent += float(spent)
        if spent > budget.amount:
            over_budget_count += 1
    
    # Get active goals
    goals = db.query(Goal).filter(
        Goal.user_id == current_user.id,
        Goal.is_active == True
    ).all()
    
    total_goal_target = sum(float(g.target_amount) for g in goals)
    total_goal_current = sum(float(g.current_amount) for g in goals)
    achieved_goals = sum(1 for g in goals if g.is_achieved)
    
    return {
        "budgets": {
            "total_budgets": len(budgets),
            "total_budgeted": total_budgeted,
            "total_spent": total_spent,
            "remaining": total_budgeted - total_spent,
            "over_budget_count": over_budget_count,
            "budget_utilization": (total_spent / total_budgeted * 100) if total_budgeted > 0 else 0
        },
        "goals": {
            "total_goals": len(goals),
            "achieved_goals": achieved_goals,
            "total_target": total_goal_target,
            "total_current": total_goal_current,
            "overall_progress": (total_goal_current / total_goal_target * 100) if total_goal_target > 0 else 0
        }
    }


@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Delete a budget
    """
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(budget)
    db.commit()
    
    return {"message": "Budget deleted successfully"}


@router.delete("/goals/{goal_id}")
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Delete a goal
    """
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    db.delete(goal)
    db.commit()
    
    return {"message": "Goal deleted successfully"}
