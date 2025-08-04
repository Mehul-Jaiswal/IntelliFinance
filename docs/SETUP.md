# IntelliFinance Setup Guide

This guide will help you set up and run the IntelliFinance application locally.

## Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost/intellifinance

# Redis
REDIS_URL=redis://localhost:6379

# Security (Generate secure keys for production)
SECRET_KEY=your-secret-key-change-in-production
ENCRYPTION_KEY=your-encryption-key-32-chars-long

# External APIs (Optional for development)
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox

# OpenAI (Optional for AI features)
OPENAI_API_KEY=your-openai-api-key
```

### 3. Database Setup

Create the PostgreSQL database:

```sql
CREATE DATABASE intellifinance;
```

Initialize Alembic and create tables:

```bash
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### 4. Start the Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation will be available at `http://localhost:8000/docs`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_APP_NAME=IntelliFinance
```

### 3. Start the Frontend Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Development Workflow

### Backend Development

1. **Code Formatting**: Use Black for code formatting
   ```bash
   black app/
   ```

2. **Linting**: Use flake8 for linting
   ```bash
   flake8 app/
   ```

3. **Testing**: Run tests with pytest
   ```bash
   pytest
   ```

4. **Database Migrations**: When you modify models
   ```bash
   alembic revision --autogenerate -m "Description of changes"
   alembic upgrade head
   ```

### Frontend Development

1. **Type Checking**: TypeScript will check types automatically
2. **Linting**: ESLint is configured in the project
3. **Testing**: Run tests with
   ```bash
   npm test
   ```

## Key Features Implementation Status

### ✅ Completed
- Project structure and setup
- Authentication system (JWT-based)
- Database models for users, accounts, transactions, budgets, goals
- REST API endpoints for all major features
- React frontend with Material-UI
- Responsive design with navigation
- AI Assistant interface (UI ready)

### 🚧 In Progress / TODO
- Plaid integration for bank connections
- AI transaction categorization training
- OpenAI integration for conversational AI
- Real-time notifications
- Data visualization charts
- Anomaly detection algorithms
- Financial forecasting models

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh token

### Accounts
- `GET /api/v1/accounts/` - List user accounts
- `POST /api/v1/accounts/` - Create new account
- `GET /api/v1/accounts/{id}` - Get account details
- `PUT /api/v1/accounts/{id}` - Update account
- `DELETE /api/v1/accounts/{id}` - Delete account

### Transactions
- `GET /api/v1/transactions/` - List transactions
- `POST /api/v1/transactions/` - Create transaction
- `GET /api/v1/transactions/{id}` - Get transaction details
- `PUT /api/v1/transactions/{id}` - Update transaction
- `DELETE /api/v1/transactions/{id}` - Delete transaction
- `GET /api/v1/transactions/categories/summary` - Category summary

### Budgets & Goals
- `GET /api/v1/budgets/` - List budgets
- `POST /api/v1/budgets/` - Create budget
- `GET /api/v1/budgets/goals` - List goals
- `POST /api/v1/budgets/goals` - Create goal
- `GET /api/v1/budgets/summary` - Budget and goals summary

### AI Assistant
- `POST /api/v1/ai/chat` - Chat with AI assistant
- `GET /api/v1/ai/suggestions` - Get query suggestions
- `GET /api/v1/ai/insights` - Get financial insights

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Redis Connection Error**
   - Ensure Redis is running
   - Check Redis URL in `.env`

3. **Frontend API Connection Issues**
   - Verify backend is running on port 8000
   - Check CORS settings in backend
   - Verify API URL in frontend `.env`

4. **Import Errors in Python**
   - Ensure you're in the correct virtual environment
   - Check that all dependencies are installed
   - Verify Python path includes the app directory

### Performance Tips

1. **Database**
   - Add indexes for frequently queried fields
   - Use database connection pooling
   - Consider read replicas for heavy read workloads

2. **API**
   - Implement caching with Redis
   - Use pagination for large datasets
   - Add rate limiting for production

3. **Frontend**
   - Implement lazy loading for routes
   - Use React Query for data caching
   - Optimize bundle size with code splitting

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong, unique keys for production
   - Rotate keys regularly

2. **Database**
   - Use encrypted connections
   - Implement proper access controls
   - Regular backups and security updates

3. **API**
   - Implement rate limiting
   - Use HTTPS in production
   - Validate all input data
   - Implement proper error handling

## Deployment

For production deployment, consider:

1. **Backend**: Deploy using Docker, Kubernetes, or cloud services
2. **Frontend**: Build and serve static files via CDN
3. **Database**: Use managed database services
4. **Monitoring**: Implement logging and monitoring solutions
5. **Security**: Use environment-specific configurations

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the API documentation at `/docs`
3. Check the GitHub issues for known problems
4. Create a new issue with detailed information
