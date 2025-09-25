#!/usr/bin/env node

/**
 * Setup Script for Structured Logging System
 * Initializes and configures the structured logging system for PeerLearningHub
 */

const fs = require('fs').promises;
const path = require('path');

async function setupStructuredLogging() {
  console.log('🚀 Setting up Structured Logging System...');

  try {
    // Check if required files exist
    const requiredFiles = [
      'services/loggingService.ts',
      'services/loggingInitializer.ts',
      'components/LoggingDashboard.tsx',
      'hooks/useStructuredLogging.ts'
    ];

    console.log('📋 Checking required files...');
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

    // Create logging configuration file
    console.log('📝 Creating logging configuration...');
    const loggingConfig = {
      logLevel: process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG',
      maxLocalLogs: 2000,
      logRetentionDays: 30,
      enableConsoleOutput: process.env.NODE_ENV !== 'production',
      enableRemoteLogging: false, // Can be enabled later
      categories: {
        auth: { enabled: true, level: 'INFO' },
        community: { enabled: true, level: 'INFO' },
        external_systems: { enabled: true, level: 'INFO' },
        membership: { enabled: true, level: 'INFO' },
        performance: { enabled: true, level: 'INFO' },
        security: { enabled: true, level: 'WARN' },
        system: { enabled: true, level: 'INFO' },
        ui: { enabled: true, level: 'DEBUG' },
        database: { enabled: true, level: 'INFO' },
        api: { enabled: true, level: 'INFO' }
      },
      filters: {
        excludePatterns: [
          'debug_noise',
          'verbose_ui_events'
        ],
        sensitiveFields: [
          'password',
          'token',
          'apiKey',
          'secret'
        ]
      }
    };

    const configPath = path.join(__dirname, '..', 'config', 'logging.json');
    
    // Ensure config directory exists
    const configDir = path.dirname(configPath);
    try {
      await fs.access(configDir);
    } catch (error) {
      await fs.mkdir(configDir, { recursive: true });
      console.log('📁 Created config directory');
    }

    await fs.writeFile(configPath, JSON.stringify(loggingConfig, null, 2));
    console.log('✅ Logging configuration created');

    // Create example integration file
    console.log('📝 Creating integration examples...');
    const integrationExample = `/**
 * Example: Integrating Structured Logging in PeerLearningHub
 * This file shows how to use the structured logging system
 */

import { useStructuredLogging, usePerformanceLogging } from '../hooks/useStructuredLogging';
import LoggingInitializer from '../services/loggingInitializer';

// Example 1: Using logging in a React component
export const ExampleComponent = () => {
  const { logInfo, logError, logAuth } = useStructuredLogging('ExampleComponent');
  const { measurePerformance } = usePerformanceLogging('ExampleComponent');

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await measurePerformance('user_login', async () => {
        // Your login logic here
        return await authService.signIn(email, password);
      });

      logAuth('login', true, {
        userId: result.user?.id,
        email: result.user?.email,
        method: 'email_password'
      });

      return result;
    } catch (error) {
      logAuth('login', false, {
        email,
        method: 'email_password',
        error: error as Error
      });
      throw error;
    }
  };

  return (
    // Your component JSX
    <div>Example Component</div>
  );
};

// Example 2: Initializing logging in App.tsx
export const initializeAppLogging = async (userId?: string) => {
  const loggingInitializer = LoggingInitializer.getInstance();
  
  try {
    await loggingInitializer.initialize();
    
    if (userId) {
      loggingInitializer.setUserContext(userId);
    }
    
    console.log('Structured logging initialized successfully');
  } catch (error) {
    console.error('Failed to initialize logging:', error);
  }
};

// Example 3: Service-level logging
export class ExampleService {
  private logger = useStructuredLogging('ExampleService');

  async fetchData(id: string) {
    const startTime = Date.now();
    
    try {
      this.logger.logInfo('api', 'Fetching data', { id });
      
      const response = await fetch(\`/api/data/\${id}\`);
      const duration = Date.now() - startTime;
      
      this.logger.logApiRequest('GET', \`/api/data/\${id}\`, {
        statusCode: response.status,
        duration
      });
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}\`);
      }
      
      return await response.json();
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.logApiRequest('GET', \`/api/data/\${id}\`, {
        duration,
        error: error as Error
      });
      
      throw error;
    }
  }
}
`;

    const examplePath = path.join(__dirname, '..', 'examples', 'structuredLoggingIntegration.ts');
    
    // Ensure examples directory exists
    const exampleDir = path.dirname(examplePath);
    try {
      await fs.access(exampleDir);
    } catch (error) {
      await fs.mkdir(exampleDir, { recursive: true });
      console.log('📁 Created examples directory');
    }

    await fs.writeFile(examplePath, integrationExample);
    console.log('✅ Integration examples created');

    // Update package.json scripts if it exists
    console.log('📝 Updating package.json scripts...');
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    
    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      // Add logging-related scripts
      packageJson.scripts['logging:setup'] = 'node scripts/setupStructuredLogging.js';
      packageJson.scripts['logging:test'] = 'node scripts/testStructuredLogging.js';
      packageJson.scripts['logging:validate'] = 'node scripts/validateStructuredLogging.js';
      
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Package.json scripts updated');
    } catch (error) {
      console.log('⚠️  Could not update package.json scripts (file may not exist)');
    }

    // Create validation script
    console.log('📝 Creating validation script...');
    const validationScript = `#!/usr/bin/env node

/**
 * Validation Script for Structured Logging System
 */

const path = require('path');

async function validateStructuredLogging() {
  console.log('🔍 Validating Structured Logging System...');
  
  try {
    // Import and test the logging service
    const { default: StructuredLoggingService } = require('../services/loggingService');
    const { default: LoggingInitializer } = require('../services/loggingInitializer');
    
    console.log('📋 Testing logging service initialization...');
    const loggingService = StructuredLoggingService.getInstance();
    const loggingInitializer = LoggingInitializer.getInstance();
    
    await loggingInitializer.initialize();
    console.log('✅ Logging service initialized successfully');
    
    console.log('📋 Testing log levels...');
    loggingService.debug('system', 'Debug test message');
    loggingService.info('system', 'Info test message');
    loggingService.warn('system', 'Warning test message');
    loggingService.error('system', 'Error test message', { error: new Error('Test error') });
    console.log('✅ All log levels working');
    
    console.log('📋 Testing specialized logging methods...');
    loggingService.logAuth('test_login', true, { userId: 'test_user' });
    loggingService.logCommunity('test_post_create', { postId: 'test_post' });
    loggingService.logPerformance('test_operation', 150);
    loggingService.logApiRequest('GET', '/api/test', { statusCode: 200, duration: 100 });
    console.log('✅ Specialized logging methods working');
    
    console.log('📋 Testing log search and filtering...');
    const logs = await loggingService.searchLogs({ level: 'INFO' }, 10);
    console.log(\`✅ Found \${logs.length} INFO level logs\`);
    
    console.log('📋 Testing log statistics...');
    const stats = await loggingService.getLogStatistics();
    console.log(\`✅ Statistics: \${stats.totalLogs} total logs, \${stats.errorRate.toFixed(1)}% error rate\`);
    
    console.log('🎉 Structured logging system validation completed successfully!');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  validateStructuredLogging();
}

module.exports = { validateStructuredLogging };
`;

    const validationPath = path.join(__dirname, 'validateStructuredLogging.js');
    await fs.writeFile(validationPath, validationScript);
    console.log('✅ Validation script created');

    // Create test script
    console.log('📝 Creating test script...');
    const testScript = `#!/usr/bin/env node

/**
 * Test Script for Structured Logging System
 */

async function testStructuredLogging() {
  console.log('🧪 Testing Structured Logging System...');
  
  try {
    // Import the validation function
    const { validateStructuredLogging } = require('./validateStructuredLogging');
    
    // Run validation
    await validateStructuredLogging();
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testStructuredLogging();
}

module.exports = { testStructuredLogging };
`;

    const testPath = path.join(__dirname, 'testStructuredLogging.js');
    await fs.writeFile(testPath, testScript);
    console.log('✅ Test script created');

    console.log('\n🎉 Structured Logging System setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Initialize logging in your App.tsx file');
    console.log('2. Use the useStructuredLogging hook in your components');
    console.log('3. Add LoggingDashboard to your admin interface');
    console.log('4. Run validation: npm run logging:validate');
    console.log('5. Run tests: npm run logging:test');
    
    console.log('\n📚 Documentation:');
    console.log('- Configuration: config/logging.json');
    console.log('- Examples: examples/structuredLoggingIntegration.ts');
    console.log('- Dashboard: components/LoggingDashboard.tsx');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupStructuredLogging();
}

module.exports = { setupStructuredLogging };