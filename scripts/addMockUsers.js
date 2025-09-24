#!/usr/bin/env node

/**
 * Script to add mock users to Supabase database
 * This script creates test users that can be used for development and testing
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

// Mock users data
const mockUsers = [
  {
    email: 'member1@example.com',
    password: 'password123',
    fullName: '田中 太郎',
    country: 'Japan',
    role: 'user',
    bio: '日本語を学習中の学生です。プログラミングにも興味があります。',
    skills: ['言語学習', 'プログラミング', 'コミュニケーション']
  },
  {
    email: 'member2@example.com',
    password: 'password123',
    fullName: 'Sarah Johnson',
    country: 'USA',
    role: 'user',
    bio: 'Digital nomad interested in Japanese culture and language learning.',
    skills: ['言語学習', 'デジタルノマド', 'コミュニケーション']
  },
  {
    email: 'member3@example.com',
    password: 'password123',
    fullName: 'Kim Min-jun',
    country: 'South Korea',
    role: 'user',
    bio: '韓国からの留学生です。日本で働きたいと思っています。',
    skills: ['言語学習', '就職活動', 'コミュニケーション']
  },
  {
    email: 'admin@peerlearning.com',
    password: 'admin123',
    fullName: '管理者 一郎',
    country: 'Japan',
    role: 'admin',
    bio: 'ピアラーニングハブの管理者です。',
    skills: ['管理', 'サポート', 'システム運用']
  },
  {
    email: 'tizuka0@gmail.com',
    password: 'password123',
    fullName: 'Tizuka Admin',
    country: 'Japan',
    role: 'admin',
    bio: 'システム開発者・管理者',
    skills: ['システム開発', '管理', 'サポート']
  },
  {
    email: 'dev@peerlearning.com',
    password: 'devpassword123',
    fullName: 'Developer User',
    country: 'Japan',
    role: 'super_admin',
    bio: 'システム開発者・スーパー管理者',
    skills: ['システム開発', 'データベース管理', 'セキュリティ']
  }
];

async function createMockUser(userData) {
  try {
    console.log(`Creating user: ${userData.email}`);
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName,
        country: userData.country,
        role: userData.role
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`⚠️  User ${userData.email} already exists, updating profile...`);
        
        // Get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === userData.email);
        
        if (existingUser) {
          // Update profile
          await updateUserProfile(existingUser.id, userData);
          await updateUserRole(existingUser.id, userData.role);
          console.log(`✅ Updated existing user: ${userData.email}`);
        }
        return;
      } else {
        throw authError;
      }
    }

    const user = authData.user;
    console.log(`✅ Created auth user: ${user.email}`);

    // Create profile
    await updateUserProfile(user.id, userData);
    
    // Set user role
    await updateUserRole(user.id, userData.role);
    
    console.log(`✅ Successfully created user: ${userData.email} with role: ${userData.role}`);
    
  } catch (error) {
    console.error(`❌ Failed to create user ${userData.email}:`, error.message);
  }
}

async function updateUserProfile(userId, userData) {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: userData.email,
      full_name: userData.fullName,
      country: userData.country,
      bio: userData.bio,
      skills: userData.skills,
      is_verified: true,
      is_active: true,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to create/update profile: ${error.message}`);
  }
}

async function updateUserRole(userId, role) {
  // First, deactivate any existing roles for this user
  await supabase
    .from('user_roles')
    .update({ is_active: false })
    .eq('user_id', userId);

  // Then create the new role
  const { error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: role,
      granted_by: null, // System granted
      granted_at: new Date().toISOString(),
      is_active: true
    });

  if (error && !error.message.includes('duplicate key')) {
    throw new Error(`Failed to set user role: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting mock user creation...');
  console.log(`📡 Connecting to: ${supabaseUrl}`);
  
  try {
    // Test connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('✅ Database connection successful');
    
    // Create all mock users
    for (const userData of mockUsers) {
      await createMockUser(userData);
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎉 Mock user creation completed!');
    console.log('\n📋 Test Users Created:');
    mockUsers.forEach(user => {
      console.log(`   • ${user.email} (${user.password}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);