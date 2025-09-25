/**
 * Logging Dashboard Component
 * Provides UI for viewing, searching, and analyzing structured logs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Switch
} from 'react-native';
import StructuredLoggingService, { 
  StructuredLogEntry, 
  LogLevel, 
  LogCategory, 
  LogFilter 
} from '../services/loggingService';

interface LoggingDashboardProps {
  visible: boolean;
  onClose: () => void;
}

const LoggingDashboard: React.FC<LoggingDashboardProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<StructuredLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<LogFilter>({});
  const [searchText, setSearchText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [selectedLog, setSelectedLog] = useState<StructuredLogEntry | null>(null);

  const loggingService = StructuredLoggingService.getInstance();

  useEffect(() => {
    if (visible) {
      loadLogs();
      loadStatistics();
    }
  }, [visible]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const currentFilter: LogFilter = {
        ...filter,
        searchText: searchText || undefined,
        level: selectedLevel || undefined,
        category: selectedCategory || undefined
      };

      const fetchedLogs = await loggingService.searchLogs(currentFilter, 200);
      setLogs(fetchedLogs);
    } catch (error) {
      Alert.alert('Error', 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await loggingService.getLogStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleSearch = () => {
    loadLogs();
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await loggingService.clearLogs();
              setLogs([]);
              loadStatistics();
              Alert.alert('Success', 'All logs have been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear logs');
            }
          }
        }
      ]
    );
  };

  const handleExportLogs = async () => {
    try {
      const exportData = await loggingService.exportLogs(filter);
      // In a real app, you would save this to a file or share it
      Alert.alert('Export', `Exported ${logs.length} logs to JSON format`);
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'ERROR': return '#ff4444';
      case 'WARN': return '#ffaa00';
      case 'INFO': return '#0088ff';
      case 'DEBUG': return '#888888';
      default: return '#000000';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const renderLogItem = ({ item }: { item: StructuredLogEntry }) => (
    <TouchableOpacity
      style={styles.logItem}
      onPress={() => setSelectedLog(item)}
    >
      <View style={styles.logHeader}>
        <Text style={[styles.logLevel, { color: getLevelColor(item.level) }]}>
          {item.level}
        </Text>
        <Text style={styles.logCategory}>{item.category}</Text>
        <Text style={styles.logTimestamp}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
      <Text style={styles.logMessage} numberOfLines={2}>
        {item.message}
      </Text>
      {item.context?.source && (
        <Text style={styles.logSource}>Source: {item.context.source}</Text>
      )}
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <Text key={index} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderLogDetail = () => (
    <Modal
      visible={!!selectedLog}
      animationType="slide"
      onRequestClose={() => setSelectedLog(null)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Log Details</Text>
          <TouchableOpacity onPress={() => setSelectedLog(null)}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
        
        {selectedLog && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Level:</Text>
              <Text style={[styles.detailValue, { color: getLevelColor(selectedLog.level) }]}>
                {selectedLog.level}
              </Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{selectedLog.category}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Timestamp:</Text>
              <Text style={styles.detailValue}>
                {formatTimestamp(selectedLog.timestamp)}
              </Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Message:</Text>
              <Text style={styles.detailValue}>{selectedLog.message}</Text>
            </View>
            
            {selectedLog.context && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Context:</Text>
                <Text style={styles.jsonText}>
                  {JSON.stringify(selectedLog.context, null, 2)}
                </Text>
              </View>
            )}
            
            {selectedLog.metadata && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Metadata:</Text>
                <Text style={styles.jsonText}>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </Text>
              </View>
            )}
            
            {selectedLog.tags && selectedLog.tags.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Tags:</Text>
                <View style={styles.tagsContainer}>
                  {selectedLog.tags.map((tag, index) => (
                    <Text key={index} style={styles.tag}>
                      {tag}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Logging Dashboard</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        {statistics && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Statistics</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statItem}>Total: {statistics.totalLogs}</Text>
              <Text style={styles.statItem}>Errors: {statistics.logsByLevel.ERROR}</Text>
              <Text style={styles.statItem}>
                Error Rate: {statistics.errorRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        )}

        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={styles.filterToggle}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterToggleText}>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersPanel}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Level:</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="ERROR, WARN, INFO, DEBUG"
                value={selectedLevel}
                onChangeText={(text) => setSelectedLevel(text as LogLevel)}
              />
            </View>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Category:</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="auth, community, etc."
                value={selectedCategory}
                onChangeText={(text) => setSelectedCategory(text as LogCategory)}
              />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportLogs}>
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]} 
            onPress={handleClearLogs}
          >
            <Text style={styles.actionButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Logs List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0088ff" />
            <Text>Loading logs...</Text>
          </View>
        ) : (
          <FlatList
            data={logs}
            renderItem={renderLogItem}
            keyExtractor={(item, index) => `${item.timestamp}-${index}`}
            style={styles.logsList}
            refreshing={loading}
            onRefresh={loadLogs}
          />
        )}

        {renderLogDetail()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#0088ff',
    fontSize: 16,
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    margin: 8,
    borderRadius: 8,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    fontSize: 14,
    color: '#666666',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#ffffff',
    margin: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#0088ff',
    padding: 8,
    borderRadius: 4,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  filtersContainer: {
    paddingHorizontal: 8,
  },
  filterToggle: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterToggleText: {
    color: '#0088ff',
    fontWeight: 'bold',
  },
  filtersPanel: {
    backgroundColor: '#ffffff',
    margin: 8,
    padding: 16,
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    width: 80,
    fontWeight: 'bold',
  },
  filterInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
  },
  actionButton: {
    backgroundColor: '#0088ff',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#ff4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logsList: {
    flex: 1,
    padding: 8,
  },
  logItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logLevel: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  logCategory: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logTimestamp: {
    fontSize: 10,
    color: '#999999',
  },
  logMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  logSource: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    fontSize: 10,
    color: '#0088ff',
    backgroundColor: '#e6f3ff',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333333',
  },
  detailValue: {
    fontSize: 14,
    color: '#666666',
  },
  jsonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
    color: '#333333',
  },
});

export default LoggingDashboard;