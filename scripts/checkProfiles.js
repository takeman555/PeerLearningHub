#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  console.log('🔍 Checking profiles table...\n');

  try {
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);

    if (profilesError) {
      console.error('❌ Error accessing profiles:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles.length} profiles:`);
      profiles.forEach(profile => {
        console.log(`  - ${profile.id}: ${profile.full_name || profile.email || 'No name'} (${profile.role || 'no role'})`);
      });
    }

    // Check auth users
    console.log('\n🔍 Checking auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error accessing auth users:', authError.message);
    } else {
      console.log(`✅ Found ${authUsers.users.length} auth users:`);
      authUsers.users.slice(0, 5).forEach(user => {
        console.log(`  - ${user.id}: ${user.email} (created: ${user.created_at})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProfiles();