/**
 * Transport Security Service
 * Handles HTTPS enforcement, TLS configuration, and secure communication
 */

import { productionSecurityConfig } from '../config/security';

export interface TLSConfiguration {
  minVersion: string;
  maxVersion: string;
  cipherSuites: string[];
  enableHSTS: boolean;
  hstsMaxAge: number;
  includeSubdomains: boolean;
  preload: boolean;
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
  algorithm: string;
}

export interface SecurityHeaders {
  [key: string]: string;
}

export class TransportSecurityService {
  private static instance: TransportSecurityService;
  private tlsConfig: TLSConfiguration;

  private constructor() {
    this.initializeTLSConfig();
  }

  static getInstance(): TransportSecurityService {
    if (!TransportSecurityService.instance) {
      TransportSecurityService.instance = new TransportSecurityService();
    }
    return TransportSecurityService.instance;
  }

  /**
   * Initialize TLS configuration
   */
  private initializeTLSConfig(): void {
    this.tlsConfig = {
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      cipherSuites: [
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'DHE-RSA-AES256-GCM-SHA384',
        'DHE-RSA-AES128-GCM-SHA256',
      ],
      enableHSTS: true,
      hstsMaxAge: 31536000, // 1 year
      includeSubdomains: true,
      preload: true,
    };
  }

  /**
   * Get security headers for HTTP responses
   */
  getSecurityHeaders(): SecurityHeaders {
    const headers: SecurityHeaders = {};

    if (productionSecurityConfig.headers.enableSecurityHeaders) {
      // Strict Transport Security
      if (this.tlsConfig.enableHSTS) {
        let hstsValue = `max-age=${this.tlsConfig.hstsMaxAge}`;
        if (this.tlsConfig.includeSubdomains) {
          hstsValue += '; includeSubDomains';
        }
        if (this.tlsConfig.preload) {
          hstsValue += '; preload';
        }
        headers['Strict-Transport-Security'] = hstsValue;
      }

      // Content Security Policy
      headers['Content-Security-Policy'] = productionSecurityConfig.headers.contentSecurityPolicy;

      // X-Frame-Options
      headers['X-Frame-Options'] = productionSecurityConfig.headers.xFrameOptions;

      // X-Content-Type-Options
      headers['X-Content-Type-Options'] = productionSecurityConfig.headers.xContentTypeOptions;

      // Referrer Policy
      headers['Referrer-Policy'] = productionSecurityConfig.headers.referrerPolicy;

      // Additional security headers
      headers['X-XSS-Protection'] = '1; mode=block';
      headers['X-Permitted-Cross-Domain-Policies'] = 'none';
      headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
      headers['Cross-Origin-Opener-Policy'] = 'same-origin';
      headers['Cross-Origin-Resource-Policy'] = 'same-origin';
      headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=(), payment=(), usb=()';
      
      // Cache control for sensitive pages
      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }

    return headers;
  }

  /**
   * Validate HTTPS enforcement
   */
  validateHTTPSEnforcement(url: string): { isSecure: boolean; issues: string[] } {
    const issues: string[] = [];
    let isSecure = true;

    try {
      const parsedUrl = new URL(url);

      // Check protocol
      if (parsedUrl.protocol !== 'https:') {
        issues.push('URL does not use HTTPS protocol');
        isSecure = false;
      }

      // Check for mixed content risks
      if (parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'localhost') {
        issues.push('Using localhost with HTTPS may cause certificate issues');
      }

      // Check for weak TLS versions (this would be done server-side)
      // For client-side, we can only validate the URL structure

    } catch (error) {
      issues.push('Invalid URL format');
      isSecure = false;
    }

    return { isSecure, issues };
  }

  /**
   * Get TLS configuration
   */
  getTLSConfiguration(): TLSConfiguration {
    return { ...this.tlsConfig };
  }

  /**
   * Update TLS configuration
   */
  updateTLSConfiguration(config: Partial<TLSConfiguration>): void {
    this.tlsConfig = { ...this.tlsConfig, ...config };
  }

  /**
   * Validate TLS configuration
   */
  validateTLSConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check minimum TLS version
    const supportedVersions = ['TLSv1.2', 'TLSv1.3'];
    if (!supportedVersions.includes(this.tlsConfig.minVersion)) {
      errors.push(`Unsupported minimum TLS version: ${this.tlsConfig.minVersion}`);
    }

    // Check cipher suites
    if (this.tlsConfig.cipherSuites.length === 0) {
      errors.push('No cipher suites configured');
    }

    // Check HSTS configuration
    if (this.tlsConfig.enableHSTS) {
      if (this.tlsConfig.hstsMaxAge < 86400) { // 1 day minimum
        errors.push('HSTS max-age should be at least 86400 seconds (1 day)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check certificate validity (mock implementation for client-side)
   */
  async checkCertificateValidity(hostname: string): Promise<{
    isValid: boolean;
    certificate?: CertificateInfo;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // In a real implementation, this would check the actual certificate
      // For now, we'll simulate certificate validation
      
      const mockCertificate: CertificateInfo = {
        subject: `CN=${hostname}`,
        issuer: 'CN=Let\'s Encrypt Authority X3',
        validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        fingerprint: 'SHA256:1234567890abcdef...',
        algorithm: 'RSA-2048',
      };

      // Check if certificate is expired
      const now = new Date();
      if (now < mockCertificate.validFrom) {
        errors.push('Certificate is not yet valid');
      }
      if (now > mockCertificate.validTo) {
        errors.push('Certificate has expired');
      }

      // Check if certificate will expire soon (within 30 days)
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (mockCertificate.validTo < thirtyDaysFromNow) {
        errors.push('Certificate will expire within 30 days');
      }

      return {
        isValid: errors.length === 0,
        certificate: mockCertificate,
        errors,
      };
    } catch (error) {
      errors.push(`Certificate validation failed: ${error}`);
      return {
        isValid: false,
        errors,
      };
    }
  }

  /**
   * Generate Content Security Policy
   */
  generateCSP(options: {
    allowInlineStyles?: boolean;
    allowInlineScripts?: boolean;
    allowEval?: boolean;
    additionalSources?: { [directive: string]: string[] };
  } = {}): string {
    const csp: { [key: string]: string[] } = {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'https:'],
      'connect-src': ["'self'", 'https://*.supabase.co', 'https://api.revenuecat.com'],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': [],
    };

    // Add conditional directives
    if (options.allowInlineStyles) {
      csp['style-src'].push("'unsafe-inline'");
    }

    if (options.allowInlineScripts) {
      csp['script-src'].push("'unsafe-inline'");
    }

    if (options.allowEval) {
      csp['script-src'].push("'unsafe-eval'");
    }

    // Add additional sources
    if (options.additionalSources) {
      for (const [directive, sources] of Object.entries(options.additionalSources)) {
        if (csp[directive]) {
          csp[directive].push(...sources);
        } else {
          csp[directive] = sources;
        }
      }
    }

    // Convert to CSP string
    const cspString = Object.entries(csp)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive;
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .join('; ');

    return cspString;
  }

  /**
   * Validate CSP header
   */
  validateCSP(cspHeader: string): { isValid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Parse CSP directives
      const directives = cspHeader.split(';').map(d => d.trim());
      const parsedDirectives: { [key: string]: string[] } = {};

      for (const directive of directives) {
        const parts = directive.split(/\s+/);
        const directiveName = parts[0];
        const sources = parts.slice(1);
        parsedDirectives[directiveName] = sources;
      }

      // Check for dangerous directives
      if (parsedDirectives['script-src']?.includes("'unsafe-eval'")) {
        warnings.push("'unsafe-eval' in script-src can be dangerous");
      }

      if (parsedDirectives['script-src']?.includes("'unsafe-inline'")) {
        warnings.push("'unsafe-inline' in script-src reduces XSS protection");
      }

      if (parsedDirectives['object-src'] && !parsedDirectives['object-src'].includes("'none'")) {
        warnings.push("object-src should be set to 'none' for better security");
      }

      // Check for missing important directives
      if (!parsedDirectives['default-src']) {
        errors.push('Missing default-src directive');
      }

      if (!parsedDirectives['script-src']) {
        warnings.push('Missing script-src directive');
      }

    } catch (error) {
      errors.push(`CSP parsing error: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Get CORS configuration
   */
  getCORSConfiguration(): {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    allowCredentials: boolean;
    maxAge: number;
  } {
    return {
      allowedOrigins: productionSecurityConfig.api.allowedOrigins,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-API-Key',
      ],
      allowCredentials: true,
      maxAge: 86400, // 24 hours
    };
  }

  /**
   * Validate CORS configuration
   */
  validateCORSConfiguration(origin: string): boolean {
    const allowedOrigins = productionSecurityConfig.api.allowedOrigins;
    
    // Allow exact matches
    if (allowedOrigins.includes(origin)) {
      return true;
    }

    // Allow wildcard matches (be careful with this in production)
    for (const allowedOrigin of allowedOrigins) {
      if (allowedOrigin === '*') {
        return true; // Not recommended for production
      }
      
      // Pattern matching for subdomains
      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.substring(2);
        if (origin.endsWith(domain)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate secure cookie attributes
   */
  getSecureCookieAttributes(): {
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
  } {
    return {
      secure: true, // Only send over HTTPS
      httpOnly: true, // Not accessible via JavaScript
      sameSite: 'strict', // CSRF protection
      maxAge: productionSecurityConfig.authentication.sessionTimeout * 60, // Convert minutes to seconds
    };
  }

  /**
   * Check for mixed content
   */
  checkMixedContent(pageUrl: string, resourceUrls: string[]): {
    hasMixedContent: boolean;
    insecureResources: string[];
  } {
    const insecureResources: string[] = [];

    try {
      const pageUrlObj = new URL(pageUrl);
      
      if (pageUrlObj.protocol === 'https:') {
        for (const resourceUrl of resourceUrls) {
          try {
            const resourceUrlObj = new URL(resourceUrl);
            if (resourceUrlObj.protocol === 'http:') {
              insecureResources.push(resourceUrl);
            }
          } catch {
            // Invalid URL, skip
          }
        }
      }
    } catch {
      // Invalid page URL
    }

    return {
      hasMixedContent: insecureResources.length > 0,
      insecureResources,
    };
  }

  /**
   * Get transport security report
   */
  getTransportSecurityReport(): {
    httpsEnforced: boolean;
    hstsEnabled: boolean;
    tlsVersion: string;
    certificateValid: boolean;
    securityHeaders: SecurityHeaders;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    const securityHeaders = this.getSecurityHeaders();

    // Check HTTPS enforcement
    const httpsEnforced = productionSecurityConfig.api.enableHttpsOnly;
    if (!httpsEnforced) {
      recommendations.push('Enable HTTPS-only mode');
    }

    // Check HSTS
    const hstsEnabled = this.tlsConfig.enableHSTS;
    if (!hstsEnabled) {
      recommendations.push('Enable HTTP Strict Transport Security (HSTS)');
    }

    // Check security headers
    if (!productionSecurityConfig.headers.enableSecurityHeaders) {
      recommendations.push('Enable security headers');
    }

    return {
      httpsEnforced,
      hstsEnabled,
      tlsVersion: this.tlsConfig.minVersion,
      certificateValid: true, // Would be checked in real implementation
      securityHeaders,
      recommendations,
    };
  }
}

// Export singleton instance
export const transportSecurityService = TransportSecurityService.getInstance();
export default transportSecurityService;