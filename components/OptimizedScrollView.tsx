/**
 * 最適化されたスクロールビューコンポーネント
 * スクロールパフォーマンスとUI応答性を向上
 */

import React, { memo, useCallback, useMemo, useRef } from 'react';
import { ScrollView, ScrollViewProps, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useUIResponsiveness } from '../hooks/useOptimizedNavigation';

interface OptimizedScrollViewProps extends ScrollViewProps {
  onScrollOptimized?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  enablePerformanceMonitoring?: boolean;
  throttleScrollEvents?: boolean;
  virtualizeContent?: boolean;
}

const OptimizedScrollView: React.FC<OptimizedScrollViewProps> = memo(({
  children,
  onScrollOptimized,
  enablePerformanceMonitoring = true,
  throttleScrollEvents = true,
  virtualizeContent = false,
  ...props
}) => {
  const { measureScroll } = useUIResponsiveness('OptimizedScrollView');
  const scrollEventThrottle = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef<number>(0);

  // 最適化されたスクロールハンドラー
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentTime = Date.now();
    
    if (enablePerformanceMonitoring) {
      const endMeasurement = measureScroll();
      
      // スクロール応答性の測定
      setTimeout(() => {
        endMeasurement();
      }, 0);
    }

    // スクロールイベントのスロットリング
    if (throttleScrollEvents) {
      if (scrollEventThrottle.current) {
        clearTimeout(scrollEventThrottle.current);
      }
      
      scrollEventThrottle.current = setTimeout(() => {
        if (onScrollOptimized) {
          onScrollOptimized(event);
        }
        if (props.onScroll) {
          props.onScroll(event);
        }
      }, 16); // 60fps相当
    } else {
      if (onScrollOptimized) {
        onScrollOptimized(event);
      }
      if (props.onScroll) {
        props.onScroll(event);
      }
    }

    lastScrollTime.current = currentTime;
  }, [enablePerformanceMonitoring, throttleScrollEvents, onScrollOptimized, props.onScroll, measureScroll]);

  // 最適化されたプロパティ
  const optimizedProps = useMemo(() => ({
    ...props,
    onScroll: handleScroll,
    scrollEventThrottle: throttleScrollEvents ? 16 : props.scrollEventThrottle || 16,
    removeClippedSubviews: virtualizeContent ? true : props.removeClippedSubviews,
    maxToRenderPerBatch: virtualizeContent ? 10 : props.maxToRenderPerBatch,
    windowSize: virtualizeContent ? 10 : props.windowSize,
    initialNumToRender: virtualizeContent ? 10 : props.initialNumToRender,
    getItemLayout: virtualizeContent ? props.getItemLayout : undefined,
    // パフォーマンス最適化のためのプロパティ
    keyboardShouldPersistTaps: props.keyboardShouldPersistTaps || 'handled',
    showsVerticalScrollIndicator: props.showsVerticalScrollIndicator !== false,
    showsHorizontalScrollIndicator: props.showsHorizontalScrollIndicator !== false,
  }), [
    props,
    handleScroll,
    throttleScrollEvents,
    virtualizeContent,
  ]);

  return (
    <ScrollView {...optimizedProps}>
      {children}
    </ScrollView>
  );
});

OptimizedScrollView.displayName = 'OptimizedScrollView';

export default OptimizedScrollView;