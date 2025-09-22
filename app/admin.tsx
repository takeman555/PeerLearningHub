import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AuthGuard from '../components/AuthGuard';

interface User {
  id: number;
  name: string;
  email: string;
  country: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'moderator' | 'admin';
  totalPoints: number;
  projectsCompleted: number;
  sessionsAttended: number;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalSessions: number;
  totalBookings: number;
  revenue: number;
}

interface Report {
  id: number;
  type: 'user' | 'content' | 'technical';
  title: string;
  description: string;
  reportedBy: string;
  date: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'high' | 'medium' | 'low';
}

export default function Admin() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'content' | 'reports' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const [systemStats] = useState<SystemStats>({
    totalUsers: 1247,
    activeUsers: 892,
    totalProjects: 156,
    totalSessions: 324,
    totalBookings: 89,
    revenue: 2450000
  });

  const [users] = useState<User[]>([
    {
      id: 1,
      name: 'Maria Santos',
      email: 'maria@example.com',
      country: 'ブラジル',
      joinDate: '2023-12-15',
      status: 'active',
      role: 'user',
      totalPoints: 2450,
      projectsCompleted: 8,
      sessionsAttended: 15
    },
    {
      id: 2,
      name: 'Ahmed Hassan',
      email: 'ahmed@example.com',
      country: 'エジプト',
      joinDate: '2023-11-20',
      status: 'active',
      role: 'moderator',
      totalPoints: 3200,
      projectsCompleted: 12,
      sessionsAttended: 22
    },
    {
      id: 3,
      name: 'Sophie Chen',
      email: 'sophie@example.com',
      country: 'フランス',
      joinDate: '2024-01-05',
      status: 'inactive',
      role: 'user',
      totalPoints: 850,
      projectsCompleted: 3,
      sessionsAttended: 7
    },
    {
      id: 4,
      name: 'Raj Patel',
      email: 'raj@example.com',
      country: 'インド',
      joinDate: '2023-10-10',
      status: 'suspended',
      role: 'user',
      totalPoints: 1200,
      projectsCompleted: 5,
      sessionsAttended: 10
    }
  ]);

  const [reports] = useState<Report[]>([
    {
      id: 1,
      type: 'user',
      title: '不適切なコメント報告',
      description: 'ユーザーがコミュニティフィードで不適切な言葉を使用しています。',
      reportedBy: 'user123',
      date: '2024-01-14',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 2,
      type: 'technical',
      title: 'アプリクラッシュ報告',
      description: 'プロジェクト画面でアプリがクラッシュする問題が報告されています。',
      reportedBy: 'user456',
      date: '2024-01-13',
      status: 'investigating',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'content',
      title: 'スパムコンテンツ',
      description: 'リソース投稿にスパム的な内容が含まれています。',
      reportedBy: 'user789',
      date: '2024-01-12',
      status: 'resolved',
      priority: 'low'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'inactive': return '#f59e0b';
      case 'suspended': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'investigating': return '#3b82f6';
      case 'resolved': return '#22c55e';
      case 'dismissed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'アクティブ';
      case 'inactive': return '非アクティブ';
      case 'suspended': return '停止中';
      case 'pending': return '保留中';
      case 'investigating': return '調査中';
      case 'resolved': return '解決済み';
      case 'dismissed': return '却下';
      default: return status;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'user': return 'ユーザー';
      case 'moderator': return 'モデレーター';
      case 'admin': return '管理者';
      default: return role;
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

  const getReportTypeText = (type: string) => {
    switch (type) {
      case 'user': return 'ユーザー';
      case 'content': return 'コンテンツ';
      case 'technical': return '技術的';
      default: return type;
    }
  };

  const filteredUsers = searchQuery.trim() 
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const handleUserAction = (userId: number, action: string) => {
    Alert.alert(
      '確認',
      `ユーザーID ${userId} に対して「${action}」を実行しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '実行', onPress: () => console.log(`${action} user ${userId}`) }
      ]
    );
  };

  const handleReportAction = (reportId: number, action: string) => {
    Alert.alert(
      '確認',
      `レポートID ${reportId} を「${action}」しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '実行', onPress: () => console.log(`${action} report ${reportId}`) }
      ]
    );
  };

  const renderDashboard = () => (
    <ScrollView style={styles.tabContent}>
      {/* System Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>📊 システム統計</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{systemStats.totalUsers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>総ユーザー数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{systemStats.activeUsers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>アクティブユーザー</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{systemStats.totalProjects}</Text>
            <Text style={styles.statLabel}>総プロジェクト数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{systemStats.totalSessions}</Text>
            <Text style={styles.statLabel}>総セッション数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{systemStats.totalBookings}</Text>
            <Text style={styles.statLabel}>総予約数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>¥{systemStats.revenue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>総収益</Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>📈 最近の活動</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>👤</Text>
            <View style={styles.activityDetails}>
              <Text style={styles.activityText}>新規ユーザー登録: Elena Rodriguez</Text>
              <Text style={styles.activityTime}>5分前</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>🚀</Text>
            <View style={styles.activityDetails}>
              <Text style={styles.activityText}>新しいプロジェクトが作成されました</Text>
              <Text style={styles.activityTime}>15分前</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>⚠️</Text>
            <View style={styles.activityDetails}>
              <Text style={styles.activityText}>新しい報告が提出されました</Text>
              <Text style={styles.activityTime}>30分前</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>⚡ クイックアクション</Text>
        <View style={styles.quickActionButtons}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>📢</Text>
            <Text style={styles.quickActionText}>お知らせ作成</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>🔧</Text>
            <Text style={styles.quickActionText}>メンテナンス</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionText}>レポート生成</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>🛡️</Text>
            <Text style={styles.quickActionText}>セキュリティ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderUsers = () => (
    <ScrollView style={styles.tabContent}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="ユーザーを検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Users List */}
      <View style={styles.usersContainer}>
        <Text style={styles.sectionTitle}>👥 ユーザー管理</Text>
        
        {filteredUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userCountry}>📍 {user.country}</Text>
              </View>
              <View style={styles.userMeta}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(user.status) }]}>
                    {getStatusText(user.status)}
                  </Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{getRoleText(user.role)}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.userStats}>
              <View style={styles.userStat}>
                <Text style={styles.userStatNumber}>{user.totalPoints}</Text>
                <Text style={styles.userStatLabel}>ポイント</Text>
              </View>
              <View style={styles.userStat}>
                <Text style={styles.userStatNumber}>{user.projectsCompleted}</Text>
                <Text style={styles.userStatLabel}>プロジェクト</Text>
              </View>
              <View style={styles.userStat}>
                <Text style={styles.userStatNumber}>{user.sessionsAttended}</Text>
                <Text style={styles.userStatLabel}>セッション</Text>
              </View>
            </View>
            
            <Text style={styles.joinDate}>参加日: {user.joinDate}</Text>
            
            <View style={styles.userActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleUserAction(user.id, 'メッセージ送信')}
              >
                <Text style={styles.actionButtonText}>メッセージ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.warningButton]}
                onPress={() => handleUserAction(user.id, '警告')}
              >
                <Text style={styles.warningButtonText}>警告</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.dangerButton]}
                onPress={() => handleUserAction(user.id, '停止')}
              >
                <Text style={styles.dangerButtonText}>停止</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderReports = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.reportsContainer}>
        <Text style={styles.sectionTitle}>⚠️ 報告・問題管理</Text>
        
        {reports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportType}>{getReportTypeText(report.type)}</Text>
                <Text style={styles.reportDate}>{report.date} - {report.reportedBy}</Text>
              </View>
              <View style={styles.reportMeta}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(report.priority) + '20' }]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(report.priority) }]}>
                    {report.priority === 'high' ? '高' : report.priority === 'medium' ? '中' : '低'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                    {getStatusText(report.status)}
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.reportDescription}>{report.description}</Text>
            
            <View style={styles.reportActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleReportAction(report.id, '調査開始')}
              >
                <Text style={styles.actionButtonText}>調査</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.successButton]}
                onPress={() => handleReportAction(report.id, '解決')}
              >
                <Text style={styles.successButtonText}>解決</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.warningButton]}
                onPress={() => handleReportAction(report.id, '却下')}
              >
                <Text style={styles.warningButtonText}>却下</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>⚙️ システム設定</Text>
        
        <View style={styles.settingSection}>
          <Text style={styles.settingSectionTitle}>一般設定</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>アプリケーション設定</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>通知設定</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>セキュリティ設定</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingSection}>
          <Text style={styles.settingSectionTitle}>コンテンツ管理</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>プロジェクト管理</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>セッション管理</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>リソース管理</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingSection}>
          <Text style={styles.settingSectionTitle}>システム</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>データベース管理</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>バックアップ設定</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>ログ管理</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <AuthGuard>
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabButtons}>
            {[
              { key: 'dashboard', label: 'ダッシュボード' },
              { key: 'users', label: 'ユーザー' },
              { key: 'content', label: 'コンテンツ' },
              { key: 'reports', label: '報告' },
              { key: 'settings', label: '設定' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.activeTab
                ]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'settings' && renderSettings()}
    </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabContainer: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tabButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: 'white',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  // Stats Styles
  statsContainer: {
    marginBottom: 24,
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
    minWidth: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Activity Styles
  activityContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Quick Actions
  quickActionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  // Search Styles
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#6b7280',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  // User Styles
  usersContainer: {
    gap: 16,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  userCountry: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  userMeta: {
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
  roleBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    color: '#374151',
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  userStat: {
    alignItems: 'center',
  },
  userStatNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  userStatLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  joinDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 12,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  warningButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  warningButtonText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  dangerButtonText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  successButtonText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  // Report Styles
  reportsContainer: {
    gap: 16,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  reportType: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  reportDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  reportMeta: {
    alignItems: 'flex-end',
    gap: 4,
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
  reportDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  // Settings Styles
  settingsContainer: {
    gap: 24,
  },
  settingSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingText: {
    fontSize: 14,
    color: '#374151',
  },
  settingArrow: {
    fontSize: 18,
    color: '#9ca3af',
  },
});