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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { categoryService } from '@/services/api/category.service';
import type { Category } from '@/services/api';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [creating, setCreating] = useState(false);

  // Rename modal
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renamingCategory, setRenamingCategory] = useState<Category | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);

  const PRESET_COLORS = [
    '#6366f1', '#4ade80', '#f59e0b', '#ef4444', '#3b82f6',
    '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#64748b',
  ];

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Impossible de charger les catégories.');
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
    setCreateModalVisible(true);
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Le nom de la catégorie est requis.' });
      return;
    }
    try {
      setCreating(true);
      await categoryService.create({ name: newName.trim(), icon: '', color: newColor });
      setCreateModalVisible(false);
      await fetchCategories();
      Toast.show({ type: 'success', text1: 'Catégorie créée', text2: `"${newName.trim()}" a été ajoutée.` });
    } catch (err) {
      console.error('Error creating category:', err);
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de créer la catégorie.' });
    } finally {
      setCreating(false);
    }
  };

  const openRenameModal = (cat: Category) => {
    setRenamingCategory(cat);
    setRenameValue(cat.name);
    setRenameModalVisible(true);
  };

  const handleRename = async () => {
    if (!renameValue.trim() || !renamingCategory) return;
    try {
      setRenaming(true);
      await categoryService.update(renamingCategory.id, { name: renameValue.trim() });
      setRenameModalVisible(false);
      await fetchCategories();
      Toast.show({ type: 'success', text1: 'Catégorie renommée', text2: `Renommée en "${renameValue.trim()}".` });
    } catch (err) {
      console.error('Error renaming category:', err);
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de renommer la catégorie.' });
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = (cat: Category) => {
    Alert.alert(
      'Supprimer la catégorie',
      `Supprimer "${cat.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoryService.delete(cat.id);
              await fetchCategories();
              Toast.show({ type: 'success', text1: 'Catégorie supprimée', text2: `"${cat.name}" a été supprimée.` });
            } catch {
              Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de supprimer la catégorie.' });
            }
          },
        },
      ]
    );
  };

  const systemCategories = categories.filter((c) => c.isSystem);
  const userCategories = categories.filter((c) => !c.isSystem);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement des catégories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchCategories}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* System categories */}
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#8E93B7" />
          <Text style={styles.sectionTitle}>Catégories système</Text>
        </View>

        {systemCategories.length === 0 ? (
          <Text style={styles.emptyText}>Aucune catégorie système.</Text>
        ) : (
          systemCategories.map((cat) => (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={[styles.colorDot, { backgroundColor: cat.color || '#6366f1' }]} />
              <Text style={styles.categoryName}>{cat.name}</Text>
              <View style={[styles.systemBadge]}>
                <Text style={styles.systemBadgeText}>SYSTÈME</Text>
              </View>
            </View>
          ))
        )}

        {/* User categories */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Ionicons name="folder-outline" size={16} color="#8E93B7" />
          <Text style={styles.sectionTitle}>Mes catégories</Text>
        </View>

        {userCategories.length === 0 ? (
          <Text style={styles.emptyText}>Aucune catégorie personnalisée.</Text>
        ) : (
          userCategories.map((cat) => (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={[styles.colorDot, { backgroundColor: cat.color || '#6366f1' }]} />
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
          <Text style={styles.addBtnText}>Nouvelle catégorie</Text>
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
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nouvelle catégorie</Text>

            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={styles.textInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Ex: Santé, Loisirs..."
              placeholderTextColor="#666"
              autoFocus
            />

            <Text style={styles.inputLabel}>Couleur</Text>
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
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Renommer "{renamingCategory?.name}"</Text>
            <Text style={styles.inputLabel}>Nouveau nom</Text>
            <TextInput
              style={styles.textInput}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholderTextColor="#666"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleRename}
                disabled={renaming}
              >
                {renaming ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Renommer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  sectionHint: {
    color: '#555B7B',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 2,
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
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
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
    alignItems: 'center',
    padding: 24,
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
