#!/usr/bin/env node

/**
 * Production RevenueCat Setup Script
 * Sets up RevenueCat for production deployment
 */

const fs = require('fs');
const path = require('path');

class ProductionRevenueCatSetup {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    // Load from environment variables
    return {
      iosApiKey: process.env.PRODUCTION_REVENUECAT_API_KEY_IOS || process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
      androidApiKey: process.env.PRODUCTION_REVENUECAT_API_KEY_ANDROID || process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
      appStoreConnectApiKey: process.env.APP_STORE_CONNECT_API_KEY,
      googlePlayApiKey: process.env.GOOGLE_PLAY_API_KEY,
      bundleId: 'com.peerlearninghub.app',
      packageName: 'com.peerlearninghub.app',
    };
  }

  validateConfiguration() {
    console.log('🔍 Validating RevenueCat configuration...');
    
    const errors = [];

    if (!this.config.iosApiKey) {
      errors.push('PRODUCTION_REVENUECAT_API_KEY_IOS is required');
    }

    if (!this.config.androidApiKey) {
      errors.push('PRODUCTION_REVENUECAT_API_KEY_ANDROID is required');
    }

    if (!this.config.iosApiKey?.startsWith('rcat_')) {
      errors.push('iOS API key should start with "rcat_"');
    }

    if (!this.config.androidApiKey?.startsWith('rcat_')) {
      errors.push('Android API key should start with "rcat_"');
    }

    if (errors.length > 0) {
      console.error('❌ Configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      return false;
    }

    console.log('  ✅ Configuration validation passed');
    return true;
  }

  async validateProducts() {
    console.log('📦 Validating product configuration...');
    
    const requiredProducts = [
      {
        id: 'peer_learning_hub_monthly',
        type: 'subscription',
        platform: 'both',
        description: 'Monthly membership subscription'
      },
      {
        id: 'peer_learning_hub_yearly',
        type: 'subscription',
        platform: 'both',
        description: 'Yearly membership subscription'
      },
      {
        id: 'peer_learning_hub_lifetime',
        type: 'non_consumable',
        platform: 'both',
        description: 'Lifetime membership purchase'
      }
    ];

    console.log('  📋 Required products:');
    requiredProducts.forEach(product => {
      console.log(`    - ${product.id} (${product.type})`);
    });

    console.log('  ⚠️  Please ensure these products are configured in:');
    console.log('    - App Store Connect (iOS)');
    console.log('    - Google Play Console (Android)');
    console.log('    - RevenueCat Dashboard');

    return true;
  }

  async validateEntitlements() {
    console.log('🎫 Validating entitlement configuration...');
    
    const requiredEntitlements = [
      {
        id: 'premium_membership',
        description: 'Premium membership access',
        products: [
          'peer_learning_hub_monthly',
          'peer_learning_hub_yearly',
          'peer_learning_hub_lifetime'
        ]
      }
    ];

    console.log('  📋 Required entitlements:');
    requiredEntitlements.forEach(entitlement => {
      console.log(`    - ${entitlement.id}`);
      console.log(`      Products: ${entitlement.products.join(', ')}`);
    });

    console.log('  ⚠️  Please ensure entitlements are configured in RevenueCat Dashboard');

    return true;
  }

  createProductionConfig() {
    console.log('📝 Creating production RevenueCat configuration...');
    
    const productionConfig = {
      // API Keys (will be set via environment variables)
      apiKeys: {
        ios: '${EXPO_PUBLIC_REVENUECAT_API_KEY_IOS}',
        android: '${EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID}'
      },
      
      // App Configuration
      apps: {
        ios: {
          bundleId: this.config.bundleId,
          appStoreId: 'TBD', // To be set after App Store submission
        },
        android: {
          packageName: this.config.packageName,
          playStoreId: 'TBD', // To be set after Google Play submission
        }
      },

      // Product Configuration
      products: {
        monthly: {
          id: 'peer_learning_hub_monthly',
          type: 'subscription',
          period: 'P1M',
          trialPeriod: 'P7D', // 7-day free trial
        },
        yearly: {
          id: 'peer_learning_hub_yearly',
          type: 'subscription',
          period: 'P1Y',
          trialPeriod: 'P7D', // 7-day free trial
        },
        lifetime: {
          id: 'peer_learning_hub_lifetime',
          type: 'non_consumable',
        }
      },

      // Entitlement Configuration
      entitlements: {
        premium_membership: {
          products: [
            'peer_learning_hub_monthly',
            'peer_learning_hub_yearly',
            'peer_learning_hub_lifetime'
          ]
        }
      },

      // Offering Configuration
      offerings: {
        default: {
          packages: [
            {
              identifier: 'monthly',
              productId: 'peer_learning_hub_monthly'
            },
            {
              identifier: 'yearly',
              productId: 'peer_learning_hub_yearly'
            },
            {
              identifier: 'lifetime',
              productId: 'peer_learning_hub_lifetime'
            }
          ]
        },
        onboarding_special: {
          packages: [
            {
              identifier: 'yearly_special',
              productId: 'peer_learning_hub_yearly'
            }
          ]
        }
      }
    };

    const configPath = path.join(__dirname, '../config/revenuecat-production.json');
    fs.writeFileSync(configPath, JSON.stringify(productionConfig, null, 2));
    console.log(`  ✅ Production config saved to ${configPath}`);

    return productionConfig;
  }

  createProductionEnvTemplate() {
    console.log('📄 Creating production environment template...');
    
    const envTemplate = `# RevenueCat Production Configuration
# Add these to your production .env file

# RevenueCat API Keys (get from RevenueCat Dashboard)
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=rcat_your_production_ios_api_key_here
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=rcat_your_production_android_api_key_here

# App Store Connect Configuration (optional, for server-to-server notifications)
APP_STORE_CONNECT_API_KEY=your_app_store_connect_api_key_here
APP_STORE_CONNECT_ISSUER_ID=your_issuer_id_here
APP_STORE_CONNECT_KEY_ID=your_key_id_here

# Google Play Configuration (optional, for server-to-server notifications)
GOOGLE_PLAY_API_KEY=your_google_play_api_key_here
GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL=your_service_account_email_here

# RevenueCat Webhook Configuration (optional)
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret_here
`;

    const templatePath = path.join(__dirname, '../.env.revenuecat.template');
    fs.writeFileSync(templatePath, envTemplate);
    console.log(`  ✅ Environment template saved to ${templatePath}`);
  }

  generateSetupInstructions() {
    console.log('📋 Generating setup instructions...');
    
    const instructions = `# RevenueCat Production Setup Instructions

## Prerequisites

1. **RevenueCat Account**: Create a production RevenueCat project
2. **App Store Connect**: Set up iOS app and in-app purchases
3. **Google Play Console**: Set up Android app and subscriptions
4. **API Keys**: Obtain production API keys from RevenueCat

## Step 1: RevenueCat Dashboard Setup

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Create a new project: "PeerLearningHub Production"
3. Add iOS app:
   - Bundle ID: ${this.config.bundleId}
   - App Store Connect integration
4. Add Android app:
   - Package Name: ${this.config.packageName}
   - Google Play Console integration

## Step 2: Product Configuration

### App Store Connect (iOS)
Create the following in-app purchases:

1. **Monthly Subscription**
   - Product ID: \`peer_learning_hub_monthly\`
   - Type: Auto-Renewable Subscription
   - Duration: 1 Month
   - Free Trial: 7 Days

2. **Yearly Subscription**
   - Product ID: \`peer_learning_hub_yearly\`
   - Type: Auto-Renewable Subscription
   - Duration: 1 Year
   - Free Trial: 7 Days

3. **Lifetime Purchase**
   - Product ID: \`peer_learning_hub_lifetime\`
   - Type: Non-Consumable

### Google Play Console (Android)
Create corresponding subscriptions and products with the same IDs.

## Step 3: RevenueCat Configuration

1. **Import Products**: Import products from App Store Connect and Google Play Console
2. **Create Entitlement**: Create "premium_membership" entitlement
3. **Link Products**: Link all products to the premium_membership entitlement
4. **Create Offerings**: Set up default and onboarding_special offerings

## Step 4: Environment Configuration

1. Copy API keys from RevenueCat Dashboard
2. Update production environment variables:

\`\`\`bash
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=rcat_your_production_ios_api_key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=rcat_your_production_android_api_key
\`\`\`

## Step 5: Testing

1. **Sandbox Testing**: Test with sandbox accounts
2. **TestFlight/Internal Testing**: Test with TestFlight (iOS) and Internal Testing (Android)
3. **Production Testing**: Test with real accounts before public release

## Step 6: Monitoring

1. **RevenueCat Dashboard**: Monitor subscriptions and revenue
2. **App Store Connect**: Monitor iOS subscription metrics
3. **Google Play Console**: Monitor Android subscription metrics
4. **Custom Analytics**: Implement custom tracking for business metrics

## Validation Checklist

- [ ] RevenueCat project created and configured
- [ ] iOS app added with correct Bundle ID
- [ ] Android app added with correct Package Name
- [ ] All products created in App Store Connect
- [ ] All products created in Google Play Console
- [ ] Products imported into RevenueCat
- [ ] Entitlement "premium_membership" created
- [ ] All products linked to entitlement
- [ ] Default offering configured
- [ ] API keys obtained and configured
- [ ] Sandbox testing completed
- [ ] TestFlight/Internal testing completed
- [ ] Production environment variables set
- [ ] Monitoring and analytics configured

## Support Resources

- [RevenueCat Documentation](https://docs.revenuecat.com)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [RevenueCat Community](https://community.revenuecat.com)

## Emergency Contacts

- RevenueCat Support: support@revenuecat.com
- Development Team: [Your team contact]
- Business Team: [Your business contact]
`;

    const instructionsPath = path.join(__dirname, '../docs/REVENUECAT_PRODUCTION_SETUP.md');
    fs.writeFileSync(instructionsPath, instructions);
    console.log(`  ✅ Setup instructions saved to ${instructionsPath}`);
  }

  generateTestScript() {
    console.log('🧪 Generating test script...');
    
    const testScript = `#!/usr/bin/env node

/**
 * RevenueCat Production Test Script
 * Tests RevenueCat integration in production environment
 */

const { RevenueCatConfig } = require('../config/revenuecat');

async function testRevenueCatProduction() {
  console.log('🧪 Testing RevenueCat Production Setup...');
  
  try {
    // Initialize RevenueCat
    await RevenueCatConfig.initialize();
    console.log('✅ RevenueCat initialized successfully');
    
    // Get offerings
    const offerings = await RevenueCatConfig.getOfferings();
    console.log(\`✅ Retrieved \${offerings.length} offerings\`);
    
    // Get customer info (anonymous)
    const customerInfo = await RevenueCatConfig.getCustomerInfo();
    console.log('✅ Retrieved customer info');
    console.log(\`  User ID: \${customerInfo.originalAppUserId}\`);
    console.log(\`  Active entitlements: \${Object.keys(customerInfo.entitlements.active).length}\`);
    
    // Check premium membership status
    const isPremium = await RevenueCatConfig.isPremiumMember();
    console.log(\`✅ Premium status: \${isPremium}\`);
    
    console.log('\\n🎉 All tests passed! RevenueCat is ready for production.');
    
  } catch (error) {
    console.error('❌ RevenueCat test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testRevenueCatProduction();
}

module.exports = testRevenueCatProduction;
`;

    const testScriptPath = path.join(__dirname, '../scripts/testProductionRevenueCat.js');
    fs.writeFileSync(testScriptPath, testScript);
    fs.chmodSync(testScriptPath, '755');
    console.log(`  ✅ Test script saved to ${testScriptPath}`);
  }

  async run() {
    try {
      console.log('🚀 Starting Production RevenueCat Setup...\n');

      if (!this.validateConfiguration()) {
        throw new Error('Configuration validation failed');
      }

      await this.validateProducts();
      await this.validateEntitlements();
      this.createProductionConfig();
      this.createProductionEnvTemplate();
      this.generateSetupInstructions();
      this.generateTestScript();

      console.log('\n✅ Production RevenueCat setup completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Follow the setup instructions in docs/REVENUECAT_PRODUCTION_SETUP.md');
      console.log('2. Configure products in App Store Connect and Google Play Console');
      console.log('3. Set up RevenueCat Dashboard with products and entitlements');
      console.log('4. Update production environment variables');
      console.log('5. Run production tests: npm run revenuecat:test-production');

    } catch (error) {
      console.error('\n❌ Production RevenueCat setup failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the setup if called directly
if (require.main === module) {
  const setup = new ProductionRevenueCatSetup();
  setup.run();
}

module.exports = ProductionRevenueCatSetup;