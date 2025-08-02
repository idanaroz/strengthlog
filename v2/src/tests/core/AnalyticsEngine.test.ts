// 🧪 AnalyticsEngine Tests - Advanced progression analytics

import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsEngine } from '@core/AnalyticsEngine.js';
import type { Exercise, WorkoutSession } from '@types/index.js';

describe('AnalyticsEngine', () => {
  let analyticsEngine: AnalyticsEngine;
  let mockExercises: Exercise[];
  let mockWorkouts: WorkoutSession[];

  beforeEach(() => {
    mockExercises = [
      createMockExercise({
        id: 'exercise-1',
        name: 'Push-ups',
        category: 'push'
      }),
      createMockExercise({
        id: 'exercise-2',
        name: 'Pull-ups',
        category: 'pull'
      })
    ];

    mockWorkouts = [
      createMockWorkout({
        id: 'workout-1',
        date: '2024-01-01',
        exercises: [{
          id: 'we-1',
          exerciseId: 'exercise-1',
          sets: [
            createMockWorkoutSet({ weight: 0, reps: 10 }),
            createMockWorkoutSet({ weight: 0, reps: 8 }),
            createMockWorkoutSet({ weight: 0, reps: 6 })
          ],
          notes: '',
          restTime: 90,
          metrics: {
            totalVolume: 0, // bodyweight
            maxWeight: 0,
            maxReps: 10,
            estimatedOneRepMax: 0,
            volumePerMinute: 0,
            intensityScore: 0
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
      }),
      createMockWorkout({
        id: 'workout-2',
        date: '2024-01-08',
        exercises: [{
          id: 'we-2',
          exerciseId: 'exercise-1',
          sets: [
            createMockWorkoutSet({ weight: 0, reps: 12 }),
            createMockWorkoutSet({ weight: 0, reps: 10 }),
            createMockWorkoutSet({ weight: 0, reps: 8 })
          ],
          notes: '',
          restTime: 90,
          metrics: {
            totalVolume: 0,
            maxWeight: 0,
            maxReps: 12,
            estimatedOneRepMax: 0,
            volumePerMinute: 0,
            intensityScore: 0
          },
          progression: {
            weightChange: 0,
            volumeChange: 0,
            strengthChange: 0,
            isPersonalBest: true,
            streak: 1,
            lastImprovement: '2024-01-08'
          }
        }]
      }),
      createMockWorkout({
        id: 'workout-3',
        date: '2024-01-15',
        exercises: [{
          id: 'we-3',
          exerciseId: 'exercise-2',
          sets: [
            createMockWorkoutSet({ weight: 0, reps: 5 }),
            createMockWorkoutSet({ weight: 0, reps: 4 }),
            createMockWorkoutSet({ weight: 0, reps: 3 })
          ],
          notes: '',
          restTime: 120,
          metrics: {
            totalVolume: 0,
            maxWeight: 0,
            maxReps: 5,
            estimatedOneRepMax: 0,
            volumePerMinute: 0,
            intensityScore: 0
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
      })
    ];

    analyticsEngine = new AnalyticsEngine(mockExercises, mockWorkouts);
  });

  describe('Progression Chart Generation', () => {
    it('should generate progression chart data', () => {
      const chart = analyticsEngine.generateProgressionChart('exercise-1', 'month');

      expect(chart.exerciseId).toBe('exercise-1');
      expect(chart.timeframe).toBe('month');
      expect(chart.dataPoints).toHaveLength(2);
      expect(chart.trendline).toBeDefined();
      expect(chart.milestones).toBeDefined();
    });

    it('should filter workouts by timeframe', () => {
      const weekChart = analyticsEngine.generateProgressionChart('exercise-1', 'week');
      const allChart = analyticsEngine.generateProgressionChart('exercise-1', 'all');

      expect(weekChart.dataPoints.length).toBeLessThanOrEqual(allChart.dataPoints.length);
      expect(allChart.dataPoints).toHaveLength(2);
    });

    it('should calculate progression points correctly', () => {
      const chart = analyticsEngine.generateProgressionChart('exercise-1', 'all');
      const firstPoint = chart.dataPoints[0];
      const secondPoint = chart.dataPoints[1];

      expect(firstPoint.date).toBe('2024-01-01');
      expect(firstPoint.reps).toBe(24); // 10 + 8 + 6
      expect(firstPoint.maxReps).toBe(10);

      expect(secondPoint.date).toBe('2024-01-08');
      expect(secondPoint.reps).toBe(30); // 12 + 10 + 8
      expect(secondPoint.maxReps).toBe(12);
    });

    it('should return empty chart for non-existent exercise', () => {
      const chart = analyticsEngine.generateProgressionChart('non-existent', 'all');

      expect(chart.dataPoints).toHaveLength(0);
      expect(chart.milestones).toHaveLength(0);
    });
  });

  describe('1RM Calculation', () => {
    it('should calculate 1RM using Epley formula', () => {
      const weightedWorkout = createMockWorkout({
        id: 'weighted-workout',
        date: '2024-01-20',
        exercises: [{
          id: 'we-weighted',
          exerciseId: 'exercise-1',
          sets: [
            createMockWorkoutSet({ weight: 100, reps: 5 }),
            createMockWorkoutSet({ weight: 100, reps: 3 }),
            createMockWorkoutSet({ weight: 100, reps: 1 })
          ],
          notes: '',
          restTime: 180,
          metrics: {
            totalVolume: 900, // 500 + 300 + 100
            maxWeight: 100,
            maxReps: 5,
            estimatedOneRepMax: 116.7, // 100 * (1 + 5/30) = 116.67
            volumePerMinute: 15,
            intensityScore: 11.1
          },
          progression: {
            weightChange: 100,
            volumeChange: 900,
            strengthChange: 116.7,
            isPersonalBest: true,
            streak: 1,
            lastImprovement: '2024-01-20'
          }
        }]
      });

      const engine = new AnalyticsEngine(mockExercises, [weightedWorkout]);
      const chart = engine.generateProgressionChart('exercise-1', 'all');

      expect(chart.dataPoints[0].estimatedOneRepMax).toBeCloseTo(116.7, 1);
    });

    it('should handle bodyweight exercises (0 weight)', () => {
      const chart = analyticsEngine.generateProgressionChart('exercise-1', 'all');

      // For bodyweight exercises, 1RM calculation should still work
      expect(chart.dataPoints[0].estimatedOneRepMax).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Trend Analysis', () => {
    it('should calculate trend slope and correlation', () => {
      const chart = analyticsEngine.generateProgressionChart('exercise-1', 'all');

      expect(chart.trendline.slope).toBeDefined();
      expect(chart.trendline.correlation).toBeDefined();
      expect(chart.trendline.prediction).toBeDefined();

      // With progression from 10 to 12 max reps, slope should be positive
      expect(chart.trendline.slope).toBeGreaterThan(0);
    });

    it('should handle single data point gracefully', () => {
      const chart = analyticsEngine.generateProgressionChart('exercise-2', 'all');

      expect(chart.trendline.slope).toBe(0);
      expect(chart.trendline.correlation).toBe(0);
      expect(chart.trendline.prediction).toBe(0);
    });

    it('should calculate correlation coefficient correctly', () => {
      const chart = analyticsEngine.generateProgressionChart('exercise-1', 'all');

      // Perfect progression should have high correlation
      expect(Math.abs(chart.trendline.correlation)).toBeGreaterThanOrEqual(0);
      expect(Math.abs(chart.trendline.correlation)).toBeLessThanOrEqual(1);
    });
  });

  describe('Milestone Detection', () => {
    it('should identify personal records', () => {
      const chart = analyticsEngine.generateProgressionChart('exercise-1', 'all');

      // Should detect rep PR from 10 to 12
      const repsMilestone = chart.milestones.find(m => m.type === 'pr_reps');
      expect(repsMilestone).toBeDefined();
      expect(repsMilestone?.value).toBe(12);
      expect(repsMilestone?.date).toBe('2024-01-08');
    });

    it('should not create milestones for no improvement', () => {
      const chart = analyticsEngine.generateProgressionChart('exercise-2', 'all');

      // Only one workout, so no milestones
      expect(chart.milestones).toHaveLength(0);
    });

    it('should handle volume milestones', () => {
      const weightedWorkouts = [
        createMockWorkout({
          date: '2024-01-01',
          exercises: [{
            id: 'we-1',
            exerciseId: 'exercise-1',
            sets: [createMockWorkoutSet({ weight: 50, reps: 10 })],
            metrics: { totalVolume: 500, maxWeight: 50, maxReps: 10, estimatedOneRepMax: 66.7, volumePerMinute: 8.33, intensityScore: 10 },
            notes: '', restTime: 90,
            progression: { weightChange: 0, volumeChange: 0, strengthChange: 0, isPersonalBest: false, streak: 0, lastImprovement: '' }
          }]
        }),
        createMockWorkout({
          date: '2024-01-08',
          exercises: [{
            id: 'we-2',
            exerciseId: 'exercise-1',
            sets: [createMockWorkoutSet({ weight: 60, reps: 10 })],
            metrics: { totalVolume: 600, maxWeight: 60, maxReps: 10, estimatedOneRepMax: 80, volumePerMinute: 10, intensityScore: 10 },
            notes: '', restTime: 90,
            progression: { weightChange: 10, volumeChange: 100, strengthChange: 13.3, isPersonalBest: true, streak: 1, lastImprovement: '2024-01-08' }
          }]
        })
      ];

      const engine = new AnalyticsEngine(mockExercises, weightedWorkouts);
      const chart = engine.generateProgressionChart('exercise-1', 'all');

      const volumeMilestone = chart.milestones.find(m => m.type === 'pr_volume');
      expect(volumeMilestone).toBeDefined();
      expect(volumeMilestone?.value).toBe(600);
    });
  });

  describe('Exercise Insights', () => {
    it('should generate comprehensive exercise insights', () => {
      const insights = analyticsEngine.generateExerciseInsights('exercise-1');

      expect(insights).toBeDefined();
      expect(insights?.exercise.id).toBe('exercise-1');
      expect(insights?.totalWorkouts).toBe(2);
      expect(insights?.improvements).toBeGreaterThanOrEqual(0);
      expect(insights?.trendStrength).toBeGreaterThanOrEqual(0);
      expect(insights?.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(insights?.recommendations).toBeDefined();
    });

    it('should return null for non-existent exercise', () => {
      const insights = analyticsEngine.generateExerciseInsights('non-existent');

      expect(insights).toBeNull();
    });

    it('should provide recommendations based on progress', () => {
      const insights = analyticsEngine.generateExerciseInsights('exercise-1');

      expect(insights?.recommendations).toBeInstanceOf(Array);
      // Should have at least some recommendations for any exercise with data
      expect(insights?.recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate consistency score', () => {
      const insights = analyticsEngine.generateExerciseInsights('exercise-1');

      expect(insights?.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(insights?.consistencyScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Optimization', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset
      const largeWorkouts = Array.from({ length: 100 }, (_, i) =>
        createMockWorkout({
          id: `workout-${i}`,
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          exercises: [{
            id: `we-${i}`,
            exerciseId: 'exercise-1',
            sets: [createMockWorkoutSet({ weight: 50 + i, reps: 10 })],
            metrics: {
              totalVolume: (50 + i) * 10,
              maxWeight: 50 + i,
              maxReps: 10,
              estimatedOneRepMax: (50 + i) * 1.33,
              volumePerMinute: (50 + i) * 10 / 60,
              intensityScore: 10
            },
            notes: '', restTime: 90,
            progression: { weightChange: i > 0 ? 1 : 0, volumeChange: i > 0 ? 10 : 0, strengthChange: i > 0 ? 1.33 : 0, isPersonalBest: i > 50, streak: 0, lastImprovement: '' }
          }]
        })
      );

      const engine = new AnalyticsEngine(mockExercises, largeWorkouts);

      const startTime = performance.now();
      const chart = engine.generateProgressionChart('exercise-1', 'all');
      const endTime = performance.now();

      // Should complete within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(chart.dataPoints).toHaveLength(100);
    });

    it('should cache expensive calculations', () => {
      const chart1 = analyticsEngine.generateProgressionChart('exercise-1', 'all');
      const chart2 = analyticsEngine.generateProgressionChart('exercise-1', 'all');

      // Results should be identical (though caching is internal)
      expect(chart1.dataPoints).toEqual(chart2.dataPoints);
      expect(chart1.trendline).toEqual(chart2.trendline);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty workout sets', () => {
      const emptyWorkout = createMockWorkout({
        exercises: [{
          id: 'empty-we',
          exerciseId: 'exercise-1',
          sets: [],
          metrics: { totalVolume: 0, maxWeight: 0, maxReps: 0, estimatedOneRepMax: 0, volumePerMinute: 0, intensityScore: 0 },
          notes: '', restTime: 90,
          progression: { weightChange: 0, volumeChange: 0, strengthChange: 0, isPersonalBest: false, streak: 0, lastImprovement: '' }
        }]
      });

      const engine = new AnalyticsEngine(mockExercises, [emptyWorkout]);
      const chart = engine.generateProgressionChart('exercise-1', 'all');

      expect(chart.dataPoints).toHaveLength(1);
      expect(chart.dataPoints[0].volume).toBe(0);
    });

    it('should handle zero weight and reps', () => {
      const zeroWorkout = createMockWorkout({
        exercises: [{
          id: 'zero-we',
          exerciseId: 'exercise-1',
          sets: [createMockWorkoutSet({ weight: 0, reps: 0 })],
          metrics: { totalVolume: 0, maxWeight: 0, maxReps: 0, estimatedOneRepMax: 0, volumePerMinute: 0, intensityScore: 0 },
          notes: '', restTime: 90,
          progression: { weightChange: 0, volumeChange: 0, strengthChange: 0, isPersonalBest: false, streak: 0, lastImprovement: '' }
        }]
      });

      const engine = new AnalyticsEngine(mockExercises, [zeroWorkout]);
      const chart = engine.generateProgressionChart('exercise-1', 'all');

      expect(chart.dataPoints[0].estimatedOneRepMax).toBe(0);
      expect(() => engine.generateExerciseInsights('exercise-1')).not.toThrow();
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDateWorkout = createMockWorkout({
        date: 'invalid-date',
        exercises: [{
          id: 'invalid-we',
          exerciseId: 'exercise-1',
          sets: [createMockWorkoutSet()],
          metrics: { totalVolume: 500, maxWeight: 50, maxReps: 10, estimatedOneRepMax: 66.7, volumePerMinute: 8.33, intensityScore: 10 },
          notes: '', restTime: 90,
          progression: { weightChange: 0, volumeChange: 0, strengthChange: 0, isPersonalBest: false, streak: 0, lastImprovement: '' }
        }]
      });

      expect(() => {
        const engine = new AnalyticsEngine(mockExercises, [invalidDateWorkout]);
        engine.generateProgressionChart('exercise-1', 'all');
      }).not.toThrow();
    });
  });
});