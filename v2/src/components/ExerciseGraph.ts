// 📊 Individual Exercise Progression Charts - UX Optimized

import { Chart, registerables, type ChartConfiguration } from 'chart.js';
import type { Exercise, WorkoutSession } from '../types/index.js';

Chart.register(...registerables);

export interface ExerciseProgressionData {
  exerciseId: string;
  exerciseName: string;
  dates: string[];
  weights: number[];
  reps: number[];
  volumes: number[];
  estimatedMaxes: number[];
  averageRPE: number[];
  totalSets: number[];
}

export class ExerciseGraph {
  private chart: Chart | null = null;
  private container: HTMLElement;
  private currentMetric: 'weight' | 'volume' | 'oneRepMax' | 'reps' = 'weight';

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id ${containerId} not found`);
    }
    this.container = container;
  }

  // 📊 Render exercise-specific progression chart
  render(exerciseData: ExerciseProgressionData, metric: 'weight' | 'volume' | 'oneRepMax' | 'reps' = 'weight'): void {
    this.currentMetric = metric;

    // Clear existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = `exercise-chart-${exerciseData.exerciseId}`;

    // Clear container and add canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.createChartControls(exerciseData));
    this.container.appendChild(canvas);

    // Prepare data based on metric
    const chartData = this.prepareChartData(exerciseData, metric);

    // Create chart configuration
    const config: ChartConfiguration = {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${exerciseData.exerciseName} - ${this.getMetricLabel(metric)} Progression`,
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#333'
          },
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            callbacks: {
              title: (context) => {
                const date = new Date(context[0].label).toLocaleDateString();
                return `Workout: ${date}`;
              },
              label: (context) => {
                const value = context.parsed.y;
                const unit = this.getMetricUnit(metric);
                return `${this.getMetricLabel(metric)}: ${value}${unit}`;
              },
              afterBody: (context) => {
                const index = context[0].dataIndex;
                const sets = exerciseData.totalSets[index];
                const avgRPE = exerciseData.averageRPE[index];

                const lines = [`Sets: ${sets}`];
                if (avgRPE > 0) {
                  lines.push(`Avg RPE: ${avgRPE}/10`);
                }
                return lines;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Workout Date',
              font: { weight: 'bold' }
            },
            ticks: {
              callback: function(value, index) {
                const date = new Date(this.getLabelForValue(value as number));
                return date.toLocaleDateString();
              }
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: `${this.getMetricLabel(metric)} ${this.getMetricUnit(metric)}`,
              font: { weight: 'bold' }
            },
            ticks: {
              callback: function(value) {
                return value + (metric === 'weight' ? 'kg' :
                              metric === 'volume' ? 'kg' :
                              metric === 'oneRepMax' ? 'kg' : '');
              }
            }
          }
        },
        elements: {
          point: {
            radius: 6,
            hoverRadius: 8,
            backgroundColor: '#667eea',
            borderColor: '#764ba2',
            borderWidth: 2
          },
          line: {
            borderWidth: 3,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true,
            tension: 0.2
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    // Create chart
    this.chart = new Chart(canvas, config);

    console.log(`📊 Exercise graph rendered for ${exerciseData.exerciseName} (${metric})`);
  }

  // 🎛️ Create interactive chart controls
  private createChartControls(exerciseData: ExerciseProgressionData): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'exercise-graph-controls';

    controls.innerHTML = `
      <div class="graph-header">
        <div class="exercise-info">
          <h3>${exerciseData.exerciseName}</h3>
          <div class="exercise-stats">
            <span class="stat">📈 ${exerciseData.dates.length} workouts</span>
            <span class="stat">🏋️ Last: ${exerciseData.dates[exerciseData.dates.length - 1] ? new Date(exerciseData.dates[exerciseData.dates.length - 1]).toLocaleDateString() : 'Never'}</span>
          </div>
        </div>

        <div class="metric-selector">
          <button class="metric-btn ${this.currentMetric === 'weight' ? 'active' : ''}" data-metric="weight">
            💪 Max Weight
          </button>
          <button class="metric-btn ${this.currentMetric === 'volume' ? 'active' : ''}" data-metric="volume">
            📊 Volume
          </button>
          <button class="metric-btn ${this.currentMetric === 'oneRepMax' ? 'active' : ''}" data-metric="oneRepMax">
            🎯 Est. 1RM
          </button>
          <button class="metric-btn ${this.currentMetric === 'reps' ? 'active' : ''}" data-metric="reps">
            🔢 Max Reps
          </button>
        </div>
      </div>

      <div class="trend-insights">
        ${this.generateTrendInsights(exerciseData)}
      </div>
    `;

    // Add event listeners for metric switching
    controls.querySelectorAll('.metric-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const metric = target.dataset.metric as 'weight' | 'volume' | 'oneRepMax' | 'reps';

        // Update active state
        controls.querySelectorAll('.metric-btn').forEach(b => b.classList.remove('active'));
        target.classList.add('active');

        // Re-render chart with new metric
        this.render(exerciseData, metric);
      });
    });

    return controls;
  }

  // 📊 Prepare chart data based on selected metric
  private prepareChartData(exerciseData: ExerciseProgressionData, metric: string): any {
    let data: number[];
    let borderColor: string;
    let backgroundColor: string;

    switch (metric) {
      case 'weight':
        data = exerciseData.weights;
        borderColor = '#e74c3c';
        backgroundColor = 'rgba(231, 76, 60, 0.1)';
        break;
      case 'volume':
        data = exerciseData.volumes;
        borderColor = '#3498db';
        backgroundColor = 'rgba(52, 152, 219, 0.1)';
        break;
      case 'oneRepMax':
        data = exerciseData.estimatedMaxes;
        borderColor = '#9b59b6';
        backgroundColor = 'rgba(155, 89, 182, 0.1)';
        break;
      case 'reps':
        data = exerciseData.reps;
        borderColor = '#2ecc71';
        backgroundColor = 'rgba(46, 204, 113, 0.1)';
        break;
      default:
        data = exerciseData.weights;
        borderColor = '#667eea';
        backgroundColor = 'rgba(102, 126, 234, 0.1)';
    }

    return {
      labels: exerciseData.dates,
      datasets: [
        {
          label: this.getMetricLabel(metric),
          data: data,
          borderColor: borderColor,
          backgroundColor: backgroundColor,
          borderWidth: 3,
          fill: true,
          tension: 0.2,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: borderColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    };
  }

  // 🧠 Generate smart trend insights
  private generateTrendInsights(exerciseData: ExerciseProgressionData): string {
    if (exerciseData.dates.length < 2) {
      return '<div class="insight">📝 Log more workouts to see trends</div>';
    }

    const insights: string[] = [];

    // Weight progression
    const firstWeight = exerciseData.weights[0];
    const lastWeight = exerciseData.weights[exerciseData.weights.length - 1];
    const weightChange = lastWeight - firstWeight;

    if (weightChange > 0) {
      insights.push(`📈 +${weightChange.toFixed(1)}kg weight increase`);
    } else if (weightChange < 0) {
      insights.push(`📉 ${Math.abs(weightChange).toFixed(1)}kg weight decrease`);
    }

    // Volume trend
    const firstVolume = exerciseData.volumes[0];
    const lastVolume = exerciseData.volumes[exerciseData.volumes.length - 1];
    const volumeChange = ((lastVolume - firstVolume) / firstVolume) * 100;

    if (volumeChange > 10) {
      insights.push(`🚀 ${volumeChange.toFixed(0)}% volume increase`);
    } else if (volumeChange < -10) {
      insights.push(`⚠️ ${Math.abs(volumeChange).toFixed(0)}% volume decrease`);
    }

    // Consistency insights
    const workoutCount = exerciseData.dates.length;
    const daySpan = Math.ceil((new Date(exerciseData.dates[exerciseData.dates.length - 1]).getTime() -
                              new Date(exerciseData.dates[0]).getTime()) / (1000 * 60 * 60 * 24));
    const frequency = workoutCount / (daySpan / 7);

    if (frequency >= 2) {
      insights.push(`⭐ Great consistency: ${frequency.toFixed(1)}x/week`);
    } else if (frequency >= 1) {
      insights.push(`👍 Good frequency: ${frequency.toFixed(1)}x/week`);
    }

    return insights.length > 0
      ? insights.map(insight => `<div class="insight">${insight}</div>`).join('')
      : '<div class="insight">📊 Keep training to build trends!</div>';
  }

  // 🏷️ Get metric labels and units
  private getMetricLabel(metric: string): string {
    switch (metric) {
      case 'weight': return 'Max Weight';
      case 'volume': return 'Total Volume';
      case 'oneRepMax': return 'Est. 1RM';
      case 'reps': return 'Max Reps';
      default: return 'Value';
    }
  }

  private getMetricUnit(metric: string): string {
    switch (metric) {
      case 'weight': return 'kg';
      case 'volume': return 'kg';
      case 'oneRepMax': return 'kg';
      case 'reps': return '';
      default: return '';
    }
  }

  // 🧹 Cleanup
  destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}