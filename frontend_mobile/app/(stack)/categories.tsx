import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { toast } from '@/context/ToastContext';
import { showConfirm } from '@/context/ConfirmContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { categoryService } from '@/services/api/category.service';
import type { Category } from '@/services/api';
import { useTranslation } from '@/context/I18nContext';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#64748b', '#78716c', '#52525b', '#000000',
];

const PRESET_EMOJIS = [
  '📁', '💼', '🏠', '🎯', '📌', '💰', '💳', '🛒', '🎁', '🎬',
  '🎵', '🎮', '📚', '🏃', '💊', '✈️', '🚗', '💻', '📱', '👥',
  '❤️', '🎓', '🍕', '🌿', '🔑', '⚡', '🎨', '🏆', '📊', '🔧',
];

function isEmojiIcon(str?: string | null): boolean {
  if (!str || !str.trim()) return false;
  return /[^ -]/.test(str);
}

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [newIcon, setNewIcon] = useState('📁');
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renamingCategory, setRenamingCategory] = useState<Category | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameColor, setRenameColor] = useState('#6366f1');
  const [renameIcon, setRenameIcon] = useState('📁');
  const [renaming, setRenaming] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(t('category.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [fetchCategories])
  );

  const openCreateModal = () => {
    setNewName('');
    setNewColor('#6366f1');
    setNewIcon('📁');
    setCreateModalVisible(true);
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error(t('category.nameRequired'));
      return;
    }
    try {
      setCreating(true);
      await categoryService.create({ name: newName.trim(), icon: newIcon, color: newColor });
      setCreateModalVisible(false);
      await fetchCategories();
    } catch (err) {
      console.error('Error creating category:', err);
      toast.error(t('category.errorCreate'));
    } finally {
      setCreating(false);
    }
  };

  const openRenameModal = (cat: Category) => {
    setRenamingCategory(cat);
    setRenameValue(cat.name);
    setRenameColor(cat.color || '#6366f1');
    setRenameIcon(isEmojiIcon(cat.icon) ? cat.icon : '📁');
    setRenameModalVisible(true);
  };

  const handleRename = async () => {
    if (!renameValue.trim() || !renamingCategory) return;
    try {
      setRenaming(true);
      await categoryService.update(renamingCategory.id, {
        name: renameValue.trim(),
        color: renameColor,
        icon: renameIcon,
      });
      setRenameModalVisible(false);
      await fetchCategories();
    } catch (err) {
      console.error('Error renaming category:', err);
      toast.error(t('category.errorRename'));
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    const confirmed = await showConfirm({
      title: t('category.deleteModal.title'),
      message: t('category.deleteModal.message', { name: cat.name }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await categoryService.delete(cat.id);
      await fetchCategories();
    } catch {
      toast.error(t('category.errorDelete'));
    }
  };

  const systemCategories = categories.filter((c) => c.isSystem);
  const userCategories = categories.filter((c) => !c.isSystem);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('category.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchCategories}>
          <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const EmojiGrid = ({
    selected,
    onSelect,
  }: {
    selected: string;
    onSelect: (emoji: string) => void;
  }) => (
    <View style={styles.emojiGrid}>
      {PRESET_EMOJIS.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          style={[styles.emojiOption, selected === emoji && styles.emojiOptionSelected]}
          onPress={() => onSelect(emoji)}
        >
          <Text style={styles.emojiOptionText}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* System categories */}
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#8E93B7" />
          <Text style={styles.sectionTitle}>{t('category.systemSection')}</Text>
        </View>

        {systemCategories.length === 0 ? (
          <Text style={styles.emptyText}>{t('category.systemEmpty')}</Text>
        ) : (
          systemCategories.map((cat) => (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={[styles.iconBadge, { backgroundColor: `${cat.color || '#6366f1'}22` }]}>
                {isEmojiIcon(cat.icon) ? (
                  <Text style={styles.iconBadgeEmoji}>{cat.icon}</Text>
                ) : (
                  <View style={[styles.colorDot, { backgroundColor: cat.color || '#6366f1' }]} />
                )}
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <View style={[styles.systemBadge]}>
                <Text style={styles.systemBadgeText}>{t('category.systemBadge')}</Text>
              </View>
            </View>
          ))
        )}

        {/* User categories */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Ionicons name="folder-outline" size={16} color="#8E93B7" />
          <Text style={styles.sectionTitle}>{t('category.userSection')}</Text>
        </View>

        {userCategories.length === 0 ? (
          <Text style={styles.emptyText}>{t('category.userEmpty')}</Text>
        ) : (
          userCategories.map((cat) => (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={[styles.iconBadge, { backgroundColor: `${cat.color || '#6366f1'}22` }]}>
                {isEmojiIcon(cat.icon) ? (
                  <Text style={styles.iconBadgeEmoji}>{cat.icon}</Text>
                ) : (
                  <View style={[styles.colorDot, { backgroundColor: cat.color || '#6366f1' }]} />
                )}
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => openRenameModal(cat)}
                  testID={`rename-category-${cat.id}`}
                >
                  <Ionicons name="pencil-outline" size={16} color="#C9CCF4" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(cat)}
                  testID={`delete-category-${cat.id}`}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.addBtn} onPress={openCreateModal} testID="add-category-btn">
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addBtnText}>{t('category.addNew')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{t('category.createModal.title')}</Text>

              <Text style={styles.inputLabel}>{t('category.createModal.name')}</Text>
              <TextInput
                style={styles.textInput}
                value={newName}
                onChangeText={setNewName}
                placeholder={t('category.createModal.namePlaceholder')}
                placeholderTextColor="#666"
                autoFocus
              />

              <Text style={styles.inputLabel}>Icône</Text>
              <EmojiGrid selected={newIcon} onSelect={setNewIcon} />

              <Text style={styles.inputLabel}>{t('category.createModal.color')}</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      newColor === c && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewColor(c)}
                  />
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setCreateModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>{t('category.createModal.submit')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{t('category.renameModal.title', { name: renamingCategory?.name ?? '' })}</Text>

              <Text style={styles.inputLabel}>{t('category.renameModal.newName')}</Text>
              <TextInput
                style={styles.textInput}
                value={renameValue}
                onChangeText={setRenameValue}
                placeholderTextColor="#666"
                autoFocus
              />

              <Text style={styles.inputLabel}>Icône</Text>
              <EmojiGrid selected={renameIcon} onSelect={setRenameIcon} />

              <Text style={styles.inputLabel}>Couleur</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      renameColor === c && styles.colorOptionSelected,
                    ]}
                    onPress={() => setRenameColor(c)}
                  />
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setRenameModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleRename}
                  disabled={renaming}
                >
                  {renaming ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>{t('category.renameModal.submit')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11112A',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    color: '#D3D6E8',
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E93B7',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyText: {
    color: '#555B7B',
    fontSize: 14,
    marginVertical: 12,
    marginLeft: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1F3A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 8,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBadgeEmoji: {
    fontSize: 18,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  systemBadge: {
    backgroundColor: '#2A2B4A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  systemBadgeText: {
    color: '#8E93B7',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#2A2B4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#2A1A1A',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    gap: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: '#1E1F3A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#8E93B7',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#11112A',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2B4A',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  emojiOption: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#11112A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f120',
  },
  emojiOptionText: {
    fontSize: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#2A2B4A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#B8BBD6',
    fontWeight: '700',
    fontSize: 15,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
