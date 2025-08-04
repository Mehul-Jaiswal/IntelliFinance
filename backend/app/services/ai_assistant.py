import openai
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.core.config import settings
from app.models.user import User
from app.models.transaction import Transaction, TransactionCategory
from app.models.account import Account
from app.models.budget import Budget, Goal


class AIAssistant:
    """
    Conversational AI Assistant for financial queries
    """
    
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        
    def process_query(self, query: str) -> Dict[str, Any]:
        """
        Process natural language financial query
        """
        # Analyze query intent
        intent = self._analyze_intent(query)
        
        # Execute appropriate function based on intent
        if intent == "spending_summary":
            return self._get_spending_summary(query)
        elif intent == "budget_status":
            return self._get_budget_status(query)
        elif intent == "transaction_search":
            return self._search_transactions(query)
        elif intent == "financial_advice":
            return self._get_financial_advice(query)
        elif intent == "goal_progress":
            return self._get_goal_progress(query)
        elif intent == "category_analysis":
            return self._analyze_category_spending(query)
        elif intent == "net_worth":
            return self._calculate_net_worth(query)
        elif intent == "account_summary":
            return self._get_account_summary(query)
        else:
            return self._general_chat(query)
    
    def _analyze_intent(self, query: str) -> str:
        """
        Analyze user query to determine intent
        """
        query_lower = query.lower()
        
        # Simple keyword-based intent detection
        if any(word in query_lower for word in ["net worth", "worth", "assets", "liabilities"]):
            return "net_worth"
        elif any(word in query_lower for word in ["account", "accounts", "balance", "balances"]):
            return "account_summary"
        elif any(word in query_lower for word in ["spend", "spent", "spending", "expense"]):
            return "spending_summary"
        elif any(word in query_lower for word in ["budget", "budgets", "remaining"]):
            return "budget_status"
        elif any(word in query_lower for word in ["find", "search", "show me", "transactions"]):
            return "transaction_search"
        elif any(word in query_lower for word in ["advice", "recommend", "suggest", "should i"]):
            return "financial_advice"
        elif any(word in query_lower for word in ["goal", "goals", "save", "saving"]):
            return "goal_progress"
        elif any(word in query_lower for word in ["category", "categories", "groceries", "restaurants"]):
            return "category_analysis"
        else:
            return "general_chat"
    
    def _get_spending_summary(self, query: str) -> Dict[str, Any]:
        """
        Get spending summary based on query
        """
        # Extract time period from query
        time_period = self._extract_time_period(query)
        start_date, end_date = self._get_date_range(time_period)
        
        # Query transactions
        transactions = self.db.query(Transaction).filter(
            and_(
                Transaction.user_id == self.user.id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
                Transaction.amount > 0  # Only expenses
            )
        ).all()
        
        # Calculate totals
        total_spent = sum(t.amount for t in transactions)
        category_totals = {}
        
        for transaction in transactions:
            category = transaction.category.value
            category_totals[category] = category_totals.get(category, 0) + float(transaction.amount)
        
        # Sort categories by spending
        sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
        
        response = {
            "type": "spending_summary",
            "period": time_period,
            "total_spent": float(total_spent),
            "transaction_count": len(transactions),
            "top_categories": sorted_categories[:5],
            "message": f"You spent ${total_spent:.2f} {time_period} across {len(transactions)} transactions."
        }
        
        if sorted_categories:
            top_category = sorted_categories[0]
            response["message"] += f" Your biggest expense category was {top_category[0]} at ${top_category[1]:.2f}."
        
        return response
    
    def _get_budget_status(self, query: str) -> Dict[str, Any]:
        """
        Get budget status information
        """
        # Get current month's budgets
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month_start = (current_month_start + timedelta(days=32)).replace(day=1)
        
        budgets = self.db.query(Budget).filter(
            and_(
                Budget.user_id == self.user.id,
                Budget.is_active == True,
                Budget.start_date <= current_month_start,
                Budget.end_date >= current_month_start
            )
        ).all()
        
        budget_status = []
        total_budgeted = 0
        total_spent = 0
        
        for budget in budgets:
            # Calculate spent amount for this budget category
            spent = self.db.query(func.sum(Transaction.amount)).filter(
                and_(
                    Transaction.user_id == self.user.id,
                    Transaction.category == budget.category,
                    Transaction.transaction_date >= budget.start_date,
                    Transaction.transaction_date <= budget.end_date,
                    Transaction.amount > 0
                )
            ).scalar() or 0
            
            remaining = float(budget.amount) - float(spent)
            percentage_used = (float(spent) / float(budget.amount)) * 100 if budget.amount > 0 else 0
            
            budget_status.append({
                "category": budget.category.value,
                "budgeted": float(budget.amount),
                "spent": float(spent),
                "remaining": remaining,
                "percentage_used": percentage_used,
                "over_budget": spent > budget.amount
            })
            
            total_budgeted += float(budget.amount)
            total_spent += float(spent)
        
        return {
            "type": "budget_status",
            "budgets": budget_status,
            "total_budgeted": total_budgeted,
            "total_spent": total_spent,
            "overall_remaining": total_budgeted - total_spent,
            "message": f"You have {len(budgets)} active budgets. You've spent ${total_spent:.2f} out of ${total_budgeted:.2f} budgeted this month."
        }
    
    def _search_transactions(self, query: str) -> Dict[str, Any]:
        """
        Search transactions based on query
        """
        # Extract search terms and filters
        search_terms = self._extract_search_terms(query)
        time_period = self._extract_time_period(query)
        start_date, end_date = self._get_date_range(time_period)
        
        # Build query
        transaction_query = self.db.query(Transaction).filter(
            and_(
                Transaction.user_id == self.user.id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date
            )
        )
        
        # Add search filters
        if search_terms:
            search_filter = or_(
                Transaction.description.ilike(f"%{term}%") for term in search_terms
            )
            if any(term in [cat.value for cat in TransactionCategory] for term in search_terms):
                category_filter = or_(
                    Transaction.category == term for term in search_terms 
                    if term in [cat.value for cat in TransactionCategory]
                )
                search_filter = or_(search_filter, category_filter)
            
            transaction_query = transaction_query.filter(search_filter)
        
        transactions = transaction_query.order_by(Transaction.transaction_date.desc()).limit(20).all()
        
        transaction_list = []
        for t in transactions:
            transaction_list.append({
                "date": t.transaction_date.strftime("%Y-%m-%d"),
                "description": t.description,
                "amount": float(t.amount),
                "category": t.category.value,
                "merchant": t.merchant_name
            })
        
        return {
            "type": "transaction_search",
            "transactions": transaction_list,
            "count": len(transaction_list),
            "search_terms": search_terms,
            "message": f"Found {len(transaction_list)} transactions matching your search."
        }
    
    def _get_financial_advice(self, query: str) -> Dict[str, Any]:
        """
        Provide AI-powered financial advice
        """
        if not self.client:
            return {
                "type": "financial_advice",
                "message": "AI assistant is not configured. Please set up OpenAI API key.",
                "advice": []
            }
        
        # Get user's financial context
        context = self._get_financial_context()
        
        # Create prompt for GPT
        prompt = f"""
        You are a personal finance advisor. Based on the user's financial data, provide helpful advice.
        
        User's Financial Context:
        - Monthly Income: Estimated based on deposits
        - Total Accounts: {context['account_count']}
        - Recent Spending: ${context['recent_spending']:.2f} in the last 30 days
        - Top Spending Categories: {', '.join(context['top_categories'][:3])}
        - Active Budgets: {context['budget_count']}
        - Savings Goals: {context['goal_count']}
        
        User Question: {query}
        
        Provide specific, actionable financial advice in 2-3 sentences.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful personal finance advisor."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            advice = response.choices[0].message.content.strip()
            
            return {
                "type": "financial_advice",
                "message": advice,
                "context": context
            }
            
        except Exception as e:
            return {
                "type": "financial_advice",
                "message": "I'm having trouble accessing my AI capabilities right now. Please try again later.",
                "error": str(e)
            }
    
    def _get_goal_progress(self, query: str) -> Dict[str, Any]:
        """
        Get savings goal progress
        """
        goals = self.db.query(Goal).filter(
            and_(
                Goal.user_id == self.user.id,
                Goal.is_active == True
            )
        ).all()
        
        goal_progress = []
        for goal in goals:
            progress_percentage = (float(goal.current_amount) / float(goal.target_amount)) * 100
            remaining = float(goal.target_amount) - float(goal.current_amount)
            
            goal_progress.append({
                "name": goal.name,
                "target_amount": float(goal.target_amount),
                "current_amount": float(goal.current_amount),
                "remaining": remaining,
                "progress_percentage": progress_percentage,
                "target_date": goal.target_date.strftime("%Y-%m-%d") if goal.target_date else None
            })
        
        return {
            "type": "goal_progress",
            "goals": goal_progress,
            "message": f"You have {len(goals)} active savings goals."
        }
    
    def _analyze_category_spending(self, query: str) -> Dict[str, Any]:
        """
        Analyze spending by category
        """
        time_period = self._extract_time_period(query)
        start_date, end_date = self._get_date_range(time_period)
        
        # Get category spending
        category_spending = self.db.query(
            Transaction.category,
            func.sum(Transaction.amount).label('total'),
            func.count(Transaction.id).label('count')
        ).filter(
            and_(
                Transaction.user_id == self.user.id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
                Transaction.amount > 0
            )
        ).group_by(Transaction.category).all()
        
        categories = []
        for cat, total, count in category_spending:
            categories.append({
                "category": cat.value,
                "total": float(total),
                "transaction_count": count,
                "average_per_transaction": float(total) / count if count > 0 else 0
            })
        
        # Sort by total spending
        categories.sort(key=lambda x: x['total'], reverse=True)
        
        return {
            "type": "category_analysis",
            "period": time_period,
            "categories": categories,
            "message": f"Here's your spending breakdown by category for {time_period}."
        }
    
    def _general_chat(self, query: str) -> Dict[str, Any]:
        """
        Handle general chat queries
        """
        return {
            "type": "general_chat",
            "message": "I'm your personal finance assistant! I can help you with spending summaries, budget tracking, transaction searches, and financial advice. What would you like to know about your finances?",
            "suggestions": [
                "How much did I spend last month?",
                "Show me my budget status",
                "Find transactions at Starbucks",
                "What's my biggest expense category?",
                "How are my savings goals doing?"
            ]
        }
    
    def _extract_time_period(self, query: str) -> str:
        """
        Extract time period from query
        """
        query_lower = query.lower()
        
        if "last month" in query_lower or "previous month" in query_lower:
            return "last month"
        elif "this month" in query_lower or "current month" in query_lower:
            return "this month"
        elif "last week" in query_lower:
            return "last week"
        elif "this week" in query_lower:
            return "this week"
        elif "last year" in query_lower:
            return "last year"
        elif "this year" in query_lower:
            return "this year"
        else:
            return "last 30 days"
    
    def _get_date_range(self, time_period: str) -> tuple:
        """
        Get date range for time period
        """
        now = datetime.now()
        
        if time_period == "this month":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now
        elif time_period == "last month":
            first_day_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = first_day_this_month - timedelta(days=1)
            start_date = end_date.replace(day=1)
        elif time_period == "this week":
            start_date = now - timedelta(days=now.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now
        elif time_period == "last week":
            start_date = now - timedelta(days=now.weekday() + 7)
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59)
        elif time_period == "this year":
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now
        elif time_period == "last year":
            start_date = now.replace(year=now.year-1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(year=now.year-1, month=12, day=31, hour=23, minute=59, second=59)
        else:  # last 30 days
            start_date = now - timedelta(days=30)
            end_date = now
        
        return start_date, end_date
    
    def _extract_search_terms(self, query: str) -> List[str]:
        """
        Extract search terms from query
        """
        # Simple extraction - in production, you'd use NLP
        stop_words = {"show", "me", "find", "search", "for", "transactions", "at", "from", "in", "the", "a", "an"}
        words = query.lower().split()
        search_terms = [word for word in words if word not in stop_words and len(word) > 2]
        return search_terms
    
    def _get_financial_context(self) -> Dict[str, Any]:
        """
        Get user's financial context for AI advice
        """
        # Get recent spending (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        recent_transactions = self.db.query(Transaction).filter(
            and_(
                Transaction.user_id == self.user.id,
                Transaction.transaction_date >= thirty_days_ago,
                Transaction.amount > 0
            )
        ).all()
        
        recent_spending = sum(float(t.amount) for t in recent_transactions)
        
        # Get top categories
        category_totals = {}
        for t in recent_transactions:
            cat = t.category.value
            category_totals[cat] = category_totals.get(cat, 0) + float(t.amount)
        
        top_categories = sorted(category_totals.keys(), key=lambda x: category_totals[x], reverse=True)
        
        # Get counts
        account_count = self.db.query(Account).filter(Account.user_id == self.user.id).count()
        budget_count = self.db.query(Budget).filter(
            and_(Budget.user_id == self.user.id, Budget.is_active == True)
        ).count()
        goal_count = self.db.query(Goal).filter(
            and_(Goal.user_id == self.user.id, Goal.is_active == True)
        ).count()
        
        return {
            "recent_spending": recent_spending,
            "top_categories": top_categories,
            "account_count": account_count,
            "budget_count": budget_count,
            "goal_count": goal_count
        }
    
    def _calculate_net_worth(self, query: str) -> Dict[str, Any]:
        """
        Calculate user's net worth from accounts
        """
        accounts = self.db.query(Account).filter(
            and_(
                Account.user_id == self.user.id,
                Account.is_active == True
            )
        ).all()
        
        assets = 0
        liabilities = 0
        account_details = []
        
        for account in accounts:
            balance = float(account.current_balance)
            account_info = {
                "name": account.name,
                "type": account.account_type,
                "balance": balance,
                "institution": account.institution_name
            }
            
            # Categorize as asset or liability
            if account.account_type.lower() in ['credit_card', 'loan', 'mortgage']:
                liabilities += abs(balance)  # Liabilities are positive amounts owed
                account_info["category"] = "liability"
            else:
                assets += balance
                account_info["category"] = "asset"
            
            account_details.append(account_info)
        
        net_worth = assets - liabilities
        
        return {
            "type": "net_worth",
            "net_worth": net_worth,
            "total_assets": assets,
            "total_liabilities": liabilities,
            "accounts": account_details,
            "message": f"Your current net worth is ${net_worth:,.2f}. You have ${assets:,.2f} in assets and ${liabilities:,.2f} in liabilities across {len(accounts)} accounts."
        }
    
    def _get_account_summary(self, query: str) -> Dict[str, Any]:
        """
        Get summary of all user accounts
        """
        accounts = self.db.query(Account).filter(
            and_(
                Account.user_id == self.user.id,
                Account.is_active == True
            )
        ).all()
        
        account_summary = []
        total_balance = 0
        
        for account in accounts:
            balance = float(account.current_balance)
            total_balance += balance
            
            account_summary.append({
                "name": account.name,
                "type": account.account_type,
                "balance": balance,
                "institution": account.institution_name or "Manual Account",
                "is_linked": not account.is_manual,
                "last_updated": account.updated_at.strftime("%Y-%m-%d") if account.updated_at else "Never"
            })
        
        # Sort by balance (highest first)
        account_summary.sort(key=lambda x: x["balance"], reverse=True)
        
        return {
            "type": "account_summary",
            "accounts": account_summary,
            "total_accounts": len(accounts),
            "total_balance": total_balance,
            "linked_accounts": len([a for a in accounts if not a.is_manual]),
            "manual_accounts": len([a for a in accounts if a.is_manual]),
            "message": f"You have {len(accounts)} accounts with a total balance of ${total_balance:,.2f}. {len([a for a in accounts if not a.is_manual])} are linked via Plaid and {len([a for a in accounts if a.is_manual])} are manual."
        }
