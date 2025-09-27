#!/usr/bin/env node

/**
 * Profiles Schema Check Script
 * 
 * This script checks the current structure of the profiles table
 * and verifies if the community display settings columns exist.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkProfilesSchema() {
  console.log('🔍 Checking profiles table schema...');
  
  try {
    // Get column information
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Failed to get column information:', columnsError.message);
      return;
    }
    
    console.log('\n📋 Current profiles table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check for required columns
    const columnNames = columns.map(col => col.column_name);
    const requiredColumns = ['show_in_community', 'membership_status', 'role'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`\n❌ Missing columns: ${missingColumns.join(', ')}`);
      console.log('\n💡 You need to run the following SQL in Supabase SQL Editor:');
      console.log('```sql');
      
      if (missingColumns.includes('role')) {
        console.log('ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT \'user\' CHECK (role IN (\'user\', \'admin\'));');
      }
      
      if (missingColumns.includes('show_in_community')) {
        console.log('ALTER TABLE profiles ADD COLUMN show_in_community BOOLEAN DEFAULT true;');
      }
      
      if (missingColumns.includes('membership_status')) {
        console.log('ALTER TABLE profiles ADD COLUMN membership_status TEXT DEFAULT \'free\' CHECK (membership_status IN (\'free\', \'premium\', \'lifetime\'));');
      }
      
      console.log('```');
    } else {
      console.log('\n✅ All required columns exist');
    }
    
    // Check for sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.log(`\n⚠️  Could not fetch sample data: ${sampleError.message}`);
    } else {
      console.log(`\n📊 Sample data (${sampleData.length} rows):`);
      sampleData.forEach((row, index) => {
        console.log(`   Row ${index + 1}:`, JSON.stringify(row, null, 2));
      });
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

async function checkPostsSchema() {
  console.log('\n🔍 Checking posts table schema...');
  
  try {
    // Get column information
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'posts')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Failed to get posts column information:', columnsError.message);
      return;
    }
    
    console.log('\n📋 Current posts table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check foreign key constraints
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'posts')
      .eq('table_schema', 'public');
    
    if (constraintsError) {
      console.log(`\n⚠️  Could not fetch constraint information: ${constraintsError.message}`);
    } else {
      console.log('\n🔗 Posts table constraints:');
      constraints.forEach(constraint => {
        console.log(`   - ${constraint.constraint_name} (${constraint.constraint_type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Posts schema check failed:', error.message);
  }
}

async function main() {
  console.log('🔍 Database Schema Check');
  console.log('========================');
  
  await checkProfilesSchema();
  await checkPostsSchema();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. If columns are missing, run the suggested SQL in Supabase SQL Editor');
  console.log('2. Verify that foreign key relationships are properly set up');
  console.log('3. Test the community functionality after schema updates');
}

main().catch(error => {
  console.error('❌ Schema check failed:', error.message);
  process.exit(1);
});