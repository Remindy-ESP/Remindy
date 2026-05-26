import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import type { Folder } from '@/services/api';
import type { DocumentResponse } from '@/services/api/document.service';
import FolderCard from './FolderCard';
import DocumentCard from './DocumentCard';
import { useTranslation } from '@/context/I18nContext';

interface DocumentListProps {
  readonly folders: Folder[];
  readonly documents: DocumentResponse[];
  readonly onFolderPress: (folder: Folder) => void;
  readonly onFolderMenuPress: (folder: Folder) => void;
  readonly onDocumentPress: (document: DocumentResponse) => void;
  readonly onDocumentMenuPress: (document: DocumentResponse) => void;
  readonly refreshing?: boolean;
  readonly onRefresh?: () => void;
}

export default function DocumentList({
  folders,
  documents,
  onFolderPress,
  onFolderMenuPress,
  onDocumentPress,
  onDocumentMenuPress,
  refreshing = false,
  onRefresh,
}: DocumentListProps) {
  const { t } = useTranslation();
  const hasFolders = folders.length > 0;
  const hasDocuments = documents.length > 0;
  const isEmpty = !hasFolders && !hasDocuments;

  if (isEmpty) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" /> : undefined}
      >
        <Text style={styles.emptyText}>{t('cloud.list.empty')}</Text>
        <Text style={styles.emptySubtext}>{t('cloud.list.emptySubtext')}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" /> : undefined}
    >
      {hasFolders && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('cloud.list.sectionFolders')}</Text>
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onPress={() => onFolderPress(folder)}
              onMenuPress={() => onFolderMenuPress(folder)}
            />
          ))}
        </View>
      )}
      {hasDocuments && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('cloud.list.sectionDocuments')}</Text>
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onPress={() => onDocumentPress(document)}
              onMenuPress={() => onDocumentMenuPress(document)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
});
