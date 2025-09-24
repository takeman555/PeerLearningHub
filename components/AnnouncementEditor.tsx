import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  Modal,
  FlatList
} from 'react-native';
import { Announcement, CreateAnnouncementRequest } from '../services/announcementService';
import announcementService from '../services/announcementService';
import { useAuth } from '../contexts/AuthContext';

interface AnnouncementEditorProps {
  announcement?: Announcement;
  onSave: (announcement: Announcement) => void;
  onCancel: () => void;
}

const AnnouncementEditor: React.FC<AnnouncementEditorProps> = ({ 
  announcement, 
  onSave, 
  onCancel 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    type: announcement?.type || 'news' as const,
    priority: announcement?.priority || 'medium' as const,
    published: announcement?.published || false,
    featured: announcement?.featured || false,
    expires_at: announcement?.expires_at ? new Date(announcement.expires_at).toISOString().split('T')[0] : ''
  });

  const types = [
    { label: 'ニュース', value: 'news' as const },
    { label: 'アップデート', value: 'update' as const },
    { label: 'イベント', value: 'event' as const },
    { label: 'メンテナンス', value: 'maintenance' as const }
  ];

  const priorities = [
    { label: '高', value: 'high' as const },
    { label: '中', value: 'medium' as const },
    { label: '低', value: 'low' as const }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'news': return '📢';
      case 'update': return '🔄';
      case 'event': return '🎉';
      case 'maintenance': return '🔧';
      default: return '📝';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('エラー', 'タイトルと内容は必須項目です。');
      return;
    }

    if (!user) {
      Alert.alert('エラー', 'ログインが必要です。');
      return;
    }

    setLoading(true);
    try {
      const announcementData: CreateAnnouncementRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        priority: formData.priority,
        published: formData.published,
        featured: formData.featured,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : undefined
      };

      let savedAnnouncement: Announcement;
      if (announcement) {
        // Update existing announcement
        savedAnnouncement = await announcementService.updateAnnouncement({
          id: announcement.id,
          ...announcementData
        });
      } else {
        // Create new announcement
        savedAnnouncement = await announcementService.createAnnouncement(
          announcementData,
          user.id,
          user.user_metadata?.full_name || user.email || 'Unknown'
        );
      }

      Alert.alert(
        '成功',
        announcement ? 'お知らせが更新されました。' : 'お知らせが作成されました。',
        [{ text: 'OK', onPress: () => onSave(savedAnnouncement) }]
      );
    } catch (error) {
      console.error('Announcement save error:', error);
      Alert.alert('エラー', 'お知らせの保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {announcement ? 'お知らせ編集' : 'お知らせ作成'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>タイトル *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="お知らせのタイトルを入力"
          />
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>種類</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowTypeModal(true)}
            >
              <Text style={styles.selectorText}>
                {getTypeIcon(formData.type)} {types.find(t => t.value === formData.type)?.label}
              </Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.halfField}>
            <Text style={styles.label}>優先度</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowPriorityModal(true)}
            >
              <Text style={styles.selectorText}>
                {priorities.find(p => p.value === formData.priority)?.label}
              </Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>内容 *</Text>
          <TextInput
            style={[styles.input, styles.contentArea]}
            value={formData.content}
            onChangeText={(text) => setFormData({ ...formData, content: text })}
            placeholder="お知らせの内容を入力してください..."
            multiline
            numberOfLines={8}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>有効期限 (オプション)</Text>
          <TextInput
            style={styles.input}
            value={formData.expires_at}
            onChangeText={(text) => setFormData({ ...formData, expires_at: text })}
            placeholder="YYYY-MM-DD"
          />
          <Text style={styles.helpText}>
            空白の場合は無期限です。形式: YYYY-MM-DD
          </Text>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.label}>公開する</Text>
            <Text style={styles.helpText}>
              公開すると、すべてのユーザーに表示されます
            </Text>
          </View>
          <Switch
            value={formData.published}
            onValueChange={(value) => setFormData({ ...formData, published: value })}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.label}>注目のお知らせにする</Text>
            <Text style={styles.helpText}>
              注目のお知らせは上部に表示されます
            </Text>
          </View>
          <Switch
            value={formData.featured}
            onValueChange={(value) => setFormData({ ...formData, featured: value })}
          />
        </View>

        {/* Preview Section */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>プレビュー</Text>
          <View style={[
            styles.previewCard,
            formData.featured && styles.featuredPreview
          ]}>
            <View style={styles.previewHeader}>
              <View style={styles.previewInfo}>
                <Text style={styles.previewIcon}>{getTypeIcon(formData.type)}</Text>
                <View style={styles.previewDetails}>
                  <Text style={styles.previewCardTitle}>
                    {formData.title || 'タイトルを入力してください'}
                  </Text>
                  <Text style={styles.previewDate}>
                    {new Date().toLocaleDateString('ja-JP')}
                  </Text>
                </View>
              </View>
              <View style={styles.previewMeta}>
                <View style={[
                  styles.previewBadge, 
                  { backgroundColor: getPriorityColor(formData.priority) + '20' }
                ]}>
                  <Text style={[
                    styles.previewBadgeText, 
                    { color: getPriorityColor(formData.priority) }
                  ]}>
                    {types.find(t => t.value === formData.type)?.label}
                  </Text>
                </View>
                {formData.featured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredText}>注目</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.previewContent}>
              {formData.content || '内容を入力してください...'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>キャンセル</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>種類を選択</Text>
            <FlatList
              data={types}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.type === item.value && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, type: item.value });
                    setShowTypeModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {getTypeIcon(item.value)} {item.label}
                  </Text>
                  {formData.type === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTypeModal(false)}
            >
              <Text style={styles.modalCloseText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Priority Selection Modal */}
      <Modal
        visible={showPriorityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPriorityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>優先度を選択</Text>
            <FlatList
              data={priorities}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.priority === item.value && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, priority: item.value });
                    setShowPriorityModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.priority === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPriorityModal(false)}
            >
              <Text style={styles.modalCloseText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  halfField: {
    flex: 1,
    marginRight: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  contentArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  previewSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  featuredPreview: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  previewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  previewIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  previewDetails: {
    flex: 1,
  },
  previewCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  previewDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  previewMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  previewBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  featuredBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white',
  },
  previewContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Custom Selector Styles
  selectorButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    color: '#374151',
  },
  selectorArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemSelected: {
    backgroundColor: '#eff6ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  checkmark: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default AnnouncementEditor;