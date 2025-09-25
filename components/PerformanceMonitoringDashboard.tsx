/**
 * パフォーマンス監視ダッシュボードコンポーネント
 * パフォーマンスメトリクスとアラートの表示
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import PerformanceMonitoringInitializer from '../services/performanceMonitoringInitializer';

interface PerformanceStats {
  totalMetrics: number;
  averageResponseTimes: Record<string, number>;
  systemMetricsAverage: Record<string, number>;
  networkStatistics: Record<string, number>;
  userExperienceStatistics: Record<string, number>;
  recentAlerts: any[];
}

const PerformanceMonitoringDashboard: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const performanceInitializer = PerformanceMonitoringInitializer.getInstance();

  const loadPerformanceStats = async () => {
    try {
      const performanceReport = await performanceInitializer.getPerformanceReport();
      setStats(performanceReport);
    } catch (error) {
      console.error('Failed to load performance stats:', error);
      Alert.alert('エラー', 'パフォーマンス統計の読み込みに失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPerformanceStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPerformanceStats();
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes}B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)}KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    }
  };

  const getAlertSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#FFAA00';
      case 'low': return '#44AA44';
      default: return '#666666';
    }
  };

  const renderMetricCard = (title: string, value: string | number, unit?: string, color?: string) => (
    <View style={[styles.metricCard, color && { borderLeftColor: color }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, color && { color }]}>
        {value}{unit && ` ${unit}`}
      </Text>
    </View>
  );

  const renderResponseTimeMetrics = () => {
    if (!stats?.averageResponseTimes) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>レスポンス時間</Text>
        <View style={styles.metricsGrid}>
          {Object.entries(stats.averageResponseTimes).map(([key, value]) => {
            const color = value > 1000 ? '#FF4444' : value > 500 ? '#FFAA00' : '#44AA44';
            return renderMetricCard(
              key === 'screenTransition' ? '画面遷移' :
              key === 'apiCall' ? 'API呼び出し' :
              key === 'databaseQuery' ? 'DB クエリ' :
              key === 'renderTime' ? 'レンダリング' : key,
              formatDuration(value),
              '',
              color
            );
          })}
        </View>
      </View>
    );
  };

  const renderSystemMetrics = () => {
    if (!stats?.systemMetricsAverage) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>システムメトリクス</Text>
        <View style={styles.metricsGrid}>
          {stats.systemMetricsAverage.memoryUsage && renderMetricCard(
            'メモリ使用量',
            Math.round(stats.systemMetricsAverage.memoryUsage),
            'MB',
            stats.systemMetricsAverage.memoryUsage > 150 ? '#FF4444' : '#44AA44'
          )}
          {stats.systemMetricsAverage.cpuUsage && renderMetricCard(
            'CPU使用率',
            Math.round(stats.systemMetricsAverage.cpuUsage),
            '%',
            stats.systemMetricsAverage.cpuUsage > 80 ? '#FF4444' : '#44AA44'
          )}
        </View>
      </View>
    );
  };

  const renderNetworkMetrics = () => {
    if (!stats?.networkStatistics) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ネットワーク統計</Text>
        <View style={styles.metricsGrid}>
          {stats.networkStatistics.totalRequests && renderMetricCard(
            'リクエスト数',
            stats.networkStatistics.totalRequests,
            '件'
          )}
          {stats.networkStatistics.averageLatency && renderMetricCard(
            '平均レイテンシ',
            formatDuration(stats.networkStatistics.averageLatency),
            '',
            stats.networkStatistics.averageLatency > 1000 ? '#FF4444' : '#44AA44'
          )}
          {stats.networkStatistics.errorRate !== undefined && renderMetricCard(
            'エラー率',
            Math.round(stats.networkStatistics.errorRate * 100) / 100,
            '%',
            stats.networkStatistics.errorRate > 5 ? '#FF4444' : '#44AA44'
          )}
          {stats.networkStatistics.totalDataTransferred && renderMetricCard(
            'データ転送量',
            formatBytes(stats.networkStatistics.totalDataTransferred)
          )}
        </View>
      </View>
    );
  };

  const renderUserExperienceMetrics = () => {
    if (!stats?.userExperienceStatistics) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ユーザー体験指標</Text>
        <View style={styles.metricsGrid}>
          {stats.userExperienceStatistics.averageAppStartTime && renderMetricCard(
            'アプリ起動時間',
            formatDuration(stats.userExperienceStatistics.averageAppStartTime),
            '',
            stats.userExperienceStatistics.averageAppStartTime > 3000 ? '#FF4444' : '#44AA44'
          )}
          {stats.userExperienceStatistics.averageTimeToInteractive && renderMetricCard(
            'インタラクティブ時間',
            formatDuration(stats.userExperienceStatistics.averageTimeToInteractive),
            '',
            stats.userExperienceStatistics.averageTimeToInteractive > 5000 ? '#FF4444' : '#44AA44'
          )}
          {stats.userExperienceStatistics.averageFrameDropCount !== undefined && renderMetricCard(
            'フレームドロップ',
            Math.round(stats.userExperienceStatistics.averageFrameDropCount),
            '回',
            stats.userExperienceStatistics.averageFrameDropCount > 10 ? '#FF4444' : '#44AA44'
          )}
        </View>
      </View>
    );
  };

  const renderRecentAlerts = () => {
    if (!stats?.recentAlerts || stats.recentAlerts.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近のアラート</Text>
          <Text style={styles.noAlertsText}>アラートはありません</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最近のアラート</Text>
        {stats.recentAlerts.slice(0, 5).map((alert, index) => (
          <View key={index} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={[
                styles.alertSeverityBadge,
                { backgroundColor: getAlertSeverityColor(alert.severity) }
              ]}>
                <Text style={styles.alertSeverityText}>
                  {alert.severity.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.alertTimestamp}>
                {new Date(alert.timestamp).toLocaleString('ja-JP')}
              </Text>
            </View>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            <Text style={styles.alertType}>タイプ: {alert.type}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>パフォーマンス統計を読み込み中...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>パフォーマンス統計の読み込みに失敗しました</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPerformanceStats}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>パフォーマンス監視ダッシュボード</Text>
        <Text style={styles.subtitle}>
          総メトリクス数: {stats.totalMetrics}
        </Text>
      </View>

      {renderResponseTimeMetrics()}
      {renderSystemMetrics()}
      {renderNetworkMetrics()}
      {renderUserExperienceMetrics()}
      {renderRecentAlerts()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    minWidth: '48%',
    borderLeftWidth: 4,
    borderLeftColor: '#44AA44',
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  alertCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertSeverityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  alertSeverityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  alertType: {
    fontSize: 12,
    color: '#666',
  },
  noAlertsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PerformanceMonitoringDashboard;