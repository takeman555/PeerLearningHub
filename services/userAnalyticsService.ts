/**
 * User Analytics Service
 * Tracks user behavior, screen transitions, and conversion metrics
 */

export interface UserAction {
  userId: string;
  actionType: string;
  screenName: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ScreenTransition {
  userId: string;
  fromScreen: string;
  toScreen: string;
  timestamp: Date;
  duration?: number;
}

export interface ConversionEvent {
  userId: string;
  eventType: string;
  funnelStep: string;
  timestamp: Date;
  value?: number;
  metadata?: Record<string, any>;
}

export interface FeatureUsage {
  userId: string;
  featureName: string;
  usageCount: number;
  lastUsed: Date;
  totalTimeSpent: number;
}

export interface AnalyticsConfig {
  enableTracking: boolean;
  batchSize: number;
  flushInterval: number;
  enableDebugMode: boolean;
}

class UserAnalyticsService {
  private config: AnalyticsConfig;
  private actionQueue: UserAction[] = [];
  private transitionQueue: ScreenTransition[] = [];
  private conversionQueue: ConversionEvent[] = [];
  private currentScreen: string = '';
  private screenStartTime: Date | null = null;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.initializeService();
  }

  private initializeService(): void {
    if (this.config.enableTracking) {
      this.startFlushTimer();
      this.log('User Analytics Service initialized');
    }
  }

  /**
   * Track user actions (clicks, taps, form submissions, etc.)
   */
  trackAction(
    userId: string,
    actionType: string,
    screenName: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enableTracking) return;

    const action: UserAction = {
      userId,
      actionType,
      screenName,
      timestamp: new Date(),
      metadata
    };

    this.actionQueue.push(action);
    this.log('Action tracked:', action);

    if (this.actionQueue.length >= this.config.batchSize) {
      this.flushActions();
    }
  }

  /**
   * Track screen transitions and navigation patterns
   */
  trackScreenTransition(userId: string, toScreen: string): void {
    if (!this.config.enableTracking) return;

    const now = new Date();
    let duration: number | undefined;

    if (this.currentScreen && this.screenStartTime) {
      duration = now.getTime() - this.screenStartTime.getTime();
      
      const transition: ScreenTransition = {
        userId,
        fromScreen: this.currentScreen,
        toScreen,
        timestamp: now,
        duration
      };

      this.transitionQueue.push(transition);
      this.log('Screen transition tracked:', transition);
    }

    this.currentScreen = toScreen;
    this.screenStartTime = now;

    if (this.transitionQueue.length >= this.config.batchSize) {
      this.flushTransitions();
    }
  }

  /**
   * Track conversion events for funnel analysis
   */
  trackConversion(
    userId: string,
    eventType: string,
    funnelStep: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enableTracking) return;

    const conversion: ConversionEvent = {
      userId,
      eventType,
      funnelStep,
      timestamp: new Date(),
      value,
      metadata
    };

    this.conversionQueue.push(conversion);
    this.log('Conversion tracked:', conversion);

    if (this.conversionQueue.length >= this.config.batchSize) {
      this.flushConversions();
    }
  }

  /**
   * Track feature usage patterns
   */
  async trackFeatureUsage(
    userId: string,
    featureName: string,
    timeSpent?: number
  ): Promise<void> {
    if (!this.config.enableTracking) return;

    try {
      // This would typically update a database or send to analytics service
      const usage: FeatureUsage = {
        userId,
        featureName,
        usageCount: 1,
        lastUsed: new Date(),
        totalTimeSpent: timeSpent || 0
      };

      this.log('Feature usage tracked:', usage);
      
      // In a real implementation, this would be stored in database
      await this.storeFeatureUsage(usage);
    } catch (error) {
      this.log('Error tracking feature usage:', error);
    }
  }

  /**
   * Get analytics data for reporting
   */
  async getAnalyticsData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    actions: UserAction[];
    transitions: ScreenTransition[];
    conversions: ConversionEvent[];
    featureUsage: FeatureUsage[];
  }> {
    try {
      // In a real implementation, this would query the database
      return {
        actions: await this.getStoredActions(userId, startDate, endDate),
        transitions: await this.getStoredTransitions(userId, startDate, endDate),
        conversions: await this.getStoredConversions(userId, startDate, endDate),
        featureUsage: await this.getStoredFeatureUsage(userId, startDate, endDate)
      };
    } catch (error) {
      this.log('Error getting analytics data:', error);
      return {
        actions: [],
        transitions: [],
        conversions: [],
        featureUsage: []
      };
    }
  }

  /**
   * Calculate conversion rates for different funnels
   */
  async calculateConversionRates(
    funnelSteps: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    try {
      const conversions = await this.getAllConversions(startDate, endDate);
      const rates: Record<string, number> = {};

      for (let i = 0; i < funnelSteps.length - 1; i++) {
        const currentStep = funnelSteps[i];
        const nextStep = funnelSteps[i + 1];

        const currentStepUsers = new Set(
          conversions
            .filter(c => c.funnelStep === currentStep)
            .map(c => c.userId)
        );

        const nextStepUsers = new Set(
          conversions
            .filter(c => c.funnelStep === nextStep)
            .map(c => c.userId)
        );

        const conversionRate = currentStepUsers.size > 0 
          ? (nextStepUsers.size / currentStepUsers.size) * 100 
          : 0;

        rates[`${currentStep}_to_${nextStep}`] = conversionRate;
      }

      return rates;
    } catch (error) {
      this.log('Error calculating conversion rates:', error);
      return {};
    }
  }

  /**
   * Get feature usage statistics
   */
  async getFeatureUsageStats(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, {
    totalUsers: number;
    totalUsage: number;
    averageTimeSpent: number;
  }>> {
    try {
      const featureUsage = await this.getAllFeatureUsage(startDate, endDate);
      const stats: Record<string, any> = {};

      featureUsage.forEach(usage => {
        if (!stats[usage.featureName]) {
          stats[usage.featureName] = {
            users: new Set(),
            totalUsage: 0,
            totalTimeSpent: 0
          };
        }

        stats[usage.featureName].users.add(usage.userId);
        stats[usage.featureName].totalUsage += usage.usageCount;
        stats[usage.featureName].totalTimeSpent += usage.totalTimeSpent;
      });

      // Convert to final format
      const result: Record<string, any> = {};
      Object.keys(stats).forEach(feature => {
        const data = stats[feature];
        result[feature] = {
          totalUsers: data.users.size,
          totalUsage: data.totalUsage,
          averageTimeSpent: data.totalUsage > 0 ? data.totalTimeSpent / data.totalUsage : 0
        };
      });

      return result;
    } catch (error) {
      this.log('Error getting feature usage stats:', error);
      return {};
    }
  }

  /**
   * Flush queued data to storage
   */
  private async flushAll(): Promise<void> {
    await Promise.all([
      this.flushActions(),
      this.flushTransitions(),
      this.flushConversions()
    ]);
  }

  private async flushActions(): Promise<void> {
    if (this.actionQueue.length === 0) return;

    try {
      const actions = [...this.actionQueue];
      this.actionQueue = [];
      await this.storeActions(actions);
      this.log(`Flushed ${actions.length} actions`);
    } catch (error) {
      this.log('Error flushing actions:', error);
    }
  }

  private async flushTransitions(): Promise<void> {
    if (this.transitionQueue.length === 0) return;

    try {
      const transitions = [...this.transitionQueue];
      this.transitionQueue = [];
      await this.storeTransitions(transitions);
      this.log(`Flushed ${transitions.length} transitions`);
    } catch (error) {
      this.log('Error flushing transitions:', error);
    }
  }

  private async flushConversions(): Promise<void> {
    if (this.conversionQueue.length === 0) return;

    try {
      const conversions = [...this.conversionQueue];
      this.conversionQueue = [];
      await this.storeConversions(conversions);
      this.log(`Flushed ${conversions.length} conversions`);
    } catch (error) {
      this.log('Error flushing conversions:', error);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushAll();
    }, this.config.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private log(message: string, data?: any): void {
    if (this.config.enableDebugMode) {
      console.log(`[UserAnalytics] ${message}`, data || '');
    }
  }

  // Storage methods (to be implemented with actual database)
  private async storeActions(actions: UserAction[]): Promise<void> {
    // Implementation would store to Supabase or other analytics service
    this.log('Storing actions to database', actions);
  }

  private async storeTransitions(transitions: ScreenTransition[]): Promise<void> {
    // Implementation would store to Supabase or other analytics service
    this.log('Storing transitions to database', transitions);
  }

  private async storeConversions(conversions: ConversionEvent[]): Promise<void> {
    // Implementation would store to Supabase or other analytics service
    this.log('Storing conversions to database', conversions);
  }

  private async storeFeatureUsage(usage: FeatureUsage): Promise<void> {
    // Implementation would store to Supabase or other analytics service
    this.log('Storing feature usage to database', usage);
  }

  private async getStoredActions(userId: string, startDate: Date, endDate: Date): Promise<UserAction[]> {
    // Implementation would query from database
    return [];
  }

  private async getStoredTransitions(userId: string, startDate: Date, endDate: Date): Promise<ScreenTransition[]> {
    // Implementation would query from database
    return [];
  }

  private async getStoredConversions(userId: string, startDate: Date, endDate: Date): Promise<ConversionEvent[]> {
    // Implementation would query from database
    return [];
  }

  private async getStoredFeatureUsage(userId: string, startDate: Date, endDate: Date): Promise<FeatureUsage[]> {
    // Implementation would query from database
    return [];
  }

  private async getAllConversions(startDate: Date, endDate: Date): Promise<ConversionEvent[]> {
    // Implementation would query from database
    return [];
  }

  private async getAllFeatureUsage(startDate: Date, endDate: Date): Promise<FeatureUsage[]> {
    // Implementation would query from database
    return [];
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flushAll();
  }
}

export default UserAnalyticsService;