#!/usr/bin/env node

/**
 * Create Specified Groups Script for Community Management Updates
 * 
 * This script creates the 8 specified groups for the community management system.
 * It's designed to be idempotent and can be run multiple times safely.
 * 
 * Requirements: 5.1, 5.2 - Create the specified groups with proper metadata
 * 
 * Usage:
 *   node scripts/createSpecifiedGroups.js [--admin-id=<id>] [--force] [--dry-run]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The 8 specified groups (Requirements: 5.1)
const SPECIFIED_GROUPS = [
  {
    name: 'ピアラーニングハブ生成AI部',
    description: '生成AI技術について学び、実践的なプロジェクトに取り組むコミュニティです。ChatGPT、Claude、Midjourney等の最新AI技術を活用した学習とディスカッションを行います。',
    externalLink: 'https://discord.gg/ai-learning-hub',
    category: 'technology'
  },
  {
    name: 'さぬきピアラーニングハブゴルフ部',
    description: '香川県内でゴルフを楽しみながら、ネットワーキングと学習を組み合わせたユニークなコミュニティです。初心者から上級者まで歓迎します。',
    externalLink: 'https://discord.gg/sanuki-golf-club',
    category: 'sports'
  },
  {
    name: 'さぬきピアラーニングハブ英語部',
    description: '英語学習を通じて国際的な視野を広げるコミュニティです。英会話練習、TOEIC対策、ビジネス英語など様々な学習活動を行います。',
    externalLink: 'https://discord.gg/sanuki-english-club',
    category: 'language'
  },
  {
    name: 'WAOJEさぬきピアラーニングハブ交流会参加者',
    description: 'WAOJE（和僑会）との連携による国際的なビジネス交流会の参加者コミュニティです。グローバルなビジネスネットワーキングと学習機会を提供します。',
    externalLink: 'https://discord.gg/waoje-sanuki-exchange',
    category: 'business'
  },
  {
    name: '香川イノベーションベース',
    description: '香川県を拠点とした起業家、イノベーター、クリエイターのためのコミュニティです。新しいビジネスアイデアの創出と実現をサポートします。',
    externalLink: 'https://discord.gg/kagawa-innovation-base',
    category: 'innovation'
  },
  {
    name: 'さぬきピアラーニングハブ居住者',
    description: 'さぬきピアラーニングハブの居住者専用コミュニティです。共同生活を通じた学習体験と日常的な情報共有を行います。',
    externalLink: 'https://discord.gg/sanuki-residents',
    category: 'residential'
  },
  {
    name: '英語キャンプ卒業者',
    description: '英語キャンプを修了したメンバーのアルムナイコミュニティです。継続的な英語学習サポートと卒業生同士のネットワーキングを提供します。',
    externalLink: 'https://discord.gg/english-camp-alumni',
    category: 'alumni'
  },
  {
    name: 'コミュニティ管理者',
    description: 'ピアラーニングハブのコミュニティ管理を行う管理者専用グループです。運営方針の決定や問題解決を行います。',
    externalLink: 'https://discord.gg/plh-admin',
    category: 'administration'
  }
];

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    adminId: null,
    force: false,
    dryRun: false
  };

  args.forEach(arg => {
    if (arg.startsWith('--admin-id=')) {
      options.adminId = arg.split('=')[1];
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  });

  return options;
}

/**
 * Find admin user
 */
async function findAdminUser(providedAdminId) {
  if (providedAdminId) {
    console.log(`👤 Using provided admin ID: ${providedAdminId}`);
    
    // Verify the provided ID exists and is admin
    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_admin')
        .eq('id', providedAdminId)
        .single();

      if (error || !user) {
        console.log(`   ⚠️  Provided admin ID not found: ${providedAdminId}`);
        return null;
      }

      if (!user.is_admin) {
        console.log(`   ⚠️  User ${providedAdminId} is not an admin`);
        return null;
      }

      console.log(`   ✅ Verified admin user: ${user.full_name || user.email}`);
      return providedAdminId;
    } catch (error) {
      console.log(`   ❌ Error verifying admin user: ${error.message}`);
      return null;
    }
  }

  try {
    // Find existing admin user
    const { data: adminUsers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_admin', true)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.log(`   ⚠️  Error finding admin user: ${error.message}`);
      return null;
    }

    if (adminUsers && adminUsers.length > 0) {
      const admin = adminUsers[0];
      console.log(`   ✅ Found admin user: ${admin.full_name || admin.email} (${admin.id})`);
      return admin.id;
    }

    console.log('   ⚠️  No admin user found');
    return null;
  } catch (error) {
    console.error('   ❌ Error in findAdminUser:', error.message);
    return null;
  }
}

/**
 * Check existing groups
 */
async function checkExistingGroups() {
  try {
    const { data: existingGroups, error } = await supabase
      .from('groups')
      .select('id, name, description, external_link, is_active')
      .eq('is_active', true);

    if (error) {
      console.log(`❌ Error checking existing groups: ${error.message}`);
      return { success: false, groups: [] };
    }

    return { success: true, groups: existingGroups || [] };
  } catch (error) {
    console.error('❌ Error in checkExistingGroups:', error.message);
    return { success: false, groups: [] };
  }
}

/**
 * Validate group data
 */
function validateGroupData(groupData) {
  const errors = [];

  if (!groupData.name || groupData.name.trim().length === 0) {
    errors.push('Group name is required');
  }

  if (groupData.name && groupData.name.length > 255) {
    errors.push('Group name is too long (max 255 characters)');
  }

  if (groupData.description && groupData.description.length > 1000) {
    errors.push('Group description is too long (max 1000 characters)');
  }

  if (groupData.externalLink) {
    try {
      new URL(groupData.externalLink);
    } catch (error) {
      errors.push('External link is not a valid URL');
    }
  }

  return errors;
}

/**
 * Create a single group
 */
async function createGroup(groupData, adminUserId, dryRun = false) {
  // Validate group data
  const validationErrors = validateGroupData(groupData);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  if (dryRun) {
    console.log(`      🔍 DRY RUN: Would create group with data:`);
    console.log(`         Name: ${groupData.name}`);
    console.log(`         Description: ${groupData.description.substring(0, 50)}...`);
    console.log(`         External Link: ${groupData.externalLink}`);
    return { id: 'dry-run-id', name: groupData.name };
  }

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
 * Update existing group
 */
async function updateGroup(existingGroup, groupData, adminUserId, dryRun = false) {
  if (dryRun) {
    console.log(`      🔍 DRY RUN: Would update group with data:`);
    console.log(`         Description: ${groupData.description.substring(0, 50)}...`);
    console.log(`         External Link: ${groupData.externalLink}`);
    return existingGroup;
  }

  try {
    const { data: group, error } = await supabase
      .from('groups')
      .update({
        description: groupData.description,
        external_link: groupData.externalLink,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingGroup.id)
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
 * Create all specified groups
 */
async function createSpecifiedGroups(adminUserId, options) {
  console.log('🏢 Creating specified groups...\n');

  if (!adminUserId) {
    console.log('❌ No admin user available for group creation');
    return { success: false, error: 'No admin user available' };
  }

  // Check existing groups
  console.log('📋 Checking existing groups...');
  const { success: checkSuccess, groups: existingGroups } = await checkExistingGroups();
  
  if (!checkSuccess) {
    return { success: false, error: 'Failed to check existing groups' };
  }

  const existingGroupsMap = new Map();
  existingGroups.forEach(group => {
    existingGroupsMap.set(group.name, group);
  });

  console.log(`   Found ${existingGroups.length} existing groups\n`);

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  // Process each specified group
  for (let i = 0; i < SPECIFIED_GROUPS.length; i++) {
    const groupData = SPECIFIED_GROUPS[i];
    const groupNumber = i + 1;
    
    console.log(`[${groupNumber}/8] Processing: ${groupData.name}`);

    const existingGroup = existingGroupsMap.get(groupData.name);

    try {
      if (existingGroup) {
        // Check if update is needed
        const needsUpdate = 
          existingGroup.description !== groupData.description ||
          existingGroup.external_link !== groupData.externalLink;

        if (needsUpdate && options.force) {
          console.log(`   🔄 Updating existing group...`);
          const updatedGroup = await updateGroup(existingGroup, groupData, adminUserId, options.dryRun);
          console.log(`   ✅ Updated successfully (ID: ${updatedGroup.id})`);
          results.updated++;
        } else if (needsUpdate) {
          console.log(`   ⚠️  Group exists but needs updates (use --force to update)`);
          console.log(`      Current description: ${existingGroup.description?.substring(0, 50)}...`);
          console.log(`      Current external link: ${existingGroup.external_link}`);
          results.skipped++;
        } else {
          console.log(`   ⏭️  Skipped (already exists and up to date)`);
          results.skipped++;
        }
      } else {
        // Create new group
        console.log(`   ➕ Creating new group...`);
        const newGroup = await createGroup(groupData, adminUserId, options.dryRun);
        console.log(`   ✅ Created successfully (ID: ${newGroup.id})`);
        results.created++;
      }
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      console.log(`   ❌ Failed: ${errorMessage}`);
      results.errors.push(`${groupData.name}: ${errorMessage}`);
    }
  }

  const success = results.errors.length === 0;
  console.log(`\n📊 Summary: Created ${results.created}, Updated ${results.updated}, Skipped ${results.skipped}, Errors ${results.errors.length}`);
  
  return { success, results };
}

/**
 * Verify group creation
 */
async function verifyGroupCreation() {
  console.log('\n🔍 Verifying group creation...');

  const { success, groups } = await checkExistingGroups();
  
  if (!success) {
    console.log('   ❌ Failed to verify groups');
    return false;
  }

  const existingNames = groups.map(g => g.name);
  const specifiedNames = SPECIFIED_GROUPS.map(g => g.name);
  
  const missingGroups = specifiedNames.filter(name => !existingNames.includes(name));
  const extraGroups = existingNames.filter(name => !specifiedNames.includes(name));

  console.log(`   📊 Total groups in database: ${groups.length}`);
  console.log(`   ✅ Specified groups found: ${specifiedNames.length - missingGroups.length}/${specifiedNames.length}`);
  
  if (missingGroups.length > 0) {
    console.log(`   ❌ Missing groups: ${missingGroups.join(', ')}`);
  }
  
  if (extraGroups.length > 0) {
    console.log(`   ℹ️  Additional groups: ${extraGroups.length} (${extraGroups.slice(0, 3).join(', ')}${extraGroups.length > 3 ? '...' : ''})`);
  }

  return missingGroups.length === 0;
}

/**
 * Print summary
 */
function printSummary(results, options) {
  console.log('\n📊 GROUP CREATION SUMMARY');
  console.log('========================');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No actual changes made');
  }

  console.log(`➕ Created: ${results.results.created} groups`);
  console.log(`🔄 Updated: ${results.results.updated} groups`);
  console.log(`⏭️  Skipped: ${results.results.skipped} groups`);
  console.log(`❌ Errors: ${results.results.errors.length} groups`);

  if (results.results.errors.length > 0) {
    console.log('\n🚨 ERRORS:');
    results.results.errors.forEach(error => console.log(`   - ${error}`));
  }

  if (results.success && (results.results.created > 0 || results.results.updated > 0)) {
    if (options.dryRun) {
      console.log('\n✅ Dry run completed successfully!');
      console.log('🚀 Run without --dry-run to apply changes');
    } else {
      console.log('\n🎉 Group creation completed successfully!');
      console.log('✅ All specified groups are now available');
    }
  } else if (results.results.created === 0 && results.results.updated === 0 && results.results.skipped === SPECIFIED_GROUPS.length) {
    console.log('\n✅ All specified groups already exist and are up to date');
  } else {
    console.log('\n⚠️  Group creation completed with some issues');
  }
}

/**
 * Main execution function
 */
async function main() {
  const options = parseArguments();
  
  console.log('🎯 Specified Groups Creation Script');
  console.log('==================================\n');

  console.log('⚙️  Options:');
  console.log(`   Admin ID: ${options.adminId || 'Auto-detect'}`);
  console.log(`   Force Updates: ${options.force}`);
  console.log(`   Dry Run: ${options.dryRun}`);
  console.log('');

  try {
    // Find admin user
    console.log('👤 Finding admin user...');
    const adminUserId = await findAdminUser(options.adminId);

    if (!adminUserId) {
      console.error('❌ No admin user available. Please provide a valid admin user ID.');
      process.exit(1);
    }

    // Create groups
    const results = await createSpecifiedGroups(adminUserId, options);

    // Verify creation (only if not dry run and successful)
    if (!options.dryRun && results.success) {
      const verificationSuccess = await verifyGroupCreation();
      results.verified = verificationSuccess;
    }

    // Print summary
    printSummary(results, options);

    process.exit(results.success ? 0 : 1);

  } catch (error) {
    console.error('\n💥 Critical error:', error);
    process.exit(1);
  }
}

// Run script if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  createSpecifiedGroups,
  SPECIFIED_GROUPS,
  findAdminUser,
  checkExistingGroups,
  validateGroupData
};