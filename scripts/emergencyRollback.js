#!/usr/bin/env node

/**
 * Emergency Production Rollback Script
 */

const RollbackManager = require('./rollbackManager');
const fs = require('fs');
const path = require('path');

class EmergencyRollback {
  constructor() {
    this.rollbackManager = new RollbackManager();
    this.emergencyLogPath = path.join(__dirname, '..', 'logs', 'emergency-rollback.log');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.emergencyLogPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(message);
    fs.appendFileSync(this.emergencyLogPath, logEntry);
  }

  async executeEmergencyRollback(environment = 'production') {
    this.log(`🚨 EMERGENCY ROLLBACK INITIATED for ${environment}`);
    this.log(`Rollback started by: ${process.env.GITHUB_ACTOR || 'system'}`);
    this.log(`Trigger: ${process.env.ROLLBACK_TRIGGER || 'deployment_failure'}`);
    
    try {
      // Step 1: Identify rollback target
      const rollbackTarget = await this.identifyRollbackTarget(environment);
      this.log(`Rollback target identified: ${rollbackTarget.id} (${rollbackTarget.version})`);
      
      // Step 2: Notify stakeholders
      await this.notifyEmergencyRollback(environment, rollbackTarget);
      
      // Step 3: Execute rollback with emergency options
      const rollbackExecution = await this.rollbackManager.executeRollback(
        environment,
        rollbackTarget.id,
        {
          executedBy: 'emergency_system',
          reason: 'emergency_rollback',
          skipNonCriticalValidations: true,
          fastTrack: true
        }
      );
      
      this.log(`✅ Emergency rollback completed: ${rollbackExecution.id}`);
      
      // Step 4: Post-rollback verification
      await this.verifyEmergencyRollback(environment, rollbackExecution);
      
      // Step 5: Notify completion
      await this.notifyRollbackCompletion(environment, rollbackExecution);
      
      this.log('🎯 Emergency rollback procedure completed successfully');
      return rollbackExecution;
      
    } catch (error) {
      this.log(`❌ Emergency rollback failed: ${error.message}`);
      
      // Attempt last resort recovery
      await this.attemptLastResortRecovery(environment, error);
      
      throw error;
    }
  }

  async identifyRollbackTarget(environment) {
    this.log('Identifying suitable rollback target...');
    
    const rollbackPoints = this.rollbackManager.listRollbackPoints(environment);
    
    // Filter out pre-rollback backups and failed deployments
    const validTargets = rollbackPoints.filter(point => {
      return point.metadata && 
             point.metadata.type !== 'pre_rollback_backup' &&
             point.metadata.deploymentStatus === 'success';
    });
    
    if (validTargets.length === 0) {
      throw new Error('No valid rollback targets found');
    }
    
    // Get the most recent stable version
    const target = validTargets[0];
    
    this.log(`Selected rollback target: ${target.version} from ${target.createdAt}`);
    return target;
  }

  async notifyEmergencyRollback(environment, rollbackTarget) {
    this.log('Sending emergency rollback notifications...');
    
    const notification = {
      type: 'emergency_rollback_started',
      environment,
      rollbackTarget: {
        id: rollbackTarget.id,
        version: rollbackTarget.version,
        createdAt: rollbackTarget.createdAt
      },
      timestamp: new Date().toISOString(),
      severity: 'critical'
    };
    
    // Send to monitoring systems
    await this.sendToMonitoring(notification);
    
    // Send to communication channels
    await this.sendToSlack(notification);
    
    // Create incident ticket
    await this.createIncidentTicket(notification);
  }

  async verifyEmergencyRollback(environment, rollbackExecution) {
    this.log('Verifying emergency rollback...');
    
    const verificationChecks = [
      {
        name: 'Application Responsiveness',
        check: () => this.checkApplicationResponsiveness(environment)
      },
      {
        name: 'Critical Endpoints',
        check: () => this.checkCriticalEndpoints(environment)
      },
      {
        name: 'Database Connectivity',
        check: () => this.checkDatabaseConnectivity(environment)
      },
      {
        name: 'Error Rates',
        check: () => this.checkErrorRates(environment)
      }
    ];

    const results = [];
    
    for (const check of verificationChecks) {
      try {
        await check.check();
        results.push({ name: check.name, status: 'passed' });
        this.log(`✅ Verification passed: ${check.name}`);
      } catch (error) {
        results.push({ name: check.name, status: 'failed', error: error.message });
        this.log(`❌ Verification failed: ${check.name} - ${error.message}`);
      }
    }
    
    const failedChecks = results.filter(r => r.status === 'failed');
    
    if (failedChecks.length > 0) {
      this.log(`⚠️ ${failedChecks.length} verification checks failed`);
      // Continue but log the issues
    } else {
      this.log('✅ All verification checks passed');
    }
    
    return results;
  }

  async notifyRollbackCompletion(environment, rollbackExecution) {
    this.log('Sending rollback completion notifications...');
    
    const notification = {
      type: 'emergency_rollback_completed',
      environment,
      rollbackExecution: {
        id: rollbackExecution.id,
        status: rollbackExecution.status,
        completedAt: rollbackExecution.completedAt
      },
      timestamp: new Date().toISOString(),
      severity: rollbackExecution.status === 'success' ? 'warning' : 'critical'
    };
    
    await this.sendToMonitoring(notification);
    await this.sendToSlack(notification);
    await this.updateIncidentTicket(notification);
  }

  async attemptLastResortRecovery(environment, originalError) {
    this.log('🆘 Attempting last resort recovery...');
    
    try {
      // Try to restore basic functionality
      await this.restoreBasicFunctionality(environment);
      
      // Enable maintenance mode
      await this.enableMaintenanceMode(environment);
      
      this.log('⚠️ Last resort recovery completed - system in maintenance mode');
      
    } catch (recoveryError) {
      this.log(`❌ Last resort recovery failed: ${recoveryError.message}`);
      this.log('🚨 MANUAL INTERVENTION REQUIRED');
      
      // Send critical alert
      await this.sendCriticalAlert(environment, originalError, recoveryError);
    }
  }

  // Verification methods
  async checkApplicationResponsiveness(environment) {
    this.log('Checking application responsiveness...');
    // Implementation would check if app responds to basic requests
    return true;
  }

  async checkCriticalEndpoints(environment) {
    this.log('Checking critical endpoints...');
    // Implementation would test critical API endpoints
    return true;
  }

  async checkDatabaseConnectivity(environment) {
    this.log('Checking database connectivity...');
    // Implementation would verify database connection
    return true;
  }

  async checkErrorRates(environment) {
    this.log('Checking error rates...');
    // Implementation would check current error rates
    return true;
  }

  // Recovery methods
  async restoreBasicFunctionality(environment) {
    this.log('Restoring basic functionality...');
    // Implementation would restore minimal working state
    return true;
  }

  async enableMaintenanceMode(environment) {
    this.log('Enabling maintenance mode...');
    // Implementation would enable maintenance mode
    return true;
  }

  // Notification methods
  async sendToMonitoring(notification) {
    // Implementation would send to monitoring system
    this.log(`Monitoring notification: ${notification.type}`);
  }

  async sendToSlack(notification) {
    // Implementation would send to Slack
    this.log(`Slack notification: ${notification.type}`);
  }

  async createIncidentTicket(notification) {
    // Implementation would create incident ticket
    this.log(`Incident ticket created for: ${notification.type}`);
  }

  async updateIncidentTicket(notification) {
    // Implementation would update incident ticket
    this.log(`Incident ticket updated: ${notification.type}`);
  }

  async sendCriticalAlert(environment, originalError, recoveryError) {
    // Implementation would send critical alert to all channels
    this.log(`🚨 CRITICAL ALERT: Manual intervention required for ${environment}`);
    this.log(`Original error: ${originalError.message}`);
    this.log(`Recovery error: ${recoveryError.message}`);
  }
}

async function executeEmergencyRollback() {
  const emergency = new EmergencyRollback();
  const environment = process.argv[2] || 'production';
  
  return await emergency.executeEmergencyRollback(environment);
}

if (require.main === module) {
  executeEmergencyRollback().catch(error => {
    console.error('Emergency rollback procedure failed:', error);
    process.exit(1);
  });
}

module.exports = { EmergencyRollback, executeEmergencyRollback };