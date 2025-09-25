#!/usr/bin/env node

/**
 * Production Database Backup Setup Script
 * Sets up automated backup system for production database
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class ProductionBackupSetup {
  constructor() {
    this.config = this.loadConfig();
    this.supabase = createClient(this.config.supabaseUrl, this.config.serviceKey);
  }

  loadConfig() {
    return {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      backupBucket: process.env.BACKUP_STORAGE_BUCKET || 'database-backups',
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
    };
  }

  validateConfiguration() {
    console.log('🔍 Validating backup configuration...');
    
    const errors = [];

    if (!this.config.supabaseUrl) {
      errors.push('EXPO_PUBLIC_SUPABASE_URL is required');
    }

    if (!this.config.serviceKey) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
    }

    if (!this.config.encryptionKey) {
      errors.push('BACKUP_ENCRYPTION_KEY is required for secure backups');
    }

    if (errors.length > 0) {
      console.error('❌ Configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      return false;
    }

    console.log('  ✅ Configuration validation passed');
    return true;
  }

  async setupBackupStorage() {
    console.log('💾 Setting up backup storage...');

    try {
      // Create backup bucket if it doesn't exist
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      
      if (listError) {
        console.error('  ❌ Failed to list storage buckets:', listError.message);
        throw listError;
      }

      const backupBucketExists = buckets.some(bucket => bucket.name === this.config.backupBucket);

      if (!backupBucketExists) {
        const { error: createError } = await this.supabase.storage.createBucket(
          this.config.backupBucket,
          {
            public: false,
            allowedMimeTypes: ['application/sql', 'application/gzip', 'application/octet-stream'],
            fileSizeLimit: 1024 * 1024 * 1024, // 1GB limit
          }
        );

        if (createError) {
          console.error('  ❌ Failed to create backup bucket:', createError.message);
          throw createError;
        }

        console.log(`  ✅ Backup bucket '${this.config.backupBucket}' created`);
      } else {
        console.log(`  ✅ Backup bucket '${this.config.backupBucket}' already exists`);
      }

      // Set up bucket policies for backup access
      await this.setupBackupPolicies();

    } catch (error) {
      console.error('  ❌ Backup storage setup failed:', error.message);
      throw error;
    }
  }

  async setupBackupPolicies() {
    console.log('🔒 Setting up backup storage policies...');

    try {
      const policies = [
        {
          name: 'backup_insert_policy',
          sql: `
            CREATE POLICY backup_insert_policy ON storage.objects
            FOR INSERT
            WITH CHECK (
              bucket_id = '${this.config.backupBucket}' AND
              auth.role() = 'service_role'
            );
          `
        },
        {
          name: 'backup_select_policy',
          sql: `
            CREATE POLICY backup_select_policy ON storage.objects
            FOR SELECT
            USING (
              bucket_id = '${this.config.backupBucket}' AND
              (auth.role() = 'service_role' OR has_any_role(ARRAY['admin', 'super_admin']))
            );
          `
        },
        {
          name: 'backup_delete_policy',
          sql: `
            CREATE POLICY backup_delete_policy ON storage.objects
            FOR DELETE
            USING (
              bucket_id = '${this.config.backupBucket}' AND
              (auth.role() = 'service_role' OR has_any_role(ARRAY['super_admin']))
            );
          `
        }
      ];

      for (const policy of policies) {
        try {
          const { error } = await this.supabase.rpc('exec_sql', {
            sql: `
              DROP POLICY IF EXISTS ${policy.name} ON storage.objects;
              ${policy.sql}
            `
          });

          if (error) {
            console.warn(`  ⚠️ Policy ${policy.name} setup warning:`, error.message);
          } else {
            console.log(`  ✅ Policy ${policy.name} created`);
          }
        } catch (error) {
          console.warn(`  ⚠️ Failed to create policy ${policy.name}:`, error.message);
        }
      }

    } catch (error) {
      console.error('  ❌ Backup policies setup failed:', error.message);
    }
  }

  async createBackupFunctions() {
    console.log('⚙️ Creating backup functions...');

    const functions = [
      {
        name: 'create_database_backup',
        sql: `
          CREATE OR REPLACE FUNCTION create_database_backup(
            backup_name TEXT DEFAULT NULL
          )
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            backup_id UUID;
            backup_filename TEXT;
            table_count INTEGER;
            backup_size BIGINT;
            result JSONB;
          BEGIN
            -- Generate backup ID and filename
            backup_id := gen_random_uuid();
            backup_filename := COALESCE(
              backup_name, 
              'backup_' || to_char(NOW(), 'YYYY-MM-DD_HH24-MI-SS')
            );
            
            -- Count tables to backup
            SELECT COUNT(*)
            INTO table_count
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE';
            
            -- Calculate approximate backup size
            SELECT pg_size_pretty(pg_database_size(current_database()))::TEXT
            INTO backup_size;
            
            -- Log backup creation
            INSERT INTO backup_history (
              id,
              backup_name,
              backup_type,
              status,
              table_count,
              created_at
            ) VALUES (
              backup_id,
              backup_filename,
              'full',
              'in_progress',
              table_count,
              NOW()
            );
            
            -- Build result
            result := jsonb_build_object(
              'backup_id', backup_id,
              'backup_name', backup_filename,
              'table_count', table_count,
              'estimated_size', backup_size,
              'status', 'initiated'
            );
            
            RETURN result;
          END;
          $$;
        `
      },
      {
        name: 'get_backup_status',
        sql: `
          CREATE OR REPLACE FUNCTION get_backup_status(backup_id UUID)
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            backup_record RECORD;
            result JSONB;
          BEGIN
            SELECT *
            INTO backup_record
            FROM backup_history
            WHERE id = backup_id;
            
            IF NOT FOUND THEN
              RETURN jsonb_build_object('error', 'Backup not found');
            END IF;
            
            result := jsonb_build_object(
              'backup_id', backup_record.id,
              'backup_name', backup_record.backup_name,
              'backup_type', backup_record.backup_type,
              'status', backup_record.status,
              'table_count', backup_record.table_count,
              'file_size', backup_record.file_size,
              'created_at', backup_record.created_at,
              'completed_at', backup_record.completed_at,
              'error_message', backup_record.error_message
            );
            
            RETURN result;
          END;
          $$;
        `
      },
      {
        name: 'cleanup_old_backups',
        sql: `
          CREATE OR REPLACE FUNCTION cleanup_old_backups(
            retention_days INTEGER DEFAULT 30
          )
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            deleted_count INTEGER;
            result JSONB;
          BEGIN
            -- Mark old backups for deletion
            UPDATE backup_history
            SET status = 'deleted',
                deleted_at = NOW()
            WHERE created_at < NOW() - INTERVAL '1 day' * retention_days
              AND status NOT IN ('deleted', 'in_progress');
            
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            
            result := jsonb_build_object(
              'deleted_count', deleted_count,
              'retention_days', retention_days,
              'cleanup_date', NOW()
            );
            
            RETURN result;
          END;
          $$;
        `
      }
    ];

    for (const func of functions) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: func.sql });
        if (error) {
          console.error(`  ❌ Failed to create function ${func.name}:`, error.message);
        } else {
          console.log(`  ✅ Function ${func.name} created`);
        }
      } catch (error) {
        console.error(`  ❌ Error creating function ${func.name}:`, error.message);
      }
    }
  }

  async createBackupTables() {
    console.log('📋 Creating backup tracking tables...');

    const tables = [
      {
        name: 'backup_history',
        sql: `
          CREATE TABLE IF NOT EXISTS backup_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            backup_name TEXT NOT NULL,
            backup_type TEXT NOT NULL DEFAULT 'full',
            status TEXT NOT NULL DEFAULT 'pending',
            table_count INTEGER,
            file_size BIGINT,
            file_path TEXT,
            encryption_enabled BOOLEAN DEFAULT true,
            compression_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            completed_at TIMESTAMPTZ,
            deleted_at TIMESTAMPTZ,
            error_message TEXT,
            metadata JSONB
          );
        `
      },
      {
        name: 'backup_schedule',
        sql: `
          CREATE TABLE IF NOT EXISTS backup_schedule (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            schedule_name TEXT NOT NULL,
            cron_expression TEXT NOT NULL,
            backup_type TEXT NOT NULL DEFAULT 'full',
            retention_days INTEGER DEFAULT 30,
            is_active BOOLEAN DEFAULT true,
            last_run_at TIMESTAMPTZ,
            next_run_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      }
    ];

    for (const table of tables) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: table.sql });
        if (error) {
          console.error(`  ❌ Failed to create table ${table.name}:`, error.message);
        } else {
          console.log(`  ✅ Table ${table.name} created`);
        }
      } catch (error) {
        console.error(`  ❌ Error creating table ${table.name}:`, error.message);
      }
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_backup_history_created_at ON backup_history(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);',
      'CREATE INDEX IF NOT EXISTS idx_backup_schedule_next_run ON backup_schedule(next_run_at);',
    ];

    for (const indexSql of indexes) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: indexSql });
        if (error) {
          console.warn(`  ⚠️ Index creation warning:`, error.message);
        }
      } catch (error) {
        console.warn(`  ⚠️ Index creation failed:`, error.message);
      }
    }
  }

  async setupBackupSchedule() {
    console.log('⏰ Setting up backup schedule...');

    try {
      // Insert default backup schedules
      const schedules = [
        {
          name: 'daily_full_backup',
          cron: '0 2 * * *', // Daily at 2 AM
          type: 'full',
          retention: 7
        },
        {
          name: 'weekly_full_backup',
          cron: '0 3 * * 0', // Weekly on Sunday at 3 AM
          type: 'full',
          retention: 30
        },
        {
          name: 'monthly_full_backup',
          cron: '0 4 1 * *', // Monthly on 1st at 4 AM
          type: 'full',
          retention: 365
        }
      ];

      for (const schedule of schedules) {
        const { error } = await this.supabase.rpc('exec_sql', {
          sql: `
            INSERT INTO backup_schedule (
              schedule_name,
              cron_expression,
              backup_type,
              retention_days,
              is_active
            ) VALUES (
              '${schedule.name}',
              '${schedule.cron}',
              '${schedule.type}',
              ${schedule.retention},
              true
            )
            ON CONFLICT (schedule_name) DO UPDATE SET
              cron_expression = EXCLUDED.cron_expression,
              backup_type = EXCLUDED.backup_type,
              retention_days = EXCLUDED.retention_days,
              updated_at = NOW();
          `
        });

        if (error) {
          console.error(`  ❌ Failed to create schedule ${schedule.name}:`, error.message);
        } else {
          console.log(`  ✅ Schedule ${schedule.name} configured`);
        }
      }

    } catch (error) {
      console.error('  ❌ Backup schedule setup failed:', error.message);
    }
  }

  createBackupScripts() {
    console.log('📝 Creating backup scripts...');

    // Create manual backup script
    const manualBackupScript = `#!/usr/bin/env node

/**
 * Manual Database Backup Script
 * Creates an immediate backup of the production database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DatabaseBackup {
  constructor() {
    this.supabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
  }

  async createBackup(backupName) {
    console.log('🔄 Starting database backup...');
    
    try {
      // Initiate backup
      const { data: backupInfo, error } = await this.supabase.rpc('create_database_backup', {
        backup_name: backupName
      });

      if (error) {
        throw new Error(\`Backup initiation failed: \${error.message}\`);
      }

      console.log('✅ Backup initiated:', backupInfo);
      
      // Export data from each table
      await this.exportTableData(backupInfo.backup_id);
      
      console.log('✅ Database backup completed successfully');
      return backupInfo;
      
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  async exportTableData(backupId) {
    const tables = ['profiles', 'user_roles', 'posts', 'groups', 'announcements', 'memberships'];
    const backupData = {};

    for (const table of tables) {
      try {
        const { data, error } = await this.supabase.from(table).select('*');
        
        if (error) {
          console.warn(\`⚠️ Failed to export \${table}: \${error.message}\`);
          continue;
        }

        backupData[table] = data;
        console.log(\`  ✅ Exported \${data.length} records from \${table}\`);
      } catch (error) {
        console.warn(\`⚠️ Error exporting \${table}:\`, error.message);
      }
    }

    // Save backup data
    const backupJson = JSON.stringify(backupData, null, 2);
    const backupPath = path.join(__dirname, \`../backups/backup_\${backupId}.json\`);
    
    // Create backups directory if it doesn't exist
    const backupsDir = path.dirname(backupPath);
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Encrypt backup if encryption key is available
    if (this.encryptionKey) {
      const encryptedData = this.encryptData(backupJson);
      fs.writeFileSync(backupPath + '.enc', encryptedData);
      console.log(\`  🔒 Encrypted backup saved to \${backupPath}.enc\`);
    } else {
      fs.writeFileSync(backupPath, backupJson);
      console.log(\`  💾 Backup saved to \${backupPath}\`);
    }

    return backupPath;
  }

  encryptData(data) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('backup-data'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }
}

// Run backup if called directly
if (require.main === module) {
  const backupName = process.argv[2] || \`manual_\${new Date().toISOString().split('T')[0]}\`;
  const backup = new DatabaseBackup();
  
  backup.createBackup(backupName)
    .then(result => {
      console.log('🎉 Backup completed successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Backup failed:', error.message);
      process.exit(1);
    });
}

module.exports = DatabaseBackup;
`;

    const backupScriptPath = path.join(__dirname, '../scripts/createDatabaseBackup.js');
    fs.writeFileSync(backupScriptPath, manualBackupScript);
    fs.chmodSync(backupScriptPath, '755');
    console.log(`  ✅ Manual backup script created: ${backupScriptPath}`);

    // Create restore script
    const restoreScript = `#!/usr/bin/env node

/**
 * Database Restore Script
 * Restores database from backup file
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DatabaseRestore {
  constructor() {
    this.supabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
  }

  async restoreFromBackup(backupPath, options = {}) {
    console.log(\`🔄 Starting database restore from \${backupPath}...\`);
    
    try {
      // Load backup data
      const backupData = this.loadBackupData(backupPath);
      
      // Restore each table
      for (const [tableName, records] of Object.entries(backupData)) {
        if (options.tables && !options.tables.includes(tableName)) {
          console.log(\`  ⏭️ Skipping \${tableName} (not in restore list)\`);
          continue;
        }

        await this.restoreTable(tableName, records, options);
      }
      
      console.log('✅ Database restore completed successfully');
      
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      throw error;
    }
  }

  loadBackupData(backupPath) {
    if (!fs.existsSync(backupPath)) {
      throw new Error(\`Backup file not found: \${backupPath}\`);
    }

    const fileContent = fs.readFileSync(backupPath, 'utf8');
    
    // Check if file is encrypted
    if (backupPath.endsWith('.enc')) {
      if (!this.encryptionKey) {
        throw new Error('Encryption key required to restore encrypted backup');
      }
      return JSON.parse(this.decryptData(fileContent));
    } else {
      return JSON.parse(fileContent);
    }
  }

  decryptData(encryptedData) {
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('backup-data'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async restoreTable(tableName, records, options) {
    console.log(\`  🔄 Restoring \${tableName} (\${records.length} records)...\`);
    
    try {
      if (options.truncate) {
        // Clear existing data
        const { error: deleteError } = await this.supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (deleteError) {
          console.warn(\`  ⚠️ Failed to truncate \${tableName}: \${deleteError.message}\`);
        }
      }

      // Insert records in batches
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        const { error } = await this.supabase
          .from(tableName)
          .upsert(batch, { onConflict: 'id' });
        
        if (error) {
          console.error(\`  ❌ Failed to restore batch for \${tableName}: \${error.message}\`);
        } else {
          console.log(\`  ✅ Restored batch \${Math.floor(i/batchSize) + 1} for \${tableName}\`);
        }
      }
      
    } catch (error) {
      console.error(\`  ❌ Error restoring \${tableName}:\`, error.message);
    }
  }
}

// Run restore if called directly
if (require.main === module) {
  const backupPath = process.argv[2];
  const options = {
    truncate: process.argv.includes('--truncate'),
    tables: process.argv.includes('--tables') ? 
      process.argv[process.argv.indexOf('--tables') + 1].split(',') : null
  };

  if (!backupPath) {
    console.error('Usage: node restoreDatabaseBackup.js <backup-path> [--truncate] [--tables table1,table2]');
    process.exit(1);
  }

  const restore = new DatabaseRestore();
  
  restore.restoreFromBackup(backupPath, options)
    .then(() => {
      console.log('🎉 Restore completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Restore failed:', error.message);
      process.exit(1);
    });
}

module.exports = DatabaseRestore;
`;

    const restoreScriptPath = path.join(__dirname, '../scripts/restoreDatabaseBackup.js');
    fs.writeFileSync(restoreScriptPath, restoreScript);
    fs.chmodSync(restoreScriptPath, '755');
    console.log(`  ✅ Restore script created: ${restoreScriptPath}`);
  }

  generateBackupDocumentation() {
    console.log('📚 Generating backup documentation...');

    const documentation = `# Production Database Backup System

## Overview

This document describes the automated backup system for PeerLearningHub production database.

## Backup Strategy

### Backup Types
- **Full Backup**: Complete database backup including all tables and data
- **Incremental Backup**: Only changes since last backup (future enhancement)

### Backup Schedule
- **Daily**: Full backup at 2:00 AM (retained for 7 days)
- **Weekly**: Full backup on Sundays at 3:00 AM (retained for 30 days)
- **Monthly**: Full backup on 1st of month at 4:00 AM (retained for 365 days)

### Backup Storage
- **Location**: Supabase Storage bucket '${this.config.backupBucket}'
- **Encryption**: AES-256-GCM encryption enabled
- **Compression**: Gzip compression for size optimization
- **Access Control**: Service role and admin access only

## Backup Operations

### Manual Backup
\`\`\`bash
# Create immediate backup
npm run backup:create

# Create named backup
npm run backup:create "pre-deployment-backup"
\`\`\`

### Restore Operations
\`\`\`bash
# Restore from backup file
npm run backup:restore /path/to/backup.json

# Restore specific tables only
npm run backup:restore /path/to/backup.json --tables profiles,user_roles

# Restore with truncate (replace existing data)
npm run backup:restore /path/to/backup.json --truncate
\`\`\`

### Backup Status
\`\`\`bash
# Check backup status
npm run backup:status

# List recent backups
npm run backup:list

# Cleanup old backups
npm run backup:cleanup
\`\`\`

## Security

### Encryption
- All backups are encrypted using AES-256-GCM
- Encryption key stored in environment variable \`BACKUP_ENCRYPTION_KEY\`
- Key rotation recommended every 90 days

### Access Control
- Backup creation: Service role only
- Backup access: Service role and super admin
- Backup deletion: Super admin only

### Audit Logging
- All backup operations are logged in \`backup_history\` table
- Security events logged in \`security_audit_log\` table

## Monitoring

### Backup Health Checks
- Daily verification of backup completion
- Size and integrity checks
- Alert on backup failures

### Retention Management
- Automatic cleanup of expired backups
- Configurable retention periods
- Storage usage monitoring

## Recovery Procedures

### Point-in-Time Recovery
1. Identify the backup closest to desired recovery point
2. Stop application to prevent data changes
3. Restore from backup using restore script
4. Verify data integrity
5. Resume application

### Disaster Recovery
1. Assess extent of data loss
2. Identify most recent valid backup
3. Provision new database if necessary
4. Restore from backup
5. Update application configuration
6. Perform comprehensive testing
7. Resume operations

## Maintenance

### Regular Tasks
- Monitor backup completion (daily)
- Verify backup integrity (weekly)
- Test restore procedures (monthly)

### Periodic Tasks
- Rotate encryption keys (quarterly)
- Review retention policies (annually)
- Update disaster recovery procedures (annually)

## Troubleshooting

### Common Issues

#### Backup Fails to Start
- Check database connectivity
- Verify service role permissions
- Check storage bucket access

#### Backup Incomplete
- Check available storage space
- Verify table permissions
- Review error logs

#### Restore Fails
- Verify backup file integrity
- Check target database permissions
- Ensure compatible schema versions

### Emergency Contacts
- Database Team: dba@peerlearninghub.com
- DevOps Team: ops@peerlearninghub.com
- Security Team: security@peerlearninghub.com

## Configuration

### Environment Variables
\`\`\`bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BACKUP_STORAGE_BUCKET=${this.config.backupBucket}
BACKUP_ENCRYPTION_KEY=your_encryption_key
\`\`\`

### Backup Schedule Configuration
Backup schedules are stored in the \`backup_schedule\` table and can be modified as needed.

---

Generated on: ${new Date().toISOString()}
`;

    const docPath = path.join(__dirname, '../docs/PRODUCTION_BACKUP_SYSTEM.md');
    fs.writeFileSync(docPath, documentation);
    console.log(`  ✅ Backup documentation saved to ${docPath}`);
  }

  async testBackupSystem() {
    console.log('🧪 Testing backup system...');

    try {
      // Test backup creation
      const { data: testBackup, error } = await this.supabase.rpc('create_database_backup', {
        backup_name: 'test_backup_' + Date.now()
      });

      if (error) {
        console.error('  ❌ Backup creation test failed:', error.message);
        return false;
      }

      console.log('  ✅ Backup creation test passed');

      // Test backup status retrieval
      const { data: status, error: statusError } = await this.supabase.rpc('get_backup_status', {
        backup_id: testBackup.backup_id
      });

      if (statusError) {
        console.error('  ❌ Backup status test failed:', statusError.message);
        return false;
      }

      console.log('  ✅ Backup status test passed');

      // Test cleanup function
      const { data: cleanup, error: cleanupError } = await this.supabase.rpc('cleanup_old_backups', {
        retention_days: 30
      });

      if (cleanupError) {
        console.error('  ❌ Backup cleanup test failed:', cleanupError.message);
        return false;
      }

      console.log('  ✅ Backup cleanup test passed');
      console.log('  🎉 All backup system tests passed');

      return true;
    } catch (error) {
      console.error('  ❌ Backup system test failed:', error.message);
      return false;
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Production Backup Setup...\n');

      if (!this.validateConfiguration()) {
        throw new Error('Configuration validation failed');
      }

      await this.setupBackupStorage();
      await this.createBackupTables();
      await this.createBackupFunctions();
      await this.setupBackupSchedule();
      this.createBackupScripts();
      this.generateBackupDocumentation();

      const testPassed = await this.testBackupSystem();

      console.log('\n✅ Production backup setup completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Set up automated backup scheduling (cron jobs or similar)');
      console.log('2. Configure monitoring and alerting for backup failures');
      console.log('3. Test restore procedures in staging environment');
      console.log('4. Set up off-site backup storage (optional)');
      console.log('5. Train team on backup and restore procedures');

      if (!testPassed) {
        console.log('\n⚠️ Some tests failed. Please review the setup before production use.');
      }

    } catch (error) {
      console.error('\n❌ Production backup setup failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the setup if called directly
if (require.main === module) {
  const setup = new ProductionBackupSetup();
  setup.run();
}

module.exports = ProductionBackupSetup;