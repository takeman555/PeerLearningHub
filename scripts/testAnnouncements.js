const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Testing Announcements Functionality');
console.log('=====================================');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAnnouncements() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'announcements');

    if (tablesError) {
      console.log('⚠️  Direct table query failed, trying alternative method...');
      
      // Try to query announcements table directly
      const { data: announcements, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .limit(1);

      if (announcementsError) {
        console.error('❌ Announcements table not accessible:', announcementsError.message);
        
        // Check if we can access any tables
        const { data: anyData, error: anyError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
          
        if (anyError) {
          console.error('❌ Database connection failed completely:', anyError.message);
          return false;
        } else {
          console.log('✅ Database connection works, but announcements table may not exist');
          return false;
        }
      } else {
        console.log('✅ Announcements table exists and is accessible');
        console.log(`📊 Found ${announcements?.length || 0} announcements`);
        return true;
      }
    } else {
      console.log('✅ Announcements table confirmed to exist');
      return true;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testAnnouncementService() {
  try {
    console.log('\n🧪 Testing announcement service functions...');
    
    // Test RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_published_announcements', { limit_count: 5, offset_count: 0 });

    if (rpcError) {
      console.log('⚠️  RPC function not available:', rpcError.message);
      
      // Test direct query as fallback
      const { data: directData, error: directError } = await supabase
        .from('announcements')
        .select('*')
        .eq('published', true)
        .order('featured', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(5);

      if (directError) {
        console.error('❌ Direct query also failed:', directError.message);
        return false;
      } else {
        console.log('✅ Direct query works as fallback');
        console.log(`📊 Found ${directData?.length || 0} published announcements`);
        if (directData && directData.length > 0) {
          console.log('📝 Sample announcement:', {
            title: directData[0].title,
            type: directData[0].type,
            published: directData[0].published,
            featured: directData[0].featured
          });
        }
        return true;
      }
    } else {
      console.log('✅ RPC function works perfectly');
      console.log(`📊 Found ${rpcData?.length || 0} published announcements`);
      if (rpcData && rpcData.length > 0) {
        console.log('📝 Sample announcement:', {
          title: rpcData[0].title,
          type: rpcData[0].type,
          published: rpcData[0].published,
          featured: rpcData[0].featured
        });
      }
      return true;
    }
  } catch (error) {
    console.error('❌ Service test failed:', error.message);
    return false;
  }
}

async function main() {
  const tableExists = await testAnnouncements();
  
  if (tableExists) {
    const serviceWorks = await testAnnouncementService();
    
    if (serviceWorks) {
      console.log('\n🎉 All tests passed! Announcements functionality is working.');
      console.log('\n📋 Next steps:');
      console.log('1. Start your app: npm start');
      console.log('2. Navigate to Resources tab');
      console.log('3. Switch to "お知らせ" tab');
      console.log('4. Test admin functionality at /admin/announcements');
    } else {
      console.log('\n⚠️  Table exists but service has issues. Check your RLS policies.');
    }
  } else {
    console.log('\n❌ Announcements table does not exist or is not accessible.');
    console.log('\n🔧 To fix this:');
    console.log('1. Run the migration manually in Supabase SQL Editor');
    console.log('2. Check your service role key permissions');
    console.log('3. Verify RLS policies are correctly configured');
  }
}

main().catch(console.error);