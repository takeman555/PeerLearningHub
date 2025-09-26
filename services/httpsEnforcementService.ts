/**
 * HTTPS Enforcement Service
 * Ensures secure HTTPS communication and validates SSL/TLS configurations
 */

import { productionSecurityConfig } from '../config/security';
import { transportSecurityService } from './transportSecurityService';

export interface HTTPSValidationResult {
  isSecure: boolean;
  protocol: string;
  issues: string[];
  recommendations: string[];
}

export interface SSLCertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  daysUntilExpiry: number;
  isValid: boolean;
  fingerprint: string;
  keySize: number;
  signatureAlgorithm: string;
}

export interface TLSConfiguration {
  minVersion: string;
  maxVersion: string;
  supportedCipherSuites: string[];
  enabledProtocols: string[];
  certificateChain: SSLCertificateInfo[];
}

export interface HTTPSEnforcementPolicy {
  enforceHTTPS: boolean;
  redirectHTTPToHTTPS: boolean;
  enableHSTS: boolean;
  hstsMaxAge: number;
  includeSubdomains: boolean;
  preload: boolean;
  allowInsecureLocalhost: boolean;
}

export class HTTPSEnforcementService {
  private static instance: HTTPSEnforcementService;
  private enforcementPolicy: HTTPSEnforcementPolicy;
  private certificateCache: Map<string, SSLCertificateInfo> = new Map();

  private constructor() {
    this.initializeEnforcementPolicy();
  }

  static getInstance(): HTTPSEnforcementService {
    if (!HTTPSEnforcementService.instance) {
      HTTPSEnforcementService.instance = new HTTPSEnforcementService();
    }
    return HTTPSEnforcementService.instance;
  }

  /**
   * Initialize HTTPS enforcement policy
   */
  private initializeEnforcementPolicy(): void {
    this.enforcementPolicy = {
      enforceHTTPS: productionSecurityConfig.api.enableHttpsOnly,
      redirectHTTPToHTTPS: true,
      enableHSTS: true,
      hstsMaxAge: 31536000, // 1 year
      includeSubdomains: true,
      preload: true,
      allowInsecureLocalhost: process.env.NODE_ENV !== 'production',
    };
  }

  /**
   * Validate HTTPS enforcement for a URL
   */
  validateHTTPS(url: string): HTTPSValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol;
      const hostname = parsedUrl.hostname;

      // Check protocol
      if (protocol !== 'https:') {
        if (this.enforcementPolicy.enforceHTTPS) {
          if (hostname === 'localhost' && this.enforcementPolicy.allowInsecureLocalhost) {
            recommendations.push('Using HTTP on localhost - ensure HTTPS is used in production');
          } else {
            issues.push('HTTPS is required but HTTP protocol detected');
          }
        } else {
          recommendations.push('Consider using HTTPS for better security');
        }
      }

      // Check for mixed content risks
      if (protocol === 'https:' && this.hasMixedContentRisk(url)) {
        issues.push('Potential mixed content detected');
        recommendations.push('Ensure all resources are loaded over HTTPS');
      }

      // Check hostname security
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (protocol === 'https:') {
          recommendations.push('Using HTTPS with localhost may cause certificate warnings');
        }
      }

      // Check for weak TLS versions (would be done server-side in real implementation)
      if (protocol === 'https:') {
        recommendations.push('Ensure TLS 1.2 or higher is used');
      }

      return {
        isSecure: issues.length === 0,
        protocol,
        issues,
        recommendations,
      };
    } catch (error) {
      issues.push('Invalid URL format');
      return {
        isSecure: false,
        protocol: 'unknown',
        issues,
        recommendations,
      };
    }
  }

  /**
   * Check for mixed content risks
   */
  private hasMixedContentRisk(url: string): boolean {
    // This is a simplified check - in a real implementation,
    // you would analyze the actual page content for mixed content
    const commonInsecurePatterns = [
      'http://',
      'ws://', // WebSocket without TLS
      'ftp://',
    ];

    return commonInsecurePatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Generate HTTPS redirect response
   */
  generateHTTPSRedirect(originalUrl: string): {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  } {
    try {
      const parsedUrl = new URL(originalUrl);
      const httpsUrl = `https://${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

      return {
        statusCode: 301, // Permanent redirect
        headers: {
          'Location': httpsUrl,
          'Strict-Transport-Security': this.generateHSTSHeader(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'text/html; charset=utf-8',
        },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Redirecting to HTTPS</title>
            <meta http-equiv="refresh" content="0; url=${httpsUrl}">
          </head>
          <body>
            <h1>Redirecting to Secure Connection</h1>
            <p>You are being redirected to the secure version of this page.</p>
            <p>If you are not redirected automatically, <a href="${httpsUrl}">click here</a>.</p>
          </body>
          </html>
        `,
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'Invalid URL for HTTPS redirect',
      };
    }
  }

  /**
   * Generate HSTS header
   */
  generateHSTSHeader(): string {
    let hsts = `max-age=${this.enforcementPolicy.hstsMaxAge}`;
    
    if (this.enforcementPolicy.includeSubdomains) {
      hsts += '; includeSubDomains';
    }
    
    if (this.enforcementPolicy.preload) {
      hsts += '; preload';
    }
    
    return hsts;
  }

  /**
   * Validate SSL certificate (mock implementation for client-side)
   */
  async validateSSLCertificate(hostname: string): Promise<SSLCertificateInfo> {
    // Check cache first
    const cached = this.certificateCache.get(hostname);
    if (cached && this.isCertificateCacheValid(cached)) {
      return cached;
    }

    try {
      // In a real implementation, this would make an actual SSL connection
      // For now, we'll simulate certificate validation
      const mockCertificate: SSLCertificateInfo = {
        subject: `CN=${hostname}`,
        issuer: 'CN=Let\'s Encrypt Authority X3, O=Let\'s Encrypt, C=US',
        validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        daysUntilExpiry: 60,
        isValid: true,
        fingerprint: 'SHA256:1234567890abcdef1234567890abcdef12345678',
        keySize: 2048,
        signatureAlgorithm: 'SHA256withRSA',
      };

      // Validate certificate
      const now = new Date();
      mockCertificate.isValid = now >= mockCertificate.validFrom && now <= mockCertificate.validTo;
      mockCertificate.daysUntilExpiry = Math.ceil(
        (mockCertificate.validTo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      // Cache the result
      this.certificateCache.set(hostname, mockCertificate);

      return mockCertificate;
    } catch (error) {
      throw new Error(`SSL certificate validation failed for ${hostname}: ${error}`);
    }
  }

  /**
   * Check if cached certificate is still valid
   */
  private isCertificateCacheValid(certificate: SSLCertificateInfo): boolean {
    const cacheMaxAge = 60 * 60 * 1000; // 1 hour
    const now = new Date();
    
    // Simple cache validation - in real implementation, you'd store cache timestamp
    return certificate.isValid && certificate.validTo > now;
  }

  /**
   * Get TLS configuration recommendations
   */
  getTLSRecommendations(): {
    minTLSVersion: string;
    recommendedCipherSuites: string[];
    deprecatedProtocols: string[];
    securityHeaders: Record<string, string>;
  } {
    return {
      minTLSVersion: 'TLSv1.2',
      recommendedCipherSuites: [
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-CHACHA20-POLY1305',
      ],
      deprecatedProtocols: [
        'SSLv2',
        'SSLv3',
        'TLSv1.0',
        'TLSv1.1',
      ],
      securityHeaders: transportSecurityService.getSecurityHeaders(),
    };
  }

  /**
   * Check HTTPS configuration compliance
   */
  checkHTTPSCompliance(): {
    isCompliant: boolean;
    score: number;
    checks: Array<{
      name: string;
      passed: boolean;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }>;
  } {
    const checks = [
      {
        name: 'HTTPS Enforcement',
        passed: this.enforcementPolicy.enforceHTTPS,
        severity: 'critical' as const,
        description: 'All traffic should be encrypted using HTTPS',
      },
      {
        name: 'HTTP to HTTPS Redirect',
        passed: this.enforcementPolicy.redirectHTTPToHTTPS,
        severity: 'high' as const,
        description: 'HTTP requests should be automatically redirected to HTTPS',
      },
      {
        name: 'HSTS Enabled',
        passed: this.enforcementPolicy.enableHSTS,
        severity: 'high' as const,
        description: 'HTTP Strict Transport Security should be enabled',
      },
      {
        name: 'HSTS Max Age',
        passed: this.enforcementPolicy.hstsMaxAge >= 31536000, // 1 year
        severity: 'medium' as const,
        description: 'HSTS max-age should be at least 1 year',
      },
      {
        name: 'HSTS Include Subdomains',
        passed: this.enforcementPolicy.includeSubdomains,
        severity: 'medium' as const,
        description: 'HSTS should include subdomains',
      },
      {
        name: 'HSTS Preload',
        passed: this.enforcementPolicy.preload,
        severity: 'low' as const,
        description: 'HSTS preload should be enabled for maximum security',
      },
    ];

    const passedChecks = checks.filter(check => check.passed).length;
    const totalChecks = checks.length;
    const score = Math.round((passedChecks / totalChecks) * 100);
    
    // Calculate weighted compliance
    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    const totalWeight = checks.reduce((sum, check) => sum + weights[check.severity], 0);
    const passedWeight = checks
      .filter(check => check.passed)
      .reduce((sum, check) => sum + weights[check.severity], 0);
    
    const isCompliant = passedWeight / totalWeight >= 0.8; // 80% weighted compliance

    return {
      isCompliant,
      score,
      checks,
    };
  }

  /**
   * Generate security.txt file content
   */
  generateSecurityTxt(): string {
    const contact = 'mailto:security@peerlearninghub.com';
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
    
    return `# Security Policy for PeerLearningHub
Contact: ${contact}
Expires: ${expires}
Encryption: https://peerlearninghub.com/pgp-key.txt
Acknowledgments: https://peerlearninghub.com/security/acknowledgments
Policy: https://peerlearninghub.com/security/policy
Hiring: https://peerlearninghub.com/careers

# Preferred Languages
Preferred-Languages: en, ja

# Canonical URL
Canonical: https://peerlearninghub.com/.well-known/security.txt`;
  }

  /**
   * Validate URL security
   */
  validateURLSecurity(url: string): {
    isSecure: boolean;
    issues: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    try {
      const parsedUrl = new URL(url);

      // Check protocol
      if (parsedUrl.protocol === 'http:') {
        issues.push('Insecure HTTP protocol');
        riskLevel = 'high';
      }

      // Check for dangerous protocols
      const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
      if (dangerousProtocols.includes(parsedUrl.protocol)) {
        issues.push(`Dangerous protocol: ${parsedUrl.protocol}`);
        riskLevel = 'critical';
      }

      // Check hostname
      if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
        if (process.env.NODE_ENV === 'production') {
          issues.push('Localhost URL in production environment');
          riskLevel = 'medium';
        }
      }

      // Check for suspicious patterns
      if (parsedUrl.pathname.includes('..')) {
        issues.push('Path traversal pattern detected');
        riskLevel = 'high';
      }

      // Check query parameters for XSS
      if (parsedUrl.search) {
        const suspiciousPatterns = ['<script', 'javascript:', 'onload=', 'onerror='];
        for (const pattern of suspiciousPatterns) {
          if (parsedUrl.search.toLowerCase().includes(pattern)) {
            issues.push('Suspicious pattern in query parameters');
            riskLevel = 'high';
            break;
          }
        }
      }

    } catch (error) {
      issues.push('Invalid URL format');
      riskLevel = 'medium';
    }

    return {
      isSecure: issues.length === 0,
      issues,
      riskLevel,
    };
  }

  /**
   * Get HTTPS enforcement policy
   */
  getEnforcementPolicy(): HTTPSEnforcementPolicy {
    return { ...this.enforcementPolicy };
  }

  /**
   * Update HTTPS enforcement policy
   */
  updateEnforcementPolicy(policy: Partial<HTTPSEnforcementPolicy>): void {
    this.enforcementPolicy = { ...this.enforcementPolicy, ...policy };
  }

  /**
   * Generate HTTPS enforcement report
   */
  getHTTPSEnforcementReport(): {
    enforcementEnabled: boolean;
    hstsEnabled: boolean;
    certificateStatus: 'valid' | 'expiring' | 'expired' | 'unknown';
    complianceScore: number;
    recommendations: string[];
    securityHeaders: Record<string, string>;
  } {
    const compliance = this.checkHTTPSCompliance();
    const recommendations: string[] = [];

    // Add recommendations based on failed checks
    for (const check of compliance.checks) {
      if (!check.passed) {
        recommendations.push(`${check.name}: ${check.description}`);
      }
    }

    // Additional recommendations
    if (!this.enforcementPolicy.enforceHTTPS) {
      recommendations.push('Enable HTTPS enforcement for all traffic');
    }

    if (this.enforcementPolicy.hstsMaxAge < 31536000) {
      recommendations.push('Increase HSTS max-age to at least 1 year');
    }

    return {
      enforcementEnabled: this.enforcementPolicy.enforceHTTPS,
      hstsEnabled: this.enforcementPolicy.enableHSTS,
      certificateStatus: 'valid', // Would be determined from actual certificate check
      complianceScore: compliance.score,
      recommendations,
      securityHeaders: transportSecurityService.getSecurityHeaders(),
    };
  }

  /**
   * Test HTTPS connection
   */
  async testHTTPSConnection(url: string): Promise<{
    success: boolean;
    responseTime: number;
    certificateValid: boolean;
    tlsVersion?: string;
    cipherSuite?: string;
    errors: string[];
  }> {
    const errors: string[] = [];
    const startTime = Date.now();

    try {
      // Validate URL first
      const urlValidation = this.validateURLSecurity(url);
      if (!urlValidation.isSecure) {
        errors.push(...urlValidation.issues);
      }

      // In a real implementation, this would make an actual HTTPS request
      // For now, we'll simulate the connection test
      const parsedUrl = new URL(url);
      
      if (parsedUrl.protocol !== 'https:') {
        errors.push('URL is not using HTTPS protocol');
      }

      // Simulate certificate validation
      let certificateValid = true;
      try {
        await this.validateSSLCertificate(parsedUrl.hostname);
      } catch (error) {
        certificateValid = false;
        errors.push('SSL certificate validation failed');
      }

      const responseTime = Date.now() - startTime;

      return {
        success: errors.length === 0,
        responseTime,
        certificateValid,
        tlsVersion: 'TLSv1.3', // Would be determined from actual connection
        cipherSuite: 'ECDHE-RSA-AES256-GCM-SHA384', // Would be determined from actual connection
        errors,
      };
    } catch (error) {
      errors.push(`Connection test failed: ${error}`);
      
      return {
        success: false,
        responseTime: Date.now() - startTime,
        certificateValid: false,
        errors,
      };
    }
  }
}

// Export singleton instance
export const httpsEnforcementService = HTTPSEnforcementService.getInstance();
export default httpsEnforcementService;