import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Alert } from 'react-native';
import { Group } from '../services/groupsService';

interface GroupCardProps {
  group: Group;
  onJoinGroup?: (groupId: string) => void;
}

/**
 * Group Card Component
 * Displays group information with external participation link
 * Requirements: 4.1, 4.2, 5.3, 5.4 - Display groups from database with external links
 */
export default function GroupCard({ group, onJoinGroup }: GroupCardProps) {
  const handleJoinGroup = async () => {
    if (group.externalLink) {
      try {
        const supported = await Linking.canOpenURL(group.externalLink);
        if (supported) {
          await Linking.openURL(group.externalLink);
        } else {
          Alert.alert(
            'リンクを開けません',
            'このリンクを開くことができませんでした。URLをコピーしてブラウザで開いてください。',
            [
              { text: 'キャンセル', style: 'cancel' },
              {
                text: 'URLをコピー',
                onPress: () => {
                  // In a real app, you would use Clipboard API here
                  Alert.alert('URL', group.externalLink || '');
                }
              }
            ]
          );
        }
      } catch (error) {
        console.error('Error opening external link:', error);
        Alert.alert('エラー', '外部リンクを開く際にエラーが発生しました。');
      }
    } else if (onJoinGroup) {
      onJoinGroup(group.id);
    }
  };

  const formatCreatedDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlatformIcon = (url?: string): string => {
    if (!url) return '🔗';
    
    if (url.includes('discord')) return '💬';
    if (url.includes('telegram') || url.includes('t.me')) return '✈️';
    if (url.includes('line.me')) return '💚';
    if (url.includes('slack')) return '💼';
    if (url.includes('whatsapp')) return '📱';
    if (url.includes('facebook') || url.includes('fb.com')) return '📘';
    if (url.includes('github')) return '🐙';
    if (url.includes('gitlab')) return '🦊';
    
    return '🔗';
  };

  const getPlatformName = (url?: string): string => {
    if (!url) return '外部リンク';
    
    if (url.includes('discord')) return 'Discord';
    if (url.includes('telegram') || url.includes('t.me')) return 'Telegram';
    if (url.includes('line.me')) return 'LINE';
    if (url.includes('slack')) return 'Slack';
    if (url.includes('whatsapp')) return 'WhatsApp';
    if (url.includes('facebook') || url.includes('fb.com')) return 'Facebook';
    if (url.includes('github')) return 'GitHub';
    if (url.includes('gitlab')) return 'GitLab';
    
    return '外部サイト';
  };

  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{group.name}</Text>
        <View style={styles.groupMeta}>
          <Text style={styles.groupMetaText}>
            作成日: {formatCreatedDate(group.createdAt)}
          </Text>
          {group.creatorName && (
            <Text style={styles.groupMetaText}>
              作成者: {group.creatorName}
            </Text>
          )}
        </View>
      </View>
      
      {group.description && (
        <Text style={styles.groupDescription}>{group.description}</Text>
      )}
      
      <View style={styles.groupStats}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statText}>{group.memberCount}名</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statText}>
            {group.isActive ? 'アクティブ' : '非アクティブ'}
          </Text>
        </View>
        {group.externalLink && (
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>{getPlatformIcon(group.externalLink)}</Text>
            <Text style={styles.statText}>{getPlatformName(group.externalLink)}</Text>
          </View>
        )}
      </View>
      
      {group.externalLink && (
        <View style={styles.externalLinkSection}>
          <Text style={styles.externalLinkLabel}>🔗 外部参加リンク</Text>
          <TouchableOpacity 
            style={styles.joinGroupButton}
            onPress={handleJoinGroup}
          >
            <Text style={styles.joinGroupButtonText}>
              {getPlatformIcon(group.externalLink)} {getPlatformName(group.externalLink)}で参加
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {!group.externalLink && (
        <View style={styles.noLinkContainer}>
          <Text style={styles.noLinkText}>
            🔗 外部参加リンクは準備中です
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    marginBottom: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  groupMeta: {
    gap: 2,
  },
  groupMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  groupDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  groupStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 14,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  externalLinkSection: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  externalLinkLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    marginBottom: 8,
  },
  joinGroupButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  joinGroupButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noLinkContainer: {
    backgroundColor: '#fef3c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  noLinkText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '500',
  },
});