/**
 * ナビゲーション・UI応答性最適化サービス
 * 画面遷移時間を1秒以内に短縮し、UI応答性を向上させる
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import PerformanceMonitoringService from './performanceMonitoringService';

export interface NavigationMetrics {
  id: string;
  timestamp: Date;
  fromScreen: string;
  toScreen: string;
  transitionDuration: number;
  renderDuration: number;
  animationDuration: number;
  totalDuration: number;
  frameDrops: number;
  memoryUsage: number;
}

export interface UIResponsivenessMetrics {
  id: string;
  timestamp: Date;
  componentName: string;
  interactionType: 'touch' | 'scroll' | 'input' | 'gesture';
  responseTime: number;
  renderTime: number;
  frameRate: number;
  isResponsive: boolean;
}

export interface OptimizationConfig {
  enablePreloading: boolean;
  enableLazyLoading: boolean;
  enableAnimationOptimization: boolean;
  enableMemoryOptimization: boolean;
  maxTransitionTime: number;
  maxResponseTime: number;
  targetFrameRate: number;
}

class NavigationOptimizer {
  private static instance: NavigationOptimizer;
  private performanceMonitoring: PerformanceMonitoringService;
  private navigationMetrics: NavigationMetrics[] = [];
  private uiMetrics: UIResponsivenessMetrics[] = [];
  private currentTransition: {
    startTime: number;
    fromScreen: string;
    toScreen: string;
  } | null = null;
  
  private config: OptimizationConfig = {
    enablePreloading: true,
    enableLazyLoading: true,
    enableAnimationOptimization: true,
    enableMemoryOptimization: true,
    maxTransitionTime: 1000, // 1秒
    maxResponseTime: 100, // 100ms
    targetFrameRate: 60, // 60fps
  };

  private constructor() {
    this.performanceMonitoring = PerformanceMonitoringService.getInstance();
  }

  public static getInstance(): NavigationOptimizer {
    if (!NavigationOptimizer.instance) {
      NavigationOptimizer.instance = new NavigationOptimizer();
    }
    return NavigationOptimizer.instance;
  }

  /**
   * 画面遷移の開始を記録
   */
  public startTransition(fromScreen: string, toScreen: string): void {
    this.currentTransition = {
      startTime: Date.now(),
      fromScreen,
      toScreen,
    };
    
    console.log(`🔄 Navigation started: ${fromScreen} → ${toScreen}`);
  }

  /**
   * 画面遷移の完了を記録
   */
  public async endTransition(frameDrops: number = 0, memoryUsage: number = 0): Promise<void> {
    if (!this.currentTransition) {
      console.warn('No active transition to end');
      return;
    }

    const totalDuration = Date.now() - this.currentTransition.startTime;
    
    const metrics: NavigationMetrics = {
      id: this.generateMetricsId(),
      timestamp: new Date(),
      fromScreen: this.currentTransition.fromScreen,
      toScreen: this.currentTransition.toScreen,
      transitionDuration: totalDuration,
      renderDuration: totalDuration * 0.6, // 推定値
      animationDuration: totalDuration * 0.4, // 推定値
      totalDuration,
      frameDrops,
      memoryUsage,
    };

    await this.recordNavigationMetrics(metrics);
    
    // パフォーマンス監視サービスに記録
    await this.performanceMonitoring.recordResponseTime(
      'screenTransition',
      totalDuration,
      {
        fromScreen: this.currentTransition.fromScreen,
        toScreen: this.currentTransition.toScreen,
        frameDrops,
      }
    );

    console.log(`✅ Navigation completed: ${this.currentTransition.fromScreen} → ${this.currentTransition.toScreen} in ${totalDuration}ms`);
    
    if (totalDuration > this.config.maxTransitionTime) {
      console.warn(`⚠️ Slow navigation detected: ${totalDuration}ms > ${this.config.maxTransitionTime}ms`);
      await this.analyzeSlowTransition(metrics);
    }

    this.currentTransition = null;
  }

  /**
   * UI応答性の測定
   */
  public async measureUIResponsiveness(
    componentName: string,
    interactionType: UIResponsivenessMetrics['interactionType'],
    startTime: number
  ): Promise<void> {
    const responseTime = Date.now() - startTime;
    const isResponsive = responseTime <= this.config.maxResponseTime;
    
    const metrics: UIResponsivenessMetrics = {
      id: this.generateMetricsId(),
      timestamp: new Date(),
      componentName,
      interactionType,
      responseTime,
      renderTime: responseTime * 0.8, // 推定値
      frameRate: this.estimateFrameRate(responseTime),
      isResponsive,
    };

    await this.recordUIMetrics(metrics);
    
    if (!isResponsive) {
      console.warn(`⚠️ Slow UI response: ${componentName} ${interactionType} took ${responseTime}ms`);
      await this.optimizeComponent(componentName, metrics);
    }
  }

  /**
   * レンダリング最適化の実装
   */
  public optimizeRendering(): {
    shouldUseMemo: boolean;
    shouldUseCallback: boolean;
    shouldUseLazyLoading: boolean;
    shouldPreloadComponents: boolean;
  } {
    return {
      shouldUseMemo: this.config.enableMemoryOptimization,
      shouldUseCallback: this.config.enableMemoryOptimization,
      shouldUseLazyLoading: this.config.enableLazyLoading,
      shouldPreloadComponents: this.config.enablePreloading,
    };
  }

  /**
   * アニメーション最適化の設定
   */
  public optimizeAnimations(): {
    useNativeDriver: boolean;
    enableReducedMotion: boolean;
    animationDuration: number;
    easing: string;
  } {
    return {
      useNativeDriver: this.config.enableAnimationOptimization,
      enableReducedMotion: false, // ユーザー設定に基づく
      animationDuration: 250, // 最適化された短い時間
      easing: 'ease-out',
    };
  }

  /**
   * コンポーネントのプリロード
   */
  public async preloadComponents(componentNames: string[]): Promise<void> {
    if (!this.config.enablePreloading) return;

    console.log(`🔄 Preloading components: ${componentNames.join(', ')}`);
    
    // 実際の実装では、動的インポートを使用してコンポーネントをプリロード
    const preloadPromises = componentNames.map(async (componentName) => {
      try {
        // シミュレーション: 実際の実装では dynamic import を使用
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log(`✅ Component preloaded: ${componentName}`);
      } catch (error) {
        console.error(`Failed to preload component ${componentName}:`, error);
      }
    });

    await Promise.all(preloadPromises);
  }

  /**
   * ナビゲーション統計の取得
   */
  public async getNavigationStatistics(): Promise<{
    averageTransitionTime: number;
    slowTransitions: NavigationMetrics[];
    mostUsedTransitions: { route: string; count: number; averageTime: number }[];
    frameDropStatistics: { average: number; max: number };
  }> {
    try {
      const allMetrics = await this.getStoredNavigationMetrics();
      
      if (allMetrics.length === 0) {
        return {
          averageTransitionTime: 0,
          slowTransitions: [],
          mostUsedTransitions: [],
          frameDropStatistics: { average: 0, max: 0 },
        };
      }

      // 平均遷移時間の計算
      const averageTransitionTime = allMetrics.reduce((sum, m) => sum + m.totalDuration, 0) / allMetrics.length;

      // 遅い遷移の特定
      const slowTransitions = allMetrics.filter(m => m.totalDuration > this.config.maxTransitionTime);

      // よく使用される遷移の分析
      const transitionCounts = new Map<string, { count: number; totalTime: number }>();
      allMetrics.forEach(m => {
        const route = `${m.fromScreen} → ${m.toScreen}`;
        const existing = transitionCounts.get(route) || { count: 0, totalTime: 0 };
        transitionCounts.set(route, {
          count: existing.count + 1,
          totalTime: existing.totalTime + m.totalDuration,
        });
      });

      const mostUsedTransitions = Array.from(transitionCounts.entries())
        .map(([route, data]) => ({
          route,
          count: data.count,
          averageTime: data.totalTime / data.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // フレームドロップ統計
      const frameDrops = allMetrics.map(m => m.frameDrops);
      const frameDropStatistics = {
        average: frameDrops.reduce((sum, drops) => sum + drops, 0) / frameDrops.length,
        max: Math.max(...frameDrops),
      };

      return {
        averageTransitionTime: Math.round(averageTransitionTime),
        slowTransitions,
        mostUsedTransitions,
        frameDropStatistics,
      };
    } catch (error) {
      console.error('Failed to get navigation statistics:', error);
      return {
        averageTransitionTime: 0,
        slowTransitions: [],
        mostUsedTransitions: [],
        frameDropStatistics: { average: 0, max: 0 },
      };
    }
  }

  /**
   * UI応答性統計の取得
   */
  public async getUIResponsivenessStatistics(): Promise<{
    averageResponseTime: number;
    responsiveInteractions: number;
    slowInteractions: UIResponsivenessMetrics[];
    componentPerformance: { component: string; averageResponseTime: number; responsiveRate: number }[];
  }> {
    try {
      const allMetrics = await this.getStoredUIMetrics();
      
      if (allMetrics.length === 0) {
        return {
          averageResponseTime: 0,
          responsiveInteractions: 0,
          slowInteractions: [],
          componentPerformance: [],
        };
      }

      // 平均応答時間の計算
      const averageResponseTime = allMetrics.reduce((sum, m) => sum + m.responseTime, 0) / allMetrics.length;

      // 応答性の良いインタラクションの数
      const responsiveInteractions = allMetrics.filter(m => m.isResponsive).length;

      // 遅いインタラクションの特定
      const slowInteractions = allMetrics.filter(m => !m.isResponsive);

      // コンポーネント別パフォーマンス
      const componentStats = new Map<string, { totalTime: number; count: number; responsiveCount: number }>();
      allMetrics.forEach(m => {
        const existing = componentStats.get(m.componentName) || { totalTime: 0, count: 0, responsiveCount: 0 };
        componentStats.set(m.componentName, {
          totalTime: existing.totalTime + m.responseTime,
          count: existing.count + 1,
          responsiveCount: existing.responsiveCount + (m.isResponsive ? 1 : 0),
        });
      });

      const componentPerformance = Array.from(componentStats.entries())
        .map(([component, stats]) => ({
          component,
          averageResponseTime: Math.round(stats.totalTime / stats.count),
          responsiveRate: Math.round((stats.responsiveCount / stats.count) * 100),
        }))
        .sort((a, b) => a.averageResponseTime - b.averageResponseTime);

      return {
        averageResponseTime: Math.round(averageResponseTime),
        responsiveInteractions,
        slowInteractions,
        componentPerformance,
      };
    } catch (error) {
      console.error('Failed to get UI responsiveness statistics:', error);
      return {
        averageResponseTime: 0,
        responsiveInteractions: 0,
        slowInteractions: [],
        componentPerformance: [],
      };
    }
  }

  /**
   * 最適化設定の更新
   */
  public async updateOptimizationConfig(newConfig: Partial<OptimizationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveOptimizationConfig();
    console.log('🔧 Navigation optimization config updated:', this.config);
  }

  // プライベートメソッド

  private async recordNavigationMetrics(metrics: NavigationMetrics): Promise<void> {
    this.navigationMetrics.push(metrics);
    await this.storeNavigationMetrics(metrics);
    this.manageMetricsQueueSize();
  }

  private async recordUIMetrics(metrics: UIResponsivenessMetrics): Promise<void> {
    this.uiMetrics.push(metrics);
    await this.storeUIMetrics(metrics);
    this.manageMetricsQueueSize();
  }

  private async analyzeSlowTransition(metrics: NavigationMetrics): Promise<void> {
    console.log('🔍 Analyzing slow transition...');
    
    const bottlenecks: string[] = [];
    
    if (metrics.renderDuration > 600) {
      bottlenecks.push(`Slow rendering: ${metrics.renderDuration}ms`);
    }
    
    if (metrics.animationDuration > 400) {
      bottlenecks.push(`Slow animation: ${metrics.animationDuration}ms`);
    }
    
    if (metrics.frameDrops > 5) {
      bottlenecks.push(`Frame drops: ${metrics.frameDrops}`);
    }

    if (bottlenecks.length > 0) {
      console.warn('⚠️ Transition bottlenecks identified:');
      bottlenecks.forEach(bottleneck => console.warn(`  - ${bottleneck}`));
      
      // 最適化提案
      console.log('💡 Optimization suggestions:');
      if (metrics.renderDuration > 600) {
        console.log('  - Use React.memo for expensive components');
        console.log('  - Implement lazy loading for heavy screens');
      }
      if (metrics.animationDuration > 400) {
        console.log('  - Use native driver for animations');
        console.log('  - Reduce animation complexity');
      }
      if (metrics.frameDrops > 5) {
        console.log('  - Optimize component rendering');
        console.log('  - Reduce memory usage during transitions');
      }
    }
  }

  private async optimizeComponent(componentName: string, metrics: UIResponsivenessMetrics): Promise<void> {
    console.log(`🔧 Optimizing component: ${componentName}`);
    
    // 最適化提案の生成
    const suggestions: string[] = [];
    
    if (metrics.responseTime > 200) {
      suggestions.push('Consider using React.memo or useMemo');
      suggestions.push('Implement virtualization for large lists');
    }
    
    if (metrics.frameRate < 30) {
      suggestions.push('Reduce component complexity');
      suggestions.push('Use useCallback for event handlers');
    }
    
    if (suggestions.length > 0) {
      console.log(`💡 Optimization suggestions for ${componentName}:`);
      suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
    }
  }

  private estimateFrameRate(responseTime: number): number {
    // 応答時間からフレームレートを推定
    if (responseTime <= 16) return 60; // 60fps
    if (responseTime <= 33) return 30; // 30fps
    if (responseTime <= 50) return 20; // 20fps
    return 10; // 10fps以下
  }

  private async storeNavigationMetrics(metrics: NavigationMetrics): Promise<void> {
    try {
      const existingMetrics = await this.getStoredNavigationMetrics();
      const updatedMetrics = [...existingMetrics, metrics].slice(-100); // 最新100件を保持
      
      await AsyncStorage.setItem('navigation_metrics', JSON.stringify(updatedMetrics));
    } catch (error) {
      console.error('Failed to store navigation metrics:', error);
    }
  }

  private async getStoredNavigationMetrics(): Promise<NavigationMetrics[]> {
    try {
      const metricsStr = await AsyncStorage.getItem('navigation_metrics');
      return metricsStr ? JSON.parse(metricsStr) : [];
    } catch (error) {
      console.error('Failed to get stored navigation metrics:', error);
      return [];
    }
  }

  private async storeUIMetrics(metrics: UIResponsivenessMetrics): Promise<void> {
    try {
      const existingMetrics = await this.getStoredUIMetrics();
      const updatedMetrics = [...existingMetrics, metrics].slice(-200); // 最新200件を保持
      
      await AsyncStorage.setItem('ui_responsiveness_metrics', JSON.stringify(updatedMetrics));
    } catch (error) {
      console.error('Failed to store UI metrics:', error);
    }
  }

  private async getStoredUIMetrics(): Promise<UIResponsivenessMetrics[]> {
    try {
      const metricsStr = await AsyncStorage.getItem('ui_responsiveness_metrics');
      return metricsStr ? JSON.parse(metricsStr) : [];
    } catch (error) {
      console.error('Failed to get stored UI metrics:', error);
      return [];
    }
  }

  private async saveOptimizationConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('navigation_optimization_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save navigation optimization config:', error);
    }
  }

  private async loadOptimizationConfig(): Promise<void> {
    try {
      const configStr = await AsyncStorage.getItem('navigation_optimization_config');
      if (configStr) {
        this.config = { ...this.config, ...JSON.parse(configStr) };
      }
    } catch (error) {
      console.error('Failed to load navigation optimization config:', error);
    }
  }

  private manageMetricsQueueSize(): void {
    if (this.navigationMetrics.length > 50) {
      this.navigationMetrics = this.navigationMetrics.slice(-50);
    }
    if (this.uiMetrics.length > 100) {
      this.uiMetrics = this.uiMetrics.slice(-100);
    }
  }

  private generateMetricsId(): string {
    return `nav_metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default NavigationOptimizer;