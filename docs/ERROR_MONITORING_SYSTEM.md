# エラー監視システム

## 概要

PeerLearningHubのエラー監視システムは、アプリケーションで発生するエラーやクラッシュを自動的に検知、収集、分析し、適切なアラートを送信するシステムです。

## 構成要素

### 1. ErrorMonitoringService
- アプリケーションエラーの自動検知と収集
- エラーレベル別の分類と管理
- エラー統計の提供

### 2. CrashReportingService
- アプリケーションクラッシュの詳細情報収集
- ユーザーアクションの追跡
- デバイス情報とアプリ状態の記録

### 3. AlertManagerService
- エラー発生時の自動アラート
- カスタマイズ可能なアラートルール
- 複数の通知チャネル対応

## 使用方法

### 初期化

```typescript
import ErrorMonitoringInitializer from './services/errorMonitoringInitializer';

// アプリケーション起動時
await ErrorMonitoringInitializer.initialize();
```

### エラーの報告

```typescript
import ErrorMonitoringService from './services/errorMonitoringService';

const errorMonitoring = ErrorMonitoringService.getInstance();

// 一般的なエラー
await errorMonitoring.reportError('Something went wrong', 'runtime', 'medium');

// ネットワークエラー
await errorMonitoring.reportNetworkError('https://api.example.com', 500, error);

// 認証エラー
await errorMonitoring.reportAuthError(error, 'login');
```

### クラッシュレポート

```typescript
import CrashReportingService from './services/crashReportingService';

const crashReporting = CrashReportingService.getInstance();

// ユーザーアクションの記録
crashReporting.recordUserAction('button_click', 'home', { buttonId: 'submit' });

// 画面遷移の記録
crashReporting.recordScreenNavigation('profile', 'push');
```

### アラート設定

```typescript
import AlertManagerService from './services/alertManagerService';

const alertManager = AlertManagerService.getInstance();

// カスタムアラートルールの追加
await alertManager.addAlertRule({
  name: 'High Error Rate',
  enabled: true,
  conditions: [
    {
      type: 'error_rate',
      operator: 'greater_than',
      value: 10,
      timeWindow: 10
    }
  ],
  actions: [
    {
      type: 'user_notification',
      config: {
        title: 'High Error Rate',
        message: 'Error rate is above threshold'
      }
    }
  ],
  cooldownPeriod: 15
});
```

## 設定

設定ファイル: `config/errorMonitoring.json`

```json
{
  "errorMonitoring": {
    "enabled": true,
    "severityThreshold": "medium",
    "notificationChannels": ["console", "storage"],
    "maxReportsPerSession": 50,
    "retryAttempts": 3
  },
  "crashReporting": {
    "enabled": true,
    "maxUserActions": 20,
    "collectDeviceInfo": true,
    "autoSubmit": true
  },
  "alertManager": {
    "enabled": true,
    "defaultRulesEnabled": true,
    "maxNotifications": 100,
    "cooldownPeriod": 5
  }
}
```

## テスト

```bash
# セットアップスクリプトの実行
node scripts/setupErrorMonitoring.js

# テストの実行
npm run test:error-monitoring
```

## トラブルシューティング

### よくある問題

1. **エラーが記録されない**
   - 初期化が完了しているか確認
   - 設定でエラー監視が有効になっているか確認

2. **アラートが送信されない**
   - アラートルールが有効になっているか確認
   - クールダウン期間中でないか確認

3. **パフォーマンスの問題**
   - maxReportsPerSessionの値を調整
   - 不要なエラーレポートをフィルタリング

### ログの確認

エラー監視システムのログは以下の場所で確認できます：
- コンソールログ
- AsyncStorage（キー: 'error_reports', 'crash_reports', 'alert_notifications'）

## 今後の拡張

- リモートエラー追跡サービスとの連携（Sentry、Bugsnag等）
- より詳細なデバイス情報の収集
- エラーの自動分類とパターン分析
- ダッシュボードUIの実装
