# PeerLearningHub

ピアラーニングハブ - 多言語学習とコミュニティ交流のためのモバイルアプリケーション

## 🌟 概要

PeerLearningHubは、世界中の学習者が言語学習、文化交流、プロジェクト協力を通じて互いに学び合うことができるプラットフォームです。

## ✨ 主な機能

### 📚 学習リソース管理
- 多言語対応の学習コンテンツ
- カテゴリー別リソース分類
- レベル別学習教材
- ユーザー投稿型コンテンツ

### 📢 お知らせ・公式情報
- 管理者による公式アナウンス
- 種類別お知らせ（ニュース、アップデート、イベント、メンテナンス）
- 優先度設定と注目機能
- 有効期限付きお知らせ

### 🏠 宿泊施設予約
- 外部サイト連携による宿泊予約
- 学習者向け特別プラン
- 地域別施設検索

### 👥 コミュニティ機能
- ピアセッション
- プロジェクト協力
- 学習ダッシュボード
- アクティビティ履歴

### 🔐 認証・権限管理
- Supabase認証システム
- ロールベースアクセス制御
- 管理者・モデレーター権限

## 🛠️ 技術スタック

- **フレームワーク**: React Native (Expo)
- **言語**: TypeScript
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **状態管理**: React Context API
- **ナビゲーション**: Expo Router
- **スタイリング**: StyleSheet (React Native)

## 📱 対応プラットフォーム

- iOS
- Android
- Web (Expo Web)

## 🚀 開発環境セットアップ

### 前提条件

- Node.js (v18以上)
- npm または yarn
- Expo CLI
- iOS Simulator (macOS) または Android Emulator

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/takeman555/PeerLearningHub.git
cd PeerLearningHub

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env
# .envファイルを編集してSupabaseの設定を追加

# 開発サーバーを起動
npm start
```

### 環境変数

`.env`ファイルに以下の設定が必要です：

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EXPO_PUBLIC_APP_NAME=PeerLearningHub
EXPO_PUBLIC_APP_VERSION=1.0.0
```

## 🗄️ データベースセットアップ

1. Supabaseプロジェクトを作成
2. マイグレーションを実行：

```bash
# データベーステーブル作成
node scripts/setupDatabase.js

# お知らせテーブル作成
node scripts/runAnnouncementMigration.js
```

## 🌿 ブランチ戦略

### ブランチ構成

- **`main`**: 本番環境用の安定版
- **`development`**: 開発用メインブランチ
- **`feature/*`**: 新機能開発用
- **`bugfix/*`**: バグ修正用
- **`hotfix/*`**: 緊急修正用

### 開発フロー

1. `development`ブランチから新しいfeatureブランチを作成
2. 機能開発・テスト
3. `development`ブランチにプルリクエスト
4. コードレビュー後マージ
5. 定期的に`development`から`main`にリリース

```bash
# 新機能開発の例
git checkout development
git pull origin development
git checkout -b feature/new-feature
# 開発作業
git add .
git commit -m "feat: 新機能の実装"
git push origin feature/new-feature
# GitHubでプルリクエスト作成
```

## 📋 利用可能なスクリプト

```bash
# 開発サーバー起動
npm start

# iOS シミュレーター
npm run ios

# Android エミュレーター
npm run android

# Web版起動
npm run web

# テスト実行
npm test

# データベース接続テスト
node scripts/testSupabaseConnection.js

# お知らせ機能テスト
node scripts/testAnnouncements.js
```

## 🧪 テスト

```bash
# 全テスト実行
npm test

# 認証テスト
node scripts/testAuth.js

# データベーステスト
node scripts/testDatabaseSetup.js
```

## 📚 ドキュメント

- [Supabaseセットアップガイド](./SUPABASE_SETUP_GUIDE.md)
- [認証システム](./AUTHENTICATION_TEST_REPORT.md)
- [データベース設計](./DATABASE_SETUP_GUIDE.md)
- [外部システム連携](./docs/EXTERNAL_SYSTEMS_INTEGRATION.md)

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. `development`ブランチから新しいブランチを作成
3. 変更を実装
4. テストを追加・実行
5. プルリクエストを作成

### コミットメッセージ規約

```
feat: 新機能
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
chore: その他の変更
```

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🆘 サポート

問題や質問がある場合は、GitHubのIssuesページで報告してください。

## 🔄 最新の更新

### v1.0.0 (2024-09-24)
- ✨ 完全なお知らせ・公式情報編集機能
- 🔧 Pickerコンポーネント問題の解決
- 📱 カスタムモーダルセレクターUI
- 🔒 RLS (Row Level Security) 実装
- 📊 管理者ダッシュボード機能

---

**開発チーム**: PeerLearningHub Development Team  
**最終更新**: 2024年9月24日