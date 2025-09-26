# PeerLearningHub 包括的トラブルシューティングガイド

## 概要

PeerLearningHub v1.0.0の運用中に発生する可能性のある問題の診断、対処方法、エスカレーション手順を包括的にまとめたガイドです。

## 目次

1. [エラーコード一覧](#エラーコード一覧)
2. [認証関連の問題](#認証関連の問題)
3. [データベース関連の問題](#データベース関連の問題)
4. [コミュニティ機能の問題](#コミュニティ機能の問題)
5. [外部システム連携の問題](#外部システム連携の問題)
6. [パフォーマンス関連の問題](#パフォーマンス関連の問題)
7. [メンバーシップ・決済の問題](#メンバーシップ決済の問題)
8. [監視・ログシステムの問題](#監視ログシステムの問題)
9. [CI/CDパイプラインの問題](#cicdパイプラインの問題)
10. [エスカレーション手順](#エスカレーション手順)

## エラーコード一覧

### システムエラーコード

| エラーコード | 説明 | 重要度 | 対応時間 |
|-------------|------|--------|----------|
| **AUTH-001** | 認証トークンの有効期限切れ | 中 | 1時間 |
| **AUTH-002** | 認証サーバーへの接続失敗 | 高 | 30分 |
| **AUTH-003** | 無効な認証情報 | 低 | 4時間 |
| **DB-001** | データベース接続タイムアウト | 高 | 30分 |
| **DB-002** | データベースクエリエラー | 中 | 1時間 |
| **DB-003** | データベース容量不足 | 高 | 30分 |
| **API-001** | 外部API呼び出し失敗 | 中 | 1時間 |
| **API-002** | APIレート制限超過 | 中 | 1時間 |
| **API-003** | API認証エラー | 高 | 30分 |
| **PERF-001** | レスポンス時間超過 | 中 | 2時間 |
| **PERF-002** | メモリ使用量超過 | 高 | 1時間 |
| **PERF-003** | CPU使用率超過 | 高 | 1時間 |
| **SEC-001** | 不正アクセス検知 | クリティカル | 即座 |
| **SEC-002** | セキュリティスキャン異常 | 高 | 30分 |
| **DEPLOY-001** | デプロイメント失敗 | 高 | 30分 |
| **DEPLOY-002** | ロールバック失敗 | クリティカル | 即座 |

### アプリケーションエラーコード

| エラーコード | 説明 | 対処方法 |
|-------------|------|----------|
| **COMM-001** | 投稿作成失敗 | データベース接続確認、権限チェック |
| **COMM-002** | いいね機能エラー | スキーマキャッシュリロード |
| **COMM-003** | グループ表示エラー | グループデータ整合性確認 |
| **EXT-001** | 外部リンクアクセス失敗 | 外部サービス状況確認 |
| **EXT-002** | 宿泊予約システムエラー | 予約システムAPI状況確認 |
| **MEMBER-001** | メンバーシップ購入失敗 | RevenueCat設定確認 |
| **MEMBER-002** | 購入復元失敗 | アプリストア接続確認 |

## 認証関連の問題

### 1. ログインできない

#### 症状
- ユーザーがログイン画面で正しい認証情報を入力してもログインできない
- エラーメッセージ: "認証に失敗しました"

#### 診断手順
```bash
# 1. 認証サービス状態確認
node scripts/testAuth.js

# 2. Supabase接続確認
node scripts/testSupabaseConnection.js

# 3. 認証設定確認
node scripts/verifyAuthConfig.js
```

#### 対処方法
1. **Supabase認証設定確認**
   - Supabase管理画面で認証設定を確認
   - メール確認設定の確認
   - RLS（Row Level Security）ポリシーの確認

2. **環境変数確認**
   ```bash
   # 環境変数の確認
   node scripts/checkEnv.js
   ```

3. **データベース接続確認**
   ```bash
   # データベース接続テスト
   node scripts/basicSupabaseTest.js
   ```

#### エスカレーション条件
- 30分以内に解決しない場合
- 複数ユーザーに影響している場合

### 2. パスワードリセットが機能しない

#### 症状
- パスワードリセットメールが送信されない
- リセットリンクが無効

#### 診断手順
```bash
# パスワードリセット機能テスト
node scripts/manualPasswordReset.js
```

#### 対処方法
1. **メール設定確認**
   - Supabase管理画面でSMTP設定確認
   - メールテンプレート確認

2. **手動パスワードリセット**
   ```bash
   # 特定ユーザーのパスワード手動リセット
   node scripts/manualPasswordReset.js [user-email]
   ```

### 3. セッション期限切れエラー

#### 症状
- アプリ使用中に突然ログアウトされる
- エラーコード: AUTH-001

#### 対処方法
1. **セッション設定確認**
   - JWT有効期限設定の確認
   - リフレッシュトークン設定の確認

2. **自動ログイン機能確認**
   ```bash
   # 認証状態確認
   node scripts/testRealAuth.js
   ```

## データベース関連の問題

### 1. データベース接続エラー

#### 症状
- アプリがデータベースに接続できない
- エラーコード: DB-001

#### 診断手順
```bash
# 1. データベース接続テスト
node scripts/testSupabaseConnection.js

# 2. データベース設定確認
node scripts/verifyDatabaseSetup.js

# 3. 接続プール状況確認
node scripts/checkConnectionPool.js
```

#### 対処方法
1. **Supabase管理画面確認**
   - プロジェクト状態確認
   - 接続数制限確認
   - メンテナンス状況確認

2. **接続設定確認**
   ```bash
   # 接続設定の再確認
   node scripts/setupDatabase.js
   ```

3. **緊急時フェイルオーバー**
   ```bash
   # バックアップデータベースへの切り替え
   node scripts/switchToBackupDatabase.js
   ```

### 2. データベースクエリが遅い

#### 症状
- アプリの動作が全体的に遅い
- エラーコード: PERF-001

#### 診断手順
```bash
# パフォーマンス分析
node scripts/analyzeDatabasePerformance.js
```

#### 対処方法
1. **インデックス確認**
   - 必要なインデックスが作成されているか確認
   - 不要なインデックスの削除

2. **クエリ最適化**
   ```bash
   # 遅いクエリの特定
   node scripts/identifySlowQueries.js
   
   # クエリ最適化の実行
   node scripts/optimizeQueries.js
   ```

### 3. データ整合性エラー

#### 症状
- データの不整合が発生
- 外部キー制約エラー

#### 対処方法
1. **データ整合性チェック**
   ```bash
   # データ整合性の確認
   node scripts/checkDataIntegrity.js
   
   # 不整合データの修正
   node scripts/fixDataInconsistency.js
   ```

2. **データクリーンアップ実行**
   ```bash
   # データクリーンアップ
   node scripts/executeDataCleanup.js
   ```

## コミュニティ機能の問題

### 1. 投稿が作成できない

#### 症状
- ユーザーが投稿を作成しようとするとエラーが発生
- エラーコード: COMM-001

#### 診断手順
```bash
# 1. 投稿作成機能テスト
node scripts/testPostCreation.js

# 2. 権限確認
node scripts/testPermissionSimple.js

# 3. データベーステーブル確認
node scripts/listTables.js
```

#### 対処方法
1. **権限設定確認**
   ```bash
   # ユーザー権限確認
   node scripts/checkUserRoles.js
   
   # 権限ポリシー修正
   node scripts/fixUserRolesPolicy.js
   ```

2. **データベーステーブル確認**
   ```bash
   # 投稿テーブル状態確認
   node scripts/testPostsDirectly.js
   ```

### 2. いいね機能が動作しない

#### 症状
- いいねボタンを押してもカウントが更新されない
- エラーコード: COMM-002

#### 診断手順
```bash
# いいね機能テスト
node scripts/testLikesFunctionality.js
```

#### 対処方法
1. **スキーマキャッシュリロード**
   ```bash
   # スキーマキャッシュの強制リロード
   node scripts/forceSchemaReload.js
   
   # キャッシュリロード
   node scripts/reloadSchemaCache.js
   ```

2. **フォールバック機能確認**
   ```bash
   # フォールバック機能テスト
   node scripts/testLikesWithFallback.js
   ```

### 3. グループが表示されない

#### 症状
- グループ一覧が空で表示される
- エラーコード: COMM-003

#### 対処方法
1. **初期グループ作成**
   ```bash
   # 指定グループの作成
   node scripts/createInitialGroups.js
   
   # グループ作成確認
   node scripts/manageInitialGroups.js
   ```

2. **グループデータ確認**
   ```bash
   # グループデータ整合性確認
   node scripts/validateGroupData.js
   ```

## 外部システム連携の問題

### 1. 外部リンクにアクセスできない

#### 症状
- 外部リンクをクリックしてもページが開かない
- エラーコード: EXT-001

#### 診断手順
```bash
# 外部リンク機能テスト
node scripts/testExternalLinkService.js
```

#### 対処方法
1. **外部システム状況確認**
   - 対象サイトの稼働状況確認
   - ネットワーク接続確認

2. **エラーハンドリング確認**
   ```bash
   # エラーハンドリングテスト
   node scripts/testExternalLinkErrorHandling.js
   ```

### 2. 宿泊予約システムエラー

#### 症状
- 宿泊予約ページにアクセスできない
- エラーコード: EXT-002

#### 対処方法
1. **予約システムAPI確認**
   ```bash
   # 予約システム接続テスト
   node scripts/testBookingSystemAPI.js
   ```

2. **フォールバック表示**
   - 代替メッセージの表示
   - 手動予約方法の案内

## パフォーマンス関連の問題

### 1. アプリの起動が遅い

#### 症状
- アプリの起動に3秒以上かかる
- エラーコード: PERF-001

#### 診断手順
```bash
# パフォーマンス監視確認
node scripts/validatePerformanceMonitoring.js
```

#### 対処方法
1. **起動時間分析**
   ```bash
   # 起動時間詳細分析
   node scripts/analyzeStartupTime.js
   ```

2. **最適化実行**
   ```bash
   # アプリ最適化
   node scripts/optimizeAppAssets.js
   
   # バンドルサイズ最適化
   node scripts/optimizeBundleSize.js
   ```

### 2. メモリ使用量が多い

#### 症状
- アプリのメモリ使用量が150MBを超過
- エラーコード: PERF-002

#### 対処方法
1. **メモリリーク検出**
   ```bash
   # メモリリーク分析
   node scripts/analyzeMemoryLeaks.js
   ```

2. **メモリ最適化**
   ```bash
   # メモリ使用量最適化
   node scripts/optimizeMemoryUsage.js
   ```

### 3. 画面遷移が遅い

#### 症状
- 画面遷移に1秒以上かかる
- エラーコード: PERF-001

#### 対処方法
1. **ナビゲーション最適化**
   ```bash
   # ナビゲーション分析
   node scripts/analyzeNavigationPerformance.js
   ```

2. **レンダリング最適化**
   ```bash
   # レンダリング最適化
   node scripts/optimizeRendering.js
   ```

## メンバーシップ・決済の問題

### 1. メンバーシップ購入ができない

#### 症状
- 購入ボタンを押してもエラーが発生
- エラーコード: MEMBER-001

#### 診断手順
```bash
# RevenueCat接続テスト
node scripts/testRevenueCatConnection.js
```

#### 対処方法
1. **RevenueCat設定確認**
   - API キー確認
   - 商品設定確認
   - アプリストア連携確認

2. **購入フロー確認**
   ```bash
   # 購入フローテスト
   node scripts/testPurchaseFlow.js
   ```

### 2. 購入復元ができない

#### 症状
- 購入復元ボタンが機能しない
- エラーコード: MEMBER-002

#### 対処方法
1. **アプリストア接続確認**
   ```bash
   # App Store Connect確認
   node scripts/validateAppStoreConnect.js
   
   # Google Play Console確認
   node scripts/validateGooglePlayConsole.js
   ```

2. **購入履歴確認**
   ```bash
   # 購入履歴の確認
   node scripts/checkPurchaseHistory.js
   ```

## 監視・ログシステムの問題

### 1. 監視ダッシュボードが表示されない

#### 症状
- 監視ダッシュボードにアクセスできない
- データが表示されない

#### 対処方法
1. **監視システム状態確認**
   ```bash
   # 監視システム確認
   node scripts/validatePerformanceMonitoring.js
   
   # エラー監視確認
   node scripts/setupErrorMonitoring.js
   ```

2. **ダッシュボード再起動**
   ```bash
   # ダッシュボード再初期化
   node scripts/reinitializeMonitoring.js
   ```

### 2. ログが記録されない

#### 症状
- 構造化ログが記録されない
- ログ検索ができない

#### 対処方法
1. **ログシステム確認**
   ```bash
   # ログシステム確認
   node scripts/validateStructuredLogging.js
   
   # ログテスト
   node scripts/testStructuredLoggingSimple.js
   ```

2. **ログ設定修正**
   ```bash
   # ログ設定の修正
   node scripts/fixLoggingConfiguration.js
   ```

## CI/CDパイプラインの問題

### 1. ビルドが失敗する

#### 症状
- GitHub Actionsでビルドが失敗
- エラーコード: DEPLOY-001

#### 診断手順
1. **ビルドログ確認**
   - GitHub Actionsのログを確認
   - エラーメッセージの特定

2. **ローカルビルド確認**
   ```bash
   # ローカルでビルドテスト
   npm run build:validate
   
   # 依存関係確認
   npm ci
   ```

#### 対処方法
1. **環境変数確認**
   - GitHub Secretsの設定確認
   - 環境変数の値確認

2. **依存関係更新**
   ```bash
   # 依存関係の更新
   npm update
   
   # セキュリティ監査
   npm audit fix
   ```

### 2. デプロイが失敗する

#### 症状
- デプロイメントが途中で停止
- エラーコード: DEPLOY-001

#### 対処方法
1. **デプロイ状況確認**
   ```bash
   # デプロイ状況確認
   node scripts/verifyDeployment.js
   ```

2. **ロールバック実行**
   ```bash
   # 緊急ロールバック
   npm run rollback:emergency production
   ```

### 3. ロールバックが失敗する

#### 症状
- 自動ロールバックが機能しない
- エラーコード: DEPLOY-002

#### 対処方法
1. **手動ロールバック**
   ```bash
   # 手動ロールバック実行
   node scripts/manualRollback.js
   
   # ロールバック検証
   node scripts/rollbackVerification.js
   ```

2. **緊急復旧**
   ```bash
   # 緊急復旧手順
   node scripts/emergencyRecovery.js
   ```

## エスカレーション手順

### レベル1: 初期対応（運用担当者）

#### 対応時間
- **クリティカル**: 即座（15分以内）
- **高**: 30分以内
- **中**: 1時間以内
- **低**: 4時間以内

#### 対応範囲
- 既知の問題の対処
- 基本的なシステムチェック
- 自動復旧スクリプトの実行

#### エスカレーション条件
- 30分以内に解決しない場合
- 複数システムに影響する場合
- セキュリティインシデントの疑いがある場合

### レベル2: 技術対応（開発チーム）

#### 対応時間
- **クリティカル**: 15分以内
- **高**: 1時間以内
- **中**: 4時間以内

#### 対応範囲
- コードレベルの問題調査
- データベース問題の対処
- 外部システム連携問題の対処

#### エスカレーション条件
- 1時間以内に解決しない場合
- システム全体に影響する場合
- データ損失の可能性がある場合

### レベル3: 緊急対応（全チーム + 外部サポート）

#### 対応時間
- **クリティカル**: 即座

#### 対応範囲
- システム全体の停止・復旧
- データ復旧作業
- 外部ベンダーとの連携

#### エスカレーション条件
- サービス全体が停止している場合
- データ損失が発生した場合
- セキュリティ侵害が確認された場合

### 連絡先情報

#### 内部連絡先
```
運用チーム（レベル1）:
- Email: operations@peerlearninghub.com
- Slack: #operations-support
- 電話: [運用担当者直通]

開発チーム（レベル2）:
- Email: dev-team@peerlearninghub.com
- Slack: #dev-emergency
- 電話: [開発リーダー直通]

緊急対応（レベル3）:
- Email: emergency@peerlearninghub.com
- Slack: #incident-response
- 電話: [緊急対応ホットライン]
```

#### 外部サポート連絡先
```
Supabase サポート:
- Email: support@supabase.com
- Discord: Supabase Community
- 緊急時: Enterprise Support (契約に応じて)

RevenueCat サポート:
- Email: support@revenuecat.com
- ドキュメント: https://docs.revenuecat.com/

Expo サポート:
- Discord: Expo Community
- フォーラム: https://forums.expo.dev/

GitHub サポート:
- GitHub Support (Enterprise契約の場合)
- GitHub Community Forum
```

### インシデント報告テンプレート

```
【インシデント報告】

発生日時: YYYY-MM-DD HH:MM:SS
報告者: [名前]
重要度: [クリティカル/高/中/低]

【症状】
- 発生している問題の詳細
- エラーメッセージ
- 影響範囲

【実行した対処】
- 実行したコマンド・手順
- 確認した項目
- 結果

【現在の状況】
- 問題の解決状況
- 残っている課題
- 次のアクション

【添付資料】
- ログファイル
- スクリーンショット
- エラーレポート
```

## 予防保守

### 定期チェック項目

#### 日次
- システム稼働状況確認
- エラーログ確認
- パフォーマンス指標確認
- バックアップ状況確認

#### 週次
- セキュリティスキャン実行
- パフォーマンス分析
- 依存関係脆弱性チェック
- データベース最適化

#### 月次
- 包括的システム評価
- 災害復旧テスト
- 運用手順書更新
- 監視閾値見直し

### 改善提案

#### 自動化の拡張
- 問題検知の自動化
- 復旧手順の自動化
- レポート生成の自動化

#### 監視強化
- 予測的アラートの導入
- ユーザー体験監視の強化
- ビジネスメトリクス監視

#### 文書化改善
- 動画による手順説明
- インタラクティブなトラブルシューティングガイド
- ナレッジベースの構築