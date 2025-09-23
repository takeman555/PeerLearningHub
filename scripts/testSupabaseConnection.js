#!/usr/bin/env node

/**
 * Test Supabase Connection and Setup Tables
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('📋 Existing tables:', data.map(t => t.table_name).join(', '));
    
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function checkProfilesTable() {
  console.log('\n🔍 Checking for profiles table...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('table')) {
        console.log('❌ Profiles table does not exist');
        return false;
      }
      console.error('❌ Error checking profiles table:', error.message);
      return false;
    }
    
    console.log('✅ Profiles table exists');
    return true;
  } catch (err) {
    console.log('❌ Profiles table does not exist:', err.message);
    return false;
  }
}

async function createProfilesTable() {
  console.log('\n🔧 Creating profiles table...');
  
  const sql = `
    -- Enable necessary extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Create profiles table
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

    -- Create user_roles table for role-based access control
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
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Failed to create tables via RPC:', error.message);
      
      // Try alternative method - direct table creation
      console.log('🔄 Trying alternative method...');
      
      const { error: profileError } = await supabase
        .from('profiles')
        .select('count')
        .limit(0);
      
      if (profileError && profileError.message.includes('does not exist')) {
        console.log('📝 Please create the tables manually in Supabase dashboard:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Run the following SQL:');
        console.log('\n' + sql);
        return false;
      }
    }
    
    console.log('✅ Tables created successfully');
    return true;
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
    console.log('\n📝 Manual setup required:');
    console.log('1. Go to Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Execute the migration SQL manually');
    return false;
  }
}

async function setupTriggers() {
  console.log('\n🔧 Setting up triggers and functions...');
  
  const sql = `
    -- Create function to handle updated_at timestamp
    CREATE OR REPLACE FUNCTION handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger for profiles updated_at
    DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
    CREATE TRIGGER profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();

    -- Create function to automatically create profile on user signup
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO profiles (id, email, full_name)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
      );
      
      -- Assign default user role
      INSERT INTO user_roles (user_id, role)
      VALUES (NEW.id, 'user');
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create trigger for automatic profile creation
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  `;
  
  try {
    // Try to execute via RPC first
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.log('⚠️  Could not set up triggers automatically');
      console.log('📝 Please run this SQL in Supabase dashboard:');
      console.log('\n' + sql);
      return false;
    }
    
    console.log('✅ Triggers and functions set up successfully');
    return true;
  } catch (err) {
    console.log('⚠️  Could not set up triggers:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Supabase Setup and Connection Test');
  console.log('====================================\n');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  // Check if profiles table exists
  const profilesExist = await checkProfilesTable();
  
  if (!profilesExist) {
    // Try to create tables
    const created = await createProfilesTable();
    if (!created) {
      console.log('\n❌ Could not create tables automatically');
      console.log('📋 Manual setup required - see instructions above');
      process.exit(1);
    }
    
    // Set up triggers
    await setupTriggers();
  }
  
  // Final test
  console.log('\n🧪 Final connection test...');
  const finalTest = await checkProfilesTable();
  
  if (finalTest) {
    console.log('\n🎉 Setup complete! Authentication should now work.');
    console.log('💡 You can now test user registration and login in your app.');
  } else {
    console.log('\n❌ Setup incomplete. Please check Supabase dashboard.');
  }
}

main().catch(console.error);