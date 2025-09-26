/**
 * Session Management Service
 * Enhanced session management with security features and monitoring
 */

import { productionSecurityConfig, sessionConfig } from '../config/security';
import { authenticationSecurityService } from './authenticationSecurityService';

export interface SessionConfiguration {
  timeout: number; // milliseconds
  renewalThreshold: number; // milliseconds
  maxConcurrentSessions: number;
  enableSessionTracking: boolean;
  secureOnly: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

export interface SessionCookie {
  name: string;
  value: string;
  expires: Date;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  domain?: string;
}

export interface SessionActivity {
  sessionId: string;
  userId: string;
  action: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
}

export class SessionManagementService {
  private static instance: SessionManagementService;
  private sessionConfig: SessionConfiguration;
  private sessionActivities: Map<string, SessionActivity[]> = new Map();

  private constructor() {
    this.initializeSessionConfig();
    this.startSessionMonitoring();
  }

  static getInstance(): SessionManagementService {
    if (!SessionManagementService.instance) {
      SessionManagementService.instance = new SessionManagementService();
    }
    return SessionManagementService.instance;
  }

  /**
   * Initialize session configuration
   */
  private initializeSessionConfig(): void {
    this.sessionConfig = {
      timeout: sessionConfig.timeout,
      renewalThreshold: sessionConfig.renewalThreshold,
      maxConcurrentSessions: sessionConfig.maxConcurrentSessions,
      enableSessionTracking: sessionConfig.enableSessionTracking,
      secureOnly: true, // Always use secure cookies in production
      httpOnly: true, // Prevent XSS attacks
      sameSite: 'strict', // CSRF protection
    };
  }

  /**
   * Start session monitoring
   */
  private startSessionMonitoring(): void {
    // Monitor session activities every 5 minutes
    setInterval(() => {
      this.analyzeSessionActivities();
    }, 5 * 60 * 1000);

    // Clean up old session activities every hour
    setInterval(() => {
      this.cleanupOldActivities();
    }, 60 * 60 * 1000);
  }

  /**
   * Create secure session cookie
   */
  createSessionCookie(sessionId: string, expiresAt: Date): SessionCookie {
    return {
      name: 'plh_session',
      value: sessionId,
      expires: expiresAt,
      secure: this.sessionConfig.secureOnly,
      httpOnly: this.sessionConfig.httpOnly,
      sameSite: this.sessionConfig.sameSite,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.peerlearninghub.com' : undefined,
    };
  }

  /**
   * Validate session cookie
   */
  validateSessionCookie(cookie: string): { isValid: boolean; sessionId?: string; errors: string[] } {
    const errors: string[] = [];

    if (!cookie) {
      errors.push('Session cookie is missing');
      return { isValid: false, errors };
    }

    try {
      // Parse cookie (simplified - in real implementation would handle proper cookie parsing)
      const sessionId = cookie.replace('plh_session=', '').split(';')[0];

      if (!sessionId || sessionId.length < 32) {
        errors.push('Invalid session ID format');
        return { isValid: false, errors };
      }

      // Validate session with authentication service
      const session = authenticationSecurityService.validateSession(sessionId);
      if (!session) {
        errors.push('Session not found or expired');
        return { isValid: false, errors };
      }

      return { isValid: true, sessionId, errors: [] };
    } catch (error) {
      errors.push('Cookie parsing failed');
      return { isValid: false, errors };
    }
  }

  /**
   * Record session activity
   */
  recordSessionActivity(
    sessionId: string,
    userId: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    details?: Record<string, any>
  ): void {
    if (!this.sessionConfig.enableSessionTracking) {
      return;
    }

    const activity: SessionActivity = {
      sessionId,
      userId,
      action,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      details,
    };

    const activities = this.sessionActivities.get(sessionId) || [];
    activities.push(activity);
    this.sessionActivities.set(sessionId, activities);

    // Keep only recent activities (last 100 per session)
    if (activities.length > 100) {
      activities.splice(0, activities.length - 100);
    }
  }

  /**
   * Get session activities
   */
  getSessionActivities(sessionId: string): SessionActivity[] {
    return this.sessionActivities.get(sessionId) || [];
  }

  /**
   * Analyze session activities for suspicious behavior
   */
  private analyzeSessionActivities(): void {
    for (const [sessionId, activities] of this.sessionActivities.entries()) {
      const recentActivities = activities.filter(
        activity => Date.now() - activity.timestamp.getTime() < 60 * 60 * 1000 // Last hour
      );

      if (recentActivities.length === 0) continue;

      // Check for suspicious patterns
      const suspiciousPatterns = this.detectSuspiciousPatterns(recentActivities);
      
      if (suspiciousPatterns.length > 0) {
        console.warn(`Suspicious activity detected in session ${sessionId}:`, suspiciousPatterns);
        
        // In a real implementation, this would trigger security alerts
        // For now, we'll just log the suspicious activity
      }
    }
  }

  /**
   * Detect suspicious patterns in session activities
   */
  private detectSuspiciousPatterns(activities: SessionActivity[]): string[] {
    const patterns: string[] = [];

    // Check for rapid successive actions (potential bot behavior)
    const rapidActions = activities.filter((activity, index) => {
      if (index === 0) return false;
      const timeDiff = activity.timestamp.getTime() - activities[index - 1].timestamp.getTime();
      return timeDiff < 1000; // Less than 1 second between actions
    });

    if (rapidActions.length > 10) {
      patterns.push('Rapid successive actions detected (potential bot behavior)');
    }

    // Check for IP address changes within the same session
    const uniqueIPs = new Set(activities.map(a => a.ipAddress));
    if (uniqueIPs.size > 1) {
      patterns.push('Multiple IP addresses used in same session');
    }

    // Check for unusual user agent changes
    const uniqueUserAgents = new Set(activities.map(a => a.userAgent));
    if (uniqueUserAgents.size > 2) {
      patterns.push('Multiple user agents detected in same session');
    }

    // Check for excessive failed actions
    const failedActions = activities.filter(a => 
      a.action.includes('failed') || a.action.includes('error')
    );
    if (failedActions.length > activities.length * 0.5) {
      patterns.push('High failure rate detected');
    }

    return patterns;
  }

  /**
   * Clean up old session activities
   */
  private cleanupOldActivities(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    let cleanedSessions = 0;

    for (const [sessionId, activities] of this.sessionActivities.entries()) {
      const recentActivities = activities.filter(
        activity => activity.timestamp.getTime() > cutoffTime
      );

      if (recentActivities.length === 0) {
        this.sessionActivities.delete(sessionId);
        cleanedSessions++;
      } else if (recentActivities.length !== activities.length) {
        this.sessionActivities.set(sessionId, recentActivities);
      }
    }

    if (cleanedSessions > 0) {
      console.log(`Cleaned up activities for ${cleanedSessions} sessions`);
    }
  }

  /**
   * Get session security headers
   */
  getSessionSecurityHeaders(): Record<string, string> {
    return {
      'Set-Cookie': this.getSecureCookieDirectives(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }

  /**
   * Get secure cookie directives
   */
  private getSecureCookieDirectives(): string {
    const directives = [];

    if (this.sessionConfig.secureOnly) {
      directives.push('Secure');
    }

    if (this.sessionConfig.httpOnly) {
      directives.push('HttpOnly');
    }

    directives.push(`SameSite=${this.sessionConfig.sameSite}`);
    directives.push('Path=/');

    if (process.env.NODE_ENV === 'production') {
      directives.push('Domain=.peerlearninghub.com');
    }

    return directives.join('; ');
  }

  /**
   * Validate session timeout configuration
   */
  validateSessionTimeout(): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (this.sessionConfig.timeout > 8 * 60 * 60 * 1000) { // 8 hours
      warnings.push('Session timeout is longer than recommended (8 hours)');
    }

    if (this.sessionConfig.timeout < 15 * 60 * 1000) { // 15 minutes
      warnings.push('Session timeout is shorter than recommended (15 minutes)');
    }

    if (this.sessionConfig.renewalThreshold > this.sessionConfig.timeout * 0.5) {
      warnings.push('Renewal threshold is too high relative to session timeout');
    }

    if (this.sessionConfig.maxConcurrentSessions > 10) {
      warnings.push('Maximum concurrent sessions is higher than recommended');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Get session configuration
   */
  getSessionConfiguration(): SessionConfiguration {
    return { ...this.sessionConfig };
  }

  /**
   * Update session configuration
   */
  updateSessionConfiguration(config: Partial<SessionConfiguration>): void {
    this.sessionConfig = { ...this.sessionConfig, ...config };
  }

  /**
   * Generate session fingerprint
   */
  generateSessionFingerprint(userAgent: string, ipAddress: string): string {
    // Create a fingerprint based on user agent and IP
    // In a real implementation, this might include more factors like screen resolution, timezone, etc.
    const combined = `${userAgent}:${ipAddress}:${Date.now()}`;
    
    // Simple hash function (in production, use a proper cryptographic hash)
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate session fingerprint
   */
  validateSessionFingerprint(
    sessionId: string,
    currentFingerprint: string,
    storedFingerprint: string
  ): { isValid: boolean; riskLevel: 'low' | 'medium' | 'high' } {
    if (currentFingerprint === storedFingerprint) {
      return { isValid: true, riskLevel: 'low' };
    }

    // In a real implementation, you might allow some variation in fingerprints
    // and calculate a similarity score
    const similarity = this.calculateFingerprintSimilarity(currentFingerprint, storedFingerprint);
    
    if (similarity > 0.8) {
      return { isValid: true, riskLevel: 'low' };
    } else if (similarity > 0.6) {
      return { isValid: true, riskLevel: 'medium' };
    } else {
      return { isValid: false, riskLevel: 'high' };
    }
  }

  /**
   * Calculate fingerprint similarity (simplified)
   */
  private calculateFingerprintSimilarity(fp1: string, fp2: string): number {
    if (fp1 === fp2) return 1.0;
    
    const maxLength = Math.max(fp1.length, fp2.length);
    const minLength = Math.min(fp1.length, fp2.length);
    
    let matches = 0;
    for (let i = 0; i < minLength; i++) {
      if (fp1[i] === fp2[i]) matches++;
    }
    
    return matches / maxLength;
  }

  /**
   * Get session management report
   */
  getSessionManagementReport(): {
    totalActiveSessions: number;
    averageSessionDuration: number;
    suspiciousActivities: number;
    sessionTimeoutCompliance: boolean;
    cookieSecurityCompliance: boolean;
    recommendations: string[];
  } {
    const activeSessions = authenticationSecurityService.getUserSessions('all'); // This would need to be implemented
    const recommendations: string[] = [];

    // Check session timeout compliance
    const timeoutValidation = this.validateSessionTimeout();
    if (!timeoutValidation.isValid) {
      recommendations.push(...timeoutValidation.warnings);
    }

    // Check cookie security
    if (!this.sessionConfig.secureOnly) {
      recommendations.push('Enable secure-only cookies for production');
    }

    if (!this.sessionConfig.httpOnly) {
      recommendations.push('Enable HTTP-only cookies to prevent XSS');
    }

    if (this.sessionConfig.sameSite !== 'strict') {
      recommendations.push('Use strict SameSite policy for better CSRF protection');
    }

    // Count suspicious activities
    let suspiciousActivities = 0;
    for (const activities of this.sessionActivities.values()) {
      const patterns = this.detectSuspiciousPatterns(activities);
      if (patterns.length > 0) suspiciousActivities++;
    }

    return {
      totalActiveSessions: 0, // Would be calculated from actual sessions
      averageSessionDuration: 0, // Would be calculated from session data
      suspiciousActivities,
      sessionTimeoutCompliance: timeoutValidation.isValid,
      cookieSecurityCompliance: this.sessionConfig.secureOnly && this.sessionConfig.httpOnly,
      recommendations,
    };
  }
}

// Export singleton instance
export const sessionManagementService = SessionManagementService.getInstance();
export default sessionManagementService;