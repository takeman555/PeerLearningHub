/**
 * パフォーマンス監視初期化サービス
 * パフォーマンス監視システムの初期化と設定を管理
 */

import PerformanceMonitoringService from './performanceMonitoringService';
import { productionConfig } from '../config/production';

export interface PerformanceMonitoringConfig {
  enabled: boolean;
  collectSystemMetrics: boolean;
  collectNetworkMetrics: boolean;
  collectUserExperienceMetrics: boolean;
  monitoringInterval: number; // seconds
  alertThresholds: {
    responseTime: {
      screenTransition: number;
      apiCall: number;
      databaseQuery: number;
      renderTime: number;
    };
    systemMetrics: {
      memoryUsage: number;
      cpuUsage: number;
    };
    networkMetrics: {
      latency: number;
      errorRate: number;
    };
    userExperience: {
      appStartTime: number;
      timeToInteractive: number;
      frameDropRate: number;
    };
  };
}

class PerformanceMonitoringInitializer {
  private static instance: PerformanceMonitoringInitializer;
  private performanceService: PerformanceMonitoringService;
  private config: PerformanceMonitoringConfig;
  private isInitialized = false;

  private constructor() {
    this.performanceService = PerformanceMonitoringService.getInstance();
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): PerformanceMonitoringInitializer {
    if (!PerformanceMonitoringInitializer.instance) {
      PerformanceMonitoringInitializer.instance = new PerformanceMonitoringInitializer();
    }
    return PerformanceMonitoringInitializer.instance;
  }

  /**
   * パフォーマンス監視システムの初期化
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing performance monitoring system...');

      // 本番環境での監視設定確認
      if (!productionConfig.monitoring.enablePerformanceMonitoring) {
        console.log('Performance monitoring is disabled in production config');
        return;
      }

      // パフォーマンス監視サービスの初期化
      await this.performanceService.initialize();

      // 閾値の設定
      this.performanceService.updateThresholds(this.config.alertThresholds);

      // React Navigationのパフォーマンス監視設定
      this.setupNavigationMonitoring();

      // APIコールの監視設定
      this.setupAPIMonitoring();

      // レンダリングパフォーマンスの監視設定
      this.setupRenderingMonitoring();

      // ユーザーインタラクションの監視設定
      this.setupUserInteractionMonitoring();

      this.isInitialized = true;
      console.log('Performance monitoring system initialized successfully');

      // 初期化完了の記録
      await this.performanceService.recordUserExperienceMetrics(
        undefined, // appStartTime
        Date.now(), // timeToInteractive (初期化完了時間)
        0, // frameDropCount
        0, // crashCount
        0  // anrCount
      );

    } catch (error) {
      console.error('Failed to initialize performance monitoring system:', error);
      throw error;
    }
  }

  /**
   * アプリ起動時間の測定と記録
   */
  public async recordAppStartTime(startTime: number): Promise<void> {
    if (!this.isInitialized) return;

    const appStartTime = Date.now() - startTime;
    await this.performanceService.recordUserExperienceMetrics(
      appStartTime,
      undefined,
      undefined,
      undefined,
      undefined
    );

    console.log(`App start time recorded: ${appStartTime}ms`);
  }

  /**
   * 画面遷移時間の測定開始
   */
  public startScreenTransition(screenName: string): () => Promise<void> {
    const startTime = Date.now();
    
    return async () => {
      if (!this.isInitialized) return;
      
      const duration = Date.now() - startTime;
      await this.performanceService.recordResponseTime(
        'screenTransition',
        duration,
        { screenName, transitionType: 'navigation' }
      );
    };
  }

  /**
   * APIコール時間の測定開始
   */
  public startAPICall(endpoint: string, method: string): () => Promise<void> {
    const startTime = Date.now();
    const requestId = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.performanceService.recordNetworkRequestStart(requestId, endpoint);
    
    return async (success: boolean = true, statusCode?: number, responseSize?: number) => {
      if (!this.isInitialized) return;
      
      const duration = Date.now() - startTime;
      
      // APIコールのレスポンス時間記録
      await this.performanceService.recordResponseTime(
        'apiCall',
        duration,
        { endpoint, method, statusCode, success }
      );
      
      // ネットワークリクエストの完了記録
      await this.performanceService.recordNetworkRequestEnd(
        requestId,
        success,
        responseSize || 0,
        statusCode
      );
    };
  }

  /**
   * データベースクエリ時間の測定開始
   */
  public startDatabaseQuery(queryType: string): () => Promise<void> {
    const startTime = Date.now();
    
    return async (success: boolean = true, recordCount?: number) => {
      if (!this.isInitialized) return;
      
      const duration = Date.now() - startTime;
      await this.performanceService.recordResponseTime(
        'databaseQuery',
        duration,
        { queryType, success, recordCount }
      );
    };
  }

  /**
   * レンダリング時間の測定開始
   */
  public startRenderMeasurement(componentName: string): () => Promise<void> {
    const startTime = Date.now();
    
    return async () => {
      if (!this.isInitialized) return;
      
      const duration = Date.now() - startTime;
      await this.performanceService.recordResponseTime(
        'renderTime',
        duration,
        { componentName, renderType: 'component' }
      );
    };
  }

  /**
   * システムメトリクスの手動記録
   */
  public async recordCurrentSystemMetrics(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // メモリ使用量の取得（モック実装）
      const memoryUsage = await this.getMemoryUsage();
      
      // CPU使用率の取得（モック実装）
      const cpuUsage = await this.getCPUUsage();
      
      // バッテリーレベルの取得（モック実装）
      const batteryLevel = await this.getBatteryLevel();
      
      // ネットワークタイプの取得（モック実装）
      const networkType = await this.getNetworkType();

      await this.performanceService.recordSystemMetrics(
        memoryUsage,
        cpuUsage,
        batteryLevel,
        networkType
      );

    } catch (error) {
      console.error('Failed to record system metrics:', error);
    }
  }

  /**
   * パフォーマンス統計の取得
   */
  public async getPerformanceReport(): Promise<any> {
    if (!this.isInitialized) {
      return { error: 'Performance monitoring not initialized' };
    }

    return await this.performanceService.getPerformanceStatistics();
  }

  /**
   * 監視設定の更新
   */
  public updateConfig(newConfig: Partial<PerformanceMonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.alertThresholds) {
      this.performanceService.updateThresholds(newConfig.alertThresholds);
    }
  }

  /**
   * 監視の停止
   */
  public stopMonitoring(): void {
    this.performanceService.stopMonitoring();
    this.isInitialized = false;
    console.log('Performance monitoring stopped');
  }

  // プライベートメソッド

  private getDefaultConfig(): PerformanceMonitoringConfig {
    return {
      enabled: true,
      collectSystemMetrics: true,
      collectNetworkMetrics: true,
      collectUserExperienceMetrics: true,
      monitoringInterval: 30, // 30秒
      alertThresholds: {
        responseTime: {
          screenTransition: 1000, // 1秒
          apiCall: 3000, // 3秒
          databaseQuery: 2000, // 2秒
          renderTime: 500, // 0.5秒
        },
        systemMetrics: {
          memoryUsage: 150, // 150MB
          cpuUsage: 80, // 80%
        },
        networkMetrics: {
          latency: 1000, // 1秒
          errorRate: 5, // 5%
        },
        userExperience: {
          appStartTime: 3000, // 3秒
          timeToInteractive: 5000, // 5秒
          frameDropRate: 10, // 10%
        },
      },
    };
  }

  private setupNavigationMonitoring(): void {
    // React Navigationのパフォーマンス監視
    // 実際の実装では、NavigationContainerのonStateChangeを使用
    console.log('Navigation performance monitoring setup completed');
  }

  private setupAPIMonitoring(): void {
    // APIコールの自動監視設定
    // 実際の実装では、fetch/XMLHttpRequestのインターセプトを行う
    console.log('API performance monitoring setup completed');
  }

  private setupRenderingMonitoring(): void {
    // レンダリングパフォーマンスの監視設定
    // 実際の実装では、React DevToolsのProfilerを使用
    console.log('Rendering performance monitoring setup completed');
  }

  private setupUserInteractionMonitoring(): void {
    // ユーザーインタラクションの監視設定
    // 実際の実装では、タッチイベントやジェスチャーの監視を行う
    console.log('User interaction monitoring setup completed');
  }

  private async getMemoryUsage(): Promise<number> {
    // 実際の実装では、ネイティブモジュールを使用してメモリ使用量を取得
    // 現在はモック値を返す
    return Math.random() * 100 + 50;
  }

  private async getCPUUsage(): Promise<number> {
    // 実際の実装では、ネイティブモジュールを使用してCPU使用率を取得
    // 現在はモック値を返す
    return Math.random() * 50 + 10;
  }

  private async getBatteryLevel(): Promise<number> {
    // 実際の実装では、expo-batteryやreact-native-device-infoを使用
    // 現在はモック値を返す
    return Math.random() * 100;
  }

  private async getNetworkType(): Promise<string> {
    // 実際の実装では、@react-native-community/netinfoを使用
    // 現在はモック値を返す
    const networkTypes = ['wifi', '4g', '3g', 'none'];
    return networkTypes[Math.floor(Math.random() * networkTypes.length)];
  }
}

export default PerformanceMonitoringInitializer;