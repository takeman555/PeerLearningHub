# GitHub Actions CI/CD Setup Guide

## 概要

PeerLearningHubのCI/CDパイプラインは、GitHub Actionsを使用して自動ビルド、テスト、デプロイメントを実行します。

## 必要なシークレット設定

### 基本設定

以下のシークレットをGitHubリポジトリの Settings > Secrets and variables > Actions で設定してください：

#### Expo関連
- `EXPO_TOKEN`: Expo CLIアクセストークン
  - Expo.devアカウントで生成
  - `expo login` 後に `expo whoami --json` で確認可能

#### EAS Build設定
- `EAS_JSON`: EAS設定ファイルの内容（Base64エンコード推奨）
  ```json
  {
    "cli": { "version": ">= 5.0.0" },
    "build": { ... },
    "submit": { ... }
  }
  ```

#### 本番環境変数
- `PRODUCTION_ENV`: 本番環境の環境変数ファイル
  ```
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-anon-key
  REVENUECAT_API_KEY=your-revenuecat-key
  NODE_ENV=production
  ```

#### セキュリティスキャン
- `SNYK_TOKEN`: Snyk脆弱性スキャン用トークン
  - https://snyk.io でアカウント作成後に取得

#### 通知設定
- `SLACK_WEBHOOK_URL`: Slack通知用Webhook URL
  - Slackアプリで Incoming Webhooks を設定

### App Store Connect設定

#### iOS配信用
- `APPLE_ID`: Apple Developer アカウントのApple ID
- `APPLE_TEAM_ID`: Apple Developer Team ID
- `ASC_APP_ID`: App Store Connect アプリID
- `ASC_KEY_ID`: App Store Connect API Key ID
- `ASC_ISSUER_ID`: App Store Connect API Issuer ID
- `ASC_PRIVATE_KEY`: App Store Connect API秘密鍵（Base64エンコード）

### Google Play Console設定

#### Android配信用
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Google Play Console サービスアカウントキー（JSON形式、Base64エンコード）
- `GOOGLE_PLAY_TRACK`: 配信トラック（internal, alpha, beta, production）

## ワークフロー説明

### 1. CI Workflow (`ci.yml`)

**トリガー**: `main`, `develop` ブランチへのプッシュ・プルリクエスト

**実行内容**:
- コードの品質チェック（ESLint）
- ユニットテスト・統合テストの実行
- テストカバレッジの生成
- Android・iOSビルドの実行
- セキュリティスキャンの実行

### 2. Staging Build Workflow (`build-staging.yml`)

**トリガー**: `develop` ブランチへのプッシュ、手動実行

**実行内容**:
- ステージング環境用のAndroid・iOSビルド
- ビルド成果物の保存（14日間）
- Slack通知

### 3. Production Build Workflow (`build-production.yml`)

**トリガー**: `v*` タグのプッシュ、手動実行

**実行内容**:
- 本番環境用のAndroid・iOSビルド
- ビルド成果物の署名
- GitHub Releaseの作成
- ビルド成果物の長期保存（90日間）
- Slack通知

## ビルド管理

### ローカルでのビルド管理

```bash
# ビルド環境の検証
npm run build:validate

# Androidビルド
npm run build:android

# iOSビルド
npm run build:ios

# 全プラットフォームビルド
npm run build:all

# ステージングビルド
npm run build:staging

# ビルド履歴の確認
npm run build:list

# 古いビルドのクリーンアップ
npm run build:clean
```

### アーティファクト管理

```bash
# アーティファクトの保存
npm run artifacts:store path/to/build.apk

# アーティファクト一覧
npm run artifacts:list

# アーティファクトの検証
npm run artifacts:verify <artifact-id>

# 古いアーティファクトのクリーンアップ
npm run artifacts:cleanup

# アーティファクトレポート
npm run artifacts:report
```

## セキュリティ考慮事項

### シークレット管理
- 全てのシークレットはGitHubのSecretsで管理
- 本番環境の認証情報は別途管理
- 定期的なキーローテーション

### ビルドセキュリティ
- 依存関係の脆弱性スキャン
- コード品質チェック
- セキュリティヘッダーの設定

### アクセス制御
- 本番デプロイは承認制
- ブランチ保護ルールの設定
- 最小権限の原則

## トラブルシューティング

### よくある問題

#### 1. EAS Buildエラー
```
Error: Expo token is not valid
```
**解決方法**: `EXPO_TOKEN` シークレットを更新

#### 2. Android署名エラー
```
Error: Android keystore not found
```
**解決方法**: EAS設定でキーストアを設定

#### 3. iOS証明書エラー
```
Error: iOS provisioning profile not found
```
**解決方法**: Apple Developer アカウントで証明書を確認

### ログの確認

1. GitHub Actions タブでワークフロー実行を確認
2. 失敗したジョブのログを詳細確認
3. EAS Build ダッシュボードでビルド状況を確認

### サポート

- GitHub Issues でバグ報告
- Expo Discord でEAS関連の質問
- 社内Slackチャンネルで相談

## 設定チェックリスト

- [ ] GitHub Secretsの設定完了
- [ ] EAS設定ファイルの更新
- [ ] Apple Developer アカウントの設定
- [ ] Google Play Console の設定
- [ ] Slack通知の設定
- [ ] ブランチ保護ルールの設定
- [ ] テストワークフローの実行確認
- [ ] ステージングビルドの実行確認
- [ ] 本番ビルドの実行確認

## 参考リンク

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)