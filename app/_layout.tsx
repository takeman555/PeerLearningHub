import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
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
      </Stack>
      <StatusBar style="light" />
    </>
  );
}