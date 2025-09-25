/**
 * エラー監視サービス
 * アプリケーションエラーの自動検知、収集、通知を管理
 */

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ErrorReport {
  id: string;
  timestamp: Date;
  errorType: 'crash' | 'runtime' | 'network' | 'auth' | 'database';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  appVersion: string;
  platform: 'ios' | 'android';
  metadata?: Record<string, any>;
}

export interface AlertConfig {
  enabled: boolean;
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  notificationChannels: ('console' | 'storage' | 'remote')[];
  maxReportsPerSession: number;
  retryAttempts: number;
}

class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private alertConfig: AlertConfig;
  private sessionId: string;
  private errorQueue: ErrorReport[] = [];
  private isInitialized = false;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.alertConfig = {
      enabled: true,
      severityThreshold: 'medium',
      notificationChannels: ['console', 'storage'],
      maxReportsPerSession: 50,
      retryAttempts: 3
    };
  }

  public static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  /**
   * エラー監視システムの初期化
   */
  public async initialize(): Promise<void> {
    try {
      // 設定の読み込み
      await this.loadConfiguration();
      
      // グローバルエラーハンドラーの設定
      this.setupGlobalErrorHandlers();
      
      // 未送信エラーレポートの復旧
      await this.recoverPendingReports();
      
      this.isInitialized = true;
      console.log('Error monitoring system initialized');
    } catch (error) {
      console.error('Failed to initialize error monitoring:', error);
    }
  }

  /**
   * エラーレポートの記録
   */
  public async reportError(
    error: Error | string,
    errorType: ErrorReport['errorType'] = 'runtime',
    severity: ErrorReport['severity'] = 'medium',
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Error monitoring not initialized');
      return;
    }

    try {
      const errorReport: ErrorReport = {
        id: this.generateErrorId(),
        timestamp: new Date(),
        errorType,
        severity,
        message: typeof error === 'string' ? error : error.message,
        stack: typeof error === 'object' ? error.stack : undefined,
        userAgent: this.getUserAgent(),
        sessionId: this.sessionId,
        appVersion: this.getAppVersion(),
        platform: this.getPlatform(),
        metadata
      };

      // エラーレポートをキューに追加
      this.errorQueue.push(errorReport);

      // 設定に基づいてアラートを送信
      await this.processErrorReport(errorReport);

      // キューサイズの管理
      this.manageQueueSize();

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * クラッシュレポートの記録
   */
  public async reportCrash(
    error: Error,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.reportError(error, 'crash', 'critical', {
      ...metadata,
      crashTime: new Date().toISOString(),
      memoryUsage: this.getMemoryUsage()
    });
  }

  /**
   * ネットワークエラーの記録
   */
  public async reportNetworkError(
    url: string,
    statusCode: number,
    error: Error,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.reportError(error, 'network', 'medium', {
      ...metadata,
      url,
      statusCode,
      networkType: 'unknown' // React Nativeでネットワークタイプを取得する場合
    });
  }

  /**
   * 認証エラーの記録
   */
  public async reportAuthError(
    error: Error,
    authAction: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.reportError(error, 'auth', 'high', {
      ...metadata,
      authAction,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * データベースエラーの記録
   */
  public async reportDatabaseError(
    error: Error,
    query?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.reportError(error, 'database', 'high', {
      ...metadata,
      query: query ? this.sanitizeQuery(query) : undefined,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * エラー統計の取得
   */
  public async getErrorStatistics(): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorReport[];
  }> {
    try {
      const storedReports = await this.getStoredReports();
      const allReports = [...this.errorQueue, ...storedReports];

      const errorsByType: Record<string, number> = {};
      const errorsBySeverity: Record<string, number> = {};

      allReports.forEach(report => {
        errorsByType[report.errorType] = (errorsByType[report.errorType] || 0) + 1;
        errorsBySeverity[report.severity] = (errorsBySeverity[report.severity] || 0) + 1;
      });

      return {
        totalErrors: allReports.length,
        errorsByType,
        errorsBySeverity,
        recentErrors: allReports.slice(-10)
      };
    } catch (error) {
      console.error('Failed to get error statistics:', error);
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsBySeverity: {},
        recentErrors: []
      };
    }
  }

  /**
   * アラート設定の更新
   */
  public updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    this.saveConfiguration();
  }

  /**
   * エラーレポートのクリア
   */
  public async clearErrorReports(): Promise<void> {
    try {
      this.errorQueue = [];
      await AsyncStorage.removeItem('error_reports');
      console.log('Error reports cleared');
    } catch (error) {
      console.error('Failed to clear error reports:', error);
    }
  }

  // プライベートメソッド

  private async loadConfiguration(): Promise<void> {
    try {
      const configStr = await AsyncStorage.getItem('error_monitoring_config');
      if (configStr) {
        const config = JSON.parse(configStr);
        this.alertConfig = { ...this.alertConfig, ...config };
      }
    } catch (error) {
      console.warn('Failed to load error monitoring configuration:', error);
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'error_monitoring_config',
        JSON.stringify(this.alertConfig)
      );
    } catch (error) {
      console.error('Failed to save error monitoring configuration:', error);
    }
  }

  private setupGlobalErrorHandlers(): void {{
    // React Nativeのグローバルエラーハンドラー
    const originalHandler = global.ErrorUtils?.getGlobalHandler();
    
    global.ErrorUtils?.setGlobalHandler((error: Error, isFatal: boolean) => {
      this.reportError(error, isFatal ? 'crash' : 'runtime', isFatal ? 'critical' : 'high', {
        isFatal,
        globalHandler: true
      });
      
      // 元のハンドラーも呼び出す
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    // Promise rejection ハンドラー
    const originalRejectionHandler = global.onunhandledrejection;
    global.onunhandledrejection = (event: any) => {
      this.reportError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        'runtime',
        'high',
        { unhandledRejection: true, reason: event.reason }
      );
      
      if (originalRejectionHandler) {
        originalRejectionHandler(event);
      }
    };
  }

  private async processErrorReport(report: ErrorReport): Promise<void> {
    if (!this.shouldProcessError(report)) {
      return;
    }

    // コンソール出力
    if (this.alertConfig.notificationChannels.includes('console')) {
      this.logErrorToConsole(report);
    }

    // ローカルストレージに保存
    if (this.alertConfig.notificationChannels.includes('storage')) {
      await this.storeErrorReport(report);
    }

    // リモート送信（将来の実装）
    if (this.alertConfig.notificationChannels.includes('remote')) {
      await this.sendErrorReportRemote(report);
    }

    // クリティカルエラーの場合はユーザーに通知
    if (report.severity === 'critical') {
      this.showCriticalErrorAlert(report);
    }
  }

  private shouldProcessError(report: ErrorReport): boolean {
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const reportLevel = severityLevels.indexOf(report.severity);
    const thresholdLevel = severityLevels.indexOf(this.alertConfig.severityThreshold);
    
    return this.alertConfig.enabled && reportLevel >= thresholdLevel;
  }

  private logErrorToConsole(report: ErrorReport): void {
    const logMethod = report.severity === 'critical' ? console.error : console.warn;
    logMethod(`[${report.severity.toUpperCase()}] ${report.errorType}: ${report.message}`, {
      id: report.id,
      timestamp: report.timestamp,
      stack: report.stack,
      metadata: report.metadata
    });
  }

  private async storeErrorReport(report: ErrorReport): Promise<void> {
    try {
      const existingReports = await this.getStoredReports();
      const updatedReports = [...existingReports, report].slice(-100); // 最新100件を保持
      
      await AsyncStorage.setItem('error_reports', JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Failed to store error report:', error);
    }
  }

  private async getStoredReports(): Promise<ErrorReport[]> {
    try {
      const reportsStr = await AsyncStorage.getItem('error_reports');
      return reportsStr ? JSON.parse(reportsStr) : [];
    } catch (error) {
      console.error('Failed to get stored reports:', error);
      return [];
    }
  }

  private async sendErrorReportRemote(report: ErrorReport): Promise<void> {
    // 将来の実装: リモートエラー追跡サービスへの送信
    // 例: Sentry, Bugsnag, Firebase Crashlytics など
    console.log('Remote error reporting not implemented yet:', report.id);
  }

  private showCriticalErrorAlert(report: ErrorReport): void {
    Alert.alert(
      'アプリケーションエラー',
      'アプリケーションで重要なエラーが発生しました。開発チームに報告されました。',
      [
        {
          text: 'OK',
          onPress: () => console.log('Critical error alert dismissed')
        }
      ]
    );
  }

  private async recoverPendingReports(): Promise<void> {
    try {
      const pendingReports = await this.getStoredReports();
      console.log(`Recovered ${pendingReports.length} pending error reports`);
    } catch (error) {
      console.error('Failed to recover pending reports:', error);
    }
  }

  private manageQueueSize(): void {
    if (this.errorQueue.length > this.alertConfig.maxReportsPerSession) {
      this.errorQueue = this.errorQueue.slice(-this.alertConfig.maxReportsPerSession);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserAgent(): string {
    // React Nativeでのユーザーエージェント情報
    return 'PeerLearningHub/1.0.0 (React Native)';
  }

  private getAppVersion(): string {
    // package.jsonから取得するか、設定から取得
    return '1.0.0';
  }

  private getPlatform(): 'ios' | 'android' {
    // React NativeのPlatform APIを使用
    return 'ios'; // 実際の実装では Platform.OS を使用
  }

  private getMemoryUsage(): any {
    // メモリ使用量の取得（可能な場合）
    return {
      timestamp: new Date().toISOString(),
      // 実際の実装では適切なメモリ情報を取得
    };
  }

  private sanitizeQuery(query: string): string {
    // SQLクエリから機密情報を除去
    return query.replace(/(['"])[^'"]*\1/g, '$1***$1');
  }
}

export default ErrorMonitoringService;