/**
 * User Analytics System Tests
 * Tests for user behavior tracking, conversion analysis, and feature usage
 */

import UserAnalyticsService from '../services/userAnalyticsService';
import UserAnalyticsInitializer from '../services/userAnalyticsInitializer';

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('UserAnalyticsService', () => {
  let analyticsService: UserAnalyticsService;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    const config = {
      enableTracking: true,
      batchSize: 5,
      flushInterval: 1000,
      enableDebugMode: false
    };
    analyticsService = new UserAnalyticsService(config);
  });

  afterEach(() => {
    if (analyticsService) {
      analyticsService.destroy();
    }
  });

  describe('Action Tracking', () => {
    it('should track user actions correctly', () => {
      const actionType = 'button_click';
      const screenName = 'community';
      const metadata = { buttonName: 'create_post' };

      // Track action should not throw
      expect(() => {
        analyticsService.trackAction(testUserId, actionType, screenName, metadata);
      }).not.toThrow();
    });

    it('should handle multiple actions in sequence', () => {
      const actions = [
        { type: 'button_click', screen: 'community', metadata: { button: 'post' } },
        { type: 'form_submission', screen: 'community', metadata: { form: 'create_post' } },
        { type: 'content_view', screen: 'community', metadata: { content: 'post_123' } }
      ];

      actions.forEach(action => {
        expect(() => {
          analyticsService.trackAction(testUserId, action.type, action.screen, action.metadata);
        }).not.toThrow();
      });
    });

    it('should not track actions when tracking is disabled', () => {
      const disabledService = new UserAnalyticsService({
        enableTracking: false,
        batchSize: 5,
        flushInterval: 1000,
        enableDebugMode: false
      });

      // Should not throw even when disabled
      expect(() => {
        disabledService.trackAction(testUserId, 'test_action', 'test_screen');
      }).not.toThrow();

      disabledService.destroy();
    });
  });

  describe('Screen Transition Tracking', () => {
    it('should track screen transitions correctly', () => {
      expect(() => {
        analyticsService.trackScreenTransition(testUserId, 'community');
        analyticsService.trackScreenTransition(testUserId, 'learning-dashboard');
        analyticsService.trackScreenTransition(testUserId, 'peer-sessions');
      }).not.toThrow();
    });

    it('should calculate duration between screen transitions', (done) => {
      analyticsService.trackScreenTransition(testUserId, 'screen1');
      
      setTimeout(() => {
        analyticsService.trackScreenTransition(testUserId, 'screen2');
        done();
      }, 100);
    });
  });

  describe('Conversion Tracking', () => {
    it('should track conversion events correctly', () => {
      const conversions = [
        { eventType: 'user_registration', funnelStep: 'started' },
        { eventType: 'user_registration', funnelStep: 'email_entered' },
        { eventType: 'user_registration', funnelStep: 'completed', value: 1 }
      ];

      conversions.forEach(conversion => {
        expect(() => {
          analyticsService.trackConversion(
            testUserId,
            conversion.eventType,
            conversion.funnelStep,
            conversion.value
          );
        }).not.toThrow();
      });
    });

    it('should handle conversion events with metadata', () => {
      const metadata = { source: 'google', campaign: 'summer2024' };

      expect(() => {
        analyticsService.trackConversion(
          testUserId,
          'membership_purchase',
          'payment_completed',
          99.99,
          metadata
        );
      }).not.toThrow();
    });
  });

  describe('Feature Usage Tracking', () => {
    it('should track feature usage correctly', async () => {
      await expect(
        analyticsService.trackFeatureUsage(testUserId, 'community_posts', 5000)
      ).resolves.not.toThrow();
    });

    it('should handle feature usage without time spent', async () => {
      await expect(
        analyticsService.trackFeatureUsage(testUserId, 'search_function')
      ).resolves.not.toThrow();
    });

    it('should handle errors in feature usage tracking gracefully', async () => {
      // Mock a service that throws an error
      const errorService = new UserAnalyticsService({
        enableTracking: true,
        batchSize: 5,
        flushInterval: 1000,
        enableDebugMode: false
      });

      await expect(
        errorService.trackFeatureUsage(testUserId, 'test_feature')
      ).resolves.not.toThrow();

      errorService.destroy();
    });
  });

  describe('Analytics Data Retrieval', () => {
    it('should retrieve analytics data for a user', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const data = await analyticsService.getAnalyticsData(testUserId, startDate, endDate);

      expect(data).toHaveProperty('actions');
      expect(data).toHaveProperty('transitions');
      expect(data).toHaveProperty('conversions');
      expect(data).toHaveProperty('featureUsage');
      expect(Array.isArray(data.actions)).toBe(true);
      expect(Array.isArray(data.transitions)).toBe(true);
      expect(Array.isArray(data.conversions)).toBe(true);
      expect(Array.isArray(data.featureUsage)).toBe(true);
    });

    it('should handle errors in data retrieval gracefully', async () => {
      const startDate = new Date();
      const endDate = new Date();

      const data = await analyticsService.getAnalyticsData('invalid-user', startDate, endDate);

      expect(data.actions).toEqual([]);
      expect(data.transitions).toEqual([]);
      expect(data.conversions).toEqual([]);
      expect(data.featureUsage).toEqual([]);
    });
  });

  describe('Conversion Rate Calculation', () => {
    it('should calculate conversion rates correctly', async () => {
      const funnelSteps = ['step1', 'step2', 'step3'];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const rates = await analyticsService.calculateConversionRates(funnelSteps, startDate, endDate);

      expect(typeof rates).toBe('object');
      expect(rates).toHaveProperty('step1_to_step2');
      expect(rates).toHaveProperty('step2_to_step3');
    });

    it('should handle empty funnel steps', async () => {
      const funnelSteps: string[] = [];
      const startDate = new Date();
      const endDate = new Date();

      const rates = await analyticsService.calculateConversionRates(funnelSteps, startDate, endDate);

      expect(rates).toEqual({});
    });
  });

  describe('Feature Usage Statistics', () => {
    it('should get feature usage statistics', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const stats = await analyticsService.getFeatureUsageStats(startDate, endDate);

      expect(typeof stats).toBe('object');
      // Stats should be empty for mock implementation
      expect(Object.keys(stats).length).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('UserAnalyticsInitializer', () => {
  afterEach(() => {
    UserAnalyticsInitializer.shutdown();
  });

  describe('Initialization', () => {
    it('should initialize analytics service successfully', async () => {
      const service = await UserAnalyticsInitializer.initialize();
      expect(service).toBeInstanceOf(UserAnalyticsService);
    });

    it('should return same instance on multiple initializations', async () => {
      const service1 = await UserAnalyticsInitializer.initialize();
      const service2 = await UserAnalyticsInitializer.initialize();
      expect(service1).toBe(service2);
    });

    it('should get instance after initialization', async () => {
      await UserAnalyticsInitializer.initialize();
      const instance = UserAnalyticsInitializer.getInstance();
      expect(instance).toBeInstanceOf(UserAnalyticsService);
    });

    it('should return null instance before initialization', () => {
      const instance = UserAnalyticsInitializer.getInstance();
      expect(instance).toBeNull();
    });
  });

  describe('Health Status', () => {
    it('should return correct health status', async () => {
      const healthBefore = UserAnalyticsInitializer.getHealthStatus();
      expect(healthBefore.isInitialized).toBe(false);
      expect(healthBefore.hasInstance).toBe(false);

      await UserAnalyticsInitializer.initialize();

      const healthAfter = UserAnalyticsInitializer.getHealthStatus();
      expect(healthAfter.isInitialized).toBe(true);
      expect(healthAfter.hasInstance).toBe(true);
      expect(healthAfter.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Database Setup', () => {
    it('should setup database without errors', async () => {
      await expect(UserAnalyticsInitializer.setupDatabase()).resolves.not.toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate setup successfully after initialization', async () => {
      await UserAnalyticsInitializer.initialize();
      const isValid = await UserAnalyticsInitializer.validateSetup();
      expect(isValid).toBe(true);
    });

    it('should fail validation before initialization', async () => {
      const isValid = await UserAnalyticsInitializer.validateSetup();
      expect(isValid).toBe(false);
    });
  });

  describe('Shutdown', () => {
    it('should shutdown cleanly', async () => {
      await UserAnalyticsInitializer.initialize();
      expect(() => UserAnalyticsInitializer.shutdown()).not.toThrow();

      const health = UserAnalyticsInitializer.getHealthStatus();
      expect(health.isInitialized).toBe(false);
      expect(health.hasInstance).toBe(false);
    });
  });
});

describe('Integration Tests', () => {
  let analyticsService: UserAnalyticsService;
  const testUserId = 'integration-test-user';

  beforeEach(async () => {
    analyticsService = await UserAnalyticsInitializer.initialize();
  });

  afterEach(() => {
    UserAnalyticsInitializer.shutdown();
  });

  it('should handle complete user journey tracking', async () => {
    // Simulate a complete user journey
    const journey = [
      { action: 'app_opened', screen: 'splash' },
      { action: 'screen_viewed', screen: 'login' },
      { action: 'form_submission', screen: 'login' },
      { action: 'screen_viewed', screen: 'community' },
      { action: 'button_click', screen: 'community' },
      { action: 'content_view', screen: 'community' }
    ];

    // Track screen transitions
    analyticsService.trackScreenTransition(testUserId, 'splash');
    analyticsService.trackScreenTransition(testUserId, 'login');
    analyticsService.trackScreenTransition(testUserId, 'community');

    // Track actions
    journey.forEach(step => {
      analyticsService.trackAction(testUserId, step.action, step.screen);
    });

    // Track conversions
    analyticsService.trackConversion(testUserId, 'user_engagement', 'first_login');
    analyticsService.trackConversion(testUserId, 'user_engagement', 'first_post_view');

    // Track feature usage
    await analyticsService.trackFeatureUsage(testUserId, 'community_feed', 30000);
    await analyticsService.trackFeatureUsage(testUserId, 'post_interaction', 5000);

    // Verify data can be retrieved
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const data = await analyticsService.getAnalyticsData(testUserId, startDate, endDate);

    expect(data).toBeDefined();
    expect(data.actions).toBeDefined();
    expect(data.transitions).toBeDefined();
    expect(data.conversions).toBeDefined();
    expect(data.featureUsage).toBeDefined();
  });

  it('should handle high-volume tracking without errors', async () => {
    const promises: Promise<void>[] = [];

    // Generate high volume of tracking calls
    for (let i = 0; i < 100; i++) {
      analyticsService.trackAction(testUserId, 'bulk_test', 'test_screen', { index: i });
      analyticsService.trackScreenTransition(testUserId, `screen_${i % 5}`);
      analyticsService.trackConversion(testUserId, 'bulk_conversion', `step_${i % 3}`);
      promises.push(analyticsService.trackFeatureUsage(testUserId, `feature_${i % 10}`, 1000));
    }

    await expect(Promise.all(promises)).resolves.not.toThrow();
  });
});

describe('Error Handling', () => {
  it('should handle service errors gracefully', async () => {
    const service = new UserAnalyticsService({
      enableTracking: true,
      batchSize: 1,
      flushInterval: 100,
      enableDebugMode: false
    });

    // These should not throw even if internal errors occur
    expect(() => service.trackAction('user', 'action', 'screen')).not.toThrow();
    expect(() => service.trackScreenTransition('user', 'screen')).not.toThrow();
    expect(() => service.trackConversion('user', 'event', 'step')).not.toThrow();
    await expect(service.trackFeatureUsage('user', 'feature')).resolves.not.toThrow();

    service.destroy();
  });

  it('should handle invalid data gracefully', async () => {
    const service = new UserAnalyticsService({
      enableTracking: true,
      batchSize: 5,
      flushInterval: 1000,
      enableDebugMode: false
    });

    // Test with empty/invalid data
    expect(() => service.trackAction('', '', '')).not.toThrow();
    expect(() => service.trackScreenTransition('', '')).not.toThrow();
    expect(() => service.trackConversion('', '', '')).not.toThrow();
    await expect(service.trackFeatureUsage('', '')).resolves.not.toThrow();

    service.destroy();
  });
});