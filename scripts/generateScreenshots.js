#!/usr/bin/env node

/**
 * Screenshot Generation Script for PeerLearningHub
 * Generates app store screenshots for iOS and Android
 */

const fs = require('fs');
const path = require('path');

const SCREENSHOT_CONFIG = {
  ios: {
    devices: [
      { name: 'iPhone67', width: 1290, height: 2796, description: 'iPhone 14 Pro Max' },
      { name: 'iPhone65', width: 1242, height: 2688, description: 'iPhone XS Max' },
      { name: 'iPad129', width: 2048, height: 2732, description: 'iPad Pro 12.9"' }
    ]
  },
  android: {
    devices: [
      { name: 'Phone', width: 1080, height: 1920, description: 'Standard Phone' },
      { name: 'Tablet7', width: 1200, height: 1920, description: '7" Tablet' },
      { name: 'Tablet10', width: 1600, height: 2560, description: '10" Tablet' }
    ]
  }
};

const SCREENS = [
  {
    id: 'welcome',
    name: 'Welcome',
    description: 'ウェルカム画面 - アプリの価値提案とスプラッシュ',
    route: '/',
    priority: 1
  },
  {
    id: 'community',
    name: 'Community',
    description: 'グローバルコミュニティ - ソーシャル学習とディスカッション',
    route: '/community',
    priority: 2
  },
  {
    id: 'resources',
    name: 'Resources',
    description: 'リソース・情報 - 学習コンテンツと外部システム連携',
    route: '/resources',
    priority: 3
  },
  {
    id: 'auth',
    name: 'Authentication',
    description: '認証画面 - ログイン・新規登録',
    route: '/login',
    priority: 4
  }
];

const LANGUAGES = ['ja'];

function createScreenshotDirectory() {
  const screenshotDir = path.join(__dirname, '..', 'screenshots');
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Create subdirectories for each platform and language
  ['ios', 'android'].forEach(platform => {
    LANGUAGES.forEach(lang => {
      const dir = path.join(screenshotDir, platform, lang);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  });

  return screenshotDir;
}

function generateScreenshotPlan() {
  const plan = {
    total: 0,
    platforms: {}
  };

  Object.keys(SCREENSHOT_CONFIG).forEach(platform => {
    plan.platforms[platform] = {
      devices: SCREENSHOT_CONFIG[platform].devices.length,
      screens: SCREENS.length,
      languages: LANGUAGES.length,
      total: 0
    };

    const platformTotal = 
      SCREENSHOT_CONFIG[platform].devices.length * 
      SCREENS.length * 
      LANGUAGES.length;
    
    plan.platforms[platform].total = platformTotal;
    plan.total += platformTotal;
  });

  return plan;
}

function generateScreenshotCommands() {
  const commands = [];
  
  Object.keys(SCREENSHOT_CONFIG).forEach(platform => {
    SCREENSHOT_CONFIG[platform].devices.forEach(device => {
      LANGUAGES.forEach(lang => {
        SCREENS.forEach(screen => {
          const filename = `${platform}_${device.name}_${screen.name}_${lang.toUpperCase()}_v1.png`;
          const command = {
            platform,
            device: device.name,
            deviceDescription: device.description,
            screen: screen.id,
            screenName: screen.name,
            screenDescription: screen.description,
            route: screen.route,
            language: lang,
            filename,
            dimensions: `${device.width}x${device.height}`,
            priority: screen.priority
          };
          commands.push(command);
        });
      });
    });
  });

  return commands.sort((a, b) => a.priority - b.priority);
}

function generateScreenshotGuide() {
  const guide = `# PeerLearningHub Screenshot Generation Guide

## 📱 スクリーンショット撮影手順（実際のリリース機能版）

### 準備
1. アプリを最新バージョンにアップデート
2. テストデータを準備（ユーザー、投稿、グループなど）
3. デバイス設定を確認（時刻、バッテリー、通知オフ）

### 撮影対象画面（実際にリリースする機能のみ）

${SCREENS.map(screen => `
#### ${screen.priority}. ${screen.name}
- **説明**: ${screen.description}
- **ルート**: ${screen.route}
- **重要度**: ${screen.priority}
`).join('')}

### 📋 各画面の具体的な撮影内容

#### 1. ウェルカム画面
- **目的**: アプリの第一印象と価値提案
- **含める要素**:
  - "Peer Learning Hub" ロゴ
  - "グローバル学習コミュニティ" サブタイトル
  - 読み込み進捗バー
  - 美しいブルーグラデーション背景

#### 2. グローバルコミュニティ
- **目的**: ソーシャル学習機能の紹介
- **含める要素**:
  - コミュニティ投稿フィード
  - いいね・コメント機能
  - グループディスカッション
  - ユーザープロフィール（匿名化）
  - 投稿作成ボタン

#### 3. リソース・情報
- **目的**: 学習コンテンツと外部システム連携
- **含める要素**:
  - 外部システム連携カード
  - 学習リソースリスト
  - 検索・フィルター機能
  - カテゴリ分類
  - ブックマーク機能

#### 4. 認証画面
- **目的**: セキュアなログイン・登録プロセス
- **含める要素**:
  - ログインフォーム
  - 新規登録オプション
  - パスワードリセット
  - ソーシャルログイン（将来対応）
  - セキュリティ機能

### デバイス仕様

#### iOS
${SCREENSHOT_CONFIG.ios.devices.map(device => `
- **${device.description}**: ${device.width} x ${device.height}px
`).join('')}

#### Android
${SCREENSHOT_CONFIG.android.devices.map(device => `
- **${device.description}**: ${device.width} x ${device.height}px
`).join('')}

### 言語対応
- 日本語 (ja) のみ

### ファイル命名規則
\`[Platform]_[Device]_[Screen]_[Language]_[Version].png\`

例: \`iOS_iPhone67_Dashboard_JA_v1.png\`

## 📋 チェックリスト

### 撮影前
- [ ] アプリが正常に動作している
- [ ] テストデータが適切に設定されている
- [ ] デバイスの設定が適切（時刻、バッテリー等）
- [ ] 通知やポップアップが無効化されている

### 撮影中
- [ ] 各画面で適切なコンテンツが表示されている
- [ ] UIが完全に読み込まれている
- [ ] テキストが読みやすい
- [ ] ブランドカラーが正確

### 撮影後
- [ ] 画像サイズが仕様通り
- [ ] 画質が高品質
- [ ] ファイル名が規則通り
- [ ] 全ての必要な画面が撮影済み

## 🎯 品質基準

### 技術要件
- **フォーマット**: PNG
- **カラースペース**: sRGB
- **ビット深度**: 24-bit以上
- **ファイルサイズ**: 10MB以下

### コンテンツ要件
- リアルなコンテンツを使用
- プレースホルダーテキスト禁止
- 多様性のあるユーザー表現
- 実際のアプリ機能を表示
- 一貫したブランディング

---
生成日時: ${new Date().toLocaleString('ja-JP')}
`;

  return guide;
}

function main() {
  console.log('🎬 PeerLearningHub Screenshot Generator');
  console.log('=====================================\n');

  // Create directory structure
  const screenshotDir = createScreenshotDirectory();
  console.log(`📁 Screenshot directory created: ${screenshotDir}\n`);

  // Generate plan
  const plan = generateScreenshotPlan();
  console.log('📊 Screenshot Plan:');
  console.log(`Total screenshots needed: ${plan.total}`);
  Object.keys(plan.platforms).forEach(platform => {
    const p = plan.platforms[platform];
    console.log(`  ${platform.toUpperCase()}: ${p.total} screenshots`);
    console.log(`    - ${p.devices} devices × ${p.screens} screens × ${p.languages} languages`);
  });
  console.log('');

  // Generate commands
  const commands = generateScreenshotCommands();
  
  // Save commands to file
  const commandsFile = path.join(screenshotDir, 'screenshot-commands.json');
  fs.writeFileSync(commandsFile, JSON.stringify(commands, null, 2));
  console.log(`💾 Commands saved to: ${commandsFile}\n`);

  // Generate guide
  const guide = generateScreenshotGuide();
  const guideFile = path.join(screenshotDir, 'SCREENSHOT_GUIDE.md');
  fs.writeFileSync(guideFile, guide);
  console.log(`📖 Guide saved to: ${guideFile}\n`);

  // Display next steps
  console.log('🚀 Next Steps:');
  console.log('1. Review the generated guide');
  console.log('2. Prepare test data and content');
  console.log('3. Set up devices/simulators');
  console.log('4. Start taking screenshots following the guide');
  console.log('5. Use the commands.json for reference\n');

  console.log('📱 Priority Order for Screenshots:');
  SCREENS.forEach(screen => {
    console.log(`  ${screen.priority}. ${screen.name} - ${screen.description}`);
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  SCREENSHOT_CONFIG,
  SCREENS,
  LANGUAGES,
  generateScreenshotPlan,
  generateScreenshotCommands
};