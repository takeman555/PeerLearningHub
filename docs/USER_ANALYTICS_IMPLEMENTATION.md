# User Analytics System Implementation Guide

## Overview

The User Analytics System tracks user behavior, screen transitions, and conversion metrics to provide insights into app usage patterns and user engagement.

## Architecture

### Core Components

1. **UserAnalyticsService** - Main service for tracking analytics events
2. **UserAnalyticsInitializer** - Handles system initialization and configuration
3. **useUserAnalytics Hook** - React hook for easy component integration
4. **UserAnalyticsDashboard** - Admin dashboard for viewing analytics data
5. **Database Tables** - Supabase tables for storing analytics data

### Database Schema

```sql
-- User actions tracking
user_actions (
  id, user_id, action_type, screen_name, timestamp, metadata
)

-- Screen navigation tracking
screen_transitions (
  id, user_id, from_screen, to_screen, timestamp, duration
)

-- Conversion funnel tracking
conversion_events (
  id, user_id, event_type, funnel_step, timestamp, value, metadata
)

-- Feature usage statistics
feature_usage (
  id, user_id, feature_name, usage_count, last_used, total_time_spent
)
```

## Implementation Steps

### 1. Database Setup

Run the migration to create analytics tables:

```bash
# Apply the analytics migration
psql -f supabase/migrations/012_create_user_analytics_tables.sql

# Or use Supabase CLI
supabase db push
```

### 2. Initialize Analytics System

Add to your app's main entry point:

```typescript
// App.tsx or _layout.tsx
import UserAnalyticsInitializer from './services/userAnalyticsInitializer';

export default function App() {
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        await UserAnalyticsInitializer.initialize();
        console.log('Analytics system initialized');
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      }
    };

    initAnalytics();
  }, []);

  return (
    // Your app content
  );
}
```

### 3. Track User Actions in Components

```typescript
// In your React components
import { useUserAnalytics, useActionTracking } from '../hooks/useUserAnalytics';

function CommunityScreen() {
  const { user } = useAuth();
  const analytics = useUserAnalytics({
    screenName: 'community',
    userId: user?.id,
    enableAutoTracking: true
  });

  const actionTracking = useActionTracking('community', user?.id);

  const handleCreatePost = () => {
    // Track button click
    actionTracking.trackButtonClick('create_post', {
      postType: 'text',
      hasImage: false
    });

    // Your post creation logic
    createPost();
  };

  const handleSearch = (query: string, results: number) => {
    // Track search action
    actionTracking.trackSearch(query, results, {
      searchType: 'posts',
      filters: ['recent']
    });
  };

  return (
    <View>
      <Button onPress={handleCreatePost} title="Create Post" />
      {/* Other components */}
    </View>
  );
}
```

### 4. Track Conversion Funnels

```typescript
// Track user registration funnel
import { useConversionTracking } from '../hooks/useUserAnalytics';

function RegistrationFlow() {
  const { user } = useAuth();
  const conversionTracking = useConversionTracking(user?.id);

  const handleRegistrationStart = () => {
    conversionTracking.trackRegistrationFunnel('started');
  };

  const handleEmailEntered = (email: string) => {
    conversionTracking.trackRegistrationFunnel('email_entered', {
      emailDomain: email.split('@')[1]
    });
  };

  const handleRegistrationComplete = () => {
    conversionTracking.trackRegistrationFunnel('completed', {
      registrationMethod: 'email',
      timeToComplete: Date.now() - startTime
    });
  };

  // Component implementation
}
```

### 5. Track Feature Usage with Timing

```typescript
// Track feature usage with timing
import { useFeatureTracking } from '../hooks/useUserAnalytics';

function VideoPlayerComponent() {
  const { user } = useAuth();
  const featureTracking = useFeatureTracking(user?.id);

  const handleVideoStart = () => {
    featureTracking.startFeatureTimer('video_player');
  };

  const handleVideoEnd = () => {
    featureTracking.endFeatureTimer('video_player', {
      videoId: 'video_123',
      completionRate: 100
    });
  };

  // Component implementation
}
```

### 6. Admin Dashboard Integration

```typescript
// Add to admin panel
import UserAnalyticsDashboard from '../components/UserAnalyticsDashboard';

function AdminAnalyticsPage() {
  const dateRange = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  };

  return (
    <UserAnalyticsDashboard 
      dateRange={dateRange}
      refreshInterval={60000} // 1 minute
    />
  );
}
```

## Configuration

### Environment Variables

```bash
# .env
EXPO_PUBLIC_ANALYTICS_ENABLED=true
EXPO_PUBLIC_ANALYTICS_BATCH_SIZE=10
EXPO_PUBLIC_ANALYTICS_FLUSH_INTERVAL=30000
```

### Analytics Configuration

```typescript
// Custom configuration
const analyticsConfig = {
  enableTracking: true,
  batchSize: 20,           // Number of events to batch before sending
  flushInterval: 60000,    // Flush interval in milliseconds
  enableDebugMode: false   // Enable debug logging
};
```

## Analytics Events Reference

### Action Types

- `button_click` - User clicked a button
- `form_submission` - User submitted a form
- `content_view` - User viewed content
- `search` - User performed a search
- `share` - User shared content
- `error` - An error occurred

### Conversion Funnels

#### User Registration
1. `registration_started`
2. `email_entered`
3. `password_created`
4. `registration_completed`

#### Membership Purchase
1. `viewed_plans`
2. `selected_plan`
3. `payment_started`
4. `payment_completed`

#### User Engagement
1. `first_login`
2. `first_post`
3. `first_comment`
4. `first_group_join`

### Feature Names

- `community_feed` - Community posts feed
- `search_function` - Search functionality
- `video_player` - Video player usage
- `chat_system` - Chat/messaging
- `profile_editing` - Profile management
- `settings_management` - App settings

## Data Analysis Queries

### Top User Actions (Last 7 Days)

```sql
SELECT 
  action_type,
  COUNT(*) as action_count,
  COUNT(DISTINCT user_id) as unique_users
FROM user_actions 
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY action_type
ORDER BY action_count DESC;
```

### Screen Navigation Patterns

```sql
SELECT 
  from_screen,
  to_screen,
  COUNT(*) as transition_count,
  AVG(duration) as avg_duration_ms
FROM screen_transitions 
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY from_screen, to_screen
ORDER BY transition_count DESC;
```

### Conversion Rates

```sql
SELECT * FROM get_conversion_rates(
  NOW() - INTERVAL '30 days',
  NOW(),
  ARRAY['registration_started', 'email_entered', 'registration_completed']
);
```

### Feature Usage Statistics

```sql
SELECT * FROM get_feature_usage_stats(
  NOW() - INTERVAL '30 days',
  NOW()
);
```

## Performance Considerations

### Batch Processing
- Events are batched to reduce database load
- Configurable batch size and flush interval
- Automatic flushing on app background/foreground

### Data Retention
- Consider implementing data retention policies
- Archive old analytics data to reduce query times
- Use database partitioning for large datasets

### Privacy Compliance
- All analytics data is tied to user IDs
- Implement data deletion for user account deletion
- Consider anonymization for long-term analytics

## Monitoring and Alerts

### Key Metrics to Monitor
- Analytics system health
- Data ingestion rates
- Query performance
- Error rates

### Setup Alerts
- High error rates in analytics ingestion
- Unusual spikes in user activity
- Performance degradation in queries

## Testing

### Setup Test Environment

```bash
# Run analytics setup
node scripts/setupUserAnalytics.js

# Validate analytics system
node scripts/validateUserAnalytics.js

# Run tests
npm test -- userAnalyticsSystem.test.ts
```

### Test Data Generation

```typescript
// Generate test analytics data
const testUser = 'test-user-123';

// Track various events
analytics.trackAction(testUser, 'button_click', 'community');
analytics.trackScreenTransition(testUser, 'community');
analytics.trackConversion(testUser, 'engagement', 'first_post');
await analytics.trackFeatureUsage(testUser, 'community_feed', 5000);
```

## Troubleshooting

### Common Issues

1. **Analytics not tracking**
   - Check if analytics is enabled in configuration
   - Verify user ID is provided
   - Check network connectivity

2. **Performance issues**
   - Reduce batch size
   - Increase flush interval
   - Check database indexes

3. **Data not appearing in dashboard**
   - Verify database permissions
   - Check RLS policies
   - Ensure data is being flushed

### Debug Mode

Enable debug mode to see detailed logging:

```typescript
const config = {
  enableTracking: true,
  enableDebugMode: true,
  // other config
};
```

## Security

### Row Level Security (RLS)
- Users can only access their own analytics data
- Admins can access all analytics data
- Service role can insert/update analytics data

### Data Privacy
- No personally identifiable information in metadata
- User consent for analytics tracking
- Data anonymization options

## Future Enhancements

### Planned Features
- Real-time analytics dashboard
- Custom event tracking
- A/B testing integration
- Cohort analysis
- Predictive analytics

### Integration Opportunities
- External analytics services (Google Analytics, Mixpanel)
- Business intelligence tools
- Machine learning for user behavior prediction

## Support

For issues or questions about the analytics system:

1. Check the troubleshooting section
2. Review the test files for examples
3. Run the validation script
4. Check the database logs for errors

## API Reference

### UserAnalyticsService Methods

```typescript
// Track user action
trackAction(userId: string, actionType: string, screenName: string, metadata?: object): void

// Track screen transition
trackScreenTransition(userId: string, toScreen: string): void

// Track conversion event
trackConversion(userId: string, eventType: string, funnelStep: string, value?: number, metadata?: object): void

// Track feature usage
trackFeatureUsage(userId: string, featureName: string, timeSpent?: number): Promise<void>

// Get analytics data
getAnalyticsData(userId: string, startDate: Date, endDate: Date): Promise<AnalyticsData>

// Calculate conversion rates
calculateConversionRates(funnelSteps: string[], startDate: Date, endDate: Date): Promise<Record<string, number>>

// Get feature usage statistics
getFeatureUsageStats(startDate: Date, endDate: Date): Promise<FeatureUsageStats>
```

### Hook Usage

```typescript
// Basic analytics hook
const { trackAction, trackConversion, trackFeatureUsage, isAnalyticsEnabled } = useUserAnalytics({
  screenName: 'community',
  userId: user?.id,
  enableAutoTracking: true
});

// Action tracking hook
const { trackButtonClick, trackFormSubmission, trackSearch, trackContentView, trackShare, trackError } = useActionTracking(screenName, userId);

// Conversion tracking hook
const { trackRegistrationFunnel, trackMembershipFunnel, trackOnboardingFunnel, trackEngagementFunnel } = useConversionTracking(userId);

// Feature tracking hook
const { startFeatureTimer, endFeatureTimer, trackFeatureUsageInstant } = useFeatureTracking(userId);
```