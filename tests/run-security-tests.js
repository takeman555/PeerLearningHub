#!/usr/bin/env node

/**
 * セキュリティテスト実行スクリプト
 * 要件 3.6, 8.1-8.5: 脆弱性スキャン・認証認可・データ暗号化・APIセキュリティテスト
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// セキュリティテスト設定
const SECURITY_CONFIG = {
  timeout: 60000, // 60秒タイムアウト
  iterations: 2, // 各テストを2回実行
  strictMode: true, // 厳格モード
  reportLevel: 'detailed', // 詳細レポート
};

// セキュリティ基準
const SECURITY_STANDARDS = {
  passwordMinLength: 8,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  encryptionKeyMinLength: 32,
  httpsOnly: true,
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

function logCritical(message) {
  log(`🚨 ${message}`, 'red');
}

// セキュリティテスト結果クラス
class SecurityTestResults {
  constructor() {
    this.results = [];
    this.vulnerabilities = [];
    this.startTime = new Date();
  }

  addResult(testName, success, duration, vulnerabilities = []) {
    this.results.push({
      testName,
      success,
      duration,
      vulnerabilities,
      timestamp: new Date().toISOString(),
    });

    this.vulnerabilities.push(...vulnerabilities);
  }

  getSecurityScore() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const criticalVulns = this.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = this.vulnerabilities.filter(v => v.severity === 'high').length;

    let score = (passedTests / totalTests) * 100;

    // Deduct points for vulnerabilities
    score -= criticalVulns * 20;
    score -= highVulns * 10;

    return Math.max(0, Math.round(score));
  }

  getVulnerabilitySummary() {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    this.vulnerabilities.forEach(vuln => {
      summary[vuln.severity]++;
    });

    return summary;
  }

  generateReport() {
    return {
      startTime: this.startTime,
      endTime: new Date(),
      totalTests: this.results.length,
      passedTests: this.results.filter(r => r.success).length,
      failedTests: this.results.filter(r => !r.success).length,
      securityScore: this.getSecurityScore(),
      vulnerabilities: this.vulnerabilities,
      vulnerabilitySummary: this.getVulnerabilitySummary(),
      results: this.results,
      standards: SECURITY_STANDARDS,
    };
  }
}

// 環境チェック
function checkSecurityEnvironment() {
  logSection('セキュリティ環境チェック');

  const checks = [];

  // Node.js バージョンチェック
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
  
  if (majorVersion >= 16) {
    logSuccess(`Node.js バージョン: ${nodeVersion} (セキュリティ要件を満たしています)`);
    checks.push({ name: 'Node.js Version', status: 'pass' });
  } else {
    logWarning(`Node.js バージョン: ${nodeVersion} (推奨: v16以上)`);
    checks.push({ name: 'Node.js Version', status: 'warning' });
  }

  // 環境変数チェック
  const requiredEnvVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ];

  let envVarIssues = 0;
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (!value || value === 'placeholder') {
      logWarning(`環境変数 ${envVar} が設定されていません`);
      envVarIssues++;
    } else if (value.startsWith('http://')) {
      logError(`環境変数 ${envVar} でHTTPが使用されています (HTTPS推奨)`);
      envVarIssues++;
    } else {
      logSuccess(`環境変数 ${envVar} が適切に設定されています`);
    }
  });

  checks.push({ 
    name: 'Environment Variables', 
    status: envVarIssues === 0 ? 'pass' : 'fail',
    issues: envVarIssues 
  });

  // package.json セキュリティチェック
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // 開発依存関係のセキュリティチェック
    const devDeps = packageJson.devDependencies || {};
    const hasSecurityTools = 
      devDeps.jest || 
      devDeps['@types/jest'] ||
      devDeps.eslint;

    if (hasSecurityTools) {
      logSuccess('セキュリティテストツールが設定されています');
      checks.push({ name: 'Security Tools', status: 'pass' });
    } else {
      logWarning('セキュリティテストツールの設定を推奨します');
      checks.push({ name: 'Security Tools', status: 'warning' });
    }
  }

  // Jest設定チェック
  try {
    execSync('npx jest --version', { stdio: 'pipe' });
    logSuccess('Jest が利用可能です');
    checks.push({ name: 'Jest Availability', status: 'pass' });
  } catch (error) {
    logError('Jest が見つかりません');
    checks.push({ name: 'Jest Availability', status: 'fail' });
    throw new Error('Jest が必要です。npm install を実行してください');
  }

  // テストファイル存在チェック
  const testFile = path.join(__dirname, 'security-test-suite.test.ts');
  if (fs.existsSync(testFile)) {
    logSuccess('セキュリティテストファイルが見つかりました');
    checks.push({ name: 'Test Files', status: 'pass' });
  } else {
    logError('セキュリティテストファイルが見つかりません');
    checks.push({ name: 'Test Files', status: 'fail' });
    throw new Error('セキュリティテストファイルが必要です');
  }

  const passedChecks = checks.filter(c => c.status === 'pass').length;
  const totalChecks = checks.length;

  logInfo(`環境チェック結果: ${passedChecks}/${totalChecks} 項目が合格`);

  if (passedChecks === totalChecks) {
    logSuccess('セキュリティ環境チェック完了');
  } else {
    logWarning('一部の環境チェックで問題が検出されました');
  }

  return checks;
}

// セキュリティテスト実行
async function runSecurityTest(iteration = 1) {
  logInfo(`セキュリティテスト実行 (${iteration}/${SECURITY_CONFIG.iterations})`);

  const startTime = Date.now();

  try {
    const jestCommand = [
      'npx jest',
      'tests/security-test-suite.test.ts',
      '--verbose',
      '--no-cache',
      '--forceExit',
      `--testTimeout=${SECURITY_CONFIG.timeout}`,
      '--detectOpenHandles',
      '--json',
      '--outputFile=security-results.json'
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
      const resultsPath = path.join(process.cwd(), 'security-results.json');
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

// 脆弱性分析
function analyzeVulnerabilities(testResults) {
  const vulnerabilities = [];

  if (!testResults || !testResults.testResults) {
    return vulnerabilities;
  }

  testResults.testResults.forEach(suite => {
    suite.assertionResults.forEach(test => {
      if (test.status === 'failed') {
        // テスト失敗を脆弱性として分類
        let severity = 'medium';
        
        if (test.title.includes('認証') || test.title.includes('パスワード')) {
          severity = 'high';
        }
        if (test.title.includes('SQLインジェクション') || test.title.includes('XSS')) {
          severity = 'critical';
        }
        if (test.title.includes('暗号化') || test.title.includes('セッション')) {
          severity = 'high';
        }

        vulnerabilities.push({
          type: 'test_failure',
          severity,
          testName: test.title,
          suiteName: suite.name,
          description: test.failureMessages?.[0] || 'Test failed',
        });
      }
    });
  });

  return vulnerabilities;
}

// 全セキュリティテスト実行
async function runAllSecurityTests() {
  const results = new SecurityTestResults();

  logSection('セキュリティテスト開始');

  // 複数回実行
  for (let i = 1; i <= SECURITY_CONFIG.iterations; i++) {
    logInfo(`実行 ${i}/${SECURITY_CONFIG.iterations}`);

    const result = await runSecurityTest(i);
    const vulnerabilities = result.testResults ? 
      analyzeVulnerabilities(result.testResults) : [];

    results.addResult(
      `security-test-iteration-${i}`,
      result.success,
      result.duration,
      vulnerabilities
    );

    if (result.success) {
      logSuccess(`実行 ${i} 完了 (${Math.round(result.duration / 1000)}秒)`);
    } else {
      logError(`実行 ${i} 失敗: ${result.error}`);
    }

    // 脆弱性警告
    if (vulnerabilities.length > 0) {
      const critical = vulnerabilities.filter(v => v.severity === 'critical').length;
      const high = vulnerabilities.filter(v => v.severity === 'high').length;

      if (critical > 0) {
        logCritical(`クリティカルな脆弱性が ${critical} 件検出されました`);
      }
      if (high > 0) {
        logError(`高リスクの脆弱性が ${high} 件検出されました`);
      }
    }

    // 次の実行前に少し待機
    if (i < SECURITY_CONFIG.iterations) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

// セキュリティ分析
function analyzeSecurityResults(results) {
  logSection('セキュリティ分析');

  const report = results.generateReport();
  const score = results.getSecurityScore();
  const vulnSummary = results.getVulnerabilitySummary();

  // セキュリティスコア表示
  logInfo(`セキュリティスコア: ${score}/100`);

  if (score >= 90) {
    logSuccess('優秀なセキュリティレベルです');
  } else if (score >= 70) {
    logWarning('セキュリティレベルは良好ですが、改善の余地があります');
  } else if (score >= 50) {
    logError('セキュリティレベルに問題があります。改善が必要です');
  } else {
    logCritical('セキュリティレベルが危険です。緊急の対応が必要です');
  }

  // 脆弱性サマリー
  logInfo('\n脆弱性サマリー:');
  log(`  🚨 クリティカル: ${vulnSummary.critical}件`, vulnSummary.critical > 0 ? 'red' : 'green');
  log(`  ⚠️  高リスク: ${vulnSummary.high}件`, vulnSummary.high > 0 ? 'red' : 'green');
  log(`  ⚡ 中リスク: ${vulnSummary.medium}件`, vulnSummary.medium > 0 ? 'yellow' : 'green');
  log(`  ℹ️  低リスク: ${vulnSummary.low}件`, 'blue');

  // テスト結果サマリー
  logInfo('\nテスト結果サマリー:');
  log(`  総テスト数: ${report.totalTests}`);
  log(`  成功: ${report.passedTests}`, 'green');
  log(`  失敗: ${report.failedTests}`, report.failedTests > 0 ? 'red' : 'green');
  log(`  成功率: ${Math.round((report.passedTests / report.totalTests) * 100)}%`);

  // セキュリティ基準チェック
  logInfo('\nセキュリティ基準チェック:');
  Object.keys(SECURITY_STANDARDS).forEach(standard => {
    const value = SECURITY_STANDARDS[standard];
    log(`  ${standard}: ${value}`, 'blue');
  });

  return report;
}

// レポート生成
function generateSecurityReport(report) {
  logSection('セキュリティレポート生成');

  // JSON レポート
  const reportPath = path.join(process.cwd(), 'security-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logSuccess(`詳細レポート: ${reportPath}`);

  // Markdown レポート
  const markdownPath = path.join(process.cwd(), 'security-report.md');
  const markdownContent = generateSecurityMarkdown(report);
  fs.writeFileSync(markdownPath, markdownContent);
  logSuccess(`Markdownレポート: ${markdownPath}`);

  // CSV レポート (脆弱性一覧)
  if (report.vulnerabilities.length > 0) {
    const csvPath = path.join(process.cwd(), 'vulnerabilities.csv');
    const csvContent = generateVulnerabilitiesCSV(report.vulnerabilities);
    fs.writeFileSync(csvPath, csvContent);
    logSuccess(`脆弱性CSV: ${csvPath}`);
  }
}

// Markdown レポート生成
function generateSecurityMarkdown(report) {
  const duration = Math.round((new Date(report.endTime) - new Date(report.startTime)) / 1000);

  return `# セキュリティテストレポート

## 実行情報
- **実行日時**: ${new Date(report.startTime).toLocaleString('ja-JP')}
- **実行時間**: ${duration}秒
- **テスト実行回数**: ${SECURITY_CONFIG.iterations}回

## セキュリティスコア: ${report.securityScore}/100

${report.securityScore >= 90 ? '✅ 優秀' : 
  report.securityScore >= 70 ? '⚠️ 良好' : 
  report.securityScore >= 50 ? '❌ 要改善' : '🚨 危険'}

## テスト結果サマリー

| 項目 | 件数 |
|------|------|
| 総テスト数 | ${report.totalTests} |
| 成功 | ${report.passedTests} |
| 失敗 | ${report.failedTests} |
| 成功率 | ${Math.round((report.passedTests / report.totalTests) * 100)}% |

## 脆弱性サマリー

| 深刻度 | 件数 |
|--------|------|
| 🚨 クリティカル | ${report.vulnerabilitySummary.critical} |
| ⚠️ 高リスク | ${report.vulnerabilitySummary.high} |
| ⚡ 中リスク | ${report.vulnerabilitySummary.medium} |
| ℹ️ 低リスク | ${report.vulnerabilitySummary.low} |

## セキュリティ基準

| 項目 | 基準値 |
|------|--------|
${Object.keys(SECURITY_STANDARDS).map(key => 
  `| ${key} | ${SECURITY_STANDARDS[key]} |`
).join('\n')}

## 推奨事項

${generateSecurityRecommendations(report)}

---
*このレポートは自動生成されました*
`;
}

// 脆弱性CSV生成
function generateVulnerabilitiesCSV(vulnerabilities) {
  const headers = ['Type', 'Severity', 'Test Name', 'Suite Name', 'Description'];
  const rows = vulnerabilities.map(vuln => [
    vuln.type,
    vuln.severity,
    vuln.testName,
    vuln.suiteName,
    `"${vuln.description.replace(/"/g, '""')}"` // CSV エスケープ
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

// セキュリティ推奨事項生成
function generateSecurityRecommendations(report) {
  const recommendations = [];

  if (report.vulnerabilitySummary.critical > 0) {
    recommendations.push('### 🚨 緊急対応が必要');
    recommendations.push('クリティカルな脆弱性が検出されています。直ちに修正してください。');
    recommendations.push('');
  }

  if (report.vulnerabilitySummary.high > 0) {
    recommendations.push('### ⚠️ 高優先度の改善');
    recommendations.push('高リスクの脆弱性があります。早急な対応を推奨します。');
    recommendations.push('');
  }

  if (report.failedTests > 0) {
    recommendations.push('### 🔧 テスト失敗の修正');
    recommendations.push('失敗したセキュリティテストを確認し、関連する機能を修正してください。');
    recommendations.push('');
  }

  if (report.securityScore < 70) {
    recommendations.push('### 📈 セキュリティ強化');
    recommendations.push('以下の対策を検討してください:');
    recommendations.push('- パスワードポリシーの強化');
    recommendations.push('- セッション管理の改善');
    recommendations.push('- 入力検証の強化');
    recommendations.push('- 暗号化の実装');
    recommendations.push('- APIセキュリティの向上');
    recommendations.push('');
  }

  if (recommendations.length === 0) {
    recommendations.push('### ✅ 良好な状態');
    recommendations.push('セキュリティテストは良好な結果を示しています。');
    recommendations.push('定期的なセキュリティテストの実行を継続してください。');
  }

  return recommendations.join('\n');
}

// 推奨事項表示
function showSecurityRecommendations(report) {
  logSection('セキュリティ推奨事項');

  if (report.vulnerabilitySummary.critical > 0) {
    logCritical('緊急対応が必要な脆弱性があります');
    log('  • 直ちにクリティカルな脆弱性を修正してください');
    log('  • セキュリティパッチを適用してください');
    log('  • 本番環境への影響を確認してください');
  }

  if (report.vulnerabilitySummary.high > 0) {
    logError('高リスクの脆弱性があります');
    log('  • 早急な対応を推奨します');
    log('  • セキュリティレビューを実施してください');
  }

  if (report.failedTests > 0) {
    logWarning('失敗したセキュリティテストがあります');
    log('  • テスト失敗の原因を調査してください');
    log('  • 関連する機能のセキュリティを強化してください');
  }

  if (report.securityScore >= 90) {
    logSuccess('優秀なセキュリティレベルです');
    log('  • 現在のセキュリティ対策を維持してください');
    log('  • 定期的なセキュリティテストを継続してください');
  } else if (report.securityScore >= 70) {
    logWarning('セキュリティレベルの向上を推奨します');
    log('  • 追加のセキュリティ対策を検討してください');
    log('  • セキュリティトレーニングを実施してください');
  } else {
    logError('セキュリティレベルの大幅な改善が必要です');
    log('  • 包括的なセキュリティレビューを実施してください');
    log('  • セキュリティ専門家への相談を検討してください');
  }
}

// メイン実行関数
async function main() {
  try {
    logHeader('PeerLearningHub セキュリティテストスイート');

    log('🔒 セキュリティテスト設定:');
    log(`  • 実行回数: ${SECURITY_CONFIG.iterations}回`);
    log(`  • タイムアウト: ${SECURITY_CONFIG.timeout / 1000}秒`);
    log(`  • 厳格モード: ${SECURITY_CONFIG.strictMode ? '有効' : '無効'}`);

    // 環境チェック
    const envChecks = checkSecurityEnvironment();

    // セキュリティテスト実行
    const results = await runAllSecurityTests();

    // セキュリティ分析
    const report = analyzeSecurityResults(results);

    // レポート生成
    generateSecurityReport(report);

    // 推奨事項
    showSecurityRecommendations(report);

    // 終了判定
    const hasVulnerabilities = report.vulnerabilitySummary.critical > 0 || 
                              report.vulnerabilitySummary.high > 0;
    const hasFailures = report.failedTests > 0;

    if (hasVulnerabilities || hasFailures) {
      logError('\n❌ セキュリティテストで問題が検出されました');
      process.exit(1);
    } else {
      logSuccess('\n✅ セキュリティテストが正常に完了しました');
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
  runAllSecurityTests,
  analyzeSecurityResults,
  generateSecurityReport,
  SECURITY_STANDARDS,
};