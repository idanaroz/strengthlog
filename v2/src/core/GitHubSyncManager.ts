// ☁️ GitHub Auto-Sync Manager - Seamless Cross-Device Sync

import type { Exercise, WorkoutSession } from '@types/index.js';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  filename: string;
}

export interface BackupData {
  exercises: Exercise[];
  workouts: WorkoutSession[];
  lastSync: string;
  version: string;
  deviceId: string;
}

export class GitHubSyncManager {
  private config: GitHubConfig | null = null;
  private deviceId: string;
  private syncInProgress = false;

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.loadConfig();
  }

  // 🔧 Configuration
  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('github-sync-config');
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
      }
    } catch (error) {
      console.error('❌ Failed to load GitHub config:', error);
    }
  }

  setupSync(owner: string, repo: string, token: string): void {
    this.config = {
      owner,
      repo,
      token,
      filename: 'strength-log-sync.json'
    };

    localStorage.setItem('github-sync-config', JSON.stringify(this.config));
    console.log('✅ GitHub sync configured');
  }

  isConfigured(): boolean {
    return this.config !== null &&
           this.config.owner !== '' &&
           this.config.repo !== '' &&
           this.config.token !== '';
  }

  // ☁️ Auto-backup after every save
  async autoBackup(exercises: Exercise[], workouts: WorkoutSession[]): Promise<boolean> {
    if (!this.isConfigured() || this.syncInProgress) {
      return false;
    }

    try {
      this.syncInProgress = true;
      console.log('🔄 Auto-backing up to GitHub...');

      const backupData: BackupData = {
        exercises,
        workouts,
        lastSync: new Date().toISOString(),
        version: '2.0',
        deviceId: this.deviceId
      };

      const success = await this.uploadToGitHub(backupData);

      if (success) {
        console.log('✅ Auto-backup completed');
        this.updateLastSyncTime();
      }

      return success;
    } catch (error) {
      console.error('❌ Auto-backup failed:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  // 📥 Auto-restore on app load
  async autoRestore(): Promise<{ exercises: Exercise[]; workouts: WorkoutSession[] } | null> {
    if (!this.isConfigured()) {
      console.log('ℹ️ GitHub sync not configured - using local data only');
      return null;
    }

    try {
      console.log('📥 Auto-restoring from GitHub...');

      const cloudData = await this.downloadFromGitHub();
      if (!cloudData) {
        console.log('ℹ️ No cloud data found - starting fresh');
        return null;
      }

      // Check if cloud data is newer than local
      const lastLocalSync = localStorage.getItem('last-sync-time');
      const cloudSyncTime = new Date(cloudData.lastSync);
      const localSyncTime = lastLocalSync ? new Date(lastLocalSync) : new Date(0);

      if (cloudSyncTime > localSyncTime) {
        console.log('✅ Cloud data is newer - restoring from GitHub');
        this.updateLastSyncTime(cloudData.lastSync);
        return {
          exercises: cloudData.exercises,
          workouts: cloudData.workouts
        };
      } else {
        console.log('ℹ️ Local data is current - no restore needed');
        return null;
      }

    } catch (error) {
      console.error('❌ Auto-restore failed:', error);
      return null;
    }
  }

  // 🔄 Manual sync for troubleshooting
  async forcSync(exercises: Exercise[], workouts: WorkoutSession[]): Promise<boolean> {
    console.log('🔄 Force syncing with GitHub...');
    return await this.autoBackup(exercises, workouts);
  }

  // 📤 Upload to GitHub
  private async uploadToGitHub(data: BackupData): Promise<boolean> {
    if (!this.config) return false;

    try {
      const { owner, repo, token, filename } = this.config;

      // First, get the current file SHA (if it exists)
      const currentFile = await this.getCurrentFile();

      const content = JSON.stringify(data, null, 2);
      const encodedContent = btoa(unescape(encodeURIComponent(content)));

      const requestBody: any = {
        message: `Auto-sync from ${this.deviceId} - ${new Date().toISOString()}`,
        content: encodedContent,
        branch: 'main'
      };

      // Include SHA if file exists (for updates)
      if (currentFile?.sha) {
        requestBody.sha = currentFile.sha;
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ GitHub upload failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ GitHub upload error:', error);
      return false;
    }
  }

  // 📥 Download from GitHub
  private async downloadFromGitHub(): Promise<BackupData | null> {
    if (!this.config) return null;

    try {
      const { owner, repo, token, filename } = this.config;

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No backup file found on GitHub - first time setup');
          return null;
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const fileData = await response.json();
      const content = atob(fileData.content.replace(/\s/g, ''));
      const backupData = JSON.parse(content);

      // Validate backup data structure
      if (!this.validateBackupData(backupData)) {
        console.error('❌ Invalid backup data structure');
        return null;
      }

      return backupData;
    } catch (error) {
      console.error('❌ GitHub download error:', error);
      return null;
    }
  }

  // 📄 Get current file info
  private async getCurrentFile(): Promise<{ sha: string } | null> {
    if (!this.config) return null;

    try {
      const { owner, repo, token, filename } = this.config;

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (response.ok) {
        const fileData = await response.json();
        return { sha: fileData.sha };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // ✅ Validate backup data
  private validateBackupData(data: any): data is BackupData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.exercises) &&
      Array.isArray(data.workouts) &&
      typeof data.lastSync === 'string' &&
      typeof data.version === 'string'
    );
  }

  // 🔧 Utility methods
  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('device-id');
    if (!deviceId) {
      deviceId = 'device-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device-id', deviceId);
    }
    return deviceId;
  }

  private updateLastSyncTime(syncTime?: string): void {
    const time = syncTime || new Date().toISOString();
    localStorage.setItem('last-sync-time', time);
  }

  // 📊 Sync status
  getSyncStatus(): {
    configured: boolean;
    lastSync: string | null;
    deviceId: string;
    inProgress: boolean;
  } {
    return {
      configured: this.isConfigured(),
      lastSync: localStorage.getItem('last-sync-time'),
      deviceId: this.deviceId,
      inProgress: this.syncInProgress
    };
  }

  // 🔐 Setup wizard for GitHub token
  getSetupInstructions(): string {
    return `
🔧 GitHub Sync Setup:

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens
2. Generate new token (classic) with 'repo' permissions
3. Copy the token
4. Use setupSync(owner, repo, token) method

Example:
githubSync.setupSync('yourusername', 'strengthlog', 'ghp_your_token_here');

Your device ID: ${this.deviceId}
    `.trim();
  }
}