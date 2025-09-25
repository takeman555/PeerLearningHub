/**
 * Structured Logging Service for PeerLearningHub
 * Provides JSON-formatted structured logging with different levels and efficient search/filtering
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
export type LogCategory = 
  | 'auth' 
  | 'community' 
  | 'external_systems' 
  | 'membership' 
  | 'performance' 
  | 'security' 
  | 'system' 
  | 'ui' 
  | 'database'
  | 'api';

export interface StructuredLogEntry {
  timestamp: string; // ISO 8601 format
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    source?: string;
    action?: string;
    [key: string]: any;
  };
  metadata?: {
    duration?: number;
    statusCode?: number;
    errorCode?: string;
    stackTrace?: string;
    [key: string]: any;
  };
  tags?: string[];
}

export interface LogFilter {
  level?: LogLevel;
  category?: LogCategory;
  startTime?: Date;
  endTime?: Date;
  userId?: string;
  source?: string;
  tags?: string[];
  searchText?: string;
}

class StructuredLoggingService {
  private static instance: StructuredLoggingService;
  private currentLogLevel: LogLevel = __DEV__ ? 'DEBUG' : 'INFO';
  private maxLocalLogs: number = 2000;
  private sessionId: string;
  private currentUserId?: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeLogging();
  }

  public static getInstance(): StructuredLoggingService {
    if (!StructuredLoggingService.instance) {
      StructuredLoggingService.instance = new StructuredLoggingService();
    }
    return StructuredLoggingService.instance;
  }

  /**
   * Initialize logging system
   */
  private async initializeLogging(): Promise<void> {
    try {
      // Clean up old logs on startup
      await this.cleanupOldLogs();
      
      this.info('system', 'Structured logging system initialized', {
        context: { source: 'StructuredLoggingService' },
        tags: ['startup', 'initialization']
      });
    } catch (error) {
      console.error('Failed to initialize logging system:', error);
    }
  }

  /**
   * Set current user ID for context
   */
  public setUserId(userId: string | undefined): void {
    this.currentUserId = userId;
  }

  /**
   * Set minimum log level
   */
  public setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
    this.info('system', 'Log level changed', {
      context: { source: 'StructuredLoggingService' },
      metadata: { newLevel: level }
    });
  }

  /**
   * ERROR level logging
   */
  public error(
    category: LogCategory, 
    message: string, 
    options?: {
      context?: Record<string, any>;
      metadata?: Record<string, any>;
      tags?: string[];
      error?: Error;
    }
  ): void {
    const metadata = { ...options?.metadata };
    
    if (options?.error) {
      metadata.errorName = options.error.name;
      metadata.errorMessage = options.error.message;
      metadata.stackTrace = options.error.stack;
    }

    this.log('ERROR', category, message, {
      context: options?.context,
      metadata,
      tags: options?.tags
    });
  }

  /**
   * WARN level logging
   */
  public warn(
    category: LogCategory, 
    message: string, 
    options?: {
      context?: Record<string, any>;
      metadata?: Record<string, any>;
      tags?: string[];
    }
  ): void {
    this.log('WARN', category, message, options);
  }

  /**
   * INFO level logging
   */
  public info(
    category: LogCategory, 
    message: string, 
    options?: {
      context?: Record<string, any>;
      metadata?: Record<string, any>;
      tags?: string[];
    }
  ): void {
    this.log('INFO', category, message, options);
  }

  /**
   * DEBUG level logging
   */
  public debug(
    category: LogCategory, 
    message: string, 
    options?: {
      context?: Record<string, any>;
      metadata?: Record<string, any>;
      tags?: string[];
    }
  ): void {
    this.log('DEBUG', category, message, options);
  }

  /**
   * Log authentication events
   */
  public logAuth(action: string, success: boolean, options?: {
    userId?: string;
    email?: string;
    method?: string;
    duration?: number;
    error?: Error;
  }): void {
    const level = success ? 'INFO' : (options?.error ? 'ERROR' : 'WARN');
    
    this.log(level, 'auth', `Authentication ${action} ${success ? 'succeeded' : 'failed'}`, {
      context: {
        userId: options?.userId,
        email: options?.email,
        action,
        source: 'AuthService'
      },
      metadata: {
        success,
        method: options?.method,
        duration: options?.duration,
        ...(options?.error && {
          errorName: options.error.name,
          errorMessage: options.error.message,
          stackTrace: options.error.stack
        })
      },
      tags: ['authentication', action, success ? 'success' : 'failure']
    });
  }

  /**
   * Log community events
   */
  public logCommunity(action: string, options?: {
    postId?: string;
    groupId?: string;
    userId?: string;
    duration?: number;
    success?: boolean;
    error?: Error;
  }): void {
    const level = options?.error ? 'ERROR' : 'INFO';
    
    this.log(level, 'community', `Community ${action}`, {
      context: {
        userId: options?.userId,
        postId: options?.postId,
        groupId: options?.groupId,
        action,
        source: 'CommunityService'
      },
      metadata: {
        success: options?.success ?? true,
        duration: options?.duration,
        ...(options?.error && {
          errorName: options.error.name,
          errorMessage: options.error.message,
          stackTrace: options.error.stack
        })
      },
      tags: ['community', action]
    });
  }

  /**
   * Log performance metrics
   */
  public logPerformance(operation: string, duration: number, options?: {
    category?: LogCategory;
    success?: boolean;
    metadata?: Record<string, any>;
  }): void {
    const category = options?.category || 'performance';
    const level = duration > 5000 ? 'WARN' : 'INFO'; // Warn if operation takes > 5 seconds
    
    this.log(level, category, `Performance: ${operation}`, {
      context: {
        operation,
        source: 'PerformanceMonitor'
      },
      metadata: {
        duration,
        success: options?.success ?? true,
        ...options?.metadata
      },
      tags: ['performance', operation]
    });
  }

  /**
   * Log API requests
   */
  public logApiRequest(method: string, url: string, options?: {
    statusCode?: number;
    duration?: number;
    requestId?: string;
    userId?: string;
    error?: Error;
  }): void {
    const level = options?.error ? 'ERROR' : (options?.statusCode && options.statusCode >= 400 ? 'WARN' : 'INFO');
    
    this.log(level, 'api', `API ${method} ${url}`, {
      context: {
        method,
        url,
        requestId: options?.requestId,
        userId: options?.userId,
        source: 'ApiClient'
      },
      metadata: {
        statusCode: options?.statusCode,
        duration: options?.duration,
        ...(options?.error && {
          errorName: options.error.name,
          errorMessage: options.error.message,
          stackTrace: options.error.stack
        })
      },
      tags: ['api', method.toLowerCase(), options?.statusCode ? `status_${options.statusCode}` : ''].filter(Boolean)
    });
  }

  /**
   * Search and filter logs
   */
  public async searchLogs(filter: LogFilter, limit: number = 100): Promise<StructuredLogEntry[]> {
    try {
      const allLogs = await this.getAllLogs();
      
      let filteredLogs = allLogs.filter(log => {
        // Level filter
        if (filter.level && log.level !== filter.level) return false;
        
        // Category filter
        if (filter.category && log.category !== filter.category) return false;
        
        // Time range filter
        const logTime = new Date(log.timestamp);
        if (filter.startTime && logTime < filter.startTime) return false;
        if (filter.endTime && logTime > filter.endTime) return false;
        
        // User ID filter
        if (filter.userId && log.context?.userId !== filter.userId) return false;
        
        // Source filter
        if (filter.source && log.context?.source !== filter.source) return false;
        
        // Tags filter
        if (filter.tags && filter.tags.length > 0) {
          const logTags = log.tags || [];
          const hasMatchingTag = filter.tags.some(tag => logTags.includes(tag));
          if (!hasMatchingTag) return false;
        }
        
        // Text search
        if (filter.searchText) {
          const searchText = filter.searchText.toLowerCase();
          const messageMatch = log.message.toLowerCase().includes(searchText);
          const contextMatch = JSON.stringify(log.context || {}).toLowerCase().includes(searchText);
          const metadataMatch = JSON.stringify(log.metadata || {}).toLowerCase().includes(searchText);
          
          if (!messageMatch && !contextMatch && !metadataMatch) return false;
        }
        
        return true;
      });
      
      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return filteredLogs.slice(0, limit);
    } catch (error) {
      console.error('Failed to search logs:', error);
      return [];
    }
  }

  /**
   * Get log statistics
   */
  public async getLogStatistics(timeRange?: { start: Date; end: Date }): Promise<{
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    logsByCategory: Record<LogCategory, number>;
    errorRate: number;
    topErrors: Array<{ message: string; count: number }>;
  }> {
    try {
      const allLogs = await this.getAllLogs();
      
      let logs = allLogs;
      if (timeRange) {
        logs = allLogs.filter(log => {
          const logTime = new Date(log.timestamp);
          return logTime >= timeRange.start && logTime <= timeRange.end;
        });
      }
      
      const logsByLevel: Record<LogLevel, number> = {
        ERROR: 0,
        WARN: 0,
        INFO: 0,
        DEBUG: 0
      };
      
      const logsByCategory: Record<LogCategory, number> = {
        auth: 0,
        community: 0,
        external_systems: 0,
        membership: 0,
        performance: 0,
        security: 0,
        system: 0,
        ui: 0,
        database: 0,
        api: 0
      };
      
      const errorMessages: Record<string, number> = {};
      
      logs.forEach(log => {
        logsByLevel[log.level]++;
        logsByCategory[log.category]++;
        
        if (log.level === 'ERROR') {
          errorMessages[log.message] = (errorMessages[log.message] || 0) + 1;
        }
      });
      
      const topErrors = Object.entries(errorMessages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([message, count]) => ({ message, count }));
      
      const errorRate = logs.length > 0 ? (logsByLevel.ERROR / logs.length) * 100 : 0;
      
      return {
        totalLogs: logs.length,
        logsByLevel,
        logsByCategory,
        errorRate,
        topErrors
      };
    } catch (error) {
      console.error('Failed to get log statistics:', error);
      return {
        totalLogs: 0,
        logsByLevel: { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 },
        logsByCategory: { auth: 0, community: 0, external_systems: 0, membership: 0, performance: 0, security: 0, system: 0, ui: 0, database: 0, api: 0 },
        errorRate: 0,
        topErrors: []
      };
    }
  }

  /**
   * Export logs in JSON format
   */
  public async exportLogs(filter?: LogFilter): Promise<string> {
    try {
      const logs = filter ? await this.searchLogs(filter, 1000) : await this.getAllLogs();
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Failed to export logs:', error);
      return '[]';
    }
  }

  /**
   * Clear all logs
   */
  public async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem('structured_logs');
      this.info('system', 'All logs cleared', {
        context: { source: 'StructuredLoggingService' },
        tags: ['maintenance', 'cleanup']
      });
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  /**
   * Core logging method
   */
  private async log(
    level: LogLevel, 
    category: LogCategory, 
    message: string, 
    options?: {
      context?: Record<string, any>;
      metadata?: Record<string, any>;
      tags?: string[];
    }
  ): Promise<void> {
    // Check if we should log this level
    if (!this.shouldLog(level)) return;

    const logEntry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context: {
        userId: this.currentUserId,
        sessionId: this.sessionId,
        ...options?.context
      },
      metadata: options?.metadata,
      tags: options?.tags
    };

    // Console output in development
    if (__DEV__) {
      this.outputToConsole(logEntry);
    }

    // Store locally
    await this.storeLog(logEntry);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(this.currentLogLevel);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= currentLevelIndex;
  }

  private outputToConsole(logEntry: StructuredLogEntry): void {
    const prefix = `[${logEntry.level}] ${logEntry.category}`;
    const output = {
      message: logEntry.message,
      context: logEntry.context,
      metadata: logEntry.metadata,
      tags: logEntry.tags
    };

    switch (logEntry.level) {
      case 'DEBUG':
        console.debug(prefix, output);
        break;
      case 'INFO':
        console.info(prefix, output);
        break;
      case 'WARN':
        console.warn(prefix, output);
        break;
      case 'ERROR':
        console.error(prefix, output);
        break;
    }
  }

  private async storeLog(logEntry: StructuredLogEntry): Promise<void> {
    try {
      const logs = await this.getAllLogs();
      logs.push(logEntry);
      
      // Keep only the most recent logs
      if (logs.length > this.maxLocalLogs) {
        logs.splice(0, logs.length - this.maxLocalLogs);
      }
      
      await AsyncStorage.setItem('structured_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store log:', error);
    }
  }

  private async getAllLogs(): Promise<StructuredLogEntry[]> {
    try {
      const logsJson = await AsyncStorage.getItem('structured_logs');
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const logs = await this.getAllLogs();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep logs for 30 days
      
      const recentLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate);
      
      if (recentLogs.length !== logs.length) {
        await AsyncStorage.setItem('structured_logs', JSON.stringify(recentLogs));
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default StructuredLoggingService;