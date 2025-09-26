import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { MembershipProvider } from '../contexts/MembershipContext';
import AppStartupOptimizer from '../services/appStartupOptimizer';

// 最適化されたスプラッシュ画面コンポーネント
function OptimizedSplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const optimizer = AppStartupOptimizer.getInstance();
    const splashConfig = optimizer.optimizeSplashScreen();
    
    // プログレス表示のシミュレーション
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 100); // 少し遅延してスムーズに遷移
          return 100;
        }
        return prev + 10;
      });
    }, splashConfig.minDisplayTime / 10);

    // 最大表示時間でタイムアウト
    const timeoutId = setTimeout(() => {
      clearInterval(progressInterval);
      onComplete();
    }, splashConfig.maxDisplayTime);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
    };
  }, [onComplete]);

  return (
    <View style={splashStyles.container}>
      <Text style={splashStyles.title}>Peer Learning Hub</Text>
      <Text style={splashStyles.subtitle}>グローバル学習コミュニティ</Text>
      <View style={splashStyles.progressContainer}>
        <View style={[splashStyles.progressBar, { width: `${progress}%` }]} />
      </View>
      <Text style={splashStyles.loadingText}>読み込み中... {progress}%</Text>
    </View>
  );
}

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [optimizer] = useState(() => AppStartupOptimizer.getInstance());

  useEffect(() => {
    // アプリ起動の最適化を開始
    optimizer.markStartupStart();
    optimizer.markInitializationStart();

    const initializeApp = async () => {
      try {
        // 重要でないサービスの遅延初期化
        await optimizer.deferNonCriticalServices();
        
        // 初期化完了をマーク
        optimizer.markInitializationEnd();
        
        console.log('🚀 App initialization completed');
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initializeApp();
  }, [optimizer]);

  const handleSplashComplete = async () => {
    optimizer.markContextLoadStart();
    
    // コンテキストの読み込み完了後にアプリを表示
    setTimeout(async () => {
      optimizer.markContextLoadEnd();
      optimizer.markFirstRenderStart();
      
      setIsAppReady(true);
      
      // 最初のレンダリング完了後にインタラクティブ状態をマーク
      setTimeout(async () => {
        optimizer.markFirstRenderEnd();
        await optimizer.markTimeToInteractive();
      }, 100);
    }, 200); // コンテキスト読み込みのシミュレーション
  };

  if (!isAppReady) {
    return <OptimizedSplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <AuthProvider>
      <MembershipProvider>
        <Stack
        screenOptions={{
          headerStyle: { 
            backgroundColor: '#3b82f6',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: { 
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Peer Learning Hub',
          }} 
        />
        <Stack.Screen 
          name="learning-dashboard" 
          options={{ 
            title: '学習ダッシュボード',
          }} 
        />
        <Stack.Screen 
          name="projects" 
          options={{ 
            title: 'プロジェクト',
          }} 
        />
        <Stack.Screen 
          name="peer-sessions" 
          options={{ 
            title: 'ピア学習セッション',
          }} 
        />
        <Stack.Screen 
          name="community" 
          options={{ 
            title: 'グローバルコミュニティ',
          }} 
        />
        <Stack.Screen 
          name="accommodation" 
          options={{ 
            title: '宿泊予約',
          }} 
        />
        <Stack.Screen 
          name="activity" 
          options={{ 
            title: '活動履歴・予定管理',
          }} 
        />
        <Stack.Screen 
          name="search" 
          options={{ 
            title: '検索・発見',
          }} 
        />
        <Stack.Screen 
          name="resources" 
          options={{ 
            title: 'リソース・情報',
          }} 
        />
        <Stack.Screen 
          name="admin" 
          options={{ 
            title: '管理者ダッシュボード',
            headerStyle: { backgroundColor: '#dc2626' },
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{ 
            title: 'ログイン',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="register" 
          options={{ 
            title: '新規登録',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="forgot-password" 
          options={{ 
            title: 'パスワードリセット',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="membership" 
          options={{ 
            title: 'メンバーシップ',
            presentation: 'modal',
          }} 
        />
      </Stack>
      <StatusBar style="light" />
      </MembershipProvider>
    </AuthProvider>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
    textAlign: 'center',
  },
  progressContainer: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});