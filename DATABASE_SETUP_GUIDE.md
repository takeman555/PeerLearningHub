# Database Setup Guide - Task 2 Implementation

This document explains the implementation of Task 2: "基本認証用データベーステーブルの作成" (Creating Basic Authentication Database Tables).

## Overview

This implementation creates the foundational database schema for the PeerLearningHub application, focusing on user management and authentication. The setup includes:

- ✅ Minimal profiles table creation
- ✅ Row Level Security (RLS) policies
- ✅ Basic indexes for performance
- ✅ Automatic profile creation on user signup
- ✅ Role-based access control system

## Requirements Addressed

### Requirement 1.1: User Profile Management
- Created `profiles` table with comprehensive user information
- Automatic profile creation when users sign up
- Support for skills, languages, preferences, and social links

### Requirement 1.2: User Data Validation and Updates
- Email uniqueness constraints
- Data validation through database constraints
- Updated_at timestamp maintenance
- Profile update capabilities with proper permissions

### Requirement 10.1: Data Integrity
- Foreign key constraints to auth.users
- Check constraints for role validation
- Unique constraints to prevent duplicates
- Proper data types and nullability

### Requirement 10.2: Security Implementation
- Row Level Security (RLS) enabled on all tables
- Role-based access control policies
- Helper functions for permission checking
- Secure triggers with SECURITY DEFINER

## Database Schema

### Tables Created

#### 1. profiles
```sql
- id (UUID, FK to auth.users)
- email (TEXT, UNIQUE, NOT NULL)
- full_name (TEXT)
- avatar_url (TEXT)
- country (TEXT)
- bio (TEXT)
- skills (TEXT[])
- languages (TEXT[])
- timezone (TEXT)
- date_of_birth (DATE)
- phone_number (TEXT)
- social_links (JSONB)
- preferences (JSONB)
- is_verified (BOOLEAN)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 2. user_roles
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FK to profiles)
- role (TEXT, CHECK constraint)
- granted_by (UUID, FK to profiles)
- granted_at (TIMESTAMPTZ)
- expires_at (TIMESTAMPTZ)
- is_active (BOOLEAN)
```

### Indexes Created

#### Performance Indexes
- `idx_profiles_email` - Fast email lookups
- `idx_profiles_is_active` - Filter active users
- `idx_profiles_is_verified` - Filter verified users
- `idx_profiles_skills` - GIN index for array operations
- `idx_profiles_languages` - GIN index for array operations
- `idx_user_roles_user_id` - Fast role lookups by user
- `idx_profiles_active_verified` - Composite index for common queries

### RLS Policies

#### Profiles Table
1. **Users can view own profile** - Users access their own data
2. **Users can update own profile** - Users modify their own data
3. **Authenticated users can view public profile info** - Basic public access
4. **Admins can view all profiles** - Administrative access
5. **Admins can update any profile** - Administrative modifications

#### User Roles Table
1. **Users can view own roles** - Users see their permissions
2. **Admins can view all roles** - Administrative oversight
3. **Super admins can manage roles** - Role management permissions

### Automatic Features

#### Triggers
- **profiles_updated_at** - Maintains updated_at timestamp
- **on_auth_user_created** - Creates profile and assigns default role on signup

#### Functions
- **handle_updated_at()** - Updates timestamp on record changes
- **handle_new_user()** - Creates profile and assigns role for new users
- **auth.has_role()** - Checks if user has specific role
- **auth.has_any_role()** - Checks if user has any of specified roles

## Setup Instructions

### Option 1: Quick Setup (Recommended)
1. Copy contents of `supabase/setup_basic_auth_tables.sql`
2. Paste into Supabase SQL Editor
3. Run the script

### Option 2: Migration Runner
1. Add service role key to `.env` file
2. Run: `npm run migrate`

### Option 3: Individual Migrations
Run these files in order in Supabase SQL Editor:
1. `001_create_profiles_table.sql`
2. `002_create_indexes.sql`
3. `003_setup_rls_policies.sql`

## Testing

### Verify Setup
```bash
npm run db:test
```

### Manual Testing
1. Register a new user in the app
2. Check that profile was created automatically
3. Verify user has 'user' role assigned
4. Test profile updates work correctly

## Security Features

### Row Level Security
- All tables have RLS enabled
- Users can only access their own data by default
- Admins have elevated permissions based on roles
- Public access limited to basic profile information

### Role-Based Access Control
- Four role levels: user, moderator, admin, super_admin
- Roles can have expiration dates
- Role assignment requires super_admin privileges
- Helper functions for easy permission checking

### Data Protection
- Foreign key constraints ensure referential integrity
- Check constraints validate enum values
- Unique constraints prevent duplicate entries
- Triggers maintain data consistency

## Performance Optimizations

### Indexing Strategy
- Primary indexes on frequently queried columns
- GIN indexes for array operations (skills, languages)
- Composite indexes for common filter combinations
- Proper index coverage for RLS policy queries

### Query Optimization
- Efficient RLS policies that use indexes
- Helper functions to reduce query complexity
- Proper foreign key relationships for joins

## Troubleshooting

### Common Issues

1. **Profile not created on signup**
   - Check trigger is installed: `handle_new_user()`
   - Verify trigger exists: `on_auth_user_created`
   - Check for errors in Supabase logs

2. **RLS blocks access**
   - Verify user is authenticated
   - Check user has correct roles
   - Review policy conditions

3. **Migration fails**
   - Ensure service role key is correct
   - Check for existing tables/policies
   - Review Supabase logs for errors

### Verification Queries

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('profiles', 'user_roles');

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('profiles', 'user_roles');

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('profiles', 'user_roles');
```

## Next Steps

After completing this task:

1. ✅ Test user registration and authentication
2. ✅ Verify profile creation works automatically
3. ✅ Check that RLS policies are working correctly
4. 🔄 Proceed to Task 3: Authentication testing and fixes
5. 🔄 Continue with additional feature implementations

## Files Created

- `supabase/migrations/001_create_profiles_table.sql`
- `supabase/migrations/002_create_indexes.sql`
- `supabase/migrations/003_setup_rls_policies.sql`
- `supabase/setup_basic_auth_tables.sql` (complete setup)
- `supabase/README.md`
- `scripts/runMigrations.js`
- `scripts/testDatabaseSetup.js`
- Updated `config/supabase.ts` with proper TypeScript types
- Updated `package.json` with database scripts

## Task Completion

✅ **Task 2 is now complete!**

All requirements have been implemented:
- ✅ Minimal profiles table created
- ✅ Row Level Security (RLS) policies set up
- ✅ Basic indexes added for performance
- ✅ Requirements 1.1, 1.2, 10.1, 10.2 addressed

The database is ready for user authentication and profile management.