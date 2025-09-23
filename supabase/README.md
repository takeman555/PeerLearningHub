# Supabase Database Setup

This directory contains the database schema and migration files for the PeerLearningHub application.

## Quick Setup (Recommended)

The easiest way to set up your database is to run the complete setup script in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `setup_basic_auth_tables.sql`
4. Click "Run" to execute the script

This will create all the necessary tables, indexes, and RLS policies for basic authentication.

## Migration Files

If you prefer to run migrations individually, use these files in order:

1. `001_create_profiles_table.sql` - Creates the profiles and user_roles tables with triggers
2. `002_create_indexes.sql` - Adds performance indexes
3. `003_setup_rls_policies.sql` - Sets up Row Level Security policies

## Using the Migration Runner (Advanced)

For automated migration management, you can use the Node.js migration runner:

```bash
# Make sure you have the SUPABASE_SERVICE_ROLE_KEY in your .env file
node scripts/runMigrations.js
```

**Note:** You'll need to add your service role key to your `.env` file:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## What Gets Created

### Tables

1. **profiles** - Extended user information beyond auth.users
   - Links to auth.users via foreign key
   - Stores profile data like name, bio, skills, etc.
   - Automatically created when user signs up

2. **user_roles** - Role-based access control
   - Manages user permissions (user, moderator, admin, super_admin)
   - Supports role expiration
   - Default 'user' role assigned on signup

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data by default
- Admins have elevated permissions based on roles
- Helper functions for role checking

### Performance Features

- Optimized indexes for common queries
- GIN indexes for array fields (skills, languages)
- Composite indexes for frequent filter combinations

### Automatic Features

- Profile creation trigger on user signup
- Updated_at timestamp maintenance
- Default role assignment

## Verification

After running the setup, you can verify everything is working by:

1. Registering a new user in your app
2. Checking that a profile was automatically created
3. Verifying the user has the default 'user' role
4. Testing that RLS policies are working correctly

## Troubleshooting

### Common Issues

1. **Migration fails with permission error**
   - Make sure you're using the service role key, not the anon key
   - Verify your service role key is correct in the .env file

2. **RLS policies block access**
   - Check that your user is properly authenticated
   - Verify the user has the correct roles assigned

3. **Profile not created automatically**
   - Check that the trigger is properly installed
   - Verify the handle_new_user() function exists

### Getting Help

If you encounter issues:

1. Check the Supabase logs in your dashboard
2. Verify your environment variables are correct
3. Test the connection with the SupabaseConnectionTest component
4. Review the RLS policies if you're getting access denied errors

## Next Steps

After setting up the basic authentication tables:

1. Test user registration and login
2. Verify profile creation works
3. Proceed with implementing additional features
4. Add more tables as needed for your application features