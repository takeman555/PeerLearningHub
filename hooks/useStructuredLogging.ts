/**
 * Structured Logging Hook
 * Provides easy access to structured logging throughout the application
 */

import { useCallback, useEffect } from 'react';
import StructuredLoggingService, { LogCategory } from '../services/loggingService';
import LoggingInitializer from '../services/loggingInitializer';

interface UseStructuredLoggingReturn {
  logError: (category: LogCategory, message: string, error?: Error, context?: Record<string, any>) => void;
  logWarning: (category: LogCategory, message: string, context?: Record<string, any>) => void;
  logInfo: (category: LogCategory, message: string, context?: Record<string, any>) => void;
  logDebug: (category: LogCategory, message: string, context?: Record<string, any>) => void;
  logAuth: (action: string, success: boolean, options?: {
    userId?: string;
    email?: string;
    method?: string;
    duration?: number;
    error?: Error;
  }) => void;
  logCommunity: (action: string, options?: {
    postId?: string;
    groupId?: string;
    userId?: string;
    duration?: number;
    success?: boolean;
    error?: Error;
  }) => void;
  logPerformance: (operation: string, duration: number, options?: {
    category?: LogCategory;
    success?: boolean;
    metadata?: Record<string, any>;
  }) => void;
  logApiRequest: (method: string, url: string, options?: {
    statusCode?: number;
    duration?: number;
    requestId?: string;
    userId?: string;
    error?: Error;
  }) => void;
  isLoggingReady: boolean;
}

export const useStructuredLogging = (source?: string): UseStructuredLoggingReturn => {
  const loggingService = StructuredLoggingService.getInstance();
  const loggingInitializer = LoggingInitializer.getInstance();

  useEffect(() => {
    // Ensure logging is initialized
    if (!loggingInitializer.isLoggingInitialized()) {
      loggingInitializer.initialize().catch(error => {
        console.error('Failed to initialize logging in hook:', error);
      });
    }
  }, []);

  const logError = useCallback((
    category: LogCategory, 
    message: string, 
    error?: Error, 
    context?: Record<string, any>
  ) => {
    loggingService.error(category, message, {
      context: { source, ...context },
      error,
      tags: ['hook_logged']
    });
  }, [source]);

  const logWarning = useCallback((
    category: LogCategory, 
    message: string, 
    context?: Record<string, any>
  ) => {
    loggingService.warn(category, message, {
      context: { source, ...context },
      tags: ['hook_logged']
    });
  }, [source]);

  const logInfo = useCallback((
    category: LogCategory, 
    message: string, 
    context?: Record<string, any>
  ) => {
    loggingService.info(category, message, {
      context: { source, ...context },
      tags: ['hook_logged']
    });
  }, [source]);

  const logDebug = useCallback((
    category: LogCategory, 
    message: string, 
    context?: Record<string, any>
  ) => {
    loggingService.debug(category, message, {
      context: { source, ...context },
      tags: ['hook_logged']
    });
  }, [source]);

  const logAuth = useCallback((
    action: string, 
    success: boolean, 
    options?: {
      userId?: string;
      email?: string;
      method?: string;
      duration?: number;
      error?: Error;
    }
  ) => {
    loggingService.logAuth(action, success, {
      ...options,
      // Override source if provided in hook
      ...(source && { source })
    });
  }, [source]);

  const logCommunity = useCallback((
    action: string, 
    options?: {
      postId?: string;
      groupId?: string;
      userId?: string;
      duration?: number;
      success?: boolean;
      error?: Error;
    }
  ) => {
    loggingService.logCommunity(action, {
      ...options,
      // Add source context
      ...(source && { source })
    });
  }, [source]);

  const logPerformance = useCallback((
    operation: string, 
    duration: number, 
    options?: {
      category?: LogCategory;
      success?: boolean;
      metadata?: Record<string, any>;
    }
  ) => {
    loggingService.logPerformance(operation, duration, {
      ...options,
      metadata: {
        ...options?.metadata,
        source
      }
    });
  }, [source]);

  const logApiRequest = useCallback((
    method: string, 
    url: string, 
    options?: {
      statusCode?: number;
      duration?: number;
      requestId?: string;
      userId?: string;
      error?: Error;
    }
  ) => {
    loggingService.logApiRequest(method, url, {
      ...options,
      // Add source context if not already provided
      ...(source && !options?.requestId && { requestId: `${source}_${Date.now()}` })
    });
  }, [source]);

  return {
    logError,
    logWarning,
    logInfo,
    logDebug,
    logAuth,
    logCommunity,
    logPerformance,
    logApiRequest,
    isLoggingReady: loggingInitializer.isLoggingInitialized()
  };
};

/**
 * Performance logging hook for measuring operation durations
 */
export const usePerformanceLogging = (source?: string) => {
  const { logPerformance } = useStructuredLogging(source);

  const measurePerformance = useCallback(async <T>(
    operation: string,
    asyncOperation: () => Promise<T>,
    options?: {
      category?: LogCategory;
      metadata?: Record<string, any>;
    }
  ): Promise<T> => {
    const startTime = Date.now();
    let success = true;
    let error: Error | undefined;

    try {
      const result = await asyncOperation();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      logPerformance(operation, duration, {
        ...options,
        success,
        metadata: {
          ...options?.metadata,
          ...(error && {
            errorName: error.name,
            errorMessage: error.message
          })
        }
      });
    }
  }, [logPerformance]);

  const measureSync = useCallback(<T>(
    operation: string,
    syncOperation: () => T,
    options?: {
      category?: LogCategory;
      metadata?: Record<string, any>;
    }
  ): T => {
    const startTime = Date.now();
    let success = true;
    let error: Error | undefined;

    try {
      const result = syncOperation();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      logPerformance(operation, duration, {
        ...options,
        success,
        metadata: {
          ...options?.metadata,
          ...(error && {
            errorName: error.name,
            errorMessage: error.message
          })
        }
      });
    }
  }, [logPerformance]);

  return {
    measurePerformance,
    measureSync
  };
};

export default useStructuredLogging;