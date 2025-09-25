#!/usr/bin/env node

/**
 * Simple script to create the 8 initial groups
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
 * Create groups with retry logic
 */
async function createGroupWithRetry(groupData, adminUserId, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  Attempt ${attempt}/${maxRetries}...`);
      
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
      lastError = error;
      
      if (error.code === 'PGRST205' && attempt < maxRetries) {
        console.log(`  ⏳ Schema cache issue, waiting before retry...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      
      if (error.code === '23505') {
        // Unique constraint violation - group already exists
        console.log(`  ⚠ Group "${groupData.name}" already exists, skipping...`);
        return { name: groupData.name, skipped: true };
      }
      
      break;
    }
  }
  
  throw lastError;
}

/**
 * Create system admin user if needed
 */
async function ensureAdminUser() {
  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  
  try {
    // Check if system admin already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', systemAdminId)
      .single();

    if (existingProfile) {
      console.log('✓ System admin user already exists');
      return systemAdminId;
    }

    console.log('📝 Creating system admin user...');
    
    // Create system admin profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: systemAdminId,
        email: 'system-admin@peerlearninghub.local',
        full_name: 'System Administrator',
        is_active: true
      });

    if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
      throw profileError;
    }

    // Create admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: systemAdminId,
        role: 'admin',
        granted_by: systemAdminId,
        is_active: true
      });

    if (roleError && roleError.code !== '23505') { // Ignore duplicate key error
      throw roleError;
    }

    console.log('✓ System admin user created');
    return systemAdminId;
  } catch (error) {
    console.error('Error creating system admin:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Creating initial groups...\n');

  // Ensure we have an admin user
  const adminUserId = await ensureAdminUser();

  const results = {
    created: [],
    skipped: [],
    errors: []
  };

  // Create groups one by one
  for (let i = 0; i < INITIAL_GROUPS.length; i++) {
    const groupData = INITIAL_GROUPS[i];
    
    console.log(`\n📝 Creating group ${i + 1}/${INITIAL_GROUPS.length}: ${groupData.name}`);
    
    try {
      const result = await createGroupWithRetry(groupData, adminUserId);
      
      if (result.skipped) {
        results.skipped.push(result);
        console.log(`  ⏭ Skipped (already exists)`);
      } else {
        results.created.push(result);
        console.log(`  ✅ Created successfully`);
      }
    } catch (error) {
      const errorMessage = `Failed to create "${groupData.name}": ${error.message}`;
      results.errors.push(errorMessage);
      console.error(`  ❌ ${errorMessage}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`✅ Created: ${results.created.length} groups`);
  console.log(`⏭ Skipped: ${results.skipped.length} groups (already existed)`);
  console.log(`❌ Failed: ${results.errors.length} groups`);
  
  if (results.created.length > 0) {
    console.log('\n📝 Successfully created:');
    results.created.forEach(g => console.log(`   - ${g.name}`));
  }
  
  if (results.skipped.length > 0) {
    console.log('\n⏭ Skipped (already existed):');
    results.skipped.forEach(g => console.log(`   - ${g.name}`));
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Failed:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  const totalSuccess = results.created.length + results.skipped.length;
  const totalExpected = INITIAL_GROUPS.length;
  
  console.log(`\n📈 Overall: ${totalSuccess}/${totalExpected} groups are available`);

  if (totalSuccess === totalExpected) {
    console.log('🎉 All initial groups are now set up!');
    process.exit(0);
  } else if (results.created.length > 0) {
    console.log('✅ Some groups were created. You can retry for failed ones.');
    process.exit(0);
  } else {
    console.log('⚠ No new groups could be created.');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});