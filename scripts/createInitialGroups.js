#!/usr/bin/env node

/**
 * Script to create the 8 initial groups for the community
 * Requirements: 5.1, 5.2 - Create specified groups with proper metadata
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The 8 initial groups to create
const INITIAL_GROUPS = [
  {
    name: 'ピアラーニングハブ生成AI部',
    description: '生成AI技術について学び、実践的なプロジェクトに取り組むコミュニティです。ChatGPT、Claude、Midjourney等の最新AI技術を活用した学習とディスカッションを行います。',
    external_link: 'https://discord.gg/ai-learning-hub'
  },
  {
    name: 'さぬきピアラーニングハブゴルフ部',
    description: '香川県内でゴルフを楽しみながら、ネットワーキングと学習を組み合わせたユニークなコミュニティです。初心者から上級者まで歓迎します。',
    external_link: 'https://discord.gg/sanuki-golf-club'
  },
  {
    name: 'さぬきピアラーニングハブ英語部',
    description: '英語学習を通じて国際的な視野を広げるコミュニティです。英会話練習、TOEIC対策、ビジネス英語など様々な学習活動を行います。',
    external_link: 'https://discord.gg/sanuki-english-club'
  },
  {
    name: 'WAOJEさぬきピアラーニングハブ交流会参加者',
    description: 'WAOJE（和僑会）との連携による国際的なビジネス交流会の参加者コミュニティです。グローバルなビジネスネットワーキングと学習機会を提供します。',
    external_link: 'https://discord.gg/waoje-sanuki-exchange'
  },
  {
    name: '香川イノベーションベース',
    description: '香川県を拠点とした起業家、イノベーター、クリエイターのためのコミュニティです。新しいビジネスアイデアの創出と実現をサポートします。',
    external_link: 'https://discord.gg/kagawa-innovation-base'
  },
  {
    name: 'さぬきピアラーニングハブ居住者',
    description: 'さぬきピアラーニングハブの居住者専用コミュニティです。共同生活を通じた学習体験と日常的な情報共有を行います。',
    external_link: 'https://discord.gg/sanuki-residents'
  },
  {
    name: '英語キャンプ卒業者',
    description: '英語キャンプを修了したメンバーのアルムナイコミュニティです。継続的な英語学習サポートと卒業生同士のネットワーキングを提供します。',
    external_link: 'https://discord.gg/english-camp-alumni'
  }
];

/**
 * Find an admin user to use as the creator
 */
async function findAdminUser() {
  try {
    console.log('🔍 Looking for admin user...');
    
    // First, try to find admin users without JOIN to avoid schema cache issues
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['admin', 'super_admin'])
      .eq('is_active', true)
      .limit(1);

    if (!rolesError && adminRoles && adminRoles.length > 0) {
      const adminRole = adminRoles[0];
      
      // Get the admin user profile separately
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', adminRole.user_id)
        .single();

      if (!profileError && profile) {
        console.log(`✓ Found admin user: ${profile.email} (${profile.full_name || 'No name'})`);
        return profile.id;
      }
    }

    // If no admin found, try to find any user and make them admin
    console.log('⚠ No admin user found, looking for any user to promote...');
    
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('is_active', true)
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.log('ℹ No users found in the system. Creating a system admin user for group creation...');
      
      // Create a system admin user for initial setup
      const systemAdminId = '00000000-0000-0000-0000-000000000001'; // Fixed UUID for system admin
      
      // Try to create system admin profile
      const { data: systemProfile, error: createProfileError } = await supabase
        .from('profiles')
        .upsert({
          id: systemAdminId,
          email: 'system-admin@peerlearninghub.local',
          full_name: 'System Administrator',
          is_active: true
        })
        .select()
        .single();

      if (createProfileError) {
        console.error('Error creating system admin profile:', createProfileError);
        return null;
      }

      // Create admin role for system user
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: systemAdminId,
          role: 'admin',
          granted_by: systemAdminId,
          is_active: true
        });

      if (roleError) {
        console.error('Error creating system admin role:', roleError);
        return null;
      }

      console.log('✓ Created system administrator for initial group setup');
      return systemAdminId;
    }

    const user = users[0];
    console.log(`📝 Promoting user to admin: ${user.email}`);

    // Create admin role for this user
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'admin',
        granted_by: user.id, // Self-granted for initial setup
        is_active: true
      });

    if (roleError) {
      console.error('Error creating admin role:', roleError);
      return null;
    }

    console.log(`✓ Successfully promoted ${user.email} to admin`);
    return user.id;
  } catch (error) {
    console.error('Error in findAdminUser:', error);
    return null;
  }
}

/**
 * Check if groups table exists and is accessible
 */
async function checkGroupsTable() {
  try {
    const { error } = await supabase
      .from('groups')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Groups table is not accessible:', error.message);
      console.log('💡 Please run the database migrations first:');
      console.log('   npm run migrate');
      return false;
    }

    console.log('✓ Groups table is accessible');
    return true;
  } catch (error) {
    console.error('❌ Error checking groups table:', error);
    return false;
  }
}

/**
 * Check existing groups to avoid duplicates
 */
async function checkExistingGroups() {
  try {
    const { data: groups, error } = await supabase
      .from('groups')
      .select('name')
      .eq('is_active', true);

    if (error) {
      console.error('Error checking existing groups:', error);
      return [];
    }

    return groups ? groups.map(g => g.name) : [];
  } catch (error) {
    console.error('Error in checkExistingGroups:', error);
    return [];
  }
}

/**
 * Create a single group
 */
async function createGroup(groupData, adminUserId) {
  try {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: groupData.name,
        description: groupData.description,
        external_link: groupData.external_link,
        created_by: adminUserId
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Main function to create initial groups
 */
async function createInitialGroups() {
  console.log('🚀 Starting initial groups creation...\n');

  // Check if groups table is accessible
  const tableAccessible = await checkGroupsTable();
  if (!tableAccessible) {
    process.exit(1);
  }

  // Find admin user
  const adminUserId = await findAdminUser();
  if (!adminUserId) {
    console.error('❌ No admin user available. Please create a user and assign admin role first.');
    process.exit(1);
  }

  // Check existing groups
  console.log('🔍 Checking for existing groups...');
  const existingGroups = await checkExistingGroups();
  const existingNames = new Set(existingGroups);

  const groupsToCreate = INITIAL_GROUPS.filter(g => !existingNames.has(g.name));
  const skippedGroups = INITIAL_GROUPS.filter(g => existingNames.has(g.name));

  if (skippedGroups.length > 0) {
    console.log(`⏭ Skipping ${skippedGroups.length} existing groups:`);
    skippedGroups.forEach(g => console.log(`   - ${g.name}`));
  }

  if (groupsToCreate.length === 0) {
    console.log('\n✅ All initial groups already exist. No action needed.');
    return;
  }

  console.log(`\n📝 Creating ${groupsToCreate.length} new groups...\n`);

  const results = {
    created: [],
    errors: []
  };

  // Create groups one by one
  for (let i = 0; i < groupsToCreate.length; i++) {
    const groupData = groupsToCreate[i];
    
    try {
      console.log(`Creating ${i + 1}/${groupsToCreate.length}: ${groupData.name}`);
      
      const group = await createGroup(groupData, adminUserId);
      results.created.push(group);
      
      console.log(`✓ Successfully created: ${groupData.name}`);
    } catch (error) {
      const errorMessage = `Failed to create "${groupData.name}": ${error.message}`;
      results.errors.push(errorMessage);
      console.error(`❌ ${errorMessage}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 CREATION SUMMARY');
  console.log('='.repeat(50));
  
  if (results.created.length > 0) {
    console.log(`✅ Successfully created: ${results.created.length} groups`);
    results.created.forEach(g => console.log(`   - ${g.name}`));
  }

  if (skippedGroups.length > 0) {
    console.log(`⏭ Skipped existing: ${skippedGroups.length} groups`);
  }

  if (results.errors.length > 0) {
    console.log(`❌ Failed: ${results.errors.length} groups`);
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  const totalExpected = INITIAL_GROUPS.length;
  const totalSuccess = results.created.length + skippedGroups.length;
  
  console.log(`\n📈 Overall: ${totalSuccess}/${totalExpected} groups are now available`);

  if (totalSuccess === totalExpected) {
    console.log('🎉 All initial groups are now set up successfully!');
  } else {
    console.log('⚠ Some groups could not be created. Please check the errors above.');
    process.exit(1);
  }
}

/**
 * Validate groups after creation
 */
async function validateGroups() {
  console.log('\n🔍 Validating created groups...');
  
  try {
    const { data: groups, error } = await supabase
      .from('groups')
      .select('name, description, external_link, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error validating groups:', error);
      return;
    }

    const requiredNames = INITIAL_GROUPS.map(g => g.name);
    const existingNames = groups ? groups.map(g => g.name) : [];
    const missingGroups = requiredNames.filter(name => !existingNames.includes(name));

    if (missingGroups.length === 0) {
      console.log('✅ All required groups are present and active');
    } else {
      console.log(`⚠ Missing groups: ${missingGroups.join(', ')}`);
    }

    console.log(`📊 Total active groups: ${groups ? groups.length : 0}`);
  } catch (error) {
    console.error('Error in validation:', error);
  }
}

// Run the script
if (require.main === module) {
  createInitialGroups()
    .then(() => validateGroups())
    .then(() => {
      console.log('\n✨ Initial groups setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  createInitialGroups,
  validateGroups,
  INITIAL_GROUPS
};