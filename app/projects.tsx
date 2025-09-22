import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface Project {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  participants: number;
  maxParticipants: number;
  tags: string[];
  progress?: number;
  status: 'available' | 'joined' | 'completed';
}

export default function Projects() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'available' | 'joined' | 'completed'>('available');

  const [projects] = useState<Project[]>([
    {
      id: 1,
      title: 'React Native アプリ開発',
      description: 'モバイルアプリケーション開発の基礎を学び、実際にアプリを作成します。TypeScriptとExpoを使用して、クロスプラットフォーム対応のアプリを構築しましょう。',
      difficulty: 'intermediate',
      duration: '4週間',
      participants: 12,
      maxParticipants: 15,
      tags: ['React Native', 'TypeScript', 'Mobile'],
      status: 'available'
    },
    {
      id: 2,
      title: 'Web開発プロジェクト',
      description: 'HTML、CSS、JavaScriptを使用してレスポンシブなWebサイトを構築します。モダンなフロントエンド技術を学習できます。',
      difficulty: 'beginner',
      duration: '3週間',
      participants: 8,
      maxParticipants: 12,
      tags: ['HTML', 'CSS', 'JavaScript'],
      status: 'joined',
      progress: 65
    },
    {
      id: 3,
      title: 'AI・機械学習入門',
      description: 'Pythonを使用して機械学習の基礎を学び、簡単なAIモデルを作成します。データサイエンスの世界への第一歩です。',
      difficulty: 'advanced',
      duration: '6週間',
      participants: 6,
      maxParticipants: 10,
      tags: ['Python', 'AI', 'Machine Learning'],
      status: 'available'
    },
    {
      id: 4,
      title: 'ブロックチェーン開発',
      description: 'スマートコントラクトの開発とDAppの構築を学習します。Web3技術の基礎から実践まで幅広くカバーします。',
      difficulty: 'advanced',
      duration: '8週間',
      participants: 4,
      maxParticipants: 8,
      tags: ['Blockchain', 'Solidity', 'Web3'],
      status: 'available'
    },
    {
      id: 5,
      title: 'UI/UXデザイン基礎',
      description: 'ユーザー中心のデザイン思考を学び、Figmaを使用してプロトタイプを作成します。',
      difficulty: 'beginner',
      duration: '2週間',
      participants: 15,
      maxParticipants: 15,
      tags: ['Design', 'Figma', 'UX'],
      status: 'completed',
      progress: 100
    }
  ]);

  const filteredProjects = projects.filter(project => project.status === activeTab);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初級';
      case 'intermediate': return '中級';
      case 'advanced': return '上級';
      default: return difficulty;
    }
  };

  const handleJoinProject = (projectId: number) => {
    console.log(`Joining project ${projectId}`);
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            参加可能
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => setActiveTab('joined')}
        >
          <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
            参加中
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            完了済み
          </Text>
        </TouchableOpacity>
      </View>

      {/* Projects List */}
      <ScrollView style={styles.content}>
        {filteredProjects.map((project) => (
          <View key={project.id} style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectTitle}>{project.title}</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(project.difficulty) + '20' }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(project.difficulty) }]}>
                  {getDifficultyText(project.difficulty)}
                </Text>
              </View>
            </View>
            
            <Text style={styles.projectDescription}>{project.description}</Text>
            
            {/* Progress Bar for joined/completed projects */}
            {project.progress !== undefined && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{project.progress}% 完了</Text>
              </View>
            )}
            
            <View style={styles.projectMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>期間:</Text>
                <Text style={styles.metaValue}>{project.duration}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>参加者:</Text>
                <Text style={styles.metaValue}>{project.participants}/{project.maxParticipants}</Text>
              </View>
            </View>

            {/* Tags */}
            <View style={styles.tagsContainer}>
              {project.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Action Button */}
            {project.status === 'available' && (
              <TouchableOpacity 
                style={styles.joinButton}
                onPress={() => handleJoinProject(project.id)}
              >
                <Text style={styles.joinButtonText}>プロジェクトに参加</Text>
              </TouchableOpacity>
            )}
            
            {project.status === 'joined' && (
              <TouchableOpacity style={styles.continueButton}>
                <Text style={styles.continueButtonText}>続きを見る</Text>
              </TouchableOpacity>
            )}
            
            {project.status === 'completed' && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✓ 完了済み</Text>
              </View>
            )}
          </View>
        ))}
        
        {filteredProjects.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>プロジェクトがありません</Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'available' && '新しいプロジェクトをお待ちください'}
              {activeTab === 'joined' && 'プロジェクトに参加してみましょう'}
              {activeTab === 'completed' && 'プロジェクトを完了させましょう'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  projectCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 4,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#6b7280',
  },
  joinButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  continueButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
  },
});