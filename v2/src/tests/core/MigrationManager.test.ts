// 🧪 MigrationManager Tests - V1 to V2 data migration

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MigrationManager } from '@core/MigrationManager.js';
import { DataManager } from '@core/DataManager.js';

describe('MigrationManager', () => {
  let migrationManager: MigrationManager;
  let dataManager: DataManager;

  beforeEach(async () => {
    dataManager = new DataManager();
    await dataManager.initialize();
    migrationManager = new MigrationManager(dataManager);

    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('V1 Data Detection', () => {
    it('should return null when no V1 data exists', async () => {
      const result = await migrationManager.migrateFromV1();

      expect(result.success).toBe(true);
      expect(result.migratedExercises).toBe(0);
      expect(result.migratedWorkouts).toBe(0);
    });

    it('should detect V1 data in localStorage', async () => {
      const v1Exercises = [
        {
          id: 'v1-ex-1',
          name: 'Push-ups',
          notes: 'Basic push-up',
          dateCreated: '2023-12-01T00:00:00.000Z'
        }
      ];

      const v1Workouts = [
        {
          id: 'v1-wo-1',
          exerciseId: 'v1-ex-1',
          date: '2023-12-01',
          sets: [
            { weight: 0, reps: 10 },
            { weight: 0, reps: 8 }
          ],
          notes: 'Good workout',
          dateCreated: '2023-12-01T10:00:00.000Z'
        }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify(v1Workouts));

      const result = await migrationManager.migrateFromV1();

      expect(result.success).toBe(true);
      expect(result.migratedExercises).toBe(1);
      expect(result.migratedWorkouts).toBe(1);
      expect(result.backupCreated).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('should validate V1 data integrity', async () => {
      const invalidV1Data = [
        {
          // Missing required fields
          name: 'Invalid Exercise'
        }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(invalidV1Data));

      const result = await migrationManager.migrateFromV1();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Missing ID'))).toBe(true);
    });

    it('should validate workout references to exercises', async () => {
      const v1Exercises = [
        { id: 'ex-1', name: 'Exercise 1', dateCreated: '2023-12-01T00:00:00.000Z' }
      ];

      const v1Workouts = [
        {
          id: 'wo-1',
          exerciseId: 'non-existent-exercise',
          date: '2023-12-01',
          sets: [{ weight: 0, reps: 10 }],
          dateCreated: '2023-12-01T10:00:00.000Z'
        }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify(v1Workouts));

      const result = await migrationManager.migrateFromV1();

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('non-existent exercise'))).toBe(true);
    });
  });

  describe('Exercise Migration', () => {
    it('should migrate V1 exercises to V2 format', async () => {
      const v1Exercises = [
        {
          id: 'v1-ex-1',
          name: 'Push-ups',
          notes: 'Basic exercise',
          dateCreated: '2023-12-01T00:00:00.000Z'
        },
        {
          id: 'v1-ex-2',
          name: 'Pull-ups',
          dateCreated: '2023-12-01T00:00:00.000Z'
        }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify([]));

      const result = await migrationManager.migrateFromV1();

      expect(result.success).toBe(true);
      expect(result.migratedExercises).toBe(2);

      // Check that V2 data was created
      const migratedExercises = await dataManager.getAllExercises();
      expect(migratedExercises).toHaveLength(2);

      const pushUps = migratedExercises.find(ex => ex.name === 'Push-ups');
      expect(pushUps).toBeDefined();
      expect(pushUps?.category).toBe('push'); // Should be inferred
      expect(pushUps?.equipmentType).toBe('bodyweight'); // Should be inferred
      expect(pushUps?.notes).toBe('Basic exercise');
      expect(pushUps?.personalBests).toBeDefined();
    });

    it('should infer exercise categories correctly', async () => {
      const v1Exercises = [
        { id: '1', name: 'Push-ups', dateCreated: '2023-12-01T00:00:00.000Z' },
        { id: '2', name: 'Pull-ups', dateCreated: '2023-12-01T00:00:00.000Z' },
        { id: '3', name: 'Squats', dateCreated: '2023-12-01T00:00:00.000Z' },
        { id: '4', name: 'Plank', dateCreated: '2023-12-01T00:00:00.000Z' }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify([]));

      await migrationManager.migrateFromV1();

      const exercises = await dataManager.getAllExercises();

      expect(exercises.find(ex => ex.name === 'Push-ups')?.category).toBe('push');
      expect(exercises.find(ex => ex.name === 'Pull-ups')?.category).toBe('pull');
      expect(exercises.find(ex => ex.name === 'Squats')?.category).toBe('legs');
      expect(exercises.find(ex => ex.name === 'Plank')?.category).toBe('core');
    });
  });

  describe('Workout Migration', () => {
    it('should migrate V1 workouts to V2 workout sessions', async () => {
      const v1Exercises = [
        { id: 'ex-1', name: 'Push-ups', dateCreated: '2023-12-01T00:00:00.000Z' }
      ];

      const v1Workouts = [
        {
          id: 'wo-1',
          exerciseId: 'ex-1',
          date: '2023-12-01',
          sets: [
            { weight: 0, reps: 10 },
            { weight: 0, reps: 8 },
            { weight: 0, reps: 6 }
          ],
          notes: 'Great workout',
          dateCreated: '2023-12-01T10:00:00.000Z'
        }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify(v1Workouts));

      const result = await migrationManager.migrateFromV1();

      expect(result.success).toBe(true);
      expect(result.migratedWorkouts).toBe(1);

      const workouts = await dataManager.getAllWorkouts();
      expect(workouts).toHaveLength(1);

      const workout = workouts[0];
      expect(workout.date).toBe('2023-12-01');
      expect(workout.exercises).toHaveLength(1);
      expect(workout.exercises[0].sets).toHaveLength(3);
      expect(workout.exercises[0].notes).toBe('Great workout');
      expect(workout.exercises[0].metrics.totalVolume).toBe(0); // bodyweight
      expect(workout.exercises[0].metrics.maxReps).toBe(10);
    });

    it('should group multiple exercises on same date into single session', async () => {
      const v1Exercises = [
        { id: 'ex-1', name: 'Push-ups', dateCreated: '2023-12-01T00:00:00.000Z' },
        { id: 'ex-2', name: 'Squats', dateCreated: '2023-12-01T00:00:00.000Z' }
      ];

      const v1Workouts = [
        {
          id: 'wo-1',
          exerciseId: 'ex-1',
          date: '2023-12-01',
          sets: [{ weight: 0, reps: 10 }],
          dateCreated: '2023-12-01T10:00:00.000Z'
        },
        {
          id: 'wo-2',
          exerciseId: 'ex-2',
          date: '2023-12-01',
          sets: [{ weight: 50, reps: 5 }],
          dateCreated: '2023-12-01T10:30:00.000Z'
        }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify(v1Workouts));

      const result = await migrationManager.migrateFromV1();

      expect(result.success).toBe(true);
      expect(result.migratedWorkouts).toBe(1); // Should be grouped into 1 session

      const workouts = await dataManager.getAllWorkouts();
      expect(workouts).toHaveLength(1);
      expect(workouts[0].exercises).toHaveLength(2);
      expect(workouts[0].totalVolume).toBe(250); // 0 + 250
    });

    it('should calculate workout metrics correctly', async () => {
      const v1Exercises = [
        { id: 'ex-1', name: 'Bench Press', dateCreated: '2023-12-01T00:00:00.000Z' }
      ];

      const v1Workouts = [
        {
          id: 'wo-1',
          exerciseId: 'ex-1',
          date: '2023-12-01',
          sets: [
            { weight: 100, reps: 5 },
            { weight: 100, reps: 3 },
            { weight: 100, reps: 1 }
          ],
          dateCreated: '2023-12-01T10:00:00.000Z'
        }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify(v1Workouts));

      await migrationManager.migrateFromV1();

      const workouts = await dataManager.getAllWorkouts();
      const exercise = workouts[0].exercises[0];

      expect(exercise.metrics.totalVolume).toBe(900); // 500 + 300 + 100
      expect(exercise.metrics.maxWeight).toBe(100);
      expect(exercise.metrics.maxReps).toBe(5);
      expect(exercise.metrics.estimatedOneRepMax).toBeCloseTo(116.7, 1); // 100 * (1 + 5/30)
    });
  });

  describe('Personal Records Migration', () => {
    it('should calculate personal records from migrated data', async () => {
      const v1Exercises = [
        { id: 'ex-1', name: 'Bench Press', dateCreated: '2023-12-01T00:00:00.000Z' }
      ];

      const v1Workouts = [
        {
          id: 'wo-1',
          exerciseId: 'ex-1',
          date: '2023-12-01',
          sets: [{ weight: 100, reps: 5 }],
          dateCreated: '2023-12-01T10:00:00.000Z'
        },
        {
          id: 'wo-2',
          exerciseId: 'ex-1',
          date: '2023-12-08',
          sets: [{ weight: 110, reps: 5 }],
          dateCreated: '2023-12-08T10:00:00.000Z'
        }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify(v1Workouts));

      await migrationManager.migrateFromV1();

      const exercises = await dataManager.getAllExercises();
      const exercise = exercises[0];

      expect(exercise.totalWorkouts).toBe(2);
      expect(exercise.lastWorkoutDate).toBe('2023-12-08');
      expect(exercise.personalBests.maxWeight.value).toBe(110);
      expect(exercise.personalBests.maxWeight.date).toBe('2023-12-08');
      expect(exercise.personalBests.maxVolume.value).toBe(550);
    });
  });

  describe('Backup and Safety', () => {
    it('should create backup of V1 data before migration', async () => {
      const v1Exercises = [
        { id: 'ex-1', name: 'Test', dateCreated: '2023-12-01T00:00:00.000Z' }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify([]));

      const result = await migrationManager.migrateFromV1();

      expect(result.backupCreated).toBe(true);
      expect(result.rollbackAvailable).toBe(true);

      // Check that backup exists in localStorage
      const backupKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('strengthlog-v1-migration-backup-')
      );
      expect(backupKeys).toHaveLength(1);
    });

    it('should archive V1 data after successful migration', async () => {
      const v1Exercises = [
        { id: 'ex-1', name: 'Test', dateCreated: '2023-12-01T00:00:00.000Z' }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify([]));

      await migrationManager.migrateFromV1();

      // Check that archive was created
      const archiveData = localStorage.getItem('strengthlog-v1-archive');
      expect(archiveData).toBeDefined();

      const archive = JSON.parse(archiveData!);
      expect(archive.migrationCompleted).toBe(true);
      expect(archive.archivedAt).toBeDefined();
    });
  });

  describe('Error Handling and Rollback', () => {
    it('should handle migration errors gracefully', async () => {
      // Mock DataManager to throw an error
      const saveSpy = vi.spyOn(dataManager, 'saveExercise').mockRejectedValue(new Error('Save failed'));

      const v1Exercises = [
        { id: 'ex-1', name: 'Test', dateCreated: '2023-12-01T00:00:00.000Z' }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify([]));

      const result = await migrationManager.migrateFromV1();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Save failed'))).toBe(true);

      saveSpy.mockRestore();
    });

    it('should attempt rollback on migration failure', async () => {
      const clearSpy = vi.spyOn(dataManager, 'clearAllData').mockResolvedValue();
      const saveSpy = vi.spyOn(dataManager, 'saveExercise').mockRejectedValue(new Error('Save failed'));

      const v1Exercises = [
        { id: 'ex-1', name: 'Test', dateCreated: '2023-12-01T00:00:00.000Z' }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify([]));

      await migrationManager.migrateFromV1();

      // Should have attempted to clear V2 data as part of rollback
      expect(clearSpy).toHaveBeenCalled();

      saveSpy.mockRestore();
      clearSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JSON in localStorage', async () => {
      localStorage.setItem('strengthlog-exercises', 'invalid json');

      const result = await migrationManager.migrateFromV1();

      // Should not throw, should return success with no migration
      expect(result.success).toBe(true);
      expect(result.migratedExercises).toBe(0);
    });

    it('should handle empty arrays gracefully', async () => {
      localStorage.setItem('strengthlog-exercises', JSON.stringify([]));
      localStorage.setItem('strengthlog-workouts', JSON.stringify([]));

      const result = await migrationManager.migrateFromV1();

      expect(result.success).toBe(true);
      expect(result.migratedExercises).toBe(0);
      expect(result.migratedWorkouts).toBe(0);
    });

    it('should handle missing optional fields in V1 data', async () => {
      const v1Exercises = [
        {
          id: 'ex-1',
          name: 'Test Exercise',
          // notes missing
          dateCreated: '2023-12-01T00:00:00.000Z'
        }
      ];

      const v1Workouts = [
        {
          id: 'wo-1',
          exerciseId: 'ex-1',
          date: '2023-12-01',
          sets: [{ weight: 0, reps: 10 }],
          // notes missing
          dateCreated: '2023-12-01T10:00:00.000Z'
        }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify(v1Workouts));

      const result = await migrationManager.migrateFromV1();

      expect(result.success).toBe(true);

      const exercises = await dataManager.getAllExercises();
      const workouts = await dataManager.getAllWorkouts();

      expect(exercises[0].notes).toBe(''); // Should default to empty string
      expect(workouts[0].exercises[0].notes).toBe(''); // Should default to empty string
    });
  });

  describe('Cleanup', () => {
    it('should cleanup migration artifacts', async () => {
      const v1Exercises = [
        { id: 'ex-1', name: 'Test', dateCreated: '2023-12-01T00:00:00.000Z' }
      ];

      localStorage.setItem('strengthlog-exercises', JSON.stringify(v1Exercises));
      localStorage.setItem('strengthlog-workouts', JSON.stringify([]));

      await migrationManager.migrateFromV1();

      // Should have backup before cleanup
      let backupKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('strengthlog-v1-migration-backup-')
      );
      expect(backupKeys).toHaveLength(1);

      await migrationManager.cleanupMigration();

      // Should have no backup after cleanup
      backupKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('strengthlog-v1-migration-backup-')
      );
      expect(backupKeys).toHaveLength(0);
    });
  });
});