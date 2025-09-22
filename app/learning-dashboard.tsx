import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface LearningStats {
  weeklyHours: number;
  completedProjects: number;
  sessionsAttended: number;
  currentStreak: number;
  totalPoints: number;
  level: number;
}

export default function LearningDashboard() {
  const router = useRouter();

  const [stats] = useState<LearningStats>({
    weeklyHours: 12,
    completedProjects: 3,
    sessionsAttended: 5,
    currentStreak: 7,
    totalPoints: 2450,
    level: 8
  });

  const [recentActivities] = useState([
    { id: 1, type: 'project', title: 'React Nativeアプリ開発', time: '2時間前', points: 150 },
    { id: 2, type: 'session', title: 'TypeScript勉強会', time: '1日前', points: 100 },
    { id: 3, type: 'achievement', title: 'コミュニティ貢献賞', time: '2日前', points: 200 },
  ]);

  const [upcomingGoals] = useState([
    { id: 1, title: 'プロジェクト進捗を更新', completed: false },
    { id: 2, title: 'ピア学習セッションに参加', completed: true },
    { id: 3, title: '新しいリソースを確認', completed: false },
  ]);

  return (
    <ScrollView style={styles.container}>
      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>📊 学習統計</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.weeklyHours}</Text>
            <Text style={styles.statLabel}>今週の学習時間</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completedProjects}</Text>
            <Text style={styles.statLabel}>完了プロジェクト</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.sessionsAttended}</Text>
            <Text style={styles.statLabel}>参加セッション</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>連続学習日数</Text>
          </View>
        </View>
      </View>

      {/* Level Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏆 レベル進捗</Text>
        <View style={styles.levelContainer}>
          <Text style={styles.levelText}>レベル {stats.level}</Text>
          <Text style={styles.pointsText}>{stats.totalPoints} ポイント</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '65%' }]} />
        </View>
        <Text style={styles.progressText}>次のレベルまで 550 ポイント</Text>
      </View>

      {/* Today's Goals */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 今日の目標</Text>
        {upcomingGoals.map((goal) => (
          <View key={goal.id} style={styles.goalItem}>
            <View style={[styles.checkbox, goal.completed && styles.checkboxCompleted]}>
              {goal.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.goalText, goal.completed && styles.goalCompleted]}>
              {goal.title}
            </Text>
          </View>
        ))}
      </View>

      {/* Recent Activities */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📈 最近の活動</Text>
        {recentActivities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityEmoji}>
                {activity.type === 'project' ? '🚀' : 
                 activity.type === 'session' ? '👥' : '🏆'}
              </Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
            <View style={styles.activityPoints}>
              <Text style={styles.pointsEarned}>+{activity.points}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚡ クイックアクション</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/projects')}
          >
            <Text style={styles.quickActionText}>新しいプロジェクト</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/peer-sessions')}
          >
            <Text style={styles.quickActionText}>セッション参加</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
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
  card: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  pointsText: {
    fontSize: 16,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  goalCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityPoints: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsEarned: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});