#!/usr/bin/env node

/**
 * CLI tool for managing initial groups
 * Requirements: 5.1, 5.2 - Manage the specified groups with proper metadata
 * 
 * Usage:
 *   node scripts/manageInitialGroups.js create [admin-user-id]
 *   node scripts/manageInitialGroups.js check
 *   node scripts/manageInitialGroups.js validate
 *   node scripts/manageInitialGroups.js create-missing [admin-user-id]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Import the batch creation script
const { createInitialGroups, INITIAL_GROUPS, findAdminUser, checkExistingGroups } = require('./createInitialGroupsBatch');

/**
 * Display help information
 */
function showHelp() {
  console.log('Initial Groups Management CLI');
  console.log('============================\n');
  console.log('Commands:');
  console.log('  create [admin-user-id]     Create all initial groups');
  console.log('  check                      Check which groups exist');
  console.log('  validate                   Validate all groups are present');
  console.log('  create-missing [admin-id]  Create only missing groups');
  console.log('  list                       List all initial groups');
  console.log('  help                       Show this help message\n');
  console.log('Examples:');
  console.log('  node scripts/manageInitialGroups.js create');
  console.log('  node scripts/manageInitialGroups.js create user-123');
  console.log('  node scripts/manageInitialGroups.js check');
  console.log('  node scripts/manageInitialGroups.js validate');
}

/**
 * Check and display existing groups status
 */
async function checkGroups() {
  try {
    console.log('🔍 Checking existing groups...\n');

    const existingGroupNames = await checkExistingGroups();
    const requiredNames = INITIAL_GROUPS.map(g => g.name);
    
    const existingGroups = requiredNames.filter(name => existingGroupNames.includes(name));
    const missingGroups = requiredNames.filter(name => !existingGroupNames.includes(name));

    console.log('📊 STATUS REPORT');
    console.log('================');
    console.log(`Total required groups: ${requiredNames.length}`);
    console.log(`✅ Existing: ${existingGroups.length}`);
    console.log(`❌ Missing: ${missingGroups.length}\n`);

    if (existingGroups.length > 0) {
      console.log('✅ EXISTING GROUPS:');
      existingGroups.forEach((name, index) => {
        console.log(`   ${index + 1}. ${name}`);
      });
      console.log();
    }

    if (missingGroups.length > 0) {
      console.log('❌ MISSING GROUPS:');
      missingGroups.forEach((name, index) => {
        console.log(`   ${index + 1}. ${name}`);
      });
      console.log();
    }

    if (missingGroups.length === 0) {
      console.log('🎉 All initial groups are present!');
    } else {
      console.log(`⚠️  ${missingGroups.length} groups need to be created.`);
      console.log('Run: node scripts/manageInitialGroups.js create-missing');
    }

    return {
      existing: existingGroups,
      missing: missingGroups,
      allExist: missingGroups.length === 0
    };
  } catch (error) {
    console.error('❌ Error checking groups:', error.message);
    return null;
  }
}

/**
 * Validate all groups are present
 */
async function validateGroups() {
  try {
    console.log('✅ Validating initial groups...\n');

    const status = await checkGroups();
    
    if (!status) {
      console.log('❌ Validation failed due to error');
      return false;
    }

    if (status.allExist) {
      console.log('🎉 VALIDATION PASSED: All initial groups are present and active!');
      return true;
    } else {
      console.log(`❌ VALIDATION FAILED: ${status.missing.length} groups are missing`);
      return false;
    }
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    return false;
  }
}

/**
 * Create missing groups only
 */
async function createMissingGroups(adminUserId) {
  try {
    console.log('🎯 Creating missing groups only...\n');

    // Check current status
    const status = await checkGroups();
    if (!status) {
      console.error('❌ Cannot proceed due to error checking existing groups');
      return false;
    }

    if (status.allExist) {
      console.log('✅ All groups already exist. No action needed.');
      return true;
    }

    console.log(`\n🚀 Creating ${status.missing.length} missing groups...\n`);

    // Get admin user if not provided
    if (!adminUserId) {
      console.log('🔍 Finding admin user...');
      const adminUser = await findAdminUser();
      if (!adminUser) {
        console.error('❌ No admin user found. Please provide an admin user ID.');
        return false;
      }
      adminUserId = adminUser.id;
      console.log(`✅ Using admin user: ${adminUser.full_name || adminUser.email}\n`);
    }

    // Create only missing groups
    const missingGroupsData = INITIAL_GROUPS.filter(g => status.missing.includes(g.name));
    
    let created = 0;
    let errors = 0;

    for (let i = 0; i < missingGroupsData.length; i++) {
      const groupData = missingGroupsData[i];
      console.log(`[${i + 1}/${missingGroupsData.length}] Creating: ${groupData.name}`);

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

        if (error) throw error;

        console.log(`   ✅ Created successfully (ID: ${group.id})`);
        created++;
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        errors++;
      }
    }

    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`✅ Created: ${created} groups`);
    console.log(`⏭️  Already existed: ${status.existing.length} groups`);
    console.log(`❌ Errors: ${errors} groups`);

    if (created > 0 && errors === 0) {
      console.log('\n🎉 Missing groups created successfully!');
      return true;
    } else if (created > 0) {
      console.log('\n⚠️  Some groups created, but with errors.');
      return false;
    } else {
      console.log('\n❌ No groups were created.');
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating missing groups:', error.message);
    return false;
  }
}

/**
 * List all initial groups
 */
function listGroups() {
  console.log('📋 Initial Groups List');
  console.log('======================\n');

  INITIAL_GROUPS.forEach((group, index) => {
    console.log(`${index + 1}. ${group.name}`);
    console.log(`   Description: ${group.description}`);
    console.log(`   External Link: ${group.externalLink}\n`);
  });

  console.log(`Total: ${INITIAL_GROUPS.length} groups`);
}

/**
 * Main CLI handler
 */
async function main() {
  const command = process.argv[2];
  const adminUserId = process.argv[3];

  switch (command) {
    case 'create':
      console.log('🎯 Creating all initial groups...\n');
      const results = await createInitialGroups(adminUserId);
      process.exit(results.success ? 0 : 1);
      break;

    case 'check':
      await checkGroups();
      break;

    case 'validate':
      const isValid = await validateGroups();
      process.exit(isValid ? 0 : 1);
      break;

    case 'create-missing':
      const success = await createMissingGroups(adminUserId);
      process.exit(success ? 0 : 1);
      break;

    case 'list':
      listGroups();
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      console.error('❌ Unknown command:', command);
      console.log('');
      showHelp();
      process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Critical error:', error);
    process.exit(1);
  });
}

module.exports = {
  checkGroups,
  validateGroups,
  createMissingGroups,
  listGroups
};