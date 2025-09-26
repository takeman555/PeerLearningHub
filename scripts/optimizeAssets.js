#!/usr/bin/env node

/**
 * アセット最適化スクリプト
 * 既存のアセットファイルを分析し、最適化を実行
 */

const fs = require('fs');
const path = require('path');

class AssetOptimizationScript {
  constructor() {
    this.assetsDir = path.join(__dirname, '..', 'assets');
    this.supportedFormats = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    this.optimizationResults = [];
  }

  /**
   * アセットディレクトリの分析
   */
  analyzeAssets() {
    console.log('📊 Analyzing assets directory...\n');
    
    if (!fs.existsSync(this.assetsDir)) {
      console.log('❌ Assets directory not found');
      return { totalFiles: 0, totalSize: 0, imageFiles: [] };
    }

    const imageFiles = this.findImageFiles(this.assetsDir);
    const totalSize = imageFiles.reduce((sum, file) => sum + file.size, 0);

    console.log(`📁 Assets Directory: ${this.assetsDir}`);
    console.log(`📄 Total files found: ${imageFiles.length}`);
    console.log(`💾 Total size: ${this.formatBytes(totalSize)}\n`);

    // ファイル形式別の統計
    const formatStats = {};
    imageFiles.forEach(file => {
      const ext = path.extname(file.path).toLowerCase();
      if (!formatStats[ext]) {
        formatStats[ext] = { count: 0, size: 0 };
      }
      formatStats[ext].count++;
      formatStats[ext].size += file.size;
    });

    console.log('📊 Format Distribution:');
    Object.entries(formatStats).forEach(([format, stats]) => {
      console.log(`  ${format}: ${stats.count} files, ${this.formatBytes(stats.size)}`);
    });

    // 大きなファイルの特定
    const largeFiles = imageFiles
      .filter(file => file.size > 500 * 1024) // 500KB以上
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);

    if (largeFiles.length > 0) {
      console.log('\n🔍 Large Files (>500KB):');
      largeFiles.forEach(file => {
        console.log(`  ${path.basename(file.path)}: ${this.formatBytes(file.size)}`);
      });
    }

    return { totalFiles: imageFiles.length, totalSize, imageFiles };
  }

  /**
   * 画像ファイルの検索
   */
  findImageFiles(dir) {
    const imageFiles = [];
    
    const scanDirectory = (currentDir) => {
      try {
        const items = fs.readdirSync(currentDir);
        
        items.forEach(item => {
          const itemPath = path.join(currentDir, item);
          const stats = fs.statSync(itemPath);
          
          if (stats.isDirectory()) {
            scanDirectory(itemPath);
          } else if (stats.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (this.supportedFormats.includes(ext)) {
              imageFiles.push({
                path: itemPath,
                name: item,
                size: stats.size,
                format: ext,
                relativePath: path.relative(this.assetsDir, itemPath),
              });
            }
          }
        });
      } catch (error) {
        console.warn(`Warning: Could not scan directory ${currentDir}:`, error.message);
      }
    };

    scanDirectory(dir);
    return imageFiles;
  }

  /**
   * アセットの最適化シミュレーション
   */
  simulateOptimization(imageFiles) {
    console.log('\n🔧 Simulating asset optimization...\n');
    
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    const optimizationResults = [];

    imageFiles.forEach(file => {
      const originalSize = file.size;
      const optimizedResult = this.simulateImageOptimization(file);
      
      totalOriginalSize += originalSize;
      totalOptimizedSize += optimizedResult.optimizedSize;
      
      optimizationResults.push({
        ...file,
        originalSize,
        optimizedSize: optimizedResult.optimizedSize,
        compressionRatio: optimizedResult.compressionRatio,
        recommendedFormat: optimizedResult.recommendedFormat,
        savings: originalSize - optimizedResult.optimizedSize,
      });
    });

    const totalSavings = totalOriginalSize - totalOptimizedSize;
    const overallCompressionRatio = (totalSavings / totalOriginalSize) * 100;

    console.log('📈 Optimization Results:');
    console.log(`  Original size: ${this.formatBytes(totalOriginalSize)}`);
    console.log(`  Optimized size: ${this.formatBytes(totalOptimizedSize)}`);
    console.log(`  Total savings: ${this.formatBytes(totalSavings)} (${overallCompressionRatio.toFixed(1)}%)`);

    return {
      totalOriginalSize,
      totalOptimizedSize,
      totalSavings,
      overallCompressionRatio,
      optimizationResults,
    };
  }

  /**
   * 個別画像の最適化シミュレーション
   */
  simulateImageOptimization(file) {
    let compressionRatio = 0;
    let recommendedFormat = file.format;

    // フォーマット別の最適化
    switch (file.format) {
      case '.png':
        if (file.size > 100 * 1024) { // 100KB以上のPNG
          compressionRatio = 0.4; // 40%削減
          recommendedFormat = '.webp';
        } else {
          compressionRatio = 0.2; // 20%削減
        }
        break;
      
      case '.jpg':
      case '.jpeg':
        compressionRatio = 0.3; // 30%削減
        if (file.size > 200 * 1024) { // 200KB以上
          recommendedFormat = '.webp';
          compressionRatio = 0.5; // 50%削減
        }
        break;
      
      case '.gif':
        compressionRatio = 0.25; // 25%削減
        recommendedFormat = '.webp';
        break;
      
      case '.webp':
        compressionRatio = 0.1; // 既にWebPなので10%削減
        break;
      
      default:
        compressionRatio = 0.2; // デフォルト20%削減
    }

    // ファイルサイズによる追加最適化
    if (file.size > 1024 * 1024) { // 1MB以上
      compressionRatio += 0.2; // 追加20%削減
    }

    compressionRatio = Math.min(compressionRatio, 0.8); // 最大80%削減

    const optimizedSize = Math.floor(file.size * (1 - compressionRatio));

    return {
      optimizedSize,
      compressionRatio: compressionRatio * 100,
      recommendedFormat,
    };
  }

  /**
   * 最適化提案の生成
   */
  generateOptimizationSuggestions(results) {
    console.log('\n💡 Optimization Suggestions:\n');

    const suggestions = [];

    // 大きなファイルの最適化提案
    const largeFiles = results.optimizationResults
      .filter(file => file.originalSize > 500 * 1024)
      .sort((a, b) => b.savings - a.savings);

    if (largeFiles.length > 0) {
      suggestions.push('1. Optimize large files first for maximum impact:');
      largeFiles.slice(0, 3).forEach(file => {
        suggestions.push(`   - ${file.name}: ${this.formatBytes(file.savings)} savings (${file.compressionRatio.toFixed(1)}%)`);
      });
    }

    // フォーマット変換の提案
    const formatConversions = results.optimizationResults
      .filter(file => file.recommendedFormat !== file.format)
      .length;

    if (formatConversions > 0) {
      suggestions.push(`2. Convert ${formatConversions} files to WebP format for better compression`);
    }

    // 品質設定の提案
    const highCompressionFiles = results.optimizationResults
      .filter(file => file.compressionRatio > 50)
      .length;

    if (highCompressionFiles > 0) {
      suggestions.push(`3. ${highCompressionFiles} files can benefit from aggressive compression`);
    }

    // レイジーローディングの提案
    suggestions.push('4. Implement lazy loading for images to improve initial load time');
    suggestions.push('5. Use progressive loading for large images');
    suggestions.push('6. Enable asset caching to reduce repeated downloads');

    // WebP対応の提案
    suggestions.push('7. Ensure WebP format support across all target platforms');

    suggestions.forEach(suggestion => {
      console.log(suggestion);
    });

    return suggestions;
  }

  /**
   * 最適化レポートの生成
   */
  generateOptimizationReport(analysis, optimization) {
    const report = {
      timestamp: new Date().toISOString(),
      analysis: {
        totalFiles: analysis.totalFiles,
        totalSize: analysis.totalSize,
        totalSizeFormatted: this.formatBytes(analysis.totalSize),
      },
      optimization: {
        totalOriginalSize: optimization.totalOriginalSize,
        totalOptimizedSize: optimization.totalOptimizedSize,
        totalSavings: optimization.totalSavings,
        overallCompressionRatio: optimization.overallCompressionRatio,
        totalSavingsFormatted: this.formatBytes(optimization.totalSavings),
      },
      recommendations: this.generateOptimizationSuggestions(optimization),
      topFiles: optimization.optimizationResults
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 10)
        .map(file => ({
          name: file.name,
          originalSize: this.formatBytes(file.originalSize),
          optimizedSize: this.formatBytes(file.optimizedSize),
          savings: this.formatBytes(file.savings),
          compressionRatio: `${file.compressionRatio.toFixed(1)}%`,
          recommendedFormat: file.recommendedFormat,
        })),
    };

    // レポートファイルの保存
    const reportPath = path.join(__dirname, '..', 'asset-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Optimization report saved to: ${reportPath}`);
    
    return report;
  }

  /**
   * バイト数のフォーマット
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * メイン実行関数
   */
  run() {
    console.log('🖼️ Asset Optimization Analysis\n');
    console.log('================================\n');

    try {
      // アセット分析
      const analysis = this.analyzeAssets();
      
      if (analysis.totalFiles === 0) {
        console.log('No image files found to optimize.');
        return;
      }

      // 最適化シミュレーション
      const optimization = this.simulateOptimization(analysis.imageFiles);
      
      // レポート生成
      const report = this.generateOptimizationReport(analysis, optimization);
      
      console.log('\n✅ Asset optimization analysis completed!');
      console.log(`Potential savings: ${this.formatBytes(optimization.totalSavings)} (${optimization.overallCompressionRatio.toFixed(1)}%)`);
      
      return report;
    } catch (error) {
      console.error('Asset optimization analysis failed:', error);
      return null;
    }
  }
}

// スクリプトの実行
if (require.main === module) {
  const optimizer = new AssetOptimizationScript();
  optimizer.run();
}

module.exports = AssetOptimizationScript;