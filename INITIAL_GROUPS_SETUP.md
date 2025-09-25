# Initial Groups Setup Guide

This guide explains how to set up and manage the initial 7 groups for the PeerLearningHub community management system.

## Overview

The system includes functionality to create and manage 7 specific groups as defined in the requirements:

1. **ピアラーニングハブ生成AI部** - AI technology and generative AI learning community
2. **さぬきピアラーニングハブゴルフ部** - Golf networking and learning community in Kagawa
3. **さぬきピアラーニングハブ英語部** - English learning and skill improvement group
4. **WAOJEさぬきピアラーニングハブ交流会参加者** - WAOJE exchange meeting participants
5. **香川イノベーションベース** - Innovation and startup community in Kagawa
6. **さぬきピアラーニングハブ居住者** - Residents of the PeerLearningHub community
7. **英語キャンプ卒業者** - English camp alumni network

## Requirements Fulfilled

This implementation fulfills the following requirements:

- **5.1**: Create the specified 7 groups with proper metadata
- **5.2**: Batch creation functionality with appropriate database entries
- **6.5**: Group data validation and external link management

## Available Scripts

### NPM Scripts

```bash
# Test the initial groups functionality
npm run test:initial-groups

# Create all initial groups
npm run create:initial-groups

# Check which groups exist
npm run check:initial-groups

# Validate all groups are present
npm run validate:initial-groups
```

### Direct CLI Usage

```bash
# List all initial groups
node scripts/manageInitialGroups.js list

# Check existing groups status
node scripts/manageInitialGroups.js check

# Create all initial groups
node scripts/manageInitialGroups.js create [admin-user-id]

# Create only missing groups
node scripts/manageInitialGroups.js create-missing [admin-user-id]

# Validate all groups exist
node scripts/manageInitialGroups.js validate

# Show help
node scripts/manageInitialGroups.js help
```

### Batch Creation Script

```bash
# Create all groups with automatic admin detection
node scripts/createInitialGroupsBatch.js

# Create all groups with specific admin user
node scripts/createInitialGroupsBatch.js admin-user-123
```

## Usage Examples

### 1. Check Current Status

Before creating groups, check what already exists:

```bash
npm run check:initial-groups
```

This will show:
- How many groups already exist
- Which groups are missing
- Recommendations for next steps

### 2. Create All Groups

To create all initial groups:

```bash
npm run create:initial-groups
```

The script will:
- Automatically find an admin user if none specified
- Create all 7 groups with proper metadata
- Handle errors gracefully
- Provide detailed progress and summary

### 3. Create Only Missing Groups

If some groups already exist, create only the missing ones:

```bash
node scripts/manageInitialGroups.js create-missing
```

This is more efficient and avoids duplicate creation attempts.

### 4. Validate Setup

After creation, validate that all groups are properly set up:

```bash
npm run validate:initial-groups
```

## Group Data Structure

Each group is created with the following structure:

```typescript
interface Group {
  name: string;           // Japanese group name
  description: string;    // Detailed description in Japanese
  externalLink: string;   // Discord/Telegram/other platform link
  createdBy: string;      // Admin user ID
  memberCount: number;    // Initially 0
  isActive: boolean;      // Initially true
  createdAt: Date;        // Creation timestamp
  updatedAt: Date;        // Last update timestamp
}
```

## External Links

All groups include external participation links:

- **Discord servers**: For most groups (AI, Golf, English, etc.)
- **Telegram groups**: For residents
- **Platform-specific links**: For specialized communities

Links are validated for:
- HTTPS protocol requirement
- Valid URL format
- Reasonable length limits
- Known platform domains

## Error Handling

The system handles various error scenarios:

### Database Errors
- **Table not found**: Graceful degradation with clear error messages
- **Permission denied**: Clear feedback about admin requirements
- **Duplicate names**: Prevention of duplicate group creation
- **Connection issues**: Retry logic and fallback behavior

### Permission Errors
- **Non-admin users**: Clear permission denied messages
- **Invalid user IDs**: User validation and error reporting
- **Missing authentication**: Proper authentication checks

### Data Validation Errors
- **Invalid group names**: Length and format validation
- **Invalid descriptions**: Length limits and content validation
- **Invalid external links**: URL format and security validation

## Testing

### Unit Tests
Run the comprehensive test suite:

```bash
npm run test:initial-groups
```

Tests cover:
- CLI command functionality
- Group data validation
- Error handling
- Output format verification

### Manual Testing

1. **List groups**: Verify all 7 groups are defined correctly
2. **Check status**: Verify database connectivity and status reporting
3. **Create groups**: Test creation with and without admin user ID
4. **Validate setup**: Confirm all groups are properly created

## Troubleshooting

### Common Issues

#### 1. "Groups table not found"
```
Error: Could not find the table 'public.groups' in the schema cache
```

**Solution**: Run database migrations first:
```bash
npm run migrate
```

#### 2. "No admin user found"
```
Error: No admin user found. Please provide an admin user ID.
```

**Solution**: Either provide an admin user ID or create an admin user:
```bash
node scripts/manageInitialGroups.js create your-admin-user-id
```

#### 3. "Permission denied"
```
Error: Permission denied
```

**Solution**: Ensure the user has admin privileges in the profiles table:
```sql
UPDATE profiles SET is_admin = true WHERE id = 'your-user-id';
```

#### 4. "Duplicate group names"
```
Error: A group with this name already exists
```

**Solution**: Use the create-missing command instead:
```bash
node scripts/manageInitialGroups.js create-missing
```

### Debug Mode

For detailed debugging, check the console output which includes:
- Step-by-step progress
- Error details with context
- Database query results
- Validation feedback

## Integration with Other Services

### Permission Manager
- Groups creation requires admin permissions
- Permission checks are performed before any database operations
- Proper error messages for permission violations

### Groups Service
- Uses the existing GroupsService for all database operations
- Leverages existing validation and error handling
- Maintains consistency with other group management features

### Data Cleanup Service
- Compatible with data cleanup operations
- Groups can be safely removed and recreated
- Maintains referential integrity

## Maintenance

### Regular Checks
- Periodically validate that all groups exist: `npm run validate:initial-groups`
- Monitor group membership and activity
- Update external links if platforms change

### Updates
- Group descriptions can be updated through the GroupsService
- External links can be modified as needed
- New groups can be added by updating the INITIAL_GROUPS array

### Backup
- Groups data is stored in the database
- Regular database backups include group information
- Groups can be recreated from the defined data structure

## Security Considerations

### External Links
- All external links are validated for HTTPS
- Known platform domains are preferred
- Link validation prevents malicious URLs

### Admin Access
- Only admin users can create groups
- Permission checks are enforced at the service level
- Database-level security through RLS policies

### Data Validation
- Input sanitization for all group data
- Length limits prevent database overflow
- Format validation ensures data consistency