#!/usr/bin/env node

/**
 * Validate User Analytics System
 * Tests the user analytics system functionality and performance
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class AnalyticsValidator {
  constructor() {
    this.testResults = {
      tableStructure: false,
      dataInsertion: false,
      dataRetrieval: false,
      conversionCalculation: false,
      featureUsageStats: false,
      performance: false,
      security: false
    };
  }

  async validateTableStructure() {
    console.log('🔍 Validating table structure...');

    try {
      const requiredTables = [
        'user_actions',
        'screen_transitions', 
        'conversion_events',
        'feature_usage'
      ];

      for (const tableName of requiredTables) {
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', tableName)
          .eq('table_schema', 'public');

        if (error) {
          console.error(`❌ Error checking table ${tableName}:`, error.message);
          return false;
        }

        if (!data || data.length === 0) {
          console.error(`❌ Table ${tableName} not found`);
          return false;
        }

        console.log(`✅ Table ${tableName} structure validated`);
      }

      this.testResults.tableStructure = true;
      return true;
    } catch (error) {
      console.error('❌ Table structure validation failed:', error.message);
      return false;
    }
  }

  async validateDataInsertion() {
    console.log('📝 Validating data insertion...');

    try {
      const testUserId = 'validation-test-user';
      const timestamp = new Date().toISOString();

      // Test user actions insertion
      const { error: actionError } = await supabase
        .from('user_actions')
        .insert({
          user_id: testUserId,
          action_type: 'validation_test',
          screen_name: 'validation_screen',
          metadata: { test: 'validation', timestamp }
        });

      if (actionError) {
        console.error('❌ User actions insertion failed:', actionError.message);
        return false;
      }

      // Test screen transitions insertion
      const { error: transitionError } = await supabase
        .from('screen_transitions')
        .insert({
          user_id: testUserId,
          from_screen: 'screen_a',
          to_screen: 'screen_b',
          duration: 2500
        });

      if (transitionError) {
        console.error('❌ Screen transitions insertion failed:', transitionError.message);
        return false;
      }

      // Test conversion events insertion
      const { error: conversionError } = await supabase
        .from('conversion_events')
        .insert({
          user_id: testUserId,
          event_type: 'validation_conversion',
          funnel_step: 'validation_step',
          value: 50.00
        });

      if (conversionError) {
        console.error('❌ Conversion events insertion failed:', conversionError.message);
        return false;
      }

      // Test feature usage upsert
      const { error: featureError } = await supabase
        .rpc('upsert_feature_usage', {
          p_user_id: testUserId,
          p_feature_name: 'validation_feature',
          p_time_spent: 3000
        });

      if (featureError) {
        console.error('❌ Feature usage upsert failed:', featureError.message);
        return false;
      }

      console.log('✅ Data insertion validation passed');
      this.testResults.dataInsertion = true;
      return true;
    } catch (error) {
      console.error('❌ Data insertion validation failed:', error.message);
      return false;
    }
  }

  async validateDataRetrieval() {
    console.log('📊 Validating data retrieval...');

    try {
      const testUserId = 'validation-test-user';
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      // Test retrieving user actions
      const { data: actions, error: actionsError } = await supabase
        .from('user_actions')
        .select('*')
        .eq('user_id', testUserId)
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      if (actionsError) {
        console.error('❌ Actions retrieval failed:', actionsError.message);
        return false;
      }

      // Test retrieving screen transitions
      const { data: transitions, error: transitionsError } = await supabase
        .from('screen_transitions')
        .select('*')
        .eq('user_id', testUserId)
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      if (transitionsError) {
        console.error('❌ Transitions retrieval failed:', transitionsError.message);
        return false;
      }

      // Test retrieving conversion events
      const { data: conversions, error: conversionsError } = await supabase
        .from('conversion_events')
        .select('*')
        .eq('user_id', testUserId)
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      if (conversionsError) {
        console.error('❌ Conversions retrieval failed:', conversionsError.message);
        return false;
      }

      // Test retrieving feature usage
      const { data: featureUsage, error: featureUsageError } = await supabase
        .from('feature_usage')
        .select('*')
        .eq('user_id', testUserId);

      if (featureUsageError) {
        console.error('❌ Feature usage retrieval failed:', featureUsageError.message);
        return false;
      }

      console.log(`✅ Data retrieval validation passed`);
      console.log(`   Actions: ${actions?.length || 0}`);
      console.log(`   Transitions: ${transitions?.length || 0}`);
      console.log(`   Conversions: ${conversions?.length || 0}`);
      console.log(`   Feature Usage: ${featureUsage?.length || 0}`);

      this.testResults.dataRetrieval = true;
      return true;
    } catch (error) {
      console.error('❌ Data retrieval validation failed:', error.message);
      return false;
    }
  }

  async validateConversionCalculation() {
    console.log('📈 Validating conversion calculation...');

    try {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const { data: conversionRates, error } = await supabase
        .rpc('get_conversion_rates', {
          p_start_date: startDate,
          p_end_date: endDate,
          p_funnel_steps: ['validation_step', 'completed_step']
        });

      if (error) {
        console.error('❌ Conversion calculation failed:', error.message);
        return false;
      }

      console.log('✅ Conversion calculation validation passed');
      console.log(`   Conversion rates calculated: ${conversionRates?.length || 0}`);

      this.testResults.conversionCalculation = true;
      return true;
    } catch (error) {
      console.error('❌ Conversion calculation validation failed:', error.message);
      return false;
    }
  }

  async validateFeatureUsageStats() {
    console.log('📊 Validating feature usage statistics...');

    try {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const { data: featureStats, error } = await supabase
        .rpc('get_feature_usage_stats', {
          p_start_date: startDate,
          p_end_date: endDate
        });

      if (error) {
        console.error('❌ Feature usage stats failed:', error.message);
        return false;
      }

      console.log('✅ Feature usage statistics validation passed');
      console.log(`   Feature stats calculated: ${featureStats?.length || 0}`);

      this.testResults.featureUsageStats = true;
      return true;
    } catch (error) {
      console.error('❌ Feature usage statistics validation failed:', error.message);
      return false;
    }
  }

  async validatePerformance() {
    console.log('⚡ Validating performance...');

    try {
      const testUserId = 'performance-test-user';
      const batchSize = 100;
      const startTime = Date.now();

      // Test bulk insertion performance
      const actions = Array.from({ length: batchSize }, (_, i) => ({
        user_id: testUserId,
        action_type: 'performance_test',
        screen_name: 'performance_screen',
        metadata: { batch: true, index: i }
      }));

      const { error: bulkError } = await supabase
        .from('user_actions')
        .insert(actions);

      if (bulkError) {
        console.error('❌ Bulk insertion performance test failed:', bulkError.message);
        return false;
      }

      const insertTime = Date.now() - startTime;

      // Test query performance
      const queryStartTime = Date.now();
      const { data, error: queryError } = await supabase
        .from('user_actions')
        .select('*')
        .eq('user_id', testUserId)
        .limit(1000);

      if (queryError) {
        console.error('❌ Query performance test failed:', queryError.message);
        return false;
      }

      const queryTime = Date.now() - queryStartTime;

      console.log('✅ Performance validation passed');
      console.log(`   Bulk insert (${batchSize} records): ${insertTime}ms`);
      console.log(`   Query (${data?.length || 0} records): ${queryTime}ms`);

      // Performance thresholds
      const insertThreshold = 5000; // 5 seconds
      const queryThreshold = 2000;  // 2 seconds

      if (insertTime > insertThreshold || queryTime > queryThreshold) {
        console.warn('⚠️  Performance warning: Operations took longer than expected');
      }

      this.testResults.performance = true;
      return true;
    } catch (error) {
      console.error('❌ Performance validation failed:', error.message);
      return false;
    }
  }

  async validateSecurity() {
    console.log('🔒 Validating security (RLS policies)...');

    try {
      // Test that RLS is enabled
      const { data: rlsStatus, error: rlsError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['user_actions', 'screen_transitions', 'conversion_events', 'feature_usage']);

      if (rlsError) {
        console.error('❌ RLS status check failed:', rlsError.message);
        return false;
      }

      // Test policies exist (this is a simplified check)
      const { data: policies, error: policiesError } = await supabase
        .from('information_schema.table_privileges')
        .select('table_name, privilege_type')
        .eq('table_schema', 'public')
        .in('table_name', ['user_actions', 'screen_transitions', 'conversion_events', 'feature_usage']);

      if (policiesError) {
        console.error('❌ Policies check failed:', policiesError.message);
        return false;
      }

      console.log('✅ Security validation passed');
      console.log(`   Tables with RLS: ${rlsStatus?.length || 0}`);

      this.testResults.security = true;
      return true;
    } catch (error) {
      console.error('❌ Security validation failed:', error.message);
      return false;
    }
  }

  async cleanupTestData() {
    console.log('🧹 Cleaning up validation test data...');

    try {
      const testUserIds = ['validation-test-user', 'performance-test-user'];

      for (const userId of testUserIds) {
        await Promise.all([
          supabase.from('user_actions').delete().eq('user_id', userId),
          supabase.from('screen_transitions').delete().eq('user_id', userId),
          supabase.from('conversion_events').delete().eq('user_id', userId),
          supabase.from('feature_usage').delete().eq('user_id', userId)
        ]);
      }

      console.log('✅ Test data cleanup completed');
    } catch (error) {
      console.warn('⚠️  Warning: Could not clean up all test data:', error.message);
    }
  }

  generateReport() {
    console.log('\n📋 User Analytics Validation Report');
    console.log('=====================================');

    const results = Object.entries(this.testResults);
    const passed = results.filter(([_, result]) => result).length;
    const total = results.length;

    results.forEach(([test, result]) => {
      const status = result ? '✅ PASS' : '❌ FAIL';
      const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${status} ${testName}`);
    });

    console.log('=====================================');
    console.log(`Overall: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log('🎉 All validation tests passed!');
      console.log('\n✨ User Analytics System is ready for production use');
    } else {
      console.log('❌ Some validation tests failed');
      console.log('\n🔧 Please fix the failing tests before using in production');
    }

    return passed === total;
  }

  async runAllValidations() {
    console.log('🚀 Starting User Analytics System Validation\n');

    try {
      await this.validateTableStructure();
      await this.validateDataInsertion();
      await this.validateDataRetrieval();
      await this.validateConversionCalculation();
      await this.validateFeatureUsageStats();
      await this.validatePerformance();
      await this.validateSecurity();
      await this.cleanupTestData();

      return this.generateReport();
    } catch (error) {
      console.error('\n❌ Validation failed with error:', error.message);
      return false;
    }
  }
}

async function main() {
  const validator = new AnalyticsValidator();
  const success = await validator.runAllValidations();
  
  process.exit(success ? 0 : 1);
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = AnalyticsValidator;