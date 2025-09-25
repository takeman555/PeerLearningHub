const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createFreshClient() {
  console.log('🔄 Creating fresh Supabase client...');
  
  // Create a new client instance with cache busting
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }
  });

  try {
    // Test the connection
    const { data, error } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Fresh client test failed:', error);
      return false;
    }

    console.log('✅ Fresh client working, posts count:', data?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Fresh client error:', error);
    return false;
  }
}

if (require.main === module) {
  createFreshClient().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { createFreshClient };