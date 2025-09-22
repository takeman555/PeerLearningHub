import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function HomePage() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Peer Learning Hub</Text>
        <Text style={styles.subtitle}>グローバル学習コミュニティへようこそ</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        
        <View style={styles.buttonContainer}>
          <Link href="/learning-dashboard" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.buttonIcon}>📊</Text>
              <Text style={styles.actionButtonText}>ダッシュボード</Text>
              <Text style={styles.buttonDescription}>ピアラーニングハブでの活動のナビゲーション</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/projects" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.buttonIcon}>🚀</Text>
              <Text style={styles.actionButtonText}>プロジェクト</Text>
              <Text style={styles.buttonDescription}>期限付き企画。関連セミナー・イベントへの参加</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/peer-sessions" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.buttonIcon}>👥</Text>
              <Text style={styles.actionButtonText}>ピア学習セッション</Text>
              <Text style={styles.buttonDescription}>部活動や継続的なコミュニティへの参加</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/community" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.buttonIcon}>🌍</Text>
              <Text style={styles.actionButtonText}>グローバルコミュニティ</Text>
              <Text style={styles.buttonDescription}>世界中の学習者やデジタルノマドとつながる</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/accommodation" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.buttonIcon}>🏨</Text>
              <Text style={styles.actionButtonText}>宿泊予約</Text>
              <Text style={styles.buttonDescription}>ピアラーニングハブの公式施設の予約・履歴管理</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/activity" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.buttonIcon}>📅</Text>
              <Text style={styles.actionButtonText}>活動履歴・予定管理</Text>
              <Text style={styles.buttonDescription}>ピアラーニングハブでの活動の履歴確認と予約管理</Text>
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

          <Link href="/admin" asChild>
            <TouchableOpacity style={[styles.actionButton, styles.adminButton]}>
              <Text style={styles.buttonIcon}>⚙️</Text>
              <Text style={styles.actionButtonText}>管理者ダッシュボード</Text>
              <Text style={styles.buttonDescription}>システム管理とユーザー管理</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ピアラーニングハブで世界中の学習者・デジタルノマドとつながり、共に成長しましょう！
          </Text>
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
  header: {
    backgroundColor: '#3b82f6',
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
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