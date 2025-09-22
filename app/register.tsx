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
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('エラー', '必須項目を入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, country);
    setLoading(false);

    if (error) {
      Alert.alert('登録エラー', error.message || '登録に失敗しました');
    } else {
      Alert.alert(
        '登録完了',
        'アカウントが作成されました。メールアドレスの確認をお願いします。',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>新規登録</Text>
          <Text style={styles.subtitle}>アカウントを作成してコミュニティに参加</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>フルネーム *</Text>
            <TextInput
              style={styles.input}
              placeholder="山田太郎"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>メールアドレス *</Text>
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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>国・地域</Text>
            <TextInput
              style={styles.input}
              placeholder="日本"
              value={country}
              onChangeText={setCountry}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>パスワード *</Text>
            <TextInput
              style={styles.input}
              placeholder="6文字以上のパスワード"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>パスワード確認 *</Text>
            <TextInput
              style={styles.input}
              placeholder="パスワードを再入力"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              {loading ? '登録中...' : 'アカウント作成'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            登録することで、利用規約とプライバシーポリシーに同意したものとみなされます。
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>すでにアカウントをお持ちの方</Text>
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.loginButton}>
              <Text style={styles.loginButtonText}>ログイン</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
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
    marginBottom: 16,
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
  registerButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  registerButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});