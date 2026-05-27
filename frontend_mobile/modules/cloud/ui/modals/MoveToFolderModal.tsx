import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BaseSelectionModal from './BaseSelectionModal';
import type { Folder } from '@/services/api';
import { useTranslation } from '@/shared/application/I18nContext';

interface MoveToFolderModalProps {
  readonly visible: boolean;
  readonly folders: Folder[];
  readonly currentFolderId?: string;
  readonly onClose: () => void;
  readonly onSubmit: (folderId: string | null) => Promise<void>;
}

export default function MoveToFolderModal({ visible, folders, currentFolderId, onClose, onSubmit }: MoveToFolderModalProps) {
  const { t } = useTranslation();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const handleSubmit = async () => {
    await onSubmit(selectedFolderId);
    setSelectedFolderId(null);
  };

  const handleClose = () => {
    setSelectedFolderId(null);
    onClose();
  };

  const availableFolders = folders.filter((f) => f.id !== currentFolderId);

  return (
    <BaseSelectionModal
      visible={visible}
      title={t('cloud.modals.moveToFolder.title')}
      submitText={t('cloud.modals.moveToFolder.submit')}
      onClose={handleClose}
      onSubmit={handleSubmit}
    >
      <TouchableOpacity
        style={[styles.folderItem, selectedFolderId === null && styles.selectedFolder]}
        onPress={() => setSelectedFolderId(null)}
        activeOpacity={0.7}
      >
        <Ionicons name="home" size={20} color="#6366f1" />
        <Text style={styles.folderName}>{t('cloud.modals.moveToFolder.root')}</Text>
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
    </BaseSelectionModal>
  );
}

const styles = StyleSheet.create({
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFolder: {
    backgroundColor: '#EEF2FF',
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
});
