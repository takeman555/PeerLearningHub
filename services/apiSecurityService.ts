/**
 * API Security Service
 * Enhanced API communication security with rate limiting, input validation, and monitoring
 */

import { productionSecurityConfig, rateLimitConfig, inputValidationConfig } from '../config/security';
import { securityService } from './securityService';

export interface RateLimitRule {
  endpoint: string;
  method: string;
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface APIRequest {
  method: string;
  endpoint: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  ipAddress: string;
  userAgent: string;
  userId?: string;
  timestamp: Date;
}

export interface APIResponse {
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
  timestamp: Date;
  processingTime: number;
}

export interface RateLimitStatus {
  isAllowed: boolean;
  remainingRequests: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface InputValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedInput?: any;
}

export interface APISecurityEvent {
  type: 'rate_limit_exceeded' | 'invalid_input' | 'suspicious_request' | 'authentication_failure' | 'authorization_failure';
  request: APIRequest;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export class APISecurityService {
  private static instance: APISecurityService;
  private rateLimitStore: Map<string, { count: number; resetTime: Date }> = new Map();
  private requestLog: APIRequest[] = [];
  private securityEvents: APISecurityEvent[] = [];
  private rateLimitRules: RateLimitRule[] = [];

  private constructor() {
    this.initializeRateLimitRules();
    this.startSecurityMonitoring();
  }

  static getInstance(): APISecurityService {
    if (!APISecurityService.instance) {
      APISecurityService.instance = new APISecurityService();
    }
    return APISecurityService.instance;
  }

  /**
   * Initialize default rate limit rules
   */
  private initializeRateLimitRules(): void {
    this.rateLimitRules = [
      // Authentication endpoints
      {
        endpoint: '/auth/login',
        method: 'POST',
        maxRequests: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        skipSuccessfulRequests: false,
      },
      {
        endpoint: '/auth/register',
        method: 'POST',
        maxRequests: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
      },
      {
        endpoint: '/auth/reset-password',
        method: 'POST',
        maxRequests: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
      },
      // API endpoints
      {
        endpoint: '/api/*',
        method: '*',
        maxRequests: rateLimitConfig.max,
        windowMs: rateLimitConfig.windowMs,
      },
      // File upload endpoints
      {
        endpoint: '/api/upload',
        method: 'POST',
        maxRequests: 10,
        windowMs: 60 * 60 * 1000, // 1 hour
      },
      // Search endpoints
      {
        endpoint: '/api/search',
        method: 'GET',
        maxRequests: 100,
        windowMs: 60 * 60 * 1000, // 1 hour
      },
    ];
  }

  /**
   * Start security monitoring
   */
  private startSecurityMonitoring(): void {
    // Clean up old rate limit entries every 5 minutes
    setInterval(() => {
      this.cleanupRateLimitStore();
    }, 5 * 60 * 1000);

    // Analyze security events every 10 minutes
    setInterval(() => {
      this.analyzeSecurityEvents();
    }, 10 * 60 * 1000);

    // Clean up old logs every hour
    setInterval(() => {
      this.cleanupOldLogs();
    }, 60 * 60 * 1000);
  }

  /**
   * Check rate limit for API request
   */
  checkRateLimit(request: APIRequest): RateLimitStatus {
    const rule = this.findMatchingRule(request.endpoint, request.method);
    if (!rule) {
      return {
        isAllowed: true,
        remainingRequests: Infinity,
        resetTime: new Date(Date.now() + 60 * 60 * 1000),
      };
    }

    const key = this.generateRateLimitKey(request, rule);
    const now = new Date();
    const entry = this.rateLimitStore.get(key);

    if (!entry || now >= entry.resetTime) {
      // Create new entry or reset expired entry
      const resetTime = new Date(now.getTime() + rule.windowMs);
      this.rateLimitStore.set(key, { count: 1, resetTime });
      
      return {
        isAllowed: true,
        remainingRequests: rule.maxRequests - 1,
        resetTime,
      };
    }

    // Check if limit exceeded
    if (entry.count >= rule.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime.getTime() - now.getTime()) / 1000);
      
      // Log rate limit exceeded event
      this.logSecurityEvent({
        type: 'rate_limit_exceeded',
        request,
        details: {
          rule: rule.endpoint,
          currentCount: entry.count,
          maxRequests: rule.maxRequests,
          retryAfter,
        },
        severity: 'medium',
        timestamp: now,
      });

      return {
        isAllowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime,
        retryAfter,
      };
    }

    // Increment counter
    entry.count++;
    this.rateLimitStore.set(key, entry);

    return {
      isAllowed: true,
      remainingRequests: rule.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Find matching rate limit rule
   */
  private findMatchingRule(endpoint: string, method: string): RateLimitRule | null {
    // Find exact match first
    let rule = this.rateLimitRules.find(r => 
      (r.endpoint === endpoint || this.matchWildcard(r.endpoint, endpoint)) &&
      (r.method === method || r.method === '*')
    );

    // If no exact match, find wildcard match
    if (!rule) {
      rule = this.rateLimitRules.find(r => 
        this.matchWildcard(r.endpoint, endpoint) &&
        (r.method === method || r.method === '*')
      );
    }

    return rule || null;
  }

  /**
   * Match wildcard patterns
   */
  private matchWildcard(pattern: string, text: string): boolean {
    if (pattern === text) return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return text.startsWith(prefix);
    }
    return false;
  }

  /**
   * Generate rate limit key
   */
  private generateRateLimitKey(request: APIRequest, rule: RateLimitRule): string {
    // Use IP address and user ID (if available) for rate limiting
    const identifier = request.userId || request.ipAddress;
    return `${rule.endpoint}:${rule.method}:${identifier}`;
  }

  /**
   * Validate API input
   */
  validateInput(input: any, schema?: any): InputValidationResult {
    const errors: string[] = [];
    let sanitizedInput = input;

    if (!inputValidationConfig.enableValidation) {
      return { isValid: true, errors: [], sanitizedInput };
    }

    try {
      // Basic input validation
      if (typeof input === 'string') {
        // Check length
        if (input.length > inputValidationConfig.maxInputLength) {
          errors.push(`Input exceeds maximum length of ${inputValidationConfig.maxInputLength}`);
        }

        // Sanitize if enabled
        if (inputValidationConfig.sanitizeInput) {
          sanitizedInput = securityService.sanitizeInput(input);
        }

        // Check for SQL injection patterns
        if (inputValidationConfig.validateSQL) {
          const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
            /(--|\/\*|\*\/|;)/,
            /(\b(OR|AND)\b.*=.*)/i,
          ];

          for (const pattern of sqlPatterns) {
            if (pattern.test(input)) {
              errors.push('Potentially malicious SQL pattern detected');
              break;
            }
          }
        }

        // Check for XSS patterns
        if (inputValidationConfig.validateXSS) {
          const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
          ];

          for (const pattern of xssPatterns) {
            if (pattern.test(input)) {
              errors.push('Potentially malicious XSS pattern detected');
              break;
            }
          }
        }
      }

      // Object validation
      if (typeof input === 'object' && input !== null) {
        sanitizedInput = this.sanitizeObject(input);
      }

      // Schema validation (if provided)
      if (schema) {
        const schemaErrors = this.validateAgainstSchema(sanitizedInput, schema);
        errors.push(...schemaErrors);
      }

    } catch (error) {
      errors.push('Input validation failed');
    }

    if (errors.length > 0) {
      this.logSecurityEvent({
        type: 'invalid_input',
        request: {
          method: 'UNKNOWN',
          endpoint: 'UNKNOWN',
          headers: {},
          body: input,
          ipAddress: 'unknown',
          userAgent: 'unknown',
          timestamp: new Date(),
        },
        details: { errors, originalInput: input },
        severity: 'medium',
        timestamp: new Date(),
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedInput,
    };
  }

  /**
   * Sanitize object recursively
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = securityService.sanitizeInput(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validate against schema (basic implementation)
   */
  private validateAgainstSchema(input: any, schema: any): string[] {
    const errors: string[] = [];

    if (schema.type && typeof input !== schema.type) {
      errors.push(`Expected type ${schema.type}, got ${typeof input}`);
    }

    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in input)) {
          errors.push(`Required field '${field}' is missing`);
        }
      }
    }

    if (schema.properties && typeof input === 'object') {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in input) {
          const fieldErrors = this.validateAgainstSchema(input[field], fieldSchema);
          errors.push(...fieldErrors.map(err => `${field}: ${err}`));
        }
      }
    }

    return errors;
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: {
    name: string;
    type: string;
    size: number;
    content?: ArrayBuffer;
  }): InputValidationResult {
    const errors: string[] = [];

    // Use existing file validation from security service
    const fileValidation = securityService.validateFileUpload(file);
    if (!fileValidation.isValid) {
      errors.push(...fileValidation.errors);
    }

    // Additional API-specific validations
    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Check file name for path traversal
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push('Invalid file name - path traversal detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedInput: file,
    };
  }

  /**
   * Validate API headers
   */
  validateHeaders(headers: Record<string, string>): InputValidationResult {
    const errors: string[] = [];
    const sanitizedHeaders: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      // Sanitize header values
      const sanitizedValue = securityService.sanitizeInput(value);
      sanitizedHeaders[key.toLowerCase()] = sanitizedValue;

      // Check for suspicious headers
      if (key.toLowerCase().includes('x-forwarded') && value.includes('..')) {
        errors.push('Suspicious header value detected');
      }

      // Validate content-type
      if (key.toLowerCase() === 'content-type') {
        const allowedTypes = [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data',
          'text/plain',
        ];
        
        const baseType = value.split(';')[0].trim();
        if (!allowedTypes.includes(baseType)) {
          errors.push(`Unsupported content type: ${baseType}`);
        }
      }
    }

    // Check for required security headers in responses
    const requiredHeaders = ['content-type'];
    for (const required of requiredHeaders) {
      if (!sanitizedHeaders[required]) {
        errors.push(`Missing required header: ${required}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedInput: sanitizedHeaders,
    };
  }

  /**
   * Generate API security headers
   */
  generateSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'X-API-Version': '1.0',
      'X-Rate-Limit-Policy': 'standard',
    };
  }

  /**
   * Log API request
   */
  logRequest(request: APIRequest): void {
    this.requestLog.push(request);

    // Keep only recent requests (last 1000)
    if (this.requestLog.length > 1000) {
      this.requestLog.splice(0, this.requestLog.length - 1000);
    }

    // Detect suspicious patterns
    this.detectSuspiciousRequest(request);
  }

  /**
   * Detect suspicious API requests
   */
  private detectSuspiciousRequest(request: APIRequest): void {
    const suspiciousPatterns: string[] = [];

    // Check for rapid requests from same IP
    const recentRequests = this.requestLog.filter(r => 
      r.ipAddress === request.ipAddress &&
      (request.timestamp.getTime() - r.timestamp.getTime()) < 60 * 1000 // Last minute
    );

    if (recentRequests.length > 50) {
      suspiciousPatterns.push('Rapid requests from same IP');
    }

    // Check for unusual user agents
    const suspiciousUserAgents = [
      'curl', 'wget', 'python-requests', 'bot', 'crawler', 'scanner'
    ];

    if (suspiciousUserAgents.some(agent => 
      request.userAgent.toLowerCase().includes(agent)
    )) {
      suspiciousPatterns.push('Suspicious user agent');
    }

    // Check for path traversal attempts
    if (request.endpoint.includes('..') || request.endpoint.includes('//')) {
      suspiciousPatterns.push('Path traversal attempt');
    }

    // Check for SQL injection in query parameters
    if (request.query) {
      for (const [key, value] of Object.entries(request.query)) {
        if (typeof value === 'string' && /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b)/i.test(value)) {
          suspiciousPatterns.push('SQL injection attempt in query parameters');
          break;
        }
      }
    }

    if (suspiciousPatterns.length > 0) {
      this.logSecurityEvent({
        type: 'suspicious_request',
        request,
        details: { patterns: suspiciousPatterns },
        severity: 'high',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Log security event
   */
  private logSecurityEvent(event: APISecurityEvent): void {
    this.securityEvents.push(event);

    // Keep only recent events (last 1000)
    if (this.securityEvents.length > 1000) {
      this.securityEvents.splice(0, this.securityEvents.length - 1000);
    }

    // Log to console for immediate visibility
    console.warn('API Security Event:', {
      type: event.type,
      severity: event.severity,
      endpoint: event.request.endpoint,
      ipAddress: event.request.ipAddress,
      details: event.details,
    });

    // Also log through main security service
    securityService.logSecurityEvent({
      action: event.type,
      resourceType: 'api',
      success: false,
      metadata: {
        endpoint: event.request.endpoint,
        method: event.request.method,
        ipAddress: event.request.ipAddress,
        ...event.details,
      },
    });
  }

  /**
   * Analyze security events for patterns
   */
  private analyzeSecurityEvents(): void {
    const recentEvents = this.securityEvents.filter(event => 
      Date.now() - event.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    if (recentEvents.length === 0) return;

    // Group events by IP address
    const eventsByIP = new Map<string, APISecurityEvent[]>();
    for (const event of recentEvents) {
      const ip = event.request.ipAddress;
      const events = eventsByIP.get(ip) || [];
      events.push(event);
      eventsByIP.set(ip, events);
    }

    // Check for coordinated attacks
    for (const [ip, events] of eventsByIP.entries()) {
      if (events.length > 10) {
        console.warn(`Potential coordinated attack from IP ${ip}: ${events.length} security events in the last hour`);
      }
    }

    // Check for critical events
    const criticalEvents = recentEvents.filter(event => event.severity === 'critical');
    if (criticalEvents.length > 0) {
      console.error(`${criticalEvents.length} critical security events detected in the last hour`);
    }
  }

  /**
   * Clean up old rate limit entries
   */
  private cleanupRateLimitStore(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now >= entry.resetTime) {
        this.rateLimitStore.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  /**
   * Clean up old logs
   */
  private cleanupOldLogs(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    // Clean up request log
    const oldRequestCount = this.requestLog.length;
    this.requestLog = this.requestLog.filter(request => 
      request.timestamp.getTime() > cutoffTime
    );

    // Clean up security events
    const oldEventCount = this.securityEvents.length;
    this.securityEvents = this.securityEvents.filter(event => 
      event.timestamp.getTime() > cutoffTime
    );

    const cleanedRequests = oldRequestCount - this.requestLog.length;
    const cleanedEvents = oldEventCount - this.securityEvents.length;

    if (cleanedRequests > 0 || cleanedEvents > 0) {
      console.log(`Cleaned up ${cleanedRequests} old requests and ${cleanedEvents} old security events`);
    }
  }

  /**
   * Add custom rate limit rule
   */
  addRateLimitRule(rule: RateLimitRule): void {
    this.rateLimitRules.push(rule);
  }

  /**
   * Get API security report
   */
  getAPISecurityReport(): {
    totalRequests: number;
    rateLimitViolations: number;
    inputValidationFailures: number;
    suspiciousRequests: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    topIPs: Array<{ ip: string; count: number }>;
    securityEventsSummary: Record<string, number>;
    recommendations: string[];
  } {
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentRequests = this.requestLog.filter(r => r.timestamp.getTime() > last24Hours);
    const recentEvents = this.securityEvents.filter(e => e.timestamp.getTime() > last24Hours);

    // Count events by type
    const eventCounts: Record<string, number> = {};
    for (const event of recentEvents) {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    }

    // Top endpoints
    const endpointCounts = new Map<string, number>();
    for (const request of recentRequests) {
      const count = endpointCounts.get(request.endpoint) || 0;
      endpointCounts.set(request.endpoint, count + 1);
    }
    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top IPs
    const ipCounts = new Map<string, number>();
    for (const request of recentRequests) {
      const count = ipCounts.get(request.ipAddress) || 0;
      ipCounts.set(request.ipAddress, count + 1);
    }
    const topIPs = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recommendations
    const recommendations: string[] = [];
    
    if (eventCounts.rate_limit_exceeded > 100) {
      recommendations.push('Consider adjusting rate limits - high number of violations detected');
    }
    
    if (eventCounts.suspicious_request > 50) {
      recommendations.push('Investigate suspicious request patterns');
    }
    
    if (eventCounts.invalid_input > 20) {
      recommendations.push('Review input validation rules');
    }

    return {
      totalRequests: recentRequests.length,
      rateLimitViolations: eventCounts.rate_limit_exceeded || 0,
      inputValidationFailures: eventCounts.invalid_input || 0,
      suspiciousRequests: eventCounts.suspicious_request || 0,
      topEndpoints,
      topIPs,
      securityEventsSummary: eventCounts,
      recommendations,
    };
  }

  /**
   * Get rate limit rules
   */
  getRateLimitRules(): RateLimitRule[] {
    return [...this.rateLimitRules];
  }

  /**
   * Get recent security events
   */
  getRecentSecurityEvents(limit: number = 100): APISecurityEvent[] {
    return this.securityEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

// Export singleton instance
export const apiSecurityService = APISecurityService.getInstance();
export default apiSecurityService;