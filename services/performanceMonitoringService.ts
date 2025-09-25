/**
 * パフォーマンス監視サービス
 * アプリのレスポンス時間、メモリ・CPU使用率、ネットワーク通信、ユーザー体験指標を監視
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

export interface PerformanceMetrics {
  id: string;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  appVersion: string;
  platform: 'ios' | 'android';
  
  // レスポンス時間メトリクス
  responseTime?: {
    screenTransition: number; // ms
    apiCall: number; // ms
    databaseQuery: number; // ms
    renderTime: number; // ms
  };
  
  // メモリ・CPU使用率
  systemMetrics?: {
    memoryUsage: number; // MB
    cpuUsage: number; // percentage
    batteryLevel?: number; // percentage
    networkType: string;
  };
  
  // ネットワーク通信メトリクス
  networkMetrics?: {
    requestCount: number;
    totalDataTransferred: number; // bytes
    averageLatency: number; // ms
    errorRate: number; // percentage
    slowRequestCount: number;
  };
  
  // ユーザー体験指標
  userExperienceMetrics?: {
    appStartTime: number; // ms
    timeToInteractive: number; // ms
    frameDropCount: number;
    crashCount: number;
    anrCount: number; // Application Not Responding
  };
  
  metadata?: Record<string, any>;
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  type: 'response_time' | 'memory' | 'cpu' | 'network' | 'user_experience';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: Partial<PerformanceMetrics>;
  threshold: number;
  actualValue: number;
}

export interface PerformanceThresholds {
  responseTime: {
    screenTransition: number; // ms
    apiCall: number; // ms
    databaseQuery: number; // ms
    renderTime: number; // ms
  };
  systemMetrics: {
    memoryUsage: number; // MB
    cpuUsage: number; // percentage
  };
  networkMetrics: {
    latency: number; // ms
    errorRate: number; // percentage
  };
  userExperience: {
    appStartTime: number; // ms
    timeToInteractive: number; // ms
    frameDropRate: number; // percentage
  };
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private sessionId: string;
  private isInitialized = false;
  private metricsQueue: PerformanceMetrics[] = [];
  private alertQueue: PerformanceAlert[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private networkRequests: Map<string, { startTime: number; size: number }> = new Map();
  
  // パフォーマンス閾値
  private thresholds: PerformanceThresholds = {
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
  };

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * パフォーマンス監視システムの初期化
   */
  public async initialize(): Promise<void> {
    try {
      // 設定の読み込み
      await this.loadConfiguration();
      
      // システムメトリクス監視の開始
      this.startSystemMetricsMonitoring();
      
      // アプリ状態変化の監視
      this.setupAppStateMonitoring();
      
      // ネットワーク監視の設定
      this.setupNetworkMonitoring();
      
      this.isInitialized = true;
      console.log('Performance monitoring system initialized');
      
      // 初期化完了メトリクスの記録
      await this.recordMetrics({
        id: this.generateMetricsId(),
        timestamp: new Date(),
        sessionId: this.sessionId,
        appVersion: this.getAppVersion(),
        platform: this.getPlatform(),
        metadata: { event: 'monitoring_initialized' }
      });
      
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * レスポンス時間の記録
   */
  public async recordResponseTime(
    type: keyof PerformanceThresholds['responseTime'],
    duration: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.isInitialized) return;

    const metrics: PerformanceMetrics = {
      id: this.generateMetricsId(),
      timestamp: new Date(),
      sessionId: this.sessionId,
      appVersion: this.getAppVersion(),
      platform: this.getPlatform(),
      responseTime: {
        screenTransition: type === 'screenTransition' ? duration : 0,
        apiCall: type === 'apiCall' ? duration : 0,
        databaseQuery: type === 'databaseQuery' ? duration : 0,
        renderTime: type === 'renderTime' ? duration : 0,
      },
      metadata: { ...metadata, responseTimeType: type }
    };

    await this.processMetrics(metrics);

    // 閾値チェック
    const threshold = this.thresholds.responseTime[type];
    if (duration > threshold) {
      await this.createAlert('response_time', 'high', 
        `${type} exceeded threshold: ${duration}ms > ${threshold}ms`, 
        metrics, threshold, duration);
    }
  }

  /**
   * システムメトリクスの記録
   */
  public async recordSystemMetrics(
    memoryUsage: number,
    cpuUsage: number,
    batteryLevel?: number,
    networkType?: string
  ): Promise<void> {
    if (!this.isInitialized) return;

    const metrics: PerformanceMetrics = {
      id: this.generateMetricsId(),
      timestamp: new Date(),
      sessionId: this.sessionId,
      appVersion: this.getAppVersion(),
      platform: this.getPlatform(),
      systemMetrics: {
        memoryUsage,
        cpuUsage,
        batteryLevel,
        networkType: networkType || 'unknown'
      }
    };

    await this.processMetrics(metrics);

    // メモリ使用量の閾値チェック
    if (memoryUsage > this.thresholds.systemMetrics.memoryUsage) {
      await this.createAlert('memory', 'high',
        `Memory usage exceeded threshold: ${memoryUsage}MB > ${this.thresholds.systemMetrics.memoryUsage}MB`,
        metrics, this.thresholds.systemMetrics.memoryUsage, memoryUsage);
    }

    // CPU使用率の閾値チェック
    if (cpuUsage > this.thresholds.systemMetrics.cpuUsage) {
      await this.createAlert('cpu', 'high',
        `CPU usage exceeded threshold: ${cpuUsage}% > ${this.thresholds.systemMetrics.cpuUsage}%`,
        metrics, this.thresholds.systemMetrics.cpuUsage, cpuUsage);
    }
  }

  /**
   * ネットワークリクエストの開始記録
   */
  public recordNetworkRequestStart(requestId: string, url: string): void {
    if (!this.isInitialized) return;

    this.networkRequests.set(requestId, {
      startTime: Date.now(),
      size: 0
    });
  }

  /**
   * ネットワークリクエストの完了記録
   */
  public async recordNetworkRequestEnd(
    requestId: string,
    success: boolean,
    responseSize: number = 0,
    statusCode?: number
  ): Promise<void> {
    if (!this.isInitialized) return;

    const request = this.networkRequests.get(requestId);
    if (!request) return;

    const duration = Date.now() - request.startTime;
    this.networkRequests.delete(requestId);

    // ネットワークメトリクスの更新
    await this.updateNetworkMetrics(duration, success, responseSize);

    // 遅いリクエストの検出
    if (duration > this.thresholds.networkMetrics.latency) {
      const metrics: PerformanceMetrics = {
        id: this.generateMetricsId(),
        timestamp: new Date(),
        sessionId: this.sessionId,
        appVersion: this.getAppVersion(),
        platform: this.getPlatform(),
        networkMetrics: {
          requestCount: 1,
          totalDataTransferred: responseSize,
          averageLatency: duration,
          errorRate: success ? 0 : 100,
          slowRequestCount: 1
        },
        metadata: { requestId, statusCode, slow: true }
      };

      await this.createAlert('network', 'medium',
        `Slow network request detected: ${duration}ms > ${this.thresholds.networkMetrics.latency}ms`,
        metrics, this.thresholds.networkMetrics.latency, duration);
    }
  }

  /**
   * ユーザー体験メトリクスの記録
   */
  public async recordUserExperienceMetrics(
    appStartTime?: number,
    timeToInteractive?: number,
    frameDropCount?: number,
    crashCount?: number,
    anrCount?: number
  ): Promise<void> {
    if (!this.isInitialized) return;

    const metrics: PerformanceMetrics = {
      id: this.generateMetricsId(),
      timestamp: new Date(),
      sessionId: this.sessionId,
      appVersion: this.getAppVersion(),
      platform: this.getPlatform(),
      userExperienceMetrics: {
        appStartTime: appStartTime || 0,
        timeToInteractive: timeToInteractive || 0,
        frameDropCount: frameDropCount || 0,
        crashCount: crashCount || 0,
        anrCount: anrCount || 0
      }
    };

    await this.processMetrics(metrics);

    // アプリ起動時間の閾値チェック
    if (appStartTime && appStartTime > this.thresholds.userExperience.appStartTime) {
      await this.createAlert('user_experience', 'medium',
        `App start time exceeded threshold: ${appStartTime}ms > ${this.thresholds.userExperience.appStartTime}ms`,
        metrics, this.thresholds.userExperience.appStartTime, appStartTime);
    }

    // インタラクティブ時間の閾値チェック
    if (timeToInteractive && timeToInteractive > this.thresholds.userExperience.timeToInteractive) {
      await this.createAlert('user_experience', 'medium',
        `Time to interactive exceeded threshold: ${timeToInteractive}ms > ${this.thresholds.userExperience.timeToInteractive}ms`,
        metrics, this.thresholds.userExperience.timeToInteractive, timeToInteractive);
    }
  }

  /**
   * パフォーマンス統計の取得
   */
  public async getPerformanceStatistics(): Promise<{
    totalMetrics: number;
    averageResponseTimes: Record<string, number>;
    systemMetricsAverage: Record<string, number>;
    networkStatistics: Record<string, number>;
    userExperienceStatistics: Record<string, number>;
    recentAlerts: PerformanceAlert[];
  }> {
    try {
      const storedMetrics = await this.getStoredMetrics();
      const allMetrics = [...this.metricsQueue, ...storedMetrics];

      // レスポンス時間の平均計算
      const responseTimeTotals = { screenTransition: 0, apiCall: 0, databaseQuery: 0, renderTime: 0 };
      const responseTimeCounts = { screenTransition: 0, apiCall: 0, databaseQuery: 0, renderTime: 0 };

      // システムメトリクスの平均計算
      const systemMetricsTotals = { memoryUsage: 0, cpuUsage: 0 };
      let systemMetricsCount = 0;

      // ネットワーク統計の計算
      let totalRequests = 0;
      let totalLatency = 0;
      let totalErrors = 0;
      let totalDataTransferred = 0;

      // ユーザー体験統計の計算
      const uxTotals = { appStartTime: 0, timeToInteractive: 0, frameDropCount: 0 };
      let uxCount = 0;

      allMetrics.forEach(metric => {
        // レスポンス時間の集計
        if (metric.responseTime) {
          Object.entries(metric.responseTime).forEach(([key, value]) => {
            if (value > 0) {
              responseTimeTotals[key as keyof typeof responseTimeTotals] += value;
              responseTimeCounts[key as keyof typeof responseTimeCounts]++;
            }
          });
        }

        // システムメトリクスの集計
        if (metric.systemMetrics) {
          systemMetricsTotals.memoryUsage += metric.systemMetrics.memoryUsage;
          systemMetricsTotals.cpuUsage += metric.systemMetrics.cpuUsage;
          systemMetricsCount++;
        }

        // ネットワーク統計の集計
        if (metric.networkMetrics) {
          totalRequests += metric.networkMetrics.requestCount;
          totalLatency += metric.networkMetrics.averageLatency * metric.networkMetrics.requestCount;
          totalErrors += (metric.networkMetrics.errorRate / 100) * metric.networkMetrics.requestCount;
          totalDataTransferred += metric.networkMetrics.totalDataTransferred;
        }

        // ユーザー体験統計の集計
        if (metric.userExperienceMetrics) {
          uxTotals.appStartTime += metric.userExperienceMetrics.appStartTime;
          uxTotals.timeToInteractive += metric.userExperienceMetrics.timeToInteractive;
          uxTotals.frameDropCount += metric.userExperienceMetrics.frameDropCount;
          uxCount++;
        }
      });

      // 平均値の計算
      const averageResponseTimes = Object.fromEntries(
        Object.entries(responseTimeTotals).map(([key, total]) => [
          key,
          responseTimeCounts[key as keyof typeof responseTimeCounts] > 0 
            ? total / responseTimeCounts[key as keyof typeof responseTimeCounts] 
            : 0
        ])
      );

      const systemMetricsAverage = systemMetricsCount > 0 ? {
        memoryUsage: systemMetricsTotals.memoryUsage / systemMetricsCount,
        cpuUsage: systemMetricsTotals.cpuUsage / systemMetricsCount
      } : { memoryUsage: 0, cpuUsage: 0 };

      const networkStatistics = {
        totalRequests,
        averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
        totalDataTransferred
      };

      const userExperienceStatistics = uxCount > 0 ? {
        averageAppStartTime: uxTotals.appStartTime / uxCount,
        averageTimeToInteractive: uxTotals.timeToInteractive / uxCount,
        averageFrameDropCount: uxTotals.frameDropCount / uxCount
      } : { averageAppStartTime: 0, averageTimeToInteractive: 0, averageFrameDropCount: 0 };

      return {
        totalMetrics: allMetrics.length,
        averageResponseTimes,
        systemMetricsAverage,
        networkStatistics,
        userExperienceStatistics,
        recentAlerts: this.alertQueue.slice(-10)
      };

    } catch (error) {
      console.error('Failed to get performance statistics:', error);
      return {
        totalMetrics: 0,
        averageResponseTimes: {},
        systemMetricsAverage: {},
        networkStatistics: {},
        userExperienceStatistics: {},
        recentAlerts: []
      };
    }
  }

  /**
   * パフォーマンス閾値の更新
   */
  public updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.saveConfiguration();
  }

  /**
   * 監視の停止
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isInitialized = false;
    console.log('Performance monitoring stopped');
  }

  // プライベートメソッド

  private async processMetrics(metrics: PerformanceMetrics): Promise<void> {
    this.metricsQueue.push(metrics);
    await this.storeMetrics(metrics);
    this.manageQueueSize();
  }

  private async createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    metrics: PerformanceMetrics,
    threshold: number,
    actualValue: number
  ): Promise<void> {
    const alert: PerformanceAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      type,
      severity,
      message,
      metrics,
      threshold,
      actualValue
    };

    this.alertQueue.push(alert);
    await this.storeAlert(alert);
    
    console.warn(`Performance Alert [${severity.toUpperCase()}]: ${message}`);
  }

  private startSystemMetricsMonitoring(): void {
    // 30秒ごとにシステムメトリクスを収集
    this.monitoringInterval = setInterval(async () => {
      try {
        const memoryUsage = await this.getMemoryUsage();
        const cpuUsage = await this.getCPUUsage();
        const batteryLevel = await this.getBatteryLevel();
        const networkType = await this.getNetworkType();

        await this.recordSystemMetrics(memoryUsage, cpuUsage, batteryLevel, networkType);
      } catch (error) {
        console.error('Failed to collect system metrics:', error);
      }
    }, 30000);
  }

  private setupAppStateMonitoring(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.recordMetrics({
        id: this.generateMetricsId(),
        timestamp: new Date(),
        sessionId: this.sessionId,
        appVersion: this.getAppVersion(),
        platform: this.getPlatform(),
        metadata: { event: 'app_state_change', state: nextAppState }
      });
    });
  }

  private setupNetworkMonitoring(): void {
    // ネットワーク監視の設定
    // 実際の実装では、XMLHttpRequestやfetchのインターセプトを行う
    console.log('Network monitoring setup completed');
  }

  private async updateNetworkMetrics(
    latency: number,
    success: boolean,
    responseSize: number
  ): Promise<void> {
    // ネットワークメトリクスの更新ロジック
    // 実際の実装では、累積統計を管理する
  }

  private async getMemoryUsage(): Promise<number> {
    // React Nativeでのメモリ使用量取得
    // 実際の実装では、ネイティブモジュールを使用
    return Math.random() * 100 + 50; // モック値
  }

  private async getCPUUsage(): Promise<number> {
    // React NativeでのCPU使用率取得
    // 実際の実装では、ネイティブモジュールを使用
    return Math.random() * 50 + 10; // モック値
  }

  private async getBatteryLevel(): Promise<number> {
    // React Nativeでのバッテリーレベル取得
    // 実際の実装では、expo-batteryなどを使用
    return Math.random() * 100; // モック値
  }

  private async getNetworkType(): Promise<string> {
    // React Nativeでのネットワークタイプ取得
    // 実際の実装では、@react-native-community/netinfoを使用
    return 'wifi'; // モック値
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const configStr = await AsyncStorage.getItem('performance_monitoring_config');
      if (configStr) {
        const config = JSON.parse(configStr);
        this.thresholds = { ...this.thresholds, ...config.thresholds };
      }
    } catch (error) {
      console.warn('Failed to load performance monitoring configuration:', error);
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'performance_monitoring_config',
        JSON.stringify({ thresholds: this.thresholds })
      );
    } catch (error) {
      console.error('Failed to save performance monitoring configuration:', error);
    }
  }

  private async storeMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      const existingMetrics = await this.getStoredMetrics();
      const updatedMetrics = [...existingMetrics, metrics].slice(-500); // 最新500件を保持
      
      await AsyncStorage.setItem('performance_metrics', JSON.stringify(updatedMetrics));
    } catch (error) {
      console.error('Failed to store performance metrics:', error);
    }
  }

  private async getStoredMetrics(): Promise<PerformanceMetrics[]> {
    try {
      const metricsStr = await AsyncStorage.getItem('performance_metrics');
      return metricsStr ? JSON.parse(metricsStr) : [];
    } catch (error) {
      console.error('Failed to get stored metrics:', error);
      return [];
    }
  }

  private async storeAlert(alert: PerformanceAlert): Promise<void> {
    try {
      const existingAlerts = await this.getStoredAlerts();
      const updatedAlerts = [...existingAlerts, alert].slice(-100); // 最新100件を保持
      
      await AsyncStorage.setItem('performance_alerts', JSON.stringify(updatedAlerts));
    } catch (error) {
      console.error('Failed to store performance alert:', error);
    }
  }

  private async getStoredAlerts(): Promise<PerformanceAlert[]> {
    try {
      const alertsStr = await AsyncStorage.getItem('performance_alerts');
      return alertsStr ? JSON.parse(alertsStr) : [];
    } catch (error) {
      console.error('Failed to get stored alerts:', error);
      return [];
    }
  }

  private manageQueueSize(): void {
    if (this.metricsQueue.length > 100) {
      this.metricsQueue = this.metricsQueue.slice(-100);
    }
    if (this.alertQueue.length > 50) {
      this.alertQueue = this.alertQueue.slice(-50);
    }
  }

  private generateSessionId(): string {
    return `perf_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMetricsId(): string {
    return `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAppVersion(): string {
    return '1.0.0';
  }

  private getPlatform(): 'ios' | 'android' {
    // 実際の実装では Platform.OS を使用
    return 'ios';
  }
}

export default PerformanceMonitoringService;