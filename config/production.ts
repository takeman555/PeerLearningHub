/**
 * Production Environment Configuration
 * Secure configuration for production deployment
 */

export interface ProductionConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'production';
  };
  security: {
    enableHttpsOnly: boolean;
    enableSecurityHeaders: boolean;
    enableRLS: boolean;
    sessionTimeout: number; // in minutes
  };
  monitoring: {
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    enablePerformanceMonitoring: boolean;
  };
  backup: {
    enableAutoBackup: boolean;
    backupInterval: string; // cron expression
    retentionDays: number;
  };
}

// Production configuration with environment variable fallbacks
export const productionConfig: ProductionConfig = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  app: {
    name: process.env.EXPO_PUBLIC_APP_NAME || 'PeerLearningHub',
    version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    environment: 'production',
  },
  security: {
    enableHttpsOnly: process.env.EXPO_PUBLIC_ENABLE_HTTPS_ONLY === 'true',
    enableSecurityHeaders: process.env.EXPO_PUBLIC_ENABLE_SECURITY_HEADERS === 'true',
    enableRLS: true,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '60'), // 60 minutes default
  },
  monitoring: {
    enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableErrorReporting: process.env.EXPO_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
    enablePerformanceMonitoring: process.env.EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true',
  },
  backup: {
    enableAutoBackup: process.env.ENABLE_AUTO_BACKUP === 'true',
    backupInterval: process.env.BACKUP_INTERVAL || '0 2 * * *', // Daily at 2 AM
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  },
};

// Validation function to ensure all required config is present
export function validateProductionConfig(): void {
  const errors: string[] = [];

  if (!productionConfig.supabase.url) {
    errors.push('EXPO_PUBLIC_SUPABASE_URL is required');
  }

  if (!productionConfig.supabase.anonKey) {
    errors.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
  }

  if (!productionConfig.supabase.serviceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  if (!productionConfig.supabase.url.startsWith('https://')) {
    errors.push('Supabase URL must use HTTPS in production');
  }

  if (errors.length > 0) {
    throw new Error(`Production configuration errors:\n${errors.join('\n')}`);
  }
}

// Security headers configuration
export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
};

// Database connection pool configuration for production
export const databaseConfig = {
  poolSize: 20,
  connectionTimeout: 30000, // 30 seconds
  idleTimeout: 600000, // 10 minutes
  maxLifetime: 1800000, // 30 minutes
};

export default productionConfig;