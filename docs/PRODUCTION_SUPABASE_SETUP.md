# Production Supabase Setup Guide

This guide provides comprehensive instructions for setting up PeerLearningHub's production Supabase environment with enhanced security, monitoring, and backup configurations.

## Prerequisites

Before starting the production setup, ensure you have:

1. **Supabase Production Project**: A dedicated Supabase project for production
2. **Environment Variables**: All required production credentials
3. **Database Access**: Service role key with full database permissions
4. **Backup Strategy**: Plan for data backup and recovery
5. **Monitoring Setup**: External monitoring services configured

## Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# App Configuration
EXPO_PUBLIC_APP_NAME=PeerLearningHub
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=production

# Security Configuration
EXPO_PUBLIC_ENABLE_HTTPS_ONLY=true
EXPO_PUBLIC_ENABLE_SECURITY_HEADERS=true
SESSION_TIMEOUT=60

# Database Configuration
ENABLE_AUTO_BACKUP=true
BACKUP_INTERVAL=0 2 * * *
BACKUP_RETENTION_DAYS=30

# Monitoring Configuration
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_ERROR_REPORTING=true
EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

## Setup Process

### 1. Run the Production Setup Script

```bash
# Set environment variables
export PRODUCTION_SUPABASE_URL="https://your-project-id.supabase.co"
export PRODUCTION_SUPABASE_SERVICE_KEY="your_service_role_key"
export PRODUCTION_SUPABASE_ANON_KEY="your_anon_key"

# Run the setup script
cd PeerLearningHub
node scripts/setupProductionSupabase.js
```

### 2. Validate the Setup

```bash
# Run validation script
node scripts/validateProductionEnvironment.js
```

### 3. Create Initial Admin User

1. Register your admin user through the app
2. Connect to your production database
3. Run the admin promotion function:

```sql
SELECT promote_to_admin('your-admin-email@example.com');
```

## Database Schema

The production setup creates the following tables:

### Core Tables
- `profiles` - User profiles with enhanced security fields
- `user_roles` - Role-based access control with expiration
- `groups` - Community groups for organizing discussions
- `posts` - User-generated content with moderation features
- `post_likes` - Like tracking with rate limiting
- `comments` - Threaded comments system
- `announcements` - Admin announcements with targeting
- `memberships` - Premium membership management

### Integration Tables
- `external_systems` - External service configurations
- `user_external_connections` - User connections to external services

### Monitoring Tables
- `security_audit_log` - Security event tracking
- `performance_metrics` - Application performance data
- `system_health_checks` - Health monitoring results
- `backup_configurations` - Backup settings and schedules

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with comprehensive policies:

- **Profiles**: Users can view/edit own profile, admins can manage all
- **Posts**: Public posts visible to all, private posts to author/admins
- **Groups**: Public groups visible, private groups to members only
- **Roles**: Users see own roles, admins manage all roles
- **Audit Logs**: Admin-only access for security monitoring

### Security Functions
- `has_role(role_name)` - Check if user has specific role
- `has_any_role(role_array)` - Check if user has any of specified roles
- `log_security_event()` - Log security-related events
- `check_rate_limit()` - Enforce API rate limits

### Audit Logging
Automatic logging of:
- Profile updates
- Role changes
- Administrative actions
- Failed authentication attempts
- Suspicious activities

## Performance Optimization

### Indexes
Comprehensive indexing strategy for:
- User lookups by email and ID
- Post queries by author, group, and date
- Role checks and permissions
- Audit log searches
- Performance metric queries

### Query Optimization
- Efficient RLS policies to minimize query overhead
- Proper use of composite indexes
- Optimized joins for complex queries
- Pagination support for large datasets

## Monitoring and Health Checks

### Performance Metrics
Track key metrics:
- Response times
- Query performance
- User activity
- Error rates
- Resource usage

### Health Checks
Monitor system components:
- Database connectivity
- API responsiveness
- External service availability
- Backup status
- Security alerts

### Functions for Monitoring
```sql
-- Record performance metrics
SELECT record_performance_metric('api_response_time', 150, 'ms');

-- Record health check results
SELECT record_health_check('database', 'healthy', 50);

-- Get system health summary
SELECT * FROM get_system_health_summary();
```

## Backup and Recovery

### Automated Backups
- **Daily Full Backups**: Complete database backup at 2 AM UTC
- **Weekly Archives**: Long-term storage with 90-day retention
- **Point-in-Time Recovery**: Supabase built-in PITR capability

### Backup Verification
Regular validation of backup integrity:
```bash
# Test backup restoration (in staging environment)
node scripts/testBackupRestore.js
```

### Recovery Procedures
1. **Immediate Recovery**: Use Supabase dashboard for recent data
2. **Point-in-Time**: Restore to specific timestamp
3. **Full Restore**: Complete database restoration from backup

## Security Best Practices

### Access Control
- Use least privilege principle
- Regular access reviews
- Multi-factor authentication for admins
- API key rotation schedule

### Data Protection
- Encryption at rest and in transit
- PII data handling compliance
- Regular security audits
- Vulnerability scanning

### Monitoring
- Real-time security alerts
- Audit log analysis
- Anomaly detection
- Incident response procedures

## Maintenance Tasks

### Daily
- Monitor system health dashboard
- Review security audit logs
- Check backup completion
- Monitor performance metrics

### Weekly
- Review user activity reports
- Update security policies if needed
- Analyze performance trends
- Test disaster recovery procedures

### Monthly
- Security audit and review
- Performance optimization review
- Backup strategy evaluation
- Access control review

## Troubleshooting

### Common Issues

#### Connection Problems
```bash
# Test database connectivity
node scripts/testDatabaseConnection.js
```

#### Performance Issues
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- Monitor active connections
SELECT * FROM pg_stat_activity;
```

#### Security Alerts
```sql
-- Review recent security events
SELECT * FROM security_audit_log 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Emergency Procedures

#### Database Issues
1. Check Supabase status page
2. Review recent changes
3. Check resource usage
4. Contact Supabase support if needed

#### Security Incidents
1. Immediately review audit logs
2. Disable affected accounts if necessary
3. Change compromised credentials
4. Document incident for review

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema migrated
- [ ] RLS policies enabled
- [ ] Security functions created
- [ ] Indexes created for performance
- [ ] Monitoring functions deployed
- [ ] Backup configurations set
- [ ] Initial admin user created
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Documentation updated
- [ ] Team training completed

## Support and Resources

### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Security Best Practices](https://supabase.com/docs/guides/auth/security)

### Monitoring Tools
- Supabase Dashboard
- PostgreSQL logs
- Custom monitoring functions
- External monitoring services

### Emergency Contacts
- Supabase Support: support@supabase.com
- Database Administrator: [your-dba@company.com]
- Security Team: [security@company.com]

## Conclusion

This production setup provides a robust, secure, and scalable foundation for PeerLearningHub. Regular monitoring, maintenance, and security reviews are essential for maintaining optimal performance and security.

For questions or issues, refer to the troubleshooting section or contact the development team.