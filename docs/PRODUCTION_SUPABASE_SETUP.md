# Production Supabase Setup Guide

This guide covers the complete setup of Supabase for production deployment of PeerLearningHub.

## Prerequisites

1. **Supabase Account**: Create a production Supabase project
2. **Environment Variables**: Prepare production environment variables
3. **Database Access**: Ensure you have admin access to the production database
4. **Backup Strategy**: Plan for data backup and recovery

## Step 1: Create Production Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project for production
3. Choose a strong database password
4. Select the appropriate region (closest to your users)
5. Wait for the project to be fully provisioned

## Step 2: Configure Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
EXPO_PUBLIC_APP_NAME=PeerLearningHub
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=production

# Security Configuration
EXPO_PUBLIC_ENABLE_HTTPS_ONLY=true
EXPO_PUBLIC_ENABLE_SECURITY_HEADERS=true

# Monitoring Configuration
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_ERROR_REPORTING=true
```

## Step 3: Run Production Setup Script

Execute the production setup script:

```bash
# Set environment variables
export PRODUCTION_SUPABASE_URL="https://your-project-id.supabase.co"
export PRODUCTION_SUPABASE_SERVICE_KEY="your_service_role_key_here"
export PRODUCTION_SUPABASE_ANON_KEY="your_anon_key_here"

# Run setup script
cd PeerLearningHub
node scripts/setupProductionSupabase.js
```

The script will:
- Run all database migrations
- Enable Row Level Security (RLS)
- Create security policies
- Set up audit logging
- Create production environment file
- Validate the setup

## Step 4: Validate Production Setup

Run the validation script to ensure everything is configured correctly:

```bash
node scripts/validateProductionSetup.js
```

This will check:
- Database connectivity
- RLS policies
- Required functions
- Database indexes
- Security configuration
- Environment separation

## Step 5: Configure Database Backup

### Automatic Backups

Supabase provides automatic backups, but you should also set up additional backup strategies:

1. **Point-in-Time Recovery**: Enable in Supabase dashboard
2. **Custom Backup Script**: Use the provided backup script
3. **External Backup**: Consider third-party backup solutions

### Manual Backup

```bash
# Create a manual backup
node scripts/backupProductionData.js
```

## Step 6: Security Hardening

### Database Security

1. **Enable RLS**: Ensure all tables have RLS enabled
2. **Review Policies**: Audit all RLS policies
3. **Function Security**: Review all database functions
4. **Audit Logging**: Enable comprehensive audit logging

### Network Security

1. **HTTPS Only**: Enforce HTTPS for all connections
2. **IP Restrictions**: Consider IP whitelisting if needed
3. **Rate Limiting**: Implement rate limiting for API calls
4. **CORS Configuration**: Configure CORS properly

### Authentication Security

1. **Strong Passwords**: Enforce strong password policies
2. **Session Management**: Configure secure session handling
3. **Multi-Factor Authentication**: Consider enabling MFA
4. **Account Lockout**: Implement account lockout policies

## Step 7: Monitoring and Alerting

### Database Monitoring

1. **Performance Metrics**: Monitor query performance
2. **Connection Pooling**: Monitor connection usage
3. **Storage Usage**: Track database storage growth
4. **Error Rates**: Monitor error rates and types

### Application Monitoring

1. **Error Tracking**: Set up error tracking service
2. **Performance Monitoring**: Monitor app performance
3. **User Analytics**: Track user behavior
4. **Uptime Monitoring**: Monitor service availability

## Step 8: Testing Production Setup

### Functional Testing

1. **Authentication Flow**: Test login/logout/registration
2. **Data Operations**: Test CRUD operations
3. **Permissions**: Test role-based access control
4. **Real-time Features**: Test real-time subscriptions

### Performance Testing

1. **Load Testing**: Test under expected load
2. **Stress Testing**: Test beyond normal capacity
3. **Endurance Testing**: Test long-running operations
4. **Spike Testing**: Test sudden load increases

### Security Testing

1. **Penetration Testing**: Conduct security audit
2. **Vulnerability Scanning**: Scan for known vulnerabilities
3. **Access Control Testing**: Test permission boundaries
4. **Data Protection Testing**: Test data encryption

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check environment variables
   - Verify network connectivity
   - Check Supabase project status

2. **Permission Errors**
   - Review RLS policies
   - Check user roles
   - Verify function permissions

3. **Migration Errors**
   - Check migration order
   - Verify SQL syntax
   - Review database logs

4. **Performance Issues**
   - Check database indexes
   - Review query performance
   - Monitor connection pool

### Debug Commands

```bash
# Test database connection
node scripts/testDatabaseConnection.js

# Check RLS policies
node scripts/checkRLSPolicies.js

# Validate migrations
node scripts/validateMigrations.js

# Test authentication
node scripts/testAuthentication.js
```

## Maintenance

### Regular Tasks

1. **Backup Verification**: Regularly test backup restoration
2. **Security Updates**: Keep dependencies updated
3. **Performance Review**: Monitor and optimize performance
4. **Audit Review**: Review security audit logs

### Monthly Tasks

1. **Security Audit**: Conduct monthly security review
2. **Performance Analysis**: Analyze performance trends
3. **Capacity Planning**: Review resource usage
4. **Backup Testing**: Test backup and recovery procedures

### Quarterly Tasks

1. **Penetration Testing**: Conduct security assessment
2. **Disaster Recovery Testing**: Test full recovery procedures
3. **Performance Optimization**: Optimize based on usage patterns
4. **Documentation Updates**: Update documentation and procedures

## Support and Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [Security Guidelines](./SECURITY_GUIDELINES.md)

## Emergency Contacts

- **Database Issues**: [Your DBA contact]
- **Security Issues**: [Your security team contact]
- **Infrastructure Issues**: [Your DevOps team contact]
- **Application Issues**: [Your development team contact]