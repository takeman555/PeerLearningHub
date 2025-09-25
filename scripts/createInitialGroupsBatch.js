#!/usr/bin/env node

/**
 * Script to create the initial 7 groups for the community
 * Requirements: 5.1, 5.2 - Create the specified groups with proper metadata
 * 
 * Usage:
 *   node scripts/createInitialGroupsBatch.js [admin-user-id]
 * 
 * If no admin-user-id is provided, the script will try to find an admin user
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// The 7 specified groups to be created
const INITIAL_GROUPS = [
  {
    name: 'ピアラーニングハブ生成AI部',
    description: '生成AI技術について学び、実践的なプロジェクトに取り組むコミュニティです。ChatGPT、Claude、Midjourney等の最新AI技術を活用した学習とディスカッションを行います。',
    externalLink: 'https://discord.gg/ai-learning-hub'
  },
  {
    name: 'さぬきピアラーニングハブゴルフ部',
    description: '香川県内でゴルフを楽しみながら、ネットワーキングと学習を組み合わせたユニークなコミュニティです。初心者から上級者まで歓迎します。',
    externalLink: 'https://discord.gg/sanuki-golf-club'
  },
  {
    name: 'さぬきピアラーニングハブ英語部',
    description: '英語学習を通じて国際的な視野を広げるコミュニティです。英会話練習、TOEIC対策、ビジネス英語など様々な学習活動を行います。',
    externalLink: 'https://discord.gg/sanuki-english-club'
  },
  {
    name: 'WAOJEさぬきピアラーニングハブ交流会参加者',
    description: 'WAOJE（和僑会）との連携による国際的なビジネス交流会の参加者コミュニティです。グローバルなビジネスネットワーキングと学習機会を提供します。',
    externalLink: 'https://discord.gg/waoje-sanuki-exchange'
  },
  {
    name: '香川イノベーションベース',
    description: '香川県を拠点とした起業家、イノベーター、クリエイターのためのコミュニティです。新しいビジネスアイデアの創出と実現をサポートします。',
    externalLink: 'https://discord.gg/kagawa-innovation-base'
  },
  {
    name: 'さぬきピアラーニングハブ居住者',
    description: 'さぬきピアラーニングハブの居住者専用コミュニティです。共同生活を通じた学習体験と日常的な情報共有を行います。',
    externalLink: 'https://discord.gg/sanuki-residents'
  },
  {
    name: '英語キャンプ卒業者',
    description: '英語キャンプを修了したメンバーのアルムナイコミュニティです。継続的な英語学習サポートと卒業生同士のネットワーキングを提供します。',
    externalLink: 'https://discord.gg/english-camp-alumni'
  }
];

/**
 * Find an admin user in the database
 */
async function findAdminUser() {
  try {
    const { data: adminUsers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_admin', true)
      .limit(1);

    if (error) {
      console.error('Error finding admin user:', error);
      return null;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.warn('No admin users found in the database');
      return null;
    }

    return adminUsers[0];
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
      console.error('Groups table not accessible:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking groups table:', error);
    return false;
  }
}

/**
 * Check which groups already exist
 */
async function checkExistingGroups() {
  try {
    const { data: existingGroups, error } = await supabase
      .from('groups')
      .select('name')
      .eq('is_active', true);

    if (error) {
      console.error('Error checking existing groups:', error);
      return [];
    }

    return existingGroups ? existingGroups.map(g => g.name) : [];
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
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: groupData.name,
        description: groupData.description,
        external_link: groupData.externalLink,
        created_by: adminUserId,
        member_count: 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return group;
  } catch (error) {
    throw error;
  }
}

/**
 * Create all initial groups
 */
async function createInitialGroups(adminUserId) {
  console.log('🚀 Starting batch creation of initial groups...\n');

  // Check if groups table is accessible
  const tableAccessible = await checkGroupsTable();
  if (!tableAccessible) {
    console.error('❌ Groups table is not accessible. Please ensure the database is properly set up.');
    return {
      success: false,
      created: 0,
      errors: ['Groups table not accessible']
    };
  }

  // Check existing groups
  console.log('📋 Checking for existing groups...');
  const existingGroupNames = await checkExistingGroups();
  console.log(`Found ${existingGroupNames.length} existing groups\n`);

  const results = {
    success: true,
    created: 0,
    skipped: 0,
    errors: []
  };

  // Create each group
  for (let i = 0; i < INITIAL_GROUPS.length; i++) {
    const groupData = INITIAL_GROUPS[i];
    const groupNumber = i + 1;
    
    console.log(`[${groupNumber}/7] Processing: ${groupData.name}`);

    // Check if group already exists
    if (existingGroupNames.includes(groupData.name)) {
      console.log(`   ⏭️  Skipped (already exists)`);
      results.skipped++;
      continue;
    }

    try {
      const group = await createGroup(groupData, adminUserId);
      console.log(`   ✅ Created successfully (ID: ${group.id})`);
      results.created++;
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      console.log(`   ❌ Failed: ${errorMessage}`);
      results.errors.push(`${groupData.name}: ${errorMessage}`);
      results.success = false;
    }
  }

  return results;
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🎯 Initial Groups Batch Creation Script');
    console.log('=====================================\n');

    // Get admin user ID from command line or find one
    let adminUserId = process.argv[2];
    
    if (!adminUserId) {
      console.log('🔍 No admin user ID provided, searching for admin user...');
      const adminUser = await findAdminUser();
      
      if (!adminUser) {
        console.error('❌ No admin user found. Please provide an admin user ID as an argument.');
        console.error('Usage: node scripts/createInitialGroupsBatch.js [admin-user-id]');
        process.exit(1);
      }
      
      adminUserId = adminUser.id;
      console.log(`✅ Found admin user: ${adminUser.full_name || adminUser.email} (${adminUserId})\n`);
    } else {
      console.log(`👤 Using provided admin user ID: ${adminUserId}\n`);
    }

    // Create the groups
    const results = await createInitialGroups(adminUserId);

    // Print summary
    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`✅ Created: ${results.created} groups`);
    console.log(`⏭️  Skipped: ${results.skipped} groups (already existed)`);
    console.log(`❌ Errors: ${results.errors.length} groups`);

    if (results.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      results.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (results.success && results.created > 0) {
      console.log('\n🎉 Batch creation completed successfully!');
    } else if (results.created === 0 && results.skipped === INITIAL_GROUPS.length) {
      console.log('\n✅ All groups already exist. No action needed.');
    } else {
      console.log('\n⚠️  Batch creation completed with some issues.');
    }

    process.exit(results.success ? 0 : 1);

  } catch (error) {
    console.error('\n💥 Critical error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createInitialGroups,
  INITIAL_GROUPS,
  findAdminUser,
  checkExistingGroups
};