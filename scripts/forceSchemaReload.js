const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceSchemaReload() {
  console.log('🔄 Force reloading Supabase schema cache...');
  
  try {
    // Method 1: Try to interact with each table to force recognition
    const tables = ['posts', 'groups', 'group_memberships', 'post_likes'];
    
    for (const table of tables) {
      console.log(`🔍 Testing table: ${table}`);
      
      try {
        // Try to query the table
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });

        if (error) {
          console.log(`⚠️ ${table} not accessible: ${error.message}`);
          
          // Try to force table recognition by attempting an insert
          console.log(`🔧 Attempting to force ${table} recognition...`);
          
          let testData;
          switch (table) {
            case 'posts':
              testData = {
                user_id: '00000000-0000-0000-0000-000000000000',
                content: 'Test post for schema cache',
                is_active: false
              };
              break;
            case 'groups':
              testData = {
                name: 'Test Group',
                description: 'Test group for schema cache',
                created_by: '00000000-0000-0000-0000-000000000000',
                is_active: false
              };
              break;
            case 'group_memberships':
              // Skip this one as it requires valid foreign keys
              continue;
            case 'post_likes':
              // Skip this one as it requires valid foreign keys
              continue;
          }
          
          if (testData) {
            const { error: insertError } = await supabase
              .from(table)
              .insert([testData]);

            if (insertError) {
              console.log(`❌ Could not force ${table} recognition: ${insertError.message}`);
            } else {
              console.log(`✅ ${table} forced into cache`);
              
              // Clean up test data
              const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .eq('is_active', false);

              if (deleteError) {
                console.log(`⚠️ Could not clean up test data in ${table}`);
              }
            }
          }
        } else {
          console.log(`✅ ${table} is accessible`);
        }
      } catch (err) {
        console.log(`❌ Error with ${table}: ${err.message}`);
      }
    }

    // Method 2: Wait a bit and test again
    console.log('⏳ Waiting for schema cache to update...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test all tables again
    console.log('🔍 Final verification...');
    let allTablesAccessible = true;
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${table} still not accessible: ${error.message}`);
          allTablesAccessible = false;
        } else {
          console.log(`✅ ${table} is now accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table} error: ${err.message}`);
        allTablesAccessible = false;
      }
    }

    if (allTablesAccessible) {
      console.log('🎉 All tables are now accessible!');
      return true;
    } else {
      console.log('⚠️ Some tables are still not accessible');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

if (require.main === module) {
  forceSchemaReload().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { forceSchemaReload };