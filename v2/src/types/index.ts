// 🏋️ Core Data Types - Analytics Optimized

export interface Exercise {
  id: string;
  name: string;
  notes: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  equipmentType: EquipmentType;
  dateCreated: string;
  isArchived: boolean;

  // 📊 Analytics metadata
  totalWorkouts: number;
  lastWorkoutDate?: string;
  personalBests: PersonalBests;
}

export interface WorkoutSession {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  exercises: WorkoutExercise[];
  notes: string;
  mood: number; // 1-5 scale
  duration: number; // minutes
  totalVolume: number;
  dateCreated: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  notes: string;
  restTime: number; // average rest between sets

  // 📈 Pre-calculated metrics for fast graphs
  metrics: WorkoutMetrics;

  // 🎯 Progression tracking
  progression: ProgressionData;
}

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  restTime?: number; // seconds
  isWarmup: boolean;
  isFailure: boolean;
  notes?: string;
}

export interface WorkoutMetrics {
  totalVolume: number; // weight × reps × sets
  maxWeight: number;
  maxReps: number;
  averageRPE?: number;
  estimatedOneRepMax: number;
  volumePerMinute: number; // training density
  intensityScore: number; // composite metric
}

export interface ProgressionData {
  weightChange: number; // vs last workout
  volumeChange: number; // vs last workout
  strengthChange: number; // estimated 1RM change
  isPersonalBest: boolean;
  streak: number; // consecutive improvements
  lastImprovement: string; // date
}

export interface PersonalBests {
  maxWeight: { value: number; date: string; reps: number };
  maxReps: { value: number; date: string; weight: number };
  maxVolume: { value: number; date: string };
  estimatedOneRepMax: { value: number; date: string };
}

// 📊 Analytics & Chart Data
export interface ProgressionChart {
  exerciseId: string;
  timeframe: 'week' | 'month' | 'quarter' | 'year' | 'all';
  dataPoints: ProgressionPoint[];
  trendline: TrendData;
  milestones: Milestone[];
}

export interface ProgressionPoint {
  date: string;
  volume: number;
  maxWeight: number;
  estimatedOneRepMax: number;
  reps: number;
  workoutId: string;
}

export interface TrendData {
  slope: number; // improvement rate
  correlation: number; // consistency
  prediction: number; // next expected value
}

export interface Milestone {
  date: string;
  type: 'pr_weight' | 'pr_reps' | 'pr_volume' | 'streak';
  value: number;
  description: string;
}

// 🎯 User Preferences & Settings
export interface UserSettings {
  weightUnit: 'kg' | 'lbs';
  dateFormat: 'iso' | 'us' | 'eu';
  theme: 'light' | 'dark' | 'auto';
  restTimerDefault: number;
  autoSave: boolean;
  analyticsEnabled: boolean;

  // 📈 Chart preferences
  chartDefaults: {
    timeframe: 'month' | 'quarter' | 'year';
    showTrendline: boolean;
    showMilestones: boolean;
    primaryMetric: 'volume' | 'weight' | 'oneRepMax';
  };

  // 🔔 Notifications
  notifications: {
    restTimer: boolean;
    workoutReminders: boolean;
    progressMilestones: boolean;
  };
}

// 📱 App State Management
export interface AppState {
  currentWorkout: WorkoutSession | null;
  activeExercise: WorkoutExercise | null;
  isTimerRunning: boolean;
  timerStartTime: number;

  // 📊 UI State
  selectedExerciseId: string | null;
  chartTimeframe: string;
  filterBy: FilterOptions;
  sortBy: SortOptions;
}

export interface FilterOptions {
  dateRange: { start?: string; end?: string };
  exercises: string[];
  categories: ExerciseCategory[];
  showArchived: boolean;
}

export interface SortOptions {
  field: 'date' | 'volume' | 'duration' | 'exercise';
  direction: 'asc' | 'desc';
}

// 🏷️ Enums for categorization
export enum ExerciseCategory {
  PUSH = 'push',
  PULL = 'pull',
  LEGS = 'legs',
  CORE = 'core',
  CARDIO = 'cardio',
  FLEXIBILITY = 'flexibility',
  COMPOUND = 'compound',
  ISOLATION = 'isolation'
}

export enum MuscleGroup {
  CHEST = 'chest',
  BACK = 'back',
  SHOULDERS = 'shoulders',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  FOREARMS = 'forearms',
  QUADRICEPS = 'quadriceps',
  HAMSTRINGS = 'hamstrings',
  GLUTES = 'glutes',
  CALVES = 'calves',
  CORE = 'core'
}

export enum EquipmentType {
  BODYWEIGHT = 'bodyweight',
  BARBELL = 'barbell',
  DUMBBELL = 'dumbbell',
  KETTLEBELL = 'kettlebell',
  MACHINE = 'machine',
  CABLE = 'cable',
  RESISTANCE_BAND = 'resistance_band',
  OTHER = 'other'
}

// 🔄 Sync & Backup
export interface SyncStatus {
  lastSync: string;
  pendingChanges: number;
  isOnline: boolean;
  backupEnabled: boolean;
  conflictCount: number;
}

export interface BackupData {
  version: string;
  timestamp: string;
  checksum: string;
  data: {
    exercises: Exercise[];
    workouts: WorkoutSession[];
    settings: UserSettings;
  };
}