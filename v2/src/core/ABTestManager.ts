// 🧪 A/B Testing Manager - Progressive Rollout & Feature Testing

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';

  // Test configuration
  variants: ABVariant[];
  targetAudience: TargetAudience;
  allocation: AllocationStrategy;

  // Timeline
  startDate: string;
  endDate?: string;
  createdDate: string;

  // Success metrics
  primaryMetric: string;
  secondaryMetrics: string[];
  minimumSampleSize: number;
  confidenceLevel: number; // 0.95 = 95%

  // Results
  results?: ABTestResults;

  // Safety
  safeguards: TestSafeguards;
  rollbackTriggers: RollbackTrigger[];
}

export interface ABVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-100, total should equal 100
  config: VariantConfig;
  isControl: boolean;
}

export interface VariantConfig {
  features: Record<string, any>;
  ui: UIVariant;
  analytics: AnalyticsConfig;
}

export interface UIVariant {
  theme?: string;
  layout?: string;
  components?: Record<string, any>;
  styles?: Record<string, string>;
}

export interface AnalyticsConfig {
  trackingEnabled: boolean;
  customEvents: string[];
  samplingRate: number;
}

export interface TargetAudience {
  criteria: AudienceCriteria;
  percentage: number; // 0-100, percentage of users to include
  exclusions?: string[];
}

export interface AudienceCriteria {
  userType?: 'new' | 'returning' | 'beta' | 'all';
  experience?: 'beginner' | 'intermediate' | 'advanced';
  platform?: 'mobile' | 'desktop' | 'tablet';
  location?: string[];
  customAttributes?: Record<string, any>;
}

export interface AllocationStrategy {
  type: 'random' | 'deterministic' | 'gradual';
  seed?: string; // For deterministic allocation
  gradualRollout?: GradualRollout;
}

export interface GradualRollout {
  initialPercentage: number;
  incrementPercentage: number;
  incrementInterval: number; // hours
  maxPercentage: number;
}

export interface TestSafeguards {
  maxErrorRate: number; // 0-1, rollback if exceeded
  maxLatencyIncrease: number; // milliseconds
  minSuccessRate: number; // 0-1
  monitoringInterval: number; // minutes
}

export interface RollbackTrigger {
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  duration: number; // minutes to observe before triggering
}

export interface ABTestResults {
  sampleSizes: Record<string, number>;
  metrics: Record<string, VariantMetrics>;
  significance: SignificanceTest;
  recommendation: 'continue' | 'rollback' | 'winner' | 'inconclusive';
  winningVariant?: string;
  confidence: number;
}

export interface VariantMetrics {
  conversionRate: number;
  averageValue: number;
  standardError: number;
  confidenceInterval: [number, number];
  customMetrics: Record<string, number>;
}

export interface SignificanceTest {
  pValue: number;
  zScore: number;
  significant: boolean;
  method: 'welch' | 'pooled' | 'bayesian';
}

export interface UserAssignment {
  userId: string;
  testId: string;
  variantId: string;
  assignedAt: string;
  isActive: boolean;
}

export interface ABTestEvent {
  userId: string;
  testId: string;
  variantId: string;
  eventType: string;
  eventValue?: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export class ABTestManager {
  private activeTests: Map<string, ABTest> = new Map();
  private userAssignments: Map<string, UserAssignment[]> = new Map();
  private testEvents: ABTestEvent[] = [];
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.loadActiveTests();
    this.loadUserAssignments();
  }

  // 🚀 Test Management
  async createTest(testConfig: Omit<ABTest, 'id' | 'createdDate' | 'status'>): Promise<string> {
    const testId = this.generateId();

    const test: ABTest = {
      id: testId,
      ...testConfig,
      status: 'draft',
      createdDate: new Date().toISOString()
    };

    // Validate test configuration
    await this.validateTestConfig(test);

    this.activeTests.set(testId, test);
    await this.persistTest(test);

    console.log('🧪 A/B test created:', testId);
    return testId;
  }

  async startTest(testId: string): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) throw new Error(`Test ${testId} not found`);

    test.status = 'active';
    test.startDate = new Date().toISOString();

    // Start monitoring
    this.startMonitoring(testId);

    await this.persistTest(test);
    console.log('🚀 A/B test started:', testId);
  }

  async stopTest(testId: string, reason: string = 'manual'): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) throw new Error(`Test ${testId} not found`);

    test.status = 'completed';
    test.endDate = new Date().toISOString();

    // Calculate final results
    test.results = await this.calculateResults(testId);

    // Stop monitoring
    this.stopMonitoring(testId);

    await this.persistTest(test);
    this.logTestCompletion(testId, reason, test.results);
  }

  // 👤 User Assignment
  getAssignment(testId: string): string | null {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'active') return null;

    // Check if user already assigned
    const existingAssignment = this.getUserAssignment(testId);
    if (existingAssignment) return existingAssignment.variantId;

    // Check if user is eligible
    if (!this.isUserEligible(test)) return null;

    // Assign user to variant
    const variantId = this.assignUserToVariant(test);

    // Record assignment
    this.recordAssignment(testId, variantId);

    return variantId;
  }

  private isUserEligible(test: ABTest): boolean {
    const { targetAudience } = test;

    // Check percentage
    if (Math.random() * 100 > targetAudience.percentage) return false;

    // Check user criteria
    const userData = this.getUserData();
    const { criteria } = targetAudience;

    if (criteria.userType && criteria.userType !== userData.type) return false;
    if (criteria.experience && criteria.experience !== userData.experience) return false;
    if (criteria.platform && criteria.platform !== userData.platform) return false;

    // Check exclusions
    if (targetAudience.exclusions?.some(exclusion =>
      userData.attributes?.[exclusion] === true
    )) return false;

    return true;
  }

  private assignUserToVariant(test: ABTest): string {
    const { allocation, variants } = test;

    switch (allocation.type) {
      case 'random':
        return this.randomAssignment(variants);
      case 'deterministic':
        return this.deterministicAssignment(variants, allocation.seed);
      case 'gradual':
        return this.gradualAssignment(test);
      default:
        return variants[0].id;
    }
  }

  private randomAssignment(variants: ABVariant[]): string {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant.id;
      }
    }

    return variants[0].id; // Fallback
  }

  private deterministicAssignment(variants: ABVariant[], seed?: string): string {
    // Use hash of userId + seed for consistent assignment
    const hashInput = this.userId + (seed || '');
    const hash = this.simpleHash(hashInput);
    const percentage = (hash % 10000) / 100; // 0-99.99

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (percentage <= cumulative) {
        return variant.id;
      }
    }

    return variants[0].id; // Fallback
  }

  private gradualAssignment(test: ABTest): string {
    const { gradualRollout } = test.allocation;
    if (!gradualRollout) return this.randomAssignment(test.variants);

    // Calculate current rollout percentage based on time
    const startTime = new Date(test.startDate).getTime();
    const currentTime = Date.now();
    const hoursElapsed = (currentTime - startTime) / (1000 * 60 * 60);

    const increments = Math.floor(hoursElapsed / gradualRollout.incrementInterval);
    const currentPercentage = Math.min(
      gradualRollout.initialPercentage + (increments * gradualRollout.incrementPercentage),
      gradualRollout.maxPercentage
    );

    // Only assign if within current rollout percentage
    const random = Math.random() * 100;
    if (random > currentPercentage) {
      return test.variants.find(v => v.isControl)?.id || test.variants[0].id;
    }

    return this.randomAssignment(test.variants);
  }

  // 📊 Event Tracking
  trackEvent(testId: string, eventType: string, eventValue?: number, metadata?: Record<string, any>): void {
    const assignment = this.getUserAssignment(testId);
    if (!assignment) return;

    const event: ABTestEvent = {
      userId: this.userId,
      testId,
      variantId: assignment.variantId,
      eventType,
      eventValue,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.testEvents.push(event);
    this.persistEvent(event);
  }

  // 📈 Results Calculation
  private async calculateResults(testId: string): Promise<ABTestResults> {
    const test = this.activeTests.get(testId);
    if (!test) throw new Error(`Test ${testId} not found`);

    const events = this.testEvents.filter(e => e.testId === testId);
    const sampleSizes: Record<string, number> = {};
    const metrics: Record<string, VariantMetrics> = {};

    // Calculate metrics for each variant
    for (const variant of test.variants) {
      const variantEvents = events.filter(e => e.variantId === variant.id);
      const uniqueUsers = new Set(variantEvents.map(e => e.userId)).size;

      sampleSizes[variant.id] = uniqueUsers;
      metrics[variant.id] = this.calculateVariantMetrics(variantEvents, test.primaryMetric);
    }

    // Statistical significance test
    const significance = this.performSignificanceTest(metrics, test.variants);

    // Generate recommendation
    const recommendation = this.generateRecommendation(significance, metrics, test);

    return {
      sampleSizes,
      metrics,
      significance,
      recommendation,
      winningVariant: significance.significant ? this.findWinningVariant(metrics) : undefined,
      confidence: test.confidenceLevel
    };
  }

  private calculateVariantMetrics(events: ABTestEvent[], primaryMetric: string): VariantMetrics {
    const conversionEvents = events.filter(e => e.eventType === primaryMetric);
    const totalUsers = new Set(events.map(e => e.userId)).size;

    const conversionRate = totalUsers > 0 ? conversionEvents.length / totalUsers : 0;
    const values = conversionEvents.map(e => e.eventValue || 1);
    const averageValue = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;

    // Calculate standard error
    const variance = values.length > 1 ?
      values.reduce((sum, val) => sum + Math.pow(val - averageValue, 2), 0) / (values.length - 1) : 0;
    const standardError = Math.sqrt(variance / values.length);

    // 95% confidence interval
    const marginOfError = 1.96 * standardError;
    const confidenceInterval: [number, number] = [
      averageValue - marginOfError,
      averageValue + marginOfError
    ];

    return {
      conversionRate,
      averageValue,
      standardError,
      confidenceInterval,
      customMetrics: this.calculateCustomMetrics(events)
    };
  }

  private performSignificanceTest(
    metrics: Record<string, VariantMetrics>,
    variants: ABVariant[]
  ): SignificanceTest {
    const controlVariant = variants.find(v => v.isControl);
    const testVariant = variants.find(v => !v.isControl);

    if (!controlVariant || !testVariant) {
      return { pValue: 1, zScore: 0, significant: false, method: 'welch' };
    }

    const control = metrics[controlVariant.id];
    const test = metrics[testVariant.id];

    // Welch's t-test for unequal variances
    const pooledSE = Math.sqrt(Math.pow(control.standardError, 2) + Math.pow(test.standardError, 2));
    const zScore = pooledSE > 0 ? (test.averageValue - control.averageValue) / pooledSE : 0;
    const pValue = this.calculatePValue(Math.abs(zScore));

    return {
      pValue,
      zScore,
      significant: pValue < 0.05, // 95% confidence
      method: 'welch'
    };
  }

  // 🛡️ Safety Monitoring
  private startMonitoring(testId: string): void {
    const test = this.activeTests.get(testId);
    if (!test) return;

    const interval = setInterval(async () => {
      await this.checkSafeguards(testId);
    }, test.safeguards.monitoringInterval * 60 * 1000);

    // Store interval for cleanup
    (test as any).monitoringInterval = interval;
  }

  private stopMonitoring(testId: string): void {
    const test = this.activeTests.get(testId);
    if (!test) return;

    const interval = (test as any).monitoringInterval;
    if (interval) {
      clearInterval(interval);
      delete (test as any).monitoringInterval;
    }
  }

  private async checkSafeguards(testId: string): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) return;

    const currentMetrics = await this.getCurrentMetrics(testId);
    const { safeguards, rollbackTriggers } = test;

    // Check basic safeguards
    if (currentMetrics.errorRate > safeguards.maxErrorRate) {
      await this.triggerRollback(testId, 'High error rate detected');
      return;
    }

    if (currentMetrics.latency > safeguards.maxLatencyIncrease) {
      await this.triggerRollback(testId, 'High latency detected');
      return;
    }

    if (currentMetrics.successRate < safeguards.minSuccessRate) {
      await this.triggerRollback(testId, 'Low success rate detected');
      return;
    }

    // Check custom rollback triggers
    for (const trigger of rollbackTriggers) {
      const metricValue = currentMetrics[trigger.metric];
      if (this.evaluateTriggerCondition(metricValue, trigger)) {
        await this.triggerRollback(testId, `Trigger condition met for ${trigger.metric}`);
        return;
      }
    }
  }

  private async triggerRollback(testId: string, reason: string): Promise<void> {
    console.warn(`🚨 Triggering rollback for test ${testId}: ${reason}`);

    const test = this.activeTests.get(testId);
    if (!test) return;

    // Pause the test
    test.status = 'paused';

    // Reassign all users to control variant
    const controlVariant = test.variants.find(v => v.isControl);
    if (controlVariant) {
      await this.reassignAllUsers(testId, controlVariant.id);
    }

    // Log rollback
    this.logRollback(testId, reason);

    // Notify administrators
    await this.notifyRollback(testId, reason);
  }

  // 🔧 Utility Methods
  private getUserAssignment(testId: string): UserAssignment | null {
    const assignments = this.userAssignments.get(this.userId) || [];
    return assignments.find(a => a.testId === testId && a.isActive) || null;
  }

  private recordAssignment(testId: string, variantId: string): void {
    const assignment: UserAssignment = {
      userId: this.userId,
      testId,
      variantId,
      assignedAt: new Date().toISOString(),
      isActive: true
    };

    const userAssignments = this.userAssignments.get(this.userId) || [];
    userAssignments.push(assignment);
    this.userAssignments.set(this.userId, userAssignments);

    this.persistAssignment(assignment);
  }

  private getUserData() {
    // This would get actual user data
    return {
      type: 'beta' as const,
      experience: 'intermediate' as const,
      platform: 'desktop' as const,
      attributes: {}
    };
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculatePValue(zScore: number): number {
    // Simplified p-value calculation
    return 2 * (1 - this.normalCDF(Math.abs(zScore)));
  }

  private normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Placeholder methods for persistence and monitoring
  private async validateTestConfig(test: ABTest): Promise<void> {
    // Validate test configuration
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('Variant weights must sum to 100');
    }
  }

  private async persistTest(test: ABTest): Promise<void> {
    localStorage.setItem(`ab-test-${test.id}`, JSON.stringify(test));
  }

  private async persistEvent(event: ABTestEvent): Promise<void> {
    const events = JSON.parse(localStorage.getItem('ab-test-events') || '[]');
    events.push(event);
    localStorage.setItem('ab-test-events', JSON.stringify(events));
  }

  private async persistAssignment(assignment: UserAssignment): Promise<void> {
    const assignments = JSON.parse(localStorage.getItem('ab-test-assignments') || '[]');
    assignments.push(assignment);
    localStorage.setItem('ab-test-assignments', JSON.stringify(assignments));
  }

  private loadActiveTests(): void {
    // Load from localStorage or API
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('ab-test-'));
      keys.forEach(key => {
        const test = JSON.parse(localStorage.getItem(key) || '{}');
        if (test.status === 'active') {
          this.activeTests.set(test.id, test);
        }
      });
    } catch (error) {
      console.error('Failed to load active tests:', error);
    }
  }

  private loadUserAssignments(): void {
    try {
      const assignments = JSON.parse(localStorage.getItem('ab-test-assignments') || '[]');
      assignments.forEach((assignment: UserAssignment) => {
        const userAssignments = this.userAssignments.get(assignment.userId) || [];
        userAssignments.push(assignment);
        this.userAssignments.set(assignment.userId, userAssignments);
      });
    } catch (error) {
      console.error('Failed to load user assignments:', error);
    }
  }

  private calculateCustomMetrics(events: ABTestEvent[]): Record<string, number> {
    return {
      totalEvents: events.length,
      uniqueUsers: new Set(events.map(e => e.userId)).size,
      averageEventsPerUser: events.length / new Set(events.map(e => e.userId)).size || 0
    };
  }

  private generateRecommendation(
    significance: SignificanceTest,
    metrics: Record<string, VariantMetrics>,
    test: ABTest
  ): 'continue' | 'rollback' | 'winner' | 'inconclusive' {
    if (!significance.significant) return 'inconclusive';

    const controlVariant = test.variants.find(v => v.isControl);
    const testVariant = test.variants.find(v => !v.isControl);

    if (!controlVariant || !testVariant) return 'inconclusive';

    const controlMetrics = metrics[controlVariant.id];
    const testMetrics = metrics[testVariant.id];

    if (testMetrics.averageValue > controlMetrics.averageValue) {
      return 'winner';
    } else {
      return 'rollback';
    }
  }

  private findWinningVariant(metrics: Record<string, VariantMetrics>): string {
    let bestVariant = '';
    let bestValue = -Infinity;

    Object.entries(metrics).forEach(([variantId, metric]) => {
      if (metric.averageValue > bestValue) {
        bestValue = metric.averageValue;
        bestVariant = variantId;
      }
    });

    return bestVariant;
  }

  private async getCurrentMetrics(testId: string): Promise<any> {
    // Mock current metrics - in real implementation, this would fetch from monitoring system
    return {
      errorRate: Math.random() * 0.01,
      latency: Math.random() * 100,
      successRate: 0.95 + Math.random() * 0.05,
      customMetric: Math.random() * 100
    };
  }

  private evaluateTriggerCondition(value: number, trigger: RollbackTrigger): boolean {
    switch (trigger.condition) {
      case 'gt': return value > trigger.threshold;
      case 'lt': return value < trigger.threshold;
      case 'eq': return Math.abs(value - trigger.threshold) < 0.001;
      default: return false;
    }
  }

  private async reassignAllUsers(testId: string, variantId: string): Promise<void> {
    // This would reassign all users in the test to the specified variant
    console.log(`Reassigning all users in test ${testId} to variant ${variantId}`);
  }

  private logTestCompletion(testId: string, reason: string, results: ABTestResults): void {
    console.log(`🏁 A/B test ${testId} completed (${reason}):`, results);
  }

  private logRollback(testId: string, reason: string): void {
    console.warn(`🔄 Rollback triggered for test ${testId}: ${reason}`);
  }

  private async notifyRollback(testId: string, reason: string): Promise<void> {
    // This would send notifications to administrators
    console.warn(`📧 Rollback notification sent for test ${testId}: ${reason}`);
  }
}