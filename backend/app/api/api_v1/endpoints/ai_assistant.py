from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User
from app.utils.auth import get_current_active_user
from app.services.ai_assistant import AIAssistant

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    query: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Chat with AI financial assistant
    """
    try:
        assistant = AIAssistant(db, current_user)
        response_data = assistant.process_query(request.message)
        
        # Convert the response data to a readable string
        if isinstance(response_data, dict):
            if "message" in response_data:
                response_text = response_data["message"]
            elif "error" in response_data:
                response_text = f"I'm sorry, but I encountered an error: {response_data['error']}"
            else:
                # Format the response data into a readable message
                response_text = format_response_to_text(response_data)
        else:
            response_text = str(response_data)
        
        return ChatResponse(
            response=response_text,
            query=request.message
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        )


def format_response_to_text(data: dict) -> str:
    """Convert response data dictionary to readable text"""
    if not data:
        return "I don't have enough information to answer that question."
    
    # Handle different types of responses
    if "total_spent" in data:
        return f"You spent ${data['total_spent']:.2f} in total."
    
    if "budgets" in data:
        budgets = data["budgets"]
        if not budgets:
            return "You don't have any active budgets set up."
        
        budget_info = []
        for budget in budgets:
            status = "over budget" if budget.get("spent", 0) > budget.get("amount", 0) else "on track"
            budget_info.append(f"• {budget.get('name', 'Budget')}: ${budget.get('spent', 0):.2f} of ${budget.get('amount', 0):.2f} ({status})")
        
        return "Here's your budget status:\n" + "\n".join(budget_info)
    
    if "transactions" in data:
        transactions = data["transactions"]
        if not transactions:
            return "No transactions found matching your criteria."
        
        return f"I found {len(transactions)} transactions matching your request."
    
    if "goals" in data:
        goals = data["goals"]
        if not goals:
            return "You don't have any savings goals set up."
        
        goal_info = []
        for goal in goals:
            progress = (goal.get("current_amount", 0) / goal.get("target_amount", 1)) * 100
            goal_info.append(f"• {goal.get('name', 'Goal')}: ${goal.get('current_amount', 0):.2f} of ${goal.get('target_amount', 0):.2f} ({progress:.1f}% complete)")
        
        return "Here's your savings goals progress:\n" + "\n".join(goal_info)
    
    if "categories" in data:
        categories = data["categories"]
        if not categories:
            return "No spending categories found."
        
        top_category = max(categories, key=lambda x: x.get("amount", 0))
        return f"Your biggest expense category is {top_category.get('name', 'Unknown')} with ${top_category.get('amount', 0):.2f} spent."
    
    # Default fallback
    return "I've processed your request, but I'm having trouble formatting the response. Please try rephrasing your question."


@router.get("/suggestions")
async def get_suggestions(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get suggested queries for the AI assistant
    """
    return {
        "suggestions": [
            "How much did I spend on groceries last month?",
            "Show me my budget status",
            "What's my biggest expense category this year?",
            "Find all transactions at Starbucks",
            "How are my savings goals doing?",
            "Should I increase my grocery budget?",
            "What can I do to save more money?",
            "Show me unusual transactions this month"
        ],
        "categories": [
            {
                "name": "Spending Analysis",
                "queries": [
                    "How much did I spend last month?",
                    "What's my biggest expense category?",
                    "Show me my spending trends"
                ]
            },
            {
                "name": "Budget Management",
                "queries": [
                    "Show me my budget status",
                    "Am I over budget this month?",
                    "How much budget do I have left?"
                ]
            },
            {
                "name": "Transaction Search",
                "queries": [
                    "Find transactions at [merchant]",
                    "Show me all restaurant expenses",
                    "Find large transactions this month"
                ]
            },
            {
                "name": "Financial Advice",
                "queries": [
                    "How can I save more money?",
                    "Should I increase my budget?",
                    "What's my financial health like?"
                ]
            },
            {
                "name": "Goals & Savings",
                "queries": [
                    "How are my savings goals?",
                    "When will I reach my goal?",
                    "How much should I save monthly?"
                ]
            }
        ]
    }


@router.get("/insights")
async def get_financial_insights(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get AI-generated financial insights
    """
    try:
        assistant = AIAssistant(db, current_user)
        
        # Generate multiple insights
        insights = []
        
        # Spending insight
        spending_response = assistant.process_query("How much did I spend last month?")
        if spending_response.get("total_spent", 0) > 0:
            insights.append({
                "type": "spending",
                "title": "Monthly Spending Summary",
                "data": spending_response
            })
        
        # Budget insight
        budget_response = assistant.process_query("Show me my budget status")
        if budget_response.get("budgets"):
            insights.append({
                "type": "budget",
                "title": "Budget Status",
                "data": budget_response
            })
        
        # Category insight
        category_response = assistant.process_query("What's my biggest expense category?")
        if category_response.get("categories"):
            insights.append({
                "type": "category",
                "title": "Spending by Category",
                "data": category_response
            })
        
        # Goals insight
        goals_response = assistant.process_query("How are my savings goals doing?")
        if goals_response.get("goals"):
            insights.append({
                "type": "goals",
                "title": "Savings Goals Progress",
                "data": goals_response
            })
        
        return {
            "insights": insights,
            "generated_at": "2024-01-01T00:00:00Z"  # You'd use actual timestamp
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating insights: {str(e)}"
        )
