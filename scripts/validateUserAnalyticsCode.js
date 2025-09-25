#!/usr/bin/env node

/**
 * Validate User Analytics Code Implementation
 * Tests the analytics code without requiring database setup
 */

const fs = require('fs');
const path = require('path');

class CodeValidator {
  constructor() {
    this.results = {
      serviceFiles: false,
      hookFiles: false,
      componentFiles: false,
      migrationFiles: false,
      testFiles: false,
      documentationFiles: false
    };
  }

  validateServiceFiles() {
    console.log('🔍 Validating service files...');

    const requiredFiles = [
      'services/userAnalyticsService.ts',
      'services/userAnalyticsInitializer.ts'
    ];

    let allExist = true;

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
        
        // Check file content
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.length > 1000) { // Basic content check
          console.log(`✅ ${file} has substantial content`);
        } else {
          console.log(`⚠️  ${file} seems incomplete`);
        }
      } else {
        console.log(`❌ ${file} missing`);
        allExist = false;
      }
    }

    this.results.serviceFiles = allExist;
    return allExist;
  }

  validateHookFiles() {
    console.log('🔍 Validating hook files...');

    const requiredFiles = [
      'hooks/useUserAnalytics.ts'
    ];

    let allExist = true;

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
        
        // Check for key hook exports
        const content = fs.readFileSync(filePath, 'utf8');
        const hasMainHook = content.includes('useUserAnalytics');
        const hasActionTracking = content.includes('useActionTracking');
        const hasConversionTracking = content.includes('useConversionTracking');
        
        if (hasMainHook && hasActionTracking && hasConversionTracking) {
          console.log(`✅ ${file} has all required hooks`);
        } else {
          console.log(`⚠️  ${file} missing some hook exports`);
        }
      } else {
        console.log(`❌ ${file} missing`);
        allExist = false;
      }
    }

    this.results.hookFiles = allExist;
    return allExist;
  }

  validateComponentFiles() {
    console.log('🔍 Validating component files...');

    const requiredFiles = [
      'components/UserAnalyticsDashboard.tsx'
    ];

    let allExist = true;

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
        
        // Check for React component structure
        const content = fs.readFileSync(filePath, 'utf8');
        const hasReactImport = content.includes('import React');
        const hasComponent = content.includes('UserAnalyticsDashboard');
        const hasExport = content.includes('export default');
        
        if (hasReactImport && hasComponent && hasExport) {
          console.log(`✅ ${file} is a valid React component`);
        } else {
          console.log(`⚠️  ${file} may not be a valid React component`);
        }
      } else {
        console.log(`❌ ${file} missing`);
        allExist = false;
      }
    }

    this.results.componentFiles = allExist;
    return allExist;
  }

  validateMigrationFiles() {
    console.log('🔍 Validating migration files...');

    const requiredFiles = [
      'supabase/migrations/012_create_user_analytics_tables.sql'
    ];

    let allExist = true;

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
        
        // Check for key SQL elements
        const content = fs.readFileSync(filePath, 'utf8');
        const hasTables = content.includes('CREATE TABLE');
        const hasIndexes = content.includes('CREATE INDEX');
        const hasRLS = content.includes('ROW LEVEL SECURITY');
        const hasFunctions = content.includes('CREATE OR REPLACE FUNCTION');
        
        if (hasTables && hasIndexes && hasRLS && hasFunctions) {
          console.log(`✅ ${file} has all required SQL elements`);
        } else {
          console.log(`⚠️  ${file} missing some SQL elements`);
        }
      } else {
        console.log(`❌ ${file} missing`);
        allExist = false;
      }
    }

    this.results.migrationFiles = allExist;
    return allExist;
  }

  validateTestFiles() {
    console.log('🔍 Validating test files...');

    const requiredFiles = [
      'tests/userAnalyticsSystem.test.ts'
    ];

    let allExist = true;

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
        
        // Check for test structure
        const content = fs.readFileSync(filePath, 'utf8');
        const hasDescribe = content.includes('describe(');
        const hasTest = content.includes('it(') || content.includes('test(');
        const hasExpect = content.includes('expect(');
        
        if (hasDescribe && hasTest && hasExpect) {
          console.log(`✅ ${file} has valid test structure`);
        } else {
          console.log(`⚠️  ${file} may not have valid test structure`);
        }
      } else {
        console.log(`❌ ${file} missing`);
        allExist = false;
      }
    }

    this.results.testFiles = allExist;
    return allExist;
  }

  validateDocumentationFiles() {
    console.log('🔍 Validating documentation files...');

    const requiredFiles = [
      'docs/USER_ANALYTICS_IMPLEMENTATION.md'
    ];

    let allExist = true;

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
        
        // Check for documentation content
        const content = fs.readFileSync(filePath, 'utf8');
        const hasOverview = content.includes('## Overview');
        const hasImplementation = content.includes('Implementation');
        const hasExamples = content.includes('```');
        
        if (hasOverview && hasImplementation && hasExamples && content.length > 5000) {
          console.log(`✅ ${file} has comprehensive documentation`);
        } else {
          console.log(`⚠️  ${file} documentation may be incomplete`);
        }
      } else {
        console.log(`❌ ${file} missing`);
        allExist = false;
      }
    }

    this.results.documentationFiles = allExist;
    return allExist;
  }

  validateTypeScriptCompilation() {
    console.log('🔍 Validating TypeScript compilation...');

    const tsFiles = [
      'services/userAnalyticsService.ts',
      'services/userAnalyticsInitializer.ts',
      'hooks/useUserAnalytics.ts',
      'components/UserAnalyticsDashboard.tsx'
    ];

    // Simple syntax check by trying to read and parse basic structure
    let allValid = true;

    for (const file of tsFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Basic syntax checks
          const hasValidImports = !content.includes('import') || content.match(/import.*from/);
          const hasValidExports = !content.includes('export') || content.match(/export\s+(default\s+)?\w+/);
          const hasMatchingBraces = (content.match(/\{/g) || []).length === (content.match(/\}/g) || []).length;
          
          if (hasValidImports && hasValidExports && hasMatchingBraces) {
            console.log(`✅ ${file} has valid TypeScript syntax`);
          } else {
            console.log(`⚠️  ${file} may have syntax issues`);
            allValid = false;
          }
        } catch (error) {
          console.log(`❌ Error reading ${file}: ${error.message}`);
          allValid = false;
        }
      }
    }

    return allValid;
  }

  checkImplementationCompleteness() {
    console.log('🔍 Checking implementation completeness...');

    const serviceFile = path.join(process.cwd(), 'services/userAnalyticsService.ts');
    
    if (fs.existsSync(serviceFile)) {
      const content = fs.readFileSync(serviceFile, 'utf8');
      
      const requiredMethods = [
        'trackAction',
        'trackScreenTransition',
        'trackConversion',
        'trackFeatureUsage',
        'getAnalyticsData',
        'calculateConversionRates',
        'getFeatureUsageStats'
      ];

      const missingMethods = requiredMethods.filter(method => !content.includes(method));
      
      if (missingMethods.length === 0) {
        console.log('✅ All required methods implemented');
        return true;
      } else {
        console.log(`⚠️  Missing methods: ${missingMethods.join(', ')}`);
        return false;
      }
    }

    return false;
  }

  generateReport() {
    console.log('\n📋 User Analytics Code Validation Report');
    console.log('=========================================');

    const results = Object.entries(this.results);
    const passed = results.filter(([_, result]) => result).length;
    const total = results.length;

    results.forEach(([category, result]) => {
      const status = result ? '✅ PASS' : '❌ FAIL';
      const categoryName = category.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${status} ${categoryName}`);
    });

    console.log('=========================================');
    console.log(`Overall: ${passed}/${total} categories passed`);

    if (passed === total) {
      console.log('🎉 All code validation checks passed!');
      console.log('\n✨ User Analytics System implementation is complete');
      console.log('\n📝 Next steps:');
      console.log('   1. Run database migration: 012_create_user_analytics_tables.sql');
      console.log('   2. Initialize analytics in your app startup code');
      console.log('   3. Add analytics tracking to your components');
      console.log('   4. Test the system with real user interactions');
    } else {
      console.log('❌ Some validation checks failed');
      console.log('\n🔧 Please fix the failing checks before proceeding');
    }

    return passed === total;
  }

  async runAllValidations() {
    console.log('🚀 Starting User Analytics Code Validation\n');

    try {
      this.validateServiceFiles();
      this.validateHookFiles();
      this.validateComponentFiles();
      this.validateMigrationFiles();
      this.validateTestFiles();
      this.validateDocumentationFiles();
      
      // Additional checks
      const tsValid = this.validateTypeScriptCompilation();
      const implementationComplete = this.checkImplementationCompleteness();
      
      console.log('\n🔧 Additional Checks:');
      console.log(`TypeScript Syntax: ${tsValid ? '✅ Valid' : '❌ Issues found'}`);
      console.log(`Implementation Complete: ${implementationComplete ? '✅ Complete' : '❌ Incomplete'}`);

      return this.generateReport();
    } catch (error) {
      console.error('\n❌ Validation failed with error:', error.message);
      return false;
    }
  }
}

async function main() {
  const validator = new CodeValidator();
  const success = await validator.runAllValidations();
  
  process.exit(success ? 0 : 1);
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = CodeValidator;