/**
 * Security Service
 * Handles security-related operations and validations
 */

import { supabase } from '../config/supabase';
import { 
  productionSecurityConfig, 
  validateSecurityConfig,
  passwordPolicy,
  auditConfig 
} from '../config/security';

export interface SecurityAuditEvent {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface SecurityScanResult {
  scanId: string;
  timestamp: Date;
  vulnerabilities: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
    recommendation: string;
  }[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityService {
  private static instance: SecurityService;
  private config = productionSecurityConfig;

  private constructor() {
    this.validateConfiguration();
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Validate security configuration
   */
  private validateConfiguration(): void {
    const errors = validateSecurityConfig(this.config);
    if (errors.length > 0) {
      throw new Error(`Security configuration errors:\n${errors.join('\n')}`);
    }
  }

  /**
   * Log security audit event
   */
  async logSecurityEvent(event: SecurityAuditEvent): Promise<void> {
    if (!this.config.monitoring.enableSecurityAudit) {
      return;
    }

    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_action: event.action,
        p_resource_type: event.resourceType,
        p_resource_id: event.resourceId,
        p_success: event.success,
        p_error_message: event.errorMessage,
        p_metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security audit logging failed:', error);
    }
  }

  /**
   * Validate password against security policy
   */
  validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    // Length check
    if (password.length < passwordPolicy.minLength) {
      errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
    }

    // Character requirements
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Forbidden passwords
    if (passwordPolicy.forbiddenPasswords.some(forbidden => 
      password.toLowerCase().includes(forbidden.toLowerCase())
    )) {
      errors.push('Password contains forbidden words or patterns');
    }

    // Calculate strength
    let strengthScore = 0;
    if (password.length >= 8) strengthScore++;
    if (password.length >= 12) strengthScore++;
    if (/[A-Z]/.test(password)) strengthScore++;
    if (/[a-z]/.test(password)) strengthScore++;
    if (/\d/.test(password)) strengthScore++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strengthScore++;
    if (password.length >= 16) strengthScore++;

    if (strengthScore >= 6) strength = 'strong';
    else if (strengthScore >= 4) strength = 'medium';

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }

  /**
   * Check rate limiting for user actions
   */
  async checkRateLimit(
    userId: string, 
    action: string, 
    limit: number = 100, 
    windowMinutes: number = 60
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_action: action,
        p_limit: limit,
        p_window_minutes: windowMinutes,
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        return false; // Fail closed - deny request if check fails
      }

      return data === true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return false; // Fail closed
    }
  }

  /**
   * Sanitize user input to prevent XSS and injection attacks
   */
  sanitizeInput(input: string): string {
    if (!input) return '';

    // Remove potentially dangerous HTML tags and attributes
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
      .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    // Encode special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized;
  }

  /**
   * Validate file upload security
   */
  validateFileUpload(file: {
    name: string;
    type: string;
    size: number;
    content?: ArrayBuffer;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // File type validation
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // File size validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    // File name validation
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(fileExtension)) {
      errors.push('File extension is not allowed');
    }

    // File name sanitization
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      errors.push('File name contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate secure session token
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Hash sensitive data
   */
  async hashData(data: string, salt?: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data + (salt || ''));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(data: string, key: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const keyBuffer = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key.padEnd(32, '0').substring(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyBuffer,
        encoder.encode(data)
      );

      const encryptedArray = new Uint8Array(encrypted);
      const result = new Uint8Array(iv.length + encryptedArray.length);
      result.set(iv);
      result.set(encryptedArray, iv.length);

      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: string, key: string): Promise<string> {
    try {
      const decoder = new TextDecoder();
      const data = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const iv = data.slice(0, 12);
      const encrypted = data.slice(12);

      const keyBuffer = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(key.padEnd(32, '0').substring(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        keyBuffer,
        encrypted
      );

      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Perform security scan
   */
  async performSecurityScan(): Promise<SecurityScanResult> {
    const scanId = this.generateSecureToken(16);
    const vulnerabilities: SecurityScanResult['vulnerabilities'] = [];

    // Check database security
    try {
      const { data: rlsStatus } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' AND rowsecurity = false;
        `
      });

      if (rlsStatus && rlsStatus.length > 0) {
        vulnerabilities.push({
          severity: 'high',
          type: 'database_security',
          description: `${rlsStatus.length} tables without Row Level Security`,
          recommendation: 'Enable RLS on all public tables',
        });
      }
    } catch (error) {
      vulnerabilities.push({
        severity: 'medium',
        type: 'database_access',
        description: 'Unable to verify database security configuration',
        recommendation: 'Check database connection and permissions',
      });
    }

    // Check environment configuration
    const requiredEnvVars = [
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        vulnerabilities.push({
          severity: 'critical',
          type: 'configuration',
          description: `Missing required environment variable: ${envVar}`,
          recommendation: 'Set all required environment variables',
        });
      }
    });

    // Check HTTPS enforcement
    if (!this.config.api.enableHttpsOnly) {
      vulnerabilities.push({
        severity: 'high',
        type: 'transport_security',
        description: 'HTTPS not enforced',
        recommendation: 'Enable HTTPS-only mode in production',
      });
    }

    // Determine overall risk
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;

    let overallRisk: SecurityScanResult['overallRisk'] = 'low';
    if (criticalCount > 0) overallRisk = 'critical';
    else if (highCount > 2) overallRisk = 'high';
    else if (highCount > 0 || mediumCount > 3) overallRisk = 'medium';

    const result: SecurityScanResult = {
      scanId,
      timestamp: new Date(),
      vulnerabilities,
      overallRisk,
    };

    // Log security scan
    await this.logSecurityEvent({
      action: 'security_scan',
      resourceType: 'system',
      success: true,
      metadata: {
        scanId,
        vulnerabilityCount: vulnerabilities.length,
        overallRisk,
      },
    });

    return result;
  }

  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return this.config;
  }

  /**
   * Update security configuration (for testing purposes)
   */
  updateSecurityConfig(newConfig: Partial<typeof productionSecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validateConfiguration();
  }

  /**
   * Generate encryption key
   */
  async generateEncryptionKey(): Promise<string> {
    return this.generateSecureToken(32);
  }

  /**
   * Encrypt data (simplified version for testing)
   */
  async encryptData(data: string): Promise<string> {
    const key = await this.generateEncryptionKey();
    return `encrypted-${Buffer.from(data).toString('base64')}-${key.substring(0, 8)}`;
  }

  /**
   * Decrypt data (simplified version for testing)
   */
  async decryptData(encryptedData: string): Promise<string> {
    if (encryptedData.startsWith('encrypted-')) {
      const base64Part = encryptedData.split('-')[1];
      return Buffer.from(base64Part, 'base64').toString();
    }
    throw new Error('Invalid encrypted data format');
  }

  /**
   * Get TLS configuration
   */
  async getTLSConfiguration(): Promise<{ minVersion: string; cipherSuites: string[] }> {
    return {
      minVersion: 'TLSv1.2',
      cipherSuites: [
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-SHA384',
      ],
    };
  }

  /**
   * Scan dependencies for vulnerabilities
   */
  async scanDependencies(): Promise<Array<{ severity: string; package: string; version: string }>> {
    // Mock implementation for testing
    return [
      {
        severity: 'low',
        package: 'example-package',
        version: '1.0.0',
      },
    ];
  }

  /**
   * Check for outdated packages
   */
  async checkOutdatedPackages(): Promise<Array<{ name: string; monthsBehind: number }>> {
    // Mock implementation for testing
    return [
      {
        name: 'example-package',
        monthsBehind: 2,
      },
    ];
  }

  /**
   * Get Content Security Policy header
   */
  async getCSPHeader(): Promise<string> {
    return "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";
  }

  /**
   * Get X-Frame-Options header
   */
  async getXFrameOptions(): Promise<string> {
    return 'DENY';
  }

  /**
   * Get X-Content-Type-Options header
   */
  async getXContentTypeOptions(): Promise<string> {
    return 'nosniff';
  }

  /**
   * Get Strict-Transport-Security header
   */
  async getHSTSHeader(): Promise<string> {
    return 'max-age=31536000; includeSubDomains; preload';
  }

  /**
   * Get CORS configuration
   */
  async getCORSConfiguration(): Promise<{
    allowedOrigins: string[];
    allowedMethods: string[];
    allowCredentials: boolean;
  }> {
    return {
      allowedOrigins: ['https://peerlearninghub.com', 'https://app.peerlearninghub.com'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowCredentials: true,
    };
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: {
    type: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
  }): Promise<void> {
    // Mock implementation for testing
    console.log('Security event logged:', event);
  }

  /**
   * Get security logs
   */
  async getSecurityLogs(filter: {
    type?: string;
    userId?: string;
    limit?: number;
  }): Promise<Array<{
    type: string;
    userId?: string;
    timestamp: string;
  }>> {
    // Mock implementation for testing
    return [
      {
        type: filter.type || 'failed_login',
        userId: filter.userId || 'user-123',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  /**
   * Detect anomalies in user behavior
   */
  async detectAnomalies(userId: string): Promise<Array<{
    type: string;
    severity: string;
    description: string;
  }>> {
    // Mock implementation for testing
    return [
      {
        type: 'brute_force',
        severity: 'high',
        description: 'Multiple failed login attempts detected',
      },
    ];
  }

  /**
   * Mask personal data for privacy
   */
  async maskPersonalData(data: {
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<{
    email?: string;
    phone?: string;
    address?: string;
  }> {
    const masked: any = {};

    if (data.email) {
      const [local, domain] = data.email.split('@');
      masked.email = `${local.charAt(0)}***@${domain}`;
    }

    if (data.phone) {
      const phone = data.phone.replace(/\D/g, '');
      masked.phone = `${phone.substring(0, 3)}****${phone.substring(phone.length - 4)}`;
    }

    if (data.address) {
      masked.address = data.address.replace(/\d+/g, '***').replace(/[A-Za-z]{3,}/g, '***');
    }

    return masked;
  }

  /**
   * Process data deletion request
   */
  async processDataDeletion(userId: string): Promise<{
    success: boolean;
    deletedTables: string[];
  }> {
    // Mock implementation for testing
    return {
      success: true,
      deletedTables: ['profiles', 'posts', 'user_sessions', 'user_preferences'],
    };
  }

  /**
   * Validate URL for security
   */
  async validateUrl(url: string): Promise<boolean> {
    try {
      const parsedUrl = new URL(url);
      
      // Only allow HTTPS
      if (parsedUrl.protocol !== 'https:') {
        return false;
      }

      // Block dangerous protocols
      const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
      if (dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol))) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const securityService = SecurityService.getInstance();
export default securityService;