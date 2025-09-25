#!/usr/bin/env node

/**
 * パフォーマンス監視システムセットアップスクリプト
 * パフォーマンス監視の初期化と設定を行う
 */

const fs = require('fs').promises;
const path = require('path');

// 設定ファイルのパス
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const PERFORMANCE_CONFIG_FILE = path.join(CONFIG_DIR, 'performanceMonitoring.json');

// デフォルトのパフォーマンス監視設定
const DEFAULT_PERFORMANCE_CONFIG = {
  enabled: true,
  collectSystemMetrics: true,
  collectNetworkMetrics: true,
  collectUserExperienceMetrics: true,
  monitoringInterval: 30000, // 30秒
  alertThresholds: {
    responseTime: {
      screenTransition: 1000, // 1秒
      apiCall: 3000, // 3秒
      databaseQuery: 2000, // 2秒
      renderTime: 500, // 0.5秒
    },
    systemMetrics: {
      memoryUsage: 150, // 150MB
      cpuUsage: 80, // 80%
    },
    networkMetrics: {
      latency: 1000, // 1秒
      errorRate: 5, // 5%
    },
    userExperience: {
      appStartTime: 3000, // 3秒
      timeToInteractive: 5000, // 5秒
      frameDropRate: 10, // 10%
    },
  },
  storage: {
    maxMetricsCount: 500,
    maxAlertsCount: 100,
    retentionDays: 7,
  },
  reporting: {
    enableConsoleLogging: true,
    enableLocalStorage: true,
    enableRemoteReporting: false,
    reportingInterval: 300000, // 5分
  },
};

// 環境変数から設定を読み込む関数
function loadEnvironmentConfig() {
  const envConfig = {};

  // パフォーマンス監視の有効/無効
  if (process.env.EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING !== undefined) {
    envConfig.enabled = process.env.EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true';
  }

  // 監視間隔
  if (process.env.PERFORMANCE_MONITORING_INTERVAL) {
    envConfig.monitoringInterval = parseInt(process.env.PERFORMANCE_MONITORING_INTERVAL);
  }

  // レスポンス時間の閾値
  if (process.env.PERFORMANCE_THRESHOLD_SCREEN_TRANSITION) {
    envConfig.alertThresholds = envConfig.alertThresholds || {};
    envConfig.alertThresholds.responseTime = envConfig.alertThresholds.responseTime || {};
    envConfig.alertThresholds.responseTime.screenTransition = parseInt(process.env.PERFORMANCE_THRESHOLD_SCREEN_TRANSITION);
  }

  if (process.env.PERFORMANCE_THRESHOLD_API_CALL) {
    envConfig.alertThresholds = envConfig.alertThresholds || {};
    envConfig.alertThresholds.responseTime = envConfig.alertThresholds.responseTime || {};
    envConfig.alertThresholds.responseTime.apiCall = parseInt(process.env.PERFORMANCE_THRESHOLD_API_CALL);
  }

  // メモリ使用量の閾値
  if (process.env.PERFORMANCE_THRESHOLD_MEMORY_USAGE) {
    envConfig.alertThresholds = envConfig.alertThresholds || {};
    envConfig.alertThresholds.systemMetrics = envConfig.alertThresholds.systemMetrics || {};
    envConfig.alertThresholds.systemMetrics.memoryUsage = parseInt(process.env.PERFORMANCE_THRESHOLD_MEMORY_USAGE);
  }

  // CPU使用率の閾値
  if (process.env.PERFORMANCE_THRESHOLD_CPU_USAGE) {
    envConfig.alertThresholds = envConfig.alertThresholds || {};
    envConfig.alertThresholds.systemMetrics = envConfig.alertThresholds.systemMetrics || {};
    envConfig.alertThresholds.systemMetrics.cpuUsage = parseInt(process.env.PERFORMANCE_THRESHOLD_CPU_USAGE);
  }

  return envConfig;
}

// 設定ファイルを作成する関数
async function createPerformanceConfig() {
  try {
    // configディレクトリが存在しない場合は作成
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    // 環境変数から設定を読み込み
    const envConfig = loadEnvironmentConfig();

    // デフォルト設定と環境変数設定をマージ
    const finalConfig = mergeDeep(DEFAULT_PERFORMANCE_CONFIG, envConfig);

    // 設定ファイルを作成
    await fs.writeFile(
      PERFORMANCE_CONFIG_FILE,
      JSON.stringify(finalConfig, null, 2),
      'utf8'
    );

    console.log('✅ パフォーマンス監視設定ファイルを作成しました:', PERFORMANCE_CONFIG_FILE);
    console.log('📊 設定内容:');
    console.log(`   - 監視有効: ${finalConfig.enabled}`);
    console.log(`   - 監視間隔: ${finalConfig.monitoringInterval}ms`);
    console.log(`   - 画面遷移閾値: ${finalConfig.alertThresholds.responseTime.screenTransition}ms`);
    console.log(`   - API呼び出し閾値: ${finalConfig.alertThresholds.responseTime.apiCall}ms`);
    console.log(`   - メモリ使用量閾値: ${finalConfig.alertThresholds.systemMetrics.memoryUsage}MB`);
    console.log(`   - CPU使用率閾値: ${finalConfig.alertThresholds.systemMetrics.cpuUsage}%`);

    return finalConfig;
  } catch (error) {
    console.error('❌ パフォーマンス監視設定ファイルの作成に失敗しました:', error);
    throw error;
  }
}

// オブジェクトの深いマージを行う関数
function mergeDeep(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// パフォーマンス監視の初期化テストを行う関数
async function testPerformanceMonitoring() {
  try {
    console.log('🧪 パフォーマンス監視システムのテストを開始します...');

    // TypeScriptファイルの存在確認
    const requiredFiles = [
      '../services/performanceMonitoringService.ts',
      '../services/performanceMonitoringInitializer.ts',
      '../hooks/usePerformanceMonitoring.ts',
      '../components/PerformanceMonitoringDashboard.tsx'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      try {
        await fs.access(filePath);
        console.log(`✅ ${file} - 存在確認OK`);
      } catch (error) {
        console.error(`❌ ${file} - ファイルが見つかりません`);
        throw new Error(`Required file not found: ${file}`);
      }
    }

    console.log('✅ すべての必要ファイルが存在します');

    // 設定ファイルの読み込みテスト
    const configContent = await fs.readFile(PERFORMANCE_CONFIG_FILE, 'utf8');
    const config = JSON.parse(configContent);
    
    console.log('✅ 設定ファイルの読み込みテスト - OK');
    console.log('✅ パフォーマンス監視システムのセットアップが完了しました');

    return true;
  } catch (error) {
    console.error('❌ パフォーマンス監視システムのテストに失敗しました:', error);
    return false;
  }
}

// 使用方法を表示する関数
function showUsage() {
  console.log(`
パフォーマンス監視システムセットアップスクリプト

使用方法:
  node setupPerformanceMonitoring.js [オプション]

オプション:
  --test-only    設定ファイルを作成せず、テストのみ実行
  --help         このヘルプを表示

環境変数:
  EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING  パフォーマンス監視の有効/無効 (true/false)
  PERFORMANCE_MONITORING_INTERVAL            監視間隔 (ミリ秒)
  PERFORMANCE_THRESHOLD_SCREEN_TRANSITION    画面遷移時間の閾値 (ミリ秒)
  PERFORMANCE_THRESHOLD_API_CALL             API呼び出し時間の閾値 (ミリ秒)
  PERFORMANCE_THRESHOLD_MEMORY_USAGE         メモリ使用量の閾値 (MB)
  PERFORMANCE_THRESHOLD_CPU_USAGE            CPU使用率の閾値 (%)

例:
  # 基本的なセットアップ
  node setupPerformanceMonitoring.js

  # 環境変数を設定してセットアップ
  EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true \\
  PERFORMANCE_THRESHOLD_SCREEN_TRANSITION=800 \\
  node setupPerformanceMonitoring.js

  # テストのみ実行
  node setupPerformanceMonitoring.js --test-only
`);
}

// メイン実行関数
async function main() {
  const args = process.argv.slice(2);

  // ヘルプ表示
  if (args.includes('--help')) {
    showUsage();
    return;
  }

  try {
    console.log('🚀 PeerLearningHub パフォーマンス監視システムセットアップ');
    console.log('================================================');

    // テストのみの場合
    if (args.includes('--test-only')) {
      const testResult = await testPerformanceMonitoring();
      process.exit(testResult ? 0 : 1);
      return;
    }

    // 設定ファイルの作成
    const config = await createPerformanceConfig();

    // セットアップのテスト
    const testResult = await testPerformanceMonitoring();

    if (testResult) {
      console.log('');
      console.log('🎉 パフォーマンス監視システムのセットアップが正常に完了しました！');
      console.log('');
      console.log('次のステップ:');
      console.log('1. アプリの初期化時にPerformanceMonitoringInitializerを呼び出してください');
      console.log('2. コンポーネントでusePerformanceMonitoringフックを使用してください');
      console.log('3. PerformanceMonitoringDashboardでメトリクスを確認してください');
      console.log('');
      console.log('詳細な使用方法については、各ファイルのコメントを参照してください。');
    } else {
      console.error('❌ セットアップ中にエラーが発生しました');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ セットアップに失敗しました:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を実行
if (require.main === module) {
  main();
}

module.exports = {
  createPerformanceConfig,
  testPerformanceMonitoring,
  DEFAULT_PERFORMANCE_CONFIG,
};