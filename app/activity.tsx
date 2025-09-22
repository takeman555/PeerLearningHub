import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

interface Activity {
  id: number;
  type: 'project' | 'session' | 'booking' | 'achievement' | 'study';
  title: string;
  description: string;
  date: string;
  time: string;
  status: 'completed' | 'upcoming' | 'in-progress' | 'cancelled';
  points?: number;
  location?: string;
  participants?: number;
}

interface Schedule {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'session' | 'project' | 'personal' | 'booking';
  reminder: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function Activity() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'history' | 'schedule' | 'analytics'>('history');
  const [filterType, setFilterType] = useState<'all' | 'project' | 'session' | 'booking' | 'achievement'>('all');
  
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');

  const [activities] = useState<Activity[]>([
    {
      id: 1,
      type: 'project',
      title: 'React Nativeプロジェクト完了',
      description: 'モバイルアプリケーション開発プロジェクトを完了しました。TypeScriptとExpoを使用してクロスプラットフォーム対応のアプリを構築。',
      date: '2024-01-14',
      time: '15:30',
      status: 'completed',
      points: 150,
      participants: 12
    },
    {
      id: 2,
      type: 'session',
      title: 'TypeScript勉強会参加',
      description: 'TypeScriptの基本的な型システムから実践的な活用方法まで学習しました。',
      date: '2024-01-13',
      time: '19:00',
      status: 'completed',
      points: 100,
      participants: 15
    },
    {
      id: 3,
      type: 'booking',
      title: 'Tokyo Learning Hub Hotel予約',
      description: '東京での学習リトリートのためにホテルを予約しました。',
      date: '2024-01-12',
      time: '10:15',
      status: 'completed',
      location: '東京, 日本'
    },
    {
      id: 4,
      type: 'achievement',
      title: 'コミュニティ貢献賞受賞',
      description: 'アクティブなコミュニティ参加と知識共有により表彰されました。',
      date: '2024-01-11',
      time: '14:00',
      status: 'completed',
      points: 200
    },
    {
      id: 5,
      type: 'session',
      title: 'AI・機械学習セッション',
      description: 'Pythonを使用した機械学習の基礎について学習予定です。',
      date: '2024-01-16',
      time: '20:00',
      status: 'upcoming',
      participants: 8
    },
    {
      id: 6,
      type: 'study',
      title: '個人学習セッション',
      description: 'Web3開発について自習を行いました。スマートコントラクトの概念を理解。',
      date: '2024-01-10',
      time: '09:00',
      status: 'completed',
      points: 50
    }
  ]);

  const [schedules] = useState<Schedule[]>([
    {
      id: 1,
      title: 'React Hooks勉強会',
      description: 'useEffect、useState、カスタムフックの実践的な使い方を学習',
      date: '2024-01-15',
      time: '19:00',
      type: 'session',
      reminder: true,
      priority: 'high'
    },
    {
      id: 2,
      title: 'プロジェクト進捗レビュー',
      description: 'モバイルアプリ開発プロジェクトの進捗確認と次のステップ計画',
      date: '2024-01-16',
      time: '14:00',
      type: 'project',
      reminder: true,
      priority: 'medium'
    },
    {
      id: 3,
      title: 'バリリトリート出発',
      description: 'Bali Digital Nomad Retreatへの出発日',
      date: '2024-01-20',
      time: '08:00',
      type: 'booking',
      reminder: true,
      priority: 'high'
    },
    {
      id: 4,
      title: '個人学習時間',
      description: 'TypeScriptの復習と新しい概念の学習',
      date: '2024-01-17',
      time: '10:00',
      type: 'personal',
      reminder: false,
      priority: 'low'
    }
  ]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project': return '🚀';
      case 'session': return '👥';
      case 'booking': return '🏨';
      case 'achievement': return '🏆';
      case 'study': return '📚';
      default: return '📝';
    }
  };

  const getActivityTypeText = (type: string) => {
    switch (type) {
      case 'project': return 'プロジェクト';
      case 'session': return 'セッション';
      case 'booking': return '予約';
      case 'achievement': return '実績';
      case 'study': return '学習';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'upcoming': return '#3b82f6';
      case 'in-progress': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '完了';
      case 'upcoming': return '予定';
      case 'in-progress': return '進行中';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  const filteredActivities = filterType === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === filterType);

  const handleAddSchedule = () => {
    if (newScheduleTitle.trim() && newScheduleDate && newScheduleTime) {
      console.log('New schedule:', { 
        title: newScheduleTitle, 
        date: newScheduleDate, 
        time: newScheduleTime 
      });
      setNewScheduleTitle('');
      setNewScheduleDate('');
      setNewScheduleTime('');
    }
  };

  const renderHistory = () => (
    <ScrollView style={styles.tabContent}>
      {/* Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>📊 活動履歴</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterButtons}>
            {[
              { key: 'all', label: 'すべて' },
              { key: 'project', label: 'プロジェクト' },
              { key: 'session', label: 'セッション' },
              { key: 'booking', label: '予約' },
              { key: 'achievement', label: '実績' }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  filterType === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setFilterType(filter.key as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterType === filter.key && styles.filterButtonTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Activities */}
      <View style={styles.activitiesContainer}>
        {filteredActivities.map((activity) => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <View style={styles.activityInfo}>
                <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityType}>{getActivityTypeText(activity.type)}</Text>
                  <Text style={styles.activityDateTime}>
                    {activity.date} {activity.time}
                  </Text>
                </View>
              </View>
              <View style={styles.activityMeta}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activity.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(activity.status) }]}>
                    {getStatusText(activity.status)}
                  </Text>
                </View>
                {activity.points && (
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>+{activity.points}pt</Text>
                  </View>
                )}
              </View>
            </View>
            
            <Text style={styles.activityDescription}>{activity.description}</Text>
            
            {/* Additional Info */}
            <View style={styles.activityFooter}>
              {activity.location && (
                <Text style={styles.activityLocation}>📍 {activity.location}</Text>
              )}
              {activity.participants && (
                <Text style={styles.activityParticipants}>👥 {activity.participants}名参加</Text>
              )}
            </View>
          </View>
        ))}
        
        {filteredActivities.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>活動履歴がありません</Text>
            <Text style={styles.emptySubtext}>プロジェクトやセッションに参加してみましょう</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderSchedule = () => (
    <ScrollView style={styles.tabContent}>
      {/* Add New Schedule */}
      <View style={styles.addScheduleContainer}>
        <Text style={styles.addScheduleTitle}>📅 新しい予定を追加</Text>
        
        <View style={styles.scheduleForm}>
          <TextInput
            style={styles.scheduleInput}
            placeholder="予定のタイトル"
            value={newScheduleTitle}
            onChangeText={setNewScheduleTitle}
          />
          <View style={styles.scheduleRow}>
            <TextInput
              style={[styles.scheduleInput, { flex: 1, marginRight: 8 }]}
              placeholder="日付 (YYYY-MM-DD)"
              value={newScheduleDate}
              onChangeText={setNewScheduleDate}
            />
            <TextInput
              style={[styles.scheduleInput, { flex: 1, marginLeft: 8 }]}
              placeholder="時間 (HH:MM)"
              value={newScheduleTime}
              onChangeText={setNewScheduleTime}
            />
          </View>
          <TouchableOpacity 
            style={[
              styles.addScheduleButton,
              (!newScheduleTitle.trim() || !newScheduleDate || !newScheduleTime) && styles.addScheduleButtonDisabled
            ]}
            onPress={handleAddSchedule}
            disabled={!newScheduleTitle.trim() || !newScheduleDate || !newScheduleTime}
          >
            <Text style={styles.addScheduleButtonText}>予定を追加</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Schedules */}
      <View style={styles.schedulesContainer}>
        <Text style={styles.schedulesTitle}>📋 今後の予定</Text>
        
        {schedules.map((schedule) => (
          <View key={schedule.id} style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                <Text style={styles.scheduleDateTime}>
                  {schedule.date} {schedule.time}
                </Text>
                <Text style={styles.scheduleDescription}>{schedule.description}</Text>
              </View>
              <View style={styles.scheduleMeta}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(schedule.priority) + '20' }]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(schedule.priority) }]}>
                    優先度: {getPriorityText(schedule.priority)}
                  </Text>
                </View>
                {schedule.reminder && (
                  <View style={styles.reminderBadge}>
                    <Text style={styles.reminderText}>🔔 リマインダー</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.scheduleActions}>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>編集</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>削除</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        {schedules.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>予定がありません</Text>
            <Text style={styles.emptySubtext}>新しい予定を追加してみましょう</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.analyticsContainer}>
        <Text style={styles.analyticsTitle}>📈 学習分析</Text>
        
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>今月の活動</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>650</Text>
            <Text style={styles.statLabel}>獲得ポイント</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>完了プロジェクト</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>参加セッション</Text>
          </View>
        </View>
        
        {/* Activity Breakdown */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>📊 活動内訳</Text>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownIcon}>🚀</Text>
              <Text style={styles.breakdownLabel}>プロジェクト</Text>
            </View>
            <View style={styles.breakdownBar}>
              <View style={[styles.breakdownFill, { width: '60%', backgroundColor: '#3b82f6' }]} />
            </View>
            <Text style={styles.breakdownValue}>60%</Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownIcon}>👥</Text>
              <Text style={styles.breakdownLabel}>セッション</Text>
            </View>
            <View style={styles.breakdownBar}>
              <View style={[styles.breakdownFill, { width: '25%', backgroundColor: '#10b981' }]} />
            </View>
            <Text style={styles.breakdownValue}>25%</Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownIcon}>📚</Text>
              <Text style={styles.breakdownLabel}>個人学習</Text>
            </View>
            <View style={styles.breakdownBar}>
              <View style={[styles.breakdownFill, { width: '15%', backgroundColor: '#f59e0b' }]} />
            </View>
            <Text style={styles.breakdownValue}>15%</Text>
          </View>
        </View>
        
        {/* Weekly Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>📅 週間進捗</Text>
          <Text style={styles.progressSubtitle}>今週の学習時間: 18時間</Text>
          
          <View style={styles.weeklyChart}>
            {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => (
              <View key={day} style={styles.dayColumn}>
                <View style={styles.dayBar}>
                  <View 
                    style={[
                      styles.dayBarFill, 
                      { height: `${[80, 60, 90, 70, 85, 40, 30][index]}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            履歴
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedule' && styles.activeTab]}
          onPress={() => setActiveTab('schedule')}
        >
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>
            予定管理
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            分析
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'schedule' && renderSchedule()}
      {activeTab === 'analytics' && renderAnalytics()}
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
  tabContent: {
    flex: 1,
    padding: 20,
  },
  // Filter Styles
  filterContainer: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  // Activity Styles
  activitiesContainer: {
    gap: 16,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  activityType: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  activityDateTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  activityMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pointsBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
  },
  activityDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityLocation: {
    fontSize: 11,
    color: '#6b7280',
  },
  activityParticipants: {
    fontSize: 11,
    color: '#6b7280',
  },
  // Schedule Styles
  addScheduleContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addScheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  scheduleForm: {
    gap: 12,
  },
  scheduleInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
  },
  scheduleRow: {
    flexDirection: 'row',
  },
  addScheduleButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addScheduleButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addScheduleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  schedulesContainer: {
    gap: 16,
  },
  schedulesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  scheduleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleHeader: {
    marginBottom: 12,
  },
  scheduleInfo: {
    marginBottom: 8,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scheduleDateTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#374151',
    marginTop: 6,
  },
  scheduleMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reminderBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  reminderText: {
    fontSize: 10,
    color: '#d97706',
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  editButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  // Analytics Styles
  analyticsContainer: {
    gap: 20,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  breakdownContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  breakdownIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#374151',
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    width: 30,
    textAlign: 'right',
  },
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayBar: {
    width: 20,
    height: 80,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  dayBarFill: {
    width: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 10,
  },
  dayLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  // Empty State
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
});