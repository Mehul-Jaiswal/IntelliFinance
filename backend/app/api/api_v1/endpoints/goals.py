from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import date

from app.core.database import get_db
from app.models.user import User
from app.models.budget import Goal
from app.utils.auth import get_current_user

router = APIRouter()

class GoalCreate(BaseModel):
    name: str
    description: str = None
    target_amount: float
    target_date: date

class GoalUpdate(BaseModel):
    name: str = None
    description: str = None
    target_amount: float = None
    current_amount: float = None
    target_date: date = None
    is_active: bool = None

class GoalResponse(BaseModel):
    id: int
    name: str
    description: str = None
    target_amount: float
    current_amount: float
    target_date: date
    is_active: bool
    is_completed: bool
    created_at: str
    updated_at: str = None

    class Config:
        from_attributes = True

@router.get("/", response_model=Dict[str, Any])
async def get_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all goals for the current user"""
    try:
        goals = db.query(Goal).filter(
            Goal.user_id == current_user.id,
            Goal.is_active == True
        ).all()
        
        goals_data = []
        for goal in goals:
            goals_data.append({
                "id": goal.id,
                "name": goal.name,
                "description": goal.description,
                "target_amount": float(goal.target_amount),
                "current_amount": float(goal.current_amount),
                "target_date": goal.target_date.isoformat(),
                "is_active": goal.is_active,
                "is_completed": goal.is_achieved,
                "created_at": goal.created_at.isoformat() if goal.created_at else None,
                "updated_at": goal.updated_at.isoformat() if goal.updated_at else None
            })
        
        return {
            "goals": goals_data,
            "total_goals": len(goals_data),
            "active_goals": len([g for g in goals_data if g["is_active"]]),
            "completed_goals": len([g for g in goals_data if g["is_completed"]])
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve goals: {str(e)}"
        )

@router.post("/", response_model=Dict[str, Any])
async def create_goal(
    goal_data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new goal"""
    try:
        goal = Goal(
            user_id=current_user.id,
            name=goal_data.name,
            description=goal_data.description,
            target_amount=goal_data.target_amount,
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
                "target_date": goal.target_date.isoformat(),
                "is_active": goal.is_active,
                "is_completed": goal.is_achieved
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create goal: {str(e)}"
        )

@router.get("/{goal_id}", response_model=Dict[str, Any])
async def get_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific goal"""
    try:
        goal = db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        ).first()
        
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )
        
        return {
            "goal": {
                "id": goal.id,
                "name": goal.name,
                "description": goal.description,
                "target_amount": float(goal.target_amount),
                "current_amount": float(goal.current_amount),
                "target_date": goal.target_date.isoformat(),
                "is_active": goal.is_active,
                "is_completed": goal.is_achieved,
                "created_at": goal.created_at.isoformat() if goal.created_at else None,
                "updated_at": goal.updated_at.isoformat() if goal.updated_at else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve goal: {str(e)}"
        )

@router.put("/{goal_id}", response_model=Dict[str, Any])
async def update_goal(
    goal_id: int,
    goal_data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a goal"""
    try:
        goal = db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        ).first()
        
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )
        
        # Update fields if provided
        if goal_data.name is not None:
            goal.name = goal_data.name
        if goal_data.description is not None:
            goal.description = goal_data.description
        if goal_data.target_amount is not None:
            goal.target_amount = goal_data.target_amount
        if goal_data.current_amount is not None:
            goal.current_amount = goal_data.current_amount
            # Check if goal is completed
            if goal.current_amount >= goal.target_amount:
                goal.is_achieved = True
        if goal_data.target_date is not None:
            goal.target_date = goal_data.target_date
        if goal_data.is_active is not None:
            goal.is_active = goal_data.is_active
        
        db.commit()
        db.refresh(goal)
        
        return {
            "message": "Goal updated successfully",
            "goal": {
                "id": goal.id,
                "name": goal.name,
                "description": goal.description,
                "target_amount": float(goal.target_amount),
                "current_amount": float(goal.current_amount),
                "target_date": goal.target_date.isoformat(),
                "is_active": goal.is_active,
                "is_completed": goal.is_achieved
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update goal: {str(e)}"
        )

@router.delete("/{goal_id}", response_model=Dict[str, Any])
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a goal"""
    try:
        goal = db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        ).first()
        
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )
        
        db.delete(goal)
        db.commit()
        
        return {
            "message": "Goal deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete goal: {str(e)}"
        )

@router.post("/{goal_id}/contribute", response_model=Dict[str, Any])
async def contribute_to_goal(
    goal_id: int,
    amount: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add money to a goal"""
    try:
        goal = db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        ).first()
        
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )
        
        if amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contribution amount must be positive"
            )
        
        goal.current_amount += amount
        
        # Check if goal is completed
        if goal.current_amount >= goal.target_amount:
            goal.is_achieved = True
        
        db.commit()
        db.refresh(goal)
        
        return {
            "message": f"Successfully contributed ${amount:.2f} to goal",
            "goal": {
                "id": goal.id,
                "name": goal.name,
                "current_amount": float(goal.current_amount),
                "target_amount": float(goal.target_amount),
                "is_completed": goal.is_achieved,
                "progress_percentage": min((float(goal.current_amount) / float(goal.target_amount)) * 100, 100)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to contribute to goal: {str(e)}"
        )
