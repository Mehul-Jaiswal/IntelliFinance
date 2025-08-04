from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, accounts, transactions, budgets, goals, ai_assistant, plaid

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(ai_assistant.router, prefix="/ai", tags=["ai-assistant"])
api_router.include_router(plaid.router, prefix="/plaid", tags=["plaid-integration"])
