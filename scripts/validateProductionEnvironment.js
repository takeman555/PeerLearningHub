#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates that the production environment is properly configured
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class ProductionEnvironmentValidator {
  constructor() {
    this.loadEnvironmentConfig();
    this.validationResults = {};
  }

  loadEnvironmentConfig() {
    // Load production environment variables
    const prodEnvPath = path.join(__dirname, '../.env.production');
    
    if (fs.existsSync(prodEnvPath)) {
      const envContent = fs.readFileSync(prodEnvPath, 'utf8');
      const envLines = envContent.split('\n');
      
      envLines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !key.startsWith('#')) {
          process.env[key.trim()] = value.trim();
        }
      });
    }

    this.config = {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT,
      appVersion: process.env.EXPO_PUBLIC_APP_VERSION,
    };
  }

  async validateEnvironmentVariables() {
    console.log('🔍 Validating environment variables...');
    
    const requiredVars = [
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'EXPO_PUBLIC_ENVIRONMENT',
      'EXPO_PUBLIC_APP_VERSION'
    ];

    const missingVars = [];
    const invalidVars = [];

    requiredVars.forEach(varName => {
      const value = process.env[varName];
      
      if (!value) {
        missingVars.push(varName);
      } else if (value.includes('your_') || value.includes('placeholder')) {
        invalidVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars.join(', '));
      this.validationResults.environmentVariables = false;
      return false;
    }

    if (invalidVars.length > 0) {
      console.error('❌ Invalid placeholder values:', invalidVars.join(', '));
      this.validationResults.environmentVariables = false;
      return false;
    }

    // Validate URL format
    if (!this.config.supabaseUrl.startsWith('https://')) {
      console.error('❌ Supabase URL must use HTTPS');
      this.validationResults.environmentVariables = false;
      return false;
    }

    // Validate environment is set to production
    if (this.config.environment !== 'production') {
      console.error('❌ EXPO_PUBLIC_ENVIRONMENT must be set to "production"');
      this.validationResults.environmentVariables = false;
      return false;
    }

    console.log('  ✅ All environment variables are valid');
    this.validationResults.environmentVariables = true;
    return true;
  }

  async validateDatabaseConnection() {
    console.log('🔗 Validating database connection...');
    
    try {
      const supabase = createClient(this.config.supabaseUrl, this.config.supabaseServiceKey);
      
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Database connection failed:', error.message);
        this.validationResults.databaseConnection = false;
        return false;
      }

      console.log('  ✅ Database connection successful');
      this.validationResults.databaseConnection = true;
      return true;
    } catch (error) {
      console.error('❌ Database connection error:', error.message);
      this.validationResults.databaseConnection = false;
      return false;
    }
  }

  async validateDatabaseSchema() {
    console.log('📋 Validating database schema...');
    
    try {
      const supabase = createClient(this.config.supabaseUrl, this.config.supabaseServiceKey);
      
      const requiredTables = [
        'profiles',
        'user_roles',
        'groups',
        'posts',
        'post_likes',
        'comments',
        'announcements',
        'memberships',
        'external_systems',
        'user_external_connections',
        'security_audit_log',
        'performance_metrics',
        'system_health_checks'
      ];

      const { data: tables, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE';
        `
      });

      if (error) {
        console.error('❌ Failed to query database schema:', error.message);
        this.validationResults.databaseSchema = false;
        return false;
      }

      const existingTables = tables.map(t => t.table_name);
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));

      if (missingTables.length > 0) {
        console.error('❌ Missing required tables:', missingTables.join(', '));
        this.validationResults.databaseSchema = false;
        return false;
      }

      console.log(`  ✅ All ${requiredTables.length} required tables exist`);
      this.validationResults.databaseSchema = true;
      return true;
    } catch (error) {
      console.error('❌ Schema validation error:', error.message);
      this.validationResults.databaseSchema = false;
      return false;
    }
  }

  async validateRLSPolicies() {
    console.log('🔒 Validating Row Level Security policies...');
    
    try {
      const supabase = createClient(this.config.supabaseUrl, this.config.supabaseServiceKey);
      
      // Check if RLS is enabled on critical tables
      const { data: rlsTables, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('profiles', 'user_roles', 'posts', 'groups', 'announcements', 'memberships');
        `
      });

      if (error) {
        console.error('❌ Failed to check RLS status:', error.message);
        this.validationResults.rlsPolicies = false;
        return false;
      }

      const tablesWithoutRLS = rlsTables.filter(t => !t.rowsecurity);
      
      if (tablesWithoutRLS.length > 0) {
        console.error('❌ RLS not enabled on tables:', tablesWithoutRLS.map(t => t.tablename).join(', '));
        this.validationResults.rlsPolicies = false;
        return false;
      }

      // Check if policies exist
      const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT COUNT(*) as policy_count
          FROM pg_policies 
          WHERE schemaname = 'public';
        `
      });

      if (policiesError) {
        console.error('❌ Failed to check policies:', policiesError.message);
        this.validationResults.rlsPolicies = false;
        return false;
      }

      const policyCount = policies[0]?.policy_count || 0;
      
      if (policyCount < 10) {
        console.error('❌ Insufficient RLS policies found:', policyCount);
        this.validationResults.rlsPolicies = false;
        return false;
      }

      console.log(`  ✅ RLS enabled with ${policyCount} policies`);
      this.validationResults.rlsPolicies = true;
      return true;
    } catch (error) {
      console.error('❌ RLS validation error:', error.message);
      this.validationResults.rlsPolicies = false;
      return false;
    }
  }

  async validateFunctions() {
    console.log('⚙️ Validating database functions...');
    
    try {
      const supabase = createClient(this.config.supabaseUrl, this.config.supabaseServiceKey);
      
      const requiredFunctions = [
        'has_role',
        'has_any_role',
        'get_user_profile',
        'log_security_event',
        'check_rate_limit',
        'record_performance_metric',
        'record_health_check'
      ];

      for (const funcName of requiredFunctions) {
        try {
          // Test function exists by calling it (some may fail due to parameters, but should not error on "function does not exist")
          const { error } = await supabase.rpc(funcName, {});
          
          if (error && error.message.includes('function') && error.message.includes('does not exist')) {
            console.error(`❌ Function ${funcName} does not exist`);
            this.validationResults.functions = false;
            return false;
          }
        } catch (error) {
          // Expected for functions that require parameters
        }
      }

      console.log(`  ✅ All ${requiredFunctions.length} required functions exist`);
      this.validationResults.functions = true;
      return true;
    } catch (error) {
      console.error('❌ Functions validation error:', error.message);
      this.validationResults.functions = false;
      return false;
    }
  }

  async validateIndexes() {
    console.log('📊 Validating database indexes...');
    
    try {
      const supabase = createClient(this.config.supabaseUrl, this.config.supabaseServiceKey);
      
      const { data: indexes, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT COUNT(*) as index_count
          FROM pg_indexes 
          WHERE schemaname = 'public'
          AND indexname NOT LIKE '%_pkey';
        `
      });

      if (error) {
        console.error('❌ Failed to check indexes:', error.message);
        this.validationResults.indexes = false;
        return false;
      }

      const indexCount = indexes[0]?.index_count || 0;
      
      if (indexCount < 15) {
        console.error(`❌ Insufficient indexes found: ${indexCount} (expected at least 15)`);
        this.validationResults.indexes = false;
        return false;
      }

      console.log(`  ✅ ${indexCount} performance indexes created`);
      this.validationResults.indexes = true;
      return true;
    } catch (error) {
      console.error('❌ Indexes validation error:', error.message);
      this.validationResults.indexes = false;
      return false;
    }
  }

  async validateSecurityConfiguration() {
    console.log('🛡️ Validating security configuration...');
    
    try {
      // Check security-related environment variables
      const securityVars = [
        'EXPO_PUBLIC_ENABLE_HTTPS_ONLY',
        'EXPO_PUBLIC_ENABLE_SECURITY_HEADERS',
        'SESSION_TIMEOUT'
      ];

      const missingSecurityVars = securityVars.filter(varName => !process.env[varName]);
      
      if (missingSecurityVars.length > 0) {
        console.error('❌ Missing security environment variables:', missingSecurityVars.join(', '));
        this.validationResults.securityConfiguration = false;
        return false;
      }

      // Validate HTTPS is enforced
      if (process.env.EXPO_PUBLIC_ENABLE_HTTPS_ONLY !== 'true') {
        console.error('❌ HTTPS enforcement is not enabled');
        this.validationResults.securityConfiguration = false;
        return false;
      }

      // Validate security headers are enabled
      if (process.env.EXPO_PUBLIC_ENABLE_SECURITY_HEADERS !== 'true') {
        console.error('❌ Security headers are not enabled');
        this.validationResults.securityConfiguration = false;
        return false;
      }

      console.log('  ✅ Security configuration is valid');
      this.validationResults.securityConfiguration = true;
      return true;
    } catch (error) {
      console.error('❌ Security validation error:', error.message);
      this.validationResults.securityConfiguration = false;
      return false;
    }
  }

  generateValidationReport() {
    console.log('\n📊 Production Environment Validation Report');
    console.log('=' .repeat(50));
    
    const checks = [
      { name: 'Environment Variables', key: 'environmentVariables' },
      { name: 'Database Connection', key: 'databaseConnection' },
      { name: 'Database Schema', key: 'databaseSchema' },
      { name: 'RLS Policies', key: 'rlsPolicies' },
      { name: 'Database Functions', key: 'functions' },
      { name: 'Database Indexes', key: 'indexes' },
      { name: 'Security Configuration', key: 'securityConfiguration' }
    ];

    let passedChecks = 0;
    
    checks.forEach(check => {
      const status = this.validationResults[check.key] ? '✅ PASS' : '❌ FAIL';
      console.log(`${check.name.padEnd(25)} ${status}`);
      if (this.validationResults[check.key]) passedChecks++;
    });

    console.log('=' .repeat(50));
    console.log(`Overall Status: ${passedChecks}/${checks.length} checks passed`);
    
    if (passedChecks === checks.length) {
      console.log('🎉 Production environment is ready for deployment!');
      return true;
    } else {
      console.log('⚠️  Production environment has issues that need to be resolved.');
      return false;
    }
  }

  async run() {
    try {
      console.log('🔍 Starting Production Environment Validation...\n');

      await this.validateEnvironmentVariables();
      await this.validateDatabaseConnection();
      await this.validateDatabaseSchema();
      await this.validateRLSPolicies();
      await this.validateFunctions();
      await this.validateIndexes();
      await this.validateSecurityConfiguration();

      const isValid = this.generateValidationReport();
      
      if (!isValid) {
        process.exit(1);
      }

    } catch (error) {
      console.error('\n❌ Validation failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the validation if called directly
if (require.main === module) {
  const validator = new ProductionEnvironmentValidator();
  validator.run();
}

module.exports = ProductionEnvironmentValidator;