#!/usr/bin/env node

/**
 * Comprehensive Database Diagnosis Script
 * Identifies and attempts to resolve Supabase schema cache issues
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('   - EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

// Create both admin and anon clients
const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function testBasicConnection() {
  console.log('🔍 Testing basic Supabase connection...');
  
  try {
    // Test with a simple query that should always work
    const { data, error } = await adminClient
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .limit(5);
    
    if (error) {
      console.error('❌ Basic connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Basic connection successful');
    console.log('📋 Found public tables:', data.map(t => t.tablename).join(', '));
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function checkTableExistence() {
  console.log('\n🔍 Checking table existence...');
  
  const requiredTables = [
    'profiles',
    'user_roles', 
    'posts',
    'groups',
    'group_memberships',
    'post_likes'
  ];
  
  const existingTables = [];
  const missingTables = [];
  
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await adminClient
        .from(tableName)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === 'PGRST106') {
          missingTables.push(tableName);
          console.log(`❌ Table '${tableName}' does not exist`);
        } else {
          console.log(`⚠️  Table '${tableName}' exists but has issues: ${error.message}`);
          existingTables.push({ name: tableName, issue: error.message });
        }
      } else {
        console.log(`✅ Table '${tableName}' exists (${data?.[0]?.count || 0} rows)`);
        existingTables.push({ name: tableName, count: data?.[0]?.count || 0 });
      }
    } catch (err) {
      console.log(`❌ Error checking table '${tableName}':`, err.message);
      missingTables.push(tableName);
    }
  }
  
  return { existingTables, missingTables };
}

async function testSchemaCache() {
  console.log('\n🔍 Testing schema cache...');
  
  try {
    // Try different approaches to access schema information
    const approaches = [
      {
        name: 'information_schema.tables',
        query: () => adminClient.from('information_schema.tables').select('table_name').limit(1)
      },
      {
        name: 'pg_tables',
        query: () => adminClient.from('pg_tables').select('tablename').limit(1)
      },
      {
        name: 'Direct table access',
        query: () => adminClient.from('profiles').select('count', { count: 'exact', head: true })
      }
    ];
    
    for (const approach of approaches) {
      try {
        const { data, error } = await approach.query();
        if (error) {
          console.log(`❌ ${approach.name}: ${error.message}`);
        } else {
          console.log(`✅ ${approach.name}: Working`);
        }
      } catch (err) {
        console.log(`❌ ${approach.name}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('❌ Schema cache test failed:', err.message);
  }
}

async function createMissingTables(missingTables) {
  if (missingTables.length === 0) {
    console.log('\n✅ All required tables exist');
    return true;
  }
  
  console.log(`\n🔧 Creating ${missingTables.length} missing tables...`);
  
  // SQL for creating missing tables
  const tableCreationSQL = {
    profiles: `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT,
        avatar_url TEXT,
        country TEXT,
        bio TEXT,
        skills TEXT[],
        languages TEXT[],
        timezone TEXT,
        date_of_birth DATE,
        phone_number TEXT,
        social_links JSONB,
        preferences JSONB,
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
    user_roles: `
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
        granted_by UUID REFERENCES profiles(id),
        granted_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE(user_id, role)
      );
    `,
    posts: `
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        tags TEXT[] DEFAULT '{}',
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT posts_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000)
      );
    `,
    groups: `
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        external_link TEXT,
        member_count INTEGER DEFAULT 0,
        created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT groups_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255)
      );
    `,
    group_memberships: `
      CREATE TABLE IF NOT EXISTS group_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE(group_id, user_id)
      );
    `,
    post_likes: `
      CREATE TABLE IF NOT EXISTS post_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(post_id, user_id)
      );
    `
  };
  
  let createdCount = 0;
  
  for (const tableName of missingTables) {
    if (tableCreationSQL[tableName]) {
      try {
        console.log(`🔧 Creating table: ${tableName}`);
        
        const { error } = await adminClient.rpc('exec_sql', { 
          sql: tableCreationSQL[tableName] 
        });
        
        if (error) {
          console.error(`❌ Failed to create ${tableName}:`, error.message);
        } else {
          console.log(`✅ Created table: ${tableName}`);
          createdCount++;
        }
      } catch (err) {
        console.error(`❌ Error creating ${tableName}:`, err.message);
      }
    } else {
      console.log(`⚠️  No creation SQL available for: ${tableName}`);
    }
  }
  
  console.log(`\n📊 Created ${createdCount}/${missingTables.length} tables`);
  return createdCount === missingTables.length;
}

async function setupRLSPolicies() {
  console.log('\n🔧 Setting up RLS policies...');
  
  const rlsSQL = `
    -- Enable RLS on all tables
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
    ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
    
    -- Basic policies for profiles
    CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
    
    -- Basic policies for posts
    CREATE POLICY IF NOT EXISTS "Anyone can view active posts" ON posts
      FOR SELECT USING (is_active = true);
    
    CREATE POLICY IF NOT EXISTS "Users can create posts" ON posts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    -- Basic policies for post_likes
    CREATE POLICY IF NOT EXISTS "Anyone can view likes" ON post_likes
      FOR SELECT USING (true);
    
    CREATE POLICY IF NOT EXISTS "Users can like posts" ON post_likes
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS "Users can unlike posts" ON post_likes
      FOR DELETE USING (auth.uid() = user_id);
  `;
  
  try {
    const { error } = await adminClient.rpc('exec_sql', { sql: rlsSQL });
    
    if (error) {
      console.error('❌ Failed to setup RLS policies:', error.message);
      return false;
    }
    
    console.log('✅ RLS policies set up successfully');
    return true;
  } catch (err) {
    console.error('❌ Error setting up RLS policies:', err.message);
    return false;
  }
}

async function testAnonAccess() {
  console.log('\n🔍 Testing anonymous access...');
  
  try {
    // Test if anon user can access posts
    const { data, error } = await anonClient
      .from('posts')
      .select('id, content, created_at')
      .limit(5);
    
    if (error) {
      console.log('❌ Anonymous access to posts failed:', error.message);
      return false;
    }
    
    console.log(`✅ Anonymous access working (found ${data?.length || 0} posts)`);
    return true;
  } catch (err) {
    console.error('❌ Anonymous access test failed:', err.message);
    return false;
  }
}

async function refreshSchemaCache() {
  console.log('\n🔄 Attempting to refresh schema cache...');
  
  try {
    // Try to force schema refresh by accessing different system tables
    const refreshQueries = [
      'SELECT 1',
      'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 1',
      'SELECT tablename FROM pg_tables WHERE schemaname = \'public\' LIMIT 1'
    ];
    
    for (const query of refreshQueries) {
      try {
        const { error } = await adminClient.rpc('exec_sql', { sql: query });
        if (!error) {
          console.log(`✅ Schema refresh query succeeded: ${query}`);
        }
      } catch (err) {
        console.log(`⚠️  Schema refresh query failed: ${query}`);
      }
    }
    
    console.log('✅ Schema cache refresh attempted');
    return true;
  } catch (err) {
    console.error('❌ Schema cache refresh failed:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Comprehensive Database Diagnosis');
  console.log('=====================================\n');
  
  // Step 1: Test basic connection
  const connected = await testBasicConnection();
  if (!connected) {
    console.log('\n❌ Cannot proceed without basic connection');
    process.exit(1);
  }
  
  // Step 2: Check table existence
  const { existingTables, missingTables } = await checkTableExistence();
  
  // Step 3: Test schema cache
  await testSchemaCache();
  
  // Step 4: Create missing tables if any
  if (missingTables.length > 0) {
    await createMissingTables(missingTables);
    
    // Re-check after creation
    console.log('\n🔍 Re-checking table existence after creation...');
    const { existingTables: newExisting, missingTables: stillMissing } = await checkTableExistence();
    
    if (stillMissing.length > 0) {
      console.log('\n❌ Some tables still missing after creation attempt');
      console.log('📋 Manual creation required for:', stillMissing.join(', '));
    }
  }
  
  // Step 5: Setup RLS policies
  await setupRLSPolicies();
  
  // Step 6: Test anonymous access
  await testAnonAccess();
  
  // Step 7: Refresh schema cache
  await refreshSchemaCache();
  
  // Final summary
  console.log('\n📊 Diagnosis Summary:');
  console.log('=====================');
  console.log(`✅ Existing tables: ${existingTables.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}`);
  
  if (missingTables.length === 0) {
    console.log('\n🎉 Database setup appears to be complete!');
    console.log('💡 Next step: Test the application with real database connection');
  } else {
    console.log('\n⚠️  Database setup incomplete');
    console.log('📋 Manual intervention may be required');
  }
}

main().catch(console.error);