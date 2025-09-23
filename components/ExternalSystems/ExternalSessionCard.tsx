// Task 4: 外部セッションカードコンポーネント

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ExternalSession } from '../../types/externalSystems';

interface ExternalSessionCardProps {
  session: ExternalSession;
  onPress?: (session: ExternalSession) => void;
  onJoin?: (session: ExternalSession) => void;
}

export const ExternalSessionCard: React.FC<ExternalSessionCardProps> = ({ 
  session, 
  onPress, 
  onJoin 
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'scheduled': return '#FF9800';
      case 'live': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'workshop': return '🛠️';
      case 'study_group': return '📚';
      case 'mentoring': return '👨‍🏫';
      case 'presentation': return '📊';
      case 'discussion': return '💬';
      default: return '🎯';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getDuration = () => {
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const isLive = session.status === 'live';
  const canJoin = session.status === 'scheduled' || session.status === 'live';
  const startTime = formatDateTime(session.start_time);
  const endTime = formatDateTime(session.end_time);

  return (
    <TouchableOpacity 
      style={[styles.card, isLive && styles.liveCard]} 
      onPress={() => onPress?.(session)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.icon}>{getSessionTypeIcon(session.session_type)}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {session.title}
            </Text>
          </View>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: getStatusColor(session.status) }]}>
              <Text style={styles.badgeText}>{session.status}</Text>
            </View>
            {isLive && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>🔴 LIVE</Text>
              </View>
            )}
          </View>
        </View>

        {session.description && (
          <Text style={styles.description} numberOfLines={2}>
            {session.description}
          </Text>
        )}

        <View style={styles.timeInfo}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>📅 {startTime.date}</Text>
            <Text style={styles.duration}>⏱️ {getDuration()}</Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.time}>
              🕐 {startTime.time} - {endTime.time}
            </Text>
            {session.timezone && (
              <Text style={styles.timezone}>({session.timezone})</Text>
            )}
          </View>
        </View>

        <View style={styles.metadata}>
          <View style={styles.metadataRow}>
            <Text style={styles.platform}>{session.source_platform}</Text>
            <Text style={styles.sessionType}>{session.session_type}</Text>
          </View>
          
          <View style={styles.metadataRow}>
            {session.host_name && (
              <Text style={styles.host}>👤 {session.host_name}</Text>
            )}
            {session.max_participants && (
              <Text style={styles.participants}>
                👥 {session.current_participants || 0}/{session.max_participants}
              </Text>
            )}
          </View>
        </View>

        {session.tags && session.tags.length > 0 && (
          <View style={styles.tags}>
            {session.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {session.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{session.tags.length - 3}</Text>
            )}
          </View>
        )}

        {canJoin && session.join_url && (
          <TouchableOpacity 
            style={[styles.joinButton, isLive && styles.liveJoinButton]}
            onPress={() => onJoin?.(session)}
          >
            <Text style={[styles.joinButtonText, isLive && styles.liveJoinButtonText]}>
              {isLive ? '🔴 Join Live Session' : '📅 Join Session'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  liveCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  liveBadge: {
    backgroundColor: '#FF1744',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  timeInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
  },
  duration: {
    fontSize: 12,
    color: '#666666',
  },
  time: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2196F3',
  },
  timezone: {
    fontSize: 12,
    color: '#999999',
  },
  metadata: {
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  platform: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2196F3',
    textTransform: 'capitalize',
  },
  sessionType: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'capitalize',
  },
  host: {
    fontSize: 12,
    color: '#666666',
  },
  participants: {
    fontSize: 12,
    color: '#666666',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#666666',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#999999',
    fontStyle: 'italic',
  },
  joinButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  liveJoinButton: {
    backgroundColor: '#4CAF50',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  liveJoinButtonText: {
    color: '#FFFFFF',
  },
});