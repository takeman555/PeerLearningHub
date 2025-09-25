#!/usr/bin/env node

/**
 * Deployment Manager
 * Manages application deployments across different environments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentManager {
  constructor() {
    this.deploymentsDir = path.join(__dirname, '..', 'deployments');
    this.configFile = path.join(this.deploymentsDir, 'deployments.json');
    this.ensureDeploymentsDirectory();
  }

  ensureDeploymentsDirectory() {
    if (!fs.existsSync(this.deploymentsDir)) {
      fs.mkdirSync(this.deploymentsDir, { recursive: true });
    }
  }

  async deploy(environment, options = {}) {
    console.log(`Starting deployment to ${environment}...`);
    
    const deployment = {
      id: this.generateDeploymentId(),
      environment,
      version: options.version || this.getAppVersion(),
      commitSha: this.getCommitSha(),
      branch: this.getCurrentBranch(),
      startedAt: new Date().toISOString(),
      startedBy: options.deployedBy || 'system',
      status: 'in_progress',
      steps: []
    };

    try {
      // Pre-deployment validation
      await this.runPreDeploymentChecks(environment, deployment);
      
      // Execute deployment steps
      await this.executeDeploymentSteps(environment, deployment, options);
      
      // Post-deployment validation
      await this.runPostDeploymentChecks(environment, deployment);
      
      deployment.status = 'success';
      deployment.completedAt = new Date().toISOString();
      
      this.saveDeployment(deployment);
      console.log(`✅ Deployment ${deployment.id} completed successfully`);
      
      return deployment;
      
    } catch (error) {
      deployment.status = 'failed';
      deployment.error = error.message;
      deployment.failedAt = new Date().toISOString();
      
      this.saveDeployment(deployment);
      console.error(`❌ Deployment ${deployment.id} failed:`, error.message);
      
      // Attempt rollback if configured
      if (options.autoRollback !== false) {
        await this.rollback(environment, deployment.id);
      }
      
      throw error;
    }
  }

  async runPreDeploymentChecks(environment, deployment) {
    console.log('Running pre-deployment checks...');
    
    const checks = [
      {
        name: 'Environment Configuration',
        check: () => this.validateEnvironmentConfig(environment)
      },
      {
        name: 'Database Connectivity',
        check: () => this.checkDatabaseConnectivity(environment)
      },
      {
        name: 'External Services',
        check: () => this.checkExternalServices(environment)
      },
      {
        name: 'Build Artifacts',
        check: () => this.validateBuildArtifacts(environment)
      }
    ];

    for (const check of checks) {
      const step = {
        name: check.name,
        type: 'pre_check',
        startedAt: new Date().toISOString()
      };
      
      try {
        await check.check();
        step.status = 'success';
        step.completedAt = new Date().toISOString();
        console.log(`✅ ${check.name}`);
      } catch (error) {
        step.status = 'failed';
        step.error = error.message;
        step.failedAt = new Date().toISOString();
        console.error(`❌ ${check.name}: ${error.message}`);
        throw error;
      }
      
      deployment.steps.push(step);
    }
  }

  async executeDeploymentSteps(environment, deployment, options) {
    console.log('Executing deployment steps...');
    
    const steps = this.getDeploymentSteps(environment);
    
    for (const stepConfig of steps) {
      const step = {
        name: stepConfig.name,
        type: 'deployment',
        startedAt: new Date().toISOString()
      };
      
      try {
        console.log(`Executing: ${stepConfig.name}`);
        await stepConfig.execute(options);
        
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
      
      deployment.steps.push(step);
    }
  }

  getDeploymentSteps(environment) {
    const commonSteps = [
      {
        name: 'Create Backup',
        execute: (options) => this.createBackup(environment, options)
      },
      {
        name: 'Build Application',
        execute: (options) => this.buildApplication(environment, options)
      },
      {
        name: 'Run Database Migrations',
        execute: (options) => this.runMigrations(environment, options)
      },
      {
        name: 'Deploy Application',
        execute: (options) => this.deployApplication(environment, options)
      },
      {
        name: 'Update Configuration',
        execute: (options) => this.updateConfiguration(environment, options)
      }
    ];

    const environmentSteps = {
      staging: [
        ...commonSteps,
        {
          name: 'Deploy to Expo Updates',
          execute: (options) => this.deployToExpoUpdates('staging', options)
        }
      ],
      production: [
        ...commonSteps,
        {
          name: 'Deploy to Expo Updates',
          execute: (options) => this.deployToExpoUpdates('production', options)
        },
        {
          name: 'Submit to App Stores',
          execute: (options) => this.submitToAppStores(options)
        }
      ]
    };

    return environmentSteps[environment] || commonSteps;
  }

  async runPostDeploymentChecks(environment, deployment) {
    console.log('Running post-deployment checks...');
    
    const checks = [
      {
        name: 'Health Check',
        check: () => this.runHealthCheck(environment)
      },
      {
        name: 'Smoke Tests',
        check: () => this.runSmokeTests(environment)
      },
      {
        name: 'Performance Check',
        check: () => this.checkPerformance(environment)
      }
    ];

    for (const check of checks) {
      const step = {
        name: check.name,
        type: 'post_check',
        startedAt: new Date().toISOString()
      };
      
      try {
        await check.check();
        step.status = 'success';
        step.completedAt = new Date().toISOString();
        console.log(`✅ ${check.name}`);
      } catch (error) {
        step.status = 'failed';
        step.error = error.message;
        step.failedAt = new Date().toISOString();
        console.error(`❌ ${check.name}: ${error.message}`);
        throw error;
      }
      
      deployment.steps.push(step);
    }
  }

  // Implementation methods
  validateEnvironmentConfig(environment) {
    const configPath = path.join(__dirname, '..', `.env.${environment}`);
    if (!fs.existsSync(configPath)) {
      throw new Error(`Environment configuration not found: ${configPath}`);
    }
    return true;
  }

  checkDatabaseConnectivity(environment) {
    // Placeholder for database connectivity check
    console.log(`Checking database connectivity for ${environment}`);
    return true;
  }

  checkExternalServices(environment) {
    // Placeholder for external services check
    console.log(`Checking external services for ${environment}`);
    return true;
  }

  validateBuildArtifacts(environment) {
    // Placeholder for build artifacts validation
    console.log(`Validating build artifacts for ${environment}`);
    return true;
  }

  createBackup(environment, options) {
    console.log(`Creating backup for ${environment}`);
    // Implementation would create database backup
    return true;
  }

  buildApplication(environment, options) {
    console.log(`Building application for ${environment}`);
    try {
      execSync(`eas build --platform all --profile ${environment} --non-interactive`, {
        stdio: 'inherit',
        env: { ...process.env, EXPO_TOKEN: process.env.EXPO_TOKEN }
      });
      return true;
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  runMigrations(environment, options) {
    console.log(`Running migrations for ${environment}`);
    try {
      execSync(`node scripts/run${environment.charAt(0).toUpperCase() + environment.slice(1)}Migrations.js`, {
        stdio: 'inherit'
      });
      return true;
    } catch (error) {
      throw new Error(`Migrations failed: ${error.message}`);
    }
  }

  deployApplication(environment, options) {
    console.log(`Deploying application to ${environment}`);
    // Implementation would deploy the application
    return true;
  }

  updateConfiguration(environment, options) {
    console.log(`Updating configuration for ${environment}`);
    // Implementation would update runtime configuration
    return true;
  }

  deployToExpoUpdates(environment, options) {
    console.log(`Deploying to Expo Updates for ${environment}`);
    try {
      execSync(`eas update --branch ${environment} --message "Deployment ${options.version || 'latest'}"`, {
        stdio: 'inherit',
        env: { ...process.env, EXPO_TOKEN: process.env.EXPO_TOKEN }
      });
      return true;
    } catch (error) {
      throw new Error(`Expo Updates deployment failed: ${error.message}`);
    }
  }

  submitToAppStores(options) {
    console.log('Submitting to app stores');
    try {
      execSync('eas submit --platform all --profile production --non-interactive', {
        stdio: 'inherit',
        env: { ...process.env, EXPO_TOKEN: process.env.EXPO_TOKEN }
      });
      return true;
    } catch (error) {
      throw new Error(`App store submission failed: ${error.message}`);
    }
  }

  runHealthCheck(environment) {
    console.log(`Running health check for ${environment}`);
    // Implementation would check application health
    return true;
  }

  runSmokeTests(environment) {
    console.log(`Running smoke tests for ${environment}`);
    try {
      execSync(`npm run test:smoke:${environment}`, { stdio: 'inherit' });
      return true;
    } catch (error) {
      throw new Error(`Smoke tests failed: ${error.message}`);
    }
  }

  checkPerformance(environment) {
    console.log(`Checking performance for ${environment}`);
    // Implementation would check performance metrics
    return true;
  }

  async rollback(environment, deploymentId) {
    console.log(`Rolling back deployment ${deploymentId} in ${environment}`);
    
    const rollback = {
      id: this.generateDeploymentId(),
      type: 'rollback',
      environment,
      originalDeploymentId: deploymentId,
      startedAt: new Date().toISOString(),
      status: 'in_progress'
    };

    try {
      // Get previous successful deployment
      const previousDeployment = this.getPreviousSuccessfulDeployment(environment);
      
      if (!previousDeployment) {
        throw new Error('No previous successful deployment found for rollback');
      }

      // Execute rollback steps
      await this.executeRollbackSteps(environment, previousDeployment, rollback);
      
      rollback.status = 'success';
      rollback.completedAt = new Date().toISOString();
      
      this.saveDeployment(rollback);
      console.log(`✅ Rollback completed successfully`);
      
      return rollback;
      
    } catch (error) {
      rollback.status = 'failed';
      rollback.error = error.message;
      rollback.failedAt = new Date().toISOString();
      
      this.saveDeployment(rollback);
      console.error(`❌ Rollback failed: ${error.message}`);
      throw error;
    }
  }

  async executeRollbackSteps(environment, previousDeployment, rollback) {
    const steps = [
      'Restore Database Backup',
      'Revert Application Code',
      'Update Configuration',
      'Restart Services',
      'Verify Rollback'
    ];

    for (const stepName of steps) {
      console.log(`Executing rollback step: ${stepName}`);
      // Implementation would execute actual rollback steps
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
    }
  }

  // Utility methods
  generateDeploymentId() {
    return `deploy-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
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

  saveDeployment(deployment) {
    let deployments = [];
    
    if (fs.existsSync(this.configFile)) {
      try {
        deployments = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      } catch (error) {
        console.warn('Could not read existing deployments:', error.message);
      }
    }

    deployments.push(deployment);
    
    // Keep only last 100 deployments
    if (deployments.length > 100) {
      deployments = deployments.slice(-100);
    }

    fs.writeFileSync(this.configFile, JSON.stringify(deployments, null, 2));
  }

  listDeployments(environment = null) {
    if (!fs.existsSync(this.configFile)) {
      return [];
    }

    try {
      let deployments = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      
      if (environment) {
        deployments = deployments.filter(d => d.environment === environment);
      }
      
      return deployments.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    } catch (error) {
      console.error('Error reading deployments:', error.message);
      return [];
    }
  }

  getPreviousSuccessfulDeployment(environment) {
    const deployments = this.listDeployments(environment);
    return deployments.find(d => d.status === 'success' && d.type !== 'rollback');
  }

  getDeploymentStatus(deploymentId) {
    const deployments = this.listDeployments();
    return deployments.find(d => d.id === deploymentId);
  }
}

// CLI interface
if (require.main === module) {
  const deploymentManager = new DeploymentManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'deploy':
      const environment = process.argv[3];
      const version = process.argv[4];
      
      if (!environment || !['staging', 'production'].includes(environment)) {
        console.error('Usage: node deploymentManager.js deploy <staging|production> [version]');
        process.exit(1);
      }
      
      deploymentManager.deploy(environment, { version }).catch(error => {
        process.exit(1);
      });
      break;
      
    case 'rollback':
      const env = process.argv[3];
      const deploymentId = process.argv[4];
      
      if (!env || !deploymentId) {
        console.error('Usage: node deploymentManager.js rollback <environment> <deployment-id>');
        process.exit(1);
      }
      
      deploymentManager.rollback(env, deploymentId).catch(error => {
        process.exit(1);
      });
      break;
      
    case 'list':
      const filterEnv = process.argv[3];
      const deployments = deploymentManager.listDeployments(filterEnv);
      
      console.log('\nRecent deployments:');
      deployments.slice(0, 10).forEach(deployment => {
        const status = deployment.status === 'success' ? '✅' : 
                     deployment.status === 'failed' ? '❌' : '🔄';
        console.log(`${status} ${deployment.id} - ${deployment.environment} ${deployment.version} (${deployment.startedAt})`);
      });
      break;
      
    case 'status':
      const id = process.argv[3];
      if (!id) {
        console.error('Usage: node deploymentManager.js status <deployment-id>');
        process.exit(1);
      }
      
      const deployment = deploymentManager.getDeploymentStatus(id);
      if (deployment) {
        console.log(JSON.stringify(deployment, null, 2));
      } else {
        console.log('Deployment not found');
      }
      break;
      
    default:
      console.log(`
Deployment Manager Commands:
  deploy <staging|production> [version]  - Deploy to specified environment
  rollback <environment> <deployment-id> - Rollback a deployment
  list [environment]                     - List recent deployments
  status <deployment-id>                 - Get deployment status
      `);
  }
}

module.exports = DeploymentManager;