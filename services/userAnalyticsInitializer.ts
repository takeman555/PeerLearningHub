/**
 * User Analytics Initializer
 * Sets up and configures the user analytics system
 */

import UserAnalyticsService, { AnalyticsConfig } from './userAnalyticsService';

class UserAnalyticsInitializer {
  private static instance: UserAnalyticsService | null = null;
  private static isInitialized = false;

  /**
   * Initialize the user analytics system
   */
  static async initialize(): Promise<UserAnalyticsService> {
    if (this.isInitialized && this.instance) {
      return this.instance;
    }

    try {
      const config = await this.loadConfiguration();
      this.instance = new UserAnalyticsService(config);
      this.isInitialized = true;

      console.log('[UserAnalyticsInitializer] User analytics system initialized successfully');
      return this.instance;
    } catch (error) {
      console.error('[UserAnalyticsInitializer] Failed to initialize user analytics:', error);
      throw error;
    }
  }

  /**
   * Get the analytics service instance
   */
  static getInstance(): UserAnalyticsService | null {
    return this.instance;
  }

  /**
   * Load analytics configuration
   */
  private static async loadConfiguration(): Promise<AnalyticsConfig> {
    // Default configuration
    const defaultConfig: AnalyticsConfig = {
      enableTracking: true,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      enableDebugMode: __DEV__ || false
    };

    try {
      // In production, this could load from environment variables or remote config
      const config: AnalyticsConfig = {
        enableTracking: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED !== 'false',
        batchSize: parseInt(process.env.EXPO_PUBLIC_ANALYTICS_BATCH_SIZE || '10'),
        flushInterval: parseInt(process.env.EXPO_PUBLIC_ANALYTICS_FLUSH_INTERVAL || '30000'),
        enableDebugMode: process.env.NODE_ENV === 'development'
      };

      return { ...defaultConfig, ...config };
    } catch (error) {
      console.warn('[UserAnalyticsInitializer] Failed to load custom config, using defaults:', error);
      return defaultConfig;
    }
  }

  /**
   * Setup analytics database tables
   */
  static async setupDatabase(): Promise<void> {
    try {
      // This would create the necessary database tables for analytics
      console.log('[UserAnalyticsInitializer] Setting up analytics database tables...');
      
      // In a real implementation, this would execute SQL migrations
      await this.createAnalyticsTables();
      
      console.log('[UserAnalyticsInitializer] Analytics database setup completed');
    } catch (error) {
      console.error('[UserAnalyticsInitializer] Failed to setup analytics database:', error);
      throw error;
    }
  }

  /**
   * Create analytics database tables
   */
  private static async createAnalyticsTables(): Promise<void> {
    // This would contain the actual database table creation logic
    // For now, we'll just log the intended structure
    
    const tables = [
      {
        name: 'user_actions',
        columns: [
          'id SERIAL PRIMARY KEY',
          'user_id UUID REFERENCES auth.users(id)',
          'action_type VARCHAR(100) NOT NULL',
          'screen_name VARCHAR(100) NOT NULL',
          'timestamp TIMESTAMPTZ DEFAULT NOW()',
          'metadata JSONB'
        ]
      },
      {
        name: 'screen_transitions',
        columns: [
          'id SERIAL PRIMARY KEY',
          'user_id UUID REFERENCES auth.users(id)',
          'from_screen VARCHAR(100)',
          'to_screen VARCHAR(100) NOT NULL',
          'timestamp TIMESTAMPTZ DEFAULT NOW()',
          'duration INTEGER'
        ]
      },
      {
        name: 'conversion_events',
        columns: [
          'id SERIAL PRIMARY KEY',
          'user_id UUID REFERENCES auth.users(id)',
          'event_type VARCHAR(100) NOT NULL',
          'funnel_step VARCHAR(100) NOT NULL',
          'timestamp TIMESTAMPTZ DEFAULT NOW()',
          'value DECIMAL(10,2)',
          'metadata JSONB'
        ]
      },
      {
        name: 'feature_usage',
        columns: [
          'id SERIAL PRIMARY KEY',
          'user_id UUID REFERENCES auth.users(id)',
          'feature_name VARCHAR(100) NOT NULL',
          'usage_count INTEGER DEFAULT 1',
          'last_used TIMESTAMPTZ DEFAULT NOW()',
          'total_time_spent INTEGER DEFAULT 0',
          'UNIQUE(user_id, feature_name)'
        ]
      }
    ];

    console.log('[UserAnalyticsInitializer] Analytics tables structure:', tables);
  }

  /**
   * Validate analytics setup
   */
  static async validateSetup(): Promise<boolean> {
    try {
      if (!this.instance) {
        console.error('[UserAnalyticsInitializer] Analytics service not initialized');
        return false;
      }

      // Test basic functionality
      const testUserId = 'test-user-id';
      
      // Test action tracking
      this.instance.trackAction(testUserId, 'test_action', 'test_screen', { test: true });
      
      // Test screen transition tracking
      this.instance.trackScreenTransition(testUserId, 'test_screen');
      
      // Test conversion tracking
      this.instance.trackConversion(testUserId, 'test_conversion', 'step_1', 100);
      
      // Test feature usage tracking
      await this.instance.trackFeatureUsage(testUserId, 'test_feature', 1000);

      console.log('[UserAnalyticsInitializer] Analytics validation completed successfully');
      return true;
    } catch (error) {
      console.error('[UserAnalyticsInitializer] Analytics validation failed:', error);
      return false;
    }
  }

  /**
   * Get analytics health status
   */
  static getHealthStatus(): {
    isInitialized: boolean;
    hasInstance: boolean;
    timestamp: Date;
  } {
    return {
      isInitialized: this.isInitialized,
      hasInstance: this.instance !== null,
      timestamp: new Date()
    };
  }

  /**
   * Shutdown analytics system
   */
  static shutdown(): void {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
    this.isInitialized = false;
    console.log('[UserAnalyticsInitializer] Analytics system shutdown completed');
  }
}

export default UserAnalyticsInitializer;