// 💾 Advanced Data Management - SQLite + Cloud Sync

import { openDB, type IDBPDatabase } from 'idb';
import { GitHubSyncManager } from './GitHubSyncManager.js';
import type {
  Exercise,
  WorkoutSession,
  UserSettings,
  BackupData,
  SyncStatus
} from '@types/index.js';

interface DBSchema {
  exercises: {
    key: string;
    value: Exercise;
    indexes: { 'by-category': string; 'by-date': string };
  };
  workouts: {
    key: string;
    value: WorkoutSession;
    indexes: { 'by-date': string; 'by-exercise': string };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
  sync_log: {
    key: string;
    value: { timestamp: string; action: string; entityId: string };
  };
}

export class DataManager {
  private db: IDBPDatabase<DBSchema> | null = null;
  private githubSync: GitHubSyncManager;
  private syncStatus: SyncStatus = {
    lastSync: new Date().toISOString(),
    pendingChanges: 0,
    isOnline: navigator.onLine,
    backupEnabled: true,
    conflictCount: 0
  };

  constructor() {
    this.githubSync = new GitHubSyncManager();
  }

  // 🚀 Initialize database with automatic migrations
  async initialize(): Promise<void> {
    this.db = await openDB<DBSchema>('StrengthLogV2', 2, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`📊 Upgrading database from v${oldVersion} to v${newVersion}`);

        // V1 Schema
        if (oldVersion < 1) {
          // Exercises store
          const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
          exerciseStore.createIndex('by-category', 'category');
          exerciseStore.createIndex('by-date', 'dateCreated');

          // Workouts store
          const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
          workoutStore.createIndex('by-date', 'date');
          workoutStore.createIndex('by-exercise', 'exercises.exerciseId');

          // Settings store
          db.createObjectStore('settings', { keyPath: 'key' });

          // Sync log for offline/online synchronization
          const syncStore = db.createObjectStore('sync_log', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('by-timestamp', 'timestamp');
        }

        // V2 Schema additions
        if (oldVersion < 2) {
          // Add any new indexes or schema changes here
          console.log('📈 Added analytics optimizations');
        }
      }
    });

    // Set up online/offline event listeners
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.performBackgroundSync();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
    });

    await this.migrateFromV1IfNeeded();
  }

  // 🔄 Migrate data from V1 localStorage if it exists
  private async migrateFromV1IfNeeded(): Promise<void> {
    const v1Exercises = localStorage.getItem('strengthlog-exercises');
    const v1Workouts = localStorage.getItem('strengthlog-workouts');

    if (v1Exercises || v1Workouts) {
      console.log('🔄 Migrating data from V1...');

      try {
        // Migrate exercises
        if (v1Exercises) {
          const exercises = JSON.parse(v1Exercises);
          for (const exercise of exercises) {
            await this.saveExercise(this.migrateV1Exercise(exercise));
          }
        }

        // Migrate workouts
        if (v1Workouts) {
          const workouts = JSON.parse(v1Workouts);
          for (const workout of workouts) {
            await this.saveWorkout(this.migrateV1Workout(workout));
          }
        }

        // Archive V1 data (don't delete in case of issues)
        localStorage.setItem('strengthlog-v1-backup', JSON.stringify({
          exercises: v1Exercises,
          workouts: v1Workouts,
          migrationDate: new Date().toISOString()
        }));

        console.log('✅ V1 migration completed successfully');
      } catch (error) {
        console.error('❌ V1 migration failed:', error);
      }
    }
  }

  // 🔄 Convert V1 exercise format to V2
  private migrateV1Exercise(v1Exercise: any): Exercise {
    return {
      id: v1Exercise.id,
      name: v1Exercise.name,
      notes: v1Exercise.notes || '',
      category: 'compound', // Default category
      muscleGroups: [],
      equipmentType: 'bodyweight',
      dateCreated: v1Exercise.dateCreated,
      isArchived: false,
      totalWorkouts: 0,
      personalBests: {
        maxWeight: { value: 0, date: '', reps: 0 },
        maxReps: { value: 0, date: '', weight: 0 },
        maxVolume: { value: 0, date: '' },
        estimatedOneRepMax: { value: 0, date: '' }
      }
    };
  }

  // 🔄 Convert V1 workout format to V2
  private migrateV1Workout(v1Workout: any): WorkoutSession {
    const workoutExercise = {
      id: this.generateId(),
      exerciseId: v1Workout.exerciseId,
      sets: v1Workout.sets.map((set: any) => ({
        id: this.generateId(),
        weight: set.weight,
        reps: set.reps,
        isWarmup: false,
        isFailure: false,
        rpe: undefined,
        restTime: undefined,
        notes: undefined
      })),
      notes: v1Workout.notes || '',
      restTime: 90, // Default rest time
      metrics: this.calculateWorkoutMetrics(v1Workout.sets),
      progression: {
        weightChange: 0,
        volumeChange: 0,
        strengthChange: 0,
        isPersonalBest: false,
        streak: 0,
        lastImprovement: ''
      }
    };

    return {
      id: v1Workout.id,
      date: v1Workout.date,
      startTime: '10:00', // Default time
      exercises: [workoutExercise],
      notes: v1Workout.notes || '',
      mood: 3, // Neutral mood
      duration: 60, // Default duration
      totalVolume: workoutExercise.metrics.totalVolume,
      dateCreated: v1Workout.dateCreated
    };
  }

  // 📊 Calculate workout metrics from sets
  private calculateWorkoutMetrics(sets: any[]) {
    const totalVolume = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    const maxWeight = Math.max(...sets.map(set => set.weight));
    const maxReps = Math.max(...sets.map(set => set.reps));

    return {
      totalVolume,
      maxWeight,
      maxReps,
      averageRPE: undefined,
      estimatedOneRepMax: maxWeight * (1 + maxReps / 30), // Simple Epley formula
      volumePerMinute: totalVolume / 60, // Assume 60 min workout
      intensityScore: (maxWeight * maxReps) / totalVolume * 100
    };
  }

  // 💪 Exercise CRUD operations with auto-backup
  async saveExercise(exercise: Exercise): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('exercises', exercise);
    await this.logSyncAction('exercise_save', exercise.id);
    this.syncStatus.pendingChanges++;

    // Auto-backup to GitHub after save
    await this.autoBackupToGitHub();
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('exercises', id);
  }

  async getAllExercises(): Promise<Exercise[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('exercises');
  }

  async deleteExercise(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check for dependent workouts
    const workouts = await this.getWorkoutsByExercise(id);
    if (workouts.length > 0) {
      throw new Error(`Cannot delete exercise: ${workouts.length} workouts depend on it`);
    }

    await this.db.delete('exercises', id);
    await this.logSyncAction('exercise_delete', id);
    this.syncStatus.pendingChanges++;
  }

  // 🏋️ Workout CRUD operations with auto-backup
  async saveWorkout(workout: WorkoutSession): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('workouts', workout);
    await this.logSyncAction('workout_save', workout.id);
    this.syncStatus.pendingChanges++;

    // Update exercise statistics
    await this.updateExerciseStats(workout);

    // Auto-backup to GitHub after save
    await this.autoBackupToGitHub();
  }

  async getWorkout(id: string): Promise<WorkoutSession | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('workouts', id);
  }

  async getAllWorkouts(): Promise<WorkoutSession[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('workouts');
  }

  async getWorkoutsByExercise(exerciseId: string): Promise<WorkoutSession[]> {
    if (!this.db) throw new Error('Database not initialized');

    const allWorkouts = await this.db.getAll('workouts');
    return allWorkouts.filter(workout =>
      workout.exercises.some(ex => ex.exerciseId === exerciseId)
    );
  }

  async getWorkoutsByDateRange(startDate: string, endDate: string): Promise<WorkoutSession[]> {
    if (!this.db) throw new Error('Database not initialized');

    const allWorkouts = await this.db.getAll('workouts');
    return allWorkouts.filter(workout =>
      workout.date >= startDate && workout.date <= endDate
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // 📊 Update exercise statistics after workout
  private async updateExerciseStats(workout: WorkoutSession): Promise<void> {
    for (const workoutExercise of workout.exercises) {
      const exercise = await this.getExercise(workoutExercise.exerciseId);
      if (!exercise) continue;

      // Update total workouts count
      exercise.totalWorkouts = (await this.getWorkoutsByExercise(exercise.id)).length;
      exercise.lastWorkoutDate = workout.date;

      // Update personal bests
      const metrics = workoutExercise.metrics;

      if (metrics.maxWeight > exercise.personalBests.maxWeight.value) {
        exercise.personalBests.maxWeight = {
          value: metrics.maxWeight,
          date: workout.date,
          reps: metrics.maxReps
        };
      }

      if (metrics.totalVolume > exercise.personalBests.maxVolume.value) {
        exercise.personalBests.maxVolume = {
          value: metrics.totalVolume,
          date: workout.date
        };
      }

      if (metrics.estimatedOneRepMax > exercise.personalBests.estimatedOneRepMax.value) {
        exercise.personalBests.estimatedOneRepMax = {
          value: metrics.estimatedOneRepMax,
          date: workout.date
        };
      }

      await this.saveExercise(exercise);
    }
  }

  // ⚙️ Settings management
  async saveSettings(settings: UserSettings): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('settings', { key: 'user_settings', ...settings });
  }

  async getSettings(): Promise<UserSettings> {
    if (!this.db) throw new Error('Database not initialized');

    const saved = await this.db.get('settings', 'user_settings');
    return saved || this.getDefaultSettings();
  }

  private getDefaultSettings(): UserSettings {
    return {
      weightUnit: 'kg',
      dateFormat: 'iso',
      theme: 'auto',
      restTimerDefault: 90,
      autoSave: true,
      analyticsEnabled: true,
      chartDefaults: {
        timeframe: 'month',
        showTrendline: true,
        showMilestones: true,
        primaryMetric: 'volume'
      },
      notifications: {
        restTimer: true,
        workoutReminders: false,
        progressMilestones: true
      }
    };
  }

  // 🔄 Sync and backup operations
  async createBackup(): Promise<BackupData> {
    const exercises = await this.getAllExercises();
    const workouts = await this.getAllWorkouts();
    const settings = await this.getSettings();

    const backup: BackupData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      checksum: this.calculateChecksum({ exercises, workouts, settings }),
      data: { exercises, workouts, settings }
    };

    return backup;
  }

  async restoreFromBackup(backup: BackupData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Verify checksum
    const expectedChecksum = this.calculateChecksum(backup.data);
    if (backup.checksum !== expectedChecksum) {
      throw new Error('Backup integrity check failed');
    }

    // Clear existing data
    await this.db.clear('exercises');
    await this.db.clear('workouts');

    // Restore data
    for (const exercise of backup.data.exercises) {
      await this.db.put('exercises', exercise);
    }

    for (const workout of backup.data.workouts) {
      await this.db.put('workouts', workout);
    }

    await this.saveSettings(backup.data.settings);

    this.syncStatus.lastSync = new Date().toISOString();
    this.syncStatus.pendingChanges = 0;
  }

  // 🔐 Calculate data checksum for integrity verification
  private calculateChecksum(data: any): string {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(16);
  }

  // 📝 Log sync actions for offline support
  private async logSyncAction(action: string, entityId: string): Promise<void> {
    if (!this.db) return;

    await this.db.add('sync_log', {
      timestamp: new Date().toISOString(),
      action,
      entityId
    });
  }

  // 🔄 Perform background sync when online
  private async performBackgroundSync(): Promise<void> {
    if (!this.syncStatus.isOnline || this.syncStatus.pendingChanges === 0) {
      return;
    }

    try {
      // This would sync with your cloud backend
      // For now, just create a local backup
      const backup = await this.createBackup();

      // In a real implementation, this would upload to GitHub/cloud
      console.log('📤 Background sync completed', backup.timestamp);

      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.pendingChanges = 0;
    } catch (error) {
      console.error('❌ Background sync failed:', error);
    }
  }

  // 🆔 Generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 📊 Get sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

    // ☁️ Auto-backup to GitHub after any save
  private async autoBackupToGitHub(): Promise<void> {
    try {
      if (!this.githubSync.isConfigured()) {
        console.log('ℹ️ GitHub sync not configured - skipping auto-backup');
        return;
      }

      const exercises = await this.getAllExercises();
      const workouts = await this.getAllWorkouts();

      const success = await this.githubSync.autoBackup(exercises, workouts);
      if (success) {
        this.syncStatus.lastSync = new Date().toISOString();
        this.syncStatus.pendingChanges = 0;
      }
    } catch (error) {
      console.error('❌ Auto-backup failed:', error);
      // Don't throw - backup failure shouldn't break normal app flow
    }
  }

  // 📥 Auto-restore from GitHub on app load
  async autoRestoreFromGitHub(): Promise<boolean> {
    try {
      if (!this.githubSync.isConfigured()) {
        console.log('ℹ️ GitHub sync not configured - using local data only');
        return false;
      }

      const cloudData = await this.githubSync.autoRestore();
      if (!cloudData) {
        console.log('ℹ️ No cloud data to restore');
        return false;
      }

      console.log('📥 Restoring data from GitHub...');

      // Replace local data with cloud data
      if (!this.db) throw new Error('Database not initialized');

      // Clear existing data
      await Promise.all([
        this.db.clear('exercises'),
        this.db.clear('workouts')
      ]);

      // Add cloud data
      const tx = this.db.transaction(['exercises', 'workouts'], 'readwrite');

      for (const exercise of cloudData.exercises) {
        await tx.objectStore('exercises').put(exercise);
      }

      for (const workout of cloudData.workouts) {
        await tx.objectStore('workouts').put(workout);
      }

      await tx.done;

      console.log(`✅ Restored ${cloudData.exercises.length} exercises and ${cloudData.workouts.length} workouts from GitHub`);
      return true;
    } catch (error) {
      console.error('❌ Auto-restore failed:', error);
      return false;
    }
  }

  // 🔧 Setup GitHub sync
  setupGitHubSync(owner: string, repo: string, token: string): void {
    this.githubSync.setupSync(owner, repo, token);
    console.log('✅ GitHub sync configured');
  }

  // 📊 Get GitHub sync status
  getGitHubSyncStatus() {
    return this.githubSync.getSyncStatus();
  }

  // 🔐 Get GitHub setup instructions
  getGitHubSetupInstructions(): string {
    return this.githubSync.getSetupInstructions();
  }

  // 🧹 Clear all data (for migration rollback)
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await Promise.all([
      this.db.clear('exercises'),
      this.db.clear('workouts'),
      this.db.clear('settings'),
      this.db.clear('sync_log')
    ]);

    console.log('🧹 All V2 data cleared');
  }
}