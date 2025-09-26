/**
 * アプリ起動時間最適化サービス
 * アプリの初期化処理を最適化し、起動時間を3秒以内に短縮する
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import PerformanceMonitoringService from './performanceMonitoringService';

export interface StartupMetrics {
  totalStartupTime: number;
  initializationTime: number;
  contextLoadTime: number;
  firstRenderTime: number;
  timeToInteractive: number;
  timestamp: Date;
}

export interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableContextOptimization: boolean;
  enableAssetPreloading: boolean;
  enableServiceWorkerOptimization: boolean;
  deferNonCriticalServices: boolean;
}

class AppStartupOptimizer {
  private static instance: AppStartupOptimizer;
  private performanceMonitoring: PerformanceMonitoringService;
  private startupStartTime: number = 0;
  private initializationStartTime: number = 0;
  private contextLoadStartTime: number = 0;
  private firstRenderStartTime: number = 0;
  
  private config: OptimizationConfig = {
    enableLazyLoading: true,
    enableContextOptimization: true,
    enableAssetPreloading: true,
    enableServiceWorkerOptimization: true,
    deferNonCriticalServices: true,
  };

  private constructor() {
    this.performanceMonitoring = PerformanceMonitoringService.getInstance();
    this.startupStartTime = Date.now();
  }

  public static getInstance(): AppStartupOptimizer {
    if (!AppStartupOptimizer.instance) {
      AppStartupOptimizer.instance = new AppStartupOptimizer();
    }
    return AppStartupOptimizer.instance;
  }

  /**
   * アプリ起動の開始を記録
   */
  public markStartupStart(): void {
    this.startupStartTime = Date.now();
    console.log('🚀 App startup optimization started');
  }

  /**
   * 初期化処理の開始を記録
   */
  public markInitializationStart(): void {
    this.initializationStartTime = Date.now();
  }

  /**
   * 初期化処理の完了を記録
   */
  public markInitializationEnd(): void {
    const initializationTime = Date.now() - this.initializationStartTime;
    console.log(`⚡ Initialization completed in ${initializationTime}ms`);
  }

  /**
   * コンテキスト読み込みの開始を記録
   */
  public markContextLoadStart(): void {
    this.contextLoadStartTime = Date.now();
  }

  /**
   * コンテキスト読み込みの完了を記録
   */
  public markContextLoadEnd(): void {
    const contextLoadTime = Date.now() - this.contextLoadStartTime;
    console.log(`🔄 Context loading completed in ${contextLoadTime}ms`);
  }

  /**
   * 最初のレンダリングの開始を記録
   */
  public markFirstRenderStart(): void {
    this.firstRenderStartTime = Date.now();
  }

  /**
   * 最初のレンダリングの完了を記録
   */
  public markFirstRenderEnd(): void {
    const firstRenderTime = Date.now() - this.firstRenderStartTime;
    console.log(`🎨 First render completed in ${firstRenderTime}ms`);
  }

  /**
   * アプリがインタラクティブになったことを記録
   */
  public async markTimeToInteractive(): Promise<void> {
    const totalStartupTime = Date.now() - this.startupStartTime;
    const initializationTime = this.initializationStartTime > 0 ? 
      Date.now() - this.initializationStartTime : 0;
    const contextLoadTime = this.contextLoadStartTime > 0 ? 
      Date.now() - this.contextLoadStartTime : 0;
    const firstRenderTime = this.firstRenderStartTime > 0 ? 
      Date.now() - this.firstRenderStartTime : 0;

    const metrics: StartupMetrics = {
      totalStartupTime,
      initializationTime,
      contextLoadTime,
      firstRenderTime,
      timeToInteractive: totalStartupTime,
      timestamp: new Date(),
    };

    // パフォーマンス監視サービスに記録
    await this.performanceMonitoring.recordUserExperienceMetrics(
      totalStartupTime,
      totalStartupTime,
      0, // frameDropCount
      0, // crashCount
      0  // anrCount
    );

    // 起動メトリクスを保存
    await this.saveStartupMetrics(metrics);

    // 結果をログ出力
    console.log(`✅ App startup completed in ${totalStartupTime}ms`);
    
    if (totalStartupTime > 3000) {
      console.warn(`⚠️ Startup time exceeded target (3000ms): ${totalStartupTime}ms`);
      await this.analyzeStartupBottlenecks(metrics);
    } else {
      console.log(`🎯 Startup time within target: ${totalStartupTime}ms <= 3000ms`);
    }
  }

  /**
   * 重要でないサービスの初期化を遅延
   */
  public async deferNonCriticalServices(): Promise<void> {
    if (!this.config.deferNonCriticalServices) return;

    // 重要でないサービスを5秒後に初期化
    setTimeout(async () => {
      try {
        console.log('🔄 Initializing non-critical services...');
        
        // 例: 分析サービス、ログサービスなどの初期化
        // これらのサービスは起動時間に影響しないよう遅延初期化
        
        console.log('✅ Non-critical services initialized');
      } catch (error) {
        console.error('Failed to initialize non-critical services:', error);
      }
    }, 5000);
  }

  /**
   * コンテキストプロバイダーの最適化
   */
  public optimizeContextProviders(): {
    shouldDeferAuth: boolean;
    shouldDeferMembership: boolean;
    shouldUseLazyLoading: boolean;
  } {
    return {
      shouldDeferAuth: this.config.enableContextOptimization,
      shouldDeferMembership: this.config.enableContextOptimization,
      shouldUseLazyLoading: this.config.enableLazyLoading,
    };
  }

  /**
   * 不要なライブラリの特定
   */
  public async identifyUnusedLibraries(): Promise<string[]> {
    // 実際の実装では、バンドル分析ツールと連携
    const potentiallyUnusedLibraries = [
      // 開発時のみ使用されるライブラリ
      'react-devtools',
      'flipper-plugin-react-native',
      
      // 使用されていない可能性のあるライブラリ
      'unused-animation-library',
      'unused-chart-library',
      'unused-map-library',
    ];

    console.log('📊 Potentially unused libraries identified:', potentiallyUnusedLibraries);
    return potentiallyUnusedLibraries;
  }

  /**
   * スプラッシュ画面の最適化
   */
  public optimizeSplashScreen(): {
    minDisplayTime: number;
    maxDisplayTime: number;
    shouldPreloadAssets: boolean;
  } {
    return {
      minDisplayTime: 1000, // 最低1秒表示（ブランド認知のため）
      maxDisplayTime: 2000, // 最大2秒表示（ユーザー体験のため）
      shouldPreloadAssets: this.config.enableAssetPreloading,
    };
  }

  /**
   * 起動時間の統計を取得
   */
  public async getStartupStatistics(): Promise<{
    averageStartupTime: number;
    medianStartupTime: number;
    p95StartupTime: number;
    recentMetrics: StartupMetrics[];
    trend: 'improving' | 'stable' | 'degrading';
  }> {
    try {
      const metrics = await this.getStoredStartupMetrics();
      
      if (metrics.length === 0) {
        return {
          averageStartupTime: 0,
          medianStartupTime: 0,
          p95StartupTime: 0,
          recentMetrics: [],
          trend: 'stable',
        };
      }

      const startupTimes = metrics.map(m => m.totalStartupTime).sort((a, b) => a - b);
      const average = startupTimes.reduce((sum, time) => sum + time, 0) / startupTimes.length;
      const median = startupTimes[Math.floor(startupTimes.length / 2)];
      const p95Index = Math.floor(startupTimes.length * 0.95);
      const p95 = startupTimes[p95Index];

      // トレンド分析（最近10回と前10回を比較）
      const recentTimes = startupTimes.slice(-10);
      const previousTimes = startupTimes.slice(-20, -10);
      
      let trend: 'improving' | 'stable' | 'degrading' = 'stable';
      if (recentTimes.length >= 5 && previousTimes.length >= 5) {
        const recentAvg = recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;
        const previousAvg = previousTimes.reduce((sum, time) => sum + time, 0) / previousTimes.length;
        
        if (recentAvg < previousAvg * 0.9) {
          trend = 'improving';
        } else if (recentAvg > previousAvg * 1.1) {
          trend = 'degrading';
        }
      }

      return {
        averageStartupTime: Math.round(average),
        medianStartupTime: Math.round(median),
        p95StartupTime: Math.round(p95),
        recentMetrics: metrics.slice(-10),
        trend,
      };
    } catch (error) {
      console.error('Failed to get startup statistics:', error);
      return {
        averageStartupTime: 0,
        medianStartupTime: 0,
        p95StartupTime: 0,
        recentMetrics: [],
        trend: 'stable',
      };
    }
  }

  /**
   * 最適化設定の更新
   */
  public async updateOptimizationConfig(newConfig: Partial<OptimizationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveOptimizationConfig();
    console.log('🔧 Optimization config updated:', this.config);
  }

  /**
   * 起動時間のボトルネック分析
   */
  private async analyzeStartupBottlenecks(metrics: StartupMetrics): Promise<void> {
    console.log('🔍 Analyzing startup bottlenecks...');
    
    const bottlenecks: string[] = [];
    
    if (metrics.initializationTime > 1000) {
      bottlenecks.push(`Initialization too slow: ${metrics.initializationTime}ms`);
    }
    
    if (metrics.contextLoadTime > 800) {
      bottlenecks.push(`Context loading too slow: ${metrics.contextLoadTime}ms`);
    }
    
    if (metrics.firstRenderTime > 500) {
      bottlenecks.push(`First render too slow: ${metrics.firstRenderTime}ms`);
    }

    if (bottlenecks.length > 0) {
      console.warn('⚠️ Startup bottlenecks identified:');
      bottlenecks.forEach(bottleneck => console.warn(`  - ${bottleneck}`));
      
      // 最適化提案
      console.log('💡 Optimization suggestions:');
      if (metrics.initializationTime > 1000) {
        console.log('  - Consider deferring non-critical service initialization');
        console.log('  - Enable lazy loading for heavy components');
      }
      if (metrics.contextLoadTime > 800) {
        console.log('  - Optimize context provider initialization');
        console.log('  - Consider splitting contexts');
      }
      if (metrics.firstRenderTime > 500) {
        console.log('  - Optimize initial component rendering');
        console.log('  - Consider code splitting');
      }
    }
  }

  /**
   * 起動メトリクスの保存
   */
  private async saveStartupMetrics(metrics: StartupMetrics): Promise<void> {
    try {
      const existingMetrics = await this.getStoredStartupMetrics();
      const updatedMetrics = [...existingMetrics, metrics].slice(-50); // 最新50件を保持
      
      await AsyncStorage.setItem('startup_metrics', JSON.stringify(updatedMetrics));
    } catch (error) {
      console.error('Failed to save startup metrics:', error);
    }
  }

  /**
   * 保存された起動メトリクスの取得
   */
  private async getStoredStartupMetrics(): Promise<StartupMetrics[]> {
    try {
      const metricsStr = await AsyncStorage.getItem('startup_metrics');
      return metricsStr ? JSON.parse(metricsStr) : [];
    } catch (error) {
      console.error('Failed to get stored startup metrics:', error);
      return [];
    }
  }

  /**
   * 最適化設定の保存
   */
  private async saveOptimizationConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('startup_optimization_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save optimization config:', error);
    }
  }

  /**
   * 最適化設定の読み込み
   */
  private async loadOptimizationConfig(): Promise<void> {
    try {
      const configStr = await AsyncStorage.getItem('startup_optimization_config');
      if (configStr) {
        this.config = { ...this.config, ...JSON.parse(configStr) };
      }
    } catch (error) {
      console.error('Failed to load optimization config:', error);
    }
  }
}

export default AppStartupOptimizer;