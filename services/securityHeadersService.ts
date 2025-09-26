/**
 * Security Headers Service
 * Enhanced security headers and Content Security Policy management
 */

import { productionSecurityConfig } from '../config/security';
import { transportSecurityService } from './transportSecurityService';

export interface SecurityHeadersConfig {
  contentSecurityPolicy: CSPConfig;
  strictTransportSecurity: HSTSConfig;
  frameOptions: FrameOptionsConfig;
  contentTypeOptions: ContentTypeOptionsConfig;
  referrerPolicy: ReferrerPolicyConfig;
  permissionsPolicy: PermissionsPolicyConfig;
  crossOriginPolicies: CrossOriginPoliciesConfig;
}

export interface CSPConfig {
  enabled: boolean;
  reportOnly: boolean;
  directives: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    fontSrc: string[];
    connectSrc: string[];
    mediaSrc: string[];
    objectSrc: string[];
    frameSrc: string[];
    baseUri: string[];
    formAction: string[];
    frameAncestors: string[];
    upgradeInsecureRequests: boolean;
    blockAllMixedContent: boolean;
  };
  reportUri?: string;
  nonce?: boolean;
}

export interface HSTSConfig {
  enabled: boolean;
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
}

export interface FrameOptionsConfig {
  enabled: boolean;
  policy: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  allowFrom?: string;
}

export interface ContentTypeOptionsConfig {
  enabled: boolean;
  nosniff: boolean;
}

export interface ReferrerPolicyConfig {
  enabled: boolean;
  policy: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
}

export interface PermissionsPolicyConfig {
  enabled: boolean;
  policies: {
    geolocation: string[];
    microphone: string[];
    camera: string[];
    payment: string[];
    usb: string[];
    accelerometer: string[];
    gyroscope: string[];
    magnetometer: string[];
    notifications: string[];
    push: string[];
    speaker: string[];
    vibrate: string[];
    fullscreen: string[];
    displayCapture: string[];
  };
}

export interface CrossOriginPoliciesConfig {
  embedderPolicy: 'unsafe-none' | 'require-corp';
  openerPolicy: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin';
  resourcePolicy: 'same-site' | 'same-origin' | 'cross-origin';
}

export interface SecurityHeaderValidationResult {
  isValid: boolean;
  score: number;
  issues: Array<{
    header: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    recommendation: string;
  }>;
  recommendations: string[];
}

export class SecurityHeadersService {
  private static instance: SecurityHeadersService;
  private config: SecurityHeadersConfig;
  private nonceCache: Map<string, { nonce: string; timestamp: Date }> = new Map();

  private constructor() {
    this.initializeSecurityHeaders();
  }

  static getInstance(): SecurityHeadersService {
    if (!SecurityHeadersService.instance) {
      SecurityHeadersService.instance = new SecurityHeadersService();
    }
    return SecurityHeadersService.instance;
  }

  /**
   * Initialize security headers configuration
   */
  private initializeSecurityHeaders(): void {
    this.config = {
      contentSecurityPolicy: {
        enabled: true,
        reportOnly: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://js.revenuecat.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https:"],
          connectSrc: ["'self'", "https://*.supabase.co", "https://api.revenuecat.com"],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: true,
          blockAllMixedContent: false,
        },
        reportUri: '/api/csp-report',
        nonce: true,
      },
      strictTransportSecurity: {
        enabled: true,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameOptions: {
        enabled: true,
        policy: 'DENY',
      },
      contentTypeOptions: {
        enabled: true,
        nosniff: true,
      },
      referrerPolicy: {
        enabled: true,
        policy: 'strict-origin-when-cross-origin',
      },
      permissionsPolicy: {
        enabled: true,
        policies: {
          geolocation: [],
          microphone: [],
          camera: [],
          payment: [],
          usb: [],
          accelerometer: [],
          gyroscope: [],
          magnetometer: [],
          notifications: ["'self'"],
          push: ["'self'"],
          speaker: ["'self'"],
          vibrate: ["'self'"],
          fullscreen: ["'self'"],
          displayCapture: [],
        },
      },
      crossOriginPolicies: {
        embedderPolicy: 'require-corp',
        openerPolicy: 'same-origin',
        resourcePolicy: 'same-origin',
      },
    };
  }

  /**
   * Generate all security headers
   */
  generateSecurityHeaders(options?: {
    nonce?: string;
    reportOnly?: boolean;
    customDirectives?: Partial<CSPConfig['directives']>;
  }): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (this.config.contentSecurityPolicy.enabled) {
      const cspHeader = this.generateCSPHeader(options);
      const headerName = (options?.reportOnly || this.config.contentSecurityPolicy.reportOnly) 
        ? 'Content-Security-Policy-Report-Only' 
        : 'Content-Security-Policy';
      headers[headerName] = cspHeader;
    }

    // Strict Transport Security
    if (this.config.strictTransportSecurity.enabled) {
      headers['Strict-Transport-Security'] = this.generateHSTSHeader();
    }

    // X-Frame-Options
    if (this.config.frameOptions.enabled) {
      headers['X-Frame-Options'] = this.generateFrameOptionsHeader();
    }

    // X-Content-Type-Options
    if (this.config.contentTypeOptions.enabled) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // Referrer Policy
    if (this.config.referrerPolicy.enabled) {
      headers['Referrer-Policy'] = this.config.referrerPolicy.policy;
    }

    // Permissions Policy
    if (this.config.permissionsPolicy.enabled) {
      headers['Permissions-Policy'] = this.generatePermissionsPolicyHeader();
    }

    // Cross-Origin Policies
    headers['Cross-Origin-Embedder-Policy'] = this.config.crossOriginPolicies.embedderPolicy;
    headers['Cross-Origin-Opener-Policy'] = this.config.crossOriginPolicies.openerPolicy;
    headers['Cross-Origin-Resource-Policy'] = this.config.crossOriginPolicies.resourcePolicy;

    // Additional security headers
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';

    return headers;
  }

  /**
   * Generate Content Security Policy header
   */
  generateCSPHeader(options?: {
    nonce?: string;
    customDirectives?: Partial<CSPConfig['directives']>;
  }): string {
    const directives = { ...this.config.contentSecurityPolicy.directives };
    
    // Apply custom directives if provided
    if (options?.customDirectives) {
      Object.assign(directives, options.customDirectives);
    }

    // Add nonce to script-src if enabled and provided
    if (this.config.contentSecurityPolicy.nonce && options?.nonce) {
      directives.scriptSrc = [...directives.scriptSrc, `'nonce-${options.nonce}'`];
      directives.styleSrc = [...directives.styleSrc, `'nonce-${options.nonce}'`];
    }

    const cspParts: string[] = [];

    // Add directive-based policies
    for (const [directive, sources] of Object.entries(directives)) {
      if (Array.isArray(sources) && sources.length > 0) {
        const kebabDirective = this.camelToKebab(directive);
        cspParts.push(`${kebabDirective} ${sources.join(' ')}`);
      }
    }

    // Add boolean directives
    if (directives.upgradeInsecureRequests) {
      cspParts.push('upgrade-insecure-requests');
    }

    if (directives.blockAllMixedContent) {
      cspParts.push('block-all-mixed-content');
    }

    // Add report URI if configured
    if (this.config.contentSecurityPolicy.reportUri) {
      cspParts.push(`report-uri ${this.config.contentSecurityPolicy.reportUri}`);
    }

    return cspParts.join('; ');
  }

  /**
   * Generate HSTS header
   */
  private generateHSTSHeader(): string {
    const hsts = this.config.strictTransportSecurity;
    let header = `max-age=${hsts.maxAge}`;
    
    if (hsts.includeSubDomains) {
      header += '; includeSubDomains';
    }
    
    if (hsts.preload) {
      header += '; preload';
    }
    
    return header;
  }

  /**
   * Generate X-Frame-Options header
   */
  private generateFrameOptionsHeader(): string {
    const frameOptions = this.config.frameOptions;
    
    if (frameOptions.policy === 'ALLOW-FROM' && frameOptions.allowFrom) {
      return `ALLOW-FROM ${frameOptions.allowFrom}`;
    }
    
    return frameOptions.policy;
  }

  /**
   * Generate Permissions Policy header
   */
  private generatePermissionsPolicyHeader(): string {
    const policies = this.config.permissionsPolicy.policies;
    const policyParts: string[] = [];

    for (const [feature, allowlist] of Object.entries(policies)) {
      const kebabFeature = this.camelToKebab(feature);
      if (allowlist.length === 0) {
        policyParts.push(`${kebabFeature}=()`);
      } else {
        const sources = allowlist.map(source => 
          source === "'self'" ? 'self' : `"${source}"`
        ).join(' ');
        policyParts.push(`${kebabFeature}=(${sources})`);
      }
    }

    return policyParts.join(', ');
  }

  /**
   * Generate nonce for CSP
   */
  generateNonce(requestId?: string): string {
    const key = requestId || 'default';
    
    // Check cache for existing nonce
    const cached = this.nonceCache.get(key);
    if (cached && Date.now() - cached.timestamp.getTime() < 60000) { // 1 minute cache
      return cached.nonce;
    }

    // Generate new nonce
    const nonce = this.generateSecureNonce();
    this.nonceCache.set(key, { nonce, timestamp: new Date() });

    // Clean up old nonces
    this.cleanupNonceCache();

    return nonce;
  }

  /**
   * Generate secure nonce
   */
  private generateSecureNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Clean up old nonces from cache
   */
  private cleanupNonceCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, value] of this.nonceCache.entries()) {
      if (now - value.timestamp.getTime() > 300000) { // 5 minutes
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.nonceCache.delete(key);
    }
  }

  /**
   * Validate security headers
   */
  validateSecurityHeaders(headers: Record<string, string>): SecurityHeaderValidationResult {
    const issues: SecurityHeaderValidationResult['issues'] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check Content Security Policy
    if (!headers['Content-Security-Policy'] && !headers['Content-Security-Policy-Report-Only']) {
      issues.push({
        header: 'Content-Security-Policy',
        severity: 'high',
        message: 'Missing Content Security Policy header',
        recommendation: 'Implement a strict CSP to prevent XSS attacks',
      });
      score -= 20;
    } else {
      const csp = headers['Content-Security-Policy'] || headers['Content-Security-Policy-Report-Only'];
      const cspIssues = this.validateCSP(csp);
      issues.push(...cspIssues);
      score -= cspIssues.length * 5;
    }

    // Check HSTS
    if (!headers['Strict-Transport-Security']) {
      issues.push({
        header: 'Strict-Transport-Security',
        severity: 'high',
        message: 'Missing HSTS header',
        recommendation: 'Enable HSTS to prevent protocol downgrade attacks',
      });
      score -= 15;
    } else {
      const hstsIssues = this.validateHSTS(headers['Strict-Transport-Security']);
      issues.push(...hstsIssues);
      score -= hstsIssues.length * 3;
    }

    // Check X-Frame-Options
    if (!headers['X-Frame-Options']) {
      issues.push({
        header: 'X-Frame-Options',
        severity: 'medium',
        message: 'Missing X-Frame-Options header',
        recommendation: 'Set X-Frame-Options to prevent clickjacking attacks',
      });
      score -= 10;
    }

    // Check X-Content-Type-Options
    if (!headers['X-Content-Type-Options']) {
      issues.push({
        header: 'X-Content-Type-Options',
        severity: 'medium',
        message: 'Missing X-Content-Type-Options header',
        recommendation: 'Set X-Content-Type-Options: nosniff to prevent MIME type sniffing',
      });
      score -= 10;
    }

    // Check Referrer Policy
    if (!headers['Referrer-Policy']) {
      issues.push({
        header: 'Referrer-Policy',
        severity: 'low',
        message: 'Missing Referrer-Policy header',
        recommendation: 'Set Referrer-Policy to control referrer information',
      });
      score -= 5;
    }

    // Check Cross-Origin policies
    if (!headers['Cross-Origin-Embedder-Policy']) {
      recommendations.push('Consider adding Cross-Origin-Embedder-Policy for better isolation');
    }

    if (!headers['Cross-Origin-Opener-Policy']) {
      recommendations.push('Consider adding Cross-Origin-Opener-Policy for popup security');
    }

    // Generate additional recommendations
    if (issues.filter(i => i.severity === 'high').length > 0) {
      recommendations.push('Address high-severity security header issues immediately');
    }

    if (issues.filter(i => i.severity === 'medium').length > 2) {
      recommendations.push('Review and implement missing security headers');
    }

    return {
      isValid: issues.filter(i => i.severity === 'high' || i.severity === 'critical').length === 0,
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  }

  /**
   * Validate Content Security Policy
   */
  private validateCSP(csp: string): SecurityHeaderValidationResult['issues'] {
    const issues: SecurityHeaderValidationResult['issues'] = [];

    // Check for unsafe directives
    if (csp.includes("'unsafe-eval'")) {
      issues.push({
        header: 'Content-Security-Policy',
        severity: 'high',
        message: "CSP contains 'unsafe-eval' which allows dangerous code execution",
        recommendation: "Remove 'unsafe-eval' and use safer alternatives",
      });
    }

    if (csp.includes("'unsafe-inline'") && !csp.includes("'nonce-")) {
      issues.push({
        header: 'Content-Security-Policy',
        severity: 'medium',
        message: "CSP contains 'unsafe-inline' without nonces",
        recommendation: "Use nonces or hashes instead of 'unsafe-inline'",
      });
    }

    // Check for wildcard sources
    if (csp.includes('*') && !csp.includes('*.')) {
      issues.push({
        header: 'Content-Security-Policy',
        severity: 'medium',
        message: 'CSP contains wildcard (*) sources',
        recommendation: 'Use specific domains instead of wildcards',
      });
    }

    // Check for missing important directives
    if (!csp.includes('object-src')) {
      issues.push({
        header: 'Content-Security-Policy',
        severity: 'low',
        message: 'CSP missing object-src directive',
        recommendation: "Add 'object-src 'none'' to prevent plugin execution",
      });
    }

    if (!csp.includes('base-uri')) {
      issues.push({
        header: 'Content-Security-Policy',
        severity: 'low',
        message: 'CSP missing base-uri directive',
        recommendation: "Add 'base-uri 'self'' to prevent base tag injection",
      });
    }

    return issues;
  }

  /**
   * Validate HSTS header
   */
  private validateHSTS(hsts: string): SecurityHeaderValidationResult['issues'] {
    const issues: SecurityHeaderValidationResult['issues'] = [];

    // Extract max-age value
    const maxAgeMatch = hsts.match(/max-age=(\d+)/);
    if (!maxAgeMatch) {
      issues.push({
        header: 'Strict-Transport-Security',
        severity: 'high',
        message: 'HSTS header missing max-age directive',
        recommendation: 'Add max-age directive to HSTS header',
      });
    } else {
      const maxAge = parseInt(maxAgeMatch[1]);
      if (maxAge < 31536000) { // 1 year
        issues.push({
          header: 'Strict-Transport-Security',
          severity: 'medium',
          message: 'HSTS max-age is less than 1 year',
          recommendation: 'Set HSTS max-age to at least 31536000 (1 year)',
        });
      }
    }

    // Check for includeSubDomains
    if (!hsts.includes('includeSubDomains')) {
      issues.push({
        header: 'Strict-Transport-Security',
        severity: 'low',
        message: 'HSTS header missing includeSubDomains',
        recommendation: 'Add includeSubDomains to HSTS for better security',
      });
    }

    return issues;
  }

  /**
   * Convert camelCase to kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Update security headers configuration
   */
  updateConfiguration(config: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): SecurityHeadersConfig {
    return { ...this.config };
  }

  /**
   * Generate CSP report endpoint handler
   */
  handleCSPReport(report: any): void {
    console.warn('CSP Violation Report:', {
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
      blockedUri: report['blocked-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
    });

    // In a real implementation, you would:
    // 1. Log the violation to a monitoring system
    // 2. Analyze patterns in violations
    // 3. Update CSP policies based on legitimate violations
    // 4. Alert on suspicious violation patterns
  }

  /**
   * Generate security headers report
   */
  getSecurityHeadersReport(): {
    configurationScore: number;
    enabledHeaders: string[];
    missingHeaders: string[];
    securityIssues: number;
    recommendations: string[];
    cspDirectives: number;
    hstsMaxAge: number;
  } {
    const headers = this.generateSecurityHeaders();
    const validation = this.validateSecurityHeaders(headers);
    
    const enabledHeaders = Object.keys(headers);
    const allPossibleHeaders = [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Embedder-Policy',
      'Cross-Origin-Opener-Policy',
      'Cross-Origin-Resource-Policy',
    ];
    
    const missingHeaders = allPossibleHeaders.filter(header => !enabledHeaders.includes(header));
    
    return {
      configurationScore: validation.score,
      enabledHeaders,
      missingHeaders,
      securityIssues: validation.issues.length,
      recommendations: validation.recommendations,
      cspDirectives: Object.keys(this.config.contentSecurityPolicy.directives).length,
      hstsMaxAge: this.config.strictTransportSecurity.maxAge,
    };
  }
}

// Export singleton instance
export const securityHeadersService = SecurityHeadersService.getInstance();
export default securityHeadersService;