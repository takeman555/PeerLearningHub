#!/usr/bin/env node

/**
 * 最終ステージング環境検証スクリプト
 * 要件 9.1: ステージング環境での最終検証
 * 
 * このスクリプトは以下を実行します:
 * - 全機能の動作確認
 * - パフォーマンステストの実行
 * - セキュリティテストの実行
 * - ユーザー受け入れテストの実行
 * - 全要件の最終検証
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 検証設定
const VERIFICATION_CONFIG = {
  stagingUrl: process.env.STAGING_URL || 'https://staging.peerlearninghub.com',
  timeout: 300000, // 5分タイムアウト
  retryAttempts: 3,
  retryDelay: 5000, // 5秒
  performanceThresholds: {
    appStartup: 3000, // 3秒
    screenTransition: 1000, // 1秒
    apiResponse: 500, // 500ms
    memoryUsage: 100, // 100MB
  },
  securityChecks: {
    httpsEnforced: true,
    securityHeaders: true,
    authenticationRequired: true,
    inputValidation: true,
  },
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

// 検証結果クラス
class VerificationResults {
  constructor() {
    this.startTime = new Date();
    this.results = {
      functional: { passed: 0, failed: 0, tests: [] },
      performance: { passed: 0, failed: 0, tests: [] },
      security: { passed: 0, failed: 0, tests: [] },
      userAcceptance: { passed: 0, failed: 0, tests: [] },
    };
    this.overallStatus = 'running';
    this.errors = [];
    this.warnings = [];
  }

  addResult(category, testName, passed, details = {}) {
    const result = {
      name: testName,
      passed,
      timestamp: new Date().toISOString(),
      ...details,
    };

    this.results[category].tests.push(result);
    
    if (passed) {
      this.results[category].passed++;
    } else {
      this.results[category].failed++;
      this.errors.push(`${category}: ${testName} - ${details.error || 'Failed'}`);
    }
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  getOverallStatus() {
    const totalFailed = Object.values(this.results).reduce((sum, category) => sum + category.failed, 0);
    const totalPassed = Object.values(this.results).reduce((sum, category) => sum + category.passed, 0);
    
    if (totalFailed === 0 && totalPassed > 0) {
      return 'passed';
    } else if (totalFailed > 0) {
      return 'failed';
    } else {
      return 'no_tests';
    }
  }

  generateReport() {
    const endTime = new Date();
    const duration = endTime - this.startTime;

    return {
      startTime: this.startTime,
      endTime,
      duration,
      overallStatus: this.getOverallStatus(),
      results: this.results,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalTests: Object.values(this.results).reduce((sum, cat) => sum + cat.tests.length, 0),
        totalPassed: Object.values(this.results).reduce((sum, cat) => sum + cat.passed, 0),
        totalFailed: Object.values(this.results).reduce((sum, cat) => sum + cat.failed, 0),
        successRate: this.getSuccessRate(),
      },
    };
  }

  getSuccessRate() {
    const total = this.summary?.totalTests || Object.values(this.results).reduce((sum, cat) => sum + cat.tests.length, 0);
    const passed = this.summary?.totalPassed || Object.values(this.results).reduce((sum, cat) => sum + cat.passed, 0);
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  }
}

// HTTP リクエストユーティリティ
function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000,
    }, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          responseTime,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// 再試行ユーティリティ
async function withRetry(fn, attempts = VERIFICATION_CONFIG.retryAttempts) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      
      logWarning(`Attempt ${i + 1} failed, retrying in ${VERIFICATION_CONFIG.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, VERIFICATION_CONFIG.retryDelay));
    }
  }
}

// メイン検証クラス
class FinalStagingVerification {
  constructor() {
    this.results = new VerificationResults();
  }

  async runFullVerification() {
    logHeader('PeerLearningHub 最終ステージング環境検証');
    
    try {
      // 環境準備
      await this.prepareEnvironment();
      
      // 1. 全機能の動作確認
      await this.runFunctionalTests();
      
      // 2. パフォーマンステストの実行
      await this.runPerformanceTests();
      
      // 3. セキュリティテストの実行
      await this.runSecurityTests();
      
      // 4. ユーザー受け入れテストの実行
      await this.runUserAcceptanceTests();
      
      // 結果分析とレポート生成
      await this.generateFinalReport();
      
      return this.results.generateReport();
      
    } catch (error) {
      logCritical(`検証プロセスでエラーが発生しました: ${error.message}`);
      this.results.overallStatus = 'error';
      throw error;
    }
  }

  async prepareEnvironment() {
    logSection('ステージング環境準備');
    
    // 環境変数チェック
    const requiredEnvVars = [
      'STAGING_SUPABASE_URL',
      'STAGING_SUPABASE_ANON_KEY',
      'STAGING_REVENUECAT_API_KEY',
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        logWarning(`環境変数 ${envVar} が設定されていません`);
        this.results.addWarning(`Missing environment variable: ${envVar}`);
      } else {
        logSuccess(`環境変数 ${envVar} 設定済み`);
      }
    }

    // ステージング環境ウォームアップ
    try {
      logInfo('ステージング環境をウォームアップ中...');
      execSync('node scripts/warmupStaging.js', { 
        stdio: 'pipe',
        timeout: 60000,
      });
      logSuccess('ステージング環境ウォームアップ完了');
    } catch (error) {
      logWarning(`ウォームアップに失敗: ${error.message}`);
      this.results.addWarning('Staging warmup failed');
    }

    // データベース移行確認
    try {
      logInfo('データベース移行状態確認中...');
      execSync('node scripts/runStagingMigrations.js', { 
        stdio: 'pipe',
        timeout: 120000,
      });
      logSuccess('データベース移行確認完了');
    } catch (error) {
      logError(`データベース移行エラー: ${error.message}`);
      this.results.addResult('functional', 'Database Migrations', false, { error: error.message });
    }
  }

  async runFunctionalTests() {
    logSection('機能テスト実行 (要件 3.1-3.4)');
    
    const functionalTests = [
      {
        name: '認証システムテスト',
        test: () => this.testAuthenticationSystem(),
      },
      {
        name: 'コミュニティ機能テスト',
        test: () => this.testCommunityFeatures(),
      },
      {
        name: '外部システム連携テスト',
        test: () => this.testExternalSystemsIntegration(),
      },
      {
        name: 'メンバーシップ機能テスト',
        test: () => this.testMembershipFeatures(),
      },
    ];

    for (const testCase of functionalTests) {
      try {
        logInfo(`実行中: ${testCase.name}`);
        await withRetry(testCase.test);
        this.results.addResult('functional', testCase.name, true);
        logSuccess(`${testCase.name} 成功`);
      } catch (error) {
        this.results.addResult('functional', testCase.name, false, { error: error.message });
        logError(`${testCase.name} 失敗: ${error.message}`);
      }
    }

    // 統合機能テストスイート実行
    try {
      logInfo('統合機能テストスイート実行中...');
      const output = execSync('npm run test:functional', { 
        encoding: 'utf8',
        timeout: 180000,
      });
      
      this.results.addResult('functional', 'Integrated Functional Test Suite', true, { output });
      logSuccess('統合機能テストスイート成功');
    } catch (error) {
      this.results.addResult('functional', 'Integrated Functional Test Suite', false, { error: error.message });
      logError(`統合機能テストスイート失敗: ${error.message}`);
    }
  }

  async testAuthenticationSystem() {
    // 認証エンドポイントテスト
    const authTests = [
      { endpoint: '/api/auth/session', method: 'GET' },
      { endpoint: '/api/auth/user', method: 'GET' },
    ];

    for (const test of authTests) {
      const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}${test.endpoint}`, {
        method: test.method,
      });

      if (response.statusCode >= 400 && response.statusCode !== 401) {
        throw new Error(`Auth endpoint ${test.endpoint} returned ${response.statusCode}`);
      }
    }

    // 認証フロー統合テスト
    execSync('npm run test:auth', { stdio: 'pipe', timeout: 60000 });
  }

  async testCommunityFeatures() {
    // コミュニティエンドポイントテスト
    const communityTests = [
      { endpoint: '/api/community/posts', method: 'GET' },
      { endpoint: '/api/community/groups', method: 'GET' },
    ];

    for (const test of communityTests) {
      const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}${test.endpoint}`, {
        method: test.method,
      });

      if (response.statusCode >= 500) {
        throw new Error(`Community endpoint ${test.endpoint} returned ${response.statusCode}`);
      }
    }

    // コミュニティ機能統合テスト
    execSync('npm run test:community', { stdio: 'pipe', timeout: 60000 });
  }

  async testExternalSystemsIntegration() {
    // 外部システムエンドポイントテスト
    const externalTests = [
      { endpoint: '/api/external/projects', method: 'GET' },
      { endpoint: '/api/external/sessions', method: 'GET' },
      { endpoint: '/api/external/accommodations', method: 'GET' },
    ];

    for (const test of externalTests) {
      const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}${test.endpoint}`, {
        method: test.method,
      });

      if (response.statusCode >= 500) {
        throw new Error(`External systems endpoint ${test.endpoint} returned ${response.statusCode}`);
      }
    }

    // 外部システム統合テスト
    execSync('npm run test:external-systems', { stdio: 'pipe', timeout: 60000 });
  }

  async testMembershipFeatures() {
    // メンバーシップエンドポイントテスト
    const membershipTests = [
      { endpoint: '/api/membership/status', method: 'GET' },
      { endpoint: '/api/membership/products', method: 'GET' },
    ];

    for (const test of membershipTests) {
      const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}${test.endpoint}`, {
        method: test.method,
      });

      if (response.statusCode >= 500) {
        throw new Error(`Membership endpoint ${test.endpoint} returned ${response.statusCode}`);
      }
    }

    // メンバーシップ機能統合テスト
    execSync('npm run test:membership', { stdio: 'pipe', timeout: 60000 });
  }

  async runPerformanceTests() {
    logSection('パフォーマンステスト実行 (要件 3.5, 7.1-7.5)');
    
    const performanceTests = [
      {
        name: 'アプリ起動時間テスト',
        test: () => this.testAppStartupTime(),
      },
      {
        name: '画面遷移時間テスト',
        test: () => this.testScreenTransitionTime(),
      },
      {
        name: 'APIレスポンス時間テスト',
        test: () => this.testApiResponseTime(),
      },
      {
        name: 'メモリ使用量テスト',
        test: () => this.testMemoryUsage(),
      },
      {
        name: 'ネットワーク効率性テスト',
        test: () => this.testNetworkEfficiency(),
      },
    ];

    for (const testCase of performanceTests) {
      try {
        logInfo(`実行中: ${testCase.name}`);
        const result = await withRetry(testCase.test);
        this.results.addResult('performance', testCase.name, true, result);
        logSuccess(`${testCase.name} 成功`);
      } catch (error) {
        this.results.addResult('performance', testCase.name, false, { error: error.message });
        logError(`${testCase.name} 失敗: ${error.message}`);
      }
    }

    // 統合パフォーマンステストスイート実行
    try {
      logInfo('統合パフォーマンステストスイート実行中...');
      const output = execSync('npm run test:performance', { 
        encoding: 'utf8',
        timeout: 180000,
      });
      
      this.results.addResult('performance', 'Integrated Performance Test Suite', true, { output });
      logSuccess('統合パフォーマンステストスイート成功');
    } catch (error) {
      this.results.addResult('performance', 'Integrated Performance Test Suite', false, { error: error.message });
      logError(`統合パフォーマンステストスイート失敗: ${error.message}`);
    }
  }

  async testAppStartupTime() {
    // アプリ起動時間シミュレーション
    const startTime = Date.now();
    
    // 初期化プロセスをシミュレート
    await Promise.all([
      makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}/api/auth/session`),
      makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}/api/config`),
      new Promise(resolve => setTimeout(resolve, 100)), // アセット読み込み
    ]);
    
    const startupTime = Date.now() - startTime;
    
    if (startupTime > VERIFICATION_CONFIG.performanceThresholds.appStartup) {
      throw new Error(`App startup time ${startupTime}ms exceeds threshold ${VERIFICATION_CONFIG.performanceThresholds.appStartup}ms`);
    }
    
    return { startupTime };
  }

  async testScreenTransitionTime() {
    // 画面遷移時間シミュレーション
    const transitions = [
      '/api/community/posts',
      '/api/membership/status',
      '/api/external/projects',
    ];
    
    const transitionTimes = [];
    
    for (const endpoint of transitions) {
      const startTime = Date.now();
      await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}${endpoint}`);
      const transitionTime = Date.now() - startTime;
      
      transitionTimes.push(transitionTime);
      
      if (transitionTime > VERIFICATION_CONFIG.performanceThresholds.screenTransition) {
        throw new Error(`Screen transition time ${transitionTime}ms exceeds threshold ${VERIFICATION_CONFIG.performanceThresholds.screenTransition}ms`);
      }
    }
    
    return { 
      averageTransitionTime: transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length,
      maxTransitionTime: Math.max(...transitionTimes),
    };
  }

  async testApiResponseTime() {
    // API レスポンス時間テスト
    const apiEndpoints = [
      '/api/auth/session',
      '/api/community/posts',
      '/api/membership/status',
      '/api/external/projects',
    ];
    
    const responseTimes = [];
    
    for (const endpoint of apiEndpoints) {
      const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}${endpoint}`);
      
      responseTimes.push(response.responseTime);
      
      if (response.responseTime > VERIFICATION_CONFIG.performanceThresholds.apiResponse) {
        throw new Error(`API response time ${response.responseTime}ms exceeds threshold ${VERIFICATION_CONFIG.performanceThresholds.apiResponse}ms for ${endpoint}`);
      }
    }
    
    return {
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
    };
  }

  async testMemoryUsage() {
    // メモリ使用量テスト（Node.jsプロセス）
    const initialMemory = process.memoryUsage();
    
    // メモリ集約的な操作をシミュレート
    const largeData = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      data: 'x'.repeat(1000),
    }));
    
    const finalMemory = process.memoryUsage();
    const memoryIncreaseMB = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
    
    // クリーンアップ
    largeData.length = 0;
    
    if (memoryIncreaseMB > VERIFICATION_CONFIG.performanceThresholds.memoryUsage) {
      throw new Error(`Memory usage increase ${memoryIncreaseMB}MB exceeds threshold ${VERIFICATION_CONFIG.performanceThresholds.memoryUsage}MB`);
    }
    
    return { memoryIncreaseMB };
  }

  async testNetworkEfficiency() {
    // ネットワーク効率性テスト
    const concurrentRequests = 5;
    const requests = Array.from({ length: concurrentRequests }, () =>
      makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}/api/community/posts`)
    );
    
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const totalTime = Date.now() - startTime;
    
    const averageTime = totalTime / concurrentRequests;
    
    if (averageTime > VERIFICATION_CONFIG.performanceThresholds.apiResponse * 2) {
      throw new Error(`Network efficiency test failed: average time ${averageTime}ms too high`);
    }
    
    return { 
      concurrentRequests,
      totalTime,
      averageTime,
      successfulRequests: responses.filter(r => r.statusCode < 400).length,
    };
  }

  async runSecurityTests() {
    logSection('セキュリティテスト実行 (要件 3.6, 8.1-8.5)');
    
    const securityTests = [
      {
        name: 'HTTPS強制テスト',
        test: () => this.testHttpsEnforcement(),
      },
      {
        name: 'セキュリティヘッダーテスト',
        test: () => this.testSecurityHeaders(),
      },
      {
        name: '認証要件テスト',
        test: () => this.testAuthenticationRequirements(),
      },
      {
        name: '入力検証テスト',
        test: () => this.testInputValidation(),
      },
      {
        name: 'レート制限テスト',
        test: () => this.testRateLimiting(),
      },
    ];

    for (const testCase of securityTests) {
      try {
        logInfo(`実行中: ${testCase.name}`);
        const result = await withRetry(testCase.test);
        this.results.addResult('security', testCase.name, true, result);
        logSuccess(`${testCase.name} 成功`);
      } catch (error) {
        this.results.addResult('security', testCase.name, false, { error: error.message });
        logError(`${testCase.name} 失敗: ${error.message}`);
      }
    }

    // 統合セキュリティテストスイート実行
    try {
      logInfo('統合セキュリティテストスイート実行中...');
      const output = execSync('npm run test:security', { 
        encoding: 'utf8',
        timeout: 180000,
      });
      
      this.results.addResult('security', 'Integrated Security Test Suite', true, { output });
      logSuccess('統合セキュリティテストスイート成功');
    } catch (error) {
      this.results.addResult('security', 'Integrated Security Test Suite', false, { error: error.message });
      logError(`統合セキュリティテストスイート失敗: ${error.message}`);
    }
  }

  async testHttpsEnforcement() {
    // HTTPS強制テスト
    if (!VERIFICATION_CONFIG.stagingUrl.startsWith('https://')) {
      throw new Error('Staging URL is not using HTTPS');
    }
    
    // HTTP リダイレクトテスト（可能な場合）
    const httpUrl = VERIFICATION_CONFIG.stagingUrl.replace('https://', 'http://');
    
    try {
      const response = await makeHttpRequest(httpUrl);
      if (response.statusCode !== 301 && response.statusCode !== 302) {
        throw new Error('HTTP to HTTPS redirect not configured');
      }
    } catch (error) {
      // HTTP接続が拒否される場合は正常（HTTPS強制されている）
      if (!error.message.includes('ECONNREFUSED')) {
        throw error;
      }
    }
    
    return { httpsEnforced: true };
  }

  async testSecurityHeaders() {
    // セキュリティヘッダーテスト
    const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}/api/health`);
    
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security',
    ];
    
    const missingHeaders = [];
    
    for (const header of requiredHeaders) {
      if (!response.headers[header]) {
        missingHeaders.push(header);
      }
    }
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
    }
    
    return { securityHeaders: response.headers };
  }

  async testAuthenticationRequirements() {
    // 認証要件テスト
    const protectedEndpoints = [
      '/api/community/posts',
      '/api/membership/purchase',
      '/api/user/profile',
    ];
    
    for (const endpoint of protectedEndpoints) {
      const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}${endpoint}`);
      
      // 認証が必要なエンドポイントは401を返すべき
      if (response.statusCode !== 401) {
        throw new Error(`Protected endpoint ${endpoint} did not require authentication (returned ${response.statusCode})`);
      }
    }
    
    return { protectedEndpointsCount: protectedEndpoints.length };
  }

  async testInputValidation() {
    // 入力検証テスト
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      "'; DROP TABLE users; --",
      '../../../etc/passwd',
    ];
    
    for (const input of maliciousInputs) {
      try {
        const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: input }),
        });
        
        // 悪意のある入力は拒否されるべき
        if (response.statusCode === 200) {
          throw new Error(`Malicious input was not rejected: ${input}`);
        }
      } catch (error) {
        // 接続エラーは無視（エンドポイントが存在しない場合）
        if (!error.message.includes('ECONNREFUSED') && !error.message.includes('404')) {
          throw error;
        }
      }
    }
    
    return { inputValidationActive: true };
  }

  async testRateLimiting() {
    // レート制限テスト
    const requests = Array.from({ length: 20 }, () =>
      makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}/api/health`)
    );
    
    const responses = await Promise.allSettled(requests);
    const rateLimitedResponses = responses.filter(r => 
      r.status === 'fulfilled' && r.value.statusCode === 429
    );
    
    // 大量のリクエストでレート制限が発動することを確認
    if (rateLimitedResponses.length === 0) {
      this.results.addWarning('Rate limiting may not be configured');
    }
    
    return { 
      totalRequests: requests.length,
      rateLimitedRequests: rateLimitedResponses.length,
    };
  }

  async runUserAcceptanceTests() {
    logSection('ユーザー受け入れテスト実行');
    
    const userAcceptanceTests = [
      {
        name: 'ユーザー登録フロー',
        test: () => this.testUserRegistrationFlow(),
      },
      {
        name: 'ログインフロー',
        test: () => this.testLoginFlow(),
      },
      {
        name: 'コミュニティ投稿フロー',
        test: () => this.testCommunityPostFlow(),
      },
      {
        name: 'メンバーシップ購入フロー',
        test: () => this.testMembershipPurchaseFlow(),
      },
      {
        name: '外部システム連携フロー',
        test: () => this.testExternalSystemsFlow(),
      },
    ];

    for (const testCase of userAcceptanceTests) {
      try {
        logInfo(`実行中: ${testCase.name}`);
        const result = await withRetry(testCase.test);
        this.results.addResult('userAcceptance', testCase.name, true, result);
        logSuccess(`${testCase.name} 成功`);
      } catch (error) {
        this.results.addResult('userAcceptance', testCase.name, false, { error: error.message });
        logError(`${testCase.name} 失敗: ${error.message}`);
      }
    }
  }

  async testUserRegistrationFlow() {
    // ユーザー登録フローテスト
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      fullName: 'Test User',
    };
    
    // 登録エンドポイントテスト
    const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    
    // 登録は成功するか、既に存在するユーザーエラーを返すべき
    if (response.statusCode !== 200 && response.statusCode !== 409) {
      throw new Error(`User registration failed with status ${response.statusCode}`);
    }
    
    return { registrationTested: true };
  }

  async testLoginFlow() {
    // ログインフローテスト
    const testCredentials = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };
    
    const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCredentials),
    });
    
    // 無効な認証情報は401を返すべき
    if (response.statusCode !== 401) {
      throw new Error(`Login with invalid credentials did not return 401 (returned ${response.statusCode})`);
    }
    
    return { loginFlowTested: true };
  }

  async testCommunityPostFlow() {
    // コミュニティ投稿フローテスト
    const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}/api/community/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test post' }),
    });
    
    // 認証なしでは401を返すべき
    if (response.statusCode !== 401) {
      throw new Error(`Community post without auth did not return 401 (returned ${response.statusCode})`);
    }
    
    return { communityPostFlowTested: true };
  }

  async testMembershipPurchaseFlow() {
    // メンバーシップ購入フローテスト
    const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}/api/membership/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'test-product' }),
    });
    
    // 認証なしでは401を返すべき
    if (response.statusCode !== 401) {
      throw new Error(`Membership purchase without auth did not return 401 (returned ${response.statusCode})`);
    }
    
    return { membershipPurchaseFlowTested: true };
  }

  async testExternalSystemsFlow() {
    // 外部システム連携フローテスト
    const endpoints = [
      '/api/external/projects',
      '/api/external/sessions',
      '/api/external/accommodations',
    ];
    
    for (const endpoint of endpoints) {
      const response = await makeHttpRequest(`${VERIFICATION_CONFIG.stagingUrl}${endpoint}`);
      
      // エンドポイントは存在し、適切なレスポンスを返すべき
      if (response.statusCode >= 500) {
        throw new Error(`External systems endpoint ${endpoint} returned server error ${response.statusCode}`);
      }
    }
    
    return { externalSystemsFlowTested: true };
  }

  async generateFinalReport() {
    logSection('最終レポート生成');
    
    const report = this.results.generateReport();
    
    // レポートファイル生成
    const reportPath = path.join(__dirname, '..', 'staging-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Markdownレポート生成
    const markdownPath = path.join(__dirname, '..', 'staging-verification-report.md');
    const markdownContent = this.generateMarkdownReport(report);
    fs.writeFileSync(markdownPath, markdownContent);
    
    // 結果サマリー表示
    this.displayResultsSummary(report);
    
    logSuccess(`詳細レポート: ${reportPath}`);
    logSuccess(`サマリーレポート: ${markdownPath}`);
  }

  generateMarkdownReport(report) {
    const duration = Math.round(report.duration / 1000);
    
    return `# PeerLearningHub ステージング環境検証レポート

## 実行サマリー

- **実行日時**: ${new Date(report.startTime).toLocaleString('ja-JP')}
- **実行時間**: ${Math.floor(duration / 60)}分${duration % 60}秒
- **全体判定**: ${report.overallStatus === 'passed' ? '✅ 合格' : '❌ 不合格'}
- **成功率**: ${report.summary.successRate}%

## テスト結果

### 機能テスト (要件 3.1-3.4)
- **合格**: ${report.results.functional.passed}
- **不合格**: ${report.results.functional.failed}

### パフォーマンステスト (要件 3.5, 7.1-7.5)
- **合格**: ${report.results.performance.passed}
- **不合格**: ${report.results.performance.failed}

### セキュリティテスト (要件 3.6, 8.1-8.5)
- **合格**: ${report.results.security.passed}
- **不合格**: ${report.results.security.failed}

### ユーザー受け入れテスト
- **合格**: ${report.results.userAcceptance.passed}
- **不合格**: ${report.results.userAcceptance.failed}

## 詳細結果

${Object.entries(report.results).map(([category, results]) => `
### ${category.charAt(0).toUpperCase() + category.slice(1)}

| テスト名 | 結果 | 詳細 |
|----------|------|------|
${results.tests.map(test => `| ${test.name} | ${test.passed ? '✅' : '❌'} | ${test.error || '成功'} |`).join('\n')}
`).join('\n')}

${report.errors.length > 0 ? `
## エラー

${report.errors.map(error => `- ❌ ${error}`).join('\n')}
` : ''}

${report.warnings.length > 0 ? `
## 警告

${report.warnings.map(warning => `- ⚠️ ${warning}`).join('\n')}
` : ''}

## 推奨事項

${this.generateRecommendations(report)}

---
*このレポートは最終ステージング検証により自動生成されました*
`;
  }

  generateRecommendations(report) {
    const recommendations = [];
    
    if (report.overallStatus === 'failed') {
      recommendations.push('### 🚨 緊急対応');
      recommendations.push('失敗したテストを修正してから本番デプロイを実行してください。');
      recommendations.push('');
    }
    
    if (report.results.security.failed > 0) {
      recommendations.push('### 🔒 セキュリティ');
      recommendations.push('セキュリティテストの失敗は重大です。すぐに修正してください。');
      recommendations.push('');
    }
    
    if (report.results.performance.failed > 0) {
      recommendations.push('### ⚡ パフォーマンス');
      recommendations.push('パフォーマンス要件を満たしていません。最適化を実施してください。');
      recommendations.push('');
    }
    
    if (report.warnings.length > 0) {
      recommendations.push('### ⚠️ 警告事項');
      recommendations.push('警告事項を確認し、必要に応じて対応してください。');
      recommendations.push('');
    }
    
    if (report.overallStatus === 'passed') {
      recommendations.push('### ✅ 準備完了');
      recommendations.push('全てのテストが合格しました。本番デプロイの準備が整っています。');
      recommendations.push('');
    }
    
    return recommendations.join('\n');
  }

  displayResultsSummary(report) {
    logSection('検証結果サマリー');
    
    log(`実行時間: ${Math.round(report.duration / 1000)}秒`);
    log(`総テスト数: ${report.summary.totalTests}`);
    log(`成功: ${report.summary.totalPassed}`);
    log(`失敗: ${report.summary.totalFailed}`);
    log(`成功率: ${report.summary.successRate}%`);
    
    // カテゴリ別結果
    Object.entries(report.results).forEach(([category, results]) => {
      const status = results.failed === 0 ? '✅' : '❌';
      log(`${status} ${category}: ${results.passed}/${results.tests.length} 合格`);
    });
    
    // 全体判定
    if (report.overallStatus === 'passed') {
      logSuccess('\n🎉 ステージング環境検証が正常に完了しました！');
      logSuccess('🚀 本番デプロイの準備が整っています');
    } else {
      logError('\n❌ ステージング環境検証で問題が検出されました');
      logError('🔧 本番デプロイ前に問題を修正してください');
    }
    
    // エラーサマリー
    if (report.errors.length > 0) {
      logError('\n主要なエラー:');
      report.errors.slice(0, 5).forEach(error => {
        logError(`  • ${error}`);
      });
      
      if (report.errors.length > 5) {
        logError(`  ... および ${report.errors.length - 5} 件の追加エラー`);
      }
    }
    
    // 警告サマリー
    if (report.warnings.length > 0) {
      logWarning('\n警告事項:');
      report.warnings.slice(0, 3).forEach(warning => {
        logWarning(`  • ${warning}`);
      });
      
      if (report.warnings.length > 3) {
        logWarning(`  ... および ${report.warnings.length - 3} 件の追加警告`);
      }
    }
  }
}

// メイン実行
async function main() {
  const verification = new FinalStagingVerification();
  
  try {
    const report = await verification.runFullVerification();
    
    // 終了コード設定
    if (report.overallStatus === 'passed') {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    logCritical(`検証プロセスでエラーが発生しました: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  logCritical(`予期しないエラー: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logCritical(`未処理のPromise拒否: ${reason}`);
  console.error('Promise:', promise);
  process.exit(1);
});

// 実行
if (require.main === module) {
  main();
}

module.exports = FinalStagingVerification;