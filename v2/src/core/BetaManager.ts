// 🧪 Beta Testing Manager - User recruitment and feedback collection

import type { Exercise, WorkoutSession, UserSettings } from '@types/index.js';

export interface BetaUser {
  id: string;
  email: string;
  name: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  deviceInfo: DeviceInfo;
  consentGiven: boolean;
  joinedDate: string;
  lastActiveDate: string;
  feedbackCount: number;
  analyticsOptIn: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenSize: { width: number; height: number };
  browserName: string;
  browserVersion: string;
  isMobile: boolean;
  supportsIndexedDB: boolean;
  supportsPWA: boolean;
}

export interface Feedback {
  id: string;
  userId: string;
  type: 'bug' | 'feature' | 'analytics' | 'usability' | 'performance';
  category: string;
  title: string;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5; // 1 = low, 5 = critical
  steps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  analytics?: FeedbackAnalytics;
  attachments?: FeedbackAttachment[];
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  tags: string[];
  dateCreated: string;
  dateUpdated: string;
}

export interface FeedbackAnalytics {
  userJourney: UserAction[];
  performanceMetrics: PerformanceMetrics;
  errorLogs: ErrorLog[];
  featureUsage: FeatureUsage;
}

export interface UserAction {
  action: string;
  element?: string;
  timestamp: string;
  data?: any;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  renderTime: number;
  interactionDelay: number;
  memoryUsage: number;
  dbQueryTime: number;
}

export interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: string;
  severity: 'error' | 'warning' | 'info';
  context?: any;
}

export interface FeatureUsage {
  workoutLogging: number;
  chartViewing: number;
  exerciseManagement: number;
  settingsAccess: number;
  analyticsViewing: number;
}

export interface FeedbackAttachment {
  id: string;
  name: string;
  type: 'screenshot' | 'log' | 'video' | 'other';
  data: string; // base64 encoded
  size: number;
  timestamp: string;
}

export interface BetaMetrics {
  totalUsers: number;
  activeUsers: number;
  retentionRate: number;
  feedbackRate: number;
  averageSessionTime: number;
  featureAdoption: Record<string, number>;
  criticalIssues: number;
  resolvedIssues: number;
}

export class BetaManager {
  private userId: string | null = null;
  private userJourney: UserAction[] = [];
  private performanceStartTime: number = 0;
  private feedbackQueue: Feedback[] = [];

  constructor() {
    this.userId = this.getCurrentUserId();
    this.initializeTracking();
  }

  // 👤 User Registration and Management
  async registerBetaUser(userInfo: Omit<BetaUser, 'id' | 'joinedDate' | 'lastActiveDate' | 'feedbackCount'>): Promise<string> {
    const userId = this.generateId();
    const deviceInfo = await this.collectDeviceInfo();

    const betaUser: BetaUser = {
      id: userId,
      ...userInfo,
      deviceInfo,
      joinedDate: new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
      feedbackCount: 0
    };

    // Store locally and sync to backend
    localStorage.setItem('beta-user', JSON.stringify(betaUser));
    this.userId = userId;

    // Send to backend
    await this.syncUserData(betaUser);

    console.log('🧪 Beta user registered:', userId);
    return userId;
  }

  async getBetaUser(): Promise<BetaUser | null> {
    const userData = localStorage.getItem('beta-user');
    return userData ? JSON.parse(userData) : null;
  }

  async updateUserActivity(): Promise<void> {
    const user = await this.getBetaUser();
    if (!user) return;

    user.lastActiveDate = new Date().toISOString();
    localStorage.setItem('beta-user', JSON.stringify(user));

    // Throttled sync to backend
    this.throttledSync('user-activity', user);
  }

  // 📊 Analytics and User Journey Tracking
  private initializeTracking(): void {
    // Track page performance
    this.performanceStartTime = performance.now();

    // Track user interactions
    document.addEventListener('click', this.trackUserAction.bind(this));
    document.addEventListener('keydown', this.trackUserAction.bind(this));
    document.addEventListener('submit', this.trackUserAction.bind(this));

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackUserAction({
        target: { tagName: 'DOCUMENT', id: '', className: '' },
        type: document.hidden ? 'page-hide' : 'page-show'
      } as any);
    });

    // Track errors
    window.addEventListener('error', this.trackError.bind(this));
    window.addEventListener('unhandledrejection', this.trackPromiseRejection.bind(this));
  }

  private trackUserAction(event: Event): void {
    const target = event.target as HTMLElement;
    const action: UserAction = {
      action: `${event.type}:${target.tagName.toLowerCase()}`,
      element: target.id || target.className || target.tagName,
      timestamp: new Date().toISOString(),
      data: {
        x: 'clientX' in event ? event.clientX : undefined,
        y: 'clientY' in event ? event.clientY : undefined,
        key: 'key' in event ? event.key : undefined
      }
    };

    this.userJourney.push(action);

    // Keep only recent actions (last 100)
    if (this.userJourney.length > 100) {
      this.userJourney = this.userJourney.slice(-100);
    }
  }

  private trackError(event: ErrorEvent): void {
    const errorLog: ErrorLog = {
      message: event.message,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      severity: 'error',
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    };

    this.queueErrorLog(errorLog);
  }

  private trackPromiseRejection(event: PromiseRejectionEvent): void {
    const errorLog: ErrorLog = {
      message: `Unhandled Promise Rejection: ${event.reason}`,
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      severity: 'error',
      context: { reason: event.reason }
    };

    this.queueErrorLog(errorLog);
  }

  // 📝 Feedback Collection
  async submitFeedback(feedbackData: Omit<Feedback, 'id' | 'userId' | 'analytics' | 'dateCreated' | 'dateUpdated' | 'status'>): Promise<string> {
    const user = await this.getBetaUser();
    if (!user) throw new Error('Beta user not registered');

    const feedbackId = this.generateId();
    const analytics = await this.collectCurrentAnalytics();

    const feedback: Feedback = {
      id: feedbackId,
      userId: user.id,
      ...feedbackData,
      analytics,
      status: 'open',
      dateCreated: new Date().toISOString(),
      dateUpdated: new Date().toISOString()
    };

    // Store locally
    this.feedbackQueue.push(feedback);
    localStorage.setItem('feedback-queue', JSON.stringify(this.feedbackQueue));

    // Update user feedback count
    user.feedbackCount++;
    localStorage.setItem('beta-user', JSON.stringify(user));

    // Send to backend
    await this.syncFeedback(feedback);

    console.log('📝 Feedback submitted:', feedbackId);
    return feedbackId;
  }

  async getFeedbackHistory(): Promise<Feedback[]> {
    const queueData = localStorage.getItem('feedback-queue');
    return queueData ? JSON.parse(queueData) : [];
  }

  // 📸 Screenshot and Context Capture
  async captureScreenshot(): Promise<FeedbackAttachment> {
    try {
      // Use html2canvas or similar library for screenshot
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas not supported');

      // Simple placeholder implementation
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.fillText('Screenshot placeholder', 50, 50);

      const dataUrl = canvas.toDataURL('image/png');

      return {
        id: this.generateId(),
        name: `screenshot-${Date.now()}.png`,
        type: 'screenshot',
        data: dataUrl,
        size: dataUrl.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw error;
    }
  }

  // 📊 Analytics Collection
  private async collectCurrentAnalytics(): Promise<FeedbackAnalytics> {
    const performanceMetrics = await this.collectPerformanceMetrics();
    const featureUsage = await this.collectFeatureUsage();
    const errorLogs = this.getRecentErrorLogs();

    return {
      userJourney: [...this.userJourney],
      performanceMetrics,
      errorLogs,
      featureUsage
    };
  }

  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    return {
      pageLoadTime: navigation?.loadEventEnd - navigation?.navigationStart || 0,
      renderTime: performance.now() - this.performanceStartTime,
      interactionDelay: this.calculateInteractionDelay(),
      memoryUsage: 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0,
      dbQueryTime: this.getAverageDBQueryTime()
    };
  }

  private async collectFeatureUsage(): Promise<FeatureUsage> {
    // This would typically come from analytics tracking
    return {
      workoutLogging: this.getFeatureUsageCount('workout'),
      chartViewing: this.getFeatureUsageCount('chart'),
      exerciseManagement: this.getFeatureUsageCount('exercise'),
      settingsAccess: this.getFeatureUsageCount('settings'),
      analyticsViewing: this.getFeatureUsageCount('analytics')
    };
  }

  private async collectDeviceInfo(): Promise<DeviceInfo> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      browserName: this.getBrowserName(),
      browserVersion: this.getBrowserVersion(),
      isMobile: /Mobi|Android/i.test(navigator.userAgent),
      supportsIndexedDB: 'indexedDB' in window,
      supportsPWA: 'serviceWorker' in navigator && 'PushManager' in window
    };
  }

  // 🔄 Sync with Backend
  private async syncUserData(user: BetaUser): Promise<void> {
    try {
      await fetch('/api/beta/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
    } catch (error) {
      console.error('Failed to sync user data:', error);
      // Store for retry
      this.queueForRetry('user-sync', user);
    }
  }

  private async syncFeedback(feedback: Feedback): Promise<void> {
    try {
      await fetch('/api/beta/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
    } catch (error) {
      console.error('Failed to sync feedback:', error);
      // Will retry from queue
    }
  }

  // 📈 Beta Metrics and Reporting
  async getBetaMetrics(): Promise<BetaMetrics> {
    try {
      const response = await fetch('/api/beta/metrics');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch beta metrics:', error);
      return this.getLocalMetrics();
    }
  }

  private getLocalMetrics(): BetaMetrics {
    const user = JSON.parse(localStorage.getItem('beta-user') || '{}');
    const feedback = JSON.parse(localStorage.getItem('feedback-queue') || '[]');

    return {
      totalUsers: 1, // Local user
      activeUsers: user.id ? 1 : 0,
      retentionRate: 100,
      feedbackRate: feedback.length > 0 ? 100 : 0,
      averageSessionTime: this.calculateSessionTime(),
      featureAdoption: {
        workout: this.getFeatureUsageCount('workout'),
        analytics: this.getFeatureUsageCount('analytics'),
        exercises: this.getFeatureUsageCount('exercise')
      },
      criticalIssues: feedback.filter((f: Feedback) => f.severity >= 4).length,
      resolvedIssues: feedback.filter((f: Feedback) => f.status === 'resolved').length
    };
  }

  // 🎯 Targeted Feature Testing
  isFeatureEnabled(featureName: string): boolean {
    const user = JSON.parse(localStorage.getItem('beta-user') || '{}');

    // Feature flags based on user characteristics
    const featureFlags: Record<string, (user: BetaUser) => boolean> = {
      'advanced-analytics': (u) => u.experience === 'advanced',
      'social-features': (u) => u.goals?.includes('social') || false,
      'ai-recommendations': (u) => u.analyticsOptIn === true,
      'workout-templates': () => true, // Enabled for all beta users
      'rest-timer-v2': (u) => u.deviceInfo?.isMobile === true
    };

    return featureFlags[featureName]?.(user) || false;
  }

  // 🔧 Utility Methods
  private getCurrentUserId(): string | null {
    const userData = localStorage.getItem('beta-user');
    return userData ? JSON.parse(userData).id : null;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[1] : 'Unknown';
  }

  private calculateInteractionDelay(): number {
    // Calculate average delay between user actions
    const delays = this.userJourney
      .slice(-10)
      .map((action, i, arr) => {
        if (i === 0) return 0;
        return new Date(action.timestamp).getTime() - new Date(arr[i-1].timestamp).getTime();
      })
      .filter(delay => delay > 0);

    return delays.length > 0 ? delays.reduce((a, b) => a + b) / delays.length : 0;
  }

  private getAverageDBQueryTime(): number {
    // This would be tracked during actual DB operations
    return 10; // Placeholder
  }

  private getFeatureUsageCount(feature: string): number {
    return this.userJourney.filter(action =>
      action.action.includes(feature) || action.element?.includes(feature)
    ).length;
  }

  private calculateSessionTime(): number {
    const user = JSON.parse(localStorage.getItem('beta-user') || '{}');
    if (!user.joinedDate) return 0;

    return (Date.now() - new Date(user.joinedDate).getTime()) / 1000 / 60; // minutes
  }

  private getRecentErrorLogs(): ErrorLog[] {
    const errorData = localStorage.getItem('error-logs');
    const errors = errorData ? JSON.parse(errorData) : [];
    return errors.slice(-10); // Last 10 errors
  }

  private queueErrorLog(errorLog: ErrorLog): void {
    const existing = JSON.parse(localStorage.getItem('error-logs') || '[]');
    existing.push(errorLog);

    // Keep only recent errors
    const recentErrors = existing.slice(-50);
    localStorage.setItem('error-logs', JSON.stringify(recentErrors));
  }

  private queueForRetry(type: string, data: any): void {
    const retryQueue = JSON.parse(localStorage.getItem('retry-queue') || '[]');
    retryQueue.push({ type, data, timestamp: Date.now() });
    localStorage.setItem('retry-queue', JSON.stringify(retryQueue));
  }

  private throttledSync = this.throttle((type: string, data: any) => {
    // Implement throttled sync logic
    console.log('Throttled sync:', type);
  }, 5000);

  private throttle(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}