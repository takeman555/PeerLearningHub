/**
 * メモリ最適化コンポーネントラッパー
 * コンポーネントのメモリ使用量を監視し、最適化を適用
 */

import React, { memo, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, ViewProps } from 'react-native';
import MemoryOptimizer from '../services/memoryOptimizer';

interface MemoryOptimizedComponentProps extends ViewProps {
  componentName: string;
  enableMemoryTracking?: boolean;
  enableLazyUnmount?: boolean;
  unmountDelay?: number; // ms
  children: React.ReactNode;
}

/**
 * メモリ最適化されたコンポーネントラッパー
 */
const MemoryOptimizedComponent: React.FC<MemoryOptimizedComponentProps> = memo(({
  componentName,
  enableMemoryTracking = true,
  enableLazyUnmount = true,
  unmountDelay = 5000,
  children,
  ...props
}) => {
  const memoryOptimizer = MemoryOptimizer.getInstance();
  const mountTime = useRef<Date>(new Date());
  const unmountTimer = useRef<NodeJS.Timeout | null>(null);

  // コンポーネントのマウント時にメモリオプティマイザーに登録
  useEffect(() => {
    if (enableMemoryTracking) {
      memoryOptimizer.registerComponent(componentName);
      console.log(`📝 Component registered: ${componentName}`);
    }

    return () => {
      if (enableMemoryTracking) {
        if (enableLazyUnmount) {
          // 遅延アンマウント: 一定時間後にコンポーネントを登録解除
          unmountTimer.current = setTimeout(() => {
            memoryOptimizer.unregisterComponent(componentName);
            console.log(`🗑️ Component unregistered (delayed): ${componentName}`);
          }, unmountDelay);
        } else {
          // 即座にアンマウント
          memoryOptimizer.unregisterComponent(componentName);
          console.log(`🗑️ Component unregistered: ${componentName}`);
        }
      }
    };
  }, [componentName, enableMemoryTracking, enableLazyUnmount, unmountDelay, memoryOptimizer]);

  // コンポーネントが再マウントされた場合、遅延アンマウントをキャンセル
  useEffect(() => {
    if (unmountTimer.current) {
      clearTimeout(unmountTimer.current);
      unmountTimer.current = null;
    }
  }, []);

  // メモリ使用量の監視
  const memoryUsage = useMemo(() => {
    const now = new Date();
    const mountDuration = now.getTime() - mountTime.current.getTime();
    
    return {
      componentName,
      mountDuration,
      mountTime: mountTime.current,
    };
  }, [componentName]);

  return (
    <View {...props}>
      {children}
    </View>
  );
});

MemoryOptimizedComponent.displayName = 'MemoryOptimizedComponent';

/**
 * メモリ最適化されたHOC (Higher-Order Component)
 */
export function withMemoryOptimization<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string,
  options?: {
    enableMemoryTracking?: boolean;
    enableLazyUnmount?: boolean;
    unmountDelay?: number;
  }
) {
  const MemoryOptimizedWrapper: React.FC<T> = memo((props) => {
    return (
      <MemoryOptimizedComponent
        componentName={componentName}
        enableMemoryTracking={options?.enableMemoryTracking}
        enableLazyUnmount={options?.enableLazyUnmount}
        unmountDelay={options?.unmountDelay}
      >
        <WrappedComponent {...props} />
      </MemoryOptimizedComponent>
    );
  });

  MemoryOptimizedWrapper.displayName = `withMemoryOptimization(${componentName})`;
  
  return MemoryOptimizedWrapper;
}

/**
 * メモリ効率的なリストコンポーネント
 */
interface MemoryEfficientListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  windowSize?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
}

export function MemoryEfficientList<T>({
  data,
  renderItem,
  keyExtractor,
  windowSize = 10,
  initialNumToRender = 10,
  maxToRenderPerBatch = 5,
}: MemoryEfficientListProps<T>) {
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: initialNumToRender });
  
  // 仮想化されたアイテムのレンダリング
  const renderVirtualizedItems = useCallback(() => {
    const items: React.ReactNode[] = [];
    
    for (let i = visibleRange.start; i < Math.min(visibleRange.end, data.length); i++) {
      const item = data[i];
      const key = keyExtractor(item, i);
      
      items.push(
        <MemoryOptimizedComponent
          key={key}
          componentName={`ListItem_${key}`}
          enableMemoryTracking={true}
          enableLazyUnmount={true}
          unmountDelay={3000}
        >
          {renderItem(item, i)}
        </MemoryOptimizedComponent>
      );
    }
    
    return items;
  }, [data, renderItem, keyExtractor, visibleRange]);

  // スクロール位置に基づく可視範囲の更新
  const updateVisibleRange = useCallback((scrollOffset: number, containerHeight: number) => {
    const itemHeight = 50; // 推定アイテム高さ
    const startIndex = Math.floor(scrollOffset / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + windowSize,
      data.length
    );
    
    setVisibleRange({ start: Math.max(0, startIndex - windowSize), end: endIndex });
  }, [data.length, windowSize]);

  return (
    <View>
      {renderVirtualizedItems()}
    </View>
  );
}

/**
 * メモリ使用量監視フック
 */
export function useMemoryMonitoring(componentName: string) {
  const memoryOptimizer = MemoryOptimizer.getInstance();
  const [memoryStats, setMemoryStats] = React.useState<{
    currentUsage: number;
    componentCount: number;
    leakCount: number;
  } | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateMemoryStats = async () => {
      try {
        const stats = await memoryOptimizer.getMemoryStatistics();
        setMemoryStats({
          currentUsage: stats.currentUsage,
          componentCount: stats.componentCount,
          leakCount: stats.leakCount,
        });
      } catch (error) {
        console.error('Failed to get memory stats:', error);
      }
    };

    // 初回実行
    updateMemoryStats();

    // 定期更新
    interval = setInterval(updateMemoryStats, 10000); // 10秒ごと

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [memoryOptimizer]);

  const optimizeMemory = useCallback(async () => {
    try {
      const result = await memoryOptimizer.optimizeMemoryUsage();
      console.log(`Memory optimization completed: ${result.memoryFreed}MB freed`);
      return result;
    } catch (error) {
      console.error('Memory optimization failed:', error);
      return null;
    }
  }, [memoryOptimizer]);

  return {
    memoryStats,
    optimizeMemory,
  };
}

export default MemoryOptimizedComponent;