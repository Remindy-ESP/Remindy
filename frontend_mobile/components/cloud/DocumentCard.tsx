import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DocumentResponse } from '@/services/api/document.service';
import { useTranslation } from '@/context/I18nContext';
import { formatShortDate } from '@/utils/format';

interface DocumentCardProps {
  readonly document: DocumentResponse;
  readonly onPress: () => void;
  readonly onMenuPress: () => void;
}

export default function DocumentCard({ document, onPress, onMenuPress }: DocumentCardProps) {
  const { language } = useTranslation();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getStatusColor = () => {
    switch (document.ocr_status) {
      case 'completed':
        return '#32c80e';
      case 'processing':
        return '#F39C12';
      case 'failed':
        return '#E74C3C';
      default:
        return '#9ca3af';
    }
  };

  const getFileIcon = () => {
    if (document.mime_type === 'application/pdf') return 'document-text';
    if (document.mime_type.startsWith('image/')) return 'image';
    return 'document';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons name={getFileIcon()} size={24} color="#6366f1" />
      </View>
      <View style={styles.content}>
        <Text style={styles.filename} numberOfLines={1}>
          {document.filename}
        </Text>
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>{formatFileSize(document.file_size)}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.metadataText}>{formatShortDate(document.uploaded_at, language)}</Text>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        </View>
      </View>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F39',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#373848',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#06071D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  filename: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  separator: {
    color: '#9ca3af',
    fontSize: 12,
    marginHorizontal: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  menuButton: {
    padding: 4,
  },
});
