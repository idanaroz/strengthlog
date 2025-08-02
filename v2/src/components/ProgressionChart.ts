// 📈 Advanced Progression Chart Component

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { ProgressionChart as ProgressionData } from '@types/index.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export class ProgressionChart {
  private canvas: HTMLCanvasElement;
  private chart: Chart | null = null;
  private data: ProgressionData | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  // 📊 Render progression chart with multiple metrics
  render(data: ProgressionData, metric: 'volume' | 'weight' | 'oneRepMax' = 'volume'): void {
    this.data = data;

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const chartData = {
      labels: data.dataPoints.map(point => this.formatDate(point.date)),
      datasets: [
        {
          label: this.getMetricLabel(metric),
          data: data.dataPoints.map(point => this.getMetricValue(point, metric)),
          borderColor: this.getMetricColor(metric),
          backgroundColor: this.getMetricColor(metric, 0.1),
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.4
        }
      ]
    };

    // Add trendline if enabled
    if (data.trendline.slope !== 0) {
      const trendlineData = this.calculateTrendlineData(data);
      chartData.datasets.push({
        label: 'Trend',
        data: trendlineData,
        borderColor: '#64748b',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0
      });
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index' as const
      },
      plugins: {
        title: {
          display: true,
          text: `${this.getMetricLabel(metric)} Progression`,
          font: { size: 18, weight: 'bold' },
          color: '#1f2937'
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          titleColor: '#f9fafb',
          bodyColor: '#f9fafb',
          borderColor: '#374151',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (context: any) => {
              const point = data.dataPoints[context[0].dataIndex];
              return this.formatDate(point.date);
            },
            beforeBody: (context: any) => {
              const point = data.dataPoints[context[0].dataIndex];
              const lines = [
                `Volume: ${point.volume}kg`,
                `Max Weight: ${point.maxWeight}kg`,
                `Est. 1RM: ${point.estimatedOneRepMax}kg`,
                `Total Reps: ${point.reps}`
              ];

              // Add milestone if present
              const milestone = data.milestones.find(m => m.date === point.date);
              if (milestone) {
                lines.push(`🏆 ${milestone.description}`);
              }

              return lines;
            },
            label: () => '' // Hide default label since we use beforeBody
          }
        },
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 14 }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date',
            font: { size: 14, weight: 'bold' }
          },
          grid: {
            color: 'rgba(107, 114, 128, 0.1)'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: this.getMetricUnit(metric),
            font: { size: 14, weight: 'bold' }
          },
          grid: {
            color: 'rgba(107, 114, 128, 0.1)'
          },
          beginAtZero: false
        }
      },
      elements: {
        point: {
          hoverBackgroundColor: '#fff',
          hoverBorderWidth: 3
        }
      }
    };

    // Add milestone annotations
    if (data.milestones.length > 0) {
      this.addMilestoneAnnotations(options, data.milestones);
    }

    this.chart = new Chart(this.canvas, {
      type: 'line',
      data: chartData,
      options
    });
  }

  // 🎯 Add milestone markers to chart
  private addMilestoneAnnotations(options: any, milestones: any[]): void {
    // This would require chart.js annotation plugin
    // For now, milestones are shown in tooltips
    console.log('Milestones to display:', milestones.length);
  }

  // 📊 Calculate trendline data points
  private calculateTrendlineData(data: ProgressionData): number[] {
    const { slope, correlation } = data.trendline;
    const points = data.dataPoints;

    if (points.length < 2) return [];

    // Get first and last actual values for the selected metric
    const firstValue = points[0].volume; // Default to volume, could be dynamic
    const lastIndex = points.length - 1;

    // Calculate trendline values
    return points.map((_, index) => {
      return firstValue + (slope * index);
    });
  }

  // 🎨 Get metric-specific styling
  private getMetricColor(metric: string, alpha = 1): string {
    const colors = {
      volume: `rgba(59, 130, 246, ${alpha})`, // Blue
      weight: `rgba(16, 185, 129, ${alpha})`, // Green
      oneRepMax: `rgba(245, 101, 101, ${alpha})` // Red
    };
    return colors[metric as keyof typeof colors] || colors.volume;
  }

  private getMetricLabel(metric: string): string {
    const labels = {
      volume: 'Total Volume',
      weight: 'Max Weight',
      oneRepMax: 'Estimated 1RM'
    };
    return labels[metric as keyof typeof labels] || 'Volume';
  }

  private getMetricUnit(metric: string): string {
    const units = {
      volume: 'Total Volume (kg)',
      weight: 'Weight (kg)',
      oneRepMax: 'Estimated 1RM (kg)'
    };
    return units[metric as keyof typeof units] || 'kg';
  }

  private getMetricValue(point: any, metric: string): number {
    switch (metric) {
      case 'volume': return point.volume;
      case 'weight': return point.maxWeight;
      case 'oneRepMax': return point.estimatedOneRepMax;
      default: return point.volume;
    }
  }

  // 📅 Format dates for display
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  }

  // 🔄 Update chart with new data
  updateData(data: ProgressionData, metric: 'volume' | 'weight' | 'oneRepMax' = 'volume'): void {
    if (!this.chart) {
      this.render(data, metric);
      return;
    }

    // Update dataset
    this.chart.data.labels = data.dataPoints.map(point => this.formatDate(point.date));
    this.chart.data.datasets[0].data = data.dataPoints.map(point =>
      this.getMetricValue(point, metric)
    );

    // Update trendline if present
    if (this.chart.data.datasets.length > 1 && data.trendline.slope !== 0) {
      this.chart.data.datasets[1].data = this.calculateTrendlineData(data);
    }

    this.chart.update('none'); // No animation for updates
  }

  // 🎯 Highlight specific data point
  highlightPoint(workoutId: string): void {
    if (!this.chart || !this.data) return;

    const pointIndex = this.data.dataPoints.findIndex(point => point.workoutId === workoutId);
    if (pointIndex === -1) return;

    // Highlight logic would go here
    console.log(`Highlighting point at index ${pointIndex}`);
  }

  // 🧹 Cleanup
  destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}