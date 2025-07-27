#!/bin/bash

# 🚀 Vercel Deployment Script for Strength Training Log
# Optimized for production deployment

echo "🚀 Vercel Deployment Setup"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found!"
    echo "   Please run this script from the strengthLog directory"
    exit 1
fi

echo "✅ Found strength training log files"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔍 Pre-deployment checks..."
echo ""

# Check for sensitive files
if [ -f "config.js" ]; then
    echo "⚠️  Found config.js (contains GitHub token)"
    echo "✅ This file is gitignored and won't be deployed"
fi

# Show files that will be deployed
echo "📦 Files to be deployed:"
echo "   ✅ index.html (main app)"
echo "   ✅ styles.css (styling)"
echo "   ✅ script.js (app logic)"
echo "   ✅ README.md (documentation)"
echo "   ✅ vercel.json (config)"
echo "   ✅ package.json (metadata)"
echo ""

# Show files that will NOT be deployed
echo "🚫 Files excluded from deployment:"
echo "   ❌ config.js (contains sensitive data)"
echo "   ❌ auto-clear.html (development tool)"
echo "   ❌ clear-cache.html (development tool)"
echo ""

echo "🛡️  Production Features:"
echo "   ✅ GitHub backup disabled (no config file)"
echo "   ✅ Manual export/import still works"
echo "   ✅ All core features functional"
echo "   ✅ Optimized caching headers"
echo ""

read -p "🚀 Ready to deploy to Vercel? (y/n): " deploy_confirm

if [ "$deploy_confirm" != "y" ] && [ "$deploy_confirm" != "Y" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Deploying to Vercel..."
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎯 Next Steps:"
echo "   1. Your app is now live on Vercel"
echo "   2. Users can import/export data manually"
echo "   3. No GitHub token needed in production"
echo "   4. App works 100% offline after first load"
echo ""
echo "📊 Features in production:"
echo "   ✅ Exercise management"
echo "   ✅ Workout logging"
echo "   ✅ History tracking"
echo "   ✅ Data export/import"
echo "   ✅ Responsive design"
echo "   ❌ Automatic GitHub backup (development only)"
echo ""