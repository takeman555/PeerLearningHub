/**
 * Production Security Configuration
 * Enhanced security settings for production deployment
 */

export interface SecurityConfig {
  database: {
    enableRLS: boolean;
    enableAuditLogging: boolean;
    enableConnectionEncryption: boolean;
    maxConnections: number;
    connectionTimeout: number;
  };
  api: {
    enableHttpsOnly: boolean;
    enableRateLimiting: boolean;
    maxRequestsPerMinute: number;
    enableCORS: boolean;
    allowedOrigins: string[];
  };
  authentication: {
    enableMFA: boolean;
    sessionTimeout: number; // in minutes
    maxLoginAttempts: number;
    lockoutDuration: number; // in minutes
    enablePasswordPolicy: boolean;
    minPasswordLength: number;
  };
  encryption: {
    enableDataEncryption: boolean;
    enableTransportEncryption: boolean;
    encryptionAlgorithm: string;
    keyRotationInterval: number; // in days
  };
  headers: {
    enableSecurityHeaders: boolean;
    strictTransportSecurity: string;
    contentSecurityPolicy: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    referrerPolicy: string;
  };
  monitoring: {
    enableSecurityAudit: boolean;
    enableIntrusionDetection: boolean;
    enableVulnerabilityScanning: boolean;
    auditLogRetention: number; // in days
  };
}

// Production security configuration
export const productionSecurityConfig: SecurityConfig = {
  database: {
    enableRLS: true,
    enableAuditLogging: true,
    enableConnectionEncryption: true,
    maxConnections: 20,
    connectionTimeout: 30000, // 30 seconds
  },
  api: {
    enableHttpsOnly: true,
    enableRateLimiting: true,
    maxRequestsPerMinute: 100,
    enableCORS: true,
    allowedOrigins: [
      'https://peerlearninghub.com',
      'https://www.peerlearninghub.com',
      'https://app.peerlearninghub.com',
    ],
  },
  authentication: {
    enableMFA: false, // Can be enabled later
    sessionTimeout: 60, // 1 hour
    maxLoginAttempts: 5,
    lockoutDuration: 15, // 15 minutes
    enablePasswordPolicy: true,
    minPasswordLength: 8,
  },
  encryption: {
    enableDataEncryption: true,
    enableTransportEncryption: true,
    encryptionAlgorithm: 'AES-256-GCM',
    keyRotationInterval: 90, // 90 days
  },
  headers: {
    enableSecurityHeaders: true,
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.revenuecat.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.revenuecat.com;",
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
  },
  monitoring: {
    enableSecurityAudit: true,
    enableIntrusionDetection: true,
    enableVulnerabilityScanning: true,
    auditLogRetention: 365, // 1 year
  },
};

// Security validation function
export function validateSecurityConfig(config: SecurityConfig): string[] {
  const errors: string[] = [];

  // Database security validation
  if (!config.database.enableRLS) {
    errors.push('Row Level Security must be enabled in production');
  }

  if (!config.database.enableConnectionEncryption) {
    errors.push('Database connection encryption must be enabled');
  }

  // API security validation
  if (!config.api.enableHttpsOnly) {
    errors.push('HTTPS must be enforced in production');
  }

  if (config.api.maxRequestsPerMinute > 1000) {
    errors.push('Rate limiting should be more restrictive in production');
  }

  // Authentication security validation
  if (config.authentication.sessionTimeout > 480) { // 8 hours
    errors.push('Session timeout should not exceed 8 hours');
  }

  if (config.authentication.minPasswordLength < 8) {
    errors.push('Minimum password length should be at least 8 characters');
  }

  // Encryption validation
  if (!config.encryption.enableDataEncryption) {
    errors.push('Data encryption must be enabled in production');
  }

  if (!config.encryption.enableTransportEncryption) {
    errors.push('Transport encryption must be enabled in production');
  }

  // Headers validation
  if (!config.headers.enableSecurityHeaders) {
    errors.push('Security headers must be enabled in production');
  }

  return errors;
}

// Security headers middleware configuration
export const securityHeaders = {
  'Strict-Transport-Security': productionSecurityConfig.headers.strictTransportSecurity,
  'Content-Security-Policy': productionSecurityConfig.headers.contentSecurityPolicy,
  'X-Frame-Options': productionSecurityConfig.headers.xFrameOptions,
  'X-Content-Type-Options': productionSecurityConfig.headers.xContentTypeOptions,
  'Referrer-Policy': productionSecurityConfig.headers.referrerPolicy,
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: productionSecurityConfig.api.maxRequestsPerMinute,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

// Password policy configuration
export const passwordPolicy = {
  minLength: productionSecurityConfig.authentication.minPasswordLength,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPasswords: [
    'password',
    '123456',
    'qwerty',
    'admin',
    'user',
    'guest',
    'peerlearninghub',
  ],
};

// Session configuration
export const sessionConfig = {
  timeout: productionSecurityConfig.authentication.sessionTimeout * 60 * 1000, // Convert to milliseconds
  renewalThreshold: 15 * 60 * 1000, // Renew session if less than 15 minutes remaining
  maxConcurrentSessions: 3, // Maximum concurrent sessions per user
  enableSessionTracking: true,
};

// Audit logging configuration
export const auditConfig = {
  enableAuditLogging: productionSecurityConfig.monitoring.enableSecurityAudit,
  logLevel: 'info',
  retentionDays: productionSecurityConfig.monitoring.auditLogRetention,
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
  ],
  auditEvents: [
    'user_login',
    'user_logout',
    'user_registration',
    'password_change',
    'profile_update',
    'role_change',
    'purchase_attempt',
    'subscription_change',
    'data_export',
    'admin_action',
  ],
};

// Vulnerability scanning configuration
export const vulnerabilityConfig = {
  enableScanning: productionSecurityConfig.monitoring.enableVulnerabilityScanning,
  scanInterval: 24 * 60 * 60 * 1000, // Daily
  scanTypes: [
    'dependency_check',
    'code_analysis',
    'configuration_review',
    'permission_audit',
  ],
  alertThreshold: 'medium', // Alert on medium and high severity issues
};

// CORS configuration
export const corsConfig = {
  origin: productionSecurityConfig.api.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Input validation configuration
export const inputValidationConfig = {
  enableValidation: true,
  maxInputLength: 10000,
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  sanitizeInput: true,
  validateSQL: true,
  validateXSS: true,
};

export default productionSecurityConfig;