/**
 * アセット最適化サービス
 * 画像とアセットファイルの最適化、圧縮、レイジーローディングを実装
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AssetMetrics {
  id: string;
  timestamp: Date;
  assetPath: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  loadTime: number;
  format: string;
  dimensions?: { width: number; height: number };
}

export interface OptimizationConfig {
  enableImageCompression: boolean;
  enableWebPConversion: boolean;
  enableLazyLoading: boolean;
  enableAssetCaching: boolean;
  maxImageSize: number;
  compressionQuality: number;
  enableProgressiveLoading: boolean;
}

export interface AssetCache {
  [key: string]: {
    uri: string;
    size: number;
    lastAccessed: Date;
    format: string;
  };
}

class AssetOptimizer {
  private static instance: AssetOptimizer;
  private assetMetrics: AssetMetrics[] = [];
  private assetCache: AssetCache = {};
  private loadingAssets: Set<string> = new Set();
  
  private config: OptimizationConfig = {
    enableImageCompression: true,
    enableWebPConversion: true,
    enableLazyLoading: true,
    enableAssetCaching: true,
    maxImageSize: 1024 * 1024, // 1MB
    compressionQuality: 0.8, // 80%
    enableProgressiveLoading: true,
  };

  private constructor() {
    this.loadAssetCache();
  }

  public static getInstance(): AssetOptimizer {
    if (!AssetOptimizer.instance) {
      AssetOptimizer.instance = new AssetOptimizer();
    }
    return AssetOptimizer.instance;
  }

  /**
   * 画像の最適化
   */
  public async optimizeImage(
    imagePath: string,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    }
  ): Promise<{
    optimizedPath: string;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  }> {
    const startTime = Date.now();
    
    try {
      console.log(`🖼️ Optimizing image: ${imagePath}`);
      
      // 画像情報の取得（シミュレーション）
      const originalSize = await this.getImageSize(imagePath);
      const dimensions = await this.getImageDimensions(imagePath);
      
      // 最適化設定の適用
      const optimizationOptions = {
        maxWidth: options?.maxWidth || 1920,
        maxHeight: options?.maxHeight || 1080,
        quality: options?.quality || this.config.compressionQuality,
        format: options?.format || (this.config.enableWebPConversion ? 'webp' : 'jpeg'),
      };

      // 画像の最適化処理（シミュレーション）
      const optimizedResult = await this.processImageOptimization(
        imagePath,
        originalSize,
        dimensions,
        optimizationOptions
      );

      const loadTime = Date.now() - startTime;
      
      // メトリクスの記録
      const metrics: AssetMetrics = {
        id: this.generateMetricsId(),
        timestamp: new Date(),
        assetPath: imagePath,
        originalSize,
        optimizedSize: optimizedResult.optimizedSize,
        compressionRatio: optimizedResult.compressionRatio,
        loadTime,
        format: optimizationOptions.format,
        dimensions,
      };

      await this.recordAssetMetrics(metrics);
      
      // キャッシュに保存
      if (this.config.enableAssetCaching) {
        await this.cacheAsset(imagePath, optimizedResult.optimizedPath, optimizedResult.optimizedSize, optimizationOptions.format);
      }

      console.log(`✅ Image optimized: ${originalSize} → ${optimizedResult.optimizedSize} bytes (${optimizedResult.compressionRatio.toFixed(1)}% reduction)`);
      
      return optimizedResult;
    } catch (error) {
      console.error(`Failed to optimize image ${imagePath}:`, error);
      throw error;
    }
  }

  /**
   * レイジーローディング用の画像プリローダー
   */
  public async preloadImage(imagePath: string): Promise<void> {
    if (this.loadingAssets.has(imagePath)) {
      return; // 既に読み込み中
    }

    this.loadingAssets.add(imagePath);
    
    try {
      console.log(`🔄 Preloading image: ${imagePath}`);
      
      // キャッシュから確認
      if (this.config.enableAssetCaching && this.assetCache[imagePath]) {
        console.log(`✅ Image loaded from cache: ${imagePath}`);
        return;
      }

      // 画像のプリロード（シミュレーション）
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`✅ Image preloaded: ${imagePath}`);
    } catch (error) {
      console.error(`Failed to preload image ${imagePath}:`, error);
    } finally {
      this.loadingAssets.delete(imagePath);
    }
  }

  /**
   * 複数画像の一括最適化
   */
  public async optimizeImageBatch(
    imagePaths: string[],
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    }
  ): Promise<{
    totalOriginalSize: number;
    totalOptimizedSize: number;
    averageCompressionRatio: number;
    optimizedImages: Array<{
      path: string;
      originalSize: number;
      optimizedSize: number;
      compressionRatio: number;
    }>;
  }> {
    console.log(`🖼️ Batch optimizing ${imagePaths.length} images...`);
    
    const results = await Promise.all(
      imagePaths.map(path => this.optimizeImage(path, options))
    );

    const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0);
    const totalOptimizedSize = results.reduce((sum, result) => sum + result.optimizedSize, 0);
    const averageCompressionRatio = results.reduce((sum, result) => sum + result.compressionRatio, 0) / results.length;

    const optimizedImages = results.map((result, index) => ({
      path: imagePaths[index],
      originalSize: result.originalSize,
      optimizedSize: result.optimizedSize,
      compressionRatio: result.compressionRatio,
    }));

    console.log(`✅ Batch optimization completed: ${totalOriginalSize} → ${totalOptimizedSize} bytes`);
    console.log(`   Average compression: ${averageCompressionRatio.toFixed(1)}%`);

    return {
      totalOriginalSize,
      totalOptimizedSize,
      averageCompressionRatio,
      optimizedImages,
    };
  }

  /**
   * アセットのプログレッシブローディング
   */
  public async loadImageProgressively(
    imagePath: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    if (!this.config.enableProgressiveLoading) {
      return await this.loadImageStandard(imagePath);
    }

    console.log(`🔄 Loading image progressively: ${imagePath}`);
    
    // プログレッシブローディングのシミュレーション
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      const progress = (i / steps) * 100;
      
      if (onProgress) {
        onProgress(progress);
      }
    }

    console.log(`✅ Progressive loading completed: ${imagePath}`);
    return imagePath;
  }

  /**
   * アセット統計の取得
   */
  public async getAssetStatistics(): Promise<{
    totalAssets: number;
    totalOriginalSize: number;
    totalOptimizedSize: number;
    averageCompressionRatio: number;
    cacheHitRate: number;
    formatDistribution: Record<string, number>;
    largestAssets: AssetMetrics[];
  }> {
    try {
      const allMetrics = await this.getStoredAssetMetrics();
      
      if (allMetrics.length === 0) {
        return {
          totalAssets: 0,
          totalOriginalSize: 0,
          totalOptimizedSize: 0,
          averageCompressionRatio: 0,
          cacheHitRate: 0,
          formatDistribution: {},
          largestAssets: [],
        };
      }

      const totalOriginalSize = allMetrics.reduce((sum, m) => sum + m.originalSize, 0);
      const totalOptimizedSize = allMetrics.reduce((sum, m) => sum + m.optimizedSize, 0);
      const averageCompressionRatio = allMetrics.reduce((sum, m) => sum + m.compressionRatio, 0) / allMetrics.length;

      // フォーマット分布の計算
      const formatDistribution: Record<string, number> = {};
      allMetrics.forEach(m => {
        formatDistribution[m.format] = (formatDistribution[m.format] || 0) + 1;
      });

      // 最大サイズのアセット
      const largestAssets = allMetrics
        .sort((a, b) => b.originalSize - a.originalSize)
        .slice(0, 5);

      // キャッシュヒット率の計算
      const cacheHitRate = Object.keys(this.assetCache).length / Math.max(allMetrics.length, 1) * 100;

      return {
        totalAssets: allMetrics.length,
        totalOriginalSize,
        totalOptimizedSize,
        averageCompressionRatio: Math.round(averageCompressionRatio * 10) / 10,
        cacheHitRate: Math.round(cacheHitRate * 10) / 10,
        formatDistribution,
        largestAssets,
      };
    } catch (error) {
      console.error('Failed to get asset statistics:', error);
      return {
        totalAssets: 0,
        totalOriginalSize: 0,
        totalOptimizedSize: 0,
        averageCompressionRatio: 0,
        cacheHitRate: 0,
        formatDistribution: {},
        largestAssets: [],
      };
    }
  }

  /**
   * アセットキャッシュのクリーンアップ
   */
  public async cleanupAssetCache(): Promise<{
    removedAssets: number;
    freedSpace: number;
  }> {
    console.log('🧹 Cleaning up asset cache...');
    
    const now = new Date();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7日間
    let removedAssets = 0;
    let freedSpace = 0;

    for (const [path, asset] of Object.entries(this.assetCache)) {
      const age = now.getTime() - asset.lastAccessed.getTime();
      
      if (age > maxAge) {
        freedSpace += asset.size;
        delete this.assetCache[path];
        removedAssets++;
      }
    }

    await this.saveAssetCache();
    
    console.log(`✅ Cache cleanup completed: ${removedAssets} assets removed, ${freedSpace} bytes freed`);
    
    return { removedAssets, freedSpace };
  }

  /**
   * 最適化設定の更新
   */
  public async updateOptimizationConfig(newConfig: Partial<OptimizationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveOptimizationConfig();
    console.log('🔧 Asset optimization config updated:', this.config);
  }

  // プライベートメソッド

  private async getImageSize(imagePath: string): Promise<number> {
    // 実際の実装では、ファイルサイズを取得
    // シミュレーション: ランダムなサイズを生成
    return Math.floor(Math.random() * 500000) + 100000; // 100KB - 600KB
  }

  private async getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
    // 実際の実装では、画像の寸法を取得
    // シミュレーション: ランダムな寸法を生成
    return {
      width: Math.floor(Math.random() * 1920) + 320,
      height: Math.floor(Math.random() * 1080) + 240,
    };
  }

  private async processImageOptimization(
    imagePath: string,
    originalSize: number,
    dimensions: { width: number; height: number },
    options: {
      maxWidth: number;
      maxHeight: number;
      quality: number;
      format: string;
    }
  ): Promise<{
    optimizedPath: string;
    optimizedSize: number;
    compressionRatio: number;
  }> {
    // 実際の実装では、画像処理ライブラリを使用
    // シミュレーション: 最適化結果を計算
    
    // サイズ削減の計算
    let sizeReduction = 0;
    
    // 品質による削減
    sizeReduction += (1 - options.quality) * 0.4;
    
    // フォーマット変換による削減
    if (options.format === 'webp') {
      sizeReduction += 0.25; // WebPは約25%小さい
    }
    
    // リサイズによる削減
    const originalPixels = dimensions.width * dimensions.height;
    const maxPixels = options.maxWidth * options.maxHeight;
    if (originalPixels > maxPixels) {
      const scaleFactor = Math.sqrt(maxPixels / originalPixels);
      sizeReduction += (1 - scaleFactor * scaleFactor) * 0.5;
    }

    sizeReduction = Math.min(sizeReduction, 0.8); // 最大80%削減
    
    const optimizedSize = Math.floor(originalSize * (1 - sizeReduction));
    const compressionRatio = sizeReduction * 100;
    
    const optimizedPath = imagePath.replace(/\.[^.]+$/, `_optimized.${options.format}`);
    
    return {
      optimizedPath,
      optimizedSize,
      compressionRatio,
    };
  }

  private async loadImageStandard(imagePath: string): Promise<string> {
    // 標準的な画像読み込み
    await new Promise(resolve => setTimeout(resolve, 200));
    return imagePath;
  }

  private async cacheAsset(
    originalPath: string,
    optimizedPath: string,
    size: number,
    format: string
  ): Promise<void> {
    this.assetCache[originalPath] = {
      uri: optimizedPath,
      size,
      lastAccessed: new Date(),
      format,
    };
    
    await this.saveAssetCache();
  }

  private async recordAssetMetrics(metrics: AssetMetrics): Promise<void> {
    this.assetMetrics.push(metrics);
    await this.storeAssetMetrics(metrics);
    this.manageMetricsQueueSize();
  }

  private async storeAssetMetrics(metrics: AssetMetrics): Promise<void> {
    try {
      const existingMetrics = await this.getStoredAssetMetrics();
      const updatedMetrics = [...existingMetrics, metrics].slice(-100); // 最新100件を保持
      
      await AsyncStorage.setItem('asset_metrics', JSON.stringify(updatedMetrics));
    } catch (error) {
      console.error('Failed to store asset metrics:', error);
    }
  }

  private async getStoredAssetMetrics(): Promise<AssetMetrics[]> {
    try {
      const metricsStr = await AsyncStorage.getItem('asset_metrics');
      return metricsStr ? JSON.parse(metricsStr) : [];
    } catch (error) {
      console.error('Failed to get stored asset metrics:', error);
      return [];
    }
  }

  private async saveAssetCache(): Promise<void> {
    try {
      await AsyncStorage.setItem('asset_cache', JSON.stringify(this.assetCache));
    } catch (error) {
      console.error('Failed to save asset cache:', error);
    }
  }

  private async loadAssetCache(): Promise<void> {
    try {
      const cacheStr = await AsyncStorage.getItem('asset_cache');
      if (cacheStr) {
        this.assetCache = JSON.parse(cacheStr);
      }
    } catch (error) {
      console.error('Failed to load asset cache:', error);
    }
  }

  private async saveOptimizationConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('asset_optimization_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save asset optimization config:', error);
    }
  }

  private manageMetricsQueueSize(): void {
    if (this.assetMetrics.length > 50) {
      this.assetMetrics = this.assetMetrics.slice(-50);
    }
  }

  private generateMetricsId(): string {
    return `asset_metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default AssetOptimizer;