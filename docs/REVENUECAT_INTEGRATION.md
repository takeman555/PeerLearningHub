# RevenueCat統合ガイド - ピアラーニングハブ

このドキュメントは、ピアラーニングハブアプリケーションでのRevenueCat統合について説明します。

## 概要

RevenueCatは、モバイルアプリのサブスクリプション管理を簡素化するプラットフォームです。このアプリでは、メンバーシップ機能の実装にRevenueCatを使用しています。

## セットアップ

### 1. RevenueCatアカウント作成

1. [RevenueCat Dashboard](https://app.revenuecat.com)にアクセス
2. アカウントを作成
3. 新しいプロジェクトを作成: `peer-learning-hub`

### 2. アプリ設定

#### iOS設定
1. RevenueCat Dashboard > Apps > Add App
2. Platform: iOS
3. Bundle ID: `com.peerlearninghub.app`
4. App Store Connect APIキーを設定

#### Android設定
1. RevenueCat Dashboard > Apps > Add App
2. Platform: Android
3. Package Name: `com.peerlearninghub.app`
4. Google Play Console APIキーを設定

### 3. 環境変数設定

```env
# .env
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_ios_api_key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_android_api_key
```

### 4. プロダクト設定

#### App Store Connect (iOS)
1. App Store Connect > My Apps > In-App Purchases
2. 以下のプロダクトを作成:
   - `peer_learning_hub_monthly` - 月額メンバーシップ
   - `peer_learning_hub_yearly` - 年額メンバーシップ
   - `peer_learning_hub_lifetime` - 生涯メンバーシップ

#### Google Play Console (Android)
1. Google Play Console > Subscriptions
2. 同様のプロダクトを作成

### 5. RevenueCatでのプロダクト設定

1. RevenueCat Dashboard > Products
2. App Store Connect/Google Play Consoleからプロダクトをインポート
3. エンタイトルメント `premium_membership` を作成
4. プロダクトをエンタイトルメントに関連付け

## 実装

### 1. 基本的な使用方法

```typescript
import { revenueCatService } from '../services/revenueCatService';
import { useMembership } from '../contexts/MembershipContext';

// サービスの初期化
await revenueCatService.initialize();

// ユーザー登録
await revenueCatService.registerUser('user-id', {
  email: 'user@example.com',
  user_type: 'visitor'
});

// メンバーシップコンテキストの使用
const { 
  isActive, 
  membershipType, 
  availablePlans, 
  purchaseMembership 
} = useMembership();
```

### 2. メンバーシップ購入フロー

```typescript
// 利用可能なプランを取得
const plans = await revenueCatService.getAvailablePlans();

// 月額プランを購入
if (plans.monthly) {
  const result = await purchaseMembership(plans.monthly);
  
  if (result.success) {
    console.log('購入成功');
  } else if (result.userCancelled) {
    console.log('ユーザーがキャンセル');
  } else {
    console.error('購入失敗:', result.error);
  }
}
```

### 3. メンバーシップ状態の確認

```typescript
// 現在のメンバーシップ状態を取得
const status = await revenueCatService.getMembershipStatus();

console.log('アクティブ:', status.isActive);
console.log('タイプ:', status.membershipType);

if (status.subscriptionInfo) {
  console.log('プロダクト:', status.subscriptionInfo.productIdentifier);
  console.log('期限:', status.subscriptionInfo.expirationDate);
  console.log('自動更新:', status.subscriptionInfo.willRenew);
}
```

### 4. 購入復元

```typescript
// 購入を復元
const result = await revenueCatService.restorePurchases();

if (result.success) {
  console.log('復元成功');
} else {
  console.error('復元失敗:', result.error);
}
```

## コンポーネント統合

### 1. MembershipContextの使用

```typescript
import { MembershipProvider, useMembership } from '../contexts/MembershipContext';

// アプリのルートでプロバイダーを設定
function App() {
  return (
    <MembershipProvider>
      <YourAppContent />
    </MembershipProvider>
  );
}

// コンポーネントでメンバーシップ状態を使用
function MembershipScreen() {
  const { 
    isLoading,
    isActive, 
    membershipType,
    availablePlans,
    purchaseMembership,
    restorePurchases 
  } = useMembership();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View>
      <Text>メンバーシップ状態: {membershipType}</Text>
      {!isActive && (
        <Button 
          title="メンバーになる" 
          onPress={() => purchaseMembership(availablePlans.monthly!)}
        />
      )}
    </View>
  );
}
```

### 2. カスタムフックの使用

```typescript
import { useIsMember, useMembershipExpiry } from '../contexts/MembershipContext';

function PremiumFeature() {
  const isMember = useIsMember();
  const { isExpiring, daysLeft } = useMembershipExpiry();

  if (!isMember) {
    return <UpgradePrompt />;
  }

  if (isExpiring) {
    return (
      <View>
        <Text>メンバーシップが{daysLeft}日で期限切れです</Text>
        <PremiumContent />
      </View>
    );
  }

  return <PremiumContent />;
}
```

## データベース統合

### 1. メンバーシップ状態の同期

RevenueCatの状態変更は自動的にSupabaseデータベースと同期されます：

```typescript
// 購入成功時
await revenueCatService.syncMembershipStatus(customerInfo);

// データベースのprofilesテーブルが更新される
// - user_type: 'member'
// - membership_status: 'active'
// - membership_expires_at: '2024-02-01T00:00:00Z'
```

### 2. 購入履歴の記録

```typescript
// 購入履歴がin_app_purchasesテーブルに記録される
{
  user_id: 'user-id',
  product_id: 'peer_learning_hub_monthly',
  transaction_id: 'rc_1234567890',
  amount: 9.99,
  currency: 'USD',
  purchase_date: '2024-01-01T00:00:00Z',
  revenuecat_transaction_id: 'rc_original_id'
}
```

## 使用可能なコンポーネント

### 1. MembershipScreen
完全なメンバーシップ管理画面

```typescript
import MembershipScreen from '../components/Membership/MembershipScreen';

<MembershipScreen />
```

### 2. MembershipStatus
メンバーシップ状態の表示

```typescript
import MembershipStatus from '../components/Membership/MembershipStatus';

<MembershipStatus showUpgradeButton={true} compact={false} />
```

### 3. UpgradePrompt
プレミアム機能へのアップグレードプロンプト

```typescript
import UpgradePrompt from '../components/Membership/UpgradePrompt';

<UpgradePrompt 
  visible={showPrompt}
  onClose={() => setShowPrompt(false)}
  title="プレミアム機能"
  message="この機能を利用するにはメンバーシップが必要です。"
  feature="高度な検索機能"
/>
```

## データベーススキーマ

### プロフィールテーブルの拡張

```sql
ALTER TABLE profiles 
ADD COLUMN user_type TEXT DEFAULT 'visitor',
ADD COLUMN membership_status TEXT DEFAULT 'none',
ADD COLUMN membership_expires_at TIMESTAMPTZ,
ADD COLUMN revenuecat_user_id TEXT;
```

### 購入履歴テーブル

```sql
CREATE TABLE in_app_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  product_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  purchase_date TIMESTAMPTZ NOT NULL,
  revenuecat_transaction_id TEXT,
  status TEXT DEFAULT 'completed',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### メンバーシップ履歴テーブル

```sql
CREATE TABLE membership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  previous_type TEXT,
  new_type TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## セットアップ手順

1. **依存関係のインストール**
   ```bash
   npm install react-native-purchases
   ```

2. **環境変数の設定**
   ```bash
   cp .env.example .env
   # .envファイルを編集してRevenueCatのAPIキーを設定
   ```

3. **データベースマイグレーションの実行**
   ```bash
   # Supabaseでマイグレーションを実行
   supabase db push
   ```

4. **RevenueCatダッシュボードでの設定**
   - プロダクトの作成
   - エンタイトルメントの設定
   - App Store/Google Play Consoleとの連携

5. **テスト**
   ```bash
   # アプリを起動してメンバーシップ機能をテスト
   npm start
   ```

## トラブルシューティング

### よくある問題

1. **初期化エラー**
   - APIキーを確認
   - プラットフォーム設定を確認
   - ネットワーク接続を確認

2. **購入失敗**
   - プロダクトIDを確認
   - App Store/Google Play設定を確認
   - サンドボックスアカウントを確認

3. **復元失敗**
   - 同じApple ID/Googleアカウントでログインしているか確認
   - プロダクトが正しく設定されているか確認

4. **エンタイトルメント未付与**
   - RevenueCat Dashboardでエンタイトルメント設定を確認
   - プロダクトとエンタイトルメントの関連付けを確認

## 実装チェックリスト

- [x] RevenueCat依存関係の追加
- [x] 設定ファイルの作成
- [x] サービスクラスの実装
- [x] メンバーシップコンテキストの実装
- [x] UIコンポーネントの作成
- [x] データベーススキーマの拡張
- [x] 環境変数の設定
- [x] ドキュメントの作成

## 次のステップ

1. RevenueCatアカウントの作成と設定
2. App Store Connect/Google Play Consoleでのプロダクト作成
3. 実際のAPIキーでのテスト
4. 本番環境での動作確認

これでRevenueCat統合が完了し、堅牢なメンバーシップシステムが構築されます。