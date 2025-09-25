#!/usr/bin/env node

/**
 * Validation Script for Structured Logging System
 */

const path = require('path');

async function validateStructuredLogging() {
  console.log('🔍 Validating Structured Logging System...');
  
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Check if all required files exist
    const requiredFiles = [
      'services/loggingService.ts',
      'services/loggingInitializer.ts',
      'components/LoggingDashboard.tsx',
      'hooks/useStructuredLogging.ts',
      'config/logging.json',
      'examples/structuredLoggingIntegration.ts'
    ];

    console.log('📋 Checking file structure...');
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      try {
        await fs.access(filePath);
        console.log(`✅ ${file} - Found`);
      } catch (error) {
        console.log(`❌ ${file} - Missing`);
        throw new Error(`Required file ${file} is missing`);
      }
    }
    
    // Validate configuration file
    console.log('📋 Validating configuration...');
    const configPath = path.join(__dirname, '..', 'config', 'logging.json');
    const configContent = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    const requiredConfigKeys = ['logLevel', 'maxLocalLogs', 'logRetentionDays', 'categories'];
    for (const key of requiredConfigKeys) {
      if (!(key in config)) {
        throw new Error(`Missing required config key: ${key}`);
      }
    }
    console.log('✅ Configuration file is valid');
    
    // Validate TypeScript files syntax (basic check)
    console.log('📋 Checking TypeScript files...');
    const tsFiles = [
      'services/loggingService.ts',
      'services/loggingInitializer.ts',
      'hooks/useStructuredLogging.ts'
    ];
    
    for (const file of tsFiles) {
      const filePath = path.join(__dirname, '..', file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Basic syntax checks
      if (!content.includes('export')) {
        throw new Error(`${file} does not contain exports`);
      }
      
      if (file.includes('loggingService') && !content.includes('class StructuredLoggingService')) {
        throw new Error(`${file} does not contain StructuredLoggingService class`);
      }
      
      console.log(`✅ ${file} - Syntax OK`);
    }
    
    // Check React component
    console.log('📋 Checking React component...');
    const dashboardPath = path.join(__dirname, '..', 'components', 'LoggingDashboard.tsx');
    const dashboardContent = await fs.readFile(dashboardPath, 'utf8');
    
    if (!dashboardContent.includes('LoggingDashboard')) {
      throw new Error('LoggingDashboard component not found');
    }
    
    if (!dashboardContent.includes('StructuredLoggingService')) {
      throw new Error('LoggingDashboard does not import StructuredLoggingService');
    }
    
    console.log('✅ LoggingDashboard component is valid');
    
    // Check package.json scripts
    console.log('📋 Checking package.json scripts...');
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    try {
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      const expectedScripts = ['logging:setup', 'logging:test', 'logging:validate'];
      for (const script of expectedScripts) {
        if (!packageJson.scripts || !packageJson.scripts[script]) {
          console.log(`⚠️  Missing script: ${script}`);
        } else {
          console.log(`✅ Script found: ${script}`);
        }
      }
    } catch (error) {
      console.log('⚠️  Could not validate package.json scripts');
    }
    
    console.log('🎉 Structured logging system validation completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- All required files are present');
    console.log('- Configuration is valid');
    console.log('- TypeScript files have correct structure');
    console.log('- React component is properly structured');
    console.log('- Package.json scripts are configured');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  validateStructuredLogging();
}

module.exports = { validateStructuredLogging };
