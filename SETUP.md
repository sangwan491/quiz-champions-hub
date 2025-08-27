# Quiz App Migration to Vercel Full-Stack Setup Guide

## Step 1: Set Up Turso Database

1. **Install Turso CLI:**
   ```bash
   npm install -g @turso/cli
   ```

2. **Create a Turso account and database:**
   ```bash
   turso auth signup
   turso db create quiz-app-db
   ```

3. **Get database URL and auth token:**
   ```bash
   turso db show quiz-app-db
   turso db tokens create quiz-app-db
   ```

4. **Create `.env.local` file in your project root:**
   ```bash
   # Copy and paste your actual values
   TURSO_DATABASE_URL=libsql://your-database-name.turso.io
   TURSO_AUTH_TOKEN=your_auth_token_here
   ```

## Step 2: Initialize Database Schema

1. **Run the schema creation:**
   ```bash
   turso db shell quiz-app-db < db/schema.sql
   ```

2. **Migrate existing data:**
   ```bash
   turso db shell quiz-app-db < db/migrate.sql
   ```

## Step 3: Install Dependencies

```bash
npm install @libsql/client
```

## Step 4: Update Vite Configuration

The Vite config needs to be updated to remove the proxy since we're now using Vercel API routes.

## Step 5: Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Add environment variables to Vercel:**
   ```bash
   vercel env add TURSO_DATABASE_URL
   vercel env add TURSO_AUTH_TOKEN
   ```

## Step 6: Test the Migration

After deployment, test all functionality:
- User registration
- Quiz creation
- Session management
- Quiz taking
- Results submission
- Leaderboards

## Performance Benefits

With this setup, you'll get:
- **~50-100ms latency** globally (edge deployment)
- **Automatic scaling** during traffic spikes
- **Zero server management**
- **Built-in caching** at edge locations
- **99.99% uptime** SLA

## Troubleshooting

If you encounter issues:
1. Check Vercel function logs: `vercel logs`
2. Verify environment variables are set
3. Test database connection locally first
4. Ensure all API routes are working in development

## Cost Estimate

- **Vercel**: Free tier (sufficient for most events)
- **Turso**: Free tier (500K rows, 9GB storage)
- **Total**: $0/month for moderate usage 