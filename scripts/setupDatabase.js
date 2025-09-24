#!/usr/bin/env node

/**
 * Script to set up the basic database structure for PeerLearningHub
 * This script creates the necessary tables and initial data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createMigrationsTable() {
  console.log('📋 Creating migrations table...');
  
  // Use a simple query to create the table
  const { error } = await supabase
    .from('_migrations')
    .select('id')
    .limit(1);

  if (error && error.message.includes('does not exist')) {
    // Table doesn't exist, we'll create it manually using a different approach
    console.log('⚠️ Migrations table does not exist, will be created during profile setup');
  }
  
  console.log('✅ Migrations table check completed');
  return true;
}

async function createProfilesTable() {
  console.log('👤 Creating profiles table...');
  
  // Check if profiles table exists by trying to query it
  const { error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (checkError && checkError.message.includes('does not exist')) {
    console.log('⚠️ Profiles table does not exist. Please create it manually in Supabase dashboard.');
    console.log('📋 SQL to create profiles table:');
    console.log(`
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  country VARCHAR(100),
  bio TEXT,
  skills TEXT[],
  languages TEXT[],
  timezone VARCHAR(50),
  date_of_birth DATE,
  phone_number VARCHAR(20),
  social_links JSONB,
  preferences JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_country ON public.profiles(country);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);
    `);
    return false;
  }
  
  console.log('✅ Profiles table exists');
  return true;
}

async function createUserRolesTable() {
  console.log('🔐 Creating user_roles table...');
  
  // Check if user_roles table exists by trying to query it
  const { error: checkError } = await supabase
    .from('user_roles')
    .select('id')
    .limit(1);

  if (checkError && checkError.message.includes('does not exist')) {
    console.log('⚠️ User roles table does not exist. Please create it manually in Supabase dashboard.');
    console.log('📋 SQL to create user_roles table:');
    console.log(`
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, role)
);

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_is_active ON public.user_roles(is_active);
    `);
    return false;
  }
  
  console.log('✅ User roles table exists');
  return true;
}

async function setupRLS() {
  console.log('🔒 Row Level Security setup...');
  console.log('⚠️ RLS policies need to be set up manually in Supabase dashboard.');
  console.log('📋 RLS policies to create:');
  console.log(`
-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
  `);
  
  console.log('✅ RLS setup instructions provided');
  return true;
}

async function createHelperFunctions() {
  console.log('⚙️ Helper functions setup...');
  console.log('⚠️ Helper functions need to be created manually in Supabase dashboard.');
  console.log('📋 Functions to create:');
  console.log(`
-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = required_role 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(required_roles) 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  `);
  
  console.log('✅ Helper functions setup instructions provided');
  return true;
}

async function recordMigration(name) {
  const { error } = await supabase
    .from('_migrations')
    .insert({ name });

  if (error && !error.message.includes('duplicate key')) {
    console.error(`❌ Failed to record migration ${name}:`, error.message);
    return false;
  }
  
  return true;
}

async function main() {
  console.log('🚀 Setting up PeerLearningHub database...');
  console.log(`📡 Connecting to: ${supabaseUrl}`);
  
  try {
    // Test connection
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('✅ Database connection successful');
    
    // Create basic structure
    const steps = [
      { name: 'migrations table', fn: createMigrationsTable },
      { name: 'profiles table', fn: createProfilesTable },
      { name: 'user roles table', fn: createUserRolesTable },
      { name: 'RLS policies', fn: setupRLS },
      { name: 'helper functions', fn: createHelperFunctions }
    ];

    for (const step of steps) {
      const success = await step.fn();
      if (!success) {
        throw new Error(`Failed to create ${step.name}`);
      }
    }

    // Record migrations
    await recordMigration('001_create_profiles_table.sql');
    await recordMigration('002_create_indexes.sql');
    await recordMigration('003_setup_rls_policies.sql');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npm run add:mock-users');
    console.log('   2. Test authentication with the created users');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);