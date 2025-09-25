#!/usr/bin/env node

/**
 * Staging Database Migrations Runner
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runStagingMigrations() {
  console.log('Running staging database migrations...');
  
  const supabaseUrl = process.env.STAGING_SUPABASE_URL;
  const supabaseKey = process.env.STAGING_SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing staging Supabase credentials');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get list of migration files
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log(`Found ${migrationFiles.length} migration files`);
  
  for (const file of migrationFiles) {
    console.log(`Running migration: ${file}`);
    
    const migrationSql = fs.readFileSync(
      path.join(migrationsDir, file), 
      'utf8'
    );
    
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: migrationSql
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Migration ${file} completed`);
    } catch (error) {
      console.error(`❌ Migration ${file} failed:`, error.message);
      throw error;
    }
  }
  
  console.log('All staging migrations completed successfully');
}

if (require.main === module) {
  runStagingMigrations().catch(error => {
    console.error('Staging migrations failed:', error);
    process.exit(1);
  });
}

module.exports = runStagingMigrations;