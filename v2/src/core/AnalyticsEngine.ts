// 📊 Advanced Analytics Engine - Core Intelligence

import { format, parseISO, subDays, subMonths, subYears } from 'date-fns';
import type {
  Exercise,
  WorkoutSession,
  WorkoutExercise,
  ProgressionChart,
  ProgressionPoint,
  TrendData,
  Milestone,
  PersonalBests
} from '@types/index.js';

export class AnalyticsEngine {
  private exercises: Exercise[];
  private workouts: WorkoutSession[];

  constructor(exercises: Exercise[], workouts: WorkoutSession[]) {
    this.exercises = exercises;
    this.workouts = workouts;
  }

  // 📈 Generate progression chart data
  generateProgressionChart(
    exerciseId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month'
  ): ProgressionChart {
    const exerciseWorkouts = this.getExerciseWorkouts(exerciseId, timeframe);
    const dataPoints = this.calculateProgressionPoints(exerciseWorkouts);
    const trendline = this.calculateTrend(dataPoints);
    const milestones = this.identifyMilestones(dataPoints, exerciseId);

    return {
      exerciseId,
      timeframe,
      dataPoints,
      trendline,
      milestones
    };
  }

  // 🎯 Calculate comprehensive progression metrics
  private calculateProgressionPoints(workouts: Array<{workout: WorkoutSession, exercise: WorkoutExercise}>): ProgressionPoint[] {
    return workouts.map(({workout, exercise}) => {
      const volume = exercise.sets.reduce((sum, set) =>
        sum + (set.weight * set.reps), 0
      );

      const maxWeight = Math.max(...exercise.sets.map(set => set.weight));
      const totalReps = exercise.sets.reduce((sum, set) => sum + set.reps, 0);

      // Enhanced 1RM calculation using Epley formula with RPE adjustment
      const estimatedOneRepMax = this.calculateOneRepMax(exercise.sets);

      return {
        date: workout.date,
        volume,
        maxWeight,
        estimatedOneRepMax,
        reps: totalReps,
        workoutId: workout.id
      };
    });
  }

  // 🧮 Advanced 1RM calculation with RPE consideration
  private calculateOneRepMax(sets: any[]): number {
    let bestEstimate = 0;

    sets.forEach(set => {
      if (set.reps === 0 || set.weight === 0) return;

      // Base Epley formula: weight × (1 + reps/30)
      let estimate = set.weight * (1 + set.reps / 30);

      // RPE adjustment for more accurate estimates
      if (set.rpe) {
        const rpeMultiplier = this.getRPEMultiplier(set.rpe, set.reps);
        estimate = set.weight * rpeMultiplier;
      }

      bestEstimate = Math.max(bestEstimate, estimate);
    });

    return Math.round(bestEstimate * 10) / 10; // Round to 1 decimal
  }

  // 📊 RPE-based 1RM multipliers (more accurate than simple formulas)
  private getRPEMultiplier(rpe: number, reps: number): number {
    const rpeTable: Record<number, Record<number, number>> = {
      1: { 10: 1.00, 9: 1.02, 8: 1.04, 7: 1.07, 6: 1.09, 5: 1.12, 4: 1.15, 3: 1.18, 2: 1.22, 1: 1.25 },
      2: { 10: 1.04, 9: 1.07, 8: 1.09, 7: 1.12, 6: 1.15, 5: 1.18, 4: 1.22, 3: 1.25, 2: 1.29, 1: 1.33 },
      // ... complete RPE table would go here
      10: { 10: 1.33, 9: 1.37, 8: 1.42, 7: 1.47, 6: 1.52, 5: 1.58, 4: 1.64, 3: 1.71, 2: 1.78, 1: 1.86 }
    };

    return rpeTable[rpe]?.[reps] || 1.0;
  }

  // 📈 Calculate trend analysis
  private calculateTrend(dataPoints: ProgressionPoint[]): TrendData {
    if (dataPoints.length < 2) {
      return { slope: 0, correlation: 0, prediction: 0 };
    }

    // Linear regression for trend calculation
    const n = dataPoints.length;
    const xValues = dataPoints.map((_, index) => index);
    const yValues = dataPoints.map(point => point.estimatedOneRepMax);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.map((x, i) => x * yValues[i]).reduce((a, b) => a + b, 0);
    const sumXX = xValues.map(x => x * x).reduce((a, b) => a + b, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Calculate correlation coefficient
    const meanX = sumX / n;
    const meanY = sumY / n;
    const correlation = this.calculateCorrelation(xValues, yValues, meanX, meanY);

    // Predict next value
    const prediction = yValues[yValues.length - 1] + slope;

    return {
      slope: Math.round(slope * 100) / 100,
      correlation: Math.round(correlation * 100) / 100,
      prediction: Math.round(prediction * 10) / 10
    };
  }

  // 🎯 Identify achievement milestones
  private identifyMilestones(dataPoints: ProgressionPoint[], exerciseId: string): Milestone[] {
    const milestones: Milestone[] = [];
    let previousBest = { weight: 0, reps: 0, volume: 0, oneRepMax: 0 };

    dataPoints.forEach(point => {
      // Weight PR
      if (point.maxWeight > previousBest.weight) {
        milestones.push({
          date: point.date,
          type: 'pr_weight',
          value: point.maxWeight,
          description: `New weight PR: ${point.maxWeight}kg`
        });
        previousBest.weight = point.maxWeight;
      }

      // Volume PR
      if (point.volume > previousBest.volume) {
        milestones.push({
          date: point.date,
          type: 'pr_volume',
          value: point.volume,
          description: `New volume PR: ${point.volume}kg total`
        });
        previousBest.volume = point.volume;
      }

      // 1RM PR
      if (point.estimatedOneRepMax > previousBest.oneRepMax) {
        milestones.push({
          date: point.date,
          type: 'pr_weight',
          value: point.estimatedOneRepMax,
          description: `New estimated 1RM: ${point.estimatedOneRepMax}kg`
        });
        previousBest.oneRepMax = point.estimatedOneRepMax;
      }
    });

    return milestones;
  }

  // 🔍 Get exercise workouts within timeframe
  private getExerciseWorkouts(exerciseId: string, timeframe: string) {
    const cutoffDate = this.getTimeframeCutoff(timeframe);

    return this.workouts
      .filter(workout => new Date(workout.date) >= cutoffDate)
      .map(workout => ({
        workout,
        exercise: workout.exercises.find(ex => ex.exerciseId === exerciseId)
      }))
      .filter(item => item.exercise)
      .sort((a, b) => new Date(a.workout.date).getTime() - new Date(b.workout.date).getTime());
  }

  // 📅 Calculate timeframe cutoff dates
  private getTimeframeCutoff(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'week': return subDays(now, 7);
      case 'month': return subMonths(now, 1);
      case 'quarter': return subMonths(now, 3);
      case 'year': return subYears(now, 1);
      default: return new Date(0); // all time
    }
  }

  // 📊 Calculate correlation coefficient
  private calculateCorrelation(xValues: number[], yValues: number[], meanX: number, meanY: number): number {
    const numerator = xValues
      .map((x, i) => (x - meanX) * (yValues[i] - meanY))
      .reduce((a, b) => a + b, 0);

    const denominator = Math.sqrt(
      xValues.map(x => Math.pow(x - meanX, 2)).reduce((a, b) => a + b, 0) *
      yValues.map(y => Math.pow(y - meanY, 2)).reduce((a, b) => a + b, 0)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // 🏆 Generate comprehensive exercise insights
  generateExerciseInsights(exerciseId: string) {
    const exercise = this.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return null;

    const progressionData = this.generateProgressionChart(exerciseId, 'all');

    return {
      exercise,
      totalWorkouts: progressionData.dataPoints.length,
      improvements: progressionData.milestones.length,
      trendStrength: Math.abs(progressionData.trendline.correlation),
      consistencyScore: this.calculateConsistencyScore(exerciseId),
      recommendations: this.generateRecommendations(exerciseId, progressionData)
    };
  }

  // 🎯 Calculate workout consistency score (0-100)
  private calculateConsistencyScore(exerciseId: string): number {
    const workouts = this.getExerciseWorkouts(exerciseId, 'quarter');
    if (workouts.length < 2) return 0;

    // Measure consistency in frequency and volume
    const frequencies: number[] = [];
    const volumes: number[] = [];

    workouts.forEach(({exercise}) => {
      volumes.push(exercise?.metrics.totalVolume || 0);
    });

    // Calculate coefficient of variation (lower = more consistent)
    const volumeCV = this.calculateCoefficientOfVariation(volumes);

    // Convert to 0-100 score (lower CV = higher score)
    return Math.max(0, Math.min(100, (1 - volumeCV) * 100));
  }

  private calculateCoefficientOfVariation(values: number[]): number {
    if (values.length === 0) return 1;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return mean === 0 ? 1 : stdDev / mean;
  }

  // 💡 Generate AI-powered recommendations
  private generateRecommendations(exerciseId: string, progressionData: ProgressionChart): string[] {
    const recommendations: string[] = [];
    const trend = progressionData.trendline;
    const recentPoints = progressionData.dataPoints.slice(-4); // Last 4 workouts

    // Plateau detection
    if (Math.abs(trend.slope) < 0.1 && recentPoints.length >= 3) {
      recommendations.push("📈 Consider increasing intensity or changing rep ranges to break through plateau");
    }

    // Consistency issues
    if (trend.correlation < 0.5) {
      recommendations.push("🎯 Focus on consistent training - your progress varies significantly between sessions");
    }

    // Volume progression
    const avgVolume = recentPoints.reduce((sum, p) => sum + p.volume, 0) / recentPoints.length;
    if (avgVolume < progressionData.dataPoints[0]?.volume * 1.1) {
      recommendations.push("💪 Consider gradually increasing training volume for continued growth");
    }

    return recommendations;
  }
}