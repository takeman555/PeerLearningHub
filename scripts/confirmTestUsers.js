#!/usr/bin/env node

/**
 * Confirm Test Users Script
 * This script confirms the email addresses of test users in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please check your .env file for:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testUsers = [
  'member1@example.com',
  'member2@example.com', 
  'member3@example.com',
  'admin@peerlearning.com',
  'tizuka0@gmail.com',
  'dev@peerlearning.com'
];

async function confirmTestUsers() {
  console.log('🔧 Confirming Test Users Email Addresses');
  console.log('==========================================\n');

  for (const email of testUsers) {
    try {
      console.log(`📧 Confirming ${email}...`);
      
      // Update user to confirm email
      const { data, error } = await supabase.auth.admin.updateUserById(
        email, // Using email as ID since that's how we set it up
        {
          email_confirm: true
        }
      );

      if (error) {
        console.log(`⚠️  Could not confirm ${email}: ${error.message}`);
        
        // Try alternative method - get user first then update
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        
        if (!listError && users) {
          const user = users.users.find(u => u.email === email);
          if (user) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              user.id,
              {
                email_confirm: true
              }
            );
            
            if (updateError) {
              console.log(`❌ Failed to confirm ${email}: ${updateError.message}`);
            } else {
              console.log(`✅ Confirmed ${email}`);
            }
          } else {
            console.log(`❌ User ${email} not found`);
          }
        }
      } else {
        console.log(`✅ Confirmed ${email}`);
      }
    } catch (error) {
      console.log(`❌ Error confirming ${email}: ${error.message}`);
    }
  }

  console.log('\n🎉 Test user confirmation process completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Try logging in with any test user');
  console.log('2. Use these credentials:');
  console.log('   - member1@example.com / password123');
  console.log('   - admin@peerlearning.com / admin123');
  console.log('   - tizuka0@gmail.com / password123');
}

async function listUsers() {
  console.log('\n📋 Current Users in Database:');
  console.log('=============================');
  
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error listing users:', error.message);
      return;
    }
    
    if (data && data.users) {
      data.users.forEach(user => {
        console.log(`📧 ${user.email} - Confirmed: ${user.email_confirmed_at ? '✅' : '❌'} - ID: ${user.id}`);
      });
    } else {
      console.log('No users found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
async function main() {
  await listUsers();
  await confirmTestUsers();
  await listUsers();
}

main().catch(console.error);