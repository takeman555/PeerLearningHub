#!/usr/bin/env node

/**
 * Migration runner script for PeerLearningHub database
 * This script applies the database migrations to set up the basic authentication tables
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env file and Supabase project settings.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

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

  console.log(`📁 Found ${migrationFiles.length} migration files:`);
  migrationFiles.forEach(file => console.log(`   - ${file}`));
  console.log('');

  // Create migrations tracking table if it doesn't exist
  const { error: trackingError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });

  if (trackingError) {
    console.error('❌ Failed to create migrations tracking table:', trackingError.message);
    process.exit(1);
  }

  // Check which migrations have already been run
  const { data: executedMigrations, error: queryError } = await supabase
    .from('_migrations')
    .select('filename');

  if (queryError) {
    console.error('❌ Failed to query executed migrations:', queryError.message);
    process.exit(1);
  }

  const executedFilenames = new Set(executedMigrations?.map(m => m.filename) || []);

  // Run each migration
  for (const filename of migrationFiles) {
    if (executedFilenames.has(filename)) {
      console.log(`⏭️  Skipping ${filename} (already executed)`);
      continue;
    }

    console.log(`🔄 Running ${filename}...`);
    
    const migrationPath = path.join(migrationsDir, filename);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    try {
      // Execute the migration
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        throw error;
      }

      // Record the migration as executed
      const { error: recordError } = await supabase
        .from('_migrations')
        .insert({ filename });

      if (recordError) {
        throw recordError;
      }

      console.log(`✅ Successfully executed ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to execute ${filename}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 All migrations completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Update your .env file with actual Supabase credentials');
  console.log('   2. Test user registration and authentication');
  console.log('   3. Verify the profiles table is working correctly');
}

// Helper function to execute raw SQL (if rpc doesn't work)
async function executeSql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
  return data;
}

// Run migrations
runMigrations().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});