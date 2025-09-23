// Task 4: 外部システム連携ダッシュボードコンポーネント

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { ExternalSystemsService } from '../../services/externalSystemsService';
import { DashboardStats } from '../../types/externalSystems';

interface ExternalSystemsDashboardProps {
  onNavigateToProjects?: () => void;
  onNavigateToSessions?: () => void;
  onNavigateToAccommodations?: () => void;
}

export const ExternalSystemsDashboard: React.FC<ExternalSystemsDashboardProps> = ({
  onNavigateToProjects,
  onNavigateToSessions,
  onNavigateToAccommodations
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setError(null);
      const dashboardStats = await ExternalSystemsService.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const renderProjectStats = () => {
    if (!stats?.projects) return null;

    const totalProjects = Object.values(stats.projects).reduce((sum, count) => sum + count, 0);

    return (
      <TouchableOpacity style={styles.statCard} onPress={onNavigateToProjects}>
        <View style={styles.statHeader}>
          <Text style={styles.statIcon}>🚀</Text>
          <Text style={styles.statTitle}>Projects</Text>
        </View>
        <Text style={styles.statNumber}>{totalProjects}</Text>
        <Text style={styles.statSubtitle}>Active projects</Text>
        
        <View style={styles.platformBreakdown}>
          {Object.entries(stats.projects).map(([platform, count]) => (
            <View key={platform} style={styles.platformItem}>
              <Text style={styles.platformName}>{platform}</Text>
              <Text style={styles.platformCount}>{count}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSessionStats = () => {
    return (
      <TouchableOpacity style={styles.statCard} onPress={onNavigateToSessions}>
        <View style={styles.statHeader}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statTitle}>Today's Sessions</Text>
        </View>
        <Text style={styles.statNumber}>{stats?.todaySessionsCount || 0}</Text>
        <Text style={styles.statSubtitle}>Scheduled for today</Text>
        
        {stats?.todaySessionsCount && stats.todaySessionsCount > 0 && (
          <View style={styles.sessionIndicator}>
            <Text style={styles.sessionIndicatorText}>🔴 Live sessions available</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAccommodationStats = () => {
    return (
      <TouchableOpacity style={styles.statCard} onPress={onNavigateToAccommodations}>
        <View style={styles.statHeader}>
          <Text style={styles.statIcon}>🏠</Text>
          <Text style={styles.statTitle}>Popular Cities</Text>
        </View>
        
        {stats?.popularCities && stats.popularCities.length > 0 ? (
          <View style={styles.citiesList}>
            {stats.popularCities.slice(0, 3).map((cityData, index) => (
              <View key={index} style={styles.cityItem}>
                <Text style={styles.cityName}>{cityData.city}</Text>
                <Text style={styles.cityCount}>{cityData.count} places</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>No accommodation data</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
          <Text style={styles.retryButtonText}>Retry</Text>
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
        <Text style={styles.title}>External Systems</Text>
        <Text style={styles.subtitle}>Connected platforms and resources</Text>
      </View>

      <View style={styles.statsGrid}>
        {renderProjectStats()}
        {renderSessionStats()}
        {renderAccommodationStats()}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={onNavigateToProjects}>
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionText}>Browse Projects</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onNavigateToSessions}>
          <Text style={styles.actionIcon}>📺</Text>
          <Text style={styles.actionText}>Join Sessions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onNavigateToAccommodations}>
          <Text style={styles.actionIcon}>🗺️</Text>
          <Text style={styles.actionText}>Find Accommodation</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  statsGrid: {
    padding: 16,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  platformBreakdown: {
    gap: 8,
  },
  platformItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  platformName: {
    fontSize: 14,
    color: '#333333',
    textTransform: 'capitalize',
  },
  platformCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2196F3',
  },
  sessionIndicator: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  sessionIndicatorText: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
  },
  citiesList: {
    gap: 8,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  cityName: {
    fontSize: 14,
    color: '#333333',
  },
  cityCount: {
    fontSize: 12,
    color: '#666666',
  },
  noDataText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quickActions: {
    padding: 16,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#333333',
  },
});