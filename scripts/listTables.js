const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  console.log('🔍 Checking available tables...\n');
  
  // List of tables to check
  const tablesToCheck = [
    'profiles',
    'user_roles', 
    'posts',
    'groups',
    'post_likes',
    'group_memberships',
    'announcements',
    'external_projects',
    'external_sessions',
    'external_accommodations'
  ];

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: exists (count: ${data || 0})`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }

  console.log('\n🔍 Trying to get schema information...');
  
  // Try to get some schema info
  try {
    const { data, error } = await supabase.rpc('get_schema_info');
    if (error) {
      console.log('❌ Schema info not available:', error.message);
    } else {
      console.log('✅ Schema info:', data);
    }
  } catch (err) {
    console.log('❌ Schema info error:', err.message);
  }
}

listTables();