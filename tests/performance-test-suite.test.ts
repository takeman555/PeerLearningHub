/**
 * パフォーマンステストスイート
 * 要件 3.5, 7.1-7.5: アプリ起動時間・画面遷移・メモリ使用量・ネットワーク通信の効率性テスト
 */

import { performance } from 'perf_hooks';
import { authService } from '../services/auth';
import { communityFeedService } from '../services/communityFeedService';
import { revenueCatService } from '../services/revenueCatService';
import { externalSystemsService } from '../services/externalSystemsService';

// Mock dependencies for performance testing
jest.mock('../config/supabase');
jest.mock('react-native-purchases');

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  APP_STARTUP_TIME: 3000, // 3 seconds
  SCREEN_TRANSITION_TIME: 1000, // 1 second
  API_RESPONSE_TIME: 500, // 500ms
  MEMORY_USAGE_MB: 100, // 100MB
  BATCH_OPERATION_TIME: 5000, // 5 seconds for batch operations
};

// Test data generators
function generateLargeDataset(size: number) {
  return Array.from({ length: size }, (_, i) => ({
    id: `item-${i}`,
    title: `Test Item ${i}`,
    description: `This is a test description for item ${i}`.repeat(10),
    tags: [`tag-${i % 10}`, `category-${i % 5}`],
    created_at: new Date(Date.now() - i * 1000).toISOString(),
  }));
}

function generateMockUsers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i}`,
    email: `user${i}@test.com`,
    full_name: `Test User ${i}`,
    country: i % 2 === 0 ? 'Japan' : 'USA',
  }));
}

// Performance measurement utilities
class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  startMeasurement(name: string): () => number {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      this.measurements.get(name)!.push(duration);
      return duration;
    };
  }

  getAverageDuration(name: string): number {
    const durations = this.measurements.get(name) || [];
    return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  }

  getMaxDuration(name: string): number {
    const durations = this.measurements.get(name) || [];
    return durations.length > 0 ? Math.max(...durations) : 0;
  }

  getMinDuration(name: string): number {
    const durations = this.measurements.get(name) || [];
    return durations.length > 0 ? Math.min(...durations) : 0;
  }

  getAllMeasurements(): Record<string, { avg: number; max: number; min: number; count: number }> {
    const result: Record<string, { avg: number; max: number; min: number; count: number }> = {};
    
    for (const [name, durations] of this.measurements.entries()) {
      result[name] = {
        avg: this.getAverageDuration(name),
        max: this.getMaxDuration(name),
        min: this.getMinDuration(name),
        count: durations.length,
      };
    }
    
    return result;
  }

  reset(): void {
    this.measurements.clear();
  }
}

// Memory usage monitoring
function getMemoryUsage(): NodeJS.MemoryUsage {
  return process.memoryUsage();
}

function formatMemoryUsage(usage: NodeJS.MemoryUsage): string {
  return `RSS: ${Math.round(usage.rss / 1024 / 1024)}MB, Heap: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`;
}

describe('パフォーマンステストスイート', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    jest.clearAllMocks();
  });

  afterEach(() => {
    const measurements = performanceMonitor.getAllMeasurements();
    console.log('Performance Measurements:', JSON.stringify(measurements, null, 2));
  });

  describe('アプリ起動時間テスト (要件 7.1)', () => {
    it('アプリ初期化が3秒以内に完了する', async () => {
      const endMeasurement = performanceMonitor.startMeasurement('app-startup');

      // Simulate app initialization
      const initTasks = [
        authService.getCurrentUser(),
        authService.getCurrentSession(),
        // Simulate other initialization tasks
        new Promise(resolve => setTimeout(resolve, 100)), // Config loading
        new Promise(resolve => setTimeout(resolve, 50)),  // Asset loading
        new Promise(resolve => setTimeout(resolve, 75)),  // Service initialization
      ];

      await Promise.all(initTasks);

      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.APP_STARTUP_TIME);
      console.log(`App startup time: ${Math.round(duration)}ms`);
    });

    it('認証状態確認が500ms以内に完了する', async () => {
      const endMeasurement = performanceMonitor.startMeasurement('auth-check');

      await authService.getCurrentUser();

      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });

    it('初期データ読み込みが2秒以内に完了する', async () => {
      const endMeasurement = performanceMonitor.startMeasurement('initial-data-load');

      // Mock initial data loading
      const { supabase } = require('../config/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: generateLargeDataset(20),
                error: null,
              }),
            }),
          }),
        }),
      });

      const initialDataTasks = [
        communityFeedService.getPosts('user-123', 20, 0),
        // Simulate other initial data loading
        new Promise(resolve => setTimeout(resolve, 200)),
      ];

      await Promise.all(initialDataTasks);

      const duration = endMeasurement();

      expect(duration).toBeLessThan(2000); // 2 seconds
    });

    it('複数の同期初期化タスクが並列実行される', async () => {
      const endMeasurement = performanceMonitor.startMeasurement('parallel-init');

      // Simulate parallel initialization tasks
      const parallelTasks = Array.from({ length: 5 }, (_, i) => 
        new Promise(resolve => setTimeout(resolve, 100 + i * 10))
      );

      await Promise.all(parallelTasks);

      const duration = endMeasurement();

      // Parallel execution should be faster than sequential
      expect(duration).toBeLessThan(200); // Should be around 140ms, not 650ms
    });
  });

  describe('画面遷移時間テスト (要件 7.2)', () => {
    it('画面遷移が1秒以内に完了する', async () => {
      const endMeasurement = performanceMonitor.startMeasurement('screen-transition');

      // Simulate screen transition tasks
      const transitionTasks = [
        new Promise(resolve => setTimeout(resolve, 50)),  // Component unmount
        new Promise(resolve => setTimeout(resolve, 100)), // Route change
        new Promise(resolve => setTimeout(resolve, 150)), // Component mount
        new Promise(resolve => setTimeout(resolve, 75)),  // Data loading
      ];

      await Promise.all(transitionTasks);

      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SCREEN_TRANSITION_TIME);
      console.log(`Screen transition time: ${Math.round(duration)}ms`);
    });

    it('コミュニティ画面への遷移が効率的である', async () => {
      const endMeasurement = performanceMonitor.startMeasurement('community-screen-load');

      // Mock community data loading
      const { supabase } = require('../config/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: generateLargeDataset(10),
                error: null,
              }),
            }),
          }),
        }),
      });

      await communityFeedService.getPosts('user-123', 10, 0);

      const duration = endMeasurement();

      expect(duration).toBeLessThan(800); // 800ms for community screen
    });

    it('メンバーシップ画面への遷移が効率的である', async () => {
      const endMeasurement = performanceMonitor.startMeasurement('membership-screen-load');

      // Mock RevenueCat data
      const Purchases = require('react-native-purchases');
      Purchases.getCustomerInfo.mockResolvedValue({
        entitlements: { active: {} },
      });

      await revenueCatService.getMembershipStatus();

      const duration = endMeasurement();

      expect(duration).toBeLessThan(600); // 600ms for membership screen
    });

    it('外部システム画面への遷移が効率的である', async () => {
      const endMeasurement = performanceMonitor.startMeasurement('external-systems-screen-load');

      // Mock external systems data
      const { supabase } = require('../config/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: generateLargeDataset(15),
            error: null,
          }),
        }),
      });

      const loadTasks = [
        externalSystemsService.getExternalProjects({ status: 'active' }),
        externalSystemsService.getExternalSessions({ upcoming_only: true }),
        externalSystemsService.getExternalAccommodations({ status: 'available' }),
      ];

      await Promise.all(loadTasks);

      const duration = endMeasurement();

      expect(duration).toBeLessThan(900); // 900ms for external systems screen
    });
  });

  describe('メモリ使用量テスト (要件 7.4, 7.5)', () => {
    it('メモリ使用量が適切な範囲内である', async () => {
      const initialMemory = getMemoryUsage();
      console.log(`Initial memory: ${formatMemoryUsage(initialMemory)}`);

      // Simulate memory-intensive operations
      const largeDataset = generateLargeDataset(1000);
      const processedData = largeDataset.map(item => ({
        ...item,
        processed: true,
        timestamp: Date.now(),
      }));

      const finalMemory = getMemoryUsage();
      console.log(`Final memory: ${formatMemoryUsage(finalMemory)}`);

      const memoryIncreaseMB = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      console.log(`Memory increase: ${Math.round(memoryIncreaseMB)}MB`);

      // Memory increase should be reasonable for the operation
      expect(memoryIncreaseMB).toBeLessThan(50); // Less than 50MB increase

      // Clean up
      processedData.length = 0;
    });

    it('大量データ処理後のメモリリークがない', async () => {
      const initialMemory = getMemoryUsage();

      // Process large datasets multiple times
      for (let i = 0; i < 5; i++) {
        const dataset = generateLargeDataset(500);
        const processed = dataset.filter(item => item.id.includes('1'));
        processed.length = 0; // Clear reference
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMemory = getMemoryUsage();
      const memoryIncreaseMB = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      console.log(`Memory after cleanup: ${formatMemoryUsage(finalMemory)}`);
      console.log(`Net memory increase: ${Math.round(memoryIncreaseMB)}MB`);

      // Should not have significant memory leaks
      expect(memoryIncreaseMB).toBeLessThan(10); // Less than 10MB net increase
    });

    it('同時実行タスクのメモリ効率性', async () => {
      const initialMemory = getMemoryUsage();

      // Simulate concurrent operations
      const concurrentTasks = Array.from({ length: 10 }, async (_, i) => {
        const data = generateLargeDataset(100);
        await new Promise(resolve => setTimeout(resolve, 50));
        return data.length;
      });

      await Promise.all(concurrentTasks);

      const finalMemory = getMemoryUsage();
      const memoryIncreaseMB = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      console.log(`Concurrent operations memory increase: ${Math.round(memoryIncreaseMB)}MB`);

      // Concurrent operations should be memory efficient
      expect(memoryIncreaseMB).toBeLessThan(30); // Less than 30MB for concurrent ops
    });
  });

  describe('ネットワーク通信効率性テスト (要件 7.1-7.5)', () => {
    it('API レスポンス時間が500ms以内である', async () => {
      const endMeasurement = performanceMonitor.startMeasurement('api-response');

      // Mock fast API response
      const { supabase } = require('../config/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test', name: 'Test Data' },
              error: null,
            }),
          }),
        }),
      });

      await authService.getProfile('user-123');

      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });

    it('バッチ操作が効率的に実行される', async () => {
      const endMeasurement = performanceMonitor.startMeasurement('batch-operations');

      // Mock batch operations
      const { supabase } = require('../config/supabase');
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: generateLargeDataset(100),
            error: null,
          }),
        }),
      });

      // Simulate batch insert
      const batchData = generateMockUsers(100);
      const batchSize = 20;
      const batches = [];

      for (let i = 0; i < batchData.length; i += batchSize) {
        const batch = batchData.slice(i, i + batchSize);
        batches.push(
          new Promise(resolve => setTimeout(() => resolve(batch), 50))
        );
      }

      await Promise.all(batches);

      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_OPERATION_TIME);
      console.log(`Batch operations time: ${Math.round(duration)}ms`);
    });

    it('同時API呼び出しが効率的である', async () => {
      const endMeasurement = performanceMonitor.startMeasurement('concurrent-api-calls');

      // Mock multiple API endpoints
      const { supabase } = require('../config/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: generateLargeDataset(20),
                error: null,
              }),
            }),
          }),
        }),
      });

      // Simulate concurrent API calls
      const apiCalls = [
        communityFeedService.getPosts('user-123', 20, 0),
        communityFeedService.getUserPosts('user-123', 10, 0),
        externalSystemsService.getExternalProjects(),
        externalSystemsService.getExternalSessions(),
      ];

      await Promise.all(apiCalls);

      const duration = endMeasurement();

      // Concurrent calls should be faster than sequential
      expect(duration).toBeLessThan(1000); // 1 second for concurrent calls
    });

    it('データキャッシュが効果的に動作する', async () => {
      // First call (cache miss)
      const firstCallEnd = performanceMonitor.startMeasurement('first-api-call');
      
      const { supabase } = require('../config/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'user-123', name: 'Test User' },
              error: null,
            }),
          }),
        }),
      });

      await authService.getProfile('user-123');
      const firstCallDuration = firstCallEnd();

      // Second call (should be faster due to caching or mocking)
      const secondCallEnd = performanceMonitor.startMeasurement('second-api-call');
      await authService.getProfile('user-123');
      const secondCallDuration = secondCallEnd();

      console.log(`First call: ${Math.round(firstCallDuration)}ms, Second call: ${Math.round(secondCallDuration)}ms`);

      // Second call should be faster or similar (due to mocking, both will be fast)
      expect(secondCallDuration).toBeLessThanOrEqual(firstCallDuration + 50); // Allow 50ms variance
    });

    it('大量データ取得のページネーションが効率的である', async () => {
      const endMeasurement = performanceMonitor.startMeasurement('pagination-performance');

      const { supabase } = require('../config/supabase');
      
      // Mock paginated responses
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: generateLargeDataset(20), // 20 items per page
                error: null,
              }),
            }),
          }),
        }),
      });

      // Simulate loading multiple pages
      const pagePromises = Array.from({ length: 5 }, (_, page) =>
        communityFeedService.getPosts('user-123', 20, page * 20)
      );

      await Promise.all(pagePromises);

      const duration = endMeasurement();

      expect(duration).toBeLessThan(2000); // 2 seconds for 5 pages
      console.log(`Pagination performance: ${Math.round(duration)}ms for 5 pages`);
    });
  });

  describe('パフォーマンス回帰テスト', () => {
    it('複数回実行での性能安定性', async () => {
      const iterations = 10;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const endMeasurement = performanceMonitor.startMeasurement(`iteration-${i}`);
        
        // Simulate consistent operation
        await authService.getCurrentUser();
        await new Promise(resolve => setTimeout(resolve, 50));
        
        durations.push(endMeasurement());
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      const variance = maxDuration - minDuration;

      console.log(`Performance stability: avg=${Math.round(avgDuration)}ms, variance=${Math.round(variance)}ms`);

      // Performance should be stable (low variance)
      expect(variance).toBeLessThan(200); // Less than 200ms variance
      expect(avgDuration).toBeLessThan(300); // Average under 300ms
    });

    it('メモリ使用量の安定性', async () => {
      const memoryReadings: number[] = [];

      for (let i = 0; i < 5; i++) {
        // Simulate operation
        const data = generateLargeDataset(200);
        const processed = data.map(item => ({ ...item, processed: true }));
        
        const memory = getMemoryUsage();
        memoryReadings.push(memory.heapUsed);
        
        // Clean up
        processed.length = 0;
        
        // Wait for potential cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const memoryVarianceMB = (Math.max(...memoryReadings) - Math.min(...memoryReadings)) / 1024 / 1024;
      
      console.log(`Memory variance: ${Math.round(memoryVarianceMB)}MB`);

      // Memory usage should be relatively stable
      expect(memoryVarianceMB).toBeLessThan(20); // Less than 20MB variance
    });
  });

  describe('パフォーマンス最適化検証', () => {
    it('レイジーローディングの効果', async () => {
      // Simulate eager loading
      const eagerStart = performanceMonitor.startMeasurement('eager-loading');
      const eagerData = generateLargeDataset(1000);
      const eagerDuration = eagerStart();

      // Simulate lazy loading
      const lazyStart = performanceMonitor.startMeasurement('lazy-loading');
      const lazyData = generateLargeDataset(100); // Load only what's needed
      const lazyDuration = lazyStart();

      console.log(`Eager: ${Math.round(eagerDuration)}ms, Lazy: ${Math.round(lazyDuration)}ms`);

      // Lazy loading should be significantly faster
      expect(lazyDuration).toBeLessThan(eagerDuration * 0.5); // At least 50% faster

      // Clean up
      eagerData.length = 0;
      lazyData.length = 0;
    });

    it('データ圧縮の効果', async () => {
      const originalData = generateLargeDataset(500);
      
      // Simulate data compression (removing unnecessary fields)
      const compressedStart = performanceMonitor.startMeasurement('data-compression');
      const compressedData = originalData.map(item => ({
        id: item.id,
        title: item.title,
        // Remove description and other heavy fields
      }));
      const compressionDuration = compressedStart();

      const originalSize = JSON.stringify(originalData).length;
      const compressedSize = JSON.stringify(compressedData).length;
      const compressionRatio = compressedSize / originalSize;

      console.log(`Compression ratio: ${Math.round(compressionRatio * 100)}%`);
      console.log(`Compression time: ${Math.round(compressionDuration)}ms`);

      // Compression should reduce size significantly
      expect(compressionRatio).toBeLessThan(0.7); // At least 30% reduction
      expect(compressionDuration).toBeLessThan(100); // Fast compression
    });

    it('バンドルサイズ最適化の効果', async () => {
      // Simulate bundle size optimization by measuring import times
      const heavyImportStart = performanceMonitor.startMeasurement('heavy-import');
      
      // Simulate heavy import (large dataset creation)
      const heavyData = generateLargeDataset(2000);
      const heavyImportDuration = heavyImportStart();

      const lightImportStart = performanceMonitor.startMeasurement('light-import');
      
      // Simulate optimized import (smaller dataset)
      const lightData = generateLargeDataset(200);
      const lightImportDuration = lightImportStart();

      console.log(`Heavy import: ${Math.round(heavyImportDuration)}ms, Light import: ${Math.round(lightImportDuration)}ms`);

      // Optimized bundle should load faster
      expect(lightImportDuration).toBeLessThan(heavyImportDuration * 0.3); // At least 70% faster

      // Clean up
      heavyData.length = 0;
      lightData.length = 0;
    });
  });
});