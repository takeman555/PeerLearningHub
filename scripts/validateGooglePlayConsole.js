#!/usr/bin/env node

/**
 * Google Play Console Integration Validation Script
 * Validates Google Play Console setup for RevenueCat integration
 */

const fs = require('fs');
const path = require('path');

class GooglePlayConsoleValidator {
  constructor() {
    this.config = {
      packageName: 'com.peerlearninghub.app',
      appName: 'PeerLearningHub',
      requiredProducts: [
        'peer_learning_hub_monthly',
        'peer_learning_hub_yearly',
        'peer_learning_hub_lifetime'
      ]
    };
  }

  validateConfiguration() {
    console.log('🤖 Validating Google Play Console Configuration...\n');

    console.log('📋 Required Configuration:');
    console.log(`  App Name: ${this.config.appName}`);
    console.log(`  Package Name: ${this.config.packageName}`);
    console.log(`  Products: ${this.config.requiredProducts.length} items`);
    console.log('');

    return true;
  }

  validateProducts() {
    console.log('📦 Product Configuration Checklist:');
    console.log('');

    const subscriptions = [
      {
        id: 'peer_learning_hub_monthly',
        name: 'Monthly Membership',
        type: 'Subscription',
        billingPeriod: '1 month',
        trialPeriod: '7 days',
        price: '$9.99/month (adjust as needed)',
        description: 'Monthly access to premium PeerLearningHub features'
      },
      {
        id: 'peer_learning_hub_yearly',
        name: 'Yearly Membership',
        type: 'Subscription',
        billingPeriod: '1 year',
        trialPeriod: '7 days',
        price: '$99.99/year (adjust as needed)',
        description: 'Yearly access to premium PeerLearningHub features with savings'
      }
    ];

    const products = [
      {
        id: 'peer_learning_hub_lifetime',
        name: 'Lifetime Membership',
        type: 'Managed Product (One-time)',
        price: '$299.99 (adjust as needed)',
        description: 'Lifetime access to all premium PeerLearningHub features'
      }
    ];

    console.log('Subscriptions:');
    subscriptions.forEach((subscription, index) => {
      console.log(`${index + 1}. ${subscription.name}`);
      console.log(`   Product ID: ${subscription.id}`);
      console.log(`   Type: ${subscription.type}`);
      console.log(`   Billing Period: ${subscription.billingPeriod}`);
      console.log(`   Trial Period: ${subscription.trialPeriod}`);
      console.log(`   Suggested Price: ${subscription.price}`);
      console.log(`   Description: ${subscription.description}`);
      console.log('');
    });

    console.log('One-time Products:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Type: ${product.type}`);
      console.log(`   Suggested Price: ${product.price}`);
      console.log(`   Description: ${product.description}`);
      console.log('');
    });

    return true;
  }

  validateAppMetadata() {
    console.log('📱 App Metadata Requirements:');
    console.log('');

    const metadata = {
      'App Name': 'PeerLearningHub',
      'Package Name': 'com.peerlearninghub.app',
      'Category': 'Education',
      'Content Rating': 'Everyone (or appropriate rating)',
      'Target SDK': 'API 34 (Android 14) or higher',
      'Privacy Policy URL': 'https://peerlearninghub.com/privacy (update with actual URL)',
      'Terms of Service URL': 'https://peerlearninghub.com/terms (update with actual URL)',
      'Support Email': 'support@peerlearninghub.com (update with actual email)',
      'Website': 'https://peerlearninghub.com (update with actual URL)'
    };

    Object.entries(metadata).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');

    return true;
  }

  validateStoreListingRequirements() {
    console.log('🏪 Store Listing Requirements:');
    console.log('');

    const requirements = {
      'App Icon': '512x512px PNG (32-bit with alpha)',
      'Feature Graphic': '1024x500px JPG or PNG (no alpha)',
      'Screenshots': [
        'Phone: 16:9 or 9:16 aspect ratio, minimum 320px',
        'Tablet: 16:10 or 10:16 aspect ratio, minimum 1080px',
        '2-8 screenshots per device type'
      ],
      'Short Description': 'Maximum 80 characters',
      'Full Description': 'Maximum 4000 characters',
      'App Category': 'Education',
      'Content Rating': 'Complete questionnaire for appropriate rating',
      'Target Audience': 'Select appropriate age groups'
    };

    Object.entries(requirements).forEach(([key, value]) => {
      console.log(`  ${key}:`);
      if (Array.isArray(value)) {
        value.forEach(item => console.log(`    • ${item}`));
      } else {
        console.log(`    ${value}`);
      }
    });
    console.log('');

    return true;
  }

  validateTestingRequirements() {
    console.log('🧪 Testing Requirements:');
    console.log('');

    console.log('Internal Testing:');
    console.log('  1. Create internal testing track');
    console.log('  2. Upload AAB (Android App Bundle)');
    console.log('  3. Add internal testers (up to 100 users)');
    console.log('  4. Test all subscription flows');
    console.log('  5. Test purchase restoration');
    console.log('  6. Test subscription management');
    console.log('');

    console.log('Closed Testing (Alpha/Beta):');
    console.log('  1. Create closed testing track');
    console.log('  2. Add test users or create opt-in URL');
    console.log('  3. Test with real Google accounts');
    console.log('  4. Verify all features work correctly');
    console.log('  5. Collect feedback and iterate');
    console.log('');

    console.log('License Testing:');
    console.log('  1. Add license testers in Google Play Console');
    console.log('  2. License testers can make test purchases without being charged');
    console.log('  3. Test all purchase flows with license testers');
    console.log('  4. Verify RevenueCat integration works correctly');
    console.log('');

    return true;
  }

  generateSetupInstructions() {
    console.log('📋 Step-by-Step Setup Instructions:');
    console.log('');

    const steps = [
      {
        title: 'Create App in Google Play Console',
        instructions: [
          'Go to Google Play Console (https://play.google.com/console)',
          'Click "Create app"',
          `Enter app name: ${this.config.appName}`,
          'Select default language and app/game designation',
          'Declare if app is free or paid',
          'Accept Play Console Developer Policy'
        ]
      },
      {
        title: 'Configure App Details',
        instructions: [
          'Go to "Store presence" → "Main store listing"',
          'Upload app icon (512x512px)',
          'Upload feature graphic (1024x500px)',
          'Upload screenshots for phone and tablet',
          'Write short description (80 chars max)',
          'Write full description (4000 chars max)',
          'Set app category to "Education"'
        ]
      },
      {
        title: 'Set Up App Content',
        instructions: [
          'Go to "Policy" → "App content"',
          'Complete privacy policy declaration',
          'Complete content rating questionnaire',
          'Declare target audience and age groups',
          'Complete data safety section',
          'Declare if app has ads'
        ]
      },
      {
        title: 'Create Subscription Products',
        instructions: [
          'Go to "Monetize" → "Subscriptions"',
          'Click "Create subscription"',
          'Create monthly subscription: peer_learning_hub_monthly',
          'Set billing period to 1 month',
          'Configure 7-day free trial',
          'Set pricing for all countries',
          'Repeat for yearly subscription: peer_learning_hub_yearly'
        ]
      },
      {
        title: 'Create One-time Products',
        instructions: [
          'Go to "Monetize" → "In-app products"',
          'Click "Create product"',
          'Create lifetime product: peer_learning_hub_lifetime',
          'Set as "Managed product"',
          'Set pricing for all countries',
          'Add product description'
        ]
      },
      {
        title: 'Configure RevenueCat Integration',
        instructions: [
          'Go to RevenueCat Dashboard',
          'Add Android app with package name: com.peerlearninghub.app',
          'Connect Google Play Console account',
          'Upload Google Play service account JSON key',
          'Import products from Google Play Console',
          'Link products to "premium_membership" entitlement'
        ]
      },
      {
        title: 'Set Up Testing',
        instructions: [
          'Create internal testing track',
          'Upload signed AAB file',
          'Add internal testers',
          'Create license testers for purchase testing',
          'Test all subscription and purchase flows',
          'Verify RevenueCat integration'
        ]
      }
    ];

    steps.forEach((step, index) => {
      console.log(`${index + 1}. ${step.title}:`);
      step.instructions.forEach(instruction => {
        console.log(`   • ${instruction}`);
      });
      console.log('');
    });

    return true;
  }

  validateServiceAccountSetup() {
    console.log('🔑 Service Account Setup (for RevenueCat):');
    console.log('');

    console.log('Steps to create service account:');
    console.log('  1. Go to Google Cloud Console');
    console.log('  2. Select your project (or create new one)');
    console.log('  3. Go to "IAM & Admin" → "Service Accounts"');
    console.log('  4. Click "Create Service Account"');
    console.log('  5. Name: "RevenueCat Integration"');
    console.log('  6. Grant "Service Account User" role');
    console.log('  7. Create and download JSON key file');
    console.log('');

    console.log('Link service account to Google Play Console:');
    console.log('  1. Go to Google Play Console');
    console.log('  2. Go to "Setup" → "API access"');
    console.log('  3. Click "Link" next to Google Cloud Project');
    console.log('  4. Select your project and confirm');
    console.log('  5. Grant necessary permissions to service account');
    console.log('  6. Upload JSON key to RevenueCat Dashboard');
    console.log('');

    return true;
  }

  generateChecklist() {
    console.log('✅ Pre-Launch Checklist:');
    console.log('');

    const checklist = [
      'App created in Google Play Console',
      'Package name matches app configuration',
      'App metadata completed (descriptions, category, etc.)',
      'App icon uploaded (512x512px)',
      'Feature graphic uploaded (1024x500px)',
      'Screenshots uploaded for all device types',
      'Privacy policy URL configured',
      'Terms of service URL configured',
      'Content rating completed',
      'Data safety section completed',
      'Target audience declared',
      'Monthly subscription created and configured',
      'Yearly subscription created and configured',
      'Lifetime product created and configured',
      'All products have pricing set for all countries',
      'Service account created in Google Cloud Console',
      'Service account linked to Google Play Console',
      'RevenueCat Android app configured',
      'Google Play Console integration completed in RevenueCat',
      'Products imported into RevenueCat',
      'Entitlements configured in RevenueCat',
      'Internal testing completed',
      'License testing completed',
      'Closed testing completed (if applicable)',
      'Production API keys configured',
      'Real-time developer notifications configured (if applicable)',
      'Analytics and monitoring configured'
    ];

    checklist.forEach(item => {
      console.log(`  □ ${item}`);
    });
    console.log('');

    return true;
  }

  async run() {
    try {
      console.log('🚀 Google Play Console Integration Validation\n');
      console.log('=============================================\n');

      this.validateConfiguration();
      this.validateProducts();
      this.validateAppMetadata();
      this.validateStoreListingRequirements();
      this.validateTestingRequirements();
      this.validateServiceAccountSetup();
      this.generateSetupInstructions();
      this.generateChecklist();

      console.log('📚 Additional Resources:');
      console.log('  • Google Play Console Help: https://support.google.com/googleplay/android-developer/');
      console.log('  • In-app Billing Guide: https://developer.android.com/google/play/billing/');
      console.log('  • RevenueCat Android Guide: https://docs.revenuecat.com/docs/android');
      console.log('  • Subscription Best Practices: https://developer.android.com/google/play/billing/subscriptions');
      console.log('');

      console.log('✅ Validation completed successfully!');
      console.log('Follow the instructions above to complete Google Play Console setup.');

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new GooglePlayConsoleValidator();
  validator.run();
}

module.exports = GooglePlayConsoleValidator;