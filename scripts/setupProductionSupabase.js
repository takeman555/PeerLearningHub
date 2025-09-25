#!/usr/bin/env node

/**
 * Production Supabase Setup Script
 * Comprehensive setup for production Supabase project with enhanced security and monitoring
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const CONFIG = {
  // These should be set via environment variables in production
  PRODUCTION_SUPABASE_URL: process.env.PRODUCTION_SUPABASE_URL,
  PRODUCTION_SUPABASE_SERVICE_KEY: process.env.PRODUCTION_SUPABASE_SERVICE_KEY,
  PRODUCTION_SUPABASE_ANON_KEY: process.env.PRODUCTION_SUPABASE_ANON_KEY,
  PRODUCTION_JWT_SECRET: process.env.PRODUCTION_JWT_SECRET,
  PRODUCTION_DB_PASSWORD: process.env.PRODUCTION_DB_PASSWORD,
};

class ProductionSupabaseSetup {
  constructor() {
    this.validateEnvironment();
    this.supabase = createClient(
      CONFIG.PRODUCTION_SUPABASE_URL,
      CONFIG.PRODUCTION_SUPABASE_SERVICE_KEY
    );
  }

  validateEnvironment() {
    const required = [
      'PRODUCTION_SUPABASE_URL',
      'PRODUCTION_SUPABASE_SERVICE_KEY',
      'PRODUCTION_SUPABASE_ANON_KEY'
    ];

    const missing = required.filter(key => !CONFIG[key]);
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing.join(', '));
      console.log('\nPlease set the following environment variables:');
      missing.forEach(key => {
        console.log(`export ${key}=your_${key.toLowerCase()}_here`);
      });
      process.exit(1);
    }

    // Validate URL format
    if (!CONFIG.PRODUCTION_SUPABASE_URL.startsWith('https://')) {
      console.error('❌ PRODUCTION_SUPABASE_URL must use HTTPS');
      process.exit(1);
    }

    // Validate URL is not a placeholder
    if (CONFIG.PRODUCTION_SUPABASE_URL.includes('your-project') || 
        CONFIG.PRODUCTION_SUPABASE_ANON_KEY.includes('your-anon-key')) {
      console.error('❌ Please replace placeholder values with actual production credentials');
      process.exit(1);
    }
  }

  async runMigrations() {
    console.log('🔄 Running database migrations...');
    
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.error('❌ Migrations directory not found:', migrationsDir);
      throw new Error('Migrations directory not found');
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`  📄 Running migration: ${file}`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        // Split SQL content by statements to handle complex migrations
        const statements = sqlContent
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          if (statement.trim()) {
            const { error } = await this.supabase.rpc('exec_sql', { sql: statement + ';' });
            if (error && !error.message.includes('already exists')) {
              console.error(`❌ Statement failed:`, statement.substring(0, 100) + '...');
              console.error('Error:', error);
              throw error;
            }
          }
        }
        
        console.log(`  ✅ Migration ${file} completed`);
      } catch (error) {
        console.error(`❌ Failed to run migration ${file}:`, error.message);
        throw error;
      }
    }
  }

  async setupRLSPolicies() {
    console.log('🔒 Setting up Row Level Security policies...');
    
    const policies = [
      {
        name: 'profiles_select_policy',
        table: 'profiles',
        operation: 'SELECT',
        policy: 'auth.uid() = id OR has_any_role(ARRAY[\'admin\', \'moderator\'])'
      },
      {
        name: 'profiles_insert_policy',
        table: 'profiles',
        operation: 'INSERT',
        policy: 'auth.uid() = id'
      },
      {
        name: 'profiles_update_policy',
        table: 'profiles',
        operation: 'UPDATE',
        policy: 'auth.uid() = id OR has_any_role(ARRAY[\'admin\', \'moderator\'])'
      },
      {
        name: 'user_roles_select_policy',
        table: 'user_roles',
        operation: 'SELECT',
        policy: 'auth.uid() = user_id OR has_any_role(ARRAY[\'admin\', \'super_admin\'])'
      },
      {
        name: 'user_roles_insert_policy',
        table: 'user_roles',
        operation: 'INSERT',
        policy: 'has_any_role(ARRAY[\'admin\', \'super_admin\'])'
      },
      {
        name: 'user_roles_update_policy',
        table: 'user_roles',
        operation: 'UPDATE',
        policy: 'has_any_role(ARRAY[\'admin\', \'super_admin\'])'
      }
    ];

    for (const policy of policies) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', {
          sql: `
            DROP POLICY IF EXISTS ${policy.name} ON ${policy.table};
            CREATE POLICY ${policy.name} ON ${policy.table}
            FOR ${policy.operation}
            USING (${policy.policy});
          `
        });

        if (error) {
          console.error(`❌ Failed to create policy ${policy.name}:`, error);
          throw error;
        }
        console.log(`  ✅ Policy ${policy.name} created`);
      } catch (error) {
        console.error(`❌ Failed to setup policy ${policy.name}:`, error.message);
        throw error;
      }
    }
  }

  async enableRLS() {
    console.log('🔐 Enabling Row Level Security...');
    
    const tables = ['profiles', 'user_roles', 'posts', 'groups', 'announcements', 'memberships'];
    
    for (const table of tables) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', {
          sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
        });

        if (error && !error.message.includes('already enabled')) {
          console.error(`❌ Failed to enable RLS on ${table}:`, error);
          throw error;
        }
        console.log(`  ✅ RLS enabled on ${table}`);
      } catch (error) {
        console.error(`❌ Failed to enable RLS on ${table}:`, error.message);
        throw error;
      }
    }
  }

  async createProductionEnvFile() {
    console.log('📝 Creating production environment file...');
    
    const prodEnvContent = `# Production Environment Configuration
# Generated on ${new Date().toISOString()}
# WARNING: Keep this file secure and never commit to version control

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=${CONFIG.PRODUCTION_SUPABASE_URL}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${CONFIG.PRODUCTION_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${CONFIG.PRODUCTION_SUPABASE_SERVICE_KEY}

# App Configuration
EXPO_PUBLIC_APP_NAME=PeerLearningHub
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=production

# Security Configuration
EXPO_PUBLIC_ENABLE_HTTPS_ONLY=true
EXPO_PUBLIC_ENABLE_SECURITY_HEADERS=true
SESSION_TIMEOUT=60

# Database Configuration
ENABLE_AUTO_BACKUP=true
BACKUP_INTERVAL=0 2 * * *
BACKUP_RETENTION_DAYS=30

# RevenueCat Configuration (to be set separately)
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_production_ios_api_key_here
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_production_android_api_key_here

# Monitoring Configuration
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_ERROR_REPORTING=true
EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true

# Rate Limiting
API_RATE_LIMIT=1000
API_RATE_WINDOW=3600

# External Systems
EXTERNAL_SYSTEMS_TIMEOUT=30000
EXTERNAL_SYSTEMS_RETRY_ATTEMPTS=3
`;

    const envPath = path.join(__dirname, '../.env.production');
    fs.writeFileSync(envPath, prodEnvContent);
    console.log(`  ✅ Production environment file created at ${envPath}`);
    
    // Create .env.production.example for reference
    const exampleContent = prodEnvContent.replace(
      /=.+$/gm, 
      '=your_value_here'
    );
    
    const examplePath = path.join(__dirname, '../.env.production.example');
    fs.writeFileSync(examplePath, exampleContent);
    console.log(`  ✅ Production environment example file created at ${examplePath}`);
  }

  async setupDatabaseBackups() {
    console.log('💾 Setting up database backups...');
    
    try {
      // Create backup configuration table if it doesn't exist
      const { error: backupTableError } = await this.supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS backup_configurations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            backup_type TEXT NOT NULL,
            schedule TEXT NOT NULL,
            retention_days INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT true,
            last_backup_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (backupTableError) {
        console.error('❌ Failed to create backup configuration table:', backupTableError);
        throw backupTableError;
      }

      // Insert default backup configurations
      const { error: insertError } = await this.supabase
        .from('backup_configurations')
        .upsert([
          {
            backup_type: 'daily_full',
            schedule: '0 2 * * *',
            retention_days: 30,
            is_active: true
          },
          {
            backup_type: 'weekly_archive',
            schedule: '0 3 * * 0',
            retention_days: 90,
            is_active: true
          }
        ], { onConflict: 'backup_type' });

      if (insertError) {
        console.error('❌ Failed to insert backup configurations:', insertError);
        throw insertError;
      }

      console.log('  ✅ Database backup configurations created');
    } catch (error) {
      console.error('❌ Failed to setup database backups:', error.message);
      throw error;
    }
  }

  async setupMonitoring() {
    console.log('📊 Setting up monitoring and health checks...');
    
    try {
      // Create monitoring functions
      const { error: monitoringError } = await this.supabase.rpc('exec_sql', {
        sql: `
          -- Function to record performance metrics
          CREATE OR REPLACE FUNCTION record_performance_metric(
            p_metric_name TEXT,
            p_metric_value NUMERIC,
            p_metric_unit TEXT DEFAULT NULL,
            p_tags JSONB DEFAULT '{}'
          )
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $func$
          BEGIN
            INSERT INTO performance_metrics (
              metric_name,
              metric_value,
              metric_unit,
              tags
            ) VALUES (
              p_metric_name,
              p_metric_value,
              p_metric_unit,
              p_tags
            );
          END;
          $func$;

          -- Function to record health check results
          CREATE OR REPLACE FUNCTION record_health_check(
            p_check_name TEXT,
            p_status TEXT,
            p_response_time_ms INTEGER DEFAULT NULL,
            p_error_message TEXT DEFAULT NULL,
            p_metadata JSONB DEFAULT '{}'
          )
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $func$
          BEGIN
            INSERT INTO system_health_checks (
              check_name,
              status,
              response_time_ms,
              error_message,
              metadata
            ) VALUES (
              p_check_name,
              p_status,
              p_response_time_ms,
              p_error_message,
              p_metadata
            );
          END;
          $func$;

          -- Function to get system health summary
          CREATE OR REPLACE FUNCTION get_system_health_summary()
          RETURNS TABLE (
            check_name TEXT,
            latest_status TEXT,
            latest_check TIMESTAMP WITH TIME ZONE,
            avg_response_time NUMERIC
          )
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $func$
          BEGIN
            RETURN QUERY
            SELECT DISTINCT ON (shc.check_name)
              shc.check_name,
              shc.status as latest_status,
              shc.checked_at as latest_check,
              AVG(shc.response_time_ms) OVER (
                PARTITION BY shc.check_name 
                ORDER BY shc.checked_at DESC 
                ROWS BETWEEN 9 PRECEDING AND CURRENT ROW
              ) as avg_response_time
            FROM system_health_checks shc
            ORDER BY shc.check_name, shc.checked_at DESC;
          END;
          $func$;
        `
      });

      if (monitoringError) {
        console.error('❌ Failed to create monitoring functions:', monitoringError);
        throw monitoringError;
      }

      console.log('  ✅ Monitoring functions created');
    } catch (error) {
      console.error('❌ Failed to setup monitoring:', error.message);
      throw error;
    }
  }

  async createInitialAdminUser() {
    console.log('👤 Setting up initial admin user...');
    
    try {
      // This would typically be done through Supabase Auth UI or API
      // For now, we'll create a placeholder that can be updated later
      const { error } = await this.supabase.rpc('exec_sql', {
        sql: `
          -- Create function to promote user to admin (to be called after user registration)
          CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $func$
          DECLARE
            user_uuid UUID;
          BEGIN
            -- Find user by email
            SELECT id INTO user_uuid
            FROM auth.users
            WHERE email = user_email;
            
            IF user_uuid IS NULL THEN
              RAISE EXCEPTION 'User with email % not found', user_email;
            END IF;
            
            -- Insert admin role
            INSERT INTO user_roles (user_id, role, granted_by)
            VALUES (user_uuid, 'super_admin', user_uuid)
            ON CONFLICT (user_id, role) DO NOTHING;
            
            -- Update profile to verified and active
            UPDATE profiles
            SET is_verified = true, is_active = true
            WHERE id = user_uuid;
          END;
          $func$;
        `
      });

      if (error) {
        console.error('❌ Failed to create admin promotion function:', error);
        throw error;
      }

      console.log('  ✅ Admin user promotion function created');
      console.log('  ℹ️  Use promote_to_admin(\'admin@example.com\') after user registration');
    } catch (error) {
      console.error('❌ Failed to setup initial admin user:', error.message);
      throw error;
    }
  }

  async validateSetup() {
    console.log('🔍 Validating production setup...');
    
    const validationResults = {
      database_connection: false,
      rls_enabled: false,
      functions_working: false,
      indexes_created: false,
      monitoring_setup: false
    };

    try {
      // Test database connection
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Database connection test failed:', error);
      } else {
        validationResults.database_connection = true;
        console.log('  ✅ Database connection successful');
      }

      // Test RLS policies
      const { data: rlsData, error: rlsError } = await this.supabase.rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND rowsecurity = true;
        `
      });

      if (rlsError) {
        console.error('❌ RLS validation failed:', rlsError);
      } else {
        validationResults.rls_enabled = true;
        console.log(`  ✅ RLS enabled on ${rlsData?.length || 0} tables`);
      }

      // Test functions
      const { data: funcData, error: funcError } = await this.supabase.rpc('has_role', {
        required_role: 'admin'
      });

      if (funcError) {
        console.error('❌ Function test failed:', funcError);
      } else {
        validationResults.functions_working = true;
        console.log('  ✅ Database functions working correctly');
      }

      // Test indexes
      const { data: indexData, error: indexError } = await this.supabase.rpc('exec_sql', {
        sql: `
          SELECT COUNT(*) as index_count
          FROM pg_indexes 
          WHERE schemaname = 'public';
        `
      });

      if (indexError) {
        console.error('❌ Index validation failed:', indexError);
      } else {
        validationResults.indexes_created = true;
        console.log(`  ✅ ${indexData?.[0]?.index_count || 0} indexes created`);
      }

      // Test monitoring functions
      const { data: monitoringData, error: monitoringError } = await this.supabase
        .rpc('record_performance_metric', {
          p_metric_name: 'setup_validation',
          p_metric_value: 1,
          p_metric_unit: 'count'
        });

      if (monitoringError) {
        console.error('❌ Monitoring validation failed:', monitoringError);
      } else {
        validationResults.monitoring_setup = true;
        console.log('  ✅ Monitoring functions working correctly');
      }

      // Summary
      const successCount = Object.values(validationResults).filter(Boolean).length;
      const totalChecks = Object.keys(validationResults).length;
      
      console.log(`\n📊 Validation Summary: ${successCount}/${totalChecks} checks passed`);
      
      if (successCount === totalChecks) {
        console.log('🎉 All validation checks passed!');
      } else {
        console.log('⚠️  Some validation checks failed. Please review the errors above.');
        throw new Error('Validation failed');
      }

    } catch (error) {
      console.error('❌ Setup validation failed:', error.message);
      throw error;
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Production Supabase Setup...\n');

      await this.runMigrations();
      await this.enableRLS();
      await this.setupRLSPolicies();
      await this.setupDatabaseBackups();
      await this.setupMonitoring();
      await this.createInitialAdminUser();
      await this.createProductionEnvFile();
      await this.validateSetup();

      console.log('\n✅ Production Supabase setup completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Register your first admin user through the app');
      console.log('2. Run: SELECT promote_to_admin(\'your-admin-email@example.com\');');
      console.log('3. Update RevenueCat API keys in .env.production');
      console.log('4. Configure external monitoring services');
      console.log('5. Set up automated backup verification');
      console.log('6. Run comprehensive security audit');
      console.log('7. Configure SSL certificates and domain');
      console.log('8. Set up CDN for static assets');

      console.log('\n🔒 Security Reminders:');
      console.log('- Keep .env.production file secure and never commit to version control');
      console.log('- Regularly rotate API keys and secrets');
      console.log('- Monitor security audit logs');
      console.log('- Enable 2FA for all admin accounts');

    } catch (error) {
      console.error('\n❌ Production setup failed:', error.message);
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Verify all environment variables are set correctly');
      console.log('2. Check Supabase project permissions');
      console.log('3. Ensure database is accessible');
      console.log('4. Review migration files for syntax errors');
      process.exit(1);
    }
  }
}

// Run the setup if called directly
if (require.main === module) {
  const setup = new ProductionSupabaseSetup();
  setup.run();
}

module.exports = ProductionSupabaseSetup;