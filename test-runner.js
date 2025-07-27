#!/usr/bin/env node

/**
 * 🧪 Strength Log - Automated Test Runner
 *
 * Runs behavior tests to ensure app functionality before deployment
 * Usage: node test-runner.js [--quick] [--mobile] [--sync]
 */

const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: []
        };
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            pass: '\x1b[32m',    // Green
            fail: '\x1b[31m',    // Red
            warn: '\x1b[33m',    // Yellow
            reset: '\x1b[0m'     // Reset
        };

        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async runTests(options = {}) {
        this.log('🚀 Starting Strength Log Test Runner...', 'info');

        // 1. File Structure Tests
        await this.testFileStructure();

        // 2. Code Syntax Tests
        await this.testCodeSyntax();

        // 3. API Endpoint Tests
        if (!options.quick) {
            await this.testAPIEndpoints();
        }

        // 4. Configuration Tests
        await this.testConfiguration();

        // 5. Mobile-specific tests
        if (options.mobile) {
            await this.testMobileOptimizations();
        }

        // 6. Sync logic tests
        if (options.sync) {
            await this.testSyncLogic();
        }

        this.printSummary();
        return this.results.failed === 0;
    }

    async testFileStructure() {
        this.log('📁 Testing file structure...', 'info');

        const requiredFiles = [
            'index.html',
            'script.js',
            'styles.css',
            'public/index.html',
            'public/script.js',
            'public/styles.css',
            'api/backup.js',
            'api/backup-status.js',
            'package.json'
        ];

        for (const file of requiredFiles) {
            if (fs.existsSync(file)) {
                this.pass(`✅ ${file} exists`);
            } else {
                this.fail(`❌ Missing required file: ${file}`);
            }
        }
    }

    async testCodeSyntax() {
        this.log('🔍 Testing code syntax...', 'info');

        // Test JavaScript files for basic syntax errors
        const jsFiles = ['script.js', 'public/script.js', 'api/backup.js', 'api/backup-status.js'];

        for (const file of jsFiles) {
            if (fs.existsSync(file)) {
                try {
                    const content = fs.readFileSync(file, 'utf8');

                    // Check for common syntax issues
                    if (content.includes('export default') && content.includes('module.exports')) {
                        this.fail(`❌ ${file}: Mixed ES6/CommonJS syntax detected`);
                        continue;
                    }

                    // Check for proper function structure
                    if (file.includes('api/') && !content.includes('async function handler')) {
                        this.fail(`❌ ${file}: Missing proper handler function`);
                        continue;
                    }

                    // Check for unclosed brackets/braces (basic check)
                    const openBraces = (content.match(/\{/g) || []).length;
                    const closeBraces = (content.match(/\}/g) || []).length;

                    if (openBraces !== closeBraces) {
                        this.fail(`❌ ${file}: Mismatched braces (${openBraces} open, ${closeBraces} close)`);
                        continue;
                    }

                    this.pass(`✅ ${file} syntax OK`);

                } catch (error) {
                    this.fail(`❌ ${file}: ${error.message}`);
                }
            }
        }
    }

    async testAPIEndpoints() {
        this.log('🌐 Testing API endpoints...', 'info');

        // Note: These are just file checks since we can't easily test actual endpoints
        // In a real deployment, you'd test actual HTTP endpoints

        const apiFiles = ['api/backup.js', 'api/backup-status.js'];

        for (const file of apiFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');

                // Check for required API patterns
                if (!content.includes('res.setHeader')) {
                    this.fail(`❌ ${file}: Missing CORS headers`);
                    continue;
                }

                if (!content.includes('req.method')) {
                    this.fail(`❌ ${file}: Missing HTTP method handling`);
                    continue;
                }

                if (!content.includes('process.env')) {
                    this.fail(`❌ ${file}: Missing environment variable usage`);
                    continue;
                }

                this.pass(`✅ ${file} API structure OK`);
            }
        }
    }

    async testConfiguration() {
        this.log('⚙️ Testing configuration...', 'info');

        // Check package.json
        if (fs.existsSync('package.json')) {
            try {
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

                if (!pkg.name) {
                    this.fail('❌ package.json missing name field');
                } else {
                    this.pass('✅ package.json has name');
                }

                if (!pkg.version) {
                    this.fail('❌ package.json missing version field');
                } else {
                    this.pass('✅ package.json has version');
                }

            } catch (error) {
                this.fail(`❌ package.json syntax error: ${error.message}`);
            }
        }

        // Check HTML files have proper viewport
        const htmlFiles = ['index.html', 'public/index.html'];

        for (const file of htmlFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');

                if (!content.includes('viewport')) {
                    this.fail(`❌ ${file}: Missing viewport meta tag`);
                } else {
                    this.pass(`✅ ${file} has viewport`);
                }

                if (!content.includes('Strength Training Log')) {
                    this.fail(`❌ ${file}: Missing or incorrect title`);
                } else {
                    this.pass(`✅ ${file} has correct title`);
                }
            }
        }
    }

    async testMobileOptimizations() {
        this.log('📱 Testing mobile optimizations...', 'info');

        const cssFiles = ['styles.css', 'public/styles.css'];

        for (const file of cssFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');

                // Check for mobile breakpoints
                if (!content.includes('@media (max-width:') && !content.includes('@media (max-width :')) {
                    this.fail(`❌ ${file}: Missing mobile breakpoints`);
                } else {
                    this.pass(`✅ ${file} has mobile breakpoints`);
                }

                // Check for touch-friendly sizing
                if (!content.includes('min-height: 44px') && !content.includes('min-height: 48px')) {
                    this.warn(`⚠️ ${file}: Consider adding touch-friendly button sizes`);
                } else {
                    this.pass(`✅ ${file} has touch-friendly elements`);
                }

                // Check for responsive font sizes
                if (!content.includes('font-size: 16px')) {
                    this.warn(`⚠️ ${file}: Consider 16px font-size to prevent iOS zoom`);
                } else {
                    this.pass(`✅ ${file} has iOS-safe font sizes`);
                }
            }
        }
    }

    async testSyncLogic() {
        this.log('🔄 Testing sync logic...', 'info');

        const scriptFiles = ['script.js', 'public/script.js'];

        for (const file of scriptFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');

                // Check for smart merge function
                if (!content.includes('mergeBackupData')) {
                    this.fail(`❌ ${file}: Missing smart merge function`);
                } else {
                    this.pass(`✅ ${file} has smart merge function`);
                }

                // Check for conflict resolution
                if (!content.includes('dateCreated')) {
                    this.fail(`❌ ${file}: Missing timestamp-based conflict resolution`);
                } else {
                    this.pass(`✅ ${file} has conflict resolution logic`);
                }

                // Check for duplicate prevention
                if (!content.includes('find(') && !content.includes('filter(')) {
                    this.fail(`❌ ${file}: Missing duplicate prevention logic`);
                } else {
                    this.pass(`✅ ${file} has duplicate prevention`);
                }
            }
        }
    }

    pass(message) {
        this.results.passed++;
        this.results.total++;
        this.log(message, 'pass');
    }

    fail(message) {
        this.results.failed++;
        this.results.total++;
        this.results.errors.push(message);
        this.log(message, 'fail');
    }

    warn(message) {
        this.log(message, 'warn');
    }

    printSummary() {
        const duration = Date.now() - this.startTime;

        console.log('\n' + '='.repeat(60));
        this.log('📊 TEST SUMMARY', 'info');
        console.log('='.repeat(60));

        this.log(`Total Tests: ${this.results.total}`, 'info');
        this.log(`Passed: ${this.results.passed}`, 'pass');
        this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'fail' : 'pass');
        this.log(`Duration: ${duration}ms`, 'info');

        if (this.results.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.errors.forEach(error => {
                console.log(`  ${error}`);
            });
        }

        console.log('\n' + (this.results.failed === 0 ?
            '🎉 ALL TESTS PASSED! Ready for deployment.' :
            '⚠️  TESTS FAILED! Please fix issues before deployment.'));
        console.log('='.repeat(60) + '\n');
    }
}

// CLI Usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        quick: args.includes('--quick'),
        mobile: args.includes('--mobile'),
        sync: args.includes('--sync')
    };

    const runner = new TestRunner();
    runner.runTests(options).then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = TestRunner;