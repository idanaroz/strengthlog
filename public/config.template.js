// DEPRECATED: GitHub Backup Configuration Template
//
// ⚠️  SECURITY NOTICE: This file is now DEPRECATED and INSECURE
//
// As of the latest update, GitHub backup is now handled securely on the server-side
// using Vercel environment variables. This client-side configuration method is
// no longer supported and poses security risks.
//
// 🔒 NEW SECURE METHOD:
// 1. Set up environment variables in your Vercel dashboard:
//    - GITHUB_TOKEN (your personal access token)
//    - GITHUB_USERNAME (your GitHub username)
//    - GITHUB_REPOSITORY (backup repository name)
//
// 2. Deploy your app - the server will handle all GitHub operations securely
//
// 3. See SECURE_BACKUP_GUIDE.md for complete setup instructions
//
// ❌ DO NOT USE THIS FILE - it exposes your GitHub token to the browser!
//
// This file is kept for reference only. Consider removing it entirely.

// OLD INSECURE CONFIGURATION (DO NOT USE):
const DEPRECATED_CONFIG = {
    github: {
        // ❌ INSECURE: Exposing tokens in client-side code
        username: "YOUR_GITHUB_USERNAME",
        repository: "strength-log-backup",
        token: "PASTE_YOUR_TOKEN_HERE", // ❌ MAJOR SECURITY RISK
        enabled: true,
        backupInterval: 24 * 60 * 60 * 1000
    }
};

// ❌ DO NOT UNCOMMENT - THIS IS INSECURE:
// window.GITHUB_CONFIG = DEPRECATED_CONFIG.github;