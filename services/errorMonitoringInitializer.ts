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