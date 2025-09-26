/**
 * 最適化されたナビゲーションフック
 * 画面遷移のパフォーマンスを監視し、最適化を適用
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import NavigationOptimizer from '../services/navigationOptimizer';

export interface UseOptimizedNavigationOptions {
  enablePreloading?: boolean;
  enableMetrics?: boolean;
  preloadRoutes?: string[];
}

export function useOptimizedNavigation(options: UseOptimizedNavigationOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const optimizer = NavigationOptimizer.getInstance();
  const previousPathname = useRef<string>(pathname);
  const navigationStartTime = useRef<number>(0);

  const {
    enablePreloading = true,
    enableMetrics = true,
    preloadRoutes = [],
  } = options;

  // ナビゲーション最適化設定の取得
  const optimizationConfig = optimizer.optimizeRendering();
  const animationConfig = optimizer.optimizeAnimations();

  // パス変更の監視
  useEffect(() => {
    if (enableMetrics && previousPathname.current !== pathname) {
      // 前の画面遷移の完了を記録
      if (navigationStartTime.current > 0) {
        optimizer.endTransition();
        navigationStartTime.current = 0;
      }
      
      previousPathname.current = pathname;
    }
  }, [pathname, enableMetrics, optimizer]);

  // コンポーネントのプリロード
  useEffect(() => {
    if (enablePreloading && preloadRoutes.length > 0) {
      optimizer.preloadComponents(preloadRoutes);
    }
  }, [enablePreloading, preloadRoutes, optimizer]);

  // 最適化されたナビゲーション関数
  const navigateOptimized = useCallback((href: string, options?: any) => {
    if (enableMetrics) {
      const currentScreen = pathname || 'unknown';
      const targetScreen = href;
      
      // ナビゲーション開始を記録
      optimizer.startTransition(currentScreen, targetScreen);
      navigationStartTime.current = Date.now();
    }

    // 実際のナビゲーション実行
    router.push(href, options);
  }, [router, pathname, enableMetrics, optimizer]);

  const replaceOptimized = useCallback((href: string, options?: any) => {
    if (enableMetrics) {
      const currentScreen = pathname || 'unknown';
      const targetScreen = href;
      
      optimizer.startTransition(currentScreen, targetScreen);
      navigationStartTime.current = Date.now();
    }

    router.replace(href, options);
  }, [router, pathname, enableMetrics, optimizer]);

  const goBackOptimized = useCallback(() => {
    if (enableMetrics) {
      const currentScreen = pathname || 'unknown';
      
      optimizer.startTransition(currentScreen, 'back');
      navigationStartTime.current = Date.now();
    }

    router.back();
  }, [router, pathname, enableMetrics, optimizer]);

  // UI応答性の測定
  const measureInteraction = useCallback((
    componentName: string,
    interactionType: 'touch' | 'scroll' | 'input' | 'gesture'
  ) => {
    const startTime = Date.now();
    
    return {
      end: () => {
        if (enableMetrics) {
          optimizer.measureUIResponsiveness(componentName, interactionType, startTime);
        }
      }
    };
  }, [enableMetrics, optimizer]);

  // 最適化されたコンポーネントラッパー
  const withOptimization = useCallback(<T extends object>(
    Component: React.ComponentType<T>,
    componentName: string
  ) => {
    return React.memo((props: T) => {
      const renderStartTime = useRef(Date.now());
      
      useEffect(() => {
        const renderTime = Date.now() - renderStartTime.current;
        if (enableMetrics && renderTime > 100) {
          console.warn(`Slow render detected: ${componentName} took ${renderTime}ms`);
        }
      });

      return React.createElement(Component, props);
    });
  }, [enableMetrics]);

  return {
    // 最適化されたナビゲーション関数
    push: navigateOptimized,
    replace: replaceOptimized,
    back: goBackOptimized,
    
    // 元のルーター関数（必要に応じて）
    router,
    
    // 最適化設定
    optimizationConfig,
    animationConfig,
    
    // ユーティリティ
    measureInteraction,
    withOptimization,
    
    // 現在のパス
    currentPath: pathname,
  };
}

/**
 * UI応答性測定用のカスタムフック
 */
export function useUIResponsiveness(componentName: string) {
  const optimizer = NavigationOptimizer.getInstance();

  const measureTouch = useCallback(() => {
    const startTime = Date.now();
    return () => optimizer.measureUIResponsiveness(componentName, 'touch', startTime);
  }, [componentName, optimizer]);

  const measureScroll = useCallback(() => {
    const startTime = Date.now();
    return () => optimizer.measureUIResponsiveness(componentName, 'scroll', startTime);
  }, [componentName, optimizer]);

  const measureInput = useCallback(() => {
    const startTime = Date.now();
    return () => optimizer.measureUIResponsiveness(componentName, 'input', startTime);
  }, [componentName, optimizer]);

  const measureGesture = useCallback(() => {
    const startTime = Date.now();
    return () => optimizer.measureUIResponsiveness(componentName, 'gesture', startTime);
  }, [componentName, optimizer]);

  return {
    measureTouch,
    measureScroll,
    measureInput,
    measureGesture,
  };
}

/**
 * パフォーマンス統計取得用のカスタムフック
 */
export function useNavigationStatistics() {
  const optimizer = NavigationOptimizer.getInstance();

  const getNavigationStats = useCallback(async () => {
    return await optimizer.getNavigationStatistics();
  }, [optimizer]);

  const getUIStats = useCallback(async () => {
    return await optimizer.getUIResponsivenessStatistics();
  }, [optimizer]);

  return {
    getNavigationStats,
    getUIStats,
  };
}