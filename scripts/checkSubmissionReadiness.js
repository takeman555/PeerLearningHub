#!/usr/bin/env node

/**
 * App Store Submission Readiness Check
 * 要件 9.2: アプリストア申請の実行準備状況確認
 */

const fs = require('fs');
const path = require('path');

// カラー出力
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(message, 'cyan');
  log('='.repeat(80), 'cyan');
}

function logSection(message) {
  log(`\n${'-'.repeat(60)}`, 'blue');
  log(message, 'blue');
  log('-'.repeat(60), 'blue');
}

class SubmissionReadinessChecker {
  constructor() {
    this.results = {
      ready: [],
      notReady: [],
      warnings: [],
    };
  }

  checkRequiredFiles() {
    logSection('必要ファイルの確認');
    
    const requiredFiles = [
      { path: 'docs/PRIVACY_POLICY_JA.md', name: 'プライバシーポリシー（日本語）' },
      { path: 'docs/PRIVACY_POLICY_EN.md', name: 'プライバシーポリシー（英語）' },
      { path: 'docs/TERMS_OF_SERVICE_JA.md', name: '利用規約（日本語）' },
      { path: 'docs/TERMS_OF_SERVICE_EN.md', name: '利用規約（英語）' },
      { path: 'docs/APP_STORE_METADATA.json', name: 'アプリストアメタデータ' },
      { path: 'eas.json', name: 'EAS設定ファイル' },
      { path: 'app.json', name: 'アプリ設定ファイル' },
      { path: 'assets/PLH_logo.png', name: 'アプリアイコン' },
      { path: 'assets/adaptive-icon.png', name: 'Androidアダプティブアイコン' },
    ];

    requiredFiles.forEach(file => {
      if (fs.existsSync(file.path)) {
        logSuccess(`${file.name}: ${file.path}`);
        this.results.ready.push(`必要ファイル: ${file.name}`);
      } else {
        logError(`${file.name}: ${file.path} が見つかりません`);
        this.results.notReady.push(`必要ファイル: ${file.name}`);
      }
    });
  }

  checkEASConfiguration() {
    logSection('EAS設定の確認');
    
    try {
      const easConfig = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
      
      // 本番ビルド設定
      if (easConfig.build?.production) {
        logSuccess('本番ビルド設定が存在します');
        this.results.ready.push('EAS本番ビルド設定');
        
        // iOS設定
        if (easConfig.build.production.ios) {
          logSuccess('iOS本番ビルド設定が存在します');
          this.results.ready.push('iOS本番ビルド設定');
        } else {
          logError('iOS本番ビルド設定が見つかりません');
          this.results.notReady.push('iOS本番ビルド設定');
        }
        
        // Android設定
        if (easConfig.build.production.android) {
          logSuccess('Android本番ビルド設定が存在します');
          
          // buildType確認
          if (easConfig.build.production.android.buildType === 'app-bundle') {
            logSuccess('Android buildType が正しく設定されています (app-bundle)');
            this.results.ready.push('Android buildType設定');
          } else {
            logError(`Android buildType が正しくありません: ${easConfig.build.production.android.buildType}`);
            this.results.notReady.push('Android buildType設定');
          }
        } else {
          logError('Android本番ビルド設定が見つかりません');
          this.results.notReady.push('Android本番ビルド設定');
        }
      } else {
        logError('本番ビルド設定が見つかりません');
        this.results.notReady.push('EAS本番ビルド設定');
      }
      
      // 申請設定
      if (easConfig.submit?.production) {
        logSuccess('本番申請設定が存在します');
        this.results.ready.push('EAS本番申請設定');
        
        // iOS申請設定
        const iosSubmit = easConfig.submit.production.ios;
        if (iosSubmit) {
          if (iosSubmit.appleId && !iosSubmit.appleId.includes('your-')) {
            logSuccess('iOS Apple ID が設定されています');
            this.results.ready.push('iOS Apple ID設定');
          } else {
            logWarning('iOS Apple ID が設定されていません');
            this.results.warnings.push('iOS Apple ID設定が必要');
          }
          
          if (iosSubmit.ascAppId && !iosSubmit.ascAppId.includes('your-')) {
            logSuccess('iOS App Store Connect App ID が設定されています');
            this.results.ready.push('iOS App Store Connect App ID設定');
          } else {
            logWarning('iOS App Store Connect App ID が設定されていません');
            this.results.warnings.push('iOS App Store Connect App ID設定が必要');
          }
          
          if (iosSubmit.appleTeamId && !iosSubmit.appleTeamId.includes('your-')) {
            logSuccess('iOS Apple Team ID が設定されています');
            this.results.ready.push('iOS Apple Team ID設定');
          } else {
            logWarning('iOS Apple Team ID が設定されていません');
            this.results.warnings.push('iOS Apple Team ID設定が必要');
          }
        }
        
        // Android申請設定
        const androidSubmit = easConfig.submit.production.android;
        if (androidSubmit) {
          if (androidSubmit.serviceAccountKeyPath && fs.existsSync(androidSubmit.serviceAccountKeyPath)) {
            logSuccess('Google Play サービスアカウントキーが存在します');
            this.results.ready.push('Google Play サービスアカウントキー');
          } else {
            logWarning('Google Play サービスアカウントキーが見つかりません');
            this.results.warnings.push('Google Play サービスアカウントキーが必要');
          }
        }
      } else {
        logError('本番申請設定が見つかりません');
        this.results.notReady.push('EAS本番申請設定');
      }
      
    } catch (error) {
      logError(`EAS設定の読み込みエラー: ${error.message}`);
      this.results.notReady.push('EAS設定ファイル');
    }
  }

  checkAppConfiguration() {
    logSection('アプリ設定の確認');
    
    try {
      const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
      const expo = appConfig.expo;
      
      if (expo) {
        // 基本設定
        if (expo.name) {
          logSuccess(`アプリ名: ${expo.name}`);
          this.results.ready.push('アプリ名設定');
        } else {
          logError('アプリ名が設定されていません');
          this.results.notReady.push('アプリ名設定');
        }
        
        if (expo.version) {
          logSuccess(`バージョン: ${expo.version}`);
          this.results.ready.push('アプリバージョン設定');
        } else {
          logError('アプリバージョンが設定されていません');
          this.results.notReady.push('アプリバージョン設定');
        }
        
        // iOS設定
        if (expo.ios?.bundleIdentifier) {
          logSuccess(`iOS Bundle ID: ${expo.ios.bundleIdentifier}`);
          this.results.ready.push('iOS Bundle ID設定');
        } else {
          logError('iOS Bundle ID が設定されていません');
          this.results.notReady.push('iOS Bundle ID設定');
        }
        
        // Android設定
        if (expo.android?.package) {
          logSuccess(`Android Package Name: ${expo.android.package}`);
          this.results.ready.push('Android Package Name設定');
        } else {
          logError('Android Package Name が設定されていません');
          this.results.notReady.push('Android Package Name設定');
        }
        
        // アイコン設定
        if (expo.icon && fs.existsSync(expo.icon)) {
          logSuccess(`アプリアイコン: ${expo.icon}`);
          this.results.ready.push('アプリアイコン設定');
        } else {
          logError('アプリアイコンが見つかりません');
          this.results.notReady.push('アプリアイコン設定');
        }
        
      } else {
        logError('Expo設定が見つかりません');
        this.results.notReady.push('Expo設定');
      }
      
    } catch (error) {
      logError(`アプリ設定の読み込みエラー: ${error.message}`);
      this.results.notReady.push('アプリ設定ファイル');
    }
  }

  checkEnvironmentVariables() {
    logSection('環境変数の確認');
    
    const requiredEnvVars = [
      { name: 'EXPO_PUBLIC_SUPABASE_URL', description: 'Supabase URL' },
      { name: 'EXPO_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase匿名キー' },
    ];
    
    const optionalEnvVars = [
      { name: 'EXPO_PUBLIC_REVENUECAT_API_KEY', description: 'RevenueCat APIキー' },
      { name: 'EXPO_PUBLIC_ANALYTICS_ID', description: 'アナリティクスID' },
    ];
    
    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar.name] && process.env[envVar.name] !== 'placeholder') {
        logSuccess(`${envVar.description}: 設定済み`);
        this.results.ready.push(`環境変数: ${envVar.description}`);
      } else {
        logError(`${envVar.description} (${envVar.name}) が設定されていません`);
        this.results.notReady.push(`環境変数: ${envVar.description}`);
      }
    });
    
    optionalEnvVars.forEach(envVar => {
      if (process.env[envVar.name] && process.env[envVar.name] !== 'placeholder') {
        logSuccess(`${envVar.description}: 設定済み`);
        this.results.ready.push(`環境変数: ${envVar.description}`);
      } else {
        logWarning(`${envVar.description} (${envVar.name}) が設定されていません`);
        this.results.warnings.push(`環境変数: ${envVar.description}の設定を推奨`);
      }
    });
  }

  checkMetadata() {
    logSection('メタデータの確認');
    
    try {
      const metadata = JSON.parse(fs.readFileSync('docs/APP_STORE_METADATA.json', 'utf8'));
      
      const requiredFields = [
        { key: 'app_name', name: 'アプリ名' },
        { key: 'version', name: 'バージョン' },
        { key: 'bundle_id', name: 'Bundle ID' },
        { key: 'category', name: 'カテゴリ' },
        { key: 'privacy_policy_url', name: 'プライバシーポリシーURL' },
        { key: 'terms_of_service_url', name: '利用規約URL' },
      ];
      
      requiredFields.forEach(field => {
        if (metadata[field.key]) {
          logSuccess(`${field.name}: ${metadata[field.key]}`);
          this.results.ready.push(`メタデータ: ${field.name}`);
        } else {
          logError(`${field.name}が設定されていません`);
          this.results.notReady.push(`メタデータ: ${field.name}`);
        }
      });
      
      // App Store説明文の確認
      if (metadata.app_store?.description?.japanese && metadata.app_store?.description?.english) {
        logSuccess('App Store説明文（日本語・英語）が設定されています');
        this.results.ready.push('App Store説明文');
      } else {
        logError('App Store説明文が不完全です');
        this.results.notReady.push('App Store説明文');
      }
      
      // Google Play説明文の確認
      if (metadata.google_play?.full_description?.japanese && metadata.google_play?.full_description?.english) {
        logSuccess('Google Play説明文（日本語・英語）が設定されています');
        this.results.ready.push('Google Play説明文');
      } else {
        logError('Google Play説明文が不完全です');
        this.results.notReady.push('Google Play説明文');
      }
      
    } catch (error) {
      logError(`メタデータの読み込みエラー: ${error.message}`);
      this.results.notReady.push('メタデータファイル');
    }
  }

  checkAssets() {
    logSection('アセットファイルの確認');
    
    const requiredAssets = [
      { path: 'assets/PLH_logo.png', name: 'メインアプリアイコン', size: '1024x1024px推奨' },
      { path: 'assets/adaptive-icon.png', name: 'Androidアダプティブアイコン', size: '1024x1024px推奨' },
      { path: 'assets/favicon.png', name: 'Webファビコン', size: '32x32px推奨' },
    ];
    
    requiredAssets.forEach(asset => {
      if (fs.existsSync(asset.path)) {
        logSuccess(`${asset.name}: ${asset.path} (${asset.size})`);
        this.results.ready.push(`アセット: ${asset.name}`);
      } else {
        logError(`${asset.name}: ${asset.path} が見つかりません`);
        this.results.notReady.push(`アセット: ${asset.name}`);
      }
    });
    
    // スクリーンショット確認
    const screenshotDir = 'assets/screenshots';
    if (fs.existsSync(screenshotDir)) {
      const screenshots = fs.readdirSync(screenshotDir);
      if (screenshots.length > 0) {
        logSuccess(`スクリーンショット: ${screenshots.length}個のファイルが見つかりました`);
        this.results.ready.push('スクリーンショット');
      } else {
        logWarning('スクリーンショットフォルダは存在しますが、ファイルがありません');
        this.results.warnings.push('スクリーンショットの追加を推奨');
      }
    } else {
      logWarning('スクリーンショットフォルダが見つかりません');
      this.results.warnings.push('スクリーンショットの準備が必要');
    }
  }

  generateSummary() {
    logSection('申請準備状況サマリー');
    
    const totalItems = this.results.ready.length + this.results.notReady.length;
    const readyPercentage = totalItems > 0 ? Math.round((this.results.ready.length / totalItems) * 100) : 0;
    
    logInfo(`準備完了項目: ${this.results.ready.length}`);
    logInfo(`未完了項目: ${this.results.notReady.length}`);
    logInfo(`警告項目: ${this.results.warnings.length}`);
    logInfo(`準備完了率: ${readyPercentage}%`);
    
    if (this.results.notReady.length === 0) {
      logSuccess('\n🎉 アプリストア申請の準備が完了しています！');
      logSuccess('次のコマンドで申請を実行できます:');
      logInfo('npm run submit:stores');
    } else {
      logError('\n❌ 申請前に以下の項目を完了してください:');
      this.results.notReady.forEach(item => {
        logError(`  • ${item}`);
      });
    }
    
    if (this.results.warnings.length > 0) {
      logWarning('\n⚠️  以下の項目の確認を推奨します:');
      this.results.warnings.forEach(item => {
        logWarning(`  • ${item}`);
      });
    }
  }

  generateActionPlan() {
    logSection('次のアクション');
    
    if (this.results.notReady.length > 0) {
      logInfo('未完了項目の対応方法:');
      
      // 環境変数の設定
      if (this.results.notReady.some(item => item.includes('環境変数'))) {
        logInfo('\n📝 環境変数の設定:');
        logInfo('  1. .env.production ファイルを編集');
        logInfo('  2. 実際の本番環境の値を設定');
        logInfo('  3. 機密情報は安全に管理');
      }
      
      // EAS設定の完了
      if (this.results.notReady.some(item => item.includes('EAS'))) {
        logInfo('\n⚙️  EAS設定の完了:');
        logInfo('  1. eas.json ファイルを確認');
        logInfo('  2. Apple Developer アカウント情報を設定');
        logInfo('  3. Google Play Console サービスアカウントを設定');
      }
      
      // アセットの準備
      if (this.results.notReady.some(item => item.includes('アセット'))) {
        logInfo('\n🎨 アセットの準備:');
        logInfo('  1. アプリアイコンを適切なサイズで作成');
        logInfo('  2. スクリーンショットを各デバイスサイズで作成');
        logInfo('  3. アセットファイルを適切な場所に配置');
      }
    }
    
    logInfo('\n📚 参考資料:');
    logInfo('  • App Store Connect: https://appstoreconnect.apple.com/');
    logInfo('  • Google Play Console: https://play.google.com/console/');
    logInfo('  • EAS Documentation: https://docs.expo.dev/eas/');
    logInfo('  • App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/');
    logInfo('  • Google Play Policy: https://play.google.com/about/developer-content-policy/');
  }

  async run() {
    logHeader('PeerLearningHub アプリストア申請準備状況確認');
    
    this.checkRequiredFiles();
    this.checkEASConfiguration();
    this.checkAppConfiguration();
    this.checkEnvironmentVariables();
    this.checkMetadata();
    this.checkAssets();
    this.generateSummary();
    this.generateActionPlan();
    
    // 結果に基づいて終了コードを設定
    if (this.results.notReady.length === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

// メイン実行
if (require.main === module) {
  const checker = new SubmissionReadinessChecker();
  checker.run();
}

module.exports = SubmissionReadinessChecker;