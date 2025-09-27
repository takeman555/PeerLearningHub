import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import AuthGuard from '../components/AuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseConnectionTest } from '../components/SupabaseConnectionTest';
import DevTestUser from '../components/DevTestUser';
import { hasAdminAccess, getRoleDisplayText, canAccessNextPhaseFeatures } from '../utils/permissions';
import { getAvailableFeatures, getFeatureStatusText, getFeatureButtonStyle } from '../config/phases';
import { useOptimizedNavigation } from '../hooks/useOptimizedNavigation';
import OptimizedButton from '../components/OptimizedButton';
import OptimizedScrollView from '../components/OptimizedScrollView';

export default function HomePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { push: navigateOptimized } = useOptimizedNavigation({
    enablePreloading: true,
    enableMetrics: true,
    preloadRoutes: ['/community', '/search', '/resources'],
  });
  
  // Get user role for permission checks
  const userRole = user?.user_metadata?.role;
  
  // Get available features based on user role
  const availableFeatures = getAvailableFeatures(userRole);

  return (
    <AuthGuard requireAuth={false}>
    <SafeAreaView style={styles.safeArea}>
    <OptimizedScrollView 
      style={styles.container}
      enablePerformanceMonitoring={true}
      throttleScrollEvents={true}
    >
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
            <OptimizedButton
              title="ログイン"
              onPress={() => navigateOptimized('/login')}
              variant="primary"
              size="medium"
            />
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

      {/* Development Components */}
      {/* Supabase Connection Test - Super Admin only */}
      {canAccessNextPhaseFeatures(userRole) && <SupabaseConnectionTest />}
      
      {/* Development Test User Component - Always show when not logged in for development */}
      {!user && <DevTestUser />}

      {/* Main Content */}
      <View style={styles.content}>
        
        <View style={styles.buttonContainer}>
          {/* Dynamic feature rendering based on user role and phase configuration */}
          {availableFeatures.map((feature) => {
            const statusText = getFeatureStatusText(feature);
            const buttonStyleType = getFeatureButtonStyle(feature);
            
            // Get appropriate button style
            let buttonStyle = [styles.actionButton];
            if (buttonStyleType === 'development') {
              buttonStyle.push(styles.nextPhaseButton);
            } else if (buttonStyleType === 'coming_soon') {
              buttonStyle.push(styles.comingSoonButton);
            } else if (feature.id === 'search') {
              buttonStyle.push(styles.searchButton);
            } else if (feature.id === 'admin') {
              buttonStyle.push(styles.adminButton);
            }
            
            return (
              <Link key={feature.id} href={feature.route} asChild>
                <TouchableOpacity style={buttonStyle}>
                  <Text style={styles.buttonIcon}>{feature.icon}</Text>
                  <Text style={styles.actionButtonText}>{feature.name}</Text>
                  <Text style={styles.buttonDescription}>{feature.description}</Text>
                  {statusText && (
                    <Text style={
                      buttonStyleType === 'development' ? styles.nextPhaseText :
                      buttonStyleType === 'coming_soon' ? styles.comingSoonText :
                      styles.nextPhaseText
                    }>
                      {statusText}
                    </Text>
                  )}
                </TouchableOpacity>
              </Link>
            );
          })}
        </View>

        {/* Premium Features Section */}
        {user && (
          <View style={styles.premiumSection}>
            <Text style={styles.premiumTitle}>🌟 プレミアム機能</Text>
            <Text style={styles.premiumDescription}>
              すべての機能を解放して、学習体験を最大化しましょう
            </Text>
            <Link href="/membership" asChild>
              <TouchableOpacity style={styles.premiumButton}>
                <Text style={styles.premiumButtonIcon}>👑</Text>
                <Text style={styles.premiumButtonText}>プレミアムにアップグレード</Text>
                <Text style={styles.premiumButtonSubtext}>
                  無制限アクセス・優先サポート・特別コンテンツ
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}



        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ピアラーニングハブで世界中の学習者・デジタルノマドとつながり、共に成長しましょう！
          </Text>
          <Text style={styles.versionText}>
            Version {process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0'}
          </Text>
        </View>
      </View>
    </OptimizedScrollView>
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
  nextPhaseButton: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
    borderWidth: 2,
  },
  nextPhaseText: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  premiumSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fef7cd',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 8,
  },
  premiumDescription: {
    fontSize: 14,
    color: '#78350f',
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumButton: {
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  premiumButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  premiumButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  premiumButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
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
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});