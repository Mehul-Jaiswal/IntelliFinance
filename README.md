# IntelliFinance 💰

**Your AI-powered personal finance companion that actually makes sense of your money**

Ever looked at your bank account and wondered where all your money went? Yeah, me too. That's why I built IntelliFinance - a personal finance app that doesn't just track your spending, but actually helps you understand it and make better decisions.

![IntelliFinance Dashboard](https://intelli-finance.vercel.app/screenshot.png)

## What makes this different?

Most finance apps just show you pretty charts of how broke you are. IntelliFinance goes deeper:

- **Smart categorization**: It learns how you spend and automatically sorts your transactions
- **AI assistant**: Ask it anything about your finances in plain English
- **Real insights**: Not just "you spent $500 on food" but "you're spending 23% more on takeout since working from home"
- **Actually useful budgets**: Based on your real spending patterns, not some generic template

## The story behind it

I got tired of switching between 5 different apps to understand my finances. Mint was clunky, YNAB was too rigid, and everything else was either too simple or too complicated. So I built something that works the way I think about money.

## What you can do with it

### 🏦 Connect your accounts
Link your bank accounts, credit cards, whatever. It pulls in all your transactions automatically so you don't have to manually enter every coffee purchase.

### 🤖 Chat with your money
"How much did I spend on groceries last month?" "Am I on track with my budget?" "What's my biggest expense?" Just ask - the AI gets it.

### 📊 See where your money goes
Beautiful, actually useful charts that show your spending patterns. No more guessing why your account is empty.

### 🎯 Set goals that work
Want to save for a vacation? Buy a car? The app tracks your progress and tells you if you're on track.

### 💡 Get smart suggestions
"You usually spend $200 on dining out, but you're at $300 this month" - that kind of helpful nudge.

## Tech stuff (for the nerds)

**Frontend**: React with TypeScript, Material-UI for the pretty interface
**Backend**: Python FastAPI because it's fast and I like Python
**Database**: PostgreSQL for the important stuff, Redis for caching
**AI**: OpenAI for the chat, custom ML models for categorization
**Deployment**: Vercel because it just works

## Getting started

### The easy way (just use it)
Go to [intelli-finance.vercel.app](https://intelli-finance.vercel.app) and sign up. That's it.

### The developer way (run it yourself)

```bash
# Clone it
git clone https://github.com/Mehul-Jaiswal/IntelliFinance.git
cd IntelliFinance

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your stuff
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm start
```

Visit `localhost:3000` and you're good to go.

## What's working right now

✅ **User accounts** - Sign up, log in, all that basic stuff
✅ **Transaction tracking** - Add transactions manually or connect accounts
✅ **Smart categorization** - AI figures out what you spent money on
✅ **Budgets & goals** - Set them, track them, achieve them
✅ **AI chat** - Ask questions about your finances
✅ **Beautiful dashboard** - See everything at a glance
✅ **Mobile friendly** - Works on your phone too

## What's coming next

🚧 **Bank integrations** - More banks, better sync
🚧 **Smarter AI** - Better insights, more helpful suggestions
🚧 **Investment tracking** - Stocks, crypto, all that fun stuff
🚧 **Bill reminders** - Never miss a payment again
🚧 **Spending alerts** - "Hey, you're about to blow your budget"

## Want to help?

Found a bug? Have an idea? Want to contribute code? 

- **Issues**: [Report bugs here](https://github.com/Mehul-Jaiswal/IntelliFinance/issues)
- **Ideas**: [Share suggestions here](https://github.com/Mehul-Jaiswal/IntelliFinance/discussions)
- **Code**: Fork it, make it better, send a PR

## The fine print

This is open source (MIT license), so you can do whatever you want with it. Your financial data is encrypted and secure - I'm not interested in knowing how much you spend on coffee.

## Questions?

- **Email**: mehul@jaiswal.com
- **GitHub**: [Mehul-Jaiswal](https://github.com/Mehul-Jaiswal)

---

Built with ☕ and late nights by [Mehul](https://github.com/Mehul-Jaiswal)

*"Finally, a finance app that doesn't make me want to throw my laptop out the window"* - Me, probably
