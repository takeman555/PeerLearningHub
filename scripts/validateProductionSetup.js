#!/usr/bin/env node

/**
 * Production Setup Validation Script
 * Validates that production Supabase setup is correct and secure
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class ProductionValidator {
  constructor() {
    this.loadConfig();
    this.supabase = createClient(this.config.url, this.config.serviceKey);
  }

  loadConfig() {
    // Try to load from .env.production first, then environment variables
    const envPath = path.join(__dirname, '../.env.production');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      });
      
      this.config = {
        url: envVars.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
        anonKey: envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        serviceKey: envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      };
    } else {
      this.config = {
        url: process.env.EXPO_PUBLIC_SUPABASE_URL,
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      };
    }

    if (!this.config.url || !this.config.anonKey || !this.config.serviceKey) {
      throw new Error('Missing required Supabase configuration');
    }
  }

  async validateConnection() {
    console.log('🔍 Validating database connection...');
    
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Connection failed: ${error.message}`);
      }

      console.log('  ✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('  ❌ Database connection failed:', error.message);
      return false;
    }
  }

  async validateRLS() {
    console.log('🔒 Validating Row Level Security...');
    
    try {
      const { data, error } = await this.supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname, 
            tablename, 
            rowsecurity,
            (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = pg_tables.tablename) as policy_count
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('profiles', 'user_roles', 'posts', 'groups', 'announcements', 'memberships');
        `
      });

      if (error) {
        throw new Error(`RLS validation failed: ${error.message}`);
      }

      const issues = [];
      data.forEach(table => {
        if (!table.rowsecurity) {
          issues.push(`RLS not enabled on ${table.tablename}`);
        }
        if (table.policy_count === 0) {
          issues.push(`No policies found for ${table.tablename}`);
        }
      });

      if (issues.length > 0) {
        console.error('  ❌ RLS issues found:');
        issues.forEach(issue => console.error(`    - ${issue}`));
        return false;
      }

      console.log(`  ✅ RLS enabled on ${data.length} tables with policies`);
      return true;
    } catch (error) {
      console.error('  ❌ RLS validation failed:', error.message);
      return false;
    }
  }

  async validateFunctions() {
    console.log('⚙️ Validating database functions...');
    
    const functions = [
      'has_role',
      'has_any_role',
      'log_security_event',
      'check_rate_limit',
      'exec_sql'
    ];

    try {
      for (const funcName of functions) {
        const { data, error } = await this.supabase.rpc('exec_sql', {
          sql: `
            SELECT EXISTS (
              SELECT 1 FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname = 'public' AND p.proname = '${funcName}'
            ) as exists;
          `
        });

        if (error || !data[0]?.exists) {
          console.error(`  ❌ Function ${funcName} not found`);
          return false;
        }
      }

      console.log(`  ✅ All ${functions.length} required functions exist`);
      return true;
    } catch (error) {
      console.error('  ❌ Function validation failed:', error.message);
      return false;
    }
  }

  async validateIndexes() {
    console.log('📊 Validating database indexes...');
    
    try {
      const { data, error } = await this.supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
          FROM pg_indexes 
          WHERE schemaname = 'public'
          AND indexname LIKE 'idx_%'
          ORDER BY tablename, indexname;
        `
      });

      if (error) {
        throw new Error(`Index validation failed: ${error.message}`);
      }

      const requiredIndexes = [
        'idx_profiles_email',
        'idx_user_roles_user_id',
        'idx_posts_author_id',
        'idx_groups_created_by',
        'idx_security_audit_log_user_id',
        'idx_security_audit_log_created_at'
      ];

      const existingIndexes = data.map(idx => idx.indexname);
      const missingIndexes = requiredIndexes.filter(idx => !existingIndexes.includes(idx));

      if (missingIndexes.length > 0) {
        console.error('  ❌ Missing indexes:');
        missingIndexes.forEach(idx => console.error(`    - ${idx}`));
        return false;
      }

      console.log(`  ✅ All required indexes exist (${existingIndexes.length} total)`);
      return true;
    } catch (error) {
      console.error('  ❌ Index validation failed:', error.message);
      return false;
    }
  }

  async validateSecurity() {
    console.log('🛡️ Validating security configuration...');
    
    try {
      // Check if HTTPS is enforced
      if (!this.config.url.startsWith('https://')) {
        console.error('  ❌ Supabase URL must use HTTPS in production');
        return false;
      }

      // Check if audit log table exists
      const { data, error } = await this.supabase
        .from('security_audit_log')
        .select('count')
        .limit(1);

      if (error) {
        console.error('  ❌ Security audit log table not found');
        return false;
      }

      // Test rate limiting function
      const { data: rateLimitData, error: rateLimitError } = await this.supabase
        .rpc('check_rate_limit', {
          p_action: 'test',
          p_limit: 100,
          p_window_minutes: 60
        });

      if (rateLimitError) {
        console.error('  ❌ Rate limiting function not working');
        return false;
      }

      console.log('  ✅ Security configuration validated');
      return true;
    } catch (error) {
      console.error('  ❌ Security validation failed:', error.message);
      return false;
    }
  }

  async validateEnvironmentSeparation() {
    console.log('🔄 Validating environment separation...');
    
    try {
      // Check if we're not accidentally connecting to development
      const { data, error } = await this.supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            current_database() as database_name,
            current_setting('server_version') as postgres_version;
        `
      });

      if (error) {
        throw new Error(`Environment check failed: ${error.message}`);
      }

      // Check for development-specific data
      const { data: devData, error: devError } = await this.supabase
        .from('profiles')
        .select('email')
        .ilike('email', '%test%')
        .limit(5);

      if (devError) {
        console.warn('  ⚠️ Could not check for test data');
      } else if (devData && devData.length > 0) {
        console.warn('  ⚠️ Found potential test data in production database');
        console.warn('    Consider cleaning up test accounts before going live');
      }

      console.log(`  ✅ Connected to database: ${data[0].database_name}`);
      console.log(`  ✅ PostgreSQL version: ${data[0].postgres_version}`);
      return true;
    } catch (error) {
      console.error('  ❌ Environment validation failed:', error.message);
      return false;
    }
  }

  async generateReport() {
    console.log('📋 Generating validation report...');
    
    const results = {
      connection: await this.validateConnection(),
      rls: await this.validateRLS(),
      functions: await this.validateFunctions(),
      indexes: await this.validateIndexes(),
      security: await this.validateSecurity(),
      environment: await this.validateEnvironmentSeparation(),
    };

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed,
        total,
        success: passed === total
      },
      details: results,
      recommendations: []
    };

    if (!results.connection) {
      report.recommendations.push('Fix database connection issues before proceeding');
    }
    if (!results.rls) {
      report.recommendations.push('Enable RLS and create policies for all tables');
    }
    if (!results.functions) {
      report.recommendations.push('Run all database migrations to create required functions');
    }
    if (!results.indexes) {
      report.recommendations.push('Create missing database indexes for performance');
    }
    if (!results.security) {
      report.recommendations.push('Complete security configuration setup');
    }

    const reportPath = path.join(__dirname, '../production-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📊 Validation Report:`);
    console.log(`  Passed: ${passed}/${total} checks`);
    console.log(`  Status: ${report.summary.success ? '✅ READY' : '❌ NOT READY'}`);
    console.log(`  Report saved to: ${reportPath}`);

    if (report.recommendations.length > 0) {
      console.log('\n🔧 Recommendations:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    return report.summary.success;
  }

  async run() {
    try {
      console.log('🚀 Starting Production Setup Validation...\n');
      
      const success = await this.generateReport();
      
      if (success) {
        console.log('\n✅ Production setup validation passed!');
        console.log('Your Supabase production environment is ready for deployment.');
      } else {
        console.log('\n❌ Production setup validation failed!');
        console.log('Please address the issues above before deploying to production.');
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Validation failed:', error.message);
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ProductionValidator();
  validator.run();
}

module.exports = ProductionValidator;