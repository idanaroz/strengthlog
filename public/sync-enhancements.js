// 🚀 Optional Enhancements for Backup/Sync System
// These could be added to make the process even smoother

class BackupEnhancements {

    // Auto-remind users to backup after significant changes
    checkBackupReminder() {
        const lastExport = localStorage.getItem('strengthlog-last-export');
        const workoutCount = this.workouts.length;
        const exerciseCount = this.exercises.length;

        // Remind after 10 new workouts or 1 week
        const shouldRemind = !lastExport ||
                           (Date.now() - new Date(lastExport) > 7 * 24 * 60 * 60 * 1000) ||
                           (workoutCount > 0 && workoutCount % 10 === 0);

        if (shouldRemind) {
            this.showBackupReminder();
        }
    }

    // Show friendly backup reminder
    showBackupReminder() {
        const reminder = document.createElement('div');
        reminder.className = 'backup-reminder';
        reminder.innerHTML = `
            <div class="reminder-content">
                <h3>💾 Keep Your Progress Safe!</h3>
                <p>You've logged ${this.workouts.length} workouts. Consider backing up your data!</p>
                <div class="reminder-actions">
                    <button onclick="app.exportData(); this.parentElement.parentElement.parentElement.remove();">
                        📥 Export Now
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove();">
                        Later
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(reminder);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (reminder.parentElement) {
                reminder.remove();
            }
        }, 10000);
    }

    // Enhanced export with more metadata
    exportDataEnhanced() {
        const data = {
            exercises: this.exercises,
            workouts: this.workouts,
            exportDate: new Date().toISOString(),
            version: '2.0',
            metadata: {
                totalWorkouts: this.workouts.length,
                totalExercises: this.exercises.length,
                dateRange: {
                    first: this.workouts.length > 0 ?
                           Math.min(...this.workouts.map(w => new Date(w.date))) : null,
                    last: this.workouts.length > 0 ?
                          Math.max(...this.workouts.map(w => new Date(w.date))) : null
                },
                environment: window.location.hostname === 'localhost' ? 'development' : 'production'
            }
        };

        // Rest of export logic...
        localStorage.setItem('strengthlog-last-export', new Date().toISOString());
    }

    // Quick sync status indicator
    showSyncStatus() {
        const lastGitHubBackup = this.lastBackupTime;
        const lastManualExport = localStorage.getItem('strengthlog-last-export');

        let status = '';
        if (lastGitHubBackup) {
            const hours = Math.floor((Date.now() - lastGitHubBackup) / (1000 * 60 * 60));
            status += `🤖 Auto-backup: ${hours}h ago | `;
        }
        if (lastManualExport) {
            const hours = Math.floor((Date.now() - new Date(lastManualExport)) / (1000 * 60 * 60));
            status += `📥 Manual export: ${hours}h ago`;
        }

        return status || 'No recent backups';
    }

    // Cross-platform backup suggestions
    suggestBackupMethod() {
        const isLocal = window.location.hostname === 'localhost';
        const hasMobile = window.innerWidth < 768;

        if (isLocal) {
            return "💡 Tip: GitHub backup runs automatically, but export manually for sharing!";
        } else if (hasMobile) {
            return "📱 Tip: Export to save in your phone's downloads, then share via email/cloud!";
        } else {
            return "💻 Tip: Export and save to Google Drive/Dropbox for easy cross-device sync!";
        }
    }
}

// Usage examples:
// app.checkBackupReminder(); // Call after significant changes
// app.showSyncStatus(); // Show in settings
// app.suggestBackupMethod(); // Context-aware tips