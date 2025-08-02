// 🚀 Progressive Rollout Manager - Safe feature deployment

import { ABTestManager, type ABTest } from './ABTestManager.js';
import { BetaManager } from './BetaManager.js';

export interface RolloutPlan {
  id: string;
  name: string;
  description: string;
  feature: string;

  // Rollout strategy
  strategy: RolloutStrategy;
  phases: RolloutPhase[];

  // Timeline
  startDate: string;
  estimatedCompletion: string;
  actualCompletion?: string;

  // Current status
  status: 'planned' | 'active' | 'paused' | 'completed' | 'rolled_back';
  currentPhase: number;
  currentPercentage: number;

  // Safety
  rollbackConditions: RollbackCondition[];
  monitoringConfig: MonitoringConfig;

  // Results
  metrics: RolloutMetrics;
}

export interface RolloutStrategy {
  type: 'canary' | 'blue_green' | 'gradual' | 'feature_flag';
  targetAudience: 'beta' | 'staff' | 'percentage' | 'all';
  rollbackStrategy: 'immediate' | 'gradual' | 'manual';
}

export interface RolloutPhase {
  name: string;
  percentage: number;
  duration: number; // hours
  criteria: PhaseCriteria;
  audiences: string[];
}

export interface PhaseCriteria {
  minSuccessRate: number;
  maxErrorRate: number;
  maxLatencyIncrease: number;
  minUserSatisfaction?: number;
  customMetrics?: Record<string, { min?: number; max?: number }>;
}

export interface RollbackCondition {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  duration: number; // minutes
  severity: 'warning' | 'critical';
}

export interface MonitoringConfig {
  metricsToTrack: string[];
  alertThresholds: Record<string, number>;
  dashboardUrl?: string;
  slackChannel?: string;
  emailList?: string[];
}

export interface RolloutMetrics {
  usersAffected: number;
  errorRate: number;
  successRate: number;
  averageLatency: number;
  userSatisfaction: number;
  featureAdoption: number;
  rollbacksTriggered: number;
  phaseTransitions: PhaseTransition[];
}

export interface PhaseTransition {
  fromPhase: number;
  toPhase: number;
  timestamp: string;
  reason: string;
  metrics: Record<string, number>;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetAudiences: string[];
  conditions: FlagCondition[];
  variants?: FlagVariant[];
}

export interface FlagCondition {
  attribute: string;
  operator: 'eq' | 'ne' | 'in' | 'not_in' | 'gt' | 'lt';
  value: any;
}

export interface FlagVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, any>;
}

export class RolloutManager {
  private abTestManager: ABTestManager;
  private betaManager: BetaManager;
  private activeRollouts: Map<string, RolloutPlan> = new Map();
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private userId: string;

  constructor(userId: string, betaManager: BetaManager) {
    this.userId = userId;
    this.betaManager = betaManager;
    this.abTestManager = new ABTestManager(userId);

    this.loadActiveRollouts();
    this.loadFeatureFlags();
    this.startMonitoring();
  }

  // 🚀 Rollout Management
  async createRolloutPlan(plan: Omit<RolloutPlan, 'id' | 'status' | 'currentPhase' | 'currentPercentage' | 'metrics'>): Promise<string> {
    const rolloutId = this.generateId();

    const fullPlan: RolloutPlan = {
      id: rolloutId,
      ...plan,
      status: 'planned',
      currentPhase: 0,
      currentPercentage: 0,
      metrics: {
        usersAffected: 0,
        errorRate: 0,
        successRate: 1,
        averageLatency: 0,
        userSatisfaction: 0,
        featureAdoption: 0,
        rollbacksTriggered: 0,
        phaseTransitions: []
      }
    };

    this.activeRollouts.set(rolloutId, fullPlan);
    await this.persistRollout(fullPlan);

    console.log('🚀 Rollout plan created:', rolloutId);
    return rolloutId;
  }

  async startRollout(rolloutId: string): Promise<void> {
    const plan = this.activeRollouts.get(rolloutId);
    if (!plan) throw new Error(`Rollout ${rolloutId} not found`);

    plan.status = 'active';
    plan.startDate = new Date().toISOString();

    // Create corresponding A/B test
    await this.createRolloutABTest(plan);

    // Start with first phase
    await this.transitionToPhase(rolloutId, 0);

    console.log('🚀 Rollout started:', rolloutId);
  }

  async pauseRollout(rolloutId: string): Promise<void> {
    const plan = this.activeRollouts.get(rolloutId);
    if (!plan) throw new Error(`Rollout ${rolloutId} not found`);

    plan.status = 'paused';
    await this.persistRollout(plan);

    console.log('⏸️ Rollout paused:', rolloutId);
  }

  async resumeRollout(rolloutId: string): Promise<void> {
    const plan = this.activeRollouts.get(rolloutId);
    if (!plan) throw new Error(`Rollout ${rolloutId} not found`);

    plan.status = 'active';
    await this.persistRollout(plan);

    console.log('▶️ Rollout resumed:', rolloutId);
  }

  async rollbackRollout(rolloutId: string, reason: string): Promise<void> {
    const plan = this.activeRollouts.get(rolloutId);
    if (!plan) throw new Error(`Rollout ${rolloutId} not found`);

    console.warn(`🔄 Rolling back rollout ${rolloutId}: ${reason}`);

    plan.status = 'rolled_back';
    plan.metrics.rollbacksTriggered++;

    // Disable feature flag
    const featureFlag = this.featureFlags.get(plan.feature);
    if (featureFlag) {
      featureFlag.enabled = false;
      featureFlag.rolloutPercentage = 0;
      await this.persistFeatureFlag(featureFlag);
    }

    // Stop A/B test
    await this.abTestManager.stopTest(`rollout-${rolloutId}`, `rollback: ${reason}`);

    // Notify stakeholders
    await this.notifyRollback(rolloutId, reason);

    await this.persistRollout(plan);
  }

  // 📊 Feature Flags
  createFeatureFlag(flag: Omit<FeatureFlag, 'id'>): string {
    const flagId = this.generateId();
    const fullFlag: FeatureFlag = {
      id: flagId,
      ...flag
    };

    this.featureFlags.set(flagId, fullFlag);
    this.persistFeatureFlag(fullFlag);

    console.log('🚩 Feature flag created:', flagId);
    return flagId;
  }

  isFeatureEnabled(flagName: string, userContext?: Record<string, any>): boolean {
    const flag = Array.from(this.featureFlags.values()).find(f => f.name === flagName);
    if (!flag || !flag.enabled) return false;

    // Check rollout percentage
    if (Math.random() * 100 > flag.rolloutPercentage) return false;

    // Check target audiences
    if (flag.targetAudiences.length > 0) {
      const userAudiences = this.getUserAudiences();
      if (!flag.targetAudiences.some(audience => userAudiences.includes(audience))) {
        return false;
      }
    }

    // Check conditions
    if (flag.conditions.length > 0) {
      const context = { ...this.getUserContext(), ...userContext };
      if (!this.evaluateConditions(flag.conditions, context)) {
        return false;
      }
    }

    return true;
  }

  getFeatureVariant(flagName: string, userContext?: Record<string, any>): string | null {
    const flag = Array.from(this.featureFlags.values()).find(f => f.name === flagName);
    if (!flag || !flag.enabled || !flag.variants) return null;

    if (!this.isFeatureEnabled(flagName, userContext)) return null;

    // Deterministic variant assignment based on user ID
    const hash = this.simpleHash(this.userId + flagName);
    const percentage = (hash % 10000) / 100;

    let cumulative = 0;
    for (const variant of flag.variants) {
      cumulative += variant.weight;
      if (percentage <= cumulative) {
        return variant.id;
      }
    }

    return flag.variants[0]?.id || null;
  }

  // 📈 Phase Management
  private async transitionToPhase(rolloutId: string, phaseIndex: number): Promise<void> {
    const plan = this.activeRollouts.get(rolloutId);
    if (!plan) return;

    const phase = plan.phases[phaseIndex];
    if (!phase) {
      // Rollout complete
      await this.completeRollout(rolloutId);
      return;
    }

    console.log(`📈 Transitioning rollout ${rolloutId} to phase ${phaseIndex}: ${phase.name}`);

    // Record transition
    const transition: PhaseTransition = {
      fromPhase: plan.currentPhase,
      toPhase: phaseIndex,
      timestamp: new Date().toISOString(),
      reason: 'scheduled',
      metrics: { ...plan.metrics } as any
    };
    plan.metrics.phaseTransitions.push(transition);

    // Update current phase
    plan.currentPhase = phaseIndex;
    plan.currentPercentage = phase.percentage;

    // Update feature flag rollout percentage
    const featureFlag = this.featureFlags.get(plan.feature);
    if (featureFlag) {
      featureFlag.rolloutPercentage = phase.percentage;
      await this.persistFeatureFlag(featureFlag);
    }

    // Schedule next phase transition
    if (phaseIndex < plan.phases.length - 1) {
      setTimeout(() => {
        this.evaluatePhaseTransition(rolloutId, phaseIndex);
      }, phase.duration * 60 * 60 * 1000); // Convert hours to milliseconds
    }

    await this.persistRollout(plan);
  }

  private async evaluatePhaseTransition(rolloutId: string, currentPhaseIndex: number): Promise<void> {
    const plan = this.activeRollouts.get(rolloutId);
    if (!plan || plan.status !== 'active') return;

    const phase = plan.phases[currentPhaseIndex];
    const currentMetrics = await this.getCurrentMetrics(rolloutId);

    // Check if current phase criteria are met
    if (this.evaluatePhaseCriteria(phase.criteria, currentMetrics)) {
      // Proceed to next phase
      await this.transitionToPhase(rolloutId, currentPhaseIndex + 1);
    } else {
      // Criteria not met - consider pausing or rolling back
      console.warn(`⚠️ Phase criteria not met for rollout ${rolloutId}, phase ${currentPhaseIndex}`);

      // Check if we should rollback
      if (this.shouldTriggerRollback(plan, currentMetrics)) {
        await this.rollbackRollout(rolloutId, 'Phase criteria not met');
      } else {
        // Pause rollout for manual review
        await this.pauseRollout(rolloutId);
        await this.notifyPhaseFailure(rolloutId, currentPhaseIndex, currentMetrics);
      }
    }
  }

  private evaluatePhaseCriteria(criteria: PhaseCriteria, metrics: Record<string, number>): boolean {
    if (metrics.successRate < criteria.minSuccessRate) return false;
    if (metrics.errorRate > criteria.maxErrorRate) return false;
    if (metrics.latency > criteria.maxLatencyIncrease) return false;
    if (criteria.minUserSatisfaction && metrics.userSatisfaction < criteria.minUserSatisfaction) return false;

    // Check custom metrics
    if (criteria.customMetrics) {
      for (const [metric, bounds] of Object.entries(criteria.customMetrics)) {
        const value = metrics[metric];
        if (bounds.min !== undefined && value < bounds.min) return false;
        if (bounds.max !== undefined && value > bounds.max) return false;
      }
    }

    return true;
  }

  private shouldTriggerRollback(plan: RolloutPlan, metrics: Record<string, number>): boolean {
    for (const condition of plan.rollbackConditions) {
      if (condition.severity === 'critical' && this.evaluateRollbackCondition(condition, metrics)) {
        return true;
      }
    }
    return false;
  }

  private evaluateRollbackCondition(condition: RollbackCondition, metrics: Record<string, number>): boolean {
    const value = metrics[condition.metric];
    switch (condition.operator) {
      case 'gt': return value > condition.threshold;
      case 'lt': return value < condition.threshold;
      case 'eq': return Math.abs(value - condition.threshold) < 0.001;
      default: return false;
    }
  }

  // 🔄 A/B Test Integration
  private async createRolloutABTest(plan: RolloutPlan): Promise<void> {
    const testConfig = {
      name: `Rollout: ${plan.name}`,
      description: `A/B test for gradual rollout of ${plan.feature}`,
      variants: [
        {
          id: 'control',
          name: 'Control (Old Version)',
          description: 'Users see the current version',
          weight: 100 - plan.phases[0].percentage,
          config: {
            features: { [plan.feature]: false },
            ui: {},
            analytics: { trackingEnabled: true, customEvents: [], samplingRate: 1 }
          },
          isControl: true
        },
        {
          id: 'treatment',
          name: 'Treatment (New Feature)',
          description: 'Users see the new feature',
          weight: plan.phases[0].percentage,
          config: {
            features: { [plan.feature]: true },
            ui: {},
            analytics: { trackingEnabled: true, customEvents: [], samplingRate: 1 }
          },
          isControl: false
        }
      ],
      targetAudience: {
        criteria: {
          userType: plan.strategy.targetAudience === 'beta' ? 'beta' : 'all'
        },
        percentage: 100
      },
      allocation: {
        type: 'gradual' as const,
        gradualRollout: {
          initialPercentage: plan.phases[0].percentage,
          incrementPercentage: 10,
          incrementInterval: 24,
          maxPercentage: 100
        }
      },
      primaryMetric: 'conversion',
      secondaryMetrics: ['engagement', 'satisfaction'],
      minimumSampleSize: 1000,
      confidenceLevel: 0.95,
      safeguards: {
        maxErrorRate: plan.rollbackConditions.find(c => c.metric === 'errorRate')?.threshold || 0.1,
        maxLatencyIncrease: plan.rollbackConditions.find(c => c.metric === 'latency')?.threshold || 500,
        minSuccessRate: 0.95,
        monitoringInterval: 5
      },
      rollbackTriggers: plan.rollbackConditions.map(condition => ({
        metric: condition.metric,
        condition: condition.operator,
        threshold: condition.threshold,
        duration: condition.duration
      }))
    };

    await this.abTestManager.createTest(testConfig);
    await this.abTestManager.startTest(`rollout-${plan.id}`);
  }

  // 📊 Monitoring
  private startMonitoring(): void {
    // Check rollouts every 5 minutes
    setInterval(() => {
      this.checkActiveRollouts();
    }, 5 * 60 * 1000);
  }

  private async checkActiveRollouts(): Promise<void> {
    for (const [rolloutId, plan] of this.activeRollouts) {
      if (plan.status !== 'active') continue;

      const currentMetrics = await this.getCurrentMetrics(rolloutId);

      // Update plan metrics
      Object.assign(plan.metrics, currentMetrics);

      // Check rollback conditions
      for (const condition of plan.rollbackConditions) {
        if (this.evaluateRollbackCondition(condition, currentMetrics)) {
          await this.rollbackRollout(rolloutId, `Rollback condition triggered: ${condition.metric}`);
          break;
        }
      }
    }
  }

  private async getCurrentMetrics(rolloutId: string): Promise<Record<string, number>> {
    // In a real implementation, this would fetch from monitoring systems
    return {
      successRate: 0.95 + Math.random() * 0.05,
      errorRate: Math.random() * 0.02,
      latency: 100 + Math.random() * 50,
      userSatisfaction: 4.0 + Math.random() * 1.0,
      featureAdoption: Math.random() * 100,
      usersAffected: Math.floor(Math.random() * 10000)
    };
  }

  // 🏁 Completion
  private async completeRollout(rolloutId: string): Promise<void> {
    const plan = this.activeRollouts.get(rolloutId);
    if (!plan) return;

    plan.status = 'completed';
    plan.actualCompletion = new Date().toISOString();
    plan.currentPercentage = 100;

    // Enable feature flag at 100%
    const featureFlag = this.featureFlags.get(plan.feature);
    if (featureFlag) {
      featureFlag.rolloutPercentage = 100;
      await this.persistFeatureFlag(featureFlag);
    }

    // Complete A/B test
    await this.abTestManager.stopTest(`rollout-${rolloutId}`, 'rollout_complete');

    await this.persistRollout(plan);
    await this.notifyRolloutComplete(rolloutId);

    console.log('🏁 Rollout completed:', rolloutId);
  }

  // 🔧 Utility Methods
  private evaluateConditions(conditions: FlagCondition[], context: Record<string, any>): boolean {
    return conditions.every(condition => {
      const value = context[condition.attribute];

      switch (condition.operator) {
        case 'eq': return value === condition.value;
        case 'ne': return value !== condition.value;
        case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
        case 'not_in': return Array.isArray(condition.value) && !condition.value.includes(value);
        case 'gt': return typeof value === 'number' && value > condition.value;
        case 'lt': return typeof value === 'number' && value < condition.value;
        default: return false;
      }
    });
  }

  private getUserAudiences(): string[] {
    // This would determine user's audiences (beta, staff, etc.)
    return ['beta', 'desktop'];
  }

  private getUserContext(): Record<string, any> {
    return {
      userId: this.userId,
      platform: 'web',
      version: '2.0.0',
      locale: 'en-US'
    };
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Persistence and notifications (placeholder implementations)
  private async persistRollout(plan: RolloutPlan): Promise<void> {
    localStorage.setItem(`rollout-${plan.id}`, JSON.stringify(plan));
  }

  private async persistFeatureFlag(flag: FeatureFlag): Promise<void> {
    localStorage.setItem(`flag-${flag.id}`, JSON.stringify(flag));
  }

  private loadActiveRollouts(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('rollout-'));
      keys.forEach(key => {
        const plan = JSON.parse(localStorage.getItem(key) || '{}');
        if (plan.status === 'active' || plan.status === 'paused') {
          this.activeRollouts.set(plan.id, plan);
        }
      });
    } catch (error) {
      console.error('Failed to load active rollouts:', error);
    }
  }

  private loadFeatureFlags(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('flag-'));
      keys.forEach(key => {
        const flag = JSON.parse(localStorage.getItem(key) || '{}');
        this.featureFlags.set(flag.id, flag);
      });
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }
  }

  private async notifyRollback(rolloutId: string, reason: string): Promise<void> {
    console.warn(`📧 Rollback notification: ${rolloutId} - ${reason}`);
  }

  private async notifyPhaseFailure(rolloutId: string, phase: number, metrics: Record<string, number>): Promise<void> {
    console.warn(`📧 Phase failure notification: ${rolloutId} phase ${phase}`, metrics);
  }

  private async notifyRolloutComplete(rolloutId: string): Promise<void> {
    console.log(`📧 Rollout completion notification: ${rolloutId}`);
  }

  // Public getters for monitoring
  getRolloutStatus(rolloutId: string): RolloutPlan | null {
    return this.activeRollouts.get(rolloutId) || null;
  }

  getAllActiveRollouts(): RolloutPlan[] {
    return Array.from(this.activeRollouts.values()).filter(plan => plan.status === 'active');
  }

  getFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }
}