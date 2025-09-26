/**
 * 最適化された画像コンポーネント
 * レイジーローディング、プログレッシブローディング、キャッシュ機能を提供
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  Image, 
  ImageProps, 
  View, 
  ActivityIndicator, 
  Text, 
  StyleSheet,
  Animated,
  Dimensions
} from 'react-native';
import AssetOptimizer from '../services/assetOptimizer';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: string | { uri: string };
  placeholder?: string;
  enableLazyLoading?: boolean;
  enableProgressiveLoading?: boolean;
  enableOptimization?: boolean;
  optimizationOptions?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  };
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  fallbackComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  source,
  placeholder,
  enableLazyLoading = true,
  enableProgressiveLoading = true,
  enableOptimization = true,
  optimizationOptions,
  onLoadStart,
  onLoadEnd,
  onError,
  fallbackComponent,
  loadingComponent,
  style,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [optimizedSource, setOptimizedSource] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(!enableLazyLoading);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const assetOptimizer = AssetOptimizer.getInstance();

  // 画像ソースの正規化
  const imageUri = typeof source === 'string' ? source : source.uri;

  // 画像の最適化
  useEffect(() => {
    if (!enableOptimization || !imageUri) {
      setOptimizedSource(imageUri);
      return;
    }

    const optimizeImage = async () => {
      try {
        const screenWidth = Dimensions.get('window').width;
        const defaultOptions = {
          maxWidth: screenWidth * 2, // Retina対応
          maxHeight: screenWidth * 2,
          quality: 0.8,
          format: 'webp' as const,
          ...optimizationOptions,
        };

        const result = await assetOptimizer.optimizeImage(imageUri, defaultOptions);
        setOptimizedSource(result.optimizedPath);
      } catch (error) {
        console.warn('Image optimization failed, using original:', error);
        setOptimizedSource(imageUri);
      }
    };

    optimizeImage();
  }, [imageUri, enableOptimization, optimizationOptions, assetOptimizer]);

  // レイジーローディングの実装
  useEffect(() => {
    if (!enableLazyLoading) {
      setIsVisible(true);
      return;
    }

    // 実際の実装では、Intersection Observer APIやスクロール位置を監視
    // ここではシミュレーション
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [enableLazyLoading]);

  // 画像の読み込み処理
  const loadImage = useCallback(async () => {
    if (!optimizedSource || !isVisible) return;

    setIsLoading(true);
    setHasError(false);
    
    if (onLoadStart) {
      onLoadStart();
    }

    try {
      if (enableProgressiveLoading) {
        // プログレッシブローディング
        await assetOptimizer.loadImageProgressively(
          optimizedSource,
          (progress) => setLoadProgress(progress)
        );
      } else {
        // 標準ローディング
        await new Promise((resolve, reject) => {
          Image.prefetch(optimizedSource)
            .then(resolve)
            .catch(reject);
        });
      }

      // フェードインアニメーション
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setIsLoading(false);
      
      if (onLoadEnd) {
        onLoadEnd();
      }
    } catch (error) {
      console.error('Image loading failed:', error);
      setHasError(true);
      setIsLoading(false);
      
      if (onError) {
        onError(error);
      }
    }
  }, [optimizedSource, isVisible, enableProgressiveLoading, onLoadStart, onLoadEnd, onError, fadeAnim, assetOptimizer]);

  // 画像読み込みの開始
  useEffect(() => {
    if (optimizedSource && isVisible) {
      loadImage();
    }
  }, [optimizedSource, isVisible, loadImage]);

  // エラー時のフォールバック
  if (hasError) {
    return (
      <View style={[styles.container, style]}>
        {fallbackComponent || (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>画像を読み込めませんでした</Text>
          </View>
        )}
      </View>
    );
  }

  // ローディング中の表示
  if (isLoading || !isVisible) {
    return (
      <View style={[styles.container, style]}>
        {placeholder ? (
          <Image
            source={{ uri: placeholder }}
            style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}
            blurRadius={2}
          />
        ) : null}
        
        {loadingComponent || (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3b82f6" />
            {enableProgressiveLoading && (
              <Text style={styles.progressText}>
                {Math.round(loadProgress)}%
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  // 最適化された画像の表示
  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      <Image
        {...props}
        source={{ uri: optimizedSource || imageUri }}
        style={style}
        onLoadStart={() => {
          setIsLoading(true);
          if (onLoadStart) onLoadStart();
        }}
        onLoadEnd={() => {
          setIsLoading(false);
          if (onLoadEnd) onLoadEnd();
        }}
        onError={(error) => {
          setHasError(true);
          setIsLoading(false);
          if (onError) onError(error);
        }}
      />
    </Animated.View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default OptimizedImage;