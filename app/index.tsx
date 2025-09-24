import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import AuthGuard from '../components/AuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseConnectionTest } from '../components/SupabaseConnectionTest';
import DevTestUser from '../components/DevTestUser';
import { hasAdminAccess, getRoleDisplayText } from '../utils/permissions';

export default function HomePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  // Get user role for permission checks
  const userRole = user?.user_metadata?.role;

  return (
    <AuthGuard requireAuth={false}>
    <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Peer Learning Hub</Text>
            <Text style={styles.subtitle}>グローバル学習コミュニティへようこそ</Text>
          </View>
          {user ? (
            <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
              <Text style={styles.logoutButtonText}>ログアウト</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
              <Text style={styles.loginButtonText}>ログイン</Text>
            </TouchableOpacity>
          )}
        </View>
        {user && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              ようこそ、{user.user_metadata?.full_name || user.email}さん
            </Text>
            <Text style={styles.roleText}>
              {getRoleDisplayText(userRole)}
            </Text>
          </View>
        )}
        {!user && (
          <Text style={styles.visitorWelcomeText}>
            基本的な学習コンテンツを閲覧できます。すべての機能を利用するにはログインしてください。
          </Text>
        )}
      </View>

      {/* Supabase Connection Test - Remove this after setup is complete */}
      <SupabaseConnectionTest />
      
      {/* Development Test User Component - Remove this in production */}
      {!user && <DevTestUser />}

      {/* Main Content */}
      <View style={styles.content}>
        
        <View style={styles.buttonContainer}>
          {/* 第一フェーズから提供予定の機能 */}
          <Link href="/community" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.buttonIcon}>🌍</Text>
              <Text style={styles.actionButtonText}>グローバルコミュニティ</Text>
              <Text style={styles.buttonDescription}>世界中の学習者やデジタルノマドとつながる</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/search" asChild>
            <TouchableOpacity style={[styles.actionButton, styles.searchButton]}>
              <Text style={styles.buttonIcon}>🔍</Text>
              <Text style={styles.actionButtonText}>検索・発見</Text>
              <Text style={styles.buttonDescription}>プロジェクト、リソース、宿泊施設を横断検索</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/resources" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.buttonIcon}>📚</Text>
              <Text style={styles.actionButtonText}>リソース・情報</Text>
              <Text style={styles.buttonDescription}>学習リソースなどの有用情報と公式情報へのアクセス</Text>
            </TouchableOpacity>
          </Link>

          {/* 次期フェーズでの提供機能 */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.comingSoonButton]}
            disabled={true}
          >
            <Text style={styles.buttonIcon}>📊</Text>
            <Text style={styles.actionButtonText}>ダッシュボード</Text>
            <Text style={styles.buttonDescription}>ピアラーニングハブでの活動のナビゲーション</Text>
            <Text style={styles.comingSoonText}>🚧 次期フェーズで提供予定</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.comingSoonButton]}
            disabled={true}
          >
            <Text style={styles.buttonIcon}>🚀</Text>
            <Text style={styles.actionButtonText}>プロジェクト</Text>
            <Text style={styles.buttonDescription}>期限付き企画。関連セミナー・イベントへの参加</Text>
            <Text style={styles.comingSoonText}>🚧 次期フェーズで提供予定</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.comingSoonButton]}
            disabled={true}
          >
            <Text style={styles.buttonIcon}>👥</Text>
            <Text style={styles.actionButtonText}>ピア学習セッション</Text>
            <Text style={styles.buttonDescription}>部活動や継続的なコミュニティへの参加</Text>
            <Text style={styles.comingSoonText}>🚧 次期フェーズで提供予定</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.comingSoonButton]}
            disabled={true}
          >
            <Text style={styles.buttonIcon}>🏨</Text>
            <Text style={styles.actionButtonText}>宿泊予約</Text>
            <Text style={styles.buttonDescription}>ピアラーニングハブの公式施設の予約・履歴管理</Text>
            <Text style={styles.comingSoonText}>🚧 次期フェーズで提供予定</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.comingSoonButton]}
            disabled={true}
          >
            <Text style={styles.buttonIcon}>📅</Text>
            <Text style={styles.actionButtonText}>活動履歴・予定管理</Text>
            <Text style={styles.buttonDescription}>ピアラーニングハブでの活動の履歴確認と予約管理</Text>
            <Text style={styles.comingSoonText}>🚧 次期フェーズで提供予定</Text>
          </TouchableOpacity>

          {user && hasAdminAccess(userRole) ? (
            <Link href="/admin" asChild>
              <TouchableOpacity style={[styles.actionButton, styles.adminButton]}>
                <Text style={styles.buttonIcon}>⚙️</Text>
                <Text style={styles.actionButtonText}>管理者ダッシュボード</Text>
                <Text style={styles.buttonDescription}>システム管理とユーザー管理</Text>
              </TouchableOpacity>
            </Link>
          ) : user ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.lockedButton]}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.buttonIcon}>⚙️</Text>
              <Text style={styles.actionButtonText}>管理者ダッシュボード</Text>
              <Text style={styles.buttonDescription}>システム管理とユーザー管理</Text>
              <Text style={styles.lockText}>🔒 管理者権限が必要です</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.lockedButton]}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.buttonIcon}>⚙️</Text>
              <Text style={styles.actionButtonText}>管理者ダッシュボード</Text>
              <Text style={styles.buttonDescription}>システム管理とユーザー管理</Text>
              <Text style={styles.lockText}>🔒 ログインが必要です</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ピアラーニングハブで世界中の学習者・デジタルノマドとつながり、共に成長しましょう！
          </Text>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3b82f6',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    minWidth: 80,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
  },
  roleText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  visitorWelcomeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
  },
  adminButton: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  lockedButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    opacity: 0.7,
  },
  lockText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 4,
  },
  comingSoonButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 2,
    opacity: 0.8,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});