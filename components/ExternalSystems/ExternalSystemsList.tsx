// Task 4: 外部システム連携リストコンポーネント

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  ActivityIndicator,
  TextInput 
} from 'react-native';
import { 
  ExternalProject, 
  ExternalSession, 
  ExternalAccommodation,
  ProjectFilters,
  SessionFilters,
  AccommodationFilters
} from '../../types/externalSystems';
import { 
  ExternalProjectsService, 
  ExternalSessionsService, 
  ExternalAccommodationsService 
} from '../../services/externalSystemsService';
import { ExternalProjectCard } from './ExternalProjectCard';
import { ExternalSessionCard } from './ExternalSessionCard';
import { ExternalAccommodationCard } from './ExternalAccommodationCard';

type ListType = 'projects' | 'sessions' | 'accommodations';

interface ExternalSystemsListProps {
  type: ListType;
  onItemPress?: (item: any) => void;
  onJoinSession?: (session: ExternalSession) => void;
  onBookAccommodation?: (accommodation: ExternalAccommodation) => void;
  initialFilters?: ProjectFilters | SessionFilters | AccommodationFilters;
}

export const ExternalSystemsList: React.FC<ExternalSystemsListProps> = ({
  type,
  onItemPress,
  onJoinSession,
  onBookAccommodation,
  initialFilters
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(initialFilters || {});

  const loadData = async () => {
    try {
      setError(null);
      let result;

      switch (type) {
        case 'projects':
          result = await ExternalProjectsService.getProjects(filters as ProjectFilters);
          break;
        case 'sessions':
          result = await ExternalSessionsService.getSessions(filters as SessionFilters);
          break;
        case 'accommodations':
          result = await ExternalAccommodationsService.searchAccommodations(filters as AccommodationFilters);
          break;
        default:
          result = [];
      }

      setData(result || []);
    } catch (err) {
      console.error(`Error loading ${type}:`, err);
      setError(`Failed to load ${type}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [type, filters]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search logic here if needed
  };

  const renderItem = ({ item }: { item: any }) => {
    switch (type) {
      case 'projects':
        return (
          <ExternalProjectCard 
            project={item as ExternalProject} 
            onPress={onItemPress}
          />
        );
      case 'sessions':
        return (
          <ExternalSessionCard 
            session={item as ExternalSession} 
            onPress={onItemPress}
            onJoin={onJoinSession}
          />
        );
      case 'accommodations':
        return (
          <ExternalAccommodationCard 
            accommodation={item as ExternalAccommodation} 
            onPress={onItemPress}
            onBook={onBookAccommodation}
          />
        );
      default:
        return null;
    }
  };

  const getEmptyMessage = () => {
    switch (type) {
      case 'projects':
        return 'No projects found';
      case 'sessions':
        return 'No sessions scheduled';
      case 'accommodations':
        return 'No accommodations available';
      default:
        return 'No data available';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'projects':
        return 'External Projects';
      case 'sessions':
        return 'Learning Sessions';
      case 'accommodations':
        return 'Accommodations';
      default:
        return 'External Systems';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{getTitle()}</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${type}...`}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {type === 'projects' ? '🚀' : type === 'sessions' ? '📅' : '🏠'}
      </Text>
      <Text style={styles.emptyTitle}>{getEmptyMessage()}</Text>
      <Text style={styles.emptySubtitle}>
        {type === 'projects' && 'Check back later for new projects'}
        {type === 'sessions' && 'No sessions are currently scheduled'}
        {type === 'accommodations' && 'Try adjusting your search criteria'}
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadData}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading {type}...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return renderError();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || item.external_id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={data.length === 0 ? styles.emptyList : undefined}
      />
    </View>
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});