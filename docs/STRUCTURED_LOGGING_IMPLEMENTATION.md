# Structured Logging System Implementation

## Overview

The Structured Logging System for PeerLearningHub provides comprehensive, JSON-formatted logging with efficient search and filtering capabilities. This implementation fulfills the requirements for task 4.4 "構造化ログシステムの実装" (Structured Logging System Implementation).

## Features

### ✅ JSON Format Structured Logging
- All logs are stored in standardized JSON format
- Consistent structure across all log entries
- Structured data for easy parsing and analysis

### ✅ Log Levels (ERROR, WARN, INFO, DEBUG)
- Four standard log levels with appropriate filtering
- Environment-based default log level configuration
- Runtime log level adjustment capability

### ✅ Efficient Search and Filtering
- Advanced search by level, category, time range, user ID, source, and tags
- Text search across message, context, and metadata
- High-performance filtering with configurable limits

### ✅ Additional Capabilities
- Specialized logging methods for authentication, community, performance, and API events
- Automatic error tracking with stack traces
- Performance measurement utilities
- User context tracking
- Automatic log cleanup and retention management
- Export functionality for debugging and analysis

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Structured Logging System                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ LoggingService  │  │ LoggingInit.    │  │ Dashboard    │ │
│  │                 │  │                 │  │              │ │
│  │ • Core logging  │  │ • Initialization│  │ • UI for     │ │
│  │ • Search/Filter │  │ • Error handlers│  │   viewing    │ │
│  │ • Statistics    │  │ • User context  │  │ • Search     │ │
│  │ • Export        │  │ • Cleanup       │  │ • Statistics │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│           │                     │                    │      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Hook            │  │ Configuration   │  │ AsyncStorage │ │
│  │                 │  │                 │  │              │ │
│  │ • Easy access   │  │ • Log levels    │  │ • Local      │ │
│  │ • Performance   │  │ • Categories    │  │   storage    │ │
│  │ • Context       │  │ • Retention     │  │ • Persistence│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Core Components

#### 1. StructuredLoggingService (`services/loggingService.ts`)
- **Purpose**: Main logging service with comprehensive functionality
- **Key Methods**:
  - `error()`, `warn()`, `info()`, `debug()` - Standard logging methods
  - `logAuth()` - Authentication event logging
  - `logCommunity()` - Community activity logging
  - `logPerformance()` - Performance metrics logging
  - `logApiRequest()` - API request/response logging
  - `searchLogs()` - Advanced log search and filtering
  - `getLogStatistics()` - Log analytics and statistics
  - `exportLogs()` - Export logs for analysis

#### 2. LoggingInitializer (`services/loggingInitializer.ts`)
- **Purpose**: System initialization and configuration
- **Key Features**:
  - Environment-based log level configuration
  - Global error handler setup
  - Periodic cleanup scheduling
  - User context management

#### 3. LoggingDashboard (`components/LoggingDashboard.tsx`)
- **Purpose**: React component for log viewing and management
- **Features**:
  - Real-time log viewing
  - Advanced search and filtering UI
  - Log statistics dashboard
  - Export functionality
  - Log management (clear, cleanup)

#### 4. useStructuredLogging Hook (`hooks/useStructuredLogging.ts`)
- **Purpose**: Easy integration for React components
- **Features**:
  - Simplified logging methods
  - Performance measurement utilities
  - Automatic source context
  - TypeScript support

### Data Structure

#### StructuredLogEntry
```typescript
interface StructuredLogEntry {
  timestamp: string;        // ISO 8601 format
  level: LogLevel;         // ERROR | WARN | INFO | DEBUG
  category: LogCategory;   // auth | community | system | etc.
  message: string;         // Human-readable message
  context?: {              // Contextual information
    userId?: string;
    sessionId?: string;
    requestId?: string;
    source?: string;
    action?: string;
    [key: string]: any;
  };
  metadata?: {             // Technical metadata
    duration?: number;
    statusCode?: number;
    errorCode?: string;
    stackTrace?: string;
    [key: string]: any;
  };
  tags?: string[];         // Searchable tags
}
```

### Log Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `auth` | Authentication events | Login, logout, registration |
| `community` | Community activities | Posts, comments, likes |
| `external_systems` | External integrations | API calls, third-party services |
| `membership` | Membership operations | Purchases, upgrades, renewals |
| `performance` | Performance metrics | Response times, load times |
| `security` | Security events | Failed logins, suspicious activity |
| `system` | System operations | Startup, shutdown, errors |
| `ui` | User interface events | Navigation, interactions |
| `database` | Database operations | Queries, migrations |
| `api` | API requests/responses | HTTP requests, responses |

### Configuration

Configuration is stored in `config/logging.json`:

```json
{
  "logLevel": "INFO",
  "maxLocalLogs": 2000,
  "logRetentionDays": 30,
  "enableConsoleOutput": true,
  "categories": {
    "auth": { "enabled": true, "level": "INFO" },
    "community": { "enabled": true, "level": "INFO" },
    "system": { "enabled": true, "level": "INFO" }
  },
  "filters": {
    "excludePatterns": ["debug_noise"],
    "sensitiveFields": ["password", "token", "apiKey"]
  }
}
```

## Usage Examples

### Basic Logging
```typescript
import { useStructuredLogging } from '../hooks/useStructuredLogging';

const MyComponent = () => {
  const { logInfo, logError } = useStructuredLogging('MyComponent');

  const handleAction = async () => {
    try {
      logInfo('ui', 'User clicked action button');
      // ... perform action
      logInfo('ui', 'Action completed successfully');
    } catch (error) {
      logError('ui', 'Action failed', error);
    }
  };
};
```

### Authentication Logging
```typescript
const { logAuth } = useStructuredLogging('AuthService');

// Successful login
logAuth('login', true, {
  userId: 'user_123',
  email: 'user@example.com',
  method: 'email_password',
  duration: 150
});

// Failed login
logAuth('login', false, {
  email: 'user@example.com',
  method: 'email_password',
  error: new Error('Invalid credentials')
});
```

### Performance Logging
```typescript
const { measurePerformance } = usePerformanceLogging('ApiService');

const fetchData = async (id: string) => {
  return await measurePerformance('fetch_user_data', async () => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  });
};
```

### Search and Filtering
```typescript
const loggingService = StructuredLoggingService.getInstance();

// Search for error logs in the last hour
const errorLogs = await loggingService.searchLogs({
  level: 'ERROR',
  startTime: new Date(Date.now() - 60 * 60 * 1000),
  endTime: new Date()
}, 50);

// Search by user ID
const userLogs = await loggingService.searchLogs({
  userId: 'user_123'
}, 100);

// Text search
const searchResults = await loggingService.searchLogs({
  searchText: 'authentication failed'
}, 25);
```

## Integration Guide

### 1. Initialize Logging System

In your main App component:

```typescript
import LoggingInitializer from './services/loggingInitializer';

const App = () => {
  useEffect(() => {
    const initializeLogging = async () => {
      const loggingInitializer = LoggingInitializer.getInstance();
      await loggingInitializer.initialize();
    };
    
    initializeLogging();
  }, []);
  
  // ... rest of app
};
```

### 2. Set User Context

When user logs in:

```typescript
const loggingInitializer = LoggingInitializer.getInstance();
loggingInitializer.setUserContext(user.id);
```

### 3. Add Logging Dashboard

For admin users:

```typescript
import LoggingDashboard from './components/LoggingDashboard';

const AdminPanel = () => {
  const [showLogs, setShowLogs] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowLogs(true)}>
        View Logs
      </button>
      
      <LoggingDashboard 
        visible={showLogs}
        onClose={() => setShowLogs(false)}
      />
    </div>
  );
};
```

## Performance Considerations

### Storage Management
- **Local Storage**: Uses AsyncStorage for persistence
- **Retention**: Automatic cleanup of logs older than 30 days
- **Size Limits**: Configurable maximum number of stored logs (default: 2000)
- **Compression**: JSON format provides good compression ratio

### Search Performance
- **Indexing**: Logs are sorted by timestamp for efficient time-based queries
- **Filtering**: Client-side filtering with configurable result limits
- **Caching**: Recent searches can be cached for improved performance

### Memory Usage
- **Lazy Loading**: Logs are loaded on-demand
- **Batch Processing**: Large operations are processed in batches
- **Cleanup**: Automatic memory cleanup and garbage collection

## Security Considerations

### Data Protection
- **Sensitive Data**: Automatic filtering of sensitive fields (passwords, tokens)
- **User Privacy**: Optional user ID anonymization
- **Local Storage**: Logs stored locally, not transmitted by default

### Access Control
- **Admin Only**: Logging dashboard restricted to admin users
- **Audit Trail**: All log access is logged for security auditing
- **Export Control**: Log export requires appropriate permissions

## Monitoring and Alerting

### Log Statistics
- **Error Rate**: Percentage of ERROR level logs
- **Performance Metrics**: Average response times and durations
- **User Activity**: Active users and session statistics
- **System Health**: Overall application health indicators

### Alert Conditions
- **High Error Rate**: Alert when error rate exceeds threshold
- **Performance Degradation**: Alert on slow response times
- **Security Events**: Alert on suspicious activities
- **System Issues**: Alert on critical system errors

## Testing

### Test Coverage
- **Unit Tests**: Core logging functionality
- **Integration Tests**: End-to-end logging workflows
- **Performance Tests**: Search and filtering performance
- **UI Tests**: Dashboard component functionality

### Test Scripts
```bash
# Run validation
npm run logging:validate

# Run simple tests
node scripts/testStructuredLoggingSimple.js

# Run full test suite (when Jest is configured)
npm run logging:test
```

## Maintenance

### Regular Tasks
- **Log Cleanup**: Automatic cleanup runs daily
- **Performance Monitoring**: Weekly performance reviews
- **Configuration Updates**: Quarterly configuration reviews
- **Security Audits**: Monthly security reviews

### Troubleshooting
- **High Storage Usage**: Reduce retention period or log levels
- **Poor Performance**: Optimize search queries or reduce log volume
- **Missing Logs**: Check log level configuration and filters
- **Export Issues**: Verify permissions and storage availability

## Future Enhancements

### Planned Features
- **Remote Logging**: Integration with external logging services
- **Real-time Monitoring**: Live log streaming and alerts
- **Advanced Analytics**: Machine learning-based log analysis
- **Custom Dashboards**: User-configurable dashboard layouts

### Integration Opportunities
- **Error Tracking**: Integration with Sentry or Bugsnag
- **Analytics**: Integration with application analytics platforms
- **Monitoring**: Integration with APM (Application Performance Monitoring) tools
- **Alerting**: Integration with notification services

## Conclusion

The Structured Logging System provides a comprehensive, efficient, and user-friendly solution for logging in PeerLearningHub. It meets all requirements for JSON formatting, log levels, and search/filtering capabilities while providing additional features for enhanced debugging, monitoring, and analysis.

The system is designed to be:
- **Scalable**: Handles large volumes of logs efficiently
- **Maintainable**: Clean architecture and comprehensive documentation
- **Extensible**: Easy to add new features and integrations
- **Secure**: Protects sensitive data and provides access controls
- **User-friendly**: Intuitive dashboard and easy-to-use APIs

This implementation ensures that the PeerLearningHub application has robust logging capabilities that will support both development and production operations effectively.