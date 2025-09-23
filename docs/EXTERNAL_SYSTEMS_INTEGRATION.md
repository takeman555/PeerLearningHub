# 外部システム連携基盤

## 概要

PeerLearningHubの外部システム連携基盤は、外部プラットフォームからのデータを統合し、ユーザーに統一されたインターフェースを提供します。

## 対応プラットフォーム

### プロジェクト管理
- **GitHub**: オープンソースプロジェクト
- **GitLab**: プライベート・パブリックプロジェクト
- **Notion**: プロジェクト文書・計画
- **Trello**: タスク管理
- **Asana**: チームプロジェクト

### セッション・会議
- **Zoom**: ビデオ会議・ウェビナー
- **Discord**: コミュニティセッション
- **Microsoft Teams**: 企業向けセッション
- **Google Meet**: カジュアルミーティング
- **Webex**: プロフェッショナル会議

### 宿泊施設
- **Airbnb**: 短期宿泊
- **Booking.com**: ホテル・宿泊施設
- **Hostelworld**: バックパッカー向け
- **Hotels.com**: ホテル予約
- **Expedia**: 総合旅行サイト

## データベース設計

### 外部プロジェクトテーブル (external_projects)

```sql
CREATE TABLE external_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL,
    source_platform VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    difficulty_level VARCHAR(20),
    tags TEXT[],
    participants_count INTEGER DEFAULT 0,
    max_participants INTEGER,
    external_url TEXT,
    image_url TEXT,
    metadata JSONB,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 外部セッションテーブル (external_sessions)

```sql
CREATE TABLE external_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL,
    source_platform VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    session_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    join_url TEXT,
    meeting_id VARCHAR(255),
    password VARCHAR(255),
    host_name VARCHAR(255),
    host_email VARCHAR(255),
    tags TEXT[],
    requirements TEXT,
    materials_url TEXT,
    recording_url TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    metadata JSONB,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 外部宿泊施設テーブル (external_accommodations)

```sql
CREATE TABLE external_accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL,
    source_platform VARCHAR(100) NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(255),
    country VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accommodation_type VARCHAR(100),
    price_per_night DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    rating DECIMAL(3, 2),
    review_count INTEGER DEFAULT 0,
    amenities TEXT[],
    images TEXT[],
    availability_start DATE,
    availability_end DATE,
    min_stay_nights INTEGER DEFAULT 1,
    max_guests INTEGER DEFAULT 1,
    check_in_time TIME,
    check_out_time TIME,
    house_rules TEXT,
    cancellation_policy TEXT,
    contact_info JSONB,
    external_url TEXT,
    booking_url TEXT,
    is_available BOOLEAN DEFAULT true,
    metadata JSONB,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## サービス層

### ExternalProjectsService

プロジェクト関連の操作を管理します。

```typescript
// プロジェクト一覧取得
const projects = await ExternalProjectsService.getProjects({
  platform: 'github',
  status: 'active',
  difficulty: 'beginner',
  tags: ['javascript', 'react'],
  limit: 10
});

// プロジェクト詳細取得
const project = await ExternalProjectsService.getProject('project-id');

// プロジェクト同期（管理者用）
await ExternalProjectsService.syncProject(projectData);
```

### ExternalSessionsService

セッション関連の操作を管理します。

```typescript
// セッション一覧取得
const sessions = await ExternalSessionsService.getSessions({
  platform: 'zoom',
  status: 'scheduled',
  session_type: 'workshop',
  date_from: '2024-01-01',
  date_to: '2024-01-31'
});

// 今日のセッション取得
const todaySessions = await ExternalSessionsService.getTodaySessions();

// セッション同期（管理者用）
await ExternalSessionsService.syncSession(sessionData);
```

### ExternalAccommodationsService

宿泊施設関連の操作を管理します。

```typescript
// 宿泊施設検索
const accommodations = await ExternalAccommodationsService.searchAccommodations({
  city: 'Tokyo',
  price_min: 50,
  price_max: 200,
  rating_min: 4.0,
  guests: 2
});

// 人気都市取得
const popularCities = await ExternalAccommodationsService.getPopularCities(10);

// 宿泊施設同期（管理者用）
await ExternalAccommodationsService.syncAccommodation(accommodationData);
```

### ExternalSystemsService

統合サービス機能を提供します。

```typescript
// ダッシュボード統計取得
const stats = await ExternalSystemsService.getDashboardStats();

// 全体検索
const results = await ExternalSystemsService.globalSearch('javascript', {
  types: ['projects', 'sessions'],
  limit: 5
});
```

## コンポーネント

### ExternalProjectCard

プロジェクト情報を表示するカードコンポーネント。

```typescript
<ExternalProjectCard 
  project={project} 
  onPress={(project) => navigateToProject(project)}
/>
```

### ExternalSessionCard

セッション情報を表示するカードコンポーネント。

```typescript
<ExternalSessionCard 
  session={session} 
  onPress={(session) => viewSessionDetails(session)}
  onJoin={(session) => joinSession(session)}
/>
```

### ExternalAccommodationCard

宿泊施設情報を表示するカードコンポーネント。

```typescript
<ExternalAccommodationCard 
  accommodation={accommodation} 
  onPress={(acc) => viewDetails(acc)}
  onBook={(acc) => bookAccommodation(acc)}
/>
```

### ExternalSystemsDashboard

外部システムの統計情報を表示するダッシュボード。

```typescript
<ExternalSystemsDashboard 
  onNavigateToProjects={() => navigate('Projects')}
  onNavigateToSessions={() => navigate('Sessions')}
  onNavigateToAccommodations={() => navigate('Accommodations')}
/>
```

### ExternalSystemsList

外部システムのデータをリスト表示するコンポーネント。

```typescript
<ExternalSystemsList 
  type="projects"
  onItemPress={(item) => handleItemPress(item)}
  initialFilters={{ platform: 'github', status: 'active' }}
/>
```

## セキュリティ

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化されています：

```sql
-- 全ユーザーが読み取り可能
CREATE POLICY "External data is viewable by everyone" 
ON external_projects FOR SELECT USING (true);

-- 管理者のみが更新可能
CREATE POLICY "Only admins can modify external data" 
ON external_projects FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');
```

### データ検証

- 外部IDとプラットフォームの組み合わせで一意性を保証
- 必須フィールドの検証
- データ型の検証
- 不正なデータの除外

## パフォーマンス最適化

### インデックス

```sql
-- プラットフォーム別検索用
CREATE INDEX idx_external_projects_source_platform 
ON external_projects(source_platform);

-- ステータス別検索用
CREATE INDEX idx_external_projects_status 
ON external_projects(status);

-- 日付範囲検索用
CREATE INDEX idx_external_sessions_start_time 
ON external_sessions(start_time);

-- 地域検索用
CREATE INDEX idx_external_accommodations_city 
ON external_accommodations(city);
```

### キャッシュ戦略

- 頻繁にアクセスされるデータのメモリキャッシュ
- 統計情報の定期的な事前計算
- 画像URLのCDNキャッシュ

## 同期戦略

### 定期同期

- プロジェクト: 1時間ごと
- セッション: 15分ごと
- 宿泊施設: 6時間ごと

### リアルタイム同期

- Webhook経由での即座の更新
- WebSocket接続でのライブデータ
- プッシュ通知での重要な変更通知

## エラーハンドリング

### 同期エラー

```typescript
try {
  await ExternalProjectsService.syncProject(projectData);
} catch (error) {
  console.error('Sync failed:', error);
  // エラーログ記録
  // 再試行スケジュール
  // 管理者通知
}
```

### API制限

- レート制限の監視
- 制限到達時の待機
- 代替データソースの利用

## 監視・ログ

### メトリクス

- 同期成功率
- API応答時間
- データ品質スコア
- ユーザー利用統計

### アラート

- 同期失敗の通知
- データ品質低下の警告
- API制限到達の通知

## 今後の拡張

### 新プラットフォーム対応

1. プラットフォーム固有のアダプター作成
2. データマッピング定義
3. 同期ロジック実装
4. テスト・検証

### 機能拡張

- AI推薦システム
- 個人化フィルター
- ソーシャル機能統合
- 分析・レポート機能

## トラブルシューティング

### よくある問題

1. **同期が失敗する**
   - API認証情報の確認
   - ネットワーク接続の確認
   - レート制限の確認

2. **データが表示されない**
   - RLSポリシーの確認
   - データベース接続の確認
   - キャッシュのクリア

3. **パフォーマンスが遅い**
   - インデックスの確認
   - クエリの最適化
   - キャッシュ戦略の見直し