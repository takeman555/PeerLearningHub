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
import { Resource, CreateResourceRequest, ResourceCategory, ResourceType, LearningLevel } from '../types/resources';
import resourceService from '../services/resourceService';
import { useAuth } from '../contexts/AuthContext';

interface ResourceEditorProps {
  resource?: Resource;
  onSave: (resource: Resource) => void;
  onCancel: () => void;
}

const ResourceEditor: React.FC<ResourceEditorProps> = ({ resource, onSave, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  
  const [formData, setFormData] = useState({
    title: resource?.title || '',
    description: resource?.description || '',
    content: resource?.content || '',
    category: resource?.category || 'language_learning' as ResourceCategory,
    type: resource?.type || 'article' as ResourceType,
    level: resource?.level || 'beginner' as LearningLevel,
    tags: resource?.tags.join(', ') || '',
    language: resource?.language || 'ja',
    published: resource?.published || false,
    featured: resource?.featured || false,
    file_url: resource?.file_url || '',
    thumbnail_url: resource?.thumbnail_url || '',
    duration: resource?.duration?.toString() || ''
  });

  const categories: { label: string; value: ResourceCategory }[] = [
    { label: '言語学習', value: 'language_learning' },
    { label: '文化', value: 'culture' },
    { label: 'ビジネス', value: 'business' },
    { label: 'テクノロジー', value: 'technology' },
    { label: 'ライフスタイル', value: 'lifestyle' },
    { label: '旅行', value: 'travel' },
    { label: '教育', value: 'education' },
    { label: 'キャリア', value: 'career' }
  ];

  const types: { label: string; value: ResourceType }[] = [
    { label: '記事', value: 'article' },
    { label: '動画', value: 'video' },
    { label: '音声', value: 'audio' },
    { label: '文書', value: 'document' },
    { label: 'リンク', value: 'link' },
    { label: 'コース', value: 'course' },
    { label: 'クイズ', value: 'quiz' },
    { label: 'ワークシート', value: 'worksheet' }
  ];

  const levels: { label: string; value: LearningLevel }[] = [
    { label: '初級', value: 'beginner' },
    { label: '中級', value: 'intermediate' },
    { label: '上級', value: 'advanced' },
    { label: '全レベル', value: 'all_levels' }
  ];

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.content.trim()) {
      Alert.alert('エラー', 'タイトル、説明、コンテンツは必須項目です。');
      return;
    }

    if (!user) {
      Alert.alert('エラー', 'ログインが必要です。');
      return;
    }

    setLoading(true);
    try {
      const resourceData: CreateResourceRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        category: formData.category,
        type: formData.type,
        level: formData.level,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        language: formData.language,
        published: formData.published,
        featured: formData.featured,
        file_url: formData.file_url.trim() || undefined,
        thumbnail_url: formData.thumbnail_url.trim() || undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined
      };

      let savedResource: Resource;
      if (resource) {
        // Update existing resource
        savedResource = await resourceService.updateResource({
          id: resource.id,
          ...resourceData
        }) as Resource;
      } else {
        // Create new resource
        savedResource = await resourceService.createResource(
          resourceData,
          user.id,
          user.user_metadata?.full_name || user.email || 'Unknown'
        );
      }

      Alert.alert(
        '成功',
        resource ? 'リソースが更新されました。' : 'リソースが作成されました。',
        [{ text: 'OK', onPress: () => onSave(savedResource) }]
      );
    } catch (error) {
      console.error('Resource save error:', error);
      Alert.alert('エラー', 'リソースの保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {resource ? 'リソース編集' : 'リソース作成'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>タイトル *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="リソースのタイトルを入力"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>説明 *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="リソースの説明を入力"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>カテゴリー</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.selectorText}>
                {categories.find(c => c.value === formData.category)?.label}
              </Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.halfField}>
            <Text style={styles.label}>タイプ</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowTypeModal(true)}
            >
              <Text style={styles.selectorText}>
                {types.find(t => t.value === formData.type)?.label}
              </Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>レベル</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowLevelModal(true)}
            >
              <Text style={styles.selectorText}>
                {levels.find(l => l.value === formData.level)?.label}
              </Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.halfField}>
            <Text style={styles.label}>言語</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => {
                const languages = [
                  { label: '日本語', value: 'ja' },
                  { label: 'English', value: 'en' },
                  { label: '한국어', value: 'ko' }
                ];
                const currentLang = languages.find(l => l.value === formData.language);
                const nextIndex = (languages.findIndex(l => l.value === formData.language) + 1) % languages.length;
                setFormData({ ...formData, language: languages[nextIndex].value });
              }}
            >
              <Text style={styles.selectorText}>
                {formData.language === 'ja' ? '日本語' : 
                 formData.language === 'en' ? 'English' : '한국어'}
              </Text>
              <Text style={styles.selectorArrow}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>タグ (カンマ区切り)</Text>
          <TextInput
            style={styles.input}
            value={formData.tags}
            onChangeText={(text) => setFormData({ ...formData, tags: text })}
            placeholder="例: 日本語, 基本, 挨拶"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>コンテンツ * (Markdown対応)</Text>
          <TextInput
            style={[styles.input, styles.contentArea]}
            value={formData.content}
            onChangeText={(text) => setFormData({ ...formData, content: text })}
            placeholder="# タイトル\n\n内容をMarkdown形式で入力してください..."
            multiline
            numberOfLines={10}
          />
        </View>

        {(formData.type === 'video' || formData.type === 'audio') && (
          <View style={styles.field}>
            <Text style={styles.label}>再生時間 (分)</Text>
            <TextInput
              style={styles.input}
              value={formData.duration}
              onChangeText={(text) => setFormData({ ...formData, duration: text })}
              placeholder="例: 15"
              keyboardType="numeric"
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>ファイルURL (オプション)</Text>
          <TextInput
            style={styles.input}
            value={formData.file_url}
            onChangeText={(text) => setFormData({ ...formData, file_url: text })}
            placeholder="https://example.com/file.pdf"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>サムネイルURL (オプション)</Text>
          <TextInput
            style={styles.input}
            value={formData.thumbnail_url}
            onChangeText={(text) => setFormData({ ...formData, thumbnail_url: text })}
            placeholder="https://example.com/thumbnail.jpg"
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>公開する</Text>
          <Switch
            value={formData.published}
            onValueChange={(value) => setFormData({ ...formData, published: value })}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>注目リソースにする</Text>
          <Switch
            value={formData.featured}
            onValueChange={(value) => setFormData({ ...formData, featured: value })}
          />
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

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>カテゴリーを選択</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.category === item.value && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, category: item.value });
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.category === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalCloseText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>タイプを選択</Text>
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
                  <Text style={styles.modalItemText}>{item.label}</Text>
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

      {/* Level Selection Modal */}
      <Modal
        visible={showLevelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLevelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>レベルを選択</Text>
            <FlatList
              data={levels}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.level === item.value && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, level: item.value });
                    setShowLevelModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.level === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLevelModal(false)}
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  contentArea: {
    height: 200,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
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

export default ResourceEditor;