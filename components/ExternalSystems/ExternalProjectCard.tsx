// Task 4: 外部プロジェクトカードコンポーネント

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ExternalProject } from '../../types/externalSystems';

interface ExternalProjectCardProps {
  project: ExternalProject;
  onPress?: (project: ExternalProject) => void;
}

export const ExternalProjectCard: React.FC<ExternalProjectCardProps> = ({ project, onPress }) => {
  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'archived': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress?.(project)}
      activeOpacity={0.7}
    >
      {project.image_url && (
        <Image source={{ uri: project.image_url }} style={styles.image} />
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {project.title}
          </Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: getStatusColor(project.status) }]}>
              <Text style={styles.badgeText}>{project.status}</Text>
            </View>
            {project.difficulty_level && (
              <View style={[styles.badge, { backgroundColor: getDifficultyColor(project.difficulty_level) }]}>
                <Text style={styles.badgeText}>{project.difficulty_level}</Text>
              </View>
            )}
          </View>
        </View>

        {project.description && (
          <Text style={styles.description} numberOfLines={3}>
            {project.description}
          </Text>
        )}

        <View style={styles.metadata}>
          <View style={styles.metadataRow}>
            <Text style={styles.platform}>{project.source_platform}</Text>
            {project.participants_count !== undefined && (
              <Text style={styles.participants}>
                👥 {project.participants_count}
                {project.max_participants && `/${project.max_participants}`}
              </Text>
            )}
          </View>
          
          {(project.start_date || project.end_date) && (
            <View style={styles.metadataRow}>
              {project.start_date && (
                <Text style={styles.date}>📅 {formatDate(project.start_date)}</Text>
              )}
              {project.end_date && (
                <Text style={styles.date}>🏁 {formatDate(project.end_date)}</Text>
              )}
            </View>
          )}
        </View>

        {project.tags && project.tags.length > 0 && (
          <View style={styles.tags}>
            {project.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {project.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{project.tags.length - 3}</Text>
            )}
          </View>
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
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
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
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 8,
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
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
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
  participants: {
    fontSize: 12,
    color: '#666666',
  },
  date: {
    fontSize: 12,
    color: '#666666',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
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
});