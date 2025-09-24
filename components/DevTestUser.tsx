import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

/**
 * Development Test User Component
 * 
 * This component helps create and login with test users during development
 * when email confirmation is causing issues.
 */
export default function DevTestUser() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const testUsers = [
    // Regular Members
    {
      email: 'member1@example.com',
      password: 'password123',
      fullName: '田中 太郎',
      country: 'Japan',
      role: 'メンバー',
      icon: '👨‍🎓'
    },
    {
      email: 'member2@example.com', 
      password: 'password123',
      fullName: 'Sarah Johnson',
      country: 'USA',
      role: 'メンバー',
      icon: '👩‍💼'
    },
    {
      email: 'member3@example.com',
      password: 'password123',
      fullName: 'Kim Min-jun',
      country: 'South Korea',
      role: 'メンバー',
      icon: '👨‍💻'
    },
    // Administrators
    {
      email: 'admin@peerlearning.com',
      password: 'admin123',
      fullName: '管理者 一郎',
      country: 'Japan',
      role: '管理者',
      icon: '👨‍💼'
    },
    {
      email: 'tizuka0@gmail.com',
      password: 'password123',
      fullName: 'Tizuka Admin',
      country: 'Japan',
      role: '管理者',
      icon: '⚙️'
    },
    {
      email: 'dev@peerlearning.com',
      password: 'devpassword123',
      fullName: 'Developer User',
      country: 'Japan',
      role: 'スーパー管理者',
      icon: '🔧'
    }
  ];

  const createAndLoginTestUser = async (user: typeof testUsers[0]) => {
    setLoading(true);
    try {
      // Check if we're using mock auth
      const USE_MOCK_AUTH = process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                           process.env.NODE_ENV === 'test' ||
                           !process.env.EXPO_PUBLIC_SUPABASE_URL ||
                           !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('Logging in with test user:', user.email);
      const signInResult = await signIn(user.email, user.password);
      
      if (signInResult.error) {
        Alert.alert('エラー', `ログインに失敗しました: ${signInResult.error.message}`);
      } else {
        const authMode = USE_MOCK_AUTH ? '（モック認証）' : '（実際のデータベース）';
        Alert.alert('成功', `${user.email} でログインしました！${authMode}`);
      }
    } catch (error) {
      console.error('Test user login error:', error);
      Alert.alert('エラー', 'テストユーザーのログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const tryLoginExistingUser = async () => {
    setLoading(true);
    try {
      // Try to login with the original user using mock auth
      console.log('Attempting login with tizuka0@gmail.com');
      const result = await signIn('tizuka0@gmail.com', 'password123');
      
      if (result.error) {
        Alert.alert(
          'ログイン失敗', 
          `tizuka0@gmail.com でのログインに失敗しました。\n\nエラー: ${result.error.message}\n\nモック認証を使用しています。事前定義されたテストユーザーを試してください。`
        );
      } else {
        Alert.alert('成功', 'tizuka0@gmail.com でログインしました！（モック認証）');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('エラー', 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>開発用テストユーザー</Text>
      <Text style={styles.subtitle}>
        メール確認の問題を回避するためのテストユーザーです
      </Text>

      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={tryLoginExistingUser}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? 'ログイン中...' : 'tizuka0@gmail.com でログイン試行'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>👥 メンバーユーザー:</Text>
      {testUsers.filter(user => user.role === 'メンバー').map((user, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.testButton, styles.memberButton]}
          onPress={() => createAndLoginTestUser(user)}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>
            {user.icon} {loading ? '処理中...' : `${user.fullName} (${user.role})`}
          </Text>
          <Text style={styles.emailText}>{user.email}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>⚙️ 管理者ユーザー:</Text>
      {testUsers.filter(user => user.role === '管理者' || user.role === 'スーパー管理者').map((user, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.testButton, styles.adminButton]}
          onPress={() => createAndLoginTestUser(user)}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>
            {user.icon} {loading ? '処理中...' : `${user.fullName} (${user.role})`}
          </Text>
          <Text style={styles.emailText}>{user.email}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 ヒント</Text>
        <Text style={styles.infoText}>
          • メンバー: 一般的な学習者ユーザー{'\n'}
          • 管理者: システム管理権限あり{'\n'}
          • スーパー管理者: 開発者権限{'\n'}
          • メール確認は不要です
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.helpButton}
        onPress={() => Alert.alert(
          'Supabase設定ヘルプ',
          '1. Supabaseダッシュボードを開く\n2. Authentication → Settings\n3. "Enable email confirmations" をOFFにする\n4. "Save"をクリック\n\nこれで新規ユーザーは即座にログインできます。'
        )}
      >
        <Text style={styles.helpButtonText}>Supabase設定ヘルプ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  memberButton: {
    backgroundColor: '#10b981',
  },
  adminButton: {
    backgroundColor: '#f59e0b',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emailText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  helpButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  helpButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
  },
});