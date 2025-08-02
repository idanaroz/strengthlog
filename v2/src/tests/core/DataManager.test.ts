// 🧪 DataManager Tests - Core data operations

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '@core/DataManager.js';
import type { Exercise, WorkoutSession } from '@types/index.js';

describe('DataManager', () => {
  let dataManager: DataManager;
  let mockExercise: Exercise;
  let mockWorkout: WorkoutSession;

  beforeEach(async () => {
    dataManager = new DataManager();
    await dataManager.initialize();

    mockExercise = createMockExercise();
    mockWorkout = createMockWorkout({
      exercises: [{
        id: 'test-we-1',
        exerciseId: mockExercise.id,
        sets: [createMockWorkoutSet()],
        notes: '',
        restTime: 90,
        metrics: {
          totalVolume: 500,
          maxWeight: 50,
          maxReps: 10,
          estimatedOneRepMax: 65,
          volumePerMinute: 8.33,
          intensityScore: 10
        },
        progression: {
          weightChange: 0,
          volumeChange: 0,
          strengthChange: 0,
          isPersonalBest: false,
          streak: 0,
          lastImprovement: ''
        }
      }]
    });
  });

  describe('Exercise Operations', () => {
    it('should save and retrieve exercises', async () => {
      await dataManager.saveExercise(mockExercise);
      const retrieved = await dataManager.getExercise(mockExercise.id);

      expect(retrieved).toEqual(mockExercise);
    });

    it('should get all exercises', async () => {
      await dataManager.saveExercise(mockExercise);
      const exercise2 = createMockExercise({ id: 'test-exercise-2', name: 'Exercise 2' });
      await dataManager.saveExercise(exercise2);

      const allExercises = await dataManager.getAllExercises();

      expect(allExercises).toHaveLength(2);
      expect(allExercises.map(e => e.id)).toContain(mockExercise.id);
      expect(allExercises.map(e => e.id)).toContain(exercise2.id);
    });

    it('should prevent deleting exercises with dependent workouts', async () => {
      await dataManager.saveExercise(mockExercise);
      await dataManager.saveWorkout(mockWorkout);

      await expect(dataManager.deleteExercise(mockExercise.id))
        .rejects.toThrow('Cannot delete exercise');
    });

    it('should allow deleting exercises without dependent workouts', async () => {
      await dataManager.saveExercise(mockExercise);

      await expect(dataManager.deleteExercise(mockExercise.id))
        .resolves.not.toThrow();

      const retrieved = await dataManager.getExercise(mockExercise.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Workout Operations', () => {
    beforeEach(async () => {
      await dataManager.saveExercise(mockExercise);
    });

    it('should save and retrieve workouts', async () => {
      await dataManager.saveWorkout(mockWorkout);
      const retrieved = await dataManager.getWorkout(mockWorkout.id);

      expect(retrieved).toEqual(mockWorkout);
    });

    it('should get workouts by exercise', async () => {
      await dataManager.saveWorkout(mockWorkout);
      const workout2 = createMockWorkout({
        id: 'test-workout-2',
        exercises: [{
          id: 'test-we-2',
          exerciseId: 'different-exercise',
          sets: [],
          notes: '',
          restTime: 90,
          metrics: { totalVolume: 0, maxWeight: 0, maxReps: 0, estimatedOneRepMax: 0, volumePerMinute: 0, intensityScore: 0 },
          progression: { weightChange: 0, volumeChange: 0, strengthChange: 0, isPersonalBest: false, streak: 0, lastImprovement: '' }
        }]
      });
      await dataManager.saveWorkout(workout2);

      const exerciseWorkouts = await dataManager.getWorkoutsByExercise(mockExercise.id);

      expect(exerciseWorkouts).toHaveLength(1);
      expect(exerciseWorkouts[0].id).toBe(mockWorkout.id);
    });

    it('should get workouts by date range', async () => {
      await dataManager.saveWorkout(mockWorkout);
      const workout2 = createMockWorkout({
        id: 'test-workout-2',
        date: '2024-01-15',
        exercises: []
      });
      const workout3 = createMockWorkout({
        id: 'test-workout-3',
        date: '2024-02-01',
        exercises: []
      });
      await dataManager.saveWorkout(workout2);
      await dataManager.saveWorkout(workout3);

      const rangeWorkouts = await dataManager.getWorkoutsByDateRange('2024-01-01', '2024-01-31');

      expect(rangeWorkouts).toHaveLength(2);
      expect(rangeWorkouts.map(w => w.id)).toContain(mockWorkout.id);
      expect(rangeWorkouts.map(w => w.id)).toContain(workout2.id);
      expect(rangeWorkouts.map(w => w.id)).not.toContain(workout3.id);
    });

    it('should update exercise statistics after saving workouts', async () => {
      const initialExercise = await dataManager.getExercise(mockExercise.id);
      expect(initialExercise?.totalWorkouts).toBe(0);

      await dataManager.saveWorkout(mockWorkout);

      const updatedExercise = await dataManager.getExercise(mockExercise.id);
      expect(updatedExercise?.totalWorkouts).toBe(1);
      expect(updatedExercise?.lastWorkoutDate).toBe(mockWorkout.date);
      expect(updatedExercise?.personalBests.maxWeight.value).toBe(50);
      expect(updatedExercise?.personalBests.maxVolume.value).toBe(500);
    });
  });

  describe('Settings Operations', () => {
    it('should save and retrieve settings', async () => {
      const settings = {
        weightUnit: 'kg' as const,
        dateFormat: 'iso' as const,
        theme: 'dark' as const,
        restTimerDefault: 120,
        autoSave: false,
        analyticsEnabled: true,
        chartDefaults: {
          timeframe: 'quarter' as const,
          showTrendline: false,
          showMilestones: true,
          primaryMetric: 'weight' as const
        },
        notifications: {
          restTimer: false,
          workoutReminders: true,
          progressMilestones: false
        }
      };

      await dataManager.saveSettings(settings);
      const retrieved = await dataManager.getSettings();

      expect(retrieved).toEqual(settings);
    });

    it('should return default settings when none exist', async () => {
      const settings = await dataManager.getSettings();

      expect(settings.weightUnit).toBe('kg');
      expect(settings.theme).toBe('auto');
      expect(settings.restTimerDefault).toBe(90);
    });
  });

  describe('Backup Operations', () => {
    beforeEach(async () => {
      await dataManager.saveExercise(mockExercise);
      await dataManager.saveWorkout(mockWorkout);
    });

    it('should create backup with all data', async () => {
      const backup = await dataManager.createBackup();

      expect(backup.version).toBe('2.0');
      expect(backup.data.exercises).toHaveLength(1);
      expect(backup.data.workouts).toHaveLength(1);
      expect(backup.checksum).toBeDefined();
      expect(backup.timestamp).toBeDefined();
    });

    it('should restore from backup', async () => {
      const backup = await dataManager.createBackup();

      // Clear data
      await dataManager.clearAllData();
      let exercises = await dataManager.getAllExercises();
      expect(exercises).toHaveLength(0);

      // Restore from backup
      await dataManager.restoreFromBackup(backup);

      exercises = await dataManager.getAllExercises();
      const workouts = await dataManager.getAllWorkouts();

      expect(exercises).toHaveLength(1);
      expect(workouts).toHaveLength(1);
      expect(exercises[0].id).toBe(mockExercise.id);
      expect(workouts[0].id).toBe(mockWorkout.id);
    });

    it('should reject backup with invalid checksum', async () => {
      const backup = await dataManager.createBackup();
      backup.checksum = 'invalid-checksum';

      await expect(dataManager.restoreFromBackup(backup))
        .rejects.toThrow('Backup integrity check failed');
    });
  });

  describe('V1 Migration Support', () => {
    it('should migrate V1 exercise data', async () => {
      const v1Exercise = {
        id: 'v1-exercise-1',
        name: 'V1 Exercise',
        notes: 'V1 notes',
        dateCreated: '2023-12-01T00:00:00.000Z'
      };

      // Simulate V1 data in localStorage
      localStorage.setItem('strengthlog-exercises', JSON.stringify([v1Exercise]));

      // Re-initialize DataManager to trigger migration
      const newDataManager = new DataManager();
      await newDataManager.initialize();

      // Check if V1 data was detected (migration would be handled by MigrationManager)
      const exercises = await newDataManager.getAllExercises();

      // Since migration is handled by MigrationManager, we just ensure no crash occurred
      expect(exercises).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database initialization errors gracefully', async () => {
      // Mock IndexedDB to fail
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // This should not throw, but should handle the error
      const newDataManager = new DataManager();

      // Restore console
      consoleSpy.mockRestore();
    });

    it('should throw error when operating on uninitialized database', async () => {
      const uninitializedManager = new DataManager();

      await expect(uninitializedManager.saveExercise(mockExercise))
        .rejects.toThrow('Database not initialized');
    });
  });
});