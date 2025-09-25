# PeerLearningHub CI/CD Complete Guide

## 概要

PeerLearningHubの完全なCI/CDパイプラインシステムの包括的なガイドです。自動ビルド、テスト、デプロイメント、ロールバック機能を含みます。

## システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub        │    │   EAS Build     │    │   Expo Updates  │
│   Actions       │◄──►│   Service       │◄──►│   Distribution  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Test          │    │   Artifact      │    │   Monitoring    │
│   Automation    │    │   Management    │    │   & Alerts      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ワークフロー概要

### 1. 継続的インテグレーション (CI)

**ファイル**: `.github/workflows/ci.yml`

**トリガー**:
- `main`, `develop` ブランチへのプッシュ
- プルリクエスト作成・更新

**実行内容**:
- コード品質チェック (ESLint)
- ユニットテスト実行
- 統合テスト実行
- テストカバレッジ生成
- セキュリティスキャン
- Android・iOSビルド

### 2. テスト自動化

**ファイル**: `.github/workflows/test-automation.yml`

**実行内容**:
- ユニットテスト
- 統合テスト
- 機能テスト
- パフォーマンステスト
- セキュリティテスト
- テストレポート生成
- 失敗時の自動通知

### 3. ステージング環境デプロイ

**ファイル**: `.github/workflows/deploy-staging.yml`

**トリガー**:
- `develop` ブランチへのプッシュ
- 手動実行

**実行内容**:
- デプロイ前チェック
- ステージング環境ビルド
- データベースマイグレーション
- Expo Updates デプロイ
- デプロイ後テスト
- 失敗時の自動ロールバック

### 4. 本番環境デプロイ

**ファイル**: `.github/workflows/deploy-production.yml`

**トリガー**:
- リリースタグ作成
- 手動実行（承認必要）

**実行内容**:
- 本番前検証
- 手動承認プロセス
- 本番環境バックアップ
- 本番環境ビルド・デプロイ
- アプリストア申請
- デプロイ後監視
- 緊急ロールバック機能

## 管理スクリプト

### ビルド管理

```bash
# ビルド環境の検証
npm run build:validate

# プラットフォーム別ビルド
npm run build:android
npm run build:ios
npm run build:all

# ステージングビルド
npm run build:staging

# ビルド履歴管理
npm run build:list
npm run build:clean
```

### アーティファクト管理

```bash
# アーティファクトの保存
npm run artifacts:store path/to/build.apk

# アーティファクト一覧・検証
npm run artifacts:list
npm run artifacts:verify <artifact-id>

# クリーンアップ・レポート
npm run artifacts:cleanup
npm run artifacts:report
```

### テスト管理

```bash
# 各種テストの実行
npm run test:functional
npm run test:performance
npm run test:security

# 環境別スモークテスト
npm run test:smoke:staging
npm run test:smoke:production

# テストレポート・通知
npm run test:report
npm run test:notify
```

### デプロイメント管理

```bash
# 環境別デプロイ
npm run deploy:staging
npm run deploy:production

# デプロイ状況確認
npm run deploy:list
npm run deploy:status <deployment-id>
```

### ロールバック管理

```bash
# ロールバックポイント作成
npm run rollback:create-point staging "Before major update"

# ロールバック実行
npm run rollback:execute staging <rollback-point-id>

# ロールバック履歴
npm run rollback:list-points
npm run rollback:list-executions

# 緊急ロールバック
npm run rollback:emergency production

# ロールバック検証
npm run rollback:verify staging <execution-id>
```

## 環境設定

### GitHub Secrets

#### 基本設定
- `EXPO_TOKEN`: Expo CLI アクセストークン
- `EAS_JSON`: EAS設定ファイル（Base64エンコード）
- `PRODUCTION_ENV`: 本番環境変数
- `STAGING_ENV`: ステージング環境変数

#### セキュリティ・監視
- `SNYK_TOKEN`: 脆弱性スキャン用トークン
- `SLACK_WEBHOOK_URL`: Slack通知用Webhook

#### App Store Connect
- `APPLE_ID`: Apple Developer アカウント
- `APPLE_TEAM_ID`: Apple Developer Team ID
- `ASC_APP_ID`: App Store Connect アプリID
- `ASC_KEY_ID`: App Store Connect API Key ID
- `ASC_ISSUER_ID`: App Store Connect API Issuer ID
- `ASC_PRIVATE_KEY`: App Store Connect API秘密鍵

#### Google Play Console
- `GOOGLE_SERVICE_ACCOUNT_KEY`: サービスアカウントキー（JSON、Base64エンコード）

#### データベース・バックアップ
- `STAGING_DATABASE_URL`: ステージングDB接続URL
- `PRODUCTION_DATABASE_URL`: 本番DB接続URL
- `BACKUP_STORAGE_URL`: バックアップストレージURL

### 環境別設定ファイル

#### ステージング環境 (`.env.staging`)
```
NODE_ENV=staging
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_ANON_KEY=staging-anon-key
REVENUECAT_API_KEY=staging-revenuecat-key
```

#### 本番環境 (`.env.production`)
```
NODE_ENV=production
SUPABASE_URL=https://production-project.supabase.co
SUPABASE_ANON_KEY=production-anon-key
REVENUECAT_API_KEY=production-revenuecat-key
```

## 監視・アラート

### テスト結果通知

**設定ファイル**: `config/test-notifications.json`

```json
{
  "slack": {
    "enabled": true,
    "channel": "#dev-notifications"
  },
  "thresholds": {
    "coverageMinimum": 80,
    "maxFailedTests": 0
  }
}
```

### デプロイメント通知

- **成功時**: Slack通知、GitHub Release作成
- **失敗時**: Slack緊急通知、GitHub Issue作成、自動ロールバック

### 監視項目

1. **ビルド成功率**: 95%以上を維持
2. **テストカバレッジ**: 80%以上を維持
3. **デプロイ成功率**: 98%以上を維持
4. **ロールバック時間**: 5分以内で完了

## セキュリティ対策

### コードセキュリティ
- 依存関係の脆弱性スキャン（Snyk）
- コード品質チェック（ESLint）
- セキュリティテストの自動実行

### デプロイセキュリティ
- 本番デプロイの手動承認制
- 環境変数の暗号化管理
- アクセス権限の最小化

### データセキュリティ
- データベースバックアップの暗号化
- 通信の HTTPS 強制
- 認証情報の安全な管理

## トラブルシューティング

### よくある問題と解決方法

#### 1. ビルドエラー

**症状**: EAS Build でエラーが発生
```
Error: Build failed with exit code 1
```

**解決方法**:
1. ローカルでビルドを確認: `npm run build:validate`
2. 依存関係を更新: `npm ci`
3. EAS設定を確認: `eas.json` の内容をチェック

#### 2. テスト失敗

**症状**: CI でテストが失敗
```
Test suite failed to run
```

**解決方法**:
1. ローカルでテスト実行: `npm test`
2. テスト環境を確認: `.env.test` の設定
3. データベース接続を確認

#### 3. デプロイ失敗

**症状**: デプロイメントが途中で失敗
```
Deployment failed at step: Database Migration
```

**解決方法**:
1. ロールバック実行: `npm run rollback:staging`
2. マイグレーションを手動確認
3. 再デプロイ実行

#### 4. ロールバック失敗

**症状**: 自動ロールバックが失敗
```
Rollback failed: No suitable rollback point found
```

**解決方法**:
1. 手動でロールバックポイント確認: `npm run rollback:list-points`
2. 緊急ロールバック実行: `npm run rollback:emergency`
3. 手動復旧手順の実行

### ログの確認方法

1. **GitHub Actions**: Actions タブでワークフロー実行ログを確認
2. **EAS Build**: EAS ダッシュボードでビルドログを確認
3. **アプリケーション**: 構造化ログシステムでアプリログを確認

### エスカレーション手順

1. **レベル1**: 自動復旧・ロールバック
2. **レベル2**: 開発チームへの自動通知
3. **レベル3**: 緊急対応チームへのエスカレーション
4. **レベル4**: 手動介入・サービス停止

## ベストプラクティス

### 開発フロー
1. 機能開発は `feature/*` ブランチで実施
2. `develop` ブランチでステージング環境テスト
3. `main` ブランチで本番リリース
4. タグ付けでバージョン管理

### テスト戦略
1. ユニットテスト: 80%以上のカバレッジ
2. 統合テスト: 主要フローの検証
3. E2Eテスト: クリティカルパスの検証
4. パフォーマンステスト: 定期実行

### デプロイ戦略
1. ステージング環境での十分なテスト
2. 本番デプロイ前のバックアップ作成
3. 段階的なロールアウト
4. 監視とロールバック準備

### セキュリティ
1. 定期的な依存関係更新
2. セキュリティスキャンの自動実行
3. 認証情報の定期ローテーション
4. アクセス権限の定期見直し

## 参考リンク

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [Supabase Documentation](https://supabase.com/docs)
- [RevenueCat Documentation](https://docs.revenuecat.com/)

## サポート

### 内部サポート
- **開発チーム**: #dev-support チャンネル
- **DevOps**: #devops-support チャンネル
- **緊急時**: #incident-response チャンネル

### 外部サポート
- **Expo**: Discord コミュニティ
- **GitHub**: GitHub Support
- **Supabase**: Discord コミュニティ