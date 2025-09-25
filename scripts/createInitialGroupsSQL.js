#!/usr/bin/env node

/**
 * Script to create the 8 initial groups using raw SQL to bypass schema cache issues
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
 * Find an admin user using raw SQL
 */
async function findAdminUser() {
  try {
    console.log('🔍 Looking for admin user...');
    
    // Use raw SQL to find admin user
    const { data: adminUsers, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT ur.user_id, p.email, p.full_name
        FROM user_roles ur
        JOIN profiles p ON ur.user_id = p.id
        WHERE ur.role IN ('admin', 'super_admin')
        AND ur.is_active = true
        AND p.is_active = true
        LIMIT 1;
      `
    });

    if (!error && adminUsers && adminUsers.length > 0) {
      const admin = adminUsers[0];
      console.log(`✓ Found admin user: ${admin.email} (${admin.full_name || 'No name'})`);
      return admin.user_id;
    }

    // If no admin found, try to find any user
    console.log('⚠ No admin user found, looking for any user to promote...');
    
    const { data: users, error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT id, email, full_name
        FROM profiles
        WHERE is_active = true
        LIMIT 1;
      `
    });

    if (usersError || !users || users.length === 0) {
      console.log('ℹ No users found in the system. Creating a system admin user for group creation...');
      
      // Create a system admin user for initial setup
      const systemAdminId = '00000000-0000-0000-0000-000000000001';
      
      // Create system admin using raw SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO profiles (id, email, full_name, is_active)
          VALUES ($1, $2, $3, true)
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            is_active = EXCLUDED.is_active;
          
          INSERT INTO user_roles (user_id, role, granted_by, is_active)
          VALUES ($1, 'admin', $1, true)
          ON CONFLICT (user_id, role) DO UPDATE SET
            is_active = EXCLUDED.is_active;
        `,
        params: [systemAdminId, 'system-admin@peerlearninghub.local', 'System Administrator']
      });

      if (createError) {
        console.error('Error creating system admin:', createError);
        return null;
      }

      console.log('✓ Created system administrator for initial group setup');
      return systemAdminId;
    }

    const user = users[0];
    console.log(`📝 Promoting user to admin: ${user.email}`);

    // Create admin role using raw SQL
    const { error: roleError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO user_roles (user_id, role, granted_by, is_active)
        VALUES ($1, 'admin', $1, true)
        ON CONFLICT (user_id, role) DO UPDATE SET
          is_active = EXCLUDED.is_active;
      `,
      params: [user.id]
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
 * Check existing groups using raw SQL
 */
async function checkExistingGroups() {
  try {
    const { data: groups, error } = await supabase.rpc('exec_sql', {
      sql: 'SELECT name FROM groups WHERE is_active = true;'
    });

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
 * Create a single group using raw SQL
 */
async function createGroup(groupData, adminUserId) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO groups (name, description, external_link, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, description, external_link, member_count, created_by, is_active, created_at, updated_at;
      `,
      params: [groupData.name, groupData.description, groupData.external_link, adminUserId]
    });

    if (error) {
      throw error;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if we can execute raw SQL
 */
async function checkSQLCapability() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1 as test;'
    });

    if (error) {
      console.log('⚠ Raw SQL execution not available, falling back to regular queries...');
      return false;
    }

    return true;
  } catch (error) {
    console.log('⚠ Raw SQL execution not available, falling back to regular queries...');
    return false;
  }
}

/**
 * Fallback method using regular Supabase queries
 */
async function createGroupFallback(groupData, adminUserId) {
  try {
    // Try direct insert with retry logic
    let retries = 3;
    while (retries > 0) {
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
        if (error.code === 'PGRST205' && retries > 1) {
          console.log(`⏳ Schema cache issue, retrying... (${retries - 1} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          retries--;
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Main function to create initial groups
 */
async function createInitialGroups() {
  console.log('🚀 Starting initial groups creation...\n');

  // Check SQL capability
  const canUseSQL = await checkSQLCapability();
  console.log(canUseSQL ? '✓ Using raw SQL for reliable execution' : '⚠ Using fallback method');

  // Find admin user
  const adminUserId = await findAdminUser();
  if (!adminUserId) {
    console.error('❌ No admin user available. Please create a user and assign admin role first.');
    process.exit(1);
  }

  // Check existing groups
  console.log('🔍 Checking for existing groups...');
  const existingGroups = canUseSQL ? await checkExistingGroups() : [];
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
      
      const group = canUseSQL 
        ? await createGroup(groupData, adminUserId)
        : await createGroupFallback(groupData, adminUserId);
      
      if (group) {
        results.created.push(group);
        console.log(`✓ Successfully created: ${groupData.name}`);
      } else {
        throw new Error('No data returned from creation');
      }
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
  } else if (results.created.length > 0) {
    console.log('✅ Some groups were created successfully. You can retry for the failed ones.');
  } else {
    console.log('⚠ No groups could be created. Please check the errors above.');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createInitialGroups()
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
  INITIAL_GROUPS
};