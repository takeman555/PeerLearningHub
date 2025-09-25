#!/usr/bin/env node

/**
 * App Asset Optimization Script
 * Optimizes app icons and splash screens for iOS and Android platforms
 */

const fs = require('fs');
const path = require('path');

// Asset specifications for different platforms
const ASSET_SPECS = {
  ios: {
    appIcon: {
      sizes: [
        { size: 1024, name: 'AppIcon-1024.png', description: 'App Store' },
        { size: 180, name: 'AppIcon-180.png', description: 'iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus, X, XS, XS Max, 11, 11 Pro, 11 Pro Max, 12, 12 Pro, 12 Pro Max' },
        { size: 167, name: 'AppIcon-167.png', description: 'iPad Pro' },
        { size: 152, name: 'AppIcon-152.png', description: 'iPad, iPad mini' },
        { size: 120, name: 'AppIcon-120.png', description: 'iPhone 6, 6s, 7, 8, X, XS, XS Max, 11, 11 Pro, 11 Pro Max, 12, 12 Pro, 12 Pro Max' },
        { size: 87, name: 'AppIcon-87.png', description: 'iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus Settings' },
        { size: 80, name: 'AppIcon-80.png', description: 'iPhone 6, 6s, 7, 8, X, XS, XS Max, 11, 11 Pro, 11 Pro Max, 12, 12 Pro, 12 Pro Max Spotlight' },
        { size: 76, name: 'AppIcon-76.png', description: 'iPad' },
        { size: 58, name: 'AppIcon-58.png', description: 'iPhone Settings' },
        { size: 40, name: 'AppIcon-40.png', description: 'iPad Spotlight' },
        { size: 29, name: 'AppIcon-29.png', description: 'iPad Settings' }
      ]
    },
    splash: {
      sizes: [
        { width: 1125, height: 2436, name: 'LaunchImage-1125x2436.png', description: 'iPhone X, XS, 11 Pro' },
        { width: 1242, height: 2688, name: 'LaunchImage-1242x2688.png', description: 'iPhone XS Max, 11 Pro Max' },
        { width: 828, height: 1792, name: 'LaunchImage-828x1792.png', description: 'iPhone XR, 11' },
        { width: 1242, height: 2208, name: 'LaunchImage-1242x2208.png', description: 'iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus' },
        { width: 750, height: 1334, name: 'LaunchImage-750x1334.png', description: 'iPhone 6, 6s, 7, 8' },
        { width: 1536, height: 2048, name: 'LaunchImage-1536x2048.png', description: 'iPad' },
        { width: 2048, height: 2732, name: 'LaunchImage-2048x2732.png', description: 'iPad Pro 12.9"' }
      ]
    }
  },
  android: {
    appIcon: {
      sizes: [
        { size: 512, name: 'ic_launcher-512.png', description: 'Google Play Store' },
        { size: 192, name: 'ic_launcher-xxxhdpi.png', description: 'XXXHDPI (4.0x)' },
        { size: 144, name: 'ic_launcher-xxhdpi.png', description: 'XXHDPI (3.0x)' },
        { size: 96, name: 'ic_launcher-xhdpi.png', description: 'XHDPI (2.0x)' },
        { size: 72, name: 'ic_launcher-hdpi.png', description: 'HDPI (1.5x)' },
        { size: 48, name: 'ic_launcher-mdpi.png', description: 'MDPI (1.0x)' }
      ]
    },
    adaptiveIcon: {
      foreground: [
        { size: 432, name: 'ic_launcher_foreground-xxxhdpi.png', description: 'XXXHDPI (4.0x)' },
        { size: 324, name: 'ic_launcher_foreground-xxhdpi.png', description: 'XXHDPI (3.0x)' },
        { size: 216, name: 'ic_launcher_foreground-xhdpi.png', description: 'XHDPI (2.0x)' },
        { size: 162, name: 'ic_launcher_foreground-hdpi.png', description: 'HDPI (1.5x)' },
        { size: 108, name: 'ic_launcher_foreground-mdpi.png', description: 'MDPI (1.0x)' }
      ],
      background: [
        { size: 432, name: 'ic_launcher_background-xxxhdpi.png', description: 'XXXHDPI (4.0x)' },
        { size: 324, name: 'ic_launcher_background-xxhdpi.png', description: 'XXHDPI (3.0x)' },
        { size: 216, name: 'ic_launcher_background-xhdpi.png', description: 'XHDPI (2.0x)' },
        { size: 162, name: 'ic_launcher_background-hdpi.png', description: 'HDPI (1.5x)' },
        { size: 108, name: 'ic_launcher_background-mdpi.png', description: 'MDPI (1.0x)' }
      ]
    }
  }
};

// Screenshot specifications for app stores
const SCREENSHOT_SPECS = {
  ios: [
    { width: 1290, height: 2796, name: 'iPhone-6.7-inch', description: 'iPhone 14 Pro Max, 13 Pro Max, 12 Pro Max' },
    { width: 1242, height: 2688, name: 'iPhone-6.5-inch', description: 'iPhone XS Max, 11 Pro Max' },
    { width: 1242, height: 2208, name: 'iPhone-5.5-inch', description: 'iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus' },
    { width: 2048, height: 2732, name: 'iPad-12.9-inch', description: 'iPad Pro 12.9-inch' },
    { width: 2048, height: 2732, name: 'iPad-12.9-inch-2nd-gen', description: 'iPad Pro 12.9-inch (2nd generation)' }
  ],
  android: [
    { width: 1080, height: 1920, name: 'Phone-Portrait', description: 'Phone Portrait' },
    { width: 1920, height: 1080, name: 'Phone-Landscape', description: 'Phone Landscape' },
    { width: 1200, height: 1920, name: '7-inch-Tablet', description: '7-inch Tablet' },
    { width: 1600, height: 2560, name: '10-inch-Tablet', description: '10-inch Tablet' }
  ]
};

class AssetOptimizer {
  constructor() {
    this.assetsDir = path.join(__dirname, '..', 'assets');
    this.outputDir = path.join(__dirname, '..', 'assets', 'optimized');
    this.sourceIcon = path.join(this.assetsDir, 'PLH_logo.png');
    this.sourceSplash = path.join(this.assetsDir, 'splash-icon.png');
  }

  async initialize() {
    // Create output directories
    await this.createDirectories();
    
    console.log('🚀 Starting asset optimization...');
    console.log(`📁 Source directory: ${this.assetsDir}`);
    console.log(`📁 Output directory: ${this.outputDir}`);
  }

  async createDirectories() {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'ios', 'icons'),
      path.join(this.outputDir, 'ios', 'splash'),
      path.join(this.outputDir, 'android', 'icons'),
      path.join(this.outputDir, 'android', 'adaptive'),
      path.join(this.outputDir, 'screenshots', 'ios'),
      path.join(this.outputDir, 'screenshots', 'android')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  generateAssetInstructions() {
    console.log('\n📋 Asset Optimization Instructions');
    console.log('=====================================');
    
    console.log('\n🎨 App Icons Required:');
    console.log('iOS App Icons:');
    ASSET_SPECS.ios.appIcon.sizes.forEach(spec => {
      console.log(`  • ${spec.size}x${spec.size}px - ${spec.name} (${spec.description})`);
    });
    
    console.log('\nAndroid App Icons:');
    ASSET_SPECS.android.appIcon.sizes.forEach(spec => {
      console.log(`  • ${spec.size}x${spec.size}px - ${spec.name} (${spec.description})`);
    });

    console.log('\n🖼️ Screenshots Required:');
    console.log('iOS Screenshots:');
    SCREENSHOT_SPECS.ios.forEach(spec => {
      console.log(`  • ${spec.width}x${spec.height}px - ${spec.name} (${spec.description})`);
    });
    
    console.log('Android Screenshots:');
    SCREENSHOT_SPECS.android.forEach(spec => {
      console.log(`  • ${spec.width}x${spec.height}px - ${spec.name} (${spec.description})`);
    });

    console.log('\n⚠️  Manual Steps Required:');
    console.log('1. Use image editing software (Photoshop, GIMP, etc.) to resize source images');
    console.log('2. Ensure iOS icons have NO transparency');
    console.log('3. Ensure Android icons maintain transparency where needed');
    console.log('4. Create adaptive icon foreground and background layers for Android');
    console.log('5. Generate screenshots from actual app running on devices/simulators');
    console.log('6. Optimize all images for file size while maintaining quality');
  }

  generateAppStoreAssetChecklist() {
    const checklist = {
      ios: {
        required: [
          'App Icon (1024x1024px)',
          'iPhone 6.7" Screenshots (1290x2796px) - 3-10 images',
          'iPhone 6.5" Screenshots (1242x2688px) - 3-10 images', 
          'iPhone 5.5" Screenshots (1242x2208px) - 3-10 images',
          'iPad Pro 12.9" Screenshots (2048x2732px) - 3-10 images'
        ],
        optional: [
          'App Preview Videos',
          'Apple Watch Screenshots',
          'Apple TV Screenshots'
        ]
      },
      android: {
        required: [
          'High-res Icon (512x512px)',
          'Feature Graphic (1024x500px)',
          'Phone Screenshots (320-3840px) - 2-8 images',
          '7-inch Tablet Screenshots - 1-8 images',
          '10-inch Tablet Screenshots - 1-8 images'
        ],
        optional: [
          'Promo Video',
          'TV Banner (1280x720px)',
          'Wear OS Screenshots'
        ]
      }
    };

    console.log('\n✅ App Store Asset Checklist');
    console.log('============================');
    
    console.log('\n📱 iOS App Store:');
    console.log('Required:');
    checklist.ios.required.forEach(item => console.log(`  ☐ ${item}`));
    console.log('Optional:');
    checklist.ios.optional.forEach(item => console.log(`  ☐ ${item}`));
    
    console.log('\n🤖 Google Play Store:');
    console.log('Required:');
    checklist.android.required.forEach(item => console.log(`  ☐ ${item}`));
    console.log('Optional:');
    checklist.android.optional.forEach(item => console.log(`  ☐ ${item}`));
  }

  generateScreenshotGuidelines() {
    console.log('\n📸 Screenshot Guidelines');
    console.log('========================');
    
    const guidelines = [
      '1. Use actual app screenshots, not mockups or concept art',
      '2. Show the app in use with realistic content',
      '3. Highlight key features and user interface',
      '4. Use high-quality, crisp images',
      '5. Avoid excessive text overlays',
      '6. Maintain consistent branding and colors',
      '7. Show diverse and inclusive content',
      '8. Localize screenshots for different markets',
      '9. Test screenshots on actual devices',
      '10. Update screenshots when UI changes significantly'
    ];

    guidelines.forEach(guideline => console.log(`  ${guideline}`));

    console.log('\n🎯 Recommended Screenshot Sequence:');
    const sequence = [
      'Welcome/Onboarding - First impression',
      'Main Dashboard - Core functionality',
      'Community Features - Social aspects',
      'Learning Resources - Content discovery',
      'Peer Sessions - Collaboration features',
      'Progress Tracking - Achievement visualization',
      'Settings/Profile - Personalization options'
    ];

    sequence.forEach((item, index) => console.log(`  ${index + 1}. ${item}`));
  }

  async run() {
    await this.initialize();
    this.generateAssetInstructions();
    this.generateAppStoreAssetChecklist();
    this.generateScreenshotGuidelines();
    
    console.log('\n🎉 Asset optimization guide generated!');
    console.log('📁 Check the assets/optimized directory for organized folders');
    console.log('🔧 Use image editing tools to create the required assets');
    console.log('📱 Test all assets on actual devices before submission');
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new AssetOptimizer();
  optimizer.run().catch(console.error);
}

module.exports = AssetOptimizer;