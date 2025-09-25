/**
 * useUserAnalytics Hook
 * React hook for easy integration of user analytics tracking
 */

import { useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import UserAnalyticsInitializer from '../services/userAnalyticsInitializer';
import UserAnalyticsService from '../services/userAnalyticsService';

interface UseUserAnalyticsOptions {
  screenName: string;
  userId?: string;
  enableAutoTracking?: boolean;
}

interface UseUserAnalyticsReturn {
  trackAction: (actionType: string, metadata?: Record<string, any>) => void;
  trackConversion: (eventType: string, funnelStep: string, value?: number, metadata?: Record<string, any>) => void;
  trackFeatureUsage: (featureName: string, timeSpent?: number) => Promise<void>;
  isAnalyticsEnabled: boolean;
}

export const useUserAnalytics = (options: UseUserAnalyticsOptions): UseUserAnalyticsReturn => {
  const {
    screenName,
    userId,
    enableAutoTracking = true
  } = options;

  const analyticsService = useRef<UserAnalyticsService | null>(null);
  const screenStartTime = useRef<Date | null>(null);
  const isAnalyticsEnabled = useRef<boolean>(false);

  // Initialize analytics service
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        analyticsService.current = await UserAnalyticsInitializer.initialize();
        isAnalyticsEnabled.current = true;
      } catch (error) {
        console.error('[useUserAnalytics] Failed to initialize analytics:', error);
        isAnalyticsEnabled.current = false;
      }
    };

    initializeAnalytics();
  }, []);

  // Track screen focus/blur for automatic screen transition tracking
  useFocusEffect(
    useCallback(() => {
      if (!enableAutoTracking || !analyticsService.current || !userId) {
        return;
      }

      // Track screen entry
      screenStartTime.current = new Date();
      analyticsService.current.trackScreenTransition(userId, screenName);

      return () => {
        // Track screen exit time when component loses focus
        if (screenStartTime.current) {
          const timeSpent = new Date().getTime() - screenStartTime.current.getTime();
          analyticsService.current?.trackFeatureUsage(userId, `screen_${screenName}`, timeSpent);
        }
      };
    }, [screenName, userId, enableAutoTracking])
  );

  /**
   * Track user actions
   */
  const trackAction = useCallback((
    actionType: string,
    metadata?: Record<string, any>
  ) => {
    if (!analyticsService.current || !userId || !isAnalyticsEnabled.current) {
      return;
    }

    analyticsService.current.trackAction(userId, actionType, screenName, metadata);
  }, [userId, screenName]);

  /**
   * Track conversion events
   */
  const trackConversion = useCallback((
    eventType: string,
    funnelStep: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    if (!analyticsService.current || !userId || !isAnalyticsEnabled.current) {
      return;
    }

    analyticsService.current.trackConversion(userId, eventType, funnelStep, value, metadata);
  }, [userId]);

  /**
   * Track feature usage
   */
  const trackFeatureUsage = useCallback(async (
    featureName: string,
    timeSpent?: number
  ) => {
    if (!analyticsService.current || !userId || !isAnalyticsEnabled.current) {
      return;
    }

    await analyticsService.current.trackFeatureUsage(userId, featureName, timeSpent);
  }, [userId]);

  return {
    trackAction,
    trackConversion,
    trackFeatureUsage,
    isAnalyticsEnabled: isAnalyticsEnabled.current
  };
};

/**
 * Hook for tracking specific user actions with predefined types
 */
export const useActionTracking = (screenName: string, userId?: string) => {
  const { trackAction } = useUserAnalytics({ screenName, userId, enableAutoTracking: false });

  return {
    trackButtonClick: (buttonName: string, metadata?: Record<string, any>) => {
      trackAction('button_click', { buttonName, ...metadata });
    },
    
    trackFormSubmission: (formName: string, success: boolean, metadata?: Record<string, any>) => {
      trackAction('form_submission', { formName, success, ...metadata });
    },
    
    trackSearch: (query: string, resultsCount: number, metadata?: Record<string, any>) => {
      trackAction('search', { query, resultsCount, ...metadata });
    },
    
    trackContentView: (contentType: string, contentId: string, metadata?: Record<string, any>) => {
      trackAction('content_view', { contentType, contentId, ...metadata });
    },
    
    trackShare: (contentType: string, platform: string, metadata?: Record<string, any>) => {
      trackAction('share', { contentType, platform, ...metadata });
    },
    
    trackError: (errorType: string, errorMessage: string, metadata?: Record<string, any>) => {
      trackAction('error', { errorType, errorMessage, ...metadata });
    }
  };
};

/**
 * Hook for tracking conversion funnels
 */
export const useConversionTracking = (userId?: string) => {
  const { trackConversion } = useUserAnalytics({ screenName: 'conversion', userId, enableAutoTracking: false });

  return {
    trackRegistrationFunnel: (step: 'started' | 'email_entered' | 'password_created' | 'completed', metadata?: Record<string, any>) => {
      trackConversion('user_registration', step, undefined, metadata);
    },
    
    trackMembershipFunnel: (step: 'viewed_plans' | 'selected_plan' | 'payment_started' | 'payment_completed', value?: number, metadata?: Record<string, any>) => {
      trackConversion('membership_purchase', step, value, metadata);
    },
    
    trackOnboardingFunnel: (step: 'started' | 'profile_completed' | 'preferences_set' | 'completed', metadata?: Record<string, any>) => {
      trackConversion('user_onboarding', step, undefined, metadata);
    },
    
    trackEngagementFunnel: (step: 'first_post' | 'first_comment' | 'first_like' | 'first_group_join', metadata?: Record<string, any>) => {
      trackConversion('user_engagement', step, undefined, metadata);
    }
  };
};

/**
 * Hook for tracking feature usage with timing
 */
export const useFeatureTracking = (userId?: string) => {
  const { trackFeatureUsage } = useUserAnalytics({ screenName: 'feature', userId, enableAutoTracking: false });
  const featureStartTimes = useRef<Record<string, Date>>({});

  return {
    startFeatureTimer: (featureName: string) => {
      featureStartTimes.current[featureName] = new Date();
    },
    
    endFeatureTimer: async (featureName: string, metadata?: Record<string, any>) => {
      const startTime = featureStartTimes.current[featureName];
      if (startTime) {
        const timeSpent = new Date().getTime() - startTime.getTime();
        await trackFeatureUsage(featureName, timeSpent);
        delete featureStartTimes.current[featureName];
      }
    },
    
    trackFeatureUsageInstant: async (featureName: string, metadata?: Record<string, any>) => {
      await trackFeatureUsage(featureName, 0);
    }
  };
};

export default useUserAnalytics;