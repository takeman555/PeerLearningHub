import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Modal,
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { groupsService, CreateGroupData } from '../services/groupsService';
import { useAuth } from '../contexts/AuthContext';

interface AdminGroupCreatorProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export default function AdminGroupCreator({ visible, onClose, onGroupCreated }: AdminGroupCreatorProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateGroupData>({
    name: '',
    description: '',
    externalLink: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'グループ名は必須です';
    } else if (formData.name.trim().length > 255) {
      newErrors.name = 'グループ名は255文字以内で入力してください';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = '説明は2000文字以内で入力してください';
    }

    if (formData.externalLink && formData.externalLink.trim()) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(formData.externalLink.trim())) {
        newErrors.externalLink = '有効なURL（http://またはhttps://で始まる）を入力してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      Alert.alert('エラー', 'ユーザー情報が取得できません');
      return;
    }

    setLoading(true);
    try {
      await groupsService.createGroup(user.id, {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        externalLink: formData.externalLink?.trim() || undefined
      });

      Alert.alert('成功', 'グループが作成されました', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            onGroupCreated();
            onClose();
          }
        }
      ]);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert(
        'エラー', 
        error instanceof Error ? error.message : 'グループの作成に失敗しました'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      externalLink: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.title}>新しいグループを作成</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.saveButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>作成</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>基本情報</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                グループ名 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, name: text }));
                  if (errors.name) {
                    setErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                placeholder="例: ピアラーニングハブ生成AI部"
                maxLength={255}
                editable={!loading}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>説明</Text>
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                value={formData.description}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, description: text }));
                  if (errors.description) {
                    setErrors(prev => ({ ...prev, description: '' }));
                  }
                }}
                placeholder="グループの説明を入力してください..."
                multiline
                numberOfLines={4}
                maxLength={2000}
                editable={!loading}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
              <Text style={styles.characterCount}>
                {formData.description?.length || 0}/2000
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>外部参加リンク</Text>
              <TextInput
                style={[styles.input, errors.externalLink && styles.inputError]}
                value={formData.externalLink}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, externalLink: text }));
                  if (errors.externalLink) {
                    setErrors(prev => ({ ...prev, externalLink: '' }));
                  }
                }}
                placeholder="https://example.com/join"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {errors.externalLink && <Text style={styles.errorText}>{errors.externalLink}</Text>}
              <Text style={styles.helpText}>
                グループに参加するための外部リンクを入力してください（任意）
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>📝 注意事項</Text>
            <Text style={styles.infoText}>
              • グループ名は必須項目です{'\n'}
              • 外部リンクは有効なURL形式で入力してください{'\n'}
              • 作成後、グループは即座に公開されます{'\n'}
              • 管理者のみがグループを編集・削除できます
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  infoSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
});