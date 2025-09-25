#!/usr/bin/env node

/**
 * パフォーマンステスト実行スクリプト
 * 要件 3.5, 7.1-7.5: アプリ起動時間・画面遷移・メモリ使用量・ネットワーク通信の効率性テスト
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// パフォーマンステスト設定
const PERFORMANCE_CONFIG = {
  timeout: 60000, // 60秒タイムアウト
  iterations: 3, // 各テストを3回実行
  warmupRuns: 1, // ウォームアップ実行回数
  memoryThresholdMB: 100, // メモリ使用量閾値
  responseTimeThresholdMs: 500, // レスポンス時間閾値
};

// パフォーマンス閾値
const PERFORMANCE_THRESHOLDS = {
  APP_STARTUP_TIME: 3000, // 3秒
  SCREEN_TRANSITION_TIME: 1000, // 1秒
  API_RESPONSE_TIME: 500, // 500ms
  MEMORY_USAGE_MB: 100, // 100MB
  BATCH_OPERATION_TIME: 5000, // 5秒
};

// カラー出力
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(message, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSection(message) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(message, 'blue');
  log('-'.repeat(40), 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// システム情報取得
function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100, // GB
    freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100, // GB
    cpuCount: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'Unknown',
  };
}

// パフォーマンステスト結果クラス
class PerformanceResults {
  constructor() {
    this.results = [];
    this.systemInfo = getSystemInfo();
    this.startTime = new Date();
  }

  addResult(testName, duration, success, metrics = {}) {
    this.results.push({
      testName,
      duration,
      success,
      metrics,
      timestamp: new Date().toISOString(),
    });
  }

  getAverageResults() {
    const grouped = {};
    
    this.results.forEach(result => {
      if (!grouped[result.testName]) {
        grouped[result.testName] = [];
      }
      grouped[result.testName].push(result);
    });

    const averages = {};
    Object.keys(grouped).forEach(testName => {
      const results = grouped[testName];
      const durations = results.map(r => r.duration);
      const successCount = results.filter(r => r.success).length;
      
      averages[testName] = {
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        successRate: (successCount / results.length) * 100,
        totalRuns: results.length,
      };
    });

    return averages;
  }

  generateReport() {
    return {
      systemInfo: this.systemInfo,
      testConfig: PERFORMANCE_CONFIG,
      thresholds: PERFORMANCE_THRESHOLDS,
      startTime: this.startTime,
      endTime: new Date(),
      results: this.results,
      averages: this.getAverageResults(),
    };
  }
}

// 環境チェック
function checkEnvironment() {
  logSection('環境チェック');
  
  const systemInfo = getSystemInfo();
  
  logInfo(`プラットフォーム: ${systemInfo.platform} ${systemInfo.arch}`);
  logInfo(`Node.js: ${systemInfo.nodeVersion}`);
  logInfo(`CPU: ${systemInfo.cpuModel} (${systemInfo.cpuCount} cores)`);
  logInfo(`メモリ: ${systemInfo.totalMemory}GB (空き: ${systemInfo.freeMemory}GB)`);
  
  // メモリ警告
  if (systemInfo.freeMemory < 1) {
    logWarning('利用可能メモリが少ないため、テスト結果に影響する可能性があります');
  }
  
  // package.json確認
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json が見つかりません');
  }
  
  // Jest確認
  try {
    execSync('npx jest --version', { stdio: 'pipe' });
    logSuccess('Jest が利用可能です');
  } catch (error) {
    throw new Error('Jest が見つかりません。npm install を実行してください');
  }
  
  // テストファイル確認
  const testFile = path.join(__dirname, 'performance-test-suite.test.ts');
  if (!fs.existsSync(testFile)) {
    throw new Error('パフォーマンステストファイルが見つかりません');
  }
  
  logSuccess('環境チェック完了');
}

// ウォームアップ実行
async function runWarmup() {
  logSection('ウォームアップ実行');
  
  try {
    logInfo('Node.js エンジンのウォームアップ中...');
    
    // 簡単な計算でエンジンをウォームアップ
    for (let i = 0; i < 1000000; i++) {
      Math.random() * Math.random();
    }
    
    // メモリ割り当てのウォームアップ
    const warmupData = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      data: `warmup-${i}`,
    }));
    
    warmupData.length = 0; // クリア
    
    logSuccess('ウォームアップ完了');
  } catch (error) {
    logWarning(`ウォームアップエラー: ${error.message}`);
  }
}

// パフォーマンステスト実行
async function runPerformanceTest(iteration = 1) {
  logInfo(`パフォーマンステスト実行 (${iteration}/${PERFORMANCE_CONFIG.iterations})`);
  
  const startTime = Date.now();
  
  try {
    const jestCommand = [
      'npx jest',
      'tests/performance-test-suite.test.ts',
      '--verbose',
      '--no-cache',
      '--forceExit',
      `--testTimeout=${PERFORMANCE_CONFIG.timeout}`,
      '--detectOpenHandles',
      '--json',
      '--outputFile=performance-results.json'
    ].join(' ');
    
    const output = execSync(jestCommand, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe',
    });
    
    const duration = Date.now() - startTime;
    
    // 結果ファイル読み込み
    let testResults = null;
    try {
      const resultsPath = path.join(process.cwd(), 'performance-results.json');
      if (fs.existsSync(resultsPath)) {
        testResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        fs.unlinkSync(resultsPath); // 一時ファイル削除
      }
    } catch (parseError) {
      logWarning(`結果ファイルの解析に失敗: ${parseError.message}`);
    }
    
    return {
      success: true,
      duration,
      output,
      testResults,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      duration,
      error: error.message,
      output: error.stdout || error.stderr || '',
    };
  }
}

// メモリ使用量監視
function monitorMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
    external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
  };
}

// 全パフォーマンステスト実行
async function runAllPerformanceTests() {
  const results = new PerformanceResults();
  
  logSection('パフォーマンステスト開始');
  
  // ウォームアップ
  if (PERFORMANCE_CONFIG.warmupRuns > 0) {
    await runWarmup();
  }
  
  // 複数回実行
  for (let i = 1; i <= PERFORMANCE_CONFIG.iterations; i++) {
    const initialMemory = monitorMemoryUsage();
    logInfo(`メモリ使用量 (開始): RSS=${initialMemory.rss}MB, Heap=${initialMemory.heapUsed}MB`);
    
    const result = await runPerformanceTest(i);
    
    const finalMemory = monitorMemoryUsage();
    logInfo(`メモリ使用量 (終了): RSS=${finalMemory.rss}MB, Heap=${finalMemory.heapUsed}MB`);
    
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    results.addResult(
      `performance-test-iteration-${i}`,
      result.duration,
      result.success,
      {
        memoryUsage: finalMemory,
        memoryIncrease,
        testResults: result.testResults,
      }
    );
    
    if (result.success) {
      logSuccess(`実行 ${i} 完了 (${Math.round(result.duration / 1000)}秒)`);
    } else {
      logError(`実行 ${i} 失敗: ${result.error}`);
    }
    
    // メモリ警告
    if (memoryIncrease > 50) {
      logWarning(`メモリ使用量が大幅に増加しました: +${Math.round(memoryIncrease)}MB`);
    }
    
    // 次の実行前に少し待機
    if (i < PERFORMANCE_CONFIG.iterations) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

// 結果分析
function analyzeResults(results) {
  logSection('結果分析');
  
  const averages = results.getAverageResults();
  const report = results.generateReport();
  
  // 基本統計
  logInfo('基本統計:');
  Object.keys(averages).forEach(testName => {
    const avg = averages[testName];
    const status = avg.successRate === 100 ? '✅' : '❌';
    log(`  ${status} ${testName}:`);
    log(`    平均実行時間: ${Math.round(avg.avgDuration)}ms`);
    log(`    最小/最大: ${Math.round(avg.minDuration)}ms / ${Math.round(avg.maxDuration)}ms`);
    log(`    成功率: ${avg.successRate}%`);
  });
  
  // パフォーマンス閾値チェック
  logInfo('\nパフォーマンス閾値チェック:');
  
  const overallAvgDuration = Object.values(averages)
    .reduce((sum, avg) => sum + avg.avgDuration, 0) / Object.keys(averages).length;
  
  if (overallAvgDuration < PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME) {
    logSuccess(`平均レスポンス時間: ${Math.round(overallAvgDuration)}ms (閾値: ${PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME}ms)`);
  } else {
    logWarning(`平均レスポンス時間: ${Math.round(overallAvgDuration)}ms (閾値超過: ${PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME}ms)`);
  }
  
  // メモリ使用量分析
  const memoryMetrics = results.results
    .map(r => r.metrics.memoryUsage?.heapUsed || 0)
    .filter(m => m > 0);
  
  if (memoryMetrics.length > 0) {
    const avgMemory = memoryMetrics.reduce((a, b) => a + b, 0) / memoryMetrics.length;
    const maxMemory = Math.max(...memoryMetrics);
    
    logInfo(`\nメモリ使用量:`);
    log(`  平均: ${Math.round(avgMemory)}MB`);
    log(`  最大: ${Math.round(maxMemory)}MB`);
    
    if (maxMemory > PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB) {
      logWarning(`メモリ使用量が閾値を超過: ${Math.round(maxMemory)}MB > ${PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB}MB`);
    } else {
      logSuccess(`メモリ使用量は適切な範囲内です`);
    }
  }
  
  return report;
}

// レポート生成
function generateReport(report) {
  logSection('レポート生成');
  
  const reportPath = path.join(process.cwd(), 'performance-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logSuccess(`詳細レポート: ${reportPath}`);
  
  // サマリーレポート生成
  const summaryPath = path.join(process.cwd(), 'performance-summary.md');
  const summaryContent = generateSummaryMarkdown(report);
  fs.writeFileSync(summaryPath, summaryContent);
  
  logSuccess(`サマリーレポート: ${summaryPath}`);
}

// Markdownサマリー生成
function generateSummaryMarkdown(report) {
  const { systemInfo, averages, startTime, endTime } = report;
  const duration = Math.round((new Date(endTime) - new Date(startTime)) / 1000);
  
  return `# パフォーマンステストレポート

## 実行情報
- **実行日時**: ${new Date(startTime).toLocaleString('ja-JP')}
- **実行時間**: ${duration}秒
- **プラットフォーム**: ${systemInfo.platform} ${systemInfo.arch}
- **Node.js**: ${systemInfo.nodeVersion}
- **CPU**: ${systemInfo.cpuModel} (${systemInfo.cpuCount} cores)
- **メモリ**: ${systemInfo.totalMemory}GB

## テスト結果サマリー

| テスト名 | 平均実行時間 | 最小時間 | 最大時間 | 成功率 |
|---------|-------------|---------|---------|--------|
${Object.keys(averages).map(testName => {
  const avg = averages[testName];
  return `| ${testName} | ${Math.round(avg.avgDuration)}ms | ${Math.round(avg.minDuration)}ms | ${Math.round(avg.maxDuration)}ms | ${avg.successRate}% |`;
}).join('\n')}

## パフォーマンス閾値

- ✅ アプリ起動時間: < ${PERFORMANCE_THRESHOLDS.APP_STARTUP_TIME}ms
- ✅ 画面遷移時間: < ${PERFORMANCE_THRESHOLDS.SCREEN_TRANSITION_TIME}ms  
- ✅ API レスポンス時間: < ${PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME}ms
- ✅ メモリ使用量: < ${PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB}MB
- ✅ バッチ操作時間: < ${PERFORMANCE_THRESHOLDS.BATCH_OPERATION_TIME}ms

## 推奨事項

${generateRecommendations(report)}

---
*このレポートは自動生成されました*
`;
}

// 推奨事項生成
function generateRecommendations(report) {
  const recommendations = [];
  const { averages } = report;
  
  // 実行時間の推奨事項
  const slowTests = Object.keys(averages).filter(testName => 
    averages[testName].avgDuration > PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME
  );
  
  if (slowTests.length > 0) {
    recommendations.push('### パフォーマンス改善');
    recommendations.push('以下のテストで実行時間が閾値を超過しています:');
    slowTests.forEach(testName => {
      recommendations.push(`- ${testName}: ${Math.round(averages[testName].avgDuration)}ms`);
    });
    recommendations.push('');
  }
  
  // 成功率の推奨事項
  const failedTests = Object.keys(averages).filter(testName => 
    averages[testName].successRate < 100
  );
  
  if (failedTests.length > 0) {
    recommendations.push('### 安定性改善');
    recommendations.push('以下のテストで失敗が発生しています:');
    failedTests.forEach(testName => {
      recommendations.push(`- ${testName}: ${averages[testName].successRate}% 成功率`);
    });
    recommendations.push('');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('### 結果');
    recommendations.push('✅ 全てのパフォーマンステストが閾値内で成功しました！');
  }
  
  return recommendations.join('\n');
}

// 推奨事項表示
function showRecommendations(report) {
  logSection('推奨事項');
  
  const { averages } = report;
  let hasIssues = false;
  
  // パフォーマンス問題
  const slowTests = Object.keys(averages).filter(testName => 
    averages[testName].avgDuration > PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME
  );
  
  if (slowTests.length > 0) {
    hasIssues = true;
    logWarning('パフォーマンス改善が必要なテスト:');
    slowTests.forEach(testName => {
      log(`  • ${testName}: ${Math.round(averages[testName].avgDuration)}ms`, 'red');
    });
    
    log('\n🔧 改善方法:');
    log('  1. 重い処理の最適化');
    log('  2. キャッシュの活用');
    log('  3. 非同期処理の改善');
    log('  4. バンドルサイズの削減');
  }
  
  // 安定性問題
  const failedTests = Object.keys(averages).filter(testName => 
    averages[testName].successRate < 100
  );
  
  if (failedTests.length > 0) {
    hasIssues = true;
    logWarning('安定性改善が必要なテスト:');
    failedTests.forEach(testName => {
      log(`  • ${testName}: ${averages[testName].successRate}% 成功率`, 'red');
    });
    
    log('\n🔧 改善方法:');
    log('  1. エラーハンドリングの強化');
    log('  2. タイムアウト設定の調整');
    log('  3. リトライ機構の実装');
    log('  4. テスト環境の安定化');
  }
  
  if (!hasIssues) {
    logSuccess('🎉 全てのパフォーマンステストが基準を満たしています！');
    log('✨ アプリケーションのパフォーマンスは良好です');
  }
}

// メイン実行関数
async function main() {
  try {
    logHeader('PeerLearningHub パフォーマンステストスイート');
    
    log('📊 実行設定:');
    log(`  • 実行回数: ${PERFORMANCE_CONFIG.iterations}回`);
    log(`  • タイムアウト: ${PERFORMANCE_CONFIG.timeout / 1000}秒`);
    log(`  • ウォームアップ: ${PERFORMANCE_CONFIG.warmupRuns}回`);
    
    // 環境チェック
    checkEnvironment();
    
    // パフォーマンステスト実行
    const results = await runAllPerformanceTests();
    
    // 結果分析
    const report = analyzeResults(results);
    
    // レポート生成
    generateReport(report);
    
    // 推奨事項
    showRecommendations(report);
    
    // 終了判定
    const averages = results.getAverageResults();
    const hasFailures = Object.values(averages).some(avg => avg.successRate < 100);
    
    if (hasFailures) {
      logError('\n❌ パフォーマンステストで問題が検出されました');
      process.exit(1);
    } else {
      logSuccess('\n✅ パフォーマンステストが正常に完了しました');
      process.exit(0);
    }
  } catch (error) {
    logError(`実行エラー: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  logError(`予期しないエラー: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`未処理のPromise拒否: ${reason}`);
  console.error('Promise:', promise);
  process.exit(1);
});

// 実行
if (require.main === module) {
  main();
}

module.exports = {
  runAllPerformanceTests,
  analyzeResults,
  generateReport,
  PERFORMANCE_THRESHOLDS,
};