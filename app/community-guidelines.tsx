import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function CommunityGuidelinesPage() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>コミュニティガイドライン</Text>
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>最終更新日: 2025年9月27日</Text>
        
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>🌟 私たちのコミュニティへようこそ</Text>
          <Text style={styles.introText}>
            PeerLearningHubは、世界中の学習者とデジタルノマドが知識を共有し、
            互いに成長し合うためのコミュニティです。すべてのメンバーが安全で
            建設的な環境で学習できるよう、以下のガイドラインを設けています。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 基本原則</Text>
          <Text style={styles.principle}>🤝 相互尊重</Text>
          <Text style={styles.text}>
            すべてのメンバーを尊重し、多様な背景、経験、意見を歓迎します。
            文化的な違いを理解し、包括的なコミュニティを築きましょう。
          </Text>
          
          <Text style={styles.principle}>📚 学習第一</Text>
          <Text style={styles.text}>
            知識の共有と学習の促進を最優先とし、建設的な議論を心がけます。
            質問を恐れず、他者の学習をサポートしましょう。
          </Text>
          
          <Text style={styles.principle}>🌍 グローバル視点</Text>
          <Text style={styles.text}>
            国際的なコミュニティとして、異なる文化や言語を尊重し、
            グローバルな視点で交流しましょう。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 推奨される行動</Text>
          
          <View style={styles.guideline}>
            <Text style={styles.guidelineTitle}>✅ 建設的なコミュニケーション</Text>
            <Text style={styles.bulletPoint}>• 丁寧で思いやりのある言葉遣いを使用する</Text>
            <Text style={styles.bulletPoint}>• 具体的で有用なフィードバックを提供する</Text>
            <Text style={styles.bulletPoint}>• 質問には親切に答える</Text>
            <Text style={styles.bulletPoint}>• 間違いを恐れず、学習の機会として捉える</Text>
          </View>

          <View style={styles.guideline}>
            <Text style={styles.guidelineTitle}>✅ 質の高いコンテンツ</Text>
            <Text style={styles.bulletPoint}>• 正確で信頼できる情報を共有する</Text>
            <Text style={styles.bulletPoint}>• 出典を明記し、著作権を尊重する</Text>
            <Text style={styles.bulletPoint}>• 関連性の高いトピックを投稿する</Text>
            <Text style={styles.bulletPoint}>• 検索しやすいタイトルと説明を付ける</Text>
          </View>

          <View style={styles.guideline}>
            <Text style={styles.guidelineTitle}>✅ プライバシーの保護</Text>
            <Text style={styles.bulletPoint}>• 個人情報を適切に管理する</Text>
            <Text style={styles.bulletPoint}>• 他者の許可なく個人情報を共有しない</Text>
            <Text style={styles.bulletPoint}>• プライベートな会話は適切な場所で行う</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 禁止事項</Text>
          
          <View style={styles.prohibition}>
            <Text style={styles.prohibitionTitle}>❌ ハラスメント・差別</Text>
            <Text style={styles.bulletPoint}>• 人種、性別、宗教、国籍等による差別</Text>
            <Text style={styles.bulletPoint}>• 個人攻撃や誹謗中傷</Text>
            <Text style={styles.bulletPoint}>• 脅迫や嫌がらせ</Text>
            <Text style={styles.bulletPoint}>• ストーキング行為</Text>
          </View>

          <View style={styles.prohibition}>
            <Text style={styles.prohibitionTitle}>❌ 不適切なコンテンツ</Text>
            <Text style={styles.bulletPoint}>• 暴力的、性的、または不快な内容</Text>
            <Text style={styles.bulletPoint}>• ヘイトスピーチ</Text>
            <Text style={styles.bulletPoint}>• 違法な活動の促進</Text>
            <Text style={styles.bulletPoint}>• 虚偽情報の拡散</Text>
          </View>

          <View style={styles.prohibition}>
            <Text style={styles.prohibitionTitle}>❌ スパム・商業利用</Text>
            <Text style={styles.bulletPoint}>• 無関係な宣伝や営業活動</Text>
            <Text style={styles.bulletPoint}>• 繰り返し投稿（スパム）</Text>
            <Text style={styles.bulletPoint}>• 詐欺的な内容</Text>
            <Text style={styles.bulletPoint}>• 許可のない商品販売</Text>
          </View>

          <View style={styles.prohibition}>
            <Text style={styles.prohibitionTitle}>❌ 著作権侵害</Text>
            <Text style={styles.bulletPoint}>• 無断での著作物の複製・配布</Text>
            <Text style={styles.bulletPoint}>• 他者の作品の盗用</Text>
            <Text style={styles.bulletPoint}>• ライセンス違反</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 学習グループのルール</Text>
          <Text style={styles.text}>
            学習グループでは以下の追加ルールが適用されます：
          </Text>
          <Text style={styles.bulletPoint}>• グループの目的に沿った活動を行う</Text>
          <Text style={styles.bulletPoint}>• 定期的に参加し、コミットメントを守る</Text>
          <Text style={styles.bulletPoint}>• 他のメンバーの学習を妨げない</Text>
          <Text style={styles.bulletPoint}>• グループ内の情報は適切に管理する</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 報告とモデレーション</Text>
          <Text style={styles.text}>
            ガイドライン違反を発見した場合は、以下の方法で報告してください：
          </Text>
          <Text style={styles.bulletPoint}>• 投稿の報告機能を使用</Text>
          <Text style={styles.bulletPoint}>• 運営チームへの直接連絡</Text>
          <Text style={styles.bulletPoint}>• 緊急時は即座に報告</Text>
          
          <Text style={styles.text}>
            報告された内容は運営チームが迅速に審査し、適切な措置を講じます。
            違反の程度に応じて、警告、一時停止、永久追放等の措置を取る場合があります。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. 言語とコミュニケーション</Text>
          <Text style={styles.text}>
            多言語コミュニティとして、以下を推奨します：
          </Text>
          <Text style={styles.bulletPoint}>• 主要言語は日本語と英語</Text>
          <Text style={styles.bulletPoint}>• 他の言語での投稿も歓迎</Text>
          <Text style={styles.bulletPoint}>• 翻訳ツールの活用を推奨</Text>
          <Text style={styles.bulletPoint}>• 言語の違いに寛容であること</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. デジタルノマド特有のルール</Text>
          <Text style={styles.text}>
            デジタルノマドコミュニティとして：
          </Text>
          <Text style={styles.bulletPoint}>• 現地の法律と文化を尊重する</Text>
          <Text style={styles.bulletPoint}>• 安全な旅行情報を共有する</Text>
          <Text style={styles.bulletPoint}>• 持続可能な旅行を心がける</Text>
          <Text style={styles.bulletPoint}>• 地域コミュニティに貢献する</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. 知的財産の尊重</Text>
          <Text style={styles.text}>
            学習コンテンツを共有する際は：
          </Text>
          <Text style={styles.bulletPoint}>• 著作権を確認し、適切に引用する</Text>
          <Text style={styles.bulletPoint}>• オリジナルコンテンツの作成を推奨</Text>
          <Text style={styles.bulletPoint}>• クリエイティブ・コモンズ等の活用</Text>
          <Text style={styles.bulletPoint}>• 疑問がある場合は運営チームに相談</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. 継続的な改善</Text>
          <Text style={styles.text}>
            コミュニティガイドラインは、メンバーのフィードバックを基に
            継続的に改善されます。建設的な提案をお待ちしています。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. お問い合わせ</Text>
          <Text style={styles.text}>
            ガイドラインに関するご質問やご提案は、以下までご連絡ください：
          </Text>
          <Text style={styles.contactInfo}>
            Email: community@peerlearninghub.com{'\n'}
            コミュニティマネージャー: PeerLearningHub運営チーム
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🌟 一緒に素晴らしい学習コミュニティを築きましょう！ 🌟
          </Text>
          <Text style={styles.footerSubtext}>
            このガイドラインは、すべてのメンバーが安全で生産的な
            学習環境を享受できるよう設計されています。
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
  introSection: {
    backgroundColor: '#dbeafe',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: '#1e40af',
    lineHeight: 24,
    textAlign: 'center',
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
  principle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 8,
  },
  guideline: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  guidelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 8,
  },
  prohibition: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  prohibitionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
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
    padding: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 18,
    color: '#1f2937',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});