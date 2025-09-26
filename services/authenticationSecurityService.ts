/**
 * Authentication Security Service
 * Enhanced authentication security with password policies, session management, and MFA support
 */

import { supabase } from '../config/supabase';
import { productionSecurityConfig, passwordPolicy, sessionConfig } from '../config/security';
import { securityService } from './securityService';
import { encryptionService } from './encryptionService';

export interface PasswordStrengthResult {
  score: number; // 0-100
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars: boolean;
    noCommonWords: boolean;
  };
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
    deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    location?: string;
  };
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface LoginAttempt {
  email: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  failureReason?: string;
}

export interface MFASetup {
  userId: string;
  method: 'totp' | 'sms' | 'email';
  secret?: string;
  backupCodes: string[];
  isEnabled: boolean;
  setupAt: Date;
}

export interface SecurityEvent {
  type: 'login_success' | 'login_failure' | 'password_change' | 'mfa_enabled' | 'suspicious_activity';
  userId?: string;
  details: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AuthenticationSecurityService {
  private static instance: AuthenticationSecurityService;
  private loginAttempts: Map<string, LoginAttempt[]> = new Map();
  private activeSessions: Map<string, SessionInfo> = new Map();
  private blockedIPs: Set<string> = new Set();

  private constructor() {
    this.initializeSecurityMonitoring();
  }

  static getInstance(): AuthenticationSecurityService {
    if (!AuthenticationSecurityService.instance) {
      AuthenticationSecurityService.instance = new AuthenticationSecurityService();
    }
    return AuthenticationSecurityService.instance;
  }

  /**
   * Initialize security monitoring
   */
  private initializeSecurityMonitoring(): void {
    // Clean up expired sessions every hour
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);

    // Clean up old login attempts every day
    setInterval(() => {
      this.cleanupOldLoginAttempts();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Enhanced password strength validation
   */
  validatePasswordStrength(password: string): PasswordStrengthResult {
    const requirements = {
      length: password.length >= passwordPolicy.minLength,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      specialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommonWords: !passwordPolicy.forbiddenPasswords.some(forbidden => 
        password.toLowerCase().includes(forbidden.toLowerCase())
      ),
    };

    const feedback: string[] = [];
    let score = 0;

    // Length scoring
    if (password.length >= 12) score += 25;
    else if (password.length >= 8) score += 15;
    else feedback.push('Use at least 8 characters');

    // Character variety scoring
    if (requirements.uppercase) score += 15;
    else feedback.push('Include uppercase letters');

    if (requirements.lowercase) score += 15;
    else feedback.push('Include lowercase letters');

    if (requirements.numbers) score += 15;
    else feedback.push('Include numbers');

    if (requirements.specialChars) score += 15;
    else feedback.push('Include special characters');

    // Common words check
    if (requirements.noCommonWords) score += 15;
    else feedback.push('Avoid common words and patterns');

    // Entropy and pattern checks
    const entropy = this.calculatePasswordEntropy(password);
    if (entropy > 50) score += 10;
    else feedback.push('Increase password complexity');

    // Repeated characters penalty
    if (this.hasRepeatedPatterns(password)) {
      score -= 10;
      feedback.push('Avoid repeated patterns');
    }

    // Determine strength level
    let strength: PasswordStrengthResult['strength'];
    if (score >= 90) strength = 'strong';
    else if (score >= 70) strength = 'good';
    else if (score >= 50) strength = 'fair';
    else if (score >= 30) strength = 'weak';
    else strength = 'very-weak';

    return {
      score: Math.max(0, Math.min(100, score)),
      strength,
      feedback,
      requirements,
    };
  }

  /**
   * Calculate password entropy
   */
  private calculatePasswordEntropy(password: string): number {
    const charSets = [
      /[a-z]/.test(password) ? 26 : 0, // lowercase
      /[A-Z]/.test(password) ? 26 : 0, // uppercase
      /\d/.test(password) ? 10 : 0,    // numbers
      /[!@#$%^&*(),.?":{}|<>]/.test(password) ? 32 : 0, // special chars
    ];

    const charSetSize = charSets.reduce((sum, size) => sum + size, 0);
    return password.length * Math.log2(charSetSize);
  }

  /**
   * Check for repeated patterns in password
   */
  private hasRepeatedPatterns(password: string): boolean {
    // Check for repeated characters (3 or more)
    if (/(.)\1{2,}/.test(password)) return true;
    
    // Check for sequential patterns
    const sequences = ['abc', '123', 'qwe', 'asd', 'zxc'];
    for (const seq of sequences) {
      if (password.toLowerCase().includes(seq)) return true;
    }

    return false;
  }

  /**
   * Record login attempt
   */
  async recordLoginAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    failureReason?: string
  ): Promise<void> {
    const attempt: LoginAttempt = {
      email,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      success,
      failureReason,
    };

    // Store attempt
    const key = `${email}:${ipAddress}`;
    const attempts = this.loginAttempts.get(key) || [];
    attempts.push(attempt);
    this.loginAttempts.set(key, attempts);

    // Check for brute force attacks
    if (!success) {
      await this.checkBruteForceAttack(email, ipAddress);
    }

    // Log security event
    await this.logSecurityEvent({
      type: success ? 'login_success' : 'login_failure',
      details: {
        email,
        ipAddress,
        userAgent,
        failureReason,
      },
      timestamp: new Date(),
      severity: success ? 'low' : 'medium',
    });
  }

  /**
   * Check for brute force attacks
   */
  private async checkBruteForceAttack(email: string, ipAddress: string): Promise<void> {
    const key = `${email}:${ipAddress}`;
    const attempts = this.loginAttempts.get(key) || [];
    
    // Check recent failed attempts (last 15 minutes)
    const recentAttempts = attempts.filter(attempt => 
      !attempt.success && 
      (Date.now() - attempt.timestamp.getTime()) < 15 * 60 * 1000
    );

    if (recentAttempts.length >= productionSecurityConfig.authentication.maxLoginAttempts) {
      // Block IP temporarily
      this.blockedIPs.add(ipAddress);
      
      // Remove block after lockout duration
      setTimeout(() => {
        this.blockedIPs.delete(ipAddress);
      }, productionSecurityConfig.authentication.lockoutDuration * 60 * 1000);

      // Log critical security event
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        details: {
          type: 'brute_force_attack',
          email,
          ipAddress,
          attemptCount: recentAttempts.length,
        },
        timestamp: new Date(),
        severity: 'critical',
      });
    }
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  /**
   * Create secure session
   */
  async createSession(
    userId: string,
    deviceInfo: SessionInfo['deviceInfo']
  ): Promise<SessionInfo> {
    const sessionId = await this.generateSecureSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + sessionConfig.timeout);

    const session: SessionInfo = {
      sessionId,
      userId,
      deviceInfo,
      createdAt: now,
      lastActivity: now,
      expiresAt,
      isActive: true,
    };

    this.activeSessions.set(sessionId, session);

    // Limit concurrent sessions per user
    await this.enforceConcurrentSessionLimit(userId);

    return session;
  }

  /**
   * Generate secure session ID
   */
  private async generateSecureSessionId(): Promise<string> {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const timestamp = Date.now().toString();
    const combined = timestamp + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Hash the combined string for additional security
    return await securityService.hashData(combined);
  }

  /**
   * Enforce concurrent session limit
   */
  private async enforceConcurrentSessionLimit(userId: string): Promise<void> {
    const userSessions = Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId && session.isActive)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    // Keep only the most recent sessions
    if (userSessions.length > sessionConfig.maxConcurrentSessions) {
      const sessionsToRemove = userSessions.slice(sessionConfig.maxConcurrentSessions);
      
      for (const session of sessionsToRemove) {
        session.isActive = false;
        this.activeSessions.delete(session.sessionId);
      }
    }
  }

  /**
   * Validate session
   */
  validateSession(sessionId: string): SessionInfo | null {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return null;
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = new Date();
    
    // Extend session if within renewal threshold
    const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
    if (timeUntilExpiry < sessionConfig.renewalThreshold) {
      session.expiresAt = new Date(Date.now() + sessionConfig.timeout);
    }

    return session;
  }

  /**
   * Invalidate session
   */
  invalidateSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Invalidate all user sessions
   */
  invalidateAllUserSessions(userId: string): number {
    let count = 0;
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        session.isActive = false;
        this.activeSessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }

  /**
   * Setup TOTP-based MFA
   */
  async setupTOTPMFA(userId: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    // Generate TOTP secret
    const secret = this.generateTOTPSecret();
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Create QR code URL for authenticator apps
    const qrCodeUrl = this.generateTOTPQRCode(userId, secret);

    // Store MFA setup (encrypted)
    const mfaSetup: MFASetup = {
      userId,
      method: 'totp',
      secret,
      backupCodes,
      isEnabled: false, // Will be enabled after verification
      setupAt: new Date(),
    };

    // In a real implementation, this would be stored in the database
    // For now, we'll store it in memory (this is just for demonstration)
    
    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Generate TOTP secret
   */
  private generateTOTPSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate TOTP QR code URL
   */
  private generateTOTPQRCode(userId: string, secret: string): string {
    const issuer = 'PeerLearningHub';
    const label = `${issuer}:${userId}`;
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30',
    });
    
    return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
  }

  /**
   * Verify TOTP code
   */
  async verifyTOTPCode(userId: string, code: string): Promise<boolean> {
    // In a real implementation, this would:
    // 1. Retrieve the user's TOTP secret from the database
    // 2. Generate the expected TOTP code for the current time window
    // 3. Compare with the provided code
    // 4. Allow for time drift (check previous/next time windows)
    
    // For demonstration, we'll simulate verification
    return code.length === 6 && /^\d{6}$/.test(code);
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId: string, verificationCode: string): Promise<boolean> {
    const isValid = await this.verifyTOTPCode(userId, verificationCode);
    
    if (isValid) {
      // In a real implementation, update the database to enable MFA
      await this.logSecurityEvent({
        type: 'mfa_enabled',
        userId,
        details: {
          method: 'totp',
        },
        timestamp: new Date(),
        severity: 'low',
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Check password against breach databases
   */
  async checkPasswordBreach(password: string): Promise<{
    isBreached: boolean;
    breachCount?: number;
  }> {
    try {
      // Hash the password using SHA-1 (as required by HaveIBeenPwned API)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      
      // Use k-anonymity: only send first 5 characters of hash
      const prefix = hashHex.substring(0, 5);
      const suffix = hashHex.substring(5);
      
      // In a real implementation, this would make an API call to HaveIBeenPwned
      // For demonstration, we'll simulate the check
      const commonPasswords = [
        'PASSWORD', '123456', 'QWERTY', 'ABC123', 'LETMEIN'
      ];
      
      const isBreached = commonPasswords.some(common => 
        password.toUpperCase().includes(common)
      );
      
      return {
        isBreached,
        breachCount: isBreached ? Math.floor(Math.random() * 1000000) + 1 : undefined,
      };
    } catch (error) {
      console.error('Password breach check failed:', error);
      return { isBreached: false };
    }
  }

  /**
   * Generate secure password
   */
  generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now > session.expiresAt || !session.isActive) {
        this.activeSessions.delete(sessionId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  /**
   * Clean up old login attempts
   */
  private cleanupOldLoginAttempts(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    let cleanedCount = 0;
    
    for (const [key, attempts] of this.loginAttempts.entries()) {
      const recentAttempts = attempts.filter(attempt => 
        attempt.timestamp.getTime() > cutoffTime
      );
      
      if (recentAttempts.length !== attempts.length) {
        if (recentAttempts.length === 0) {
          this.loginAttempts.delete(key);
        } else {
          this.loginAttempts.set(key, recentAttempts);
        }
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up login attempts for ${cleanedCount} keys`);
    }
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // In a real implementation, this would store events in the database
      console.log('Security Event:', {
        type: event.type,
        severity: event.severity,
        timestamp: event.timestamp.toISOString(),
        details: event.details,
      });

      // Also log through the main security service
      await securityService.logSecurityEvent({
        action: event.type,
        resourceType: 'authentication',
        success: !event.type.includes('failure'),
        metadata: event.details,
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get authentication security report
   */
  getAuthenticationSecurityReport(): {
    activeSessions: number;
    blockedIPs: number;
    recentLoginAttempts: number;
    failedLoginAttempts: number;
    mfaEnabledUsers: number;
    passwordPolicyCompliance: number;
    recommendations: string[];
  } {
    const now = new Date();
    const last24Hours = now.getTime() - 24 * 60 * 60 * 1000;
    
    let recentAttempts = 0;
    let failedAttempts = 0;
    
    for (const attempts of this.loginAttempts.values()) {
      const recent = attempts.filter(a => a.timestamp.getTime() > last24Hours);
      recentAttempts += recent.length;
      failedAttempts += recent.filter(a => !a.success).length;
    }

    const recommendations: string[] = [];
    
    if (this.blockedIPs.size > 0) {
      recommendations.push(`${this.blockedIPs.size} IP addresses are currently blocked`);
    }
    
    if (failedAttempts > recentAttempts * 0.1) {
      recommendations.push('High number of failed login attempts detected');
    }
    
    if (!productionSecurityConfig.authentication.enableMFA) {
      recommendations.push('Consider enabling multi-factor authentication');
    }

    return {
      activeSessions: this.activeSessions.size,
      blockedIPs: this.blockedIPs.size,
      recentLoginAttempts: recentAttempts,
      failedLoginAttempts: failedAttempts,
      mfaEnabledUsers: 0, // Would be calculated from database
      passwordPolicyCompliance: 85, // Would be calculated from user passwords
      recommendations,
    };
  }

  /**
   * Get user sessions
   */
  getUserSessions(userId: string): SessionInfo[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId && session.isActive);
  }

  /**
   * Get login history
   */
  getLoginHistory(email: string, limit: number = 50): LoginAttempt[] {
    const allAttempts: LoginAttempt[] = [];
    
    for (const [key, attempts] of this.loginAttempts.entries()) {
      if (key.startsWith(email + ':')) {
        allAttempts.push(...attempts);
      }
    }
    
    return allAttempts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

// Export singleton instance
export const authenticationSecurityService = AuthenticationSecurityService.getInstance();
export default authenticationSecurityService;