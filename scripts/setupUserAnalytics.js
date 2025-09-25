#!/usr/bin/env node

/**
 * Setup User Analytics System
 * Initializes the user analytics system and validates the setup
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAnalyticsTables() {
  console.log('🔧 Setting up analytics tables...');

  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['user_actions', 'screen_transitions', 'conversion_events', 'feature_usage']);

    if (tablesError) {
      console.error('❌ Error checking existing tables:', tablesError.message);
      return false;
    }

    const existingTables = tables.map(t => t.table_name);
    const requiredTables = ['user_actions', 'screen_transitions', 'conversion_events', 'feature_usage'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    if (missingTables.length > 0) {
      console.log(`📋 Missing tables: ${missingTables.join(', ')}`);
      console.log('💡 Please run the migration: 012_create_user_analytics_tables.sql');
      return false;
    }

    console.log('✅ All analytics tables exist');
    return true;
  } catch (error) {
    console.error('❌ Error setting up analytics tables:', error.message);
    return false;
  }
}

async function validateAnalyticsSetup() {
  console.log('🔍 Validating analytics setup...');

  try {
    // Test inserting sample data
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const timestamp = new Date().toISOString();

    // Test user_actions table
    const { error: actionError } = await supabase
      .from('user_actions')
      .insert({
        user_id: testUserId,
        action_type: 'test_action',
        screen_name: 'test_screen',
        metadata: { test: true, timestamp }
      });

    if (actionError) {
      console.error('❌ Error testing user_actions table:', actionError.message);
      return false;
    }

    // Test screen_transitions table
    const { error: transitionError } = await supabase
      .from('screen_transitions')
      .insert({
        user_id: testUserId,
        from_screen: 'test_screen_1',
        to_screen: 'test_screen_2',
        duration: 1000
      });

    if (transitionError) {
      console.error('❌ Error testing screen_transitions table:', transitionError.message);
      return false;
    }

    // Test conversion_events table
    const { error: conversionError } = await supabase
      .from('conversion_events')
      .insert({
        user_id: testUserId,
        event_type: 'test_conversion',
        funnel_step: 'test_step',
        value: 100.00,
        metadata: { test: true, timestamp }
      });

    if (conversionError) {
      console.error('❌ Error testing conversion_events table:', conversionError.message);
      return false;
    }

    // Test feature_usage table with upsert function
    const { error: featureError } = await supabase
      .rpc('upsert_feature_usage', {
        p_user_id: testUserId,
        p_feature_name: 'test_feature',
        p_time_spent: 5000
      });

    if (featureError) {
      console.error('❌ Error testing feature_usage upsert:', featureError.message);
      return false;
    }

    console.log('✅ Analytics setup validation successful');
    return true;
  } catch (error) {
    console.error('❌ Error validating analytics setup:', error.message);
    return false;
  }
}

async function testAnalyticsFunctions() {
  console.log('🧪 Testing analytics functions...');

  try {
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();

    // Test conversion rates function
    const { data: conversionRates, error: conversionError } = await supabase
      .rpc('get_conversion_rates', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_funnel_steps: ['test_step', 'completed_step']
      });

    if (conversionError) {
      console.error('❌ Error testing conversion rates function:', conversionError.message);
      return false;
    }

    console.log('📊 Conversion rates function test:', conversionRates);

    // Test feature usage stats function
    const { data: featureStats, error: featureStatsError } = await supabase
      .rpc('get_feature_usage_stats', {
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (featureStatsError) {
      console.error('❌ Error testing feature usage stats function:', featureStatsError.message);
      return false;
    }

    console.log('📈 Feature usage stats function test:', featureStats);

    console.log('✅ Analytics functions test successful');
    return true;
  } catch (error) {
    console.error('❌ Error testing analytics functions:', error.message);
    return false;
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');

  try {
    const testUserId = '00000000-0000-0000-0000-000000000000';

    // Clean up test data from all tables
    await Promise.all([
      supabase.from('user_actions').delete().eq('user_id', testUserId),
      supabase.from('screen_transitions').delete().eq('user_id', testUserId),
      supabase.from('conversion_events').delete().eq('user_id', testUserId),
      supabase.from('feature_usage').delete().eq('user_id', testUserId)
    ]);

    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️  Warning: Could not clean up all test data:', error.message);
  }
}

async function generateAnalyticsReport() {
  console.log('📋 Generating analytics setup report...');

  try {
    // Get table row counts
    const tables = ['user_actions', 'screen_transitions', 'conversion_events', 'feature_usage'];
    const tableCounts = {};

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        tableCounts[table] = count || 0;
      } else {
        tableCounts[table] = 'Error';
      }
    }

    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count: recentActions } = await supabase
      .from('user_actions')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', yesterday);

    const { count: recentTransitions } = await supabase
      .from('screen_transitions')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', yesterday);

    console.log('\n📊 Analytics Setup Report');
    console.log('========================');
    console.log('Table Row Counts:');
    Object.entries(tableCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count}`);
    });
    console.log('\nRecent Activity (24h):');
    console.log(`  Actions: ${recentActions || 0}`);
    console.log(`  Transitions: ${recentTransitions || 0}`);
    console.log('========================\n');

  } catch (error) {
    console.error('❌ Error generating analytics report:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting User Analytics System Setup\n');

  try {
    // Step 1: Setup analytics tables
    const tablesReady = await setupAnalyticsTables();
    if (!tablesReady) {
      console.log('\n❌ Analytics setup failed: Tables not ready');
      process.exit(1);
    }

    // Step 2: Validate setup
    const validationPassed = await validateAnalyticsSetup();
    if (!validationPassed) {
      console.log('\n❌ Analytics setup failed: Validation failed');
      process.exit(1);
    }

    // Step 3: Test functions
    const functionsWork = await testAnalyticsFunctions();
    if (!functionsWork) {
      console.log('\n❌ Analytics setup failed: Functions test failed');
      process.exit(1);
    }

    // Step 4: Cleanup test data
    await cleanupTestData();

    // Step 5: Generate report
    await generateAnalyticsReport();

    console.log('🎉 User Analytics System setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Import UserAnalyticsInitializer in your app');
    console.log('   2. Call UserAnalyticsInitializer.initialize() on app start');
    console.log('   3. Use useUserAnalytics hook in your components');
    console.log('   4. Monitor analytics data in the dashboard');

  } catch (error) {
    console.error('\n❌ Setup failed with error:', error.message);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  setupAnalyticsTables,
  validateAnalyticsSetup,
  testAnalyticsFunctions,
  cleanupTestData,
  generateAnalyticsReport
};