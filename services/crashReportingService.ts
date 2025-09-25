/**
 * クラッシュレポート収集サービス
 * アプリケーションクラッシュの詳細情報を収集・分析
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorMonitoringService from './errorMonitoringService';

export interface CrashReport {
  id: string;
  timestamp: Date;
  crashType: 'javascript' | 'native' | 'memory' | 'network' | 'unknown';
  severity: 'critical' | 'high';
  errorMessage: string;
  stackTrace: string;
  deviceInfo: DeviceInfo;
  appState: AppState;
  userActions: UserAction[];
  memoryInfo: MemoryInfo;
  networkInfo: NetworkInfo;
  customData?: Record<string, any>;
}

export interface DeviceInfo {
  platform: 'ios' | 'android';
  osVersion: string;
  deviceModel: string;
  appVersion: string;
  buildNumber: string;
  isDebug: boolean;
  locale: string;
  timezone: string;
}

export interface AppState {
  currentScreen: string;
  navigationStack: string[];
  userAuthenticated: boolean;
  backgroundTime?: number;
  foregroundTime: number;
  sessionDuration: number;
}

export interface UserAction {
  timestamp: Date;
  action: string;
  screen: string;
  data?: Record<string, any>;
}

export interface MemoryInfo {
  usedMemory?: number;
  totalMemory?: number;
  availableMemory?: number;
  memoryWarnings: number;
}

export interface NetworkInfo {
  connectionType: string;
  isConnected: boolean;
  lastNetworkError?: string;
  requestsInFlight: number;
}

class CrashReportingService {
  private static instance: CrashReportingService;
  private errorMonitoring: ErrorMonitoringService;
  private userActions: UserAction[] = [];
  private maxUserActions = 20;
  private sessionStartTime: Date;
  private memoryWarnings = 0;
  private requestsInFlight = 0;
  private currentScreen = 'Unknown';
  private navigationStack: string[] = [];

  private constructor() {
    this.errorMonitoring = ErrorMonitoringService.getInstance();
    this.sessionStartTime = new Date();
    this.setupCrashHandlers();
  }

  public static getInstance(): CrashReportingService {
    if (!CrashReportingService.instance) {
      CrashReportingService.instance = new CrashReportingService();
    }
    return CrashReportingService.instance;
  }

  /**
   * クラッシュレポートサービスの初期化
   */
  public async initialize(): Promise<void> {
    try {
      // 前回のクラッシュレポートをチェック
      await this.checkForPreviousCrashes();
      
      // メモリ警告の監視開始
      this.startMemoryMonitoring();
      
      console.log('Crash reporting service initialized');
    } catch (error) {
      console.error('Failed to initialize crash reporting service:', error);
    }
  }

  /**
   * ユーザーアクションの記録
   */
  public recordUserAction(action: string, screen: string, data?: Record<string, any>): void {
    const userAction: UserAction = {
      timestamp: new Date(),
      action,
      screen,
      data
    };

    this.userActions.push(userAction);
    
    // 最大数を超えた場合は古いものを削除
    if (this.userActions.length > this.maxUserActions) {
      this.userActions = this.userActions.slice(-this.maxUserActions);
    }

    // 現在の画面を更新
    this.currentScreen = screen;
  }

  /**
   * 画面遷移の記録
   */
  public recordScreenNavigation(screenName: string, action: 'push' | 'pop' | 'replace'): void {
    switch (action) {
      case 'push':
        this.navigationStack.push(screenName);
        break;
      case 'pop':
        this.navigationStack.pop();
        break;
      case 'replace':
        if (this.navigationStack.length > 0) {
          this.navigationStack[this.navigationStack.length - 1] = screenName;
        } else {
          this.navigationStack.push(screenName);
        }
        break;
    }

    this.currentScreen = screenName;
    this.recordUserAction('navigation', screenName, { action, stack: [...this.navigationStack] });
  }

  /**
   * ネットワークリクエストの開始記録
   */
  public recordNetworkRequestStart(): void {
    this.requestsInFlight++;
  }

  /**
   * ネットワークリクエストの完了記録
   */
  public recordNetworkRequestEnd(): void {
    if (this.requestsInFlight > 0) {
      this.requestsInFlight--;
    }
  }

  /**
   * メモリ警告の記録
   */
  public recordMemoryWarning(): void {
    this.memoryWarnings++;
    this.recordUserAction('memory_warning', this.currentScreen, {
      warningCount: this.memoryWarnings,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * カスタムクラッシュレポートの生成
   */
  public async generateCrashReport(
    error: Error,
    crashType: CrashReport['crashType'] = 'javascript',
    customData?: Record<string, any>
  ): Promise<CrashReport> {
    const crashReport: CrashReport = {
      id: this.generateCrashId(),
      timestamp: new Date(),
      crashType,
      severity: 'critical',
      errorMessage: error.message,
      stackTrace: error.stack || 'No stack trace available',
      deviceInfo: await this.getDeviceInfo(),
      appState: this.getAppState(),
      userActions: [...this.userActions],
      memoryInfo: await this.getMemoryInfo(),
      networkInfo: this.getNetworkInfo(),
      customData
    };

    return crashReport;
  }

  /**
   * クラッシュレポートの送信
   */
  public async submitCrashReport(crashReport: CrashReport): Promise<void> {
    try {
      // ローカルストレージに保存
      await this.storeCrashReport(crashReport);
      
      // エラー監視サービスに報告
      await this.errorMonitoring.reportCrash(
        new Error(crashReport.errorMessage),
        {
          crashReport: crashReport,
          crashType: crashReport.crashType,
          deviceInfo: crashReport.deviceInfo
        }
      );

      console.log(`Crash report submitted: ${crashReport.id}`);
    } catch (error) {
      console.error('Failed to submit crash report:', error);
    }
  }

  /**
   * 保存されたクラッシュレポートの取得
   */
  public async getStoredCrashReports(): Promise<CrashReport[]> {
    try {
      const reportsStr = await AsyncStorage.getItem('crash_reports');
      return reportsStr ? JSON.parse(reportsStr) : [];
    } catch (error) {
      console.error('Failed to get stored crash reports:', error);
      return [];
    }
  }

  /**
   * クラッシュレポートの削除
   */
  public async clearCrashReports(): Promise<void> {
    try {
      await AsyncStorage.removeItem('crash_reports');
      console.log('Crash reports cleared');
    } catch (error) {
      console.error('Failed to clear crash reports:', error);
    }
  }

  /**
   * クラッシュ統計の取得
   */
  public async getCrashStatistics(): Promise<{
    totalCrashes: number;
    crashesByType: Record<string, number>;
    recentCrashes: CrashReport[];
    crashRate: number;
  }> {
    try {
      const crashReports = await this.getStoredCrashReports();
      const crashesByType: Record<string, number> = {};

      crashReports.forEach(report => {
        crashesByType[report.crashType] = (crashesByType[report.crashType] || 0) + 1;
      });

      const sessionDuration = Date.now() - this.sessionStartTime.getTime();
      const crashRate = crashReports.length / (sessionDuration / (1000 * 60 * 60)); // crashes per hour

      return {
        totalCrashes: crashReports.length,
        crashesByType,
        recentCrashes: crashReports.slice(-5),
        crashRate
      };
    } catch (error) {
      console.error('Failed to get crash statistics:', error);
      return {
        totalCrashes: 0,
        crashesByType: {},
        recentCrashes: [],
        crashRate: 0
      };
    }
  }

  // プライベートメソッド

  private setupCrashHandlers(): void {
    // JavaScriptエラーハンドラー
    const originalHandler = global.ErrorUtils?.getGlobalHandler();
    
    global.ErrorUtils?.setGlobalHandler(async (error: Error, isFatal: boolean) => {
      if (isFatal) {
        const crashReport = await this.generateCrashReport(error, 'javascript', {
          isFatal,
          handlerType: 'global'
        });
        await this.submitCrashReport(crashReport);
      }
      
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    // Promise rejection ハンドラー
    global.onunhandledrejection = async (event: any) => {
      const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
      const crashReport = await this.generateCrashReport(error, 'javascript', {
        rejectionReason: event.reason,
        handlerType: 'promise'
      });
      await this.submitCrashReport(crashReport);
    };
  }

  private async checkForPreviousCrashes(): Promise<void> {
    try {
      const lastCrashCheck = await AsyncStorage.getItem('last_crash_check');
      const currentTime = Date.now();
      
      if (!lastCrashCheck || currentTime - parseInt(lastCrashCheck) > 24 * 60 * 60 * 1000) {
        // 24時間以上経過している場合、前回のクラッシュをチェック
        const crashReports = await this.getStoredCrashReports();
        if (crashReports.length > 0) {
          console.log(`Found ${crashReports.length} previous crash reports`);
          // 必要に応じて前回のクラッシュレポートを処理
        }
        
        await AsyncStorage.setItem('last_crash_check', currentTime.toString());
      }
    } catch (error) {
      console.error('Failed to check for previous crashes:', error);
    }
  }

  private startMemoryMonitoring(): void {
    // メモリ監視の実装（React Nativeの制限により簡易版）
    setInterval(() => {
      // 実際の実装では適切なメモリ監視を行う
      if (this.memoryWarnings > 3) {
        console.warn('Multiple memory warnings detected');
      }
    }, 30000); // 30秒ごとにチェック
  }

  private async storeCrashReport(crashReport: CrashReport): Promise<void> {
    try {
      const existingReports = await this.getStoredCrashReports();
      const updatedReports = [...existingReports, crashReport].slice(-50); // 最新50件を保持
      
      await AsyncStorage.setItem('crash_reports', JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Failed to store crash report:', error);
    }
  }

  private async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      platform: Platform.OS as 'ios' | 'android',
      osVersion: Platform.Version.toString(),
      deviceModel: 'Unknown', // 実際の実装では react-native-device-info を使用
      appVersion: '1.0.0',
      buildNumber: '1',
      isDebug: __DEV__,
      locale: 'ja-JP', // 実際の実装では適切なロケール取得
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private getAppState(): AppState {
    const currentTime = Date.now();
    const sessionDuration = currentTime - this.sessionStartTime.getTime();

    return {
      currentScreen: this.currentScreen,
      navigationStack: [...this.navigationStack],
      userAuthenticated: false, // 実際の実装では認証状態を取得
      foregroundTime: sessionDuration,
      sessionDuration
    };
  }

  private async getMemoryInfo(): Promise<MemoryInfo> {
    return {
      memoryWarnings: this.memoryWarnings,
      // 実際の実装では適切なメモリ情報を取得
    };
  }

  private getNetworkInfo(): NetworkInfo {
    return {
      connectionType: 'unknown', // 実際の実装では @react-native-community/netinfo を使用
      isConnected: true,
      requestsInFlight: this.requestsInFlight
    };
  }

  private generateCrashId(): string {
    return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default CrashReportingService;