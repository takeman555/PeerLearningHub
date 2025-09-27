#!/usr/bin/env node

/**
 * リソースページのヘルプタブに法的文書へのリンクが正しく実装されているかを検証
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 リソースページの法的文書リンク検証を開始...\n');

// リソースページのファイルを読み込み
const resourcesPath = path.join(__dirname, '..', 'app', 'resources.tsx');

if (!fs.existsSync(resourcesPath)) {
  console.error('❌ resources.tsx が見つかりません');
  process.exit(1);
}

const resourcesContent = fs.readFileSync(resourcesPath, 'utf8');

// 検証項目
const validations = [
  {
    name: '利用規約リンク',
    pattern: /router\.push\(['"`]\/terms['"`]\)/,
    description: '利用規約ページへのナビゲーション'
  },
  {
    name: 'プライバシーポリシーリンク',
    pattern: /router\.push\(['"`]\/privacy['"`]\)/,
    description: 'プライバシーポリシーページへのナビゲーション'
  },
  {
    name: 'コミュニティガイドラインリンク',
    pattern: /router\.push\(['"`]\/community-guidelines['"`]\)/,
    description: 'コミュニティガイドラインページへのナビゲーション'
  },
  {
    name: '関連リンクセクション',
    pattern: /関連リンク/,
    description: '関連リンクセクションの存在'
  },
  {
    name: 'ヘルプタブ',
    pattern: /activeTab === 'help'/,
    description: 'ヘルプタブの実装'
  }
];

let passedCount = 0;
let totalCount = validations.length;

console.log('📋 検証結果:\n');

validations.forEach((validation, index) => {
  const isValid = validation.pattern.test(resourcesContent);
  const status = isValid ? '✅' : '❌';
  const result = isValid ? 'PASS' : 'FAIL';
  
  console.log(`${index + 1}. ${validation.name}: ${status} ${result}`);
  console.log(`   ${validation.description}`);
  
  if (isValid) {
    passedCount++;
  }
  
  console.log('');
});

// メイン画面から法的文書リンクが削除されていることを確認
const indexPath = path.join(__dirname, '..', 'app', 'index.tsx');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  console.log('🏠 メイン画面の法的文書リンク削除確認:\n');
  
  const mainPageChecks = [
    {
      name: '利用規約リンク削除',
      pattern: /href=['"`]\/terms['"`]/,
      shouldExist: false
    },
    {
      name: 'プライバシーポリシーリンク削除',
      pattern: /href=['"`]\/privacy['"`]/,
      shouldExist: false
    },
    {
      name: 'コミュニティガイドラインリンク削除',
      pattern: /href=['"`]\/community-guidelines['"`]/,
      shouldExist: false
    },
    {
      name: '法的情報セクション削除',
      pattern: /法的情報/,
      shouldExist: false
    }
  ];
  
  mainPageChecks.forEach((check, index) => {
    const exists = check.pattern.test(indexContent);
    const isValid = check.shouldExist ? exists : !exists;
    const status = isValid ? '✅' : '❌';
    const result = isValid ? 'PASS' : 'FAIL';
    
    console.log(`${index + 1}. ${check.name}: ${status} ${result}`);
    
    if (isValid) {
      passedCount++;
    }
    totalCount++;
    
    console.log('');
  });
}

// 結果サマリー
console.log('📊 検証サマリー:');
console.log(`  総チェック数: ${totalCount}`);
console.log(`  成功: ${passedCount}`);
console.log(`  失敗: ${totalCount - passedCount}`);
console.log(`  成功率: ${Math.round((passedCount / totalCount) * 100)}%\n`);

if (passedCount === totalCount) {
  console.log('🎉 すべての検証に成功しました！');
  console.log('✅ 法的文書へのリンクはリソースページのヘルプタブからのみアクセス可能です');
} else {
  console.log('⚠️ 一部の検証に失敗しました');
  process.exit(1);
}