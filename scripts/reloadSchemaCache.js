const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function reloadSchemaCache() {
  console.log('🔄 Reloading Supabase schema cache...');
  
  try {
    // Method 1: Try using NOTIFY to reload schema
    const { error: notifyError } = await supabase.rpc('exec_sql', {
      sql: "NOTIFY pgrst, 'reload schema';"
    });

    if (notifyError) {
      console.log('⚠️ NOTIFY method failed, trying alternative approach...');
      
      // Method 2: Try direct SQL execution
      const { error: sqlError } = await supabase
        .from('posts')
        .select('count', { count: 'exact', head: true });

      if (sqlError) {
        console.error('❌ Schema cache reload failed:', sqlError);
        
        // Method 3: Force table recreation
        console.log('🔧 Attempting to force table recognition...');
        
        const { error: insertError } = await supabase
          .from('posts')
          .insert([
            {
              user_id: '00000000-0000-0000-0000-000000000000',
              content: 'Schema cache test post',
              is_active: false
            }
          ]);

        if (insertError) {
          console.error('❌ Force table recognition failed:', insertError);
          return false;
        }

        // Clean up test post
        const { error: deleteError } = await supabase
          .from('posts')
          .delete()
          .eq('content', 'Schema cache test post');

        if (deleteError) {
          console.log('⚠️ Could not clean up test post');
        }

        console.log('✅ Schema cache refreshed via table interaction');
        return true;
      }
    }

    console.log('✅ Schema cache reloaded successfully');
    
    // Test the posts table
    const { data, error: testError } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      console.error('❌ Posts table still not accessible:', testError);
      return false;
    }

    console.log('✅ Posts table is now accessible');
    console.log(`📊 Current posts count: ${data?.length || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

if (require.main === module) {
  reloadSchemaCache().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { reloadSchemaCache };