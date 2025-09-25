#!/usr/bin/env node

/**
 * Build Manager Script
 * Manages build artifacts and provides build utilities
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildManager {
  constructor() {
    this.buildDir = path.join(__dirname, '..', 'builds');
    this.metadataFile = path.join(this.buildDir, 'build-metadata.json');
    this.ensureBuildDirectory();
  }

  ensureBuildDirectory() {
    if (!fs.existsSync(this.buildDir)) {
      fs.mkdirSync(this.buildDir, { recursive: true });
    }
  }

  generateBuildMetadata(platform, profile, version) {
    const metadata = {
      platform,
      profile,
      version,
      buildDate: new Date().toISOString(),
      commitSha: this.getCommitSha(),
      branch: this.getCurrentBranch(),
      nodeVersion: process.version,
      buildId: this.generateBuildId()
    };

    return metadata;
  }

  getCommitSha() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.warn('Could not get commit SHA:', error.message);
      return 'unknown';
    }
  }

  getCurrentBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.warn('Could not get current branch:', error.message);
      return 'unknown';
    }
  }

  generateBuildId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  saveBuildMetadata(metadata) {
    let existingMetadata = [];
    
    if (fs.existsSync(this.metadataFile)) {
      try {
        existingMetadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
      } catch (error) {
        console.warn('Could not read existing metadata:', error.message);
      }
    }

    existingMetadata.push(metadata);
    
    // Keep only last 50 builds
    if (existingMetadata.length > 50) {
      existingMetadata = existingMetadata.slice(-50);
    }

    fs.writeFileSync(this.metadataFile, JSON.stringify(existingMetadata, null, 2));
    console.log('Build metadata saved:', metadata.buildId);
  }

  listBuilds() {
    if (!fs.existsSync(this.metadataFile)) {
      console.log('No builds found');
      return [];
    }

    try {
      const metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
      return metadata.sort((a, b) => new Date(b.buildDate) - new Date(a.buildDate));
    } catch (error) {
      console.error('Error reading build metadata:', error.message);
      return [];
    }
  }

  cleanOldBuilds(daysToKeep = 30) {
    const builds = this.listBuilds();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const buildsToKeep = builds.filter(build => 
      new Date(build.buildDate) > cutoffDate
    );

    if (buildsToKeep.length !== builds.length) {
      fs.writeFileSync(this.metadataFile, JSON.stringify(buildsToKeep, null, 2));
      console.log(`Cleaned ${builds.length - buildsToKeep.length} old builds`);
    }
  }

  validateBuildEnvironment() {
    const checks = [
      {
        name: 'Node.js version',
        check: () => {
          const version = process.version;
          const major = parseInt(version.slice(1).split('.')[0]);
          return major >= 18;
        }
      },
      {
        name: 'EAS CLI installed',
        check: () => {
          try {
            execSync('eas --version', { stdio: 'ignore' });
            return true;
          } catch {
            return false;
          }
        }
      },
      {
        name: 'Git repository',
        check: () => {
          try {
            execSync('git status', { stdio: 'ignore' });
            return true;
          } catch {
            return false;
          }
        }
      },
      {
        name: 'Package.json exists',
        check: () => fs.existsSync(path.join(__dirname, '..', 'package.json'))
      },
      {
        name: 'EAS.json exists',
        check: () => fs.existsSync(path.join(__dirname, '..', 'eas.json'))
      }
    ];

    console.log('Validating build environment...');
    let allPassed = true;

    checks.forEach(({ name, check }) => {
      const passed = check();
      console.log(`${passed ? '✅' : '❌'} ${name}`);
      if (!passed) allPassed = false;
    });

    return allPassed;
  }

  async buildApp(platform, profile = 'production') {
    console.log(`Starting ${platform} build with ${profile} profile...`);
    
    if (!this.validateBuildEnvironment()) {
      throw new Error('Build environment validation failed');
    }

    const version = this.getAppVersion();
    const metadata = this.generateBuildMetadata(platform, profile, version);
    
    try {
      // Run the EAS build
      const buildCommand = `eas build --platform ${platform} --profile ${profile} --non-interactive`;
      console.log(`Executing: ${buildCommand}`);
      
      execSync(buildCommand, { stdio: 'inherit' });
      
      metadata.status = 'success';
      this.saveBuildMetadata(metadata);
      
      console.log(`✅ ${platform} build completed successfully`);
      return metadata;
      
    } catch (error) {
      metadata.status = 'failed';
      metadata.error = error.message;
      this.saveBuildMetadata(metadata);
      
      console.error(`❌ ${platform} build failed:`, error.message);
      throw error;
    }
  }

  getAppVersion() {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
      );
      return packageJson.version || '1.0.0';
    } catch (error) {
      console.warn('Could not read app version:', error.message);
      return '1.0.0';
    }
  }
}

// CLI interface
if (require.main === module) {
  const buildManager = new BuildManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'build':
      const platform = process.argv[3];
      const profile = process.argv[4] || 'production';
      
      if (!platform || !['ios', 'android', 'all'].includes(platform)) {
        console.error('Usage: node buildManager.js build <ios|android|all> [profile]');
        process.exit(1);
      }
      
      if (platform === 'all') {
        Promise.all([
          buildManager.buildApp('ios', profile),
          buildManager.buildApp('android', profile)
        ]).then(() => {
          console.log('✅ All builds completed successfully');
        }).catch(error => {
          console.error('❌ Build failed:', error.message);
          process.exit(1);
        });
      } else {
        buildManager.buildApp(platform, profile).catch(error => {
          process.exit(1);
        });
      }
      break;
      
    case 'list':
      const builds = buildManager.listBuilds();
      console.log('\nRecent builds:');
      builds.slice(0, 10).forEach(build => {
        const status = build.status === 'success' ? '✅' : '❌';
        console.log(`${status} ${build.platform} ${build.profile} - ${build.version} (${build.buildDate})`);
      });
      break;
      
    case 'clean':
      const days = parseInt(process.argv[3]) || 30;
      buildManager.cleanOldBuilds(days);
      break;
      
    case 'validate':
      const isValid = buildManager.validateBuildEnvironment();
      process.exit(isValid ? 0 : 1);
      break;
      
    default:
      console.log(`
Build Manager Commands:
  build <ios|android|all> [profile]  - Build app for specified platform(s)
  list                               - List recent builds
  clean [days]                       - Clean builds older than specified days (default: 30)
  validate                           - Validate build environment
      `);
  }
}

module.exports = BuildManager;