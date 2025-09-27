import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>プライバシーポリシー</Text>
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>最終更新日: 2025年9月27日</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. はじめに</Text>
          <Text style={styles.text}>
            PeerLearningHub（以下「当社」）は、ユーザーのプライバシーを尊重し、
            個人情報の保護に努めています。本プライバシーポリシーは、
            当社がどのような情報を収集し、どのように使用・保護するかを説明します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 収集する情報</Text>
          <Text style={styles.text}>
            当社は以下の情報を収集する場合があります：
          </Text>
          
          <Text style={styles.subTitle}>2.1 アカウント情報</Text>
          <Text style={styles.bulletPoint}>• 名前、メールアドレス</Text>
          <Text style={styles.bulletPoint}>• プロフィール情報（任意）</Text>
          <Text style={styles.bulletPoint}>• 学習履歴と進捗</Text>
          
          <Text style={styles.subTitle}>2.2 自動収集情報</Text>
          <Text style={styles.bulletPoint}>• デバイス情報（OS、ブラウザ等）</Text>
          <Text style={styles.bulletPoint}>• IPアドレス</Text>
          <Text style={styles.bulletPoint}>• アプリの使用状況</Text>
          <Text style={styles.bulletPoint}>• クラッシュレポート</Text>
          
          <Text style={styles.subTitle}>2.3 コンテンツ情報</Text>
          <Text style={styles.bulletPoint}>• 投稿したコンテンツ</Text>
          <Text style={styles.bulletPoint}>• コメントやメッセージ</Text>
          <Text style={styles.bulletPoint}>• 学習グループでの活動</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 情報の使用目的</Text>
          <Text style={styles.text}>
            収集した情報は以下の目的で使用されます：
          </Text>
          <Text style={styles.bulletPoint}>• サービスの提供・改善</Text>
          <Text style={styles.bulletPoint}>• ユーザーサポート</Text>
          <Text style={styles.bulletPoint}>• 学習体験のパーソナライゼーション</Text>
          <Text style={styles.bulletPoint}>• セキュリティの維持</Text>
          <Text style={styles.bulletPoint}>• 法的要求への対応</Text>
          <Text style={styles.bulletPoint}>• マーケティング（同意がある場合のみ）</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 情報の共有</Text>
          <Text style={styles.text}>
            当社は以下の場合を除き、個人情報を第三者と共有しません：
          </Text>
          <Text style={styles.bulletPoint}>• ユーザーの明示的な同意がある場合</Text>
          <Text style={styles.bulletPoint}>• 法的義務を履行する場合</Text>
          <Text style={styles.bulletPoint}>• サービス提供に必要な業務委託先</Text>
          <Text style={styles.bulletPoint}>• 緊急時の安全確保</Text>
          
          <Text style={styles.text}>
            業務委託先には適切な機密保持契約を課し、
            個人情報の適切な取り扱いを確保しています。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. データの保存と保護</Text>
          <Text style={styles.text}>
            当社は以下のセキュリティ対策を実施しています：
          </Text>
          <Text style={styles.bulletPoint}>• データの暗号化（保存時・転送時）</Text>
          <Text style={styles.bulletPoint}>• アクセス制御とログ監視</Text>
          <Text style={styles.bulletPoint}>• 定期的なセキュリティ監査</Text>
          <Text style={styles.bulletPoint}>• 従業員への教育・研修</Text>
          
          <Text style={styles.text}>
            データは必要な期間のみ保存し、不要になった場合は安全に削除します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. ユーザーの権利</Text>
          <Text style={styles.text}>
            ユーザーには以下の権利があります：
          </Text>
          <Text style={styles.bulletPoint}>• 個人情報の開示請求</Text>
          <Text style={styles.bulletPoint}>• 個人情報の訂正・削除</Text>
          <Text style={styles.bulletPoint}>• データポータビリティ</Text>
          <Text style={styles.bulletPoint}>• マーケティング配信の停止</Text>
          <Text style={styles.bulletPoint}>• アカウントの削除</Text>
          
          <Text style={styles.text}>
            これらの権利を行使したい場合は、お問い合わせください。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Cookie とトラッキング</Text>
          <Text style={styles.text}>
            当社は以下の目的でCookieや類似技術を使用します：
          </Text>
          <Text style={styles.bulletPoint}>• ログイン状態の維持</Text>
          <Text style={styles.bulletPoint}>• ユーザー設定の保存</Text>
          <Text style={styles.bulletPoint}>• サービスの使用状況分析</Text>
          <Text style={styles.bulletPoint}>• パフォーマンスの改善</Text>
          
          <Text style={styles.text}>
            ブラウザの設定でCookieを無効にできますが、
            一部機能が制限される場合があります。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. 第三者サービス</Text>
          <Text style={styles.text}>
            本サービスは以下の第三者サービスを利用しています：
          </Text>
          <Text style={styles.bulletPoint}>• 認証サービス（Supabase Auth）</Text>
          <Text style={styles.bulletPoint}>• 決済処理（RevenueCat）</Text>
          <Text style={styles.bulletPoint}>• 分析ツール</Text>
          <Text style={styles.bulletPoint}>• クラウドストレージ</Text>
          
          <Text style={styles.text}>
            これらのサービスには独自のプライバシーポリシーが適用されます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. 国際的なデータ転送</Text>
          <Text style={styles.text}>
            グローバルサービスの性質上、データは国境を越えて転送される場合があります。
            適切なセキュリティ対策を講じ、各国の法律に準拠してデータを保護します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. 未成年者のプライバシー</Text>
          <Text style={styles.text}>
            13歳未満の児童から故意に個人情報を収集することはありません。
            未成年者の個人情報を発見した場合は、直ちに削除いたします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. ポリシーの変更</Text>
          <Text style={styles.text}>
            本プライバシーポリシーは予告なく変更される場合があります。
            重要な変更については、サービス内またはメールで通知いたします。
            継続的な利用により、変更に同意したものとみなされます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. お問い合わせ</Text>
          <Text style={styles.text}>
            プライバシーに関するご質問やお問い合わせは、以下までご連絡ください：
          </Text>
          <Text style={styles.contactInfo}>
            Email: privacy@peerlearninghub.com{'\n'}
            データ保護責任者: PeerLearningHub運営チーム{'\n'}
            住所: 日本国内（詳細はお問い合わせください）
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            当社はユーザーのプライバシーを最優先に考え、
            透明性のある情報管理を心がけています。
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
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
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