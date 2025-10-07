#!/bin/bash

# Vercel Deployment Script for Marina Management Portal

echo "🚀 Starting Vercel deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Configure your database connection"
echo "3. Test your deployment"
echo ""
echo "📖 See VERCEL_DEPLOYMENT.md for detailed instructions"
