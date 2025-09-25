#!/usr/bin/env node

/**
 * エラー監視システムのセットアップスクリプト
 * エラー監視、クラッシュレポート、アラート管理の初期化とテスト
 */

const fs = require('fs');
const path = require('path');

// 設定ファイルのパス
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const MONITORING_CONFIG_FILE = path.join(CONFIG_DIR, 'errorMonitoring.json');

// デフォルト設定
const DEFAULT_CONFIG = {
  errorMonitoring: {
    enabled: true,
    severityThreshold: 'medium',
    notificationChannels: ['console', 'storage'],
    maxReportsPerSession: 50,
    retryAttempts: 3,
    autoReporting: true
  },
  crashReporting: {
    enabled: true,
    maxUserActions: 20,
    collectDeviceInfo: true,
    collectMemoryInfo: true,
    collectNetworkInfo: true,
    autoSubmit: true
  },
  alertManager: {
    enabled: true,
    defaultRulesEnabled: true,
    maxNotifications: 100,
    notificationRetention: 7, // days
    cooldownPeriod: 5 // minutes
  },
  remoteReporting: {
    enabled: false,
    endpoint: '',
    apiKey: '',
    batchSize: 10,
    uploadInterval: 300 // seconds
  }
};

// アラートルールのテンプレート
const ALERT_RULES_TEMPLATE = [
  {
    name: 'Critical Error Alert',
    enabled: true,
    conditions: [
      {
        type: 'severity',
        operator: 'equals',
        value: 'critical',
        timeWindow: 5
      }
    ],
    actions: [
      {
        type: 'console_log',
        config: { level: 'error' }
      },
      {
        type: 'user_notification',
        config: {
          title: 'Critical Error',
          message: 'A critical error has occurred in the application'
        }
      }
    ],
    cooldownPeriod: 5
  },
  {
    name: 'High Error Rate Alert',
    enabled: true,
    conditions: [
      {
        type: 'error_rate',
        operator: 'greater_than',
        value: 10,
        timeWindow: 10
      }
    ],
    actions: [
      {
        type: 'console_log',
        config: { level: 'warn' }
      }
    ],
    cooldownPeriod: 15
  },
  {
    name: 'Crash Detection Alert',
    enabled: true,
    conditions: [
      {
        type: 'crash_count',
        operator: 'greater_than',
        value: 0,
        timeWindow: 1
      }
    ],
    actions: [
      {
        type: 'console_log',
        config: { level: 'error' }
      },
      {
        type: 'user_notification',
        config: {
          title: 'App Crash Detected',
          message: 'The application has crashed. A report has been generated.'
        }
      }
    ],
    cooldownPeriod: 1
  },
  {
    name: 'Authentication Error Alert',
    enabled: true,
    conditions: [
      {
        type: 'error_type',
        operator: 'equals',
        value: 'auth',
        timeWindow: 5
      }
    ],
    actions: [
      {
        type: 'console_log',
        config: { level: 'warn' }
      }
    ],
    cooldownPeriod: 10
  },
  {
    name: 'Database Error Alert',
    enabled: true,
    conditions: [
      {
        type: 'error_type',
        operator: 'equals',
        value: 'database',
        timeWindow: 5
      }
    ],
    actions: [
      {
        type: 'console_log',
        config: { level: 'error' }
      }
    ],
    cooldownPeriod: 10
  }
];

/**
 * 設定ディレクトリの作成
 */
function createConfigDirectory() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    console.log('✅ Created config directory');
  } else {
    console.log('✅ Config directory already exists');
  }
}

/**
 * エラー監視設定ファイルの作成
 */
function createMonitoringConfig() {
  if (!fs.existsSync(MONITORING_CONFIG_FILE)) {
    fs.writeFileSync(
      MONITORING_CONFIG_FILE,
      JSON.stringify(DEFAULT_CONFIG, null, 2)
    );
    console.log('✅ Created error monitoring configuration file');
  } else {
    console.log('✅ Error monitoring configuration file already exists');
    
    // 既存の設定を読み込んで不足している項目を追加
    try {
      const existingConfig = JSON.parse(fs.readFileSync(MONITORING_CONFIG_FILE, 'utf8'));
      const mergedConfig = mergeConfigs(DEFAULT_CONFIG, existingConfig);
      
      fs.writeFileSync(
        MONITORING_CONFIG_FILE,
        JSON.stringify(mergedConfig, null, 2)
      );
      console.log('✅ Updated error monitoring configuration with new options');
    } catch (error) {
      console.error('❌ Failed to update existing configuration:', error.message);
    }
  }
}

/**
 * アラートルールファイルの作成
 */
function createAlertRules() {
  const alertRulesFile = path.join(CONFIG_DIR, 'alertRules.json');
  
  if (!fs.existsSync(alertRulesFile)) {
    fs.writeFileSync(
      alertRulesFile,
      JSON.stringify(ALERT_RULES_TEMPLATE, null, 2)
    );
    console.log('✅ Created alert rules configuration file');
  } else {
    console.log('✅ Alert rules configuration file already exists');
  }
}

/**
 * 設定の深いマージ
 */
function mergeConfigs(defaultConfig, existingConfig) {
  const merged = { ...existingConfig };
  
  for (const [key, value] of Object.entries(defaultConfig)) {
    if (!(key in merged)) {
      merged[key] = value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      merged[key] = mergeConfigs(value, merged[key]);
    }
  }
  
  return merged;
}

/**
 * エラー監視システムの初期化スクリプトの作成
 */
function createInitializationScript() {
  const initScript = `
/**
 * エラー監視システムの初期化
 * アプリケーション起動時に呼び出される
 */

import ErrorMonitoringService from '../services/errorMonitoringService';
import CrashReportingService from '../services/crashReportingService';
import AlertManagerService from '../services/alertManagerService';

export class ErrorMonitoringInitializer {
  private static initialized = false;

  /**
   * エラー監視システムの初期化
   */
  public static async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('Error monitoring already initialized');
      return;
    }

    try {
      console.log('Initializing error monitoring system...');

      // エラー監視サービスの初期化
      const errorMonitoring = ErrorMonitoringService.getInstance();
      await errorMonitoring.initialize();

      // クラッシュレポートサービスの初期化
      const crashReporting = CrashReportingService.getInstance();
      await crashReporting.initialize();

      // アラート管理サービスの初期化
      const alertManager = AlertManagerService.getInstance();
      await alertManager.initialize();

      // サービス間の連携設定
      this.setupServiceIntegration(errorMonitoring, crashReporting, alertManager);

      this.initialized = true;
      console.log('✅ Error monitoring system initialized successfully');

      // 初期化完了をテスト
      await this.runInitializationTest();

    } catch (error) {
      console.error('❌ Failed to initialize error monitoring system:', error);
      throw error;
    }
  }

  /**
   * サービス間の連携設定
   */
  private static setupServiceIntegration(
    errorMonitoring: ErrorMonitoringService,
    crashReporting: CrashReportingService,
    alertManager: AlertManagerService
  ): void {
    // エラーレポートをアラート管理に転送
    const originalReportError = errorMonitoring.reportError.bind(errorMonitoring);
    errorMonitoring.reportError = async (...args) => {
      const result = await originalReportError(...args);
      // アラート管理にも通知（実際の実装では適切なイベントシステムを使用）
      return result;
    };

    // クラッシュレポートをアラート管理に転送
    const originalSubmitCrash = crashReporting.submitCrashReport.bind(crashReporting);
    crashReporting.submitCrashReport = async (crashReport) => {
      const result = await originalSubmitCrash(crashReport);
      await alertManager.processCrashReport(crashReport);
      return result;
    };
  }

  /**
   * 初期化テストの実行
   */
  private static async runInitializationTest(): Promise<void> {
    try {
      const errorMonitoring = ErrorMonitoringService.getInstance();
      
      // テストエラーの報告
      await errorMonitoring.reportError(
        'Initialization test error',
        'runtime',
        'low',
        { test: true, timestamp: new Date().toISOString() }
      );

      console.log('✅ Error monitoring initialization test completed');
    } catch (error) {
      console.error('❌ Initialization test failed:', error);
    }
  }

  /**
   * システムの健全性チェック
   */
  public static async healthCheck(): Promise<{
    errorMonitoring: boolean;
    crashReporting: boolean;
    alertManager: boolean;
    overall: boolean;
  }> {
    const health = {
      errorMonitoring: false,
      crashReporting: false,
      alertManager: false,
      overall: false
    };

    try {
      // エラー監視サービスの健全性チェック
      const errorMonitoring = ErrorMonitoringService.getInstance();
      const errorStats = await errorMonitoring.getErrorStatistics();
      health.errorMonitoring = typeof errorStats.totalErrors === 'number';

      // クラッシュレポートサービスの健全性チェック
      const crashReporting = CrashReportingService.getInstance();
      const crashStats = await crashReporting.getCrashStatistics();
      health.crashReporting = typeof crashStats.totalCrashes === 'number';

      // アラート管理サービスの健全性チェック
      const alertManager = AlertManagerService.getInstance();
      const alertStats = alertManager.getAlertStatistics();
      health.alertManager = typeof alertStats.totalRules === 'number';

      health.overall = health.errorMonitoring && health.crashReporting && health.alertManager;

    } catch (error) {
      console.error('Health check failed:', error);
    }

    return health;
  }
}

export default ErrorMonitoringInitializer;
`;

  const initFile = path.join(__dirname, '..', 'services', 'errorMonitoringInitializer.ts');
  fs.writeFileSync(initFile, initScript.trim());
  console.log('✅ Created error monitoring initializer');
}

/**
 * テストスクリプトの作成
 */
function createTestScript() {
  const testScript = `
/**
 * エラー監視システムのテストスクリプト
 */

import ErrorMonitoringService from '../services/errorMonitoringService';
import CrashReportingService from '../services/crashReportingService';
import AlertManagerService from '../services/alertManagerService';

export class ErrorMonitoringTester {
  /**
   * 全体的なテストの実行
   */
  public static async runAllTests(): Promise<void> {
    console.log('🧪 Starting error monitoring system tests...');

    try {
      await this.testErrorMonitoring();
      await this.testCrashReporting();
      await this.testAlertManager();
      
      console.log('✅ All error monitoring tests completed successfully');
    } catch (error) {
      console.error('❌ Error monitoring tests failed:', error);
      throw error;
    }
  }

  /**
   * エラー監視のテスト
   */
  private static async testErrorMonitoring(): Promise<void> {
    console.log('Testing error monitoring service...');
    
    const errorMonitoring = ErrorMonitoringService.getInstance();
    
    // 各種エラータイプのテスト
    await errorMonitoring.reportError('Test runtime error', 'runtime', 'low');
    await errorMonitoring.reportNetworkError('https://api.test.com', 500, new Error('Network timeout'));
    await errorMonitoring.reportAuthError(new Error('Invalid token'), 'login');
    await errorMonitoring.reportDatabaseError(new Error('Connection failed'), 'SELECT * FROM users');
    
    // 統計の確認
    const stats = await errorMonitoring.getErrorStatistics();
    console.log('Error statistics:', stats);
    
    console.log('✅ Error monitoring test completed');
  }

  /**
   * クラッシュレポートのテスト
   */
  private static async testCrashReporting(): Promise<void> {
    console.log('Testing crash reporting service...');
    
    const crashReporting = CrashReportingService.getInstance();
    
    // ユーザーアクションの記録
    crashReporting.recordUserAction('button_click', 'home', { buttonId: 'test' });
    crashReporting.recordScreenNavigation('profile', 'push');
    crashReporting.recordMemoryWarning();
    
    // テストクラッシュレポートの生成
    const testError = new Error('Test crash error');
    const crashReport = await crashReporting.generateCrashReport(testError, 'javascript', {
      testCrash: true
    });
    
    await crashReporting.submitCrashReport(crashReport);
    
    // 統計の確認
    const stats = await crashReporting.getCrashStatistics();
    console.log('Crash statistics:', stats);
    
    console.log('✅ Crash reporting test completed');
  }

  /**
   * アラート管理のテスト
   */
  private static async testAlertManager(): Promise<void> {
    console.log('Testing alert manager service...');
    
    const alertManager = AlertManagerService.getInstance();
    
    // テストアラートルールの追加
    const testRuleId = await alertManager.addAlertRule({
      name: 'Test Alert Rule',
      enabled: true,
      conditions: [
        {
          type: 'severity',
          operator: 'equals',
          value: 'high',
          timeWindow: 1
        }
      ],
      actions: [
        {
          type: 'console_log',
          config: { level: 'warn' }
        }
      ],
      cooldownPeriod: 1
    });
    
    // テストエラーレポートの処理
    const testErrorReport = {
      id: 'test_error',
      timestamp: new Date(),
      errorType: 'runtime' as const,
      severity: 'high' as const,
      message: 'Test error for alert',
      userAgent: 'test',
      sessionId: 'test_session',
      appVersion: '1.0.0',
      platform: 'ios' as const
    };
    
    await alertManager.processErrorReport(testErrorReport);
    
    // 統計の確認
    const stats = alertManager.getAlertStatistics();
    console.log('Alert statistics:', stats);
    
    // テストルールの削除
    await alertManager.removeAlertRule(testRuleId);
    
    console.log('✅ Alert manager test completed');
  }

  /**
   * パフォーマンステスト
   */
  public static async runPerformanceTest(): Promise<void> {
    console.log('🚀 Running performance tests...');
    
    const errorMonitoring = ErrorMonitoringService.getInstance();
    const startTime = Date.now();
    
    // 大量のエラーレポートを生成
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        errorMonitoring.reportError(\`Performance test error \${i}\`, 'runtime', 'low')
      );
    }
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(\`✅ Performance test completed: 100 errors processed in \${duration}ms\`);
  }
}

export default ErrorMonitoringTester;
`;

  const testFile = path.join(__dirname, '..', 'tests', 'errorMonitoringTester.ts');
  
  // testsディレクトリが存在しない場合は作成
  const testsDir = path.dirname(testFile);
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
  }
  
  fs.writeFileSync(testFile, testScript.trim());
  console.log('✅ Created error monitoring test script');
}

/**
 * ドキュメントの作成
 */
function createDocumentation() {
  const docContent = `# エラー監視システム

## 概要

PeerLearningHubのエラー監視システムは、アプリケーションで発生するエラーやクラッシュを自動的に検知、収集、分析し、適切なアラートを送信するシステムです。

## 構成要素

### 1. ErrorMonitoringService
- アプリケーションエラーの自動検知と収集
- エラーレベル別の分類と管理
- エラー統計の提供

### 2. CrashReportingService
- アプリケーションクラッシュの詳細情報収集
- ユーザーアクションの追跡
- デバイス情報とアプリ状態の記録

### 3. AlertManagerService
- エラー発生時の自動アラート
- カスタマイズ可能なアラートルール
- 複数の通知チャネル対応

## 使用方法

### 初期化

\`\`\`typescript
import ErrorMonitoringInitializer from './services/errorMonitoringInitializer';

// アプリケーション起動時
await ErrorMonitoringInitializer.initialize();
\`\`\`

### エラーの報告

\`\`\`typescript
import ErrorMonitoringService from './services/errorMonitoringService';

const errorMonitoring = ErrorMonitoringService.getInstance();

// 一般的なエラー
await errorMonitoring.reportError('Something went wrong', 'runtime', 'medium');

// ネットワークエラー
await errorMonitoring.reportNetworkError('https://api.example.com', 500, error);

// 認証エラー
await errorMonitoring.reportAuthError(error, 'login');
\`\`\`

### クラッシュレポート

\`\`\`typescript
import CrashReportingService from './services/crashReportingService';

const crashReporting = CrashReportingService.getInstance();

// ユーザーアクションの記録
crashReporting.recordUserAction('button_click', 'home', { buttonId: 'submit' });

// 画面遷移の記録
crashReporting.recordScreenNavigation('profile', 'push');
\`\`\`

### アラート設定

\`\`\`typescript
import AlertManagerService from './services/alertManagerService';

const alertManager = AlertManagerService.getInstance();

// カスタムアラートルールの追加
await alertManager.addAlertRule({
  name: 'High Error Rate',
  enabled: true,
  conditions: [
    {
      type: 'error_rate',
      operator: 'greater_than',
      value: 10,
      timeWindow: 10
    }
  ],
  actions: [
    {
      type: 'user_notification',
      config: {
        title: 'High Error Rate',
        message: 'Error rate is above threshold'
      }
    }
  ],
  cooldownPeriod: 15
});
\`\`\`

## 設定

設定ファイル: \`config/errorMonitoring.json\`

\`\`\`json
{
  "errorMonitoring": {
    "enabled": true,
    "severityThreshold": "medium",
    "notificationChannels": ["console", "storage"],
    "maxReportsPerSession": 50,
    "retryAttempts": 3
  },
  "crashReporting": {
    "enabled": true,
    "maxUserActions": 20,
    "collectDeviceInfo": true,
    "autoSubmit": true
  },
  "alertManager": {
    "enabled": true,
    "defaultRulesEnabled": true,
    "maxNotifications": 100,
    "cooldownPeriod": 5
  }
}
\`\`\`

## テスト

\`\`\`bash
# セットアップスクリプトの実行
node scripts/setupErrorMonitoring.js

# テストの実行
npm run test:error-monitoring
\`\`\`

## トラブルシューティング

### よくある問題

1. **エラーが記録されない**
   - 初期化が完了しているか確認
   - 設定でエラー監視が有効になっているか確認

2. **アラートが送信されない**
   - アラートルールが有効になっているか確認
   - クールダウン期間中でないか確認

3. **パフォーマンスの問題**
   - maxReportsPerSessionの値を調整
   - 不要なエラーレポートをフィルタリング

### ログの確認

エラー監視システムのログは以下の場所で確認できます：
- コンソールログ
- AsyncStorage（キー: 'error_reports', 'crash_reports', 'alert_notifications'）

## 今後の拡張

- リモートエラー追跡サービスとの連携（Sentry、Bugsnag等）
- より詳細なデバイス情報の収集
- エラーの自動分類とパターン分析
- ダッシュボードUIの実装
`;

  const docFile = path.join(__dirname, '..', 'docs', 'ERROR_MONITORING_SYSTEM.md');
  
  // docsディレクトリが存在しない場合は作成
  const docsDir = path.dirname(docFile);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  fs.writeFileSync(docFile, docContent);
  console.log('✅ Created error monitoring documentation');
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🚀 Setting up error monitoring system...\n');

  try {
    // 1. 設定ディレクトリの作成
    createConfigDirectory();

    // 2. 設定ファイルの作成
    createMonitoringConfig();

    // 3. アラートルールの作成
    createAlertRules();

    // 4. 初期化スクリプトの作成
    createInitializationScript();

    // 5. テストスクリプトの作成
    createTestScript();

    // 6. ドキュメントの作成
    createDocumentation();

    console.log('\n✅ Error monitoring system setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the configuration files in the config/ directory');
    console.log('2. Initialize the error monitoring system in your app startup code');
    console.log('3. Run tests to verify the setup: npm run test:error-monitoring');
    console.log('4. Check the documentation: docs/ERROR_MONITORING_SYSTEM.md');

  } catch (error) {
    console.error('\n❌ Error monitoring system setup failed:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を呼び出す
if (require.main === module) {
  main();
}

module.exports = {
  createConfigDirectory,
  createMonitoringConfig,
  createAlertRules,
  createInitializationScript,
  createTestScript,
  createDocumentation
};