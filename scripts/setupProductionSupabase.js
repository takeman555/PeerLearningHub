#!/usr/bin/env node

/**
 * Production Supabase Setup Script
 * Sets up production Supabase project with proper configuration
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
  }

  async runMigrations() {
    console.log('🔄 Running database migrations...');
    
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`  📄 Running migration: ${file}`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: sqlContent });
        if (error) {
          console.error(`❌ Migration ${file} failed:`, error);
          throw error;
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

# RevenueCat Configuration (to be set separately)
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_production_ios_api_key_here
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_production_android_api_key_here

# Monitoring Configuration
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_ERROR_REPORTING=true
`;

    const envPath = path.join(__dirname, '../.env.production');
    fs.writeFileSync(envPath, prodEnvContent);
    console.log(`  ✅ Production environment file created at ${envPath}`);
  }

  async validateSetup() {
    console.log('🔍 Validating production setup...');
    
    try {
      // Test database connection
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Database connection test failed:', error);
        throw error;
      }

      console.log('  ✅ Database connection successful');

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
        throw rlsError;
      }

      console.log(`  ✅ RLS enabled on ${rlsData?.length || 0} tables`);

      // Test functions
      const { data: funcData, error: funcError } = await this.supabase.rpc('has_role', {
        required_role: 'admin'
      });

      if (funcError) {
        console.error('❌ Function test failed:', funcError);
        throw funcError;
      }

      console.log('  ✅ Database functions working correctly');

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
      await this.createProductionEnvFile();
      await this.validateSetup();

      console.log('\n✅ Production Supabase setup completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Update RevenueCat API keys in .env.production');
      console.log('2. Configure monitoring and logging services');
      console.log('3. Set up automated backups');
      console.log('4. Run security audit');

    } catch (error) {
      console.error('\n❌ Production setup failed:', error.message);
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