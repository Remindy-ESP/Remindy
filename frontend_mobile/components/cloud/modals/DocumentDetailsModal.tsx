import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DocumentResponse } from '@/services/api/document.service';
import { useTranslation } from '@/context/I18nContext';
import { formatDate } from '@/utils/format';

interface DocumentDetailsModalProps {
  readonly visible: boolean;
  readonly document: DocumentResponse | null;
  readonly onClose: () => void;
  readonly onRetryOcr?: () => void;
}

export default function DocumentDetailsModal({ visible, document, onClose, onRetryOcr }: DocumentDetailsModalProps) {
  const { t, language } = useTranslation();

  if (!document) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatUploadDate = (dateString: string): string => {
    return formatDate(dateString, language, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = () => {
    switch (document.ocr_status) {
      case 'completed':
        return { color: '#32c80e', label: t('cloud.modals.documentDetails.status.completed'), icon: 'checkmark-circle' };
      case 'processing':
        return { color: '#F39C12', label: t('cloud.modals.documentDetails.status.processing'), icon: 'sync' };
      case 'failed':
        return { color: '#E74C3C', label: t('cloud.modals.documentDetails.status.failed'), icon: 'close-circle' };
      default:
        return { color: '#9ca3af', label: t('cloud.modals.documentDetails.status.pending'), icon: 'time' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('cloud.modals.documentDetails.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>{t('cloud.modals.documentDetails.filename')}</Text>
              <Text style={styles.value}>{document.filename}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>{t('cloud.modals.documentDetails.size')}</Text>
              <Text style={styles.value}>{formatFileSize(document.file_size)}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>{t('cloud.modals.documentDetails.type')}</Text>
              <Text style={styles.value}>{document.mime_type}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>{t('cloud.modals.documentDetails.uploadedAt')}</Text>
              <Text style={styles.value}>{formatUploadDate(document.uploaded_at)}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>{t('cloud.modals.documentDetails.ocrStatus')}</Text>
              <View style={styles.statusContainer}>
                <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
              </View>
              {document.ocr_status === 'failed' && onRetryOcr && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetryOcr} activeOpacity={0.7}>
                  <Ionicons name="refresh" size={16} color="#6366f1" />
                  <Text style={styles.retryText}>{t('cloud.modals.documentDetails.retry')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {document.ocr_text && (
              <View style={styles.section}>
                <Text style={styles.label}>{t('cloud.modals.documentDetails.ocrText')}</Text>
                <Text style={styles.ocrText}>{document.ocr_text}</Text>
              </View>
            )}
            {Boolean(document.parsed_provider) && (
              <View style={styles.section}>
                <Text style={styles.label}>{t('cloud.modals.documentDetails.parsedData')}</Text>
                {Boolean(document.parsed_provider) && <Text style={styles.parsedItem}>{t('cloud.modals.documentDetails.providerLabel')} {document.parsed_provider}</Text>}
                {Boolean(document.parsed_amount) && <Text style={styles.parsedItem}>{t('cloud.modals.documentDetails.amountLabel')} {document.parsed_amount} {document.parsed_currency}</Text>}
                {Boolean(document.parsed_date) && <Text style={styles.parsedItem}>{t('cloud.modals.documentDetails.dateLabel')} {document.parsed_date}</Text>}
                {Boolean(document.parsed_frequency) && <Text style={styles.parsedItem}>{t('cloud.modals.documentDetails.frequencyLabel')} {document.parsed_frequency}</Text>}
              </View>
            )}
          </ScrollView>
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
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 500,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#000',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  ocrText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  parsedItem: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
});
