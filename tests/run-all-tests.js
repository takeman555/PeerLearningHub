#!/usr/bin/env node

/**
 * 統合テストスイート実行スクリプト
 * 要件 3.1-3.6 の全てのテストを統合実行し、包括的なレポートを生成します
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 統合テスト設定
const INTEGRATED_TEST_CONFIG = {
  timeout: 120000, // 2分タイムアウト
  parallel: false, // 順次実行（リソース競合を避けるため）
  generateReport: true,
  exitOnFailure: false, // 全テストを実行してから判定
};

// テストスイート定義
const TEST_SUITES = [
  {
    name: '機能テスト',
    script: './tests/run-functional-tests.js',
    description: '認証・コミュニティ・メンバーシップ・外部システム連携の機能テスト',
    requirements: ['3.1', '3.2', '3.3', '3.4'],
    priority: 'high',
    estimatedDuration: 30, // 秒
  },
  {
    name: 'パフォーマンステスト',
    script: './tests/run-performance-tests.js',
    description: 'アプリ起動時間・画面遷移・メモリ使用量・ネットワーク効率性テスト',
    requirements: ['3.5', '7.1', '7.2', '7.3', '7.4', '7.5'],
    priority: 'medium',
    estimatedDuration: 45, // 秒
  },
  {
    name: 'セキュリティテスト',
    script: './tests/run-security-tests.js',
    description: '脆弱性スキャン・認証認可・データ暗号化・APIセキュリティテスト',
    requirements: ['3.6', '8.1', '8.2', '8.3', '8.4', '8.5'],
    priority: 'critical',
    estimatedDuration: 60, // 秒
  },
];

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
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(message, 'cyan');
  log('='.repeat(80), 'cyan');
}

function logSection(message) {
  log(`\n${'-'.repeat(60)}`, 'blue');
  log(message, 'blue');
  log('-'.repeat(60), 'blue');
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

function logCritical(message) {
  log(`🚨 ${message}`, 'red');
}

// 統合テスト結果クラス
class IntegratedTestResults {
  constructor() {
    this.suiteResults = [];
    this.startTime = new Date();
    this.totalDuration = 0;
  }

  addSuiteResult(suite, success, duration, output, error = null) {
    this.suiteResults.push({
      suite,
      success,
      duration,
      output,
      error,
      timestamp: new Date().toISOString(),
    });
    this.totalDuration += duration;
  }

  getOverallSuccess() {
    return this.suiteResults.every(result => result.success);
  }

  getSuccessRate() {
    const successCount = this.suiteResults.filter(r => r.success).length;
    return this.suiteResults.length > 0 ? (successCount / this.suiteResults.length) * 100 : 0;
  }

  getCriticalFailures() {
    return this.suiteResults.filter(result => 
      !result.success && result.suite.priority === 'critical'
    );
  }

  getRequirementsCoverage() {
    const allRequirements = new Set();
    const passedRequirements = new Set();

    this.suiteResults.forEach(result => {
      result.suite.requirements.forEach(req => {
        allRequirements.add(req);
        if (result.success) {
          passedRequirements.add(req);
        }
      });
    });

    return {
      total: allRequirements.size,
      passed: passedRequirements.size,
      coverage: allRequirements.size > 0 ? (passedRequirements.size / allRequirements.size) * 100 : 0,
      passedRequirements: Array.from(passedRequirements),
      failedRequirements: Array.from(allRequirements).filter(req => !passedRequirements.has(req)),
    };
  }

  generateReport() {
    return {
      startTime: this.startTime,
      endTime: new Date(),
      totalDuration: this.totalDuration,
      overallSuccess: this.getOverallSuccess(),
      successRate: this.getSuccessRate(),
      requirementsCoverage: this.getRequirementsCoverage(),
      criticalFailures: this.getCriticalFailures(),
      suiteResults: this.suiteResults,
      config: INTEGRATED_TEST_CONFIG,
    };
  }
}

// 環境チェック
function checkIntegratedEnvironment() {
  logSection('統合テスト環境チェック');

  const checks = [];

  // Node.js とシステム情報
  const nodeVersion = process.version;
  const platform = process.platform;
  const arch = process.arch;

  logInfo(`実行環境: Node.js ${nodeVersion} on ${platform} ${arch}`);

  // メモリチェック
  const totalMemory = process.memoryUsage();
  const memoryMB = Math.round(totalMemory.rss / 1024 / 1024);
  
  if (memoryMB > 500) {
    logWarning(`メモリ使用量が高めです: ${memoryMB}MB`);
  } else {
    logSuccess(`メモリ使用量: ${memoryMB}MB`);
  }

  // テストスクリプト存在チェック
  let missingScripts = [];
  TEST_SUITES.forEach(suite => {
    const scriptPath = path.join(process.cwd(), suite.script);
    if (!fs.existsSync(scriptPath)) {
      missingScripts.push(suite.script);
    }
  });

  if (missingScripts.length > 0) {
    logError(`見つからないテストスクリプト: ${missingScripts.join(', ')}`);
    checks.push({ name: 'Test Scripts', status: 'fail', missing: missingScripts });
  } else {
    logSuccess('全てのテストスクリプトが見つかりました');
    checks.push({ name: 'Test Scripts', status: 'pass' });
  }

  // 実行権限チェック
  TEST_SUITES.forEach(suite => {
    const scriptPath = path.join(process.cwd(), suite.script);
    if (fs.existsSync(scriptPath)) {
      try {
        fs.accessSync(scriptPath, fs.constants.X_OK);
        logSuccess(`${suite.script} は実行可能です`);
      } catch (error) {
        logWarning(`${suite.script} に実行権限がありません`);
      }
    }
  });

  // 推定実行時間
  const totalEstimatedTime = TEST_SUITES.reduce((sum, suite) => sum + suite.estimatedDuration, 0);
  logInfo(`推定実行時間: ${Math.round(totalEstimatedTime / 60)}分${totalEstimatedTime % 60}秒`);

  return checks;
}

// 単一テストスイート実行
async function runTestSuite(suite) {
  logSection(`${suite.name} 実行中`);
  
  logInfo(`説明: ${suite.description}`);
  logInfo(`要件: ${suite.requirements.join(', ')}`);
  logInfo(`優先度: ${suite.priority}`);
  logInfo(`推定時間: ${suite.estimatedDuration}秒`);

  const startTime = Date.now();

  try {
    // スクリプト実行
    const output = execSync(`node ${suite.script}`, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: INTEGRATED_TEST_CONFIG.timeout,
    });

    const duration = Date.now() - startTime;
    
    logSuccess(`${suite.name} 完了 (${Math.round(duration / 1000)}秒)`);
    
    return {
      success: true,
      duration,
      output,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logError(`${suite.name} 失敗 (${Math.round(duration / 1000)}秒)`);
    
    if (error.code === 'TIMEOUT') {
      logError('タイムアウトが発生しました');
    }
    
    return {
      success: false,
      duration,
      output: error.stdout || '',
      error: error.stderr || error.message,
    };
  }
}

// 全テストスイート実行
async function runAllTestSuites() {
  const results = new IntegratedTestResults();

  logSection('統合テスト実行開始');

  // 優先度順にソート（critical > high > medium > low）
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedSuites = [...TEST_SUITES].sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  for (const suite of sortedSuites) {
    const result = await runTestSuite(suite);
    
    results.addSuiteResult(suite, result.success, result.duration, result.output, result.error);

    // クリティカルなテストが失敗した場合の処理
    if (!result.success && suite.priority === 'critical' && INTEGRATED_TEST_CONFIG.exitOnFailure) {
      logCritical(`クリティカルなテスト「${suite.name}」が失敗したため、実行を中止します`);
      break;
    }

    // 次のテスト前に少し待機（リソース解放のため）
    if (sortedSuites.indexOf(suite) < sortedSuites.length - 1) {
      logInfo('次のテストまで待機中...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return results;
}

// 結果分析
function analyzeIntegratedResults(results) {
  logSection('統合テスト結果分析');

  const report = results.generateReport();
  const successRate = results.getSuccessRate();
  const coverage = results.getRequirementsCoverage();

  // 全体結果
  logInfo('全体結果:');
  log(`  実行時間: ${Math.round(report.totalDuration / 1000)}秒`);
  log(`  成功率: ${Math.round(successRate)}%`);
  log(`  全体判定: ${report.overallSuccess ? '✅ 成功' : '❌ 失敗'}`);

  // 要件カバレッジ
  logInfo('\n要件カバレッジ:');
  log(`  総要件数: ${coverage.total}`);
  log(`  合格要件: ${coverage.passed}`);
  log(`  カバレッジ: ${Math.round(coverage.coverage)}%`);

  if (coverage.failedRequirements.length > 0) {
    logWarning(`  未達成要件: ${coverage.failedRequirements.join(', ')}`);
  }

  // スイート別結果
  logInfo('\nスイート別結果:');
  results.suiteResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = Math.round(result.duration / 1000);
    const priority = result.suite.priority;
    
    log(`  ${status} ${result.suite.name} (${duration}秒, ${priority})`);
    
    if (!result.success) {
      log(`    エラー: ${result.error}`, 'red');
    }
  });

  // クリティカル失敗
  const criticalFailures = results.getCriticalFailures();
  if (criticalFailures.length > 0) {
    logCritical('\nクリティカルな失敗:');
    criticalFailures.forEach(failure => {
      log(`  🚨 ${failure.suite.name}: ${failure.error}`, 'red');
    });
  }

  return report;
}

// 統合レポート生成
function generateIntegratedReport(report) {
  logSection('統合レポート生成');

  // JSON レポート
  const reportPath = path.join(process.cwd(), 'integrated-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logSuccess(`統合レポート: ${reportPath}`);

  // Markdown レポート
  const markdownPath = path.join(process.cwd(), 'test-summary.md');
  const markdownContent = generateIntegratedMarkdown(report);
  fs.writeFileSync(markdownPath, markdownContent);
  logSuccess(`サマリーレポート: ${markdownPath}`);

  // 要件マトリックス
  const matrixPath = path.join(process.cwd(), 'requirements-matrix.csv');
  const matrixContent = generateRequirementsMatrix(report);
  fs.writeFileSync(matrixPath, matrixContent);
  logSuccess(`要件マトリックス: ${matrixPath}`);
}

// Markdown レポート生成
function generateIntegratedMarkdown(report) {
  const duration = Math.round(report.totalDuration / 1000);
  const coverage = report.requirementsCoverage;

  return `# PeerLearningHub 統合テストレポート

## 実行サマリー

- **実行日時**: ${new Date(report.startTime).toLocaleString('ja-JP')}
- **実行時間**: ${Math.floor(duration / 60)}分${duration % 60}秒
- **全体判定**: ${report.overallSuccess ? '✅ 成功' : '❌ 失敗'}
- **成功率**: ${Math.round(report.successRate)}%

## 要件カバレッジ

- **総要件数**: ${coverage.total}
- **合格要件**: ${coverage.passed}
- **カバレッジ**: ${Math.round(coverage.coverage)}%

### 合格要件
${coverage.passedRequirements.map(req => `- ✅ 要件 ${req}`).join('\n')}

${coverage.failedRequirements.length > 0 ? `
### 未達成要件
${coverage.failedRequirements.map(req => `- ❌ 要件 ${req}`).join('\n')}
` : ''}

## テストスイート結果

| スイート | 結果 | 実行時間 | 優先度 | 要件 |
|----------|------|----------|--------|------|
${report.suiteResults.map(result => {
  const status = result.success ? '✅ 成功' : '❌ 失敗';
  const duration = Math.round(result.duration / 1000);
  return `| ${result.suite.name} | ${status} | ${duration}秒 | ${result.suite.priority} | ${result.suite.requirements.join(', ')} |`;
}).join('\n')}

${report.criticalFailures.length > 0 ? `
## 🚨 クリティカルな問題

${report.criticalFailures.map(failure => `
### ${failure.suite.name}
- **エラー**: ${failure.error}
- **要件**: ${failure.suite.requirements.join(', ')}
`).join('\n')}
` : ''}

## 推奨事項

${generateIntegratedRecommendations(report)}

---
*このレポートは統合テストスイートにより自動生成されました*
`;
}

// 要件マトリックス生成
function generateRequirementsMatrix(report) {
  const headers = ['Requirement', 'Status', 'Test Suite', 'Priority', 'Duration'];
  const rows = [];

  report.suiteResults.forEach(result => {
    result.suite.requirements.forEach(req => {
      rows.push([
        req,
        result.success ? 'PASS' : 'FAIL',
        result.suite.name,
        result.suite.priority,
        Math.round(result.duration / 1000)
      ]);
    });
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

// 統合推奨事項生成
function generateIntegratedRecommendations(report) {
  const recommendations = [];

  if (report.criticalFailures.length > 0) {
    recommendations.push('### 🚨 緊急対応');
    recommendations.push('クリティカルなテストが失敗しています。リリース前に必ず修正してください。');
    recommendations.push('');
  }

  if (report.successRate < 100) {
    recommendations.push('### 🔧 品質改善');
    recommendations.push('失敗したテストを確認し、関連する機能を修正してください。');
    recommendations.push('');
  }

  if (report.requirementsCoverage.coverage < 100) {
    recommendations.push('### 📋 要件達成');
    recommendations.push('未達成の要件があります。該当する機能の実装を完了してください。');
    recommendations.push('');
  }

  if (report.totalDuration > 300000) { // 5分以上
    recommendations.push('### ⚡ パフォーマンス');
    recommendations.push('テスト実行時間が長すぎます。テストの最適化を検討してください。');
    recommendations.push('');
  }

  if (recommendations.length === 0) {
    recommendations.push('### ✅ 良好な状態');
    recommendations.push('全てのテストが成功し、要件を満たしています。');
    recommendations.push('リリース準備が完了しています。');
  }

  return recommendations.join('\n');
}

// 推奨事項表示
function showIntegratedRecommendations(report) {
  logSection('統合推奨事項');

  if (report.criticalFailures.length > 0) {
    logCritical('クリティカルなテストが失敗しています');
    report.criticalFailures.forEach(failure => {
      log(`  • ${failure.suite.name}: ${failure.error}`, 'red');
    });
    log('\n🚨 対応方法:');
    log('  1. クリティカルな問題を最優先で修正');
    log('  2. セキュリティ・認証関連の問題を確認');
    log('  3. 修正後に再テスト実行');
  }

  if (report.successRate < 100) {
    logWarning(`テスト成功率: ${Math.round(report.successRate)}%`);
    log('\n🔧 改善方法:');
    log('  1. 失敗したテストのログを確認');
    log('  2. 関連する機能を修正');
    log('  3. テスト環境の設定を確認');
  }

  const coverage = report.requirementsCoverage;
  if (coverage.coverage < 100) {
    logWarning(`要件カバレッジ: ${Math.round(coverage.coverage)}%`);
    log(`\n📋 未達成要件: ${coverage.failedRequirements.join(', ')}`);
    log('\n📈 改善方法:');
    log('  1. 未達成要件の実装を完了');
    log('  2. 該当するテストを再実行');
    log('  3. 要件定義の見直しを検討');
  }

  if (report.overallSuccess && coverage.coverage === 100) {
    logSuccess('\n🎉 全てのテストが成功しました！');
    log('✨ PeerLearningHub のリリース準備が完了しています');
    log('🚀 品質保証テスト（要件 3.1-3.6）が全て合格しました');
  }
}

// メイン実行関数
async function main() {
  try {
    logHeader('PeerLearningHub 統合テストスイート');

    log('🧪 実行予定のテストスイート:');
    TEST_SUITES.forEach((suite, index) => {
      log(`  ${index + 1}. ${suite.name} (${suite.priority})`);
      log(`     ${suite.description}`);
      log(`     要件: ${suite.requirements.join(', ')}`);
    });

    // 環境チェック
    const envChecks = checkIntegratedEnvironment();

    // 統合テスト実行
    const results = await runAllTestSuites();

    // 結果分析
    const report = analyzeIntegratedResults(results);

    // レポート生成
    if (INTEGRATED_TEST_CONFIG.generateReport) {
      generateIntegratedReport(report);
    }

    // 推奨事項
    showIntegratedRecommendations(report);

    // 終了判定
    if (report.overallSuccess && report.requirementsCoverage.coverage === 100) {
      logSuccess('\n✅ 統合テストが正常に完了しました');
      logSuccess('🎯 全ての品質保証要件が満たされています');
      process.exit(0);
    } else {
      logError('\n❌ 統合テストで問題が検出されました');
      logError('🔧 リリース前に問題を修正してください');
      process.exit(1);
    }
  } catch (error) {
    logError(`統合テスト実行エラー: ${error.message}`);
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
  runAllTestSuites,
  analyzeIntegratedResults,
  generateIntegratedReport,
  TEST_SUITES,
};