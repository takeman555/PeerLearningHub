#!/usr/bin/env node

/**
 * Create the 8 specified groups for PeerLearningHub
 * This script creates the exact groups specified in the requirements
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The 8 specified groups
const specifiedGroups = [
  {
    name: 'ピアラーニングハブ生成AI部',
    description: '生成AIの活用と学習に関するディスカッション。ChatGPT、Claude、Geminiなどの最新AI技術について情報交換し、実践的な活用方法を共有します。',
    external_link: 'https://discord.gg/ai-learning-hub'
  },
  {
    name: 'さぬきピアラーニングハブゴルフ部',
    description: 'ゴルフを通じた交流とネットワーキング。香川県内のゴルフ場情報、ラウンド企画、技術向上のための情報共有を行います。',
    external_link: 'https://line.me/ti/g/golf-sanuki-hub'
  },
  {
    name: 'さぬきピアラーニングハブ英語部',
    description: '英語学習とスキル向上のためのグループ。英会話練習、TOEIC対策、ビジネス英語など、様々なレベルの学習者が集まります。',
    external_link: 'https://discord.gg/english-learning-sanuki'
  },
  {
    name: 'WAOJEさぬきピアラーニングハブ交流会参加者',
    description: 'WAOJE（海外日本人起業家協会）さぬき支部の交流会参加者のネットワーキング。起業家同士の情報交換と相互支援を行います。',
    external_link: 'https://waoje-sanuki.com/networking'
  },
  {
    name: '香川イノベーションベース',
    description: 'イノベーションと起業に関する活動。スタートアップ支援、新技術の紹介、ビジネスアイデアの共有、投資家とのマッチングを行います。',
    external_link: 'https://kagawa-innovation.jp/community'
  },
  {
    name: 'さぬきピアラーニングハブ居住者',
    description: '香川県内のピアラーニングハブ関連施設の居住者コミュニティ。生活情報の共有、地域イベントの企画、住民同士の交流を促進します。',
    external_link: 'https://telegram.me/sanuki_residents'
  },
  {
    name: '英語キャンプ卒業者',
    description: '英語キャンプ卒業者の継続学習コミュニティ。キャンプで培った英語力の維持・向上、卒業生同士のネットワーキング、新しいキャンプ情報の共有を行います。',
    external_link: 'https://english-camp-alumni.com/community'
  },
  {
    name: 'デジタルノマド香川',
    description: '香川県を拠点とするデジタルノマドのコミュニティ。リモートワーク情報、コワーキングスペース情報、地域での働き方について情報交換します。',
    external_link: 'https://nomad-kagawa.slack.com'
  }
];

async function createAdminUser() {
  console.log('🔍 Looking for admin user...');
  
  try {
    // Look for existing admin users
    const { data: adminRoles, error } = await supabase
      .from('user_roles')
      .select('user_id, profiles(full_name, email)')
      .in('role', ['admin', 'super_admin'])
      .eq('is_active', true)
      .limit(1);
    
    if (error) {
      console.error('Error finding admin user:', error);
      return null;
    }
    
    if (adminRoles && adminRoles.length > 0) {
      const adminUser = adminRoles[0];
      console.log(`✅ Found admin user: ${adminUser.profiles?.full_name || 'Unknown'} (${adminUser.profiles?.email || 'Unknown'})`);
      return adminUser.user_id;
    }
    
    // If no admin user exists, create a system admin
    console.log('⚠️  No admin user found, creating system admin...');
    
    const systemAdminId = 'system-admin-' + Date.now();
    
    // Create system admin profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: systemAdminId,
        email: 'system@peerlearninghub.com',
        full_name: 'System Administrator',
        is_active: true,
        is_verified: true
      });
    
    if (profileError) {
      console.error('Error creating system admin profile:', profileError);
      return null;
    }
    
    // Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: systemAdminId,
        role: 'super_admin',
        is_active: true
      });
    
    if (roleError) {
      console.error('Error assigning admin role:', roleError);
      return null;
    }
    
    console.log('✅ System admin created');
    return systemAdminId;
    
  } catch (error) {
    console.error('Error in createAdminUser:', error);
    return null;
  }
}

async function checkExistingGroups() {
  console.log('🔍 Checking existing groups...');
  
  try {
    const { data: existingGroups, error } = await supabase
      .from('groups')
      .select('name, id')
      .eq('is_active', true);
    
    if (error) {
      console.error('Error checking existing groups:', error);
      return [];
    }
    
    const existingNames = existingGroups ? existingGroups.map(g => g.name) : [];
    console.log(`📋 Found ${existingNames.length} existing groups:`, existingNames);
    
    return existingNames;
  } catch (error) {
    console.error('Error in checkExistingGroups:', error);
    return [];
  }
}

async function createGroups(adminUserId) {
  console.log('🔧 Creating specified groups...');
  
  const existingNames = await checkExistingGroups();
  const groupsToCreate = specifiedGroups.filter(group => !existingNames.includes(group.name));
  
  if (groupsToCreate.length === 0) {
    console.log('✅ All specified groups already exist');
    return true;
  }
  
  console.log(`📝 Creating ${groupsToCreate.length} new groups...`);
  
  let successCount = 0;
  
  for (const group of groupsToCreate) {
    try {
      console.log(`🔧 Creating: ${group.name}`);
      
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: group.name,
          description: group.description,
          external_link: group.external_link,
          created_by: adminUserId,
          is_active: true,
          member_count: 0
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Failed to create ${group.name}:`, error.message);
      } else {
        console.log(`✅ Created: ${group.name}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating ${group.name}:`, error.message);
    }
  }
  
  console.log(`\n📊 Results: ${successCount}/${groupsToCreate.length} groups created successfully`);
  return successCount === groupsToCreate.length;
}

async function verifyGroups() {
  console.log('\n🧪 Verifying created groups...');
  
  try {
    const { data: allGroups, error } = await supabase
      .from('groups')
      .select('name, description, external_link, member_count, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error verifying groups:', error);
      return false;
    }
    
    console.log(`\n📋 All active groups (${allGroups?.length || 0}):`);
    console.log('=' .repeat(60));
    
    if (allGroups) {
      allGroups.forEach((group, index) => {
        console.log(`${index + 1}. ${group.name}`);
        console.log(`   📝 ${group.description?.substring(0, 80)}...`);
        console.log(`   🔗 ${group.external_link}`);
        console.log(`   👥 ${group.member_count} members`);
        console.log(`   📅 ${new Date(group.created_at).toLocaleDateString('ja-JP')}`);
        console.log('');
      });
    }
    
    // Check if all specified groups exist
    const existingNames = allGroups ? allGroups.map(g => g.name) : [];
    const missingGroups = specifiedGroups.filter(g => !existingNames.includes(g.name));
    
    if (missingGroups.length === 0) {
      console.log('✅ All specified groups are present');
      return true;
    } else {
      console.log(`❌ Missing groups: ${missingGroups.map(g => g.name).join(', ')}`);
      return false;
    }
    
  } catch (error) {
    console.error('Error in verifyGroups:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Creating Specified Groups for PeerLearningHub');
  console.log('================================================\n');
  
  // Step 1: Get or create admin user
  const adminUserId = await createAdminUser();
  if (!adminUserId) {
    console.log('❌ Could not get admin user');
    process.exit(1);
  }
  
  // Step 2: Create groups
  const success = await createGroups(adminUserId);
  
  // Step 3: Verify groups
  const verified = await verifyGroups();
  
  // Summary
  console.log('\n📊 Summary:');
  console.log('===========');
  
  if (success && verified) {
    console.log('🎉 All specified groups created and verified successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. ✅ Groups are ready for use');
    console.log('2. ✅ External links are configured');
    console.log('3. 🔄 Test group display in the app');
    console.log('4. 🔄 Verify external link functionality');
  } else {
    console.log('⚠️  Group creation completed with some issues');
    console.log('📋 Please check the logs above for details');
  }
}

main().catch(console.error);