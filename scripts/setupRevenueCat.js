#!/usr/bin/env node

/**
 * RevenueCat セットアップスクリプト
 * 
 * このスクリプトは RevenueCat 統合のセットアップを支援します
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 RevenueCat セットアップスクリプト');
console.log('=====================================\n');

// 環境変数ファイルの確認
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  console.log('📋 環境変数ファイルの確認...');
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      console.log('⚠️  .env ファイルが見つかりません');
      console.log('💡 .env.example をコピーして .env ファイルを作成してください:');
      console.log('   cp .env.example .env\n');
    } else {
      console.log('❌ .env.example ファイルが見つかりません');
      return false;
    }
  } else {
    console.log('✅ .env ファイルが見つかりました\n');
  }
  
  return true;
}

// package.json の依存関係確認
function checkDependencies() {
  console.log('📦 依存関係の確認...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json が見つかりません');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  const requiredDeps = [
    'react-native-purchases',
    '@supabase/supabase-js',
  ];
  
  const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.log('⚠️  以下の依存関係が不足しています:');
    missingDeps.forEach(dep => console.log(`   - ${dep}`));
    console.log('\n💡 以下のコマンドでインストールしてください:');
    console.log(`   npm install ${missingDeps.join(' ')}\n`);
    return false;
  } else {
    console.log('✅ 必要な依存関係がすべて揃っています\n');
  }
  
  return true;
}

// ファイル構造の確認
function checkFileStructure() {
  console.log('📁 ファイル構造の確認...');
  
  const requiredFiles = [
    'config/revenuecat.ts',
    'services/revenueCatService.ts',
    'contexts/MembershipContext.tsx',
    'components/Membership/MembershipScreen.tsx',
    'components/Membership/MembershipStatus.tsx',
    'components/Membership/UpgradePrompt.tsx',
    'app/membership.tsx',
    'supabase/migrations/009_add_membership_tables.sql',
  ];
  
  const missingFiles = requiredFiles.filter(file => {
    const filePath = path.join(process.cwd(), file);
    return !fs.existsSync(filePath);
  });
  
  if (missingFiles.length > 0) {
    console.log('⚠️  以下のファイルが見つかりません:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    console.log('\n💡 RevenueCat統合ファイルが正しく作成されているか確認してください\n');
    return false;
  } else {
    console.log('✅ 必要なファイルがすべて揃っています\n');
  }
  
  return true;
}

// データベースマイグレーションの確認
function checkDatabaseMigration() {
  console.log('🗄️  データベースマイグレーションの確認...');
  
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/009_add_membership_tables.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.log('❌ メンバーシップテーブルのマイグレーションファイルが見つかりません');
    return false;
  }
  
  console.log('✅ データベースマイグレーションファイルが見つかりました');
  console.log('💡 以下のコマンドでマイグレーションを実行してください:');
  console.log('   supabase db push\n');
  
  return true;
}

// セットアップチェックリストの表示
function showSetupChecklist() {
  console.log('📝 RevenueCat セットアップチェックリスト');
  console.log('=========================================\n');
  
  const checklist = [
    '□ RevenueCat アカウントの作成',
    '□ RevenueCat プロジェクトの作成',
    '□ iOS アプリの設定 (Bundle ID: com.peerlearninghub.app)',
    '□ Android アプリの設定 (Package: com.peerlearninghub.app)',
    '□ App Store Connect での商品作成',
    '   - peer_learning_hub_monthly (月額)',
    '   - peer_learning_hub_yearly (年額)',
    '   - peer_learning_hub_lifetime (生涯)',
    '□ Google Play Console での商品作成',
    '□ RevenueCat でのプロダクト設定',
    '□ エンタイトルメント "premium_membership" の作成',
    '□ .env ファイルでの API キー設定',
    '   - EXPO_PUBLIC_REVENUECAT_API_KEY_IOS',
    '   - EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID',
    '□ データベースマイグレーションの実行',
    '□ テスト購入での動作確認',
  ];
  
  checklist.forEach(item => console.log(item));
  console.log('\n');
}

// 設定例の表示
function showConfigurationExamples() {
  console.log('⚙️  設定例');
  console.log('==========\n');
  
  console.log('📄 .env ファイルの設定例:');
  console.log('```');
  console.log('EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=rcat_your_ios_api_key_here');
  console.log('EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=rcat_your_android_api_key_here');
  console.log('```\n');
  
  console.log('🔧 使用例:');
  console.log('```typescript');
  console.log('import { useMembership } from "../contexts/MembershipContext";');
  console.log('');
  console.log('function MyComponent() {');
  console.log('  const { isActive, purchaseMembership, availablePlans } = useMembership();');
  console.log('  ');
  console.log('  if (!isActive) {');
  console.log('    return (');
  console.log('      <Button ');
  console.log('        title="メンバーになる"');
  console.log('        onPress={() => purchaseMembership(availablePlans.monthly)}');
  console.log('      />');
  console.log('    );');
  console.log('  }');
  console.log('  ');
  console.log('  return <PremiumContent />;');
  console.log('}');
  console.log('```\n');
}

// メイン実行
function main() {
  let allChecksPass = true;
  
  allChecksPass = checkEnvFile() && allChecksPass;
  allChecksPass = checkDependencies() && allChecksPass;
  allChecksPass = checkFileStructure() && allChecksPass;
  allChecksPass = checkDatabaseMigration() && allChecksPass;
  
  if (allChecksPass) {
    console.log('🎉 すべてのチェックが完了しました！');
    console.log('RevenueCat 統合の準備ができています。\n');
  } else {
    console.log('⚠️  いくつかの問題が見つかりました。');
    console.log('上記の指示に従って修正してください。\n');
  }
  
  showSetupChecklist();
  showConfigurationExamples();
  
  console.log('📚 詳細なドキュメント:');
  console.log('   docs/REVENUECAT_INTEGRATION.md');
  console.log('\n🔗 参考リンク:');
  console.log('   - RevenueCat Dashboard: https://app.revenuecat.com');
  console.log('   - RevenueCat Docs: https://docs.revenuecat.com');
  console.log('   - React Native Integration: https://docs.revenuecat.com/docs/react-native');
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvFile,
  checkDependencies,
  checkFileStructure,
  checkDatabaseMigration,
};