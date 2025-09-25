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
        errorMonitoring.reportError(`Performance test error ${i}`, 'runtime', 'low')
      );
    }
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Performance test completed: 100 errors processed in ${duration}ms`);
  }
}

export default ErrorMonitoringTester;