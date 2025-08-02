// 🔄 V1 to V2 Migration Manager - Seamless Data Migration

import type { Exercise, WorkoutSession, WorkoutExercise, WorkoutSet } from '@types/index.js';
import { DataManager } from './DataManager.js';

// V1 Data Structures (for reference)
interface V1Exercise {
  id: string;
  name: string;
  notes?: string;
  dateCreated: string;
}

interface V1Workout {
  id: string;
  exerciseId: string;
  date: string;
  sets: Array<{
    weight: number;
    reps: number;
  }>;
  notes?: string;
  dateCreated: string;
}

interface V1BackupData {
  exercises: V1Exercise[];
  workouts: V1Workout[];
  backupDate: string;
  version: string;
}

export interface MigrationResult {
  success: boolean;
  migratedExercises: number;
  migratedWorkouts: number;
  errors: string[];
  backupCreated: boolean;
  rollbackAvailable: boolean;
}

export class MigrationManager {
  private dataManager: DataManager;
  private migrationBackup: string | null = null;

  constructor(dataManager: DataManager) {
    this.dataManager = dataManager;
  }

  // 🔄 Main migration entry point
  async migrateFromV1(): Promise<MigrationResult> {
    console.log('🔄 Starting V1 to V2 migration...');

    const result: MigrationResult = {
      success: false,
      migratedExercises: 0,
      migratedWorkouts: 0,
      errors: [],
      backupCreated: false,
      rollbackAvailable: false
    };

    try {
      // Step 1: Check if V1 data exists
      const v1Data = await this.detectV1Data();
      if (!v1Data) {
        console.log('ℹ️ No V1 data found, skipping migration');
        result.success = true;
        return result;
      }

      // Step 2: Create safety backup of V1 data
      await this.createV1Backup(v1Data);
      result.backupCreated = true;
      result.rollbackAvailable = true;

      // Step 3: Validate V1 data integrity
      const validationErrors = await this.validateV1Data(v1Data);
      if (validationErrors.length > 0) {
        result.errors = validationErrors;
        console.error('❌ V1 data validation failed:', validationErrors);
        return result;
      }

      // Step 4: Convert exercises
      const migratedExercises = await this.migrateExercises(v1Data.exercises);
      result.migratedExercises = migratedExercises.length;

      // Step 5: Convert workouts with enhanced analytics
      const migratedWorkouts = await this.migrateWorkouts(v1Data.workouts, migratedExercises);
      result.migratedWorkouts = migratedWorkouts.length;

      // Step 6: Save V2 data
      await this.saveV2Data(migratedExercises, migratedWorkouts);

      // Step 7: Update exercise statistics
      await this.updateExerciseStatistics(migratedExercises, migratedWorkouts);

      // Step 8: Archive V1 data (don't delete for safety)
      await this.archiveV1Data();

      result.success = true;
      console.log('✅ V1 to V2 migration completed successfully');
      console.log(`📊 Migrated ${result.migratedExercises} exercises and ${result.migratedWorkouts} workouts`);

    } catch (error) {
      console.error('❌ Migration failed:', error);
      result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Attempt rollback if possible
      if (result.rollbackAvailable) {
        try {
          await this.rollbackMigration();
          console.log('🔄 Migration rollback completed');
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError);
          result.errors.push('Rollback failed - manual intervention may be required');
        }
      }
    }

    return result;
  }

  // 🔍 Detect V1 data in localStorage
  private async detectV1Data(): Promise<V1BackupData | null> {
    try {
      const exercisesData = localStorage.getItem('strengthlog-exercises');
      const workoutsData = localStorage.getItem('strengthlog-workouts');

      if (!exercisesData && !workoutsData) {
        return null;
      }

      const exercises: V1Exercise[] = exercisesData ? JSON.parse(exercisesData) : [];
      const workouts: V1Workout[] = workoutsData ? JSON.parse(workoutsData) : [];

      return {
        exercises,
        workouts,
        backupDate: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('❌ Failed to detect V1 data:', error);
      return null;
    }
  }

  // 🛡️ Create safety backup of V1 data
  private async createV1Backup(v1Data: V1BackupData): Promise<void> {
    const backupKey = `strengthlog-v1-migration-backup-${Date.now()}`;
    const backupData = {
      ...v1Data,
      migrationTimestamp: new Date().toISOString(),
      originalKeys: {
        exercises: 'strengthlog-exercises',
        workouts: 'strengthlog-workouts'
      }
    };

    localStorage.setItem(backupKey, JSON.stringify(backupData));
    this.migrationBackup = backupKey;

    console.log('🛡️ V1 backup created:', backupKey);
  }

  // ✅ Validate V1 data integrity
  private async validateV1Data(v1Data: V1BackupData): Promise<string[]> {
    const errors: string[] = [];

    // Validate exercises
    v1Data.exercises.forEach((exercise, index) => {
      if (!exercise.id) errors.push(`Exercise ${index}: Missing ID`);
      if (!exercise.name) errors.push(`Exercise ${index}: Missing name`);
      if (!exercise.dateCreated) errors.push(`Exercise ${index}: Missing dateCreated`);
    });

    // Validate workouts
    v1Data.workouts.forEach((workout, index) => {
      if (!workout.id) errors.push(`Workout ${index}: Missing ID`);
      if (!workout.exerciseId) errors.push(`Workout ${index}: Missing exerciseId`);
      if (!workout.date) errors.push(`Workout ${index}: Missing date`);
      if (!workout.sets || workout.sets.length === 0) {
        errors.push(`Workout ${index}: Missing or empty sets`);
      }

      // Validate exercise reference exists
      const exerciseExists = v1Data.exercises.some(ex => ex.id === workout.exerciseId);
      if (!exerciseExists) {
        errors.push(`Workout ${index}: References non-existent exercise ${workout.exerciseId}`);
      }
    });

    return errors;
  }

  // 💪 Migrate exercises from V1 to V2 format
  private async migrateExercises(v1Exercises: V1Exercise[]): Promise<Exercise[]> {
    return v1Exercises.map(v1Exercise => {
      // Enhance V1 exercise with V2 features
      const v2Exercise: Exercise = {
        id: v1Exercise.id,
        name: v1Exercise.name,
        notes: v1Exercise.notes || '',
        category: this.inferExerciseCategory(v1Exercise.name),
        muscleGroups: this.inferMuscleGroups(v1Exercise.name),
        equipmentType: this.inferEquipmentType(v1Exercise.name),
        dateCreated: v1Exercise.dateCreated,
        isArchived: false,
        totalWorkouts: 0, // Will be calculated later
        lastWorkoutDate: undefined,
        personalBests: {
          maxWeight: { value: 0, date: '', reps: 0 },
          maxReps: { value: 0, date: '', weight: 0 },
          maxVolume: { value: 0, date: '' },
          estimatedOneRepMax: { value: 0, date: '' }
        }
      };

      return v2Exercise;
    });
  }

  // 🏋️ Migrate workouts from V1 to V2 format with analytics
  private async migrateWorkouts(v1Workouts: V1Workout[], exercises: Exercise[]): Promise<WorkoutSession[]> {
    const workoutSessions: WorkoutSession[] = [];

    // Group V1 workouts by date to create proper workout sessions
    const workoutsByDate = new Map<string, V1Workout[]>();

    v1Workouts.forEach(workout => {
      const dateKey = workout.date;
      if (!workoutsByDate.has(dateKey)) {
        workoutsByDate.set(dateKey, []);
      }
      workoutsByDate.get(dateKey)!.push(workout);
    });

    // Convert grouped workouts to V2 sessions
    for (const [date, dayWorkouts] of workoutsByDate) {
      const workoutExercises: WorkoutExercise[] = [];
      let totalVolume = 0;

      for (const v1Workout of dayWorkouts) {
        // Convert sets to V2 format
        const v2Sets: WorkoutSet[] = v1Workout.sets.map(set => ({
          id: this.generateId(),
          weight: set.weight,
          reps: set.reps,
          rpe: undefined,
          restTime: undefined,
          isWarmup: false,
          isFailure: false,
          notes: undefined
        }));

        // Calculate metrics for this exercise
        const metrics = this.calculateWorkoutMetrics(v2Sets);
        totalVolume += metrics.totalVolume;

        // Calculate progression (will be enhanced later with historical data)
        const progression = {
          weightChange: 0,
          volumeChange: 0,
          strengthChange: 0,
          isPersonalBest: false,
          streak: 0,
          lastImprovement: ''
        };

        const workoutExercise: WorkoutExercise = {
          id: v1Workout.id,
          exerciseId: v1Workout.exerciseId,
          sets: v2Sets,
          notes: v1Workout.notes || '',
          restTime: 90, // Default rest time
          metrics,
          progression
        };

        workoutExercises.push(workoutExercise);
      }

      // Create V2 workout session
      const workoutSession: WorkoutSession = {
        id: this.generateId(),
        date,
        startTime: '10:00', // Default start time
        endTime: '11:00',   // Default end time
        exercises: workoutExercises,
        notes: '',
        mood: 3, // Neutral mood
        duration: 60, // Default duration
        totalVolume,
        dateCreated: dayWorkouts[0].dateCreated
      };

      workoutSessions.push(workoutSession);
    }

    return workoutSessions;
  }

  // 📊 Calculate workout metrics from sets
  private calculateWorkoutMetrics(sets: WorkoutSet[]) {
    const totalVolume = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    const maxWeight = Math.max(...sets.map(set => set.weight));
    const maxReps = Math.max(...sets.map(set => set.reps));

    // Simple 1RM estimation using Epley formula
    const estimatedOneRepMax = sets.reduce((best, set) => {
      if (set.reps === 0 || set.weight === 0) return best;
      const estimate = set.weight * (1 + set.reps / 30);
      return Math.max(best, estimate);
    }, 0);

    return {
      totalVolume,
      maxWeight,
      maxReps,
      averageRPE: undefined,
      estimatedOneRepMax: Math.round(estimatedOneRepMax * 10) / 10,
      volumePerMinute: totalVolume / 60, // Assume 60 min workout
      intensityScore: totalVolume > 0 ? (maxWeight * maxReps) / totalVolume * 100 : 0
    };
  }

  // 💾 Save migrated data to V2 database
  private async saveV2Data(exercises: Exercise[], workouts: WorkoutSession[]): Promise<void> {
    // Save exercises
    for (const exercise of exercises) {
      await this.dataManager.saveExercise(exercise);
    }

    // Save workouts
    for (const workout of workouts) {
      await this.dataManager.saveWorkout(workout);
    }

    console.log('💾 V2 data saved successfully');
  }

  // 📊 Update exercise statistics based on migrated workouts
  private async updateExerciseStatistics(exercises: Exercise[], workouts: WorkoutSession[]): Promise<void> {
    for (const exercise of exercises) {
      const exerciseWorkouts = workouts.filter(workout =>
        workout.exercises.some(ex => ex.exerciseId === exercise.id)
      );

      exercise.totalWorkouts = exerciseWorkouts.length;

      if (exerciseWorkouts.length > 0) {
        // Find latest workout date
        exercise.lastWorkoutDate = exerciseWorkouts
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date;

        // Calculate personal bests
        const allExerciseData = exerciseWorkouts.flatMap(workout =>
          workout.exercises.filter(ex => ex.exerciseId === exercise.id)
        );

        // Max weight PR
        const maxWeightData = allExerciseData.reduce((best, ex) =>
          ex.metrics.maxWeight > best.weight ?
            { weight: ex.metrics.maxWeight, date: workout.date, reps: ex.metrics.maxReps } :
            best
        , { weight: 0, date: '', reps: 0 });

        exercise.personalBests.maxWeight = {
          value: maxWeightData.weight,
          date: maxWeightData.date,
          reps: maxWeightData.reps
        };

        // Max volume PR
        const maxVolumeData = allExerciseData.reduce((best, ex) =>
          ex.metrics.totalVolume > best.volume ?
            { volume: ex.metrics.totalVolume, date: workout.date } :
            best
        , { volume: 0, date: '' });

        exercise.personalBests.maxVolume = {
          value: maxVolumeData.volume,
          date: maxVolumeData.date
        };

        // Max 1RM PR
        const max1RMData = allExerciseData.reduce((best, ex) =>
          ex.metrics.estimatedOneRepMax > best.oneRM ?
            { oneRM: ex.metrics.estimatedOneRepMax, date: workout.date } :
            best
        , { oneRM: 0, date: '' });

        exercise.personalBests.estimatedOneRepMax = {
          value: max1RMData.oneRM,
          date: max1RMData.date
        };

        // Update exercise in database
        await this.dataManager.saveExercise(exercise);
      }
    }

    console.log('📊 Exercise statistics updated');
  }

  // 📦 Archive V1 data (keep as backup)
  private async archiveV1Data(): Promise<void> {
    const archiveData = {
      exercises: localStorage.getItem('strengthlog-exercises'),
      workouts: localStorage.getItem('strengthlog-workouts'),
      archivedAt: new Date().toISOString(),
      migrationCompleted: true
    };

    localStorage.setItem('strengthlog-v1-archive', JSON.stringify(archiveData));

    // Don't delete original V1 data immediately - keep for safety
    console.log('📦 V1 data archived (originals preserved for safety)');
  }

  // 🔄 Rollback migration if needed
  private async rollbackMigration(): Promise<void> {
    if (!this.migrationBackup) {
      throw new Error('No migration backup available for rollback');
    }

    const backupData = localStorage.getItem(this.migrationBackup);
    if (!backupData) {
      throw new Error('Migration backup data not found');
    }

    const backup = JSON.parse(backupData);

    // Restore V1 data
    localStorage.setItem('strengthlog-exercises', JSON.stringify(backup.exercises));
    localStorage.setItem('strengthlog-workouts', JSON.stringify(backup.workouts));

    // Clear V2 data
    await this.dataManager.clearAllData();

    console.log('🔄 Migration rollback completed');
  }

  // 🎯 AI-powered exercise categorization
  private inferExerciseCategory(exerciseName: string): string {
    const name = exerciseName.toLowerCase();

    if (name.includes('push') || name.includes('press') || name.includes('chest')) {
      return 'push';
    } else if (name.includes('pull') || name.includes('chin') || name.includes('row')) {
      return 'pull';
    } else if (name.includes('squat') || name.includes('lunge') || name.includes('leg')) {
      return 'legs';
    } else if (name.includes('plank') || name.includes('crunch') || name.includes('core')) {
      return 'core';
    } else {
      return 'compound'; // Default category
    }
  }

  private inferMuscleGroups(exerciseName: string): string[] {
    const name = exerciseName.toLowerCase();
    const groups: string[] = [];

    if (name.includes('chest') || name.includes('push')) groups.push('chest');
    if (name.includes('back') || name.includes('pull') || name.includes('row')) groups.push('back');
    if (name.includes('shoulder')) groups.push('shoulders');
    if (name.includes('bicep') || name.includes('curl')) groups.push('biceps');
    if (name.includes('tricep')) groups.push('triceps');
    if (name.includes('leg') || name.includes('squat')) groups.push('quadriceps');
    if (name.includes('chin') || name.includes('pull')) groups.push('biceps', 'back');

    return groups.length > 0 ? groups : ['core']; // Default to core if no specific groups found
  }

  private inferEquipmentType(exerciseName: string): string {
    const name = exerciseName.toLowerCase();

    if (name.includes('barbell')) return 'barbell';
    if (name.includes('dumbbell')) return 'dumbbell';
    if (name.includes('machine')) return 'machine';
    if (name.includes('cable')) return 'cable';

    return 'bodyweight'; // Default for most basic exercises
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 🧹 Cleanup migration artifacts
  async cleanupMigration(): Promise<void> {
    if (this.migrationBackup) {
      localStorage.removeItem(this.migrationBackup);
      console.log('🧹 Migration backup cleaned up');
    }
  }
}