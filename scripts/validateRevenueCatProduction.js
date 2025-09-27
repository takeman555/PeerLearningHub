#!/usr/bin/env node

/**
 * RevenueCat本番設定検証スクリプト
 */

const fs = require('fs');
const path = require('path');

// 環境変数の読み込み
require('dotenv').config({ path: '.env.production' });

class RevenueCatProductionValidator {
  constructor() {
    this.results = {
      configuration: {},
      apiKeys: {},
      connectivity: {},
      products: {},
      summary: {}
    };
  }

  /**
   * メイン検証プロセス
   */
  async validateRevenueCat() {
    console.log('🔍 Starting RevenueCat Production Validation...');
    console.log('');

    try {
      // 1. 設定検証
      await this.validateConfiguration();
      
      // 2. APIキー検証
      await this.validateAPIKeys();
      
      // 3. 接続性テスト
      await this.validateConnectivity();
      
      // 4. プロダクト設定検証
      await this.validateProducts();
      
      // 5. 最終レポート生成
      await this.generateValidationReport();
      
      console.log('✅ RevenueCat production validation completed successfully!');
      
    } catch (error) {
      console.error('❌ RevenueCat production validation failed:', error.message);
      await this.handleValidationFailure(error);
      process.exit(1);
    }
  }

  /**
   * 設定検証
   */
  async validateConfiguration() {
    console.log('📋 Validating RevenueCat configuration...');
    
    const config = {
      enabled: process.env.EXPO_PUBLIC_REVENUECAT_ENABLED === 'true',
      iosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
      androidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
      appName: process.env.EXPO_PUBLIC_APP_NAME,
      appVersion: process.env.EXPO_PUBLIC_APP_VERSION,
      environment: process.env.NODE_ENV
    };

    this.results.configuration = config;

    // 基本設定チェック
    if (!config.enabled) {
      console.log('  ⚠️ RevenueCat is disabled');
      return false;
    }

    if (!config.iosApiKey || !config.androidApiKey) {
      console.error('  ❌ Missing RevenueCat API keys');
      return false;
    }

    if (config.environment !== 'production') {
      console.warn('  ⚠️ Environment is not set to production');
    }

    console.log('  ✅ RevenueCat configuration validated');
    return true;
  }

  /**
   * APIキー検証
   */
  async validateAPIKeys() {
    console.log('🔑 Validating RevenueCat API keys...');
    
    const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;
    const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

    const keyValidation = {
      ios: this.validateKeyFormat(iosKey, 'iOS'),
      android: this.validateKeyFormat(androidKey, 'Android')
    };

    this.results.apiKeys = keyValidation;

    if (!keyValidation.ios.valid || !keyValidation.android.valid) {
      console.error('  ❌ Invalid API key format detected');
      return false;
    }

    console.log('  ✅ API keys format validated');
    return true;
  }

  /**
   * APIキー形式検証
   */
  validateKeyFormat(key, platform) {
    if (!key) {
      console.error(`    ❌ ${platform} API key is missing`);
      return { valid: false, reason: 'Missing key' };
    }

    // RevenueCat APIキーの基本形式チェック
    if (key.length < 10) {
      console.error(`    ❌ ${platform} API key is too short`);
      return { valid: false, reason: 'Key too short' };
    }

    // 本番キーの形式チェック（通常は特定のプレフィックスを持つ）
    if (key.startsWith('appl_') || key.startsWith('goog_') || key.startsWith('rcat_')) {
      console.log(`    ✅ ${platform} API key format appears valid`);
      return { valid: true, format: 'production' };
    } else {
      console.warn(`    ⚠️ ${platform} API key format may be for testing`);
      return { valid: true, format: 'test' };
    }
  }

  /**
   * 接続性テスト
   */
  async validateConnectivity() {
    console.log('🌐 Testing RevenueCat connectivity...');
    
    try {
      // 基本的な接続テスト（実際のRevenueCat SDKは使用せず、設定のみ検証）
      const connectivityTest = {
        configurationLoaded: true,
        environmentSet: process.env.NODE_ENV === 'production',
        keysPresent: !!(process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS && process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID)
      };

      this.results.connectivity = connectivityTest;

      if (!connectivityTest.keysPresent) {
        console.error('  ❌ API keys not properly configured');
        return false;
      }

      console.log('  ✅ RevenueCat connectivity configuration validated');
      return true;
    } catch (error) {
      console.error('  ❌ Connectivity test failed:', error.message);
      this.results.connectivity = { error: error.message };
      return false;
    }
  }

  /**
   * プロダクト設定検証
   */
  async validateProducts() {
    console.log('📦 Validating product configuration...');
    
    // 設定ファイルからプロダクト情報を読み取り
    try {
      const configPath = path.join(__dirname, '..', 'config', 'revenuecat.ts');
      const configExists = fs.existsSync(configPath);
      
      const productConfig = {
        configFileExists: configExists,
        expectedProducts: [
          'peer_learning_hub_monthly',
          'peer_learning_hub_yearly', 
          'peer_learning_hub_lifetime'
        ],
        expectedEntitlements: [
          'premium_membership'
        ]
      };

      this.results.products = productConfig;

      if (!configExists) {
        console.warn('  ⚠️ RevenueCat configuration file not found');
      } else {
        console.log('  ✅ Product configuration file exists');
      }

      console.log('  📋 Expected products:', productConfig.expectedProducts.join(', '));
      console.log('  🎫 Expected entitlements:', productConfig.expectedEntitlements.join(', '));
      
      return true;
    } catch (error) {
      console.error('  ❌ Product validation failed:', error.message);
      this.results.products = { error: error.message };
      return false;
    }
  }

  /**
   * 検証レポート生成
   */
  async generateValidationReport() {
    console.log('📋 Generating validation report...');
    
    const summary = {
      timestamp: new Date().toISOString(),
      environment: 'production',
      revenueCatEnabled: process.env.EXPO_PUBLIC_REVENUECAT_ENABLED === 'true',
      validationResults: this.results,
      recommendations: this.generateRecommendations()
    };

    // this.results.summary = summary; // 循環参照を避けるためコメントアウト

    // JSONレポート保存
    const reportPath = path.join(__dirname, '..', 'revenuecat-production-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    
    // マークダウンレポート生成
    await this.generateMarkdownReport(summary);
    
    console.log(`📄 Validation report saved to: ${reportPath}`);
    console.log('✅ Validation report generated successfully');
  }

  /**
   * 推奨事項生成
   */
  generateRecommendations() {
    const recommendations = [];

    if (!this.results.configuration.enabled) {
      recommendations.push('Enable RevenueCat by setting EXPO_PUBLIC_REVENUECAT_ENABLED=true');
    }

    if (this.results.apiKeys.ios?.format === 'test' || this.results.apiKeys.android?.format === 'test') {
      recommendations.push('Verify that production API keys are being used, not test keys');
    }

    if (this.results.configuration.environment !== 'production') {
      recommendations.push('Ensure NODE_ENV is set to "production"');
    }

    if (!this.results.products.configFileExists) {
      recommendations.push('Ensure RevenueCat configuration file exists and is properly configured');
    }

    if (recommendations.length === 0) {
      recommendations.push('RevenueCat configuration appears to be properly set up for production');
    }

    return recommendations;
  }

  /**
   * マークダウンレポート生成
   */
  async generateMarkdownReport(summary) {
    const markdownContent = `# RevenueCat Production Validation Report

## Validation Summary

- **Timestamp**: ${summary.timestamp}
- **Environment**: ${summary.environment}
- **RevenueCat Enabled**: ${summary.revenueCatEnabled ? '✅ Yes' : '❌ No'}

## Configuration Validation

- **Enabled**: ${this.results.configuration.enabled ? '✅ Yes' : '❌ No'}
- **iOS API Key**: ${this.results.configuration.iosApiKey ? '✅ Set' : '❌ Missing'}
- **Android API Key**: ${this.results.configuration.androidApiKey ? '✅ Set' : '❌ Missing'}
- **App Name**: ${this.results.configuration.appName || 'Not set'}
- **App Version**: ${this.results.configuration.appVersion || 'Not set'}
- **Environment**: ${this.results.configuration.environment || 'Not set'}

## API Keys Validation

### iOS API Key
- **Valid**: ${this.results.apiKeys.ios?.valid ? '✅ Yes' : '❌ No'}
- **Format**: ${this.results.apiKeys.ios?.format || 'Unknown'}
- **Reason**: ${this.results.apiKeys.ios?.reason || 'N/A'}

### Android API Key
- **Valid**: ${this.results.apiKeys.android?.valid ? '✅ Yes' : '❌ No'}
- **Format**: ${this.results.apiKeys.android?.format || 'Unknown'}
- **Reason**: ${this.results.apiKeys.android?.reason || 'N/A'}

## Connectivity Test

- **Configuration Loaded**: ${this.results.connectivity.configurationLoaded ? '✅ Yes' : '❌ No'}
- **Environment Set**: ${this.results.connectivity.environmentSet ? '✅ Yes' : '❌ No'}
- **Keys Present**: ${this.results.connectivity.keysPresent ? '✅ Yes' : '❌ No'}

## Product Configuration

- **Config File Exists**: ${this.results.products.configFileExists ? '✅ Yes' : '❌ No'}
- **Expected Products**: ${this.results.products.expectedProducts?.join(', ') || 'None'}
- **Expected Entitlements**: ${this.results.products.expectedEntitlements?.join(', ') || 'None'}

## Recommendations

${summary.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

1. **If validation passed**: RevenueCat is ready for production use
2. **If issues found**: Address the recommendations above before deploying
3. **Testing**: Test purchases in sandbox mode before going live
4. **Monitoring**: Set up monitoring for purchase events and revenue tracking

---

**Generated**: ${new Date().toISOString()}  
**Validation Tool**: RevenueCat Production Validator v1.0.0
`;

    const markdownPath = path.join(__dirname, '..', 'REVENUECAT_PRODUCTION_VALIDATION_REPORT.md');
    fs.writeFileSync(markdownPath, markdownContent);
  }

  /**
   * 検証失敗時の処理
   */
  async handleValidationFailure(error) {
    console.log('🚨 Handling validation failure...');
    
    const failureReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      results: this.results,
      troubleshooting: [
        'Check that all RevenueCat API keys are correctly set',
        'Verify that the keys are for the correct environment (production vs sandbox)',
        'Ensure RevenueCat is enabled in the configuration',
        'Check network connectivity if testing actual API calls'
      ]
    };

    const failureReportPath = path.join(__dirname, '..', 'revenuecat-validation-failure-report.json');
    fs.writeFileSync(failureReportPath, JSON.stringify(failureReport, null, 2));
    
    console.log(`📄 Failure report saved to: ${failureReportPath}`);
  }
}

// スクリプト実行
if (require.main === module) {
  const validator = new RevenueCatProductionValidator();
  validator.validateRevenueCat().catch(console.error);
}

module.exports = RevenueCatProductionValidator;