#!/usr/bin/env node

/**
 * バンドルサイズ分析スクリプト
 * 不要なライブラリの特定とバンドルサイズの最適化
 */

const fs = require('fs');
const path = require('path');

class BundleAnalyzer {
  constructor() {
    this.packageJsonPath = path.join(__dirname, '..', 'package.json');
    this.nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  }

  /**
   * package.jsonの依存関係を分析
   */
  analyzeDependencies() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};

      console.log('📦 Bundle Size Analysis Report');
      console.log('================================\n');

      console.log('📊 Dependencies Analysis:');
      console.log(`Total dependencies: ${Object.keys(dependencies).length}`);
      console.log(`Total devDependencies: ${Object.keys(devDependencies).length}\n`);

      // 大きなライブラリの特定
      const largeDependencies = this.identifyLargeDependencies(dependencies);
      console.log('🔍 Large Dependencies (>1MB):');
      largeDependencies.forEach(dep => {
        console.log(`  - ${dep.name}: ~${dep.estimatedSize}`);
      });

      // 未使用の可能性があるライブラリ
      const potentiallyUnused = this.identifyPotentiallyUnusedLibraries(dependencies);
      console.log('\n⚠️  Potentially Unused Libraries:');
      potentiallyUnused.forEach(lib => {
        console.log(`  - ${lib.name}: ${lib.reason}`);
      });

      // 最適化提案
      console.log('\n💡 Optimization Suggestions:');
      this.generateOptimizationSuggestions(dependencies, largeDependencies, potentiallyUnused);

      return {
        totalDependencies: Object.keys(dependencies).length,
        largeDependencies,
        potentiallyUnused,
        estimatedBundleSize: this.estimateBundleSize(dependencies)
      };

    } catch (error) {
      console.error('Failed to analyze dependencies:', error);
      return null;
    }
  }

  /**
   * 大きなライブラリの特定
   */
  identifyLargeDependencies(dependencies) {
    const knownLargeDependencies = {
      'react-native': '~15MB',
      'expo': '~10MB',
      '@supabase/supabase-js': '~2MB',
      'react-native-purchases': '~1.5MB',
      'react': '~1MB',
    };

    return Object.keys(dependencies)
      .filter(dep => knownLargeDependencies[dep])
      .map(dep => ({
        name: dep,
        estimatedSize: knownLargeDependencies[dep],
        version: dependencies[dep]
      }))
      .sort((a, b) => {
        const sizeA = parseFloat(a.estimatedSize.replace(/[^\d.]/g, ''));
        const sizeB = parseFloat(b.estimatedSize.replace(/[^\d.]/g, ''));
        return sizeB - sizeA;
      });
  }

  /**
   * 未使用の可能性があるライブラリの特定
   */
  identifyPotentiallyUnusedLibraries(dependencies) {
    const potentiallyUnused = [];

    // 開発時のみ使用される可能性があるライブラリ
    const devOnlyLibraries = [
      'react-devtools',
      'flipper-plugin-react-native',
      'reactotron-react-native',
    ];

    // 特定の機能でのみ使用される可能性があるライブラリ
    const conditionalLibraries = {
      'react-native-camera': 'Camera functionality not implemented',
      'react-native-maps': 'Map functionality not implemented',
      'react-native-push-notification': 'Push notifications may be handled by other services',
      'react-native-image-picker': 'Image picking functionality not implemented',
      'react-native-share': 'Share functionality not implemented',
    };

    Object.keys(dependencies).forEach(dep => {
      if (devOnlyLibraries.includes(dep)) {
        potentiallyUnused.push({
          name: dep,
          reason: 'Development-only library in production dependencies'
        });
      }

      if (conditionalLibraries[dep]) {
        potentiallyUnused.push({
          name: dep,
          reason: conditionalLibraries[dep]
        });
      }
    });

    return potentiallyUnused;
  }

  /**
   * バンドルサイズの推定
   */
  estimateBundleSize(dependencies) {
    const baseSizes = {
      'react-native': 15000,
      'expo': 10000,
      '@supabase/supabase-js': 2000,
      'react-native-purchases': 1500,
      'react': 1000,
      '@react-native-async-storage/async-storage': 500,
      'expo-router': 800,
      'react-native-safe-area-context': 300,
      'react-native-screens': 400,
    };

    let totalSize = 0;
    Object.keys(dependencies).forEach(dep => {
      totalSize += baseSizes[dep] || 200; // デフォルト200KB
    });

    return {
      estimatedSizeKB: totalSize,
      estimatedSizeMB: (totalSize / 1024).toFixed(2)
    };
  }

  /**
   * 最適化提案の生成
   */
  generateOptimizationSuggestions(dependencies, largeDependencies, potentiallyUnused) {
    const suggestions = [];

    // 大きなライブラリの最適化提案
    if (largeDependencies.length > 0) {
      suggestions.push('1. Consider code splitting for large dependencies');
      suggestions.push('2. Use dynamic imports for non-critical features');
      suggestions.push('3. Evaluate if all features of large libraries are needed');
    }

    // 未使用ライブラリの削除提案
    if (potentiallyUnused.length > 0) {
      suggestions.push('4. Remove unused dependencies to reduce bundle size');
      suggestions.push('5. Move development-only dependencies to devDependencies');
    }

    // 一般的な最適化提案
    suggestions.push('6. Enable tree shaking for better dead code elimination');
    suggestions.push('7. Use Metro bundler optimization flags');
    suggestions.push('8. Consider using lighter alternatives for heavy libraries');

    suggestions.forEach(suggestion => {
      console.log(`  ${suggestion}`);
    });
  }

  /**
   * 最適化されたpackage.jsonの生成
   */
  generateOptimizedPackageJson() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      const optimizedPackageJson = { ...packageJson };

      // 未使用ライブラリの削除（コメントアウト）
      const potentiallyUnused = this.identifyPotentiallyUnusedLibraries(packageJson.dependencies || {});
      
      console.log('\n🔧 Generating optimized package.json...');
      
      if (potentiallyUnused.length > 0) {
        console.log('The following dependencies were identified as potentially unused:');
        potentiallyUnused.forEach(lib => {
          console.log(`  - ${lib.name}: ${lib.reason}`);
        });
        console.log('\nReview these dependencies and remove them if not needed.');
      }

      // 最適化されたpackage.jsonを保存
      const optimizedPath = path.join(__dirname, '..', 'package.optimized.json');
      fs.writeFileSync(optimizedPath, JSON.stringify(optimizedPackageJson, null, 2));
      
      console.log(`\n✅ Optimized package.json saved to: ${optimizedPath}`);
      console.log('Review the changes and replace package.json if appropriate.');

    } catch (error) {
      console.error('Failed to generate optimized package.json:', error);
    }
  }

  /**
   * Metro設定の最適化提案
   */
  generateMetroOptimizations() {
    console.log('\n⚙️  Metro Bundler Optimization Suggestions:');
    console.log('Add the following to your metro.config.js:');
    console.log(`
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle size optimization
config.transformer.minifierConfig = {
  keep_fnames: false,
  mangle: {
    keep_fnames: false,
  },
};

// Enable tree shaking
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Optimize asset handling
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

module.exports = config;
    `);
  }
}

// スクリプトの実行
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  
  console.log('🔍 Starting bundle size analysis...\n');
  
  const analysis = analyzer.analyzeDependencies();
  
  if (analysis) {
    console.log('\n📈 Bundle Size Summary:');
    console.log(`Estimated bundle size: ${analysis.estimatedBundleSize.estimatedSizeMB}MB`);
    console.log(`Large dependencies: ${analysis.largeDependencies.length}`);
    console.log(`Potentially unused: ${analysis.potentiallyUnused.length}`);
    
    analyzer.generateOptimizedPackageJson();
    analyzer.generateMetroOptimizations();
    
    console.log('\n✅ Bundle analysis completed!');
    console.log('Review the suggestions above to optimize your app startup time.');
  }
}

module.exports = BundleAnalyzer;