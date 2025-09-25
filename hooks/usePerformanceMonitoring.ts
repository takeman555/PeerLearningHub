/**
 * パフォーマンス監視用Reactフック
 * コンポーネント内でのパフォーマンス測定を簡単に行うためのフック
 */

import { useEffect, useCallback, useRef } from 'react';
import PerformanceMonitoringInitializer from '../services/performanceMonitoringInitializer';

interface UsePerformanceMonitoringOptions {
  componentName?: string;
  trackRenderTime?: boolean;
  trackUserInteractions?: boolean;
}

interface PerformanceTimers {
  startScreenTransition: (screenName: string) => () => Promise<void>;
  startAPICall: (endpoint: string, method: string) => (success?: boolean, statusCode?: number, responseSize?: number) => Promise<void>;
  startDatabaseQuery: (queryType: string) => (success?: boolean, recordCount?: number) => Promise<void>;
  startRenderMeasurement: (componentName: string) => () => Promise<void>;
  recordSystemMetrics: () => Promise<void>;
}

export function usePerformanceMonitoring(
  options: UsePerformanceMonitoringOptions = {}
): PerformanceTimers {
  const performanceInitializer = PerformanceMonitoringInitializer.getInstance();
  const renderStartTime = useRef<number>(Date.now());
  const componentName = options.componentName || 'UnknownComponent';

  // コンポーネントのレンダリング時間を測定
  useEffect(() => {
    if (options.trackRenderTime) {
      const renderEndTime = Date.now();
      const renderDuration = renderEndTime - renderStartTime.current;
      
      // 非同期でレンダリング時間を記録
      const recordRenderTime = async () => {
        const endMeasurement = performanceInitializer.startRenderMeasurement(componentName);
        // 実際のレンダリング時間を設定するため、少し待機
        setTimeout(async () => {
          await endMeasurement();
        }, renderDuration);
      };
      
      recordRenderTime();
    }
  }, [options.trackRenderTime, componentName, performanceInitializer]);

  // コンポーネントのマウント時にレンダリング開始時間をリセット
  useEffect(() => {
    renderStartTime.current = Date.now();
  }, []);

  // 画面遷移時間の測定開始
  const startScreenTransition = useCallback((screenName: string) => {
    return performanceInitializer.startScreenTransition(screenName);
  }, [performanceInitializer]);

  // APIコール時間の測定開始
  const startAPICall = useCallback((endpoint: string, method: string) => {
    return performanceInitializer.startAPICall(endpoint, method);
  }, [performanceInitializer]);

  // データベースクエリ時間の測定開始
  const startDatabaseQuery = useCallback((queryType: string) => {
    return performanceInitializer.startDatabaseQuery(queryType);
  }, [performanceInitializer]);

  // レンダリング時間の測定開始
  const startRenderMeasurement = useCallback((componentName: string) => {
    return performanceInitializer.startRenderMeasurement(componentName);
  }, [performanceInitializer]);

  // システムメトリクスの記録
  const recordSystemMetrics = useCallback(async () => {
    await performanceInitializer.recordCurrentSystemMetrics();
  }, [performanceInitializer]);

  return {
    startScreenTransition,
    startAPICall,
    startDatabaseQuery,
    startRenderMeasurement,
    recordSystemMetrics,
  };
}

/**
 * 画面遷移パフォーマンス測定用フック
 */
export function useScreenTransitionPerformance(screenName: string) {
  const { startScreenTransition } = usePerformanceMonitoring();
  const transitionRef = useRef<(() => Promise<void>) | null>(null);

  const startTransition = useCallback(() => {
    transitionRef.current = startScreenTransition(screenName);
  }, [startScreenTransition, screenName]);

  const endTransition = useCallback(async () => {
    if (transitionRef.current) {
      await transitionRef.current();
      transitionRef.current = null;
    }
  }, []);

  return { startTransition, endTransition };
}

/**
 * APIコールパフォーマンス測定用フック
 */
export function useAPIPerformance() {
  const { startAPICall } = usePerformanceMonitoring();

  const measureAPICall = useCallback(
    async <T>(
      endpoint: string,
      method: string,
      apiCall: () => Promise<T>
    ): Promise<T> => {
      const endMeasurement = startAPICall(endpoint, method);
      
      try {
        const result = await apiCall();
        await endMeasurement(true, 200); // 成功時
        return result;
      } catch (error: any) {
        const statusCode = error?.response?.status || 500;
        await endMeasurement(false, statusCode); // エラー時
        throw error;
      }
    },
    [startAPICall]
  );

  return { measureAPICall };
}

/**
 * データベースクエリパフォーマンス測定用フック
 */
export function useDatabasePerformance() {
  const { startDatabaseQuery } = usePerformanceMonitoring();

  const measureDatabaseQuery = useCallback(
    async <T>(
      queryType: string,
      query: () => Promise<T>
    ): Promise<T> => {
      const endMeasurement = startDatabaseQuery(queryType);
      
      try {
        const result = await query();
        const recordCount = Array.isArray(result) ? result.length : 1;
        await endMeasurement(true, recordCount);
        return result;
      } catch (error) {
        await endMeasurement(false, 0);
        throw error;
      }
    },
    [startDatabaseQuery]
  );

  return { measureDatabaseQuery };
}

/**
 * レンダリングパフォーマンス測定用フック
 */
export function useRenderPerformance(componentName: string) {
  const { startRenderMeasurement } = usePerformanceMonitoring();
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const endMeasurement = startRenderMeasurement(`${componentName}_render_${renderCount.current}`);
    
    // レンダリング完了後に測定終了
    const timer = setTimeout(async () => {
      await endMeasurement();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  });

  return { renderCount: renderCount.current };
}

/**
 * ユーザーインタラクションパフォーマンス測定用フック
 */
export function useInteractionPerformance() {
  const performanceInitializer = PerformanceMonitoringInitializer.getInstance();

  const measureInteraction = useCallback(
    async (
      interactionType: string,
      interaction: () => Promise<void> | void
    ): Promise<void> => {
      const startTime = Date.now();
      
      try {
        await interaction();
        const duration = Date.now() - startTime;
        
        // インタラクションの応答時間を記録
        const endMeasurement = performanceInitializer.startRenderMeasurement(`interaction_${interactionType}`);
        setTimeout(async () => {
          await endMeasurement();
        }, duration);
        
      } catch (error) {
        console.error(`Interaction ${interactionType} failed:`, error);
        throw error;
      }
    },
    [performanceInitializer]
  );

  return { measureInteraction };
}

/**
 * システムメトリクス監視用フック
 */
export function useSystemMetricsMonitoring(intervalMs: number = 30000) {
  const { recordSystemMetrics } = usePerformanceMonitoring();

  useEffect(() => {
    // 初回実行
    recordSystemMetrics();

    // 定期実行
    const interval = setInterval(() => {
      recordSystemMetrics();
    }, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [recordSystemMetrics, intervalMs]);
}

export default usePerformanceMonitoring;