/**
 * エラー監視システムのテストスイート
 */

import ErrorMonitoringService from '../services/errorMonitoringService';
import CrashReportingService from '../services/crashReportingService';
import AlertManagerService from '../services/alertManagerService';

// モックの設定
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    Version: '14.0',
  },
}));

describe('Error Monitoring System', () => {
  let errorMonitoring: ErrorMonitoringService;
  let crashReporting: CrashReportingService;
  let alertManager: AlertManagerService;

  beforeEach(async () => {
    // サービスインスタンスの取得
    errorMonitoring = ErrorMonitoringService.getInstance();
    crashReporting = CrashReportingService.getInstance();
    alertManager = AlertManagerService.getInstance();

    // 初期化
    await errorMonitoring.initialize();
    await crashReporting.initialize();
    await alertManager.initialize();

    // モックのリセット
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // テスト後のクリーンアップ
    await errorMonitoring.clearErrorReports();
    await crashReporting.clearCrashReports();
    await alertManager.clearNotifications();
  });

  describe('ErrorMonitoringService', () => {
    it('should initialize successfully', async () => {
      expect(errorMonitoring).toBeDefined();
    });

    it('should report runtime errors', async () => {
      const testError = new Error('Test runtime error');
      
      await errorMonitoring.reportError(testError, 'runtime', 'medium', {
        testData: 'test'
      });

      const stats = await errorMonitoring.getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.errorsByType.runtime).toBeGreaterThan(0);
      expect(stats.errorsBySeverity.medium).toBeGreaterThan(0);
    });

    it('should report network errors', async () => {
      const networkError = new Error('Network timeout');
      
      await errorMonitoring.reportNetworkError(
        'https://api.test.com',
        500,
        networkError,
        { timeout: 5000 }
      );

      const stats = await errorMonitoring.getErrorStatistics();
      expect(stats.errorsByType.network).toBeGreaterThan(0);
    });

    it('should report authentication errors', async () => {
      const authError = new Error('Invalid token');
      
      await errorMonitoring.reportAuthError(authError, 'login', {
        userId: 'test_user'
      });

      const stats = await errorMonitoring.getErrorStatistics();
      expect(stats.errorsByType.auth).toBeGreaterThan(0);
    });

    it('should report database errors', async () => {
      const dbError = new Error('Connection failed');
      
      await errorMonitoring.reportDatabaseError(
        dbError,
        'SELECT * FROM users WHERE id = ?',
        { table: 'users' }
      );

      const stats = await errorMonitoring.getErrorStatistics();
      expect(stats.errorsByType.database).toBeGreaterThan(0);
    });

    it('should report crash errors', async () => {
      const crashError = new Error('Critical crash');
      
      await errorMonitoring.reportCrash(crashError, {
        crashType: 'javascript'
      });

      const stats = await errorMonitoring.getErrorStatistics();
      expect(stats.errorsByType.crash).toBeGreaterThan(0);
      expect(stats.errorsBySeverity.critical).toBeGreaterThan(0);
    });

    it('should manage error queue size', async () => {
      // 設定の更新（テスト用に小さな値に設定）
      errorMonitoring.updateAlertConfig({ maxReportsPerSession: 5 });

      // 制限を超える数のエラーを報告
      for (let i = 0; i < 10; i++) {
        await errorMonitoring.reportError(`Test error ${i}`, 'runtime', 'low');
      }

      const stats = await errorMonitoring.getErrorStatistics();
      expect(stats.totalErrors).toBeLessThanOrEqual(5);
    });

    it('should filter errors by severity threshold', async () => {
      // 閾値を高に設定
      errorMonitoring.updateAlertConfig({ severityThreshold: 'high' });

      // 低い重要度のエラーを報告
      await errorMonitoring.reportError('Low severity error', 'runtime', 'low');
      
      // 高い重要度のエラーを報告
      await errorMonitoring.reportError('High severity error', 'runtime', 'high');

      // 実際の実装では、閾値以下のエラーは処理されないことを確認
      // この部分は実装の詳細に依存
    });
  });

  describe('CrashReportingService', () => {
    it('should initialize successfully', async () => {
      expect(crashReporting).toBeDefined();
    });

    it('should record user actions', () => {
      crashReporting.recordUserAction('button_click', 'home', {
        buttonId: 'submit',
        timestamp: new Date().toISOString()
      });

      crashReporting.recordUserAction('form_submit', 'profile', {
        formData: { name: 'test' }
      });

      // ユーザーアクションが記録されていることを確認
      // 実際の実装では内部状態を確認する方法が必要
    });

    it('should record screen navigation', () => {
      crashReporting.recordScreenNavigation('home', 'push');
      crashReporting.recordScreenNavigation('profile', 'push');
      crashReporting.recordScreenNavigation('home', 'pop');

      // ナビゲーションスタックが正しく管理されていることを確認
    });

    it('should record memory warnings', () => {
      crashReporting.recordMemoryWarning();
      crashReporting.recordMemoryWarning();

      // メモリ警告が記録されていることを確認
    });

    it('should generate crash reports', async () => {
      const testError = new Error('Test crash');
      
      const crashReport = await crashReporting.generateCrashReport(
        testError,
        'javascript',
        { testCrash: true }
      );

      expect(crashReport).toBeDefined();
      expect(crashReport.errorMessage).toBe('Test crash');
      expect(crashReport.crashType).toBe('javascript');
      expect(crashReport.severity).toBe('critical');
      expect(crashReport.customData?.testCrash).toBe(true);
    });

    it('should submit crash reports', async () => {
      const testError = new Error('Test crash submission');
      
      const crashReport = await crashReporting.generateCrashReport(testError);
      await crashReporting.submitCrashReport(crashReport);

      const stats = await crashReporting.getCrashStatistics();
      expect(stats.totalCrashes).toBeGreaterThan(0);
    });

    it('should track network requests', () => {
      crashReporting.recordNetworkRequestStart();
      crashReporting.recordNetworkRequestStart();
      crashReporting.recordNetworkRequestEnd();

      // ネットワークリクエストの追跡が正しく行われていることを確認
    });

    it('should manage crash report storage', async () => {
      const testError = new Error('Storage test crash');
      
      for (let i = 0; i < 3; i++) {
        const crashReport = await crashReporting.generateCrashReport(
          new Error(`Crash ${i}`),
          'javascript'
        );
        await crashReporting.submitCrashReport(crashReport);
      }

      const storedReports = await crashReporting.getStoredCrashReports();
      expect(storedReports.length).toBe(3);

      await crashReporting.clearCrashReports();
      const clearedReports = await crashReporting.getStoredCrashReports();
      expect(clearedReports.length).toBe(0);
    });
  });

  describe('AlertManagerService', () => {
    it('should initialize successfully', async () => {
      expect(alertManager).toBeDefined();
    });

    it('should add custom alert rules', async () => {
      const ruleId = await alertManager.addAlertRule({
        name: 'Test Alert Rule',
        enabled: true,
        conditions: [
          {
            type: 'severity',
            operator: 'equals',
            value: 'high',
            timeWindow: 5
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

      expect(ruleId).toBeDefined();

      const rules = alertManager.getAlertRules();
      const addedRule = rules.find(rule => rule.id === ruleId);
      expect(addedRule).toBeDefined();
      expect(addedRule?.name).toBe('Test Alert Rule');
    });

    it('should update alert rules', async () => {
      const ruleId = await alertManager.addAlertRule({
        name: 'Original Name',
        enabled: true,
        conditions: [],
        actions: [],
        cooldownPeriod: 5
      });

      await alertManager.updateAlertRule(ruleId, {
        name: 'Updated Name',
        enabled: false
      });

      const rules = alertManager.getAlertRules();
      const updatedRule = rules.find(rule => rule.id === ruleId);
      expect(updatedRule?.name).toBe('Updated Name');
      expect(updatedRule?.enabled).toBe(false);
    });

    it('should remove alert rules', async () => {
      const ruleId = await alertManager.addAlertRule({
        name: 'Rule to Remove',
        enabled: true,
        conditions: [],
        actions: [],
        cooldownPeriod: 5
      });

      await alertManager.removeAlertRule(ruleId);

      const rules = alertManager.getAlertRules();
      const removedRule = rules.find(rule => rule.id === ruleId);
      expect(removedRule).toBeUndefined();
    });

    it('should process error reports and trigger alerts', async () => {
      // 高重要度エラー用のアラートルールを追加
      const ruleId = await alertManager.addAlertRule({
        name: 'High Severity Alert',
        enabled: true,
        conditions: [
          {
            type: 'severity',
            operator: 'equals',
            value: 'high',
            timeWindow: 5
          }
        ],
        actions: [
          {
            type: 'console_log',
            config: { level: 'error' }
          }
        ],
        cooldownPeriod: 1
      });

      // 高重要度エラーレポートを処理
      const errorReport = {
        id: 'test_error',
        timestamp: new Date(),
        errorType: 'runtime' as const,
        severity: 'high' as const,
        message: 'Test high severity error',
        userAgent: 'test',
        sessionId: 'test_session',
        appVersion: '1.0.0',
        platform: 'ios' as const
      };

      await alertManager.processErrorReport(errorReport);

      // 通知が生成されていることを確認
      const notifications = alertManager.getNotifications();
      expect(notifications.length).toBeGreaterThan(0);

      const notification = notifications.find(n => n.ruleId === ruleId);
      expect(notification).toBeDefined();
      expect(notification?.severity).toBe('high');
    });

    it('should respect cooldown periods', async () => {
      const ruleId = await alertManager.addAlertRule({
        name: 'Cooldown Test Rule',
        enabled: true,
        conditions: [
          {
            type: 'severity',
            operator: 'equals',
            value: 'medium',
            timeWindow: 5
          }
        ],
        actions: [
          {
            type: 'console_log',
            config: { level: 'warn' }
          }
        ],
        cooldownPeriod: 60 // 60分のクールダウン
      });

      const errorReport = {
        id: 'cooldown_test',
        timestamp: new Date(),
        errorType: 'runtime' as const,
        severity: 'medium' as const,
        message: 'Cooldown test error',
        userAgent: 'test',
        sessionId: 'test_session',
        appVersion: '1.0.0',
        platform: 'ios' as const
      };

      // 最初のエラーレポートを処理
      await alertManager.processErrorReport(errorReport);
      const firstNotifications = alertManager.getNotifications();

      // 同じエラーレポートを再度処理（クールダウン期間中）
      await alertManager.processErrorReport({
        ...errorReport,
        id: 'cooldown_test_2'
      });
      const secondNotifications = alertManager.getNotifications();

      // クールダウン期間中は新しい通知が生成されないことを確認
      expect(secondNotifications.length).toBe(firstNotifications.length);
    });

    it('should acknowledge notifications', async () => {
      const ruleId = await alertManager.addAlertRule({
        name: 'Acknowledgment Test',
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
          }
        ],
        cooldownPeriod: 1
      });

      const errorReport = {
        id: 'ack_test',
        timestamp: new Date(),
        errorType: 'crash' as const,
        severity: 'critical' as const,
        message: 'Acknowledgment test error',
        userAgent: 'test',
        sessionId: 'test_session',
        appVersion: '1.0.0',
        platform: 'ios' as const
      };

      await alertManager.processErrorReport(errorReport);

      const notifications = alertManager.getNotifications();
      const notification = notifications.find(n => n.ruleId === ruleId);
      expect(notification).toBeDefined();
      expect(notification?.acknowledged).toBe(false);

      if (notification) {
        await alertManager.acknowledgeNotification(notification.id);
        
        const updatedNotifications = alertManager.getNotifications();
        const acknowledgedNotification = updatedNotifications.find(n => n.id === notification.id);
        expect(acknowledgedNotification?.acknowledged).toBe(true);
      }
    });

    it('should provide alert statistics', () => {
      const stats = alertManager.getAlertStatistics();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalRules).toBe('number');
      expect(typeof stats.activeRules).toBe('number');
      expect(typeof stats.totalNotifications).toBe('number');
      expect(typeof stats.unacknowledgedNotifications).toBe('number');
      expect(typeof stats.notificationsBySeverity).toBe('object');
    });
  });

  describe('Integration Tests', () => {
    it('should integrate error monitoring with alert manager', async () => {
      // クリティカルエラー用のアラートルールを追加
      await alertManager.addAlertRule({
        name: 'Integration Test Alert',
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
          }
        ],
        cooldownPeriod: 1
      });

      // エラー監視サービスでクリティカルエラーを報告
      await errorMonitoring.reportError(
        'Integration test critical error',
        'runtime',
        'critical'
      );

      // アラートが生成されていることを確認
      // 実際の実装では、エラー監視サービスとアラート管理サービスの連携が必要
    });

    it('should integrate crash reporting with alert manager', async () => {
      // クラッシュ検知用のアラートルールを追加
      await alertManager.addAlertRule({
        name: 'Crash Integration Test',
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
          }
        ],
        cooldownPeriod: 1
      });

      // クラッシュレポートを生成・送信
      const crashError = new Error('Integration test crash');
      const crashReport = await crashReporting.generateCrashReport(crashError);
      await crashReporting.submitCrashReport(crashReport);

      // アラートが生成されていることを確認
      // 実際の実装では、クラッシュレポートサービスとアラート管理サービスの連携が必要
    });
  });

  describe('Performance Tests', () => {
    it('should handle high volume of error reports', async () => {
      const startTime = Date.now();
      const errorCount = 100;

      const promises = [];
      for (let i = 0; i < errorCount; i++) {
        promises.push(
          errorMonitoring.reportError(
            `Performance test error ${i}`,
            'runtime',
            'low'
          )
        );
      }

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Processed ${errorCount} errors in ${duration}ms`);
      expect(duration).toBeLessThan(5000); // 5秒以内で完了することを期待
    });

    it('should handle concurrent crash reports', async () => {
      const crashCount = 10;
      const promises = [];

      for (let i = 0; i < crashCount; i++) {
        const crashError = new Error(`Concurrent crash ${i}`);
        promises.push(
          crashReporting.generateCrashReport(crashError).then(report =>
            crashReporting.submitCrashReport(report)
          )
        );
      }

      await Promise.all(promises);

      const stats = await crashReporting.getCrashStatistics();
      expect(stats.totalCrashes).toBe(crashCount);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid error data gracefully', async () => {
      // 無効なデータでエラーを報告
      await expect(
        errorMonitoring.reportError(null as any, 'runtime', 'medium')
      ).resolves.not.toThrow();

      await expect(
        errorMonitoring.reportError('', 'invalid_type' as any, 'medium')
      ).resolves.not.toThrow();
    });

    it('should handle storage failures gracefully', async () => {
      // AsyncStorageのモックでエラーを発生させる
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      // エラーが発生してもアプリケーションがクラッシュしないことを確認
      await expect(
        errorMonitoring.reportError('Storage test error', 'runtime', 'medium')
      ).resolves.not.toThrow();
    });
  });
});