#!/usr/bin/env node

/**
 * Migration display script for PeerLearningHub database
 * This script shows the SQL migrations that need to be run manually
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 PeerLearningHub Database Migrations\n');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

if (!fs.existsSync(migrationsDir)) {
  console.error('❌ Migrations directory not found:', migrationsDir);
  process.exit(1);
}

// Get all migration files
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

if (migrationFiles.length === 0) {
  console.log('ℹ️  No migration files found.');
  return;
}

console.log(`📁 Found ${migrationFiles.length} migration files:\n`);

migrationFiles.forEach((filename, index) => {
  const migrationPath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(`${index + 1}. ${filename}`);
  console.log('─'.repeat(50));
  console.log(sql);
  console.log('\n' + '='.repeat(80) + '\n');
});

console.log('📋 Manual Execution Instructions:');
console.log('1. Open your Supabase project dashboard');
console.log('2. Go to SQL Editor');
console.log('3. Copy and paste each migration SQL above');
console.log('4. Execute them in order');
console.log('\n✨ After running migrations, your database will be ready!');