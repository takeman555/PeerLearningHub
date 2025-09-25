#!/usr/bin/env node

/**
 * Artifact Manager Script
 * Manages build artifacts, storage, and distribution
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class ArtifactManager {
  constructor() {
    this.artifactsDir = path.join(__dirname, '..', 'artifacts');
    this.configFile = path.join(this.artifactsDir, 'artifacts-config.json');
    this.ensureArtifactsDirectory();
  }

  ensureArtifactsDirectory() {
    if (!fs.existsSync(this.artifactsDir)) {
      fs.mkdirSync(this.artifactsDir, { recursive: true });
    }
  }

  generateChecksum(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  storeArtifact(filePath, metadata = {}) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Artifact file not found: ${filePath}`);
    }

    const fileName = path.basename(filePath);
    const fileExt = path.extname(fileName);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const storedFileName = `${path.basename(fileName, fileExt)}-${timestamp}${fileExt}`;
    const storedPath = path.join(this.artifactsDir, storedFileName);

    // Copy file to artifacts directory
    fs.copyFileSync(filePath, storedPath);

    // Generate artifact metadata
    const stats = fs.statSync(storedPath);
    const artifactInfo = {
      id: this.generateArtifactId(),
      originalName: fileName,
      storedName: storedFileName,
      storedPath,
      size: stats.size,
      checksum: this.generateChecksum(storedPath),
      createdAt: new Date().toISOString(),
      metadata: {
        ...metadata,
        platform: this.detectPlatform(fileName),
        buildType: this.detectBuildType(fileName)
      }
    };

    this.saveArtifactInfo(artifactInfo);
    console.log(`Artifact stored: ${artifactInfo.id}`);
    return artifactInfo;
  }

  generateArtifactId() {
    return crypto.randomBytes(16).toString('hex');
  }

  detectPlatform(fileName) {
    if (fileName.endsWith('.ipa')) return 'ios';
    if (fileName.endsWith('.apk') || fileName.endsWith('.aab')) return 'android';
    return 'unknown';
  }

  detectBuildType(fileName) {
    if (fileName.includes('debug')) return 'debug';
    if (fileName.includes('staging')) return 'staging';
    if (fileName.includes('production')) return 'production';
    if (fileName.endsWith('.aab')) return 'release';
    if (fileName.endsWith('.apk')) return 'debug';
    return 'unknown';
  }

  saveArtifactInfo(artifactInfo) {
    let artifacts = [];
    
    if (fs.existsSync(this.configFile)) {
      try {
        artifacts = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      } catch (error) {
        console.warn('Could not read existing artifacts config:', error.message);
      }
    }

    artifacts.push(artifactInfo);
    
    // Keep only last 100 artifacts
    if (artifacts.length > 100) {
      const oldArtifacts = artifacts.slice(0, -100);
      // Clean up old artifact files
      oldArtifacts.forEach(artifact => {
        if (fs.existsSync(artifact.storedPath)) {
          fs.unlinkSync(artifact.storedPath);
        }
      });
      artifacts = artifacts.slice(-100);
    }

    fs.writeFileSync(this.configFile, JSON.stringify(artifacts, null, 2));
  }

  listArtifacts(filter = {}) {
    if (!fs.existsSync(this.configFile)) {
      return [];
    }

    try {
      let artifacts = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      
      // Apply filters
      if (filter.platform) {
        artifacts = artifacts.filter(a => a.metadata.platform === filter.platform);
      }
      
      if (filter.buildType) {
        artifacts = artifacts.filter(a => a.metadata.buildType === filter.buildType);
      }
      
      if (filter.since) {
        const sinceDate = new Date(filter.since);
        artifacts = artifacts.filter(a => new Date(a.createdAt) >= sinceDate);
      }

      return artifacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error reading artifacts config:', error.message);
      return [];
    }
  }

  getArtifact(id) {
    const artifacts = this.listArtifacts();
    return artifacts.find(a => a.id === id);
  }

  verifyArtifact(id) {
    const artifact = this.getArtifact(id);
    if (!artifact) {
      throw new Error(`Artifact not found: ${id}`);
    }

    if (!fs.existsSync(artifact.storedPath)) {
      throw new Error(`Artifact file missing: ${artifact.storedPath}`);
    }

    const currentChecksum = this.generateChecksum(artifact.storedPath);
    if (currentChecksum !== artifact.checksum) {
      throw new Error(`Artifact checksum mismatch: ${id}`);
    }

    console.log(`✅ Artifact verified: ${id}`);
    return true;
  }

  distributeArtifact(id, distributionConfig) {
    const artifact = this.getArtifact(id);
    if (!artifact) {
      throw new Error(`Artifact not found: ${id}`);
    }

    this.verifyArtifact(id);

    console.log(`Distributing artifact ${id}...`);
    
    // Distribution methods
    const distributionMethods = {
      slack: this.distributeToSlack.bind(this),
      email: this.distributeToEmail.bind(this),
      s3: this.distributeToS3.bind(this),
      firebase: this.distributeToFirebase.bind(this)
    };

    const results = [];
    
    for (const [method, config] of Object.entries(distributionConfig)) {
      if (distributionMethods[method]) {
        try {
          const result = distributionMethods[method](artifact, config);
          results.push({ method, status: 'success', result });
          console.log(`✅ Distributed to ${method}`);
        } catch (error) {
          results.push({ method, status: 'failed', error: error.message });
          console.error(`❌ Failed to distribute to ${method}:`, error.message);
        }
      }
    }

    return results;
  }

  distributeToSlack(artifact, config) {
    // Placeholder for Slack distribution
    console.log(`Distributing ${artifact.originalName} to Slack channel: ${config.channel}`);
    return { message: 'Distributed to Slack' };
  }

  distributeToEmail(artifact, config) {
    // Placeholder for email distribution
    console.log(`Distributing ${artifact.originalName} to email: ${config.recipients.join(', ')}`);
    return { message: 'Distributed via email' };
  }

  distributeToS3(artifact, config) {
    // Placeholder for S3 distribution
    console.log(`Uploading ${artifact.originalName} to S3 bucket: ${config.bucket}`);
    return { message: 'Uploaded to S3' };
  }

  distributeToFirebase(artifact, config) {
    // Placeholder for Firebase App Distribution
    console.log(`Distributing ${artifact.originalName} via Firebase App Distribution`);
    return { message: 'Distributed via Firebase' };
  }

  cleanupArtifacts(daysToKeep = 30) {
    const artifacts = this.listArtifacts();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const artifactsToRemove = artifacts.filter(artifact => 
      new Date(artifact.createdAt) < cutoffDate
    );

    artifactsToRemove.forEach(artifact => {
      if (fs.existsSync(artifact.storedPath)) {
        fs.unlinkSync(artifact.storedPath);
        console.log(`Removed old artifact: ${artifact.originalName}`);
      }
    });

    const artifactsToKeep = artifacts.filter(artifact => 
      new Date(artifact.createdAt) >= cutoffDate
    );

    fs.writeFileSync(this.configFile, JSON.stringify(artifactsToKeep, null, 2));
    
    console.log(`Cleaned up ${artifactsToRemove.length} old artifacts`);
    return artifactsToRemove.length;
  }

  generateReport() {
    const artifacts = this.listArtifacts();
    
    const report = {
      totalArtifacts: artifacts.length,
      platforms: {},
      buildTypes: {},
      totalSize: 0,
      oldestArtifact: null,
      newestArtifact: null
    };

    artifacts.forEach(artifact => {
      // Platform stats
      const platform = artifact.metadata.platform;
      report.platforms[platform] = (report.platforms[platform] || 0) + 1;
      
      // Build type stats
      const buildType = artifact.metadata.buildType;
      report.buildTypes[buildType] = (report.buildTypes[buildType] || 0) + 1;
      
      // Size stats
      report.totalSize += artifact.size;
      
      // Date stats
      const createdAt = new Date(artifact.createdAt);
      if (!report.oldestArtifact || createdAt < new Date(report.oldestArtifact.createdAt)) {
        report.oldestArtifact = artifact;
      }
      if (!report.newestArtifact || createdAt > new Date(report.newestArtifact.createdAt)) {
        report.newestArtifact = artifact;
      }
    });

    return report;
  }
}

// CLI interface
if (require.main === module) {
  const artifactManager = new ArtifactManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'store':
      const filePath = process.argv[3];
      if (!filePath) {
        console.error('Usage: node artifactManager.js store <file-path>');
        process.exit(1);
      }
      
      try {
        const artifact = artifactManager.storeArtifact(filePath);
        console.log('Artifact stored successfully:', artifact.id);
      } catch (error) {
        console.error('Failed to store artifact:', error.message);
        process.exit(1);
      }
      break;
      
    case 'list':
      const platform = process.argv[3];
      const buildType = process.argv[4];
      const filter = {};
      if (platform) filter.platform = platform;
      if (buildType) filter.buildType = buildType;
      
      const artifacts = artifactManager.listArtifacts(filter);
      console.log('\nArtifacts:');
      artifacts.slice(0, 20).forEach(artifact => {
        const size = (artifact.size / 1024 / 1024).toFixed(2);
        console.log(`${artifact.id} - ${artifact.originalName} (${size}MB) - ${artifact.createdAt}`);
      });
      break;
      
    case 'verify':
      const id = process.argv[3];
      if (!id) {
        console.error('Usage: node artifactManager.js verify <artifact-id>');
        process.exit(1);
      }
      
      try {
        artifactManager.verifyArtifact(id);
      } catch (error) {
        console.error('Verification failed:', error.message);
        process.exit(1);
      }
      break;
      
    case 'cleanup':
      const days = parseInt(process.argv[3]) || 30;
      const removed = artifactManager.cleanupArtifacts(days);
      console.log(`Cleaned up ${removed} artifacts older than ${days} days`);
      break;
      
    case 'report':
      const report = artifactManager.generateReport();
      console.log('\nArtifacts Report:');
      console.log(`Total artifacts: ${report.totalArtifacts}`);
      console.log(`Total size: ${(report.totalSize / 1024 / 1024).toFixed(2)}MB`);
      console.log('Platforms:', report.platforms);
      console.log('Build types:', report.buildTypes);
      break;
      
    default:
      console.log(`
Artifact Manager Commands:
  store <file-path>           - Store a build artifact
  list [platform] [buildType] - List artifacts with optional filters
  verify <artifact-id>        - Verify artifact integrity
  cleanup [days]              - Clean up artifacts older than specified days
  report                      - Generate artifacts report
      `);
  }
}

module.exports = ArtifactManager;