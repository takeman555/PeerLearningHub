#!/usr/bin/env node

/**
 * 機能テストスイート実行スクリプト
 * 要件 3.1-3.4 の全ての機能テストを実行し、結果をレポートします
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// テスト設定
const TEST_CONFIG = {
  timeout: 30000, // 30秒
  verbose: true,
  coverage: true,
  bail: false, // 1つのテストが失敗しても続行
};

// 実行するテストファイル
const FUNCTIONAL_TESTS = [
  'authentication-comprehensive.test.ts',
  'community-functionality.test.ts',
  'membership-functionality.test.ts',
  'external-systems-integration.test.ts',
  'functional-test-suite.test.ts',
];

// カラー出力用の定数
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

// ログ関数
function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, COLORS.cyan);
  log(`${message}`, COLORS.cyan + COLORS.bright);
  log(`${'='.repeat(60)}`, COLORS.cyan);
}

function logSection(message) {
  log(`\n${'-'.repeat(40)}`, COLORS.blue);
  log(`${message}`, COLORS.blue + COLORS.bright);
  log(`${'-'.repeat(40)}`, COLORS.blue);
}

function logSuccess(message) {
  log(`✅ ${message}`, COLORS.green);
}

function logError(message) {
  log(`❌ ${message}`, COLORS.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, COLORS.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, COLORS.blue);
}

// テスト結果を格納する変数
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0,
  coverage: null,
  details: [],
};

// 環境チェック
function checkEnvironment() {
  logSection('環境チェック');
  
  try {
    // Node.js バージョンチェック
    const nodeVersion = process.version;
    logInfo(`Node.js バージョン: ${nodeVersion}`);
    
    // package.json の存在チェック
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json が見つかりません');
    }
    
    // Jest の存在チェック
    try {
      execSync('npx jest --version', { stdio: 'pipe' });
      logSuccess('Jest が利用可能です');
    } catch (error) {
      throw new Error('Jest が見つかりません。npm install を実行してください');
    }
    
    // テストファイルの存在チェック
    const testsDir = path.join(process.cwd(), 'tests');
    if (!fs.existsSync(testsDir)) {
      throw new Error('tests ディレクトリが見つかりません');
    }
    
    let missingTests = [];
    FUNCTIONAL_TESTS.forEach(testFile => {
      const testPath = path.join(testsDir, testFile);
      if (!fs.existsSync(testPath)) {
        missingTests.push(testFile);
      }
    });
    
    if (missingTests.length > 0) {
      logWarning(`以下のテストファイルが見つかりません: ${missingTests.join(', ')}`);
    } else {
      logSuccess('全てのテストファイルが見つかりました');
    }
    
    logSuccess('環境チェック完了');
    return true;
  } catch (error) {
    logError(`環境チェックエラー: ${error.message}`);
    return false;
  }
}

// 個別テストファイルの実行
function runTestFile(testFile) {
  logInfo(`実行中: ${testFile}`);
  
  const startTime = Date.now();
  
  try {
    const jestCommand = [
      'npx jest',
      `tests/${testFile}`,
      '--verbose',
      '--no-cache',
      '--forceExit',
      `--testTimeout=${TEST_CONFIG.timeout}`,
      TEST_CONFIG.coverage ? '--coverage' : '',
      '--json',
      '--outputFile=test-results.json'
    ].filter(Boolean).join(' ');
    
    const output = execSync(jestCommand, { 
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    const duration = Date.now() - startTime;
    
    // 結果ファイルを読み込み
    let results = null;
    try {
      const resultsPath = path.join(process.cwd(), 'test-results.json');
      if (fs.existsSync(resultsPath)) {
        results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        fs.unlinkSync(resultsPath); // 一時ファイルを削除
      }
    } catch (parseError) {
      logWarning(`結果ファイルの解析に失敗: ${parseError.message}`);
    }
    
    const testResult = {
      file: testFile,
      status: 'passed',
      duration: duration,
      output: output,
      results: results,
    };
    
    testResults.details.push(testResult);
    testResults.passed++;
    
    logSuccess(`✅ ${testFile} - ${duration}ms`);
    
    if (results) {
      logInfo(`  テスト数: ${results.numTotalTests}`);
      logInfo(`  成功: ${results.numPassedTests}`);
      if (results.numFailedTests > 0) {
        logWarning(`  失敗: ${results.numFailedTests}`);
      }
    }
    
    return testResult;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    const testResult = {
      file: testFile,
      status: 'failed',
      duration: duration,
      error: error.message,
      output: error.stdout || error.stderr || '',
    };
    
    testResults.details.push(testResult);
    testResults.failed++;
    
    logError(`❌ ${testFile} - ${duration}ms`);
    logError(`  エラー: ${error.message}`);
    
    if (!TEST_CONFIG.bail) {
      logInfo('  テストを続行します...');
    }
    
    return testResult;
  }
}

// 全テストの実行
function runAllTests() {
  logSection('機能テスト実行');
  
  const overallStartTime = Date.now();
  
  testResults.total = FUNCTIONAL_TESTS.length;
  
  for (const testFile of FUNCTIONAL_TESTS) {
    const result = runTestFile(testFile);
    
    if (result.status === 'failed' && TEST_CONFIG.bail) {
      logError('テストが失敗したため、実行を中止します');
      break;
    }
  }
  
  testResults.duration = Date.now() - overallStartTime;
}

// カバレッジレポートの生成
function generateCoverageReport() {
  if (!TEST_CONFIG.coverage) {
    return;
  }
  
  logSection('カバレッジレポート生成');
  
  try {
    // カバレッジディレクトリの確認
    const coverageDir = path.join(process.cwd(), 'coverage');
    if (fs.existsSync(coverageDir)) {
      logSuccess('カバレッジレポートが生成されました');
      logInfo(`レポート場所: ${coverageDir}/lcov-report/index.html`);
      
      // カバレッジサマリーの読み込み
      const coverageSummaryPath = path.join(coverageDir, 'coverage-summary.json');
      if (fs.existsSync(coverageSummaryPath)) {
        const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
        testResults.coverage = coverageSummary.total;
        
        logInfo(`行カバレッジ: ${coverageSummary.total.lines.pct}%`);
        logInfo(`関数カバレッジ: ${coverageSummary.total.functions.pct}%`);
        logInfo(`ブランチカバレッジ: ${coverageSummary.total.branches.pct}%`);
        logInfo(`文カバレッジ: ${coverageSummary.total.statements.pct}%`);
      }
    } else {
      logWarning('カバレッジレポートが見つかりません');
    }
  } catch (error) {
    logError(`カバレッジレポート生成エラー: ${error.message}`);
  }
}

// 結果レポートの生成
function generateReport() {
  logSection('テスト結果サマリー');
  
  const successRate = testResults.total > 0 ? 
    Math.round((testResults.passed / testResults.total) * 100) : 0;
  
  log(`\n📊 テスト実行結果:`);
  log(`   総テスト数: ${testResults.total}`);
  log(`   成功: ${testResults.passed}`, COLORS.green);
  log(`   失敗: ${testResults.failed}`, testResults.failed > 0 ? COLORS.red : COLORS.reset);
  log(`   スキップ: ${testResults.skipped}`, COLORS.yellow);
  log(`   成功率: ${successRate}%`, successRate >= 80 ? COLORS.green : COLORS.red);
  log(`   実行時間: ${Math.round(testResults.duration / 1000)}秒`);
  
  if (testResults.coverage) {
    log(`\n📈 カバレッジ:`);
    log(`   行: ${testResults.coverage.lines.pct}%`);
    log(`   関数: ${testResults.coverage.functions.pct}%`);
    log(`   ブランチ: ${testResults.coverage.branches.pct}%`);
    log(`   文: ${testResults.coverage.statements.pct}%`);
  }
  
  // 詳細結果
  if (testResults.details.length > 0) {
    log(`\n📋 詳細結果:`);
    testResults.details.forEach(detail => {
      const status = detail.status === 'passed' ? '✅' : '❌';
      const duration = Math.round(detail.duration / 1000 * 100) / 100;
      log(`   ${status} ${detail.file} (${duration}s)`);
      
      if (detail.status === 'failed' && detail.error) {
        log(`      エラー: ${detail.error}`, COLORS.red);
      }
    });
  }
  
  // 結果ファイルの保存
  const reportPath = path.join(process.cwd(), 'functional-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  logInfo(`詳細結果を保存しました: ${reportPath}`);
  
  // 要件マッピング
  log(`\n📋 要件カバレッジ:`);
  log(`   要件 3.1 (認証システム): authentication-comprehensive.test.ts`);
  log(`   要件 3.2 (コミュニティ機能): community-functionality.test.ts`);
  log(`   要件 3.3 (外部システム連携): external-systems-integration.test.ts`);
  log(`   要件 3.4 (メンバーシップ機能): membership-functionality.test.ts`);
  log(`   統合テスト: functional-test-suite.test.ts`);
}

// 推奨事項の表示
function showRecommendations() {
  logSection('推奨事項');
  
  if (testResults.failed > 0) {
    logWarning('失敗したテストがあります:');
    testResults.details
      .filter(detail => detail.status === 'failed')
      .forEach(detail => {
        log(`  • ${detail.file}: ${detail.error}`, COLORS.red);
      });
    
    log('\n🔧 対応方法:');
    log('  1. 失敗したテストのエラーメッセージを確認');
    log('  2. 関連するサービスやコンポーネントを修正');
    log('  3. テストを再実行して修正を確認');
  }
  
  if (testResults.coverage && testResults.coverage.lines.pct < 80) {
    logWarning(`カバレッジが80%未満です (${testResults.coverage.lines.pct}%)`);
    log('\n📈 カバレッジ向上のために:');
    log('  1. テストされていないコードパスを特定');
    log('  2. エッジケースのテストを追加');
    log('  3. エラーハンドリングのテストを強化');
  }
  
  if (testResults.duration > 60000) { // 1分以上
    logWarning(`テスト実行時間が長すぎます (${Math.round(testResults.duration / 1000)}秒)`);
    log('\n⚡ パフォーマンス改善のために:');
    log('  1. 重いテストケースを特定');
    log('  2. モックの使用を検討');
    log('  3. テストの並列実行を検討');
  }
  
  if (testResults.passed === testResults.total && testResults.total > 0) {
    logSuccess('\n🎉 全てのテストが成功しました！');
    log('✨ リリース準備の機能テストが完了しています');
  }
}

// メイン実行関数
function main() {
  logHeader('PeerLearningHub 機能テストスイート');
  
  log('📋 実行予定のテスト:');
  FUNCTIONAL_TESTS.forEach((test, index) => {
    log(`  ${index + 1}. ${test}`);
  });
  
  // 環境チェック
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  // テスト実行
  runAllTests();
  
  // カバレッジレポート生成
  generateCoverageReport();
  
  // 結果レポート
  generateReport();
  
  // 推奨事項
  showRecommendations();
  
  // 終了コード
  const exitCode = testResults.failed > 0 ? 1 : 0;
  
  if (exitCode === 0) {
    logSuccess('\n✅ 機能テストスイートが正常に完了しました');
  } else {
    logError('\n❌ 機能テストスイートでエラーが発生しました');
  }
  
  process.exit(exitCode);
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
  runAllTests,
  checkEnvironment,
  generateReport,
  testResults,
};