# GitHub Backup Setup Guide

Your Strength Training Log now includes automatic GitHub backup! This ensures your workout data is safely stored in the cloud and accessible from any device.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create a GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Name it: `strength-log-backup` (or any name you prefer)
4. Make sure it's **Private** (to keep your data secure)
5. Click "Create repository"

### Step 2: Create a Personal Access Token
1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name like "Strength Log Backup"
4. Select scopes: **Check the "repo" box** (this gives access to private repositories)
5. Click "Generate token"
6. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

### Step 3: Configure the App
1. Open your Strength Training Log
2. Go to "Settings" tab
3. Find the "GitHub Backup" section
4. Fill in:
   - **Personal Access Token**: Paste the token from Step 2
   - **GitHub Username**: Your GitHub username
   - **Repository Name**: The name from Step 1 (e.g., `strength-log-backup`)
5. Check "Enable automatic GitHub backups"
6. Click "Save GitHub Settings"

## ✅ You're Done!

The app will now:
- **Automatically backup** your data every 24 hours
- **Show backup status** in the settings
- Allow **manual backup** anytime with "Backup Now"
- Let you **restore data** from any device with "Restore from Backup"

## 🔒 Security & Privacy

- Your data is stored in **your private GitHub repository** (only you can access it)
- The Personal Access Token is stored **only in your browser** (never sent to third parties)
- All backups are **encrypted in transit** (HTTPS)
- You maintain **full control** over your data

## 🛠️ How It Works

- **Fast Local Storage**: Daily operations use localStorage for speed
- **Cloud Backup**: Every 24 hours, data is automatically backed up to GitHub
- **Git History**: Every backup creates a Git commit, so you have full version history
- **Cross-Device Sync**: Access your data from any device by setting up GitHub backup

## 🆘 Troubleshooting

**"GitHub connection failed"**
- Check that your Personal Access Token has "repo" permissions
- Verify your username and repository name are correct
- Make sure the repository exists and is accessible

**"No backup files found"**
- The repository exists but has no backup files yet
- Click "Backup Now" to create your first backup

**Backup status shows "error"**
- Check your internet connection
- Verify your GitHub settings in the Settings tab
- Try clicking "Backup Now" to see the specific error message

## 🎯 Pro Tips

- **Repository Organization**: Each backup file is named with the date (e.g., `strength-log-backup-2025-01-27.json`)
- **Data Portability**: You can download any backup file directly from GitHub
- **Version History**: Use GitHub's interface to see when each backup was created
- **Multiple Devices**: Set up the same GitHub backup on multiple devices for seamless sync

Your workout data is now bulletproof! 💪