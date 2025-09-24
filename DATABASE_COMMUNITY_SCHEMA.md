# Community Management Database Schema

This document describes the database schema and migration process for the community management updates in PeerLearningHub.

## Overview

The community management system includes the following core features:
- **Posts**: User-generated content with tags and engagement tracking
- **Groups**: Community groups with external participation links
- **Permissions**: Role-based access control for posts and group management
- **Data Cleanup**: Administrative functions for data management

## Database Tables

### 1. Posts Table (`public.posts`)

Stores community posts created by users.

```sql
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features:**
- Content length validation (1-5000 characters)
- Tag support for categorization
- Cached counters for performance
- Soft delete with `is_active` flag

### 2. Groups Table (`public.groups`)

Stores community groups with external participation links.

```sql
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  external_link TEXT,
  member_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features:**
- External link validation (must be valid HTTP/HTTPS URL)
- Member count tracking
- Admin-only creation (enforced by RLS)

### 3. Group Memberships Table (`public.group_memberships`)

Tracks user memberships in groups.

```sql
CREATE TABLE public.group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(group_id, user_id)
);
```

### 4. Post Likes Table (`public.post_likes`)

Tracks user likes on posts.

```sql
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
```

## Row Level Security (RLS) Policies

### Posts Policies
- **View**: Anyone can view active posts
- **Create**: Only members can create posts (requires user role)
- **Update/Delete**: Users can only modify their own posts

### Groups Policies
- **View**: Anyone can view active groups
- **Create**: Only admins can create groups
- **Update/Delete**: Only admins can modify groups

### Memberships Policies
- **View**: Anyone can view active memberships
- **Join/Leave**: Users can manage their own memberships

### Likes Policies
- **View**: Anyone can view likes
- **Like/Unlike**: Users can manage their own likes

## Permission System

The system uses role-based permissions defined in the `user_roles` table:

- **user**: Can create posts, join groups, like posts
- **moderator**: User permissions + content moderation
- **admin**: Moderator permissions + group management
- **super_admin**: Full system access

## Data Cleanup Functions

### Core Cleanup Functions

1. **`cleanup_all_posts()`**: Safely removes all posts and related data
2. **`cleanup_all_groups()`**: Safely removes all groups and related data
3. **`validate_data_integrity()`**: Checks for orphaned records
4. **`perform_community_reset(admin_user_id)`**: Complete cleanup and setup

### Initial Groups Setup

The system creates 8 predefined groups as specified in requirements:

1. ピアラーニングハブ生成AI部
2. さぬきピアラーニングハブゴルフ部
3. さぬきピアラーニングハブ英語部
4. WAOJEさぬきピアラーニングハブ交流会参加者
5. 香川イノベーションベース
6. さぬきピアラーニングハブ居住者
7. 英語キャンプ卒業者

Each group includes:
- Descriptive name and description
- External participation link (Discord, Telegram, etc.)
- Proper metadata and timestamps

## Migration Process

### 1. Run Database Migrations

```bash
# Test the schema (optional)
node scripts/testCommunitySchema.js

# Run migrations only
node scripts/runCommunityMigrations.js

# Run migrations with data cleanup and initial setup
node scripts/runCommunityMigrations.js --cleanup

# Specify admin user for group creation
node scripts/runCommunityMigrations.js --cleanup --admin-id=<uuid>
```

### 2. Migration Files

- **`007_create_posts_and_groups_tables.sql`**: Creates core tables, indexes, and RLS policies
- **`008_data_cleanup_and_initial_groups.sql`**: Sets up cleanup functions and initial groups

### 3. Verification

The migration script automatically verifies:
- Table structure and constraints
- Index creation
- RLS policy setup
- Function availability
- Data integrity

## Performance Considerations

### Indexes

Key indexes for performance:
- `idx_posts_created_at`: For chronological post ordering
- `idx_posts_user_id`: For user-specific queries
- `idx_posts_tags`: GIN index for tag searches
- `idx_groups_name`: For group name searches

### Cached Counters

- `posts.likes_count`: Updated via triggers on `post_likes`
- `groups.member_count`: Updated via triggers on `group_memberships`

### Query Optimization

- Use `is_active = true` filters for soft-deleted records
- Implement pagination for large result sets
- Cache frequently accessed group data

## Security Considerations

### Input Validation
- Content length limits on posts
- URL format validation for external links
- SQL injection prevention via parameterized queries

### Access Control
- RLS policies enforce permission checks at database level
- Admin-only operations require role verification
- User isolation prevents unauthorized data access

### Data Protection
- Soft deletes preserve data integrity
- Audit trails via created_at/updated_at timestamps
- Foreign key constraints maintain referential integrity

## Usage Examples

### Creating a Post (Application Code)

```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({
    content: 'My learning progress today...',
    tags: ['React', 'TypeScript', 'Learning']
  });
```

### Fetching Groups with External Links

```typescript
const { data, error } = await supabase
  .from('groups')
  .select('id, name, description, external_link, member_count')
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

### Checking User Permissions

```typescript
const { data, error } = await supabase.rpc('has_role', {
  required_role: 'admin'
});
```

## Troubleshooting

### Common Issues

1. **Migration Fails**: Check environment variables and database connectivity
2. **Permission Denied**: Ensure user has proper role assignments
3. **Constraint Violations**: Verify data format and required fields
4. **RLS Blocking Queries**: Check user authentication and role policies

### Debug Commands

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' AND table_schema = 'public';

-- Verify RLS policies
SELECT policyname, tablename, cmd 
FROM pg_policies 
WHERE tablename IN ('posts', 'groups');

-- Check user roles
SELECT ur.role, ur.is_active 
FROM user_roles ur 
WHERE ur.user_id = auth.uid();
```

## Next Steps

After running the migrations:

1. Update application code to use new database tables
2. Test permission system with different user roles
3. Verify external links functionality
4. Implement UI components for new features
5. Add comprehensive error handling
6. Set up monitoring and logging

For implementation details, see the task list in `.kiro/specs/community-management-updates/tasks.md`.