#!/usr/bin/env node

/**
 * Test Production Database Connection
 * Simple script to test if production database is accessible
 */

const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('🔍 Testing production database connection...\n');

  // Load configuration
  const config = {
    url: process.env.PRODUCTION_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: process.env.PRODUCTION_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.PRODUCTION_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  if (!config.url || !config.anonKey || !config.serviceKey) {
    console.error('❌ Missing required environment variables:');
    console.log('Required variables:');
    console.log('- PRODUCTION_SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL)');
    console.log('- PRODUCTION_SUPABASE_ANON_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY)');
    console.log('- PRODUCTION_SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`  URL: ${config.url}`);
  console.log(`  Anon Key: ${config.anonKey.substring(0, 20)}...`);
  console.log(`  Service Key: ${config.serviceKey.substring(0, 20)}...\n`);

  // Test with anon key
  console.log('🔑 Testing with anonymous key...');
  const anonClient = createClient(config.url, config.anonKey);
  
  try {
    const { data, error } = await anonClient
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log(`  ⚠️ Anonymous access: ${error.message}`);
    } else {
      console.log('  ✅ Anonymous access: Connected successfully');
    }
  } catch (error) {
    console.log(`  ❌ Anonymous access failed: ${error.message}`);
  }

  // Test with service key
  console.log('\n🔐 Testing with service role key...');
  const serviceClient = createClient(config.url, config.serviceKey);
  
  try {
    const { data, error } = await serviceClient
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error(`  ❌ Service role access failed: ${error.message}`);
      process.exit(1);
    } else {
      console.log('  ✅ Service role access: Connected successfully');
    }
  } catch (error) {
    console.error(`  ❌ Service role access failed: ${error.message}`);
    process.exit(1);
  }

  // Test database info
  console.log('\n📊 Database information...');
  try {
    const { data, error } = await serviceClient.rpc('exec_sql', {
      sql: `
        SELECT 
          current_database() as database_name,
          current_setting('server_version') as postgres_version,
          pg_size_pretty(pg_database_size(current_database())) as database_size;
      `
    });

    if (error) {
      console.log(`  ⚠️ Could not retrieve database info: ${error.message}`);
    } else if (data && data.length > 0) {
      const info = data[0];
      console.log(`  Database: ${info.database_name}`);
      console.log(`  PostgreSQL: ${info.postgres_version}`);
      console.log(`  Size: ${info.database_size}`);
    }
  } catch (error) {
    console.log(`  ⚠️ Could not retrieve database info: ${error.message}`);
  }

  // Test table existence
  console.log('\n📋 Checking required tables...');
  const requiredTables = ['profiles', 'user_roles', 'posts', 'groups', 'announcements', 'memberships'];
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await serviceClient
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.log(`  ❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ Table ${table}: Accessible`);
      }
    } catch (error) {
      console.log(`  ❌ Table ${table}: ${error.message}`);
    }
  }

  console.log('\n✅ Connection test completed!');
  console.log('\nNext steps:');
  console.log('1. Run full setup: node scripts/setupProductionSupabase.js');
  console.log('2. Validate setup: node scripts/validateProductionSetup.js');
}

// Run test if called directly
if (require.main === module) {
  testConnection().catch(error => {
    console.error('\n❌ Connection test failed:', error.message);
    process.exit(1);
  });
}

module.exports = testConnection;