/**
 * パフォーマンス監視システムのテスト
 * パフォーマンス監視機能の動作確認
 */

import PerformanceMonitoringService from '../services/performanceMonitoringService';
import PerformanceMonitoringInitializer from '../services/performanceMonitoringInitializer';

// AsyncStorageのモック
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// React Nativeのモック
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

describe('PerformanceMonitoringService', () => {
  let performanceService: PerformanceMonitoringService;

  beforeEach(() => {
    performanceService = PerformanceMonitoringService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    performanceService.stopMonitoring();
  });

  describe('初期化', () => {
    test('サービスが正常に初期化される', async () => {
      await expect(performanceService.initialize()).resolves.not.toThrow();
    });

    test('シングルトンパターンが正しく動作する', () => {
      const instance1 = PerformanceMonitoringService.getInstance();
      const instance2 = PerformanceMonitoringService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('レスポンス時間の記録', () => {
    beforeEach(async () => {
      await performanceService.initialize();
    });

    test('画面遷移時間が正常に記録される', async () => {
      await expect(
        performanceService.recordResponseTime('screenTransition', 800, { screenName: 'Home' })
      ).resolves.not.toThrow();
    });

    test('API呼び出し時間が正常に記録される', async () => {
      await expect(
        performanceService.recordResponseTime('apiCall', 1500, { endpoint: '/api/users' })
      ).resolves.not.toThrow();
    });

    test('データベースクエリ時間が正常に記録される', async () => {
      await expect(
        performanceService.recordResponseTime('databaseQuery', 500, { queryType: 'SELECT' })
      ).resolves.not.toThrow();
    });

    test('レンダリング時間が正常に記録される', async () => {
      await expect(
        performanceService.recordResponseTime('renderTime', 200, { componentName: 'UserList' })
      ).resolves.not.toThrow();
    });

    test('閾値を超えた場合にアラートが生成される', async () => {
      // 閾値（1000ms）を超える画面遷移時間を記録
      await performanceService.recordResponseTime('screenTransition', 1500);
      
      const stats = await performanceService.getPerformanceStatistics();
      expect(stats.recentAlerts.length).toBeGreaterThan(0);
      
      const alert = stats.recentAlerts[stats.recentAlerts.length - 1];
      expect(alert.type).toBe('response_time');
      expect(alert.severity).toBe('high');
    });
  });

  describe('システムメトリクスの記録', () => {
    beforeEach(async () => {
      await performanceService.initialize();
    });

    test('システムメトリクスが正常に記録される', async () => {
      await expect(
        performanceService.recordSystemMetrics(100, 50, 80, 'wifi')
      ).resolves.not.toThrow();
    });

    test('メモリ使用量の閾値超過でアラートが生成される', async () => {
      // 閾値（150MB）を超えるメモリ使用量を記録
      await performanceService.recordSystemMetrics(200, 50, 80, 'wifi');
      
      const stats = await performanceService.getPerformanceStatistics();
      const memoryAlerts = stats.recentAlerts.filter(alert => alert.type === 'memory');
      expect(memoryAlerts.length).toBeGreaterThan(0);
    });

    test('CPU使用率の閾値超過でアラートが生成される', async () => {
      // 閾値（80%）を超えるCPU使用率を記録
      await performanceService.recordSystemMetrics(100, 90, 80, 'wifi');
      
      const stats = await performanceService.getPerformanceStatistics();
      const cpuAlerts = stats.recentAlerts.filter(alert => alert.type === 'cpu');
      expect(cpuAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('ネットワークメトリクスの記録', () => {
    beforeEach(async () => {
      await performanceService.initialize();
    });

    test('ネットワークリクエストが正常に記録される', async () => {
      const requestId = 'test-request-1';
      
      performanceService.recordNetworkRequestStart(requestId, 'https://api.example.com/users');
      
      await expect(
        performanceService.recordNetworkRequestEnd(requestId, true, 1024, 200)
      ).resolves.not.toThrow();
    });

    test('遅いネットワークリクエストでアラートが生成される', async () => {
      const requestId = 'slow-request';
      
      performanceService.recordNetworkRequestStart(requestId, 'https://api.example.com/slow');
      
      // 1秒待機してから完了を記録（閾値1000msを超える）
      await new Promise(resolve => setTimeout(resolve, 1100));
      await performanceService.recordNetworkRequestEnd(requestId, true, 1024, 200);
      
      const stats = await performanceService.getPerformanceStatistics();
      const networkAlerts = stats.recentAlerts.filter(alert => alert.type === 'network');
      expect(networkAlerts.length).toBeGreaterThan(0);
    });

    test('失敗したネットワークリクエストが正常に記録される', async () => {
      const requestId = 'failed-request';
      
      performanceService.recordNetworkRequestStart(requestId, 'https://api.example.com/error');
      
      await expect(
        performanceService.recordNetworkRequestEnd(requestId, false, 0, 500)
      ).resolves.not.toThrow();
    });
  });

  describe('ユーザー体験メトリクスの記録', () => {
    beforeEach(async () => {
      await performanceService.initialize();
    });

    test('ユーザー体験メトリクスが正常に記録される', async () => {
      await expect(
        performanceService.recordUserExperienceMetrics(2000, 3000, 5, 0, 0)
      ).resolves.not.toThrow();
    });

    test('アプリ起動時間の閾値超過でアラートが生成される', async () => {
      // 閾値（3000ms）を超えるアプリ起動時間を記録
      await performanceService.recordUserExperienceMetrics(4000);
      
      const stats = await performanceService.getPerformanceStatistics();
      const uxAlerts = stats.recentAlerts.filter(alert => alert.type === 'user_experience');
      expect(uxAlerts.length).toBeGreaterThan(0);
    });

    test('インタラクティブ時間の閾値超過でアラートが生成される', async () => {
      // 閾値（5000ms）を超えるインタラクティブ時間を記録
      await performanceService.recordUserExperienceMetrics(2000, 6000);
      
      const stats = await performanceService.getPerformanceStatistics();
      const uxAlerts = stats.recentAlerts.filter(alert => alert.type === 'user_experience');
      expect(uxAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('パフォーマンス統計', () => {
    beforeEach(async () => {
      await performanceService.initialize();
    });

    test('パフォーマンス統計が正常に取得される', async () => {
      // テストデータの記録
      await performanceService.recordResponseTime('screenTransition', 800);
      await performanceService.recordSystemMetrics(100, 50);
      await performanceService.recordUserExperienceMetrics(2000, 3000);
      
      const stats = await performanceService.getPerformanceStatistics();
      
      expect(stats).toHaveProperty('totalMetrics');
      expect(stats).toHaveProperty('averageResponseTimes');
      expect(stats).toHaveProperty('systemMetricsAverage');
      expect(stats).toHaveProperty('networkStatistics');
      expect(stats).toHaveProperty('userExperienceStatistics');
      expect(stats).toHaveProperty('recentAlerts');
      
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });

    test('平均レスポンス時間が正しく計算される', async () => {
      // 複数のレスポンス時間を記録
      await performanceService.recordResponseTime('screenTransition', 800);
      await performanceService.recordResponseTime('screenTransition', 1200);
      
      const stats = await performanceService.getPerformanceStatistics();
      
      expect(stats.averageResponseTimes.screenTransition).toBe(1000);
    });
  });

  describe('閾値の更新', () => {
    beforeEach(async () => {
      await performanceService.initialize();
    });

    test('パフォーマンス閾値が正常に更新される', () => {
      const newThresholds = {
        responseTime: {
          screenTransition: 500,
          apiCall: 2000,
          databaseQuery: 1000,
          renderTime: 300,
        },
      };

      expect(() => {
        performanceService.updateThresholds(newThresholds);
      }).not.toThrow();
    });

    test('更新された閾値でアラートが正しく生成される', async () => {
      // 閾値を500msに更新
      performanceService.updateThresholds({
        responseTime: {
          screenTransition: 500,
          apiCall: 3000,
          databaseQuery: 2000,
          renderTime: 500,
        },
      });

      // 新しい閾値（500ms）を超える時間を記録
      await performanceService.recordResponseTime('screenTransition', 600);
      
      const stats = await performanceService.getPerformanceStatistics();
      const alerts = stats.recentAlerts.filter(alert => alert.type === 'response_time');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });
});

describe('PerformanceMonitoringInitializer', () => {
  let initializer: PerformanceMonitoringInitializer;

  beforeEach(() => {
    initializer = PerformanceMonitoringInitializer.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    initializer.stopMonitoring();
  });

  describe('初期化', () => {
    test('初期化サービスが正常に動作する', async () => {
      await expect(initializer.initialize()).resolves.not.toThrow();
    });

    test('シングルトンパターンが正しく動作する', () => {
      const instance1 = PerformanceMonitoringInitializer.getInstance();
      const instance2 = PerformanceMonitoringInitializer.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('測定機能', () => {
    beforeEach(async () => {
      await initializer.initialize();
    });

    test('アプリ起動時間が正常に記録される', async () => {
      const startTime = Date.now() - 2000; // 2秒前
      await expect(initializer.recordAppStartTime(startTime)).resolves.not.toThrow();
    });

    test('画面遷移時間の測定が正常に動作する', async () => {
      const endTransition = initializer.startScreenTransition('TestScreen');
      
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await expect(endTransition()).resolves.not.toThrow();
    });

    test('APIコール時間の測定が正常に動作する', async () => {
      const endAPICall = initializer.startAPICall('/api/test', 'GET');
      
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await expect(endAPICall(true, 200, 1024)).resolves.not.toThrow();
    });

    test('データベースクエリ時間の測定が正常に動作する', async () => {
      const endQuery = initializer.startDatabaseQuery('SELECT');
      
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await expect(endQuery(true, 10)).resolves.not.toThrow();
    });

    test('レンダリング時間の測定が正常に動作する', async () => {
      const endRender = initializer.startRenderMeasurement('TestComponent');
      
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await expect(endRender()).resolves.not.toThrow();
    });
  });

  describe('システムメトリクス', () => {
    beforeEach(async () => {
      await initializer.initialize();
    });

    test('現在のシステムメトリクスが正常に記録される', async () => {
      await expect(initializer.recordCurrentSystemMetrics()).resolves.not.toThrow();
    });
  });

  describe('パフォーマンスレポート', () => {
    beforeEach(async () => {
      await initializer.initialize();
    });

    test('パフォーマンスレポートが正常に取得される', async () => {
      const report = await initializer.getPerformanceReport();
      
      expect(report).toHaveProperty('totalMetrics');
      expect(report).toHaveProperty('averageResponseTimes');
      expect(report).toHaveProperty('systemMetricsAverage');
      expect(report).toHaveProperty('networkStatistics');
      expect(report).toHaveProperty('userExperienceStatistics');
      expect(report).toHaveProperty('recentAlerts');
    });
  });

  describe('設定管理', () => {
    test('監視設定が正常に更新される', () => {
      const newConfig = {
        enabled: false,
        monitoringInterval: 60,
        alertThresholds: {
          responseTime: {
            screenTransition: 800,
            apiCall: 2500,
            databaseQuery: 1500,
            renderTime: 400,
          },
        },
      };

      expect(() => {
        initializer.updateConfig(newConfig);
      }).not.toThrow();
    });
  });
});

describe('統合テスト', () => {
  let performanceService: PerformanceMonitoringService;
  let initializer: PerformanceMonitoringInitializer;

  beforeEach(async () => {
    performanceService = PerformanceMonitoringService.getInstance();
    initializer = PerformanceMonitoringInitializer.getInstance();
    
    await performanceService.initialize();
    await initializer.initialize();
  });

  afterEach(() => {
    performanceService.stopMonitoring();
    initializer.stopMonitoring();
  });

  test('完全なパフォーマンス監視フローが正常に動作する', async () => {
    // 1. アプリ起動時間の記録
    await initializer.recordAppStartTime(Date.now() - 2500);

    // 2. 画面遷移の測定
    const endTransition = initializer.startScreenTransition('HomeScreen');
    await new Promise(resolve => setTimeout(resolve, 100));
    await endTransition();

    // 3. APIコールの測定
    const endAPICall = initializer.startAPICall('/api/users', 'GET');
    await new Promise(resolve => setTimeout(resolve, 200));
    await endAPICall(true, 200, 2048);

    // 4. システムメトリクスの記録
    await initializer.recordCurrentSystemMetrics();

    // 5. パフォーマンス統計の確認
    const report = await initializer.getPerformanceReport();
    
    expect(report.totalMetrics).toBeGreaterThan(0);
    expect(Object.keys(report.averageResponseTimes).length).toBeGreaterThan(0);
  });

  test('アラート生成とレポートの統合動作', async () => {
    // 閾値を超えるメトリクスを記録してアラートを生成
    await performanceService.recordResponseTime('screenTransition', 1500); // 閾値超過
    await performanceService.recordSystemMetrics(200, 90); // 両方とも閾値超過

    const report = await initializer.getPerformanceReport();
    
    expect(report.recentAlerts.length).toBeGreaterThan(0);
    
    const responseTimeAlerts = report.recentAlerts.filter(alert => alert.type === 'response_time');
    const memoryAlerts = report.recentAlerts.filter(alert => alert.type === 'memory');
    const cpuAlerts = report.recentAlerts.filter(alert => alert.type === 'cpu');
    
    expect(responseTimeAlerts.length).toBeGreaterThan(0);
    expect(memoryAlerts.length).toBeGreaterThan(0);
    expect(cpuAlerts.length).toBeGreaterThan(0);
  });
});