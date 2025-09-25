#!/usr/bin/env node

/**
 * 機能テスト実行スクリプト
 * 要件 3.1-3.4 の全ての機能テストを実行し、結果をレポートします
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// テスト設定
const TEST_CONFIG = {
  timeout: 30000, // 30秒タイムアウト
  verbose: true,
  coverage: true,
  bail: false, // 失敗しても全テストを実行
};

// テストスイート定義
const TEST_SUITES = [
  {
    name: '認証システムテスト',
    file: 'authentication-comprehensive.test.ts',
    description: '要件 3.1: ユーザー登録・ログイン・パスワードリセット機能',
    required: true,
  },
  {
    name: 'コミュニティ機能テスト',
    file: 'community-functionality.test.ts',
    description: '要件 3.2: 投稿・コメント・いいね・グループ管理機能',
    required: true,
  },
  {
    name: '外部システム連携テスト',
    file: 'externalSystems.test.ts',
    description: '要件 3.3: 宿泊予約・学習リソース連携機能',
    required: true,
  },
  {
    name: 'メンバーシップ機能テスト',
    file: 'membership-functionality.test.ts',
    description: '要件 3.4: 購入・復元・状態管理機能',
    required: true,
  },
  {
    name: '統合機能テスト',
    file: 'functional-test-suite.test.ts',
    description: '全機能の統合テスト',
    required: true,
  },
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

/**
 * カラー付きログ出力
 */
function colorLog(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

/**
 * テスト結果の統計情報
 */
class TestStats {
  constructor() {
    this.total = 0;
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.results = [];
  }

  addResult(suite, success, output, error = null) {
    this.total++;
    if (success) {
      this.passed++;
    } else {
      this.failed++;
    }

    this.results.push({
      suite,
      success,
      output,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  getSuccessRate() {
    return this.total > 0 ? (this.passed / this.total) * 100 : 0;
  }

  generateReport() {
    const report = {
      summary: {
        total: this.total,
        passed: this.passed,
        failed: this.failed,
        skipped: this.skipped,
        successRate: this.getSuccessRate(),
        timestamp: new Date().toISOString(),
      },
      results: this.results,
    };

    return report;
  }
}

/**
 * 単一テストスイートを実行
 */
async function runTestSuite(suite) {
  const testFile = path.join(__dirname, suite.file);
  
  // テストファイルの存在確認
  if (!fs.existsSync(testFile)) {
    throw new Error(`テストファイルが見つかりません: ${testFile}`);
  }

  colorLog(`\n📋 実行中: ${suite.name}`, 'cyan');
  colorLog(`📄 説明: ${suite.description}`, 'blue');
  colorLog(`📁 ファイル: ${suite.file}`, 'blue');

  try {
    const jestCommand = [
      'npx jest',
      `"${testFile}"`,
      '--verbose',
      '--no-cache',
      '--forceExit',
      `--testTimeout=${TEST_CONFIG.timeout}`,
    ].join(' ');

    const output = execSync(jestCommand, {
      cwd: path.dirname(__dirname),
      encoding: 'utf8',
      stdio: 'pipe',
    });

    colorLog(`✅ ${suite.name} - 成功`, 'green');
    return { success: true, output };
  } catch (error) {
    colorLog(`❌ ${suite.name} - 失敗`, 'red');
    return { success: false, output: error.stdout || '', error: error.stderr || error.message };
  }
}

/**
 * 全テストスイートを実行
 */
async function runAllTests() {
  const stats = new TestStats();
  const startTime = Date.now();

  colorLog('🚀 PeerLearningHub 機能テスト開始', 'bright');
  colorLog('=====================================', 'bright');
  colorLog(`📅 開始時刻: ${new Date().toLocaleString('ja-JP')}`, 'blue');
  colorLog(`🧪 テストスイート数: ${TEST_SUITES.length}`, 'blue');

  // 各テストスイートを実行
  for (const suite of TEST_SUITES) {
    try {
      const result = await runTestSuite(suite);
      stats.addResult(suite, result.success, result.output, result.error);
      
      // 短い休憩（メモリクリーンアップのため）
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      colorLog(`💥 ${suite.name} - 実行エラー: ${error.message}`, 'red');
      stats.addResult(suite, false, '', error.message);
    }
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  // 結果サマリー表示
  colorLog('\n📊 テスト結果サマリー', 'bright');
  colorLog('====================', 'bright');
  colorLog(`⏱️  実行時間: ${duration}秒`, 'blue');
  colorLog(`📈 成功率: ${stats.getSuccessRate().toFixed(1)}%`, 'blue');
  colorLog(`✅ 成功: ${stats.passed}/${stats.total}`, 'green');
  colorLog(`❌ 失敗: ${stats.failed}/${stats.total}`, stats.failed > 0 ? 'red' : 'blue');

  // 詳細結果表示
  colorLog('\n📋 詳細結果', 'bright');
  colorLog('============', 'bright');
  
  stats.results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const color = result.success ? 'green' : 'red';
    colorLog(`${index + 1}. ${status} ${result.suite.name}`, color);
    
    if (!result.success && result.error) {
      colorLog(`   エラー: ${result.error}`, 'red');
    }
  });

  // レポートファイル生成
  const report = stats.generateReport();
  const reportPath = path.join(__dirname, 'functional-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  colorLog(`\n📄 詳細レポート: ${reportPath}`, 'blue');

  // 推奨事項表示
  if (stats.failed > 0) {
    colorLog('\n🔧 推奨事項', 'yellow');
    colorLog('============', 'yellow');
    colorLog('• 失敗したテストのエラーメッセージを確認してください', 'yellow');
    colorLog('• 必要に応じてモックの設定を調整してください', 'yellow');
    colorLog('• データベース接続とSupabase設定を確認してください', 'yellow');
    colorLog('• RevenueCat設定が正しいか確認してください', 'yellow');
  }

  // 最終判定
  if (stats.failed === 0) {
    colorLog('\n🎉 全ての機能テストが成功しました！', 'green');
    colorLog('リリース準備の要件 3.1-3.4 が満たされています。', 'green');
    return true;
  } else {
    colorLog('\n⚠️  一部のテストが失敗しました。', 'red');
    colorLog('リリース前に問題を修正してください。', 'red');
    return false;
  }
}

/**
 * 環境チェック
 */
function checkEnvironment() {
  colorLog('🔍 環境チェック', 'blue');
  
  // Node.js バージョンチェック
  const nodeVersion = process.version;
  colorLog(`Node.js バージョン: ${nodeVersion}`, 'blue');
  
  // package.json の存在確認
  const packageJsonPath = path.join(path.dirname(__dirname), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json が見つかりません');
  }
  
  // Jest の存在確認
  try {
    execSync('npx jest --version', { stdio: 'pipe' });
    colorLog('Jest: インストール済み', 'green');
  } catch (error) {
    throw new Error('Jest がインストールされていません。npm install を実行してください。');
  }
  
  colorLog('✅ 環境チェック完了\n', 'green');
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    // 環境チェック
    checkEnvironment();
    
    // テスト実行
    const success = await runAllTests();
    
    // 終了コード設定
    process.exit(success ? 0 : 1);
  } catch (error) {
    colorLog(`💥 実行エラー: ${error.message}`, 'red');
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  runTestSuite,
  TEST_SUITES,
  TestStats,
};