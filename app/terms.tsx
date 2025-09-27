import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function TermsOfServicePage() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>利用規約</Text>
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>最終更新日: 2025年9月27日</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. サービスの概要</Text>
          <Text style={styles.text}>
            PeerLearningHub（以下「本サービス」）は、世界中の学習者とデジタルノマドが知識を共有し、
            共に成長するためのプラットフォームです。本規約は、本サービスの利用に関する条件を定めています。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 利用資格</Text>
          <Text style={styles.text}>
            本サービスを利用するには、以下の条件を満たす必要があります：
          </Text>
          <Text style={styles.bulletPoint}>• 13歳以上であること</Text>
          <Text style={styles.bulletPoint}>• 有効なメールアドレスを持っていること</Text>
          <Text style={styles.bulletPoint}>• 本規約に同意すること</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. アカウント管理</Text>
          <Text style={styles.text}>
            ユーザーは自身のアカウント情報の正確性を保ち、パスワードを安全に管理する責任があります。
            アカウントの不正使用を発見した場合は、直ちに運営チームにご連絡ください。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. コンテンツとコミュニティ</Text>
          <Text style={styles.text}>
            ユーザーが投稿するコンテンツは、以下のガイドラインに従う必要があります：
          </Text>
          <Text style={styles.bulletPoint}>• 他者を尊重し、建設的な議論を心がける</Text>
          <Text style={styles.bulletPoint}>• 著作権を侵害しない</Text>
          <Text style={styles.bulletPoint}>• 不適切な内容（暴力、差別、スパムなど）を投稿しない</Text>
          <Text style={styles.bulletPoint}>• 個人情報を適切に保護する</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. プレミアム機能</Text>
          <Text style={styles.text}>
            プレミアムメンバーシップには以下が含まれます：
          </Text>
          <Text style={styles.bulletPoint}>• 無制限のコンテンツアクセス</Text>
          <Text style={styles.bulletPoint}>• 優先サポート</Text>
          <Text style={styles.bulletPoint}>• 特別なコミュニティ機能</Text>
          <Text style={styles.bulletPoint}>• 広告なしの体験</Text>
          <Text style={styles.text}>
            サブスクリプションは自動更新され、いつでもキャンセル可能です。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. プライバシーとデータ保護</Text>
          <Text style={styles.text}>
            ユーザーのプライバシーを尊重し、個人情報を適切に保護します。
            詳細については、プライバシーポリシーをご確認ください。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. 知的財産権</Text>
          <Text style={styles.text}>
            本サービスのコンテンツ、デザイン、機能は著作権法により保護されています。
            ユーザーが投稿したコンテンツの著作権は投稿者に帰属しますが、
            本サービス内での使用について必要な権利を当社に許諾するものとします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. サービスの変更・終了</Text>
          <Text style={styles.text}>
            当社は、事前通知により本サービスの内容を変更または終了する権利を留保します。
            重要な変更については、適切な期間をもって通知いたします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. 免責事項</Text>
          <Text style={styles.text}>
            本サービスは「現状のまま」提供され、当社は以下について責任を負いません：
          </Text>
          <Text style={styles.bulletPoint}>• サービスの中断や障害</Text>
          <Text style={styles.bulletPoint}>• ユーザー間のトラブル</Text>
          <Text style={styles.bulletPoint}>• 第三者によるコンテンツの正確性</Text>
          <Text style={styles.bulletPoint}>• データの損失</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. 準拠法と管轄</Text>
          <Text style={styles.text}>
            本規約は日本法に準拠し、本サービスに関する紛争については、
            東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. お問い合わせ</Text>
          <Text style={styles.text}>
            本規約に関するご質問やお問い合わせは、以下までご連絡ください：
          </Text>
          <Text style={styles.contactInfo}>
            Email: support@peerlearninghub.com{'\n'}
            運営会社: PeerLearningHub運営チーム
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            本規約は予告なく変更される場合があります。
            重要な変更については、サービス内で通知いたします。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 16,
    color: '#3b82f6',
    lineHeight: 24,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});