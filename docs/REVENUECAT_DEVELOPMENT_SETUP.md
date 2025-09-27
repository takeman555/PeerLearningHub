# RevenueCat 開発環境セットアップガイド

## 概要

PeerLearningHubでは、メンバーシップ管理にRevenueCatを使用しています。開発環境では、RevenueCatは無効化されており、モックデータを使用してアプリの動作をテストできます。

## 開発環境での動作

### デフォルト設定（RevenueCat無効）

- RevenueCatサービスは初期化されません
- メンバーシップ機能はモックデータで動作します
- 購入フローはシミュレーションされます
- エラーは発生せず、開発に集中できます

### RevenueCatを有効にする場合

実際のRevenueCat機能をテストしたい場合は、以下の手順に従ってください：

## セットアップ手順

### 1. RevenueCatアカウントの作成

1. [RevenueCat](https://www.revenuecat.com/)にアクセス
2. アカウントを作成
3. 新しいプロジェクトを作成

### 2. アプリの設定

1. RevenueCatダッシュボードでアプリを追加
2. iOS用とAndroid用のAPIキーを取得

### 3. 環境変数の設定

`.env`ファイルを編集：

```bash
# RevenueCat Configuration
EXPO_PUBLIC_REVENUECAT_ENABLED=true
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_ios_api_key_here
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_android_api_key_here
```

### 4. プロダクトの設定

RevenueCatダッシュボードで以下のプロダクトを設定：

```javascript
// プロダクトID
PRODUCT_IDS = {
  MONTHLY_MEMBERSHIP: 'peer_learning_hub_monthly',
  YEARLY_MEMBERSHIP: 'peer_learning_hub_yearly',
  LIFETIME_MEMBERSHIP: 'peer_learning_hub_lifetime',
}

// エンタイトルメント
ENTITLEMENTS = {
  PREMIUM_MEMBERSHIP: 'premium_membership',
}
```

### 5. App Store Connect / Google Play Console設定

#### iOS (App Store Connect)
1. App Store Connectでアプリを作成
2. In-App Purchasesを設定
3. 上記のプロダクトIDでサブスクリプションを作成

#### Android (Google Play Console)
1. Google Play Consoleでアプリを作成
2. In-app productsを設定
3. 上記のプロダクトIDでサブスクリプションを作成

## テスト方法

### 1. サンドボックステスト

#### iOS
- App Store Connectでサンドボックステスターアカウントを作成
- デバイスでサンドボックスアカウントでサインイン

#### Android
- Google Play Consoleでテストアカウントを設定
- Internal testingまたはClosed testingを使用

### 2. 動作確認

1. アプリを起動
2. メンバーシップ画面に移動
3. 購入フローをテスト
4. 購入復元をテスト

## トラブルシューティング

### よくある問題

#### 1. "No products found"エラー
- プロダクトIDが正しく設定されているか確認
- App Store Connect/Google Play Consoleでプロダクトが承認されているか確認
- RevenueCatダッシュボードでプロダクトが同期されているか確認

#### 2. "Invalid API key"エラー
- APIキーが正しくコピーされているか確認
- iOS/Android用のキーが正しく設定されているか確認

#### 3. 購入が完了しない
- サンドボックスアカウントでサインインしているか確認
- ネットワーク接続を確認
- RevenueCatダッシュボードでトランザクションログを確認

### デバッグ方法

1. RevenueCatのデバッグログを有効化：
```javascript
// config/revenuecat.ts
if (__DEV__) {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
}
```

2. デバッグ情報を取得：
```javascript
const debugInfo = await revenueCatService.getDebugInfo();
console.log('RevenueCat Debug Info:', debugInfo);
```

## 本番環境への移行

1. 本番用のRevenueCatプロジェクトを作成
2. 本番用のAPIキーを取得
3. 環境変数を本番用に更新
4. App Store/Google Playでアプリを公開

## 参考リンク

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [RevenueCat React Native SDK](https://docs.revenuecat.com/docs/reactnative)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [Google Play Console Guide](https://support.google.com/googleplay/android-developer/)