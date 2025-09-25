#!/usr/bin/env node

/**
 * Data Backup Script for Community Management Updates
 * 
 * This script creates comprehensive backups of existing community data
 * before performing migration operations.
 * 
 * Requirements: 1.1, 1.2 - Backup existing data before cleanup
 * 
 * Usage:
 *   node scripts/backupData.js [--format=json|sql] [--output-dir=<path>]
 */

const fs = require('fs');
const path = require('path');
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

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    format: 'json',
    outputDir: null
  };

  args.forEach(arg => {
    if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1];
    } else if (arg.startsWith('--output-dir=')) {
      options.outputDir = arg.split('=')[1];
    }
  });

  return options;
}

/**
 * Create backup directory
 */
function createBackupDirectory(customDir) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = customDir || path.join(__dirname, '..', 'backups', `backup_${timestamp}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  return { backupDir, timestamp };
}

/**
 * Backup table data to JSON
 */
async function backupTableToJSON(tableName, backupDir, timestamp) {
  try {
    console.log(`   📝 Backing up ${tableName} table...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.log(`   ⚠️  ${tableName} backup failed: ${error.message}`);
      return { success: false, error: error.message, count: 0 };
    }

    const filename = `${tableName}_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    const count = data ? data.length : 0;
    console.log(`   ✅ ${tableName} backed up: ${count} records -> ${filename}`);
    
    return { success: true, count, filename, filepath };
    
  } catch (error) {
    console.log(`   ❌ ${tableName} backup error: ${error.message}`);
    return { success: false, error: error.message, count: 0 };
  }
}

/**
 * Generate SQL INSERT statements for backup data
 */
function generateSQLInserts(tableName, data) {
  if (!data || data.length === 0) {
    return `-- No data found for table ${tableName}\n`;
  }

  let sql = `-- Backup data for table ${tableName}\n`;
  sql += `-- Generated on ${new Date().toISOString()}\n\n`;
  
  // Get column names from first record
  const columns = Object.keys(data[0]);
  
  data.forEach(record => {
    const values = columns.map(col => {
      const value = record[col];
      if (value === null) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      if (Array.isArray(value)) return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      return value;
    });
    
    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  });
  
  sql += '\n';
  return sql;
}

/**
 * Backup table data to SQL
 */
async function backupTableToSQL(tableName, backupDir, timestamp) {
  try {
    console.log(`   📝 Backing up ${tableName} table to SQL...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.log(`   ⚠️  ${tableName} SQL backup failed: ${error.message}`);
      return { success: false, error: error.message, count: 0 };
    }

    const filename = `${tableName}_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);
    
    const sqlContent = generateSQLInserts(tableName, data);
    fs.writeFileSync(filepath, sqlContent);
    
    const count = data ? data.length : 0;
    console.log(`   ✅ ${tableName} SQL backed up: ${count} records -> ${filename}`);
    
    return { success: true, count, filename, filepath };
    
  } catch (error) {
    console.log(`   ❌ ${tableName} SQL backup error: ${error.message}`);
    return { success: false, error: error.message, count: 0 };
  }
}

/**
 * Get database schema information
 */
async function getSchemaInfo() {
  try {
    // Get table information
    const tables = ['posts', 'groups', 'post_likes', 'group_memberships', 'profiles'];
    const schemaInfo = {};

    for (const tableName of tables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          schemaInfo[tableName] = { exists: false, error: error.message };
        } else {
          schemaInfo[tableName] = { exists: true, count: count || 0 };
        }
      } catch (error) {
        schemaInfo[tableName] = { exists: false, error: error.message };
      }
    }

    return schemaInfo;
  } catch (error) {
    console.error('Error getting schema info:', error);
    return {};
  }
}

/**
 * Create backup manifest
 */
function createBackupManifest(backupDir, timestamp, results, schemaInfo) {
  const manifest = {
    backupId: timestamp,
    createdAt: new Date().toISOString(),
    version: '1.0.0',
    description: 'Community Management Updates - Data Backup',
    schemaInfo,
    tables: {},
    summary: {
      totalTables: 0,
      totalRecords: 0,
      successfulBackups: 0,
      failedBackups: 0
    }
  };

  // Process results
  Object.entries(results).forEach(([tableName, result]) => {
    manifest.tables[tableName] = {
      success: result.success,
      recordCount: result.count,
      filename: result.filename,
      error: result.error || null
    };

    manifest.summary.totalTables++;
    manifest.summary.totalRecords += result.count;
    
    if (result.success) {
      manifest.summary.successfulBackups++;
    } else {
      manifest.summary.failedBackups++;
    }
  });

  // Write manifest
  const manifestPath = path.join(backupDir, `backup_manifest_${timestamp}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  return { manifest, manifestPath };
}

/**
 * Create restore script
 */
function createRestoreScript(backupDir, timestamp, format, results) {
  let restoreScript = '';
  
  if (format === 'json') {
    restoreScript = `#!/usr/bin/env node

/**
 * Restore Script for Backup ${timestamp}
 * Generated automatically - DO NOT EDIT
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function restore() {
  console.log('🔄 Restoring backup ${timestamp}...');
  
  const backupDir = __dirname;
  
  // Restore tables in dependency order
  const tables = ['profiles', 'groups', 'posts', 'post_likes', 'group_memberships'];
  
  for (const tableName of tables) {
    const filename = \`\${tableName}_${timestamp}.json\`;
    const filepath = path.join(backupDir, filename);
    
    if (!fs.existsSync(filepath)) {
      console.log(\`⏭️  Skipping \${tableName} (no backup file)\`);
      continue;
    }
    
    try {
      console.log(\`📝 Restoring \${tableName}...\`);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      if (data.length === 0) {
        console.log(\`   ✅ \${tableName} - no data to restore\`);
        continue;
      }
      
      const { error } = await supabase
        .from(tableName)
        .insert(data);
      
      if (error) {
        console.log(\`   ❌ \${tableName} restore failed: \${error.message}\`);
      } else {
        console.log(\`   ✅ \${tableName} restored: \${data.length} records\`);
      }
    } catch (error) {
      console.log(\`   ❌ \${tableName} restore error: \${error.message}\`);
    }
  }
  
  console.log('🎉 Restore completed!');
}

restore().catch(console.error);
`;
  } else {
    restoreScript = `#!/bin/bash

# Restore Script for Backup ${timestamp}
# Generated automatically - DO NOT EDIT

echo "🔄 Restoring backup ${timestamp}..."

# Note: Execute these SQL files in your Supabase SQL editor
# in the following order:

`;

    Object.entries(results).forEach(([tableName, result]) => {
      if (result.success) {
        restoreScript += `echo "📝 Execute: ${result.filename}"\n`;
      }
    });

    restoreScript += `
echo "🎉 Restore completed!"
`;
  }

  const restoreScriptPath = path.join(backupDir, `restore_${timestamp}.${format === 'json' ? 'js' : 'sh'}`);
  fs.writeFileSync(restoreScriptPath, restoreScript);
  
  if (format === 'sh') {
    fs.chmodSync(restoreScriptPath, '755');
  }
  
  return restoreScriptPath;
}

/**
 * Main backup function
 */
async function performBackup(options) {
  console.log('💾 Community Data Backup');
  console.log('========================\n');

  // Create backup directory
  const { backupDir, timestamp } = createBackupDirectory(options.outputDir);
  console.log(`📁 Backup directory: ${backupDir}\n`);

  // Get schema information
  console.log('🔍 Analyzing database schema...');
  const schemaInfo = await getSchemaInfo();
  
  console.log('📊 Schema Analysis:');
  Object.entries(schemaInfo).forEach(([table, info]) => {
    if (info.exists) {
      console.log(`   ✅ ${table}: ${info.count} records`);
    } else {
      console.log(`   ❌ ${table}: ${info.error}`);
    }
  });
  console.log('');

  // Backup tables
  console.log(`💾 Creating ${options.format.toUpperCase()} backups...`);
  
  const tables = ['posts', 'groups', 'post_likes', 'group_memberships', 'profiles'];
  const results = {};

  for (const tableName of tables) {
    if (!schemaInfo[tableName]?.exists) {
      console.log(`   ⏭️  Skipping ${tableName} (table not accessible)`);
      results[tableName] = { success: false, error: 'Table not accessible', count: 0 };
      continue;
    }

    if (options.format === 'sql') {
      results[tableName] = await backupTableToSQL(tableName, backupDir, timestamp);
    } else {
      results[tableName] = await backupTableToJSON(tableName, backupDir, timestamp);
    }
  }

  // Create manifest
  console.log('\n📋 Creating backup manifest...');
  const { manifest, manifestPath } = createBackupManifest(backupDir, timestamp, results, schemaInfo);
  console.log(`   ✅ Manifest created: ${path.basename(manifestPath)}`);

  // Create restore script
  console.log('🔄 Creating restore script...');
  const restoreScriptPath = createRestoreScript(backupDir, timestamp, options.format, results);
  console.log(`   ✅ Restore script created: ${path.basename(restoreScriptPath)}`);

  return { success: true, manifest, backupDir, results };
}

/**
 * Print backup summary
 */
function printSummary(backupResult) {
  console.log('\n📊 BACKUP SUMMARY');
  console.log('================');
  
  const { manifest } = backupResult;
  
  console.log(`📁 Backup ID: ${manifest.backupId}`);
  console.log(`📅 Created: ${manifest.createdAt}`);
  console.log(`📊 Tables: ${manifest.summary.totalTables}`);
  console.log(`📝 Records: ${manifest.summary.totalRecords}`);
  console.log(`✅ Successful: ${manifest.summary.successfulBackups}`);
  console.log(`❌ Failed: ${manifest.summary.failedBackups}`);

  if (manifest.summary.failedBackups > 0) {
    console.log('\n🚨 FAILED BACKUPS:');
    Object.entries(manifest.tables).forEach(([table, info]) => {
      if (!info.success) {
        console.log(`   - ${table}: ${info.error}`);
      }
    });
  }

  if (manifest.summary.successfulBackups > 0) {
    console.log('\n🎉 Backup completed successfully!');
    console.log(`📁 Backup location: ${backupResult.backupDir}`);
    console.log('🔄 Use the generated restore script to restore data if needed');
  } else {
    console.log('\n⚠️  No data was backed up successfully');
  }
}

/**
 * Main execution function
 */
async function main() {
  const options = parseArguments();
  
  console.log('⚙️  Backup Options:');
  console.log(`   Format: ${options.format}`);
  console.log(`   Output Directory: ${options.outputDir || 'Auto-generated'}`);
  console.log('');

  try {
    const backupResult = await performBackup(options);
    printSummary(backupResult);
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Backup failed:', error);
    process.exit(1);
  }
}

// Run backup if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  performBackup,
  backupTableToJSON,
  backupTableToSQL,
  createBackupManifest
};