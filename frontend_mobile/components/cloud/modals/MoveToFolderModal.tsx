import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Folder } from '@/services/api';

interface MoveToFolderModalProps {
  readonly visible: boolean;
  readonly folders: Folder[];
  readonly currentFolderId?: string;
  readonly onClose: () => void;
  readonly onSubmit: (folderId: string | null) => Promise<void>;
}

export default function MoveToFolderModal({ visible, folders, currentFolderId, onClose, onSubmit }: MoveToFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSubmit(selectedFolderId);
      setSelectedFolderId(null);
      onClose();
    } catch (error) {
      console.error('Error moving document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFolderId(null);
    onClose();
  };

  const availableFolders = folders.filter((f) => f.id !== currentFolderId);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Déplacer vers</Text>
          <ScrollView style={styles.list}>
            <TouchableOpacity
              style={[styles.folderItem, selectedFolderId === null && styles.selectedFolder]}
              onPress={() => setSelectedFolderId(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="home" size={20} color="#6366f1" />
              <Text style={styles.folderName}>Racine</Text>
              {selectedFolderId === null && <Ionicons name="checkmark" size={20} color="#6366f1" />}
            </TouchableOpacity>
            {availableFolders.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                style={[styles.folderItem, selectedFolderId === folder.id && styles.selectedFolder]}
                onPress={() => setSelectedFolderId(folder.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="folder" size={20} color={folder.color || '#6366f1'} />
                <Text style={styles.folderName}>{folder.name}</Text>
                {selectedFolderId === folder.id && <Ionicons name="checkmark" size={20} color="#6366f1" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>Déplacer</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  list: {
    maxHeight: 300,
    marginBottom: 16,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedFolder: {
    backgroundColor: '#F3F4F6',
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: '#6366f1',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
