#!/usr/bin/env node

/**
 * Manual script to create the 8 initial groups
 * This script creates groups with a placeholder admin that can be updated later
 * Requirements: 5.1, 5.2 - Create specified groups with proper metadata
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
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
 * Find any existing user to use as creator, or use a placeholder
 */
async function findCreatorUser() {
  try {
    // Try to find any existing user
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('is_active', true)
      .limit(1);

    if (profiles && profiles.length > 0) {
      const user = profiles[0];
      console.log(`✓ Using existing user as creator: ${user.email}`);
      return user.id;
    }

    // If no users exist, we'll need to use a placeholder that will be updated later
    console.log('⚠ No users found. Groups will be created with placeholder creator.');
    console.log('  You can update the created_by field later when users are available.');
    
    // Use a well-known UUID that can be easily identified and updated later
    return '99999999-9999-9999-9999-999999999999'; // Placeholder UUID
  } catch (error) {
    console.error('Error finding creator user:', error);
    return '99999999-9999-9999-9999-999999999999'; // Fallback to placeholder
  }
}

/**
 * Create groups with retry logic and better error handling
 */
async function createGroupWithRetry(groupData, creatorUserId, maxRetries = 5) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  Attempt ${attempt}/${maxRetries}...`);
      
      // First, check if group already exists
      const { data: existing } = await supabase
        .from('groups')
        .select('id, name')
        .eq('name', groupData.name)
        .eq('is_active', true)
        .single();

      if (existing) {
        console.log(`  ⚠ Group "${groupData.name}" already exists`);
        return { ...existing, skipped: true };
      }

      // Create the group
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          external_link: groupData.external_link,
          created_by: creatorUserId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      lastError = error;
      
      // Handle schema cache issues
      if (error.code === 'PGRST205' && attempt < maxRetries) {
        console.log(`  ⏳ Schema cache issue, waiting ${attempt * 2}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        continue;
      }
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        console.log(`  ⚠ Group "${groupData.name}" already exists (unique constraint)`);
        return { name: groupData.name, skipped: true };
      }
      
      // Handle foreign key constraint (invalid creator)
      if (error.code === '23503') {
        console.log(`  ⚠ Invalid creator user ID, this will need to be updated later`);
        // Continue with the error for now, but note it
      }
      
      break;
    }
  }
  
  throw lastError;
}

/**
 * Validate groups table accessibility
 */
async function validateGroupsTable() {
  try {
    console.log('🔍 Validating groups table...');
    
    const { error } = await supabase
      .from('groups')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Groups table is not accessible:', error.message);
      console.log('💡 Please ensure the database migrations have been run:');
      console.log('   npm run migrate');
      return false;
    }

    console.log('✓ Groups table is accessible');
    return true;
  } catch (error) {
    console.error('❌ Error validating groups table:', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Creating initial groups for PeerLearningHub...\n');

  // Validate groups table
  const tableValid = await validateGroupsTable();
  if (!tableValid) {
    process.exit(1);
  }

  // Find creator user
  const creatorUserId = await findCreatorUser();

  const results = {
    created: [],
    skipped: [],
    errors: []
  };

  console.log(`\n📝 Creating ${INITIAL_GROUPS.length} groups...\n`);

  // Create groups one by one
  for (let i = 0; i < INITIAL_GROUPS.length; i++) {
    const groupData = INITIAL_GROUPS[i];
    
    console.log(`[${i + 1}/${INITIAL_GROUPS.length}] Creating: ${groupData.name}`);
    
    try {
      const result = await createGroupWithRetry(groupData, creatorUserId);
      
      if (result.skipped) {
        results.skipped.push(result);
        console.log(`  ✓ Skipped (already exists)\n`);
      } else {
        results.created.push(result);
        console.log(`  ✅ Created successfully\n`);
      }
    } catch (error) {
      const errorMessage = `${groupData.name}: ${error.message}`;
      results.errors.push(errorMessage);
      console.error(`  ❌ Failed: ${error.message}\n`);
    }
  }

  // Print detailed summary
  console.log('='.repeat(70));
  console.log('📊 CREATION SUMMARY');
  console.log('='.repeat(70));
  
  console.log(`✅ Successfully created: ${results.created.length} groups`);
  console.log(`⏭ Already existed: ${results.skipped.length} groups`);
  console.log(`❌ Failed: ${results.errors.length} groups`);
  
  if (results.created.length > 0) {
    console.log('\n📝 Successfully created groups:');
    results.created.forEach((g, i) => console.log(`   ${i + 1}. ${g.name}`));
  }
  
  if (results.skipped.length > 0) {
    console.log('\n⏭ Skipped (already existed):');
    results.skipped.forEach((g, i) => console.log(`   ${i + 1}. ${g.name}`));
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Failed to create:');
    results.errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
  }

  const totalSuccess = results.created.length + results.skipped.length;
  const totalExpected = INITIAL_GROUPS.length;
  
  console.log(`\n📈 Overall status: ${totalSuccess}/${totalExpected} groups are available`);

  if (creatorUserId === '99999999-9999-9999-9999-999999999999') {
    console.log('\n⚠ IMPORTANT: Groups were created with a placeholder creator.');
    console.log('   You should update the created_by field when real users are available.');
    console.log('   Run this SQL when you have admin users:');
    console.log('   UPDATE groups SET created_by = \'<real-admin-user-id>\' WHERE created_by = \'99999999-9999-9999-9999-999999999999\';');
  }

  if (totalSuccess === totalExpected) {
    console.log('\n🎉 All initial groups are now set up successfully!');
    process.exit(0);
  } else if (results.created.length > 0) {
    console.log('\n✅ Some groups were created successfully.');
    process.exit(0);
  } else {
    console.log('\n⚠ No new groups could be created.');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('\n💥 Script failed:', error);
  process.exit(1);
});