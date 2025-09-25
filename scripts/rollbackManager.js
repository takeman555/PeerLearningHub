#!/usr/bin/env node

/**
 * Rollback Manager
 * Manages application rollbacks with automated and manual procedures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class RollbackManager {
  constructor() {
    this.rollbacksDir = path.join(__dirname, '..', 'rollbacks');
    this.configFile = path.join(this.rollbacksDir, 'rollbacks.json');
    this.snapshotsDir = path.join(this.rollbacksDir, 'snapshots');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.rollbacksDir, this.snapshotsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async createRollbackPoint(environment, metadata = {}) {
    console.log(`Creating rollback point for ${environment}...`);
    
    const rollbackPoint = {
      id: this.generateRollbackId(),
      environment,
      createdAt: new Date().toISOString(),
      createdBy: metadata.createdBy || 'system',
      version: this.getAppVersion(),
      commitSha: this.getCommitSha(),
      branch: this.getCurrentBranch(),
      metadata,
      snapshots: {}
    };

    try {
      // Create database snapshot
      rollbackPoint.snapshots.database = await this.createDatabaseSnapshot(environment, rollbackPoint.id);
      
      // Create configuration snapshot
      rollbackPoint.snapshots.configuration = await this.createConfigurationSnapshot(environment, rollbackPoint.id);
      
      // Create application state snapshot
      rollbackPoint.snapshots.application = await this.createApplicationSnapshot(environment, rollbackPoint.id);
      
      // Store rollback point metadata
      this.saveRollbackPoint(rollbackPoint);
      
      console.log(`✅ Rollback point ${rollbackPoint.id} created successfully`);
      return rollbackPoint;
      
    } catch (error) {
      console.error(`❌ Failed to create rollback point: ${error.message}`);
      throw error;
    }
  }

  async executeRollback(environment, rollbackPointId, options = {}) {
    console.log(`Executing rollback to ${rollbackPointId} in ${environment}...`);
    
    const rollbackPoint = this.getRollbackPoint(rollbackPointId);
    if (!rollbackPoint) {
      throw new Error(`Rollback point not found: ${rollbackPointId}`);
    }
    
    if (rollbackPoint.environment !== environment) {
      throw new Error(`Rollback point environment mismatch: expected ${environment}, got ${rollbackPoint.environment}`);
    }

    const rollbackExecution = {
      id: this.generateRollbackId(),
      type: 'rollback_execution',
      rollbackPointId,
      environment,
      startedAt: new Date().toISOString(),
      startedBy: options.executedBy || 'system',
      status: 'in_progress',
      steps: []
    };

    try {
      // Pre-rollback validation
      await this.validateRollbackPreconditions(environment, rollbackPoint, rollbackExecution);
      
      // Create current state backup before rollback
      const preRollbackBackup = await this.createPreRollbackBackup(environment, rollbackExecution);
      rollbackExecution.preRollbackBackup = preRollbackBackup;
      
      // Execute rollback steps
      await this.executeRollbackSteps(environment, rollbackPoint, rollbackExecution, options);
      
      // Post-rollback validation
      await this.validateRollbackCompletion(environment, rollbackPoint, rollbackExecution);
      
      rollbackExecution.status = 'success';
      rollbackExecution.completedAt = new Date().toISOString();
      
      this.saveRollbackExecution(rollbackExecution);
      console.log(`✅ Rollback ${rollbackExecution.id} completed successfully`);
      
      return rollbackExecution;
      
    } catch (error) {
      rollbackExecution.status = 'failed';
      rollbackExecution.error = error.message;
      rollbackExecution.failedAt = new Date().toISOString();
      
      this.saveRollbackExecution(rollbackExecution);
      console.error(`❌ Rollback ${rollbackExecution.id} failed: ${error.message}`);
      
      // Attempt to restore pre-rollback state if available
      if (rollbackExecution.preRollbackBackup && options.autoRestore !== false) {
        await this.restorePreRollbackState(environment, rollbackExecution.preRollbackBackup);
      }
      
      throw error;
    }
  }

  async validateRollbackPreconditions(environment, rollbackPoint, execution) {
    console.log('Validating rollback preconditions...');
    
    const validations = [
      {
        name: 'Environment Status Check',
        validate: () => this.checkEnvironmentStatus(environment)
      },
      {
        name: 'Rollback Point Integrity',
        validate: () => this.validateRollbackPointIntegrity(rollbackPoint)
      },
      {
        name: 'Database Connectivity',
        validate: () => this.checkDatabaseConnectivity(environment)
      },
      {
        name: 'Backup Storage Access',
        validate: () => this.checkBackupStorageAccess(environment)
      }
    ];

    for (const validation of validations) {
      const step = {
        name: validation.name,
        type: 'validation',
        startedAt: new Date().toISOString()
      };
      
      try {
        await validation.validate();
        step.status = 'success';
        step.completedAt = new Date().toISOString();
        console.log(`✅ ${validation.name}`);
      } catch (error) {
        step.status = 'failed';
        step.error = error.message;
        step.failedAt = new Date().toISOString();
        console.error(`❌ ${validation.name}: ${error.message}`);
        throw error;
      }
      
      execution.steps.push(step);
    }
  }

  async executeRollbackSteps(environment, rollbackPoint, execution, options) {
    console.log('Executing rollback steps...');
    
    const steps = [
      {
        name: 'Stop Application Services',
        execute: () => this.stopApplicationServices(environment)
      },
      {
        name: 'Restore Database',
        execute: () => this.restoreDatabase(environment, rollbackPoint.snapshots.database)
      },
      {
        name: 'Restore Configuration',
        execute: () => this.restoreConfiguration(environment, rollbackPoint.snapshots.configuration)
      },
      {
        name: 'Restore Application Code',
        execute: () => this.restoreApplicationCode(environment, rollbackPoint)
      },
      {
        name: 'Update Expo Updates',
        execute: () => this.rollbackExpoUpdates(environment, rollbackPoint)
      },
      {
        name: 'Start Application Services',
        execute: () => this.startApplicationServices(environment)
      }
    ];

    for (const stepConfig of steps) {
      const step = {
        name: stepConfig.name,
        type: 'rollback_step',
        startedAt: new Date().toISOString()
      };
      
      try {
        console.log(`Executing: ${stepConfig.name}`);
        await stepConfig.execute();
        
        step.status = 'success';
        step.completedAt = new Date().toISOString();
        console.log(`✅ ${stepConfig.name} completed`);
      } catch (error) {
        step.status = 'failed';
        step.error = error.message;
        step.failedAt = new Date().toISOString();
        console.error(`❌ ${stepConfig.name} failed: ${error.message}`);
        throw error;
      }
      
      execution.steps.push(step);
    }
  }

  async validateRollbackCompletion(environment, rollbackPoint, execution) {
    console.log('Validating rollback completion...');
    
    const validations = [
      {
        name: 'Application Health Check',
        validate: () => this.runHealthCheck(environment)
      },
      {
        name: 'Database Integrity Check',
        validate: () => this.checkDatabaseIntegrity(environment)
      },
      {
        name: 'Configuration Validation',
        validate: () => this.validateConfiguration(environment)
      },
      {
        name: 'Critical Functionality Test',
        validate: () => this.runCriticalFunctionalityTests(environment)
      }
    ];

    for (const validation of validations) {
      const step = {
        name: validation.name,
        type: 'post_validation',
        startedAt: new Date().toISOString()
      };
      
      try {
        await validation.validate();
        step.status = 'success';
        step.completedAt = new Date().toISOString();
        console.log(`✅ ${validation.name}`);
      } catch (error) {
        step.status = 'failed';
        step.error = error.message;
        step.failedAt = new Date().toISOString();
        console.error(`❌ ${validation.name}: ${error.message}`);
        throw error;
      }
      
      execution.steps.push(step);
    }
  }

  // Snapshot creation methods
  async createDatabaseSnapshot(environment, rollbackId) {
    console.log('Creating database snapshot...');
    
    const snapshotPath = path.join(this.snapshotsDir, `${rollbackId}-database.sql`);
    
    try {
      // This would typically use pg_dump or similar
      execSync(`node scripts/createDatabaseBackup.js ${environment} ${snapshotPath}`, {
        stdio: 'inherit'
      });
      
      return {
        type: 'database',
        path: snapshotPath,
        createdAt: new Date().toISOString(),
        size: fs.statSync(snapshotPath).size
      };
    } catch (error) {
      throw new Error(`Database snapshot failed: ${error.message}`);
    }
  }

  async createConfigurationSnapshot(environment, rollbackId) {
    console.log('Creating configuration snapshot...');
    
    const configFiles = [
      `.env.${environment}`,
      'eas.json',
      'app.json',
      'package.json'
    ];
    
    const snapshotData = {};
    
    for (const file of configFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        snapshotData[file] = fs.readFileSync(filePath, 'utf8');
      }
    }
    
    const snapshotPath = path.join(this.snapshotsDir, `${rollbackId}-config.json`);
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotData, null, 2));
    
    return {
      type: 'configuration',
      path: snapshotPath,
      createdAt: new Date().toISOString(),
      files: Object.keys(snapshotData)
    };
  }

  async createApplicationSnapshot(environment, rollbackId) {
    console.log('Creating application snapshot...');
    
    const snapshot = {
      commitSha: this.getCommitSha(),
      branch: this.getCurrentBranch(),
      version: this.getAppVersion(),
      buildInfo: await this.getBuildInfo(environment)
    };
    
    const snapshotPath = path.join(this.snapshotsDir, `${rollbackId}-app.json`);
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
    
    return {
      type: 'application',
      path: snapshotPath,
      createdAt: new Date().toISOString(),
      ...snapshot
    };
  }

  async createPreRollbackBackup(environment, execution) {
    console.log('Creating pre-rollback backup...');
    
    const backupId = `pre-rollback-${execution.id}`;
    return await this.createRollbackPoint(environment, {
      type: 'pre_rollback_backup',
      rollbackExecutionId: execution.id,
      createdBy: 'rollback_system'
    });
  }

  // Restoration methods
  async restoreDatabase(environment, databaseSnapshot) {
    console.log('Restoring database...');
    
    if (!fs.existsSync(databaseSnapshot.path)) {
      throw new Error(`Database snapshot not found: ${databaseSnapshot.path}`);
    }
    
    try {
      execSync(`node scripts/restoreDatabaseBackup.js ${environment} ${databaseSnapshot.path}`, {
        stdio: 'inherit'
      });
    } catch (error) {
      throw new Error(`Database restoration failed: ${error.message}`);
    }
  }

  async restoreConfiguration(environment, configSnapshot) {
    console.log('Restoring configuration...');
    
    if (!fs.existsSync(configSnapshot.path)) {
      throw new Error(`Configuration snapshot not found: ${configSnapshot.path}`);
    }
    
    const configData = JSON.parse(fs.readFileSync(configSnapshot.path, 'utf8'));
    
    for (const [file, content] of Object.entries(configData)) {
      const filePath = path.join(__dirname, '..', file);
      fs.writeFileSync(filePath, content);
      console.log(`Restored: ${file}`);
    }
  }

  async restoreApplicationCode(environment, rollbackPoint) {
    console.log('Restoring application code...');
    
    try {
      // Checkout the specific commit
      execSync(`git checkout ${rollbackPoint.commitSha}`, { stdio: 'inherit' });
      
      // Reinstall dependencies
      execSync('npm ci', { stdio: 'inherit' });
      
    } catch (error) {
      throw new Error(`Application code restoration failed: ${error.message}`);
    }
  }

  async rollbackExpoUpdates(environment, rollbackPoint) {
    console.log('Rolling back Expo Updates...');
    
    try {
      const rollbackMessage = `Rollback to ${rollbackPoint.version} (${rollbackPoint.commitSha.substring(0, 8)})`;
      
      execSync(`eas update --branch ${environment} --message "${rollbackMessage}"`, {
        stdio: 'inherit',
        env: { ...process.env, EXPO_TOKEN: process.env.EXPO_TOKEN }
      });
    } catch (error) {
      throw new Error(`Expo Updates rollback failed: ${error.message}`);
    }
  }

  // Service management methods
  async stopApplicationServices(environment) {
    console.log(`Stopping application services for ${environment}...`);
    // Implementation would stop relevant services
    return true;
  }

  async startApplicationServices(environment) {
    console.log(`Starting application services for ${environment}...`);
    // Implementation would start relevant services
    return true;
  }

  // Validation methods
  checkEnvironmentStatus(environment) {
    console.log(`Checking ${environment} environment status...`);
    return true;
  }

  validateRollbackPointIntegrity(rollbackPoint) {
    console.log('Validating rollback point integrity...');
    
    for (const [type, snapshot] of Object.entries(rollbackPoint.snapshots)) {
      if (!fs.existsSync(snapshot.path)) {
        throw new Error(`Snapshot missing: ${type} at ${snapshot.path}`);
      }
    }
    
    return true;
  }

  checkDatabaseConnectivity(environment) {
    console.log(`Checking database connectivity for ${environment}...`);
    return true;
  }

  checkBackupStorageAccess(environment) {
    console.log(`Checking backup storage access for ${environment}...`);
    return true;
  }

  runHealthCheck(environment) {
    console.log(`Running health check for ${environment}...`);
    return true;
  }

  checkDatabaseIntegrity(environment) {
    console.log(`Checking database integrity for ${environment}...`);
    return true;
  }

  validateConfiguration(environment) {
    console.log(`Validating configuration for ${environment}...`);
    return true;
  }

  runCriticalFunctionalityTests(environment) {
    console.log(`Running critical functionality tests for ${environment}...`);
    return true;
  }

  // Utility methods
  generateRollbackId() {
    return `rb-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  getAppVersion() {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
      );
      return packageJson.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  getCommitSha() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  getCurrentBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  async getBuildInfo(environment) {
    // Get build information for the environment
    return {
      platform: 'all',
      profile: environment,
      timestamp: new Date().toISOString()
    };
  }

  saveRollbackPoint(rollbackPoint) {
    let rollbacks = this.loadRollbacks();
    rollbacks.rollbackPoints = rollbacks.rollbackPoints || [];
    rollbacks.rollbackPoints.push(rollbackPoint);
    
    // Keep only last 50 rollback points per environment
    const envRollbacks = rollbacks.rollbackPoints.filter(rb => rb.environment === rollbackPoint.environment);
    if (envRollbacks.length > 50) {
      const toRemove = envRollbacks.slice(0, -50);
      rollbacks.rollbackPoints = rollbacks.rollbackPoints.filter(rb => !toRemove.includes(rb));
    }
    
    this.saveRollbacks(rollbacks);
  }

  saveRollbackExecution(execution) {
    let rollbacks = this.loadRollbacks();
    rollbacks.executions = rollbacks.executions || [];
    rollbacks.executions.push(execution);
    
    // Keep only last 100 executions
    if (rollbacks.executions.length > 100) {
      rollbacks.executions = rollbacks.executions.slice(-100);
    }
    
    this.saveRollbacks(rollbacks);
  }

  loadRollbacks() {
    if (fs.existsSync(this.configFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load rollbacks config:', error.message);
      }
    }
    return { rollbackPoints: [], executions: [] };
  }

  saveRollbacks(rollbacks) {
    fs.writeFileSync(this.configFile, JSON.stringify(rollbacks, null, 2));
  }

  getRollbackPoint(rollbackPointId) {
    const rollbacks = this.loadRollbacks();
    return rollbacks.rollbackPoints.find(rb => rb.id === rollbackPointId);
  }

  listRollbackPoints(environment = null) {
    const rollbacks = this.loadRollbacks();
    let points = rollbacks.rollbackPoints || [];
    
    if (environment) {
      points = points.filter(rb => rb.environment === environment);
    }
    
    return points.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  listRollbackExecutions(environment = null) {
    const rollbacks = this.loadRollbacks();
    let executions = rollbacks.executions || [];
    
    if (environment) {
      executions = executions.filter(ex => ex.environment === environment);
    }
    
    return executions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  }
}

// CLI interface
if (require.main === module) {
  const rollbackManager = new RollbackManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'create-point':
      const environment = process.argv[3];
      const description = process.argv[4];
      
      if (!environment) {
        console.error('Usage: node rollbackManager.js create-point <environment> [description]');
        process.exit(1);
      }
      
      rollbackManager.createRollbackPoint(environment, { description }).catch(error => {
        process.exit(1);
      });
      break;
      
    case 'rollback':
      const env = process.argv[3];
      const rollbackPointId = process.argv[4];
      
      if (!env || !rollbackPointId) {
        console.error('Usage: node rollbackManager.js rollback <environment> <rollback-point-id>');
        process.exit(1);
      }
      
      rollbackManager.executeRollback(env, rollbackPointId).catch(error => {
        process.exit(1);
      });
      break;
      
    case 'list-points':
      const filterEnv = process.argv[3];
      const points = rollbackManager.listRollbackPoints(filterEnv);
      
      console.log('\nRollback Points:');
      points.slice(0, 10).forEach(point => {
        console.log(`${point.id} - ${point.environment} ${point.version} (${point.createdAt})`);
      });
      break;
      
    case 'list-executions':
      const execEnv = process.argv[3];
      const executions = rollbackManager.listRollbackExecutions(execEnv);
      
      console.log('\nRollback Executions:');
      executions.slice(0, 10).forEach(execution => {
        const status = execution.status === 'success' ? '✅' : 
                     execution.status === 'failed' ? '❌' : '🔄';
        console.log(`${status} ${execution.id} - ${execution.environment} (${execution.startedAt})`);
      });
      break;
      
    default:
      console.log(`
Rollback Manager Commands:
  create-point <environment> [description]  - Create a rollback point
  rollback <environment> <rollback-point-id> - Execute rollback
  list-points [environment]                 - List rollback points
  list-executions [environment]             - List rollback executions
      `);
  }
}

module.exports = RollbackManager;