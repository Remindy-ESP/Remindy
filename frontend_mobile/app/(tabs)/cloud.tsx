import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useDocuments } from '@/hooks/useDocuments';
import { useFolders } from '@/hooks/useFolders';
import { useStorageQuota } from '@/hooks/useStorageQuota';
import StorageQuotaWidget from '@/components/cloud/StorageQuotaWidget';
import FolderNavigationBar from '@/components/cloud/FolderNavigationBar';
import DocumentList from '@/components/cloud/DocumentList';
import UploadDocumentButton from '@/components/cloud/UploadDocumentButton';
import DocumentActionsMenu from '@/components/cloud/DocumentActionsMenu';
import CreateFolderModal from '@/components/cloud/modals/CreateFolderModal';
import RenameFolderModal from '@/components/cloud/modals/RenameFolderModal';
import RenameDocumentModal from '@/components/cloud/modals/RenameDocumentModal';
import DeleteConfirmationModal from '@/components/cloud/modals/DeleteConfirmationModal';
import MoveToFolderModal from '@/components/cloud/modals/MoveToFolderModal';
import DocumentDetailsModal from '@/components/cloud/modals/DocumentDetailsModal';
import type { Folder } from '@/services/api';
import type { DocumentResponse } from '@/services/api/document.service';

export default function CloudScreen() {
  const { documents, loading: docsLoading, fetchDocuments, uploadDocument, deleteDocument } = useDocuments();
  const { folders, loading: foldersLoading, fetchFolders, createFolder, updateFolder, deleteFolder, moveDocumentToFolder } = useFolders();
  const { quota, fetchQuota } = useStorageQuota();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const [showDocActions, setShowDocActions] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [showRenameDoc, setShowRenameDoc] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveDoc, setShowMoveDoc] = useState(false);
  const [showDocDetails, setShowDocDetails] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'document' | 'folder'; item: any } | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [currentFolderId])
  );

  const loadData = async () => {
    await Promise.all([
      fetchDocuments(),
      fetchFolders(),
      fetchQuota(),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const maxSize = 10 * 1024 * 1024;

      if (file.size && file.size > maxSize) {
        Alert.alert('Fichier trop volumineux', 'Le fichier ne peut pas dépasser 10 MB.');
        return;
      }

      setUploading(true);
      await uploadDocument({
        file: {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
          size: file.size,
        },
      });
      await fetchQuota();
      Alert.alert('Succès', 'Document ajouté avec succès');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Erreur', "Impossible d'ajouter le document");
    } finally {
      setUploading(false);
    }
  };

  const handleNavigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    if (folderId === null) {
      setFolderPath([]);
    } else {
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        const newPath = [...folderPath, folder];
        setFolderPath(newPath);
      }
    }
  };

  const handleFolderPress = (folder: Folder) => {
    handleNavigateToFolder(folder.id);
  };

  const handleFolderMenuPress = (folder: Folder) => {
    setSelectedFolder(folder);
    Alert.alert(
      folder.name,
      'Que souhaitez-vous faire ?',
      [
        { text: 'Renommer', onPress: () => setShowRenameFolder(true) },
        { text: 'Supprimer', onPress: () => {
          setDeleteTarget({ type: 'folder', item: folder });
          setShowDeleteConfirm(true);
        }, style: 'destructive' },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleDocumentPress = (document: DocumentResponse) => {
    setSelectedDocument(document);
    setShowDocDetails(true);
  };

  const handleDocumentMenuPress = (document: DocumentResponse) => {
    setSelectedDocument(document);
    setShowDocActions(true);
  };

  const handleCreateFolder = async (name: string, color?: string) => {
    await createFolder({ name, color, parentId: currentFolderId || undefined });
  };

  const handleRenameFolder = async (name: string) => {
    if (selectedFolder) {
      await updateFolder(selectedFolder.id, { name });
    }
  };

  const handleRenameDocument = async (name: string) => {
    if (selectedDocument) {
      await fetchDocuments();
    }
  };

  const handleMoveDocument = async (folderId: string | null) => {
    if (selectedDocument) {
      if (folderId) {
        await moveDocumentToFolder(folderId, selectedDocument.id);
      }
      await fetchDocuments();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'document') {
      await deleteDocument(deleteTarget.item.id);
      await fetchQuota();
    } else {
      await deleteFolder(deleteTarget.item.id);
    }
    setDeleteTarget(null);
  };

  const currentFolders = folders.filter((f) => f.parentId === currentFolderId);
  const currentDocuments = documents;

  const loading = docsLoading || foldersLoading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <StorageQuotaWidget quota={quota} />
      </View>
      <FolderNavigationBar
        currentFolder={currentFolderId ? folders.find((f) => f.id === currentFolderId) || null : null}
        folderPath={folderPath}
        onNavigate={handleNavigateToFolder}
      />
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <DocumentList
          folders={currentFolders}
          documents={currentDocuments}
          onFolderPress={handleFolderPress}
          onFolderMenuPress={handleFolderMenuPress}
          onDocumentPress={handleDocumentPress}
          onDocumentMenuPress={handleDocumentMenuPress}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
      <UploadDocumentButton onPress={handleUpload} />

      <DocumentActionsMenu
        visible={showDocActions}
        onClose={() => setShowDocActions(false)}
        onRename={() => setShowRenameDoc(true)}
        onMove={() => setShowMoveDoc(true)}
        onDelete={() => {
          if (selectedDocument) {
            setDeleteTarget({ type: 'document', item: selectedDocument });
            setShowDeleteConfirm(true);
          }
        }}
      />

      <CreateFolderModal
        visible={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onSubmit={handleCreateFolder}
      />

      <RenameFolderModal
        visible={showRenameFolder}
        currentName={selectedFolder?.name || ''}
        onClose={() => setShowRenameFolder(false)}
        onSubmit={handleRenameFolder}
      />

      <RenameDocumentModal
        visible={showRenameDoc}
        currentName={selectedDocument?.filename || ''}
        onClose={() => setShowRenameDoc(false)}
        onSubmit={handleRenameDocument}
      />

      <DeleteConfirmationModal
        visible={showDeleteConfirm}
        title={deleteTarget?.type === 'document' ? 'Supprimer le document' : 'Supprimer le dossier'}
        message={deleteTarget?.type === 'document'
          ? 'Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.'
          : 'Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.'}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />

      <MoveToFolderModal
        visible={showMoveDoc}
        folders={folders}
        currentFolderId={selectedDocument?.id}
        onClose={() => setShowMoveDoc(false)}
        onSubmit={handleMoveDocument}
      />

      <DocumentDetailsModal
        visible={showDocDetails}
        document={selectedDocument}
        onClose={() => setShowDocDetails(false)}
      />

      {uploading && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06071D',
  },
  header: {
    backgroundColor: '#06071D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadContainer: {
    backgroundColor: '#1F1F39',
    borderRadius: 12,
    padding: 32,
  },
});
