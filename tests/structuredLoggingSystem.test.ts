/**
 * Comprehensive Test Suite for Structured Logging System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import StructuredLoggingService, { LogLevel, LogCategory, LogFilter } from '../services/loggingService';
import LoggingInitializer from '../services/loggingInitializer';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Structured Logging System', () => {
  let loggingService: StructuredLoggingService;
  let loggingInitializer: LoggingInitializer;
  let mockAsyncStorage: jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup AsyncStorage mock
    mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();

    // Get fresh instances
    loggingService = StructuredLoggingService.getInstance();
    loggingInitializer = LoggingInitializer.getInstance();
  });

  describe('StructuredLoggingService', () => {
    describe('Basic Logging', () => {
      test('should log ERROR level messages', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        loggingService.error('system', 'Test error message', {
          context: { userId: 'test_user' },
          metadata: { errorCode: 'TEST_001' },
          tags: ['test', 'error']
        });

        expect(mockAsyncStorage.setItem).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });

      test('should log WARN level messages', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        loggingService.warn('auth', 'Test warning message', {
          context: { source: 'AuthService' },
          tags: ['warning', 'auth']
        });

        expect(mockAsyncStorage.setItem).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });

      test('should log INFO level messages', async () => {
        const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
        
        loggingService.info('community', 'Test info message', {
          context: { postId: 'post_123' },
          metadata: { action: 'create_post' }
        });

        expect(mockAsyncStorage.setItem).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });

      test('should log DEBUG level messages', async () => {
        const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
        
        loggingService.debug('ui', 'Test debug message', {
          context: { component: 'TestComponent' },
          tags: ['debug', 'ui']
        });

        expect(mockAsyncStorage.setItem).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('Specialized Logging Methods', () => {
      test('should log authentication events', async () => {
        loggingService.logAuth('login', true, {
          userId: 'user_123',
          email: 'test@example.com',
          method: 'email_password',
          duration: 150
        });

        expect(mockAsyncStorage.setItem).toHaveBeenCalled();
        
        // Verify the stored data structure
        const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
        expect(setItemCall[0]).toBe('structured_logs');
        
        const storedLogs = JSON.parse(setItemCall[1]);
        expect(storedLogs).toHaveLength(1);
        expect(storedLogs[0]).toMatchObject({
          level: 'INFO',
          category: 'auth',
          message: 'Authentication login succeeded',
          context: {
            userId: 'user_123',
            email: 'test@example.com',
            action: 'login',
            source: 'AuthService'
          },
          metadata: {
            success: true,
            method: 'email_password',
            duration: 150
          }
        });
      });

      test('should log failed authentication events', async () => {
        const testError = new Error('Invalid credentials');
        
        loggingService.logAuth('login', false, {
          email: 'test@example.com',
          method: 'email_password',
          error: testError
        });

        const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
        const storedLogs = JSON.parse(setItemCall[1]);
        
        expect(storedLogs[0]).toMatchObject({
          level: 'ERROR',
          category: 'auth',
          message: 'Authentication login failed',
          metadata: {
            success: false,
            method: 'email_password',
            errorName: 'Error',
            errorMessage: 'Invalid credentials'
          }
        });
      });

      test('should log community events', async () => {
        loggingService.logCommunity('post_create', {
          postId: 'post_123',
          groupId: 'group_456',
          userId: 'user_789',
          duration: 200,
          success: true
        });

        const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
        const storedLogs = JSON.parse(setItemCall[1]);
        
        expect(storedLogs[0]).toMatchObject({
          level: 'INFO',
          category: 'community',
          message: 'Community post_create',
          context: {
            userId: 'user_789',
            postId: 'post_123',
            groupId: 'group_456',
            action: 'post_create',
            source: 'CommunityService'
          },
          metadata: {
            success: true,
            duration: 200
          }
        });
      });

      test('should log performance metrics', async () => {
        loggingService.logPerformance('database_query', 1500, {
          category: 'database',
          success: true,
          metadata: { queryType: 'SELECT', rowCount: 100 }
        });

        const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
        const storedLogs = JSON.parse(setItemCall[1]);
        
        expect(storedLogs[0]).toMatchObject({
          level: 'INFO',
          category: 'database',
          message: 'Performance: database_query',
          context: {
            operation: 'database_query',
            source: 'PerformanceMonitor'
          },
          metadata: {
            duration: 1500,
            success: true,
            queryType: 'SELECT',
            rowCount: 100
          }
        });
      });

      test('should log slow performance with warning level', async () => {
        loggingService.logPerformance('slow_operation', 6000);

        const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
        const storedLogs = JSON.parse(setItemCall[1]);
        
        expect(storedLogs[0].level).toBe('WARN');
        expect(storedLogs[0].metadata.duration).toBe(6000);
      });

      test('should log API requests', async () => {
        loggingService.logApiRequest('POST', '/api/posts', {
          statusCode: 201,
          duration: 300,
          requestId: 'req_123',
          userId: 'user_456'
        });

        const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
        const storedLogs = JSON.parse(setItemCall[1]);
        
        expect(storedLogs[0]).toMatchObject({
          level: 'INFO',
          category: 'api',
          message: 'API POST /api/posts',
          context: {
            method: 'POST',
            url: '/api/posts',
            requestId: 'req_123',
            userId: 'user_456',
            source: 'ApiClient'
          },
          metadata: {
            statusCode: 201,
            duration: 300
          }
        });
      });

      test('should log API errors with appropriate level', async () => {
        const apiError = new Error('Server error');
        
        loggingService.logApiRequest('GET', '/api/data', {
          statusCode: 500,
          duration: 1000,
          error: apiError
        });

        const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
        const storedLogs = JSON.parse(setItemCall[1]);
        
        expect(storedLogs[0].level).toBe('ERROR');
        expect(storedLogs[0].metadata).toMatchObject({
          statusCode: 500,
          duration: 1000,
          errorName: 'Error',
          errorMessage: 'Server error'
        });
      });
    });

    describe('Log Management', () => {
      test('should search logs with filters', async () => {
        // Mock stored logs
        const mockLogs = [
          {
            timestamp: '2023-01-01T10:00:00.000Z',
            level: 'ERROR',
            category: 'auth',
            message: 'Login failed',
            context: { userId: 'user_1' },
            tags: ['auth', 'error']
          },
          {
            timestamp: '2023-01-01T11:00:00.000Z',
            level: 'INFO',
            category: 'community',
            message: 'Post created',
            context: { userId: 'user_2' },
            tags: ['community', 'success']
          }
        ];

        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLogs));

        const filter: LogFilter = {
          level: 'ERROR',
          category: 'auth'
        };

        const results = await loggingService.searchLogs(filter, 10);
        
        expect(results).toHaveLength(1);
        expect(results[0].level).toBe('ERROR');
        expect(results[0].category).toBe('auth');
      });

      test('should search logs by text content', async () => {
        const mockLogs = [
          {
            timestamp: '2023-01-01T10:00:00.000Z',
            level: 'INFO',
            category: 'system',
            message: 'User login successful',
            context: { action: 'login' }
          },
          {
            timestamp: '2023-01-01T11:00:00.000Z',
            level: 'INFO',
            category: 'system',
            message: 'User logout',
            context: { action: 'logout' }
          }
        ];

        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLogs));

        const results = await loggingService.searchLogs({ searchText: 'login' }, 10);
        
        expect(results).toHaveLength(1);
        expect(results[0].message).toContain('login');
      });

      test('should generate log statistics', async () => {
        const mockLogs = [
          { level: 'ERROR', category: 'auth', message: 'Auth error 1', timestamp: '2023-01-01T10:00:00.000Z' },
          { level: 'ERROR', category: 'auth', message: 'Auth error 1', timestamp: '2023-01-01T10:01:00.000Z' },
          { level: 'WARN', category: 'system', message: 'System warning', timestamp: '2023-01-01T10:02:00.000Z' },
          { level: 'INFO', category: 'community', message: 'Community info', timestamp: '2023-01-01T10:03:00.000Z' },
          { level: 'DEBUG', category: 'ui', message: 'UI debug', timestamp: '2023-01-01T10:04:00.000Z' }
        ];

        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLogs));

        const stats = await loggingService.getLogStatistics();
        
        expect(stats.totalLogs).toBe(5);
        expect(stats.logsByLevel.ERROR).toBe(2);
        expect(stats.logsByLevel.WARN).toBe(1);
        expect(stats.logsByLevel.INFO).toBe(1);
        expect(stats.logsByLevel.DEBUG).toBe(1);
        expect(stats.errorRate).toBe(40); // 2 errors out of 5 logs = 40%
        expect(stats.topErrors).toHaveLength(1);
        expect(stats.topErrors[0]).toEqual({ message: 'Auth error 1', count: 2 });
      });

      test('should export logs in JSON format', async () => {
        const mockLogs = [
          {
            timestamp: '2023-01-01T10:00:00.000Z',
            level: 'INFO',
            category: 'system',
            message: 'Test log',
            context: { test: true }
          }
        ];

        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLogs));

        const exportedData = await loggingService.exportLogs();
        const parsedData = JSON.parse(exportedData);
        
        expect(parsedData).toHaveLength(1);
        expect(parsedData[0]).toMatchObject(mockLogs[0]);
      });

      test('should clear all logs', async () => {
        await loggingService.clearLogs();
        
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('structured_logs');
      });
    });

    describe('Log Level Filtering', () => {
      test('should respect log level settings', async () => {
        const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
        
        // Set log level to INFO (should filter out DEBUG)
        loggingService.setLogLevel('INFO');
        
        loggingService.debug('system', 'This should be filtered out');
        loggingService.info('system', 'This should be logged');
        
        // Only INFO level should be stored
        expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(2); // setLogLevel + info log
        
        consoleSpy.mockRestore();
      });
    });

    describe('Error Handling', () => {
      test('should handle AsyncStorage errors gracefully', async () => {
        mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        // Should not throw error
        expect(() => {
          loggingService.info('system', 'Test message');
        }).not.toThrow();
        
        consoleSpy.mockRestore();
      });

      test('should handle malformed stored data', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('invalid json');
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        const logs = await loggingService.searchLogs({}, 10);
        
        expect(logs).toEqual([]);
        consoleSpy.mockRestore();
      });
    });
  });

  describe('LoggingInitializer', () => {
    test('should initialize logging system', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      await loggingInitializer.initialize();
      
      expect(loggingInitializer.isLoggingInitialized()).toBe(true);
      consoleSpy.mockRestore();
    });

    test('should set user context', () => {
      const testUserId = 'user_123';
      
      loggingInitializer.setUserContext(testUserId);
      
      // Verify that subsequent logs include the user context
      loggingService.info('system', 'Test message with user context');
      
      const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
      const storedLogs = JSON.parse(setItemCall[1]);
      
      expect(storedLogs[0].context.userId).toBe(testUserId);
    });

    test('should handle initialization errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock an error during initialization
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Init error'));
      
      // Should not throw
      await expect(loggingInitializer.initialize()).resolves.not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    test('should work end-to-end', async () => {
      // Initialize the system
      await loggingInitializer.initialize();
      loggingInitializer.setUserContext('test_user');
      
      // Log various types of events
      loggingService.logAuth('login', true, { email: 'test@example.com' });
      loggingService.logCommunity('post_create', { postId: 'post_123' });
      loggingService.logPerformance('api_call', 250);
      loggingService.error('system', 'Test error', { error: new Error('Test') });
      
      // Verify all logs were stored
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(5); // init + 4 logs
      
      // Mock the stored logs for search
      const mockLogs = [
        { level: 'INFO', category: 'auth', message: 'Authentication login succeeded', timestamp: '2023-01-01T10:00:00.000Z', context: { userId: 'test_user' } },
        { level: 'INFO', category: 'community', message: 'Community post_create', timestamp: '2023-01-01T10:01:00.000Z', context: { userId: 'test_user' } },
        { level: 'INFO', category: 'performance', message: 'Performance: api_call', timestamp: '2023-01-01T10:02:00.000Z', context: { userId: 'test_user' } },
        { level: 'ERROR', category: 'system', message: 'Test error', timestamp: '2023-01-01T10:03:00.000Z', context: { userId: 'test_user' } }
      ];
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLogs));
      
      // Search and verify
      const allLogs = await loggingService.searchLogs({}, 10);
      expect(allLogs).toHaveLength(4);
      
      const userLogs = await loggingService.searchLogs({ userId: 'test_user' }, 10);
      expect(userLogs).toHaveLength(4);
      
      const errorLogs = await loggingService.searchLogs({ level: 'ERROR' }, 10);
      expect(errorLogs).toHaveLength(1);
      
      // Get statistics
      const stats = await loggingService.getLogStatistics();
      expect(stats.totalLogs).toBe(4);
      expect(stats.errorRate).toBe(25); // 1 error out of 4 logs
    });
  });
});