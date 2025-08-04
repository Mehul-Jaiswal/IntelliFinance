# IntelliFinance Vercel Deployment Guide

This guide will help you deploy the IntelliFinance application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to a GitHub repository
3. **Database**: Set up a PostgreSQL database (recommended: Supabase, PlanetScale, or Neon)

## Environment Variables

You'll need to set up the following environment variables in your Vercel project:

### Required Variables

```bash
# Security
SECRET_KEY=your-super-secret-key-at-least-32-characters-long
ENCRYPTION_KEY=your-encryption-key-exactly-32-chars

# Database (PostgreSQL recommended for production)
DATABASE_URL=postgresql://username:password@host:port/database_name

# CORS Origins (update with your actual Vercel domain)
BACKEND_CORS_ORIGINS=https://your-app-name.vercel.app,https://localhost:3000
ALLOWED_HOSTS=your-app-name.vercel.app,localhost,127.0.0.1
```

### Optional Variables (for full functionality)

```bash
# Plaid Integration (for bank account linking)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret_key
PLAID_ENV=sandbox  # or 'development' or 'production'

# OpenAI Integration (for AI assistant)
OPENAI_API_KEY=your_openai_api_key

# Redis (for caching - optional)
REDIS_URL=redis://your-redis-url

# Email Configuration (for notifications - optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
EMAILS_FROM_EMAIL=noreply@yourdomain.com
EMAILS_FROM_NAME=IntelliFinance

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn_url
```

## Deployment Steps

### 1. Prepare Your Repository

Make sure your repository has the following structure:
```
your-repo/
├── api/
│   └── index.py
├── backend/
│   └── app/
│       ├── main.py
│       └── ...
├── frontend/
│   ├── package.json
│   ├── src/
│   └── ...
├── vercel.json
├── requirements.txt
└── DEPLOYMENT.md
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the configuration from `vercel.json`

### 3. Configure Environment Variables

1. In your Vercel project dashboard, go to "Settings" → "Environment Variables"
2. Add all the required environment variables listed above
3. Make sure to set them for all environments (Production, Preview, Development)

### 4. Database Setup

#### Option 1: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your PostgreSQL connection string from Settings → Database
3. Set it as your `DATABASE_URL` environment variable

#### Option 2: PlanetScale
1. Go to [planetscale.com](https://planetscale.com) and create a database
2. Get the connection string and set it as `DATABASE_URL`

#### Option 3: Neon
1. Go to [neon.tech](https://neon.tech) and create a database
2. Get the connection string and set it as `DATABASE_URL`

### 5. Deploy

1. Push your code to the main branch
2. Vercel will automatically deploy your application
3. The deployment will:
   - Build the React frontend
   - Set up the FastAPI backend as serverless functions
   - Configure routing between frontend and backend

### 6. Post-Deployment Setup

After successful deployment:

1. **Database Migration**: You may need to run database migrations manually
2. **Test API Endpoints**: Visit `https://your-app.vercel.app/api/v1/docs` to test the API
3. **Test Frontend**: Visit `https://your-app.vercel.app` to test the full application

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are listed in `requirements.txt`
   - Ensure Python version compatibility (using Python 3.9)

2. **Database Connection Issues**
   - Verify your `DATABASE_URL` is correct
   - Make sure your database allows connections from Vercel's IP ranges

3. **CORS Issues**
   - Update `BACKEND_CORS_ORIGINS` to include your Vercel domain
   - Make sure `ALLOWED_HOSTS` includes your domain

4. **Environment Variables**
   - Double-check all required environment variables are set
   - Ensure no typos in variable names

### Logs and Debugging

1. **Function Logs**: Go to your Vercel dashboard → Functions tab to see backend logs
2. **Build Logs**: Check the deployment logs in the Vercel dashboard
3. **Runtime Logs**: Use `vercel logs` CLI command for real-time logs

## Performance Considerations

1. **Cold Starts**: Serverless functions may have cold start delays
2. **Database Connections**: Use connection pooling for better performance
3. **Static Assets**: Frontend assets are served from Vercel's CDN automatically

## Security Notes

1. **Environment Variables**: Never commit sensitive data to your repository
2. **HTTPS**: Vercel provides HTTPS by default
3. **CORS**: Properly configure CORS origins for security
4. **Database**: Use strong passwords and enable SSL for database connections

## Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `BACKEND_CORS_ORIGINS` and `ALLOWED_HOSTS` with your new domain

## Monitoring and Analytics

Consider setting up:
1. **Sentry** for error monitoring
2. **Vercel Analytics** for performance insights
3. **Database monitoring** through your database provider

## Support

If you encounter issues:
1. Check Vercel's documentation
2. Review the deployment logs
3. Test locally first to isolate issues
4. Check the GitHub repository for updates
