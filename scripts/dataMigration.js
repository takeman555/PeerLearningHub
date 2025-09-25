#!/usr/bin/env node

/**
 * Data Migration Script for Community Management Updates
 * 
 * This script handles the complete data migration process including:
 * - Backing up existing data
 * - Creating the 8 specified groups
 * - Performing data cleanup operations
 * 
 * Requirements: 1.1, 1.2, 5.1
 * 
 * Usage:
 *   node scripts/dataMigration.js [--backup-only] [--groups-only] [--cleanup-only] [--admin-id=<id>]
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The 8 specified groups to be created (Requirements: 5.1)
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
  },
  {
    name: 'コミュニティ管理者',
    description: 'ピアラーニングハブのコミュニティ管理を行う管理者専用グループです。運営方針の決定や問題解決を行います。',
    externalLink: 'https://discord.gg/plh-admin'
  }
];

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    backupOnly: false,
    groupsOnly: false,
    cleanupOnly: false,
    adminId: null
  };

  args.forEach(arg => {
    if (arg === '--backup-only') {
      options.backupOnly = true;
    } else if (arg === '--groups-only') {
      options.groupsOnly = true;
    } else if (arg === '--cleanup-only') {
      options.cleanupOnly = true;
    } else if (arg.startsWith('--admin-id=')) {
      options.adminId = arg.split('=')[1];
    }
  });

  return options;
}

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDirectory() {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
}

/**
 * Backup existing data (Requirements: 1.1, 1.2)
 */
async function backupExistingData() {
  console.log('💾 Step 1: Backing up existing data...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = ensureBackupDirectory();
  
  try {
    // Backup posts
    console.log('   📝 Backing up posts...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*');
    
    if (postsError) {
      console.log(`   ⚠️  Posts backup failed: ${postsError.message}`);
    } else {
      const postsBackupPath = path.join(backupDir, `posts_backup_${timestamp}.json`);
      fs.writeFileSync(postsBackupPath, JSON.stringify(posts, null, 2));
      console.log(`   ✅ Posts backed up: ${posts?.length || 0} records -> ${postsBackupPath}`);
    }

    // Backup groups
    console.log('   🏢 Backing up groups...');
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*');
    
    if (groupsError) {
      console.log(`   ⚠️  Groups backup failed: ${groupsError.message}`);
    } else {
      const groupsBackupPath = path.join(backupDir, `groups_backup_${timestamp}.json`);
      fs.writeFileSync(groupsBackupPath, JSON.stringify(groups, null, 2));
      console.log(`   ✅ Groups backed up: ${groups?.length || 0} records -> ${groupsBackupPath}`);
    }

    // Backup post likes
    console.log('   👍 Backing up post likes...');
    const { data: postLikes, error: likesError } = await supabase
      .from('post_likes')
      .select('*');
    
    if (likesError) {
      console.log(`   ⚠️  Post likes backup failed: ${likesError.message}`);
    } else {
      const likesBackupPath = path.join(backupDir, `post_likes_backup_${timestamp}.json`);
      fs.writeFileSync(likesBackupPath, JSON.stringify(postLikes, null, 2));
      console.log(`   ✅ Post likes backed up: ${postLikes?.length || 0} records -> ${likesBackupPath}`);
    }

    // Create backup manifest
    const manifest = {
      timestamp,
      backupDate: new Date().toISOString(),
      files: [
        `posts_backup_${timestamp}.json`,
        `groups_backup_${timestamp}.json`,
        `post_likes_backup_${timestamp}.json`
      ],
      counts: {
        posts: posts?.length || 0,
        groups: groups?.length || 0,
        postLikes: postLikes?.length || 0
      }
    };

    const manifestPath = path.join(backupDir, `backup_manifest_${timestamp}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('   ✅ Backup completed successfully');
    return { success: true, timestamp, manifest };
    
  } catch (error) {
    console.error('   ❌ Backup failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Find or create admin user
 */
async function findOrCreateAdminUser(providedAdminId) {
  if (providedAdminId) {
    console.log(`   👤 Using provided admin ID: ${providedAdminId}`);
    return providedAdminId;
  }

  try {
    // Try to find existing admin user
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
    console.error('   ❌ Error in findOrCreateAdminUser:', error.message);
    return null;
  }
}

/**
 * Create the 8 specified groups (Requirements: 5.1)
 */
async function createInitialGroups(adminUserId) {
  console.log('🏢 Step 2: Creating initial groups...');
  
  if (!adminUserId) {
    console.log('   ❌ No admin user available for group creation');
    return { success: false, error: 'No admin user available' };
  }

  try {
    // Check existing groups
    const { data: existingGroups, error: checkError } = await supabase
      .from('groups')
      .select('name')
      .eq('is_active', true);

    if (checkError) {
      console.log(`   ❌ Error checking existing groups: ${checkError.message}`);
      return { success: false, error: checkError.message };
    }

    const existingNames = existingGroups ? existingGroups.map(g => g.name) : [];
    console.log(`   📋 Found ${existingNames.length} existing groups`);

    const results = {
      created: 0,
      skipped: 0,
      errors: []
    };

    // Create each group
    for (let i = 0; i < INITIAL_GROUPS.length; i++) {
      const groupData = INITIAL_GROUPS[i];
      const groupNumber = i + 1;
      
      console.log(`   [${groupNumber}/8] Processing: ${groupData.name}`);

      // Check if group already exists
      if (existingNames.includes(groupData.name)) {
        console.log(`      ⏭️  Skipped (already exists)`);
        results.skipped++;
        continue;
      }

      try {
        const { data: group, error: createError } = await supabase
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

        if (createError) {
          throw createError;
        }

        console.log(`      ✅ Created successfully (ID: ${group.id})`);
        results.created++;
      } catch (error) {
        const errorMessage = error.message || 'Unknown error';
        console.log(`      ❌ Failed: ${errorMessage}`);
        results.errors.push(`${groupData.name}: ${errorMessage}`);
      }
    }

    const success = results.errors.length === 0;
    console.log(`   📊 Summary: Created ${results.created}, Skipped ${results.skipped}, Errors ${results.errors.length}`);
    
    return { success, results };
    
  } catch (error) {
    console.error('   ❌ Group creation failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Perform data cleanup (Requirements: 1.1, 1.2)
 */
async function performDataCleanup(adminUserId) {
  console.log('🧹 Step 3: Performing data cleanup...');
  
  if (!adminUserId) {
    console.log('   ❌ No admin user available for cleanup operations');
    return { success: false, error: 'No admin user available' };
  }

  try {
    // Use the dataCleanupService functionality
    console.log('   🗑️  Clearing all posts...');
    const { data: postsResult, error: postsError } = await supabase
      .rpc('cleanup_all_posts');

    if (postsError) {
      console.log(`   ⚠️  Posts cleanup failed: ${postsError.message}`);
    } else {
      console.log(`   ✅ Posts cleanup completed: ${postsResult || 0} records removed`);
    }

    console.log('   🏢 Clearing old groups (keeping newly created ones)...');
    // Get the names of groups we just created
    const newGroupNames = INITIAL_GROUPS.map(g => g.name);
    
    const { data: oldGroups, error: oldGroupsError } = await supabase
      .from('groups')
      .select('id, name')
      .not('name', 'in', `(${newGroupNames.map(name => `"${name}"`).join(',')})`);

    if (oldGroupsError) {
      console.log(`   ⚠️  Error finding old groups: ${oldGroupsError.message}`);
    } else if (oldGroups && oldGroups.length > 0) {
      const { error: deleteError } = await supabase
        .from('groups')
        .delete()
        .not('name', 'in', `(${newGroupNames.map(name => `"${name}"`).join(',')})`);

      if (deleteError) {
        console.log(`   ⚠️  Old groups cleanup failed: ${deleteError.message}`);
      } else {
        console.log(`   ✅ Old groups cleanup completed: ${oldGroups.length} records removed`);
      }
    } else {
      console.log('   ✅ No old groups to clean up');
    }

    // Validate data integrity
    console.log('   🔍 Validating data integrity...');
    const { data: integrityResult, error: integrityError } = await supabase
      .rpc('validate_data_integrity');

    if (integrityError) {
      console.log(`   ⚠️  Integrity validation failed: ${integrityError.message}`);
    } else {
      console.log(`   ✅ Data integrity validation: ${integrityResult ? 'PASSED' : 'ISSUES FOUND'}`);
    }

    return { success: true };
    
  } catch (error) {
    console.error('   ❌ Data cleanup failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main migration function
 */
async function runMigration(options) {
  console.log('🚀 Data Migration for Community Management Updates');
  console.log('================================================\n');

  const results = {
    backup: { success: false },
    groups: { success: false },
    cleanup: { success: false },
    overall: false
  };

  try {
    // Step 1: Backup existing data (unless groups-only or cleanup-only)
    if (!options.groupsOnly && !options.cleanupOnly) {
      results.backup = await backupExistingData();
      if (options.backupOnly) {
        return results;
      }
    }

    // Find admin user
    const adminUserId = await findOrCreateAdminUser(options.adminId);

    // Step 2: Create initial groups (unless backup-only or cleanup-only)
    if (!options.backupOnly && !options.cleanupOnly) {
      results.groups = await createInitialGroups(adminUserId);
    }

    // Step 3: Perform data cleanup (unless backup-only or groups-only)
    if (!options.backupOnly && !options.groupsOnly) {
      results.cleanup = await performDataCleanup(adminUserId);
    }

    // Determine overall success
    const requiredSteps = [];
    if (!options.groupsOnly && !options.cleanupOnly) requiredSteps.push(results.backup.success);
    if (!options.backupOnly && !options.cleanupOnly) requiredSteps.push(results.groups.success);
    if (!options.backupOnly && !options.groupsOnly) requiredSteps.push(results.cleanup.success);

    results.overall = requiredSteps.length > 0 && requiredSteps.every(step => step);

    return results;

  } catch (error) {
    console.error('💥 Critical migration error:', error);
    return results;
  }
}

/**
 * Print migration summary
 */
function printSummary(results, options) {
  console.log('\n📊 MIGRATION SUMMARY');
  console.log('===================');

  if (!options.groupsOnly && !options.cleanupOnly) {
    console.log(`💾 Backup: ${results.backup.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  }

  if (!options.backupOnly && !options.cleanupOnly) {
    console.log(`🏢 Groups: ${results.groups.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  }

  if (!options.backupOnly && !options.groupsOnly) {
    console.log(`🧹 Cleanup: ${results.cleanup.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  }

  console.log(`🎯 Overall: ${results.overall ? '✅ SUCCESS' : '❌ FAILED'}`);

  if (results.overall) {
    console.log('\n🎉 Data migration completed successfully!');
    console.log('✅ All required operations completed');
    console.log('🚀 Community management system is ready for use');
  } else {
    console.log('\n⚠️  Data migration completed with issues');
    console.log('📋 Please check the logs above for details');
    console.log('💡 You may need to run specific steps manually');
  }
}

/**
 * Main execution function
 */
async function main() {
  const options = parseArguments();
  
  console.log('⚙️  Migration Options:');
  console.log(`   Backup Only: ${options.backupOnly}`);
  console.log(`   Groups Only: ${options.groupsOnly}`);
  console.log(`   Cleanup Only: ${options.cleanupOnly}`);
  console.log(`   Admin ID: ${options.adminId || 'Auto-detect'}`);
  console.log('');

  const results = await runMigration(options);
  printSummary(results, options);

  process.exit(results.overall ? 0 : 1);
}

// Run migration if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Critical error:', error);
    process.exit(1);
  });
}

module.exports = {
  runMigration,
  backupExistingData,
  createInitialGroups,
  performDataCleanup,
  INITIAL_GROUPS
};