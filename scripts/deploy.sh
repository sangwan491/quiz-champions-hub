#!/bin/bash

echo "🚀 Starting Quiz App Migration to Vercel..."

# Check if required tools are installed
if ! command -v turso &> /dev/null; then
    echo "❌ Turso CLI not found. Installing..."
    npm install -g @turso/cli
fi

if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📦 Installing dependencies..."
npm install @libsql/client

echo "🎯 Setting up Turso database..."
echo "Please follow these steps manually:"
echo "1. Run: turso auth signup (if you haven't already)"
echo "2. Run: turso db create quiz-app-db"
echo "3. Run: turso db show quiz-app-db (copy the URL)"
echo "4. Run: turso db tokens create quiz-app-db (copy the token)"
echo "5. Create .env.local with your values"
echo ""
echo "After completing the above steps, run:"
echo "turso db shell quiz-app-db < db/schema.sql"
echo "turso db shell quiz-app-db < db/migrate.sql"
echo ""
echo "Then run: vercel"
echo "And add your environment variables to Vercel"

echo "✅ Setup files created! Check SETUP.md for detailed instructions." 