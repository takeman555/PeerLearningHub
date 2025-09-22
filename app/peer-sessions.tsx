import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface Session {
  id: number;
  title: string;
  description: string;
  host: string;
  date: string;
  time: string;
  duration: string;
  participants: number;
  maxParticipants: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  status: 'upcoming' | 'live' | 'completed';
  isJoined?: boolean;
}

export default function PeerSessions() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'joined' | 'completed'>('upcoming');

  const [sessions] = useState<Session[]>([
    {
      id: 1,
      title: 'React Hooks 深掘り勉強会',
      description: 'useEffect、useState、カスタムフックの実践的な使い方を学びます。実際のコード例を交えながら、効率的なReact開発について議論しましょう。',
      host: '田中太郎',
      date: '2024-01-15',
      time: '19:00',
      duration: '90分',
      participants: 8,
      maxParticipants: 12,
      level: 'intermediate',
      tags: ['React', 'JavaScript', 'Frontend'],
      status: 'upcoming',
      isJoined: false
    },
    {
      id: 2,
      title: 'TypeScript基礎講座',
      description: 'TypeScriptの基本的な型システムから始めて、実際のプロジェクトでの活用方法まで学習します。',
      host: '佐藤花子',
      date: '2024-01-16',
      time: '20:00',
      duration: '120分',
      participants: 15,
      maxParticipants: 20,
      level: 'beginner',
      tags: ['TypeScript', 'JavaScript'],
      status: 'upcoming',
      isJoined: true
    },
    {
      id: 3,
      title: 'モバイルアプリ開発相談会',
      description: '現在進行中のモバイルアプリ開発プロジェクトについて、参加者同士で相談し合いましょう。',
      host: '山田次郎',
      date: '2024-01-14',
      time: '18:30',
      duration: '60分',
      participants: 6,
      maxParticipants: 10,
      level: 'intermediate',
      tags: ['Mobile', 'React Native', 'Flutter'],
      status: 'live'
    },
    {
      id: 4,
      title: 'Web3開発入門',
      description: 'ブロックチェーン技術とスマートコントラクトの基礎を学び、DAppの開発に挑戦します。',
      host: '鈴木一郎',
      date: '2024-01-12',
      time: '19:30',
      duration: '150分',
      participants: 12,
      maxParticipants: 15,
      level: 'advanced',
      tags: ['Blockchain', 'Web3', 'Solidity'],
      status: 'completed'
    }
  ]);

  const getFilteredSessions = () => {
    switch (activeTab) {
      case 'upcoming':
        return sessions.filter(s => s.status === 'upcoming' || s.status === 'live');
      case 'joined':
        return sessions.filter(s => s.isJoined);
      case 'completed':
        return sessions.filter(s => s.status === 'completed');
      default:
        return sessions;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return '初級';
      case 'intermediate': return '中級';
      case 'advanced': return '上級';
      default: return level;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#ef4444';
      case 'upcoming': return '#3b82f6';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return '🔴 ライブ中';
      case 'upcoming': return '📅 開催予定';
      case 'completed': return '✅ 完了';
      default: return status;
    }
  };

  const handleJoinSession = (sessionId: number) => {
    console.log(`Joining session ${sessionId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            開催予定
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => setActiveTab('joined')}
        >
          <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
            参加予定
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            完了済み
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sessions List */}
      <ScrollView style={styles.content}>
        {getFilteredSessions().map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionTitleContainer}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <View style={styles.badgeContainer}>
                  <View style={[styles.levelBadge, { backgroundColor: getLevelColor(session.level) + '20' }]}>
                    <Text style={[styles.levelText, { color: getLevelColor(session.level) }]}>
                      {getLevelText(session.level)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(session.status) }]}>
                      {getStatusText(session.status)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            <Text style={styles.sessionDescription}>{session.description}</Text>
            
            <View style={styles.sessionMeta}>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>👤</Text>
                  <Text style={styles.metaText}>ホスト: {session.host}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>📅</Text>
                  <Text style={styles.metaText}>{formatDate(session.date)} {session.time}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>⏱️</Text>
                  <Text style={styles.metaText}>{session.duration}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>👥</Text>
                  <Text style={styles.metaText}>{session.participants}/{session.maxParticipants}名</Text>
                </View>
              </View>
            </View>

            {/* Tags */}
            <View style={styles.tagsContainer}>
              {session.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              {session.status === 'live' && (
                <TouchableOpacity style={styles.liveButton}>
                  <Text style={styles.liveButtonText}>🔴 ライブに参加</Text>
                </TouchableOpacity>
              )}
              {session.status === 'upcoming' && !session.isJoined && (
                <TouchableOpacity 
                  style={styles.joinButton}
                  onPress={() => handleJoinSession(session.id)}
                >
                  <Text style={styles.joinButtonText}>セッションに参加</Text>
                </TouchableOpacity>
              )}
              {session.status === 'upcoming' && session.isJoined && (
                <View style={styles.joinedContainer}>
                  <View style={styles.joinedBadge}>
                    <Text style={styles.joinedText}>✓ 参加予定</Text>
                  </View>
                  <TouchableOpacity style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                </View>
              )}
              {session.status === 'completed' && (
                <TouchableOpacity style={styles.reviewButton}>
                  <Text style={styles.reviewButtonText}>録画を見る</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        
        {getFilteredSessions().length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>セッションがありません</Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'upcoming' && '新しいセッションをお待ちください'}
              {activeTab === 'joined' && 'セッションに参加してみましょう'}
              {activeTab === 'completed' && 'セッションに参加して学習しましょう'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sessionCard: {
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
  sessionHeader: {
    marginBottom: 12,
  },
  sessionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  badgeContainer: {
    gap: 4,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sessionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  sessionMeta: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#374151',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#6b7280',
  },
  actionContainer: {
    gap: 8,
  },
  joinButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  liveButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  liveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  joinedContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  joinedBadge: {
    flex: 1,
    backgroundColor: '#dcfce7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinedText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  reviewButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});