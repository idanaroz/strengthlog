# 🔒 Secure GitHub Backup Setup Guide

This guide shows how to set up secure GitHub backup for your Strength Training Log deployed on Vercel. The GitHub token is stored securely as environment variables on the server, never exposed to the browser.

## ✅ Benefits of Secure Server-Side Backup

- **🔐 Security**: GitHub token is never exposed to the browser or client-side code
- **🛡️ Safety**: No risk of token theft through browser inspection or client-side attacks
- **⚡ Simplicity**: Users don't need to manage GitHub tokens manually
- **🔧 Admin Control**: Centralized backup configuration management

## 📋 Prerequisites

1. A Vercel account and deployed app
2. A GitHub account
3. Admin access to your Vercel project settings

## 🚀 Setup Steps

### Step 1: Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "Strength Log Backup"
4. Set expiration (recommended: 1 year)
5. Select these scopes:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access to public repositories)
6. Click "Generate token"
7. **⚠️ Copy the token immediately - you won't see it again!**

### Step 2: Set Up Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your strength log project
3. Go to Settings → Environment Variables
4. Add these three variables:

| Variable Name | Value | Description |
|---------------|--------|-------------|
| `GITHUB_TOKEN` | `ghp_xxxxxxxxxxxx` | Your GitHub personal access token |
| `GITHUB_USERNAME` | `your-username` | Your GitHub username (case-sensitive) |
| `GITHUB_REPOSITORY` | `strength-log-backup` | Repository name for backups |

### Step 3: Deploy the Updated Code

1. Ensure you have the secure API endpoints (`/api/backup.js` and `/api/backup-status.js`)
2. Deploy to Vercel (automatic if connected to GitHub)
3. The serverless functions will use the environment variables

### Step 4: Test the Setup

1. Open your deployed app
2. Go to Settings → GitHub Backup
3. Check the backup status - it should show "GitHub backup ready"
4. Try a manual backup to confirm everything works

## 🔧 API Endpoints

### `POST /api/backup`
Creates a backup of workout data to GitHub.

**Request Body:**
```json
{
  "exercises": [...],
  "workouts": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Backup created successfully",
  "fileName": "strength-log-backup-2023-12-07.json",
  "backupDate": "2023-12-07T10:30:00.000Z"
}
```

### `GET /api/backup`
Retrieves the latest backup from GitHub.

**Response:**
```json
{
  "success": true,
  "data": {
    "exercises": [...],
    "workouts": [...],
    "backupDate": "2023-12-07T10:30:00.000Z"
  },
  "fileName": "strength-log-backup-2023-12-07.json"
}
```

### `GET /api/backup-status`
Checks backup configuration and status.

**Response:**
```json
{
  "configured": true,
  "status": "success",
  "message": "3 backup(s) found, latest: 2023-12-07",
  "repository": "username/strength-log-backup",
  "backupCount": 3,
  "latestBackup": "2023-12-07"
}
```

## 🔍 Troubleshooting

### Backup Status Shows "Not Configured"
- Check that all three environment variables are set in Vercel
- Ensure the GitHub token has the correct permissions
- Verify the GitHub username is spelled correctly (case-sensitive)

### "Authentication Failed" Error
- GitHub token may be expired - generate a new one
- Token may not have sufficient permissions - ensure `repo` scope is selected
- Check if your GitHub account has two-factor authentication enabled

### Repository Creation Issues
- Ensure the GitHub token has permission to create repositories
- The repository name might already exist - try a different name
- Check GitHub API rate limits

### Vercel Function Errors
- Check Vercel function logs in the dashboard
- Ensure environment variables are deployed (may need to redeploy)
- Verify API endpoints are deployed correctly

## 🛠️ Advanced Configuration

### Custom Repository Name
Change the `GITHUB_REPOSITORY` environment variable to use a different backup repository name.

### Backup Frequency
The app checks for auto-backup every 24 hours. To change this, modify the `backupInterval` in the code.

### Multiple Environments
Set up different environment variables for staging/production:
- Use Vercel's environment-specific variables
- Consider separate backup repositories for each environment

## 🔄 Migration from Client-Side Backup

If you're upgrading from the old client-side backup system:

1. Your existing localStorage GitHub settings will be ignored
2. Manual backups and restores will use the new secure endpoints
3. Auto-backup will continue working with the server-side system
4. Previous backup files in GitHub remain accessible

## 📚 Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/projects/environment-variables)
- [GitHub Personal Access Tokens Guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Vercel function logs for detailed error messages
3. Ensure all environment variables are correctly set
4. Test GitHub token permissions manually

---

**Security Note**: Never commit GitHub tokens to your code repository. Always use environment variables for sensitive credentials.