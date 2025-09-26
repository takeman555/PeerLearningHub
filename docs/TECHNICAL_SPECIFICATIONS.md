# PeerLearningHub 技術仕様書

## 概要

PeerLearningHub v1.0.0の包括的な技術仕様書です。アーキテクチャ、API仕様、データベース設計、外部システム連携を統合的に文書化しています。

## 目次

1. [システムアーキテクチャ](#システムアーキテクチャ)
2. [技術スタック](#技術スタック)
3. [データベース設計](#データベース設計)
4. [API仕様](#api仕様)
5. [認証・認可システム](#認証認可システム)
6. [外部システム連携](#外部システム連携)
7. [セキュリティ仕様](#セキュリティ仕様)
8. [パフォーマンス仕様](#パフォーマンス仕様)
9. [監視・ログ仕様](#監視ログ仕様)
10. [デプロイメント仕様](#デプロイメント仕様)

## システムアーキテクチャ

### 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
├─────────────────┬─────────────────┬─────────────────────────┤
│   iOS App       │   Android App   │      Web App            │
│ (React Native)  │ (React Native)  │   (Expo Web)            │
└─────────────────┴─────────────────┴─────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Application Layer                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Auth Service  │ Community Svc   │   External Systems      │
│   User Mgmt     │ Content Mgmt    │   Integration           │
│   Membership    │ Group Mgmt      │   Monitoring            │
└─────────────────┴─────────────────┴─────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Supabase      │   RevenueCat    │   External APIs         │
│   PostgreSQL    │   Subscriptions │   Booking/Learning      │
│   Real-time     │   Analytics     │   Project Platforms     │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### コンポーネント構成

#### フロントエンド層
- **React Native**: クロスプラットフォームモバイルアプリ
- **Expo**: 開発・ビルド・デプロイメントプラットフォーム
- **TypeScript**: 型安全性とコード品質向上
- **Expo Router**: ファイルベースナビゲーション

#### バックエンド層
- **Supabase**: BaaS（Backend as a Service）
- **PostgreSQL**: メインデータベース
- **Row Level Security**: データアクセス制御
- **Real-time Subscriptions**: リアルタイム機能

#### 外部サービス層
- **RevenueCat**: サブスクリプション管理
- **外部予約システム**: 宿泊施設予約
- **学習プラットフォーム**: 外部学習リソース

## 技術スタック

### フロントエンド技術

| 技術 | バージョン | 用途 |
|------|------------|------|
| React Native | 0.74.x | モバイルアプリフレームワーク |
| Expo | SDK 51 | 開発・ビルド・デプロイ |
| TypeScript | 5.x | 型安全なJavaScript |
| Expo Router | v3 | ナビゲーション |
| React Context | - | 状態管理 |
| AsyncStorage | - | ローカルストレージ |

### バックエンド技術

| 技術 | バージョン | 用途 |
|------|------------|------|
| Supabase | Latest | BaaS プラットフォーム |
| PostgreSQL | 15.x | メインデータベース |
| PostgREST | - | 自動API生成 |
| GoTrue | - | 認証サービス |
| Realtime | - | リアルタイム通信 |

### 開発・運用技術

| 技術 | バージョン | 用途 |
|------|------------|------|
| Node.js | 18.x | 開発環境・スクリプト |
| npm | 10.x | パッケージ管理 |
| GitHub Actions | - | CI/CD |
| EAS Build | - | アプリビルド |
| EAS Update | - | OTAアップデート |

## データベース設計

### ERD（Entity Relationship Diagram）

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   auth.users    │    │    profiles     │    │   user_roles    │
│                 │    │                 │    │                 │
│ • id (PK)       │◄──►│ • id (PK,FK)    │◄──►│ • user_id (FK)  │
│ • email         │    │ • email         │    │ • role          │
│ • created_at    │    │ • full_name     │    │ • is_active     │
│                 │    │ • avatar_url    │    │ • expires_at    │
└─────────────────┘    │ • country       │    └─────────────────┘
                       │ • bio           │
                       │ • skills[]      │
                       │ • languages[]   │
                       │ • is_verified   │
                       │ • is_active     │
                       └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     groups      │    │      posts      │    │   post_likes    │
│                 │    │                 │    │                 │
│ • id (PK)       │◄──►│ • id (PK)       │◄──►│ • post_id (FK)  │
│ • name          │    │ • author_id(FK) │    │ • user_id (FK)  │
│ • description   │    │ • group_id (FK) │    │ • created_at    │
│ • category      │    │ • title         │    └─────────────────┘
│ • is_public     │    │ • content       │
│ • created_by    │    │ • tags[]        │
│ • member_count  │    │ • like_count    │
└─────────────────┘    │ • is_published  │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │    comments     │
                       │                 │
                       │ • id (PK)       │
                       │ • post_id (FK)  │
                       │ • author_id(FK) │
                       │ • content       │
                       │ • parent_id(FK) │
                       │ • like_count    │
                       └─────────────────┘
```

### テーブル仕様

#### profiles テーブル
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  country TEXT,
  bio TEXT,
  skills TEXT[],
  languages TEXT[],
  timezone TEXT DEFAULT 'UTC',
  date_of_birth DATE,
  phone_number TEXT,
  social_links JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_roles テーブル
```sql
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  reason TEXT,
  UNIQUE(user_id, role)
);
```

#### groups テーブル
```sql
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[],
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 100,
  current_members INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### posts テーブル
```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  tags TEXT[],
  is_published BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### インデックス設計

#### パフォーマンス最適化インデックス
```sql
-- プロファイル検索用
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_skills ON profiles USING GIN(skills);
CREATE INDEX idx_profiles_languages ON profiles USING GIN(languages);

-- 投稿検索用
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_group_id ON posts(group_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- ロール管理用
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);
```

## API仕様

### RESTful API エンドポイント

#### 認証API

| メソッド | エンドポイント | 説明 | 認証 |
|----------|----------------|------|------|
| POST | `/auth/signup` | ユーザー登録 | 不要 |
| POST | `/auth/signin` | ログイン | 不要 |
| POST | `/auth/signout` | ログアウト | 必要 |
| POST | `/auth/reset-password` | パスワードリセット | 不要 |
| PUT | `/auth/update-password` | パスワード更新 | 必要 |

#### プロファイルAPI

| メソッド | エンドポイント | 説明 | 認証 |
|----------|----------------|------|------|
| GET | `/profiles/me` | 自分のプロファイル取得 | 必要 |
| PUT | `/profiles/me` | プロファイル更新 | 必要 |
| GET | `/profiles/{id}` | 他ユーザープロファイル取得 | 必要 |
| GET | `/profiles` | プロファイル一覧 | 必要 |

#### コミュニティAPI

| メソッド | エンドポイント | 説明 | 認証 |
|----------|----------------|------|------|
| GET | `/posts` | 投稿一覧取得 | 必要 |
| POST | `/posts` | 投稿作成 | 必要 |
| GET | `/posts/{id}` | 投稿詳細取得 | 必要 |
| PUT | `/posts/{id}` | 投稿更新 | 必要 |
| DELETE | `/posts/{id}` | 投稿削除 | 必要 |
| POST | `/posts/{id}/like` | いいね追加 | 必要 |
| DELETE | `/posts/{id}/like` | いいね削除 | 必要 |

#### グループAPI

| メソッド | エンドポイント | 説明 | 認証 |
|----------|----------------|------|------|
| GET | `/groups` | グループ一覧取得 | 必要 |
| POST | `/groups` | グループ作成 | 管理者 |
| GET | `/groups/{id}` | グループ詳細取得 | 必要 |
| PUT | `/groups/{id}` | グループ更新 | 管理者 |
| DELETE | `/groups/{id}` | グループ削除 | 管理者 |

### リアルタイムAPI

#### Supabase Realtime チャンネル

```typescript
// 投稿のリアルタイム更新
const postsChannel = supabase
  .channel('posts')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'posts'
  }, (payload) => {
    // 投稿の変更を処理
  })
  .subscribe();

// いいねのリアルタイム更新
const likesChannel = supabase
  .channel('post_likes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'post_likes'
  }, (payload) => {
    // いいねの変更を処理
  })
  .subscribe();
```

### API レスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "message": "操作が成功しました",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "認証に失敗しました",
    "details": "トークンが無効です"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 認証・認可システム

### 認証フロー

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │  Supabase   │    │ PostgreSQL  │
│             │    │    Auth     │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
        │                   │                   │
        │ 1. signup/signin  │                   │
        ├──────────────────►│                   │
        │                   │ 2. create user    │
        │                   ├──────────────────►│
        │                   │                   │
        │                   │ 3. trigger        │
        │                   │   new_user        │
        │                   │◄──────────────────┤
        │                   │                   │
        │ 4. JWT token      │                   │
        │◄──────────────────┤                   │
        │                   │                   │
        │ 5. API requests   │                   │
        │   with token      │                   │
        ├──────────────────►│                   │
        │                   │ 6. validate &     │
        │                   │   execute RLS     │
        │                   ├──────────────────►│
```

### ロールベースアクセス制御（RBAC）

#### ロール階層
```
super_admin (最高権限)
    │
    ├── admin (管理者権限)
    │   │
    │   ├── moderator (モデレーター権限)
    │   │   │
    │   │   └── user (一般ユーザー権限)
```

#### 権限マトリックス

| 機能 | user | moderator | admin | super_admin |
|------|------|-----------|-------|-------------|
| 投稿作成 | ✓ | ✓ | ✓ | ✓ |
| 投稿編集（自分） | ✓ | ✓ | ✓ | ✓ |
| 投稿編集（他人） | ✗ | ✓ | ✓ | ✓ |
| 投稿削除（自分） | ✓ | ✓ | ✓ | ✓ |
| 投稿削除（他人） | ✗ | ✓ | ✓ | ✓ |
| グループ作成 | ✗ | ✗ | ✓ | ✓ |
| グループ管理 | ✗ | ✗ | ✓ | ✓ |
| ユーザー管理 | ✗ | ✗ | ✓ | ✓ |
| ロール管理 | ✗ | ✗ | ✗ | ✓ |
| システム設定 | ✗ | ✗ | ✗ | ✓ |

### Row Level Security (RLS) ポリシー

#### プロファイルアクセス制御
```sql
-- ユーザーは自分のプロファイルを表示・更新可能
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 認証済みユーザーは他ユーザーの公開情報を表示可能
CREATE POLICY "Authenticated users can view public profiles" ON profiles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND is_active = true
  );

-- 管理者は全プロファイルにアクセス可能
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = true
    )
  );
```

#### 投稿アクセス制御
```sql
-- 全ユーザーが公開投稿を表示可能
CREATE POLICY "Anyone can view published posts" ON posts
  FOR SELECT USING (is_published = true);

-- メンバーのみ投稿作成可能
CREATE POLICY "Members can create posts" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('user', 'moderator', 'admin', 'super_admin')
      AND is_active = true
    )
  );

-- 投稿者は自分の投稿を編集・削除可能
CREATE POLICY "Authors can manage own posts" ON posts
  FOR ALL USING (auth.uid() = author_id);

-- モデレーター以上は全投稿を管理可能
CREATE POLICY "Moderators can manage all posts" ON posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('moderator', 'admin', 'super_admin')
      AND is_active = true
    )
  );
```

## 外部システム連携

### RevenueCat 統合

#### 設定
```typescript
// config/revenuecat.ts
export const revenueCatConfig = {
  apiKey: {
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
  },
  products: {
    premium_monthly: 'premium_monthly_subscription',
    premium_yearly: 'premium_yearly_subscription',
  },
  entitlements: {
    premium: 'premium_features',
  },
};
```

#### サブスクリプション管理
```typescript
// services/revenueCatService.ts
class RevenueCatService {
  async initializePurchases(): Promise<void> {
    await Purchases.configure({
      apiKey: revenueCatConfig.apiKey[Platform.OS],
    });
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    const offerings = await Purchases.getOfferings();
    const product = offerings.current?.availablePackages.find(
      pkg => pkg.product.identifier === productId
    );
    
    if (!product) {
      throw new Error('Product not found');
    }

    return await Purchases.purchasePackage(product);
  }

  async restorePurchases(): Promise<CustomerInfo> {
    return await Purchases.restorePurchases();
  }
}
```

### 外部予約システム連携

#### 宿泊施設予約API
```typescript
// services/accommodationService.ts
interface AccommodationBooking {
  id: string;
  name: string;
  location: string;
  price: number;
  availability: boolean;
  externalUrl: string;
}

class AccommodationService {
  async getAvailableAccommodations(
    location: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<AccommodationBooking[]> {
    // 外部予約システムAPIを呼び出し
    const response = await fetch(`${BOOKING_API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BOOKING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
      }),
    });

    return response.json();
  }
}
```

### 学習プラットフォーム連携

#### 外部学習リソース
```typescript
// services/learningResourceService.ts
interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'tutorial' | 'exercise';
  level: 'beginner' | 'intermediate' | 'advanced';
  externalUrl: string;
  provider: string;
}

class LearningResourceService {
  async getRecommendedResources(
    userId: string,
    skills: string[],
    level: string
  ): Promise<LearningResource[]> {
    // 外部学習プラットフォームAPIを呼び出し
    const response = await fetch(`${LEARNING_API_BASE}/recommendations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEARNING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        skills,
        level,
      }),
    });

    return response.json();
  }
}
```

## セキュリティ仕様

### データ暗号化

#### 保存時暗号化
- **データベース**: Supabase標準のAES-256暗号化
- **ローカルストレージ**: AsyncStorage + 暗号化ライブラリ
- **機密データ**: 追加のフィールドレベル暗号化

#### 転送時暗号化
- **HTTPS**: 全通信でTLS 1.3使用
- **WebSocket**: WSS（WebSocket Secure）使用
- **API通信**: 証明書ピニング実装

### 認証セキュリティ

#### パスワードポリシー
```typescript
const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90, // days
  historyCount: 5, // previous passwords to remember
};
```

#### セッション管理
```typescript
const sessionConfig = {
  timeout: 24 * 60 * 60, // 24 hours
  refreshThreshold: 60 * 60, // 1 hour before expiry
  maxConcurrentSessions: 3,
  secureFlags: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  },
};
```

### API セキュリティ

#### レート制限
```typescript
const rateLimits = {
  auth: {
    login: { requests: 5, window: 15 * 60 }, // 5 requests per 15 minutes
    signup: { requests: 3, window: 60 * 60 }, // 3 requests per hour
  },
  api: {
    general: { requests: 100, window: 60 }, // 100 requests per minute
    upload: { requests: 10, window: 60 }, // 10 uploads per minute
  },
};
```

#### 入力検証
```typescript
// 入力サニタイゼーション
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// SQLインジェクション防止
const validateSqlInput = (input: string): boolean => {
  const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i;
  return !sqlInjectionPattern.test(input);
};
```

### 脆弱性対策

#### セキュリティヘッダー
```typescript
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};
```

#### 依存関係管理
```bash
# 定期的な脆弱性スキャン
npm audit
npm audit fix

# Snyk統合
snyk test
snyk monitor
```

## パフォーマンス仕様

### パフォーマンス目標

| メトリクス | 目標値 | 測定方法 |
|------------|--------|----------|
| アプリ起動時間 | 3秒以内 | Time to Interactive |
| 画面遷移時間 | 1秒以内 | Navigation Performance |
| API レスポンス時間 | 500ms以内 | Network Monitoring |
| メモリ使用量 | 100MB以内 | Memory Profiling |
| バッテリー消費 | 最小限 | Energy Impact |

### 最適化戦略

#### コード最適化
```typescript
// バンドル分割
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// メモ化
const MemoizedComponent = React.memo(({ data }) => {
  return <ExpensiveComponent data={data} />;
});

// 仮想化リスト
import { FlatList } from 'react-native';

const OptimizedList = ({ data }) => (
  <FlatList
    data={data}
    renderItem={renderItem}
    getItemLayout={getItemLayout}
    removeClippedSubviews={true}
    maxToRenderPerBatch={10}
    windowSize={10}
  />
);
```

#### 画像最適化
```typescript
// 画像圧縮設定
const imageConfig = {
  quality: 0.8,
  maxWidth: 1024,
  maxHeight: 1024,
  format: 'webp',
  progressive: true,
};

// レイジーローディング
const LazyImage = ({ source, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <Image
      source={loaded ? source : placeholder}
      onLoad={() => setLoaded(true)}
      {...props}
    />
  );
};
```

#### データベース最適化
```sql
-- クエリ最適化
EXPLAIN ANALYZE SELECT 
  p.*, u.full_name, u.avatar_url
FROM posts p
JOIN profiles u ON p.author_id = u.id
WHERE p.is_published = true
ORDER BY p.created_at DESC
LIMIT 20;

-- インデックス最適化
CREATE INDEX CONCURRENTLY idx_posts_published_created 
ON posts(is_published, created_at DESC) 
WHERE is_published = true;
```

## 監視・ログ仕様

### 監視システム

#### パフォーマンス監視
```typescript
// services/performanceMonitoringService.ts
interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  errorRate: number;
}

class PerformanceMonitoringService {
  async recordMetrics(metrics: PerformanceMetrics): Promise<void> {
    // メトリクスをローカルストレージとリモートに保存
    await this.storeLocalMetrics(metrics);
    await this.sendToRemoteMonitoring(metrics);
  }

  async getPerformanceReport(): Promise<PerformanceReport> {
    // パフォーマンスレポートを生成
    return this.generateReport();
  }
}
```

#### エラー監視
```typescript
// services/errorMonitoringService.ts
interface ErrorReport {
  message: string;
  stack: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
  timestamp: Date;
}

class ErrorMonitoringService {
  async reportError(error: Error, context?: Record<string, any>): Promise<void> {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack || '',
      severity: this.determineSeverity(error),
      context: context || {},
      timestamp: new Date(),
    };

    await this.storeErrorReport(report);
    await this.sendAlert(report);
  }
}
```

### 構造化ログ

#### ログ形式
```typescript
interface StructuredLogEntry {
  timestamp: string; // ISO 8601
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  category: 'auth' | 'community' | 'external_systems' | 'performance' | 'security';
  message: string;
  context?: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    source?: string;
    action?: string;
  };
  metadata?: {
    duration?: number;
    statusCode?: number;
    errorCode?: string;
    stackTrace?: string;
  };
  tags?: string[];
}
```

#### ログ出力例
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "INFO",
  "category": "auth",
  "message": "User login successful",
  "context": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "sessionId": "sess_abc123",
    "source": "AuthService",
    "action": "login"
  },
  "metadata": {
    "duration": 250,
    "statusCode": 200
  },
  "tags": ["authentication", "success"]
}
```

### アラート設定

#### アラートルール
```typescript
const alertRules = [
  {
    name: 'High Error Rate',
    condition: 'error_rate > 5%',
    timeWindow: '5m',
    severity: 'high',
    actions: ['email', 'slack'],
  },
  {
    name: 'Slow Response Time',
    condition: 'avg_response_time > 1000ms',
    timeWindow: '10m',
    severity: 'medium',
    actions: ['slack'],
  },
  {
    name: 'Memory Usage High',
    condition: 'memory_usage > 150MB',
    timeWindow: '15m',
    severity: 'medium',
    actions: ['email'],
  },
];
```

## デプロイメント仕様

### CI/CD パイプライン

#### GitHub Actions ワークフロー
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform all --non-interactive
```

### 環境管理

#### 環境別設定
```typescript
// config/environment.ts
interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  revenuecat: {
    apiKey: string;
  };
  monitoring: {
    enabled: boolean;
    endpoint: string;
  };
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL_DEV!,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV!,
    },
    revenuecat: {
      apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_DEV!,
    },
    monitoring: {
      enabled: false,
      endpoint: '',
    },
  },
  production: {
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL_PROD!,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD!,
    },
    revenuecat: {
      apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_PROD!,
    },
    monitoring: {
      enabled: true,
      endpoint: process.env.MONITORING_ENDPOINT!,
    },
  },
};
```

### ロールバック戦略

#### 自動ロールバック
```typescript
// scripts/rollbackManager.js
class RollbackManager {
  async createRollbackPoint(environment: string, description: string): Promise<string> {
    const rollbackPoint = {
      id: generateId(),
      environment,
      description,
      timestamp: new Date().toISOString(),
      appVersion: await this.getCurrentAppVersion(),
      databaseSchema: await this.getDatabaseSchemaVersion(),
    };

    await this.storeRollbackPoint(rollbackPoint);
    return rollbackPoint.id;
  }

  async executeRollback(rollbackPointId: string): Promise<void> {
    const rollbackPoint = await this.getRollbackPoint(rollbackPointId);
    
    // アプリケーションのロールバック
    await this.rollbackApplication(rollbackPoint.appVersion);
    
    // データベースのロールバック（必要に応じて）
    await this.rollbackDatabase(rollbackPoint.databaseSchema);
    
    // 検証
    await this.verifyRollback(rollbackPoint);
  }
}
```

## 付録

### 開発環境セットアップ

#### 必要なツール
```bash
# Node.js (v18以上)
node --version

# npm (v10以上)
npm --version

# Expo CLI
npm install -g @expo/cli

# EAS CLI
npm install -g eas-cli
```

#### プロジェクトセットアップ
```bash
# リポジトリクローン
git clone https://github.com/your-org/PeerLearningHub.git
cd PeerLearningHub

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .envファイルを編集

# 開発サーバー起動
npm start
```

### トラブルシューティング

#### よくある問題と解決方法

1. **ビルドエラー**
   ```bash
   # キャッシュクリア
   npm start -- --clear
   
   # node_modules再インストール
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **データベース接続エラー**
   ```bash
   # 接続テスト
   node scripts/testSupabaseConnection.js
   
   # 環境変数確認
   node scripts/checkEnv.js
   ```

3. **認証エラー**
   ```bash
   # 認証設定確認
   node scripts/verifyAuthConfig.js
   
   # 認証テスト
   node scripts/testAuth.js
   ```

### 参考資料

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**最終更新**: 2024年9月26日  
**バージョン**: 1.0.0  
**作成者**: PeerLearningHub Development Team