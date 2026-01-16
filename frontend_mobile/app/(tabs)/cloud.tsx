import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDocuments } from '@/hooks/useDocuments';
import { useFolders } from '@/hooks/useFolders';
import { useStorageQuota } from '@/hooks/useStorageQuota';
import StorageQuotaWidget from '@/components/cloud/StorageQuotaWidget';
import FolderNavigationBar from '@/components/cloud/FolderNavigationBar';
import DocumentList from '@/components/cloud/DocumentList';
import DocumentActionsMenu from '@/components/cloud/DocumentActionsMenu';
import CreateFolderModal from '@/components/cloud/modals/CreateFolderModal';
import RenameFolderModal from '@/components/cloud/modals/RenameFolderModal';
import RenameDocumentModal from '@/components/cloud/modals/RenameDocumentModal';
import DeleteConfirmationModal from '@/components/cloud/modals/DeleteConfirmationModal';
import MoveToFolderModal from '@/components/cloud/modals/MoveToFolderModal';
import DocumentDetailsModal from '@/components/cloud/modals/DocumentDetailsModal';
import LinkToSubscriptionModal from '@/components/cloud/modals/LinkToSubscriptionModal';
import PDFViewerModal from '@/components/cloud/modals/PDFViewerModal';
import { subscriptionService, documentService, apiClient } from '@/services/api';
import type { Folder, Subscription } from '@/services/api';
import type { DocumentResponse } from '@/services/api/document.service';

export default function CloudScreen() {
  const { documents, loading: docsLoading, fetchDocuments, uploadDocument, updateDocument, deleteDocument } = useDocuments();
  const { folders, loading: foldersLoading, fetchFolders, createFolder, updateFolder, deleteFolder, moveDocumentToFolder } = useFolders();
  const { quota, fetchQuota } = useStorageQuota();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const [showDocActions, setShowDocActions] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [showRenameDoc, setShowRenameDoc] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveDoc, setShowMoveDoc] = useState(false);
  const [showDocDetails, setShowDocDetails] = useState(false);
  const [showLinkToSub, setShowLinkToSub] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfViewerUri, setPdfViewerUri] = useState<string>('');
  const [pdfViewerToken, setPdfViewerToken] = useState<string>('');

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'document' | 'folder'; item: any } | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      initializeDefaultFolders();
    }, [currentFolderId])
  );

  const loadData = async () => {
    await Promise.all([
      fetchDocuments(),
      fetchFolders(),
      fetchQuota(),
      fetchSubscriptions(),
    ]);
  };

  const fetchSubscriptions = async () => {
    try {
      const data = await subscriptionService.getAll();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const initializeDefaultFolders = async () => {
    try {
      const hasInitialized = await AsyncStorage.getItem('folders_initialized');
      if (!hasInitialized) {
        const locale = Localization.getLocales()[0];
        const isFrench = locale?.languageCode === 'fr';

        const rootFolderName = isFrench ? 'Abonnements' : 'Subscriptions';
        const subFolderName = isFrench ? 'Documents' : 'Documents';

        const rootFolder = await createFolder({ name: rootFolderName, color: '#6366f1' });
        if (rootFolder) {
          await createFolder({ name: subFolderName, color: '#F39C12', parentId: rootFolder.id });
        }
        await AsyncStorage.setItem('folders_initialized', 'true');
      }
    } catch (error) {
      console.error('Error initializing default folders:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpload = async () => {
    try {
      if (quota && quota.availableBytes <= 0) {
        Alert.alert('Quota dépassé', 'Vous avez atteint la limite de stockage. Supprimez des documents pour en ajouter de nouveaux.');
        return;
      }

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

      if (quota && file.size && file.size > quota.availableBytes) {
        Alert.alert('Espace insuffisant', 'Il n\'y a pas assez d\'espace de stockage pour ce fichier.');
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
        folderId: currentFolderId || undefined,
      });
      await Promise.all([fetchDocuments(), fetchQuota()]);
      Alert.alert('Succès', 'Document ajouté avec succès');
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Impossible d'ajouter le document";
      Alert.alert('Erreur', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleNavigateToFolder = (folderId: string | null) => {
    // Verify folder still exists if navigating to a specific folder
    if (folderId) {
      const folderExists = folders.find((f) => f.id === folderId);
      if (!folderExists) {
        Alert.alert(
          'Dossier introuvable',
          'Ce dossier a été supprimé ou n\'existe plus.',
          [{ text: 'OK', onPress: () => {
            setCurrentFolderId(null);
            setFolderPath([]);
          }}]
        );
        return;
      }
    }

    setCurrentFolderId(folderId);
    if (folderId === null) {
      setFolderPath([]);
    } else {
      const folderIndex = folderPath.findIndex((f) => f.id === folderId);
      if (folderIndex >= 0) {
        setFolderPath(folderPath.slice(0, folderIndex + 1));
      } else {
        const folder = folders.find((f) => f.id === folderId);
        if (folder) {
          const buildPath = (fId: string, accumulated: Folder[] = []): Folder[] => {
            const f = folders.find((fo) => fo.id === fId);
            if (!f) {
              console.warn(`Folder ${fId} not found in path, stopping path build`);
              return accumulated;
            }
            if (f.parentId) {
              return buildPath(f.parentId, [f, ...accumulated]);
            }
            return [f, ...accumulated];
          };
          setFolderPath(buildPath(folderId));
        }
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
    setShowDocActions(true);
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
      await updateDocument(selectedDocument.id, { filename: name });
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

  const handleLinkToSubscription = async (subscriptionId: string | null) => {
    if (selectedDocument) {
      if (subscriptionId) {
        const linkedDocs = documents.filter((d) => d.subscription_id === subscriptionId);
        if (linkedDocs.length >= 5) {
          Alert.alert('Limite atteinte', 'Maximum 5 documents par transaction.');
          return;
        }
      }
      await updateDocument(selectedDocument.id, { subscription_id: subscriptionId });
      await fetchDocuments();
    }
  };

  const handleViewDocument = async (document: DocumentResponse) => {
    try {
      const token = await apiClient.getAccessToken();
      if (!token) {
        Alert.alert('Erreur', 'Non authentifié');
        return;
      }

      const downloadUrl = documentService.getDownloadUrl(document.id);
      console.log('[CloudScreen] Opening PDF viewer with URL:', downloadUrl);
      console.log('[CloudScreen] Document ID:', document.id);

      // Pass the authenticated download URL and token to the PDF viewer
      setPdfViewerUri(downloadUrl);
      setPdfViewerToken(token);
      setShowPdfViewer(true);
      setShowDocActions(false);
    } catch (error: any) {
      console.error('View document error:', error);
      const errorMessage = error?.message || 'Impossible de visualiser le document';
      Alert.alert('Erreur', errorMessage);
    }
  };

  const handleDownloadDocument = async (document: DocumentResponse) => {
    try {
      console.log('[CloudScreen] Starting download for:', document.filename);
      setDownloading(true);
      const token = await apiClient.getAccessToken();
      if (!token) {
        Alert.alert('Erreur', 'Non authentifié');
        setDownloading(false);
        return;
      }

      const downloadUrl = documentService.getDownloadUrl(document.id);
      // Use a unique filename to avoid conflicts
      const timestamp = Date.now();
      const fileUri = `${FileSystem.cacheDirectory}download_${timestamp}_${document.filename}`;

      console.log('[CloudScreen] Downloading from:', downloadUrl);
      console.log('[CloudScreen] Saving to:', fileUri);

      // Add timeout to prevent hanging
      const downloadPromise = FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Download timeout après 60 secondes')), 60000);
      });

      const downloadResult = await Promise.race([downloadPromise, timeoutPromise]) as FileSystem.FileSystemDownloadResult;

      console.log('[CloudScreen] Download result status:', downloadResult.status);

      if (downloadResult.status === 200) {
        console.log('[CloudScreen] Download successful, checking if sharing is available');
        // Share the file so user can save it to their device
        const canShare = await Sharing.isAvailableAsync();
        console.log('[CloudScreen] Sharing available:', canShare);

        if (canShare) {
          console.log('[CloudScreen] Opening share dialog');
          // Stop the spinner before opening share dialog
          setDownloading(false);
          setShowDocActions(false);

          // Small delay to ensure UI updates before showing dialog
          setTimeout(async () => {
            try {
              console.log('[CloudScreen] Calling Sharing.shareAsync with URI:', downloadResult.uri);
              const result = await Sharing.shareAsync(downloadResult.uri, {
                mimeType: document.mime_type,
                dialogTitle: 'Enregistrer le document',
                UTI: document.mime_type === 'application/pdf' ? 'com.adobe.pdf' : undefined,
              });
              console.log('[CloudScreen] Share result:', JSON.stringify(result));

              // Show success message after sharing
              Alert.alert(
                'Téléchargement réussi',
                `${document.filename} a été téléchargé.`
              );
            } catch (shareError: any) {
              console.error('[CloudScreen] Share error:', shareError);
              Alert.alert(
                'Document téléchargé',
                `${document.filename} a été téléchargé dans le cache de l'application. Vous pouvez le visualiser en appuyant sur "Visualiser".`
              );
            }
          }, 100);
        } else {
          Alert.alert('Erreur', 'Le téléchargement n\'est pas disponible sur cet appareil');
        }
      } else {
        console.error('[CloudScreen] Download failed with status:', downloadResult.status);
        Alert.alert('Erreur', 'Impossible de télécharger le document');
      }
    } catch (error: any) {
      console.error('[CloudScreen] Download document error:', error);
      const errorMessage = error?.message || 'Impossible de télécharger le document';
      Alert.alert('Erreur', errorMessage);
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'document') {
      await deleteDocument(deleteTarget.item.id);
      await fetchQuota();
    } else {
      const folderId = deleteTarget.item.id;

      // If we're currently inside the folder being deleted, navigate to its parent
      if (currentFolderId === folderId) {
        const deletedFolder = folders.find(f => f.id === folderId);
        setCurrentFolderId(deletedFolder?.parentId || null);

        // Update folder path
        if (deletedFolder?.parentId) {
          const parentIndex = folderPath.findIndex(f => f.id === deletedFolder.parentId);
          if (parentIndex >= 0) {
            setFolderPath(folderPath.slice(0, parentIndex + 1));
          } else {
            setFolderPath([]);
          }
        } else {
          setFolderPath([]);
        }
      }

      await deleteFolder(folderId);
    }

    setDeleteTarget(null);
    setShowDeleteConfirm(false);
  };

  const currentFolders = folders.filter((f) => f.parentId === currentFolderId);
  const currentDocuments = documents.filter((doc) => {
    if (currentFolderId === null) {
      return !doc.folder_id;
    }
    return doc.folder_id === currentFolderId;
  });

  const loading = docsLoading || foldersLoading;

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Mes Documents</Text>
        <Text style={styles.pageSubtitle}>Gérez votre stockage cloud</Text>
      </View>

      <View style={styles.quotaContainer}>
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
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.createFolderButton} onPress={() => setShowCreateFolder(true)} activeOpacity={0.8}>
          <Ionicons name="folder-outline" size={20} color="#6366f1" />
          <Text style={styles.createFolderText}>Nouveau dossier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} activeOpacity={0.8}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.uploadText}>Ajouter un document</Text>
        </TouchableOpacity>
      </View>

      <DocumentActionsMenu
        visible={showDocActions}
        onClose={() => setShowDocActions(false)}
        onView={() => {
          if (selectedDocument) {
            handleViewDocument(selectedDocument);
          }
        }}
        onDownload={() => {
          if (selectedDocument) {
            handleDownloadDocument(selectedDocument);
          }
        }}
        onInfo={() => setShowDocDetails(true)}
        onRename={() => setShowRenameDoc(true)}
        onMove={() => setShowMoveDoc(true)}
        onLink={() => setShowLinkToSub(true)}
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
          ? (deleteTarget.item.subscription_id
              ? (() => {
                  const linkedSub = subscriptions.find(s => s.id === deleteTarget.item.subscription_id);
                  const subName = linkedSub ? `"${linkedSub.name}"` : 'un abonnement';
                  return `Ce document est lié à ${subName}. Êtes-vous sûr de vouloir le supprimer ? Le document restera accessible depuis l'abonnement.`;
                })()
              : 'Êtes-vous sûr de vouloir supprimer ce document ?')
          : 'Êtes-vous sûr de vouloir supprimer ce dossier ? Son contenu sera déplacé vers le dossier parent.'}
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

      <LinkToSubscriptionModal
        visible={showLinkToSub}
        subscriptions={subscriptions}
        currentSubscriptionId={selectedDocument?.subscription_id}
        onClose={() => setShowLinkToSub(false)}
        onSubmit={handleLinkToSubscription}
      />

      <PDFViewerModal
        visible={showPdfViewer}
        pdfUri={pdfViewerUri}
        fileName={selectedDocument?.filename || 'Document'}
        authToken={pdfViewerToken}
        onClose={() => {
          setShowPdfViewer(false);
          setPdfViewerUri('');
          setPdfViewerToken('');
        }}
      />

      {uploading && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.uploadingText}>Ajout du document...</Text>
          </View>
        </View>
      )}

      {downloading && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.uploadingText}>Chargement...</Text>
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
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#06071D',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  quotaContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  createFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F1F39',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  createFolderText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
  },
  uploadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
