/**
 * User Analytics Dashboard Component
 * Displays user behavior analytics and conversion metrics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import UserAnalyticsInitializer from '../services/userAnalyticsInitializer';
import UserAnalyticsService from '../services/userAnalyticsService';

interface AnalyticsData {
  totalUsers: number;
  totalActions: number;
  totalScreenTransitions: number;
  totalConversions: number;
  conversionRates: Record<string, number>;
  featureUsageStats: Record<string, {
    totalUsers: number;
    totalUsage: number;
    averageTimeSpent: number;
  }>;
  topScreens: Array<{ screen: string; visits: number }>;
  topActions: Array<{ action: string; count: number }>;
}

interface UserAnalyticsDashboardProps {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  refreshInterval?: number;
}

const UserAnalyticsDashboard: React.FC<UserAnalyticsDashboardProps> = ({
  dateRange,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'conversions' | 'features'>('overview');
  const [analyticsService, setAnalyticsService] = useState<UserAnalyticsService | null>(null);

  const defaultDateRange = {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date()
  };

  const currentDateRange = dateRange || defaultDateRange;

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    if (analyticsService) {
      loadAnalyticsData();
      
      const interval = setInterval(loadAnalyticsData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [analyticsService, currentDateRange]);

  const initializeAnalytics = async () => {
    try {
      const service = await UserAnalyticsInitializer.initialize();
      setAnalyticsService(service);
    } catch (err) {
      setError('Failed to initialize analytics service');
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    if (!analyticsService) return;

    try {
      setLoading(true);
      setError(null);

      // In a real implementation, these would be actual database queries
      const [conversionRates, featureUsageStats] = await Promise.all([
        analyticsService.calculateConversionRates(
          ['registration_started', 'registration_completed', 'first_post', 'membership_purchased'],
          currentDateRange.startDate,
          currentDateRange.endDate
        ),
        analyticsService.getFeatureUsageStats(
          currentDateRange.startDate,
          currentDateRange.endDate
        )
      ]);

      // Mock data for demonstration
      const mockData: AnalyticsData = {
        totalUsers: 1250,
        totalActions: 15680,
        totalScreenTransitions: 8940,
        totalConversions: 340,
        conversionRates,
        featureUsageStats,
        topScreens: [
          { screen: 'community', visits: 2340 },
          { screen: 'learning-dashboard', visits: 1890 },
          { screen: 'peer-sessions', visits: 1560 },
          { screen: 'projects', visits: 1230 },
          { screen: 'resources', visits: 980 }
        ],
        topActions: [
          { action: 'button_click', count: 5670 },
          { action: 'content_view', count: 3450 },
          { action: 'form_submission', count: 1230 },
          { action: 'search', count: 890 },
          { action: 'share', count: 560 }
        ]
      };

      setAnalyticsData(mockData);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{analyticsData?.totalUsers.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Total Users</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{analyticsData?.totalActions.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Total Actions</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{analyticsData?.totalScreenTransitions.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Screen Transitions</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{analyticsData?.totalConversions.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Conversions</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Screens</Text>
        {analyticsData?.topScreens.map((screen, index) => (
          <View key={screen.screen} style={styles.listItem}>
            <Text style={styles.listItemText}>{screen.screen}</Text>
            <Text style={styles.listItemValue}>{screen.visits.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Actions</Text>
        {analyticsData?.topActions.map((action, index) => (
          <View key={action.action} style={styles.listItem}>
            <Text style={styles.listItemText}>{action.action}</Text>
            <Text style={styles.listItemValue}>{action.count.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderConversionsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Conversion Rates</Text>
      {Object.entries(analyticsData?.conversionRates || {}).map(([funnel, rate]) => (
        <View key={funnel} style={styles.listItem}>
          <Text style={styles.listItemText}>{funnel.replace(/_/g, ' ')}</Text>
          <Text style={styles.listItemValue}>{rate.toFixed(1)}%</Text>
        </View>
      ))}
    </View>
  );

  const renderFeaturesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Feature Usage Statistics</Text>
      {Object.entries(analyticsData?.featureUsageStats || {}).map(([feature, stats]) => (
        <View key={feature} style={styles.featureCard}>
          <Text style={styles.featureTitle}>{feature.replace(/_/g, ' ')}</Text>
          <View style={styles.featureStats}>
            <View style={styles.featureStat}>
              <Text style={styles.featureStatValue}>{stats.totalUsers}</Text>
              <Text style={styles.featureStatLabel}>Users</Text>
            </View>
            <View style={styles.featureStat}>
              <Text style={styles.featureStatValue}>{stats.totalUsage}</Text>
              <Text style={styles.featureStatLabel}>Usage</Text>
            </View>
            <View style={styles.featureStat}>
              <Text style={styles.featureStatValue}>{Math.round(stats.averageTimeSpent / 1000)}s</Text>
              <Text style={styles.featureStatLabel}>Avg Time</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  if (loading && !analyticsData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading analytics data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalyticsData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Analytics Dashboard</Text>
        <Text style={styles.dateRange}>
          {currentDateRange.startDate.toLocaleDateString()} - {currentDateRange.endDate.toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'conversions' && styles.activeTab]}
          onPress={() => setSelectedTab('conversions')}
        >
          <Text style={[styles.tabText, selectedTab === 'conversions' && styles.activeTabText]}>
            Conversions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'features' && styles.activeTab]}
          onPress={() => setSelectedTab('features')}
        >
          <Text style={[styles.tabText, selectedTab === 'features' && styles.activeTabText]}>
            Features
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'conversions' && renderConversionsTab()}
        {selectedTab === 'features' && renderFeaturesTab()}
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  dateRange: {
    fontSize: 14,
    color: '#666'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center'
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF'
  },
  tabText: {
    fontSize: 16,
    color: '#666'
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600'
  },
  content: {
    flex: 1
  },
  tabContent: {
    padding: 20
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30
  },
  metricCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    padding: 20,
    margin: 5,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
    textTransform: 'capitalize'
  },
  listItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF'
  },
  featureCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textTransform: 'capitalize'
  },
  featureStats: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  featureStat: {
    alignItems: 'center'
  },
  featureStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  featureStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default UserAnalyticsDashboard;