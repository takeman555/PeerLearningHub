import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      Alert.alert('エラー', error.message || 'パスワードリセットに失敗しました');
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>📧</Text>
          <Text style={styles.successTitle}>メール送信完了</Text>
          <Text style={styles.successMessage}>
            パスワードリセットのリンクを{email}に送信しました。
            メールをご確認ください。
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>ログイン画面に戻る</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>パスワードリセット</Text>
          <Text style={styles.subtitle}>
            登録したメールアドレスを入力してください。
            パスワードリセットのリンクをお送りします。
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>メールアドレス</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.resetButtonText}>
              {loading ? '送信中...' : 'リセットリンクを送信'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.backToLoginButton}>
              <Text style={styles.backToLoginText}>← ログイン画面に戻る</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#f9fafb',
  },
  resetButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  resetButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  backToLoginButton: {
    padding: 12,
  },
  backToLoginText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});