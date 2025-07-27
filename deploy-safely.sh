#!/bin/bash

# 🚀 Safe Deployment Script for Strength Training Log
# Ensures data backup before deployment

echo "🚀 Safe Deployment Script"
echo "========================="
echo ""

# בדיקה שהתיקייה הנכונה
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found!"
    echo "   Please run this script from the strengthLog directory"
    exit 1
fi

echo "✅ Found strength training log files"
echo ""

# תזכורת לגיבוי
echo "🛡️  IMPORTANT BACKUP REMINDER"
echo "=============================="
echo ""
echo "⚠️  Before deployment, make sure you have exported your data:"
echo "   1. Open your current app: file://$(pwd)/index.html"
echo "   2. Go to Settings → Export Data"
echo "   3. Save the backup file to a safe location"
echo ""
read -p "✅ Have you exported your data? (y/n): " backup_done

if [ "$backup_done" != "y" ] && [ "$backup_done" != "Y" ]; then
    echo ""
    echo "🛑 Please backup your data first!"
    echo "   Your workouts and exercises are important!"
    echo ""
    echo "   Open this URL in your browser:"
    echo "   file://$(pwd)/index.html"
    echo ""
    exit 1
fi

echo ""
echo "🎯 Choose deployment option:"
echo "1. GitHub Pages (recommended)"
echo "2. Netlify Drag & Drop"
echo "3. Copy files only (for manual upload)"
echo ""
read -p "Select option (1-3): " option

case $option in
    1)
        echo ""
        echo "📚 GitHub Pages Deployment"
        echo "=========================="
        echo ""
        echo "Follow these steps:"
        echo "1. Create a new repository on GitHub.com"
        echo "2. Run these commands:"
        echo ""
        echo "   git init"
        echo "   git add ."
        echo "   git commit -m 'Strength training log app'"
        echo "   git branch -M main"
        echo "   git remote add origin https://github.com/[username]/strengthLog.git"
        echo "   git push -u origin main"
        echo ""
        echo "3. Enable GitHub Pages in repository settings"
        echo "4. Your app will be available at: https://[username].github.io/strengthLog"
        echo ""
        read -p "Ready to initialize git? (y/n): " git_ready

        if [ "$git_ready" == "y" ] || [ "$git_ready" == "Y" ]; then
            if [ ! -d ".git" ]; then
                git init
                echo "✅ Git initialized"
            fi

            git add .
            git commit -m "Strength training log app - $(date)"
            echo ""
            echo "✅ Files committed!"
            echo "📝 Next: Add remote origin and push to GitHub"
        fi
        ;;
    2)
        echo ""
        echo "🌐 Netlify Deployment"
        echo "===================="
        echo ""
        echo "1. Go to https://netlify.com"
        echo "2. Drag and drop this entire folder: $(pwd)"
        echo "3. Your app will be live instantly!"
        echo ""
        echo "📂 Ready to open the folder for you..."
        if command -v open >/dev/null 2>&1; then
            open .
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open .
        fi
        ;;
    3)
        echo ""
        echo "📁 Copy Files"
        echo "============="
        echo ""
        echo "Copy these files to your web server:"
        echo "- index.html"
        echo "- styles.css"
        echo "- script.js"
        echo ""
        echo "That's it! No database or server setup needed."
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "📝 Remember after deployment:"
echo "   1. Open your new website URL"
echo "   2. Go to Settings → Import Data"
echo "   3. Upload your backup file"
echo "   4. Verify all your data is there"
echo ""
echo "🔗 Your data is safe - it's stored in your browser, not in the website files!"
echo ""
echo "Happy training! 💪"