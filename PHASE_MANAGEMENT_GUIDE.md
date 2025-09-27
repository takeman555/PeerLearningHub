# フェーズ管理ガイド

## 概要

PeerLearningHubアプリケーションは段階的なリリース戦略を採用しており、機能を複数のフェーズに分けて提供します。このガイドでは、フェーズ管理システムの仕組みと運用方法について説明します。

## フェーズ構成

### 第1フェーズ（現在提供中）
**対象ユーザー**: 全ユーザー  
**ステータス**: 本番環境で利用可能

- **グローバルコミュニティ** (`/community`)
  - 世界中の学習者やデジタルノマドとつながる
  - 投稿、いいね、コメント機能
  - コミュニティメンバー表示

- **検索・発見** (`/search`)
  - プロジェクト、リソース、宿泊施設を横断検索
  - 統合検索機能

- **リソース・情報** (`/resources`)
  - 学習リソースなどの有用情報と公式情報へのアクセス
  - 情報管理機能

### 第2フェーズ（開発中）
**対象ユーザー**: スーパー管理者のみ  
**ステータス**: 開発中（テスト環境でのみ利用可能）

- **ダッシュボード** (`/learning-dashboard`)
  - ピアラーニングハブでの活動のナビゲーション
  - 個人活動サマリー

- **プロジェクト** (`/projects`)
  - 期限付き企画。関連セミナー・イベントへの参加
  - プロジェクト管理機能

- **ピア学習セッション** (`/peer-sessions`)
  - 部活動や継続的なコミュニティへの参加
  - セッション予約・管理

- **宿泊予約** (`/accommodation`)
  - ピアラーニングハブの公式施設の予約・履歴管理
  - 予約システム統合

- **活動履歴・予定管理** (`/activity`)
  - ピアラーニングハブでの活動の履歴確認と予約管理
  - カレンダー機能

- **管理者ダッシュボード** (`/admin`)
  - システム管理とユーザー管理
  - 管理機能

## 権限システム

### ユーザーロール

| ロール | 説明 | 第1フェーズ | 第2フェーズ |
|--------|------|------------|------------|
| `guest` | 未ログインユーザー | ✅ 閲覧のみ | ❌ アクセス不可 |
| `user` | 一般ユーザー | ✅ 全機能 | ❌ アクセス不可 |
| `admin` | 管理者 | ✅ 全機能 | ❌ アクセス不可 |
| `super_admin` | スーパー管理者 | ✅ 全機能 | ✅ 全機能 |

### 権限チェック関数

```typescript
// 第2フェーズ機能へのアクセス権限チェック
canAccessNextPhaseFeatures(userRole) // super_admin のみ true

// 管理者権限チェック
hasAdminAccess(userRole) // admin または super_admin で true

// スーパー管理者権限チェック
hasSuperAdminAccess(userRole) // super_admin のみ true
```

## 設定ファイル

### `config/phases.ts`
フェーズ管理の中央設定ファイル。全機能の定義と権限設定を管理。

```typescript
export interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  phase: 'current' | 'next';
  requiredRole?: 'user' | 'admin' | 'super_admin';
  status: 'available' | 'development' | 'coming_soon';
}
```

### 主要関数

- `getAvailableFeatures(userRole)`: ユーザーロールに基づいて利用可能な機能を取得
- `getCurrentPhaseFeatures()`: 第1フェーズの機能のみ取得
- `getNextPhaseFeatures()`: 第2フェーズの機能のみ取得
- `isFeatureAvailable(featureId, userRole)`: 特定機能の利用可否チェック

## UI表示制御

### メイン画面 (`app/index.tsx`)
ユーザーロールに基づいて動的に機能ボタンを表示：

- **全ユーザー**: 第1フェーズ機能のみ表示
- **スーパー管理者**: 全機能表示（第2フェーズ機能には「🔧 開発中機能」ラベル付き）

### ボタンスタイル

| ステータス | スタイルクラス | 表示ラベル |
|-----------|---------------|-----------|
| `available` | `actionButton` | なし |
| `development` | `nextPhaseButton` | 🔧 開発中機能 |
| `coming_soon` | `comingSoonButton` | 🚧 次期フェーズで提供予定 |

## スーパー管理者の作成

### 新規作成
```bash
node scripts/createSuperAdmin.js admin@example.com password123 "Super Admin"
```

### 既存ユーザー一覧
```bash
node scripts/createSuperAdmin.js --list
```

## テスト

### アクセス制御テスト
```bash
node scripts/testNextPhaseAccess.js
```

このスクリプトは以下をテストします：
- 各ユーザーロールの権限チェック
- UI表示制御の動作確認
- 既存スーパー管理者の確認

## 運用手順

### 第2フェーズ機能の開発・テスト

1. **スーパー管理者アカウント作成**
   ```bash
   node scripts/createSuperAdmin.js test@example.com password123 "Test Super Admin"
   ```

2. **アプリにログイン**
   - 作成したスーパー管理者アカウントでログイン
   - メイン画面で第2フェーズ機能が表示されることを確認

3. **機能テスト**
   - 各第2フェーズ機能にアクセス
   - 機能の動作確認
   - バグ修正・改善

4. **権限テスト**
   ```bash
   node scripts/testNextPhaseAccess.js
   ```

### 第2フェーズ機能の本番リリース

1. **設定変更**
   - `config/phases.ts`で対象機能の`phase`を`'current'`に変更
   - `requiredRole`を適切な値に設定（通常は削除して全ユーザー対象）
   - `status`を`'available'`に変更

2. **UI更新**
   - 必要に応じてボタンスタイルやラベルを調整

3. **テスト**
   - 全ユーザーロールでの動作確認
   - 権限テストの実行

4. **デプロイ**
   - 本番環境への反映

## トラブルシューティング

### よくある問題

#### 1. スーパー管理者でも第2フェーズ機能が表示されない
**原因**: ユーザーロールが正しく設定されていない
**解決方法**: 
```bash
# ユーザーロール確認
node scripts/testNextPhaseAccess.js

# 必要に応じてスーパー管理者を再作成
node scripts/createSuperAdmin.js admin@example.com password123 "Super Admin"
```

#### 2. 機能ボタンが表示されない
**原因**: `config/phases.ts`の設定ミス
**解決方法**: 
- `phase`設定の確認
- `requiredRole`設定の確認
- `status`設定の確認

#### 3. 権限エラーが発生する
**原因**: データベースのユーザーロールとアプリの認識が不一致
**解決方法**:
- データベースの`profiles`テーブルでユーザーロール確認
- 必要に応じて手動でロール更新

## セキュリティ考慮事項

1. **ロール検証**: クライアントサイドの権限チェックに加え、サーバーサイドでも検証
2. **機能隠蔽**: 権限のないユーザーには機能を完全に隠蔽
3. **監査ログ**: スーパー管理者の操作ログを記録
4. **定期レビュー**: スーパー管理者権限の定期的な見直し

## まとめ

このフェーズ管理システムにより：
- 段階的な機能リリースが可能
- 開発中機能の安全なテストが可能
- ユーザーエクスペリエンスの向上
- 運用リスクの軽減

第2フェーズ機能の開発・テストは、スーパー管理者権限を持つユーザーのみが行い、一般ユーザーには影響を与えません。