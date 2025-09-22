import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
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
      </Stack>
      <StatusBar style="light" />
    </AuthProvider>
  );
}