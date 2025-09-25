/**
 * Logging System Initializer
 * Sets up and configures the structured logging system for PeerLearningHub
 */

import StructuredLoggingService from './loggingService';
import { LogLevel } from './loggingService';

class LoggingInitializer {
  private static instance: LoggingInitializer;
  private loggingService: StructuredLoggingService;
  private isInitialized: boolean = false;

  private constructor() {
    this.loggingService = StructuredLoggingService.getInstance();
  }

  public static getInstance(): LoggingInitializer {
    if (!LoggingInitializer.instance) {
      LoggingInitializer.instance = new LoggingInitializer();
    }
    return LoggingInitializer.instance;
  }

  /**
   * Initialize the logging system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set appropriate log level based on environment
      const logLevel: LogLevel = this.getEnvironmentLogLevel();
      this.loggingService.setLogLevel(logLevel);

      // Set up periodic cleanup
      this.setupPeriodicCleanup();

      // Set up error handlers
      this.setupGlobalErrorHandlers();

      this.isInitialized = true;

      this.loggingService.info('system', 'Logging system initialized successfully', {
        context: { source: 'LoggingInitializer' },
        metadata: { logLevel },
        tags: ['initialization', 'startup']
      });

    } catch (error) {
      console.error('Failed to initialize logging system:', error);
      throw error;
    }
  }

  /**
   * Set user context for logging
   */
  public setUserContext(userId: string | undefined): void {
    this.loggingService.setUserId(userId);
    
    if (userId) {
      this.loggingService.info('system', 'User context set for logging', {
        context: { 
          userId,
          source: 'LoggingInitializer' 
        },
        tags: ['user_context', 'authentication']
      });
    }
  }

  /**
   * Get logging service instance
   */
  public getLoggingService(): StructuredLoggingService {
    return this.loggingService;
  }

  /**
   * Check if logging is initialized
   */
  public isLoggingInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Shutdown logging system gracefully
   */
  public async shutdown(): Promise<void> {
    try {
      this.loggingService.info('system', 'Logging system shutting down', {
        context: { source: 'LoggingInitializer' },
        tags: ['shutdown', 'cleanup']
      });

      // Perform any cleanup operations
      await this.performCleanup();

      this.isInitialized = false;
    } catch (error) {
      console.error('Error during logging system shutdown:', error);
    }
  }

  /**
   * Get environment-appropriate log level
   */
  private getEnvironmentLogLevel(): LogLevel {
    if (__DEV__) {
      return 'DEBUG';
    }

    // Check if we're in a testing environment
    if (process.env.NODE_ENV === 'test') {
      return 'WARN';
    }

    // Production environment
    return 'INFO';
  }

  /**
   * Set up periodic log cleanup
   */
  private setupPeriodicCleanup(): void {
    // Clean up logs every 24 hours
    const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    setInterval(async () => {
      try {
        const stats = await this.loggingService.getLogStatistics();
        
        this.loggingService.debug('system', 'Performing periodic log cleanup', {
          context: { source: 'LoggingInitializer' },
          metadata: { 
            totalLogsBefore: stats.totalLogs,
            errorRate: stats.errorRate
          },
          tags: ['maintenance', 'cleanup']
        });

        // The cleanup is handled internally by the logging service
        // This just logs the maintenance activity
      } catch (error) {
        console.error('Error during periodic log cleanup:', error);
      }
    }, cleanupInterval);
  }

  /**
   * Set up global error handlers for logging
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.loggingService.error('system', 'Unhandled promise rejection', {
          context: { source: 'GlobalErrorHandler' },
          metadata: {
            reason: event.reason,
            promise: event.promise?.toString()
          },
          tags: ['unhandled_rejection', 'critical'],
          error: event.reason instanceof Error ? event.reason : new Error(String(event.reason))
        });
      });

      // Handle uncaught errors
      window.addEventListener('error', (event) => {
        this.loggingService.error('system', 'Uncaught error', {
          context: { source: 'GlobalErrorHandler' },
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            message: event.message
          },
          tags: ['uncaught_error', 'critical'],
          error: event.error
        });
      });
    }

    // React Native specific error handling
    if (typeof global !== 'undefined' && global.ErrorUtils) {
      const originalHandler = global.ErrorUtils.getGlobalHandler();
      
      global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        this.loggingService.error('system', 'React Native global error', {
          context: { source: 'ReactNativeErrorHandler' },
          metadata: {
            isFatal: isFatal || false,
            errorName: error.name,
            errorMessage: error.message
          },
          tags: ['react_native_error', isFatal ? 'fatal' : 'non_fatal'],
          error
        });

        // Call the original handler
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }
  }

  /**
   * Perform cleanup operations
   */
  private async performCleanup(): Promise<void> {
    try {
      // Get final statistics before shutdown
      const stats = await this.loggingService.getLogStatistics();
      
      this.loggingService.info('system', 'Final logging statistics', {
        context: { source: 'LoggingInitializer' },
        metadata: stats,
        tags: ['shutdown', 'statistics']
      });

    } catch (error) {
      console.error('Error during logging cleanup:', error);
    }
  }
}

export default LoggingInitializer;