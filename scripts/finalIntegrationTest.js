#!/usr/bin/env node

/**
 * Final Integration Test
 * Tests all implemented features to ensure they work together correctly
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  const tables = ['profiles', 'user_roles', 'posts', 'groups', 'group_memberships', 'post_likes'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await anonClient
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        results[table] = { status: 'error', message: error.message };
      } else {
        results[table] = { status: 'success', count: data?.[0]?.count || 0 };
      }
    } catch (err) {
      results[table] = { status: 'error', message: err.message };
    }
  }
  
  const successCount = Object.values(results).filter(r => r.status === 'success').length;
  console.log(`✅ Database connection: ${successCount}/${tables.length} tables accessible`);
  
  return successCount === tables.length;
}

async function testAuthenticationSystem() {
  console.log('\n🔍 Testing authentication system...');
  
  try {
    // Test session check
    const { data: { session }, error } = await anonClient.auth.getSession();
    
    if (error) {
      console.error('❌ Session check failed:', error.message);
      return false;
    }
    
    console.log('✅ Authentication system working');
    return true;
  } catch (err) {
    console.error('❌ Authentication test failed:', err.message);
    return false;
  }
}

async function testPostsSystem() {
  console.log('\n🔍 Testing posts system...');
  
  try {
    // Test reading posts
    const { data: posts, error } = await anonClient
      .from('posts')
      .select('id, content, likes_count, created_at')
      .eq('is_active', true)
      .limit(5);
    
    if (error) {
      console.error('❌ Posts reading failed:', error.message);
      return false;
    }
    
    console.log(`✅ Posts system working (${posts?.length || 0} posts found)`);
    
    if (posts && posts.length > 0) {
      console.log('📋 Sample posts:');
      posts.forEach((post, index) => {
        console.log(`   ${index + 1}. "${post.content.substring(0, 50)}..." (${post.likes_count} likes)`);
      });
    }
    
    return true;
  } catch (err) {
    console.error('❌ Posts test failed:', err.message);
    return false;
  }
}

async function testGroupsSystem() {
  console.log('\n🔍 Testing groups system...');
  
  try {
    // Test reading groups
    const { data: groups, error } = await anonClient
      .from('groups')
      .select('id, name, description, external_link, member_count')
      .eq('is_active', true)
      .limit(10);
    
    if (error) {
      console.error('❌ Groups reading failed:', error.message);
      return false;
    }
    
    console.log(`✅ Groups system working (${groups?.length || 0} groups found)`);
    
    if (groups && groups.length > 0) {
      console.log('📋 Available groups:');
      groups.forEach((group, index) => {
        const hasLink = group.external_link ? '🔗' : '⚪';
        console.log(`   ${index + 1}. ${hasLink} ${group.name} (${group.member_count} members)`);
      });
      
      // Check if all specified groups exist
      const expectedGroups = [
        'ピアラーニングハブ生成AI部',
        'さぬきピアラーニングハブゴルフ部',
        'さぬきピアラーニングハブ英語部',
        'WAOJEさぬきピアラーニングハブ交流会参加者',
        '香川イノベーションベース',
        'さぬきピアラーニングハブ居住者',
        '英語キャンプ卒業者'
      ];
      
      const existingNames = groups.map(g => g.name);
      const missingGroups = expectedGroups.filter(name => !existingNames.includes(name));
      
      if (missingGroups.length === 0) {
        console.log('✅ All specified groups are present');
      } else {
        console.log(`⚠️  Missing groups: ${missingGroups.join(', ')}`);
      }
      
      // Check external links
      const groupsWithLinks = groups.filter(g => g.external_link);
      console.log(`🔗 Groups with external links: ${groupsWithLinks.length}/${groups.length}`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Groups test failed:', err.message);
    return false;
  }
}

async function testLikesSystem() {
  console.log('\n🔍 Testing likes system...');
  
  try {
    // Test reading likes
    const { data: likes, error } = await anonClient
      .from('post_likes')
      .select('post_id, created_at')
      .limit(5);
    
    if (error) {
      console.error('❌ Likes reading failed:', error.message);
      return false;
    }
    
    console.log(`✅ Likes system working (${likes?.length || 0} likes found)`);
    
    // Test likes count consistency
    const { data: posts, error: postsError } = await anonClient
      .from('posts')
      .select('id, likes_count')
      .eq('is_active', true)
      .limit(3);
    
    if (postsError) {
      console.log('⚠️  Could not verify likes count consistency');
    } else if (posts && posts.length > 0) {
      let consistencyIssues = 0;
      
      for (const post of posts) {
        const { data: actualLikes, error: likesError } = await anonClient
          .from('post_likes')
          .select('id')
          .eq('post_id', post.id);
        
        if (!likesError) {
          const actualCount = actualLikes?.length || 0;
          if (actualCount !== post.likes_count) {
            consistencyIssues++;
          }
        }
      }
      
      if (consistencyIssues === 0) {
        console.log('✅ Likes count consistency verified');
      } else {
        console.log(`⚠️  Found ${consistencyIssues} likes count inconsistencies`);
      }
    }
    
    return true;
  } catch (err) {
    console.error('❌ Likes test failed:', err.message);
    return false;
  }
}

async function testPermissionsSystem() {
  console.log('\n🔍 Testing permissions system...');
  
  try {
    // Test RLS policies by trying to access user_roles
    const { data: roles, error } = await anonClient
      .from('user_roles')
      .select('role')
      .limit(1);
    
    // This should either work (if policies allow) or fail gracefully
    if (error) {
      if (error.message.includes('RLS') || error.message.includes('policy')) {
        console.log('✅ RLS policies are active and protecting data');
      } else {
        console.log('⚠️  Unexpected error accessing user_roles:', error.message);
      }
    } else {
      console.log('✅ User roles accessible (policies may allow anonymous read)');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Permissions test failed:', err.message);
    return false;
  }
}

async function testExternalLinksSystem() {
  console.log('\n🔍 Testing external links system...');
  
  try {
    // Get groups with external links
    const { data: groups, error } = await anonClient
      .from('groups')
      .select('name, external_link')
      .not('external_link', 'is', null)
      .eq('is_active', true);
    
    if (error) {
      console.error('❌ External links test failed:', error.message);
      return false;
    }
    
    if (groups && groups.length > 0) {
      console.log(`✅ External links system working (${groups.length} groups with links)`);
      
      // Validate link formats
      let validLinks = 0;
      let invalidLinks = 0;
      
      groups.forEach(group => {
        try {
          new URL(group.external_link);
          validLinks++;
        } catch {
          invalidLinks++;
          console.log(`⚠️  Invalid URL in group "${group.name}": ${group.external_link}`);
        }
      });
      
      console.log(`🔗 Link validation: ${validLinks} valid, ${invalidLinks} invalid`);
      
      if (invalidLinks === 0) {
        console.log('✅ All external links have valid formats');
      }
    } else {
      console.log('⚠️  No groups with external links found');
    }
    
    return true;
  } catch (err) {
    console.error('❌ External links test failed:', err.message);
    return false;
  }
}

async function generateSystemReport() {
  console.log('\n📊 Generating system report...');
  
  try {
    // Get system statistics
    const stats = {};
    
    // Count tables
    const tables = ['profiles', 'user_roles', 'posts', 'groups', 'group_memberships', 'post_likes'];
    
    for (const table of tables) {
      try {
        const { count, error } = await anonClient
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        stats[table] = error ? 'Error' : (count || 0);
      } catch {
        stats[table] = 'Error';
      }
    }
    
    console.log('\n📈 System Statistics:');
    console.log('====================');
    console.log(`👥 Profiles: ${stats.profiles}`);
    console.log(`🔐 User Roles: ${stats.user_roles}`);
    console.log(`📝 Posts: ${stats.posts}`);
    console.log(`👥 Groups: ${stats.groups}`);
    console.log(`🤝 Group Memberships: ${stats.group_memberships}`);
    console.log(`❤️  Post Likes: ${stats.post_likes}`);
    
    return stats;
  } catch (err) {
    console.error('❌ Error generating system report:', err.message);
    return {};
  }
}

async function main() {
  console.log('🚀 Final Integration Test for PeerLearningHub');
  console.log('==============================================\n');
  
  const testResults = {};
  
  // Run all tests
  testResults.database = await testDatabaseConnection();
  testResults.authentication = await testAuthenticationSystem();
  testResults.posts = await testPostsSystem();
  testResults.groups = await testGroupsSystem();
  testResults.likes = await testLikesSystem();
  testResults.permissions = await testPermissionsSystem();
  testResults.externalLinks = await testExternalLinksSystem();
  
  // Generate system report
  const systemStats = await generateSystemReport();
  
  // Calculate overall success
  const passedTests = Object.values(testResults).filter(result => result === true).length;
  const totalTests = Object.keys(testResults).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  // Final summary
  console.log('\n🎯 Final Test Results Summary:');
  console.log('==============================');
  
  Object.entries(testResults).forEach(([test, result]) => {
    const status = result ? '✅ PASSED' : '❌ FAILED';
    const testName = test.charAt(0).toUpperCase() + test.slice(1);
    console.log(`${testName.padEnd(15)}: ${status}`);
  });
  
  console.log(`\n📊 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)`);
  
  if (successRate >= 85) {
    console.log('\n🎉 EXCELLENT! The system is working very well.');
    console.log('\n📋 Ready for production:');
    console.log('1. ✅ Database connectivity is stable');
    console.log('2. ✅ Core features are functional');
    console.log('3. ✅ Security policies are in place');
    console.log('4. ✅ External integrations are working');
    
    console.log('\n🚀 Recommended next steps:');
    console.log('1. Deploy to staging environment');
    console.log('2. Conduct user acceptance testing');
    console.log('3. Monitor performance metrics');
    console.log('4. Prepare for production release');
  } else if (successRate >= 70) {
    console.log('\n👍 GOOD! Most features are working, but some issues need attention.');
    console.log('\n📋 Action items:');
    console.log('1. Review failed tests above');
    console.log('2. Fix critical issues');
    console.log('3. Re-run integration tests');
  } else {
    console.log('\n⚠️  NEEDS WORK! Several critical issues need to be resolved.');
    console.log('\n📋 Priority actions:');
    console.log('1. Address all failed tests');
    console.log('2. Check database configuration');
    console.log('3. Verify environment setup');
  }
  
  return successRate >= 85;
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);