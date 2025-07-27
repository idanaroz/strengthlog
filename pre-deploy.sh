#!/bin/bash

# 🚀 Pre-Deployment Test Script
# Runs comprehensive tests before deploying to ensure app quality

set -e  # Exit on any error

echo "🧪 Running Pre-Deployment Tests..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}$message${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_status $RED "❌ Error: Not in project root directory"
    exit 1
fi

print_status $BLUE "📁 Checking project structure..."

# Check required files exist
required_files=(
    "index.html"
    "script.js"
    "styles.css"
    "public/index.html"
    "public/script.js"
    "public/styles.css"
    "api/backup.js"
    "api/backup-status.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status $GREEN "  ✅ $file"
    else
        print_status $RED "  ❌ Missing: $file"
        exit 1
    fi
done

print_status $BLUE "🔍 Running syntax checks..."

# Check for common JavaScript issues
if grep -r "console.log" script.js public/script.js 2>/dev/null | grep -v "// Test" > /dev/null; then
    print_status $YELLOW "  ⚠️ Warning: console.log statements found (consider removing for production)"
fi

# Check for proper API structure
if ! grep -q "module.exports" api/backup.js; then
    print_status $RED "  ❌ api/backup.js missing CommonJS exports"
    exit 1
else
    print_status $GREEN "  ✅ API exports OK"
fi

# Check for environment variable usage
if ! grep -q "process.env" api/backup.js; then
    print_status $RED "  ❌ api/backup.js missing environment variable usage"
    exit 1
else
    print_status $GREEN "  ✅ Environment variables used properly"
fi

print_status $BLUE "📱 Checking mobile optimizations..."

# Check for viewport meta tag
if grep -q "viewport" index.html public/index.html; then
    print_status $GREEN "  ✅ Viewport meta tags present"
else
    print_status $RED "  ❌ Missing viewport meta tags"
    exit 1
fi

# Check for mobile breakpoints
if grep -q "@media (max-width:" styles.css public/styles.css; then
    print_status $GREEN "  ✅ Mobile breakpoints present"
else
    print_status $RED "  ❌ Missing mobile breakpoints"
    exit 1
fi

print_status $BLUE "🔄 Checking sync functionality..."

# Check for smart merge function
if grep -q "mergeBackupData" script.js public/script.js; then
    print_status $GREEN "  ✅ Smart merge function present"
else
    print_status $RED "  ❌ Missing smart merge function"
    exit 1
fi

# Check if public files are synced with source files
if ! cmp -s "script.js" "public/script.js"; then
    print_status $YELLOW "  ⚠️ Warning: script.js and public/script.js differ"
    print_status $BLUE "  🔄 Syncing files..."
    cp script.js public/script.js
    cp styles.css public/styles.css
    cp index.html public/index.html
    print_status $GREEN "  ✅ Files synced"
fi

# Run Node.js test runner if available
if [ -f "test-runner.js" ]; then
    print_status $BLUE "🧪 Running automated tests..."
    if node test-runner.js --quick; then
        print_status $GREEN "  ✅ Automated tests passed"
    else
        print_status $RED "  ❌ Automated tests failed"
        exit 1
    fi
fi

# Final validation
print_status $BLUE "🔧 Final validation..."

# Check git status
if git diff --quiet && git diff --staged --quiet; then
    print_status $GREEN "  ✅ Git working directory clean"
else
    print_status $YELLOW "  ⚠️ Uncommitted changes detected"
    git status --porcelain
    print_status $BLUE "  📝 Consider committing changes before deployment"
fi

# Success!
echo ""
print_status $GREEN "🎉 ALL PRE-DEPLOYMENT TESTS PASSED!"
print_status $GREEN "✅ Ready for deployment to Vercel"
echo ""
print_status $BLUE "Next steps:"
print_status $BLUE "1. git add -A && git commit -m 'Your message'"
print_status $BLUE "2. git push origin main"
print_status $BLUE "3. Check Vercel dashboard for deployment status"
echo ""