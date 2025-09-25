#!/usr/bin/env node

/**
 * Data Cleanup Execution Script for Community Management Updates
 * 
 * This script executes comprehensive data cleanup operations including:
 * - Clearing all posts from the database
 * - Clearing all groups from the database (except specified ones)
 * - Validating data integrity after cleanup
 * 
 * Requirements: 1.1, 1.2, 1.3
 * 
 * Usage:
 *   node scripts/executeDataCleanup.js [--admin-id=<id>] [--preserve-groups] [--dry-run] [--force]
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

// Groups to preserve during cleanup (the 8 specified groups)
const PRESERVE_GROUPS = [
  'ピアラーニングハブ生成AI部',
  'さぬきピアラーニングハブゴルフ部',
  'さぬきピアラーニングハブ英語部',
  'WAOJEさぬきピアラーニングハブ交流会参加者',
  '香川イノベーションベース',
  'さぬきピアラーニングハブ居住者',
  '英語キャンプ卒業者',
  'コミュニティ管理者'
];

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    adminId: null,
    preserveGroups: false,
    dryRun: false,
    force: false
  };

  args.forEach(arg => {
    if (arg.startsWith('--admin-id=')) {
      options.adminId = arg.split('=')[1];
    } else if (arg === '--preserve-groups') {
      options.preserveGroups = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
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
 * Get current data counts
 */
async function getCurrentDataCounts() {
  try {
    const counts = {};

    // Count posts
    const { count: postsCount, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    counts.posts = postsError ? -1 : (postsCount || 0);

    // Count groups
    const { count: groupsCount, error: groupsError } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true });

    counts.groups = groupsError ? -1 : (groupsCount || 0);

    // Count post likes
    const { count: likesCount, error: likesError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true });

    counts.postLikes = likesError ? -1 : (likesCount || 0);

    // Count group memberships (if table exists)
    try {
      const { count: membershipsCount, error: membershipsError } = await supabase
        .from('group_memberships')
        .select('*', { count: 'exact', head: true });

      counts.groupMemberships = membershipsError ? -1 : (membershipsCount || 0);
    } catch (error) {
      counts.groupMemberships = 0; // Table might not exist
    }

    return counts;
  } catch (error) {
    console.error('Error getting data counts:', error);
    return {
      posts: -1,
      groups: -1,
      postLikes: -1,
      groupMemberships: -1
    };
  }
}

/**
 * Clear all posts (Requirements: 1.1)
 */
async function clearAllPosts(dryRun = false) {
  console.log('   🗑️  Clearing all posts...');

  try {
    // Get current count
    const { count: currentCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (currentCount === 0) {
      console.log('      ✅ No posts to clear');
      return { success: true, deletedCount: 0 };
    }

    if (dryRun) {
      console.log(`      🔍 DRY RUN: Would delete ${currentCount} posts`);
      return { success: true, deletedCount: currentCount };
    }

    // Use database function if available, otherwise direct delete
    try {
      const { data, error } = await supabase.rpc('cleanup_all_posts');
      
      if (error) {
        throw error;
      }

      console.log(`      ✅ Posts cleared: ${data || currentCount} records deleted`);
      return { success: true, deletedCount: data || currentCount };
    } catch (rpcError) {
      // Fallback to direct deletion
      console.log('      ⚠️  Using fallback deletion method...');
      
      // Delete post likes first (referential integrity)
      const { error: likesError } = await supabase
        .from('post_likes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (likesError) {
        console.log(`      ⚠️  Post likes deletion warning: ${likesError.message}`);
      }

      // Delete posts
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (postsError) {
        throw postsError;
      }

      console.log(`      ✅ Posts cleared: ${currentCount} records deleted (fallback method)`);
      return { success: true, deletedCount: currentCount };
    }
  } catch (error) {
    console.log(`      ❌ Posts cleanup failed: ${error.message}`);
    return { success: false, error: error.message, deletedCount: 0 };
  }
}

/**
 * Clear groups (Requirements: 1.2)
 */
async function clearGroups(preserveGroups = false, dryRun = false) {
  console.log('   🏢 Clearing groups...');

  try {
    let query = supabase.from('groups').select('id, name');
    
    if (preserveGroups) {
      // Only delete groups not in the preserve list
      query = query.not('name', 'in', `(${PRESERVE_GROUPS.map(name => `"${name}"`).join(',')})`);
      console.log('      ℹ️  Preserving specified groups');
    }

    const { data: groupsToDelete, error: selectError } = await query;

    if (selectError) {
      throw selectError;
    }

    if (!groupsToDelete || groupsToDelete.length === 0) {
      console.log('      ✅ No groups to clear');
      return { success: true, deletedCount: 0 };
    }

    if (dryRun) {
      console.log(`      🔍 DRY RUN: Would delete ${groupsToDelete.length} groups`);
      groupsToDelete.forEach(group => {
        console.log(`         - ${group.name}`);
      });
      return { success: true, deletedCount: groupsToDelete.length };
    }

    // Use database function if available, otherwise direct delete
    try {
      if (!preserveGroups) {
        const { data, error } = await supabase.rpc('cleanup_all_groups');
        
        if (error) {
          throw error;
        }

        console.log(`      ✅ Groups cleared: ${data || groupsToDelete.length} records deleted`);
        return { success: true, deletedCount: data || groupsToDelete.length };
      } else {
        // Selective deletion - delete group memberships first
        try {
          const groupIds = groupsToDelete.map(g => g.id);
          
          const { error: membershipsError } = await supabase
            .from('group_memberships')
            .delete()
            .in('group_id', groupIds);

          if (membershipsError) {
            console.log(`      ⚠️  Group memberships deletion warning: ${membershipsError.message}`);
          }
        } catch (error) {
          // Table might not exist
        }

        // Delete groups
        const { error: groupsError } = await supabase
          .from('groups')
          .delete()
          .not('name', 'in', `(${PRESERVE_GROUPS.map(name => `"${name}"`).join(',')})`);

        if (groupsError) {
          throw groupsError;
        }

        console.log(`      ✅ Groups cleared: ${groupsToDelete.length} records deleted (preserved ${PRESERVE_GROUPS.length})`);
        return { success: true, deletedCount: groupsToDelete.length };
      }
    } catch (rpcError) {
      // Fallback to direct deletion
      console.log('      ⚠️  Using fallback deletion method...');
      
      // Delete group memberships first (if table exists)
      try {
        const groupIds = groupsToDelete.map(g => g.id);
        
        const { error: membershipsError } = await supabase
          .from('group_memberships')
          .delete()
          .in('group_id', groupIds);

        if (membershipsError) {
          console.log(`      ⚠️  Group memberships deletion warning: ${membershipsError.message}`);
        }
      } catch (error) {
        // Table might not exist
      }

      // Delete groups
      let deleteQuery = supabase.from('groups').delete();
      
      if (preserveGroups) {
        deleteQuery = deleteQuery.not('name', 'in', `(${PRESERVE_GROUPS.map(name => `"${name}"`).join(',')})`);
      } else {
        deleteQuery = deleteQuery.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      }

      const { error: groupsError } = await deleteQuery;

      if (groupsError) {
        throw groupsError;
      }

      console.log(`      ✅ Groups cleared: ${groupsToDelete.length} records deleted (fallback method)`);
      return { success: true, deletedCount: groupsToDelete.length };
    }
  } catch (error) {
    console.log(`      ❌ Groups cleanup failed: ${error.message}`);
    return { success: false, error: error.message, deletedCount: 0 };
  }
}

/**
 * Validate data integrity (Requirements: 1.3)
 */
async function validateDataIntegrity(dryRun = false) {
  console.log('   🔍 Validating data integrity...');

  if (dryRun) {
    console.log('      🔍 DRY RUN: Would validate data integrity');
    return { success: true, issues: [] };
  }

  try {
    const issues = [];

    // Check for orphaned post likes
    const { data: orphanedLikes, error: likesError } = await supabase
      .from('post_likes')
      .select('id, post_id')
      .not('post_id', 'in', 
        supabase.from('posts').select('id')
      );

    if (likesError) {
      issues.push(`Error checking orphaned post likes: ${likesError.message}`);
    } else if (orphanedLikes && orphanedLikes.length > 0) {
      issues.push(`Found ${orphanedLikes.length} orphaned post likes`);
      
      // Clean up orphaned likes
      const { error: cleanupError } = await supabase
        .from('post_likes')
        .delete()
        .in('id', orphanedLikes.map(like => like.id));

      if (cleanupError) {
        issues.push(`Failed to clean up orphaned post likes: ${cleanupError.message}`);
      } else {
        console.log(`      🧹 Cleaned up ${orphanedLikes.length} orphaned post likes`);
      }
    }

    // Check for orphaned group memberships (if table exists)
    try {
      const { data: orphanedMemberships, error: membershipsError } = await supabase
        .from('group_memberships')
        .select('id, group_id')
        .not('group_id', 'in', 
          supabase.from('groups').select('id')
        );

      if (membershipsError) {
        issues.push(`Error checking orphaned group memberships: ${membershipsError.message}`);
      } else if (orphanedMemberships && orphanedMemberships.length > 0) {
        issues.push(`Found ${orphanedMemberships.length} orphaned group memberships`);
        
        // Clean up orphaned memberships
        const { error: cleanupError } = await supabase
          .from('group_memberships')
          .delete()
          .in('id', orphanedMemberships.map(membership => membership.id));

        if (cleanupError) {
          issues.push(`Failed to clean up orphaned group memberships: ${cleanupError.message}`);
        } else {
          console.log(`      🧹 Cleaned up ${orphanedMemberships.length} orphaned group memberships`);
        }
      }
    } catch (error) {
      // Table might not exist
    }

    // Use database function if available
    try {
      const { data: integrityResult, error: integrityError } = await supabase
        .rpc('validate_data_integrity');

      if (integrityError) {
        issues.push(`Database integrity validation failed: ${integrityError.message}`);
      } else if (!integrityResult) {
        issues.push('Database integrity validation returned false');
      }
    } catch (error) {
      // Function might not exist
    }

    const success = issues.length === 0;
    
    if (success) {
      console.log('      ✅ Data integrity validation passed');
    } else {
      console.log(`      ⚠️  Data integrity issues found: ${issues.length}`);
      issues.forEach(issue => console.log(`         - ${issue}`));
    }

    return { success, issues };
  } catch (error) {
    console.log(`      ❌ Data integrity validation failed: ${error.message}`);
    return { success: false, issues: [error.message] };
  }
}

/**
 * Execute data cleanup
 */
async function executeDataCleanup(adminUserId, options) {
  console.log('🧹 Executing data cleanup...\n');

  if (!adminUserId && !options.force) {
    console.log('❌ No admin user available for cleanup operations');
    console.log('💡 Use --force to bypass admin user requirement (not recommended)');
    return { success: false, error: 'No admin user available' };
  }

  // Get current data counts
  console.log('📊 Current data status:');
  const beforeCounts = await getCurrentDataCounts();
  console.log(`   Posts: ${beforeCounts.posts}`);
  console.log(`   Groups: ${beforeCounts.groups}`);
  console.log(`   Post Likes: ${beforeCounts.postLikes}`);
  console.log(`   Group Memberships: ${beforeCounts.groupMemberships}`);
  console.log('');

  if (!options.force && (beforeCounts.posts > 0 || beforeCounts.groups > 0)) {
    console.log('⚠️  WARNING: This operation will permanently delete data!');
    console.log('💡 Use --dry-run to see what would be deleted');
    console.log('💡 Use --force to proceed with deletion');
    
    if (!options.dryRun) {
      return { success: false, error: 'Operation cancelled - use --force to proceed' };
    }
  }

  const results = {
    posts: { success: false, deletedCount: 0 },
    groups: { success: false, deletedCount: 0 },
    integrity: { success: false, issues: [] }
  };

  try {
    // Step 1: Clear all posts (Requirements: 1.1)
    results.posts = await clearAllPosts(options.dryRun);

    // Step 2: Clear groups (Requirements: 1.2)
    results.groups = await clearGroups(options.preserveGroups, options.dryRun);

    // Step 3: Validate data integrity (Requirements: 1.3)
    results.integrity = await validateDataIntegrity(options.dryRun);

    // Get final data counts
    if (!options.dryRun) {
      console.log('\n📊 Final data status:');
      const afterCounts = await getCurrentDataCounts();
      console.log(`   Posts: ${afterCounts.posts}`);
      console.log(`   Groups: ${afterCounts.groups}`);
      console.log(`   Post Likes: ${afterCounts.postLikes}`);
      console.log(`   Group Memberships: ${afterCounts.groupMemberships}`);
    }

    const overallSuccess = results.posts.success && results.groups.success && results.integrity.success;
    
    return { success: overallSuccess, results, beforeCounts };

  } catch (error) {
    console.error('   ❌ Data cleanup failed:', error.message);
    return { success: false, error: error.message, results };
  }
}

/**
 * Print cleanup summary
 */
function printSummary(cleanupResult, options) {
  console.log('\n📊 DATA CLEANUP SUMMARY');
  console.log('=======================');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No actual changes made');
  }

  const { results } = cleanupResult;

  console.log(`🗑️  Posts: ${results.posts.success ? '✅ SUCCESS' : '❌ FAILED'} (${results.posts.deletedCount} deleted)`);
  console.log(`🏢 Groups: ${results.groups.success ? '✅ SUCCESS' : '❌ FAILED'} (${results.groups.deletedCount} deleted)`);
  console.log(`🔍 Integrity: ${results.integrity.success ? '✅ PASSED' : '⚠️  ISSUES'} (${results.integrity.issues.length} issues)`);
  console.log(`🎯 Overall: ${cleanupResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);

  if (results.integrity.issues.length > 0) {
    console.log('\n🚨 INTEGRITY ISSUES:');
    results.integrity.issues.forEach(issue => console.log(`   - ${issue}`));
  }

  if (cleanupResult.success) {
    if (options.dryRun) {
      console.log('\n✅ Dry run completed successfully!');
      console.log('🚀 Run without --dry-run to apply changes');
    } else {
      console.log('\n🎉 Data cleanup completed successfully!');
      console.log('✅ All cleanup operations completed');
      console.log('🚀 Database is ready for fresh data');
    }
  } else {
    console.log('\n⚠️  Data cleanup completed with issues');
    console.log('📋 Please check the logs above for details');
  }
}

/**
 * Main execution function
 */
async function main() {
  const options = parseArguments();
  
  console.log('🧹 Data Cleanup Execution Script');
  console.log('================================\n');

  console.log('⚙️  Options:');
  console.log(`   Admin ID: ${options.adminId || 'Auto-detect'}`);
  console.log(`   Preserve Groups: ${options.preserveGroups}`);
  console.log(`   Dry Run: ${options.dryRun}`);
  console.log(`   Force: ${options.force}`);
  console.log('');

  if (options.preserveGroups) {
    console.log('🛡️  Groups to preserve:');
    PRESERVE_GROUPS.forEach(group => console.log(`   - ${group}`));
    console.log('');
  }

  try {
    // Find admin user
    console.log('👤 Finding admin user...');
    const adminUserId = await findAdminUser(options.adminId);

    if (!adminUserId && !options.force) {
      console.error('❌ No admin user available. Use --force to bypass (not recommended).');
      process.exit(1);
    }

    // Execute cleanup
    const cleanupResult = await executeDataCleanup(adminUserId, options);

    // Print summary
    printSummary(cleanupResult, options);

    process.exit(cleanupResult.success ? 0 : 1);

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
  executeDataCleanup,
  clearAllPosts,
  clearGroups,
  validateDataIntegrity,
  getCurrentDataCounts,
  PRESERVE_GROUPS
};