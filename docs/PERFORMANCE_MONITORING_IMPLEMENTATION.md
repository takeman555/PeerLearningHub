# パフォーマンス監視システム実装ガイド

## 概要

PeerLearningHub のパフォーマンス監視システムは、アプリケーションのレスポンス時間、メモリ・CPU使用率、ネットワーク通信、ユーザー体験指標を包括的に監視するシステムです。

## 実装されたコンポーネント

### 1. コアサービス

#### PerformanceMonitoringService
- **場所**: `services/performanceMonitoringService.ts`
- **機能**: パフォーマンスメトリクスの収集、保存、分析
- **主要メソッド**:
  - `initialize()`: 監視システムの初期化
  - `recordResponseTime()`: レスポンス時間の記録
  - `recordSystemMetrics()`: システムメトリクスの記録
  - `recordNetworkRequestStart/End()`: ネットワーク通信の監視
  - `recordUserExperienceMetrics()`: ユーザー体験指標の記録
  - `getPerformanceStatistics()`: 統計データの取得

#### PerformanceMonitoringInitializer
- **場所**: `services/performanceMonitoringInitializer.ts`
- **機能**: 監視システムの初期化と高レベルAPI提供
- **主要メソッド**:
  - `initialize()`: システム全体の初期化
  - `startScreenTransition()`: 画面遷移時間の測定開始
  - `startAPICall()`: API呼び出し時間の測定開始
  - `startDatabaseQuery()`: データベースクエリ時間の測定開始
  - `recordAppStartTime()`: アプリ起動時間の記録

### 2. React統合

#### usePerformanceMonitoring Hook
- **場所**: `hooks/usePerformanceMonitoring.ts`
- **機能**: Reactコンポーネントでの簡単なパフォーマンス測定
- **提供フック**:
  - `usePerformanceMonitoring`: 基本的なパフォーマンス測定
  - `useScreenTransitionPerformance`: 画面遷移専用
  - `useAPIPerformance`: API呼び出し専用
  - `useDatabasePerformance`: データベースクエリ専用
  - `useRenderPerformance`: レンダリング時間専用
  - `useInteractionPerformance`: ユーザーインタラクション専用

#### PerformanceMonitoringDashboard
- **場所**: `components/PerformanceMonitoringDashboard.tsx`
- **機能**: パフォーマンスメトリクスの可視化
- **表示内容**:
  - レスポンス時間統計
  - システムメトリクス（メモリ・CPU使用率）
  - ネットワーク統計
  - ユーザー体験指標
  - 最近のアラート

### 3. 設定とセットアップ

#### 設定ファイル
- **場所**: `config/performanceMonitoring.json`
- **内容**: 監視の有効/無効、閾値設定、監視間隔など

#### セットアップスクリプト
- **場所**: `scripts/setupPerformanceMonitoring.js`
- **機能**: 初期設定ファイルの作成と検証

#### 検証スクリプト
- **場所**: `scripts/validatePerformanceMonitoring.js`
- **機能**: システム全体の動作検証

## 使用方法

### 1. 初期設定

```bash
# パフォーマンス監視システムのセットアップ
cd PeerLearningHub
node scripts/setupPerformanceMonitoring.js

# システムの検証
node scripts/validatePerformanceMonitoring.js
```

### 2. アプリケーション初期化

```typescript
// App.tsx または _layout.tsx
import PerformanceMonitoringInitializer from './services/performanceMonitoringInitializer';

export default function App() {
  useEffect(() => {
    const initializePerformanceMonitoring = async () => {
      try {
        const performanceInitializer = PerformanceMonitoringInitializer.getInstance();
        await performanceInitializer.initialize();
        
        // アプリ起動時間の記録
        await performanceInitializer.recordAppStartTime(Date.now());
        
        console.log('Performance monitoring initialized');
      } catch (error) {
        console.error('Failed to initialize performance monitoring:', error);
      }
    };

    initializePerformanceMonitoring();
  }, []);

  return (
    // アプリのコンテンツ
  );
}
```

### 3. 画面遷移の監視

```typescript
// 画面コンポーネント
import { useScreenTransitionPerformance } from '../hooks/usePerformanceMonitoring';

const HomeScreen = () => {
  const { startTransition, endTransition } = useScreenTransitionPerformance('HomeScreen');

  const navigateToProfile = () => {
    startTransition();
    
    // ナビゲーション処理
    navigation.navigate('Profile');
    
    // 遷移完了後
    setTimeout(endTransition, 100);
  };

  return (
    <View>
      <TouchableOpacity onPress={navigateToProfile}>
        <Text>プロフィールへ</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 4. API呼び出しの監視

```typescript
// APIサービス
import { useAPIPerformance } from '../hooks/usePerformanceMonitoring';

const UserService = () => {
  const { measureAPICall } = useAPIPerformance();

  const fetchUsers = async () => {
    return await measureAPICall('/api/users', 'GET', async () => {
      const response = await fetch('/api/users');
      return response.json();
    });
  };

  const createUser = async (userData: any) => {
    return await measureAPICall('/api/users', 'POST', async () => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.json();
    });
  };

  return { fetchUsers, createUser };
};
```

### 5. データベースクエリの監視

```typescript
// データベースサービス
import { useDatabasePerformance } from '../hooks/usePerformanceMonitoring';
import { supabase } from '../config/supabase';

const DatabaseService = () => {
  const { measureDatabaseQuery } = useDatabasePerformance();

  const getUsers = async () => {
    return await measureDatabaseQuery('SELECT_USERS', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      return data;
    });
  };

  const insertUser = async (user: any) => {
    return await measureDatabaseQuery('INSERT_USER', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .insert([user]);
      
      if (error) throw error;
      return data;
    });
  };

  return { getUsers, insertUser };
};
```

### 6. レンダリングパフォーマンスの監視

```typescript
// 重いコンポーネント
import { useRenderPerformance } from '../hooks/usePerformanceMonitoring';

const HeavyComponent = ({ data }: { data: any[] }) => {
  const { renderCount } = useRenderPerformance('HeavyComponent');

  // 重い計算処理
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true,
      timestamp: Date.now()
    }));
  }, [data]);

  return (
    <View>
      <Text>Render Count: {renderCount}</Text>
      {processedData.map(item => (
        <View key={item.id}>
          <Text>{item.name}</Text>
        </View>
      ))}
    </View>
  );
};
```

### 7. ユーザーインタラクションの監視

```typescript
// インタラクティブコンポーネント
import { useInteractionPerformance } from '../hooks/usePerformanceMonitoring';

const InteractiveButton = () => {
  const { measureInteraction } = useInteractionPerformance();

  const handleComplexAction = async () => {
    await measureInteraction('complex_button_action', async () => {
      // 複雑な処理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // データの更新
      await updateSomeData();
      
      // UI の更新
      setLoading(false);
    });
  };

  return (
    <TouchableOpacity onPress={handleComplexAction}>
      <Text>複雑なアクション</Text>
    </TouchableOpacity>
  );
};
```

### 8. パフォーマンスダッシュボードの表示

```typescript
// 管理画面
import PerformanceMonitoringDashboard from '../components/PerformanceMonitoringDashboard';

const AdminScreen = () => {
  return (
    <ScrollView>
      <Text style={styles.title}>管理画面</Text>
      
      {/* パフォーマンス監視ダッシュボード */}
      <PerformanceMonitoringDashboard />
      
      {/* その他の管理機能 */}
    </ScrollView>
  );
};
```

## 設定のカスタマイズ

### 環境変数での設定

```bash
# .env ファイル
EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_MONITORING_INTERVAL=30000
PERFORMANCE_THRESHOLD_SCREEN_TRANSITION=1000
PERFORMANCE_THRESHOLD_API_CALL=3000
PERFORMANCE_THRESHOLD_MEMORY_USAGE=150
PERFORMANCE_THRESHOLD_CPU_USAGE=80
```

### プログラムでの設定変更

```typescript
import PerformanceMonitoringInitializer from './services/performanceMonitoringInitializer';

const performanceInitializer = PerformanceMonitoringInitializer.getInstance();

// 閾値の更新
performanceInitializer.updateConfig({
  alertThresholds: {
    responseTime: {
      screenTransition: 800,  // より厳しい閾値
      apiCall: 2000,
      databaseQuery: 1000,
      renderTime: 300,
    },
    systemMetrics: {
      memoryUsage: 100,  // より厳しいメモリ制限
      cpuUsage: 70,
    },
  },
});
```

## 監視項目と閾値

### デフォルト閾値

| 項目 | デフォルト閾値 | 説明 |
|------|----------------|------|
| 画面遷移時間 | 1000ms | 画面間の遷移時間 |
| API呼び出し時間 | 3000ms | APIレスポンス時間 |
| データベースクエリ時間 | 2000ms | DB操作の実行時間 |
| レンダリング時間 | 500ms | コンポーネントのレンダリング時間 |
| メモリ使用量 | 150MB | アプリのメモリ使用量 |
| CPU使用率 | 80% | CPU使用率 |
| ネットワークレイテンシ | 1000ms | ネットワーク通信の遅延 |
| ネットワークエラー率 | 5% | 失敗したリクエストの割合 |
| アプリ起動時間 | 3000ms | アプリの起動完了時間 |
| インタラクティブ時間 | 5000ms | ユーザー操作可能になるまでの時間 |

### アラートレベル

- **Low**: 軽微なパフォーマンス低下
- **Medium**: 注意が必要なパフォーマンス問題
- **High**: 重要なパフォーマンス問題
- **Critical**: 緊急対応が必要な問題

## トラブルシューティング

### よくある問題

1. **監視が動作しない**
   - `initialize()` が呼ばれているか確認
   - 設定ファイルが正しく作成されているか確認
   - 本番環境で監視が有効になっているか確認

2. **メトリクスが記録されない**
   - AsyncStorage の権限を確認
   - エラーログを確認
   - 閾値設定が適切か確認

3. **パフォーマンスへの影響**
   - 監視間隔を調整（デフォルト: 30秒）
   - 不要な監視項目を無効化
   - メトリクス保持数を調整

### デバッグ方法

```typescript
// デバッグモードの有効化
const performanceInitializer = PerformanceMonitoringInitializer.getInstance();

// 現在の統計を確認
const stats = await performanceInitializer.getPerformanceReport();
console.log('Performance Stats:', stats);

// 手動でシステムメトリクスを記録
await performanceInitializer.recordCurrentSystemMetrics();
```

## 本番環境での考慮事項

1. **プライバシー**: ユーザーデータを含まないメトリクスのみ収集
2. **パフォーマンス**: 監視自体がアプリのパフォーマンスに影響しないよう最適化
3. **ストレージ**: ローカルストレージの使用量を制限
4. **ネットワーク**: リモート送信時のデータ量を最小化
5. **バッテリー**: バックグラウンド処理を最小限に抑制

## 今後の拡張予定

1. **リモート監視**: クラウドサービスへのメトリクス送信
2. **リアルタイム監視**: WebSocketを使用したリアルタイム監視
3. **機械学習**: 異常検知とパフォーマンス予測
4. **A/Bテスト**: パフォーマンス改善の効果測定
5. **詳細分析**: より詳細なユーザー行動分析

## 関連ドキュメント

- [エラー監視システム](./ERROR_MONITORING_SYSTEM.md)
- [本番環境設定](./PRODUCTION_READINESS_CHECKLIST.md)
- [パフォーマンス最適化ガイド](./PERFORMANCE_OPTIMIZATION.md)

---

このパフォーマンス監視システムにより、PeerLearningHub のユーザー体験を継続的に改善し、高品質なアプリケーションを提供できます。